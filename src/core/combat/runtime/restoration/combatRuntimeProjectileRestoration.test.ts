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

it('整场投射物阶段按保存的定义干员恢复待命中回调', () => {
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
    callback,
    callbackProgram: program,
    finishDelaySeconds: 'firstTickReach',
    recycleDelaySeconds: 0,
    resolveTickDeltaSeconds: () => 1 / 30,
    finish: () => {},
    beforeReset: () => {},
  });
  const saved = structuredClone(original.runtimeState);
  const clock = new CombatClock();
  const receipt = new CombatReceiptCollector();
  const foundation = {
    shared: {
      abilityEntityInstanceIds: { allocate: () => 5 },
      timeDilation: null,
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
  const requestedOwners: string[] = [];
  bindRestoredCombatProjectileRelations({
    projectiles: restored,
    foundation,
    entities: { targets: new Map() } as never,
    createCallbackBindings: input => {
      requestedOwners.push(input.definitionOperatorId);
      return {
        operations: { execute: () => true, evaluate: () => true },
        createCallbackSkillHost: createHost,
        scheduleProjectileFinishCallback: () => {
          throw new Error('fixture has no nested projectile');
        },
      };
    },
  });

  expect(restored.runtimeState).toBe(saved);
  expect(requestedOwners).toEqual(['definition-owner']);
  expect(createHost).not.toHaveBeenCalled();
  restored.advanceFrame();
  expect(createHost).toHaveBeenCalledOnce();
  expect(saved.instances.get(4)!.callback!.host).not.toBeNull();
});
