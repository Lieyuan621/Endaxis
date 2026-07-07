import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'ALESH',
  rarity: 5,
  weapon: 'sword',
  element: 'cryo',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'vanguard',
  mainAttribute: 'strength',
  subAttribute: 'intellect',
  attributes: {
    Strength: [20, 49, 80, 111, 142, 158],
    Agility: [9, 27, 47, 66, 86, 95],
    Intellect: [13, 37, 62, 87, 113, 125],
    Will: [10, 27, 45, 63, 81, 89],
    'Base ATK': [30, 90, 152, 215, 277, 309],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      triggers: [
        {
          trigger: {
            kind: 'onStatusApplied',
            status: 'solidification',
            target: 'enemy',
            triggerScope: 'global',
          },
          effects: [
            {
              kind: 'ultEnergyGain',
              target: 'owner',
              value: [3, 4],
              icd: 3,
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusApplied',
            status: 'solidification',
            target: 'enemy',
          },
          effects: [
            {
              kind: 'ultEnergyGain',
              target: 'self',
              value: [6, 8],
              icd: 3,
            },
          ],
        },
      ],
    },
    {
      levels: 2,
    },
  ],
  potentials: [
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'alesh-battle-sp-gain-1',
          effect: {
            scaling: {
              additive: [10],
            },
          },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'alesh-battle-sp-gain-2',
          effect: {
            scaling: {
              additive: [10],
            },
          },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'alesh-battle-sp-gain-3',
          effect: {
            scaling: {
              additive: [10],
            },
          },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'alesh-battle-sp-gain-4',
          effect: {
            scaling: {
              additive: [10],
            },
          },
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: 'strength' },
          target: 'self',
          value: 15,
        },
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: 'intellect' },
          target: 'self',
          value: 15,
        },
      ],
    },
    {
      triggers: [
        {
          trigger: { kind: 'onSpRecovery', skillId: 'alesh-enhanced-combo' },
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'atkPercent' },
              target: 'team',
              value: 15,
              duration: 10,
            },
          ],
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
          stat: { modifier: 'directMultiplier', skillTypes: 'ultimate' },
          target: 'self',
          value: 1.5,
          condition: {
            kind: 'enemyHp',
            compare: 'below',
            percent: 50,
          },
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.43,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [18, 19, 21, 23, 25, 26, 28, 30, 32, 34, 36, 39],
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
          duration: 0.367,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 23],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.17,
                },
              ],
            },
          ],
        },
        {
          duration: 0.567,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [28, 30, 33, 36, 39, 41, 44, 47, 50, 53, 57, 62],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.43,
                },
              ],
            },
          ],
        },
        {
          duration: 0.767,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [28, 30, 33, 36, 39, 41, 44, 47, 50, 53, 57, 62],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.5,
                },
              ],
            },
          ],
        },
        {
          duration: 1.067,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [55, 61, 66, 72, 77, 83, 88, 94, 99, 106, 114, 124],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.6,
                  spRecovery: 19,
                  stagger: 17,
                },
                {
                  offset: 0.63,
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
          duration: 1.67,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [200, 220, 240, 260, 280, 300, 320, 340, 360, 385, 415, 450],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.9,
                  stagger: 10,
                  effects: [
                    {
                      kind: 'reaction',
                      reactionType: 'solidification',
                      requiresInfliction: ['cryo'],
                    },
                    {
                      id: 'alesh-battle-sp-gain-1',
                      kind: 'spRecovery',
                      value: [10, 10, 10, 10, 10, 10, 10, 10, 10, 15, 15, 15],
                      condition: {
                        kind: 'enemyStatus',
                        status: 'cryoInfliction',
                        stacks: { compare: 'exact', count: 1 },
                      },
                    },
                    {
                      id: 'alesh-battle-sp-gain-2',
                      kind: 'spRecovery',
                      value: [20, 20, 20, 20, 20, 20, 20, 20, 20, 25, 25, 25],
                      condition: {
                        kind: 'enemyStatus',
                        status: 'cryoInfliction',
                        stacks: { compare: 'exact', count: 2 },
                      },
                    },
                    {
                      id: 'alesh-battle-sp-gain-3',
                      kind: 'spRecovery',
                      value: [30, 30, 30, 30, 30, 30, 30, 30, 30, 35, 35, 35],
                      condition: {
                        kind: 'enemyStatus',
                        status: 'cryoInfliction',
                        stacks: { compare: 'exact', count: 3 },
                      },
                    },
                    {
                      id: 'alesh-battle-sp-gain-4',
                      kind: 'spRecovery',
                      value: [40, 40, 40, 40, 40, 40, 40, 40, 40, 45, 45, 45],
                      condition: {
                        kind: 'enemyStatus',
                        status: 'cryoInfliction',
                        stacks: { compare: 'exact', count: 4 },
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
          duration: 1.3,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [133, 147, 160, 173, 187, 200, 213, 227, 240, 257, 277, 300],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.27,
                  spRecovery: [10, 10, 10, 10, 10, 12, 12, 12, 12, 13, 13, 15],
                  stagger: 10,
                },
              ],
            },
          ],
        },
      ],
      cooldown: [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8],
      subSkills: [
        {
          id: 'alesh-enhanced-combo',
          group: 'comboSkill',
          name: 'enhancedComboSkill',
          segments: [
            {
              duration: 1.3,
              damageGroups: [
                {
                  element: 'physical',
                  multiplier: [213, 235, 256, 277, 299, 320, 341, 363, 384, 411, 443, 480],
                  multiplierMode: 'split',
                  hits: [
                    {
                      offset: 1.27,
                      spRecovery: [20, 20, 20, 20, 20, 22, 22, 22, 22, 23, 23, 25],
                      stagger: 10,
                    },
                  ],
                },
              ],
            },
          ],
          cooldown: [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8],
        },
      ],
    },
    ultimate: {
      segments: [
        {
          duration: 3.2,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [436, 479, 523, 566, 610, 653, 697, 741, 784, 839, 904, 980],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 3,
                  spRecovery: [20, 20, 20, 20, 20, 20, 20, 20, 20, 25, 25, 25],
                  stagger: 20,
                  effects: [{ kind: 'infliction', element: 'cryo' }],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 100,
      animationTime: 2.583,
      cooldown: 20,
    },
  },
};

export default sheet;
