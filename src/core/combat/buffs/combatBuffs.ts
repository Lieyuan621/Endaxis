import type { BuffFinishReason } from '../state/foundationState';
import {
  type BuffDuration,
  type BuffKeywordEnhancementDefinition,
  type BuffMaxStackCount,
  type BuffPriority,
  type BuffShieldAttributeValue,
  type BuffShieldDefinition,
  type BuffStackingType,
  type BuffSustainedProtectionDefinition,
  type BuffTimeClock,
  type BuffTriggerCount,
  type CombatBuffChildPresentation,
  type CombatBuffPresentation,
} from '../../../../packages/game-data-contract/src/buffs.ts';
import type { BuffShieldState } from '../state/instanceState';
import {
  createBuffContainerState,
  createBuffInstanceState,
  createBuffStackingState,
  type BuffContainerState,
  type BuffInstanceState,
} from '../state/instanceState';
import {
  removeBuffAttributeModifiers,
  replaceBuffAttributeModifiers,
} from './buffAttributeExecution';
import {
  addBuffEntityTags,
  advanceBuffAddingCooldowns,
  removeBuffEntityTags,
} from './buffContainerExecution';
import {
  attachBuffChild,
  decreaseBuffEnhancements,
  enhanceBuffLifecycle,
  extendBuffDuration,
  finishBuffChildren,
  finishBuffLifecycle,
  refreshBuffDuration,
  setFiniteBuffDuration,
  tickBuffLifecycle,
} from './buffLifecycleExecution';
import { buffReferenceKey, resolveBuffReferenceState } from './buffReference';
import { SHIELD_EPSILON, absorbShieldDamage, refreshShieldConsumed } from './buffShieldExecution';
import {
  applyTimedBuffEnhancement,
  canGrowBuffStacking,
  countBuffStackingEnhancements,
  countBuffStackingInstances,
  enhanceBuffStacking,
  growBuffStacking,
  refreshBuffStackingPriority,
  type BuffStackingHost,
} from './buffStackingExecution';
// 纯数据契约由独立包唯一声明；此路径保留兼容导出。
export {
  BUFF_STACKING_TYPES,
  type BuffDuration,
  type BuffKeywordEnhancementDefinition,
  type BuffMaxStackCount,
  type BuffPriority,
  type BuffShieldDamageAbsorptionDefinition,
  type BuffShieldDefinition,
  type BuffShieldPriority,
  type BuffStackingType,
  type BuffSustainedProtectionDefinition,
  type BuffTimeClock,
  type BuffTriggerCount,
  type CombatBuffChildPresentation,
  type CombatBuffPresentation,
} from '../../../../packages/game-data-contract/src/buffs.ts';
/**
 * 一次模拟中每个实体的 Buff 状态所有者。
 * 调用方通过稳定定义添加 Buff，并按战斗时钟推进；不得把实例写回定义或项目存档。
 */
import type { DamageType } from '../../game-data/operatorDefinition';
import { ActionBlackboard, type ActionBlackboardValue } from '../actions/actionBlackboard';
import {
  ATTRIBUTE_MODIFIER_SOURCES,
  type AttributeModifierSource,
  type CombatAttributeModifier,
} from '../state/foundationState';
import {
  attributeModifierValues,
  createCombatAttributeModifier,
  type AttributeModifierSlot,
  type AttributeModifierTiming,
  type AttributeModifierValues,
  type CombatAttributeSet,
} from '../attributes/combatAttributes';
import {
  DamageModifier,
  type DamageModifierConditionEvaluator,
  type DamageModifierDefinition,
} from '../damage/damageModifiers';
import type {
  DamageModifierSide,
  DamageProcessTiming,
  PlayerDamageContext,
} from '../damage/playerDamageContext';
import { applyPoiseModifier } from '../damage/poiseModifierExecution';
import {
  createPoiseModifier,
  type PoiseCalculationContext,
  type PoiseModifierDefinition,
  type PoiseModifierSide,
  type PoiseProcessTiming,
} from '../damage/poiseModifiers';
import { applyHealModifier } from '../heal/healModifierExecution';
import {
  createHealModifier,
  type HealCalculationContext,
  type HealModifierDefinition,
  type HealModifierSide,
  type HealProcessTiming,
} from '../heal/healModifiers';
import {
  createSharedSpGainModifier,
  type SharedSpGainModifierSet,
} from '../resources/sharedSpGainModifiers';
import type { CombatSkillCastInfo, DamageModifierState } from '../state/foundationState';
import {
  type HealModifier,
  type PoiseModifier,
  type SharedSpGainAttribute,
  type SharedSpGainModifierOperation,
} from '../state/foundationState';
import {
  GameplayTagRegistry,
  type GameplayTag,
  type GameplayTagQueryType,
} from '../tags/gameplayTags';
import { advanceBuffTriggers } from './buffLifecycleExecution';
import { resolveBuffModifierNumber } from './buffModifierNumberSource';

const BUFF_LIFETIME_EPSILON = 0.00001;
const BUFF_PRIORITY_EPSILON = 0.00001;

/** 从 Buff 实例黑板读取单个原生属性槽位值的动态修正。 */
export interface BuffBlackboardAttributeModifierValues {
  readonly slot: AttributeModifierSlot;
  readonly blackboardKey: string;
}

/** Buff 属性修正可使用固定八槽值，也可在实例运行期间从黑板重新解析。 */
export type BuffAttributeModifierValues =
  AttributeModifierValues | BuffBlackboardAttributeModifierValues;

/** Buff 激活期间向实体属性系统注册的一项修正。 */
export interface BuffAttributeModifierDefinition<Key extends string> {
  readonly attribute: Key | { readonly kind: 'main' | 'secondary' | 'all' };
  readonly values: BuffAttributeModifierValues;
  readonly timing: AttributeModifierTiming;
  readonly source?: AttributeModifierSource;
  /** 原生属性修正目标；buffSource 不得静默退化为 Buff Owner。 */
  readonly target?: 'owner' | 'buffSource';
}

/** Buff 启用期间注册到整场战斗共享 SP 系统的一项固定值修正。 */
export interface BuffSharedSpGainModifierDefinition {
  readonly attribute: SharedSpGainAttribute;
  readonly operation: SharedSpGainModifierOperation;
  readonly value: number;
  readonly applyToReturnSpGain: boolean;
}

/** 一帧内供 Buff 实例选择的三路时间增量。 */
export interface BuffTickDeltas {
  /** BuffContainer.OnTick 的第一路：全局缩放时间，不是 AbilitySystem 的默认冷却时间。 */
  readonly globalDeltaSeconds: number;
  /** 原生 allScaledDeltaTime：所属实体最终时间，包含忽略全局缩放的处理。 */
  readonly entityDeltaSeconds: number;
  /** 原生 selfScaledDeltaTime：全局倍率 × 自身倍率，不采用忽略全局缩放开关。 */
  readonly globalAndSelfDeltaSeconds: number;
}

/**
 * Buff 启用期间持续执行的有状态动作。
 * 定义对象只充当蓝图；每个 Buff 实例必须通过 createRuntimeInstance 获得独立运行状态。
 */
export interface BuffDuringEnableAction<Key extends string> {
  createRuntimeInstance(): BuffDuringEnableAction<Key>;
  /** 只把复制后的动作数据接回当前实例；不得重放启用动作。 */
  bindRestored?(buff: CombatBuff<Key>): void;
  tryExecute(buff: CombatBuff<Key>): boolean;
  tick(deltaTime: number, buff: CombatBuff<Key>): void;
  end(buff: CombatBuff<Key>): void;
  reset(buff: CombatBuff<Key>): void;
}

/** Buff 在启用、结束和移除边界执行的有序生命周期行为。 */
export interface BuffLifecycleActions<Key extends string> {
  readonly start?: (buff: CombatBuff<Key>) => void;
  readonly enable?: (buff: CombatBuff<Key>) => void;
  readonly disable?: (buff: CombatBuff<Key>) => void;
  readonly finish?: (buff: CombatBuff<Key>) => void;
  /** 宿主释放时清理局部执行器；不是普通结束动作或对外结束事件。 */
  readonly release?: (buff: CombatBuff<Key>) => void;
  readonly beforeEnhance?: (buff: CombatBuff<Key>, sourceId: string) => void;
  readonly enhanceChanged?: (buff: CombatBuff<Key>, sourceId: string) => void;
  readonly afterEnhance?: (buff: CombatBuff<Key>, sourceId: string) => void;
  readonly trigger?: (buff: CombatBuff<Key>) => void;
  readonly ignite?: (
    buff: CombatBuff<Key>,
    igniteType: string,
    sourceId: string,
    skillCastInfo?: CombatSkillCastInfo,
  ) => boolean;
  readonly duringEnable?: BuffDuringEnableAction<Key>;
}

/** 可复用、不可变的 Buff 定义；实例状态不应写回这里。 */
export interface CombatBuffDefinition<Key extends string> {
  readonly id: string;
  readonly affixSkillCastIdentity?: 'sourceSkillCast';
  readonly presentation?: CombatBuffPresentation;
  /** 原生关键词载体创建的表现子 Buff，可同时显示多个元素图标。 */
  readonly childPresentations?: readonly CombatBuffChildPresentation[];
  readonly timeClock?: BuffTimeClock;
  /** Buff 实例自身的原生分类标签；不等同于启用期间可能挂到所属实体的标签。 */
  readonly applyTags?: readonly GameplayTag[];
  /** Buff 到期但被 ExtendBuffAction 阻止结束后，临时注册到所属实体的标签。 */
  readonly extendTags?: readonly GameplayTag[];
  readonly stackingType: BuffStackingType;
  readonly stackingKey?: string;
  readonly priority?: BuffPriority;
  readonly maxStackCount?: BuffMaxStackCount;
  /** 缺少持续时间表示已还原出的无限生命周期。 */
  readonly durationSeconds?: BuffDuration;
  readonly addingCooldownSeconds?: BuffDuration;
  readonly ignoreAddingCooldown?: boolean;
  readonly triggerIntervalSeconds?: BuffDuration;
  readonly waitFirstTriggerInterval?: boolean;
  readonly maxTriggerCount?: BuffTriggerCount;
  readonly blackboard?: Readonly<Record<string, ActionBlackboardValue>>;
  readonly damageModifiers?: readonly (DamageModifierDefinition & {
    /** 装配层提供的已编译条件宿主；每个 Buff 实例独立创建，不进入游戏数据协议。 */
    readonly createConditionProgram?: (
      buff: CombatBuff<Key>,
    ) => import('../damage/damageModifiers').DamageModifierConditionProgram;
  })[];
  readonly keywordEnhancements?: readonly BuffKeywordEnhancementDefinition[];
  readonly healModifiers?: readonly HealModifierDefinition[];
  readonly poiseModifiers?: readonly PoiseModifierDefinition[];
  readonly attributeModifiers?: readonly BuffAttributeModifierDefinition<Key>[];
  /**
   * 共享 SP 修正属于战斗级状态，但其注册生命周期归当前 Buff 实例所有。
   * 当前仅支持固定值；原生动态黑板刷新链还没做通前，不在这里复用属性修正的动态语义。
   */
  readonly sharedSpGainModifiers?: readonly BuffSharedSpGainModifierDefinition[];
  readonly shields?: readonly BuffShieldDefinition[];
  readonly sustainedProtection?: BuffSustainedProtectionDefinition;
  readonly actions?: BuffLifecycleActions<Key>;
  /** 编译后的固定程序为恢复实例重建动作对象；绑定过程不得执行生命周期。 */
  readonly bindRestoredActions?: (buff: CombatBuff<Key>) => void;
  /** 所有实例目录建立后，再接回可能跨目标的动作引用。 */
  readonly bindRestoredRelations?: (buff: CombatBuff<Key>) => void;
}

/** 添加 Buff 实例时由具体行为提供的初始黑板和层数。 */
export interface CombatBuffAddOptions {
  readonly producedBy?: import('../receipt/combatReceipt').CombatObjectRef;
  readonly blackboardValues?: Readonly<Record<string, ActionBlackboardValue>>;
  /** 创建该实例的技能、被动或配装动作身份，用于解释后续生命周期步骤。 */
  readonly sourceActionId?: string;
  /** 创建该定义的 AbilitySystem；跨实体挂载和事件触发都不改变它。 */
  readonly definitionOwnerId?: string;
  /** 创建时复制的来源施法信息；缺少表示该 Buff 不继承施法身份。 */
  readonly skillCastInfo?: CombatSkillCastInfo;
  /** GlobalBuff 子投影专用：精确结束创建当前子 Buff 的父实例。 */
  readonly finishParentGlobalBuff?: (reason: 'early' | 'other') => boolean;
  /** 原生护盾 Calculation 的 attacker 端；跨实体 Buff 不得退化为 owner 属性。 */
  readonly getSourceAttributeValue?: (attribute: string) => number;
  /** getSourceAttributeValue 对应的战斗实体，用于恢复时从当前分支重新解析端口。 */
  readonly sourceAttributeOwnerId?: string;
}

/** 一个实体上某项 Buff 的独立运行时实例。 */
/** 由宿主精确持有的实例结束端口；null 是已知空施法，省略仍表示未核实。 */
export interface BuffApplicationHandle {
  readonly reference: import('../state/foundationState').BuffReference;
  /** 回收完成后引用失效；仅结束、或正在执行回收回调时仍有效。 */
  readonly isRecycled: boolean;
  readonly isFinished?: boolean;
  finish(reason: BuffFinishReason, finishSkillCastInfo?: CombatSkillCastInfo | null): boolean;
  bindFinishedCallback?(callback: () => void): { dispose(): void };
}

export class CombatBuff<Key extends string> {
  /** 仅防止同步回收回调重入；完整帧保存点不会处于回收调用栈中。 */
  #recycling = false;
  readonly #state: BuffInstanceState<Key>;
  /** 供容器统一持有实例数据；对象回调和宿主绑定不进入此结构。 */
  get runtimeState(): BuffInstanceState<Key> {
    return this.#state;
  }
  /** 只包含目标与实例编号，可随战斗数据保存；不能保存整个 Buff 对象。 */
  get reference(): import('../state/foundationState').BuffReference {
    return { ownerId: this.#state.identity.ownerId, instanceId: this.#state.identity.instanceId };
  }
  readonly #childBindings = new Map<
    string,
    { readonly child: BuffApplicationHandle; readonly finished?: { dispose(): void } }
  >();
  readonly #finishedCallbacks = new Set<() => void>();

  attachChildBuff(child: BuffApplicationHandle): void {
    if (child.isFinished === true) return;
    const key = buffReferenceKey(child.reference);
    if (this.#childBindings.has(key)) return;
    attachBuffChild(this.#state.children, child.reference);
    this.#bindChild(key, child);
  }

  /** 恢复时只重建对象绑定；关系本身已经存在于数据中，不能再次执行附着语义。 */
  bindRestoredChild(child: BuffApplicationHandle): void {
    const key = buffReferenceKey(child.reference);
    if (!this.#state.children.members.has(key)) {
      throw new Error(`restored child Buff '${key}' is not present in parent data`);
    }
    this.#bindChild(key, child);
  }

  #bindChild(key: string, child: BuffApplicationHandle): void {
    const finished = child.bindFinishedCallback?.(() => {
      this.#state.children.members.delete(key);
      this.#childBindings.delete(key);
    });
    this.#childBindings.set(key, { child, ...(finished === undefined ? {} : { finished }) });
  }

  bindFinishedCallback(callback: () => void): { dispose(): void } {
    if (this.isFinished) {
      callback();
      return { dispose() {} };
    }
    this.#finishedCallbacks.add(callback);
    return { dispose: () => void this.#finishedCallbacks.delete(callback) };
  }

  #notifyFinishedCallbacks(): void {
    for (const callback of [...this.#finishedCallbacks]) callback();
    this.#finishedCallbacks.clear();
  }

  #clearChildBindings(): void {
    for (const binding of this.#childBindings.values()) binding.finished?.dispose();
    this.#childBindings.clear();
  }
  readonly damageModifiers: readonly DamageModifier[];
  get healModifiers(): readonly HealModifier[] {
    return this.#state.healModifiers;
  }
  get poiseModifiers(): readonly PoiseModifier[] {
    return this.#state.poiseModifiers;
  }
  readonly blackboard: ActionBlackboard;
  get priority(): number {
    return this.#state.priority;
  }
  get sourceActionId(): string {
    return this.#state.sourceActionId;
  }
  get definitionOwnerId(): string {
    return this.#state.definitionOwnerId;
  }
  /** 来源施法在创建瞬间的快照，不随后续技能扣费变化。 */
  get skillCastInfo(): CombatSkillCastInfo | null {
    return this.#state.skillCastInfo;
  }
  /** 原生独立运行时状态：只有显式记录才写入，不从 Buff 普通来源编号继承。 */
  get affixSkillCastId(): number {
    return this.#state.lifecycle.affixSkillCastId;
  }

  recordBuffAffixSkillCastId(skillCastId: number): void {
    if (!Number.isSafeInteger(skillCastId) || skillCastId < 0 || skillCastId > 0xffffffff) {
      throw new Error('Buff affix skill cast identity must be a UInt32');
    }
    this.#state.lifecycle.affixSkillCastId = skillCastId;
  }
  readonly finishParentGlobalBuff: ((reason: 'early' | 'other') => boolean) | null;
  readonly getSourceAttributeValue: ((attribute: string) => number) | null;
  readonly #recycleCallbacks = new Map<number, () => void>();
  #stackingGroup: BuffStackingGroup<Key> | null = null;
  readonly #duringEnableAction: BuffDuringEnableAction<Key> | null;
  readonly shields: readonly CombatShield<Key>[];

  constructor(
    readonly definition: CombatBuffDefinition<Key>,
    readonly owner: CombatBuffContainer<Key>,
    readonly sourceId: string,
    readonly instanceId: number,
    options?: CombatBuffAddOptions,
    restoredState?: BuffInstanceState<Key>,
  ) {
    if (restoredState !== undefined) {
      if (
        restoredState.identity.ownerId !== owner.ownerId ||
        restoredState.identity.instanceId !== instanceId ||
        restoredState.identity.definitionId !== definition.id ||
        restoredState.identity.sourceId !== sourceId
      ) {
        throw new Error(`restored Buff '${definition.id}' identity does not match its binding`);
      }
      this.#state = restoredState;
      this.blackboard = ActionBlackboard.bindRuntimeState(restoredState.blackboard);
      if (restoredState.blackboard.entity !== owner.entityBlackboard.runtimeState) {
        throw new Error(
          `restored Buff '${definition.id}' does not share its owner entity blackboard`,
        );
      }
      this.finishParentGlobalBuff = options?.finishParentGlobalBuff ?? null;
      this.getSourceAttributeValue = options?.getSourceAttributeValue ?? null;
      const sourceAttributeOwnerId =
        options?.sourceAttributeOwnerId ??
        (this.getSourceAttributeValue === null ? null : restoredState.identity.sourceId);
      if (
        restoredState.sourceAttributeOwnerId !== sourceAttributeOwnerId ||
        (restoredState.sourceAttributeOwnerId !== null && this.getSourceAttributeValue === null)
      ) {
        throw new Error(`restored Buff '${definition.id}' source attribute binding does not match`);
      }
      const damageDefinitions = definition.damageModifiers ?? [];
      if (damageDefinitions.length !== restoredState.damageModifiers.length) {
        throw new Error(`restored Buff '${definition.id}' damage modifier count does not match`);
      }
      if ((definition.healModifiers?.length ?? 0) !== restoredState.healModifiers.length) {
        throw new Error(`restored Buff '${definition.id}' heal modifier count does not match`);
      }
      if ((definition.poiseModifiers?.length ?? 0) !== restoredState.poiseModifiers.length) {
        throw new Error(`restored Buff '${definition.id}' poise modifier count does not match`);
      }
      if (
        (definition.sharedSpGainModifiers?.length ?? 0) !==
        restoredState.sharedSpGainModifiers.length
      ) {
        throw new Error(`restored Buff '${definition.id}' SP modifier count does not match`);
      }
      this.damageModifiers = damageDefinitions.map(
        (modifier, index) =>
          new DamageModifier(
            owner.ownerId,
            modifier,
            restoredState.damageModifiers[index]!.numberSource,
            restoredState.damageModifiers[index]!.sourceSkillCastId,
            modifier.createConditionProgram?.(this),
            restoredState.damageModifiers[index],
          ),
      );
      this.#duringEnableAction = definition.actions?.duringEnable?.createRuntimeInstance() ?? null;
      const shieldDefinitions = definition.shields ?? [];
      if (shieldDefinitions.length !== restoredState.shields.length) {
        throw new Error(`restored Buff '${definition.id}' shield count does not match`);
      }
      this.shields = shieldDefinitions.map(
        (shield, index) => new CombatShield(this, shield, restoredState.shields[index]),
      );
      return;
    }
    this.blackboard = new ActionBlackboard(definition.blackboard, owner.entityBlackboard);
    this.#state = createBuffInstanceState<Key>(
      { ownerId: owner.ownerId, instanceId, definitionId: definition.id, sourceId },
      this.blackboard.runtimeState,
    );
    this.blackboard.assign(options?.blackboardValues);
    // 对应原生 Buff.Reset：本次赋值完成后收集来源修正，早于寿命/修正器求值。
    // 仅初始化新实例执行；刷新旧实例不会因此重播收集事件。
    owner.collectOutputBlackboard?.(definition, sourceId, this.blackboard);
    this.getSourceAttributeValue = options?.getSourceAttributeValue ?? null;
    this.#state.sourceAttributeOwnerId =
      options?.sourceAttributeOwnerId ?? (this.getSourceAttributeValue === null ? null : sourceId);
    if ((this.getSourceAttributeValue === null) !== (this.#state.sourceAttributeOwnerId === null)) {
      throw new Error(`buff '${definition.id}' source attribute binding requires owner identity`);
    }
    const initializedKeywordRates = new Set<string>();
    for (const enhancement of definition.keywordEnhancements ?? []) {
      if (initializedKeywordRates.has(enhancement.targetKey)) continue;
      const initialValue = resolveOptionalBuffNumber(
        definition.id,
        'keyword initial rate',
        enhancement.initialValue,
        this.blackboard,
      );
      if (initialValue === null) {
        throw new Error(`buff '${definition.id}' keyword initial rate is missing`);
      }
      this.blackboard.assignDynamic(enhancement.targetKey, initialValue);
      initializedKeywordRates.add(enhancement.targetKey);
    }
    this.#state.sourceActionId = options?.sourceActionId ?? definition.id;
    this.#state.definitionOwnerId = options?.definitionOwnerId ?? sourceId;
    this.#state.skillCastInfo =
      options?.skillCastInfo === undefined ? null : { ...options.skillCastInfo };
    if (definition.affixSkillCastIdentity === 'sourceSkillCast') {
      if (this.skillCastInfo === null) {
        throw new Error(
          `buff '${definition.id}' requires source skill cast identity for SkillAffix`,
        );
      }
      this.recordBuffAffixSkillCastId(this.skillCastInfo.skillCastId);
    }
    this.finishParentGlobalBuff = options?.finishParentGlobalBuff ?? null;
    this.#state.priority = resolveBuffPriority(definition, this.blackboard);
    const duration = resolveBuffDuration(definition, this.blackboard);
    if (definition.stackingType === 'timedGrowingEnhance') {
      if (duration === null || duration <= BUFF_LIFETIME_EPSILON) {
        throw new Error(`buff '${definition.id}' timed growth requires a positive duration`);
      }
      this.#state.lifecycle.remainingDuration = null;
      this.#state.lifecycle.timedGrowthPeriod = duration;
      this.#state.lifecycle.timedGrowthRemaining = duration;
    } else {
      this.#state.lifecycle.remainingDuration = duration;
      this.#state.lifecycle.timedGrowthPeriod = null;
    }
    this.#state.trigger.remainingCount = resolveBuffTriggerCount(definition, this.blackboard);
    const triggerInterval = resolveOptionalBuffNumber(
      definition.id,
      'trigger interval',
      definition.triggerIntervalSeconds,
      this.blackboard,
    );
    if (triggerInterval !== null && !Number.isFinite(triggerInterval)) {
      throw new RangeError('buff trigger interval must resolve to a finite number');
    }
    if (triggerInterval !== null && triggerInterval > BUFF_LIFETIME_EPSILON) {
      this.#state.trigger.intervalSeconds = triggerInterval;
      this.#state.trigger.remainingSeconds = definition.waitFirstTriggerInterval
        ? triggerInterval
        : 0;
    }
    this.damageModifiers = (definition.damageModifiers ?? []).map(
      modifier =>
        new DamageModifier(
          owner.ownerId,
          modifier,
          { buffId: definition.id, blackboard: this.#state.blackboard },
          this.skillCastInfo?.skillCastId ?? null,
          modifier.createConditionProgram?.(this),
        ),
    );
    this.#state.damageModifiers = this.damageModifiers.map(modifier => modifier.runtimeState);
    this.#state.healModifiers = (definition.healModifiers ?? []).map(modifier =>
      createHealModifier(owner.ownerId, modifier, {
        buffId: definition.id,
        blackboard: this.#state.blackboard,
      }),
    );
    this.#state.poiseModifiers = (definition.poiseModifiers ?? []).map(modifier =>
      createPoiseModifier(owner.ownerId, modifier, {
        buffId: definition.id,
        blackboard: this.#state.blackboard,
      }),
    );
    this.#state.attributes.modifiers = this.createAttributeModifiers();
    this.#state.sharedSpGainModifiers = (definition.sharedSpGainModifiers ?? []).map(modifier =>
      createSharedSpGainModifier(
        modifier.attribute,
        modifier.operation,
        modifier.value,
        modifier.applyToReturnSpGain,
      ),
    );
    if (this.#state.sharedSpGainModifiers.length > 0 && owner.sharedSpGainModifiers === null) {
      throw new Error(
        `buff '${definition.id}' requires a shared SP gain modifier set on its owner`,
      );
    }
    this.#duringEnableAction = definition.actions?.duringEnable?.createRuntimeInstance() ?? null;
    this.shields = (definition.shields ?? []).map(shield => new CombatShield(this, shield));
    this.#state.shields.push(...this.shields.map(shield => shield.runtimeState));
  }

  get passedTime(): number {
    return this.#state.lifecycle.passedTime;
  }

  get remainingDuration(): number | null {
    return this.#state.lifecycle.remainingDuration;
  }

  get isStarted(): boolean {
    return this.#state.lifecycle.started;
  }

  get isEnabled(): boolean {
    return this.#state.lifecycle.enabled;
  }

  get isFinished(): boolean {
    return this.#state.lifecycle.finished;
  }

  get isRecycled(): boolean {
    return this.#state.lifecycle.recycled;
  }

  /** 实例生命周期回调，不向能力事件总线发布新事件。 */
  onRecycled(callback: (buff: CombatBuff<Key>) => void): {
    readonly registrationId: number;
    dispose(): void;
  } {
    if (this.#state.lifecycle.recycled) throw new Error('Cannot subscribe to a recycled Buff');
    const registrationId = this.#state.nextRecycleCallbackId++;
    this.#state.recycleCallbackIds.push(registrationId);
    return this.bindRecycledCallback(registrationId, callback);
  }

  /** 给保存的 onRecycled 登记接回函数，不申请新编号或改变回调顺序。 */
  bindRecycledCallback(
    registrationId: number,
    callback: (buff: CombatBuff<Key>) => void,
  ): { readonly registrationId: number; dispose(): void } {
    if (this.#state.lifecycle.recycled) throw new Error('Cannot bind a recycled Buff callback');
    if (!this.#state.recycleCallbackIds.includes(registrationId)) {
      throw new Error(`Buff recycle callback '${registrationId}' is missing`);
    }
    if (this.#recycleCallbacks.has(registrationId)) {
      throw new Error(`Buff recycle callback '${registrationId}' is already bound`);
    }
    this.#recycleCallbacks.set(registrationId, () => callback(this));
    return {
      registrationId,
      dispose: () => {
        if (!this.#recycleCallbacks.delete(registrationId)) return;
        const index = this.#state.recycleCallbackIds.indexOf(registrationId);
        if (index >= 0) this.#state.recycleCallbackIds.splice(index, 1);
      },
    };
  }

  /** 仅供容器独立回收阶段使用；结束不隐式调用此方法。 */
  recycleFinished(): void {
    if (this.#state.lifecycle.recycled || this.#recycling) return;
    if (!this.#state.lifecycle.finished) throw new Error('Cannot recycle an active Buff');
    const callbacks = this.#state.recycleCallbackIds.map(id => {
      const callback = this.#recycleCallbacks.get(id);
      if (callback === undefined) throw new Error(`Buff recycle callback '${id}' is not bound`);
      return callback;
    });
    this.#recycling = true;
    this.#stackingGroup?.removeRecycled(this);
    this.#stackingGroup = null;
    try {
      for (const callback of callbacks) callback();
    } finally {
      this.#state.lifecycle.recycled = true;
      this.#recycling = false;
      this.#recycleCallbacks.clear();
      this.#state.recycleCallbackIds.length = 0;
    }
  }

  get finishReason(): BuffFinishReason | null {
    return this.#state.lifecycle.finishReason;
  }

  get isFinishable(): boolean {
    return this.#state.lifecycle.finishable;
  }

  get isTimePaused(): boolean {
    return this.#state.lifecycle.timePaused;
  }

  get enhanceCount(): number {
    return this.#state.lifecycle.enhanceCount;
  }

  applyKeywordEnhancements(onAddedBuffId: string): boolean {
    let changed = false;
    for (const enhancement of this.definition.keywordEnhancements ?? []) {
      if (!enhancement.triggerBuffIds.includes(onAddedBuffId)) continue;
      const operand = resolveOptionalBuffNumber(
        this.definition.id,
        'keyword enhancement value',
        enhancement.value,
        this.blackboard,
      );
      if (operand === null) {
        throw new Error(`buff '${this.definition.id}' keyword enhancement value is missing`);
      }
      const current = this.blackboard.getNumber(enhancement.targetKey);
      if (current === undefined) {
        throw new Error(
          `buff '${this.definition.id}' keyword target '${enhancement.targetKey}' is missing or not numeric`,
        );
      }
      const next =
        enhancement.operation === 'assign'
          ? operand
          : enhancement.operation === 'add'
            ? current + operand
            : current * operand;
      this.blackboard.assignDynamic(enhancement.targetKey, next);
      changed = true;
    }
    if (changed) this.refreshAttributeModifierValues();
    return changed;
  }

  get attributeModifiers(): readonly CombatAttributeModifier<Key>[] {
    return this.#state.attributes.modifiers;
  }

  /** 按原生 Buff.ContainsTag 语义查询定义携带的 applyTags。 */
  containsTag(tag: GameplayTag, exact = false): boolean {
    return (this.definition.applyTags ?? []).some(candidate =>
      this.owner.tagRegistry.matches(candidate, tag, exact),
    );
  }

  enable(): void {
    if (this.#state.lifecycle.finished || this.#state.lifecycle.enabled) return;
    this.#state.lifecycle.enabled = true;
    if (!this.#state.lifecycle.started) {
      this.#state.lifecycle.started = true;
      this.definition.actions?.start?.(this);
      this.triggerInternal(0);
    }

    try {
      this.assertAttributeModifierTargetsSupported();
      this.owner.registerDamageModifiers(this.damageModifiers);
      this.owner.registerHealModifiers(this.healModifiers);
      this.owner.registerPoiseModifiers(this.poiseModifiers);
      this.owner.registerShields(this.shields);
      this.owner.registerSustainedProtection(this);
      this.addApplyTags();
      for (const modifier of this.attributeModifiers) {
        this.owner.attributes.addModifier(modifier);
      }
      this.registerSharedSpGainModifiers();
    } catch (error) {
      this.unregisterSharedSpGainModifiers();
      this.removeAttributeModifiers();
      this.owner.unregisterDamageModifiers(this.damageModifiers);
      this.owner.unregisterHealModifiers(this.healModifiers);
      this.owner.unregisterPoiseModifiers(this.poiseModifiers);
      this.owner.unregisterShields(this.shields);
      this.owner.unregisterSustainedProtection(this);
      this.removeApplyTags();
      this.#state.lifecycle.enabled = false;
      throw error;
    }
    this.definition.actions?.enable?.(this);
    this.#duringEnableAction?.tryExecute(this);
  }

  disable(): void {
    if (!this.#state.lifecycle.enabled) return;
    this.definition.actions?.disable?.(this);
    this.endDuringEnableAction();
    this.owner.unregisterDamageModifiers(this.damageModifiers);
    this.owner.unregisterHealModifiers(this.healModifiers);
    this.owner.unregisterPoiseModifiers(this.poiseModifiers);
    this.owner.unregisterShields(this.shields);
    this.owner.unregisterSustainedProtection(this);
    this.removeApplyTags();
    this.removeAttributeModifiers();
    this.unregisterSharedSpGainModifiers();
    this.#state.lifecycle.enabled = false;
  }

  /** 宿主释放与 MarkFinish 不同：不受 finishable 限制，不伪造结束原因/减层通知。 */
  release(): boolean {
    if (this.#state.lifecycle.released) return false;
    this.#state.lifecycle.released = true;
    this.owner.unregisterDamageModifiers(this.damageModifiers);
    this.owner.unregisterHealModifiers(this.healModifiers);
    this.owner.unregisterPoiseModifiers(this.poiseModifiers);
    this.owner.unregisterShields(this.shields);
    this.owner.unregisterSustainedProtection(this);
    this.removeApplyTags();
    this.removeAttributeModifiers();
    this.unregisterSharedSpGainModifiers();
    this.removeExtendTags();
    if (!this.#state.lifecycle.finished) this.endDuringEnableAction();
    this.definition.actions?.release?.(this);
    this.#state.lifecycle.enabled = false;
    // 现有 isFinished 是目录/执行器的终止门禁；finishReason 不因此改变。
    this.#state.lifecycle.finished = true;
    this.#state.children.members.clear();
    this.#clearChildBindings();
    this.owner.onBuffReleased?.(this);
    this.#notifyFinishedCallbacks();
    return true;
  }

  /** 未迁移调用者保持未知来源；已核实无来源的动作显式传 null。 */
  finish(
    reason: BuffFinishReason = 'other',
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): boolean {
    const finished = finishBuffLifecycle(this.#state.lifecycle, reason, {
      addExtendTags: () => this.addExtendTags(),
      finishAction: () => this.definition.actions?.finish?.(this),
      endDuringEnable: () => this.endDuringEnableAction(),
      finishChildren: () => {
        finishBuffChildren(this.#state.children, reference => {
          const binding = this.#childBindings.get(buffReferenceKey(reference));
          if (binding === undefined) throw new Error('attached child Buff binding is missing');
          binding.child.finish('other', null);
        });
        this.#clearChildBindings();
      },
      removeExtendTags: () => this.removeExtendTags(),
      refreshStacking: () => this.#stackingGroup?.refreshAfterFinish(),
      unregisterModifiers: () => {
        this.owner.unregisterDamageModifiers(this.damageModifiers);
        this.owner.unregisterHealModifiers(this.healModifiers);
        this.owner.unregisterPoiseModifiers(this.poiseModifiers);
        this.owner.unregisterShields(this.shields);
        this.owner.unregisterSustainedProtection(this);
        this.removeApplyTags();
        this.removeAttributeModifiers();
        this.unregisterSharedSpGainModifiers();
      },
      notifyFinished: () => this.owner.handleBuffFinished(this, reason, finishSkillCastInfo),
    });
    if (finished) this.#notifyFinishedCallbacks();
    return finished;
  }

  tick(deltaTime: number | BuffTickDeltas): void {
    if (this.#state.lifecycle.finished) return;
    const resolvedDeltaTime =
      typeof deltaTime === 'number'
        ? deltaTime
        : resolveBuffTickDelta(this.definition.timeClock ?? 'default', deltaTime);
    tickBuffLifecycle(this.#state.lifecycle, resolvedDeltaTime, {
      trigger: elapsed => this.triggerInternal(elapsed),
      tickDuringEnable: elapsed => this.#duringEnableAction?.tick(elapsed, this),
      canTimedGrow: () => this.#stackingGroup?.canTimedGrow(this) === true,
      growTimed: () => this.#stackingGroup?.growTimed(this) === true,
      finishLifetime: () => {
        this.finish('lifetime', null);
      },
    });
  }

  /** 由定义的恢复接线调用，连接实例私有的持续动作。 */
  bindRestoredDuringEnableAction(): void {
    if (this.#duringEnableAction === null) return;
    const bind = this.#duringEnableAction.bindRestored;
    if (bind === undefined) {
      throw new Error(`restored Buff '${this.definition.id}' cannot bind during-enable action`);
    }
    bind.call(this.#duringEnableAction, this);
  }

  /** PauseBuffTime 只冻结当前 Buff 的生命周期、周期触发与挂载时间轴。 */
  setTimePaused(paused: boolean): void {
    this.#state.lifecycle.timePaused = paused;
  }

  /** 恢复可结束时，原生仅在剩余时长已经小于 0 的情况下补发到期结束。 */
  setFinishable(finishable: boolean): void {
    this.#state.lifecycle.finishable = finishable;
    if (
      finishable &&
      this.#state.lifecycle.remainingDuration !== null &&
      this.#state.lifecycle.remainingDuration < 0
    ) {
      this.finish('lifetime', null);
    }
  }

  attachStackingGroup(group: BuffStackingGroup<Key>): void {
    this.#stackingGroup = group;
  }

  refreshDuration(incomingDuration: number | null): void {
    refreshBuffDuration(this.#state.lifecycle, incomingDuration);
  }

  extendDuration(incomingDuration: number | null): void {
    extendBuffDuration(this.#state.lifecycle, incomingDuration);
  }

  overwriteDuration(incomingDuration: number | null): void {
    this.#state.lifecycle.remainingDuration = incomingDuration;
  }

  /** 原生 RawSetLifeTime：仅有限时长定义接受直接剩余时间写入。 */
  rawSetRemainingDuration(duration: number): void {
    setFiniteBuffDuration(this.#state.lifecycle, duration);
  }

  executeBeforeEnhance(sourceId: string): void {
    this.definition.actions?.beforeEnhance?.(this, sourceId);
  }

  enhance(
    sourceId: string,
    source?: Pick<CombatBuffAddOptions, 'producedBy' | 'skillCastInfo'>,
  ): void {
    const previousLayers = this.enhanceCount;
    enhanceBuffLifecycle(this.#state.lifecycle, {
      changed: () => {
        this.owner.onBuffStackChanged?.(
          this,
          previousLayers,
          sourceId,
          source?.skillCastInfo,
          source?.producedBy,
        );
        this.definition.actions?.enhanceChanged?.(this, sourceId);
      },
      refreshAttributes: () => this.replaceAttributeModifiers(this.createAttributeModifiers()),
    });
  }

  resetTimedGrowthPeriod(): void {
    if (this.#state.lifecycle.timedGrowthPeriod !== null)
      this.#state.lifecycle.timedGrowthRemaining = this.#state.lifecycle.timedGrowthPeriod;
  }

  /** 原生 DecreaseEnhanceCnt：增强型 Buff 扣层，扣尽时结束整个实例。 */
  decreaseEnhanceCount(
    count: number,
    reason: BuffFinishReason,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): boolean {
    const previousLayers = this.enhanceCount;
    return decreaseBuffEnhancements(this.#state.lifecycle, count, {
      finish: () => this.finish(reason, finishSkillCastInfo),
      changed: () => {
        this.owner.onBuffStackChanged?.(this, previousLayers, undefined, finishSkillCastInfo);
        this.definition.actions?.enhanceChanged?.(this, this.sourceId);
      },
      refreshAttributes: () => this.replaceAttributeModifiers(this.createAttributeModifiers()),
      refreshStacking: () => this.#stackingGroup?.refreshAfterEnhanceDecrease(),
      notify: () => this.owner.handleBuffEnhanced(this, -count, reason, finishSkillCastInfo),
    });
  }

  executeAfterEnhance(sourceId: string, skillCastInfo?: CombatSkillCastInfo | null): void {
    this.definition.actions?.afterEnhance?.(this, sourceId);
    // _OnAfterTryEnhanced：通知一次增强尝试，满层仍发布；定时自然增长不经过这里。
    this.owner.handleBuffEnhanced(this, 1, 'lifetime', skillCastInfo);
  }

  /** 原生 Modify 只合并输入黑板，并据旧定义重建已注册的属性修正。 */
  modify(options?: CombatBuffAddOptions): void {
    const previousBlackboard = this.blackboard.snapshot();
    this.blackboard.assign(options?.blackboardValues);
    try {
      this.replaceAttributeModifiers(this.createAttributeModifiers());
    } catch (error) {
      this.blackboard.restore(previousBlackboard);
      throw error;
    }
  }

  /** 按当前实例黑板重新解析属性修正；供原生刷新修正值动作调用。 */
  refreshAttributeModifierValues(): void {
    this.replaceAttributeModifiers(this.createAttributeModifiers());
  }

  private triggerInternal(deltaTime: number): void {
    advanceBuffTriggers(this.#state.trigger, deltaTime, {
      isEnabled: () => this.#state.lifecycle.enabled,
      trigger: () => this.definition.actions?.trigger?.(this),
    });
  }

  private removeAttributeModifiers(): void {
    removeBuffAttributeModifiers(this.#state.attributes, this.owner.attributes);
  }

  private registerSharedSpGainModifiers(): void {
    const registry = this.owner.sharedSpGainModifiers;
    if (registry === null) return;
    for (const modifier of this.#state.sharedSpGainModifiers) registry.add(modifier);
  }

  private unregisterSharedSpGainModifiers(): void {
    const registry = this.owner.sharedSpGainModifiers;
    if (registry === null) return;
    for (const modifier of this.#state.sharedSpGainModifiers) registry.remove(modifier);
  }

  private endDuringEnableAction(): void {
    if (this.#duringEnableAction === null) return;
    this.#duringEnableAction.end(this);
    this.#duringEnableAction.reset(this);
  }

  private createAttributeModifiers(): readonly CombatAttributeModifier<Key>[] {
    return (this.definition.attributeModifiers ?? []).flatMap(modifier => {
      const attributes =
        typeof modifier.attribute === 'string'
          ? [modifier.attribute]
          : (this.owner.resolveAttributeSelector?.(modifier.attribute) ??
            (() => {
              throw new Error(
                `buff '${this.definition.id}' cannot resolve attribute selector '${modifier.attribute.kind}'`,
              );
            })());
      return attributes.flatMap(attribute =>
        Array.from({ length: this.#state.lifecycle.enhanceCount }, () => {
          const values = resolveBuffAttributeModifierValues(
            this.definition.id,
            modifier.values,
            this.blackboard,
          );
          return createCombatAttributeModifier(
            attribute,
            values,
            modifier.source ?? ATTRIBUTE_MODIFIER_SOURCES.buff,
            modifier.timing,
          );
        }),
      );
    });
  }

  private assertAttributeModifierTargetsSupported(): void {
    for (const modifier of this.definition.attributeModifiers ?? []) {
      if (modifier.target === 'buffSource' && this.sourceId !== this.owner.ownerId) {
        throw new Error(
          `buff '${this.definition.id}' targets distinct buff source '${this.sourceId}' for attribute modifier`,
        );
      }
    }
  }

  private replaceAttributeModifiers(replacements: readonly CombatAttributeModifier<Key>[]): void {
    replaceBuffAttributeModifiers(
      this.#state.attributes,
      this.#state.lifecycle.enabled,
      replacements,
      this.owner.attributes,
    );
  }

  private addExtendTags(): void {
    if (this.#state.lifecycle.appliedExtendTags) return;
    this.owner.addEntityTags(this.definition.extendTags ?? []);
    this.#state.lifecycle.appliedExtendTags = true;
  }

  private addApplyTags(): void {
    if (this.#state.lifecycle.appliedTags) return;
    this.owner.addEntityTags(this.definition.applyTags ?? []);
    this.#state.lifecycle.appliedTags = true;
  }

  private removeApplyTags(): void {
    if (!this.#state.lifecycle.appliedTags) return;
    this.owner.removeEntityTags(this.definition.applyTags ?? []);
    this.#state.lifecycle.appliedTags = false;
  }

  private removeExtendTags(): void {
    if (!this.#state.lifecycle.appliedExtendTags) return;
    this.owner.removeEntityTags(this.definition.extendTags ?? []);
    this.#state.lifecycle.appliedExtendTags = false;
  }
}

export class CombatShield<Key extends string> {
  static readonly epsilon = SHIELD_EPSILON;
  /** 供 Buff 实例统一持有的数据；宿主绑定本身不进入切面。 */
  readonly runtimeState: BuffShieldState;

  constructor(
    readonly buff: CombatBuff<Key>,
    readonly definition: BuffShieldDefinition,
    restored?: BuffShieldState,
  ) {
    // 护盾参数在创建时已经结算，恢复不能按当前属性重新计算或补满余额。
    if (restored !== undefined) {
      this.runtimeState = restored;
      return;
    }
    const value =
      typeof definition.value === 'object' && 'attribute' in definition.value
        ? resolveShieldAttributeValue(buff, definition.value)
        : resolveBuffNumber(buff, definition.value, 'shield value');
    const maxValue = Math.max(0, value);
    const maxAbsorbCount = resolveBuffInteger(buff, definition.absorbCount, 'shield absorb count');
    this.runtimeState = {
      maxValue,
      maxAbsorbCount,
      remainingValue: maxValue,
      remainingAbsorbCount: maxAbsorbCount,
      consumed: false,
      absorptions: new Map(),
    };
    for (const absorption of definition.damageAbsorptions) {
      this.runtimeState.absorptions.set(absorption.damageType, [
        resolveBuffNumber(buff, absorption.ratio, 'shield absorption ratio'),
        resolveBuffNumber(buff, absorption.scale, 'shield absorption scale'),
      ]);
    }
    refreshShieldConsumed(this.runtimeState, this.infiniteValue);
  }

  get maxValue(): number {
    return this.runtimeState.maxValue;
  }
  get maxAbsorbCount(): number {
    return this.runtimeState.maxAbsorbCount;
  }
  get remainingValue(): number {
    return this.runtimeState.remainingValue;
  }
  set remainingValue(value: number) {
    this.runtimeState.remainingValue = value;
  }
  get remainingAbsorbCount(): number {
    return this.runtimeState.remainingAbsorbCount;
  }
  set remainingAbsorbCount(value: number) {
    this.runtimeState.remainingAbsorbCount = value;
  }
  get consumed(): boolean {
    return this.runtimeState.consumed;
  }
  set consumed(value: boolean) {
    this.runtimeState.consumed = value;
  }
  get infiniteValue(): boolean {
    return this.definition.infinityValue;
  }
  get infiniteAbsorbCount(): boolean {
    return this.maxAbsorbCount < 0;
  }

  absorb(damageType: DamageType, inputValue: number): number {
    return absorbShieldDamage(this.runtimeState, this.definition, damageType, inputValue, () => {
      this.buff.finish('other', null);
    });
  }
}

/** 按实体隔离的 Buff 存储与活动伤害修正注册表。 */
export class CombatBuffContainer<Key extends string> {
  readonly #memberBindings = new Map<number, CombatBuff<Key>>();

  #requireMember(id: number): CombatBuff<Key> {
    const buff = this.#memberBindings.get(id);
    if (buff === undefined) throw new Error(`Buff member binding '${id}' is missing`);
    return buff;
  }

  #snapshotBuffs(): CombatBuff<Key>[] {
    return this.#state.memberIds.map(id => this.#requireMember(id));
  }

  *#iterateBuffs(): IterableIterator<CombatBuff<Key>> {
    for (const id of this.#state.memberIds) yield this.#requireMember(id);
  }
  readonly #state: BuffContainerState<Key>;
  /** 供战斗根状态装配；尚不包含活动动作绑定，不能据此单独恢复容器。 */
  get runtimeState(): BuffContainerState<Key> {
    return this.#state;
  }
  readonly #damageBindings = new WeakMap<DamageModifierState, DamageModifier>();
  readonly #stackingGroups = new Map<string, BuffStackingGroup<Key>>();
  readonly #shieldBindings = new WeakMap<BuffShieldState, CombatShield<Key>>();

  #requireShield(state: BuffShieldState): CombatShield<Key> {
    const shield = this.#shieldBindings.get(state);
    if (shield === undefined) throw new Error('active shield binding is missing');
    return shield;
  }
  #onBuffConsumed?: (
    buff: CombatBuff<Key>,
    sourceId: string,
    layers: number,
    skillCastInfo?: CombatSkillCastInfo | null,
  ) => void;
  #onBuffAbsorbed?: (
    buff: CombatBuff<Key>,
    sourceId: string,
    layers: number,
    skillCastInfo?: CombatSkillCastInfo | null,
  ) => void;

  constructor(
    readonly ownerId: string,
    readonly attributes: CombatAttributeSet<Key>,
    readonly tagRegistry = new GameplayTagRegistry([]),
    /** 一次战斗唯一的共享 SP 修正注册表；仅使用相应 Buff 的容器需要提供。 */
    readonly sharedSpGainModifiers: SharedSpGainModifierSet | null = null,
    /** 该实体的技能与 Buff 共同回退读写的持久运行时黑板。 */
    readonly entityBlackboard = new ActionBlackboard(),
    /** Buff 结束（到期、消费、驱散等）时通知，供回执记录结束事实。 */
    readonly onBuffFinished?: (
      buff: CombatBuff<Key>,
      reason: BuffFinishReason,
      skillCastInfo?: CombatSkillCastInfo | null,
    ) => void,
    /** owner 侧原生209：外部增强尝试为+1（包括满层），减层/结束为实际负层数。 */
    readonly onBuffEnhanceChanged?: (
      buff: CombatBuff<Key>,
      layerCount: number,
      reason?: BuffFinishReason,
      finishSkillCastInfo?: CombatSkillCastInfo | null,
    ) => void,
    /** Main/Sub/All 只能由拥有角色面板身份的实体容器延迟解析。 */
    readonly resolveAttributeSelector?: (selector: {
      readonly kind: 'main' | 'secondary' | 'all';
    }) => readonly Key[],
    /** AbilitySystem.AddShield 完成后的同步事件；值分别为实际新增量与当前有限护盾总量。 */
    readonly onShieldsAdded?: (gainedValue: number, currentValue: number) => void,
    readonly collectOutputBlackboard?: (
      definition: CombatBuffDefinition<Key>,
      sourceId: string,
      blackboard: ActionBlackboard,
    ) => void,
    readonly onBuffReleased?: (buff: CombatBuff<Key>) => void,
    restoredState?: BuffContainerState<Key>,
    readonly onBuffCreated?: (
      buff: CombatBuff<Key>,
      producedBy?: import('../receipt/combatReceipt').CombatObjectRef,
    ) => void,
    /** 只读观察：实际层数已更新，但尚未执行增强回调；不改变原生事件。 */
    readonly onBuffStackChanged?: (
      buff: CombatBuff<Key>,
      previousLayers: number,
      sourceId?: string,
      skillCastInfo?: CombatSkillCastInfo | null,
      producedBy?: import('../receipt/combatReceipt').CombatObjectRef,
    ) => void,
  ) {
    if (restoredState === undefined) {
      this.#state = createBuffContainerState(
        attributes.runtimeState,
        entityBlackboard.runtimeState,
        sharedSpGainModifiers?.runtimeState ?? null,
      );
      return;
    }
    if (restoredState.attributes !== attributes.runtimeState)
      throw new Error(`restored Buff container '${ownerId}' does not share its attribute state`);
    if (restoredState.entityBlackboard !== entityBlackboard.runtimeState)
      throw new Error(`restored Buff container '${ownerId}' does not share its entity blackboard`);
    if (restoredState.sharedSpGainModifiers !== (sharedSpGainModifiers?.runtimeState ?? null))
      throw new Error(`restored Buff container '${ownerId}' does not share its SP modifier state`);
    if (restoredState.releasing)
      throw new Error(`cannot bind Buff container '${ownerId}' during synchronous release`);
    this.#state = restoredState;
  }

  /**
   * 为复制后的容器数据建立实例、叠层、修正器和护盾对象，不执行 Add、Start 或 Enable。
   * 生命周期动作和跨容器子 Buff 关系由上层在所有容器实例建立后继续绑定。
   */
  bindRestoredInstances(
    resolveDefinition: (state: BuffInstanceState<Key>) => CombatBuffDefinition<Key> | undefined,
    resolveOptions?: (state: BuffInstanceState<Key>) => CombatBuffAddOptions | undefined,
  ): void {
    if (this.#memberBindings.size !== 0 || this.#stackingGroups.size !== 0) {
      throw new Error(`restored Buff container '${this.ownerId}' is already bound`);
    }
    if (new Set(this.#state.memberIds).size !== this.#state.memberIds.length) {
      throw new Error(`restored Buff container '${this.ownerId}' has duplicate member ids`);
    }
    for (const instanceId of this.#state.memberIds) {
      const state = this.#state.instances.get(instanceId);
      if (state === undefined)
        throw new Error(`restored Buff instance '${this.ownerId}:${instanceId}' is missing`);
      const definition = resolveDefinition(state);
      if (definition === undefined)
        throw new Error(`restored Buff definition '${state.identity.definitionId}' is missing`);
      const buff = new CombatBuff(
        definition,
        this,
        state.identity.sourceId,
        instanceId,
        resolveOptions?.(state),
        state,
      );
      if (state.actionHost !== null) {
        if (definition.bindRestoredActions === undefined) {
          throw new Error(
            `restored Buff '${state.identity.definitionId}' requires lifecycle action binding`,
          );
        }
        definition.bindRestoredActions(buff);
      } else if (definition.actions?.duringEnable !== undefined) {
        throw new Error(
          `restored Buff '${state.identity.definitionId}' has unbound during-enable actions`,
        );
      }
      this.#memberBindings.set(instanceId, buff);
      for (const modifier of buff.damageModifiers)
        this.#damageBindings.set(modifier.runtimeState, modifier);
      for (const shield of buff.shields) this.#shieldBindings.set(shield.runtimeState, shield);
    }
    for (const [key, state] of this.#state.stackingGroups) {
      if (state.members.length === 0) continue;
      const first = this.#requireMember(state.members[0]!);
      const group = new BuffStackingGroup(this, key, first.definition.stackingType, state);
      for (const instanceId of state.members) {
        const buff = this.#requireMember(instanceId);
        const stackingKey = buff.definition.stackingKey ?? buff.definition.id;
        if (stackingKey !== key || buff.definition.stackingType !== first.definition.stackingType) {
          throw new Error(`restored Buff stacking group '${key}' has incompatible members`);
        }
        group.bindRestored(buff);
      }
      this.#stackingGroups.set(key, group);
    }
    for (const state of this.#state.damageModifiers) {
      if (this.#damageBindings.get(state) === undefined)
        throw new Error('restored active damage modifier has no Buff binding');
    }
    for (const state of this.#state.activeShields) {
      if (this.#shieldBindings.get(state) === undefined)
        throw new Error('restored active shield has no Buff binding');
    }
  }

  /** 所有目标容器完成实例绑定后，再解析可能跨目标的父子关系。 */
  bindRestoredRelations(
    resolveHandle: (
      reference: import('../state/foundationState').BuffReference,
    ) => BuffApplicationHandle | undefined,
  ): void {
    for (const buff of this.#snapshotBuffs()) {
      for (const reference of buff.runtimeState.children.members.values()) {
        const child = resolveHandle(reference);
        if (child === undefined) {
          throw new Error(
            `restored child Buff '${buffReferenceKey(reference)}' has no runtime binding`,
          );
        }
        buff.bindRestoredChild(child);
      }
      buff.definition.bindRestoredRelations?.(buff);
    }
  }

  /** Buff 结束成功时由实例调用；调用方不应在回调里修改容器。 */
  handleBuffFinished(
    buff: CombatBuff<Key>,
    reason: BuffFinishReason,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): void {
    this.onBuffFinished?.(buff, reason, finishSkillCastInfo);
    if (isEnhanceChangedStackingType(buff.definition.stackingType)) {
      this.onBuffEnhanceChanged?.(buff, -buff.enhanceCount, reason, finishSkillCastInfo);
    }
  }

  handleBuffEnhanced(
    buff: CombatBuff<Key>,
    layerCount: number,
    reason?: BuffFinishReason,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): void {
    this.onBuffEnhanceChanged?.(buff, layerCount, reason, finishSkillCastInfo);
  }

  configureConsumedObserver(
    observer: (
      buff: CombatBuff<Key>,
      sourceId: string,
      layers: number,
      skillCastInfo?: CombatSkillCastInfo | null,
    ) => void,
  ): void {
    if (this.#onBuffConsumed !== undefined) {
      throw new Error(`Buff container '${this.ownerId}' consumed observer is already configured`);
    }
    this.#onBuffConsumed = observer;
  }

  configureAbsorbedObserver(
    observer: (
      buff: CombatBuff<Key>,
      sourceId: string,
      layers: number,
      skillCastInfo?: CombatSkillCastInfo | null,
    ) => void,
  ): void {
    if (this.#onBuffAbsorbed !== undefined) {
      throw new Error(`Buff container '${this.ownerId}' absorbed observer is already configured`);
    }
    this.#onBuffAbsorbed = observer;
  }

  get buffs(): readonly CombatBuff<Key>[] {
    return this.#snapshotBuffs();
  }

  /** 按容器内实例编号解析绑定；已回收返回 undefined，数据仍在但绑定缺失则报错。 */
  getInstance(instanceId: number): CombatBuff<Key> | undefined {
    const binding = this.#memberBindings.get(instanceId);
    if (binding === undefined && this.#state.instances.has(instanceId))
      throw new Error(`Buff instance ${instanceId} has no runtime binding`);
    return binding;
  }

  resolveHandle(
    reference: import('../state/foundationState').BuffReference,
  ): BuffApplicationHandle | undefined {
    if (reference.ownerId !== this.ownerId) {
      throw new Error(
        `Buff reference owner '${reference.ownerId}' does not match '${this.ownerId}'`,
      );
    }
    if (resolveBuffReferenceState(this.#state, reference) === undefined) return undefined;
    return this.getInstance(reference.instanceId);
  }

  get shields(): readonly CombatShield<Key>[] {
    return this.#state.activeShields.map(state => this.#requireShield(state));
  }

  get superArmor(): number {
    return Math.max(0, ...[...this.#state.sustainedProtections.values()].map(value => value[0]));
  }

  get impactResistance(): number {
    return Math.max(0, ...[...this.#state.sustainedProtections.values()].map(value => value[1]));
  }

  /** 添加成功时返回实例；原生叠加策略拒绝本次施加时返回 null。 */
  add(
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
    afterPublished?: (buff: CombatBuff<Key>) => void,
  ): CombatBuff<Key> | null {
    if (definition.addingCooldownSeconds !== undefined) {
      const active = this.#state.addingCooldowns.get(definition.id) ?? [];
      if (!definition.ignoreAddingCooldown && active.some(value => value > BUFF_LIFETIME_EPSILON)) {
        return null;
      }
      const blackboard = new ActionBlackboard(definition.blackboard, this.entityBlackboard);
      blackboard.assign(options?.blackboardValues);
      const duration =
        typeof definition.addingCooldownSeconds === 'number'
          ? definition.addingCooldownSeconds
          : blackboard.getNumber(definition.addingCooldownSeconds.blackboardKey);
      if (duration === undefined || !Number.isFinite(duration)) {
        throw new Error(`buff '${definition.id}' adding cooldown must resolve to a finite number`);
      }
      if (duration > BUFF_LIFETIME_EPSILON) {
        active.push(duration);
        this.#state.addingCooldowns.set(definition.id, active);
      }
    }
    const stackingKey = definition.stackingKey ?? definition.id;
    let group = this.#stackingGroups.get(stackingKey);
    if (group === undefined) {
      group = new BuffStackingGroup(this, stackingKey, definition.stackingType);
      this.#stackingGroups.set(stackingKey, group);
      this.#state.stackingGroups.set(stackingKey, group.runtimeState);
    }
    const buff = group.stack(definition, sourceId, options);
    // 原生 BuffContainer.CreateBuff 在 StackBuff（含 Start/Enable）返回后才登记实例。
    // 因此启动动作查询容器时尚看不到自身；返回旧实例的刷新路径不能重复登记。
    if (buff !== null && !this.#state.memberIds.includes(buff.instanceId)) {
      this.#memberBindings.set(buff.instanceId, buff);
      this.#state.memberIds.push(buff.instanceId);
    }
    if (buff === null) return null;
    // 成功事件先于已有关键词增强；刷新旧实例也走成功尾部。
    afterPublished?.(buff);
    for (const active of this.#iterateBuffs()) {
      if (!active.isFinished) active.applyKeywordEnhancements(definition.id);
    }
    return buff;
  }

  allocateBuff(
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> {
    const buff = new CombatBuff(definition, this, sourceId, this.#state.nextInstanceId++, options);
    this.#state.instances.set(buff.instanceId, buff.runtimeState);
    this.onBuffCreated?.(buff, options?.producedBy);
    return buff;
  }

  getCountById(id: string): number {
    return this.#snapshotBuffs()
      .filter(buff => !buff.isFinished && buff.definition.id === id)
      .reduce((count, buff) => count + buff.enhanceCount, 0);
  }

  /** 统计所有未结束且 ID 命中任一候选项的 Buff 层数。 */
  getCountByIds(ids: readonly string[], skillCastId?: number): number {
    const accepted = new Set(ids);
    return this.#snapshotBuffs()
      .filter(
        buff =>
          !buff.isFinished &&
          accepted.has(buff.definition.id) &&
          (skillCastId === undefined || buff.skillCastInfo?.skillCastId === skillCastId),
      )
      .reduce((count, buff) => count + buff.enhanceCount, 0);
  }

  /** 显式实例数模式；原生 SaveBuffStackNumAdvanced 的 BuffCount 不使用此入口。 */
  getInstanceCountByIds(ids: readonly string[]): number {
    return ids.reduce(
      (total, id) =>
        total +
        this.#snapshotBuffs().filter(buff => !buff.isFinished && buff.definition.id === id).length,
      0,
    );
  }

  /** 按容器插入顺序返回首个未结束且 ID 命中任一候选项的 Buff。 */
  findFirstByIds(ids: readonly string[]): CombatBuff<Key> | undefined {
    const accepted = new Set(ids);
    return this.#snapshotBuffs().find(buff => !buff.isFinished && accepted.has(buff.definition.id));
  }

  /** 按容器插入顺序结束所有 ID 命中任一候选项的 Buff。 */
  finishByIds(
    ids: readonly string[],
    reason: BuffFinishReason,
    sourceId?: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): number {
    const accepted = new Set(ids);
    let count = 0;
    for (const buff of this.#iterateBuffs()) {
      if (!buff.isFinished && accepted.has(buff.definition.id)) {
        if (this.#finishWithSource(buff, reason, sourceId, finishSkillCastInfo)) {
          count += 1;
        }
      }
    }
    return count;
  }

  /** 按已解析实例结束，避免重新按 ID 查询而误消费另一实例。 */
  finishInstance(
    buff: CombatBuff<Key>,
    reason: BuffFinishReason,
    sourceId: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): boolean {
    if (
      buff.owner !== this ||
      this.#memberBindings.get(buff.instanceId) !== buff ||
      !this.#state.memberIds.includes(buff.instanceId)
    )
      throw new Error('Buff instance does not belong to this container');
    return this.#finishWithSource(buff, reason, sourceId, finishSkillCastInfo);
  }

  /** 原生 Ignite/Early 结束向 finishSource 发布消费；普通结束与吸收不冒充消费。 */
  #finishWithSource(
    buff: CombatBuff<Key>,
    reason: BuffFinishReason,
    sourceId?: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): boolean {
    const layers = buff.enhanceCount;
    if (!buff.finish(reason, finishSkillCastInfo)) return false;
    if (sourceId !== undefined) {
      if (reason === 'early' || reason === 'ignite')
        this.#onBuffConsumed?.(buff, sourceId, layers, finishSkillCastInfo);
      else if (reason === 'absorbed')
        this.#onBuffAbsorbed?.(buff, sourceId, layers, finishSkillCastInfo);
    }
    return true;
  }

  /** 按容器插入顺序结束最多 count 个 ID 匹配的 Buff 实例。 */
  finishCountByIds(
    ids: readonly string[],
    count: number,
    reason: BuffFinishReason,
    sourceId?: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): number {
    if (!Number.isFinite(count) || count < 0) {
      throw new RangeError('Buff finish count must be a finite non-negative number');
    }
    const accepted = new Set(ids);
    const firstMatch = this.#snapshotBuffs().find(
      buff => !buff.isFinished && accepted.has(buff.definition.id),
    );
    if (
      firstMatch !== undefined &&
      ['enhance', 'enhanceAndRefresh', 'enhanceAndOverwriteDuration'].includes(
        firstMatch.definition.stackingType,
      )
    ) {
      let changed = 0;
      for (const buff of this.#iterateBuffs()) {
        if (
          !buff.isFinished &&
          accepted.has(buff.definition.id) &&
          buff.decreaseEnhanceCount(count, reason, finishSkillCastInfo)
        ) {
          changed += 1;
        }
      }
      return changed;
    }
    let finished = 0;
    for (const buff of this.#iterateBuffs()) {
      if (finished >= count) break;
      if (!buff.isFinished && accepted.has(buff.definition.id)) {
        const layers = buff.enhanceCount;
        if (buff.finish(reason, finishSkillCastInfo)) {
          finished += 1;
          if (reason === 'absorbed' && sourceId !== undefined)
            this.#onBuffAbsorbed?.(buff, sourceId, layers, finishSkillCastInfo);
        }
      }
    }
    return finished;
  }

  /** 同步点燃所有在调用开始时仍活动的 Buff；响应可在处理过程中结束自身。 */
  ignite(igniteType: string, sourceId: string, skillCastInfo?: CombatSkillCastInfo): number {
    if (igniteType.length === 0) throw new Error('Buff ignite type must not be empty');
    if (sourceId.length === 0) throw new Error('Buff ignite source id must not be empty');
    const active = this.#snapshotBuffs().filter(buff => !buff.isFinished);
    let count = 0;
    for (const buff of active) {
      if (buff.isFinished) continue;
      if (buff.definition.actions?.ignite?.(buff, igniteType, sourceId, skillCastInfo)) {
        count += 1;
      }
    }
    return count;
  }

  /** 固定当前匹配实例并禁止其结束；释放不会影响保护开始后新增的同 ID Buff。 */
  holdByIds(ids: readonly string[]): {
    readonly references: readonly import('../state/foundationState').BuffReference[];
    release(): void;
  } {
    const accepted = new Set(ids);
    const held = this.#snapshotBuffs().filter(
      buff => !buff.isFinished && accepted.has(buff.definition.id),
    );
    for (const buff of held) buff.setFinishable(false);
    let released = false;
    return {
      references: held.map(buff => buff.reference),
      release: () => {
        if (released) return;
        released = true;
        this.releaseHeld(held.map(buff => buff.reference));
      },
    };
  }

  /** 按保存的实例身份释放动作期保护；不会误伤保护开始后新增的同 ID Buff。 */
  releaseHeld(references: readonly import('../state/foundationState').BuffReference[]): void {
    for (const reference of references) {
      if (reference.ownerId !== this.ownerId) {
        throw new Error(`Buff hold owner '${reference.ownerId}' does not match '${this.ownerId}'`);
      }
      const buff = this.getInstance(reference.instanceId);
      if (buff !== undefined && !buff.isFinished) buff.setFinishable(true);
    }
  }

  hasEntityTag(tag: GameplayTag): boolean {
    return (this.#state.entityTagCounts.get(tag) ?? 0) > 0;
  }

  addEntityTags(tags: readonly GameplayTag[]): void {
    addBuffEntityTags(this.#state, tags);
  }

  removeEntityTags(tags: readonly GameplayTag[]): void {
    removeBuffEntityTags(this.#state, tags);
  }

  /** 按原生父级展开规则查询当前实体标签，不把 Buff 分类标签另行计数。 */
  matchesEntityTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact = false,
  ): boolean {
    return this.tagRegistry.query(this.#state.entityTagCounts.keys(), tags, type, exact);
  }

  /** 对任意一组原生标签执行同一目录的父级展开查询，供事件载荷匹配使用。 */
  matchesTags(
    ownedTags: readonly GameplayTag[],
    requiredTags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact = false,
  ): boolean {
    return this.tagRegistry.query(ownedTags, requiredTags, type, exact);
  }

  /** 统计所有未结束且分类标签满足查询的 Buff 层数。 */
  getCountByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType = 'hasAny',
    exact = false,
    skillCastId?: number,
  ): number {
    return this.#snapshotBuffs()
      .filter(
        buff =>
          !buff.isFinished &&
          (skillCastId === undefined || buff.skillCastInfo?.skillCastId === skillCastId) &&
          this.tagRegistry.query(buff.definition.applyTags ?? [], tags, type, exact),
      )
      .reduce((count, buff) => count + buff.enhanceCount, 0);
  }

  /** 对应原生 BuffContainer.GetBuffIdCountByTag：统计匹配活动 Buff 的不同定义 ID。 */
  getDistinctIdCountByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType = 'hasAny',
    exact = false,
    skillCastId?: number,
  ): number {
    return new Set(
      this.#snapshotBuffs()
        .filter(
          buff =>
            !buff.isFinished &&
            (skillCastId === undefined || buff.skillCastInfo?.skillCastId === skillCastId) &&
            this.tagRegistry.query(buff.definition.applyTags ?? [], tags, type, exact),
        )
        .map(buff => buff.definition.id),
    ).size;
  }

  /** 统计所有未结束且分类标签满足查询的 Buff 实例数，不把 Enhance 层数计入结果。 */
  getInstanceCountByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType = 'hasAny',
    exact = false,
    skillCastId?: number,
  ): number {
    return this.#snapshotBuffs().filter(
      buff =>
        !buff.isFinished &&
        (skillCastId === undefined || buff.skillCastInfo?.skillCastId === skillCastId) &&
        this.tagRegistry.query(buff.definition.applyTags ?? [], tags, type, exact),
    ).length;
  }

  /** 按容器插入顺序返回首个未结束且分类标签满足查询的 Buff。 */
  findFirstByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType = 'hasAny',
    exact = false,
  ): CombatBuff<Key> | undefined {
    return this.#snapshotBuffs().find(
      buff =>
        !buff.isFinished &&
        this.tagRegistry.query(buff.definition.applyTags ?? [], tags, type, exact),
    );
  }

  /** 按容器插入顺序结束所有匹配标签查询的 Buff，并返回实际结束数量。 */
  finishByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    reason: BuffFinishReason,
    exact = false,
    sourceId?: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): number {
    let count = 0;
    for (const buff of this.#iterateBuffs()) {
      if (
        !buff.isFinished &&
        this.tagRegistry.query(buff.definition.applyTags ?? [], tags, type, exact) &&
        this.#finishWithSource(buff, reason, sourceId, finishSkillCastInfo)
      ) {
        count += 1;
      }
    }
    return count;
  }

  /** 原生 FinishBuffByTag 限层路径：先快照匹配实例 ID，再逐项复用 ID 扣层入口。 */
  finishCountByTags(
    tags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    count: number,
    reason: BuffFinishReason,
    exact = false,
    sourceId?: string,
    finishSkillCastInfo?: CombatSkillCastInfo | null,
  ): number {
    if (!Number.isFinite(count) || count < 0) {
      throw new RangeError('Buff finish count must be a finite non-negative number');
    }
    const matchingIds = this.#snapshotBuffs()
      .filter(
        buff =>
          !buff.isFinished &&
          this.tagRegistry.query(buff.definition.applyTags ?? [], tags, type, exact),
      )
      .map(buff => buff.definition.id);
    let changed = 0;
    for (const id of matchingIds)
      changed += this.finishCountByIds([id], count, reason, sourceId, finishSkillCastInfo);
    return changed;
  }

  findFirst(predicate: (buff: CombatBuff<Key>) => boolean): CombatBuff<Key> | undefined {
    let matched: CombatBuff<Key> | undefined;
    this.#state.memberIds.find(id => {
      const buff = this.#requireMember(id);
      if (buff.isFinished || !predicate(buff)) return false;
      matched = buff;
      return true;
    });
    return matched;
  }

  applyDamageModifiers(
    timing: DamageProcessTiming,
    side: DamageModifierSide,
    context: PlayerDamageContext,
    evaluateCondition?: DamageModifierConditionEvaluator,
  ): void {
    for (const state of this.#state.damageModifiers) {
      const modifier = this.#damageBindings.get(state);
      if (modifier === undefined) throw new Error('active damage modifier binding is missing');
      modifier.apply(timing, side, context, evaluateCondition, (side, result) => {
        if (result.kind === 'damageScale' && result.addition === 0) return;
        // 修正器与所属 Buff 已有对象关系，按身份查询，不另建来源目录。
        const buff = [...this.#memberBindings.values()].find(buff =>
          buff.damageModifiers.includes(modifier),
        );
        if (buff === undefined) return;
        context.appliedDamageModifiers.push({
          buff: buff.reference,
          buffId: buff.definition.id,
          sourceId: buff.sourceId,
          sourceActionId: buff.sourceActionId,
          side,
          ...result,
        });
      });
    }
  }

  /** 读取实际注册的直接属性修正，不重算 Buff 定义或保存来源链。 */
  captureAttributeModifierDetails(
    side: DamageModifierSide,
  ): import('../damage/damageScale').AppliedDamageModifier[] {
    const active = new Set(this.attributes.runtimeState.modifiers);
    const result: import('../damage/damageScale').AppliedDamageModifier[] = [];
    for (const buff of this.#memberBindings.values()) {
      for (const modifier of buff.attributeModifiers) {
        if (!active.has(modifier)) continue;
        for (const [slot, value] of Object.entries(modifier.values)) {
          const neutral = slot === 'finalMultiplier' || slot === 'baseFinalMultiplier' ? 1 : 0;
          if (value === neutral) continue;
          result.push({
            kind: 'attribute',
            buff: buff.reference,
            buffId: buff.definition.id,
            sourceId: buff.sourceId,
            sourceActionId: buff.sourceActionId,
            side,
            attribute: modifier.attribute,
            slot: slot as import('../attributes/combatAttributes').AttributeModifierSlot,
            value,
          });
        }
      }
    }
    return result;
  }

  applyHealModifiers(
    timing: HealProcessTiming,
    side: HealModifierSide,
    context: HealCalculationContext,
  ): void {
    for (const modifier of this.#state.healModifiers)
      applyHealModifier(
        modifier.ownerId,
        modifier.definition,
        value => resolveBuffModifierNumber(modifier.numberSource, value, 'heal'),
        timing,
        side,
        context,
      );
  }

  applyPoiseModifiers(
    timing: PoiseProcessTiming,
    side: PoiseModifierSide,
    context: PoiseCalculationContext,
  ): void {
    for (const modifier of this.#state.poiseModifiers)
      applyPoiseModifier(
        modifier.ownerId,
        modifier.definition,
        value => resolveBuffModifierNumber(modifier.numberSource, value, 'poise'),
        timing,
        side,
        context,
      );
  }

  tick(deltaTime: number | BuffTickDeltas): void {
    const defaultDelta =
      typeof deltaTime === 'number' ? deltaTime : resolveBuffTickDelta('default', deltaTime);
    advanceBuffAddingCooldowns(this.#state, defaultDelta);
    for (const buff of this.#iterateBuffs()) buff.tick(deltaTime);
  }

  /** 原生回收独立于 tick；逆序逐项检查当前结束状态。 */
  recycleFinishedBuffs(): void {
    for (let index = this.#state.memberIds.length - 1; index >= 0; index--) {
      const buff = this.#requireMember(this.#state.memberIds[index]!);
      if (!buff.isFinished) continue;
      this.#state.memberIds.splice(index, 1);
      buff.recycleFinished();
      this.#memberBindings.delete(buff.instanceId);
      this.#state.instances.delete(buff.instanceId);
    }
  }

  /** 宿主释放：逐实例Release后回收，不等待已停止的宿主再次tick。 */
  releaseAll(): void {
    if (this.#state.releasing) return;
    this.#state.releasing = true;
    try {
      for (const buff of [...this.#snapshotBuffs()]) {
        if (buff.isRecycled) continue;
        buff.release();
        const index = this.#state.memberIds.indexOf(buff.instanceId);
        if (index >= 0) this.#state.memberIds.splice(index, 1);
        buff.recycleFinished();
        this.#memberBindings.delete(buff.instanceId);
        this.#state.instances.delete(buff.instanceId);
      }
    } finally {
      this.#state.releasing = false;
    }
  }

  registerDamageModifiers(modifiers: readonly DamageModifier[]): void {
    for (const modifier of modifiers) {
      this.#damageBindings.set(modifier.runtimeState, modifier);
      this.#state.damageModifiers.push(modifier.runtimeState);
    }
  }

  unregisterDamageModifiers(modifiers: readonly DamageModifier[]): void {
    for (const modifier of modifiers) {
      const index = this.#state.damageModifiers.indexOf(modifier.runtimeState);
      if (index >= 0) this.#state.damageModifiers.splice(index, 1);
    }
  }

  registerHealModifiers(modifiers: readonly HealModifier[]): void {
    this.#state.healModifiers.push(...modifiers);
  }

  unregisterHealModifiers(modifiers: readonly HealModifier[]): void {
    for (const modifier of modifiers) {
      const index = this.#state.healModifiers.indexOf(modifier);
      if (index >= 0) this.#state.healModifiers.splice(index, 1);
    }
  }

  registerPoiseModifiers(modifiers: readonly PoiseModifier[]): void {
    this.#state.poiseModifiers.push(...modifiers);
  }

  unregisterPoiseModifiers(modifiers: readonly PoiseModifier[]): void {
    for (const modifier of modifiers) {
      const index = this.#state.poiseModifiers.indexOf(modifier);
      if (index >= 0) this.#state.poiseModifiers.splice(index, 1);
    }
  }

  registerShields(shields: readonly CombatShield<Key>[]): void {
    const beforeValue = this.currentFiniteShieldValue;
    for (const shield of shields) {
      this.#shieldBindings.set(shield.runtimeState, shield);
      this.#state.activeShields.push(shield.runtimeState);
    }
    this.#state.activeShields.sort((left, right) =>
      compareShields(this.#requireShield(left), this.#requireShield(right)),
    );
    if (shields.length > 0) {
      const currentValue = this.currentFiniteShieldValue;
      this.onShieldsAdded?.(currentValue - beforeValue, currentValue);
    }
  }

  get currentFiniteShieldValue(): number {
    return this.shields
      .filter(shield => !shield.infiniteValue)
      .reduce((total, shield) => total + shield.remainingValue, 0);
  }

  unregisterShields(shields: readonly CombatShield<Key>[]): void {
    for (const shield of shields) {
      const index = this.#state.activeShields.indexOf(shield.runtimeState);
      if (index >= 0) this.#state.activeShields.splice(index, 1);
    }
  }

  absorbDamage(damageType: DamageType, inputValue: number): number {
    let remaining = inputValue;
    for (const shield of [...this.shields].reverse()) {
      if (remaining <= 0) break;
      remaining = shield.absorb(damageType, remaining);
    }
    return remaining;
  }

  registerSustainedProtection(buff: CombatBuff<Key>): void {
    const definition = buff.definition.sustainedProtection;
    if (definition === undefined) return;
    if (definition.target === 'buffSource' && buff.sourceId !== this.ownerId) {
      throw new Error(
        `buff '${buff.definition.id}' targets a distinct buff source for sustained protection`,
      );
    }
    this.#state.sustainedProtections.set(buff.runtimeState, [
      resolveBuffNumber(buff, definition.superArmor, 'super armor'),
      resolveBuffNumber(buff, definition.impactResistance, 'impact resistance'),
    ]);
  }

  unregisterSustainedProtection(buff: CombatBuff<Key>): void {
    this.#state.sustainedProtections.delete(buff.runtimeState);
  }
}

function resolveBuffNumber<Key extends string>(
  buff: CombatBuff<Key>,
  value: BuffDuration,
  label: string,
): number {
  const resolved =
    typeof value === 'number' ? value : buff.blackboard.getNumber(value.blackboardKey);
  if (resolved === undefined || !Number.isFinite(resolved)) {
    throw new Error(`buff '${buff.definition.id}' ${label} must resolve to a finite number`);
  }
  return resolved;
}

function resolveShieldAttributeValue<Key extends string>(
  buff: CombatBuff<Key>,
  calculation: BuffShieldAttributeValue,
): number {
  const useSource = calculation.attributeSource === 'buffSource';
  if (useSource && buff.sourceId !== buff.owner.ownerId) {
    const resolve = buff.getSourceAttributeValue;
    if (resolve === null) {
      throw new Error(
        `buff '${buff.definition.id}' shield source attribute '${calculation.attribute}' is unavailable`,
      );
    }
    const value = resolve(calculation.attribute);
    const multiplier = resolveBuffNumber(buff, calculation.multiplier, 'shield multiplier');
    const addition = resolveBuffNumber(buff, calculation.addition, 'shield addition');
    return value * multiplier + addition;
  }
  if (!buff.owner.attributes.has(calculation.attribute)) {
    throw new Error(
      `buff '${buff.definition.id}' shield attribute '${calculation.attribute}' is missing`,
    );
  }
  const attributeValue = buff.owner.attributes.get(calculation.attribute as Key);
  const multiplier = resolveBuffNumber(buff, calculation.multiplier, 'shield multiplier');
  const addition = resolveBuffNumber(buff, calculation.addition, 'shield addition');
  return attributeValue * multiplier + addition;
}

function resolveBuffInteger<Key extends string>(
  buff: CombatBuff<Key>,
  value: BuffTriggerCount,
  label: string,
): number {
  const resolved = resolveBuffNumber(buff, value, label);
  if (!Number.isInteger(resolved)) {
    throw new Error(`buff '${buff.definition.id}' ${label} must resolve to an integer`);
  }
  return resolved;
}

function compareShields<Key extends string>(
  left: CombatShield<Key>,
  right: CombatShield<Key>,
): number {
  const priority =
    (left.definition.priority === 'prioritizeConsume' ? 1 : 0) -
    (right.definition.priority === 'prioritizeConsume' ? 1 : 0);
  if (priority !== 0) return priority;
  return (
    (left.buff.remainingDuration ?? Number.POSITIVE_INFINITY) -
    (right.buff.remainingDuration ?? Number.POSITIVE_INFINITY)
  );
}

function resolveBuffTickDelta(clock: BuffTimeClock, deltas: BuffTickDeltas): number {
  switch (clock) {
    case 'default':
      return deltas.globalDeltaSeconds;
    case 'global':
      return deltas.entityDeltaSeconds;
    case 'self':
      return deltas.globalAndSelfDeltaSeconds;
  }
}

/** 1.4.4 Buff.MarkFinish 中位图 0xD0C 对应的当前契约内精确事件集合。 */
function isEnhanceChangedStackingType(stackingType: BuffStackingType): boolean {
  return (
    stackingType === 'stack' ||
    stackingType === 'enhance' ||
    stackingType === 'enhanceAndRefresh' ||
    stackingType === 'enhanceAndOverwriteDuration' ||
    stackingType === 'highPriorityWithMaxStack' ||
    stackingType === 'timedGrowingEnhance'
  );
}

class BuffStackingGroup<Key extends string> {
  readonly #state: import('../state/instanceState').BuffStackingState;
  /** 容器持有同一份叠层数据，实例关系按编号保留。 */
  get runtimeState(): import('../state/instanceState').BuffStackingState {
    return this.#state;
  }
  // 迁移期间的对象绑定；完整恢复时须从恢复后的容器重建。
  readonly #bindings = new Map<number, CombatBuff<Key>>();
  #buff(id: number): CombatBuff<Key> {
    const buff = this.#bindings.get(id);
    if (buff === undefined) throw new Error(`stacking Buff ${id} is missing`);
    return buff;
  }
  #members(): CombatBuff<Key>[] {
    return this.#state.members.map(id => this.#buff(id));
  }
  #host(): BuffStackingHost {
    return {
      compare: (left, right) => compareBuffPriority(this.#buff(left), this.#buff(right)),
      isFinished: id => this.#buff(id).isFinished,
      enhanceCount: id => this.#buff(id).enhanceCount,
      resolve: id => {
        const buff = this.#buff(id);
        return {
          isFinished: () => buff.isFinished,
          enable: () => buff.enable(),
          disable: () => buff.disable(),
        };
      },
    };
  }

  constructor(
    readonly owner: CombatBuffContainer<Key>,
    readonly key: string,
    readonly stackingType: BuffStackingType,
    state = createBuffStackingState(),
  ) {
    this.#state = state;
  }

  bindRestored(buff: CombatBuff<Key>): void {
    if (!this.#state.members.includes(buff.instanceId))
      throw new Error(
        `restored stacking group '${this.key}' does not contain Buff ${buff.instanceId}`,
      );
    if (this.#bindings.has(buff.instanceId))
      throw new Error(`restored stacking Buff ${buff.instanceId} is already bound`);
    this.#bindings.set(buff.instanceId, buff);
    buff.attachStackingGroup(this);
  }

  stack(
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> | null {
    if (definition.stackingType !== this.stackingType) {
      throw new Error(
        `buff stacking key '${this.key}' changed type from '${this.stackingType}' to '${definition.stackingType}'`,
      );
    }
    const existing = this.#members().find(buff => !buff.isFinished);
    switch (this.stackingType) {
      case 'unlimited':
        return this.allocate(definition, sourceId, options);
      case 'highPriority':
        return this.allocatePrioritized(definition, sourceId, options);
      case 'highPriorityWithMaxStack':
        return this.allocatePrioritized(definition, sourceId, options);
      case 'stack':
        return this.stackInstances(definition, sourceId, options);
      case 'enhance':
        return this.enhance(existing, definition, sourceId, options);
      case 'refresh':
        return this.refresh(existing, definition, sourceId, options);
      case 'extend':
        return this.extend(existing, definition, sourceId, options);
      case 'modify':
        return this.modify(existing, definition, sourceId, options);
      case 'unique':
        return existing === undefined ? this.allocate(definition, sourceId, options) : null;
      case 'enhanceAndRefresh':
        return this.enhanceAndRefresh(existing, definition, sourceId, options);
      case 'overwriteDuration':
        return this.overwriteDuration(existing, definition, sourceId, options);
      case 'enhanceAndOverwriteDuration':
        return this.enhanceAndOverwriteDuration(existing, definition, sourceId, options);
      case 'timedGrowingEnhance':
        return this.timedGrowingEnhance(existing, definition, sourceId, options);
      default:
        throw new Error(`buff stacking type '${this.stackingType}' is not implemented`);
    }
  }

  removeRecycled(buff: CombatBuff<Key>): void {
    const index = this.#state.members.indexOf(buff.instanceId);
    if (index >= 0) this.#state.members.splice(index, 1);
    this.#bindings.delete(buff.instanceId);
  }

  refreshAfterFinish(): void {
    this.#state.currentStackCount = countBuffStackingInstances(this.#state, this.#host());
    if (this.stackingType === 'highPriority' || this.stackingType === 'highPriorityWithMaxStack') {
      this.refreshPriority();
    }
  }

  refreshAfterEnhanceDecrease(): void {
    this.#state.currentStackCount = countBuffStackingEnhancements(this.#state, this.#host());
  }

  private allocate(
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> {
    const buff = this.owner.allocateBuff(definition, sourceId, options);
    buff.attachStackingGroup(this);
    buff.enable();
    this.#bindings.set(buff.instanceId, buff);
    this.#state.members.push(buff.instanceId);
    return buff;
  }

  private stackInstances(
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> {
    const initialMaxStackCount =
      this.#state.currentStackCount === 0
        ? resolveIncomingMaxStackCount(definition, options)
        : undefined;

    const buff = this.owner.allocateBuff(definition, sourceId, options);
    buff.attachStackingGroup(this);
    if (initialMaxStackCount !== undefined) this.#state.maxStackCount = initialMaxStackCount;
    if (
      this.#state.maxStackCount > 0 &&
      this.#state.currentStackCount >= this.#state.maxStackCount
    ) {
      this.getLastUnfinishedBuff()?.finish('other', null);
    }

    this.#bindings.set(buff.instanceId, buff);
    this.#state.members.push(buff.instanceId);
    this.#state.currentStackCount = countBuffStackingInstances(this.#state, this.#host());
    buff.enable();
    return buff;
  }

  private allocatePrioritized(
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> {
    const initialMaxStackCount =
      this.stackingType === 'highPriorityWithMaxStack' && this.#state.currentStackCount === 0
        ? resolveIncomingMaxStackCount(definition, options)
        : undefined;
    const buff = this.owner.allocateBuff(definition, sourceId, options);
    buff.attachStackingGroup(this);
    if (initialMaxStackCount !== undefined) this.#state.maxStackCount = initialMaxStackCount;
    this.#bindings.set(buff.instanceId, buff);
    this.#state.members.push(buff.instanceId);
    this.#state.currentStackCount += 1;
    this.refreshPriority();
    return buff;
  }

  private refreshPriority(): void {
    const enabledLimit =
      this.stackingType === 'highPriority' ? 1 : Math.max(0, this.#state.maxStackCount);
    refreshBuffStackingPriority(this.#state, enabledLimit, this.#host());
  }

  private getLastUnfinishedBuff(): CombatBuff<Key> | undefined {
    const sorted = this.#members()
      .filter(buff => !buff.isFinished)
      .sort(compareBuffPriority);
    return sorted[sorted.length - 1];
  }

  private enhanceAndRefresh(
    existing: CombatBuff<Key> | undefined,
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> {
    if (existing === undefined) return this.allocateEnhanced(definition, sourceId, options);

    existing.executeBeforeEnhance(sourceId);
    this.enhanceWithinLimit(existing, sourceId, options);
    existing.refreshDuration(resolveIncomingDuration(definition, options));
    existing.executeAfterEnhance(sourceId, options?.skillCastInfo ?? null);
    return existing;
  }

  private enhanceAndOverwriteDuration(
    existing: CombatBuff<Key> | undefined,
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> {
    if (existing === undefined) return this.allocateEnhanced(definition, sourceId, options);

    const incomingDuration = resolveIncomingDuration(definition, options);
    existing.executeBeforeEnhance(sourceId);
    this.enhanceWithinLimit(existing, sourceId, options);
    existing.overwriteDuration(incomingDuration);
    existing.executeAfterEnhance(sourceId, options?.skillCastInfo ?? null);
    return existing;
  }

  private enhance(
    existing: CombatBuff<Key> | undefined,
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> {
    if (existing === undefined) return this.allocateEnhanced(definition, sourceId, options);

    existing.executeBeforeEnhance(sourceId);
    this.enhanceWithinLimit(existing, sourceId, options);
    existing.executeAfterEnhance(sourceId, options?.skillCastInfo ?? null);
    return existing;
  }

  private allocateEnhanced(
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> {
    const maxStackCount = resolveIncomingMaxStackCount(definition, options);
    const buff = this.allocate(definition, sourceId, options);
    this.#state.currentStackCount = 1;
    this.#state.maxStackCount = maxStackCount;
    // 原生首次增强类施加也执行 after；定时增长不属于该分支。
    if (this.stackingType !== 'timedGrowingEnhance') {
      buff.executeAfterEnhance(sourceId, options?.skillCastInfo ?? null);
    }
    return buff;
  }

  private enhanceWithinLimit(
    buff: CombatBuff<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): void {
    enhanceBuffStacking(this.#state, () => buff.enhance(sourceId, options));
  }

  canTimedGrow(buff: CombatBuff<Key>): boolean {
    return canGrowBuffStacking(
      this.#state,
      buff.instanceId,
      this.stackingType === 'timedGrowingEnhance',
      () => buff.isFinished,
    );
  }

  growTimed(buff: CombatBuff<Key>): boolean {
    return growBuffStacking(
      this.#state,
      () => this.canTimedGrow(buff),
      () => buff.enhance(buff.sourceId, { producedBy: { kind: 'buff', ...buff.reference } }),
    );
  }

  private timedGrowingEnhance(
    existing: CombatBuff<Key> | undefined,
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> {
    if (existing === undefined) return this.allocateEnhanced(definition, sourceId, options);
    applyTimedBuffEnhancement(this.#state, {
      before: () => existing.executeBeforeEnhance(sourceId),
      enhance: () => existing.enhance(sourceId, options),
      resetPeriod: () => existing.resetTimedGrowthPeriod(),
      after: () => existing.executeAfterEnhance(sourceId, options?.skillCastInfo ?? null),
    });
    return existing;
  }

  private refresh(
    existing: CombatBuff<Key> | undefined,
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> {
    if (existing === undefined) return this.allocate(definition, sourceId, options);

    // 原生 Refresh 只借用本次输入计算初始时长，不替换旧实例或重跑启用流程。
    existing.refreshDuration(resolveIncomingDuration(definition, options));
    return existing;
  }

  private extend(
    existing: CombatBuff<Key> | undefined,
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> {
    if (existing === undefined) return this.allocate(definition, sourceId, options);

    existing.extendDuration(resolveIncomingDuration(definition, options));
    return existing;
  }

  private overwriteDuration(
    existing: CombatBuff<Key> | undefined,
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> {
    if (existing === undefined) return this.allocate(definition, sourceId, options);

    existing.overwriteDuration(resolveIncomingDuration(definition, options));
    return existing;
  }

  private modify(
    existing: CombatBuff<Key> | undefined,
    definition: CombatBuffDefinition<Key>,
    sourceId: string,
    options?: CombatBuffAddOptions,
  ): CombatBuff<Key> {
    if (existing === undefined) return this.allocate(definition, sourceId, options);

    existing.modify(options);
    return existing;
  }
}

function resolveBuffAttributeModifierValues(
  definitionId: string,
  configured: BuffAttributeModifierValues,
  blackboard: ActionBlackboard,
): AttributeModifierValues {
  if (!('blackboardKey' in configured)) return configured;
  const value = blackboard.getNumber(configured.blackboardKey);
  if (value === undefined) {
    throw new Error(
      `buff '${definitionId}' attribute modifier blackboard key ` +
        `'${configured.blackboardKey}' is missing or not numeric`,
    );
  }
  return attributeModifierValues(configured.slot, value);
}

function resolveIncomingDuration<Key extends string>(
  definition: CombatBuffDefinition<Key>,
  options?: CombatBuffAddOptions,
): number | null {
  const blackboard = new ActionBlackboard(definition.blackboard);
  blackboard.assign(options?.blackboardValues);
  return resolveBuffDuration(definition, blackboard);
}

function resolveIncomingMaxStackCount<Key extends string>(
  definition: CombatBuffDefinition<Key>,
  options?: CombatBuffAddOptions,
): number {
  const blackboard = new ActionBlackboard(definition.blackboard);
  blackboard.assign(options?.blackboardValues);
  const configured = definition.maxStackCount ?? 0;
  if (typeof configured === 'number') {
    validateBuffMaxStackCount(configured);
    return configured;
  }
  const value = blackboard.getNumber(configured.blackboardKey);
  if (value === undefined) {
    throw new Error(
      `buff '${definition.id}' max stack count blackboard key ` +
        `'${configured.blackboardKey}' is missing or not numeric`,
    );
  }
  validateBuffMaxStackCount(value);
  return value;
}

function validateBuffMaxStackCount(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError('buff max stack count must resolve to a non-negative safe integer');
  }
}

function resolveBuffDuration<Key extends string>(
  definition: CombatBuffDefinition<Key>,
  blackboard: ActionBlackboard,
): number | null {
  const value = resolveOptionalBuffNumber(
    definition.id,
    'duration',
    definition.durationSeconds,
    blackboard,
  );
  if (value === null) return null;
  if (!Number.isFinite(value))
    throw new RangeError('buff duration must resolve to a finite number');
  // 原生 Buff.Reset 将求值后小于 -1e-5f 的寿命转为 Infinity；零与阈值本身仍有限。
  // 比较发生在 double→float 之后，不能把所有非正值一概当成无限。
  if (Math.fround(value) < Math.fround(-0.00001)) return null;
  return value;
}

function resolveBuffPriority<Key extends string>(
  definition: CombatBuffDefinition<Key>,
  blackboard: ActionBlackboard,
): number {
  // Stack 等非优先级类型不会加载残留的配置字段。
  if (
    definition.stackingType !== 'highPriority' &&
    definition.stackingType !== 'highPriorityWithMaxStack'
  )
    return 0;
  const configured = definition.priority ?? 0;
  if (typeof configured === 'number') {
    validateFiniteBuffPriority(configured);
    return configured;
  }
  const value = blackboard.getNumber(configured.blackboardKey);
  if (value === undefined) {
    throw new Error(
      `buff '${definition.id}' priority blackboard key '${configured.blackboardKey}' is missing or not numeric`,
    );
  }
  const priority = configured.negate ? -value : value;
  validateFiniteBuffPriority(priority);
  return priority;
}

function compareBuffPriority<Key extends string>(
  left: CombatBuff<Key>,
  right: CombatBuff<Key>,
): number {
  const priority = compareDescending(left.priority, right.priority);
  if (priority !== 0) return priority;

  const duration = compareDurationDescending(left.remainingDuration, right.remainingDuration);
  return duration !== 0 ? duration : left.instanceId - right.instanceId;
}

function compareDurationDescending(left: number | null, right: number | null): number {
  if (left === null) return right === null ? 0 : -1;
  if (right === null) return 1;
  return compareDescending(left, right);
}

function compareDescending(left: number, right: number): number {
  if (Math.abs(left - right) <= BUFF_PRIORITY_EPSILON) return 0;
  return left > right ? -1 : 1;
}

function validateFiniteBuffPriority(value: number): void {
  if (!Number.isFinite(value))
    throw new RangeError('buff priority must resolve to a finite number');
}

function resolveBuffTriggerCount<Key extends string>(
  definition: CombatBuffDefinition<Key>,
  blackboard: ActionBlackboard,
): number {
  const configured = definition.maxTriggerCount;
  if (configured === undefined) return 0;
  if (typeof configured === 'number') {
    validateBuffTriggerCount(configured);
    return configured;
  }
  const value = blackboard.getNumber(configured.blackboardKey);
  if (value === undefined) {
    throw new Error(
      `buff '${definition.id}' trigger count blackboard key '${configured.blackboardKey}' is missing or not numeric`,
    );
  }
  validateBuffTriggerCount(value);
  return value;
}

function validateBuffTriggerCount(value: number): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError('buff trigger count must resolve to a safe integer');
  }
}

function resolveOptionalBuffNumber(
  buffId: string,
  field: string,
  configured: BuffDuration | undefined,
  blackboard: ActionBlackboard,
): number | null {
  if (configured === undefined) return null;
  if (typeof configured === 'number') return configured;
  const value = blackboard.getNumber(configured.blackboardKey);
  if (value === undefined) {
    throw new Error(
      `buff '${buffId}' ${field} blackboard key '${configured.blackboardKey}' is missing or not numeric`,
    );
  }
  return value;
}
