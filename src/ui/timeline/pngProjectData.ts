/** 沿用旧版 PNG 的 EndaxisData 文本块；像素块通过 Blob 切片保留，不解码或整份复制大图。 */
const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const PROJECT_KEY = encoder.encode('EndaxisData\0');
const DATA_CODE = /^[A-Za-z0-9_-]+={0,2}$/;
const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) value = (value >>> 8) ^ crcTable[(value ^ byte) & 255]!;
  return (value ^ 0xffffffff) >>> 0;
}

interface PngChunk {
  readonly type: string;
  readonly offset: number;
  readonly length: number;
}

async function* chunks(image: Blob): AsyncGenerator<PngChunk> {
  const signature = new Uint8Array(await image.slice(0, 8).arrayBuffer());
  if (signature.length !== 8 || !PNG_SIGNATURE.every((value, index) => signature[index] === value))
    throw new Error('无效的 PNG 文件');
  let offset = 8;
  while (offset + 12 <= image.size) {
    const header = await image.slice(offset, offset + 8).arrayBuffer();
    const length = new DataView(header).getUint32(0);
    const type = decoder.decode(new Uint8Array(header, 4, 4));
    const end = offset + 12 + length;
    if (end > image.size) throw new Error('PNG 图片块不完整');
    if (offset === 8 && (type !== 'IHDR' || length !== 13)) throw new Error('无效的 PNG 图片头');
    if (type === 'IEND' && (length !== 0 || end !== image.size))
      throw new Error('无效的 PNG 结束块');
    yield { type, offset, length };
    if (type === 'IEND') return;
    offset = end;
  }
  throw new Error('PNG 缺少完整的结束块');
}

async function isProjectChunk(image: Blob, chunk: PngChunk): Promise<boolean> {
  if (chunk.type !== 'tEXt' || chunk.length < PROJECT_KEY.length) return false;
  const prefix = new Uint8Array(
    await image.slice(chunk.offset + 8, chunk.offset + 8 + PROJECT_KEY.length).arrayBuffer(),
  );
  return PROJECT_KEY.every((value, index) => prefix[index] === value);
}

export async function embedProjectCodeInPng(image: Blob, code: string): Promise<Blob> {
  if (!DATA_CODE.test(code)) throw new Error('无效的项目数据码');
  let endOffset = 0;
  for await (const chunk of chunks(image)) {
    if (await isProjectChunk(image, chunk)) throw new Error('PNG 已包含项目数据');
    if (chunk.type === 'IEND') endOffset = chunk.offset;
  }
  const data = encoder.encode(`EndaxisData\0${code}`);
  const textChunk = new Uint8Array(12 + data.length);
  const view = new DataView(textChunk.buffer);
  view.setUint32(0, data.length);
  textChunk.set(encoder.encode('tEXt'), 4);
  textChunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(textChunk.subarray(4, 8 + data.length)));
  return new Blob([image.slice(0, endOffset), textChunk, image.slice(endOffset)], {
    type: 'image/png',
  });
}

/** 只读取项目文本块；CRC 错误不能把损坏存档送进项目打开流程。 */
export async function readProjectCodeFromPng(image: Blob): Promise<string | null> {
  let code: string | null = null;
  for await (const chunk of chunks(image)) {
    if (!(await isProjectChunk(image, chunk))) continue;
    if (code !== null) throw new Error('PNG 包含重复的项目数据');
    const bytes = new Uint8Array(
      await image.slice(chunk.offset + 4, chunk.offset + 12 + chunk.length).arrayBuffer(),
    );
    const expected = new DataView(bytes.buffer).getUint32(bytes.length - 4);
    if (crc32(bytes.subarray(0, -4)) !== expected) throw new Error('PNG 项目数据校验失败');
    code = decoder.decode(bytes.subarray(4 + PROJECT_KEY.length, -4));
    if (!DATA_CODE.test(code)) throw new Error('无效的项目数据码');
  }
  return code;
}
