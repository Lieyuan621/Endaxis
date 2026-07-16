const crcTable: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]!) & 0xff]!;
  }
  return crc ^ 0xffffffff;
}

function stringToUint8Array(str: string): Uint8Array {
  const arr: number[] = [];
  for (let i = 0; i < str.length; i++) arr.push(str.charCodeAt(i));
  return new Uint8Array(arr);
}

/** Read a 4-byte PNG chunk type tag starting at `offset`. */
function readChunkTag(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset]!,
    bytes[offset + 1]!,
    bytes[offset + 2]!,
    bytes[offset + 3]!,
  );
}

export async function addMetadataToPng(pngBlob: Blob, key: string, value: string): Promise<Blob> {
  const arrayBuffer = await pngBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const dataView = new DataView(arrayBuffer);

  let offset = 8;
  let iendOffset = -1;

  while (offset < uint8Array.length) {
    const length = dataView.getUint32(offset, false);
    const type = readChunkTag(uint8Array, offset + 4);

    if (type === 'IEND') {
      iendOffset = offset;
      break;
    }

    offset += 8 + length + 4;
  }

  if (iendOffset === -1) {
    throw new Error('Invalid PNG: IEND chunk not found');
  }

  const keyBytes = stringToUint8Array(key);
  const valueBytes = stringToUint8Array(value);

  const chunkType = stringToUint8Array('tEXt');
  const separator = new Uint8Array([0]);

  const data = new Uint8Array(keyBytes.length + 1 + valueBytes.length);
  data.set(keyBytes, 0);
  data.set(separator, keyBytes.length);
  data.set(valueBytes, keyBytes.length + 1);

  const length = data.length;

  const crcInput = new Uint8Array(chunkType.length + data.length);
  crcInput.set(chunkType, 0);
  crcInput.set(data, chunkType.length);
  const crcVal = crc32(crcInput);

  const newLength = uint8Array.length + 12 + length;
  const newBuffer = new Uint8Array(newLength);
  const newDataView = new DataView(newBuffer.buffer);

  newBuffer.set(uint8Array.slice(0, iendOffset), 0);

  let currentPos = iendOffset;
  newDataView.setUint32(currentPos, length, false);
  currentPos += 4;
  newBuffer.set(chunkType, currentPos);
  currentPos += 4;
  newBuffer.set(data, currentPos);
  currentPos += data.length;
  newDataView.setUint32(currentPos, crcVal, false);
  currentPos += 4;

  newBuffer.set(uint8Array.slice(iendOffset), currentPos);

  return new Blob([newBuffer], { type: 'image/png' });
}

export async function readMetadataFromPng(file: Blob, key: string): Promise<string | null> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const dataView = new DataView(arrayBuffer);

  let offset = 8;

  while (offset < uint8Array.length) {
    const length = dataView.getUint32(offset, false);
    const type = readChunkTag(uint8Array, offset + 4);

    if (type === 'tEXt') {
      const dataOffset = offset + 8;
      const dataEnd = dataOffset + length;

      let separatorIdx = -1;
      for (let i = dataOffset; i < dataEnd; i++) {
        if (uint8Array[i] === 0) {
          separatorIdx = i;
          break;
        }
      }

      if (separatorIdx !== -1) {
        const chunkKey = String.fromCharCode(...uint8Array.slice(dataOffset, separatorIdx));
        if (chunkKey === key) {
          const valueBytes = uint8Array.slice(separatorIdx + 1, dataEnd);
          return String.fromCharCode(...valueBytes);
        }
      }
    } else if (type === 'IEND') {
      break;
    }

    offset += 8 + length + 4;
  }

  return null;
}
