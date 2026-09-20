/**
 * 建立整场恢复候选的共享账本、标准环境和基础 Buff 目标外壳。
 *
 * 输入必须先通过整图预检。本阶段直接绑定候选图中的数据，不创建 Buff 实例，不恢复技能或来源
 * 宿主，也不允许推进战斗。后续阶段在这些稳定外壳上建立干员、能力实体和跨对象关系。
 */
import type { BuffOperationTarget } from '../../buffs/buffOperationExecutor';
import type { CombatRuntimeRestorePreparation } from './combatRuntimeRestorePreparation';
import type { OperatorBuffRuntime } from '../combatRuntimeAssembly';
import type { BoundCombatBattleRuntimes, CombatEnemyProgram } from '../combatRuntimeAssembly';
import type { ProjectileRuntimeDependencies } from '../../skills/skillRuntime';
import { CombatSemanticEventRuntime } from '../../events/combatSemanticEventRuntime';
import {
  CombatSharedRuntime,
  type CombatSharedRuntimeOptions,
  type RestoredCombatSharedRuntime,
} from '../combatSharedRuntime';
import { CombatVitals } from '../../resources/combatVitals';
import {
  StandardPlayerDamageEnvironment,
  type StandardPlayerDamageEnvironmentOptions,
} from '../standardPlayerDamageEnvironment';
import type { CriticalSampleSource } from '../../random/criticalSampleSource';
import type { ProbabilitySampleSource } from '../../random/probabilitySampleSource';
import {
  SimulationRandomSource,
  type SimulationRandomSettings,
} from '../../random/simulationRandom';

type RestoredCombatEnvironmentBase = Omit<
  StandardPlayerDamageEnvironmentOptions,
  | 'enemyVitals'
  | 'randomState'
  | 'restoredState'
  | 'restoredEventStates'
  | 'restoredBuffStates'
  | 'criticalSamples'
  | 'probabilitySamples'
  | 'randomMode'
>;

type DirectRestoredCombatEnvironmentInput = RestoredCombatEnvironmentBase & {
  readonly criticalSamples: CriticalSampleSource;
  readonly probabilitySamples?: ProbabilitySampleSource;
  readonly randomMode?: import('../../random/simulationRandom').SimulationRandomMode;
  readonly simulationRandomSettings?: never;
};

export type RestoredCombatEnvironmentInput =
  | DirectRestoredCombatEnvironmentInput
  | (RestoredCombatEnvironmentBase & {
      readonly simulationRandomSettings: SimulationRandomSettings;
      readonly criticalSamples?: never;
      readonly probabilitySamples?: never;
      readonly randomMode?: never;
    });

export interface RestoreCombatRuntimeFoundationOptions {
  readonly preparation: CombatRuntimeRestorePreparation;
  readonly shared: Omit<CombatSharedRuntimeOptions, 'operatorOrder' | 'initialFrame'>;
  readonly timeDilationPrograms?: RestoredCombatSharedRuntime['timeDilationPrograms'];
  readonly environment: RestoredCombatEnvironmentInput;
  readonly enemy: CombatEnemyProgram;
  readonly resolveProjectileRuntimeDependencies: (
    definitionOperatorId: string,
  ) => ProjectileRuntimeDependencies;
}

export interface RestoredCombatRuntimeFoundation {
  readonly shared: CombatSharedRuntime;
  readonly environment: StandardPlayerDamageEnvironment;
  readonly semanticEvents: CombatSemanticEventRuntime;
  readonly boundEnvironment: BoundCombatBattleRuntimes;
  readonly enemyBuffTarget: BuffOperationTarget;
  readonly operatorBuffTargets: ReadonlyMap<string, OperatorBuffRuntime>;
}

export function bindRestoredCombatRuntimeFoundation(
  options: RestoreCombatRuntimeFoundationOptions,
): RestoredCombatRuntimeFoundation {
  const graph = options.preparation.graph;
  if (graph.environment === null) throw new Error('restored combat has no standard environment');
  if (graph.events.native === null)
    throw new Error('restored combat has no native event directory');
  if (graph.enemy.buffs === null) throw new Error('restored enemy has no Buff container data');
  const operatorBuffStates = new Map();
  for (const [operatorId, state] of graph.operators) {
    if (state.buffs === null) {
      throw new Error(`restored operator '${operatorId}' has no Buff container data`);
    }
    operatorBuffStates.set(operatorId, state.buffs);
  }
  const shared = new CombatSharedRuntime(
    {
      ...options.shared,
      operatorOrder: graph.shared.resources.squad.map(member => member.operatorId),
    },
    {
      state: graph.shared,
      ...(options.timeDilationPrograms === undefined
        ? {}
        : { timeDilationPrograms: options.timeDilationPrograms }),
    },
  );
  const { simulationRandomSettings, ...environmentInput } = options.environment;
  const randomState = graph.environment.random;
  if ((randomState === null) !== (simulationRandomSettings === undefined)) {
    throw new Error(
      randomState === null
        ? 'restored combat has random settings without saved random state'
        : 'restored combat random state requires simulation random settings',
    );
  }
  const restoredRandomSource =
    randomState === null || simulationRandomSettings === undefined
      ? undefined
      : new SimulationRandomSource(simulationRandomSettings, () => randomState);
  const restorationOptions = {
    enemyVitals: CombatVitals.bindRuntimeState(graph.environment.enemyVitals),
    restoredState: graph.environment,
    restoredEventStates: graph.events.native,
    restoredBuffStates: {
      enemy: graph.enemy.buffs,
      operators: operatorBuffStates,
    },
  };
  const environment =
    randomState === null
      ? new StandardPlayerDamageEnvironment({
          ...(environmentInput as DirectRestoredCombatEnvironmentInput),
          ...restorationOptions,
        })
      : new StandardPlayerDamageEnvironment({
          ...environmentInput,
          criticalSamples: restoredRandomSource!,
          probabilitySamples: restoredRandomSource!,
          randomMode: simulationRandomSettings!.mode,
          randomState,
          ...restorationOptions,
        });
  const boundEnvironment =
    environment.runtimeOptions.bindBattleRuntime?.({
      isOperatorControlled: operatorId => graph.inputs.control.get(operatorId) ?? false,
      enemy: options.enemy,
      clock: shared.clock,
      resources: shared.resources,
      receipt: shared.receipt,
      resolveProjectileRuntimeDependencies: options.resolveProjectileRuntimeDependencies,
    }) ?? {};
  if (boundEnvironment.environmentState !== graph.environment) {
    throw new Error('restored standard environment returned another state');
  }
  if (boundEnvironment.eventStates !== graph.events.native) {
    throw new Error('restored standard environment returned another native event directory');
  }
  const bindNative = boundEnvironment.bindNativeEventSubscription;
  if (bindNative === undefined) {
    throw new Error('restored standard environment has no native subscription binder');
  }
  const semanticEvents = new CombatSemanticEventRuntime(
    environment.runtimeOptions.registerCombatAbilityEvent,
    { state: graph.events.semantic, bindNative },
  );
  const createOperatorBuffRuntime = environment.runtimeOptions.createOperatorBuffRuntime;
  if (createOperatorBuffRuntime === undefined) {
    throw new Error('standard environment cannot create operator Buff targets');
  }
  const operatorBuffTargets = new Map<string, OperatorBuffRuntime>();
  for (const [operatorId, program] of options.preparation.programs) {
    const target = createOperatorBuffRuntime(
      operatorId,
      program.panel,
      program.reactionModifiers,
      operatorBuffStates.get(operatorId),
    );
    if (target.runtimeState !== operatorBuffStates.get(operatorId)) {
      throw new Error(`restored operator Buff target '${operatorId}' uses another state`);
    }
    operatorBuffTargets.set(operatorId, target);
  }
  const enemyBuffTarget = environment.runtimeOptions.enemyBuffRuntime;
  if (enemyBuffTarget.runtimeState !== graph.enemy.buffs) {
    throw new Error('restored enemy Buff target uses another state');
  }
  return {
    shared,
    environment,
    semanticEvents,
    boundEnvironment,
    enemyBuffTarget,
    operatorBuffTargets,
  };
}
