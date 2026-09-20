import type { RecursiveSkillChain } from './recursiveSkillChain';
import type {
  ScenarioSimulationPerformanceSample,
  ScenarioSimulationPerformanceSubscriber,
  ScenarioSimulationRun,
  ScenarioSimulationService,
} from './scenarioSimulationService';
import type { WorkerScenarioSimulationService } from './workerScenarioSimulationService';
import type { ScenarioDocument } from '../../core/project/schema';

type SimulationBackend = Pick<
  ScenarioSimulationService,
  'simulate' | 'subscribePerformance' | 'clearCache'
>;

type WorkerBackend = Pick<
  WorkerScenarioSimulationService,
  'simulate' | 'planSkillChain' | 'subscribePerformance' | 'clearCache' | 'dispose'
>;

const DEFAULT_FAST_THRESHOLD_MS = 33;
const PERFORMANCE_WINDOW_SIZE = 3;

/**
 * 普通编辑始终放到 Worker。拖动开始时，如果最近几次正式模拟都足够快，整段拖动
 * 改在主线程运行同一套模拟器，使场景和完整投影能在约一帧的预算内一起更新。
 */
export class AdaptiveTimelineSimulationService {
  private local: SimulationBackend;
  private localUnsubscribe: () => void;
  private readonly workerUnsubscribe: () => void;
  private readonly subscribers = new Set<ScenarioSimulationPerformanceSubscriber>();
  private readonly recentDurations: number[] = [];
  private interactiveDepth = 0;
  private interactiveBackend: 'worker' | 'local' = 'worker';

  constructor(
    private readonly worker: WorkerBackend,
    private readonly createLocal: () => SimulationBackend,
    private readonly fastThresholdMs = DEFAULT_FAST_THRESHOLD_MS,
  ) {
    if (!Number.isFinite(fastThresholdMs) || fastThresholdMs <= 0)
      throw new RangeError('fastThresholdMs must be positive');
    this.local = createLocal();
    this.workerUnsubscribe = worker.subscribePerformance(sample => this.acceptSample(sample));
    this.localUnsubscribe = this.local.subscribePerformance(sample => this.acceptSample(sample));
  }

  beginInteractiveSession(): void {
    this.interactiveDepth += 1;
    if (this.interactiveDepth !== 1) return;
    this.interactiveBackend =
      this.recentDurations.length > 0 && Math.max(...this.recentDurations) <= this.fastThresholdMs
        ? 'local'
        : 'worker';
  }

  endInteractiveSession(): void {
    this.interactiveDepth = Math.max(0, this.interactiveDepth - 1);
    if (this.interactiveDepth === 0) this.interactiveBackend = 'worker';
  }

  simulate(
    scenario: ScenarioDocument,
    endFrame: number,
    signal?: AbortSignal,
  ): Promise<ScenarioSimulationRun> {
    return (this.interactiveBackend === 'local' ? this.local : this.worker).simulate(
      scenario,
      endFrame,
      signal,
    );
  }

  planSkillChain(
    scenario: ScenarioDocument,
    castIds: readonly string[],
    endFrame: number,
    signal?: AbortSignal,
    mode: 'continuation' | 'compact' = 'continuation',
    extension?: RecursiveSkillChain,
  ) {
    return this.worker.planSkillChain(scenario, castIds, endFrame, signal, mode, extension);
  }

  subscribePerformance(listener: ScenarioSimulationPerformanceSubscriber): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  clearCache(): void {
    this.worker.clearCache();
    this.localUnsubscribe();
    this.local = this.createLocal();
    this.localUnsubscribe = this.local.subscribePerformance(sample => this.acceptSample(sample));
    this.recentDurations.length = 0;
    this.interactiveBackend = 'worker';
  }

  dispose(): void {
    this.workerUnsubscribe();
    this.localUnsubscribe();
    this.worker.dispose();
    this.subscribers.clear();
  }

  private acceptSample(sample: ScenarioSimulationPerformanceSample): void {
    if (sample.outcome === 'completed' && !sample.cacheHit) {
      this.recentDurations.push(sample.totalMs);
      if (this.recentDurations.length > PERFORMANCE_WINDOW_SIZE) this.recentDurations.shift();
    }
    for (const listener of this.subscribers) listener(sample);
  }
}
