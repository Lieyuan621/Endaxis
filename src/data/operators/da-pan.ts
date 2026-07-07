import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'DAPAN',
  rarity: 5,
  weapon: 'greatsword',
  element: 'physical',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'striker',
  mainAttribute: 'strength',
  subAttribute: 'will',
  attributes: {
    Strength: [24, 56, 90, 124, 158, 175],
    Agility: [9, 28, 47, 67, 87, 96],
    Intellect: [10, 28, 47, 66, 85, 94],
    Will: [10, 30, 50, 71, 91, 102],
    'Base ATK': [30, 88, 150, 211, 272, 303],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      triggers: [
        {
          trigger: { kind: 'onStatusConsumed', status: 'vulnerability', target: 'enemy' },
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'dmgBonus', elements: 'physical' },
              target: 'self',
              value: [4, 6],
              maxStacks: 4,
              duration: 10,
              stacks: 'fromConsume',
            },
          ],
        },
      ],
    },
    {
      levels: 2,
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'da-pan-ultimate-last-hit',
          hit: {
            effects: [
              {
                id: 'da-pan-t2',
                name: 'prepIngredients',
                kind: 'status',
                target: 'self',
                duration: 20,
                maxStacks: [1, 2],
                icon: '/operators/da-pan/icon_battle_dapan_buff.webp',
              },
            ],
          },
        },
      ],
      triggers: [
        {
          trigger: { kind: 'onHit', skillTypes: 'comboSkill' },
          effects: [
            {
              kind: 'cooldownReductionPercent',
              skillTypes: 'comboSkill',
              target: 'self',
              value: 40,
              condition: { kind: 'operatorStatus', status: 'da-pan-t2', consume: 1 },
            },
          ],
        },
      ],
    },
  ],
  potentials: [
    {},
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'da-pan-t2',
          effect: {
            durationExtension: 10,
            // maxStack increase is skipped
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
          stat: { modifier: 'ultimateEnergyCostReduction' },
          target: 'self',
          value: 15,
        },
      ],
    },
    {
      triggers: [
        {
          trigger: { kind: 'onHit', skillTypes: 'battleSkill' },
          effects: [
            {
              kind: 'physicalStatus',
              physicalType: 'vulnerability',
              icd: 45,
            },
          ],
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.53,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [28, 31, 34, 37, 39, 42, 45, 48, 51, 54, 58, 63],
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
          duration: 0.7,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [34, 37, 40, 44, 47, 50, 54, 57, 60, 64, 70, 75],
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
          duration: 0.867,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [50, 55, 60, 65, 70, 75, 80, 85, 90, 97, 104, 113],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.33,
                },
                {
                  offset: 0.77,
                },
              ],
            },
          ],
        },
        {
          duration: 1.53,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [60, 66, 72, 78, 84, 90, 96, 103, 109, 116, 125, 136],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.07,
                  spRecovery: 21,
                  stagger: 20,
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
          duration: 2.17,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [133, 147, 160, 173, 186, 200, 213, 226, 240, 256, 276, 300],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.43,
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
          duration: 0.8,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [289, 318, 347, 375, 404, 433, 462, 491, 520, 556, 599, 650],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.76,
                  stagger: 15,
                  effects: [
                    {
                      kind: 'physicalStatus',
                      physicalType: 'crush',
                      effectiveness: [
                        1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.15, 1.15, 1.15, 1.2,
                      ],
                    },
                  ],
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
          duration: 2.87,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [22, 24, 26, 29, 31, 33, 35, 37, 40, 42, 46, 50],
              multiplierMode: 'each',
              hits: [
                {
                  offset: 1.4,
                  effects: [{ kind: 'physicalStatus', physicalType: 'lift', forced: true }],
                },
                {
                  offset: 1.55,
                },
                {
                  offset: 1.7,
                },
                {
                  offset: 1.85,
                },
                {
                  offset: 2.0,
                },
                {
                  offset: 2.15,
                },
              ],
            },
            {
              element: 'physical',
              multiplier: [178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400],
              multiplierMode: 'split',
              hits: [
                {
                  id: 'da-pan-ultimate-last-hit',
                  offset: 2.67,
                  effects: [{ kind: 'physicalStatus', physicalType: 'knockdown', forced: true }],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 90,
      animationTime: 1.4,
      cooldown: 15,
    },
  },
};

export default sheet;
