use brotli::Decompressor;
use flate2::bufread::ZlibDecoder;
use std::io::Read;

pub fn brotli_decode(data: Vec<u8>) -> Result<Vec<u8>, String> {
    let mut decompressed = Vec::new();
    let mut reader = Decompressor::new(&data[..], 4096);

    reader
        .read_to_end(&mut decompressed)
        .map_err(|e| e.to_string())?;

    Ok(decompressed)
}

pub fn zlib_decode(data: Vec<u8>) -> Result<Vec<u8>, String> {
    let mut decompressed = Vec::new();
    let mut decoder = ZlibDecoder::new(&data[..]);

    decoder
        .read_to_end(&mut decompressed)
        .map_err(|e| e.to_string())?;

    Ok(decompressed)
}
