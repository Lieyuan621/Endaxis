import type { ResolvedAttributeModifierSource } from '../../compiler/build/attributeModifier.ts';
import {
  requireArray,
  requireExactFields,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
  toFloat32,
} from '../../source/primitives.ts';
import { parseWeaponBasicSources } from './basicTable.ts';

const UPGRADE_TEMPLATE_FIELDS = new Set(['list']);
const UPGRADE_LEVEL_FIELDS = new Set(['baseAtk', 'lvUpExp', 'lvUpGold', 'weaponLv']);

export interface WeaponUpgradeLevelSource {
  readonly sourcePath: string;
  readonly weaponLevel: number;
  /** JSON 中的导出值，供审计保留。 */
  readonly exportedBaseAttack: number;
  /** 原生字段为 float；运行语义按单精度值消费。 */
  readonly baseAttack: number;
}

export interface WeaponBaseAttackSource {
  readonly sourcePath: string;
  readonly weaponId: string;
  readonly levelTemplateId: string;
  readonly maximumLevel: number;
  readonly upgradeLevels: readonly WeaponUpgradeLevelSource[];
}

export interface ResolvedWeaponBaseAttackModifierSource extends ResolvedAttributeModifierSource {
  readonly weaponId: string;
  readonly weaponLevel: number;
}

/**
 * 读取 WeaponBasicTable 声明的成长模板；同模板可被多把武器共享，但只严格解析一次。
 */
export function parseWeaponBaseAttackSources(
  weaponBasicTableValue: unknown,
  weaponUpgradeTemplateTableValue: unknown,
  weaponIds: readonly string[],
  basicSourceName = 'WeaponBasicTable',
  upgradeSourceName = 'WeaponUpgradeTemplateTable',
): WeaponBaseAttackSource[] {
  const weapons = parseWeaponBasicSources(weaponBasicTableValue, weaponIds, basicSourceName);
  const upgradeTable = requireRecord(weaponUpgradeTemplateTableValue, upgradeSourceName);
  const parsedTemplates = new Map<string, readonly WeaponUpgradeLevelSource[]>();

  return weapons.map(weapon => {
    let upgradeLevels = parsedTemplates.get(weapon.levelTemplateId);
    if (upgradeLevels === undefined) {
      upgradeLevels = parseUpgradeTemplate(
        upgradeTable[weapon.levelTemplateId],
        weapon.levelTemplateId,
        upgradeSourceName,
      );
      parsedTemplates.set(weapon.levelTemplateId, upgradeLevels);
    }
    if (!upgradeLevels.some(level => level.weaponLevel === weapon.maximumLevel)) {
      throw new Error(
        `${upgradeSourceName}.${weapon.levelTemplateId}: weapon maxLv ${weapon.maximumLevel} has no upgrade row`,
      );
    }
    return {
      sourcePath: weapon.sourcePath,
      weaponId: weapon.weaponId,
      levelTemplateId: weapon.levelTemplateId,
      maximumLevel: weapon.maximumLevel,
      upgradeLevels,
    };
  });
}

/** 精确等级行才产生原生 Atk/BaseAddition；缺行返回 null，不插值。 */
export function resolveWeaponBaseAttackModifier(
  weapon: WeaponBaseAttackSource,
  weaponLevel: number,
): ResolvedWeaponBaseAttackModifierSource | null {
  if (!Number.isInteger(weaponLevel)) {
    throw new Error(`weapon '${weapon.weaponId}': weapon level must be an integer`);
  }
  const level = weapon.upgradeLevels.find(item => item.weaponLevel === weaponLevel);
  if (level === undefined) return null;
  return {
    sourcePath: level.sourcePath,
    weaponId: weapon.weaponId,
    weaponLevel,
    modifyAttributeType: 'Specific',
    attributeType: 'Atk',
    formulaItem: 'BaseAddition',
    value: level.baseAttack,
  };
}

function parseUpgradeTemplate(
  value: unknown,
  templateId: string,
  sourceName: string,
): WeaponUpgradeLevelSource[] {
  const sourcePath = `${sourceName}.${templateId}`;
  const template = requireRecord(value, sourcePath);
  requireExactFields(template, UPGRADE_TEMPLATE_FIELDS, sourcePath);
  const seenLevels = new Set<number>();
  return requireArray(template.list, `${sourcePath}.list`).map((rawLevel, index) => {
    const levelPath = `${sourcePath}.list[${index}]`;
    const level = requireRecord(rawLevel, levelPath);
    requireExactFields(level, UPGRADE_LEVEL_FIELDS, levelPath);
    const weaponLevel = requireNonNegativeInteger(level.weaponLv, `${levelPath}.weaponLv`);
    if (weaponLevel === 0) {
      throw new Error(`${levelPath}.weaponLv: expected a positive integer`);
    }
    if (seenLevels.has(weaponLevel)) {
      throw new Error(`${levelPath}.weaponLv: duplicate weapon level ${weaponLevel}`);
    }
    seenLevels.add(weaponLevel);
    const exportedBaseAttack = requireNumber(level.baseAtk, `${levelPath}.baseAtk`);
    if (exportedBaseAttack < 0) {
      throw new Error(`${levelPath}.baseAtk: expected a non-negative number`);
    }
    requireNonNegativeInteger(level.lvUpExp, `${levelPath}.lvUpExp`);
    requireNonNegativeInteger(level.lvUpGold, `${levelPath}.lvUpGold`);
    return {
      sourcePath: levelPath,
      weaponLevel,
      exportedBaseAttack,
      baseAttack: toFloat32(exportedBaseAttack),
    };
  });
}
