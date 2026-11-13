import { afterEach, expect, it, vi } from 'vitest';
import { findEnemyIconPath, loadLocalImageSources } from '../scripts/localImageSources.ts';

afterEach(() => vi.unstubAllGlobals());

it('敌人图标按完整名称匹配，排除同名的其他资源类别', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          JSON.stringify([
            {
              path: 'sprites/monstericonbig/eny_a.png',
              contentFile: '/api/images/sprites/monstericonbig/eny_a.png',
            },
            {
              path: 'sprites/bufficon/eny_a.png',
              contentFile: '/api/images/sprites/bufficon/eny_a.png',
            },
            {
              path: 'sprites/monstericonbig/eny_a_variant.png',
              contentFile: '/api/images/sprites/monstericonbig/eny_a_variant.png',
            },
          ]),
        ),
    ),
  );
  const images = await loadLocalImageSources('http://localhost:8766/api/data');
  expect(findEnemyIconPath(images, 'eny_a')).toBe('sprites/monstericonbig/eny_a.png');
  expect(findEnemyIconPath(images, 'eny_missing')).toBeUndefined();
  expect(() => findEnemyIconPath([...images, images[0]!], 'eny_a')).toThrow('ambiguous enemy icon');
});

it('图片清单不能将下载重定向到其他来源', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          JSON.stringify([{ path: 'a.png', contentFile: 'https://example.com/api/images/a.png' }]),
        ),
    ),
  );
  await expect(loadLocalImageSources('http://localhost:8766/api/data')).rejects.toThrow(
    'unexpected image URL',
  );
});
