import {
  projectPrimaryAttributeKey,
  type AttributeTypeSource,
} from '../../compiler/build/attributeModifier.ts';
import { projectWeaponType } from '../../compiler/build/weaponType.ts';
import {
  OPERATOR_RARITIES,
  type OperatorAttribute,
  type OperatorRarity,
  type OperatorRole,
  type OperatorWeaponType,
  type DamageElement,
} from '../../../../../packages/game-data-contract/src/primitives.ts';
import type { AttributeGrowthDefinition } from '../../../../../packages/game-data-contract/src/operators.ts';
import { projectNativeDamageElement } from '../../source/damageElement.ts';
import {
  parseNativeOperatorCharacterTableSource,
  type CharacterAttributeKeyFrameSource,
  type NativeOperatorCharacterTableSource,
  type ProfessionCategorySource,
} from '../../source/operatorCharacterTable.ts';

// 旧名只作兼容转导出；正式身份唯一声明于独立契约。
export type {
  OperatorAttribute as OperatorPrimaryAttributeSource,
  OperatorRole as ProjectedOperatorRoleSource,
  OperatorRarity as ProjectedOperatorRaritySource,
} from '../../../../../packages/game-data-contract/src/primitives.ts';
export type { CharacterAttributeKeyFrameSource } from '../../source/operatorCharacterTable.ts';

/** 原生记录及正式身份的关联中间态，原生枚举仍保留供审计。 */
export interface OperatorCharacterTableSource extends NativeOperatorCharacterTableSource {
  readonly mainAttribute: OperatorAttribute;
  readonly secondaryAttribute: OperatorAttribute;
  readonly weaponType: OperatorWeaponType;
  readonly element: DamageElement;
  readonly role: OperatorRole;
  readonly projectedRarity: OperatorRarity;
}

/** 选择原生精确关键帧的编译输入；正式成长表不携带 breakStage。 */
export interface OperatorPanelMilestoneSource {
  readonly level: number;
  readonly breakStage: number;
}

/** 正式成长表的只读输出，不是另一套面板模型。 */
export type CompiledOperatorAttributeGrowthSource = Readonly<AttributeGrowthDefinition>;

export const STANDARD_OPERATOR_PANEL_MILESTONES: readonly OperatorPanelMilestoneSource[] = [
  { level: 1, breakStage: 0 },
  { level: 20, breakStage: 0 },
  { level: 40, breakStage: 1 },
  { level: 60, breakStage: 2 },
  { level: 80, breakStage: 3 },
  { level: 90, breakStage: 4 },
];

/** 来源层读取原生身份；领域层只调用公共投影，不再解释 AttributeType 数值。 */
export function parseOperatorCharacterTableSource(
  characterTableValue: unknown,
  characterId: string,
  attributeDefaults: Readonly<Partial<Record<AttributeTypeSource, number>>> = {},
  sourceName = 'CharacterTable',
): OperatorCharacterTableSource {
  const source = parseNativeOperatorCharacterTableSource(
    characterTableValue,
    characterId,
    attributeDefaults,
    sourceName,
  );
  return {
    ...source,
    mainAttribute: requirePrimaryAttribute(
      source.mainAttributeType,
      `${source.sourcePath}.mainAttrType`,
    ),
    secondaryAttribute: requirePrimaryAttribute(
      source.secondaryAttributeType,
      `${source.sourcePath}.subAttrType`,
    ),
    weaponType: projectWeaponType(source.nativeWeaponType, `${source.sourcePath}.weaponType`),
    element: projectNativeDamageElement(source.characterTypeId, `${source.sourcePath}.charTypeId`),
    role: projectOperatorRole(source.profession, `${source.sourcePath}.profession`),
    projectedRarity: projectOperatorRarity(source.rarity, `${source.sourcePath}.rarity`),
  };
}

function projectOperatorRole(profession: ProfessionCategorySource, path: string): OperatorRole {
  const result = PROJECTED_OPERATOR_ROLES[profession];
  if (result === undefined) {
    throw new Error(`${path}: ProfessionCategory ${profession} has no supported Next projection`);
  }
  return result;
}

function projectOperatorRarity(rarity: number, path: string): OperatorRarity {
  const result = OPERATOR_RARITIES.find(candidate => candidate === rarity);
  if (result === undefined) {
    throw new Error(`${path}: rarity ${rarity} has no supported Next projection`);
  }
  return result;
}

const PROJECTED_OPERATOR_ROLES: Readonly<Partial<Record<ProfessionCategorySource, OperatorRole>>> =
  {
    GUARD: 'guard',
    DEFENDER: 'defender',
    SUPPORTER: 'supporter',
    CASTER: 'caster',
    VANGUARD: 'vanguard',
    ASSAULT: 'striker',
  };

/** 按原生列表顺序寻找精确关键帧；缺失时不插值、不寻找相邻等级。 */
export function findExactCharacterAttributeKeyFrame(
  character: OperatorCharacterTableSource,
  level: number,
  breakStage: number,
): CharacterAttributeKeyFrameSource | null {
  return (
    character.attributeKeyFrames.find(
      frame => frame.level === level && frame.breakStage === breakStage,
    ) ?? null
  );
}

/** 将显式选择的原生关键帧投影为 Next OperatorDefinition.attributes。 */
export function compileOperatorAttributeGrowthSource(
  character: OperatorCharacterTableSource,
  milestones: readonly OperatorPanelMilestoneSource[],
): CompiledOperatorAttributeGrowthSource {
  const frames = milestones.map(({ level, breakStage }) => {
    const frame = findExactCharacterAttributeKeyFrame(character, level, breakStage);
    if (frame === null) {
      throw new Error(
        `${character.sourcePath}.attributes: missing exact panel key frame (${level}, ${breakStage})`,
      );
    }
    return frame;
  });
  return {
    strength: projectPanelAttribute(frames, 'Str'),
    agility: projectPanelAttribute(frames, 'Agi'),
    intellect: projectPanelAttribute(frames, 'Wisd'),
    will: projectPanelAttribute(frames, 'Will'),
    baseAttack: projectPanelAttribute(frames, 'Atk'),
    baseHealth: projectPanelAttribute(frames, 'MaxHp'),
  };
}

function requirePrimaryAttribute(attribute: AttributeTypeSource, path: string): OperatorAttribute {
  const result = projectPrimaryAttributeKey(attribute);
  if (result === null) throw new Error(`${path}: ${attribute} is not a primary attribute`);
  return result;
}

function projectPanelAttribute(
  frames: readonly CharacterAttributeKeyFrameSource[],
  attributeType: AttributeTypeSource,
): number[] {
  return frames.map(frame => {
    const value = frame.attributes[attributeType];
    if (value === undefined) {
      throw new Error(`${frame.sourcePath}: missing panel attribute ${attributeType}`);
    }
    return Math.trunc(value);
  });
}
