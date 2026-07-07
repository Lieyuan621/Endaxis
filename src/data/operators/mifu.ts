import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  new: true,
  gameId: 'MIFU',
  rarity: 6,
  weapon: 'greatsword',
  element: 'physical',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'striker',
  mainAttribute: 'strength',
  subAttribute: 'will',
  attributes: {
    Strength: [22, 54, 88, 122, 156, 173],
    Agility: [10, 27, 46, 65, 83, 92],
    Intellect: [9, 27, 45, 63, 81, 90],
    Will: [14, 37, 60, 84, 107, 119],
    'Base ATK': [30, 91, 155, 219, 283, 315],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      effects: [
        {
          id: 'mifu-t1',
          kind: 'status',
          stat: {
            modifier: 'directMultiplier',
            skillId: 'mifu-world-splitter',
          },
          target: 'self',
          value: [1.1, 1.2],
          condition: {
            kind: 'or',
            conditions: [
              { kind: 'enemyStatus', status: { modifier: 'susceptibility', elements: 'physical' } },
              { kind: 'enemyStaggered' },
            ],
          },
          hide: true,
        },
      ],
    },
    {
      levels: 2,
      triggers: [
        {
          trigger: {
            kind: 'onActionStart',
            skillTypes: ['comboSkill'],
          },
          effects: [
            {
              id: 'mifu-t2-shield',
              kind: 'status',
              stat: { modifier: 'shield' },
              target: 'self',
              duration: 10,
              icd: 60,
            },
          ],
        },
      ],
    },
  ],
  potentials: [
    {
      effects: [
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
          targetEffect: 'mifu-combo-physical-susceptibility',
          effect: {
            value: 10,
            duration: 20,
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
          value: 20,
        },
        {
          kind: 'status',
          stat: { modifier: 'artsIntensity' },
          target: 'self',
          value: 16,
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'mifu-t2-shield',
          effect: {
            duration: 15,
            icd: 45,
          },
        },
      ],
      triggers: [
        {
          trigger: {
            kind: 'onActionStart',
            skillTypes: ['comboSkill'],
          },
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'atkPercent' },
              target: 'self',
              value: 6,
              duration: 20,
              icd: 45,
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
          stat: {
            modifier: 'directMultiplier',
            skillTypes: ['battleSkill'],
          },
          target: 'self',
          value: 1.1,
        },
      ],
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'mifu-t1',
          effect: {
            scaling: {
              additive: [0.1],
            },
          },
        },
        {
          kind: 'patchHit',
          targetHit: 'mifu-ult-hit-1',
          hit: {
            stagger: 12.5,
          },
        },
        {
          kind: 'patchHit',
          targetHit: 'mifu-ult-hit-2',
          hit: {
            stagger: 12.5,
          },
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.767,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [34, 37, 41, 44, 47, 51, 54, 57, 61, 65, 70, 76],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.433,
                },
              ],
            },
          ],
        },
        {
          duration: 0.833,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [38, 42, 46, 50, 54, 57, 61, 65, 69, 74, 79, 86],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.267,
                },
                {
                  offset: 0.567,
                },
              ],
            },
          ],
        },
        {
          duration: 1.567,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [61, 67, 73, 79, 85, 91, 97, 103, 109, 116, 126, 136],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.367,
                },
                {
                  offset: 0.567,
                },
                {
                  offset: 1.167,
                },
              ],
            },
          ],
        },
        {
          duration: 1.267,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [77, 84, 92, 99, 107, 115, 122, 130, 138, 147, 159, 172],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.233,
                },
                {
                  offset: 1.067,
                  spRecovery: 28,
                  stagger: 25,
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
          duration: 0.533,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [67, 73, 80, 87, 93, 100, 107, 113, 120, 128, 138, 150],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.267,
                  spReturn: 50,
                },
              ],
            },
          ],
        },
        {
          spCost: 50,
          duration: 1.233,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [89, 98, 107, 116, 125, 134, 143, 151, 160, 172, 185, 200],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.1,
                },
                {
                  offset: 0.333,
                },
                {
                  offset: 0.8,
                  stagger: 5,
                  effects: [{ kind: 'physicalStatus', physicalType: 'crush' }],
                },
              ],
            },
          ],
        },
        {
          skillId: 'mifu-world-splitter',
          spCost: 50,
          duration: 1.733,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [400, 416, 432, 448, 464, 480, 496, 512, 528, 548, 572, 600],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.133,
                  stagger: 10,
                  treatAsReaction: 'crush',
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
          duration: 1.767,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [111, 122, 133, 144, 155, 167, 178, 189, 200, 214, 230, 250],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.267,
                },
                {
                  offset: 1.433,
                  stagger: 10,
                  effects: [
                    {
                      id: 'mifu-combo-physical-susceptibility',
                      kind: 'status',
                      stat: { modifier: 'susceptibility', elements: 'physical' },
                      value: 5,
                      duration: 16,
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
          duration: 4.3,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [311, 342, 373, 404, 435, 466, 498, 529, 560, 599, 645, 700],
              multiplierMode: 'split',
              hits: [
                {
                  id: 'mifu-ult-hit-1',
                  offset: 2.5,
                  weight: 2,
                  stagger: 10,
                  effects: [{ kind: 'physicalStatus', physicalType: 'lift', forced: true }],
                },
                {
                  id: 'mifu-ult-hit-2',
                  offset: 3.7,
                  weight: 5,
                  stagger: 10,
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 80,
      animationTime: 2.367,
      cooldown: 15,
    },
  },
};

export default sheet;