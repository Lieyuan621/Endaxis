import { describe, expect, it } from 'vitest';
import type {
  GearDefinition,
  GearSetDefinition,
  WeaponDefinition,
} from '../game-data/equipmentDefinition';
import {
  compileGearContributions,
  compileGearSetContribution,
  compileWeaponContributions,
} from './compileEquipment';

const gearDisplay = {
  kind: 'modifier',
  modifier: { kind: 'panelStat', stat: 'attackFlat', value: 0 },
} as const;

const loneBarge: WeaponDefinition = {
  slug: 'lone-barge',
  rarity: 6,
  weaponType: 'arts-unit',
  baseAttackAtLevelNodes: [52, 149, 252, 355, 458, 510],
  traits: [
    {
      key: 'will',
      levelCount: 9,
      modifiers: [
        {
          kind: 'attribute',
          attribute: 'will',
          operation: 'flat',
          value: [20, 36, 52, 68, 84, 100, 116, 132, 156],
        },
      ],
    },
    {
      key: 'attack',
      levelCount: 9,
      modifiers: [
        {
          kind: 'panelStat',
          stat: 'attackPercent',
          value: [0.05, 0.09, 0.13, 0.17, 0.21, 0.25, 0.29, 0.33, 0.39],
        },
      ],
    },
    {
      key: 'skill',
      levelCount: 9,
      modifiers: [
        {
          kind: 'damageBonus',
          damageTypes: 'electric',
          value: [0.16, 0.192, 0.224, 0.256, 0.288, 0.32, 0.352, 0.384, 0.448],
        },
      ],
      eventHandlers: [
        {
          key: 'after-buff-consumed',
          event: { kind: 'buffConsumed' },
          priority: 4,
          sequence: {
            steps: [
              {
                kind: 'applyStatus',
                parameters: {
                  statusKey: 'lone-barge-battle-skill-bonus',
                  target: 'caster',
                  durationFrames: 600,
                  modifiers: [
                    {
                      kind: 'attackPercent',
                      value: [0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44, 0.48, 0.56],
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  ],
};

const xiranflowArmor: GearDefinition = {
  slug: 'xiranflow-light-armor',
  slotType: 'armor',
  levelRequirement: 70,
  baseDefense: 56,
  gearSetSlug: 'xiranflow',
  traits: [
    {
      key: 'will',
      levelCount: 4,
      display: gearDisplay,
      modifiers: [
        { kind: 'attribute', attribute: 'will', operation: 'flat', value: [87, 95, 104, 113] },
      ],
    },
  ],
};

const attributes = { main: 'intellect', secondary: 'will' } as const;

describe('compile equipment contributions', () => {
  it('启用前后两个程序按同一词条等级编译', () => {
    const sequence = {
      steps: [
        {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: [2, 5],
            recipient: 'team',
          },
        },
      ],
    } as const;
    const [result] = compileWeaponContributions(
      {
        ...loneBarge,
        traits: [
          {
            key: 'fixture',
            levelCount: 2,
            enableSequence: sequence,
            initializationSequence: sequence,
          },
        ],
      },
      [2],
      attributes,
    );
    for (const field of ['enableSequence', 'initializationSequence'] as const)
      expect(result?.[field]?.steps[0]).toMatchObject({
        kind: 'changeResource',
        parameters: { amount: 5 },
      });
  });
  it('resolves each weapon trait with its independently selected level', () => {
    const compiled = compileWeaponContributions(loneBarge, [9, 1, 4], attributes);

    expect(compiled.map(entry => entry.modifiers[0])).toEqual([
      { kind: 'attribute', attribute: 'will', operation: 'flat', value: 156 },
      { kind: 'panelStat', stat: 'attackPercent', value: 0.05 },
      { kind: 'damageBonus', damageTypes: 'electric', value: 0.256 },
    ]);
    expect(compiled[2]!.eventHandlers[0]!.sequence.steps[0]).toMatchObject({
      kind: 'applyStatus',
      parameters: { modifiers: [{ kind: 'attackPercent', value: 0.32 }] },
    });
    expect(compiled[2]!.eventHandlers[0]!.priority).toBe(4);
  });

  it('maps zero-based artificing to one-based level values', () => {
    const [compiled] = compileGearContributions(xiranflowArmor, [3], attributes);
    expect(compiled!.selectedLevel).toBe(4);
    expect(compiled!.modifiers[0]).toEqual({
      kind: 'attribute',
      attribute: 'will',
      operation: 'flat',
      value: 113,
    });
  });

  it('preserves native damage-scale identity at the selected gear level', () => {
    const damageScaleGear: GearDefinition = {
      ...xiranflowArmor,
      traits: [
        {
          key: 'staggered-damage',
          levelCount: 4,
          display: gearDisplay,
          modifiers: [
            { kind: 'damageScale', target: 'staggeredEnemy', value: [0.1, 0.2, 0.3, 0.4] },
          ],
        },
      ],
    };

    expect(compileGearContributions(damageScaleGear, [2], attributes)[0]!.modifiers).toEqual([
      { kind: 'damageScale', target: 'staggeredEnemy', slot: 'baseAddition', value: 0.3 },
    ]);
  });

  it('resolves relative main and secondary attributes from the equipped operator', () => {
    const relativeGear: GearDefinition = {
      ...xiranflowArmor,
      traits: [
        {
          key: 'relative-attributes',
          levelCount: 1,
          display: gearDisplay,
          modifiers: [
            { kind: 'attribute', attribute: 'main', operation: 'flat', value: 10 },
            { kind: 'attribute', attribute: 'secondary', operation: 'percent', value: 0.2 },
          ],
        },
      ],
    };

    expect(compileGearContributions(relativeGear, [0], attributes)[0]!.modifiers).toEqual([
      { kind: 'attribute', attribute: 'intellect', operation: 'flat', value: 10 },
      { kind: 'attribute', attribute: 'will', operation: 'percent', value: 0.2 },
    ]);
  });

  it('compiles an active three-piece set at its single definition level', () => {
    const set: GearSetDefinition = {
      slug: 'hot-work',
      modifiers: [{ kind: 'panelStat', stat: 'artsIntensity', value: 30 }],
      buffDefinitions: {
        'buff.hot-work': { stackingType: 'unique' },
      },
      initializationSequence: {
        steps: [
          {
            kind: 'applyBuff',
            parameters: { buffId: 'buff.hot-work', target: 'caster' },
          },
        ],
      },
    };
    const compiled = compileGearSetContribution(set, attributes);
    expect(compiled).toMatchObject({
      source: { kind: 'gearSet', slug: 'hot-work' },
      selectedLevel: 1,
      modifiers: [{ kind: 'panelStat', stat: 'artsIntensity', value: 30 }],
      buffDefinitions: { 'buff.hot-work': { stackingType: 'unique' } },
      initializationSequence: {
        steps: [{ kind: 'applyBuff', parameters: { buffId: 'buff.hot-work', target: 'caster' } }],
      },
    });
  });

  it('resolves equipment healing modifiers and event blackboards at the selected level', () => {
    const definition: WeaponDefinition = {
      slug: 'healing-weapon',
      rarity: 6,
      weaponType: 'polearm',
      baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
      traits: [
        {
          key: 'healing',
          levelCount: 2,
          modifiers: [{ kind: 'staticHealingIncrease', target: 'output', value: [0.1, 0.2] }],
          blackboard: { rate: [0.05, 0.1] },
          eventHandlers: [
            {
              key: 'heal-output',
              event: { kind: 'operatorHealed', role: 'source' },
              sequence: { steps: [] },
            },
          ],
        },
      ],
    };

    const [compiled] = compileWeaponContributions(definition, [2], attributes);
    expect(compiled!.modifiers).toEqual([
      { kind: 'staticHealingIncrease', target: 'output', value: 0.2 },
    ]);
    expect(compiled!.blackboard).toEqual({ rate: 0.1 });
  });

  it('resolves the initialization blackboard at the selected trait level', () => {
    const definition: WeaponDefinition = {
      slug: 'runtime-weapon',
      rarity: 5,
      weaponType: 'sword',
      baseAttackAtLevelNodes: [1, 2, 3, 4, 5, 6],
      traits: [
        {
          key: 'runtime',
          levelCount: 3,
          blackboard: { duration: 10, attack_up: [0.1, 0.2, 0.3] },
          initializationSequence: { steps: [] },
        },
      ],
    };

    expect(compileWeaponContributions(definition, [2], attributes)[0]).toMatchObject({
      blackboard: { duration: 10, attack_up: 0.2 },
      initializationSequence: { steps: [] },
    });
  });

  it('fails when build levels cannot map one-to-one to definition traits', () => {
    expect(() => compileWeaponContributions(loneBarge, [1, 1], attributes)).toThrow(
      "weapon 'lone-barge' expects 3 trait levels",
    );
    expect(() => compileGearContributions(xiranflowArmor, [4], attributes)).toThrow(
      'level must be an integer between 1 and 4',
    );
  });
});
