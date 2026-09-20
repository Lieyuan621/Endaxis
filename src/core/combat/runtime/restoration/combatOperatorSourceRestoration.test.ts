import { expect, it, vi } from 'vitest';
import type { CompiledOperatorPassiveProgram } from '../../../compiler/combatProgram';
import { ActionBlackboard } from '../../actions/actionBlackboard';
import { createAbilitySystemState, createOperatorCenterState } from '../../state/abilityState';
import { CombatActionSequenceRuntime } from '../../actions/combatActionSequenceRuntime';
import { createCombatOperationHostState } from '../../state/actionState';
import { CombatOperationPrograms } from '../../actions/combatOperationPrograms';
import { bindRestoredCombatOperatorSources } from './combatOperatorSourceRestoration';
import type { CombatOperatorState } from '../../state/combatState';
import { CombatSemanticEventRuntime } from '../../events/combatSemanticEventRuntime';
import { createPassiveAbilityEventState } from '../../state/abilityState';
import { createTimedMarkerState } from '../../state/environmentState';

it('单干员来源协调器恢复被动并在统一关系阶段接回子 Buff', () => {
  const passive: CompiledOperatorPassiveProgram = {
    key: 'passive',
    initialBlackboard: {},
    enableSequence: { steps: [] },
  };
  const operatorBlackboard = new ActionBlackboard({ value: 1 });
  const passiveBlackboard = new ActionBlackboard({}, operatorBlackboard);
  const operations = createCombatOperationHostState();
  const enableSequence = new CombatActionSequenceRuntime(
    {
      operationHost: { state: operations, programs: new CombatOperationPrograms() },
      execute: () => true,
      evaluate: () => true,
    },
    { blackboard: passiveBlackboard },
  ).createSequence(passive.enableSequence);
  const passiveState = createPassiveAbilityEventState(passiveBlackboard.runtimeState, operations);
  passiveState.enableSequence = enableSequence.runtimeState;
  passiveState.host.enabled = true;
  passiveState.host.childBuffs.push({ ownerId: 'operator', instanceId: 2 });
  const state: CombatOperatorState = {
    blackboard: operatorBlackboard.runtimeState,
    ability: createAbilitySystemState(),
    center: createOperatorCenterState(),
    skills: new Map(),
    passives: new Map([[passive.key, passiveState]]),
    equipment: null,
    initializations: new Map(),
    upgradeEvents: null,
    comboConditions: new Map(),
    cooldowns: new Map(),
    statuses: null,
    timedMarkers: createTimedMarkerState(),
    buffs: null,
  };
  const finish = vi.fn(() => true);
  const resolve = vi.fn((reference: { ownerId: string; instanceId: number }) => ({
    isRecycled: false,
    reference,
    finish,
  }));
  const restored = bindRestoredCombatOperatorSources({
    operator: { operatorId: 'operator', skills: [], passivePrograms: [passive] },
    state,
    operatorBlackboard,
    semanticEvents: new CombatSemanticEventRuntime(),
    createEquipmentExecutor: () => ({ execute: () => true, evaluate: () => true }),
    createInitializationOperations: () => ({ execute: () => true, evaluate: () => true }),
    createPassiveOperations: (_program, saved) => ({
      operationHost: { state: saved.operations, programs: new CombatOperationPrograms() },
      execute: () => true,
      evaluate: () => true,
    }),
    registerPassive: () => {
      throw new Error('passive has no event responses');
    },
    createUpgradeExecutor: () => ({ execute: () => true, evaluate: () => true }),
  });

  passiveState.host.childBuffs.push({ ownerId: 'operator', instanceId: 2 });
  expect(() => restored.bindRestoredChildren(resolve)).toThrow('has more than one owner');
  expect(resolve).not.toHaveBeenCalled();
  passiveState.host.childBuffs.pop();
  restored.bindRestoredChildren(resolve);
  expect(restored.passives.runtimes.get(passive.key)!.runtimeState).toBe(passiveState);
  expect(resolve).toHaveBeenCalledOnce();
  restored.dispose();
  expect(finish).toHaveBeenCalledExactlyOnceWith('other', null);
});
