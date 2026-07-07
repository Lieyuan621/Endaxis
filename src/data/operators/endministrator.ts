import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'ENDMINISTRATOR',
  rarity: 6,
  weapon: 'sword',
  element: 'physical',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'guard',
  mainAttribute: 'agility',
  subAttribute: 'strength',
  attributes: {
    Strength: [14, 38, 62, 86, 111, 123],
    Agility: [14, 41, 69, 98, 126, 140],
    Intellect: [9, 28, 47, 67, 87, 96],
    Will: [10, 31, 53, 74, 96, 107],
    'Base ATK': [30, 92, 157, 222, 287, 319],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  defaultPotential: 2,
  talents: [
    {
      levels: 2,
      triggers: [
        {
          trigger: {
            kind: 'onStatusConsumed',
            status: 'endministrator-originium-crystals',
            target: 'enemy',
            triggerScope: 'global',
          },
          effects: [
            {
              id: 'endministrator-t1',
              kind: 'status',
              stat: { modifier: 'atkPercent' },
              target: 'self',
              value: [15, 30],
              duration: 15,
            },
          ],
        },
      ],
    },
    {
      levels: 2,
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'increasedDmgTaken', elements: 'physical' },
          value: [10, 20],
          condition: {
            kind: 'enemyStatus',
            status: 'endministrator-originium-crystals',
          },
        },
      ],
    },
  ],
  potentials: [
    {
      triggers: [
        {
          trigger: { kind: 'onHit', skillTypes: 'battleSkill' },
          effects: [
            {
              kind: 'spReturn',
              value: 50,
              condition: {
                kind: 'enemyStatus',
                status: 'endministrator-originium-crystals',
              },
            },
          ],
        },
      ],
    },
    {
      patches: [
        {
          kind: 'appendEffect',
          targetEffect: 'endministrator-t1',
          effect: {
            kind: 'status',
            stat: { modifier: 'atkPercent' },
            target: 'teamExcludeSelf',
            value: [7.5, 15],
            duration: 15,
          },
        },
      ],
    },
    {},
    {},
    {},
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.33,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [23, 25, 27, 29, 32, 34, 36, 39, 41, 44, 47, 51],
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
          duration: 0.43,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [27, 30, 32, 35, 38, 41, 43, 46, 49, 52, 56, 61],
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
          duration: 0.6,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 63, 68],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.17,
                },
                {
                  offset: 0.4,
                },
              ],
            },
          ],
        },
        {
          duration: 1.1,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [35, 38, 41, 45, 48, 52, 55, 59, 62, 67, 72, 78],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.23,
                },
                {
                  offset: 0.3,
                },
                {
                  offset: 0.6,
                },
                {
                  offset: 0.63,
                },
              ],
            },
          ],
        },
        {
          duration: 0.867,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [40, 44, 48, 52, 56, 60, 64, 68, 72, 77, 83, 90],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.6,
                  spRecovery: 20,
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
          duration: 0.8,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [156, 171, 187, 202, 218, 234, 249, 265, 280, 300, 323, 350],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.37,
                  stagger: 10,
                  effects: [{ kind: 'physicalStatus', physicalType: 'crush' }],
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
              element: 'physical',
              multiplier: [45, 49, 54, 58, 62, 67, 71, 76, 80, 86, 93, 100],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.77,
                  stagger: 10,
                  effects: [
                    {
                      id: 'endministrator-originium-crystals',
                      name: 'originiumCrystals',
                      kind: 'status',
                      target: 'enemy',
                      duration: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4.5, 4.5, 5],
                      icon: '/operators/endministrator/icon_skill_endmin_debuff.webp',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      triggers: [
        {
          trigger: {
            kind: 'onStatusApplied',
            status: ['vulnerability', 'lift', 'knockdown', 'crush', 'breach'],
            target: 'enemy',
            triggerScope: 'global',
          },
          effects: [
            {
              kind: 'damageHit',
              element: 'physical',
              multiplier: [178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400],
              readConsumedStacks: {
                statusKey: 'endministrator-originium-crystals',
                target: 'enemy',
              },
              condition: {
                kind: 'enemyStatus',
                status: 'endministrator-originium-crystals',
                consume: true,
              },
              icd: 0.01,
            },
          ],
        },
      ],
      cooldown: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 15],
    },
    ultimate: {
      segments: [
        {
          duration: 1.83,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [356, 391, 427, 462, 498, 533, 569, 604, 640, 684, 738, 800],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.67,
                  stagger: 25,
                },
              ],
            },
            {
              element: 'physical',
              multiplier: [267, 294, 320, 347, 374, 400, 427, 454, 480, 514, 554, 600],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.67,
                },
              ],
              condition: {
                kind: 'enemyStatus',
                status: 'endministrator-originium-crystals',
              },
            },
          ],
        },
      ],
      triggers: [
        {
          trigger: {
            kind: 'onHit',
            skillTypes: 'ultimate',
          },
          skillLevelKey: 'comboSkill',
          effects: [
            {
              kind: 'damageHit',
              element: 'physical',
              multiplier: [178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400],
              readConsumedStacks: {
                statusKey: 'endministrator-originium-crystals',
                target: 'enemy',
              },
              condition: {
                kind: 'enemyStatus',
                status: 'endministrator-originium-crystals',
                consume: true,
              },
              icd: 0.01,
            },
          ],
        },
      ],
      ultimateEnergyCost: 80,
      animationTime: 1.467,
      cooldown: 10,
    },
  },
};

export default sheet;
