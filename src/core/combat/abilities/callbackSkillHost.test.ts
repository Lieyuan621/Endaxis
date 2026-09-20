/** 回调技能从中途恢复后继续走同一时间轴，不重放施放、支付与已有命中。 */
import { expect, it, vi } from 'vitest';
import { createCallbackSkillHostFactory } from './callbackSkillHost';
import { CombatClock, COMBAT_FRAME_INTERVAL } from '../time/combatClock';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { restoreProjectileCallback } from './projectileCallbackRuntime';
import { ProjectileCallbackPrograms } from './projectileCallbackPrograms';
import type { CompiledProjectileCallbackSkillProgram } from '../../compiler/combatProgram';

it('恢复回调宿主后逐帧状态和回执一致，绑定不分配编号或重放动作', () => {
  const program: CompiledProjectileCallbackSkillProgram = {
    skillId: 'callback',
    nativeSkillType: 'normalSkill',
    naturalDurationFrames: 4,
    castResource: {
      costFrame: 0,
      cooldownSeconds: 0,
      maxChargeTime: 1,
      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
    },
    initialBlackboard: {},
    timelineActions: [
      {
        startFrame: 2,
        endFrame: 3,
        sequence: {
          steps: [
            { kind: 'setContextFlag', parameters: { flag: 'hit', value: true, target: 'caster' } },
          ],
        },
      },
    ],
  };
  const context = {
    blackboard: new ActionBlackboard(),
    actionOwnerAbilityEntity: { kind: 'abilityEntity' as const, instanceId: 12 },
    skillCastInfo: {
      skillCastId: 42,
      originSkillId: 'source',
      originSkillType: 'comboSkill' as const,
      nonReturnedSpCost: 0,
    },
  };
  const clock = new CombatClock();
  const programs = new ProjectileCallbackPrograms();
  const receipt = new CombatReceiptCollector();
  const execute = vi.fn(() => true);
  const create = createCallbackSkillHostFactory({
    callbackPrograms: programs,
    clock,
    receipt,
    definitionOperatorId: 'owner',
    allocateSkillCastId: () => 1,
  });
  const original = create(program, context, { execute, evaluate: () => true });
  const other = create(program, context, { execute, evaluate: () => true });
  expect(other.skill.damageSnapshotProgram).toBe(original.skill.damageSnapshotProgram);
  expect(other.runtimeState.skill.damageSnapshots).not.toBe(
    original.runtimeState.skill.damageSnapshots,
  );
  expect(original.skill.damageSnapshotProgram).toBe(
    programs.resolveDamageSnapshots(programs.register(program)),
  );
  original.start();
  original.advance(COMBAT_FRAME_INTERVAL);
  clock.advanceFrame();
  const saved = structuredClone({
    host: original.runtimeState,
    clock: clock.runtimeState,
  });
  const nextClock = new CombatClock(saved.clock);
  const nextReceipt = new CombatReceiptCollector(receipt.history.snapshot());
  const nextExecute = vi.fn(() => true);
  const allocate = vi.fn(() => 2);
  const restore = createCallbackSkillHostFactory({
    callbackPrograms: programs,
    clock: nextClock,
    receipt: nextReceipt,
    definitionOperatorId: 'owner',
    allocateSkillCastId: allocate,
  });
  const bindRestored = vi.fn(restore);
  const pending = restoreProjectileCallback(
    {
      programId: programs.register(program),
      definitionOperatorId: 'owner',
      skillId: program.skillId,
      blackboard: structuredClone(context.blackboard.runtimeState),
      skillCastInfo: context.skillCastInfo,
      host: null,
    },
    13,
    programs,
    { execute: nextExecute, evaluate: () => true },
    {
      createCallbackSkillHost: bindRestored,
      scheduleProjectileFinishCallback: () => {
        throw new Error('no nested projectile in fixture');
      },
    },
    () => undefined,
  );
  pending.advance(COMBAT_FRAME_INTERVAL);
  pending.beforeReset();
  expect(bindRestored).not.toHaveBeenCalled();
  const projectile = restoreProjectileCallback(
    {
      programId: 0,
      definitionOperatorId: 'owner',
      skillId: program.skillId,
      blackboard: context.blackboard.runtimeState,
      skillCastInfo: context.skillCastInfo,
      host: saved.host,
    },
    12,
    programs,
    { execute: nextExecute, evaluate: () => true },
    {
      createCallbackSkillHost: bindRestored,
      scheduleProjectileFinishCallback: () => {
        throw new Error('no nested projectile in fixture');
      },
    },
    () => undefined,
  );
  expect(bindRestored).toHaveBeenCalledOnce();
  expect(allocate).not.toHaveBeenCalled();
  expect(nextExecute).not.toHaveBeenCalled();
  expect(nextReceipt.entries).toEqual(receipt.entries);
  expect(() => projectile.reach()).toThrow('already reached');
  for (let i = 0; i < 5; i++) {
    original.advance(COMBAT_FRAME_INTERVAL);
    projectile.advance(COMBAT_FRAME_INTERVAL);
    clock.advanceFrame();
    nextClock.advanceFrame();
    expect(projectile.runtimeState.host).toEqual(original.runtimeState);
    expect(nextReceipt.entries).toEqual(receipt.entries);
  }
  expect(execute).toHaveBeenCalledOnce();
  expect(nextExecute).toHaveBeenCalledOnce();
});
