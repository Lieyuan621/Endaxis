/**
 * 场景一变，就重新跑一遍模拟。
 *
 * 已经开始的模拟会跑完，等待中的旧请求由新请求替换。完整结果发布后，技能位置和
 * 警告一起更新；计算期间保留上次完整结果。本文件不计算战斗数值。
 */
import { computed, onScopeDispose, ref, shallowRef, watch, type ComputedRef, type Ref } from 'vue';
import type { ScenarioSimulationRun } from '../../application/simulation/scenarioSimulationService';
import type { ScenarioSimulationPerformanceSample } from '../../application/simulation/scenarioSimulationService';
import type { ScenarioSimulationService } from '../../application/simulation/scenarioSimulationService';
import type { ScenarioDocument } from '../../core/project/schema';
import type { SkillAvailabilityDiagnosticReason } from '../../core/projection/skillAvailabilityDiagnostics';
import type { SkillExecutionDiagnosticReason } from '../../core/projection/skillExecutionDiagnostics';
import type { ComboWindowDiagnosticReason } from '../../core/projection/comboWindowDiagnostics';
import { appendSimulationPerformanceSample } from './results/simulationPerformanceAudit';
import { getSkillCastPlacementChains } from '../../core/project/skillCastPlacement';

export type TimelineSkillDiagnosticReason =
  | SkillAvailabilityDiagnosticReason
  | SkillExecutionDiagnosticReason
  | ComboWindowDiagnosticReason
  | 'skillGroupInputRejected'
  | 'skillGroupInterrupted'
  | `skillInputMismatch: expected '${string}', actual '${string}'`
  | `skillInputUnknown: ${string}`
  | `skillInterruptUnavailable: cast '${string}'`
  | `skillInterruptUnknown: ${string}`;

export interface UseScenarioSimulationOptions {
  readonly scenario: Ref<ScenarioDocument>;
  readonly service: Pick<ScenarioSimulationService, 'simulate' | 'subscribePerformance'>;
  /** 可选的启动延迟；实时编辑默认立即开始。 */
  readonly debounceMs?: number;
  /** 拖动等短暂交互可先让轻量预览绘制，再合并密集的完整模拟请求。 */
  readonly interactiveDebounceMs?: number;
  readonly isInteractive?: () => boolean;
}

/** 一次成功模拟的完整发布单元；后台计算完成前不会改变。 */
export interface PublishedScenarioSimulation {
  readonly scenario: ScenarioDocument;
  readonly run: ScenarioSimulationRun;
}

export interface UseScenarioSimulationResult {
  /** 上一次成功模拟的完整快照；新模拟成功后整体替换。 */
  readonly published: ComputedRef<PublishedScenarioSimulation | null>;
  readonly run: ComputedRef<ScenarioSimulationRun | null>;
  readonly running: Ref<boolean>;
  /** 当前展示的结果是否已经落后于最新场景内容。 */
  readonly stale: Ref<boolean>;
  readonly error: Ref<string | null>;
  /** 最近的模拟墙钟耗时样本，供实时性能审计展示。 */
  readonly performanceSamples: Ref<readonly ScenarioSimulationPerformanceSample[]>;
  /** 每个技能块的警告原因列表，键是技能块的 id。 */
  readonly diagnosticsByCastId: ComputedRef<
    ReadonlyMap<string, readonly TimelineSkillDiagnosticReason[]>
  >;
  /** 立即取消等待并执行一次模拟。 */
  /** 立即运行并返回本次结果是否成功成为新的已发布快照。 */
  readonly simulateNow: () => Promise<boolean>;
  /** 导入/替换整个项目时清除结果，即使新项目复用了相同的方案 ID。 */
  readonly resetPublication: () => void;
}

const DEFAULT_DEBOUNCE_MS = 0;

function isExpectedSimulationAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export function useScenarioSimulation(
  options: UseScenarioSimulationOptions,
): UseScenarioSimulationResult {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const publishedState = shallowRef<PublishedScenarioSimulation | null>(null);
  const published = computed(() => publishedState.value);
  const run = computed(() => publishedState.value?.run ?? null);
  const running = ref(false);
  const stale = ref(false);
  const error = ref<string | null>(null);
  const performanceSamples = shallowRef<readonly ScenarioSimulationPerformanceSample[]>([]);
  let latestRunId = 0;
  let lastPublishedRunId = 0;
  let publicationEpoch = 0;
  let scenarioId = options.scenario.value.id;
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;
  let rerunRequested = false;
  let activeRunCount = 0;
  const queuedResolvers: Array<(published: boolean) => void> = [];
  const unsubscribePerformance =
    options.service.subscribePerformance?.(sample => {
      performanceSamples.value = appendSimulationPerformanceSample(
        performanceSamples.value,
        sample,
      );
    }) ?? (() => undefined);

  function currentDebounceMs(): number {
    return options.isInteractive?.() ? (options.interactiveDebounceMs ?? debounceMs) : debounceMs;
  }

  async function runSimulation(): Promise<boolean> {
    if (pendingTimer !== null) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
    const scenario = options.scenario.value;
    const runId = ++latestRunId;
    const epoch = publicationEpoch;
    activeRunCount += 1;
    running.value = true;
    stale.value = true;
    error.value = null;
    try {
      const result = await options.service.simulate(
        scenario,
        scenario.battle.simulationRange?.endFrame ?? scenario.battle.durationFrames,
      );
      // 同一方案拖动期间允许发布已经完整算完的旧落点；它仍是一份完整快照。
      // 项目切换、重置或更晚结果已发布时，旧任务不能再覆盖界面。
      const isCurrent = runId === latestRunId && options.scenario.value === scenario;
      const returnedToPublishedScenario =
        !isCurrent && publishedState.value?.scenario === options.scenario.value;
      const canPublish =
        epoch === publicationEpoch &&
        scenario.id === options.scenario.value.id &&
        runId > lastPublishedRunId &&
        !returnedToPublishedScenario;
      if (!canPublish) return false;
      publishedState.value = Object.freeze({ scenario, run: result });
      lastPublishedRunId = runId;
      stale.value = !isCurrent;
      return isCurrent;
    } catch (caught) {
      if (runId !== latestRunId || options.scenario.value !== scenario) return false;
      // Worker 缓存换代和待算位置替换都会主动结束旧请求。这属于调度流程，不能显示成模拟失败。
      if (isExpectedSimulationAbort(caught)) {
        stale.value = publishedState.value?.scenario !== scenario;
        return false;
      }
      error.value = caught instanceof Error ? caught.message : String(caught);
      // 失败不发布半成品，也不拆掉上一份完整快照。
      stale.value = publishedState.value !== null && publishedState.value.scenario !== scenario;
      return false;
    } finally {
      activeRunCount -= 1;
      running.value = activeRunCount > 0;
      if (activeRunCount === 0 && rerunRequested) {
        rerunRequested = false;
        const resolvers = queuedResolvers.splice(0);
        // 拖动中的后续落点也先让浏览器绘制，避免上一轮计算刚结束就同步堵住下一帧。
        if (resolvers.length === 0 && options.isInteractive?.() && currentDebounceMs() > 0) {
          pendingTimer = setTimeout(() => {
            pendingTimer = null;
            void runSimulation();
          }, currentDebounceMs());
        } else {
          void runSimulation().then(published => {
            for (const resolve of resolvers) resolve(published);
          });
        }
      }
    }
  }

  function scheduleSimulation(): void {
    if (scenarioId !== options.scenario.value.id) {
      scenarioId = options.scenario.value.id;
      publicationEpoch += 1;
    }
    if (pendingTimer !== null) clearTimeout(pendingTimer);
    error.value = null;
    // 保留旧结果仅适用于同一方案的编辑，不能跨方案展示另一条轴的曲线。
    if (publishedState.value?.scenario.id !== options.scenario.value.id) {
      publishedState.value = null;
    }
    // 场景一变化立即标脏，使诊断不再冒充当前结果；展示层仍可保留上一份投影，
    // 等新模拟完成后原子替换，避免时间映射和效果层在等待期间闪回默认状态。
    stale.value = true;
    if (activeRunCount > 0) {
      // 已开始的计算继续跑完；尚未开始的请求只保留最新场景。
      rerunRequested = true;
      return;
    }
    // 覆盖仍在防抖等待中的旧请求。
    latestRunId += 1;
    const delayMs = currentDebounceMs();
    if (delayMs === 0) {
      void runSimulation();
      return;
    }
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      void runSimulation();
    }, delayMs);
  }

  function simulateNow(): Promise<boolean> {
    if (pendingTimer !== null) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
    if (activeRunCount > 0) {
      rerunRequested = true;
      return new Promise(resolve => queuedResolvers.push(resolve));
    }
    return runSimulation();
  }

  function resetPublication(): void {
    publicationEpoch += 1;
    latestRunId += 1;
    if (pendingTimer !== null) clearTimeout(pendingTimer);
    pendingTimer = null;
    rerunRequested = false;
    for (const resolve of queuedResolvers.splice(0)) resolve(false);
    publishedState.value = null;
    running.value = activeRunCount > 0;
    error.value = null;
    stale.value = true;
  }

  const stopWatch = watch(
    () => options.scenario.value,
    () => scheduleSimulation(),
    { immediate: true, flush: 'sync' },
  );

  onScopeDispose(() => {
    publicationEpoch += 1;
    stopWatch();
    if (pendingTimer !== null) clearTimeout(pendingTimer);
    latestRunId += 1;
    rerunRequested = false;
    for (const resolve of queuedResolvers.splice(0)) resolve(false);
    unsubscribePerformance();
  });

  const diagnosticsByCastId = computed<
    ReadonlyMap<string, readonly TimelineSkillDiagnosticReason[]>
  >(() => {
    const snapshot = publishedState.value;
    if (snapshot === null) return new Map();
    const current = snapshot.run;
    const scenario = snapshot.scenario;

    const diagnostics = [
      ...current.availabilityDiagnostics.map(diagnostic => ({
        receiptSequences: diagnostic.receiptSequences,
        frame: diagnostic.frame,
        sourceId: diagnostic.sourceId,
        skillId: diagnostic.skillId,
        reason: diagnostic.reasons.map(reason => {
          if (reason === 'skillInputMismatch' && diagnostic.actualSkillId !== undefined)
            return `skillInputMismatch: expected '${diagnostic.skillId}', actual '${diagnostic.actualSkillId}'` as const;
          if (reason === 'skillInputUnknown' && diagnostic.inputResolutionDetail !== undefined)
            return `skillInputUnknown: ${diagnostic.inputResolutionDetail}` as const;
          if (reason === 'skillInterruptUnavailable' && diagnostic.currentCastId !== undefined)
            return `skillInterruptUnavailable: cast '${diagnostic.currentCastId}'` as const;
          if (reason === 'skillInterruptUnknown' && diagnostic.interruptionDetail !== undefined)
            return `skillInterruptUnknown: ${diagnostic.interruptionDetail}` as const;
          return reason;
        }),
      })),
      ...current.executionDiagnostics.map(diagnostic => ({
        receiptSequences: diagnostic.receiptSequences,
        frame: diagnostic.frame,
        sourceId: diagnostic.sourceId,
        skillId: diagnostic.skillId,
        reason: diagnostic.reasons,
      })),
      ...current.comboWindowDiagnostics.map(diagnostic => ({
        receiptSequences: diagnostic.receiptSequences,
        frame: diagnostic.frame,
        sourceId: diagnostic.sourceId,
        skillId: diagnostic.skillId,
        reason: diagnostic.reasons,
      })),
    ];
    const byCastId = new Map<string, TimelineSkillDiagnosticReason[]>();
    const inputFrames = new Map<string, number>();
    for (const entry of current.receiptHistory.entries()) {
      if (entry.event === 'SkillInputProcessed' && typeof entry.data?.castId === 'string')
        inputFrames.set(entry.data.castId, entry.frame);
    }
    const addReasons = (castId: string, reasons: readonly TimelineSkillDiagnosticReason[]) => {
      byCastId.set(castId, [...new Set([...(byCastId.get(castId) ?? []), ...reasons])]);
    };
    for (const diagnostic of diagnostics) {
      // 接续成员没有保存开始帧；优先使用回执中的释放身份，不靠同技能、同时间猜身份。
      const castIds = new Set(
        diagnostic.receiptSequences.flatMap(sequence => {
          const castId = current.receiptHistory.get(sequence)?.data?.castId;
          return typeof castId === 'string' ? [castId] : [];
        }),
      );
      if (castIds.size > 0) {
        for (const castId of castIds) addReasons(castId, diagnostic.reason);
        continue;
      }
      for (const track of scenario.tracks) {
        if (track === null || track.id !== diagnostic.sourceId) continue;
        for (const cast of track.skillCasts) {
          if (cast.source.kind !== 'operatorSkill') continue;
          if (
            cast.source.skillKey === diagnostic.skillId &&
            (inputFrames.get(cast.id) ?? cast.placement.startFrame) === diagnostic.frame
          ) {
            addReasons(cast.id, diagnostic.reason);
          }
        }
      }
    }
    for (const entry of current.receiptHistory.entries()) {
      if (entry.event !== 'SkillInputGroupBlocked') continue;
      const track = scenario.tracks.find(track => track?.id === entry.sourceId);
      if (!track) continue;
      const chain = getSkillCastPlacementChains(track.skillCasts).find(
        chain => chain.anchor.id === entry.data?.anchorCastId,
      );
      if (!chain) continue;
      const start = chain.casts.findIndex(cast => cast.id === entry.data?.castId);
      if (start < 0) continue;
      const reason =
        entry.data?.reason === 'inputRejected'
          ? 'skillGroupInputRejected'
          : 'skillGroupInterrupted';
      for (const cast of chain.casts.slice(start)) {
        if (!cast.presentation?.disabled) addReasons(cast.id, [reason]);
      }
    }
    return byCastId;
  });

  return {
    published,
    run,
    running,
    stale,
    error,
    performanceSamples,
    diagnosticsByCastId,
    simulateNow,
    resetPublication,
  };
}
