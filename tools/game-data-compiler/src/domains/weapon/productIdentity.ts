import { parseItemIdentitySource } from '../../source/itemIdentity.ts';
import { requireRecord } from '../../source/primitives.ts';
import type { CompiledWeaponStaticDefinitionSource } from './staticDefinition.ts';

export type IdentifiedWeaponStaticDefinitionSource = CompiledWeaponStaticDefinitionSource & {
  readonly assetSlug: string;
  readonly iconPath: string;
};

/**
 * 用同版本 ItemTable 为武器候选补齐与语言无关的产品身份。
 * 名称和描述不进入定义；旧友好 slug 由应用注册层按图标身份建立 alias。
 */
export function attachWeaponProductIdentities(
  definitions: readonly CompiledWeaponStaticDefinitionSource[],
  itemTableValue: unknown,
): readonly IdentifiedWeaponStaticDefinitionSource[] {
  const itemTable = requireRecord(itemTableValue, 'ItemTable');
  return definitions.map(definition => {
    const identity = parseItemIdentitySource(itemTable[definition.slug], definition.slug);
    if (identity.rarity !== definition.rarity) {
      throw new Error(
        `${identity.sourcePath}.rarity: expected WeaponBasicTable rarity ${definition.rarity}, got ${identity.rarity}`,
      );
    }
    if (identity.iconId.length === 0) {
      throw new Error(`${identity.sourcePath}.iconId: expected non-empty weapon asset identity`);
    }
    const assetSlug = identity.iconId;
    return {
      ...definition,
      assetSlug,
      iconPath: `/weapons/${definition.weaponType}/${assetSlug}.webp`,
    };
  });
}
