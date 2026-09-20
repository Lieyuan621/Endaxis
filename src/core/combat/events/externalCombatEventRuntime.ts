import {
  type ExternalCombatEventInput,
  type ScheduledExternalCombatEventInput,
} from '../state/environmentState';
/** 用户时间轴上的连携冷却控制。 */
import type { FrameRuntime } from '../runtime/combatSimulation';
import type { ExternalCombatEventRuntimeState } from '../state/environmentState';
import type { CombatClock } from '../time/combatClock';

export interface ExternalCombatEventRuntimeOptions {
  readonly controlComboCooldown?: (operatorId: string, mode: 'cooldown' | 'ready') => void;
  readonly clock: CombatClock;
  readonly events: readonly ScheduledExternalCombatEventInput[];
  readonly restoredState?: ExternalCombatEventRuntimeState;
}

export class ExternalCombatEventRuntime implements FrameRuntime {
  readonly runtimeState: ExternalCombatEventRuntimeState;
  readonly #controlComboCooldown: ExternalCombatEventRuntimeOptions['controlComboCooldown'];
  readonly #clock: CombatClock;
  readonly #events: readonly ScheduledExternalCombatEventInput[];

  constructor(options: ExternalCombatEventRuntimeOptions) {
    this.#controlComboCooldown = options.controlComboCooldown;
    this.#clock = options.clock;
    this.#events = [...options.events];
    let previousFrame = -1;
    for (const [index, input] of this.#events.entries()) {
      if (!Number.isInteger(input.frame) || input.frame < 0) {
        throw new RangeError(`events[${index}].frame must be a non-negative integer`);
      }
      if (
        input.targetOperatorIds.length === 0 ||
        input.targetOperatorIds.some(id => id.length === 0)
      ) {
        throw new TypeError(`events[${index}].targetOperatorIds must not be empty`);
      }
      if (input.frame < previousFrame) {
        throw new Error('scheduled external event inputs must be ordered by frame');
      }
      previousFrame = input.frame;
    }
    this.runtimeState = options.restoredState ?? { nextEventIndex: 0, previousEvent: null };
    if (
      !Number.isSafeInteger(this.runtimeState.nextEventIndex) ||
      this.runtimeState.nextEventIndex < 0 ||
      this.runtimeState.nextEventIndex > this.#events.length
    ) {
      throw new Error('restored external event cursor is out of range');
    }
    const expectedPreviousEvent =
      this.runtimeState.nextEventIndex === 0
        ? null
        : this.#events[this.runtimeState.nextEventIndex - 1]!;
    if (!sameExternalEventInput(this.runtimeState.previousEvent, expectedPreviousEvent)) {
      throw new Error('restored external event prefix does not match program');
    }
  }

  advanceFrame(): void {
    this.applyCurrentFrame();
  }

  applyCurrentFrame(): void {
    const actualFrame = this.#clock.frame;
    while (true) {
      const input = this.#events[this.runtimeState.nextEventIndex];
      if (input === undefined || input.frame > actualFrame) break;
      this.runtimeState.nextEventIndex += 1;
      this.runtimeState.previousEvent = input;
      this.#processInput(input);
    }
  }

  /** 已提交的本帧事实；不改变排程游标，也不保留调用方的输入对象。 */
  applyInput(input: ExternalCombatEventInput): void {
    if (
      input.targetOperatorIds.length === 0 ||
      input.targetOperatorIds.some(id => id.length === 0)
    ) {
      throw new TypeError('external event targetOperatorIds must not be empty');
    }
    this.#processInput({ ...input, frame: this.#clock.frame });
  }

  #processInput(input: ScheduledExternalCombatEventInput): void {
    if (this.#controlComboCooldown === undefined)
      throw new Error('combo cooldown control handler is missing');
    for (const operatorId of input.targetOperatorIds) {
      this.#controlComboCooldown(operatorId, input.event.mode);
    }
  }
}

function sameExternalEventInput(
  left: ScheduledExternalCombatEventInput | null,
  right: ScheduledExternalCombatEventInput | null,
): boolean {
  if (left === right) return true;
  if (left === null || right === null || left.frame !== right.frame) return false;
  if (
    left.targetOperatorIds.length !== right.targetOperatorIds.length ||
    left.targetOperatorIds.some((id, index) => id !== right.targetOperatorIds[index]) ||
    left.event.kind !== right.event.kind
  )
    return false;
  return left.event.mode === right.event.mode;
}
