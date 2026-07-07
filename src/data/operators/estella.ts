import type { OperatorSheet } from '../types';
import { CRYO_INFLICTION_IMMUNE_ID } from '../contingencyContracts/criteriaEffects';

const sheet: OperatorSheet = {
  gameId: 'ESTELLA',
  rarity: 4,
  weapon: 'polearm',
  element: 'cryo',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'guard',
  mainAttribute: 'will',
  subAttribute: 'strength',
  attributes: {
    Strength: [13, 32, 53, 73, 94, 104],
    Agility: [8, 27, 47, 67, 87, 97],
    Intellect: [14, 34, 56, 78, 99, 110],
    Will: [15, 44, 74, 105, 136, 151],
    'Base ATK': [30, 90, 153, 217, 280, 312],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      triggers: [
        {
          trigger: { kind: 'onStatusApplied', status: 'shatter', target: 'enemy' },
          effects: [
            {
              id: 'estella-t1-tracker',
              kind: 'status',
              target: 'self',
              duration: 999,
              hide: true,
            },
          ],
        },
        {
          trigger: { kind: 'onActionStart', skillTypes: 'battleSkill' },
          effects: [
            {
              kind: 'spReturn',
              value: [7.5, 15],
              condition: {
                kind: 'operatorStatus',
                status: 'estella-t1-tracker',
                consume: true,
              },
            },
          ],
        },
      ],
    },
    {
      // Talent 2 — Ignores Cryo Infliction: a hidden passive marker that makes Heat Loss's Cryo
      // skip Estella while she's the controlled operator (so she never builds Cryo / Freezes).
      // The inert attributeFlat:0 stat is only there so the marker flows into the sim as a runtime
      // status (the initial-effect builder drops statuses without a stat).
      levels: 2,
      effects: [
        {
          id: CRYO_INFLICTION_IMMUNE_ID,
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: 'strength' },
          value: 0,
          target: 'self',
          hide: true,
        },
      ],
    },
  ],
  potentials: [
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'estella-combo-physical-susceptibility',
          effect: {
            durationExtension: 3,
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
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus', skillTypes: 'battleSkill' },
          target: 'self',
          value: 40,
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: ['will', 'strength'] },
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
            status: 'solidification',
            target: 'enemy',
            triggerScope: 'global',
          },
          effects: [
            {
              kind: 'ultEnergyGain',
              target: 'owner',
              value: 5,
              icd: 1,
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
          duration: 0.467,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56],
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
          duration: 0.567,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [30, 33, 36, 39, 42, 45, 48, 51, 54, 58, 62, 68],
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
          duration: 0.967,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [35, 39, 42, 46, 49, 53, 56, 60, 63, 67, 73, 79],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.23,
                },
                {
                  offset: 0.6,
                },
              ],
            },
          ],
        },
        {
          duration: 1.567,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [40, 44, 48, 52, 56, 60, 64, 68, 72, 77, 83, 90],
              multiplierMode: 'split',
              hits: [
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
          duration: 1.5,
          damageGroups: [
            {
              element: 'cryo',
              multiplier: [156, 171, 187, 202, 218, 234, 249, 265, 280, 300, 323, 350],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.7,
                  stagger: 10,
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
          duration: 0.67,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [160, 176, 192, 208, 224, 240, 256, 272, 288, 308, 332, 360],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.63,
                  stagger: 10,
                  effects: [{ kind: 'physicalStatus', physicalType: 'lift', forced: true }],
                },
              ],
              condition: {
                kind: 'not',
                condition: { kind: 'enemyStatus', status: 'solidification' },
              },
            },
            {
              element: 'physical',
              multiplier: [280, 308, 336, 364, 392, 420, 448, 476, 504, 539, 581, 630],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.63,
                  stagger: 10,
                  effects: [
                    { kind: 'physicalStatus', physicalType: 'lift', forced: true },
                    {
                      id: 'estella-combo-physical-susceptibility',
                      kind: 'status',
                      stat: { modifier: 'susceptibility', elements: 'physical' },
                      value: [10, 10, 10, 10, 10, 10, 10, 10, 10, 15, 15, 15],
                      duration: 6,
                    },
                  ],
                },
              ],
              condition: {
                kind: 'enemyStatus',
                status: 'solidification',
              },
            },
          ],
        },
      ],
      cooldown: [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 17],
    },
    ultimate: {
      segments: [
        {
          duration: 2,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [489, 538, 586, 635, 684, 733, 782, 831, 880, 941, 1014, 1100],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.8,
                  stagger: [15, 15, 15, 15, 15, 15, 15, 15, 15, 20, 20, 20],
                  effects: [
                    {
                      kind: 'physicalStatus',
                      physicalType: 'lift',
                      forced: true,
                      condition: {
                        kind: 'enemyStatus',
                        status: { modifier: 'susceptibility', elements: 'physical' },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 70,
      animationTime: 1.8,
      cooldown: 10,
    },
  },
};

export default sheet;
