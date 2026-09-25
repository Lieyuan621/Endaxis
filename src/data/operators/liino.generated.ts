/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type {
  ActionSequenceDefinition,
  OperatorDefinition,
  SkillDefinition,
} from '../../core/game-data/operatorDefinition';
import {
  branch,
  forEachContextTarget,
  instantiateActionSequence,
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withActionBlackboardScope,
  withSkillBlackboard,
} from './definitionHelpers';

const sharedActionSequence5: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    'chr_0035_liino_normal_skill_projhit_start_vfx.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].failActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx',
    {},
    true,
    sequence({
      kind: 'launchProjectile',
      parameters: { finish: 'firstTickBlock', recycleDelaySeconds: 0.133333340287209 },
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
              cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
            },
            blackboard: { atk_scale: 0.1, hit_cnt: 1, poise: 2 },
            scheduledSequences: [
              scheduled(0, sequence(), 4),
              scheduled(
                0,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'electric',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'blackboard', key: 'poise' },
                    },
                    '\u0000endaxis-generated-identity:0',
                  ),
                ),
                4,
              ),
              scheduled(0, sequence(), 4),
            ],
          },
        },
      ],
    }),
    {},
    { lifetime: 'execution' },
  ),
);

const sharedActionSequence4: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    'chr_0035_liino_normal_skill_projhit_start_vfx.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].succeedActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx',
    {},
    true,
    sequence({
      kind: 'launchProjectile',
      parameters: { finish: 'firstTickBlock', recycleDelaySeconds: 0.133333340287209 },
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
              cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
            },
            blackboard: { atk_scale: 0.1, hit_cnt: 1, poise: 2 },
            scheduledSequences: [
              scheduled(0, sequence(), 4),
              scheduled(
                0,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'electric',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalSkill'],
                      stagger: { kind: 'blackboard', key: 'poise' },
                    },
                    '\u0000endaxis-generated-identity:0',
                  ),
                ),
                4,
              ),
              scheduled(0, sequence(), 4),
            ],
          },
        },
      ],
    }),
    {},
    { lifetime: 'execution' },
  ),
);

const sharedActionSequence3: ActionSequenceDefinition = sequence(
  forEachContextTarget(
    'smart_target',
    instantiateActionSequence(sharedActionSequence4, ['\u0000endaxis-generated-identity:0']),
  ),
);

const sharedActionSequence2: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'buffIdStackCompare',
      target: 'enemy',
      buffIds: ['buff_chr_0035_liino_normalskill_spelllnfliction_check'],
      operator: 'greaterOrEqual',
      value: { kind: 'constant', value: 1 },
    },
    sequence(
      step('mergeContextTargets', {
        saveToContextKey: 'smart_target',
        sources: [{ kind: 'target', target: 'enemy' }],
      }),
    ),
    sequence(step('mergeContextTargets', { saveToContextKey: 'smart_target', sources: [] })),
  ),
  branch(
    {
      kind: 'contextTargetCountCompare',
      contextKey: 'smart_target',
      operator: 'greaterOrEqual',
      value: 1,
    },
    instantiateActionSequence(sharedActionSequence3, ['\u0000endaxis-generated-identity:0']),
    instantiateActionSequence(sharedActionSequence5, ['\u0000endaxis-generated-identity:1']),
    { alwaysNext: true },
  ),
);

const sharedActionSequence1: ActionSequenceDefinition = sequence({
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
          scheduled(
            0,
            instantiateActionSequence(sharedActionSequence2, [
              '\u0000endaxis-generated-identity:0',
              '\u0000endaxis-generated-identity:1',
            ]),
            0,
          ),
        ],
      },
    },
  ],
});

export const liinoChr_0035_liino_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0035_liino_combo_skill',
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
      scheduled(
        0,
        sequence(
          step('findCharacterTeamTargets', {
            saveToContextKey: 'mainchar',
            selection: { kind: 'controlledOperator' },
          }),
        ),
        3,
      ),
      scheduled(
        9,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0035_liino_combo_skill:/scheduledSequences/1/sequence/steps/0',
          ),
        ),
        13,
      ),
      scheduled(
        33,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0035_liino_combo_skill:/scheduledSequences/2/sequence/steps/0',
          ),
          step('storeSourceAttributeValue', {
            attribute: { kind: 'specific', key: 'agility' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'blackboard', key: 'heal_value' },
            base: { kind: 'blackboard', key: 'heal_rate' },
            targetKey: 'final_heal_value',
          }),
          step('heal', {
            target: 'controlledOperator',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            amount: { kind: 'blackboard', key: 'final_heal_value' },
          }),
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'usp' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          }),
        ),
        37,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'talent_b', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('createGlobalBuff', {
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
                        atb_return: { kind: 'blackboard', key: 'atb_return' },
                        duration: { kind: 'blackboard', key: 'duration' },
                      },
                    },
                  ],
                },
                source: 'caster',
                blackboardAssignments: {
                  duration: { kind: 'blackboard', key: 'atb_return_duration' },
                  atb_return: { kind: 'blackboard', key: 'atb_return' },
                },
              }),
            ),
          ),
        ),
        1,
      ),
      scheduled(
        0,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: [
              'buff_chr_0035_liino_normalskill_music_animation_hitl',
              'buff_chr_0035_liino_normalskill_music_animation_hitr',
            ],
            reason: 'other',
          }),
        ),
        1,
      ),
      scheduled(
        0,
        sequence(
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_music_damage',
            inheritToNextSkillIds: ['chr_0035_liino_normal_skill_combo'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_music_tag',
            inheritToNextSkillIds: ['chr_0035_liino_normal_skill_combo'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
            inheritToNextSkillIds: ['chr_0035_liino_normal_skill_combo'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_music_cd_uishow',
            inheritToNextSkillIds: ['chr_0035_liino_normal_skill_combo'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
        ),
        78,
      ),
      scheduled(
        67,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_normalskill_music_tag'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('triggerCustomAbilityEvent', {
                eventName: 'liino_comboskill_end',
                eventParam: 0,
                target: 'caster',
                source: 'caster',
              }),
            ),
          ),
        ),
        67,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.15 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            targets: [],
            abilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        7,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.933 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        25,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_attack'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
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
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0035_liino_showhide',
                inheritToNextSkillIds: [
                  'chr_0035_liino_normal_skill',
                  'chr_0035_liino_normal_skill_combo',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_showhide',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0035_liino_normal_skill',
                  'chr_0035_liino_normal_skill_combo',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        68,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          }),
        ),
        64,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_audio'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0035_liino_showhide_audio',
                inheritToNextSkillIds: [
                  'chr_0035_liino_normal_skill',
                  'chr_0035_liino_normal_skill_combo',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_showhide_audio',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0035_liino_normal_skill',
                  'chr_0035_liino_normal_skill_combo',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        48,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          }),
        ),
        48,
      ),
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
      sequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0035_liino_comboskill_ultskill_hit',
          target: 'caster',
          inheritSourceSkillCastInfo: true,
          blackboardAssignments: {
            atb_return_duration: { kind: 'blackboard', key: 'atb_return_duration' },
            atb_return: { kind: 'blackboard', key: 'atb_return' },
            time_duration: { kind: 'blackboard', key: 'time_duration' },
            usp: { kind: 'blackboard', key: 'usp' },
            atk_scale_2: { kind: 'blackboard', key: 'atk_scale_2' },
            radius: { kind: 'blackboard', key: 'radius' },
            atk_scale: { kind: 'blackboard', key: 'atk_scale' },
            poise: { kind: 'blackboard', key: 'poise' },
            input_angle: { kind: 'blackboard', key: 'input_angle' },
            cam_angle: { kind: 'blackboard', key: 'cam_angle' },
            cam_duration: { kind: 'blackboard', key: 'cam_duration' },
            owner_mainchar_distance: { kind: 'blackboard', key: 'owner_mainchar_distance' },
            owner_mainchar_alpha: { kind: 'blackboard', key: 'owner_mainchar_alpha' },
            normal_combo: { kind: 'blackboard', key: 'normal_combo' },
            remainingtime: { kind: 'blackboard', key: 'remainingtime' },
            combo_duration: { kind: 'blackboard', key: 'combo_duration' },
            time_ratio: { kind: 'blackboard', key: 'time_ratio' },
            talent_b: { kind: 'blackboard', key: 'talent_b' },
            heal_value: { kind: 'blackboard', key: 'heal_value' },
            heal_rate: { kind: 'blackboard', key: 'heal_rate' },
          },
        }),
      ),
    },
    cooldownFrames: [300, 300, 300, 300, 300, 300, 300, 300, 270, 270, 270, 240],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
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
);

export const liinoChr_0035_liino_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0035_liino_attack1',
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
      scheduled(
        3,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0035_liino_attack1:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.06 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_normal_attack' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        6,
      ),
      scheduled(
        7,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0035_liino_attack1:/scheduledSequences/1/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.06 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_normal_attack' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        11,
      ),
      scheduled(
        12,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0035_liino_attack2'] })),
        30,
      ),
    ],
    timelineContinuationSkillId: 'chr_0035_liino_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.094, 0.103, 0.112, 0.122, 0.131, 0.14, 0.15, 0.159, 0.168, 0.18, 0.194, 0.21],
    display_atk_scale: [0.19, 0.21, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42],
  },
);

export const liinoChr_0035_liino_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0035_liino_attack2',
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
      scheduled(
        7,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'electric',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0035_liino_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
            ),
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 5,
                targetTriggerIntervalSeconds: 0.06,
              },
            },
          ),
        ),
        19,
      ),
      scheduled(
        20,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0035_liino_attack3'] })),
        38,
      ),
    ],
    timelineContinuationSkillId: 'chr_0035_liino_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.054, 0.059, 0.064, 0.07, 0.075, 0.08, 0.086, 0.091, 0.096, 0.103, 0.111, 0.12],
    display_atk_scale: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.56, 0.6],
  },
);

export const liinoChr_0035_liino_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0035_liino_attack3',
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
      scheduled(
        12,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0035_liino_attack3:/scheduledSequences/0/sequence/steps/0',
          ),
        ),
        21,
      ),
      scheduled(
        12,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack3.actionGroupData.timelineActions[15]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack3_l_02',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack3:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        12,
      ),
      scheduled(
        14,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack3.actionGroupData.timelineActions[16]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack3_l_02',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack3:/scheduledSequences/2/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        14,
      ),
      scheduled(
        16,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack3.actionGroupData.timelineActions[17]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack3_l_02',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack3:/scheduledSequences/3/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        16,
      ),
      scheduled(
        18,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack3.actionGroupData.timelineActions[18]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack3_l_02',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack3:/scheduledSequences/4/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        18,
      ),
      scheduled(
        20,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack3.actionGroupData.timelineActions[19]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack3_l_02',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack3:/scheduledSequences/5/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        20,
      ),
      scheduled(
        12,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        12,
      ),
      scheduled(
        14,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        14,
      ),
      scheduled(
        16,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        16,
      ),
      scheduled(
        18,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        18,
      ),
      scheduled(
        20,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        20,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_attack'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
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
              }),
            ),
            sequence(
              step('applyBuff', {
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
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        34,
      ),
      scheduled(
        2,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_fire'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0035_liino_showhide_fire',
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_showhide_fire',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        33,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_audio'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
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
              }),
            ),
            sequence(
              step('applyBuff', {
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
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        33,
      ),
      scheduled(
        2,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_audio_fire'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0035_liino_showhide_audio_fire',
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_showhide_audio_fire',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        32,
      ),
      scheduled(
        24,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0035_liino_attack4'] })),
        44,
      ),
    ],
    timelineContinuationSkillId: 'chr_0035_liino_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atk_scale: [0.22, 0.24, 0.26, 0.29, 0.31, 0.33, 0.35, 0.37, 0.4, 0.42, 0.46, 0.5],
    atk_scale_2: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.02, 0.02, 0.02, 0.02, 0.02],
    display_atk_scale: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.56, 0.6],
  },
);

export const liinoChr_0035_liino_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0035_liino_attack4',
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
      scheduled(
        5,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack4.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack4_l',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack4:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        5,
      ),
      scheduled(
        7,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack4.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack4_l',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack4:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        7,
      ),
      scheduled(
        10,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack4.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack4_l',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack4:/scheduledSequences/2/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        10,
      ),
      scheduled(
        13,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack4.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack4_l',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack4:/scheduledSequences/3/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        13,
      ),
      scheduled(
        16,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack4.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack4_l',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack4:/scheduledSequences/4/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        16,
      ),
      scheduled(
        5,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack4.actionGroupData.timelineActions[8]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack4_r',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack4:/scheduledSequences/5/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        5,
      ),
      scheduled(
        7,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack4.actionGroupData.timelineActions[9]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack4_r',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack4:/scheduledSequences/6/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        7,
      ),
      scheduled(
        10,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack4.actionGroupData.timelineActions[10]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack4_r',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack4:/scheduledSequences/7/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        10,
      ),
      scheduled(
        13,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack4.actionGroupData.timelineActions[11]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack4_r',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack4:/scheduledSequences/8/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        13,
      ),
      scheduled(
        16,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_attack4.actionGroupData.timelineActions[12]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_attack4_r',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0035_liino_attack4:/scheduledSequences/9/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        16,
      ),
      scheduled(
        5,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        5,
      ),
      scheduled(
        7,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        7,
      ),
      scheduled(
        10,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        10,
      ),
      scheduled(
        13,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        13,
      ),
      scheduled(
        16,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        16,
      ),
      scheduled(
        5,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        5,
      ),
      scheduled(
        7,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        7,
      ),
      scheduled(
        10,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        10,
      ),
      scheduled(
        13,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        13,
      ),
      scheduled(
        16,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        16,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_attack'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
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
              }),
            ),
            sequence(
              step('applyBuff', {
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
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        71,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_fire'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0035_liino_showhide_fire',
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_showhide_fire',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        70,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_audio'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
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
              }),
            ),
            sequence(
              step('applyBuff', {
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
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        64,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_audio_fire'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0035_liino_showhide_audio_fire',
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_showhide_audio_fire',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        63,
      ),
      scheduled(
        18,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0035_liino_attack5'] })),
        33,
      ),
    ],
    timelineContinuationSkillId: 'chr_0035_liino_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.036, 0.04, 0.043, 0.047, 0.05, 0.054, 0.058, 0.061, 0.065, 0.069, 0.075, 0.081],
    display_atk_scale: [0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81],
  },
);

export const liinoChr_0035_liino_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0035_liino_attack5',
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
      scheduled(
        17,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'normalAttackLastCombo'],
              stagger: { kind: 'blackboard', key: 'poise' },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0035_liino_attack5:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.1 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_normal_attack' },
                finishByAction: false,
                targets: ['caster'],
              }),
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'team',
                spGainKind: 'gain',
                spGainSource: 'normalAttack',
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        24,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_attack'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
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
              }),
            ),
            sequence(
              step('applyBuff', {
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
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        25,
      ),
      scheduled(
        5,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_fire'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0035_liino_showhide_fire',
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_showhide_fire',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        23,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_audio'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
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
              }),
            ),
            sequence(
              step('applyBuff', {
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
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        23,
      ),
      scheduled(
        4,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_audio_fire'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0035_liino_showhide_audio_fire',
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_showhide_audio_fire',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        20,
      ),
      scheduled(
        28,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0035_liino_attack1'] })),
        49,
      ),
    ],
    timelineContinuationSkillId: 'chr_0035_liino_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 20,
    atk_scale: [0.45, 0.49, 0.53, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.92, 1],
    poise: 19,
  },
);

export const liinoChr_0035_liino_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0035_liino_power_attack',
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
      scheduled(
        12,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'electric',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  calculation: 'breakingAttack',
                  calculationMultiplier: 0.1,
                  tags: ['normalAttack', 'powerAttack'],
                },
                'chr_0035_liino_power_attack:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
            ),
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 3,
                targetTriggerIntervalSeconds: 0.1,
              },
            },
          ),
        ),
        24,
      ),
      scheduled(
        34,
        sequence(
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.7,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0035_liino_power_attack:/scheduledSequences/1/sequence/steps/1',
          ),
        ),
        35,
      ),
      scheduled(
        31,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          }),
        ),
        31,
      ),
      scheduled(
        44,
        sequence(
          step('startTimeDilation', {
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
          }),
        ),
        60,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_common_full_immune_medium',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        68,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_common_power_attack_disable_cast_skill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        58,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_attack'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0035_liino_showhide_attack',
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_showhide_attack',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0035_liino_showhide_attack',
                inheritToNextSkillIds: [
                  'chr_0035_liino_power_attack',
                  'chr_0035_liino_normal_skill',
                  'chr_0035_liino_combo_skill',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_showhide_attack',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0035_liino_power_attack',
                  'chr_0035_liino_normal_skill',
                  'chr_0035_liino_combo_skill',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        50,
      ),
      scheduled(
        3,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        49,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_audio'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
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
              }),
            ),
            sequence(
              step('applyBuff', {
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
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        50,
      ),
      scheduled(
        3,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        49,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const liinoChr_0035_liino_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0035_liino_plunging_attack_end',
    timelineBlockFrames: 21,
    naturalDurationFrames: 121,
    exclusiveFrame: 20,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [{ startFrame: 11, endFrame: 20, skillIds: ['chr_0012_avywen_attack1'] }],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        2,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'plungingAttack'],
            },
            'chr_0035_liino_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
          ),
        ),
        2,
      ),
      scheduled(
        8,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'electric',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalAttack', 'plungingAttack'],
                },
                'chr_0035_liino_plunging_attack_end:/scheduledSequences/1/sequence/steps/0/body/steps/0',
              ),
            ),
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 1,
                targetTriggerIntervalSeconds: 0.033,
              },
            },
          ),
        ),
        9,
      ),
      scheduled(
        2,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_plunging_attack_end.actionGroupData.timelineActions[8]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_plunging_attack',
            {},
            true,
            sequence({
              kind: 'launchProjectile',
              parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
              callbacks: [
                {
                  event: 'reach',
                  skill: {
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
                    scheduledSequences: [scheduled(0, sequence(), 0)],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        2,
      ),
      scheduled(
        5,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        5,
      ),
      scheduled(
        8,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        8,
      ),
      scheduled(
        3,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        3,
      ),
      scheduled(
        6,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        6,
      ),
      scheduled(
        9,
        sequence({
          kind: 'launchProjectile',
          parameters: { finish: 'firstTickReach' },
          callbacks: [],
        }),
        9,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_attack'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
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
              }),
            ),
            sequence(
              step('applyBuff', {
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
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        19,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          }),
        ),
        19,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_audio'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
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
              }),
            ),
            sequence(
              step('applyBuff', {
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
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        17,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          }),
        ),
        17,
      ),
    ],
    skillType: 'plungingAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atk_scale: [0.64, 0.7, 0.77, 0.83, 0.9, 0.96, 1.02, 1.09, 1.15, 1.23, 1.33, 1.44],
    atk_scale_2: [0.16, 0.18, 0.19, 0.21, 0.22, 0.24, 0.26, 0.27, 0.29, 0.31, 0.33, 0.36],
  },
);

export const liinoChr_0035_liino_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0035_liino_normal_skill',
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
      scheduled(
        1691,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: [
              'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
              'buff_chr_0035_liino_normalskill_music_animation_musicloop',
            ],
            reason: 'other',
          }),
        ),
        1694,
      ),
      scheduled(
        1967,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: [
              'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
              'buff_chr_0035_liino_normalskill_music_animation_musicloop',
              'buff_chr_0035_liino_normalskill_music_animation_hitl',
              'buff_chr_0035_liino_normalskill_music_animation_hitr',
            ],
            reason: 'other',
          }),
        ),
        1967,
      ),
      scheduled(1929, sequence(step('finishTimeline', {})), 1931),
      scheduled(
        12,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_normal_skill.actionGroupData.timelineActions[10]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_normal_attack_03',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          branch(
                            {
                              kind: 'buffIdStackCompare',
                              target: 'enemy',
                              buffIds: ['buff_chr_0035_liino_normalskill_spelllnfliction_check'],
                              operator: 'greaterOrEqual',
                              value: { kind: 'constant', value: 1 },
                            },
                            sequence(
                              step('mergeContextTargets', {
                                saveToContextKey: 'smart_target',
                                sources: [{ kind: 'target', target: 'enemy' }],
                              }),
                            ),
                            sequence(
                              step('mergeContextTargets', {
                                saveToContextKey: 'smart_target',
                                sources: [],
                              }),
                            ),
                          ),
                          branch(
                            {
                              kind: 'contextTargetCountCompare',
                              contextKey: 'smart_target',
                              operator: 'greaterOrEqual',
                              value: 1,
                            },
                            sequence(
                              forEachContextTarget(
                                'smart_target',
                                sequence(
                                  withActionBlackboardScope(
                                    'chr_0035_liino_normal_skill_projhit_start.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].succeedActions.actionData[0]:projectile_chr_0035_liino_normal_attack',
                                    {},
                                    true,
                                    sequence({
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
                                              scheduled(0, sequence(), 4),
                                              scheduled(
                                                0,
                                                sequence(
                                                  step(
                                                    'dealDamage',
                                                    {
                                                      damageType: 'electric',
                                                      attackScale: {
                                                        kind: 'blackboard',
                                                        key: 'atk_scale',
                                                      },
                                                      tags: ['normalSkill'],
                                                      features: ['canBreakWeakness'],
                                                      stagger: { kind: 'blackboard', key: 'poise' },
                                                    },
                                                    'chr_0035_liino_normal_skill:/scheduledSequences/3/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1/whenTrue/steps/0/body/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                                                  ),
                                                ),
                                                4,
                                              ),
                                              scheduled(0, sequence(), 4),
                                            ],
                                          },
                                        },
                                      ],
                                    }),
                                    {},
                                    { lifetime: 'execution' },
                                  ),
                                ),
                              ),
                            ),
                            sequence(
                              withActionBlackboardScope(
                                'chr_0035_liino_normal_skill_projhit_start.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].failActions.actionData[0]:projectile_chr_0035_liino_normal_attack',
                                {},
                                true,
                                sequence({
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
                                          scheduled(0, sequence(), 4),
                                          scheduled(
                                            0,
                                            sequence(
                                              step(
                                                'dealDamage',
                                                {
                                                  damageType: 'electric',
                                                  attackScale: {
                                                    kind: 'blackboard',
                                                    key: 'atk_scale',
                                                  },
                                                  tags: ['normalSkill'],
                                                  features: ['canBreakWeakness'],
                                                  stagger: { kind: 'blackboard', key: 'poise' },
                                                },
                                                'chr_0035_liino_normal_skill:/scheduledSequences/3/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                                              ),
                                            ),
                                            4,
                                          ),
                                          scheduled(0, sequence(), 4),
                                        ],
                                      },
                                    },
                                  ],
                                }),
                                {},
                                { lifetime: 'execution' },
                              ),
                            ),
                            { alwaysNext: true },
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_normal_skill.actionGroupData.timelineActions[10]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_03',
            {},
            true,
            instantiateActionSequence(sharedActionSequence1, [
              'chr_0035_liino_normal_skill:/scheduledSequences/3/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1/whenTrue/steps/0/body/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
              'chr_0035_liino_normal_skill:/scheduledSequences/3/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
            ]),
            {},
            { lifetime: 'execution' },
          ),
        ),
        12,
      ),
      scheduled(
        16,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_normal_skill.actionGroupData.timelineActions[11]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_normal_attack_02',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          branch(
                            {
                              kind: 'buffIdStackCompare',
                              target: 'enemy',
                              buffIds: ['buff_chr_0035_liino_normalskill_spelllnfliction_check'],
                              operator: 'greaterOrEqual',
                              value: { kind: 'constant', value: 1 },
                            },
                            sequence(
                              step('mergeContextTargets', {
                                saveToContextKey: 'smart_target',
                                sources: [{ kind: 'target', target: 'enemy' }],
                              }),
                            ),
                            sequence(
                              step('mergeContextTargets', {
                                saveToContextKey: 'smart_target',
                                sources: [],
                              }),
                            ),
                          ),
                          branch(
                            {
                              kind: 'contextTargetCountCompare',
                              contextKey: 'smart_target',
                              operator: 'greaterOrEqual',
                              value: 1,
                            },
                            sequence(
                              forEachContextTarget(
                                'smart_target',
                                sequence(
                                  withActionBlackboardScope(
                                    'chr_0035_liino_normal_skill_projhit_start_vfx03.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].succeedActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx_03',
                                    {},
                                    true,
                                    sequence({
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
                                              scheduled(0, sequence(), 4),
                                              scheduled(
                                                0,
                                                sequence(
                                                  step(
                                                    'dealDamage',
                                                    {
                                                      damageType: 'electric',
                                                      attackScale: {
                                                        kind: 'blackboard',
                                                        key: 'atk_scale',
                                                      },
                                                      tags: ['normalSkill'],
                                                      stagger: { kind: 'blackboard', key: 'poise' },
                                                    },
                                                    'chr_0035_liino_normal_skill:/scheduledSequences/4/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1/whenTrue/steps/0/body/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                                                  ),
                                                ),
                                                4,
                                              ),
                                              scheduled(0, sequence(), 4),
                                            ],
                                          },
                                        },
                                      ],
                                    }),
                                    {},
                                    { lifetime: 'execution' },
                                  ),
                                ),
                              ),
                            ),
                            sequence(
                              withActionBlackboardScope(
                                'chr_0035_liino_normal_skill_projhit_start_vfx03.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].failActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx_03',
                                {},
                                true,
                                sequence({
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
                                          scheduled(0, sequence(), 4),
                                          scheduled(
                                            0,
                                            sequence(
                                              step(
                                                'dealDamage',
                                                {
                                                  damageType: 'electric',
                                                  attackScale: {
                                                    kind: 'blackboard',
                                                    key: 'atk_scale',
                                                  },
                                                  tags: ['normalSkill'],
                                                  stagger: { kind: 'blackboard', key: 'poise' },
                                                },
                                                'chr_0035_liino_normal_skill:/scheduledSequences/4/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                                              ),
                                            ),
                                            4,
                                          ),
                                          scheduled(0, sequence(), 4),
                                        ],
                                      },
                                    },
                                  ],
                                }),
                                {},
                                { lifetime: 'execution' },
                              ),
                            ),
                            { alwaysNext: true },
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_normal_skill.actionGroupData.timelineActions[11]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_02',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          branch(
                            {
                              kind: 'buffIdStackCompare',
                              target: 'enemy',
                              buffIds: ['buff_chr_0035_liino_normalskill_spelllnfliction_check'],
                              operator: 'greaterOrEqual',
                              value: { kind: 'constant', value: 1 },
                            },
                            sequence(
                              step('mergeContextTargets', {
                                saveToContextKey: 'smart_target',
                                sources: [{ kind: 'target', target: 'enemy' }],
                              }),
                            ),
                            sequence(
                              step('mergeContextTargets', {
                                saveToContextKey: 'smart_target',
                                sources: [],
                              }),
                            ),
                          ),
                          branch(
                            {
                              kind: 'contextTargetCountCompare',
                              contextKey: 'smart_target',
                              operator: 'greaterOrEqual',
                              value: 1,
                            },
                            sequence(
                              forEachContextTarget(
                                'smart_target',
                                sequence(
                                  withActionBlackboardScope(
                                    'chr_0035_liino_normal_skill_projhit_start_vfx04.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].succeedActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx_04',
                                    {},
                                    true,
                                    sequence({
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
                                              scheduled(0, sequence(), 4),
                                              scheduled(
                                                0,
                                                sequence(
                                                  step(
                                                    'dealDamage',
                                                    {
                                                      damageType: 'electric',
                                                      attackScale: {
                                                        kind: 'blackboard',
                                                        key: 'atk_scale',
                                                      },
                                                      tags: ['normalSkill'],
                                                      stagger: { kind: 'blackboard', key: 'poise' },
                                                    },
                                                    'chr_0035_liino_normal_skill:/scheduledSequences/4/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1/whenTrue/steps/0/body/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                                                  ),
                                                ),
                                                4,
                                              ),
                                              scheduled(0, sequence(), 4),
                                            ],
                                          },
                                        },
                                      ],
                                    }),
                                    {},
                                    { lifetime: 'execution' },
                                  ),
                                ),
                              ),
                            ),
                            sequence(
                              withActionBlackboardScope(
                                'chr_0035_liino_normal_skill_projhit_start_vfx04.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].failActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx_04',
                                {},
                                true,
                                sequence({
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
                                          scheduled(0, sequence(), 4),
                                          scheduled(
                                            0,
                                            sequence(
                                              step(
                                                'dealDamage',
                                                {
                                                  damageType: 'electric',
                                                  attackScale: {
                                                    kind: 'blackboard',
                                                    key: 'atk_scale',
                                                  },
                                                  tags: ['normalSkill'],
                                                  stagger: { kind: 'blackboard', key: 'poise' },
                                                },
                                                'chr_0035_liino_normal_skill:/scheduledSequences/4/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                                              ),
                                            ),
                                            4,
                                          ),
                                          scheduled(0, sequence(), 4),
                                        ],
                                      },
                                    },
                                  ],
                                }),
                                {},
                                { lifetime: 'execution' },
                              ),
                            ),
                            { alwaysNext: true },
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        16,
      ),
      scheduled(
        14,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_normal_skill.actionGroupData.timelineActions[12]._sequenceActionData.actionData[0]:projectile_chr_0035_liino_normal_attack_02',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          branch(
                            {
                              kind: 'buffIdStackCompare',
                              target: 'enemy',
                              buffIds: ['buff_chr_0035_liino_normalskill_spelllnfliction_check'],
                              operator: 'greaterOrEqual',
                              value: { kind: 'constant', value: 1 },
                            },
                            sequence(
                              step('mergeContextTargets', {
                                saveToContextKey: 'smart_target',
                                sources: [{ kind: 'target', target: 'enemy' }],
                              }),
                            ),
                            sequence(
                              step('mergeContextTargets', {
                                saveToContextKey: 'smart_target',
                                sources: [],
                              }),
                            ),
                          ),
                          branch(
                            {
                              kind: 'contextTargetCountCompare',
                              contextKey: 'smart_target',
                              operator: 'greaterOrEqual',
                              value: 1,
                            },
                            sequence(
                              forEachContextTarget(
                                'smart_target',
                                sequence(
                                  withActionBlackboardScope(
                                    'chr_0035_liino_normal_skill_projhit_start_vfx02.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].succeedActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx',
                                    {},
                                    true,
                                    sequence({
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
                                              scheduled(0, sequence(), 4),
                                              scheduled(
                                                0,
                                                sequence(
                                                  step(
                                                    'dealDamage',
                                                    {
                                                      damageType: 'electric',
                                                      attackScale: {
                                                        kind: 'blackboard',
                                                        key: 'atk_scale',
                                                      },
                                                      tags: ['normalSkill'],
                                                      stagger: { kind: 'blackboard', key: 'poise' },
                                                    },
                                                    'chr_0035_liino_normal_skill:/scheduledSequences/5/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1/whenTrue/steps/0/body/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                                                  ),
                                                ),
                                                4,
                                              ),
                                              scheduled(0, sequence(), 4),
                                            ],
                                          },
                                        },
                                      ],
                                    }),
                                    {},
                                    { lifetime: 'execution' },
                                  ),
                                ),
                              ),
                            ),
                            sequence(
                              withActionBlackboardScope(
                                'chr_0035_liino_normal_skill_projhit_start_vfx02.actionGroupData.timelineActions[0]._sequenceActionData.actionData[1].failActions.actionData[0]:projectile_chr_0035_liino_normal_attack_vfx',
                                {},
                                true,
                                sequence({
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
                                          scheduled(0, sequence(), 4),
                                          scheduled(
                                            0,
                                            sequence(
                                              step(
                                                'dealDamage',
                                                {
                                                  damageType: 'electric',
                                                  attackScale: {
                                                    kind: 'blackboard',
                                                    key: 'atk_scale',
                                                  },
                                                  tags: ['normalSkill'],
                                                  stagger: { kind: 'blackboard', key: 'poise' },
                                                },
                                                'chr_0035_liino_normal_skill:/scheduledSequences/5/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                                              ),
                                            ),
                                            4,
                                          ),
                                          scheduled(0, sequence(), 4),
                                        ],
                                      },
                                    },
                                  ],
                                }),
                                {},
                                { lifetime: 'execution' },
                              ),
                            ),
                            { alwaysNext: true },
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_normal_skill.actionGroupData.timelineActions[12]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_02',
            {},
            true,
            instantiateActionSequence(sharedActionSequence1, [
              'chr_0035_liino_normal_skill:/scheduledSequences/5/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1/whenTrue/steps/0/body/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
              'chr_0035_liino_normal_skill:/scheduledSequences/5/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
            ]),
            {},
            { lifetime: 'execution' },
          ),
        ),
        14,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_normalskill_music_cd_uishow',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
          }),
        ),
        1815,
      ),
      scheduled(
        90,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0035_liino_normal_skill.actionGroupData.timelineActions[14]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    {
                      kind: 'eventBuffIdMatch',
                      buffIds: ['buff_chr_0035_liino_normalskill_end_active'],
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0035_liino_normalskill_music_cry_vfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('finishBuffsById', {
                        target: 'caster',
                        buffIds: [
                          'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
                          'buff_chr_0035_liino_normalskill_music_animation_musicloop',
                          'buff_chr_0035_liino_normalskill_music_cd_uishow',
                        ],
                        reason: 'other',
                      }),
                      step('adjustSkillCooldown', {
                        target: 'caster',
                        skill: { kind: 'id', skillId: 'chr_0035_liino_normal_skill' },
                        operation: 'set',
                        basis: 'absoluteSeconds',
                        value: { kind: 'blackboard', key: 'set_cd' },
                      }),
                      step('jumpTimeline', { destinationFrame: 1967 }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        1815,
      ),
      scheduled(
        90,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0035_liino_normal_skill.actionGroupData.timelineActions[15]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0035_liino_normalskill_end'] },
                    sequence(
                      step('finishBuffsById', {
                        target: 'caster',
                        buffIds: [
                          'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
                          'buff_chr_0035_liino_normalskill_music_animation_musicloop',
                          'buff_chr_0035_liino_normalskill_music_cd_uishow',
                        ],
                        reason: 'other',
                      }),
                      step('jumpTimeline', { destinationFrame: 1967 }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        1815,
      ),
      scheduled(
        45,
        sequence(
          repeatEachTick(
            sequence(
              step('storeCurrentTimelineFrame', { outputKey: 'music_loop' }),
              step('calculateActionValue', {
                key: 'normalskill_frame',
                operation: 'divide',
                left: { kind: 'blackboard', key: 'music_loop' },
                right: { kind: 'blackboard', key: 'frame_radio' },
              }),
            ),
            { nativeTickInterval: { executeEachFrame: true, intervalSeconds: 0.1 } },
          ),
        ),
        1691,
      ),
      scheduled(
        45,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_normalskill_spelllnfliction_check',
            target: 'enemy',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
          }),
          step('applyBuff', {
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
          }),
        ),
        1691,
      ),
      scheduled(
        15,
        sequence(
          step('applyBuff', {
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
          }),
          step('applyBuff', {
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
          }),
        ),
        1815,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0035_liino_showhide',
                inheritToNextSkillIds: [
                  'chr_0035_liino_normal_skill',
                  'chr_0035_liino_combo_skill',
                  'chr_0035_liino_power_attack',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_showhide',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0035_liino_normal_skill',
                  'chr_0035_liino_combo_skill',
                  'chr_0035_liino_power_attack',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_attack'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0035_liino_showhide_attack',
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_showhide_attack',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0035_liino_attack3',
                  'chr_0035_liino_attack4',
                  'chr_0035_liino_attack5',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        1804,
      ),
      scheduled(
        6,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          }),
        ),
        1804,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_audio'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
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
              }),
            ),
            sequence(
              step('applyBuff', {
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
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        1804,
      ),
      scheduled(
        6,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          }),
        ),
        1804,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_potential_enterfight'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0035_liino_potential_enterfight'],
                reason: 'other',
              }),
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'potential_atb_return' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'team',
                spGainKind: 'refund',
                spGainSource: 'skill',
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        2,
      ),
      scheduled(15, sequence(step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 })), 18),
    ],
    costs: [{ resource: 'sp', value: 25 }],
    timelineBlockFollowUpSkillId: 'chr_0035_liino_normal_skill_end',
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
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
);

export const liinoChr_0035_liino_normal_skill_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0035_liino_normal_skill_end',
    timelineBlockFrames: 1,
    naturalDurationFrames: 1,
    exclusiveFrame: 0,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [],
    switchToBuffCast: {
      currentSkillTypes: ['battleSkill', 'ultimate'],
      asSkillCast: false,
      sequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0035_liino_skill_end',
          target: 'caster',
          inheritSourceSkillCastInfo: true,
        }),
      ),
    },
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'extraActiveSkill',
  },
  { atk_scale: 1, atk_up: 0.5 },
);

export const liinoChr_0035_liino_normal_skill_combo: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0035_liino_normal_skill_combo',
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
      scheduled(
        1938,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: [
              'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
              'buff_chr_0035_liino_normalskill_music_animation_musicloop',
              'buff_chr_0035_liino_normalskill_music_animation_hitl',
              'buff_chr_0035_liino_normalskill_music_animation_hitr',
            ],
            reason: 'other',
          }),
        ),
        1938,
      ),
      scheduled(1800, sequence(step('jumpTimeline', { destinationFrame: 1938 })), 1801),
      scheduled(1801, sequence(step('finishTimeline', {})), 1803),
      scheduled(
        0,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0035_liino_normal_skill_combo.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    {
                      kind: 'eventBuffIdMatch',
                      buffIds: ['buff_chr_0035_liino_normalskill_end_active'],
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0035_liino_normalskill_music_cry_vfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('finishBuffsById', {
                        target: 'caster',
                        buffIds: [
                          'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
                          'buff_chr_0035_liino_normalskill_music_animation_musicloop',
                          'buff_chr_0035_liino_normalskill_music_cd_uishow',
                        ],
                        reason: 'other',
                      }),
                      step('adjustSkillCooldown', {
                        target: 'caster',
                        skill: { kind: 'id', skillId: 'chr_0035_liino_normal_skill' },
                        operation: 'set',
                        basis: 'absoluteSeconds',
                        value: { kind: 'blackboard', key: 'set_cd' },
                      }),
                      step('jumpTimeline', { destinationFrame: 1938 }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        1800,
      ),
      scheduled(
        0,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0035_liino_normal_skill_combo.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0035_liino_normalskill_end'] },
                    sequence(
                      step('finishBuffsById', {
                        target: 'caster',
                        buffIds: [
                          'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
                          'buff_chr_0035_liino_normalskill_music_animation_musicloop',
                          'buff_chr_0035_liino_normalskill_music_cd_uishow',
                        ],
                        reason: 'other',
                      }),
                      step('jumpTimeline', { destinationFrame: 1938 }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        1800,
      ),
      scheduled(
        0,
        sequence(
          repeatEachTick(sequence(step('storeCurrentTimelineFrame', { outputKey: 'music_loop' })), {
            nativeTickInterval: { executeEachFrame: true, intervalSeconds: 0.1 },
          }),
        ),
        1801,
      ),
      scheduled(
        0,
        sequence(
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_music_tag',
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_music_damage',
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_spelllnfliction_extraattack',
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0035_liino_normalskill_music_cd_uishow',
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
        ),
        1800,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0035_liino_showhide',
                inheritToNextSkillIds: [
                  'chr_0035_liino_normal_skill',
                  'chr_0035_liino_combo_skill',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_showhide',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0035_liino_normal_skill',
                  'chr_0035_liino_combo_skill',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        1800,
      ),
      scheduled(
        1862,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0035_liino_combo_skill'],
          }),
        ),
        1962,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          }),
        ),
        1800,
      ),
      scheduled(
        1862,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          }),
        ),
        1961,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_audio'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
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
              }),
            ),
            sequence(
              step('applyBuff', {
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
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        1800,
      ),
      scheduled(
        1862,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0035_liino_showhide_audio'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
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
              }),
            ),
            sequence(
              step('applyBuff', {
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
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        1962,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          }),
        ),
        1800,
      ),
      scheduled(
        1862,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          }),
        ),
        1961,
      ),
    ],
    timelineBlockFollowUpSkillId: 'chr_0035_liino_normal_skill_end',
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'extraActiveSkill',
  },
  {
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
);

export const liinoChr_0035_liino_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0035_liino_ultimate_skill',
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
      scheduled(
        407,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0035_liino_normalskill_music_animation_musicloop'],
            reason: 'other',
          }),
        ),
        408,
      ),
      scheduled(
        540,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0035_liino_normalskill_music_animation_musicloop'],
            reason: 'other',
          }),
        ),
        541,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'RESETto1' },
            finishByAction: false,
            targets: ['caster'],
          }),
        ),
        30,
      ),
      scheduled(
        0,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(),
            sequence(
              step('findCharacterTeamTargets', {
                saveToContextKey: 'mainchar',
                selection: { kind: 'controlledOperator' },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        1,
      ),
      scheduled(
        76,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0035_liino_ult_skill_projhit',
            childSkillId: 'chr_0035_liino_ultimate_skill_projhit_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          }),
        ),
        76,
      ),
      scheduled(
        80,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_ultskill_music_heal_start',
            target: 'party',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              heal_value: 'ultheal03_value',
              heal_rate: 'ultheal03_rate',
            },
          }),
        ),
        80,
      ),
      scheduled(
        513,
        sequence(
          step('calculateActionValue', {
            key: 'ultheal02_rate',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'ultheal_rate' },
            right: { kind: 'blackboard', key: 'final_value' },
          }),
          step('calculateActionValue', {
            key: 'ultheal02_value',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'ultheal_value' },
            right: { kind: 'blackboard', key: 'final_value' },
          }),
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_ultskill_music_heal',
            target: 'party',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              heal_value: 'ultheal02_value',
              heal_rate: 'ultheal02_rate',
            },
          }),
        ),
        514,
      ),
      scheduled(
        508,
        sequence(
          step('calculateActionValue', {
            key: 'atk_scale_4',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'atk_scale_3' },
            right: { kind: 'blackboard', key: 'final_value' },
          }),
          withActionBlackboardScope(
            'SkillData.chr_0035_liino_ultimate_skill.actionGroupData.timelineActions[11]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_ultskill_soundwave_02',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_4' },
                              tags: ['ultimateSkill'],
                            },
                            'chr_0035_liino_ultimate_skill:/scheduledSequences/7/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                          branch(
                            {
                              kind: 'buffIdStackCompare',
                              target: 'caster',
                              buffIds: ['buff_chr_0035_liino_chrdung_armorbreak'],
                              operator: 'greaterOrEqual',
                              value: { kind: 'constant', value: 1 },
                            },
                            sequence(
                              step('applyBuff', {
                                buffId: 'buff_physical_no_guard',
                                target: 'enemy',
                                inheritSourceSkillCastInfo: true,
                              }),
                            ),
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        508,
      ),
      scheduled(
        77,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_ultskill_refrainobtainusp',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        527,
      ),
      scheduled(
        77,
        sequence(
          step('changeSkillSlot', {
            skillGroupKey: 'battleSkill',
            targetSkillKey: 'chr_0035_liino_normal_skill_end',
            inheritOriginSkillCooldownProgress: true,
            lifetime: 'finishByAction',
            revertedSkillKey: 'chr_0035_liino_normal_skill',
          }),
        ),
        527,
      ),
      scheduled(
        137,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0035_liino_ultimate_skill.actionGroupData.timelineActions[18]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    {
                      kind: 'buffIdStackCompare',
                      target: 'caster',
                      buffIds: ['buff_chr_0035_liino_ultskill_end'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0035_liino_normalskill_music_cry_vfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('finishBuffsById', {
                        target: 'caster',
                        buffIds: ['buff_chr_0035_liino_normalskill_music_animation_musicloop'],
                        reason: 'other',
                      }),
                      step('jumpTimeline', { destinationFrame: 540 }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        527,
      ),
      scheduled(
        77,
        sequence(
          step('storeSourceAttributeValue', {
            attribute: { kind: 'specific', key: 'will' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'blackboard', key: 'will_up' },
            base: { kind: 'constant', value: 0 },
            targetKey: 'fnlatk_up',
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'fnlatk_up', fallback: 0 },
              operator: 'lessOrEqual',
              right: { kind: 'blackboard', key: 'will_max', fallback: 0 },
            },
            sequence(
              step('applyBuff', {
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
              }),
            ),
            sequence(
              step('modifyActionValue', {
                key: 'fnlatk_up',
                operation: 'assign',
                value: { kind: 'blackboard', key: 'will_max' },
              }),
              step('applyBuff', {
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
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        527,
      ),
      scheduled(
        77,
        sequence(
          step('applyBuff', {
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
          }),
        ),
        477,
      ),
      scheduled(
        77,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          }),
        ),
        520,
      ),
      scheduled(
        64,
        sequence(
          step('applyBuff', {
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
          }),
        ),
        523,
      ),
      scheduled(
        77,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_showhide_audio_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0035_liino_normal_skill',
              'chr_0035_liino_attack4',
              'chr_0035_liino_attack5',
            ],
          }),
        ),
        520,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_common_damage_immune_medium',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        80,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 77),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        77,
      ),
    ],
    cooldownFrames: 600,
    costs: [{ resource: 'ultimateEnergy', value: 160 }],
    timelineBlockFollowUpSkillId: 'chr_0035_liino_normal_skill_end',
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
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
);

export const liinoCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
  {
    key: 'common_character_perfect_dodge',
    timelineBlockFrames: 16,
    naturalDurationFrames: 15,
    exclusiveFrame: 15,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [],
    skillType: 'dodge',
    nativeSkillType: 'dodge',
  },
  {},
);

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
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0035_liino_combo_skill',
      event: 'addedBuff',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
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
          sequence(
            branch(
              {
                kind: 'buffTagIdCountCompare',
                target: 'caster',
                tagQueryType: 'hasAny',
                buffTags: ['Skill/Character/chr_0035_liino/NormalSkillMusic'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 1 },
              },
              sequence(),
            ),
          ),
        ),
      ),
    },
    {
      key: 'native-combo:1',
      skillKey: 'chr_0035_liino_combo_skill',
      event: 'buffEndsEarly',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
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
          sequence(
            branch(
              {
                kind: 'buffTagIdCountCompare',
                target: 'caster',
                tagQueryType: 'hasAny',
                buffTags: ['Skill/Character/chr_0035_liino/NormalSkillMusic'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 1 },
              },
              sequence(),
            ),
          ),
        ),
      ),
    },
  ],
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
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0035_liino_potential',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
        }),
      ),
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
    buff_chr_0035_liino_atkup: {
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
    },
    buff_chr_0035_liino_atkup_owner: {
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
    },
    buff_chr_0035_liino_combo_atb_return: {
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
        {
          event: 'afterSkillApplyCost',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventSkillTypeIn', skillTypes: ['battleSkill'] },
              sequence(
                branch(
                  {
                    kind: 'characterTypeIn',
                    target: 'buffOwner',
                    characterTypes: ['electric', 'nature'],
                  },
                  sequence(
                    step('changeResourceByActionValue', {
                      resource: 'sp',
                      amount: { kind: 'blackboard', key: 'atb_return' },
                      coefficient: { kind: 'constant', value: 1 },
                      recipient: 'team',
                      spGainKind: 'refund',
                      spGainSource: 'skill',
                    }),
                    step('finishParentGlobalBuff', { reason: 'early' }),
                  ),
                ),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0035_liino_comboskill_ultskill_hit: {
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
        scheduled(
          0,
          sequence(
            step('finishBuffsById', {
              target: 'buffOwner',
              buffIds: ['buff_chr_0035_liino_normalskill_music_animation_musicloop'],
              reason: 'other',
            }),
          ),
          68,
        ),
        scheduled(
          0,
          sequence(
            step('findCharacterTeamTargets', {
              saveToContextKey: 'mainchar',
              selection: { kind: 'controlledOperator' },
            }),
          ),
          3,
        ),
        scheduled(
          9,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'electric',
                attackScale: { kind: 'blackboard', key: 'atk_scale' },
                tags: ['comboSkill'],
                features: ['canBreakWeakness'],
              },
              'buff_chr_0035_liino_comboskill_ultskill_hit:/scheduledSequences/2/sequence/steps/0',
            ),
          ),
          13,
        ),
        scheduled(
          33,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'electric',
                attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                tags: ['comboSkill'],
                features: ['canBreakWeakness'],
                stagger: { kind: 'blackboard', key: 'poise' },
              },
              'buff_chr_0035_liino_comboskill_ultskill_hit:/scheduledSequences/3/sequence/steps/0',
            ),
            step('storeSourceAttributeValue', {
              attribute: { kind: 'specific', key: 'agility' },
              stage: 'finalNonConverted',
              useFloor: false,
              divisor: { kind: 'constant', value: 1 },
              multiplier: { kind: 'blackboard', key: 'heal_value' },
              base: { kind: 'blackboard', key: 'heal_rate' },
              targetKey: 'final_heal_value',
            }),
            step('heal', {
              target: 'controlledOperator',
              alwaysNext: true,
              tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
              amount: { kind: 'blackboard', key: 'final_heal_value' },
            }),
            step('changeResourceByActionValue', {
              resource: 'ultimateEnergy',
              amount: { kind: 'blackboard', key: 'usp' },
              coefficient: { kind: 'constant', value: 1 },
              recipient: 'caster',
            }),
          ),
          37,
        ),
        scheduled(
          0,
          sequence(
            branch(
              {
                kind: 'actionValueCompare',
                left: { kind: 'blackboard', key: 'talent_b', fallback: 0 },
                operator: 'greaterOrEqual',
                right: { kind: 'constant', value: 1 },
              },
              sequence(
                step('createGlobalBuff', {
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
                          atb_return: { kind: 'blackboard', key: 'atb_return' },
                          duration: { kind: 'blackboard', key: 'duration' },
                        },
                      },
                    ],
                  },
                  source: 'buffOwner',
                  blackboardAssignments: {
                    duration: { kind: 'blackboard', key: 'atb_return_duration' },
                    atb_return: { kind: 'blackboard', key: 'atb_return' },
                  },
                }),
              ),
            ),
          ),
          0,
        ),
        scheduled(
          0,
          sequence(
            branch(
              {
                kind: 'buffIdStackCompare',
                target: 'buffOwner',
                buffIds: ['buff_chr_0035_liino_normalskill_music_tag'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 1 },
              },
              sequence(
                step('modifyActionValue', {
                  key: 'normal_combo',
                  operation: 'assign',
                  value: { kind: 'constant', value: 1 },
                }),
                step('readBuffRemainingDuration', {
                  target: 'buffOwner',
                  buffIds: ['buff_chr_0035_liino_normalskill_music_tag'],
                  outputKey: 'remainingtime',
                }),
              ),
            ),
          ),
          0,
        ),
        scheduled(
          0,
          sequence(
            step('startTimeDilation', {
              scope: 'entity',
              durationSeconds: { kind: 'constant', value: 0.15 },
              slot: 'TimeDilation/Layer/Entity/HitStop',
              priority: 30,
              curve: { kind: 'named', key: 'ComboSkill' },
              finishByAction: false,
              targets: [],
              abilityEntityTargets: [{ kind: 'ownerSpawned' }],
            }),
          ),
          7,
        ),
        scheduled(
          0,
          sequence(
            step('startTimeDilation', {
              scope: 'global',
              durationSeconds: { kind: 'constant', value: 0.9333 },
              slot: 'unassigned',
              priority: 30,
              curve: { kind: 'named', key: 'ComboSkill' },
              finishByAction: false,
              ignoredTargets: ['caster'],
              ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
            }),
          ),
          25,
        ),
      ],
    },
    buff_chr_0035_liino_normalskill_buff_atkup: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_up: 0, duration: -1, finish_duration: 0, spellenhance_rate: 0.2 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_atkup',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration' },
          }),
        ),
      },
    },
    buff_chr_0035_liino_normalskill_end: {
      stackingType: 'unlimited',
      priority: { blackboardKey: 'rate', negate: true },
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 1 },
      attributeModifiers: [],
    },
    buff_chr_0035_liino_normalskill_end_active: {
      stackingType: 'unlimited',
      priority: { blackboardKey: 'rate', negate: true },
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 1 },
      attributeModifiers: [],
    },
    buff_chr_0035_liino_normalskill_music_animation_hitl: {
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
        scheduled(
          24,
          sequence(
            withActionBlackboardScope(
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitl.timelineActions[2]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_l',
              {},
              true,
              sequence({
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
                        scheduled(0, sequence(), 4),
                        scheduled(
                          0,
                          sequence(
                            step(
                              'dealDamage',
                              {
                                damageType: 'electric',
                                attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                                tags: ['normalSkill'],
                              },
                              'buff_chr_0035_liino_normalskill_music_animation_hitl:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                            ),
                          ),
                          4,
                        ),
                      ],
                    },
                  },
                ],
              }),
              {},
              { lifetime: 'execution' },
            ),
          ),
          24,
        ),
        scheduled(
          32,
          sequence(
            withActionBlackboardScope(
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitl.timelineActions[3]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_l_vfx02',
              {},
              true,
              sequence({
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
                        scheduled(0, sequence(), 4),
                        scheduled(
                          0,
                          sequence(
                            step(
                              'dealDamage',
                              {
                                damageType: 'electric',
                                attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                                tags: ['normalSkill'],
                              },
                              'buff_chr_0035_liino_normalskill_music_animation_hitl:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                            ),
                          ),
                          4,
                        ),
                      ],
                    },
                  },
                ],
              }),
              {},
              { lifetime: 'execution' },
            ),
          ),
          32,
        ),
        scheduled(
          25,
          sequence(
            withActionBlackboardScope(
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitl.timelineActions[4]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_r',
              {},
              true,
              sequence({
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
                        scheduled(0, sequence(), 4),
                        scheduled(
                          0,
                          sequence(
                            step(
                              'dealDamage',
                              {
                                damageType: 'electric',
                                attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                                tags: ['normalSkill'],
                              },
                              'buff_chr_0035_liino_normalskill_music_animation_hitl:/scheduledSequences/2/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                            ),
                          ),
                          4,
                        ),
                      ],
                    },
                  },
                ],
              }),
              {},
              { lifetime: 'execution' },
            ),
          ),
          25,
        ),
        scheduled(
          33,
          sequence(
            withActionBlackboardScope(
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitl.timelineActions[5]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_r_vfx02',
              {},
              true,
              sequence({
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
                        scheduled(0, sequence(), 4),
                        scheduled(
                          0,
                          sequence(
                            step(
                              'dealDamage',
                              {
                                damageType: 'electric',
                                attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                                tags: ['normalSkill'],
                              },
                              'buff_chr_0035_liino_normalskill_music_animation_hitl:/scheduledSequences/3/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                            ),
                          ),
                          4,
                        ),
                      ],
                    },
                  },
                ],
              }),
              {},
              { lifetime: 'execution' },
            ),
          ),
          33,
        ),
        scheduled(
          28,
          sequence(
            withActionBlackboardScope(
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitl.timelineActions[6]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_l_vfx01',
              {},
              true,
              sequence({
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
                        scheduled(0, sequence(), 4),
                        scheduled(
                          0,
                          sequence(
                            step(
                              'dealDamage',
                              {
                                damageType: 'electric',
                                attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                                tags: ['normalSkill'],
                              },
                              'buff_chr_0035_liino_normalskill_music_animation_hitl:/scheduledSequences/4/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                            ),
                          ),
                          4,
                        ),
                      ],
                    },
                  },
                ],
              }),
              {},
              { lifetime: 'execution' },
            ),
          ),
          28,
        ),
        scheduled(
          29,
          sequence(
            withActionBlackboardScope(
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitl.timelineActions[7]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_r_vfx01',
              {},
              true,
              sequence({
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
                        scheduled(0, sequence(), 4),
                        scheduled(
                          0,
                          sequence(
                            step(
                              'dealDamage',
                              {
                                damageType: 'electric',
                                attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                                tags: ['normalSkill'],
                              },
                              'buff_chr_0035_liino_normalskill_music_animation_hitl:/scheduledSequences/5/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                            ),
                          ),
                          4,
                        ),
                      ],
                    },
                  },
                ],
              }),
              {},
              { lifetime: 'execution' },
            ),
          ),
          29,
        ),
      ],
    },
    buff_chr_0035_liino_normalskill_music_animation_hitr: {
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
        scheduled(
          24,
          sequence(
            withActionBlackboardScope(
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitr.timelineActions[2]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_l',
              {},
              true,
              sequence({
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
                        scheduled(0, sequence(), 4),
                        scheduled(
                          0,
                          sequence(
                            step(
                              'dealDamage',
                              {
                                damageType: 'electric',
                                attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                                tags: ['normalSkill'],
                              },
                              'buff_chr_0035_liino_normalskill_music_animation_hitr:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                            ),
                          ),
                          4,
                        ),
                      ],
                    },
                  },
                ],
              }),
              {},
              { lifetime: 'execution' },
            ),
          ),
          24,
        ),
        scheduled(
          32,
          sequence(
            withActionBlackboardScope(
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitr.timelineActions[3]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_l',
              {},
              true,
              sequence({
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
                        scheduled(0, sequence(), 4),
                        scheduled(
                          0,
                          sequence(
                            step(
                              'dealDamage',
                              {
                                damageType: 'electric',
                                attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                                tags: ['normalSkill'],
                              },
                              'buff_chr_0035_liino_normalskill_music_animation_hitr:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                            ),
                          ),
                          4,
                        ),
                      ],
                    },
                  },
                ],
              }),
              {},
              { lifetime: 'execution' },
            ),
          ),
          32,
        ),
        scheduled(
          25,
          sequence(
            withActionBlackboardScope(
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitr.timelineActions[4]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_r',
              {},
              true,
              sequence({
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
                        scheduled(0, sequence(), 4),
                        scheduled(
                          0,
                          sequence(
                            step(
                              'dealDamage',
                              {
                                damageType: 'electric',
                                attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                                tags: ['normalSkill'],
                              },
                              'buff_chr_0035_liino_normalskill_music_animation_hitr:/scheduledSequences/2/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                            ),
                          ),
                          4,
                        ),
                      ],
                    },
                  },
                ],
              }),
              {},
              { lifetime: 'execution' },
            ),
          ),
          25,
        ),
        scheduled(
          33,
          sequence(
            withActionBlackboardScope(
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitr.timelineActions[5]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_r',
              {},
              true,
              sequence({
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
                        scheduled(0, sequence(), 4),
                        scheduled(
                          0,
                          sequence(
                            step(
                              'dealDamage',
                              {
                                damageType: 'electric',
                                attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                                tags: ['normalSkill'],
                              },
                              'buff_chr_0035_liino_normalskill_music_animation_hitr:/scheduledSequences/3/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                            ),
                          ),
                          4,
                        ),
                      ],
                    },
                  },
                ],
              }),
              {},
              { lifetime: 'execution' },
            ),
          ),
          33,
        ),
        scheduled(
          28,
          sequence(
            withActionBlackboardScope(
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitr.timelineActions[6]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_l',
              {},
              true,
              sequence({
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
                        scheduled(0, sequence(), 4),
                        scheduled(
                          0,
                          sequence(
                            step(
                              'dealDamage',
                              {
                                damageType: 'electric',
                                attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                                tags: ['normalSkill'],
                              },
                              'buff_chr_0035_liino_normalskill_music_animation_hitr:/scheduledSequences/4/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                            ),
                          ),
                          4,
                        ),
                      ],
                    },
                  },
                ],
              }),
              {},
              { lifetime: 'execution' },
            ),
          ),
          28,
        ),
        scheduled(
          29,
          sequence(
            withActionBlackboardScope(
              'BuffData.buff_chr_0035_liino_normalskill_music_animation_hitr.timelineActions[7]._sequenceActionData.actionData[1]:projectile_chr_0035_liino_normal_attack_r',
              {},
              true,
              sequence({
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
                        scheduled(0, sequence(), 4),
                        scheduled(
                          0,
                          sequence(
                            step(
                              'dealDamage',
                              {
                                damageType: 'electric',
                                attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                                tags: ['normalSkill'],
                              },
                              'buff_chr_0035_liino_normalskill_music_animation_hitr:/scheduledSequences/5/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                            ),
                          ),
                          4,
                        ),
                      ],
                    },
                  },
                ],
              }),
              {},
              { lifetime: 'execution' },
            ),
          ),
          29,
        ),
      ],
    },
    buff_chr_0035_liino_normalskill_music_cd_uishow: {
      stackingType: 'stack',
      priority: { blackboardKey: 'rate', negate: true },
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      skillSlotReplacements: [
        {
          skillGroupKey: 'battleSkill',
          targetSkillKey: 'chr_0035_liino_normal_skill_end',
          revertedSkillKey: 'chr_0035_liino_normal_skill',
          inheritOriginSkillCooldownProgress: true,
        },
      ],
    },
    buff_chr_0035_liino_normalskill_music_cry_vfx: {
      stackingType: 'highPriority',
      stackingKey: 'liino_expression_vfx',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 1.5,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0035_liino_normalskill_music_damage: {
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
      lifecycleSequences: {
        trigger: sequence(
          {
            kind: 'withActionBlackboardScope',
            parameters: {
              scopeKey: 'native-buff-callback:0',
              lifetime: 'execution',
              alwaysNext: true,
              shareParentBlackboard: true,
              initialValues: {},
              inheritParent: true,
            },
            body: sequence(
              withActionBlackboardScope(
                'BuffData.buff_chr_0035_liino_normalskill_music_damage.buffEventAction[0].actions[0].actionData[3]:projectile_chr_0035_liino_normal_attack_soundwave',
                {},
                true,
                sequence({
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
                          scheduled(
                            0,
                            sequence(
                              step('storeSourceAttributeValue', {
                                attribute: { kind: 'specific', key: 'agility' },
                                stage: 'finalNonConverted',
                                useFloor: false,
                                divisor: { kind: 'constant', value: 1 },
                                multiplier: { kind: 'blackboard', key: 'heal_value' },
                                base: { kind: 'blackboard', key: 'heal_rate' },
                                targetKey: 'final_heal_value',
                              }),
                              step('heal', {
                                target: 'actionInputTarget',
                                alwaysNext: true,
                                tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
                                amount: { kind: 'blackboard', key: 'final_heal_value' },
                              }),
                            ),
                            0,
                          ),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
            ),
          },
          {
            kind: 'withActionBlackboardScope',
            parameters: {
              scopeKey: 'native-buff-callback:1',
              lifetime: 'execution',
              alwaysNext: true,
              shareParentBlackboard: true,
              initialValues: {},
              inheritParent: true,
            },
            body: sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'buffOwner',
                  buffIds: ['buff_chr_0035_liino_chrdung_armorbreak'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  withActionBlackboardScope(
                    'BuffData.buff_chr_0035_liino_normalskill_music_damage.buffEventAction[0].actions[1].actionData[1]:projectile_chr_0035_liino_normal_attack_soundwave_chrdung',
                    {},
                    true,
                    sequence({
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
                              cost: {
                                resource: 'ultimateEnergy',
                                value: 0,
                                availabilityThreshold: 0,
                              },
                            },
                            blackboard: {
                              atk_scale: 0.1,
                              final_heal_value: 0,
                              heal_rate: 0,
                              heal_value: 0,
                              poise: 0,
                            },
                            scheduledSequences: [
                              scheduled(
                                0,
                                sequence(
                                  branch(
                                    {
                                      kind: 'buffIdStackCompare',
                                      target: 'caster',
                                      buffIds: ['buff_chr_0035_liino_chrdung_armorbreak'],
                                      operator: 'greaterOrEqual',
                                      value: { kind: 'constant', value: 1 },
                                    },
                                    sequence(
                                      step('applyBuff', {
                                        buffId: 'buff_physical_no_guard',
                                        target: 'enemy',
                                        inheritSourceSkillCastInfo: true,
                                      }),
                                    ),
                                  ),
                                ),
                                0,
                              ),
                            ],
                          },
                        },
                      ],
                    }),
                    {},
                    { lifetime: 'execution' },
                  ),
                ),
              ),
            ),
          },
        ),
      },
    },
    buff_chr_0035_liino_normalskill_music_tag: {
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
        enable: sequence(
          {
            kind: 'withActionBlackboardScope',
            parameters: {
              scopeKey: 'native-buff-callback:0',
              lifetime: 'execution',
              alwaysNext: true,
              shareParentBlackboard: true,
              initialValues: {},
              inheritParent: true,
            },
            body: sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_normalskill_buff_atkup',
                target: 'partyExceptCaster',
                finishByAction: true,
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { atk_up: { kind: 'blackboard', key: 'atk_up' } },
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_atkup_owner',
                target: 'buffOwner',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                asChildBuff: true,
                copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration_atkup' },
              }),
            ),
          },
          {
            kind: 'withActionBlackboardScope',
            parameters: {
              scopeKey: 'native-buff-callback:1',
              lifetime: 'execution',
              alwaysNext: true,
              shareParentBlackboard: true,
              initialValues: {},
              inheritParent: true,
            },
            body: sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'talent_a', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0035_liino_talent_shelter_normalskill',
                    target: 'party',
                    finishByAction: true,
                    onActionEndBuffs: [
                      {
                        buffId: 'buff_chr_0035_liino_talent_shelter_finishtime_normalskill',
                        target: 'party',
                        inheritSourceSkillCastInfo: true,
                        blackboardAssignments: {
                          shelter: { kind: 'blackboard', key: 'shelter' },
                          duration: { kind: 'blackboard', key: 'shelter_duration' },
                          heal_rate: { kind: 'blackboard', key: 'healtaken_rate' },
                        },
                      },
                    ],
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      shelter: { kind: 'blackboard', key: 'shelter' },
                      heal_rate: { kind: 'blackboard', key: 'healtaken_rate' },
                    },
                  }),
                ),
              ),
            ),
          },
        ),
        finish: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_normalskill_end',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          }),
        ),
      },
      abilityEventResponses: [
        {
          event: 'customAbilityEvent',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventCustomAbilityNameMatch', eventName: 'liino_comboskill_end' },
              sequence(
                step('castSkillDuringAction', {
                  skillId: 'chr_0035_liino_normal_skill_combo',
                  target: 'enemy',
                  skipApplyCost: true,
                  inheritSourceSkillCastInfo: true,
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0035_liino_normalskill_spelllnfliction_check: {
      stackingType: 'stack',
      priority: { blackboardKey: 'rate', negate: true },
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 5, rate: 0 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'addedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'eventBuffTagsMatch',
                match: 'hasAny',
                buffTags: ['Skill/Character/Common/SpellStatus'],
              },
              sequence(
                step('createTimedMarker', {
                  target: 'buffOwner',
                  markerId: 'liino_normalhit',
                  durationSeconds: { kind: 'constant', value: 1 },
                  autoFinishByAction: false,
                  timeDomain: 'globalScaled',
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0035_liino_normalskill_spelllnfliction_extraattack: {
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
      lifecycleSequences: {
        trigger: sequence(
          branch(
            {
              kind: 'not',
              condition: {
                kind: 'timedMarkerPresent',
                target: 'buffOwner',
                markerId: 'liino_normalskill_hit',
              },
            },
            sequence(
              step('createTimedMarker', {
                target: 'buffOwner',
                markerId: 'liino_normalskill_hit',
                durationSeconds: { kind: 'blackboard', key: 'hit_duration' },
                autoFinishByAction: false,
              }),
              step('storeCurrentTimelineFrame', { outputKey: 'music_loop' }),
              step('calculateActionValue', {
                key: 'music_frame',
                operation: 'divide',
                left: { kind: 'blackboard', key: 'music_loop' },
                right: { kind: 'blackboard', key: 'frame_radio' },
              }),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hit_check', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('calculateActionValue', {
                    key: 'hit_check',
                    operation: 'multiply',
                    left: { kind: 'blackboard', key: 'hit_check' },
                    right: { kind: 'constant', value: -1 },
                  }),
                  step('applyBuff', {
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
                  }),
                ),
                sequence(
                  step('calculateActionValue', {
                    key: 'hit_check',
                    operation: 'multiply',
                    left: { kind: 'blackboard', key: 'hit_check' },
                    right: { kind: 'constant', value: -1 },
                  }),
                  step('applyBuff', {
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
                  }),
                ),
                { alwaysNext: true },
              ),
            ),
          ),
        ),
      },
    },
    buff_chr_0035_liino_potential: {
      stackingType: 'unique',
      priority: 1,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'enterFight',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'buffStackCompare',
                target: 'caster',
                tagQueryType: 'hasAny',
                buffTags: ['Skill/Character/chr_0035_liino/NormalSkillMusic'],
                operator: 'lessOrEqual',
                value: { kind: 'constant', value: 0 },
              },
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0035_liino_potential_enterfight',
                  target: 'buffSource',
                  source: 'buffSource',
                  inheritSourceSkillCastInfo: true,
                  asChildBuff: true,
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0035_liino_potential_enterfight: {
      stackingType: 'unique',
      priority: 1,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0035_liino_showhide: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0035_liino_showhide_attack: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0035_liino_showhide_audio: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0035_liino_showhide_audio_fire: {
      stackingType: 'highPriority',
      stackingKey: 'vfx_show',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0035_liino_showhide_fire: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0035_liino_skill_end: {
      stackingType: 'unlimited',
      priority: { blackboardKey: 'rate', negate: true },
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 1 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          branch(
            { kind: 'currentSkillTypeIn', target: 'buffOwner', skillTypes: ['battleSkill'] },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_normalskill_end_active',
                target: 'buffOwner',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
              }),
            ),
            sequence(
              branch(
                { kind: 'currentSkillTypeIn', target: 'buffOwner', skillTypes: ['ultimate'] },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0035_liino_ultskill_end',
                    target: 'buffOwner',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            { alwaysNext: true },
          ),
        ),
      },
    },
    buff_chr_0035_liino_spellenhance: {
      stackingType: 'highPriority',
      stackingKey: 'liino_spellenhance',
      priority: { blackboardKey: 'spellenhance_rate' },
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { atk_up: 0, duration: 0, spellenhance_rate: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_enhance_pulse',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'spellenhance_rate' },
            },
          }),
          step('applyBuff', {
            buffId: 'buff_common_affixes_enhance_natural',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'spellenhance_rate' },
            },
          }),
        ),
      },
    },
    buff_chr_0035_liino_talent_shelter: {
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
    },
    buff_chr_0035_liino_talent_shelter_finishtime: {
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
    },
    buff_chr_0035_liino_talent_shelter_finishtime_normalskill: {
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
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_talent_shelter_finishtime',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { shelter: 'shelter', heal_rate: 'heal_rate' },
          }),
        ),
      },
    },
    buff_chr_0035_liino_talent_shelter_finishtime_ultskill: {
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
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_talent_shelter_finishtime',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { shelter: 'shelter', heal_rate: 'heal_rate' },
          }),
        ),
      },
    },
    buff_chr_0035_liino_talent_shelter_normalskill: {
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
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_talent_shelter',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { shelter: 'shelter', heal_rate: 'heal_rate' },
          }),
        ),
      },
    },
    buff_chr_0035_liino_talent_shelter_ultskill: {
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
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_talent_shelter',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { shelter: 'shelter', heal_rate: 'heal_rate' },
          }),
        ),
      },
    },
    buff_chr_0035_liino_ultskill_buff_atkup: {
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
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0035_liino_spellenhance',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: {
              spellenhance_rate: 'spellenhance_rate',
              duration: 'duration',
            },
          }),
        ),
      },
    },
    buff_chr_0035_liino_ultskill_end: {
      stackingType: 'unlimited',
      priority: { blackboardKey: 'rate', negate: true },
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 1 },
      attributeModifiers: [],
    },
    buff_chr_0035_liino_ultskill_music_damage: {
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
      lifecycleSequences: {
        trigger: sequence(
          withActionBlackboardScope(
            'BuffData.buff_chr_0035_liino_ultskill_music_damage.buffEventAction[0].actions[0].actionData[0]:projectile_chr_0035_liino_ultskill_soundwave',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_3' },
                              tags: ['ultimateSkill'],
                            },
                            'buff_chr_0035_liino_ultskill_music_damage:/lifecycleSequences/trigger/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                          branch(
                            {
                              kind: 'buffIdStackCompare',
                              target: 'caster',
                              buffIds: ['buff_chr_0035_liino_chrdung_armorbreak'],
                              operator: 'greaterOrEqual',
                              value: { kind: 'constant', value: 1 },
                            },
                            sequence(
                              step('applyBuff', {
                                buffId: 'buff_physical_no_guard',
                                target: 'enemy',
                                inheritSourceSkillCastInfo: true,
                              }),
                            ),
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
          withActionBlackboardScope(
            'BuffData.buff_chr_0035_liino_ultskill_music_damage.buffEventAction[0].actions[0].actionData[1]:projectile_chr_0035_liino_ultskill_soundwave_heal',
            {},
            true,
            sequence({
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
                      scheduled(
                        0,
                        sequence(
                          step('storeSourceAttributeValue', {
                            attribute: { kind: 'specific', key: 'agility' },
                            stage: 'finalNonConverted',
                            useFloor: false,
                            divisor: { kind: 'constant', value: 1 },
                            multiplier: { kind: 'blackboard', key: 'ultheal_value' },
                            base: { kind: 'blackboard', key: 'ultheal_rate' },
                            targetKey: 'final_heal_value',
                          }),
                          step('heal', {
                            target: 'actionInputTarget',
                            alwaysNext: true,
                            tags: ['Skill/Character/Common/Heal/UltimateSkillHeal'],
                            amount: { kind: 'blackboard', key: 'final_heal_value' },
                          }),
                          branch(
                            {
                              kind: 'buffIdStackCompare',
                              target: 'caster',
                              buffIds: ['buff_chr_0035_liino_chrdung_armorbreak'],
                              operator: 'greaterOrEqual',
                              value: { kind: 'constant', value: 1 },
                            },
                            sequence(
                              step('applyBuff', {
                                buffId: 'buff_physical_no_guard',
                                target: 'actionInputTarget',
                                inheritSourceSkillCastInfo: true,
                              }),
                            ),
                          ),
                        ),
                        0,
                      ),
                    ],
                  },
                },
              ],
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
      },
    },
    buff_chr_0035_liino_ultskill_music_heal: {
      stackingType: 'unlimited',
      priority: 1,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: 0.5,
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {
        duration: 2,
        final_heal_value: 0,
        heal_rate: 500,
        heal_value: 0.2,
        potential_1: 0,
      },
      attributeModifiers: [],
      lifecycleSequences: {
        trigger: sequence(
          step('storeSourceAttributeValue', {
            attribute: { kind: 'specific', key: 'agility' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'blackboard', key: 'heal_value' },
            base: { kind: 'blackboard', key: 'heal_rate' },
            targetKey: 'final_heal_value',
          }),
          step('heal', {
            target: 'buffOwner',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/UltimateSkillHeal'],
            amount: { kind: 'blackboard', key: 'final_heal_value' },
          }),
        ),
      },
    },
    buff_chr_0035_liino_ultskill_music_heal_start: {
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
      lifecycleSequences: {
        enable: sequence(
          step('storeSourceAttributeValue', {
            attribute: { kind: 'specific', key: 'agility' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'blackboard', key: 'heal_value' },
            base: { kind: 'blackboard', key: 'heal_rate' },
            targetKey: 'final_heal_value',
          }),
          step('heal', {
            target: 'buffOwner',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/UltimateSkillHeal'],
            amount: { kind: 'blackboard', key: 'final_heal_value' },
          }),
        ),
      },
    },
    buff_chr_0035_liino_ultskill_music_tag: {
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
      lifecycleSequences: {
        enable: sequence(
          {
            kind: 'withActionBlackboardScope',
            parameters: {
              scopeKey: 'native-buff-callback:0',
              lifetime: 'execution',
              alwaysNext: true,
              shareParentBlackboard: true,
              initialValues: {},
              inheritParent: true,
            },
            body: sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_normalskill_buff_atkup',
                target: 'partyExceptCaster',
                finishByAction: true,
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: {
                  atk_up: { kind: 'blackboard', key: 'atk_up' },
                  finish_duration: { kind: 'blackboard', key: 'finish_duration' },
                },
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_ultskill_buff_atkup',
                target: 'partyExceptCaster',
                finishByAction: true,
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: {
                  spellenhance_rate: { kind: 'blackboard', key: 'spellenhance_rate' },
                  finish_duration: { kind: 'blackboard', key: 'finish_duration' },
                },
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0035_liino_atkup_owner',
                target: 'buffOwner',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                asChildBuff: true,
                copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration_atkup' },
              }),
              step('applyBuff', {
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
              }),
            ),
          },
          {
            kind: 'withActionBlackboardScope',
            parameters: {
              scopeKey: 'native-buff-callback:1',
              lifetime: 'execution',
              alwaysNext: true,
              shareParentBlackboard: true,
              initialValues: {},
              inheritParent: true,
            },
            body: sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'talent_a', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0035_liino_talent_shelter_ultskill',
                    target: 'party',
                    finishByAction: true,
                    onActionEndBuffs: [
                      {
                        buffId: 'buff_chr_0035_liino_talent_shelter_finishtime_ultskill',
                        target: 'party',
                        inheritSourceSkillCastInfo: true,
                        blackboardAssignments: {
                          shelter: { kind: 'blackboard', key: 'shelter' },
                          duration: { kind: 'blackboard', key: 'shelter_duration' },
                          heal_rate: { kind: 'blackboard', key: 'healtaken_rate' },
                        },
                      },
                    ],
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      shelter: { kind: 'blackboard', key: 'shelter' },
                      heal_rate: { kind: 'blackboard', key: 'healtaken_rate' },
                    },
                  }),
                ),
              ),
            ),
          },
        ),
      },
    },
    buff_chr_0035_liino_ultskill_refrainobtainusp: {
      stackingType: 'unlimited',
      priority: { blackboardKey: 'rate', negate: true },
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 1 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('restrictUltimateEnergyRecovery', {
            target: 'caster',
            allowedRecoveryTags: [],
            clearUltimateEnergyOnEnd: false,
          }),
        ),
      },
    },
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
          scheduled(
            0,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[1]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0035_liino_ultskill_l_03',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[1]._sequenceActionData.actionData[0].succeedActions.actionData[1]:projectile_chr_0035_liino_ultskill_r_03',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/0/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
            ),
            0,
          ),
          scheduled(
            3,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[2]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0035_liino_ultskill_l_03',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[2]._sequenceActionData.actionData[0].succeedActions.actionData[1]:projectile_chr_0035_liino_ultskill_r_03',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/1/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
            ),
            3,
          ),
          scheduled(
            6,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0035_liino_ultskill_l_03',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/2/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0].succeedActions.actionData[1]:projectile_chr_0035_liino_ultskill_r_03',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/2/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
            ),
            6,
          ),
          scheduled(
            8,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0035_liino_ultskill_l_02',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/3/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0].succeedActions.actionData[1]:projectile_chr_0035_liino_ultskill_r_02',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/3/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
            ),
            8,
          ),
          scheduled(
            11,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0035_liino_ultskill_l_02',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/4/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0].succeedActions.actionData[1]:projectile_chr_0035_liino_ultskill_r_02',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/4/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
            ),
            11,
          ),
          scheduled(
            15,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0035_liino_ultskill_l_02',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/5/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0].succeedActions.actionData[1]:projectile_chr_0035_liino_ultskill_r_02',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/5/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
            ),
            15,
          ),
          scheduled(
            18,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0035_liino_ultskill_l_03',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/6/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].succeedActions.actionData[1]:projectile_chr_0035_liino_ultskill_r_03',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/6/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
            ),
            18,
          ),
          scheduled(
            40,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[8]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0035_liino_ultskill_bomb',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 4),
                          scheduled(
                            0,
                            sequence(
                              branch(
                                {
                                  kind: 'buffStackCompare',
                                  target: 'enemy',
                                  tagQueryType: 'hasAny',
                                  buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                                  operator: 'greaterOrEqual',
                                  value: { kind: 'constant', value: 0 },
                                },
                                sequence(
                                  step('finishBuffsByTag', {
                                    target: 'enemy',
                                    tagQueryType: 'hasAny',
                                    buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                                    reason: 'early',
                                    count: { kind: 'constant', value: 0 },
                                  }),
                                  step('applyBuff', {
                                    buffId: 'buff_common_pulse_pulse_conduct_triggered',
                                    target: 'enemy',
                                    inheritSourceSkillCastInfo: true,
                                    blackboardAssignments: {
                                      consumed_type: { kind: 'constant', value: 1 },
                                      consumed_layer: { kind: 'constant', value: 0 },
                                      count: { kind: 'blackboard', key: 'count' },
                                    },
                                  }),
                                ),
                              ),
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                  features: ['canBreakWeakness'],
                                  stagger: { kind: 'blackboard', key: 'poise' },
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/7/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/1',
                              ),
                              step('startTimeDilation', {
                                scope: 'entity',
                                durationSeconds: { kind: 'constant', value: 0.25 },
                                slot: 'TimeDilation/Layer/Entity/HitStop',
                                priority: 10,
                                curve: { kind: 'named', key: 'char_hard_stop' },
                                finishByAction: false,
                                targets: ['enemy', 'caster'],
                              }),
                            ),
                            4,
                          ),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
            ),
            40,
          ),
          scheduled(
            21,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[9]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0035_liino_ultskill_l_01',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/8/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[9]._sequenceActionData.actionData[0].succeedActions.actionData[1]:projectile_chr_0035_liino_ultskill_r_01',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/8/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
            ),
            21,
          ),
          scheduled(
            25,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[10]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0035_liino_ultskill_l_02',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/9/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[10]._sequenceActionData.actionData[0].succeedActions.actionData[1]:projectile_chr_0035_liino_ultskill_r_02',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/9/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
            ),
            25,
          ),
          scheduled(
            28,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[11]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0035_liino_ultskill_l_02',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/10/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
              withActionBlackboardScope(
                'SkillData.chr_0035_liino_ultimate_skill_projhit_abilityentity.actionGroupData.timelineActions[11]._sequenceActionData.actionData[0].succeedActions.actionData[1]:projectile_chr_0035_liino_ultskill_r_02',
                {},
                true,
                sequence({
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
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                  takeAttackSnapshot: true,
                                  tags: ['ultimateSkill'],
                                },
                                'abilityentity_chr_0035_liino_ult_skill_projhit:chr_0035_liino_ultimate_skill_projhit_abilityentity:/childSkill/scheduledSequences/10/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0',
                              ),
                            ),
                            3,
                          ),
                          scheduled(0, sequence(), 3),
                        ],
                      },
                    },
                  ],
                }),
                {},
                { lifetime: 'execution' },
              ),
            ),
            28,
          ),
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default liino;
