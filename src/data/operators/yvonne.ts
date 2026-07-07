import type { OperatorSheet, Effect } from '../types';

const ENHANCED_BASIC_ATTACK_MULTIPLIER = [
  8.9, 9.8, 10.7, 11.6, 12.5, 13.4, 14.3, 15.1, 16, 17.2, 18.5, 20,
];

const ENHANCED_BASIC_ATTACK_EFFECTS: Effect[] = [
  {
    id: 'yvonne-ultimate-crit-rate',
    kind: 'status',
    stat: { modifier: 'critRate' },
    target: 'self',
    value: 3,
    maxStacks: 10,
    duration: 7.1,
  },
];

const sheet: OperatorSheet = {
  gameId: 'YVONNE',
  rarity: 6,
  weapon: 'handcannon',
  element: 'cryo',
  finisherElement: 'cryo',
  diveElement: 'cryo',
  class: 'striker',
  mainAttribute: 'intellect',
  subAttribute: 'agility',
  attributes: {
    Strength: [8, 24, 40, 57, 74, 82],
    Agility: [14, 38, 64, 89, 115, 128],
    Intellect: [24, 57, 91, 125, 159, 176],
    Will: [10, 30, 52, 73, 94, 105],
    'Base ATK': [30, 92, 157, 223, 288, 321],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      triggers: [
        {
          trigger: {
            kind: 'onStatusApplied',
            skillTypes: 'battleSkill',
            status: 'solidification',
            target: 'enemy',
          },
          effects: [
            {
              id: 'yvonne-t1',
              kind: 'status',
              stat: { modifier: 'dmgBonus', skillTypes: 'basicAttack' },
              target: 'self',
              value: [0, 50],
              duration: 999,
            },
          ],
        },
        {
          trigger: { kind: 'onFinalStrike', triggerScope: 'self' },
          effects: [
            {
              kind: 'consume',
              operatorStatus: 'yvonne-t1',
            },
          ],
        },
      ],
    },
    {
      levels: 2,
      effects: [
        {
          id: 'yvonne-p2-cryo',
          kind: 'status',
          stat: { modifier: 'critDmg' },
          target: 'self',
          value: [10, 20],
          condition: {
            kind: 'enemyStatus',
            status: ['cryoInfliction', 'solidification'],
          },
          hide: true,
        },
        {
          id: 'yvonne-p2-solidification',
          kind: 'status',
          stat: { modifier: 'critDmg' },
          target: 'self',
          value: [10, 20],
          condition: {
            kind: 'enemyStatus',
            status: 'solidification',
          },
          hide: true,
        },
      ],
    },
  ],
  potentials: [
    {
      patches: [
        {
          kind: 'patchTick',
          targetTick: 'yvonne-combo-dot',
          tick: { hitCount: 6 },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'yvonne-combo-ult-energy',
          effect: {
            scaling: {
              additive: [15],
            },
          },
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: 'intellect' },
          target: 'self',
          value: 20,
        },
        {
          kind: 'status',
          stat: { modifier: 'critRate' },
          target: 'self',
          value: 7,
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'yvonne-p2-cryo',
          effect: {
            scaling: {
              additive: [10],
            },
          },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'yvonne-p2-solidification',
          effect: {
            scaling: {
              additive: [10],
            },
          },
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'yvonne-battle-hit',
          hit: {
            spReturn: 10,
          },
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'yvonne-ultimate',
          hit: {
            effects: [
              {
                kind: 'status',
                stat: { modifier: 'atkPercent' },
                target: 'self',
                value: 10,
                duration: 7,
              },
              {
                kind: 'status',
                stat: { modifier: 'critDmg' },
                target: 'self',
                value: 30,
                duration: 7,
              },
            ],
          },
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.567,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [24, 26, 28, 31, 33, 35, 38, 40, 42, 45, 49, 53],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.367,
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
              multiplier: [25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.467,
                },
              ],
            },
          ],
        },
        {
          duration: 0.53,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [32, 35, 38, 41, 44, 47, 50, 54, 57, 61, 65, 71],
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
          duration: 0.83,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [41, 45, 49, 53, 58, 62, 66, 70, 74, 79, 85, 92],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.367,
                },
              ],
            },
          ],
        },
        {
          duration: 1.167,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [56, 62, 67, 73, 79, 84, 90, 96, 101, 108, 117, 126],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.7,
                  spRecovery: 17,
                  stagger: 17,
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
          duration: 1.13,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [111, 122, 133, 144, 155, 167, 178, 189, 200, 214, 230, 250],
              multiplierMode: 'split',
              multiplierScaling: {
                conditionalScaling: {
                  condition: {
                    kind: 'enemyStatus',
                    status: ['cryoInfliction', 'natureInfliction'],
                  },
                  scaling: {
                    additive: [
                      [67, 73, 80, 87, 93, 100, 107, 113, 120, 128, 138, 150],
                      {
                        key: 'cryoInfliction',
                        target: 'enemy',
                        coefficient: [89, 98, 107, 116, 124, 133, 142, 151, 160, 171, 185, 200],
                      },
                      {
                        key: 'natureInfliction',
                        target: 'enemy',
                        coefficient: [89, 98, 107, 116, 124, 133, 142, 151, 160, 171, 185, 200],
                      },
                    ],
                  },
                },
              },
              hits: [
                {
                  id: 'yvonne-battle-hit',
                  offset: 0.17,
                  stagger: 10,
                  effects: [
                    {
                      kind: 'reaction',
                      reactionType: 'solidification',
                      requiresInfliction: ['cryo', 'nature'],
                    },
                    {
                      kind: 'ultEnergyGain',
                      value: 10,
                      condition: {
                        kind: 'enemyStatus',
                        status: ['cryoInfliction', 'natureInfliction'],
                      },
                    },
                    {
                      kind: 'ultEnergyGain',
                      value: 0,
                      scaling: {
                        additive: [
                          {
                            key: 'cryoInfliction',
                            target: 'enemy',
                            coefficient: 30,
                          },
                          {
                            key: 'natureInfliction',
                            target: 'enemy',
                            coefficient: 30,
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
    },
    comboSkill: {
      ultimateEnergyGain: 10,
      segments: [
        {
          duration: 0.63,
          damageGroups: [
            {
              element: 'cryo',
              id: 'yvonne-combo-dot',
              multiplier: [45, 49, 54, 58, 62, 67, 71, 76, 80, 86, 93, 100],
              multiplierMode: 'each',
              tick: {
                offset: 0.5,
                duration: 3,
                hitCount: 4,
                effects: i =>
                  i === 0
                    ? [
                        {
                          id: 'yvonne-combo-ult-energy',
                          kind: 'ultEnergyGain' as const,
                          value: 10,
                        },
                      ]
                    : [],
              },
            },
            {
              element: 'cryo',
              multiplier: [89, 98, 107, 116, 125, 134, 142, 151, 160, 171, 185, 200],
              multiplierMode: 'each',
              hits: [
                {
                  offset: 3.63,
                  stagger: 10,
                  effects: [{ kind: 'reaction', reactionType: 'solidification' }],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [20, 20, 20, 20, 20, 20, 20, 20, 19, 19, 19, 18],
    },
    ultimate: {
      segments: [
        {
          duration: 2.13,
          damageGroups: [
            {
              element: 'cryo',
              hits: [
                {
                  id: 'yvonne-ultimate',
                  offset: 2.13,
                },
              ],
            },
          ],
        },
      ],
      subSkills: [
        {
          group: 'basicAttack',
          name: 'enhancedBasicAttack',
          segments: [
            {
              duration: 7.25,
              damageGroups: [
                // First 3 hits
                {
                  element: 'cryo',
                  multiplier: ENHANCED_BASIC_ATTACK_MULTIPLIER,
                  multiplierMode: 'each',
                  tick: {
                    offset: 0.3,
                    duration: 0.4,
                    hitCount: 3,
                    effects: () => ENHANCED_BASIC_ATTACK_EFFECTS,
                  },
                },
                // Then 8 hits
                {
                  element: 'cryo',
                  multiplier: ENHANCED_BASIC_ATTACK_MULTIPLIER,
                  multiplierMode: 'each',
                  tick: {
                    offset: 1.05,
                    duration: 0.85,
                    hitCount: 8,
                    effects: () => ENHANCED_BASIC_ATTACK_EFFECTS,
                  },
                },
                // Burst 64 hits
                {
                  element: 'cryo',
                  multiplier: ENHANCED_BASIC_ATTACK_MULTIPLIER,
                  multiplierMode: 'each',
                  tick: {
                    offset: 2.4,
                    duration: 4.45,
                    hitCount: 64,
                    effects: () => ENHANCED_BASIC_ATTACK_EFFECTS,
                  },
                },
                // Last hit
                {
                  element: 'cryo',
                  multiplier: [133, 147, 160, 173, 186, 200, 213, 226, 240, 256, 276, 300],
                  multiplierMode: 'split',
                  hits: [
                    {
                      offset: 6.98,
                      stagger: 20,
                      effects: [
                        {
                          kind: 'consume',
                          operatorStatus: 'yvonne-ultimate-crit-rate',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'critDmg' },
              target: 'self',
              value: 60,
              condition: {
                kind: 'operatorStatus',
                status: 'yvonne-ultimate-crit-rate',
                stacks: { compare: 'atLeast', count: 10 },
              },
            },
          ],
        },
      ],
      ultimateEnergyCost: 220,
      enhancementTime: 7,
      animationTime: 2.03,
      cooldown: 10,
    },
  },
};

export default sheet;
