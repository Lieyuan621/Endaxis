/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const mingheChr_0037_minghe_attack1ActionGraph = {
  main: {
    nodes: {
      findTargets_1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'factionHitBox',
              factionTarget: 'anti',
              owner: { kind: 'owner' },
              checkAlive: true,
              containsUnmarkable: false,
              replacePartsWithMainBodies: false,
            },
            saveToContextKey: 'targets',
          },
        },
        next: null,
      },
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'context', key: 'targets' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.044 },
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
          },
        },
        next: null,
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_5',
      },
      startTimeDilation_8: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'context', key: 'targets' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.03 },
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
          },
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_9',
      },
      overrideBasicAttackMapping_11: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0037_minghe_attack2'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_12: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0037_minghe_attack2'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mingheChr_0037_minghe_attack1: SkillDefinition = {
  actionGraph: mingheChr_0037_minghe_attack1ActionGraph,
  key: 'chr_0037_minghe_attack1',
  element: 'physical',
  blackboard: {
    atk_scale1: [0.09, 0.1, 0.11, 0.12, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.2],
    atk_scale2: [0.13, 0.15, 0.16, 0.17, 0.19, 0.2, 0.21, 0.23, 0.24, 0.26, 0.28, 0.3],
  },
  timelineBlockFrames: 11,
  naturalDurationFrames: 270,
  exclusiveFrame: 15,
  offsetRecordFrame: 7,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 2, endFrame: 3, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 2, endFrame: 2, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'dealDamage_10' } },
    { startFrame: 0, endFrame: 38, sequence: { $sequence: 'overrideBasicAttackMapping_11' } },
    { startFrame: 11, endFrame: 37, sequence: { $sequence: 'reachSkillOperableBoundary_12' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const mingheChr_0037_minghe_attack2ActionGraph = {
  main: {
    nodes: {
      findTargets_1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'factionHitBox',
              factionTarget: 'anti',
              owner: { kind: 'owner' },
              checkAlive: true,
              containsUnmarkable: false,
              replacePartsWithMainBodies: false,
            },
            saveToContextKey: 'targets',
          },
        },
        next: null,
      },
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'context', key: 'targets' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.02 },
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
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
                  time: 1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
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
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_4',
      },
      overrideBasicAttackMapping_6: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0037_minghe_attack3'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_7: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0037_minghe_attack3'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mingheChr_0037_minghe_attack2: SkillDefinition = {
  actionGraph: mingheChr_0037_minghe_attack2ActionGraph,
  key: 'chr_0037_minghe_attack2',
  element: 'physical',
  blackboard: {
    atk_scale: [0.24, 0.27, 0.29, 0.32, 0.34, 0.37, 0.39, 0.42, 0.44, 0.47, 0.51, 0.55],
  },
  timelineBlockFrames: 11,
  naturalDurationFrames: 267,
  exclusiveFrame: 14,
  offsetRecordFrame: 5,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 5, endFrame: 5, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 5, endFrame: 5, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 0, endFrame: 67, sequence: { $sequence: 'overrideBasicAttackMapping_6' } },
    { startFrame: 11, endFrame: 58, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const mingheChr_0037_minghe_attack3ActionGraph = {
  main: {
    nodes: {
      findTargets_1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'factionHitBox',
              factionTarget: 'anti',
              owner: { kind: 'owner' },
              checkAlive: true,
              containsUnmarkable: false,
              replacePartsWithMainBodies: false,
            },
            saveToContextKey: 'targets',
          },
        },
        next: null,
      },
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'context', key: 'targets' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.044 },
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
          },
        },
        next: null,
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_6: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_5',
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: null,
      },
      overrideBasicAttackMapping_8: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0037_minghe_attack4'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_9: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0037_minghe_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mingheChr_0037_minghe_attack3: SkillDefinition = {
  actionGraph: mingheChr_0037_minghe_attack3ActionGraph,
  key: 'chr_0037_minghe_attack3',
  element: 'physical',
  blackboard: {
    atk_scale1: [0.18, 0.2, 0.21, 0.23, 0.25, 0.27, 0.28, 0.3, 0.32, 0.34, 0.37, 0.4],
    atk_scale2: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
  },
  timelineBlockFrames: 24,
  naturalDurationFrames: 206,
  exclusiveFrame: 54,
  offsetRecordFrame: 16,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 4, endFrame: 5, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 4, endFrame: 5, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 0, endFrame: 110, sequence: { $sequence: 'overrideBasicAttackMapping_8' } },
    { startFrame: 24, endFrame: 90, sequence: { $sequence: 'reachSkillOperableBoundary_9' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const mingheChr_0037_minghe_attack4ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'inputTarget' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack'],
          },
        },
        next: null,
      },
      launchProjectile_4: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: { endFrame: 0, callbacks: [] },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0037_minghe_attack04_back_2',
            syncTimeScale: true,
            recycleDelaySeconds: 0,
            entityInitialValues: {},
          },
          callbacks: [],
        },
        next: null,
      },
      launchProjectile_7: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: { endFrame: 0, callbacks: [] },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0037_minghe_attack04_back',
            recycleDelaySeconds: 0,
            entityInitialValues: {},
          },
          callbacks: [],
        },
        next: null,
      },
      launchProjectile_9: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: { endFrame: 0, callbacks: [{ event: 'launch', triggerFrames: [0] }] },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0037_minghe_attack04_back',
            syncTimeScale: true,
            recycleDelaySeconds: 2,
            entityInitialValues: {},
          },
          callbacks: [
            {
              event: 'launch',
              skill: {
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            bornAt: { kind: 'owner' },
                            abilityEntityId: 'abilityentity_chr_0037_minghe_attack04_flysword',
                            childSkillId: 'chr_0037_minghe_attack4_flysword_weapon',
                            source: { kind: 'source' },
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: true,
                            dieWhenTargetDies: true,
                            finishByAction: true,
                            target: { kind: 'owner' },
                            overrideDurationSeconds: { kind: 'constant', value: 5 },
                          },
                        },
                        next: null,
                      },
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0037_minghe_attack4_flysword',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 60,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {},
                scheduledSequences: [
                  { startFrame: 0, endFrame: 60, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                ],
              },
            },
          ],
        },
        next: null,
      },
      finishOwner_12: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'context', key: 'ab' } } },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_13: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: { saveToContextKey: 'ab', tagFilters: [], owner: { kind: 'owner' } },
        },
        next: 'finishOwner_12',
      },
      launchProjectile_14: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: { endFrame: 0, callbacks: [] },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0037_minghe_attack04_1',
            syncTimeScale: true,
            recycleDelaySeconds: 0,
            entityInitialValues: {},
          },
          callbacks: [],
        },
        next: null,
      },
      launchProjectile_17: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: {
              endFrame: 0,
              callbacks: [
                { event: 'block', triggerFrames: [0] },
                { event: 'hit', triggerFrames: [0], hitKind: 'collision' },
              ],
            },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0037_minghe_attack04_end',
            syncTimeScale: true,
            recycleDelaySeconds: 3,
            entityInitialValues: {},
            hit: {},
          },
          callbacks: [
            {
              event: 'block',
              skill: {
                actionGraph: {
                  main: {
                    nodes: {
                      spawnAbilityEntity_1: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            bornAt: { kind: 'owner' },
                            abilityEntityId:
                              'abilityentity_chr_0037_minghe_attack04_groundsword_weapon',
                            source: { kind: 'source' },
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: true,
                            overrideDurationSeconds: { kind: 'constant', value: 2.5 },
                          },
                        },
                        next: null,
                      },
                      spawnAbilityEntity_2: {
                        action: {
                          kind: 'spawnAbilityEntity',
                          parameters: {
                            bornAt: { kind: 'owner' },
                            abilityEntityId: 'abilityentity_chr_0037_minghe_attack04_groundsword',
                            childSkillId:
                              'chr_0037_minghe_attack4_hitground_abilityentity_groundeffect',
                            source: { kind: 'source' },
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: true,
                            overrideDurationSeconds: { kind: 'constant', value: 5 },
                          },
                        },
                        next: null,
                      },
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0037_minghe_attack4_hitground',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 90,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {},
                scheduledSequences: [
                  { startFrame: 0, endFrame: 75, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                  { startFrame: 0, endFrame: 90, sequence: { $sequence: 'spawnAbilityEntity_2' } },
                ],
              },
            },
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
                            damageType: 'physical',
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
                skillId: 'chr_0037_minghe_attack4_endprojectilehit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 60,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0.58 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'dealDamage_1' } },
                ],
              },
            },
          ],
        },
        next: null,
      },
      startTimeDilation_18: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'source' },
            affectType: 'OnlyAttacker',
            durationSeconds: { kind: 'constant', value: 0.1 },
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1,
                  inTangent: -2.952784,
                  outTangent: -2.952784,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.05625126,
                  value: 0,
                  inTangent: -1.83731,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7089229,
                  value: 0,
                  inTangent: -0.01251826,
                  outTangent: 1.303163,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 13.16226,
                  outTangent: -1,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
          },
        },
        next: 'launchProjectile_17',
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0037_minghe_attack04_finishprojectile' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      overrideBasicAttackMapping_20: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0037_minghe_attack5'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_21: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0037_minghe_attack5'] },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mingheChr_0037_minghe_attack4: SkillDefinition = {
  actionGraph: mingheChr_0037_minghe_attack4ActionGraph,
  key: 'chr_0037_minghe_attack4',
  element: 'physical',
  blackboard: {
    atk_scale: [
      0.1556, 0.1711, 0.1867, 0.2022, 0.2178, 0.2333, 0.2489, 0.2644, 0.28, 0.2994, 0.3228, 0.35,
    ],
  },
  timelineBlockFrames: 34,
  naturalDurationFrames: 220,
  exclusiveFrame: 54,
  offsetRecordFrame: 18,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 20, endFrame: 21, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'launchProjectile_4' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'launchProjectile_7' } },
    { startFrame: 16, endFrame: 17, sequence: { $sequence: 'launchProjectile_7' } },
    { startFrame: 21, endFrame: 22, sequence: { $sequence: 'launchProjectile_9' } },
    {
      startFrame: 98,
      endFrame: 100,
      sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_13' },
    },
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'launchProjectile_14' } },
    { startFrame: 13, endFrame: 14, sequence: { $sequence: 'launchProjectile_14' } },
    { startFrame: 18, endFrame: 19, sequence: { $sequence: 'launchProjectile_14' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'startTimeDilation_18' } },
    { startFrame: 0, endFrame: 75, sequence: { $sequence: 'applyBuff_19' } },
    { startFrame: 0, endFrame: 75, sequence: { $sequence: 'overrideBasicAttackMapping_20' } },
    { startFrame: 34, endFrame: 75, sequence: { $sequence: 'reachSkillOperableBoundary_21' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const mingheChr_0037_minghe_attack5ActionGraph = {
  main: {
    nodes: {
      findTargets_1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'factionHitBox',
              factionTarget: 'anti',
              owner: { kind: 'owner' },
              checkAlive: true,
              containsUnmarkable: false,
              replacePartsWithMainBodies: false,
            },
            saveToContextKey: 'targets',
          },
        },
        next: null,
      },
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
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
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
        expression: { kind: 'checkMainCharacter', target: { kind: 'source' } },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mingheChr_0037_minghe_attack5: SkillDefinition = {
  actionGraph: mingheChr_0037_minghe_attack5ActionGraph,
  key: 'chr_0037_minghe_attack5',
  element: 'physical',
  blackboard: {
    atb: 25,
    atk_scale: [0.6, 0.66, 0.72, 0.78, 0.84, 0.9, 0.96, 1.02, 1.08, 1.16, 1.25, 1.35],
    poise: 23,
  },
  timelineBlockFrames: 45,
  naturalDurationFrames: 187,
  exclusiveFrame: 44,
  offsetRecordFrame: 21,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 21, endFrame: 21, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 21, endFrame: 21, sequence: { $sequence: 'dealDamage_5' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const mingheChr_0037_minghe_powerattackActionGraph = {
  main: {
    nodes: {
      findTargets_1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'intersection',
              targets: {
                kind: 'factionHitBox',
                factionTarget: 'anti',
                owner: { kind: 'owner' },
                checkAlive: true,
                containsUnmarkable: false,
                replacePartsWithMainBodies: false,
              },
              parentTargets: { kind: 'inputTarget' },
            },
            saveToContextKey: 'targets',
          },
        },
        next: null,
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.2,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      dealDamage_8: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      startTimeDilation_9: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'context', key: 'targets' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.06 },
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
          },
        },
        next: null,
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.2,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'startTimeDilation_9',
      },
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'dealDamage_10',
      },
      startTimeDilation_12: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'context', key: 'targets' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.06 },
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
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
                  time: 1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
          },
        },
        next: null,
      },
      checkCondition_13: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'startTimeDilation_12',
      },
      dealDamage_15: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.5,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      gainFinisherSp_16: {
        action: {
          kind: 'gainFinisherSp',
          parameters: {
            source: { kind: 'source' },
            target: { kind: 'inputTarget' },
            factor: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      ifElse_17: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'dealDamage_15' },
          whenFalse: { $sequence: null },
        },
        next: 'gainFinisherSp_16',
      },
      startTimeDilation_18: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 100,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: true,
            targets: [{ kind: 'inputTarget' }],
          },
        },
        next: null,
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_damage_immune_medium' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      applyBuff_20: {
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
      reachSkillOperableBoundary_21: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: {
            skillIds: [
              'chr_0037_minghe_combo_skill',
              'chr_0037_minghe_normalskill_1',
              'chr_0037_minghe_normalskill_2',
            ],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'targets' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'targets' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'targetContains',
          parent: { kind: 'context', key: 'targets' },
          child: { kind: 'inputTarget' },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mingheChr_0037_minghe_powerattack: SkillDefinition = {
  actionGraph: mingheChr_0037_minghe_powerattackActionGraph,
  key: 'chr_0037_minghe_powerattack',
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 52,
  naturalDurationFrames: 226,
  exclusiveFrame: 51,
  offsetRecordFrame: 26,
  dontInterruptCombo: true,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 33, endFrame: 34, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 40, endFrame: 41, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 41, endFrame: 42, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 6, endFrame: 7, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 15, endFrame: 16, sequence: { $sequence: 'dealDamage_8' } },
    { startFrame: 33, endFrame: 33, sequence: { $sequence: 'checkCondition_11' } },
    { startFrame: 40, endFrame: 40, sequence: { $sequence: 'checkCondition_13' } },
    { startFrame: 41, endFrame: 41, sequence: { $sequence: 'ifElse_17' } },
    { startFrame: 34, endFrame: 40, sequence: { $sequence: 'startTimeDilation_18' } },
    { startFrame: 0, endFrame: 41, sequence: { $sequence: 'applyBuff_19' } },
    { startFrame: 0, endFrame: 41, sequence: { $sequence: 'applyBuff_20' } },
    { startFrame: 48, endFrame: 67, sequence: { $sequence: 'reachSkillOperableBoundary_21' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const mingheChr_0037_minghe_plunging_attack_endActionGraph = {
  main: {
    nodes: {
      findTargets_1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'factionHitBox',
              factionTarget: 'anti',
              owner: { kind: 'owner' },
              checkAlive: true,
              containsUnmarkable: false,
              replacePartsWithMainBodies: false,
            },
            saveToContextKey: 'tar',
          },
        },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            damageType: 'physical',
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

export const mingheChr_0037_minghe_plunging_attack_end: SkillDefinition = {
  actionGraph: mingheChr_0037_minghe_plunging_attack_endActionGraph,
  key: 'chr_0037_minghe_plunging_attack_end',
  element: 'physical',
  blackboard: { atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
  timelineBlockFrames: 13,
  naturalDurationFrames: 260,
  exclusiveFrame: 12,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 2, endFrame: 6, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 2, endFrame: 7, sequence: { $sequence: 'dealDamage_2' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const mingheChr_0037_minghe_normalskill_1ActionGraph = {
  main: {
    nodes: {
      findTargets_1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'factionHitBox',
              factionTarget: 'anti',
              owner: { kind: 'owner' },
              checkAlive: true,
              containsUnmarkable: false,
              replacePartsWithMainBodies: false,
            },
            saveToContextKey: 'targets',
          },
        },
        next: null,
      },
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'inputTarget' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      startTimeDilation_6: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'inputTarget' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.04 },
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
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
                  time: 0.3,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0.5111275,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.9988403,
                  value: 1,
                  inTangent: 4.45622,
                  outTangent: 0.9,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
          },
        },
        next: 'dealDamage_5',
      },
      repeatEachTick_7: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: true,
              target: { kind: 'context', key: 'targets' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'startTimeDilation_6' },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'applyBuff_9' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalSkill'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'ifElse_10',
      },
      applyPhysicalInfliction_12: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            source: { kind: 'owner' },
            target: { kind: 'context', key: 'targets' },
            isExtra: false,
            duration: { kind: 'constant', value: 2 },
            height: { kind: 'constant', value: 3 },
            speedFactorMultiplier: 3,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          },
        },
        next: 'dealDamage_11',
      },
      startTimeDilation_13: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'inputTarget' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.06 },
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
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
                  time: 0.3,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0.5111275,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.9988403,
                  value: 1,
                  inTangent: 4.45622,
                  outTangent: 0.9,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
          },
        },
        next: 'applyPhysicalInfliction_12',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'boolean', expression: { kind: 'skillHasHit' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mingheChr_0037_minghe_normalskill_1: SkillDefinition = {
  actionGraph: mingheChr_0037_minghe_normalskill_1ActionGraph,
  key: 'chr_0037_minghe_normalskill_1',
  element: 'physical',
  blackboard: {
    atk_scale: [0.44, 0.49, 0.53, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.92, 1],
    atk_scale2: [1.11, 1.22, 1.33, 1.44, 1.56, 1.67, 1.78, 1.89, 2, 2.14, 2.31, 2.5],
    poise2: 10,
  },
  timelineBlockFrames: 41,
  naturalDurationFrames: 379,
  exclusiveFrame: 40,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 11, endFrame: 12, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 20, endFrame: 20, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 10, endFrame: 13, sequence: { $sequence: 'repeatEachTick_7' } },
    { startFrame: 20, endFrame: 22, sequence: { $sequence: 'startTimeDilation_13' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
};

export const mingheChr_0037_minghe_normalskill_2ActionGraph = {
  main: {
    nodes: {
      spawnAbilityEntity_1: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0037_minghe_camera_anchor_normalskill2',
            source: { kind: 'source' },
            inheritActionBlackboard: false,
            dieWhenSourceDies: true,
            finishByAction: true,
            saveToContextKey: 'pos',
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
            buffIds: ['buff_chr_0037_minghe_power_storymode'],
            reason: 'other',
          },
        },
        next: null,
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0037_minghe_power'],
            reason: 'other',
          },
        },
        next: 'finishBuffsById_2',
      },
      findTargets_4: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'factionHitBox',
              factionTarget: 'anti',
              owner: { kind: 'owner' },
              checkAlive: true,
              containsUnmarkable: false,
              replacePartsWithMainBodies: false,
            },
            saveToContextKey: 'targets',
          },
        },
        next: null,
      },
      applyBuff_17: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0037_minghe_potential_3',
                copiedBlackboardAssignments: {
                  adddamage: 'potential_adddamage',
                  duration: 'potential_duration',
                  maxstack: 'potential_maxstack',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            count: { kind: 'valueNode', nodeId: 'data_1' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_15: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: null,
      },
      checkCondition_16: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_15',
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_physical_no_guard' }],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      finishBuffsByTag_20: {
        action: {
          kind: 'finishBuffsByTag',
          parameters: {
            targets: { kind: 'inputTarget' },
            finishSource: { kind: 'owner' },
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            reason: 'early',
            count: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'applyBuff_19',
      },
      modifyActionValue_22: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'specialcount',
            operation: 'assign',
            value: { kind: 'constant', value: 4 },
          },
        },
        next: null,
      },
      applyBuff_23: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_pulse_pulse_conduct_triggered',
                copiedBlackboardAssignments: { count: 'specialcount' },
              },
            ],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_24: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'modifyActionValue_22' },
          whenFalse: { $sequence: null },
        },
        next: 'applyBuff_23',
      },
      modifyActionValue_25: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'specialcount',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'ifElse_24',
      },
      ifElse_26: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'finishBuffsByTag_20' },
          whenFalse: { $sequence: null },
        },
        next: 'modifyActionValue_25',
      },
      ifElse_27: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'applyBuff_17' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_26',
      },
      readBuffStackCount_28: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: { kind: 'inputTarget' },
            outputKey: 'specialcount',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            },
          },
        },
        next: 'ifElse_27',
      },
      dealDamage_29: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_9' },
            tags: ['normalSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      forEachContextTarget_30: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'targets' } },
          body: { $sequence: 'readBuffStackCount_28' },
        },
        next: 'dealDamage_29',
      },
      applyBuff_32: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      ifElse_33: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
          whenTrue: { $sequence: 'applyBuff_32' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_34: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'context', key: 'targets' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.1 },
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
          },
        },
        next: 'ifElse_33',
      },
      dealDamage_35: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_11' },
            tags: ['normalSkill'],
            stagger: { kind: 'valueNode', nodeId: 'data_12' },
          },
        },
        next: 'startTimeDilation_34',
      },
      startTimeDilation_38: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'owner' },
            targets: { kind: 'context', key: 'targets' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.15 },
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
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
                  time: 0.6,
                  value: 0,
                  inTangent: 0,
                  outTangent: 1.457883,
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
            },
          },
        },
        next: null,
      },
      startTimeDilation_37: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'owner' },
            targets: { kind: 'context', key: 'targets' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.25 },
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
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
                  time: 0.6,
                  value: 0,
                  inTangent: 0,
                  outTangent: 1.457883,
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
            },
          },
        },
        next: null,
      },
      ifElse_39: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_13' },
          whenTrue: { $sequence: 'startTimeDilation_37' },
          whenFalse: { $sequence: 'startTimeDilation_38' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'specialcount' } },
      data_2: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_has', fallback: 0 },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_2' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'specialcount', fallback: 0 },
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
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'greater',
          right: { kind: 'constant', value: 4 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_4' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_16' } },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_10: { type: 'boolean', expression: { kind: 'skillHasHit' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'poise2' } },
      data_13: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'inputTarget' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mingheChr_0037_minghe_normalskill_2: SkillDefinition = {
  actionGraph: mingheChr_0037_minghe_normalskill_2ActionGraph,
  normalSkillSubType: 'additionalNormalSkill',
  key: 'chr_0037_minghe_normalskill_2',
  element: 'electric',
  blackboard: {
    atk_scale: [0.89, 0.98, 1.07, 1.16, 1.24, 1.33, 1.42, 1.51, 1.6, 1.71, 1.84, 2],
    atk_scale2: [2.22, 2.44, 2.67, 2.89, 3.11, 3.33, 3.56, 3.78, 4, 4.28, 4.61, 5],
    poise2: 10,
    potential_adddamage: 0,
    potential_duration: 0,
    potential_has: 0,
    potential_maxstack: 0,
    specialcount: 0,
  },
  timelineBlockFrames: 51,
  naturalDurationFrames: 256,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 59, sequence: { $sequence: 'spawnAbilityEntity_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'finishBuffsById_3' } },
    { startFrame: 31, endFrame: 32, sequence: { $sequence: 'findTargets_4' } },
    { startFrame: 46, endFrame: 47, sequence: { $sequence: 'findTargets_4' } },
    { startFrame: 31, endFrame: 31, sequence: { $sequence: 'forEachContextTarget_30' } },
    { startFrame: 46, endFrame: 46, sequence: { $sequence: 'dealDamage_35' } },
    { startFrame: 31, endFrame: 31, sequence: { $sequence: 'ifElse_39' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  icon: 'endaxis:operators/minghe/battle_02',
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
};

export const mingheChr_0037_minghe_combo_skillActionGraph = {
  main: {
    nodes: {
      findTargets_1: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'factionHitBox',
              factionTarget: 'anti',
              owner: { kind: 'owner' },
              checkAlive: true,
              containsUnmarkable: false,
              replacePartsWithMainBodies: false,
            },
            saveToContextKey: 'targets',
          },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      changeResource_7: {
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
      startTimeDilation_8: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'context', key: 'targets' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.2 },
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
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
                  time: 0.3901869,
                  value: 0,
                  inTangent: 0,
                  outTangent: 5.417288,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.9835815,
                  value: 1,
                  inTangent: 1.821103,
                  outTangent: 1.821103,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
          },
        },
        next: null,
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'startTimeDilation_8',
      },
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'changeResource_7' },
          whenFalse: { $sequence: null },
        },
        next: 'checkCondition_9',
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'ifElse_10',
      },
      applyBuff_12: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0037_minghe_power' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'dealDamage_11',
      },
      applyElementalInfliction_13: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: {
            element: 'electric',
            isExtra: false,
            target: { kind: 'context', key: 'targets' },
          },
        },
        next: 'applyBuff_12',
      },
      startTimeDilation_14: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 5 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 100,
            curve: {
              kind: 'inline',
              keys: [
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
                  time: 1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: true,
            targets: [{ kind: 'context', key: 'smart_target' }],
          },
        },
        next: null,
      },
      checkCondition_15: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
        },
        next: 'startTimeDilation_14',
      },
      spawnAbilityEntity_19: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0037_minghe_camera_anchor',
            source: { kind: 'source' },
            inheritActionBlackboard: false,
            dieWhenSourceDies: true,
            finishByAction: true,
            saveToContextKey: 'pos',
          },
        },
        next: null,
      },
      ifElse_20: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'spawnAbilityEntity_19' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_21: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: [
              { kind: 'owner' },
              {
                kind: 'ownerSpawned',
                owner: { kind: 'owner' },
                objectType: 'abilityEntity',
                sameSourceSkillCast: false,
              },
            ],
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_22: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0037_minghe_normalskill_2'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale1' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'targets' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_4: { type: 'boolean', expression: { kind: 'skillHasHit' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          target: { kind: 'context', key: 'smart_target' },
          operator: 'less',
          value: { kind: 'constant', value: 30 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mingheChr_0037_minghe_combo_skill: SkillDefinition = {
  actionGraph: mingheChr_0037_minghe_combo_skillActionGraph,
  key: 'chr_0037_minghe_combo_skill',
  element: 'electric',
  blackboard: {
    atk_scale1: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.578, 0.623, 0.675],
    atk_scale2: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.93, 2.08, 2.25],
    poise: 10,
    usp: 10,
  },
  timelineBlockFrames: 42,
  naturalDurationFrames: 265,
  exclusiveFrame: 41,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 12, endFrame: 13, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 27, endFrame: 28, sequence: { $sequence: 'applyElementalInfliction_13' } },
    { startFrame: 9, endFrame: 12, sequence: { $sequence: 'checkCondition_15' } },
    { startFrame: 14, endFrame: 27, sequence: { $sequence: 'checkCondition_15' } },
    { startFrame: 0, endFrame: 150, sequence: { $sequence: 'ifElse_20' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_21' } },
    { startFrame: 36, endFrame: 74, sequence: { $sequence: 'reachSkillOperableBoundary_22' } },
  ],
  defaultTarget: 'enemy',
  smartTarget: 'trigger',
  cooldownFrames: [570, 570, 570, 570, 570, 570, 570, 570, 570, 570, 570, 540],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
};

export const mingheChr_0037_minghe_ultimate_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0037_minghe_listen_ultimateend_storymode' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0037_minghe_ultimaterush' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      spawnAbilityEntity_4: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0037_minghe_camera_anchor',
            source: { kind: 'source' },
            inheritActionBlackboard: false,
            dieWhenSourceDies: true,
            finishByAction: true,
            saveToContextKey: 'pos',
          },
        },
        next: null,
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'spawnAbilityEntity_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      findTargets_6: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'factionHitBox',
              factionTarget: 'anti',
              owner: { kind: 'owner' },
              checkAlive: true,
              containsUnmarkable: false,
              replacePartsWithMainBodies: false,
            },
            saveToContextKey: 'targets',
            continuousIntervalSeconds: 0.0333333351,
          },
        },
        next: null,
      },
      applyBuff_11: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0037_minghe_ultimate_grab' }],
            targets: { kind: 'inputTarget' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      anyCondition_10: {
        action: {
          kind: 'anyCondition',
          parameters: {},
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_2' },
            { kind: 'conditionNode', nodeId: 'data_3' },
            { kind: 'conditionNode', nodeId: 'data_4' },
          ],
        },
        next: null,
      },
      ifElse_12: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'applyBuff_11' },
        },
        next: null,
      },
      dealDamage_13: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'inputTarget' },
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: 'ifElse_12',
      },
      repeatEachTick_14: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: true,
              target: { kind: 'context', key: 'targets' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds: 0.15,
            },
          },
          body: { $sequence: 'dealDamage_13' },
        },
        next: null,
      },
      findTargets_15: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'factionHitBox',
              factionTarget: 'anti',
              owner: { kind: 'owner' },
              checkAlive: true,
              containsUnmarkable: false,
              replacePartsWithMainBodies: false,
            },
            saveToContextKey: 'targets',
          },
        },
        next: null,
      },
      dealDamage_18: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_7' },
            tags: ['ultimateSkill'],
          },
        },
        next: null,
      },
      applyElementalInfliction_19: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: {
            element: 'electric',
            isExtra: false,
            target: { kind: 'context', key: 'targets' },
          },
        },
        next: 'dealDamage_18',
      },
      dealDamage_20: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
            tags: ['ultimateSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_9' },
          },
        },
        next: null,
      },
      applyPhysicalInfliction_21: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'crush',
            source: { kind: 'owner' },
            target: { kind: 'context', key: 'targets' },
            isExtra: false,
            damageMultiplier: { kind: 'constant', value: 1 },
            ignoreHitEffect: true,
          },
        },
        next: 'dealDamage_20',
      },
      jumpTimeline_23: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 96 },
          condition: { kind: 'conditionNode', nodeId: 'data_10' },
        },
        next: null,
      },
      checkCondition_24: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' } },
        },
        next: 'jumpTimeline_23',
      },
      modifyActionValue_25: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hittargettimes',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'checkCondition_24',
      },
      ifElse_27: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_13' },
          whenTrue: { $sequence: 'modifyActionValue_25' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      modifyActionValue_32: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hasstrongenemy',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      ifElse_33: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_14' },
          whenTrue: { $sequence: 'modifyActionValue_32' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      checkCondition_37: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_16' } },
        },
        next: 'jumpTimeline_23',
      },
      modifyActionValue_38: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hitstrongtimes',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'checkCondition_37',
      },
      checkCondition_39: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_18' } },
        },
        next: 'modifyActionValue_38',
      },
      forEachContextTarget_40: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'targets' } },
          body: { $sequence: 'ifElse_33' },
        },
        next: 'checkCondition_39',
      },
      modifyActionValue_41: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'hasstrongenemy',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          },
        },
        next: 'forEachContextTarget_40',
      },
      ifElse_42: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_19' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'ifElse_27' },
        },
        next: 'modifyActionValue_41',
      },
      checkCondition_43: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_20' } },
        },
        next: 'ifElse_42',
      },
      ifElse_44: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_21' },
          whenTrue: { $sequence: 'jumpTimeline_23' },
          whenFalse: { $sequence: 'checkCondition_43' },
        },
        next: null,
      },
      repeatEachTick_45: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeTickIntervalV2: {
              executeEachFrame: false,
              intervalSeconds: 0.100000001490116,
              totalTickCount: 11,
              totalDurationSeconds: 1.06666672,
            },
          },
          body: { $sequence: 'ifElse_44' },
        },
        next: null,
      },
      findTargets_46: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'buffFilter',
              targets: {
                kind: 'enemyByTags',
                scope: 'global',
                reverse: true,
                tagQueryType: 'hasAll',
                tags: [],
              },
              requireBuff: true,
              query: { kind: 'id', buffIds: ['buff_chr_0037_minghe_ultimate_grab'] },
            },
            saveToContextKey: 'grab_targets',
          },
        },
        next: null,
      },
      finishBuffsById_47: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'inputTarget' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0037_minghe_ultimate_grab'],
            reason: 'other',
          },
        },
        next: null,
      },
      forEachContextTarget_48: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'grab_targets' } },
          body: { $sequence: 'finishBuffsById_47' },
        },
        next: null,
      },
      applyBuff_49: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_damage_immune_ult_skill' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      hideUi_50: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_51: {
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
      reachSkillOperableBoundary_52: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0037_minghe_normalskill_1'] },
        },
        next: null,
      },
      reachSkillOperableBoundary_53: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0037_minghe_normalskill_2'] },
        },
        next: null,
      },
      reachSkillOperableBoundary_54: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0037_minghe_combo_skill'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: { kind: 'inputTarget' },
          tagQueryType: 'hasAny',
          tags: ['Immune/Pull'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          target: { kind: 'inputTarget' },
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 30 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          checkPartTags: true,
          target: { kind: 'inputTarget' },
          tagQueryType: 'hasAny',
          tags: ['Immune/Pull'],
        },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'anyCondition_10' } },
      },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale2' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale3' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'poise3' } },
      data_10: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_11: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hittargettimes', fallback: 0 },
      },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_11' },
          operator: 'greater',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'targetContains',
          parent: { kind: 'context', key: 'targets' },
          child: { kind: 'inputTarget' },
        },
      },
      data_14: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'anyCondition_10' } },
      },
      data_15: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hitstrongtimes', fallback: 0 },
      },
      data_16: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_15' },
          operator: 'greater',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_17: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'hasstrongenemy', fallback: 0 },
      },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_17' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_19: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'targets' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_21: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: { kind: 'owner' },
          tagQueryType: 'hasAny',
          tags: ['Status/InWater/DeepOrHigher'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mingheChr_0037_minghe_ultimate_skill: SkillDefinition = {
  actionGraph: mingheChr_0037_minghe_ultimate_skillActionGraph,
  key: 'chr_0037_minghe_ultimate_skill',
  element: 'electric',
  blackboard: {
    atk_scale: [0.11, 0.12, 0.13, 0.14, 0.16, 0.17, 0.18, 0.19, 0.2, 0.21, 0.23, 0.25],
    atk_scale2: [2.22, 2.44, 2.67, 2.89, 3.11, 3.33, 3.56, 3.78, 4, 4.28, 4.61, 5],
    atk_scale3: [3.33, 3.67, 4, 4.33, 4.67, 5, 5.33, 5.67, 6, 6.42, 6.92, 7.5],
    hasstrongenemy: 0,
    hitstrongtimes: 0,
    hittargettimes: 0,
    poise3: 10,
  },
  timelineBlockFrames: 187,
  naturalDurationFrames: 364,
  exclusiveFrame: 186,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 146, sequence: { $sequence: 'applyBuff_1' } },
    { startFrame: 64, endFrame: 96, sequence: { $sequence: 'applyBuff_2' } },
    { startFrame: 61, endFrame: 312, sequence: { $sequence: 'ifElse_5' } },
    { startFrame: 64, endFrame: 96, sequence: { $sequence: 'findTargets_6' } },
    { startFrame: 64, endFrame: 96, sequence: { $sequence: 'repeatEachTick_14' } },
    { startFrame: 97, endFrame: 98, sequence: { $sequence: 'findTargets_15' } },
    { startFrame: 132, endFrame: 133, sequence: { $sequence: 'findTargets_15' } },
    { startFrame: 145, endFrame: 146, sequence: { $sequence: 'findTargets_15' } },
    { startFrame: 132, endFrame: 135, sequence: { $sequence: 'applyElementalInfliction_19' } },
    { startFrame: 145, endFrame: 146, sequence: { $sequence: 'applyPhysicalInfliction_21' } },
    { startFrame: 64, endFrame: 96, sequence: { $sequence: 'repeatEachTick_45' } },
    { startFrame: 96, endFrame: 97, sequence: { $sequence: 'findTargets_46' } },
    { startFrame: 96, endFrame: 97, sequence: { $sequence: 'forEachContextTarget_48' } },
    { startFrame: 0, endFrame: 146, sequence: { $sequence: 'applyBuff_49' } },
    { startFrame: 0, endFrame: 62, sequence: { $sequence: 'hideUi_50' } },
    { startFrame: 0, endFrame: 62, sequence: { $sequence: 'startUltimateTimeDilation_51' } },
    { startFrame: 147, endFrame: 175, sequence: { $sequence: 'reachSkillOperableBoundary_52' } },
    { startFrame: 147, endFrame: 175, sequence: { $sequence: 'reachSkillOperableBoundary_53' } },
    { startFrame: 147, endFrame: 175, sequence: { $sequence: 'reachSkillOperableBoundary_54' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 450,
  costs: [{ resource: 'ultimateEnergy', value: 80 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const mingheCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mingheCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: mingheCommon_character_perfect_dodgeActionGraph,
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

export const mingheChr_0037_minghe_plunging_attack_startActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const mingheChr_0037_minghe_plunging_attack_start: SkillDefinition = {
  actionGraph: mingheChr_0037_minghe_plunging_attack_startActionGraph,
  key: 'chr_0037_minghe_plunging_attack_start',
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

const mingheComboCondition1ActionGraph = {
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
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/NoGuard'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mingheComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0037_minghe_combo_skill',
  event: 'addedBuff',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_2' },
  actionGraph: mingheComboCondition1ActionGraph,
};

const mingheBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mingheBuff1: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_energy_fusion_conduct',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    abnormalColorType: 'Pulse',
  },
  applyTags: [],
  extendTags: [],
  blackboard: { count: 0, duration: 15 },
  attributeModifiers: [],
  actionGraph: mingheBuff1ActionGraph,
};

const mingheBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mingheBuff2: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_shield',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 120 },
  attributeModifiers: [],
  actionGraph: mingheBuff2ActionGraph,
};

const mingheBuff3ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mingheBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { crush_damage: 0, other_damage_percent: 0 },
  attributeModifiers: [],
  actionGraph: mingheBuff3ActionGraph,
};

const mingheBuff4ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mingheBuff4: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: { blackboardKey: 'maxstack' },
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_pulse_dmg_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { adddamage: 0, duration: 0, maxstack: 0 },
  attributeModifiers: [
    {
      attribute: 'electricDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'adddamage' },
    },
  ],
  actionGraph: mingheBuff4ActionGraph,
};

const mingheBuff5ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mingheBuff5: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: { blackboardKey: 'maxstack' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_pulse_dmg_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { extra_yuanshi_add: 0, thunderdamage_multi: 0 },
  attributeModifiers: [],
  actionGraph: mingheBuff5ActionGraph,
};

const mingheBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mingheBuff6: SkillBuffDefinition = {
  stackingType: 'stack',
  stackingKey: 'buff_chr_0037_minghe_power',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_shield',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 20 },
  attributeModifiers: [],
  actionGraph: mingheBuff6ActionGraph,
  skillSlotReplacements: [
    {
      skillSlotKey: 'battleSkill',
      targetSkillKey: 'chr_0037_minghe_normalskill_2',
      revertedSkillKey: 'chr_0037_minghe_normalskill_1',
      inheritOriginSkillCooldownProgress: false,
    },
  ],
};

const mingheBuff7ActionGraph = {
  main: {
    nodes: {
      modifyCollectedBuffValue_1: {
        action: {
          kind: 'modifyCollectedBuffValue',
          parameters: {
            key: 'if_contain_physicdamage',
            useDirectValue: true,
            multiplier: { kind: 'constant', value: 1 },
            addition: { kind: 'valueNode', nodeId: 'data_1' },
            directValue: { kind: 'constant', value: 1 },
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'modifyCollectedBuffValue_1',
      },
      readBuffBlackboard_4: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: { kind: 'owner' },
            query: { kind: 'id', buffIds: ['buff_chr_0037_minghe_potential_1'] },
            desiredKey: 'other_damage_percent',
            outputKey: 'other_damage_percent',
          },
        },
        next: null,
      },
      readBuffBlackboard_5: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: { kind: 'owner' },
            query: { kind: 'id', buffIds: ['buff_chr_0037_minghe_potential_1'] },
            desiredKey: 'crush_damage',
            outputKey: 'crush_damage',
          },
        },
        next: 'readBuffBlackboard_4',
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0037_minghe_thundertrigger',
                copiedBlackboardAssignments: {
                  atk_scale: 'atk_scale',
                  duration: 'duration',
                  other_damage_percent: 'other_damage_percent',
                  max_stack: 'max_stack',
                  crush_damage: 'crush_damage',
                },
              },
            ],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            count: { kind: 'valueNode', nodeId: 'data_3' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'readBuffBlackboard_5' },
          whenFalse: { $sequence: null },
        },
        next: 'applyBuff_6',
      },
      readEventBuffBlackboard_8: {
        action: {
          kind: 'readEventBuffBlackboard',
          parameters: { desiredKey: 'count', outputKey: 'buffcount' },
        },
        next: 'ifElse_7',
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'readEventBuffBlackboard_8',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration_add' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'buffcount' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_chr_0037_minghe_potential_1'],
        },
      },
      data_5: {
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

const mingheBuff7: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0,
    buffcount: 0,
    crush_damage: 0,
    duration: 0,
    max_stack: 0,
    other_damage_percent: 0,
  },
  attributeModifiers: [],
  abilityEventResponses: [
    {
      event: 'collectOutputBuffBlackboard',
      priority: 0,
      sequence: { $sequence: 'checkCondition_2' },
    },
    { event: 'outputBuff', priority: 0, sequence: { $sequence: 'checkCondition_9' } },
  ],
  actionGraph: mingheBuff7ActionGraph,
};

const mingheBuff8ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'damage_up_runtime',
            operation: 'multiply',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      readBuffBlackboard_3: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: { kind: 'owner' },
            query: { kind: 'id', buffIds: ['buff_chr_0037_minghe_potential_5'] },
            desiredKey: 'thunderdamage_multi',
            outputKey: 'thunderdamage_multi',
          },
        },
        next: 'modifyActionValue_2',
      },
      modifyCollectedBuffValue_4: {
        action: {
          kind: 'modifyCollectedBuffValue',
          parameters: {
            key: 'yuanshi_damageadd',
            useDirectValue: true,
            multiplier: { kind: 'constant', value: 1 },
            addition: { kind: 'valueNode', nodeId: 'data_2' },
            directValue: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: null,
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'readBuffBlackboard_3' },
          whenFalse: { $sequence: null },
        },
        next: 'modifyCollectedBuffValue_4',
      },
      modifyActionValue_6: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'damage_up_runtime',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'ifElse_5',
      },
      modifyCollectedBuffValue_7: {
        action: {
          kind: 'modifyCollectedBuffValue',
          parameters: {
            key: 'talent2',
            useDirectValue: true,
            multiplier: { kind: 'constant', value: 1 },
            addition: { kind: 'valueNode', nodeId: 'data_2' },
            directValue: { kind: 'constant', value: 1 },
          },
        },
        next: 'modifyActionValue_6',
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'modifyCollectedBuffValue_7',
      },
      readBuffBlackboard_10: {
        action: {
          kind: 'readBuffBlackboard',
          parameters: {
            target: { kind: 'owner' },
            query: { kind: 'id', buffIds: ['buff_chr_0037_minghe_potential_5'] },
            desiredKey: 'extra_yuanshi_add',
            outputKey: 'extra_yuanshi_add',
          },
        },
        next: null,
      },
      applyBuff_11: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0037_minghe_talent_2_effectbuff',
                copiedBlackboardAssignments: {
                  yuanshi_add: 'yuanshi_add_runtime',
                  duration: 'duration',
                },
              },
            ],
            targets: { kind: 'context', key: 'teammate' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      findTargets_12: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'characterTeam', excludeOwner: false, owner: { kind: 'owner' } },
            saveToContextKey: 'teammate',
          },
        },
        next: 'applyBuff_11',
      },
      modifyActionValue_13: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'yuanshi_add_runtime',
            operation: 'add',
            value: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'findTargets_12',
      },
      modifyActionValue_14: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'yuanshi_add_runtime',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_8' },
          },
        },
        next: 'modifyActionValue_13',
      },
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_9' },
          whenTrue: { $sequence: 'readBuffBlackboard_10' },
          whenFalse: { $sequence: null },
        },
        next: 'modifyActionValue_14',
      },
      checkCondition_16: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' } },
        },
        next: 'ifElse_15',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'thunderdamage_multi' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'duration_add' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'damage_up_runtime' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_chr_0037_minghe_potential_5'],
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'damage_up' } },
      data_6: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0037_minghe_thundertrigger'] },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'extra_yuanshi_add' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'yuanshi_add' } },
      data_9: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_chr_0037_minghe_potential_5'],
        },
      },
      data_10: {
        type: 'boolean',
        expression: { kind: 'eventSkillIdIn', skillIds: ['chr_0037_minghe_normalskill_2'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mingheBuff8: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    damage_up: 0,
    damage_up_runtime: 0,
    duration: 0,
    extra_yuanshi_add: 0,
    thunderdamage_multi: 0,
    yuanshi_add: 0,
    yuanshi_add_runtime: 0,
  },
  attributeModifiers: [],
  abilityEventResponses: [
    {
      event: 'collectOutputBuffBlackboard',
      priority: 0,
      sequence: { $sequence: 'checkCondition_8' },
    },
    { event: 'beforeCastSkill', priority: 0, sequence: { $sequence: 'checkCondition_16' } },
  ],
  actionGraph: mingheBuff8ActionGraph,
};

const mingheBuff9ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mingheBuff9: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_physical_infliction_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 4, yuanshi_add: 0 },
  attributeModifiers: [
    {
      attribute: 'PhysicalAndSpellInflictionEnhance',
      slot: 'baseAddition',
      value: { blackboardKey: 'yuanshi_add' },
    },
  ],
  actionGraph: mingheBuff9ActionGraph,
};

const mingheBuff10ActionGraph = {
  main: {
    nodes: {
      checkCondition_10: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      spawnAbilityEntity_1: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'owner' },
            abilityEntityId: 'abilityentity_chr_0037_minghe_specialfracture_thunder',
            childSkillId: 'chr_0037_minghe_specialfracture_thunderskill',
            source: { kind: 'source' },
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: { kind: 'owner' },
            overrideDurationSeconds: { kind: 'constant', value: 3 },
          },
        },
        next: null,
      },
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'buffcount',
            operation: 'multiply',
            value: { kind: 'constant', value: -1 },
          },
        },
        next: 'spawnAbilityEntity_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'modifyActionValue_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_3',
      },
      finishBuffsById_8: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0037_minghe_thundertrigger'],
            reason: 'early',
          },
        },
        next: null,
      },
      anyCondition_7: {
        action: {
          kind: 'anyCondition',
          parameters: {},
          conditions: [
            { kind: 'conditionNode', nodeId: 'data_4' },
            { kind: 'conditionNode', nodeId: 'data_5' },
          ],
        },
        next: null,
      },
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'finishBuffsById_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventDamageFeaturesMatch', match: 'hasAll', features: ['crush'] },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffEnhanceLayerCompare',
          operator: 'less',
          value: { kind: 'constant', value: 0 },
          outputKey: 'buffcount',
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffFinishReasonIn', reasons: ['early'] },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'eventSkillTagsMatch',
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0037_minghe/thundertriggerdamage'],
        },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'eventDamageFeaturesMatch', match: 'hasAll', features: ['crush'] },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'anyCondition_7' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mingheBuff10: SkillBuffDefinition = {
  stackingType: 'enhanceAndOverwriteDuration',
  priority: 0,
  maxStackCount: { blackboardKey: 'max_stack' },
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 0,
  presentation: {
    icon: 'endaxis:icons/icon_battle_buff_minghe_thundertrigger',
    showInHeadBarCommon: true,
    abnormalColorType: 'Pulse',
  },
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0,
    buffcount: 0,
    crush_damage: 1,
    duration: 15,
    max_stack: 4,
    other_damage_percent: 0,
    talent2: 0,
    yuanshi_damageadd: 0,
  },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { $sequence: 'checkCondition_10' },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'product',
          addition: { blackboardKey: 'crush_damage' },
        },
      ],
    },
  ],
  lifecycleSequences: { finish: [{ $sequence: 'checkCondition_4' }] },
  abilityEventResponses: [
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'ifElse_9' } },
  ],
  actionGraph: mingheBuff10ActionGraph,
};

const mingheBuff11ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 999 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 100,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.05,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 0.05,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: true,
            targets: [{ kind: 'owner' }],
          },
        },
        next: null,
      },
      exitControlledState_3: {
        action: { kind: 'exitControlledState', parameters: {} },
        next: null,
      },
      ifElse_4: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'exitControlledState_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      boneAttach_5: {
        action: {
          kind: 'boneAttach',
          parameters: { target: { kind: 'owner' }, anchor: { kind: 'source' } },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'enemySuperArmorCompare',
          target: { kind: 'owner' },
          operator: 'less',
          value: { kind: 'constant', value: 30 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mingheBuff11: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  presentation: {
    icon: 'endaxis:icons/icon_battle_shield',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 120 },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 7, endFrame: 180, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 16, sequence: { $sequence: 'ifElse_4' } },
    { startFrame: 0, endFrame: 180, sequence: { $sequence: 'boneAttach_5' } },
  ],
  actionGraph: mingheBuff11ActionGraph,
};

const mingheBuff12ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'inputTarget' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0037_minghe_ultimate_grab'],
            reason: 'other',
          },
        },
        next: null,
      },
      forEachContextTarget_2: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'grab_targets' } },
          body: { $sequence: 'finishBuffsById_1' },
        },
        next: null,
      },
      findTargets_3: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: {
              kind: 'buffFilter',
              targets: {
                kind: 'enemyByTags',
                scope: 'global',
                reverse: true,
                tagQueryType: 'hasAll',
                tags: [],
              },
              requireBuff: true,
              query: { kind: 'id', buffIds: ['buff_chr_0037_minghe_ultimate_grab'] },
            },
            saveToContextKey: 'grab_targets',
          },
        },
        next: 'forEachContextTarget_2',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const mingheBuff12: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_shield',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 120 },
  attributeModifiers: [],
  lifecycleSequences: { finish: [{ $sequence: 'findTargets_3' }] },
  actionGraph: mingheBuff12ActionGraph,
};

export const minghe: OperatorDefinition = {
  slug: 'minghe',
  gameId: 'MINGHE',
  rarity: 6,
  weaponType: 'sword',
  element: 'electric',
  characterTypeId: 'Pulse',
  role: 'guard',
  mainAttribute: 'will',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [
      15.0824742268041, 37.8029244687566, 61.7191878813382, 85.6354512939198, 109.551714706501,
      121.509846412792,
    ],
    agility: [
      9.48453608247426, 27.5051546391753, 46.4742268041237, 65.4432989690722, 84.4123711340206,
      93.8969072164948,
    ],
    intellect: [
      9.48453608247426, 27.5051546391753, 46.4742268041237, 65.4432989690722, 84.4123711340206,
      93.8969072164948,
    ],
    will: [
      22.5773195876289, 55.7603618767096, 90.6898800757419, 125.619398274774, 160.548916473806,
      178.013675573323,
    ],
    baseAttack: [30, 91, 156, 221, 285, 318],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skills: [
    mingheChr_0037_minghe_attack1,
    mingheChr_0037_minghe_attack2,
    mingheChr_0037_minghe_attack3,
    mingheChr_0037_minghe_attack4,
    mingheChr_0037_minghe_attack5,
    mingheChr_0037_minghe_powerattack,
    mingheChr_0037_minghe_plunging_attack_end,
    mingheChr_0037_minghe_normalskill_1,
    mingheChr_0037_minghe_normalskill_2,
    mingheChr_0037_minghe_combo_skill,
    mingheChr_0037_minghe_ultimate_skill,
    mingheCommon_character_perfect_dodge,
    mingheChr_0037_minghe_plunging_attack_start,
  ],
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skillIds: [
        'chr_0037_minghe_attack1',
        'chr_0037_minghe_attack2',
        'chr_0037_minghe_attack3',
        'chr_0037_minghe_attack4',
        'chr_0037_minghe_attack5',
      ],
    },
    { key: 'finisher', operationType: 'finisher', skillIds: ['chr_0037_minghe_powerattack'] },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skillIds: ['chr_0037_minghe_plunging_attack_end'],
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skillIds: ['chr_0037_minghe_normalskill_1', 'chr_0037_minghe_normalskill_2'],
      placementSequenceSkillKeys: [
        'chr_0037_minghe_normalskill_1',
        'chr_0037_minghe_normalskill_2',
      ],
    },
    { key: 'comboSkill', operationType: 'comboSkill', skillIds: ['chr_0037_minghe_combo_skill'] },
    { key: 'ultimate', operationType: 'ultimate', skillIds: ['chr_0037_minghe_ultimate_skill'] },
  ],
  dodgeSkillId: 'common_character_perfect_dodge',
  plungingAttack: {
    startSkillId: 'chr_0037_minghe_plunging_attack_start',
    endSkillId: 'chr_0037_minghe_plunging_attack_end',
    startDurationSeconds: 0.5,
    endDurationSeconds: 1.267,
  },
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0037_minghe_normalskill_1',
      replacementSkillKeys: ['chr_0037_minghe_normalskill_2'],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0037_minghe_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0037_minghe_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0037_minghe_attack1',
        'chr_0037_minghe_attack2',
        'chr_0037_minghe_attack3',
        'chr_0037_minghe_attack4',
        'chr_0037_minghe_plunging_attack_end',
        'chr_0037_minghe_powerattack',
        'chr_0037_minghe_attack5',
      ],
      normalAttackSkillKeys: [
        'chr_0037_minghe_attack1',
        'chr_0037_minghe_attack2',
        'chr_0037_minghe_attack3',
        'chr_0037_minghe_attack4',
        'chr_0037_minghe_attack5',
      ],
      defaultSkillKey: 'chr_0037_minghe_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [mingheComboCondition1],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0037_minghe_talent_1',
          blackboardAssignments: {
            atk_scale: [2.2, 3.3],
            crush_damage: 0.2,
            duration: 60,
            duration_add: [4, 6],
            max_stack: 12,
            other_damage_percent: 0.4,
          },
        },
      ],
    },
    {
      levels: 2,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0037_minghe_talent_2',
          blackboardAssignments: { damage_up: [0.004, 0.006], duration: 20, yuanshi_add: [30, 45] },
        },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0037_minghe_potential_1',
          blackboardAssignments: { crush_damage: 0.4, other_damage_percent: 0.5 },
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['will'], value: 20 },
        { kind: 'modifyBasePanelStat', stat: 'artsIntensity', operation: 'flat', value: 16 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0037_minghe_normalskill_2',
          blackboardKey: 'potential_has',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0037_minghe_normalskill_2',
          blackboardKey: 'potential_adddamage',
          operation: 'assign',
          value: 0.06,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0037_minghe_normalskill_2',
          blackboardKey: 'potential_duration',
          operation: 'assign',
          value: 25,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0037_minghe_normalskill_2',
          blackboardKey: 'potential_maxstack',
          operation: 'assign',
          value: 6,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillKey: 'chr_0037_minghe_ultimate_skill',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      attachedBuffs: [
        {
          buffId: 'buff_chr_0037_minghe_potential_5',
          blackboardAssignments: { extra_yuanshi_add: 15, thunderdamage_multi: 1.2 },
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0037_minghe_attack04_finishprojectile: mingheBuff1,
    buff_chr_0037_minghe_listen_ultimateend_storymode: mingheBuff2,
    buff_chr_0037_minghe_potential_1: mingheBuff3,
    buff_chr_0037_minghe_potential_3: mingheBuff4,
    buff_chr_0037_minghe_potential_5: mingheBuff5,
    buff_chr_0037_minghe_power: mingheBuff6,
    buff_chr_0037_minghe_talent_1: mingheBuff7,
    buff_chr_0037_minghe_talent_2: mingheBuff8,
    buff_chr_0037_minghe_talent_2_effectbuff: mingheBuff9,
    buff_chr_0037_minghe_thundertrigger: mingheBuff10,
    buff_chr_0037_minghe_ultimate_grab: mingheBuff11,
    buff_chr_0037_minghe_ultimaterush: mingheBuff12,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0037_minghe_attack04_flysword: {
      faction: 'good',
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      maxStackingCount: 1,
      childSkill: {
        actionGraph: { main: { nodes: {} }, macros: {} },
        skillId: 'chr_0037_minghe_attack4_flysword_weapon',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 90,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {},
        scheduledSequences: [],
      },
    },
    abilityentity_chr_0037_minghe_attack04_groundsword_weapon: {
      faction: 'good',
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      maxStackingCount: 1,
    },
    abilityentity_chr_0037_minghe_attack04_groundsword: {
      faction: 'good',
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      maxStackingCount: 1,
      childSkill: {
        actionGraph: { main: { nodes: {} }, macros: {} },
        skillId: 'chr_0037_minghe_attack4_hitground_abilityentity_groundeffect',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 150,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {},
        scheduledSequences: [],
      },
    },
    abilityentity_chr_0037_minghe_camera_anchor_normalskill2: {
      faction: 'good',
      blackboard: { EntityBB_anglespeed: 0, EntityBB_radius: 0 },
      lifetime: { kind: 'infinite' },
    },
    abilityentity_chr_0037_minghe_camera_anchor: {
      faction: 'good',
      blackboard: { EntityBB_anglespeed: 0, EntityBB_radius: 0 },
      lifetime: { kind: 'infinite' },
    },
    abilityentity_chr_0037_minghe_specialfracture_thunder: {
      faction: 'good',
      blackboard: { EntityBB_damage: 0 },
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              storeSourceAttributeValue_2: {
                action: {
                  kind: 'storeSourceAttributeValue',
                  parameters: {
                    target: { kind: 'source' },
                    attribute: { kind: 'specific', key: 'PhysicalAndSpellInflictionEnhance' },
                    stage: 'finalNonConverted',
                    useFloor: false,
                    divisor: { kind: 'constant', value: 1 },
                    multiplier: { kind: 'valueNode', nodeId: 'data_1' },
                    base: { kind: 'constant', value: 1 },
                    targetKey: 'yuanshi_damageadd',
                  },
                },
                next: null,
              },
              modifyActionValue_3: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'yuanshi_damageadd',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  },
                },
                next: null,
              },
              modifyActionValue_5: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'atk_scale_runtime',
                    operation: 'multiply',
                    value: { kind: 'valueNode', nodeId: 'data_2' },
                  },
                },
                next: null,
              },
              dealDamage_6: {
                action: {
                  kind: 'dealDamage',
                  parameters: {
                    attacker: 'actionSource',
                    target: { kind: 'inputTarget' },
                    damageType: 'electric',
                    attackScale: { kind: 'valueNode', nodeId: 'data_3' },
                    tags: [],
                    features: ['talentDamage'],
                  },
                  key: 'abilityentity_chr_0037_minghe_specialfracture_thunder:chr_0037_minghe_specialfracture_thunderskill:/childSkill/actionGraph/main/nodes/dealDamage_6/action',
                },
                next: null,
              },
              ifElse_7: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_4' },
                  whenTrue: { $sequence: null },
                  whenFalse: { $sequence: 'modifyActionValue_5' },
                },
                next: 'dealDamage_6',
              },
              modifyActionValue_8: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'atk_scale_runtime',
                    operation: 'multiply',
                    value: { kind: 'valueNode', nodeId: 'data_1' },
                  },
                },
                next: 'ifElse_7',
              },
              modifyActionValue_9: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'atk_scale_runtime',
                    operation: 'multiply',
                    value: { kind: 'valueNode', nodeId: 'data_5' },
                  },
                },
                next: 'modifyActionValue_8',
              },
              modifyActionValue_10: {
                action: {
                  kind: 'modifyActionValue',
                  parameters: {
                    key: 'atk_scale_runtime',
                    operation: 'assign',
                    value: { kind: 'valueNode', nodeId: 'data_6' },
                  },
                },
                next: 'modifyActionValue_9',
              },
              forEachContextTarget_11: {
                action: {
                  kind: 'forEachContextTarget',
                  parameters: { targets: { kind: 'context', key: 'targets' } },
                  body: { $sequence: 'modifyActionValue_10' },
                },
                next: null,
              },
              ifElse_12: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_8' },
                  whenTrue: { $sequence: 'storeSourceAttributeValue_2' },
                  whenFalse: { $sequence: 'modifyActionValue_3' },
                },
                next: 'forEachContextTarget_11',
              },
              findTargets_13: {
                action: {
                  kind: 'findTargets',
                  parameters: {
                    owner: { kind: 'owner' },
                    query: {
                      kind: 'factionHitBox',
                      factionTarget: 'anti',
                      owner: { kind: 'owner' },
                      checkAlive: true,
                      containsUnmarkable: false,
                      replacePartsWithMainBodies: false,
                    },
                    saveToContextKey: 'targets',
                  },
                },
                next: 'ifElse_12',
              },
              copyContextTargets_14: {
                action: {
                  kind: 'copyContextTargets',
                  parameters: { source: { kind: 'inputTarget' }, saveToContextKey: 'buffowner' },
                },
                next: 'findTargets_13',
              },
            },
            dataNodes: {
              data_1: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'yuanshi_damageadd' },
              },
              data_2: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'other_damage_percent' },
              },
              data_3: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'atk_scale_runtime' },
              },
              data_4: {
                type: 'boolean',
                expression: {
                  kind: 'targetsEqual',
                  first: { kind: 'inputTarget' },
                  second: { kind: 'context', key: 'buffowner' },
                },
              },
              data_5: { type: 'number', expression: { kind: 'blackboard', key: 'buffcount' } },
              data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
              data_7: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'talent2', fallback: 0 },
              },
              data_8: {
                type: 'boolean',
                expression: {
                  kind: 'actionValueCompare',
                  left: { kind: 'valueNode', nodeId: 'data_7' },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0037_minghe_specialfracture_thunderskill',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 2112,
        skillTags: ['Skill/Character/chr_0037_minghe/thundertriggerdamage'],
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale: 0.58,
          atk_scale_runtime: 0,
          buffcount: 0,
          other_damage_percent: 0,
          talent2: 0,
          yuanshi_damageadd: 0,
        },
        scheduledSequences: [
          { startFrame: 3, endFrame: 18, sequence: { $sequence: 'copyContextTargets_14' } },
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default minghe;
