/** 同名不同配置的回调必须保持各自身份；分支追加程序不能改写已有编号。 */
import { expect, it } from 'vitest';
import { ProjectileCallbackPrograms } from './projectileCallbackPrograms';
import type { CompiledProjectileCallbackSkillProgram } from '../../compiler/combatProgram';

it('按程序对象登记，不按技能名或相同内容合并', () => {
  const directory = new ProjectileCallbackPrograms();
  const program: CompiledProjectileCallbackSkillProgram = {
    skillId: 'same',
    nativeSkillType: 'normalSkill',
    naturalDurationFrames: 1,
    initialBlackboard: { value: 1 },
    timelineActions: [],
    castResource: {
      costFrame: 0,
      cooldownSeconds: 0,
      maxChargeTime: 1,
      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
    },
  };
  const first = directory.register(program);
  const other = { ...program, initialBlackboard: { value: 2 } };
  const second = directory.register(other);
  expect(directory.register(program)).toBe(first);
  expect(second).not.toBe(first);
  expect(directory.register({ ...program })).not.toBe(first);
  expect(directory.resolve(first)).toBe(program);
  expect(directory.resolve(second)).toBe(other);
  expect(() => directory.resolve(100)).toThrow('missing projectile callback program');
});
