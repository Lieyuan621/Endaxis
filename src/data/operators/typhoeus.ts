import type { Effect, OperatorSheet, SkillRequisite, StatusEffect } from '../types';

const sheet: OperatorSheet = {
  gameId: 'TYPHOEUS',
  rarity: 6,
  weapon: 'arts-unit',
  element: 'nature',
  finisherElement: 'nature',
  diveElement: 'nature',
  class: 'striker',
  mainAttribute: 'agility',
  subAttribute: 'will',
  attributes: {
    Strength: [9.9, 28.7, 48.49, 68.29, 88.08, 97.98],
    Agility: [21.96, 54.61, 88.99, 123.36, 157.74, 174.92],
    Intellect: [10.0, 29.0, 49.0, 69.0, 89.0, 99.0],
    Will: [14.97, 37.24, 60.68, 84.12, 107.56, 119.27],
    'Base ATK': [30.0, 90.0, 153.0, 217.0, 280.0, 312.0],
    'Base HP': [500.0, 1566.33, 2688.78, 3811.22, 4933.67, 5494.9],
  },
  talents: [
    {
      levels: 2,
      triggers: [],
    },
    {
      levels: 2,
    },
  ],
  potentials: [
    {},
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
          stat: { modifier: 'artsIntensity' },
          target: 'self',
          value: 16,
        },
      ],
    },
    {},
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
    {},
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.367,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [16, 18, 19, 21, 22, 24, 26, 27, 29, 31, 33, 36],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.2,
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
          duration: 1.73,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [62, 68, 75, 81, 87, 93, 99, 106, 112, 120, 129, 140],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.73,
                  stagger: 10,
                },
              ],
            },
          ],
        },
      ],
    },
    comboSkill: {
      comboWindow: {
        triggers: [],
        duration: 5,
      },
      segments: [
        {
          duration: 1.37,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [240, 264, 288, 312, 336, 360, 384, 408, 432, 462, 498, 540],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.67,
                  stagger: 10,
                },
              ],
            },
          ],
        },
      ],
      cooldown: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 19],
    },
    ultimate: {
      element: 'nature',
      segments: [
        {
          duration: 2.37,
          damageGroups: [],
        },
      ],
      ultimateEnergyCost: 300,
      animationTime: 2.07,
      cooldown: 10,
    },
  },
};

export default sheet;
