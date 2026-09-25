/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type {
  ActionSequenceDefinition,
  OperatorDefinition,
  SkillDefinition,
} from '../../core/game-data/operatorDefinition';
import {
  branch,
  instantiateActionSequence,
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withActionBlackboardScope,
  withSkillBlackboard,
} from './definitionHelpers';

const sharedActionSequence2: ActionSequenceDefinition = sequence({
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
        skillId: 'chr_0013_aglina_attack2_projhit',
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
          scheduled(
            0,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                '\u0000endaxis-generated-identity:0',
              ),
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
            3,
          ),
        ],
      },
    },
  ],
});

const sharedActionSequence4: ActionSequenceDefinition = sequence({
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
        skillId: 'chr_0013_aglina_attack3_projhit',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 1,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {},
        scheduledSequences: [
          scheduled(
            0,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                '\u0000endaxis-generated-identity:0',
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
                        coefficient: { kind: 'constant', value: 0.3333333 },
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
});

const sharedActionSequence1: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    instantiateActionSequence(sharedActionSequence2, ['\u0000endaxis-generated-identity:1']),
    {},
    { lifetime: 'execution' },
  ),
);

const sharedActionSequence6: ActionSequenceDefinition = sequence({
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
        skillId: 'chr_0013_aglina_attack4_projhit_2',
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
          scheduled(
            0,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                  staggerMultiplier: { kind: 'constant', value: 0.33 },
                  staggerOnlyWhenCasterControlled: true,
                },
                '\u0000endaxis-generated-identity:0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('changeResourceByActionValue', {
                    resource: 'sp',
                    amount: { kind: 'blackboard', key: 'atb' },
                    coefficient: { kind: 'constant', value: 0.3334 },
                    recipient: 'team',
                    spGainKind: 'gain',
                    spGainSource: 'normalAttack',
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
            ),
            3,
          ),
          scheduled(0, sequence(), 3),
        ],
      },
    },
  ],
});

const sharedActionSequence3: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    instantiateActionSequence(sharedActionSequence4, ['\u0000endaxis-generated-identity:1']),
    {},
    { lifetime: 'execution' },
  ),
);

const sharedActionSequence5: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    instantiateActionSequence(sharedActionSequence6, ['\u0000endaxis-generated-identity:1']),
    {},
    { lifetime: 'execution' },
  ),
);

export const gilbertaChr_0013_aglina_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0013_aglina_attack1',
    timelineBlockFrames: 18,
    naturalDurationFrames: 91,
    exclusiveFrame: 30,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 30,
          input: 'basicAttack',
          targetSkillId: 'chr_0013_aglina_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 18, endFrame: 30, skillIds: ['chr_0013_aglina_attack2'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        7,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0013_aglina_attack1.actionGroupData.timelineActions[1]._sequenceActionData.actionData[1]:projectile_chr_0013_aglina_normal_attack1',
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
                    skillId: 'chr_0013_aglina_attack1_projhit',
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'nature',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0013_aglina_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
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
                                    coefficient: { kind: 'constant', value: 1 },
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
        7,
      ),
      scheduled(
        18,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0013_aglina_attack2'] })),
        30,
      ),
    ],
    timelineContinuationSkillId: 'chr_0013_aglina_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
    display_atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
  },
);

export const gilbertaChr_0013_aglina_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0013_aglina_attack2',
    timelineBlockFrames: 22,
    naturalDurationFrames: 118,
    exclusiveFrame: 30,
    offsetRecordFrame: 4,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 29,
          input: 'basicAttack',
          targetSkillId: 'chr_0013_aglina_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 22, endFrame: 29, skillIds: ['chr_0013_aglina_attack3'] }],
    },
    costFrame: 11,
    scheduledSequences: [
      scheduled(
        4,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0013_aglina_attack2.actionGroupData.timelineActions[1]._sequenceActionData.actionData[1]:projectile_chr_0013_aglina_normal_attack2',
          'chr_0013_aglina_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        4,
      ),
      scheduled(
        8,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0013_aglina_attack2.actionGroupData.timelineActions[2]._sequenceActionData.actionData[0]:projectile_chr_0013_aglina_normal_attack2',
          'chr_0013_aglina_attack2:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        8,
      ),
      scheduled(
        22,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0013_aglina_attack3'] })),
        29,
      ),
    ],
    timelineContinuationSkillId: 'chr_0013_aglina_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.18, 0.2, 0.22, 0.23, 0.25, 0.27, 0.29, 0.31, 0.32, 0.35, 0.37, 0.41],
    display_atk_scale: [0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81],
  },
);

export const gilbertaChr_0013_aglina_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0013_aglina_attack3',
    timelineBlockFrames: 23,
    naturalDurationFrames: 138,
    exclusiveFrame: 38,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 38,
          input: 'basicAttack',
          targetSkillId: 'chr_0013_aglina_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 23, endFrame: 38, skillIds: ['chr_0013_aglina_attack4'] }],
    },
    costFrame: 13,
    scheduledSequences: [
      scheduled(
        7,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0013_aglina_attack3.actionGroupData.timelineActions[1]._sequenceActionData.actionData[0]:projectile_chr_0013_aglina_normal_attack3',
          'chr_0013_aglina_attack3:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        8,
      ),
      scheduled(
        10,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0013_aglina_attack3.actionGroupData.timelineActions[2]._sequenceActionData.actionData[0]:projectile_chr_0013_aglina_normal_attack3',
          'chr_0013_aglina_attack3:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        11,
      ),
      scheduled(
        14,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0013_aglina_attack3.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:projectile_chr_0013_aglina_normal_attack3',
          'chr_0013_aglina_attack3:/scheduledSequences/2/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        15,
      ),
      scheduled(
        23,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0013_aglina_attack4'] })),
        38,
      ),
    ],
    timelineContinuationSkillId: 'chr_0013_aglina_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.14, 0.15, 0.16, 0.18, 0.19, 0.2, 0.22, 0.23, 0.24, 0.26, 0.28, 0.3],
    display_atk_scale: [0.41, 0.45, 0.49, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.78, 0.84, 0.91],
  },
);

export const gilbertaChr_0013_aglina_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0013_aglina_attack4',
    timelineBlockFrames: 40,
    naturalDurationFrames: 147,
    exclusiveFrame: 50,
    offsetRecordFrame: 23,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 50,
          input: 'basicAttack',
          targetSkillId: 'chr_0013_aglina_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 40, endFrame: 50, skillIds: ['chr_0013_aglina_attack1'] }],
    },
    costFrame: 13,
    scheduledSequences: [
      scheduled(
        23,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0013_aglina_attack4.actionGroupData.timelineActions[1]._sequenceActionData.actionData[1]:projectile_chr_0013_aglina_normal_attack4',
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
                    skillId: 'chr_0013_aglina_attack4_projhit',
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
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'nature',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack', 'normalAttackLastCombo'],
                              stagger: { kind: 'blackboard', key: 'poise' },
                              staggerMultiplier: { kind: 'constant', value: 0.34 },
                              staggerOnlyWhenCasterControlled: true,
                            },
                            'chr_0013_aglina_attack4:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                          branch(
                            { kind: 'casterControlled' },
                            sequence(
                              step('changeResourceByActionValue', {
                                resource: 'sp',
                                amount: { kind: 'blackboard', key: 'atb' },
                                coefficient: { kind: 'constant', value: 0.3334 },
                                recipient: 'team',
                                spGainKind: 'gain',
                                spGainSource: 'normalAttack',
                              }),
                            ),
                            undefined,
                            { alwaysNext: true },
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
        23,
      ),
      scheduled(
        25,
        instantiateActionSequence(sharedActionSequence5, [
          'SkillData.chr_0013_aglina_attack4.actionGroupData.timelineActions[2]._sequenceActionData.actionData[1]:projectile_chr_0013_aglina_normal_attack4_2',
          'chr_0013_aglina_attack4:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        25,
      ),
      scheduled(
        27,
        instantiateActionSequence(sharedActionSequence5, [
          'SkillData.chr_0013_aglina_attack4.actionGroupData.timelineActions[3]._sequenceActionData.actionData[1]:projectile_chr_0013_aglina_normal_attack4_1',
          'chr_0013_aglina_attack4:/scheduledSequences/2/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        27,
      ),
      scheduled(
        40,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0013_aglina_attack1'] })),
        50,
      ),
    ],
    timelineContinuationSkillId: 'chr_0013_aglina_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 16,
    atk_scale: [0.17, 0.18, 0.2, 0.22, 0.23, 0.25, 0.27, 0.28, 0.3, 0.32, 0.35, 0.37],
    display_atk_scale: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.96, 1.04, 1.12],
    poise: 16,
  },
);

export const gilbertaChr_0013_aglina_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0013_aglina_power_attack',
    timelineBlockFrames: 43,
    naturalDurationFrames: 125,
    exclusiveFrame: 50,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 43,
          endFrame: 50,
          skillIds: ['chr_0013_aglina_normal_skill', 'chr_0013_aglina_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        12,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.05,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0013_aglina_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
        ),
        12,
      ),
      scheduled(
        15,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.05,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0013_aglina_power_attack:/scheduledSequences/1/sequence/steps/0',
          ),
        ),
        15,
      ),
      scheduled(
        18,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.05,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0013_aglina_power_attack:/scheduledSequences/2/sequence/steps/0',
          ),
        ),
        18,
      ),
      scheduled(
        21,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.05,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0013_aglina_power_attack:/scheduledSequences/3/sequence/steps/0',
          ),
        ),
        21,
      ),
      scheduled(
        24,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.05,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0013_aglina_power_attack:/scheduledSequences/4/sequence/steps/0',
          ),
        ),
        24,
      ),
      scheduled(
        29,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.05,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0013_aglina_power_attack:/scheduledSequences/5/sequence/steps/0',
          ),
        ),
        29,
      ),
      scheduled(
        43,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.7,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0013_aglina_power_attack:/scheduledSequences/6/sequence/steps/0',
          ),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
        ),
        52,
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
        50,
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
        43,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const gilbertaChr_0013_aglina_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0013_aglina_plunging_attack_end',
    timelineBlockFrames: 21,
    naturalDurationFrames: 94,
    exclusiveFrame: 20,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'plungingAttack'],
            },
            'chr_0013_aglina_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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
                    coefficient: { kind: 'constant', value: 1 },
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
        5,
      ),
    ],
    skillType: 'plungingAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
);

export const gilbertaChr_0013_aglina_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0013_aglina_normal_skill',
    timelineBlockFrames: 136,
    naturalDurationFrames: 203,
    exclusiveFrame: 135,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 123, endFrame: 148, skillIds: ['chr_0013_aglina_combo_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'radius',
                operation: 'assign',
                value: { kind: 'constant', value: 6.3 },
              }),
            ),
            sequence(
              step('modifyActionValue', {
                key: 'radius',
                operation: 'assign',
                value: { kind: 'constant', value: 5.2 },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        3,
      ),
      scheduled(
        21,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0013_aglina_normal_skill',
            childSkillId: 'chr_0013_aglina_normal_skill_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
        ),
        21,
      ),
      scheduled(
        29,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale_pull' },
              tags: ['normalSkill'],
            },
            'chr_0013_aglina_normal_skill:/scheduledSequences/2/sequence/steps/0',
          ),
          step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
        ),
        30,
      ),
      scheduled(
        46,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale_pull' },
              tags: ['normalSkill'],
            },
            'chr_0013_aglina_normal_skill:/scheduledSequences/3/sequence/steps/0',
          ),
        ),
        46,
      ),
      scheduled(
        62,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale_pull' },
              tags: ['normalSkill'],
            },
            'chr_0013_aglina_normal_skill:/scheduledSequences/4/sequence/steps/0',
          ),
        ),
        62,
      ),
      scheduled(
        78,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale_pull' },
              tags: ['normalSkill'],
            },
            'chr_0013_aglina_normal_skill:/scheduledSequences/5/sequence/steps/0',
          ),
        ),
        78,
      ),
      scheduled(
        108,
        sequence(
          step('applyElementalInfliction', { element: 'nature', isExtra: false }),
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale_explosion' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0013_aglina_normal_skill:/scheduledSequences/6/sequence/steps/1',
          ),
          branch(
            {
              kind: 'all',
              conditions: [
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'heal_const', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                { kind: 'constant', value: false },
              ],
            },
            sequence(
              branch(
                {
                  kind: 'healthCompare',
                  target: 'controlledOperator',
                  valueType: 'ratio',
                  operator: 'less',
                  value: { kind: 'constant', value: 0.99 },
                },
                sequence(
                  step('heal', {
                    target: 'controlledOperator',
                    alwaysNext: true,
                    tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
                    attribute: 'intellect',
                    multiplier: { kind: 'blackboard', key: 'heal_scale' },
                    addition: { kind: 'blackboard', key: 'heal_const' },
                  }),
                ),
                sequence(
                  step('findCharacterTeamTargets', {
                    saveToContextKey: 'CureTarget',
                    selection: { kind: 'lowestHealthRatioOperator' },
                  }),
                  branch(
                    {
                      kind: 'healthCompare',
                      target: 'contextTarget',
                      contextKey: 'CureTarget',
                      valueType: 'ratio',
                      operator: 'less',
                      value: { kind: 'constant', value: 0.99 },
                    },
                    sequence(
                      step('heal', {
                        target: 'contextTarget',
                        contextKey: 'CureTarget',
                        alwaysNext: true,
                        tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
                        attribute: 'intellect',
                        multiplier: { kind: 'blackboard', key: 'heal_scale' },
                        addition: { kind: 'blackboard', key: 'heal_const' },
                      }),
                    ),
                    sequence(
                      step('heal', {
                        target: 'controlledOperator',
                        alwaysNext: true,
                        tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
                        attribute: 'intellect',
                        multiplier: { kind: 'blackboard', key: 'heal_scale' },
                        addition: { kind: 'blackboard', key: 'heal_const' },
                      }),
                    ),
                    { alwaysNext: true },
                  ),
                ),
                { alwaysNext: true },
              ),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        109,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atk_scale_explosion: [0.58, 0.63, 0.69, 0.75, 0.81, 0.86, 0.92, 0.98, 1.04, 1.11, 1.2, 1.3],
    atk_scale_pull: [0.24, 0.27, 0.29, 0.32, 0.34, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.55],
    cam_angle: 0,
    cam_duration: 0,
    heal_const: 0,
    heal_scale: 0,
    input_angle: 0,
    maxChargeTime: 0,
    poise: 10,
    potential: 0,
    radius: 5.2,
    radiusadd_display: 0,
    recovercost: 0,
    display_atk_scale_pull: [
      0.97, 1.07, 1.17, 1.26, 1.36, 1.46, 1.56, 1.65, 1.75, 1.87, 2.02, 2.19,
    ],
  },
);

export const gilbertaChr_0013_aglina_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0013_aglina_ultimate_skill',
    timelineBlockFrames: 86,
    naturalDurationFrames: 116,
    exclusiveFrame: 85,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 64,
          endFrame: 91,
          skillIds: ['chr_0013_aglina_normal_skill', 'chr_0013_aglina_combo_skill'],
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
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 53),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        52,
      ),
      scheduled(
        60,
        sequence(
          step('applyElementalInfliction', { element: 'nature', isExtra: false }),
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0013_aglina_ultimate_skill:/scheduledSequences/3/sequence/steps/1',
          ),
        ),
        60,
      ),
      scheduled(
        60,
        sequence(
          step('storeSourceAttributeValue', {
            attribute: { kind: 'specific', key: 'intellect' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'blackboard', key: 'wisd_increase' },
            base: { kind: 'blackboard', key: 'resistance_scalar' },
            targetKey: 'final_resistance_scalar',
          }),
          step('storeSourceAttributeValue', {
            attribute: { kind: 'specific', key: 'intellect' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'blackboard', key: 'wisd_increase_inair' },
            base: { kind: 'blackboard', key: 'resistance_scalar_inair' },
            targetKey: 'final_resistance_scalar_inair',
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0013_aglina_ultimate_skill',
            childSkillId: 'chr_0013_aglina_ultimate_skill_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'blackboard', key: 'duration' },
          }),
        ),
        65,
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
        85,
      ),
    ],
    cooldownFrames: 600,
    costs: [{ resource: 'ultimateEnergy', value: 90 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale: [3.33, 3.67, 4, 4.33, 4.67, 5, 5.34, 5.67, 6, 6.42, 6.92, 7.5],
    damage_scale: 0.5,
    duration: 5,
    final_resistance_scalar: 0,
    final_resistance_scalar_inair: 0,
    move_speed_scalar: 0.8,
    poise: 20,
    potential_lv: 0,
    potential2: 0,
    potential2_onceadd: 0,
    radius: 5,
    resistance_scalar: 0,
    resistance_scalar_inair: 0,
    select_radius: 10,
    spell_vulnerable_perstack: 0.1,
    spell_vulnerable_rate: [0.18, 0.18, 0.18, 0.22, 0.22, 0.22, 0.26, 0.26, 0.26, 0.3, 0.3, 0.3],
    wisd_increase: 0,
    wisd_increase_inair: 0,
    spell_vulnerable_4stack: [
      0.252, 0.252, 0.252, 0.308, 0.308, 0.308, 0.364, 0.364, 0.364, 0.42, 0.42, 0.42,
    ],
  },
);

export const gilbertaChr_0013_aglina_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0013_aglina_combo_skill',
    timelineBlockFrames: 73,
    naturalDurationFrames: 130,
    exclusiveFrame: 72,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 53, endFrame: 72, skillIds: ['chr_0013_aglina_normal_skill'] },
        { startFrame: 53, endFrame: 72, skillIds: ['chr_0013_aglina_ultimate_skill'] },
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
        48,
        sequence(
          step('applyPhysicalInfliction', {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            noGuardBuffId: 'buff_physical_no_guard',
            noGuardDefinition: {
              stackingType: 'enhanceAndRefresh',
              priority: 100,
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              presentation: {
                visible: true,
                iconId: 'icon_shadow_attribute_penetrate',
                iconPath: '/icons/icon_shadow_attribute_penetrate.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: true,
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
              applyTags: ['Skill/Character/Common/NoGuard'],
              extendTags: [],
              blackboard: { atk_scale: 0, count: 0, duration: 20, skip_handle_cryst_break: 0 },
              attributeModifiers: [],
              lifecycleSequences: {
                start: sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'skip_handle_cryst_break', fallback: 0 },
                      operator: 'equal',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_physical_handle_cryst_break',
                        target: 'buffOwner',
                        source: 'buffSource',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  ),
                ),
                finish: sequence(
                  step('applyBuff', {
                    buffId: 'buff_physical_no_guard_fake',
                    target: 'buffOwner',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
                afterEnhance: sequence(
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
                      step('igniteBuffs', {
                        target: 'buffOwner',
                        source: 'buffOwner',
                        igniteType: 'NoGuard',
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
                          kind: 'currentBuffStackCompare',
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 2 },
                        },
                        sequence(
                          branch(
                            {
                              kind: 'actionValueCompare',
                              left: {
                                kind: 'blackboard',
                                key: 'skip_handle_cryst_break',
                                fallback: 0,
                              },
                              operator: 'equal',
                              right: { kind: 'constant', value: 0 },
                            },
                            sequence(
                              step('applyBuff', {
                                buffId: 'buff_physical_handle_cryst_break',
                                target: 'buffOwner',
                                source: 'buffSource',
                                inheritSourceSkillCastInfo: true,
                              }),
                            ),
                          ),
                        ),
                      ),
                    ),
                  },
                ),
              },
            },
            airborneBuffId: 'buff_physical_airborne',
            airborneDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0.1,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'airborne',
                iconPath: '/icons/airborne.webp',
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/AirborneStatus'],
              extendTags: [],
              blackboard: { atk_scale: 0, duration: 3, poise: 10 },
              attributeModifiers: [],
              lifecycleSequences: {
                start: sequence(
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
                        buffId: 'buff_physical_no_guard',
                        target: 'buffOwner',
                        source: 'buffSource',
                        inheritSourceSkillCastInfo: true,
                        blackboardAssignments: {
                          skip_handle_cryst_break: { kind: 'constant', value: 1 },
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
                      step('readSkillSettingData', {
                        items: [
                          {
                            values: [1.2, 1.2, 1.2, 1.2],
                            column: { kind: 'constant', value: 1 },
                            storeKey: 'atk_scale',
                            enhance: {
                              target: 'caster',
                              formula: { kind: 'linear', paramA: 0.01 },
                            },
                          },
                          {
                            values: [10, 10, 10, 10],
                            column: { kind: 'constant', value: 1 },
                            storeKey: 'poise',
                            enhance: {
                              target: 'caster',
                              formula: { kind: 'linear', paramA: 0.005 },
                            },
                          },
                        ],
                      }),
                      step('dealDamage', {
                        damageType: 'physical',
                        attackScale: { kind: 'blackboard', key: 'atk_scale' },
                        tags: [],
                        features: ['physicalInfliction'],
                        stagger: { kind: 'blackboard', key: 'poise' },
                      }),
                    ),
                  },
                  {
                    kind: 'withActionBlackboardScope',
                    parameters: {
                      scopeKey: 'native-buff-callback:2',
                      lifetime: 'execution',
                      alwaysNext: true,
                      shareParentBlackboard: true,
                      initialValues: {},
                      inheritParent: true,
                    },
                    body: sequence(
                      step('applyBuff', {
                        buffId: 'buff_physical_handle_cryst_break',
                        target: 'buffOwner',
                        source: 'buffSource',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  },
                  {
                    kind: 'withActionBlackboardScope',
                    parameters: {
                      scopeKey: 'native-buff-callback:3',
                      lifetime: 'execution',
                      alwaysNext: true,
                      shareParentBlackboard: true,
                      initialValues: {},
                      inheritParent: true,
                    },
                    body: sequence(
                      step('igniteBuffs', {
                        target: 'buffOwner',
                        source: 'caster',
                        igniteType: 'PhysicalStatus',
                      }),
                    ),
                  },
                ),
              },
            },
            duration: { kind: 'constant', value: 2.5 },
            height: { kind: 'constant', value: 2 },
            speedFactorMultiplier: 3,
            force: true,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          }),
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0013_aglina_combo_skill:/scheduledSequences/1/sequence/steps/1',
          ),
          branch(
            {
              kind: 'all',
              conditions: [
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'heal_const', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                { kind: 'constant', value: false },
              ],
            },
            sequence(
              branch(
                {
                  kind: 'healthCompare',
                  target: 'controlledOperator',
                  valueType: 'ratio',
                  operator: 'less',
                  value: { kind: 'constant', value: 0.99 },
                },
                sequence(
                  step('heal', {
                    target: 'controlledOperator',
                    alwaysNext: true,
                    tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
                    attribute: 'intellect',
                    multiplier: { kind: 'blackboard', key: 'heal_scale' },
                    addition: { kind: 'blackboard', key: 'heal_const' },
                  }),
                ),
                sequence(
                  step('findCharacterTeamTargets', {
                    saveToContextKey: 'CureTarget',
                    selection: { kind: 'lowestHealthRatioOperator' },
                  }),
                  branch(
                    {
                      kind: 'healthCompare',
                      target: 'contextTarget',
                      contextKey: 'CureTarget',
                      valueType: 'ratio',
                      operator: 'less',
                      value: { kind: 'constant', value: 0.99 },
                    },
                    sequence(
                      step('heal', {
                        target: 'contextTarget',
                        contextKey: 'CureTarget',
                        alwaysNext: true,
                        tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
                        attribute: 'intellect',
                        multiplier: { kind: 'blackboard', key: 'heal_scale' },
                        addition: { kind: 'blackboard', key: 'heal_const' },
                      }),
                    ),
                    sequence(
                      step('heal', {
                        target: 'controlledOperator',
                        alwaysNext: true,
                        tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
                        attribute: 'intellect',
                        multiplier: { kind: 'blackboard', key: 'heal_scale' },
                        addition: { kind: 'blackboard', key: 'heal_const' },
                      }),
                    ),
                    { alwaysNext: true },
                  ),
                ),
                { alwaysNext: true },
              ),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'usp' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          }),
        ),
        50,
      ),
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
    ],
    cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 570],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [1.4, 1.54, 1.68, 1.82, 1.96, 2.1, 2.24, 2.38, 2.52, 2.7, 2.91, 3.15],
    heal_const: 0,
    heal_scale: 0,
    poise: 5,
    radius: 3,
    usp: 10,
  },
);

export const gilbertaCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const gilberta: OperatorDefinition = {
  slug: 'gilberta',
  gameId: 'GILBERTA',
  rarity: 6,
  weaponType: 'arts-unit',
  element: 'nature',
  role: 'supporter',
  mainAttribute: 'will',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [9, 26, 44, 62, 80, 89],
    agility: [9, 27, 45, 64, 83, 92],
    intellect: [16, 39, 64, 89, 114, 127],
    will: [20, 52, 86, 120, 154, 171],
    baseAttack: [30, 94, 161, 228, 296, 329],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        gilbertaChr_0013_aglina_attack1,
        gilbertaChr_0013_aglina_attack2,
        gilbertaChr_0013_aglina_attack3,
        gilbertaChr_0013_aglina_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: gilbertaChr_0013_aglina_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: gilbertaChr_0013_aglina_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: gilbertaChr_0013_aglina_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: gilbertaChr_0013_aglina_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: gilbertaChr_0013_aglina_combo_skill,
    },
  ],
  dodgeSkill: gilbertaCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0013_aglina_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0013_aglina_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0013_aglina_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0013_aglina_attack1',
        'chr_0013_aglina_attack2',
        'chr_0013_aglina_attack3',
        'chr_0013_aglina_attack4',
        'chr_0013_aglina_plunging_attack_end',
        'chr_0013_aglina_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0013_aglina_attack1',
        'chr_0013_aglina_attack2',
        'chr_0013_aglina_attack3',
        'chr_0013_aglina_attack4',
      ],
      defaultSkillKey: 'chr_0013_aglina_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0013_aglina_combo_skill',
      event: 'addedBuff',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'eventBuffTagsMatch',
            match: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellStatus'],
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
  ],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      passiveSkills: [
        {
          key: 'chr_0013_aglina_talent_0',
          blackboard: { add: [0.04, 0.07] },
          enableSequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0013_aglina_talent_0',
              target: 'caster',
              inheritSourceSkillCastInfo: false,
              blackboardAssignments: { add: { kind: 'blackboard', key: 'add' } },
            }),
          ),
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.6, 0.9],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'heal_const',
          operation: 'assign',
          value: [72, 108],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.6, 0.9],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'heal_const',
          operation: 'assign',
          value: [72, 108],
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
          blackboardKey: 'potential',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'radiusadd_display',
          operation: 'assign',
          value: 0.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'radius',
          operation: 'assign',
          value: 6.3,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential2',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential2_onceadd',
          operation: 'assign',
          value: 0.1,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0013_aglina_talent_0',
          blackboardKey: 'add',
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
          skillGroupKey: 'ultimate',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addSkillCooldownFrames', skillGroupKey: 'comboSkill', frames: -60 },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.3,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0013_aglina_normal_skill_monitor: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      triggerIntervalSeconds: 0.15,
      waitFirstTriggerInterval: false,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        trigger: sequence(
          branch(
            {
              kind: 'healthCompare',
              target: 'caster',
              valueType: 'ratio',
              operator: 'lessOrEqual',
              value: { kind: 'constant', value: 0 },
            },
            sequence(step('finishCurrentAbilityEntity', {})),
          ),
        ),
      },
    },
    buff_chr_0013_aglina_talent_0: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { add: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0013_aglina_talent_0_effectbuff',
            target: 'party',
            finishByAction: true,
            blackboardAssignments: { add: { kind: 'blackboard', key: 'add' } },
          }),
        ),
      },
    },
    buff_chr_0013_aglina_talent_0_effectbuff: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: ['Skill/Character/chr_0013_aglina/AglinaTalent0'],
      extendTags: [],
      blackboard: { add: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          branch(
            {
              kind: 'operatorRoleIn',
              target: 'buffOwner',
              roles: ['guard', 'supporter', 'caster'],
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0013_aglina_talent_0_effectbuff_Add',
                target: 'buffOwner',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
                asChildBuff: true,
                copiedBlackboardAssignments: { add: 'add' },
              }),
            ),
          ),
        ),
      },
    },
    buff_chr_0013_aglina_talent_0_effectbuff_Add: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: ['Skill/Character/chr_0013_aglina/AglinaTalent0'],
      extendTags: [],
      blackboard: { add: 0 },
      attributeModifiers: [
        {
          attribute: 'UltimateSpGainScalar',
          slot: 'baseAddition',
          value: { blackboardKey: 'add' },
        },
      ],
    },
    buff_chr_0013_aglina_ultimate_skill: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_def_down',
        iconPath: '/icons/icon_battle_buff_def_down.webp',
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
      applyTags: ['Status/PauseAirborne'],
      extendTags: [],
      blackboard: {
        BuffStack: 0,
        final_resistance_scalar: 0,
        final_resistance_scalar_inair: 0,
        FinalRate: 0,
        move_speed_scalar: 0,
        potential2: 0,
        spell_vulnerable_perstack: 0,
        spell_vulnerable_rate: 0,
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
              step('modifyActionValue', {
                key: 'FinalRate',
                operation: 'assign',
                value: { kind: 'blackboard', key: 'spell_vulnerable_rate' },
              }),
              step('modifyActionValue', {
                key: 'BuffStack',
                operation: 'assign',
                value: { kind: 'constant', value: 0 },
              }),
              branch(
                {
                  kind: 'buffStackCompare',
                  target: 'buffOwner',
                  tagQueryType: 'hasAny',
                  buffTags: ['Skill/Character/Common/NoGuard'],
                  operator: 'greater',
                  value: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('readBuffStackCount', {
                    target: 'buffOwner',
                    outputKey: 'BuffStack',
                    query: {
                      kind: 'tag',
                      tagQueryType: 'hasAny',
                      buffTags: ['Skill/Character/Common/NoGuard'],
                    },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'potential2', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'BuffStack', fallback: 0 },
                      operator: 'lessOrEqual',
                      right: { kind: 'constant', value: 3 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'BuffStack',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
                  ),
                  step('modifyActionValue', {
                    key: 'BuffStack',
                    operation: 'multiply',
                    value: { kind: 'constant', value: 2 },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              step('modifyActionValue', {
                key: 'BuffStack',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'spell_vulnerable_perstack' },
              }),
              step('modifyActionValue', {
                key: 'BuffStack',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
              step('modifyActionValue', {
                key: 'FinalRate',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'BuffStack' },
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0013_aglina_ultimate_spell_vulnerable',
                target: 'buffOwner',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                copiedBlackboardAssignments: { rate: 'FinalRate' },
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
              step('applyBuff', {
                buffId: 'buff_common_affixes_slow',
                target: 'enemy',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                blackboardAssignments: {
                  duration: { kind: 'constant', value: -1 },
                  rate: { kind: 'blackboard', key: 'move_speed_scalar' },
                },
              }),
            ),
          },
        ),
      },
    },
    buff_chr_0013_aglina_ultimate_spell_vulnerable: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { rate: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_spell',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'constant', value: -1 },
              rate: { kind: 'blackboard', key: 'rate' },
            },
          }),
        ),
      },
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0013_aglina_normal_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Category/EnergyShard/Pulse',
      ],
      lifetime: { kind: 'limited', durationSeconds: 6 },
      childSkill: {
        skillId: 'chr_0013_aglina_normal_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 93,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          duration: 0,
          hasrecovered: 0,
          move_speed_scalar: 1,
          potential_lv: 0,
          radius: 0,
          recovercost: 5,
        },
        scheduledSequences: [
          scheduled(
            0,
            sequence(
              repeatEachTick(sequence(), {
                nativeChanneling: {
                  executeEachFrame: true,
                  triggerIntervalSeconds: 0.033,
                  maxCountPerTarget: -1,
                  targetTriggerIntervalSeconds: 0,
                },
              }),
            ),
            93,
          ),
          scheduled(
            0,
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0013_aglina_normal_skill_monitor',
                target: 'currentAbilityEntity',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
              }),
            ),
            93,
          ),
        ],
      },
    },
    abilityentity_chr_0013_aglina_ultimate_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Category/EnergyShard/Pulse',
      ],
      lifetime: { kind: 'limited', durationSeconds: 6 },
      childSkill: {
        skillId: 'chr_0013_aglina_ultimate_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 180,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          BuffStack: 0,
          duration: 0,
          final_resistance_scalar: 0,
          final_resistance_scalar_inair: 0,
          FinalRate: 0,
          move_speed_scalar: 1,
          potential2: 0,
          potential2_onceadd: 0,
          radius: 5,
          resistance_scalar: 0.3,
          resistance_scalar_inair: 0.6,
          spell_vulnerable_perstack: 0,
          spell_vulnerable_rate: 0,
          wisd_increase: 0,
          wisd_increase_inair: 0,
        },
        scheduledSequences: [
          scheduled(
            0,
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0013_aglina_ultimate_skill',
                target: 'enemy',
                finishByAction: true,
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: {
                  FinalRate: { kind: 'blackboard', key: 'FinalRate' },
                  spell_vulnerable_rate: { kind: 'blackboard', key: 'spell_vulnerable_rate' },
                  potential2: { kind: 'blackboard', key: 'potential2' },
                  BuffStack: { kind: 'blackboard', key: 'BuffStack' },
                  spell_vulnerable_perstack: {
                    kind: 'blackboard',
                    key: 'spell_vulnerable_perstack',
                  },
                  move_speed_scalar: { kind: 'blackboard', key: 'move_speed_scalar' },
                },
              }),
            ),
            180,
          ),
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default gilberta;
