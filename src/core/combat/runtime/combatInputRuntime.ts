import { type ScheduledSkillInput } from '../state/environmentState';
/**
 * 在原生 PlayerController 所在的 Frame 阶段消费已编译施放输入。
 * 输入必须按帧有序；同帧输入保持声明顺序，不能在运行时按干员或技能身份重排。
 */
import type { CombatInputExecution } from '../skills/combatInputExecution';
import { sameSkillSimulationInputs } from '../skills/skillSimulationInputs';
import type {
  CombatInputRuntimeState,
  SkillInputGroupRuntimeState,
} from '../state/environmentState';
import type { CombatClock } from '../time/combatClock';
import type { FrameRuntime } from './combatSimulation';

/** 一条持久连续组；禁用成员已由编译器跳过，锚点身份仍指向原始组头。 */
export interface SkillInputGroup {
  readonly anchorCastId: string;
  readonly castIds: readonly string[];
}

interface SkillInputGroupRuntime {
  readonly inputs: readonly ScheduledSkillInput[];
  readonly state: SkillInputGroupRuntimeState;
}

export interface CombatInputRuntimeOptions {
  readonly clock: Pick<CombatClock, 'frame'>;
  readonly inputs: readonly ScheduledSkillInput[];
  readonly execution: CombatInputExecution;
  readonly skillInputGroups?: {
    readonly groups: readonly SkillInputGroup[];
    /** 只检查前段实际块边界；不把技能路由或资源许可变成自动等待条件。 */
    readonly canContinue: (previous: ScheduledSkillInput) => boolean;
  };
  /** 仅供临时放置规划：锚定首段，按真实输入阶段寻找后续段的接续帧。 */
  readonly continuationPlan?: {
    readonly castIds: readonly string[];
    readonly canContinue: (input: ScheduledSkillInput, previous: ScheduledSkillInput) => boolean;
    readonly ignoreInputFailures?: boolean;
  };
  /** 恢复时绑定已经复制的输入游标；固定输入与组程序仍由当前编译结果提供。 */
  readonly restoredState?: CombatInputRuntimeState;
}

/** 保持输入顺序并在当前帧同步提交施放请求。 */
export class CombatInputRuntime implements FrameRuntime {
  readonly runtimeState: CombatInputRuntimeState;
  readonly #clock: Pick<CombatClock, 'frame'>;
  readonly #inputs: readonly ScheduledSkillInput[];
  readonly #execution: CombatInputExecution;
  readonly #continuationInputs: readonly ScheduledSkillInput[];
  readonly #canContinue: CombatInputRuntimeOptions['continuationPlan'];
  readonly #groups: readonly SkillInputGroupRuntime[];
  readonly #groupByCastId = new Map<string, SkillInputGroupRuntime>();
  readonly #groupOptions: CombatInputRuntimeOptions['skillInputGroups'];
  readonly #declarationOrder = new Map<ScheduledSkillInput, number>();

  constructor(options: CombatInputRuntimeOptions) {
    this.#clock = options.clock;
    this.#execution = options.execution;
    this.#groupOptions = options.skillInputGroups;
    let previousFrame = Number.NEGATIVE_INFINITY;
    for (const [index, input] of options.inputs.entries()) {
      if (!Number.isInteger(input.frame)) {
        throw new RangeError(`inputs[${index}].frame must be an integer`);
      }
      if (input.frame < previousFrame) {
        throw new Error('scheduled skill inputs must be ordered by frame');
      }
      previousFrame = input.frame;
      this.#declarationOrder.set(input, input.declarationOrder ?? index);
    }
    this.#canContinue = options.continuationPlan;
    const castIds = options.continuationPlan?.castIds ?? [];
    if (options.continuationPlan !== undefined) {
      if (castIds.length < 2 || new Set(castIds).size !== castIds.length) {
        throw new Error('continuation plan requires at least two unique cast IDs');
      }
      this.#continuationInputs = castIds.map(castId => {
        const matches = options.inputs.filter(input => input.castId === castId);
        if (matches.length !== 1) {
          throw new Error(`continuation plan cast '${castId}' must match exactly one input`);
        }
        return matches[0]!;
      });
      if (
        this.#continuationInputs.some(
          input => input.operatorId !== this.#continuationInputs[0]!.operatorId,
        )
      ) {
        throw new Error('continuation plan inputs must belong to the same operator');
      }
    } else {
      this.#continuationInputs = [];
    }
    const deferredCastIds = new Set(castIds.slice(1));
    const inputsByCastId = new Map<string, ScheduledSkillInput[]>();
    for (const input of options.inputs) {
      if (input.castId === undefined) continue;
      const matches = inputsByCastId.get(input.castId) ?? [];
      matches.push(input);
      inputsByCastId.set(input.castId, matches);
    }
    const anchors = new Set<string>();
    const restoredGroups = options.restoredState?.groups;
    if (
      restoredGroups !== undefined &&
      restoredGroups.length !== (options.skillInputGroups?.groups.length ?? 0)
    ) {
      throw new Error('restored skill input groups do not match program length');
    }
    this.#groups = (options.skillInputGroups?.groups ?? []).map((group, groupIndex) => {
      if (group.anchorCastId.length === 0 || anchors.has(group.anchorCastId))
        throw new Error('skill input groups require unique non-empty anchors');
      anchors.add(group.anchorCastId);
      if (group.castIds.length === 0) throw new Error('skill input group has no enabled members');
      const inputs = group.castIds.map(castId => {
        const matches = inputsByCastId.get(castId);
        if (matches?.length !== 1)
          throw new Error(`skill input group cast '${castId}' must match exactly one input`);
        if (this.#groupByCastId.has(castId) || castIds.includes(castId))
          throw new Error(`skill input group cast '${castId}' belongs to multiple groups`);
        return matches[0]!;
      });
      if (new Set(group.castIds).size !== group.castIds.length)
        throw new Error('skill input group requires unique cast IDs');
      if (inputs.some(input => input.operatorId !== inputs[0]!.operatorId))
        throw new Error('skill input group inputs must belong to the same operator');
      const restored = restoredGroups?.[groupIndex];
      if (restored !== undefined && restored.anchorCastId !== group.anchorCastId) {
        throw new Error(`restored skill input group '${groupIndex}' does not match anchor`);
      }
      const state: SkillInputGroupRuntimeState = restored ?? {
        anchorCastId: group.anchorCastId,
        nextIndex: 0,
        previous: null,
        stopped: false,
      };
      validateGroupState(state, inputs, this.#clock.frame);
      const runtime = { inputs, state };
      group.castIds.forEach(castId => this.#groupByCastId.set(castId, runtime));
      group.castIds.slice(1).forEach(castId => deferredCastIds.add(castId));
      return runtime;
    });
    this.#inputs = options.inputs.filter(
      input => input.castId === undefined || !deferredCastIds.has(input.castId),
    );
    this.runtimeState = options.restoredState ?? {
      nextInputIndex: 0,
      previousFixedInput: null,
      continuation: { nextIndex: 1, previous: null, stopped: false },
      groups: this.#groups.map(group => group.state),
    };
    if (
      !Number.isSafeInteger(this.runtimeState.nextInputIndex) ||
      this.runtimeState.nextInputIndex < 0 ||
      this.runtimeState.nextInputIndex > this.#inputs.length
    ) {
      throw new Error('restored fixed input cursor is out of range');
    }
    const expectedPreviousFixedInput =
      this.runtimeState.nextInputIndex === 0
        ? null
        : this.#inputs[this.runtimeState.nextInputIndex - 1]!;
    if (
      !sameScheduledSkillInput(this.runtimeState.previousFixedInput, expectedPreviousFixedInput)
    ) {
      throw new Error('restored fixed input prefix does not match program');
    }
    validateContinuationState(
      this.runtimeState.continuation,
      this.#continuationInputs,
      this.#clock.frame,
    );
  }

  advanceFrame(): void {
    this.applyCurrentFrame();
  }

  /** 装配完成后调用一次可消费发生在初始第 0 帧的输入。 */
  applyCurrentFrame(): void {
    const actualFrame = this.#clock.frame;
    const ready: {
      readonly input: ScheduledSkillInput;
      readonly group?: SkillInputGroupRuntime;
      readonly order: number;
    }[] = [];
    while (true) {
      const input = this.#inputs[this.runtimeState.nextInputIndex];
      if (input === undefined || input.frame > actualFrame) break;
      this.runtimeState.nextInputIndex += 1;
      this.runtimeState.previousFixedInput = input;
      ready.push({ input, order: this.#declarationOrder.get(input)! });
    }
    // 就绪状态在输入阶段开始时读取；本帧刚启动的组不能在同帧再推进一段。
    for (const group of this.#groups) {
      const previous = group.state.previous;
      const input = group.inputs[group.state.nextIndex];
      if (
        group.state.stopped ||
        previous === null ||
        input === undefined ||
        actualFrame <= previous.frame ||
        !this.#groupOptions!.canContinue(previous)
      )
        continue;
      ready.push({
        input: { ...input, frame: actualFrame },
        group,
        order: this.#declarationOrder.get(input)!,
      });
    }
    ready.sort((left, right) => left.input.frame - right.input.frame || left.order - right.order);
    for (const candidate of ready) {
      const { input } = candidate;
      if (candidate.group?.state.stopped) continue;
      const anchor = this.#continuationInputs[0];
      if (
        anchor !== undefined &&
        input.castId !== anchor.castId &&
        input.operatorId === anchor.operatorId &&
        this.runtimeState.continuation.previous !== null &&
        this.#canContinue?.ignoreInputFailures !== true
      ) {
        // Never move a generated continuation past another authored operation on this operator.
        this.runtimeState.continuation.stopped = true;
      }
      const accepted = this.#processInput(input);
      const ownGroup =
        input.castId === undefined ? undefined : this.#groupByCastId.get(input.castId);
      if (ownGroup !== undefined) {
        ownGroup.state.previous = { ...input, frame: actualFrame };
        ownGroup.state.nextIndex += 1;
        if (!accepted) this.#stopGroup(ownGroup, 'inputRejected');
      }
      if (candidate.group === undefined && accepted) {
        this.#stopOtherGroupsForInput(input, ownGroup);
      }
      if (anchor !== undefined && input.castId === anchor.castId) {
        this.runtimeState.continuation.previous = { ...input, frame: actualFrame };
        if (!accepted && this.#canContinue?.ignoreInputFailures !== true)
          this.runtimeState.continuation.stopped = true;
      }
    }
    const previous = this.runtimeState.continuation.previous;
    const continuation = this.#continuationInputs[this.runtimeState.continuation.nextIndex];
    if (
      this.runtimeState.continuation.stopped ||
      previous === null ||
      continuation === undefined ||
      actualFrame <= previous.frame
    )
      return;
    const input = { ...continuation, frame: actualFrame };
    if (!this.#canContinue!.canContinue(input, previous)) return;
    // At most one continuation per real frame, including repeated applyCurrentFrame calls.
    this.runtimeState.continuation.nextIndex += 1;
    this.runtimeState.continuation.previous = input;
    const accepted = this.#processInput(input);
    if (accepted) this.#stopOtherGroupsForInput(input);
    if (!accepted && this.#canContinue?.ignoreInputFailures !== true)
      this.runtimeState.continuation.stopped = true;
  }

  #stopOtherGroupsForInput(input: ScheduledSkillInput, ownGroup?: SkillInputGroupRuntime): void {
    for (const group of this.#groups) {
      if (
        group === ownGroup ||
        group.state.stopped ||
        group.state.previous === null ||
        group.state.previous.operatorId !== input.operatorId ||
        group.inputs[group.state.nextIndex] === undefined
      )
        continue;
      // 另一项作者操作已接管本轨道。即使前段自然结束而没有中断回执，也不跨过它补放旧组。
      this.#stopGroup(group, 'interruptedByFixedInput', input.castId);
    }
  }

  #stopGroup(
    group: SkillInputGroupRuntime,
    reason: 'inputRejected' | 'interruptedByFixedInput',
    interruptingCastId?: string,
  ): void {
    group.state.stopped = true;
    const next = group.inputs[group.state.nextIndex];
    // 最后一段失败已有输入回执；只有尚未启动的后缀需要额外阻断事实。
    if (next === undefined || group.state.previous === null) return;
    this.#execution.groupBlocked({
      frame: this.#clock.frame,
      operatorId: group.state.previous.operatorId,
      anchorCastId: group.state.anchorCastId,
      castId: next.castId!,
      previousCastId: group.state.previous.castId!,
      reason,
      ...(interruptingCastId === undefined ? {} : { interruptingCastId }),
    });
  }

  #processInput(input: ScheduledSkillInput): boolean {
    return this.#execution.submit(input, this.#clock.frame);
  }
}

function sameScheduledSkillInput(
  left: ScheduledSkillInput | null,
  right: ScheduledSkillInput | null,
): boolean {
  return (
    left === right ||
    (left !== null &&
      right !== null &&
      left.frame === right.frame &&
      left.operatorId === right.operatorId &&
      left.skillId === right.skillId &&
      left.action === right.action &&
      left.castId === right.castId &&
      sameSkillSimulationInputs(left.simulationInputs, right.simulationInputs) &&
      left.declarationOrder === right.declarationOrder)
  );
}

function validateGroupState(
  state: SkillInputGroupRuntimeState,
  inputs: readonly ScheduledSkillInput[],
  currentFrame: number,
): void {
  if (
    !Number.isSafeInteger(state.nextIndex) ||
    state.nextIndex < 0 ||
    state.nextIndex > inputs.length
  )
    throw new Error(`restored skill input group '${state.anchorCastId}' cursor is out of range`);
  const expectedPrevious = state.nextIndex === 0 ? undefined : inputs[state.nextIndex - 1];
  if (
    (expectedPrevious === undefined) !== (state.previous === null) ||
    (expectedPrevious !== undefined && !sameInputIdentity(expectedPrevious, state.previous!)) ||
    (state.previous !== null && state.previous.frame > currentFrame)
  ) {
    throw new Error(
      `restored skill input group '${state.anchorCastId}' previous input does not match`,
    );
  }
}

function validateContinuationState(
  state: CombatInputRuntimeState['continuation'],
  inputs: readonly ScheduledSkillInput[],
  currentFrame: number,
): void {
  const maximum = Math.max(1, inputs.length);
  if (!Number.isSafeInteger(state.nextIndex) || state.nextIndex < 1 || state.nextIndex > maximum)
    throw new Error('restored continuation input cursor is out of range');
  if (state.previous === null) {
    if (state.nextIndex !== 1) {
      throw new Error('restored continuation previous input does not match');
    }
    return;
  }
  const expectedPrevious = inputs.length === 0 ? undefined : inputs[state.nextIndex - 1];
  if (
    expectedPrevious === undefined ||
    !sameInputIdentity(expectedPrevious, state.previous) ||
    state.previous.frame > currentFrame
  ) {
    throw new Error('restored continuation previous input does not match');
  }
}

function sameInputIdentity(left: ScheduledSkillInput, right: ScheduledSkillInput): boolean {
  return (
    left.operatorId === right.operatorId &&
    left.skillId === right.skillId &&
    left.castId === right.castId &&
    left.action === right.action &&
    left.declarationOrder === right.declarationOrder
  );
}
