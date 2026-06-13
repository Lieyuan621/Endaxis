import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  beta: true,
  gameId: 'CAMILLE',
  rarity: 6,
  weapon: 'polearm',
  element: 'heat',
  finisherElement: 'heat',
  diveElement: 'heat',
  class: 'vanguard',
  mainAttribute: 'agility',
  subAttribute: 'strength',
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
    },
    {
      levels: 2,
    },
  ],
  potentials: [{}, {}, {}, {}, {}],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.4,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.067,
                },
                {
                  offset: 0.333,
                },
              ],
            },
          ],
        },
        {
          duration: 0.667,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.433,
                },
                {
                  offset: 0.567,
                },
              ],
            },
          ],
        },
        {
          duration: 1.233,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.333,
                },
                {
                  offset: 0.433,
                },
                {
                  offset: 0.533,
                },
                {
                  offset: 0.9,
                },
                {
                  offset: 1.033,
                },
              ],
            },
          ],
        },
        {
          duration: 0.4,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.133,
                },
                {
                  offset: 0.2,
                },
                {
                  offset: 0.267,
                },
                {
                  offset: 0.333,
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
              multiplier: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.567,
                  spRecovery: 21,
                  stagger: 19,
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
          duration: 0.9,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.467,
                  stagger: 10,
                  effects: [
                    { kind: 'infliction', element: 'heat' },
                    {
                      id: 'camille-firefang-vesperwings',
                      name: 'firefangVesperwings',
                      kind: 'status',
                      target: 'enemy',
                      stat: { modifier: 'susceptibility', elements: 'heat' },
                      value: 0,
                      duration: 50,
                    },
                    {
                      kind: 'status',
                      target: 'enemy',
                      stat: { modifier: 'weaken' },
                      duration: 50,
                      hide: true,
                    },
                  ],
                },
              ],
              condition: {
                kind: 'not',
                condition: { kind: 'operatorStatus', status: 'camille-hunter-pursuit-ready' },
              },
            },
            {
              element: 'heat',
              multiplier: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              multiplierMode: 'split',
              treatAsSkillType: 'comboSkill',
              hits: [
                {
                  offset: 0.667,
                  durationExtension: 2.367,
                },
                {
                  offset: 1.2,
                },
                {
                  offset: 1.833,
                },
                {
                  offset: 2.633,
                  stagger: 10,
                  spRecovery: 20,
                  effects: [
                    { kind: 'consume', operatorStatus: 'camille-hunter-pursuit-ready' },
                    { kind: 'ultEnergyGain', target: 'self', value: 10 },
                    {
                      kind: 'status',
                      stat: { modifier: 'link' },
                      target: 'team',
                      duration: 20,
                    },
                  ],
                },
              ],
              condition: { kind: 'operatorStatus', status: 'camille-hunter-pursuit-ready' },
            },
          ],
        },
      ],
    },
    comboSkill: {
      segments: [
        {
          duration: 2.133,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.667,
                },
                {
                  offset: 1.133,
                },
                {
                  offset: 1.767,
                  stagger: 10,
                  spRecovery: 20,
                },
              ],
            },
            {
              element: 'heat',
              multiplier: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 2.167,
                  effects: [
                    {
                      kind: 'status',
                      stat: { modifier: 'link' },
                      target: 'team',
                      duration: 20,
                    },
                  ],
                },
              ],
              condition: {
                kind: 'enemyStatus',
                status: 'camille-firefang-vesperwings',
              },
            },
          ],
        },
      ],
      cooldown: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 14],
    },
    ultimate: {
      segments: [
        {
          duration: 4.633,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              multiplierMode: 'each',
              hits: [
                {
                  offset: 2.533,
                },
                {
                  offset: 3.467,
                },
                {
                  offset: 4,
                  stagger: 20,
                  spRecovery: 40,
                  effects: [
                    { kind: 'infliction', element: 'heat' },
                    {
                      id: 'camille-hunter-pursuit-ready',
                      kind: 'status',
                      stat: { modifier: 'battleSkillSPCostReduction' },
                      target: 'self',
                      value: 100,
                      duration: 30,
                      hide: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 90,
      animationTime: 2.3,
      cooldown: 20,
    },
  },
};

export default sheet;