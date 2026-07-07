import type { Effect, OperatorSheet, StatusEffect } from '../types';

const GAIN_MELTING_FLAME_EFFECT: StatusEffect = {
  id: 'laevatain-melting-flame',
  name: 'meltingFlame',
  kind: 'status',
  target: 'self',
  duration: 999,
  maxStacks: 4,
  icon: [
    'operators/laevatain/magma_1.webp',
    'operators/laevatain/magma_2.webp',
    'operators/laevatain/magma_3.webp',
    'operators/laevatain/magma_4.webp',
  ],
};

const createAbsorbHeatInflictionEffects = (): Effect[] =>
    [0, 1, 2, 3].map(x => ({
      kind: 'consume',
      enemyStatus: 'heatInfliction',
      consumeStacks: 4 - x,
      condition:
          x === 0
              ? {
                kind: 'not',
                condition: {
                  kind: 'operatorStatus',
                  status: 'laevatain-melting-flame',
                },
              }
              : {
                kind: 'operatorStatus',
                status: 'laevatain-melting-flame',
                stacks: { compare: 'exact', count: x },
              },
    }));

const sheet: OperatorSheet = {
  gameId: 'LAEVATAIN',
  rarity: 6,
  weapon: 'sword',
  element: 'heat',
  finisherElement: 'heat',
  diveElement: 'heat',
  class: 'striker',
  mainAttribute: 'intellect',
  subAttribute: 'strength',
  attributes: {
    Strength: [13, 36, 60, 85, 109, 121],
    Agility: [9, 28, 49, 69, 89, 99],
    Intellect: [22, 55, 90, 125, 160, 177],
    Will: [9, 26, 44, 62, 80, 89],
    'Base ATK': [30, 91, 156, 221, 285, 318],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 3,
      triggers: [
        {
          trigger: { kind: 'onFinalStrike', triggerScope: 'global' },
          effects: createAbsorbHeatInflictionEffects(),
        },
        {
          trigger: { kind: 'onFinisher', triggerScope: 'global' },
          effects: createAbsorbHeatInflictionEffects(),
        },
        {
          trigger: { kind: 'onStatusConsumed', status: 'heatInfliction', target: 'enemy' },
          effects: [
            {
              ...GAIN_MELTING_FLAME_EFFECT,
              stacks: 'fromConsume',
            },
          ],
        },
        {
          trigger: { kind: 'onStatusApplied', status: 'laevatain-melting-flame', target: 'self' },
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'resistanceIgnore', elements: 'heat' },
              target: 'self',
              value: [10, 15, 20],
              condition: {
                kind: 'operatorStatus',
                status: 'laevatain-melting-flame',
                stacks: { compare: 'exact', count: 4 },
              },
              duration: 20,
              icon: '/operators/laevatain/talent 1.webp',
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
          value: 1.2,
        },
      ],
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'laevatain-battle-additional-attack',
          hit: {
            spReturn: 20,
          },
        },
        {
          kind: 'patchHit',
          targetHit: 'laevatain-battle-additional-attack-during-ultimate',
          hit: {
            spReturn: 20,
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
          stat: { modifier: 'dmgBonus', skillTypes: 'basicAttack' },
          target: 'self',
          value: 15,
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'laevatain-battle-combustion',
          effect: {
            durationExtension: 2.5,
            effectiveness: 1.5,
          },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'laevatain-battle-combustion-during-ultimate',
          effect: {
            durationExtension: 2.5,
            effectiveness: 1.5,
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
          stat: { modifier: 'directMultiplier', skillId: 'laevatain-basic-attack-during-ultimate' },
          target: 'self',
          value: 1.2,
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.367,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [16, 18, 19, 21, 22, 24, 26, 27, 29, 31, 33, 36],
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
          duration: 0.567,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [24, 26, 29, 31, 34, 36, 38, 41, 43, 46, 50, 54],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.2,
                },
                {
                  offset: 0.43,
                },
              ],
            },
          ],
        },
        {
          duration: 0.43,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56],
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
          duration: 0.76,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [39, 43, 47, 51, 55, 59, 62, 66, 70, 75, 81, 88],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.2,
                },
                {
                  offset: 0.4,
                },
                {
                  offset: 0.63,
                },
              ],
            },
          ],
        },
        {
          duration: 1.167,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [53, 58, 64, 69, 74, 80, 85, 90, 95, 102, 110, 119],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.77,
                },
                {
                  offset: 0.87,
                  spRecovery: 20,
                  stagger: 18,
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
          duration: 1.73,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [62, 68, 75, 81, 87, 93, 99, 106, 112, 120, 129, 140],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.73,
                  stagger: 10,
                  effects: [
                    {
                      ...GAIN_MELTING_FLAME_EFFECT,
                      condition: {
                        kind: 'operatorStatus',
                        status: 'laevatain-melting-flame',
                        stacks: { compare: 'atMost', count: 3 },
                      },
                    },
                    {
                      id: 'laevatain-battle-additional-attack-trigger',
                      kind: 'status',
                      target: 'self',
                      duration: 3,
                      hide: true,
                      condition: {
                        kind: 'operatorStatus',
                        status: 'laevatain-melting-flame',
                        stacks: { compare: 'exact', count: 4 },
                      },
                    },
                  ],
                },
              ],
            },
            {
              element: 'heat',
              multiplier: [6, 7, 8, 8, 9, 9, 10, 11, 11, 12, 13, 14],
              multiplierMode: 'each',
              tick: {
                offset: 0.75,
                duration: 1.65 - 0.75,
                hitCount: 10,
              },
            },
            {
              element: 'heat',
              multiplier: [342, 376, 410, 445, 479, 513, 547, 581, 616, 658, 710, 770],
              multiplierMode: 'split',
              hits: [
                {
                  id: 'laevatain-battle-additional-attack',
                  offset: 1.817,
                  durationExtension: 0.217,
                  stagger: 10,
                  effects: [
                    {
                      kind: 'consume',
                      operatorStatus: 'laevatain-melting-flame',
                    },
                    {
                      id: 'laevatain-battle-combustion',
                      kind: 'reaction',
                      reactionType: 'combustion',
                      duration: 5,
                    },
                    { kind: 'ultEnergyGain', value: 100 },
                  ],
                },
              ],
              condition: {
                kind: 'operatorStatus',
                status: 'laevatain-battle-additional-attack-trigger',
                consume: true,
              },
            },
          ],
        },
      ],
      subSkills: [
        {
          group: 'battleSkill',
          name: 'enhancedBattleSkill',
          icon: '/operators/laevatain/ultimate_skill.webp',
          segments: [
            {
              duration: 1.1,
              damageGroups: [
                {
                  element: 'heat',
                  multiplier: [147, 161, 176, 191, 205, 220, 235, 249, 264, 282, 304, 330],
                  multiplierMode: 'split',
                  hits: [
                    {
                      offset: 0.43,
                      stagger: 10,
                      effects: [
                        {
                          ...GAIN_MELTING_FLAME_EFFECT,
                          condition: {
                            kind: 'operatorStatus',
                            status: 'laevatain-melting-flame',
                            stacks: { compare: 'atMost', count: 3 },
                          },
                        },
                        {
                          id: 'laevatain-battle-additional-attack-during-ultimate-trigger',
                          kind: 'status',
                          target: 'self',
                          duration: 3,
                          hide: true,
                          condition: {
                            kind: 'operatorStatus',
                            status: 'laevatain-melting-flame',
                            stacks: { compare: 'exact', count: 4 },
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  element: 'heat',
                  multiplier: [164, 181, 197, 214, 230, 247, 263, 279, 296, 316, 341, 370],
                  multiplierMode: 'split',
                  hits: [
                    {
                      offset: 0.77,
                      stagger: 10,
                    },
                  ],
                },
                {
                  element: 'heat',
                  multiplier: [400, 440, 480, 520, 560, 600, 640, 680, 720, 770, 830, 900],
                  multiplierMode: 'split',
                  hits: [
                    {
                      id: 'laevatain-battle-additional-attack-during-ultimate',
                      offset: 1.9,
                      durationExtension: 0.93,
                      stagger: 10,
                      effects: [
                        {
                          kind: 'consume',
                          operatorStatus: 'laevatain-melting-flame',
                        },
                        {
                          id: 'laevatain-battle-combustion-during-ultimate',
                          kind: 'reaction',
                          reactionType: 'combustion',
                          duration: 5,
                        },
                      ],
                    }
                  ],
                  condition: {
                    kind: 'operatorStatus',
                    status: 'laevatain-battle-additional-attack-during-ultimate-trigger',
                    consume: true,
                  },
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
          duration: 1.37,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [240, 264, 288, 312, 336, 360, 384, 408, 432, 462, 498, 540],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.67,
                  stagger: 10,
                  effects: [GAIN_MELTING_FLAME_EFFECT, { kind: 'ultEnergyGain', value: 25 }],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 9],
    },
    ultimate: {
      element: 'heat',
      segments: [
        {
          duration: 2.37,
          damageGroups: [],
        },
      ],
      ultimateEnergyCost: 300,
      enhancementTime: 15,
      animationTime: 2.07,
      cooldown: 10,
      subSkills: [
        {
          id: 'laevatain-basic-attack-during-ultimate',
          group: 'basicAttack',
          name: 'enhancedBasicAttack',
          segments: [
            {
              duration: 0.6,
              damageGroups: [
                {
                  element: 'heat',
                  multiplier: [65, 71, 78, 84, 91, 97, 104, 110, 117, 125, 134, 146],
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
              duration: 0.93,
              damageGroups: [
                {
                  element: 'heat',
                  multiplier: [81, 89, 97, 105, 113, 122, 130, 138, 146, 156, 168, 182],
                  multiplierMode: 'split',
                  hits: [
                    {
                      offset: 0.33,
                    },
                    {
                      offset: 0.7,
                    },
                  ],
                },
              ],
            },
            {
              duration: 0.5,
              damageGroups: [
                {
                  element: 'heat',
                  multiplier: [115, 127, 139, 150, 162, 173, 185, 196, 208, 222, 240, 260],
                  multiplierMode: 'split',
                  hits: [
                    {
                      offset: 0.3,
                      effects: [{ kind: 'infliction', element: 'heat' }],
                    },
                  ],
                },
              ],
            },
            {
              duration: 1.2,
              damageGroups: [
                {
                  element: 'heat',
                  multiplier: [203, 223, 243, 263, 284, 304, 324, 344, 365, 390, 420, 456],
                  multiplierMode: 'split',
                  hits: [
                    {
                      offset: 0.73,
                    },
                    {
                      offset: 0.87,
                      spRecovery: 20,
                      stagger: 24,
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
