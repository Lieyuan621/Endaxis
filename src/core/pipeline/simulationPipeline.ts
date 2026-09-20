/**
 * 应用装配层运行解析、编译、模拟和投影的统一编排边界。
 * 每个阶段只能依赖前一阶段产物；缓存调用方必须提供能反映全部事实来源的 revision。
 */
/** 带事实版本的阶段产物；缓存正确性依赖 revision 覆盖全部输入。 */
export interface VersionedArtifact<T> {
  readonly revision: string;
  readonly data: T;
}

/** 流水线阶段共享的取消信号，长任务应主动响应。 */
export interface PipelineExecutionContext {
  readonly signal?: AbortSignal;
}

/** 确定性流水线阶段，只接收前一阶段的产物。 */
export interface PipelineStage<Input, Output> {
  readonly id: string;
  readonly revision: string;
  execute(
    input: VersionedArtifact<Input>,
    context: PipelineExecutionContext,
  ): Promise<VersionedArtifact<Output>>;
}

/** 一次模拟所需的三个确定性核心阶段。 */
export interface SimulationPipelineStages<
  ProjectInput,
  ResolvedScenario,
  CombatProgram,
  CombatRun,
> {
  readonly resolveScenario: PipelineStage<ProjectInput, ResolvedScenario>;
  readonly compileCombatProgram: PipelineStage<ResolvedScenario, CombatProgram>;
  readonly runCombat: PipelineStage<CombatProgram, CombatRun>;
}

/** 一次流水线运行保留的各阶段版本化产物。 */
export interface SimulationPipelineResult<ResolvedScenario, CombatProgram, CombatRun> {
  readonly resolvedScenario: VersionedArtifact<ResolvedScenario>;
  readonly combatProgram: VersionedArtifact<CombatProgram>;
  readonly combatRun: VersionedArtifact<CombatRun>;
}

/** 阶段结果缓存配置；容量只统计已完成结果。 */
export interface PipelineCacheOptions {
  /** 模拟与投影阶段累计保留的已完成阶段结果数。 */
  readonly maxEntries: number;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (!signal?.aborted) return;
  if (signal.reason !== undefined) throw signal.reason;
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  throw error;
}

class StageResultCache {
  readonly #entries = new Map<string, VersionedArtifact<unknown>>();
  readonly #maxEntries: number;

  constructor(options: PipelineCacheOptions) {
    if (!Number.isInteger(options.maxEntries) || options.maxEntries <= 0) {
      throw new RangeError('pipeline cache maxEntries must be a positive integer');
    }
    this.#maxEntries = options.maxEntries;
  }

  get<T>(key: string): VersionedArtifact<T> | undefined {
    const result = this.#entries.get(key);
    if (result === undefined) return undefined;
    this.#entries.delete(key);
    this.#entries.set(key, result);
    return result as VersionedArtifact<T>;
  }

  set<T>(key: string, result: VersionedArtifact<T>): void {
    this.#entries.delete(key);
    this.#entries.set(key, result);
    while (this.#entries.size > this.#maxEntries) {
      const oldestKey = this.#entries.keys().next().value as string | undefined;
      if (oldestKey === undefined) break;
      this.#entries.delete(oldestKey);
    }
  }

  clear(): void {
    this.#entries.clear();
  }
}

/**
 * 运行不依赖 Vue、Pinia 或浏览器状态的纯战斗流水线。
 * 后续的 Worker 适配器可以复用同一个异步边界。
 */
export class SimulationPipeline<ProjectInput, ResolvedScenario, CombatProgram, CombatRun> {
  readonly #stages: SimulationPipelineStages<
    ProjectInput,
    ResolvedScenario,
    CombatProgram,
    CombatRun
  >;
  readonly #cache: StageResultCache;

  constructor(
    stages: SimulationPipelineStages<ProjectInput, ResolvedScenario, CombatProgram, CombatRun>,
    cacheOptions: PipelineCacheOptions = { maxEntries: 64 },
  ) {
    this.#stages = stages;
    this.#cache = new StageResultCache(cacheOptions);
  }

  async run(
    input: VersionedArtifact<ProjectInput>,
    context: PipelineExecutionContext = {},
  ): Promise<SimulationPipelineResult<ResolvedScenario, CombatProgram, CombatRun>> {
    const resolvedScenario = await this.#runStage(this.#stages.resolveScenario, input, context);
    const combatProgram = await this.#runStage(
      this.#stages.compileCombatProgram,
      resolvedScenario,
      context,
    );
    const combatRun = await this.#runStage(this.#stages.runCombat, combatProgram, context);
    return { resolvedScenario, combatProgram, combatRun };
  }

  /** 投影按需生成，并与战斗运行结果分别缓存。 */
  project<Projection>(
    combatRun: VersionedArtifact<CombatRun>,
    stage: PipelineStage<CombatRun, Projection>,
    context: PipelineExecutionContext = {},
  ): Promise<VersionedArtifact<Projection>> {
    return this.#runStage(stage, combatRun, context);
  }

  clearCache(): void {
    this.#cache.clear();
  }

  async #runStage<Input, Output>(
    stage: PipelineStage<Input, Output>,
    input: VersionedArtifact<Input>,
    context: PipelineExecutionContext,
  ): Promise<VersionedArtifact<Output>> {
    throwIfAborted(context.signal);
    const cacheKey = `${stage.id}\u0000${stage.revision}\u0000${input.revision}`;
    const cached = this.#cache.get<Output>(cacheKey);
    if (cached !== undefined) return cached;

    const output = await stage.execute(input, context);
    throwIfAborted(context.signal);
    this.#cache.set(cacheKey, output);
    return output;
  }
}
