import { parseAttributeTypeValue, type AttributeTypeSource } from './attributeModifiers.ts';
import {
  requireArray,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import { parseWeaponTypeValue, type WeaponTypeSource } from './weaponType.ts';

export const PROFESSION_CATEGORIES = [
  'GUARD',
  'SNIPER',
  'DEFENDER',
  'MEDIC',
  'SUPPORTER',
  'CASTER',
  'SPECIALIST',
  'VANGUARD',
  'ASSAULT',
] as const;

export type ProfessionCategorySource = (typeof PROFESSION_CATEGORIES)[number];

const ATTRIBUTE_FRAME_FIELDS = new Set(['Attribute', 'breakStage']);
const ATTRIBUTE_CONTAINER_FIELDS = new Set(['attrs']);
const ATTRIBUTE_VALUE_FIELDS = new Set(['attrType', 'attrValue']);

export interface CharacterAttributeKeyFrameSource {
  readonly sourcePath: string;
  readonly level: number;
  readonly breakStage: number;
  readonly attributes: Readonly<Partial<Record<AttributeTypeSource, number>>>;
}

/** CharacterTable 的严格来源事实；不在来源层投影 Next 属性名称。 */
export interface NativeOperatorCharacterTableSource {
  readonly sourcePath: string;
  readonly characterId: string;
  readonly characterTypeId: string;
  readonly profession: ProfessionCategorySource;
  readonly rarity: number;
  readonly mainAttributeType: AttributeTypeSource;
  readonly secondaryAttributeType: AttributeTypeSource;
  readonly nativeWeaponType: WeaponTypeSource;
  readonly defaultWeaponId: string;
  /** CharacterTable 决定战斗 HUD 是否实际挂载角色专属被动节点；空串表示不挂载。 */
  readonly charPassiveUiPrefabName: string;
  readonly attributeKeyFrames: readonly CharacterAttributeKeyFrameSource[];
}

/** 严格读取 CharacterTable 的战斗字段。 */
export function parseNativeOperatorCharacterTableSource(
  characterTableValue: unknown,
  characterId: string,
  attributeDefaults: Readonly<Partial<Record<AttributeTypeSource, number>>> = {},
  sourceName = 'CharacterTable',
): NativeOperatorCharacterTableSource {
  const table = requireRecord(characterTableValue, sourceName);
  const sourcePath = `${sourceName}.${characterId}`;
  const row = requireRecord(table[characterId], sourcePath);
  const embeddedId = requireNonEmptyString(row.charId, `${sourcePath}.charId`);
  if (embeddedId !== characterId) {
    throw new Error(
      `${sourcePath}: charId '${embeddedId}' does not match map key '${characterId}'`,
    );
  }
  const attributeKeyFrames = requireArray(row.attributes, `${sourcePath}.attributes`).map(
    (value, index) =>
      parseAttributeKeyFrame(value, `${sourcePath}.attributes[${index}]`, attributeDefaults),
  );
  if (attributeKeyFrames.length === 0) {
    throw new Error(`${sourcePath}.attributes: expected at least one key frame`);
  }
  return {
    sourcePath,
    characterId,
    characterTypeId: requireNonEmptyString(row.charTypeId, `${sourcePath}.charTypeId`),
    profession: parseProfessionCategory(row.profession, `${sourcePath}.profession`),
    rarity: requireInteger(row.rarity, `${sourcePath}.rarity`),
    mainAttributeType: parseAttributeTypeValue(row.mainAttrType, `${sourcePath}.mainAttrType`),
    secondaryAttributeType: parseAttributeTypeValue(row.subAttrType, `${sourcePath}.subAttrType`),
    nativeWeaponType: parseWeaponTypeValue(row.weaponType, `${sourcePath}.weaponType`),
    defaultWeaponId: requireNonEmptyString(row.defaultWeaponId, `${sourcePath}.defaultWeaponId`),
    charPassiveUiPrefabName: requireString(
      row.charPassiveUIPrefabName,
      `${sourcePath}.charPassiveUIPrefabName`,
    ),
    attributeKeyFrames,
  };
}

function parseProfessionCategory(value: unknown, path: string): ProfessionCategorySource {
  const nativeValue = requireInteger(value, path);
  const result = PROFESSION_CATEGORIES[nativeValue];
  if (result === undefined) throw new Error(`${path}: unknown ProfessionCategory ${nativeValue}`);
  return result;
}

function parseAttributeKeyFrame(
  value: unknown,
  path: string,
  attributeDefaults: Readonly<Partial<Record<AttributeTypeSource, number>>>,
): CharacterAttributeKeyFrameSource {
  const frame = requireRecord(value, path);
  requireExactFields(frame, ATTRIBUTE_FRAME_FIELDS, path);
  const containerPath = `${path}.Attribute`;
  const container = requireRecord(frame.Attribute, containerPath);
  requireExactFields(container, ATTRIBUTE_CONTAINER_FIELDS, containerPath);
  const attributes: Partial<Record<AttributeTypeSource, number>> = { ...attributeDefaults };
  const seen = new Set<AttributeTypeSource>();
  let level: number | undefined;
  requireArray(container.attrs, `${containerPath}.attrs`).forEach((rawAttribute, index) => {
    const attributePath = `${containerPath}.attrs[${index}]`;
    const attribute = requireRecord(rawAttribute, attributePath);
    requireExactFields(attribute, ATTRIBUTE_VALUE_FIELDS, attributePath);
    const attributeType = parseAttributeTypeValue(attribute.attrType, `${attributePath}.attrType`);
    if (seen.has(attributeType)) {
      throw new Error(`${attributePath}.attrType: duplicate attribute ${attributeType}`);
    }
    seen.add(attributeType);
    const attributeValue = requireNumber(attribute.attrValue, `${attributePath}.attrValue`);
    attributes[attributeType] = attributeValue;
    if (attributeType === 'Level') {
      if (!Number.isInteger(attributeValue) || attributeValue <= 0) {
        throw new Error(`${attributePath}.attrValue: level must be a positive integer`);
      }
      level = attributeValue;
    }
  });
  if (level === undefined) throw new Error(`${path}: missing Level attribute`);
  return {
    sourcePath: path,
    level,
    breakStage: requireNonNegativeInteger(frame.breakStage, `${path}.breakStage`),
    attributes,
  };
}
