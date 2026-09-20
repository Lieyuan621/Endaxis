const GAME_PUBLIC_PREFIXES = [
  '/icons/',
  '/operators/',
  '/weapons/',
  '/equipment/',
  '/consumables/',
  '/enemies/',
  '/contingency_contract/',
] as const;

/** 只提取可静态证明的 WebP 字面量；动态拼接必须由上层另行登记。 */
export function readGameIconReferences(source: string): readonly string[] {
  const references = new Set<string>();
  for (const prefix of GAME_PUBLIC_PREFIXES) {
    const expression = new RegExp(
      `(['"])(` + `${prefix.replaceAll('/', '\\/')}[^'"]*?\\.webp)\\1`,
      'gu',
    );
    for (const match of source.matchAll(expression)) {
      const publicPath = match[2]!;
      if (!publicPath.includes('${')) references.add(publicPath);
    }
  }
  return [...references].sort();
}
