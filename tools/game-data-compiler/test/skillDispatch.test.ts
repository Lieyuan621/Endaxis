import { describe, expect, it } from 'vitest';
import { isToggleBuffSkillSource } from '../src/source/skillDispatch.ts';

describe('原生 Skill 工厂判别值', () => {
  it('活动技能不解释未被原生分派读取的 passiveSkillType 残留', () => {
    expect(isToggleBuffSkillSource({ castType: 0, passiveSkillType: 'unknown' }, 'skill')).toBe(
      false,
    );
  });
});
