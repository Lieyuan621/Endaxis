import type { OperatorSheet } from '../types';

const sheet: OperatorSheet = {
  gameId: 'EMBER',
  rarity: 6,
  weapon: 'greatsword',
  element: 'heat',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'defender',
  mainAttribute: 'strength',
  subAttribute: 'will',
  attributes: {
    Strength: [21, 54, 89, 124, 159, 176],
    Agility: [9, 28, 47, 67, 87, 96],
    Intellect: [8, 25, 42, 60, 77, 86],
    Will: [13, 36, 60, 84, 108, 120],
    'Base ATK': [30, 93, 159, 225, 291, 323],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      triggers: [
        {
          trigger: { kind: 'duringAction', skillTypes: ['battleSkill', 'comboSkill'] },
          effects: [
            {
              id: 'ember-t1',
              kind: 'status',
              stat: { modifier: 'protection' },
              target: 'self',
            },
          ],
        },
      ],
    },
    {
      levels: 2,
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'atkPercent' },
          target: 'self',
          value: [6 * 3, 9 * 3],
        },
      ],
    },
  ],
  potentials: [
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'ember-t1',
          effect: {
            durationExtension: 1.5,
          },
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: ['strength', 'will'] },
          target: 'self',
          value: 20,
        },
      ],
    },
    {}, // p3
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
          kind: 'patchHit',
          targetHit: 'ember-ultimate-hit',
          hit: {
            effects: [
              {
                kind: 'status',
                stat: { modifier: 'atkPercent' },
                target: 'team',
                value: 10,
              },
            ],
          },
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
              element: 'physical',
              multiplier: [38, 42, 46, 50, 54, 57, 61, 65, 69, 74, 79, 86],
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
          duration: 0.63,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [54, 59, 64, 70, 75, 80, 86, 91, 96, 103, 111, 120],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.2,
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
              multiplier: [66, 73, 80, 86, 93, 99, 106, 113, 119, 128, 138, 149],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.6,
                },
              ],
            },
          ],
        },
        {
          duration: 1.767,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [82, 90, 98, 106, 114, 122, 131, 139, 147, 157, 169, 184],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.87,
                  spRecovery: 28,
                  stagger: 25,
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
          duration: 1.7,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [173, 191, 208, 225, 243, 260, 277, 295, 312, 334, 360, 390],
              multiplierMode: 'split',
              hits: [
                {
                  id: 'ember-ultimate-hit',
                  offset: 1.27,
                  stagger: 20,
                  effects: [{ kind: 'physicalStatus', physicalType: 'knockdown' }],
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
              multiplier: [102, 112, 122, 133, 143, 153, 163, 173, 184, 196, 212, 230],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.87,
                  stagger: 10,
                  effects: [
                    { kind: 'physicalStatus', physicalType: 'knockdown' },
                    {
                      kind: 'status',
                      stat: { modifier: 'heal' },
                      target: 'self',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 18],
    },
    ultimate: {
      segments: [
        {
          duration: 1.67,
          damageGroups: [
            {
              element: 'heat',
              multiplier: [289, 318, 347, 376, 404, 433, 462, 491, 520, 556, 599, 650],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.67,
                  stagger: 25,
                  effects: [
                    {
                      kind: 'status',
                      id: 'shield',
                      target: 'team',
                      duration: 10,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 100,
      animationTime: 1.63,
      cooldown: 20,
    },
  },
};

export default sheet;
