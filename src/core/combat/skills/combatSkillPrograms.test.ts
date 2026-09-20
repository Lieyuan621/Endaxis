import { expect, it } from 'vitest';
import type { CompiledSkillProgram } from '../../compiler/combatProgram';
import { CombatSkillPrograms, combatSkillProgramKey } from './combatSkillPrograms';

function skill(overrides: Partial<CompiledSkillProgram> = {}): CompiledSkillProgram {
  return {
    ...overrides,
    operatorId: overrides.operatorId ?? 'operator',
    skillGroupKey: overrides.skillGroupKey ?? 'battleSkill',
    skillId: overrides.skillId ?? 'skill',
    skillType: overrides.skillType ?? 'battleSkill',
    skillLevel: overrides.skillLevel ?? 1,
    timelineBlockFrames: overrides.timelineBlockFrames ?? 0,
    costs: overrides.costs ?? [],
    initialBlackboard: overrides.initialBlackboard ?? {},
    timelineActions: overrides.timelineActions ?? [],
  };
}

it('普通技能程序在同一切面树中复用伤害快照槽位映射', () => {
  const programs = new CombatSkillPrograms();
  const program = skill();
  const first = programs.register(program);
  const second = programs.register(program);

  expect(second).toBe(first);
  expect(second.damageSnapshots).toBe(first.damageSnapshots);
  expect(programs.resolve(combatSkillProgramKey(program))).toBe(first);
});

it('新施放只绑定身份并共享固定定义和快照槽位', () => {
  const programs = new CombatSkillPrograms();
  const definition = skill({ timelineActions: [] });
  const first = programs.registerCast(definition, 'first');
  const second = programs.registerCast(definition, 'second');
  expect(first.program).toBe(definition);
  expect(second.program).toBe(definition);
  expect(first.castId).toBe('first');
  expect(second.castId).toBe('second');
  expect(second.program.timelineActions).toBe(definition.timelineActions);
  expect(first.damageSnapshots).toBe(second.damageSnapshots);
  expect(programs.registerCast(definition, 'first')).toBe(first);
  expect(() => programs.registerCast({ ...definition }, 'first')).toThrow('another definition');
});

it('相同技能身份不能在同一目录绑定另一个程序对象', () => {
  const programs = new CombatSkillPrograms();
  programs.registerCast(skill(), 'cast');

  expect(() => programs.registerCast(skill(), 'cast')).toThrow(
    'is already bound to another definition',
  );
});

it('分支共享既有程序及槽位，但后续登记不会写入父目录或保存点', () => {
  const root = new CombatSkillPrograms();
  const past = skill();
  const binding = root.registerCast(past, 'past');
  const saved = root.fork();
  const trial = saved.fork();
  expect(trial.resolve(combatSkillProgramKey(past, 'past'))).toBe(binding);
  const first = skill({ initialBlackboard: { value: 1 } });
  const second = skill({ initialBlackboard: { value: 2 } });
  trial.registerCast(first, 'future');
  expect(() => saved.resolve(combatSkillProgramKey(first, 'future'))).toThrow('does not exist');
  root.registerCast(second, 'future');
  expect(root.resolve(combatSkillProgramKey(second, 'future')).program).toBe(second);
  expect(trial.resolve(combatSkillProgramKey(first, 'future')).program).toBe(first);
});
