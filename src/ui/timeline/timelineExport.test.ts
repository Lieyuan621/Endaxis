import { describe, expect, it } from 'vitest';
import { compressProjectCode, decompressProjectCode } from './timelineExport';

describe('timeline export helpers', () => {
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
