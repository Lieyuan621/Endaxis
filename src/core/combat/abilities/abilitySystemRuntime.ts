import { type PostSkillCastRequest } from '../state/foundationState';
/**
 * 单个参战实体的 Buff、技能、延迟施放和 Action 帧阶段编排。
 * 技能顺序必须由定义编译结果显式传入；该层不负责推断队伍顺序、输入许可或目标选择。
 */
import type {
  NativeSkillType,
  PlayerSkillInput,
  SkillDefinition,
  SkillType,
} from '../../game-data/operatorDefinition';
import type { BuffApplicationHandle } from '../buffs/buffOperationExecutor';
import type { FrameRuntime } from '../runtime/combatSimulation';
import { SkillOperableBoundaryRuntime } from '../skills/skillOperableBoundaryRuntime';
import type { RuntimeSkillInterruptReason } from '../skills/skillRuntime';
import type { RuntimeSkillState, SkillOperableBoundaryFact } from '../state/abilityState';
import { createAbilitySystemState } from '../state/abilityState';
import type { CombatSkillCastInfo, SkillCastStartPreparation } from '../state/foundationState';
import { COMBAT_FRAME_INTERVAL, COMBAT_FRAMES_PER_SECOND } from '../time/combatClock';
import { uniformAbilityTickDeltas, type AbilityTickDeltas } from '../time/timeDilationRuntime';
import {
  activateAbilityPlayerActionMode,
  finishAbilityBasicAttackMapping,
  finishAbilityPlayerActionMode,
  registerAbilityBasicAttackMapping,
  storePostSkillCastRequest,
  takeBeforeSkillCastPreparation,
  takePostSkillCastRequest,
} from './abilitySystemExecution';

/** AbilitySystem 编排技能所需的最小生命周期端口。 */
export interface AbilitySkillRuntime extends FrameRuntime {
  readonly skillId: string;
  /** 原生动作继承白名单使用的表内 Skill ID；缺省时与 skillId 相同。 */
  readonly transitionSkillId?: string;
  readonly inputWindows?: SkillDefinition['inputWindows'];
  /** 文档中的技能释放身份；同技能多次放置时用于唯一寻址。 */
  readonly castId?: string;
  /** 玩家语义分类；实体内部技能只需 nativeSkillType，可以没有此字段。 */
  readonly skillType?: SkillType;
  readonly nativeSkillType?: NativeSkillType;
  /** 场景技能块在宿主局部时钟中的可操作宽度；非场景测试运行时可省略。 */
  readonly timelineBlockFrames?: number;
  readonly timelineBlockFollowUpSkillId?: string;
  /** 原生普攻连段身份提交点。 */
  readonly offsetRecordFrame?: number;
  /** 正式块宽由技能实际执行和 canInterrupt 决定，静态宽度只供预览。 */
  readonly usesRuntimeOperableBoundary?: boolean;
  /** 该技能已保留 AllowNext 动作；静态窗口只作诊断，边界必须等待实际执行候选。 */
  readonly requiresExecutedOperableBoundaryCandidate?: boolean;
  /** 当前技能首次产生玩家决策点时的局部帧。 */
  readonly reachedOperableBoundaryFrame?: number;
  /** 本帧实际执行的 AllowNextSkillAction 候选，由 AbilitySystem 按当前玩家路由筛选。 */
  readonly operableBoundaryCandidateFrame?: number;
  readonly operableBoundaryCandidateSkillIds?: readonly string[];
  takeOperableBoundaryCandidate?():
    { readonly frame: number; readonly skillIds: readonly string[] } | undefined;
  markOperableBoundaryReached?(frame?: number): void;
  readonly state: RuntimeSkillState;
  /** 当前技能局部整数执行帧；仅 casting 实例提供。 */
  readonly currentTimelineFrame?: number;
  /** 当前技能受 self-scaled 时间推进的精确局部帧累计。 */
  readonly passedFrames?: number;
  /** 原生当前技能可打断状态；只有读取 mustBeforeExclusiveTime 的切换路径才要求提供。 */
  readonly canInterrupt?: boolean;
  /** 当前技能是否允许 Dash；包含 MarkCanDash 对本次施放打开的独立窗口。 */
  readonly canDash?: boolean;
  readonly skillCastInfo?: CombatSkillCastInfo;
  /** 当前或已预分配的本次释放编号；不读取 Buff/事件的普通来源。 */
  readonly processingSkillCastId?: number;
  /** 实体自动施放读取已有冷却账本；玩家轴上的强制执行不由此拒绝。 */
  readonly cooldown?: { readonly ready: boolean };
  canStart(): boolean;
  /** 本次启动前合并进动作黑板的运行时参数，例如连携候选携带的黑板。 */
  prepareStartBlackboard?(values: Readonly<Record<string, number>>): void;
  prepareAfterCastStart?(preparation: SkillCastStartPreparation): void;
  /** 装配层在施放前事件之前预分配的原生技能释放序号。 */
  prepareSkillCastId?(skillCastId: number): void;
  /** Prepare synchronous cast input only; queuing belongs to requestPostSkillCast. */
  prepareCastInput?(input: {
    readonly skipApplyCost: boolean;
    readonly inputTarget?: import('../../game-data/logicalAbilityEntity').RuntimeTargetRef | null;
    readonly inheritedSkillCastInfo?: CombatSkillCastInfo;
    readonly producedBy?: import('../receipt/combatReceipt').CombatObjectRef;
  }): void;
  prepareForcedTimelineCast?(): void;
  attachBuffToCast?(skillCastId: number, buff: BuffApplicationHandle): void;
  attachInheritedBuff?(buff: BuffApplicationHandle): void;
  trySwitchToBuffCast?(
    currentSkill?: {
      readonly skillType: SkillType | undefined;
      readonly skillCastInfo: CombatSkillCastInfo;
      readonly canInterrupt: boolean;
    },
    beforeCastStart?: () => void,
    withProcessingSkill?: (execute: () => void) => void,
  ): boolean;
  tryStart(): boolean;
  interrupt(
    reason: RuntimeSkillInterruptReason,
    transition?: import('../skills/skillRuntime').RuntimeSkillTransition,
  ): void;
  /** 时间膨胀启用后分别推进技能时间线和冷却。 */
  advance?(timelineDeltaSeconds: number, cooldownDeltaSeconds: number): void;
  readonly startedInCurrentFrame?: boolean;
}

/** Buff 运行时按定义为每个实例选择默认、全局或实体时钟。 */
export interface AbilityBuffRuntime extends FrameRuntime {
  advanceWithDeltas?(deltas: AbilityTickDeltas): void;
  recycleFinishedBuffs?(): void;
}

/** 同一技能多次放置时用 (skillId, castId) 唯一寻址；单元测试程序缺省为空。 */
export function abilitySkillKey(skill: Pick<AbilitySkillRuntime, 'skillId' | 'castId'>): string {
  return `${skill.skillId}\u0000${skill.castId ?? ''}`;
}

function fallbackNativeSkillType(skillType: SkillType): NativeSkillType {
  return skillType === 'basicAttack' || skillType === 'plungingAttack'
    ? 'attack'
    : skillType === 'finisher'
      ? 'breakingAttack'
      : skillType === 'battleSkill'
        ? 'normalSkill'
        : skillType === 'comboSkill'
          ? 'comboSkill'
          : 'ultimateSkill';
}

function nativeSkillInterruptPriority(skillType: NativeSkillType): number {
  return {
    passiveSkill: 0,
    attack: 1,
    breakingAttack: 2,
    normalSkill: 2,
    attachSkill: 4,
    dodge: 6,
    comboSkill: 5,
    ultimateSkill: 7,
    extraActiveSkill: 2,
  }[skillType];
}

/** 按唯一身份调用技能启动的端口。 */
export interface AbilitySkillStarter {
  tryStartByKey(key: string): boolean;
}

export interface AbilitySystemRuntimeOptions {
  /** 真正进入施放时发布；待发布的数据保存在能力系统状态中。 */
  readonly emitBeforeSkillCast?: (
    payload: import('../events/combatAbilityEvent').AbilitySkillPayload,
  ) => void;
  /** 原生 onPostSkillTryCastRequest 对象委托：写入延迟槽之后通知，不是 AbilityEvent。 */
  readonly onPostSkillCastRequest?: (skillCastInfo: CombatSkillCastInfo | null) => void;
  readonly buffRuntime?: AbilityBuffRuntime;
  /** 保持普通攻击、主动、被动、通用技能的原生构造顺序。 */
  readonly skills: readonly AbilitySkillRuntime[];
  /** 完整技能目录的推进顺序；每个身份先更新共享冷却，再更新其放置实例。未放置身份只有冷却。 */
  readonly skillTickPlan?: readonly {
    readonly skillId: string;
    readonly advanceCooldown: (deltaSeconds: number) => void;
  }[];
  /** 同一放置身份下可由战斗动作切换的技能形态。 */
  readonly skillSlotGroups?: readonly {
    readonly skillGroupKey: string;
    readonly input?: PlayerSkillInput;
    readonly defaultForInput?: boolean;
    readonly baseSkillKey: string;
    readonly stableInputSkillKeys?: readonly string[];
    readonly replacementSkillKeys: readonly string[];
  }[];
  /** 四类语义动作的显式原生路由；存在时完全取代技能组推导。 */
  readonly playerActionRoutes?: import('../../game-data/operatorDefinition').OperatorPlayerActionRoutes;
  readonly playerActionModes?: readonly import('../../game-data/operatorDefinition').OperatorPlayerActionModeDefinition[];
  readonly actionRuntime?: FrameRuntime;
  readonly resolveTickDeltas?: () => AbilityTickDeltas;
  /** 帧末延迟施放在真正启动前回到装配根，复用施放前事件与运行时参数准备。 */
  readonly beforePostSkillCastStart?: (request: PostSkillCastRequest) => void;
  readonly onPostSkillCastResolved?: (request: PostSkillCastRequest, started: boolean) => void;
  /** 提供后才发布场景技能块的实例级实际结束边界。 */
  readonly resolveActualFrame?: () => number;
  readonly onSkillOperableBoundaryReached?: (fact: SkillOperableBoundaryFact) => void;
  /** 当前技能真正开始或被清空后通知中心状态；恢复绑定不发布生命周期事件。 */
  readonly onCurrentSkillChanged?: (type: NativeSkillType | null) => void;
  /** 原生 BattleCommandMappingConfig.dashOffsetCacheTime 换算后的帧数。 */
  readonly dashOffsetFrames?: number;
}

/** 按原生 PreLateTick 主干顺序推进一个实体的战斗能力。 */
export class AbilitySystemRuntime implements FrameRuntime {
  readonly runtimeState: ReturnType<typeof createAbilitySystemState>;
  readonly #buffRuntime?: AbilityBuffRuntime;
  readonly #skills: AbilitySkillRuntime[];
  readonly #skillTickPlan?: readonly {
    readonly skillId: string;
    readonly advanceCooldown: (deltaSeconds: number) => void;
    readonly skills: AbilitySkillRuntime[];
  }[];
  readonly #skillsById = new Map<string, AbilitySkillRuntime>();
  readonly #slotGroupByStableInputSkill = new Map<string, string>();
  readonly #slotGroupByAllowedSkill = new Map<string, string>();
  readonly #defaultSlotGroupByInput = new Map<PlayerSkillInput, string>();
  readonly #playerActionRoutes?: import('../../game-data/operatorDefinition').OperatorPlayerActionRoutes;
  readonly #playerActionModes = new Map<
    string,
    import('../../game-data/operatorDefinition').OperatorPlayerActionModeDefinition
  >();
  readonly #skillKeysByTransitionSkillId = new Map<string, Set<string>>();
  readonly #actionRuntime?: FrameRuntime;
  readonly #resolveTickDeltas: () => AbilityTickDeltas;
  readonly #beforePostSkillCastStart?: (request: PostSkillCastRequest) => void;
  readonly #onPostSkillCastResolved: AbilitySystemRuntimeOptions['onPostSkillCastResolved'];
  readonly #operableBoundaries: SkillOperableBoundaryRuntime | null;
  readonly #resolveActualFrame?: () => number;
  readonly #onSkillOperableBoundaryReached?: (fact: SkillOperableBoundaryFact) => void;
  readonly #emitBeforeSkillCast: AbilitySystemRuntimeOptions['emitBeforeSkillCast'];
  readonly #onPostSkillCastRequest?: AbilitySystemRuntimeOptions['onPostSkillCastRequest'];
  readonly #dashOffsetFrames: number | undefined;
  readonly #onCurrentSkillChanged: AbilitySystemRuntimeOptions['onCurrentSkillChanged'];

  /** 运行对象按数据中的稳定技能身份即时解析，不在字段中另存一份当前对象引用。 */
  get #currentSkill(): AbilitySkillRuntime | null {
    return this.#resolveStoredSkill(this.runtimeState.currentSkillKey);
  }
  set #currentSkill(skill: AbilitySkillRuntime | null) {
    const previousKey = this.runtimeState.currentSkillKey;
    this.runtimeState.currentSkillKey = skill === null ? null : abilitySkillKey(skill);
    if (skill === null && previousKey !== null) this.#onCurrentSkillChanged?.(null);
  }
  get #processingSkill(): AbilitySkillRuntime | null {
    return this.#resolveStoredSkill(this.runtimeState.processingSkillKey);
  }
  set #processingSkill(skill: AbilitySkillRuntime | null) {
    this.runtimeState.processingSkillKey = skill === null ? null : abilitySkillKey(skill);
  }
  #resolveStoredSkill(key: string | null): AbilitySkillRuntime | null {
    if (key === null) return null;
    const skill = this.#skillsById.get(key);
    if (skill === undefined) throw new Error(`missing ability skill binding '${key}'`);
    return skill;
  }

  constructor(
    options: AbilitySystemRuntimeOptions,
    restored?: ReturnType<typeof createAbilitySystemState>,
  ) {
    this.runtimeState = restored ?? createAbilitySystemState();
    this.#emitBeforeSkillCast = options.emitBeforeSkillCast;
    this.#buffRuntime = options.buffRuntime;
    this.#skills = [...options.skills];
    this.#actionRuntime = options.actionRuntime;
    this.#playerActionRoutes = options.playerActionRoutes;
    const defaultModeLayers = new Set<string>();
    for (const mode of options.playerActionModes ?? []) {
      if (this.#playerActionModes.has(mode.modeId)) {
        throw new Error(`duplicate player-action mode '${mode.modeId}'`);
      }
      this.#playerActionModes.set(mode.modeId, mode);
      if (mode.defaultEnabled) {
        if (defaultModeLayers.has(mode.modeLayer)) {
          throw new Error(`multiple default player-action modes use layer '${mode.modeLayer}'`);
        }
        defaultModeLayers.add(mode.modeLayer);
        if (restored === undefined)
          this.runtimeState.activePlayerActionModeByLayer.set(mode.modeLayer, mode.modeId);
      }
    }
    this.#beforePostSkillCastStart = options.beforePostSkillCastStart;
    this.#onPostSkillCastResolved = options.onPostSkillCastResolved;
    this.#onPostSkillCastRequest = options.onPostSkillCastRequest;
    this.#dashOffsetFrames = options.dashOffsetFrames;
    this.#onCurrentSkillChanged = options.onCurrentSkillChanged;
    if (
      this.#dashOffsetFrames !== undefined &&
      (!Number.isFinite(this.#dashOffsetFrames) || this.#dashOffsetFrames < 0)
    )
      throw new RangeError('dashOffsetFrames must be non-negative');
    if (
      (options.resolveActualFrame === undefined) !==
      (options.onSkillOperableBoundaryReached === undefined)
    ) {
      throw new Error(
        'ability skill operable boundary projection requires both actual frame and observer',
      );
    }
    this.#resolveActualFrame = options.resolveActualFrame;
    this.#onSkillOperableBoundaryReached = options.onSkillOperableBoundaryReached;
    this.#operableBoundaries =
      options.resolveActualFrame === undefined
        ? null
        : new SkillOperableBoundaryRuntime(this.runtimeState.operableBoundaries);
    this.#resolveTickDeltas =
      options.resolveTickDeltas ?? (() => uniformAbilityTickDeltas(COMBAT_FRAME_INTERVAL));
    const definedNativeSkillTypes = new Map<string, NativeSkillType>();
    for (const skill of this.#skills) {
      const key = abilitySkillKey(skill);
      if (this.#skillsById.has(key)) {
        throw new Error(`duplicate ability skill '${key}'`);
      }
      this.#skillsById.set(key, skill);
      const nativeSkillType =
        skill.nativeSkillType ??
        (skill.skillType === undefined
          ? (() => {
              throw new Error(`ability skill '${skill.skillId}' has no native or player type`);
            })()
          : fallbackNativeSkillType(skill.skillType));
      const previousNativeSkillType = definedNativeSkillTypes.get(skill.skillId);
      if (previousNativeSkillType !== undefined && previousNativeSkillType !== nativeSkillType) {
        throw new Error(`ability skill '${skill.skillId}' has inconsistent native SkillType`);
      }
      definedNativeSkillTypes.set(skill.skillId, nativeSkillType);
      // 定义之间必须一致；切面里的类型可能已被 ChangeSkillType 改过，应原样保留。
      if (restored === undefined)
        this.runtimeState.nativeSkillTypeBySkillId.set(skill.skillId, nativeSkillType);
      else if (!this.runtimeState.nativeSkillTypeBySkillId.has(skill.skillId))
        throw new Error(`restored ability has no native type for '${skill.skillId}'`);
      const transitionSkillId = skill.transitionSkillId ?? skill.skillId;
      const skillKeys = this.#skillKeysByTransitionSkillId.get(transitionSkillId) ?? new Set();
      skillKeys.add(skill.skillId);
      this.#skillKeysByTransitionSkillId.set(transitionSkillId, skillKeys);
    }
    if (options.skillTickPlan !== undefined) {
      const ids = new Set<string>();
      this.#skillTickPlan = options.skillTickPlan.map(entry => {
        if (ids.has(entry.skillId))
          throw new Error(`duplicate skill tick identity '${entry.skillId}'`);
        ids.add(entry.skillId);
        return {
          skillId: entry.skillId,
          advanceCooldown: entry.advanceCooldown,
          skills: this.#skills.filter(skill => skill.skillId === entry.skillId),
        };
      });
      for (const skill of this.#skills) {
        if (!ids.has(skill.skillId))
          throw new Error(`skill '${skill.skillId}' is missing from tick plan`);
      }
    }
    const slotGroupKeys = new Set<string>();
    for (const group of options.skillSlotGroups ?? []) {
      if (slotGroupKeys.has(group.skillGroupKey)) {
        throw new Error(`duplicate ability skill slot group '${group.skillGroupKey}'`);
      }
      slotGroupKeys.add(group.skillGroupKey);
      const stableInputSkillKeys = group.stableInputSkillKeys ?? [group.baseSkillKey];
      const baseSkill = this.#skills.find(skill => skill.skillId === group.baseSkillKey);
      const input =
        group.input ??
        (baseSkill === undefined
          ? 'battleSkill'
          : baseSkill.skillType === undefined
            ? (() => {
                throw new Error(
                  `ability skill slot '${group.skillGroupKey}' references a skill without player type`,
                );
              })()
            : baseSkill.skillType === 'basicAttack' ||
                baseSkill.skillType === 'finisher' ||
                baseSkill.skillType === 'plungingAttack'
              ? 'basicAttack'
              : baseSkill.skillType === 'battleSkill'
                ? 'battleSkill'
                : baseSkill.skillType === 'comboSkill'
                  ? 'comboSkill'
                  : 'ultimate');
      // 基础命令映射必须来自原生 SkillDataBundle.defaultCmdMapping / ModeData，
      // 不能由 Endaxis 的技能库分组反推。旧调用方未提供证据时不登记默认槽。
      const defaultForInput = group.defaultForInput ?? false;
      if (!stableInputSkillKeys.includes(group.baseSkillKey)) {
        throw new Error(
          `ability skill slot group '${group.skillGroupKey}' does not include its base skill`,
        );
      }
      const allowedSkillKeys = new Set([...stableInputSkillKeys, ...group.replacementSkillKeys]);
      if (
        allowedSkillKeys.size !==
        stableInputSkillKeys.length + group.replacementSkillKeys.length
      ) {
        throw new Error(`ability skill slot group '${group.skillGroupKey}' has duplicate variants`);
      }
      for (const skillKey of stableInputSkillKeys) {
        if (this.#slotGroupByStableInputSkill.has(skillKey)) {
          throw new Error(`ability skill '${skillKey}' owns multiple slot groups`);
        }
        this.#slotGroupByStableInputSkill.set(skillKey, group.skillGroupKey);
      }
      for (const skillKey of allowedSkillKeys) {
        if (this.#slotGroupByAllowedSkill.has(skillKey)) {
          throw new Error(`ability skill '${skillKey}' owns multiple slot groups`);
        }
        this.#slotGroupByAllowedSkill.set(skillKey, group.skillGroupKey);
      }
      if (restored !== undefined) {
        const saved = restored.skillSlotGroups.get(group.skillGroupKey);
        if (
          saved === undefined ||
          saved.baseSkillKey !== group.baseSkillKey ||
          saved.input !== input ||
          saved.defaultForInput !== defaultForInput ||
          saved.stableInputSkillKeys.size !== stableInputSkillKeys.length ||
          stableInputSkillKeys.some(key => !saved.stableInputSkillKeys.has(key)) ||
          saved.allowedSkillKeys.size !== allowedSkillKeys.size ||
          [...allowedSkillKeys].some(key => !saved.allowedSkillKeys.has(key)) ||
          !allowedSkillKeys.has(saved.currentSkillKey)
        )
          throw new Error(`restored skill slot '${group.skillGroupKey}' does not match program`);
      } else
        this.runtimeState.skillSlotGroups.set(group.skillGroupKey, {
          baseSkillKey: group.baseSkillKey,
          input,
          defaultForInput,
          stableInputSkillKeys: new Set(stableInputSkillKeys),
          allowedSkillKeys,
          currentSkillKey: group.baseSkillKey,
        });
      if (defaultForInput) {
        if (this.#defaultSlotGroupByInput.has(input)) {
          throw new Error(`multiple default ability skill slots use input '${input}'`);
        }
        this.#defaultSlotGroupByInput.set(input, group.skillGroupKey);
      }
    }
    if (restored !== undefined) {
      if (restored.skillSlotGroups.size !== slotGroupKeys.size)
        throw new Error('restored skill slot groups do not match program');
      for (const [layer, modeId] of restored.activePlayerActionModeByLayer) {
        if (this.#playerActionModes.get(modeId)?.modeLayer !== layer)
          throw new Error(`restored player-action mode '${modeId}' does not match program`);
      }
      for (const activation of restored.playerActionModeActivations.values()) {
        if (
          this.#playerActionModes.get(activation.modeId)?.modeLayer !== activation.layer ||
          (activation.previousModeId !== null &&
            this.#playerActionModes.get(activation.previousModeId)?.modeLayer !== activation.layer)
        )
          throw new Error('restored player-action mode activation does not match program');
      }
      this.#resolveStoredSkill(restored.currentSkillKey);
      this.#resolveStoredSkill(restored.processingSkillKey);
      if (
        restored.comboOffsetTargetSkillKey !== null &&
        !this.#skills.some(skill => skill.skillId === restored.comboOffsetTargetSkillKey)
      )
        throw new Error(
          `restored combo offset target '${restored.comboOffsetTargetSkillKey}' is not registered`,
        );
      if (restored.comboOffsetModifier !== null) {
        const offset = restored.comboOffsetModifier;
        if (
          !Number.isFinite(offset.remainingFrames) ||
          offset.remainingFrames <= 0 ||
          !this.#skills.some(skill => skill.skillId === offset.targetSkillKey)
        )
          throw new Error('restored combo offset modifier does not match the skill program');
      }
      if (
        restored.comboOffsetRecordedSkillKey !== null &&
        !this.#skillsById.has(restored.comboOffsetRecordedSkillKey)
      )
        throw new Error(
          `restored combo offset record '${restored.comboOffsetRecordedSkillKey}' is not registered`,
        );
    }
  }

  get currentSkillId(): string | null {
    return this.#currentSkill?.skillId ?? null;
  }

  /** 当前正在执行的释放身份；用于把输入诊断准确定位到轴上的技能块。 */
  get currentSkillCastId(): string | undefined {
    return this.#currentSkill?.state === 'casting' ? this.#currentSkill.castId : undefined;
  }

  /** 原生 curProcessingSkill：同步临时技能优先，随后回到仍在执行的当前技能。 */
  get currentProcessingSkillCastId(): number | undefined {
    const skill =
      this.#processingSkill ??
      (this.#currentSkill?.state === 'casting' ? this.#currentSkill : null);
    return skill?.processingSkillCastId;
  }

  #withProcessingSkill(skill: AbilitySkillRuntime, execute: () => void): void {
    const previous = this.#processingSkill;
    this.#processingSkill = skill;
    try {
      execute();
    } finally {
      this.#processingSkill = previous;
    }
  }

  get currentSkillType(): SkillType | undefined {
    return this.#currentSkill?.state === 'casting' ? this.#currentSkill.skillType : undefined;
  }

  get currentNativeSkillType(): NativeSkillType | undefined {
    return this.#currentSkill?.state === 'casting'
      ? this.runtimeState.nativeSkillTypeBySkillId.get(this.#currentSkill.skillId)
      : undefined;
  }

  /** 查询可变原生类型，不按技能库分组或玩家操作重新推断。 */
  nativeSkillTypeForSkill(skillId: string): NativeSkillType {
    const type = this.runtimeState.nativeSkillTypeBySkillId.get(skillId);
    if (type === undefined)
      throw new Error(`unknown ability skill '${skillId}' for native SkillType query`);
    return type;
  }

  /** ChangeSkillType 修改同一原生技能身份的运行时类型，不改变玩家操作槽位。 */
  changeNativeSkillType(skillId: string, nativeSkillType: NativeSkillType): void {
    if (!this.runtimeState.nativeSkillTypeBySkillId.has(skillId)) {
      throw new Error(`unknown ability skill '${skillId}' for native SkillType mutation`);
    }
    this.runtimeState.nativeSkillTypeBySkillId.set(skillId, nativeSkillType);
  }

  get currentSkillTimelineFrame(): number | undefined {
    return this.#currentSkill?.state === 'casting'
      ? this.#currentSkill.currentTimelineFrame
      : undefined;
  }

  /** CenterDashState.OnEnter：Dash 独立于技能接续许可，直接以 Dash 原因结束当前技能。 */
  interruptCurrentSkillForDash(): {
    readonly skillId: string;
    readonly castId: string | undefined;
    readonly nativeSkillType: NativeSkillType;
    readonly timelineFrame: number | undefined;
    readonly canInterrupt: boolean | undefined;
    readonly canDash: boolean | undefined;
  } | null {
    const current = this.#currentSkill?.state === 'casting' ? this.#currentSkill : null;
    if (current === null) return null;
    const result = {
      skillId: current.skillId,
      castId: current.castId,
      nativeSkillType: this.runtimeState.nativeSkillTypeBySkillId.get(current.skillId)!,
      timelineFrame: current.currentTimelineFrame,
      canInterrupt: current.canInterrupt,
      canDash: current.canDash,
    };
    if (result.nativeSkillType === 'attack' || this.runtimeState.comboOffsetModifier !== null)
      this.#createComboOffset('dash', null);
    current.interrupt('dash');
    if (this.#currentSkill === current && current.state !== 'casting') this.#currentSkill = null;
    return result;
  }

  /** CharacterData 原生战技路由的当前身份；缺少路由时不按 UI 分组猜测。 */
  get currentNormalSkillId(): string | undefined {
    const route = this.#playerActionRoutes?.battleSkill;
    return route?.kind === 'skillSlot'
      ? this.currentSkillKeyForSlot(route.skillSlotKey)
      : undefined;
  }

  /** 读取当前槽位身份；未知组不回退为基础技能。 */
  currentSkillKeyForSlot(skillGroupKey: string): string {
    const group = this.runtimeState.skillSlotGroups.get(skillGroupKey);
    if (group === undefined) {
      throw new Error(`unknown ability skill slot group '${skillGroupKey}'`);
    }
    return group.currentSkillKey;
  }

  /** 只改变后续释放的槽位解析；已经进入 casting 的实例保持原引用。 */
  changeSkillSlot(skillGroupKey: string, targetSkillKey: string): string {
    const group = this.runtimeState.skillSlotGroups.get(skillGroupKey);
    if (group === undefined) {
      throw new Error(`unknown ability skill slot group '${skillGroupKey}'`);
    }
    if (!group.allowedSkillKeys.has(targetSkillKey)) {
      throw new Error(
        `skill '${targetSkillKey}' is not a variant of ability skill slot group '${skillGroupKey}'`,
      );
    }
    const previousSkillKey = group.currentSkillKey;
    group.currentSkillKey = targetSkillKey;
    return previousSkillKey;
  }

  /**
   * 按玩家操作解析当前槽位，并与时间轴块显式声明的具体技能核对。
   * 基础状态下，多段稳定输入各自保持身份；换槽后，同组玩家操作只会解析到当前替换技能。
   */
  resolvePlayerInputSkill(
    expectedSkillKey: string,
    action?: PlayerSkillInput,
  ):
    | { readonly status: 'matched'; readonly actualSkillKey: string }
    | { readonly status: 'mismatched'; readonly actualSkillKey: string }
    | { readonly status: 'notApplicable'; readonly reason: string }
    | { readonly status: 'unknown'; readonly reason: string } {
    if (this.#playerActionRoutes !== undefined) {
      const matchingInputs = Object.entries(this.#playerActionRoutes).flatMap(([input, route]) => {
        if (route === undefined) return [];
        if (action !== undefined && input !== action) return [];
        if (route.kind === 'basicAttack') {
          return route.skillKeys.includes(expectedSkillKey) ? [input as PlayerSkillInput] : [];
        }
        const group = this.runtimeState.skillSlotGroups.get(route.skillSlotKey);
        return group?.allowedSkillKeys.has(expectedSkillKey) === true
          ? [input as PlayerSkillInput]
          : [];
      });
      if (matchingInputs.length === 0) {
        return {
          status: 'unknown',
          reason:
            action === undefined
              ? 'skill is not reachable from an imported player action route'
              : `skill is not reachable from player action '${action}'`,
        };
      }
      if (matchingInputs.length > 1) {
        return { status: 'unknown', reason: 'skill is reachable from multiple player actions' };
      }
      const input = matchingInputs[0]!;
      const route = this.#playerActionRoutes[input]!;
      if (route.kind === 'skillSlot') {
        const actualSkillKey = this.runtimeState.skillSlotGroups.get(
          route.skillSlotKey,
        )!.currentSkillKey;
        return actualSkillKey === expectedSkillKey
          ? { status: 'matched', actualSkillKey }
          : { status: 'mismatched', actualSkillKey };
      }
      const expectedSkillType = this.#skills.find(
        skill => skill.skillId === expectedSkillKey,
      )?.skillType;
      if (expectedSkillType === 'finisher' || expectedSkillType === 'plungingAttack') {
        // 处决和下落攻击与普通攻击共用输入，但先由敌人处决状态或角色腾空状态选出。
        // Next 尚未建模这两项状态，因此时间轴显式放置的特殊攻击不能再被地面普攻、
        // 当前技能或模式的 Attack 命令映射反证为另一技能。
        return {
          status: 'notApplicable',
          reason: 'special basic-attack selection state is outside simulation scope',
        };
      }
      const buffMapped = this.#resolveBuffBasicAttackMapping(expectedSkillKey);
      if (buffMapped !== null) return buffMapped;
      const mapped = this.#resolveCurrentBasicAttackMapping(expectedSkillKey);
      if (mapped !== null) return mapped;
      const offsetMapped = this.#resolveComboOffsetBasicAttackMapping(expectedSkillKey);
      if (offsetMapped !== null) return offsetMapped;
      const modeMapped = this.#resolveActiveModeBasicAttackMapping(expectedSkillKey);
      if (modeMapped !== null) return modeMapped;
      if (route.defaultSkillKey === undefined) {
        return { status: 'unknown', reason: 'native basic-attack command mapping is not imported' };
      }
      return route.defaultSkillKey === expectedSkillKey
        ? { status: 'matched', actualSkillKey: route.defaultSkillKey }
        : { status: 'mismatched', actualSkillKey: route.defaultSkillKey };
    }

    return {
      status: 'unknown',
      reason: 'operator has no imported player action routes',
    };
  }

  /** Buff 映射高于 Skill/Mode；按注册身份撤销，不恢复已失效的快照。 */
  overrideBasicAttackMapping(skillId: string): {
    readonly registrationId: number;
    finish(): void;
  } {
    const token = registerAbilityBasicAttackMapping(this.runtimeState, skillId);
    return {
      registrationId: token,
      finish: () => this.finishBasicAttackMapping(token),
    };
  }

  /** 删除当前分支的指定登记，其他映射及其优先级保持不变。 */
  finishBasicAttackMapping(registrationId: number): void {
    finishAbilityBasicAttackMapping(this.runtimeState, registrationId);
  }

  #resolveBuffBasicAttackMapping(expectedSkillKey: string) {
    if (this.runtimeState.buffBasicAttackMappings.size === 0) return null;
    const targets = new Set(this.runtimeState.buffBasicAttackMappings.values());
    if (targets.size !== 1) {
      return {
        status: 'unknown' as const,
        reason: 'multiple Buff command mappings have unresolved priority',
      };
    }
    const skillId = [...targets][0]!;
    const keys = this.#skillKeysByTransitionSkillId.get(skillId);
    if (keys === undefined || keys.size !== 1) {
      return {
        status: 'unknown' as const,
        reason: `Buff command mapping target '${skillId}' is not unique`,
      };
    }
    const actualSkillKey = [...keys][0]!;
    return actualSkillKey === expectedSkillKey
      ? { status: 'matched' as const, actualSkillKey }
      : { status: 'mismatched' as const, actualSkillKey };
  }

  #resolveCurrentBasicAttackMapping(
    expectedSkillKey: string,
  ):
    | { readonly status: 'matched'; readonly actualSkillKey: string }
    | { readonly status: 'mismatched'; readonly actualSkillKey: string }
    | { readonly status: 'unknown'; readonly reason: string }
    | null {
    const current = this.#currentSkill?.state === 'casting' ? this.#currentSkill : null;
    if (current === null || current.currentTimelineFrame === undefined) return null;
    const frame = current.currentTimelineFrame;
    const expectedSkillIds = new Set(
      this.#skills
        .filter(skill => skill.skillId === expectedSkillKey)
        .map(skill => skill.transitionSkillId ?? skill.skillId),
    );
    const mappings = (current.inputWindows?.commandMappings ?? []).filter(
      window =>
        window.input === 'basicAttack' && window.startFrame <= frame && frame <= window.endFrame,
    );
    const targets = new Set(mappings.map(mapping => mapping.targetSkillId));
    if (targets.size > 1) {
      return {
        status: 'unknown',
        reason: 'multiple active command mappings have unresolved priority',
      };
    }
    if (targets.size === 0) {
      const explicitlyAllowed = (current.inputWindows?.allowedNextSkills ?? []).some(
        window =>
          window.startFrame <= frame &&
          frame <= window.endFrame &&
          window.skillIds.some(skillId => expectedSkillIds.has(skillId)),
      );
      if (explicitlyAllowed) {
        // 部分技能只用 AllowNextSkillAction 开放下一段，没有同时改写 CommandMapping；
        // 此时白名单本身就是当前普攻操作的路由。若同帧存在显式映射，则映射优先。
        return { status: 'matched', actualSkillKey: expectedSkillKey };
      }
      return current.inputWindows?.hasConditionalActions === true
        ? { status: 'unknown', reason: 'current skill has conditional input actions' }
        : null;
    }
    const target = [...targets][0]!;
    if (target === null) {
      return { status: 'unknown', reason: 'active command mapping has no direct skill route' };
    }
    const keys = this.#skillKeysByTransitionSkillId.get(target);
    if (keys === undefined || keys.size !== 1) {
      return { status: 'unknown', reason: `command mapping target '${target}' is not unique` };
    }
    const actualSkillKey = [...keys][0]!;
    return actualSkillKey === expectedSkillKey
      ? { status: 'matched', actualSkillKey }
      : { status: 'mismatched', actualSkillKey };
  }

  #resolveActiveModeBasicAttackMapping(
    expectedSkillKey: string,
  ):
    | { readonly status: 'matched'; readonly actualSkillKey: string }
    | { readonly status: 'mismatched'; readonly actualSkillKey: string }
    | { readonly status: 'unknown'; readonly reason: string }
    | null {
    const mappings = [...this.runtimeState.activePlayerActionModeByLayer.values()].flatMap(
      modeId => {
        const mapping = this.#playerActionModes.get(modeId)?.commandMappings?.basicAttack;
        return mapping === undefined ? [] : [mapping];
      },
    );
    if (mappings.length === 0) return null;
    if (mappings.length > 1) {
      return { status: 'unknown', reason: 'multiple active modes override basic-attack routing' };
    }
    const mapping = mappings[0]!;
    const keys = this.#skillKeysByTransitionSkillId.get(mapping.skillId);
    if (keys === undefined || keys.size !== 1) {
      return {
        status: 'unknown',
        reason: `active mode maps basic attack to unconverted native skill '${mapping.skillId}'`,
      };
    }
    const actualSkillKey = [...keys][0]!;
    return actualSkillKey === expectedSkillKey
      ? { status: 'matched', actualSkillKey }
      : { status: 'mismatched', actualSkillKey };
  }

  #resolveComboOffsetBasicAttackMapping(expectedSkillKey: string) {
    const actualSkillKey = this.runtimeState.comboOffsetModifier?.targetSkillKey;
    if (actualSkillKey === undefined) return null;
    return actualSkillKey === expectedSkillKey
      ? { status: 'matched' as const, actualSkillKey }
      : { status: 'mismatched' as const, actualSkillKey };
  }

  /** SwitchModeAction 在一个 modeLayer 上替换活动模式，并返回按动作寿命恢复的句柄。 */
  activatePlayerActionMode(modeId: string): { readonly registrationId: number; finish(): void } {
    const mode = this.#playerActionModes.get(modeId);
    if (mode === undefined) throw new Error(`unknown player-action mode '${modeId}'`);
    const id = activateAbilityPlayerActionMode(this.runtimeState, mode.modeLayer, modeId);
    return this.bindPlayerActionModeActivation(id);
  }

  /** 只绑定已经存在的切换，不再次覆盖模式或重新分配编号。 */
  bindPlayerActionModeActivation(registrationId: number): {
    readonly registrationId: number;
    finish(): void;
  } {
    if (!this.runtimeState.playerActionModeActivations.has(registrationId))
      throw new Error(`player-action mode activation ${registrationId} is missing`);
    return {
      registrationId,
      finish: () => this.finishPlayerActionModeActivation(registrationId),
    };
  }

  /** 按当前分支的数据结束登记，重复结束不产生副作用。 */
  finishPlayerActionModeActivation(registrationId: number): void {
    finishAbilityPlayerActionMode(this.runtimeState, registrationId);
  }

  evaluatePlayerInputInterruption(
    expectedSkillKey: string,
    castId?: string,
  ):
    | { readonly status: 'allowed' }
    | { readonly status: 'blocked'; readonly currentSkillKey: string }
    | { readonly status: 'unknown'; readonly reason: string } {
    const current = this.#currentSkill?.state === 'casting' ? this.#currentSkill : null;
    if (current === null) return { status: 'allowed' };
    const next = this.#requireSkill(expectedSkillKey, castId, false);
    const nextSkillId = next.transitionSkillId ?? next.skillId;
    const frame = current.currentTimelineFrame;
    if (frame !== undefined) {
      const explicitlyAllowed = (current.inputWindows?.allowedNextSkills ?? []).some(
        window =>
          window.startFrame <= frame &&
          frame <= window.endFrame &&
          window.skillIds.includes(nextSkillId),
      );
      if (explicitlyAllowed) return { status: 'allowed' };
    }
    if (current.inputWindows === undefined) {
      // 只有 exclusiveFrame 无法排除尚未迁移的 AllowedNextSkill 旁路。
      return { status: 'allowed' };
    }
    if (next.skillType === 'plungingAttack') return { status: 'allowed' };
    const nextNativeSkillType = this.runtimeState.nativeSkillTypeBySkillId.get(next.skillId)!;
    const currentNativeSkillType = this.runtimeState.nativeSkillTypeBySkillId.get(current.skillId)!;
    if (
      nativeSkillInterruptPriority(nextNativeSkillType) >
      nativeSkillInterruptPriority(currentNativeSkillType)
    )
      return { status: 'allowed' };
    if (current.canInterrupt === true) return { status: 'allowed' };
    if (current.canInterrupt === undefined) {
      return { status: 'unknown', reason: 'current skill has no recovered interrupt boundary' };
    }
    if (current.inputWindows?.hasConditionalActions === true) {
      return { status: 'unknown', reason: 'current skill has conditional next-skill actions' };
    }
    return { status: 'blocked', currentSkillKey: current.skillId };
  }

  canStartSkill(skillId: string, castId?: string, resolveSkillSlot = true): boolean {
    return this.#requireSkill(skillId, castId, resolveSkillSlot).canStart();
  }

  resolveSkillId(skillId: string, castId?: string, resolveSkillSlot = true): string {
    return this.#requireSkill(skillId, castId, resolveSkillSlot).skillId;
  }

  prepareSkillStartBlackboard(
    skillId: string,
    castId: string | undefined,
    values: Readonly<Record<string, number>>,
    resolveSkillSlot = true,
  ): void {
    const skill = this.#requireSkill(skillId, castId, resolveSkillSlot);
    if (skill.prepareStartBlackboard === undefined) {
      if (Object.keys(values).length > 0) {
        throw new Error(`skill '${skillId}' cannot receive start blackboard values`);
      }
      return;
    }
    skill.prepareStartBlackboard(values);
  }

  prepareSkillCastId(
    skillId: string,
    castId: string | undefined,
    skillCastId: number,
    resolveSkillSlot = true,
  ): void {
    const skill = this.#requireSkill(skillId, castId, resolveSkillSlot);
    if (skill.prepareSkillCastId === undefined) {
      throw new Error(`skill '${skillId}' cannot receive a prepared skill cast id`);
    }
    skill.prepareSkillCastId(skillCastId);
  }

  prepareCastInput(
    skillId: string,
    castId: string | undefined,
    input: {
      readonly skipApplyCost: boolean;
      readonly inputTarget?: import('../../game-data/logicalAbilityEntity').RuntimeTargetRef | null;
      readonly inheritedSkillCastInfo?: CombatSkillCastInfo;
      readonly producedBy?: import('../receipt/combatReceipt').CombatObjectRef;
    },
    resolveSkillSlot = true,
  ): void {
    const skill = this.#requireSkill(skillId, castId, resolveSkillSlot);
    if (skill.prepareCastInput === undefined) {
      throw new Error(`skill '${skillId}' cannot receive cast input`);
    }
    skill.prepareCastInput(input);
  }

  prepareAfterSkillCastStart(
    skillId: string,
    castId: string | undefined,
    preparation: SkillCastStartPreparation,
    resolveSkillSlot = true,
  ): void {
    const skill = this.#requireSkill(skillId, castId, resolveSkillSlot);
    if (skill.prepareAfterCastStart === undefined)
      throw new Error(`skill '${skillId}' cannot receive afterCastStart preparation`);
    skill.prepareAfterCastStart(preparation);
  }

  prepareBeforeSkillCastStart(
    skillId: string,
    castId: string | undefined,
    payload: import('../state/abilityState').BeforeSkillCastPreparation['payload'],
    resolveSkillSlot = true,
  ): void {
    const skill = this.#requireSkill(skillId, castId, resolveSkillSlot);
    this.runtimeState.beforeCastStarts.set(abilitySkillKey(skill), {
      skillId,
      castId,
      resolveSkillSlot,
      payload: structuredClone(payload),
    });
  }

  /** 先清除登记，再创建本次执行使用的附着入口；入口不会保存进状态。 */
  #takeBeforeCastStart(skill: AbilitySkillRuntime): (() => void) | undefined {
    const key = abilitySkillKey(skill);
    const preparation = takeBeforeSkillCastPreparation(this.runtimeState, key);
    if (preparation === undefined) return undefined;
    return () =>
      this.#emitBeforeSkillCast?.({
        ...preparation.payload,
        attachBuffToCurrentSkill: buff =>
          this.attachBuffToSkillCast(
            preparation.skillId,
            preparation.castId,
            preparation.payload.skillCastId,
            buff,
            preparation.resolveSkillSlot,
          ),
      });
  }

  attachBuffToSkillCast(
    skillId: string,
    castId: string | undefined,
    skillCastId: number,
    buff: BuffApplicationHandle,
    resolveSkillSlot = true,
  ): void {
    const skill = this.#requireSkill(skillId, castId, resolveSkillSlot);
    if (skill.attachBuffToCast === undefined) {
      throw new Error(`skill '${skillId}' cannot attach Buff instances`);
    }
    skill.attachBuffToCast(skillCastId, buff);
  }

  tryStartSkill(skillId: string, castId?: string): boolean {
    return this.#tryStartSkill(skillId, castId, true, false);
  }

  /** 时间轴玩家输入执行显式技能，不允许槽位解析静默替换其身份。 */
  tryStartTimelineSkill(skillId: string, castId?: string): boolean {
    return this.#tryStartSkill(skillId, castId, false, true);
  }

  /**
   * 实体按明确技能 ID 立即施放，不经过玩家槽位或延迟请求。
   * 投射物的 _CastSkill 会在查找技能前打断当前技能，普通能力实体没有这一步。
   * 来源可省略：不继承时由 SkillRuntime 分配本次施放身份。
   */
  tryStartEntitySkill(
    skillId: string,
    inheritedSkillCastInfo: CombatSkillCastInfo | undefined,
    inputTarget?: import('../../game-data/logicalAbilityEntity').RuntimeTargetRef,
    interruptCurrentSkill = false,
    prepareStart?: () => CombatSkillCastInfo,
  ): boolean {
    const current = this.#currentSkill?.state === 'casting' ? this.#currentSkill : null;
    if (interruptCurrentSkill) current?.interrupt('default');
    const skill = this.#skillsById.get(abilitySkillKey({ skillId }));
    if (skill === undefined || !skill.canStart() || skill.cooldown?.ready === false) return false;
    if (skill.prepareCastInput === undefined)
      throw new Error(`skill '${skillId}' cannot receive entity cast input`);
    const castInfo = prepareStart?.() ?? inheritedSkillCastInfo;
    // This preparation port stores cast input; it does not enqueue a deferred request.
    skill.prepareCastInput({
      skipApplyCost: false,
      ...(castInfo === undefined ? {} : { inheritedSkillCastInfo: Object.freeze({ ...castInfo }) }),
      inputTarget,
    });
    return this.#startAvailableSkill(skill, false);
  }

  #tryStartSkill(
    skillId: string,
    castId: string | undefined,
    resolveSkillSlot: boolean,
    forceTimelinePayment: boolean,
  ): boolean {
    const skill = this.#requireSkill(skillId, castId, resolveSkillSlot);
    if (!skill.canStart()) return false;
    return this.#startAvailableSkill(skill, forceTimelinePayment);
  }

  /** All immediate entrances share processing context, before-cast hooks and startup. */
  #startAvailableSkill(skill: AbilitySkillRuntime, forceTimelinePayment: boolean): boolean {
    const skillId = skill.skillId;
    if (forceTimelinePayment) {
      if (skill.prepareForcedTimelineCast === undefined) {
        throw new Error(`skill '${skillId}' cannot receive a forced timeline cast`);
      }
      skill.prepareForcedTimelineCast();
    }
    const previousSkill = this.#currentSkill?.state === 'casting' ? this.#currentSkill : null;
    const beforeCastStart = this.#takeBeforeCastStart(skill);

    if (
      skill.trySwitchToBuffCast?.(
        previousSkill?.skillCastInfo === undefined
          ? undefined
          : {
              skillType: previousSkill.skillType,
              skillCastInfo: previousSkill.skillCastInfo,
              get canInterrupt() {
                const value = previousSkill.canInterrupt;
                if (value === undefined) {
                  throw new Error(
                    `current skill '${previousSkill.skillId}' does not expose canInterrupt`,
                  );
                }
                return value;
              },
            },
        beforeCastStart,
        execute => this.#withProcessingSkill(skill, execute),
      ) === true
    ) {
      return true;
    }

    // 原生先登记新 CurrentSkill 并结束旧技能，再进入新技能的 BeforeCastStart。
    // 下一技能消费型 Buff 因而不会被旧技能随后发布的 SkillEnd 清掉。
    this.#currentSkill = skill;
    if (previousSkill !== null) this.#interruptForNextSkill(previousSkill, skill);
    if (beforeCastStart !== undefined) this.#withProcessingSkill(skill, beforeCastStart);
    if (!skill.tryStart()) {
      throw new Error(`skill '${skillId}' became unavailable during synchronous cast start`);
    }
    this.#onSkillCastStart(skill);
    this.#beginSkillOperableBoundary(skill);
    return true;
  }

  /** 同一帧多次写入会覆盖旧值；消费前先清槽，使消费期间的新请求留到下一帧。 */
  requestPostSkillCast(request: PostSkillCastRequest): void {
    this.#requireSkill(request.skillId, request.castId, request.resolveSkillSlot !== false);
    const inheritedSkillCastInfo = storePostSkillCastRequest(this.runtimeState, request);
    this.#onPostSkillCastRequest?.(inheritedSkillCastInfo);
  }

  /** 输入阶段提交新的放置块实例；技能定义和共享冷却必须已经登记。 */
  registerCastInstance(skill: AbilitySkillRuntime): void {
    if (skill.castId === undefined || skill.castId.length === 0)
      throw new Error('submitted skill instance requires a castId');
    const key = abilitySkillKey(skill);
    if (this.#skillsById.has(key)) throw new Error(`duplicate ability skill '${key}'`);
    const definition = this.#skillsById.get(abilitySkillKey({ skillId: skill.skillId }));
    if (definition === undefined)
      throw new Error(`submitted skill '${skill.skillId}' has no registered definition`);
    if (
      skill.skillType !== definition.skillType ||
      skill.nativeSkillType !== definition.nativeSkillType ||
      (skill.transitionSkillId ?? skill.skillId) !==
        (definition.transitionSkillId ?? definition.skillId)
    )
      throw new Error(`submitted skill '${skill.skillId}' disagrees with its definition`);
    const tickEntry = this.#skillTickPlan?.find(entry => entry.skillId === skill.skillId);
    if (this.#skillTickPlan !== undefined && tickEntry === undefined)
      throw new Error(`skill '${skill.skillId}' is missing from tick plan`);
    // 所有校验先完成，再同时更新寻址表和推进列表，失败不能留下半注册实例。
    this.#skillsById.set(key, skill);
    this.#skills.push(skill);
    tickEntry?.skills.push(skill);
  }

  advanceFrame(): void {
    const deltas = this.#resolveTickDeltas();
    if (this.#buffRuntime?.advanceWithDeltas !== undefined) {
      this.#buffRuntime.advanceWithDeltas(deltas);
    } else {
      this.#buffRuntime?.advanceFrame();
    }
    if (this.#skillTickPlan !== undefined) {
      for (const entry of this.#skillTickPlan) {
        // 同一个原生技能的多次摆放共享冷却，任一实例当帧 DoCast 都保护该账本。
        // 仅归零增量，不跳过 Tick：零时刻条件/动作仍有生命周期语义。
        entry.advanceCooldown(
          entry.skills.some(skill => skill.startedInCurrentFrame)
            ? 0
            : deltas.skillCooldownDeltaSeconds,
        );
        for (const skill of entry.skills) {
          // 此模式下冷却由目录唯一推进，技能实例不能再推进第二次。
          if (skill.advance !== undefined)
            skill.advance(skill.startedInCurrentFrame ? 0 : deltas.selfScaledDeltaSeconds, 0);
          else skill.advanceFrame();
          this.#publishRuntimeOperableBoundary(skill);
        }
      }
    } else {
      for (const skill of this.#skills) {
        if (skill.advance !== undefined) {
          skill.advance(
            skill.startedInCurrentFrame ? 0 : deltas.selfScaledDeltaSeconds,
            skill.startedInCurrentFrame ? 0 : deltas.skillCooldownDeltaSeconds,
          );
        } else {
          skill.advanceFrame();
        }
        this.#publishRuntimeOperableBoundary(skill);
      }
    }
    if (this.#operableBoundaries !== null) {
      const actualFrame = this.#resolveActualFrame!();
      for (const fact of this.#operableBoundaries.advance(
        deltas.selfScaledDeltaSeconds * COMBAT_FRAMES_PER_SECOND,
        actualFrame,
      )) {
        this.#onSkillOperableBoundaryReached!(fact);
      }
    }
    this.#commitComboOffsetTargetAtRecordFrame();
    if (this.#currentSkill?.state !== 'casting') this.#currentSkill = null;
    this.#advanceComboOffset(deltas.globalScaledDeltaSeconds * COMBAT_FRAMES_PER_SECOND);
    this.#flushPostSkillCastRequest();
    this.#buffRuntime?.recycleFinishedBuffs?.();
    this.#actionRuntime?.advanceFrame();
  }

  #flushPostSkillCastRequest(): void {
    const request = takePostSkillCastRequest(this.runtimeState);
    if (request === null) return;

    const previousSkill = this.#currentSkill?.state === 'casting' ? this.#currentSkill : null;
    const nextSkill = this.#requireSkill(
      request.skillId,
      request.castId,
      request.resolveSkillSlot !== false,
    );
    if (request.interruptCurrentSkillOnlyWhenTargetCastable === true && !nextSkill.canStart()) {
      this.#onPostSkillCastResolved?.(request, false);
      return;
    }
    // 与同步施放一致：旧技能结束回调应当能观察到已经登记的新 CurrentSkill。
    this.#currentSkill = nextSkill;
    if (previousSkill !== null) this.#interruptForNextSkill(previousSkill, nextSkill);
    this.#beforePostSkillCastStart?.(request);
    const beforeCastStart = this.#takeBeforeCastStart(nextSkill);
    beforeCastStart?.();
    const started = nextSkill.tryStart();
    if (started) {
      this.#onSkillCastStart(nextSkill);
      this.#beginSkillOperableBoundary(nextSkill);
    } else {
      this.#currentSkill = null;
    }
    this.#onPostSkillCastResolved?.(request, started);
  }

  #interruptForNextSkill(previousSkill: AbilitySkillRuntime, nextSkill: AbilitySkillRuntime): void {
    previousSkill.interrupt('castNextSkill', {
      nextSkillId: nextSkill.transitionSkillId ?? nextSkill.skillId,
      attachBuffToNextSkill: buff => {
        if (nextSkill.attachInheritedBuff === undefined) {
          throw new Error(`skill '${nextSkill.skillId}' cannot inherit Buff instances`);
        }
        nextSkill.attachInheritedBuff(buff);
      },
    });
  }

  #onSkillCastStart(skill: AbilitySkillRuntime): void {
    this.#onCurrentSkillChanged?.(this.nativeSkillTypeForSkill(skill.skillId));
    if (
      this.runtimeState.nativeSkillTypeBySkillId.get(skill.skillId) !== 'attack' ||
      skill.skillType === 'plungingAttack'
    )
      return;
    this.runtimeState.comboOffsetTargetSkillKey = skill.skillId;
    this.runtimeState.comboOffsetRecordedSkillKey = null;
    if (this.runtimeState.comboOffsetModifier !== null)
      this.runtimeState.comboOffsetModifier.skillCasted = true;
    if (skill.offsetRecordFrame === 0) this.#commitComboOffsetTargetAtRecordFrame();
  }

  #commitComboOffsetTargetAtRecordFrame(): void {
    const skill = this.#currentSkill?.state === 'casting' ? this.#currentSkill : null;
    if (
      skill === null ||
      this.runtimeState.nativeSkillTypeBySkillId.get(skill.skillId) !== 'attack' ||
      skill.skillType === 'plungingAttack' ||
      skill.offsetRecordFrame === undefined ||
      (skill.passedFrames ?? 0) + 0.0003 < skill.offsetRecordFrame
    )
      return;
    const identity = abilitySkillKey(skill);
    if (this.runtimeState.comboOffsetRecordedSkillKey === identity) return;
    const sequence = this.#currentNormalAttackSequence();
    if (sequence === null || sequence.length === 0) return;
    const currentIndex = sequence.indexOf(skill.skillId);
    const nextSkillKey = sequence[(currentIndex + 1) % sequence.length]!;
    this.#clearComboOffset(false);
    this.runtimeState.comboOffsetTargetSkillKey = nextSkillKey;
    this.runtimeState.comboOffsetRecordedSkillKey = identity;
  }

  #currentNormalAttackSequence(): readonly string[] | null {
    const modeSequences = [...this.runtimeState.activePlayerActionModeByLayer.values()].flatMap(
      modeId => {
        const sequence = this.#playerActionModes.get(modeId)?.normalAttackSkillKeys;
        return sequence === undefined ? [] : [sequence];
      },
    );
    if (modeSequences.length > 0) {
      const first = modeSequences[0]!;
      const hasConflict = modeSequences.some(
        sequence =>
          sequence.length !== first.length ||
          sequence.some((skillKey, index) => skillKey !== first[index]),
      );
      return hasConflict ? null : first;
    }
    const route = this.#playerActionRoutes?.basicAttack;
    return route?.kind === 'basicAttack' ? (route.normalAttackSkillKeys ?? null) : null;
  }

  #createComboOffset(trigger: 'dash' | 'skill' | 'jump', triggerSkillKey: string | null): boolean {
    const targetSkillKey = this.runtimeState.comboOffsetTargetSkillKey;
    if (targetSkillKey === null || this.#dashOffsetFrames === undefined) return false;
    this.#clearComboOffset(false);
    this.runtimeState.comboOffsetModifier = {
      trigger,
      triggerSkillKey,
      targetSkillKey,
      remainingFrames: this.#dashOffsetFrames,
      reduceDuration: trigger === 'dash',
      skillCasted: false,
    };
    return true;
  }

  #advanceComboOffset(deltaFrames: number): void {
    const offset = this.runtimeState.comboOffsetModifier;
    if (offset === null || !offset.reduceDuration) return;
    offset.remainingFrames -= deltaFrames;
    if (offset.remainingFrames <= 0.0003) this.#clearComboOffset(false);
  }

  #clearComboOffset(clearTarget: boolean): void {
    this.runtimeState.comboOffsetModifier = null;
    if (clearTarget) this.runtimeState.comboOffsetTargetSkillKey = null;
  }

  #beginSkillOperableBoundary(skill: AbilitySkillRuntime): void {
    if (
      this.#operableBoundaries === null ||
      skill.castId === undefined ||
      skill.timelineBlockFrames === undefined ||
      skill.timelineBlockFrames === 0
    ) {
      return;
    }
    // 一个场景放置身份只发布一次 UI 边界；技能槽替换或测试侧重复启动不伪造第二个块。
    if (this.runtimeState.registeredOperableBoundaryCastIds.has(skill.castId)) return;
    if (skill.usesRuntimeOperableBoundary === true) {
      this.#publishRuntimeOperableBoundary(skill);
      return;
    }
    this.runtimeState.registeredOperableBoundaryCastIds.add(skill.castId);
    this.#operableBoundaries.begin(
      skill.castId,
      skill.timelineBlockFrames,
      this.#resolveActualFrame!(),
    );
  }

  #publishRuntimeOperableBoundary(skill: AbilitySkillRuntime): void {
    if (
      skill.usesRuntimeOperableBoundary !== true ||
      skill.castId === undefined ||
      this.#resolveActualFrame === undefined ||
      this.#onSkillOperableBoundaryReached === undefined ||
      this.runtimeState.registeredOperableBoundaryCastIds.has(skill.castId)
    ) {
      return;
    }
    if (skill !== this.#currentSkill) return;
    const usesBasicAttackBoundary =
      skill.skillType === 'battleSkill' ||
      skill.skillType === 'comboSkill' ||
      skill.skillType === 'ultimate';
    if (skill.state !== 'casting') {
      if (
        (!usesBasicAttackBoundary && skill.timelineBlockFollowUpSkillId === undefined) ||
        skill.state !== 'ended'
      )
        return;
      // 参照操作没有可用路由时，技能实际结束仍是显示边界。
      skill.markOperableBoundaryReached?.();
    }
    if (skill.reachedOperableBoundaryFrame === undefined) {
      // 动作在 Timeline Tick 内写入候选，Skill.advance 返回时 passedFrames 可能已经推进；
      // 这里恰好消费一次，不能拿更新后的局部帧反查或把窗口留给未来路由。
      const frame = skill.currentTimelineFrame;
      if (frame === undefined) return;
      const candidate = skill.takeOperableBoundaryCandidate?.();
      const passedFrames = skill.passedFrames ?? frame;
      const directWindows =
        skill.requiresExecutedOperableBoundaryCandidate === true
          ? []
          : (skill.inputWindows?.allowedNextSkills ?? []).filter(
              window =>
                passedFrames + 0.0003 >= window.startFrame &&
                passedFrames <= window.endFrame + 0.0003,
            );
      const candidateSkillIds =
        candidate?.skillIds ?? skill.operableBoundaryCandidateSkillIds ?? [];
      const canEndBlock = (skillIds: readonly string[]) =>
        skill.timelineBlockFollowUpSkillId === undefined
          ? this.#hasRoutableAllowedNextSkill(skillIds, usesBasicAttackBoundary)
          : skillIds.includes(skill.timelineBlockFollowUpSkillId) &&
            this.#hasRoutableAllowedNextSkill([skill.timelineBlockFollowUpSkillId]);
      const routableDirectWindows = directWindows.filter(window => canEndBlock(window.skillIds));
      const candidateReachedNow = canEndBlock(candidateSkillIds);
      const candidatesReachedNow = routableDirectWindows.length > 0 || candidateReachedNow;
      if (!candidatesReachedNow && skill.canInterrupt !== true) return;
      if (
        !candidatesReachedNow &&
        skill.timelineBlockFollowUpSkillId !== undefined &&
        !this.#hasRoutableAllowedNextSkill([skill.timelineBlockFollowUpSkillId])
      )
        return;
      if (
        usesBasicAttackBoundary &&
        skill.timelineBlockFollowUpSkillId === undefined &&
        !candidatesReachedNow &&
        !this.#skills.some(
          next =>
            next.skillType === 'basicAttack' &&
            this.resolvePlayerInputSkill(next.skillId, 'basicAttack').status === 'matched',
        )
      )
        return;
      const allowedFrame = Math.min(
        ...(routableDirectWindows.length === 0 ? [] : [frame]),
        ...(!candidateReachedNow || candidate === undefined ? [] : [candidate.frame]),
      );
      skill.markOperableBoundaryReached?.(
        candidatesReachedNow && Number.isFinite(allowedFrame) ? allowedFrame : undefined,
      );
    }
    const durationFrames = skill.reachedOperableBoundaryFrame;
    // 起始帧就允许接续也是有效边界。消费者仍在下一实际帧放置输入，不能漏掉零帧事实。
    if (durationFrames === undefined || durationFrames < 0) return;
    this.runtimeState.registeredOperableBoundaryCastIds.add(skill.castId);
    this.#onSkillOperableBoundaryReached({
      castId: skill.castId,
      durationFrames,
      reachedAtFrame: this.#resolveActualFrame(),
    });
  }

  /** 只检查此刻玩家操作能够解析出的技能身份；费用、冷却和未来输入不参与当前块宽。 */
  #hasRoutableAllowedNextSkill(skillIds: readonly string[], basicAttackOnly = false): boolean {
    if (skillIds.length === 0 || this.#playerActionRoutes === undefined) return false;
    const allowedSkillKeys = new Set(
      skillIds.flatMap(skillId => {
        const keys = this.#skillKeysByTransitionSkillId.get(skillId);
        return keys?.size === 1 ? [[...keys][0]!] : [];
      }),
    );
    for (const [input, route] of Object.entries(this.#playerActionRoutes) as [
      PlayerSkillInput,
      NonNullable<
        import('../../game-data/operatorDefinition').OperatorPlayerActionRoutes
      >[PlayerSkillInput],
    ][]) {
      if (route === undefined) continue;
      if (basicAttackOnly && input !== 'basicAttack') continue;
      for (const skillKey of allowedSkillKeys) {
        if (
          basicAttackOnly &&
          !this.#skills.some(
            skill => skill.skillId === skillKey && skill.skillType === 'basicAttack',
          )
        )
          continue;
        if (this.resolvePlayerInputSkill(skillKey, input).status === 'matched') return true;
      }
    }
    return false;
  }

  #requireSkill(skillId: string, castId?: string, resolveSkillSlot = true): AbilitySkillRuntime {
    const slotGroupKey = resolveSkillSlot
      ? this.#slotGroupByStableInputSkill.get(skillId)
      : undefined;
    const slotGroup =
      slotGroupKey === undefined ? undefined : this.runtimeState.skillSlotGroups.get(slotGroupKey)!;
    const resolvedSkillId =
      slotGroup === undefined || slotGroup.currentSkillKey === slotGroup.baseSkillKey
        ? skillId
        : slotGroup.currentSkillKey;
    const skill = this.#skillsById.get(abilitySkillKey({ skillId: resolvedSkillId, castId }));
    if (skill === undefined) {
      const suffix = castId === undefined ? '' : ` (cast ${castId})`;
      throw new Error(`unknown ability skill '${resolvedSkillId}'${suffix}`);
    }
    return skill;
  }
}
