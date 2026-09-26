import { describe, expect, it, vi } from 'vitest';
import {
  endActionSequence,
  executeActionSequence,
  resetActionSequence,
  tickActionSequence,
  type ActionSequenceExecutionHost,
} from '../actions/actionSequenceExecution';
import { CombatStep, type CombatExecutionContext } from '../actions/combatStep';
import { COMBAT_STEP_STATE, type ActionStepData, type ActionStepState } from '../state/actionState';
import {
  TimelineActionProcessor,
  type TimelineAction,
  type TimelineExecution,
} from './timelineActionProcessor';

/** 调度器测试探针：把步骤对象绑定到与图执行器相同的数据驱动序列内核。 */
interface ProbeSequenceState {
  steps: (ActionStepData | null)[];
  entries: ActionStepState[];
}

class StepProbeSequence implements TimelineExecution<ProbeSequenceState> {
  readonly #steps: readonly CombatStep[];
  readonly runtimeState: ProbeSequenceState;

  constructor(steps: readonly CombatStep[], state?: ProbeSequenceState) {
    this.#steps = [...steps];
    this.runtimeState = state ?? {
      steps: steps.map(step => step.executionData),
      entries: steps.map(() => ({
        state: COMBAT_STEP_STATE.pending,
        executeResult: false,
        executionPermitted: false,
      })),
    };
    if (
      this.runtimeState.entries.length !== steps.length ||
      this.runtimeState.steps.length !== steps.length
    )
      throw new Error('action sequence state does not match program length');
    steps.forEach((step, index) => {
      if (state === undefined) this.runtimeState.steps[index] = step.executionData;
      else step.bindExecutionData(this.runtimeState.steps[index]!);
    });
  }

  execute(context: CombatExecutionContext): void {
    executeActionSequence(this.runtimeState, context, this.#host(context));
  }

  reset(context: CombatExecutionContext): void {
    resetActionSequence(this.runtimeState, this.#host(context));
  }

  tick(deltaTime: number, context: CombatExecutionContext): void {
    tickActionSequence(this.runtimeState, deltaTime, this.#host(context));
  }

  end(context: CombatExecutionContext): void {
    endActionSequence(this.runtimeState, this.#host(context));
  }

  #host(context: CombatExecutionContext): ActionSequenceExecutionHost<number> {
    return {
      canExecute: () => true,
      execute: index => this.#steps[index]!.tryExecute(context),
      reset: index => this.#steps[index]!.reset(context),
      tick: (index, deltaTime) => this.#steps[index]!.tick(deltaTime, context),
      end: index => this.#steps[index]!.end(context),
    };
  }
}

class RecordingStep extends CombatStep {
  constructor(
    readonly name: string,
    readonly events: string[],
  ) {
    super();
  }

  execute(): void {
    this.events.push(`${this.name}:execute`);
  }

  override tick(): void {
    this.events.push(`${this.name}:tick`);
  }

  override end(): void {
    this.events.push(`${this.name}:end`);
  }
}

class JumpingStep extends RecordingStep {
  constructor(
    name: string,
    events: string[],
    readonly jump: () => void,
  ) {
    super(name, events);
  }

  override execute(): void {
    super.execute();
    this.jump();
  }
}

function timelineAction(
  startFrame: number,
  name: string,
  events: string[],
): TimelineAction<ProbeSequenceState> {
  return {
    startFrame,
    sequence: new StepProbeSequence([new RecordingStep(name, events)]),
  };
}

function rangedTimelineAction(
  startFrame: number,
  endFrame: number,
  name: string,
  events: string[],
): TimelineAction<ProbeSequenceState> {
  return { ...timelineAction(startFrame, name, events), endFrame };
}

describe('TimelineActionProcessor<ProbeSequenceState>', () => {
  const context: CombatExecutionContext = {};

  it('host CastEnd synchronously closes the current sequence before its next step', () => {
    const calls: string[] = [];
    let processor: TimelineActionProcessor<ProbeSequenceState>;
    class EndHostStep extends RecordingStep {
      override execute(): void {
        super.execute();
        processor.end(0, context);
        calls.push('returned');
      }
    }
    processor = new TimelineActionProcessor<ProbeSequenceState>([
      {
        startFrame: 0,
        endFrame: 10,
        sequence: new StepProbeSequence([
          new EndHostStep('first', calls),
          new RecordingStep('tail', calls),
        ]),
      },
    ]);
    processor.reset(context);
    processor.tick(0, 0, context);
    processor.tick(1, 1, context);
    expect(calls).toEqual(['first:execute', 'first:end', 'returned']);
  });

  it('does not restart pending timelines after host CastEnd until reset', () => {
    const events: string[] = [];
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      timelineAction(2, 'later', events),
    ]);
    processor.reset(context);
    processor.end(0, context);
    processor.tick(2, 0, context);
    expect(events).toEqual([]);
    expect(processor.isComplete).toBe(true);
    processor.reset(context);
    processor.tick(2, 0, context);
    expect(events).toEqual(['later:execute']);
  });

  it.each(['execute', 'tick'] as const)(
    'stops later timelines when %s synchronously ends the host',
    phase => {
      const events: string[] = [];
      let processor: TimelineActionProcessor<ProbeSequenceState>;
      class EndingStep extends RecordingStep {
        override execute(): void {
          super.execute();
          if (phase === 'execute') processor.end(0, context);
        }
        override tick(): void {
          super.tick();
          if (phase === 'tick') processor.end(0, context);
        }
      }
      processor = new TimelineActionProcessor<ProbeSequenceState>([
        {
          startFrame: 0,
          endFrame: 10,
          sequence: new StepProbeSequence([new EndingStep('first', events)]),
        },
        timelineAction(0, 'same-frame', events),
        timelineAction(2, 'future', events),
      ]);
      processor.reset(context);
      processor.tick(0, 0, context);
      processor.tick(20, 1, context);
      processor.end(20, context);
      expect(events).toEqual(
        phase === 'execute'
          ? ['first:execute', 'first:end']
          : ['first:execute', 'same-frame:execute', 'first:tick', 'first:end', 'same-frame:end'],
      );
      expect(processor.isComplete).toBe(true);
    },
  );

  it.each([undefined, 2])(
    'defers the first Tick/End for a zero-length interval with end %s',
    endFrame => {
      const events: string[] = [];
      const processor = new TimelineActionProcessor<ProbeSequenceState>([
        { ...timelineAction(2, 'action', events), endFrame },
      ]);
      processor.reset(context);

      processor.tick(1, 1 / 30, context);
      processor.tick(2, 1 / 30, context);
      expect(events).toEqual(['action:execute']);
      expect(processor.isComplete).toBe(false);
      // It is the next visit, not necessarily the next frame.
      processor.tick(2, 0, context);

      expect(events).toEqual(['action:execute', 'action:tick', 'action:end']);
      expect(processor.isComplete).toBe(true);
    },
  );

  it('uses source order for equal start frames', () => {
    const events: string[] = [];
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      timelineAction(1, 'first', events),
      timelineAction(1, 'second', events),
    ]);
    processor.reset(context);

    processor.tick(1, 1 / 30, context);

    expect(events).toEqual(['first:execute', 'second:execute']);
  });

  it('restores a just-executed instant interval without replaying Execute or losing End', () => {
    class RestorableRecordingStep extends RecordingStep {
      override bindExecutionData(data: null): void {
        // This probe has no step-local data; lifecycle is stored by ActionSequence.
        expect(data).toBeNull();
      }
    }
    const events: string[] = [];
    const original = new TimelineActionProcessor<ProbeSequenceState>([
      timelineAction(0, 'action', events),
    ]);
    original.reset(context);
    original.tick(0, 0, context);
    expect(events).toEqual(['action:execute']);
    const saved = structuredClone(original.runtimeState);
    if (saved.sequences[0] && !('steps' in saved.sequences[0]))
      throw new Error('expected tree fixture');
    events.length = 0;
    const restored = new TimelineActionProcessor<ProbeSequenceState>(
      [
        {
          startFrame: 0,
          sequence: new StepProbeSequence(
            [new RestorableRecordingStep('action', events)],
            saved.sequences[0],
          ),
        },
      ],
      {},
      saved,
    );
    expect(restored.isComplete).toBe(false);
    expect(events).toEqual([]);
    restored.tick(1, 1 / 30, context);
    restored.tick(2, 1 / 30, context);
    expect(events).toEqual(['action:tick', 'action:end']);
    expect(restored.isComplete).toBe(true);
    expect(original.isComplete).toBe(false);
  });

  it('keeps a zero-length scoped effect through later same-frame hits, then removes it before next-frame hits', () => {
    let active = false;
    const observed: boolean[] = [];
    class EffectStep extends CombatStep {
      execute(): void {
        active = true;
      }
      override end(): void {
        active = false;
      }
    }
    class HitStep extends CombatStep {
      execute(): void {
        observed.push(active);
      }
    }
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      { startFrame: 0, endFrame: 0, sequence: new StepProbeSequence([new EffectStep()]) },
      { startFrame: 0, sequence: new StepProbeSequence([new HitStep()]) },
      { startFrame: 1, sequence: new StepProbeSequence([new HitStep()]) },
    ]);
    processor.reset(context);
    processor.tick(0, 0, context);
    expect(observed).toEqual([true]);
    processor.tick(1, 1 / 30, context);
    expect(observed).toEqual([true, false]);
  });

  it('ends an earlier source interval before a same-frame later source hit', () => {
    const events: string[] = [];
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      rangedTimelineAction(0, 2, 'buff', events),
      timelineAction(2, 'hit', events),
    ]);
    processor.reset(context);
    processor.tick(0, 0, context);
    events.length = 0;
    processor.tick(2, 1 / 30, context);
    expect(events).toEqual(['buff:tick', 'buff:end', 'hit:execute']);
  });

  it('interleaves new and running nodes in source order rather than start-frame order', () => {
    const events: string[] = [];
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      timelineAction(2, 'hit', events),
      rangedTimelineAction(0, 2, 'buff', events),
    ]);
    processor.reset(context);
    processor.tick(0, 0, context);
    events.length = 0;
    processor.tick(2, 1 / 30, context);
    expect(events).toEqual(['hit:execute', 'buff:tick', 'buff:end']);
    expect(processor.isComplete).toBe(false);
    events.length = 0;
    processor.tick(3, 1 / 30, context);
    expect(events).toEqual(['hit:tick', 'hit:end']);
    expect(processor.isComplete).toBe(true);
  });

  it('keeps source order when one update crosses several pending starts', () => {
    const events: string[] = [];
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      timelineAction(2, 'first', events),
      timelineAction(0, 'second', events),
    ]);
    processor.reset(context);
    processor.tick(2, 1 / 30, context);
    expect(events).toEqual(['first:execute', 'second:execute']);
    processor.tick(3, 1 / 30, context);
    expect(events).toEqual([
      'first:execute',
      'second:execute',
      'first:tick',
      'first:end',
      'second:tick',
      'second:end',
    ]);
    expect(processor.isComplete).toBe(true);
  });

  it('executes actions only when their frames are reached', () => {
    const events: string[] = [];
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      timelineAction(1, 'first', events),
      timelineAction(2, 'second', events),
    ]);
    processor.reset(context);
    processor.tick(1, 1 / 30, context);
    events.length = 0;

    processor.tick(2, 1 / 30, context);

    expect(events).toEqual(['first:tick', 'first:end', 'second:execute']);
  });

  it('does not execute future actions when a skill finishes early', () => {
    const events: string[] = [];
    const future = timelineAction(10, 'future', events);
    const lifecycle = { started: vi.fn(), ended: vi.fn() };
    const processor = new TimelineActionProcessor<ProbeSequenceState>(
      [timelineAction(1, 'action', events), future],
      lifecycle,
    );
    processor.reset(context);
    processor.tick(1, 1 / 30, context);

    processor.end(2, context);

    expect(events).toEqual(['action:execute', 'action:end']);
    expect(lifecycle.started).toHaveBeenCalledTimes(1);
    expect(lifecycle.ended).toHaveBeenCalledTimes(1);
    expect(processor.isComplete).toBe(true);
  });

  it('finishes the timeline by discarding pending actions', () => {
    const events: string[] = [];
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      timelineAction(2, 'current', events),
      timelineAction(10, 'future', events),
    ]);
    processor.reset(context);
    processor.tick(2, 1 / 30, context);

    processor.finish(2, context);

    expect(events).toEqual(['current:execute', 'current:end']);
    expect(processor.isComplete).toBe(true);
  });

  it('ticks an active ranged action until its inclusive end frame', () => {
    const events: string[] = [];
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      rangedTimelineAction(2, 4, 'ranged', events),
    ]);
    processor.reset(context);

    processor.tick(2, 1 / 30, context);
    processor.tick(3, 1 / 30, context);
    processor.tick(4, 1 / 30, context);

    expect(events).toEqual(['ranged:execute', 'ranged:tick', 'ranged:tick', 'ranged:end']);
    expect(processor.isComplete).toBe(true);
  });

  it('ends an active ranged action when its parent skill is interrupted', () => {
    const events: string[] = [];
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      rangedTimelineAction(1, 10, 'ranged', events),
    ]);
    processor.reset(context);
    processor.tick(1, 1 / 30, context);

    processor.end(3, context);

    expect(events).toEqual(['ranged:execute', 'ranged:end']);
  });

  it('skips pending actions whose start frame is before a jump destination', () => {
    const events: string[] = [];
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      timelineAction(2, 'skipped', events),
      timelineAction(5, 'destination', events),
    ]);
    processor.reset(context);

    processor.jumpTo(5, 1, context);
    processor.tick(5, 1 / 30, context);

    expect(events).toEqual(['destination:execute']);
    processor.tick(6, 1 / 30, context);
    expect(events).toEqual(['destination:execute', 'destination:tick', 'destination:end']);
    expect(processor.isComplete).toBe(true);
  });

  it('ends active actions crossed by a jump', () => {
    const events: string[] = [];
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      rangedTimelineAction(1, 3, 'crossed', events),
    ]);
    processor.reset(context);
    processor.tick(1, 1 / 30, context);

    processor.jumpTo(5, 1, context);

    expect(events).toEqual(['crossed:execute', 'crossed:end']);
    expect(processor.isComplete).toBe(true);
  });

  it('keeps active actions whose end frame is after a jump destination', () => {
    const events: string[] = [];
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      rangedTimelineAction(1, 8, 'spanning', events),
    ]);
    processor.reset(context);
    processor.tick(1, 1 / 30, context);

    processor.jumpTo(5, 1, context);
    processor.tick(5, 1 / 30, context);

    expect(events).toEqual(['spanning:execute', 'spanning:tick']);
    expect(processor.isComplete).toBe(false);
  });

  it('does not skip pending actions at the exact jump destination', () => {
    const events: string[] = [];
    const processor = new TimelineActionProcessor<ProbeSequenceState>([
      timelineAction(5, 'exact', events),
    ]);
    processor.reset(context);

    processor.jumpTo(5, 1, context);

    expect(events).toEqual([]);
    expect(processor.isComplete).toBe(false);
    processor.tick(5, 1 / 30, context);
    expect(events).toEqual(['exact:execute']);
  });

  it('ends the currently starting action after a reentrant jump and skips crossed actions', () => {
    const events: string[] = [];
    let processor: TimelineActionProcessor<ProbeSequenceState>;
    const jumping: TimelineAction<ProbeSequenceState> = {
      startFrame: 1,
      endFrame: 2,
      sequence: new StepProbeSequence([
        new JumpingStep('jumping', events, () => processor.jumpTo(5, 1, context)),
      ]),
    };
    processor = new TimelineActionProcessor<ProbeSequenceState>([
      jumping,
      timelineAction(3, 'skipped', events),
      timelineAction(5, 'destination', events),
    ]);
    processor.reset(context);

    processor.tick(1, 1 / 30, context);
    processor.tick(5, 0, context);
    expect(events).toEqual(['jumping:execute', 'jumping:end', 'destination:execute']);
    processor.tick(6, 1 / 30, context);

    expect(events).toEqual([
      'jumping:execute',
      'jumping:end',
      'destination:execute',
      'destination:tick',
      'destination:end',
    ]);
    expect(processor.isComplete).toBe(true);
  });

  it('rejects unsupported backward jumps', () => {
    const processor = new TimelineActionProcessor<ProbeSequenceState>([]);
    expect(() => processor.jumpTo(1, 2, context)).toThrow(
      'backward timeline jumps are not supported',
    );
  });

  it('rejects non-integer frames before runtime', () => {
    expect(
      () => new TimelineActionProcessor<ProbeSequenceState>([timelineAction(1.5, 'invalid', [])]),
    ).toThrow('timeline action 0 must use an integer frame');
  });
});
