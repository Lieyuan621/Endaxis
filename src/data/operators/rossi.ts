import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'ROSSI',
  rarity: 6,
  weapon: 'sword',
  element: 'physical',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'guard',
  mainAttribute: 'agility',
  subAttribute: 'intellect',
  attributes: {
    Strength: [9, 28, 48, 68, 88, 97],
    Agility: [23, 55, 90, 124, 159, 176],
    Intellect: [14, 36, 59, 83, 106, 118],
    Will: [9, 26, 44, 62, 80, 89],
    'Base ATK': [30, 93, 159, 225, 291, 323],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'rossi-wolven-ambrage-first-hit',
          hit: {
            effects: [
              {
                id: 'razorClawmark',
                name: 'razorClawmark',
                kind: 'damageOverTime',
                element: 'physical',
                multiplier: [25, 30],
                multiplierMode: 'each',
                interval: 1,
                duration: [15, 25],
                snapshot: true,
                cancelOnRefresh: true,
                icon: '/operators/rossi/icon_battle_buff_wulfa_blood.webp',
              },
              {
                id: 'rossi-razor-clawmark',
                kind: 'status',
                stat: { modifier: 'increasedDmgTaken', elements: ['physical', 'heat'] },
                target: 'enemy',
                value: [6, 12],
                duration: [15, 25],
                hide: true,
              },
            ],
          },
        },
      ],
    },
    {
      levels: 2,
      triggers: [
        {
          trigger: {
            kind: 'onHit',
            skillTypes: ['battleSkill', 'comboSkill', 'ultimate'],
          },
          effects: [
            {
              id: 'rossi-talent-2',
              kind: 'damageHit',
              element: 'heat',
              multiplier: [12, 24],
              multiplierScaling: {
                conditionalScaling: {
                  scaling: {
                    multiplier: [1.5],
                  },
                  condition: {
                    kind: 'enemyStatus',
                    status: 'combustion',
                  },
                },
              },
              scaleByCrit: true,
              condition: {
                kind: 'enemyStatus',
                status: 'rossi-razor-clawmark',
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
          stat: { modifier: 'directMultiplier', skillTypes: ['battleSkill', 'comboSkill'] },
          target: 'self',
          value: 1.15,
        },
      ],
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'rossi-wolven-ambrage-first-hit',
          hit: {
            spReturn: 10,
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
          targetEffect: 'rossi-talent-2',
          effect: {
            multiplierScaling: {
              additive: [8],
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
          stat: { modifier: 'directMultiplier', skillTypes: ['ultimate'] },
          target: 'self',
          value: 1.1,
        },
      ],
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'rossi-ultimate-crit-dmg',
          effect: {
            scaling: {
              additive: [30],
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
          duration: 0.53,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [27, 30, 32, 35, 38, 41, 43, 46, 49, 52, 56, 61],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.27,
                },
              ],
            },
          ],
        },
        {
          duration: 0.7,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [32, 35, 38, 41, 44, 47, 50, 54, 57, 61, 65, 71],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.03,
                },
                {
                  offset: 0.23,
                },
              ],
            },
          ],
        },
        {
          duration: 0.87,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [34, 37, 41, 44, 48, 51, 54, 58, 61, 65, 71, 77],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.03,
                },
                {
                  offset: 0.13,
                },
              ],
            },
          ],
        },
        {
          duration: 1.03,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [41, 45, 49, 53, 57, 61, 65, 69, 73, 78, 84, 91],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.2,
                },
                {
                  offset: 0.23,
                },
                {
                  offset: 0.26,
                },
                {
                  offset: 0.43,
                },
                {
                  offset: 0.46,
                },
              ],
            },
          ],
        },
        {
          duration: 1.03,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [50, 55, 60, 65, 70, 75, 80, 85, 90, 96, 104, 113],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.5,
                  stagger: 18,
                  spRecovery: 21,
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
          duration: 1.183,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [85, 94, 102, 111, 119, 128, 137, 145, 154, 164, 177, 192],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.533,
                },
                {
                  offset: 0.733,
                },
                {
                  offset: 1.167,
                  stagger: 5,
                  effects: [
                    {
                      id: 'rossi-battle-seq-2-trigger',
                      kind: 'status',
                      target: 'self',
                      duration: 2,
                      condition: {
                        kind: 'enemyStatus',
                        status: 'vulnerability',
                      },
                      hide: true,
                    },
                    {
                      kind: 'physicalStatus',
                      physicalType: 'lift',
                    },
                  ],
                },
              ],
            },
            {
              element: 'heat',
              multiplier: [128, 141, 153, 166, 179, 192, 204, 217, 230, 246, 265, 288],
              multiplierMode: 'split',
              hits: [
                {
                  id: 'rossi-wolven-ambrage-first-hit',
                  durationExtension: 1.383,
                  offset: 2.25,
                  stagger: 2.5,
                  effects: [
                    {
                      kind: 'ultEnergyGain',
                      target: 'self',
                      value: 10,
                    },
                  ],
                },
                {
                  offset: 2.283,
                  stagger: 2.5,
                },
                {
                  offset: 2.317,
                  stagger: 2.5,
                },
                {
                  offset: 2.35,
                  stagger: 2.5,
                  effects: [
                    {
                      kind: 'consume',
                      operatorStatus: 'rossi-battle-seq-2-trigger',
                    },
                  ],
                },
              ],
              condition: {
                kind: 'operatorStatus',
                status: 'rossi-battle-seq-2-trigger',
              },
            },
          ],
        },
      ],
    },
    comboSkill: {
      comboWindow: {
        // "当有敌人同时处于破防和法术附着状态时可以发动"
        // 实际上在有破防的情况下上法术附着，即便这个附着和之前的附着反应掉了变成异常也算
        triggers: [
          {
            trigger: {
              kind: 'onStatusApplied',
              status: 'vulnerability',
              target: 'enemy',
              triggerScope: 'global',
            },
            condition: {
              kind: 'enemyStatus',
              status: ['heatInfliction', 'cryoInfliction', 'electricInfliction', 'natureInfliction'],
            },
          },
          {
            trigger: {
              kind: 'onStatusApplied',
              status: ['heatInfliction', 'cryoInfliction', 'electricInfliction', 'natureInfliction'],
              target: 'enemy',
              triggerScope: 'global',
            },
            condition: {
              kind: 'enemyStatus',
              status: 'vulnerability',
            },
          },
        ],
        duration: 5,
      },
      ultimateEnergyGain: 10,
      segments: [
        {
          duration: 1.5,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [67, 73, 80, 87, 93, 100, 107, 113, 120, 128, 138, 150],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.417,
                },
                {
                  offset: 1.068,
                },
                {
                  offset: 1.35,
                },
                {
                  offset: 1.483,
                  effects: [
                    {
                      id: 'rossi-combo-perfect-timing-countdown',
                      kind: 'status',
                      target: 'self',
                      duration: 0.516,
                      hide: true,
                    },
                    {
                      // TODO 二段连携窗口，目前未将两个窗口和两段连携技对应起来
                      //  后续需要考虑如何对应起来，以及如何与完美连携窗口配合展示？
                      id: 'rossi-combo-window',
                      name: 'comboWindow',
                      kind: 'status',
                      target: 'owner',
                      duration: 5,
                      sourceGroup: 'operator',
                      hide: true,
                    }
                  ],
                },
                {
                  offset: 1.6,
                },
              ],
            },
          ],
        },
        {
          duration: 1.95,
          gap: 0.5,
          damageGroups: [
            {
              hits: [
                {
                  offset: 0,
                  effects: [
                    {
                      kind: 'cooldownReductionPercent',
                      skillTypes: 'comboSkill',
                      target: 'self',
                      value: 100,
                    },
                    {
                      id: 'rossi-combo-perfect-timing-satisfied',
                      kind: 'status',
                      target: 'self',
                      duration: 2,
                      condition: {
                        kind: 'operatorStatus',
                        status: 'rossi-combo-perfect-timing',
                        consume: true,
                      },
                      hide: true,
                    },
                    {
                      kind: 'status',
                      stat: { modifier: 'critRate' },
                      target: 'self',
                      value: [15, 15, 15, 17, 17, 17, 19, 19, 21, 21, 23, 25],
                      duration: 15,
                    },
                    {
                      kind: 'status',
                      stat: { modifier: 'critDmg' },
                      target: 'self',
                      value: [30, 30, 30, 34, 34, 34, 38, 38, 42, 42, 46, 50],
                      duration: 15,
                    },
                  ],
                },
              ],
            },
            {
              element: 'physical',
              multiplier: [133, 147, 160, 173, 187, 200, 213, 227, 240, 257, 277, 300],
              multiplierMode: 'split',
              multiplierScaling: {
                additive: [
                  {
                    key: 'cryoInfliction',
                    target: 'enemy',
                    coefficient: [80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180],
                  },
                  {
                    key: 'heatInfliction',
                    target: 'enemy',
                    coefficient: [80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180],
                  },
                  {
                    key: 'electricInfliction',
                    target: 'enemy',
                    coefficient: [80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180],
                  },
                  {
                    key: 'natureInfliction',
                    target: 'enemy',
                    coefficient: [80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180],
                  },
                ],
              },
              hits: [
                {
                  offset: 1.317,
                  stagger: 5,
                  effects: [
                    {
                      kind: 'physicalStatus',
                      physicalType: 'lift',
                      condition: {
                        kind: 'enemyStatus',
                        status: [
                          'cryoInfliction',
                          'heatInfliction',
                          'electricInfliction',
                          'natureInfliction',
                        ],
                      },
                    },
                    {
                      kind: 'physicalStatus',
                      physicalType: 'vulnerability',
                      condition: [
                        {
                          kind: 'enemyStatus',
                          status: [
                            'cryoInfliction',
                            'heatInfliction',
                            'electricInfliction',
                            'natureInfliction',
                          ],
                        },
                        {
                          kind: 'operatorStatus',
                          status: 'rossi-combo-perfect-timing-satisfied',
                        },
                      ],
                    },
                    {
                      kind: 'consume',
                      operatorStatus: 'rossi-combo-perfect-timing-satisfied',
                    },
                    {
                      kind: 'consume',
                      enemyStatus: 'cryoInfliction',
                    },
                    {
                      kind: 'consume',
                      enemyStatus: 'heatInfliction',
                    },
                    {
                      kind: 'consume',
                      enemyStatus: 'electricInfliction',
                    },
                    {
                      kind: 'consume',
                      enemyStatus: 'natureInfliction',
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
            status: 'rossi-combo-perfect-timing-countdown',
            target: 'self',
          },
          effects: [
            {
              id: 'rossi-combo-perfect-timing',
              name: 'perfectTiming',
              kind: 'status',
              target: 'self',
              duration: 2,
              icon: '/operators/rossi/avatar.webp',
            },
          ],
        },
      ],
      cooldown: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 14],
    },
    ultimate: {
      segments: [
        {
          duration: 4.883,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [275, 300, 325, 350, 375, 400, 425, 450, 475, 525, 550, 600],
              multiplierMode: 'split',
              tick: {
                offset: 2.117,
                duration: 1.583,
                hitCount: 25,
              },
            },
            {
              element: 'heat',
              multiplier: [111, 122, 133, 144, 156, 167, 178, 189, 200, 214, 231, 250],
              hits: [
                {
                  offset: 4.05,
                },
              ],
            },
            {
              element: 'heat',
              multiplier: [333, 367, 400, 433, 467, 500, 534, 567, 600, 642, 692, 750],
              hits: [
                {
                  offset: 4.35,
                  stagger: 25,
                  effects: [
                    {
                      kind: 'infliction',
                      element: 'heat',
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
            kind: 'duringAction',
            skillTypes: 'ultimate',
          },
          effects: [
            {
              id: 'rossi-ultimate-crit-dmg',
              kind: 'status',
              stat: { modifier: 'critDmg', skillTypes: 'ultimate' },
              value: 60,
              hide: true,
            },
          ],
        },
      ],
      ultimateEnergyCost: 110,
      animationTime: 1.917,
      cooldown: 10,
    },
  },
};

export default sheet;
