/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const perlicaChr_0004_pelica_attack1ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0004_pelica_attack1_projhit',
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
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_5' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResource_3: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      checkCondition_1: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                        },
                        next: null,
                      },
                      checkCondition_2: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        },
                        next: 'checkCondition_1',
                      },
                      ifElse_4: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_4' },
                          whenTrue: { $sequence: 'changeResource_3' },
                          whenFalse: { $sequence: null },
                        },
                        next: null,
                      },
                      dealDamage_5: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'ifElse_4',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityCountCompare',
                          target: { kind: 'fixed', target: 'enemy' },
                          containsHittableTarget: false,
                          excludeDeadEntity: false,
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_2' },
                        },
                      },
                      data_5: {
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
      reachSkillOperableBoundary_2: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0004_pelica_attack2'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const perlicaChr_0004_pelica_attack1: SkillDefinition = {
  key: 'chr_0004_pelica_attack1',
  element: 'electric',
  blackboard: {
    atb: 0,
    atk_scale: [0.25, 0.28, 0.31, 0.33, 0.36, 0.38, 0.41, 0.43, 0.46, 0.49, 0.53, 0.57],
  },
  timelineBlockFrames: 16,
  naturalDurationFrames: 166,
  exclusiveFrame: 15,
  offsetRecordFrame: 8,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 5,
        endFrame: 27,
        input: 'basicAttack',
        targetSkillId: 'chr_0004_pelica_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 16, endFrame: 27, skillIds: ['chr_0004_pelica_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 8, endFrame: 8, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 16, endFrame: 27, sequence: { $sequence: 'reachSkillOperableBoundary_2' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0004_pelica_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: perlicaChr_0004_pelica_attack1ActionGraph,
};

export const perlicaChr_0004_pelica_attack2ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.100000001490116,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0004_pelica_attack2_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 3,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_4' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResource_2: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 0.3333333 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      ifElse_3: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_2' },
                          whenTrue: { $sequence: 'changeResource_2' },
                          whenFalse: { $sequence: null },
                        },
                        next: null,
                      },
                      dealDamage_4: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'ifElse_3',
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
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0004_pelica_attack3'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const perlicaChr_0004_pelica_attack2: SkillDefinition = {
  key: 'chr_0004_pelica_attack2',
  element: 'electric',
  blackboard: {
    atb: 0,
    atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
  },
  timelineBlockFrames: 18,
  naturalDurationFrames: 168,
  exclusiveFrame: 22,
  offsetRecordFrame: 12,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 28,
        input: 'basicAttack',
        targetSkillId: 'chr_0004_pelica_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 18, endFrame: 28, skillIds: ['chr_0004_pelica_attack3'] }],
  },
  costFrame: 11,
  scheduledSequences: [
    { startFrame: 9, endFrame: 9, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 18, endFrame: 28, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0004_pelica_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: perlicaChr_0004_pelica_attack2ActionGraph,
};

export const perlicaChr_0004_pelica_attack3ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0004_pelica_attack3_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {},
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_5' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResource_3: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      checkCondition_1: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                        },
                        next: null,
                      },
                      checkCondition_2: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        },
                        next: 'checkCondition_1',
                      },
                      ifElse_4: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_4' },
                          whenTrue: { $sequence: 'changeResource_3' },
                          whenFalse: { $sequence: null },
                        },
                        next: null,
                      },
                      dealDamage_5: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: 'ifElse_4',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityCountCompare',
                          target: { kind: 'fixed', target: 'enemy' },
                          containsHittableTarget: false,
                          excludeDeadEntity: false,
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_2' },
                        },
                      },
                      data_5: {
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
      reachSkillOperableBoundary_4: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0004_pelica_attack4'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const perlicaChr_0004_pelica_attack3: SkillDefinition = {
  key: 'chr_0004_pelica_attack3',
  element: 'electric',
  blackboard: {
    atb: 0,
    atk_scale: [0.12, 0.14, 0.15, 0.16, 0.17, 0.19, 0.2, 0.21, 0.22, 0.24, 0.26, 0.28],
  },
  timelineBlockFrames: 26,
  naturalDurationFrames: 173,
  exclusiveFrame: 29,
  offsetRecordFrame: 22,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 8,
        endFrame: 40,
        input: 'basicAttack',
        targetSkillId: 'chr_0004_pelica_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 26, endFrame: 40, skillIds: ['chr_0004_pelica_attack4'] }],
  },
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 16, endFrame: 16, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 19, endFrame: 19, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 22, endFrame: 22, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 26, endFrame: 40, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0004_pelica_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: perlicaChr_0004_pelica_attack3ActionGraph,
};

export const perlicaChr_0004_pelica_attack4ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0004_pelica_attack4_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {},
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_5' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      changeResource_3: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_1' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: null,
                      },
                      checkCondition_1: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                        },
                        next: null,
                      },
                      checkCondition_2: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        },
                        next: 'checkCondition_1',
                      },
                      ifElse_4: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_4' },
                          whenTrue: { $sequence: 'changeResource_3' },
                          whenFalse: { $sequence: null },
                        },
                        next: null,
                      },
                      dealDamage_5: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
                            tags: ['normalAttack', 'normalAttackLastCombo'],
                            stagger: { kind: 'valueNode', nodeId: 'data_6' },
                            staggerOnlyWhenCasterControlled: true,
                          },
                        },
                        next: 'ifElse_4',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityCountCompare',
                          target: { kind: 'fixed', target: 'enemy' },
                          containsHittableTarget: false,
                          excludeDeadEntity: false,
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_2' },
                        },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
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
      reachSkillOperableBoundary_2: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0004_pelica_attack1'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const perlicaChr_0004_pelica_attack4: SkillDefinition = {
  key: 'chr_0004_pelica_attack4',
  element: 'electric',
  blackboard: {
    atb: 15,
    atk_scale: [0.57, 0.62, 0.68, 0.73, 0.79, 0.85, 0.9, 0.96, 1.02, 1.09, 1.17, 1.27],
    poise: 15,
  },
  timelineBlockFrames: 44,
  naturalDurationFrames: 269,
  exclusiveFrame: 43,
  offsetRecordFrame: 27,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 29,
        endFrame: 64,
        input: 'basicAttack',
        targetSkillId: 'chr_0004_pelica_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 54, endFrame: 64, skillIds: ['chr_0004_pelica_attack1'] }],
  },
  costFrame: 13,
  scheduledSequences: [
    { startFrame: 27, endFrame: 27, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 54, endFrame: 64, sequence: { $sequence: 'reachSkillOperableBoundary_2' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0004_pelica_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: perlicaChr_0004_pelica_attack4ActionGraph,
};

export const perlicaChr_0004_pelica_power_attackActionGraph = {
  main: {
    nodes: {
      gainFinisherSp_2: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      applyPhysicalInfliction_3: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'knockDown',
            target: 'enemy',
            duration: { kind: 'constant', value: 1.5 },
            force: true,
            isExtra: false,
            targetFilter: 'skipAll',
            returnWhen: 'always',
          },
        },
        next: 'gainFinisherSp_2',
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'applyPhysicalInfliction_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_4',
      },
      startTimeDilation_7: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'common' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_7' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_full_immune_medium' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_power_attack_disable_cast_skill' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
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

export const perlicaChr_0004_pelica_power_attack: SkillDefinition = {
  key: 'chr_0004_pelica_power_attack',
  element: 'electric',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 51,
  naturalDurationFrames: 135,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 35,
        endFrame: 58,
        skillIds: ['chr_0004_pelica_normal_skill', 'chr_0004_pelica_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 35, endFrame: 44, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 35, endFrame: 38, sequence: { $sequence: 'ifElse_8' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_9' } },
    { startFrame: 0, endFrame: 35, sequence: { $sequence: 'applyBuff_10' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: perlicaChr_0004_pelica_power_attackActionGraph,
};

export const perlicaChr_0004_pelica_plunging_attack_endActionGraph = {
  main: {
    nodes: {
      mergeContextTargets_1: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      changeResource_2: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            onlyMainOperator: true,
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: 'changeResource_2',
      },
      launchProjectile_4: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
          },
          callbacks: [],
        },
        next: null,
      },
      launchProjectile_5: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
          },
          callbacks: [],
        },
        next: 'launchProjectile_4',
      },
      launchProjectile_6: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
          },
          callbacks: [],
        },
        next: 'launchProjectile_5',
      },
      launchProjectile_7: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
          },
          callbacks: [],
        },
        next: 'launchProjectile_6',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const perlicaChr_0004_pelica_plunging_attack_end: SkillDefinition = {
  actionGraph: perlicaChr_0004_pelica_plunging_attack_endActionGraph,
  key: 'chr_0004_pelica_plunging_attack_end',
  element: 'electric',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 168,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 3, endFrame: 7, sequence: { $sequence: 'mergeContextTargets_1' } },
    { startFrame: 3, endFrame: 8, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 1, endFrame: 1, sequence: { $sequence: 'launchProjectile_7' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const perlicaChr_0004_pelica_normal_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      dealDamage_4: {
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
        next: 'applyBuff_3',
      },
      applyElementalInfliction_5: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'electric', isExtra: false },
        },
        next: 'dealDamage_4',
      },
      mergeContextTargets_6: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: 'applyElementalInfliction_5',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const perlicaChr_0004_pelica_normal_skill: SkillDefinition = {
  key: 'chr_0004_pelica_normal_skill',
  element: 'electric',
  blackboard: {
    atk_scale: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.85, 3.02, 3.2, 3.42, 3.69, 4],
    poise: 10,
  },
  timelineBlockFrames: 31,
  naturalDurationFrames: 155,
  exclusiveFrame: 30,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 28, endFrame: 54, skillIds: ['chr_0004_pelica_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 13, endFrame: 13, sequence: { $sequence: 'mergeContextTargets_6' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: perlicaChr_0004_pelica_normal_skillActionGraph,
};

export const perlicaChr_0004_pelica_combo_skillActionGraph = {
  main: {
    nodes: {
      mergeContextTargets_1: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      ifElse_2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'mergeContextTargets_1' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      launchProjectile_3: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: { EntityBB_bounced: 0 },
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { onReach: true, finishOnHit: true },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0004_pelica_combo_skill_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale: 1,
                  duration: 5,
                  extra_scaling: 1,
                  poise: 0,
                  talent2: 0,
                  usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'ifElse_opt2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      checkCondition_1: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                        },
                        next: null,
                      },
                      checkCondition_2: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        },
                        next: 'checkCondition_1',
                      },
                      checkCondition_3: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
                        },
                        next: 'checkCondition_2',
                      },
                      changeResource_6: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'valueNode', nodeId: 'data_6' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                          },
                        },
                        next: null,
                      },
                      checkCondition_7: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
                        },
                        next: 'changeResource_6',
                      },
                      dealDamage_8: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                            tags: ['comboSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'valueNode', nodeId: 'data_9' },
                          },
                        },
                        next: 'checkCondition_7',
                      },
                      applyBuff_9: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [
                              {
                                buffId: 'buff_common_pulse_pulse_conduct_triggered',
                                copiedBlackboardAssignments: {
                                  duration: 'duration',
                                  extra_scaling: 'extra_scaling',
                                },
                              },
                            ],
                            targets: { kind: 'fixed', target: 'enemy' },
                            source: { kind: 'source' },
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'dealDamage_8',
                      },
                      modifyActionValue_opt1: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_bounced',
                            operation: 'assign',
                            value: { kind: 'constant', value: 1 },
                          },
                        },
                        next: null,
                      },
                      ifElse_opt2: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_10' },
                          whenTrue: { $sequence: 'modifyActionValue_opt1' },
                          whenFalse: { $sequence: null },
                        },
                        next: 'applyBuff_9',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'EntityBB_bounced', fallback: 0 },
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
                          kind: 'entityTagMatch',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          tags: ['Skill/Character/Common/NoGuard'],
                        },
                      },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'talent2', fallback: 0 },
                      },
                      data_5: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_4' },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
                      data_7: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityCountCompare',
                          target: { kind: 'fixed', target: 'enemy' },
                          containsHittableTarget: false,
                          excludeDeadEntity: false,
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_8: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                      data_10: {
                        type: 'boolean',
                        expression: {
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_3' },
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
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.833 },
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
      data_1: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const perlicaChr_0004_pelica_combo_skill: SkillDefinition = {
  key: 'chr_0004_pelica_combo_skill',
  element: 'electric',
  blackboard: {
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    duration: 5,
    extra_scaling: 1,
    poise: 10,
    talent2: 0,
    usp: 10,
  },
  timelineBlockFrames: 46,
  naturalDurationFrames: 115,
  exclusiveFrame: 45,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 25, endFrame: 54, skillIds: ['chr_0004_pelica_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 11, sequence: { $sequence: 'ifElse_2' } },
    { startFrame: 24, endFrame: 27, sequence: { $sequence: 'launchProjectile_3' } },
    { startFrame: 0, endFrame: 22, sequence: { $sequence: 'startTimeDilation_4' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 570],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: perlicaChr_0004_pelica_combo_skillActionGraph,
};

export const perlicaChr_0004_pelica_ultimate_skillActionGraph = {
  main: {
    nodes: {
      startUltimateTimeDilation_1: {
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
      hideUi_2: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            instantAttributeModifiers: [
              {
                targetSide: 'attacker',
                attribute: 'criticalRate',
                slot: 'baseAddition',
                value: { kind: 'valueNode', nodeId: 'data_2' },
                attributeTiming: 'runtime',
              },
            ],
            stagger: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: null,
      },
      mergeContextTargets_4: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'targets',
            sources: [{ kind: 'target', target: 'enemy' }],
          },
        },
        next: 'dealDamage_3',
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_damage_immune_ult_skill' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      spawnAbilityEntity_6: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: {
              kind: 'fixedPoint',
              owner: { kind: 'owner' },
              directionTarget: { kind: 'source' },
              center: { kind: 'inputTarget' },
            },
            abilityEntityId: 'abilityentity_chr_0004_pelica_ultimate_skill',
            childSkillId: 'chr_0004_pelica_ultimate_skill_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'crit' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const perlicaChr_0004_pelica_ultimate_skill: SkillDefinition = {
  actionGraph: perlicaChr_0004_pelica_ultimate_skillActionGraph,
  key: 'chr_0004_pelica_ultimate_skill',
  element: 'electric',
  blackboard: {
    atk_scale: [4.45, 4.89, 5.34, 5.78, 6.22, 6.67, 7.11, 7.56, 8, 8.56, 9.23, 10],
    crit: 0,
    poise: 20,
  },
  timelineBlockFrames: 86,
  naturalDurationFrames: 114,
  exclusiveFrame: 85,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 63,
        endFrame: 90,
        skillIds: ['chr_0004_pelica_normal_skill', 'chr_0004_pelica_combo_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'startUltimateTimeDilation_1' } },
    { startFrame: 0, endFrame: 52, sequence: { $sequence: 'hideUi_2' } },
    { startFrame: 58, endFrame: 63, sequence: { $sequence: 'mergeContextTargets_4' } },
    { startFrame: 0, endFrame: 85, sequence: { $sequence: 'applyBuff_5' } },
    { startFrame: 55, endFrame: 58, sequence: { $sequence: 'spawnAbilityEntity_6' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 300,
  costs: [{ resource: 'ultimateEnergy', value: 80 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const perlicaCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const perlicaCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: perlicaCommon_character_perfect_dodgeActionGraph,
  key: 'common_character_perfect_dodge',
  blackboard: {},
  timelineBlockFrames: 16,
  naturalDurationFrames: 15,
  exclusiveFrame: 15,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [],
  defaultTarget: 'enemy',
  skillType: 'dodge',
  nativeSkillType: 'dodge',
};

const perlicaComboCondition1ActionGraph = {
  main: {
    nodes: {
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'checkCondition_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_2',
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
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionInputTargetIdentityMatch',
          other: 'controlledOperator',
          operator: 'equal',
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAll',
          tags: ['normalAttackLastCombo'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const perlicaComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0004_pelica_combo_skill',
  event: 'beforeTakeDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_3' },
  actionGraph: perlicaComboCondition1ActionGraph,
};

const perlicaBuff1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0004_pelica_potential_3_atkup',
                copiedBlackboardAssignments: { atk_up: 'atk_up', atk_duration: 'atk_duration' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const perlicaBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 20,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_duration: 0, atk_up: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
  ],
  actionGraph: perlicaBuff1ActionGraph,
};

const perlicaBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const perlicaBuff2: SkillBuffDefinition = {
  stackingType: 'enhanceAndRefresh',
  priority: 0,
  maxStackCount: 2,
  durationSeconds: { blackboardKey: 'atk_duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_duration: 0, atk_up: 0 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
  ],
  actionGraph: perlicaBuff2ActionGraph,
};

const perlicaBuff3ActionGraph = {
  main: {
    nodes: {
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'poiseCompare',
          target: 'currentTarget',
          returnValueIfMissing: false,
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const perlicaBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: ['Skill/Character/chr_0004_pelica/PelicaTalent0'],
  extendTags: [],
  blackboard: { dmg: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      condition: { $sequence: 'checkCondition_1' },
      processors: [
        {
          kind: 'damageScale',
          side: 'attacker',
          zone: 'normal',
          addition: { blackboardKey: 'dmg' },
        },
      ],
    },
  ],
  actionGraph: perlicaBuff3ActionGraph,
};

export const perlica: OperatorDefinition = {
  slug: 'perlica',
  gameId: 'PERLICA',
  rarity: 5,
  weaponType: 'funnel',
  element: 'electric',
  characterTypeId: 'Pulse',
  role: 'caster',
  mainAttribute: 'intellect',
  secondaryAttribute: 'will',
  attributes: {
    strength: [9, 26, 45, 64, 82, 91],
    agility: [9, 27, 46, 65, 84, 93],
    intellect: [21, 51, 83, 114, 145, 161],
    will: [13, 34, 57, 79, 102, 113],
    baseAttack: [30, 88, 150, 211, 272, 303],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skills: [
        perlicaChr_0004_pelica_attack1,
        perlicaChr_0004_pelica_attack2,
        perlicaChr_0004_pelica_attack3,
        perlicaChr_0004_pelica_attack4,
      ],
    },
    { key: 'finisher', operationType: 'finisher', skills: perlicaChr_0004_pelica_power_attack },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: perlicaChr_0004_pelica_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: perlicaChr_0004_pelica_normal_skill,
    },
    { key: 'comboSkill', operationType: 'comboSkill', skills: perlicaChr_0004_pelica_combo_skill },
    { key: 'ultimate', operationType: 'ultimate', skills: perlicaChr_0004_pelica_ultimate_skill },
  ],
  dodgeSkill: perlicaCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0004_pelica_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0004_pelica_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0004_pelica_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0004_pelica_attack1',
        'chr_0004_pelica_attack2',
        'chr_0004_pelica_attack3',
        'chr_0004_pelica_attack4',
        'chr_0004_pelica_plunging_attack_end',
        'chr_0004_pelica_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0004_pelica_attack1',
        'chr_0004_pelica_attack2',
        'chr_0004_pelica_attack3',
        'chr_0004_pelica_attack4',
      ],
      defaultSkillKey: 'chr_0004_pelica_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [perlicaComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        { buffId: 'buff_chr_0004_pelica_talent_0', blackboardAssignments: { dmg: [0.2, 0.3] } },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0004_pelica_combo_skill',
          blackboardKey: 'talent2',
          operation: 'assign',
          value: 1,
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
          skillKey: 'chr_0004_pelica_combo_skill',
          blackboardKey: 'duration',
          operation: 'multiply',
          value: 1.75,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillKey: 'chr_0004_pelica_ultimate_skill',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0004_pelica_potential_3',
          blackboardAssignments: { atk_duration: 5, atk_up: 0.2, max_stack: 2 },
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0004_pelica_combo_skill',
          blackboardKey: 'extra_scaling',
          operation: 'assign',
          value: 1.33,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0004_pelica_ultimate_skill',
          blackboardKey: 'crit',
          operation: 'add',
          value: 0.3,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0004_pelica_potential_3: perlicaBuff1,
    buff_chr_0004_pelica_potential_3_atkup: perlicaBuff2,
    buff_chr_0004_pelica_talent_0: perlicaBuff3,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0004_pelica_ultimate_skill: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 50 },
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              finishOwner_1: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0004_pelica_ultimate_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 120,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {},
        scheduledSequences: [
          { startFrame: 54, endFrame: 54, sequence: { $sequence: 'finishOwner_1' } },
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default perlica;
