import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'ARCLIGHT',
  rarity: 5,
  weapon: 'sword',
  element: 'electric',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'vanguard',
  mainAttribute: 'agility',
  subAttribute: 'intellect',
  attributes: {
    Strength: [14, 33, 54, 75, 96, 107],
    Agility: [14, 42, 71, 101, 130, 145],
    Intellect: [12, 36, 61, 86, 111, 123],
    Will: [10, 29, 49, 69, 89, 100],
    'Base ATK': [30, 89, 151, 213, 275, 306],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'arclight-battle-additional-hit',
          hit: {
            effects: [
              {
                id: 'arclight-t1-tracker',
                kind: 'status',
                target: 'self',
                maxStacks: 3,
                duration: 999,
                hide: true,
              },
            ],
          },
        },
      ],
      triggers: [
        {
          trigger: { kind: 'onStatusApplied', status: 'arclight-t1-tracker', target: 'self' },
          effects: [
            {
              id: 'arclight-t1-dmg-bonus',
              kind: 'status',
              stat: { modifier: 'dmgBonus', elements: 'electric' },
              target: 'team',
              scaling: {
                additive: [{ basis: 'intellect', coefficient: [0.05, 0.08] }],
              },
              duration: 15,
              condition: {
                kind: 'operatorStatus',
                status: 'arclight-t1-tracker',
                stacks: { compare: 'exact', count: 3 },
                consume: true,
              },
              icon: '/operators/arclight/icon_battle_ikut_talent_1.webp',
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
          kind: 'patchHit',
          targetHit: 'arclight-battle-additional-hit',
          hit: {
            spRecovery: [40, 40, 40, 40, 40, 45, 45, 45, 45, 45, 45, 50],
          },
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: ['agility', 'intellect'] },
          target: 'self',
          value: 15,
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'arclight-t1-dmg-bonus',
          effect: {
            scaling: { multiplier: [1.3] },
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
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'arclight-t1-tracker',
          effect: {
            maxStacks: 2,
          },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'arclight-t1-dmg-bonus',
          effect: {
            condition: {
              kind: 'operatorStatus',
              status: 'arclight-t1-tracker',
              stacks: { compare: 'exact', count: 2 },
              consume: true,
            },
          },
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.33,
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
          duration: 0.367,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [13, 14, 15, 16, 18, 19, 20, 21, 23, 24, 26, 28],
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
          duration: 0.7,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [26, 29, 31, 34, 36, 39, 42, 44, 47, 50, 54, 59],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.23,
                },
                {
                  offset: 0.43,
                },
              ],
            },
          ],
        },
        {
          duration: 0.93,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [36, 40, 43, 47, 50, 54, 58, 61, 65, 69, 75, 81],
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
          duration: 1,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [48, 52, 57, 62, 67, 71, 76, 81, 86, 91, 99, 107],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.4,
                  spRecovery: 17,
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
          duration: 1,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [45, 50, 54, 59, 63, 68, 72, 77, 81, 87, 93, 101],
              multiplierMode: 'each',
              hits: [
                {
                  offset: 0.63,
                },
                {
                  offset: 0.8,
                  stagger: 5,
                },
              ],
            },
            {
              element: 'electric',
              multiplier: [180, 198, 216, 234, 252, 270, 288, 306, 324, 347, 374, 405],
              multiplierMode: 'split',
              hits: [
                {
                  id: 'arclight-battle-additional-hit',
                  offset: 1.2,
                  spRecovery: [30, 30, 30, 30, 30, 35, 35, 35, 35, 35, 35, 40],
                  stagger: 5,
                  durationExtension: 0.2,
                },
              ],
              condition: { kind: 'enemyStatus', status: 'electrification', consume: true },
            },
          ],
        },
      ],
    },
    comboSkill: {
      comboWindow: {
        triggers: [
          {
            trigger: {
              kind: 'onStatusApplied',
              status: 'electrification',
              target: 'enemy',
              triggerScope: 'global',
            },
          },
          {
            trigger: {
              kind: 'onStatusConsumed',
              status: 'electrification',
              target: 'enemy',
              triggerScope: 'global',
            },
          },
        ],
        duration: 5,
      },
      ultimateEnergyGain: 0,
      segments: [
        {
          duration: 0.9,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [155, 171, 186, 202, 218, 233, 249, 264, 280, 299, 322, 350],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.57,
                },
                {
                  offset: 0.7,
                },
                {
                  offset: 0.83,
                  spRecovery: [8, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10],
                  stagger: 5,
                  effects: [
                    {
                      kind: 'ultEnergyGain',
                      value: 5,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      cooldown: 3,
    },
    ultimate: {
      segments: [
        {
          duration: 2.57,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [156, 171, 187, 202, 218, 234, 249, 265, 280, 300, 323, 350],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 2.03,
                  stagger: [7, 7, 7, 7, 7, 7, 7, 7, 7, 10, 10, 10],
                  effects: [{ kind: 'infliction', element: 'electric', applyTiming: 'beforeDamage' }],
                },
              ],
            },
            {
              element: 'electric',
              multiplier: [244, 269, 293, 318, 342, 367, 391, 415, 440, 470, 507, 550],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 3.9,
                  stagger: [7, 7, 7, 7, 7, 7, 7, 7, 7, 10, 10, 10],
                  effects: [
                    {
                      kind: 'reaction',
                      reactionType: 'electrification',
                      requiresInfliction: ['electric'],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 90,
      animationTime: 1.9,
      cooldown: 15,
    },
  },
};

export default sheet;
