import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'arts-unit',
  icon: '/weapons/arts-unit/wpn_artsunit_0016.webp',
  baseAtk: [51, 148, 250, 352, 454, 505],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [20, 36, 52, 68, 84, 100, 116, 132, 156],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [6, 10.7, 15.5, 20.2, 25, 29.8, 34.5, 39.3, 46.4],
      },
    ],
  },
  skill3: {},
  forms: {
    selector: { kind: 'attributeCompare', left: 'intellect', right: 'will' },
    forms: [
      {
        key: 'int',
        skill3: {
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'atkPercent' },
              target: 'self',
              value: [16, 19.2, 22.4, 25.6, 28.8, 32, 35.2, 38.4, 44.8],
            },
          ],
          triggers: [
            {
              trigger: {
                kind: 'onStatusApplied',
                status: [
                  'cryoInfliction',
                  'electricInfliction',
                  'natureInfliction',
                  'heatInfliction',
                ],
                target: 'enemy',
              },
              effects: [
                {
                  kind: 'status',
                  stat: { modifier: 'dmgBonus' },
                  target: 'self',
                  value: [20, 24, 28, 32, 36, 40, 44, 48, 56],
                  duration: 20,
                },
              ],
            },
            {
              trigger: {
                kind: 'onStatusApplied',
                status: { modifier: 'susceptibility' },
                target: 'enemy',
              },
              effects: [
                {
                  kind: 'status',
                  stat: { modifier: 'atkPercent' },
                  target: 'self',
                  value: [20, 24, 28, 32, 36, 40, 44, 48, 56],
                  duration: 20,
                },
              ],
            },
          ],
        },
      },
      {
        key: 'will',
        skill3: {
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'atkPercent' },
              target: 'self',
              value: [16, 19.2, 22.4, 25.6, 28.8, 32, 35.2, 38.4, 44.8],
            },
          ],
          triggers: [
            {
              trigger: {
                kind: 'onStatusApplied',
                status: ['cryoBurst', 'electricBurst', 'natureBurst', 'heatBurst'],
                target: 'enemy',
              },
              effects: [
                {
                  id: 'type-42-solemn-phalanx-increasedDmgTaken',
                  kind: 'status',
                  stat: {
                    modifier: 'increasedDmgTaken',
                    elements: ['cryo', 'electric', 'nature', 'heat'],
                  },
                  target: 'enemy',
                  value: [6, 7.2, 8.4, 9.6, 10.8, 12, 13.2, 14.4, 16.8],
                  duration: 20,
                },
              ],
            },
            {
              trigger: {
                kind: 'onStatusApplied',
                status: { modifier: 'susceptibility' },
                target: 'enemy',
              },
              effects: [
                {
                  id: 'type-42-solemn-phalanx-increasedDmgTaken',
                  kind: 'status',
                  stat: {
                    modifier: 'increasedDmgTaken',
                    elements: ['cryo', 'electric', 'nature', 'heat'],
                  },
                  target: 'enemy',
                  value: [6, 7.2, 8.4, 9.6, 10.8, 12, 13.2, 14.4, 16.8],
                  duration: 20,
                },
              ],
            },
          ],
        },
      },
    ],
  },
};

export default sheet;
