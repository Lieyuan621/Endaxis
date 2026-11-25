/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type {
  OperatorPassiveSkillDefinition,
  ComboSkillConditionDefinition,
} from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const kayChr_0040_sweetpie_attack1ActionGraph = {
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
      startTimeDilation_4: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'context', key: 'tar' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.03 },
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
          },
        },
        next: 'changeResource_3',
      },
      ifElse_5: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
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
            target: { kind: 'context', key: 'tar' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_5',
      },
      overrideBasicAttackMapping_7: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0040_sweetpie_attack2'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0040_sweetpie_attack2'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const kayChr_0040_sweetpie_attack1: SkillDefinition = {
  actionGraph: kayChr_0040_sweetpie_attack1ActionGraph,
  key: 'chr_0040_sweetpie_attack1',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.21, 0.23, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.38, 0.41, 0.44, 0.48],
  },
  timelineBlockFrames: 7,
  naturalDurationFrames: 120,
  exclusiveFrame: 18,
  offsetRecordFrame: 5,
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'dealDamage_6' } },
    { startFrame: 0, endFrame: 26, sequence: { $sequence: 'overrideBasicAttackMapping_7' } },
    { startFrame: 7, endFrame: 26, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const kayChr_0040_sweetpie_attack2ActionGraph = {
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
      changeResource_4: {
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
      startTimeDilation_5: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'context', key: 'tar' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.03 },
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
          },
        },
        next: 'changeResource_4',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_5' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_6',
      },
      overrideBasicAttackMapping_13: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0040_sweetpie_attack3'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_14: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0040_sweetpie_attack3'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const kayChr_0040_sweetpie_attack2: SkillDefinition = {
  actionGraph: kayChr_0040_sweetpie_attack2ActionGraph,
  key: 'chr_0040_sweetpie_attack2',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.2, 0.21, 0.22, 0.24, 0.26],
  },
  timelineBlockFrames: 13,
  naturalDurationFrames: 139,
  exclusiveFrame: 21,
  offsetRecordFrame: 10,
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 5, endFrame: 6, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 10, endFrame: 11, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 0, endFrame: 26, sequence: { $sequence: 'overrideBasicAttackMapping_13' } },
    { startFrame: 13, endFrame: 26, sequence: { $sequence: 'reachSkillOperableBoundary_14' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const kayChr_0040_sweetpie_attack3ActionGraph = {
  main: {
    nodes: {
      launchProjectile_3: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: {
              endFrame: 13,
              callbacks: [
                { event: 'block', triggerFrames: [13] },
                { event: 'hit', triggerFrames: [9, 10, 11, 12], hitKind: 'collision' },
              ],
            },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0040_sweetpie_normal_attack_2',
            faction: 'good',
            recycleDelaySeconds: 0.5,
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
                            bornAt: { kind: 'inputTarget' },
                            abilityEntityId: 'abilityentity_chr_0040_sweetpie_attack3_end',
                            childSkillId: 'chr_0040_sweetpie_attack3_lance_end_abilityrange',
                            source: { kind: 'source' },
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: { kind: 'inputTarget' },
                          },
                        },
                        next: null,
                      },
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0040_sweetpie_attack3_lance_end',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 15,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {},
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                ],
              },
            },
            {
              event: 'hit',
              skill: {
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_2: {
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
                skillId: 'chr_0040_sweetpie_attack2_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 3,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'dealDamage_2' } },
                ],
              },
            },
          ],
        },
        next: null,
      },
      overrideBasicAttackMapping_5: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0040_sweetpie_attack4'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_6: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0040_sweetpie_attack4'] },
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'launchProjectile_3' },
          whenFalse: { $sequence: 'launchProjectile_3' },
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

export const kayChr_0040_sweetpie_attack3: SkillDefinition = {
  actionGraph: kayChr_0040_sweetpie_attack3ActionGraph,
  key: 'chr_0040_sweetpie_attack3',
  element: 'physical',
  blackboard: {
    atk_scale: [0.07, 0.07, 0.08, 0.09, 0.09, 0.1, 0.11, 0.11, 0.12, 0.13, 0.14, 0.15],
  },
  timelineBlockFrames: 17,
  naturalDurationFrames: 119,
  exclusiveFrame: 25,
  offsetRecordFrame: 9,
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 9, endFrame: 10, sequence: { $sequence: 'ifElse_opt1' } },
    { startFrame: 5, endFrame: 30, sequence: { $sequence: 'overrideBasicAttackMapping_5' } },
    { startFrame: 17, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_6' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const kayChr_0040_sweetpie_attack4ActionGraph = {
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
        next: null,
      },
      startTimeDilation_9: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'inputTarget' },
            affectType: 'OnlyTarget',
            durationSeconds: { kind: 'constant', value: 0.01 },
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
          },
        },
        next: 'changeResource_8',
      },
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'startTimeDilation_9' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack'],
          },
        },
        next: 'ifElse_10',
      },
      overrideBasicAttackMapping_37: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0040_sweetpie_attack5'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_38: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0040_sweetpie_attack5'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const kayChr_0040_sweetpie_attack4: SkillDefinition = {
  actionGraph: kayChr_0040_sweetpie_attack4ActionGraph,
  key: 'chr_0040_sweetpie_attack4',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.07, 0.07, 0.08, 0.09, 0.09, 0.1, 0.11, 0.11, 0.12, 0.13, 0.14, 0.15],
  },
  timelineBlockFrames: 32,
  naturalDurationFrames: 214,
  exclusiveFrame: 40,
  offsetRecordFrame: 24,
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 14, endFrame: 15, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 17, endFrame: 18, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 21, endFrame: 22, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 24, endFrame: 25, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 28, endFrame: 29, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 31, endFrame: 32, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 14, endFrame: 15, sequence: { $sequence: 'dealDamage_11' } },
    { startFrame: 17, endFrame: 18, sequence: { $sequence: 'dealDamage_11' } },
    { startFrame: 21, endFrame: 22, sequence: { $sequence: 'dealDamage_11' } },
    { startFrame: 24, endFrame: 25, sequence: { $sequence: 'dealDamage_11' } },
    { startFrame: 28, endFrame: 29, sequence: { $sequence: 'dealDamage_11' } },
    { startFrame: 31, endFrame: 32, sequence: { $sequence: 'dealDamage_11' } },
    { startFrame: 0, endFrame: 43, sequence: { $sequence: 'overrideBasicAttackMapping_37' } },
    { startFrame: 32, endFrame: 43, sequence: { $sequence: 'reachSkillOperableBoundary_38' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const kayChr_0040_sweetpie_attack5ActionGraph = {
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
      once_5: {
        action: { kind: 'once', parameters: {}, body: { $sequence: 'changeResource_3' } },
        next: null,
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'once_5' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      once_8: {
        action: { kind: 'once', parameters: {}, body: { $sequence: null } },
        next: 'ifElse_7',
      },
      startTimeDilation_9: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'inputTarget' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.45 },
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
          },
        },
        next: 'once_8',
      },
      ifElse_10: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_3' },
          whenTrue: { $sequence: 'startTimeDilation_9' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'inputTarget' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_10',
      },
      repeatEachTick_12: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              catchUpMissedTicks: true,
              target: { kind: 'context', key: 'tar' },
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_11' },
        },
        next: null,
      },
      overrideBasicAttackMapping_13: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0040_sweetpie_attack1'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_14: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0040_sweetpie_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'inputTarget' },
          containsHittableTarget: true,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'source' } },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const kayChr_0040_sweetpie_attack5: SkillDefinition = {
  actionGraph: kayChr_0040_sweetpie_attack5ActionGraph,
  key: 'chr_0040_sweetpie_attack5',
  element: 'physical',
  blackboard: {
    atb: 20,
    atk_scale: [0.59, 0.65, 0.7, 0.76, 0.82, 0.88, 0.94, 1, 1.06, 1.13, 1.22, 1.32],
    poise: 17,
  },
  timelineBlockFrames: 46,
  naturalDurationFrames: 133,
  exclusiveFrame: 56,
  offsetRecordFrame: 20,
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 20, endFrame: 21, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 21, endFrame: 22, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 20, endFrame: 22, sequence: { $sequence: 'repeatEachTick_12' } },
    { startFrame: 0, endFrame: 59, sequence: { $sequence: 'overrideBasicAttackMapping_13' } },
    { startFrame: 46, endFrame: 59, sequence: { $sequence: 'reachSkillOperableBoundary_14' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const kayChr_0040_sweetpie_power_attackActionGraph = {
  main: {
    nodes: {
      gainFinisherSp_2: {
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
      startTimeDilation_3: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'inputTarget' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.4 },
            priority: 10,
            curve: { kind: 'named', key: 'common' },
          },
        },
        next: 'gainFinisherSp_2',
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
            target: { kind: 'inputTarget' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 1,
            tags: ['powerAttack', 'normalAttack'],
          },
        },
        next: 'ifElse_4',
      },
      applyBuff_6: {
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
      applyBuff_7: {
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
      reachSkillOperableBoundary_8: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: {
            skillIds: ['chr_0040_sweetpie_normal_skill', 'chr_0040_sweetpie_combo_skill'],
          },
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

export const kayChr_0040_sweetpie_power_attack: SkillDefinition = {
  actionGraph: kayChr_0040_sweetpie_power_attackActionGraph,
  key: 'chr_0040_sweetpie_power_attack',
  element: 'physical',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 67,
  naturalDurationFrames: 194,
  exclusiveFrame: 66,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 38, endFrame: 39, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 0, endFrame: 66, sequence: { $sequence: 'applyBuff_6' } },
    { startFrame: 0, endFrame: 40, sequence: { $sequence: 'applyBuff_7' } },
    { startFrame: 40, endFrame: 66, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const kayChr_0040_sweetpie_plunging_attack_endActionGraph = {
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
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            damageType: 'physical',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack', 'plungingAttack'],
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const kayChr_0040_sweetpie_plunging_attack_end: SkillDefinition = {
  actionGraph: kayChr_0040_sweetpie_plunging_attack_endActionGraph,
  key: 'chr_0040_sweetpie_plunging_attack_end',
  element: 'physical',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 16,
  naturalDurationFrames: 120,
  exclusiveFrame: 15,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_5' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const kayChr_0040_sweetpie_normal_skillActionGraph = {
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
            durationSeconds: { kind: 'constant', value: 0.1 },
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
          },
        },
        next: null,
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_4' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'ifElse_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0040_sweetpie_normal_skill_ishit' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: 'ifElse_7',
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_8',
      },
      dealDamage_10: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalSkill', 'canBreakWeakness'],
          },
        },
        next: 'applyBuff_9',
      },
      forEachContextTarget_11: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'targets' } },
          body: { $sequence: null },
        },
        next: 'dealDamage_10',
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0040_sweetpie_normal_skill_ishit' }],
            targets: { kind: 'inputTarget' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: null,
      },
      applyElementalInfliction_14: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'nature', isExtra: false, target: { kind: 'inputTarget' } },
        },
        next: 'applyBuff_13',
      },
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'applyElementalInfliction_14' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_23: {
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
      ifElse_25: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
          whenTrue: { $sequence: 'applyBuff_23' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_27: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'context', key: 'targets' },
            affectType: 'OnlyTarget',
            durationSeconds: { kind: 'constant', value: 0.4 },
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
          },
        },
        next: null,
      },
      finishBuffsById_37: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0040_sweetpie_weapon_recycle_buff'],
            reason: 'other',
          },
        },
        next: null,
      },
      ifElse_38: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'startTimeDilation_27' },
          whenFalse: { $sequence: null },
        },
        next: 'finishBuffsById_37',
      },
      ifElse_39: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'ifElse_25' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_38',
      },
      dealDamage_40: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'targets' },
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_8' },
            tags: ['normalSkill', 'canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_9' },
          },
        },
        next: 'ifElse_39',
      },
      calculateActionValue_41: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_fin',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_8' },
            right: { kind: 'valueNode', nodeId: 'data_10' },
          },
        },
        next: 'dealDamage_40',
      },
      calculateActionValue_42: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_fin',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_11' },
            right: { kind: 'valueNode', nodeId: 'data_12' },
          },
        },
        next: 'calculateActionValue_41',
      },
      modifyActionValue_35: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'buff_stack',
            operation: 'assign',
            value: { kind: 'constant', value: 3 },
          },
        },
        next: 'calculateActionValue_42',
      },
      applyBuff_36: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_fire_fire_burning_triggered',
                copiedBlackboardAssignments: { duration: 'duration_burning' },
              },
            ],
            targets: { kind: 'context', key: 'targets' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'modifyActionValue_35',
      },
      ifElse_43: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_14' },
          whenTrue: { $sequence: 'applyBuff_36' },
          whenFalse: { $sequence: 'calculateActionValue_42' },
        },
        next: null,
      },
      readBuffStackCount_44: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: { kind: 'source' },
            outputKey: 'buff_stack',
            query: { kind: 'id', buffIds: ['buff_chr_0040_sweetpie_weapon_recycle_buff'] },
          },
        },
        next: 'ifElse_43',
      },
      forEachContextTarget_45: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { targets: { kind: 'context', key: 'targets' } },
          body: { $sequence: 'ifElse_15' },
        },
        next: 'readBuffStackCount_44',
      },
      checkCondition_50: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_15' } },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_51: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'LeaveWeapon',
            tagFilters: [
              { queryType: 'hasAny', tags: ['Skill/Character/chr_0040_sweetpie/LeaveWeapon'] },
            ],
            owner: { kind: 'owner' },
          },
        },
        next: 'checkCondition_50',
      },
      jumpTimeline_53: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 44 },
          condition: { kind: 'conditionNode', nodeId: 'data_16' },
        },
        next: null,
      },
      ifElse_54: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_18' },
          whenTrue: { $sequence: 'jumpTimeline_53' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_57: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_19' },
          whenTrue: { $sequence: 'jumpTimeline_53' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_60: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_20' },
          whenTrue: { $sequence: 'jumpTimeline_53' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_62: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0040_sweetpie_combo_skill_atk_up',
                copiedBlackboardAssignments: {
                  atk_up: 'atk_up_fin',
                  duration: 'duration',
                  stack: 'stack',
                },
              },
            ],
            targets: { kind: 'characterTeam', excludeOwner: false },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      calculateActionValue_63: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_up_fin',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_21' },
            right: { kind: 'constant', value: 1 },
          },
        },
        next: 'applyBuff_62',
      },
      finishOwner_67: {
        action: {
          kind: 'finishOwner',
          parameters: { targets: { kind: 'context', key: 'LeaveWeapon' } },
        },
        next: null,
      },
      reachSkillOperableBoundary_115: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0040_sweetpie_normal_skill'] },
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_22' },
          whenTrue: { $sequence: 'finishOwner_67' },
          whenFalse: { $sequence: 'finishOwner_67' },
        },
        next: null,
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_23' },
          whenTrue: { $sequence: 'finishOwner_67' },
          whenFalse: { $sequence: 'ifElse_opt1' },
        },
        next: null,
      },
      ifElse_opt3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_25' },
          whenTrue: { $sequence: 'calculateActionValue_63' },
          whenFalse: { $sequence: null },
        },
        next: 'ifElse_opt2',
      },
      applyBuff_opt4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_recycle_buff' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'ifElse_opt3',
      },
      applyBuff_opt5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_count' }],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_opt4',
      },
      checkCondition_opt6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_26' } },
        },
        next: 'applyBuff_opt5',
      },
      findOwnerSpawnedAbilityEntities_opt7: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'LeaveWeapon',
            tagFilters: [
              { queryType: 'hasAny', tags: ['Skill/Character/chr_0040_sweetpie/LeaveWeapon'] },
            ],
            owner: { kind: 'owner' },
            maxTargets: 128,
          },
        },
        next: 'checkCondition_opt6',
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
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'targets' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_1' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'inputTarget' },
          compareZeroWhenTargetMissing: true,
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
          buffIds: ['buff_chr_0040_sweetpie_normal_skill_ishit'],
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'source' },
          compareZeroWhenTargetMissing: true,
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
          buffIds: ['buff_chr_0040_sweetpie_normal_skill_ishit'],
        },
      },
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_7: {
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
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_fin' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'buff_stack' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_per_weapon' } },
      data_13: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'buff_stack', fallback: 0 },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_13' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 3 },
        },
      },
      data_15: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'LeaveWeapon' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 0,
          outputKey: 'weapon_count',
        },
      },
      data_16: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_17: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'weapon_count', fallback: 0 },
      },
      data_18: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_17' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_19: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_17' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_20: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_17' },
          operator: 'lessOrEqual',
          right: { kind: 'constant', value: 2 },
        },
      },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
      data_22: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_23: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: { kind: 'context', key: 'LeaveWeapon' },
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/chr_0040_sweetpie/LeaveWeapon/Hammer'],
        },
      },
      data_24: { type: 'number', expression: { kind: 'blackboard', key: 'talent_1', fallback: 0 } },
      data_25: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_24' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_26: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'LeaveWeapon' },
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

export const kayChr_0040_sweetpie_normal_skill: SkillDefinition = {
  actionGraph: kayChr_0040_sweetpie_normal_skillActionGraph,
  key: 'chr_0040_sweetpie_normal_skill',
  element: 'nature',
  blackboard: {
    atk_scale: [1.07, 1.17, 1.28, 1.39, 1.49, 1.6, 1.71, 1.81, 1.92, 2.05, 2.21, 2.4],
    atk_scale_1: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_fin: 0,
    atk_scale_per_weapon: [0.44, 0.49, 0.53, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.92, 1],
    atk_up: 0,
    atk_up_fin: 0,
    buff_stack: 0,
    duration: 0,
    duration_burning: 5,
    poise: 10,
    stack: 0,
    talent_1: 0,
    weapon_count: 0,
  },
  timelineBlockFrames: 72,
  naturalDurationFrames: 159,
  exclusiveFrame: 71,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 6, endFrame: 9, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 48, endFrame: 50, sequence: { $sequence: 'findTargets_1' } },
    { startFrame: 6, endFrame: 9, sequence: { $sequence: 'forEachContextTarget_11' } },
    { startFrame: 48, endFrame: 50, sequence: { $sequence: 'forEachContextTarget_45' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_51' } },
    { startFrame: 32, endFrame: 33, sequence: { $sequence: 'ifElse_54' } },
    { startFrame: 35, endFrame: 36, sequence: { $sequence: 'ifElse_57' } },
    { startFrame: 42, endFrame: 43, sequence: { $sequence: 'ifElse_60' } },
    {
      startFrame: 3,
      endFrame: 18,
      sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_opt7' },
    },
    {
      startFrame: 9,
      endFrame: 24,
      sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_opt7' },
    },
    {
      startFrame: 15,
      endFrame: 30,
      sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_opt7' },
    },
    { startFrame: 50, endFrame: 71, sequence: { $sequence: 'reachSkillOperableBoundary_115' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
};

export const kayChr_0040_sweetpie_combo_skillActionGraph = {
  main: {
    nodes: {
      jumpTimeline_3: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 185 },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
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
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'jumpTimeline_3' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      jumpTimeline_5: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 414 },
          condition: { kind: 'conditionNode', nodeId: 'data_5' },
        },
        next: null,
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'jumpTimeline_5' },
          whenFalse: { $sequence: 'ifElse_6' },
        },
        next: null,
      },
      markCurrentSkillCanInterrupt_8: {
        action: { kind: 'markCurrentSkillCanInterrupt', parameters: {} },
        next: null,
      },
      jumpTimeline_9: {
        action: {
          kind: 'jumpTimeline',
          parameters: { destinationFrame: 504 },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
        },
        next: null,
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_delay_trigger_chr_0040_sweetpie_combo_skill_01' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            delayedTriggerInputKey: 'delay_trigger_input_target',
            passTargetGroupsToBuff: true,
          },
        },
        next: null,
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_delay_trigger_chr_0040_sweetpie_combo_skill_02' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            delayedTriggerInputKey: 'delay_trigger_input_target',
            passTargetGroupsToBuff: true,
          },
        },
        next: null,
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_delay_trigger_chr_0040_sweetpie_combo_skill_03' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            delayedTriggerInputKey: 'delay_trigger_input_target',
            passTargetGroupsToBuff: true,
          },
        },
        next: null,
      },
      startTimeDilation_16: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.6 },
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
            influenceSkillCooldownSeconds: { kind: 'constant', value: 0.25 },
          },
        },
        next: null,
      },
      saveTargetDistance_18: {
        action: {
          kind: 'saveTargetDistance',
          parameters: {
            source: { kind: 'context', key: 'mainchar' },
            target: { kind: 'owner' },
            outputKey: 'owner_mainchar_distance',
          },
        },
        next: null,
      },
      findCharacterTeamTargets_19: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: 'saveTargetDistance_18',
      },
      ifElse_20: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'findCharacterTeamTargets_19' },
        },
        next: null,
      },
      reachSkillOperableBoundary_31: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0040_sweetpie_normal_skill'] },
        },
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
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'context', key: 'smart_target' },
          distance: 6,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'context', key: 'smart_target' },
          distance: 4,
          lessThan: false,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_4: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_2' } },
      },
      data_5: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'context', key: 'smart_target' },
          distance: 4,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_7: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
      data_8: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const kayChr_0040_sweetpie_combo_skill: SkillDefinition = {
  actionGraph: kayChr_0040_sweetpie_combo_skillActionGraph,
  key: 'chr_0040_sweetpie_combo_skill',
  element: 'nature',
  blackboard: {
    atb: [10, 10, 10, 10, 10, 10, 10, 10, 11, 11, 11, 12],
    atk_scale: [0.31, 0.34, 0.37, 0.4, 0.44, 0.47, 0.5, 0.53, 0.56, 0.6, 0.65, 0.7],
    atk_up: 0.1,
    cam_angle: 0,
    cam_duration: 0,
    duration: 10,
    input_angle: 0,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    poise: 5,
    radius: 4,
    stack: 3,
    talent_1: 0,
    teleportdis: 0,
    usp: 5,
  },
  timelineBlockFrames: 34,
  naturalDurationFrames: 544,
  exclusiveFrame: 445,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'ifElse_7' } },
    { startFrame: 34, endFrame: 35, sequence: { $sequence: 'markCurrentSkillCanInterrupt_8' } },
    { startFrame: 184, endFrame: 185, sequence: { $sequence: 'jumpTimeline_9' } },
    { startFrame: 223, endFrame: 224, sequence: { $sequence: 'markCurrentSkillCanInterrupt_8' } },
    { startFrame: 413, endFrame: 414, sequence: { $sequence: 'jumpTimeline_9' } },
    { startFrame: 445, endFrame: 446, sequence: { $sequence: 'markCurrentSkillCanInterrupt_8' } },
    { startFrame: 9, endFrame: 16, sequence: { $sequence: 'applyBuff_13' } },
    { startFrame: 201, endFrame: 209, sequence: { $sequence: 'applyBuff_14' } },
    { startFrame: 427, endFrame: 436, sequence: { $sequence: 'applyBuff_15' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'startTimeDilation_16' } },
    { startFrame: 0, endFrame: 15, sequence: { $sequence: 'ifElse_20' } },
    { startFrame: 185, endFrame: 200, sequence: { $sequence: 'startTimeDilation_16' } },
    { startFrame: 185, endFrame: 200, sequence: { $sequence: 'ifElse_20' } },
    { startFrame: 414, endFrame: 429, sequence: { $sequence: 'startTimeDilation_16' } },
    { startFrame: 414, endFrame: 429, sequence: { $sequence: 'ifElse_20' } },
    { startFrame: 16, endFrame: 34, sequence: { $sequence: 'reachSkillOperableBoundary_31' } },
    { startFrame: 209, endFrame: 223, sequence: { $sequence: 'reachSkillOperableBoundary_31' } },
    { startFrame: 436, endFrame: 445, sequence: { $sequence: 'reachSkillOperableBoundary_31' } },
  ],
  defaultTarget: 'enemy',
  smartTarget: 'trigger',
  cooldownFrames: [210, 210, 210, 210, 210, 210, 210, 210, 210, 210, 210, 180],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
};

export const kayChr_0040_sweetpie_ultimate_skillActionGraph = {
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
      hideUi_2: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
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
            saveToContextKey: 'tar',
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
            targets: { kind: 'context', key: 'tar' },
            affectType: 'OnlyTarget',
            durationSeconds: { kind: 'constant', value: 0.8 },
            priority: 50,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.5,
                  inTangent: -1.500663,
                  outTangent: -1.500663,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.2074262,
                  value: 0.1887232,
                  inTangent: -0.8693887,
                  outTangent: -0.8693887,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0,
                  inTangent: -0.2381143,
                  outTangent: -0.2381143,
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
      ifElse_9: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_8' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      startTimeDilation_10: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'context', key: 'tar' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.1 },
            priority: 10,
            curve: { kind: 'named', key: 'common' },
          },
        },
        next: 'ifElse_9',
      },
      dealDamage_11: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['ultimateSkill', 'canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_10',
      },
      applyElementalInfliction_12: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: {
            element: 'nature',
            isExtra: false,
            target: { kind: 'context', key: 'tar' },
          },
        },
        next: 'dealDamage_11',
      },
      dealDamage_17: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['ultimateSkill', 'canBreakWeakness'],
          },
        },
        next: 'startTimeDilation_10',
      },
      startTimeDilation_18: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'hitStop',
            attacker: { kind: 'source' },
            targets: { kind: 'context', key: 'tar' },
            affectType: 'Both',
            durationSeconds: { kind: 'constant', value: 0.2 },
            priority: 10,
            curve: { kind: 'named', key: 'common' },
          },
        },
        next: null,
      },
      dealDamage_19: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            damageType: 'nature',
            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
            tags: ['ultimateSkill', 'canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'startTimeDilation_18',
      },
      changeResource_20: {
        action: {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_6' },
            coefficient: { kind: 'constant', value: 1 },
            source: { kind: 'source' },
            targets: { kind: 'source' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'dealDamage_19',
      },
      launchProjectile_21: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: { endFrame: 29, callbacks: [{ event: 'block', triggerFrames: [29] }] },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0040_sweetpie_ult_weapon_3_leave',
            faction: 'good',
            recycleDelaySeconds: 1,
            targets: { kind: 'context', contextKey: 'leavepoint3' },
            entityInitialValues: {},
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
                            bornAt: { kind: 'inputTarget' },
                            abilityEntityId: 'abilityentity_chr_0040_sweetpie_ult_weapon_3_leave',
                            childSkillId: 'chr_0040_sweetpie_ult_skill_weapon_leave_3_abilityrange',
                            source: { kind: 'source' },
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: true,
                          },
                        },
                        next: null,
                      },
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0040_sweetpie_ult_skill_leaveweapon_3_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb_food: 0, heal_base: 0, heal_sub_multi: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                ],
              },
            },
          ],
        },
        next: null,
      },
      launchProjectile_22: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: { endFrame: 29, callbacks: [{ event: 'block', triggerFrames: [29] }] },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0040_sweetpie_ult_weapon_2_leave',
            faction: 'good',
            recycleDelaySeconds: 1,
            targets: { kind: 'context', contextKey: 'leavepoint2' },
            entityInitialValues: {},
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
                            bornAt: { kind: 'inputTarget' },
                            abilityEntityId: 'abilityentity_chr_0040_sweetpie_ult_weapon_2_leave',
                            childSkillId: 'chr_0040_sweetpie_ult_skill_weapon_leave_2_abilityrange',
                            source: { kind: 'source' },
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: true,
                          },
                        },
                        next: null,
                      },
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0040_sweetpie_ult_skill_leaveweapon_2_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb_food: 0, heal_base: 0, heal_sub_multi: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                ],
              },
            },
          ],
        },
        next: 'launchProjectile_21',
      },
      launchProjectile_23: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: { endFrame: 29, callbacks: [{ event: 'block', triggerFrames: [29] }] },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0040_sweetpie_ult_weapon_leave',
            faction: 'good',
            recycleDelaySeconds: 1,
            targets: { kind: 'context', contextKey: 'leavepoint1' },
            entityInitialValues: {},
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
                            bornAt: { kind: 'inputTarget' },
                            abilityEntityId: 'abilityentity_chr_0040_sweetpie_ult_weapon_leave',
                            childSkillId: 'chr_0040_sweetpie_ult_skill_weapon_leave_abilityrange',
                            source: { kind: 'source' },
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: true,
                          },
                        },
                        next: null,
                      },
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0040_sweetpie_ult_skill_leaveweapon_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb_food: 0, heal_base: 0, heal_sub_multi: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                ],
              },
            },
          ],
        },
        next: 'launchProjectile_22',
      },
      pickContextTarget_24: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'leavepoint',
            saveToContextKey: 'leavepoint3',
            index: { kind: 'constant', value: 2 },
          },
        },
        next: 'launchProjectile_23',
      },
      pickContextTarget_25: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'leavepoint',
            saveToContextKey: 'leavepoint2',
            index: { kind: 'constant', value: 1 },
          },
        },
        next: 'pickContextTarget_24',
      },
      pickContextTarget_26: {
        action: {
          kind: 'pickContextTarget',
          parameters: {
            sourceContextKey: 'leavepoint',
            saveToContextKey: 'leavepoint1',
            index: { kind: 'constant', value: 0 },
          },
        },
        next: 'pickContextTarget_25',
      },
      createSpatialPointTargets_27: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: {
            saveToContextKey: 'leavepoint',
            count: { kind: 'constant', value: 3 },
            origin: { kind: 'context', key: 'fakepoint' },
          },
        },
        next: 'pickContextTarget_26',
      },
      createSpatialPointTargets_28: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: {
            saveToContextKey: 'fakepoint',
            count: { kind: 'constant', value: 1 },
            origin: { kind: 'source' },
          },
        },
        next: 'createSpatialPointTargets_27',
      },
      reachSkillOperableBoundary_29: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: {
            skillIds: ['chr_0040_sweetpie_combo_skill', 'chr_0040_sweetpie_normal_skill'],
          },
        },
        next: null,
      },
      applyBuff_30: {
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
      addEntityTags_31: {
        action: {
          kind: 'addEntityTags',
          parameters: {
            targets: { kind: 'owner' },
            tags: ['Status/Ability/Skill/CantSwitchTocCenter'],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'enemyRankIn', target: { kind: 'inputTarget' }, ranks: ['mob'] },
      },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const kayChr_0040_sweetpie_ultimate_skill: SkillDefinition = {
  actionGraph: kayChr_0040_sweetpie_ultimate_skillActionGraph,
  key: 'chr_0040_sweetpie_ultimate_skill',
  element: 'nature',
  blackboard: {
    atb: [24, 24, 24, 24, 24, 24, 24, 24, 27, 27, 27, 30],
    atb_food: 10,
    atk_scale: [0.71, 0.78, 0.85, 0.92, 1, 1.07, 1.14, 1.21, 1.28, 1.37, 1.48, 1.6],
    atk_scale_2: [0.89, 0.98, 1.07, 1.16, 1.24, 1.33, 1.42, 1.51, 1.6, 1.71, 1.84, 2],
    atk_scale_3: [1.07, 1.17, 1.28, 1.39, 1.49, 1.6, 1.71, 1.81, 1.92, 2.05, 2.21, 2.4],
    heal_base: [180, 216, 252, 288, 306, 324, 342, 360, 378, 387, 396, 405],
    heal_sub_multi: [0.42, 0.5, 0.59, 0.67, 0.71, 0.76, 0.8, 0.84, 0.88, 0.9, 0.92, 0.95],
    poise: 20,
  },
  timelineBlockFrames: 163,
  naturalDurationFrames: 419,
  exclusiveFrame: 162,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 74, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 74, sequence: { $sequence: 'hideUi_2' } },
    { startFrame: 0, endFrame: 74, sequence: { $sequence: 'startUltimateTimeDilation_3' } },
    { startFrame: 95, endFrame: 96, sequence: { $sequence: 'findTargets_4' } },
    { startFrame: 111, endFrame: 112, sequence: { $sequence: 'findTargets_4' } },
    { startFrame: 138, endFrame: 139, sequence: { $sequence: 'findTargets_4' } },
    { startFrame: 95, endFrame: 96, sequence: { $sequence: 'applyElementalInfliction_12' } },
    { startFrame: 111, endFrame: 112, sequence: { $sequence: 'dealDamage_17' } },
    { startFrame: 138, endFrame: 139, sequence: { $sequence: 'changeResource_20' } },
    { startFrame: 139, endFrame: 140, sequence: { $sequence: 'createSpatialPointTargets_28' } },
    { startFrame: 140, endFrame: 162, sequence: { $sequence: 'reachSkillOperableBoundary_29' } },
    { startFrame: 0, endFrame: 162, sequence: { $sequence: 'applyBuff_30' } },
    { startFrame: 0, endFrame: 140, sequence: { $sequence: 'addEntityTags_31' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 150 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const kayCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const kayCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: kayCommon_character_perfect_dodgeActionGraph,
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

export const kayChr_0040_sweetpie_plunging_attack_startActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const kayChr_0040_sweetpie_plunging_attack_start: SkillDefinition = {
  actionGraph: kayChr_0040_sweetpie_plunging_attack_startActionGraph,
  key: 'chr_0040_sweetpie_plunging_attack_start',
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

const kayPassive1ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: { endFrame: 29, callbacks: [{ event: 'block', triggerFrames: [29] }] },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0040_sweetpie_ult_weapon_2_leave',
            faction: 'good',
            recycleDelaySeconds: 1,
            targets: { kind: 'context', contextKey: 'leavepoint' },
            entityInitialValues: {},
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
                            bornAt: { kind: 'inputTarget' },
                            abilityEntityId: 'abilityentity_chr_0040_sweetpie_ult_weapon_2_leave',
                            childSkillId: 'chr_0040_sweetpie_ult_skill_weapon_leave_2_abilityrange',
                            source: { kind: 'source' },
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: true,
                          },
                        },
                        next: null,
                      },
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0040_sweetpie_ult_skill_leaveweapon_2_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atb_food: 0, heal_base: 0, heal_sub_multi: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                ],
              },
            },
          ],
        },
        next: null,
      },
      createSpatialPointTargets_2: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: {
            saveToContextKey: 'leavepoint',
            count: { kind: 'constant', value: 1 },
            origin: { kind: 'inputTarget' },
          },
        },
        next: 'launchProjectile_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'createSpatialPointTargets_2',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0040_sweetpie_passive_talent2_do'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayPassive1: OperatorPassiveSkillDefinition = {
  key: 'chr_0040_sweetpie_passive_talent2',
  levelSource: 'ultimate',
  blackboard: {
    atb_food: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
    heal_base: [180, 216, 252, 288, 306, 324, 342, 360, 378, 387, 396, 405],
    heal_sub_multi: [0.42, 0.5, 0.59, 0.67, 0.71, 0.76, 0.8, 0.84, 0.88, 0.9, 0.92, 0.95],
  },
  enableSequence: { $sequence: null },
  actionGraph: kayPassive1ActionGraph,
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_3' } },
  ],
};

const kayPassive2ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0040_sweetpie_normal_skill_ishit'],
            reason: 'other',
          },
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'finishBuffsById_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_count' }],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_count' }],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: false,
          },
        },
        next: 'applyBuff_3',
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_count' }],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: false,
          },
        },
        next: 'applyBuff_4',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['battleSkill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayPassive2: OperatorPassiveSkillDefinition = {
  key: 'chr_0040_sweetpie_passive_default',
  blackboard: {},
  enableSequence: { $sequence: 'applyBuff_5' },
  actionGraph: kayPassive2ActionGraph,
  abilityEventResponses: [
    { event: 'skillEnd', priority: 0, sequence: { $sequence: 'checkCondition_2' } },
  ],
};

const kayPassive3ActionGraph = {
  main: {
    nodes: {
      createTimedMarker_1: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'owner' },
            markerId: 'chr_0040_sweetpie_passive_talent2',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_1' },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0040_sweetpie_passive_talent2_do' }],
            targets: { kind: 'owner' },
            source: { kind: 'inputTarget' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'createTimedMarker_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'applyBuff_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_4',
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0040_sweetpie_passive_talent2' }],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: false,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'cd' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: { kind: 'owner' },
          returnTrueIfNotExists: true,
          markerId: 'chr_0040_sweetpie_passive_talent2',
        },
      },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'talent_2', fallback: 0 } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0040_sweetpie_passive_talent2_signal'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayPassive3: OperatorPassiveSkillDefinition = {
  key: 'chr_0040_sweetpie_passive_talent2_2',
  blackboard: { cd: [30, 20], talent_2: [1, 1] },
  enableSequence: { $sequence: 'applyBuff_6' },
  actionGraph: kayPassive3ActionGraph,
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'checkCondition_5' } },
  ],
};

const kayComboCondition1ActionGraph = {
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
          kind: 'buffIdStackCompare',
          target: { kind: 'source' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: [
            'buff_chr_0040_sweetpie_weapon_count',
            'buff_chr_0040_sweetpie_weapon_count_sub',
          ],
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'eventInflictionElementIn', elements: ['nature'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0040_sweetpie_combo_skill',
  event: 'beforeTakeInfliction',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_2' },
  actionGraph: kayComboCondition1ActionGraph,
};

const kayComboCondition2ActionGraph = {
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
          kind: 'buffIdStackCompare',
          target: { kind: 'source' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: [
            'buff_chr_0040_sweetpie_weapon_count',
            'buff_chr_0040_sweetpie_weapon_count_sub',
          ],
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'targetObjectTypeMatch',
          target: { kind: 'context', key: 'trigger' },
          objectTypes: ['enemy'],
        },
      },
      data_3: {
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

const kayComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0040_sweetpie_combo_skill',
  event: 'takeDamage',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'checkCondition_3' },
  actionGraph: kayComboCondition2ActionGraph,
};

const kayBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayBuff1: SkillBuffDefinition = {
  stackingType: 'highPriorityWithMaxStack',
  priority: { blackboardKey: 'atk_up' },
  maxStackCount: { blackboardKey: 'stack' },
  durationSeconds: { blackboardKey: 'duration' },
  timeClock: 'global',
  presentation: {
    icon: 'endaxis:icons/icon_battle_spell_up',
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0, duration: 10, stack: 3 },
  attributeModifiers: [
    { attribute: 'natureDamageIncrease', slot: 'baseAddition', value: { blackboardKey: 'atk_up' } },
    { attribute: 'natureDamageIncrease', slot: 'baseAddition', value: { blackboardKey: 'atk_up' } },
    { attribute: 'cryoDamageIncrease', slot: 'baseAddition', value: { blackboardKey: 'atk_up' } },
    { attribute: 'heatDamageIncrease', slot: 'baseAddition', value: { blackboardKey: 'atk_up' } },
    {
      attribute: 'electricDamageIncrease',
      slot: 'baseAddition',
      value: { blackboardKey: 'atk_up' },
    },
  ],
  actionGraph: kayBuff1ActionGraph,
};

const kayBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayBuff2: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 1,
  maxStackCount: { blackboardKey: 'max_stack' },
  durationSeconds: 2,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: kayBuff2ActionGraph,
};

const kayBuff3ActionGraph = {
  main: {
    nodes: {
      aura_1: {
        action: {
          kind: 'aura',
          parameters: {
            targets: {
              kind: 'exclude',
              targets: { kind: 'enemyByTags', tagQueryType: 'hasAll', tags: [], scope: 'global' },
              excludeTargets: { kind: 'owner' },
            },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            buffs: [{ buffId: 'buff_chr_0040_sweetpie_passive_talent2_fx' }],
          },
          onEnter: { $sequence: null },
          onExit: { $sequence: null },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayBuff3: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'aura_1' }] },
  actionGraph: kayBuff3ActionGraph,
};

const kayBuff4ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayBuff4: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 99,
  durationSeconds: 0.1,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: kayBuff4ActionGraph,
};

const kayBuff5ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0040_sweetpie_passive_talent2_signal' }],
            targets: { kind: 'source' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayBuff5: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'poiseZero', priority: 0, sequence: { $sequence: 'applyBuff_1' } },
    { event: 'poiseKnotBreak', priority: 0, sequence: { $sequence: 'applyBuff_1' } },
  ],
  actionGraph: kayBuff5ActionGraph,
};

const kayBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayBuff6: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 99,
  durationSeconds: 0.1,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: kayBuff6ActionGraph,
};

const kayBuff7ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_recycle_buff' }],
            targets: { kind: 'source' },
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

const kayBuff7: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 3,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'enterFight', priority: 0, sequence: { $sequence: 'applyBuff_1' } },
  ],
  actionGraph: kayBuff7ActionGraph,
};

const kayBuff8ActionGraph = {
  main: {
    nodes: {
      setCharacterPassiveUiValue_1: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: { kind: 'owner' }, value: { kind: 'constant', value: 1 } },
        },
        next: null,
      },
      setCharacterPassiveUiValue_2: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: { kind: 'owner' }, value: { kind: 'valueNode', nodeId: 'data_1' } },
        },
        next: null,
      },
      readBuffStackCount_3: {
        action: {
          kind: 'readBuffStackCount',
          parameters: {
            target: { kind: 'owner' },
            outputKey: 'stack_num',
            query: { kind: 'environment' },
          },
        },
        next: 'setCharacterPassiveUiValue_2',
      },
      setCharacterPassiveUiValue_4: {
        action: {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target: { kind: 'owner' }, value: { kind: 'constant', value: 0 } },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'stack_num' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayBuff8: SkillBuffDefinition = {
  stackingType: 'enhance',
  priority: 0,
  maxStackCount: 3,
  applyTags: [],
  extendTags: [],
  blackboard: { stack_num: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'setCharacterPassiveUiValue_1' }],
    enhanceChanged: [{ $sequence: 'readBuffStackCount_3' }],
    finish: [{ $sequence: 'setCharacterPassiveUiValue_4' }],
  },
  actionGraph: kayBuff8ActionGraph,
};

const kayBuff9ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayBuff9: SkillBuffDefinition = {
  stackingType: 'enhance',
  priority: 0,
  maxStackCount: 3,
  presentation: { visible: true, showInHeadBarCommon: false, showInHeadBarAttached: false },
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: kayBuff9ActionGraph,
};

const kayBuff10ActionGraphCallback1 = {
  actionGraph: {
    main: {
      nodes: {
        finishBuffsById_16: {
          action: {
            kind: 'finishBuffsById',
            parameters: {
              targets: { kind: 'source' },
              finishSource: { kind: 'source' },
              buffIds: ['buff_chr_0040_sweetpie_weapon_count'],
              reason: 'other',
              count: { kind: 'constant', value: 1 },
            },
          },
          next: null,
        },
        launchProjectile_17: {
          action: {
            kind: 'launchProjectile',
            parameters: {
              schedule: { endFrame: 24, callbacks: [{ event: 'block', triggerFrames: [24] }] },
              inheritActionBlackboard: true,
              projectileId: 'projectile_chr_0040_sweetpie_combo_weapon_leave',
              faction: 'good',
              recycleDelaySeconds: 1,
              targets: { kind: 'context', contextKey: 'leavepoint' },
              entityInitialValues: {},
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
                              bornAt: { kind: 'inputTarget' },
                              abilityEntityId: 'abilityentity_chr_0040_sweetpie_weapon_leave',
                              childSkillId:
                                'chr_0040_sweetpie_combo_skill_weapon_leave_abilityrange',
                              source: { kind: 'source' },
                              inheritActionBlackboard: true,
                              dieWhenSourceDies: true,
                            },
                          },
                          next: null,
                        },
                      },
                    },
                    macros: {},
                  },
                  skillId: 'chr_0040_sweetpie_combo_skill_leaveweapon_projhit',
                  nativeSkillType: 'normalSkill',
                  naturalDurationFrames: 30,
                  castResource: {
                    costFrame: 0,
                    cooldownSeconds: 0,
                    maxChargeTime: 1,
                    cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                  },
                  blackboard: { atk_up: 0, duration: 0, stack: 3, talent_1: 0 },
                  scheduledSequences: [
                    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'spawnAbilityEntity_1' } },
                  ],
                },
              },
            ],
          },
          next: 'finishBuffsById_16',
        },
        createSpatialPointTargets_18: {
          action: {
            kind: 'createSpatialPointTargets',
            parameters: {
              saveToContextKey: 'leavepoint',
              count: { kind: 'constant', value: 1 },
              origin: { kind: 'context', key: 'fakepoint' },
            },
          },
          next: 'launchProjectile_17',
        },
        createSpatialPointTargets_19: {
          action: {
            kind: 'createSpatialPointTargets',
            parameters: {
              saveToContextKey: 'fakepoint',
              count: { kind: 'constant', value: 1 },
              origin: { kind: 'source' },
            },
          },
          next: 'createSpatialPointTargets_18',
        },
        once_4: {
          action: { kind: 'once', parameters: {}, body: { $sequence: 'launchProjectile_17' } },
          next: null,
        },
        ifElse_7: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: { kind: 'conditionNode', nodeId: 'data_1' },
            whenTrue: { $sequence: 'once_4' },
            whenFalse: { $sequence: null },
          },
          next: null,
        },
        finishBuffsById_6: {
          action: {
            kind: 'finishBuffsById',
            parameters: {
              targets: { kind: 'source' },
              finishSource: { kind: 'source' },
              buffIds: ['buff_chr_0040_sweetpie_weapon_count_sub'],
              reason: 'other',
              count: { kind: 'constant', value: 1 },
            },
          },
          next: null,
        },
        ifElse_9: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: { kind: 'conditionNode', nodeId: 'data_2' },
            whenTrue: { $sequence: 'finishBuffsById_6' },
            whenFalse: { $sequence: 'ifElse_7' },
          },
          next: null,
        },
        changeResource_10: {
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
          next: 'ifElse_9',
        },
        createSpatialPointTargets_11: {
          action: {
            kind: 'createSpatialPointTargets',
            parameters: {
              saveToContextKey: 'leavepoint',
              count: { kind: 'constant', value: 1 },
              origin: { kind: 'inputTarget' },
            },
          },
          next: 'changeResource_10',
        },
        startTimeDilation_12: {
          action: {
            kind: 'startTimeDilation',
            parameters: {
              scope: 'hitStop',
              attacker: { kind: 'source' },
              targets: { kind: 'inputTarget' },
              affectType: 'Both',
              durationSeconds: { kind: 'constant', value: 0.15 },
              priority: 10,
              curve: { kind: 'named', key: 'common' },
            },
          },
          next: 'createSpatialPointTargets_11',
        },
        dealDamage_13: {
          action: {
            kind: 'dealDamage',
            parameters: {
              attacker: 'actionSource',
              target: { kind: 'inputTarget' },
              damageType: 'nature',
              attackScale: { kind: 'valueNode', nodeId: 'data_4' },
              tags: ['canBreakWeakness', 'comboSkill'],
              stagger: { kind: 'valueNode', nodeId: 'data_5' },
            },
          },
          next: 'startTimeDilation_12',
        },
        changeResource_14: {
          action: {
            kind: 'changeResource',
            parameters: {
              resource: 'sp',
              amount: { kind: 'valueNode', nodeId: 'data_6' },
              coefficient: { kind: 'constant', value: 1 },
              source: { kind: 'source' },
              targets: { kind: 'source' },
              spGainKind: 'gain',
              spGainSource: 'skill',
            },
          },
          next: 'dealDamage_13',
        },
        applyBuff_15: {
          action: {
            kind: 'applyBuff',
            parameters: {
              buffs: [{ buffId: 'buff_common_natural_natural_triggered' }],
              targets: { kind: 'inputTarget' },
              source: { kind: 'source' },
              inheritSourceSkillCastInfo: true,
            },
          },
          next: 'changeResource_14',
        },
        ifElse_20: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: { kind: 'conditionNode', nodeId: 'data_7' },
            whenTrue: { $sequence: 'applyBuff_15' },
            whenFalse: { $sequence: 'createSpatialPointTargets_19' },
          },
          next: null,
        },
      },
      dataNodes: {
        data_1: {
          type: 'boolean',
          expression: {
            kind: 'buffIdStackCompare',
            target: { kind: 'source' },
            compareZeroWhenTargetMissing: true,
            operator: 'greaterOrEqual',
            value: { kind: 'constant', value: 1 },
            buffIds: ['buff_chr_0040_sweetpie_weapon_count'],
          },
        },
        data_2: {
          type: 'boolean',
          expression: {
            kind: 'buffIdStackCompare',
            target: { kind: 'source' },
            compareZeroWhenTargetMissing: true,
            operator: 'greaterOrEqual',
            value: { kind: 'constant', value: 1 },
            buffIds: ['buff_chr_0040_sweetpie_weapon_count_sub'],
          },
        },
        data_3: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
        data_4: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
        data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
        data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
        data_7: {
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
      },
    },
    macros: {},
  },
  skillId: 'chr_0040_sweetpie_combo_skill_projhit',
  nativeSkillType: 'normalSkill',
  naturalDurationFrames: 30,
  castResource: {
    costFrame: 0,
    cooldownSeconds: 0,
    maxChargeTime: 1,
    cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
  },
  blackboard: {
    atb: 0,
    atk_scale: 0,
    atk_up: 0,
    duration: 0,
    poise: 0,
    stack: 3,
    talent_1: 0,
    usp: 0,
  },
  scheduledSequences: [{ startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_20' } }],
} as const;

const kayBuff10ActionGraph = {
  main: {
    nodes: {
      launchProjectile_6: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: {
              endFrame: 13,
              callbacks: [{ event: 'hit', triggerFrames: [], hitKind: 'collision' }],
            },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0040_sweetpie_combo_weapon',
            faction: 'good',
            recycleDelaySeconds: 1,
            entityInitialValues: {},
            hit: {},
          },
          callbacks: [{ event: 'hit', skill: kayBuff10ActionGraphCallback1 }],
        },
        next: null,
      },
      launchProjectile_3: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: {
              endFrame: 13,
              callbacks: [{ event: 'hit', triggerFrames: [13], hitKind: 'collision' }],
            },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0040_sweetpie_combo_weapon',
            faction: 'good',
            recycleDelaySeconds: 1,
            targets: { kind: 'context', contextKey: 'smart_target' },
            entityInitialValues: {},
            hit: {},
          },
          callbacks: [{ event: 'hit', skill: kayBuff10ActionGraphCallback1 }],
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'launchProjectile_3' },
          whenFalse: { $sequence: 'launchProjectile_3' },
        },
        next: null,
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'ifElse_opt1' },
          whenFalse: { $sequence: 'launchProjectile_6' },
        },
        next: null,
      },
      checkCondition_opt3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'ifElse_opt2',
      },
      once_opt4: {
        action: {
          kind: 'once',
          parameters: { delayedTriggerInputKey: 'delay_trigger_input_target' },
          body: { $sequence: 'checkCondition_opt3' },
        },
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
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'smart_target' },
          containsHittableTarget: false,
          excludeDeadEntity: false,
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: { kind: 'owner' },
          tagQueryType: 'exceptAny',
          tags: [
            'Status/Immobilized',
            'Status/InCommonInteraction',
            'GameplayState/Interacting/BambooRaft/OnBoat',
            'Status/Ability/Skill/CantCastAnySkill',
            'GameplayState/Interacting/Bomb/Create',
            'Status/InCommonInteractionCanMove',
            'Status/Silence',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayBuff10: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  ignoreTagImmune: true,
  durationSeconds: 0.266666681,
  triggerIntervalSeconds: 0.233333334,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  timeClock: 'global',
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { trigger: [{ $sequence: 'once_opt4' }] },
  actionGraph: kayBuff10ActionGraph,
};

const kayBuff11ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: {
              endFrame: 8,
              callbacks: [{ event: 'hit', triggerFrames: [8], hitKind: 'collision' }],
            },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0040_sweetpie_combo_weapon_2',
            faction: 'good',
            recycleDelaySeconds: 1,
            targets: { kind: 'context', contextKey: 'smart_target' },
            entityInitialValues: {},
            hit: {},
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                actionGraph: {
                  main: {
                    nodes: {
                      finishBuffsById_16: {
                        action: {
                          kind: 'finishBuffsById',
                          parameters: {
                            targets: { kind: 'source' },
                            finishSource: { kind: 'source' },
                            buffIds: ['buff_chr_0040_sweetpie_weapon_count'],
                            reason: 'other',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: null,
                      },
                      launchProjectile_17: {
                        action: {
                          kind: 'launchProjectile',
                          parameters: {
                            schedule: {
                              endFrame: 24,
                              callbacks: [{ event: 'block', triggerFrames: [24] }],
                            },
                            inheritActionBlackboard: true,
                            projectileId: 'projectile_chr_0040_sweetpie_combo_weapon_2_leave',
                            faction: 'good',
                            recycleDelaySeconds: 1,
                            targets: { kind: 'context', contextKey: 'leavepoint' },
                            entityInitialValues: {},
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
                                            bornAt: { kind: 'inputTarget' },
                                            abilityEntityId:
                                              'abilityentity_chr_0040_sweetpie_weapon_2_leave',
                                            childSkillId:
                                              'chr_0040_sweetpie_combo_skill_weapon_leave_2_abilityrange',
                                            source: { kind: 'source' },
                                            inheritActionBlackboard: true,
                                            dieWhenSourceDies: true,
                                          },
                                        },
                                        next: null,
                                      },
                                    },
                                  },
                                  macros: {},
                                },
                                skillId: 'chr_0040_sweetpie_combo_skill_leaveweapon_2_projhit',
                                nativeSkillType: 'normalSkill',
                                naturalDurationFrames: 30,
                                castResource: {
                                  costFrame: 0,
                                  cooldownSeconds: 0,
                                  maxChargeTime: 1,
                                  cost: {
                                    resource: 'ultimateEnergy',
                                    value: 0,
                                    availabilityThreshold: 0,
                                  },
                                },
                                blackboard: { atk_up: 0, duration: 0, stack: 3, talent_1: 0 },
                                scheduledSequences: [
                                  {
                                    startFrame: 0,
                                    endFrame: 1,
                                    sequence: { $sequence: 'spawnAbilityEntity_1' },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        next: 'finishBuffsById_16',
                      },
                      createSpatialPointTargets_18: {
                        action: {
                          kind: 'createSpatialPointTargets',
                          parameters: {
                            saveToContextKey: 'leavepoint',
                            count: { kind: 'constant', value: 1 },
                            origin: { kind: 'context', key: 'fakepoint' },
                          },
                        },
                        next: 'launchProjectile_17',
                      },
                      createSpatialPointTargets_19: {
                        action: {
                          kind: 'createSpatialPointTargets',
                          parameters: {
                            saveToContextKey: 'fakepoint',
                            count: { kind: 'constant', value: 1 },
                            origin: { kind: 'source' },
                          },
                        },
                        next: 'createSpatialPointTargets_18',
                      },
                      once_4: {
                        action: {
                          kind: 'once',
                          parameters: {},
                          body: { $sequence: 'launchProjectile_17' },
                        },
                        next: null,
                      },
                      ifElse_7: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_1' },
                          whenTrue: { $sequence: 'once_4' },
                          whenFalse: { $sequence: null },
                        },
                        next: null,
                      },
                      finishBuffsById_6: {
                        action: {
                          kind: 'finishBuffsById',
                          parameters: {
                            targets: { kind: 'source' },
                            finishSource: { kind: 'source' },
                            buffIds: ['buff_chr_0040_sweetpie_weapon_count_sub'],
                            reason: 'other',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: null,
                      },
                      ifElse_9: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_2' },
                          whenTrue: { $sequence: 'finishBuffsById_6' },
                          whenFalse: { $sequence: 'ifElse_7' },
                        },
                        next: null,
                      },
                      changeResource_10: {
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
                        next: 'ifElse_9',
                      },
                      createSpatialPointTargets_11: {
                        action: {
                          kind: 'createSpatialPointTargets',
                          parameters: {
                            saveToContextKey: 'leavepoint',
                            count: { kind: 'constant', value: 1 },
                            origin: { kind: 'inputTarget' },
                          },
                        },
                        next: 'changeResource_10',
                      },
                      startTimeDilation_12: {
                        action: {
                          kind: 'startTimeDilation',
                          parameters: {
                            scope: 'hitStop',
                            attacker: { kind: 'source' },
                            targets: { kind: 'inputTarget' },
                            affectType: 'Both',
                            durationSeconds: { kind: 'constant', value: 0.15 },
                            priority: 10,
                            curve: { kind: 'named', key: 'common' },
                          },
                        },
                        next: 'createSpatialPointTargets_11',
                      },
                      dealDamage_13: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            attacker: 'actionSource',
                            target: { kind: 'inputTarget' },
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                            tags: ['canBreakWeakness', 'comboSkill'],
                            stagger: { kind: 'valueNode', nodeId: 'data_5' },
                          },
                        },
                        next: 'startTimeDilation_12',
                      },
                      changeResource_14: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_6' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            spGainKind: 'gain',
                            spGainSource: 'skill',
                          },
                        },
                        next: 'dealDamage_13',
                      },
                      applyBuff_15: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [{ buffId: 'buff_common_natural_natural_triggered' }],
                            targets: { kind: 'inputTarget' },
                            source: { kind: 'source' },
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'changeResource_14',
                      },
                      ifElse_20: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_7' },
                          whenTrue: { $sequence: 'applyBuff_15' },
                          whenFalse: { $sequence: 'createSpatialPointTargets_19' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: { kind: 'source' },
                          compareZeroWhenTargetMissing: true,
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                          buffIds: ['buff_chr_0040_sweetpie_weapon_count'],
                        },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: { kind: 'source' },
                          compareZeroWhenTargetMissing: true,
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                          buffIds: ['buff_chr_0040_sweetpie_weapon_count_sub'],
                        },
                      },
                      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_7: {
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
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0040_sweetpie_combo_skill_projhit_2',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale: 0,
                  atk_up: 0,
                  duration: 0,
                  poise: 0,
                  stack: 3,
                  talent_1: 0,
                  usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_20' } },
                ],
              },
            },
          ],
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'launchProjectile_1',
      },
      once_3: {
        action: {
          kind: 'once',
          parameters: { delayedTriggerInputKey: 'delay_trigger_input_target' },
          body: { $sequence: 'checkCondition_2' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: { kind: 'owner' },
          tagQueryType: 'exceptAny',
          tags: [
            'Status/Immobilized',
            'Status/InCommonInteraction',
            'GameplayState/Interacting/BambooRaft/OnBoat',
            'Status/Ability/Skill/CantCastAnySkill',
            'GameplayState/Interacting/Bomb/Create',
            'Status/InCommonInteractionCanMove',
            'Status/Silence',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayBuff11: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  ignoreTagImmune: true,
  durationSeconds: 0.3,
  triggerIntervalSeconds: 0.266666681,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  timeClock: 'global',
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { trigger: [{ $sequence: 'once_3' }] },
  actionGraph: kayBuff11ActionGraph,
};

const kayBuff12ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            schedule: {
              endFrame: 3,
              callbacks: [{ event: 'hit', triggerFrames: [3], hitKind: 'collision' }],
            },
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0040_sweetpie_combo_weapon_3',
            faction: 'good',
            recycleDelaySeconds: 1,
            targets: { kind: 'context', contextKey: 'smart_target' },
            entityInitialValues: {},
            hit: {},
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                actionGraph: {
                  main: {
                    nodes: {
                      finishBuffsById_16: {
                        action: {
                          kind: 'finishBuffsById',
                          parameters: {
                            targets: { kind: 'source' },
                            finishSource: { kind: 'source' },
                            buffIds: ['buff_chr_0040_sweetpie_weapon_count'],
                            reason: 'other',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: null,
                      },
                      launchProjectile_17: {
                        action: {
                          kind: 'launchProjectile',
                          parameters: {
                            schedule: {
                              endFrame: 24,
                              callbacks: [{ event: 'block', triggerFrames: [24] }],
                            },
                            inheritActionBlackboard: true,
                            projectileId: 'projectile_chr_0040_sweetpie_combo_weapon_3_leave',
                            faction: 'good',
                            recycleDelaySeconds: 1,
                            targets: { kind: 'context', contextKey: 'leavepoint' },
                            entityInitialValues: {},
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
                                            bornAt: { kind: 'inputTarget' },
                                            abilityEntityId:
                                              'abilityentity_chr_0040_sweetpie_weapon_3_leave',
                                            childSkillId:
                                              'chr_0040_sweetpie_combo_skill_weapon_leave_3_abilityrange',
                                            source: { kind: 'source' },
                                            inheritActionBlackboard: true,
                                            dieWhenSourceDies: true,
                                          },
                                        },
                                        next: null,
                                      },
                                    },
                                  },
                                  macros: {},
                                },
                                skillId: 'chr_0040_sweetpie_combo_skill_leaveweapon_3_projhit',
                                nativeSkillType: 'normalSkill',
                                naturalDurationFrames: 30,
                                castResource: {
                                  costFrame: 0,
                                  cooldownSeconds: 0,
                                  maxChargeTime: 1,
                                  cost: {
                                    resource: 'ultimateEnergy',
                                    value: 0,
                                    availabilityThreshold: 0,
                                  },
                                },
                                blackboard: { atk_up: 0, duration: 0, stack: 3, talent_1: 0 },
                                scheduledSequences: [
                                  {
                                    startFrame: 0,
                                    endFrame: 1,
                                    sequence: { $sequence: 'spawnAbilityEntity_1' },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                        next: 'finishBuffsById_16',
                      },
                      createSpatialPointTargets_18: {
                        action: {
                          kind: 'createSpatialPointTargets',
                          parameters: {
                            saveToContextKey: 'leavepoint',
                            count: { kind: 'constant', value: 1 },
                            origin: { kind: 'context', key: 'fakepoint' },
                          },
                        },
                        next: 'launchProjectile_17',
                      },
                      createSpatialPointTargets_19: {
                        action: {
                          kind: 'createSpatialPointTargets',
                          parameters: {
                            saveToContextKey: 'fakepoint',
                            count: { kind: 'constant', value: 1 },
                            origin: { kind: 'source' },
                          },
                        },
                        next: 'createSpatialPointTargets_18',
                      },
                      once_4: {
                        action: {
                          kind: 'once',
                          parameters: {},
                          body: { $sequence: 'launchProjectile_17' },
                        },
                        next: null,
                      },
                      ifElse_7: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_1' },
                          whenTrue: { $sequence: 'once_4' },
                          whenFalse: { $sequence: null },
                        },
                        next: null,
                      },
                      finishBuffsById_6: {
                        action: {
                          kind: 'finishBuffsById',
                          parameters: {
                            targets: { kind: 'source' },
                            finishSource: { kind: 'source' },
                            buffIds: ['buff_chr_0040_sweetpie_weapon_count_sub'],
                            reason: 'other',
                            count: { kind: 'constant', value: 1 },
                          },
                        },
                        next: null,
                      },
                      ifElse_9: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_2' },
                          whenTrue: { $sequence: 'finishBuffsById_6' },
                          whenFalse: { $sequence: 'ifElse_7' },
                        },
                        next: null,
                      },
                      changeResource_10: {
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
                        next: 'ifElse_9',
                      },
                      createSpatialPointTargets_11: {
                        action: {
                          kind: 'createSpatialPointTargets',
                          parameters: {
                            saveToContextKey: 'leavepoint',
                            count: { kind: 'constant', value: 1 },
                            origin: { kind: 'inputTarget' },
                          },
                        },
                        next: 'changeResource_10',
                      },
                      startTimeDilation_12: {
                        action: {
                          kind: 'startTimeDilation',
                          parameters: {
                            scope: 'hitStop',
                            attacker: { kind: 'source' },
                            targets: { kind: 'inputTarget' },
                            affectType: 'Both',
                            durationSeconds: { kind: 'constant', value: 0.15 },
                            priority: 10,
                            curve: { kind: 'named', key: 'common' },
                          },
                        },
                        next: 'createSpatialPointTargets_11',
                      },
                      dealDamage_13: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            attacker: 'actionSource',
                            target: { kind: 'inputTarget' },
                            damageType: 'nature',
                            attackScale: { kind: 'valueNode', nodeId: 'data_4' },
                            tags: ['canBreakWeakness', 'comboSkill'],
                            stagger: { kind: 'valueNode', nodeId: 'data_5' },
                          },
                        },
                        next: 'startTimeDilation_12',
                      },
                      changeResource_14: {
                        action: {
                          kind: 'changeResource',
                          parameters: {
                            resource: 'sp',
                            amount: { kind: 'valueNode', nodeId: 'data_6' },
                            coefficient: { kind: 'constant', value: 1 },
                            source: { kind: 'source' },
                            targets: { kind: 'source' },
                            spGainKind: 'gain',
                            spGainSource: 'skill',
                          },
                        },
                        next: 'dealDamage_13',
                      },
                      applyBuff_15: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffs: [{ buffId: 'buff_common_natural_natural_triggered' }],
                            targets: { kind: 'inputTarget' },
                            source: { kind: 'source' },
                            inheritSourceSkillCastInfo: true,
                          },
                        },
                        next: 'changeResource_14',
                      },
                      ifElse_20: {
                        action: {
                          kind: 'ifElse',
                          parameters: { alwaysNext: true },
                          condition: { kind: 'conditionNode', nodeId: 'data_7' },
                          whenTrue: { $sequence: 'applyBuff_15' },
                          whenFalse: { $sequence: 'createSpatialPointTargets_19' },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: { kind: 'source' },
                          compareZeroWhenTargetMissing: true,
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                          buffIds: ['buff_chr_0040_sweetpie_weapon_count'],
                        },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: { kind: 'source' },
                          compareZeroWhenTargetMissing: true,
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                          buffIds: ['buff_chr_0040_sweetpie_weapon_count_sub'],
                        },
                      },
                      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
                      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
                      data_7: {
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
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0040_sweetpie_combo_skill_projhit_3',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 30,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atb: 0,
                  atk_scale: 0,
                  atk_up: 0,
                  duration: 0,
                  poise: 0,
                  stack: 3,
                  talent_1: 0,
                  usp: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_20' } },
                ],
              },
            },
          ],
        },
        next: null,
      },
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'launchProjectile_1',
      },
      once_3: {
        action: {
          kind: 'once',
          parameters: { delayedTriggerInputKey: 'delay_trigger_input_target' },
          body: { $sequence: 'checkCondition_2' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'entityTagMatch',
          target: { kind: 'owner' },
          tagQueryType: 'exceptAny',
          tags: [
            'Status/Immobilized',
            'Status/InCommonInteraction',
            'GameplayState/Interacting/BambooRaft/OnBoat',
            'Status/Ability/Skill/CantCastAnySkill',
            'GameplayState/Interacting/Bomb/Create',
            'Status/InCommonInteractionCanMove',
            'Status/Silence',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const kayBuff12: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 0,
  ignoreTagImmune: true,
  durationSeconds: 0.333333343,
  triggerIntervalSeconds: 0.3,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  timeClock: 'global',
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { trigger: [{ $sequence: 'once_3' }] },
  actionGraph: kayBuff12ActionGraph,
};

export const kay: OperatorDefinition = {
  slug: 'kay',
  gameId: 'KAY',
  rarity: 6,
  weaponType: 'lance',
  element: 'nature',
  characterTypeId: 'Natural',
  role: 'vanguard',
  mainAttribute: 'strength',
  secondaryAttribute: 'agility',
  attributes: {
    strength: [
      22.2680412371134, 54.2158636650538, 87.8451504313068, 121.47443719756, 155.103723963813,
      171.918367346939,
    ],
    agility: [
      14.9690721649484, 37.7115085209342, 61.6509152114455, 85.5903219019569, 109.529728592468,
      121.499431937724,
    ],
    intellect: [
      9.27835051546395, 26.4754891647381, 44.5777403745003, 62.6799915842626, 80.7822427940248,
      89.8333683989059,
    ],
    will: [
      11.3402061855671, 29.432779297286, 48.4775930990953, 67.5224069009047, 86.5672207027141,
      96.0896276036188,
    ],
    baseAttack: [30, 91, 156, 221, 285, 318],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skills: [
    kayChr_0040_sweetpie_attack1,
    kayChr_0040_sweetpie_attack2,
    kayChr_0040_sweetpie_attack3,
    kayChr_0040_sweetpie_attack4,
    kayChr_0040_sweetpie_attack5,
    kayChr_0040_sweetpie_power_attack,
    kayChr_0040_sweetpie_plunging_attack_end,
    kayChr_0040_sweetpie_normal_skill,
    kayChr_0040_sweetpie_combo_skill,
    kayChr_0040_sweetpie_ultimate_skill,
    kayCommon_character_perfect_dodge,
    kayChr_0040_sweetpie_plunging_attack_start,
  ],
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skillIds: [
        'chr_0040_sweetpie_attack1',
        'chr_0040_sweetpie_attack2',
        'chr_0040_sweetpie_attack3',
        'chr_0040_sweetpie_attack4',
        'chr_0040_sweetpie_attack5',
      ],
    },
    { key: 'finisher', operationType: 'finisher', skillIds: ['chr_0040_sweetpie_power_attack'] },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skillIds: ['chr_0040_sweetpie_plunging_attack_end'],
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skillIds: ['chr_0040_sweetpie_normal_skill'],
    },
    { key: 'comboSkill', operationType: 'comboSkill', skillIds: ['chr_0040_sweetpie_combo_skill'] },
    { key: 'ultimate', operationType: 'ultimate', skillIds: ['chr_0040_sweetpie_ultimate_skill'] },
  ],
  dodgeSkillId: 'common_character_perfect_dodge',
  plungingAttack: {
    startSkillId: 'chr_0040_sweetpie_plunging_attack_start',
    endSkillId: 'chr_0040_sweetpie_plunging_attack_end',
    startDurationSeconds: 0.633,
    endDurationSeconds: 4.333,
  },
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0040_sweetpie_normal_skill',
      replacementSkillKeys: [],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0040_sweetpie_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0040_sweetpie_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0040_sweetpie_attack1',
        'chr_0040_sweetpie_attack2',
        'chr_0040_sweetpie_attack3',
        'chr_0040_sweetpie_attack4',
        'chr_0040_sweetpie_attack5',
        'chr_0040_sweetpie_plunging_attack_end',
        'chr_0040_sweetpie_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0040_sweetpie_attack1',
        'chr_0040_sweetpie_attack2',
        'chr_0040_sweetpie_attack3',
        'chr_0040_sweetpie_attack4',
        'chr_0040_sweetpie_attack5',
      ],
      defaultSkillKey: 'chr_0040_sweetpie_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [kayComboCondition1, kayComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 3,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_combo_skill',
          blackboardKey: 'talent_1',
          operation: 'assign',
          value: 1,
          minimumUpgradeLevel: 2,
          maximumUpgradeLevel: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_combo_skill',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 0.01,
          minimumUpgradeLevel: 2,
          maximumUpgradeLevel: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_combo_skill',
          blackboardKey: 'duration',
          operation: 'assign',
          value: 15,
          minimumUpgradeLevel: 2,
          maximumUpgradeLevel: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_combo_skill',
          blackboardKey: 'stack',
          operation: 'assign',
          value: 3,
          minimumUpgradeLevel: 2,
          maximumUpgradeLevel: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_normal_skill',
          blackboardKey: 'talent_1',
          operation: 'assign',
          value: 1,
          minimumUpgradeLevel: 2,
          maximumUpgradeLevel: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_normal_skill',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 0.01,
          minimumUpgradeLevel: 2,
          maximumUpgradeLevel: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_normal_skill',
          blackboardKey: 'duration',
          operation: 'assign',
          value: 15,
          minimumUpgradeLevel: 2,
          maximumUpgradeLevel: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_normal_skill',
          blackboardKey: 'stack',
          operation: 'assign',
          value: 3,
          minimumUpgradeLevel: 2,
          maximumUpgradeLevel: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_combo_skill',
          blackboardKey: 'talent_1',
          operation: 'assign',
          value: 1,
          minimumUpgradeLevel: 3,
          maximumUpgradeLevel: 3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_combo_skill',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 0.015,
          minimumUpgradeLevel: 3,
          maximumUpgradeLevel: 3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_combo_skill',
          blackboardKey: 'duration',
          operation: 'assign',
          value: 15,
          minimumUpgradeLevel: 3,
          maximumUpgradeLevel: 3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_combo_skill',
          blackboardKey: 'stack',
          operation: 'assign',
          value: 3,
          minimumUpgradeLevel: 3,
          maximumUpgradeLevel: 3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_normal_skill',
          blackboardKey: 'talent_1',
          operation: 'assign',
          value: 1,
          minimumUpgradeLevel: 3,
          maximumUpgradeLevel: 3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_normal_skill',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 0.015,
          minimumUpgradeLevel: 3,
          maximumUpgradeLevel: 3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_normal_skill',
          blackboardKey: 'duration',
          operation: 'assign',
          value: 15,
          minimumUpgradeLevel: 3,
          maximumUpgradeLevel: 3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_normal_skill',
          blackboardKey: 'stack',
          operation: 'assign',
          value: 3,
          minimumUpgradeLevel: 3,
          maximumUpgradeLevel: 3,
        },
      ],
      passiveSkills: [kayPassive2],
    },
    { levels: 2, passiveSkills: [kayPassive3] },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_normal_skill',
          blackboardKey: 'atk_up',
          operation: 'add',
          value: 0.02,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_normal_skill',
          blackboardKey: 'duration',
          operation: 'add',
          value: 10,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_combo_skill',
          blackboardKey: 'atk_up',
          operation: 'add',
          value: 0.02,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_combo_skill',
          blackboardKey: 'duration',
          operation: 'add',
          value: 10,
        },
      ],
      attachedBuffs: [{ buffId: 'buff_chr_0040_sweetpie_start_fight_buff' }],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 20 },
        { kind: 'addStaticDamageIncrease', target: 'nature', value: 0.1 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_normal_skill',
          blackboardKey: 'atk_scale_per_weapon',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_ultimate_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_ultimate_skill',
          blackboardKey: 'atk_scale_2',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_ultimate_skill',
          blackboardKey: 'atk_scale_3',
          operation: 'multiply',
          value: 1.2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillKey: 'chr_0040_sweetpie_ultimate_skill',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addSkillCooldownFrames', skillKey: 'chr_0040_sweetpie_combo_skill', frames: -30 },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_combo_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0040_sweetpie_combo_skill',
          blackboardKey: 'atb',
          operation: 'multiply',
          value: 1.3,
        },
      ],
    },
  ],
  passiveSkills: [kayPassive1],
  buffDefinitions: {
    buff_chr_0040_sweetpie_combo_skill_atk_up: kayBuff1,
    buff_chr_0040_sweetpie_normal_skill_ishit: kayBuff2,
    buff_chr_0040_sweetpie_passive_talent2: kayBuff3,
    buff_chr_0040_sweetpie_passive_talent2_do: kayBuff4,
    buff_chr_0040_sweetpie_passive_talent2_fx: kayBuff5,
    buff_chr_0040_sweetpie_passive_talent2_signal: kayBuff6,
    buff_chr_0040_sweetpie_start_fight_buff: kayBuff7,
    buff_chr_0040_sweetpie_weapon_count: kayBuff8,
    buff_chr_0040_sweetpie_weapon_recycle_buff: kayBuff9,
    buff_delay_trigger_chr_0040_sweetpie_combo_skill_01: kayBuff10,
    buff_delay_trigger_chr_0040_sweetpie_combo_skill_02: kayBuff11,
    buff_delay_trigger_chr_0040_sweetpie_combo_skill_03: kayBuff12,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0040_sweetpie_attack3_end: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 0.9 },
      maxStackingCount: 10,
      childSkill: {
        actionGraph: { main: { nodes: {} }, macros: {} },
        skillId: 'chr_0040_sweetpie_attack3_lance_end_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 15,
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
    abilityentity_chr_0040_sweetpie_ult_weapon_leave: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 10,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              finishOwner_1: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
              heal_2: {
                action: {
                  kind: 'heal',
                  parameters: {
                    target: { kind: 'mainCharacter' },
                    healer: { kind: 'source' },
                    alwaysNext: true,
                    tags: ['Skill/Character/Common/Heal/UltimateSkillHeal'],
                    attribute: 'agility',
                    multiplier: { kind: 'valueNode', nodeId: 'data_1' },
                    addition: { kind: 'valueNode', nodeId: 'data_2' },
                  },
                },
                next: 'finishOwner_1',
              },
              changeResource_3: {
                action: {
                  kind: 'changeResource',
                  parameters: {
                    resource: 'sp',
                    amount: { kind: 'valueNode', nodeId: 'data_3' },
                    coefficient: { kind: 'constant', value: 1 },
                    source: { kind: 'source' },
                    targets: { kind: 'source' },
                    spGainKind: 'gain',
                    spGainSource: 'skill',
                  },
                },
                next: 'heal_2',
              },
              checkCondition_4: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
                },
                next: 'changeResource_3',
              },
              aura_5: {
                action: {
                  kind: 'aura',
                  parameters: { targets: { kind: 'characterTeam', excludeOwner: true }, buffs: [] },
                  onEnter: { $sequence: 'checkCondition_4' },
                  onExit: { $sequence: null },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal_sub_multi' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'heal_base' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb_food' } },
              data_4: {
                type: 'boolean',
                expression: { kind: 'checkMainCharacter', target: { kind: 'inputTarget' } },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0040_sweetpie_ult_skill_weapon_leave_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 9000,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb_food: 15, heal_base: 0, heal_sub_multi: 0 },
        scheduledSequences: [{ startFrame: 9, endFrame: 9000, sequence: { $sequence: 'aura_5' } }],
      },
    },
    abilityentity_chr_0040_sweetpie_ult_weapon_2_leave: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 10,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              finishOwner_1: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
              heal_2: {
                action: {
                  kind: 'heal',
                  parameters: {
                    target: { kind: 'mainCharacter' },
                    healer: { kind: 'source' },
                    alwaysNext: true,
                    tags: ['Skill/Character/Common/Heal/UltimateSkillHeal'],
                    attribute: 'agility',
                    multiplier: { kind: 'valueNode', nodeId: 'data_1' },
                    addition: { kind: 'valueNode', nodeId: 'data_2' },
                  },
                },
                next: 'finishOwner_1',
              },
              changeResource_3: {
                action: {
                  kind: 'changeResource',
                  parameters: {
                    resource: 'sp',
                    amount: { kind: 'valueNode', nodeId: 'data_3' },
                    coefficient: { kind: 'constant', value: 1 },
                    source: { kind: 'source' },
                    targets: { kind: 'source' },
                    spGainKind: 'gain',
                    spGainSource: 'skill',
                  },
                },
                next: 'heal_2',
              },
              checkCondition_4: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
                },
                next: 'changeResource_3',
              },
              aura_5: {
                action: {
                  kind: 'aura',
                  parameters: { targets: { kind: 'characterTeam', excludeOwner: true }, buffs: [] },
                  onEnter: { $sequence: 'checkCondition_4' },
                  onExit: { $sequence: null },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal_sub_multi' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'heal_base' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb_food' } },
              data_4: {
                type: 'boolean',
                expression: { kind: 'checkMainCharacter', target: { kind: 'inputTarget' } },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0040_sweetpie_ult_skill_weapon_leave_2_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 9000,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb_food: 15, heal_base: 0, heal_sub_multi: 0 },
        scheduledSequences: [{ startFrame: 9, endFrame: 9000, sequence: { $sequence: 'aura_5' } }],
      },
    },
    abilityentity_chr_0040_sweetpie_ult_weapon_3_leave: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 10,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              finishOwner_1: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
              heal_2: {
                action: {
                  kind: 'heal',
                  parameters: {
                    target: { kind: 'mainCharacter' },
                    healer: { kind: 'source' },
                    alwaysNext: true,
                    tags: ['Skill/Character/Common/Heal/UltimateSkillHeal'],
                    attribute: 'agility',
                    multiplier: { kind: 'valueNode', nodeId: 'data_1' },
                    addition: { kind: 'valueNode', nodeId: 'data_2' },
                  },
                },
                next: 'finishOwner_1',
              },
              changeResource_3: {
                action: {
                  kind: 'changeResource',
                  parameters: {
                    resource: 'sp',
                    amount: { kind: 'valueNode', nodeId: 'data_3' },
                    coefficient: { kind: 'constant', value: 1 },
                    source: { kind: 'source' },
                    targets: { kind: 'source' },
                    spGainKind: 'gain',
                    spGainSource: 'skill',
                  },
                },
                next: 'heal_2',
              },
              checkCondition_4: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
                },
                next: 'changeResource_3',
              },
              aura_5: {
                action: {
                  kind: 'aura',
                  parameters: { targets: { kind: 'characterTeam', excludeOwner: true }, buffs: [] },
                  onEnter: { $sequence: 'checkCondition_4' },
                  onExit: { $sequence: null },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal_sub_multi' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'heal_base' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atb_food' } },
              data_4: {
                type: 'boolean',
                expression: { kind: 'checkMainCharacter', target: { kind: 'inputTarget' } },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0040_sweetpie_ult_skill_weapon_leave_3_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 9000,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb_food: 15, heal_base: 0, heal_sub_multi: 0 },
        scheduledSequences: [{ startFrame: 9, endFrame: 9000, sequence: { $sequence: 'aura_5' } }],
      },
    },
    abilityentity_chr_0040_sweetpie_weapon_leave: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0040_sweetpie/LeaveWeapon/Hammer',
      ],
      lifetime: { kind: 'limited', durationSeconds: 300 },
      maxStackingCount: 10,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              applyBuff_2: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      {
                        buffId: 'buff_chr_0040_sweetpie_combo_skill_atk_up',
                        copiedBlackboardAssignments: {
                          atk_up: 'atk_up',
                          duration: 'duration',
                          stack: 'stack',
                        },
                      },
                    ],
                    targets: { kind: 'characterTeam', excludeOwner: false },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              finishOwner_3: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
              ifElse_4: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_2' },
                  whenTrue: { $sequence: 'applyBuff_2' },
                  whenFalse: { $sequence: null },
                },
                next: 'finishOwner_3',
              },
              applyBuff_5: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_recycle_buff' }],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'ifElse_4',
              },
              applyBuff_6: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_count' }],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'applyBuff_5',
              },
              checkCondition_7: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                },
                next: 'applyBuff_6',
              },
              aura_8: {
                action: {
                  kind: 'aura',
                  parameters: { targets: { kind: 'characterTeam', excludeOwner: true }, buffs: [] },
                  onEnter: { $sequence: 'checkCondition_7' },
                  onExit: { $sequence: null },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'talent_1', fallback: 0 },
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
              data_3: {
                type: 'boolean',
                expression: { kind: 'checkMainCharacter', target: { kind: 'inputTarget' } },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0040_sweetpie_combo_skill_weapon_leave_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 9000,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_up: 0, duration: 0, stack: 3, talent_1: 0 },
        scheduledSequences: [{ startFrame: 9, endFrame: 9000, sequence: { $sequence: 'aura_8' } }],
      },
      passiveSkills: [
        {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_count' }],
                      targets: { kind: 'source' },
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
                  expression: { kind: 'eventAbilityEntityFinishReasonIn', reasons: ['lifetime'] },
                },
              },
            },
            macros: {},
          },
          key: 'chr_0040_sweetpie_combo_skill_weapon_leave_passive',
          enableSequence: { $sequence: null },
          abilityEventResponses: [
            {
              event: 'abilityEntitySelfFinished',
              priority: 0,
              sequence: { $sequence: 'checkCondition_2' },
            },
          ],
        },
      ],
    },
    abilityentity_chr_0040_sweetpie_weapon_2_leave: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0040_sweetpie/LeaveWeapon/Drill',
      ],
      lifetime: { kind: 'limited', durationSeconds: 300 },
      maxStackingCount: 10,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              applyBuff_2: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      {
                        buffId: 'buff_chr_0040_sweetpie_combo_skill_atk_up',
                        copiedBlackboardAssignments: {
                          atk_up: 'atk_up',
                          duration: 'duration',
                          stack: 'stack',
                        },
                      },
                    ],
                    targets: { kind: 'characterTeam', excludeOwner: false },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              finishOwner_3: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
              ifElse_4: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_2' },
                  whenTrue: { $sequence: 'applyBuff_2' },
                  whenFalse: { $sequence: null },
                },
                next: 'finishOwner_3',
              },
              applyBuff_5: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_recycle_buff' }],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'ifElse_4',
              },
              applyBuff_6: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_count' }],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'applyBuff_5',
              },
              checkCondition_7: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                },
                next: 'applyBuff_6',
              },
              aura_8: {
                action: {
                  kind: 'aura',
                  parameters: { targets: { kind: 'characterTeam', excludeOwner: true }, buffs: [] },
                  onEnter: { $sequence: 'checkCondition_7' },
                  onExit: { $sequence: null },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'talent_1', fallback: 0 },
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
              data_3: {
                type: 'boolean',
                expression: { kind: 'checkMainCharacter', target: { kind: 'inputTarget' } },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0040_sweetpie_combo_skill_weapon_leave_2_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 9000,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_up: 0, duration: 0, stack: 3, talent_1: 0 },
        scheduledSequences: [{ startFrame: 9, endFrame: 9000, sequence: { $sequence: 'aura_8' } }],
      },
      passiveSkills: [
        {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_count' }],
                      targets: { kind: 'source' },
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
                  expression: { kind: 'eventAbilityEntityFinishReasonIn', reasons: ['lifetime'] },
                },
              },
            },
            macros: {},
          },
          key: 'chr_0040_sweetpie_combo_skill_weapon_leave_passive',
          enableSequence: { $sequence: null },
          abilityEventResponses: [
            {
              event: 'abilityEntitySelfFinished',
              priority: 0,
              sequence: { $sequence: 'checkCondition_2' },
            },
          ],
        },
      ],
    },
    abilityentity_chr_0040_sweetpie_weapon_3_leave: {
      faction: 'good',
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0040_sweetpie/LeaveWeapon/Axe',
      ],
      lifetime: { kind: 'limited', durationSeconds: 300 },
      maxStackingCount: 10,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              applyBuff_2: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [
                      {
                        buffId: 'buff_chr_0040_sweetpie_combo_skill_atk_up',
                        copiedBlackboardAssignments: {
                          atk_up: 'atk_up',
                          duration: 'duration',
                          stack: 'stack',
                        },
                      },
                    ],
                    targets: { kind: 'characterTeam', excludeOwner: false },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              finishOwner_3: {
                action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
                next: null,
              },
              ifElse_4: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_2' },
                  whenTrue: { $sequence: 'applyBuff_2' },
                  whenFalse: { $sequence: null },
                },
                next: 'finishOwner_3',
              },
              applyBuff_5: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_recycle_buff' }],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'ifElse_4',
              },
              applyBuff_6: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_count' }],
                    targets: { kind: 'source' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: 'applyBuff_5',
              },
              checkCondition_7: {
                action: {
                  kind: 'checkCondition',
                  parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
                },
                next: 'applyBuff_6',
              },
              aura_8: {
                action: {
                  kind: 'aura',
                  parameters: { targets: { kind: 'characterTeam', excludeOwner: true }, buffs: [] },
                  onEnter: { $sequence: 'checkCondition_7' },
                  onExit: { $sequence: null },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: {
                type: 'number',
                expression: { kind: 'blackboard', key: 'talent_1', fallback: 0 },
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
              data_3: {
                type: 'boolean',
                expression: { kind: 'checkMainCharacter', target: { kind: 'inputTarget' } },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0040_sweetpie_combo_skill_weapon_leave_3_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 9000,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_up: 0, duration: 0, stack: 3, talent_1: 0 },
        scheduledSequences: [{ startFrame: 9, endFrame: 9000, sequence: { $sequence: 'aura_8' } }],
      },
      passiveSkills: [
        {
          actionGraph: {
            main: {
              nodes: {
                applyBuff_1: {
                  action: {
                    kind: 'applyBuff',
                    parameters: {
                      buffs: [{ buffId: 'buff_chr_0040_sweetpie_weapon_count' }],
                      targets: { kind: 'source' },
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
                  expression: { kind: 'eventAbilityEntityFinishReasonIn', reasons: ['lifetime'] },
                },
              },
            },
            macros: {},
          },
          key: 'chr_0040_sweetpie_combo_skill_weapon_leave_passive',
          enableSequence: { $sequence: null },
          abilityEventResponses: [
            {
              event: 'abilityEntitySelfFinished',
              priority: 0,
              sequence: { $sequence: 'checkCondition_2' },
            },
          ],
        },
      ],
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default kay;
