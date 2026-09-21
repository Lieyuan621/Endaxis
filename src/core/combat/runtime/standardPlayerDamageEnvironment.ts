import { ABILITY_EVENTS } from '../../../../packages/game-data-contract/src/abilityEvents';
import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import { evaluateDamageModifierEnvironmentCondition } from '../damage/damageModifierExecution';
import type { AbilityEventPayloadMap, CombatAbilityEvent } from '../events/combatAbilityEvent';
import { submitSimulationCastSeed } from '../random/simulationRandom';
import {
  registerPostSkillRequestListener,
  requirePostSkillRequestListener,
  unregisterPostSkillRequestListener,
} from '../skills/postSkillRequestListenerExecution';
import type { CombatStateGraph } from '../state/combatState';
import {
  createPostSkillRequestListenerState,
  type StandardCombatEnvironmentState,
} from '../state/environmentState';
import type { AbilityResponseEventName } from '../state/foundationState';
/**
 * 标准战斗环境：一场模拟里敌人的元素附着、反应和 Buff 都由它管；
 * 敌人生命与失衡账本由场景装配层创建并以明确依赖注入，本环境只持有同一实例。
 *
 * 能做的就做，做不了的（Buff、瞬时属性、没确认的随机等）直接报错，
 * 绝不用假数据糊弄。调用方必须把命中时需要的数值显式传进来。
 */
import type { ResolvedSkillBuffDefinition } from '../../compiler/combatProgram';
import type { ResolvedOperatorPanel } from '../../compiler/resolveOperatorPanel';
import {
  MAIN_ATTRIBUTE_ATTACK_FACTOR,
  SECONDARY_ATTRIBUTE_ATTACK_FACTOR,
} from '../../game-data/battleConstants';
import { runtimeTargetFromEntityId } from '../../game-data/logicalAbilityEntity';
import type { HealCalculationAttribute, HealTarget } from '../../game-data/operatorDefinition';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { ATTRIBUTE_MODIFIER_SOURCES } from '../state/foundationState';
import { CombatAttributeSet, createCombatAttributeModifier } from '../attributes/combatAttributes';
import {
  ATTACK_FACTOR_ATTRIBUTE_BY_OPERATOR_ATTRIBUTE,
  createOperatorAttackAttributes,
} from '../attributes/operatorAttackAttributes';
import { BuffDefinitionOperationTarget } from '../buffs/buffDefinitionOperationTarget';
import type { RegisterBuffAbilityEventAction } from '../buffs/buffLifecycleSequenceRuntime';
import { BuffProgressRecorder, type BuffProgressCurve } from '../buffs/buffProgressRecorder';
import {
  compileCombatBuffDefinitions,
  CompiledCombatBuffDefinitions,
  type CombatBuffDefinitionsDocument,
} from '../buffs/combatBuffDefinitions';
import { CombatBuffContainer, type CombatBuff } from '../buffs/combatBuffs';
import { POISE_BREAK_BUFF_ID, PoiseBreakBuffRuntime } from '../buffs/poiseBreakBuffRuntime';
import type { DamageModifierExternalCondition } from '../damage/damageModifiers';
import type { HealthDamageEventPayload } from '../damage/healthDamage';
import type { PlayerDamageNonRandomRuntimeSnapshot } from '../damage/playerActiveDamageInput';
import type { DamageModifierSide } from '../damage/playerDamageContext';
import {
  PlayerDamageOperationExecutor,
  type PlayerDamageOperationDependencies,
} from '../damage/playerDamageOperationExecutor';
import type { PoiseDamageModifier } from '../damage/poiseDamage';
import {
  initializeEnemyCombatAttributes,
  resolveStaticPlayerDamageSnapshots,
} from '../damage/staticPlayerDamageSnapshots';
import { resolveAbilityEventActionContextBinding } from '../events/abilityEventActionContext';
import { AbilityEventDispatcher, type AbilityEventFromMap } from '../events/abilityEventDispatcher';
import type { HealModifierSide } from '../heal/healModifiers';
import { HealOperationExecutor, type ResolvedHealTarget } from '../heal/healOperationExecutor';
import type { CompoundStatusFactoriesDocument } from '../infliction/compoundStatusFactories';
import { executeCompoundStatusFactory } from '../infliction/compoundStatusFactory';
import type { ElementalInflictionOperation } from '../infliction/elementalInfliction';
import type { ElementalInflictionStartedPayload } from '../infliction/elementalInflictionBuffAdapter';
import { ElementalInflictionBuffAdapter } from '../infliction/elementalInflictionBuffAdapter';
import {
  ElementalInflictionOperationExecutor,
  type ElementalInflictionEvent,
  type ElementalInflictionEventPayload,
} from '../infliction/elementalInflictionOperationExecutor';
import { ElementalReactionOperationExecutor } from '../infliction/elementalReactionOperationExecutor';
import { ElementalReactionContainer } from '../infliction/elementalReactionState';
import type {
  CompoundStatusSkillSettingSource,
  SkillSettingsDocument,
} from '../infliction/skillSettings';
import { createSkillSettingSource } from '../infliction/skillSettings';
import { executeSpellBurst } from '../infliction/spellBurstRuntime';
import type { CriticalSampleSource } from '../random/criticalSampleSource';
import type { ProbabilitySampleSource } from '../random/probabilitySampleSource';
import type { SimulationRandomMode } from '../random/simulationRandom';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import type { CombatResources } from '../resources/combatResources';
import { CombatVitals } from '../resources/combatVitals';
import { CombatVitalsRuntime } from '../resources/combatVitalsRuntime';
import { ComboSkillConditionRuntime } from '../skills/comboSkillConditionRuntime';
import type {
  CombatOperationExecutor,
  ProjectileRuntimeDependencies,
} from '../skills/skillRuntime';
import type { AbilityEventState } from '../state/foundationState';
import { type BuffFinishReason } from '../state/foundationState';
import {
  KnockDownOperationExecutor,
  type KnockDownAbilityEvent,
  type KnockDownEventPayload,
} from '../status/knockDownOperationExecutor';
import { OrdinaryKnockDownRuntime } from '../status/ordinaryKnockDownRuntime';
import type { GameplayTagPredefine } from '../tags/gameplayTagPredefine';
import type { GameplayTagRegistry } from '../tags/gameplayTags';
import type { CombatClock } from '../time/combatClock';
import type {
  CombatBattleRuntimeContext,
  CombatDamageExecutorContext,
  CombatOperationExecutorContext,
  CombatRuntimeAssemblyOptions,
} from './combatRuntimeAssembly';
import type { FrameRuntime } from './combatSimulation';

type DamageStep = ResolvedCombatStepForKind<'dealDamage' | 'dealFixedDamage'>;

const MULTIPLICATIVE_ATTRIBUTE_SLOTS = new Set(['finalMultiplier', 'baseFinalMultiplier']);

/**
 * 只有“一项属性修正、一个非单位槽位”才可自动摘要。
 * 这里记录原始事实，不在战斗回执中写本地化名称或猜测复杂 Buff 的总效果。
 */
function simpleAttributeModifierFact(buff: CombatBuff<string>):
  | {
      readonly simpleModifierAttribute: string;
      readonly simpleModifierSlot: string;
      readonly simpleModifierValue: number;
    }
  | undefined {
  if (buff.attributeModifiers.length !== 1) return undefined;
  const modifier = buff.attributeModifiers[0]!;
  const changed = Object.entries(modifier.values).filter(([slot, value]) => {
    const identity = MULTIPLICATIVE_ATTRIBUTE_SLOTS.has(slot) ? 1 : 0;
    return Math.abs(value - identity) > 0.0000001;
  });
  if (changed.length !== 1) return undefined;
  const [slot, value] = changed[0]!;
  return {
    simpleModifierAttribute: modifier.attribute,
    simpleModifierSlot: slot,
    simpleModifierValue: value,
  };
}

type EnvironmentOptions = Pick<
  CombatRuntimeAssemblyOptions,
  | 'enemyBuffRuntime'
  | 'submitCastRandomSeed'
  | 'bindBattleRuntime'
  | 'registerCombatAbilityEvent'
  | 'enemyVitalsRuntime'
  | 'createOperatorBuffRuntime'
  | 'createAbilityEntityBuffRuntime'
  | 'resolveUltimateEnergyGainMultiplier'
  | 'createOperationExecutor'
  | 'emitAbilityEvent'
  | 'onPostSkillCastRequest'
  | 'createEquipmentEventOperationExecutor'
  | 'registerEquipmentAbilityEventAction'
  | 'registerPassiveAbilityEventAction'
  | 'registerComboSkillCondition'
  | 'comboConditionEligibility'
  | 'resolveVitals'
  | 'resolveOperatorVitals'
  | 'probabilitySamples'
  | 'readSourceAttributeValue'
  | 'emitOperatorEnterFight'
  | 'emitBuffLifecycleAbilityEvent'
>;

type BindableCombatRuntimeContext = Omit<
  CombatBattleRuntimeContext,
  'resolveProjectileRuntimeDependencies'
> &
  Partial<Pick<CombatBattleRuntimeContext, 'resolveProjectileRuntimeDependencies'>>;

/** 名称从载荷表派生，不另维护可能漂移的广播键清单；不等于公共可配置事件集合。 */
export type StandardPlayerDamageEvent = keyof StandardPlayerDamagePayloadMap;

/**
 * 公共键沿用唯一载荷表；组件/流程通知直接复用生产端类型。
 * 这些额外键不是新增的可配置 AbilityEvent，不借内部通知类型化扩大游戏机制范围。
 */
export interface StandardPlayerDamagePayloadMap
  extends
    AbilityEventPayloadMap,
    Record<Exclude<KnockDownAbilityEvent, keyof AbilityEventPayloadMap>, KnockDownEventPayload> {
  beforeKillEntity: HealthDamageEventPayload;
  beforeOutputPoiseDamage: PoiseDamageModifier;
  beforeTakePoiseDamage: PoiseDamageModifier;
  takePoiseDamage: PoiseDamageModifier;
  beforeTakeSpellBurst: AbilityEventPayloadMap['beforeOutputSpellBurst'];
  elementalInflictionStarted: ElementalInflictionStartedPayload;
  poiseRecovered: Readonly<Record<string, never>>;
}

export interface StandardPlayerDamageEnvironmentOptions {
  /** 暴击样本和命中特殊倍率必须由具有证据的上层策略提供。 */
  readonly criticalSamples: CriticalSampleSource;
  /** RandomUtil.Dice 的独立样本源，不与暴击随机流混用。 */
  readonly probabilitySamples?: ProbabilitySampleSource;
  readonly randomMode?: SimulationRandomMode;
  /** 必须与两个样本端口实际消费的状态一致；自定义源不能用空状态冒充。 */
  readonly randomState?: import('../state/environmentState').SimulationRandomState;
  /** 已复制的环境数据；提供时构造过程只绑定数据，不重新初始化其中的账本。 */
  readonly restoredState?: StandardCombatEnvironmentState;
  /** 与 restoredState 同一切面中的原生事件目录；处理函数由各来源宿主随后按编号重绑。 */
  readonly restoredEventStates?: NonNullable<CombatStateGraph['events']['native']>;
  /** 与整场候选图共享的实体 Buff 数据；实例对象和生命周期关系由装配层随后统一绑定。 */
  readonly restoredBuffStates?: {
    readonly enemy: import('../state/instanceState').BuffContainerState<string>;
    readonly operators: ReadonlyMap<
      string,
      import('../state/instanceState').BuffContainerState<string>
    >;
  };
  readonly resolveNonRandomRuntimeSnapshot: (
    context: CombatDamageExecutorContext,
    step: DamageStep,
  ) => PlayerDamageNonRandomRuntimeSnapshot;
  /** 提供后，`applyElementalInfliction` 步骤按定义附着状态机执行。 */
  readonly elementalInflictionDocument?: CombatBuffDefinitionsDocument;
  /** 法术爆发倍率来源；缺失时爆发触发会明确失败。 */
  readonly spellInflictionSettings?: SkillSettingsDocument;
  /** 异类附着按元素方向读取的原生短生命周期工厂。 */
  readonly compoundStatusFactories?: CompoundStatusFactoriesDocument;
  /**
   * 本次模拟唯一的敌人生命账本，由场景装配层创建并注入。
   * 伤害写入、生命条件求值和失衡恢复推进都引用这一实例，环境不再自行构造或回退到静态生命值。
   */
  readonly enemyVitals: CombatVitals;
  /** 当前游戏版本的完整标签层级；缺省时只执行裸 ID 精确匹配。 */
  readonly tagRegistry?: GameplayTagRegistry;
  /** 当前帧主控身份由场景控制时间线提供；仅在伤害修正使用该条件时需要。 */
  readonly isOperatorControlled?: (operatorId: string, frame: number) => boolean;
  /** 原生角色专属 HUD 直接跟踪的 Buff；与通用图标进度标志相互独立。 */
  readonly passiveProgressBuffIdsByOperator?: ReadonlyMap<string, ReadonlySet<string>>;
  /**
   * 普通倒地的显式装配端口。到期策略必须来自当前闭包的消费者审计；
   * 不默认注入零秒起身，也不因存在本端口就放开标准场景预检。
   */
  readonly knockDown?: {
    readonly predefine: GameplayTagPredefine;
    readonly onDurationElapsed: (runtime: OrdinaryKnockDownRuntime) => void;
  };
}

const strictTerminal: CombatOperationExecutor = {
  execute(step): boolean {
    throw new Error(`standard player damage environment does not support '${step.kind}'`);
  },
  evaluate(condition): boolean {
    throw new Error(
      `standard player damage environment cannot evaluate condition '${condition.kind}'`,
    );
  },
};

/** 一场模拟独占的标准生命/失衡伤害环境；敌人生命账本由场景装配层注入并共享。 */
function panelAttackDetail(panel: ResolvedOperatorPanel) {
  if (panel.attackDetail === undefined) return undefined;
  return {
    panelAttack: panel.attack,
    ...panel.attackDetail,
    mainAttribute: panel.mainAttribute,
    secondaryAttribute: panel.secondaryAttribute,
    attributes: panel.attributes,
    coefficients: Object.fromEntries(
      Object.keys(ATTACK_FACTOR_ATTRIBUTE_BY_OPERATOR_ATTRIBUTE).map(attribute => [
        attribute,
        (panel.mainAttribute === attribute ? MAIN_ATTRIBUTE_ATTACK_FACTOR : 0) +
          (panel.secondaryAttribute === attribute ? SECONDARY_ATTRIBUTE_ATTACK_FACTOR : 0),
      ]),
    ) as Record<keyof typeof ATTACK_FACTOR_ATTRIBUTE_BY_OPERATOR_ATTRIBUTE, number>,
  };
}
export class StandardPlayerDamageEnvironment {
  readonly runtimeState: StandardCombatEnvironmentState;
  readonly runtimeOptions: EnvironmentOptions;
  readonly #events = new Map<
    string,
    AbilityEventDispatcher<StandardPlayerDamageEvent, StandardPlayerDamagePayloadMap>
  >();
  readonly #enemyAttributes: CombatAttributeSet<string>;
  readonly #enemyBuffs: CombatBuffContainer<string>;
  readonly #enemyBuffRuntime: BuffDefinitionOperationTarget<string>;
  readonly #enemyKnockDown: OrdinaryKnockDownRuntime | null;
  readonly #operatorBuffRuntimes = new Map<string, BuffDefinitionOperationTarget<string>>();
  readonly #postSkillRequestListeners = new Map<
    string,
    Map<number, (info: import('../state/foundationState').CombatSkillCastInfo | null) => void>
  >();
  readonly #postSkillRequestListenerState: ReturnType<typeof createPostSkillRequestListenerState>;
  readonly #inflictionAdapters = new Map<string, ElementalInflictionBuffAdapter<string>>();
  readonly #reactionModifiers = new Map<
    string,
    NonNullable<import('./combatRuntimeAssembly').CombatOperatorProgram['reactionModifiers']>
  >();
  #resolveAbilitySystemSourceId: (entityId: string) => string = entityId => entityId;
  #resolveProjectileRuntimeDependencies:
    ((definitionOperatorId: string) => ProjectileRuntimeDependencies) | null = null;
  readonly #reactions: ElementalReactionContainer;
  readonly #operatorPanels = new Map<string, ResolvedOperatorPanel>();
  readonly #operatorVitals = new Map<string, CombatVitals>();
  readonly #buffProgress: BuffProgressRecorder;
  #clock: CombatClock | null = null;
  #isOperatorControlled: ((operatorId: string, frame: number) => boolean) | undefined;
  #receipt: CombatReceiptSink | null = null;
  #elementalDefinitions: CompiledCombatBuffDefinitions<string> | null = null;
  #skillSettings: CompoundStatusSkillSettingSource | null = null;
  readonly #enemyVitals: CombatVitals;
  #enemyVitalsRuntime: CombatVitalsRuntime | null = null;
  readonly #poiseBreakBuffs: PoiseBreakBuffRuntime;
  readonly #poiseBreakDefinitions = new Map<string, ResolvedSkillBuffDefinition>();
  #enemyIdentity: CombatOperationExecutorContext['enemy'] | null = null;
  #resources: CombatResources | null = null;
  #boundByAssembly = false;
  readonly #eventStates: NonNullable<CombatStateGraph['events']['native']>;

  constructor(readonly options: StandardPlayerDamageEnvironmentOptions) {
    const restored = options.restoredState;
    if (restored !== undefined && options.enemyVitals.runtimeState !== restored.enemyVitals) {
      throw new Error('restored enemy vitals must use the environment state ledger');
    }
    if (restored?.random != null && restored.random !== options.randomState) {
      throw new Error('restored random source must use the environment state ledger');
    }
    if (
      restored !== undefined &&
      (restored.knockDown === null) !== (options.knockDown === undefined)
    ) {
      throw new Error('restored knock-down state does not match the environment program');
    }
    this.#eventStates = options.restoredEventStates ?? new Map();
    this.#postSkillRequestListenerState =
      restored?.postSkillRequestListeners ?? createPostSkillRequestListenerState();
    this.#reactions = new ElementalReactionContainer(restored?.reactions);
    this.#buffProgress = new BuffProgressRecorder(restored?.buffProgress);
    for (const [operatorId, state] of restored?.operatorVitals ?? []) {
      this.#operatorVitals.set(operatorId, CombatVitals.bindRuntimeState(state));
    }
    const restoredEnemyBuffs = options.restoredBuffStates?.enemy;
    const enemyAttributes = new CombatAttributeSet<string>(restoredEnemyBuffs?.attributes);
    const enemyBlackboard =
      restoredEnemyBuffs === undefined
        ? undefined
        : ActionBlackboard.bindRuntimeState(restoredEnemyBuffs.entityBlackboard);
    this.#enemyAttributes = enemyAttributes;
    this.#enemyBuffs = new CombatBuffContainer(
      'enemy',
      enemyAttributes,
      options.tagRegistry,
      null,
      enemyBlackboard,
      (buff, reason, skillCastInfo) =>
        this.#recordOwnedBuffFinished('enemy', buff, reason, skillCastInfo),
      (buff, layerCount, reason, skillCastInfo) =>
        this.#emitBuffEnhanceChanged('enemy', buff, layerCount, reason, skillCastInfo),
      undefined,
      (gainedValue, currentValue) =>
        this.#emit('enemy', 'afterAddedShield', {
          sourceId: 'enemy',
          targetId: 'enemy',
          gainedValue,
          currentValue,
        }),
      (definition, sourceId, blackboard) => {
        // 原生来源侧收集发生在 Buff.Reset；直接施加与反应创建共用此处。
        const modifier = this.#reactionModifiers
          .get(sourceId)
          ?.find(m => m.reaction === 'corrosion');
        if (
          modifier === undefined ||
          !this.#enemyBuffs.tagRegistry.query(
            definition.applyTags ?? [],
            ['Skill/Character/Common/SpellStatus/Corrupt'],
            'hasAny',
          )
        )
          return;
        const duration = blackboard.getNumber('duration');
        if (duration !== undefined && duration > 0)
          blackboard.assignDynamic('duration', duration + modifier.durationSecondsAddition);
        const maximum = blackboard.getNumber('max_def_decrease');
        if (maximum !== undefined)
          blackboard.assignDynamic(
            'max_def_decrease',
            maximum * (1 + modifier.effectivenessAddition),
          );
      },
      undefined,
      restoredEnemyBuffs,
      (buff, producedBy) => this.#recordBuffCreated(buff, producedBy),
      (buff, previousLayers, sourceId, skillCastInfo, producedBy) =>
        this.#recordBuffStackChanged(buff, previousLayers, sourceId, skillCastInfo, producedBy),
    );
    this.#enemyBuffRuntime = new BuffDefinitionOperationTarget(
      this.#enemyBuffs,
      {
        get: id => this.#resolveEnvironmentBuffDefinition(id),
        compile: entry => this.#compileInlineBuffDefinition(entry),
      },
      undefined,
      this.#buffAbilityEventRegistrar('enemy'),
      (event, buff) => {
        this.#recordOwnedBuffApplied('enemy', event, buff);
        this.#emit('enemy', 'addedBuff', event);
      },
      event => this.#emit(event.sourceId, 'beforeOutputBuff', event),
      event => this.#emit(event.sourceId, 'outputBuff', event),
      event => this.#emit('enemy', 'beforeAddedBuff', event),
      (event, handle, subscriptions) =>
        subscriptions === undefined
          ? this.eventsFor('enemy').registerCallback(event, handle)
          : this.#bindSingleBuffSubscription('enemy', event, subscriptions, handle),
      (handle, restoredRegistrationId) =>
        this.#registerPostSkillRequest('enemy', handle, restoredRegistrationId),
      definitionOperatorId => this.#requireProjectileRuntimeDependencies(definitionOperatorId),
    );
    // 敌人生命账本由场景装配层创建并注入，环境只持有引用，不在首次绑定时另行构造。
    this.#enemyVitals = options.enemyVitals;
    this.#enemyKnockDown =
      options.knockDown === undefined
        ? null
        : new OrdinaryKnockDownRuntime(
            this.#enemyBuffs,
            options.knockDown.predefine,
            options.knockDown.onDurationElapsed,
            restored?.knockDown ?? undefined,
          );
    this.#poiseBreakBuffs = new PoiseBreakBuffRuntime(
      this.#enemyBuffRuntime,
      restored?.poiseBreakBuffs,
    );
    this.runtimeState = restored ?? {
      random: options.randomState ?? null,
      enemyVitals: this.#enemyVitals.runtimeState,
      operatorVitals: new Map(),
      reactions: this.#reactions.runtimeState,
      knockDown: this.#enemyKnockDown?.runtimeState ?? null,
      buffProgress: this.#buffProgress.runtimeState,
      poiseBreakBuffs: this.#poiseBreakBuffs.runtimeState,
      postSkillRequestListeners: this.#postSkillRequestListenerState,
    };
    // 对象字面量中的 getter 会把自己的 this 绑定为字面量本身，因此用箭头闭包引用环境实例。
    const vitalsRuntimeOf = (): FrameRuntime | null => this.#enemyVitalsRuntime;
    this.runtimeOptions = {
      ...(options.probabilitySamples === undefined
        ? {}
        : { probabilitySamples: options.probabilitySamples }),
      enemyBuffRuntime: this.#enemyBuffRuntime,
      submitCastRandomSeed: (castId, seed) => {
        const state = this.runtimeState.random;
        if (state !== null) submitSimulationCastSeed(state, castId, seed);
        else if (seed !== undefined)
          throw new Error('cast seed requires stateful simulation random');
      },
      registerCombatAbilityEvent: (ownerId, scope, name, phase, priority, handle) => {
        const owners = scope === 'team' ? [...this.#operatorBuffRuntimes.keys()] : [ownerId];
        const registrations = owners.map(id => {
          const dispatcher = this.eventsFor(id);
          const receive = (event: CombatAbilityEvent<typeof name>) =>
            handle(event, this.#resolveAbilityEventRuntimeActionContext(event));
          if (phase === 'callback') return dispatcher.registerCallback(name, receive);
          if (phase === 'dataAction') return dispatcher.registerAction(name, priority, receive);
          return dispatcher.registerListener(name, phase, receive);
        });
        return {
          subscriptions: registrations.flatMap(registration => registration.subscriptions),
          dispose: () => registrations.forEach(registration => registration.dispose()),
        };
      },
      bindBattleRuntime: context => {
        this.#bindBattleRuntime(context, true);
        return {
          eventStates: this.#eventStates,
          environmentState: this.runtimeState,
          bindNativeEventSubscription: (reference, receive) => {
            const owner = [...this.#eventStates].find(([, state]) => state === reference.state);
            if (owner === undefined) {
              throw new Error('native event subscription belongs to another battle state');
            }
            const eventName = ABILITY_EVENTS.filter(name => name !== 'outputKnockDown').find(
              name => name === reference.event,
            );
            if (eventName === undefined) {
              throw new Error(`unsupported restored ability event '${String(reference.event)}'`);
            }
            return this.eventsFor(owner[0]).bindSubscriptionFor(eventName, reference, event =>
              receive({
                event,
                actionContext: this.#resolveAbilityEventRuntimeActionContext(event),
              }),
            );
          },
          enemyVitalsRuntime: this.#enemyVitalsRuntime,
          enemyControlRuntime: this.#enemyKnockDown,
        };
      },
      get enemyVitalsRuntime() {
        return vitalsRuntimeOf();
      },
      createOperatorBuffRuntime: (operatorId, panel, reactionModifiers, restoredState) => {
        if (reactionModifiers !== undefined)
          this.#reactionModifiers.set(operatorId, reactionModifiers);
        if (panel !== undefined) {
          this.#operatorPanels.set(operatorId, panel);
          this.#ensureOperatorVitals(operatorId, panel);
        }
        return this.#operatorBuffRuntime(operatorId, panel, restoredState);
      },
      resolveUltimateEnergyGainMultiplier: operatorId =>
        this.#operatorBuffRuntime(operatorId).container.attributes.get('UltimateSpGainScalar'),
      createAbilityEntityBuffRuntime: (
        entityId,
        entityBlackboard,
        target,
        bornTags,
        restoredState,
      ) => {
        const container = new CombatBuffContainer(
          entityId,
          new CombatAttributeSet<string>(restoredState?.attributes),
          options.tagRegistry,
          null,
          entityBlackboard,
          (buff, reason, skillCastInfo) =>
            this.#recordOwnedBuffFinished(entityId, buff, reason, skillCastInfo),
          (buff, layerCount, reason, skillCastInfo) =>
            this.#emitBuffEnhanceChanged(entityId, buff, layerCount, reason, skillCastInfo),
          undefined,
          (gainedValue, currentValue) =>
            this.#emit(entityId, 'afterAddedShield', {
              sourceId: entityId,
              targetId: entityId,
              gainedValue,
              currentValue,
            }),
          undefined,
          buff => this.#recordBuffRemoval(entityId, buff, 'other', 'BuffReleased'),
          restoredState,
          (buff, producedBy) => this.#recordBuffCreated(buff, producedBy),
          (buff, previousLayers, sourceId, skillCastInfo, producedBy) =>
            this.#recordBuffStackChanged(buff, previousLayers, sourceId, skillCastInfo, producedBy),
        );
        if (restoredState === undefined) container.addEntityTags(bornTags);
        return new BuffDefinitionOperationTarget(
          container,
          {
            get: id => this.#resolveEnvironmentBuffDefinition(id),
            compile: entry => this.#compileInlineBuffDefinition(entry),
          },
          target,
          this.#buffAbilityEventRegistrar(entityId),
          event => this.#emit(entityId, 'addedBuff', event),
          event => this.#emit(event.sourceId, 'beforeOutputBuff', event),
          event => this.#emit(event.sourceId, 'outputBuff', event),
          event => this.#emit(entityId, 'beforeAddedBuff', event),
          (event, handle, subscriptions) =>
            subscriptions === undefined
              ? this.eventsFor(entityId).registerCallback(event, handle)
              : this.#bindSingleBuffSubscription(entityId, event, subscriptions, handle),
          (handle, restoredRegistrationId) =>
            this.#registerPostSkillRequest(entityId, handle, restoredRegistrationId),
          definitionOperatorId => this.#requireProjectileRuntimeDependencies(definitionOperatorId),
        );
      },
      createOperationExecutor: context => this.#createOperationExecutor(context),
      readSourceAttributeValue: (sourceId, request) =>
        this.#readSourceAttributeValue(sourceId, request),
      emitAbilityEvent: (entityId, event, payload) => this.#emit(entityId, event, payload),
      onPostSkillCastRequest: (ownerId, info) => {
        const handlers = (
          this.#postSkillRequestListenerState.registrationsByOwner.get(ownerId) ?? []
        ).map(id => {
          const handle = this.#postSkillRequestListeners.get(ownerId)?.get(id);
          if (handle === undefined) {
            throw new Error(`post-skill request listener '${ownerId}:${id}' is not bound`);
          }
          return handle;
        });
        for (const handle of handlers) handle(info);
      },
      emitOperatorEnterFight: operatorId =>
        this.#emit(operatorId, 'enterFight', {
          sourceId: operatorId,
          targetId: operatorId,
        }),
      emitBuffLifecycleAbilityEvent: (event, payload) =>
        this.#emit(payload.sourceId, event, payload),
      createEquipmentEventOperationExecutor: context => this.#createOperationExecutor(context),
      registerEquipmentAbilityEventAction: (operatorId, event, priority, handle, subscriptions) => {
        const receive = (context: CombatAbilityEvent<typeof event>) =>
          handle(context, this.#resolveAbilityEventRuntimeActionContext(context));
        return subscriptions === undefined
          ? this.eventsFor(operatorId).registerAction(event, priority, receive)
          : this.#bindSingleBuffSubscription(operatorId, event, subscriptions, receive);
      },
      registerPassiveAbilityEventAction: (operatorId, event, priority, handle, subscriptions) => {
        const receive = (context: CombatAbilityEvent<typeof event>) =>
          handle(context, this.#resolveAbilityEventRuntimeActionContext(context));
        return subscriptions === undefined
          ? this.eventsFor(operatorId).registerAction(event, priority, receive)
          : this.#bindSingleBuffSubscription(operatorId, event, subscriptions, receive);
      },
      registerComboSkillCondition: registration =>
        this.comboConditions.registerPendingCondition(registration),
      // 固定木桩投影：没有干员死亡或敌方沉默状态；不把 HP=0 当 markDie，也不猜查询 Tag。
      // 未来若引入这两类外部事实，调用方必须覆盖该资格端口。
      comboConditionEligibility: { isAlive: () => true, isSilenced: () => false },
      resolveVitals: (target, operatorId, buffSourceId) => {
        if (target === 'enemy') return this.enemyVitals;
        if (target === 'caster') return this.#requireOperatorVitals(operatorId);
        return this.#resolveHealTarget(target, operatorId, this.#requireClock().frame, buffSourceId)
          .vitals;
      },
      resolveOperatorVitals: operatorId => this.#requireOperatorVitals(operatorId),
    };
  }

  get buffProgressCurves(): readonly BuffProgressCurve[] {
    return this.#buffProgress.snapshot();
  }

  get enemyVitals(): CombatVitals {
    return this.#enemyVitals;
  }

  /** 已绑定敌人时返回账本推进器；空场景（从未绑定敌人）返回 null。 */
  get enemyVitalsRuntime(): FrameRuntime | null {
    return this.#enemyVitalsRuntime;
  }

  /** 返回本场战斗内指定实体独占的事件中心，供后续 Buff、天赋和活动机制注册监听。 */
  #registerPostSkillRequest(
    ownerId: string,
    handle: (info: import('../state/foundationState').CombatSkillCastInfo | null) => void,
    restoredRegistrationId?: number,
  ): { readonly registrationId: number; dispose(): void } {
    const registrationId =
      restoredRegistrationId ??
      registerPostSkillRequestListener(this.#postSkillRequestListenerState, ownerId);
    if (restoredRegistrationId !== undefined) {
      requirePostSkillRequestListener(
        this.#postSkillRequestListenerState,
        ownerId,
        restoredRegistrationId,
      );
    }
    let listeners = this.#postSkillRequestListeners.get(ownerId);
    if (listeners === undefined) {
      listeners = new Map();
      this.#postSkillRequestListeners.set(ownerId, listeners);
    }
    if (listeners.has(registrationId)) {
      throw new Error(
        `post-skill request listener '${ownerId}:${registrationId}' is already bound`,
      );
    }
    listeners.set(registrationId, info => handle(info));
    return {
      registrationId,
      dispose: () => {
        if (!listeners.delete(registrationId)) return;
        unregisterPostSkillRequestListener(
          this.#postSkillRequestListenerState,
          ownerId,
          registrationId,
        );
        if (listeners.size === 0 && this.#postSkillRequestListeners.get(ownerId) === listeners)
          this.#postSkillRequestListeners.delete(ownerId);
      },
    };
  }

  eventsFor(
    entityId: string,
  ): AbilityEventDispatcher<StandardPlayerDamageEvent, StandardPlayerDamagePayloadMap> {
    let dispatcher = this.#events.get(entityId);
    if (dispatcher === undefined) {
      dispatcher = new AbilityEventDispatcher<
        StandardPlayerDamageEvent,
        StandardPlayerDamagePayloadMap
      >(
        this.#eventStates.get(entityId) as AbilityEventState<StandardPlayerDamageEvent> | undefined,
      );
      this.#events.set(entityId, dispatcher);
      this.#eventStates.set(entityId, dispatcher.runtimeState);
    }
    return dispatcher;
  }

  /** 主动技能与 Buff 伤害共用双方修正器、即时属性和准备事件接线。 */
  #withAttributeModifierDetails(
    snapshots: import('../damage/playerDamageContext').PlayerDamageAttributeSnapshots,
    operatorBuffs: CombatBuffContainer<string>,
  ): import('../damage/playerDamageContext').PlayerDamageAttributeSnapshots {
    return {
      attacker: {
        ...snapshots.attacker,
        modifierDetails: [
          ...(snapshots.attacker.modifierDetails ?? []),
          ...operatorBuffs.captureAttributeModifierDetails('attacker'),
        ],
      },
      defender: {
        ...snapshots.defender,
        modifierDetails: [
          ...(snapshots.defender.modifierDetails ?? []),
          ...this.#enemyBuffs.captureAttributeModifierDetails('defender'),
        ],
      },
    };
  }

  #damagePreparationPorts(
    operatorId: string,
    operatorBuffs: CombatBuffContainer<string>,
  ): Pick<
    import('../damage/playerDamageOperationExecutor').PlayerDamageOperationDependencies,
    | 'applyDamageModifiers'
    | 'addInstantAttributeModifier'
    | 'clearInstantAttributeModifiers'
    | 'emitPreparationEvent'
  > {
    return {
      applyDamageModifiers: (timing, side, damageContext) =>
        this.#buffContainer(side, operatorBuffs).applyDamageModifiers(
          timing,
          side,
          damageContext,
          (condition, resolveNumber) =>
            this.#evaluateDamageModifierCondition(
              condition,
              operatorBuffs,
              damageContext,
              resolveNumber,
            ),
        ),
      addInstantAttributeModifier: (side, request) => {
        const attributes = this.#buffContainer(side, operatorBuffs).attributes;
        if (!attributes.has(request.attribute)) {
          throw new Error(
            `instant attribute '${request.attribute}' is not available on the ${side} side`,
          );
        }
        attributes.addModifier(
          createCombatAttributeModifier(
            request.attribute,
            request.values,
            ATTRIBUTE_MODIFIER_SOURCES.instant,
            request.timing,
          ),
        );
      },
      clearInstantAttributeModifiers: side =>
        this.#buffContainer(side, operatorBuffs).attributes.clearInstantModifiers(),
      emitPreparationEvent: (event, payload) => this.#emit(operatorId, event, payload),
    };
  }

  #createOperationExecutor(context: CombatDamageExecutorContext): CombatOperationExecutor {
    const program = 'program' in context ? context.program : undefined;
    const operatorId =
      'program' in context
        ? (context.sourceOperatorId ?? context.program.operatorId)
        : context.operatorId;
    if ('program' in context && context.resolveAbilitySystemSourceId !== undefined) {
      this.#resolveAbilitySystemSourceId = context.resolveAbilitySystemSourceId;
    }
    this.#bindBattleRuntime(context);
    const poiseBreakDefinition = context.buffDefinitions?.[POISE_BREAK_BUFF_ID];
    if (poiseBreakDefinition !== undefined)
      this.#poiseBreakDefinitions.set(operatorId, poiseBreakDefinition);
    if (context.panel !== undefined) {
      this.#operatorPanels.set(operatorId, context.panel);
      this.#ensureOperatorVitals(operatorId, context.panel);
    }
    const operatorBuffs = this.#operatorBuffRuntime(operatorId, context.panel).container;
    const damage = new PlayerDamageOperationExecutor({
      sourceOperatorId: operatorId,
      castId: 'program' in context ? context.castId : undefined,
      skillId: program?.skillId,
      executingSkillGroupKey: program?.skillGroupKey || undefined,
      skillType: program?.skillType,
      ...('program' in context
        ? {}
        : {
            sourceActionId: `equipment:${context.source.kind}:${context.source.slug}:${context.handlerKey}`,
          }),
      targetId: 'enemy',
      targetVitals: this.enemyVitals,
      clock: context.clock,
      receipt: context.receipt,
      ...(context.panel?.attackDetail === undefined
        ? {}
        : {
            attackDetail: panelAttackDetail(context.panel)!,
          }),
      captureAttributeSnapshots: step =>
        this.#withAttributeModifierDetails(
          resolveStaticPlayerDamageSnapshots(
            context,
            step,
            operatorBuffs.attributes,
            this.#enemyAttributes,
          ),
          operatorBuffs,
        ),
      criticalSamples: this.options.criticalSamples,
      randomMode: this.options.randomMode,
      resolveCriticalOverride: step =>
        step.key === undefined
          ? undefined
          : 'program' in context
            ? context.readSimulationInputs?.()?.criticalOverrides?.[step.key]
            : undefined,
      resolveNonRandomRuntimeSnapshot: step =>
        this.options.resolveNonRandomRuntimeSnapshot(context, step),
      ...this.#damagePreparationPorts(operatorId, operatorBuffs),
      // PoiseDamageOutputScalar 的基础值为 1；构筑面板保存 BaseAddition 的增量。
      resolvePoiseMultipliers: () => ({
        output: 1 + (context.panel?.staggerDamagePercent ?? 0),
        taken: 1,
      }),
      applyPoiseModifiers: (timing, side, poiseContext) =>
        this.#buffContainer(side, operatorBuffs).applyPoiseModifiers(timing, side, poiseContext),
      isSourceControlled: () => {
        if (this.#isOperatorControlled === undefined || this.#clock === null) return false;
        return this.#isOperatorControlled(operatorBuffs.ownerId, this.#clock.frame);
      },
      emitHealthSourceEvent: (event, payload) => {
        this.#emit(operatorId, event, payload);
      },
      emitHealthTargetEvent: (event, payload) => this.#emit('enemy', event, payload),
      absorbHealthDamage: (damageType, value) => this.#enemyBuffs.absorbDamage(damageType, value),
      emitPoiseSourceEvent: (event, modifier) => this.#emit(operatorId, event, modifier),
      emitPoiseTargetEvent: (event, modifier) => this.#emit('enemy', event, modifier),
      beforePoiseZero: modifier =>
        this.#poiseBreakBuffs.begin(modifier.sourceId, poiseBreakDefinition),
      // 配装元素链仍需独立闭环，不能因 HP 伤害可用而自动开放。
      delegate: 'program' in context ? this.#createReactionExecutor(context) : strictTerminal,
    });
    const delegate = 'program' in context ? this.#createKnockDownExecutor(context, damage) : damage;
    return this.#createHealExecutor(context, operatorId, delegate);
  }

  #createKnockDownExecutor(
    context: CombatOperationExecutorContext,
    delegate: CombatOperationExecutor,
  ): CombatOperationExecutor {
    const control = this.#enemyKnockDown;
    if (control === null) return delegate;
    const sourceId = context.program.operatorId;
    const record = (event: string) =>
      context.receipt.record({
        frame: context.clock.frame,
        time: context.clock.time,
        event,
        sourceId,
        targetId: 'enemy',
        data: { type: 'knockDown' },
      });
    return new KnockDownOperationExecutor({
      sourceId,
      target: this.#enemyBuffRuntime,
      // 固定木桩不安装 markDie；HP 账本归零不等于原生死亡标记。
      isTargetAlive: () => true,
      predefine: control.predefine,
      getControl: () => control,
      readSourceDurationAddition: () =>
        this.#operatorBuffRuntime(sourceId).container.attributes.get('KnockDownTimeAddition'),
      resolveBuffDefinition: id => context.buffDefinitions?.[id],
      emit: (event, payload) => {
        const output =
          event === 'beforeOutputKnockDown' ||
          event === 'afterOutputKnockDown' ||
          event === 'beforeOutputPhysicalInfliction' ||
          event === 'afterOutputPhysicalInfliction';
        this.#emit(output ? sourceId : 'enemy', event, payload);
      },
      onNoGuard: () => record('PhysicalNoGuardApplied'),
      // 木桩不安装敌人动作/动画控制回调，组件的 Buff、标签、计时和事件已经保留。
      onControlApplied: () => {},
      onPhysicalInflictionApplied: () => record('PhysicalInflictionApplied'),
      delegate,
    });
  }

  #createHealExecutor(
    context: Pick<CombatOperationExecutorContext, 'clock' | 'receipt' | 'semanticEvents'>,
    sourceOperatorId: string,
    delegate: CombatOperationExecutor,
  ): CombatOperationExecutor {
    return new HealOperationExecutor({
      sourceOperatorId,
      clock: context.clock,
      receipt: context.receipt,
      resolveSourceAttribute: (sourceOperatorId, attribute) =>
        this.#readHealAttributeValue(sourceOperatorId, attribute),
      resolveTargetAttribute: (targetId, attribute) =>
        this.#readHealAttributeValue(targetId, attribute),
      resolveTarget: (target, buffSourceId, buffOwnerId) =>
        this.#resolveHealTarget(
          target,
          sourceOperatorId,
          context.clock.frame,
          buffSourceId,
          buffOwnerId,
        ),
      resolveContextTarget: operatorId => ({
        operatorId,
        vitals: this.#requireOperatorVitals(operatorId),
      }),
      applyHealModifiers: (timing, side, healContext) =>
        this.#healBuffContainer(
          side,
          healContext.healerId,
          healContext.receiverId,
        ).applyHealModifiers(timing, side, healContext),
      resolveHealingIncrease: (side, operatorId) =>
        this.#readSourceAttributeValue(operatorId, {
          attribute: {
            kind: 'specific',
            key: side === 'healer' ? 'healOutputIncrease' : 'healTakenIncrease',
          },
          stage: 'finalNonConverted',
        }),
      emitSuccessfulHeal: event => {
        this.#publish(
          event.event === 'outputHeal' ? event.payload.sourceId : event.payload.targetId,
          event,
        );
      },
      delegate,
    });
  }

  #createReactionExecutor(context: CombatOperationExecutorContext): CombatOperationExecutor {
    return new ElementalReactionOperationExecutor({
      sourceOperatorId: context.program.operatorId,
      castId: context.castId,
      targetId: 'enemy',
      clock: context.clock,
      receipt: context.receipt,
      container: this.#reactions,
      delegate: this.#createInflictionExecutor(context),
    });
  }

  #evaluateDamageModifierCondition(
    condition: DamageModifierExternalCondition,
    operatorBuffs: CombatBuffContainer<string>,
    damageContext: import('../damage/playerDamageContext').PlayerDamageContext,
    resolveNumber: (value: import('../damage/damageModifiers').DamageModifierNumber) => number,
  ): boolean {
    return evaluateDamageModifierEnvironmentCondition(
      condition,
      operatorBuffs,
      this.#enemyBuffs,
      this.#enemyVitals,
      damageContext,
      resolveNumber,
      () => {
        if (this.#isOperatorControlled === undefined || this.#clock === null) {
          throw new Error(
            'caster-controlled damage modifier requires the scenario control timeline',
          );
        }
        return this.#isOperatorControlled(operatorBuffs.ownerId, this.#clock.frame);
      },
    );
  }

  #createInflictionExecutor(context: CombatOperationExecutorContext): CombatOperationExecutor {
    if (this.options.elementalInflictionDocument === undefined) return strictTerminal;
    const adapter = this.#inflictionAdapter(context.program.operatorId);
    return new ElementalInflictionOperationExecutor({
      sourceOperatorId: context.program.operatorId,
      castId: context.castId,
      targetId: 'enemy',
      skillId: context.program.skillId,
      clock: context.clock,
      receipt: context.receipt,
      getExistingAttachment: () => adapter.getExistingAttachment(),
      applyOperation: (operation: ElementalInflictionOperation, skillCastInfo, producedBy) => {
        if (operation.kind === 'triggerBurst') {
          // 元素目录只提供系统身份；已生成的完整定义必须独占执行，不能再叠加旧聚合回调。
          const buffId = this.#ensureElementalDefinitions().getBurst(operation.element).id;
          const definition = context.buffDefinitions?.[buffId];
          if (definition !== undefined) {
            const buff = this.#enemyBuffRuntime.applyScoped({
              buffId,
              definition,
              sourceId: context.program.operatorId,
              definitionOwnerId: context.program.operatorId,
              sourceActionId: context.program.skillId,
              blackboardValues: {},
              skillCastInfo,
              producedBy,
            });
            return buff === null ? undefined : { buffId, instanceId: buff.instanceId };
          }
        }
        // 未迁移的定义继续走兼容目录；定义存在但无效时直接失败，不回退掩盖错误。
        return adapter.apply(operation, { skillCastInfo, producedBy });
      },
      // 原生 TriggerSpellBurstEventAction 只发布事件；后续 DamageAction 自己结算伤害。
      triggerSpellBurst: payload => this.#emitSpellBurstEvents(payload),
      emitSourceEvent: (event, payload) =>
        this.#emitInfliction(context.program.operatorId, event, payload),
      emitTargetEvent: (event, payload) => this.#emitInfliction('enemy', event, payload),
      delegate: strictTerminal,
    });
  }

  #bindBattleRuntime(context: BindableCombatRuntimeContext, byAssembly = false): void {
    if (this.#boundByAssembly && this.#clock !== context.clock) {
      throw new Error('standard player damage environment cannot be shared across battle clocks');
    }
    if (this.#boundByAssembly && this.#receipt !== context.receipt) {
      throw new Error('standard player damage environment cannot be shared across battle receipts');
    }
    if (this.#boundByAssembly && this.#resources !== context.resources) {
      throw new Error(
        'standard player damage environment cannot be shared across battle resources',
      );
    }
    if (this.#enemyIdentity !== null && this.#enemyIdentity !== context.enemy) {
      throw new Error('standard player damage environment cannot be shared across enemies');
    }
    this.#clock = context.clock;
    this.#isOperatorControlled =
      context.isOperatorControlled ??
      this.#isOperatorControlled ??
      this.options.isOperatorControlled;
    this.#receipt = context.receipt;
    this.#resources = context.resources;
    this.#enemyIdentity = context.enemy;
    if (context.resolveProjectileRuntimeDependencies !== undefined) {
      this.#resolveProjectileRuntimeDependencies = context.resolveProjectileRuntimeDependencies;
    }
    if (byAssembly) this.#boundByAssembly = true;
    if (!this.#enemyAttributes.has('FireResistance')) {
      initializeEnemyCombatAttributes(this.#enemyAttributes, context.enemy.defenderAttributes);
    }
    if (this.#enemyVitalsRuntime !== null) return;
    // 生命账本在场景装配层创建；这里只按本场时钟与回执把它的逐帧推进器接入运行时。
    this.#enemyVitalsRuntime = new CombatVitalsRuntime({
      ownerId: 'enemy',
      clock: context.clock,
      vitals: this.#enemyVitals,
      receipt: context.receipt,
      emitOwnerEvent: event => this.#emit('enemy', event, {}),
      beforePoiseRecovered: () => this.#poiseBreakBuffs.recover(),
    });
  }

  #ensureOperatorVitals(operatorId: string, panel: ResolvedOperatorPanel): CombatVitals {
    const existing = this.#operatorVitals.get(operatorId);
    if (existing !== undefined) return existing;
    const vitals = new CombatVitals({
      health: panel.health,
      maxHealth: panel.health,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 0,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    this.#operatorVitals.set(operatorId, vitals);
    this.runtimeState.operatorVitals.set(operatorId, vitals.runtimeState);
    return vitals;
  }

  #requireOperatorVitals(operatorId: string): CombatVitals {
    const vitals = this.#operatorVitals.get(operatorId);
    if (vitals === undefined) {
      throw new Error(`operator '${operatorId}' has no resolved health ledger`);
    }
    return vitals;
  }

  #resolveHealTarget(
    target: HealTarget,
    sourceOperatorId: string,
    frame: number,
    buffSourceId?: string,
    buffOwnerId?: string,
  ): ResolvedHealTarget {
    if (target === 'enemy') return { operatorId: 'enemy', vitals: this.#enemyVitals };
    if (target === 'buffSource') {
      if (buffSourceId === undefined) {
        throw new Error("heal target 'buffSource' requires a Buff lifecycle source");
      }
      return {
        operatorId: buffSourceId,
        vitals: this.#requireOperatorVitals(buffSourceId),
      };
    }
    if (target === 'buffOwner') {
      if (buffOwnerId === undefined) {
        throw new Error("heal target 'buffOwner' requires a Buff lifecycle owner");
      }
      return {
        operatorId: buffOwnerId,
        vitals: this.#requireOperatorVitals(buffOwnerId),
      };
    }
    if (target === 'caster') {
      return {
        operatorId: sourceOperatorId,
        vitals: this.#requireOperatorVitals(sourceOperatorId),
      };
    }
    const isControlled = this.#isOperatorControlled;
    if (isControlled === undefined) {
      throw new Error(`heal target '${target}' requires the scenario control timeline`);
    }
    const controlled = [...this.#operatorVitals.keys()].filter(operatorId =>
      isControlled(operatorId, frame),
    );
    if (controlled.length !== 1) {
      throw new Error(`heal target '${target}' requires exactly one controlled operator`);
    }
    if (target === 'controlledOperator') {
      const operatorId = controlled[0]!;
      return { operatorId, vitals: this.#requireOperatorVitals(operatorId) };
    }
    const candidates = [...this.#operatorVitals.entries()].filter(
      ([operatorId]) => target === 'lowestHealthRatioOperator' || operatorId !== controlled[0],
    );
    if (candidates.length === 0) {
      throw new Error(`heal target '${target}' has no non-controlled operator`);
    }
    let selected = candidates[0]!;
    for (const candidate of candidates.slice(1)) {
      if (
        candidate[1].health / candidate[1].maxHealth <
        selected[1].health / selected[1].maxHealth
      ) {
        selected = candidate;
      }
    }
    return { operatorId: selected[0], vitals: selected[1] };
  }

  #operatorBuffRuntime(
    operatorId: string,
    panel?: ResolvedOperatorPanel,
    restoredState?: import('../state/instanceState').BuffContainerState<string>,
  ): BuffDefinitionOperationTarget<string> {
    let runtime = this.#operatorBuffRuntimes.get(operatorId);
    if (
      runtime !== undefined &&
      restoredState !== undefined &&
      runtime.runtimeState !== restoredState
    ) {
      throw new Error(`restored operator Buff container '${operatorId}' is already bound`);
    }
    if (runtime === undefined) {
      const configuredState =
        restoredState ?? this.options.restoredBuffStates?.operators.get(operatorId);
      const attributes =
        configuredState === undefined
          ? panel === undefined
            ? new CombatAttributeSet<string>()
            : createOperatorAttackAttributes(panel)
          : new CombatAttributeSet<string>(configuredState.attributes);
      const entityBlackboard =
        configuredState === undefined
          ? undefined
          : ActionBlackboard.bindRuntimeState(configuredState.entityBlackboard);
      const container = new CombatBuffContainer(
        operatorId,
        attributes,
        this.options.tagRegistry,
        null,
        entityBlackboard,
        (buff, reason, skillCastInfo) =>
          this.#recordOwnedBuffFinished(operatorId, buff, reason, skillCastInfo),
        (buff, layerCount, reason, skillCastInfo) =>
          this.#emitBuffEnhanceChanged(operatorId, buff, layerCount, reason, skillCastInfo),
        selector => {
          if (panel === undefined) {
            throw new Error(
              `operator '${operatorId}' attribute selector requires a resolved panel`,
            );
          }
          return selector.kind === 'main'
            ? [panel.mainAttribute]
            : selector.kind === 'secondary'
              ? [panel.secondaryAttribute]
              : (['strength', 'agility', 'intellect', 'will'] as const);
        },
        (gainedValue, currentValue) =>
          this.#emit(operatorId, 'afterAddedShield', {
            sourceId: operatorId,
            targetId: operatorId,
            gainedValue,
            currentValue,
          }),
        undefined,
        undefined,
        configuredState,
        (buff, producedBy) => this.#recordBuffCreated(buff, producedBy),
        (buff, previousLayers, sourceId, skillCastInfo, producedBy) =>
          this.#recordBuffStackChanged(buff, previousLayers, sourceId, skillCastInfo, producedBy),
      );
      runtime = new BuffDefinitionOperationTarget(
        container,
        {
          get: id => this.#resolveEnvironmentBuffDefinition(id),
          compile: entry => this.#compileInlineBuffDefinition(entry),
        },
        undefined,
        this.#buffAbilityEventRegistrar(operatorId),
        (event, buff) => {
          this.#recordOwnedBuffApplied(operatorId, event, buff);
          this.#emit(operatorId, 'addedBuff', event);
        },
        event => this.#emit(event.sourceId, 'beforeOutputBuff', event),
        event => this.#emit(event.sourceId, 'outputBuff', event),
        event => this.#emit(operatorId, 'beforeAddedBuff', event),
        (event, handle, subscriptions) =>
          subscriptions === undefined
            ? this.eventsFor(operatorId).registerCallback(event, handle)
            : this.#bindSingleBuffSubscription(operatorId, event, subscriptions, handle),
        (handle, restoredRegistrationId) =>
          this.#registerPostSkillRequest(operatorId, handle, restoredRegistrationId),
        definitionOperatorId => this.#requireProjectileRuntimeDependencies(definitionOperatorId),
      );
      runtime.configureAdvancedObserver(() =>
        this.#buffProgress.sample(operatorId, container.buffs, this.#requireClock().frame),
      );
      this.#operatorBuffRuntimes.set(operatorId, runtime);
    }
    return runtime;
  }

  #buffAbilityEventRegistrar(entityId: string): RegisterBuffAbilityEventAction {
    return (event, priority: number, handle, subscriptions) => {
      const receive = (context: CombatAbilityEvent<typeof event>) => {
        handle(context, this.#resolveAbilityEventRuntimeActionContext(context));
      };
      return subscriptions === undefined
        ? this.eventsFor(entityId).registerAction(event, priority, receive)
        : this.#bindSingleBuffSubscription(entityId, event, subscriptions, receive);
    };
  }

  #bindSingleBuffSubscription<Event extends AbilityResponseEventName>(
    entityId: string,
    event: Event,
    subscriptions: readonly import('../state/foundationState').AbilityEventSubscriptionReference[],
    handle: (event: CombatAbilityEvent<Event>) => void,
  ) {
    if (subscriptions.length !== 1)
      throw new Error(`Buff event binding for '${entityId}' requires exactly one subscription`);
    return this.eventsFor(entityId).bindSubscriptionFor(event, subscriptions[0]!, handle);
  }

  #requireProjectileRuntimeDependencies(
    definitionOperatorId: string,
  ): ProjectileRuntimeDependencies {
    if (this.#resolveProjectileRuntimeDependencies === null) {
      throw new Error('Buff projectile runtime requires a bound battle runtime');
    }
    return this.#resolveProjectileRuntimeDependencies(definitionOperatorId);
  }

  #resolveAbilityEventRuntimeActionContext(
    event: CombatAbilityEvent,
  ): import('../events/abilityEventActionContext').AbilityEventRuntimeActionContext | undefined {
    const ids = resolveAbilityEventActionContextBinding(event);
    if (ids === undefined) return undefined;
    return {
      inputTarget: runtimeTargetFromEntityId(ids.inputTargetId),
      triggerTarget:
        ids.triggerTargetId === null ? null : runtimeTargetFromEntityId(ids.triggerTargetId),
    };
  }

  #compileInlineBuffDefinition(
    entry: import('../buffs/combatBuffDefinitions').CombatBuffDefinitionEntry,
  ): import('../buffs/combatBuffs').CombatBuffDefinition<string> {
    const definitions = new CompiledCombatBuffDefinitions(`inline:${entry.id}`, [entry], {
      emitElementalInflictionStarted: payload =>
        this.#emit('enemy', 'elementalInflictionStarted', payload),
      onSpellBurstTriggered: payload => this.#onSpellBurstTriggered(payload),
      onAttackScaledDamageTriggered: payload => this.#onBuffDamageTriggered(payload),
      readAttribute: (request, buff) => this.#readSourceAttributeValue(buff.sourceId, request),
    });
    return definitions.get(entry.id)!;
  }
  #inflictionAdapter(operatorId: string): ElementalInflictionBuffAdapter<string> {
    let adapter = this.#inflictionAdapters.get(operatorId);
    if (adapter === undefined) {
      const resolveCompoundStatusBlackboard =
        this.options.compoundStatusFactories === undefined
          ? undefined
          : (
              consumedElement: 'heat' | 'electric' | 'cryo' | 'nature',
              incomingElement: 'heat' | 'electric' | 'cryo' | 'nature',
              inputBlackboard: Readonly<Record<string, number>>,
            ) => {
              const catalog = this.options.compoundStatusFactories!;
              const factory = catalog.factories.find(
                entry =>
                  entry.consumedElement === consumedElement &&
                  entry.incomingElement === incomingElement,
              );
              if (factory === undefined) {
                throw new Error(
                  `compound status '${consumedElement}->${incomingElement}' has no factory`,
                );
              }
              const settings = this.#ensureSkillSettings();
              const enhance = this.#operatorBuffRuntime(operatorId).container.attributes.get(
                'PhysicalAndSpellInflictionEnhance',
              );
              const result = executeCompoundStatusFactory(
                factory,
                inputBlackboard,
                enhance,
                settings,
              );
              const definition = this.#ensureElementalDefinitions().getCompoundStatus(
                consumedElement,
                incomingElement,
              );
              if (definition.id !== result.buffId) {
                throw new Error(
                  `compound-status factory '${factory.id}' creates '${result.buffId}', ` +
                    `but the registered definition is '${definition.id}'`,
                );
              }
              const blackboard = { ...result.blackboardValues } as Record<string, number>;
              // 腐蚀已由有原生事件证据的公共初始化入口处理；其他既有反应配置保持原入口。
              const reaction =
                incomingElement === 'electric'
                  ? 'electrification'
                  : incomingElement === 'cryo'
                    ? 'frozen'
                    : incomingElement === 'heat'
                      ? 'burning'
                      : null;
              const modifier = this.#reactionModifiers
                .get(operatorId)
                ?.find(m => m.reaction === reaction);
              if (modifier !== undefined) {
                if (typeof blackboard.duration !== 'number')
                  throw new Error(`reaction '${reaction}' has no numeric duration output`);
                if (modifier.effectivenessAddition !== 0)
                  throw new Error(
                    `reaction '${reaction}' effectiveness modifier has no connected factory output`,
                  );
                blackboard.duration += modifier.durationSecondsAddition;
              }
              return blackboard;
            };
      adapter = new ElementalInflictionBuffAdapter(
        this.#enemyBuffs,
        operatorId,
        this.#ensureElementalDefinitions(),
        undefined,
        (event, buff) => {
          this.#recordOwnedBuffApplied('enemy', event, buff);
          this.#emit('enemy', 'addedBuff', event);
        },
        resolveCompoundStatusBlackboard,
        event => this.#emit(operatorId, 'beforeOutputBuff', event),
        event => this.#emit(operatorId, 'outputBuff', event),
        event => this.#emit('enemy', 'beforeAddedBuff', event),
      );
      this.#inflictionAdapters.set(operatorId, adapter);
    }
    return adapter;
  }

  #ensureElementalDefinitions(): CompiledCombatBuffDefinitions<string> {
    if (this.#elementalDefinitions !== null) return this.#elementalDefinitions;
    const document = this.options.elementalInflictionDocument;
    if (document === undefined) {
      throw new Error('elemental infliction requires an elemental infliction document');
    }
    this.#elementalDefinitions = compileCombatBuffDefinitions(document, {
      emitElementalInflictionStarted: payload =>
        this.#emit('enemy', 'elementalInflictionStarted', payload),
      onSpellBurstTriggered: payload => this.#onSpellBurstTriggered(payload),
      onAttackScaledDamageTriggered: payload => this.#onBuffDamageTriggered(payload),
      readAttribute: (request, buff) => this.#readSourceAttributeValue(buff.sourceId, request),
    });
    return this.#elementalDefinitions;
  }

  #resolveEnvironmentBuffDefinition(
    id: string,
  ): import('../buffs/combatBuffs').CombatBuffDefinition<string> | undefined {
    return this.options.elementalInflictionDocument === undefined
      ? undefined
      : this.#ensureElementalDefinitions().get(id);
  }

  #readSourceAttributeValue(
    sourceId: string,
    request: {
      readonly attribute:
        | { readonly kind: 'specific'; readonly key: string }
        | { readonly kind: 'main' | 'secondary' | 'all' };
      readonly stage: 'armedNonConverted' | 'finalNonConverted';
    },
  ): number {
    sourceId = this.#resolveAbilitySystemSourceId(sourceId);
    if (sourceId === 'enemy') {
      if (request.attribute.kind !== 'specific') {
        throw new Error(
          `combat attribute source enemy has no '${request.attribute.kind}' attribute`,
        );
      }
      if (request.attribute.key === 'maxHealth') return this.#enemyVitals.maxHealth;
      if (!this.#enemyAttributes.has(request.attribute.key)) {
        throw new Error(
          `combat attribute source 'enemy' has no attribute '${request.attribute.key}'`,
        );
      }
      return request.stage === 'armedNonConverted'
        ? this.#enemyAttributes.getArmed(
            request.attribute.key,
            ATTRIBUTE_MODIFIER_SOURCES.nonConverted,
          )
        : this.#enemyAttributes.get(request.attribute.key, ATTRIBUTE_MODIFIER_SOURCES.nonConverted);
    }
    if (request.attribute.kind === 'specific' && request.attribute.key === 'maxUltimateEnergy') {
      if (this.#resources === null) {
        throw new Error('combat resource ledger is not bound');
      }
      return this.#resources.getMaxUltimateEnergy(sourceId);
    }
    if (request.attribute.kind === 'specific' && request.attribute.key === 'maxHealth') {
      return this.#requireOperatorVitals(sourceId).maxHealth;
    }
    const panel = this.#operatorPanels.get(sourceId);
    if (panel === undefined) {
      throw new Error(`combat attribute source operator '${sourceId}' has no resolved panel`);
    }
    // 原生 StoreAttributeValue(Specific/Level) 读取当前角色等级；等级不是 Buff 可修改的
    // CombatAttributeSet 槽位，因此从同一次构筑解析得到的面板身份直接返回。
    if (request.attribute.kind === 'specific' && request.attribute.key === 'level') {
      return panel.level;
    }
    const attributes = this.#operatorBuffRuntime(sourceId, panel).container.attributes;
    const keys =
      request.attribute.kind === 'specific'
        ? [request.attribute.key]
        : request.attribute.kind === 'main'
          ? [panel.mainAttribute]
          : request.attribute.kind === 'secondary'
            ? [panel.secondaryAttribute]
            : (['strength', 'agility', 'intellect', 'will'] as const);
    return keys.reduce((total, key) => {
      if (!attributes.has(key)) {
        throw new Error(`combat attribute source '${sourceId}' has no attribute '${key}'`);
      }
      return (
        total +
        (request.stage === 'armedNonConverted'
          ? attributes.getArmed(key, ATTRIBUTE_MODIFIER_SOURCES.nonConverted)
          : attributes.get(key, ATTRIBUTE_MODIFIER_SOURCES.nonConverted))
      );
    }, 0);
  }

  /** 原生事件动作按来源、目标顺序发布，不读取倍率、不抽随机数、不造成伤害。 */
  #emitSpellBurstEvents(payload: {
    readonly burstType: string;
    readonly sourceId: string;
    readonly skillCastInfo?: import('../state/foundationState').CombatSkillCastInfo;
  }): void {
    const event = {
      sourceId: payload.sourceId,
      targetId: 'enemy',
      burstType: payload.burstType,
      skillCastInfo: payload.skillCastInfo ?? null,
    };
    this.#emit(payload.sourceId, 'beforeOutputSpellBurst', event);
    this.#emit('enemy', 'beforeTakeSpellBurst', event);
  }

  /** 旧语义目录聚合了事件、倍率读取与伤害；只允许该目录端口调用此兼容入口。 */
  #onSpellBurstTriggered(payload: {
    readonly burstType: string;
    readonly sourceId: string;
    readonly skillCastInfo?: import('../state/foundationState').CombatSkillCastInfo;
  }): void {
    const index = this.#ensureElementalDefinitions();
    const definition = index.getSpellBurst(payload.burstType);
    if (definition === null) {
      throw new Error(`spell burst '${payload.burstType}' is not declared in the buff definition`);
    }
    if (this.options.spellInflictionSettings === undefined) {
      throw new Error(
        `spell burst '${payload.burstType}' requires SkillSetting data; export it from the game and inject spellInflictionSettings`,
      );
    }
    const panel = this.#operatorPanels.get(payload.sourceId);
    if (panel === undefined) {
      throw new Error(`spell burst source operator '${payload.sourceId}' has no resolved panel`);
    }
    const settings = this.#ensureSkillSettings();
    const operatorAttributes = this.#operatorBuffRuntime(payload.sourceId, panel).container
      .attributes;
    this.#emitSpellBurstEvents(payload);
    executeSpellBurst({
      definition,
      enhance: operatorAttributes.get('PhysicalAndSpellInflictionEnhance'),
      settings,
      damage: this.#auxiliaryDamageDependencies(payload.sourceId, payload.skillCastInfo),
    });
  }

  /** 独立伤害共用来源属性、准备事件、伤害处理器和护盾，不伪造技能运行上下文。 */
  #auxiliaryDamageDependencies(
    sourceId: string,
    skillCastInfo?: import('../state/foundationState').CombatSkillCastInfo,
  ): PlayerDamageOperationDependencies {
    const panel = this.#operatorPanels.get(sourceId);
    if (panel === undefined)
      throw new Error(`damage source operator '${sourceId}' has no resolved panel`);
    const operatorBuffs = this.#operatorBuffRuntime(sourceId, panel).container;
    return {
      ...this.#damagePreparationPorts(sourceId, operatorBuffs),
      sourceOperatorId: sourceId,
      ...(skillCastInfo === undefined
        ? {}
        : {
            skillCastInfo,
            sourceActionId: skillCastInfo.originCastId,
            castId: skillCastInfo.originCastId,
          }),
      targetId: 'enemy',
      targetVitals: this.enemyVitals,
      clock: this.#requireClock(),
      receipt: this.#requireReceipt(),
      ...(panel.attackDetail === undefined ? {} : { attackDetail: panelAttackDetail(panel)! }),
      captureAttributeSnapshots: step =>
        this.#withAttributeModifierDetails(
          resolveStaticPlayerDamageSnapshots(
            { operatorId: sourceId, panel, enemy: this.#requireEnemyIdentity() },
            step,
            operatorBuffs.attributes,
            this.#enemyAttributes,
          ),
          operatorBuffs,
        ),
      criticalSamples: this.options.criticalSamples,
      randomMode: this.options.randomMode,
      resolveNonRandomRuntimeSnapshot: step => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: step.parameters.tags.includes('fireAbnormal'),
        appliesPhysicalInflictionDamageMultiplier:
          step.parameters.features?.includes('physicalInfliction') ?? false,
      }),
      resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
      emitHealthSourceEvent: (event, payload) => this.#emit(sourceId, event, payload),
      emitHealthTargetEvent: (event, payload) => this.#emit('enemy', event, payload),
      absorbHealthDamage: (type, value) => this.#enemyBuffs.absorbDamage(type, value),
      emitPoiseSourceEvent: (event, payload) => this.#emit(sourceId, event, payload),
      emitPoiseTargetEvent: (event, payload) => this.#emit('enemy', event, payload),
      beforePoiseZero: payload =>
        this.#poiseBreakBuffs.begin(
          payload.sourceId,
          this.#poiseBreakDefinitions.get(payload.sourceId),
        ),
      delegate: strictTerminal,
    };
  }

  /** 执行法术异常等 Buff 生命周期中的原生 DamageAction。 */
  #onBuffDamageTriggered(
    payload: Parameters<
      NonNullable<
        import('../buffs/combatBuffDefinitions').CombatBuffDefinitionCompilerPorts<string>['onAttackScaledDamageTriggered']
      >
    >[0],
  ): void {
    const dependencies = this.#auxiliaryDamageDependencies(payload.sourceId, payload.skillCastInfo);
    const buffIdentity = {
      buffId: payload.buffId,
      buffInstanceId: payload.buffInstanceId,
      buffOwnerId: payload.buffOwnerId,
      sourceActionId: payload.sourceActionId,
    };
    const receipt = this.#requireReceipt();
    let applied: import('../receipt/combatReceipt').CombatReceiptEntry['data'];
    // 仅补充本次 Buff 身份；结算数值与事件仍由公共执行器产生。
    const damage = new PlayerDamageOperationExecutor({
      ...dependencies,
      sourceActionId: payload.sourceActionId,
      receipt: {
        record: entry => {
          if (entry.event === 'DamageApplied') {
            applied = entry.data;
            receipt.record({
              ...entry,
              producedBy: {
                kind: 'buff',
                ownerId: payload.buffOwnerId,
                instanceId: payload.buffInstanceId,
              },
              data: { ...entry.data, ...buffIdentity, canCritical: payload.canCritical },
            });
          } else receipt.record(entry);
        },
      },
      captureAttributeSnapshots: step => {
        const snapshots = dependencies.captureAttributeSnapshots(step);
        // 目录中的 canCritical=false 来自原生 unit 即时暴击率覆盖；不推进随机流。
        return payload.canCritical
          ? snapshots
          : {
              ...snapshots,
              attacker: { ...snapshots.attacker, criticalRate: 0 },
            };
      },
    });
    damage.execute({
      kind: 'dealDamage',
      parameters: {
        damageType: payload.damageType,
        attackScale: payload.attackScale,
        tags: payload.tags,
        features: payload.features,
      },
    });
    if (applied === undefined) throw new Error('Buff damage executor produced no damage receipt');
    receipt.record({
      frame: this.#requireClock().frame,
      time: this.#requireClock().time,
      event: 'BuffDamageApplied',
      sourceId: payload.sourceId,
      targetId: 'enemy',
      data: {
        ...buffIdentity,
        damageType: payload.damageType,
        attackScale: payload.attackScale,
        value: applied.value!,
        actualDamage: applied.actualDamage!,
        remainingHealth: applied.remainingHealth!,
      },
    });
  }

  #ensureSkillSettings(): CompoundStatusSkillSettingSource {
    const document = this.options.spellInflictionSettings;
    if (document === undefined) {
      throw new Error('spell burst requires SkillSetting data');
    }
    if (this.#skillSettings === null) {
      this.#skillSettings = createSkillSettingSource(document);
    }
    return this.#skillSettings;
  }

  #requireEnemyIdentity(): NonNullable<CombatOperationExecutorContext['enemy']> {
    if (this.#enemyIdentity === null) {
      throw new Error('standard player damage environment has not been bound to an enemy');
    }
    return this.#enemyIdentity;
  }

  #requireClock(): CombatClock {
    // 爆发只会在技能运行时触发，此时绑定敌人的执行器上下文时钟仍然可用。
    const clock = this.#clock;
    if (clock === null) {
      throw new Error('standard player damage environment has no battle clock');
    }
    return clock;
  }

  #requireReceipt(): CombatReceiptSink {
    const receipt = this.#receipt;
    if (receipt === null) {
      throw new Error('standard player damage environment has no battle receipt');
    }
    return receipt;
  }

  /** 分配完成后、Start/Enable 前记录身份；刷新和恢复不重新产生出生事实。 */
  #recordBuffCreated(
    buff: CombatBuff<string>,
    producedBy?: import('../receipt/combatReceipt').CombatObjectRef,
  ): void {
    if (this.#clock === null || this.#receipt === null) {
      throw new Error('Buff created before the environment was bound to a battle');
    }
    this.#receipt.record({
      frame: this.#clock.frame,
      time: this.#clock.time,
      event: 'BuffCreated',
      subject: { kind: 'buff', ...buff.reference },
      producedBy,
      ...(buff.sourceId === 'battle'
        ? {}
        : { runtimeSource: runtimeTargetFromEntityId(buff.sourceId) }),
      sourceId: buff.sourceId,
      targetId: buff.owner.ownerId,
      data: {
        buffId: buff.definition.id,
        sourceActionId: buff.sourceActionId,
        ...(buff.skillCastInfo?.originCastId === undefined
          ? {}
          : { castId: buff.skillCastInfo.originCastId }),
      },
    });
  }

  #recordBuffStackChanged(
    buff: CombatBuff<string>,
    previousLayers: number,
    sourceId?: string,
    skillCastInfo?: import('../state/foundationState').CombatSkillCastInfo | null,
    producedBy?: import('../receipt/combatReceipt').CombatObjectRef,
  ): void {
    this.#requireReceipt().record({
      frame: this.#clock!.frame,
      time: this.#clock!.time,
      event: 'BuffStackChanged',
      ...(producedBy === undefined ? {} : { producedBy }),
      targetId: buff.owner.ownerId,
      ...(sourceId === undefined ? {} : { sourceId }),
      data: {
        buffId: buff.definition.id,
        instanceId: buff.instanceId,
        previousLayers,
        layers: buff.enhanceCount,
        delta: buff.enhanceCount - previousLayers,
        ...(skillCastInfo?.originCastId === undefined
          ? {}
          : { castId: skillCastInfo.originCastId }),
      },
    });
  }

  /** Buff 施加成功后记录实例身份与原生展示数据，供时间轴还原生命周期和图标。 */
  #recordOwnedBuffApplied(
    ownerId: string,
    event: import('../buffs/buffOperationExecutor').BuffAppliedEvent,
    buff: CombatBuff<string>,
  ): void {
    if (this.#clock === null || this.#receipt === null) {
      throw new Error(
        `Buff on '${ownerId}' was applied before the environment was bound to a battle`,
      );
    }
    const clock = this.#clock;
    const receipt = this.#receipt;
    const presentation = buff.definition.presentation;
    const simpleModifier = simpleAttributeModifierFact(buff);
    const recordPresentation = (
      eventName: 'BuffApplied' | 'BuffPresentationStarted',
      buffId: string,
      currentPresentation:
        NonNullable<CombatBuff<string>['definition']['presentation']> | undefined,
      parentBuffId?: string,
    ): void =>
      receipt.record({
        frame: clock.frame,
        time: clock.time,
        event: eventName,
        ...(eventName === 'BuffApplied' && event.producedBy !== undefined
          ? { producedBy: event.producedBy }
          : {}),
        sourceId: event.sourceId,
        targetId: ownerId,
        data: {
          buffId,
          instanceId: buff.instanceId,
          ...(event.physicalInflictionType === undefined
            ? {}
            : { physicalInflictionType: event.physicalInflictionType }),
          layers: buff.enhanceCount,
          stackingType: buff.definition.stackingType,
          hasFiniteLifetime: buff.remainingDuration !== null,
          sourceActionId: buff.sourceActionId,
          ...(event.skillCastInfo?.originCastId === undefined
            ? {}
            : { castId: event.skillCastInfo.originCastId }),
          ...(event.iconDurationSourceTargetId === undefined
            ? {}
            : { iconDurationSourceTargetId: event.iconDurationSourceTargetId }),
          ...(simpleModifier ?? {}),
          ...(parentBuffId === undefined ? {} : { parentBuffId }),
          ...(currentPresentation?.iconId === undefined
            ? {}
            : { iconId: currentPresentation.iconId }),
          ...(currentPresentation?.iconPath === undefined
            ? {}
            : { iconPath: currentPresentation.iconPath }),
          ...(currentPresentation?.visible === undefined
            ? {}
            : { visible: currentPresentation.visible }),
          ...(currentPresentation?.showInHeadBarCommon === undefined
            ? {}
            : { showInHeadBarCommon: currentPresentation.showInHeadBarCommon }),
          ...(currentPresentation?.showInHeadBarAttached === undefined
            ? {}
            : { showInHeadBarAttached: currentPresentation.showInHeadBarAttached }),
          ...(currentPresentation?.showInSquadIcon === undefined
            ? {}
            : { showInSquadIcon: currentPresentation.showInSquadIcon }),
          ...(currentPresentation?.onlyShowForMainCharacter === undefined
            ? {}
            : { onlyShowForMainCharacter: currentPresentation.onlyShowForMainCharacter }),
          ...(currentPresentation?.showProgressInHpBar === undefined
            ? {}
            : { showProgressInHpBar: currentPresentation.showProgressInHpBar }),
          ...(currentPresentation?.showProgressInNormalSkillButton === undefined
            ? {}
            : {
                showProgressInNormalSkillButton:
                  currentPresentation.showProgressInNormalSkillButton,
              }),
          ...(currentPresentation?.useWeakProgressInNormalSkillButton === undefined
            ? {}
            : {
                useWeakProgressInNormalSkillButton:
                  currentPresentation.useWeakProgressInNormalSkillButton,
              }),
          ...(currentPresentation?.showProgressInUltimateSkillButton === undefined
            ? {}
            : {
                showProgressInUltimateSkillButton:
                  currentPresentation.showProgressInUltimateSkillButton,
              }),
          ...(currentPresentation?.showWarningBackground === undefined
            ? {}
            : { showWarningBackground: currentPresentation.showWarningBackground }),
          ...(currentPresentation?.iconStyleInSquad === undefined
            ? {}
            : { iconStyleInSquad: currentPresentation.iconStyleInSquad }),
          ...(currentPresentation?.abnormalColorType === undefined
            ? {}
            : { abnormalColorType: currentPresentation.abnormalColorType }),
          ...(currentPresentation?.orderPriority === undefined
            ? {}
            : {
                orderUseDirectoryValue: currentPresentation.orderPriority.useDirectoryValue,
                orderPriorityValue: currentPresentation.orderPriority.value,
                orderPriorityCategory: currentPresentation.orderPriority.category,
              }),
        },
      });
    recordPresentation('BuffApplied', buff.definition.id, presentation);
    if (ownerId !== 'enemy') {
      this.#buffProgress.register(
        ownerId,
        buff,
        buff.definition.id,
        presentation,
        clock.frame,
        this.options.passiveProgressBuffIdsByOperator?.get(ownerId)?.has(buff.definition.id) ===
          true,
      );
    }
    for (const child of buff.definition.childPresentations ?? []) {
      recordPresentation(
        'BuffPresentationStarted',
        child.buffId,
        child.presentation,
        buff.definition.id,
      );
      if (ownerId !== 'enemy') {
        this.#buffProgress.register(ownerId, buff, child.buffId, child.presentation, clock.frame);
      }
    }
  }

  #recordOwnedBuffFinished(
    ownerId: string,
    buff: CombatBuff<string>,
    reason: BuffFinishReason,
    skillCastInfo?: import('../state/foundationState').CombatSkillCastInfo | null,
  ): void {
    this.#recordBuffRemoval(ownerId, buff, reason);
    this.#emitBuffFinished(ownerId, buff, reason, skillCastInfo);
  }

  /** 表现/回执投影与 AbilityEvent 发布分开，释放不可复用后者。 */
  #recordBuffRemoval(
    ownerId: string,
    buff: CombatBuff<string>,
    reason: BuffFinishReason,
    event: 'BuffFinished' | 'BuffReleased' = 'BuffFinished',
  ): void {
    if (this.#clock === null || this.#receipt === null) {
      throw new Error(`Buff on '${ownerId}' finished before the environment was bound to a battle`);
    }
    if (ownerId !== 'enemy') {
      this.#buffProgress.finish(ownerId, buff, this.#clock.frame);
    }
    this.#receipt.record({
      frame: this.#clock.frame,
      time: this.#clock.time,
      event,
      targetId: ownerId,
      data: {
        buffId: buff.definition.id,
        instanceId: buff.instanceId,
        reason,
        layers: buff.enhanceCount,
      },
    });
    for (const child of buff.definition.childPresentations ?? []) {
      this.#receipt.record({
        frame: this.#clock.frame,
        time: this.#clock.time,
        event: 'BuffPresentationFinished',
        targetId: ownerId,
        data: {
          buffId: child.buffId,
          parentBuffId: buff.definition.id,
          instanceId: buff.instanceId,
          reason,
          layers: buff.enhanceCount,
        },
      });
    }
  }

  #emitBuffFinished(
    ownerId: string,
    buff: CombatBuff<string>,
    reason: BuffFinishReason,
    skillCastInfo?: import('../state/foundationState').CombatSkillCastInfo | null,
  ): void {
    this.#emit(ownerId, 'finishedBuff', {
      buff,
      ...(skillCastInfo === undefined ? {} : { skillCastInfo }),
      sourceId: ownerId,
      targetId: ownerId,
      buffId: buff.definition.id,
      buffTags: buff.definition.applyTags ?? [],
      reason,
    });
    if (reason === 'early' || reason === 'ignite') {
      // ConsumeBuffSingle 提前消费在 OnFinishedBuff 之后同步广播
      // OnBuffEndsEarly，并携带同一 FinishBuffEventData。
      this.#emit(ownerId, 'buffEndsEarly', {
        buff,
        ...(skillCastInfo === undefined ? {} : { skillCastInfo }),
        sourceId: ownerId,
        targetId: ownerId,
        buffId: buff.definition.id,
        buffTags: buff.definition.applyTags ?? [],
        reason,
      });
    }
  }

  #emitBuffEnhanceChanged(
    ownerId: string,
    buff: CombatBuff<string>,
    layerCount: number,
    reason?: BuffFinishReason,
    skillCastInfo?: import('../state/foundationState').CombatSkillCastInfo | null,
  ): void {
    if (layerCount > 0)
      this.#requireReceipt().record({
        frame: this.#clock!.frame,
        time: this.#clock!.time,
        event: 'BuffEnhanceAttempted',
        targetId: ownerId,
        data: {
          buffId: buff.definition.id,
          instanceId: buff.instanceId,
          layers: buff.enhanceCount,
          attemptedLayers: layerCount,
          ...(skillCastInfo?.originCastId === undefined
            ? {}
            : { castId: skillCastInfo.originCastId }),
        },
      });
    this.#emit(ownerId, 'buffEnhanceChanged', {
      // DoesEventHaveTarget(209)=false：只保留发布者，不补造自身目标。
      sourceId: ownerId,
      buff,
      buffId: buff.definition.id,
      buffTags: buff.definition.applyTags ?? [],
      layerCount,
      ...(skillCastInfo === undefined ? {} : { skillCastInfo }),
      ...(reason === undefined ? {} : { reason }),
    });
  }

  #buffContainer(
    side: DamageModifierSide,
    operatorBuffs: CombatBuffContainer<string>,
  ): CombatBuffContainer<string> {
    return side === 'attacker' ? operatorBuffs : this.#enemyBuffs;
  }

  #healBuffContainer(
    side: HealModifierSide,
    healerId: string,
    receiverId: string,
  ): CombatBuffContainer<string> {
    const operatorId = side === 'healer' ? healerId : receiverId;
    if (operatorId === 'enemy') return this.#enemyBuffs;
    return this.#operatorBuffRuntime(operatorId, this.#operatorPanels.get(operatorId)).container;
  }

  #readHealAttributeValue(entityId: string, attribute: HealCalculationAttribute): number {
    if (entityId === 'enemy') {
      if (attribute === 'maxHealth') return this.#enemyVitals.maxHealth;
      return this.#enemyAttributes.get(attribute);
    }
    return this.#readSourceAttributeValue(entityId, {
      attribute: { kind: 'specific', key: attribute },
      stage: 'finalNonConverted',
    });
  }

  /** 随战斗环境创建一次；由角色装配显式安装条件，不按技能块重复注册。 */
  readonly comboConditions = new ComboSkillConditionRuntime();

  #emitInfliction(
    entityId: string,
    event: ElementalInflictionEvent,
    payload: ElementalInflictionEventPayload,
  ): void {
    this.eventsFor(entityId).dispatch({ event, payload }, [], {
      onAbilityEvent: context => {
        switch (context.event) {
          case 'beforeOutputInfliction':
          case 'beforeTakeInfliction':
          case 'afterOutputInfliction':
          case 'afterTakeInfliction':
            this.comboConditions.onAbilityEvent(context);
        }
      },
    });
  }

  #emit<Event extends keyof AbilityEventPayloadMap>(
    entityId: string,
    event: Event,
    payload: AbilityEventPayloadMap[Event],
  ): void;
  #emit<Event extends StandardPlayerDamageEvent>(
    entityId: string,
    event: Event,
    payload: StandardPlayerDamagePayloadMap[Event],
  ): void;
  #emit(entityId: string, event: StandardPlayerDamageEvent, payload: unknown): void {
    // 重载已校验事件名与载荷；实现签名只在此恢复两参数的键关联，不转换载荷。
    const published = { event, payload } as AbilityEventFromMap<
      StandardPlayerDamageEvent,
      StandardPlayerDamagePayloadMap
    >;
    this.#publish(entityId, published);
  }

  #publish(
    entityId: string,
    published: AbilityEventFromMap<StandardPlayerDamageEvent, StandardPlayerDamagePayloadMap>,
  ): void {
    const { event, payload } = published;
    this.eventsFor(entityId).dispatch(
      published,
      [],
      // battle 是 GlobalBuff 的归因身份，不是具有输入/触发目标的 AbilitySystem。
      // 战斗级子 Buff 仍向接收者发布 AddedBuff，但不能伪造角色 OutputBuff 连携事件。
      entityId !== 'battle'
        ? {
            // 当前发布路径的已审计准入，不等同于公共动作目标绑定表。
            // 在收到完整事件后收窄，保留名称/载荷关联，不重建或断言上下文。
            onAbilityEvent: context => {
              switch (context.event) {
                case 'afterTakePhysicalInfliction':
                case 'beforeAddedBuff':
                case 'addedBuff':
                case 'outputBuff':
                case 'buffEndsEarly':
                case 'beforeTakeDamage':
                case 'beforeOutputDamage':
                case 'takeDamage':
                case 'outputDamage':
                case 'poiseZero':
                case 'poiseKnotBreak':
                case 'buffConsumed':
                case 'buffAbsorbed':
                case 'weaknessSet':
                  this.comboConditions.onAbilityEvent(context);
              }
            },
          }
        : undefined,
    );
    if (event === 'takeDamage' && isCriticalDamagePayload(payload)) {
      this.eventsFor(entityId).dispatch({ event: 'takeCriticalDamage', payload }, []);
    }
    if (event === 'outputDamage' && isCriticalDamagePayload(payload)) {
      this.eventsFor(entityId).dispatch({ event: 'outputCriticalDamage', payload }, []);
    }
  }
}

function isCriticalDamagePayload(
  payload: AbilityEventPayloadMap['takeDamage'],
): payload is AbilityEventPayloadMap['takeCriticalDamage'] {
  return 'result' in payload && payload.result?.isCritical === true;
}
