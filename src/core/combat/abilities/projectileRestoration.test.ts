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
import type { CompiledProjectileCallbackSkillProgram } from '../../compiler/combatProgram';

it.each(
  [0, 1, 3, 5].flatMap(saveFrame =>
    (['finish', 'block'] as const).map(event => ({ saveFrame, event })),
  ),
)('$event 第 $saveFrame 帧保存后，投射物到回收的状态与回执逐帧一致', ({ saveFrame, event }) => {
  const program: CompiledProjectileCallbackSkillProgram = {
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
        sequence: {
          steps: [
            {
              kind: 'setContextFlag',
              parameters: { flag: 'hit', value: true, target: 'caster' },
            },
          ],
        },
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
    skillCastInfo: {
      skillCastId: 42,
      originSkillId: 'source',
      originSkillType: 'comboSkill',
      nonReturnedSpCost: 0,
    },
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
        throw new Error('callback must inherit its cast identity');
      },
    });
    return bindProjectileCallbackLifecycle(
      [
        restoreProjectileCallback(
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
        ),
      ],
      () => COMBAT_FRAME_INTERVAL,
    );
  };
  const oldExecute = vi.fn(() => true);
  original.launch({
    callbacks: [data],
    callbackPrograms: [program],
    finishDelaySeconds:
      event === 'block' ? 'firstTickBlock' : { reachAfterTicks: 2, maxDurationSeconds: 1 },
    recycleDelaySeconds: 0.1,
    ...bind(data, clock, receipt, oldExecute),
  });
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
      bind(saved.projectiles.instances.get(id)!.callbacks[0]!, nextClock, nextReceipt, nextExecute),
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
});
