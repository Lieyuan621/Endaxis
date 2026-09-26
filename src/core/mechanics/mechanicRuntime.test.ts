import { createActionGraphCompilation } from '../compiler/compileActionGraph';
import { describe, expect, it, vi } from 'vitest';
import { AbilityEventDispatcher } from '../combat/events/abilityEventDispatcher';
import { GameLevelEventDispatcher } from '../combat/events/gameLevelEventDispatcher';
import type { CompiledMechanics } from './mechanicCompiler';
import type { MechanicAbilityEvent } from './mechanicContribution';
import { installMechanicContributions } from './mechanicRuntime';

const emptySequence = {
  graph: createActionGraphCompilation({ nodes: {} }, 1, 'mechanic-empty').compileAll(),
  entry: null,
  callSite: 'mechanic-empty',
} as const;

describe('installMechanicContributions', () => {
  it('routes compiled sequences through core event dispatchers with provenance', () => {
    const mechanics: CompiledMechanics = {
      sources: [
        {
          selectionId: 'selection:1',
          mechanicId: 'seasonTower:test',
          definitionRevision: 'table:1',
          adapterRevision: 'adapter:1',
        },
      ],
      contributions: [
        {
          selectionId: 'selection:1',
          mechanicId: 'seasonTower:test',
          selectionIndex: 0,
          contributionIndex: 0,
          contribution: {
            kind: 'battleInitializationSequence',
            sequence: emptySequence,
          },
        },
        {
          selectionId: 'selection:1',
          mechanicId: 'seasonTower:test',
          selectionIndex: 0,
          contributionIndex: 1,
          contribution: {
            kind: 'combatEventSequence',
            event: 'outputDamage',
            priority: 20,
            sequence: emptySequence,
          },
        },
        {
          selectionId: 'selection:1',
          mechanicId: 'seasonTower:test',
          selectionIndex: 0,
          contributionIndex: 2,
          contribution: {
            kind: 'gameLevelEventSequence',
            event: { kind: 'spellInflictionStarted' },
            sequence: emptySequence,
          },
        },
      ],
    };
    const abilityEvents = new AbilityEventDispatcher<
      MechanicAbilityEvent,
      Record<MechanicAbilityEvent, { damage: number }>
    >();
    const gameLevelEvents = new GameLevelEventDispatcher<
      'spellInflictionStarted',
      { stacks: number }
    >();
    const execute = vi.fn();
    installMechanicContributions(mechanics, {
      abilityEvents,
      gameLevelEvents,
      sequenceExecutor: { execute },
    });

    abilityEvents.dispatch({ event: 'outputDamage', payload: { damage: 10 } }, []);
    gameLevelEvents.dispatch({ event: 'spellInflictionStarted', payload: { stacks: 2 } });

    expect(execute).toHaveBeenCalledTimes(3);
    expect(execute.mock.calls[0]).toEqual([
      emptySequence,
      { selectionId: 'selection:1', mechanicId: 'seasonTower:test' },
      { domain: 'battleInitialization' },
    ]);
    expect(execute.mock.calls[1]).toEqual([
      emptySequence,
      { selectionId: 'selection:1', mechanicId: 'seasonTower:test' },
      { domain: 'ability', event: { event: 'outputDamage', payload: { damage: 10 } } },
    ]);
    expect(execute.mock.calls[2]?.[2]).toEqual({
      domain: 'gameLevel',
      event: { event: 'spellInflictionStarted', payload: { stacks: 2 } },
    });
  });
});
