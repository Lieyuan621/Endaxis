/**
 * 能力实体子技能的局部时间轴实例。
 *
 * 它只复用普通技能的动作序列解释器，不创建第二份施法、费用或冷却模型。
 */
import type { CompiledAbilityEntityChildSkillProgram } from '../../compiler/combatProgram';
import {
  logicalAbilityEntityRuntimeId,
  type AbilityEntityTargetRef,
} from '../../game-data/logicalAbilityEntity';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import type { CombatExecutionContext } from '../actions/combatStep';
import type { BuffApplicationHandle } from '../buffs/combatBuffs';
import type { DamageCalculationSnapshotProgram } from '../damage/damageCalculationSnapshots';
import { DamageCalculationSnapshots } from '../damage/damageCalculationSnapshots';
import type { CombatSemanticEventRuntime } from '../events/combatSemanticEventRuntime';
import type {
  CombatOperationContext,
  CombatOperationExecutor,
  ScheduleProjectileFinishCallback,
} from '../skills/skillRuntime';
import { isSkillTimelineJumpBeforeCurrent } from '../skills/skillTimelineJump';
import type { AbilityEntityChildSkillState } from '../state/abilityState';
import {
  createCombatOperationHostState,
  type CombatOperationHostState,
} from '../state/actionState';
import type { CombatSkillCastInfo } from '../state/foundationState';
import { COMBAT_FRAMES_PER_SECOND } from '../time/combatClock';
import type { TimelineActionProcessor } from '../timeline/timelineActionProcessor';
import type { CallbackSkillHostFactory } from './callbackSkillHost';
import type { LogicalAbilityEntityChildRuntime } from './logicalAbilityEntityRuntime';
import { RuntimeTargetContext } from './runtimeTargetContext';

export class AbilityEntityChildSkillRuntime implements LogicalAbilityEntityChildRuntime {
  readonly #context: CombatExecutionContext = {};
  readonly #operationContext: CombatOperationContext;
  readonly #sequenceRuntime: CombatActionSequenceRuntime;
  readonly #timeline: TimelineActionProcessor;
  readonly runtimeState: AbilityEntityChildSkillState;

  constructor(
    program: CompiledAbilityEntityChildSkillProgram,
    dependencies: {
      readonly entity: AbilityEntityTargetRef;
      readonly entityBlackboard: ActionBlackboard;
      readonly operations: CombatOperationExecutor;
      readonly ownerOperatorId: string;
      readonly semanticEvents?: CombatSemanticEventRuntime;
      readonly inheritedSkillCastInfo?: CombatSkillCastInfo;
      readonly addAbilityChildBuff?: (child: BuffApplicationHandle) => void;
      readonly scheduleProjectileFinishCallback?: ScheduleProjectileFinishCallback;
      readonly createCallbackSkillHost?: CallbackSkillHostFactory;
      readonly programId: number;
      readonly damageSnapshotProgram: DamageCalculationSnapshotProgram;
      readonly operationState?: CombatOperationHostState;
    },
    restored?: {
      readonly state: AbilityEntityChildSkillState;
    },
  ) {
    if (restored !== undefined && restored.state.programId !== dependencies.programId) {
      throw new Error(
        `restored AbilityEntity child program '${restored.state.programId}' does not match '${dependencies.programId}'`,
      );
    }
    if (restored !== undefined && restored.state.skillId !== program.skillId) {
      throw new Error(
        `restored AbilityEntity child skill '${restored.state.skillId}' does not match '${program.skillId}'`,
      );
    }
    // 原生实体技能先有自身 SkillData 默认值，再由 SpawnAbilityEntity.assignBlackboard
    // 的来源快照覆盖同名 direct key；实体黑板仍作为 EntityBB_ 的后备所有者。
    if (
      restored !== undefined &&
      restored.state.blackboard.entity !== dependencies.entityBlackboard.runtimeState
    ) {
      throw new Error('restored AbilityEntity child skill must use the restored entity blackboard');
    }
    const blackboard =
      restored === undefined
        ? new ActionBlackboard(
            { ...program.initialBlackboard, ...dependencies.entityBlackboard.snapshot() },
            dependencies.entityBlackboard,
          )
        : ActionBlackboard.bindRuntimeState(restored.state.blackboard);
    const runtime = this;
    this.#operationContext = {
      blackboard,
      damageCalculationSnapshots: new DamageCalculationSnapshots(
        dependencies.damageSnapshotProgram,
        restored?.state.damageSnapshots,
      ),
      targetContext: new RuntimeTargetContext(restored?.state.targets),
      currentTarget: dependencies.entity,
      actionOwnerAbilityEntity: dependencies.entity,
      requestTimelineJump: destinationFrame => this.#requestTimelineJump(destinationFrame),
      requestTimelineFinish: () => this.#requestTimelineFinish(),
      getCurrentTimelineFrame: () => roundToEven(runtime.runtimeState.passedFrames),
      ...(dependencies.addAbilityChildBuff === undefined
        ? {}
        : { addAbilityChildBuff: dependencies.addAbilityChildBuff }),
      ...(dependencies.inheritedSkillCastInfo === undefined
        ? {}
        : { skillCastInfo: dependencies.inheritedSkillCastInfo }),
      ...(dependencies.scheduleProjectileFinishCallback === undefined
        ? {}
        : { scheduleProjectileFinishCallback: dependencies.scheduleProjectileFinishCallback }),
      ...(dependencies.createCallbackSkillHost === undefined
        ? {}
        : { createCallbackSkillHost: dependencies.createCallbackSkillHost }),
    };
    this.#sequenceRuntime = new CombatActionSequenceRuntime(
      dependencies.operations,
      this.#operationContext,
      {},
      dependencies.semanticEvents,
      logicalAbilityEntityRuntimeId(dependencies.entity.instanceId),
      restored?.state.scopes,
    );
    this.#timeline = this.#sequenceRuntime.createTimeline(
      program.timelineActions,
      {},
      restored?.state.timeline,
    );
    const operationState =
      restored?.state.operations ?? dependencies.operationState ?? createCombatOperationHostState();
    if (
      restored !== undefined &&
      dependencies.operationState !== undefined &&
      dependencies.operationState !== restored.state.operations
    ) {
      throw new Error('restored AbilityEntity child skill must use restored operation state');
    }
    this.runtimeState = restored?.state ?? {
      programId: dependencies.programId,
      skillId: program.skillId,
      passedFrames: 0,
      started: false,
      finished: false,
      blackboard: blackboard.runtimeState,
      targets: this.#operationContext.targetContext!.runtimeState,
      scopes: this.#sequenceRuntime.scopeState,
      timeline: this.#timeline.runtimeState,
      damageSnapshots: this.#operationContext.damageCalculationSnapshots!.runtimeState,
      operations: operationState,
    };
  }

  /** 固定动作身份映射由同一切面树共享；其中不保存分支内的伤害数值。 */
  get damageSnapshotProgram(): DamageCalculationSnapshotProgram {
    return this.#operationContext.damageCalculationSnapshots!.program;
  }

  start(): void {
    if (this.runtimeState.started) throw new Error('AbilityEntity child skill has already started');
    this.runtimeState.started = true;
    this.#sequenceRuntime.reset();
    this.#operationContext.damageCalculationSnapshots!.clear();
    this.#timeline.reset(this.#context);
    // 与普通技能一致，生成当帧立即执行一次零增量 Tick。
    this.#timeline.tick(0, 0, this.#context);
  }

  advance(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) {
      throw new RangeError('AbilityEntity child skill delta must be non-negative and finite');
    }
    if (!this.runtimeState.started || this.runtimeState.finished || this.#timeline.isComplete)
      return;
    this.runtimeState.passedFrames += deltaSeconds * COMBAT_FRAMES_PER_SECOND;
    this.#timeline.tick(this.runtimeState.passedFrames, deltaSeconds, this.#context);
  }

  finish(): void {
    if (!this.runtimeState.started || this.runtimeState.finished) return;
    this.runtimeState.finished = true;
    this.#timeline.end(this.runtimeState.passedFrames, this.#context);
  }

  #requestTimelineJump(destinationFrame: number): void {
    if (!this.runtimeState.started || this.runtimeState.finished) {
      throw new Error('AbilityEntity child skill cannot jump outside an active timeline');
    }
    if (isSkillTimelineJumpBeforeCurrent(destinationFrame, this.runtimeState.passedFrames)) return;
    this.#timeline.jumpTo(
      destinationFrame,
      Math.min(destinationFrame, this.runtimeState.passedFrames),
      this.#context,
    );
    this.runtimeState.passedFrames = destinationFrame;
  }

  #requestTimelineFinish(): void {
    if (!this.runtimeState.started || this.runtimeState.finished) {
      throw new Error('AbilityEntity child skill cannot finish outside an active timeline');
    }
    this.#timeline.finish(this.runtimeState.passedFrames, this.#context);
  }
}

function roundToEven(value: number): number {
  const lower = Math.floor(value);
  const fraction = value - lower;
  if (fraction < 0.5) return lower;
  if (fraction > 0.5) return lower + 1;
  return lower % 2 === 0 ? lower : lower + 1;
}
