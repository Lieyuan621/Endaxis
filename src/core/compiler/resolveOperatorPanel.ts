/**
 * 根据已解析构筑计算战斗开始前的干员面板与来源回执。
 *
 * 本模块只消费 Build Resolver 和已编译静态配装贡献，不读取定义或 UI。动态 Buff、按技能筛选的
 * 伤害加成和运行时状态不进入可见面板；调用方应把返回快照同时用于属性详情与战斗初始属性。
 */
import type { EquipmentPanelStat } from '../game-data/equipmentDefinition';
import type {
  OperatorAttribute,
  TrustAttributeBonusDefinition,
  UpgradeBasePanelStat,
  UpgradeModifierDefinition,
  UpgradeStaticDamageIncreaseTarget,
} from '../game-data/operatorDefinition';
import { DEFAULT_TRUST_ATTRIBUTE_BONUS } from '../game-data/operatorDefinition';
import type { OperatorInstanceDocument } from '../project/schema';
import type {
  CompiledEquipmentModifierContribution,
  ResolvedEquipmentModifier,
} from './compileEquipment';
import type { OperatorPanelContributionSource } from '../combat/state/foundationState';
export type { OperatorPanelContributionSource } from '../combat/state/foundationState';
import { resolveActiveOperatorUpgrades } from './compileOperatorUpgrades';
import { compileResolvedScenarioEquipmentModifiers } from './compileScenarioEquipment';
import type { ResolvedScenarioBuild } from './resolveScenarioBuilds';
import {
  MAIN_ATTRIBUTE_ATTACK_FACTOR,
  SECONDARY_ATTRIBUTE_ATTACK_FACTOR,
} from '../game-data/battleConstants';

const LEVEL_NODES = [1, 20, 40, 60, 80, 90] as const;
const ATTRIBUTES = ['strength', 'agility', 'intellect', 'will'] as const;
const PANEL_STAT_TARGETS: Readonly<Record<EquipmentPanelStat, OperatorPanelStat>> = {
  attackFlat: 'attack',
  attackPercent: 'attack',
  healthFlat: 'health',
  healthPercent: 'health',
  defenseFlat: 'defense',
  defensePercent: 'defense',
  criticalRate: 'criticalRate',
  criticalDamage: 'criticalDamage',
  artsIntensity: 'artsIntensity',
  ultimateEnergyGainEfficiency: 'ultimateEnergyGainEfficiency',
  skillCooldownReduction: 'skillCooldownReduction',
  staggerDamagePercent: 'staggerDamagePercent',
};

export interface OperatorPanelAttributes {
  readonly strength: number;
  readonly agility: number;
  readonly intellect: number;
  readonly will: number;
}

export type OperatorPanelStat =
  | OperatorAttribute
  | 'attack'
  | 'health'
  | 'defense'
  | 'criticalRate'
  | 'criticalDamage'
  | 'artsIntensity'
  | 'ultimateEnergyGainEfficiency'
  | 'skillCooldownReduction'
  | 'staggerDamagePercent';

/** 一项进入面板聚合的原始贡献；百分比使用小数。 */
export interface OperatorPanelContributionReceipt {
  readonly source: OperatorPanelContributionSource;
  readonly stat: OperatorPanelStat;
  readonly operation: 'base' | 'flat' | 'percent';
  readonly value: number;
}

/** 可见面板及战斗初始化需要的静态修正。比率字段统一使用小数。 */
export interface ResolvedOperatorPanel {
  readonly operatorId: string;
  readonly level: number;
  readonly attributes: OperatorPanelAttributes;
  readonly attack: number;
  /** 旧版伤害详情攻击展开树需要的静态构筑分量；运行时攻击改变后不得继续冒充当前明细。 */
  readonly attackDetail?: {
    readonly operatorBaseAttack: number;
    readonly weaponBaseAttack: number;
    readonly attackPercent: number;
    readonly flatAttack: number;
  };
  /** 运行时重新计算攻击派生倍率所需的、尚未乘四维倍率的攻击值。 */
  readonly attackBeforeAttributeScalar: number;
  /** 模拟初始化使用基础槽位，不从展示用 attackDetail 反推攻击公式。 */
  readonly attackBase?: {
    readonly rawValue: number;
    readonly baseMultiplier: number;
    readonly baseFinalAddition: number;
  };
  readonly mainAttribute: OperatorAttribute;
  readonly secondaryAttribute: OperatorAttribute;
  readonly health: number;
  readonly defense: number;
  readonly criticalRate: number;
  readonly criticalDamage: number;
  readonly artsIntensity: number;
  readonly ultimateEnergyGainEfficiency: number;
  readonly skillCooldownReduction: number;
  readonly staggerDamagePercent: number;
  /** 不显示为普通面板数值、但由同一构筑静态决定的战斗修正。 */
  readonly combatModifiers: readonly ResolvedOperatorCombatModifier[];
  readonly receipt: readonly OperatorPanelContributionReceipt[];
}

/** 构筑期静态战斗修正；升级增伤保留原生属性身份，配装修正继续保留筛选条件。 */
export type ResolvedOperatorCombatModifier = {
  readonly source?: OperatorPanelContributionSource;
} & (
  | ResolvedEquipmentModifier
  | {
      readonly kind: 'staticDamageIncrease';
      readonly target: UpgradeStaticDamageIncreaseTarget;
      readonly value: number;
    }
  | {
      readonly kind: 'staticHealingIncrease';
      readonly target: 'output' | 'taken';
      readonly value: number;
    }
);

interface MutablePanelValues {
  attributes: Record<OperatorAttribute, number>;
  attributePercent: Record<OperatorAttribute, number>;
  operatorBaseAttack: number;
  weaponBaseAttack: number;
  operatorBaseHealth: number;
  gearBaseDefense: number;
  upgradeBasePanelStats: Record<UpgradeBasePanelStat, { flat: number; percent: number }>;
  panelStats: Record<EquipmentPanelStat, number>;
}

function createUpgradeBasePanelStatRecord(): MutablePanelValues['upgradeBasePanelStats'] {
  return {
    health: { flat: 0, percent: 0 },
    defense: { flat: 0, percent: 0 },
    criticalRate: { flat: 0, percent: 0 },
    artsIntensity: { flat: 0, percent: 0 },
  };
}

function createPanelStatRecord(): Record<EquipmentPanelStat, number> {
  return {
    attackFlat: 0,
    attackPercent: 0,
    healthFlat: 0,
    healthPercent: 0,
    defenseFlat: 0,
    defensePercent: 0,
    criticalRate: 0,
    criticalDamage: 0,
    artsIntensity: 0,
    ultimateEnergyGainEfficiency: 0,
    skillCooldownReduction: 0,
    staggerDamagePercent: 0,
  };
}

function requireLevelIndex(level: number, path: string): number {
  const index = LEVEL_NODES.indexOf(level as (typeof LEVEL_NODES)[number]);
  if (index < 0) throw new RangeError(`${path} must be one of ${LEVEL_NODES.join(', ')}`);
  return index;
}

function requireFinite(value: number | undefined, path: string): number {
  if (value === undefined || !Number.isFinite(value)) {
    throw new TypeError(`${path} must resolve to a finite number`);
  }
  return value;
}

function resolveTrustAttribute(
  attribute: TrustAttributeBonusDefinition['attributes'][number],
  build: ResolvedScenarioBuild,
): OperatorAttribute {
  return attribute === 'main'
    ? build.operator.mainAttribute
    : attribute === 'secondary'
      ? build.operator.secondaryAttribute
      : attribute;
}

function maxTrustLevel(build: OperatorInstanceDocument): number {
  if (build.level >= 90) return 4;
  if (build.level >= 80) return build.promoted ? 4 : 3;
  if (build.level >= 60) return build.promoted ? 3 : 2;
  if (build.level >= 40) return build.promoted ? 2 : 1;
  if (build.level >= 20) return build.promoted ? 1 : 0;
  return 0;
}

function applyUpgradeModifier(
  modifier: UpgradeModifierDefinition,
  source: OperatorPanelContributionSource,
  values: MutablePanelValues,
  receipt: OperatorPanelContributionReceipt[],
  combatModifiers: ResolvedOperatorCombatModifier[],
): void {
  if (modifier.kind === 'addBuildAttribute') {
    for (const attribute of modifier.attributes) {
      values.attributes[attribute] += modifier.value;
      receipt.push({ source, stat: attribute, operation: 'flat', value: modifier.value });
    }
  } else if (modifier.kind === 'modifyBasePanelStat') {
    values.upgradeBasePanelStats[modifier.stat][modifier.operation] += modifier.value;
    receipt.push({
      source,
      stat: modifier.stat,
      operation: modifier.operation,
      value: modifier.value,
    });
  } else if (modifier.kind === 'addStaticDamageIncrease') {
    combatModifiers.push({
      kind: 'staticDamageIncrease',
      source,
      target: modifier.target,
      value: modifier.value,
    });
  } else if (modifier.kind === 'addStaticHealingIncrease') {
    combatModifiers.push({
      kind: 'staticHealingIncrease',
      target: modifier.target,
      value: modifier.value,
    });
  }
}

function resolveUpgradeBasePanelStat(
  rawValue: number,
  stat: UpgradeBasePanelStat,
  values: MutablePanelValues,
): number {
  const modifier = values.upgradeBasePanelStats[stat];
  return (rawValue + modifier.flat) * Math.max(0, 1 + modifier.percent);
}

function applyEquipmentContribution(
  contribution: CompiledEquipmentModifierContribution,
  values: MutablePanelValues,
  receipt: OperatorPanelContributionReceipt[],
  combatModifiers: ResolvedOperatorCombatModifier[],
): void {
  const source = { kind: 'equipment', contribution: contribution.source } as const;
  for (const modifier of contribution.modifiers) {
    if (modifier.kind === 'attribute') {
      if (modifier.operation === 'flat') values.attributes[modifier.attribute] += modifier.value;
      else values.attributePercent[modifier.attribute] += modifier.value;
      receipt.push({
        source,
        stat: modifier.attribute,
        operation: modifier.operation,
        value: modifier.value,
      });
    } else if (modifier.kind === 'panelStat') {
      values.panelStats[modifier.stat] += modifier.value;
      receipt.push({
        source,
        stat: PANEL_STAT_TARGETS[modifier.stat],
        operation: modifier.stat.endsWith('Percent') ? 'percent' : 'flat',
        value: modifier.value,
      });
    } else if (
      modifier.kind === 'damageBonus' ||
      modifier.kind === 'damageScale' ||
      modifier.kind === 'skillCooldownMultiplier'
    ) {
      combatModifiers.push({ ...modifier, source });
    } else if (modifier.kind === 'staticHealingIncrease') {
      combatModifiers.push({
        kind: 'staticHealingIncrease',
        target: modifier.target,
        value: modifier.value,
      });
    }
  }
}

/** 计算单个已解析干员构筑的静态面板。 */
export function resolveOperatorPanel(build: ResolvedScenarioBuild): ResolvedOperatorPanel {
  if (build.operatorInstance.baseStatOverrides !== undefined) {
    throw new Error(
      `operator '${build.track.id}' has base stat overrides, but Next panel override semantics are not normalized`,
    );
  }
  const operatorLevelIndex = requireLevelIndex(
    build.operatorInstance.level,
    `operator '${build.track.id}'.level`,
  );
  const receipt: OperatorPanelContributionReceipt[] = [];
  const operatorSource = { kind: 'operatorBase', operatorSlug: build.operator.slug } as const;
  const attributes = Object.fromEntries(
    ATTRIBUTES.map(attribute => {
      const value = requireFinite(
        build.operator.attributes[attribute][operatorLevelIndex],
        `operator '${build.operator.slug}'.attributes.${attribute}[${operatorLevelIndex}]`,
      );
      receipt.push({ source: operatorSource, stat: attribute, operation: 'base', value });
      return [attribute, value];
    }),
  ) as Record<OperatorAttribute, number>;
  const values: MutablePanelValues = {
    attributes,
    attributePercent: { strength: 0, agility: 0, intellect: 0, will: 0 },
    operatorBaseAttack: requireFinite(
      build.operator.attributes.baseAttack[operatorLevelIndex],
      `operator '${build.operator.slug}'.attributes.baseAttack[${operatorLevelIndex}]`,
    ),
    weaponBaseAttack: 0,
    operatorBaseHealth: requireFinite(
      build.operator.attributes.baseHealth[operatorLevelIndex],
      `operator '${build.operator.slug}'.attributes.baseHealth[${operatorLevelIndex}]`,
    ),
    gearBaseDefense: 0,
    upgradeBasePanelStats: createUpgradeBasePanelStatRecord(),
    panelStats: createPanelStatRecord(),
  };
  const combatModifiers: ResolvedOperatorCombatModifier[] = [];
  receipt.push(
    {
      source: operatorSource,
      stat: 'attack',
      operation: 'base',
      value: values.operatorBaseAttack,
    },
    {
      source: operatorSource,
      stat: 'health',
      operation: 'base',
      value: values.operatorBaseHealth,
    },
    {
      source: operatorSource,
      stat: 'criticalRate',
      operation: 'base',
      value: 0.05,
    },
    {
      source: operatorSource,
      stat: 'criticalDamage',
      operation: 'base',
      value: 0.5,
    },
    {
      source: operatorSource,
      stat: 'ultimateEnergyGainEfficiency',
      operation: 'base',
      value: 1,
    },
  );

  const trust = build.operator.trustAttributeBonus ?? DEFAULT_TRUST_ATTRIBUTE_BONUS;
  const unlockedTrustLevel = maxTrustLevel(build.operatorInstance);
  if (
    !Number.isInteger(build.operatorInstance.trustLevel) ||
    build.operatorInstance.trustLevel < 0 ||
    build.operatorInstance.trustLevel > unlockedTrustLevel
  ) {
    throw new RangeError(
      `operator '${build.track.id}'.trustLevel must be an integer between 0 and ${unlockedTrustLevel}`,
    );
  }
  for (let index = 0; index < build.operatorInstance.trustLevel; index += 1) {
    const bonus = requireFinite(
      trust.values[index],
      `operator '${build.operator.slug}'.trustAttributeBonus.values[${index}]`,
    );
    for (const rawAttribute of trust.attributes) {
      const attribute = resolveTrustAttribute(rawAttribute, build);
      values.attributes[attribute] += bonus;
      receipt.push({
        source: { kind: 'trust', operatorSlug: build.operator.slug, node: index + 1 },
        stat: attribute,
        operation: 'flat',
        value: bonus,
      });
    }
  }

  for (const upgrade of resolveActiveOperatorUpgrades(build.operatorInstance, build.operator)) {
    const source = {
      kind: 'operatorUpgrade',
      source: upgrade.source,
      index: upgrade.index,
    } as const;
    for (const modifier of upgrade.definition.modifiers ?? []) {
      applyUpgradeModifier(modifier, source, values, receipt, combatModifiers);
    }
  }

  if (build.weapon !== null) {
    const weaponLevelIndex = requireLevelIndex(
      build.weapon.instance.level,
      `weapon '${build.weapon.definition.slug}'.level`,
    );
    values.weaponBaseAttack = requireFinite(
      build.weapon.definition.baseAttackAtLevelNodes[weaponLevelIndex],
      `weapon '${build.weapon.definition.slug}'.baseAttackAtLevelNodes[${weaponLevelIndex}]`,
    );
    receipt.push({
      source: { kind: 'weaponBase', weaponSlug: build.weapon.definition.slug },
      stat: 'attack',
      operation: 'base',
      value: values.weaponBaseAttack,
    });
  }
  for (const gear of build.gears) {
    values.gearBaseDefense += gear.definition.baseDefense;
    receipt.push({
      source: { kind: 'gearBase', gearSlug: gear.definition.slug },
      stat: 'defense',
      operation: 'base',
      value: gear.definition.baseDefense,
    });
  }

  const equipment = compileResolvedScenarioEquipmentModifiers([build])[0]!;
  for (const contribution of equipment.contributions) {
    applyEquipmentContribution(contribution, values, receipt, combatModifiers);
  }
  for (const attribute of ATTRIBUTES) {
    values.attributes[attribute] = Math.floor(
      values.attributes[attribute] * (1 + values.attributePercent[attribute]),
    );
  }

  const mainAttribute = values.attributes[build.operator.mainAttribute];
  const secondaryAttribute = values.attributes[build.operator.secondaryAttribute];
  const attributeAttackMultiplier =
    1 +
    Math.floor(mainAttribute) * MAIN_ATTRIBUTE_ATTACK_FACTOR +
    Math.floor(secondaryAttribute) * SECONDARY_ATTRIBUTE_ATTACK_FACTOR;
  const attackBeforeAttributeScalar =
    (values.operatorBaseAttack + values.weaponBaseAttack) * (1 + values.panelStats.attackPercent) +
    values.panelStats.attackFlat;
  const attack = Math.floor(attackBeforeAttributeScalar * attributeAttackMultiplier);
  const health = Math.floor(
    resolveUpgradeBasePanelStat(
      values.operatorBaseHealth + values.attributes.strength * 5,
      'health',
      values,
    ) *
      (1 + values.panelStats.healthPercent) +
      values.panelStats.healthFlat,
  );
  const defense = Math.floor(
    resolveUpgradeBasePanelStat(values.gearBaseDefense, 'defense', values) *
      (1 + values.panelStats.defensePercent) +
      values.panelStats.defenseFlat,
  );

  return {
    operatorId: build.track.id,
    level: build.operatorInstance.level,
    attributes: { ...values.attributes },
    attack,
    attackDetail: {
      operatorBaseAttack: values.operatorBaseAttack,
      weaponBaseAttack: values.weaponBaseAttack,
      attackPercent: values.panelStats.attackPercent,
      flatAttack: values.panelStats.attackFlat,
    },
    attackBeforeAttributeScalar,
    attackBase: {
      rawValue: values.operatorBaseAttack + values.weaponBaseAttack,
      baseMultiplier: values.panelStats.attackPercent,
      baseFinalAddition: values.panelStats.attackFlat,
    },
    mainAttribute: build.operator.mainAttribute,
    secondaryAttribute: build.operator.secondaryAttribute,
    health,
    defense,
    criticalRate:
      resolveUpgradeBasePanelStat(0.05, 'criticalRate', values) + values.panelStats.criticalRate,
    criticalDamage: 0.5 + values.panelStats.criticalDamage,
    artsIntensity:
      resolveUpgradeBasePanelStat(0, 'artsIntensity', values) + values.panelStats.artsIntensity,
    ultimateEnergyGainEfficiency: 1 + values.panelStats.ultimateEnergyGainEfficiency,
    skillCooldownReduction: values.panelStats.skillCooldownReduction,
    staggerDamagePercent: values.panelStats.staggerDamagePercent,
    combatModifiers,
    receipt,
  };
}

/** 按 Build Resolver 的轨道顺序计算队伍静态面板。 */
export function resolveScenarioOperatorPanels(
  builds: readonly ResolvedScenarioBuild[],
): readonly ResolvedOperatorPanel[] {
  return builds.map(build => resolveOperatorPanel(build));
}
