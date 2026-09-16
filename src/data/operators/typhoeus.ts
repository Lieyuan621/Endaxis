import type { Effect, OperatorSheet } from '../types';

const COMBO_SKILL_ICON = '/operators/typhoeus/combo.webp';

const HUNTING_ARROW_EFFECT: Effect = {
  id: 'typhoeus-hunting-arrow',
  name: 'huntingArrow',
  kind: 'status',
  target: 'self',
  icon: '/operators/typhoeus/deco_char_passive_typhoea_arrow.webp',
  duration: 999,
  maxStacks: 4,
};

const SIGN_EFFECT: Effect = {
  id: 'typhoeus-sign',
  name: 'sign',
  kind: 'status',
  target: 'self',
  icon: '/operators/typhoeus/deco_char_passive_typhoea_point.webp',
  duration: 999,
  maxStacks: 8,
};

const HOVERING_EFFECT: Effect = {
  id: 'typhoeus-hovering',
  name: 'hovering',
  kind: 'status',
  target: 'self',
  duration: 1.683,
  hide: true,
};

const POWER_SHOT_BURST_MULTIPLIER = [
  1.1, 1.1, 1.1, 1.15, 1.15, 1.15, 1.2, 1.2, 1.2, 1.25, 1.25, 1.3,
];

const BATTLE_SKILL_BASE_EFFECTS: Effect[] = [
  HOVERING_EFFECT,
  {
    kind: 'ultEnergyGain',
    value: 12,
    condition: {
      kind: 'enemyStatus',
      status: 'natureInfliction',
    },
  },
  {
    ...SIGN_EFFECT,
    stacks: 1,
    condition: {
      kind: 'enemyStatus',
      status: 'natureInfliction',
      consume: 1,
    },
  },
];

const BATTLE_SKILL_EFFECTS: Effect[] = [
  ...BATTLE_SKILL_BASE_EFFECTS,
  {
    id: 'typhoeus-power-shot-burst',
    kind: 'burst',
    element: 'nature',
    condition: [
      {
        kind: 'operatorStatus',
        status: 'typhoeus-hunting-arrow',
        consume: 1,
      },
      {
        kind: 'not',
        condition: { kind: 'enemyStatus', status: 'natureInfliction' },
      },
    ],
  },
  {
    id: 'typhoeus-power-shot-burst',
    kind: 'burst',
    element: 'nature',
    scaling: { multiplier: [POWER_SHOT_BURST_MULTIPLIER] },
    condition: [
      {
        kind: 'operatorStatus',
        status: 'typhoeus-hunting-arrow',
        consume: 1,
      },
      { kind: 'enemyStatus', status: 'natureInfliction' },
    ],
  },
];

const BATTLE_SKILL_LAST_HIT_EFFECTS: Effect[] = [
  ...BATTLE_SKILL_BASE_EFFECTS,
  {
    id: 'typhoeus-power-shot-burst',
    kind: 'burst',
    element: 'nature',
    condition: {
      kind: 'not',
      condition: { kind: 'enemyStatus', status: 'natureInfliction' },
    },
  },
  {
    id: 'typhoeus-power-shot-burst',
    kind: 'burst',
    element: 'nature',
    scaling: { multiplier: [POWER_SHOT_BURST_MULTIPLIER] },
    condition: { kind: 'enemyStatus', status: 'natureInfliction' },
  },
];

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
      levels: 3,
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'directMultiplier', skillId: 'typhoeus-aerial-basic-attack' },
          target: 'self',
          value: [1.2, 1.4, 1.6],
          condition: {
            kind: 'operatorStatus',
            status: 'typhoeus-hunting-arrow',
          },
        },
      ],
      triggers: [
        {
          trigger: { kind: 'onBattleStart' },
          effects: [
            {
              ...SIGN_EFFECT,
              stacks: [1, 2, 4],
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusApplied',
            status: 'natureBurst',
            target: 'enemy',
            triggerScope: 'global',
          },
          effects: [
            {
              ...SIGN_EFFECT,
              stacks: 1,
              target: 'owner',
            },
          ],
        },
      ],
    },
    {
      // Huntress's Focus only affects incoming damage, interruption resistance, and its own
      // reactivation cooldown; none of those are modeled by the outgoing-damage simulator.
      levels: 2,
    },
  ],
  potentials: [
    {
      // The Protective Barrier cooldown reduction is intentionally omitted with Talent 2 above.
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'atkPercent' },
          target: 'self',
          value: 18,
          condition: {
            kind: 'operatorStatus',
            status: 'typhoeus-hovering',
          },
        },
        {
          kind: 'status',
          stat: { modifier: 'directMultiplier', skillId: 'typhoeus-aerial-basic-attack' },
          target: 'self',
          value: 1.2,
          condition: {
            kind: 'operatorStatus',
            status: 'typhoeus-hovering',
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
          stat: { modifier: 'artsIntensity' },
          target: 'self',
          value: 16,
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'cooldownReductionFlat', skillTypes: 'comboSkill' },
          target: 'self',
          value: 2,
        },
      ],
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'typhoeus-barrage-array-burst-dmg-taken',
          effect: { scaling: { additive: [6] } },
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
          stat: { modifier: 'directMultiplier', skillTypes: 'ultimate' },
          target: 'self',
          value: 1.2,
        },
      ],
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'typhoeus-power-shot-burst',
          effect: { scaling: { multiplier: [1.1] } },
        },
        {
          kind: 'appendEffect',
          targetEffect: 'typhoeus-hail-of-arrows',
          effect: {
            ...HUNTING_ARROW_EFFECT,
            stacks: 1,
          },
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.35,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 43, 46],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.233,
                },
                {
                  offset: 0.333,
                },
              ],
            },
          ],
        },
        {
          duration: 0.433,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [25, 28, 30, 33, 35, 38, 40, 43, 45, 48, 52, 56],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.317,
                },
              ],
            },
          ],
        },
        {
          duration: 0.717,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [38, 42, 46, 49, 53, 57, 61, 65, 68, 73, 79, 86],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.2,
                },
                {
                  offset: 0.517,
                },
              ],
            },
          ],
        },
        {
          duration: 0.9,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [42, 46, 50, 55, 59, 63, 67, 71, 76, 81, 87, 95],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.217,
                },
                {
                  offset: 0.583,
                },
                {
                  offset: 0.717,
                },
                {
                  offset: 0.817,
                },
                {
                  offset: 0.917,
                },
                {
                  offset: 1.05,
                },
              ],
            },
          ],
        },
        {
          duration: 1.35,
          damageGroups: [
            {
              element: 'nature',
              multiplier: [56, 61, 67, 72, 78, 83, 89, 94, 100, 107, 115, 125],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.75,
                  stagger: 17,
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
          name: 'typhoeus.hovering',
          duration: 0.85,
          damageGroups: [
            {
              hits: [{ offset: 0, effects: [HOVERING_EFFECT] }],
            },
            {
              element: 'nature',
              multiplier: [22, 25, 27, 29, 31, 33, 36, 38, 40, 43, 46, 50],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.167,
                },
                {
                  offset: 0.333,
                  effects: [HOVERING_EFFECT],
                },
              ],
            },
          ],
        },
        {
          name: 'typhoeus.aerialShot1',
          spCost: 0,
          duration: 0.633,
          damageGroups: [
            {
              id: 'typhoeus-aerial-basic-attack',
              element: 'nature',
              multiplier: [29, 32, 35, 37, 40, 43, 46, 49, 52, 55, 60, 65],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.083,
                  effects: BATTLE_SKILL_EFFECTS,
                },
              ],
              treatAsSkillType: 'basicAttack',
            },
          ],
        },
        {
          name: 'typhoeus.aerialShot2',
          spCost: 0,
          duration: 0.633,
          damageGroups: [
            {
              id: 'typhoeus-aerial-basic-attack',
              element: 'nature',
              multiplier: [29, 32, 35, 37, 40, 43, 46, 49, 52, 55, 60, 65],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.083,
                  effects: BATTLE_SKILL_EFFECTS,
                },
              ],
              treatAsSkillType: 'basicAttack',
            },
          ],
        },
        {
          name: 'typhoeus.aerialShot3',
          spCost: 0,
          duration: 0.633,
          damageGroups: [
            {
              id: 'typhoeus-aerial-basic-attack',
              element: 'nature',
              multiplier: [29, 32, 35, 37, 40, 43, 46, 49, 52, 55, 60, 65],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.083,
                  effects: BATTLE_SKILL_EFFECTS,
                },
              ],
              treatAsSkillType: 'basicAttack',
            },
          ],
        },
        {
          name: 'typhoeus.aerialShot4',
          spCost: 0,
          duration: 0.633,
          damageGroups: [
            {
              id: 'typhoeus-aerial-basic-attack',
              element: 'nature',
              multiplier: [29, 32, 35, 37, 40, 43, 46, 49, 52, 55, 60, 65],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.083,
                  effects: BATTLE_SKILL_EFFECTS,
                },
              ],
              treatAsSkillType: 'basicAttack',
            },
          ],
        },
        {
          name: 'typhoeus.aerialFinalStrike',
          spCost: 0,
          duration: 1.35,
          damageGroups: [
            {
              id: 'typhoeus-aerial-basic-attack',
              element: 'nature',
              multiplier: [44, 49, 53, 58, 62, 66, 71, 75, 80, 85, 92, 100],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.367,
                  stagger: 20,
                  spRecovery: 23,
                  effects: BATTLE_SKILL_LAST_HIT_EFFECTS,
                },
              ],
              treatAsSkillType: 'finalStrike',
            },
          ],
        },
      ],
      triggers: [
        {
          trigger: { kind: 'onBattleStart' },
          effects: [
            {
              ...HUNTING_ARROW_EFFECT,
              stacks: 4,
            },
          ],
        },
      ],
    },
    comboSkill: {
      icon: COMBO_SKILL_ICON,
      comboWindow: {
        triggers: [
          {
            trigger: {
              kind: 'onStatusApplied',
              status: 'typhoeus-sign',
              target: 'self',
            },
            condition: {
              kind: 'operatorStatus',
              status: 'typhoeus-sign',
              stacks: { compare: 'atLeast', count: 8 },
            },
          },
          {
            trigger: {
              kind: 'onHit',
              skillTypes: 'basicAttack',
            },
            condition: {
              kind: 'operatorStatus',
              status: 'typhoeus-sign',
              stacks: { compare: 'atLeast', count: 8 },
            },
          },
        ],
        duration: 5,
      },
      segments: [
        {
          duration: 2,
          damageGroups: [
            {
              hits: [
                {
                  offset: 0,
                  effects: [
                    {
                      ...HOVERING_EFFECT,
                      duration: 1.817,
                    },
                  ],
                },
              ],
            },
            {
              element: 'nature',
              multiplier: [89, 98, 107, 116, 125, 134, 142, 151, 160, 171, 185, 200],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.317,
                  stagger: 10,
                  effects: [
                    {
                      kind: 'ultEnergyGain',
                      value: 10,
                    },
                    {
                      ...HUNTING_ARROW_EFFECT,
                      stacks: 4,
                      condition: {
                        kind: 'operatorStatus',
                        status: 'typhoeus-sign',
                        stacks: {
                          compare: 'atLeast',
                          count: 8,
                        },
                        consume: true,
                      },
                    },
                  ],
                },
                {
                  offset: 1.517,
                  effects: [
                    {
                      id: 'typhoeus-barrage-array',
                      name: 'barrageArray',
                      kind: 'damageOverTime',
                      element: 'nature',
                      multiplier: [45, 49, 54, 58, 62, 67, 71, 76, 80, 86, 93, 100],
                      interval: 2,
                      duration: 6,
                      icon: COMBO_SKILL_ICON,
                      skipFirstTick: true,
                      snapshot: true,
                      cancelOnRefresh: true,
                      applyTiming: 'beforeDamage',
                    },
                    {
                      kind: 'status',
                      stat: { modifier: 'slowed' },
                      target: 'enemy',
                      value: 40,
                      duration: 6,
                      hide: true,
                    },
                    {
                      id: 'typhoeus-barrage-array-burst-dmg-taken',
                      name: 'barrageArray',
                      kind: 'status',
                      stat: {
                        modifier: 'increasedDmgTaken',
                        damageTypes: 'natureBurst',
                      },
                      target: 'enemy',
                      value: [6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 10],
                      duration: 6,
                      icon: COMBO_SKILL_ICON,
                      hide: true,
                    },
                  ],
                },
                {
                  offset: 1.617,
                },
                {
                  offset: 1.65,
                },
                {
                  offset: 1.683,
                },
                {
                  offset: 1.75,
                },
                {
                  offset: 1.817,
                  effects: [HOVERING_EFFECT],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [21, 21, 21, 21, 21, 21, 21, 21, 21, 20, 20, 19],
    },
    ultimate: {
      element: 'nature',
      segments: [
        {
          duration: 2.75,
          damageGroups: [
            {
              hits: [
                {
                  offset: 2,
                  effects: [
                    HOVERING_EFFECT,
                    {
                      ...HUNTING_ARROW_EFFECT,
                      stacks: 2,
                    },
                  ],
                },
              ],
            },
            {
              element: 'nature',
              multiplier: [133, 147, 160, 173, 187, 200, 213, 227, 240, 257, 277, 300],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 2.117,
                  stagger: 20,
                  effects: [
                    HOVERING_EFFECT,
                    {
                      id: 'typhoeus-hail-of-arrows',
                      kind: 'status',
                      target: 'self',
                      duration: 999,
                      stacks: 5,
                      maxStacks: 5,
                      hide: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 200,
      animationTime: 2,
      cooldown: 20,
      triggers: [
        {
          trigger: {
            kind: 'onHit',
            skillId: 'typhoeus-aerial-basic-attack',
          },
          effects: [
            {
              name: 'hailOfArrows',
              kind: 'damageHit',
              element: 'nature',
              multiplier: [33, 37, 40, 43, 47, 50, 53, 57, 60, 64, 69, 75],
              condition: {
                kind: 'operatorStatus',
                status: 'typhoeus-hail-of-arrows',
                stacks: {
                  compare: 'atLeast',
                  count: 2,
                },
                consume: 1,
              },
            },
            {
              name: 'hailOfArrows',
              kind: 'damageHit',
              element: 'nature',
              multiplier: [89, 98, 107, 116, 124, 133, 142, 151, 160, 171, 184, 200],
              condition: {
                kind: 'operatorStatus',
                status: 'typhoeus-hail-of-arrows',
                stacks: {
                  compare: 'exact',
                  count: 1,
                },
                consume: 1,
              },
            },
          ],
        },
      ],
    },
  },
};

export default sheet;
