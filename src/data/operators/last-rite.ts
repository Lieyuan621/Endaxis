import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'LASTRITE',
  rarity: 6,
  weapon: 'greatsword',
  element: 'cryo',
  finisherElement: 'cryo',
  diveElement: 'cryo',
  class: 'striker',
  mainAttribute: 'strength',
  subAttribute: 'will',
  acceptTeamUltEnergy: false,
  acceptSelfSpCostUltEnergy: false,
  attributes: {
    Strength: [21, 50, 80, 110, 140, 155],
    Agility: [8, 29, 50, 72, 93, 104],
    Intellect: [9, 27, 46, 65, 84, 93],
    Will: [15, 35, 56, 77, 98, 109],
    'Base ATK': [30, 95, 162, 230, 298, 332],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      triggers: [
        {
          trigger: {
            kind: 'onStatusConsumed',
            status: ['heatInfliction', 'cryoInfliction', 'electricInfliction', 'natureInfliction'],
            target: 'enemy',
          },
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'susceptibility', elements: 'cryo' },
              scaling: {
                additive: [
                  {
                    key: 'heatInfliction',
                    target: 'enemy',
                    coefficient: [2, 4],
                  },
                  {
                    key: 'cryoInfliction',
                    target: 'enemy',
                    coefficient: [2, 4],
                  },
                  {
                    key: 'electricInfliction',
                    target: 'enemy',
                    coefficient: [2, 4],
                  },
                  {
                    key: 'natureInfliction',
                    target: 'enemy',
                    coefficient: [2, 4],
                  },
                ],
              },
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
          stat: { modifier: 'susceptibilityAmplify', elements: 'cryo', skillTypes: 'ultimate' },
          target: 'self',
          value: [20, 50],
        },
      ],
    },
  ],
  potentials: [
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus', skillTypes: 'finalStrike' },
          target: 'team',
          value: 20,
          hide: true,
          condition: {
            kind: 'operatorStatus',
            status: 'lastrite-hypothermic-perfusion',
          },
        },
        {
          kind: 'status',
          stat: { modifier: 'staggerFlat', skillTypes: 'finalStrike' },
          target: 'team',
          value: 5,
          hide: true,
          condition: {
            kind: 'operatorStatus',
            status: 'lastrite-hypothermic-perfusion',
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
          stat: { modifier: 'dmgBonus', elements: 'cryo' },
          target: 'self',
          value: 10,
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'directMultiplier', skillTypes: ['comboSkill', 'ultimate'] },
          target: 'self',
          value: 1.15,
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
          stat: { modifier: 'directMultiplier', skillTypes: 'battleSkill' },
          target: 'self',
          value: 1.2,
        },
      ],
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'lastrite-battle-cast',
          hit: {
            spReturn: 35,
          },
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.7,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.4,
                },
              ],
            },
          ],
        },
        {
          duration: 1,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [55, 61, 66, 72, 77, 83, 88, 94, 99, 106, 114, 124],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.33,
                },
                {
                  offset: 0.8,
                },
              ],
            },
          ],
        },
        {
          duration: 1.23,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [68, 75, 82, 88, 95, 102, 109, 116, 122, 131, 141, 153],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.3,
                },
                {
                  offset: 0.9,
                },
              ],
            },
          ],
        },
        {
          duration: 1.567,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [90, 99, 108, 117, 126, 135, 144, 153, 162, 173, 187, 203],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.7,
                  spRecovery: 30,
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
          duration: 0.5,
          damageGroups: [
            {
              element: 'cryo',
              hits: [
                {
                  id: 'lastrite-battle-cast',
                  offset: 0.2,
                  spReturn: 30,
                  effects: [
                    {
                      id: 'lastrite-hypothermic-perfusion',
                      name: 'hypothermicPerfusion',
                      kind: 'status',
                      target: 'team',
                      duration: 15,
                      icon: '/operators/last-rite/icon_battle_lastrite_buff.webp',
                    },
                    {
                      kind: 'ultEnergyGain',
                      value: 16,
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
              id: 'lastrite-mirages-hit',
              kind: 'damageHit',
              element: 'cryo',
              multiplier: [142, 156, 171, 185, 199, 213, 228, 242, 256, 274, 295, 320],
              readConsumedStacks: { statusKey: 'lastrite-hypothermic-perfusion', target: 'self' },
              offset: 0.267,
              hit: {
                effects: [
                  {
                    kind: 'infliction',
                    element: 'cryo',
                  },
                ],
              },
              condition: {
                kind: 'operatorStatus',
                status: 'lastrite-hypothermic-perfusion',
                consume: true,
                consumeScope: 'team',
              },
            },
          ],
        },
      ],
    },
    comboSkill: {
      ultimateEnergyGain: 0,
      segments: [
        {
          duration: 2.17,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [71, 78, 85, 92, 99, 107, 114, 121, 128, 137, 147, 160],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.43,
                },
              ],
            },
            {
              element: 'cryo',
              multiplier: [71, 78, 85, 92, 99, 107, 114, 121, 128, 137, 147, 160],
              multiplierScaling: {
                additive: [
                  {
                    key: 'cryoInfliction',
                    target: 'enemy',
                    coefficient: [107, 117, 128, 139, 149, 160, 171, 181, 192, 205, 221, 240],
                  },
                ],
              },
              multiplierMode: 'split',
              hits: [
                {
                  offset: 2.1,
                  stagger: 15,
                  effects: [
                    {
                      kind: 'ultEnergyGain',
                      value: 40,
                      scaling: {
                        additive: [
                          {
                            key: 'cryoInfliction',
                            target: 'enemy',
                            coefficient: 15,
                          },
                        ],
                      },
                    },
                    {
                      kind: 'consume',
                      enemyStatus: 'cryoInfliction',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 8],
    },
    ultimate: {
      segments: [
        {
          duration: 4.67,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 2.87,
                  stagger: 5,
                },
              ],
            },
            {
              element: 'cryo',
              multiplier: [178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 3.5,
                  stagger: 5,
                },
              ],
            },
            {
              element: 'cryo',
              multiplier: [356, 391, 427, 462, 498, 533, 569, 604, 640, 684, 738, 800],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 4.47,
                  stagger: 10,
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 240,
      animationTime: 2.867,
      cooldown: 20,
    },
  },
};

export default sheet;
