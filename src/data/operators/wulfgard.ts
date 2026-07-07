import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'WULFGARD',
  rarity: 5,
  weapon: 'handcannon',
  element: 'heat',
  finisherElement: 'heat',
  diveElement: 'heat',
  class: 'caster',
  mainAttribute: 'strength',
  subAttribute: 'agility',
  attributes: {
    Strength: [18, 49, 81, 113, 145, 161],
    Agility: [9, 27, 47, 66, 85, 95],
    Intellect: [9, 27, 45, 64, 83, 92],
    Will: [13, 34, 56, 78, 100, 111],
    'Base ATK': [30, 86, 146, 205, 264, 294],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      triggers: [
        {
          trigger: { kind: 'onStatusApplied', status: 'combustion', target: 'enemy' },
          effects: [
            {
              id: 'wulfgard-scorching-fangs',
              name: 'scorchingFangs',
              kind: 'status',
              stat: { modifier: 'dmgBonus', elements: 'heat' },
              target: 'self',
              value: [20, 30],
              duration: 10,
              icon: '/operators/wulfgard/talent 1.webp',
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
          targetHit: 'wulfgard-battle-additional-shot',
          hit: {
            effects: [{ id: 'wulfgard-t2-sp', kind: 'spReturn', value: [5, 10] }],
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
          stat: { modifier: 'attributeFlat', attribute: ['strength', 'agility'] },
          target: 'self',
          value: 15,
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'wulfgard-t2-sp',
          effect: {
            scaling: { additive: [10] },
          },
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'wulfgard-battle-additional-shot',
          hit: {
            effects: [
              {
                // Self
                kind: 'derived',
                sourceEffect: 'wulfgard-scorching-fangs',
                condition: { kind: 'operatorStatus', status: 'wulfgard-scorching-fangs' },
              },
              {
                // Team: 50% copy
                kind: 'derived',
                sourceEffect: 'wulfgard-scorching-fangs',
                condition: { kind: 'operatorStatus', status: 'wulfgard-scorching-fangs' },
                effect: {
                  target: 'teamExcludeSelf',
                  scaling: { multiplier: [0.5] },
                },
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
          stat: { modifier: 'ultimateEnergyCostReduction' },
          target: 'self',
          value: 15,
        },
      ],
    },
    {
      triggers: [
        {
          trigger: { kind: 'onActionStart', skillTypes: 'ultimate' },
          effects: [
            {
              kind: 'cooldownReductionPercent',
              skillTypes: 'comboSkill',
              target: 'self',
              value: 100,
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
              element: 'heat',
              multiplier: [30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.23,
                },
                {
                  offset: 0.467,
                },
              ],
            },
          ],
        },
        {
          duration: 0.8,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [35, 39, 42, 46, 49, 53, 56, 60, 63, 67, 73, 79],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.33,
                },
                {
                  offset: 0.53,
                },
              ],
            },
          ],
        },
        {
          duration: 1.1,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [56, 61, 67, 72, 78, 83, 89, 94, 100, 107, 115, 125],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.4,
                },
                {
                  offset: 0.6,
                },
                {
                  offset: 0.8,
                },
              ],
            },
          ],
        },
        {
          duration: 1.767,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [68, 74, 81, 88, 95, 101, 108, 115, 122, 130, 140, 152],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.767,
                  spRecovery: 18,
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
          duration: 1.05,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [102, 112, 122, 133, 143, 153, 163, 174, 184, 196, 212, 230],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.283,
                },
                {
                  offset: 0.617,
                },
                {
                  offset: 0.83,
                  stagger: 5,
                  effects: [
                    {
                      kind: 'infliction',
                      element: 'heat',
                      condition: {
                        kind: 'not',
                        condition: {
                          kind: 'enemyStatus',
                          status: ['combustion', 'electrification'],
                        },
                      },
                    },
                    {
                      kind: 'status',
                      id: 'wulfgard-battle-additional-shot-trigger',
                      target: 'self',
                      duration: 1.5,
                      condition: {
                        kind: 'enemyStatus',
                        status: ['combustion', 'electrification'],
                      },
                      hide: true,
                    },
                  ],
                },
              ],
            },
            {
              element: 'heat',
              multiplier: [378, 415, 453, 491, 529, 566, 604, 642, 680, 727, 784, 850],
              multiplierMode: 'split',
              hits: [
                {
                  id: 'wulfgard-battle-additional-shot',
                  offset: 1.883,
                  durationExtension: 1.1,
                  stagger: 5,
                  effects: [
                    {
                      kind: 'status',
                      target: 'self',
                      condition: {
                        kind: 'enemyStatus',
                        status: ['combustion', 'electrification'],
                        consume: true,
                      },
                    },
                  ],
                },
              ],
              condition: {
                kind: 'operatorStatus',
                status: 'wulfgard-battle-additional-shot-trigger',
                consume: true,
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
          duration: 1,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [60, 66, 72, 78, 84, 90, 96, 102, 108, 116, 125, 135],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.9,
                  stagger: 10,
                  effects: [{ kind: 'infliction', element: 'heat' }],
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
          duration: 2.5,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [32, 35, 38, 42, 45, 48, 51, 54, 58, 62, 66, 72],
              multiplierMode: 'each',
              hits: [
                {
                  offset: 1.53,
                  stagger: 3,
                  effects: [{ kind: 'reaction', reactionType: 'combustion' }],
                },
                {
                  offset: 1.73,
                  stagger: 3,
                },
                {
                  offset: 1.967,
                  stagger: 3,
                },
                {
                  offset: 2.13,
                  stagger: 3,
                },
                {
                  offset: 2.3,
                  stagger: 3,
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 90,
      animationTime: 1.53,
      cooldown: 10,
    },
  },
};

export default sheet;
