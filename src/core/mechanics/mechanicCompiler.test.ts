import { describe, expect, it } from 'vitest';
import type { MechanicDefinitionRef } from '../game-data/gameDataRepository';
import type { ScenarioMechanicsDocument } from '../project/schema';
import {
  compileMechanics,
  MechanicAdapterRegistry,
  type MechanicAdapter,
} from './mechanicCompiler';

const definition: MechanicDefinitionRef = {
  id: 'seasonTower:test',
  family: 'seasonTower',
  revision: 'table:1',
  parameters: [
    { key: 'stacks', type: 'number', required: true },
    { key: 'enabledBranch', type: 'boolean', required: false, defaultValue: true },
  ],
};

function document(): ScenarioMechanicsDocument {
  return {
    selections: [
      {
        id: 'selection:1',
        mechanicId: definition.id,
        enabled: true,
        parameters: { stacks: 2 },
      },
    ],
  };
}

function adapter(overrides: Partial<MechanicAdapter> = {}): MechanicAdapter {
  return {
    family: 'seasonTower',
    revision: 'adapter:1',
    compile: input => [
      {
        kind: 'combatEventSequence',
        event: 'outputDamage',
        priority: 10,
        sequence: {
          steps: [
            {
              kind: 'changeResource',
              parameters: {
                resource: 'sp',
                amount: input.parameters.stacks as number,
                recipient: 'team',
              },
            },
          ],
        },
      },
    ],
    ...overrides,
  };
}

describe('compileMechanics', () => {
  it('resolves defaults and emits only provenance-bearing data contributions', () => {
    let receivedParameters: Readonly<Record<string, boolean | number | string>> | undefined;
    const registry = new MechanicAdapterRegistry([
      adapter({
        compile: input => {
          receivedParameters = input.parameters;
          return adapter().compile(input);
        },
      }),
    ]);

    const result = compileMechanics(document(), { getMechanic: () => definition }, registry);

    expect(receivedParameters).toEqual({ stacks: 2, enabledBranch: true });
    expect(result.sources).toEqual([
      {
        selectionId: 'selection:1',
        mechanicId: definition.id,
        definitionRevision: 'table:1',
        adapterRevision: 'adapter:1',
      },
    ]);
    expect(result.contributions[0]).toMatchObject({
      selectionId: 'selection:1',
      mechanicId: definition.id,
      selectionIndex: 0,
      contributionIndex: 0,
      contribution: { kind: 'combatEventSequence', priority: 10 },
    });
  });

  it('skips disabled selections without invoking their adapter', () => {
    const source = document();
    source.selections[0]!.enabled = false;
    const compile = () => {
      throw new Error('disabled adapter must not run');
    };

    expect(
      compileMechanics(
        source,
        { getMechanic: () => definition },
        new MechanicAdapterRegistry([adapter({ compile })]),
      ),
    ).toEqual({ sources: [], contributions: [] });
  });

  it('rejects unsupported mechanic families and unknown parameters before adapters run', () => {
    expect(() =>
      compileMechanics(
        document(),
        { getMechanic: () => definition },
        new MechanicAdapterRegistry(),
      ),
    ).toThrow("no adapter is registered for mechanic family 'seasonTower'");

    const source = document();
    source.selections[0]!.parameters.unknown = 1;
    expect(() =>
      compileMechanics(
        source,
        { getMechanic: () => definition },
        new MechanicAdapterRegistry([adapter()]),
      ),
    ).toThrow('unknown mechanic parameter');
  });

  it('rejects unresolved equal-priority and level-event ordering', () => {
    const duplicateAbility = adapter({
      compile: input => [...adapter().compile(input), ...adapter().compile(input)],
    });
    expect(() =>
      compileMechanics(
        document(),
        { getMechanic: () => definition },
        new MechanicAdapterRegistry([duplicateAbility]),
      ),
    ).toThrow('equal-priority event ordering is not recovered');

    const duplicateLevel = adapter({
      compile: () => [
        {
          kind: 'gameLevelEventSequence',
          event: { kind: 'spellInflictionStarted' },
          sequence: { steps: [] },
        },
        {
          kind: 'gameLevelEventSequence',
          event: { kind: 'spellInflictionStarted' },
          sequence: { steps: [] },
        },
      ],
    });
    expect(() =>
      compileMechanics(
        document(),
        { getMechanic: () => definition },
        new MechanicAdapterRegistry([duplicateLevel]),
      ),
    ).toThrow('cross-mechanic level-event registration order is not recovered');
  });

  it('rejects runtime adapter output that is not finite data', () => {
    const invalid = adapter({
      compile: () =>
        [
          {
            kind: 'combatEventSequence',
            event: 'outputDamage',
            priority: 1,
            sequence: { steps: [], callback: () => undefined },
          },
        ] as never,
    });

    expect(() =>
      compileMechanics(
        document(),
        { getMechanic: () => definition },
        new MechanicAdapterRegistry([invalid]),
      ),
    ).toThrow('contribution must contain data only');
  });

  it('rejects a non-positive pre-vitals enemy multiplier', () => {
    const invalid = adapter({
      compile: () => [
        {
          kind: 'enemyProgramStatMultiplier',
          stat: 'maxHealth',
          multiplier: 0,
        },
      ],
    });

    expect(() =>
      compileMechanics(
        document(),
        { getMechanic: () => definition },
        new MechanicAdapterRegistry([invalid]),
      ),
    ).toThrow('enemy stat multiplier must be positive');
  });
});
