import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'FLUORITE',
  rarity: 4,
  weapon: 'handcannon',
  element: 'nature',
  finisherElement: 'nature',
  diveElement: 'nature',
  class: 'caster',
  mainAttribute: 'agility',
  subAttribute: 'intellect',
  attributes: {
    Strength: [14, 30, 47, 64, 81, 90],
    Agility: [14, 47, 81, 116, 150, 168],
    Intellect: [12, 34, 57, 80, 103, 114],
    Will: [10, 27, 45, 64, 82, 91],
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
          value: [10, 20],
          condition: {
            kind: 'enemyStatus',
            status: { modifier: 'slowed' },
          },
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
          stat: { modifier: 'attributeFlat', attribute: ['agility', 'intellect'] },
          target: 'self',
          value: 10,
        },
      ],
    },
    {},
    {
      patches: [
        {
          kind: 'patchHit',
          targetHit: 'fluorite-battle-explosive-expire-damage-hit',
          hit: {
            effects: [
              {
                kind: 'status',
                stat: { modifier: 'slowed' },
                target: 'enemy',
                duration: 6,
              },
            ],
          },
        },
        {
          kind: 'patchHit',
          targetHit: 'fluorite-battle-explosive-consumed-damage-hit',
          hit: {
            effects: [
              {
                kind: 'status',
                stat: { modifier: 'slowed' },
                target: 'enemy',
                duration: 6,
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
          value: 10,
        },
      ],
    },
    {
      triggers: [
        {
          trigger: {
            kind: 'onStatusApplied',
            status: ['cryoInfliction', 'natureInfliction'],
            target: 'enemy',
            triggerScope: 'global',
          },
          effects: [
            {
              kind: 'cooldownReductionFlat',
              skillTypes: 'comboSkill',
              target: 'owner',
              value: 1,
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
          duration: 0.767,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.43,
                },
              ],
            },
          ],
        },
        {
          duration: 0.53,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [33, 36, 39, 42, 46, 49, 52, 55, 59, 63, 67, 73],
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
          duration: 0.63,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [26, 28, 31, 33, 36, 38, 41, 43, 46, 49, 53, 57],
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
          duration: 1.767,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [60, 66, 72, 78, 84, 90, 96, 102, 108, 116, 125, 135],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.967,
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
          duration: 1.13,
          damageGroups: [
            {
              element: 'nature',
              hits: [
                {
                  offset: 1,
                  effects: [
                    {
                      id: 'fluorite-battle-improvised-explosive',
                      name: 'improvisedExplosive',
                      kind: 'status',
                      target: 'enemy',
                      duration: 3,
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
          target: 'enemy',
          stat: { modifier: 'slowed' },
          condition: {
            kind: 'enemyStatus',
            status: 'fluorite-battle-improvised-explosive',
          },
        },
      ],
      triggers: [
        {
          trigger: {
            kind: 'onStatusExpire',
            status: 'fluorite-battle-improvised-explosive',
            target: 'enemy',
          },
          effects: [
            {
              kind: 'damageHit',
              element: 'nature',
              multiplier: [187, 206, 224, 243, 262, 280, 299, 318, 336, 360, 388, 420],
              readConsumedStacks: {
                statusKey: 'fluorite-battle-improvised-explosive',
                target: 'enemy',
              },
              hit: {
                id: 'fluorite-battle-explosive-expire-damage-hit',
                stagger: 10,
                effects: [{ kind: 'infliction', element: 'nature' }],
              },
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusConsumed',
            status: 'fluorite-battle-improvised-explosive',
            target: 'enemy',
          },
          effects: [
            {
              kind: 'damageHit',
              element: 'nature',
              multiplier: [187, 206, 224, 243, 262, 280, 299, 318, 336, 360, 388, 420],
              readConsumedStacks: {
                statusKey: 'fluorite-battle-improvised-explosive',
                target: 'enemy',
              },
              hit: {
                id: 'fluorite-battle-explosive-consumed-damage-hit',
                stagger: 10,
                effects: [{ kind: 'infliction', element: 'nature' }],
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
          duration: 0.57,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [169, 186, 203, 220, 237, 254, 270, 287, 304, 325, 351, 380],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.5,
                  stagger: 10,
                  effects: [
                    {
                      kind: 'infliction',
                      element: 'cryo',
                      condition: {
                        kind: 'operatorStatus',
                        status: 'fluorite-combo-tracker-cryo',
                        consume: true,
                      },
                    },
                    {
                      kind: 'infliction',
                      element: 'nature',
                      condition: {
                        kind: 'operatorStatus',
                        status: 'fluorite-combo-tracker-nature',
                        consume: true,
                      },
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
            kind: 'onStatusApplied',
            status: 'cryoInfliction',
            target: 'enemy',
            triggerScope: 'global',
          },
          effects: [
            {
              id: 'fluorite-combo-tracker-cryo',
              kind: 'status',
              target: 'owner',
              duration: 6,
              condition: {
                kind: 'enemyStatus',
                status: 'cryoInfliction',
                stacks: { compare: 'atLeast', count: 2 },
              },
              hide: true,
            },
            {
              kind: 'consume',
              operatorStatus: 'fluorite-combo-tracker-nature',
              condition: {
                kind: 'enemyStatus',
                status: 'cryoInfliction',
                stacks: { compare: 'atLeast', count: 2 },
              },
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusApplied',
            status: 'natureInfliction',
            target: 'enemy',
            triggerScope: 'global',
          },
          effects: [
            {
              id: 'fluorite-combo-tracker-nature',
              kind: 'status',
              target: 'owner',
              duration: 6,
              condition: {
                kind: 'enemyStatus',
                status: 'natureInfliction',
                stacks: { compare: 'atLeast', count: 2 },
              },
              hide: true,
            },
            {
              kind: 'consume',
              operatorStatus: 'fluorite-combo-tracker-cryo',
              condition: {
                kind: 'enemyStatus',
                status: 'natureInfliction',
                stacks: { compare: 'atLeast', count: 2 },
              },
            },
          ],
        },
      ],
      cooldown: [40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 38],
    },
    ultimate: {
      segments: [
        {
          duration: 2.57,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [111, 122, 133, 144, 156, 167, 178, 189, 200, 214, 231, 250],
              multiplierMode: 'each',
              hits: [
                {
                  offset: 1.97,
                  effects: [
                    {
                      kind: 'consume',
                      enemyStatus: 'fluorite-battle-improvised-explosive',
                    },
                  ],
                },
                {
                  offset: 2.1,
                },
                {
                  offset: 2.23,
                },
                {
                  offset: 2.4,
                  stagger: 20,
                  effects: [
                    {
                      kind: 'infliction',
                      element: 'cryo',
                      condition: {
                        kind: 'enemyStatus',
                        status: 'cryoInfliction',
                        stacks: { compare: 'atLeast', count: 2 },
                      },
                    },
                    {
                      kind: 'infliction',
                      element: 'nature',
                      condition: {
                        kind: 'enemyStatus',
                        status: 'natureInfliction',
                        stacks: { compare: 'atLeast', count: 2 },
                      },
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
              kind: 'status',
              stat: { modifier: 'directMultiplier', skillTypes: 'battleSkill' },
              target: 'self',
              value: 1.3,
              hide: true,
            },
          ],
        },
      ],
      ultimateEnergyCost: 100,
      animationTime: 1.867,
      cooldown: 10,
    },
  },
};

export default sheet;
