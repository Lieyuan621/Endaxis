import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'GILBERTA',
  rarity: 6,
  weapon: 'arts-unit',
  element: 'nature',
  finisherElement: 'nature',
  diveElement: 'nature',
  class: 'supporter',
  mainAttribute: 'will',
  subAttribute: 'intellect',
  attributes: {
    Strength: [9, 26, 44, 62, 80, 89],
    Agility: [9, 27, 45, 64, 83, 92],
    Intellect: [16, 39, 64, 89, 114, 127],
    Will: [20, 52, 86, 120, 154, 171],
    'Base ATK': [30, 94, 161, 228, 296, 329],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      effects: [
        {
          id: 'gilberta-t1',
          kind: 'status',
          stat: { modifier: 'ultimateGainEfficiency' },
          target: { scope: 'team', classes: ['guard', 'caster', 'supporter'] },
          value: [4, 7],
        },
      ],
    },
    {
      levels: 2,
    },
  ],
  potentials: [
    {},
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'gilberta-ultimate-susceptibility',
          effect: {
            scaling: {
              additive: [
                // double effect
                {
                  key: 'vulnerability',
                  target: 'enemy',
                  coefficient: [1.8, 1.8, 1.8, 2.2, 2.2, 2.2, 2.6, 2.6, 2.6, 3, 3, 3],
                },
                // treated as having 1 additional stack
                [1.8, 1.8, 1.8, 2.2, 2.2, 2.2, 2.6, 2.6, 2.6, 3, 3, 3].map(x => x * 2),
              ],
              // total stacks max out at 4
              cap: [1.8, 1.8, 1.8, 2.2, 2.2, 2.2, 2.6, 2.6, 2.6, 3, 3, 3].map(x => x * 2 * 4),
            },
          },
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'gilberta-t1',
          effect: {
            scaling: {
              additive: [5],
            },
          },
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'ultimateEnergyCostReduction' },
          target: 'self',
          value: 15,
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'cooldownReductionFlat', skillTypes: 'comboSkill' },
          target: 'self',
          value: 2,
        },
        {
          kind: 'status',
          stat: { modifier: 'directMultiplier', skillTypes: 'comboSkill' },
          target: 'self',
          value: 1.3,
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.63,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.23,
                },
              ],
            },
          ],
        },
        {
          duration: 0.767,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [36, 40, 43, 47, 50, 54, 58, 61, 65, 69, 75, 81],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.13,
                },
                {
                  offset: 0.267,
                },
              ],
            },
          ],
        },
        {
          duration: 0.8,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [41, 45, 49, 53, 57, 61, 65, 69, 73, 78, 84, 91],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.233,
                },
                {
                  offset: 0.333,
                },
                {
                  offset: 0.467,
                },
              ],
            },
          ],
        },
        {
          duration: 1.367,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [50, 55, 60, 65, 70, 75, 80, 85, 90, 96, 104, 112],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.767,
                },
                {
                  offset: 0.833,
                },
                {
                  offset: 0.9,
                  spRecovery: 16,
                  stagger: 16,
                },
              ],
            },
          ],
        },
      ],
    },
    battleSkill: {
      segments: [
        {
          duration: 4.1,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [97, 107, 117, 126, 136, 146, 156, 165, 175, 187, 202, 219],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.97,
                },
                {
                  offset: 1.53,
                },
                {
                  offset: 2.067,
                },
                {
                  offset: 2.6,
                },
              ],
            },
            {
              element: 'nature',
              multiplier: [58, 63, 69, 75, 81, 86, 92, 98, 104, 111, 120, 130],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 3.6,
                  stagger: 10,
                  effects: [{ kind: 'infliction', element: 'nature' }],
                },
              ],
            },
          ],
        },
      ],
    },
    comboSkill: {
      ultimateEnergyGain: 10,
      segments: [
        {
          duration: 1.77,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [140, 154, 168, 182, 196, 210, 224, 238, 252, 270, 291, 315],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.6,
                  stagger: 5,
                  effects: [{ kind: 'physicalStatus', physicalType: 'lift', forced: true }],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 19],
    },
    ultimate: {
      segments: [
        {
          duration: 2.13,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [333, 367, 400, 433, 467, 500, 534, 567, 600, 642, 692, 750],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 2,
                  stagger: 20,
                  effects: [
                    { kind: 'infliction', element: 'nature' },
                    {
                      id: 'gilberta-ultimate-susceptibility',
                      kind: 'status',
                      stat: {
                        modifier: 'susceptibility',
                        elements: ['heat', 'cryo', 'electric', 'nature'],
                      },
                      value: [18, 18, 18, 22, 22, 22, 26, 26, 26, 30, 30, 30],
                      scaling: {
                        additive: [
                          {
                            key: 'vulnerability',
                            target: 'enemy',
                            coefficient: [1.8, 1.8, 1.8, 2.2, 2.2, 2.2, 2.6, 2.6, 2.6, 3, 3, 3],
                          },
                        ],
                      },
                      duration: 5,
                    },
                    {
                      kind: 'status',
                      stat: { modifier: 'slowed' },
                      target: 'enemy',
                      duration: 5,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 90,
      animationTime: 2,
      cooldown: 20,
    },
  },
};

export default sheet;
