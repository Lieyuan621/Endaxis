/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
const xaihiChr_0011_seraph_combo_skillActionGraphCallback1 = {
  actionGraph: {
    main: {
      nodes: {
        applyBuff_2: {
          action: {
            kind: 'applyBuff',
            parameters: {
              buffs: [
                {
                  buffId: 'buff_chr_0011_seraph_talent_1_crystup',
                  copiedBlackboardAssignments: { cryst_up: 'cryst_up', duration: 'duration' },
                },
              ],
              targets: { kind: 'inputTarget' },
              source: { kind: 'source' },
              inheritSourceSkillCastInfo: true,
            },
          },
          next: null,
        },
        ifElse_4: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: { kind: 'conditionNode', nodeId: 'data_1' },
            whenTrue: { $sequence: 'applyBuff_2' },
            whenFalse: { $sequence: null },
          },
          next: null,
        },
        ifElse_5: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: { kind: 'conditionNode', nodeId: 'data_3' },
            whenTrue: { $sequence: 'ifElse_4' },
            whenFalse: { $sequence: null },
          },
          next: null,
        },
        checkCondition_6: {
          action: {
            kind: 'checkCondition',
            parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' } },
          },
          next: null,
        },
        checkCondition_7: {
          action: {
            kind: 'checkCondition',
            parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' } },
          },
          next: 'checkCondition_6',
        },
        changeResource_11: {
          action: {
            kind: 'changeResource',
            parameters: {
              resource: 'ultimateEnergy',
              amount: { kind: 'valueNode', nodeId: 'data_8' },
              coefficient: { kind: 'constant', value: 1 },
              source: { kind: 'source' },
              targets: { kind: 'source' },
            },
          },
          next: null,
        },
        startTimeDilation_12: {
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
          next: 'changeResource_11',
        },
        ifElse_13: {
          action: {
            kind: 'ifElse',
            parameters: { alwaysNext: true },
            condition: { kind: 'conditionNode', nodeId: 'data_9' },
            whenTrue: { $sequence: 'startTimeDilation_12' },
            whenFalse: { $sequence: null },
          },
          next: null,
        },
        dealDamage_14: {
          action: {
            kind: 'dealDamage',
            parameters: {
              attacker: 'actionSource',
              target: { kind: 'inputTarget' },
              damageType: 'cryo',
              attackScale: { kind: 'valueNode', nodeId: 'data_10' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'valueNode', nodeId: 'data_11' },
            },
          },
          next: 'ifElse_13',
        },
        applyElementalInfliction_15: {
          action: {
            kind: 'applyElementalInfliction',
            parameters: { element: 'cryo', isExtra: false },
          },
          next: 'dealDamage_14',
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
            condition: { kind: 'conditionNode', nodeId: 'data_12' },
            whenTrue: { $sequence: 'modifyActionValue_opt1' },
            whenFalse: { $sequence: null },
          },
          next: 'applyElementalInfliction_15',
        },
      },
      dataNodes: {
        data_1: {
          type: 'boolean',
          expression: {
            kind: 'entityTagMatch',
            target: { kind: 'inputTarget' },
            tagQueryType: 'hasAny',
            tags: [
              'Skill/Character/Common/SpellInflict/CrystInflict',
              'Skill/Character/Common/SpellStatus/Frozen',
            ],
          },
        },
        data_2: {
          type: 'number',
          expression: { kind: 'blackboard', key: 'exist_talent_1', fallback: 0 },
        },
        data_3: {
          type: 'boolean',
          expression: {
            kind: 'actionValueCompare',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            operator: 'greaterOrEqual',
            right: { kind: 'constant', value: 1 },
          },
        },
        data_4: {
          type: 'number',
          expression: { kind: 'blackboard', key: 'EntityBB_bounced', fallback: 0 },
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
          type: 'number',
          expression: { kind: 'blackboard', key: 'potential_3', fallback: 0 },
        },
        data_7: {
          type: 'boolean',
          expression: {
            kind: 'actionValueCompare',
            left: { kind: 'valueNode', nodeId: 'data_6' },
            operator: 'equal',
            right: { kind: 'constant', value: 1 },
          },
        },
        data_8: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
        data_9: {
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
        data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
        data_11: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
        data_12: {
          type: 'boolean',
          expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_7' } },
        },
      },
    },
    macros: {},
  },
  skillId: 'chr_0011_seraph_combo_skill_projhit',
  nativeSkillType: 'normalSkill',
  naturalDurationFrames: 1,
  castResource: {
    costFrame: 0,
    cooldownSeconds: 0,
    maxChargeTime: 1,
    cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
  },
  blackboard: {
    atk_scale: 0,
    cryst_up: 0,
    duration: 0,
    exist_talent_1: 0,
    poise: 0,
    potential_3: 0,
    usp: 0,
  },
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'ifElse_5' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'ifElse_opt2' } },
  ],
} as const;

export const xaihiChr_0011_seraph_combo_skillActionGraph = {
  main: {
    nodes: {
      mergeContextTargets_3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'main', sources: [{ kind: 'fixed', target: 'enemy' }] },
        },
        next: null,
      },
      findTargets_2: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'main',
          },
        },
        next: null,
      },
      createSpatialPointTargets_4: {
        action: {
          kind: 'createSpatialPointTargets',
          parameters: {
            saveToContextKey: 'pos',
            count: { kind: 'constant', value: 1 },
            origin: { kind: 'context', key: 'mainchr' },
            offset: {
              local: [
                { kind: 'constant', value: 2 },
                { kind: 'constant', value: 0 },
                { kind: 'constant', value: 0 },
              ],
              facing: 'operatorToEnemy',
              rotation: [0, 0, 0, 1],
              centerOnGround: true,
            },
          },
        },
        next: null,
      },
      findCharacterTeamTargets_5: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchr', selection: { kind: 'controlledOperator' } },
        },
        next: 'createSpatialPointTargets_4',
      },
      ifElse_6: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'findTargets_2' },
          whenFalse: { $sequence: 'mergeContextTargets_3' },
        },
        next: 'findCharacterTeamTargets_5',
      },
      findTargets_7: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'tar',
          },
        },
        next: 'ifElse_6',
      },
      finishBuffsById_12: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'characterTeam', excludeOwner: false },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0011_seraph_atk_buff_normal_skill'],
            reason: 'other',
          },
        },
        next: null,
      },
      applyBuff_13: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0011_seraph_finishball_02' }],
            targets: { kind: 'context', key: 'ball' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_12',
      },
      launchProjectile_14: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0011_seraph_combo_skill',
            recycleDelaySeconds: 0.0333333350718021,
            targets: { kind: 'context', contextKey: 'main' },
            launch: { start: { side: 'operator' }, segmentTargets: [{ side: 'enemy' }] },
          },
          callbacks: [
            { event: 'hit', skill: xaihiChr_0011_seraph_combo_skillActionGraphCallback1 },
          ],
        },
        next: 'applyBuff_13',
      },
      launchProjectile_11: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0011_seraph_combo_skill',
            recycleDelaySeconds: 0.0333333350718021,
            targets: { kind: 'context', contextKey: 'main' },
            launch: {
              start: { target: { kind: 'context', key: 'ball' } },
              segmentTargets: [{ side: 'enemy' }],
            },
          },
          callbacks: [
            { event: 'hit', skill: xaihiChr_0011_seraph_combo_skillActionGraphCallback1 },
          ],
        },
        next: 'applyBuff_13',
      },
      ifElse_15: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'launchProjectile_11' },
          whenFalse: { $sequence: 'launchProjectile_14' },
        },
        next: null,
      },
      findOwnerSpawnedAbilityEntities_16: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ball',
            abilityEntityIds: [
              'abilityentity_chr_0011_seraph_normal_skill',
              'abilityentity_chr_0011_seraph_normal_skill_02',
              'abilityentity_chr_0011_seraph_normal_skill_03',
              'abilityentity_chr_0011_seraph_normal_skill_buff',
              'abilityentity_chr_0027_tangtang_normal_skill_02_02',
            ],
            owner: { kind: 'owner' },
          },
        },
        next: 'ifElse_15',
      },
      finishBuffsById_17: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'source' },
            finishSource: { kind: 'source' },
            buffIds: [
              'buff_chr_0011_seraph_combo_skill_listener',
              'buff_chr_0011_seraph_normal_skill_heal',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      startTimeDilation_18: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.900000036 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
            influenceSkillCooldownSeconds: { kind: 'constant', value: 0.4 },
          },
        },
        next: null,
      },
      reachSkillOperableBoundary_19: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0011_seraph_normal_skill'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
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
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'entityCountCompare',
          target: { kind: 'context', key: 'ball' },
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

export const xaihiChr_0011_seraph_combo_skill: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_combo_skillActionGraph,
  key: 'chr_0011_seraph_combo_skill',
  element: 'cryo',
  blackboard: {
    atk_scale: [2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.85, 4.15, 4.5],
    cryst_up: 0,
    duration: 0,
    exist_talent_1: 0,
    poise: 10,
    potential_3: 0,
    usp: 10,
  },
  timelineBlockFrames: 43,
  naturalDurationFrames: 122,
  exclusiveFrame: 42,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 24, sequence: { $sequence: 'findTargets_7' } },
    { startFrame: 24, endFrame: 25, sequence: { $sequence: 'findOwnerSpawnedAbilityEntities_16' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'finishBuffsById_17' } },
    { startFrame: 0, endFrame: 24, sequence: { $sequence: 'startTimeDilation_18' } },
    { startFrame: 25, endFrame: 60, sequence: { $sequence: 'reachSkillOperableBoundary_19' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: [240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 210],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
};

export const xaihiChr_0011_seraph_attack1ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0011_seraph_normal_attack',
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
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0011_seraph_attack1_projhit',
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
              },
            },
          ],
        },
        next: null,
      },
      overrideBasicAttackMapping_2: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0011_seraph_attack2'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0011_seraph_attack2'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_attack1: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_attack1ActionGraph,
  key: 'chr_0011_seraph_attack1',
  element: 'cryo',
  blackboard: {
    atb: 0,
    atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
  },
  timelineBlockFrames: 13,
  naturalDurationFrames: 117,
  exclusiveFrame: 14,
  offsetRecordFrame: 10,
  costFrame: 11,
  scheduledSequences: [
    { startFrame: 10, endFrame: 10, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 0, endFrame: 25, sequence: { $sequence: 'overrideBasicAttackMapping_2' } },
    { startFrame: 13, endFrame: 25, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const xaihiChr_0011_seraph_attack2ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0011_seraph_normal_attack2',
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
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0011_seraph_attack2_projhit',
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
              },
            },
          ],
        },
        next: null,
      },
      overrideBasicAttackMapping_2: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0011_seraph_attack3'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0011_seraph_attack3'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_attack2: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_attack2ActionGraph,
  key: 'chr_0011_seraph_attack2',
  element: 'cryo',
  blackboard: {
    atb: 0,
    atk_scale: [0.16, 0.18, 0.19, 0.21, 0.22, 0.24, 0.26, 0.27, 0.29, 0.31, 0.33, 0.36],
  },
  timelineBlockFrames: 17,
  naturalDurationFrames: 121,
  exclusiveFrame: 20,
  offsetRecordFrame: 7,
  costFrame: 7,
  scheduledSequences: [
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 0, endFrame: 28, sequence: { $sequence: 'overrideBasicAttackMapping_2' } },
    { startFrame: 17, endFrame: 28, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const xaihiChr_0011_seraph_attack3ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0011_seraph_normal_attack3_true',
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
                        expression: { kind: 'blackboard', key: 'atk_scale' },
                      },
                    },
                  },
                  macros: {},
                },
                skillId: 'chr_0011_seraph_attack3_projhit',
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
              },
            },
          ],
        },
        next: null,
      },
      overrideBasicAttackMapping_2: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0011_seraph_attack4'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0011_seraph_attack4'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_attack3: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_attack3ActionGraph,
  key: 'chr_0011_seraph_attack3',
  element: 'cryo',
  blackboard: {
    atb: 0,
    atk_scale: [0.21, 0.23, 0.25, 0.27, 0.29, 0.32, 0.34, 0.36, 0.38, 0.4, 0.44, 0.47],
  },
  timelineBlockFrames: 14,
  naturalDurationFrames: 125,
  exclusiveFrame: 14,
  offsetRecordFrame: 8,
  costFrame: 11,
  scheduledSequences: [
    { startFrame: 8, endFrame: 8, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 0, endFrame: 25, sequence: { $sequence: 'overrideBasicAttackMapping_2' } },
    { startFrame: 14, endFrame: 25, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

const xaihiChr_0011_seraph_attack4ActionGraphCallback1 = {
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
          expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_2' } },
        },
        data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      },
    },
    macros: {},
  },
  skillId: 'chr_0011_seraph_attack4_projhit',
  nativeSkillType: 'normalSkill',
  naturalDurationFrames: 1,
  castResource: {
    costFrame: 0,
    cooldownSeconds: 0,
    maxChargeTime: 1,
    cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
  },
  blackboard: { atb: 0, atk_scale: 0 },
  scheduledSequences: [{ startFrame: 0, endFrame: 4, sequence: { $sequence: 'dealDamage_5' } }],
} as const;

export const xaihiChr_0011_seraph_attack4ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0011_seraph_normal_attack3',
            recycleDelaySeconds: 0.0333333350718021,
            launch: { start: { side: 'operator' }, segmentTargets: [{ side: 'enemy' }] },
          },
          callbacks: [{ event: 'hit', skill: xaihiChr_0011_seraph_attack4ActionGraphCallback1 }],
        },
        next: null,
      },
      launchProjectile_2: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            inheritActionBlackboard: true,
            projectileId: 'projectile_chr_0011_seraph_normal_attack3_02',
            recycleDelaySeconds: 0.0333333350718021,
            launch: { start: { side: 'operator' }, segmentTargets: [{ side: 'enemy' }] },
          },
          callbacks: [{ event: 'hit', skill: xaihiChr_0011_seraph_attack4ActionGraphCallback1 }],
        },
        next: null,
      },
      overrideBasicAttackMapping_3: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0011_seraph_attack5'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_4: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0011_seraph_attack5'] },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_attack4: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_attack4ActionGraph,
  key: 'chr_0011_seraph_attack4',
  element: 'cryo',
  blackboard: {
    atb: 0,
    atk_scale: [0.17, 0.18, 0.2, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.37],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 128,
  exclusiveFrame: 24,
  offsetRecordFrame: 12,
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'launchProjectile_1' } },
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'launchProjectile_2' } },
    { startFrame: 0, endFrame: 33, sequence: { $sequence: 'overrideBasicAttackMapping_3' } },
    { startFrame: 21, endFrame: 33, sequence: { $sequence: 'reachSkillOperableBoundary_4' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const xaihiChr_0011_seraph_attack5ActionGraph = {
  main: {
    nodes: {
      findTargets_2: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'mainTarget', owner: { kind: 'owner' } },
            saveToContextKey: 'target',
          },
        },
        next: null,
      },
      changeResource_13: {
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
      checkCondition_11: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: null,
      },
      checkCondition_12: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_11',
      },
      ifElse_14: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_4' },
          whenTrue: { $sequence: 'changeResource_13' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      dealDamage_15: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_5' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_6' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'ifElse_14',
      },
      mergeContextTargets_16: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'fixed', target: 'enemy' }] },
        },
        next: 'dealDamage_15',
      },
      overrideBasicAttackMapping_17: {
        action: {
          kind: 'overrideBasicAttackMapping',
          parameters: { skillIds: ['chr_0011_seraph_attack1'], priority: 'skill' },
        },
        next: null,
      },
      reachSkillOperableBoundary_18: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0011_seraph_attack1'] },
        },
        next: null,
      },
      ifElse_opt1: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_7' },
          whenTrue: { $sequence: 'findTargets_2' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      ifElse_opt2: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'ifElse_opt1' },
          whenFalse: { $sequence: null },
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
          target: { kind: 'context', key: 'tar' },
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
        expression: { kind: 'checkActionResult', action: { $sequence: 'checkCondition_12' } },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'targetDistance',
          source: { kind: 'owner' },
          target: { kind: 'inputTarget' },
          distance: 12,
          lessThan: true,
          includeTargetRadius: false,
          containsHittableObject: false,
        },
      },
      data_8: {
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
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_attack5: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_attack5ActionGraph,
  key: 'chr_0011_seraph_attack5',
  element: 'cryo',
  blackboard: {
    atb: 15,
    atk_scale: [0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24],
    poise: 15,
  },
  timelineBlockFrames: 33,
  naturalDurationFrames: 137,
  exclusiveFrame: 33,
  offsetRecordFrame: 19,
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'ifElse_opt2' } },
    { startFrame: 19, endFrame: 19, sequence: { $sequence: 'mergeContextTargets_16' } },
    { startFrame: 0, endFrame: 40, sequence: { $sequence: 'overrideBasicAttackMapping_17' } },
    { startFrame: 33, endFrame: 40, sequence: { $sequence: 'reachSkillOperableBoundary_18' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const xaihiChr_0011_seraph_power_attackActionGraph = {
  main: {
    nodes: {
      startTimeDilation_2: {
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
      ifElse_3: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_1' },
          whenTrue: { $sequence: 'startTimeDilation_2' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      gainFinisherSp_4: {
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
      dealDamage_5: {
        action: {
          kind: 'dealDamage',
          parameters: {
            attacker: 'actionSource',
            target: { kind: 'inputTarget' },
            damageType: 'cryo',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: 'gainFinisherSp_4',
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
          parameters: { skillIds: ['chr_0011_seraph_normal_skill', 'chr_0011_seraph_combo_skill'] },
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

export const xaihiChr_0011_seraph_power_attack: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_power_attackActionGraph,
  key: 'chr_0011_seraph_power_attack',
  element: 'cryo',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 51,
  naturalDurationFrames: 160,
  exclusiveFrame: 50,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 34, endFrame: 35, sequence: { $sequence: 'ifElse_3' } },
    { startFrame: 32, endFrame: 32, sequence: { $sequence: 'dealDamage_5' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'applyBuff_6' } },
    { startFrame: 0, endFrame: 34, sequence: { $sequence: 'applyBuff_7' } },
    { startFrame: 34, endFrame: 53, sequence: { $sequence: 'reachSkillOperableBoundary_8' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const xaihiChr_0011_seraph_plunging_attack_endActionGraph = {
  main: {
    nodes: {
      mergeContextTargets_1: {
        action: {
          kind: 'mergeContextTargets',
          parameters: { saveToContextKey: 'tar', sources: [{ kind: 'fixed', target: 'enemy' }] },
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
            attacker: 'actionSource',
            target: { kind: 'context', key: 'tar' },
            damageType: 'cryo',
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

export const xaihiChr_0011_seraph_plunging_attack_end: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_plunging_attack_endActionGraph,
  key: 'chr_0011_seraph_plunging_attack_end',
  element: 'cryo',
  blackboard: {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
  },
  timelineBlockFrames: 13,
  naturalDurationFrames: 116,
  exclusiveFrame: 12,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 1, endFrame: 5, sequence: { $sequence: 'mergeContextTargets_1' } },
    { startFrame: 1, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } },
  ],
  defaultTarget: 'enemy',
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const xaihiChr_0011_seraph_normal_skillActionGraph = {
  main: {
    nodes: {
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0011_seraph_talent_1_atb'],
            reason: 'other',
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
            source: { kind: 'owner' },
            targets: { kind: 'owner' },
            spGainKind: 'gain',
            spGainSource: 'skill',
          },
        },
        next: 'finishBuffsById_2',
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
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0011_seraph_spawnball',
                copiedBlackboardAssignments: {
                  atk_up: 'atk_up',
                  atk_scale: 'atk_scale',
                  heal_value: 'heal_value',
                  buff_duration: 'buff_duration',
                  will_up: 'will_up',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: false,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
          buffIds: ['buff_chr_0011_seraph_talent_1_atb'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_normal_skill: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_normal_skillActionGraph,
  key: 'chr_0011_seraph_normal_skill',
  element: 'cryo',
  blackboard: {
    atb: 0,
    atk_scale: 0.1,
    atk_up: [0.09, 0.09, 0.09, 0.09, 0.09, 0.11, 0.11, 0.11, 0.13, 0.13, 0.13, 0.15],
    buff_duration: 25,
    heal_value: [144, 172.8, 201.6, 230.4, 244.8, 259.2, 273.6, 288, 302.4, 309.6, 316.8, 324],
    will_up: [0.336, 0.4, 0.47, 0.54, 0.57, 0.6, 0.64, 0.67, 0.71, 0.72, 0.74, 0.76],
  },
  timelineBlockFrames: 31,
  naturalDurationFrames: 145,
  exclusiveFrame: 30,
  offsetRecordFrame: 0,
  dontInterruptCombo: true,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 6, endFrame: 6, sequence: { $sequence: 'ifElse_4' } },
    { startFrame: 7, endFrame: 8, sequence: { $sequence: 'applyBuff_5' } },
  ],
  defaultTarget: 'enemy',
  costs: [{ resource: 'sp', value: 100 }],
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
};

export const xaihiChr_0011_seraph_ultimate_skillActionGraph = {
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
      dispelBuffs_6: {
        action: {
          kind: 'dispelBuffs',
          parameters: {
            source: { kind: 'source' },
            targets: { kind: 'context', key: 'tar' },
            level: 0,
            query: {
              buffTags: [
                'Skill/Enemy/Common/SpellInflictOnChar/CrystInflictOnChar',
                'Skill/Enemy/Common/SpellStatusOnChar/FrozenOnChar',
              ],
              tagQueryType: 'hasAny',
            },
          },
        },
        next: null,
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_2' },
          whenTrue: { $sequence: 'dispelBuffs_6' },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0011_seraph_atk_buff',
                copiedBlackboardAssignments: {
                  atk_up: 'atk_up',
                  duration: 'duration',
                  wisd_up: 'wisd_up',
                  wisd_max: 'wisd_max',
                },
              },
            ],
            targets: { kind: 'context', key: 'tar' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'ifElse_7',
      },
      findTargets_9: {
        action: {
          kind: 'findTargets',
          parameters: {
            owner: { kind: 'owner' },
            query: { kind: 'characterTeam', excludeOwner: false, owner: { kind: 'owner' } },
            saveToContextKey: 'tar',
          },
        },
        next: 'applyBuff_8',
      },
      reachSkillOperableBoundary_10: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0011_seraph_normal_skill', 'chr_0011_seraph_combo_skill'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'exist_talent_2', fallback: 0 },
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_ultimate_skill: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_ultimate_skillActionGraph,
  key: 'chr_0011_seraph_ultimate_skill',
  element: 'cryo',
  blackboard: {
    atk_up: [0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.22, 0.24],
    duration: 12,
    exist_talent_2: 0,
    wisd_max: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.36],
    wisd_up: [
      0.00014, 0.00015, 0.00016, 0.00018, 0.00019, 0.0002, 0.00022, 0.00023, 0.00024, 0.00026,
      0.00028, 0.0003,
    ],
  },
  timelineBlockFrames: 81,
  naturalDurationFrames: 183,
  exclusiveFrame: 80,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'startTimeDilation_1' } },
    { startFrame: 0, endFrame: 45, sequence: { $sequence: 'startUltimateTimeDilation_2' } },
    { startFrame: 0, endFrame: 47, sequence: { $sequence: 'hideUi_3' } },
    { startFrame: 0, endFrame: 80, sequence: { $sequence: 'applyBuff_4' } },
    { startFrame: 58, endFrame: 61, sequence: { $sequence: 'findTargets_9' } },
    { startFrame: 67, endFrame: 100, sequence: { $sequence: 'reachSkillOperableBoundary_10' } },
  ],
  defaultTarget: 'enemy',
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 80 }],
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
};

export const xaihiCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: xaihiCommon_character_perfect_dodgeActionGraph,
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

export const xaihiChr_0011_seraph_plunging_attack_startActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const xaihiChr_0011_seraph_plunging_attack_start: SkillDefinition = {
  actionGraph: xaihiChr_0011_seraph_plunging_attack_startActionGraph,
  key: 'chr_0011_seraph_plunging_attack_start',
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

const xaihiBuff1ActionGraph = {
  main: {
    nodes: {
      modifyActionValue_3: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'final_final_atkup',
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
            key: 'final_final_atkup',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_2' },
          },
        },
        next: null,
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_enhance_natural',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_3' },
                  rate: { kind: 'valueNode', nodeId: 'data_4' },
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff_chr_0011_seraph_ultimate_effect_2',
                },
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
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_enhance_crystal',
                blackboardAssignments: {
                  duration: { kind: 'valueNode', nodeId: 'data_3' },
                  rate: { kind: 'valueNode', nodeId: 'data_4' },
                },
                stringBlackboardAssignments: {
                  child_buff_id: 'buff_chr_0011_seraph_ultimate_effect',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          },
        },
        next: 'applyBuff_4',
      },
      calculateActionValue_6: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'final_final_atkup',
            operation: 'add',
            left: { kind: 'valueNode', nodeId: 'data_4' },
            right: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'applyBuff_5',
      },
      ifElse_7: {
        action: {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'conditionNode', nodeId: 'data_8' },
          whenTrue: { $sequence: 'modifyActionValue_2' },
          whenFalse: { $sequence: 'modifyActionValue_3' },
        },
        next: 'calculateActionValue_6',
      },
      storeSourceAttributeValue_8: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            target: { kind: 'source' },
            attribute: { kind: 'specific', key: 'intellect' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_9' },
            base: { kind: 'constant', value: 0 },
            targetKey: 'final_atkup',
          },
        },
        next: 'ifElse_7',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'final_atkup' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'wisd_max' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'final_final_atkup' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
      data_6: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'final_atkup', fallback: 0 },
      },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'wisd_max', fallback: 0 } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_6' },
          operator: 'greaterOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_7' },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'wisd_up' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff1: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_up: 0,
    duration: 0,
    final_atkup: 0,
    final_final_atkup: 0,
    wisd_max: 0,
    wisd_up: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'storeSourceAttributeValue_8' }] },
  actionGraph: xaihiBuff1ActionGraph,
};

const xaihiBuff2ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'owner' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0011_seraph_combo_count'],
            reason: 'other',
          },
        },
        next: null,
      },
      openComboWindow_2: {
        action: {
          kind: 'openComboWindow',
          parameters: {
            nextSkillKeyFromSlot: 'comboSkill',
            owner: { kind: 'context', key: 'seraph' },
            target: { kind: 'mainTarget', owner: { kind: 'owner' } },
          },
        },
        next: 'finishBuffsById_1',
      },
      mergeContextTargets_3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'seraph',
            sources: [{ kind: 'abilitySystemSource', owner: { kind: 'owner' } }],
          },
        },
        next: 'openComboWindow_2',
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0011_seraph_finishball_04' }],
            targets: { kind: 'owner' },
            source: { kind: 'owner' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'mergeContextTargets_3',
      },
      checkCondition_5: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'applyBuff_4',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'owner' },
          compareZeroWhenTargetMissing: false,
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 2 },
          buffIds: ['buff_chr_0011_seraph_combo_count'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff2: SkillBuffDefinition = {
  stackingType: 'enhance',
  priority: 0,
  maxStackCount: 2,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { enhanceChanged: [{ $sequence: 'checkCondition_5' }] },
  actionGraph: xaihiBuff2ActionGraph,
};

const xaihiBuff3ActionGraph = {
  main: {
    nodes: {
      finishOwner_1: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff3: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: false,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { start: [{ $sequence: 'finishOwner_1' }] },
  actionGraph: xaihiBuff3ActionGraph,
};

const xaihiBuff4ActionGraph = {
  main: {
    nodes: {
      finishOwner_1: {
        action: { kind: 'finishOwner', parameters: { targets: { kind: 'owner' } } },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            targets: { kind: 'context', key: 'seraph' },
            finishSource: { kind: 'source' },
            buffIds: ['buff_chr_0011_seraph_combo_skill_listener'],
            reason: 'other',
          },
        },
        next: 'finishOwner_1',
      },
      mergeContextTargets_3: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'seraph',
            sources: [{ kind: 'abilitySystemSource', owner: { kind: 'owner' } }],
          },
        },
        next: 'finishBuffsById_2',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff4: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: 6,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  lifecycleSequences: { trigger: [{ $sequence: 'mergeContextTargets_3' }] },
  actionGraph: xaihiBuff4ActionGraph,
};

const xaihiBuff5ActionGraph = {
  main: {
    nodes: {
      heal_1: {
        action: {
          kind: 'heal',
          parameters: {
            target: { kind: 'owner' },
            healer: { kind: 'source' },
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
            amount: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      storeSourceAttributeValue_2: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            target: { kind: 'source' },
            attribute: { kind: 'specific', key: 'will' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_2' },
            base: { kind: 'valueNode', nodeId: 'data_3' },
            targetKey: 'final_heal_value',
          },
        },
        next: 'heal_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_chr_0011_seraph_potential_1_atkup',
                copiedBlackboardAssignments: { buff_duration: 'buff_duration', atk_up: 'atk_up' },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      checkCondition_4: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'applyBuff_3',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'final_heal_value' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'will_up' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'heal_value' } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'healthCompare',
          target: { kind: 'owner' },
          valueType: 'ratio',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff5: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 1,
  maxStackCount: 1,
  durationSeconds: 2,
  triggerIntervalSeconds: 0.25,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0, buff_duration: 0, final_heal_value: 0, heal_value: 0, will_up: 0 },
  attributeModifiers: [],
  lifecycleSequences: {
    trigger: [{ $sequence: 'storeSourceAttributeValue_2' }, { $sequence: 'checkCondition_4' }],
  },
  actionGraph: xaihiBuff5ActionGraph,
};

const xaihiBuff6ActionGraph = {
  main: {
    nodes: {
      createTimedMarker_1: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            targets: { kind: 'owner' },
            markerId: 'buff_chr_0011_seraph_normal_skill_heal',
            durationSeconds: { kind: 'constant', value: 0.3 },
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
            buffs: [
              {
                buffId: 'buff_chr_0011_seraph_mainchr_heal',
                copiedBlackboardAssignments: {
                  heal_value: 'heal_value',
                  buff_duration: 'buff_duration',
                  atk_up: 'atk_up',
                  will_up: 'will_up',
                },
              },
            ],
            targets: { kind: 'owner' },
            source: { kind: 'context', key: 'seraph' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'createTimedMarker_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_0011_seraph_combo_count' }],
            targets: { kind: 'context', key: 'ball' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_2',
      },
      findOwnerSpawnedAbilityEntities_4: {
        action: {
          kind: 'findOwnerSpawnedAbilityEntities',
          parameters: {
            saveToContextKey: 'ball',
            abilityEntityIds: ['abilityentity_chr_0011_seraph_normal_skill'],
            owner: { kind: 'context', key: 'seraph' },
          },
        },
        next: 'applyBuff_3',
      },
      mergeContextTargets_5: {
        action: {
          kind: 'mergeContextTargets',
          parameters: {
            saveToContextKey: 'seraph',
            sources: [{ kind: 'abilitySystemSource', owner: { kind: 'source' } }],
          },
        },
        next: 'findOwnerSpawnedAbilityEntities_4',
      },
      checkCondition_6: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
        },
        next: 'mergeContextTargets_5',
      },
      checkCondition_7: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
        },
        next: 'checkCondition_6',
      },
      checkCondition_8: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
        },
        next: 'checkCondition_7',
      },
      checkCondition_9: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' } },
        },
        next: 'checkCondition_8',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'eventDamageTagsMatch',
          match: 'hasAny',
          tags: ['normalAttackLastCombo'],
        },
      },
      data_2: {
        type: 'boolean',
        expression: { kind: 'checkMainCharacter', target: { kind: 'owner' } },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: { kind: 'source' },
          compareZeroWhenTargetMissing: false,
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
          buffIds: ['buff_chr_0011_seraph_finishball_04'],
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: { kind: 'owner' },
          returnTrueIfNotExists: true,
          markerId: 'buff_chr_0011_seraph_normal_skill_heal',
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff6: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0, buff_duration: 0, duration: 20, heal_value: 20, will_up: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'beforeOutputDamage', priority: 0, sequence: { $sequence: 'checkCondition_9' } },
  ],
  actionGraph: xaihiBuff6ActionGraph,
};

const xaihiBuff7ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffs: [
              {
                buffId: 'buff_common_affixes_enhance_spell',
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
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'buff_duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff7: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'buff_duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0, buff_duration: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: [{ $sequence: 'applyBuff_1' }] },
  actionGraph: xaihiBuff7ActionGraph,
};

const xaihiBuff8ActionGraph = {
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
      checkCondition_2: {
        action: {
          kind: 'checkCondition',
          parameters: { condition: { kind: 'constant', value: true } },
        },
        next: 'applyBuff_1',
      },
      spawnAbilityEntity_3: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            bornAt: { kind: 'mainCharacter' },
            abilityEntityId: 'abilityentity_chr_0011_seraph_normal_skill',
            childSkillId: 'chr_0011_seraph_normal_skill_abentity_onfield',
            source: { kind: 'owner' },
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          },
        },
        next: 'checkCondition_2',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff8: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 2,
  triggerIntervalSeconds: 1,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0.1,
    atk_up: 0,
    buff_duration: 0,
    heal_value: 30,
    potential_1: 0,
    will_up: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { trigger: [{ $sequence: 'spawnAbilityEntity_3' }] },
  actionGraph: xaihiBuff8ActionGraph,
};

const xaihiBuff9ActionGraph = {
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
      data_1: { type: 'boolean', expression: { kind: 'eventDamageTypeIn', damageTypes: ['cryo'] } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff9: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: { icon: 'endaxis:icons/icon_battle_cryst_taken_up', showInHeadBarCommon: true },
  applyTags: [],
  extendTags: [],
  blackboard: { cryst_up: 0, duration: 0 },
  attributeModifiers: [],
  damageModifiers: [
    {
      enabledSide: 'defender',
      condition: { $sequence: 'checkCondition_1' },
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'normal',
          addition: { blackboardKey: 'cryst_up' },
        },
      ],
    },
  ],
  actionGraph: xaihiBuff9ActionGraph,
};

const xaihiBuff10ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff10: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_affix_cryst_enhance',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  actionGraph: xaihiBuff10ActionGraph,
};

const xaihiBuff11ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const xaihiBuff11: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    icon: 'endaxis:icons/icon_battle_affix_natural_enhance',
    showInHeadBarCommon: true,
    showInSquadIcon: true,
  },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 0 },
  attributeModifiers: [],
  actionGraph: xaihiBuff11ActionGraph,
};

export const xaihi: OperatorDefinition = {
  slug: 'xaihi',
  gameId: 'XAIHI',
  rarity: 5,
  weaponType: 'funnel',
  element: 'cryo',
  characterTypeId: 'Cryst',
  role: 'supporter',
  mainAttribute: 'will',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [
      9.32989690721653, 26.5170418682937, 44.6087734062697, 62.7005049442458, 80.7922364822218,
      89.8381022512098,
    ],
    agility: [
      9.3814432989691, 26.9903219019567, 45.525983589312, 64.0616452766674, 82.5973069640227,
      91.8651378077004,
    ],
    intellect: [
      15.8762886597938, 39.6300862613087, 64.6340837365875, 89.6380812118664, 114.642078687145,
      127.144077424785,
    ],
    will: [
      15.1546391752577, 43.9484536082475, 74.2577319587631, 104.567010309279, 134.876288659794,
      150.030927835052,
    ],
    baseAttack: [30, 86, 144, 203, 262, 291],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  passiveUi: {
    kind: 'abilityEntityCount',
    abilityEntityId: 'abilityentity_chr_0011_seraph_normal_skill',
    icon: 'endaxis:operators/xaihi/battle_01',
    nameKey: 'effects.name.auxiliaryCrystal',
  },
  skills: [
    xaihiChr_0011_seraph_combo_skill,
    xaihiChr_0011_seraph_attack1,
    xaihiChr_0011_seraph_attack2,
    xaihiChr_0011_seraph_attack3,
    xaihiChr_0011_seraph_attack4,
    xaihiChr_0011_seraph_attack5,
    xaihiChr_0011_seraph_power_attack,
    xaihiChr_0011_seraph_plunging_attack_end,
    xaihiChr_0011_seraph_normal_skill,
    xaihiChr_0011_seraph_ultimate_skill,
    xaihiCommon_character_perfect_dodge,
    xaihiChr_0011_seraph_plunging_attack_start,
  ],
  skillGroups: [
    {
      key: 'basicAttack',
      operationType: 'basicAttack',
      skillIds: [
        'chr_0011_seraph_attack1',
        'chr_0011_seraph_attack2',
        'chr_0011_seraph_attack3',
        'chr_0011_seraph_attack4',
        'chr_0011_seraph_attack5',
      ],
    },
    { key: 'finisher', operationType: 'finisher', skillIds: ['chr_0011_seraph_power_attack'] },
    {
      key: 'plungingAttack',
      operationType: 'plungingAttack',
      skillIds: ['chr_0011_seraph_plunging_attack_end'],
    },
    {
      key: 'battleSkill',
      operationType: 'battleSkill',
      skillIds: ['chr_0011_seraph_normal_skill'],
    },
    { key: 'comboSkill', operationType: 'comboSkill', skillIds: ['chr_0011_seraph_combo_skill'] },
    { key: 'ultimate', operationType: 'ultimate', skillIds: ['chr_0011_seraph_ultimate_skill'] },
  ],
  dodgeSkillId: 'common_character_perfect_dodge',
  plungingAttack: {
    startSkillId: 'chr_0011_seraph_plunging_attack_start',
    endSkillId: 'chr_0011_seraph_plunging_attack_end',
    startDurationSeconds: 0.633,
    endDurationSeconds: 2.9,
  },
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0011_seraph_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0011_seraph_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0011_seraph_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0011_seraph_attack1',
        'chr_0011_seraph_attack2',
        'chr_0011_seraph_attack3',
        'chr_0011_seraph_attack4',
        'chr_0011_seraph_attack5',
        'chr_0011_seraph_plunging_attack_end',
        'chr_0011_seraph_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0011_seraph_attack1',
        'chr_0011_seraph_attack2',
        'chr_0011_seraph_attack3',
        'chr_0011_seraph_attack4',
        'chr_0011_seraph_attack5',
      ],
      defaultSkillKey: 'chr_0011_seraph_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0011_seraph_combo_skill',
          blackboardKey: 'exist_talent_1',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0011_seraph_combo_skill',
          blackboardKey: 'cryst_up',
          operation: 'assign',
          value: [0.07, 0.1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0011_seraph_combo_skill',
          blackboardKey: 'duration',
          operation: 'assign',
          value: [5, 5],
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0011_seraph_ultimate_skill',
          blackboardKey: 'exist_talent_2',
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
          skillKey: 'chr_0011_seraph_normal_skill',
          blackboardKey: 'atk_up',
          operation: 'add',
          value: 0.05,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillKey: 'chr_0011_seraph_ultimate_skill',
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
          skillKey: 'chr_0011_seraph_combo_skill',
          blackboardKey: 'potential_3',
          operation: 'assign',
          value: 1,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 15 },
        { kind: 'addStaticHealingIncrease', target: 'output', value: 0.1 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0011_seraph_ultimate_skill',
          blackboardKey: 'atk_up',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0011_seraph_ultimate_skill',
          blackboardKey: 'wisd_up',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillKey: 'chr_0011_seraph_ultimate_skill',
          blackboardKey: 'wisd_max',
          operation: 'multiply',
          value: 1.1,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0011_seraph_atk_buff: xaihiBuff1,
    buff_chr_0011_seraph_combo_count: xaihiBuff2,
    buff_chr_0011_seraph_finishball_02: xaihiBuff3,
    buff_chr_0011_seraph_finishball_04: xaihiBuff4,
    buff_chr_0011_seraph_mainchr_heal: xaihiBuff5,
    buff_chr_0011_seraph_normal_skill_heal: xaihiBuff6,
    buff_chr_0011_seraph_potential_1_atkup: xaihiBuff7,
    buff_chr_0011_seraph_spawnball: xaihiBuff8,
    buff_chr_0011_seraph_talent_1_crystup: xaihiBuff9,
    buff_chr_0011_seraph_ultimate_effect: xaihiBuff10,
    buff_chr_0011_seraph_ultimate_effect_2: xaihiBuff11,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0011_seraph_normal_skill: {
      faction: 'good',
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0011_seraph/UltimateAbilityEntity',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      maxStackingCount: 1,
      childSkill: {
        actionGraph: {
          main: {
            nodes: {
              aura_1: {
                action: {
                  kind: 'aura',
                  parameters: {
                    targets: { kind: 'characterTeam', excludeOwner: false },
                    source: { kind: 'owner' },
                    inheritSourceSkillCastInfo: false,
                    buffs: [
                      {
                        buffId: 'buff_chr_0011_seraph_normal_skill_heal',
                        blackboardAssignments: {
                          heal_value: { kind: 'valueNode', nodeId: 'data_1' },
                          buff_duration: { kind: 'valueNode', nodeId: 'data_2' },
                          atk_up: { kind: 'valueNode', nodeId: 'data_3' },
                          will_up: { kind: 'valueNode', nodeId: 'data_4' },
                        },
                      },
                    ],
                  },
                  onEnter: { $sequence: null },
                  onExit: { $sequence: null },
                },
                next: null,
              },
              applyBuff_2: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_common_full_immune' }],
                    targets: { kind: 'owner' },
                    source: { kind: 'owner' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              applyBuff_4: {
                action: {
                  kind: 'applyBuff',
                  parameters: {
                    buffs: [{ buffId: 'buff_chr_0011_seraph_finishball_02' }],
                    targets: { kind: 'owner' },
                    source: { kind: 'source' },
                    inheritSourceSkillCastInfo: true,
                  },
                },
                next: null,
              },
              finishBuffsById_5: {
                action: {
                  kind: 'finishBuffsById',
                  parameters: {
                    targets: { kind: 'source' },
                    finishSource: { kind: 'source' },
                    buffIds: ['buff_chr_0011_seraph_combo_skill_listener'],
                    reason: 'other',
                  },
                },
                next: 'applyBuff_4',
              },
              ifElse_6: {
                action: {
                  kind: 'ifElse',
                  parameters: { alwaysNext: true },
                  condition: { kind: 'conditionNode', nodeId: 'data_5' },
                  whenTrue: { $sequence: null },
                  whenFalse: { $sequence: 'finishBuffsById_5' },
                },
                next: null,
              },
            },
            dataNodes: {
              data_1: { type: 'number', expression: { kind: 'blackboard', key: 'heal_value' } },
              data_2: { type: 'number', expression: { kind: 'blackboard', key: 'buff_duration' } },
              data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
              data_4: { type: 'number', expression: { kind: 'blackboard', key: 'will_up' } },
              data_5: {
                type: 'boolean',
                expression: {
                  kind: 'buffIdStackCompare',
                  target: { kind: 'owner' },
                  compareZeroWhenTargetMissing: false,
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                  buffIds: ['buff_chr_0011_seraph_finishball_04'],
                },
              },
            },
          },
          macros: {},
        },
        skillId: 'chr_0011_seraph_normal_skill_abentity_onfield',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 900,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_up: 0, buff_duration: 0, heal_value: 20, will_up: 0 },
        scheduledSequences: [
          { startFrame: 1, endFrame: 901, sequence: { $sequence: 'aura_1' } },
          { startFrame: 0, endFrame: 1, sequence: { $sequence: 'applyBuff_2' } },
          { startFrame: 600, endFrame: 603, sequence: { $sequence: 'ifElse_6' } },
        ],
      },
    },
  },
  projectileDefinitions: {
    projectile_chr_0011_seraph_combo_skill: {
      flight: {
        hitBeforeReach: true,
        segments: [
          {
            targetKey: null,
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: -1 } },
              speed: { kind: 'constant', value: 45 },
              speedCurve: [
                {
                  time: 0,
                  value: 0.8,
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
        finishDurationSeconds: { kind: 'constant', value: 5 },
        finishDistanceMeters: { kind: 'constant', value: 100 },
        finishOnReach: true,
        keepMovingOnReach: false,
        reachRadiusMeters: { kind: 'constant', value: 0.5 },
      },
      blackboard: {},
      hit: { onReach: true, finishOnHit: true, maxHitCount: 1 },
    },
    projectile_chr_0011_seraph_normal_attack: {
      flight: {
        hitBeforeReach: true,
        segments: [
          {
            targetKey: null,
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: -1 } },
              speed: { kind: 'constant', value: 22 },
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
              path: {
                kind: 'bezier',
                controlPoints: [
                  {
                    distanceRatioRange: [
                      { kind: 'constant', value: 0.05 },
                      { kind: 'constant', value: 0.05 },
                    ],
                    angleDegreesRange: [
                      { kind: 'constant', value: 32 },
                      { kind: 'constant', value: 32 },
                    ],
                    radiusMetersRange: [
                      { kind: 'constant', value: 0.102 },
                      { kind: 'constant', value: 0.102 },
                    ],
                    scaleWithDistance: true,
                  },
                  {
                    distanceRatioRange: [
                      { kind: 'constant', value: 0.166 },
                      { kind: 'constant', value: 0.166 },
                    ],
                    angleDegreesRange: [
                      { kind: 'constant', value: 32 },
                      { kind: 'constant', value: 32 },
                    ],
                    radiusMetersRange: [
                      { kind: 'constant', value: 0.075 },
                      { kind: 'constant', value: 0.075 },
                    ],
                    scaleWithDistance: true,
                  },
                ],
              },
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
        finishDistanceMeters: { kind: 'constant', value: 100 },
        finishOnReach: true,
        keepMovingOnReach: false,
        reachRadiusMeters: { kind: 'constant', value: 0.2 },
      },
      blackboard: {},
      hit: { finishOnHit: true, maxHitCount: 1 },
    },
    projectile_chr_0011_seraph_normal_attack2: {
      flight: {
        hitBeforeReach: true,
        segments: [
          {
            targetKey: null,
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: -1 } },
              speed: { kind: 'constant', value: 24 },
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
              path: {
                kind: 'bezier',
                controlPoints: [
                  {
                    distanceRatioRange: [
                      { kind: 'constant', value: 0.4 },
                      { kind: 'constant', value: 0.4 },
                    ],
                    angleDegreesRange: [
                      { kind: 'constant', value: 170 },
                      { kind: 'constant', value: 170 },
                    ],
                    radiusMetersRange: [
                      { kind: 'constant', value: 0.11 },
                      { kind: 'constant', value: 0.11 },
                    ],
                    scaleWithDistance: true,
                  },
                  {
                    distanceRatioRange: [
                      { kind: 'constant', value: 0.6 },
                      { kind: 'constant', value: 0.6 },
                    ],
                    angleDegreesRange: [
                      { kind: 'constant', value: 170 },
                      { kind: 'constant', value: 170 },
                    ],
                    radiusMetersRange: [
                      { kind: 'constant', value: 0.22 },
                      { kind: 'constant', value: 0.22 },
                    ],
                    scaleWithDistance: true,
                  },
                ],
              },
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
        finishDistanceMeters: { kind: 'constant', value: 100 },
        finishOnReach: true,
        keepMovingOnReach: false,
        reachRadiusMeters: { kind: 'constant', value: 0.2 },
      },
      blackboard: {},
      hit: { finishOnHit: true, maxHitCount: 1 },
    },
    projectile_chr_0011_seraph_normal_attack3: {
      flight: {
        hitBeforeReach: true,
        segments: [
          {
            targetKey: null,
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: -1 } },
              speed: { kind: 'constant', value: 36 },
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
              path: {
                kind: 'bezier',
                controlPoints: [
                  {
                    distanceRatioRange: [
                      { kind: 'constant', value: 0.01 },
                      { kind: 'constant', value: 0.01 },
                    ],
                    angleDegreesRange: [
                      { kind: 'constant', value: 150 },
                      { kind: 'constant', value: 150 },
                    ],
                    radiusMetersRange: [
                      { kind: 'constant', value: 0.06 },
                      { kind: 'constant', value: 0.06 },
                    ],
                    scaleWithDistance: true,
                  },
                  {
                    distanceRatioRange: [
                      { kind: 'constant', value: 0.36 },
                      { kind: 'constant', value: 0.36 },
                    ],
                    angleDegreesRange: [
                      { kind: 'constant', value: 150 },
                      { kind: 'constant', value: 150 },
                    ],
                    radiusMetersRange: [
                      { kind: 'constant', value: 0.05 },
                      { kind: 'constant', value: 0.05 },
                    ],
                    scaleWithDistance: true,
                  },
                ],
              },
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
        finishDistanceMeters: { kind: 'constant', value: 100 },
        finishOnReach: true,
        keepMovingOnReach: false,
        reachRadiusMeters: { kind: 'constant', value: 0.2 },
      },
      blackboard: {},
      hit: { finishOnHit: true, maxHitCount: 1 },
    },
    projectile_chr_0011_seraph_normal_attack3_02: {
      flight: {
        hitBeforeReach: true,
        segments: [
          {
            targetKey: null,
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: -1 } },
              speed: { kind: 'constant', value: 36 },
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
              path: {
                kind: 'bezier',
                controlPoints: [
                  {
                    distanceRatioRange: [
                      { kind: 'constant', value: 0.01 },
                      { kind: 'constant', value: 0.01 },
                    ],
                    angleDegreesRange: [
                      { kind: 'constant', value: 30 },
                      { kind: 'constant', value: 30 },
                    ],
                    radiusMetersRange: [
                      { kind: 'constant', value: 0.06 },
                      { kind: 'constant', value: 0.06 },
                    ],
                    scaleWithDistance: true,
                  },
                  {
                    distanceRatioRange: [
                      { kind: 'constant', value: 0.08 },
                      { kind: 'constant', value: 0.08 },
                    ],
                    angleDegreesRange: [
                      { kind: 'constant', value: 30 },
                      { kind: 'constant', value: 30 },
                    ],
                    radiusMetersRange: [
                      { kind: 'constant', value: 0.05 },
                      { kind: 'constant', value: 0.05 },
                    ],
                    scaleWithDistance: true,
                  },
                ],
              },
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
        finishDistanceMeters: { kind: 'constant', value: 100 },
        finishOnReach: true,
        keepMovingOnReach: false,
        reachRadiusMeters: { kind: 'constant', value: 0.2 },
      },
      blackboard: {},
      hit: { finishOnHit: true, maxHitCount: 1 },
    },
    projectile_chr_0011_seraph_normal_attack3_true: {
      flight: {
        hitBeforeReach: true,
        segments: [
          {
            targetKey: null,
            movement: {
              trace: { kind: 'duration', seconds: { kind: 'constant', value: -1 } },
              speed: { kind: 'constant', value: 22 },
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
              path: {
                kind: 'bezier',
                controlPoints: [
                  {
                    distanceRatioRange: [
                      { kind: 'constant', value: 0.4 },
                      { kind: 'constant', value: 0.4 },
                    ],
                    angleDegreesRange: [
                      { kind: 'constant', value: 32 },
                      { kind: 'constant', value: 32 },
                    ],
                    radiusMetersRange: [
                      { kind: 'constant', value: 0.11 },
                      { kind: 'constant', value: 0.11 },
                    ],
                    scaleWithDistance: true,
                  },
                  {
                    distanceRatioRange: [
                      { kind: 'constant', value: 0.6 },
                      { kind: 'constant', value: 0.6 },
                    ],
                    angleDegreesRange: [
                      { kind: 'constant', value: 32 },
                      { kind: 'constant', value: 32 },
                    ],
                    radiusMetersRange: [
                      { kind: 'constant', value: 0.22 },
                      { kind: 'constant', value: 0.22 },
                    ],
                    scaleWithDistance: true,
                  },
                ],
              },
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
        finishDistanceMeters: { kind: 'constant', value: 100 },
        finishOnReach: true,
        keepMovingOnReach: false,
        reachRadiusMeters: { kind: 'constant', value: 0.2 },
      },
      blackboard: {},
      hit: { finishOnHit: true, maxHitCount: 1 },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default xaihi;
