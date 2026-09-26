/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const wulfgardChr_0006_wolfgd_attack1ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0006_wolfgd_attack1_projhit01',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, duration: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_3' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResourceByActionValue_1: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 0.5 },
                            recipient: 'team',
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      conditional_2: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
                        },
                        next: null,
                      },
                      dealDamage_3: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'conditional_2',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                    },
                  },
                  macros: {},
                },
              },
            },
          ],
        },
        next: null,
      },
      withActionBlackboardScope_2: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      launchProjectile_3: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0006_wolfgd_attack1_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, duration: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_3' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResourceByActionValue_1: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 0.5 },
                            recipient: 'team',
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      conditional_2: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
                        },
                        next: null,
                      },
                      dealDamage_3: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'conditional_2',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                    },
                  },
                  macros: {},
                },
              },
            },
          ],
        },
        next: null,
      },
      withActionBlackboardScope_4: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_3' },
        },
        next: null,
      },
      reachSkillOperableBoundary_5: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0006_wolfgd_attack2'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const wulfgardChr_0006_wolfgd_attack1: SkillDefinition = {
  key: 'chr_0006_wolfgd_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    display_atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
  },
  timelineBlockFrames: 24,
  naturalDurationFrames: 121,
  exclusiveFrame: 30,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 49,
        input: 'basicAttack',
        targetSkillId: 'chr_0006_wolfgd_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 24, endFrame: 49, skillIds: ['chr_0006_wolfgd_attack2'] }],
  },
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 14, endFrame: 15, sequence: { $sequence: 'withActionBlackboardScope_4' } },
    { startFrame: 24, endFrame: 49, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0006_wolfgd_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: wulfgardChr_0006_wolfgd_attack1ActionGraph,
};

export const wulfgardChr_0006_wolfgd_attack2ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0006_wolfgd_attack2_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, duration: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_3' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResourceByActionValue_1: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 0.5 },
                            recipient: 'team',
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      conditional_2: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
                        },
                        next: null,
                      },
                      dealDamage_3: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'conditional_2',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                    },
                  },
                  macros: {},
                },
              },
            },
          ],
        },
        next: null,
      },
      withActionBlackboardScope_2: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      reachSkillOperableBoundary_5: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0006_wolfgd_attack3'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const wulfgardChr_0006_wolfgd_attack2: SkillDefinition = {
  key: 'chr_0006_wolfgd_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.18, 0.19, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39],
    display_atk_scale: [0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.67, 0.73, 0.79],
  },
  timelineBlockFrames: 23,
  naturalDurationFrames: 129,
  exclusiveFrame: 35,
  offsetRecordFrame: 10,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 38,
        input: 'basicAttack',
        targetSkillId: 'chr_0006_wolfgd_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 23, endFrame: 38, skillIds: ['chr_0006_wolfgd_attack3'] }],
  },
  costFrame: 11,
  scheduledSequences: [
    { startFrame: 10, endFrame: 10, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 16, endFrame: 16, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 23, endFrame: 38, sequence: { $sequence: 'reachSkillOperableBoundary_5' } },
  ],
  timelineContinuationSkillId: 'chr_0006_wolfgd_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: wulfgardChr_0006_wolfgd_attack2ActionGraph,
};

export const wulfgardChr_0006_wolfgd_attack3ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0006_wolfgd_attack3_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, duration: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_3' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResourceByActionValue_1: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 0.3333333 },
                            recipient: 'team',
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      conditional_2: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
                        },
                        next: null,
                      },
                      dealDamage_3: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'conditional_2',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                    },
                  },
                  macros: {},
                },
              },
            },
          ],
        },
        next: null,
      },
      withActionBlackboardScope_2: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      reachSkillOperableBoundary_7: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0006_wolfgd_attack4'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const wulfgardChr_0006_wolfgd_attack3: SkillDefinition = {
  key: 'chr_0006_wolfgd_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.19, 0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.31, 0.33, 0.36, 0.38, 0.42],
    display_atk_scale: [0.56, 0.61, 0.67, 0.72, 0.78, 0.83, 0.89, 0.94, 1, 1.07, 1.15, 1.25],
  },
  timelineBlockFrames: 32,
  naturalDurationFrames: 146,
  exclusiveFrame: 52,
  offsetRecordFrame: 12,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 52,
        input: 'basicAttack',
        targetSkillId: 'chr_0006_wolfgd_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 32, endFrame: 52, skillIds: ['chr_0006_wolfgd_attack4'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 18, endFrame: 18, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 24, endFrame: 24, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 32, endFrame: 52, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  timelineContinuationSkillId: 'chr_0006_wolfgd_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: wulfgardChr_0006_wolfgd_attack3ActionGraph,
};

export const wulfgardChr_0006_wolfgd_attack4ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0006_wolfgd_attack4_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, duration: 0, poise: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_3' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResourceByActionValue_1: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'team',
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      conditional_2: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_2' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
                        },
                        next: null,
                      },
                      dealDamage_3: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['normalAttack', 'normalAttackLastCombo'],
                            stagger: { kind: 'valueNode', nodeId: 'data_4' },
                            staggerOnlyWhenCasterControlled: true,
                          },
                        },
                        next: 'conditional_2',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                    },
                  },
                  macros: {},
                },
              },
            },
          ],
        },
        next: null,
      },
      withActionBlackboardScope_2: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const wulfgardChr_0006_wolfgd_attack4: SkillDefinition = {
  key: 'chr_0006_wolfgd_attack4',
  blackboard: {
    atb: 18,
    atk_scale: [0.68, 0.74, 0.81, 0.88, 0.95, 1.01, 1.08, 1.15, 1.22, 1.3, 1.4, 1.52],
    poise: 18,
  },
  timelineBlockFrames: 53,
  naturalDurationFrames: 141,
  exclusiveFrame: 52,
  offsetRecordFrame: 23,
  costFrame: 23,
  scheduledSequences: [
    { startFrame: 23, endFrame: 33, sequence: { $sequence: 'withActionBlackboardScope_2' } },
  ],
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: wulfgardChr_0006_wolfgd_attack4ActionGraph,
};

export const wulfgardChr_0006_wolfgd_power_attackActionGraph = {
  main: {
    nodes: {
      gainFinisherSp_1: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'gainFinisherSp_1' },
        },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'conditional_2',
      },
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.07 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_4' },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_full_immune_medium',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_power_attack_disable_cast_skill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const wulfgardChr_0006_wolfgd_power_attack: SkillDefinition = {
  actionGraph: wulfgardChr_0006_wolfgd_power_attackActionGraph,
  key: 'chr_0006_wolfgd_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 34,
  naturalDurationFrames: 150,
  exclusiveFrame: 60,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 34,
        endFrame: 58,
        skillIds: ['chr_0006_wolfgd_normal_skill', 'chr_0006_wolfgd_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 34, endFrame: 44, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 34, endFrame: 43, sequence: { $sequence: 'conditional_5' } },
    { startFrame: 0, endFrame: 60, sequence: { $sequence: 'applyBuff_6' } },
    { startFrame: 0, endFrame: 34, sequence: { $sequence: 'applyBuff_7' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const wulfgardChr_0006_wolfgd_plunging_attack_endActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const wulfgardChr_0006_wolfgd_plunging_attack_end: SkillDefinition = {
  actionGraph: wulfgardChr_0006_wolfgd_plunging_attack_endActionGraph,
  key: 'chr_0006_wolfgd_plunging_attack_end',
  blackboard: { atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
  timelineBlockFrames: 8,
  naturalDurationFrames: 120,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [{ startFrame: 8, endFrame: 20, skillIds: ['chr_0006_wolfgd_attack1'] }],
  },
  costFrame: 0,
  scheduledSequences: [{ startFrame: 2, endFrame: 6, sequence: { $sequence: 'dealDamage_1' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const wulfgardChr_0006_wolfgd_normal_skillActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { onReach: true, finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0006_wolfgd_normal_skill_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0, duration: 0, poise_first_bullet: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_1' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_first_bullet' },
                      },
                    },
                  },
                  macros: {},
                },
              },
            },
          ],
        },
        next: null,
      },
      withActionBlackboardScope_2: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      launchProjectile_6: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { onReach: true, finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0006_wolfgd_normal_skill_projhit_FireSpellInfiction',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0, duration: 0, poise_first_bullet: 0 },
                scheduledSequences: [
                  {
                    startFrame: 0,
                    endFrame: 0,
                    sequence: { $sequence: 'applyElementalInfliction_2' },
                  },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: null,
                      },
                      applyElementalInfliction_2: {
                        action: {
                          kind: 'applyElementalInfliction',
                          parameters: { element: 'heat', isExtra: false },
                        },
                        next: 'dealDamage_1',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_first_bullet' },
                      },
                    },
                  },
                  macros: {},
                },
              },
            },
          ],
        },
        next: null,
      },
      withActionBlackboardScope_8: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_6' },
        },
        next: null,
      },
      launchProjectile_5: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { onReach: true, finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0006_wolfgd_normal_skill_projhit_1',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0, duration: 0, poise_first_bullet: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_1' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_first_bullet' },
                      },
                    },
                  },
                  macros: {},
                },
              },
            },
          ],
        },
        next: null,
      },
      withActionBlackboardScope_7: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_5' },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_9: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'withActionBlackboardScope_7' },
          whenFalse: { $sequence: 'withActionBlackboardScope_8' },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_9',
      },
      launchProjectile_11: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { onReach: true, finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0006_wolfgd_normal_skill_plus_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale_plus: 0,
                  atk_scale_plus_fail: 0,
                  duration: 0,
                  poise_extra_bullet: 0,
                  poise_extra_bullet_fail: 0,
                  potential_2: 0,
                  potential_skillpower: 0,
                  returnskillpower: 0,
                  talent2: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_12' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_6: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: null,
                      },
                      applyElementalInfliction_7: {
                        action: {
                          kind: 'applyElementalInfliction',
                          parameters: { element: 'heat', isExtra: false },
                        },
                        next: 'dealDamage_6',
                      },
                      modifyActionValue_1: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'returnskillpower',
                            operation: 'add',
                            value: { kind: 'valueNode', nodeId: 'data_3' },
                          },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_2: {
                        action: {
                          kind: 'changeResourceByActionValue',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_4' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'team',
                            spGainKind: 'refund',
                            spGainSource: 'skill',
                          },
                        },
                        next: null,
                      },
                      conditional_3: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_6' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'modifyActionValue_1' },
                        },
                        next: 'changeResourceByActionValue_2',
                      },
                      dealDamage_4: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_8' },
                          },
                        },
                        next: null,
                      },
                      conditional_5: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_10' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_3' },
                        },
                        next: 'dealDamage_4',
                      },
                      finishBuffsByTag_8: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
                            reason: 'early',
                          },
                        },
                        next: null,
                      },
                      conditional_10: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_11' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_8' },
                        },
                        next: null,
                      },
                      finishBuffsByTag_9: {
                        action: {
                          kind: 'finishBuffsByTag',
                          parameters: {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellStatus/Burning'],
                            reason: 'early',
                          },
                        },
                        next: null,
                      },
                      conditional_11: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_12' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'finishBuffsByTag_9' },
                          whenFalse: { $sequence: 'conditional_10' },
                        },
                        next: null,
                      },
                      conditional_12: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_13' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'conditional_5' },
                          whenFalse: { $sequence: 'applyElementalInfliction_7' },
                        },
                        next: 'conditional_11',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_plus_fail' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_extra_bullet_fail' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_skillpower' },
                      },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'returnskillpower' },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'potential_2', fallback: 0 },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_5' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0 },
                        },
                      },
                      data_7: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_plus' },
                      },
                      data_8: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'poise_extra_bullet' },
                      },
                      data_9: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent2', fallback: 0 },
                      },
                      data_10: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_9' },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0 },
                        },
                      },
                      data_11: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityTagMatch',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          tags: ['Skill/Character/Common/SpellStatus/Conduct'],
                        },
                      },
                      data_12: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityTagMatch',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          tags: ['Skill/Character/Common/SpellStatus/Burning'],
                        },
                      },
                      data_13: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityTagMatch',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          tags: [
                            'Skill/Character/Common/SpellStatus/Burning',
                            'Skill/Character/Common/SpellStatus/Conduct',
                          ],
                        },
                      },
                    },
                  },
                  macros: {},
                },
              },
            },
          ],
        },
        next: null,
      },
      applyBuff_12: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0006_wolfgd_talent_0_effectbuff',
            target: 'party',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { add: 'teammate_percent', duration: 'duration' },
          },
        },
        next: null,
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'teammate_percent',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'applyBuff_12',
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0006_wolfgd_talent_0_effectbuff',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { add: 'add', duration: 'duration' },
          },
        },
        next: 'modifyActionValue_13',
      },
      readBuffBlackboard_15: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0006_wolfgd_talent_0'] },
            desiredKey: 'duration',
            outputKey: 'duration',
          },
        },
        next: 'applyBuff_14',
      },
      readBuffBlackboard_16: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0006_wolfgd_talent_0'] },
            desiredKey: 'add',
            outputKey: 'add',
          },
        },
        next: 'readBuffBlackboard_15',
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'readBuffBlackboard_16' },
        },
        next: null,
      },
      withActionBlackboardScope_18: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_11' },
        },
        next: 'conditional_17',
      },
      findCharacterTeamTargets_19: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      modifyActionValue_20: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'SpellInflict',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      conditional_21: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'modifyActionValue_20' },
        },
        next: null,
      },
      jumpTimeline_22: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 118 } },
        next: null,
      },
      conditional_23: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'jumpTimeline_22' },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_24: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      jumpTimeline_25: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 247 } },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'SpellInflict', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'add' } },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_3', fallback: 0 },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0006_wolfgd_talent_0_effectbuff'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'all',
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_5' },
            { kind: 'conditionNode', nodeId: 'data_6' },
          ],
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'enemy',
          tagQueryType: 'hasAny',
          tags: [
            'Skill/Character/Common/SpellStatus/Burning',
            'Skill/Character/Common/SpellStatus/Conduct',
          ],
        },
      },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'SpellInflict', fallback: 0 },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const wulfgardChr_0006_wolfgd_normal_skill: SkillDefinition = {
  key: 'chr_0006_wolfgd_normal_skill',
  blackboard: {
    add: 0,
    atk_scale: [0.34, 0.37, 0.41, 0.44, 0.48, 0.51, 0.54, 0.58, 0.61, 0.65, 0.71, 0.77],
    atk_scale_plus: [3.78, 4.15, 4.53, 4.91, 5.29, 5.66, 6.04, 6.42, 6.8, 7.27, 7.84, 8.5],
    atk_scale_plus_fail: [0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81],
    duration: 0,
    poise_extra_bullet: 5,
    poise_extra_bullet_fail: 0,
    poise_first_bullet: 1.67,
    potential_2: 0,
    potential_3: 0,
    potential_skillpower: 0,
    returnskillpower: 0,
    SpellInflict: 0,
    talent2: 0,
    teammate_percent: 0,
  },
  timelineBlockFrames: 48,
  naturalDurationFrames: 272,
  exclusiveFrame: 159,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 32, endFrame: 54, skillIds: ['chr_0006_wolfgd_normal_skill'] },
      { startFrame: 152, endFrame: 184, skillIds: ['chr_0006_wolfgd_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 6, endFrame: 9, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 16, endFrame: 20, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 23, endFrame: 26, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 141, endFrame: 146, sequence: { $sequence: 'withActionBlackboardScope_18' } },
    { startFrame: 0, endFrame: 2, sequence: { $sequence: 'findCharacterTeamTargets_19' } },
    { startFrame: 0, endFrame: 2, sequence: { $sequence: 'conditional_21' } },
    { startFrame: 31, endFrame: 32, sequence: { $sequence: 'conditional_23' } },
    { startFrame: 48, endFrame: 51, sequence: { $sequence: 'markCurrentSkillCanInterrupt_24' } },
    { startFrame: 117, endFrame: 117, sequence: { $sequence: 'jumpTimeline_25' } },
  ],
  smartTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: wulfgardChr_0006_wolfgd_normal_skillActionGraph,
};

export const wulfgardChr_0006_wolfgd_combo_skillActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { onReach: true, finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0006_wolfgd_combo_skill_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0, duration: 0, poise: 0, usp: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 10, sequence: { $sequence: null } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            abilityEntityId: 'abilityentity_chr_0006_wolfgd_combo_skill',
                            childSkillId: 'chr_0006_wolfgd_combo_skill_abilityrange',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                          },
                        },
                        next: null,
                      },
                    },
                  },
                  macros: {},
                },
              },
            },
          ],
        },
        next: null,
      },
      withActionBlackboardScope_2: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.6 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const wulfgardChr_0006_wolfgd_combo_skill: SkillDefinition = {
  key: 'chr_0006_wolfgd_combo_skill',
  blackboard: {
    atk_scale: [0.6, 0.66, 0.72, 0.78, 0.84, 0.9, 0.96, 1.02, 1.08, 1.16, 1.25, 1.35],
    cam_angle: 0,
    cam_duration: 0,
    count: 0,
    input_angle: 0,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    poise: 10,
    select_radius: 4,
    usp: 10,
  },
  timelineBlockFrames: 31,
  naturalDurationFrames: 138,
  exclusiveFrame: 30,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 30, endFrame: 65, skillIds: ['chr_0006_wolfgd_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 12, endFrame: 16, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_3' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 570],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: wulfgardChr_0006_wolfgd_combo_skillActionGraph,
};

export const wulfgardChr_0006_wolfgd_ultimate_skillActionGraph = {
  main: {
    nodes: {
      adjustSkillCooldown_1: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'type', skillType: 'comboSkill' },
            operation: 'set',
            basis: 'absoluteSeconds',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'adjustSkillCooldown_1' },
        },
        next: null,
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'RESETto1' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      launchProjectile_4: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        },
        next: null,
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: null,
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_fire_fire_burning_triggered',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      repeatEachTick_16: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: false,
              triggerIntervalSeconds: 0.2,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.2,
            },
          },
          body: { $sequence: 'applyBuff_15' },
        },
        next: null,
      },
      hideUi_17: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_18: {
        action: {
          kind: 'startUltimateTimeDilation',
          parameters: {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          },
        },
        next: null,
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_damage_immune_ult_skill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5', fallback: 0 },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const wulfgardChr_0006_wolfgd_ultimate_skill: SkillDefinition = {
  key: 'chr_0006_wolfgd_ultimate_skill',
  blackboard: {
    atk_scale: [0.32, 0.35, 0.38, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.66, 0.72],
    poise: 3,
    potential_5: 0,
  },
  timelineBlockFrames: 81,
  naturalDurationFrames: 168,
  exclusiveFrame: 80,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 75,
        endFrame: 89,
        skillIds: ['chr_0006_wolfgd_normal_skill', 'chr_0006_wolfgd_combo_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 14, sequence: { $sequence: 'conditional_2' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_3' } },
    { startFrame: 45, endFrame: 47, sequence: { $sequence: 'launchProjectile_4' } },
    { startFrame: 50, endFrame: 52, sequence: { $sequence: 'launchProjectile_4' } },
    { startFrame: 56, endFrame: 58, sequence: { $sequence: 'launchProjectile_4' } },
    { startFrame: 61, endFrame: 63, sequence: { $sequence: 'launchProjectile_4' } },
    { startFrame: 45, endFrame: 47, sequence: { $sequence: 'launchProjectile_4' } },
    { startFrame: 63, endFrame: 65, sequence: { $sequence: 'launchProjectile_4' } },
    { startFrame: 46, endFrame: 49, sequence: { $sequence: 'dealDamage_10' } },
    { startFrame: 52, endFrame: 55, sequence: { $sequence: 'dealDamage_10' } },
    { startFrame: 59, endFrame: 62, sequence: { $sequence: 'dealDamage_10' } },
    { startFrame: 64, endFrame: 67, sequence: { $sequence: 'dealDamage_10' } },
    { startFrame: 69, endFrame: 72, sequence: { $sequence: 'dealDamage_10' } },
    { startFrame: 45, endFrame: 72, sequence: { $sequence: 'repeatEachTick_16' } },
    { startFrame: 0, endFrame: 46, sequence: { $sequence: 'hideUi_17' } },
    { startFrame: 0, endFrame: 46, sequence: { $sequence: 'startUltimateTimeDilation_18' } },
    { startFrame: 0, endFrame: 80, sequence: { $sequence: 'applyBuff_19' } },
  ],
  cooldownFrames: 300,
  costs: [{ resource: 'ultimateEnergy', value: 90 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: wulfgardChr_0006_wolfgd_ultimate_skillActionGraph,
};

export const wulfgardCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const wulfgardCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: wulfgardCommon_character_perfect_dodgeActionGraph,
  key: 'common_character_perfect_dodge',
  blackboard: {},
  timelineBlockFrames: 16,
  naturalDurationFrames: 15,
  exclusiveFrame: 15,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [],
  skillType: 'dodge',
  nativeSkillType: 'dodge',
};

const wulfgardComboCondition1ActionGraph = {
  main: {
    nodes: {
      conditional_1: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: null },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetObjectTypeMatch',
          contextKey: 'trigger',
          objectTypes: ['enemy'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const wulfgardComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0006_wolfgd_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_1' },
  actionGraph: wulfgardComboCondition1ActionGraph,
};

const wulfgardBuff1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0006_wolfgd_talent_0_effectbuff',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration', add: 'add' },
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Burning'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const wulfgardBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { add: 0, duration: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'conditional_2' } },
  ],
  actionGraph: wulfgardBuff1ActionGraph,
};

const wulfgardBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const wulfgardBuff2: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_wolfgd_talent_1',
    iconPath: '/icons/icon_battle_wolfgd_talent_1.webp',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: false,
    useWeakProgressInNormalSkillButton: false,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: false,
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'Default',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { add: 0, duration: 0 },
  attributeModifiers: [
    { attribute: 'heatDamageIncrease', slot: 'baseAddition', value: { blackboardKey: 'add' } },
  ],
  actionGraph: wulfgardBuff2ActionGraph,
};

export const wulfgard: OperatorDefinition = {
  slug: 'wulfgard',
  gameId: 'WULFGARD',
  rarity: 5,
  weaponType: 'handcannon',
  element: 'heat',
  role: 'caster',
  mainAttribute: 'strength',
  secondaryAttribute: 'agility',
  attributes: {
    strength: [18, 49, 81, 113, 145, 161],
    agility: [9, 27, 47, 66, 85, 95],
    intellect: [9, 27, 45, 64, 83, 92],
    will: [13, 34, 56, 78, 100, 111],
    baseAttack: [30, 86, 146, 205, 264, 294],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        wulfgardChr_0006_wolfgd_attack1,
        wulfgardChr_0006_wolfgd_attack2,
        wulfgardChr_0006_wolfgd_attack3,
        wulfgardChr_0006_wolfgd_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: wulfgardChr_0006_wolfgd_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: wulfgardChr_0006_wolfgd_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: wulfgardChr_0006_wolfgd_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: wulfgardChr_0006_wolfgd_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: wulfgardChr_0006_wolfgd_ultimate_skill,
    },
  ],
  dodgeSkill: wulfgardCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0006_wolfgd_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0006_wolfgd_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0006_wolfgd_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0006_wolfgd_attack1',
        'chr_0006_wolfgd_attack2',
        'chr_0006_wolfgd_attack3',
        'chr_0006_wolfgd_attack4',
        'chr_0006_wolfgd_plunging_attack_end',
        'chr_0006_wolfgd_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0006_wolfgd_attack1',
        'chr_0006_wolfgd_attack2',
        'chr_0006_wolfgd_attack3',
        'chr_0006_wolfgd_attack4',
      ],
      defaultSkillKey: 'chr_0006_wolfgd_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [wulfgardComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0006_wolfgd_talent_0',
          blackboardAssignments: { add: [0.2, 0.3], duration: 10 },
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'returnskillpower',
          operation: 'assign',
          value: [5, 10],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'talent2',
          operation: 'assign',
          value: [1, 1],
        },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 15 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_skillpower',
          operation: 'assign',
          value: 10,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_2',
          operation: 'assign',
          value: 1,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_3',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'teammate_percent',
          operation: 'assign',
          value: 0.5,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillGroupKey: 'ultimate',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_5',
          operation: 'assign',
          value: 1,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0006_wolfgd_talent_0: wulfgardBuff1,
    buff_chr_0006_wolfgd_talent_0_effectbuff: wulfgardBuff2,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0006_wolfgd_combo_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Category/EnergyShard/Pulse',
      ],
      lifetime: { kind: 'limited', durationSeconds: 1.5 },
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              changeResourceByActionValue_1: {
                action: {
                  kind: 'changeResourceByActionValue',
                  parameters: {
                    resource: 'ultimateEnergy',
                    amount: { kind: 'valueNode', nodeId: 'data_1' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'caster',
                  },
                },
                next: null,
              },
              dealDamage_2: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_3' },
                  },
                  key: 'abilityentity_chr_0006_wolfgd_combo_skill:chr_0006_wolfgd_combo_skill_abilityrange:/childSkill/actionGraph/main/nodes/dealDamage_2/action',
                },
                next: 'changeResourceByActionValue_1',
              },
              applyElementalInfliction_3: {
                action: {
                  kind: 'applyElementalInfliction',
                  parameters: { element: 'heat', isExtra: false },
                },
                next: 'dealDamage_2',
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
            },
          },
          macros: {},
        },
        skillId: 'chr_0006_wolfgd_combo_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 45,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale: 5,
          duration: 0,
          move_speed_scalar: 1,
          poise: 0,
          radius: 5,
          usp: 0,
        },
        scheduledSequences: [
          { startFrame: 0, endFrame: 0, sequence: { $sequence: 'applyElementalInfliction_3' } },
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default wulfgard;
