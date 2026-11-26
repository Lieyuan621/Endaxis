import { firstInputAtOrAfter } from '../runtime/scheduledInputBoundary';
import {
  type ExternalCombatEventInput,
  type ScheduledExternalCombatEventInput,
} from '../state/environmentState';
import type { FrameRuntime } from '../runtime/combatSimulation';
import type { CombatClock } from '../time/combatClock';

export interface ExternalCombatEventRuntimeOptions {
  readonly inputBoundary?: number;
  readonly receiveHit?: (operatorId: string) => void;
  readonly controlComboCooldown?: (operatorId: string, mode: 'cooldown' | 'ready') => void;
  readonly clock: CombatClock;
  readonly events: readonly ScheduledExternalCombatEventInput[];
}

export class ExternalCombatEventRuntime implements FrameRuntime {
  readonly #controlComboCooldown: ExternalCombatEventRuntimeOptions['controlComboCooldown'];
  readonly #receiveHit: ExternalCombatEventRuntimeOptions['receiveHit'];
  #nextIndex: number;
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
    this.#nextIndex = firstInputAtOrAfter(this.#events, options.inputBoundary ?? -Infinity);
  }

  advanceFrame(): void {
    this.applyCurrentFrame();
  }

  applyCurrentFrame(): void {
    const actualFrame = this.#clock.frame;
    while (true) {
      const input = this.#events[this.#nextIndex];
      if (input === undefined || input.frame > actualFrame) break;
      this.#nextIndex += 1;
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

export function sameExternalEventInput(
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
