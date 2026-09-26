/**
 * 切面恢复预检查必须在创建对象前遍历宏调用体，否则宏内持有的 Buff 引用会被漏检。
 * 该用例直接构造只含必要目录的状态图，缺实例时必须报错；跳过 graphMacro 遍历则不会报错。
 */
import { describe, expect, it } from 'vitest';
import {
  createAbilitySystemState,
  createOperatorCenterState,
  createPassiveAbilityEventState,
} from '../../state/abilityState';
import type { ActionGraphExecutionState, ActionGraphNodeData } from '../../state/actionState';
import type { CombatStateGraph } from '../../state/combatState';
import { createTimedMarkerState } from '../../state/environmentState';
import {
  createActionBlackboardState,
  createAbilityEventState,
} from '../../state/foundationState';
import {
  createBuffContainerState,
  createBuffInstanceState,
  createGlobalBuffState,
  createProjectileLifecycleState,
} from '../../state/instanceState';
import { CombatSharedRuntime } from '../combatSharedRuntime';
import { prepareCombatBuffRestore } from './combatRuntimeBuffRestorePreflight';

const resources = {
  sp: 0,
  maxSp: 300,
  returnedSp: 0,
  sharedSpGain: { baseGainEfficiency: 1 },
  spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
  ultimateEnergySystemUnlocked: false,
  normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
  squad: [
    {
      operatorId: 'operator',
      ultimateEnergy: 0,
      maxUltimateEnergy: 100,
      ultimateEnergyGainMultiplier: 1,
      allowedUltimateEnergyRecoveryTags: null,
    },
  ],
};

function executionState(
  entry: string,
  nodes: Record<string, ActionGraphNodeData>,
  callSite: string,
): ActionGraphExecutionState {
  return {
    revision: 'restore-preflight',
    entry,
    invocation: `${callSite}/invocation`,
    callSite,
    closed: false,
    nodes: new Map(
      Object.entries(nodes).map(([id, data]) => [
        id,
        {
          lifecycle: { state: 'started' as const, executeResult: true, executionPermitted: true },
          data,
        },
      ]),
    ),
  };
}

/** 一个宏调用节点，宏体内只有一个 holdBuffsById 引用。 */
function createGraph(heldInstanceId: number): CombatStateGraph {
  const blackboard = createActionBlackboardState();
  const holdBody = executionState(
    'hold',
    {
      hold: {
        kind: 'buffHold',
        buffs: {
          active: true,
          references: [{ ownerId: 'operator', instanceId: heldInstanceId }],
        },
      },
    },
    'passive.enable/hold',
  );
  const enable = executionState(
    'call',
    { call: { kind: 'graphMacro', body: holdBody } },
    'passive.enable',
  );
  const passive = createPassiveAbilityEventState(blackboard);
  passive.enableSequence = enable;

  const buffs = createBuffContainerState<'never'>(undefined, createActionBlackboardState());
  buffs.instances.set(
    1,
    createBuffInstanceState<'never'>(
      { ownerId: 'operator', instanceId: 1, definitionId: 'held', sourceId: 'operator' },
      createActionBlackboardState(),
    ),
  );

  return {
    shared: new CombatSharedRuntime({ resources, operatorOrder: ['operator'] }).runtimeState,
    inputs: {
      initialInputPending: false,
      castParameters: new Map(),
      control: new Map([['operator', false]]),
      skills: {
        nextInputIndex: 0,
        previousFixedInput: null,
        continuation: { nextIndex: 1, previous: null, stopped: false },
        groups: [],
      },
      dodges: {
        nextInputIndex: 0,
        previousInput: null,
        executedDashIds: new Set(),
        declaredSuccessIds: new Set(),
      },
      externalEvents: { nextEventIndex: 0, previousEvent: null },
    },
    environment: null,
    events: {
      native: null,
      semantic: createAbilityEventState<'airborneOutput' | 'knockDownOutput'>(),
    },
    operators: new Map([
      [
        'operator',
        {
          center: createOperatorCenterState(),
          blackboard,
          ability: createAbilitySystemState(),
          skills: new Map(),
          passives: new Map([['passive', passive]]),
          equipment: null,
          initializations: new Map(),
          upgradeEvents: null,
          comboConditions: new Map(),
          cooldowns: new Map(),
          statuses: null,
          timedMarkers: createTimedMarkerState(),
          buffs,
        },
      ],
    ]),
    enemy: { statuses: null, timedMarkers: createTimedMarkerState(), buffs: null },
    instances: {
      abilityEntities: { instances: new Map(), deadSources: [] },
      projectiles: createProjectileLifecycleState(),
      globalBuffs: createGlobalBuffState(),
    },
  };
}

describe('prepareCombatBuffRestore', () => {
  it('遍历宏调用体内的 Buff 引用：存在时通过，缺失时在创建对象前报错', () => {
    expect(() => prepareCombatBuffRestore(createGraph(1))).not.toThrow();
    expect(() => prepareCombatBuffRestore(createGraph(2))).toThrow(
      `restored action-owned Buff '${JSON.stringify(['operator', 2])}' is missing`,
    );
  });
});
