import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'AVYWENNA',
  rarity: 5,
  weapon: 'polearm',
  element: 'electric',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'striker',
  mainAttribute: 'will',
  subAttribute: 'agility',
  attributes: {
    Strength: [12, 33, 54, 75, 96, 107],
    Agility: [10, 31, 52, 74, 95, 106],
    Intellect: [14, 34, 56, 78, 99, 110],
    Will: [15, 43, 73, 103, 133, 148],
    'Base ATK': [30, 90, 153, 217, 280, 312],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      triggers: [
        {
          trigger: { kind: 'onHit', skillTypes: ['comboSkill', 'ultimate'] },
          effects: [
            {
              id: 'avywenna-t1-thrown',
              kind: 'ultEnergyGain',
              value: [3, 4],
            },
          ],
        },
        {
          trigger: { kind: 'onStatusConsumed', status: 'avywenna-thunderlance', target: 'self' },
          effects: [
            {
              id: 'avywenna-t1-thunderlance-return',
              kind: 'ultEnergyGain',
              value: 0,
              scaling: {
                additive: [
                  {
                    key: 'avywenna-thunderlance',
                    target: 'self',
                    coefficient: [3, 4],
                  },
                ],
              },
            },
          ],
        },
        {
          trigger: { kind: 'onStatusConsumed', status: 'avywenna-thunderlance-ex', target: 'self' },
          effects: [
            {
              id: 'avywenna-t1-thunderlance-ex-return',
              kind: 'ultEnergyGain',
              value: 0,
              scaling: {
                additive: [
                  {
                    key: 'avywenna-thunderlance-ex',
                    target: 'self',
                    coefficient: [3, 4],
                  },
                ],
              },
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
          targetHit: 'avywenna-ultimate-hit',
          hit: {
            effects: [
              {
                kind: 'status',
                stat: { modifier: 'susceptibility', elements: 'electric' },
                value: [6, 10],
                duration: 10,
              },
            ],
          },
        },
      ],
    },
  ],
  potentials: [
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'avywenna-t1-thrown',
          effect: {
            scaling: {
              additive: [2],
            },
          },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'avywenna-t1-thunderlance-return',
          effect: {
            scaling: {
              additive: [
                {
                  key: 'avywenna-thunderlance',
                  target: 'self',
                  coefficient: 2,
                },
              ],
            },
          },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'avywenna-t1-thunderlance-ex-return',
          effect: {
            scaling: {
              additive: [
                {
                  key: 'avywenna-thunderlance-ex',
                  target: 'self',
                  coefficient: 2,
                },
              ],
            },
          },
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'avywenna-thunderlance',
          effect: {
            durationExtension: 20,
          },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'avywenna-thunderlance-ex',
          effect: {
            durationExtension: 20,
          },
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: 'will' },
          target: 'self',
          value: 15,
        },
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus', elements: 'electric' },
          target: 'self',
          value: 8,
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
          targetEffect: 'avywenna-thunderlance-return',
          effect: {
            multiplierScaling: {
              conditionalScaling: {
                condition: {
                  kind: 'enemyStatus',
                  status: { modifier: 'susceptibility', elements: 'electric' },
                },
                scaling: { multiplier: [1.15] },
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
          duration: 0.3,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [17, 18, 20, 21, 23, 25, 26, 28, 30, 32, 34, 37],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.23,
                },
              ],
            },
          ],
        },
        {
          duration: 0.5,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [22, 24, 26, 28, 30, 32, 34, 37, 39, 41, 45, 48],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.23,
                },
              ],
            },
          ],
        },
        {
          duration: 0.367,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 43, 46],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.23,
                },
              ],
            },
          ],
        },
        {
          duration: 0.767,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.17,
                },
                {
                  offset: 0.6,
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
              multiplier: [50, 55, 60, 65, 70, 75, 80, 85, 90, 96, 104, 113],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.8,
                  spRecovery: 19,
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
              element: 'electric',
              hits: [
                {
                  offset: 0,
                  effects: [
                    {
                      id: 'avywenna-battle-bridge',
                      kind: 'status',
                      target: 'self',
                      duration: 1,
                      hide: true,
                    },
                  ],
                },
              ],
            },
            {
              element: 'electric',
              multiplier: [67, 73, 80, 87, 93, 100, 107, 113, 120, 128, 138, 150],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.6,
                  stagger: 5,
                  effects: [
                    {
                      id: 'avywenna-thunderlance-return',
                      kind: 'damageHit',
                      element: 'electric',
                      multiplier: 0,
                      multiplierScaling: {
                        additive: [
                          {
                            key: 'avywenna-thunderlance',
                            target: 'self',
                            coefficient: [75, 82, 90, 97, 104, 112, 119, 127, 134, 144, 155, 168],
                          },
                          {
                            key: 'avywenna-thunderlance-ex',
                            target: 'self',
                            coefficient: [
                              192, 211, 230, 250, 269, 288, 307, 326, 346, 370, 398, 432,
                            ],
                          },
                        ],
                      },
                      staggerScaling: {
                        additive: [
                          { key: 'avywenna-thunderlance', target: 'self', coefficient: 5 },
                          { key: 'avywenna-thunderlance-ex', target: 'self', coefficient: 10 },
                        ],
                      },
                      readConsumedStacks: {
                        statusKey: 'avywenna-battle-bridge',
                        target: 'self',
                      },
                      condition: {
                        kind: 'operatorStatus',
                        status: ['avywenna-thunderlance', 'avywenna-thunderlance-ex'],
                      },
                    },
                    {
                      kind: 'infliction',
                      element: 'electric',
                      stacks: 'fromConsume',
                      condition: {
                        kind: 'operatorStatus',
                        status: 'avywenna-thunderlance-ex',
                        consume: true,
                      },
                    },
                    {
                      kind: 'consume',
                      operatorStatus: 'avywenna-thunderlance',
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
      segments: [
        {
          duration: 0.7,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [169, 186, 203, 219, 236, 253, 270, 287, 304, 325, 350, 380],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.47,
                  stagger: 10,
                  effects: [
                    {
                      id: 'avywenna-thunderlance',
                      name: 'thunderlance',
                      kind: 'status',
                      target: 'self',
                      stacks: 3,
                      maxStacks: 99,
                      duration: 30,
                      icon: '/operators/avywenna/combo.webp',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 12],
    },
    ultimate: {
      segments: [
        {
          duration: 1.9,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [422, 464, 507, 549, 591, 633, 675, 718, 760, 813, 876, 950],
              multiplierMode: 'split',
              hits: [
                {
                  id: 'avywenna-ultimate-hit',
                  offset: 1.7,
                  stagger: [15, 15, 15, 15, 15, 15, 15, 15, 15, 20, 20, 20],
                  effects: [
                    {
                      id: 'avywenna-thunderlance-ex',
                      name: 'thunderlanceEx',
                      kind: 'status',
                      target: 'self',
                      maxStacks: 99,
                      duration: 30,
                      icon: '/operators/avywenna/ultimate.webp',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 100,
      animationTime: 1.53,
      cooldown: 10,
    },
  },
};

export default sheet;
