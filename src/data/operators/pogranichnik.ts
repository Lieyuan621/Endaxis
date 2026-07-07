// @ts-nocheck
import type { OperatorSheet, TriggerEvent } from '../types';

const STEEL_OATH_HARASS = {
  kind: 'damageHit' as const,
  element: 'physical' as const,
  multiplier: [45, 49, 53, 58, 62, 67, 71, 76, 80, 86, 92, 100],
  hit: { spRecovery: [7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 10, 10, 10] },
  condition: {
    kind: 'operatorStatus' as const,
    status: 'pogranichnik-steel-oath',
    stacks: { compare: 'atLeast' as const, count: 2 },
    consume: 1,
    consumeScope: 'team' as const,
  },
};

const STEEL_OATH_DECISIVE_ASSAULT = {
  kind: 'damageHit' as const,
  element: 'physical' as const,
  multiplier: [200, 220, 240, 260, 280, 300, 320, 340, 360, 385, 415, 450],
  hit: { spRecovery: [30, 30, 30, 30, 30, 30, 30, 30, 30, 40, 40, 40], stagger: 15 },
  condition: {
    kind: 'operatorStatus' as const,
    status: 'pogranichnik-steel-oath',
    stacks: { compare: 'exact' as const, count: 1 },
    consume: true,
    consumeScope: 'team' as const,
  },
};

const STEEL_OATH_TRIGGERS: TriggerEvent[] = [
  {
    kind: 'onStatusApplied',
    status: ['lift', 'knockdown', 'crush', 'breach'],
    target: 'enemy',
    triggerScope: 'global',
  },
  { kind: 'onHit', skillTypes: 'comboSkill' },
];

const STEEL_OATH_EFFECT_IDS: Record<string, { harass: string; decisiveAssault: string }> = {
  onStatusApplied: {
    harass: 'pogranichnik-physical-status-harass',
    decisiveAssault: 'pogranichnik-physical-status-decisive-assault',
  },
  onHit: {
    harass: 'pogranichnik-combo-harass',
    decisiveAssault: 'pogranichnik-combo-decisive-assault',
  },
};

const STEEL_OATH_ACTIVE_CONDITION = {
  kind: 'operatorStatus' as const,
  status: 'pogranichnik-steel-oath',
  stacks: { compare: 'atLeast' as const, count: 1 },
  consumeScope: 'team' as const,
};

const FERVENT_MORALE_MODIFIERS = ['atkPercent', 'artsIntensity'] as const;

const sheet: OperatorSheet = {
  gameId: 'POGRANICHNK',
  rarity: 6,
  weapon: 'sword',
  element: 'physical',
  finisherElement: 'physical',
  diveElement: 'physical',
  class: 'vanguard',
  mainAttribute: 'will',
  subAttribute: 'agility',
  attributes: {
    Strength: [12, 31, 51, 71, 91, 101],
    Agility: [13, 34, 55, 77, 99, 110],
    Intellect: [10, 28, 48, 67, 87, 97],
    Will: [20, 52, 87, 121, 156, 173],
    'Base ATK': [30, 92, 157, 223, 288, 321],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
      triggers: [
        {
          trigger: { kind: 'onSpRecovery', skillTypes: ['battleSkill', 'comboSkill', 'ultimate'] },
          effects: [
            {
              id: 'pogranichnik-sp-tracker',
              kind: 'status',
              target: 'self',
              stacks: 'fromConsume',
              maxStacks: 80,
              duration: 999,
              hide: true,
            },
          ],
        },
        {
          trigger: { kind: 'onStatusApplied', status: 'pogranichnik-sp-tracker', target: 'self' },
          effects: [
            ...FERVENT_MORALE_MODIFIERS.map(modifier => ({
              id: `pogranichnik-t1-${modifier}`,
              kind: 'status' as const,
              name: 'ferventMorale',
              stat: { modifier },
              target: 'self' as const,
              value: [4, 8],
              maxStacks: 3,
              duration: 20,
              stackStrategy: 'INDEPENDENT' as const,
              icd: 0.1,
              condition: {
                kind: 'operatorStatus' as const,
                status: 'pogranichnik-sp-tracker',
                stacks: { compare: 'exact' as const, count: 80 },
              },
              icon: 'operators/pogranichnik/icon_battle_pograni_talent_1.webp',
            })),
            {
              id: 'pogranichnik-t1-consume',
              kind: 'consume' as const,
              operatorStatus: 'pogranichnik-sp-tracker',
              condition: {
                kind: 'operatorStatus' as const,
                status: 'pogranichnik-sp-tracker',
                stacks: { compare: 'exact' as const, count: 80 },
              },
            },
          ],
        },
      ],
    },
    {
      levels: 2,
      patches: STEEL_OATH_TRIGGERS.flatMap(trigger => {
        const ids = STEEL_OATH_EFFECT_IDS[trigger.kind];
        return FERVENT_MORALE_MODIFIERS.map(modifier => ({
          kind: 'appendEffect' as const,
          targetEffect: ids.harass,
          effect: {
            kind: 'derived' as const,
            sourceEffect: `pogranichnik-t1-${modifier}`,
            effect: {
              duration: [5, 10],
              condition: STEEL_OATH_ACTIVE_CONDITION,
            },
          },
        }));
      }),
    },
  ],
  potentials: [
    {},
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: 'will' },
          target: 'self',
          value: 20,
        },
        {
          kind: 'status',
          stat: { modifier: 'dmgBonus', elements: 'physical' },
          target: 'self',
          value: 10,
        },
      ],
    },
    {
      effects: [],
      patches: [
        // SP tracker threshold: 80 → 60
        {
          kind: 'patchEffect',
          targetEffect: 'pogranichnik-sp-tracker',
          effect: { maxStacks: 60 },
        },
        // Fervent Morale condition threshold: 80 → 60
        ...FERVENT_MORALE_MODIFIERS.map(modifier => ({
          kind: 'patchEffect' as const,
          targetEffect: `pogranichnik-t1-${modifier}`,
          effect: {
            condition: {
              kind: 'operatorStatus' as const,
              status: 'pogranichnik-sp-tracker',
              stacks: { compare: 'exact' as const, count: 60 },
            },
          },
        })),
        // Consume condition threshold: 80 → 60
        {
          kind: 'patchEffect',
          targetEffect: 'pogranichnik-t1-consume',
          effect: {
            condition: {
              kind: 'operatorStatus',
              status: 'pogranichnik-sp-tracker',
              stacks: { compare: 'exact', count: 60 },
            },
          },
        },
        // Fervent Morale maxStacks on Pog: 3 → 5
        // Append zero-stack INDEPENDENT applies (cap registration) to every trigger source
        // that can grant Fervent Morale to Pog. max() in INDEPENDENT.apply ensures highest cap wins.
        // Other operators get maxStacks: 3 from T2's derived override; the cap-registration
        // targets scope:'self' so only the triggering operator (Pog when he triggers) gets it.
        // T1 sources (sp-tracker trigger) — no Steel Oath gate needed
        ...FERVENT_MORALE_MODIFIERS.map(modifier => `pogranichnik-t1-${modifier}`).flatMap(
          targetEffect =>
            FERVENT_MORALE_MODIFIERS.map(modifier => ({
              kind: 'appendEffect' as const,
              targetEffect,
              effect: {
                kind: 'derived' as const,
                sourceEffect: `pogranichnik-t1-${modifier}`,
                effect: {
                  stacks: 0,
                  maxStacks: 5,
                  target: 'owner' as const,
                  condition: undefined as undefined,
                },
              },
            })),
        ),
        // T2 sources (harass/decisive assault trigger effects) — gated by Steel Oath
        ...Object.values(STEEL_OATH_EFFECT_IDS)
          .flatMap(ids => [ids.harass, ids.decisiveAssault])
          .flatMap(targetEffect =>
            FERVENT_MORALE_MODIFIERS.map(modifier => ({
              kind: 'appendEffect' as const,
              targetEffect,
              effect: {
                kind: 'derived' as const,
                sourceEffect: `pogranichnik-t1-${modifier}`,
                effect: {
                  stacks: 0,
                  maxStacks: 5,
                  target: 'owner' as const,
                  condition: STEEL_OATH_ACTIVE_CONDITION,
                },
              },
            })),
          ),
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
          stat: { modifier: 'cooldownReductionFlat', skillTypes: 'comboSkill' },
          target: 'self',
          value: 2,
        },
        {
          kind: 'status',
          stat: { modifier: 'spRecoveryPercent', skillTypes: 'comboSkill' },
          target: 'self',
          value: 20,
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.43,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [23, 25, 28, 30, 32, 35, 37, 39, 41, 44, 48, 52],
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
          duration: 0.67,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [28, 31, 34, 36, 39, 42, 45, 48, 50, 54, 58, 63],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.23,
                },
                {
                  offset: 0.47,
                },
              ],
            },
          ],
        },
        {
          duration: 0.67,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [33, 36, 40, 43, 46, 50, 53, 56, 59, 64, 68, 74],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.3,
                },
                {
                  offset: 0.5,
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
              multiplier: [38, 42, 46, 50, 53, 57, 61, 65, 69, 73, 79, 86],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.1,
                },
                {
                  offset: 0.17,
                },
                {
                  offset: 0.23,
                },
                {
                  offset: 0.37,
                },
                {
                  offset: 0.43,
                },
                {
                  offset: 0.5,
                },
              ],
            },
          ],
        },
        {
          duration: 0.83,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [43, 47, 52, 56, 60, 65, 69, 73, 77, 83, 89, 97],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.53,
                  spRecovery: 20,
                  stagger: 18,
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
              element: 'physical',
              multiplier: [86, 94, 103, 111, 120, 128, 137, 145, 154, 165, 177, 192],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.93,
                  stagger: 5,
                },
              ],
            },
            {
              element: 'physical',
              multiplier: [106, 116, 127, 137, 148, 158, 169, 180, 190, 203, 219, 238],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.27,
                  stagger: 5,
                  effects: [
                    {
                      kind: 'spRecovery',
                      value: 5,
                      condition: {
                        kind: 'enemyStatus',
                        status: 'vulnerability',
                        stacks: { compare: 'exact', count: 1 },
                      },
                    },
                    {
                      kind: 'spRecovery',
                      value: [10, 10, 10, 10, 10, 10, 10, 10, 10, 15, 15, 15],
                      condition: {
                        kind: 'enemyStatus',
                        status: 'vulnerability',
                        stacks: { compare: 'exact', count: 2 },
                      },
                    },
                    {
                      kind: 'spRecovery',
                      value: [20, 20, 20, 20, 20, 20, 20, 20, 20, 25, 25, 25],
                      condition: {
                        kind: 'enemyStatus',
                        status: 'vulnerability',
                        stacks: { compare: 'exact', count: 3 },
                      },
                    },
                    {
                      kind: 'spRecovery',
                      value: [30, 30, 30, 30, 30, 30, 30, 30, 30, 35, 35, 35],
                      condition: {
                        kind: 'enemyStatus',
                        status: 'vulnerability',
                        stacks: { compare: 'exact', count: 4 },
                      },
                    },
                    { kind: 'physicalStatus', physicalType: 'breach' },
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
          duration: 1.83,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [42, 46, 50, 55, 59, 63, 67, 71, 76, 81, 87, 95],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.77,
                  spRecovery: 5,
                  stagger: 3,
                  effects: [
                    {
                      kind: 'consume',
                      operatorStatus: 'pogranichnik-combo-tracker',
                      condition: {
                        kind: 'operatorStatus',
                        status: 'pogranichnik-combo-tracker',
                        stacks: { compare: 'exact', count: 1 },
                      },
                    },
                  ],
                },
              ],
              condition: {
                kind: 'operatorStatus',
                status: 'pogranichnik-combo-tracker',
                stacks: { compare: 'atLeast', count: 1 },
              },
            },
            {
              element: 'physical',
              multiplier: [54, 59, 65, 70, 76, 81, 86, 92, 97, 104, 112, 122],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 1.37,
                  spRecovery: 7,
                  stagger: 3,
                  effects: [
                    {
                      kind: 'consume',
                      operatorStatus: 'pogranichnik-combo-tracker',
                      condition: {
                        kind: 'operatorStatus',
                        status: 'pogranichnik-combo-tracker',
                        stacks: { compare: 'exact', count: 2 },
                      },
                    },
                  ],
                },
              ],
              condition: {
                kind: 'operatorStatus',
                status: 'pogranichnik-combo-tracker',
                stacks: { compare: 'atLeast', count: 2 },
              },
            },
            {
              element: 'physical',
              multiplier: [66, 73, 79, 86, 92, 99, 106, 112, 119, 127, 137, 149],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 2.3,
                  durationExtension: 1.04,
                  spRecovery: 13,
                  stagger: 4,
                  effects: [
                    {
                      kind: 'consume',
                      operatorStatus: 'pogranichnik-combo-tracker',
                      condition: {
                        kind: 'operatorStatus',
                        status: 'pogranichnik-combo-tracker',
                        stacks: { compare: 'exact', count: 3 },
                      },
                    },
                  ],
                },
              ],
              condition: {
                kind: 'operatorStatus',
                status: 'pogranichnik-combo-tracker',
                stacks: { compare: 'exact', count: 3 },
              },
            },
            {
              element: 'physical',
              multiplier: [132, 145, 158, 172, 185, 198, 211, 224, 238, 254, 274, 297],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 2.3,
                  durationExtension: 1.04,
                  spRecovery: 23,
                  stagger: 9,
                  effects: [
                    {
                      kind: 'consume',
                      operatorStatus: 'pogranichnik-combo-tracker',
                      condition: {
                        kind: 'operatorStatus',
                        status: 'pogranichnik-combo-tracker',
                        stacks: { compare: 'exact', count: 4 },
                      },
                    },
                  ],
                },
              ],
              condition: {
                kind: 'operatorStatus',
                status: 'pogranichnik-combo-tracker',
                stacks: { compare: 'exact', count: 4 },
              },
            },
          ],
        },
      ],
      triggers: [
        {
          trigger: {
            kind: 'onStatusConsumed',
            status: 'vulnerability',
            target: 'enemy',
            triggerScope: 'global',
          },
          effects: [
            {
              id: 'pogranichnik-combo-tracker',
              kind: 'status',
              target: 'owner',
              stacks: 'fromConsume',
              maxStacks: 4,
              stackStrategy: 'REPLACE',
              duration: 999,
              hide: true,
            },
          ],
        },
      ],
      cooldown: [18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 17],
    },
    ultimate: {
      segments: [
        {
          duration: 3,
          damageGroups: [
            {
              element: 'physical',
              multiplier: [133, 147, 160, 173, 186, 200, 213, 226, 240, 256, 276, 300],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 2.47,
                  stagger: 10,
                  effects: [
                    {
                      id: 'pogranichnik-steel-oath',
                      kind: 'status',
                      name: 'steelOath',
                      target: 'team',
                      stacks: 5,
                      maxStacks: 5,
                      duration: 30,
                      icon: '/operators/pogranichnik/icon_battle_pograni_buff.webp',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      triggers: STEEL_OATH_TRIGGERS.map(trigger => ({
        trigger,
        effects: [
          { ...STEEL_OATH_HARASS, id: STEEL_OATH_EFFECT_IDS[trigger.kind].harass },
          {
            ...STEEL_OATH_DECISIVE_ASSAULT,
            id: STEEL_OATH_EFFECT_IDS[trigger.kind].decisiveAssault,
          },
        ],
      })),
      ultimateEnergyCost: 90,
      animationTime: 2.47,
      cooldown: 10,
    },
  },
};

export default sheet;
