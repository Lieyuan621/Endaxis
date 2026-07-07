import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'TANGTANG',
  rarity: 6,
  weapon: 'handcannon',
  element: 'cryo',
  finisherElement: 'cryo',
  diveElement: 'cryo',
  class: 'caster',
  mainAttribute: 'agility',
  subAttribute: 'strength',
  attributes: {
    Strength: [13, 37, 61, 86, 111, 123],
    Agility: [23, 56, 91, 126, 162, 179],
    Intellect: [8, 25, 42, 59, 77, 85],
    Will: [10, 29, 50, 71, 91, 102],
    'Base ATK': [30, 92, 157, 223, 288, 321],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
    },
    {
      levels: 2,
      triggers: [
        {
          trigger: {
            kind: 'onStatusConsumed',
            status: 'tangtang-oldenStare',
            target: 'enemy',
          },
          skillLevelKey: 'battleSkill',
          damageEffectSkillType: 'battleSkill',
          effects: [
            {
              id: 'tangtang-t2-waterspouts',
              name: 'waterspouts',
              kind: 'damageOverTime',
              element: 'cryo',
              multiplier: [133, 147, 160, 174, 187, 200, 214, 227, 240, 257, 277, 300],
              multiplierMode: 'split',
              multiplierScaling: {
                additive: [
                  {
                    key: 'tangtang-whirlpools',
                    target: 'self',
                    coefficient: [133, 147, 160, 174, 187, 200, 214, 227, 240, 257, 277, 300],
                  },
                ],
              },
              duration: 3,
              interval: 0.3,
              icon: '/operators/tangtang/talent 2.webp',
              consumedStatEffects: [{ stat: { modifier: 'dmgBonus' }, value: [40, 60] }],
            },
            {
              kind: 'infliction',
              element: 'cryo',
            },
            {
              id: 'tangtang-waterspouts-sp-return',
              kind: 'spReturn',
              value: 0,
              scaling: {
                additive: [
                  {
                    key: 'tangtang-whirlpools',
                    target: 'self',
                    coefficient: 20,
                  },
                ],
              },
            },
            {
              id: 'tangtang-waterspouts-susceptibility',
              kind: 'status',
              stat: { modifier: 'susceptibility' },
              target: 'enemy',
              scaling: {
                additive: [
                  {
                    key: 'tangtang-whirlpools',
                    target: 'self',
                    coefficient: [3, 3, 3, 3.5, 3.5, 3.5, 4, 4, 4, 4.5, 4.5, 5],
                  },
                ],
              },
              duration: 15,
              condition: {
                kind: 'operatorStatus',
                status: 'tangtang-whirlpools',
                consume: true,
              },
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
          value: 1.2,
        },
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
          targetEffect: 'tangtang-waterspouts-sp-return',
          effect: {
            scaling: {
              additive: [
                {
                  key: 'tangtang-whirlpools',
                  target: 'self',
                  coefficient: 5,
                },
              ],
            },
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
          stat: { modifier: 'directMultiplier', skillTypes: 'battleSkill' },
          target: 'self',
          value: 1.1,
        },
      ],
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'tangtang-waterspouts-susceptibility',
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
          value: 15,
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'directMultiplier', skillTypes: 'ultimate' },
          target: 'self',
          value: 1.15,
        },
      ],
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'tangtang-t2-waterspouts',
          effect: {
            consumedStatEffects: [{ stat: { modifier: 'dmgBonus' }, value: 80 }],
          },
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.27,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [23, 25, 27, 29, 32, 34, 36, 39, 41, 44, 47, 51],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.1,
                },
              ],
            },
          ],
        },
        {
          duration: 0.63,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.2,
                },
                {
                  offset: 0.33,
                },
              ],
            },
          ],
        },
        {
          duration: 0.9,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [35, 39, 42, 46, 49, 53, 56, 60, 63, 67, 73, 79],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.17,
                },
                {
                  offset: 0.23,
                },
                {
                  offset: 0.29,
                },
                {
                  offset: 0.35,
                },
                {
                  offset: 0.41,
                },
                {
                  offset: 0.57,
                },
                {
                  offset: 0.6,
                },
              ],
            },
          ],
        },
        {
          duration: 0.83,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [37, 40, 44, 47, 51, 55, 58, 62, 66, 70, 76, 82],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.2,
                },
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
          duration: 1.23,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [50, 55, 60, 65, 70, 75, 80, 85, 90, 96, 104, 113],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1,
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
          duration: 1.67,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.917,
                  stagger: 2,
                },
                {
                  offset: 1.033,
                  stagger: 2,
                },
                {
                  offset: 1.167,
                  stagger: 2,
                },
                {
                  offset: 1.3,
                  stagger: 2,
                },
                {
                  offset: 1.433,
                  stagger: 2,
                },
              ],
            },
            {
              element: 'cryo',
              hits: [
                {
                  offset: 0.817,
                  effects: [
                    {
                      name: 'waterspouts',
                      kind: 'damageOverTime',
                      element: 'cryo',
                      multiplier: [133, 147, 160, 174, 187, 200, 214, 227, 240, 257, 277, 300],
                      multiplierMode: 'split',
                      multiplierScaling: {
                        additive: [
                          {
                            key: 'tangtang-whirlpools',
                            target: 'self',
                            coefficient: [
                              133, 147, 160, 174, 187, 200, 214, 227, 240, 257, 277, 300,
                            ],
                          },
                        ],
                      },
                      duration: 3,
                      interval: 0.3,
                      icon: '/operators/tangtang/talent 2.webp',
                    },
                    {
                      kind: 'infliction',
                      element: 'cryo',
                    },
                    {
                      id: 'tangtang-waterspouts-sp-return',
                      kind: 'spReturn',
                      value: 0,
                      scaling: {
                        additive: [
                          {
                            key: 'tangtang-whirlpools',
                            target: 'self',
                            coefficient: 20,
                          },
                        ],
                      },
                    },
                    {
                      id: 'tangtang-waterspouts-susceptibility',
                      kind: 'status',
                      stat: { modifier: 'susceptibility' },
                      target: 'enemy',
                      scaling: {
                        additive: [
                          {
                            key: 'tangtang-whirlpools',
                            target: 'self',
                            coefficient: [3, 3, 3, 3.5, 3.5, 3.5, 4, 4, 4, 4.5, 4.5, 5],
                          },
                        ],
                      },
                      duration: 15,
                      condition: {
                        kind: 'operatorStatus',
                        status: 'tangtang-whirlpools',
                        consume: true,
                      },
                    },
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
          duration: 1.03,
          damageGroups: [
            {
              multiplier: [107, 117, 128, 139, 149, 160, 171, 181, 192, 205, 221, 240],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.87,
                  stagger: 10,
                  effects: [
                    {
                      id: 'tangtang-whirlpools',
                      name: 'whirlpools',
                      kind: 'status',
                      target: 'self',
                      maxStacks: 2,
                      duration: 30,
                      icon: '/operators/tangtang/icon_battle_tangtang_droplet.webp',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [14, 14, 14, 14, 14, 14, 14, 14, 13, 13, 13, 12],
    },
    ultimate: {
      segments: [
        {
          duration: 2.8,
          damageGroups: [
            {
              element: 'cryo',
              hits: [
                {
                  offset: 2.75,
                  effects: [
                    {
                      id: 'tangtang-oldenStare',
                      name: 'oldenStare',
                      kind: 'damageOverTime',
                      element: 'cryo',
                      multiplier: [142, 156, 171, 185, 199, 213, 228, 242, 256, 274, 295, 320],
                      multiplierMode: 'split',
                      duration: 3.99, // prevent last tick
                      interval: 0.5,
                      icon: '/operators/tangtang/icon_battle_tangtang_ultskilldebuff.webp',
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
            kind: 'onStatusExpire',
            status: 'tangtang-oldenStare',
            target: 'enemy',
          },
          effects: [
            {
              kind: 'damageHit',
              element: 'cryo',
              multiplier: [178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400],
              hit: {
                stagger: 15,
              },
              readConsumedStacks: {
                statusKey: 'tangtang-oldenStare',
                target: 'enemy',
              },
            },
          ],
        },
        {
          trigger: {
            kind: 'onDive',
            triggerScope: 'global',
          },
          effects: [
            {
              id: 'tangtang-ultimate-early-end-hit',
              kind: 'damageHit',
              element: 'cryo',
              multiplier: [311, 342, 373, 404, 436, 467, 498, 529, 560, 599, 646, 700],
              hit: {
                stagger: 20,
              },
              condition: {
                kind: 'enemyStatus',
                status: 'tangtang-oldenStare',
                consume: true,
              },
              readConsumedStacks: {
                statusKey: 'tangtang-oldenStare',
                target: 'enemy',
              },
            },
          ],
        },
      ],
      ultimateEnergyCost: 90,
      animationTime: 2.75,
      cooldown: 20,
    },
  },
};

export default sheet;
