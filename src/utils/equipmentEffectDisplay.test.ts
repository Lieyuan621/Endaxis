import { describe, expect, it } from 'vitest';
import {
  formatEquipmentEffectLabel,
  getEquipmentEffectModifierIds,
} from './equipmentEffectDisplay';

const staggeredTargetDamageEffect = {
  kind: 'status',
  stat: { modifier: 'dmgBonus' },
  condition: { kind: 'enemyStaggered' },
};

describe('equipment effect display', () => {
  it('maps a staggered-target damage bonus to its dedicated affix', () => {
    expect(
      getEquipmentEffectModifierIds(
        staggeredTargetDamageEffect.stat,
        staggeredTargetDamageEffect.condition,
      ),
    ).toEqual(['broken_dmg_bonus']);
  });

  it('uses the staggered-target label instead of a generic damage label', () => {
    const t = (key: string) =>
      key === 'timelineGrid.equipmentDialog.affixFilters.broken_dmg_bonus'
        ? '对失衡目标伤害加成'
        : key;

    expect(formatEquipmentEffectLabel(staggeredTargetDamageEffect, t, 'zh-CN')).toBe(
      '对失衡目标伤害加成',
    );
  });
});
