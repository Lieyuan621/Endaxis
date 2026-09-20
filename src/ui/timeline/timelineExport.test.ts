import { describe, expect, it } from 'vitest';
import {
  compressProjectCode,
  decompressProjectCode,
  imageFilename,
  projectFilename,
} from './timelineExport';
import source from './timelineExport.ts?raw';

describe('timeline export helpers', () => {
  it('loads the image renderer only when an image export starts', () => {
    expect(source).not.toMatch(/^import .*@zumer\/snapdom/m);
    expect(source).toContain("await import('@zumer/snapdom')");
  });
  it('exports PNG images and normalizes existing file extensions', () => {
    expect(projectFilename(' rotation.webp ')).toBe('rotation.json');
    expect(imageFilename('rotation.png')).toBe('rotation.png');
    expect(imageFilename('rotation.webp')).toBe('rotation.png');
    expect(imageFilename('')).toBe('Endaxis_Export.png');
  });

  it('uses the legacy URL-safe gzip data-code format', async () => {
    const code = await compressProjectCode('{"kind":"EndaxisProject"}');
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    let base64 = code.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 > 0) base64 += '=';
    const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
    const text = await new Response(
      new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')),
    ).text();
    expect(text).toBe('{"kind":"EndaxisProject"}');
    expect(await decompressProjectCode(code)).toBe('{"kind":"EndaxisProject"}');
    await expect(decompressProjectCode('not a code!')).rejects.toThrow('无效的数据码');
  });
});
