import { requireNonEmptyString, requireRecord } from '../../source/primitives.ts';

/** Endaxis 产品层身份；不由游戏显示字段或文件名推导。 */
export interface OperatorProductIdentitySource {
  readonly slug: string;
  readonly gameId: string;
  readonly exportName: string;
  readonly characterId: string;
}

export function parseOperatorProductIdentitySource(
  value: unknown,
  sourcePath: string,
): OperatorProductIdentitySource {
  const row = requireRecord(value, sourcePath);
  const slug = requireNonEmptyString(row.slug, `${sourcePath}.slug`);
  const gameId = requireNonEmptyString(row.gameId, `${sourcePath}.gameId`);
  const exportName = requireNonEmptyString(row.exportName, `${sourcePath}.exportName`);
  const characterId = requireNonEmptyString(row.charId, `${sourcePath}.charId`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`${sourcePath}.slug: expected a stable kebab-case product slug`);
  }
  if (!/^[A-Z][A-Z0-9_]*$/.test(gameId)) {
    throw new Error(`${sourcePath}.gameId: expected a stable uppercase product identity`);
  }
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(exportName)) {
    throw new Error(`${sourcePath}.exportName: expected a TypeScript identifier`);
  }
  if (!/^chr_[a-z0-9_]+$/.test(characterId)) {
    throw new Error(`${sourcePath}.charId: expected a native character identity`);
  }
  return {
    slug,
    gameId,
    exportName,
    characterId,
  };
}
