import type { OperatorSheet, HitGroup, Effect } from '../types';

const BATTLE_FIRST_HIT_EFFECTS: Effect[] = [
  {
    id: 'zhuangfangyi-sunderblades',
    name: 'sunderblades',
    kind: 'status',
    target: 'self',
    duration: 36,
    stackStrategy: 'INDEPENDENT',
    stacks: 1,
    maxStacks: 9,
    icon: '/operators/zhuang-fangyi/battle.webp',
    condition: [
      {
        kind: 'not',
        condition: {
          kind: 'enemyStatus',
          status: 'electrification',
        },
      },
      {
        kind: 'not',
        condition: {
          kind: 'operatorStatus',
          status: 'zhuangfangyi-free-battle',
        },
      },
      {
        kind: 'operatorStatus',
        status: 'zhuangfangyi-sunderblades',
        stacks: { compare: 'atMost', count: 2 },
      },
    ],
  },
  {
    id: 'zhuangfangyi-sunderblades',
    name: 'sunderblades',
    kind: 'status',
    target: 'self',
    duration: 36,
    stackStrategy: 'INDEPENDENT',
    stacks: 2,
    maxStacks: 9,
    icon: '/operators/zhuang-fangyi/battle.webp',
    condition: [
      {
        kind: 'enemyStatus',
        status: 'electrification',
        stacks: { compare: 'exact', count: 1 },
      },
      {
        kind: 'not',
        condition: {
          kind: 'operatorStatus',
          status: 'zhuangfangyi-free-battle',
        },
      },
    ],
  },
  {
    id: 'zhuangfangyi-sunderblades',
    name: 'sunderblades',
    kind: 'status',
    target: 'self',
    duration: 36,
    stackStrategy: 'INDEPENDENT',
    stacks: 3,
    maxStacks: 9,
    icon: '/operators/zhuang-fangyi/battle.webp',
    condition: [
      {
        kind: 'enemyStatus',
        status: 'electrification',
        stacks: { compare: 'atLeast', count: 2 },
      },
      {
        kind: 'not',
        condition: {
          kind: 'operatorStatus',
          status: 'zhuangfangyi-free-battle',
        },
      },
    ],
  },
  {
    id: 'zhuangfangyi-battle-bonus-multiplier-tracker',
    kind: 'status',
    target: 'self',
    duration: 10,
    maxStacks: 4,
    stacks: 'fromConsume',
    condition: [
      {
        kind: 'enemyStatus',
        status: 'electrification',
        consume: true,
      },
      {
        kind: 'not',
        condition: {
          kind: 'operatorStatus',
          status: 'zhuangfangyi-free-battle',
        },
      },
    ],
    hide: true,
  },
  {
    id: 'zhuangfangyi-sunderblades',
    name: 'sunderblades',
    kind: 'status',
    target: 'self',
    duration: 36,
    stackStrategy: 'INDEPENDENT',
    stacks: 3,
    maxStacks: 9,
    icon: '/operators/zhuang-fangyi/battle.webp',
    condition: {
      kind: 'operatorStatus',
      status: 'zhuangfangyi-free-battle',
      consume: true,
    },
  },
];

const BATTLE_HIT_GROUPS: HitGroup[] = [...Array(9).keys()].flatMap(i => {
  return [
    {
      element: 'electric',
      multiplier: [20, 22, 24, 26, 28, 30, 32, 34, 36, 39, 42, 45],
      multiplierMode: 'each',
      multiplierScaling: {
        additive: [
          {
            key: 'zhuangfangyi-battle-bonus-multiplier-tracker',
            target: 'self',
            coefficient: [3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 8, 9],
          },
        ],
      },
      hits: [
        ...[...Array(i).keys()].map(j => ({
          id: 'zhuang-fangyi-thunder-strike',
          offset: 1 + 0.233 * j,
          durationExtension: j === 0 ? 1 + 0.233 * i + 0.367 : undefined,
          effects: [
            {
              kind: 'ultEnergyGain' as const,
              target: 'self' as const,
              value: 6,
            },
            {
              id: 'zhuang-fangyi-thunder-strike-hit-tracker',
              kind: 'status' as const,
              target: 'self' as const,
              maxStacks: 9,
              duration: 5,
              hide: true,
            },
          ],
        })),
      ],
      condition: {
        kind: 'operatorStatus',
        status: 'zhuangfangyi-sunderblades',
        stacks: { compare: 'exact', count: i + 1 },
      },
    },
    {
      element: 'electric',
      multiplier: [20, 22, 24, 26, 28, 30, 32, 34, 36, 39, 42, 45].map(i => 6 * i),
      multiplierMode: 'split',
      multiplierScaling: {
        additive: [
          {
            key: 'zhuangfangyi-battle-bonus-multiplier-tracker',
            target: 'self',
            coefficient: [3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 8, 9].map(i => 6 * i),
          },
        ],
      },
      hits: [
        {
          id: 'zhuang-fangyi-thunder-strike',
          offset: 1 + 0.233 * i + 0.367,
          durationExtension: i === 0 ? 1 + 0.233 * i + 0.367 : undefined,
          stagger: 15,
          effects: [
            {
              kind: 'ultEnergyGain' as const,
              target: 'self' as const,
              value: 6,
            },
            {
              kind: 'consume' as const,
              operatorStatus: 'zhuangfangyi-battle-bonus-multiplier-tracker',
            },
            {
              kind: 'consume',
              operatorStatus: 'zhuang-fangyi-thunder-strike-hit-tracker',
            },
          ],
        },
      ],
      condition: {
        kind: 'operatorStatus',
        status: 'zhuangfangyi-sunderblades',
        stacks: { compare: 'exact', count: i + 1 },
      },
    },
  ];
});

const ENHANCED_BATTLE_HIT_GROUPS: HitGroup[] = [...Array(9).keys()].flatMap(i => {
  return [
    {
      element: 'electric',
      multiplier: [36, 40, 43, 47, 50, 54, 58, 61, 65, 69, 75, 81],
      multiplierMode: 'each',
      multiplierScaling: {
        additive: [
          {
            key: 'zhuangfangyi-battle-bonus-multiplier-tracker',
            target: 'self',
            coefficient: [8, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18],
          },
        ],
      },
      hits: [
        ...[...Array(i).keys()].map(j => ({
          id: 'zhuang-fangyi-thunder-strike',
          offset: 1 + 0.233 * j,
          effects: [
            {
              kind: 'ultEnergyGain' as const,
              target: 'self' as const,
              value: 6,
            },
            {
              id: 'zhuang-fangyi-thunder-strike-hit-tracker',
              kind: 'status' as const,
              target: 'self' as const,
              maxStacks: 9,
              duration: 5,
              hide: true,
            },
          ],
        })),
      ],
      condition: {
        kind: 'operatorStatus',
        status: 'zhuangfangyi-sunderblades',
        stacks: { compare: 'exact', count: i + 1 },
      },
    },
    {
      element: 'electric',
      multiplier: [36, 40, 43, 47, 50, 54, 58, 61, 65, 69, 75, 81].map(i => 6 * i),
      multiplierMode: 'split',
      multiplierScaling: {
        additive: [
          {
            key: 'zhuangfangyi-battle-bonus-multiplier-tracker',
            target: 'self',
            coefficient: [8, 9, 10, 11, 11, 12, 13, 14, 15, 16, 17, 18].map(i => 6 * i),
          },
        ],
      },
      hits: [
        {
          id: 'zhuang-fangyi-thunder-strike',
          offset: 1 + 0.233 * i + 0.367,
          stagger: 15,
          effects: [
            {
              kind: 'infliction' as const,
              element: 'electric' as const,
            },
            {
              kind: 'ultEnergyGain' as const,
              target: 'self' as const,
              value: 6,
            },
            {
              kind: 'consume' as const,
              operatorStatus: 'zhuangfangyi-battle-bonus-multiplier-tracker',
            },
            {
              kind: 'consume',
              operatorStatus: 'zhuang-fangyi-thunder-strike-hit-tracker',
            },
          ],
        },
      ],
      condition: {
        kind: 'operatorStatus',
        status: 'zhuangfangyi-sunderblades',
        stacks: { compare: 'exact', count: i + 1 },
      },
    },
  ];
});

const sheet: OperatorSheet = {
  new: true,
  gameId: 'ZHUANGFANGYI',
  rarity: 6,
  weapon: 'arts-unit',
  element: 'electric',
  finisherElement: 'electric',
  diveElement: 'electric',
  class: 'striker',
  mainAttribute: 'will',
  subAttribute: 'intellect',
  attributes: {
    Strength: [10, 29, 49, 69, 89, 99],
    Agility: [10, 29, 49, 69, 89, 99],
    Intellect: [17, 39, 63, 87, 111, 123],
    Will: [24, 58, 94, 130, 166, 184],
    'Base ATK': [30, 93, 160, 227, 293, 326],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      triggers: [
        {
          trigger: { kind: 'onActionStart', skillTypes: 'battleSkill' },
          effects: [
            {
              id: 'zhuang-fangyi-t1',
              kind: 'status',
              stat: { modifier: 'ampBonus', elements: 'electric' },
              target: 'self',
              value: [9, 18],
              duration: 5,
            },
            {
              id: 'zhuang-fangyi-t1-expire-tracker',
              kind: 'status',
              target: 'self',
              duration: 5,
              hide: true,
            },
          ],
        },
        {
          trigger: { kind: 'onHit', skillId: 'zhuang-fangyi-thunder-strike' },
          effects: [
            {
              id: 'zhuang-fangyi-t1',
              kind: 'status',
              stat: { modifier: 'ampBonus', elements: 'electric' },
              target: 'self',
              value: [10, 19],
              scaling: {
                additive: [
                  {
                    key: 'zhuang-fangyi-thunder-strike-hit-tracker',
                    target: 'self',
                    coefficient: [1, 2],
                  },
                ],
              },
              duration: 5,
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusExpire',
            status: 'zhuang-fangyi-t1-expire-tracker',
            target: 'self',
          },
          effects: [
            {
              kind: 'consume',
              operatorStatus: 'zhuang-fangyi-t1',
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
          stat: { modifier: 'directMultiplier', skillTypes: 'battleSkill' },
          target: 'self',
          value: 1.15,
        },
      ],
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'zhuang-fangyi-battle-sunderblades-generation-hit',
          hit: {
            effects: [
              {
                id: 'zhuangfangyi-sunderblades',
                name: 'sunderblades',
                kind: 'status',
                target: 'self',
                duration: 36,
                stackStrategy: 'INDEPENDENT',
                stacks: 1,
                maxStacks: 9,
                icon: '/operators/zhuang-fangyi/battle.webp',
                condition: {
                  kind: 'not',
                  condition: {
                    kind: 'operatorStatus',
                    status: 'zhuangfangyi-p1-cooldown',
                  },
                },
              },
              {
                id: 'zhuangfangyi-p1-cooldown',
                kind: 'status',
                target: 'self',
                duration: 999,
                hide: true,
              },
            ],
          },
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: 'will' },
          target: 'self',
          value: 20,
        },
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus', skillTypes: 'battleSkill' },
          target: 'self',
          value: 15,
        },
      ],
    },
    {
      triggers: [
        {
          trigger: {
            kind: 'onStatusConsumed',
            status: 'electrification',
            target: 'enemy',
            skillTypes: 'battleSkill',
          },
          effects: [
            {
              kind: 'spReturn',
              value: 10,
            },
          ],
        },
      ],
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'zhuangfangyi-sunderblades',
          effect: {
            durationExtension: 10,
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
          kind: 'appendEffect',
          targetEffect: 'zhuangfangyi-free-battle',
          effect: {
            kind: 'status',
            stat: { modifier: 'resistanceIgnore', elements: 'electric' },
            target: 'self',
            value: 15,
            duration: 25,
          },
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
              element: 'electric',
              multiplier: [16, 18, 19, 21, 22, 24, 26, 27, 29, 31, 33, 36],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.2,
                },
                {
                  offset: 0.26,
                },
              ],
            },
          ],
        },
        {
          duration: 0.5,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [24, 26, 29, 31, 34, 36, 38, 41, 43, 46, 50, 54],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.27,
                },
              ],
            },
          ],
        },
        {
          duration: 0.867,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [32, 35, 39, 42, 45, 48, 52, 55, 58, 62, 67, 72],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.46,
                },
                {
                  offset: 0.53,
                },
              ],
            },
          ],
        },
        {
          duration: 0.567,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [45, 50, 54, 59, 63, 68, 72, 77, 81, 87, 93, 101],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.36,
                },
              ],
            },
          ],
        },
        {
          duration: 1.67,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [48, 53, 58, 62, 67, 72, 77, 82, 86, 92, 100, 108],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.67,
                  stagger: 18,
                  spRecovery: 18,
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
          duration: 0.7,
          damageGroups: [
            {
              hits: [
                {
                  id: 'zhuang-fangyi-battle-sunderblades-generation-hit',
                  offset: 0.2,
                  effects: BATTLE_FIRST_HIT_EFFECTS,
                },
              ],
            },
            ...BATTLE_HIT_GROUPS,
          ],
        },
      ],
      subSkills: [
        {
          group: 'battleSkill',
          name: 'enhancedBattleSkill',
          segments: [
            {
              duration: 0.7,
              damageGroups: [
                {
                  hits: [
                    {
                      id: 'zhuang-fangyi-battle-sunderblades-generation-hit',
                      offset: 0.2,
                      effects: BATTLE_FIRST_HIT_EFFECTS,
                    },
                  ],
                },
                ...ENHANCED_BATTLE_HIT_GROUPS,
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
          duration: 1.4,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [160, 176, 192, 208, 224, 240, 256, 272, 288, 308, 332, 360],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.2,
                  stagger: 10,
                  effects: [
                    {
                      kind: 'reaction',
                      reactionType: 'electrification',
                      requiresInfliction: ['electric'],
                      defaultLevel: 2,
                      condition: {
                        kind: 'enemyStatus',
                        status: 'electrification',
                      },
                    },
                    {
                      kind: 'reaction',
                      reactionType: 'electrification',
                      requiresInfliction: ['electric'],
                      condition: {
                        kind: 'not',
                        condition: {
                          kind: 'enemyStatus',
                          status: 'electrification',
                        },
                      },
                    },
                    {
                      kind: 'ultEnergyGain',
                      value: 0,
                      scaling: {
                        additive: [
                          {
                            key: 'electricInfliction',
                            target: 'enemy',
                            coefficient: 10,
                          },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 17],
      subSkills: [
        {
          group: 'comboSkill',
          name: 'enhancedComboSkill',
          segments: [
            {
              duration: 1.2,
              damageGroups: [
                {
                  multiplier: [240, 264, 288, 312, 336, 360, 384, 408, 432, 462, 498, 540],
                  multiplierMode: 'split',
                  hits: [
                    {
                      offset: 0.8,
                      stagger: 10,
                      effects: [
                        {
                          kind: 'reaction',
                          reactionType: 'electrification',
                          requiresInfliction: ['electric'],
                          defaultLevel: 2,
                          condition: {
                            kind: 'enemyStatus',
                            status: 'electrification',
                          },
                        },
                        {
                          kind: 'reaction',
                          reactionType: 'electrification',
                          requiresInfliction: ['electric'],
                          condition: {
                            kind: 'not',
                            condition: {
                              kind: 'enemyStatus',
                              status: 'electrification',
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          cooldown: [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 17].map(i => i / 4),
        },
      ],
    },
    ultimate: {
      element: 'electric',
      segments: [
        {
          duration: 2.8,
          damageGroups: [
            {
              hits: [
                {
                  offset: 2.65,
                  effects: [
                    {
                      id: 'zhuangfangyi-free-battle',
                      kind: 'status',
                      stat: { modifier: 'battleSkillSPCostReduction' },
                      target: 'self',
                      value: 100,
                      duration: 25,
                      hide: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 240,
      animationTime: 2.65,
      cooldown: 10,
      enhancementTime: 25,
      subSkills: [
        {
          group: 'basicAttack',
          name: 'enhancedBasicAttack',
          segments: [
            {
              duration: 0.73,
              damageGroups: [
                {
                  element: 'electric',
                  multiplier: [67, 73, 80, 86, 93, 100, 106, 113, 120, 128, 138, 150],
                  multiplierMode: 'split',
                  hits: [
                    {
                      offset: 0.26,
                    },
                  ],
                },
              ],
            },
            {
              duration: 0.9,
              damageGroups: [
                {
                  element: 'electric',
                  multiplier: [94, 103, 112, 122, 131, 140, 150, 159, 168, 180, 194, 210],
                  multiplierMode: 'split',
                  hits: [
                    {
                      offset: 0.3,
                    },
                  ],
                },
              ],
            },
            {
              duration: 2,
              damageGroups: [
                {
                  element: 'electric',
                  multiplier: [134, 147, 160, 174, 187, 200, 214, 227, 240, 257, 277, 300],
                  multiplierMode: 'split',
                  hits: [
                    {
                      offset: 1.1,
                      stagger: 18,
                      spRecovery: 20,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
};

export default sheet;
