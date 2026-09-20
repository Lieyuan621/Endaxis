import type { ResolvedCombatStepForKind } from '../../core/compiler/combatProgram';
/**
 * 一条现成的模拟入口：编译场景 → 跑标准战斗环境 → 返回结果。
 * 随机样本等输入由调用方给；环境不支持的东西在跑之前就报错。
 */
import type { CompileScenarioRuntimeAssemblyOptions } from '../../core/compiler/compileScenarioRuntimeAssembly';
import type { CombatBuffDefinitionsDocument } from '../../core/combat/buffs/combatBuffDefinitions';
import type { SkillSettingsDocument } from '../../core/combat/infliction/skillSettings';
import type { CompoundStatusFactoriesDocument } from '../../core/combat/infliction/compoundStatusFactories';
import type { PlayerDamageNonRandomRuntimeSnapshot } from '../../core/combat/damage/playerActiveDamageInput';
import type { CriticalSampleSource } from '../../core/combat/random/criticalSampleSource';
import type { ProbabilitySampleSource } from '../../core/combat/random/probabilitySampleSource';
import type {
  SimulationRandomMode,
  SimulationRandomSettings,
} from '../../core/combat/random/simulationRandom';
import {
  StandardPlayerDamageEnvironment,
  type StandardPlayerDamageEnvironmentOptions,
} from '../../core/combat/runtime/standardPlayerDamageEnvironment';
import type {
  CombatDamageExecutorContext,
  CombatRuntimeAssembly,
  CombatRuntimeAssemblyOptions,
} from '../../core/combat/runtime/combatRuntimeAssembly';
import {
  advanceCombatRuntimeToFrame,
  collectCombatStateGraphResult,
  createCompiledScenarioRuntime,
  type ScenarioSimulationResult,
} from './runScenarioSimulation';
import type { CombatStateGraph } from '../../core/combat/state/combatState';
import type { RestoredCombatEnvironmentInput } from '../../core/combat/runtime/restoration/combatRuntimeRestoreFoundation';
import type { OrdinaryKnockDownRuntime } from '../../core/combat/status/ordinaryKnockDownRuntime';
import type { ScenarioDocument } from '../../core/project/schema';
import {
  compileScenarioMechanics,
  compileScenarioRuntimeAssembly,
} from '../../core/compiler/compileScenarioRuntimeAssembly';
import {
  applyMechanicsToScenarioEnemy,
  compileScenarioEnemy,
} from '../../core/compiler/compileScenarioEnemy';
import { createEnemyCombatVitals } from '../../core/combat/resources/combatVitalsFactory';
import { assertStandardPlayerDamageCompatibility } from '../../core/combat/runtime/standardPlayerDamageCompatibility';
import { timeDilationRuntimeConfig } from '../../data/combat/timeDilationConfig';
import { createNativeDashTimingProgram } from '../../data/combat/battleCommandMappingCatalog';
import { gameplayTagRegistry } from '../../data/combat/gameplayTagCatalog';
import { GAMEPLAY_TAG_PREDEFINE } from '../../data/combat/gameplayTagPredefine.generated';
import { GameplayTagPredefine } from '../../core/combat/tags/gameplayTagPredefine';
import { resolveControlTimeline } from '../../core/project/resolveControlTimeline';
import { isOperatorControlledAt } from '../../core/combat/skills/operatorControlTimeline';
import type { BuffProgressCurve } from '../../core/combat/buffs/buffProgressRecorder';
import { BuffProgressRecorder } from '../../core/combat/buffs/buffProgressRecorder';

type DamageStep = ResolvedCombatStepForKind<'dealDamage' | 'dealFixedDamage'>;

export interface RunStandardPlayerDamageScenarioInput {
  readonly scenario: ScenarioDocument;
  readonly options: Omit<CompileScenarioRuntimeAssemblyOptions, 'environment'>;
  readonly endFrame: number;
  readonly criticalSamples: CriticalSampleSource;
  readonly probabilitySamples?: ProbabilitySampleSource;
  readonly randomMode?: SimulationRandomMode;
  readonly randomState?: StandardPlayerDamageEnvironmentOptions['randomState'];
  /** 存在完整随机状态时用于恢复分支重建样本源；自定义无状态样本端口省略。 */
  readonly simulationRandomSettings?: SimulationRandomSettings;
  readonly resolveNonRandomRuntimeSnapshot: (
    context: CombatDamageExecutorContext,
    step: DamageStep,
  ) => PlayerDamageNonRandomRuntimeSnapshot;
  /** 提供后 `applyElementalInfliction` 步骤按定义附着状态机执行。 */
  readonly elementalInflictionDocument?: CombatBuffDefinitionsDocument;
  /** 法术爆发倍率（SkillSetting）；缺失时爆发触发会明确报错。 */
  readonly spellInflictionSettings?: SkillSettingsDocument;
  readonly compoundStatusFactories?: CompoundStatusFactoriesDocument;
  /** 原生 TimeManager 模式原值；值 2 使用未缩放默认时钟，其他值使用全局缩放时钟。 */
  /** 临时规划实例专用，不进入项目协议或正式模拟缓存。 */
  readonly continuationPlanCastIds?: readonly string[];
  readonly continuationPlanMode?: 'continuation' | 'compact';
}

/** 本次模拟唯一敌人生命账本的初始与最终快照；投影和结果收集读取同一实例。 */
export interface EnemyVitalsSimulationResult {
  readonly initialHealth: number;
  readonly maxHealth: number;
  readonly initialPoise: number;
  readonly maxPoise: number;
  readonly finalPoise: number;
}

export interface StandardPlayerDamageScenarioResult extends ScenarioSimulationResult {
  readonly finalEnemyHealth: number;
  readonly enemyVitals: EnemyVitalsSimulationResult;
  readonly buffProgressCurves: readonly BuffProgressCurve[];
}

export interface PreparedStandardPlayerDamageScenarioRuntime {
  readonly compiled: CombatRuntimeAssemblyOptions;
  readonly restoredEnvironment: RestoredCombatEnvironmentInput;
}

/** 执行一次不会跨场景复用状态的标准玩家生命伤害模拟。 */
export function runStandardPlayerDamageScenarioSimulation(
  input: RunStandardPlayerDamageScenarioInput,
): StandardPlayerDamageScenarioResult {
  if (!Number.isInteger(input.endFrame) || input.endFrame < 0) {
    throw new RangeError('endFrame must be a non-negative integer');
  }
  if (input.endFrame > input.scenario.battle.durationFrames) {
    throw new RangeError('endFrame must not exceed scenario battle duration');
  }

  const prepared = prepareStandardPlayerDamageScenarioRuntime(input);
  const assembly = createCompiledScenarioRuntime(prepared.compiled);
  advanceCombatRuntimeToFrame(assembly, input.endFrame);
  return collectStandardPlayerDamageScenarioResult(assembly, prepared.compiled);
}

/** 编译标准战斗并同时产出只绑定候选数据的恢复环境输入。 */
export function prepareStandardPlayerDamageScenarioRuntime(
  input: RunStandardPlayerDamageScenarioInput,
): PreparedStandardPlayerDamageScenarioRuntime {
  if (!Number.isInteger(input.endFrame) || input.endFrame < 0) {
    throw new RangeError('endFrame must be a non-negative integer');
  }
  if (input.endFrame > input.scenario.battle.durationFrames) {
    throw new RangeError('endFrame must not exceed scenario battle duration');
  }
  const mechanics = compileScenarioMechanics(input.scenario, input.options);
  const enemy = applyMechanicsToScenarioEnemy(
    compileScenarioEnemy(input.scenario.enemy),
    mechanics,
  );
  const enemyVitals = createEnemyCombatVitals(enemy);
  const controlTimeline = resolveControlTimeline(
    input.scenario.tracks,
    input.options.liveInputInitialFrame === undefined ? input.scenario.battle.controlSwitches : [],
    input.options.liveInputInitialFrame ?? -input.scenario.battle.prepFrames,
  );
  const passiveProgressBuffIdsByOperator = new Map<string, ReadonlySet<string>>();
  for (const track of input.scenario.tracks) {
    if (track === null || track.operator === null) continue;
    const passiveUi = input.options.index.getOperator(track.operator.operatorSlug)?.passiveUi;
    if (passiveUi?.kind !== 'buffProgress') continue;
    passiveProgressBuffIdsByOperator.set(
      track.id,
      new Set([passiveUi.normalBuffId, passiveUi.ultimateBuffId]),
    );
  }

  const restoredEnvironmentBase = {
    resolveNonRandomRuntimeSnapshot: input.resolveNonRandomRuntimeSnapshot,
    tagRegistry: gameplayTagRegistry,
    knockDown: {
      predefine: new GameplayTagPredefine(GAMEPLAY_TAG_PREDEFINE),
      // 下方整场消费者预检通过后才会执行；没有可观察起身阶段时只结束倒地，不模拟动画。
      onDurationElapsed: (runtime: OrdinaryKnockDownRuntime) => runtime.exit(),
    },
    isOperatorControlled: (operatorId: string, frame: number) =>
      isOperatorControlledAt(controlTimeline, operatorId, frame),
    passiveProgressBuffIdsByOperator,
    ...(input.elementalInflictionDocument === undefined
      ? {}
      : { elementalInflictionDocument: input.elementalInflictionDocument }),
    ...(input.spellInflictionSettings === undefined
      ? {}
      : { spellInflictionSettings: input.spellInflictionSettings }),
    ...(input.compoundStatusFactories === undefined
      ? {}
      : { compoundStatusFactories: input.compoundStatusFactories }),
  };
  const environmentOptions: StandardPlayerDamageEnvironmentOptions = {
    ...restoredEnvironmentBase,
    criticalSamples: input.criticalSamples,
    ...(input.randomState === undefined ? {} : { randomState: input.randomState }),
    randomMode: input.randomMode,
    ...(input.probabilitySamples === undefined
      ? {}
      : { probabilitySamples: input.probabilitySamples }),
    enemyVitals,
  };
  const environment = new StandardPlayerDamageEnvironment(environmentOptions);
  const compiled = compileScenarioRuntimeAssembly(input.scenario, {
    ...input.options,
    environment: {
      ...environment.runtimeOptions,
      skillAvailabilityTags: new GameplayTagPredefine(GAMEPLAY_TAG_PREDEFINE),
      dashTiming: createNativeDashTimingProgram(),
      timeDilation: {
        config: timeDilationRuntimeConfig,
      },
    },
  });
  assertStandardPlayerDamageCompatibility({
    operators: compiled.operators,
    // 持久组的全部成员由编译器携带锚点帧，预检因此不会漏掉可能提前执行的后段。
    // 临时规划还可能早于静态建议帧，需额外从模拟起点检查这些输入。
    inputs:
      input.continuationPlanCastIds === undefined
        ? compiled.inputs
        : compiled.inputs?.map(scheduled =>
            scheduled.castId !== undefined &&
            input.continuationPlanCastIds!.includes(scheduled.castId)
              ? { ...scheduled, frame: compiled.initialFrame ?? 0 }
              : scheduled,
          ),
    endFrame: input.endFrame,
    supportsElementalInfliction: input.elementalInflictionDocument !== undefined,
    supportsKnockDown: true,
  });
  const executable: CombatRuntimeAssemblyOptions = {
    ...compiled,
    ...(input.continuationPlanCastIds === undefined
      ? {}
      : {
          continuationPlanCastIds: input.continuationPlanCastIds,
          continuationPlanMode: input.continuationPlanMode ?? 'continuation',
        }),
  };
  let restoredEnvironment: RestoredCombatEnvironmentInput;
  if (input.randomState === undefined) {
    restoredEnvironment = {
      ...restoredEnvironmentBase,
      criticalSamples: input.criticalSamples,
      randomMode: input.randomMode,
      ...(input.probabilitySamples === undefined
        ? {}
        : { probabilitySamples: input.probabilitySamples }),
    };
  } else {
    if (input.simulationRandomSettings === undefined) {
      throw new Error('stateful simulation random requires restoration settings');
    }
    restoredEnvironment = {
      ...restoredEnvironmentBase,
      simulationRandomSettings: input.simulationRandomSettings,
    };
  }
  return { compiled: executable, restoredEnvironment };
}

/** 从一次性或检查点会话的标准装配收集同一种完整结果。 */
export function collectStandardPlayerDamageScenarioResult(
  assembly: CombatRuntimeAssembly,
  compiled: CombatRuntimeAssemblyOptions,
): StandardPlayerDamageScenarioResult {
  return collectStandardPlayerDamageStateGraphResult(
    assembly.stateGraph,
    compiled,
    assembly.receipt.history.snapshot(),
  );
}

/** 从会话的复制数据图收集标准伤害结果，不让结果层持有活动分支。 */
export function collectStandardPlayerDamageStateGraphResult(
  graph: CombatStateGraph,
  compiled: CombatRuntimeAssemblyOptions,
  history: import('../../core/combat/receipt/combatReceiptHistory').CombatReceiptView,
): StandardPlayerDamageScenarioResult {
  const result = collectCombatStateGraphResult(graph, compiled, history);
  const environmentState = graph.environment;
  if (environmentState === null)
    throw new Error('standard combat result requires environment state');
  const vitals = environmentState.enemyVitals;
  return Object.freeze({
    ...result,
    buffProgressCurves: new BuffProgressRecorder(environmentState.buffProgress).snapshot(),
    finalEnemyHealth: vitals.health,
    enemyVitals: Object.freeze({
      initialHealth: compiled.enemy.health,
      maxHealth: vitals.maxHealth,
      initialPoise: vitals.maxPoise,
      maxPoise: vitals.maxPoise,
      finalPoise: vitals.poise,
    }),
  });
}
