import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  new: true,
  gameId: 'CAMILLE',
  rarity: 6,
  weapon: 'polearm',
  element: 'heat',
  finisherElement: 'heat',
  diveElement: 'heat',
  class: 'vanguard',
  mainAttribute: 'agility',
  subAttribute: 'intellect',
  attributes: {
    Strength: [13.4, 32.39, 52.38, 72.38, 92.35, 102.35],
    Agility: [17.78, 48.33, 80.49, 112.65, 144.81, 160.89],
    Intellect: [14.18, 38.73, 64.58, 90.44, 116.29, 129.21],
    Will: [11.34, 28.57, 46.71, 64.84, 82.98, 92.05],
    'Base ATK': [30, 91, 155, 219, 283, 315],
    'Base HP': [500, 1566.33, 2688.78, 3811.22, 4933.67, 5494.90],
  },
  talents: [
    {
      levels: 2,
      triggers: [
        {
          trigger: {
            kind: 'onHit',
            skillId: 'camille-pursuit-last-hit',
          },
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'link' },
              target: 'team',
              duration: 20,
            },
            {
              kind: 'status',
              stat: { modifier: 'heal' },
              target: 'self',
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusExpire',
            status: 'camille-battle-burst-lag',
            target: 'self',
          },
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'link' },
              target: 'team',
              duration: 20,
            },
            {
              kind: 'status',
              stat: { modifier: 'heal' },
              target: 'self',
            },
          ],
        },
      ],
    },
    {
      levels: 2,
      triggers: [
        {
          trigger: {
            kind: 'onStatusApplied',
            status: { modifier: 'heal' },
            target: 'self',
          },
          effects: [
            {
              id: 'camilla-t2-self',
              kind: 'status',
              stat: { modifier: 'dmgBonus' },
              value: [2, 4],
              target: 'self',
              duration: 40,
              stacks: 2,
              maxStacks: 5,
            },
            {
              id: 'camilla-t2-team',
              kind: 'status',
              stat: { modifier: 'dmgBonus' },
              value: [0.5, 1],
              target: 'teamExcludeSelf',
              duration: 40,
              stacks: 2,
              maxStacks: 5,
            },
          ],
        },
      ],
    },
  ],
  potentials: [
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'camille-firefang-vesperwings-susceptibility',
          effect: {
            scaling: {
              additive: [5],
            },
            durationExtension: 15,
          },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'camille-firefang-vesperwings-weaken',
          effect: {
            scaling: {
              additive: [5],
            },
            durationExtension: 15,
          },
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: ['agility', 'intellect'] },
          target: 'self',
          value: 15,
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'cooldownReductionFlat', skillTypes: 'comboSkill' },
          target: 'self',
          value: 2,
        },
        {
          kind: 'status',
          stat: { modifier: 'directMultiplier', skillTypes: 'comboSkill' },
          target: 'self',
          value: 1.3,
        },
        {
          kind: 'status',
          stat: { modifier: 'spRecoveryPercent', skillTypes: 'comboSkill' },
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
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'camilla-t2-self',
          effect: {
            scaling: {
              additive: [6],
            },
          },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'camilla-t2-team',
          effect: {
            scaling: {
              additive: [1.5],
            },
          },
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.4,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56],
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
              multiplier: [20, 22, 24, 26, 28, 30, 32, 34, 36, 39, 42, 45],
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
              multiplier: [30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68],
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
              multiplier: [34, 37, 41, 44, 48, 51, 54, 58, 61, 66, 71, 77],
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
              multiplier: [50, 55, 60, 65, 70, 75, 80, 85, 90, 96, 104, 113],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.567,
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
          duration: 0.9,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [89, 98, 107, 116, 125, 134, 143, 151, 160, 172, 185, 200],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.467,
                  stagger: 10,
                  effects: [
                    { kind: 'infliction', element: 'heat' },
                    {
                      id: 'camille-firefang-vesperwings-susceptibility',
                      name: 'firefangVesperwings',
                      kind: 'status',
                      target: 'enemy',
                      stat: { modifier: 'susceptibility', elements: 'heat' },
                      value: [5, 5, 5, 6, 6, 6, 6, 6, 6, 6.5, 6.5, 7],
                      duration: 45,
                    },
                    {
                      id: 'camille-firefang-vesperwings-weaken',
                      kind: 'status',
                      target: 'enemy',
                      stat: { modifier: 'weaken' },
                      value: [5, 5, 5, 6, 6, 6, 6, 6, 6, 6.5, 6.5, 7],
                      duration: 45,
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
              multiplier: [222, 244, 267, 289, 311, 333, 356, 378, 400, 428, 461, 500],
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
                  id: 'camille-pursuit-last-hit',
                  offset: 2.633,
                  stagger: 20,
                  spRecovery: [32, 32, 32, 32, 32, 32, 36, 36, 36, 40, 40, 40],
                  effects: [
                    { kind: 'consume', operatorStatus: 'camille-hunter-pursuit-ready' },
                    { kind: 'ultEnergyGain', target: 'self', value: 10 },
                  ],
                },
              ],
              condition: { kind: 'operatorStatus', status: 'camille-hunter-pursuit-ready' },
            },
          ],
        },
      ],
      triggers: [
        {
          trigger: {
            kind: 'onHit',
            skillId: 'camille-combo-last-hit',
          },
          effects: [
            {
              id: 'camille-battle-burst-lag',
              kind: 'status',
              target: 'self',
              duration: 0.4,
              hide: true,
              condition: {
                kind: 'enemyStatus',
                status: 'camille-firefang-vesperwings-susceptibility',
              },
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusExpire',
            status: 'camille-battle-burst-lag',
            target: 'self',
          },
          effects: [
            {
              id: 'camille-battle-burst',
              kind: 'damageHit',
              element: 'heat',
              multiplier: [45, 49, 54, 58, 62, 67, 71, 76, 80, 86, 93, 100],
            },
          ],
        },
      ],
    },
    comboSkill: {
      ultimateEnergyGain: 10,
      segments: [
        {
          duration: 2.133,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [133, 147, 160, 173, 186, 200, 213, 226, 240, 256, 276, 300],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.667,
                },
                {
                  offset: 1.133,
                },
                {
                  id: 'camille-combo-last-hit',
                  offset: 1.767,
                  stagger: 10,
                  spRecovery: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
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
          duration: 4.633,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [267, 293, 320, 347, 373, 400, 427, 453, 480, 513, 553, 600],
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
                  stagger: 15,
                  spRecovery: [32, 32, 32, 32, 32, 32, 32, 32, 36, 36, 36, 40],
                  effects: [
                    { kind: 'infliction', element: 'heat' },
                    {
                      id: 'camille-hunter-pursuit-ready',
                      name: 'pursuit',
                      kind: 'status',
                      stat: { modifier: 'battleSkillSPCostReduction' },
                      target: 'self',
                      value: 100,
                      duration: 15,
                      icon: '/operators/camille/avatar.webp',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 130,
      animationTime: 2.3,
      cooldown: 20,
    },
  },
};

export default sheet;