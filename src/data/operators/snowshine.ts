import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'SNOWSHINE',
  rarity: 5,
  weapon: 'greatsword',
  element: 'cryo',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'defender',
  mainAttribute: 'strength',
  subAttribute: 'will',
  attributes: {
    Strength: [18, 47, 78, 108, 139, 154],
    Agility: [12, 32, 52, 73, 94, 104],
    Intellect: [9, 27, 46, 65, 84, 93],
    Will: [11, 31, 53, 75, 97, 108],
    'Base ATK': [30, 87, 147, 207, 267, 297],
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
          trigger: { kind: 'onHit', skillId: 'snowshine-battle-hit' },
          effects: [
            {
              kind: 'ultEnergyGain',
              value: [6, 10],
            },
          ],
        },
      ],
    },
  ],
  potentials: [
    {},
    {},
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'snowshine-ultimate-solidification',
          effect: {
            durationExtension: 2,
          },
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'flatDef' },
          target: 'self',
          value: 20,
        },
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: 'will' },
          target: 'self',
          value: 20,
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'snowshine-battle-hit',
          hit: { spReturn: 40 },
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 1.1,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [55, 61, 66, 72, 77, 83, 88, 94, 99, 106, 114, 124],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.63,
                },
              ],
            },
          ],
        },
        {
          duration: 0.967,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [59, 64, 70, 76, 82, 88, 94, 99, 105, 113, 121, 132],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.63,
                },
              ],
            },
          ],
        },
        {
          duration: 2.067,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [100, 110, 120, 130, 140, 150, 160, 170, 180, 193, 208, 225],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.7,
                },
                {
                  offset: 1.3,
                  spRecovery: 25,
                  stagger: 23,
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
          duration: 1.575,
          damageGroups: [
            {
              element: 'cryo',
              hits: [
                {
                  offset: 0,
                  effects: [
                    {
                      kind: 'status',
                      stat: { modifier: 'protection' },
                      target: 'team',
                      duration: 1.2,
                    },
                  ],
                },
              ],
            },
            {
              element: 'cryo',
              multiplier: [200, 220, 240, 260, 280, 300, 320, 340, 360, 385, 415, 450],
              multiplierMode: 'split',
              hits: [
                {
                  id: 'snowshine-battle-hit',
                  offset: 1.2,
                  spReturn: 30,
                  stagger: 20,
                  effects: [{ kind: 'infliction', element: 'cryo' }],
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
          duration: 0.5,
          damageGroups: [],
        },
      ],
      cooldown: [25, 25, 25, 25, 25, 25, 25, 25, 24, 24, 24, 23],
    },
    ultimate: {
      segments: [
        {
          duration: 2.37,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [200, 220, 240, 260, 280, 300, 320, 340, 360, 385, 415, 450],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.983,
                  stagger: [15, 15, 15, 15, 15, 15, 15, 15, 15, 20, 20, 20],
                },
              ],
            },
            {
              element: 'cryo',
              multiplier: [29, 32, 35, 37, 40, 43, 46, 49, 52, 55, 60, 65],
              multiplierMode: 'each',
              tick: {
                offset: 2.5,
                duration: 5,
                hitCount: 10,
                effects: i =>
                  i === 6
                    ? [
                        {
                          id: 'snowshine-ultimate-solidification',
                          kind: 'reaction' as const,
                          reactionType: 'solidification' as const,
                        },
                      ]
                    : [],
              },
            },
          ],
        },
      ],
      ultimateEnergyCost: 80,
      animationTime: 1.983,
      cooldown: 20,
    },
  },
};

export default sheet;
