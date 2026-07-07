import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'XAIHI',
  rarity: 5,
  weapon: 'arts-unit',
  element: 'cryo',
  finisherElement: 'cryo',
  diveElement: 'cryo',
  class: 'supporter',
  mainAttribute: 'will',
  subAttribute: 'intellect',
  attributes: {
    Strength: [9, 26, 44, 62, 80, 89],
    Agility: [9, 26, 45, 64, 82, 91],
    Intellect: [15, 39, 64, 89, 114, 127],
    Will: [15, 43, 74, 104, 134, 150],
    'Base ATK': [30, 86, 144, 203, 262, 291],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'xaihi-combo-hit',
          hit: {
            effects: [
              {
                kind: 'status',
                stat: { modifier: 'increasedDmgTaken', elements: 'cryo' },
                value: [7, 10],
                condition: {
                  kind: 'enemyStatus',
                  status: ['cryoInfliction', 'solidification'],
                },
                duration: 5,
              },
            ],
          },
        },
      ],
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
          targetEffect: 'xaihi-auxiliary-crystal-amp',
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
          value: 10,
        },
      ],
    },
    {},
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: 'intellect' },
          target: 'self',
          value: 15,
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'xaihi-ultimate-cryo-amp',
          effect: { scaling: { multiplier: [1.1] } },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'xaihi-ultimate-nature-amp',
          effect: { scaling: { multiplier: [1.1] } },
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.467,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 31, 34],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.33,
                },
              ],
            },
          ],
        },
        {
          duration: 0.6,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [16, 18, 19, 21, 22, 24, 26, 27, 29, 31, 33, 36],
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
          duration: 0.5,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [21, 23, 25, 27, 29, 32, 34, 36, 38, 40, 44, 47],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.267,
                },
              ],
            },
          ],
        },
        {
          duration: 0.73,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [33, 36, 40, 43, 46, 50, 53, 56, 59, 64, 68, 74],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.23,
                },
                {
                  offset: 0.4,
                },
              ],
            },
          ],
        },
        {
          duration: 1.13,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [55, 61, 66, 72, 77, 83, 88, 94, 99, 106, 114, 124],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.63,
                  spRecovery: 15,
                  stagger: 15,
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
              hits: [
                {
                  offset: 0.23,
                  effects: [
                    {
                      kind: 'status',
                      id: 'xaihi-auxiliary-crystal',
                      target: 'team',
                      name: 'auxiliaryCrystal',
                      stacks: 2,
                      maxStacks: 2,
                      duration: 20,
                      icon: '/operators/xaihi/battle.webp',
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
            kind: 'onFinalStrike',
            triggerScope: 'global',
          },
          effects: [
            {
              id: 'xaihi-auxiliary-crystal-amp',
              kind: 'status',
              stat: {
                modifier: 'ampBonus',
                elements: ['heat', 'cryo', 'electric', 'nature'],
              },
              target: 'self',
              value: [9, 9, 9, 9, 9, 11, 11, 11, 13, 13, 13, 15],
              duration: 25,
              condition: {
                kind: 'operatorStatus',
                status: 'xaihi-auxiliary-crystal',
                consume: 1,
                consumeScope: 'team',
              },
            },
            {
              kind: 'status',
              stat: {
                modifier: 'heal',
              },
              target: 'owner',
              hide: true,
              condition: {
                kind: 'operatorStatus',
                status: 'xaihi-auxiliary-crystal',
              },
            },
          ],
        },
      ],
    },
    comboSkill: {
      ultimateEnergyGain: 10,
      segments: [
        {
          duration: 0.83,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [200, 220, 240, 260, 280, 300, 320, 340, 360, 385, 415, 450],
              multiplierMode: 'split',
              hits: [
                {
                  id: 'xaihi-combo-hit',
                  offset: 0.8,
                  stagger: 10,
                  effects: [{ kind: 'infliction', element: 'cryo' }],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 7],
    },
    ultimate: {
      segments: [
        {
          duration: 2.23,
          damageGroups: [
            {
              hits: [
                {
                  offset: 1.93,
                  effects: [
                    {
                      id: 'xaihi-ultimate-cryo-amp',
                      kind: 'status',
                      stat: { modifier: 'ampBonus', elements: 'cryo' },
                      target: 'team',
                      value: [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24],
                      scaling: {
                        additive: [
                          {
                            basis: 'intellect',
                            coefficient: [
                              0.014, 0.015, 0.016, 0.018, 0.019, 0.02, 0.022, 0.023, 0.024, 0.026,
                              0.028, 0.03,
                            ],
                          },
                        ],
                        cap: [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 36],
                      },
                      duration: 12,
                    },
                    {
                      id: 'xaihi-ultimate-nature-amp',
                      kind: 'status',
                      stat: { modifier: 'ampBonus', elements: 'nature' },
                      target: 'team',
                      value: [11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24],
                      scaling: {
                        additive: [
                          {
                            basis: 'intellect',
                            coefficient: [
                              0.014, 0.015, 0.016, 0.018, 0.019, 0.02, 0.022, 0.023, 0.024, 0.026,
                              0.028, 0.03,
                            ],
                          },
                        ],
                        cap: [30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 36],
                      },
                      duration: 12,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 80,
      animationTime: 1.467,
      cooldown: 20,
    },
  },
};

export default sheet;
