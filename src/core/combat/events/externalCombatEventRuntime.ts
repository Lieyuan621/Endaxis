import {
  type ExternalCombatEventInput,
  type ScheduledExternalCombatEventInput,
} from '../state/environmentState';
import type { FrameRuntime } from '../runtime/combatSimulation';
import type { ExternalCombatEventRuntimeState } from '../state/environmentState';
import type { CombatClock } from '../time/combatClock';

export interface ExternalCombatEventRuntimeOptions {
  readonly receiveHit?: (operatorId: string) => void;
  readonly controlComboCooldown?: (operatorId: string, mode: 'cooldown' | 'ready') => void;
  readonly clock: CombatClock;
  readonly events: readonly ScheduledExternalCombatEventInput[];
  readonly restoredState?: ExternalCombatEventRuntimeState;
}

export class ExternalCombatEventRuntime implements FrameRuntime {
  readonly runtimeState: ExternalCombatEventRuntimeState;
  readonly #controlComboCooldown: ExternalCombatEventRuntimeOptions['controlComboCooldown'];
  readonly #receiveHit: ExternalCombatEventRuntimeOptions['receiveHit'];
  readonly #clock: CombatClock;
  readonly #events: readonly ScheduledExternalCombatEventInput[];

  constructor(options: ExternalCombatEventRuntimeOptions) {
    this.#controlComboCooldown = options.controlComboCooldown;
    this.#receiveHit = options.receiveHit;
    this.#clock = options.clock;
    this.#events = [...options.events];
    let previousFrame = -1;
    for (const [index, input] of this.#events.entries()) {
      if (!Number.isInteger(input.frame) || input.frame < 0) {
        throw new RangeError(`events[${index}].frame must be a non-negative integer`);
      }
      validateTargets(input);
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
    validateTargets(input);
    this.#processInput(input);
  }

  #processInput(input: ExternalCombatEventInput): void {
    if (input.kind === 'pickup') return; // The active pickup Aura consumes this frame's overlap.
    if (input.kind === 'operatorHit') {
      this.#receiveHit?.(input.operatorId);
      return;
    }
    if (this.#controlComboCooldown === undefined)
      throw new Error('combo cooldown control handler is missing');
    for (const operatorId of input.operatorIds) {
      this.#controlComboCooldown(operatorId, input.mode);
    }
  }
}

function sameExternalEventInput(
  left: ScheduledExternalCombatEventInput | null,
  right: ScheduledExternalCombatEventInput | null,
): boolean {
  if (left === right) return true;
  if (left === null || right === null || left.frame !== right.frame) return false;
  switch (left.kind) {
    case 'pickup':
      return (
        right.kind === 'pickup' &&
        left.operatorId === right.operatorId &&
        left.group === right.group
      );
    case 'operatorHit':
      return right.kind === 'operatorHit' && left.operatorId === right.operatorId;
    case 'comboCooldownControl':
      return (
        right.kind === 'comboCooldownControl' &&
        left.mode === right.mode &&
        left.operatorIds.length === right.operatorIds.length &&
        left.operatorIds.every((id, index) => id === right.operatorIds[index])
      );
  }
}

function validateTargets(input: ExternalCombatEventInput): void {
  if (input.kind === 'comboCooldownControl') {
    if (!input.operatorIds.length || input.operatorIds.some(id => !id.length))
      throw new TypeError('combo cooldown control requires operator IDs');
  } else if (!input.operatorId.length) {
    throw new TypeError(`${input.kind} requires an operator ID`);
  }
}
