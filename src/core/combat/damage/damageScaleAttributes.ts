/**
 * 属性快照与七区间伤害倍率之间的原生映射层。
 * 只接受同一伤害包已经冻结的快照；调用过程中修改属性会破坏阶段语义。
 */
import type { DamageFeature, DamageTag, DamageType } from '../../game-data/operatorDefinition';
import { DamageScaleAccumulator } from './damageScale';

export const DAMAGE_SCALE_CLASSIFICATIONS = [
  'normalAttack',
  'normalSkill',
  'comboSkill',
  'ultimateSkill',
  'fireBurst',
  'electricBurst',
  'cryoBurst',
  'natureBurst',
  'fireAbnormal',
  'electricAbnormal',
  'cryoAbnormal',
  'natureAbnormal',
] as const;
/** 一次伤害用于选择属性倍率的语义分类。 */
export type DamageScaleClassification = (typeof DAMAGE_SCALE_CLASSIFICATIONS)[number];

export const DAMAGE_SCALE_ATTRIBUTE_KEYS = [
  'physicalDamageIncrease',
  'heatDamageIncrease',
  'electricDamageIncrease',
  'cryoDamageIncrease',
  'natureDamageIncrease',
  'etherDamageIncrease',
  'normalAttackDamageIncrease',
  'normalSkillDamageIncrease',
  'comboSkillDamageIncrease',
  'ultimateSkillDamageIncrease',
  'damageToStaggeredEnemyIncrease',
  'fireBurstDamageIncrease',
  'electricBurstDamageIncrease',
  'cryoBurstDamageIncrease',
  'natureBurstDamageIncrease',
  'fireAbnormalDamageIncrease',
  'electricAbnormalDamageIncrease',
  'cryoAbnormalDamageIncrease',
  'natureAbnormalDamageIncrease',
  'physicalEnhancedDamageIncrease',
  'heatEnhancedDamageIncrease',
  'electricEnhancedDamageIncrease',
  'cryoEnhancedDamageIncrease',
  'natureEnhancedDamageIncrease',
  'etherEnhancedDamageIncrease',
  'physicalVulnerabilityIncrease',
  'heatVulnerabilityIncrease',
  'electricVulnerabilityIncrease',
  'cryoVulnerabilityIncrease',
  'natureVulnerabilityIncrease',
  'etherVulnerabilityIncrease',
] as const;
/** 能够被映射进七区间累加器的属性键。 */
export type DamageScaleAttributeKey = (typeof DAMAGE_SCALE_ATTRIBUTE_KEYS)[number];
/** 单次命中冻结的完整伤害相关属性快照。 */
export type DamageScaleAttributeSnapshot = Readonly<Record<DamageScaleAttributeKey, number>>;

/** 将双方属性和命中分类注入倍率累加器的完整输入。 */
export interface InjectDamageScaleAttributesInput {
  readonly damageType: DamageType;
  readonly classifications: readonly DamageScaleClassification[];
  readonly attacker: DamageScaleAttributeSnapshot;
  readonly defender: DamageScaleAttributeSnapshot;
  readonly defenderStaggered: boolean;
}

const SKILL_CLASSIFICATION_ATTRIBUTES: Partial<
  Record<DamageScaleClassification, DamageScaleAttributeKey>
> = {
  normalAttack: 'normalAttackDamageIncrease',
  normalSkill: 'normalSkillDamageIncrease',
  comboSkill: 'comboSkillDamageIncrease',
  ultimateSkill: 'ultimateSkillDamageIncrease',
};

const ABNORMAL_CLASSIFICATION_ATTRIBUTES: Partial<
  Record<DamageScaleClassification, DamageScaleAttributeKey>
> = {
  fireBurst: 'fireBurstDamageIncrease',
  electricBurst: 'electricBurstDamageIncrease',
  cryoBurst: 'cryoBurstDamageIncrease',
  natureBurst: 'natureBurstDamageIncrease',
  fireAbnormal: 'fireAbnormalDamageIncrease',
  electricAbnormal: 'electricAbnormalDamageIncrease',
  cryoAbnormal: 'cryoAbnormalDamageIncrease',
  natureAbnormal: 'natureAbnormalDamageIncrease',
};

const TYPED_ATTRIBUTES: Partial<
  Record<
    DamageType,
    {
      readonly damageIncrease: DamageScaleAttributeKey;
      readonly enhanced: DamageScaleAttributeKey;
      readonly vulnerability: DamageScaleAttributeKey;
    }
  >
> = {
  physical: {
    damageIncrease: 'physicalDamageIncrease',
    enhanced: 'physicalEnhancedDamageIncrease',
    vulnerability: 'physicalVulnerabilityIncrease',
  },
  heat: {
    damageIncrease: 'heatDamageIncrease',
    enhanced: 'heatEnhancedDamageIncrease',
    vulnerability: 'heatVulnerabilityIncrease',
  },
  electric: {
    damageIncrease: 'electricDamageIncrease',
    enhanced: 'electricEnhancedDamageIncrease',
    vulnerability: 'electricVulnerabilityIncrease',
  },
  cryo: {
    damageIncrease: 'cryoDamageIncrease',
    enhanced: 'cryoEnhancedDamageIncrease',
    vulnerability: 'cryoVulnerabilityIncrease',
  },
  nature: {
    damageIncrease: 'natureDamageIncrease',
    enhanced: 'natureEnhancedDamageIncrease',
    vulnerability: 'natureVulnerabilityIncrease',
  },
  ether: {
    damageIncrease: 'etherDamageIncrease',
    enhanced: 'etherEnhancedDamageIncrease',
    vulnerability: 'etherVulnerabilityIncrease',
  },
};

/** 将已还原的属性到区间映射应用到现有累加器。 */
export function injectDamageScaleAttributes(
  accumulator: DamageScaleAccumulator,
  input: InjectDamageScaleAttributesInput,
  record?: (
    side: import('./damageScale').DamageScaleSide,
    zone: import('./damageScale').DamageScaleZone,
    attribute: DamageScaleAttributeKey,
  ) => void,
): void {
  const inject = (
    side: import('./damageScale').DamageScaleSide,
    zone: import('./damageScale').DamageScaleZone,
    attribute: DamageScaleAttributeKey,
  ) => {
    accumulator.modify(side, zone, input[side][attribute]);
    record?.(side, zone, attribute);
  };
  const typed = getTypedAttributes(input.damageType);
  if (typed !== undefined) {
    inject('attacker', 'normal', typed.damageIncrease);
  }

  for (const classification of input.classifications) {
    const skillAttribute = SKILL_CLASSIFICATION_ATTRIBUTES[classification];
    if (skillAttribute !== undefined) {
      inject('attacker', 'normal', skillAttribute);
    }
    const abnormalAttribute = ABNORMAL_CLASSIFICATION_ATTRIBUTES[classification];
    if (abnormalAttribute !== undefined) {
      inject('attacker', 'abnormalAndBurst', abnormalAttribute);
    }
  }

  if (input.defenderStaggered) {
    inject('attacker', 'normal', 'damageToStaggeredEnemyIncrease');
  }
  if (typed !== undefined) {
    inject('attacker', 'enhanced', typed.enhanced);
    inject('defender', 'vulnerable', typed.vulnerability);
  }
}

/** 转换新版干员 DSL 表达的主动技能分类。 */
export function classifyDamageTags(
  tags: readonly DamageTag[],
  features: readonly DamageFeature[] = [],
): readonly DamageScaleClassification[] {
  const classifications: DamageScaleClassification[] = [];
  if (
    tags.some(tag =>
      [
        'normalAttack',
        'normalAttackLastCombo',
        'powerAttack',
        'plungingAttack',
        'dashAttack',
      ].includes(tag),
    )
  ) {
    classifications.push('normalAttack');
  }
  if (tags.includes('normalSkill')) classifications.push('normalSkill');
  if (tags.includes('comboSkill')) classifications.push('comboSkill');
  if (tags.includes('ultimateSkill')) classifications.push('ultimateSkill');
  if (tags.includes('fireBurst')) classifications.push('fireBurst');
  if (tags.includes('electricBurst')) classifications.push('electricBurst');
  if (tags.includes('cryoBurst')) classifications.push('cryoBurst');
  if (tags.includes('natureBurst')) classifications.push('natureBurst');
  if (tags.includes('fireAbnormal')) classifications.push('fireAbnormal');
  if (tags.includes('electricAbnormal')) classifications.push('electricAbnormal');
  // 原生 CrystAbnormalInitial | Shatter 共用一次属性注入；不能因同时携带分类和特征而翻倍。
  if (tags.includes('cryoAbnormal') || features.includes('shatter'))
    classifications.push('cryoAbnormal');
  if (tags.includes('natureAbnormal')) classifications.push('natureAbnormal');
  return classifications;
}

function getTypedAttributes(damageType: DamageType):
  | {
      readonly damageIncrease: DamageScaleAttributeKey;
      readonly enhanced: DamageScaleAttributeKey;
      readonly vulnerability: DamageScaleAttributeKey;
    }
  | undefined {
  return TYPED_ATTRIBUTES[damageType];
}
