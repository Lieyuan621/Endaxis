import {
  projectPrimaryAttributeKey,
  type CompiledAttributeModifierSource,
} from './attributeModifier.ts';
import type { AttributeTypeSource } from './attributeModifier.ts';

import type {
  BuildAttribute,
  BuildDamageScaleTarget,
  BuildPanelStat,
  LevelValues,
} from '../../../../../packages/game-data-contract/src/index.ts';
import type { CompiledBuildModifierDefinitionSource } from './formalBuildDefinition.ts';

export type ProjectedBuildAttribute = BuildAttribute;
export type ProjectedBuildPanelStat = BuildPanelStat | 'baseDefense';
export type ProjectedBuildDamageScale = BuildDamageScaleTarget;

/**
 * 正式贡献直接使用契约；唯一额外结果是装备顶层的基础防御，不能混入词条修正。
 * 数值形态不参与语义分派，单值和等级列使用同一投影。
 */
export type ProjectedBuildModifierSource<Value extends LevelValues = number> =
  | CompiledBuildModifierDefinitionSource<Value>
  | { readonly kind: 'panelStat'; readonly stat: 'baseDefense'; readonly value: Value };

export type BuildAttributeModifierProjectionSource<Value extends LevelValues = number> =
  | {
      readonly status: 'supported';
      readonly source: CompiledAttributeModifierSource<Value>;
      readonly modifier: ProjectedBuildModifierSource<Value>;
    }
  | {
      readonly status: 'scenario-omitted';
      readonly source: CompiledAttributeModifierSource<Value>;
      readonly reason:
        'playerDamageTakenRequiresEnemyActiveDamage' | 'shieldOutputDoesNotAffectStumpEnemyDamage';
    }
  | {
      readonly status: 'blocked';
      readonly source: CompiledAttributeModifierSource<Value>;
      readonly reason: string;
    };

/** 装备装配器先提升 baseDefense；其余结果本身就是正式贡献，无需再搬运字段。 */
export function isBuildContributionModifier<Value extends LevelValues>(
  modifier: ProjectedBuildModifierSource<Value>,
): modifier is CompiledBuildModifierDefinitionSource<Value> {
  return modifier.kind !== 'panelStat' || modifier.stat !== 'baseDefense';
}

const DAMAGE_SCALE_ATTRIBUTES: Readonly<
  Partial<Record<AttributeTypeSource, ProjectedBuildDamageScale>>
> = {
  NormalAttackDamageIncrease: 'normalAttack',
  NormalSkillDamageIncrease: 'battleSkill',
  ComboSkillDamageIncrease: 'comboSkill',
  UltimateSkillDamageIncrease: 'ultimate',
  PhysicalDamageIncrease: 'physical',
  FireDamageIncrease: 'heat',
  PulseDamageIncrease: 'electric',
  CrystDamageIncrease: 'cryo',
  NaturalDamageIncrease: 'nature',
  EtherDamageIncrease: 'ether',
  DamageToBrokenUnitIncrease: 'staggeredEnemy',
};

const PLAYER_DAMAGE_TAKEN_ATTRIBUTES = new Set([
  'PhysicalDamageTakenScalar',
  'FireDamageTakenScalar',
  'PulseDamageTakenScalar',
  'CrystDamageTakenScalar',
  'NaturalDamageTakenScalar',
  'EtherDamageTakenScalar',
]);

/**
 * 把干员养成、武器、装备共用的原生静态属性程序投影为 Next 构筑语义。
 * 每个分支同时校验原生目标和公式槽；同名属性若换槽，必须重新取证。
 */
export function projectBuildAttributeModifier<Value extends LevelValues>(
  source: CompiledAttributeModifierSource<Value>,
): BuildAttributeModifierProjectionSource<Value> {
  if (PLAYER_DAMAGE_TAKEN_ATTRIBUTES.has(source.declaredAttributeType)) {
    if (
      source.target === 'specific' &&
      (source.slot === 'baseFinalMultiplier' ||
        (source.declaredAttributeType === 'EtherDamageTakenScalar' &&
          source.slot === 'baseAddition'))
    ) {
      return {
        status: 'scenario-omitted',
        source,
        reason: 'playerDamageTakenRequiresEnemyActiveDamage',
      };
    }
    return blocked(source, 'player damage-taken attribute uses an unverified target or slot');
  }

  // Main/Sub 由原生 AttributeModifierTargetResolver 选择装备者的主/副属性；此时声明的
  // AttributeType 只是序列化残留，不能抢先按 Specific 分支解释。
  if (
    (source.target === 'main' || source.target === 'sub') &&
    (source.slot === 'baseAddition' || source.slot === 'baseMultiplier')
  ) {
    return supported(source, {
      kind: 'attribute',
      attribute: source.target === 'main' ? 'main' : 'secondary',
      operation: source.slot === 'baseAddition' ? 'flat' : 'percent',
      value: source.value,
    });
  }

  const primaryAttribute = projectPrimaryAttributeKey(source.declaredAttributeType);
  if (primaryAttribute !== null) {
    if (source.target !== 'specific' || source.slot !== 'baseAddition') {
      return blocked(source, 'specific primary attribute requires BaseAddition');
    }
    return supported(source, {
      kind: 'attribute',
      attribute: primaryAttribute,
      operation: 'flat',
      value: source.value,
    });
  }

  if (
    source.declaredAttributeType === 'ShieldOutputIncrease' &&
    source.target === 'specific' &&
    source.slot === 'baseAddition'
  ) {
    return {
      status: 'scenario-omitted',
      source,
      reason: 'shieldOutputDoesNotAffectStumpEnemyDamage',
    };
  }

  const panel = projectPanelStat(source);
  if (panel !== null) return supported(source, panel);

  const damageScale = DAMAGE_SCALE_ATTRIBUTES[source.declaredAttributeType];
  if (damageScale !== undefined) {
    if (
      source.target !== 'specific' ||
      (source.slot !== 'baseAddition' && source.slot !== 'addition')
    ) {
      return blocked(
        source,
        'damage-increase attribute requires Specific/BaseAddition or Addition',
      );
    }
    return supported(source, {
      kind: 'damageScale',
      target: damageScale,
      slot: source.slot,
      value: source.value,
    });
  }

  if (source.declaredAttributeType === 'HealOutputIncrease') {
    if (source.target !== 'specific' || source.slot !== 'baseAddition') {
      return blocked(source, 'HealOutputIncrease requires Specific/BaseAddition');
    }
    return supported(source, {
      kind: 'staticHealingIncrease',
      target: 'output',
      value: source.value,
    });
  }

  if (source.declaredAttributeType === 'ComboSkillCooldownScalar') {
    if (source.target !== 'specific' || source.slot !== 'baseFinalMultiplier') {
      return blocked(source, 'ComboSkillCooldownScalar requires Specific/BaseFinalMultiplier');
    }
    return supported(source, {
      kind: 'skillCooldownMultiplier',
      skillTypes: 'comboSkill',
      value: source.value,
    });
  }

  return blocked(
    source,
    `unsupported build attribute shape ${source.target}/${source.declaredAttributeType}/${source.slot}`,
  );
}

function projectPanelStat<Value extends LevelValues>(
  source: CompiledAttributeModifierSource<Value>,
): Extract<ProjectedBuildModifierSource<Value>, { kind: 'panelStat' }> | null {
  if (source.target !== 'specific') return null;
  const key = `${source.declaredAttributeType}/${source.slot}`;
  const stat = {
    'Def/baseAddition': 'baseDefense',
    'Atk/baseMultiplier': 'attackPercent',
    'Atk/baseFinalAddition': 'attackFlat',
    'MaxHp/baseMultiplier': 'healthPercent',
    'MaxHp/baseFinalAddition': 'healthFlat',
    'CriticalRate/baseAddition': 'criticalRate',
    'PhysicalAndSpellInflictionEnhance/baseAddition': 'artsIntensity',
    'UltimateSpGainScalar/baseAddition': 'ultimateEnergyGainEfficiency',
    'PoiseDamageOutputScalar/baseAddition': 'staggerDamagePercent',
  }[key] as ProjectedBuildPanelStat | undefined;
  return stat === undefined ? null : { kind: 'panelStat', stat, value: source.value };
}

function supported<Value extends LevelValues>(
  source: CompiledAttributeModifierSource<Value>,
  modifier: ProjectedBuildModifierSource<Value>,
): BuildAttributeModifierProjectionSource<Value> {
  return { status: 'supported', source, modifier };
}

function blocked<Value extends LevelValues>(
  source: CompiledAttributeModifierSource<Value>,
  reason: string,
): BuildAttributeModifierProjectionSource<Value> {
  return { status: 'blocked', source, reason };
}
