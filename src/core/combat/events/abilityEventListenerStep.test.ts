import { describe, expect, it } from 'vitest';
import { AbilityEventDispatcher } from './abilityEventDispatcher';
import { AbilityEventListenerStep } from './abilityEventListenerStep';

describe('AbilityEventListenerStep', () => {
  it('keeps event actions registered until the outer step ends', () => {
    const events: string[] = [];
    const dispatcher = new AbilityEventDispatcher<'hit'>();
    const listener = new AbilityEventListenerStep<'hit'>(dispatcher, [
      { event: 'hit', priority: 10, execute: () => events.push('listener') },
    ]);

    listener.execute({});
    dispatcher.dispatch({ event: 'hit', payload: undefined }, []);
    listener.end({});
    dispatcher.dispatch({ event: 'hit', payload: undefined }, []);

    expect(events).toEqual(['listener']);
  });

  it('keeps equal-priority maps in registration order and disposes only its own maps', () => {
    const events: string[] = [];
    const dispatcher = new AbilityEventDispatcher<'first' | 'second'>();
    dispatcher.registerAction('second', 10, () => events.push('existing'));
    const listener = new AbilityEventListenerStep<'first' | 'second'>(dispatcher, [
      { event: 'first', priority: 10, execute: () => events.push('listener:first') },
      { event: 'second', priority: 10, execute: () => events.push('listener:second') },
    ]);

    listener.execute({});
    dispatcher.dispatch({ event: 'first', payload: undefined }, []);
    dispatcher.dispatch({ event: 'second', payload: undefined }, []);
    listener.end({});
    dispatcher.dispatch({ event: 'second', payload: undefined }, []);

    expect(events).toEqual(['listener:first', 'existing', 'listener:second', 'existing']);
  });
});
