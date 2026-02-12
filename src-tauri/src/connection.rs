use std::time::Duration;

use bytes::{Buf, BufMut, BytesMut};
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::{net::TcpStream, time::interval};
use tokio_util::codec::{Decoder, Encoder, Framed};

use crate::utils::{brotli_decode, zlib_decode};

#[derive(Debug, Clone)]
struct ProtocolHeader {
    total_size: u32,
    header_size: u16,
    protocol_version: u16,
    opcode: u32,
    sequence: u32,
}

#[derive(Debug, Clone)]
pub struct Message {
    header: ProtocolHeader,
    payload: Vec<u8>,
}

pub struct Opcode;

#[allow(dead_code)]
impl Opcode {
    pub const HEADERBEAT: u32 = 2;
    pub const HEADERBEAT_REPLY: u32 = 3;
    pub const NORMAL: u32 = 5;
    pub const AUTH: u32 = 7;
    pub const AUTH_REPLAY: u32 = 8;
}

pub struct ProtocolVersion;

#[allow(dead_code)]
impl ProtocolVersion {
    pub const NORMAL: u16 = 0;
    pub const AUTH_HEARTBEAT: u16 = 1;
    pub const COMPRESSED_ZLIB: u16 = 2;
    pub const COMPRESSED_BROTLI: u16 = 3;
}

impl Message {
    fn new(opcode: u32, sequence: u32, payload: Vec<u8>) -> Self {
        let header_size = 16u16;
        let total_size = header_size as u32 + payload.len() as u32;

        Message {
            header: ProtocolHeader {
                total_size,
                header_size,
                protocol_version: 1,
                opcode,
                sequence,
            },
            payload,
        }
    }

    fn verification(sequence: u32, auth_data: Vec<u8>) -> Self {
        Self::new(Opcode::AUTH, sequence, auth_data)
    }

    fn heartbeat(sequence: u32) -> Self {
        Self::new(Opcode::HEADERBEAT, sequence, vec![])
    }
}

pub struct ProtocolCodec;

impl Decoder for ProtocolCodec {
    type Item = Message;
    type Error = std::io::Error;

    fn decode(&mut self, src: &mut BytesMut) -> Result<Option<Self::Item>, Self::Error> {
        if src.len() < 16 {
            return Ok(None);
        }

        let total_size = u32::from_be_bytes([src[0], src[1], src[2], src[3]]);
        let header_size = u16::from_be_bytes([src[4], src[5]]);
        let protocol_version = u16::from_be_bytes([src[6], src[7]]);
        let opcode = u32::from_be_bytes([src[8], src[9], src[10], src[11]]);
        let sequence = u32::from_be_bytes([src[12], src[13], src[14], src[15]]);

        if total_size > 10_000_000 {
            return Err(Self::Error::new(
                std::io::ErrorKind::InvalidData,
                "Message too large",
            ));
        }

        if src.len() < total_size as usize {
            src.reserve(total_size as usize - src.len());
            return Ok(None);
        }

        let header = ProtocolHeader {
            total_size,
            header_size,
            protocol_version,
            opcode,
            sequence,
        };

        src.advance(header_size as usize);
        let payload_size = total_size as usize - header_size as usize;
        let payload = src[..payload_size].to_vec();
        src.advance(payload_size);

        Ok(Some(Message { header, payload }))
    }
}

impl Encoder<Message> for ProtocolCodec {
    type Error = std::io::Error;

    fn encode(&mut self, item: Message, dst: &mut BytesMut) -> Result<(), Self::Error> {
        dst.put_u32(item.header.total_size);
        dst.put_u16(item.header.header_size);
        dst.put_u16(item.header.protocol_version);
        dst.put_u32(item.header.opcode);
        dst.put_u32(item.header.sequence);
        dst.extend_from_slice(&item.payload);

        Ok(())
    }
}

#[derive(Clone, Serialize)]
struct ErrorEvent {
    error: String,
}

#[derive(Clone, Serialize)]
struct ConnectionEvent {
    status: String,
}

#[derive(Clone, Serialize)]
struct MessageEvent {
    payload: String,
}

#[derive(Serialize, Deserialize)]
struct AuthPayload {
    uid: u64,
    roomid: u32,
    protover: u32,
    platform: String,
    r#type: u16,
    key: String,
}

pub struct SocketClient {
    app_handle: AppHandle,
}

impl SocketClient {
    pub fn new(value: AppHandle) -> SocketClient {
        SocketClient { app_handle: value }
    }

    fn parse_header(&self, view: &[u8]) -> Option<ProtocolHeader> {
        if view.len() < 16 {
            return None;
        }

        Some(ProtocolHeader {
            total_size: u32::from_be_bytes(view[0..4].try_into().ok()?),
            header_size: u16::from_be_bytes(view[4..6].try_into().ok()?),
            protocol_version: u16::from_be_bytes(view[6..8].try_into().ok()?),
            opcode: u32::from_be_bytes(view[8..12].try_into().ok()?),
            sequence: u32::from_be_bytes(view[12..16].try_into().ok()?),
        })
    }

    fn parse_message(&self, payload: &[u8]) {
        match String::from_utf8(payload.to_vec()) {
            Ok(result) => {
                let _ = self
                    .app_handle
                    .emit("message-received", MessageEvent { payload: result });
            }
            Err(_) => {
                eprintln!("Invalid message payload");
                return;
            }
        };
    }

    fn depack_sub_packet(&self, buffer: &[u8]) {
        let mut offset: usize = 0;
        while offset < buffer.len() {
            let sub_buffer = &buffer[offset..];
            let header = match self.parse_header(sub_buffer) {
                Some(v) => v,
                None => break,
            };
            let total_size = header.total_size as usize;
            let header_size = header.header_size as usize;

            if offset + total_size > buffer.len() || header_size > total_size {
                break;
            }

            let body_start = offset + header_size;
            let body_end = offset + total_size;

            if body_end > buffer.len() || body_start > body_end {
                eprintln!("Invalid sub packet size");
                break;
            }
            let payload = &buffer[body_start..body_end];
            self.parse_message(payload);
            offset += total_size;
        }
    }

    fn emit_error(&self, msg: impl Into<String>) {
        let _ = self
            .app_handle
            .emit("connection-error", ErrorEvent { error: msg.into() });
    }

    fn handle_incoming_message(&self, msg: Message) {
        if msg.header.opcode != Opcode::NORMAL {
            return;
        }

        match msg.header.protocol_version {
            ProtocolVersion::COMPRESSED_BROTLI => match brotli_decode(msg.payload) {
                Ok(decoded) => self.depack_sub_packet(&decoded),
                Err(e) => self.emit_error(format!("Brotli decompress error: {}", e)),
            },
            ProtocolVersion::COMPRESSED_ZLIB => match zlib_decode(msg.payload) {
                Ok(decoded) => self.depack_sub_packet(&decoded),
                Err(e) => self.emit_error(format!("Zlib decompress error: {}", e)),
            },
            _ => self.parse_message(&msg.payload),
        }
    }

    pub async fn connection(
        &self,
        host: String,
        port: u16,
        uid: u64,
        room: u32,
        auth_token: String,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let addr = format!("{}:{}", host, port);
        let stream = match TcpStream::connect(&addr).await {
            Ok(s) => s,
            Err(e) => {
                self.emit_error(format!("Connection failed: {}", e));
                return Err(e.into());
            }
        };

        let _ = self.app_handle.emit(
            "connection-success",
            ConnectionEvent {
                status: "connected".to_string(),
            },
        );

        let mut framed = Framed::new(stream, ProtocolCodec);

        let auth_obj = AuthPayload {
            uid: uid,
            roomid: room,
            protover: 3,
            platform: "web".to_owned(),
            r#type: 2,
            key: auth_token,
        };
        let auth_json = serde_json::to_string(&auth_obj)?;
        let verification = Message::verification(1, auth_json.into_bytes());
        if let Err(e) = framed.send(verification).await {
            self.emit_error(format!("Failed to send auth: {}", e));
            return Err(e.into());
        }

        let mut sequence = 2u32;
        let mut heartbeat_interval = interval(Duration::from_secs(30));
        heartbeat_interval.tick().await;

        loop {
            tokio::select! {
                Some(result) = framed.next() => {
                    match result {
                        Ok(msg) => {
                            self.handle_incoming_message(msg);
                        }
                        Err(e) => {
                            self.emit_error(format!("Receive error: {}", e));
                            break;
                        }
                    }
                }
                _ = heartbeat_interval.tick() => {
                    let heartbeat = Message::heartbeat(sequence);
                    sequence += 1;

                    if let Err(e) = framed.send(heartbeat).await {
                        self.emit_error(format!("Heartbeat error: {}", e));
                        break;
                    }
                }
            }
        }

        let _ = self.app_handle.emit(
            "connection-closed",
            ConnectionEvent {
                status: "disconnected".to_string(),
            },
        );

        Ok(())
    }
}
