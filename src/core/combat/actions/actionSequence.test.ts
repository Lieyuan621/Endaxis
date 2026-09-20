import { describe, expect, it } from 'vitest';
import { CombatStep, STEP_RESULT_MODE, type CombatExecutionContext } from './combatStep';
import { ActionSequence } from './actionSequence';

class ProbeStep extends CombatStep {
  constructor(
    private readonly name: string,
    private readonly calls: string[],
    private readonly result = true,
  ) {
    super();
  }

  execute(): void {
    this.calls.push(`execute:${this.name}`);
  }

  override tryExecute(): boolean {
    this.execute();
    return this.result;
  }

  override tick(): void {
    this.calls.push(`tick:${this.name}`);
  }

  override end(): void {
    this.calls.push(`end:${this.name}`);
  }

  override reset(): void {
    this.calls.push(`reset:${this.name}`);
  }
}

describe('ActionSequence', () => {
  it('rechecks host permission per Tick step without blocking End cleanup', () => {
    const calls: string[] = [];
    let enabled = true;
    class DisablingTick extends ProbeStep {
      override tick(): void {
        super.tick();
        enabled = false;
      }
    }
    const sequence = new ActionSequence(
      [new DisablingTick('first', calls), new ProbeStep('tail', calls)],
      () => enabled,
    );
    sequence.tryExecute({});
    sequence.tick(1, {});
    sequence.tick(1, {});
    sequence.end({});
    expect(calls).toEqual(['execute:first', 'execute:tail', 'tick:first', 'end:first', 'end:tail']);
  });
  it('ends synchronously inside an action without executing or resurrecting later steps', () => {
    const calls: string[] = [];
    let sequence: ActionSequence;
    class EndingStep extends ProbeStep {
      override execute(): void {
        super.execute();
        sequence.end({});
        calls.push('returned');
      }
    }
    sequence = new ActionSequence([new EndingStep('first', calls), new ProbeStep('later', calls)]);
    sequence.tryExecute({});
    sequence.tick(1, {});
    sequence.tryExecute({});
    sequence.end({});
    expect(calls).toEqual(['execute:first', 'end:first', 'returned']);
  });

  it('marks pending steps ended without running their End bodies', () => {
    const calls: string[] = [];
    const sequence = new ActionSequence([new ProbeStep('pending', calls)]);
    sequence.end({});
    sequence.tryExecute({});
    expect(calls).toEqual([]);
    sequence.reset({});
    sequence.tryExecute({});
    expect(calls).toEqual(['reset:pending', 'execute:pending']);
  });

  it('does not revive a step that ends the sequence during Tick', () => {
    const calls: string[] = [];
    let sequence: ActionSequence;
    class EndingTick extends ProbeStep {
      override tick(): void {
        super.tick();
        sequence.end({});
      }
    }
    sequence = new ActionSequence([new EndingTick('first', calls), new ProbeStep('tail', calls)]);
    sequence.tryExecute({});
    sequence.tick(1, {});
    sequence.tick(1, {});
    sequence.end({});
    expect(calls).toEqual(['execute:first', 'execute:tail', 'tick:first', 'end:first', 'end:tail']);
  });
  it('checks the live host gate per action and still cleans up actions already entered', () => {
    const calls: string[] = [];
    let enabled = true;
    class DisableStep extends ProbeStep {
      override tryExecute(): boolean {
        enabled = false;
        return super.tryExecute();
      }
    }
    const sequence = new ActionSequence(
      [new DisableStep('disable', calls), new ProbeStep('later', calls)],
      () => enabled,
    );
    expect(sequence.tryExecute({})).toBe(false);
    sequence.end({});
    expect(calls).toEqual(['execute:disable', 'end:disable']);
  });

  it('preserves result inversion on denied actions without ticking or ending their bodies', () => {
    const calls: string[] = [];
    const sequence = new ActionSequence([new ProbeStep('denied', calls)], () => false);
    const context = { sequence: { resultMode: STEP_RESULT_MODE.invertNextResult } };
    expect(sequence.tryExecute(context)).toBe(true);
    sequence.tick(1, context);
    sequence.end(context);
    expect(calls).toEqual([]);
    expect(context.sequence.resultMode).toBe(STEP_RESULT_MODE.normal);
    expect(sequence.createRuntimeInstance().tryExecute({})).toBe(false);
  });

  it('executes synchronously in configured order and stops at the first failure', () => {
    const calls: string[] = [];
    const sequence = new ActionSequence([
      new ProbeStep('buff', calls),
      new ProbeStep('condition', calls, false),
      new ProbeStep('damage', calls),
    ]);

    expect(sequence.tryExecute({})).toBe(false);
    expect(calls).toEqual(['execute:buff', 'execute:condition']);
  });

  it('ticks and ends only successfully executed children', () => {
    const calls: string[] = [];
    const context: CombatExecutionContext = {};
    const sequence = new ActionSequence([
      new ProbeStep('first', calls),
      new ProbeStep('second', calls),
    ]);

    expect(sequence.tryExecute(context)).toBe(true);
    sequence.tick(1 / 30, context);
    sequence.end(context);

    expect(calls).toEqual([
      'execute:first',
      'execute:second',
      'tick:first',
      'tick:second',
      'end:first',
      'end:second',
    ]);
  });

  it('can invert the next step result', () => {
    const calls: string[] = [];
    const context: CombatExecutionContext = {
      sequence: { resultMode: STEP_RESULT_MODE.invertNextResult },
    };
    const sequence = new ActionSequence([
      new ProbeStep('condition', calls, false),
      new ProbeStep('damage', calls),
    ]);

    expect(sequence.tryExecute(context)).toBe(true);
    expect(context.sequence?.resultMode).toBe(STEP_RESULT_MODE.normal);
    expect(calls).toEqual(['execute:condition', 'execute:damage']);
  });
});
