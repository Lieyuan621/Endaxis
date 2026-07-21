import { describe, expect, it } from 'vitest';
import {
  BATTLE_LOG_UNKNOWN_SKILL_KIND,
  battleLogSkillKindLabel,
  sortBattleLogSkillKinds,
} from './battleLogSkillKinds';

describe('battleLogSkillKinds', () => {
  it('sorts known skill kinds in combat order', () => {
    expect(
      sortBattleLogSkillKinds(['ultimate', 'basicAttack', 'unknown', 'battleSkill', 'comboSkill']),
    ).toEqual(['basicAttack', 'battleSkill', 'comboSkill', 'ultimate', 'unknown']);
  });

  it('labels via skillType.* display keys', () => {
    const labels: Record<string, string> = {
      'skillType.attack': '普攻',
      'skillType.skill': '战技',
      'skillType.link': '连携',
      'skillType.ultimate': '终结技',
      'skillType.unknown': '技能',
    };
    const t = (key: string) => labels[key] || key;
    const te = (key: string) => key in labels;

    expect(battleLogSkillKindLabel(t, te, 'basicAttack')).toBe('普攻');
    expect(battleLogSkillKindLabel(t, te, 'battleSkill')).toBe('战技');
    expect(battleLogSkillKindLabel(t, te, 'comboSkill')).toBe('连携');
    expect(battleLogSkillKindLabel(t, te, BATTLE_LOG_UNKNOWN_SKILL_KIND)).toBe('技能');
  });
});
