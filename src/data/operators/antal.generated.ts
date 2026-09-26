/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const antalChr_0023_antal_attack1ActionGraph = {
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
                skillId: 'chr_0023_antal_attack1_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_opt2' } },
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
                      conditional_opt1: {
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
                      dealDamage_opt2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'conditional_opt1',
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
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0023_antal_attack2'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_attack1: SkillDefinition = {
  key: 'chr_0023_antal_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.23, 0.25, 0.28, 0.3, 0.32, 0.35, 0.37, 0.39, 0.41, 0.44, 0.48, 0.52],
  },
  timelineBlockFrames: 15,
  naturalDurationFrames: 69,
  exclusiveFrame: 21,
  offsetRecordFrame: 8,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 26,
        input: 'basicAttack',
        targetSkillId: 'chr_0023_antal_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 15, endFrame: 26, skillIds: ['chr_0023_antal_attack2'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 8, endFrame: 8, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 15, endFrame: 26, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  timelineContinuationSkillId: 'chr_0023_antal_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: antalChr_0023_antal_attack1ActionGraph,
};

export const antalChr_0023_antal_attack2ActionGraph = {
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
                skillId: 'chr_0023_antal_attack2_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_opt2' } },
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
                      conditional_opt1: {
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
                      dealDamage_opt2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'conditional_opt1',
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
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0023_antal_attack3'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_attack2: SkillDefinition = {
  key: 'chr_0023_antal_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.28, 0.31, 0.34, 0.36, 0.39, 0.42, 0.45, 0.48, 0.5, 0.54, 0.58, 0.63],
    display_atk_scale: [0.28, 0.31, 0.34, 0.36, 0.39, 0.42, 0.45, 0.48, 0.5, 0.54, 0.58, 0.63],
  },
  timelineBlockFrames: 20,
  naturalDurationFrames: 90,
  exclusiveFrame: 31,
  offsetRecordFrame: 12,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 31,
        input: 'basicAttack',
        targetSkillId: 'chr_0023_antal_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 20, endFrame: 31, skillIds: ['chr_0023_antal_attack3'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 20, endFrame: 31, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  timelineContinuationSkillId: 'chr_0023_antal_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: antalChr_0023_antal_attack2ActionGraph,
};

export const antalChr_0023_antal_attack3ActionGraph = {
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
                skillId: 'chr_0023_antal_attack3_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_opt2' } },
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
                      conditional_opt1: {
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
                      dealDamage_opt2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'conditional_opt1',
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
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'withActionBlackboardScope_2',
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0023_antal_attack4'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_attack3: SkillDefinition = {
  key: 'chr_0023_antal_attack3',
  blackboard: {
    atb: 0,
    atk_scale: [0.34, 0.37, 0.41, 0.44, 0.48, 0.51, 0.54, 0.58, 0.61, 0.65, 0.71, 0.77],
  },
  timelineBlockFrames: 22,
  naturalDurationFrames: 107,
  exclusiveFrame: 33,
  offsetRecordFrame: 14,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 33,
        input: 'basicAttack',
        targetSkillId: 'chr_0023_antal_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 22, endFrame: 33, skillIds: ['chr_0023_antal_attack4'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 14, endFrame: 14, sequence: { $sequence: 'modifyActionValue_3' } },
    { startFrame: 18, endFrame: 18, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 22, endFrame: 33, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0023_antal_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: antalChr_0023_antal_attack3ActionGraph,
};

export const antalChr_0023_antal_attack4ActionGraph = {
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
                skillId: 'chr_0023_antal_attack4_powerattack_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0, poise: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'conditional_opt3' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      createTimedMarker_1: {
                        action: {
                          kind: 'createTimedMarker',
                          parameters: {
                            target: 'caster',
                            markerId: 'have_recovered',
                            durationSeconds: { kind: 'constant', value: 0.5 },
                            autoFinishByAction: false,
                          },
                        },
                        next: null,
                      },
                      changeResourceByActionValue_2: {
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
                        next: 'createTimedMarker_1',
                      },
                      dealDamage_5: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: null,
                      },
                      conditional_opt1: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_3' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'changeResourceByActionValue_2' },
                        },
                        next: null,
                      },
                      dealDamage_opt2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                            tags: ['normalAttack', 'normalAttackLastCombo'],
                            stagger: { kind: 'valueNode', nodeId: 'data_5' },
                            staggerOnlyWhenCasterControlled: true,
                          },
                        },
                        next: 'conditional_opt1',
                      },
                      conditional_opt3: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_7' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'dealDamage_opt2' },
                          whenFalse: { $sequence: 'dealDamage_5' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                      data_6: {
                        type: 'boolean',
                        expression: {
                          kind: 'timedMarkerPresent',
                          target: 'caster',
                          markerId: 'have_recovered',
                        },
                      },
                      data_7: {
                        type: 'boolean',
                        expression: {
                          kind: 'not',
                          condition: { kind: 'conditionNode', nodeId: 'data_6' },
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
      withActionBlackboardScope_3: {
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
      withActionBlackboardScope_4: {
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
        next: 'withActionBlackboardScope_3',
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'withActionBlackboardScope_4',
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0023_antal_attack1'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_attack4: SkillDefinition = {
  key: 'chr_0023_antal_attack4',
  blackboard: {
    atb: 15,
    atk_scale: [0.51, 0.56, 0.61, 0.66, 0.71, 0.77, 0.82, 0.87, 0.92, 0.98, 1.06, 1.15],
    poise: 15,
  },
  timelineBlockFrames: 38,
  naturalDurationFrames: 109,
  exclusiveFrame: 43,
  offsetRecordFrame: 27,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 48,
        input: 'basicAttack',
        targetSkillId: 'chr_0023_antal_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 38, endFrame: 48, skillIds: ['chr_0023_antal_attack1'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 27, endFrame: 27, sequence: { $sequence: 'modifyActionValue_5' } },
    { startFrame: 38, endFrame: 48, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  timelineContinuationSkillId: 'chr_0023_antal_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: antalChr_0023_antal_attack4ActionGraph,
};

export const antalChr_0023_antal_power_attackActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 5,
            hit: { onReach: true, finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0023_antal_power_attack02_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 150,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_opt2' } },
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
                      conditional_opt1: {
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
                      dealDamage_opt2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            calculation: 'breakingAttack',
                            calculationMultiplier: 0.06,
                            tags: ['normalAttack', 'powerAttack'],
                          },
                        },
                        next: 'conditional_opt1',
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
      launchProjectile_11: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: { reachAfterTicks: 1, maxDurationSeconds: 1, finishOnReach: false },
            syncTimeScale: true,
            recycleDelaySeconds: 5,
            hit: { onReach: true, finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0023_antal_power_attack_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 150,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_2' } },
                  { startFrame: 1, endFrame: 2, sequence: { $sequence: 'startTimeDilation_3' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      gainFinisherSp_1: {
                        action: {
                          kind: 'gainFinisherSp',
                          parameters: { factor: 1, recipient: 'team' },
                        },
                        next: null,
                      },
                      dealDamage_2: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            calculation: 'breakingAttack',
                            calculationMultiplier: 0.7,
                            tags: ['normalAttack', 'powerAttack'],
                          },
                        },
                        next: 'gainFinisherSp_1',
                      },
                      startTimeDilation_3: {
                        action: {
                          kind: 'startTimeDilation',
                          parameters: {
                            scope: 'entity',
                            durationSeconds: { kind: 'constant', value: 0.3667 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: { kind: 'named', key: 'char_normal_attack' },
                            finishByAction: false,
                            targets: ['enemy', 'caster'],
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
      withActionBlackboardScope_12: {
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
        next: null,
      },
      applyBuff_13: {
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
      applyBuff_14: {
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_power_attack: SkillDefinition = {
  key: 'chr_0023_antal_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 32,
  naturalDurationFrames: 124,
  exclusiveFrame: 42,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 32,
        endFrame: 48,
        skillIds: ['chr_0023_antal_normal_skill', 'chr_0023_antal_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 10, endFrame: 10, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 14, endFrame: 14, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 15, endFrame: 15, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 16, endFrame: 16, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 25, endFrame: 25, sequence: { $sequence: 'withActionBlackboardScope_12' } },
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'applyBuff_13' } },
    { startFrame: 0, endFrame: 42, sequence: { $sequence: 'applyBuff_14' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: antalChr_0023_antal_power_attackActionGraph,
};

export const antalChr_0023_antal_plunging_attack_endActionGraph = {
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
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_1' },
        },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: 'conditional_2',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_plunging_attack_end: SkillDefinition = {
  actionGraph: antalChr_0023_antal_plunging_attack_endActionGraph,
  key: 'chr_0023_antal_plunging_attack_end',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 16,
  naturalDurationFrames: 85,
  exclusiveFrame: 15,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } }],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const antalChr_0023_antal_normal_skillActionGraph = {
  main: {
    nodes: {
      findCharacterTeamTargets_1: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_2: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'gainSquadUltimateEnergyFromSkillCost_2',
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0023_antal_normal_skill',
            target: 'caster',
            source: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              rate: 'rate',
              duration: 'duration',
              potential_3: 'potential_3',
              potential_3_atb: 'potential_3_atb',
              potential_5: 'potential_5',
              delay_time: 'delay_time',
              potential_5_rate: 'potential_5_rate',
            },
          },
        },
        next: 'dealDamage_3',
      },
      finishBuffsById_5: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0023_antal_normal_skill'],
            reason: 'other',
          },
        },
        next: 'applyBuff_4',
      },
      startTimeDilation_6: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_normal_skill: SkillDefinition = {
  actionGraph: antalChr_0023_antal_normal_skillActionGraph,
  key: 'chr_0023_antal_normal_skill',
  blackboard: {
    atk_scale: [0.89, 0.98, 1.07, 1.16, 1.24, 1.33, 1.42, 1.51, 1.6, 1.71, 1.85, 2],
    delay_time: 0,
    duration: 60,
    poise: 0,
    potential_3: 0,
    potential_3_atb: 0,
    potential_5: 0,
    potential_5_rate: 0,
    rate: [0.05, 0.05, 0.06, 0.06, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.1],
  },
  timelineBlockFrames: 31,
  naturalDurationFrames: 108,
  exclusiveFrame: 30,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 2, sequence: { $sequence: 'findCharacterTeamTargets_1' } },
    { startFrame: 20, endFrame: 20, sequence: { $sequence: 'finishBuffsById_5' } },
    { startFrame: 20, endFrame: 23, sequence: { $sequence: 'startTimeDilation_6' } },
  ],
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
};

export const antalChr_0023_antal_combo_skillActionGraph = {
  main: {
    nodes: {
      applyPhysicalInfliction_1: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'fracture',
            target: 'enemy',
            isExtra: false,
            noGuardBuffId: 'buff_physical_no_guard',
            noGuardDefinition: {
              stackingType: 'enhanceAndRefresh',
              priority: 100,
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              presentation: {
                visible: true,
                iconId: 'icon_shadow_attribute_penetrate',
                iconPath: '/icons/icon_shadow_attribute_penetrate.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: true,
                showInSquadIcon: false,
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
              applyTags: ['Skill/Character/Common/NoGuard'],
              extendTags: [],
              blackboard: { atk_scale: 0, count: 0, duration: 20, skip_handle_cryst_break: 0 },
              attributeModifiers: [],
              lifecycleSequences: {
                start: { $sequence: 'conditional_2' },
                finish: { $sequence: 'applyBuff_3' },
                afterEnhance: { $sequence: 'withActionBlackboardScope_9' },
              },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_handle_cryst_break',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    conditional_2: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                        whenTrue: { $sequence: 'applyBuff_1' },
                      },
                      next: null,
                    },
                    applyBuff_3: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_no_guard_fake',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    igniteBuffs_4: {
                      action: {
                        kind: 'igniteBuffs',
                        parameters: {
                          target: 'buffOwner',
                          source: 'buffOwner',
                          igniteType: 'NoGuard',
                        },
                      },
                      next: null,
                    },
                    conditional_7: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        whenTrue: { $sequence: 'conditional_2' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_8: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:1',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'conditional_7' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_9: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:0',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'igniteBuffs_4' },
                      },
                      next: 'withActionBlackboardScope_8',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: {
                        kind: 'blackboard',
                        key: 'skip_handle_cryst_break',
                        fallback: 0,
                      },
                    },
                    data_2: {
                      type: 'boolean',
                      expression: {
                        kind: 'actionValueCompare',
                        left: { kind: 'valueNode', nodeId: 'data_1' },
                        operator: 'equal',
                        right: { kind: 'constant', value: 0 },
                      },
                    },
                    data_3: {
                      type: 'boolean',
                      expression: {
                        kind: 'currentBuffStackCompare',
                        operator: 'greaterOrEqual',
                        value: { kind: 'constant', value: 2 },
                      },
                    },
                  },
                },
                macros: {},
              },
            },
            fractureBuffId: 'buff_physical_fracture',
            fractureDefinition: {
              stackingType: 'unlimited',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: 3,
              triggerIntervalSeconds: 0,
              waitFirstTriggerInterval: false,
              maxTriggerCount: 0,
              applyTags: [],
              extendTags: [],
              blackboard: { count: 0, duration: 15 },
              attributeModifiers: [],
              lifecycleSequences: { start: { $sequence: 'readBuffStackCount_3' } },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_do_fracture',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: { duration: 'duration' },
                        },
                      },
                      next: null,
                    },
                    readSkillSettingData_2: {
                      action: {
                        kind: 'readSkillSettingData',
                        parameters: {
                          items: [
                            {
                              values: [12, 18, 24, 30],
                              column: { kind: 'valueNode', nodeId: 'data_1' },
                              storeKey: 'duration',
                            },
                          ],
                        },
                      },
                      next: 'applyBuff_1',
                    },
                    readBuffStackCount_3: {
                      action: {
                        kind: 'readBuffStackCount',
                        parameters: {
                          target: 'buffOwner',
                          outputKey: 'count',
                          query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
                        },
                      },
                      next: 'readSkillSettingData_2',
                    },
                  },
                  dataNodes: {
                    data_1: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
                  },
                },
                macros: {},
              },
            },
          },
        },
        next: null,
      },
      applyPhysicalInfliction_2: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            noGuardBuffId: 'buff_physical_no_guard',
            noGuardDefinition: {
              stackingType: 'enhanceAndRefresh',
              priority: 100,
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              presentation: {
                visible: true,
                iconId: 'icon_shadow_attribute_penetrate',
                iconPath: '/icons/icon_shadow_attribute_penetrate.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: true,
                showInSquadIcon: false,
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
              applyTags: ['Skill/Character/Common/NoGuard'],
              extendTags: [],
              blackboard: { atk_scale: 0, count: 0, duration: 20, skip_handle_cryst_break: 0 },
              attributeModifiers: [],
              lifecycleSequences: {
                start: { $sequence: 'conditional_2' },
                finish: { $sequence: 'applyBuff_3' },
                afterEnhance: { $sequence: 'withActionBlackboardScope_9' },
              },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_handle_cryst_break',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    conditional_2: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                        whenTrue: { $sequence: 'applyBuff_1' },
                      },
                      next: null,
                    },
                    applyBuff_3: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_no_guard_fake',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    igniteBuffs_4: {
                      action: {
                        kind: 'igniteBuffs',
                        parameters: {
                          target: 'buffOwner',
                          source: 'buffOwner',
                          igniteType: 'NoGuard',
                        },
                      },
                      next: null,
                    },
                    conditional_7: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        whenTrue: { $sequence: 'conditional_2' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_8: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:1',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'conditional_7' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_9: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:0',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'igniteBuffs_4' },
                      },
                      next: 'withActionBlackboardScope_8',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: {
                        kind: 'blackboard',
                        key: 'skip_handle_cryst_break',
                        fallback: 0,
                      },
                    },
                    data_2: {
                      type: 'boolean',
                      expression: {
                        kind: 'actionValueCompare',
                        left: { kind: 'valueNode', nodeId: 'data_1' },
                        operator: 'equal',
                        right: { kind: 'constant', value: 0 },
                      },
                    },
                    data_3: {
                      type: 'boolean',
                      expression: {
                        kind: 'currentBuffStackCompare',
                        operator: 'greaterOrEqual',
                        value: { kind: 'constant', value: 2 },
                      },
                    },
                  },
                },
                macros: {},
              },
            },
            airborneBuffId: 'buff_physical_airborne',
            airborneDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0.1,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'airborne',
                iconPath: '/icons/airborne.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: false,
                showInSquadIcon: false,
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/AirborneStatus'],
              extendTags: [],
              blackboard: { atk_scale: 0, duration: 3, poise: 10 },
              attributeModifiers: [],
              lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_9' } },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_no_guard',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                          blackboardAssignments: {
                            skip_handle_cryst_break: { kind: 'constant', value: 1 },
                          },
                        },
                      },
                      next: null,
                    },
                    dealDamage_2: {
                      action: {
                        kind: 'dealDamage',
                        parameters: {
                          damageType: 'physical',
                          attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                          tags: [],
                          features: ['physicalInfliction'],
                          stagger: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      },
                      next: null,
                    },
                    readSkillSettingData_3: {
                      action: {
                        kind: 'readSkillSettingData',
                        parameters: {
                          items: [
                            {
                              values: [1.2, 1.2, 1.2, 1.2],
                              column: { kind: 'constant', value: 1 },
                              storeKey: 'atk_scale',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.01 },
                              },
                            },
                            {
                              values: [10, 10, 10, 10],
                              column: { kind: 'constant', value: 1 },
                              storeKey: 'poise',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.005 },
                              },
                            },
                          ],
                        },
                      },
                      next: 'dealDamage_2',
                    },
                    applyBuff_4: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_handle_cryst_break',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    igniteBuffs_5: {
                      action: {
                        kind: 'igniteBuffs',
                        parameters: {
                          target: 'buffOwner',
                          source: 'caster',
                          igniteType: 'PhysicalStatus',
                        },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_6: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:3',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'igniteBuffs_5' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_7: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:2',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'applyBuff_4' },
                      },
                      next: 'withActionBlackboardScope_6',
                    },
                    withActionBlackboardScope_8: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:1',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'readSkillSettingData_3' },
                      },
                      next: 'withActionBlackboardScope_7',
                    },
                    withActionBlackboardScope_9: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:0',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'applyBuff_1' },
                      },
                      next: 'withActionBlackboardScope_8',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'atk_scale' },
                    },
                    data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                  },
                },
                macros: {},
              },
            },
            duration: { kind: 'constant', value: 1.5 },
            height: { kind: 'constant', value: 2 },
            speedFactorMultiplier: 3,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: null,
      },
      applyKnockDown_3: {
        action: {
          kind: 'applyKnockDown',
          parameters: {
            target: 'enemy',
            duration: { kind: 'constant', value: 2 },
            force: false,
            isExtra: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: null,
      },
      applyPhysicalInfliction_4: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'crush',
            target: 'enemy',
            isExtra: false,
            noGuardBuffId: 'buff_physical_no_guard',
            noGuardDefinition: {
              stackingType: 'enhanceAndRefresh',
              priority: 100,
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              presentation: {
                visible: true,
                iconId: 'icon_shadow_attribute_penetrate',
                iconPath: '/icons/icon_shadow_attribute_penetrate.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: true,
                showInSquadIcon: false,
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
              applyTags: ['Skill/Character/Common/NoGuard'],
              extendTags: [],
              blackboard: { atk_scale: 0, count: 0, duration: 20, skip_handle_cryst_break: 0 },
              attributeModifiers: [],
              lifecycleSequences: {
                start: { $sequence: 'conditional_2' },
                finish: { $sequence: 'applyBuff_3' },
                afterEnhance: { $sequence: 'withActionBlackboardScope_9' },
              },
              actionGraph: {
                main: {
                  nodes: {
                    applyBuff_1: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_handle_cryst_break',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    conditional_2: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                        whenTrue: { $sequence: 'applyBuff_1' },
                      },
                      next: null,
                    },
                    applyBuff_3: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_no_guard_fake',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    igniteBuffs_4: {
                      action: {
                        kind: 'igniteBuffs',
                        parameters: {
                          target: 'buffOwner',
                          source: 'buffOwner',
                          igniteType: 'NoGuard',
                        },
                      },
                      next: null,
                    },
                    conditional_7: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        whenTrue: { $sequence: 'conditional_2' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_8: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:1',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'conditional_7' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_9: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:0',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'igniteBuffs_4' },
                      },
                      next: 'withActionBlackboardScope_8',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: {
                        kind: 'blackboard',
                        key: 'skip_handle_cryst_break',
                        fallback: 0,
                      },
                    },
                    data_2: {
                      type: 'boolean',
                      expression: {
                        kind: 'actionValueCompare',
                        left: { kind: 'valueNode', nodeId: 'data_1' },
                        operator: 'equal',
                        right: { kind: 'constant', value: 0 },
                      },
                    },
                    data_3: {
                      type: 'boolean',
                      expression: {
                        kind: 'currentBuffStackCompare',
                        operator: 'greaterOrEqual',
                        value: { kind: 'constant', value: 2 },
                      },
                    },
                  },
                },
                macros: {},
              },
            },
            crushedBuffId: 'buff_physical_crushed',
            crushedDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'knockback',
                iconPath: '/icons/knockback.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: false,
                showInSquadIcon: false,
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/CrushStatus'],
              extendTags: [],
              blackboard: {
                atk_scale: 1,
                count: 0,
                dmg_multiplier: 1,
                duration: 3,
                ignore_hit_effect: 0,
              },
              attributeModifiers: [],
              lifecycleSequences: { start: { $sequence: 'withActionBlackboardScope_18' } },
              actionGraph: {
                main: {
                  nodes: {
                    dealDamage_1: {
                      action: {
                        kind: 'dealDamage',
                        parameters: {
                          damageType: 'physical',
                          attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                          tags: [],
                          features: ['physicalInfliction'],
                        },
                      },
                      next: null,
                    },
                    finishBuffsById_2: {
                      action: {
                        kind: 'finishBuffsById',
                        parameters: {
                          target: 'buffOwner',
                          buffIds: ['buff_physical_no_guard'],
                          reason: 'early',
                        },
                      },
                      next: 'dealDamage_1',
                    },
                    modifyActionValue_3: {
                      action: {
                        kind: 'modifyActionValue',
                        parameters: {
                          key: 'atk_scale',
                          operation: 'multiply',
                          value: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      },
                      next: 'finishBuffsById_2',
                    },
                    readSkillSettingData_4: {
                      action: {
                        kind: 'readSkillSettingData',
                        parameters: {
                          items: [
                            {
                              values: [3, 4.5, 6, 7.5],
                              column: { kind: 'valueNode', nodeId: 'data_3' },
                              storeKey: 'atk_scale',
                              enhance: {
                                target: 'caster',
                                formula: { kind: 'linear', paramA: 0.01 },
                              },
                            },
                          ],
                        },
                      },
                      next: 'modifyActionValue_3',
                    },
                    readBuffStackCount_5: {
                      action: {
                        kind: 'readBuffStackCount',
                        parameters: {
                          target: 'buffOwner',
                          outputKey: 'count',
                          query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
                        },
                      },
                      next: 'readSkillSettingData_4',
                    },
                    applyBuff_6: {
                      action: {
                        kind: 'applyBuff',
                        parameters: {
                          buffId: 'buff_physical_handle_cryst_break',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        },
                      },
                      next: null,
                    },
                    igniteBuffs_7: {
                      action: {
                        kind: 'igniteBuffs',
                        parameters: {
                          target: 'buffOwner',
                          source: 'caster',
                          igniteType: 'PhysicalStatus',
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_8: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.1 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 15,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_9: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.1 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 10,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_10: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.25 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 20,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_11: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.5 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 20,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    startTimeDilation_12: {
                      action: {
                        kind: 'startTimeDilation',
                        parameters: {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.65 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 20,
                          curve: { kind: 'named', key: 'interrupt_weakness' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        },
                      },
                      next: null,
                    },
                    switch_13: {
                      action: {
                        kind: 'switch',
                        parameters: {
                          choice: { kind: 'valueNode', nodeId: 'data_4' },
                          alwaysNext: true,
                        },
                        options: [
                          {
                            value: { kind: 'constant', value: 0 },
                            sequence: { $sequence: 'startTimeDilation_8' },
                          },
                          {
                            value: { kind: 'constant', value: 1 },
                            sequence: { $sequence: 'startTimeDilation_9' },
                          },
                          {
                            value: { kind: 'constant', value: 2 },
                            sequence: { $sequence: 'startTimeDilation_10' },
                          },
                          {
                            value: { kind: 'constant', value: 3 },
                            sequence: { $sequence: 'startTimeDilation_11' },
                          },
                          {
                            value: { kind: 'constant', value: 4 },
                            sequence: { $sequence: 'startTimeDilation_12' },
                          },
                        ],
                      },
                      next: null,
                    },
                    conditional_14: {
                      action: {
                        kind: 'conditional',
                        parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
                        whenTrue: { $sequence: 'switch_13' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_15: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:3',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'conditional_14' },
                      },
                      next: null,
                    },
                    withActionBlackboardScope_16: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:2',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'igniteBuffs_7' },
                      },
                      next: 'withActionBlackboardScope_15',
                    },
                    withActionBlackboardScope_17: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:1',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'applyBuff_6' },
                      },
                      next: 'withActionBlackboardScope_16',
                    },
                    withActionBlackboardScope_18: {
                      action: {
                        kind: 'withActionBlackboardScope',
                        parameters: {
                          scopeKey: 'native-buff-callback:0',
                          lifetime: 'execution',
                          alwaysNext: true,
                          shareParentBlackboard: true,
                          initialValues: {},
                          inheritParent: true,
                        },
                        body: { $sequence: 'readBuffStackCount_5' },
                      },
                      next: 'withActionBlackboardScope_17',
                    },
                  },
                  dataNodes: {
                    data_1: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'atk_scale' },
                    },
                    data_2: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'dmg_multiplier' },
                    },
                    data_3: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
                    data_4: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
                    data_5: {
                      type: 'number',
                      expression: { kind: 'blackboard', key: 'ignore_hit_effect', fallback: 0 },
                    },
                    data_6: {
                      type: 'boolean',
                      expression: {
                        kind: 'actionValueCompare',
                        left: { kind: 'valueNode', nodeId: 'data_5' },
                        operator: 'less',
                        right: { kind: 'constant', value: 0.5 },
                      },
                    },
                  },
                },
                macros: {},
              },
            },
            damageMultiplier: { kind: 'constant', value: 1 },
            ignoreHitEffect: false,
          },
        },
        next: null,
      },
      switch_5: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_1' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'applyPhysicalInfliction_1' },
            },
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'applyPhysicalInfliction_2' },
            },
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'applyKnockDown_3' } },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'applyPhysicalInfliction_4' },
            },
          ],
        },
        next: null,
      },
      applyElementalInfliction_6: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'heat', isExtra: false },
        },
        next: null,
      },
      applyElementalInfliction_7: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'cryo', isExtra: false },
        },
        next: null,
      },
      applyElementalInfliction_8: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'electric', isExtra: false },
        },
        next: null,
      },
      applyElementalInfliction_9: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'nature', isExtra: false },
        },
        next: null,
      },
      switch_10: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_2' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 0 },
              sequence: { $sequence: 'applyElementalInfliction_6' },
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: { $sequence: 'applyElementalInfliction_7' },
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'applyElementalInfliction_8' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'applyElementalInfliction_9' },
            },
          ],
        },
        next: null,
      },
      changeResourceByActionValue_11: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'changeResourceByActionValue_11',
      },
      switch_13: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_6' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'switch_5' } },
            { value: { kind: 'constant', value: 0 }, sequence: { $sequence: 'switch_10' } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: null } },
          ],
        },
        next: 'dealDamage_12',
      },
      startTimeDilation_14: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      startTimeDilation_15: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.667 },
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
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_combo_index' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_combo_index' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_combo_type' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_combo_skill: SkillDefinition = {
  key: 'chr_0023_antal_combo_skill',
  blackboard: {
    atk_scale: [1.51, 1.66, 1.81, 1.96, 2.11, 2.27, 2.42, 2.57, 2.72, 2.91, 3.13, 3.4],
    poise: 10,
    usp: 10,
  },
  timelineBlockFrames: 46,
  naturalDurationFrames: 108,
  exclusiveFrame: 45,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 24, endFrame: 63, skillIds: ['chr_0023_antal_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 21, endFrame: 24, sequence: { $sequence: 'switch_13' } },
    { startFrame: 23, endFrame: 26, sequence: { $sequence: 'startTimeDilation_14' } },
    { startFrame: 0, endFrame: 17, sequence: { $sequence: 'startTimeDilation_15' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [750, 750, 750, 750, 750, 750, 750, 750, 750, 750, 750, 720],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: antalChr_0023_antal_combo_skillActionGraph,
};

export const antalChr_0023_antal_ultimate_skillActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
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
      findCharacterTeamTargets_2: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      startUltimateTimeDilation_3: {
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
      hideUi_4: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      applyBuff_5: {
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
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0023_antal_utimate_skill',
            target: 'party',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration', rate: 'rate' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_ultimate_skill: SkillDefinition = {
  actionGraph: antalChr_0023_antal_ultimate_skillActionGraph,
  key: 'chr_0023_antal_ultimate_skill',
  blackboard: {
    duration: 12,
    rate: [0.08, 0.09, 0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.2],
  },
  timelineBlockFrames: 56,
  naturalDurationFrames: 112,
  exclusiveFrame: 60,
  offsetRecordFrame: 0,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 47,
        endFrame: 73,
        input: 'basicAttack',
        targetSkillId: 'chr_0023_antal_attack1',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 56,
        endFrame: 73,
        skillIds: [
          'chr_0023_antal_attack1',
          'chr_0023_antal_normal_skill',
          'chr_0023_antal_combo_skill',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findCharacterTeamTargets_2' } },
    { startFrame: 0, endFrame: 42, sequence: { $sequence: 'startUltimateTimeDilation_3' } },
    { startFrame: 0, endFrame: 44, sequence: { $sequence: 'hideUi_4' } },
    { startFrame: 0, endFrame: 60, sequence: { $sequence: 'applyBuff_5' } },
    { startFrame: 49, endFrame: 51, sequence: { $sequence: 'applyBuff_6' } },
  ],
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 100 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const antalCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: antalCommon_character_perfect_dodgeActionGraph,
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

const antalComboCondition1ActionGraph = {
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
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_combo_type',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'conditional_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'modifyActionValue_2' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventInflictionElementIn',
          elements: ['heat', 'electric', 'cryo', 'nature'],
          outputKey: 'EntityBB_combo_index',
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetBuffIdStackCompare',
          contextKey: 'trigger',
          buffIds: ['buff_chr_0023_antal_tageffect'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const antalComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0023_antal_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_3' },
  actionGraph: antalComboCondition1ActionGraph,
};

const antalComboCondition2ActionGraph = {
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
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_combo_type',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'conditional_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'modifyActionValue_2' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventPhysicalInflictionTypeIn',
          types: ['airborne', 'knockDown', 'fracture', 'crush'],
          outputKey: 'EntityBB_combo_index',
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'contextTargetBuffIdStackCompare',
          contextKey: 'trigger',
          buffIds: ['buff_chr_0023_antal_tageffect'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const antalComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0023_antal_combo_skill',
  event: 'afterTakePhysicalInfliction',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_3' },
  actionGraph: antalComboCondition2ActionGraph,
};

const antalBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const antalBuff1: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  actionGraph: antalBuff1ActionGraph,
};

const antalBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const antalBuff2: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  actionGraph: antalBuff2ActionGraph,
};

const antalBuff3ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0023_antal_tageffect',
            target: 'buffSource',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: {
              rate: 'rate',
              duration: 'duration',
              potential_3: 'potential_3',
              potential_3_atb: 'potential_3_atb',
              potential_5_rate: 'potential_5_rate',
              potential_5: 'potential_5',
              delay_time: 'delay_time',
            },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const antalBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 2,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    delay_time: 0,
    duration: 60,
    potential_3: 0,
    potential_3_atb: 0,
    potential_5: 0,
    potential_5_rate: 0,
    rate: 0.2,
  },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'applyBuff_1' } },
  actionGraph: antalBuff3ActionGraph,
};

const antalBuff4ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_vulnerable_fire',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
            keywordEnhancements: [
              {
                triggerBuffIds: ['buff_chr_0023_antal_talent_1_combotrigger'],
                operation: 'add',
                value: { kind: 'valueNode', nodeId: 'data_3' },
              },
            ],
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0023_antal_normal_icon' },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_vulnerable_pulse',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_4' },
              rate: { kind: 'valueNode', nodeId: 'data_5' },
            },
            keywordEnhancements: [
              {
                triggerBuffIds: ['buff_chr_0023_antal_talent_1_combotrigger'],
                operation: 'add',
                value: { kind: 'valueNode', nodeId: 'data_6' },
              },
            ],
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0023_antal_normal_icon_2' },
          },
        },
        next: 'applyBuff_1',
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0023_antal_talent_1_combotrigger'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0023_antal_talent_1_combotrigger',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'applyBuff_4' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'potential_5_rate' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'potential_5_rate' } },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5', fallback: 0 },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const antalBuff4: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: { blackboardKey: 'delay_time' },
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_antal_buff',
    iconPath: '/icons/icon_battle_antal_buff.webp',
    showInHeadBarCommon: true,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
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
  blackboard: {
    delay_time: 0,
    duration: 0,
    potential_3: 0,
    potential_3_atb: 0,
    potential_5: 0,
    potential_5_rate: 0,
    rate: 0,
    rate_add: 0.05,
  },
  attributeModifiers: [],
  lifecycleSequences: {
    start: { $sequence: 'applyBuff_2' },
    trigger: { $sequence: 'conditional_5' },
    finish: { $sequence: 'finishBuffsById_3' },
  },
  actionGraph: antalBuff4ActionGraph,
};

const antalBuff5ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0023_antal_talent_1_heal_trigger',
            target: 'party',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              healvalue: { kind: 'valueNode', nodeId: 'data_1' },
              cd: { kind: 'valueNode', nodeId: 'data_2' },
              multiplier: { kind: 'valueNode', nodeId: 'data_3' },
            },
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'healvalue' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'cd' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'multiplier' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const antalBuff5: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 2,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 30, healvalue: 300, multiplier: 3 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: antalBuff5ActionGraph,
};

const antalBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const antalBuff6: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: antalBuff6ActionGraph,
};

const antalBuff7ActionGraph = {
  main: {
    nodes: {
      setGlobalCooldown_1: {
        action: {
          kind: 'setGlobalCooldown',
          parameters: {
            target: 'buffOwner',
            markerId: 'buff_chr_0023_antal_talent_1_heal_trigger',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      heal_2: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'buffOwner',
            alwaysNext: true,
            tags: [],
            attribute: 'strength',
            multiplier: { kind: 'valueNode', nodeId: 'data_2' },
            addition: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'setGlobalCooldown_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'heal_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          whenTrue: { $sequence: 'conditional_4' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'cd' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'multiplier' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'healvalue' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalSkill', 'ultimateSkill', 'comboSkill'],
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: 'buffOwner',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/Common/Affixes/Enhance'],
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'globalCooldownPresent',
          target: 'buffOwner',
          markerId: 'buff_chr_0023_antal_talent_1_heal_trigger',
        },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_6' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const antalBuff7: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 2,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 0, healvalue: 0, multiplier: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'outputDamage', priority: 0, sequence: { $sequence: 'conditional_5' } },
  ],
  actionGraph: antalBuff7ActionGraph,
};

const antalBuff8ActionGraph = {
  main: {
    nodes: {
      heal_1: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'buffOwner',
            alwaysNext: true,
            tags: [],
            attribute: 'strength',
            multiplier: { kind: 'valueNode', nodeId: 'data_1' },
            addition: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_damage_immune_talent',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 0.01 } },
          },
        },
        next: 'heal_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          whenTrue: { $sequence: 'applyBuff_2' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          whenTrue: { $sequence: 'conditional_3' },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
          whenTrue: { $sequence: 'conditional_4' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'healvalue' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'probability' } },
      data_4: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'valueNode', nodeId: 'data_3' } },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'eventDamageTypeIn', damageTypes: ['physical'] },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_common_dash'],
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const antalBuff8: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { heal_scale: 0.1, healvalue: 300, probability: 0.3 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'conditional_5' } },
  ],
  actionGraph: antalBuff8ActionGraph,
};

const antalBuff9ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const antalBuff9: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_fire_enhance',
    iconPath: '/icons/icon_battle_affix_fire_enhance.webp',
    showInHeadBarCommon: true,
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  actionGraph: antalBuff9ActionGraph,
};

const antalBuff10ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const antalBuff10: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_affix_pulse_enhance',
    iconPath: '/icons/icon_battle_affix_pulse_enhance.webp',
    showInHeadBarCommon: true,
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
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  actionGraph: antalBuff10ActionGraph,
};

const antalBuff11ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_enhance_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0023_antal_ultimate_icon' },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_enhance_pulse',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_3' },
              rate: { kind: 'valueNode', nodeId: 'data_4' },
            },
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0023_antal_ultimate_icon_2' },
          },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const antalBuff11: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 20, healvalue: 500, multiplier: 3, rate: 0.4 },
  attributeModifiers: [],
  lifecycleSequences: { start: { $sequence: 'applyBuff_2' } },
  actionGraph: antalBuff11ActionGraph,
};

export const antal: OperatorDefinition = {
  slug: 'antal',
  gameId: 'ANTAL',
  rarity: 4,
  weaponType: 'arts-unit',
  element: 'electric',
  role: 'supporter',
  mainAttribute: 'intellect',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [15, 40, 65, 91, 116, 129],
    agility: [9, 25, 43, 60, 78, 86],
    intellect: [15, 47, 81, 114, 148, 165],
    will: [9, 25, 41, 58, 74, 82],
    baseAttack: [30, 87, 147, 207, 267, 297],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        antalChr_0023_antal_attack1,
        antalChr_0023_antal_attack2,
        antalChr_0023_antal_attack3,
        antalChr_0023_antal_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: antalChr_0023_antal_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: antalChr_0023_antal_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: antalChr_0023_antal_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: antalChr_0023_antal_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: antalChr_0023_antal_ultimate_skill,
    },
  ],
  dodgeSkill: antalCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0023_antal_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0023_antal_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0023_antal_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0023_antal_attack1',
        'chr_0023_antal_attack2',
        'chr_0023_antal_attack3',
        'chr_0023_antal_attack4',
        'chr_0023_antal_plunging_attack_end',
        'chr_0023_antal_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0023_antal_attack1',
        'chr_0023_antal_attack2',
        'chr_0023_antal_attack3',
        'chr_0023_antal_attack4',
      ],
      defaultSkillKey: 'chr_0023_antal_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [antalComboCondition1, antalComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0023_antal_talent_1',
          blackboardAssignments: { cd: 30, healvalue: [72, 108], multiplier: [0.6, 0.9] },
        },
      ],
    },
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0023_antal_talent_2',
          blackboardAssignments: {
            heal_scale: [0.23, 0.38],
            healvalue: [27, 45],
            probability: 0.3,
          },
        },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'rate',
          operation: 'multiply',
          value: 1.1,
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
          multiplier: 0.9,
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
          blackboardKey: 'potential_3_atb',
          operation: 'add',
          value: 15,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 10 },
        { kind: 'modifyBasePanelStat', stat: 'health', operation: 'percent', value: 0.1 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'delay_time',
          operation: 'add',
          value: 20,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_5_rate',
          operation: 'add',
          value: 0.04,
        },
      ],
    },
  ],
  entityBlackboard: { EntityBB_combo_index: 0, EntityBB_combo_type: 2 },
  buffDefinitions: {
    buff_chr_0023_antal_normal_icon: antalBuff1,
    buff_chr_0023_antal_normal_icon_2: antalBuff2,
    buff_chr_0023_antal_normal_skill: antalBuff3,
    buff_chr_0023_antal_tageffect: antalBuff4,
    buff_chr_0023_antal_talent_1: antalBuff5,
    buff_chr_0023_antal_talent_1_combotrigger: antalBuff6,
    buff_chr_0023_antal_talent_1_heal_trigger: antalBuff7,
    buff_chr_0023_antal_talent_2: antalBuff8,
    buff_chr_0023_antal_ultimate_icon: antalBuff9,
    buff_chr_0023_antal_ultimate_icon_2: antalBuff10,
    buff_chr_0023_antal_utimate_skill: antalBuff11,
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default antal;
