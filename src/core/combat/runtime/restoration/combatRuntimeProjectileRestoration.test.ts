import { expect, it, vi } from 'vitest';
import type { CompiledProjectileCallbackSkillProgram } from '../../../compiler/combatProgram';
import { ActionBlackboard } from '../../actions/actionBlackboard';
import { createCallbackSkillHostFactory } from '../../abilities/callbackSkillHost';
import { CombatClock } from '../../time/combatClock';
import { CombatReceiptCollector } from '../../receipt/combatReceipt';
import {
  bindRestoredCombatProjectileRelations,
  createRestoredCombatProjectileDirectory,
} from './combatRuntimeProjectileRestoration';
import type { ProjectileCallbackState } from '../../state/instanceState';
import { ProjectileLifecycleRuntime } from '../../abilities/projectileLifecycleRuntime';
import { TimeDilationRuntime } from '../../time/timeDilationRuntime';

it('恢复后的投射物寿命读取自己的局部停顿，并随停顿解除恢复速度', () => {
  const original = new ProjectileLifecycleRuntime(() => 4);
  original.launch({
    finishDelaySeconds: 1,
    recycleDelaySeconds: 0,
    resolveTickDeltaSeconds: () => 1 / 30,
    finish: () => {},
    beforeReset: () => {},
  });
  const timeDilation = new TimeDilationRuntime({});
  timeDilation.startGlobal({
    durationSeconds: 10,
    slot: 'global',
    priority: 1,
    constantScale: 0.5,
  });
  const stop = timeDilation.startEntity({
    entityId: 'ability-entity:4',
    durationSeconds: 10,
    slot: 'TimeDilation/Layer/Entity/HitStop',
    priority: 1,
    curve: () => 0.25,
  });
  const restored = new ProjectileLifecycleRuntime(() => 5, {
    state: structuredClone(original.runtimeState),
  });
  bindRestoredCombatProjectileRelations({
    projectiles: restored,
    foundation: { shared: { timeDilation } } as never,
    entities: { targets: new Map() } as never,
    createCallbackBindings: () => {
      throw new Error('无回调投射物不应创建技能宿主');
    },
  });
  restored.advanceFrame();
  const remaining = restored.runtimeState.instances.get(4)!.remainingSeconds;
  expect(1 - remaining).toBeCloseTo((1 / 30) * 0.5 * 0.25, 6);
  timeDilation.stop(stop);
  restored.advanceFrame();
  expect(remaining - restored.runtimeState.instances.get(4)!.remainingSeconds).toBeCloseTo(
    (1 / 30) * 0.5,
    6,
  );
});

it('空投射物目录的关系阶段保持无操作', () => {
  const projectiles = new ProjectileLifecycleRuntime(() => 1, {
    state: { instances: new Map(), admittedAbilities: null, nextResetRegistrationId: 0 },
  });
  const createCallbackBindings = vi.fn();

  expect(() =>
    bindRestoredCombatProjectileRelations({
      projectiles,
      foundation: {} as never,
      entities: { targets: new Map() } as never,
      createCallbackBindings,
    }),
  ).not.toThrow();
  expect(createCallbackBindings).not.toHaveBeenCalled();
});

it.each(['hit', 'reach', 'finish', 'filteredHit'] as const)(
  '整场投射物阶段按保存事件 %s 恢复回调',
  mode => {
    const event = mode === 'filteredHit' ? 'hit' : mode;
    let acceptsHit = mode !== 'filteredHit';
    const evaluate = vi.fn((..._args: unknown[]) => acceptsHit);
    const program: CompiledProjectileCallbackSkillProgram = {
      skillId: 'callback',
      nativeSkillType: 'normalSkill',
      naturalDurationFrames: 1,
      initialBlackboard: {},
      castResource: {
        costFrame: 0,
        cooldownSeconds: 0,
        maxChargeTime: 1,
        cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
      },
      timelineActions: [],
    };
    const original = new ProjectileLifecycleRuntime(() => 4);
    const callback: ProjectileCallbackState = {
      event,
      ...(mode === 'filteredHit'
        ? { hitTagFilter: { tagQueryType: 'exceptAny' as const, tags: ['Immune/Physical'] } }
        : {}),
      programId: original.callbackPrograms.register(program),
      definitionOperatorId: 'definition-owner',
      skillId: program.skillId,
      blackboard: new ActionBlackboard().runtimeState,
      skillCastInfo: {
        skillCastId: 7,
        originSkillId: 'source',
        originSkillType: 'battleSkill',
        nonReturnedSpCost: 0,
      },
      host: null,
    };
    original.launch({
      callbacks: [callback],
      callbackPrograms: [program],
      finishDelaySeconds: mode === 'filteredHit' ? 10 : 'firstTickReach',
      ...(event === 'hit'
        ? {
            firstTickHit: { finishOnHit: false, retryRejectedHit: mode === 'filteredHit' },
            hit: () => true,
          }
        : {}),
      recycleDelaySeconds: 0,
      resolveTickDeltaSeconds: () => 1 / 30,
      finish: () => {},
      beforeReset: () => {},
    });
    const saved = structuredClone(original.runtimeState);
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const timeDilation = new TimeDilationRuntime({});
    timeDilation.startEntity({
      entityId: 'ability-entity:4',
      durationSeconds: 10,
      slot: 'TimeDilation/Layer/Entity/HitStop',
      priority: 1,
      curve: () => 0.25,
    });
    const foundation = {
      shared: {
        abilityEntityInstanceIds: { allocate: () => 5 },
        timeDilation,
        clock,
        receipt,
      },
    } as never;
    const restored = createRestoredCombatProjectileDirectory({
      preparation: {
        graph: { instances: { projectiles: saved } },
        programs: new Map([['definition-owner', {}]]),
      } as never,
      foundation,
      callbackPrograms: original.callbackPrograms,
    });
    const createHost = vi.fn(
      createCallbackSkillHostFactory({
        callbackPrograms: original.callbackPrograms,
        clock,
        receipt,
        definitionOperatorId: 'definition-owner',
        allocateSkillCastId: () => {
          throw new Error('callback inherits its cast id');
        },
      }),
    );
    const factory = createHost.getMockImplementation()!;
    const observedCandidates: unknown[] = [];
    createHost.mockImplementation((...args) => {
      observedCandidates.push(restored.getUnfinishedTargets());
      return factory(...args);
    });
    const requestedOwners: string[] = [];
    bindRestoredCombatProjectileRelations({
      projectiles: restored,
      foundation,
      entities: { targets: new Map() } as never,
      createCallbackBindings: input => {
        requestedOwners.push(input.definitionOperatorId);
        return {
          operations: { execute: () => true, evaluate },
          createCallbackSkillHost: createHost,
          launchProjectile: () => {
            throw new Error('fixture has no nested projectile');
          },
        };
      },
    });

    expect(restored.runtimeState).toBe(saved);
    expect(requestedOwners).toEqual(['definition-owner']);
    expect(createHost).not.toHaveBeenCalled();
    if (mode === 'filteredHit') {
      restored.advanceFrame();
      expect(createHost).not.toHaveBeenCalled();
      expect(restored.getUnfinishedTargets()).toEqual([{ kind: 'abilityEntity', instanceId: 4 }]);
      expect(evaluate.mock.calls[0]?.[0]).toMatchObject({
        kind: 'entityTagMatch',
        target: 'enemy',
        tags: ['Immune/Physical'],
      });
      acceptsHit = true;
    }
    restored.advanceFrame();
    expect(createHost).toHaveBeenCalledOnce();
    expect(observedCandidates).toEqual([
      event !== 'finish' ? [{ kind: 'abilityEntity', instanceId: 4 }] : [],
    ]);
    expect(saved.instances.get(4)!.callbacks[0]!.host).not.toBeNull();
    const execution = saved.instances.get(4)!.callbacks[0]!.host!.skill.execution;
    const before = execution.passedFrames;
    clock.advanceFrame();
    restored.beginAbilityFrame();
    restored.advanceAbilityFrame();
    expect(execution.passedFrames - before).toBeCloseTo(0.25);
  },
);
