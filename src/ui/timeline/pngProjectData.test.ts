import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { embedProjectCodeInPng, readProjectCodeFromPng } from './pngProjectData';

async function makePng(alpha: boolean): Promise<Blob> {
  const bytes = await sharp({
    create: {
      width: 32,
      height: 24,
      channels: alpha ? 4 : 3,
      background: { r: 50, g: 60, b: 70, alpha: 0.5 },
    },
  })
    .png()
    .toBuffer();
  return new Blob([Uint8Array.from(bytes)], { type: 'image/png' });
}

describe('PNG project data', () => {
  it.each([false, true])(
    'round-trips project data and preserves pixels (alpha: %s)',
    async alpha => {
      const image = await makePng(alpha);
      const saved = await embedProjectCodeInPng(image, 'abc_123-XYZ');
      expect(saved.type).toBe('image/png');
      expect(await readProjectCodeFromPng(image)).toBeNull();
      expect(await readProjectCodeFromPng(saved)).toBe('abc_123-XYZ');
      const decoded = await sharp(Buffer.from(await saved.arrayBuffer()))
        .raw()
        .toBuffer({ resolveWithObject: true });
      const original = await sharp(Buffer.from(await image.arrayBuffer()))
        .raw()
        .toBuffer({ resolveWithObject: true });
      expect(decoded).toEqual(original);
      const bytes = new Uint8Array(await saved.arrayBuffer());
      expect(new TextDecoder().decode(bytes)).toContain('tEXtEndaxisData\0abc_123-XYZ');
      // 写入只在 IEND 前增加文本块，原图所有像素块与头部原样保留。
      expect(bytes.slice(0, image.size - 12)).toEqual(
        new Uint8Array(await image.slice(0, -12).arrayBuffer()),
      );
      await expect(embedProjectCodeInPng(saved, 'second')).rejects.toThrow('已包含项目数据');
    },
  );

  it('rejects invalid headers, truncated chunks and corrupt project metadata', async () => {
    const image = await makePng(false);
    const saved = await embedProjectCodeInPng(image, 'abc');
    const bytes = new Uint8Array(await saved.arrayBuffer());
    bytes[bytes.length - 17]! ^= 1;
    await expect(readProjectCodeFromPng(new Blob([bytes]))).rejects.toThrow('校验失败');
    await expect(readProjectCodeFromPng(saved.slice(0, -1))).rejects.toThrow();
    await expect(readProjectCodeFromPng(new Blob(['not a PNG']))).rejects.toThrow('无效的 PNG');
    await expect(embedProjectCodeInPng(image, '<unsafe>')).rejects.toThrow('无效的项目数据码');
  });
});
