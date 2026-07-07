// @ts-nocheck
import type { OperatorSheet, TriggerEffect, Effect, ArtsElement, PhysicalStatus } from '../types';

const INFLICTIONS = ['cryo', 'electric', 'nature', 'heat'];
const PHYSICAL_REACTIONS = ['lift', 'knockdown', 'crush', 'breach'];
const TRACKER_IDS = Object.fromEntries(
  [...INFLICTIONS, ...PHYSICAL_REACTIONS].map(x => [x, `antal-tracker-${x}`]),
);

const INFLICTION_AND_REACTION_TRACKER: TriggerEffect[] = [
  ...INFLICTIONS,
  ...PHYSICAL_REACTIONS,
].map(x => ({
  trigger: {
    kind: 'onStatusApplied' as const,
    status: `${x}${INFLICTIONS.includes(x) ? 'Infliction' : ''}`,
    target: 'enemy' as const,
    triggerScope: 'global' as const,
  },
  effects: [
    {
      id: TRACKER_IDS[x],
      kind: 'status' as const,
      target: 'owner' as const,
      duration: 6,
      hide: true,
    },
    ...[...INFLICTIONS, ...PHYSICAL_REACTIONS]
      .filter(y => x !== y)
      .map(y => ({
        kind: 'consume' as const,
        operatorStatus: TRACKER_IDS[y],
      })),
  ],
}));

const COMBO_SKILL_EFFECTS: Effect[] = [...INFLICTIONS, ...PHYSICAL_REACTIONS].map(x => ({
  ...(INFLICTIONS.includes(x)
    ? {
        kind: 'infliction' as const,
        element: x as ArtsElement,
      }
    : {
        kind: 'physicalStatus' as const,
        physicalType: x as PhysicalStatus,
      }),
  condition: {
    kind: 'operatorStatus',
    status: TRACKER_IDS[x],
    consume: true,
  },
}));

const sheet: OperatorSheet = {
  gameId: 'ANTAL',
  rarity: 4,
  weapon: 'arts-unit',
  element: 'electric',
  finisherElement: 'electric',
  diveElement: 'electric',
  class: 'supporter',
  mainAttribute: 'intellect',
  subAttribute: 'strength',
  attributes: {
    Strength: [15, 40, 65, 91, 116, 129],
    Agility: [9, 25, 43, 60, 78, 86],
    Intellect: [15, 47, 81, 114, 148, 165],
    Will: [9, 25, 41, 58, 74, 82],
    'Base ATK': [30, 87, 147, 207, 267, 297],
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
  potentials: [
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'antal-ultimate-electric-amp',
          effect: { scaling: { multiplier: [1.1] } },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'antal-ultimate-heat-amp',
          effect: { scaling: { multiplier: [1.1] } },
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
    {},
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: 'intellect' },
          target: 'self',
          value: 10,
        },
        {
          kind: 'status',
          stat: { modifier: 'hpPercent' },
          target: 'self',
          value: 10,
        },
      ],
    },
    {
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'antal-battle-focus',
          effect: {
            duration: 20,
          },
        },
      ],
      triggers: [
        {
          trigger: { kind: 'onStatusExpire', status: 'antal-battle-focus', target: 'enemy' },
          effects: [
            {
              kind: 'derived',
              sourceEffect: 'antal-battle-focus',
              effect: {
                duration: 40,
                scaling: {
                  additive: [4],
                },
                silent: true,
              },
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
          duration: 0.53,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [23, 25, 28, 30, 32, 35, 37, 39, 41, 44, 48, 52],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.267,
                },
              ],
            },
          ],
        },
        {
          duration: 0.7,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [28, 31, 34, 36, 39, 42, 45, 48, 50, 54, 58, 63],
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
          duration: 0.767,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [34, 37, 41, 44, 48, 51, 54, 58, 61, 65, 71, 77],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.467,
                },
                {
                  offset: 0.6,
                },
              ],
            },
          ],
        },
        {
          duration: 1.3,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [51, 56, 61, 66, 71, 77, 82, 87, 92, 98, 106, 115],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.9,
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
          duration: 1,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [89, 98, 107, 116, 124, 133, 142, 151, 160, 171, 185, 200],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.67,
                  effects: [
                    {
                      id: 'antal-battle-focus',
                      name: 'focus',
                      kind: 'status',
                      stat: { modifier: 'susceptibility', elements: ['electric', 'heat'] },
                      value: [5, 5, 6, 6, 7, 7, 8, 8, 8, 9, 9, 10],
                      duration: 60,
                      icon: '/operators/antal/icon_battle_antal_buff.webp',
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
              element: 'electric',
              multiplier: [151, 166, 181, 196, 211, 227, 242, 257, 272, 291, 313, 340],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.7,
                  stagger: 10,
                  effects: COMBO_SKILL_EFFECTS,
                },
              ],
            },
          ],
        },
      ],
      triggers: INFLICTION_AND_REACTION_TRACKER,
      cooldown: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 24],
    },
    ultimate: {
      segments: [
        {
          duration: 1.87,
          damageGroups: [
            {
              hits: [
                {
                  offset: 1.63,
                  effects: [
                    {
                      id: 'antal-ultimate-electric-amp',
                      kind: 'status',
                      stat: { modifier: 'ampBonus', elements: 'electric' },
                      target: 'team',
                      value: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20],
                      duration: 12,
                    },
                    {
                      id: 'antal-ultimate-heat-amp',
                      kind: 'status',
                      stat: { modifier: 'ampBonus', elements: 'heat' },
                      target: 'team',
                      value: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20],
                      duration: 12,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 100,
      animationTime: 1.4,
      cooldown: 20,
    },
  },
};

export default sheet;
