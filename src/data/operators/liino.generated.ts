/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */

import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import type { ComboSkillConditionDefinition } from '../../../packages/game-data-contract/src/operators';
import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
export const liinoChr_0035_liino_combo_skillActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_comboskill_ultskill_hit',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              atb_return_duration: { kind: 'valueNode', nodeId: 'data_1' },
              atb_return: { kind: 'valueNode', nodeId: 'data_2' },
              time_duration: { kind: 'valueNode', nodeId: 'data_3' },
              usp: { kind: 'valueNode', nodeId: 'data_4' },
              atk_scale_2: { kind: 'valueNode', nodeId: 'data_5' },
              radius: { kind: 'valueNode', nodeId: 'data_6' },
              atk_scale: { kind: 'valueNode', nodeId: 'data_7' },
              poise: { kind: 'valueNode', nodeId: 'data_8' },
              input_angle: { kind: 'valueNode', nodeId: 'data_9' },
              cam_angle: { kind: 'valueNode', nodeId: 'data_10' },
              cam_duration: { kind: 'valueNode', nodeId: 'data_11' },
              owner_mainchar_distance: { kind: 'valueNode', nodeId: 'data_12' },
              owner_mainchar_alpha: { kind: 'valueNode', nodeId: 'data_13' },
              normal_combo: { kind: 'valueNode', nodeId: 'data_14' },
              remainingtime: { kind: 'valueNode', nodeId: 'data_15' },
              combo_duration: { kind: 'valueNode', nodeId: 'data_16' },
              time_ratio: { kind: 'valueNode', nodeId: 'data_17' },
              talent_b: { kind: 'valueNode', nodeId: 'data_18' },
              heal_value: { kind: 'valueNode', nodeId: 'data_19' },
              heal_rate: { kind: 'valueNode', nodeId: 'data_20' },
            },
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
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_21' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      changeResourceByActionValue_4: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_22' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      heal_5: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'controlledOperator',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            amount: { kind: 'valueNode', nodeId: 'data_23' },
          },
        },
        next: 'changeResourceByActionValue_4',
      },
      storeSourceAttributeValue_6: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'agility' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_24' },
            base: { kind: 'valueNode', nodeId: 'data_25' },
            targetKey: 'final_heal_value',
          },
        },
        next: 'heal_5',
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_26' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_27' },
          },
        },
        next: 'storeSourceAttributeValue_6',
      },
      createGlobalBuff_8: {
        action: {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_liino_combo_atb_return',
            definition: {
              stackingType: 'stack',
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              applyIconDurationToBuffs: true,
              blackboard: { atb_return: 0, duration: 0 },
              children: [
                {
                  buffId: 'buff_chr_0035_liino_combo_atb_return',
                  blackboardAssignments: {
                    atb_return: { kind: 'valueNode', nodeId: 'data_28' },
                    duration: { kind: 'valueNode', nodeId: 'data_29' },
                  },
                },
              ],
            },
            source: 'caster',
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_30' },
              atb_return: { kind: 'valueNode', nodeId: 'data_31' },
            },
          },
        },
        next: null,
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_33' } },
          whenTrue: { $sequence: 'createGlobalBuff_8' },
        },
        next: null,
      },
      finishBuffsById_10: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0035_liino_normalskill_music_animation_hitl',
              'buff_chr_0035_liino_normalskill_music_animation_hitr',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      inheritBuffById_11: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_music_cd_uishow',
            inheritToNextSkillIds: ['chr_0035_liino_normal_skill_combo'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      inheritBuffById_12: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
            inheritToNextSkillIds: ['chr_0035_liino_normal_skill_combo'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: 'inheritBuffById_11',
      },
      inheritBuffById_13: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_music_tag',
            inheritToNextSkillIds: ['chr_0035_liino_normal_skill_combo'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: 'inheritBuffById_12',
      },
      inheritBuffById_14: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_music_damage',
            inheritToNextSkillIds: ['chr_0035_liino_normal_skill_combo'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: 'inheritBuffById_13',
      },
      triggerCustomAbilityEvent_15: {
        action: {
          kind: 'triggerCustomAbilityEvent',
          parameters: {
            eventName: 'liino_comboskill_end',
            eventParam: 0,
            target: 'caster',
            source: 'caster',
          },
        },
        next: null,
      },
      conditional_16: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_34' } },
          whenTrue: { $sequence: 'triggerCustomAbilityEvent_15' },
        },
        next: null,
      },
      startTimeDilation_17: {
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
      startTimeDilation_18: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.933 },
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
      inheritBuffById_19: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_attack',
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_power_attack',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      inheritBuffById_20: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide',
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_normal_skill_combo',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      applyBuff_21: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_normal_skill_combo',
            ],
          },
        },
        next: null,
      },
      conditional_22: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_35' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_20' },
          whenFalse: { $sequence: 'applyBuff_21' },
        },
        next: null,
      },
      conditional_23: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_36' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_19' },
        },
        next: 'conditional_22',
      },
      applyBuff_24: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_25: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_audio',
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_normal_skill_combo',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      applyBuff_26: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_normal_skill_combo',
            ],
          },
        },
        next: null,
      },
      conditional_27: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_37' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_25' },
          whenFalse: { $sequence: 'applyBuff_26' },
        },
        next: null,
      },
      applyBuff_28: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return_duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'time_duration' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'radius' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'input_angle' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'cam_angle' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'cam_duration' } },
      data_12: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'owner_mainchar_distance' },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'owner_mainchar_alpha' } },
      data_14: { type: 'number', expression: { kind: 'blackboard', key: 'normal_combo' } },
      data_15: { type: 'number', expression: { kind: 'blackboard', key: 'remainingtime' } },
      data_16: { type: 'number', expression: { kind: 'blackboard', key: 'combo_duration' } },
      data_17: { type: 'number', expression: { kind: 'blackboard', key: 'time_ratio' } },
      data_18: { type: 'number', expression: { kind: 'blackboard', key: 'talent_b' } },
      data_19: { type: 'number', expression: { kind: 'blackboard', key: 'heal_value' } },
      data_20: { type: 'number', expression: { kind: 'blackboard', key: 'heal_rate' } },
      data_21: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_22: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_23: { type: 'number', expression: { kind: 'blackboard', key: 'final_heal_value' } },
      data_24: { type: 'number', expression: { kind: 'blackboard', key: 'heal_value' } },
      data_25: { type: 'number', expression: { kind: 'blackboard', key: 'heal_rate' } },
      data_26: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_27: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_28: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_29: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_30: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return_duration' } },
      data_31: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_32: { type: 'number', expression: { kind: 'blackboard', key: 'talent_b', fallback: 0 } },
      data_33: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_32' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_34: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_normalskill_music_tag'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_35: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_36: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_attack'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_37: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_audio'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const liinoChr_0035_liino_combo_skill: SkillDefinition = {
  actionGraph: liinoChr_0035_liino_combo_skillActionGraph,
  key: 'chr_0035_liino_combo_skill',
  blackboard: {
    atb_return: 5,
    atb_return_duration: 30,
    atk_scale: [0.6, 0.66, 0.72, 0.78, 0.84, 0.9, 0.96, 1.02, 1.08, 1.16, 1.25, 1.35],
    atk_scale_2: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.93, 2.08, 2.25],
    cam_angle: 0,
    cam_duration: 0,
    combo_duration: 0,
    final_heal_value: 0,
    heal_rate: [72, 86.4, 100.8, 115.2, 122.4, 129.6, 136.8, 144, 151.2, 154.8, 158.4, 162],
    heal_value: [0.17, 0.2, 0.24, 0.27, 0.29, 0.3, 0.32, 0.34, 0.35, 0.36, 0.37, 0.38],
    input_angle: 0,
    normal_combo: 0,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    poise: 5,
    radius: 4,
    remainingtime: 0,
    talent_b: 0,
    time_duration: 0,
    time_ratio: 0,
    usp: 20,
  },
  timelineBlockFrames: 99,
  naturalDurationFrames: 150,
  exclusiveFrame: 98,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 68,
        endFrame: 109,
        skillIds: ['chr_0035_liino_normal_skill', 'chr_0035_liino_normal_skill_combo'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findCharacterTeamTargets_2' } },
    { startFrame: 9, endFrame: 13, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 33, endFrame: 37, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_9' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'finishBuffsById_10' } },
    { startFrame: 0, endFrame: 78, sequence: { $sequence: 'inheritBuffById_14' } },
    { startFrame: 67, endFrame: 67, sequence: { $sequence: 'conditional_16' } },
    { startFrame: 0, endFrame: 7, sequence: { $sequence: 'startTimeDilation_17' } },
    { startFrame: 0, endFrame: 25, sequence: { $sequence: 'startTimeDilation_18' } },
    { startFrame: 0, endFrame: 68, sequence: { $sequence: 'conditional_23' } },
    { startFrame: 0, endFrame: 64, sequence: { $sequence: 'applyBuff_24' } },
    { startFrame: 0, endFrame: 48, sequence: { $sequence: 'conditional_27' } },
    { startFrame: 0, endFrame: 48, sequence: { $sequence: 'applyBuff_28' } },
  ],
  smartTarget: 'enemy',
  switchToBuffCast: {
    condition: {
      kind: 'buffStackCompare',
      target: 'caster',
      tagQueryType: 'hasAny',
      buffTags: ['Skill/Character/chr_0035_liino/UltSkillMusic'],
      operator: 'greaterOrEqual',
      value: { kind: 'constant', value: 1 },
    },
    asSkillCast: true,
    sequence: { $sequence: 'applyBuff_1' },
  },
  cooldownFrames: [300, 300, 300, 300, 300, 300, 300, 300, 270, 270, 270, 240],
  skillType: 'comboSkill',
  levelSource: 'comboSkill',
  nativeSkillType: 'comboSkill',
};

export const liinoChr_0035_liino_attack1ActionGraph = {
  main: {
    nodes: {
      startTimeDilation_1: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_1' },
        },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack'],
          },
        },
        next: 'conditional_2',
      },
      reachSkillOperableBoundary_7: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0035_liino_attack2'] },
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

export const liinoChr_0035_liino_attack1: SkillDefinition = {
  key: 'chr_0035_liino_attack1',
  blackboard: {
    atb: 0,
    atk_scale: [0.094, 0.103, 0.112, 0.122, 0.131, 0.14, 0.15, 0.159, 0.168, 0.18, 0.194, 0.21],
    display_atk_scale: [0.19, 0.21, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42],
  },
  timelineBlockFrames: 12,
  naturalDurationFrames: 103,
  exclusiveFrame: 18,
  offsetRecordFrame: 3,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 30,
        input: 'basicAttack',
        targetSkillId: 'chr_0035_liino_attack2',
      },
    ],
    allowedNextSkills: [{ startFrame: 12, endFrame: 30, skillIds: ['chr_0035_liino_attack2'] }],
  },
  costFrame: 9,
  scheduledSequences: [
    { startFrame: 3, endFrame: 6, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 7, endFrame: 11, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 12, endFrame: 30, sequence: { $sequence: 'reachSkillOperableBoundary_7' } },
  ],
  timelineContinuationSkillId: 'chr_0035_liino_attack2',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: liinoChr_0035_liino_attack1ActionGraph,
};

export const liinoChr_0035_liino_attack2ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
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
      repeatEachTick_2: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 5,
              targetTriggerIntervalSeconds: 0.06,
            },
          },
          body: { $sequence: 'dealDamage_1' },
        },
        next: null,
      },
      reachSkillOperableBoundary_3: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0035_liino_attack3'] },
        },
        next: null,
      },
    },
    dataNodes: { data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } } },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const liinoChr_0035_liino_attack2: SkillDefinition = {
  actionGraph: liinoChr_0035_liino_attack2ActionGraph,
  key: 'chr_0035_liino_attack2',
  blackboard: {
    atb: 0,
    atk_scale: [0.054, 0.059, 0.064, 0.07, 0.075, 0.08, 0.086, 0.091, 0.096, 0.103, 0.111, 0.12],
    display_atk_scale: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.56, 0.6],
  },
  timelineBlockFrames: 20,
  naturalDurationFrames: 175,
  exclusiveFrame: 30,
  offsetRecordFrame: 7,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 38,
        input: 'basicAttack',
        targetSkillId: 'chr_0035_liino_attack3',
      },
    ],
    allowedNextSkills: [{ startFrame: 20, endFrame: 38, skillIds: ['chr_0035_liino_attack3'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 7, endFrame: 19, sequence: { $sequence: 'repeatEachTick_2' } },
    { startFrame: 20, endFrame: 38, sequence: { $sequence: 'reachSkillOperableBoundary_3' } },
  ],
  timelineContinuationSkillId: 'chr_0035_liino_attack3',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const liinoChr_0035_liino_attack3ActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
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
      launchProjectile_2: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0035_liino_attack3_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale_2: 0.1 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
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
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_2' },
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
          body: { $sequence: 'launchProjectile_2' },
        },
        next: null,
      },
      launchProjectile_12: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        },
        next: null,
      },
      applyBuff_18: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_attack',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_power_attack',
              'chr_0035_liino_normal_skill',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_17: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_attack',
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_power_attack',
              'chr_0035_liino_normal_skill',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_19: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_17' },
          whenFalse: { $sequence: 'applyBuff_18' },
        },
        next: null,
      },
      applyBuff_21: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_20: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_fire',
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_22: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_20' },
          whenFalse: { $sequence: 'applyBuff_21' },
        },
        next: null,
      },
      applyBuff_24: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_23: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_audio',
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_25: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_23' },
          whenFalse: { $sequence: 'applyBuff_24' },
        },
        next: null,
      },
      applyBuff_27: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_26: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_28: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_26' },
          whenFalse: { $sequence: 'applyBuff_27' },
        },
        next: null,
      },
      reachSkillOperableBoundary_29: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0035_liino_attack4'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_attack'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_fire'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_audio'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_audio_fire'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const liinoChr_0035_liino_attack3: SkillDefinition = {
  key: 'chr_0035_liino_attack3',
  blackboard: {
    atk_scale: [0.22, 0.24, 0.26, 0.29, 0.31, 0.33, 0.35, 0.37, 0.4, 0.42, 0.46, 0.5],
    atk_scale_2: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.02, 0.02, 0.02, 0.02, 0.02],
    display_atk_scale: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.56, 0.6],
  },
  timelineBlockFrames: 24,
  naturalDurationFrames: 163,
  exclusiveFrame: 27,
  offsetRecordFrame: 12,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 44,
        input: 'basicAttack',
        targetSkillId: 'chr_0035_liino_attack4',
      },
    ],
    allowedNextSkills: [{ startFrame: 24, endFrame: 44, skillIds: ['chr_0035_liino_attack4'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 12, endFrame: 21, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'withActionBlackboardScope_3' } },
    { startFrame: 14, endFrame: 14, sequence: { $sequence: 'withActionBlackboardScope_3' } },
    { startFrame: 16, endFrame: 16, sequence: { $sequence: 'withActionBlackboardScope_3' } },
    { startFrame: 18, endFrame: 18, sequence: { $sequence: 'withActionBlackboardScope_3' } },
    { startFrame: 20, endFrame: 20, sequence: { $sequence: 'withActionBlackboardScope_3' } },
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'launchProjectile_12' } },
    { startFrame: 14, endFrame: 14, sequence: { $sequence: 'launchProjectile_12' } },
    { startFrame: 16, endFrame: 16, sequence: { $sequence: 'launchProjectile_12' } },
    { startFrame: 18, endFrame: 18, sequence: { $sequence: 'launchProjectile_12' } },
    { startFrame: 20, endFrame: 20, sequence: { $sequence: 'launchProjectile_12' } },
    { startFrame: 0, endFrame: 34, sequence: { $sequence: 'conditional_19' } },
    { startFrame: 2, endFrame: 33, sequence: { $sequence: 'conditional_22' } },
    { startFrame: 0, endFrame: 33, sequence: { $sequence: 'conditional_25' } },
    { startFrame: 2, endFrame: 32, sequence: { $sequence: 'conditional_28' } },
    { startFrame: 24, endFrame: 44, sequence: { $sequence: 'reachSkillOperableBoundary_29' } },
  ],
  timelineContinuationSkillId: 'chr_0035_liino_attack4',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: liinoChr_0035_liino_attack3ActionGraph,
};

export const liinoChr_0035_liino_attack4ActionGraph = {
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
                skillId: 'chr_0035_liino_attack4_projhit',
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
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
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
      launchProjectile_21: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        },
        next: null,
      },
      applyBuff_32: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_attack',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_power_attack',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_31: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_attack',
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_power_attack',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_33: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_31' },
          whenFalse: { $sequence: 'applyBuff_32' },
        },
        next: null,
      },
      applyBuff_35: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_34: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_fire',
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_36: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_34' },
          whenFalse: { $sequence: 'applyBuff_35' },
        },
        next: null,
      },
      applyBuff_38: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_37: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_audio',
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_39: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_37' },
          whenFalse: { $sequence: 'applyBuff_38' },
        },
        next: null,
      },
      applyBuff_41: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_40: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_42: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_40' },
          whenFalse: { $sequence: 'applyBuff_41' },
        },
        next: null,
      },
      reachSkillOperableBoundary_43: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0035_liino_attack5'] },
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
          buffIds: ['buff_chr_0035_liino_showhide_attack'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_fire'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_audio'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_audio_fire'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const liinoChr_0035_liino_attack4: SkillDefinition = {
  key: 'chr_0035_liino_attack4',
  blackboard: {
    atb: 0,
    atk_scale: [0.036, 0.04, 0.043, 0.047, 0.05, 0.054, 0.058, 0.061, 0.065, 0.069, 0.075, 0.081],
    display_atk_scale: [0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81],
  },
  timelineBlockFrames: 18,
  naturalDurationFrames: 212,
  exclusiveFrame: 56,
  offsetRecordFrame: 5,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 33,
        input: 'basicAttack',
        targetSkillId: 'chr_0035_liino_attack5',
      },
    ],
    allowedNextSkills: [{ startFrame: 18, endFrame: 33, skillIds: ['chr_0035_liino_attack5'] }],
  },
  costFrame: 8,
  scheduledSequences: [
    { startFrame: 5, endFrame: 5, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 10, endFrame: 10, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 13, endFrame: 13, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 16, endFrame: 16, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 5, endFrame: 5, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 10, endFrame: 10, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 13, endFrame: 13, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 16, endFrame: 16, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 5, endFrame: 5, sequence: { $sequence: 'launchProjectile_21' } },
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'launchProjectile_21' } },
    { startFrame: 10, endFrame: 10, sequence: { $sequence: 'launchProjectile_21' } },
    { startFrame: 13, endFrame: 13, sequence: { $sequence: 'launchProjectile_21' } },
    { startFrame: 16, endFrame: 16, sequence: { $sequence: 'launchProjectile_21' } },
    { startFrame: 5, endFrame: 5, sequence: { $sequence: 'launchProjectile_21' } },
    { startFrame: 7, endFrame: 7, sequence: { $sequence: 'launchProjectile_21' } },
    { startFrame: 10, endFrame: 10, sequence: { $sequence: 'launchProjectile_21' } },
    { startFrame: 13, endFrame: 13, sequence: { $sequence: 'launchProjectile_21' } },
    { startFrame: 16, endFrame: 16, sequence: { $sequence: 'launchProjectile_21' } },
    { startFrame: 0, endFrame: 71, sequence: { $sequence: 'conditional_33' } },
    { startFrame: 0, endFrame: 70, sequence: { $sequence: 'conditional_36' } },
    { startFrame: 0, endFrame: 64, sequence: { $sequence: 'conditional_39' } },
    { startFrame: 0, endFrame: 63, sequence: { $sequence: 'conditional_42' } },
    { startFrame: 18, endFrame: 33, sequence: { $sequence: 'reachSkillOperableBoundary_43' } },
  ],
  timelineContinuationSkillId: 'chr_0035_liino_attack5',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: liinoChr_0035_liino_attack4ActionGraph,
};

export const liinoChr_0035_liino_attack5ActionGraph = {
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
      startTimeDilation_2: {
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
        next: 'changeResourceByActionValue_1',
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'startTimeDilation_2' },
        },
        next: null,
      },
      dealDamage_4: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_3' },
            tags: ['normalAttack', 'normalAttackLastCombo'],
            stagger: { kind: 'valueNode', nodeId: 'data_4' },
            staggerOnlyWhenCasterControlled: true,
          },
        },
        next: 'conditional_3',
      },
      inheritBuffById_5: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_attack',
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_power_attack',
              'chr_0035_liino_normal_skill',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      applyBuff_6: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_attack',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_power_attack',
              'chr_0035_liino_normal_skill',
            ],
          },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_5' },
          whenFalse: { $sequence: 'applyBuff_6' },
        },
        next: null,
      },
      inheritBuffById_8: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_fire',
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      conditional_10: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_8' },
          whenFalse: { $sequence: 'applyBuff_9' },
        },
        next: null,
      },
      inheritBuffById_11: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_audio',
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      applyBuff_12: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
          },
        },
        next: null,
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_11' },
          whenFalse: { $sequence: 'applyBuff_12' },
        },
        next: null,
      },
      inheritBuffById_14: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      conditional_16: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_14' },
          whenFalse: { $sequence: 'applyBuff_15' },
        },
        next: null,
      },
      reachSkillOperableBoundary_17: {
        action: {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: ['chr_0035_liino_attack1'] },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb' } },
      data_2: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_attack'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_fire'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_audio'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_audio_fire'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const liinoChr_0035_liino_attack5: SkillDefinition = {
  actionGraph: liinoChr_0035_liino_attack5ActionGraph,
  key: 'chr_0035_liino_attack5',
  blackboard: {
    atb: 20,
    atk_scale: [0.45, 0.49, 0.53, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.92, 1],
    poise: 19,
  },
  timelineBlockFrames: 28,
  naturalDurationFrames: 173,
  exclusiveFrame: 46,
  offsetRecordFrame: 17,
  inputWindows: {
    commandMappings: [
      {
        startFrame: 0,
        endFrame: 49,
        input: 'basicAttack',
        targetSkillId: 'chr_0035_liino_attack1',
      },
    ],
    allowedNextSkills: [{ startFrame: 28, endFrame: 49, skillIds: ['chr_0035_liino_attack1'] }],
  },
  costFrame: 12,
  scheduledSequences: [
    { startFrame: 17, endFrame: 24, sequence: { $sequence: 'dealDamage_4' } },
    { startFrame: 0, endFrame: 25, sequence: { $sequence: 'conditional_7' } },
    { startFrame: 5, endFrame: 23, sequence: { $sequence: 'conditional_10' } },
    { startFrame: 0, endFrame: 23, sequence: { $sequence: 'conditional_13' } },
    { startFrame: 4, endFrame: 20, sequence: { $sequence: 'conditional_16' } },
    { startFrame: 28, endFrame: 49, sequence: { $sequence: 'reachSkillOperableBoundary_17' } },
  ],
  timelineContinuationSkillId: 'chr_0035_liino_attack1',
  skillType: 'basicAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
};

export const liinoChr_0035_liino_power_attackActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.1,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      repeatEachTick_2: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 3,
              targetTriggerIntervalSeconds: 0.1,
            },
          },
          body: { $sequence: 'dealDamage_1' },
        },
        next: null,
      },
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            calculation: 'breakingAttack',
            calculationMultiplier: 0.7,
            tags: ['normalAttack', 'powerAttack'],
          },
        },
        next: null,
      },
      gainFinisherSp_4: {
        action: { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
        next: 'dealDamage_3',
      },
      startTimeDilation_5: {
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
        next: null,
      },
      startTimeDilation_6: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.35 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.75,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.3,
                  value: 0.75,
                  inTangent: -0.01084917,
                  outTangent: -0.01084917,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.4556158,
                  value: 0.4247887,
                  inTangent: -6.50331,
                  outTangent: -6.50331,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.5,
                  value: 0.1,
                  inTangent: -7.317658,
                  outTangent: -7.317658,
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
      applyBuff_7: {
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
      applyBuff_8: {
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
      inheritBuffById_9: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_attack',
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      applyBuff_10: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_attack',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_11: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_attack',
            inheritToNextSkillIds: [
              'chr_0035_liino_power_attack',
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_combo_skill',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      applyBuff_12: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_attack',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_power_attack',
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_combo_skill',
            ],
          },
        },
        next: null,
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_11' },
          whenFalse: { $sequence: 'applyBuff_12' },
        },
        next: null,
      },
      conditional_14: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_9' },
          whenFalse: { $sequence: 'applyBuff_10' },
        },
        next: 'conditional_13',
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      inheritBuffById_16: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_audio',
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      applyBuff_17: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
          },
        },
        next: null,
      },
      conditional_18: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_16' },
          whenFalse: { $sequence: 'applyBuff_17' },
        },
        next: null,
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_attack'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_audio'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const liinoChr_0035_liino_power_attack: SkillDefinition = {
  actionGraph: liinoChr_0035_liino_power_attackActionGraph,
  key: 'chr_0035_liino_power_attack',
  blackboard: { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
  timelineBlockFrames: 58,
  naturalDurationFrames: 219,
  exclusiveFrame: 68,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 58,
        endFrame: 74,
        skillIds: [
          'chr_0035_liino_normal_skill',
          'chr_0035_liino_combo_skill',
          'chr_0035_liino_power_attack',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 12, endFrame: 24, sequence: { $sequence: 'repeatEachTick_2' } },
    { startFrame: 34, endFrame: 35, sequence: { $sequence: 'gainFinisherSp_4' } },
    { startFrame: 31, endFrame: 31, sequence: { $sequence: 'startTimeDilation_5' } },
    { startFrame: 44, endFrame: 60, sequence: { $sequence: 'startTimeDilation_6' } },
    { startFrame: 0, endFrame: 68, sequence: { $sequence: 'applyBuff_7' } },
    { startFrame: 0, endFrame: 58, sequence: { $sequence: 'applyBuff_8' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'conditional_14' } },
    { startFrame: 3, endFrame: 49, sequence: { $sequence: 'applyBuff_15' } },
    { startFrame: 0, endFrame: 50, sequence: { $sequence: 'conditional_18' } },
    { startFrame: 3, endFrame: 49, sequence: { $sequence: 'applyBuff_19' } },
  ],
  skillType: 'finisher',
  levelSource: 'basicAttack',
  nativeSkillType: 'breakingAttack',
};

export const liinoChr_0035_liino_plunging_attack_endActionGraph = {
  main: {
    nodes: {
      dealDamage_1: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: null,
      },
      dealDamage_2: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
            tags: ['normalAttack', 'plungingAttack'],
          },
        },
        next: null,
      },
      repeatEachTick_3: {
        action: {
          kind: 'repeatEachTick',
          parameters: {
            nativeChanneling: {
              executeEachFrame: true,
              triggerIntervalSeconds: 0.033,
              maxCountPerTarget: 1,
              targetTriggerIntervalSeconds: 0.033,
            },
          },
          body: { $sequence: 'dealDamage_2' },
        },
        next: null,
      },
      launchProjectile_4: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
          callbacks: [
            {
              event: 'reach',
              skill: {
                actionGraph: { main: { nodes: {} }, macros: {} },
                skillId: 'chr_0035_liino_plunging_attack_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0.1, poise: 5 },
                scheduledSequences: [{ startFrame: 0, endFrame: 0, sequence: { $sequence: null } }],
              },
            },
          ],
        },
        next: null,
      },
      withActionBlackboardScope_5: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_4' },
        },
        next: null,
      },
      launchProjectile_6: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        },
        next: null,
      },
      applyBuff_12: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_attack',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_power_attack',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_11: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_attack',
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_power_attack',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_13: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_11' },
          whenFalse: { $sequence: 'applyBuff_12' },
        },
        next: null,
      },
      applyBuff_14: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      applyBuff_16: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_15: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_audio',
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_17: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_15' },
          whenFalse: { $sequence: 'applyBuff_16' },
        },
        next: null,
      },
      applyBuff_18: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_3: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_attack'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_audio'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const liinoChr_0035_liino_plunging_attack_end: SkillDefinition = {
  key: 'chr_0035_liino_plunging_attack_end',
  blackboard: {
    atk_scale: [0.64, 0.7, 0.77, 0.83, 0.9, 0.96, 1.02, 1.09, 1.15, 1.23, 1.33, 1.44],
    atk_scale_2: [0.16, 0.18, 0.19, 0.21, 0.22, 0.24, 0.26, 0.27, 0.29, 0.31, 0.33, 0.36],
  },
  timelineBlockFrames: 21,
  naturalDurationFrames: 121,
  exclusiveFrame: 20,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [{ startFrame: 11, endFrame: 20, skillIds: ['chr_0012_avywen_attack1'] }],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 2, endFrame: 2, sequence: { $sequence: 'dealDamage_1' } },
    { startFrame: 8, endFrame: 9, sequence: { $sequence: 'repeatEachTick_3' } },
    { startFrame: 2, endFrame: 2, sequence: { $sequence: 'withActionBlackboardScope_5' } },
    { startFrame: 5, endFrame: 5, sequence: { $sequence: 'launchProjectile_6' } },
    { startFrame: 8, endFrame: 8, sequence: { $sequence: 'launchProjectile_6' } },
    { startFrame: 3, endFrame: 3, sequence: { $sequence: 'launchProjectile_6' } },
    { startFrame: 6, endFrame: 6, sequence: { $sequence: 'launchProjectile_6' } },
    { startFrame: 9, endFrame: 9, sequence: { $sequence: 'launchProjectile_6' } },
    { startFrame: 0, endFrame: 19, sequence: { $sequence: 'conditional_13' } },
    { startFrame: 0, endFrame: 19, sequence: { $sequence: 'applyBuff_14' } },
    { startFrame: 0, endFrame: 17, sequence: { $sequence: 'conditional_17' } },
    { startFrame: 0, endFrame: 17, sequence: { $sequence: 'applyBuff_18' } },
  ],
  skillType: 'plungingAttack',
  levelSource: 'basicAttack',
  nativeSkillType: 'attack',
  actionGraph: liinoChr_0035_liino_plunging_attack_endActionGraph,
};

export const liinoChr_0035_liino_normal_skillActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
              'buff_chr_0035_liino_normalskill_music_animation_musicloop',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      finishBuffsById_2: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
              'buff_chr_0035_liino_normalskill_music_animation_musicloop',
              'buff_chr_0035_liino_normalskill_music_animation_hitl',
              'buff_chr_0035_liino_normalskill_music_animation_hitr',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      finishTimeline_3: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      launchProjectile_4: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
          callbacks: [
            {
              event: 'reach',
              skill: {
                skillId: 'chr_0035_liino_normal_skill_projhit_start',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0.1, hit_cnt: 0, poise: 5 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_9' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      mergeContextTargets_2: {
                        action: {
                          kind: 'mergeContextTargets',
                          parameters: { saveToContextKey: 'smart_target', sources: [] },
                        },
                        next: null,
                      },
                      mergeContextTargets_1: {
                        action: {
                          kind: 'mergeContextTargets',
                          parameters: {
                            saveToContextKey: 'smart_target',
                            sources: [{ kind: 'target', target: 'enemy' }],
                          },
                        },
                        next: null,
                      },
                      launchProjectile_5: {
                        action: {
                          kind: 'launchProjectile',
                          parameters: {
                            finish: 'firstTickBlock',
                            recycleDelaySeconds: 0.133333340287209,
                          },
                          callbacks: [
                            {
                              event: 'block',
                              skill: {
                                skillId: 'chr_0035_liino_normal_skill_projhit',
                                nativeSkillType: 'normalSkill',
                                naturalDurationFrames: 4,
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
                                blackboard: { atk_scale: 0.1, hit_cnt: 1, poise: 2 },
                                scheduledSequences: [
                                  { startFrame: 0, endFrame: 4, sequence: { $sequence: null } },
                                  {
                                    startFrame: 0,
                                    endFrame: 4,
                                    sequence: { $sequence: 'dealDamage_1' },
                                  },
                                  { startFrame: 0, endFrame: 4, sequence: { $sequence: null } },
                                ],
                                actionGraph: {
                                  main: {
                                    nodes: {
                                      dealDamage_1: {
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
                                        expression: { kind: 'blackboard', key: 'poise' },
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
                            scopeKey:
                              'chr_0035_liino_normal_skill_projhit_start.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].failActions.actionData[0]:projectile_chr_0035_liino_normal_attack',
                            lifetime: 'execution',
                            initialValues: {},
                            inheritParent: true,
                            entityInitialValues: {},
                          },
                          body: { $sequence: 'launchProjectile_5' },
                        },
                        next: null,
                      },
                      withActionBlackboardScope_4: {
                        action: {
                          kind: 'withActionBlackboardScope',
                          parameters: {
                            scopeKey:
                              'chr_0035_liino_normal_skill_projhit_start.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].succeedActions.actionData[0]:projectile_chr_0035_liino_normal_attack',
                            lifetime: 'execution',
                            initialValues: {},
                            inheritParent: true,
                            entityInitialValues: {},
                          },
                          body: { $sequence: 'launchProjectile_5' },
                        },
                        next: null,
                      },
                      forEachContextTarget_6: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { contextKey: 'smart_target' },
                          body: { $sequence: 'withActionBlackboardScope_4' },
                        },
                        next: null,
                      },
                      conditional_8: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_1' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'forEachContextTarget_6' },
                          whenFalse: { $sequence: 'withActionBlackboardScope_7' },
                        },
                        next: null,
                      },
                      conditional_9: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                          whenTrue: { $sequence: 'mergeContextTargets_1' },
                          whenFalse: { $sequence: 'mergeContextTargets_2' },
                        },
                        next: 'conditional_8',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'contextTargetCountCompare',
                          contextKey: 'smart_target',
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0035_liino_normalskill_spelllnfliction_check'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
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
      launchProjectile_5: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
          callbacks: [
            {
              event: 'reach',
              skill: {
                skillId: 'chr_0035_liino_normal_skill_projhit_start_vfx',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0.1, hit_cnt: 0, poise: 5 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_9' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      mergeContextTargets_2: {
                        action: {
                          kind: 'mergeContextTargets',
                          parameters: { saveToContextKey: 'smart_target', sources: [] },
                        },
                        next: null,
                      },
                      mergeContextTargets_1: {
                        action: {
                          kind: 'mergeContextTargets',
                          parameters: {
                            saveToContextKey: 'smart_target',
                            sources: [{ kind: 'target', target: 'enemy' }],
                          },
                        },
                        next: null,
                      },
                      launchProjectile_5: {
                        action: {
                          kind: 'launchProjectile',
                          parameters: {
                            finish: 'firstTickBlock',
                            recycleDelaySeconds: 0.133333340287209,
                          },
                          callbacks: [
                            {
                              event: 'block',
                              skill: {
                                skillId: 'chr_0035_liino_normal_skill_projhit_02',
                                nativeSkillType: 'normalSkill',
                                naturalDurationFrames: 4,
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
                                blackboard: { atk_scale: 0.1, hit_cnt: 1, poise: 2 },
                                scheduledSequences: [
                                  { startFrame: 0, endFrame: 4, sequence: { $sequence: null } },
                                  {
                                    startFrame: 0,
                                    endFrame: 4,
                                    sequence: { $sequence: 'dealDamage_1' },
                                  },
                                  { startFrame: 0, endFrame: 4, sequence: { $sequence: null } },
                                ],
                                actionGraph: {
                                  main: {
                                    nodes: {
                                      dealDamage_1: {
                                        action: {
                                          kind: 'dealDamage',
                                          parameters: {
                                            damageType: 'electric',
                                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                            tags: ['normalSkill'],
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
                                        expression: { kind: 'blackboard', key: 'poise' },
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
                            scopeKey:
                              'chr_0035_liino_normal_skill_projhit_start_vfx.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].failActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx',
                            lifetime: 'execution',
                            initialValues: {},
                            inheritParent: true,
                            entityInitialValues: {},
                          },
                          body: { $sequence: 'launchProjectile_5' },
                        },
                        next: null,
                      },
                      withActionBlackboardScope_4: {
                        action: {
                          kind: 'withActionBlackboardScope',
                          parameters: {
                            scopeKey:
                              'chr_0035_liino_normal_skill_projhit_start_vfx.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].succeedActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx',
                            lifetime: 'execution',
                            initialValues: {},
                            inheritParent: true,
                            entityInitialValues: {},
                          },
                          body: { $sequence: 'launchProjectile_5' },
                        },
                        next: null,
                      },
                      forEachContextTarget_6: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { contextKey: 'smart_target' },
                          body: { $sequence: 'withActionBlackboardScope_4' },
                        },
                        next: null,
                      },
                      conditional_8: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_1' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'forEachContextTarget_6' },
                          whenFalse: { $sequence: 'withActionBlackboardScope_7' },
                        },
                        next: null,
                      },
                      conditional_9: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                          whenTrue: { $sequence: 'mergeContextTargets_1' },
                          whenFalse: { $sequence: 'mergeContextTargets_2' },
                        },
                        next: 'conditional_8',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'contextTargetCountCompare',
                          contextKey: 'smart_target',
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0035_liino_normalskill_spelllnfliction_check'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
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
      withActionBlackboardScope_6: {
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
      withActionBlackboardScope_7: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_4' },
        },
        next: 'withActionBlackboardScope_6',
      },
      launchProjectile_8: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
          callbacks: [
            {
              event: 'reach',
              skill: {
                skillId: 'chr_0035_liino_normal_skill_projhit_start_vfx03',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0.1, hit_cnt: 0, poise: 5 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_9' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      mergeContextTargets_2: {
                        action: {
                          kind: 'mergeContextTargets',
                          parameters: { saveToContextKey: 'smart_target', sources: [] },
                        },
                        next: null,
                      },
                      mergeContextTargets_1: {
                        action: {
                          kind: 'mergeContextTargets',
                          parameters: {
                            saveToContextKey: 'smart_target',
                            sources: [{ kind: 'target', target: 'enemy' }],
                          },
                        },
                        next: null,
                      },
                      launchProjectile_5: {
                        action: {
                          kind: 'launchProjectile',
                          parameters: {
                            finish: 'firstTickBlock',
                            recycleDelaySeconds: 0.133333340287209,
                          },
                          callbacks: [
                            {
                              event: 'block',
                              skill: {
                                skillId: 'chr_0035_liino_normal_skill_projhit_02',
                                nativeSkillType: 'normalSkill',
                                naturalDurationFrames: 4,
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
                                blackboard: { atk_scale: 0.1, hit_cnt: 1, poise: 2 },
                                scheduledSequences: [
                                  { startFrame: 0, endFrame: 4, sequence: { $sequence: null } },
                                  {
                                    startFrame: 0,
                                    endFrame: 4,
                                    sequence: { $sequence: 'dealDamage_1' },
                                  },
                                  { startFrame: 0, endFrame: 4, sequence: { $sequence: null } },
                                ],
                                actionGraph: {
                                  main: {
                                    nodes: {
                                      dealDamage_1: {
                                        action: {
                                          kind: 'dealDamage',
                                          parameters: {
                                            damageType: 'electric',
                                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                            tags: ['normalSkill'],
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
                                        expression: { kind: 'blackboard', key: 'poise' },
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
                            scopeKey:
                              'chr_0035_liino_normal_skill_projhit_start_vfx03.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].failActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx_03',
                            lifetime: 'execution',
                            initialValues: {},
                            inheritParent: true,
                            entityInitialValues: {},
                          },
                          body: { $sequence: 'launchProjectile_5' },
                        },
                        next: null,
                      },
                      withActionBlackboardScope_4: {
                        action: {
                          kind: 'withActionBlackboardScope',
                          parameters: {
                            scopeKey:
                              'chr_0035_liino_normal_skill_projhit_start_vfx03.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].succeedActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx_03',
                            lifetime: 'execution',
                            initialValues: {},
                            inheritParent: true,
                            entityInitialValues: {},
                          },
                          body: { $sequence: 'launchProjectile_5' },
                        },
                        next: null,
                      },
                      forEachContextTarget_6: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { contextKey: 'smart_target' },
                          body: { $sequence: 'withActionBlackboardScope_4' },
                        },
                        next: null,
                      },
                      conditional_8: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_1' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'forEachContextTarget_6' },
                          whenFalse: { $sequence: 'withActionBlackboardScope_7' },
                        },
                        next: null,
                      },
                      conditional_9: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                          whenTrue: { $sequence: 'mergeContextTargets_1' },
                          whenFalse: { $sequence: 'mergeContextTargets_2' },
                        },
                        next: 'conditional_8',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'contextTargetCountCompare',
                          contextKey: 'smart_target',
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0035_liino_normalskill_spelllnfliction_check'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
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
      launchProjectile_9: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
          callbacks: [
            {
              event: 'reach',
              skill: {
                skillId: 'chr_0035_liino_normal_skill_projhit_start_vfx04',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0.1, hit_cnt: 0, poise: 5 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_9' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      mergeContextTargets_2: {
                        action: {
                          kind: 'mergeContextTargets',
                          parameters: { saveToContextKey: 'smart_target', sources: [] },
                        },
                        next: null,
                      },
                      mergeContextTargets_1: {
                        action: {
                          kind: 'mergeContextTargets',
                          parameters: {
                            saveToContextKey: 'smart_target',
                            sources: [{ kind: 'target', target: 'enemy' }],
                          },
                        },
                        next: null,
                      },
                      launchProjectile_5: {
                        action: {
                          kind: 'launchProjectile',
                          parameters: {
                            finish: 'firstTickBlock',
                            recycleDelaySeconds: 0.133333340287209,
                          },
                          callbacks: [
                            {
                              event: 'block',
                              skill: {
                                skillId: 'chr_0035_liino_normal_skill_projhit_02',
                                nativeSkillType: 'normalSkill',
                                naturalDurationFrames: 4,
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
                                blackboard: { atk_scale: 0.1, hit_cnt: 1, poise: 2 },
                                scheduledSequences: [
                                  { startFrame: 0, endFrame: 4, sequence: { $sequence: null } },
                                  {
                                    startFrame: 0,
                                    endFrame: 4,
                                    sequence: { $sequence: 'dealDamage_1' },
                                  },
                                  { startFrame: 0, endFrame: 4, sequence: { $sequence: null } },
                                ],
                                actionGraph: {
                                  main: {
                                    nodes: {
                                      dealDamage_1: {
                                        action: {
                                          kind: 'dealDamage',
                                          parameters: {
                                            damageType: 'electric',
                                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                            tags: ['normalSkill'],
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
                                        expression: { kind: 'blackboard', key: 'poise' },
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
                            scopeKey:
                              'chr_0035_liino_normal_skill_projhit_start_vfx04.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].failActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx_04',
                            lifetime: 'execution',
                            initialValues: {},
                            inheritParent: true,
                            entityInitialValues: {},
                          },
                          body: { $sequence: 'launchProjectile_5' },
                        },
                        next: null,
                      },
                      withActionBlackboardScope_4: {
                        action: {
                          kind: 'withActionBlackboardScope',
                          parameters: {
                            scopeKey:
                              'chr_0035_liino_normal_skill_projhit_start_vfx04.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].succeedActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx_04',
                            lifetime: 'execution',
                            initialValues: {},
                            inheritParent: true,
                            entityInitialValues: {},
                          },
                          body: { $sequence: 'launchProjectile_5' },
                        },
                        next: null,
                      },
                      forEachContextTarget_6: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { contextKey: 'smart_target' },
                          body: { $sequence: 'withActionBlackboardScope_4' },
                        },
                        next: null,
                      },
                      conditional_8: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_1' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'forEachContextTarget_6' },
                          whenFalse: { $sequence: 'withActionBlackboardScope_7' },
                        },
                        next: null,
                      },
                      conditional_9: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                          whenTrue: { $sequence: 'mergeContextTargets_1' },
                          whenFalse: { $sequence: 'mergeContextTargets_2' },
                        },
                        next: 'conditional_8',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'contextTargetCountCompare',
                          contextKey: 'smart_target',
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0035_liino_normalskill_spelllnfliction_check'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
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
      withActionBlackboardScope_10: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_9' },
        },
        next: null,
      },
      withActionBlackboardScope_11: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_8' },
        },
        next: 'withActionBlackboardScope_10',
      },
      launchProjectile_12: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
          callbacks: [
            {
              event: 'reach',
              skill: {
                skillId: 'chr_0035_liino_normal_skill_projhit_start_vfx02',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale: 0.1, hit_cnt: 0, poise: 5 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_9' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      mergeContextTargets_2: {
                        action: {
                          kind: 'mergeContextTargets',
                          parameters: { saveToContextKey: 'smart_target', sources: [] },
                        },
                        next: null,
                      },
                      mergeContextTargets_1: {
                        action: {
                          kind: 'mergeContextTargets',
                          parameters: {
                            saveToContextKey: 'smart_target',
                            sources: [{ kind: 'target', target: 'enemy' }],
                          },
                        },
                        next: null,
                      },
                      launchProjectile_5: {
                        action: {
                          kind: 'launchProjectile',
                          parameters: {
                            finish: 'firstTickBlock',
                            recycleDelaySeconds: 0.133333340287209,
                          },
                          callbacks: [
                            {
                              event: 'block',
                              skill: {
                                skillId: 'chr_0035_liino_normal_skill_projhit_02',
                                nativeSkillType: 'normalSkill',
                                naturalDurationFrames: 4,
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
                                blackboard: { atk_scale: 0.1, hit_cnt: 1, poise: 2 },
                                scheduledSequences: [
                                  { startFrame: 0, endFrame: 4, sequence: { $sequence: null } },
                                  {
                                    startFrame: 0,
                                    endFrame: 4,
                                    sequence: { $sequence: 'dealDamage_1' },
                                  },
                                  { startFrame: 0, endFrame: 4, sequence: { $sequence: null } },
                                ],
                                actionGraph: {
                                  main: {
                                    nodes: {
                                      dealDamage_1: {
                                        action: {
                                          kind: 'dealDamage',
                                          parameters: {
                                            damageType: 'electric',
                                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                            tags: ['normalSkill'],
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
                                        expression: { kind: 'blackboard', key: 'poise' },
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
                            scopeKey:
                              'chr_0035_liino_normal_skill_projhit_start_vfx02.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].failActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx',
                            lifetime: 'execution',
                            initialValues: {},
                            inheritParent: true,
                            entityInitialValues: {},
                          },
                          body: { $sequence: 'launchProjectile_5' },
                        },
                        next: null,
                      },
                      withActionBlackboardScope_4: {
                        action: {
                          kind: 'withActionBlackboardScope',
                          parameters: {
                            scopeKey:
                              'chr_0035_liino_normal_skill_projhit_start_vfx02.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].succeedActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx',
                            lifetime: 'execution',
                            initialValues: {},
                            inheritParent: true,
                            entityInitialValues: {},
                          },
                          body: { $sequence: 'launchProjectile_5' },
                        },
                        next: null,
                      },
                      forEachContextTarget_6: {
                        action: {
                          kind: 'forEachContextTarget',
                          parameters: { contextKey: 'smart_target' },
                          body: { $sequence: 'withActionBlackboardScope_4' },
                        },
                        next: null,
                      },
                      conditional_8: {
                        action: {
                          kind: 'conditional',
                          parameters: {
                            condition: { kind: 'conditionNode', nodeId: 'data_1' },
                            alwaysNext: true,
                          },
                          whenTrue: { $sequence: 'forEachContextTarget_6' },
                          whenFalse: { $sequence: 'withActionBlackboardScope_7' },
                        },
                        next: null,
                      },
                      conditional_9: {
                        action: {
                          kind: 'conditional',
                          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
                          whenTrue: { $sequence: 'mergeContextTargets_1' },
                          whenFalse: { $sequence: 'mergeContextTargets_2' },
                        },
                        next: 'conditional_8',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'contextTargetCountCompare',
                          contextKey: 'smart_target',
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                      },
                      data_2: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_chr_0035_liino_normalskill_spelllnfliction_check'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
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
      withActionBlackboardScope_15: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_12' },
        },
        next: 'withActionBlackboardScope_6',
      },
      applyBuff_16: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_music_cd_uishow',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
          },
        },
        next: null,
      },
      jumpTimeline_17: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 1967 } },
        next: null,
      },
      adjustSkillCooldown_18: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'id', skillId: 'chr_0035_liino_normal_skill' },
            operation: 'set',
            basis: 'absoluteSeconds',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'jumpTimeline_17',
      },
      finishBuffsById_19: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
              'buff_chr_0035_liino_normalskill_music_animation_musicloop',
              'buff_chr_0035_liino_normalskill_music_cd_uishow',
            ],
            reason: 'other',
          },
        },
        next: 'adjustSkillCooldown_18',
      },
      applyBuff_20: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_music_cry_vfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_19',
      },
      conditional_21: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'applyBuff_20' },
        },
        next: null,
      },
      listenForCombatEvents_22: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0035_liino_normal_skill.actionGroupData.timelineActions[14]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_21' },
              },
            ],
          },
        },
        next: null,
      },
      finishBuffsById_24: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
              'buff_chr_0035_liino_normalskill_music_animation_musicloop',
              'buff_chr_0035_liino_normalskill_music_cd_uishow',
            ],
            reason: 'other',
          },
        },
        next: 'jumpTimeline_17',
      },
      conditional_25: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'finishBuffsById_24' },
        },
        next: null,
      },
      listenForCombatEvents_26: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0035_liino_normal_skill.actionGroupData.timelineActions[15]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_25' },
              },
            ],
          },
        },
        next: null,
      },
      calculateActionValue_27: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'normalskill_frame',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_4' },
            right: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: null,
      },
      storeCurrentTimelineFrame_28: {
        action: { kind: 'storeCurrentTimelineFrame', parameters: { outputKey: 'music_loop' } },
        next: 'calculateActionValue_27',
      },
      repeatEachTick_29: {
        action: {
          kind: 'repeatEachTick',
          parameters: { nativeTickInterval: { executeEachFrame: true, intervalSeconds: 0.1 } },
          body: { $sequence: 'storeCurrentTimelineFrame_28' },
        },
        next: null,
      },
      applyBuff_30: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_normal_skill_combo',
            ],
            copiedBlackboardAssignments: {
              music_frame: 'normalskill_frame',
              heal_rate: 'heal_rate',
              heal_value: 'heal_value',
              atk_scale_2: 'atk_scale_2',
              hit_tigger: 'atk_trigger',
            },
          },
        },
        next: null,
      },
      applyBuff_31: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_spelllnfliction_check',
            target: 'enemy',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'applyBuff_30',
      },
      applyBuff_32: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_music_damage',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
            copiedBlackboardAssignments: {
              vfx_music_duration: 'music_duration',
              atk_scale: 'atk_scale_3',
              heal_value: 'heal_value',
              heal_rate: 'heal_rate',
            },
          },
        },
        next: null,
      },
      applyBuff_33: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_music_tag',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
            copiedBlackboardAssignments: {
              duration: 'music_duration',
              atk_up: 'atk_up',
              healtaken_rate: 'healtaken_rate',
              shelter: 'shelter',
              shelter_duration: 'shelter_duration',
              talent_a: 'talent_a',
            },
          },
        },
        next: 'applyBuff_32',
      },
      applyBuff_35: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_34: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide',
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      applyBuff_37: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_attack',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_36: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_attack',
            inheritToNextSkillIds: [
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_38: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_36' },
          whenFalse: { $sequence: 'applyBuff_37' },
        },
        next: null,
      },
      conditional_39: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_7' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_34' },
          whenFalse: { $sequence: 'applyBuff_35' },
        },
        next: 'conditional_38',
      },
      applyBuff_40: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      applyBuff_42: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_41: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_audio',
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_43: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_41' },
          whenFalse: { $sequence: 'applyBuff_42' },
        },
        next: null,
      },
      applyBuff_44: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      changeResourceByActionValue_45: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'valueNode', nodeId: 'data_9' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: null,
      },
      finishBuffsById_46: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0035_liino_potential_enterfight'],
            reason: 'other',
          },
        },
        next: 'changeResourceByActionValue_45',
      },
      conditional_47: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_10' }, alwaysNext: true },
          whenTrue: { $sequence: 'finishBuffsById_46' },
        },
        next: null,
      },
      gainSquadUltimateEnergyFromSkillCost_48: {
        action: { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'set_cd' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0035_liino_normalskill_end_active'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0035_liino_normalskill_end'] },
      },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'music_loop' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'frame_radio' } },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_attack'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_7: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_audio'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'potential_atb_return' } },
      data_10: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_potential_enterfight'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const liinoChr_0035_liino_normal_skill: SkillDefinition = {
  key: 'chr_0035_liino_normal_skill',
  blackboard: {
    atb_return: 0,
    atk_scale: [0.18, 0.2, 0.21, 0.23, 0.25, 0.27, 0.28, 0.3, 0.32, 0.34, 0.37, 0.4],
    atk_scale_2: [0.09, 0.1, 0.11, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.2],
    atk_scale_3: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_trigger: 10,
    atk_up: [0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.1],
    frame_radio: 30,
    heal_rate: [18, 21.6, 25.2, 28.8, 30.6, 32.4, 34.2, 36, 37.8, 38.7, 39.6, 40.5],
    heal_value: [0.04, 0.05, 0.06, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.09, 0.09],
    healtaken_rate: 0,
    music_duration: 60,
    music_loop: 0,
    normalskill_frame: 0,
    poise: 0.5,
    potential_atb_return: 0,
    set_cd: 3,
    shelter: 0,
    shelter_duration: 0,
    talent_a: 0,
    talent_b: 0,
  },
  timelineBlockFrames: 50,
  naturalDurationFrames: 2100,
  exclusiveFrame: 1821,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 50,
        endFrame: 1872,
        skillIds: ['chr_0035_liino_combo_skill', 'chr_0035_liino_normal_skill_end'],
      },
      {
        startFrame: 1959,
        endFrame: 2092,
        skillIds: ['chr_0035_liino_combo_skill', 'chr_0035_liino_normal_skill_end'],
      },
      {
        startFrame: 1817,
        endFrame: 1872,
        skillIds: [
          'chr_0035_liino_combo_skill',
          'chr_0035_liino_normal_skill',
          'chr_0035_liino_power_attack',
        ],
      },
      {
        startFrame: 2024,
        endFrame: 2092,
        skillIds: [
          'chr_0035_liino_combo_skill',
          'chr_0035_liino_normal_skill',
          'chr_0035_liino_power_attack',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 1691, endFrame: 1694, sequence: { $sequence: 'finishBuffsById_1' } },
    { startFrame: 1967, endFrame: 1967, sequence: { $sequence: 'finishBuffsById_2' } },
    { startFrame: 1929, endFrame: 1931, sequence: { $sequence: 'finishTimeline_3' } },
    { startFrame: 12, endFrame: 12, sequence: { $sequence: 'withActionBlackboardScope_7' } },
    { startFrame: 16, endFrame: 16, sequence: { $sequence: 'withActionBlackboardScope_11' } },
    { startFrame: 14, endFrame: 14, sequence: { $sequence: 'withActionBlackboardScope_15' } },
    { startFrame: 0, endFrame: 1815, sequence: { $sequence: 'applyBuff_16' } },
    { startFrame: 90, endFrame: 1815, sequence: { $sequence: 'listenForCombatEvents_22' } },
    { startFrame: 90, endFrame: 1815, sequence: { $sequence: 'listenForCombatEvents_26' } },
    { startFrame: 45, endFrame: 1691, sequence: { $sequence: 'repeatEachTick_29' } },
    { startFrame: 45, endFrame: 1691, sequence: { $sequence: 'applyBuff_31' } },
    { startFrame: 15, endFrame: 1815, sequence: { $sequence: 'applyBuff_33' } },
    { startFrame: 0, endFrame: 1804, sequence: { $sequence: 'conditional_39' } },
    { startFrame: 6, endFrame: 1804, sequence: { $sequence: 'applyBuff_40' } },
    { startFrame: 0, endFrame: 1804, sequence: { $sequence: 'conditional_43' } },
    { startFrame: 6, endFrame: 1804, sequence: { $sequence: 'applyBuff_44' } },
    { startFrame: 0, endFrame: 2, sequence: { $sequence: 'conditional_47' } },
    {
      startFrame: 15,
      endFrame: 18,
      sequence: { $sequence: 'gainSquadUltimateEnergyFromSkillCost_48' },
    },
  ],
  costs: [{ resource: 'sp', value: 25 }],
  timelineBlockFollowUpSkillId: 'chr_0035_liino_normal_skill_end',
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'normalSkill',
  actionGraph: liinoChr_0035_liino_normal_skillActionGraph,
};

export const liinoChr_0035_liino_normal_skill_endActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_skill_end',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const liinoChr_0035_liino_normal_skill_end: SkillDefinition = {
  actionGraph: liinoChr_0035_liino_normal_skill_endActionGraph,
  key: 'chr_0035_liino_normal_skill_end',
  blackboard: { atk_scale: 1, atk_up: 0.5 },
  timelineBlockFrames: 1,
  naturalDurationFrames: 1,
  exclusiveFrame: 0,
  offsetRecordFrame: 0,
  costFrame: 0,
  scheduledSequences: [],
  switchToBuffCast: {
    currentSkillTypes: ['battleSkill', 'ultimate'],
    asSkillCast: false,
    sequence: { $sequence: 'applyBuff_1' },
  },
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'extraActiveSkill',
};

export const liinoChr_0035_liino_normal_skill_comboActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
              'buff_chr_0035_liino_normalskill_music_animation_musicloop',
              'buff_chr_0035_liino_normalskill_music_animation_hitl',
              'buff_chr_0035_liino_normalskill_music_animation_hitr',
            ],
            reason: 'other',
          },
        },
        next: null,
      },
      jumpTimeline_2: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 1938 } },
        next: null,
      },
      finishTimeline_3: { action: { kind: 'finishTimeline', parameters: {} }, next: null },
      adjustSkillCooldown_5: {
        action: {
          kind: 'adjustSkillCooldown',
          parameters: {
            target: 'caster',
            skill: { kind: 'id', skillId: 'chr_0035_liino_normal_skill' },
            operation: 'set',
            basis: 'absoluteSeconds',
            value: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: 'jumpTimeline_2',
      },
      finishBuffsById_6: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
              'buff_chr_0035_liino_normalskill_music_animation_musicloop',
              'buff_chr_0035_liino_normalskill_music_cd_uishow',
            ],
            reason: 'other',
          },
        },
        next: 'adjustSkillCooldown_5',
      },
      applyBuff_7: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_music_cry_vfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_6',
      },
      conditional_8: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'applyBuff_7' },
        },
        next: null,
      },
      listenForCombatEvents_9: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0035_liino_normal_skill_combo.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_8' },
              },
            ],
          },
        },
        next: null,
      },
      finishBuffsById_11: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: [
              'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
              'buff_chr_0035_liino_normalskill_music_animation_musicloop',
              'buff_chr_0035_liino_normalskill_music_cd_uishow',
            ],
            reason: 'other',
          },
        },
        next: 'jumpTimeline_2',
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'finishBuffsById_11' },
        },
        next: null,
      },
      listenForCombatEvents_13: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0035_liino_normal_skill_combo.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_12' },
              },
            ],
          },
        },
        next: null,
      },
      storeCurrentTimelineFrame_15: {
        action: { kind: 'storeCurrentTimelineFrame', parameters: { outputKey: 'music_loop' } },
        next: null,
      },
      repeatEachTick_16: {
        action: {
          kind: 'repeatEachTick',
          parameters: { nativeTickInterval: { executeEachFrame: true, intervalSeconds: 0.1 } },
          body: { $sequence: 'storeCurrentTimelineFrame_15' },
        },
        next: null,
      },
      inheritBuffById_17: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_music_cd_uishow',
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      inheritBuffById_18: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: 'inheritBuffById_17',
      },
      inheritBuffById_19: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_music_damage',
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: 'inheritBuffById_18',
      },
      inheritBuffById_20: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_music_tag',
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: 'inheritBuffById_19',
      },
      applyBuff_22: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0035_liino_normal_skill', 'chr_0035_liino_combo_skill'],
          },
        },
        next: null,
      },
      inheritBuffById_21: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide',
            inheritToNextSkillIds: ['chr_0035_liino_normal_skill', 'chr_0035_liino_combo_skill'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_23: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_21' },
          whenFalse: { $sequence: 'applyBuff_22' },
        },
        next: null,
      },
      applyBuff_24: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
          },
        },
        next: null,
      },
      applyBuff_25: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      applyBuff_28: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_27: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_audio',
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_29: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_5' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_27' },
          whenFalse: { $sequence: 'applyBuff_28' },
        },
        next: null,
      },
      applyBuff_31: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
          },
        },
        next: null,
      },
      inheritBuffById_30: {
        action: {
          kind: 'inheritBuffById',
          parameters: {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_showhide_audio',
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack3',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_combo_skill',
              'chr_0035_liino_power_attack',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          },
        },
        next: null,
      },
      conditional_32: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_6' }, alwaysNext: true },
          whenTrue: { $sequence: 'inheritBuffById_30' },
          whenFalse: { $sequence: 'applyBuff_31' },
        },
        next: null,
      },
      applyBuff_33: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'set_cd' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffIdMatch',
          buffIds: ['buff_chr_0035_liino_normalskill_end_active'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0035_liino_normalskill_end'] },
      },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_5: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_audio'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_6: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_showhide_audio'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const liinoChr_0035_liino_normal_skill_combo: SkillDefinition = {
  key: 'chr_0035_liino_normal_skill_combo',
  blackboard: {
    atk_scale: [0.18, 0.2, 0.21, 0.23, 0.25, 0.27, 0.28, 0.3, 0.32, 0.34, 0.37, 0.4],
    atk_scale_2: [0.09, 0.1, 0.11, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.2],
    atk_scale_3: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_up: 0.08,
    heal_rate: [18, 21.6, 25.2, 28.8, 30.6, 32.4, 34.2, 36, 37.8, 38.7, 39.6, 40.5],
    heal_value: [0.04, 0.05, 0.06, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.09, 0.09],
    music_loop: 0,
    set_cd: 3,
    shelter: 0,
    shelter_duration: 0,
    talent_a: 0,
    talent_b: 0,
  },
  timelineBlockFrames: 1723,
  naturalDurationFrames: 2100,
  exclusiveFrame: 1954,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      {
        startFrame: 0,
        endFrame: 1800,
        skillIds: ['chr_0035_liino_normal_skill_end', 'chr_0035_liino_combo_skill'],
      },
      {
        startFrame: 1723,
        endFrame: 1800,
        skillIds: ['chr_0035_liino_normal_skill_end', 'chr_0035_liino_normal_skill'],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 1938, endFrame: 1938, sequence: { $sequence: 'finishBuffsById_1' } },
    { startFrame: 1800, endFrame: 1801, sequence: { $sequence: 'jumpTimeline_2' } },
    { startFrame: 1801, endFrame: 1803, sequence: { $sequence: 'finishTimeline_3' } },
    { startFrame: 0, endFrame: 1800, sequence: { $sequence: 'listenForCombatEvents_9' } },
    { startFrame: 0, endFrame: 1800, sequence: { $sequence: 'listenForCombatEvents_13' } },
    { startFrame: 0, endFrame: 1801, sequence: { $sequence: 'repeatEachTick_16' } },
    { startFrame: 0, endFrame: 1800, sequence: { $sequence: 'inheritBuffById_20' } },
    { startFrame: 0, endFrame: 1800, sequence: { $sequence: 'conditional_23' } },
    { startFrame: 1862, endFrame: 1962, sequence: { $sequence: 'applyBuff_24' } },
    { startFrame: 0, endFrame: 1800, sequence: { $sequence: 'applyBuff_25' } },
    { startFrame: 1862, endFrame: 1961, sequence: { $sequence: 'applyBuff_25' } },
    { startFrame: 0, endFrame: 1800, sequence: { $sequence: 'conditional_29' } },
    { startFrame: 1862, endFrame: 1962, sequence: { $sequence: 'conditional_32' } },
    { startFrame: 0, endFrame: 1800, sequence: { $sequence: 'applyBuff_33' } },
    { startFrame: 1862, endFrame: 1961, sequence: { $sequence: 'applyBuff_33' } },
  ],
  timelineBlockFollowUpSkillId: 'chr_0035_liino_normal_skill_end',
  skillType: 'battleSkill',
  levelSource: 'battleSkill',
  nativeSkillType: 'extraActiveSkill',
  actionGraph: liinoChr_0035_liino_normal_skill_comboActionGraph,
};

export const liinoChr_0035_liino_ultimate_skillActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0035_liino_normalskill_music_animation_musicloop'],
            reason: 'other',
          },
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
      findCharacterTeamTargets_4: {
        action: {
          kind: 'findCharacterTeamTargets',
          parameters: { saveToContextKey: 'mainchar', selection: { kind: 'controlledOperator' } },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' }, alwaysNext: true },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: 'findCharacterTeamTargets_4' },
        },
        next: null,
      },
      spawnAbilityEntity_7: {
        action: {
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'abilityentity_chr_0035_liino_ult_skill_projhit',
            childSkillId: 'chr_0035_liino_ultimate_skill_projhit_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          },
        },
        next: null,
      },
      applyBuff_8: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_ultskill_music_heal_start',
            target: 'party',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              heal_value: 'ultheal03_value',
              heal_rate: 'ultheal03_rate',
            },
          },
        },
        next: null,
      },
      applyBuff_9: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_ultskill_music_heal',
            target: 'party',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              heal_value: 'ultheal02_value',
              heal_rate: 'ultheal02_rate',
            },
          },
        },
        next: null,
      },
      calculateActionValue_10: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'ultheal02_value',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'applyBuff_9',
      },
      calculateActionValue_11: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'ultheal02_rate',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_4' },
            right: { kind: 'valueNode', nodeId: 'data_5' },
          },
        },
        next: 'calculateActionValue_10',
      },
      launchProjectile_12: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 0.4,
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0035_liino_ultimate_skill_soundwave_02_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale_4: 0.1, poise: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_3' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_physical_no_guard',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
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
                      dealDamage_3: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                            tags: ['ultimateSkill'],
                          },
                        },
                        next: 'conditional_2',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0035_liino_chrdung_armorbreak'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_4' },
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
      withActionBlackboardScope_13: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_12' },
        },
        next: null,
      },
      calculateActionValue_14: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'atk_scale_4',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_6' },
            right: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'withActionBlackboardScope_13',
      },
      applyBuff_15: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_ultskill_refrainobtainusp',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      changeSkillSlot_16: {
        action: {
          kind: 'changeSkillSlot',
          parameters: {
            skillGroupKey: 'battleSkill',
            targetSkillKey: 'chr_0035_liino_normal_skill_end',
            inheritOriginSkillCooldownProgress: true,
            lifetime: 'finishByAction',
            revertedSkillKey: 'chr_0035_liino_normal_skill',
          },
        },
        next: null,
      },
      jumpTimeline_17: {
        action: { kind: 'jumpTimeline', parameters: { destinationFrame: 540 } },
        next: null,
      },
      finishBuffsById_18: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'caster',
            buffIds: ['buff_chr_0035_liino_normalskill_music_animation_musicloop'],
            reason: 'other',
          },
        },
        next: 'jumpTimeline_17',
      },
      applyBuff_19: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_music_cry_vfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: 'finishBuffsById_18',
      },
      conditional_20: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'applyBuff_19' },
        },
        next: null,
      },
      listenForCombatEvents_21: {
        action: {
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'SkillData.chr_0035_liino_ultimate_skill.actionGroupData.timelineActions[18]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: { $sequence: 'conditional_20' },
              },
            ],
          },
        },
        next: null,
      },
      applyBuff_23: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_ultskill_music_tag',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: {
              duration: 'ultmusic_duration',
              finish_duration: 'finish_duration',
              atk_up: 'atk_up',
              spellenhance_rate: 'fnlatk_up',
              talent_a: 'talent_a',
              shelter: 'shelter',
              shelter_duration: 'shelter_duration',
              healtaken_rate: 'healtaken_rate',
            },
          },
        },
        next: null,
      },
      modifyActionValue_24: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'fnlatk_up',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'data_9' },
          },
        },
        next: 'applyBuff_23',
      },
      conditional_25: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_12' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_23' },
          whenFalse: { $sequence: 'modifyActionValue_24' },
        },
        next: null,
      },
      storeSourceAttributeValue_26: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'will' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_13' },
            base: { kind: 'constant', value: 0 },
            targetKey: 'fnlatk_up',
          },
        },
        next: 'conditional_25',
      },
      applyBuff_27: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_ultskill_music_damage',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
            copiedBlackboardAssignments: {
              vfx_music_duration: 'ultmusic_duration',
              atk_scale_3: 'atk_scale_3',
              music_damage_trigger: 'ultmusic_trigger',
              ultheal_value: 'ultheal_value',
              ultheal_rate: 'ultheal_rate',
            },
          },
        },
        next: null,
      },
      applyBuff_28: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      applyBuff_29: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
              'chr_0035_liino_attack3',
            ],
          },
        },
        next: null,
      },
      applyBuff_30: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          },
        },
        next: null,
      },
      applyBuff_31: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_damage_immune_medium',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          },
        },
        next: null,
      },
      hideUi_32: { action: { kind: 'hideUi', parameters: { onlyBlockInput: false } }, next: null },
      startUltimateTimeDilation_33: {
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
    },
    dataNodes: {
      data_1: { type: 'boolean', expression: { kind: 'casterControlled' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'ultheal_value' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'final_value' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'ultheal_rate' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'final_value' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_3' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'final_value' } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0035_liino_ultskill_end'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'will_max' } },
      data_10: {
        type: 'number',
        expression: { kind: 'blackboard', key: 'fnlatk_up', fallback: 0 },
      },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'will_max', fallback: 0 } },
      data_12: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_10' },
          operator: 'lessOrEqual',
          right: { kind: 'valueNode', nodeId: 'data_11' },
        },
      },
      data_13: { type: 'number', expression: { kind: 'blackboard', key: 'will_up' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const liinoChr_0035_liino_ultimate_skill: SkillDefinition = {
  key: 'chr_0035_liino_ultimate_skill',
  blackboard: {
    atk_scale: [0.07, 0.08, 0.09, 0.09, 0.1, 0.11, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16],
    atk_scale_2: [2.84, 3.13, 3.41, 3.7, 3.98, 4.27, 4.55, 4.83, 5.12, 5.47, 5.9, 6.4],
    atk_scale_3: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.42, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_4: 0,
    atk_up: 0.1,
    final_value: 3,
    finish_duration: 0,
    fnlatk_up: 0,
    healtaken_rate: 0,
    music_loop: 0,
    poise: 20,
    potential_2: 0,
    pulse_vul_duration: 0,
    pulse_vul_rate: 0,
    radius: 5,
    shelter: 0,
    shelter_duration: 0,
    shelter_teammate: 0,
    spell_vulnerable_rate: 0,
    spellenhance_rate: 0.2,
    talent_a: 0,
    talent_b: 0,
    talent0_usp: 0,
    teammate_rate: 0,
    ultheal_rate: [36, 43.2, 50.4, 57.6, 61.2, 64.8, 68.4, 72, 75.6, 77.4, 79.2, 81],
    ultheal_value: [0.08, 0.1, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.18, 0.18, 0.19],
    ultheal02_rate: 0,
    ultheal02_value: 0,
    ultheal03_rate: [324, 388.8, 453.6, 518.4, 550.8, 583.2, 615.6, 648, 680.4, 696.6, 712.8, 729],
    ultheal03_value: [0.76, 0.91, 1.06, 1.21, 1.29, 1.36, 1.44, 1.51, 1.59, 1.63, 1.66, 1.7],
    ultmusic_atk_ratio: 0.5,
    ultmusic_duration: 15,
    ultmusic_trigger: 1.5,
    will_max: [0.4, 0.4, 0.4, 0.4, 0.45, 0.45, 0.45, 0.45, 0.45, 0.5, 0.55, 0.6],
    will_up: [
      0.00018, 0.0002, 0.00021, 0.00023, 0.00025, 0.00027, 0.00028, 0.0003, 0.00032, 0.00034,
      0.00037, 0.0004,
    ],
    display_atk_scale: [1.42, 1.56, 1.71, 1.85, 1.99, 2.13, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2],
  },
  timelineBlockFrames: 77,
  naturalDurationFrames: 660,
  exclusiveFrame: 543,
  offsetRecordFrame: 0,
  inputWindows: {
    allowedNextSkills: [
      { startFrame: 77, endFrame: 527, skillIds: ['chr_0035_liino_normal_skill_end'] },
      { startFrame: 163, endFrame: 527, skillIds: ['chr_0035_liino_combo_skill'] },
      {
        startFrame: 527,
        endFrame: 580,
        skillIds: [
          'chr_0035_liino_normal_skill',
          'chr_0035_liino_combo_skill',
          'chr_0035_liino_attack1',
        ],
      },
    ],
  },
  costFrame: 0,
  scheduledSequences: [
    { startFrame: 407, endFrame: 408, sequence: { $sequence: 'finishBuffsById_1' } },
    { startFrame: 540, endFrame: 541, sequence: { $sequence: 'finishBuffsById_1' } },
    { startFrame: 0, endFrame: 30, sequence: { $sequence: 'startTimeDilation_3' } },
    { startFrame: 0, endFrame: 1, sequence: { $sequence: 'conditional_5' } },
    { startFrame: 76, endFrame: 76, sequence: { $sequence: 'spawnAbilityEntity_7' } },
    { startFrame: 80, endFrame: 80, sequence: { $sequence: 'applyBuff_8' } },
    { startFrame: 513, endFrame: 514, sequence: { $sequence: 'calculateActionValue_11' } },
    { startFrame: 508, endFrame: 508, sequence: { $sequence: 'calculateActionValue_14' } },
    { startFrame: 77, endFrame: 527, sequence: { $sequence: 'applyBuff_15' } },
    { startFrame: 77, endFrame: 527, sequence: { $sequence: 'changeSkillSlot_16' } },
    { startFrame: 137, endFrame: 527, sequence: { $sequence: 'listenForCombatEvents_21' } },
    { startFrame: 77, endFrame: 527, sequence: { $sequence: 'storeSourceAttributeValue_26' } },
    { startFrame: 77, endFrame: 477, sequence: { $sequence: 'applyBuff_27' } },
    { startFrame: 77, endFrame: 520, sequence: { $sequence: 'applyBuff_28' } },
    { startFrame: 64, endFrame: 523, sequence: { $sequence: 'applyBuff_29' } },
    { startFrame: 77, endFrame: 520, sequence: { $sequence: 'applyBuff_30' } },
    { startFrame: 0, endFrame: 80, sequence: { $sequence: 'applyBuff_31' } },
    { startFrame: 0, endFrame: 77, sequence: { $sequence: 'hideUi_32' } },
    { startFrame: 0, endFrame: 77, sequence: { $sequence: 'startUltimateTimeDilation_33' } },
  ],
  cooldownFrames: 600,
  costs: [{ resource: 'ultimateEnergy', value: 160 }],
  timelineBlockFollowUpSkillId: 'chr_0035_liino_normal_skill_end',
  skillType: 'ultimate',
  levelSource: 'ultimate',
  nativeSkillType: 'ultimateSkill',
  actionGraph: liinoChr_0035_liino_ultimate_skillActionGraph,
};

export const liinoCommon_character_perfect_dodgeActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

export const liinoCommon_character_perfect_dodge: SkillDefinition = {
  actionGraph: liinoCommon_character_perfect_dodgeActionGraph,
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

const liinoComboCondition1ActionGraph = {
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
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'conditional_1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffTagIdCountCompare',
          target: 'caster',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/chr_0035_liino/NormalSkillMusic'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: [
            'Skill/Character/Common/SpellStatus',
            'Skill/Character/Common/SpellStatus/Conduct',
            'Skill/Character/Common/SpellStatus/Frozen',
            'Skill/Character/Common/SpellStatus/Burning',
            'Skill/Character/Common/SpellStatus/Corrupt',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoComboCondition1: ComboSkillConditionDefinition = {
  key: 'native-combo:0',
  skillKey: 'chr_0035_liino_combo_skill',
  event: 'addedBuff',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_2' },
  actionGraph: liinoComboCondition1ActionGraph,
};

const liinoComboCondition2ActionGraph = {
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
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'conditional_1' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffTagIdCountCompare',
          target: 'caster',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/chr_0035_liino/NormalSkillMusic'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'eventBuffTagsMatch',
          match: 'hasAny',
          buffTags: [
            'Skill/Character/Common/SpellStatus',
            'Skill/Character/Common/SpellStatus/Conduct',
            'Skill/Character/Common/SpellStatus/Frozen',
            'Skill/Character/Common/SpellStatus/Burning',
            'Skill/Character/Common/SpellStatus/Corrupt',
          ],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoComboCondition2: ComboSkillConditionDefinition = {
  key: 'native-combo:1',
  skillKey: 'chr_0035_liino_combo_skill',
  event: 'buffEndsEarly',
  immediately: false,
  initialValues: null,
  sequence: { $sequence: 'conditional_2' },
  actionGraph: liinoComboCondition2ActionGraph,
};

const liinoBuff1ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff1: SkillBuffDefinition = {
  stackingType: 'highPriority',
  stackingKey: 'liino_atk_up',
  priority: { blackboardKey: 'atk_up' },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_atk_up',
    iconPath: '/icons/icon_battle_buff_atk_up.webp',
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
  blackboard: { atk_up: 0, duration: 0, spellenhance_rate: 0 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
  ],
  actionGraph: liinoBuff1ActionGraph,
};

const liinoBuff2ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff2: SkillBuffDefinition = {
  stackingType: 'highPriority',
  stackingKey: 'liino_atk_up',
  priority: { blackboardKey: 'atk_up' },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_atk_up',
    iconPath: '/icons/icon_battle_buff_atk_up.webp',
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
  blackboard: { atk_up: 0, duration: 0, spellenhance_rate: 0 },
  attributeModifiers: [
    { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
  ],
  actionGraph: liinoBuff2ActionGraph,
};

const liinoBuff3ActionGraph = {
  main: {
    nodes: {
      finishParentGlobalBuff_1: {
        action: { kind: 'finishParentGlobalBuff', parameters: { reason: 'early' } },
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
            spGainKind: 'refund',
            spGainSource: 'skill',
          },
        },
        next: 'finishParentGlobalBuff_1',
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' } },
          whenTrue: { $sequence: 'changeResourceByActionValue_2' },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_3' } },
          whenTrue: { $sequence: 'conditional_5' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'characterTypeIn',
          target: 'buffOwner',
          characterTypes: ['electric', 'nature'],
        },
      },
      data_3: {
        type: 'boolean',
        expression: { kind: 'eventSkillTypeIn', skillTypes: ['battleSkill'] },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff3: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'imbue_scale', negate: true },
  maxStackCount: 99,
  triggerIntervalSeconds: 0,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_liino_inspire',
    iconPath: '/icons/icon_battle_buff_liino_inspire.webp',
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
  blackboard: { atb_return: 0, duration: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'afterSkillApplyCost', priority: 0, sequence: { $sequence: 'conditional_6' } },
  ],
  actionGraph: liinoBuff3ActionGraph,
};

const liinoBuff4ActionGraph = {
  main: {
    nodes: {
      finishBuffsById_1: {
        action: {
          kind: 'finishBuffsById',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0035_liino_normalskill_music_animation_musicloop'],
            reason: 'other',
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
      dealDamage_3: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
          },
        },
        next: null,
      },
      changeResourceByActionValue_4: {
        action: {
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'ultimateEnergy',
            amount: { kind: 'valueNode', nodeId: 'data_2' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          },
        },
        next: null,
      },
      heal_5: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'controlledOperator',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            amount: { kind: 'valueNode', nodeId: 'data_3' },
          },
        },
        next: 'changeResourceByActionValue_4',
      },
      storeSourceAttributeValue_6: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'agility' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'valueNode', nodeId: 'data_4' },
            base: { kind: 'valueNode', nodeId: 'data_5' },
            targetKey: 'final_heal_value',
          },
        },
        next: 'heal_5',
      },
      dealDamage_7: {
        action: {
          kind: 'dealDamage',
          parameters: {
            damageType: 'electric',
            attackScale: { kind: 'valueNode', nodeId: 'data_6' },
            tags: ['comboSkill'],
            features: ['canBreakWeakness'],
            stagger: { kind: 'valueNode', nodeId: 'data_7' },
          },
        },
        next: 'storeSourceAttributeValue_6',
      },
      createGlobalBuff_8: {
        action: {
          kind: 'createGlobalBuff',
          parameters: {
            globalBuffId: 'global_buff_liino_combo_atb_return',
            definition: {
              stackingType: 'stack',
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              applyIconDurationToBuffs: true,
              blackboard: { atb_return: 0, duration: 0 },
              children: [
                {
                  buffId: 'buff_chr_0035_liino_combo_atb_return',
                  blackboardAssignments: {
                    atb_return: { kind: 'valueNode', nodeId: 'data_8' },
                    duration: { kind: 'valueNode', nodeId: 'data_9' },
                  },
                },
              ],
            },
            source: 'buffOwner',
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_10' },
              atb_return: { kind: 'valueNode', nodeId: 'data_11' },
            },
          },
        },
        next: null,
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_13' } },
          whenTrue: { $sequence: 'createGlobalBuff_8' },
        },
        next: null,
      },
      readBuffRemainingDuration_10: {
        action: {
          kind: 'readBuffRemainingDuration',
          parameters: {
            target: 'buffOwner',
            buffIds: ['buff_chr_0035_liino_normalskill_music_tag'],
            outputKey: 'remainingtime',
          },
        },
        next: null,
      },
      modifyActionValue_11: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'normal_combo',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          },
        },
        next: 'readBuffRemainingDuration_10',
      },
      conditional_12: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_14' } },
          whenTrue: { $sequence: 'modifyActionValue_11' },
        },
        next: null,
      },
      startTimeDilation_13: {
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
      startTimeDilation_14: {
        action: {
          kind: 'startTimeDilation',
          parameters: {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.9333 },
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
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'usp' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'final_heal_value' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'heal_value' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'heal_rate' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'atk_scale_2' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'poise' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return_duration' } },
      data_11: { type: 'number', expression: { kind: 'blackboard', key: 'atb_return' } },
      data_12: { type: 'number', expression: { kind: 'blackboard', key: 'talent_b', fallback: 0 } },
      data_13: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_12' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
      data_14: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0035_liino_normalskill_music_tag'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff4: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  timeClock: 'global',
  applyTags: [],
  extendTags: [],
  blackboard: {
    atb_return: 5,
    atb_return_duration: 30,
    atk_scale: 1,
    atk_scale_2: 0,
    cam_angle: 0,
    cam_duration: 0,
    combo_duration: 0,
    duration: 3,
    final_heal_value: 0,
    heal_rate: 0,
    heal_value: 0,
    input_angle: 0,
    normal_combo: 0,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    poise: 10,
    radius: 4,
    remainingtime: 0,
    talent_b: 0,
    time_duration: 0,
    time_ratio: 0,
    usp: 0,
  },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 0, endFrame: 68, sequence: { $sequence: 'finishBuffsById_1' } },
    { startFrame: 0, endFrame: 3, sequence: { $sequence: 'findCharacterTeamTargets_2' } },
    { startFrame: 9, endFrame: 13, sequence: { $sequence: 'dealDamage_3' } },
    { startFrame: 33, endFrame: 37, sequence: { $sequence: 'dealDamage_7' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_9' } },
    { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_12' } },
    { startFrame: 0, endFrame: 7, sequence: { $sequence: 'startTimeDilation_13' } },
    { startFrame: 0, endFrame: 25, sequence: { $sequence: 'startTimeDilation_14' } },
  ],
  actionGraph: liinoBuff4ActionGraph,
};

const liinoBuff5ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_atkup',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff5: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0, duration: -1, finish_duration: 0, spellenhance_rate: 0.2 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: liinoBuff5ActionGraph,
};

const liinoBuff6ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff6: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 1 },
  attributeModifiers: [],
  actionGraph: liinoBuff6ActionGraph,
};

const liinoBuff7ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff7: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 1 },
  attributeModifiers: [],
  actionGraph: liinoBuff7ActionGraph,
};

const liinoBuff8ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickBlock', recycleDelaySeconds: 0.133333340287209 },
          callbacks: [
            {
              event: 'block',
              skill: {
                skillId: 'chr_0035_liino_normal_skill_projhit_hit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 4,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale_2: 0, hit_cnt: 1, poise: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 4, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 4, sequence: { $sequence: 'dealDamage_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                          },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_2' },
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
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitl.timelineActions[2]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_l',
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
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitl.timelineActions[3]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_l_vfx02',
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      withActionBlackboardScope_6: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitl.timelineActions[4]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_r',
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      withActionBlackboardScope_8: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitl.timelineActions[5]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_r_vfx02',
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      withActionBlackboardScope_10: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitl.timelineActions[6]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_l_vfx01',
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      withActionBlackboardScope_12: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitl.timelineActions[7]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_r_vfx01',
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

const liinoBuff8: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'vfx_music_duration' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    animation_starttime_key: 0,
    atk_scale_2: 0,
    heal_rate: 200,
    heal_value: 0.2,
    music_frame: 0,
    vfx_music_duration: 20,
  },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 24, endFrame: 24, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 32, endFrame: 32, sequence: { $sequence: 'withActionBlackboardScope_4' } },
    { startFrame: 25, endFrame: 25, sequence: { $sequence: 'withActionBlackboardScope_6' } },
    { startFrame: 33, endFrame: 33, sequence: { $sequence: 'withActionBlackboardScope_8' } },
    { startFrame: 28, endFrame: 28, sequence: { $sequence: 'withActionBlackboardScope_10' } },
    { startFrame: 29, endFrame: 29, sequence: { $sequence: 'withActionBlackboardScope_12' } },
  ],
  actionGraph: liinoBuff8ActionGraph,
};

const liinoBuff9ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickBlock', recycleDelaySeconds: 0.133333340287209 },
          callbacks: [
            {
              event: 'block',
              skill: {
                skillId: 'chr_0035_liino_normal_skill_projhit_hit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 4,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: { atk_scale_2: 0, hit_cnt: 1, poise: 0 },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 4, sequence: { $sequence: null } },
                  { startFrame: 0, endFrame: 4, sequence: { $sequence: 'dealDamage_1' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      dealDamage_1: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                            tags: ['normalSkill'],
                          },
                        },
                        next: null,
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_2' },
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
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitr.timelineActions[2]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_l',
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
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitr.timelineActions[3]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_l',
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      withActionBlackboardScope_6: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitr.timelineActions[4]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_r',
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      withActionBlackboardScope_8: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitr.timelineActions[5]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_r',
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      withActionBlackboardScope_10: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitr.timelineActions[6]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_l',
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: null,
      },
      withActionBlackboardScope_12: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitr.timelineActions[7]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_r',
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

const liinoBuff9: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'vfx_music_duration' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    animation_starttime_key: 0,
    atk_scale_2: 0,
    heal_rate: 0,
    heal_value: 0,
    music_frame: 0,
    vfx_music_duration: 20,
  },
  attributeModifiers: [],
  scheduledSequences: [
    { startFrame: 24, endFrame: 24, sequence: { $sequence: 'withActionBlackboardScope_2' } },
    { startFrame: 32, endFrame: 32, sequence: { $sequence: 'withActionBlackboardScope_4' } },
    { startFrame: 25, endFrame: 25, sequence: { $sequence: 'withActionBlackboardScope_6' } },
    { startFrame: 33, endFrame: 33, sequence: { $sequence: 'withActionBlackboardScope_8' } },
    { startFrame: 28, endFrame: 28, sequence: { $sequence: 'withActionBlackboardScope_10' } },
    { startFrame: 29, endFrame: 29, sequence: { $sequence: 'withActionBlackboardScope_12' } },
  ],
  actionGraph: liinoBuff9ActionGraph,
};

const liinoBuff10ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff10: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: liinoBuff10ActionGraph,
  skillSlotReplacements: [
    {
      skillGroupKey: 'battleSkill',
      targetSkillKey: 'chr_0035_liino_normal_skill_end',
      revertedSkillKey: 'chr_0035_liino_normal_skill',
      inheritOriginSkillCooldownProgress: true,
    },
  ],
};

const liinoBuff11ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff11: SkillBuffDefinition = {
  stackingType: 'highPriority',
  stackingKey: 'liino_expression_vfx',
  priority: 0,
  maxStackCount: 1,
  durationSeconds: 1.5,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: liinoBuff11ActionGraph,
};

const liinoBuff12ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 0.45,
            recycleDelaySeconds: 0.0333333350718021,
            hit: { target: 'allOperators', finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0035_liino_normal_skill_soundwave_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale: 0.1,
                  final_heal_value: 0,
                  heal_rate: 0,
                  heal_value: 0,
                  poise: 0,
                },
                scheduledSequences: [
                  {
                    startFrame: 0,
                    endFrame: 0,
                    sequence: { $sequence: 'storeSourceAttributeValue_2' },
                  },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      heal_1: {
                        action: {
                          kind: 'heal',
                          parameters: {
                            target: 'actionInputTarget',
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
                            attribute: { kind: 'specific', key: 'agility' },
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
                    },
                    dataNodes: {
                      data_1: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'final_heal_value' },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'heal_value' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'heal_rate' },
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
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_damage.buffEventAction[0].actions[0].actionData[3]:projectile_chr_0035_liino_normal_attack_soundwave',
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
            finish: 0.45,
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0035_liino_normal_skill_soundwave_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale: 0.1,
                  final_heal_value: 0,
                  heal_rate: 0,
                  heal_value: 0,
                  poise: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'conditional_2' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_physical_no_guard',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
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
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0035_liino_chrdung_armorbreak'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
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
      withActionBlackboardScope_4: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey:
              'BuffData.buff_chr_0035_liino_normalskill_music_damage.buffEventAction[0].actions[1].actionData[1]:projectile_chr_0035_liino_normal_attack_soundwave_chrdung',
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_3' },
        },
        next: null,
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'withActionBlackboardScope_4' },
        },
        next: null,
      },
      withActionBlackboardScope_6: {
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
          body: { $sequence: 'conditional_5' },
        },
        next: null,
      },
      withActionBlackboardScope_7: {
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
          body: { $sequence: 'withActionBlackboardScope_2' },
        },
        next: 'withActionBlackboardScope_6',
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: {
          kind: 'buffIdStackCompare',
          target: 'buffOwner',
          buffIds: ['buff_chr_0035_liino_chrdung_armorbreak'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff12: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'vfx_music_duration' },
  triggerIntervalSeconds: { blackboardKey: 'music_damage_trigger' },
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale: 0.1,
    heal_rate: 0,
    heal_value: 0,
    music_damage_trigger: 3,
    vfx_music_duration: 20,
  },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'withActionBlackboardScope_7' } },
  actionGraph: liinoBuff12ActionGraph,
};

const liinoBuff13ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_atkup_owner',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration_atkup' },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_buff_atkup',
            target: 'partyExceptCaster',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { atk_up: { kind: 'valueNode', nodeId: 'data_1' } },
          },
        },
        next: 'applyBuff_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_talent_shelter_normalskill',
            target: 'party',
            finishByAction: true,
            onActionEndBuffs: [
              {
                buffId: 'buff_chr_0035_liino_talent_shelter_finishtime_normalskill',
                target: 'party',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: {
                  shelter: { kind: 'valueNode', nodeId: 'data_2' },
                  duration: { kind: 'valueNode', nodeId: 'data_3' },
                  heal_rate: { kind: 'valueNode', nodeId: 'data_4' },
                },
              },
            ],
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              shelter: { kind: 'valueNode', nodeId: 'data_5' },
              heal_rate: { kind: 'valueNode', nodeId: 'data_6' },
            },
          },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_8' } },
          whenTrue: { $sequence: 'applyBuff_3' },
        },
        next: null,
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_end',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      castSkillDuringAction_6: {
        action: {
          kind: 'castSkillDuringAction',
          parameters: {
            skillId: 'chr_0035_liino_normal_skill_combo',
            target: 'enemy',
            skipApplyCost: true,
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_7: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'castSkillDuringAction_6' },
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
          body: { $sequence: 'conditional_4' },
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
          body: { $sequence: 'applyBuff_2' },
        },
        next: 'withActionBlackboardScope_8',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'shelter' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'shelter_duration' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'healtaken_rate' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'shelter' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'healtaken_rate' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'talent_a', fallback: 0 } },
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
        expression: { kind: 'eventCustomAbilityNameMatch', eventName: 'liino_comboskill_end' },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff13: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: true,
    useWeakProgressInNormalSkillButton: true,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: true,
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: ['Skill/Character/chr_0035_liino/NormalSkillMusic'],
  extendTags: [],
  blackboard: {
    atk_up: 0,
    duration: 15,
    duration_atkup: -1,
    finish_duration: 0,
    healtaken_rate: 0,
    shelter: 0,
    shelter_duration: 0,
    shelter_teammate: 0,
    spellenhance_rate: 0,
    talent_a: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: {
    enable: { $sequence: 'withActionBlackboardScope_9' },
    finish: { $sequence: 'applyBuff_5' },
  },
  abilityEventResponses: [
    { event: 'customAbilityEvent', priority: 0, sequence: { $sequence: 'conditional_7' } },
  ],
  actionGraph: liinoBuff13ActionGraph,
};

const liinoBuff14ActionGraph = {
  main: {
    nodes: {
      createTimedMarker_1: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'buffOwner',
            markerId: 'liino_normalhit',
            durationSeconds: { kind: 'constant', value: 1 },
            autoFinishByAction: false,
            timeDomain: 'globalScaled',
          },
        },
        next: null,
      },
      conditional_2: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'createTimedMarker_1' },
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
          buffTags: ['Skill/Character/Common/SpellStatus'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff14: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 5, rate: 0 },
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'addedBuff', priority: 0, sequence: { $sequence: 'conditional_2' } },
  ],
  actionGraph: liinoBuff14ActionGraph,
};

const liinoBuff15ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_music_animation_hitl',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: {
              music_frame: 'music_frame',
              atk_scale_2: 'atk_scale_2',
              heal_rate: 'heal_rate',
              heal_value: 'heal_value',
            },
          },
        },
        next: null,
      },
      calculateActionValue_2: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'hit_check',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_1' },
            right: { kind: 'constant', value: -1 },
          },
        },
        next: 'applyBuff_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_music_animation_hitr',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: {
              music_frame: 'music_frame',
              heal_rate: 'heal_rate',
              heal_value: 'heal_value',
              atk_scale_2: 'atk_scale_2',
            },
          },
        },
        next: null,
      },
      calculateActionValue_4: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'hit_check',
            operation: 'multiply',
            left: { kind: 'valueNode', nodeId: 'data_2' },
            right: { kind: 'constant', value: -1 },
          },
        },
        next: 'applyBuff_3',
      },
      conditional_5: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_4' }, alwaysNext: true },
          whenTrue: { $sequence: 'calculateActionValue_2' },
          whenFalse: { $sequence: 'calculateActionValue_4' },
        },
        next: null,
      },
      calculateActionValue_6: {
        action: {
          kind: 'calculateActionValue',
          parameters: {
            key: 'music_frame',
            operation: 'divide',
            left: { kind: 'valueNode', nodeId: 'data_5' },
            right: { kind: 'valueNode', nodeId: 'data_6' },
          },
        },
        next: 'conditional_5',
      },
      storeCurrentTimelineFrame_7: {
        action: { kind: 'storeCurrentTimelineFrame', parameters: { outputKey: 'music_loop' } },
        next: 'calculateActionValue_6',
      },
      createTimedMarker_8: {
        action: {
          kind: 'createTimedMarker',
          parameters: {
            target: 'buffOwner',
            markerId: 'liino_normalskill_hit',
            durationSeconds: { kind: 'valueNode', nodeId: 'data_7' },
            autoFinishByAction: false,
          },
        },
        next: 'storeCurrentTimelineFrame_7',
      },
      conditional_9: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_9' } },
          whenTrue: { $sequence: 'createTimedMarker_8' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'hit_check' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'hit_check' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'hit_check', fallback: 0 } },
      data_4: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_3' },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
      },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'music_loop' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'frame_radio' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'hit_duration' } },
      data_8: {
        type: 'boolean',
        expression: {
          kind: 'timedMarkerPresent',
          target: 'buffOwner',
          markerId: 'liino_normalskill_hit',
        },
      },
      data_9: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'conditionNode', nodeId: 'data_8' } },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff15: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  triggerIntervalSeconds: { blackboardKey: 'hit_tigger' },
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale_2: 0,
    frame_radio: 30,
    heal_rate: 0,
    heal_value: 0,
    hit_animation: 0,
    hit_check: 1,
    hit_duration: 0.6,
    hit_tigger: 10,
    music_frame: 0,
    music_loop: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'conditional_9' } },
  actionGraph: liinoBuff15ActionGraph,
};

const liinoBuff16ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_potential_enterfight',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
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
          kind: 'buffStackCompare',
          target: 'caster',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/chr_0035_liino/NormalSkillMusic'],
          operator: 'lessOrEqual',
          value: { kind: 'constant', value: 0 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff16: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 1,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  abilityEventResponses: [
    { event: 'enterFight', priority: 0, sequence: { $sequence: 'conditional_2' } },
  ],
  actionGraph: liinoBuff16ActionGraph,
};

const liinoBuff17ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff17: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 1,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: liinoBuff17ActionGraph,
};

const liinoBuff18ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff18: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: liinoBuff18ActionGraph,
};

const liinoBuff19ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff19: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: liinoBuff19ActionGraph,
};

const liinoBuff20ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff20: SkillBuffDefinition = {
  stackingType: 'unique',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: liinoBuff20ActionGraph,
};

const liinoBuff21ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff21: SkillBuffDefinition = {
  stackingType: 'highPriority',
  stackingKey: 'vfx_show',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: liinoBuff21ActionGraph,
};

const liinoBuff22ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff22: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {},
  attributeModifiers: [],
  actionGraph: liinoBuff22ActionGraph,
};

const liinoBuff23ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_ultskill_end',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_end_active',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          },
        },
        next: null,
      },
      conditional_3: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_1' } },
          whenTrue: { $sequence: 'applyBuff_1' },
        },
        next: null,
      },
      conditional_4: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_2' }, alwaysNext: true },
          whenTrue: { $sequence: 'applyBuff_2' },
          whenFalse: { $sequence: 'conditional_3' },
        },
        next: null,
      },
    },
    dataNodes: {
      data_1: {
        type: 'boolean',
        expression: { kind: 'currentSkillTypeIn', target: 'buffOwner', skillTypes: ['ultimate'] },
      },
      data_2: {
        type: 'boolean',
        expression: {
          kind: 'currentSkillTypeIn',
          target: 'buffOwner',
          skillTypes: ['battleSkill'],
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff23: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 1 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'conditional_4' } },
  actionGraph: liinoBuff23ActionGraph,
};

const liinoBuff24ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_common_affixes_enhance_natural',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_1' },
              rate: { kind: 'valueNode', nodeId: 'data_2' },
            },
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
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'valueNode', nodeId: 'data_3' },
              rate: { kind: 'valueNode', nodeId: 'data_4' },
            },
          },
        },
        next: 'applyBuff_1',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'spellenhance_rate' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'duration' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'spellenhance_rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff24: SkillBuffDefinition = {
  stackingType: 'highPriority',
  stackingKey: 'liino_spellenhance',
  priority: { blackboardKey: 'spellenhance_rate' },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { atk_up: 0, duration: 0, spellenhance_rate: 0 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_2' } },
  actionGraph: liinoBuff24ActionGraph,
};

const liinoBuff25ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff25: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: { blackboardKey: 'shelter', negate: true },
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: -1, heal_rate: 0.2, liino_talent: 1, shelter: -0.2 },
  attributeModifiers: [
    { attribute: 'healTakenIncrease', slot: 'addition', value: { blackboardKey: 'heal_rate' } },
  ],
  damageModifiers: [
    {
      enabledSide: 'defender',
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'product',
          addition: { blackboardKey: 'shelter' },
        },
      ],
    },
  ],
  actionGraph: liinoBuff25ActionGraph,
};

const liinoBuff26ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff26: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: { blackboardKey: 'shelter', negate: true },
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 3, heal_rate: 0.1, liino_talent: 0, shelter: -0.2 },
  attributeModifiers: [
    { attribute: 'healTakenIncrease', slot: 'addition', value: { blackboardKey: 'heal_rate' } },
  ],
  damageModifiers: [
    {
      enabledSide: 'defender',
      processors: [
        {
          kind: 'damageScale',
          side: 'defender',
          zone: 'product',
          addition: { blackboardKey: 'shelter' },
        },
      ],
    },
  ],
  actionGraph: liinoBuff26ActionGraph,
};

const liinoBuff27ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_talent_shelter_finishtime',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { shelter: 'shelter', heal_rate: 'heal_rate' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff27: SkillBuffDefinition = {
  stackingType: 'highPriority',
  stackingKey: 'liino_talent',
  priority: { blackboardKey: 'shelter', negate: true },
  maxStackCount: 5,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_liino_normalskill_music',
    iconPath: '/icons/icon_battle_buff_liino_normalskill_music.webp',
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
  blackboard: { duration: 3, heal_rate: 0.1, liino_talent: 0, shelter: -0.2 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: liinoBuff27ActionGraph,
};

const liinoBuff28ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_talent_shelter_finishtime',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { shelter: 'shelter', heal_rate: 'heal_rate' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff28: SkillBuffDefinition = {
  stackingType: 'highPriority',
  stackingKey: 'liino_talent',
  priority: { blackboardKey: 'shelter', negate: true },
  maxStackCount: 5,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_liino_ultskill_music',
    iconPath: '/icons/icon_battle_buff_liino_ultskill_music.webp',
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
  blackboard: { duration: 3, heal_rate: 0.1, liino_talent: 0, shelter: -0.2 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: liinoBuff28ActionGraph,
};

const liinoBuff29ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_talent_shelter',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { shelter: 'shelter', heal_rate: 'heal_rate' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff29: SkillBuffDefinition = {
  stackingType: 'highPriority',
  stackingKey: 'liino_talent',
  priority: { blackboardKey: 'shelter', negate: true },
  maxStackCount: 5,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_liino_normalskill_music',
    iconPath: '/icons/icon_battle_buff_liino_normalskill_music.webp',
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
  blackboard: { duration: -1, heal_rate: 0.2, liino_talent: 1, shelter: -0.2 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: liinoBuff29ActionGraph,
};

const liinoBuff30ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_talent_shelter',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { shelter: 'shelter', heal_rate: 'heal_rate' },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff30: SkillBuffDefinition = {
  stackingType: 'highPriority',
  stackingKey: 'liino_talent',
  priority: { blackboardKey: 'shelter', negate: true },
  maxStackCount: 5,
  presentation: {
    visible: true,
    iconId: 'icon_battle_buff_liino_ultskill_music',
    iconPath: '/icons/icon_battle_buff_liino_ultskill_music.webp',
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
  blackboard: { duration: -1, heal_rate: 0.2, liino_talent: 1, shelter: -0.2 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: liinoBuff30ActionGraph,
};

const liinoBuff31ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_spellenhance',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: {
              spellenhance_rate: 'spellenhance_rate',
              duration: 'duration',
            },
          },
        },
        next: null,
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff31: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: 0,
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_up: 0,
    duration: -1,
    finish_duration: 10,
    spellenhance_rate: 0.2,
    spellenhance_will_rate: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'applyBuff_1' } },
  actionGraph: liinoBuff31ActionGraph,
};

const liinoBuff32ActionGraph = {
  main: { nodes: {} },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff32: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 1 },
  attributeModifiers: [],
  actionGraph: liinoBuff32ActionGraph,
};

const liinoBuff33ActionGraph = {
  main: {
    nodes: {
      launchProjectile_1: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 0.4,
            recycleDelaySeconds: 0.0333333350718021,
            hit: { finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0035_liino_ultimate_skill_soundwave_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale_3: 0.1,
                  final_heal_value: 0,
                  poise: 5,
                  ultheal_rate: 0,
                  ultheal_value: 0,
                },
                scheduledSequences: [
                  { startFrame: 0, endFrame: 0, sequence: { $sequence: 'dealDamage_3' } },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_physical_no_guard',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
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
                      dealDamage_3: {
                        action: {
                          kind: 'dealDamage',
                          parameters: {
                            damageType: 'electric',
                            attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                            tags: ['ultimateSkill'],
                          },
                        },
                        next: 'conditional_2',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0035_liino_chrdung_armorbreak'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'atk_scale_3' },
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
      launchProjectile_2: {
        action: {
          kind: 'launchProjectile',
          parameters: {
            finish: 0.4,
            recycleDelaySeconds: 0.0333333350718021,
            hit: { target: 'allOperators', finishOnHit: false },
          },
          callbacks: [
            {
              event: 'hit',
              skill: {
                skillId: 'chr_0035_liino_ultimate_skill_soundwave_projhit',
                nativeSkillType: 'normalSkill',
                naturalDurationFrames: 1,
                castResource: {
                  costFrame: 0,
                  cooldownSeconds: 0,
                  maxChargeTime: 1,
                  cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                },
                blackboard: {
                  atk_scale_3: 0.1,
                  final_heal_value: 0,
                  poise: 5,
                  ultheal_rate: 0,
                  ultheal_value: 0,
                },
                scheduledSequences: [
                  {
                    startFrame: 0,
                    endFrame: 0,
                    sequence: { $sequence: 'storeSourceAttributeValue_4' },
                  },
                ],
                actionGraph: {
                  main: {
                    nodes: {
                      applyBuff_1: {
                        action: {
                          kind: 'applyBuff',
                          parameters: {
                            buffId: 'buff_physical_no_guard',
                            target: 'actionInputTarget',
                            inheritSourceSkillCastInfo: true,
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
                      heal_3: {
                        action: {
                          kind: 'heal',
                          parameters: {
                            target: 'actionInputTarget',
                            alwaysNext: true,
                            tags: ['Skill/Character/Common/Heal/UltimateSkillHeal'],
                            amount: { kind: 'valueNode', nodeId: 'data_2' },
                          },
                        },
                        next: 'conditional_2',
                      },
                      storeSourceAttributeValue_4: {
                        action: {
                          kind: 'storeSourceAttributeValue',
                          parameters: {
                            attribute: { kind: 'specific', key: 'agility' },
                            stage: 'finalNonConverted',
                            useFloor: false,
                            divisor: { kind: 'constant', value: 1 },
                            multiplier: { kind: 'valueNode', nodeId: 'data_3' },
                            base: { kind: 'valueNode', nodeId: 'data_4' },
                            targetKey: 'final_heal_value',
                          },
                        },
                        next: 'heal_3',
                      },
                    },
                    dataNodes: {
                      data_1: {
                        type: 'boolean',
                        expression: {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0035_liino_chrdung_armorbreak'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      },
                      data_2: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'final_heal_value' },
                      },
                      data_3: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'ultheal_value' },
                      },
                      data_4: {
                        type: 'number',
                        expression: { kind: 'blackboard', key: 'ultheal_rate' },
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
            scopeKey:
              'BuffData.buff_chr_0035_liino_ultskill_music_damage.buffEventAction[0].actions[0].actionData[1]:projectile_chr_0035_liino_ultskill_soundwave_heal',
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_2' },
        },
        next: null,
      },
      withActionBlackboardScope_4: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey:
              'BuffData.buff_chr_0035_liino_ultskill_music_damage.buffEventAction[0].actions[0].actionData[0]:projectile_chr_0035_liino_ultskill_soundwave',
            lifetime: 'execution',
            initialValues: {},
            inheritParent: true,
            entityInitialValues: {},
          },
          body: { $sequence: 'launchProjectile_1' },
        },
        next: 'withActionBlackboardScope_3',
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff33: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'vfx_music_duration' },
  triggerIntervalSeconds: { blackboardKey: 'music_damage_trigger' },
  waitFirstTriggerInterval: false,
  maxTriggerCount: -1,
  applyTags: [],
  extendTags: [],
  blackboard: {
    atk_scale_3: 0.1,
    music_damage_trigger: 3,
    ultheal_rate: 0,
    ultheal_value: 0,
    ultheal02_rate: 0,
    ultheal02_value: 0,
    vfx_music_duration: 20,
  },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'withActionBlackboardScope_4' } },
  actionGraph: liinoBuff33ActionGraph,
};

const liinoBuff34ActionGraph = {
  main: {
    nodes: {
      heal_1: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'buffOwner',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/UltimateSkillHeal'],
            amount: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      storeSourceAttributeValue_2: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'agility' },
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'final_heal_value' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'heal_value' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'heal_rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff34: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 1,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  triggerIntervalSeconds: 0.5,
  waitFirstTriggerInterval: true,
  maxTriggerCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 2, final_heal_value: 0, heal_rate: 500, heal_value: 0.2, potential_1: 0 },
  attributeModifiers: [],
  lifecycleSequences: { trigger: { $sequence: 'storeSourceAttributeValue_2' } },
  actionGraph: liinoBuff34ActionGraph,
};

const liinoBuff35ActionGraph = {
  main: {
    nodes: {
      heal_1: {
        action: {
          kind: 'heal',
          parameters: {
            target: 'buffOwner',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/UltimateSkillHeal'],
            amount: { kind: 'valueNode', nodeId: 'data_1' },
          },
        },
        next: null,
      },
      storeSourceAttributeValue_2: {
        action: {
          kind: 'storeSourceAttributeValue',
          parameters: {
            attribute: { kind: 'specific', key: 'agility' },
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
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'final_heal_value' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'heal_value' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'heal_rate' } },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff35: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: 1,
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  applyTags: [],
  extendTags: [],
  blackboard: {
    duration: 0.5,
    final_heal_value: 0,
    heal_rate: 500,
    heal_value: 0.2,
    potential_1: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'storeSourceAttributeValue_2' } },
  actionGraph: liinoBuff35ActionGraph,
};

const liinoBuff36ActionGraph = {
  main: {
    nodes: {
      applyBuff_1: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_ultskill_buff_atkup',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: {
              spellenhance_rate: 'spellenhance_rate',
              finish_duration: 'finish_duration',
            },
          },
        },
        next: null,
      },
      applyBuff_2: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_atkup_owner',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration_atkup' },
          },
        },
        next: 'applyBuff_1',
      },
      applyBuff_3: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_ultskill_buff_atkup',
            target: 'partyExceptCaster',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              spellenhance_rate: { kind: 'valueNode', nodeId: 'data_1' },
              finish_duration: { kind: 'valueNode', nodeId: 'data_2' },
            },
          },
        },
        next: 'applyBuff_2',
      },
      applyBuff_4: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_normalskill_buff_atkup',
            target: 'partyExceptCaster',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              atk_up: { kind: 'valueNode', nodeId: 'data_3' },
              finish_duration: { kind: 'valueNode', nodeId: 'data_4' },
            },
          },
        },
        next: 'applyBuff_3',
      },
      applyBuff_5: {
        action: {
          kind: 'applyBuff',
          parameters: {
            buffId: 'buff_chr_0035_liino_talent_shelter_ultskill',
            target: 'party',
            finishByAction: true,
            onActionEndBuffs: [
              {
                buffId: 'buff_chr_0035_liino_talent_shelter_finishtime_ultskill',
                target: 'party',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: {
                  shelter: { kind: 'valueNode', nodeId: 'data_5' },
                  duration: { kind: 'valueNode', nodeId: 'data_6' },
                  heal_rate: { kind: 'valueNode', nodeId: 'data_7' },
                },
              },
            ],
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              shelter: { kind: 'valueNode', nodeId: 'data_8' },
              heal_rate: { kind: 'valueNode', nodeId: 'data_9' },
            },
          },
        },
        next: null,
      },
      conditional_6: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'data_11' } },
          whenTrue: { $sequence: 'applyBuff_5' },
        },
        next: null,
      },
      withActionBlackboardScope_7: {
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
          body: { $sequence: 'conditional_6' },
        },
        next: null,
      },
      withActionBlackboardScope_8: {
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
          body: { $sequence: 'applyBuff_4' },
        },
        next: 'withActionBlackboardScope_7',
      },
    },
    dataNodes: {
      data_1: { type: 'number', expression: { kind: 'blackboard', key: 'spellenhance_rate' } },
      data_2: { type: 'number', expression: { kind: 'blackboard', key: 'finish_duration' } },
      data_3: { type: 'number', expression: { kind: 'blackboard', key: 'atk_up' } },
      data_4: { type: 'number', expression: { kind: 'blackboard', key: 'finish_duration' } },
      data_5: { type: 'number', expression: { kind: 'blackboard', key: 'shelter' } },
      data_6: { type: 'number', expression: { kind: 'blackboard', key: 'shelter_duration' } },
      data_7: { type: 'number', expression: { kind: 'blackboard', key: 'healtaken_rate' } },
      data_8: { type: 'number', expression: { kind: 'blackboard', key: 'shelter' } },
      data_9: { type: 'number', expression: { kind: 'blackboard', key: 'healtaken_rate' } },
      data_10: { type: 'number', expression: { kind: 'blackboard', key: 'talent_a', fallback: 0 } },
      data_11: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'data_10' },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff36: SkillBuffDefinition = {
  stackingType: 'stack',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  durationSeconds: { blackboardKey: 'duration' },
  presentation: {
    visible: true,
    showInHeadBarCommon: false,
    showInHeadBarAttached: false,
    showInSquadIcon: false,
    onlyShowForMainCharacter: false,
    blinkInMainCharHpBar: false,
    showProgressInHpBar: false,
    showProgressInNormalSkillButton: true,
    useWeakProgressInNormalSkillButton: true,
    showProgressInUltimateSkillButton: false,
    forceRaiseIconEvent: true,
    showWarningBackground: false,
    playStrongInAnimation: false,
    hasCharHpBarVfxType: false,
    charHpBarVfxType: 'Fire',
    iconStyleInSquad: 'LifeTime',
    abnormalColorType: 'Physical',
    orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
  },
  applyTags: ['Skill/Character/chr_0035_liino/UltSkillMusic'],
  extendTags: [],
  blackboard: {
    atk_up: 0,
    duration: 15,
    duration_atkup: -1,
    finish_duration: 0,
    healtaken_rate: 0,
    shelter: 0,
    shelter_duration: 0,
    shelter_teammate: 0,
    spellenhance_rate: 0.2,
    talent_a: 0,
  },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'withActionBlackboardScope_8' } },
  actionGraph: liinoBuff36ActionGraph,
};

const liinoBuff37ActionGraph = {
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
    },
  },
  macros: {},
} as const satisfies ActionGraphResourceDefinition;

const liinoBuff37: SkillBuffDefinition = {
  stackingType: 'unlimited',
  priority: { blackboardKey: 'rate', negate: true },
  maxStackCount: 1,
  applyTags: [],
  extendTags: [],
  blackboard: { duration: 1 },
  attributeModifiers: [],
  lifecycleSequences: { enable: { $sequence: 'restrictUltimateEnergyRecovery_1' } },
  actionGraph: liinoBuff37ActionGraph,
};

export const liino: OperatorDefinition = {
  slug: 'liino',
  gameId: 'LIINO',
  skillDisplayNameKeys: { chr_0035_liino_normal_skill_end: 'skillNames.stanceTermination' },
  rarity: 6,
  weaponType: 'polearm',
  element: 'electric',
  role: 'supporter',
  mainAttribute: 'will',
  secondaryAttribute: 'agility',
  attributes: {
    strength: [9, 26, 44, 62, 80, 89],
    agility: [14, 37, 61, 85, 109, 121],
    intellect: [9, 26, 45, 64, 82, 91],
    will: [21, 55, 90, 125, 160, 177],
    baseAttack: [30, 90, 152, 215, 277, 309],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  passiveUi: {
    kind: 'buffProgress',
    appearance: 'liinoMusic',
    normalBuffId: 'buff_chr_0035_liino_normalskill_music_tag',
    ultimateBuffId: 'buff_chr_0035_liino_ultskill_music_tag',
  },
  skillGroups: [
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: liinoChr_0035_liino_combo_skill,
    },
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        liinoChr_0035_liino_attack1,
        liinoChr_0035_liino_attack2,
        liinoChr_0035_liino_attack3,
        liinoChr_0035_liino_attack4,
        liinoChr_0035_liino_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: liinoChr_0035_liino_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: liinoChr_0035_liino_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: liinoChr_0035_liino_normal_skill,
      replacementSkills: [
        liinoChr_0035_liino_normal_skill_end,
        liinoChr_0035_liino_normal_skill_combo,
      ],
      replacementSkillPlacements: {
        chr_0035_liino_normal_skill_end: 'standard',
        chr_0035_liino_normal_skill_combo: 'internal',
      },
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: liinoChr_0035_liino_ultimate_skill,
    },
  ],
  dodgeSkill: liinoCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0035_liino_normal_skill',
      replacementSkillKeys: ['chr_0035_liino_normal_skill_end'],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0035_liino_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0035_liino_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0035_liino_attack1',
        'chr_0035_liino_attack2',
        'chr_0035_liino_attack3',
        'chr_0035_liino_attack4',
        'chr_0035_liino_attack5',
        'chr_0035_liino_plunging_attack_end',
        'chr_0035_liino_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0035_liino_attack1',
        'chr_0035_liino_attack2',
        'chr_0035_liino_attack3',
        'chr_0035_liino_attack4',
        'chr_0035_liino_attack5',
      ],
      defaultSkillKey: 'chr_0035_liino_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [liinoComboCondition1, liinoComboCondition2],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0035_liino_normal_skill',
          blackboardKey: 'talent_a',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0035_liino_normal_skill',
          blackboardKey: 'shelter',
          operation: 'assign',
          value: [-0.1, -0.2],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0035_liino_normal_skill',
          blackboardKey: 'healtaken_rate',
          operation: 'assign',
          value: [0.1, 0.2],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0035_liino_normal_skill',
          blackboardKey: 'shelter_duration',
          operation: 'assign',
          value: [3, 3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_a',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'shelter',
          operation: 'assign',
          value: [-0.1, -0.2],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'healtaken_rate',
          operation: 'assign',
          value: [0.1, 0.2],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'shelter_duration',
          operation: 'assign',
          value: [3, 3],
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent_b',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atb_return',
          operation: 'assign',
          value: [5, 10],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atb_return_duration',
          operation: 'assign',
          value: [30, 30],
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
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0035_liino_normal_skill',
          blackboardKey: 'potential_atb_return',
          operation: 'assign',
          value: 25,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0035_liino_normal_skill',
          blackboardKey: 'atk_up',
          operation: 'add',
          value: 0.06,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_up',
          operation: 'add',
          value: 0.06,
        },
      ],
      attachedBuffs: [{ buffId: 'buff_chr_0035_liino_potential' }],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['will'], value: 20 },
        { kind: 'addStaticHealingIncrease', target: 'output', value: 0.1 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addSkillCooldownFrames', skillGroupKey: 'comboSkill', frames: -30 },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'heal_value',
          operation: 'multiply',
          value: 1.4,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'heal_rate',
          operation: 'multiply',
          value: 1.4,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.4,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale_2',
          operation: 'multiply',
          value: 1.4,
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
          blackboardKey: 'will_up',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'will_max',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale_2',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale_3',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale_4',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0035_liino_normal_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0035_liino_normal_skill',
          blackboardKey: 'atk_scale_2',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0035_liino_normal_skill',
          blackboardKey: 'atk_scale_3',
          operation: 'multiply',
          value: 1.2,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0035_liino_atkup: liinoBuff1,
    buff_chr_0035_liino_atkup_owner: liinoBuff2,
    buff_chr_0035_liino_combo_atb_return: liinoBuff3,
    buff_chr_0035_liino_comboskill_ultskill_hit: liinoBuff4,
    buff_chr_0035_liino_normalskill_buff_atkup: liinoBuff5,
    buff_chr_0035_liino_normalskill_end: liinoBuff6,
    buff_chr_0035_liino_normalskill_end_active: liinoBuff7,
    buff_chr_0035_liino_normalskill_music_animation_hitl: liinoBuff8,
    buff_chr_0035_liino_normalskill_music_animation_hitr: liinoBuff9,
    buff_chr_0035_liino_normalskill_music_cd_uishow: liinoBuff10,
    buff_chr_0035_liino_normalskill_music_cry_vfx: liinoBuff11,
    buff_chr_0035_liino_normalskill_music_damage: liinoBuff12,
    buff_chr_0035_liino_normalskill_music_tag: liinoBuff13,
    buff_chr_0035_liino_normalskill_spelllnfliction_check: liinoBuff14,
    buff_chr_0035_liino_normalskill_spelllnfliction_extraattack: liinoBuff15,
    buff_chr_0035_liino_potential: liinoBuff16,
    buff_chr_0035_liino_potential_enterfight: liinoBuff17,
    buff_chr_0035_liino_showhide: liinoBuff18,
    buff_chr_0035_liino_showhide_attack: liinoBuff19,
    buff_chr_0035_liino_showhide_audio: liinoBuff20,
    buff_chr_0035_liino_showhide_audio_fire: liinoBuff21,
    buff_chr_0035_liino_showhide_fire: liinoBuff22,
    buff_chr_0035_liino_skill_end: liinoBuff23,
    buff_chr_0035_liino_spellenhance: liinoBuff24,
    buff_chr_0035_liino_talent_shelter: liinoBuff25,
    buff_chr_0035_liino_talent_shelter_finishtime: liinoBuff26,
    buff_chr_0035_liino_talent_shelter_finishtime_normalskill: liinoBuff27,
    buff_chr_0035_liino_talent_shelter_finishtime_ultskill: liinoBuff28,
    buff_chr_0035_liino_talent_shelter_normalskill: liinoBuff29,
    buff_chr_0035_liino_talent_shelter_ultskill: liinoBuff30,
    buff_chr_0035_liino_ultskill_buff_atkup: liinoBuff31,
    buff_chr_0035_liino_ultskill_end: liinoBuff32,
    buff_chr_0035_liino_ultskill_music_damage: liinoBuff33,
    buff_chr_0035_liino_ultskill_music_heal: liinoBuff34,
    buff_chr_0035_liino_ultskill_music_heal_start: liinoBuff35,
    buff_chr_0035_liino_ultskill_music_tag: liinoBuff36,
    buff_chr_0035_liino_ultskill_refrainobtainusp: liinoBuff37,
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0035_liino_ult_skill_projhit: {
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0035_liino_ultimate_skill_projhit_abilityentity',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 41,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale: 0, atk_scale_2: 0, poise: 0 },
        scheduledSequences: [
          { startFrame: 0, endFrame: 0, sequence: { $sequence: 'withActionBlackboardScope_4' } },
          { startFrame: 3, endFrame: 3, sequence: { $sequence: 'withActionBlackboardScope_8' } },
          { startFrame: 6, endFrame: 6, sequence: { $sequence: 'withActionBlackboardScope_12' } },
          { startFrame: 8, endFrame: 8, sequence: { $sequence: 'withActionBlackboardScope_16' } },
          { startFrame: 11, endFrame: 11, sequence: { $sequence: 'withActionBlackboardScope_20' } },
          { startFrame: 15, endFrame: 15, sequence: { $sequence: 'withActionBlackboardScope_24' } },
          { startFrame: 18, endFrame: 18, sequence: { $sequence: 'withActionBlackboardScope_28' } },
          { startFrame: 40, endFrame: 40, sequence: { $sequence: 'withActionBlackboardScope_30' } },
          { startFrame: 21, endFrame: 21, sequence: { $sequence: 'withActionBlackboardScope_34' } },
          { startFrame: 25, endFrame: 25, sequence: { $sequence: 'withActionBlackboardScope_38' } },
          { startFrame: 28, endFrame: 28, sequence: { $sequence: 'withActionBlackboardScope_42' } },
        ],
        actionGraph: {
          main: {
            nodes: {
              launchProjectile_1: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_1/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              launchProjectile_2: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_2/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              withActionBlackboardScope_3: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_2' },
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
              launchProjectile_5: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_5/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              launchProjectile_6: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_6/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              withActionBlackboardScope_7: {
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
              withActionBlackboardScope_8: {
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
                next: 'withActionBlackboardScope_7',
              },
              launchProjectile_9: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_9/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              launchProjectile_10: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_10/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              withActionBlackboardScope_11: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_10' },
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
                  body: { $sequence: 'launchProjectile_9' },
                },
                next: 'withActionBlackboardScope_11',
              },
              launchProjectile_13: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit_l',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_13/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              launchProjectile_14: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit_r',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_14/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              withActionBlackboardScope_15: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_14' },
                },
                next: null,
              },
              withActionBlackboardScope_16: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_13' },
                },
                next: 'withActionBlackboardScope_15',
              },
              launchProjectile_17: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit_l',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_17/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              launchProjectile_18: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit_r',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_18/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              withActionBlackboardScope_19: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_18' },
                },
                next: null,
              },
              withActionBlackboardScope_20: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_17' },
                },
                next: 'withActionBlackboardScope_19',
              },
              launchProjectile_21: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_21/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              launchProjectile_22: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_22/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              withActionBlackboardScope_23: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_22' },
                },
                next: null,
              },
              withActionBlackboardScope_24: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_21' },
                },
                next: 'withActionBlackboardScope_23',
              },
              launchProjectile_25: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_25/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              launchProjectile_26: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_26/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              withActionBlackboardScope_27: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_26' },
                },
                next: null,
              },
              withActionBlackboardScope_28: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_25' },
                },
                next: 'withActionBlackboardScope_27',
              },
              launchProjectile_29: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.133333340287209 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit_damage_02',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 4,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: {
                          atk_scale_2: 0.1,
                          count: 1,
                          duration_spellvulnerable: 0,
                          hit_cnt: 1,
                          poise: 10,
                          rate_spellvulnerable: 0,
                        },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 4, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 4, sequence: { $sequence: 'conditional_5' } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              applyBuff_1: {
                                action: {
                                  kind: 'applyBuff',
                                  parameters: {
                                    buffId: 'buff_common_pulse_pulse_conduct_triggered',
                                    target: 'enemy',
                                    inheritSourceSkillCastInfo: true,
                                    blackboardAssignments: {
                                      consumed_type: { kind: 'constant', value: 1 },
                                      consumed_layer: { kind: 'constant', value: 0 },
                                      count: { kind: 'valueNode', nodeId: 'data_1' },
                                    },
                                  },
                                },
                                next: null,
                              },
                              finishBuffsByTag_2: {
                                action: {
                                  kind: 'finishBuffsByTag',
                                  parameters: {
                                    target: 'enemy',
                                    tagQueryType: 'hasAny',
                                    buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                                    reason: 'early',
                                    count: { kind: 'constant', value: 0 },
                                  },
                                },
                                next: 'applyBuff_1',
                              },
                              startTimeDilation_3: {
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
                                next: null,
                              },
                              dealDamage_4: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_2' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                    features: ['canBreakWeakness'],
                                    stagger: { kind: 'valueNode', nodeId: 'data_3' },
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_29/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_4/action',
                                },
                                next: 'startTimeDilation_3',
                              },
                              conditional_5: {
                                action: {
                                  kind: 'conditional',
                                  parameters: {
                                    condition: { kind: 'conditionNode', nodeId: 'data_4' },
                                  },
                                  whenTrue: { $sequence: 'finishBuffsByTag_2' },
                                },
                                next: 'dealDamage_4',
                              },
                            },
                            dataNodes: {
                              data_1: {
                                type: 'number',
                                expression: { kind: 'blackboard', key: 'count' },
                              },
                              data_2: {
                                type: 'number',
                                expression: { kind: 'blackboard', key: 'atk_scale_2' },
                              },
                              data_3: {
                                type: 'number',
                                expression: { kind: 'blackboard', key: 'poise' },
                              },
                              data_4: {
                                type: 'boolean',
                                expression: {
                                  kind: 'buffStackCompare',
                                  target: 'enemy',
                                  tagQueryType: 'hasAny',
                                  buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                                  operator: 'greaterOrEqual',
                                  value: { kind: 'constant', value: 0 },
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
              withActionBlackboardScope_30: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_29' },
                },
                next: null,
              },
              launchProjectile_31: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_31/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              launchProjectile_32: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_32/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              withActionBlackboardScope_33: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_32' },
                },
                next: null,
              },
              withActionBlackboardScope_34: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_31' },
                },
                next: 'withActionBlackboardScope_33',
              },
              launchProjectile_35: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_35/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              launchProjectile_36: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_36/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              withActionBlackboardScope_37: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_36' },
                },
                next: null,
              },
              withActionBlackboardScope_38: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_35' },
                },
                next: 'withActionBlackboardScope_37',
              },
              launchProjectile_39: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_39/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              launchProjectile_40: {
                action: {
                  kind: 'launchProjectile',
                  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.100000001490116 },
                  callbacks: [
                    {
                      event: 'reach',
                      skill: {
                        skillId: 'chr_0035_liino_ultimate_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 3,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: { atk_scale: 0.1, poise: 5 },
                        scheduledSequences: [
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: 'dealDamage_1' } },
                          { startFrame: 0, endFrame: 3, sequence: { $sequence: null } },
                        ],
                        actionGraph: {
                          main: {
                            nodes: {
                              dealDamage_1: {
                                action: {
                                  kind: 'dealDamage',
                                  parameters: {
                                    damageType: 'electric',
                                    attackScale: { kind: 'valueNode', nodeId: 'data_1' },
                                    takeAttackSnapshot: true,
                                    tags: ['ultimateSkill'],
                                  },
                                  key: 'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/actionGraph/main/nodes/launchProjectile_40/action/callbacks/0/skill/actionGraph/main/nodes/dealDamage_1/action',
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
              withActionBlackboardScope_41: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_40' },
                },
                next: null,
              },
              withActionBlackboardScope_42: {
                action: {
                  kind: 'withActionBlackboardScope',
                  parameters: {
                    lifetime: 'execution',
                    initialValues: {},
                    inheritParent: true,
                    entityInitialValues: {},
                  },
                  body: { $sequence: 'launchProjectile_39' },
                },
                next: 'withActionBlackboardScope_41',
              },
            },
          },
          macros: {},
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default liino;
