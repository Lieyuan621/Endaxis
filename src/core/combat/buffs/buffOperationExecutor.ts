import type { ActionTargetQuery } from '../../../../packages/game-data-contract/src/conditions';
import { resolveOperationPartTransferInfo } from '../abilities/runtimeTargetContext';
import type { InflictionElement } from '../../../../packages/game-data-contract/src/primitives';
import { stringInputExpression, valueInputBlackboardKey } from '../../compiler/compiledGraphData';
import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';
import { runtimeTargetEntityId } from '../../game-data/logicalAbilityEntity';
import type { PhysicalInflictionType } from '../../game-data/operatorDefinition';
import { ELEMENTAL_ATTACHMENT_TAGS } from '../infliction/elementalInfliction';
import { FORCED_SPELL_STATUS_BUFFS } from '../infliction/forcedSpellStatus';
import { PHYSICAL_INFLICTION_BUFFS, PHYSICAL_NO_GUARD_BUFF } from '../status/physicalInfliction';
import type { EventBuffInstance } from '../events/combatAbilityEvent';
import {
  abilityEventSourceId,
  abilityEventTargetId,
  physicalAbilityEvent,
  shieldAbilityEvent,
  skillAbilityEvent,
  type AbilityPhysicalInflictionPayload,
} from '../events/combatAbilityEvent';
import { CHARACTER_INFLICTION_BUFFS } from '../infliction/characterInfliction';
import { NATIVE_ELEMENT_VALUES } from '../infliction/elementalInfliction';
import type { CombatObjectRef } from '../receipt/combatReceipt';
import type { CombatOperationHostState } from '../state/actionState';
import type {
  ActionValueCalculation,
  ArtsIntensityFactor,
  EnemyPartTransferInfo,
} from '../state/foundationState';
import type { BuffContainerState, BuffInstanceState } from '../state/instanceState';
import type { BindRestoredSkillAffixObjectReference } from './buffLifecycleSequenceRuntime';
import type { CombatBuffAddOptions } from './combatBuffs';
/**
 * 执行技能序列中面向施法者或敌方 Buff 容器的查询与结束操作。
 * 这里只暴露动作需要的最小端口；目标身份到具体容器的映射由战斗装配层决定。
 */
import type { ActionBlackboardValue } from '../../../../packages/game-data-contract/src/primitives';
import type {
  ResolvedCombatOperationStep,
  ResolvedCombatStepForKind,
  ResolvedCombatStepParameters,
  ResolvedSkillBuffDefinition,
} from '../../compiler/combatProgram';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type {
  BuffApplicationSource,
  BuffApplicationTarget,
  CombatTarget,
} from '../../game-data/operatorDefinition';
import { compareCombatNumbers } from '../../math/combatNumbers.ts';
import {
  resolveActionValueOperand,
  resolveSkillSettingFactor,
  type ActionBlackboard,
} from '../actions/actionBlackboard';
import { operationProducer } from '../receipt/combatObjectIdentity';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type {
  BuffFinishReason,
  BuffReference,
  CombatSkillCastInfo,
} from '../state/foundationState';
import type { GameplayTag, GameplayTagQueryType } from '../tags/gameplayTags';
import { buffReferenceKey } from './buffReference';
import type { BuffApplicationHandle } from './combatBuffs';

type RuntimeOperation = ResolvedCombatOperationStep;

/** Buff 查询结果只暴露当前动作需要读取的数值黑板。 */
export interface BuffQueryResult {
  readonly blackboard: Pick<ActionBlackboard, 'getNumber'> &
    Partial<
      Pick<
        ActionBlackboard,
        'getArtsIntensityFactor' | 'getArtsIntensityDetail' | 'getValueCalculation'
      >
    >;
  readonly remainingDuration?: number | null;
}

/** Buff 生命周期解析操作链时的宿主、动作来源与施法身份。 */
export interface BuffLifecycleOperationSource {
  /** Buff 当前实际宿主；队伍 Buff 的生命周期必须相对此实体执行。 */
  readonly ownerId: string;
  /** 动作来源通常为 Buff 创建者；叠层只更换输入目标，点燃使用其动作来源。 */
  readonly sourceId: string;
  /** 创建当前 Buff 定义的 AbilitySystem；不能从宿主、来源或触发施法反推。 */
  readonly definitionOwnerId: string;
  readonly sourceActionId: string;
  /** 普通/叠层回调沿用 Buff 来源施法，点燃使用本次 IgniteAction 的施法身份。 */
  readonly skillCastInfo: CombatSkillCastInfo | null;
  /** 同一 Buff 生命周期内全部序列共用的可复制操作关系。 */
  readonly operations?: CombatOperationHostState;
}

/** 技能动作对目标 Buff 容器使用的最小稳定端口。 */
export interface BuffOperationTarget {
  findMatching?(
    query: ResolvedCombatStepParameters['setBuffRemainingDuration']['query'],
  ): Iterable<BuffQueryResult>;
  setRemainingDuration?(
    query: ResolvedCombatStepParameters['setBuffRemainingDuration']['query'],
    operation: 'assign' | 'add' | 'multiply',
    value: number,
  ): void;
  /** 有状态容器必须暴露实际数据；仅供查询的外部端口可能尚未接入，不可用于完整恢复。 */
  readonly runtimeState?: BuffContainerState;
  readonly currentFiniteShieldValue?: number;
  /** 此端口所属的稳定战斗实体身份，用于原生动作显式指定 Buff 来源时传递来源。 */
  readonly ownerId: string;
  /** 从候选容器数据重建实例对象；只绑定当前容器，跨容器关系留给下一阶段。 */
  bindRestoredDefinitionInstances?(
    resolveDefinition: (
      id: string,
      definitionOwnerId: string,
    ) => ResolvedSkillBuffDefinition | undefined,
    resolveOptions?: (state: BuffInstanceState<string>) => CombatBuffAddOptions | undefined,
  ): void;
  /** 所有目标容器的实例对象都存在后，按保存身份接回父子和对象引用。 */
  bindRestoredRelations?(
    resolveHandle: (reference: BuffReference) => BuffApplicationHandle | undefined,
  ): void;
  /** 只读原生属性值；技能费用等非 Buff 操作不得反向持有具体容器。 */
  getAttributeValue?(attribute: string): number;
  /** 根据已解析定义的 applyTags 选择实际接收者；查询和结束操作不随之转发。 */
  configureBuffApplicationRecipient?(
    resolve: (applyTags: readonly GameplayTag[]) => BuffOperationTarget | undefined,
  ): void;
  configureSourceEntityBlackboard?(
    resolve: (sourceId: string) => ActionBlackboard | undefined,
  ): void;
  /** 支持内联生命周期行为的目标由场景装配根配置；普通查询目标可以不实现。 */
  configureLifecycleOperations?(
    resolveOperations: (source: BuffLifecycleOperationSource) => CombatOperationExecutor,
  ): void;
  /** 场景装配根把成功施加事实接入全场语义事件中心。 */
  configureBuffConsumedObserver?(observer: (event: BuffConsumedEvent) => void): void;
  configureEntityTagAdded?(observer: (tag: GameplayTag) => void): void;
  observeEntityTags?(observer: () => void): () => void;
  configureBuffAbsorbedObserver?(observer: (event: BuffConsumedEvent) => void): void;
  /** 场景装配根把 Buff 存续期内的全场语义事件监听接入唯一事件中心。 */
  /** 完整对象目录建立后，为保存的 SkillAffix 实体与 Buff 引用提供当前分支绑定。 */
  configureRestoredSkillAffixObjectReferenceBinder?(
    bind: BindRestoredSkillAffixObjectReference,
  ): void;
  /** 按保存编号接回本目标中一个 Buff 的回收处理函数。 */
  bindRestoredBuffRecycleCallback?(
    reference: BuffReference,
    registrationId: number,
    callback: () => void,
  ): { dispose(): void };
  apply?(request: BuffApplicationRequest): boolean;
  applyScoped?(request: BuffApplicationRequest): BuffApplicationHandle | null;
  getCountByIds(ids: readonly string[], skillCastId?: number): number;
  getInstanceCountByIds?(ids: readonly string[]): number;
  findFirstByIds(ids: readonly string[]): BuffQueryResult | undefined;
  /** InheritBuffAction 需要稳定实例身份；普通查询端口不能代替。 */
  findFirstHandleByIds?(ids: readonly string[]): BuffApplicationHandle | undefined;
  /** 恢复动作期引用时按所属目标和实例编号精确重绑，已回收实例返回 undefined。 */
  resolveHandle?(reference: BuffReference): BuffApplicationHandle | undefined;
  finishByIds(
    ids: readonly string[],
    reason: BuffFinishReason,
    sourceId?: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): number;
  finishCountByIds?(
    ids: readonly string[],
    count: number,
    reason: BuffFinishReason,
    sourceId?: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): number;
  ignite?(igniteType: string, sourceId: string, skillCastInfo?: CombatSkillCastInfo): number;
  holdByIds(ids: readonly string[]): {
    readonly references?: readonly BuffReference[];
    release(): void;
  };
  releaseHeld?(references: readonly BuffReference[]): void;
  getCountByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact?: boolean,
    skillCastId?: number,
  ): number;
  getDistinctIdCountByTags?(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact?: boolean,
    skillCastId?: number,
  ): number;
  getInstanceCountByTags?(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact?: boolean,
    skillCastId?: number,
  ): number;
  matchesEntityTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact?: boolean,
  ): boolean;
  matchesTags?(
    ownedTags: readonly GameplayTag[],
    requiredTags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact?: boolean,
  ): boolean;
  findFirstByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact?: boolean,
  ): BuffQueryResult | undefined;
  dispel?(
    sourceId: string,
    level: number,
    query?: { buffTags: readonly GameplayTag[]; tagQueryType: GameplayTagQueryType },
  ): void;
  finishByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    reason: BuffFinishReason,
    exact?: boolean,
    sourceId?: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): number;
  finishCountByTags?(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    count: number,
    reason: BuffFinishReason,
    exact?: boolean,
    sourceId?: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): number;
}

export interface BuffAppliedEvent {
  readonly partTransferInfo?: EnemyPartTransferInfo;
  /** 本次物理异常输入；即便实际只施加破防，也保留动作类型供展示。 */
  readonly physicalInflictionType?: PhysicalInflictionType;
  readonly producedBy?: CombatObjectRef;
  readonly targetId: string;
  readonly buffId: string;
  readonly sourceId: string;
  readonly buffTags: readonly GameplayTag[];
  /** AddBuffContext 使用本次施加请求的来源，不能从接收者/监听器反推。 */
  readonly skillCastInfo?: CombatSkillCastInfo | null;
  /** 原生 AddBuffContext.isExtra；供 Buff 添加事件条件读取。 */
  readonly isExtra?: boolean;
  /** 仅供展示投影读取；不会改变 Buff 容器的实际寿命。 */
  readonly iconDurationSourceTargetId?: string;
}

export interface BuffConsumedEvent {
  readonly buff: EventBuffInstance;
  readonly skillCastInfo?: CombatSkillCastInfo | null;
  readonly sourceOperatorId: string;
  readonly targetId: string;
  readonly buffId: string;
  readonly layers: number;
  readonly buffTags: readonly GameplayTag[];
  readonly blackboardValues: Readonly<Record<string, string | number | null>>;
}

/** 由有状态动作精确持有的 Buff 实例，不按 ID 误删其他来源实例。 */
export type { BuffApplicationHandle } from './combatBuffs';

/** 定义身份与本次施加覆盖值已经分离求值后的运行时请求。 */
export interface BuffApplicationRequest {
  readonly partTransferInfo?: EnemyPartTransferInfo;
  readonly blackboardValueCalculations?: Readonly<Record<string, ActionValueCalculation>>;
  readonly physicalInflictionType?: BuffAppliedEvent['physicalInflictionType'];
  readonly producedBy?: CombatObjectRef;
  readonly buffId: string;
  /** 缺少表示旧式外部定义引用；内联技能步骤必须携带。 */
  readonly definition?: ResolvedSkillBuffDefinition;
  readonly sourceId: string;
  /** 后代定义继续从该 AbilitySystem 的目录解析。 */
  readonly definitionOwnerId?: string;
  readonly sourceActionId?: string;
  readonly blackboardValues: Readonly<Record<string, ActionBlackboardValue>>;
  readonly blackboardArtsIntensityFactors?: Readonly<Record<string, ArtsIntensityFactor>>;
  readonly skillCastInfo?: CombatSkillCastInfo;
  readonly isExtra?: boolean;
  /** 已在执行点解析为稳定实例身份的原生图标倒计时来源。 */
  readonly iconDurationSourceTargetId?: string;
  readonly finishParentGlobalBuff?: (reason: 'early' | 'other') => boolean;
  readonly getSourceAttributeValue?: (attribute: string) => number;
  /** getSourceAttributeValue 所属实体；恢复时据此解析当前分支对象。 */
  readonly sourceAttributeOwnerId?: string;
}

export interface BuffOperationDependencies {
  readonly queryTargets?: (
    query: ActionTargetQuery,
    context: CombatOperationContext,
  ) => readonly RuntimeTargetRef[];
  readonly triggerCharacterInflictionEvent?: (
    ownerId: string,
    sourceId: string,
    event: ResolvedCombatStepParameters['triggerCharacterInflictionEvent']['event'],
    element: ResolvedCombatStepParameters['triggerCharacterInflictionEvent']['element'],
  ) => void;
  readonly isCharacterTarget?: (id: string) => boolean;
  readonly beforeCharacterInfliction?: (
    ownerId: string,
    sourceId: string,
    element: InflictionElement,
  ) => void;
  readonly sourceId: string;
  /** 当前操作链解析 Buff/能力实体定义所使用的干员。 */
  readonly definitionOwnerId?: string;
  readonly sourceActionId?: string;
  readonly resolveTarget: (target: CombatTarget) => BuffOperationTarget;
  /** 尚未迁入 ActionTargetQuery 的施加动作目标解析。 */
  readonly resolveApplicationTargets?: (
    target: Exclude<BuffApplicationTarget, 'currentAbilityEntity'>,
  ) => readonly BuffOperationTarget[];
  /** 当前子时间线/Context 句柄只在显式能力实体目标的施加路径使用。 */
  readonly resolveCurrentAbilityEntityTarget?: (target: RuntimeTargetRef) => BuffOperationTarget;
  /** 把动作所属能力实体的同名 TimedMarker 解析为本次实例的稳定展示时钟身份。 */
  readonly resolveAbilityEntityTimedMarkerSource?: (
    target: RuntimeTargetRef,
    markerId: string,
  ) => string | undefined;
  /** Ability 事件响应中把原生 Target 解析为事件载荷的真实 targetId。 */
  readonly resolveEventTarget?: (targetId: string) => BuffOperationTarget;
  /** CreateBuff 锁定实体句柄时检查是否已回收；死亡标记不代表句柄失效。 */
  readonly isEntityAvailable?: (target: RuntimeTargetRef) => boolean;
  /** 解析既有实例引用；已回收返回空，不要求其宿主仍可作为新动作目标。 */
  readonly resolveBuffReference?: (reference: BuffReference) => BuffApplicationHandle | undefined;
  /** 从当前动作所属干员、原始技能等级对应的附属对象表解析定义。 */
  readonly resolveBuffDefinition?: (buffId: string) => ResolvedSkillBuffDefinition | undefined;
  readonly onPhysicalInflictionApplied?: (event: AbilityPhysicalInflictionPayload) => void;
  readonly onBeforeOutputPhysicalInfliction?: (event: AbilityPhysicalInflictionPayload) => void;
  readonly delegate: CombatOperationExecutor;
  readonly readProcessingSkillCastId?: (ownerId: string) => number | undefined;
}

export interface AuraInfluenceOperations {
  targets(
    parameters: ResolvedCombatStepParameters['aura'],
    context: CombatOperationContext,
  ): readonly RuntimeTargetRef[];
  apply(
    parameters: ResolvedCombatStepParameters['aura'],
    target: RuntimeTargetRef,
    context: CombatOperationContext,
  ): BuffReference[];
  finish(references: readonly BuffReference[]): void;
}

export class BuffOperationExecutor implements CombatOperationExecutor {
  /** 只缓存当前执行器创建过的对象；是否活动以及实例身份以动作数据为准。 */
  readonly #buffHandleBindings = new Map<string, BuffApplicationHandle>();
  constructor(readonly dependencies: BuffOperationDependencies) {}
  readonly ownerTagQuery: NonNullable<CombatOperationExecutor['ownerTagQuery']> = context => {
    const owner = context.actionOwnerId;
    const target = owner === undefined ? undefined : this.dependencies.resolveEventTarget?.(owner);
    if (!target?.observeEntityTags)
      throw new Error('tag listener requires an observable action owner');
    return {
      observe: changed => target.observeEntityTags!(changed),
      matches: parameters => target.matchesEntityTags(parameters.tags, parameters.tagQueryType),
    };
  };

  readonly aura: AuraInfluenceOperations = {
    targets: (parameters, context) => {
      if (this.dependencies.queryTargets === undefined)
        throw new Error('Aura requires an action target query context');
      return this.dependencies
        .queryTargets(parameters.targets, context)
        .filter(target => runtimeTargetEntityId(target) !== undefined);
    },
    apply: (parameters, target, context) => {
      const receiver = this.#resolveContextTarget(target);
      if (!receiver.applyScoped) throw new Error('Aura requires a scoped Buff receiver');
      const references: BuffReference[] = [];
      for (const entry of parameters.buffs) {
        const source = this.#resolveCreationSource(parameters, context);
        if (source === undefined) continue;
        const handle = receiver.applyScoped(
          this.#createBuffRequest(parameters, entry, context, source),
        );
        if (handle !== null) {
          references.push(handle.reference);
          this.#buffHandleBindings.set(buffReferenceKey(handle.reference), handle);
        }
      }
      return references;
    },
    finish: references => {
      for (let index = references.length - 1; index >= 0; index--)
        this.#resolveActionBuff(references[index]!)?.finish('other');
    },
  };

  execute(step: RuntimeOperation, context?: CombatOperationContext): boolean {
    if (step.kind === 'triggerCharacterInflictionEvent') {
      const ownerId = context?.actionOwnerId ?? context?.buffOwnerId ?? this.dependencies.sourceId;
      const source = this.#resolveApplicationSource(step.parameters.eventSource, context, false);
      const emit = this.dependencies.triggerCharacterInflictionEvent;
      if (emit === undefined)
        throw new Error('character infliction event publisher is not configured');
      emit(ownerId, source.ownerId, step.parameters.event, step.parameters.element);
      return true;
    }
    if (step.kind === 'applyCharacterInfliction') {
      if (context === undefined) throw new Error('character infliction requires an action context');
      const source =
        step.parameters.source === 'battle'
          ? { ownerId: 'battle' }
          : this.#resolveApplicationSource(step.parameters.source, context, false);
      const isCharacter = this.dependencies.isCharacterTarget;
      if (isCharacter === undefined)
        throw new Error('character infliction requires an entity type resolver');
      const nativeElement = (
        { heat: 'Fire', electric: 'Pulse', cryo: 'Cryst', nature: 'Natural' } as const
      )[step.parameters.element];
      const ids = CHARACTER_INFLICTION_BUFFS[nativeElement];
      for (const target of this.#resolveApplicationTargets(step.parameters.target, context)) {
        if (!isCharacter(target.ownerId)) continue;
        if (
          !step.parameters.ignoreWeakImmune &&
          target.matchesEntityTags(
            [`Immune/SpellInflictOnChar/${nativeElement}InflictOnChar/Weak`],
            'hasAny',
          )
        )
          continue;
        if (!step.parameters.directToTriggered) {
          const emit = this.dependencies.beforeCharacterInfliction;
          if (emit === undefined) throw new Error('character infliction requires its Before event');
          emit(target.ownerId, source.ownerId, step.parameters.element);
        }
        const buffId = ids[step.parameters.directToTriggered ? 1 : 0]!;
        const definition = this.dependencies.resolveBuffDefinition?.(buffId);
        if (definition === undefined)
          throw new Error(`missing character infliction Buff '${buffId}'`);
        if (
          !step.parameters.directToTriggered &&
          !step.parameters.ignoreAddingCooldown &&
          definition.addingCooldownSeconds !== undefined
        ) {
          if (target.runtimeState === undefined)
            throw new Error('character infliction requires Buff cooldown state');
          if (
            target.runtimeState.addingCooldowns
              .get(definition.stackingKey ?? buffId)
              ?.some(value => value > 0.00001)
          )
            continue;
        }
        if (step.parameters.directToTriggered)
          target.finishByIds([ids[0]!], 'ignite', source.ownerId, null);
        const count = step.parameters.directToTriggered
          ? 1
          : Math.trunc(resolveActionValueOperand(step.parameters.count, context.blackboard));
        if (target.apply === undefined)
          throw new Error('character infliction target cannot receive Buffs');
        for (let index = 0; index < count; index++)
          target.apply({
            buffId,
            definition,
            sourceId: source.ownerId,
            definitionOwnerId: this.dependencies.definitionOwnerId ?? this.dependencies.sourceId,
            sourceActionId: this.dependencies.sourceActionId,
            blackboardValues: {},
            ...(context.skillCastInfo === undefined
              ? {}
              : { skillCastInfo: context.skillCastInfo }),
            producedBy: operationProducer(context, {
              ownerId: this.dependencies.sourceId,
              actionId: this.dependencies.sourceActionId ?? buffId,
            }),
          });
      }
      return true;
    }
    if (step.kind === 'storeShieldValue') {
      if (context === undefined)
        throw new Error('storeShieldValue requires a combat operation context');
      const ownerId = context.actionOwnerId ?? context.buffOwnerId;
      if (ownerId === undefined) return true;
      const resolve = this.dependencies.resolveEventTarget;
      if (resolve === undefined)
        throw new Error('storeShieldValue requires an entity target resolver');
      const target = resolve(ownerId);
      let value: number;
      if (step.parameters.value === 'current') {
        const current = target.currentFiniteShieldValue;
        if (current === undefined) throw new Error('storeShieldValue target has no shield reader');
        value = current;
      } else {
        const shield = context.event === undefined ? undefined : shieldAbilityEvent(context.event);
        if (shield === undefined) return true;
        value = shield.payload.gainedValue;
      }
      context.blackboard.assignDynamic(step.parameters.outputKey, value);
      return true;
    }
    if (step.kind === 'skillAffix') {
      const state = context?.actionRegistrationState;
      if (state === undefined) throw new Error('SkillAffix requires action data');
      if (state.registrationIds.length > 0) throw new Error('SkillAffix action is already active');
      if (context?.bindCurrentBuffSkillAffix === undefined || context.buffOwnerId === undefined)
        return false;
      if (this.dependencies.readProcessingSkillCastId === undefined)
        throw new Error('SkillAffix requires a processing-skill resolver');
      const id = this.dependencies.readProcessingSkillCastId(context.buffOwnerId);
      if (id === undefined) return false;
      state.registrationIds = [context.bindCurrentBuffSkillAffix(id)];
      return true;
    }
    if (step.kind === 'forceSpellStatus') {
      if (context === undefined) throw new Error('forceSpellStatus requires an action context');
      const target = this.dependencies.resolveTarget(step.parameters.target);
      const buffId = FORCED_SPELL_STATUS_BUFFS[step.parameters.element];
      const definition = this.dependencies.resolveBuffDefinition?.(buffId);
      if (definition === undefined || target.apply === undefined)
        throw new Error(
          `forceSpellStatus requires Buff definition '${buffId}' and an application target`,
        );
      // 原生三个 BlackboardInt 在消费之前求值；消费回调不能改变本次已确定的参数。
      const layers = Math.trunc(
        resolveActionValueOperand(step.parameters.consumedLayers, context.blackboard),
      );
      const count = Math.trunc(
        resolveActionValueOperand(step.parameters.count, context.blackboard),
      );
      // 数值与解释来源一起快照，避免消费附着触发的回调覆盖来源变量。
      const blackboardValueCalculations: NonNullable<
        BuffApplicationRequest['blackboardValueCalculations']
      > = Object.fromEntries(
        Object.entries({
          consumed_layer: step.parameters.consumedLayers,
          count: step.parameters.count,
        }).flatMap(([key, input]) => {
          const sourceKey = valueInputBlackboardKey(input);
          const calculation =
            sourceKey === undefined ? undefined : context.blackboard.getValueCalculation(sourceKey);
          return calculation === undefined ? [] : [[key, calculation]];
        }),
      );
      const tags = [ELEMENTAL_ATTACHMENT_TAGS[step.parameters.consumedElement]];
      const sourceId = context.actionSourceId ?? context.buffSourceId ?? this.dependencies.sourceId;
      if (layers > 0) {
        // 层数不足只跳过本目标，原生动作本身仍返回成功。
        if (target.getCountByTags(tags, 'hasAny') < layers) return true;
        if (target.finishCountByTags === undefined)
          throw new Error('forceSpellStatus requires a count-aware Buff target');
        target.finishCountByTags(
          tags,
          'hasAny',
          layers,
          'early',
          false,
          sourceId,
          context.skillCastInfo ?? null,
        );
      }
      target.apply({
        buffId,
        definition,
        definitionOwnerId: this.dependencies.definitionOwnerId,
        sourceId,
        sourceActionId: this.dependencies.sourceActionId,
        producedBy: operationProducer(context, {
          ownerId: this.dependencies.sourceId,
          actionId: this.dependencies.sourceActionId,
        }),
        blackboardValues: {
          consumed_type: NATIVE_ELEMENT_VALUES[step.parameters.consumedElement],
          consumed_layer: layers,
          count,
        },
        ...(Object.keys(blackboardValueCalculations).length === 0
          ? {}
          : { blackboardValueCalculations }),
        skillCastInfo: context.skillCastInfo,
        isExtra: step.parameters.isExtra,
      });
      return true;
    }
    if (step.kind === 'applyPhysicalInfliction') {
      if (step.parameters.type === 'knockDown')
        return this.dependencies.delegate.execute(step, context);
      if (context?.skillCastInfo === undefined) {
        throw new Error('applyPhysicalInfliction requires a skill runtime context');
      }
      const target = this.dependencies.resolveTarget(step.parameters.target);
      if (target.apply === undefined) {
        throw new Error(
          `physical infliction target '${target.ownerId}' does not support Buff application`,
        );
      }
      if (step.parameters.type === 'airborne' && step.parameters.targetFilter === 'skipAll') {
        return step.parameters.returnWhen === 'always';
      }
      const noGuardCount = target.getCountByIds([PHYSICAL_NO_GUARD_BUFF]);
      const hasNoGuard = noGuardCount > 0;
      const entersPhysicalInfliction =
        hasNoGuard || (step.parameters.type === 'airborne' && step.parameters.force);
      if (entersPhysicalInfliction) {
        this.dependencies.onBeforeOutputPhysicalInfliction?.({
          sourceId: this.dependencies.sourceId,
          targetId: target.ownerId,
          type: step.parameters.type,
          skillCastInfo: context.skillCastInfo,
          ...(context.attachBuffToCurrentSkill === undefined
            ? {}
            : { attachBuffToCurrentSkill: context.attachBuffToCurrentSkill }),
        });
      }
      const crushBlackboardValues: Readonly<Record<string, number>> =
        hasNoGuard && step.parameters.type === 'crush'
          ? (() => {
              const values: Record<string, number> = {};
              const multiplier = resolveActionValueOperand(
                step.parameters.damageMultiplier,
                context.blackboard,
              );
              if (Math.abs(multiplier - 1) > 1e-5) {
                values.dmg_multiplier = multiplier;
              }
              if (step.parameters.ignoreHitEffect) {
                values.ignore_hit_effect = 1;
              }
              return values;
            })()
          : {};
      const request: BuffApplicationRequest = !entersPhysicalInfliction
        ? {
            buffId: PHYSICAL_NO_GUARD_BUFF,
            sourceId: this.dependencies.sourceId,
            ...(this.dependencies.sourceActionId === undefined
              ? {}
              : { sourceActionId: this.dependencies.sourceActionId }),
            blackboardValues: {},
            skillCastInfo: context.skillCastInfo,
          }
        : step.parameters.type === 'crush'
          ? {
              buffId: PHYSICAL_INFLICTION_BUFFS.crush,
              sourceId: this.dependencies.sourceId,
              ...(this.dependencies.sourceActionId === undefined
                ? {}
                : { sourceActionId: this.dependencies.sourceActionId }),
              blackboardValues: crushBlackboardValues,
              skillCastInfo: context.skillCastInfo,
            }
          : step.parameters.type === 'fracture'
            ? {
                buffId: PHYSICAL_INFLICTION_BUFFS.fracture,
                sourceId: this.dependencies.sourceId,
                ...(this.dependencies.sourceActionId === undefined
                  ? {}
                  : { sourceActionId: this.dependencies.sourceActionId }),
                blackboardValues: {},
                skillCastInfo: context.skillCastInfo,
              }
            : {
                buffId: PHYSICAL_INFLICTION_BUFFS.airborne,
                sourceId: this.dependencies.sourceId,
                ...(this.dependencies.sourceActionId === undefined
                  ? {}
                  : { sourceActionId: this.dependencies.sourceActionId }),
                blackboardValues: {},
                skillCastInfo: context.skillCastInfo,
              };
      const definition = this.dependencies.resolveBuffDefinition?.(request.buffId);
      if (definition === undefined)
        throw new Error(
          `physical infliction Buff '${request.buffId}' is missing from the definition repository`,
        );
      const applied = target.apply({
        ...request,
        definition,
        definitionOwnerId: this.dependencies.definitionOwnerId ?? this.dependencies.sourceId,
        physicalInflictionType: step.parameters.type,
        producedBy: operationProducer(context, {
          ownerId: this.dependencies.sourceId,
          actionId: this.dependencies.sourceActionId,
        }),
      });
      if (applied && entersPhysicalInfliction) {
        this.dependencies.onPhysicalInflictionApplied?.({
          sourceId: this.dependencies.sourceId,
          targetId: target.ownerId,
          type: step.parameters.type,
          skillCastInfo: context.skillCastInfo,
          ...(context.attachBuffToCurrentSkill === undefined
            ? {}
            : { attachBuffToCurrentSkill: context.attachBuffToCurrentSkill }),
        });
      }
      // 消费事实由 Buff 容器发布，不能再通过前后层数相减重复推算一次。
      if (step.parameters.type !== 'airborne') return applied;
      // 固定木桩不安装空间控制组件：状态 Buff 与通用 After 链仍执行，但不能伪造
      // ApplyAirborne 的 Success/Interruption。真实 1.4.4 样本当前均使用 Always。
      return step.parameters.returnWhen === 'always';
    }

    if (step.kind === 'applyBuff') {
      if ('definition' in step.parameters)
        throw new Error('applyBuff must reference an owner Buff definition');
      const attachToSkill = step.parameters.lifetimeOwner === 'currentCastSkill';
      const attachBuff =
        context?.event === undefined
          ? undefined
          : (physicalAbilityEvent(context.event)?.payload.attachBuffToCurrentSkill ??
            skillAbilityEvent(context.event)?.payload.attachBuffToCurrentSkill);
      if (context === undefined || this.dependencies.queryTargets === undefined)
        throw new Error('applyBuff requires an action target query context');
      const receivers = [...this.dependencies.queryTargets(step.parameters.targets, context)];
      const finishByAction = step.parameters.finishByAction === true;
      const asChildBuff = step.parameters.asChildBuff === true;
      const addOwnerChild =
        context.addCurrentBuffChild ??
        context.addAbilityChildBuff ??
        context.attachBuffToCurrentSkill;
      if (asChildBuff && addOwnerChild === undefined) {
        throw new Error('asChildBuff applyBuff requires a Buff, Ability, or Skill owner context');
      }
      const count =
        step.parameters.count === undefined
          ? 1
          : resolveActionValueOperand(step.parameters.count, context.blackboard);
      // CreateBuffAction.FillSkillCastInfo 读取动作环境，事件来源只供事件条件读取。
      if (!Number.isFinite(count)) throw new RangeError('applyBuff count must be finite');
      // CreateBuffAction 每次实际施加都读 ID 和参数；前一个子 Buff 启动后可以改变后续读取值。
      const actionBuffs = finishByAction ? this.#requireActionBuffState(context) : undefined;
      if (actionBuffs?.active) {
        throw new Error('action-duration applyBuff step is already active');
      }
      const scoped: BuffApplicationHandle[] = [];
      // 原生用从 0 开始的整数计数器与 float 次数比较，正小数因此会多执行一次。
      for (const receiver of receivers) {
        // 前一个接收者的同步回调可能回收后一个实体，不能提前解析整组容器。
        if (
          runtimeTargetEntityId(receiver) === undefined ||
          this.dependencies.isEntityAvailable?.(receiver) === false
        )
          continue;
        const target = this.#resolveContextTarget(receiver);
        if (finishByAction || asChildBuff || attachToSkill) {
          if (target.applyScoped === undefined)
            throw new Error('applyBuff requires a scoped Buff application port');
        } else if (target.apply === undefined) {
          throw new Error('applyBuff requires a Buff application port');
        }
        // CreateBuffAction 在接收者循环内解析一次来源；空来源跳过该接收者，不读取 Buff ID 或赋值。
        const source = this.#resolveCreationSource(step.parameters, context);
        if (source === undefined) continue;
        for (let repetition = 0; repetition < count; repetition += 1) {
          for (const entry of step.parameters.buffs) {
            const request = this.#createBuffRequest(step.parameters, entry, context, source);
            if (finishByAction || asChildBuff || attachToSkill) {
              const handle = target.applyScoped!(request);
              if (handle !== null) {
                if (finishByAction) {
                  scoped.push(handle);
                  this.#buffHandleBindings.set(buffReferenceKey(handle.reference), handle);
                }
                if (asChildBuff) addOwnerChild!(handle);
                if (attachToSkill) {
                  // 原生派生钩子只对创建成功的实例读取 CastSkillContext。
                  if (attachBuff === undefined) {
                    throw new Error(
                      'currentCastSkill Buff lifetime requires a native CastSkillContext attachment port',
                    );
                  }
                  attachBuff(handle);
                }
              }
            } else {
              target.apply!(request);
            }
          }
        }
      }
      if (actionBuffs !== undefined) {
        actionBuffs.references.splice(
          0,
          actionBuffs.references.length,
          ...scoped.map(handle => handle.reference),
        );
        actionBuffs.active = true;
      }
      return true;
    }

    if (step.kind === 'readBuffBlackboard') {
      if (context === undefined) {
        throw new Error('readBuffBlackboard requires a combat operation context');
      }
      const target = this.#resolveSingleTarget(step.parameters.target, context);
      const buff =
        step.parameters.query.kind === 'tag'
          ? target.findFirstByTags(
              step.parameters.query.buffTags,
              step.parameters.query.tagQueryType,
            )
          : target.findFirstByIds(step.parameters.query.buffIds);
      if (buff === undefined) return false;

      context.blackboard.assignDynamic(
        step.parameters.outputKey,
        buff.blackboard.getNumber(step.parameters.desiredKey) ?? 0,
      );
      context.blackboard.setArtsIntensityFactor(
        step.parameters.outputKey,
        buff.blackboard.getArtsIntensityFactor?.(step.parameters.desiredKey),
        buff.blackboard.getArtsIntensityDetail?.(step.parameters.desiredKey)?.intensity,
        buff.blackboard.getArtsIntensityDetail?.(step.parameters.desiredKey)?.baseValue,
        buff.blackboard.getArtsIntensityDetail?.(step.parameters.desiredKey)?.additionalMultiplier,
      );
      context.blackboard.setValueCalculation(
        step.parameters.outputKey,
        buff.blackboard.getValueCalculation?.(step.parameters.desiredKey),
      );
      return true;
    }

    if (step.kind === 'readEventBuffBlackboard') {
      if (context === undefined)
        throw new Error('readEventBuffBlackboard requires an action context');
      // 当前转换仅准入 GetTargetBuffBBAdvanced(Target, Context)。不能以事件 targetId
      // 替代 Sequence 传入的 TargetHandle；目标为空时原生先返回失败。
      if (context.actionInputTarget === undefined) return false;
      const event = context.event;
      if (
        event === undefined ||
        !('payload' in event) ||
        (event.event !== 'buffConsumed' &&
          event.event !== 'buffAbsorbed' &&
          event.event !== 'buffAbsorbedFrameEnd' &&
          event.event !== 'buffConsumedFrameEnd' &&
          event.event !== 'finishedBuff' &&
          event.event !== 'buffEndsEarly')
      ) {
        return false;
      }
      const value = event.payload.buff.blackboard.getNumber(step.parameters.desiredKey);
      context.blackboard.assignDynamic(
        step.parameters.outputKey,
        typeof value === 'number' ? value : 0,
      );
      context.blackboard.setArtsIntensityFactor(
        step.parameters.outputKey,
        event.payload.buff.blackboard.getArtsIntensityFactor(step.parameters.desiredKey),
        event.payload.buff.blackboard.getArtsIntensityDetail(step.parameters.desiredKey)?.intensity,
        event.payload.buff.blackboard.getArtsIntensityDetail(step.parameters.desiredKey)?.baseValue,
        event.payload.buff.blackboard.getArtsIntensityDetail(step.parameters.desiredKey)
          ?.additionalMultiplier,
      );
      context.blackboard.setValueCalculation(
        step.parameters.outputKey,
        event.payload.buff.blackboard.getValueCalculation(step.parameters.desiredKey),
      );
      return true;
    }

    if (step.kind === 'readBuffRemainingDuration') {
      if (context === undefined || this.dependencies.queryTargets === undefined)
        throw new Error('Buff lifetime query requires an action target resolver');
      const selected = this.dependencies.queryTargets(step.parameters.target, context)[0];
      let remaining = 0;
      if (selected !== undefined) {
        const target = this.#resolveContextTarget(selected);
        if (step.parameters.query.kind === 'environment') {
          if (target.ownerId === context.buffOwnerId)
            remaining = context.getCurrentBuffRemainingDuration?.() ?? 0;
        } else {
          if (target.findMatching === undefined)
            throw new Error('Buff target cannot enumerate matches');
          for (const buff of target.findMatching(step.parameters.query)) {
            if (buff.remainingDuration != null) remaining = buff.remainingDuration;
          }
        }
      }
      // 原生只在差值超过容差时写回，避免触发无变化的变量更新。
      if (
        Math.abs((context.blackboard.getNumber(step.parameters.outputKey) ?? 0) - remaining) > 1e-5
      )
        context.blackboard.assignDynamic(step.parameters.outputKey, remaining);
      return true;
    }

    if (step.kind === 'setBuffRemainingDuration') {
      if (context === undefined)
        throw new Error('Buff duration mutation requires an action context');
      const target = this.#resolveSingleTarget(step.parameters.target, context);
      if (target.setRemainingDuration === undefined)
        throw new Error('Buff target cannot modify duration');
      target.setRemainingDuration(
        step.parameters.query,
        step.parameters.operation,
        resolveActionValueOperand(step.parameters.value, context.blackboard),
      );
      return true;
    }
    if (step.kind === 'setCurrentBuffRemainingDuration') {
      if (
        context?.getCurrentBuffRemainingDuration === undefined ||
        context.setCurrentBuffRemainingDuration === undefined
      ) {
        throw new Error('setCurrentBuffRemainingDuration requires a Buff operation context');
      }
      if (
        step.parameters.target !== undefined &&
        this.#resolveSingleTarget(step.parameters.target, context).ownerId !== context.buffOwnerId
      )
        return true;
      const current = context.getCurrentBuffRemainingDuration();
      if (current === null) return true;
      const operand = resolveActionValueOperand(step.parameters.value, context.blackboard);
      const result =
        step.parameters.operation === 'assign'
          ? operand
          : step.parameters.operation === 'add'
            ? current + operand
            : current * operand;
      context.setCurrentBuffRemainingDuration(Math.max(0, result));
      return true;
    }

    if (step.kind === 'refreshCurrentBuffAttributeModifiers') {
      if (context?.refreshCurrentBuffAttributeModifiers === undefined) {
        throw new Error('refreshCurrentBuffAttributeModifiers requires a Buff operation context');
      }
      context.refreshCurrentBuffAttributeModifiers();
      return true;
    }

    if (step.kind === 'readBuffStackCount') {
      if (context === undefined) {
        throw new Error('readBuffStackCount requires a combat operation context');
      }
      if (step.parameters.query.kind === 'environment') {
        if (context.getCurrentBuffEnhanceCount === undefined) {
          throw new Error('readBuffStackCount environment query requires a Buff operation context');
        }
        context.blackboard.assignDynamic(
          step.parameters.outputKey,
          context.getCurrentBuffEnhanceCount(),
        );
        return true;
      }
      const target = this.#resolveSingleTarget(step.parameters.target, context);
      const skillCastId = step.parameters.sameSourceSkillCast
        ? this.#requireSkillCastId(context, 'readBuffStackCount')
        : undefined;
      const count =
        step.parameters.countType === 'instance'
          ? (() => {
              if (skillCastId !== undefined) {
                throw new Error(
                  'readBuffStackCount instance mode does not support sameSourceSkillCast',
                );
              }
              if (step.parameters.query.kind === 'id') {
                if (target.getInstanceCountByIds === undefined) {
                  throw new Error(
                    'readBuffStackCount ID instance mode requires Buff instance counting',
                  );
                }
                return target.getInstanceCountByIds(step.parameters.query.buffIds);
              }
              if (
                step.parameters.query.kind !== 'tag' ||
                target.getInstanceCountByTags === undefined
              ) {
                throw new Error(
                  'readBuffStackCount instance mode requires a tag query and Buff instance counting',
                );
              }
              return target.getInstanceCountByTags(
                step.parameters.query.buffTags,
                step.parameters.query.tagQueryType,
              );
            })()
          : step.parameters.query.kind === 'tag'
            ? target.getCountByTags(
                step.parameters.query.buffTags,
                step.parameters.query.tagQueryType,
                false,
                skillCastId,
              )
            : // 原生 Save 的 Id 分支逐项求和，重复 ID 也重复计入；不做集合去重。
              step.parameters.query.buffIds.reduce(
                (sum, id) => sum + target.getCountByIds([id], skillCastId),
                0,
              );
      context.blackboard.assignDynamic(step.parameters.outputKey, count);
      const query = step.parameters.query;
      const sourceKey =
        query.kind === 'id' && query.buffIds.length === 1
          ? query.buffIds[0]
          : query.kind === 'tag' &&
              query.buffTags.length === 1 &&
              (query.tagQueryType === 'hasAny' || query.tagQueryType === 'hasAll')
            ? query.buffTags[0]
            : undefined;
      if (step.parameters.countType !== 'instance' && sourceKey !== undefined) {
        context.blackboard.setValueCalculation(step.parameters.outputKey, {
          operation: 'assign',
          left: 0,
          right: count,
          result: count,
          sourceKind: query.kind === 'id' ? 'buffIdStackCount' : 'buffTagStackCount',
          rightKey: sourceKey,
        });
      }
      return true;
    }

    if (step.kind === 'dispelBuffs') {
      if (context === undefined || this.dependencies.queryTargets === undefined)
        throw new Error('dispelBuffs requires an action target resolver');
      const source = this.dependencies.queryTargets(step.parameters.source, context)[0];
      const sourceId = source === undefined ? undefined : runtimeTargetEntityId(source);
      if (sourceId === undefined) return true;
      const targets = this.dependencies.queryTargets(step.parameters.targets, context);
      for (const ref of targets) {
        if (runtimeTargetEntityId(ref) === undefined) continue;
        const target = this.#resolveContextTarget(ref);
        if (target.dispel === undefined)
          throw new Error(`Buff target '${target.ownerId}' does not support dispel`);
        target.dispel(sourceId, step.parameters.level, step.parameters.query);
      }
      return true;
    }

    if (step.kind === 'finishBuffsByTag' || step.kind === 'finishBuffsById') {
      if (context === undefined || this.dependencies.queryTargets === undefined) {
        throw new Error(`${step.kind} requires an action target resolver`);
      }
      const targets = [...this.dependencies.queryTargets(step.parameters.targets, context)];
      // 原生先构造一次结束选项，再遍历目标；同步回调不能改写后续目标使用的数值和来源。
      const source =
        step.parameters.reason === 'other'
          ? undefined
          : this.dependencies.queryTargets(step.parameters.finishSource, context)[0];
      const finishSourceId = source === undefined ? undefined : runtimeTargetEntityId(source);
      const count =
        step.parameters.count === undefined
          ? undefined
          : Math.trunc(resolveActionValueOperand(step.parameters.count, context.blackboard));
      const castInfo = context.skillCastInfo ?? null;
      for (const ref of targets) {
        if (runtimeTargetEntityId(ref) === undefined) continue;
        const target = this.#resolveContextTarget(ref);
        if (step.kind === 'finishBuffsByTag') {
          if (count === undefined) {
            target.finishByTags(
              step.parameters.buffTags,
              step.parameters.tagQueryType,
              step.parameters.reason,
              false,
              finishSourceId,
              castInfo,
            );
          } else {
            if (target.finishCountByTags === undefined)
              throw new Error('finishBuffsByTag count requires a count-aware Buff target');
            target.finishCountByTags(
              step.parameters.buffTags,
              step.parameters.tagQueryType,
              count,
              step.parameters.reason,
              false,
              finishSourceId,
              castInfo,
            );
          }
        } else if (count === undefined) {
          for (const id of step.parameters.buffIds)
            target.finishByIds([id], step.parameters.reason, finishSourceId, castInfo);
        } else {
          if (target.finishCountByIds === undefined)
            throw new Error('finishBuffsById count requires a count-aware Buff target');
          for (const id of step.parameters.buffIds)
            target.finishCountByIds([id], count, step.parameters.reason, finishSourceId, castInfo);
        }
      }
      return true;
    }

    if (step.kind === 'finishCurrentBuff') {
      if (context?.finishCurrentBuff === undefined) {
        throw new Error('finishCurrentBuff requires a Buff operation context');
      }
      // FinishCurBuff 原生传空 finishSource 和默认 SkillCastInfo，不继承当前动作的施法身份。
      if (step.parameters.finishSource === 'none') {
        context.finishCurrentBuff(step.parameters.reason, undefined, null);
        return true;
      }
      const sourceId =
        step.parameters.finishSource === 'actionOwner'
          ? (context.actionOwnerId ?? context.buffOwnerId)
          : (context.actionSourceId ?? context.buffSourceId);
      if (sourceId === undefined)
        throw new Error(`finishCurrentBuff requires ${step.parameters.finishSource} identity`);
      context.finishCurrentBuff(step.parameters.reason, sourceId, context.skillCastInfo ?? null);
      return true;
    }

    if (step.kind === 'setCurrentBuffTimePaused') {
      if (context?.setCurrentBuffTimePaused === undefined) {
        throw new Error('setCurrentBuffTimePaused requires a Buff operation context');
      }
      context.setCurrentBuffTimePaused(step.parameters.paused);
      return true;
    }

    if (step.kind === 'igniteBuffs') {
      const target = this.#resolveSingleTarget(step.parameters.target, context);
      if (target.ignite === undefined) {
        throw new Error(`Buff target '${target.ownerId}' does not support ignite events`);
      }
      const sourceId =
        step.parameters.source === 'currentBuffSource'
          ? context?.buffSourceId
          : this.#resolveSingleTarget(step.parameters.source, context).ownerId;
      if (sourceId === undefined) {
        throw new Error('igniteBuffs current Buff source requires a Buff operation context');
      }
      target.ignite(step.parameters.igniteType, sourceId, context?.skillCastInfo);
      return true;
    }

    if (step.kind === 'holdBuffsById') {
      const actionBuffs = this.#requireActionBuffState(context);
      if (actionBuffs.active) {
        throw new Error('holdBuffsById step is already active');
      }
      const hold = this.dependencies
        .resolveTarget(step.parameters.target)
        .holdByIds(step.parameters.buffIds);
      if (hold.references === undefined) {
        throw new Error('holdBuffsById target must expose held Buff references');
      }
      actionBuffs.references.push(...hold.references);
      actionBuffs.active = true;
      return true;
    }

    if (step.kind === 'inheritBuffById') {
      const actionBuffs = this.#requireActionBuffState(context);
      if (actionBuffs.active) {
        throw new Error('inheritBuffById step is already active');
      }
      const target = this.dependencies.resolveTarget(step.parameters.target);
      if (target.findFirstHandleByIds === undefined) {
        throw new Error(`Buff target '${target.ownerId}' cannot expose stable instance handles`);
      }
      const handle = target.findFirstHandleByIds([step.parameters.buffId]);
      actionBuffs.active = true;
      if (handle === undefined) return true;
      if (context?.detachBuffFromCurrentSkill === undefined) {
        throw new Error('inheritBuffById requires a current-skill detachment port');
      }
      context.detachBuffFromCurrentSkill(handle);
      actionBuffs.references.push(handle.reference);
      this.#buffHandleBindings.set(buffReferenceKey(handle.reference), handle);
      return true;
    }

    return context === undefined
      ? this.dependencies.delegate.execute(step)
      : this.dependencies.delegate.execute(step, context);
  }

  #resolveApplicationTargets(
    target: BuffApplicationTarget,
    context?: CombatOperationContext,
  ): readonly BuffOperationTarget[] {
    if (target === 'actionInputTarget') return [this.#resolveSingleTarget(target, context)];
    if (target === 'eventSource') {
      const resolve = this.dependencies.resolveEventTarget;
      if (resolve === undefined) {
        throw new Error('eventSource Buff application is not configured');
      }
      return [resolve(this.#requireEventSourceId(context))];
    }
    if (target === 'buffOwner') {
      if (context?.buffOwnerId === undefined) {
        throw new Error('buffOwner Buff application requires a Buff lifecycle context');
      }
      const resolve = this.dependencies.resolveEventTarget;
      if (resolve === undefined) {
        throw new Error('buffOwner Buff application is not configured');
      }
      return [resolve(context.buffOwnerId)];
    }
    if (target === 'buffSource') {
      if (context?.buffSourceId === undefined) {
        throw new Error('buffSource Buff application requires a Buff lifecycle context');
      }
      const resolve = this.dependencies.resolveEventTarget;
      if (resolve === undefined) {
        throw new Error('buffSource Buff application is not configured');
      }
      return [resolve(context.buffSourceId)];
    }
    if (target === 'eventTarget') {
      if (context?.event === undefined) {
        throw new Error('eventTarget Buff application requires an event context');
      }
      const resolve = this.dependencies.resolveEventTarget;
      if (resolve === undefined) {
        throw new Error('eventTarget Buff application is not configured');
      }
      const eventTargetId = abilityEventTargetId(context.event);
      if (eventTargetId === undefined) {
        throw new Error(`event '${context.event.kind}' does not expose a Buff target`);
      }
      return [resolve(eventTargetId)];
    }
    if (target === 'currentAbilityEntity') {
      if (context?.currentTarget === undefined) {
        throw new Error('currentAbilityEntity Buff application requires a current target');
      }
      const resolve = this.dependencies.resolveCurrentAbilityEntityTarget;
      if (resolve === undefined) {
        throw new Error('currentAbilityEntity Buff application is not configured');
      }
      return [resolve(context.currentTarget)];
    }
    if (target === 'currentTarget') {
      return [this.#resolveContextTarget(context?.currentTarget)];
    }
    const resolved = this.dependencies.resolveApplicationTargets?.(target);
    if (resolved !== undefined) return resolved;
    if (
      target === 'party' ||
      target === 'partyExceptCaster' ||
      target === 'partyExceptCasterAndSameCharacterType' ||
      target === 'controlledOperator' ||
      target === 'casterAndControlledOperator' ||
      target === 'casterAndLowestHealthRatioOperatorExceptCaster'
    ) {
      throw new Error('collection Buff application requires a collection target resolver');
    }
    return [this.dependencies.resolveTarget(target)];
  }

  #resolveCreationSource(
    parameters: Pick<ResolvedCombatStepForKind<'applyBuff'>['parameters'], 'source'>,
    context: CombatOperationContext | undefined,
  ): Pick<BuffOperationTarget, 'ownerId' | 'getAttributeValue'> | undefined {
    if (context === undefined || this.dependencies.queryTargets === undefined)
      throw new Error('applyBuff requires an action target query context');
    const first = this.dependencies.queryTargets(
      parameters.source ?? { kind: 'source' },
      context,
    )[0];
    const id = first === undefined ? undefined : runtimeTargetEntityId(first);
    // 原生取首个包装器，不跳过位置目标寻找后续实体。
    return id === undefined ? undefined : { ownerId: id };
  }

  /** Context 的实例身份是唯一依据，单层查询可能返回干员、敌人或另一能力实体。 */
  #resolveContextTarget(target: RuntimeTargetRef | undefined): BuffOperationTarget {
    if (target === undefined)
      throw new Error('currentTarget Buff operation requires a current target');
    const id = runtimeTargetEntityId(target);
    if (id === undefined || this.dependencies.resolveEventTarget === undefined)
      throw new Error('Buff Context requires an AbilitySystem target resolver');
    return this.dependencies.resolveEventTarget(id);
  }

  #resolveApplicationSource(
    source: BuffApplicationSource,
    context?: CombatOperationContext,
    needsAttributes = true,
  ): Pick<BuffOperationTarget, 'ownerId' | 'getAttributeValue'> {
    if (source === 'buffSource' || source === 'buffOwner') {
      const id = source === 'buffSource' ? context?.buffSourceId : context?.buffOwnerId;
      if (id === undefined)
        throw new Error(`${source} Buff source requires a Buff lifecycle context`);
      // 继承来源身份不要求来源仍有活动的 Buff 容器（例如已结束的投射物）。
      if (!needsAttributes) return { ownerId: id };
      const resolve = this.dependencies.resolveEventTarget;
      if (resolve === undefined) throw new Error(`${source} Buff source is not configured`);
      return resolve(id);
    }
    if (source === 'eventSource') {
      if (!needsAttributes) return { ownerId: this.#requireEventSourceId(context) };
      const resolve = this.dependencies.resolveEventTarget;
      if (resolve === undefined) {
        throw new Error('eventSource Buff source is not configured');
      }
      return resolve(this.#requireEventSourceId(context));
    }
    if (source !== 'currentAbilityEntity') return this.dependencies.resolveTarget(source);
    if (context?.currentTarget === undefined) {
      throw new Error('currentAbilityEntity Buff source requires a current target');
    }
    const resolve = this.dependencies.resolveCurrentAbilityEntityTarget;
    if (resolve === undefined) {
      throw new Error('currentAbilityEntity Buff source is not configured');
    }
    return resolve(context.currentTarget);
  }

  end(step: RuntimeOperation, context?: CombatOperationContext): void {
    if (step.kind === 'skillAffix') {
      const state = context?.actionRegistrationState;
      if (state === undefined) throw new Error('SkillAffix requires action data');
      if (state.registrationIds.length > 0) {
        if (context?.finishCurrentBuffSkillAffix === undefined)
          throw new Error('SkillAffix requires a current Buff finish port');
        for (const id of state.registrationIds) context.finishCurrentBuffSkillAffix(id);
        state.registrationIds = [];
      }
      return;
    }
    if (step.kind === 'holdBuffsById') {
      const actionBuffs = this.#requireActionBuffState(context);
      const target = this.dependencies.resolveTarget(step.parameters.target);
      if (target.releaseHeld === undefined) {
        throw new Error(`Buff target '${target.ownerId}' cannot release a restored hold`);
      }
      target.releaseHeld(actionBuffs.references);
      actionBuffs.references.length = 0;
      actionBuffs.active = false;
      return;
    }
    if (step.kind === 'inheritBuffById') {
      const actionBuffs = this.#requireActionBuffState(context);
      const reference = actionBuffs.references[0];
      actionBuffs.references.length = 0;
      actionBuffs.active = false;
      if (reference === undefined) return;
      const handle = this.#resolveActionBuff(reference);
      if (handle === undefined) return;
      if (!step.parameters.finishByAction) return;
      const hasNextSkill = context?.pendingNextSkillId !== undefined;
      const inherited =
        hasNextSkill && step.parameters.inheritToNextSkillIds.includes(context.pendingNextSkillId!);
      // 原生 InheritBuffAction.OnEnd 先检查继承名单；附着开关不能放行名单外技能。
      // 名单内且不要求随下一技能结束时，仅释放动作引用，保留 Buff 自身寿命。
      if (inherited && !step.parameters.finishWithNextSkillIfNotInherited) return;
      if (inherited) {
        if (context?.attachBuffToNextSkill === undefined) {
          throw new Error('inheritBuffById requires a next-skill attachment port');
        }
        context.attachBuffToNextSkill(handle);
      } else {
        handle.finish('other');
      }
      return;
    }
    if (step.kind === 'applyBuff' && step.parameters.finishByAction === true) {
      const actionBuffs = this.#requireActionBuffState(context);
      const handles = actionBuffs.references.flatMap(reference => {
        const handle = this.#resolveActionBuff(reference);
        return handle === undefined ? [] : [handle];
      });
      const inherited =
        context?.pendingNextSkillId !== undefined &&
        step.parameters.inheritToNextSkillIds?.includes(context.pendingNextSkillId) === true;
      if (inherited) {
        if (
          context.detachBuffFromCurrentSkill === undefined ||
          context.attachBuffToNextSkill === undefined
        ) {
          throw new Error('inherited action-duration Buff requires a next-skill attachment port');
        }
        for (const handle of handles) {
          context.detachBuffFromCurrentSkill(handle);
          context.attachBuffToNextSkill(handle);
        }
      } else {
        for (const handle of handles) handle.finish('other');
      }
      actionBuffs.references.length = 0;
      actionBuffs.active = false;
      return;
    }
    this.dependencies.delegate.end?.(step, context);
  }

  #createBuffRequest(
    parameters: Pick<
      ResolvedCombatStepForKind<'applyBuff'>['parameters'],
      'iconDurationSource' | 'inheritSourceSkillCastInfo' | 'isExtra'
    >,
    entry: ResolvedCombatStepForKind<'applyBuff'>['parameters']['buffs'][number],
    context: CombatOperationContext | undefined,
    source: Pick<BuffOperationTarget, 'ownerId' | 'getAttributeValue'>,
  ): BuffApplicationRequest {
    const identity = stringInputExpression(entry.buffId);
    const dynamicId = typeof identity !== 'string';
    const assignments = entry.blackboardAssignments ?? {};
    const stringAssignments = entry.stringBlackboardAssignments ?? {};
    const copiedAssignments = entry.copiedBlackboardAssignments ?? {};
    if (
      (Object.keys(assignments).length > 0 ||
        Object.keys(stringAssignments).length > 0 ||
        Object.keys(copiedAssignments).length > 0) &&
      context === undefined
    ) {
      throw new Error('applyBuff runtime values require a combat operation context');
    }

    const buffId =
      typeof identity === 'string'
        ? identity
        : context?.blackboard.getString(identity.blackboardKey);
    if (buffId === undefined || buffId.trim().length === 0)
      throw new Error(
        `Buff ID '${typeof identity === 'string' ? identity : identity.blackboardKey}' 缺失、为空或不是字符串`,
      );
    let definition = this.dependencies.resolveBuffDefinition?.(buffId);
    if (dynamicId && definition === undefined) {
      throw new Error(`动态 Buff ID '${buffId}' 在定义目录中不存在`);
    }
    if (entry.keywordEnhancements?.length) {
      if (definition === undefined) throw new Error(`关键词 Buff '${buffId}' 在定义目录中不存在`);
      if (definition.keywordEnhancements?.length)
        throw new Error(`关键词 Buff '${buffId}' 的共享定义已含实例增强规则`);
      definition = {
        ...definition,
        keywordEnhancements: entry.keywordEnhancements.map(enhancement => ({
          triggerBuffIds: enhancement.triggerBuffIds,
          operation: enhancement.operation,
          targetKey: 'rate',
          initialValue: { blackboardKey: 'rate' },
          value: resolveActionValueOperand(enhancement.value, context!.blackboard),
        })),
      };
    }
    const requiresSourceAttributeValue = definition?.shields?.some(
      shield =>
        typeof shield.value === 'object' &&
        'attribute' in shield.value &&
        shield.value.attributeSource === 'buffSource',
    );
    const sourceTarget =
      requiresSourceAttributeValue && source.getAttributeValue === undefined
        ? (this.dependencies.resolveEventTarget?.(source.ownerId) ??
          (source.ownerId === this.dependencies.sourceId
            ? this.dependencies.resolveTarget('caster')
            : undefined))
        : source;
    if (requiresSourceAttributeValue && sourceTarget?.getAttributeValue === undefined)
      throw new Error(`Buff shield requires source attributes for '${source.ownerId}'`);
    let iconDurationSourceTargetId: string | undefined;
    if (parameters.iconDurationSource?.kind === 'actionOwnerAbilityEntity') {
      if (context?.actionOwnerAbilityEntity === undefined) {
        throw new Error(
          'AbilityEntity Buff icon duration source requires an AbilityEntity action owner',
        );
      }
      iconDurationSourceTargetId = `ability-entity:${context.actionOwnerAbilityEntity.instanceId}`;
    } else if (parameters.iconDurationSource?.kind === 'actionOwnerTimedMarker') {
      if (context?.actionOwnerAbilityEntity === undefined) {
        throw new Error(
          'TimedMarker Buff icon duration source requires an AbilityEntity action owner',
        );
      }
      const resolve = this.dependencies.resolveAbilityEntityTimedMarkerSource;
      if (resolve === undefined) {
        throw new Error('TimedMarker Buff icon duration source runtime is not configured');
      }
      iconDurationSourceTargetId = resolve(
        context.actionOwnerAbilityEntity,
        parameters.iconDurationSource.markerId,
      );
      if (iconDurationSourceTargetId === undefined) {
        throw new Error(
          `AbilityEntity TimedMarker '${parameters.iconDurationSource.markerId}' is not active`,
        );
      }
    }
    return {
      buffId,
      partTransferInfo: resolveOperationPartTransferInfo(context),
      producedBy: operationProducer(context, {
        ownerId: this.dependencies.sourceId,
        actionId: this.dependencies.sourceActionId,
      }),
      ...(definition === undefined ? {} : { definition }),
      sourceId: source.ownerId,
      definitionOwnerId: this.dependencies.definitionOwnerId ?? this.dependencies.sourceId,
      // 已解析定义且没有来源属性消费者时，不建立多余的活对象依赖；来源身份仍保留。
      ...((definition !== undefined && !requiresSourceAttributeValue) ||
      sourceTarget?.getAttributeValue === undefined
        ? {}
        : {
            getSourceAttributeValue: sourceTarget.getAttributeValue.bind(sourceTarget),
            sourceAttributeOwnerId: sourceTarget.ownerId,
          }),
      ...(this.dependencies.sourceActionId === undefined
        ? {}
        : { sourceActionId: this.dependencies.sourceActionId }),
      blackboardValues: Object.fromEntries([
        ...Object.entries(assignments).map(
          ([key, operand]) =>
            [key, resolveActionValueOperand(operand, context!.blackboard)] as const,
        ),
        ...Object.entries(stringAssignments),
        ...Object.entries(copiedAssignments).map(([targetKey, sourceKey]) => {
          const value = context!.blackboard.getValue(sourceKey);
          if (value === undefined) {
            throw new Error(`action blackboard value '${sourceKey}' is missing`);
          }
          return [targetKey, value] as const;
        }),
      ]),
      ...(context === undefined
        ? {}
        : (() => {
            const factors = Object.fromEntries(
              Object.entries(
                Object.fromEntries([
                  ...Object.entries(assignments).map(
                    ([key, operand]) =>
                      [key, resolveSkillSettingFactor(operand, context.blackboard)] as const,
                  ),
                  ...Object.keys(stringAssignments).map(key => [key, undefined] as const),
                  ...Object.entries(copiedAssignments).map(
                    ([key, sourceKey]) =>
                      [key, context.blackboard.getArtsIntensityDetail(sourceKey)] as const,
                  ),
                ]),
              ).filter((entry): entry is [string, ArtsIntensityFactor] => entry[1] !== undefined),
            );
            return Object.keys(factors).length ? { blackboardArtsIntensityFactors: factors } : {};
          })()),
      ...(context === undefined
        ? {}
        : (() => {
            const calculations = Object.fromEntries(
              Object.entries(
                Object.fromEntries([
                  ...Object.entries(assignments).map(([key, operand]) => [
                    key,
                    (() => {
                      const sourceKey = valueInputBlackboardKey(operand);
                      return sourceKey === undefined
                        ? undefined
                        : context.blackboard.getValueCalculation(sourceKey);
                    })(),
                  ]),
                  ...Object.keys(stringAssignments).map(key => [key, undefined]),
                  ...Object.entries(copiedAssignments).map(([key, sourceKey]) => [
                    key,
                    context.blackboard.getValueCalculation(sourceKey),
                  ]),
                ]),
              ).filter(
                (entry): entry is [string, ActionValueCalculation] => entry[1] !== undefined,
              ),
            );
            return Object.keys(calculations).length
              ? { blackboardValueCalculations: calculations }
              : {};
          })()),
      ...(parameters.inheritSourceSkillCastInfo && context?.skillCastInfo !== undefined
        ? { skillCastInfo: context?.skillCastInfo }
        : {}),
      ...(parameters.isExtra ? { isExtra: true } : {}),
      ...(iconDurationSourceTargetId === undefined ? {} : { iconDurationSourceTargetId }),
    };
  }
  #requireActionBuffState(context: CombatOperationContext | undefined) {
    const state = context?.actionBuffReferencesState;
    if (state === undefined) throw new Error('action-owned Buff operation requires action data');
    return state;
  }

  #resolveActionBuff(reference: BuffReference): BuffApplicationHandle | undefined {
    const key = buffReferenceKey(reference);
    const resolve = this.dependencies.resolveBuffReference;
    if (resolve !== undefined) {
      this.#buffHandleBindings.delete(key);
      const bound = resolve(reference);
      return bound?.isRecycled === true || bound?.isFinished === true ? undefined : bound;
    }
    const cached = this.#buffHandleBindings.get(key);
    if (cached !== undefined) {
      this.#buffHandleBindings.delete(key);
      return cached.isRecycled || cached.isFinished === true ? undefined : cached;
    }
    const target = this.dependencies.resolveEventTarget?.(reference.ownerId);
    if (target?.resolveHandle === undefined) {
      throw new Error(`action-owned Buff '${key}' cannot be rebound in the current branch`);
    }
    // 动作仍未结束时，Buff 可以先消费并回收。容器明确返回空引用时无需再次结束或继承。
    const rebound = target.resolveHandle(reference);
    return rebound?.isFinished === true ? undefined : rebound;
  }

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'checkActionResult')
      throw new Error('checkActionResult must be evaluated by its action graph invocation');
    if (condition.kind === 'contextTargetBuffStackCompare') {
      if (context?.targetContext === undefined)
        throw new Error('context Buff count requires a combat target context');
      const first = context.targetContext.getOptional(condition.contextKey)?.[0];
      if (first === undefined || first.kind === 'spatialPoint')
        return (
          condition.compareZeroWhenTargetMissing &&
          compareCombatNumbers(
            0,
            resolveActionValueOperand(condition.value, context.blackboard),
            condition.operator,
          )
        );
      const target =
        first.kind === 'abilityEntity'
          ? this.dependencies.resolveCurrentAbilityEntityTarget?.(first)
          : this.dependencies.resolveEventTarget?.(runtimeTargetEntityId(first)!);
      if (target === undefined) throw new Error('context Buff count requires a target resolver');
      const count = target.getCountByTags(condition.buffTags, condition.tagQueryType);
      return compareCombatNumbers(
        count,
        resolveActionValueOperand(condition.value, context.blackboard),
        condition.operator,
      );
    }
    if (condition.kind === 'contextTargetBuffIdStackCompare') {
      if (context?.targetContext === undefined)
        throw new Error('context Buff count requires a combat target context');
      const first = context.targetContext.getOptional(condition.contextKey)?.[0];
      if (first === undefined || first.kind === 'spatialPoint')
        return (
          condition.compareZeroWhenTargetMissing &&
          compareCombatNumbers(
            0,
            resolveActionValueOperand(condition.value, context.blackboard),
            condition.operator,
          )
        );
      const target =
        first.kind === 'abilityEntity'
          ? this.dependencies.resolveCurrentAbilityEntityTarget?.(first)
          : this.dependencies.resolveEventTarget?.(runtimeTargetEntityId(first)!);
      if (target === undefined) throw new Error('context Buff count requires a target resolver');
      return compareCombatNumbers(
        target.getCountByIds(condition.buffIds),
        resolveActionValueOperand(condition.value, context.blackboard),
        condition.operator,
      );
    }
    if (condition.kind === 'contextTargetEntityTagMatch') {
      if (context?.targetContext === undefined) {
        throw new Error('context entity tag check requires a combat target context');
      }
      const targets = context.targetContext.getOptional(condition.contextKey) ?? [];
      let found = false;
      for (let index = targets.length - 1; index >= 0; index -= 1) {
        const reference = targets[index]!;
        if (reference.kind === 'spatialPoint') continue;
        const target =
          reference.kind === 'abilityEntity'
            ? this.dependencies.resolveCurrentAbilityEntityTarget?.(reference)
            : this.dependencies.resolveEventTarget?.(runtimeTargetEntityId(reference)!);
        if (target === undefined)
          throw new Error('context entity tag check requires a target resolver');
        found = true;
        if (!target.matchesEntityTags(condition.tags, condition.tagQueryType)) return false;
      }
      return found;
    }
    if (condition.kind === 'eventTargetBuffCountCompare') {
      const event = context?.event;
      if (
        context === undefined ||
        event === undefined ||
        (!('targetId' in event) && !('payload' in event))
      ) {
        throw new Error('eventTargetBuffCountCompare requires an event target identity');
      }
      const resolveTarget = this.dependencies.resolveEventTarget;
      if (resolveTarget === undefined) {
        throw new Error('eventTargetBuffCountCompare requires an event target resolver');
      }
      const targetId = abilityEventTargetId(event);
      if (targetId === undefined)
        throw new Error('eventTargetBuffCountCompare requires an event target identity');
      const target = resolveTarget(targetId);
      if (target.getInstanceCountByTags === undefined) {
        throw new Error('eventTargetBuffCountCompare requires Buff instance counting');
      }
      const count = target.getInstanceCountByTags(condition.buffTags, condition.tagQueryType);
      return compareCombatNumbers(
        count,
        resolveActionValueOperand(condition.value, context.blackboard),
        condition.operator,
      );
    }
    if (condition.kind === 'buffStackCompare') {
      if (context === undefined) {
        throw new Error('buffStackCompare requires a combat operation context');
      }
      const count = this.#resolveSingleTarget(condition.target, context).getCountByTags(
        condition.buffTags,
        condition.tagQueryType,
        false,
        condition.sameSourceSkillCast
          ? this.#requireSkillCastId(context, 'buffStackCompare')
          : undefined,
      );
      return compareCombatNumbers(
        count,
        resolveActionValueOperand(condition.value, context.blackboard),
        condition.operator,
      );
    }
    if (condition.kind === 'buffTagIdCountCompare') {
      if (context === undefined) {
        throw new Error('buffTagIdCountCompare requires a combat operation context');
      }
      const target = this.#resolveSingleTarget(condition.target, context);
      if (target.getDistinctIdCountByTags === undefined) {
        throw new Error('buffTagIdCountCompare requires distinct Buff ID counting');
      }
      const count = target.getDistinctIdCountByTags(condition.buffTags, condition.tagQueryType);
      return compareCombatNumbers(
        count,
        resolveActionValueOperand(condition.value, context.blackboard),
        condition.operator,
      );
    }
    if (condition.kind === 'currentBuffStackCompare') {
      if (context?.getCurrentBuffEnhanceCount === undefined) {
        throw new Error('currentBuffStackCompare requires a Buff operation context');
      }
      return compareCombatNumbers(
        context.getCurrentBuffEnhanceCount(),
        resolveActionValueOperand(condition.value, context.blackboard),
        condition.operator,
      );
    }
    if (condition.kind === 'entityTagMatch') {
      return this.#resolveSingleTarget(condition.target, context).matchesEntityTags(
        condition.tags,
        condition.tagQueryType,
      );
    }
    if (condition.kind === 'buffIdStackCompare') {
      const count = this.#resolveSingleTarget(condition.target, context).getCountByIds(
        condition.buffIds,
        condition.sameSourceSkillCast
          ? this.#requireSkillCastId(context, 'buffIdStackCompare')
          : undefined,
      );
      if (typeof condition.value === 'number') {
        return compareCombatNumbers(count, condition.value, condition.operator);
      }
      if (context === undefined) {
        throw new Error('dynamic buffIdStackCompare requires a combat operation context');
      }
      const value = resolveActionValueOperand(condition.value, context.blackboard);
      return compareCombatNumbers(count, value, condition.operator);
    }
    if (condition.kind === 'buffBlackboardValueCompare') {
      if (context === undefined) {
        throw new Error('buffBlackboardValueCompare requires a combat operation context');
      }
      const target = this.#resolveSingleTarget(condition.target, context);
      const buff =
        condition.query.kind === 'tag'
          ? target.findFirstByTags(condition.query.buffTags, condition.query.tagQueryType)
          : target.findFirstByIds(condition.query.buffIds);
      if (buff === undefined) return false;
      const value = buff.blackboard.getNumber(condition.desiredKey) ?? 0;
      context.blackboard.assignDynamic(condition.outputKey, value);
      return compareCombatNumbers(
        value,
        resolveActionValueOperand(condition.value, context.blackboard),
        condition.operator,
      );
    }
    return context === undefined
      ? this.dependencies.delegate.evaluate(condition)
      : this.dependencies.delegate.evaluate(condition, context);
  }

  #resolveSingleTarget(
    target:
      | CombatTarget
      | 'currentAbilityEntity'
      | 'eventTarget'
      | 'eventSource'
      | 'actionInputTarget'
      | 'controlledOperator'
      | 'buffOwner'
      | 'buffSource'
      | 'currentTarget',
    context: CombatOperationContext | undefined,
  ): BuffOperationTarget {
    if (target === 'actionInputTarget') {
      const inputTarget = context?.actionInputTarget;
      if (inputTarget === undefined) {
        throw new Error('actionInputTarget Buff operation requires an action InputTarget');
      }
      const resolve = this.dependencies.resolveEventTarget;
      if (resolve === undefined) {
        throw new Error('actionInputTarget Buff operation is not configured');
      }
      return resolve(
        inputTarget.kind === 'operator'
          ? inputTarget.operatorId
          : inputTarget.kind === 'abilityEntity'
            ? `ability-entity:${inputTarget.instanceId}`
            : 'enemy',
      );
    }
    if (target === 'eventSource') {
      const resolve = this.dependencies.resolveEventTarget;
      if (resolve === undefined) {
        throw new Error('eventSource Buff operation is not configured');
      }
      return resolve(this.#requireEventSourceId(context));
    }
    if (target === 'buffOwner') {
      if (context?.buffOwnerId === undefined) {
        throw new Error('buffOwner Buff operation requires a Buff lifecycle context');
      }
      const resolve = this.dependencies.resolveEventTarget;
      if (resolve === undefined) {
        throw new Error('buffOwner Buff operation is not configured');
      }
      return resolve(context.buffOwnerId);
    }
    if (target === 'buffSource') {
      if (context?.buffSourceId === undefined) {
        throw new Error('buffSource Buff operation requires a Buff lifecycle context');
      }
      const resolve = this.dependencies.resolveEventTarget;
      if (resolve === undefined) {
        throw new Error('buffSource Buff operation is not configured');
      }
      return resolve(context.buffSourceId);
    }
    if (target === 'eventTarget') {
      if (context?.event === undefined) {
        throw new Error('eventTarget Buff operation requires an event context');
      }
      const resolve = this.dependencies.resolveEventTarget;
      if (resolve === undefined) {
        throw new Error('eventTarget Buff operation is not configured');
      }
      const eventTargetId = abilityEventTargetId(context.event);
      if (eventTargetId === undefined) {
        throw new Error(`event '${context.event.kind}' does not expose a Buff target`);
      }
      return resolve(eventTargetId);
    }
    if (target === 'currentTarget') {
      return this.#resolveContextTarget(context?.currentTarget);
    }
    if (target === 'controlledOperator') {
      const targets = this.dependencies.resolveApplicationTargets?.(target) ?? [];
      if (targets.length !== 1) {
        throw new Error('controlledOperator Buff query must resolve to exactly one target');
      }
      return targets[0]!;
    }
    if (target !== 'currentAbilityEntity') return this.dependencies.resolveTarget(target);
    if (context?.currentTarget?.kind !== 'abilityEntity') {
      throw new Error(
        'currentAbilityEntity Buff operation requires a current AbilityEntity target',
      );
    }
    const resolve = this.dependencies.resolveCurrentAbilityEntityTarget;
    if (resolve === undefined) {
      throw new Error('currentAbilityEntity Buff operation runtime is not configured');
    }
    return resolve(context.currentTarget);
  }

  #requireEventSourceId(context: CombatOperationContext | undefined): string {
    const event = context?.event;
    if (event === undefined) {
      if (context?.actionSourceId !== undefined) return context.actionSourceId;
      if (context?.buffSourceId !== undefined) return context.buffSourceId;
      throw new Error('eventSource Buff operation requires an event or Buff source context');
    }
    return abilityEventSourceId(event);
  }

  #requireSkillCastId(context: CombatOperationContext | undefined, operation: string): number {
    const skillCastId = context?.skillCastInfo?.skillCastId;
    if (skillCastId === undefined) {
      throw new Error(`${operation} same-source query requires skill cast info`);
    }
    return skillCastId;
  }
}
