import type {
  WeaponSheet,
  Effect,
  ArtsReaction,
  DamageElement,
  TriggerEffect,
} from '../../../types';

const REACTION_ELEMENT: Record<ArtsReaction, DamageElement> = {
  solidification: 'cryo',
  electrification: 'electric',
  corrosion: 'nature',
  combustion: 'heat',
};

const COOLDOWN_TRACKER: Effect = {
  id: 'clannibal-cooldown-tracker',
  kind: 'status',
  target: 'self',
  duration: 25,
  ignoreTimeShift: true,
  hide: true,
  condition: {
    kind: 'not',
    condition: {
      kind: 'operatorStatus',
      status: 'clannibal-cooldown-tracker',
    },
  },
};

const SKILL3_TRIGGERS: TriggerEffect[] = Object.keys(REACTION_ELEMENT).map(reaction => ({
  trigger: {
    kind: 'onStatusConsumed' as const,
    status: reaction,
    target: 'enemy' as const,
  },
  effects: [
    {
      kind: 'status' as const,
      stat: {
        modifier: 'increasedDmgTaken' as const,
        elements: REACTION_ELEMENT[reaction as ArtsReaction],
      },
      value: [10, 12, 14, 16, 18, 20, 22, 24, 28],
      duration: 15,
      condition: {
        kind: 'not',
        condition: {
          kind: 'operatorStatus',
          status: 'clannibal-cooldown-tracker',
        },
      },
    },
    COOLDOWN_TRACKER,
  ],
}));

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'handcannon',
  icon: '/weapons/handcannon/wpn_handcannon_0009.webp',
  baseAtk: [50, 144, 243, 342, 441, 490],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'main' },
        target: 'self',
        value: [17, 30, 44, 57, 71, 85, 98, 112, 132],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: ['heat', 'cryo', 'electric', 'nature'] },
        target: 'self',
        value: [
          5.5555556, 10, 14.444445, 18.888889, 23.333333, 27.77778, 32.222223, 36.666667, 43.333334,
        ],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: ['heat', 'cryo', 'electric', 'nature'] },
        target: 'self',
        value: [12, 14.4, 16.8, 19.2, 21.6, 24, 26.4, 28.8, 33.6],
      },
    ],
    triggers: SKILL3_TRIGGERS,
  },
};

export default sheet;
