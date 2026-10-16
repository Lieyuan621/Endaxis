/** 联合验证投射物寿命、回调技能和回执恢复；保存点覆盖命中前后。 */
import { expect, it, vi } from 'vitest';
import { ProjectileLifecycleRuntime } from './projectileLifecycleRuntime';
import { ProjectileCallbackPrograms } from './projectileCallbackPrograms';
import {
  restoreProjectileCallback,
  bindProjectileCallbackLifecycle,
} from './projectileCallbackRuntime';
import { createCallbackSkillHostFactory } from './callbackSkillHost';
import { CombatClock, COMBAT_FRAME_INTERVAL } from '../time/combatClock';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { ActionBlackboard } from '../actions/actionBlackboard';
import type { ProjectileCallbackState } from '../state/instanceState';
import type { CompiledAbilityEntityChildSkillProgram } from '../../compiler/combatProgram';
import { chainEntry } from '../../../test/compiledGraphEntry';

it('命中回调中的动作结束不会再触发超时结束技能', () => {
  const runtime = new ProjectileLifecycleRuntime();
  const finish = vi.fn();
  const ref = runtime.launch({
    finishDelaySeconds: 10,
    recycleDelaySeconds: 1,
    firstTickHit: { finishOnHit: true },
    hit: () => {
      runtime.finishByAction(ref.target);
      return true;
    },
    finish,
    beforeReset: () => {},
    resolveTickDeltaSeconds: () => COMBAT_FRAME_INTERVAL,
  });
  runtime.advanceFrame();
  expect(runtime.getUnfinishedTargets()).toEqual([]);
  expect(finish).not.toHaveBeenCalled();
});

it('动作结束投射物不施放结束技能，恢复后仍按同一延迟回收', () => {
  const finish = vi.fn();
  const reset = vi.fn();
  const ports = {
    finish,
    block: finish,
    beforeReset: reset,
    resolveTickDeltaSeconds: () => COMBAT_FRAME_INTERVAL,
  };
  const original = new ProjectileLifecycleRuntime(() => 1);
  const ref = original.launch({
    ...ports,
    finishDelaySeconds: 'firstTickBlock',
    recycleDelaySeconds: 0.05,
  });
  expect(original.finishByAction(ref.target)).toBe(true);
  original.advanceFrame();
  const saved = structuredClone(original.runtimeState);
  const remaining = saved.instances.get(1)!.remainingSeconds;
  expect(original.finishByAction(ref.target)).toBe(true);
  expect(original.runtimeState.instances.get(1)!.remainingSeconds).toBe(remaining);
  const restoredReset = vi.fn();
  const restored = new ProjectileLifecycleRuntime(() => 2, {
    state: structuredClone(saved),
    resolveHost: () => ({ ...ports, beforeReset: restoredReset }),
  });
  for (let index = 0; index < 4; index++) {
    original.advanceFrame();
    restored.advanceFrame();
    expect(restored.runtimeState).toEqual(original.runtimeState);
  }
  expect(finish).not.toHaveBeenCalled();
  expect(reset).toHaveBeenCalledOnce();
  expect(restoredReset).toHaveBeenCalledOnce();
  expect(original.activeCount).toBe(0);
});

it.each(
  [0, 1, 3, 5].flatMap(saveFrame =>
    (['finish', 'block', 'launch'] as const).flatMap(event =>
      [true, false].map(inheritCast => ({ saveFrame, event, inheritCast })),
    ),
  ),
)(
  '$event 第 $saveFrame 帧保存，继承施放=$inheritCast：恢复后状态与回执逐帧一致',
  ({ saveFrame, event, inheritCast }) => {
    const program: CompiledAbilityEntityChildSkillProgram = {
      skillId: 'callback',
      nativeSkillType: 'normalSkill',
      naturalDurationFrames: 4,
      initialBlackboard: {},
      castResource: {
        costFrame: 0,
        cooldownSeconds: 0,
        maxChargeTime: 1,
        cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
      },
      timelineActions: [
        {
          startFrame: 2,
          endFrame: 3,
          sequence: chainEntry('projectile-restoration', [
            {
              kind: 'triggerCustomAbilityEvent',
              parameters: { eventName: 'hit', eventParam: 0, target: 'caster' as const },
            },
          ]),
        },
      ],
    };
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const original = new ProjectileLifecycleRuntime(() => 1);
    const programs: ProjectileCallbackPrograms = original.callbackPrograms;
    const data: ProjectileCallbackState = {
      event,
      programId: programs.register(program),
      definitionOperatorId: 'owner',
      skillId: program.skillId,
      blackboard: new ActionBlackboard().runtimeState,
      skillCastInfo: inheritCast
        ? {
            skillCastId: 42,
            originSkillId: 'source',
            originSkillType: 'comboSkill',
            nonReturnedSpCost: 0,
          }
        : null,
      host: null,
    };
    const bind = (
      state: ProjectileCallbackState,
      branchClock: CombatClock,
      branchReceipt: CombatReceiptCollector,
      execute: () => boolean,
    ) => {
      const create = createCallbackSkillHostFactory({
        clock: branchClock,
        receipt: branchReceipt,
        definitionOperatorId: 'owner',
        callbackPrograms: programs,
        allocateSkillCastId: () => {
          if (!inheritCast) return 42;
          throw new Error('callback must inherit its cast identity');
        },
      });
      const callback = restoreProjectileCallback(
        state,
        1,
        programs,
        { execute, evaluate: () => true },
        {
          createCallbackSkillHost: create,
          launchProjectile: () => {
            throw new Error('no nested launch');
          },
        },
        () => undefined,
      );
      return {
        ...bindProjectileCallbackLifecycle([callback], () => COMBAT_FRAME_INTERVAL),
        startLaunch: () => callback.start({ kind: 'abilityEntity', instanceId: 1 }),
      };
    };
    const oldExecute = vi.fn(() => true);
    const originalPorts = bind(data, clock, receipt, oldExecute);
    original.launch({
      callbacks: [data],
      callbackPrograms: [program],
      finishDelaySeconds:
        event === 'block' ? 'firstTickBlock' : { reachAfterTicks: 2, maxDurationSeconds: 1 },
      recycleDelaySeconds: 0.1,
      ...originalPorts,
    });
    if (event === 'launch') originalPorts.startLaunch();
    const advance = (runtime: ProjectileLifecycleRuntime, branchClock: CombatClock) => {
      runtime.beginAbilityFrame();
      runtime.advanceAbilityFrame();
      runtime.advanceFrame();
      branchClock.advanceFrame();
    };
    for (let i = 0; i < saveFrame; i++) advance(original, clock);
    const saved = structuredClone({
      projectiles: original.runtimeState,
      clock: clock.runtimeState,
    });
    const nextClock = new CombatClock(saved.clock);
    const nextReceipt = new CombatReceiptCollector(receipt.history.snapshot());
    const nextExecute = vi.fn(() => true);
    const allocate = vi.fn(() => 2);
    const restored = new ProjectileLifecycleRuntime(allocate, {
      state: saved.projectiles,
      callbackPrograms: programs,
      resolveHost: id =>
        bind(
          saved.projectiles.instances.get(id)!.callbacks[0]!,
          nextClock,
          nextReceipt,
          nextExecute,
        ),
      resolveResetHandler: () => {
        throw new Error('no reset listener');
      },
    });
    expect(allocate).not.toHaveBeenCalled();
    expect(nextExecute).not.toHaveBeenCalled();
    expect(nextReceipt.entries).toEqual(receipt.entries);
    for (let i = saveFrame; i < 15; i++) {
      advance(original, clock);
      advance(restored, nextClock);
      expect(restored.runtimeState).toEqual(original.runtimeState);
      expect(nextReceipt.entries).toEqual(receipt.entries);
    }
    expect(original.activeCount).toBe(0);
    expect(restored.activeCount).toBe(0);
    expect(oldExecute).toHaveBeenCalledOnce();
  },
);
