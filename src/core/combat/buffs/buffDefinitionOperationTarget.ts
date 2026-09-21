/**
 * 把只读 Buff 定义与单场战斗的 Buff 容器组合成技能操作端口。
 * 定义负责稳定身份解析，容器只持有实例；未知身份必须在施加点明确失败。
 */
import type { ResolvedSkillBuffDefinition } from '../../compiler/combatProgram';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { AbilityOutputBuffPayload } from '../events/combatAbilityEvent';
import type { FrameRuntime } from '../runtime/combatSimulation';
import type {
  CombatOperationExecutor,
  ProjectileRuntimeDependencies,
} from '../skills/skillRuntime';
import type { BuffReference, CombatSkillCastInfo } from '../state/foundationState';
import { type BuffFinishReason } from '../state/foundationState';
import type { BuffInstanceState } from '../state/instanceState';
import type { GameplayTag, GameplayTagQueryType } from '../tags/gameplayTags';
import { COMBAT_FRAME_INTERVAL } from '../time/combatClock';
import type { AbilityTickDeltas } from '../time/timeDilationRuntime';
import {
  attachBuffLifecycleSequences,
  type BindRestoredSkillAffixObjectReference,
  type RegisterBuffAbilityEventAction,
  type RegisterBuffAbilityEventCallback,
  type RegisterBuffSemanticEventAction,
  type RegisterPostSkillCastRequest,
} from './buffLifecycleSequenceRuntime';
import type {
  BuffApplicationHandle,
  BuffApplicationRequest,
  BuffAppliedEvent,
  BuffConsumedEvent,
  BuffLifecycleOperationSource,
  BuffOperationTarget,
  BuffQueryResult,
} from './buffOperationExecutor';
import type { CombatBuffDefinitionEntry } from './combatBuffDefinitions';
import {
  CombatBuffContainer,
  type CombatBuff,
  type CombatBuffAddOptions,
  type CombatBuffDefinition,
} from './combatBuffs';

export interface CombatBuffDefinitionResolver<Key extends string> {
  get(id: string): CombatBuffDefinition<Key> | undefined;
  compile?(entry: CombatBuffDefinitionEntry): CombatBuffDefinition<Key>;
}

export class BuffDefinitionOperationTarget<Key extends string>
  implements BuffOperationTarget, FrameRuntime
{
  readonly #inlineDefinitions = new WeakMap<
    ResolvedSkillBuffDefinition,
    CombatBuffDefinition<Key>
  >();
  #resolveLifecycleOperations:
    ((source: BuffLifecycleOperationSource) => CombatOperationExecutor) | null = null;
  #advancedObserver: (() => void) | null = null;
  #registerSemanticEventAction: RegisterBuffSemanticEventAction | null = null;
  #bindRestoredSkillAffixObjectReference: BindRestoredSkillAffixObjectReference | undefined;
  constructor(
    readonly container: CombatBuffContainer<Key>,
    readonly definitions: CombatBuffDefinitionResolver<Key>,
    readonly currentTarget?: RuntimeTargetRef,
    readonly registerAbilityEventAction?: RegisterBuffAbilityEventAction,
    readonly onBuffApplied?: (event: BuffAppliedEvent, buff: CombatBuff<Key>) => void,
    readonly onBeforeBuffApplied?: (event: BuffAppliedEvent) => void,
    readonly onOutputBuff?: (event: AbilityOutputBuffPayload) => void,
    readonly onBeforeBuffAdded?: (event: BuffAppliedEvent) => void,
    readonly registerAbilityEventCallback?: RegisterBuffAbilityEventCallback,
    readonly registerPostSkillCastRequest?: RegisterPostSkillCastRequest,
    readonly resolveProjectileRuntimeDependencies?: (
      definitionOwnerId: string,
    ) => ProjectileRuntimeDependencies,
    bindRestoredSkillAffixObjectReference?: BindRestoredSkillAffixObjectReference,
  ) {
    this.#bindRestoredSkillAffixObjectReference = bindRestoredSkillAffixObjectReference;
  }

  get ownerId(): string {
    return this.container.ownerId;
  }

  get runtimeState() {
    return this.container.runtimeState;
  }

  get currentFiniteShieldValue(): number {
    return this.container.currentFiniteShieldValue;
  }

  get entityBlackboard() {
    return this.container.entityBlackboard;
  }

  /**
   * 用当前目标已经配置好的定义编译器和生命周期端口重建保存实例。
   * 此阶段不解析父子 Buff 或 SkillAffix 的对象引用。
   */
  bindRestoredDefinitionInstances(
    resolveDefinition: (
      id: string,
      definitionOwnerId: string,
    ) => ResolvedSkillBuffDefinition | undefined,
    resolveOptions?: (state: BuffInstanceState<Key>) => CombatBuffAddOptions | undefined,
  ): void {
    this.container.bindRestoredInstances(state => {
      const id = state.identity.definitionId;
      const configured = this.definitions.get(id);
      if (
        configured !== undefined &&
        (state.actionHost === null || configured.bindRestoredActions !== undefined)
      ) {
        return configured;
      }
      const source = resolveDefinition(id, state.definitionOwnerId);
      return source === undefined ? configured : this.#compileInlineDefinition(id, source);
    }, resolveOptions);
  }

  /** 所有容器实例完成后，再按保存引用接回跨容器关系。 */
  bindRestoredRelations(
    resolveHandle: (reference: BuffReference) => BuffApplicationHandle | undefined,
  ): void {
    this.container.bindRestoredRelations(resolveHandle);
  }

  configureRestoredSkillAffixObjectReferenceBinder(
    bind: BindRestoredSkillAffixObjectReference,
  ): void {
    this.#bindRestoredSkillAffixObjectReference = bind;
  }

  bindRestoredBuffRecycleCallback(
    reference: BuffReference,
    registrationId: number,
    callback: () => void,
  ): { dispose(): void } {
    if (reference.ownerId !== this.ownerId) {
      throw new Error(
        `Buff recycle reference belongs to '${reference.ownerId}', not '${this.ownerId}'`,
      );
    }
    const buff = this.container.getInstance(reference.instanceId);
    if (buff === undefined) {
      throw new Error(`restored Buff recycle target '${reference.instanceId}' is missing`);
    }
    return buff.bindRecycledCallback(registrationId, callback);
  }

  getAttributeValue(attribute: string): number {
    return this.container.attributes.get(attribute as Key);
  }

  apply(request: BuffApplicationRequest): boolean {
    return this.#apply(request) !== null;
  }

  applyScoped(request: BuffApplicationRequest): CombatBuff<Key> | null {
    // 返回稳定的实例句柄，使重复施加/刷新后的 Skill.AttachBuff 可以按身份去重。
    return this.#apply(request);
  }

  #apply(request: BuffApplicationRequest) {
    const definition =
      request.definition === undefined
        ? this.definitions.get(request.buffId)
        : this.#compileInlineDefinition(request.buffId, request.definition);
    if (definition === undefined) throw new Error(`unknown combat buff '${request.buffId}'`);
    const event: BuffAppliedEvent = {
      ...(request.physicalInflictionType === undefined
        ? {}
        : { physicalInflictionType: request.physicalInflictionType }),
      ...(request.producedBy === undefined ? {} : { producedBy: request.producedBy }),
      targetId: this.ownerId,
      buffId: request.buffId,
      sourceId: request.sourceId,
      buffTags: definition.applyTags ?? [],
      skillCastInfo: request.skillCastInfo ?? null,
      isExtra: request.isExtra ?? false,
      ...(request.iconDurationSourceTargetId === undefined
        ? {}
        : { iconDurationSourceTargetId: request.iconDurationSourceTargetId }),
    };
    // 原生 OnBeforeOutputBuff 在来源 AbilitySystem 上同步发布，且早于目标 Buff 实例创建。
    this.onBeforeBuffApplied?.(event);
    // 原生 OnBeforeAddedBuff 随后在接收目标 AbilitySystem 上同步发布，仍早于实例创建。
    this.onBeforeBuffAdded?.(event);
    try {
      return this.container.add(
        definition,
        request.sourceId,
        {
          blackboardValues: request.blackboardValues,
          producedBy: request.producedBy,
          sourceActionId: request.sourceActionId ?? request.buffId,
          definitionOwnerId: request.definitionOwnerId ?? request.sourceId,
          ...(request.skillCastInfo === undefined ? {} : { skillCastInfo: request.skillCastInfo }),
          ...(request.finishParentGlobalBuff === undefined
            ? {}
            : { finishParentGlobalBuff: request.finishParentGlobalBuff }),
          ...(request.getSourceAttributeValue === undefined
            ? {}
            : {
                getSourceAttributeValue: request.getSourceAttributeValue,
                sourceAttributeOwnerId: request.sourceAttributeOwnerId,
              }),
        },
        buff => {
          // 接收侧 Added → 来源侧 Output → 容器执行已有关键词增强。
          this.onBuffApplied?.(event, buff);
          this.onOutputBuff?.({ ...event, buff });
        },
      );
    } catch (error) {
      if (!(error instanceof Error)) throw error;
      throw new Error(
        `failed to apply combat buff '${request.buffId}' from action '${
          request.sourceActionId ?? request.buffId
        }': ${error.message}`,
        { cause: error },
      );
    }
  }

  configureBuffConsumedObserver(observer: (event: BuffConsumedEvent) => void): void {
    this.container.configureConsumedObserver((buff, sourceOperatorId, layers, skillCastInfo) =>
      observer({
        buff,
        sourceOperatorId,
        ...(skillCastInfo === undefined ? {} : { skillCastInfo }),
        targetId: this.container.ownerId,
        buffId: buff.definition.id,
        layers,
        buffTags: buff.definition.applyTags ?? [],
        blackboardValues: buff.blackboard.snapshot(),
      }),
    );
  }

  configureBuffAbsorbedObserver(observer: (event: BuffConsumedEvent) => void): void {
    this.container.configureAbsorbedObserver((buff, sourceOperatorId, layers, skillCastInfo) =>
      observer({
        buff,
        sourceOperatorId,
        ...(skillCastInfo === undefined ? {} : { skillCastInfo }),
        targetId: this.container.ownerId,
        buffId: buff.definition.id,
        layers,
        buffTags: buff.definition.applyTags ?? [],
        blackboardValues: buff.blackboard.snapshot(),
      }),
    );
  }

  configureSemanticEventAction(register: RegisterBuffSemanticEventAction): void {
    if (this.#registerSemanticEventAction !== null) {
      throw new Error(`combat Buff runtime '${this.ownerId}' semantic events are configured`);
    }
    this.#registerSemanticEventAction = register;
  }

  /**
   * 场景装配完成后绑定生命周期步骤使用的完整操作链。
   * 同一运行时只能配置一次，避免定义缓存跨装配规则混用。
   */
  configureLifecycleOperations(
    resolveOperations: (source: BuffLifecycleOperationSource) => CombatOperationExecutor,
  ): void {
    if (this.#resolveLifecycleOperations !== null) {
      throw new Error(`combat Buff runtime '${this.ownerId}' lifecycle operations are configured`);
    }
    this.#resolveLifecycleOperations = resolveOperations;
  }

  #compileInlineDefinition(
    id: string,
    source: ResolvedSkillBuffDefinition,
  ): CombatBuffDefinition<Key> {
    const cached = this.#inlineDefinitions.get(source);
    if (cached !== undefined) return cached;
    const {
      presentation,
      scheduledSequences,
      lifecycleSequences,
      abilityEventResponses,
      igniteEventResponses,
      skillSlotReplacements,
      damageModifiers,
      ...runtimeDefinition
    } = source;
    const damageModifierConditionPrograms = damageModifiers?.map(
      modifier => modifier.conditionProgram,
    );
    const staticDamageModifiers = damageModifiers?.map(
      ({ conditionProgram: _, ...modifier }) => modifier,
    );
    const hasDamageModifierConditionPrograms =
      damageModifierConditionPrograms?.some(program => program !== undefined) === true;
    if (
      (scheduledSequences !== undefined ||
        lifecycleSequences !== undefined ||
        abilityEventResponses !== undefined ||
        igniteEventResponses !== undefined ||
        skillSlotReplacements !== undefined ||
        hasDamageModifierConditionPrograms) &&
      this.#resolveLifecycleOperations === null
    ) {
      throw new Error(
        `combat buff '${id}' has runtime sequences, but no Buff sequence runtime is configured`,
      );
    }
    if (
      scheduledSequences === undefined &&
      lifecycleSequences === undefined &&
      abilityEventResponses === undefined &&
      igniteEventResponses === undefined &&
      skillSlotReplacements === undefined &&
      !hasDamageModifierConditionPrograms &&
      this.definitions.compile === undefined
    ) {
      throw new Error(
        `combat buff '${id}' uses an inline definition, but no compiler is configured`,
      );
    }
    if (this.definitions.compile === undefined) {
      throw new Error(
        `combat buff '${id}' uses an inline definition, but no compiler is configured`,
      );
    }
    const { maxStackCount, ...staticRuntimeDefinition } = runtimeDefinition;
    const entry: CombatBuffDefinitionEntry = {
      id,
      ...staticRuntimeDefinition,
      ...(staticDamageModifiers === undefined ? {} : { damageModifiers: staticDamageModifiers }),
      ...(typeof maxStackCount === 'number' ? { maxStackCount } : {}),
    };
    const compiledBaseDefinition = this.definitions.compile(entry);
    const compiledDefinitionWithPresentation =
      presentation === undefined
        ? compiledBaseDefinition
        : { ...compiledBaseDefinition, presentation };
    const baseDefinition =
      maxStackCount !== undefined && typeof maxStackCount !== 'number'
        ? { ...compiledDefinitionWithPresentation, maxStackCount }
        : compiledDefinitionWithPresentation;
    const definition =
      scheduledSequences === undefined &&
      lifecycleSequences === undefined &&
      abilityEventResponses === undefined &&
      igniteEventResponses === undefined &&
      skillSlotReplacements === undefined &&
      !hasDamageModifierConditionPrograms
        ? baseDefinition
        : attachBuffLifecycleSequences(
            baseDefinition,
            lifecycleSequences ?? {},
            (
              buff,
              actionSourceId = buff.sourceId,
              skillCastInfo = buff.skillCastInfo,
              operations,
            ) =>
              this.#resolveLifecycleOperations!({
                ownerId: buff.owner.ownerId,
                sourceId: actionSourceId,
                definitionOwnerId: buff.definitionOwnerId,
                sourceActionId: buff.sourceActionId,
                skillCastInfo,
                operations: operations ?? buff.runtimeState.actionHost!.operations,
              }),
            this.currentTarget,
            abilityEventResponses,
            this.registerAbilityEventAction,
            scheduledSequences,
            igniteEventResponses,
            skillSlotReplacements,
            this.#registerSemanticEventAction ?? undefined,
            damageModifierConditionPrograms,
            this.registerAbilityEventCallback,
            this.registerPostSkillCastRequest,
            this.resolveProjectileRuntimeDependencies,
            this.#bindRestoredSkillAffixObjectReference,
          );
    this.#inlineDefinitions.set(source, definition);
    return definition;
  }

  advanceFrame(): void {
    this.container.tick(COMBAT_FRAME_INTERVAL);
    this.#advancedObserver?.();
  }

  /** Buff 容器的默认时间是全局缩放时间，与技能冷却的默认时间不同。 */
  advanceWithDeltas(deltas: AbilityTickDeltas): void {
    this.container.tick({
      globalDeltaSeconds: deltas.globalScaledDeltaSeconds,
      entityDeltaSeconds: deltas.selfScaledDeltaSeconds,
      globalAndSelfDeltaSeconds: deltas.globalAndSelfScaledDeltaSeconds,
    });
    this.#advancedObserver?.();
  }

  configureAdvancedObserver(observer: () => void): void {
    if (this.#advancedObserver !== null) throw new Error('advanced observer is configured');
    this.#advancedObserver = observer;
  }

  releaseAll(): void {
    this.container.releaseAll();
  }

  recycleFinishedBuffs(): void {
    this.container.recycleFinishedBuffs();
  }

  getCountByIds(ids: readonly string[]): number {
    return this.container.getCountByIds(ids);
  }

  getInstanceCountByIds(ids: readonly string[]): number {
    return this.container.getInstanceCountByIds(ids);
  }

  findFirstByIds(ids: readonly string[]): BuffQueryResult | undefined {
    return this.container.findFirstByIds(ids);
  }

  findFirstHandleByIds(ids: readonly string[]): BuffApplicationHandle | undefined {
    return this.container.findFirstByIds(ids);
  }

  resolveHandle(reference: BuffReference): BuffApplicationHandle | undefined {
    if (reference.ownerId !== this.ownerId) {
      throw new Error(
        `Buff reference owner '${reference.ownerId}' does not match '${this.ownerId}'`,
      );
    }
    return this.container.getInstance(reference.instanceId);
  }

  finishByIds(
    ids: readonly string[],
    reason: BuffFinishReason,
    sourceId?: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): number {
    return this.container.finishByIds(ids, reason, sourceId, finishSkillCastInfo);
  }

  finishCountByIds(
    ids: readonly string[],
    count: number,
    reason: BuffFinishReason,
    sourceId?: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): number {
    return this.container.finishCountByIds(ids, count, reason, sourceId, finishSkillCastInfo);
  }

  ignite(igniteType: string, sourceId: string, skillCastInfo?: CombatSkillCastInfo): number {
    return this.container.ignite(igniteType, sourceId, skillCastInfo);
  }

  holdByIds(ids: readonly string[]): {
    readonly references: readonly BuffReference[];
    release(): void;
  } {
    return this.container.holdByIds(ids);
  }

  releaseHeld(references: readonly BuffReference[]): void {
    this.container.releaseHeld(references);
  }

  getCountByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact?: boolean,
  ): number {
    return this.container.getCountByTags(tags, type, exact);
  }

  getDistinctIdCountByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact?: boolean,
  ): number {
    return this.container.getDistinctIdCountByTags(tags, type, exact);
  }

  getInstanceCountByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact?: boolean,
  ): number {
    return this.container.getInstanceCountByTags(tags, type, exact);
  }

  matchesEntityTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact?: boolean,
  ): boolean {
    return this.container.matchesEntityTags(tags, type, exact);
  }

  matchesTags(
    ownedTags: readonly GameplayTag[],
    requiredTags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact?: boolean,
  ): boolean {
    return this.container.matchesTags(ownedTags, requiredTags, type, exact);
  }

  findFirstByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact?: boolean,
  ): BuffQueryResult | undefined {
    return this.container.findFirstByTags(tags, type, exact);
  }

  finishByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    reason: BuffFinishReason,
    exact?: boolean,
    sourceId?: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): number {
    return this.container.finishByTags(tags, type, reason, exact, sourceId, finishSkillCastInfo);
  }

  finishCountByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    count: number,
    reason: BuffFinishReason,
    exact?: boolean,
    sourceId?: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): number {
    return this.container.finishCountByTags(
      tags,
      type,
      count,
      reason,
      exact,
      sourceId,
      finishSkillCastInfo,
    );
  }
}
