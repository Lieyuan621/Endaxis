import { describe, expect, it } from 'vitest';
import { GameLevelEventDispatcher } from './gameLevelEventDispatcher';

describe('GameLevelEventDispatcher', () => {
  it('broadcasts synchronously in registration order', () => {
    const events: string[] = [];
    const dispatcher = new GameLevelEventDispatcher<'spellInfliction', number>();
    dispatcher.registerCallback('spellInfliction', context =>
      events.push(`first:${context.payload}`),
    );
    dispatcher.registerCallback('spellInfliction', context =>
      events.push(`second:${context.payload}`),
    );

    dispatcher.dispatch({ event: 'spellInfliction', payload: 3 });

    expect(events).toEqual(['first:3', 'second:3']);
  });
});
