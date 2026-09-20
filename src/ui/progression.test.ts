import { describe, expect, it } from 'vitest';
import {
  formatOperatorSkillLevel,
  getEquipmentLevelColor,
  getOperatorSkillMax,
  getWeaponTraitBounds,
  isEquipmentArtificable,
} from './progression';

describe('progression', () => {
  it('保留干员突破前后的技能等级上限', () => {
    expect(getOperatorSkillMax(40, false)).toBe(3);
    expect(getOperatorSkillMax(40, true)).toBe(6);
    expect(getOperatorSkillMax(80, false)).toBe(9);
    expect(getOperatorSkillMax(80, true)).toBe(12);
    expect(formatOperatorSkillLevel(12)).toBe('M3');
  });

  it('保留武器调校与潜能共同决定的词条范围', () => {
    expect(getWeaponTraitBounds(1, false, 0)).toEqual({
      skill1: { min: 1, max: 3 },
      skill2: { min: 1, max: 3 },
      skill3: { min: 1, max: 4 },
    });
    expect(getWeaponTraitBounds(90, true, 5)).toEqual({
      skill1: { min: 3, max: 9 },
      skill2: { min: 3, max: 9 },
      skill3: { min: 6, max: 9 },
    });
  });

  it('保留装备等级的展示颜色与精锻门槛', () => {
    expect(getEquipmentLevelColor(70)).toBe('#ffd700');
    expect(getEquipmentLevelColor(50)).toBe('#b37feb');
    expect(isEquipmentArtificable(50)).toBe(false);
    expect(isEquipmentArtificable(60)).toBe(true);
  });
});
