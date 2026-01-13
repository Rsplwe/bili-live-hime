import { useWsStore } from "@/store/ws"
import { brotliDecode } from "@/utils/brotli"
import { useConfigStore } from "@/store/config";
import { InteractWordV2 } from "@/protos/InteractWordV2";
import Pako from "pako"

let ws: WebSocket | null = null
let heartbeatTimer: number | null = null

const WS_URL = "wss://broadcastlv.chat.bilibili.com/sub"

const HEARTBEAT_INTERVAL = 30_000
const HEADER_SIZE = 16

let messageId = 0
let seqId = 0

const PROTOCOL_VERSION = {
    NORMAL: 0,
    AUTH_HEARTBEAT: 1,
    COMPRESSED_ZLIB: 2,
    COMPRESSED_BROTLI: 3,
} as const;

type PROTOCOL_VERSION_TYPE = typeof PROTOCOL_VERSION[keyof typeof PROTOCOL_VERSION]

const OPCODE = {
    HEADERBEAT: 2,
    HEADERBEAT_REPLY: 3,
    NORMAL: 5,
    AUTH: 7,
    AUTH_REPLAY: 8
} as const;

type OPCODE_TYPE = typeof OPCODE[keyof typeof OPCODE]

interface PacketHeader {
    totalSize: number;
    headerSize: number;
    protocolVersion: number;
    opcode: number;
    sequence: number;
}

function createHeader(
    bodySize: number,
    protocolVersion: number,
    opcode: number
): Uint8Array {
    const header = new Uint8Array(HEADER_SIZE);
    const view = new DataView(header.buffer);
    const totalSize = HEADER_SIZE + bodySize;

    view.setUint32(0, totalSize, false);
    view.setUint16(4, HEADER_SIZE, false);
    view.setUint16(6, protocolVersion, false);
    view.setUint32(8, opcode, false);
    view.setUint32(12, seqId++, false);

    return header;
}

function createPacket(
    body: string | Uint8Array,
    protocolVersion: PROTOCOL_VERSION_TYPE,
    opcode: OPCODE_TYPE
): Uint8Array {
    const bodyBuffer = typeof body === 'string'
        ? new TextEncoder().encode(body)
        : body;

    const header = createHeader(bodyBuffer.length, protocolVersion, opcode);

    const packet = new Uint8Array(header.length + bodyBuffer.length);
    packet.set(header, 0);
    packet.set(bodyBuffer, header.length);

    return packet;
}

function parseHeader(buffer: ArrayBuffer): PacketHeader {
    const view = new DataView(buffer)
    return {
        totalSize: view.getUint32(0, false),
        headerSize: view.getUint16(4, false),
        protocolVersion: view.getUint16(6, false),
        opcode: view.getUint32(8, false),
        sequence: view.getUint32(12, false),
    };
}

async function depackSubPacket(buffer: ArrayBuffer) {
    let offset = 0;

    while (offset < buffer.byteLength) {
        const subBuffer = buffer.slice(offset)
        const subHeader = parseHeader(subBuffer)
        const bodyStart = offset + subHeader.headerSize
        const bodyEnd = offset + subHeader.totalSize
        const subPacketPayload = buffer.slice(bodyStart, bodyEnd)
        parseMessage(subPacketPayload)
        offset += subHeader.totalSize
    }
}

function base64ToBytes(base64: string) {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0) || 0);
}


async function parseMessage(message: ArrayBuffer) {
    const decoder = new TextDecoder('utf-8')
    const pl = decoder.decode(message)
    const obj = JSON.parse(pl)
    console.log("parseMessage:" + pl)

    if (obj['cmd'] === "DANMU_MSG") {
        useWsStore.getState().addMessage({
            id: String(messageId++),
            username: obj['info'][0][15]['user']['base']['name'],
            message: obj['info'][1],
            timestamp: new Date(),
            type: "chat",
            avatar: obj['info'][0][15]['user']['base']['face']
        })
    } else if (obj['cmd'] === "WATCHED_CHANGE") {
        useWsStore.getState().setWatchedUser(obj['data']['num'])
    } else if (obj['cmd'] === "INTERACT_WORD_V2") {
        const pbObj = InteractWordV2.fromBinary(base64ToBytes(obj['data']['pb']))
        useWsStore.getState().addMessage({
            id: String(messageId++),
            username: pbObj.uname,
            message: "进入直播间",
            timestamp: new Date(),
            type: "enter"
        })
    } else if (obj['cmd'] === "SEND_GIFT") {
        useWsStore.getState().addMessage({
            id: String(messageId++),
            username: obj['data']['uname'],
            message: "",
            timestamp: new Date(),
            type: "gift",
            giftName: obj['data']['giftName'],
            giftCount: obj['data']['num'],
        })
    }
}

async function parsePacket(buffer: ArrayBuffer) {
    const header = parseHeader(buffer)
    const body = buffer.slice(header.headerSize, header.totalSize)

    if (header.opcode === OPCODE.NORMAL) {
        switch (header.protocolVersion) {
            case PROTOCOL_VERSION.COMPRESSED_ZLIB:
                {
                    await depackSubPacket(Pako.inflate(body).buffer)
                    break
                }
            case PROTOCOL_VERSION.COMPRESSED_BROTLI:
                {
                    const decoded = brotliDecode(new Int8Array(body))
                    await depackSubPacket(decoded.buffer as ArrayBuffer)
                    break
                }
            default:
                {
                    parseMessage(body)
                    break
                }
        }
    }
}

function sendAuth() {
    const configState = useConfigStore.getState().config
    const auth_payload = JSON.stringify({
        uid: configState.uid,
        roomid: configState.roomId,
        protover: 3,
        platform: "web",
        type: 2,
        key: configState.roomToken
    })
    console.log(auth_payload)
    const authPacket = createPacket(auth_payload, PROTOCOL_VERSION.AUTH_HEARTBEAT, OPCODE.AUTH);
    ws?.send(authPacket)
}

function startHeartbeat() {
    stopHeartbeat()

    heartbeatTimer = window.setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
            const headbeartPack = createPacket("Ciallo~", PROTOCOL_VERSION.AUTH_HEARTBEAT, OPCODE.HEADERBEAT)
            ws.send(headbeartPack)
        }
    }, HEARTBEAT_INTERVAL)

}

function stopHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = null
}

async function createWsAsync(): Promise<void> {
    if (ws) return

    await new Promise<void>((resolve, reject) => {
        const socket = new WebSocket(WS_URL)
        socket.binaryType = "arraybuffer"
        ws = socket

        const cleanup = () => {
            socket.onopen = null
            socket.onerror = null
        }

        socket.onopen = () => {
            cleanup()
            useWsStore.getState().setConnected(true)
            sendAuth()
            startHeartbeat()
            resolve()
        }

        socket.onerror = () => {
            cleanup()
            socket.close()
            ws = null
            reject(new Error("WebSocket connect failed"))
        }

        socket.onmessage = (e) => parsePacket(e.data)

        socket.onclose = () => {
            ws = null
            stopHeartbeat()
            console.log("连接关闭")
            useWsStore.getState().setConnected(false)
        }
    })
}

export async function startWs(): Promise<void> {
    useWsStore.getState().connect()
    await createWsAsync()
}

export async function stopWs(): Promise<void> {
    useWsStore.getState().disconnect()
    stopHeartbeat()
    ws?.close()
    ws = null
}