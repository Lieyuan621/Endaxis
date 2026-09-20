import { expect, it } from 'vitest';
import type { CompiledOperatorInitializationProgram } from '../../../compiler/combatProgram';
import { ActionBlackboard } from '../../actions/actionBlackboard';
import { CombatActionSequenceRuntime } from '../../actions/combatActionSequenceRuntime';
import { createCombatOperationHostState } from '../../state/actionState';
import { bindRestoredCombatOperatorInitializations } from './combatOperatorInitializationRestoration';
import { CombatOperationPrograms } from '../../actions/combatOperationPrograms';
import { CombatSemanticEventRuntime } from '../../events/combatSemanticEventRuntime';
import { EquipmentEventRuntime } from '../../abilities/equipmentEventRuntime';

const program: CompiledOperatorInitializationProgram = {
  key: 'potential:init',
  initialBlackboard: { value: 1 },
  sequence: {
    steps: [
      {
        kind: 'modifyActionValue',
        parameters: {
          key: 'value',
          operation: 'add',
          value: { kind: 'constant', value: 1 },
        },
      },
    ],
  },
};

it('恢复直接养成初始化时绑定原序列与动作状态但不重新执行', () => {
  const blackboard = new ActionBlackboard(program.initialBlackboard);
  const operationState = createCombatOperationHostState();
  const originalRuntime = new CombatActionSequenceRuntime(
    {
      operationHost: { state: operationState, programs: new CombatOperationPrograms() },
      execute: () => true,
      evaluate: () => true,
    },
    { blackboard },
  );
  const originalSequence = originalRuntime.createSequence(program.sequence);
  originalSequence.executeInstant({});
  const copied = structuredClone({
    key: program.key,
    blackboard: blackboard.runtimeState,
    operations: operationState,
    enableSequence: null,
    initializationSequence: originalSequence.runtimeState,
    initializationExecuted: true,
  });
  let executions = 0;
  const restored = bindRestoredCombatOperatorInitializations({
    operatorId: 'operator',
    programs: [program],
    states: new Map([[program.key, copied]]),
    semanticEvents: new CombatSemanticEventRuntime(),
    createOperations: (_program, state) => ({
      operationHost: { state: state.operations, programs: new CombatOperationPrograms() },
      execute: () => {
        executions += 1;
        return true;
      },
      evaluate: () => true,
    }),
  });

  const initialization = restored.get(program.key)!;
  expect(initialization.state).toBe(copied);
  expect(initialization.blackboard.runtimeState).toBe(copied.blackboard);
  expect(initialization.initializationSequence.runtimeState).toBe(copied.initializationSequence);
  expect(initialization.enableSequence).toBeNull();
  expect(executions).toBe(0);
});

it('恢复装备初始化时继续使用对应贡献的同一块黑板', () => {
  const equipmentProgram: CompiledOperatorInitializationProgram = {
    key: 'equipment:init',
    equipmentContributionIndex: 0,
    enableSequence: { steps: [] },
    sequence: { steps: [] },
  };
  const contribution = {
    source: { kind: 'weaponTrait' as const, slug: 'weapon', traitKey: 'trait' },
    selectedLevel: 1,
    modifiers: [],
    eventHandlers: [],
    blackboard: { value: 3 },
    enableSequence: { steps: [] },
  };
  const originalEquipment = new EquipmentEventRuntime(
    new CombatSemanticEventRuntime(),
    'operator',
    [contribution],
    () => ({ execute: () => true, evaluate: () => true }),
  );
  originalEquipment.enable(0);
  const blackboard = originalEquipment.blackboardFor(0);
  const operationState = createCombatOperationHostState();
  const sequenceRuntime = new CombatActionSequenceRuntime(
    {
      operationHost: { state: operationState, programs: new CombatOperationPrograms() },
      execute: () => true,
      evaluate: () => true,
    },
    { blackboard },
  );
  const initializationSequence = sequenceRuntime.createSequence(equipmentProgram.sequence);
  const enableSequence = sequenceRuntime.createSequence(equipmentProgram.enableSequence!);
  enableSequence.tryExecute({});
  const copied = structuredClone({
    equipment: originalEquipment.runtimeState,
    initialization: {
      key: equipmentProgram.key,
      equipmentContributionIndex: 0,
      blackboard: blackboard.runtimeState,
      operations: operationState,
      enableSequence: enableSequence.runtimeState,
      initializationSequence: initializationSequence.runtimeState,
      initializationExecuted: true,
    },
  });
  const restoredEquipment = new EquipmentEventRuntime(
    new CombatSemanticEventRuntime(),
    'operator',
    [contribution],
    () => ({ execute: () => true, evaluate: () => true }),
    undefined,
    copied.equipment,
  );
  const restored = bindRestoredCombatOperatorInitializations({
    operatorId: 'operator',
    programs: [equipmentProgram],
    states: new Map([[equipmentProgram.key, copied.initialization]]),
    semanticEvents: new CombatSemanticEventRuntime(),
    equipment: restoredEquipment,
    createOperations: (_program, state) => ({
      operationHost: { state: state.operations, programs: new CombatOperationPrograms() },
      execute: () => true,
      evaluate: () => true,
    }),
  });

  expect(restored.get(equipmentProgram.key)!.blackboard).toBe(restoredEquipment.blackboardFor(0));
  expect(restored.get(equipmentProgram.key)!.blackboard.runtimeState).toBe(
    copied.initialization.blackboard,
  );
  restoredEquipment.dispose();
  originalEquipment.dispose();
});
