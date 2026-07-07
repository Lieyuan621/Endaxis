import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'PERLICA',
  rarity: 5,
  weapon: 'arts-unit',
  element: 'electric',
  finisherElement: 'electric',
  diveElement: 'electric',
  class: 'caster',
  mainAttribute: 'intellect',
  subAttribute: 'will',
  attributes: {
    Strength: [9, 26, 45, 64, 82, 91],
    Agility: [9, 27, 46, 65, 84, 93],
    Intellect: [21, 51, 83, 114, 145, 161],
    Will: [13, 34, 57, 79, 102, 113],
    'Base ATK': [30, 88, 150, 211, 272, 303],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus' },
          target: 'self',
          value: [20, 30],
          condition: {
            kind: 'enemyStaggered',
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
          targetEffect: 'perlica-combo-electrification',
          effect: {
            durationExtension: 5 * 0.75,
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
          trigger: { kind: 'onStatusApplied', status: 'electrification', target: 'enemy' },
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'atkPercent' },
              target: 'self',
              value: 20,
              maxStacks: 2,
              duration: 5,
            },
          ],
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'perlica-combo-electrification',
          effect: {
            effectiveness: 1.33,
          },
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'critRate', skillTypes: 'ultimate' },
          target: 'self',
          value: 30,
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.53,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [25, 28, 31, 33, 36, 38, 41, 43, 46, 49, 53, 57],
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
          duration: 0.63,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.3,
                },
                {
                  offset: 0.4,
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
              multiplier: [37, 41, 45, 48, 52, 56, 59, 63, 67, 71, 77, 84],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.53,
                },
                {
                  offset: 0.63,
                },
                {
                  offset: 0.73,
                },
              ],
            },
          ],
        },
        {
          duration: 1.467,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [57, 62, 68, 73, 79, 85, 90, 96, 102, 109, 117, 127],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.9,
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
          duration: 0.93,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [178, 196, 213, 231, 249, 267, 285, 302, 320, 342, 369, 400],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.43,
                  stagger: 10,
                  effects: [{ kind: 'infliction', element: 'electric' }],
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
          duration: 0.83,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.8,
                  stagger: 10,
                  effects: [
                    {
                      id: 'perlica-combo-electrification',
                      kind: 'reaction',
                      reactionType: 'electrification',
                      duration: 5,
                      applyTiming: 'beforeDamage',
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
          duration: 2.1,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [445, 489, 534, 578, 622, 667, 711, 756, 800, 856, 923, 1000],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.93,
                  stagger: 20,
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 80,
      animationTime: 1.583,
      cooldown: 10,
    },
  },
};

export default sheet;
