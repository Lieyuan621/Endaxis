import type { EffectCondition, OperatorSheet } from '../types';

const STANCE_ACTIVE_CONDITION: EffectCondition = {
  kind: 'or',
  conditions: [
    { kind: 'operatorStatus', status: 'liino-vocalist-stance' },
    { kind: 'operatorStatus', status: 'liino-cosmovoice-stance' },
  ],
};

const sheet: OperatorSheet = {
  gameId: 'LIINO',
  rarity: 6,
  weapon: 'polearm',
  element: 'electric',
  finisherElement: 'electric',
  diveElement: 'electric',
  class: 'supporter',
  mainAttribute: 'will',
  subAttribute: 'agility',
  attributes: {
    Strength: [9, 26, 44, 62, 80, 89],
    Agility: [14, 37, 61, 85, 109, 121],
    Intellect: [9, 26, 45, 64, 82, 91],
    Will: [21, 55, 90, 125, 160, 177],
    'Base ATK': [30, 90, 152, 215, 277, 309],
    'Base HP': [500, 1566, 2689, 3811, 4934, 5495],
  },
  talents: [
    {
      levels: 2,
    },
    {
      levels: 2,
      triggers: [
        {
          trigger: {
            kind: 'onActionStart',
            skillTypes: 'comboSkill',
          },
          effects: [
            {
              id: 'liino-t2',
              kind: 'status',
              target: { scope: 'team', elements: ['electric', 'nature'] },
              duration: 30,
              hide: true,
            },
          ],
        },
        {
          trigger: {
            kind: 'onActionStart',
            skillTypes: 'battleSkill',
            skillId: 'battleSkill',
            triggerScope: 'global',
          },
          effects: [
            {
              kind: 'spReturn',
              value: [5, 10],
              condition: {
                kind: 'operatorStatus',
                status: 'liino-t2',
                consume: true,
                consumeTarget: 'team',
              },
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
          trigger: {
            kind: 'onBattleStart',
          },
          effects: [
            {
              id: 'liino-p1',
              kind: 'status',
              stat: { modifier: 'battleSkillSPCostReduction' },
              value: 100,
              duration: 1e9,
              target: 'self',
              hide: true,
              condition: {
                kind: 'not',
                condition: {
                  kind: 'operatorStatus',
                  status: 'liino-vocalist-stance',
                },
              },
            },
          ],
        },
        {
          trigger: {
            kind: 'onActionStart',
            skillTypes: 'battleSkill',
            skillId: 'battleSkill',
          },
          effects: [
            {
              kind: 'consume',
              operatorStatus: 'liino-p1',
            },
          ],
        },
      ],
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'liino-vocalist-stance',
          effect: {
            scaling: {
              additive: [6],
            },
          },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'liino-cosmovoice-stance',
          effect: {
            scaling: {
              additive: [6],
            },
          },
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'attributeFlat', attribute: 'will' },
          target: 'self',
          value: 20,
        },
      ],
    },
    {
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'cooldownReductionFlat', skillTypes: 'comboSkill' },
          target: 'self',
          value: 1,
        },
        {
          kind: 'status',
          stat: { modifier: 'directMultiplier', skillTypes: 'comboSkill' },
          target: 'self',
          value: 1.4,
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
      patches: [
        {
          kind: 'patchEffect',
          targetEffect: 'liino-ultimate-electric-amp',
          effect: { scaling: { multiplier: [1.2] } },
        },
        {
          kind: 'patchEffect',
          targetEffect: 'liino-ultimate-nature-amp',
          effect: { scaling: { multiplier: [1.2] } },
        },
      ],
      effects: [
        {
          kind: 'status',
          stat: { modifier: 'cooldownReductionFlat', skillTypes: 'comboSkill' },
          target: 'self',
          value: 1,
        },
        {
          kind: 'status',
          stat: { modifier: 'directMultiplier', skillTypes: ['battleSkill', 'ultimate'] },
          target: 'self',
          value: 1.2,
        },
      ],
    },
  ],
  combatSkills: {
    basicAttack: {
      segments: [
        {
          duration: 0.55,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [19, 21, 22, 24, 26, 28, 30, 32, 34, 36, 39, 42],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.1,
                },
                {
                  offset: 0.3167,
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
              multiplier: [27, 29, 32, 35, 37, 40, 43, 45, 48, 51, 56, 60],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.267,
                },
                {
                  offset: 0.333,
                },
                {
                  offset: 0.4,
                },
                {
                  offset: 0.467,
                },
                {
                  offset: 0.533,
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
              multiplier: [27, 29, 32, 35, 37, 40, 43, 45, 48, 51, 56, 60],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.417,
                },
                {
                  offset: 0.517,
                },
                {
                  offset: 0.567,
                },
                {
                  offset: 0.733,
                },
                {
                  offset: 0.883,
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
              multiplier: [36, 40, 43, 47, 50, 54, 58, 61, 65, 69, 75, 81],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.433,
                },
                {
                  offset: 0.483,
                },
                {
                  offset: 0.55,
                },
                {
                  offset: 0.6,
                },
                {
                  offset: 0.65,
                },
                {
                  offset: 0.717,
                },
                {
                  offset: 0.75,
                },
                {
                  offset: 0.817,
                },
              ],
            },
          ],
        },
        {
          duration: 1.15,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [45, 49, 53, 58, 62, 67, 71, 76, 80, 86, 92, 100],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.6,
                  stagger: 19,
                  spRecovery: 20,
                },
              ],
            },
          ],
        },
      ],
    },
    battleSkill: {
      spCost: 25,
      requisites: [
        {
          id: 'liino-battle-skill-no-stance',
          condition: { kind: 'not', condition: STANCE_ACTIVE_CONDITION },
          messageKey: 'actionItem.requisiteTitle.liinoUseStanceTermination',
        },
        {
          id: 'liino-battle-skill-cooldown-ready',
          condition: { kind: 'skillCooldownReady', cooldownKey: 'liino-battle-skill' },
          messageKey: 'actionItem.requisiteTitle.battleSkillOnCooldown',
        },
      ],
      segments: [
        {
          spCost: 25,
          duration: 0.7,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [107, 117, 128, 139, 149, 160, 170, 181, 192, 205, 221, 240],
              hits: [
                {
                  offset: 0.533,
                  stagger: 3,
                  effects: [
                    {
                      id: 'liino-vocalist-stance',
                      name: 'vocalistStance',
                      kind: 'status',
                      stat: { modifier: 'atkPercent' },
                      target: 'team',
                      value: [6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 10],
                      duration: 60,
                      icon: '/operators/liino/icon_battle_buff_liino_normalskill_music.png',
                    },
                    {
                      id: 'liino-battle-hit-countdown',
                      kind: 'status',
                      target: 'self',
                      duration: 10,
                      hide: true,
                    },
                    {
                      id: 'liino-battle-heal-countdown',
                      kind: 'status',
                      target: 'self',
                      duration: 3,
                      hide: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      subSkills: [
        {
          id: 'liino-stance-termination',
          group: 'nonSkill',
          name: 'stanceTermination',
          spCost: 0,
          ultimateEnergyGain: 0,
          requisites: [
            {
              id: 'liino-stance-termination-active',
              condition: STANCE_ACTIVE_CONDITION,
              messageKey: 'actionItem.requisiteTitle.liinoStanceTerminationOnly',
            },
          ],
          segments: [
            {
              duration: 0.2,
              damageGroups: [],
            },
          ],
        },
      ],
      triggers: [
        {
          trigger: {
            kind: 'onActionStart',
            skillId: 'liino-stance-termination',
          },
          effects: [
            {
              kind: 'skillCooldown',
              cooldownKey: 'liino-battle-skill',
              duration: 3,
              target: 'self',
              condition: { kind: 'operatorStatus', status: 'liino-vocalist-stance' },
            },
            {
              kind: 'consume',
              operatorStatus: ['liino-vocalist-stance', 'liino-cosmovoice-stance'],
              consumeTarget: 'team',
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusExpire',
            status: 'liino-battle-heal-countdown',
            target: 'self',
          },
          effects: [
            {
              kind: 'status',
              stat: { modifier: 'heal' },
              target: 'team',
              condition: { kind: 'operatorStatus', status: 'liino-vocalist-stance' },
            },
            {
              id: 'liino-battle-heal-countdown',
              kind: 'status',
              target: 'self',
              duration: 3,
              hide: true,
              condition: { kind: 'operatorStatus', status: 'liino-vocalist-stance' },
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusExpire',
            status: 'liino-battle-hit-countdown',
            target: 'self',
          },
          effects: [
            {
              kind: 'damageHit',
              element: 'electric',
              multiplier: [53, 59, 64, 69, 75, 80, 85, 91, 96, 103, 111, 120],
              condition: { kind: 'operatorStatus', status: 'liino-vocalist-stance' },
            },
            {
              id: 'liino-battle-hit-countdown',
              kind: 'status',
              target: 'self',
              duration: 10,
              hide: true,
              condition: { kind: 'operatorStatus', status: 'liino-vocalist-stance' },
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusExpire',
            status: 'liino-vocalist-stance',
            target: 'self',
          },
          effects: [
            {
              kind: 'consume',
              operatorStatus: 'liino-battle-hit-countdown',
            },
            {
              kind: 'consume',
              operatorStatus: 'liino-battle-heal-countdown',
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusConsumed',
            status: 'liino-vocalist-stance',
            target: 'self',
          },
          effects: [
            {
              kind: 'consume',
              operatorStatus: 'liino-battle-hit-countdown',
            },
            {
              kind: 'consume',
              operatorStatus: 'liino-battle-heal-countdown',
            },
          ],
        },
      ],
    },
    comboSkill: {
      comboWindow: {
        triggers: [
          {
            trigger: {
              kind: 'onStatusApplied',
              status: ['combustion', 'electrification', 'solidification', 'corrosion'],
              target: 'enemy',
              triggerScope: 'global',
            },
          },
          {
            trigger: {
              kind: 'onStatusConsumed',
              status: ['combustion', 'electrification', 'solidification', 'corrosion'],
              target: 'enemy',
              triggerScope: 'global',
            },
          },
        ],
        duration: 5,
      },
      ultimateEnergyGain: 20,
      segments: [
        {
          duration: 1.617,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [160, 176, 192, 208, 224, 240, 256, 272, 288, 308, 332, 360],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 0.3,
                },
                {
                  offset: 1.1,
                  stagger: 5,
                  effects: [
                    {
                      kind: 'status',
                      stat: { modifier: 'heal' },
                      target: 'controlled',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
      cooldown: [10, 10, 10, 10, 10, 10, 10, 10, 9, 9, 9, 8],
    },
    ultimate: {
      segments: [
        {
          duration: 4.37,
          damageGroups: [
            {
              element: 'electric',
              multiplier: [142, 156, 171, 185, 199, 213, 228, 242, 256, 274, 295, 320],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 2.6,
                  effects: [
                    {
                      id: 'liino-cosmovoice-stance',
                      name: 'cosmovoiceStance',
                      kind: 'status',
                      stat: { modifier: 'atkPercent' },
                      target: 'team',
                      value: 10,
                      duration: 15,
                      icon: '/operators/liino/icon_battle_buff_liino_ultskill_music.png',
                    },
                    {
                      id: 'liino-ultimate-hit-countdown',
                      kind: 'status',
                      target: 'self',
                      duration: 1.5,
                      hide: true,
                    },
                  ],
                },
                {
                  offset: 2.717,
                },
                {
                  offset: 3.183,
                },
                {
                  offset: 3.3,
                },
                {
                  offset: 3.417,
                },
                {
                  offset: 3.467,
                },
                {
                  offset: 3.483,
                },
                {
                  offset: 3.633,
                },
                {
                  offset: 3.65,
                },
                {
                  offset: 3.7,
                },
                {
                  offset: 3.75,
                },
                {
                  offset: 3.833,
                },
              ],
            },
            {
              element: 'electric',
              multiplier: [284, 313, 341, 370, 398, 427, 455, 483, 512, 547, 590, 640],
              multiplierMode: 'split',
              hits: [
                {
                  offset: 4.117,
                  stagger: 20,
                  effects: [{ kind: 'reaction', reactionType: 'electrification' }],
                },
              ],
            },
          ],
        },
      ],
      ultimateEnergyCost: 160,
      animationTime: 2.55,
      enhancementTime: 'liino-cosmovoice-stance',
      cooldown: 20,
      triggers: [
        {
          trigger: {
            kind: 'onActionStart',
            skillTypes: 'ultimate',
          },
          effects: [
            {
              kind: 'consume',
              operatorStatus: 'liino-vocalist-stance',
              consumeTarget: 'team',
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusExpire',
            status: 'liino-ultimate-hit-countdown',
            target: 'self',
          },
          effects: [
            {
              kind: 'damageHit',
              element: 'electric',
              multiplier: [27, 29, 32, 35, 37, 40, 42, 45, 48, 51, 55, 60],
              condition: { kind: 'operatorStatus', status: 'liino-cosmovoice-stance' },
            },
            {
              kind: 'status',
              stat: { modifier: 'heal' },
              target: 'team',
              condition: { kind: 'operatorStatus', status: 'liino-cosmovoice-stance' },
            },
            {
              id: 'liino-ultimate-hit-countdown',
              kind: 'status',
              target: 'self',
              duration: 1.5,
              hide: true,
              condition: { kind: 'operatorStatus', status: 'liino-cosmovoice-stance' },
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusExpire',
            status: 'liino-cosmovoice-stance',
            target: 'self',
          },
          effects: [
            {
              kind: 'damageHit',
              element: 'electric',
              multiplier: [27, 29, 32, 35, 37, 40, 42, 45, 48, 51, 55, 60].map(x => x * 3),
            },
            {
              kind: 'status',
              stat: { modifier: 'heal' },
              target: 'team',
            },
            {
              kind: 'consume',
              operatorStatus: 'liino-ultimate-hit-countdown',
            },
          ],
        },
        {
          trigger: {
            kind: 'onStatusConsumed',
            status: 'liino-cosmovoice-stance',
            target: 'self',
          },
          effects: [
            {
              kind: 'consume',
              operatorStatus: 'liino-ultimate-hit-countdown',
            },
          ],
        },
      ],
      effects: [
        {
          id: 'liino-ultimate-electric-amp',
          kind: 'status',
          stat: { modifier: 'ampBonus', elements: 'electric' },
          target: 'team',
          value: 0,
          scaling: {
            additive: [
              {
                basis: 'will',
                coefficient: [
                  0.018, 0.02, 0.021, 0.023, 0.025, 0.027, 0.028, 0.03, 0.032, 0.034, 0.037, 0.04,
                ],
              },
            ],
            cap: [40, 40, 40, 40, 45, 45, 45, 45, 45, 50, 55, 60],
          },
          condition: {
            kind: 'operatorStatus',
            status: 'liino-cosmovoice-stance',
          },
        },
        {
          id: 'liino-ultimate-nature-amp',
          kind: 'status',
          stat: { modifier: 'ampBonus', elements: 'nature' },
          target: 'team',
          value: 0,
          scaling: {
            additive: [
              {
                basis: 'will',
                coefficient: [
                  0.018, 0.02, 0.021, 0.023, 0.025, 0.027, 0.028, 0.03, 0.032, 0.034, 0.037, 0.04,
                ],
              },
            ],
            cap: [40, 40, 40, 40, 45, 45, 45, 45, 45, 50, 55, 60],
          },
          condition: {
            kind: 'operatorStatus',
            status: 'liino-cosmovoice-stance',
          },
        },
      ],
    },
  },
};

export default sheet;
