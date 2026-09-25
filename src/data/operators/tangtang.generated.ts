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
  once,
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
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'water_cnt', fallback: 0 },
      operator: 'greaterOrEqual',
      right: { kind: 'constant', value: 2 },
    },
    sequence(
      step('spawnAbilityEntity', {
        abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03',
        childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
        inheritActionBlackboard: true,
        dieWhenSourceDies: false,
        target: 'currentAbilityEntity',
      }),
      step('spawnAbilityEntity', {
        abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03_02',
        childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
        inheritActionBlackboard: true,
        dieWhenSourceDies: false,
        target: 'currentAbilityEntity',
      }),
      step('spawnAbilityEntity', {
        abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_03_03',
        childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_2',
        inheritActionBlackboard: true,
        dieWhenSourceDies: false,
        target: 'currentAbilityEntity',
      }),
      step('modifyActionValue', {
        key: 'water_cnt',
        operation: 'assign',
        value: { kind: 'constant', value: 0 },
      }),
    ),
    sequence(
      step('spawnAbilityEntity', {
        abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_02',
        childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
        inheritActionBlackboard: true,
        dieWhenSourceDies: false,
        target: 'currentAbilityEntity',
      }),
      step('spawnAbilityEntity', {
        abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_02_02',
        childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit_1',
        inheritActionBlackboard: true,
        dieWhenSourceDies: false,
        target: 'currentAbilityEntity',
      }),
      step('modifyActionValue', {
        key: 'water_cnt',
        operation: 'assign',
        value: { kind: 'constant', value: 0 },
      }),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence5: ActionSequenceDefinition = sequence(
  step('spawnAbilityEntity', {
    abilityEntityId: 'abilityentity_chr_0027_tangtang_comboskill_water',
    childSkillId: 'chr_0027_tangtang_combo_skill_water',
    inheritActionBlackboard: true,
    dieWhenSourceDies: false,
    saveToContextKey: 'water_abilityentity02',
  }),
  step('applyBuff', {
    buffId: 'buff_chr_0027_tangtang_water',
    target: 'caster',
    inheritSourceSkillCastInfo: true,
    copiedBlackboardAssignments: { duration_water: 'duration_water' },
  }),
  step('findOwnerSpawnedAbilityEntities', {
    saveToContextKey: 'water_group',
    abilityEntityIds: ['abilityentity_chr_0027_tangtang_comboskill_water'],
  }),
  branch(
    {
      kind: 'abilityEntityTimedMarkerPresent',
      contextKey: 'water_group',
      markerId: 'tangtang_waterabilityentity01',
    },
    sequence(
      branch(
        {
          kind: 'abilityEntityTimedMarkerPresent',
          contextKey: 'water_group',
          markerId: 'tangtang_waterabilityentity02',
        },
        sequence(
          forEachContextTarget(
            'water_abilityentity02',
            sequence(
              step('createAbilityEntityTimedMarker', {
                markerId: 'tangtang_waterabilityentity03',
                durationSeconds: { kind: 'blackboard', key: 'duration_water' },
                autoFinishByAction: false,
                timeDomain: 'global',
              }),
            ),
          ),
        ),
        sequence(
          forEachContextTarget(
            'water_abilityentity02',
            sequence(
              step('createAbilityEntityTimedMarker', {
                markerId: 'tangtang_waterabilityentity02',
                durationSeconds: { kind: 'blackboard', key: 'duration_water' },
                autoFinishByAction: false,
                timeDomain: 'global',
              }),
            ),
          ),
        ),
        { alwaysNext: true },
      ),
    ),
    sequence(
      forEachContextTarget(
        'water_abilityentity02',
        sequence(
          step('createAbilityEntityTimedMarker', {
            markerId: 'tangtang_waterabilityentity01',
            durationSeconds: { kind: 'blackboard', key: 'duration_water' },
            autoFinishByAction: false,
            timeDomain: 'global',
          }),
        ),
      ),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence6: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'water_cnt', fallback: 0 },
      operator: 'greater',
      right: { kind: 'constant', value: 0 },
    },
    sharedActionSequence7,
    sequence(
      step('spawnAbilityEntity', {
        abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill',
        childSkillId: 'chr_0027_tangtang_normal_skill_water_projhit',
        inheritActionBlackboard: true,
        dieWhenSourceDies: false,
        target: 'currentAbilityEntity',
      }),
      step('modifyActionValue', {
        key: 'water_cnt',
        operation: 'assign',
        value: { kind: 'constant', value: 0 },
      }),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence4: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'buffIdStackCompare',
      target: 'caster',
      buffIds: ['buff_chr_0027_tangtang_water'],
      operator: 'greater',
      value: { kind: 'constant', value: 0 },
    },
    sharedActionSequence5,
    sequence(
      step('spawnAbilityEntity', {
        abilityEntityId: 'abilityentity_chr_0027_tangtang_comboskill_water',
        childSkillId: 'chr_0027_tangtang_combo_skill_water',
        inheritActionBlackboard: true,
        dieWhenSourceDies: false,
        saveToContextKey: 'water_abilityentity01',
      }),
      step('applyBuff', {
        buffId: 'buff_chr_0027_tangtang_water',
        target: 'caster',
        inheritSourceSkillCastInfo: true,
        copiedBlackboardAssignments: { duration_water: 'duration_water' },
      }),
      forEachContextTarget(
        'water_abilityentity01',
        sequence(
          step('createAbilityEntityTimedMarker', {
            markerId: 'tangtang_waterabilityentity01',
            durationSeconds: { kind: 'blackboard', key: 'duration_water' },
            autoFinishByAction: false,
            timeDomain: 'global',
          }),
        ),
      ),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence3: ActionSequenceDefinition = sequence({
  kind: 'launchProjectile',
  parameters: { finish: 3, recycleDelaySeconds: 30 },
  callbacks: [
    {
      event: 'finish',
      skill: {
        skillId: 'chr_0027_tangtang_combo_skill_water_gene',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 900,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { duration_water: 30, potential1: 0, radius: 4 },
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

const sharedActionSequence1: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'abilityEntityTimedMarkerPresent',
      contextKey: 'water_group',
      markerId: 'tangtang_waterabilityentity02',
    },
    instantiateActionSequence(sharedActionSequence2, ['\u0000endaxis-generated-identity:0']),
    instantiateActionSequence(sharedActionSequence2, ['\u0000endaxis-generated-identity:1']),
    { alwaysNext: true },
  ),
);

export const tangtangChr_0027_tangtang_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0027_tangtang_attack1',
    timelineBlockFrames: 7,
    naturalDurationFrames: 90,
    exclusiveFrame: 15,
    offsetRecordFrame: 3,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 30,
          input: 'basicAttack',
          targetSkillId: 'chr_0027_tangtang_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 7, endFrame: 30, skillIds: ['chr_0027_tangtang_attack2'] }],
    },
    costFrame: 3,
    scheduledSequences: [
      scheduled(
        3,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0027_tangtang_attack1.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0027_tangtang_attack1',
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
                    skillId: 'chr_0027_tangtang_attack1_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atb: 0, atk_scale: 0.1 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0027_tangtang_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        3,
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
        7,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0027_tangtang_attack2'] })),
        30,
      ),
    ],
    timelineContinuationSkillId: 'chr_0027_tangtang_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.23, 0.25, 0.27, 0.29, 0.32, 0.34, 0.36, 0.39, 0.41, 0.44, 0.47, 0.51] },
);

export const tangtangChr_0027_tangtang_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0027_tangtang_attack2',
    timelineBlockFrames: 18,
    naturalDurationFrames: 117,
    exclusiveFrame: 18,
    offsetRecordFrame: 6,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 39,
          input: 'basicAttack',
          targetSkillId: 'chr_0027_tangtang_attack3',
        },
      ],
      allowedNextSkills: [
        { startFrame: 18, endFrame: 39, skillIds: ['chr_0027_tangtang_attack3'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        6,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0027_tangtang_attack2.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0027_tangtang_attack2',
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
                    skillId: 'chr_0027_tangtang_attack2_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atb: 0, atk_scale_1: 0.09 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
                              tags: ['normalAttack'],
                            },
                            'chr_0027_tangtang_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        3,
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
        6,
      ),
      scheduled(
        10,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0027_tangtang_attack2.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0]:projectile_chr_0027_tangtang_attack2_2',
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                              tags: ['normalAttack'],
                            },
                            'chr_0027_tangtang_attack2:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                          branch(
                            { kind: 'casterControlled' },
                            sequence(
                              branch(
                                { kind: 'casterControlled' },
                                sequence(
                                  step('changeResourceByActionValue', {
                                    resource: 'sp',
                                    amount: { kind: 'blackboard', key: 'atb' },
                                    coefficient: { kind: 'constant', value: 0.5 },
                                    recipient: 'team',
                                    spGainKind: 'gain',
                                    spGainSource: 'normalAttack',
                                  }),
                                ),
                              ),
                            ),
                            undefined,
                            { alwaysNext: true },
                          ),
                        ),
                        3,
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
        18,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0027_tangtang_attack3'] })),
        39,
      ),
    ],
    timelineContinuationSkillId: 'chr_0027_tangtang_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale_1: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23],
    atk_scale_2: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    display_atk_scale: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56],
  },
);

export const tangtangChr_0027_tangtang_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0027_tangtang_attack3',
    timelineBlockFrames: 26,
    naturalDurationFrames: 115,
    exclusiveFrame: 30,
    offsetRecordFrame: 5,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 43,
          input: 'basicAttack',
          targetSkillId: 'chr_0027_tangtang_attack4',
        },
      ],
      allowedNextSkills: [
        { startFrame: 26, endFrame: 43, skillIds: ['chr_0027_tangtang_attack4'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        5,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'cryo',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
                  tags: ['normalAttack'],
                },
                'chr_0027_tangtang_attack3:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
            ),
            {
              nativeChanneling: {
                executeEachFrame: false,
                triggerIntervalSeconds: 0.06,
                maxCountPerTarget: -1,
                targetTriggerIntervalSeconds: -1,
              },
            },
          ),
        ),
        13,
      ),
      scheduled(
        17,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0027_tangtang_attack3.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0]:projectile_chr_0027_tangtang_attack3',
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
                    skillId: 'chr_0027_tangtang_attack3_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atb: 0, atk_scale_2: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                              tags: ['normalAttack'],
                            },
                            'chr_0027_tangtang_attack3:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        3,
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
        17,
      ),
      scheduled(
        17,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0027_tangtang_attack3.actionGroupData.timelineActions[8]._sequenceActionData.actionData[0]:projectile_chr_0027_tangtang_attack3',
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
                    skillId: 'chr_0027_tangtang_attack3_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atb: 0, atk_scale_2: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                              tags: ['normalAttack'],
                            },
                            'chr_0027_tangtang_attack3:/scheduledSequences/2/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        3,
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
        17,
      ),
      scheduled(
        18,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0027_tangtang_attack3.actionGroupData.timelineActions[9]._sequenceActionData.actionData[0]:projectile_chr_0027_tangtang_attack3',
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
                    skillId: 'chr_0027_tangtang_attack3_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atb: 0, atk_scale_2: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                              tags: ['normalAttack'],
                            },
                            'chr_0027_tangtang_attack3:/scheduledSequences/3/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        3,
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
        18,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0027_tangtang_attack3.actionGroupData.timelineActions[10]._sequenceActionData.actionData[0]:projectile_chr_0027_tangtang_attack3',
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
                    skillId: 'chr_0027_tangtang_attack3_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atb: 0, atk_scale_2: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                              tags: ['normalAttack'],
                            },
                            'chr_0027_tangtang_attack3:/scheduledSequences/4/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        3,
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
        26,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0027_tangtang_attack4'] })),
        43,
      ),
    ],
    timelineContinuationSkillId: 'chr_0027_tangtang_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale_1: [0.05, 0.06, 0.06, 0.07, 0.07, 0.08, 0.08, 0.09, 0.09, 0.1, 0.1, 0.11],
    atk_scale_2: [0.03, 0.03, 0.03, 0.03, 0.04, 0.04, 0.04, 0.04, 0.05, 0.05, 0.05, 0.06],
    display_atk_scale: [0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.67, 0.73, 0.79],
  },
);

export const tangtangChr_0027_tangtang_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0027_tangtang_attack4',
    timelineBlockFrames: 24,
    naturalDurationFrames: 143,
    exclusiveFrame: 28,
    offsetRecordFrame: 12,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 50,
          input: 'basicAttack',
          targetSkillId: 'chr_0027_tangtang_attack5',
        },
      ],
      allowedNextSkills: [
        { startFrame: 24, endFrame: 50, skillIds: ['chr_0027_tangtang_attack5'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        6,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
              tags: ['normalAttack'],
            },
            'chr_0027_tangtang_attack4:/scheduledSequences/0/sequence/steps/0',
          ),
        ),
        8,
      ),
      scheduled(
        10,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
              tags: ['normalAttack'],
            },
            'chr_0027_tangtang_attack4:/scheduledSequences/1/sequence/steps/0',
          ),
        ),
        12,
      ),
      scheduled(
        23,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
              tags: ['normalAttack'],
            },
            'chr_0027_tangtang_attack4:/scheduledSequences/2/sequence/steps/0',
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
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        28,
      ),
      scheduled(
        24,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0027_tangtang_attack5'] })),
        50,
      ),
    ],
    timelineContinuationSkillId: 'chr_0027_tangtang_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale_1: [0.08, 0.09, 0.1, 0.1, 0.11, 0.12, 0.13, 0.14, 0.14, 0.15, 0.17, 0.18],
    atk_scale_2: [0.21, 0.23, 0.25, 0.27, 0.29, 0.31, 0.33, 0.35, 0.37, 0.39, 0.43, 0.46],
    display_atk_scale: [0.37, 0.4, 0.44, 0.47, 0.51, 0.55, 0.58, 0.62, 0.66, 0.7, 0.76, 0.82],
  },
);

export const tangtangChr_0027_tangtang_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0027_tangtang_attack5',
    timelineBlockFrames: 36,
    naturalDurationFrames: 190,
    exclusiveFrame: 36,
    offsetRecordFrame: 22,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 77,
          input: 'basicAttack',
          targetSkillId: 'chr_0027_tangtang_attack1',
        },
      ],
      allowedNextSkills: [
        { startFrame: 36, endFrame: 77, skillIds: ['chr_0027_tangtang_attack1'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        22,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0027_tangtang_attack5.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0027_tangtang_attack5',
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
                    skillId: 'chr_0027_tangtang_attack5_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atb: 0, atk_scale: 0, cnt: 0, poise: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack', 'normalAttackLastCombo'],
                            },
                            'chr_0027_tangtang_attack5:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                          branch(
                            { kind: 'casterControlled' },
                            sequence(
                              step('dealStagger', { value: { kind: 'blackboard', key: 'poise' } }),
                              branch(
                                {
                                  kind: 'actionValueCompare',
                                  left: {
                                    kind: 'blackboard',
                                    key: 'EntityBB_atk05_cnt',
                                    fallback: 0,
                                  },
                                  operator: 'less',
                                  right: { kind: 'constant', value: 1 },
                                },
                                sequence(
                                  step('changeResourceByActionValue', {
                                    resource: 'sp',
                                    amount: { kind: 'blackboard', key: 'atb' },
                                    coefficient: { kind: 'constant', value: 1 },
                                    recipient: 'team',
                                    spGainKind: 'gain',
                                    spGainSource: 'normalAttack',
                                  }),
                                  step('modifyActionValue', {
                                    key: 'EntityBB_atk05_cnt',
                                    operation: 'add',
                                    value: { kind: 'constant', value: 1 },
                                  }),
                                ),
                              ),
                            ),
                            undefined,
                            { alwaysNext: true },
                          ),
                        ),
                        3,
                      ),
                    ],
                  },
                },
              ],
            }),
            { EntityBB_atk05_cnt: 0 },
            { lifetime: 'execution' },
          ),
        ),
        22,
      ),
      scheduled(
        36,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0027_tangtang_attack1'] })),
        77,
      ),
    ],
    timelineContinuationSkillId: 'chr_0027_tangtang_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 18,
    atk_scale: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.96, 1.04, 1.13],
    cnt: 0,
    poise: 18,
  },
);

export const tangtangChr_0027_tangtang_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0027_tangtang_power_attack',
    timelineBlockFrames: 48,
    naturalDurationFrames: 121,
    exclusiveFrame: 47,
    offsetRecordFrame: 0,
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        9,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.3,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0027_tangtang_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
          step('startTimeDilation', {
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
          }),
        ),
        9,
      ),
      scheduled(
        21,
        sequence(
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.7,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0027_tangtang_power_attack:/scheduledSequences/1/sequence/steps/1',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          }),
        ),
        21,
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
        47,
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
        33,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const tangtangChr_0027_tangtang_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0027_tangtang_plunging_attack_end',
    timelineBlockFrames: 16,
    naturalDurationFrames: 118,
    exclusiveFrame: 15,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        3,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'cryo',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack', 'plungingAttack'],
                },
                'chr_0027_tangtang_plunging_attack_end:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
            ),
            { nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.07 } },
          ),
        ),
        11,
      ),
    ],
    skillType: 'plungingAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atk_scale: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45] },
);

export const tangtangChr_0027_tangtang_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0027_tangtang_normal_skill',
    timelineBlockFrames: 51,
    naturalDurationFrames: 136,
    exclusiveFrame: 50,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 50, endFrame: 76, skillIds: ['chr_0027_tangtang_normal_skill'] },
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
        2,
      ),
      scheduled(
        27,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'cryo',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
                  tags: ['normalSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise1' },
                },
                'chr_0027_tangtang_normal_skill:/scheduledSequences/1/sequence/steps/0/body/steps/0',
              ),
              once(
                'SkillData.chr_0027_tangtang_normal_skill.actionGroupData.timelineActions[8]._sequenceActionData.actionData[0].actionOnTick.actionData[3]',
                sequence(step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 })),
              ),
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.02 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_normal_attack' },
                finishByAction: false,
                targets: ['caster'],
              }),
            ),
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 5,
                targetTriggerIntervalSeconds: 0.075,
              },
            },
          ),
        ),
        39,
      ),
      scheduled(
        11,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'water',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_comboskill_water'],
          }),
          step('modifyActionValue', {
            key: 'tornado_atk_scale01',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'EntityBB_abilityentity_water01' },
          }),
          step('modifyActionValue', {
            key: 'tornado_atk_scale02',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'EntityBB_abilityentity_water02' },
          }),
          step('modifyActionValue', {
            key: 'tornado_atk_scale03',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'EntityBB_abilityentity_water03' },
          }),
          branch(
            {
              kind: 'contextTargetCountCompare',
              contextKey: 'water',
              operator: 'greaterOrEqual',
              value: 1,
            },
            sequence(
              forEachContextTarget(
                'water',
                sequence(
                  step('modifyActionValue', {
                    key: 'water_cnt',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  forEachContextTarget(
                    'water',
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0027_tangtang_water_wake',
                        target: 'currentAbilityEntity',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  ),
                ),
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'water_cnt', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 1 },
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
                ),
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'water_cnt', fallback: 0 },
                      operator: 'equal',
                      right: { kind: 'constant', value: 2 },
                    },
                    sequence(
                      step('changeResourceByActionValue', {
                        resource: 'sp',
                        amount: { kind: 'blackboard', key: 'atb_return' },
                        coefficient: { kind: 'constant', value: 2 },
                        recipient: 'team',
                        spGainKind: 'refund',
                        spGainSource: 'skill',
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
                  ),
                ),
                { alwaysNext: true },
              ),
              step('spawnAbilityEntity', {
                abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_move',
                childSkillId: 'chr_0027_tangtang_normal_skill_abilityentitymove',
                inheritActionBlackboard: true,
                dieWhenSourceDies: false,
                target: 'caster',
                saveToContextKey: 'normalskill_watermove',
              }),
              forEachContextTarget(
                'normalskill_watermove',
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_1',
                    target: 'currentAbilityEntity',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            sequence(
              step('spawnAbilityEntity', {
                abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_move',
                childSkillId: 'chr_0027_tangtang_normal_skill_abilityentitymove',
                inheritActionBlackboard: true,
                dieWhenSourceDies: false,
                target: 'caster',
                saveToContextKey: 'normalskill_watermove_1',
              }),
              forEachContextTarget(
                'normalskill_watermove_1',
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_1',
                    target: 'currentAbilityEntity',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            { alwaysNext: true },
          ),
        ),
        11,
      ),
      scheduled(
        44,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'normalwater_move',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_normal_skill_move'],
            sameSourceSkillCast: true,
          }),
          branch(
            {
              kind: 'contextTargetCountCompare',
              contextKey: 'normalwater_move',
              operator: 'greaterOrEqual',
              value: 1,
              outputKey: 'normalskillwatermove_cnt',
            },
            sequence(
              forEachContextTarget(
                'normalwater_move',
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_2',
                    target: 'currentAbilityEntity',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
          ),
        ),
        45,
      ),
      scheduled(
        1,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0027_tangtang_skillappear',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        24,
      ),
    ],
    smartTarget: 'input',
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb_return: 20,
    atb_return_02: 40,
    atk_scale_02: 0,
    atk_scale_1: [0.16, 0.176, 0.192, 0.208, 0.224, 0.24, 0.256, 0.272, 0.288, 0.308, 0.332, 0.36],
    cam_angle: 0,
    cam_duration: 0,
    duration: 5,
    duration_spellvulnerable: 15,
    duration_tornado: 3,
    hit_cnt: 4,
    hit_cntmax: 10,
    hit_duration: 5,
    input_angle: 0,
    max_stack: 0,
    normalskillwatermove_cnt: 0,
    poise_tornado: 0,
    poise1: 2,
    potential_5_CrystDamageIncrease: 0,
    potential3: 0,
    potential5: 0,
    potential5_duration: 0,
    rate_spellvulnerable: [
      0.03, 0.03, 0.03, 0.035, 0.035, 0.035, 0.04, 0.04, 0.04, 0.045, 0.045, 0.05,
    ],
    rate_spellvulnerable_02: [
      0.06, 0.06, 0.06, 0.07, 0.07, 0.07, 0.08, 0.08, 0.08, 0.09, 0.09, 0.1,
    ],
    talent2: 0,
    talent2_ultskill: 0,
    tornado_atk_scale01: 0,
    tornado_atk_scale02: 0,
    tornado_atk_scale03: 0,
    tornado_usp_01: 0,
    tornado_usp_02: 0,
    water_cnt: 0,
    display_atk_scale1: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    display_atk_scale2: [1.33, 1.47, 1.6, 1.74, 1.87, 2, 2.14, 2.27, 2.4, 2.57, 2.77, 3],
    display_poise: 10,
  },
);

export const tangtangChr_0027_tangtang_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0027_tangtang_ultimate_skill',
    timelineBlockFrames: 85,
    naturalDurationFrames: 202,
    exclusiveFrame: 84,
    offsetRecordFrame: 0,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 82,
          endFrame: 174,
          input: 'basicAttack',
          targetSkillId: 'chr_0027_tangtang_attack1',
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
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
        0,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0027_tangtang_ultskill_vfx'],
            reason: 'other',
          }),
        ),
        0,
      ),
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
        84,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 82),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        82,
      ),
      scheduled(
        76,
        sequence(
          step('modifyActionValue', {
            key: 'tornado_atk_scale01',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'EntityBB_abilityentity_water01' },
          }),
          step('modifyActionValue', {
            key: 'tornado_atk_scale02',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'EntityBB_abilityentity_water02' },
          }),
          step('modifyActionValue', {
            key: 'tornado_atk_scale03',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'EntityBB_abilityentity_water03' },
          }),
          step('modifyActionValue', {
            key: 'rate_spellvulnerable',
            operation: 'add',
            value: { kind: 'blackboard', key: 'EntityBB_abilityentity_rate_spellvulnerable' },
          }),
          step('modifyActionValue', {
            key: 'rate_spellvulnerable_02',
            operation: 'add',
            value: { kind: 'blackboard', key: 'EntityBB_abilityentity_rate_spellvulnerable_02' },
          }),
          step('modifyActionValue', {
            key: 'duration_spellvulnerable',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'EntityBB_abilityentity_duration_spellvulnerable' },
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'talent2', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'talent2_ultskill',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
              step('spawnAbilityEntity', {
                abilityEntityId: 'abilityentity_chr_0027_tangtang_ultskill',
                childSkillId: 'chr_0027_tangtang_ultimate_skill_1',
                inheritActionBlackboard: true,
                dieWhenSourceDies: false,
              }),
            ),
            sequence(
              step('spawnAbilityEntity', {
                abilityEntityId: 'abilityentity_chr_0027_tangtang_ultskill',
                childSkillId: 'chr_0027_tangtang_ultimate_skill_1',
                inheritActionBlackboard: true,
                dieWhenSourceDies: false,
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        76,
      ),
    ],
    cooldownFrames: 600,
    costs: [{ resource: 'ultimateEnergy', value: 90 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale_1: [0.178, 0.196, 0.213, 0.231, 0.249, 0.267, 0.284, 0.302, 0.32, 0.342, 0.369, 0.4],
    atk_scale_2: [1.778, 1.956, 2.134, 2.311, 2.489, 2.667, 2.845, 3.023, 3.2, 3.423, 3.689, 4],
    atk_scale_3: [3.111, 3.422, 3.734, 4.045, 4.356, 4.667, 4.978, 5.289, 5.6, 5.989, 6.456, 7],
    dmg_up_water_ult: 0,
    duration: 12,
    duration_spellvulnerable: 0,
    duration_talent1buff: 3,
    poise1: 0,
    poise2: 15,
    poise3: 20,
    potential1: 0,
    potential3_rate_spellvulnerable: 0,
    potential4: 0,
    potential5: 0,
    rate_spellvulnerable: 0,
    rate_spellvulnerable_02: 0,
    rate_vul_base: 0,
    ratio_speed: 0.2,
    ratio_speedreduction: 0.8,
    talent1_speed: 0,
    talent2: 0,
    talent2_ultskill: 0,
    tornado_atk_scale01: 0,
    tornado_atk_scale02: 0,
    tornado_atk_scale03: 0,
    display_atk_scale: [1.42, 1.56, 1.71, 1.85, 1.99, 2.13, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2],
    display_duration: 4,
  },
);

export const tangtangChr_0027_tangtang_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0027_tangtang_combo_skill',
    timelineBlockFrames: 42,
    naturalDurationFrames: 200,
    exclusiveFrame: 41,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 31, endFrame: 93, skillIds: ['chr_0027_tangtang_normal_skill'] },
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
        1,
      ),
      scheduled(
        26,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'combowater_cnt', fallback: 0 },
              operator: 'lessOrEqual',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'combowater_cnt',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0027_tangtang_water'],
                  operator: 'greater',
                  value: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('findOwnerSpawnedAbilityEntities', {
                    saveToContextKey: 'water_group',
                    abilityEntityIds: ['abilityentity_chr_0027_tangtang_comboskill_water'],
                  }),
                  branch(
                    {
                      kind: 'abilityEntityTimedMarkerPresent',
                      contextKey: 'water_group',
                      markerId: 'tangtang_waterabilityentity01',
                    },
                    instantiateActionSequence(sharedActionSequence1, [
                      'SkillData.chr_0027_tangtang_combo_skill.actionGroupData.timelineActions[6]._sequenceActionData.actionData[1].succeedActions.actionData[2].succeedActions.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0]:projectile_chr_0027_tangtang_water',
                      'SkillData.chr_0027_tangtang_combo_skill.actionGroupData.timelineActions[6]._sequenceActionData.actionData[1].succeedActions.actionData[2].succeedActions.actionData[1].succeedActions.actionData[0].failActions.actionData[0]:projectile_chr_0027_tangtang_water',
                    ]),
                    instantiateActionSequence(sharedActionSequence1, [
                      'SkillData.chr_0027_tangtang_combo_skill.actionGroupData.timelineActions[6]._sequenceActionData.actionData[1].succeedActions.actionData[2].succeedActions.actionData[1].failActions.actionData[0].succeedActions.actionData[0]:projectile_chr_0027_tangtang_water',
                      'SkillData.chr_0027_tangtang_combo_skill.actionGroupData.timelineActions[6]._sequenceActionData.actionData[1].succeedActions.actionData[2].succeedActions.actionData[1].failActions.actionData[0].failActions.actionData[0]:projectile_chr_0027_tangtang_water',
                    ]),
                    { alwaysNext: true },
                  ),
                ),
                instantiateActionSequence(sharedActionSequence2, [
                  'SkillData.chr_0027_tangtang_combo_skill.actionGroupData.timelineActions[6]._sequenceActionData.actionData[1].succeedActions.actionData[2].failActions.actionData[0]:projectile_chr_0027_tangtang_water',
                ]),
                { alwaysNext: true },
              ),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0027_tangtang_combo_skill:/scheduledSequences/1/sequence/steps/0/whenTrue/steps/1',
          ),
          step('dealStagger', { value: { kind: 'blackboard', key: 'poise' } }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'tar_cnt', fallback: 0 },
              operator: 'lessOrEqual',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'blackboard', key: 'usp' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'caster',
              }),
              step('modifyActionValue', {
                key: 'tar_cnt',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['caster'],
          }),
        ),
        29,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.867000043 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        23,
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
        5,
      ),
    ],
    smartTarget: 'trigger',
    cooldownFrames: [420, 420, 420, 420, 420, 420, 420, 420, 390, 390, 390, 360],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [1.067, 1.173, 1.28, 1.387, 1.494, 1.6, 1.707, 1.814, 1.92, 2.054, 2.214, 2.4],
    cam_angle2: 0,
    cam_duration2: 0,
    combowater_cnt: 0,
    dmg_up_water_ult: 0,
    duration: 3,
    duration_talent1buff: 0,
    duration_water: 30,
    input_angle2: 0,
    max_stack: 0,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    poise: 10,
    potential1: 0,
    potential3_duration: 0,
    potential5: 0,
    potential5_dmg_up_water_ult: 0,
    range_talent1buff: 5,
    ratio_speed: 0,
    ratio_speedreduction: 0,
    talent1_speed: 0,
    talent2: 0,
    tar_cnt: 0,
    usp: 10,
  },
);

export const tangtangCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const tangtang: OperatorDefinition = {
  slug: 'tangtang',
  gameId: 'TANGTANG',
  rarity: 6,
  weaponType: 'handcannon',
  element: 'cryo',
  role: 'caster',
  mainAttribute: 'agility',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [13, 37, 61, 86, 111, 123],
    agility: [23, 56, 91, 126, 162, 179],
    intellect: [8, 25, 42, 59, 77, 85],
    will: [10, 29, 50, 71, 91, 102],
    baseAttack: [30, 92, 157, 223, 288, 321],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  passiveUi: { kind: 'numeric', appearance: 'tangtangDroplets', maximum: 2 },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        tangtangChr_0027_tangtang_attack1,
        tangtangChr_0027_tangtang_attack2,
        tangtangChr_0027_tangtang_attack3,
        tangtangChr_0027_tangtang_attack4,
        tangtangChr_0027_tangtang_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: tangtangChr_0027_tangtang_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: tangtangChr_0027_tangtang_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: tangtangChr_0027_tangtang_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: tangtangChr_0027_tangtang_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: tangtangChr_0027_tangtang_combo_skill,
    },
  ],
  dodgeSkill: tangtangCommon_character_perfect_dodge,
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
  playerActionModes: [
    {
      modeId: 'ult',
      modeLayer: 'default',
      defaultEnabled: false,
      normalAttackSkillKeys: [
        'chr_0027_tangtang_attack1',
        'chr_0027_tangtang_attack2',
        'chr_0027_tangtang_attack3',
        'chr_0027_tangtang_attack4',
        'chr_0027_tangtang_attack5',
      ],
      commandMappings: { basicAttack: { skillId: 'chr_0027_tangtang_ult_attack3' } },
    },
    {
      modeId: 'ult_end',
      modeLayer: 'default',
      defaultEnabled: false,
      commandMappings: { basicAttack: { skillId: 'chr_0027_tangtang_ult_attack5' } },
    },
  ],
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0027_tangtang_combo_skill',
      event: 'takeDamage',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'eventDamageTagsMatch',
            match: 'hasAny',
            tags: ['fireBurst', 'cryoBurst', 'electricBurst', 'natureBurst'],
          },
          sequence(
            branch(
              {
                kind: 'contextTargetObjectTypeMatch',
                contextKey: 'trigger',
                objectTypes: ['enemy'],
              },
              sequence(),
            ),
          ),
        ),
      ),
    },
    {
      key: 'native-combo:1',
      skillKey: 'chr_0027_tangtang_combo_skill',
      event: 'beforeTakeInfliction',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch({ kind: 'eventInflictionElementIn', elements: ['cryo'] }, sequence()),
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
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent1_speed',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'ratio_speedreduction',
          operation: 'assign',
          value: [0.2, 0.4],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'ratio_speed',
          operation: 'assign',
          value: [0.1, 0.2],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'duration_talent1buff',
          operation: 'assign',
          value: [3, 3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
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
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent2',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent2',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'dmg_up_water_ult',
          operation: 'assign',
          value: [0.4, 0.6],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
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
        { kind: 'addSkillCooldownFrames', skillGroupKey: 'comboSkill', frames: -60 },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential1',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atb_return',
          operation: 'add',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
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
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential3',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'rate_spellvulnerable',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'rate_spellvulnerable_02',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'rate_spellvulnerable',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'rate_spellvulnerable_02',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
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
          blackboardKey: 'potential5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale_1',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale_2',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale_3',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'dmg_up_water_ult',
          operation: 'add',
          value: 0.8,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
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
  passiveSkills: [
    {
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
      enableSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0027_tangtang_passive_0',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: {
            duration_spellvulnerable: { kind: 'blackboard', key: 'duration_spellvulnerable' },
            normalskill_atk_scale01: { kind: 'blackboard', key: 'normalskill_atk_scale01' },
            normalskill_atk_scale02: { kind: 'blackboard', key: 'normalskill_atk_scale02' },
            normalskill_atk_scale03: { kind: 'blackboard', key: 'normalskill_atk_scale03' },
            rate_spellvulnerable: { kind: 'blackboard', key: 'rate_spellvulnerable' },
            rate_spellvulnerable_02: { kind: 'blackboard', key: 'rate_spellvulnerable_02' },
          },
        }),
        step('applyBuff', {
          buffId: 'buff_chr_0027_tangtang_water_passiveui',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
        }),
      ),
    },
  ],
  buffDefinitions: {
    buff_chr_0027_tangtang_comboskill_spelllnfliction: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: { blackboardKey: 'hit_spelllnflictionmax' },
      durationSeconds: { blackboardKey: 'hit_spellduration' },
      applyTags: [],
      extendTags: [],
      blackboard: { hit_spellduration: 6, hit_spelllnflictionmax: 2 },
      attributeModifiers: [],
    },
    buff_chr_0027_tangtang_comboskill_waterbuff: {
      stackingType: 'highPriority',
      priority: { blackboardKey: 'ratio_speed' },
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration_waterbuff' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_tangtang_speedup',
        iconPath: '/icons/icon_battle_tangtang_speedup.webp',
        showInHeadBarCommon: false,
        showInHeadBarAttached: false,
        showInSquadIcon: false,
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
      blackboard: { duration_waterbuff: 30, ratio_speed: 0.1 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0027_tangtang_comboskill_waterbuff_outaura'],
            reason: 'other',
          }),
        ),
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_speedup',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration_waterbuff' },
              rate: { kind: 'blackboard', key: 'ratio_speed' },
            },
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0027_tangtang_water_icon' },
          }),
        ),
      },
    },
    buff_chr_0027_tangtang_comboskill_waterbuff_outaura: {
      stackingType: 'highPriority',
      priority: { blackboardKey: 'ratio_speed' },
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration_talent1buff' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_tangtang_speedup',
        iconPath: '/icons/icon_battle_tangtang_speedup.webp',
        showInHeadBarCommon: false,
        showInHeadBarAttached: false,
        showInSquadIcon: false,
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
      blackboard: { duration_talent1buff: 3, ratio_speed: 0.2 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'buffOwner',
              buffIds: ['buff_chr_0027_tangtang_comboskill_waterbuff'],
              operator: 'lessOrEqual',
              value: { kind: 'constant', value: 0 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_common_affixes_speedup',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                asChildBuff: true,
                finishByAction: true,
                blackboardAssignments: {
                  duration: { kind: 'blackboard', key: 'duration_talent1buff' },
                  rate: { kind: 'blackboard', key: 'ratio_speed' },
                },
                stringBlackboardAssignments: { child_buff_id: 'buff_chr_0027_tangtang_water_icon' },
              }),
            ),
          ),
        ),
      },
    },
    buff_chr_0027_tangtang_comboskill_waterdebuff: {
      stackingType: 'highPriority',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration_waterdebuff' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration_waterdebuff: 30, ratio_speedreduction: 0.7 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_slow',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration_waterdebuff' },
              rate: { kind: 'blackboard', key: 'ratio_speedreduction' },
            },
          }),
        ),
      },
    },
    buff_chr_0027_tangtang_comboskill_waterdebuff_outaura: {
      stackingType: 'highPriority',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration_talent1buff' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration_talent1buff: 3, ratio_speedreduction: 0.7 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_slow',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration_talent1buff' },
              rate: { kind: 'blackboard', key: 'ratio_speedreduction' },
            },
          }),
        ),
      },
    },
    buff_chr_0027_tangtang_normalskill_abilityentity_1: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 10, duration_move: 1 },
      attributeModifiers: [],
    },
    buff_chr_0027_tangtang_normalskill_abilityentity_2: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: { blackboardKey: 'trigger' },
      waitFirstTriggerInterval: false,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 3, duration_move: 3, speed: 5, trigger: 0.1 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0027_tangtang_normalskill_abilityentity_1'],
            reason: 'other',
          }),
        ),
      },
    },
    buff_chr_0027_tangtang_normalskill_spellvulnerable: {
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
        rate_vul_base: 0,
        real_duration: 0,
      },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('readCurrentBuffRemainingDuration', { outputKey: 'real_duration' }),
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_spell',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'real_duration' },
              rate: { kind: 'blackboard', key: 'rate_spellvulnerable' },
            },
          }),
        ),
      },
    },
    buff_chr_0027_tangtang_passive_0: {
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
        {
          event: 'beforeCastSkill',
          priority: 0,
          sequence: sequence(
            step('modifyActionValue', {
              key: 'EntityBB_abilityentity_water01',
              operation: 'assign',
              value: { kind: 'blackboard', key: 'normalskill_atk_scale01' },
            }),
            step('modifyActionValue', {
              key: 'EntityBB_abilityentity_water02',
              operation: 'assign',
              value: { kind: 'blackboard', key: 'normalskill_atk_scale02' },
            }),
            step('modifyActionValue', {
              key: 'EntityBB_abilityentity_water03',
              operation: 'assign',
              value: { kind: 'blackboard', key: 'normalskill_atk_scale03' },
            }),
            step('modifyActionValue', {
              key: 'EntityBB_abilityentity_rate_spellvulnerable',
              operation: 'assign',
              value: { kind: 'blackboard', key: 'rate_spellvulnerable' },
            }),
            step('modifyActionValue', {
              key: 'EntityBB_abilityentity_rate_spellvulnerable_02',
              operation: 'assign',
              value: { kind: 'blackboard', key: 'rate_spellvulnerable_02' },
            }),
            step('modifyActionValue', {
              key: 'EntityBB_abilityentity_duration_spellvulnerable',
              operation: 'assign',
              value: { kind: 'blackboard', key: 'duration_spellvulnerable' },
            }),
          ),
        },
      ],
    },
    buff_chr_0027_tangtang_skillappear: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: -1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'water_move',
            abilityEntityIds: ['abilityentity_chr_0027_tangtang_normal_skill_move'],
            sameSourceSkillCast: true,
          }),
          forEachContextTarget(
            'water_move',
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_2',
                target: 'currentAbilityEntity',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
              }),
            ),
          ),
        ),
      },
    },
    buff_chr_0027_tangtang_ultskill_abilityentity_1: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 10, duration_move: 1 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'ultwater_abilityentity',
            abilityEntityIds: [],
          }),
        ),
      },
    },
    buff_chr_0027_tangtang_ultskill_abilityentity_2: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: { blackboardKey: 'trigger' },
      waitFirstTriggerInterval: false,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 3, duration_move: 3, speed: 8, trigger: 0.1 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0027_tangtang_normalskill_abilityentity_1'],
            reason: 'other',
          }),
        ),
      },
    },
    buff_chr_0027_tangtang_ultskill_buff: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_tangtang_ultskilldebuff',
        iconPath: '/icons/icon_battle_tangtang_ultskilldebuff.webp',
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
        iconStyleInSquad: 'LifeTime',
        abnormalColorType: 'Physical',
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 5 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'beforeDamageAction',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'originSkillTypeIn', skillTypes: ['plungingAttack'] },
              sequence(
                branch(
                  { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['plungingAttack'] },
                  sequence(
                    step('applyBuff', {
                      buffId: 'buff_chr_0027_tangtang_ultskill_buff_damage',
                      target: 'controlledOperator',
                      source: 'buffSource',
                      inheritSourceSkillCastInfo: true,
                    }),
                  ),
                ),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0027_tangtang_ultskill_buff_damage: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 1 },
      attributeModifiers: [],
    },
    buff_chr_0027_tangtang_ultskill_debuff: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'ultskill_debuff_duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_tangtang_ultskilldebuff',
        iconPath: '/icons/icon_battle_tangtang_ultskilldebuff.webp',
        showInHeadBarCommon: true,
        showInHeadBarAttached: false,
        showInSquadIcon: false,
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
      blackboard: { timedilation_duration: -1, ultskill_debuff_duration: 4 },
      attributeModifiers: [],
    },
    buff_chr_0027_tangtang_ultskill_waterwake: {
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
        hit_cnt: 4,
        hit_cntmax: 10,
        hit_duration: 5,
        poise_tomado: 0,
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
        scheduled(
          0,
          sequence(
            step('findOwnerSpawnedAbilityEntities', {
              saveToContextKey: 'water',
              abilityEntityIds: ['abilityentity_chr_0027_tangtang_comboskill_water'],
            }),
            step('findOwnerSpawnedAbilityEntities', {
              saveToContextKey: 'ultwater_abilityentity',
              abilityEntityIds: ['abilityentity_chr_0027_tangtang_ultskill'],
            }),
            step('modifyActionValue', {
              key: 'tornado_atk_scale01',
              operation: 'assign',
              value: { kind: 'blackboard', key: 'EntityBB_abilityentity_water01' },
            }),
            step('modifyActionValue', {
              key: 'tornado_atk_scale02',
              operation: 'assign',
              value: { kind: 'blackboard', key: 'EntityBB_abilityentity_water02' },
            }),
            step('modifyActionValue', {
              key: 'tornado_atk_scale03',
              operation: 'assign',
              value: { kind: 'blackboard', key: 'EntityBB_abilityentity_water03' },
            }),
            branch(
              {
                kind: 'contextTargetCountCompare',
                contextKey: 'water',
                operator: 'greaterOrEqual',
                value: 1,
              },
              sequence(
                forEachContextTarget(
                  'water',
                  sequence(
                    step('modifyActionValue', {
                      key: 'water_cnt',
                      operation: 'add',
                      value: { kind: 'constant', value: 1 },
                    }),
                    step('applyBuff', {
                      buffId: 'buff_chr_0027_tangtang_water_ultskillwake',
                      target: 'currentAbilityEntity',
                      source: 'buffSource',
                      inheritSourceSkillCastInfo: true,
                    }),
                  ),
                ),
                branch(
                  {
                    kind: 'contextTargetCountCompare',
                    contextKey: 'ultwater_abilityentity',
                    operator: 'greater',
                    value: 0,
                  },
                  sequence(
                    step('spawnAbilityEntity', {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_move',
                      childSkillId: 'chr_0027_tangtang_ult_skill_abilityentitymove',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'caster',
                      saveToContextKey: 'ultskill_watermove',
                    }),
                  ),
                ),
                forEachContextTarget(
                  'ultskill_watermove',
                  sequence(
                    step('applyBuff', {
                      buffId: 'buff_chr_0027_tangtang_ultskill_abilityentity_1',
                      target: 'currentAbilityEntity',
                      source: 'buffSource',
                      inheritSourceSkillCastInfo: true,
                    }),
                  ),
                ),
              ),
              sequence(
                branch(
                  {
                    kind: 'contextTargetCountCompare',
                    contextKey: 'ultwater_abilityentity',
                    operator: 'greater',
                    value: 0,
                  },
                  sequence(
                    step('spawnAbilityEntity', {
                      abilityEntityId: 'abilityentity_chr_0027_tangtang_normal_skill_move',
                      childSkillId: 'chr_0027_tangtang_ult_skill_abilityentitymove',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'caster',
                      saveToContextKey: 'ultskill_watermove',
                    }),
                  ),
                ),
                forEachContextTarget(
                  'ultskill_watermove',
                  sequence(
                    step('applyBuff', {
                      buffId: 'buff_chr_0027_tangtang_ultskill_abilityentity_1',
                      target: 'currentAbilityEntity',
                      source: 'buffSource',
                      inheritSourceSkillCastInfo: true,
                    }),
                  ),
                ),
              ),
              { alwaysNext: true },
            ),
          ),
          1,
        ),
        scheduled(
          12,
          sequence(
            step('findOwnerSpawnedAbilityEntities', {
              saveToContextKey: 'ultwater_move',
              abilityEntityIds: ['abilityentity_chr_0027_tangtang_normal_skill_move'],
              sameSourceSkillCast: true,
            }),
            branch(
              {
                kind: 'contextTargetCountCompare',
                contextKey: 'ultwater_move',
                operator: 'greaterOrEqual',
                value: 1,
                outputKey: 'water_cnt',
              },
              sequence(
                forEachContextTarget(
                  'ultwater_move',
                  sequence(
                    forEachContextTarget(
                      'ultwater_move',
                      sequence(
                        step('applyBuff', {
                          buffId: 'buff_chr_0027_tangtang_ultskill_abilityentity_2',
                          target: 'currentAbilityEntity',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        }),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
          13,
        ),
      ],
    },
    buff_chr_0027_tangtang_water: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: { blackboardKey: 'water_stack' },
      durationSeconds: { blackboardKey: 'duration_water' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration_water: 30, water_stack: 2 },
      attributeModifiers: [],
    },
    buff_chr_0027_tangtang_water_icon: {
      stackingType: 'highPriority',
      priority: { blackboardKey: 'rate', negate: true },
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: 0,
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
      presentation: {
        visible: true,
        iconId: 'icon_battle_affix_speedup',
        iconPath: '/icons/icon_battle_affix_speedup.webp',
        showInHeadBarCommon: true,
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
        iconStyleInSquad: 'LifeTime',
        abnormalColorType: 'Physical',
        orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0, rate: 0 },
      attributeModifiers: [],
    },
    buff_chr_0027_tangtang_water_passiveui: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { water_num: 0 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'abilityEntitySpawned',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'entityTagMatch',
                target: 'actionInputTarget',
                tagQueryType: 'hasAny',
                tags: ['Skill/Character/chr_0027_tangtang/ComboSkillWater'],
              },
              sequence(
                step('modifyActionValue', {
                  key: 'water_num',
                  operation: 'add',
                  value: { kind: 'constant', value: 1 },
                }),
                step('setCharacterPassiveUiValue', {
                  target: 'caster',
                  value: { kind: 'blackboard', key: 'water_num' },
                }),
              ),
            ),
          ),
        },
        {
          event: 'abilityEntityFinished',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'entityTagMatch',
                target: 'actionInputTarget',
                tagQueryType: 'hasAny',
                tags: ['Skill/Character/chr_0027_tangtang/ComboSkillWater'],
              },
              sequence(
                step('modifyActionValue', {
                  key: 'water_num',
                  operation: 'add',
                  value: { kind: 'constant', value: -1 },
                }),
                step('setCharacterPassiveUiValue', {
                  target: 'caster',
                  value: { kind: 'blackboard', key: 'water_num' },
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0027_tangtang_water_ultskillwake: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 0.1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0027_tangtang_water_wake: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 0.1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0027_tangtang_normal_skill_move: {
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
          skillId: 'chr_0027_tangtang_normal_skill_abilityentitymove',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 300,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atk_scale: 0.1,
            atk_scale_03: 0,
            duration: 5,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 5,
            poise: 5,
            poise_tornado: 0,
            water_cnt: 0,
          },
          scheduledSequences: [
            scheduled(12, sharedActionSequence6, 12),
            scheduled(298, sequence(step('finishActionOwnerAbilityEntity', {})), 298),
            scheduled(
              0,
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0027_tangtang_normalskill_abilityentity_1',
                  target: 'currentAbilityEntity',
                  inheritSourceSkillCastInfo: true,
                }),
              ),
              0,
            ),
          ],
        },
        chr_0027_tangtang_ult_skill_abilityentitymove: {
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
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 5,
            poise: 5,
            poise_tornado: 0,
            talent2: 0,
            talent2_ultskill: 0,
            water_cnt: 0,
          },
          scheduledSequences: [
            scheduled(18, sharedActionSequence6, 18),
            scheduled(150, sequence(step('finishActionOwnerAbilityEntity', {})), 150),
          ],
        },
      },
    },
    abilityentity_chr_0027_tangtang_comboskill_water: {
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
          atk_scale_water: 1,
          duration_talent1buff: 3,
          max_stack: 0,
          potential1: 0,
          potential3_duration: 0,
          potential5: 0,
          potential5_dmg_up_water_ult: 0,
          range_talent1buff: 5,
          ratio_speed: 0.2,
          ratio_speedreduction: 0.8,
          talent1_speed: 0,
          talent2_ultskill: 0,
          tornado_atk_scale01: 0,
          tornado_atk_scale02: 0,
          tornado_atk_scale03: 0,
        },
        scheduledSequences: [
          scheduled(
            1500,
            sequence(
              step('findOwnerSpawnedAbilityEntities', {
                saveToContextKey: 'tangtang',
                abilityEntityIds: ['abilityentity_chr_0027_tangtang_normal_skill_move'],
              }),
              branch(
                {
                  kind: 'abilityEntityTimedMarkerPresent',
                  markerId: 'tangtang_waterabilityentity01',
                },
                sequence(
                  forEachContextTarget(
                    'tangtang',
                    sequence({
                      kind: 'launchProjectile',
                      parameters: { finish: { reachAfterTicks: 2, maxDurationSeconds: 2 } },
                      callbacks: [],
                    }),
                  ),
                ),
                sequence(
                  branch(
                    {
                      kind: 'abilityEntityTimedMarkerPresent',
                      markerId: 'tangtang_waterabilityentity02',
                    },
                    sequence(
                      forEachContextTarget(
                        'tangtang',
                        sequence({
                          kind: 'launchProjectile',
                          parameters: { finish: { reachAfterTicks: 2, maxDurationSeconds: 2 } },
                          callbacks: [],
                        }),
                      ),
                    ),
                    sequence(
                      forEachContextTarget(
                        'tangtang',
                        sequence({
                          kind: 'launchProjectile',
                          parameters: { finish: { reachAfterTicks: 2, maxDurationSeconds: 2 } },
                          callbacks: [],
                        }),
                      ),
                    ),
                    { alwaysNext: true },
                  ),
                ),
                { alwaysNext: true },
              ),
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0027_tangtang_water'],
                reason: 'other',
                count: { kind: 'constant', value: 1 },
              }),
            ),
            1501,
          ),
          scheduled(
            1515,
            sequence(
              step('findOwnerSpawnedAbilityEntities', {
                saveToContextKey: 'ultskill_center_abilityentity',
                abilityEntityIds: ['abilityentity_chr_0027_tangtang_ultskill'],
              }),
              branch(
                {
                  kind: 'all',
                  conditions: [
                    {
                      kind: 'contextTargetCountCompare',
                      contextKey: 'ultskill_center_abilityentity',
                      operator: 'greater',
                      value: 0,
                    },
                    {
                      kind: 'contextTargetCountCompare',
                      contextKey: 'ultskill_center_abilityentity',
                      operator: 'greaterOrEqual',
                      value: 1,
                    },
                  ],
                },
                sequence(
                  branch(
                    {
                      kind: 'abilityEntityTimedMarkerPresent',
                      markerId: 'tangtang_waterabilityentity01',
                    },
                    sequence(
                      forEachContextTarget(
                        'ultskill_center_abilityentity',
                        sequence({
                          kind: 'launchProjectile',
                          parameters: { finish: { reachAfterTicks: 2, maxDurationSeconds: 2 } },
                          callbacks: [],
                        }),
                      ),
                    ),
                    sequence(
                      branch(
                        {
                          kind: 'abilityEntityTimedMarkerPresent',
                          markerId: 'tangtang_waterabilityentity02',
                        },
                        sequence(
                          forEachContextTarget(
                            'ultskill_center_abilityentity',
                            sequence({
                              kind: 'launchProjectile',
                              parameters: { finish: { reachAfterTicks: 2, maxDurationSeconds: 2 } },
                              callbacks: [],
                            }),
                          ),
                        ),
                        sequence(
                          forEachContextTarget(
                            'ultskill_center_abilityentity',
                            sequence({
                              kind: 'launchProjectile',
                              parameters: { finish: { reachAfterTicks: 2, maxDurationSeconds: 2 } },
                              callbacks: [],
                            }),
                          ),
                        ),
                        { alwaysNext: true },
                      ),
                    ),
                    { alwaysNext: true },
                  ),
                  step('finishBuffsById', {
                    target: 'caster',
                    buffIds: ['buff_chr_0027_tangtang_water'],
                    reason: 'other',
                    count: { kind: 'constant', value: 1 },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
            ),
            1516,
          ),
          scheduled(
            0,
            sequence(
              step('jumpTimeline', {
                destinationFrame: 1500,
                condition: {
                  kind: 'buffIdStackCompare',
                  target: 'currentAbilityEntity',
                  buffIds: ['buff_chr_0027_tangtang_water_wake'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
              }),
            ),
            1500,
          ),
          scheduled(
            0,
            sequence(
              step('jumpTimeline', {
                destinationFrame: 1515,
                condition: {
                  kind: 'buffIdStackCompare',
                  target: 'currentAbilityEntity',
                  buffIds: ['buff_chr_0027_tangtang_water_ultskillwake'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
              }),
            ),
            1500,
          ),
          scheduled(1500, sequence(step('finishActionOwnerAbilityEntity', {})), 1501),
          scheduled(1515, sequence(step('finishActionOwnerAbilityEntity', {})), 1516),
          scheduled(
            900,
            sequence(
              step('finishActionOwnerAbilityEntity', {}),
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0027_tangtang_water'],
                reason: 'other',
                count: { kind: 'constant', value: 1 },
              }),
            ),
            901,
          ),
          scheduled(1500, sequence(step('finishActionOwnerAbilityEntity', {})), 1501),
          scheduled(1515, sequence(step('finishActionOwnerAbilityEntity', {})), 1516),
          scheduled(
            0,
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'talent1_speed', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('finishBuffsById', {
                    target: 'enemy',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_waterdebuff_outaura'],
                    reason: 'other',
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0027_tangtang_comboskill_waterdebuff',
                    target: 'enemy',
                    finishByAction: true,
                    onActionEndBuffs: [
                      {
                        buffId: 'buff_chr_0027_tangtang_comboskill_waterdebuff_outaura',
                        target: 'enemy',
                        inheritSourceSkillCastInfo: true,
                        blackboardAssignments: {
                          duration_talent1buff: { kind: 'blackboard', key: 'duration_talent1buff' },
                          ratio_speedreduction: { kind: 'blackboard', key: 'ratio_speedreduction' },
                        },
                      },
                    ],
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      ratio_speedreduction: { kind: 'blackboard', key: 'ratio_speedreduction' },
                    },
                  }),
                  step('finishBuffsById', {
                    target: 'partyExceptCaster',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_waterbuff_outaura'],
                    reason: 'other',
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0027_tangtang_comboskill_waterbuff',
                    target: 'partyExceptCaster',
                    finishByAction: true,
                    onActionEndBuffs: [
                      {
                        buffId: 'buff_chr_0027_tangtang_comboskill_waterbuff_outaura',
                        target: 'partyExceptCaster',
                        inheritSourceSkillCastInfo: true,
                        blackboardAssignments: {
                          duration_talent1buff: { kind: 'blackboard', key: 'duration_talent1buff' },
                          ratio_speed: { kind: 'blackboard', key: 'ratio_speed' },
                        },
                      },
                    ],
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      ratio_speed: { kind: 'blackboard', key: 'ratio_speed' },
                    },
                  }),
                ),
              ),
            ),
            1500,
          ),
        ],
      },
    },
    abilityentity_chr_0027_tangtang_ultskill: {
      bornTags: [
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Category/EnergyShard/Pulse',
        'Skill/Character/chr_0027_tangtang/UltSkillWater',
      ],
      lifetime: { kind: 'limited', durationSeconds: 10 },
      childSkill: {
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
          duration: 12,
          duration_spellvulnerable: 0,
          duration_talent1buff: 3,
          max_stack: 0,
          poise1: 0,
          poise2: 0,
          poise3: 0,
          potential_5_CrystDamageIncrease: 0,
          potential1: 0,
          potential3_rate_spellvulnerable: 0,
          potential4: 0,
          potential5: 0,
          potential5_duration: 0,
          rate_spellvulnerable: 0,
          rate_spellvulnerable_02: 0,
          rate_vul_base: 0,
          ratio_speed: 0,
          ratio_speedreduction: 0.8,
          talent1_speed: 0,
          talent2: 0,
          talent2_ultskill: 0,
          tomado_atk_scale01: 0,
          tomado_atk_scale02: 0,
          tomado_atk_scale03: 0,
          water_cnt: 0,
          potential3: 0,
        },
        scheduledSequences: [
          scheduled(
            0,
            sequence(
              repeatEachTick(
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'cryo',
                      attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                    },
                    'abilityentity_chr_0027_tangtang_ultskill:chr_0027_tangtang_ultimate_skill_1:/childSkill/scheduledSequences/0/sequence/steps/0/body/steps/0',
                  ),
                ),
                {
                  nativeChanneling: {
                    executeEachFrame: true,
                    triggerIntervalSeconds: 0.033,
                    maxCountPerTarget: 8,
                    targetTriggerIntervalSeconds: 0.5,
                  },
                },
              ),
            ),
            120,
          ),
          scheduled(
            120,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'cryo',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  takeAttackSnapshot: true,
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise2' },
                },
                'abilityentity_chr_0027_tangtang_ultskill:chr_0027_tangtang_ultimate_skill_1:/childSkill/scheduledSequences/1/sequence/steps/0',
              ),
            ),
            123,
          ),
          scheduled(
            133,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'cryo',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_3' },
                  takeAttackSnapshot: true,
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise3' },
                },
                'abilityentity_chr_0027_tangtang_ultskill:chr_0027_tangtang_ultimate_skill_1:/childSkill/scheduledSequences/2/sequence/steps/0',
              ),
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.15 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_hard_stop' },
                finishByAction: false,
                targets: ['controlled'],
              }),
            ),
            136,
          ),
          scheduled(
            0,
            sequence(
              step('createAbilityEntityTimedMarker', {
                markerId: 'tangtang_ult',
                durationSeconds: { kind: 'constant', value: 4 },
                autoFinishByAction: true,
                timeDomain: 'self',
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0027_tangtang_ultskill_debuff',
                target: 'enemy',
                finishByAction: true,
                iconDurationSource: { kind: 'actionOwnerTimedMarker', markerId: 'tangtang_ult' },
                inheritSourceSkillCastInfo: true,
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0027_tangtang_ultskill_buff',
                target: 'partyExceptCaster',
                source: 'currentAbilityEntity',
                finishByAction: true,
                iconDurationSource: { kind: 'actionOwnerTimedMarker', markerId: 'tangtang_ult' },
                inheritSourceSkillCastInfo: true,
              }),
            ),
            121,
          ),
          scheduled(
            128,
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'potential3', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('calculateActionValue', {
                    key: 'potential3_rate_spellvulnerable',
                    operation: 'add',
                    left: { kind: 'blackboard', key: 'potential3_rate_spellvulnerable' },
                    right: { kind: 'blackboard', key: 'rate_vul_base' },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0027_tangtang_ultskill_debuff',
                    target: 'enemy',
                    finishByAction: true,
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0027_tangtang_ultskill_debuff',
                    target: 'enemy',
                    finishByAction: true,
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
                { alwaysNext: true },
              ),
            ),
            136,
          ),
          scheduled(
            128,
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'talent2', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0027_tangtang_ultskill_waterwake',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: {
                      talent2_ultskill: 'talent2_ultskill',
                      dmg_up_water_ult: 'dmg_up_water_ult',
                      rate_spellvulnerable: 'rate_spellvulnerable',
                      rate_spellvulnerable_02: 'rate_spellvulnerable_02',
                      duration_spellvulnerable: 'duration_spellvulnerable',
                    },
                  }),
                ),
              ),
            ),
            128,
          ),
          scheduled(127, sequence(step('finishTimeline', {})), 128),
          scheduled(
            0,
            sequence(
              step('listenForCombatEvents', {
                responses: [
                  {
                    key: 'SkillData.chr_0027_tangtang_ultimate_skill_1.actionGroupData.timelineActions[12]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                    event: { kind: 'abilityEvent', event: 'outputBuff' },
                    phase: 'dataAction',
                    priority: 0,
                    sequence: sequence(
                      branch(
                        {
                          kind: 'buffIdStackCompare',
                          target: 'controlledOperator',
                          buffIds: ['buff_chr_0027_tangtang_ultskill_buff_damage'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                        sequence(step('jumpTimeline', { destinationFrame: 128 })),
                      ),
                    ),
                  },
                ],
              }),
            ),
            119,
          ),
          scheduled(127, sequence(step('finishActionOwnerAbilityEntity', {})), 128),
          scheduled(156, sequence(step('finishActionOwnerAbilityEntity', {})), 157),
        ],
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_03: {
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
            atb: 0,
            atk_scale_1: 0,
            atk_scale_2: 0,
            dmg_up_water_ult: 0.3,
            duration: 5,
            duration_spellvulnerable: 10,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 3,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            potential3: 0,
            potential5: 0,
            rate_spellvulnerable: 0.05,
            rate_spellvulnerable_02: 0.1,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
            tornado_atk_scale02: 0,
            tornado_atk_scale03: 0,
          },
          scheduledSequences: [
            scheduled(
              0,
              sequence(
                repeatEachTick(
                  sequence(
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                        operator: 'less',
                        value: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                        sameSourceSkillCast: true,
                      },
                      sequence(
                        step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                        step('applyBuff', {
                          buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction',
                          target: 'enemy',
                          inheritSourceSkillCastInfo: true,
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                        operator: 'less',
                        value: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                        sameSourceSkillCast: true,
                      },
                      sequence(
                        step('applyBuff', {
                          buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                          target: 'enemy',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: {
                            duration_spellvulnerable: 'duration_spellvulnerable',
                            rate_spellvulnerable: 'rate_spellvulnerable_02',
                          },
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                        operator: 'greaterOrEqual',
                        right: { kind: 'constant', value: 1 },
                      },
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'cryo',
                            attackScale: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                            takeAttackSnapshot: true,
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            instantDamageScaleModifiers: [
                              {
                                side: 'attacker',
                                zone: 'normal',
                                addition: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                              },
                            ],
                            stagger: { kind: 'blackboard', key: 'poise_tornado' },
                          },
                          'abilityentity_chr_0027_tangtang_normal_skill_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/scheduledSequences/0/sequence/steps/0/body/steps/2/whenTrue/steps/0',
                        ),
                      ),
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'cryo',
                            attackScale: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                            takeAttackSnapshot: true,
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'blackboard', key: 'poise_tornado' },
                          },
                          'abilityentity_chr_0027_tangtang_normal_skill_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/scheduledSequences/0/sequence/steps/0/body/steps/2/whenFalse/steps/0',
                        ),
                      ),
                      { alwaysNext: true },
                    ),
                  ),
                  {
                    nativeChanneling: {
                      executeEachFrame: false,
                      triggerIntervalSeconds: 0.26,
                      maxCountPerTarget: -1,
                      targetTriggerIntervalSeconds: -1,
                    },
                  },
                ),
              ),
              90,
            ),
            scheduled(90, sequence(step('finishActionOwnerAbilityEntity', {})), 90),
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
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
            scheduled(
              0,
              sequence(
                step(
                  'dealDamage',
                  {
                    damageType: 'cryo',
                    attackScale: { kind: 'blackboard', key: 'atk_scale' },
                    tags: ['normalSkill'],
                    stagger: { kind: 'blackboard', key: 'poise' },
                  },
                  'abilityentity_chr_0027_tangtang_normal_skill_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/scheduledSequences/0/sequence/steps/0',
                ),
                step('applyBuff', {
                  buffId: 'buff_common_obtain_ultimate_sp',
                  target: 'caster',
                  inheritSourceSkillCastInfo: true,
                }),
                branch(
                  {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'tar',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                  },
                  sequence(
                    step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                    step('finishBuffsById', {
                      target: 'enemy',
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    }),
                  ),
                ),
              ),
              0,
            ),
          ],
        },
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_03_02: {
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
            atb: 0,
            atk_scale_1: 0,
            atk_scale_2: 0,
            dmg_up_water_ult: 0.3,
            duration: 5,
            duration_spellvulnerable: 10,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 3,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            potential3: 0,
            potential5: 0,
            rate_spellvulnerable: 0.05,
            rate_spellvulnerable_02: 0.1,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
            tornado_atk_scale02: 0,
            tornado_atk_scale03: 0,
          },
          scheduledSequences: [
            scheduled(
              0,
              sequence(
                repeatEachTick(
                  sequence(
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                        operator: 'less',
                        value: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                        sameSourceSkillCast: true,
                      },
                      sequence(
                        step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                        step('applyBuff', {
                          buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction',
                          target: 'enemy',
                          inheritSourceSkillCastInfo: true,
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                        operator: 'less',
                        value: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                        sameSourceSkillCast: true,
                      },
                      sequence(
                        step('applyBuff', {
                          buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                          target: 'enemy',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: {
                            duration_spellvulnerable: 'duration_spellvulnerable',
                            rate_spellvulnerable: 'rate_spellvulnerable_02',
                          },
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                        operator: 'greaterOrEqual',
                        right: { kind: 'constant', value: 1 },
                      },
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'cryo',
                            attackScale: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                            takeAttackSnapshot: true,
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            instantDamageScaleModifiers: [
                              {
                                side: 'attacker',
                                zone: 'normal',
                                addition: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                              },
                            ],
                            stagger: { kind: 'blackboard', key: 'poise_tornado' },
                          },
                          'abilityentity_chr_0027_tangtang_normal_skill_03_02:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/scheduledSequences/0/sequence/steps/0/body/steps/2/whenTrue/steps/0',
                        ),
                      ),
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'cryo',
                            attackScale: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                            takeAttackSnapshot: true,
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'blackboard', key: 'poise_tornado' },
                          },
                          'abilityentity_chr_0027_tangtang_normal_skill_03_02:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/scheduledSequences/0/sequence/steps/0/body/steps/2/whenFalse/steps/0',
                        ),
                      ),
                      { alwaysNext: true },
                    ),
                  ),
                  {
                    nativeChanneling: {
                      executeEachFrame: false,
                      triggerIntervalSeconds: 0.26,
                      maxCountPerTarget: -1,
                      targetTriggerIntervalSeconds: -1,
                    },
                  },
                ),
              ),
              90,
            ),
            scheduled(90, sequence(step('finishActionOwnerAbilityEntity', {})), 90),
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
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
            scheduled(
              0,
              sequence(
                step(
                  'dealDamage',
                  {
                    damageType: 'cryo',
                    attackScale: { kind: 'blackboard', key: 'atk_scale' },
                    tags: ['normalSkill'],
                    stagger: { kind: 'blackboard', key: 'poise' },
                  },
                  'abilityentity_chr_0027_tangtang_normal_skill_03_02:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/scheduledSequences/0/sequence/steps/0',
                ),
                step('applyBuff', {
                  buffId: 'buff_common_obtain_ultimate_sp',
                  target: 'caster',
                  inheritSourceSkillCastInfo: true,
                }),
                branch(
                  {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'tar',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                  },
                  sequence(
                    step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                    step('finishBuffsById', {
                      target: 'enemy',
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    }),
                  ),
                ),
              ),
              0,
            ),
          ],
        },
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_03_03: {
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
            atb: 0,
            atk_scale_1: 0,
            atk_scale_2: 0,
            dmg_up_water_ult: 0.3,
            duration: 5,
            duration_spellvulnerable: 10,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 3,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            potential3: 0,
            potential5: 0,
            rate_spellvulnerable: 0.05,
            rate_spellvulnerable_02: 0.1,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
            tornado_atk_scale02: 0,
            tornado_atk_scale03: 0,
          },
          scheduledSequences: [
            scheduled(
              0,
              sequence(
                repeatEachTick(
                  sequence(
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                        operator: 'less',
                        value: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                        sameSourceSkillCast: true,
                      },
                      sequence(
                        step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                        step('applyBuff', {
                          buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction',
                          target: 'enemy',
                          inheritSourceSkillCastInfo: true,
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                        operator: 'less',
                        value: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                        sameSourceSkillCast: true,
                      },
                      sequence(
                        step('applyBuff', {
                          buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                          target: 'enemy',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: {
                            duration_spellvulnerable: 'duration_spellvulnerable',
                            rate_spellvulnerable: 'rate_spellvulnerable_02',
                          },
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                        operator: 'greaterOrEqual',
                        right: { kind: 'constant', value: 1 },
                      },
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'cryo',
                            attackScale: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                            takeAttackSnapshot: true,
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            instantDamageScaleModifiers: [
                              {
                                side: 'attacker',
                                zone: 'normal',
                                addition: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                              },
                            ],
                            stagger: { kind: 'blackboard', key: 'poise_tornado' },
                          },
                          'abilityentity_chr_0027_tangtang_normal_skill_03_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/scheduledSequences/0/sequence/steps/0/body/steps/2/whenTrue/steps/0',
                        ),
                      ),
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'cryo',
                            attackScale: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                            takeAttackSnapshot: true,
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'blackboard', key: 'poise_tornado' },
                          },
                          'abilityentity_chr_0027_tangtang_normal_skill_03_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_2/scheduledSequences/0/sequence/steps/0/body/steps/2/whenFalse/steps/0',
                        ),
                      ),
                      { alwaysNext: true },
                    ),
                  ),
                  {
                    nativeChanneling: {
                      executeEachFrame: false,
                      triggerIntervalSeconds: 0.26,
                      maxCountPerTarget: -1,
                      targetTriggerIntervalSeconds: -1,
                    },
                  },
                ),
              ),
              90,
            ),
            scheduled(90, sequence(step('finishActionOwnerAbilityEntity', {})), 90),
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
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
            scheduled(
              0,
              sequence(
                step(
                  'dealDamage',
                  {
                    damageType: 'cryo',
                    attackScale: { kind: 'blackboard', key: 'atk_scale' },
                    tags: ['normalSkill'],
                    stagger: { kind: 'blackboard', key: 'poise' },
                  },
                  'abilityentity_chr_0027_tangtang_normal_skill_03_03:chr_0027_tangtang_normal_skill_water_projhit_2|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/scheduledSequences/0/sequence/steps/0',
                ),
                step('applyBuff', {
                  buffId: 'buff_common_obtain_ultimate_sp',
                  target: 'caster',
                  inheritSourceSkillCastInfo: true,
                }),
                branch(
                  {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'tar',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                  },
                  sequence(
                    step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                    step('finishBuffsById', {
                      target: 'enemy',
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    }),
                  ),
                ),
              ),
              0,
            ),
          ],
        },
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_02: {
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
            atb: 0,
            atk_scale_1: 0,
            atk_scale_2: 0.2,
            dmg_up_water_ult: 0,
            duration: 5,
            duration_spellvulnerable: 10,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 3,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            potential3: 0,
            potential5: 0,
            rate_spellvulnerable: 0.05,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
            tornado_atk_scale02: 0,
            tornado_atk_scale03: 0,
          },
          scheduledSequences: [
            scheduled(
              0,
              sequence(
                repeatEachTick(
                  sequence(
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                        operator: 'less',
                        value: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                        sameSourceSkillCast: true,
                      },
                      sequence(
                        step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                        step('applyBuff', {
                          buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction',
                          target: 'enemy',
                          inheritSourceSkillCastInfo: true,
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                        operator: 'less',
                        value: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                        sameSourceSkillCast: true,
                      },
                      sequence(
                        step('applyBuff', {
                          buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                          target: 'enemy',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: {
                            duration_spellvulnerable: 'duration_spellvulnerable',
                            rate_spellvulnerable: 'rate_spellvulnerable',
                          },
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                        operator: 'greaterOrEqual',
                        right: { kind: 'constant', value: 1 },
                      },
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'cryo',
                            attackScale: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                            takeAttackSnapshot: true,
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            instantDamageScaleModifiers: [
                              {
                                side: 'attacker',
                                zone: 'normal',
                                addition: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                              },
                            ],
                            stagger: { kind: 'blackboard', key: 'poise_tornado' },
                          },
                          'abilityentity_chr_0027_tangtang_normal_skill_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_1/scheduledSequences/0/sequence/steps/0/body/steps/2/whenTrue/steps/0',
                        ),
                      ),
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'cryo',
                            attackScale: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                            takeAttackSnapshot: true,
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'blackboard', key: 'poise_tornado' },
                          },
                          'abilityentity_chr_0027_tangtang_normal_skill_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_1/scheduledSequences/0/sequence/steps/0/body/steps/2/whenFalse/steps/0',
                        ),
                      ),
                      { alwaysNext: true },
                    ),
                  ),
                  {
                    nativeChanneling: {
                      executeEachFrame: false,
                      triggerIntervalSeconds: 0.26,
                      maxCountPerTarget: -1,
                      targetTriggerIntervalSeconds: -1,
                    },
                  },
                ),
              ),
              90,
            ),
            scheduled(90, sequence(step('finishActionOwnerAbilityEntity', {})), 90),
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
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
            scheduled(
              0,
              sequence(
                step(
                  'dealDamage',
                  {
                    damageType: 'cryo',
                    attackScale: { kind: 'blackboard', key: 'atk_scale' },
                    tags: ['normalSkill'],
                    stagger: { kind: 'blackboard', key: 'poise' },
                  },
                  'abilityentity_chr_0027_tangtang_normal_skill_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/scheduledSequences/0/sequence/steps/0',
                ),
                step('applyBuff', {
                  buffId: 'buff_common_obtain_ultimate_sp',
                  target: 'caster',
                  inheritSourceSkillCastInfo: true,
                }),
                branch(
                  {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'tar',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                  },
                  sequence(
                    step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                    step('finishBuffsById', {
                      target: 'enemy',
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    }),
                  ),
                ),
              ),
              0,
            ),
          ],
        },
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill_02_02: {
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
            atb: 0,
            atk_scale_1: 0,
            atk_scale_2: 0.2,
            dmg_up_water_ult: 0,
            duration: 5,
            duration_spellvulnerable: 10,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 3,
            hit_spelllnflictionmax02: 1,
            hit_spellvulnerablemax: 1,
            poise_tornado: 0,
            potential3: 0,
            potential5: 0,
            rate_spellvulnerable: 0.05,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
            tornado_atk_scale02: 0,
            tornado_atk_scale03: 0,
          },
          scheduledSequences: [
            scheduled(
              0,
              sequence(
                repeatEachTick(
                  sequence(
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                        operator: 'less',
                        value: { kind: 'blackboard', key: 'hit_spelllnflictionmax02' },
                        sameSourceSkillCast: true,
                      },
                      sequence(
                        step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                        step('applyBuff', {
                          buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction',
                          target: 'enemy',
                          inheritSourceSkillCastInfo: true,
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_chr_0027_tangtang_normalskill_spellvulnerable'],
                        operator: 'less',
                        value: { kind: 'blackboard', key: 'hit_spellvulnerablemax' },
                        sameSourceSkillCast: true,
                      },
                      sequence(
                        step('applyBuff', {
                          buffId: 'buff_chr_0027_tangtang_normalskill_spellvulnerable',
                          target: 'enemy',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: {
                            duration_spellvulnerable: 'duration_spellvulnerable',
                            rate_spellvulnerable: 'rate_spellvulnerable',
                          },
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                        operator: 'greaterOrEqual',
                        right: { kind: 'constant', value: 1 },
                      },
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'cryo',
                            attackScale: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                            takeAttackSnapshot: true,
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            instantDamageScaleModifiers: [
                              {
                                side: 'attacker',
                                zone: 'normal',
                                addition: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                              },
                            ],
                            stagger: { kind: 'blackboard', key: 'poise_tornado' },
                          },
                          'abilityentity_chr_0027_tangtang_normal_skill_02_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_1/scheduledSequences/0/sequence/steps/0/body/steps/2/whenTrue/steps/0',
                        ),
                      ),
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'cryo',
                            attackScale: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                            takeAttackSnapshot: true,
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'blackboard', key: 'poise_tornado' },
                          },
                          'abilityentity_chr_0027_tangtang_normal_skill_02_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit_1/scheduledSequences/0/sequence/steps/0/body/steps/2/whenFalse/steps/0',
                        ),
                      ),
                      { alwaysNext: true },
                    ),
                  ),
                  {
                    nativeChanneling: {
                      executeEachFrame: false,
                      triggerIntervalSeconds: 0.26,
                      maxCountPerTarget: -1,
                      targetTriggerIntervalSeconds: -1,
                    },
                  },
                ),
              ),
              90,
            ),
            scheduled(90, sequence(step('finishActionOwnerAbilityEntity', {})), 90),
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
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
            scheduled(
              0,
              sequence(
                step(
                  'dealDamage',
                  {
                    damageType: 'cryo',
                    attackScale: { kind: 'blackboard', key: 'atk_scale' },
                    tags: ['normalSkill'],
                    stagger: { kind: 'blackboard', key: 'poise' },
                  },
                  'abilityentity_chr_0027_tangtang_normal_skill_02_02:chr_0027_tangtang_normal_skill_water_projhit_1|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/scheduledSequences/0/sequence/steps/0',
                ),
                step('applyBuff', {
                  buffId: 'buff_common_obtain_ultimate_sp',
                  target: 'caster',
                  inheritSourceSkillCastInfo: true,
                }),
                branch(
                  {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'tar',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                  },
                  sequence(
                    step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                    step('finishBuffsById', {
                      target: 'enemy',
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    }),
                  ),
                ),
              ),
              0,
            ),
          ],
        },
      },
    },
    abilityentity_chr_0027_tangtang_normal_skill: {
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
            atb: 0,
            atk_scale_1: 0,
            atk_scale_2: 0,
            atk_water: 0,
            dmg_up_water_ult: 0.3,
            duration: 5,
            hit_cnt: 4,
            hit_cntmax: 10,
            hit_duration: 5,
            hit_spelllnflictionmax_01: 1,
            poise_tornado: 0,
            potential3: 0,
            potential5: 0,
            talent2: 0,
            talent2_ultskill: 0,
            tornado_atk_scale01: 0,
          },
          scheduledSequences: [
            scheduled(
              0,
              sequence(
                repeatEachTick(
                  sequence(
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_chr_0027_tangtang_comboskill_spelllnfliction'],
                        operator: 'less',
                        value: { kind: 'blackboard', key: 'hit_spelllnflictionmax_01' },
                        sameSourceSkillCast: true,
                      },
                      sequence(
                        step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                        step('applyBuff', {
                          buffId: 'buff_chr_0027_tangtang_comboskill_spelllnfliction',
                          target: 'enemy',
                          inheritSourceSkillCastInfo: true,
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'talent2_ultskill', fallback: 0 },
                        operator: 'greaterOrEqual',
                        right: { kind: 'constant', value: 1 },
                      },
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'cryo',
                            attackScale: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                            takeAttackSnapshot: true,
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            instantDamageScaleModifiers: [
                              {
                                side: 'attacker',
                                zone: 'normal',
                                addition: { kind: 'blackboard', key: 'dmg_up_water_ult' },
                              },
                            ],
                            stagger: { kind: 'blackboard', key: 'poise_tornado' },
                          },
                          'abilityentity_chr_0027_tangtang_normal_skill:chr_0027_tangtang_normal_skill_water_projhit|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit/scheduledSequences/0/sequence/steps/0/body/steps/1/whenTrue/steps/0',
                        ),
                      ),
                      sequence(
                        step(
                          'dealDamage',
                          {
                            damageType: 'cryo',
                            attackScale: { kind: 'blackboard', key: 'tornado_atk_scale01' },
                            takeAttackSnapshot: true,
                            tags: ['normalSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'blackboard', key: 'poise_tornado' },
                          },
                          'abilityentity_chr_0027_tangtang_normal_skill:chr_0027_tangtang_normal_skill_water_projhit|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_water_projhit/scheduledSequences/0/sequence/steps/0/body/steps/1/whenFalse/steps/0',
                        ),
                      ),
                      { alwaysNext: true },
                    ),
                  ),
                  {
                    nativeChanneling: {
                      executeEachFrame: false,
                      triggerIntervalSeconds: 0.26,
                      maxCountPerTarget: -1,
                      targetTriggerIntervalSeconds: -1,
                    },
                  },
                ),
              ),
              90,
            ),
            scheduled(90, sequence(step('finishActionOwnerAbilityEntity', {})), 90),
          ],
        },
        chr_0027_tangtang_normal_skill_projhit: {
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
            scheduled(
              0,
              sequence(
                step(
                  'dealDamage',
                  {
                    damageType: 'cryo',
                    attackScale: { kind: 'blackboard', key: 'atk_scale' },
                    tags: ['normalSkill'],
                    stagger: { kind: 'blackboard', key: 'poise' },
                  },
                  'abilityentity_chr_0027_tangtang_normal_skill:chr_0027_tangtang_normal_skill_water_projhit|chr_0027_tangtang_normal_skill_projhit:/childSkills/chr_0027_tangtang_normal_skill_projhit/scheduledSequences/0/sequence/steps/0',
                ),
                step('applyBuff', {
                  buffId: 'buff_common_obtain_ultimate_sp',
                  target: 'caster',
                  inheritSourceSkillCastInfo: true,
                }),
                branch(
                  {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'tar',
                    buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 5 },
                  },
                  sequence(
                    step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                    step('finishBuffsById', {
                      target: 'enemy',
                      buffIds: ['buff_chr_0027_tangtang_comboskill_hit'],
                      reason: 'other',
                      count: { kind: 'constant', value: 5 },
                    }),
                  ),
                ),
              ),
              0,
            ),
          ],
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default tangtang;
