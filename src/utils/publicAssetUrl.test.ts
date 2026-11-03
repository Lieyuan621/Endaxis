import { afterEach, expect, it, vi } from 'vitest';
import { publicAssetUrl } from './publicAssetUrl';

afterEach(() => vi.unstubAllEnvs());

it('子目录部署的资源只添加一次前缀，外部 URL 保持不变', () => {
  vi.stubEnv('BASE_URL', '/Endaxis/');
  expect(publicAssetUrl('/icons/default_icon.webp')).toBe('/Endaxis/icons/default_icon.webp');
  expect(publicAssetUrl('/Endaxis/icons/default_icon.webp')).toBe(
    '/Endaxis/icons/default_icon.webp',
  );
  expect(publicAssetUrl('https://example.com/image.webp')).toBe('https://example.com/image.webp');
  expect(publicAssetUrl('//example.com/image.webp')).toBe('//example.com/image.webp');
});

it('根目录部署保留资源路径', () => {
  vi.stubEnv('BASE_URL', '/');
  expect(publicAssetUrl('/icons/default_icon.webp')).toBe('/icons/default_icon.webp');
});
