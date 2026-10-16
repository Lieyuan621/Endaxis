/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const laevatainChr_0016_laevat_attack1ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.033 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_4',
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_attack2'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_attack1: SkillDefinition = {
  key: 'chr_0016_laevat_attack1',
  element: 'heat',
  blackboard: {
    atk_scale: [0.16, 0.18, 0.19, 0.21, 0.22, 0.24, 0.26, 0.27, 0.29, 0.31, 0.33, 0.36],
  },
  timelineBlockFrames: 10,
  naturalDurationFrames: 120,
  exclusiveFrame: 16,
  offsetRecordFrame: 6,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 33,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 10, endFrame: 33, skillIds: ['chr_0016_laevat_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 10, endFrame: 33, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0016_laevat_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_attack1ActionGraph,
};

export const laevatainChr_0016_laevat_attack2ActionGraph = {
  main: {
    nodes: {
      changeResource_3: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.5 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            onlyMainOperator: true,
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'changeResource_3',
      },
      startTimeDilation_6: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.08 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      changeResource_8: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.5 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            onlyMainOperator: true,
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'ifElse_7',
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'changeResource_8',
      },
      reachSkillOperableBoundary_10: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_attack3'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_attack2: SkillDefinition = {
  key: 'chr_0016_laevat_attack2',
  element: 'heat',
  blackboard: {
    atb: 0,
    atk_scale: [0.12, 0.13, 0.14, 0.16, 0.17, 0.18, 0.19, 0.2, 0.22, 0.23, 0.25, 0.27],
  },
  timelineBlockFrames: 16,
  naturalDurationFrames: 140,
  exclusiveFrame: 25,
  offsetRecordFrame: 13,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 37,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 16, endFrame: 38, skillIds: ['chr_0016_laevat_attack3'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 6, endFrame: 9, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 13, endFrame: 16, sequence: { $sequence: 'dealDamage_9' } },
    { startFrame: 16, endFrame: 38, sequence: { $sequence: 'reachSkillOperableBoundary_10' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0016_laevat_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_attack2ActionGraph,
};

export const laevatainChr_0016_laevat_attack3ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.05 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      changeResource_4: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.5 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: 'startTimeDilation_3',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_5',
      },
      reachSkillOperableBoundary_7: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_attack4'] },
        },
        next: null,
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

export const laevatainChr_0016_laevat_attack3: SkillDefinition = {
  key: 'chr_0016_laevat_attack3',
  element: 'heat',
  blackboard: {
    atb: 0,
    atk_scale: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56],
  },
  timelineBlockFrames: 12,
  naturalDurationFrames: 105,
  exclusiveFrame: 22,
  offsetRecordFrame: 9,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 32,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 12, endFrame: 32, skillIds: ['chr_0016_laevat_attack4'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 12, endFrame: 32, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0016_laevat_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_attack3ActionGraph,
};

export const laevatainChr_0016_laevat_attack4ActionGraph = {
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
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0016_laevat_attack_5_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'anyCondition_4' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_3: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'heat',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: null,
                      },
                      anyCondition_4: {
                        action: {
                          kind: 'anyCondition',
                          parameters: {},
                          conditions: [
                            { kind: 'conditionNode', nodeId: 'data_2' },
                            { kind: 'conditionNode', nodeId: 'data_3' },
                          ],
                        },
                        next: 'dealDamage_3',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionInputTargetObjectTypeMatch',
                          objectTypes: ['enemy'],
                        },
                      },
                      data_3: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityTagMatch',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          tags: ['Skill/Character/chr_0036_jsspsi/soul/inksoul'],
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
      mergeContextTargets_3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      changeResource_4: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.5 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            onlyMainOperator: true,
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.05 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'changeResource_4',
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_5' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'ifElse_7' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_8',
      },
      reachSkillOperableBoundary_10: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_attack5'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_attack4: SkillDefinition = {
  key: 'chr_0016_laevat_attack4',
  element: 'heat',
  blackboard: {
    atb: 0,
    atk_scale: [0.13, 0.14, 0.16, 0.17, 0.18, 0.2, 0.21, 0.22, 0.23, 0.25, 0.27, 0.29],
  },
  timelineBlockFrames: 22,
  naturalDurationFrames: 121,
  exclusiveFrame: 35,
  offsetRecordFrame: 19,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 5,
        endFrame: 45,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 22, endFrame: 45, skillIds: ['chr_0016_laevat_attack5'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 12, endFrame: 14, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 19, endFrame: 21, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'mergeContextTargets_3' } },
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'dealDamage_9' } },
    { startFrame: 22, endFrame: 45, sequence: { $sequence: 'reachSkillOperableBoundary_10' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0016_laevat_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_attack4ActionGraph,
};

export const laevatainChr_0016_laevat_attack5ActionGraph = {
  main: {
    nodes: {
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack'],
          },
        },
        next: null,
      },
      repeatEachTick_7: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_6' },
        },
        next: null,
      },
      changeResource_9: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
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
      startTimeDilation_10: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: 'changeResource_9',
      },
      ifElse_13: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_10' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'count', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'ifElse_13',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: null,
      },
      checkCondition_12: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_11',
      },
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'modifyActionValue_14' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_16: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_8' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_15',
      },
      repeatEachTick_17: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_16' },
        },
        next: null,
      },
      reachSkillOperableBoundary_18: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_3: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_6: {
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
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_12' } },
      },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_attack5: SkillDefinition = {
  key: 'chr_0016_laevat_attack5',
  element: 'heat',
  blackboard: {
    atb: 20,
    atk_scale: [0.27, 0.29, 0.32, 0.34, 0.37, 0.4, 0.42, 0.45, 0.48, 0.51, 0.55, 0.6],
    count: 0,
    poise: 18,
  },
  timelineBlockFrames: 34,
  naturalDurationFrames: 145,
  exclusiveFrame: 42,
  offsetRecordFrame: 23,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 4,
        endFrame: 46,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 34, endFrame: 46, skillIds: ['chr_0016_laevat_attack1'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 23, endFrame: 26, sequence: { $sequence: 'repeatEachTick_7' } },
    { startFrame: 26, endFrame: 30, sequence: { $sequence: 'repeatEachTick_17' } },
    { startFrame: 34, endFrame: 46, sequence: { $sequence: 'reachSkillOperableBoundary_18' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0016_laevat_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_attack5ActionGraph,
};

export const laevatainChr_0016_laevat_ult_attack1ActionGraph = {
  main: {
    nodes: {
      changeResource_9: {
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
      startTimeDilation_10: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.05 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'changeResource_9',
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'stopped', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'startTimeDilation_10',
      },
      checkCondition_12: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'modifyActionValue_11',
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_12',
      },
      ifElse_14: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'checkCondition_13' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_15: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_14',
      },
      repeatEachTick_16: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_15' },
        },
        next: null,
      },
      modifyActionValue_17: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'repeatEachTick_16',
      },
      reachSkillOperableBoundary_19: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_ult_attack2', 'chr_0016_laevat_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'stopped', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_4: {
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
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_ult_attack1: SkillDefinition = {
  key: 'chr_0016_laevat_ult_attack1',
  element: 'heat',
  blackboard: {
    atb: 0,
    atk_scale: [0.65, 0.71, 0.78, 0.84, 0.91, 0.97, 1.04, 1.1, 1.17, 1.25, 1.34, 1.46],
    ratio: 1,
    stopped: 0,
  },
  timelineBlockFrames: 17,
  naturalDurationFrames: 155,
  exclusiveFrame: 25,
  offsetRecordFrame: 11,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 32,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_ult_attack2',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 17,
        endFrame: 32,
        skillIds: ['chr_0016_laevat_ult_attack2', 'chr_0016_laevat_attack1'],
      },
      { startFrame: 17, endFrame: 32, skillIds: ['chr_0016_laevat_ult_attack2'] },
    ],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 12, endFrame: 24, sequence: { $sequence: 'modifyActionValue_17' } },
    { startFrame: 17, endFrame: 32, sequence: { $sequence: 'reachSkillOperableBoundary_19' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0016_laevat_ult_attack2',
  skillType: 'basicAttack',
  levelSource: 'ultimate',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_ult_attack1ActionGraph,
};

export const laevatainChr_0016_laevat_ult_attack2ActionGraph = {
  main: {
    nodes: {
      changeResource_19: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 0.5 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            onlyMainOperator: true,
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      startTimeDilation_20: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.05 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'changeResource_19',
      },
      modifyActionValue_21: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'stopped1', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'startTimeDilation_20',
      },
      checkCondition_22: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'modifyActionValue_21',
      },
      checkCondition_23: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_22',
      },
      ifElse_24: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'checkCondition_23' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_25: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_24',
      },
      repeatEachTick_26: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_25' },
        },
        next: null,
      },
      modifyActionValue_27: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'repeatEachTick_26',
      },
      modifyActionValue_31: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'stopped2', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'startTimeDilation_20',
      },
      checkCondition_32: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'modifyActionValue_31',
      },
      checkCondition_33: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'checkCondition_32',
      },
      ifElse_34: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_11' },
          whenTrue: { $sequence: 'checkCondition_33' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_35: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_34',
      },
      repeatEachTick_36: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_35' },
        },
        next: null,
      },
      reachSkillOperableBoundary_38: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_ult_attack3', 'chr_0016_laevat_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'stopped1', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_4: {
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
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'stopped2', fallback: 0 } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_10: {
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
      data_11: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_ult_attack2: SkillDefinition = {
  key: 'chr_0016_laevat_ult_attack2',
  element: 'heat',
  blackboard: {
    atb: 0,
    atk_scale: [0.41, 0.45, 0.49, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.78, 0.84, 0.91],
    ratio: 1,
    stopped1: 0,
    stopped2: 0,
  },
  timelineBlockFrames: 27,
  naturalDurationFrames: 245,
  exclusiveFrame: 36,
  offsetRecordFrame: 10,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 44,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_ult_attack3',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 27,
        endFrame: 44,
        skillIds: ['chr_0016_laevat_ult_attack3', 'chr_0016_laevat_attack1'],
      },
      { startFrame: 27, endFrame: 44, skillIds: ['chr_0016_laevat_ult_attack3'] },
    ],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 10, endFrame: 19, sequence: { $sequence: 'modifyActionValue_27' } },
    { startFrame: 21, endFrame: 29, sequence: { $sequence: 'repeatEachTick_36' } },
    { startFrame: 27, endFrame: 44, sequence: { $sequence: 'reachSkillOperableBoundary_38' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0016_laevat_ult_attack3',
  skillType: 'basicAttack',
  levelSource: 'ultimate',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_ult_attack2ActionGraph,
};

export const laevatainChr_0016_laevat_ult_attack3ActionGraph = {
  main: {
    nodes: {
      changeResource_8: {
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
      startTimeDilation_9: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.12 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'changeResource_8',
      },
      modifyActionValue_10: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'stopped', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'startTimeDilation_9',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'modifyActionValue_10',
      },
      checkCondition_12: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_11',
      },
      ifElse_13: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'checkCondition_12' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_14: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_13',
      },
      applyElementalInfliction_15: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'heat', isExtra: false },
        },
        next: 'dealDamage_14',
      },
      repeatEachTick_16: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'applyElementalInfliction_15' },
        },
        next: null,
      },
      modifyActionValue_17: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'repeatEachTick_16',
      },
      reachSkillOperableBoundary_19: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_ult_attack4', 'chr_0016_laevat_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'stopped', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_4: {
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
      data_5: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_ult_attack3: SkillDefinition = {
  key: 'chr_0016_laevat_ult_attack3',
  element: 'heat',
  blackboard: {
    atb: 0,
    atk_scale: [1.15, 1.27, 1.39, 1.5, 1.62, 1.73, 1.85, 1.96, 2.08, 2.22, 2.4, 2.6],
    ratio: 1,
    stopped: 0,
  },
  timelineBlockFrames: 14,
  naturalDurationFrames: 180,
  exclusiveFrame: 20,
  offsetRecordFrame: 9,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 28,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_ult_attack4',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 14,
        endFrame: 28,
        skillIds: ['chr_0016_laevat_ult_attack4', 'chr_0016_laevat_attack1'],
      },
      { startFrame: 14, endFrame: 28, skillIds: ['chr_0016_laevat_ult_attack4'] },
    ],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 9, endFrame: 23, sequence: { $sequence: 'modifyActionValue_17' } },
    { startFrame: 14, endFrame: 28, sequence: { $sequence: 'reachSkillOperableBoundary_19' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0016_laevat_ult_attack4',
  skillType: 'basicAttack',
  levelSource: 'ultimate',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_ult_attack3ActionGraph,
};

export const laevatainChr_0016_laevat_ult_attack4ActionGraph = {
  main: {
    nodes: {
      dealDamage_14: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack'],
          },
        },
        next: null,
      },
      repeatEachTick_15: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_14' },
        },
        next: null,
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'repeatEachTick_15',
      },
      changeResource_18: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      checkCondition_19: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'changeResource_18',
      },
      startTimeDilation_20: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.25 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'checkCondition_19',
      },
      modifyActionValue_21: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'stopped', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'startTimeDilation_20',
      },
      checkCondition_22: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'modifyActionValue_21',
      },
      checkCondition_23: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'checkCondition_22',
      },
      ifElse_24: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'checkCondition_23' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_25: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_9' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_24',
      },
      repeatEachTick_26: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_25' },
        },
        next: null,
      },
      reachSkillOperableBoundary_28: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0016_laevat_ult_attack1', 'chr_0016_laevat_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'stopped', fallback: 0 } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
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
      data_8: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_ult_attack4: SkillDefinition = {
  key: 'chr_0016_laevat_ult_attack4',
  element: 'heat',
  blackboard: {
    atb: 22,
    atk_scale: [1.01, 1.11, 1.22, 1.32, 1.42, 1.52, 1.62, 1.72, 1.82, 1.95, 2.1, 2.28],
    poise: 24,
    ratio: 1,
    stopped: 0,
  },
  timelineBlockFrames: 35,
  naturalDurationFrames: 181,
  exclusiveFrame: 47,
  offsetRecordFrame: 22,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 68,
        input: 'basicAttack',
        targetSkillId: 'chr_0016_laevat_ult_attack1',
      },
    ],
    allowedNextSkills: [
      {
        startFrame: 35,
        endFrame: 68,
        skillIds: ['chr_0016_laevat_ult_attack1', 'chr_0016_laevat_attack1'],
      },
      { startFrame: 35, endFrame: 68, skillIds: ['chr_0016_laevat_ult_attack1'] },
    ],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 22, endFrame: 26, sequence: { $sequence: 'modifyActionValue_16' } },
    { startFrame: 26, endFrame: 35, sequence: { $sequence: 'repeatEachTick_26' } },
    { startFrame: 35, endFrame: 68, sequence: { $sequence: 'reachSkillOperableBoundary_28' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0016_laevat_ult_attack1',
  skillType: 'basicAttack',
  levelSource: 'ultimate',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_ult_attack4ActionGraph,
};

export const laevatainChr_0016_laevat_power_attackActionGraph = {
  main: {
    nodes: {
      changeResource_4: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'constant', value: 0 },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'default',
          },
        },
        next: null,
      },
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.15 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'changeResource_4',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_5' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.2,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_6',
      },
      gainFinisherSp_9: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: null,
      },
      startTimeDilation_10: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.45 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1,
                  inTangent: -2.315953,
                  outTangent: -2.315953,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.3436488,
                  value: 0.2041256,
                  inTangent: -0.6439322,
                  outTangent: 0.0176236,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.8204471,
                  value: 0.3652225,
                  inTangent: 0.4345389,
                  outTangent: 2.729132,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 3.535323,
                  outTangent: 3.535323,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_10' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'gainFinisherSp_9' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_11',
      },
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.8,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_12',
      },
      applyBuff_14: {
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
      applyBuff_15: {
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
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_4: { type: 'boolean', expression: { kind: 'casterControlled' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_power_attack: SkillDefinition = {
  key: 'chr_0016_laevat_power_attack',
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 51,
  naturalDurationFrames: 141,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 42,
        endFrame: 62,
        skillIds: ['chr_0016_laevat_normal_skill', 'chr_0016_laevat_combo_skill'],
      },
    ],
  },
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 5, endFrame: 11, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 42, endFrame: 46, sequence: { $sequence: 'dealDamage_13' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_14' } },
    { startFrame: 0, endFrame: 42, sequence: { $sequence: 'applyBuff_15' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: laevatainChr_0016_laevat_power_attackActionGraph,
};

export const laevatainChr_0016_laevat_plunging_attack_endActionGraph = {
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
            onlyMainOperator: true,
            spGainKind: 'gain',
            spGainSource: 'normalAttack',
          },
        },
        next: null,
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'changeResource_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: 'ifElse_4',
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

export const laevatainChr_0016_laevat_plunging_attack_end: SkillDefinition = {
  key: 'chr_0016_laevat_plunging_attack_end',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 14,
  naturalDurationFrames: 145,
  exclusiveFrame: 13,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [{ startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_5' } }],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: laevatainChr_0016_laevat_plunging_attack_endActionGraph,
};

export const laevatainChr_0016_laevat_normal_skillActionGraph = {
  main: {
    nodes: {
      jumpTimeline_1: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 231 },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_has_max_energy' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'applyBuff_2',
      },
      finishBuffsById_5: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0016_laevat_has_max_energy'],
            reason: 'other',
          },
        },
        next: null,
      },
      jumpTimeline_6: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 80 },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
        },
        next: 'finishBuffsById_5',
      },
      jumpTimeline_7: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 215 },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
        },
        next: null,
      },
      spawnAbilityEntity_11: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'source' },
            abilityEntityId: 'abilityentity_chr_0016_laevat_normal_skill',
            childSkillId: 'chr_0016_laevat_normal_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            saveToContextKey: 'ball',
          },
        },
        next: null,
      },
      changeResource_13: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_5' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      changeResource_14: {
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
      checkCondition_15: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'changeResource_14',
      },
      startTimeDilation_16: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.35 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'checkCondition_15',
      },
      dealDamage_17: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_9' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: 'startTimeDilation_16',
      },
      ifElse_18: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_11' },
          whenTrue: { $sequence: 'changeResource_13' },
          whenFalse: { $sequence: null },
        },
        next: 'dealDamage_17',
      },
      modifyActionValue_19: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'second_hit',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'ifElse_18',
      },
      applyBuff_20: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_fire_fire_burning_triggered',
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
        next: 'modifyActionValue_19',
      },
      repeatEachTick_21: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'applyBuff_20' },
        },
        next: null,
      },
      finishBuffsById_22: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0016_laevat_energy'],
            reason: 'other',
          },
        },
        next: 'repeatEachTick_21',
      },
      modifyActionValue_23: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale_3',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_12' },
          },
        },
        next: 'finishBuffsById_22',
      },
      finishOwner_24: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'context', key: 'ball' } } },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 4 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_has_max_energy'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'extra_usp' } },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'second_hit', fallback: 0 },
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
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'poise_extra' } },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_normal_skill: SkillDefinition = {
  key: 'chr_0016_laevat_normal_skill',
  element: 'heat',
  blackboard: {
    atb: 0,
    atk_scale: [0.62, 0.68, 0.75, 0.81, 0.87, 0.93, 0.99, 1.06, 1.12, 1.2, 1.29, 1.4],
    atk_scale_2: [0.06, 0.07, 0.08, 0.08, 0.09, 0.09, 0.1, 0.11, 0.11, 0.12, 0.13, 0.14],
    atk_scale_3: [3.42, 3.76, 4.1, 4.45, 4.79, 5.13, 5.47, 5.81, 6.16, 6.58, 7.1, 7.7],
    count: 4,
    duration: 5,
    extra_scaling: 1,
    extra_usp: 100,
    poise: 10,
    poise_extra: 10,
    ratio: 1,
    second_hit: 0,
  },
  timelineBlockFrames: 118,
  naturalDurationFrames: 282,
  exclusiveFrame: 117,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 214, endFrame: 215, sequence: { $sequence: 'jumpTimeline_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'checkCondition_3' } },
    { startFrame: 30, endFrame: 31, sequence: { $sequence: 'jumpTimeline_6' } },
    { startFrame: 37, endFrame: 51, sequence: { $sequence: 'jumpTimeline_7' } },
    { startFrame: 4, endFrame: 7, sequence: { $sequence: 'spawnAbilityEntity_11' } },
    { startFrame: 104, endFrame: 105, sequence: { $sequence: 'modifyActionValue_23' } },
    { startFrame: 105, endFrame: 109, sequence: { $sequence: 'finishOwner_24' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: laevatainChr_0016_laevat_normal_skillActionGraph,
};

export const laevatainChr_0016_laevat_normal_skill_during_ultActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_has_max_energy' }],
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
      jumpTimeline_6: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 75 },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
        },
        next: null,
      },
      jumpTimeline_7: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 196 },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
        },
        next: null,
      },
      jumpTimeline_12: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 270 },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
        },
        next: null,
      },
      modifyActionValue_15: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'triggered_burning',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: null,
      },
      checkCondition_14: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'checkCondition_13',
      },
      applyBuff_16: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_energy' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      modifyActionValue_17: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'entered', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'applyBuff_16',
      },
      applyBuff_18: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'modifyActionValue_17',
      },
      checkCondition_19: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'applyBuff_18',
      },
      startTimeDilation_20: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.15 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'checkCondition_19',
      },
      dealDamage_21: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_10' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'startTimeDilation_20',
      },
      ifElse_22: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_12' },
          whenTrue: { $sequence: 'modifyActionValue_15' },
          whenFalse: { $sequence: null },
        },
        next: 'dealDamage_21',
      },
      repeatEachTick_23: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'ifElse_22' },
        },
        next: null,
      },
      modifyActionValue_27: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'entered', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      applyBuff_28: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'modifyActionValue_27',
      },
      checkCondition_29: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
        },
        next: 'applyBuff_28',
      },
      startTimeDilation_30: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.25 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: 'checkCondition_29',
      },
      dealDamage_31: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_14' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'startTimeDilation_30',
      },
      ifElse_32: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_15' },
          whenTrue: { $sequence: 'modifyActionValue_15' },
          whenFalse: { $sequence: null },
        },
        next: 'dealDamage_31',
      },
      repeatEachTick_33: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'ifElse_32' },
        },
        next: null,
      },
      changeResource_35: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_16' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      startTimeDilation_36: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.65 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      checkCondition_37: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' } },
        },
        next: 'startTimeDilation_36',
      },
      dealDamage_38: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_19' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'checkCondition_37',
      },
      ifElse_39: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_20' },
          whenTrue: { $sequence: 'changeResource_35' },
          whenFalse: { $sequence: null },
        },
        next: 'dealDamage_38',
      },
      modifyActionValue_40: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'second_hit',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'ifElse_39',
      },
      applyBuff_41: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_fire_fire_burning_triggered',
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
        next: 'modifyActionValue_40',
      },
      repeatEachTick_42: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'applyBuff_41' },
        },
        next: null,
      },
      finishBuffsById_43: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0016_laevat_energy'],
            reason: 'other',
          },
        },
        next: 'repeatEachTick_42',
      },
      modifyActionValue_44: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale_3',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_21' },
          },
        },
        next: 'finishBuffsById_43',
      },
      applyBuff_62: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_pause_ult' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 4 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_has_max_energy'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'triggered_burning', fallback: 0 },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'enemy',
          buffIds: ['buff_common_energy_shard_attached_fire'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'entered', fallback: 0 } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_12: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_14' } },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_8' },
          operator: 'equal',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_15: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_14' } },
      },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_17: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'second_hit', fallback: 0 },
      },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_17' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_17' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'ratio' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_normal_skill_during_ult: SkillDefinition = {
  key: 'chr_0016_laevat_normal_skill_during_ult',
  element: 'heat',
  blackboard: {
    atb: 0,
    atk_scale: [1.47, 1.61, 1.76, 1.91, 2.05, 2.2, 2.35, 2.49, 2.64, 2.82, 3.04, 3.3],
    atk_scale_2: [1.64, 1.81, 1.97, 2.14, 2.3, 2.47, 2.63, 2.79, 2.96, 3.16, 3.41, 3.7],
    atk_scale_3: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9],
    duration: 5,
    entered: 0,
    extra_scaling: 1,
    poise: 10,
    ratio: 1,
    second_hit: 0,
    triggered_burning: 0,
  },
  timelineBlockFrames: 116,
  naturalDurationFrames: 271,
  exclusiveFrame: 115,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 33,
        endFrame: 75,
        skillIds: ['chr_0016_laevat_normal_skill', 'chr_0016_laevat_normal_skill_during_ult'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'checkCondition_2' } },
    { startFrame: 24, endFrame: 27, sequence: { $sequence: 'jumpTimeline_6' } },
    { startFrame: 39, endFrame: 40, sequence: { $sequence: 'jumpTimeline_7' } },
    { startFrame: 195, endFrame: 196, sequence: { $sequence: 'jumpTimeline_12' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'repeatEachTick_23' } },
    { startFrame: 23, endFrame: 24, sequence: { $sequence: 'repeatEachTick_33' } },
    { startFrame: 98, endFrame: 99, sequence: { $sequence: 'modifyActionValue_44' } },
    { startFrame: 0, endFrame: 115, sequence: { $sequence: 'applyBuff_62' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  icon: 'endaxis:operators/laevatain/battle_02',
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: laevatainChr_0016_laevat_normal_skill_during_ultActionGraph,
};

export const laevatainChr_0016_laevat_ultimate_skillActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: [
              'buff_chr_0016_laevat_ult_dash',
              'buff_chr_0016_laevat_show_weapon',
              'buff_chr_0016_laevat_ring_start_asset',
              'buff_chr_0016_laevat_ult_dash',
              'buff_chr_0016_laevat_ult_end',
              'buff_chr_0016_laevat_ultimate_sfx_loop',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      startTimeDilation_2: {
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
      hideUi_3: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_4: {
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
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_show_weapon' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_6: {
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_ultimate_skill: SkillDefinition = {
  actionGraph: laevatainChr_0016_laevat_ultimate_skillActionGraph,
  key: 'chr_0016_laevat_ultimate_skill',
  element: 'heat',
  blackboard: {},
  timelineBlockFrames: 74,
  naturalDurationFrames: 245,
  exclusiveFrame: 73,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_2' } },
    { startFrame: 0, endFrame: 61, sequence: { $sequence: 'hideUi_3' } },
    { startFrame: 0, endFrame: 61, sequence: { $sequence: 'startUltimateTimeDilation_4' } },
    { startFrame: 0, endFrame: 87, sequence: { $sequence: 'applyBuff_5' } },
    { startFrame: 0, endFrame: 73, sequence: { $sequence: 'applyBuff_6' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 300,
  costs: [{ resource: 'ultimateEnergy', value: 300 }],
  enhancementStateBuffId: 'buff_chr_0016_laevat_show_weapon',
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const laevatainChr_0016_laevat_combo_skillActionGraph = {
  main: {
    nodes: {
      mergeContextTargets_2: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
        },
        next: null,
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'index', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0016_laevat_combo_skill_start',
                blackboardAssignments: { trigger: { kind: 'constant', value: 0.55 } },
                copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0016_laevat_combo_skill_start',
                blackboardAssignments: { trigger: { kind: 'constant', value: 0.6 } },
                copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0016_laevat_combo_skill_start',
                blackboardAssignments: { trigger: { kind: 'constant', value: 0.65 } },
                copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0016_laevat_combo_skill_start',
                blackboardAssignments: { trigger: { kind: 'constant', value: 0.7 } },
                copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
              },
            ],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_combo_skill_hitstop' }],
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      switch_11: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_1' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'applyBuff_5' } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: 'applyBuff_6' } },
            { value: { kind: 'constant', value: 3 }, sequence: { $sequence: 'applyBuff_7' } },
            { value: { kind: 'constant', value: 4 }, sequence: { $sequence: 'applyBuff_9' } },
            { value: { kind: 'constant', value: 5 }, sequence: { $sequence: 'applyBuff_9' } },
          ],
        },
        next: 'applyBuff_10',
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'modifyActionValue_4' },
          whenFalse: { $sequence: null },
        },
        next: 'switch_11',
      },
      forEachContextTarget_13: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'tar' } },
          body: { $sequence: 'ifElse_12' },
        },
        next: null,
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_combo_skill_hit_self' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'forEachContextTarget_13',
      },
      launchProjectile_15: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            targets: { kind: 'context', contextKey: 'tar' },
          },
          callbacks: [],
        },
        next: 'applyBuff_14',
      },
      ifElse_16: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'mergeContextTargets_2' },
        },
        next: 'launchProjectile_15',
      },
      applyBuff_17: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0016_laevat_ult_end',
                blackboardAssignments: { duration: { kind: 'constant', value: 0.1 } },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_18: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0016_laevat_show_weapon',
                blackboardAssignments: { duration: { kind: 'constant', value: 0.1 } },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_17',
      },
      checkCondition_19: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'applyBuff_18',
      },
      repeatEachTick_20: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'owner' },
              executeEachFrame: false,
              triggerIntervalSeconds: 0.1,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds: 0,
            },
          },
          body: { $sequence: 'checkCondition_19' },
        },
        next: null,
      },
      mergeContextTargets_26: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'tar',
            sources: [{ kind: 'context', contextKey: 'smart_target' }],
          },
        },
        next: null,
      },
      modifyActionValue_21: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'count',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: null,
      },
      checkCondition_22: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
        },
        next: 'modifyActionValue_21',
      },
      modifyActionValue_23: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'count', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'checkCondition_22',
      },
      forEachContextTarget_25: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'tar' } },
          body: { $sequence: 'modifyActionValue_23' },
        },
        next: null,
      },
      ifElse_27: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'forEachContextTarget_25' },
          whenFalse: { $sequence: 'mergeContextTargets_26' },
        },
        next: null,
      },
      findTargets_28: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'hasAny',
              tags: [
                'Skill/Character/Common/SpellStatus/Burning',
                'Skill/Character/Common/SpellStatus/Corrupt',
              ],
            },
            saveToContextKey: 'tar',
          },
        },
        next: 'ifElse_27',
      },
      createSpatialPointTargets_29: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: { saveToContextKey: 'right_pos', count: { kind: 'constant', value: 1 } },
        },
        next: 'findTargets_28',
      },
      startTimeDilation_33: {
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
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'index' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'index', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'less',
          right: { kind: 'constant', value: 5 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'tar' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_ult_end'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'limit' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'count', fallback: 0 } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'limit', fallback: 0 } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_7' },
          operator: 'greaterOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_8' },
        },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'tar' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainChr_0016_laevat_combo_skill: SkillDefinition = {
  key: 'chr_0016_laevat_combo_skill',
  element: 'heat',
  blackboard: {
    atk_scale: [2.4, 2.64, 2.88, 3.12, 3.36, 3.6, 3.84, 4.08, 4.32, 4.62, 4.98, 5.4],
    count: 0,
    index: 0,
    limit: 5,
    poise: 10,
  },
  timelineBlockFrames: 58,
  naturalDurationFrames: 180,
  exclusiveFrame: 57,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 41,
        endFrame: 85,
        skillIds: ['chr_0016_laevat_normal_skill', 'chr_0016_laevat_normal_skill_during_ult'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 20, endFrame: 56, sequence: { $sequence: 'ifElse_16' } },
    { startFrame: 0, endFrame: 57, sequence: { $sequence: 'repeatEachTick_20' } },
    { startFrame: 5, endFrame: 8, sequence: { $sequence: 'createSpatialPointTargets_29' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_33' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 270],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: laevatainChr_0016_laevat_combo_skillActionGraph,
};

export const laevatainCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const laevatainCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: laevatainCommon_character_perfect_dodgeActionGraph,
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

const laevatainComboCondition1ActionGraph = {
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
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: [
            'Skill/Character/Common/SpellStatus/Burning',
            'Skill/Character/Common/SpellStatus/Corrupt',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0016_laevat_combo_skill',
  event: 'addedBuff',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_1' },
  actionGraph: laevatainComboCondition1ActionGraph,
};

const laevatainBuff1ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            finish: 'firstTickReach',
            recycleDelaySeconds: 5,
          },
          callbacks: [],
        },
        next: null,
      },
      finishBuffsByTag_2: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'inputTarget' },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'launchProjectile_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'finishBuffsByTag_2',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffStackCompare',
          target: 'buffOwner',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff1: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 3,
  triggerIntervalSeconds: 0.5,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'checkCondition_3' }] },
  actionGraph: laevatainBuff1ActionGraph,
};

const laevatainBuff2ActionGraph = {
  main: {
    nodes: {
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_13: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'ifElse_10' },
          whenFalse: { $sequence: 'ifElse_10' },
        },
        next: null,
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_combo_skill_usp' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'ifElse_13' },
          whenFalse: { $sequence: 'ifElse_13' },
        },
        next: 'applyBuff_14',
      },
      dealDamage_16: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'heat',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'ifElse_15',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_7' } },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_7' } },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_7' } },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff2: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  triggerIntervalSeconds: 0.7,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0, poise: 0 },
  attributeModifiers: [],
  scheduledSequences: [{ startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_16' } }],
  actionGraph: laevatainBuff2ActionGraph,
};

const laevatainBuff3ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_energy' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  scheduledSequences: [{ startFrame: 21, endFrame: 24, sequence: { $sequence: 'applyBuff_1' } }],
  actionGraph: laevatainBuff3ActionGraph,
};

const laevatainBuff4ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
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
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff4: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 25, endFrame: 28, sequence: { $sequence: 'startTimeDilation_1' } },
  ],
  actionGraph: laevatainBuff4ActionGraph,
};

const laevatainBuff5ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0016_laevat_combo_skill_hit',
                copiedBlackboardAssignments: { poise: 'poise', atk_scale: 'atk_scale' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff5: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  triggerIntervalSeconds: { blackboardKey: 'trigger' },
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_scale: 0, poise: 0, trigger: 1 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: laevatainBuff5ActionGraph,
};

const laevatainBuff6ActionGraph = {
  main: {
    nodes: {
      changeResource_1: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_1' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: null,
      },
      changeResource_2: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: null,
      },
      changeResource_3: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_3' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: null,
      },
      changeResource_4: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
          },
        },
        next: null,
      },
      switch_5: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_5' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 0 }, sequence: { $sequence: 'changeResource_1' } },
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'changeResource_2' } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: 'changeResource_3' } },
            { value: { kind: 'constant', value: 3 }, sequence: { $sequence: 'changeResource_4' } },
          ],
        },
        next: null,
      },
      readBuffStackCount_6: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['buff_chr_0016_laevat_combo_skill_usp'] },
          },
        },
        next: 'switch_5',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp_1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'usp_2' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'usp_3' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'usp_4' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff6: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 3,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0, usp_1: 25, usp_2: 5, usp_3: 5, usp_4: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'readBuffStackCount_6' }] },
  actionGraph: laevatainBuff6ActionGraph,
};

const laevatainBuff7ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0016_laevat_energy_icon_5',
                copiedBlackboardAssignments: {
                  ignore_fire_resist: 'ignore_fire_resist',
                  ignore_fire_resist_duration: 'ignore_fire_resist_duration',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      switch_2: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_1' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'valueNode', nodeId: 'data_2' },
              sequence: { $sequence: 'applyBuff_1' },
            },
          ],
        },
        next: null,
      },
      setCharacterPassiveUiValue_3: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'valueNode', nodeId: 'data_1' } },
        },
        next: 'switch_2',
      },
      readBuffStackCount_4: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'buffOwner',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['buff_chr_0016_laevat_energy'] },
          },
        },
        next: 'setCharacterPassiveUiValue_3',
      },
      setCharacterPassiveUiValue_5: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      readBuffBlackboard_6: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: ['buff_chr_0016_laevat_passive'] },
            desiredKey: 'ignore_fire_resist_duration',
            outputKey: 'ignore_fire_resist_duration',
          },
        },
        next: null,
      },
      readBuffBlackboard_7: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'buffOwner',
            query: { kind: 'id', buffIds: ['buff_chr_0016_laevat_passive'] },
            desiredKey: 'ignore_fire_resist',
            outputKey: 'ignore_fire_resist',
          },
        },
        next: 'readBuffBlackboard_6',
      },
      finishBuffsById_8: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0016_laevat_energy_icon_5'],
            reason: 'other',
          },
        },
        next: null,
      },
      setCharacterPassiveUiValue_9: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
        },
        next: 'finishBuffsById_8',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff7: SkillBuffDefinition = {
  stackingType: 'enhance',
  priority: 0,
  maxStackCount: { blackboardKey: 'max_stack' },
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0, ignore_fire_resist: 0, ignore_fire_resist_duration: 0, max_stack: 4 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'setCharacterPassiveUiValue_5' }, { $sequence: 'readBuffBlackboard_7' }],
    enhanceChanged: [{ $sequence: 'readBuffStackCount_4' }],
    finish: [{ $sequence: 'setCharacterPassiveUiValue_9' }],
  },
  actionGraph: laevatainBuff7ActionGraph,
};

const laevatainBuff8ActionGraph = {
  main: {
    nodes: {
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0016_laevat_ignore_fire_resist',
                copiedBlackboardAssignments: {
                  ignore_fire_resist_duration: 'ignore_fire_resist_duration',
                  ignore_fire_resist: 'ignore_fire_resist',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff8: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 5,
  maxStackCount: 5,
  applyTags: [],
  extendTags: [],
  blackboard: { ignore_fire_resist: 0, ignore_fire_resist_duration: 0 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: null }, { $sequence: 'applyBuff_2' }] },
  actionGraph: laevatainBuff8ActionGraph,
};

const laevatainBuff9ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff9: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 1,
  maxStackCount: 5,
  durationSeconds: 2,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: laevatainBuff9ActionGraph,
};

const laevatainBuff10ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff10: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'ignore_fire_resist_duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_laevat_potential_1',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { ignore_fire_resist: 0, ignore_fire_resist_duration: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'attacker',
      processors: [
        {
          kind: 'instantAttribute',
          targetSide: 'defender',
          attribute: 'FireResistance',
          values: { slot: 'baseAddition', value: { blackboardKey: 'ignore_fire_resist' } },
          attributeTiming: 'runtime',
        },
      ],
    },
  ],
  lifecycleSequences: { enable: [{ $sequence: null }] },
  actionGraph: laevatainBuff10ActionGraph,
};

const laevatainBuff11ActionGraph = {
  main: {
    nodes: {
      aura_1: {
        action: {
          kind: 'aura',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            buffs: [{ buffId: 'buff_chr_0016_laevat_passive_enemy' }],
          },
          onEnter: { $sequence: null },
          onExit: { $sequence: null },
        },
        next: null,
      },
      aura_2: {
        action: {
          kind: 'aura',
          parameters: {
            targets: { kind: 'characterTeam', excludeOwner: false },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            buffs: [
              {
                buffId: 'buff_chr_0016_laevat_passive_teammate',
                blackboardAssignments: { max_stack: { kind: 'valueNode', nodeId: 'data_1' } },
                stringBlackboardAssignments: {},
              },
            ],
          },
          onEnter: { $sequence: null },
          onExit: { $sequence: null },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff11: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { ignore_fire_resist: 0, ignore_fire_resist_duration: 0, max_stack: 4 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'aura_1' }, { $sequence: 'aura_2' }] },
  actionGraph: laevatainBuff11ActionGraph,
};

const laevatainBuff12ActionGraph = {
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
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventInflictionElementIn', elements: ['heat'] },
      },
      data_2: {
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

const laevatainBuff12: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeTakeInfliction', priority: 0, sequence: { $sequence: 'checkCondition_1' } },
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
  ],
  actionGraph: laevatainBuff12ActionGraph,
};

const laevatainBuff13ActionGraph = {
  main: {
    nodes: {
      applyBuff_22: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_energy' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      finishBuffsByTag_23: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_22',
      },
      checkCondition_24: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'finishBuffsByTag_23',
      },
      applyBuff_25: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_energy' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'checkCondition_24',
      },
      finishBuffsByTag_26: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_25',
      },
      checkCondition_27: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'finishBuffsByTag_26',
      },
      applyBuff_28: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_energy' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'checkCondition_27',
      },
      finishBuffsByTag_29: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_28',
      },
      checkCondition_30: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'finishBuffsByTag_29',
      },
      launchProjectile_31: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            finish: 'firstTickReach',
            recycleDelaySeconds: 5,
          },
          callbacks: [],
        },
        next: 'checkCondition_30',
      },
      applyBuff_32: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_energy' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'launchProjectile_31',
      },
      finishBuffsByTag_33: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_32',
      },
      checkCondition_34: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'finishBuffsByTag_33',
      },
      launchProjectile_18: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            finish: 'firstTickReach',
            recycleDelaySeconds: 5,
          },
          callbacks: [],
        },
        next: 'checkCondition_27',
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_energy' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'launchProjectile_18',
      },
      finishBuffsByTag_20: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_19',
      },
      checkCondition_21: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'finishBuffsByTag_20',
      },
      launchProjectile_8: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            finish: 'firstTickReach',
            recycleDelaySeconds: 5,
          },
          callbacks: [],
        },
        next: 'checkCondition_24',
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_energy' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'launchProjectile_8',
      },
      finishBuffsByTag_10: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
            count: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_9',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'finishBuffsByTag_10',
      },
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            finish: 'firstTickReach',
            recycleDelaySeconds: 5,
          },
          callbacks: [],
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_energy' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'launchProjectile_1',
      },
      finishBuffsByTag_3: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'fixed', target: 'enemy' },
            finishSource: { kind: 'source' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            reason: 'absorbed',
          },
        },
        next: 'applyBuff_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
        },
        next: 'finishBuffsByTag_3',
      },
      switch_35: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_9' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'checkCondition_4' } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: 'checkCondition_11' } },
            { value: { kind: 'constant', value: 3 }, sequence: { $sequence: 'checkCondition_21' } },
            { value: { kind: 'constant', value: 4 }, sequence: { $sequence: 'checkCondition_34' } },
          ],
        },
        next: null,
      },
      readBuffStackCount_36: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: 'enemy',
            outputKey: 'count',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            },
          },
        },
        next: 'switch_35',
      },
      forEachContextTarget_37: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'fire_inflicted' } },
          body: { $sequence: 'readBuffStackCount_36' },
        },
        next: null,
      },
      findTargets_39: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'enemyByTags',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/Common/SpellInflict/FireInflict'],
            },
            saveToContextKey: 'fire_inflicted',
          },
        },
        next: 'forEachContextTarget_37',
      },
      applyBuff_40: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0016_laevat_passive_teammate_cd' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'findTargets_39',
      },
      checkCondition_41: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'applyBuff_40',
      },
      checkCondition_42: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'checkCondition_41',
      },
      checkCondition_43: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
        },
        next: 'checkCondition_42',
      },
      checkCondition_44: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
        },
        next: 'checkCondition_43',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'max_stack' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_1' },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_1' },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_1' },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_1' },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_1' },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_1' },
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_1' },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0016_laevat_passive_teammate_cd'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0016_laevat_energy'],
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_1' },
        },
      },
      data_12: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['powerAttack', 'normalAttackLastCombo'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff13: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0, max_stack: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeOutputDamage', priority: 0, sequence: { $sequence: 'checkCondition_44' } },
  ],
  actionGraph: laevatainBuff13ActionGraph,
};

const laevatainBuff14ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff14: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: laevatainBuff14ActionGraph,
};

const laevatainBuff15ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff15: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: laevatainBuff15ActionGraph,
};

const laevatainBuff16ActionGraph = {
  main: {
    nodes: {
      checkCondition_2: {
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
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0016_laevat_ring_start_asset'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff16: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
  ],
  actionGraph: laevatainBuff16ActionGraph,
};

const laevatainBuff17ActionGraph = {
  main: {
    nodes: {
      changePlayerActionMode_1: {
        action: {
          kind: 'changePlayerActionMode',
          parameters: { modeId: 'ult', lifetime: 'finishByAction' },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0016_laevat_wpn_vfx'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff17: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: {
    enable: [{ $sequence: 'changePlayerActionMode_1' }],
    finish: [{ $sequence: 'finishBuffsById_2' }],
  },
  skillSlotReplacements: [
    {
      skillSlotKey: 'battleSkill',
      targetSkillKey: 'chr_0016_laevat_normal_skill_during_ult',
      revertedSkillKey: 'chr_0016_laevat_normal_skill',
      inheritOriginSkillCooldownProgress: false,
    },
  ],
  actionGraph: laevatainBuff17ActionGraph,
};

const laevatainBuff18ActionGraph = {
  main: {
    nodes: {
      restrictUltimateEnergyRecovery_1: {
        action: {
          kind: 'restrictUltimateEnergyRecovery',
          parameters: {
            target: 'caster',
            allowedRecoveryTags: [],
            clearUltimateEnergyOnEnd: false,
          },
        },
        next: null,
      },
      adjustSkillCooldown_2: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'type', skillType: 'ultimate' },
            operation: 'set',
            basis: 'absoluteSeconds',
            value: { kind: 'constant', value: 10 },
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              { buffId: 'buff_chr_0016_laevat_ring_start_asset' },
              { buffId: 'buff_chr_0016_laevat_ult_end' },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      setCurrentBuffTimePaused_4: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: true } },
        next: null,
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'setCurrentBuffTimePaused_4',
      },
      setCurrentBuffTimePaused_6: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
        next: null,
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'setCurrentBuffTimePaused_6',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0016_laevat_pause_ult'] },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0016_laevat_pause_ult'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff18: SkillBuffDefinition = {
  stackingType: 'extend',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 15,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: ['Status/DisableBreakingAttack'],
  extendTags: [],
  blackboard: { duration: 16 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'applyBuff_3' }],
    enable: [{ $sequence: 'restrictUltimateEnergyRecovery_1' }],
    finish: [{ $sequence: 'adjustSkillCooldown_2' }],
  },
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_5' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_7' } },
  ],
  actionGraph: laevatainBuff18ActionGraph,
};

const laevatainBuff19ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0016_laevat_talent_2_1',
                copiedBlackboardAssignments: {
                  heal_max_hp: 'heal_max_hp',
                  duration: 'duration',
                  shelter: 'shelter_real',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      setGlobalCooldown_2: {
        action: {
          kind: 'setGlobalCooldown',
          parameters: {
            target: 'caster',
            markerId: 'buff_chr_0016_laevat_talent_2_0',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'applyBuff_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'setGlobalCooldown_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_3',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'cd' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'globalCooldownPresent',
          target: 'caster',
          markerId: 'buff_chr_0016_laevat_talent_2_0',
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_2' } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'hp_threshold' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: 'caster',
          valueType: 'ratio',
          operator: 'less',
          value: { kind: 'valueNode', nodeId: 'data_4' },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff19: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { cd: 0, duration: 0, heal_max_hp: 0, hp_threshold: 0, shelter_real: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'takeDamage', priority: 0, sequence: { $sequence: 'checkCondition_4' } },
  ],
  actionGraph: laevatainBuff19ActionGraph,
};

const laevatainBuff20ActionGraph = {
  main: {
    nodes: {
      heal_1: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'buffOwner',
            alwaysNext: true,
            tags: [],
            attribute: 'maxHealth',
            multiplier: { kind: 'valueNode', nodeId: 'data_1' },
            addition: { kind: 'constant', value: 0 },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_shelter',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_2' },
                  rate: { kind: 'valueNode', nodeId: 'data_3' },
                },
              },
            ],
            targets: { kind: 'inputTarget' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal_max_hp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'shelter' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff20: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 5,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, heal_max_hp: 0, shelter: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: [{ $sequence: 'applyBuff_2' }],
    trigger: [{ $sequence: 'heal_1' }],
  },
  actionGraph: laevatainBuff20ActionGraph,
};

const laevatainBuff21ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: [
              'buff_chr_0016_laevat_ring_start_asset',
              'buff_chr_0016_laevat_ultimate_sfx_loop',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      setCurrentBuffTimePaused_2: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: true } },
        next: null,
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'setCurrentBuffTimePaused_2',
      },
      setCurrentBuffTimePaused_4: {
        action: { kind: 'setCurrentBuffTimePaused', parameters: { paused: false } },
        next: null,
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'setCurrentBuffTimePaused_4',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0016_laevat_pause_ult'] },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0016_laevat_pause_ult'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const laevatainBuff21: SkillBuffDefinition = {
  stackingType: 'extend',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_atk_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 15 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'finishBuffsById_1' }] },
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
    { event: 'finishedBuff', priority: 0, sequence: { $sequence: 'checkCondition_5' } },
  ],
  actionGraph: laevatainBuff21ActionGraph,
};

export const laevatain: OperatorDefinition = {
  slug: 'laevatain',
  gameId: 'LAEVATAIN',
  rarity: 6,
  weaponType: 'sword',
  element: 'heat',
  characterTypeId: 'Fire',
  role: 'striker',
  mainAttribute: 'intellect',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [13, 36, 60, 85, 109, 121],
    agility: [9, 28, 49, 69, 89, 99],
    intellect: [22, 55, 90, 125, 160, 177],
    will: [9, 26, 44, 62, 80, 89],
    baseAttack: [30, 91, 156, 221, 285, 318],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  passiveUi: { kind: 'numeric', appearance: 'laevatainCounter', maximum: 4, activeAt: 4 },
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skills: [
        laevatainChr_0016_laevat_attack1,
        laevatainChr_0016_laevat_attack2,
        laevatainChr_0016_laevat_attack3,
        laevatainChr_0016_laevat_attack4,
        laevatainChr_0016_laevat_attack5,
      ],
    },
    {
      key: 'enhancedBasicAttack',
      operationType: 'basicAttack',
      nameKey: 'skillNames.enhanced',
      skills: [
        laevatainChr_0016_laevat_ult_attack1,
        laevatainChr_0016_laevat_ult_attack2,
        laevatainChr_0016_laevat_ult_attack3,
        laevatainChr_0016_laevat_ult_attack4,
      ],
    },
    { key: 'finisher', operationType: 'finisher', skills: laevatainChr_0016_laevat_power_attack },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skills: laevatainChr_0016_laevat_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skills: laevatainChr_0016_laevat_normal_skill,
    },
    {
      key: 'enhancedBattleSkill',
      operationType: 'battleSkill',
      nameKey: 'skillNames.enhanced',
      skills: laevatainChr_0016_laevat_normal_skill_during_ult,
    },
    { key: 'ultimate', operationType: 'ultimate', skills: laevatainChr_0016_laevat_ultimate_skill },
    {
      key: 'comboSkill',
      operationType: 'comboSkill',
      skills: laevatainChr_0016_laevat_combo_skill,
    },
  ],
  dodgeSkill: laevatainCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0016_laevat_normal_skill',
      replacementSkillKeys: ['chr_0016_laevat_normal_skill_during_ult'],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0016_laevat_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0016_laevat_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0016_laevat_attack1',
        'chr_0016_laevat_attack2',
        'chr_0016_laevat_attack3',
        'chr_0016_laevat_attack4',
        'chr_0016_laevat_attack5',
        'chr_0016_laevat_plunging_attack_end',
        'chr_0016_laevat_ult_attack1',
        'chr_0016_laevat_ult_attack2',
        'chr_0016_laevat_ult_attack3',
        'chr_0016_laevat_ult_attack4',
        'chr_0016_laevat_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0016_laevat_attack1',
        'chr_0016_laevat_attack2',
        'chr_0016_laevat_attack3',
        'chr_0016_laevat_attack4',
        'chr_0016_laevat_attack5',
      ],
      defaultSkillKey: 'chr_0016_laevat_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  playerActionModes: [
    {
      modeId: 'ult',
      modeLayer: 'ult',
      defaultEnabled: false,
      normalAttackSkillKeys: [
        'chr_0016_laevat_ult_attack1',
        'chr_0016_laevat_ult_attack2',
        'chr_0016_laevat_ult_attack3',
        'chr_0016_laevat_ult_attack4',
      ],
      commandMappings: { basicAttack: { skillId: 'chr_0016_laevat_ult_attack1' } },
    },
  ],
  comboSkillConditions: [laevatainComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 3,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0016_laevat_passive',
          blackboardAssignments: {
            ignore_fire_resist: [-10, -15, -20],
            ignore_fire_resist_duration: 20,
            max_stack: 4,
          },
        },
      ],
    },
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0016_laevat_talent_2_0',
          blackboardAssignments: {
            cd: 120,
            duration: [4, 8],
            heal_max_hp: 0.05,
            hp_threshold: 0.4,
            shelter: 0.9,
            shelter_real: 0.9,
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
          skillKey: 'chr_0016_laevat_normal_skill',
          blackboardKey: 'atb',
          operation: 'add',
          value: 20,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0016_laevat_normal_skill_during_ult',
          blackboardKey: 'atb',
          operation: 'add',
          value: 20,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0016_laevat_normal_skill_during_ult',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0016_laevat_normal_skill',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 20 },
        { kind: 'addStaticDamageIncrease', target: 'normalAttack', value: 0.15 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0016_laevat_normal_skill',
          blackboardKey: 'duration',
          operation: 'multiply',
          value: 1.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0016_laevat_normal_skill',
          blackboardKey: 'extra_scaling',
          operation: 'assign',
          value: 1.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0016_laevat_normal_skill_during_ult',
          blackboardKey: 'duration',
          operation: 'multiply',
          value: 1.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0016_laevat_normal_skill_during_ult',
          blackboardKey: 'extra_scaling',
          operation: 'assign',
          value: 1.5,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillKey: 'chr_0016_laevat_ultimate_skill',
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
          skillKey: 'chr_0016_laevat_ult_attack1',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0016_laevat_ult_attack2',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0016_laevat_ult_attack3',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0016_laevat_ult_attack4',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
      ],
      attachedBuffs: [
        {
          buffId: 'buff_chr_0016_laevat_potential_5',
          blackboardAssignments: { extend_duration: 1, max_duration: 7 },
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0016_laevat_absorb_fire_inflict: laevatainBuff1,
    buff_chr_0016_laevat_combo_skill_hit: laevatainBuff2,
    buff_chr_0016_laevat_combo_skill_hit_self: laevatainBuff3,
    buff_chr_0016_laevat_combo_skill_hitstop: laevatainBuff4,
    buff_chr_0016_laevat_combo_skill_start: laevatainBuff5,
    buff_chr_0016_laevat_combo_skill_usp: laevatainBuff6,
    buff_chr_0016_laevat_energy: laevatainBuff7,
    buff_chr_0016_laevat_energy_icon_5: laevatainBuff8,
    buff_chr_0016_laevat_has_max_energy: laevatainBuff9,
    buff_chr_0016_laevat_ignore_fire_resist: laevatainBuff10,
    buff_chr_0016_laevat_passive: laevatainBuff11,
    buff_chr_0016_laevat_passive_enemy: laevatainBuff12,
    buff_chr_0016_laevat_passive_teammate: laevatainBuff13,
    buff_chr_0016_laevat_passive_teammate_cd: laevatainBuff14,
    buff_chr_0016_laevat_pause_ult: laevatainBuff15,
    buff_chr_0016_laevat_potential_5: laevatainBuff16,
    buff_chr_0016_laevat_ring_start_asset: laevatainBuff17,
    buff_chr_0016_laevat_show_weapon: laevatainBuff18,
    buff_chr_0016_laevat_talent_2_0: laevatainBuff19,
    buff_chr_0016_laevat_talent_2_1: laevatainBuff20,
    buff_chr_0016_laevat_ult_end: laevatainBuff21,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0016_laevat_normal_skill: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        skillId: 'chr_0016_laevat_normal_skill_abilityentity',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 100,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale: 3, atk_scale_2: 0, hit_count: 0, poise: 0 },
        scheduledSequences: [
          { startFrame: 18, endFrame: 18, sequence: { $sequence: 'mergeContextTargets_7' } },
          { startFrame: 25, endFrame: 25, sequence: { $sequence: 'mergeContextTargets_14' } },
          { startFrame: 29, endFrame: 29, sequence: { $sequence: 'mergeContextTargets_21' } },
          { startFrame: 33, endFrame: 33, sequence: { $sequence: 'mergeContextTargets_28' } },
          { startFrame: 37, endFrame: 37, sequence: { $sequence: 'mergeContextTargets_35' } },
          { startFrame: 41, endFrame: 41, sequence: { $sequence: 'mergeContextTargets_42' } },
          { startFrame: 45, endFrame: 45, sequence: { $sequence: 'mergeContextTargets_49' } },
          { startFrame: 50, endFrame: 50, sequence: { $sequence: 'mergeContextTargets_56' } },
          { startFrame: 54, endFrame: 54, sequence: { $sequence: 'mergeContextTargets_63' } },
          { startFrame: 58, endFrame: 58, sequence: { $sequence: 'mergeContextTargets_70' } },
          { startFrame: 62, endFrame: 62, sequence: { $sequence: 'mergeContextTargets_77' } },
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
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_1/action',
                },
                next: null,
              },
              modifyActionValue_2: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                next: null,
              },
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
                next: 'modifyActionValue_2',
              },
              applyBuff_4: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0016_laevat_energy' }],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'applyBuff_3',
              },
              checkCondition_5: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                },
                next: 'applyBuff_4',
              },
              forEachContextTarget_6: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { targets: { kind: 'fixed', target: 'enemy' } },
                  body: { $sequence: 'dealDamage_1' },
                },
                next: 'checkCondition_5',
              },
              mergeContextTargets_7: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'targets',
                    sources: [{ kind: 'target', target: 'enemy' }],
                  },
                },
                next: 'forEachContextTarget_6',
              },
              applyBuff_8: {
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
              applyBuff_9: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0016_laevat_energy' }],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'applyBuff_8',
              },
              modifyActionValue_10: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                next: 'applyBuff_9',
              },
              checkCondition_11: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
                },
                next: 'modifyActionValue_10',
              },
              checkCondition_12: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
                },
                next: 'checkCondition_11',
              },
              dealDamage_13: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_13/action',
                },
                next: 'checkCondition_12',
              },
              mergeContextTargets_14: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'targets',
                    sources: [{ kind: 'target', target: 'enemy' }],
                  },
                },
                next: 'dealDamage_13',
              },
              dealDamage_20: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_20/action',
                },
                next: 'checkCondition_12',
              },
              mergeContextTargets_21: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'targets',
                    sources: [{ kind: 'target', target: 'enemy' }],
                  },
                },
                next: 'dealDamage_20',
              },
              dealDamage_27: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_27/action',
                },
                next: 'checkCondition_12',
              },
              mergeContextTargets_28: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'targets',
                    sources: [{ kind: 'target', target: 'enemy' }],
                  },
                },
                next: 'dealDamage_27',
              },
              dealDamage_34: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_34/action',
                },
                next: 'checkCondition_12',
              },
              mergeContextTargets_35: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'targets',
                    sources: [{ kind: 'target', target: 'enemy' }],
                  },
                },
                next: 'dealDamage_34',
              },
              dealDamage_41: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_41/action',
                },
                next: 'checkCondition_12',
              },
              mergeContextTargets_42: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'targets',
                    sources: [{ kind: 'target', target: 'enemy' }],
                  },
                },
                next: 'dealDamage_41',
              },
              dealDamage_48: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_48/action',
                },
                next: 'checkCondition_12',
              },
              mergeContextTargets_49: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'targets',
                    sources: [{ kind: 'target', target: 'enemy' }],
                  },
                },
                next: 'dealDamage_48',
              },
              dealDamage_55: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_55/action',
                },
                next: 'checkCondition_12',
              },
              mergeContextTargets_56: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'targets',
                    sources: [{ kind: 'target', target: 'enemy' }],
                  },
                },
                next: 'dealDamage_55',
              },
              dealDamage_62: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_62/action',
                },
                next: 'checkCondition_12',
              },
              mergeContextTargets_63: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'targets',
                    sources: [{ kind: 'target', target: 'enemy' }],
                  },
                },
                next: 'dealDamage_62',
              },
              dealDamage_69: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_69/action',
                },
                next: 'checkCondition_12',
              },
              mergeContextTargets_70: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'targets',
                    sources: [{ kind: 'target', target: 'enemy' }],
                  },
                },
                next: 'dealDamage_69',
              },
              dealDamage_76: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    damageType: 'heat',
                    attackScale: { kind: 'valueNode', nodeId: 'data_7' },
                    tags: ['normalSkill'],
                  },
                  key: 'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/actionGraph/main/nodes/dealDamage_76/action',
                },
                next: 'checkCondition_12',
              },
              mergeContextTargets_77: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'targets',
                    sources: [{ kind: 'target', target: 'enemy' }],
                  },
                },
                next: 'dealDamage_76',
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              data_3: {
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
              data_4: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'hit_count', fallback: 0 },
              },
              data_5: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_4' },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
              },
              data_6: {
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
              data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
            },
          },
          macros: {},
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default laevatain;
