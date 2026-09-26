/** 回调技能从中途恢复后继续走同一时间轴，不重放施放、支付与已有命中。 */
import { expect, it, vi } from 'vitest';
import { createCallbackSkillHostFactory } from './callbackSkillHost';
import { CombatClock, COMBAT_FRAME_INTERVAL } from '../time/combatClock';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { restoreProjectileCallback, ProjectileCallbackRuntime } from './projectileCallbackRuntime';
import { ProjectileCallbackPrograms } from './projectileCallbackPrograms';
import type { CompiledAbilityEntityChildSkillProgram } from '../../compiler/combatProgram';
import { chainEntry } from '../../../test/compiledGraphEntry';

it('回调重复命中不能越过自身冷却，冷却结束后才再次执行', () => {
  const program: CompiledAbilityEntityChildSkillProgram = {
    skillId: 'cooldown-hit',
    nativeSkillType: 'normalSkill',
    naturalDurationFrames: 3,
    castResource: {
      costFrame: 0,
      cooldownSeconds: 10,
      maxChargeTime: 1,
      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
    },
    initialBlackboard: {},
    timelineActions: [
      {
        startFrame: 0,
        endFrame: 0,
        sequence: chainEntry('callback', [
          {
            kind: 'setContextFlag',
            parameters: { flag: 'hit', value: true, target: 'caster' },
          },
        ]),
      },
    ],
  };
  const execute = vi.fn(() => true);
  const clock = new CombatClock();
  const create = createCallbackSkillHostFactory({
    clock,
    receipt: new CombatReceiptCollector(),
    definitionOperatorId: 'owner',
    allocateSkillCastId: () => 1,
  });
  const context = {
    blackboard: new ActionBlackboard(),
    actionSourceId: 'launcher',
    actionOwnerAbilityEntity: { kind: 'abilityEntity' as const, instanceId: 1 },
    skillCastInfo: {
      skillCastId: 1,
      originSkillId: 'source',
      originSkillType: 'comboSkill' as const,
      nonReturnedSpCost: 0,
    },
  };
  const host = create(program, context, { execute, evaluate: () => true });
  host.start();
  expect(execute).toHaveBeenCalledOnce();
  expect(execute).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      actionOwnerId: 'ability-entity:1',
      actionSourceId: 'launcher',
    }),
  );
  host.start();
  expect(execute).toHaveBeenCalledOnce();
  clock.advanceFrame();
  host.advance(9);
  host.start();
  expect(execute).toHaveBeenCalledOnce();
  const restoredExecute = vi.fn(() => true);
  const restored = create(
    program,
    context,
    { execute: restoredExecute, evaluate: () => true },
    {
      state: structuredClone(host.runtimeState),
      damageSnapshotProgram: host.skill.damageSnapshotProgram,
      resolveAttachedBuff: () => undefined,
    },
  );
  restored.start();
  expect(restoredExecute).not.toHaveBeenCalled();
  host.advance(1);
  restored.advance(1);
  host.start();
  restored.start();
  expect(execute).toHaveBeenCalledTimes(2);
  expect(restoredExecute).toHaveBeenCalledOnce();
  expect(restoredExecute).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      actionOwnerId: 'ability-entity:1',
      actionSourceId: 'launcher',
    }),
  );
});

it('多目标命中复用回调宿主，并逐次传递各自的输入目标', () => {
  const program: CompiledAbilityEntityChildSkillProgram = {
    skillId: 'heal-hit',
    nativeSkillType: 'normalSkill',
    naturalDurationFrames: 3,
    castResource: {
      costFrame: 0,
      cooldownSeconds: 0,
      maxChargeTime: 1,
      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
    },
    initialBlackboard: {},
    timelineActions: [
      {
        startFrame: 0,
        endFrame: 0,
        sequence: chainEntry('callback', [
          { kind: 'setContextFlag', parameters: { flag: 'hit', value: true, target: 'caster' } },
        ]),
      },
    ],
  };
  const create = createCallbackSkillHostFactory({
    clock: new CombatClock(),
    receipt: new CombatReceiptCollector(),
    definitionOperatorId: 'owner',
    allocateSkillCastId: () => 1,
  });
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
  const targets = ['first', 'second'].map(operatorId => ({
    kind: 'operator' as const,
    operatorId,
  }));
  const seen: unknown[] = [];
  const factory = vi.fn(() =>
    create(program, context, {
      prepare: (_step, input) => {
        expect(input?.skillCastInfo?.originSkillId).toBe('source');
      },
      execute: (_step, input) => {
        seen.push(input?.actionInputTarget);
        return true;
      },
      evaluate: () => true,
    }),
  );
  const callback = new ProjectileCallbackRuntime(
    {
      event: 'hit',
      inputTargets: targets,
      programId: null,
      definitionOperatorId: 'owner',
      skillId: program.skillId,
      blackboard: context.blackboard.runtimeState,
      skillCastInfo: context.skillCastInfo,
      host: null,
    },
    factory,
  );
  expect(callback.hit()).toBe(true);
  expect(factory).toHaveBeenCalledOnce();
  expect(seen).toEqual(targets);
  callback.advance(COMBAT_FRAME_INTERVAL);
  callback.hit();
  expect(factory).toHaveBeenCalledOnce();
  expect(seen).toEqual([...targets, ...targets]);
});

it('恢复回调宿主后逐帧状态和回执一致，绑定不分配编号或重放动作', () => {
  const program: CompiledAbilityEntityChildSkillProgram = {
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
        sequence: chainEntry('callback', [
          { kind: 'setContextFlag', parameters: { flag: 'hit', value: true, target: 'caster' } },
        ]),
      },
    ],
  };
  const context = {
    actionInputTarget: { kind: 'operator' as const, operatorId: 'original-controlled' },
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
  expect(original.runtimeState.skill.execution.inputTarget).toEqual(context.actionInputTarget);
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
      event: 'finish',
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
      launchProjectile: () => {
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
      event: 'finish',
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
      launchProjectile: () => {
        throw new Error('no nested projectile in fixture');
      },
    },
    () => undefined,
  );
  expect(bindRestored).toHaveBeenCalledOnce();
  expect(allocate).not.toHaveBeenCalled();
  expect(nextExecute).not.toHaveBeenCalled();
  expect(nextReceipt.entries).toEqual(receipt.entries);
  expect(() => projectile.start()).toThrow('already started');
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
