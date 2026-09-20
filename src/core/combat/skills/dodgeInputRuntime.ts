import type { DodgeInputRuntimeState, ScheduledDodgeInput } from '../state/environmentState';
import type { CombatClock } from '../time/combatClock';
import type { CombatReceiptSink } from '../receipt/combatReceipt';

export const DODGE_FORCED_REASONS = [
  'operatorNotControlled',
  'perfectDodgeDashBlocked',
  'repeatDashTooEarly',
  'multiDashLimitReached',
  'ultimateCannotDash',
  'inImmobilized',
  'inDisableDash',
  'hasSuperArmor',
  'playerActionDisabled',
  'movementGaitTooLow',
  'isInAir',
] as const;
export const DODGE_UNKNOWN_REASONS = [
  'missingDashTiming',
  'missingDodgeProgram',
  'missingDashTagRules',
] as const;

/** 输入执行、作者声明、原生技能启动是三种不同事实。所有回执统一使用 dodgeId。 */
interface DodgeReceiptDetails {
  DashInputExecuted: {
    direction: 'forward' | 'backward';
    timingKnown: boolean;
    interruptedSkillId?: string;
    interruptedCastId?: string;
    interruptedNativeSkillType?: string;
  };
  DodgeInputForced: Partial<Record<(typeof DODGE_FORCED_REASONS)[number], boolean>> & {
    interruptedSkillId?: string;
    interruptedTimelineFrame?: number | undefined;
  };
  DodgeInputPartiallySimulated: Partial<Record<(typeof DODGE_UNKNOWN_REASONS)[number], boolean>>;
  PerfectDodgeDeclared: Record<string, never>;
  PerfectDodgeSkillStarted: Record<string, never>;
  PerfectDodgeDeclarationForced: { missingDodgeProgram: boolean; dashNotActive: boolean };
  PerfectDodgeDeclarationRejected: {
    reason: 'missingAbilityEventPublisher' | 'nativeSuccessNotTriggered' | 'nativeSkillNotStarted';
  };
}
type DodgeReceiptFact = {
  [Event in keyof DodgeReceiptDetails]: { event: Event; data: DodgeReceiptDetails[Event] };
}[keyof DodgeReceiptDetails];

/** 由输入协议统一写入身份与来源，避免生产者和详情各自约定字段名。 */
export function recordDodgeReceipt(
  receipt: CombatReceiptSink,
  clock: Pick<CombatClock, 'frame' | 'time'>,
  operatorId: string,
  dodgeId: string,
  fact: DodgeReceiptFact,
): void {
  receipt.record({
    frame: clock.frame,
    time: clock.time,
    event: fact.event,
    sourceId: operatorId,
    producedBy: { kind: 'action', ownerId: operatorId, actionId: `dash:${dodgeId}` },
    data: { ...fact.data, dodgeId },
  });
}

export interface DodgeInputRuntimeOptions {
  readonly clock: Pick<CombatClock, 'frame'>;
  readonly inputs: readonly ScheduledDodgeInput[];
  readonly executeDash: (input: Extract<ScheduledDodgeInput, { readonly kind: 'dash' }>) => void;
  readonly declarePerfectDodgeSuccess: (
    input: Extract<ScheduledDodgeInput, { readonly kind: 'perfectDodgeSuccess' }>,
  ) => void;
}

/** 按固定帧消费 Dash 输入和人工成功事实；未来输入仍保存在程序侧。 */
export class DodgeInputRuntime {
  readonly #clock: DodgeInputRuntimeOptions['clock'];
  readonly #inputs: readonly ScheduledDodgeInput[];
  readonly #executeDash: DodgeInputRuntimeOptions['executeDash'];
  readonly #declarePerfectDodgeSuccess: DodgeInputRuntimeOptions['declarePerfectDodgeSuccess'];

  constructor(options: DodgeInputRuntimeOptions, state: DodgeInputRuntimeState) {
    this.#clock = options.clock;
    this.#inputs = [...options.inputs];
    this.#executeDash = options.executeDash;
    this.#declarePerfectDodgeSuccess = options.declarePerfectDodgeSuccess;
    let previousFrame = Number.NEGATIVE_INFINITY;
    for (const [index, input] of this.#inputs.entries()) {
      if (!Number.isSafeInteger(input.frame))
        throw new RangeError(`dodgeInputs[${index}].frame must be a safe integer`);
      if (input.frame < previousFrame)
        throw new Error('scheduled dodge inputs must be ordered by frame');
      if (input.dodgeId.length === 0 || input.operatorId.length === 0)
        throw new TypeError(`dodgeInputs[${index}] requires stable dodge and operator identities`);
      previousFrame = input.frame;
    }
    if (
      !Number.isSafeInteger(state.nextInputIndex) ||
      state.nextInputIndex < 0 ||
      state.nextInputIndex > this.#inputs.length
    )
      throw new Error('restored dodge input cursor is out of range');
    const previous = state.nextInputIndex === 0 ? null : this.#inputs[state.nextInputIndex - 1]!;
    if (!sameDodgeInput(state.previousInput, previous))
      throw new Error('restored dodge input prefix does not match program');
  }

  applyCurrentFrame(state: DodgeInputRuntimeState): void {
    while (true) {
      const input = this.#inputs[state.nextInputIndex];
      if (input === undefined || input.frame > this.#clock.frame) return;
      this.applyInput(state, input);
      state.nextInputIndex += 1;
      state.previousInput = input;
    }
  }

  applyInput(state: DodgeInputRuntimeState, input: ScheduledDodgeInput): void {
    const submitted = input.kind === 'dash' ? state.executedDashIds : state.declaredSuccessIds;
    if (submitted.has(input.dodgeId))
      throw new Error(`duplicate ${input.kind} input '${input.dodgeId}'`);
    submitted.add(input.dodgeId);
    if (input.kind === 'dash') this.#executeDash(input);
    else this.#declarePerfectDodgeSuccess(input);
  }
}

function sameDodgeInput(
  left: ScheduledDodgeInput | null,
  right: ScheduledDodgeInput | null,
): boolean {
  if (left === right) return true;
  if (
    left === null ||
    right === null ||
    left.kind !== right.kind ||
    left.frame !== right.frame ||
    left.dodgeId !== right.dodgeId ||
    left.operatorId !== right.operatorId
  )
    return false;
  return (
    left.kind === 'perfectDodgeSuccess' ||
    (right.kind === 'dash' && left.direction === right.direction)
  );
}
