import { describe, expect, it } from 'vitest';
import { DamageScaleAccumulator } from './damageScale';
import {
  DAMAGE_SCALE_ATTRIBUTE_KEYS,
  classifyDamageTags,
  injectDamageScaleAttributes,
  type DamageScaleAttributeSnapshot,
} from './damageScaleAttributes';

function attributes(
  values: Partial<DamageScaleAttributeSnapshot> = {},
): DamageScaleAttributeSnapshot {
  return Object.fromEntries(
    DAMAGE_SCALE_ATTRIBUTE_KEYS.map(key => [key, values[key] ?? 0]),
  ) as unknown as DamageScaleAttributeSnapshot;
}

describe('injectDamageScaleAttributes', () => {
  it('Shatter 单独携带或与晶异常标签并存，都只注入一次晶异常增伤', () => {
    expect(classifyDamageTags([], ['shatter'])).toEqual(['cryoAbnormal']);
    expect(classifyDamageTags(['cryoAbnormal'], ['shatter'])).toEqual(['cryoAbnormal']);
  });
  it('classifies native burst and abnormal damage tags', () => {
    expect(
      classifyDamageTags(['fireBurst', 'electricBurst', 'cryoAbnormal', 'natureAbnormal']),
    ).toEqual(['fireBurst', 'electricBurst', 'cryoAbnormal', 'natureAbnormal']);
  });

  it('accumulates typed, skill, and staggered-target increases in the normal zone', () => {
    const scales = new DamageScaleAccumulator();
    injectDamageScaleAttributes(scales, {
      damageType: 'heat',
      classifications: ['normalAttack', 'normalSkill'],
      defenderStaggered: true,
      attacker: attributes({
        heatDamageIncrease: 0.1,
        normalAttackDamageIncrease: 0.2,
        normalSkillDamageIncrease: 0.3,
        damageToStaggeredEnemyIncrease: 0.4,
      }),
      defender: attributes(),
    });

    expect(scales.getZoneValue('normal')).toBeCloseTo(2);
  });

  it('places burst/abnormal, enhanced, and vulnerability attributes in their native zones', () => {
    const scales = new DamageScaleAccumulator();
    injectDamageScaleAttributes(scales, {
      damageType: 'electric',
      classifications: ['electricBurst', 'electricAbnormal'],
      defenderStaggered: false,
      attacker: attributes({
        electricBurstDamageIncrease: 0.1,
        electricAbnormalDamageIncrease: 0.2,
        electricEnhancedDamageIncrease: 0.25,
      }),
      defender: attributes({ electricVulnerabilityIncrease: 0.4 }),
    });

    expect(scales.getZoneValue('abnormalAndBurst')).toBeCloseTo(1.3);
    expect(scales.getZoneValue('enhanced')).toBeCloseTo(1.25);
    expect(scales.getZoneValue('vulnerable')).toBeCloseTo(1.4);
  });

  it('skips typed attributes for true damage but preserves skill classification', () => {
    const scales = new DamageScaleAccumulator();
    injectDamageScaleAttributes(scales, {
      damageType: 'true',
      classifications: ['normalSkill'],
      defenderStaggered: false,
      attacker: attributes({
        physicalDamageIncrease: 9,
        physicalEnhancedDamageIncrease: 9,
        normalSkillDamageIncrease: 0.5,
      }),
      defender: attributes({ physicalVulnerabilityIncrease: 9 }),
    });

    expect(scales.getZoneValue('normal')).toBe(1.5);
    expect(scales.getZoneValue('enhanced')).toBe(1);
    expect(scales.getZoneValue('vulnerable')).toBe(1);
  });

  it('maps all active normal-attack variants to the shared native damage set', () => {
    expect(
      classifyDamageTags(['normalAttackLastCombo', 'powerAttack', 'plungingAttack', 'dashAttack']),
    ).toEqual(['normalAttack']);
  });
});
