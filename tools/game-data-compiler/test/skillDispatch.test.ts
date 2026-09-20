import { describe, expect, it } from 'vitest';
import {
  isToggleBuffSkillSource,
  readSkillCastType,
  readPassiveSkillType,
} from '../src/source/skillDispatch.ts';

describe('原生 Skill 工厂判别值', () => {
  it.each([null, undefined, true, '0', 'Unknown', -1, 2, 0.5, NaN, Infinity])(
    '未知值 %s 不默认为有效技能',
    value => {
      expect(() => readSkillCastType(value, 'skill.castType')).toThrow('skill.castType');
      expect(() => readPassiveSkillType(value, 'skill.passiveSkillType')).toThrow(
        'skill.passiveSkillType',
      );
    },
  );
  it('活动技能不解释未被原生分派读取的 passiveSkillType 残留', () => {
    expect(isToggleBuffSkillSource({ castType: 0, passiveSkillType: 'unknown' }, 'skill')).toBe(
      false,
    );
  });
});
