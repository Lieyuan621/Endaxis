import { describe, expect, it, vi } from 'vitest';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';
import {
  SkillCooldownOperationExecutor,
  adjustMatchingSkillCooldowns,
} from './skillCooldownOperationExecutor';
import { SkillCooldown } from './skillCooldown';

it('按原生别名匹配共享账本，去重且不修改其他干员', () => {
  const cooldown = new SkillCooldown(100);
  cooldown.setRemainingFrames(80);
  const other = new SkillCooldown(100);
  other.setRemainingFrames(70);
  const binding = {
    program: { operatorId: 'a', skillId: 'skill', skillType: 'comboSkill' as const },
    skillIds: new Set(['native-skill']),
    cooldown,
  };
  const ledgers = new Map([
    ['a\u0000skill', binding],
    ['duplicate-reference', binding],
    [
      'b\u0000skill',
      { ...binding, program: { ...binding.program, operatorId: 'b' }, cooldown: other },
    ],
  ]);
  const record = vi.fn();
  expect(
    adjustMatchingSkillCooldowns(
      ledgers,
      'a',
      { kind: 'id', skillId: 'native-skill' },
      'reduce',
      'absoluteFrames',
      20,
      record,
    ),
  ).toBe(1);
  expect(cooldown.snapshot.remainingFrames).toBe(60);
  expect(other.snapshot.remainingFrames).toBe(70);
  expect(record).toHaveBeenCalledTimes(1);
  expect(record).toHaveBeenCalledWith('skill', expect.objectContaining({ remainingFrames: 60 }));
  record.mockClear();
  expect(
    adjustMatchingSkillCooldowns(
      ledgers,
      'a',
      { kind: 'type', skillType: 'comboSkill' },
      'set',
      'baseDurationRatio',
      0.6,
      record,
    ),
  ).toBe(1);
  // 原实现把有效 set 视为一次修改，即使剩余值相同也发布回执。
  expect(record).toHaveBeenCalledTimes(1);
  cooldown.setRemainingFrames(0);
  record.mockClear();
  expect(
    adjustMatchingSkillCooldowns(
      ledgers,
      'a',
      { kind: 'type', skillType: 'comboSkill' },
      'reduce',
      'absoluteFrames',
      20,
      record,
    ),
  ).toBe(0);
  expect(record).not.toHaveBeenCalled();
});

const delegate = {
  execute: vi.fn(() => true),
  evaluate: vi.fn(() => true),
};

function cooldownStep(
  operation: 'reduce' | 'set',
  basis: 'baseDurationRatio' | 'absoluteSeconds',
  value: number,
): ResolvedCombatOperationStep {
  return {
    kind: 'adjustSkillCooldown',
    parameters: {
      target: 'caster',
      skill: { kind: 'id', skillId: 'skill.target' },
      operation,
      basis,
      value: { kind: 'constant', value },
    },
  } as ResolvedCombatOperationStep;
}

describe('SkillCooldownOperationExecutor', () => {
  it('dispatches native reduce and set bases with seconds converted to combat frames', () => {
    const reduce = vi.fn(() => 1);
    const reduceFrames = vi.fn(() => 1);
    const setRatio = vi.fn(() => 1);
    const setFrames = vi.fn(() => 1);
    const executor = new SkillCooldownOperationExecutor({
      reduceByBaseDurationRatio: reduce,
      reduceByAbsoluteFrames: reduceFrames,
      setByBaseDurationRatio: setRatio,
      setByAbsoluteFrames: setFrames,
      delegate,
    });
    const context = { blackboard: new Map() } as never;

    executor.execute(cooldownStep('reduce', 'baseDurationRatio', 0.5), context);
    executor.execute(cooldownStep('reduce', 'absoluteSeconds', 2), context);
    executor.execute(cooldownStep('set', 'baseDurationRatio', 1), context);
    executor.execute(cooldownStep('set', 'absoluteSeconds', 2), context);

    expect(reduce).toHaveBeenCalledWith({ kind: 'id', skillId: 'skill.target' }, 0.5);
    expect(reduceFrames).toHaveBeenCalledWith({ kind: 'id', skillId: 'skill.target' }, 60);
    expect(setRatio).toHaveBeenCalledWith({ kind: 'id', skillId: 'skill.target' }, 1);
    expect(setFrames).toHaveBeenCalledWith({ kind: 'id', skillId: 'skill.target' }, 60);
  });
});
