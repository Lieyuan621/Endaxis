import { map, range } from 'lodash';
import type { OperatorSheet, ArtsElement, TriggerEffect, Effect } from '../types';

const INFLICTIONS: ArtsElement[] = ['cryo', 'electric', 'nature', 'heat'];
const INFLICTION_STATUSES = INFLICTIONS.map(x => `${x}Infliction`);
const NON_NATURE_INFLICTION_STATUSES = INFLICTIONS.filter(x => x !== 'nature').map(
  x => `${x}Infliction`,
);
const TRACKER_IDS = Object.fromEntries(INFLICTIONS.map(x => [x, `arcane-combo-tracker-${x}`]));

const INFLICTION_TRACKER: TriggerEffect[] = INFLICTIONS.map(x => ({
  trigger: {
    kind: 'onStatusApplied' as const,
    status: `${x}Infliction`,
    target: 'enemy' as const,
    triggerScope: 'global' as const,
  },
  effects: [
    {
      id: TRACKER_IDS[x]!,
      kind: 'status' as const,
      target: 'owner' as const,
      duration: 6,
      hide: true,
    },
    ...INFLICTIONS.filter(y => x !== y).map(y => ({
      kind: 'consume' as const,
      operatorStatus: TRACKER_IDS[y]!,
    })),
  ],
}));

const COMBO_SKILL_EFFECTS: Effect[] = INFLICTIONS.map(x => ({
  kind: 'infliction' as const,
  element: x as ArtsElement,
  condition: {
    kind: 'operatorStatus',
    status: TRACKER_IDS[x]!,
    consume: true,
  },
}));

const sheet: OperatorSheet = {
  new: true,
  gameId: 'ARCANE',
  rarity: 6,
  weapon: 'arts-unit',
  element: 'nature',
  finisherElement: 'nature',
  diveElement: 'nature',
  class: 'caster',
  mainAttribute: 'intellect',
  subAttribute: 'will',
  attributes: {
    Strength: [9, 26, 45, 64, 82, 91],
    Agility: [9, 27, 46, 65, 84, 93],
    Intellect: [21, 54, 89, 124, 159, 176],
    Will: [14, 37, 61, 85, 109, 121],
    'Base ATK': [30, 90, 153, 217, 280, 312],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  trustAttributeBonus: {
    value: [8, 10, 10, 15],
    attribute: ['intellect', 'will'],
  },
  talents: [
    {},
    {
      levels: 2,
      effects: [
        {
          id: 'arcane-t2-corrosion-duration',
          kind: 'status',
          stat: { modifier: 'reactionDurationBonus', reactionType: 'corrosion' },
          target: 'self',
          value: [5, 10],
        },
        {
          id: 'arcane-t2-corrosion-effectiveness',
          kind: 'status',
          stat: { modifier: 'reactionEffectivenessBonus', reactionType: 'corrosion' },
          target: 'self',
          value: [0.05, 0.1],
        },
      ],
    },
  ],
  potentials: [
    {},
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: ['intellect', 'will'] },
          target: 'self',
          value: 15,
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
          targetEffect: 'arcane-t2-corrosion-duration',
          effect: { scaling: { additive: [5] } },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'arcane-t2-corrosion-effectiveness',
          effect: { scaling: { additive: [0.2] } },
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
    {},
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.417,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [19, 21, 22, 24, 26, 28, 30, 32, 34, 36, 39, 42],
              multiplierMode: 'split',
              hits: [{ offset: 0.4 }],
            },
          ],
        },
        {
          duration: 0.45,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [21, 23, 26, 28, 30, 32, 34, 36, 38, 41, 44, 48],
              multiplierMode: 'split',
              hits: [{ offset: 0.333 }, { offset: 0.4 }, { offset: 0.417 }],
            },
          ],
        },
        {
          duration: 0.733,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [33, 37, 40, 43, 47, 50, 53, 57, 60, 64, 69, 75],
              multiplierMode: 'split',
              hits: [{ offset: 0.167 }, { offset: 0.433 }, { offset: 0.167 }],
            },
          ],
        },
        {
          duration: 0.7,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [36, 39, 43, 46, 50, 53, 57, 61, 64, 69, 74, 80],
              multiplierMode: 'split',
              hits: [{ offset: 0.1 }, { offset: 0.2 }, { offset: 0.3 }, { offset: 0.4 }],
            },
          ],
        },
        {
          duration: 1.35,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [47, 52, 56, 61, 66, 71, 75, 80, 85, 90, 98, 106],
              multiplierMode: 'split',
              hits: [{ offset: 0.7, spRecovery: 17, stagger: 17 }],
            },
          ],
        },
      ],
    },
    battleSkill: {},
    comboSkill: {},
    ultimate: {},
  },
  forms: {
    selector: { kind: 'attributeCompare', left: 'intellect', right: 'will' },
    forms: [
      {
        key: 'int',
        talents: [
          {
            levels: 2,
            effects: [
              {
                id: 'arcane-t1',
                kind: 'status',
                stat: { modifier: 'ampBonus' },
                target: 'self',
                value: [0, 24],
                condition: {
                  kind: 'operatorStatus',
                  status: 'arcane-gloompurger-array',
                },
              },
            ],
          },
        ],
        potentials: [
          {
            effects: [
              {
                kind: 'status',
                stat: { modifier: 'directMultiplier', skillTypes: 'comboSkill' },
                target: 'self',
                value: 1.3,
              },
            ],
          },
          undefined,
          undefined,
          undefined,
          {
            effects: [
              {
                kind: 'status',
                stat: {
                  modifier: 'directMultiplier',
                  skillId: 'arcane-ultimate-gloompurge-arcana-hit',
                },
                target: 'self',
                value: 1.3,
              },
            ],
            patches: [
              {
                kind: 'patchEffect',
                targetEffect: 'arcane-t1',
                effect: {
                  scaling: {
                    additive: [16],
                  },
                },
              },
            ],
          },
        ],
        combatSkills: {
          battleSkill: {
            segments: [
              {
                duration: 1.167,
                spCost: 100,
                damageGroups: [
                  {
                    element: 'nature',
                    multiplier: [222, 245, 267, 289, 311, 333, 356, 378, 400, 428, 461, 500],
                    multiplierMode: 'split',
                    hits: [
                      {
                        offset: 0.617,
                        stagger: 10,
                        effects: [{ kind: 'infliction', element: 'nature' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          comboSkill: {
            comboWindow: {
              // 阵诀·智：自然附着立即开窗；其他法术附着需要当前层数至少为 2。
              triggers: [
                {
                  trigger: {
                    kind: 'onStatusApplied',
                    status: 'natureInfliction',
                    target: 'enemy',
                    triggerScope: 'global',
                  },
                },
                {
                  trigger: {
                    kind: 'onStatusApplied',
                    status: NON_NATURE_INFLICTION_STATUSES,
                    target: 'enemy',
                    triggerScope: 'global',
                  },
                  condition: {
                    kind: 'enemyStatus',
                    status: NON_NATURE_INFLICTION_STATUSES,
                    stacks: { compare: 'atLeast', count: 2 },
                  },
                },
              ],
              duration: 5,
            },
            segments: [
              {
                duration: 1,
                damageGroups: [
                  {
                    element: 'nature',
                    multiplier: [35, 39, 42, 46, 50, 53, 57, 60, 64, 68, 73, 80],
                    multiplierMode: 'split',
                    hits: [
                      {
                        offset: 0.5,
                        stagger: 5,
                        effects: [
                          {
                            id: 'arcane-imprisonment',
                            name: 'imprisonment',
                            kind: 'status',
                            stat: { modifier: 'slowed' },
                            target: 'enemy',
                            duration: 4,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
            cooldown: [14, 14, 14, 14, 14, 14, 14, 14, 13, 13, 13, 12],
            effects: [
              {
                kind: 'status',
                target: 'enemy',
                stat: { modifier: 'susceptibility', elements: ['nature', 'cryo'] },
                value: 4,
                condition: {
                  kind: 'enemyStatus',
                  status: 'arcane-imprisonment',
                },
              },
            ],
            triggers: [
              {
                trigger: {
                  kind: 'onStatusExpire',
                  status: 'arcane-imprisonment',
                  target: 'enemy',
                },
                effects: [
                  {
                    kind: 'damageHit',
                    element: 'nature',
                    multiplier: [53, 59, 64, 69, 75, 80, 85, 91, 96, 103, 111, 120],
                    hit: {
                      stagger: 5,
                    },
                    readConsumedStacks: {
                      statusKey: 'arcane-imprisonment',
                      target: 'enemy',
                    },
                  },
                ],
              },
              {
                trigger: {
                  kind: 'onStatusConsumed',
                  status: 'arcane-imprisonment',
                  target: 'enemy',
                },
                effects: [
                  {
                    kind: 'damageHit',
                    element: 'nature',
                    multiplier: [53, 59, 64, 69, 75, 80, 85, 91, 96, 103, 111, 120],
                    hit: {
                      stagger: 5,
                    },
                    readConsumedStacks: {
                      statusKey: 'arcane-imprisonment',
                      target: 'enemy',
                    },
                  },
                ],
              },
              {
                trigger: {
                  kind: 'onHit',
                  skillTypes: 'battleSkill',
                },
                effects: [
                  {
                    kind: 'consume',
                    enemyStatus: 'arcane-imprisonment',
                  },
                  {
                    kind: 'spReturn',
                    value: [28, 28, 28, 28, 28, 28, 28, 28, 28, 30, 30, 30],
                    condition: {
                      kind: 'enemyStatus',
                      status: 'arcane-imprisonment',
                    },
                  },
                  {
                    kind: 'status',
                    target: 'enemy',
                    stat: { modifier: 'susceptibility', elements: ['nature', 'cryo'] },
                    value: 4,
                    duration: 2,
                    condition: {
                      kind: 'enemyStatus',
                      status: 'arcane-imprisonment',
                    },
                  },
                  // 4 small laser, 1 large laser
                  ...map(range(5), (i: number) => ({
                    kind: 'damageHit' as const,
                    element: 'nature' as const,
                    multiplier: map(
                      [222, 244, 266, 289, 311, 333, 355, 377, 400, 427, 461, 500],
                      i => (i / 5) * (i === 4 ? 2.6 : 0.6), // large laser deals more damage
                    ),
                    offset: 1.45 + 0.1 * i + (i === 4 ? 0.1 : 0), // large laser has a slightly longer delay
                    readConsumedStacks: {
                      statusKey: 'arcane-imprisonment',
                      target: 'enemy' as const,
                    },
                    condition: {
                      kind: 'enemyStatus' as const,
                      status: 'arcane-imprisonment',
                    },
                  })),
                ],
              },
            ],
          },
          ultimate: {
            segments: [
              {
                duration: 2.417,
                damageGroups: [
                  {
                    hits: [
                      {
                        offset: 0,
                        effects: [
                          {
                            kind: 'cooldownReductionPercent',
                            skillTypes: 'ultimate',
                            target: 'self',
                            value: 100,
                            condition: {
                              kind: 'operatorStatus',
                              status: 'arcane-gloompurge-arcana-ready',
                            },
                          },
                        ],
                      },
                    ],
                  },
                  {
                    element: 'nature',
                    multiplier: [80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180],
                    multiplierMode: 'split',
                    hits: [
                      {
                        offset: 1.583,
                        stagger: 10,
                        effects: [
                          {
                            id: 'arcane-gloompurger-array',
                            name: 'gloompurgerArray',
                            icon: '/operators/arcane/ultimate.webp',
                            kind: 'status',
                            target: 'self',
                            duration: 20,
                          },
                          {
                            id: 'arcane-ultimate-cluster-strike-counter',
                            name: 'clusterStrike',
                            kind: 'status',
                            target: 'self',
                            stacks: 2,
                            maxStacks: 2,
                            duration: 20,
                            hide: true,
                          },
                          {
                            kind: 'reaction',
                            reactionType: 'corrosion',
                            duration: 15,
                          },
                        ],
                      },
                    ],
                    condition: {
                      kind: 'not',
                      condition: {
                        kind: 'operatorStatus',
                        status: 'arcane-gloompurge-arcana-ready',
                      },
                    },
                  },
                  {
                    element: 'nature',
                    multiplier: [640, 704, 768, 832, 896, 960, 1024, 1088, 1152, 1232, 1328, 1440],
                    multiplierMode: 'split',
                    hits: [
                      {
                        id: 'arcane-ultimate-gloompurge-arcana-hit',
                        offset: 1.583,
                        stagger: 10,
                        effects: [
                          { kind: 'consume', operatorStatus: 'arcane-gloompurge-arcana-ready' },
                          { kind: 'consume', operatorStatus: 'arcane-gloompurger-array' },
                        ],
                      },
                    ],
                    condition: { kind: 'operatorStatus', status: 'arcane-gloompurge-arcana-ready' },
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
                  // 4 laser
                  ...map(range(4), (i: number) => ({
                    kind: 'damageHit' as const,
                    element: 'nature' as const,
                    readConsumedStacks: {
                      statusKey: 'arcane-ultimate-cluster-strike-counter',
                      target: 'self' as const,
                    },
                    offset: 0.4 + 0.133 * i,
                    multiplier: map(
                      [160, 176, 192, 208, 224, 240, 256, 272, 288, 308, 332, 360],
                      j => j / 8,
                    ),
                    condition: {
                      kind: 'operatorStatus' as const,
                      status: 'arcane-ultimate-cluster-strike-counter',
                    },
                  })),
                  {
                    kind: 'consume',
                    operatorStatus: 'arcane-ultimate-cluster-strike-counter',
                    consumeStacks: 1,
                    consumeTarget: 'owner',
                  },
                ],
              },
              {
                trigger: {
                  kind: 'onStatusConsumed',
                  status: 'arcane-ultimate-cluster-strike-counter',
                  target: 'self',
                },
                effects: [
                  {
                    id: 'arcane-gloompurge-arcana-ready',
                    name: 'gloompurgeArcana',
                    icon: '/operators/arcane/ultimate.webp',
                    kind: 'status',
                    target: 'self',
                    stat: { modifier: 'ultimateEnergyCostReduction' },
                    value: 100,
                    duration: 20,
                    condition: {
                      kind: 'not',
                      condition: {
                        kind: 'operatorStatus',
                        status: 'arcane-ultimate-cluster-strike-counter',
                      },
                    },
                  },
                ],
              },
              {
                trigger: {
                  kind: 'onStatusExpire',
                  status: 'arcane-gloompurger-array',
                  target: 'self',
                },
                effects: [
                  { kind: 'consume', operatorStatus: 'arcane-gloompurge-arcana-ready' },
                  { kind: 'consume', operatorStatus: 'arcane-ultimate-cluster-strike-counter' },
                ],
              },
            ],
            ultimateEnergyCost: 100,
            animationTime: 1.583,
            enhancementTime: 'arcane-gloompurger-array',
            cooldown: 20,
          },
        },
      },
      {
        key: 'will',
        talents: [
          {
            levels: 2,
            triggers: [
              {
                trigger: {
                  kind: 'onHit',
                  skillId: [
                    'arcane-ultimate-gloompurger-array-hit',
                    'arcane-ultimate-gloompurge-arcana-hit',
                  ],
                },
                effects: [
                  {
                    id: 'arcane-t1',
                    kind: 'status',
                    stat: { modifier: 'susceptibility', elements: ['nature', 'cryo'] },
                    target: 'enemy',
                    value: 0,
                    scaling: {
                      additive: [{ basis: 'will', coefficient: [0, 0.02] }],
                      cap: [0, 12.8],
                    },
                    duration: 10,
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
                stat: { modifier: 'directMultiplier', skillTypes: 'comboSkill' },
                target: 'self',
                value: 1.3,
              },
            ],
          },
          undefined,
          undefined,
          undefined,
          {
            patches: [
              {
                kind: 'patchEffect',
                targetEffect: 'arcane-t1',
                effect: {
                  scaling: {
                    additive: [7],
                  },
                },
              },
            ],
            triggers: [
              {
                trigger: {
                  kind: 'onHit',
                  skillId: 'arcane-ultimate-gloompurge-arcana-hit',
                },
                effects: [
                  {
                    kind: 'cooldownReductionPercent',
                    skillTypes: 'comboSkill',
                    target: 'self',
                    value: 30,
                  },
                ],
              },
            ],
          },
        ],
        combatSkills: {
          battleSkill: {
            segments: [
              {
                duration: 1.167,
                spCost: 100,
                damageGroups: [
                  {
                    element: 'nature',
                    multiplier: [133, 147, 160, 173, 187, 200, 213, 227, 240, 257, 277, 300],
                    multiplierMode: 'split',
                    hits: [
                      {
                        offset: 0.617,
                        stagger: 10,
                        effects: [{ kind: 'infliction', element: 'nature' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          comboSkill: {
            comboWindow: {
              // 阵诀·意：任意法术附着都会开窗，包括触发反应后未留下附着条的应用。
              triggers: [
                {
                  trigger: {
                    kind: 'onStatusApplied',
                    status: INFLICTION_STATUSES,
                    target: 'enemy',
                    triggerScope: 'global',
                  },
                },
              ],
              duration: 5,
            },
            segments: [
              {
                duration: 1,
                damageGroups: [
                  {
                    element: 'nature',
                    multiplier: [35, 39, 42, 46, 50, 53, 57, 60, 64, 68, 73, 80],
                    multiplierMode: 'split',
                    hits: [
                      {
                        offset: 0.5,
                        stagger: 5,
                        effects: [
                          {
                            id: 'arcane-imprisonment',
                            name: 'imprisonment',
                            kind: 'status',
                            stat: { modifier: 'slowed' },
                            target: 'enemy',
                            duration: 6,
                          },
                          ...COMBO_SKILL_EFFECTS,
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
            cooldown: [20, 20, 20, 20, 20, 20, 20, 20, 19, 19, 19, 18],
            effects: [
              {
                kind: 'status',
                target: 'enemy',
                stat: { modifier: 'susceptibility', elements: ['nature', 'cryo'] },
                value: 4,
                scaling: {
                  additive: [
                    {
                      basis: 'will',
                      coefficient: 0.0125,
                    },
                  ],
                  cap: [7, 7, 7, 7, 7, 7, 7, 7, 7.5, 7.5, 7.5, 8],
                },
                condition: {
                  kind: 'enemyStatus',
                  status: 'arcane-imprisonment',
                },
              },
            ],
            triggers: [
              ...INFLICTION_TRACKER,
              {
                trigger: {
                  kind: 'onStatusExpire',
                  status: 'arcane-imprisonment',
                  target: 'enemy',
                },
                effects: [
                  {
                    kind: 'damageHit',
                    element: 'nature',
                    multiplier: [53, 59, 64, 69, 75, 80, 85, 91, 96, 103, 111, 120],
                    hit: {
                      stagger: 5,
                    },
                    readConsumedStacks: {
                      statusKey: 'arcane-imprisonment',
                      target: 'enemy',
                    },
                  },
                ],
              },
            ],
          },
          ultimate: {
            segments: [
              {
                duration: 2.417,
                damageGroups: [
                  {
                    hits: [
                      {
                        offset: 0,
                        effects: [
                          {
                            kind: 'cooldownReductionPercent',
                            skillTypes: 'ultimate',
                            target: 'self',
                            value: 100,
                            condition: {
                              kind: 'operatorStatus',
                              status: 'arcane-gloompurge-arcana-ready',
                            },
                          },
                        ],
                      },
                    ],
                  },
                  {
                    element: 'nature',
                    multiplier: [80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180],
                    multiplierMode: 'split',
                    hits: [
                      {
                        id: 'arcane-ultimate-gloompurger-array-hit',
                        offset: 1.583,
                        stagger: 10,
                        effects: [
                          {
                            id: 'arcane-gloompurger-array',
                            name: 'gloompurgerArray',
                            icon: '/operators/arcane/ultimate.webp',
                            kind: 'status',
                            target: 'self',
                            duration: 20,
                          },
                          {
                            id: 'arcane-ultimate-cluster-strike-counter',
                            name: 'clusterStrike',
                            kind: 'status',
                            target: 'self',
                            stacks: 2,
                            maxStacks: 2,
                            duration: 20,
                            hide: true,
                          },
                          ...map(
                            ['cryo', 'electric', 'nature', 'heat'],
                            (element: ArtsElement) => ({
                              kind: 'infliction' as const,
                              element,
                              condition: {
                                kind: 'enemyStatus' as const,
                                status: `${element}Infliction` as const,
                              },
                            }),
                          ),
                        ],
                      },
                    ],
                    condition: {
                      kind: 'not',
                      condition: {
                        kind: 'operatorStatus',
                        status: 'arcane-gloompurge-arcana-ready',
                      },
                    },
                  },
                  {
                    element: 'nature',
                    multiplier: [160, 176, 192, 208, 224, 240, 256, 272, 288, 308, 332, 360],
                    multiplierMode: 'split',
                    hits: [
                      {
                        id: 'arcane-ultimate-gloompurge-arcana-hit',
                        offset: 1.583,
                        stagger: 10,
                        effects: [
                          { kind: 'consume', operatorStatus: 'arcane-gloompurge-arcana-ready' },
                          { kind: 'consume', operatorStatus: 'arcane-gloompurger-array' },
                        ],
                      },
                    ],
                    condition: { kind: 'operatorStatus', status: 'arcane-gloompurge-arcana-ready' },
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
                  // 4 laser
                  ...map(range(4), (i: number) => ({
                    kind: 'damageHit' as const,
                    element: 'nature' as const,
                    readConsumedStacks: {
                      statusKey: 'arcane-ultimate-cluster-strike-counter',
                      target: 'self' as const,
                    },
                    offset: 0.4 + 0.133 * i,
                    multiplier: map(
                      [160, 176, 192, 208, 224, 240, 256, 272, 288, 308, 332, 360],
                      j => j / 8,
                    ),
                    condition: {
                      kind: 'operatorStatus' as const,
                      status: 'arcane-ultimate-cluster-strike-counter',
                    },
                  })),
                  {
                    kind: 'consume',
                    operatorStatus: 'arcane-ultimate-cluster-strike-counter',
                    consumeStacks: 1,
                    consumeTarget: 'owner',
                  },
                ],
              },
              {
                trigger: {
                  kind: 'onStatusConsumed',
                  status: 'arcane-ultimate-cluster-strike-counter',
                  target: 'self',
                },
                effects: [
                  {
                    id: 'arcane-gloompurge-arcana-ready',
                    name: 'gloompurgeArcana',
                    icon: '/operators/arcane/ultimate.webp',
                    kind: 'status',
                    target: 'self',
                    stat: { modifier: 'ultimateEnergyCostReduction' },
                    value: 100,
                    duration: 20,
                    condition: {
                      kind: 'not',
                      condition: {
                        kind: 'operatorStatus',
                        status: 'arcane-ultimate-cluster-strike-counter',
                      },
                    },
                  },
                ],
              },
              {
                trigger: {
                  kind: 'onStatusExpire',
                  status: 'arcane-gloompurger-array',
                  target: 'self',
                },
                effects: [
                  { kind: 'consume', operatorStatus: 'arcane-gloompurge-arcana-ready' },
                  { kind: 'consume', operatorStatus: 'arcane-ultimate-cluster-strike-counter' },
                ],
              },
            ],
            ultimateEnergyCost: 100,
            animationTime: 1.583,
            enhancementTime: 'arcane-gloompurger-array',
            cooldown: 20,
          },
        },
      },
    ],
  },
};

export default sheet;
