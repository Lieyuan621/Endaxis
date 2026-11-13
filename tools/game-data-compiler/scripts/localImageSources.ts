import { requireArray, requireNonEmptyString, requireRecord } from '../src/source/primitives.ts';

export interface LocalImageSource {
  readonly path: string;
  readonly rawUrl: string;
}

/** AKE 导出的原始图片清单；同一轮任务由调用者持有快照。 */
export async function loadLocalImageSources(
  localBase: string,
): Promise<readonly LocalImageSource[]> {
  const origin = new URL(localBase).origin;
  const url = new URL('/api/images/manifest.json', origin);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const rows = requireArray(await response.json(), 'local images');
  return rows.map((raw, index) => {
    const row = requireRecord(raw, `local images[${index}]`);
    const source = new URL(requireNonEmptyString(row.contentFile, 'contentFile'), origin);
    if (source.origin !== origin || !source.pathname.startsWith('/api/images/'))
      throw new Error('unexpected image URL');
    return { path: requireNonEmptyString(row.path, 'image path'), rawUrl: source.href };
  });
}

export function findEnemyIconPath(
  images: readonly LocalImageSource[],
  id: string,
): string | undefined {
  const matches = images.filter(image => {
    const path = image.path.toLowerCase();
    return path.includes('/monstericonbig/') && path.endsWith(`/${id.toLowerCase()}.png`);
  });
  if (matches.length > 1) throw new Error(`ambiguous enemy icon: ${id}`);
  return matches[0]?.path;
}
