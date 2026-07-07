import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'AKEKURI',
  rarity: 4,
  weapon: 'sword',
  element: 'heat',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'vanguard',
  mainAttribute: 'agility',
  subAttribute: 'intellect',
  attributes: {
    Strength: [13, 34, 55, 77, 99, 110],
    Agility: [15, 42, 70, 98, 126, 140],
    Intellect: [12, 32, 53, 75, 96, 106],
    Will: [9, 30, 52, 74, 96, 108],
    'Base ATK': [30, 92, 157, 222, 287, 319],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'spRecoveryPercent', skillTypes: 'comboSkill' },
          target: 'self',
          scaling: {
            additive: [{ basis: 'intellect', coefficient: [0.1, 0.15] }],
            cap: [50, 75],
          },
        },
      ],
    },
    {
      levels: 1,
      triggers: [
        {
          trigger: { kind: 'duringAction', skillTypes: 'ultimate' },
          effects: [
            {
              id: 'akekuri-t2',
              kind: 'status',
              stat: { modifier: 'link' },
              target: 'team',
            },
          ],
        },
      ],
    },
  ],
  potentials: [
    {
      triggers: [
        {
          trigger: { kind: 'onSpRecovery', skillTypes: ['battleSkill', 'comboSkill', 'ultimate'] },
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'atkPercent' },
              target: 'self',
              value: 10,
              maxStacks: 5,
              duration: 10,
            },
          ],
        },
      ],
    },
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
    {
      triggers: [
        {
          trigger: { kind: 'duringAction', skillTypes: 'ultimate' },
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'atkPercent' },
              target: 'team',
              value: 10,
            },
          ],
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
          targetEffect: 'akekuri-t2',
          effect: { durationExtension: 5 },
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.5,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [20, 22, 24, 26, 28, 30, 32, 34, 36, 39, 42, 45],
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
          duration: 0.767,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [28, 30, 33, 36, 39, 41, 44, 47, 50, 53, 57, 62],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.27,
                },
                {
                  offset: 0.53,
                },
              ],
            },
          ],
        },
        {
          duration: 0.733,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [33, 36, 39, 42, 46, 49, 52, 55, 59, 63, 67, 73],
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
          duration: 1.2,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [50, 54, 59, 64, 69, 74, 79, 84, 89, 95, 103, 111],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.63,
                },
                {
                  offset: 0.67,
                },
                {
                  offset: 0.7,
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
          duration: 1.33,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [142, 156, 171, 185, 199, 213, 228, 242, 256, 274, 295, 320],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.67,
                  stagger: 10,
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
    },
    comboSkill: {
      ultimateEnergyGain: 10,
      segments: [
        {
          duration: 1.27,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [80, 88, 96, 104, 112, 120, 128, 136, 144, 154, 166, 180],
              multiplierMode: 'each',
              hits: [
                {
                  offset: 0.73,
                  spRecovery: 7.5,
                  stagger: 5,
                },
                {
                  offset: 1.03,
                  spRecovery: 7.5,
                  stagger: 5,
                },
              ],
            },
          ],
        },
      ],
      cooldown: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 9],
    },
    ultimate: {
      segments: [
        {
          duration: 4.3,
          damageGroups: [
            {
              element: 'heat',
              hits: [
                {
                  offset: 1.683,
                  spRecovery: [58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80].map(x => x * 0.33),
                },
                {
                  offset: 3,
                  spRecovery: [58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80].map(x => x * 0.33),
                },
                {
                  offset: 4.3,
                  spRecovery: [58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80].map(x => x * 0.34),
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 120,
      animationTime: 1.683,
      cooldown: 20,
    },
  },
};

export default sheet;
