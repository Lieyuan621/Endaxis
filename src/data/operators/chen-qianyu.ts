import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'CHENQIANYU',
  rarity: 5,
  weapon: 'sword',
  element: 'physical',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'guard',
  mainAttribute: 'agility',
  subAttribute: 'strength',
  attributes: {
    Strength: [10, 31, 52, 74, 95, 106],
    Agility: [20, 52, 86, 120, 154, 171],
    Intellect: [8, 25, 42, 59, 77, 85],
    Will: [9, 27, 46, 65, 84, 93],
    'Base ATK': [30, 87, 147, 207, 267, 297],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      triggers: [
        {
          trigger: { kind: 'onHit', skillTypes: ['battleSkill', 'comboSkill', 'ultimate'] },
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'atkPercent' },
              target: 'self',
              value: [4, 8],
              maxStacks: 5,
              duration: 10,
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
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus' },
          target: 'self',
          value: 20,
          condition: {
            kind: 'enemyHp',
            compare: 'below',
            percent: 50,
          },
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: 'agility' },
          target: 'self',
          value: 15,
        },
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus', elements: 'physical' },
          target: 'self',
          value: 8,
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: {
            modifier: 'directMultiplier',
            skillTypes: ['battleSkill', 'comboSkill', 'ultimate'],
          },
          target: 'self',
          value: 1.1,
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
          value: 3,
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.5,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [20, 22, 24, 26, 28, 30, 32, 34, 36, 39, 42, 45],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.27,
                },
                {
                  offset: 0.37,
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
              multiplier: [24, 26, 29, 31, 34, 36, 38, 41, 43, 46, 50, 54],
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
          duration: 0.63,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [27, 29, 32, 35, 38, 40, 43, 46, 48, 52, 56, 60],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.3,
                },
                {
                  offset: 0.4,
                },
              ],
            },
          ],
        },
        {
          duration: 0.73,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.13,
                },
                {
                  offset: 0.33,
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
              multiplier: [40, 44, 48, 52, 56, 60, 64, 68, 72, 77, 83, 90],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.53,
                  spRecovery: 18,
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
          duration: 0.83,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [169, 186, 203, 219, 236, 253, 270, 287, 304, 325, 350, 380],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.43,
                  stagger: 10,
                  effects: [{ kind: 'physicalStatus', physicalType: 'lift' }],
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
              multiplier: [120, 132, 144, 156, 168, 180, 192, 204, 216, 231, 249, 270],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.57,
                  effects: [{ kind: 'physicalStatus', physicalType: 'lift' }],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 15],
    },
    ultimate: {
      segments: [
        {
          duration: 3.73,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [36, 40, 43, 47, 50, 54, 58, 61, 65, 69, 75, 81],
              multiplierMode: 'each',
              hits: [
                {
                  offset: 1.93,
                  stagger: 15,
                },
                {
                  offset: 2.1,
                },
                {
                  offset: 2.267,
                },
                {
                  offset: 2.4,
                },
                {
                  offset: 2.53,
                },
                {
                  offset: 2.67,
                },
              ],
            },
            {
              element: 'physical',
              multiplier: [455, 500, 545, 591, 636, 682, 727, 773, 818, 875, 943, 1023],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 3.43,
                  stagger: 20,
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 70,
      animationTime: 1.63,
      cooldown: 10,
    },
  },
};

export default sheet;
