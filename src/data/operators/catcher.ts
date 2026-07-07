import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'CATCHER',
  rarity: 4,
  weapon: 'greatsword',
  element: 'physical',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'defender',
  mainAttribute: 'strength',
  subAttribute: 'will',
  attributes: {
    Strength: [21, 54, 89, 124, 159, 176],
    Agility: [9, 28, 47, 67, 87, 96],
    Intellect: [8, 25, 42, 60, 77, 86],
    Will: [11, 31, 53, 74, 96, 106],
    'Base ATK': [30, 88, 148, 209, 270, 300],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'flatDef' },
          target: 'self',
          scaling: {
            additive: [{ basis: 'will', coefficient: [0.1, 0.12] }],
          },
        },
      ],
    },
    {
      levels: 2,
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'catcher-ultimate-last-hit',
          hit: {
            effects: [
              {
                kind: 'damageHit',
                element: 'physical',
                multiplier: [30, 30],
                multiplierScaling: {
                  multiplier: [[2, 3]],
                },
              },
            ],
          },
        },
      ],
    },
  ],
  potentials: [
    {
      // TODO
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
          value: 10,
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'catcher-combo-shield',
          effect: {
            durationExtension: 5,
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
          value: 10,
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'catcher-battle-sp',
          effect: {
            scaling: {
              conditionalScaling: {
                scaling: {
                  additive: [10],
                },
                condition: {
                  kind: 'operatorStatus',
                  status: { modifier: 'shield' },
                },
              },
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
          duration: 0.73,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [35, 39, 42, 46, 49, 53, 56, 60, 63, 67, 73, 79],
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
          duration: 0.73,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [39, 42, 46, 50, 54, 58, 62, 65, 69, 74, 80, 87],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.33,
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
              multiplier: [54, 59, 65, 70, 76, 81, 86, 92, 97, 104, 112, 122],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.53,
                },
              ],
            },
          ],
        },
        {
          duration: 1.53,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [71, 78, 85, 92, 99, 107, 114, 121, 128, 137, 147, 160],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.77,
                  spRecovery: 25,
                  stagger: 22,
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
              element: 'physical',
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
              element: 'physical',
              multiplier: [178, 196, 213, 231, 249, 267, 285, 302, 320, 342, 369, 400],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.2,
                  stagger: 20,
                  effects: [
                    { kind: 'physicalStatus', physicalType: 'vulnerability' },
                    {
                      id: 'catcher-battle-sp',
                      kind: 'spReturn',
                      value: 30,
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
          duration: 0.8,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [25, 27, 30, 32, 34, 37, 39, 42, 44, 47, 51, 55],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.47,
                },
              ],
            },
            {
              element: 'physical',
              multiplier: [100, 110, 120, 130, 140, 150, 160, 170, 180, 193, 208, 225],
              multiplierMode: 'split',
              hits: [
                {
                  id: 'catcher-combo-shield-hit',
                  offset: 0.67,
                  stagger: 10,
                  effects: [
                    {
                      id: 'catcher-combo-shield',
                      kind: 'status',
                      stat: { modifier: 'shield' },
                      target: 'self',
                      duration: 10,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 33],
    },
    ultimate: {
      segments: [
        {
          duration: 3.43,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [89, 98, 107, 116, 125, 134, 143, 151, 160, 172, 185, 200],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.53,
                  stagger: 5,
                  effects: [
                    { kind: 'status', stat: { modifier: 'weaken' }, target: 'enemy', duration: 8 },
                  ],
                },
              ],
            },
            {
              element: 'physical',
              multiplier: [120, 132, 144, 156, 168, 180, 192, 204, 216, 231, 249, 270],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 2.13,
                  stagger: 5,
                },
              ],
            },
            {
              element: 'physical',
              multiplier: [178, 196, 213, 231, 249, 267, 284, 302, 320, 342, 369, 400],
              multiplierMode: 'split',
              hits: [
                {
                  id: 'catcher-ultimate-last-hit',
                  offset: 2.83,
                  stagger: 10,
                  effects: [{ kind: 'physicalStatus', physicalType: 'knockdown' }],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 80,
      animationTime: 1.3,
      cooldown: 15,
    },
  },
};

export default sheet;
