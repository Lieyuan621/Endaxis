/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const tangtangChr_0027_tangtang_attack1ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0027_tangtang_attack1',
            recycleDelaySeconds: 0.0333333350718021,
            launch: { start: { side: 'operator' }, segmentTargets: [{ side: 'enemy' }] },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            attacker: 'actionSource',
                            target: { kind: 'inputTarget' },
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalAttack'],
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
                skillId: 'chr_0027_tangtang_attack1_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0.1 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                ],
              },
            },
          ],
        },
        next: null,
      },
      overrideBasicAttackMapping_2: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0027_tangtang_attack2'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0027_tangtang_attack2'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_attack1: SkillDefinition = {
  actionGraph: tangtangChr_0027_tangtang_attack1ActionGraph,
  key: 'chr_0027_tangtang_attack1',
  element: 'cryo',
  blackboard: {
    atk_scale: [0.23, 0.25, 0.27, 0.29, 0.32, 0.34, 0.36, 0.39, 0.41, 0.44, 0.47, 0.51],
  },
  timelineBlockFrames: 7,
  naturalDurationFrames: 90,
  exclusiveFrame: 15,
  offsetRecordFrame: 3,
  costFrame: 3,
  scheduledSequences: [
    { startFrame: 3, endFrame: 3, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'overrideBasicAttackMapping_2' } },
    { startFrame: 7, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const tangtangChr_0027_tangtang_attack2ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0027_tangtang_attack2',
            recycleDelaySeconds: 0.0333333350718021,
            launch: { start: { side: 'operator' }, segmentTargets: [{ side: 'enemy' }] },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            attacker: 'actionSource',
                            target: { kind: 'inputTarget' },
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalAttack'],
                          },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_1' },
                      },
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0027_tangtang_attack2_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale_1: 0.09 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                ],
              },
            },
          ],
        },
        next: null,
      },
      launchProjectile_2: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0027_tangtang_attack2_2',
            recycleDelaySeconds: 0.0333333350718021,
            launch: { start: { side: 'operator' }, segmentTargets: [{ side: 'enemy' }] },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                actionGraph: {
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
                            attacker: 'actionSource',
                            target: { kind: 'inputTarget' },
                            damageType: 'cryo',
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
                          target: { kind: 'inputTarget' },
                          containsHittableTarget: false,
                          excludeDeadEntity: false,
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_3: {
                        type: 'boolean',
                        expression: { kind: 'checkMainCharacter', target: { kind: 'source' } },
                      },
                      data_4: {
                        type: 'boolean',
                        expression: {
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_2' },
                        },
                      },
                      data_5: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_2' },
                      },
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0027_tangtang_attack2_02_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb: 0, atk_scale_2: 0.09 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_5' } },
                ],
              },
            },
          ],
        },
        next: null,
      },
      overrideBasicAttackMapping_3: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0027_tangtang_attack3'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_4: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0027_tangtang_attack3'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_attack2: SkillDefinition = {
  actionGraph: tangtangChr_0027_tangtang_attack2ActionGraph,
  key: 'chr_0027_tangtang_attack2',
  element: 'cryo',
  blackboard: {
    atb: 0,
    atk_scale_1: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23],
    atk_scale_2: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
  },
  timelineBlockFrames: 18,
  naturalDurationFrames: 117,
  exclusiveFrame: 18,
  offsetRecordFrame: 6,
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 6, endFrame: 6, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 10, endFrame: 10, sequence: { $sequence: 'launchProjectile_2' } },
    { startFrame: 0, endFrame: 39, sequence: { $sequence: 'overrideBasicAttackMapping_3' } },
    { startFrame: 18, endFrame: 39, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

const tangtangChr_0027_tangtang_attack3ActionGraphCallback1 = {
  actionGraph: {
    main: {
      nodes: {
        dealDamage_1: {
          action: {
            kind: 'dealDamage',
            parameters: {
              attacker: 'actionSource',
              target: { kind: 'inputTarget' },
              damageType: 'cryo',
              attackScale: { kind: 'valueNode', nodeId: 'data_1' },
              tags: ['normalAttack'],
            },
          },
          next: null,
        },
      },
      dataNodes: {
        data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      },
    },
    macros: {},
  },
  skillId: 'chr_0027_tangtang_attack3_projhit',
  nativeSkillType: 'normalSkill',
  naturalDurationFrames: 1,
  castResource: {
    costFrame: 0,
    cooldownSeconds: 0,
    maxChargeTime: 1,
    cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
  },
  blackboard: { atk_scale_2: 0 },
  scheduledSequences: [{ startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } }],
} as const;

export const tangtangChr_0027_tangtang_attack3ActionGraph = {
  main: {
    nodes: {
      mergeContextTargets_1: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'fixed', target: 'enemy' }] },
        },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'inputTarget' },
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack'],
          },
        },
        next: null,
      },
      repeatEachTick_3: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: false,
              triggerIntervalSeconds: 0.06,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds: -1,
            },
          },
          body: { $sequence: 'dealDamage_2' },
        },
        next: null,
      },
      launchProjectile_4: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0027_tangtang_attack3',
            recycleDelaySeconds: 0.0333333350718021,
            launch: {
              start: { side: 'operator' },
              segmentTargets: [
                {
                  target: { kind: 'source' },
                  offset: {
                    local: [
                      { kind: 'constant', value: 0 },
                      { kind: 'constant', value: 0 },
                      { kind: 'constant', value: 0 },
                    ],
                    facing: 'operatorToEnemy',
                    rotation: [0, 0, 0, 1],
                    centerOnGround: false,
                  },
                },
              ],
            },
          },
          callbacks: [
            { event: 'hit', skill: tangtangChr_0027_tangtang_attack3ActionGraphCallback1 },
          ],
        },
        next: null,
      },
      launchProjectile_7: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0027_tangtang_attack3',
            recycleDelaySeconds: 0.0333333350718021,
            launch: { start: { side: 'operator' }, segmentTargets: [{ side: 'operator' }] },
          },
          callbacks: [
            { event: 'hit', skill: tangtangChr_0027_tangtang_attack3ActionGraphCallback1 },
          ],
        },
        next: null,
      },
      overrideBasicAttackMapping_8: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0027_tangtang_attack4'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_9: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0027_tangtang_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_attack3: SkillDefinition = {
  actionGraph: tangtangChr_0027_tangtang_attack3ActionGraph,
  key: 'chr_0027_tangtang_attack3',
  element: 'cryo',
  blackboard: {
    atk_scale_1: [0.05, 0.06, 0.06, 0.07, 0.07, 0.08, 0.08, 0.09, 0.09, 0.1, 0.1, 0.11],
    atk_scale_2: [0.03, 0.03, 0.03, 0.03, 0.04, 0.04, 0.04, 0.04, 0.05, 0.05, 0.05, 0.06],
  },
  timelineBlockFrames: 26,
  naturalDurationFrames: 115,
  exclusiveFrame: 30,
  offsetRecordFrame: 5,
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 5, endFrame: 13, sequence: { $sequence: 'mergeContextTargets_1' } },
    { startFrame: 5, endFrame: 13, sequence: { $sequence: 'repeatEachTick_3' } },
    { startFrame: 17, endFrame: 17, sequence: { $sequence: 'launchProjectile_4' } },
    { startFrame: 17, endFrame: 17, sequence: { $sequence: 'launchProjectile_4' } },
    { startFrame: 18, endFrame: 18, sequence: { $sequence: 'launchProjectile_4' } },
    { startFrame: 18, endFrame: 18, sequence: { $sequence: 'launchProjectile_7' } },
    { startFrame: 0, endFrame: 43, sequence: { $sequence: 'overrideBasicAttackMapping_8' } },
    { startFrame: 26, endFrame: 43, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const tangtangChr_0027_tangtang_attack4ActionGraph = {
  main: {
    nodes: {
      mergeContextTargets_1: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'fixed', target: 'enemy' }] },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack'],
          },
        },
        next: null,
      },
      startTimeDilation_7: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      ifElse_8: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_7' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_9: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_8',
      },
      overrideBasicAttackMapping_10: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0027_tangtang_attack5'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_11: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0027_tangtang_attack5'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'source' } },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_attack4: SkillDefinition = {
  actionGraph: tangtangChr_0027_tangtang_attack4ActionGraph,
  key: 'chr_0027_tangtang_attack4',
  element: 'cryo',
  blackboard: {
    atk_scale_1: [0.08, 0.09, 0.1, 0.1, 0.11, 0.12, 0.13, 0.14, 0.14, 0.15, 0.17, 0.18],
    atk_scale_2: [0.21, 0.23, 0.25, 0.27, 0.29, 0.31, 0.33, 0.35, 0.37, 0.39, 0.43, 0.46],
  },
  timelineBlockFrames: 24,
  naturalDurationFrames: 143,
  exclusiveFrame: 28,
  offsetRecordFrame: 12,
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 6, endFrame: 8, sequence: { $sequence: 'mergeContextTargets_1' } },
    { startFrame: 10, endFrame: 12, sequence: { $sequence: 'mergeContextTargets_1' } },
    { startFrame: 23, endFrame: 28, sequence: { $sequence: 'mergeContextTargets_1' } },
    { startFrame: 6, endFrame: 8, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 10, endFrame: 12, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 23, endFrame: 28, sequence: { $sequence: 'dealDamage_9' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'overrideBasicAttackMapping_10' } },
    { startFrame: 24, endFrame: 50, sequence: { $sequence: 'reachSkillOperableBoundary_11' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const tangtangChr_0027_tangtang_attack5ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0027_tangtang_attack5',
            recycleDelaySeconds: 0.0333333350718021,
            launch: {
              start: { side: 'operator' },
              segmentTargets: [
                {
                  target: { kind: 'source' },
                  offset: {
                    local: [
                      { kind: 'constant', value: 0 },
                      { kind: 'constant', value: 1 },
                      { kind: 'constant', value: 12 },
                    ],
                    facing: 'operatorToEnemy',
                    rotation: [0, 0, 0, 1],
                    centerOnGround: false,
                  },
                },
              ],
            },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                actionGraph: {
                  main: {
                    nodes: {
                      modifyActionValue_3: {
                        action: {
                          kind: 'modifyActionValue',
                          parameters: {
                            key: 'EntityBB_atk05_cnt',
                            operation: 'add',
                            value: { kind: 'constant', value: 1 },
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
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            spGainKind: 'gain',
                            spGainSource: 'normalAttack',
                          },
                        },
                        next: 'modifyActionValue_3',
                      },
                      checkCondition_5: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                        },
                        next: 'changeResource_4',
                      },
                      dealStagger_6: {
                        action: {
                          kind: 'dealStagger',
                          parameters: {
                            attacker: 'actionSource',
                            target: { kind: 'inputTarget' },
                            value: { kind: 'valueNode', nodeId: 'data_4' },
                          },
                        },
                        next: 'checkCondition_5',
                      },
                      checkCondition_1: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
                        },
                        next: null,
                      },
                      checkCondition_2: {
                        action: {
                          kind: 'checkCondition',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
                        },
                        next: 'checkCondition_1',
                      },
                      ifElse_7: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_7' },
                          whenTrue: { $sequence: 'dealStagger_6' },
                          whenFalse: { $sequence: null },
                        },
                        next: null,
                      },
                      dealDamage_8: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            attacker: 'actionSource',
                            target: { kind: 'inputTarget' },
                            damageType: 'cryo',
                            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
                            tags: ['normalAttack', 'normalAttackLastCombo'],
                          },
                        },
                        next: 'ifElse_7',
                      },
                    },
                    dataNodes: {
                      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'EntityBB_atk05_cnt', fallback: 0 },
                      },
                      data_3: {
                        type: 'boolean',
                        expression: {
                          kind: 'actionValueCompare',
                          left: { kind: 'valueNode', nodeId: 'data_2' },
                          operator: 'less',
                          right: { kind: 'constant', value: 1 },
                        },
                      },
                      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                      data_5: {
                        type: 'boolean',
                        expression: {
                          kind: 'entityCountCompare',
                          target: { kind: 'inputTarget' },
                          containsHittableTarget: false,
                          excludeDeadEntity: false,
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_6: {
                        type: 'boolean',
                        expression: { kind: 'checkMainCharacter', target: { kind: 'source' } },
                      },
                      data_7: {
                        type: 'boolean',
                        expression: {
                          kind: 'checkActionResult',
                          action: { $sequence: 'checkCondition_2' },
                        },
                      },
                      data_8: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0027_tangtang_attack5_projhit',
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
                  { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_8' } },
                ],
              },
            },
          ],
        },
        next: null,
      },
      overrideBasicAttackMapping_2: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0027_tangtang_attack1'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0027_tangtang_attack1'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_attack5: SkillDefinition = {
  actionGraph: tangtangChr_0027_tangtang_attack5ActionGraph,
  key: 'chr_0027_tangtang_attack5',
  element: 'cryo',
  blackboard: {
    atb: 18,
    atk_scale: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.96, 1.04, 1.13],
    poise: 18,
  },
  timelineBlockFrames: 36,
  naturalDurationFrames: 190,
  exclusiveFrame: 36,
  offsetRecordFrame: 22,
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 22, endFrame: 22, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 0, endFrame: 77, sequence: { $sequence: 'overrideBasicAttackMapping_2' } },
    { startFrame: 36, endFrame: 77, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const tangtangChr_0027_tangtang_power_attackActionGraph = {
  main: {
    nodes: {
      startTimeDilation_9: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.5,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1,
                  value: 0.017,
                  inTangent: -0.0608355,
                  outTangent: -0.0608355,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.8860931,
                  value: 0.3503852,
                  inTangent: 1.160006,
                  outTangent: 1.160006,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.5,
                  inTangent: 1.079618,
                  outTangent: 1.079618,
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
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_9' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_22: {
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
      applyBuff_23: {
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
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_10',
      },
      dealDamage_opt2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'inputTarget' },
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.3,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'ifElse_opt1',
      },
      startTimeDilation_opt3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      dealDamage_opt4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'inputTarget' },
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.7,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'startTimeDilation_opt3',
      },
      gainFinisherSp_opt5: {
        action: {
          kind: 'gainFinisherSp',
          parameters: {
            source: { kind: 'source' },
            target: { kind: 'inputTarget' },
            factor: { kind: 'constant', value: 1 },
          },
        },
        next: 'dealDamage_opt4',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'inputTarget' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_power_attack: SkillDefinition = {
  actionGraph: tangtangChr_0027_tangtang_power_attackActionGraph,
  key: 'chr_0027_tangtang_power_attack',
  element: 'cryo',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 48,
  naturalDurationFrames: 121,
  exclusiveFrame: 47,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  costFrame: 4,
  scheduledSequences: [
    { startFrame: 9, endFrame: 9, sequence: { $sequence: 'dealDamage_opt2' } },
    { startFrame: 21, endFrame: 21, sequence: { $sequence: 'gainFinisherSp_opt5' } },
    { startFrame: 0, endFrame: 47, sequence: { $sequence: 'applyBuff_22' } },
    { startFrame: 0, endFrame: 33, sequence: { $sequence: 'applyBuff_23' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const tangtangChr_0027_tangtang_plunging_attack_endActionGraph = {
  main: {
    nodes: {
      mergeContextTargets_1: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'fixed', target: 'enemy' }] },
        },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: null,
      },
      repeatEachTick_4: {
        action: {
          kind: 'repeatEachTick',
          parameters: { nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.07 } },
          body: { $sequence: 'dealDamage_3' },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_plunging_attack_end: SkillDefinition = {
  actionGraph: tangtangChr_0027_tangtang_plunging_attack_endActionGraph,
  key: 'chr_0027_tangtang_plunging_attack_end',
  element: 'cryo',
  blackboard: { atk_scale: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45] },
  timelineBlockFrames: 16,
  naturalDurationFrames: 118,
  exclusiveFrame: 15,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 3, endFrame: 11, sequence: { $sequence: 'mergeContextTargets_1' } },
    { startFrame: 3, endFrame: 11, sequence: { $sequence: 'repeatEachTick_4' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const tangtangChr_0027_tangtang_normal_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_2: {
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
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.02 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      once_4: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'applyBuff_2' } },
        next: 'startTimeDilation_3',
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'inputTarget' },
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'once_4',
      },
      repeatEachTick_6: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: false,
              target: { kind: 'fixed', target: 'enemy' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 5,
              targetTriggerIntervalSeconds: 0.075,
            },
          },
          body: { $sequence: 'dealDamage_5' },
        },
        next: null,
      },
      applyBuff_40: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_1' }],
            targets: { kind: 'context', key: 'normalskill_watermove_1' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      spawnAbilityEntity_41: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_move',
            childSkillId: 'chr_0027_tangtang_normal_skill_abilityentitymove',
            source: { kind: 'source' },
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'caster',
            saveToContextKey: 'normalskill_watermove_1',
          },
        },
        next: 'applyBuff_40',
      },
      applyBuff_27: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0027_tangtang_water_wake' }],
            targets: { kind: 'context', key: 'water' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      modifyActionValue_28: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'water_cnt', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'applyBuff_27',
      },
      ifElse_29: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'modifyActionValue_28' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      changeResource_31: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 2 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      ifElse_34: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'changeResource_31' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      changeResource_33: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_4' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      applyBuff_36: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_1' }],
            targets: { kind: 'context', key: 'normalskill_watermove' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      spawnAbilityEntity_37: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_move',
            childSkillId: 'chr_0027_tangtang_normal_skill_abilityentitymove',
            source: { kind: 'source' },
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'caster',
            saveToContextKey: 'normalskill_watermove',
          },
        },
        next: 'applyBuff_36',
      },
      ifElse_38: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'changeResource_33' },
          whenFalse: { $sequence: 'ifElse_34' },
        },
        next: 'spawnAbilityEntity_37',
      },
      forEachContextTarget_39: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'water' } },
          body: { $sequence: 'ifElse_29' },
        },
        next: 'ifElse_38',
      },
      ifElse_42: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'forEachContextTarget_39' },
          whenFalse: { $sequence: 'spawnAbilityEntity_41' },
        },
        next: null,
      },
      modifyActionValue_43: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale03',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_9' },
          },
        },
        next: 'ifElse_42',
      },
      modifyActionValue_44: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale02',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: 'modifyActionValue_43',
      },
      modifyActionValue_45: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale01',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_11' },
          },
        },
        next: 'modifyActionValue_44',
      },
      findOwnerSpawnedAbilityEntities_46: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'water',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_comboskill_water'],
            owner: { kind: 'owner' },
          },
        },
        next: 'modifyActionValue_45',
      },
      applyBuff_47: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_2' }],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_48: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
        },
        next: 'applyBuff_47',
      },
      forEachContextTarget_49: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'normalwater_move' } },
          body: { $sequence: 'checkCondition_48' },
        },
        next: null,
      },
      checkCondition_50: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
        },
        next: 'forEachContextTarget_49',
      },
      findOwnerSpawnedAbilityEntities_51: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'normalwater_move',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_normal_skill_move'],
            owner: { kind: 'owner' },
            sameSourceSkillCast: true,
          },
        },
        next: 'checkCondition_50',
      },
      reachSkillOperableBoundary_52: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0027_tangtang_normal_skill'] },
        },
        next: null,
      },
      applyBuff_53: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0027_tangtang_skillappear' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'poise1' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'inputTarget' },
          distance: 50,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'water_cnt', fallback: 0 } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 2 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_5' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'water' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water03' },
      },
      data_10: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water02' },
      },
      data_11: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water01' },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'inputTarget' },
          distance: 50,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'normalwater_move' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
          outputKey: 'normalskillwatermove_cnt',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_normal_skill: SkillDefinition = {
  actionGraph: tangtangChr_0027_tangtang_normal_skillActionGraph,
  key: 'chr_0027_tangtang_normal_skill',
  element: 'cryo',
  blackboard: {
    atb_return: 20,
    atk_scale_1: [0.16, 0.176, 0.192, 0.208, 0.224, 0.24, 0.256, 0.272, 0.288, 0.308, 0.332, 0.36],
    duration: 5,
    duration_spellvulnerable: 15,
    normalskillwatermove_cnt: 0,
    poise_tornado: 0,
    poise1: 2,
    potential3: 0,
    rate_spellvulnerable: [
      0.03, 0.03, 0.03, 0.035, 0.035, 0.035, 0.04, 0.04, 0.04, 0.045, 0.045, 0.05,
    ],
    rate_spellvulnerable_02: [
      0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.1,
    ],
    talent2_ultskill: 0,
    tornado_atk_scale01: 0,
    tornado_atk_scale02: 0,
    tornado_atk_scale03: 0,
    water_cnt: 0,
  },
  timelineBlockFrames: 51,
  naturalDurationFrames: 136,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 27, endFrame: 39, sequence: { $sequence: 'repeatEachTick_6' } },
    { startFrame: 11, endFrame: 11, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_46' } },
    { startFrame: 44, endFrame: 45, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_51' } },
    { startFrame: 50, endFrame: 76, sequence: { $sequence: 'reachSkillOperableBoundary_52' } },
    { startFrame: 1, endFrame: 24, sequence: { $sequence: 'applyBuff_53' } },
  ],
  defaultTarget: 'enemy',
  smartTarget: 'input',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
};

const tangtangChr_0027_tangtang_combo_skillActionGraphCallback1 = {
  actionGraph: {
    main: {
      nodes: {
        createTimedMarker_12: {
          action: {
            kind: 'createTimedMarker',
            parameters: {
              targets: { kind: 'context', key: 'water_abilityentity01' },
              markerId: 'tangtang_waterabilityentity01',
              durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
              autoFinishByAction: false,
              timeDomain: 'globalScaled',
            },
          },
          next: null,
        },
        applyBuff_13: {
          action: {
            kind: 'applyBuff',
            parameters: {
              buffs: [
                {
                  buffId: 'buff_chr_0027_tangtang_water',
                  copiedBlackboardAssignments: { duration_water: 'duration_water' },
                },
              ],
              targets: { kind: 'source' },
              source: { kind: 'source' },
              inheritSourceSkillCastInfo: true,
            },
          },
          next: 'createTimedMarker_12',
        },
        spawnAbilityEntity_14: {
          action: {
            kind: 'spawnAbilityEntity',
            parameters: {
              bornAt: { kind: 'inputTarget' },
              abilityEntityId: 'abilityentity_chr_0027_tangtang_comboskill_water',
              childSkillId: 'chr_0027_tangtang_combo_skill_water',
              source: { kind: 'source' },
              inheritActionBlackboard: true,
              dieWhenSourceDies: false,
              saveToContextKey: 'water_abilityentity01',
            },
          },
          next: 'applyBuff_13',
        },
        createTimedMarker_6: {
          action: {
            kind: 'createTimedMarker',
            parameters: {
              targets: { kind: 'context', key: 'water_abilityentity02' },
              markerId: 'tangtang_waterabilityentity01',
              durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
              autoFinishByAction: false,
              timeDomain: 'globalScaled',
            },
          },
          next: null,
        },
        createTimedMarker_3: {
          action: {
            kind: 'createTimedMarker',
            parameters: {
              targets: { kind: 'context', key: 'water_abilityentity02' },
              markerId: 'tangtang_waterabilityentity02',
              durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
              autoFinishByAction: false,
              timeDomain: 'globalScaled',
            },
          },
          next: null,
        },
        createTimedMarker_2: {
          action: {
            kind: 'createTimedMarker',
            parameters: {
              targets: { kind: 'context', key: 'water_abilityentity02' },
              markerId: 'tangtang_waterabilityentity03',
              durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
              autoFinishByAction: false,
              timeDomain: 'globalScaled',
            },
          },
          next: null,
        },
        ifElse_5: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: { kind: 'conditionNode', nodeId: 'data_2' },
            whenTrue: { $sequence: 'createTimedMarker_2' },
            whenFalse: { $sequence: 'createTimedMarker_3' },
          },
          next: null,
        },
        ifElse_8: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: { kind: 'conditionNode', nodeId: 'data_3' },
            whenTrue: { $sequence: 'ifElse_5' },
            whenFalse: { $sequence: 'createTimedMarker_6' },
          },
          next: null,
        },
        findOwnerSpawnedAbilityEntities_9: {
          action: {
            kind: 'findOwnerSpawnedAbilityEntities',
            parameters: {
              saveToContextKey: 'water_group',
              abilityEntityIds: ['abilityentity_chr_0027_tangtang_comboskill_water'],
              owner: { kind: 'source' },
            },
          },
          next: 'ifElse_8',
        },
        applyBuff_10: {
          action: {
            kind: 'applyBuff',
            parameters: {
              buffs: [
                {
                  buffId: 'buff_chr_0027_tangtang_water',
                  copiedBlackboardAssignments: { duration_water: 'duration_water' },
                },
              ],
              targets: { kind: 'source' },
              source: { kind: 'source' },
              inheritSourceSkillCastInfo: true,
            },
          },
          next: 'findOwnerSpawnedAbilityEntities_9',
        },
        spawnAbilityEntity_11: {
          action: {
            kind: 'spawnAbilityEntity',
            parameters: {
              bornAt: { kind: 'inputTarget' },
              abilityEntityId: 'abilityentity_chr_0027_tangtang_comboskill_water',
              childSkillId: 'chr_0027_tangtang_combo_skill_water',
              source: { kind: 'source' },
              inheritActionBlackboard: true,
              dieWhenSourceDies: false,
              saveToContextKey: 'water_abilityentity02',
            },
          },
          next: 'applyBuff_10',
        },
        ifElse_15: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: { kind: 'conditionNode', nodeId: 'data_4' },
            whenTrue: { $sequence: 'spawnAbilityEntity_11' },
            whenFalse: { $sequence: 'spawnAbilityEntity_14' },
          },
          next: null,
        },
      },
      dataNodes: {
        data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_water' } },
        data_2: {
          type: 'boolean',
          expression: {
            kind: 'timedMarkerPresent',
            target: { kind: 'context', key: 'water_group' },
            returnTrueIfNotExists: false,
            markerId: 'tangtang_waterabilityentity02',
          },
        },
        data_3: {
          type: 'boolean',
          expression: {
            kind: 'timedMarkerPresent',
            target: { kind: 'context', key: 'water_group' },
            returnTrueIfNotExists: false,
            markerId: 'tangtang_waterabilityentity01',
          },
        },
        data_4: {
          type: 'boolean',
          expression: {
            kind: 'buffIdStackCompare',
            target: { kind: 'source' },
            compareZeroWhenTargetMissing: true,
            operator: 'greater',
            value: { kind: 'constant', value: 0 },
            buffIds: ['buff_chr_0027_tangtang_water'],
          },
        },
      },
    },
    macros: {},
  },
  skillId: 'chr_0027_tangtang_combo_skill_water_gene',
  nativeSkillType: 'normalSkill',
  naturalDurationFrames: 900,
  castResource: {
    costFrame: 0,
    cooldownSeconds: 0,
    maxChargeTime: 1,
    cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
  },
  blackboard: { duration_water: 30 },
  scheduledSequences: [{ startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_15' } }],
} as const;

export const tangtangChr_0027_tangtang_combo_skillActionGraph = {
  main: {
    nodes: {
      mergeContextTargets_1: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'fixed', target: 'enemy' }] },
        },
        next: null,
      },
      launchProjectile_14: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0027_tangtang_water',
            recycleDelaySeconds: 30,
            launch: {
              start: { side: 'enemy' },
              segmentTargets: [
                {
                  target: { kind: 'context', key: 'tar01' },
                  offset: {
                    local: [
                      { kind: 'constant', value: 0 },
                      { kind: 'constant', value: 0.1 },
                      { kind: 'constant', value: 0 },
                    ],
                    facing: 'operatorToEnemy',
                    rotation: [0, 0, 0, 1],
                    centerOnGround: true,
                  },
                },
              ],
              landingAtTarget: true,
            },
          },
          callbacks: [
            { event: 'block', skill: tangtangChr_0027_tangtang_combo_skillActionGraphCallback1 },
            { event: 'finish', skill: tangtangChr_0027_tangtang_combo_skillActionGraphCallback1 },
          ],
        },
        next: null,
      },
      modifyActionValue_20: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tar_cnt',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      changeResource_21: {
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
        next: 'modifyActionValue_20',
      },
      startTimeDilation_22: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          },
        },
        next: null,
      },
      ifElse_23: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'changeResource_21' },
          whenFalse: { $sequence: null },
        },
        next: 'startTimeDilation_22',
      },
      dealStagger_24: {
        action: {
          kind: 'dealStagger',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'ifElse_23',
      },
      dealDamage_25: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'dealStagger_24',
      },
      startTimeDilation_32: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.867000043 },
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
      startTimeDilation_33: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.15 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            targets: [],
            abilityEntityTargets: [{ kind: 'ownerSpawned' }],
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_34: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0027_tangtang_normal_skill'] },
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'launchProjectile_14' },
          whenFalse: { $sequence: 'launchProjectile_14' },
        },
        next: null,
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'ifElse_opt1' },
          whenFalse: { $sequence: 'ifElse_opt1' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_opt3: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'water_group',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_comboskill_water'],
            owner: { kind: 'source' },
          },
        },
        next: 'ifElse_opt2',
      },
      ifElse_opt4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'findOwnerSpawnedAbilityEntities_opt3' },
          whenFalse: { $sequence: 'launchProjectile_14' },
        },
        next: null,
      },
      mergeContextTargets_opt5: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar01', sources: [{ kind: 'fixed', target: 'enemy' }] },
        },
        next: 'ifElse_opt4',
      },
      modifyActionValue_opt6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'combowater_cnt',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'mergeContextTargets_opt5',
      },
      ifElse_opt7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'modifyActionValue_opt6' },
          whenFalse: { $sequence: null },
        },
        next: 'dealDamage_25',
      },
      checkCondition_opt8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
        },
        next: 'ifElse_opt7',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'tar_cnt', fallback: 0 } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'source' },
          compareZeroWhenTargetMissing: true,
          operator: 'greater',
          value: { kind: 'constant', value: 0 },
          buffIds: ['buff_chr_0027_tangtang_water'],
        },
      },
      data_9: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'combowater_cnt', fallback: 0 },
      },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_9' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_11: {
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

export const tangtangChr_0027_tangtang_combo_skill: SkillDefinition = {
  actionGraph: tangtangChr_0027_tangtang_combo_skillActionGraph,
  key: 'chr_0027_tangtang_combo_skill',
  element: 'cryo',
  blackboard: {
    atk_scale: [1.067, 1.173, 1.28, 1.387, 1.494, 1.6, 1.707, 1.814, 1.92, 2.054, 2.214, 2.4],
    combowater_cnt: 0,
    dmg_up_water_ult: 0,
    duration: 3,
    duration_talent1buff: 0,
    duration_water: 30,
    poise: 10,
    potential1: 0,
    potential5: 0,
    range_talent1buff: 5,
    ratio_speed: 0,
    ratio_speedreduction: 0,
    talent1_speed: 0,
    talent2: 0,
    tar_cnt: 0,
    usp: 10,
  },
  timelineBlockFrames: 42,
  naturalDurationFrames: 200,
  exclusiveFrame: 41,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 26, endFrame: 29, sequence: { $sequence: 'mergeContextTargets_1' } },
    { startFrame: 26, endFrame: 29, sequence: { $sequence: 'checkCondition_opt8' } },
    { startFrame: 0, endFrame: 23, sequence: { $sequence: 'startTimeDilation_32' } },
    { startFrame: 0, endFrame: 5, sequence: { $sequence: 'startTimeDilation_33' } },
    { startFrame: 31, endFrame: 93, sequence: { $sequence: 'reachSkillOperableBoundary_34' } },
  ],
  defaultTarget: 'enemy',
  smartTarget: 'trigger',
  cooldownFrames: [420, 420, 420, 420, 420, 420, 420, 420, 390, 390, 390, 360],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
};

export const tangtangChr_0027_tangtang_ultimate_skillActionGraph = {
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
            targets: [{ kind: 'owner' }],
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0027_tangtang_ultskill_vfx'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_damage_immune_ult_skill' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      hideUi_4: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_5: {
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
      overrideBasicAttackMapping_6: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0027_tangtang_attack1'], priority: 'skill' },
        },
        next: null,
      },
      spawnAbilityEntity_10: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0027_tangtang_ultskill',
            childSkillId: 'chr_0027_tangtang_ultimate_skill_1',
            source: { kind: 'source' },
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: null,
      },
      modifyActionValue_9: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'talent2_ultskill',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'spawnAbilityEntity_10',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'modifyActionValue_9' },
          whenFalse: { $sequence: 'spawnAbilityEntity_10' },
        },
        next: null,
      },
      modifyActionValue_12: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'duration_spellvulnerable',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'ifElse_11',
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'rate_spellvulnerable_02',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'modifyActionValue_12',
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'rate_spellvulnerable',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'modifyActionValue_13',
      },
      modifyActionValue_15: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale03',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'modifyActionValue_14',
      },
      modifyActionValue_16: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale02',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'modifyActionValue_15',
      },
      modifyActionValue_17: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale01',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: 'modifyActionValue_16',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'talent2', fallback: 0 } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_1' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_duration_spellvulnerable' },
      },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_rate_spellvulnerable_02' },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_rate_spellvulnerable' },
      },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water03' },
      },
      data_7: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water02' },
      },
      data_8: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water01' },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_ultimate_skill: SkillDefinition = {
  actionGraph: tangtangChr_0027_tangtang_ultimate_skillActionGraph,
  key: 'chr_0027_tangtang_ultimate_skill',
  element: 'cryo',
  blackboard: {
    atk_scale_1: [0.178, 0.196, 0.213, 0.231, 0.249, 0.267, 0.284, 0.302, 0.32, 0.342, 0.369, 0.4],
    atk_scale_2: [1.778, 1.956, 2.134, 2.311, 2.489, 2.667, 2.845, 3.023, 3.2, 3.423, 3.689, 4],
    atk_scale_3: [3.111, 3.422, 3.734, 4.045, 4.356, 4.667, 4.978, 5.289, 5.6, 5.989, 6.456, 7],
    dmg_up_water_ult: 0,
    duration: 12,
    duration_spellvulnerable: 0,
    poise2: 15,
    poise3: 20,
    potential3_rate_spellvulnerable: 0,
    potential5: 0,
    rate_spellvulnerable: 0,
    rate_spellvulnerable_02: 0,
    rate_vul_base: 0,
    talent2: 0,
    talent2_ultskill: 0,
    tornado_atk_scale01: 0,
    tornado_atk_scale02: 0,
    tornado_atk_scale03: 0,
  },
  timelineBlockFrames: 85,
  naturalDurationFrames: 202,
  exclusiveFrame: 84,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'finishBuffsById_2' } },
    { startFrame: 0, endFrame: 84, sequence: { $sequence: 'applyBuff_3' } },
    { startFrame: 0, endFrame: 82, sequence: { $sequence: 'hideUi_4' } },
    { startFrame: 0, endFrame: 82, sequence: { $sequence: 'startUltimateTimeDilation_5' } },
    { startFrame: 82, endFrame: 174, sequence: { $sequence: 'overrideBasicAttackMapping_6' } },
    { startFrame: 76, endFrame: 76, sequence: { $sequence: 'modifyActionValue_17' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 90 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const tangtangCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: tangtangCommon_character_perfect_dodgeActionGraph,
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

export const tangtangChr_0027_tangtang_plunging_attack_startActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const tangtangChr_0027_tangtang_plunging_attack_start: SkillDefinition = {
  actionGraph: tangtangChr_0027_tangtang_plunging_attack_startActionGraph,
  key: 'chr_0027_tangtang_plunging_attack_start',
  element: 'physical',
  blackboard: {},
  timelineBlockFrames: 1501,
  naturalDurationFrames: 1500,
  exclusiveFrame: 1500,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  nativeSkillType: 'attack',
  levelSource: 'basicAttack',
};

const tangtangPassive1ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0027_tangtang_water_passiveui' }],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: false,
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
                buffId: 'buff_chr_0027_tangtang_passive_0',
                blackboardAssignments: {
                  duration_spellvulnerable: { kind: 'valueNode', nodeId: 'data_1' },
                  normalskill_atk_scale01: { kind: 'valueNode', nodeId: 'data_2' },
                  normalskill_atk_scale02: { kind: 'valueNode', nodeId: 'data_3' },
                  normalskill_atk_scale03: { kind: 'valueNode', nodeId: 'data_4' },
                  rate_spellvulnerable: { kind: 'valueNode', nodeId: 'data_5' },
                  rate_spellvulnerable_02: { kind: 'valueNode', nodeId: 'data_6' },
                },
              },
            ],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: false,
          },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'duration_spellvulnerable' },
      },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'normalskill_atk_scale01' },
      },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'normalskill_atk_scale02' },
      },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'normalskill_atk_scale03' },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'rate_spellvulnerable' } },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'rate_spellvulnerable_02' },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangPassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0027_tangtang_passive_0',
  levelSource: 'battleSkill',
  blackboard: {
    duration_spellvulnerable: [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
    normalskill_atk_scale01: [
      0.111, 0.122, 0.133, 0.145, 0.156, 0.167, 0.178, 0.189, 0.2, 0.214, 0.231, 0.25,
    ],
    normalskill_atk_scale02: 0,
    normalskill_atk_scale03: 0,
    rate_spellvulnerable: [
      0.03, 0.03, 0.03, 0.035, 0.035, 0.035, 0.04, 0.04, 0.04, 0.045, 0.045, 0.05,
    ],
    rate_spellvulnerable_02: [
      0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.1,
    ],
  },
  enableSequence: { $sequence: 'applyBuff_2' },
  actionGraph: tangtangPassive1ActionGraph,
};

const tangtangComboCondition1ActionGraph = {
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
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'targetObjectTypeMatch',
          target: { kind: 'context', key: 'trigger' },
          objectTypes: ['enemy'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['fireBurst', 'cryoBurst', 'electricBurst', 'natureBurst'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0027_tangtang_combo_skill',
  event: 'takeDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_2' },
  actionGraph: tangtangComboCondition1ActionGraph,
};

const tangtangComboCondition2ActionGraph = {
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
        expression: { kind: 'eventInflictionElementIn', elements: ['cryo'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0027_tangtang_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_1' },
  actionGraph: tangtangComboCondition2ActionGraph,
};

const tangtangBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff1: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: { blackboardKey: 'hit_spelllnflictionmax' },
  durationSeconds: { blackboardKey: 'hit_spellduration' },
  applyTags: [],
  extendTags: [],
  blackboard: { hit_spellduration: 6, hit_spelllnflictionmax: 2 },
  attributeModifiers: [],
  actionGraph: tangtangBuff1ActionGraph,
};

const tangtangBuff2ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_speedup',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: { child_buff_id: 'buff_chr_0027_tangtang_water_icon' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0027_tangtang_comboskill_waterbuff_outaura'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_waterbuff' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'ratio_speed' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff2: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'ratio_speed' },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration_waterbuff' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_tangtang_speedup',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration_waterbuff: 30, ratio_speed: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'finishBuffsById_2' }],
    enable: [{ $sequence: 'applyBuff_1' }],
  },
  actionGraph: tangtangBuff2ActionGraph,
};

const tangtangBuff3ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_speedup',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: { child_buff_id: 'buff_chr_0027_tangtang_water_icon' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_talent1buff' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'ratio_speed' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
          buffIds: ['buff_chr_0027_tangtang_comboskill_waterbuff'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff3: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'ratio_speed' },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration_talent1buff' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_tangtang_speedup',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration_talent1buff: 3, ratio_speed: 0.2 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'checkCondition_2' }] },
  actionGraph: tangtangBuff3ActionGraph,
};

const tangtangBuff4ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_slow',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_waterdebuff' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'ratio_speedreduction' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff4: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration_waterdebuff' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration_waterdebuff: 30, ratio_speedreduction: 0.7 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: tangtangBuff4ActionGraph,
};

const tangtangBuff5ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_slow',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_talent1buff' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'ratio_speedreduction' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff5: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration_talent1buff' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration_talent1buff: 3, ratio_speedreduction: 0.7 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: tangtangBuff5ActionGraph,
};

const tangtangBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff6: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 10 },
  attributeModifiers: [],
  actionGraph: tangtangBuff6ActionGraph,
};

const tangtangBuff7ActionGraph = {
  main: {
    nodes: {
      findTargets_2: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'tar',
          },
        },
        next: null,
      },
      finishBuffsById_5: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0027_tangtang_normalskill_abilityentity_1'],
            reason: 'other',
          },
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'findTargets_2' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'mainTarget', owner: { kind: 'owner' } },
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

const tangtangBuff7: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: { blackboardKey: 'trigger' },
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 3, trigger: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: [{ $sequence: 'ifElse_opt1' }, { $sequence: 'finishBuffsById_5' }],
  },
  actionGraph: tangtangBuff7ActionGraph,
};

const tangtangBuff8ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_vulnerable_spell',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      readBuffRemainingDuration_2: {
        action: {
          kind: 'readBuffRemainingDuration',
          parameters: {
            target: { kind: 'owner' },
            query: { kind: 'environment' },
            outputKey: 'real_duration',
          },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'real_duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'rate_spellvulnerable' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff8: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'rate_spellvulnerable' },
  maxStackCount: { blackboardKey: 'cntmax' },
  durationSeconds: { blackboardKey: 'duration_spellvulnerable' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    cntmax: 1,
    duration_spellvulnerable: 10,
    rate_spellvulnerable: 0.05,
    real_duration: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'readBuffRemainingDuration_2' }] },
  actionGraph: tangtangBuff8ActionGraph,
};

const tangtangBuff9ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_1: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_abilityentity_duration_spellvulnerable',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_abilityentity_rate_spellvulnerable_02',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: 'modifyActionValue_1',
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_abilityentity_rate_spellvulnerable',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'modifyActionValue_2',
      },
      modifyActionValue_4: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_abilityentity_water03',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'modifyActionValue_3',
      },
      modifyActionValue_5: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_abilityentity_water02',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'modifyActionValue_4',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'EntityBB_abilityentity_water01',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'modifyActionValue_5',
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'duration_spellvulnerable' },
      },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'rate_spellvulnerable_02' },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'rate_spellvulnerable' } },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'normalskill_atk_scale03' },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'normalskill_atk_scale02' },
      },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'normalskill_atk_scale01' },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff9: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    duration_spellvulnerable: 0,
    normalskill_atk_scale01: 0,
    normalskill_atk_scale02: 0,
    normalskill_atk_scale03: 0,
    rate_spellvulnerable: 0,
    rate_spellvulnerable_02: 0,
  },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'modifyActionValue_6' } },
  ],
  actionGraph: tangtangBuff9ActionGraph,
};

const tangtangBuff10ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_2' }],
            targets: { kind: 'inputTarget' },
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
      forEachContextTarget_3: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'water_move' } },
          body: { $sequence: 'checkCondition_2' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_4: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'water_move',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_normal_skill_move'],
            owner: { kind: 'owner' },
            sameSourceSkillCast: true,
          },
        },
        next: 'forEachContextTarget_3',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'inputTarget' },
          distance: 50,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff10: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: -1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'findOwnerSpawnedAbilityEntities_4' }] },
  actionGraph: tangtangBuff10ActionGraph,
};

const tangtangBuff11ActionGraph = {
  main: {
    nodes: {
      findOwnerSpawnedAbilityEntities_1: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ultwater_abilityentity',
            abilityEntityIds: [],
            owner: { kind: 'source' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff11: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 10 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'findOwnerSpawnedAbilityEntities_1' }] },
  actionGraph: tangtangBuff11ActionGraph,
};

const tangtangBuff12ActionGraph = {
  main: {
    nodes: {
      findTargets_1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'tar',
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0027_tangtang_normalskill_abilityentity_1'],
            reason: 'other',
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff12: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: { blackboardKey: 'trigger' },
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 3, trigger: 0.1 },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: [{ $sequence: 'findTargets_1' }, { $sequence: 'finishBuffsById_2' }],
  },
  actionGraph: tangtangBuff12ActionGraph,
};

const tangtangBuff13ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0027_tangtang_ultskill_buff_damage' }],
            targets: { kind: 'mainCharacter' },
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
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'checkCondition_2',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['plungingAttack'] },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'originSkillTypeIn', skillTypes: ['plungingAttack'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff13: SkillBuffDefinition = {
  stackingType: 'refresh',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_tangtang_ultskilldebuff',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 5 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeDamageAction', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
  ],
  actionGraph: tangtangBuff13ActionGraph,
};

const tangtangBuff14ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff14: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 1 },
  attributeModifiers: [],
  actionGraph: tangtangBuff14ActionGraph,
};

const tangtangBuff15ActionGraph = {
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
          kind: 'buffStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'less',
          value: { kind: 'constant', value: 1 },
          tagQueryType: 'hasAny',
          buffTags: ['Immune/Static'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff15: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'ultskill_debuff_duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_tangtang_ultskilldebuff',
    showInHeadBarCommon: true,
  },
  applyTags: ['Skill/Character/Common/Affixes/static'],
  extendTags: [],
  blackboard: { ultskill_debuff_duration: 4 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'checkCondition_1' }] },
  actionGraph: tangtangBuff15ActionGraph,
};

const tangtangBuff16ActionGraph = {
  main: {
    nodes: {
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0027_tangtang_ultskill_abilityentity_1' }],
            targets: { kind: 'context', key: 'ultskill_watermove' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      spawnAbilityEntity_10: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'context', key: 'ultwater_abilityentity' },
            abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_move',
            childSkillId: 'chr_0027_tangtang_ult_skill_abilityentitymove',
            source: { kind: 'source' },
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'caster',
            saveToContextKey: 'ultskill_watermove',
          },
        },
        next: 'applyBuff_9',
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0027_tangtang_water_ultskillwake' }],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'water_cnt', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'applyBuff_2',
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'modifyActionValue_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      forEachContextTarget_8: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'water' } },
          body: { $sequence: 'ifElse_4' },
        },
        next: 'spawnAbilityEntity_10',
      },
      ifElse_11: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'forEachContextTarget_8' },
          whenFalse: { $sequence: 'spawnAbilityEntity_10' },
        },
        next: null,
      },
      modifyActionValue_12: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale03',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'ifElse_11',
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale02',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'modifyActionValue_12',
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'tornado_atk_scale01',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'modifyActionValue_13',
      },
      findOwnerSpawnedAbilityEntities_15: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ultwater_abilityentity',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_ultskill'],
            owner: { kind: 'owner' },
          },
        },
        next: 'modifyActionValue_14',
      },
      findOwnerSpawnedAbilityEntities_16: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'water',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_comboskill_water'],
            owner: { kind: 'owner' },
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_15',
      },
      applyBuff_17: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0027_tangtang_ultskill_abilityentity_2' }],
            targets: { kind: 'context', key: 'ultwater_move' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_18: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'applyBuff_17',
      },
      forEachContextTarget_19: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'ultwater_move' } },
          body: { $sequence: 'checkCondition_18' },
        },
        next: null,
      },
      checkCondition_20: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'forEachContextTarget_19',
      },
      findOwnerSpawnedAbilityEntities_21: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ultwater_move',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_normal_skill_move'],
            owner: { kind: 'owner' },
            sameSourceSkillCast: true,
          },
        },
        next: 'checkCondition_20',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'inputTarget' },
          distance: 50,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'water' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_3: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water03' },
      },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water02' },
      },
      data_5: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'EntityBB_abilityentity_water01' },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'context', key: 'ultwater_move' },
          distance: 50,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'ultwater_move' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
          outputKey: 'water_cnt',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff16: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    dmg_up_water_ult: 0,
    duration: 5,
    duration_spellvulnerable: 0,
    rate_spellvulnerable: 0,
    rate_spellvulnerable_02: 0,
    talent2_ultskill: 0,
    tornado_atk_scale01: 0,
    tornado_atk_scale02: 0,
    tornado_atk_scale03: 0,
    water_cnt: 0,
  },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_16' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_21' } },
  ],
  actionGraph: tangtangBuff16ActionGraph,
};

const tangtangBuff17ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff17: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: { blackboardKey: 'water_stack' },
  durationSeconds: { blackboardKey: 'duration_water' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration_water: 30, water_stack: 2 },
  attributeModifiers: [],
  actionGraph: tangtangBuff17ActionGraph,
};

const tangtangBuff18ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff18: SkillBuffDefinition = {
  stackingType: 'highPriority',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_affix_speedup',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0, rate: 0 },
  attributeModifiers: [],
  actionGraph: tangtangBuff18ActionGraph,
};

const tangtangBuff19ActionGraph = {
  main: {
    nodes: {
      setCharacterPassiveUiValue_7: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: 'caster', value: { kind: 'valueNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      modifyActionValue_8: {
        action: {
          kind: 'modifyActionValue',
          parameters: { key: 'water_num', operation: 'add', value: { kind: 'constant', value: 1 } },
        },
        next: 'setCharacterPassiveUiValue_7',
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'modifyActionValue_8',
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'water_num',
            operation: 'add',
            value: { kind: 'constant', value: -1 },
          },
        },
        next: 'setCharacterPassiveUiValue_7',
      },
      checkCondition_12: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'modifyActionValue_11',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'water_num' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: { kind: 'inputTarget' },
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0027_tangtang/ComboSkillWater'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: { kind: 'inputTarget' },
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0027_tangtang/ComboSkillWater'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff19: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { water_num: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'abilityEntitySpawned', priority: 0, sequence: { $sequence: 'checkCondition_9' } },
    { event: 'abilityEntityFinished', priority: 0, sequence: { $sequence: 'checkCondition_12' } },
  ],
  actionGraph: tangtangBuff19ActionGraph,
};

const tangtangBuff20ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff20: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: tangtangBuff20ActionGraph,
};

const tangtangBuff21ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const tangtangBuff21: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 0.1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: tangtangBuff21ActionGraph,
};

export const tangtang: OperatorDefinition = {
  slug: 'tangtang',
  gameId: 'TANGTANG',
  rarity: 6,
  weaponType: 'pistol',
  element: 'cryo',
  characterTypeId: 'Cryst',
  role: 'caster',
  mainAttribute: 'agility',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [
      13.60824742, 37.0894172110204, 61.8064380436735, 86.5234588763265, 111.24047970898,
      123.598990125306,
    ],
    agility: [
      23.50515464, 56.832106047551, 91.9131075291837, 126.994109010816, 162.075110492449,
      179.615611233265,
    ],
    intellect: [
      8.865979381, 25.2796128765204, 42.5571218191735, 59.8346307618265, 77.1121397044796,
      85.7508941758061,
    ],
    will: [
      10.30927835, 29.8969072188776, 50.5154639229592, 71.1340206270408, 91.7525773311225,
      102.061855683163,
    ],
    baseAttack: [30, 92, 157, 223, 288, 321],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  passiveUi: { kind: 'numeric', appearance: 'tangtangDroplets', maximum: 2 },
  skills: [
    tangtangChr_0027_tangtang_attack1,
    tangtangChr_0027_tangtang_attack2,
    tangtangChr_0027_tangtang_attack3,
    tangtangChr_0027_tangtang_attack4,
    tangtangChr_0027_tangtang_attack5,
    tangtangChr_0027_tangtang_power_attack,
    tangtangChr_0027_tangtang_plunging_attack_end,
    tangtangChr_0027_tangtang_normal_skill,
    tangtangChr_0027_tangtang_combo_skill,
    tangtangChr_0027_tangtang_ultimate_skill,
    tangtangCommon_character_perfect_dodge,
    tangtangChr_0027_tangtang_plunging_attack_start,
  ],
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skillIds: [
        'chr_0027_tangtang_attack1',
        'chr_0027_tangtang_attack2',
        'chr_0027_tangtang_attack3',
        'chr_0027_tangtang_attack4',
        'chr_0027_tangtang_attack5',
      ],
    },
    { key: 'finisher', operationType: 'finisher', skillIds: ['chr_0027_tangtang_power_attack'] },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skillIds: ['chr_0027_tangtang_plunging_attack_end'],
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skillIds: ['chr_0027_tangtang_normal_skill'],
    },
    { key: 'ultimate', operationType: 'ultimate', skillIds: ['chr_0027_tangtang_ultimate_skill'] },
    { key: 'comboSkill', operationType: 'comboSkill', skillIds: ['chr_0027_tangtang_combo_skill'] },
  ],
  dodgeSkillId: 'common_character_perfect_dodge',
  plungingAttack: {
    startSkillId: 'chr_0027_tangtang_plunging_attack_start',
    endSkillId: 'chr_0027_tangtang_plunging_attack_end',
    startDurationSeconds: 0.633,
    endDurationSeconds: 2,
  },
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0027_tangtang_normal_skill',
      replacementSkillKeys: [],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0027_tangtang_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0027_tangtang_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0027_tangtang_attack1',
        'chr_0027_tangtang_attack2',
        'chr_0027_tangtang_attack3',
        'chr_0027_tangtang_attack4',
        'chr_0027_tangtang_attack5',
        'chr_0027_tangtang_plunging_attack_end',
        'chr_0027_tangtang_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0027_tangtang_attack1',
        'chr_0027_tangtang_attack2',
        'chr_0027_tangtang_attack3',
        'chr_0027_tangtang_attack4',
        'chr_0027_tangtang_attack5',
      ],
      defaultSkillKey: 'chr_0027_tangtang_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  playerActionModes: [],
  comboSkillConditions: [tangtangComboCondition1, tangtangComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_combo_skill',
          blackboardKey: 'talent1_speed',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_combo_skill',
          blackboardKey: 'ratio_speedreduction',
          operation: 'assign',
          value: [0.2, 0.4],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_combo_skill',
          blackboardKey: 'ratio_speed',
          operation: 'assign',
          value: [0.1, 0.2],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_combo_skill',
          blackboardKey: 'duration_talent1buff',
          operation: 'assign',
          value: [3, 3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_combo_skill',
          blackboardKey: 'range_talent1buff',
          operation: 'assign',
          value: [5, 5],
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_ultimate_skill',
          blackboardKey: 'talent2',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_combo_skill',
          blackboardKey: 'talent2',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_ultimate_skill',
          blackboardKey: 'dmg_up_water_ult',
          operation: 'assign',
          value: [0.4, 0.6],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_combo_skill',
          blackboardKey: 'dmg_up_water_ult',
          operation: 'assign',
          value: [0.4, 0.6],
        },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        { kind: 'addSkillCooldownFrames', skillKey: 'chr_0027_tangtang_combo_skill', frames: -60 },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_combo_skill',
          blackboardKey: 'potential1',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_normal_skill',
          blackboardKey: 'atb_return',
          operation: 'add',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_combo_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 20 },
        { kind: 'addStaticDamageIncrease', target: 'cryo', value: 0.1 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_normal_skill',
          blackboardKey: 'potential3',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_normal_skill',
          blackboardKey: 'rate_spellvulnerable',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_normal_skill',
          blackboardKey: 'rate_spellvulnerable_02',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_ultimate_skill',
          blackboardKey: 'rate_spellvulnerable',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_ultimate_skill',
          blackboardKey: 'rate_spellvulnerable_02',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_normal_skill',
          blackboardKey: 'atk_scale_1',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0027_tangtang_passive_0',
          blackboardKey: 'normalskill_atk_scale01',
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
          skillKey: 'chr_0027_tangtang_ultimate_skill',
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
          skillKey: 'chr_0027_tangtang_ultimate_skill',
          blackboardKey: 'potential5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_combo_skill',
          blackboardKey: 'potential5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_ultimate_skill',
          blackboardKey: 'atk_scale_1',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_ultimate_skill',
          blackboardKey: 'atk_scale_2',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_ultimate_skill',
          blackboardKey: 'atk_scale_3',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_combo_skill',
          blackboardKey: 'dmg_up_water_ult',
          operation: 'add',
          value: 0.8,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0027_tangtang_ultimate_skill',
          blackboardKey: 'dmg_up_water_ult',
          operation: 'add',
          value: 0.8,
        },
      ],
    },
  ],
  entityBlackboard: {
    EntityBB_abilityentity_duration_spellvulnerable: 0,
    EntityBB_abilityentity_rate_spellvulnerable: 0,
    EntityBB_abilityentity_rate_spellvulnerable_02: 0,
    EntityBB_abilityentity_water01: 0,
    EntityBB_abilityentity_water02: 0,
    EntityBB_abilityentity_water03: 0,
  },
  passiveSkills: [tangtangPassive1],
  buffDefinitions: {
    buff_chr_0027_tangtang_comboskill_spelllnfliction: tangtangBuff1,
    buff_chr_0027_tangtang_comboskill_waterbuff: tangtangBuff2,
    buff_chr_0027_tangtang_comboskill_waterbuff_outaura: tangtangBuff3,
    buff_chr_0027_tangtang_comboskill_waterdebuff: tangtangBuff4,
    buff_chr_0027_tangtang_comboskill_waterdebuff_outaura: tangtangBuff5,
    buff_chr_0027_tangtang_normalskill_abilityentity_1: tangtangBuff6,
    buff_chr_0027_tangtang_normalskill_abilityentity_2: tangtangBuff7,
    buff_chr_0027_tangtang_normalskill_spellvulnerable: tangtangBuff8,
    buff_chr_0027_tangtang_passive_0: tangtangBuff9,
    buff_chr_0027_tangtang_skillappear: tangtangBuff10,
    buff_chr_0027_tangtang_ultskill_abilityentity_1: tangtangBuff11,
    buff_chr_0027_tangtang_ultskill_abilityentity_2: tangtangBuff12,
    buff_chr_0027_tangtang_ultskill_buff: tangtangBuff13,
    buff_chr_0027_tangtang_ultskill_buff_damage: tangtangBuff14,
    buff_chr_0027_tangtang_ultskill_debuff: tangtangBuff15,
    buff_chr_0027_tangtang_ultskill_waterwake: tangtangBuff16,
    buff_chr_0027_tangtang_water: tangtangBuff17,
    buff_chr_0027_tangtang_water_icon: tangtangBuff18,
    buff_chr_0027_tangtang_water_passiveui: tangtangBuff19,
    buff_chr_0027_tangtang_water_ultskillwake: tangtangBuff20,
    buff_chr_0027_tangtang_water_wake: tangtangBuff21,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0027_tangtang_normal_skill_move: {
      faction: 'good',
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0027_tangtang/NormalSkillWaterMove',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_abilityentitymove: {
          actionGraph: {
            main: {
              nodes: {
                spawnAbilityEntity_12: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'owner' },
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit',
                      source: { kind: 'source' },
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: null,
                },
                spawnAbilityEntity_7: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'owner' },
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_02_02',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
                      source: { kind: 'source' },
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: null,
                },
                spawnAbilityEntity_8: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'owner' },
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_02',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
                      source: { kind: 'source' },
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'spawnAbilityEntity_7',
                },
                spawnAbilityEntity_3: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'owner' },
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03_03',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
                      source: { kind: 'source' },
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: null,
                },
                spawnAbilityEntity_4: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'owner' },
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03_02',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
                      source: { kind: 'source' },
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'spawnAbilityEntity_3',
                },
                spawnAbilityEntity_5: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'owner' },
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
                      source: { kind: 'source' },
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'spawnAbilityEntity_4',
                },
                ifElse_10: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_2' },
                    whenTrue: { $sequence: 'spawnAbilityEntity_5' },
                    whenFalse: { $sequence: 'spawnAbilityEntity_8' },
                  },
                  next: null,
                },
                ifElse_13: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_3' },
                    whenTrue: { $sequence: 'ifElse_10' },
                    whenFalse: { $sequence: 'spawnAbilityEntity_12' },
                  },
                  next: null,
                },
                finishOwner_14: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
                applyBuff_15: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_1' }],
                      targets: { kind: 'owner' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'water_cnt', fallback: 0 },
                },
                data_2: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 2 },
                  },
                },
                data_3: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    operator: 'greater',
                    right: { kind: 'constant', value: 0 },
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_abilityentitymove',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 300,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, duration: 5, poise: 5, poise_tornado: 0, water_cnt: 0 },
          scheduledSequences: [
            { startFrame: 12, endFrame: 12, sequence: { $sequence: 'ifElse_13' } },
            { startFrame: 298, endFrame: 298, sequence: { $sequence: 'finishOwner_14' } },
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'applyBuff_15' } },
          ],
        },
        chr_0027_tangtang_ult_skill_abilityentitymove: {
          actionGraph: {
            main: {
              nodes: {
                spawnAbilityEntity_12: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'owner' },
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit',
                      source: { kind: 'source' },
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: null,
                },
                spawnAbilityEntity_7: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'owner' },
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_02_02',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
                      source: { kind: 'source' },
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: null,
                },
                spawnAbilityEntity_8: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'owner' },
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_02',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
                      source: { kind: 'source' },
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'spawnAbilityEntity_7',
                },
                spawnAbilityEntity_3: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'owner' },
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03_03',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
                      source: { kind: 'source' },
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: null,
                },
                spawnAbilityEntity_4: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'owner' },
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03_02',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
                      source: { kind: 'source' },
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'spawnAbilityEntity_3',
                },
                spawnAbilityEntity_5: {
                  action: {
                    kind: 'spawnAbilityEntity',
                    parameters: {
                      bornAt: { kind: 'owner' },
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03',
                      childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
                      source: { kind: 'source' },
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'currentAbilityEntity',
                    },
                  },
                  next: 'spawnAbilityEntity_4',
                },
                ifElse_10: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_2' },
                    whenTrue: { $sequence: 'spawnAbilityEntity_5' },
                    whenFalse: { $sequence: 'spawnAbilityEntity_8' },
                  },
                  next: null,
                },
                ifElse_13: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_3' },
                    whenTrue: { $sequence: 'ifElse_10' },
                    whenFalse: { $sequence: 'spawnAbilityEntity_12' },
                  },
                  next: null,
                },
                finishOwner_14: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'water_cnt', fallback: 0 },
                },
                data_2: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 2 },
                  },
                },
                data_3: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_1' },
                    operator: 'greater',
                    right: { kind: 'constant', value: 0 },
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_ult_skill_abilityentitymove',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 151,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atk_scale: 0.1,
            dmg_up_water_ult: 0,
            duration: 5,
            poise: 5,
            poise_tornado: 0,
            talent2_ultskill: 0,
            water_cnt: 0,
          },
          scheduledSequences: [
            { startFrame: 18, endFrame: 18, sequence: { $sequence: 'ifElse_13' } },
            { startFrame: 150, endFrame: 150, sequence: { $sequence: 'finishOwner_14' } },
          ],
        },
      },
    },
    abilityentity_chr_0027_tangtang_comboskill_water: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Immune/Stunned',
        'Immune/Frozen',
        'Immune/Airborne',
        'Immune/KnockDown',
        'Immune/KnockBack',
        'Immune/Pull',
        'Immune/PowerSmash',
        'Immune/Poise',
        'Skill/Character/chr_0027_tangtang/ComboSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 2,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              launchProjectile_3: {
                action: {
                  kind: 'launchProjectile',
                  parameters: {
                    inheritActionBlackboard: true,
                    projectileId: 'projectile_chr_0027_tangtang_waterwake01',
                    recycleDelaySeconds: 0,
                    targets: { kind: 'context', contextKey: 'tangtang' },
                    launch: {
                      start: { target: { kind: 'context', key: 'water_back_pos' } },
                      segmentTargets: [
                        { target: { kind: 'context', key: 'tangtang' } },
                        { target: { kind: 'context', key: 'tangtang' } },
                      ],
                    },
                  },
                  callbacks: [],
                },
                next: null,
              },
              finishBuffsById_7: {
                action: {
                  kind: 'finishBuffsById',
                  parameters: {
                    targets: { kind: 'source' },
                    finishSource: { kind: 'source' },
                    buffIds: ['buff_chr_0027_tangtang_water'],
                    reason: 'other',
                    count: { kind: 'constant', value: 1 },
                  },
                },
                next: null,
              },
              launchProjectile_13: {
                action: {
                  kind: 'launchProjectile',
                  parameters: {
                    inheritActionBlackboard: true,
                    projectileId: 'projectile_chr_0027_tangtang_waterwake01',
                    recycleDelaySeconds: 0,
                    targets: { kind: 'context', contextKey: 'ultskill_center_abilityentity' },
                    launch: {
                      start: { target: { kind: 'context', key: 'water_back_pos' } },
                      segmentTargets: [
                        { target: { kind: 'context', key: 'ultskill_center_abilityentity' } },
                        { target: { kind: 'context', key: 'ultskill_center_abilityentity' } },
                      ],
                    },
                  },
                  callbacks: [],
                },
                next: null,
              },
              checkCondition_17: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                },
                next: null,
              },
              checkCondition_18: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                },
                next: 'checkCondition_17',
              },
              jumpTimeline_25: {
                action: {
                  kind: 'jumpTimeline',
                  parameters: { destinationFrame: 1500 },
                  condition: { kind: 'conditionNode', nodeId: 'data_3' },
                },
                next: null,
              },
              jumpTimeline_27: {
                action: {
                  kind: 'jumpTimeline',
                  parameters: { destinationFrame: 1515 },
                  condition: { kind: 'conditionNode', nodeId: 'data_4' },
                },
                next: null,
              },
              finishOwner_28: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
              finishOwner_31: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: 'finishBuffsById_7',
              },
              applyBuff_35: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      {
                        buffId: 'buff_chr_0027_tangtang_comboskill_waterdebuff_outaura',
                        copiedBlackboardAssignments: {
                          duration_talent1buff: 'duration_talent1buff',
                          ratio_speedreduction: 'ratio_speedreduction',
                        },
                      },
                    ],
                    targets: { kind: 'inputTarget' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              finishBuffsById_34: {
                action: {
                  kind: 'finishBuffsById',
                  parameters: {
                    targets: { kind: 'inputTarget' },
                    finishSource: { kind: 'source' },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_waterdebuff_outaura'],
                    reason: 'other',
                  },
                },
                next: null,
              },
              applyBuff_37: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      {
                        buffId: 'buff_chr_0027_tangtang_comboskill_waterbuff_outaura',
                        copiedBlackboardAssignments: {
                          duration_talent1buff: 'duration_talent1buff',
                          ratio_speed: 'ratio_speed',
                        },
                      },
                    ],
                    targets: { kind: 'inputTarget' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              finishBuffsById_36: {
                action: {
                  kind: 'finishBuffsById',
                  parameters: {
                    targets: { kind: 'inputTarget' },
                    finishSource: { kind: 'source' },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_waterbuff_outaura'],
                    reason: 'other',
                  },
                },
                next: null,
              },
              aura_38: {
                action: {
                  kind: 'aura',
                  parameters: {
                    targets: { kind: 'characterTeam', excludeOwner: true },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                    buffs: [
                      {
                        buffId: 'buff_chr_0027_tangtang_comboskill_waterbuff',
                        blackboardAssignments: {
                          ratio_speed: { kind: 'valueNode', nodeId: 'data_5' },
                        },
                        stringBlackboardAssignments: {},
                      },
                    ],
                  },
                  onEnter: { $sequence: 'finishBuffsById_36' },
                  onExit: { $sequence: 'applyBuff_37' },
                },
                next: null,
              },
              aura_39: {
                action: {
                  kind: 'aura',
                  parameters: {
                    targets: { kind: 'fixed', target: 'enemy' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                    buffs: [
                      {
                        buffId: 'buff_chr_0027_tangtang_comboskill_waterdebuff',
                        blackboardAssignments: {
                          ratio_speedreduction: { kind: 'valueNode', nodeId: 'data_6' },
                        },
                        stringBlackboardAssignments: {},
                      },
                    ],
                  },
                  onEnter: { $sequence: 'finishBuffsById_34' },
                  onExit: { $sequence: 'applyBuff_35' },
                },
                next: 'aura_38',
              },
              checkCondition_40: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
                },
                next: 'aura_39',
              },
              ifElse_opt1: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_9' },
                  whenTrue: { $sequence: 'launchProjectile_3' },
                  whenFalse: { $sequence: 'launchProjectile_3' },
                },
                next: null,
              },
              ifElse_opt2: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_10' },
                  whenTrue: { $sequence: 'launchProjectile_3' },
                  whenFalse: { $sequence: 'ifElse_opt1' },
                },
                next: 'finishBuffsById_7',
              },
              createSpatialPointTargets_opt3: {
                action: {
                  kind: 'createSpatialPointTargets',
                  parameters: {
                    saveToContextKey: 'water_back_pos',
                    count: { kind: 'constant', value: 1 },
                    origin: { kind: 'owner' },
                    offset: {
                      local: [
                        { kind: 'constant', value: 0 },
                        { kind: 'constant', value: 0 },
                        { kind: 'constant', value: 0 },
                      ],
                      facing: {
                        source: { kind: 'owner' },
                        target: { kind: 'context', key: 'tangtang' },
                        invert: true,
                      },
                      rotation: [0, 0, 0, 1],
                      centerOnGround: false,
                    },
                  },
                },
                next: 'ifElse_opt2',
              },
              findOwnerSpawnedAbilityEntities_opt4: {
                action: {
                  kind: 'findOwnerSpawnedAbilityEntities',
                  parameters: {
                    saveToContextKey: 'tangtang',
                    abilityEntityIds: ['abilityentity_chr_0027_tangtang_normal_skill_move'],
                    owner: { kind: 'source' },
                  },
                },
                next: 'createSpatialPointTargets_opt3',
              },
              ifElse_opt5: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_11' },
                  whenTrue: { $sequence: 'launchProjectile_13' },
                  whenFalse: { $sequence: 'launchProjectile_13' },
                },
                next: null,
              },
              ifElse_opt6: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_12' },
                  whenTrue: { $sequence: 'launchProjectile_13' },
                  whenFalse: { $sequence: 'ifElse_opt5' },
                },
                next: 'finishBuffsById_7',
              },
              ifElse_opt7: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_13' },
                  whenTrue: { $sequence: 'ifElse_opt6' },
                  whenFalse: { $sequence: null },
                },
                next: null,
              },
              findOwnerSpawnedAbilityEntities_opt8: {
                action: {
                  kind: 'findOwnerSpawnedAbilityEntities',
                  parameters: {
                    saveToContextKey: 'ultskill_center_abilityentity',
                    abilityEntityIds: ['abilityentity_chr_0027_tangtang_ultskill'],
                    owner: { kind: 'source' },
                  },
                },
                next: 'ifElse_opt7',
              },
              createSpatialPointTargets_opt9: {
                action: {
                  kind: 'createSpatialPointTargets',
                  parameters: {
                    saveToContextKey: 'water_back_pos',
                    count: { kind: 'constant', value: 1 },
                    origin: { kind: 'owner' },
                    offset: {
                      local: [
                        { kind: 'constant', value: 0 },
                        { kind: 'constant', value: 0 },
                        { kind: 'constant', value: 0 },
                      ],
                      facing: 'operatorToEnemy',
                      rotation: [0, 0, 0, 1],
                      centerOnGround: false,
                    },
                  },
                },
                next: 'findOwnerSpawnedAbilityEntities_opt8',
              },
            },
            dataNodes: {
              data_1: {
                type: 'boolean',
                expression: {
                  kind: 'entityCountCompare',
                  target: { kind: 'context', key: 'ultskill_center_abilityentity' },
                  containsHittableTarget: false,
                  excludeDeadEntity: false,
                  operator: 'greaterOrEqual',
                  value: 1,
                },
              },
              data_2: {
                type: 'boolean',
                expression: {
                  kind: 'targetDistance',
                  source: { kind: 'mainCharacter' },
                  target: { kind: 'context', key: 'ultskill_center_abilityentity' },
                  distance: 8,
                  lessThan: true,
                  includeTargetRadius: false,
                  containsHittableObject: false,
                },
              },
              data_3: {
                type: 'boolean',
                expression: {
                  kind: 'buffIdStackCompare',
                  target: { kind: 'owner' },
                  compareZeroWhenTargetMissing: true,
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                  buffIds: ['buff_chr_0027_tangtang_water_wake'],
                },
              },
              data_4: {
                type: 'boolean',
                expression: {
                  kind: 'buffIdStackCompare',
                  target: { kind: 'owner' },
                  compareZeroWhenTargetMissing: true,
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                  buffIds: ['buff_chr_0027_tangtang_water_ultskillwake'],
                },
              },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'ratio_speed' } },
              data_6: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'ratio_speedreduction' },
              },
              data_7: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'talent1_speed', fallback: 0 },
              },
              data_8: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_7' },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
              },
              data_9: {
                type: 'boolean',
                expression: { kind: 'checkActionResult', action: { $sequence: null } },
              },
              data_10: {
                type: 'boolean',
                expression: {
                  kind: 'timedMarkerPresent',
                  target: { kind: 'owner' },
                  returnTrueIfNotExists: false,
                  markerId: 'tangtang_waterabilityentity01',
                },
              },
              data_11: {
                type: 'boolean',
                expression: { kind: 'checkActionResult', action: { $sequence: null } },
              },
              data_12: {
                type: 'boolean',
                expression: {
                  kind: 'timedMarkerPresent',
                  target: { kind: 'owner' },
                  returnTrueIfNotExists: false,
                  markerId: 'tangtang_waterabilityentity01',
                },
              },
              data_13: {
                type: 'boolean',
                expression: {
                  kind: 'checkActionResult',
                  action: { $sequence: 'checkCondition_18' },
                },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0027_tangtang_combo_skill_water',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 1550,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          duration_talent1buff: 3,
          ratio_speed: 0.2,
          ratio_speedreduction: 0.8,
          talent1_speed: 0,
        },
        scheduledSequences: [
          {
            startFrame: 1500,
            endFrame: 1501,
            sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_opt4' },
          },
          {
            startFrame: 1515,
            endFrame: 1516,
            sequence: { $sequence: 'createSpatialPointTargets_opt9' },
          },
          { startFrame: 0, endFrame: 1500, sequence: { $sequence: 'jumpTimeline_25' } },
          { startFrame: 0, endFrame: 1500, sequence: { $sequence: 'jumpTimeline_27' } },
          { startFrame: 1500, endFrame: 1501, sequence: { $sequence: 'finishOwner_28' } },
          { startFrame: 1515, endFrame: 1516, sequence: { $sequence: 'finishOwner_28' } },
          { startFrame: 900, endFrame: 901, sequence: { $sequence: 'finishOwner_31' } },
          { startFrame: 1500, endFrame: 1501, sequence: { $sequence: 'finishOwner_28' } },
          { startFrame: 1515, endFrame: 1516, sequence: { $sequence: 'finishOwner_28' } },
          { startFrame: 0, endFrame: 1500, sequence: { $sequence: 'checkCondition_40' } },
        ],
      },
    },
    abilityentity_chr_0027_tangtang_ultskill: {
      faction: 'good',
      bornTags: [
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Category/EnergyShard/Pulse',
        'Skill/Character/chr_0027_tangtang/UltSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 10 },
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              mergeContextTargets_2: {
                action: {
                  kind: 'mergeContextTargets',
                  parameters: {
                    saveToContextKey: 'tar2',
                    sources: [{ kind: 'fixed', target: 'enemy' }],
                  },
                },
                next: null,
              },
              once_4: {
                action: { kind: 'once', parameters: {}, body: { $sequence: null } },
                next: null,
              },
              dealDamage_5: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    attacker: 'actionSource',
                    target: { kind: 'inputTarget' },
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                  },
                  key: 'abilityentity_chr_0027_tangtang_ultskill:chr_0027_tangtang_ultimate_skill_1:/childSkill/actionGraph/main/nodes/dealDamage_5/action',
                },
                next: 'once_4',
              },
              repeatEachTick_6: {
                action: {
                  kind: 'repeatEachTick',
                  parameters: {
                    nativeChanneling: {
                      catchUpMissedTicks: false,
                      target: { kind: 'fixed', target: 'enemy' },
                      executeEachFrame: true,
                      triggerIntervalSeconds: 0.033,
                      maxCountPerTarget: 8,
                      targetTriggerIntervalSeconds: 0.5,
                    },
                  },
                  body: { $sequence: 'dealDamage_5' },
                },
                next: null,
              },
              dealDamage_7: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    attacker: 'actionSource',
                    target: { kind: 'context', key: 'tar2' },
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                    takeAttackSnapshot: true,
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_3' },
                  },
                  key: 'abilityentity_chr_0027_tangtang_ultskill:chr_0027_tangtang_ultimate_skill_1:/childSkill/actionGraph/main/nodes/dealDamage_7/action',
                },
                next: null,
              },
              startTimeDilation_8: {
                action: {
                  kind: 'startTimeDilation',
                  parameters: {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.15 },
                    slot: 'TimeDilation/Layer/Entity/HitStop',
                    priority: 10,
                    curve: { kind: 'named', key: 'char_hard_stop' },
                    finishByAction: false,
                    targets: ['controlled'],
                  },
                },
                next: null,
              },
              dealDamage_9: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    attacker: 'actionSource',
                    target: { kind: 'context', key: 'tar2' },
                    damageType: 'cryo',
                    attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                    takeAttackSnapshot: true,
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'valueNode', nodeId: 'data_5' },
                  },
                  key: 'abilityentity_chr_0027_tangtang_ultskill:chr_0027_tangtang_ultimate_skill_1:/childSkill/actionGraph/main/nodes/dealDamage_9/action',
                },
                next: 'startTimeDilation_8',
              },
              finishBuffsById_10: {
                action: {
                  kind: 'finishBuffsById',
                  parameters: {
                    targets: { kind: 'inputTarget' },
                    finishSource: { kind: 'source' },
                    buffIds: ['buff_chr_0027_tangtang_ultskill_debuff'],
                    reason: 'other',
                  },
                },
                next: null,
              },
              finishBuffsById_11: {
                action: {
                  kind: 'finishBuffsById',
                  parameters: {
                    targets: { kind: 'inputTarget' },
                    finishSource: { kind: 'source' },
                    buffIds: ['buff_chr_0027_tangtang_ultskill_buff'],
                    reason: 'other',
                  },
                },
                next: null,
              },
              aura_12: {
                action: {
                  kind: 'aura',
                  parameters: {
                    targets: { kind: 'characterTeam', excludeOwner: true },
                    source: { kind: 'owner' },
                    iconDurationSource: {
                      kind: 'actionOwnerTimedMarker',
                      markerId: 'tangtang_ult',
                    },
                    inheritSourceSkillCastInfo: true,
                    buffs: [{ buffId: 'buff_chr_0027_tangtang_ultskill_buff' }],
                  },
                  onEnter: { $sequence: null },
                  onExit: { $sequence: 'finishBuffsById_11' },
                },
                next: null,
              },
              aura_13: {
                action: {
                  kind: 'aura',
                  parameters: {
                    targets: { kind: 'fixed', target: 'enemy' },
                    source: { kind: 'source' },
                    iconDurationSource: {
                      kind: 'actionOwnerTimedMarker',
                      markerId: 'tangtang_ult',
                    },
                    inheritSourceSkillCastInfo: true,
                    buffs: [{ buffId: 'buff_chr_0027_tangtang_ultskill_debuff' }],
                  },
                  onEnter: { $sequence: null },
                  onExit: { $sequence: 'finishBuffsById_10' },
                },
                next: 'aura_12',
              },
              createTimedMarker_14: {
                action: {
                  kind: 'createTimedMarker',
                  parameters: {
                    targets: { kind: 'owner' },
                    markerId: 'tangtang_ult',
                    durationSeconds: { kind: 'constant', value: 4 },
                    autoFinishByAction: true,
                    timeDomain: 'self',
                  },
                },
                next: 'aura_13',
              },
              aura_20: {
                action: {
                  kind: 'aura',
                  parameters: {
                    targets: { kind: 'fixed', target: 'enemy' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                    buffs: [{ buffId: 'buff_chr_0027_tangtang_ultskill_debuff' }],
                  },
                  onEnter: { $sequence: null },
                  onExit: { $sequence: 'finishBuffsById_10' },
                },
                next: null,
              },
              applyBuff_22: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      {
                        buffId: 'buff_chr_0027_tangtang_ultskill_waterwake',
                        copiedBlackboardAssignments: {
                          talent2_ultskill: 'talent2_ultskill',
                          dmg_up_water_ult: 'dmg_up_water_ult',
                          rate_spellvulnerable: 'rate_spellvulnerable',
                          rate_spellvulnerable_02: 'rate_spellvulnerable_02',
                          duration_spellvulnerable: 'duration_spellvulnerable',
                        },
                      },
                    ],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              checkCondition_23: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
                },
                next: 'applyBuff_22',
              },
              interruptCurrentSkill_24: {
                action: {
                  kind: 'interruptCurrentSkill',
                  parameters: { targets: { kind: 'owner' } },
                },
                next: null,
              },
              jumpTimeline_25: {
                action: {
                  kind: 'jumpTimeline',
                  parameters: { destinationFrame: 128 },
                  condition: { kind: 'conditionNode', nodeId: 'data_8' },
                },
                next: null,
              },
              checkCondition_26: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
                },
                next: 'jumpTimeline_25',
              },
              listenForCombatEvents_27: {
                action: {
                  kind: 'listenForCombatEvents',
                  parameters: {
                    responses: [
                      {
                        key: 'SkillData.chr_0027_tangtang_ultimate_skill_1.actionGroupData.timelineActions[12]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                        event: { kind: 'abilityEvent', event: 'outputBuff' },
                        phase: 'dataAction',
                        priority: 0,
                        sequence: { $sequence: 'checkCondition_26' },
                      },
                    ],
                  },
                },
                next: null,
              },
              finishOwner_28: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
              ifElse_opt1: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_10' },
                  whenTrue: { $sequence: 'aura_20' },
                  whenFalse: { $sequence: 'aura_20' },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
              data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise3' } },
              data_6: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'talent2', fallback: 0 },
              },
              data_7: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_6' },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
              },
              data_8: {
                type: 'boolean',
                expression: { kind: 'checkActionResult', action: { $sequence: null } },
              },
              data_9: {
                type: 'boolean',
                expression: {
                  kind: 'buffIdStackCompare',
                  target: { kind: 'mainCharacter' },
                  compareZeroWhenTargetMissing: true,
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                  buffIds: ['buff_chr_0027_tangtang_ultskill_buff_damage'],
                },
              },
              data_10: {
                type: 'boolean',
                expression: { kind: 'checkActionResult', action: { $sequence: null } },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0027_tangtang_ultimate_skill_1',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 210,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale_1: 0,
          atk_scale_2: 0,
          atk_scale_3: 0,
          dmg_up_water_ult: 0,
          duration_spellvulnerable: 0,
          poise2: 0,
          poise3: 0,
          rate_spellvulnerable: 0,
          rate_spellvulnerable_02: 0,
          talent2: 0,
          talent2_ultskill: 0,
        },
        scheduledSequences: [
          { startFrame: 120, endFrame: 123, sequence: { $sequence: 'mergeContextTargets_2' } },
          { startFrame: 133, endFrame: 136, sequence: { $sequence: 'mergeContextTargets_2' } },
          { startFrame: 0, endFrame: 120, sequence: { $sequence: 'repeatEachTick_6' } },
          { startFrame: 120, endFrame: 123, sequence: { $sequence: 'dealDamage_7' } },
          { startFrame: 133, endFrame: 136, sequence: { $sequence: 'dealDamage_9' } },
          { startFrame: 0, endFrame: 121, sequence: { $sequence: 'createTimedMarker_14' } },
          { startFrame: 128, endFrame: 136, sequence: { $sequence: 'ifElse_opt1' } },
          { startFrame: 128, endFrame: 128, sequence: { $sequence: 'checkCondition_23' } },
          { startFrame: 127, endFrame: 128, sequence: { $sequence: 'interruptCurrentSkill_24' } },
          { startFrame: 0, endFrame: 119, sequence: { $sequence: 'listenForCombatEvents_27' } },
          { startFrame: 127, endFrame: 128, sequence: { $sequence: 'finishOwner_28' } },
          { startFrame: 156, endFrame: 157, sequence: { $sequence: 'finishOwner_28' } },
        ],
      },
      presentation: {
        icon: 'endaxis:operators/tangtang/ultimate_01',
        nameKey: 'effects.name.oldenStare',
        placement: 'enemy',
        damageDisplayBuffId: 'buff_chr_0027_tangtang_ultskill_debuff',
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_03_03: {
      faction: 'good',
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0027_tangtang/NormalSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_water_projhit_2: {
          actionGraph: {
            main: {
              nodes: {
                mergeContextTargets_1: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: {
                      saveToContextKey: 'tar',
                      sources: [{ kind: 'fixed', target: 'enemy' }],
                    },
                  },
                  next: null,
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction' }],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_4: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'applyBuff_3',
                },
                applyBuff_6: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                          copiedBlackboardAssignments: {
                            duration_spellvulnerable: 'duration_spellvulnerable',
                            rate_spellvulnerable: 'rate_spellvulnerable_02',
                          },
                        },
                      ],
                      targets: { kind: 'context', key: 'tar' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                dealDamage_8: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      alwaysNext: false,
                      attacker: 'actionSource',
                      target: { kind: 'inputTarget' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      instantDamageScaleModifiers: [
                        {
                          side: 'attacker',
                          zone: 'normal',
                          addition: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      ],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/actionGraph/main/nodes/dealDamage_8/action',
                  },
                  next: null,
                },
                dealDamage_9: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      alwaysNext: false,
                      attacker: 'actionSource',
                      target: { kind: 'inputTarget' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/actionGraph/main/nodes/dealDamage_9/action',
                  },
                  next: null,
                },
                ifElse_10: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_5' },
                    whenTrue: { $sequence: 'dealDamage_8' },
                    whenFalse: { $sequence: 'dealDamage_9' },
                  },
                  next: null,
                },
                ifElse_11: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_7' },
                    whenTrue: { $sequence: 'applyBuff_6' },
                    whenFalse: { $sequence: null },
                  },
                  next: 'ifElse_10',
                },
                ifElse_12: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                    whenTrue: { $sequence: 'applyElementalInfliction_4' },
                    whenFalse: { $sequence: null },
                  },
                  next: 'ifElse_11',
                },
                repeatEachTick_13: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        catchUpMissedTicks: false,
                        target: { kind: 'fixed', target: 'enemy' },
                        executeEachFrame: false,
                        triggerIntervalSeconds: 0.26,
                        maxCountPerTarget: -1,
                        targetTriggerIntervalSeconds: -1,
                      },
                    },
                    body: { $sequence: 'ifElse_12' },
                  },
                  next: null,
                },
                once_14: {
                  action: { kind: 'once', parameters: {}, body: { $sequence: null } },
                  next: 'repeatEachTick_13',
                },
                finishOwner_15: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                },
                data_5: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_4' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_6: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'inputTarget' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_6' },
                    buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                    sameSourceSkillCast: true,
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                },
                data_9: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'inputTarget' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_8' },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                    sameSourceSkillCast: true,
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 95,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            dmg_up_water_ult: 0.3,
            duration_spellvulnerable: 10,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            rate_spellvulnerable_02: 0.1,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'mergeContextTargets_1' } },
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'once_14' } },
            { startFrame: 90, endFrame: 90, sequence: { $sequence: 'finishOwner_15' } },
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'context', key: 'tar' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'finishBuffsById_1',
                },
                checkCondition_3: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                  },
                  next: 'applyElementalInfliction_2',
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
                      targets: { kind: 'source' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'checkCondition_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      attacker: 'actionSource',
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'applyBuff_4',
                },
                mergeContextTargets_6: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: {
                      saveToContextKey: 'tar',
                      sources: [{ kind: 'fixed', target: 'enemy' }],
                    },
                  },
                  next: 'dealDamage_5',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'context', key: 'tar' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                  },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, poise: 5 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'mergeContextTargets_6' } },
          ],
        },
      },
      presentation: {
        icon: 'endaxis:operators/tangtang/talent_2',
        nameKey: 'effects.name.waterspouts',
        placement: 'enemy',
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_03_02: {
      faction: 'good',
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0027_tangtang/NormalSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_water_projhit_2: {
          actionGraph: {
            main: {
              nodes: {
                mergeContextTargets_1: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: {
                      saveToContextKey: 'tar',
                      sources: [{ kind: 'fixed', target: 'enemy' }],
                    },
                  },
                  next: null,
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction' }],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_4: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'applyBuff_3',
                },
                applyBuff_6: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                          copiedBlackboardAssignments: {
                            duration_spellvulnerable: 'duration_spellvulnerable',
                            rate_spellvulnerable: 'rate_spellvulnerable_02',
                          },
                        },
                      ],
                      targets: { kind: 'context', key: 'tar' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                dealDamage_8: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      alwaysNext: false,
                      attacker: 'actionSource',
                      target: { kind: 'inputTarget' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      instantDamageScaleModifiers: [
                        {
                          side: 'attacker',
                          zone: 'normal',
                          addition: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      ],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03_02:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/actionGraph/main/nodes/dealDamage_8/action',
                  },
                  next: null,
                },
                dealDamage_9: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      alwaysNext: false,
                      attacker: 'actionSource',
                      target: { kind: 'inputTarget' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03_02:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/actionGraph/main/nodes/dealDamage_9/action',
                  },
                  next: null,
                },
                ifElse_10: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_5' },
                    whenTrue: { $sequence: 'dealDamage_8' },
                    whenFalse: { $sequence: 'dealDamage_9' },
                  },
                  next: null,
                },
                ifElse_11: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_7' },
                    whenTrue: { $sequence: 'applyBuff_6' },
                    whenFalse: { $sequence: null },
                  },
                  next: 'ifElse_10',
                },
                ifElse_12: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                    whenTrue: { $sequence: 'applyElementalInfliction_4' },
                    whenFalse: { $sequence: null },
                  },
                  next: 'ifElse_11',
                },
                repeatEachTick_13: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        catchUpMissedTicks: false,
                        target: { kind: 'fixed', target: 'enemy' },
                        executeEachFrame: false,
                        triggerIntervalSeconds: 0.26,
                        maxCountPerTarget: -1,
                        targetTriggerIntervalSeconds: -1,
                      },
                    },
                    body: { $sequence: 'ifElse_12' },
                  },
                  next: null,
                },
                once_14: {
                  action: { kind: 'once', parameters: {}, body: { $sequence: null } },
                  next: 'repeatEachTick_13',
                },
                finishOwner_15: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                },
                data_5: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_4' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_6: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'inputTarget' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_6' },
                    buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                    sameSourceSkillCast: true,
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                },
                data_9: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'inputTarget' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_8' },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                    sameSourceSkillCast: true,
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 95,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            dmg_up_water_ult: 0.3,
            duration_spellvulnerable: 10,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            rate_spellvulnerable_02: 0.1,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'mergeContextTargets_1' } },
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'once_14' } },
            { startFrame: 90, endFrame: 90, sequence: { $sequence: 'finishOwner_15' } },
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'context', key: 'tar' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'finishBuffsById_1',
                },
                checkCondition_3: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                  },
                  next: 'applyElementalInfliction_2',
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
                      targets: { kind: 'source' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'checkCondition_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      attacker: 'actionSource',
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03_02:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'applyBuff_4',
                },
                mergeContextTargets_6: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: {
                      saveToContextKey: 'tar',
                      sources: [{ kind: 'fixed', target: 'enemy' }],
                    },
                  },
                  next: 'dealDamage_5',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'context', key: 'tar' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                  },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, poise: 5 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'mergeContextTargets_6' } },
          ],
        },
      },
      presentation: {
        icon: 'endaxis:operators/tangtang/talent_2',
        nameKey: 'effects.name.waterspouts',
        placement: 'enemy',
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_03: {
      faction: 'good',
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0027_tangtang/NormalSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_water_projhit_2: {
          actionGraph: {
            main: {
              nodes: {
                mergeContextTargets_1: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: {
                      saveToContextKey: 'tar',
                      sources: [{ kind: 'fixed', target: 'enemy' }],
                    },
                  },
                  next: null,
                },
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction' }],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_4: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'applyBuff_3',
                },
                applyBuff_6: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                          copiedBlackboardAssignments: {
                            duration_spellvulnerable: 'duration_spellvulnerable',
                            rate_spellvulnerable: 'rate_spellvulnerable_02',
                          },
                        },
                      ],
                      targets: { kind: 'context', key: 'tar' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                dealDamage_8: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      alwaysNext: false,
                      attacker: 'actionSource',
                      target: { kind: 'inputTarget' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      instantDamageScaleModifiers: [
                        {
                          side: 'attacker',
                          zone: 'normal',
                          addition: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      ],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/actionGraph/main/nodes/dealDamage_8/action',
                  },
                  next: null,
                },
                dealDamage_9: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      alwaysNext: false,
                      attacker: 'actionSource',
                      target: { kind: 'inputTarget' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/actionGraph/main/nodes/dealDamage_9/action',
                  },
                  next: null,
                },
                ifElse_10: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_5' },
                    whenTrue: { $sequence: 'dealDamage_8' },
                    whenFalse: { $sequence: 'dealDamage_9' },
                  },
                  next: null,
                },
                ifElse_11: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_7' },
                    whenTrue: { $sequence: 'applyBuff_6' },
                    whenFalse: { $sequence: null },
                  },
                  next: 'ifElse_10',
                },
                ifElse_12: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                    whenTrue: { $sequence: 'applyElementalInfliction_4' },
                    whenFalse: { $sequence: null },
                  },
                  next: 'ifElse_11',
                },
                repeatEachTick_13: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        catchUpMissedTicks: false,
                        target: { kind: 'fixed', target: 'enemy' },
                        executeEachFrame: false,
                        triggerIntervalSeconds: 0.26,
                        maxCountPerTarget: -1,
                        targetTriggerIntervalSeconds: -1,
                      },
                    },
                    body: { $sequence: 'ifElse_12' },
                  },
                  next: null,
                },
                once_14: {
                  action: { kind: 'once', parameters: {}, body: { $sequence: null } },
                  next: 'repeatEachTick_13',
                },
                finishOwner_15: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                },
                data_5: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_4' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_6: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'inputTarget' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_6' },
                    buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                    sameSourceSkillCast: true,
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                },
                data_9: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'inputTarget' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_8' },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                    sameSourceSkillCast: true,
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 95,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            dmg_up_water_ult: 0.3,
            duration_spellvulnerable: 10,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            rate_spellvulnerable_02: 0.1,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'mergeContextTargets_1' } },
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'once_14' } },
            { startFrame: 90, endFrame: 90, sequence: { $sequence: 'finishOwner_15' } },
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'context', key: 'tar' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'finishBuffsById_1',
                },
                checkCondition_3: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                  },
                  next: 'applyElementalInfliction_2',
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
                      targets: { kind: 'source' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'checkCondition_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      attacker: 'actionSource',
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'applyBuff_4',
                },
                mergeContextTargets_6: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: {
                      saveToContextKey: 'tar',
                      sources: [{ kind: 'fixed', target: 'enemy' }],
                    },
                  },
                  next: 'dealDamage_5',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'context', key: 'tar' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                  },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, poise: 5 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'mergeContextTargets_6' } },
          ],
        },
      },
      presentation: {
        icon: 'endaxis:operators/tangtang/talent_2',
        nameKey: 'effects.name.waterspouts',
        placement: 'enemy',
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_02_02: {
      faction: 'good',
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0011_seraph/UltimateAbilityEntity',
        'Skill/Character/chr_0027_tangtang/NormalSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_water_projhit_1: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction' }],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_4: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'applyBuff_3',
                },
                applyBuff_6: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                          copiedBlackboardAssignments: {
                            duration_spellvulnerable: 'duration_spellvulnerable',
                            rate_spellvulnerable: 'rate_spellvulnerable',
                          },
                        },
                      ],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                dealDamage_8: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      alwaysNext: false,
                      attacker: 'actionSource',
                      target: { kind: 'inputTarget' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      instantDamageScaleModifiers: [
                        {
                          side: 'attacker',
                          zone: 'normal',
                          addition: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      ],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_02_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_1/actionGraph/main/nodes/dealDamage_8/action',
                  },
                  next: null,
                },
                dealDamage_9: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      alwaysNext: false,
                      attacker: 'actionSource',
                      target: { kind: 'inputTarget' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_02_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_1/actionGraph/main/nodes/dealDamage_9/action',
                  },
                  next: null,
                },
                ifElse_10: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_5' },
                    whenTrue: { $sequence: 'dealDamage_8' },
                    whenFalse: { $sequence: 'dealDamage_9' },
                  },
                  next: null,
                },
                ifElse_11: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_7' },
                    whenTrue: { $sequence: 'applyBuff_6' },
                    whenFalse: { $sequence: null },
                  },
                  next: 'ifElse_10',
                },
                ifElse_12: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                    whenTrue: { $sequence: 'applyElementalInfliction_4' },
                    whenFalse: { $sequence: null },
                  },
                  next: 'ifElse_11',
                },
                repeatEachTick_13: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        catchUpMissedTicks: false,
                        target: { kind: 'fixed', target: 'enemy' },
                        executeEachFrame: false,
                        triggerIntervalSeconds: 0.26,
                        maxCountPerTarget: -1,
                        targetTriggerIntervalSeconds: -1,
                      },
                    },
                    body: { $sequence: 'ifElse_12' },
                  },
                  next: null,
                },
                once_14: {
                  action: { kind: 'once', parameters: {}, body: { $sequence: null } },
                  next: 'repeatEachTick_13',
                },
                finishOwner_15: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                },
                data_5: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_4' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_6: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'inputTarget' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_6' },
                    buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                    sameSourceSkillCast: true,
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                },
                data_9: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'inputTarget' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_8' },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                    sameSourceSkillCast: true,
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 95,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            dmg_up_water_ult: 0,
            duration_spellvulnerable: 10,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            rate_spellvulnerable: 0.05,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'once_14' } },
            { startFrame: 90, endFrame: 90, sequence: { $sequence: 'finishOwner_15' } },
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'context', key: 'tar' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'finishBuffsById_1',
                },
                checkCondition_3: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                  },
                  next: 'applyElementalInfliction_2',
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
                      targets: { kind: 'source' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'checkCondition_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      attacker: 'actionSource',
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_02_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'applyBuff_4',
                },
                mergeContextTargets_6: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: {
                      saveToContextKey: 'tar',
                      sources: [{ kind: 'fixed', target: 'enemy' }],
                    },
                  },
                  next: 'dealDamage_5',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'context', key: 'tar' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                  },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, poise: 5 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'mergeContextTargets_6' } },
          ],
        },
      },
      presentation: {
        icon: 'endaxis:operators/tangtang/talent_2',
        nameKey: 'effects.name.waterspouts',
        placement: 'enemy',
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_02: {
      faction: 'good',
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0027_tangtang/NormalSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_water_projhit_1: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction' }],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_4: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'applyBuff_3',
                },
                applyBuff_6: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [
                        {
                          buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                          copiedBlackboardAssignments: {
                            duration_spellvulnerable: 'duration_spellvulnerable',
                            rate_spellvulnerable: 'rate_spellvulnerable',
                          },
                        },
                      ],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                dealDamage_8: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      alwaysNext: false,
                      attacker: 'actionSource',
                      target: { kind: 'inputTarget' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      instantDamageScaleModifiers: [
                        {
                          side: 'attacker',
                          zone: 'normal',
                          addition: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      ],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_1/actionGraph/main/nodes/dealDamage_8/action',
                  },
                  next: null,
                },
                dealDamage_9: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      alwaysNext: false,
                      attacker: 'actionSource',
                      target: { kind: 'inputTarget' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_1/actionGraph/main/nodes/dealDamage_9/action',
                  },
                  next: null,
                },
                ifElse_10: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_5' },
                    whenTrue: { $sequence: 'dealDamage_8' },
                    whenFalse: { $sequence: 'dealDamage_9' },
                  },
                  next: null,
                },
                ifElse_11: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_7' },
                    whenTrue: { $sequence: 'applyBuff_6' },
                    whenFalse: { $sequence: null },
                  },
                  next: 'ifElse_10',
                },
                ifElse_12: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_9' },
                    whenTrue: { $sequence: 'applyElementalInfliction_4' },
                    whenFalse: { $sequence: null },
                  },
                  next: 'ifElse_11',
                },
                repeatEachTick_13: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        catchUpMissedTicks: false,
                        target: { kind: 'fixed', target: 'enemy' },
                        executeEachFrame: false,
                        triggerIntervalSeconds: 0.26,
                        maxCountPerTarget: -1,
                        targetTriggerIntervalSeconds: -1,
                      },
                    },
                    body: { $sequence: 'ifElse_12' },
                  },
                  next: null,
                },
                once_14: {
                  action: { kind: 'once', parameters: {}, body: { $sequence: null } },
                  next: 'repeatEachTick_13',
                },
                finishOwner_15: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                },
                data_5: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_4' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_6: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'inputTarget' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_6' },
                    buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                    sameSourceSkillCast: true,
                  },
                },
                data_8: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                },
                data_9: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'inputTarget' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_8' },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                    sameSourceSkillCast: true,
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 95,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            dmg_up_water_ult: 0,
            duration_spellvulnerable: 10,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            rate_spellvulnerable: 0.05,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'once_14' } },
            { startFrame: 90, endFrame: 90, sequence: { $sequence: 'finishOwner_15' } },
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'context', key: 'tar' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'finishBuffsById_1',
                },
                checkCondition_3: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                  },
                  next: 'applyElementalInfliction_2',
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
                      targets: { kind: 'source' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'checkCondition_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      attacker: 'actionSource',
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'applyBuff_4',
                },
                mergeContextTargets_6: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: {
                      saveToContextKey: 'tar',
                      sources: [{ kind: 'fixed', target: 'enemy' }],
                    },
                  },
                  next: 'dealDamage_5',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'context', key: 'tar' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                  },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, poise: 5 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'mergeContextTargets_6' } },
          ],
        },
      },
      presentation: {
        icon: 'endaxis:operators/tangtang/talent_2',
        nameKey: 'effects.name.waterspouts',
        placement: 'enemy',
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill: {
      faction: 'good',
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0027_tangtang/NormalSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkills: {
        chr_0027_tangtang_normal_skill_water_projhit: {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_3: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction' }],
                      targets: { kind: 'inputTarget' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_4: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'applyBuff_3',
                },
                dealDamage_6: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      alwaysNext: false,
                      attacker: 'actionSource',
                      target: { kind: 'inputTarget' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      instantDamageScaleModifiers: [
                        {
                          side: 'attacker',
                          zone: 'normal',
                          addition: { kind: 'valueNode', nodeId: 'data_2' },
                        },
                      ],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill:chr_0027_tangtang_normal_skill_water_projhit|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit/actionGraph/main/nodes/dealDamage_6/action',
                  },
                  next: null,
                },
                dealDamage_7: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      alwaysNext: false,
                      attacker: 'actionSource',
                      target: { kind: 'inputTarget' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                      takeAttackSnapshot: true,
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill:chr_0027_tangtang_normal_skill_water_projhit|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit/actionGraph/main/nodes/dealDamage_7/action',
                  },
                  next: null,
                },
                ifElse_8: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_5' },
                    whenTrue: { $sequence: 'dealDamage_6' },
                    whenFalse: { $sequence: 'dealDamage_7' },
                  },
                  next: null,
                },
                ifElse_9: {
                  action: {
                    kind: 'ifElse',
                    parameters: { alwaysNext: true },
                    condition: { kind: 'conditionNode', nodeId: 'data_7' },
                    whenTrue: { $sequence: 'applyElementalInfliction_4' },
                    whenFalse: { $sequence: null },
                  },
                  next: 'ifElse_8',
                },
                repeatEachTick_10: {
                  action: {
                    kind: 'repeatEachTick',
                    parameters: {
                      nativeChanneling: {
                        catchUpMissedTicks: false,
                        target: { kind: 'fixed', target: 'enemy' },
                        executeEachFrame: false,
                        triggerIntervalSeconds: 0.26,
                        maxCountPerTarget: -1,
                        targetTriggerIntervalSeconds: -1,
                      },
                    },
                    body: { $sequence: 'ifElse_9' },
                  },
                  next: null,
                },
                once_11: {
                  action: { kind: 'once', parameters: {}, body: { $sequence: null } },
                  next: 'repeatEachTick_10',
                },
                finishOwner_12: {
                  action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                  next: null,
                },
              },
              dataNodes: {
                data_1: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                },
                data_2: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                },
                data_3: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'poise_tornado' },
                },
                data_4: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                },
                data_5: {
                  type: 'boolean',
                  expression: {
                    kind: 'actionValueCompare',
                    left: { kind: 'valueNode', nodeId: 'data_4' },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                },
                data_6: {
                  type: 'number',
                  expression: { kind: 'blackboard', key: 'hit_spelllnflictionmax_01' },
                },
                data_7: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'inputTarget' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'less',
                    value: { kind: 'valueNode', nodeId: 'data_6' },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                    sameSourceSkillCast: true,
                  },
                },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_water_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 95,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            dmg_up_water_ult: 0.3,
            hit_spelllnflictionmax_01: 1,
            poise_tornado: 0,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
          },
          scheduledSequences: [
            { startFrame: 0, endFrame: 90, sequence: { $sequence: 'once_11' } },
            { startFrame: 90, endFrame: 90, sequence: { $sequence: 'finishOwner_12' } },
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
          actionGraph: {
            main: {
              nodes: {
                finishBuffsById_1: {
                  action: {
                    kind: 'finishBuffsById',
                    parameters: {
                      targets: { kind: 'context', key: 'tar' },
                      finishSource: { kind: 'source' },
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    },
                  },
                  next: null,
                },
                applyElementalInfliction_2: {
                  action: {
                    kind: 'applyElementalInfliction',
                    parameters: { element: 'cryo', isExtra: false },
                  },
                  next: 'finishBuffsById_1',
                },
                checkCondition_3: {
                  action: {
                    kind: 'checkCondition',
                    parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
                  },
                  next: 'applyElementalInfliction_2',
                },
                applyBuff_4: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
                      targets: { kind: 'source' },
                      source: { kind: 'source' },
                      inheritSourceSkillCastInfo: true,
                    },
                  },
                  next: 'checkCondition_3',
                },
                dealDamage_5: {
                  action: {
                    kind: 'dealDamage',
                    parameters: {
                      attacker: 'actionSource',
                      target: { kind: 'context', key: 'tar' },
                      damageType: 'cryo',
                      attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'valueNode', nodeId: 'data_3' },
                    },
                    key: 'abilityentity_chr_0027_tangtang_normal_skill:chr_0027_tangtang_normal_skill_water_projhit|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/actionGraph/main/nodes/dealDamage_5/action',
                  },
                  next: 'applyBuff_4',
                },
                mergeContextTargets_6: {
                  action: {
                    kind: 'mergeContextTargets',
                    parameters: {
                      saveToContextKey: 'tar',
                      sources: [{ kind: 'fixed', target: 'enemy' }],
                    },
                  },
                  next: 'dealDamage_5',
                },
              },
              dataNodes: {
                data_1: {
                  type: 'boolean',
                  expression: {
                    kind: 'buffIdStackCompare',
                    target: { kind: 'context', key: 'tar' },
                    compareZeroWhenTargetMissing: true,
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                  },
                },
                data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
                data_3: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
              },
            },
            macros: {},
          },
          skillId: 'chr_0027_tangtang_normal_skill_projhit',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.1, poise: 5 },
          scheduledSequences: [
            { startFrame: 0, endFrame: 0, sequence: { $sequence: 'mergeContextTargets_6' } },
          ],
        },
      },
      presentation: {
        icon: 'endaxis:operators/tangtang/talent_2',
        nameKey: 'effects.name.waterspouts',
        placement: 'enemy',
      },
    },
  },
  projectileDefinitions: {
    projectile_chr_0027_tangtang_attack1: {
      flight: {
        hitBeforeReach: true,
        segments: [
          {
            targetKey: null,
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: -1 } },
              speed: { kind: 'constant', value: 55 },
              speedCurve: [
                {
                  time: 0,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
              path: { kind: 'straight' },
            },
            skipCollision: false,
          },
        ],
        collision: {
          kind: 'sphere',
          target: { side: 'enemy' },
          radiusMeters: { kind: 'constant', value: 0.2 },
        },
        finishDurationSeconds: { kind: 'constant', value: 5 },
        finishDistanceMeters: { kind: 'constant', value: 10 },
        finishOnReach: true,
        keepMovingOnReach: false,
        reachRadiusMeters: { kind: 'constant', value: 0.2 },
      },
      blackboard: {},
      hit: { finishOnHit: true, maxHitCount: 1 },
    },
    projectile_chr_0027_tangtang_attack2: {
      flight: {
        hitBeforeReach: true,
        segments: [
          {
            targetKey: null,
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: -1 } },
              speed: { kind: 'constant', value: 70 },
              speedCurve: [
                {
                  time: 0,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
              path: { kind: 'straight' },
            },
            skipCollision: false,
          },
        ],
        collision: {
          kind: 'sphere',
          target: { side: 'enemy' },
          radiusMeters: { kind: 'constant', value: 0.2 },
        },
        finishDurationSeconds: { kind: 'constant', value: 5 },
        finishDistanceMeters: { kind: 'constant', value: 10 },
        finishOnReach: true,
        keepMovingOnReach: false,
        reachRadiusMeters: { kind: 'constant', value: 0.2 },
      },
      blackboard: {},
      hit: { finishOnHit: true, maxHitCount: 1 },
    },
    projectile_chr_0027_tangtang_attack2_2: {
      flight: {
        hitBeforeReach: true,
        segments: [
          {
            targetKey: null,
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: -1 } },
              speed: { kind: 'constant', value: 70 },
              speedCurve: [
                {
                  time: 0,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
              path: { kind: 'straight' },
            },
            skipCollision: false,
          },
        ],
        collision: {
          kind: 'sphere',
          target: { side: 'enemy' },
          radiusMeters: { kind: 'constant', value: 0.2 },
        },
        finishDurationSeconds: { kind: 'constant', value: 5 },
        finishDistanceMeters: { kind: 'constant', value: 10 },
        finishOnReach: true,
        keepMovingOnReach: false,
        reachRadiusMeters: { kind: 'constant', value: 0.2 },
      },
      blackboard: {},
      hit: { finishOnHit: true, maxHitCount: 1 },
    },
    projectile_chr_0027_tangtang_attack3: {
      flight: {
        hitBeforeReach: true,
        segments: [
          {
            targetKey: null,
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: 0 } },
              speed: { kind: 'constant', value: 40 },
              speedCurve: [
                {
                  time: 0,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
              path: { kind: 'straight' },
            },
            skipCollision: false,
          },
        ],
        collision: {
          kind: 'sphere',
          target: { side: 'enemy' },
          radiusMeters: { kind: 'constant', value: 0.45 },
        },
        finishDurationSeconds: { kind: 'constant', value: 2 },
        finishDistanceMeters: { kind: 'constant', value: 10 },
        finishOnReach: true,
        keepMovingOnReach: false,
        reachRadiusMeters: { kind: 'constant', value: 0.45 },
      },
      blackboard: {},
      hit: { finishOnHit: false, maxHitCount: -1 },
    },
    projectile_chr_0027_tangtang_attack5: {
      flight: {
        hitBeforeReach: true,
        segments: [
          {
            targetKey: null,
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: 0 } },
              speed: { kind: 'constant', value: 50 },
              speedCurve: [
                {
                  time: 0,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
              path: { kind: 'straight' },
            },
            skipCollision: false,
          },
        ],
        collision: {
          kind: 'sphere',
          target: { side: 'enemy' },
          radiusMeters: { kind: 'constant', value: 1.5 },
        },
        finishDurationSeconds: { kind: 'constant', value: 5 },
        finishDistanceMeters: { kind: 'constant', value: 12 },
        finishOnReach: true,
        keepMovingOnReach: false,
        reachRadiusMeters: { kind: 'constant', value: 0.5 },
      },
      blackboard: { EntityBB_atk05_cnt: 0 },
      hit: { finishOnHit: false, maxHitCount: -1 },
    },
    projectile_chr_0027_tangtang_water: {
      flight: {
        hitBeforeReach: true,
        segments: [
          {
            targetKey: null,
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: 0 } },
              speed: { kind: 'constant', value: 10 },
              speedCurve: [
                {
                  time: 0,
                  value: 2,
                  inTangent: -3.9952576,
                  outTangent: -3.9952576,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.33333334,
                },
                {
                  time: 0.16500098,
                  value: 1.3407786,
                  inTangent: -2.0447524,
                  outTangent: -2.0447524,
                  weightedMode: 0,
                  inWeight: 0.8832316,
                  outWeight: 0.061716028,
                },
                {
                  time: 0.4896845,
                  value: 0.99144655,
                  inTangent: 0.01655952,
                  outTangent: 0.01655952,
                  weightedMode: 0,
                  inWeight: 0.44204327,
                  outWeight: 0.09206248,
                },
                {
                  time: 3,
                  value: 1,
                  inTangent: 0.003407319,
                  outTangent: 0.003407319,
                  weightedMode: 0,
                  inWeight: 0.33333334,
                  outWeight: 0,
                },
              ],
              distanceScaleCurve: [
                {
                  time: 0,
                  value: 0.8,
                  inTangent: 0.53959215,
                  outTangent: 0.53959215,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.17022358,
                },
                {
                  time: 1.1467078,
                  value: 1.2968235,
                  inTangent: 0.23721509,
                  outTangent: 0.23721509,
                  weightedMode: 0,
                  inWeight: 0.43372607,
                  outWeight: 0.33333334,
                },
                {
                  time: 10,
                  value: 2,
                  inTangent: 0.079425424,
                  outTangent: 0.079425424,
                  weightedMode: 0,
                  inWeight: 0.33333334,
                  outWeight: 0,
                },
              ],
              path: {
                kind: 'parabola',
                definition: {
                  kind: 'vertexDuration',
                  durationSeconds: { kind: 'constant', value: 1.7 },
                  vertexOffsetMeters: { kind: 'constant', value: 1.2 },
                },
              },
            },
            skipCollision: false,
          },
        ],
        finishDurationSeconds: { kind: 'constant', value: 3 },
        finishDistanceMeters: { kind: 'constant', value: 10 },
        finishOnReach: false,
        keepMovingOnReach: true,
        reachRadiusMeters: { kind: 'constant', value: 0.3 },
      },
      blackboard: {},
      hit: { finishOnHit: false, maxHitCount: 0 },
    },
    projectile_chr_0027_tangtang_waterwake01: {
      flight: {
        hitBeforeReach: true,
        segments: [
          {
            targetKey: 'TargetPoint',
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: 0 } },
              speed: { kind: 'constant', value: 0 },
              speedCurve: [
                {
                  time: 0,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
              distanceScaleCurve: [
                {
                  time: 0,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.33333334,
                },
                {
                  time: 5,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.33333334,
                  outWeight: 0,
                },
              ],
              path: { kind: 'straight' },
            },
            earlyNextAfterSeconds: { kind: 'constant', value: 0.3 },
            skipCollision: false,
          },
          {
            targetKey: 'TargetPoint',
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: -1 } },
              speed: { kind: 'constant', value: 15 },
              speedCurve: [
                {
                  time: 0,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.33333334,
                },
                {
                  time: 3,
                  value: 1,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.33333334,
                  outWeight: 0,
                },
              ],
              distanceScaleCurve: [
                {
                  time: 0,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 5,
                  value: 0.8,
                  inTangent: 0.08868233,
                  outTangent: 0.08868233,
                  weightedMode: 0,
                  inWeight: 0.40446645,
                  outWeight: 0.25231886,
                },
                {
                  time: 10,
                  value: 2,
                  inTangent: 0.045270614,
                  outTangent: 0.045270614,
                  weightedMode: 0,
                  inWeight: 0.8724321,
                  outWeight: 0.28513914,
                },
                {
                  time: 15.802985,
                  value: 4.6871285,
                  inTangent: 0.14569657,
                  outTangent: 0.14569657,
                  weightedMode: 0,
                  inWeight: 0.33333334,
                  outWeight: 0.07896385,
                },
                {
                  time: 50,
                  value: 6,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
              path: { kind: 'straight' },
            },
            skipCollision: false,
          },
        ],
        collision: {
          kind: 'box',
          target: { side: 'enemy' },
          centerMeters: [
            { kind: 'constant', value: 0 },
            { kind: 'constant', value: 1.5 },
            { kind: 'constant', value: 0 },
          ],
          halfExtentsMeters: [
            { kind: 'constant', value: 3 },
            { kind: 'constant', value: 3 },
            { kind: 'constant', value: 3 },
          ],
        },
        finishDurationSeconds: { kind: 'constant', value: 2 },
        finishDistanceMeters: { kind: 'constant', value: 50 },
        finishOnReach: true,
        keepMovingOnReach: false,
        reachRadiusMeters: { kind: 'constant', value: 0.5 },
      },
      blackboard: {},
      hit: { finishOnHit: false, maxHitCount: -1, repeatIntervalSeconds: 0.15 },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default tangtang;
