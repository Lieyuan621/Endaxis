/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const antalChr_0023_antal_combo_skillActionGraph = {
  main: {
    nodes: {
      applyElementalInfliction_9: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'nature', isExtra: false },
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
      applyElementalInfliction_7: {
        action: {
          kind: 'applyElementalInfliction',
          parameters: { element: 'cryo', isExtra: false },
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
      switch_10: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_1' }, alwaysNext: true },
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
      applyPhysicalInfliction_4: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'crush',
            target: 'enemy',
            isExtra: false,
            damageMultiplier: { kind: 'constant', value: 1 },
            ignoreHitEffect: false,
          },
        },
        next: null,
      },
      applyPhysicalInfliction_3: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'knockDown',
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
      applyPhysicalInfliction_2: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
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
      applyPhysicalInfliction_1: {
        action: {
          kind: 'applyPhysicalInfliction',
          parameters: { type: 'fracture', target: 'enemy', isExtra: false },
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
            {
              value: { kind: 'constant', value: 1 },
              sequence: { $sequence: 'applyPhysicalInfliction_3' },
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: { $sequence: 'applyPhysicalInfliction_4' },
            },
          ],
        },
        next: null,
      },
      changeResource_11: {
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
      dealDamage_12: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
          },
        },
        next: 'changeResource_11',
      },
      switch_13: {
        action: {
          kind: 'switch',
          parameters: { choice: { kind: 'valueNode', nodeId: 'data_5' }, alwaysNext: true },
          options: [
            { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'switch_5' } },
            { value: { kind: 'constant', value: 0 }, sequence: { $sequence: 'switch_10' } },
            { value: { kind: 'constant', value: 2 }, sequence: { $sequence: null } },
          ],
        },
        next: 'dealDamage_12',
      },
      startTimeDilation_15: {
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
      ifElse_16: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_6' },
          whenTrue: { $sequence: 'startTimeDilation_15' },
          whenFalse: { $sequence: 'startTimeDilation_15' },
        },
        next: null,
      },
      startTimeDilation_17: {
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
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'EntityBB_combo_type' } },
      data_6: {
        type: 'boolean',
        expression: { kind: 'checkActionResult', action: { $sequence: null } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_combo_skill: SkillDefinition = {
  key: 'chr_0023_antal_combo_skill',
  element: 'electric',
  blackboard: {
    atk_scale: [1.51, 1.66, 1.81, 1.96, 2.11, 2.27, 2.42, 2.57, 2.72, 2.91, 3.13, 3.4],
    poise: 10,
    usp: 10,
  },
  timelineBlockFrames: 46,
  naturalDurationFrames: 108,
  exclusiveFrame: 45,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 24, endFrame: 63, skillIds: ['chr_0023_antal_normal_skill'] },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 21, endFrame: 24, sequence: { $sequence: 'switch_13' } },
    { startFrame: 23, endFrame: 26, sequence: { $sequence: 'ifElse_16' } },
    { startFrame: 0, endFrame: 17, sequence: { $sequence: 'startTimeDilation_17' } },
  ],
  smartTarget: 'trigger',
  cooldownFrames: [750, 750, 750, 750, 750, 750, 750, 750, 750, 750, 750, 720],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
  actionGraph: antalChr_0023_antal_combo_skillActionGraph,
};

export const antalChr_0023_antal_attack1ActionGraph = {
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
  element: 'electric',
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
    { startFrame: 8, endFrame: 8, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 15, endFrame: 26, sequence: { $sequence: 'reachSkillOperableBoundary_2' } },
  ],
  defaultTarget: 'enemy',
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
  element: 'electric',
  blackboard: {
    atb: 0,
    atk_scale: [0.28, 0.31, 0.34, 0.36, 0.39, 0.42, 0.45, 0.48, 0.5, 0.54, 0.58, 0.63],
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
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 20, endFrame: 31, sequence: { $sequence: 'reachSkillOperableBoundary_2' } },
  ],
  defaultTarget: 'enemy',
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
      modifyActionValue_2: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'constant', value: 0.5 },
          },
        },
        next: 'launchProjectile_1',
      },
      reachSkillOperableBoundary_4: {
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
  element: 'electric',
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
    { startFrame: 14, endFrame: 14, sequence: { $sequence: 'modifyActionValue_2' } },
    { startFrame: 18, endFrame: 18, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 22, endFrame: 33, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  defaultTarget: 'enemy',
  timelineContinuationSkillId: 'chr_0023_antal_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: antalChr_0023_antal_attack3ActionGraph,
};

const antalChr_0023_antal_attack4ActionGraphCallback1 = {
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
  scheduledSequences: [{ startFrame: 0, endFrame: 3, sequence: { $sequence: 'ifElse_9' } }],
  actionGraph: {
    main: {
      nodes: {
        dealDamage_8: {
          action: {
            kind: 'dealDamage',
            parameters: {
              damageType: 'electric',
              attackScale: { kind: 'valueNode', nodeId: 'data_1' },
              tags: ['normalAttack'],
            },
          },
          next: null,
        },
        createTimedMarker_3: {
          action: {
            kind: 'createTimedMarker',
            parameters: {
              targets: { kind: 'source' },
              markerId: 'have_recovered',
              durationSeconds: { kind: 'constant', value: 0.5 },
              autoFinishByAction: false,
              timeDomain: 'globalScaled',
            },
          },
          next: null,
        },
        changeResource_4: {
          action: {
            kind: 'changeResource',
            parameters: {
              resource: 'sp',
              amount: { kind: 'valueNode', nodeId: 'data_2' },
              coefficient: { kind: 'constant', value: 1 },
              source: { kind: 'source' },
              targets: { kind: 'source' },
              spGainKind: 'gain',
              spGainSource: 'normalAttack',
            },
          },
          next: 'createTimedMarker_3',
        },
        checkCondition_1: {
          action: {
            kind: 'checkCondition',
            parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          },
          next: null,
        },
        checkCondition_2: {
          action: {
            kind: 'checkCondition',
            parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
          },
          next: 'checkCondition_1',
        },
        ifElse_6: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: { kind: 'conditionNode', nodeId: 'data_5' },
            whenTrue: { $sequence: 'changeResource_4' },
            whenFalse: { $sequence: null },
          },
          next: null,
        },
        dealDamage_7: {
          action: {
            kind: 'dealDamage',
            parameters: {
              damageType: 'electric',
              attackScale: { kind: 'valueNode', nodeId: 'data_1' },
              tags: ['normalAttack', 'normalAttackLastCombo'],
              stagger: { kind: 'valueNode', nodeId: 'data_6' },
              staggerOnlyWhenCasterControlled: true,
            },
          },
          next: 'ifElse_6',
        },
        ifElse_9: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: { kind: 'conditionNode', nodeId: 'data_7' },
            whenTrue: { $sequence: 'dealDamage_7' },
            whenFalse: { $sequence: 'dealDamage_8' },
          },
          next: null,
        },
      },
      dataNodes: {
        data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
        data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
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
          type: 'boolean',
          expression: { kind: 'checkMainCharacter', target: { kind: 'source' } },
        },
        data_5: {
          type: 'boolean',
          expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_2' } },
        },
        data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
        data_7: {
          type: 'boolean',
          expression: {
            kind: 'timedMarkerPresent',
            target: { kind: 'source' },
            returnTrueIfNotExists: true,
            markerId: 'have_recovered',
          },
        },
      },
    },
    macros: {},
  },
} as const;

export const antalChr_0023_antal_attack4ActionGraph = {
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
          callbacks: [{ event: 'hit', skill: antalChr_0023_antal_attack4ActionGraphCallback1 }],
        },
        next: null,
      },
      launchProjectile_2: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: true },
          },
          callbacks: [{ event: 'hit', skill: antalChr_0023_antal_attack4ActionGraphCallback1 }],
        },
        next: 'launchProjectile_1',
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
        next: 'launchProjectile_2',
      },
      reachSkillOperableBoundary_4: {
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
  element: 'electric',
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
    { startFrame: 27, endFrame: 27, sequence: { $sequence: 'modifyActionValue_3' } },
    { startFrame: 38, endFrame: 48, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  defaultTarget: 'enemy',
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
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                            calculation: 'breakingAttack',
                            calculationMultiplier: 0.06,
                            tags: ['normalAttack', 'powerAttack'],
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
      launchProjectile_6: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            entityInitialValues: {},
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
                blackboard: { atk_scale: 0 },
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
      applyBuff_8: {
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_power_attack: SkillDefinition = {
  key: 'chr_0023_antal_power_attack',
  element: 'electric',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 43,
  naturalDurationFrames: 124,
  exclusiveFrame: 42,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
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
    { startFrame: 10, endFrame: 10, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 14, endFrame: 14, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 15, endFrame: 15, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 16, endFrame: 16, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 25, endFrame: 25, sequence: { $sequence: 'launchProjectile_6' } },
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'applyBuff_7' } },
    { startFrame: 0, endFrame: 42, sequence: { $sequence: 'applyBuff_8' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
  actionGraph: antalChr_0023_antal_power_attackActionGraph,
};

export const antalChr_0023_antal_plunging_attack_endActionGraph = {
  main: {
    nodes: {
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_plunging_attack_end: SkillDefinition = {
  key: 'chr_0023_antal_plunging_attack_end',
  element: 'electric',
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
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: antalChr_0023_antal_plunging_attack_endActionGraph,
};

export const antalChr_0023_antal_normal_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
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
      dealDamage_2: {
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
        next: 'applyBuff_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0023_antal_normal_skill',
                copiedBlackboardAssignments: {
                  rate: 'rate',
                  duration: 'duration',
                  potential_5: 'potential_5',
                  delay_time: 'delay_time',
                  potential_5_rate: 'potential_5_rate',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'fixed', target: 'enemy' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'dealDamage_2',
      },
      finishBuffsById_4: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0023_antal_normal_skill'],
            reason: 'other',
          },
        },
        next: 'applyBuff_3',
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_normal_skill: SkillDefinition = {
  key: 'chr_0023_antal_normal_skill',
  element: 'electric',
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
  dontInterruptCombo: true,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 20, endFrame: 20, sequence: { $sequence: 'finishBuffsById_4' } },
    { startFrame: 20, endFrame: 23, sequence: { $sequence: 'ifElse_7' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: antalChr_0023_antal_normal_skillActionGraph,
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
            targets: [{ kind: 'owner' }],
          },
        },
        next: null,
      },
      startUltimateTimeDilation_2: {
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
      hideUi_3: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      applyBuff_4: {
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
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0023_antal_utimate_skill',
                copiedBlackboardAssignments: { duration: 'duration', rate: 'rate' },
              },
            ],
            targets: { kind: 'context', key: 'team' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      findTargets_6: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'characterTeam', excludeOwner: false, owner: { kind: 'owner' } },
            saveToContextKey: 'team',
          },
        },
        next: 'applyBuff_5',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_ultimate_skill: SkillDefinition = {
  actionGraph: antalChr_0023_antal_ultimate_skillActionGraph,
  key: 'chr_0023_antal_ultimate_skill',
  element: 'electric',
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
    { startFrame: 0, endFrame: 42, sequence: { $sequence: 'startUltimateTimeDilation_2' } },
    { startFrame: 0, endFrame: 44, sequence: { $sequence: 'hideUi_3' } },
    { startFrame: 0, endFrame: 60, sequence: { $sequence: 'applyBuff_4' } },
    { startFrame: 49, endFrame: 51, sequence: { $sequence: 'findTargets_6' } },
  ],
  defaultTarget: 'enemy',
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
  defaultTarget: 'enemy',
  skillType: 'dodge',
  nativeSkillType: 'dodge',
};

export const antalChr_0023_antal_plunging_attack_startActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const antalChr_0023_antal_plunging_attack_start: SkillDefinition = {
  actionGraph: antalChr_0023_antal_plunging_attack_startActionGraph,
  key: 'chr_0023_antal_plunging_attack_start',
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

const antalComboCondition1ActionGraph = {
  main: {
    nodes: {
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
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
        next: 'checkCondition_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'modifyActionValue_2',
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
          kind: 'buffIdStackCompare',
          target: { kind: 'context', key: 'trigger' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_chr_0023_antal_tageffect'],
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
  sequence: { $sequence: 'checkCondition_3' },
  actionGraph: antalComboCondition1ActionGraph,
};

const antalComboCondition2ActionGraph = {
  main: {
    nodes: {
      checkCondition_1: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
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
        next: 'checkCondition_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'modifyActionValue_2',
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
          kind: 'buffIdStackCompare',
          target: { kind: 'context', key: 'trigger' },
          compareZeroWhenTargetMissing: true,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_chr_0023_antal_tageffect'],
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
  sequence: { $sequence: 'checkCondition_3' },
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
            buffs: [
              {
                buffId: 'buff_chr_0023_antal_tageffect',
                copiedBlackboardAssignments: {
                  rate: 'rate',
                  duration: 'duration',
                  potential_5_rate: 'potential_5_rate',
                  potential_5: 'potential_5',
                  delay_time: 'delay_time',
                },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
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
  blackboard: { delay_time: 0, duration: 60, potential_5: 0, potential_5_rate: 0, rate: 0.2 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: antalBuff3ActionGraph,
};

const antalBuff4ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_vulnerable_fire',
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
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
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
                buffId: 'buff_common_affixes_vulnerable_pulse',
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
                stringBlackboardAssignments: { child_buff_id: 'buff_chr_0023_antal_normal_icon_2' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: 'applyBuff_1',
      },
      finishBuffsById_3: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
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
            buffs: [{ buffId: 'buff_chr_0023_antal_talent_1_combotrigger' }],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'applyBuff_4',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'potential_5_rate' } },
      data_4: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'potential_5', fallback: 0 },
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
    icon: 'endaxis:icons/icon_battle_antal_buff',
    showInHeadBarCommon: true,
    nameKey: 'effects.name.focus',
  },
  applyTags: [],
  extendTags: [],
  blackboard: { delay_time: 0, duration: 0, potential_5: 0, potential_5_rate: 0, rate: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    start: [{ $sequence: 'applyBuff_2' }],
    trigger: [{ $sequence: 'checkCondition_5' }],
    finish: [{ $sequence: 'finishBuffsById_3' }],
  },
  actionGraph: antalBuff4ActionGraph,
};

const antalBuff5ActionGraph = {
  main: {
    nodes: {
      aura_1: {
        action: {
          kind: 'aura',
          parameters: {
            targets: { kind: 'characterTeam', excludeOwner: false },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            buffs: [
              {
                buffId: 'buff_chr_0023_antal_talent_1_heal_trigger',
                blackboardAssignments: {
                  healvalue: { kind: 'valueNode', nodeId: 'data_1' },
                  cd: { kind: 'valueNode', nodeId: 'data_2' },
                  multiplier: { kind: 'valueNode', nodeId: 'data_3' },
                },
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
  lifecycleSequences: { enable: [{ $sequence: 'aura_1' }] },
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
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'heal_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_4',
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
          target: { kind: 'owner' },
          tagQueryType: 'hasAny',
          tags: ['Skill/Character/Common/Affixes/Enhance'],
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'globalCooldownPresent',
          target: { kind: 'owner' },
          returnTrueIfNotExists: true,
          markerId: 'buff_chr_0023_antal_talent_1_heal_trigger',
        },
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
    { event: 'outputDamage', priority: 0, sequence: { $sequence: 'checkCondition_5' } },
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
            buffs: [
              {
                buffId: 'buff_common_damage_immune_talent',
                blackboardAssignments: { duration: { kind: 'constant', value: 0.01 } },
              },
            ],
            targets: { kind: 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'heal_1',
      },
      checkCondition_3: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'applyBuff_2',
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
        },
        next: 'checkCondition_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' } },
        },
        next: 'checkCondition_4',
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
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: true,
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
          buffIds: ['buff_common_dash'],
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
    { event: 'beforeTakeDamage', priority: 0, sequence: { $sequence: 'checkCondition_5' } },
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
    icon: 'endaxis:icons/icon_battle_affix_fire_enhance',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
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
    icon: 'endaxis:icons/icon_battle_affix_pulse_enhance',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
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
            buffs: [
              {
                buffId: 'buff_common_affixes_enhance_fire',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: { child_buff_id: 'buff_chr_0023_antal_ultimate_icon' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
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
                buffId: 'buff_common_affixes_enhance_pulse',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_1' },
                  rate: { kind: 'valueNode', nodeId: 'data_2' },
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff_chr_0023_antal_ultimate_icon_2',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'rate' } },
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
  blackboard: { duration: 20, rate: 0.4 },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'applyBuff_2' }] },
  actionGraph: antalBuff11ActionGraph,
};

export const antal: OperatorDefinition = {
  slug: 'antal',
  gameId: 'ANTAL',
  rarity: 4,
  weaponType: 'funnel',
  element: 'electric',
  characterTypeId: 'Pulse',
  role: 'supporter',
  mainAttribute: 'intellect',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [
      15.8762886597938, 40.1049863244267, 65.6088786029877, 91.1127708815487, 116.61666316011,
      129.36860929939,
    ],
    agility: [
      9.48453608247426, 25.9941089837997, 43.3726067746687, 60.7511045655376, 78.1296023564065,
      86.8188512518409,
    ],
    intellect: [
      15.4639175257732, 47.4357248053862, 81.0902587839261, 114.744792762466, 148.399326741006,
      165.226593730276,
    ],
    will: [
      9.79381443298973, 25.379970544919, 41.7864506627393, 58.1929307805597, 74.59941089838,
      82.8026509572901,
    ],
    baseAttack: [30, 87, 147, 207, 267, 297],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skills: [
    antalChr_0023_antal_combo_skill,
    antalChr_0023_antal_attack1,
    antalChr_0023_antal_attack2,
    antalChr_0023_antal_attack3,
    antalChr_0023_antal_attack4,
    antalChr_0023_antal_power_attack,
    antalChr_0023_antal_plunging_attack_end,
    antalChr_0023_antal_normal_skill,
    antalChr_0023_antal_ultimate_skill,
    antalCommon_character_perfect_dodge,
    antalChr_0023_antal_plunging_attack_start,
  ],
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skillIds: [
        'chr_0023_antal_attack1',
        'chr_0023_antal_attack2',
        'chr_0023_antal_attack3',
        'chr_0023_antal_attack4',
      ],
    },
    { key: 'finisher', operationType: 'finisher', skillIds: ['chr_0023_antal_power_attack'] },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skillIds: ['chr_0023_antal_plunging_attack_end'],
    },
    { key: 'battleSkill', operationType: 'battleSkill', skillIds: ['chr_0023_antal_normal_skill'] },
    { key: 'comboSkill', operationType: 'comboSkill', skillIds: ['chr_0023_antal_combo_skill'] },
    { key: 'ultimate', operationType: 'ultimate', skillIds: ['chr_0023_antal_ultimate_skill'] },
  ],
  dodgeSkillId: 'common_character_perfect_dodge',
  plungingAttack: {
    startSkillId: 'chr_0023_antal_plunging_attack_start',
    endSkillId: 'chr_0023_antal_plunging_attack_end',
    startDurationSeconds: 0.633,
    endDurationSeconds: 1.433,
  },
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
          skillKey: 'chr_0023_antal_ultimate_skill',
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
          skillKey: 'chr_0023_antal_ultimate_skill',
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
          skillKey: 'chr_0023_antal_normal_skill',
          blackboardKey: 'potential_3',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0023_antal_normal_skill',
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
          skillKey: 'chr_0023_antal_normal_skill',
          blackboardKey: 'potential_5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0023_antal_normal_skill',
          blackboardKey: 'delay_time',
          operation: 'add',
          value: 20,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0023_antal_normal_skill',
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
