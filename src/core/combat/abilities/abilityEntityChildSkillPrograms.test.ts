import { describe, expect, it } from 'vitest';
import type { CompiledAbilityEntityChildSkillProgram } from '../../compiler/combatProgram';
import { AbilityEntityChildSkillPrograms } from './abilityEntityChildSkillPrograms';

function program(skillId: string): CompiledAbilityEntityChildSkillProgram {
  return {
    nativeSkillType: 'normalSkill' as const,
    naturalDurationFrames: 30,
    castResource: {
      costFrame: 0,
      cooldownSeconds: 0,
      maxChargeTime: 1,
      cost: { resource: 'ultimateEnergy' as const, value: 0, availabilityThreshold: 0 },
    },
    skillId,
    initialBlackboard: {},
    timelineActions: [],
  };
}

describe('AbilityEntityChildSkillPrograms', () => {
  it('同一程序对象复用编号和伤害槽位映射，不合并内容相同的不同实例', () => {
    const programs = new AbilityEntityChildSkillPrograms();
    const firstProgram = program('child');
    const first = programs.register(firstProgram);
    expect(programs.register(firstProgram)).toBe(first);
    const second = programs.register(program('child'));
    expect(second.id).toBe(first.id + 1);
    expect(second.damageSnapshots).not.toBe(first.damageSnapshots);
    expect(programs.resolve(first.id)).toBe(first);
    expect(() => programs.resolve(99)).toThrow("program '99' does not exist");
  });
});
