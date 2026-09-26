import { type TimelineRuntimeState } from '../state/actionState';
/**
 * 将现有动作对象连接到纯数据时间轴调度内核。
 * 动作内部状态尚未全部迁移，此绑定层本身不提供整场保存能力。
 */
import type { ActionSequenceState } from '../state/actionState';
import type { CombatExecutionContext } from '../actions/combatStep';
import { createTimelineActionState } from '../state/actionState';
import {
  compileTimelineActionIntervals,
  endTimelineActions,
  finishTimelineActions,
  jumpToTimelineActions,
  resetTimelineActions,
  tickTimelineActions,
  type TimelineActionExecutionHost,
  type TimelineActionInterval,
} from './timelineActionExecution';

/** 固定帧调度器消费的不可变行为区间。 */
export interface TimelineExecution<State> {
  readonly runtimeState: State;
  execute(context: CombatExecutionContext): void;
  reset(context: CombatExecutionContext): void;
  tick(deltaTime: number, context: CombatExecutionContext): void;
  end(context: CombatExecutionContext): void;
}

export interface TimelineAction<State = ActionSequenceState> {
  readonly startFrame: number;
  readonly endFrame?: number;
  readonly sequence: TimelineExecution<State>;
}

/** 调度行为开始和结束时调用的同步生命周期端口。 */
export interface TimelineActionLifecycleSink<State = ActionSequenceState> {
  started?(action: TimelineAction<State>, sourceIndex: number, currentFrame: number): void;
  ended?(action: TimelineAction<State>, sourceIndex: number, currentFrame: number): void;
}

/** 按固定帧运行区间；游标仅访问刚开始和仍活动的行为。 */
export class TimelineActionProcessor<State = ActionSequenceState> {
  readonly runtimeState: TimelineRuntimeState<State>;
  readonly #actions: readonly TimelineAction<State>[];
  readonly #program: readonly TimelineActionInterval[];
  readonly #state: ReturnType<typeof createTimelineActionState>;
  readonly #lifecycle: TimelineActionLifecycleSink<State>;

  constructor(
    actions: readonly TimelineAction<State>[],
    lifecycle: TimelineActionLifecycleSink<State> = {},
    state?: TimelineRuntimeState<State>,
  ) {
    this.#program = compileTimelineActionIntervals(actions);
    this.#actions = this.#program.map(interval => actions[interval.sourceIndex]!);
    if (state !== undefined) {
      if (state.scheduling.starting !== null)
        throw new Error('cannot bind timeline while an action is starting');
      if (
        state.sequences.length !== this.#actions.length ||
        this.#actions.some(
          (action, index) => action.sequence.runtimeState !== state.sequences[index],
        )
      )
        throw new Error('timeline sequences are not bound to the supplied state');
    }
    this.#state = state?.scheduling ?? createTimelineActionState();
    this.runtimeState = state ?? {
      scheduling: this.#state,
      sequences: this.#actions.map(action => action.sequence.runtimeState),
    };
    this.#lifecycle = lifecycle;
  }

  get isComplete(): boolean {
    return this.#state.nextPendingIndex === this.#program.length && this.#state.active.length === 0;
  }

  reset(context: CombatExecutionContext): void {
    resetTimelineActions(this.#state, this.#program, this.#host(context));
  }

  tick(currentFrame: number, deltaTime: number, context: CombatExecutionContext): void {
    tickTimelineActions(this.#state, this.#program, currentFrame, deltaTime, this.#host(context));
  }

  /** 向前跳转，目标帧上的待执行序列保留到下一次 Tick。 */
  jumpTo(destinationFrame: number, currentFrame: number, context: CombatExecutionContext): void {
    jumpToTimelineActions(
      this.#state,
      this.#program,
      destinationFrame,
      currentFrame,
      this.#host(context),
    );
  }

  /** 结束活动项，丢弃全部尚未开始项。 */
  finish(currentFrame: number, context: CombatExecutionContext): void {
    finishTimelineActions(this.#state, this.#program, currentFrame, this.#host(context));
  }

  end(currentFrame: number, context: CombatExecutionContext): void {
    endTimelineActions(this.#state, this.#program, currentFrame, this.#host(context));
  }

  #host(context: CombatExecutionContext): TimelineActionExecutionHost {
    return {
      reset: index => this.#actions[index]!.sequence.reset(context),
      execute: index => this.#actions[index]!.sequence.execute(context),
      tick: (index, deltaTime) => this.#actions[index]!.sequence.tick(deltaTime, context),
      end: index => this.#actions[index]!.sequence.end(context),
      started: (index, frame) =>
        this.#lifecycle.started?.(this.#actions[index]!, this.#program[index]!.sourceIndex, frame),
      ended: (index, frame) =>
        this.#lifecycle.ended?.(this.#actions[index]!, this.#program[index]!.sourceIndex, frame),
    };
  }
}

/** 所有宿主共用的入口绑定；保存数组按调度顺序排列，定义数组可不排序。 */
export function bindTimelineProgram<State>(
  actions: readonly { startFrame: number; endFrame?: number; sequence: CompiledGraphEntry }[],
  bind: (
    program: CompiledGraphEntry,
    sourceIndex: number,
    state?: State,
  ) => TimelineExecution<State>,
  lifecycle: TimelineActionLifecycleSink<State> = {},
  state?: TimelineRuntimeState<State>,
): TimelineActionProcessor<State> {
  let statesBySource: Map<number, State> | undefined;
  if (state) {
    if (state.sequences.length !== actions.length)
      throw new Error('timeline state does not match program length');
    statesBySource = new Map(
      compileTimelineActionIntervals(actions).map((interval, index) => [
        interval.sourceIndex,
        state.sequences[index]!,
      ]),
    );
  }
  return new TimelineActionProcessor(
    actions.map((action, index) => ({
      ...action,
      sequence: bind(action.sequence, index, statesBySource?.get(index)),
    })),
    lifecycle,
    state,
  );
}
import type { CompiledGraphEntry } from '../../compiler/combatProgram';
