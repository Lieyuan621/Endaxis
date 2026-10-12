import { imagePathForExport } from './imageResources.ts';
const GAME_PUBLIC_PREFIXES = [
  '/icons/',
  '/operators/',
  '/weapons/',
  '/equipment/',
  '/consumables/',
  '/enemies/',
  '/contingency_contract/',
] as const;

/** 提取 WebP 字面量及干员定义的图标名称；供导出和候选资源校验共用。 */
export function readGameIconReferences(source: string): readonly string[] {
  // JSON 文本中的 <image="..."> 引号会被转义，仍是必须导出的静态引用。
  source = source.replaceAll('\\"', '"');
  const references = new Set<string>();
  const slug =
    /\bassetSlug:\s*['"]([a-z0-9-]+)['"]/.exec(source)?.[1] ??
    /\bslug:\s*['"]([a-z0-9-]+)['"]/.exec(source)?.[1];
  if (slug) {
    // 发布的干员定义省略默认图标，候选校验仍须验证这些隐式依赖。
    const weaponType = /\bweaponType:\s*['"](sword|claym|lance|pistol|funnel)['"]/.exec(
      source,
    )?.[1];
    if (weaponType && /\bskillGroups\s*:/.test(source)) {
      for (const name of ['battle', 'combo', 'ultimate'])
        references.add(`/operators/${slug}/${name} 01.webp`);
      references.add(`/icons/icon_attack_${weaponType}.webp`);
    }
  }
  for (const match of source.matchAll(/['"](endaxis:[a-zA-Z0-9_/-]+)['"]/g))
    references.add(imagePathForExport(match[1]!));
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
