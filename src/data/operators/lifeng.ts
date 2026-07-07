import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'LIFENG',
  rarity: 6,
  weapon: 'polearm',
  element: 'physical',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'guard',
  mainAttribute: 'agility',
  subAttribute: 'strength',
  attributes: {
    Strength: [14, 38, 62, 86, 111, 123],
    Agility: [20, 44, 69, 94, 119, 132],
    Intellect: [13, 35, 58, 81, 104, 115],
    Will: [12, 35, 58, 82, 105, 117],
    'Base ATK': [30, 90, 153, 217, 280, 312],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      effects: [
        {
          id: 'lifeng-t1',
          kind: 'status',
          stat: { modifier: 'attributeAtkPercent' },
          target: 'self',
          scaling: {
            additive: [{ basis: ['intellect', 'will'], coefficient: [0.1, 0.15] }],
          },
        },
      ],
    },
    {
      levels: 2,
      triggers: [
        {
          trigger: { kind: 'onStatusApplied', status: 'knockdown', target: 'enemy' },
          effects: [
            {
              id: 'lifeng-t2',
              kind: 'damageHit',
              element: 'physical',
              multiplier: [50, 100],
            },
          ],
        },
      ],
    },
  ],
  potentials: [
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'lifeng-battle-physical-susceptibility',
          effect: {
            scaling: {
              additive: [5],
            },
            condition: {
              kind: 'enemyStatus',
              status: 'vulnerability',
              stacks: { compare: 'atMost', count: 2 },
            },
          },
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: {
            modifier: 'attributeFlat',
            attribute: ['strength', 'agility', 'intellect', 'will'],
          },
          target: 'self',
          value: 15,
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'lifeng-t1',
          effect: {
            scaling: {
              additive: [{ basis: ['intellect', 'will'], coefficient: 0.05 }],
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
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'lifeng-t2',
          effect: {
            condition: {
              kind: 'operatorStatus',
              status: 'lifeng-p5-cooldown-tracker',
            },
          },
        },
      ],
      triggers: [
        {
          trigger: { kind: 'onStatusApplied', status: 'knockdown', target: 'enemy' },
          effects: [
            {
              kind: 'derived',
              sourceEffect: 'lifeng-t2',
              effect: {
                multiplierScaling: {
                  additive: [250],
                },
                hit: {
                  stagger: 5,
                },
                condition: {
                  kind: 'not',
                  condition: {
                    kind: 'operatorStatus',
                    status: 'lifeng-p5-cooldown-tracker',
                  },
                },
              },
            },
            {
              id: 'lifeng-p5-cooldown-tracker',
              kind: 'status',
              target: 'self',
              duration: 15,
              condition: {
                kind: 'not',
                condition: { kind: 'operatorStatus', status: 'lifeng-p5-cooldown-tracker' },
              },
              ignoreTimeShift: true,
              hide: true,
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
          duration: 0.83,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [24, 27, 29, 32, 34, 36, 39, 41, 44, 47, 50, 55],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.3,
                },
                {
                  offset: 0.57,
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
              multiplier: [29, 32, 35, 38, 41, 44, 47, 49, 52, 56, 60, 65],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.13,
                },
              ],
            },
          ],
        },
        {
          duration: 0.5,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [35, 39, 42, 46, 49, 53, 56, 60, 63, 67, 73, 79],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.37,
                },
              ],
            },
          ],
        },
        {
          duration: 1.2,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [68, 74, 81, 88, 95, 101, 108, 115, 122, 130, 140, 152],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.43,
                },
                {
                  offset: 0.8,
                  spRecovery: 21,
                  stagger: 19,
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
          duration: 2.23,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [38, 42, 46, 50, 53, 57, 61, 65, 69, 73, 79, 86],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.23,
                },
              ],
            },
            {
              element: 'physical',
              multiplier: [38, 42, 46, 50, 53, 57, 61, 65, 69, 73, 79, 86],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.67,
                },
              ],
            },
            {
              element: 'physical',
              multiplier: [119, 131, 143, 155, 167, 178, 190, 202, 214, 229, 247, 268],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.8,
                  stagger: 10,
                  effects: [
                    {
                      id: 'lifeng-battle-physical-susceptibility',
                      kind: 'status',
                      stat: { modifier: 'susceptibility', elements: 'physical' },
                      value: [5, 5, 5, 5, 5, 7, 7, 7, 9, 10, 10, 12],
                      duration: 12,
                      condition: {
                        kind: 'not',
                        condition: { kind: 'enemyStatus', status: 'vulnerability' },
                      },
                      icon: '/operators/lifeng/icon_skill_lifeng_debuff.webp',
                    },
                    { kind: 'physicalStatus', physicalType: 'knockdown' },
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
          duration: 1.67,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [47, 51, 56, 61, 65, 70, 75, 79, 84, 90, 97, 105],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.63,
                  effects: [
                    {
                      kind: 'status',
                      target: 'team',
                      stat: { modifier: 'link' },
                      duration: 20,
                    },
                  ],
                },
              ],
            },
            {
              element: 'physical',
              multiplier: [167, 183, 200, 217, 233, 250, 267, 283, 300, 321, 346, 375],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.6,
                  stagger: 10,
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
          duration: 2.2,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400],
              multiplierMode: 'each',
              hits: [
                {
                  offset: 2.13,
                  stagger: 5,
                  effects: [
                    {
                      kind: 'physicalStatus',
                      physicalType: 'knockdown',
                    },
                  ],
                },
                {
                  offset: 4.13,
                  stagger: 5,
                  effects: [
                    {
                      kind: 'physicalStatus',
                      physicalType: 'knockdown',
                    },
                  ],
                },
              ],
            },
            {
              element: 'physical',
              multiplier: [267, 294, 320, 347, 374, 400, 427, 454, 480, 514, 554, 600],
              multiplierMode: 'each',
              hits: [
                {
                  offset: 4.43,
                  stagger: 5,
                },
              ],
              condition: { kind: 'actionLinkConsumed' },
            },
          ],
        },
      ],
      ultimateEnergyCost: 90,
      animationTime: 1.867,
      cooldown: 15,
    },
  },
};

export default sheet;
