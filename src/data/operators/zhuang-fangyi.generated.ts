/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type {
  ActionSequenceDefinition,
  OperatorDefinition,
  SkillDefinition,
} from '../../core/game-data/operatorDefinition';
import {
  branch,
  forEachContextTarget,
  forEachTarget,
  instantiateActionSequence,
  repeatByActionValue,
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withActionBlackboardScope,
  withSkillBlackboard,
} from './definitionHelpers';

const sharedActionSequence7: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'buffIdStackCompare',
      target: 'caster',
      buffIds: ['buff_chr_0030_zhuangfy_ult_base'],
      operator: 'greaterOrEqual',
      value: { kind: 'constant', value: 1 },
    },
    sequence(
      step('spawnAbilityEntity', {
        abilityEntityId: 'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
        childSkillId: 'chr_0030_zhuangfy_normal_skill_sword',
        inheritActionBlackboard: true,
        dieWhenSourceDies: true,
        blackboardAssignments: {
          EntityBB_swordDuration: { kind: 'blackboard', key: 'sword_duration' },
          EntityBB_swordLimit: { kind: 'blackboard', key: 'remain_sword_limit' },
        },
      }),
    ),
    sequence(
      step('spawnAbilityEntity', {
        abilityEntityId: 'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
        childSkillId: 'chr_0030_zhuangfy_normal_skill_sword',
        inheritActionBlackboard: true,
        dieWhenSourceDies: true,
        blackboardAssignments: {
          EntityBB_swordDuration: { kind: 'blackboard', key: 'sword_duration' },
          EntityBB_swordLimit: { kind: 'blackboard', key: 'remain_sword_limit' },
        },
      }),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence9: ActionSequenceDefinition = sequence(
  step('readBuffStackCount', {
    target: 'enemy',
    outputKey: 'inflictCnt',
    query: {
      kind: 'tag',
      tagQueryType: 'hasAny',
      buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
    },
  }),
  step('modifyActionValue', {
    key: 'conductCnt',
    operation: 'assign',
    value: { kind: 'blackboard', key: 'inflictCnt' },
  }),
  branch(
    {
      kind: 'buffStackCompare',
      target: 'enemy',
      tagQueryType: 'hasAny',
      buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
      operator: 'greaterOrEqual',
      value: { kind: 'constant', value: 1 },
    },
    sequence(
      step('modifyActionValue', {
        key: 'conductCnt',
        operation: 'add',
        value: { kind: 'constant', value: 1 },
      }),
    ),
    undefined,
    { alwaysNext: true },
  ),
  branch(
    {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'conductCnt', fallback: 0 },
      operator: 'greater',
      right: { kind: 'constant', value: 4 },
    },
    sequence(
      step('modifyActionValue', {
        key: 'conductCnt',
        operation: 'assign',
        value: { kind: 'constant', value: 4 },
      }),
    ),
    undefined,
    { alwaysNext: true },
  ),
  step('applyBuff', {
    buffId: 'buff_common_pulse_pulse_conduct_triggered',
    target: 'enemy',
    inheritSourceSkillCastInfo: true,
    copiedBlackboardAssignments: { count: 'conductCnt' },
  }),
);

const sharedActionSequence6: ActionSequenceDefinition = sequence(
  step('pickContextTarget', {
    sourceContextKey: 'swords',
    saveToContextKey: 'swordToDie',
    index: { kind: 'constant', value: 0 },
  }),
  forEachContextTarget('swordToDie', sequence(step('finishCurrentAbilityEntity', {}))),
  branch(
    {
      kind: 'buffIdStackCompare',
      target: 'caster',
      buffIds: ['buff_chr_0030_zhuangfy_ult_base'],
      operator: 'greaterOrEqual',
      value: { kind: 'constant', value: 1 },
    },
    sequence(
      step('spawnAbilityEntity', {
        abilityEntityId: 'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
        childSkillId: 'chr_0030_zhuangfy_normal_skill_sword',
        inheritActionBlackboard: true,
        dieWhenSourceDies: true,
        blackboardAssignments: {
          EntityBB_swordDuration: { kind: 'blackboard', key: 'sword_duration' },
          EntityBB_swordLimit: { kind: 'blackboard', key: 'remain_sword_limit' },
        },
      }),
    ),
    sequence(
      step('spawnAbilityEntity', {
        abilityEntityId: 'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
        childSkillId: 'chr_0030_zhuangfy_normal_skill_sword',
        inheritActionBlackboard: true,
        dieWhenSourceDies: true,
        blackboardAssignments: {
          EntityBB_swordDuration: { kind: 'blackboard', key: 'sword_duration' },
          EntityBB_swordLimit: { kind: 'blackboard', key: 'remain_sword_limit' },
        },
      }),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence8: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'buffStackCompare',
      target: 'enemy',
      tagQueryType: 'hasAny',
      buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
      operator: 'greaterOrEqual',
      value: { kind: 'constant', value: 1 },
    },
    sharedActionSequence9,
    undefined,
    { alwaysNext: true },
  ),
);

const sharedActionSequence1: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    sequence({
      kind: 'launchProjectile',
      parameters: {
        finish: 2,
        recycleDelaySeconds: 0.100000001490116,
        hit: { finishOnHit: false },
      },
      callbacks: [
        {
          event: 'hit',
          skill: {
            skillId: 'chr_0030_zhuangfy_attack3_sword_projhit',
            nativeSkillType: 'normalSkill',
            naturalDurationFrames: 3,
            castResource: {
              costFrame: 0,
              cooldownSeconds: 0,
              maxChargeTime: 1,
              cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
            },
            blackboard: { atk_scale_sword: 0.3 },
            scheduledSequences: [
              scheduled(
                0,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'electric',
                      attackScale: { kind: 'blackboard', key: 'atk_scale_sword' },
                      tags: ['normalAttack'],
                    },
                    '\u0000endaxis-generated-identity:1',
                  ),
                ),
                1,
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
    '\u0000endaxis-generated-identity:2',
    {},
    true,
    sequence({
      kind: 'launchProjectile',
      parameters: {
        finish: 2,
        recycleDelaySeconds: 0.100000001490116,
        hit: { finishOnHit: false },
      },
      callbacks: [
        {
          event: 'hit',
          skill: {
            skillId: 'chr_0030_zhuangfy_attack3_sword_projhit',
            nativeSkillType: 'normalSkill',
            naturalDurationFrames: 3,
            castResource: {
              costFrame: 0,
              cooldownSeconds: 0,
              maxChargeTime: 1,
              cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
            },
            blackboard: { atk_scale_sword: 0.3 },
            scheduledSequences: [
              scheduled(
                0,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'electric',
                      attackScale: { kind: 'blackboard', key: 'atk_scale_sword' },
                      tags: ['normalAttack'],
                    },
                    '\u0000endaxis-generated-identity:3',
                  ),
                ),
                1,
              ),
            ],
          },
        },
      ],
    }),
    {},
    { lifetime: 'execution' },
  ),
);

const sharedActionSequence5: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'swordsForLimit', fallback: 0 },
      operator: 'greaterOrEqual',
      right: { kind: 'blackboard', key: 'remain_sword_limit', fallback: 0 },
    },
    sharedActionSequence6,
    sharedActionSequence7,
    { alwaysNext: true },
  ),
);

const sharedActionSequence4: ActionSequenceDefinition = sequence(
  step('findOwnerSpawnedAbilityEntities', {
    saveToContextKey: 'swords',
    abilityEntityIds: [
      'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
      'abilityentity_chr_0030_zhuangfy_normal_skill_sword_ult',
    ],
  }),
  branch(
    {
      kind: 'contextTargetCountCompare',
      contextKey: 'swords',
      operator: 'greaterOrEqual',
      value: 0,
      outputKey: 'swordsForLimit',
    },
    sharedActionSequence5,
  ),
);

const sharedActionSequence3: ActionSequenceDefinition = sequence({
  kind: 'launchProjectile',
  parameters: {
    finish: { reachAfterTicks: 1, maxDurationSeconds: 2, finishOnReach: false },
    recycleDelaySeconds: 0.0333333350718021,
  },
  callbacks: [
    {
      event: 'reach',
      skill: {
        skillId: 'chr_0030_zhuangfy_normal_skill_gene_sword_projhit',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 1,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { remain_sword_limit: 0, sword_duration: 0, swordsForLimit: 0 },
        scheduledSequences: [scheduled(0, sharedActionSequence4, 1)],
      },
    },
  ],
});

const sharedActionSequence2: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    sharedActionSequence3,
    {},
    { lifetime: 'execution' },
  ),
);

export const zhuangFangyiChr_0030_zhuangfy_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_attack1',
    timelineBlockFrames: 15,
    naturalDurationFrames: 123,
    exclusiveFrame: 23,
    offsetRecordFrame: 6,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 30,
          input: 'basicAttack',
          targetSkillId: 'chr_0030_zhuangfy_attack2',
        },
      ],
      allowedNextSkills: [
        { startFrame: 15, endFrame: 30, skillIds: ['chr_0030_zhuangfy_attack2'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        6,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0030_zhuangfy_attack1.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:projectile_chr_0030_zhuangfy_attack1',
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
                    skillId: 'chr_0030_zhuangfy_attack1_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atk_scale: 1 },
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
                            'chr_0030_zhuangfy_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        1,
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
        8,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0030_zhuangfy_attack1.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0]:projectile_chr_0030_zhuangfy_attack1',
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
                    skillId: 'chr_0030_zhuangfy_attack1_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atk_scale: 1 },
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
                            'chr_0030_zhuangfy_attack1:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        1,
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
        9,
      ),
      scheduled(
        15,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0030_zhuangfy_attack2'] })),
        30,
      ),
    ],
    timelineContinuationSkillId: 'chr_0030_zhuangfy_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.08, 0.09, 0.1, 0.1, 0.11, 0.12, 0.13, 0.14, 0.14, 0.15, 0.17, 0.18],
    atk_scale_sword: 0.2,
    sword_dist: 0,
    display_atk_scale: [0.16, 0.18, 0.19, 0.21, 0.22, 0.24, 0.26, 0.27, 0.29, 0.31, 0.33, 0.36],
  },
);

export const zhuangFangyiChr_0030_zhuangfy_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_attack2',
    timelineBlockFrames: 15,
    naturalDurationFrames: 320,
    exclusiveFrame: 27,
    offsetRecordFrame: 15,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 36,
          input: 'basicAttack',
          targetSkillId: 'chr_0030_zhuangfy_attack3',
        },
      ],
      allowedNextSkills: [
        { startFrame: 15, endFrame: 36, skillIds: ['chr_0030_zhuangfy_attack3'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        2,
        sequence(
          step('modifyActionValue', {
            key: 'sword_dist',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'sword_dist', fallback: 0 },
              operator: 'lessOrEqual',
              right: { kind: 'constant', value: 10 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'sword_dist',
                operation: 'add',
                value: { kind: 'constant', value: 3 },
              }),
            ),
            sequence(
              step('modifyActionValue', {
                key: 'sword_dist',
                operation: 'assign',
                value: { kind: 'constant', value: 14 },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        3,
      ),
      scheduled(
        2,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0030_zhuangfy_attack2.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0]:projectile_chr_0030_zhuangfy_attack_sword_1',
            {},
            true,
            sequence({
              kind: 'launchProjectile',
              parameters: {
                finish: 2,
                recycleDelaySeconds: 0.100000001490116,
                hit: { finishOnHit: false },
              },
              callbacks: [
                {
                  event: 'hit',
                  skill: {
                    skillId: 'chr_0030_zhuangfy_attack2_sword_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 3,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atk_scale_sword: 1 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_sword' },
                              tags: ['normalAttack'],
                            },
                            'chr_0030_zhuangfy_attack2:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        1,
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
            'SkillData.chr_0030_zhuangfy_attack2.actionGroupData.timelineActions[4]._sequenceActionData.actionData[1]:projectile_chr_0030_zhuangfy_attack_sword_2',
            {},
            true,
            sequence({
              kind: 'launchProjectile',
              parameters: {
                finish: 2,
                recycleDelaySeconds: 0.100000001490116,
                hit: { finishOnHit: false },
              },
              callbacks: [
                {
                  event: 'hit',
                  skill: {
                    skillId: 'chr_0030_zhuangfy_attack2_sword_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 3,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atk_scale_sword: 1 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_sword' },
                              tags: ['normalAttack'],
                            },
                            'chr_0030_zhuangfy_attack2:/scheduledSequences/1/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        1,
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
        3,
      ),
      scheduled(
        15,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack2',
            childSkillId: 'chr_0030_zhuangfy_attack2_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
        ),
        18,
      ),
      scheduled(
        15,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0030_zhuangfy_attack3'] })),
        36,
      ),
    ],
    timelineContinuationSkillId: 'chr_0030_zhuangfy_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atk_scale: [0.04, 0.04, 0.04, 0.05, 0.05, 0.05, 0.06, 0.06, 0.06, 0.07, 0.07, 0.08],
    atk_scale_sword: [0.05, 0.06, 0.06, 0.07, 0.07, 0.08, 0.08, 0.09, 0.09, 0.1, 0.1, 0.11],
    sword_dist: 0,
    display_atk_scale: [0.24, 0.26, 0.29, 0.31, 0.34, 0.36, 0.38, 0.41, 0.43, 0.46, 0.5, 0.54],
  },
);

export const zhuangFangyiChr_0030_zhuangfy_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_attack3',
    timelineBlockFrames: 26,
    naturalDurationFrames: 105,
    exclusiveFrame: 29,
    offsetRecordFrame: 14,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 39,
          input: 'basicAttack',
          targetSkillId: 'chr_0030_zhuangfy_attack4',
        },
      ],
      allowedNextSkills: [
        { startFrame: 26, endFrame: 39, skillIds: ['chr_0030_zhuangfy_attack4'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        14,
        sequence(
          step('modifyActionValue', {
            key: 'sword_dist',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'sword_dist', fallback: 0 },
              operator: 'lessOrEqual',
              right: { kind: 'constant', value: 10 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'sword_dist',
                operation: 'add',
                value: { kind: 'constant', value: 3 },
              }),
            ),
            sequence(
              step('modifyActionValue', {
                key: 'sword_dist',
                operation: 'assign',
                value: { kind: 'constant', value: 14 },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        15,
      ),
      scheduled(
        14,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0030_zhuangfy_attack3.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0]:projectile_chr_0030_zhuangfy_attack_sword_1',
          'chr_0030_zhuangfy_attack3:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
          'SkillData.chr_0030_zhuangfy_attack3.actionGroupData.timelineActions[4]._sequenceActionData.actionData[1]:projectile_chr_0030_zhuangfy_attack_sword_2',
          'chr_0030_zhuangfy_attack3:/scheduledSequences/1/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        15,
      ),
      scheduled(
        16,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0030_zhuangfy_attack3.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0030_zhuangfy_attack_sword_2',
          'chr_0030_zhuangfy_attack3:/scheduledSequences/2/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
          'SkillData.chr_0030_zhuangfy_attack3.actionGroupData.timelineActions[5]._sequenceActionData.actionData[1]:projectile_chr_0030_zhuangfy_attack_sword_1',
          'chr_0030_zhuangfy_attack3:/scheduledSequences/2/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        17,
      ),
      scheduled(
        26,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0030_zhuangfy_attack4'] })),
        39,
      ),
    ],
    timelineContinuationSkillId: 'chr_0030_zhuangfy_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale_sword: [0.08, 0.09, 0.1, 0.1, 0.11, 0.12, 0.13, 0.14, 0.14, 0.15, 0.17, 0.18],
    sword_dist: 0,
    display_atk_scale: [0.32, 0.35, 0.39, 0.42, 0.45, 0.48, 0.52, 0.55, 0.58, 0.62, 0.67, 0.72],
  },
);

export const zhuangFangyiChr_0030_zhuangfy_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_attack4',
    timelineBlockFrames: 17,
    naturalDurationFrames: 170,
    exclusiveFrame: 23,
    offsetRecordFrame: 11,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 33,
          input: 'basicAttack',
          targetSkillId: 'chr_0030_zhuangfy_attack5',
        },
      ],
      allowedNextSkills: [
        { startFrame: 17, endFrame: 33, skillIds: ['chr_0030_zhuangfy_attack5'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        11,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack2',
            childSkillId: 'chr_0030_zhuangfy_attack2_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
        ),
        14,
      ),
      scheduled(
        17,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0030_zhuangfy_attack5'] })),
        33,
      ),
    ],
    timelineContinuationSkillId: 'chr_0030_zhuangfy_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atk_scale: [0.11, 0.12, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.2, 0.22, 0.23, 0.25],
    display_atk_scale: [0.45, 0.5, 0.54, 0.59, 0.63, 0.68, 0.72, 0.77, 0.81, 0.87, 0.93, 1.01],
  },
);

export const zhuangFangyiChr_0030_zhuangfy_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_attack5',
    timelineBlockFrames: 50,
    naturalDurationFrames: 165,
    exclusiveFrame: 55,
    offsetRecordFrame: 20,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 21,
          endFrame: 60,
          input: 'basicAttack',
          targetSkillId: 'chr_0030_zhuangfy_attack1',
        },
      ],
      allowedNextSkills: [
        { startFrame: 50, endFrame: 60, skillIds: ['chr_0030_zhuangfy_attack1'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        20,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack5',
            childSkillId: 'chr_0030_zhuangfy_attack5_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
          }),
        ),
        23,
      ),
      scheduled(
        50,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0030_zhuangfy_attack1'] })),
        60,
      ),
    ],
    timelineContinuationSkillId: 'chr_0030_zhuangfy_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 18,
    atk_scale: [0.48, 0.53, 0.58, 0.62, 0.67, 0.72, 0.77, 0.82, 0.86, 0.92, 1, 1.08],
    poise: 18,
  },
);

export const zhuangFangyiChr_0030_zhuangfy_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_power_attack',
    timelineBlockFrames: 41,
    naturalDurationFrames: 153,
    exclusiveFrame: 45,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 41,
          endFrame: 45,
          skillIds: [
            'chr_0030_zhuangfy_attack1',
            'chr_0030_zhuangfy_combo_skill',
            'chr_0030_zhuangfy_normal_skill',
          ],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        11,
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
            'chr_0030_zhuangfy_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
        ),
        14,
      ),
      scheduled(
        40,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.9,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0030_zhuangfy_power_attack:/scheduledSequences/1/sequence/steps/0',
          ),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        43,
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
        45,
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
        41,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const zhuangFangyiChr_0030_zhuangfy_plunging_attack_end: SkillDefinition =
  withSkillBlackboard(
    {
      key: 'chr_0030_zhuangfy_plunging_attack_end',
      timelineBlockFrames: 21,
      naturalDurationFrames: 170,
      exclusiveFrame: 20,
      offsetRecordFrame: 0,
      costFrame: 0,
      scheduledSequences: [
        scheduled(
          125,
          sequence(
            branch(
              {
                kind: 'buffIdStackCompare',
                target: 'caster',
                buffIds: ['buff_chr_0030_zhuangfy_ult_base'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 1 },
              },
              sequence(step('finishTimeline', {})),
              undefined,
              { alwaysNext: true },
            ),
          ),
          128,
        ),
        scheduled(
          1,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'electric',
                attackScale: { kind: 'blackboard', key: 'atk_scale' },
                tags: ['normalAttack', 'plungingAttack'],
              },
              'chr_0030_zhuangfy_plunging_attack_end:/scheduledSequences/1/sequence/steps/0',
            ),
            branch(
              { kind: 'casterControlled' },
              sequence(
                step('changeResourceByActionValue', {
                  resource: 'sp',
                  amount: { kind: 'blackboard', key: 'atb' },
                  coefficient: { kind: 'constant', value: 1 },
                  recipient: 'team',
                  spGainKind: 'gain',
                  spGainSource: 'normalAttack',
                }),
              ),
            ),
          ),
          6,
        ),
        scheduled(
          0,
          sequence(
            branch(
              {
                kind: 'buffIdStackCompare',
                target: 'caster',
                buffIds: ['buff_chr_0030_zhuangfy_ult_base'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 1 },
              },
              sequence(),
              sequence(
                step('findOwnerSpawnedAbilityEntities', {
                  saveToContextKey: 'airSword',
                  abilityEntityIds: ['abilityentity_chr_0030_zhuangfy_air_attack'],
                }),
                forEachContextTarget('airSword', sequence(step('finishCurrentAbilityEntity', {}))),
              ),
              { alwaysNext: true },
            ),
          ),
          5,
        ),
        scheduled(
          0,
          sequence(
            step('inheritBuffById', {
              target: 'caster',
              buffId: 'buff_chr_0030_zhuangfy_air_attack_ult_extend_buff',
              inheritToNextSkillIds: [],
              finishByAction: true,
              finishWithNextSkillIfNotInherited: true,
            }),
          ),
          6,
        ),
      ],
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      nativeSkillType: 'attack',
    },
    { atb: 0, atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
  );

export const zhuangFangyiChr_0030_zhuangfy_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_normal_skill',
    timelineBlockFrames: 45,
    naturalDurationFrames: 290,
    exclusiveFrame: 135,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 45,
          endFrame: 116,
          skillIds: [
            'chr_0030_zhuangfy_attack1',
            'chr_0030_zhuangfy_attack2',
            'chr_0030_zhuangfy_attack3',
            'chr_0030_zhuangfy_attack4',
            'chr_0030_zhuangfy_attack5',
            'chr_0030_zhuangfy_normal_skill',
            'chr_0030_zhuangfy_power_attack',
          ],
        },
        {
          startFrame: 120,
          endFrame: 147,
          skillIds: [
            'chr_0030_zhuangfy_attack1',
            'chr_0030_zhuangfy_attack2',
            'chr_0030_zhuangfy_attack3',
            'chr_0030_zhuangfy_attack4',
            'chr_0030_zhuangfy_attack5',
            'chr_0030_zhuangfy_normal_skill',
            'chr_0030_zhuangfy_power_attack',
          ],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'swordsForExtend',
            abilityEntityIds: [
              'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
              'abilityentity_chr_0030_zhuangfy_normal_skill_sword_ult',
            ],
          }),
          forEachContextTarget(
            'swordsForExtend',
            sequence(
              branch(
                {
                  kind: 'abilityEntityRemainingDurationCompare',
                  operator: 'less',
                  value: { kind: 'constant', value: 3 },
                },
                sequence(
                  step('setAbilityEntityRemainingDuration', {
                    value: { kind: 'constant', value: 3 },
                  }),
                ),
              ),
            ),
          ),
        ),
        3,
      ),
      scheduled(
        6,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0030_zhuangfy_normal_skill_trigger_sword'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0030_zhuangfy_normal_skill_trigger_sword'],
                reason: 'other',
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('applyBuff', {
            buffId: 'buff_chr_0030_zhuangfy_normal_skill_trigger_sword_tar',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          }),
          branch(
            {
              kind: 'buffStackCompare',
              target: 'enemy',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('readBuffBlackboard', {
                target: 'enemy',
                query: {
                  kind: 'tag',
                  tagQueryType: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
                },
                desiredKey: 'count',
                outputKey: 'conductCnt',
              }),
              step('finishBuffsByTag', {
                target: 'enemy',
                tagQueryType: 'hasAny',
                buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
                reason: 'early',
              }),
              step('modifyActionValue', {
                key: 'sword_gene_num',
                operation: 'add',
                value: { kind: 'blackboard', key: 'conductCnt' },
              }),
              step('modifyActionValue', {
                key: 'sword_gene_num',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'sword_gene_num', fallback: 0 },
                  operator: 'lessOrEqual',
                  right: { kind: 'blackboard', key: 'max_conduct_sword', fallback: 0 },
                },
                sequence(),
                sequence(
                  step('modifyActionValue', {
                    key: 'sword_gene_num',
                    operation: 'assign',
                    value: { kind: 'blackboard', key: 'max_conduct_sword' },
                  }),
                ),
                { alwaysNext: true },
              ),
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb_return' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'team',
                spGainKind: 'refund',
                spGainSource: 'default',
              }),
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0030_zhuangfy_potential1_more_sword'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'sword_gene_num',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              step('createSpatialPointTargets', {
                saveToContextKey: 'swordPos',
                count: { kind: 'blackboard', key: 'sword_gene_num' },
              }),
              step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
              repeatByActionValue(
                { kind: 'blackboard', key: 'sword_gene_num' },
                instantiateActionSequence(sharedActionSequence2, [
                  'SkillData.chr_0030_zhuangfy_normal_skill.actionGroupData.timelineActions[13]._sequenceActionData.actionData[1].succeedActions.actionData[1].succeedActions.actionData[8]:projectile_chr_0030_zhuangfy_normal_skill_gene_sword',
                ]),
              ),
            ),
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
                  operator: 'less',
                  right: { kind: 'blackboard', key: 'free_sword_limit', fallback: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'sword_gene_num',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0030_zhuangfy_potential1_more_sword'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'sword_gene_num',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              step('createSpatialPointTargets', {
                saveToContextKey: 'swordPos',
                count: { kind: 'blackboard', key: 'sword_gene_num' },
              }),
              step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
              repeatByActionValue(
                { kind: 'blackboard', key: 'sword_gene_num' },
                instantiateActionSequence(sharedActionSequence2, [
                  'SkillData.chr_0030_zhuangfy_normal_skill.actionGroupData.timelineActions[13]._sequenceActionData.actionData[1].succeedActions.actionData[1].failActions.actionData[3]:projectile_chr_0030_zhuangfy_normal_skill_gene_sword',
                ]),
              ),
            ),
            { alwaysNext: true },
          ),
        ),
        7,
      ),
      scheduled(
        13,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('calculateActionValue', {
                key: 'swordTriggerInterval',
                operation: 'divide',
                left: { kind: 'blackboard', key: 'EntityBB_SwordNum' },
                right: { kind: 'constant', value: 90 },
              }),
              step('modifyActionValue', {
                key: 'swordTriggerInterval',
                operation: 'multiply',
                value: { kind: 'constant', value: -1 },
              }),
              step('calculateActionValue', {
                key: 'swordTriggerInterval',
                operation: 'add',
                left: { kind: 'constant', value: 0.3 },
                right: { kind: 'blackboard', key: 'swordTriggerInterval' },
              }),
              step('calculateActionValue', {
                key: 'atk_up_final',
                operation: 'multiply',
                left: { kind: 'blackboard', key: 'atk_up_per_conduct' },
                right: { kind: 'blackboard', key: 'conductCnt' },
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0030_zhuangfy_normal_skill_trigger_sword',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: {
                  interval: 'swordTriggerInterval',
                  sword_range: 'sword_range',
                  atk_scale: 'atk_scale',
                  poise: 'poise',
                  usp_extra: 'usp_extra',
                  atk_up_final: 'atk_up_final',
                  remain_sword_limit: 'remain_sword_limit',
                  final_rate: 'final_rate',
                },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        16,
      ),
      scheduled(
        123,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.25 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: {
                  kind: 'inline',
                  keys: [
                    {
                      time: 0,
                      value: 0.01,
                      inTangent: 0,
                      outTangent: 0,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.7704785,
                      value: 0.01,
                      inTangent: 0,
                      outTangent: 0,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 1,
                      inTangent: 4.313321,
                      outTangent: 4.313321,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                  ],
                },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
            ),
          ),
        ),
        126,
      ),
      scheduled(
        6,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0030_zhuangfy_talent1',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        7,
      ),
      scheduled(
        123,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.25 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: {
                  kind: 'inline',
                  keys: [
                    {
                      time: 0,
                      value: 0.01,
                      inTangent: 0,
                      outTangent: 0,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.7704785,
                      value: 0.01,
                      inTangent: 0,
                      outTangent: 0,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 1,
                      inTangent: 4.313321,
                      outTangent: 4.313321,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                  ],
                },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
            ),
          ),
        ),
        126,
      ),
      scheduled(
        16,
        sequence(
          step('jumpTimeline', {
            destinationFrame: 116,
            condition: {
              kind: 'any',
              conditions: [
                { kind: 'timedMarkerPresent', target: 'caster', markerId: 'skillEnd' },
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
              ],
            },
          }),
        ),
        116,
      ),
    ],
    smartTarget: 'enemy',
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb_return: 0,
    atk_scale: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45],
    atk_up_final: 0,
    atk_up_per_conduct: [0.03, 0.04, 0.04, 0.04, 0.05, 0.05, 0.05, 0.06, 0.06, 0.07, 0.08, 0.09],
    cam_angle: 0,
    conductCnt: 0,
    final_rate: 6,
    free_sword_limit: 3,
    input_angle: 0,
    max_conduct_sword: 3,
    poise: 15,
    remain_sword_limit: 9,
    sword_duration: 36,
    sword_gene_num: 0,
    sword_range: 50,
    swordTriggerInterval: 0,
    usp_extra: 6,
    usp_extra_limit: 54,
  },
);

export const zhuangFangyiChr_0030_zhuangfy_normal_skill_ult: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_normal_skill_ult',
    timelineBlockFrames: 30,
    naturalDurationFrames: 210,
    exclusiveFrame: 143,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 30,
          endFrame: 143,
          skillIds: [
            'chr_0030_zhuangfy_attack1_ult',
            'chr_0030_zhuangfy_attack2_ult',
            'chr_0030_zhuangfy_attack3_ult',
            'chr_0030_zhuangfy_normal_skill_ult',
          ],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'swordsForExtend',
            abilityEntityIds: [
              'abilityentity_chr_0030_zhuangfy_normal_skill_sword',
              'abilityentity_chr_0030_zhuangfy_normal_skill_sword_ult',
            ],
          }),
          forEachContextTarget(
            'swordsForExtend',
            sequence(
              branch(
                {
                  kind: 'abilityEntityRemainingDurationCompare',
                  operator: 'less',
                  value: { kind: 'constant', value: 3 },
                },
                sequence(
                  step('setAbilityEntityRemainingDuration', {
                    value: { kind: 'constant', value: 3 },
                  }),
                ),
              ),
            ),
          ),
        ),
        3,
      ),
      scheduled(
        5,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0030_zhuangfy_normal_skill_trigger_sword_tar',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          }),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0030_zhuangfy_ult_skill_free'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0030_zhuangfy_potential1_more_sword'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: '__endaxis_target_group_count:swordPos',
                    operation: 'assign',
                    value: { kind: 'constant', value: 4 },
                  }),
                  step('createSpatialPointTargets', {
                    saveToContextKey: 'swordPos',
                    count: { kind: 'constant', value: 4 },
                  }),
                  step('finishBuffsById', {
                    target: 'caster',
                    buffIds: ['buff_chr_0030_zhuangfy_ult_skill_free'],
                    reason: 'other',
                  }),
                  repeatByActionValue(
                    { kind: 'blackboard', key: '__endaxis_target_group_count:swordPos' },
                    instantiateActionSequence(sharedActionSequence2, [
                      'SkillData.chr_0030_zhuangfy_normal_skill_ult.actionGroupData.timelineActions[9]._sequenceActionData.actionData[0].succeedActions.actionData[1].succeedActions.actionData[0].succeedActions.actionData[1]:projectile_chr_0030_zhuangfy_normal_skill_gene_sword',
                    ]),
                  ),
                ),
                sequence(
                  step('modifyActionValue', {
                    key: '__endaxis_target_group_count:swordPos',
                    operation: 'assign',
                    value: { kind: 'constant', value: 3 },
                  }),
                  step('createSpatialPointTargets', {
                    saveToContextKey: 'swordPos',
                    count: { kind: 'constant', value: 3 },
                  }),
                  step('finishBuffsById', {
                    target: 'caster',
                    buffIds: ['buff_chr_0030_zhuangfy_ult_skill_free'],
                    reason: 'other',
                  }),
                  repeatByActionValue(
                    { kind: 'blackboard', key: '__endaxis_target_group_count:swordPos' },
                    instantiateActionSequence(sharedActionSequence2, [
                      'SkillData.chr_0030_zhuangfy_normal_skill_ult.actionGroupData.timelineActions[9]._sequenceActionData.actionData[0].succeedActions.actionData[1].succeedActions.actionData[0].failActions.actionData[1]:projectile_chr_0030_zhuangfy_normal_skill_gene_sword',
                    ]),
                  ),
                ),
                { alwaysNext: true },
              ),
            ),
            sequence(
              branch(
                {
                  kind: 'buffStackCompare',
                  target: 'enemy',
                  tagQueryType: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('readBuffBlackboard', {
                    target: 'enemy',
                    query: {
                      kind: 'tag',
                      tagQueryType: 'hasAny',
                      buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
                    },
                    desiredKey: 'count',
                    outputKey: 'conductCnt',
                  }),
                  step('finishBuffsByTag', {
                    target: 'enemy',
                    tagQueryType: 'hasAny',
                    buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
                    reason: 'early',
                  }),
                  step('modifyActionValue', {
                    key: 'sword_gene_num',
                    operation: 'add',
                    value: { kind: 'blackboard', key: 'conductCnt' },
                  }),
                  step('modifyActionValue', {
                    key: 'sword_gene_num',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'sword_gene_num', fallback: 0 },
                      operator: 'lessOrEqual',
                      right: { kind: 'blackboard', key: 'max_conduct_sword', fallback: 0 },
                    },
                    sequence(),
                    sequence(
                      step('modifyActionValue', {
                        key: 'sword_gene_num',
                        operation: 'assign',
                        value: { kind: 'blackboard', key: 'max_conduct_sword' },
                      }),
                    ),
                    { alwaysNext: true },
                  ),
                  step('changeResourceByActionValue', {
                    resource: 'sp',
                    amount: { kind: 'blackboard', key: 'atb_return' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'team',
                    spGainKind: 'refund',
                    spGainSource: 'default',
                  }),
                  branch(
                    {
                      kind: 'buffIdStackCompare',
                      target: 'caster',
                      buffIds: ['buff_chr_0030_zhuangfy_potential1_more_sword'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'sword_gene_num',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
                  ),
                  step('modifyActionValue', {
                    key: '__endaxis_target_group_count:swordPos',
                    operation: 'assign',
                    value: { kind: 'blackboard', key: 'sword_gene_num' },
                  }),
                  step('createSpatialPointTargets', {
                    saveToContextKey: 'swordPos',
                    count: { kind: 'blackboard', key: 'sword_gene_num' },
                  }),
                  step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
                  repeatByActionValue(
                    { kind: 'blackboard', key: '__endaxis_target_group_count:swordPos' },
                    instantiateActionSequence(sharedActionSequence2, [
                      'SkillData.chr_0030_zhuangfy_normal_skill_ult.actionGroupData.timelineActions[9]._sequenceActionData.actionData[0].succeedActions.actionData[1].failActions.actionData[0].succeedActions.actionData[8]:projectile_chr_0030_zhuangfy_normal_skill_gene_sword',
                    ]),
                  ),
                ),
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
                      operator: 'less',
                      right: { kind: 'blackboard', key: 'free_sword_limit', fallback: 0 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'sword_gene_num',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
                  ),
                  branch(
                    {
                      kind: 'buffIdStackCompare',
                      target: 'caster',
                      buffIds: ['buff_chr_0030_zhuangfy_potential1_more_sword'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'sword_gene_num',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
                  ),
                  step('modifyActionValue', {
                    key: '__endaxis_target_group_count:swordPos',
                    operation: 'assign',
                    value: { kind: 'blackboard', key: 'sword_gene_num' },
                  }),
                  step('createSpatialPointTargets', {
                    saveToContextKey: 'swordPos',
                    count: { kind: 'blackboard', key: 'sword_gene_num' },
                  }),
                  step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
                  repeatByActionValue(
                    { kind: 'blackboard', key: '__endaxis_target_group_count:swordPos' },
                    instantiateActionSequence(sharedActionSequence2, [
                      'SkillData.chr_0030_zhuangfy_normal_skill_ult.actionGroupData.timelineActions[9]._sequenceActionData.actionData[0].succeedActions.actionData[1].failActions.actionData[0].failActions.actionData[3]:projectile_chr_0030_zhuangfy_normal_skill_gene_sword',
                    ]),
                  ),
                ),
                { alwaysNext: true },
              ),
            ),
            { alwaysNext: true },
          ),
        ),
        6,
      ),
      scheduled(
        5,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0030_zhuangfy_talent1',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        6,
      ),
      scheduled(
        15,
        sequence(
          step('calculateActionValue', {
            key: 'atk_up_final',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'conductCnt' },
            right: { kind: 'blackboard', key: 'atk_up_per_conduct' },
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_normal_skill_ult',
            childSkillId: 'chr_0030_zhuangfy_normal_skill_ult_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: true,
            blackboardAssignments: {
              EntityBB_SwordNum: { kind: 'blackboard', key: 'EntityBB_SwordNum' },
            },
          }),
        ),
        18,
      ),
      scheduled(
        100,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0030_zhuangfy_ult_skill_free'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0030_zhuangfy_ult_skill_free'],
                reason: 'other',
              }),
            ),
          ),
        ),
        103,
      ),
      scheduled(
        16,
        sequence(
          step('jumpTimeline', {
            destinationFrame: 100,
            condition: {
              kind: 'any',
              conditions: [
                { kind: 'timedMarkerPresent', target: 'caster', markerId: 'skillEnd' },
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
              ],
            },
          }),
        ),
        100,
      ),
      scheduled(
        0,
        sequence(
          step('holdBuffsById', { target: 'caster', buffIds: ['buff_chr_0030_zhuangfy_ult_base'] }),
        ),
        18,
      ),
    ],
    smartTarget: 'enemy',
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb_return: 0,
    atk_scale: [0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81],
    atk_up_final: 0,
    atk_up_per_conduct: [0.08, 0.09, 0.1, 0.11, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18],
    cam_angle: 0,
    conductCnt: 0,
    final_rate: 6,
    free_sword_limit: 3,
    input_angle: 0,
    max_conduct_sword: 3,
    poise: 15,
    remain_sword_limit: 9,
    sword_duration: 36,
    sword_gene_num: 0,
    sword_range: 50,
    swordTriggerInterval: 0,
  },
);

export const zhuangFangyiChr_0030_zhuangfy_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_combo_skill',
    timelineBlockFrames: 25,
    naturalDurationFrames: 210,
    exclusiveFrame: 60,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 25,
          endFrame: 60,
          skillIds: [
            'chr_0030_zhuangfy_normal_skill',
            'chr_0030_zhuangfy_power_attack',
            'chr_0030_zhuangfy_attack1',
            'chr_0030_zhuangfy_attack2',
            'chr_0030_zhuangfy_attack3',
            'chr_0030_zhuangfy_attack4',
            'chr_0030_zhuangfy_attack5',
          ],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.6 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        15,
      ),
      scheduled(24, sharedActionSequence8, 27),
      scheduled(
        24,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0030_zhuangfy_combo_skill:/scheduledSequences/2/sequence/steps/0',
          ),
          step('finishBuffsByTag', {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            reason: 'early',
          }),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'usp' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          }),
          step('calculateActionValue', {
            key: 'usp_extra',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'usp_extra' },
            right: { kind: 'blackboard', key: 'inflictCnt' },
          }),
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'usp_extra' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          }),
        ),
        27,
      ),
    ],
    smartTarget: 'enemy',
    cooldownFrames: [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 510],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [1.6, 1.76, 1.92, 2.08, 2.24, 2.4, 2.56, 2.72, 2.88, 3.08, 3.32, 3.6],
    conductCnt: 0,
    inflictCnt: 0,
    poise: 10,
    usp: 10,
    usp_extra: 10,
  },
);

export const zhuangFangyiChr_0030_zhuangfy_combo_skill_ult: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_combo_skill_ult',
    timelineBlockFrames: 25,
    naturalDurationFrames: 197,
    exclusiveFrame: 30,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 25,
          endFrame: 54,
          skillIds: [
            'chr_0030_zhuangfy_normal_skill_ult',
            'chr_0030_zhuangfy_attack1_ult',
            'chr_0030_zhuangfy_attack2_ult',
            'chr_0030_zhuangfy_attack3_ult',
          ],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.6 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        15,
      ),
      scheduled(24, sharedActionSequence8, 27),
      scheduled(
        24,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0030_zhuangfy_combo_skill_ult:/scheduledSequences/2/sequence/steps/0',
          ),
          step('finishBuffsByTag', {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
            reason: 'early',
          }),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
          step('createTimedMarker', {
            target: 'enemy',
            markerId: 'zhuangfy_combo_ult_tar',
            durationSeconds: { kind: 'constant', value: 0.5 },
            autoFinishByAction: false,
          }),
        ),
        27,
      ),
      scheduled(
        24,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0030_zhuangfy_combo_skill_ult.actionGroupData.timelineActions[15]._sequenceActionData.actionData[0]:projectile_chr_0030_zhuangfy_combo_skill_ring',
            {},
            true,
            sequence({
              kind: 'launchProjectile',
              parameters: {
                finish: 0.5,
                recycleDelaySeconds: 0.0333333350718021,
                hit: { finishOnHit: false },
              },
              callbacks: [
                {
                  event: 'hit',
                  skill: {
                    skillId: 'chr_0030_zhuangfy_combo_skill_ring_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atk_scale: 1.43, poise: 0, swordNum: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          forEachTarget(
                            'enemy',
                            sequence(
                              branch(
                                {
                                  kind: 'not',
                                  condition: {
                                    kind: 'timedMarkerPresent',
                                    target: 'enemy',
                                    markerId: 'zhuangfy_combo_ult_tar',
                                  },
                                },
                                sequence(
                                  step('applyBuff', {
                                    buffId: 'buff_chr_0030_zhuangfy_combo_skill_ring_hit',
                                    target: 'enemy',
                                    inheritSourceSkillCastInfo: true,
                                    copiedBlackboardAssignments: {
                                      atk_scale: 'atk_scale',
                                      poise: 'poise',
                                    },
                                  }),
                                ),
                              ),
                            ),
                          ),
                        ),
                        1,
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
        27,
      ),
      scheduled(
        0,
        sequence(
          step('holdBuffsById', { target: 'caster', buffIds: ['buff_chr_0030_zhuangfy_ult_base'] }),
        ),
        28,
      ),
    ],
    smartTarget: 'enemy',
    cooldownFrames: [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 510],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atk_scale: [2.4, 2.64, 2.88, 3.12, 3.36, 3.6, 3.84, 4.08, 4.32, 4.62, 4.98, 5.4],
    conductCnt: 0,
    inflictCnt: 0,
    poise: 10,
  },
);

export const zhuangFangyiChr_0030_zhuangfy_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_ultimate_skill',
    timelineBlockFrames: 91,
    naturalDurationFrames: 208,
    exclusiveFrame: 90,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_ult_mirror',
            inheritActionBlackboard: true,
            dieWhenSourceDies: true,
            finishByAction: true,
            overrideDurationSeconds: { kind: 'constant', value: 0.83 },
            saveToContextKey: 'ult_postmodel_mirror',
          }),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0030_zhuangfy_potential5_vfx'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              forEachContextTarget(
                'ult_postmodel_mirror',
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0030_zhuangfy_potential5_vfx',
                    target: 'currentAbilityEntity',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        17,
      ),
      scheduled(
        0,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_ult',
            inheritActionBlackboard: true,
            dieWhenSourceDies: true,
            finishByAction: true,
            overrideDurationSeconds: { kind: 'constant', value: 2.7 },
            saveToContextKey: 'ult_postmodel',
          }),
        ),
        78,
      ),
      scheduled(
        78,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0030_zhuangfy_ult_base',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration', combo_cd_rate: 'combo_cd_rate' },
          }),
        ),
        81,
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
        3,
      ),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
            ignoredAbilityEntityTargets: [
              { kind: 'context', contextKey: 'ult_postmodel_mirror' },
              { kind: 'context', contextKey: 'ult_postmodel' },
            ],
          }),
        ),
        78,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 78),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_common_damage_immune_ult_skill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        90,
      ),
    ],
    cooldownFrames: 450,
    costs: [{ resource: 'ultimateEnergy', value: 240 }],
    enhancementStateBuffId: 'buff_chr_0030_zhuangfy_ult_base',
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  { combo_cd_rate: 4, duration: 25, duration_extra: 1 },
);

export const zhuangFangyiChr_0030_zhuangfy_ultimate_skill_end: SkillDefinition =
  withSkillBlackboard(
    {
      key: 'chr_0030_zhuangfy_ultimate_skill_end',
      timelineBlockFrames: 21,
      naturalDurationFrames: 189,
      exclusiveFrame: 20,
      offsetRecordFrame: 0,
      costFrame: 0,
      scheduledSequences: [
        scheduled(
          0,
          sequence(
            step('finishBuffsById', {
              target: 'caster',
              buffIds: ['buff_chr_0030_zhuangfy_ult_hide_model'],
              reason: 'other',
            }),
          ),
          3,
        ),
      ],
      skillType: 'ultimate',
      levelSource: 'ultimate',
      nativeSkillType: 'normalSkill',
    },
    { atk_scale: 0.7 },
  );

export const zhuangFangyiChr_0030_zhuangfy_attack1_ult: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_attack1_ult',
    timelineBlockFrames: 22,
    naturalDurationFrames: 160,
    exclusiveFrame: 135,
    offsetRecordFrame: 14,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 60,
          input: 'basicAttack',
          targetSkillId: 'chr_0030_zhuangfy_attack2_ult',
        },
      ],
      allowedNextSkills: [
        { startFrame: 22, endFrame: 60, skillIds: ['chr_0030_zhuangfy_attack2_ult'] },
        { startFrame: 60, endFrame: 135, skillIds: ['chr_0030_zhuangfy_attack1_ult'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('holdBuffsById', { target: 'caster', buffIds: ['buff_chr_0030_zhuangfy_ult_base'] }),
        ),
        22,
      ),
      scheduled(
        12,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_1_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          }),
          step('modifyActionValue', {
            key: 'target_in_range',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          }),
        ),
        13,
      ),
      scheduled(
        13,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_2_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          }),
        ),
        14,
      ),
      scheduled(
        14,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_3_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          }),
        ),
        15,
      ),
      scheduled(
        15,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_4_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          }),
        ),
        16,
      ),
      scheduled(
        22,
        sequence(
          step('reachSkillOperableBoundary', { skillIds: ['chr_0030_zhuangfy_attack2_ult'] }),
        ),
        60,
      ),
      scheduled(
        60,
        sequence(
          step('reachSkillOperableBoundary', { skillIds: ['chr_0030_zhuangfy_attack1_ult'] }),
        ),
        135,
      ),
    ],
    timelineContinuationSkillId: 'chr_0030_zhuangfy_attack2_ult',
    skillType: 'basicAttack',
    levelSource: 'ultimate',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.67, 0.73, 0.8, 0.86, 0.93, 1, 1.06, 1.13, 1.2, 1.28, 1.38, 1.5],
    sword_dist: 0,
    target_in_range: 0,
  },
);

export const zhuangFangyiChr_0030_zhuangfy_attack2_ult: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_attack2_ult',
    timelineBlockFrames: 27,
    naturalDurationFrames: 155,
    exclusiveFrame: 120,
    offsetRecordFrame: 12,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 60,
          input: 'basicAttack',
          targetSkillId: 'chr_0030_zhuangfy_attack3_ult',
        },
      ],
      allowedNextSkills: [
        { startFrame: 27, endFrame: 60, skillIds: ['chr_0030_zhuangfy_attack3_ult'] },
        { startFrame: 60, endFrame: 120, skillIds: ['chr_0030_zhuangfy_attack1_ult'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        10,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_1_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          }),
          step('modifyActionValue', {
            key: 'target_in_range',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          }),
        ),
        11,
      ),
      scheduled(
        11,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_2_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          }),
        ),
        12,
      ),
      scheduled(
        12,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_3_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          }),
        ),
        13,
      ),
      scheduled(
        13,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack_ult',
            childSkillId: 'chr_0030_zhuangfy_attack1_ult_4_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            stringBlackboardAssignments: { EntityBB_hitedMark: 'attack1UltHitMark' },
          }),
        ),
        14,
      ),
      scheduled(
        0,
        sequence(
          step('holdBuffsById', { target: 'caster', buffIds: ['buff_chr_0030_zhuangfy_ult_base'] }),
        ),
        17,
      ),
      scheduled(
        27,
        sequence(
          step('reachSkillOperableBoundary', { skillIds: ['chr_0030_zhuangfy_attack3_ult'] }),
        ),
        60,
      ),
      scheduled(
        60,
        sequence(
          step('reachSkillOperableBoundary', { skillIds: ['chr_0030_zhuangfy_attack1_ult'] }),
        ),
        120,
      ),
    ],
    timelineContinuationSkillId: 'chr_0030_zhuangfy_attack3_ult',
    skillType: 'basicAttack',
    levelSource: 'ultimate',
    nativeSkillType: 'attack',
  },
  {
    atk_scale: [0.94, 1.03, 1.12, 1.22, 1.31, 1.4, 1.5, 1.59, 1.68, 1.8, 1.94, 2.1],
    sword_dist: 0,
    target_in_range: 0,
  },
);

export const zhuangFangyiChr_0030_zhuangfy_attack3_ult: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_attack3_ult',
    timelineBlockFrames: 60,
    naturalDurationFrames: 179,
    exclusiveFrame: 140,
    offsetRecordFrame: 33,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 140,
          input: 'basicAttack',
          targetSkillId: 'chr_0030_zhuangfy_attack1_ult',
        },
      ],
      allowedNextSkills: [
        { startFrame: 60, endFrame: 140, skillIds: ['chr_0030_zhuangfy_attack1_ult'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        3,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_attack3_ult',
            childSkillId: 'chr_0030_zhuangfy_attack3_ult_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'thunder',
          }),
        ),
        6,
      ),
      scheduled(
        3,
        sequence(
          forEachContextTarget(
            'thunder',
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0030_zhuangfy_attack3_ult_cancel',
                target: 'currentAbilityEntity',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: ['chr_0030_zhuangfy_attack1_ult'],
              }),
            ),
          ),
        ),
        179,
      ),
      scheduled(
        0,
        sequence(
          step('holdBuffsById', { target: 'caster', buffIds: ['buff_chr_0030_zhuangfy_ult_base'] }),
        ),
        35,
      ),
      scheduled(
        60,
        sequence(
          step('reachSkillOperableBoundary', { skillIds: ['chr_0030_zhuangfy_attack1_ult'] }),
        ),
        140,
      ),
    ],
    timelineContinuationSkillId: 'chr_0030_zhuangfy_attack1_ult',
    skillType: 'basicAttack',
    levelSource: 'ultimate',
    nativeSkillType: 'attack',
  },
  {
    atb: 20,
    atk_scale: [1.34, 1.47, 1.6, 1.74, 1.87, 2, 2.14, 2.27, 2.4, 2.57, 2.77, 3],
    poise: 18,
    thunderIndex: 0,
  },
);

export const zhuangFangyiChr_0030_zhuangfy_perfect_dodge: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0030_zhuangfy_perfect_dodge',
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

export const zhuangFangyi: OperatorDefinition = {
  slug: 'zhuang-fangyi',
  gameId: 'ZHUANGFANGYI',
  rarity: 6,
  weaponType: 'arts-unit',
  element: 'electric',
  role: 'striker',
  mainAttribute: 'will',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [10, 29, 49, 69, 89, 99],
    agility: [10, 29, 49, 69, 89, 99],
    intellect: [17, 39, 63, 87, 111, 123],
    will: [24, 58, 94, 130, 166, 184],
    baseAttack: [30, 93, 160, 227, 293, 326],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  passiveUi: { kind: 'numeric', appearance: 'zhuangFangyiThunder', maximum: 9, activeAt: 9 },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        zhuangFangyiChr_0030_zhuangfy_attack1,
        zhuangFangyiChr_0030_zhuangfy_attack2,
        zhuangFangyiChr_0030_zhuangfy_attack3,
        zhuangFangyiChr_0030_zhuangfy_attack4,
        zhuangFangyiChr_0030_zhuangfy_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: zhuangFangyiChr_0030_zhuangfy_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: zhuangFangyiChr_0030_zhuangfy_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: zhuangFangyiChr_0030_zhuangfy_normal_skill,
      replacementSkills: [zhuangFangyiChr_0030_zhuangfy_normal_skill_ult],
      replacementSkillPlacements: { chr_0030_zhuangfy_normal_skill_ult: 'standard' },
      replacementSkillNameQualifiers: { chr_0030_zhuangfy_normal_skill_ult: 'enhanced' },
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: zhuangFangyiChr_0030_zhuangfy_combo_skill,
      replacementSkills: [zhuangFangyiChr_0030_zhuangfy_combo_skill_ult],
      replacementSkillPlacements: { chr_0030_zhuangfy_combo_skill_ult: 'standard' },
      replacementSkillNameQualifiers: { chr_0030_zhuangfy_combo_skill_ult: 'enhanced' },
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: zhuangFangyiChr_0030_zhuangfy_ultimate_skill,
      replacementSkills: [zhuangFangyiChr_0030_zhuangfy_ultimate_skill_end],
      replacementSkillPlacements: { chr_0030_zhuangfy_ultimate_skill_end: 'internal' },
    },
    {
      key: 'enhancedBasicAttack',
      skillType: 'basicAttack',
      levelSource: 'ultimate',
      libraryNameQualifier: 'enhanced',
      skills: [
        zhuangFangyiChr_0030_zhuangfy_attack1_ult,
        zhuangFangyiChr_0030_zhuangfy_attack2_ult,
        zhuangFangyiChr_0030_zhuangfy_attack3_ult,
      ],
    },
  ],
  dodgeSkill: zhuangFangyiChr_0030_zhuangfy_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'chr_0030_zhuangfy_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0030_zhuangfy_normal_skill',
      replacementSkillKeys: ['chr_0030_zhuangfy_normal_skill_ult'],
    },
    {
      key: 'comboSkill',
      baseSkillKey: 'chr_0030_zhuangfy_combo_skill',
      replacementSkillKeys: ['chr_0030_zhuangfy_combo_skill_ult'],
    },
    { key: 'ultimate', baseSkillKey: 'chr_0030_zhuangfy_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0030_zhuangfy_attack1',
        'chr_0030_zhuangfy_attack2',
        'chr_0030_zhuangfy_attack3',
        'chr_0030_zhuangfy_attack4',
        'chr_0030_zhuangfy_attack5',
        'chr_0030_zhuangfy_plunging_attack_end',
        'chr_0030_zhuangfy_power_attack',
        'chr_0030_zhuangfy_attack1_ult',
        'chr_0030_zhuangfy_attack2_ult',
        'chr_0030_zhuangfy_attack3_ult',
      ],
      normalAttackSkillKeys: [
        'chr_0030_zhuangfy_attack1',
        'chr_0030_zhuangfy_attack2',
        'chr_0030_zhuangfy_attack3',
        'chr_0030_zhuangfy_attack4',
        'chr_0030_zhuangfy_attack5',
      ],
      defaultSkillKey: 'chr_0030_zhuangfy_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  playerActionModes: [
    {
      modeId: 'UltMode',
      modeLayer: 'UltMode',
      defaultEnabled: false,
      normalAttackSkillKeys: [
        'chr_0030_zhuangfy_attack1_ult',
        'chr_0030_zhuangfy_attack2_ult',
        'chr_0030_zhuangfy_attack3_ult',
      ],
      commandMappings: { basicAttack: { skillId: 'chr_0030_zhuangfy_attack1_ult' } },
    },
  ],
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0030_zhuangfy_combo_skill',
      event: 'beforeOutputDamage',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalAttackLastCombo'] },
          sequence(
            branch(
              {
                kind: 'contextTargetIdentityMatch',
                contextKey: 'trigger',
                other: 'controlledOperator',
                operator: 'equal',
              },
              sequence(
                branch(
                  {
                    kind: 'buffStackCompare',
                    target: 'actionInputTarget',
                    tagQueryType: 'hasAny',
                    buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 1 },
                  },
                  sequence(
                    branch(
                      { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['enemy'] },
                      sequence(),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    },
    {
      key: 'native-combo:1',
      skillKey: 'chr_0030_zhuangfy_combo_skill',
      event: 'beforeOutputDamage',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'contextTargetIdentityMatch',
            contextKey: 'trigger',
            other: 'controlledOperator',
            operator: 'equal',
          },
          sequence(
            branch(
              { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['powerAttack'] },
              sequence(
                branch(
                  {
                    kind: 'contextTargetIdentityMatch',
                    contextKey: 'trigger',
                    other: 'controlledOperator',
                    operator: 'equal',
                  },
                  sequence(
                    branch(
                      {
                        kind: 'buffStackCompare',
                        target: 'actionInputTarget',
                        tagQueryType: 'hasAny',
                        buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                        operator: 'greaterOrEqual',
                        value: { kind: 'constant', value: 1 },
                      },
                      sequence(
                        branch(
                          { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['enemy'] },
                          sequence(),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
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
      passiveSkills: [
        {
          key: 'chr_0030_zhuangfy_talent1',
          blackboard: { base_rate: [0.09, 0.18], duration: [5, 5], enhance_rate: [0.01, 0.02] },
          enableSequence: sequence(),
          abilityEventResponses: [
            {
              event: 'addedBuff',
              priority: 0,
              sequence: sequence(
                branch(
                  { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0030_zhuangfy_talent1'] },
                  sequence(
                    step('applyBuff', {
                      buffId: 'buff_chr_0030_zhuangfy_talent1_base',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        duration: 'duration',
                        base_rate: 'base_rate',
                        enhance_rate: 'enhance_rate',
                      },
                    }),
                  ),
                ),
              ),
            },
          ],
        },
      ],
    },
    {
      levels: 2,
      passiveSkills: [
        {
          key: 'chr_0030_zhuangfy_talent2',
          blackboard: {
            base_rate: [0.09, 0.09],
            duration: [99, 99],
            heal: [0.09, 0.18],
            sword_rate: [0.01, 0.01],
          },
          enableSequence: sequence(),
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
          skillKey: 'chr_0030_zhuangfy_normal_skill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill',
          blackboardKey: 'atk_up_per_conduct',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill_ult',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill_ult',
          blackboardKey: 'atk_up_per_conduct',
          operation: 'multiply',
          value: 1.15,
        },
      ],
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0030_zhuangfy_potential1',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
        }),
      ),
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['will'], value: 20 },
        { kind: 'addStaticDamageIncrease', target: 'battleSkill', value: 0.15 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill',
          blackboardKey: 'sword_duration',
          operation: 'add',
          value: 10,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill',
          blackboardKey: 'atb_return',
          operation: 'assign',
          value: 10,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill_ult',
          blackboardKey: 'sword_duration',
          operation: 'add',
          value: 10,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0030_zhuangfy_normal_skill_ult',
          blackboardKey: 'atb_return',
          operation: 'assign',
          value: 10,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillGroupKey: 'ultimate',
          skillKey: 'chr_0030_zhuangfy_ultimate_skill',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0030_zhuangfy_potential5',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { ignore_pulse_resist: { kind: 'constant', value: -15 } },
        }),
      ),
    },
  ],
  entityBlackboard: { EntityBB_SwordNum: 0 },
  passiveSkills: [
    {
      key: 'chr_0030_zhuangfy_check_sword_passive',
      blackboard: { swordRange: 50 },
      enableSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0030_zhuangfy_passive_check_sword',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { swordRange: { kind: 'blackboard', key: 'swordRange' } },
        }),
      ),
    },
  ],
  buffDefinitions: {
    buff_chr_0030_zhuangfy_attack3_ult_cancel: {
      stackingType: 'unique',
      priority: 1,
      maxStackCount: 1,
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
      blackboard: { cancel_mark: 0 },
      attributeModifiers: [],
      lifecycleSequences: { finish: sequence(step('finishCurrentAbilityEntity', {})) },
    },
    buff_chr_0030_zhuangfy_combo_skill_ring_hit: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 5,
      durationSeconds: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale: 0, conductCnt: 0, inflictCnt: 0, poise: 0 },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          12,
          sequence(
            branch(
              {
                kind: 'buffStackCompare',
                target: 'buffOwner',
                tagQueryType: 'hasAny',
                buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 1 },
              },
              sequence(
                step('readBuffStackCount', {
                  target: 'buffOwner',
                  outputKey: 'inflictCnt',
                  query: {
                    kind: 'tag',
                    tagQueryType: 'hasAny',
                    buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                  },
                }),
                step('modifyActionValue', {
                  key: 'conductCnt',
                  operation: 'assign',
                  value: { kind: 'blackboard', key: 'inflictCnt' },
                }),
                branch(
                  {
                    kind: 'buffStackCompare',
                    target: 'buffOwner',
                    tagQueryType: 'hasAny',
                    buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 1 },
                  },
                  sequence(
                    step('modifyActionValue', {
                      key: 'conductCnt',
                      operation: 'add',
                      value: { kind: 'constant', value: 1 },
                    }),
                  ),
                  undefined,
                  { alwaysNext: true },
                ),
                branch(
                  {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'conductCnt', fallback: 0 },
                    operator: 'greater',
                    right: { kind: 'constant', value: 4 },
                  },
                  sequence(
                    step('modifyActionValue', {
                      key: 'conductCnt',
                      operation: 'assign',
                      value: { kind: 'constant', value: 4 },
                    }),
                  ),
                  undefined,
                  { alwaysNext: true },
                ),
                step('applyBuff', {
                  buffId: 'buff_common_pulse_pulse_conduct_triggered',
                  target: 'buffOwner',
                  source: 'buffSource',
                  inheritSourceSkillCastInfo: true,
                  copiedBlackboardAssignments: { count: 'conductCnt' },
                }),
              ),
              undefined,
              { alwaysNext: true },
            ),
          ),
          15,
        ),
        scheduled(
          12,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'electric',
                attackScale: { kind: 'blackboard', key: 'atk_scale' },
                tags: ['comboSkill'],
                features: ['canBreakWeakness'],
                stagger: { kind: 'blackboard', key: 'poise' },
              },
              'buff_chr_0030_zhuangfy_combo_skill_ring_hit:/scheduledSequences/1/sequence/steps/0',
            ),
            step('finishBuffsByTag', {
              target: 'buffOwner',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
              reason: 'other',
            }),
            step('startTimeDilation', {
              scope: 'entity',
              durationSeconds: { kind: 'constant', value: 0.3 },
              slot: 'TimeDilation/Layer/Entity/HitStop',
              priority: 10,
              curve: { kind: 'named', key: 'char_normal_attack' },
              finishByAction: false,
              targets: ['enemy', 'caster'],
            }),
          ),
          15,
        ),
      ],
    },
    buff_chr_0030_zhuangfy_normal_skill_trigger_sword: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 3,
      triggerIntervalSeconds: { blackboardKey: 'interval' },
      waitFirstTriggerInterval: true,
      maxTriggerCount: 50,
      applyTags: ['Status/DisableNormalSkill'],
      extendTags: [],
      blackboard: {
        atb_return: 0,
        atk_scale: 0,
        atk_up_final: 0,
        final_rate: 0,
        interval: 0.3,
        isUlt: 0,
        poise: 0,
        remain_sword_limit: 0,
        sword_range: 20,
        swordCnt: 0,
        swordIndex: 0,
        usp_extra: 0,
      },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('calculateActionValue', {
            key: 'atk_scale',
            operation: 'add',
            left: { kind: 'blackboard', key: 'atk_scale' },
            right: { kind: 'blackboard', key: 'atk_up_final' },
          }),
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'sword',
            abilityEntityIds: ['abilityentity_chr_0030_zhuangfy_normal_skill_sword'],
            maxTargets: 128,
          }),
        ),
        trigger: sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
              operator: 'less',
              right: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
            },
            sequence(
              step('pickContextTarget', {
                sourceContextKey: 'sword',
                saveToContextKey: 'swordInst',
                index: { kind: 'blackboard', key: 'swordIndex' },
              }),
              forEachContextTarget(
                'swordInst',
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0030_zhuangfy_sword_triggerd',
                    target: 'currentAbilityEntity',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: {
                      swordIndex: 'swordIndex',
                      swordCnt: 'EntityBB_SwordNum',
                      atk_scale: 'atk_scale',
                      poise: 'poise',
                      usp_extra: 'usp_extra',
                      remain_sword_limit: 'remain_sword_limit',
                      final_rate: 'final_rate',
                    },
                  }),
                ),
              ),
              step('modifyActionValue', {
                key: 'swordIndex',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
          ),
        ),
        finish: sequence(
          step('finishBuffsByTag', {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/chr_0030_zhuangfy/SwordTar'],
            reason: 'other',
          }),
        ),
      },
    },
    buff_chr_0030_zhuangfy_normal_skill_trigger_sword_tar: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 3,
      applyTags: ['Skill/Character/chr_0030_zhuangfy/SwordTar'],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0030_zhuangfy_normal_skill_fake_target',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
        ),
      },
    },
    buff_chr_0030_zhuangfy_passive_check_sword: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      triggerIntervalSeconds: 0.03,
      waitFirstTriggerInterval: false,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: { swordRange: 50, swordsNum: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        trigger: sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'swordsInRange',
            abilityEntityIds: ['abilityentity_chr_0030_zhuangfy_normal_skill_sword'],
          }),
          branch(
            {
              kind: 'contextTargetCountCompare',
              contextKey: 'swordsInRange',
              operator: 'greaterOrEqual',
              value: 0,
              outputKey: 'swordsNum',
            },
            sequence(
              step('setCharacterPassiveUiValue', {
                target: 'caster',
                value: { kind: 'blackboard', key: 'swordsNum' },
              }),
              step('modifyActionValue', {
                key: 'EntityBB_SwordNum',
                operation: 'assign',
                value: { kind: 'blackboard', key: 'swordsNum' },
              }),
            ),
          ),
        ),
      },
    },
    buff_chr_0030_zhuangfy_potential1: {
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
            step('applyBuff', {
              buffId: 'buff_chr_0030_zhuangfy_potential1_more_sword',
              target: 'buffSource',
              source: 'buffSource',
              inheritSourceSkillCastInfo: true,
            }),
          ),
        },
      ],
    },
    buff_chr_0030_zhuangfy_potential1_more_sword: {
      stackingType: 'unlimited',
      priority: 1,
      maxStackCount: 9,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'skillEnd',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventSkillTypeIn', skillTypes: ['battleSkill'] },
              sequence(
                step('finishBuffsById', {
                  target: 'caster',
                  buffIds: ['buff_chr_0030_zhuangfy_potential1_more_sword'],
                  reason: 'other',
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0030_zhuangfy_potential5: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { ignore_pulse_resist: 0 },
      attributeModifiers: [],
      damageModifiers: [
        {
          enabledSide: 'attacker',
          condition: {
            kind: 'buffIdCountCompare',
            target: 'caster',
            buffIds: ['buff_chr_0030_zhuangfy_ult_base'],
            operator: 'greaterOrEqual',
            value: 1,
          },
          processors: [
            {
              kind: 'instantAttribute',
              targetSide: 'defender',
              attribute: 'PulseResistance',
              values: { slot: 'baseAddition', value: { blackboardKey: 'ignore_pulse_resist' } },
              attributeTiming: 'runtime',
            },
          ],
        },
      ],
    },
    buff_chr_0030_zhuangfy_potential5_vfx: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0030_zhuangfy_sword_triggerd: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 0,
      durationSeconds: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {
        atk_scale: 1,
        atk_scale_final: 0,
        final_rate: 0,
        poise: 0,
        randomVFX: 0,
        remain_sword_limit: 0,
        swordCnt: 0,
        swordIndex: 0,
        usp_extra: 0,
      },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          0,
          sequence(
            step('modifyActionValue', {
              key: 'swordCnt',
              operation: 'add',
              value: { kind: 'constant', value: -1 },
            }),
          ),
          3,
        ),
        scheduled(
          3,
          sequence(
            branch(
              {
                kind: 'actionValueCompare',
                left: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
                operator: 'equal',
                right: { kind: 'blackboard', key: 'swordCnt', fallback: 0 },
              },
              sequence(
                step('createTimedMarker', {
                  target: 'caster',
                  markerId: 'skillEnd',
                  durationSeconds: { kind: 'constant', value: 0.1 },
                  autoFinishByAction: false,
                }),
              ),
            ),
          ),
          6,
        ),
        scheduled(
          9,
          sequence(
            branch(
              {
                kind: 'actionValueCompare',
                left: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
                operator: 'equal',
                right: { kind: 'blackboard', key: 'swordCnt', fallback: 0 },
              },
              sequence(
                step('finishBuffsById', {
                  target: 'caster',
                  buffIds: ['buff_chr_0030_zhuangfy_normal_skill_trigger_sword'],
                  reason: 'other',
                }),
              ),
            ),
          ),
          12,
        ),
        scheduled(
          3,
          sequence(
            branch(
              {
                kind: 'actionValueCompare',
                left: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
                operator: 'less',
                right: { kind: 'blackboard', key: 'swordCnt', fallback: 0 },
              },
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0030_zhuangfy_talent1_mark',
                  target: 'buffSource',
                  source: 'buffSource',
                  inheritSourceSkillCastInfo: true,
                }),
                branch(
                  {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
                    operator: 'equal',
                    right: { kind: 'constant', value: 0 },
                  },
                  sequence(
                    step(
                      'dealDamage',
                      {
                        damageType: 'electric',
                        attackScale: { kind: 'blackboard', key: 'atk_scale' },
                        tags: ['normalSkill'],
                        features: ['canBreakWeakness'],
                      },
                      'buff_chr_0030_zhuangfy_sword_triggerd:/scheduledSequences/3/sequence/steps/0/whenTrue/steps/0/whenTrue/steps/1/whenTrue/steps/0',
                    ),
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
                        operator: 'less',
                        right: { kind: 'blackboard', key: 'remain_sword_limit', fallback: 0 },
                      },
                      sequence(
                        step('changeResourceByActionValue', {
                          resource: 'ultimateEnergy',
                          amount: { kind: 'blackboard', key: 'usp_extra' },
                          coefficient: { kind: 'constant', value: 1 },
                          recipient: 'caster',
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                  ),
                  sequence(
                    step(
                      'dealDamage',
                      {
                        damageType: 'electric',
                        attackScale: { kind: 'blackboard', key: 'atk_scale' },
                        tags: ['normalSkill'],
                      },
                      'buff_chr_0030_zhuangfy_sword_triggerd:/scheduledSequences/3/sequence/steps/0/whenTrue/steps/0/whenTrue/steps/1/whenFalse/steps/0',
                    ),
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
                        operator: 'less',
                        right: { kind: 'blackboard', key: 'remain_sword_limit', fallback: 0 },
                      },
                      sequence(
                        step('changeResourceByActionValue', {
                          resource: 'ultimateEnergy',
                          amount: { kind: 'blackboard', key: 'usp_extra' },
                          coefficient: { kind: 'constant', value: 1 },
                          recipient: 'caster',
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                  ),
                  { alwaysNext: true },
                ),
              ),
            ),
          ),
          6,
        ),
        scheduled(
          6,
          sequence(
            branch(
              {
                kind: 'actionValueCompare',
                left: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
                operator: 'equal',
                right: { kind: 'blackboard', key: 'swordCnt', fallback: 0 },
              },
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0030_zhuangfy_talent1_mark',
                  target: 'buffSource',
                  source: 'buffSource',
                  inheritSourceSkillCastInfo: true,
                }),
                step('calculateActionValue', {
                  key: 'atk_scale_final',
                  operation: 'multiply',
                  left: { kind: 'blackboard', key: 'atk_scale' },
                  right: { kind: 'blackboard', key: 'final_rate' },
                }),
                step(
                  'dealDamage',
                  {
                    damageType: 'electric',
                    attackScale: { kind: 'blackboard', key: 'atk_scale_final' },
                    tags: ['normalSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'blackboard', key: 'poise' },
                  },
                  'buff_chr_0030_zhuangfy_sword_triggerd:/scheduledSequences/4/sequence/steps/0/whenTrue/steps/0/whenTrue/steps/2',
                ),
                branch(
                  {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'swordIndex', fallback: 0 },
                    operator: 'less',
                    right: { kind: 'blackboard', key: 'remain_sword_limit', fallback: 0 },
                  },
                  sequence(
                    step('changeResourceByActionValue', {
                      resource: 'ultimateEnergy',
                      amount: { kind: 'blackboard', key: 'usp_extra' },
                      coefficient: { kind: 'constant', value: 1 },
                      recipient: 'caster',
                    }),
                    branch(
                      { kind: 'currentSkillTypeIn', target: 'caster', skillTypes: ['battleSkill'] },
                      sequence(),
                      sequence(
                        step('startTimeDilation', {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.4 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 10,
                          curve: { kind: 'named', key: 'char_hard_stop' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        }),
                      ),
                      { alwaysNext: true },
                    ),
                  ),
                  undefined,
                  { alwaysNext: true },
                ),
              ),
            ),
          ),
          9,
        ),
      ],
    },
    buff_chr_0030_zhuangfy_talent1: {
      stackingType: 'unlimited',
      priority: 1,
      maxStackCount: { blackboardKey: 'max_stack' },
      durationSeconds: 0.1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0030_zhuangfy_talent1_base: {
      stackingType: 'stack',
      priority: 1,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { base_rate: 0, duration: 0, enhance_rate: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_enhance_pulse',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'base_rate' },
            },
            keywordEnhancements: [
              {
                triggerBuffIds: ['buff_chr_0030_zhuangfy_talent1_mark'],
                operation: 'add',
                value: { kind: 'blackboard', key: 'enhance_rate' },
              },
            ],
          }),
        ),
      },
    },
    buff_chr_0030_zhuangfy_talent1_mark: {
      stackingType: 'unlimited',
      priority: 1,
      maxStackCount: { blackboardKey: 'max_stack' },
      durationSeconds: 0.1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0030_zhuangfy_ult_base: {
      stackingType: 'stack',
      priority: 1,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_atk_up',
        iconPath: '/icons/icon_battle_buff_atk_up.webp',
        showInHeadBarCommon: false,
        showInHeadBarAttached: false,
        showInSquadIcon: false,
        onlyShowForMainCharacter: false,
        blinkInMainCharHpBar: false,
        showProgressInHpBar: true,
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
      applyTags: ['Status/DisableBreakingAttack', '3C/PostmodelChanged'],
      extendTags: ['Status/DisableNormalSkill', 'Status/DisableCastComboSkill'],
      blackboard: { combo_cd_rate: 3, duration: 10 },
      attributeModifiers: [
        {
          attribute: 'ComboSkillCooldownRecoveryScalar',
          slot: 'baseMultiplier',
          value: { blackboardKey: 'combo_cd_rate' },
        },
      ],
      lifecycleSequences: {
        start: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0030_zhuangfy_ult_skill_free',
            target: 'buffSource',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
          }),
        ),
        enable: sequence(
          step('changePlayerActionMode', { modeId: 'UltMode', lifetime: 'finishByAction' }),
          step('overrideMultiDashLimit', { dashCount: { kind: 'constant', value: -1 } }),
          step('restrictUltimateEnergyRecovery', {
            target: 'caster',
            allowedRecoveryTags: [],
            clearUltimateEnergyOnEnd: false,
          }),
        ),
        finish: sequence(
          step('changeNativeSkillType', {
            targetSkillKey: 'chr_0030_zhuangfy_ultimate_skill_end',
            nativeSkillType: 'attachSkill',
          }),
          step('castSkillDuringAction', {
            skillId: 'chr_0030_zhuangfy_ultimate_skill_end',
            target: 'caster',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          }),
          step('adjustSkillCooldown', {
            target: 'caster',
            skill: { kind: 'type', skillType: 'ultimate' },
            operation: 'set',
            basis: 'absoluteSeconds',
            value: { kind: 'constant', value: 15 },
          }),
        ),
      },
      skillSlotReplacements: [
        {
          skillGroupKey: 'battleSkill',
          targetSkillKey: 'chr_0030_zhuangfy_normal_skill_ult',
          revertedSkillKey: 'chr_0030_zhuangfy_normal_skill',
          inheritOriginSkillCooldownProgress: false,
        },
        {
          skillGroupKey: 'comboSkill',
          targetSkillKey: 'chr_0030_zhuangfy_combo_skill_ult',
          revertedSkillKey: 'chr_0030_zhuangfy_combo_skill',
          inheritOriginSkillCooldownProgress: true,
        },
      ],
    },
    buff_chr_0030_zhuangfy_ult_skill_free: {
      stackingType: 'unique',
      priority: 1,
      maxStackCount: 0,
      presentation: {
        visible: true,
        iconId: 'icon_battle_zhuangfy_debuff_01',
        iconPath: '/icons/icon_battle_zhuangfy_debuff_01.webp',
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
      blackboard: {},
      attributeModifiers: [{ attribute: 'AtbCostAddition', slot: 'baseAddition', value: -100 }],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0030_zhuangfy_attack2: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 1 },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0030_zhuangfy_attack2_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 30,
        castResource: {
          costFrame: 9,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale: 0.2, thunderPosIndex: 0 },
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
                'abilityentity_chr_0030_zhuangfy_attack2:chr_0030_zhuangfy_attack2_abilityrange:/childSkill/scheduledSequences/0/sequence/steps/0',
              ),
            ),
            1,
          ),
          scheduled(
            9,
            sequence(
              step('createSpatialPointTargets', {
                saveToContextKey: 'thunderPos',
                count: { kind: 'constant', value: 5 },
              }),
            ),
            12,
          ),
          scheduled(
            9,
            sequence(
              repeatEachTick(
                sequence(
                  step('pickContextTarget', {
                    sourceContextKey: 'thunderPos',
                    saveToContextKey: 'thunderPosInst',
                    index: { kind: 'blackboard', key: 'thunderPosIndex' },
                  }),
                  branch(
                    { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
                    sequence(
                      step(
                        'dealDamage',
                        {
                          damageType: 'electric',
                          attackScale: { kind: 'blackboard', key: 'atk_scale' },
                          tags: ['normalAttack'],
                        },
                        'abilityentity_chr_0030_zhuangfy_attack2:chr_0030_zhuangfy_attack2_abilityrange:/childSkill/scheduledSequences/2/sequence/steps/0/body/steps/1/whenTrue/steps/0',
                      ),
                      step('modifyActionValue', {
                        key: 'thunderPosIndex',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
                    ),
                    sequence(
                      step(
                        'dealDamage',
                        {
                          damageType: 'electric',
                          attackScale: { kind: 'blackboard', key: 'atk_scale' },
                          tags: ['normalAttack'],
                        },
                        'abilityentity_chr_0030_zhuangfy_attack2:chr_0030_zhuangfy_attack2_abilityrange:/childSkill/scheduledSequences/2/sequence/steps/0/body/steps/1/whenFalse/steps/0',
                      ),
                      step('modifyActionValue', {
                        key: 'thunderPosIndex',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
                    ),
                    { alwaysNext: true },
                  ),
                ),
                { nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.1 } },
              ),
            ),
            16,
          ),
          scheduled(897, sequence(step('finishActionOwnerAbilityEntity', {})), 900),
        ],
      },
    },
    abilityentity_chr_0030_zhuangfy_attack5: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 1 },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0030_zhuangfy_attack5_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 30,
        castResource: {
          costFrame: 9,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb: 20, atk_scale: 0.2, effectZ: 2, hasGainAtb: 0, poise: 15 },
        scheduledSequences: [
          scheduled(897, sequence(step('finishActionOwnerAbilityEntity', {})), 900),
          scheduled(897, sequence(step('finishActionOwnerAbilityEntity', {})), 900),
          scheduled(
            0,
            sequence(
              repeatEachTick(
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
                    'abilityentity_chr_0030_zhuangfy_attack5:chr_0030_zhuangfy_attack5_abilityrange:/childSkill/scheduledSequences/2/sequence/steps/0/body/steps/0',
                  ),
                  branch(
                    { kind: 'casterControlled' },
                    sequence(
                      step('startTimeDilation', {
                        scope: 'entity',
                        durationSeconds: { kind: 'constant', value: 0.1 },
                        slot: 'TimeDilation/Layer/Entity/HitStop',
                        priority: 10,
                        curve: { kind: 'named', key: 'char_hard_stop' },
                        finishByAction: false,
                        targets: ['enemy'],
                        abilityEntityTargets: [{ kind: 'current' }],
                      }),
                    ),
                  ),
                ),
                {
                  nativeChanneling: {
                    executeEachFrame: true,
                    triggerIntervalSeconds: 0.033,
                    maxCountPerTarget: 1,
                    targetTriggerIntervalSeconds: 0.27,
                  },
                },
              ),
            ),
            12,
          ),
          scheduled(
            0,
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hasGainAtb', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  branch(
                    { kind: 'casterControlled' },
                    sequence(
                      step('changeResourceByActionValue', {
                        resource: 'sp',
                        amount: { kind: 'blackboard', key: 'atb' },
                        coefficient: { kind: 'constant', value: 1 },
                        recipient: 'team',
                        spGainKind: 'gain',
                        spGainSource: 'normalAttack',
                      }),
                    ),
                  ),
                  step('modifyActionValue', {
                    key: 'hasGainAtb',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  }),
                ),
              ),
            ),
            2,
          ),
          scheduled(
            4,
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hasGainAtb', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  branch(
                    { kind: 'casterControlled' },
                    sequence(
                      step('changeResourceByActionValue', {
                        resource: 'sp',
                        amount: { kind: 'blackboard', key: 'atb' },
                        coefficient: { kind: 'constant', value: 1 },
                        recipient: 'team',
                        spGainKind: 'gain',
                        spGainSource: 'normalAttack',
                      }),
                    ),
                  ),
                  step('modifyActionValue', {
                    key: 'hasGainAtb',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  }),
                ),
              ),
            ),
            6,
          ),
          scheduled(
            8,
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hasGainAtb', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  branch(
                    { kind: 'casterControlled' },
                    sequence(
                      step('changeResourceByActionValue', {
                        resource: 'sp',
                        amount: { kind: 'blackboard', key: 'atb' },
                        coefficient: { kind: 'constant', value: 1 },
                        recipient: 'team',
                        spGainKind: 'gain',
                        spGainSource: 'normalAttack',
                      }),
                    ),
                  ),
                  step('modifyActionValue', {
                    key: 'hasGainAtb',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  }),
                ),
              ),
            ),
            10,
          ),
        ],
      },
    },
    abilityentity_chr_0030_zhuangfy_attack_ult: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      blackboard: { EntityBB_hitedMark: '#' },
      lifetime: { kind: 'limited', durationSeconds: 1.5 },
      childSkills: {
        chr_0030_zhuangfy_attack1_ult_1_abilityrange: {
          skillId: 'chr_0030_zhuangfy_attack1_ult_1_abilityrange',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 21,
          castResource: {
            costFrame: 9,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.2, randomRotate: 0, thunderPosIndex: 0 },
          scheduledSequences: [
            scheduled(
              3,
              sequence(
                forEachTarget(
                  'enemy',
                  sequence(
                    branch(
                      {
                        kind: 'not',
                        condition: {
                          kind: 'timedMarkerPresent',
                          target: 'enemy',
                          markerId: { blackboardKey: 'EntityBB_hitedMark' },
                        },
                      },
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'electric',
                            attackScale: { kind: 'blackboard', key: 'atk_scale' },
                            tags: ['normalAttack'],
                          },
                          'abilityentity_chr_0030_zhuangfy_attack_ult:chr_0030_zhuangfy_attack1_ult_1_abilityrange|chr_0030_zhuangfy_attack1_ult_2_abilityrange|chr_0030_zhuangfy_attack1_ult_3_abilityrange|chr_0030_zhuangfy_attack1_ult_4_abilityrange:/childSkills/chr_0030_zhuangfy_attack1_ult_1_abilityrange/scheduledSequences/0/sequence/steps/0/body/steps/0/whenTrue/steps/0',
                        ),
                        step('createTimedMarker', {
                          target: 'enemy',
                          markerId: { blackboardKey: 'EntityBB_hitedMark' },
                          durationSeconds: { kind: 'constant', value: 0.4 },
                          autoFinishByAction: false,
                        }),
                      ),
                    ),
                  ),
                ),
              ),
              4,
            ),
            scheduled(897, sequence(step('finishActionOwnerAbilityEntity', {})), 900),
          ],
        },
        chr_0030_zhuangfy_attack1_ult_2_abilityrange: {
          skillId: 'chr_0030_zhuangfy_attack1_ult_2_abilityrange',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 21,
          castResource: {
            costFrame: 9,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.2, randomRotate: 0, thunderPosIndex: 0 },
          scheduledSequences: [
            scheduled(
              3,
              sequence(
                forEachTarget(
                  'enemy',
                  sequence(
                    branch(
                      {
                        kind: 'not',
                        condition: {
                          kind: 'timedMarkerPresent',
                          target: 'enemy',
                          markerId: { blackboardKey: 'EntityBB_hitedMark' },
                        },
                      },
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'electric',
                            attackScale: { kind: 'blackboard', key: 'atk_scale' },
                            tags: ['normalAttack'],
                          },
                          'abilityentity_chr_0030_zhuangfy_attack_ult:chr_0030_zhuangfy_attack1_ult_1_abilityrange|chr_0030_zhuangfy_attack1_ult_2_abilityrange|chr_0030_zhuangfy_attack1_ult_3_abilityrange|chr_0030_zhuangfy_attack1_ult_4_abilityrange:/childSkills/chr_0030_zhuangfy_attack1_ult_2_abilityrange/scheduledSequences/0/sequence/steps/0/body/steps/0/whenTrue/steps/0',
                        ),
                        step('createTimedMarker', {
                          target: 'enemy',
                          markerId: { blackboardKey: 'EntityBB_hitedMark' },
                          durationSeconds: { kind: 'constant', value: 0.4 },
                          autoFinishByAction: false,
                        }),
                      ),
                    ),
                  ),
                ),
              ),
              4,
            ),
            scheduled(897, sequence(step('finishActionOwnerAbilityEntity', {})), 900),
          ],
        },
        chr_0030_zhuangfy_attack1_ult_3_abilityrange: {
          skillId: 'chr_0030_zhuangfy_attack1_ult_3_abilityrange',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 21,
          castResource: {
            costFrame: 9,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.2, randomRotate: 0, thunderPosIndex: 0 },
          scheduledSequences: [
            scheduled(
              3,
              sequence(
                forEachTarget(
                  'enemy',
                  sequence(
                    branch(
                      {
                        kind: 'not',
                        condition: {
                          kind: 'timedMarkerPresent',
                          target: 'enemy',
                          markerId: { blackboardKey: 'EntityBB_hitedMark' },
                        },
                      },
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'electric',
                            attackScale: { kind: 'blackboard', key: 'atk_scale' },
                            tags: ['normalAttack'],
                          },
                          'abilityentity_chr_0030_zhuangfy_attack_ult:chr_0030_zhuangfy_attack1_ult_1_abilityrange|chr_0030_zhuangfy_attack1_ult_2_abilityrange|chr_0030_zhuangfy_attack1_ult_3_abilityrange|chr_0030_zhuangfy_attack1_ult_4_abilityrange:/childSkills/chr_0030_zhuangfy_attack1_ult_3_abilityrange/scheduledSequences/0/sequence/steps/0/body/steps/0/whenTrue/steps/0',
                        ),
                        step('createTimedMarker', {
                          target: 'enemy',
                          markerId: { blackboardKey: 'EntityBB_hitedMark' },
                          durationSeconds: { kind: 'constant', value: 0.4 },
                          autoFinishByAction: false,
                        }),
                      ),
                    ),
                  ),
                ),
              ),
              4,
            ),
            scheduled(897, sequence(step('finishActionOwnerAbilityEntity', {})), 900),
          ],
        },
        chr_0030_zhuangfy_attack1_ult_4_abilityrange: {
          skillId: 'chr_0030_zhuangfy_attack1_ult_4_abilityrange',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 21,
          castResource: {
            costFrame: 9,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0.2, randomRotate: 0, thunderPosIndex: 0 },
          scheduledSequences: [
            scheduled(
              3,
              sequence(
                forEachTarget(
                  'enemy',
                  sequence(
                    branch(
                      {
                        kind: 'not',
                        condition: {
                          kind: 'timedMarkerPresent',
                          target: 'enemy',
                          markerId: { blackboardKey: 'EntityBB_hitedMark' },
                        },
                      },
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'electric',
                            attackScale: { kind: 'blackboard', key: 'atk_scale' },
                            tags: ['normalAttack'],
                          },
                          'abilityentity_chr_0030_zhuangfy_attack_ult:chr_0030_zhuangfy_attack1_ult_1_abilityrange|chr_0030_zhuangfy_attack1_ult_2_abilityrange|chr_0030_zhuangfy_attack1_ult_3_abilityrange|chr_0030_zhuangfy_attack1_ult_4_abilityrange:/childSkills/chr_0030_zhuangfy_attack1_ult_4_abilityrange/scheduledSequences/0/sequence/steps/0/body/steps/0/whenTrue/steps/0',
                        ),
                        step('createTimedMarker', {
                          target: 'enemy',
                          markerId: { blackboardKey: 'EntityBB_hitedMark' },
                          durationSeconds: { kind: 'constant', value: 0.4 },
                          autoFinishByAction: false,
                        }),
                      ),
                    ),
                  ),
                ),
              ),
              4,
            ),
            scheduled(897, sequence(step('finishActionOwnerAbilityEntity', {})), 900),
          ],
        },
      },
    },
    abilityentity_chr_0030_zhuangfy_attack3_ult: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 2 },
      childSkill: {
        skillId: 'chr_0030_zhuangfy_attack3_ult_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 75,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb: 0, atk_scale: 0.2, poise: 0, randomRotate: 0, thunderPosIndex: 0 },
        scheduledSequences: [
          scheduled(
            30,
            sequence(
              repeatEachTick(
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
                    'abilityentity_chr_0030_zhuangfy_attack3_ult:chr_0030_zhuangfy_attack3_ult_abilityrange:/childSkill/scheduledSequences/0/sequence/steps/0/body/steps/0',
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
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('changeResourceByActionValue', {
                    resource: 'sp',
                    amount: { kind: 'blackboard', key: 'atb' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'team',
                    spGainKind: 'gain',
                    spGainSource: 'normalAttack',
                  }),
                ),
              ),
            ),
            33,
          ),
        ],
      },
    },
    abilityentity_chr_0030_zhuangfy_normal_skill_fake_target: {
      bornTags: [
        'SelectCategory/Unmarkable',
        'Immune/Damage',
        'Skill/Character/chr_0030_zhuangfy/ThunderAura',
      ],
      lifetime: { kind: 'limited', durationSeconds: 3 },
      maxStackingCount: 10,
    },
    abilityentity_chr_0030_zhuangfy_normal_skill_sword: {
      bornTags: [
        'SelectCategory/Unmarkable',
        'Immune/Damage',
        'Skill/Character/chr_0030_zhuangfy/ActivedSword',
      ],
      blackboard: { EntityBB_swordDuration: 0, EntityBB_swordLimit: 0 },
      lifetime: {
        kind: 'limited',
        durationSeconds: { blackboardKey: 'EntityBB_swordDuration', fallback: 0 },
      },
      maxStackingCount: { blackboardKey: 'EntityBB_swordLimit', fallback: 5 },
      childSkill: {
        skillId: 'chr_0030_zhuangfy_normal_skill_sword',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 3000,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale: 0.2, potential_n: 0, randomRotate: 0, randomVFX: 0 },
        scheduledSequences: [],
      },
    },
    abilityentity_chr_0030_zhuangfy_normal_skill_ult: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      blackboard: { EntityBB_SwordNum: 0 },
      lifetime: { kind: 'limited', durationSeconds: 3 },
      childSkill: {
        skillId: 'chr_0030_zhuangfy_normal_skill_ult_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 104,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale: 0,
          atk_scale_final: 0,
          atk_up_final: 0,
          final_rate: 0,
          poise: 0,
          randomVFX: 0,
          sword_index: 0,
          sword_range: 0,
          tick_index: 1,
        },
        scheduledSequences: [
          scheduled(
            0,
            sequence(
              step('calculateActionValue', {
                key: 'atk_scale_final',
                operation: 'add',
                left: { kind: 'blackboard', key: 'atk_scale' },
                right: { kind: 'blackboard', key: 'atk_up_final' },
              }),
            ),
            12,
          ),
          scheduled(
            0,
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(step('finishActionOwnerAbilityEntity', {})),
                undefined,
                { alwaysNext: true },
              ),
            ),
            3,
          ),
          scheduled(
            12,
            sequence(
              repeatEachTick(
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'tick_index', fallback: 0 },
                      operator: 'less',
                      right: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
                    },
                    sequence(
                      branch(
                        {
                          kind: 'actionValueCompare',
                          left: { kind: 'blackboard', key: 'tick_index', fallback: 0 },
                          operator: 'equal',
                          right: { kind: 'constant', value: 1 },
                        },
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_final' },
                              tags: ['normalSkill'],
                              features: ['canBreakWeakness'],
                            },
                            'abilityentity_chr_0030_zhuangfy_normal_skill_ult:chr_0030_zhuangfy_normal_skill_ult_abilityrange:/childSkill/scheduledSequences/2/sequence/steps/0/body/steps/0/whenTrue/steps/0/whenTrue/steps/0',
                          ),
                        ),
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_final' },
                              tags: ['normalSkill'],
                            },
                            'abilityentity_chr_0030_zhuangfy_normal_skill_ult:chr_0030_zhuangfy_normal_skill_ult_abilityrange:/childSkill/scheduledSequences/2/sequence/steps/0/body/steps/0/whenTrue/steps/0/whenFalse/steps/0',
                          ),
                        ),
                        { alwaysNext: true },
                      ),
                      step('modifyActionValue', {
                        key: 'tick_index',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
                    ),
                    sequence(step('jumpTimeline', { destinationFrame: 64 })),
                    { alwaysNext: true },
                  ),
                ),
                { nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.2 } },
              ),
            ),
            64,
          ),
          scheduled(
            69,
            sequence(
              step('calculateActionValue', {
                key: 'atk_scale_final',
                operation: 'multiply',
                left: { kind: 'blackboard', key: 'atk_scale_final' },
                right: { kind: 'blackboard', key: 'final_rate' },
              }),
              step('applyElementalInfliction', { element: 'electric', isExtra: false }),
              step(
                'dealDamage',
                {
                  damageType: 'electric',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_final' },
                  tags: ['normalSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                'abilityentity_chr_0030_zhuangfy_normal_skill_ult:chr_0030_zhuangfy_normal_skill_ult_abilityrange:/childSkill/scheduledSequences/3/sequence/steps/0/whenTrue/steps/2',
              ),
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.4 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_hard_stop' },
                finishByAction: false,
                targets: ['enemy'],
                abilityEntityTargets: [{ kind: 'current' }],
              }),
            ),
            70,
          ),
          scheduled(
            12,
            sequence(
              repeatEachTick(sequence(), {
                nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.2 },
              }),
            ),
            64,
          ),
          scheduled(
            12,
            sequence(
              repeatEachTick(
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'sword_index', fallback: 0 },
                      operator: 'less',
                      right: { kind: 'blackboard', key: 'EntityBB_SwordNum', fallback: 0 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'sword_index',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
                  ),
                ),
                { nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.2 } },
              ),
            ),
            64,
          ),
          scheduled(
            15,
            sequence(
              repeatEachTick(
                sequence(
                  step('modifyActionValue', {
                    key: '__endaxis_target_group_count:ranThunder',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  }),
                  step('createSpatialPointTargets', {
                    saveToContextKey: 'ranThunder',
                    count: { kind: 'constant', value: 1 },
                  }),
                ),
                { nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.2 } },
              ),
            ),
            64,
          ),
          scheduled(
            67,
            sequence(
              repeatEachTick(
                sequence(
                  step('modifyActionValue', {
                    key: '__endaxis_target_group_count:ranThunder',
                    operation: 'assign',
                    value: { kind: 'constant', value: 3 },
                  }),
                  step('createSpatialPointTargets', {
                    saveToContextKey: 'ranThunder',
                    count: { kind: 'constant', value: 3 },
                  }),
                ),
                { nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.2 } },
              ),
            ),
            71,
          ),
          scheduled(
            67,
            sequence(
              step('createTimedMarker', {
                target: 'caster',
                markerId: 'skillEnd',
                durationSeconds: { kind: 'constant', value: 0.1 },
                autoFinishByAction: false,
              }),
            ),
            70,
          ),
        ],
      },
    },
    abilityentity_chr_0030_zhuangfy_ult_mirror: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 3 },
      maxStackingCount: 1,
    },
    abilityentity_chr_0030_zhuangfy_ult: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'limited', durationSeconds: 3 },
      maxStackingCount: 1,
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default zhuangFangyi;
