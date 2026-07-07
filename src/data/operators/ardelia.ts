import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'ARDELIA',
  rarity: 6,
  weapon: 'arts-unit',
  element: 'nature',
  finisherElement: 'nature',
  diveElement: 'nature',
  class: 'supporter',
  mainAttribute: 'intellect',
  subAttribute: 'will',
  attributes: {
    Strength: [9, 31, 54, 77, 100, 112],
    Agility: [9, 27, 46, 65, 84, 93],
    Intellect: [20, 46, 75, 103, 131, 145],
    Will: [15, 37, 60, 83, 106, 118],
    'Base ATK': [30, 93, 159, 225, 291, 323],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 3,
    },
    {
      levels: 1,
    },
  ],
  potentials: [
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'ardelia-battle-physical-susceptibility',
          effect: {
            scaling: {
              additive: [8],
            },
          },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'ardelia-battle-arts-susceptibility',
          effect: {
            scaling: {
              additive: [8],
            },
          },
        },
      ],
    },
    {}, // p2
    {
      patches: [
        {
          kind: 'patchTick',
          targetTick: 'ardelia-ultimate',
          tick: { hitCount: 6 },
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
          stat: { modifier: 'directMultiplier', skillTypes: 'comboSkill' },
          target: 'self',
          value: 1.2,
        },
        {
          kind: 'status',
          stat: { modifier: 'cooldownReductionFlat', skillTypes: 'comboSkill' },
          target: 'self',
          value: 2,
        },
      ],
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'ardelia-combo-corrosion',
          effect: {
            durationExtension: 4,
          },
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.4,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.2,
                },
              ],
            },
          ],
        },
        {
          duration: 0.7,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [40, 44, 48, 52, 56, 60, 64, 68, 72, 77, 83, 90],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.267,
                },
                {
                  offset: 0.33,
                },
              ],
            },
          ],
        },
        {
          duration: 1.53,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [53, 58, 63, 68, 74, 79, 84, 89, 95, 101, 109, 118],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.367,
                },
                {
                  offset: 0.43,
                },
                {
                  offset: 1.3,
                },
              ],
            },
          ],
        },
        {
          duration: 2.167,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [55, 61, 66, 72, 77, 83, 88, 94, 99, 106, 114, 124],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 2.167,
                  spRecovery: 18,
                  stagger: 18,
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
          duration: 1.57,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [142, 156, 171, 185, 199, 213, 228, 242, 256, 274, 295, 320],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.07,
                  stagger: 10,
                  effects: [
                    {
                      id: 'ardelia-battle-physical-susceptibility',
                      kind: 'status',
                      stat: { modifier: 'susceptibility', elements: 'physical' },
                      value: [12, 12, 12, 13, 13, 13, 14, 14, 16, 17, 18, 20],
                      duration: 30,
                      condition: {
                        kind: 'enemyStatus',
                        status: 'corrosion',
                        consume: true,
                      },
                    },
                    {
                      id: 'ardelia-battle-arts-susceptibility',
                      kind: 'status',
                      stat: {
                        modifier: 'susceptibility',
                        elements: ['heat', 'cryo', 'electric', 'nature'],
                      },
                      value: [12, 12, 12, 13, 13, 13, 14, 14, 16, 17, 18, 20],
                      duration: 30,
                      condition: {
                        kind: 'enemyStatus',
                        status: 'corrosion',
                      },
                    },
                  ],
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
          duration: 0.77,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [45, 49, 54, 58, 62, 67, 71, 76, 80, 86, 93, 100],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.67,
                },
              ],
            },
            {
              element: 'nature',
              multiplier: [111, 122, 133, 144, 155, 167, 178, 189, 200, 214, 230, 250],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 2.4,
                  stagger: 10,
                  effects: [
                    {
                      id: 'ardelia-combo-corrosion',
                      kind: 'reaction',
                      reactionType: 'corrosion',
                      duration: 7,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 17],
    },
    ultimate: {
      segments: [
        {
          duration: 6.97,
          damageGroups: [
            {
              element: 'nature',
              id: 'ardelia-ultimate',
              multiplier: [73, 81, 88, 95, 103, 110, 117, 125, 132, 141, 152, 165],
              multiplierMode: 'each',
              tick: {
                offset: 2.7,
                duration: 4,
                hitCount: 5,
                stagger: () => [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3],
                durationExtension: i => (i === 5 ? 1 : 0),
              },
            },
          ],
        },
      ],
      ultimateEnergyCost: 90,
      animationTime: 2.5,
      cooldown: 15,
    },
  },
};

export default sheet;
