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
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withActionBlackboardScope,
  withSkillBlackboard,
} from './definitionHelpers';

const sharedActionSequence5: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
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
            skillId: 'chr_0017_yvonne_ult_attack2_projhit',
            nativeSkillType: 'normalSkill',
            naturalDurationFrames: 1,
            castResource: {
              costFrame: 0,
              cooldownSeconds: 0,
              maxChargeTime: 1,
              cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
            },
            blackboard: { atk_scale: 0 },
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
                    '\u0000endaxis-generated-identity:1',
                  ),
                  branch(
                    { kind: 'probability', probability: { kind: 'constant', value: 0.125 } },
                    sequence(),
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
);

const sharedActionSequence3: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
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
            skillId: 'chr_0017_yvonne_ult_attack1_projhit',
            nativeSkillType: 'normalSkill',
            naturalDurationFrames: 1,
            castResource: {
              costFrame: 0,
              cooldownSeconds: 0,
              maxChargeTime: 1,
              cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
            },
            blackboard: { atk_scale: 0 },
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
                    '\u0000endaxis-generated-identity:1',
                  ),
                  branch(
                    { kind: 'probability', probability: { kind: 'constant', value: 0.125 } },
                    sequence(),
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
);

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
        skillId: 'chr_0017_yvonne_attack3_projhit',
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
                  damageType: 'cryo',
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

const sharedActionSequence8: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'buffIdStackCompare',
      target: 'caster',
      buffIds: ['buff_chr_0017_yvonne_ultimate_skill_voice'],
      operator: 'greaterOrEqual',
      value: { kind: 'constant', value: 1 },
    },
    sequence(
      step('inheritBuffById', {
        target: 'caster',
        buffId: 'buff_chr_0017_yvonne_ultimate_skill_voice',
        inheritToNextSkillIds: ['chr_0017_yvonne_ult_attack3_2'],
        finishByAction: true,
        finishWithNextSkillIfNotInherited: true,
      }),
    ),
    sequence(
      branch(
        {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0017_yvonne_ultimate_skill_voice_short'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_voice_short',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0017_yvonne_ult_attack3_2'],
          }),
        ),
        sequence(
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_voice_short',
            inheritToNextSkillIds: ['chr_0017_yvonne_ult_attack3_2'],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
        ),
        { alwaysNext: true },
      ),
    ),
    { alwaysNext: true },
  ),
);

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

const sharedActionSequence7: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'all',
      conditions: [
        {
          kind: 'not',
          condition: {
            kind: 'timedMarkerPresent',
            target: 'caster',
            markerId: 'chr_0017_yvonne_voice_cd',
          },
        },
        {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0017_yvonne_ultimate_skill_voice'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
        {
          kind: 'buffIdStackCompare',
          target: 'caster',
          buffIds: ['buff_chr_0017_yvonne_ultimate_skill_voice_short'],
          operator: 'equal',
          value: { kind: 'constant', value: 0 },
        },
      ],
    },
    sequence(
      step('createTimedMarker', {
        target: 'caster',
        markerId: 'chr_0017_yvonne_voice_cd',
        durationSeconds: { kind: 'constant', value: 5 },
        autoFinishByAction: false,
      }),
      step('applyBuff', {
        buffId: 'buff_chr_0017_yvonne_ultimate_skill_voice',
        target: 'caster',
        inheritSourceSkillCastInfo: true,
        finishByAction: true,
        inheritToNextSkillIds: ['chr_0017_yvonne_ult_attack3_2'],
      }),
    ),
    sharedActionSequence8,
    { alwaysNext: true },
  ),
);

const sharedActionSequence4: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'healthCompare',
      target: 'enemy',
      valueType: 'ratio',
      operator: 'greater',
      value: { kind: 'constant', value: 0 },
    },
    instantiateActionSequence(sharedActionSequence5, [
      '\u0000endaxis-generated-identity:0',
      '\u0000endaxis-generated-identity:1',
    ]),
    instantiateActionSequence(sharedActionSequence5, [
      '\u0000endaxis-generated-identity:2',
      '\u0000endaxis-generated-identity:3',
    ]),
    { alwaysNext: true },
  ),
);

const sharedActionSequence6: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'healthCompare',
      target: 'enemy',
      valueType: 'ratio',
      operator: 'greater',
      value: { kind: 'constant', value: 0 },
    },
    instantiateActionSequence(sharedActionSequence3, [
      '\u0000endaxis-generated-identity:0',
      '\u0000endaxis-generated-identity:1',
    ]),
    instantiateActionSequence(sharedActionSequence3, [
      '\u0000endaxis-generated-identity:2',
      '\u0000endaxis-generated-identity:3',
    ]),
    { alwaysNext: true },
  ),
);

export const yvonneChr_0017_yvonne_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_attack1',
    timelineBlockFrames: 16,
    naturalDurationFrames: 121,
    exclusiveFrame: 20,
    offsetRecordFrame: 11,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 27,
          input: 'basicAttack',
          targetSkillId: 'chr_0017_yvonne_attack2',
        },
      ],
      allowedNextSkills: [
        { startFrame: 16, endFrame: 27, skillIds: ['chr_0017_yvonne_attack2'] },
        { startFrame: 0, endFrame: 27, skillIds: ['chr_0017_yvonne_attack5'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        11,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0017_yvonne_attack1.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_attack1',
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
                    skillId: 'chr_0017_yvonne_attack1_projhit',
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
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0017_yvonne_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
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
        11,
      ),
      scheduled(
        16,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0017_yvonne_attack2'] })),
        27,
      ),
      scheduled(
        0,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0017_yvonne_attack5'] })),
        27,
      ),
    ],
    timelineContinuationSkillId: 'chr_0017_yvonne_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.24, 0.26, 0.28, 0.31, 0.33, 0.35, 0.38, 0.4, 0.42, 0.45, 0.49, 0.53] },
);

export const yvonneChr_0017_yvonne_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_attack2',
    timelineBlockFrames: 14,
    naturalDurationFrames: 126,
    exclusiveFrame: 20,
    offsetRecordFrame: 11,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 28,
          input: 'basicAttack',
          targetSkillId: 'chr_0017_yvonne_attack3',
        },
      ],
      allowedNextSkills: [
        { startFrame: 14, endFrame: 28, skillIds: ['chr_0017_yvonne_attack3'] },
        { startFrame: 0, endFrame: 28, skillIds: ['chr_0017_yvonne_attack5'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        11,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0017_yvonne_attack2.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_attack1',
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
                    skillId: 'chr_0017_yvonne_attack2_projhit',
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
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0017_yvonne_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
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
        11,
      ),
      scheduled(
        14,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0017_yvonne_attack2.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_attack2_robot',
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
                    skillId: 'chr_0017_yvonne_attack2_robot_projhit',
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
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0017_yvonne_attack2:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
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
        14,
      ),
      scheduled(
        14,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0017_yvonne_attack3'] })),
        28,
      ),
      scheduled(
        0,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0017_yvonne_attack5'] })),
        28,
      ),
    ],
    timelineContinuationSkillId: 'chr_0017_yvonne_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.13, 0.14, 0.15, 0.16, 0.18, 0.19, 0.2, 0.21, 0.23, 0.24, 0.26, 0.28],
    display_atk_scale: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56],
  },
);

export const yvonneChr_0017_yvonne_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_attack3',
    timelineBlockFrames: 20,
    naturalDurationFrames: 127,
    exclusiveFrame: 21,
    offsetRecordFrame: 6,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 34,
          input: 'basicAttack',
          targetSkillId: 'chr_0017_yvonne_attack4',
        },
      ],
      allowedNextSkills: [
        { startFrame: 20, endFrame: 34, skillIds: ['chr_0017_yvonne_attack4'] },
        { startFrame: 0, endFrame: 34, skillIds: ['chr_0017_yvonne_attack5'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        6,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0017_yvonne_attack3.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_attack3',
          'chr_0017_yvonne_attack3:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        6,
      ),
      scheduled(
        9,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0017_yvonne_attack3.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_attack3_2',
          'chr_0017_yvonne_attack3:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        9,
      ),
      scheduled(
        12,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0017_yvonne_attack3.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_attack3_3',
          'chr_0017_yvonne_attack3:/scheduledSequences/2/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        12,
      ),
      scheduled(
        20,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0017_yvonne_attack4'] })),
        34,
      ),
      scheduled(
        0,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0017_yvonne_attack5'] })),
        34,
      ),
    ],
    timelineContinuationSkillId: 'chr_0017_yvonne_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.2, 0.22, 0.24],
    display_atk_scale: [0.32, 0.35, 0.38, 0.41, 0.44, 0.47, 0.5, 0.54, 0.57, 0.61, 0.65, 0.71],
  },
);

export const yvonneChr_0017_yvonne_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_attack4',
    timelineBlockFrames: 24,
    naturalDurationFrames: 156,
    exclusiveFrame: 25,
    offsetRecordFrame: 11,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 38,
          input: 'basicAttack',
          targetSkillId: 'chr_0017_yvonne_attack5',
        },
      ],
      allowedNextSkills: [{ startFrame: 24, endFrame: 38, skillIds: ['chr_0017_yvonne_attack5'] }],
      hasConditionalActions: true,
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        11,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0017_yvonne_attack4.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_attack4',
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
                    skillId: 'chr_0017_yvonne_attack4_projhit',
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
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0017_yvonne_attack4:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
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
        24,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0017_yvonne_attack5'] })),
        38,
      ),
    ],
    timelineContinuationSkillId: 'chr_0017_yvonne_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.41, 0.45, 0.49, 0.53, 0.58, 0.62, 0.66, 0.7, 0.74, 0.79, 0.85, 0.92] },
);

export const yvonneChr_0017_yvonne_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_attack5',
    timelineBlockFrames: 37,
    naturalDurationFrames: 145,
    exclusiveFrame: 37,
    offsetRecordFrame: 21,
    inputWindows: {
      hasConditionalActions: true,
      allowedNextSkills: [{ startFrame: 37, endFrame: 60, skillIds: ['chr_0017_yvonne_attack1'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        21,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'cryo',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack', 'normalAttackLastCombo'],
                },
                'chr_0017_yvonne_attack5:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('dealStagger', { value: { kind: 'blackboard', key: 'poise' } }),
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'cnt', fallback: 0 },
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
                        key: 'cnt',
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
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 1,
                targetTriggerIntervalSeconds: 0.1,
              },
            },
          ),
        ),
        23,
      ),
      scheduled(
        21,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0017_yvonne_talent_1_valid'],
            reason: 'other',
          }),
        ),
        24,
      ),
      scheduled(
        34,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('reachSkillOperableBoundary', { skillIds: ['chr_0017_yvonne_ult_attack2_1'] }),
            ),
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0017_yvonne_ultimate_skill_end'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('reachSkillOperableBoundary', {
                    skillIds: ['chr_0017_yvonne_ult_attack2_1'],
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
            ),
            { alwaysNext: true },
          ),
        ),
        60,
      ),
      scheduled(
        37,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(),
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0017_yvonne_ultimate_skill_end'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(),
                sequence(
                  step('reachSkillOperableBoundary', { skillIds: ['chr_0017_yvonne_attack1'] }),
                ),
                { alwaysNext: true },
              ),
            ),
            { alwaysNext: true },
          ),
        ),
        60,
      ),
    ],
    timelineContinuationSkillId: 'chr_0017_yvonne_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 17,
    atk_scale: [0.56, 0.62, 0.67, 0.73, 0.79, 0.84, 0.9, 0.96, 1.01, 1.08, 1.17, 1.26],
    cnt: 0,
    dmg_up: 0,
    poise: 17,
    display_atk_scale: [0.56, 0.62, 0.67, 0.73, 0.79, 0.84, 0.9, 0.96, 1.01, 1.08, 1.17, 1.26],
  },
);

export const yvonneChr_0017_yvonne_ult_attack1_1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_ult_attack1_1',
    timelineBlockFrames: 21,
    naturalDurationFrames: 77,
    exclusiveFrame: 28,
    offsetRecordFrame: 9,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 26,
          input: 'basicAttack',
          targetSkillId: 'chr_0017_yvonne_ult_attack2_1',
        },
      ],
      allowedNextSkills: [
        {
          startFrame: 21,
          endFrame: 26,
          skillIds: ['chr_0017_yvonne_ult_attack2_1', 'chr_0017_yvonne_ult_attack_end'],
        },
        {
          startFrame: 0,
          endFrame: 26,
          skillIds: ['chr_0017_yvonne_ult_attack_end', 'chr_0017_yvonne_attack5'],
        },
        { startFrame: 21, endFrame: 26, skillIds: ['chr_0017_yvonne_ult_attack2_1'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_camera'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_camera',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0017_yvonne_ult_attack2_1',
                  'chr_0017_yvonne_ult_attack_end',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        37,
      ),
      scheduled(
        37,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0017_yvonne_ultimate_skill_camera'],
            reason: 'other',
          }),
        ),
        40,
      ),
      scheduled(
        9,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              crit_rate_up: 'crit_rate_up',
              normal_dmg_up: 'normal_dmg_up',
            },
          }),
        ),
        12,
      ),
      scheduled(
        15,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              crit_rate_up: 'crit_rate_up',
              normal_dmg_up: 'normal_dmg_up',
            },
          }),
        ),
        18,
      ),
      scheduled(
        21,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              crit_rate_up: 'crit_rate_up',
              normal_dmg_up: 'normal_dmg_up',
            },
          }),
        ),
        24,
      ),
      scheduled(
        9,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0017_yvonne_ult_attack1_1.actionGroupData.timelineActions[12]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack1_1:/scheduledSequences/5/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        9,
      ),
      scheduled(
        15,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0017_yvonne_ult_attack1_1.actionGroupData.timelineActions[13]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack1_1:/scheduledSequences/6/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        15,
      ),
      scheduled(
        21,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0017_yvonne_ult_attack1_1.actionGroupData.timelineActions[14]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack1_1:/scheduledSequences/7/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        21,
      ),
      scheduled(
        11,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_voice_start',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0017_yvonne_ult_attack2_1'],
          }),
        ),
        23,
      ),
      scheduled(
        21,
        sequence(
          step('reachSkillOperableBoundary', {
            skillIds: ['chr_0017_yvonne_ult_attack2_1', 'chr_0017_yvonne_ult_attack_end'],
          }),
        ),
        26,
      ),
      scheduled(
        0,
        sequence(
          step('reachSkillOperableBoundary', {
            skillIds: ['chr_0017_yvonne_ult_attack_end', 'chr_0017_yvonne_attack5'],
          }),
        ),
        26,
      ),
    ],
    timelineContinuationSkillId: 'chr_0017_yvonne_ult_attack2_1',
    skillType: 'basicAttack',
    levelSource: 'ultimate',
    nativeSkillType: 'attack',
  },
  {
    atk_scale: [0.089, 0.098, 0.107, 0.116, 0.125, 0.134, 0.143, 0.151, 0.16, 0.172, 0.185, 0.2],
    crit_rate_up: 0.06,
    normal_dmg_up: 0.03,
    layer: 10,
  },
);

export const yvonneChr_0017_yvonne_ult_attack2_1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_ult_attack2_1',
    timelineBlockFrames: 23,
    naturalDurationFrames: 133,
    exclusiveFrame: 31,
    offsetRecordFrame: 11,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 30,
          input: 'basicAttack',
          targetSkillId: 'chr_0017_yvonne_ult_attack2_2',
        },
      ],
      allowedNextSkills: [
        {
          startFrame: 23,
          endFrame: 30,
          skillIds: ['chr_0017_yvonne_ult_attack2_2', 'chr_0017_yvonne_ult_attack_end'],
        },
        {
          startFrame: 0,
          endFrame: 30,
          skillIds: ['chr_0017_yvonne_ult_attack_end', 'chr_0017_yvonne_attack5'],
        },
        { startFrame: 23, endFrame: 30, skillIds: ['chr_0017_yvonne_ult_attack2_2'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_camera'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_camera',
                inheritToNextSkillIds: [
                  'chr_0017_yvonne_ult_attack2_2',
                  'chr_0017_yvonne_ult_attack_end',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_camera',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0017_yvonne_ult_attack2_2',
                  'chr_0017_yvonne_ult_attack_end',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        32,
      ),
      scheduled(
        32,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0017_yvonne_ultimate_skill_camera'],
            reason: 'other',
          }),
        ),
        35,
      ),
      scheduled(
        11,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        14,
      ),
      scheduled(
        14,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        17,
      ),
      scheduled(
        17,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        20,
      ),
      scheduled(
        5,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        8,
      ),
      scheduled(
        8,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        11,
      ),
      scheduled(
        11,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        14,
      ),
      scheduled(
        14,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        17,
      ),
      scheduled(
        17,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        20,
      ),
      scheduled(
        21,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.6 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.6 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        24,
      ),
      scheduled(
        11,
        instantiateActionSequence(sharedActionSequence4, [
          'SkillData.chr_0017_yvonne_ult_attack2_1.actionGroupData.timelineActions[27]._sequenceActionData.actionData[0].succeedActions.actionData[0].succeedActions.actionData[0]:projectile_chr_0017_yvonne_ult_attack2',
          'chr_0017_yvonne_ult_attack2_1:/scheduledSequences/11/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
          'SkillData.chr_0017_yvonne_ult_attack2_1.actionGroupData.timelineActions[27]._sequenceActionData.actionData[0].succeedActions.actionData[0].failActions.actionData[1]:projectile_chr_0017_yvonne_ult_attack2',
          'chr_0017_yvonne_ult_attack2_1:/scheduledSequences/11/sequence/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        11,
      ),
      scheduled(
        14,
        instantiateActionSequence(sharedActionSequence6, [
          'SkillData.chr_0017_yvonne_ult_attack2_1.actionGroupData.timelineActions[28]._sequenceActionData.actionData[0].succeedActions.actionData[0].succeedActions.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack2_1:/scheduledSequences/12/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
          'SkillData.chr_0017_yvonne_ult_attack2_1.actionGroupData.timelineActions[28]._sequenceActionData.actionData[0].succeedActions.actionData[0].failActions.actionData[1]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack2_1:/scheduledSequences/12/sequence/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        14,
      ),
      scheduled(
        17,
        instantiateActionSequence(sharedActionSequence4, [
          'SkillData.chr_0017_yvonne_ult_attack2_1.actionGroupData.timelineActions[29]._sequenceActionData.actionData[0].succeedActions.actionData[0].succeedActions.actionData[0]:projectile_chr_0017_yvonne_ult_attack2',
          'chr_0017_yvonne_ult_attack2_1:/scheduledSequences/13/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
          'SkillData.chr_0017_yvonne_ult_attack2_1.actionGroupData.timelineActions[29]._sequenceActionData.actionData[0].succeedActions.actionData[0].failActions.actionData[1]:projectile_chr_0017_yvonne_ult_attack2',
          'chr_0017_yvonne_ult_attack2_1:/scheduledSequences/13/sequence/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        17,
      ),
      scheduled(
        21,
        instantiateActionSequence(sharedActionSequence6, [
          'SkillData.chr_0017_yvonne_ult_attack2_1.actionGroupData.timelineActions[30]._sequenceActionData.actionData[0].succeedActions.actionData[0].succeedActions.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack2_1:/scheduledSequences/14/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
          'SkillData.chr_0017_yvonne_ult_attack2_1.actionGroupData.timelineActions[30]._sequenceActionData.actionData[0].succeedActions.actionData[0].failActions.actionData[1]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack2_1:/scheduledSequences/14/sequence/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        21,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_voice_start'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_voice_start',
                inheritToNextSkillIds: ['chr_0017_yvonne_ult_attack2_2'],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        24,
      ),
      scheduled(
        23,
        sequence(
          step('reachSkillOperableBoundary', {
            skillIds: ['chr_0017_yvonne_ult_attack2_2', 'chr_0017_yvonne_ult_attack_end'],
          }),
        ),
        30,
      ),
      scheduled(
        0,
        sequence(
          step('reachSkillOperableBoundary', {
            skillIds: ['chr_0017_yvonne_ult_attack_end', 'chr_0017_yvonne_attack5'],
          }),
        ),
        30,
      ),
    ],
    timelineContinuationSkillId: 'chr_0017_yvonne_ult_attack2_2',
    skillType: 'basicAttack',
    levelSource: 'ultimate',
    nativeSkillType: 'attack',
  },
  { atk_scale: [0.089, 0.098, 0.107, 0.116, 0.125, 0.134, 0.143, 0.151, 0.16, 0.172, 0.185, 0.2] },
);

export const yvonneChr_0017_yvonne_ult_attack2_2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_ult_attack2_2',
    timelineBlockFrames: 12,
    naturalDurationFrames: 123,
    exclusiveFrame: 22,
    offsetRecordFrame: 1,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 20,
          input: 'basicAttack',
          targetSkillId: 'chr_0017_yvonne_ult_attack3_1',
        },
      ],
      allowedNextSkills: [
        {
          startFrame: 12,
          endFrame: 20,
          skillIds: ['chr_0017_yvonne_ult_attack3_1', 'chr_0017_yvonne_ult_attack_end'],
        },
        {
          startFrame: 0,
          endFrame: 20,
          skillIds: ['chr_0017_yvonne_ult_attack_end', 'chr_0017_yvonne_attack5'],
        },
        { startFrame: 12, endFrame: 20, skillIds: ['chr_0017_yvonne_ult_attack3_1'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        1,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        4,
      ),
      scheduled(
        4,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        7,
      ),
      scheduled(
        7,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        10,
      ),
      scheduled(
        1,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        4,
      ),
      scheduled(
        4,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        7,
      ),
      scheduled(
        7,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        10,
      ),
      scheduled(
        11,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.6 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.6 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        14,
      ),
      scheduled(
        1,
        instantiateActionSequence(sharedActionSequence6, [
          'SkillData.chr_0017_yvonne_ult_attack2_2.actionGroupData.timelineActions[23]._sequenceActionData.actionData[0].succeedActions.actionData[0].succeedActions.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack2_2:/scheduledSequences/7/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
          'SkillData.chr_0017_yvonne_ult_attack2_2.actionGroupData.timelineActions[23]._sequenceActionData.actionData[0].succeedActions.actionData[0].failActions.actionData[1]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack2_2:/scheduledSequences/7/sequence/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        1,
      ),
      scheduled(
        4,
        instantiateActionSequence(sharedActionSequence6, [
          'SkillData.chr_0017_yvonne_ult_attack2_2.actionGroupData.timelineActions[24]._sequenceActionData.actionData[0].succeedActions.actionData[0].succeedActions.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack2_2:/scheduledSequences/8/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
          'SkillData.chr_0017_yvonne_ult_attack2_2.actionGroupData.timelineActions[24]._sequenceActionData.actionData[0].succeedActions.actionData[0].failActions.actionData[1]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack2_2:/scheduledSequences/8/sequence/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        4,
      ),
      scheduled(
        7,
        instantiateActionSequence(sharedActionSequence6, [
          'SkillData.chr_0017_yvonne_ult_attack2_2.actionGroupData.timelineActions[25]._sequenceActionData.actionData[0].succeedActions.actionData[0].succeedActions.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack2_2:/scheduledSequences/9/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
          'SkillData.chr_0017_yvonne_ult_attack2_2.actionGroupData.timelineActions[25]._sequenceActionData.actionData[0].succeedActions.actionData[0].failActions.actionData[1]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack2_2:/scheduledSequences/9/sequence/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        7,
      ),
      scheduled(
        11,
        instantiateActionSequence(sharedActionSequence6, [
          'SkillData.chr_0017_yvonne_ult_attack2_2.actionGroupData.timelineActions[26]._sequenceActionData.actionData[0].succeedActions.actionData[0].succeedActions.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack2_2:/scheduledSequences/10/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
          'SkillData.chr_0017_yvonne_ult_attack2_2.actionGroupData.timelineActions[26]._sequenceActionData.actionData[0].succeedActions.actionData[0].failActions.actionData[1]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack2_2:/scheduledSequences/10/sequence/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        11,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_camera'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_camera',
                inheritToNextSkillIds: [
                  'chr_0017_yvonne_ult_attack3_1',
                  'chr_0017_yvonne_ult_attack_end',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_camera',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0017_yvonne_ult_attack3_1',
                  'chr_0017_yvonne_ult_attack_end',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        21,
      ),
      scheduled(
        21,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0017_yvonne_ultimate_skill_camera'],
            reason: 'other',
          }),
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
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_voice_start'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_voice_start',
                inheritToNextSkillIds: ['chr_0017_yvonne_ult_attack3_1'],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        13,
      ),
      scheduled(
        12,
        sequence(
          step('reachSkillOperableBoundary', {
            skillIds: ['chr_0017_yvonne_ult_attack3_1', 'chr_0017_yvonne_ult_attack_end'],
          }),
        ),
        20,
      ),
      scheduled(
        0,
        sequence(
          step('reachSkillOperableBoundary', {
            skillIds: ['chr_0017_yvonne_ult_attack_end', 'chr_0017_yvonne_attack5'],
          }),
        ),
        20,
      ),
    ],
    timelineContinuationSkillId: 'chr_0017_yvonne_ult_attack3_1',
    skillType: 'basicAttack',
    levelSource: 'ultimate',
    nativeSkillType: 'attack',
  },
  { atk_scale: [0.089, 0.098, 0.107, 0.116, 0.125, 0.134, 0.143, 0.151, 0.16, 0.172, 0.185, 0.2] },
);

export const yvonneChr_0017_yvonne_ult_attack3_1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_ult_attack3_1',
    timelineBlockFrames: 28,
    naturalDurationFrames: 163,
    exclusiveFrame: 45,
    offsetRecordFrame: 13,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 36,
          input: 'basicAttack',
          targetSkillId: 'chr_0017_yvonne_ult_attack3_2',
        },
      ],
      allowedNextSkills: [
        {
          startFrame: 28,
          endFrame: 36,
          skillIds: ['chr_0017_yvonne_ult_attack3_2', 'chr_0017_yvonne_ult_attack_end'],
        },
        {
          startFrame: 0,
          endFrame: 36,
          skillIds: ['chr_0017_yvonne_ult_attack_end', 'chr_0017_yvonne_attack5'],
        },
        { startFrame: 28, endFrame: 36, skillIds: ['chr_0017_yvonne_ult_attack3_2'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        13,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        15,
      ),
      scheduled(
        15,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        17,
      ),
      scheduled(
        17,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        19,
      ),
      scheduled(
        19,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        21,
      ),
      scheduled(
        21,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        23,
      ),
      scheduled(
        23,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        25,
      ),
      scheduled(
        25,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        27,
      ),
      scheduled(
        27,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        29,
      ),
      scheduled(
        13,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        15,
      ),
      scheduled(
        15,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        17,
      ),
      scheduled(
        17,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        19,
      ),
      scheduled(
        19,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        21,
      ),
      scheduled(
        21,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        23,
      ),
      scheduled(
        23,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        25,
      ),
      scheduled(
        25,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        27,
      ),
      scheduled(
        27,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.5 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.5 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        29,
      ),
      scheduled(
        13,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0017_yvonne_ult_attack3_1.actionGroupData.timelineActions[39]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack3_1:/scheduledSequences/16/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        13,
      ),
      scheduled(
        15,
        instantiateActionSequence(sharedActionSequence5, [
          'SkillData.chr_0017_yvonne_ult_attack3_1.actionGroupData.timelineActions[40]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack2',
          'chr_0017_yvonne_ult_attack3_1:/scheduledSequences/17/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        15,
      ),
      scheduled(
        17,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0017_yvonne_ult_attack3_1.actionGroupData.timelineActions[41]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack3_1:/scheduledSequences/18/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        17,
      ),
      scheduled(
        19,
        instantiateActionSequence(sharedActionSequence5, [
          'SkillData.chr_0017_yvonne_ult_attack3_1.actionGroupData.timelineActions[42]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack2',
          'chr_0017_yvonne_ult_attack3_1:/scheduledSequences/19/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        19,
      ),
      scheduled(
        21,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0017_yvonne_ult_attack3_1.actionGroupData.timelineActions[43]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack3_1:/scheduledSequences/20/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        21,
      ),
      scheduled(
        23,
        instantiateActionSequence(sharedActionSequence5, [
          'SkillData.chr_0017_yvonne_ult_attack3_1.actionGroupData.timelineActions[44]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack2',
          'chr_0017_yvonne_ult_attack3_1:/scheduledSequences/21/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        23,
      ),
      scheduled(
        25,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0017_yvonne_ult_attack3_1.actionGroupData.timelineActions[45]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack3_1:/scheduledSequences/22/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        25,
      ),
      scheduled(
        27,
        instantiateActionSequence(sharedActionSequence5, [
          'SkillData.chr_0017_yvonne_ult_attack3_1.actionGroupData.timelineActions[46]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack2',
          'chr_0017_yvonne_ult_attack3_1:/scheduledSequences/23/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        27,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_camera'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_camera',
                inheritToNextSkillIds: [
                  'chr_0017_yvonne_ult_attack3_2',
                  'chr_0017_yvonne_ult_attack_end',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_camera',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0017_yvonne_ult_attack3_2',
                  'chr_0017_yvonne_ult_attack_end',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        50,
      ),
      scheduled(
        50,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0017_yvonne_ultimate_skill_camera'],
            reason: 'other',
          }),
        ),
        53,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_voice_start'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_voice_start',
                inheritToNextSkillIds: [],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        12,
      ),
      scheduled(12, sharedActionSequence7, 32),
      scheduled(
        28,
        sequence(
          step('reachSkillOperableBoundary', {
            skillIds: ['chr_0017_yvonne_ult_attack3_2', 'chr_0017_yvonne_ult_attack_end'],
          }),
        ),
        36,
      ),
      scheduled(
        0,
        sequence(
          step('reachSkillOperableBoundary', {
            skillIds: ['chr_0017_yvonne_ult_attack_end', 'chr_0017_yvonne_attack5'],
          }),
        ),
        36,
      ),
    ],
    timelineContinuationSkillId: 'chr_0017_yvonne_ult_attack3_2',
    skillType: 'basicAttack',
    levelSource: 'ultimate',
    nativeSkillType: 'attack',
  },
  { atk_scale: [0.089, 0.098, 0.107, 0.116, 0.125, 0.134, 0.143, 0.151, 0.16, 0.172, 0.185, 0.2] },
);

export const yvonneChr_0017_yvonne_ult_attack3_2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_ult_attack3_2',
    timelineBlockFrames: 16,
    naturalDurationFrames: 151,
    exclusiveFrame: 28,
    offsetRecordFrame: 150,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 24,
          input: 'basicAttack',
          targetSkillId: 'chr_0017_yvonne_ult_attack3_2',
        },
      ],
      allowedNextSkills: [
        { startFrame: 0, endFrame: 24, skillIds: ['chr_0017_yvonne_attack5'] },
        { startFrame: 0, endFrame: 28, skillIds: ['chr_0017_yvonne_ult_attack_end'] },
        {
          startFrame: 16,
          endFrame: 24,
          skillIds: ['chr_0017_yvonne_ult_attack3_2', 'chr_0017_yvonne_ult_attack_end'],
        },
        { startFrame: 16, endFrame: 24, skillIds: ['chr_0017_yvonne_ult_attack_end'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        1,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        3,
      ),
      scheduled(
        3,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        5,
      ),
      scheduled(
        5,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        7,
      ),
      scheduled(
        7,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        9,
      ),
      scheduled(
        9,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        11,
      ),
      scheduled(
        11,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        13,
      ),
      scheduled(
        13,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        15,
      ),
      scheduled(
        15,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        17,
      ),
      scheduled(
        1,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0017_yvonne_ult_attack3_2.actionGroupData.timelineActions[28]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack3_2:/scheduledSequences/8/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        1,
      ),
      scheduled(
        3,
        instantiateActionSequence(sharedActionSequence5, [
          'SkillData.chr_0017_yvonne_ult_attack3_2.actionGroupData.timelineActions[29]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack2',
          'chr_0017_yvonne_ult_attack3_2:/scheduledSequences/9/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        3,
      ),
      scheduled(
        5,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0017_yvonne_ult_attack3_2.actionGroupData.timelineActions[30]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack3_2:/scheduledSequences/10/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        5,
      ),
      scheduled(
        7,
        instantiateActionSequence(sharedActionSequence5, [
          'SkillData.chr_0017_yvonne_ult_attack3_2.actionGroupData.timelineActions[31]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack2',
          'chr_0017_yvonne_ult_attack3_2:/scheduledSequences/11/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        7,
      ),
      scheduled(
        9,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0017_yvonne_ult_attack3_2.actionGroupData.timelineActions[32]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack3_2:/scheduledSequences/12/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        9,
      ),
      scheduled(
        11,
        instantiateActionSequence(sharedActionSequence5, [
          'SkillData.chr_0017_yvonne_ult_attack3_2.actionGroupData.timelineActions[33]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack2',
          'chr_0017_yvonne_ult_attack3_2:/scheduledSequences/13/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        11,
      ),
      scheduled(
        13,
        instantiateActionSequence(sharedActionSequence3, [
          'SkillData.chr_0017_yvonne_ult_attack3_2.actionGroupData.timelineActions[34]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack1',
          'chr_0017_yvonne_ult_attack3_2:/scheduledSequences/14/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        13,
      ),
      scheduled(
        15,
        instantiateActionSequence(sharedActionSequence5, [
          'SkillData.chr_0017_yvonne_ult_attack3_2.actionGroupData.timelineActions[35]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_ult_attack2',
          'chr_0017_yvonne_ult_attack3_2:/scheduledSequences/15/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        15,
      ),
      scheduled(
        1,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        3,
      ),
      scheduled(
        3,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        5,
      ),
      scheduled(
        5,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        7,
      ),
      scheduled(
        7,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        9,
      ),
      scheduled(
        9,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        11,
      ),
      scheduled(
        11,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        13,
      ),
      scheduled(
        13,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.2 } },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        15,
      ),
      scheduled(
        15,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.5 } },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { effect_duration: { kind: 'constant', value: 0.5 } },
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
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_camera'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_camera',
                inheritToNextSkillIds: [
                  'chr_0017_yvonne_ult_attack3_2',
                  'chr_0017_yvonne_ult_attack_end',
                ],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_camera',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                inheritToNextSkillIds: [
                  'chr_0017_yvonne_ult_attack3_2',
                  'chr_0017_yvonne_ult_attack_end',
                ],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        37,
      ),
      scheduled(
        37,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0017_yvonne_ultimate_skill_camera'],
            reason: 'other',
          }),
        ),
        40,
      ),
      scheduled(
        0,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0017_yvonne_attack5'] })),
        24,
      ),
      scheduled(
        0,
        sequence(
          step('reachSkillOperableBoundary', { skillIds: ['chr_0017_yvonne_ult_attack_end'] }),
        ),
        28,
      ),
      scheduled(
        16,
        sequence(
          step('reachSkillOperableBoundary', {
            skillIds: ['chr_0017_yvonne_ult_attack3_2', 'chr_0017_yvonne_ult_attack_end'],
          }),
        ),
        24,
      ),
      scheduled(0, sharedActionSequence7, 18),
    ],
    timelineContinuationSkillId: 'chr_0017_yvonne_ult_attack_end',
    skillType: 'basicAttack',
    levelSource: 'ultimate',
    nativeSkillType: 'attack',
  },
  { atk_scale: [0.089, 0.098, 0.107, 0.116, 0.125, 0.134, 0.143, 0.151, 0.16, 0.172, 0.185, 0.2] },
);

export const yvonneChr_0017_yvonne_ult_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_ult_attack_end',
    timelineBlockFrames: 61,
    naturalDurationFrames: 161,
    exclusiveFrame: 60,
    offsetRecordFrame: 28,
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        28,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_end'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'cryo',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack', 'normalAttackLastCombo'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                  staggerOnlyWhenCasterControlled: true,
                },
                'chr_0017_yvonne_ult_attack_end:/scheduledSequences/0/sequence/steps/0/whenTrue/steps/0',
              ),
              forEachTarget(
                'enemy',
                sequence(
                  branch(
                    {
                      kind: 'buffStackCompare',
                      target: 'enemy',
                      tagQueryType: 'hasAny',
                      buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step(
                        'dealDamage',
                        {
                          damageType: 'cryo',
                          attackScale: { kind: 'blackboard', key: 'atk_scale_extra' },
                          tags: ['normalAttack'],
                        },
                        'chr_0017_yvonne_ult_attack_end:/scheduledSequences/0/sequence/steps/0/whenTrue/steps/1/body/steps/0/whenTrue/steps/0',
                      ),
                      step('finishBuffsByTag', {
                        target: 'enemy',
                        tagQueryType: 'hasAny',
                        buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
                        reason: 'early',
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
                  ),
                ),
              ),
            ),
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'cryo',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack', 'normalAttackLastCombo'],
                  features: ['canBreakWeakness'],
                  instantAttributeModifiers: [
                    {
                      targetSide: 'attacker',
                      attribute: 'criticalRate',
                      slot: 'baseAddition',
                      value: { kind: 'blackboard', key: 'normal_dmg_up' },
                      attributeTiming: 'runtime',
                    },
                    {
                      targetSide: 'attacker',
                      attribute: 'criticalDamageIncrease',
                      slot: 'baseAddition',
                      value: { kind: 'blackboard', key: 'crit_rate_up' },
                      attributeTiming: 'runtime',
                    },
                    {
                      targetSide: 'attacker',
                      attribute: 'Atk',
                      slot: 'baseMultiplier',
                      value: { kind: 'blackboard', key: 'atk_up_true' },
                      attributeTiming: 'runtime',
                    },
                    {
                      targetSide: 'attacker',
                      attribute: 'criticalDamageIncrease',
                      slot: 'baseAddition',
                      value: { kind: 'blackboard', key: 'crit_dmg_up_true' },
                      attributeTiming: 'runtime',
                    },
                  ],
                  stagger: { kind: 'blackboard', key: 'poise' },
                  staggerOnlyWhenCasterControlled: true,
                },
                'chr_0017_yvonne_ult_attack_end:/scheduledSequences/0/sequence/steps/0/whenFalse/steps/0',
              ),
              forEachTarget(
                'enemy',
                sequence(
                  branch(
                    {
                      kind: 'buffStackCompare',
                      target: 'enemy',
                      tagQueryType: 'hasAny',
                      buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step(
                        'dealDamage',
                        {
                          damageType: 'cryo',
                          attackScale: { kind: 'blackboard', key: 'atk_scale_extra' },
                          tags: ['normalAttack'],
                          instantAttributeModifiers: [
                            {
                              targetSide: 'attacker',
                              attribute: 'criticalRate',
                              slot: 'baseAddition',
                              value: { kind: 'blackboard', key: 'normal_dmg_up' },
                              attributeTiming: 'runtime',
                            },
                            {
                              targetSide: 'attacker',
                              attribute: 'criticalDamageIncrease',
                              slot: 'baseAddition',
                              value: { kind: 'blackboard', key: 'crit_rate_up' },
                              attributeTiming: 'runtime',
                            },
                            {
                              targetSide: 'attacker',
                              attribute: 'Atk',
                              slot: 'baseMultiplier',
                              value: { kind: 'blackboard', key: 'atk_up_true' },
                              attributeTiming: 'runtime',
                            },
                            {
                              targetSide: 'attacker',
                              attribute: 'criticalDamageIncrease',
                              slot: 'baseAddition',
                              value: { kind: 'blackboard', key: 'crit_dmg_up_true' },
                              attributeTiming: 'runtime',
                            },
                          ],
                        },
                        'chr_0017_yvonne_ult_attack_end:/scheduledSequences/0/sequence/steps/0/whenFalse/steps/1/body/steps/0/whenTrue/steps/0',
                      ),
                      step('finishBuffsByTag', {
                        target: 'enemy',
                        tagQueryType: 'hasAny',
                        buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
                        reason: 'early',
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
                  ),
                ),
              ),
            ),
            { alwaysNext: true },
          ),
        ),
        60,
      ),
      scheduled(
        0,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0017_yvonne_ultimate_skill_layer_effect'],
            reason: 'other',
          }),
        ),
        3,
      ),
      scheduled(
        29,
        sequence(
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
                targets: ['enemy', 'caster'],
              }),
            ),
          ),
        ),
        32,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_layer',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        3,
      ),
      scheduled(
        28,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: [
              'buff_chr_0017_yvonne_ultimate_skill_end',
              'buff_chr_0017_yvonne_ultimate_skill_layer',
            ],
            reason: 'other',
          }),
        ),
        31,
      ),
      scheduled(
        0,
        sequence(
          step('readBuffBlackboard', {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0017_yvonne_ultimate_skill_layer'] },
            desiredKey: 'normal_dmg_up',
            outputKey: 'normal_dmg_up',
          }),
          step('readBuffStackCount', {
            target: 'caster',
            outputKey: 'stack',
            query: { kind: 'id', buffIds: ['buff_chr_0017_yvonne_ultimate_skill_layer'] },
          }),
          step('modifyActionValue', {
            key: 'normal_dmg_up',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'stack' },
          }),
          step('readBuffBlackboard', {
            target: 'caster',
            query: { kind: 'id', buffIds: ['buff_chr_0017_yvonne_ultimate_skill_layer'] },
            desiredKey: 'crit_rate_up_dynamic',
            outputKey: 'crit_rate_up',
          }),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_potential_5_effect'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('calculateActionValue', {
                key: 'crit_dmg_up_true',
                operation: 'add',
                left: { kind: 'blackboard', key: 'crit_dmg_up' },
                right: { kind: 'constant', value: 0 },
              }),
              step('calculateActionValue', {
                key: 'atk_up_true',
                operation: 'add',
                left: { kind: 'blackboard', key: 'atk_up' },
                right: { kind: 'constant', value: 0 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        3,
      ),
      scheduled(
        7,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'robots',
            abilityEntityIds: [
              'abilityentity_chr_0017_yvonne_ultimate_skill',
              'abilityentity_chr_0017_yvonne_ultimate_skill2',
              'abilityentity_chr_0017_yvonne_ultimate_skill3',
            ],
            maxTargets: 1,
          }),
          forEachContextTarget(
            'robots',
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_robot_end',
                target: 'currentAbilityEntity',
                inheritSourceSkillCastInfo: true,
              }),
            ),
          ),
        ),
        8,
      ),
      scheduled(
        12,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'robots',
            abilityEntityIds: [
              'abilityentity_chr_0017_yvonne_ultimate_skill',
              'abilityentity_chr_0017_yvonne_ultimate_skill2',
              'abilityentity_chr_0017_yvonne_ultimate_skill3',
            ],
            maxTargets: 1,
          }),
          forEachContextTarget(
            'robots',
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_robot_end',
                target: 'currentAbilityEntity',
                inheritSourceSkillCastInfo: true,
              }),
            ),
          ),
        ),
        13,
      ),
      scheduled(
        17,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'robots',
            abilityEntityIds: [
              'abilityentity_chr_0017_yvonne_ultimate_skill',
              'abilityentity_chr_0017_yvonne_ultimate_skill2',
              'abilityentity_chr_0017_yvonne_ultimate_skill3',
            ],
            maxTargets: 1,
          }),
          forEachContextTarget(
            'robots',
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_robot_end',
                target: 'currentAbilityEntity',
                inheritSourceSkillCastInfo: true,
              }),
            ),
          ),
        ),
        18,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_camera'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('inheritBuffById', {
                target: 'caster',
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_camera',
                inheritToNextSkillIds: [],
                finishByAction: true,
                finishWithNextSkillIfNotInherited: true,
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill_camera',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        67,
      ),
      scheduled(
        67,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0017_yvonne_ultimate_skill_camera'],
            reason: 'other',
          }),
        ),
        70,
      ),
    ],
    skillType: 'basicAttack',
    levelSource: 'ultimate',
    nativeSkillType: 'attack',
  },
  {
    atk_scale: [1.33, 1.47, 1.6, 1.73, 1.86, 2, 2.13, 2.26, 2.4, 2.56, 2.76, 3],
    atk_scale_extra: [2.67, 2.94, 3.2, 3.47, 3.74, 4, 4.27, 4.54, 4.8, 5.14, 5.54, 6],
    atk_up: 0.3,
    atk_up_true: 0,
    crit_dmg_up: 0.15,
    crit_dmg_up_true: 0,
    crit_rate_up: 0,
    normal_dmg_up: 0,
    poise: 20,
    stack: 0,
  },
);

export const yvonneChr_0017_yvonne_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_power_attack',
    timelineBlockFrames: 29,
    naturalDurationFrames: 135,
    exclusiveFrame: 45,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 29,
          endFrame: 47,
          skillIds: ['chr_0017_yvonne_normal_skill', 'chr_0017_yvonne_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        8,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0017_yvonne_power_attack.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0017_yvonne_power_attack',
            {},
            true,
            sequence({
              kind: 'launchProjectile',
              parameters: {
                finish: 'firstTickReach',
                recycleDelaySeconds: 0.0333333350718021,
                hit: { onReach: true, finishOnHit: true },
              },
              callbacks: [
                {
                  event: 'hit',
                  skill: {
                    skillId: 'chr_0017_yvonne_power_attack_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atk_scale: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              calculation: 'breakingAttack',
                              calculationMultiplier: 0.1,
                              tags: ['normalAttack', 'powerAttack'],
                            },
                            'chr_0017_yvonne_power_attack:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                          step('applyBuff', {
                            buffId: 'buff_chr_0017_yvonne_power_attack',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
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
        11,
      ),
      scheduled(
        28,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.9,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0017_yvonne_power_attack:/scheduledSequences/1/sequence/steps/0',
          ),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'enemy',
              buffIds: ['buff_chr_0017_yvonne_power_attack'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('finishBuffsById', {
                target: 'enemy',
                buffIds: ['buff_chr_0017_yvonne_power_attack'],
                reason: 'other',
              }),
            ),
          ),
        ),
        30,
      ),
      scheduled(
        29,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.5 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: {
                  kind: 'inline',
                  keys: [
                    {
                      time: 0,
                      value: 0.7,
                      inTangent: -8.311591,
                      outTangent: -8.311591,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.1,
                      value: 0.04752808,
                      inTangent: -0.01381588,
                      outTangent: -0.01381588,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 1,
                      inTangent: 2.675379,
                      outTangent: 5.233175,
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
        30,
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
        29,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const yvonneChr_0017_yvonne_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_plunging_attack_end',
    timelineBlockFrames: 2,
    naturalDurationFrames: 130,
    exclusiveFrame: 20,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 2,
          endFrame: 20,
          skillIds: [
            'chr_0017_yvonne_ult_attack3_1',
            'chr_0017_yvonne_ult_attack3_2',
            'chr_0017_yvonne_ult_attack_end',
            'chr_0017_yvonne_ult_attack2_1',
            'chr_0017_yvonne_ult_attack2_2',
            'chr_0017_yvonne_attack5',
            'chr_0017_yvonne_attack4',
            'chr_0017_yvonne_attack3',
            'chr_0017_yvonne_attack2',
          ],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        1,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_potential_5'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              branch(
                { kind: 'probability', probability: { kind: 'blackboard', key: 'prob' } },
                sequence(
                  branch(
                    {
                      kind: 'buffIdStackCompare',
                      target: 'caster',
                      buffIds: ['buff_chr_0017_yvonne_potential_5_cd'],
                      operator: 'equal',
                      value: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'atk_scale',
                        operation: 'multiply',
                        value: { kind: 'blackboard', key: 'dmg_scale' },
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0017_yvonne_potential_5_cd',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                        copiedBlackboardAssignments: { cd: 'cd' },
                      }),
                      step(
                        'dealDamage',
                        {
                          damageType: 'cryo',
                          attackScale: { kind: 'blackboard', key: 'atk_scale' },
                          tags: ['normalAttack', 'plungingAttack'],
                          stagger: { kind: 'blackboard', key: 'poise' },
                        },
                        'chr_0017_yvonne_plunging_attack_end:/scheduledSequences/0/sequence/steps/0/whenTrue/steps/0/whenTrue/steps/0/whenTrue/steps/2',
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
                            spGainSource: 'default',
                          }),
                        ),
                      ),
                    ),
                    sequence(
                      step(
                        'dealDamage',
                        {
                          damageType: 'cryo',
                          attackScale: { kind: 'blackboard', key: 'atk_scale' },
                          tags: ['normalAttack', 'plungingAttack'],
                        },
                        'chr_0017_yvonne_plunging_attack_end:/scheduledSequences/0/sequence/steps/0/whenTrue/steps/0/whenTrue/steps/0/whenFalse/steps/0',
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
                            spGainSource: 'default',
                          }),
                        ),
                      ),
                    ),
                    { alwaysNext: true },
                  ),
                ),
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'cryo',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack', 'plungingAttack'],
                    },
                    'chr_0017_yvonne_plunging_attack_end:/scheduledSequences/0/sequence/steps/0/whenTrue/steps/0/whenFalse/steps/0',
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
                        spGainSource: 'default',
                      }),
                    ),
                  ),
                ),
                { alwaysNext: true },
              ),
            ),
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'cryo',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack', 'plungingAttack'],
                },
                'chr_0017_yvonne_plunging_attack_end:/scheduledSequences/0/sequence/steps/0/whenFalse/steps/0',
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
                    spGainSource: 'default',
                  }),
                ),
              ),
            ),
            { alwaysNext: true },
          ),
        ),
        6,
      ),
    ],
    skillType: 'plungingAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    cd: 15,
    dmg_scale: 2.5,
    poise: 5,
    prob: 0.5,
  },
);

export const yvonneChr_0017_yvonne_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_normal_skill',
    timelineBlockFrames: 35,
    naturalDurationFrames: 150,
    exclusiveFrame: 34,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 34, endFrame: 56, skillIds: ['chr_0017_yvonne_normal_skill'] },
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
        5,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_normal_skill_projectile',
            target: 'caster',
            source: 'enemy',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            copiedBlackboardAssignments: {
              atk_scale: 'atk_scale',
              poise: 'poise',
              consume_cnt: 'consume_cnt',
              gained_atb: 'gained_atb',
              has_potential2: 'has_potential2',
              atb_return: 'atb_return',
              count: 'count',
              atk_scale_layer: 'atk_scale_layer',
              usp_base: 'usp_base',
              usp_layer: 'usp_layer',
              atk_scale2: 'atk_scale2',
            },
          }),
        ),
        17,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_normal_skill_listener',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { crit_up: 'crit_up', atk_scale2: 'atk_scale2' },
          }),
        ),
        2,
      ),
    ],
    smartTarget: 'enemy',
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb_return: 10,
    atk_scale: [1.11, 1.22, 1.33, 1.44, 1.55, 1.67, 1.78, 1.89, 2, 2.14, 2.3, 2.5],
    atk_scale_layer: [0.89, 0.98, 1.07, 1.16, 1.24, 1.33, 1.42, 1.51, 1.6, 1.71, 1.85, 2],
    atk_scale2: [0.67, 0.73, 0.8, 0.87, 0.93, 1, 1.07, 1.13, 1.2, 1.28, 1.38, 1.5],
    consume_cnt: 0,
    count: 0,
    crit_up: 0,
    gained_atb: 0,
    has_potential2: 0,
    poise: 10,
    usp_base: 10,
    usp_layer: 30,
  },
);

export const yvonneChr_0017_yvonne_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_ultimate_skill',
    timelineBlockFrames: 65,
    naturalDurationFrames: 126,
    exclusiveFrame: 64,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: [
              'buff_chr_0017_yvonne_ultimate_skill',
              'buff_chr_0017_yvonne_ultimate_skill_end',
            ],
            reason: 'other',
          }),
        ),
        16,
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
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0017_yvonne_dash_attack'],
            reason: 'other',
          }),
        ),
        3,
      ),
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
        61,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0017_yvonne_potential_4'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: {
                  duration: 'duration',
                  has_potential4: 'has_potential4',
                  ex_usp_up: 'ex_usp_up',
                  has_potential5: 'has_potential5',
                  atk_up: 'atk_up',
                  crit_dmg_up: 'crit_dmg_up',
                },
              }),
            ),
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_ultimate_skill',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: {
                  duration: 'duration',
                  has_potential4: 'has_potential4',
                  ex_usp_up: 'ex_usp_up',
                  has_potential5: 'has_potential5',
                  atk_up: 'atk_up',
                  crit_dmg_up: 'crit_dmg_up',
                },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        80,
      ),
      scheduled(
        0,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0017_yvonne_ultimate_skill',
            childSkillId: 'chr_0017_yvonne_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0017_yvonne_ultimate_skill2',
            childSkillId: 'chr_0017_yvonne_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0017_yvonne_ultimate_skill3',
            childSkillId: 'chr_0017_yvonne_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
        ),
        3,
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
        64,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 61),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        61,
      ),
    ],
    cooldownFrames: 300,
    costs: [{ resource: 'ultimateEnergy', value: 220 }],
    enhancementStateBuffId: 'buff_chr_0017_yvonne_ultimate_skill',
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale_extra: [2.67, 2.94, 3.2, 3.47, 3.74, 4, 4.27, 4.54, 4.8, 5.14, 5.54, 6],
    atk_scale1: [0.089, 0.098, 0.107, 0.116, 0.125, 0.134, 0.143, 0.151, 0.16, 0.172, 0.185, 0.2],
    atk_scale2: [1.33, 1.47, 1.6, 1.73, 1.86, 2, 2.13, 2.26, 2.4, 2.56, 2.76, 3],
    atk_up: 0.3,
    crit_dmg_up: 0.15,
    duration: 7,
    ex_usp_up: 0.3,
    has_potential4: 0,
    has_potential5: 0,
    poise: 20,
  },
);

export const yvonneChr_0017_yvonne_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0017_yvonne_combo_skill',
    timelineBlockFrames: 25,
    naturalDurationFrames: 130,
    exclusiveFrame: 24,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 19, endFrame: 56, skillIds: ['chr_0017_yvonne_normal_skill'] },
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
        0,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0017_yvonne_combo_skill',
            childSkillId: 'chr_0017_yvonne_combo_skill_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
        ),
        3,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.667 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        17,
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
    cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 570, 570, 570, 540],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale_boom: [0.89, 0.98, 1.07, 1.16, 1.25, 1.34, 1.42, 1.51, 1.6, 1.71, 1.85, 2],
    atk_scale_tick: [0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.93, 1],
    cam_angle: 0,
    cam_angle2: 0,
    cam_duration: 0,
    cam_duration2: 0,
    duration: 3,
    has_potential1: 0,
    input_angle: 0,
    input_angle2: 0,
    interval: 0.75,
    maxcnt: 4,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    poise: 10,
    radius: 4,
    select_radius: 7,
    usp: 10,
    usp_extra: 10,
  },
);

export const yvonneCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const yvonne: OperatorDefinition = {
  slug: 'yvonne',
  gameId: 'YVONNE',
  rarity: 6,
  weaponType: 'handcannon',
  element: 'cryo',
  role: 'striker',
  mainAttribute: 'intellect',
  secondaryAttribute: 'agility',
  attributes: {
    strength: [8, 24, 40, 57, 74, 82],
    agility: [14, 38, 64, 89, 115, 128],
    intellect: [24, 57, 91, 125, 159, 176],
    will: [10, 30, 52, 73, 94, 105],
    baseAttack: [30, 92, 157, 223, 288, 321],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        yvonneChr_0017_yvonne_attack1,
        yvonneChr_0017_yvonne_attack2,
        yvonneChr_0017_yvonne_attack3,
        yvonneChr_0017_yvonne_attack4,
        yvonneChr_0017_yvonne_attack5,
      ],
      variants: [
        {
          key: 'enhancedBasicAttack',
          levelSource: 'ultimate',
          placementPolicy: {
            kind: 'recursiveInput',
            firstSkillKey: 'chr_0017_yvonne_ult_attack1_1',
            terminalSkillKey: 'chr_0017_yvonne_ult_attack_end',
            maxSegments: 24,
            fallback: 'sequence',
          },
          libraryNameQualifier: 'enhanced',
          skills: [
            yvonneChr_0017_yvonne_ult_attack1_1,
            yvonneChr_0017_yvonne_ult_attack2_1,
            yvonneChr_0017_yvonne_ult_attack2_2,
            yvonneChr_0017_yvonne_ult_attack3_1,
            yvonneChr_0017_yvonne_ult_attack3_2,
            yvonneChr_0017_yvonne_ult_attack_end,
          ],
        },
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: yvonneChr_0017_yvonne_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: yvonneChr_0017_yvonne_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: yvonneChr_0017_yvonne_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: yvonneChr_0017_yvonne_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: yvonneChr_0017_yvonne_combo_skill,
    },
  ],
  dodgeSkill: yvonneCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0017_yvonne_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0017_yvonne_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0017_yvonne_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0017_yvonne_attack1',
        'chr_0017_yvonne_attack2',
        'chr_0017_yvonne_attack3',
        'chr_0017_yvonne_attack4',
        'chr_0017_yvonne_attack5',
        'chr_0017_yvonne_plunging_attack_end',
        'chr_0017_yvonne_power_attack',
        'chr_0017_yvonne_ult_attack1_1',
        'chr_0017_yvonne_ult_attack2_1',
        'chr_0017_yvonne_ult_attack2_2',
        'chr_0017_yvonne_ult_attack3_1',
        'chr_0017_yvonne_ult_attack3_2',
        'chr_0017_yvonne_ult_attack_end',
      ],
      normalAttackSkillKeys: [
        'chr_0017_yvonne_attack1',
        'chr_0017_yvonne_attack2',
        'chr_0017_yvonne_attack3',
        'chr_0017_yvonne_attack4',
        'chr_0017_yvonne_attack5',
      ],
      defaultSkillKey: 'chr_0017_yvonne_attack1',
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
        'chr_0017_yvonne_ult_attack1_1',
        'chr_0017_yvonne_ult_attack2_1',
        'chr_0017_yvonne_ult_attack2_2',
        'chr_0017_yvonne_ult_attack3_1',
        'chr_0017_yvonne_ult_attack3_2',
      ],
      commandMappings: { basicAttack: { skillId: 'chr_0017_yvonne_ult_attack1_1' } },
    },
    {
      modeId: 'ult_end',
      modeLayer: 'default',
      defaultEnabled: false,
      commandMappings: { basicAttack: { skillId: 'chr_0017_yvonne_ult_attack3_2' } },
    },
    {
      modeId: 'talent_1',
      modeLayer: 'default',
      defaultEnabled: false,
      commandMappings: { basicAttack: { skillId: 'chr_0017_yvonne_attack5' } },
    },
  ],
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0017_yvonne_combo_skill',
      event: 'beforeTakeDamage',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalAttackLastCombo'] },
          sequence(
            branch(
              { kind: 'eventSourceControlled' },
              sequence(
                branch(
                  {
                    kind: 'contextTargetEntityTagMatch',
                    contextKey: 'trigger',
                    tagQueryType: 'hasAny',
                    tags: ['Skill/Character/Common/SpellStatus/Frozen'],
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
          key: 'chr_0017_yvonne_talent_1',
          blackboard: { dmg_up: [0, 0.5] },
          enableSequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0017_yvonne_talent_1',
              target: 'caster',
              inheritSourceSkillCastInfo: false,
              blackboardAssignments: { dmg_up: { kind: 'blackboard', key: 'dmg_up' } },
            }),
          ),
        },
      ],
    },
    {
      levels: 2,
      passiveSkills: [
        {
          key: 'chr_0017_yvonne_talent_0',
          blackboard: { inflict_up: [0.1, 0.2], status_up: [0.2, 0.4] },
          enableSequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0017_yvonne_talent_0',
              target: 'caster',
              inheritSourceSkillCastInfo: false,
              blackboardAssignments: {
                inflict_up: { kind: 'blackboard', key: 'inflict_up' },
                status_up: { kind: 'blackboard', key: 'status_up' },
              },
            }),
          ),
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
          skillGroupKey: 'comboSkill',
          blackboardKey: 'has_potential1',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'radius',
          operation: 'assign',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'interval',
          operation: 'assign',
          value: 0.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'maxcnt',
          operation: 'assign',
          value: 6,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'usp_extra',
          operation: 'assign',
          value: 25,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 20 },
        { kind: 'modifyBasePanelStat', stat: 'criticalRate', operation: 'flat', value: 0.07 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0017_yvonne_talent_0',
          blackboardKey: 'inflict_up',
          operation: 'add',
          value: 0.1,
        },
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0017_yvonne_talent_0',
          blackboardKey: 'status_up',
          operation: 'add',
          value: 0.2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atb_return',
          operation: 'assign',
          value: 10,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'has_potential2',
          operation: 'assign',
          value: 1,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'has_potential5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 0.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'crit_dmg_up',
          operation: 'assign',
          value: 0.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0017_yvonne_ult_attack_end',
          blackboardKey: 'crit_dmg_up',
          operation: 'assign',
          value: 0.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0017_yvonne_ult_attack_end',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 0.1,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0017_yvonne_combo_skill: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 0,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: { blackboardKey: 'interval' },
      waitFirstTriggerInterval: false,
      maxTriggerCount: { blackboardKey: 'maxcnt' },
      applyTags: [],
      extendTags: [],
      blackboard: {
        atk_multiplier: 1.5,
        atk_scale_boom: 0,
        atk_scale_tick: 0,
        count: 2,
        duration: 0,
        has_added_usp: 0,
        has_potential1: 0,
        interval: 0.75,
        maxcnt: 4,
        poise: 0,
        radius: 0,
        usp: 10,
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
              forEachTarget(
                'enemy',
                sequence(
                  branch(
                    {
                      kind: 'entityTagMatch',
                      target: 'enemy',
                      tagQueryType: 'hasAny',
                      tags: ['Skill/Character/Common/SpellStatus/Frozen'],
                    },
                    sequence(
                      step(
                        'dealDamage',
                        {
                          damageType: 'cryo',
                          attackScale: { kind: 'blackboard', key: 'atk_scale_tick' },
                          tags: ['comboSkill'],
                        },
                        'buff_chr_0017_yvonne_combo_skill:/lifecycleSequences/trigger/steps/0/body/steps/0/body/steps/0/whenTrue/steps/0',
                      ),
                    ),
                    sequence(
                      branch(
                        {
                          kind: 'buffIdStackCompare',
                          target: 'enemy',
                          buffIds: ['buff_common_energy_shard_attached_cryst'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_tick' },
                              tags: ['comboSkill'],
                            },
                            'buff_chr_0017_yvonne_combo_skill:/lifecycleSequences/trigger/steps/0/body/steps/0/body/steps/0/whenFalse/steps/0/whenTrue/steps/0',
                          ),
                        ),
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'cryo',
                              attackScale: { kind: 'blackboard', key: 'atk_scale_tick' },
                              tags: ['comboSkill'],
                            },
                            'buff_chr_0017_yvonne_combo_skill:/lifecycleSequences/trigger/steps/0/body/steps/0/body/steps/0/whenFalse/steps/0/whenFalse/steps/0',
                          ),
                        ),
                        { alwaysNext: true },
                      ),
                    ),
                    { alwaysNext: true },
                  ),
                ),
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'has_added_usp', fallback: 0 },
                  operator: 'less',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'has_added_usp',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  }),
                  step('changeResourceByActionValue', {
                    resource: 'ultimateEnergy',
                    amount: { kind: 'blackboard', key: 'usp' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'caster',
                  }),
                ),
                undefined,
                { alwaysNext: true },
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
              step('modifyActionValue', {
                key: 'count',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
          },
        ),
        finish: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_combo_skill_finish',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_scale_boom: 'atk_scale_boom',
              radius: 'radius',
              has_potential1: 'has_potential1',
              poise: 'poise',
              had_added_usp: 'has_added_usp',
              usp: 'usp',
            },
          }),
        ),
      },
    },
    buff_chr_0017_yvonne_combo_skill_finish: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 0,
      durationSeconds: 0.72,
      triggerIntervalSeconds: 0.5,
      waitFirstTriggerInterval: true,
      maxTriggerCount: 999,
      applyTags: [],
      extendTags: [],
      blackboard: {
        atk_scale_boom: 0,
        atk_scale_tick: 0,
        count: 0,
        duration: 0,
        had_added_usp: 0,
        has_potential1: 0,
        poise: 0,
        radius: 0,
        usp: 0,
      },
      attributeModifiers: [],
      lifecycleSequences: {
        trigger: sequence(
          step('applyBuff', {
            buffId: 'buff_common_cryst_cryst_frozen_triggered',
            target: 'enemy',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              count: { kind: 'constant', value: 1 },
              extra_duration: { kind: 'constant', value: 2 },
            },
          }),
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale_boom' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'buff_chr_0017_yvonne_combo_skill_finish:/lifecycleSequences/trigger/steps/1',
          ),
          branch(
            {
              kind: 'not',
              condition: {
                kind: 'actionValueCompare',
                left: { kind: 'blackboard', key: 'had_added_usp', fallback: 0 },
                operator: 'equal',
                right: { kind: 'constant', value: 1 },
              },
            },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'blackboard', key: 'usp' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'caster',
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        finish: sequence(step('finishCurrentAbilityEntity', {})),
      },
    },
    buff_chr_0017_yvonne_normal_skill_frozen: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 1,
      triggerIntervalSeconds: 0.5,
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale2: 1, crit_up: 0.7 },
      attributeModifiers: [],
    },
    buff_chr_0017_yvonne_normal_skill_listener: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      triggerIntervalSeconds: 0,
      waitFirstTriggerInterval: false,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale2: 0, crit_up: 0 },
      attributeModifiers: [],
      lifecycleSequences: { enable: sequence(step('skillAffix', {})) },
      abilityEventResponses: [
        {
          event: 'beforeOutputBuff',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'eventBuffTagsMatch',
                match: 'hasAny',
                buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
              },
              sequence(
                branch(
                  { kind: 'eventSkillCastMatchesBuffSource' },
                  sequence(
                    step('applyBuff', {
                      buffId: 'buff_chr_0017_yvonne_normal_skill_frozen',
                      target: 'eventTarget',
                      source: 'buffSource',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: { crit_up: 'crit_up', atk_scale2: 'atk_scale2' },
                    }),
                  ),
                ),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0017_yvonne_normal_skill_projectile: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {
        atb_return: 0,
        atk_scale: 0,
        atk_scale_layer: 0,
        atk_scale2: 0,
        consume_cnt: 0,
        count: 0,
        gained_atb: 0,
        has_potential2: 0,
        poise: 0,
        usp_base: 0,
        usp_layer: 0,
      },
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(
          branch(
            {
              kind: 'entityTagMatch',
              target: 'buffOwner',
              tagQueryType: 'exceptAny',
              tags: [
                'Status/Immobilized',
                'Status/InCommonInteraction',
                'GameplayState/Interacting/BambooRaft/OnBoat',
                'Status/Ability/Skill/CantCastAnySkill',
                'GameplayState/Interacting/Bomb/Create',
                'Status/InCommonInteractionCanMove',
                'Status/Silence',
                'Status/DisableNormalSkill',
              ],
            },
            sequence(
              withActionBlackboardScope(
                'BuffData.buff_chr_0017_yvonne_normal_skill_projectile.buffEventAction[1].actions[0].actionData[1]:projectile_chr_0017_yvonne_normal_skill',
                {},
                true,
                sequence({
                  kind: 'launchProjectile',
                  parameters: {
                    finish: 5,
                    source: 'actionOwner',
                    recycleDelaySeconds: 0.0333333350718021,
                    hit: { finishOnHit: true },
                  },
                  callbacks: [
                    {
                      event: 'hit',
                      skill: {
                        skillId: 'chr_0017_yvonne_normal_skill_projhit',
                        nativeSkillType: 'normalSkill',
                        naturalDurationFrames: 1,
                        castResource: {
                          costFrame: 0,
                          cooldownSeconds: 0,
                          maxChargeTime: 1,
                          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                        },
                        blackboard: {
                          atb_return: 10,
                          atk_scale: 0,
                          atk_scale_final: 0,
                          atk_scale_layer: 0,
                          atk_scale2: 2,
                          count: 0,
                          crit_up: 0.7,
                          has_potential2: 0,
                          max_count: 0,
                          poise: 30,
                          usp_base: 20,
                          usp_final: 0,
                          usp_layer: 10,
                        },
                        scheduledSequences: [
                          scheduled(0, sequence(), 3),
                          scheduled(
                            0,
                            sequence(
                              branch(
                                {
                                  kind: 'actionValueCompare',
                                  left: { kind: 'blackboard', key: 'has_potential2', fallback: 0 },
                                  operator: 'greaterOrEqual',
                                  right: { kind: 'constant', value: 1 },
                                },
                                sequence(
                                  forEachTarget(
                                    'enemy',
                                    sequence(
                                      branch(
                                        {
                                          kind: 'buffStackCompare',
                                          target: 'enemy',
                                          tagQueryType: 'hasAny',
                                          buffTags: [
                                            'Skill/Character/Common/SpellInflict/CrystInflict',
                                            'Skill/Character/Common/SpellInflict/NaturalInflict',
                                          ],
                                          operator: 'greaterOrEqual',
                                          value: { kind: 'constant', value: 1 },
                                        },
                                        sequence(
                                          branch(
                                            {
                                              kind: 'buffStackCompare',
                                              target: 'enemy',
                                              tagQueryType: 'hasAny',
                                              buffTags: [
                                                'Skill/Character/Common/SpellInflict/CrystInflict',
                                              ],
                                              operator: 'greaterOrEqual',
                                              value: { kind: 'constant', value: 1 },
                                            },
                                            sequence(
                                              step('readBuffStackCount', {
                                                target: 'enemy',
                                                outputKey: 'count',
                                                query: {
                                                  kind: 'tag',
                                                  tagQueryType: 'hasAny',
                                                  buffTags: [
                                                    'Skill/Character/Common/SpellInflict/CrystInflict',
                                                  ],
                                                },
                                              }),
                                              branch(
                                                {
                                                  kind: 'buffStackCompare',
                                                  target: 'enemy',
                                                  tagQueryType: 'hasAny',
                                                  buffTags: [
                                                    'Skill/Character/Common/SpellInflict/CrystInflict',
                                                  ],
                                                  operator: 'greaterOrEqual',
                                                  value: { kind: 'blackboard', key: 'count' },
                                                },
                                                sequence(
                                                  step('finishBuffsByTag', {
                                                    target: 'enemy',
                                                    tagQueryType: 'hasAny',
                                                    buffTags: [
                                                      'Skill/Character/Common/SpellInflict/CrystInflict',
                                                    ],
                                                    reason: 'early',
                                                    count: { kind: 'blackboard', key: 'count' },
                                                  }),
                                                  step('applyBuff', {
                                                    buffId:
                                                      'buff_common_cryst_cryst_frozen_triggered',
                                                    target: 'enemy',
                                                    inheritSourceSkillCastInfo: true,
                                                    blackboardAssignments: {
                                                      consumed_type: { kind: 'constant', value: 2 },
                                                      consumed_layer: {
                                                        kind: 'blackboard',
                                                        key: 'count',
                                                      },
                                                      count: { kind: 'blackboard', key: 'count' },
                                                    },
                                                  }),
                                                ),
                                              ),
                                              step('calculateActionValue', {
                                                key: 'atk_scale_final',
                                                operation: 'multiply',
                                                left: {
                                                  kind: 'blackboard',
                                                  key: 'atk_scale_layer',
                                                },
                                                right: { kind: 'blackboard', key: 'count' },
                                              }),
                                              step('modifyActionValue', {
                                                key: 'atk_scale_final',
                                                operation: 'add',
                                                value: { kind: 'blackboard', key: 'atk_scale' },
                                              }),
                                              step('modifyActionValue', {
                                                key: 'atk_scale_final',
                                                operation: 'add',
                                                value: { kind: 'blackboard', key: 'atk_scale2' },
                                              }),
                                              step('changeResourceByActionValue', {
                                                resource: 'sp',
                                                amount: { kind: 'blackboard', key: 'atb_return' },
                                                coefficient: { kind: 'constant', value: 1 },
                                                recipient: 'team',
                                                spGainKind: 'refund',
                                                spGainSource: 'skill',
                                              }),
                                              step(
                                                'dealDamage',
                                                {
                                                  damageType: 'cryo',
                                                  attackScale: {
                                                    kind: 'blackboard',
                                                    key: 'atk_scale_final',
                                                  },
                                                  tags: ['normalSkill'],
                                                  features: ['canBreakWeakness'],
                                                  stagger: { kind: 'blackboard', key: 'poise' },
                                                },
                                                'buff_chr_0017_yvonne_normal_skill_projectile:/lifecycleSequences/finish/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0/whenTrue/steps/0/body/steps/0/whenTrue/steps/0/whenTrue/steps/6',
                                              ),
                                              branch(
                                                {
                                                  kind: 'actionValueCompare',
                                                  left: {
                                                    kind: 'blackboard',
                                                    key: 'count',
                                                    fallback: 0,
                                                  },
                                                  operator: 'greater',
                                                  right: {
                                                    kind: 'blackboard',
                                                    key: 'max_count',
                                                    fallback: 0,
                                                  },
                                                },
                                                sequence(
                                                  step('modifyActionValue', {
                                                    key: 'max_count',
                                                    operation: 'assign',
                                                    value: { kind: 'blackboard', key: 'count' },
                                                  }),
                                                ),
                                              ),
                                            ),
                                            sequence(
                                              step('readBuffStackCount', {
                                                target: 'enemy',
                                                outputKey: 'count',
                                                query: {
                                                  kind: 'tag',
                                                  tagQueryType: 'hasAny',
                                                  buffTags: [
                                                    'Skill/Character/Common/SpellInflict/NaturalInflict',
                                                  ],
                                                },
                                              }),
                                              branch(
                                                {
                                                  kind: 'buffStackCompare',
                                                  target: 'enemy',
                                                  tagQueryType: 'hasAny',
                                                  buffTags: [
                                                    'Skill/Character/Common/SpellInflict/NaturalInflict',
                                                  ],
                                                  operator: 'greaterOrEqual',
                                                  value: { kind: 'blackboard', key: 'count' },
                                                },
                                                sequence(
                                                  step('finishBuffsByTag', {
                                                    target: 'enemy',
                                                    tagQueryType: 'hasAny',
                                                    buffTags: [
                                                      'Skill/Character/Common/SpellInflict/NaturalInflict',
                                                    ],
                                                    reason: 'early',
                                                    count: { kind: 'blackboard', key: 'count' },
                                                  }),
                                                  step('applyBuff', {
                                                    buffId:
                                                      'buff_common_cryst_cryst_frozen_triggered',
                                                    target: 'enemy',
                                                    inheritSourceSkillCastInfo: true,
                                                    blackboardAssignments: {
                                                      consumed_type: { kind: 'constant', value: 3 },
                                                      consumed_layer: {
                                                        kind: 'blackboard',
                                                        key: 'count',
                                                      },
                                                      count: { kind: 'blackboard', key: 'count' },
                                                    },
                                                  }),
                                                ),
                                              ),
                                              step('calculateActionValue', {
                                                key: 'atk_scale_final',
                                                operation: 'multiply',
                                                left: {
                                                  kind: 'blackboard',
                                                  key: 'atk_scale_layer',
                                                },
                                                right: { kind: 'blackboard', key: 'count' },
                                              }),
                                              step('modifyActionValue', {
                                                key: 'atk_scale_final',
                                                operation: 'add',
                                                value: { kind: 'blackboard', key: 'atk_scale' },
                                              }),
                                              step('modifyActionValue', {
                                                key: 'atk_scale_final',
                                                operation: 'add',
                                                value: { kind: 'blackboard', key: 'atk_scale2' },
                                              }),
                                              step('changeResourceByActionValue', {
                                                resource: 'sp',
                                                amount: { kind: 'blackboard', key: 'atb_return' },
                                                coefficient: { kind: 'constant', value: 1 },
                                                recipient: 'team',
                                                spGainKind: 'refund',
                                                spGainSource: 'skill',
                                              }),
                                              step(
                                                'dealDamage',
                                                {
                                                  damageType: 'cryo',
                                                  attackScale: {
                                                    kind: 'blackboard',
                                                    key: 'atk_scale_final',
                                                  },
                                                  tags: ['normalSkill'],
                                                  features: ['canBreakWeakness'],
                                                  stagger: { kind: 'blackboard', key: 'poise' },
                                                },
                                                'buff_chr_0017_yvonne_normal_skill_projectile:/lifecycleSequences/finish/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0/whenTrue/steps/0/body/steps/0/whenTrue/steps/0/whenFalse/steps/6',
                                              ),
                                              branch(
                                                {
                                                  kind: 'actionValueCompare',
                                                  left: {
                                                    kind: 'blackboard',
                                                    key: 'count',
                                                    fallback: 0,
                                                  },
                                                  operator: 'greater',
                                                  right: {
                                                    kind: 'blackboard',
                                                    key: 'max_count',
                                                    fallback: 0,
                                                  },
                                                },
                                                sequence(
                                                  step('modifyActionValue', {
                                                    key: 'max_count',
                                                    operation: 'assign',
                                                    value: { kind: 'blackboard', key: 'count' },
                                                  }),
                                                ),
                                              ),
                                            ),
                                            { alwaysNext: true },
                                          ),
                                        ),
                                        sequence(
                                          step('modifyActionValue', {
                                            key: 'atk_scale_final',
                                            operation: 'assign',
                                            value: { kind: 'blackboard', key: 'atk_scale' },
                                          }),
                                          step('changeResourceByActionValue', {
                                            resource: 'sp',
                                            amount: { kind: 'blackboard', key: 'atb_return' },
                                            coefficient: { kind: 'constant', value: 1 },
                                            recipient: 'team',
                                            spGainKind: 'refund',
                                            spGainSource: 'skill',
                                          }),
                                          step(
                                            'dealDamage',
                                            {
                                              damageType: 'cryo',
                                              attackScale: {
                                                kind: 'blackboard',
                                                key: 'atk_scale_final',
                                              },
                                              tags: ['normalSkill'],
                                              features: ['canBreakWeakness'],
                                              stagger: { kind: 'blackboard', key: 'poise' },
                                            },
                                            'buff_chr_0017_yvonne_normal_skill_projectile:/lifecycleSequences/finish/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0/whenTrue/steps/0/body/steps/0/whenFalse/steps/2',
                                          ),
                                          branch(
                                            {
                                              kind: 'actionValueCompare',
                                              left: {
                                                kind: 'blackboard',
                                                key: 'count',
                                                fallback: 0,
                                              },
                                              operator: 'greater',
                                              right: {
                                                kind: 'blackboard',
                                                key: 'max_count',
                                                fallback: 0,
                                              },
                                            },
                                            sequence(
                                              step('modifyActionValue', {
                                                key: 'max_count',
                                                operation: 'assign',
                                                value: { kind: 'blackboard', key: 'count' },
                                              }),
                                            ),
                                          ),
                                        ),
                                        { alwaysNext: true },
                                      ),
                                    ),
                                  ),
                                  step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
                                  branch(
                                    {
                                      kind: 'actionValueCompare',
                                      left: { kind: 'blackboard', key: 'max_count', fallback: 0 },
                                      operator: 'greater',
                                      right: { kind: 'constant', value: 0 },
                                    },
                                    sequence(
                                      step('calculateActionValue', {
                                        key: 'usp_final',
                                        operation: 'multiply',
                                        left: { kind: 'blackboard', key: 'usp_layer' },
                                        right: { kind: 'blackboard', key: 'max_count' },
                                      }),
                                      step('modifyActionValue', {
                                        key: 'usp_final',
                                        operation: 'add',
                                        value: { kind: 'blackboard', key: 'usp_base' },
                                      }),
                                      step('changeResourceByActionValue', {
                                        resource: 'ultimateEnergy',
                                        amount: { kind: 'blackboard', key: 'usp_final' },
                                        coefficient: { kind: 'constant', value: 1 },
                                        recipient: 'caster',
                                      }),
                                    ),
                                    undefined,
                                    { alwaysNext: true },
                                  ),
                                ),
                                sequence(
                                  forEachTarget(
                                    'enemy',
                                    sequence(
                                      branch(
                                        {
                                          kind: 'buffStackCompare',
                                          target: 'enemy',
                                          tagQueryType: 'hasAny',
                                          buffTags: [
                                            'Skill/Character/Common/SpellInflict/CrystInflict',
                                            'Skill/Character/Common/SpellInflict/NaturalInflict',
                                          ],
                                          operator: 'greaterOrEqual',
                                          value: { kind: 'constant', value: 1 },
                                        },
                                        sequence(
                                          branch(
                                            {
                                              kind: 'buffStackCompare',
                                              target: 'enemy',
                                              tagQueryType: 'hasAny',
                                              buffTags: [
                                                'Skill/Character/Common/SpellInflict/CrystInflict',
                                              ],
                                              operator: 'greaterOrEqual',
                                              value: { kind: 'constant', value: 1 },
                                            },
                                            sequence(
                                              step('readBuffStackCount', {
                                                target: 'enemy',
                                                outputKey: 'count',
                                                query: {
                                                  kind: 'tag',
                                                  tagQueryType: 'hasAny',
                                                  buffTags: [
                                                    'Skill/Character/Common/SpellInflict/CrystInflict',
                                                  ],
                                                },
                                              }),
                                              branch(
                                                {
                                                  kind: 'buffStackCompare',
                                                  target: 'enemy',
                                                  tagQueryType: 'hasAny',
                                                  buffTags: [
                                                    'Skill/Character/Common/SpellInflict/CrystInflict',
                                                  ],
                                                  operator: 'greaterOrEqual',
                                                  value: { kind: 'blackboard', key: 'count' },
                                                },
                                                sequence(
                                                  step('finishBuffsByTag', {
                                                    target: 'enemy',
                                                    tagQueryType: 'hasAny',
                                                    buffTags: [
                                                      'Skill/Character/Common/SpellInflict/CrystInflict',
                                                    ],
                                                    reason: 'early',
                                                    count: { kind: 'blackboard', key: 'count' },
                                                  }),
                                                  step('applyBuff', {
                                                    buffId:
                                                      'buff_common_cryst_cryst_frozen_triggered',
                                                    target: 'enemy',
                                                    inheritSourceSkillCastInfo: true,
                                                    blackboardAssignments: {
                                                      consumed_type: { kind: 'constant', value: 2 },
                                                      consumed_layer: {
                                                        kind: 'blackboard',
                                                        key: 'count',
                                                      },
                                                      count: { kind: 'blackboard', key: 'count' },
                                                    },
                                                  }),
                                                ),
                                              ),
                                              step('calculateActionValue', {
                                                key: 'atk_scale_final',
                                                operation: 'multiply',
                                                left: {
                                                  kind: 'blackboard',
                                                  key: 'atk_scale_layer',
                                                },
                                                right: { kind: 'blackboard', key: 'count' },
                                              }),
                                              step('modifyActionValue', {
                                                key: 'atk_scale_final',
                                                operation: 'add',
                                                value: { kind: 'blackboard', key: 'atk_scale' },
                                              }),
                                              step('modifyActionValue', {
                                                key: 'atk_scale_final',
                                                operation: 'add',
                                                value: { kind: 'blackboard', key: 'atk_scale2' },
                                              }),
                                              step(
                                                'dealDamage',
                                                {
                                                  damageType: 'cryo',
                                                  attackScale: {
                                                    kind: 'blackboard',
                                                    key: 'atk_scale_final',
                                                  },
                                                  tags: ['normalSkill'],
                                                  features: ['canBreakWeakness'],
                                                  stagger: { kind: 'blackboard', key: 'poise' },
                                                },
                                                'buff_chr_0017_yvonne_normal_skill_projectile:/lifecycleSequences/finish/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0/whenFalse/steps/0/body/steps/0/whenTrue/steps/0/whenTrue/steps/5',
                                              ),
                                              branch(
                                                {
                                                  kind: 'actionValueCompare',
                                                  left: {
                                                    kind: 'blackboard',
                                                    key: 'count',
                                                    fallback: 0,
                                                  },
                                                  operator: 'greater',
                                                  right: {
                                                    kind: 'blackboard',
                                                    key: 'max_count',
                                                    fallback: 0,
                                                  },
                                                },
                                                sequence(
                                                  step('modifyActionValue', {
                                                    key: 'max_count',
                                                    operation: 'assign',
                                                    value: { kind: 'blackboard', key: 'count' },
                                                  }),
                                                ),
                                              ),
                                            ),
                                            sequence(
                                              step('readBuffStackCount', {
                                                target: 'enemy',
                                                outputKey: 'count',
                                                query: {
                                                  kind: 'tag',
                                                  tagQueryType: 'hasAny',
                                                  buffTags: [
                                                    'Skill/Character/Common/SpellInflict/NaturalInflict',
                                                  ],
                                                },
                                              }),
                                              branch(
                                                {
                                                  kind: 'buffStackCompare',
                                                  target: 'enemy',
                                                  tagQueryType: 'hasAny',
                                                  buffTags: [
                                                    'Skill/Character/Common/SpellInflict/NaturalInflict',
                                                  ],
                                                  operator: 'greaterOrEqual',
                                                  value: { kind: 'blackboard', key: 'count' },
                                                },
                                                sequence(
                                                  step('finishBuffsByTag', {
                                                    target: 'enemy',
                                                    tagQueryType: 'hasAny',
                                                    buffTags: [
                                                      'Skill/Character/Common/SpellInflict/NaturalInflict',
                                                    ],
                                                    reason: 'early',
                                                    count: { kind: 'blackboard', key: 'count' },
                                                  }),
                                                  step('applyBuff', {
                                                    buffId:
                                                      'buff_common_cryst_cryst_frozen_triggered',
                                                    target: 'enemy',
                                                    inheritSourceSkillCastInfo: true,
                                                    blackboardAssignments: {
                                                      consumed_type: { kind: 'constant', value: 3 },
                                                      consumed_layer: {
                                                        kind: 'blackboard',
                                                        key: 'count',
                                                      },
                                                      count: { kind: 'blackboard', key: 'count' },
                                                    },
                                                  }),
                                                ),
                                              ),
                                              step('calculateActionValue', {
                                                key: 'atk_scale_final',
                                                operation: 'multiply',
                                                left: {
                                                  kind: 'blackboard',
                                                  key: 'atk_scale_layer',
                                                },
                                                right: { kind: 'blackboard', key: 'count' },
                                              }),
                                              step('modifyActionValue', {
                                                key: 'atk_scale_final',
                                                operation: 'add',
                                                value: { kind: 'blackboard', key: 'atk_scale' },
                                              }),
                                              step('modifyActionValue', {
                                                key: 'atk_scale_final',
                                                operation: 'add',
                                                value: { kind: 'blackboard', key: 'atk_scale2' },
                                              }),
                                              step(
                                                'dealDamage',
                                                {
                                                  damageType: 'cryo',
                                                  attackScale: {
                                                    kind: 'blackboard',
                                                    key: 'atk_scale_final',
                                                  },
                                                  tags: ['normalSkill'],
                                                  features: ['canBreakWeakness'],
                                                  stagger: { kind: 'blackboard', key: 'poise' },
                                                },
                                                'buff_chr_0017_yvonne_normal_skill_projectile:/lifecycleSequences/finish/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0/whenFalse/steps/0/body/steps/0/whenTrue/steps/0/whenFalse/steps/5',
                                              ),
                                              branch(
                                                {
                                                  kind: 'actionValueCompare',
                                                  left: {
                                                    kind: 'blackboard',
                                                    key: 'count',
                                                    fallback: 0,
                                                  },
                                                  operator: 'greater',
                                                  right: {
                                                    kind: 'blackboard',
                                                    key: 'max_count',
                                                    fallback: 0,
                                                  },
                                                },
                                                sequence(
                                                  step('modifyActionValue', {
                                                    key: 'max_count',
                                                    operation: 'assign',
                                                    value: { kind: 'blackboard', key: 'count' },
                                                  }),
                                                ),
                                              ),
                                            ),
                                            { alwaysNext: true },
                                          ),
                                        ),
                                        sequence(
                                          step('modifyActionValue', {
                                            key: 'atk_scale_final',
                                            operation: 'assign',
                                            value: { kind: 'blackboard', key: 'atk_scale' },
                                          }),
                                          step(
                                            'dealDamage',
                                            {
                                              damageType: 'cryo',
                                              attackScale: {
                                                kind: 'blackboard',
                                                key: 'atk_scale_final',
                                              },
                                              tags: ['normalSkill'],
                                              features: ['canBreakWeakness'],
                                              stagger: { kind: 'blackboard', key: 'poise' },
                                            },
                                            'buff_chr_0017_yvonne_normal_skill_projectile:/lifecycleSequences/finish/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/0/whenFalse/steps/0/body/steps/0/whenFalse/steps/1',
                                          ),
                                          branch(
                                            {
                                              kind: 'actionValueCompare',
                                              left: {
                                                kind: 'blackboard',
                                                key: 'count',
                                                fallback: 0,
                                              },
                                              operator: 'greater',
                                              right: {
                                                kind: 'blackboard',
                                                key: 'max_count',
                                                fallback: 0,
                                              },
                                            },
                                            sequence(
                                              step('modifyActionValue', {
                                                key: 'max_count',
                                                operation: 'assign',
                                                value: { kind: 'blackboard', key: 'count' },
                                              }),
                                            ),
                                          ),
                                        ),
                                        { alwaysNext: true },
                                      ),
                                    ),
                                  ),
                                  step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
                                  branch(
                                    {
                                      kind: 'actionValueCompare',
                                      left: { kind: 'blackboard', key: 'max_count', fallback: 0 },
                                      operator: 'greater',
                                      right: { kind: 'constant', value: 0 },
                                    },
                                    sequence(
                                      step('calculateActionValue', {
                                        key: 'usp_final',
                                        operation: 'multiply',
                                        left: { kind: 'blackboard', key: 'usp_layer' },
                                        right: { kind: 'blackboard', key: 'max_count' },
                                      }),
                                      step('modifyActionValue', {
                                        key: 'usp_final',
                                        operation: 'add',
                                        value: { kind: 'blackboard', key: 'usp_base' },
                                      }),
                                      step('changeResourceByActionValue', {
                                        resource: 'ultimateEnergy',
                                        amount: { kind: 'blackboard', key: 'usp_final' },
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
                            3,
                          ),
                          scheduled(0, sequence(), 60),
                          scheduled(0, sequence(), 60),
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
    },
    buff_chr_0017_yvonne_potential_5_cd: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'cd' },
      applyTags: [],
      extendTags: [],
      blackboard: { cd: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0017_yvonne_potential_5_effect'],
            reason: 'other',
          }),
        ),
        finish: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_potential_5_effect',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          }),
        ),
      },
    },
    buff_chr_0017_yvonne_potential_5_effect: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0017_yvonne_potential_5_new: {
      stackingType: 'highPriority',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_up: 0, crit_dmg_up: 0 },
      attributeModifiers: [
        { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
        {
          attribute: 'criticalDamageIncrease',
          slot: 'baseAddition',
          value: { blackboardKey: 'crit_dmg_up' },
        },
      ],
    },
    buff_chr_0017_yvonne_power_attack: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0017_yvonne_talent_0: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { inflict_up: 0, status_up: 0 },
      attributeModifiers: [],
      damageModifiers: [
        {
          enabledSide: 'attacker',
          condition: {
            kind: 'all',
            conditions: [
              {
                kind: 'entityTagMatch',
                target: 'enemy',
                tagQueryType: 'hasAny',
                tags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
              },
              {
                kind: 'entityTagMatch',
                target: 'enemy',
                tagQueryType: 'exceptAny',
                tags: ['Skill/Character/Common/SpellStatus/Frozen'],
              },
            ],
          },
          processors: [
            {
              kind: 'instantAttribute',
              targetSide: 'attacker',
              attribute: 'criticalDamageIncrease',
              values: { slot: 'baseAddition', value: { blackboardKey: 'inflict_up' } },
              attributeTiming: 'runtime',
            },
          ],
        },
        {
          enabledSide: 'attacker',
          condition: {
            kind: 'all',
            conditions: [
              {
                kind: 'entityTagMatch',
                target: 'enemy',
                tagQueryType: 'hasAny',
                tags: ['Skill/Character/Common/SpellStatus/Frozen'],
              },
              {
                kind: 'entityTagMatch',
                target: 'enemy',
                tagQueryType: 'exceptAny',
                tags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
              },
            ],
          },
          processors: [
            {
              kind: 'instantAttribute',
              targetSide: 'attacker',
              attribute: 'criticalDamageIncrease',
              values: { slot: 'baseAddition', value: { blackboardKey: 'status_up' } },
              attributeTiming: 'runtime',
            },
          ],
        },
        {
          enabledSide: 'attacker',
          condition: {
            kind: 'entityTagMatch',
            target: 'enemy',
            tagQueryType: 'hasAll',
            tags: [
              'Skill/Character/Common/SpellInflict/CrystInflict',
              'Skill/Character/Common/SpellStatus/Frozen',
            ],
          },
          processors: [
            {
              kind: 'instantAttribute',
              targetSide: 'attacker',
              attribute: 'criticalDamageIncrease',
              values: { slot: 'baseAddition', value: { blackboardKey: 'status_up' } },
              attributeTiming: 'runtime',
            },
          ],
        },
      ],
    },
    buff_chr_0017_yvonne_talent_1: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { dmg_up: 0.5 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'outputBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0017_yvonne_normal_skill_frozen'] },
              sequence(
                branch(
                  {
                    kind: 'not',
                    condition: {
                      kind: 'timedMarkerPresent',
                      target: 'buffOwner',
                      markerId: 'chr_0017_yvonne_talent_1',
                    },
                  },
                  sequence(
                    step('applyBuff', {
                      buffId: 'buff_chr_0017_yvonne_talent_1_valid',
                      target: 'buffSource',
                      source: 'buffSource',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: { dmg_up: 'dmg_up' },
                    }),
                    step('createTimedMarker', {
                      target: 'buffOwner',
                      markerId: 'chr_0017_yvonne_talent_1',
                      durationSeconds: { kind: 'constant', value: 0.1 },
                      autoFinishByAction: false,
                    }),
                  ),
                ),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0017_yvonne_talent_1_valid: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 4,
      durationSeconds: 15,
      applyTags: [],
      extendTags: [],
      blackboard: { dmg_up: 0.5 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('overrideBasicAttackMapping', { skillId: 'chr_0017_yvonne_attack5' }),
        ),
      },
      abilityEventResponses: [
        {
          event: 'beforeCastSkill',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventSkillIdIn', skillIds: ['chr_0017_yvonne_attack5'] },
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0017_yvonne_talent_1_valid_up',
                  target: 'eventTarget',
                  source: 'buffSource',
                  inheritSourceSkillCastInfo: true,
                  asChildBuff: true,
                  lifetimeOwner: 'currentCastSkill',
                  copiedBlackboardAssignments: { dmg_up: 'dmg_up' },
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0017_yvonne_talent_1_valid_up: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 4,
      applyTags: [],
      extendTags: [],
      blackboard: { dmg_up: 0.5 },
      attributeModifiers: [],
      damageModifiers: [
        {
          enabledSide: 'attacker',
          processors: [
            {
              kind: 'damageScale',
              side: 'attacker',
              zone: 'normal',
              addition: { blackboardKey: 'dmg_up' },
            },
          ],
        },
      ],
    },
    buff_chr_0017_yvonne_ultimate_skill: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_yvonne_buff',
        iconPath: '/icons/icon_battle_yvonne_buff.webp',
        showInHeadBarCommon: false,
        showInHeadBarAttached: false,
        showInSquadIcon: true,
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
        iconStyleInSquad: 'LifeTime',
        abnormalColorType: 'Physical',
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: ['Status/DisableBreakingAttack'],
      extendTags: [],
      blackboard: {
        atk_up: 0,
        crit_dmg_up: 0,
        duration: 0,
        ex_usp_up: 0,
        has_potential4: 0,
        has_potential5: 0,
      },
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
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'has_potential4', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0017_yvonne_ultimate_skill_potential4_valid',
                    target: 'buffSource',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: { ex_usp_up: 'ex_usp_up' },
                  }),
                ),
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
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'has_potential5', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0017_yvonne_potential_5_new',
                    target: 'buffSource',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                    asChildBuff: true,
                    copiedBlackboardAssignments: { atk_up: 'atk_up', crit_dmg_up: 'crit_dmg_up' },
                  }),
                ),
              ),
            ),
          },
        ),
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
              step('changePlayerActionMode', { modeId: 'ult', lifetime: 'finishByAction' }),
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
              step('restrictUltimateEnergyRecovery', {
                target: 'caster',
                allowedRecoveryTags: ['Skill/Character/chr_0017_yvonne/UltimateEndUsp'],
                clearUltimateEnergyOnEnd: false,
              }),
            ),
          },
        ),
        finish: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0017_yvonne_ultimate_skill_end',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_up: 'atk_up',
              crit_dmg_up: 'crit_dmg_up',
              has_potential5: 'has_potential5',
            },
          }),
        ),
      },
    },
    buff_chr_0017_yvonne_ultimate_skill_camera: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      triggerIntervalSeconds: 0.033,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        trigger: sequence(
          branch(
            { kind: 'constant', value: false },
            sequence(
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0017_yvonne_ultimate_skill_camera_child'],
                reason: 'other',
              }),
            ),
          ),
        ),
      },
    },
    buff_chr_0017_yvonne_ultimate_skill_end: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration_end' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_yvonne_buff',
        iconPath: '/icons/icon_battle_yvonne_buff.webp',
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
      applyTags: ['Status/DisableBreakingAttack'],
      extendTags: [],
      blackboard: { atk_up: 0, crit_dmg_up: 0, duration_end: 3, has_potential5: 0 },
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
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'has_potential5', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0017_yvonne_potential_5_new',
                    target: 'buffSource',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                    asChildBuff: true,
                    copiedBlackboardAssignments: { atk_up: 'atk_up', crit_dmg_up: 'crit_dmg_up' },
                  }),
                ),
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
              step('finishBuffsById', {
                target: 'buffOwner',
                buffIds: ['buff_chr_0017_yvonne_ultimate_skill_layer_effect'],
                reason: 'other',
              }),
            ),
          },
        ),
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
              step('overrideBasicAttackMapping', { skillId: 'chr_0017_yvonne_ult_attack_end' }),
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
              step('restrictUltimateEnergyRecovery', {
                target: 'caster',
                allowedRecoveryTags: ['Skill/Character/chr_0017_yvonne/UltimateEndUsp'],
                clearUltimateEnergyOnEnd: false,
              }),
            ),
          },
        ),
        finish: sequence(
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
              step('findOwnerSpawnedAbilityEntities', {
                saveToContextKey: 'robots',
                abilityEntityIds: [
                  'abilityentity_chr_0017_yvonne_ultimate_skill',
                  'abilityentity_chr_0017_yvonne_ultimate_skill2',
                  'abilityentity_chr_0017_yvonne_ultimate_skill3',
                ],
              }),
              forEachContextTarget(
                'robots',
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0017_yvonne_ultimate_skill_robot_end',
                    target: 'currentAbilityEntity',
                    source: 'buffOwner',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
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
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0017_yvonne_ultimate_skill_shield'],
                reason: 'other',
              }),
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0017_yvonne_ultimate_skill_environment'],
                reason: 'other',
              }),
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0017_yvonne_ultimate_skill_potential4_valid'],
                reason: 'other',
              }),
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0017_yvonne_ultimate_skill_full_effect'],
                reason: 'other',
              }),
              step('finishBuffsById', {
                target: 'buffOwner',
                buffIds: ['buff_chr_0017_yvonne_ultimate_skill_layer'],
                reason: 'other',
              }),
              step('finishBuffsById', {
                target: 'buffOwner',
                buffIds: ['buff_chr_0017_yvonne_ultimate_skill_layer_effect'],
                reason: 'other',
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
              step('adjustSkillCooldown', {
                target: 'caster',
                skill: { kind: 'type', skillType: 'ultimate' },
                operation: 'set',
                basis: 'absoluteSeconds',
                value: { kind: 'constant', value: 10 },
              }),
            ),
          },
        ),
      },
    },
    buff_chr_0017_yvonne_ultimate_skill_layer: {
      stackingType: 'enhanceAndRefresh',
      priority: 0,
      maxStackCount: 10,
      durationSeconds: { blackboardKey: 'recycle_time' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_yvonne_buff',
        iconPath: '/icons/icon_battle_yvonne_buff.webp',
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
      blackboard: {
        crit_rate_up: 0.06,
        crit_rate_up_dynamic: 0,
        normal_dmg_up: 0.03,
        recycle_time: 4,
      },
      attributeModifiers: [
        {
          attribute: 'criticalRate',
          slot: 'baseAddition',
          value: { blackboardKey: 'normal_dmg_up' },
        },
        {
          attribute: 'criticalDamageIncrease',
          slot: 'baseAddition',
          value: { blackboardKey: 'crit_rate_up_dynamic' },
        },
      ],
      lifecycleSequences: {
        enhanceChanged: sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'buffOwner',
              buffIds: ['buff_chr_0017_yvonne_ultimate_skill_layer'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 10 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'crit_rate_up_dynamic',
                operation: 'assign',
                value: { kind: 'blackboard', key: 'crit_rate_up' },
              }),
              step('refreshCurrentBuffAttributeModifiers', {}),
            ),
          ),
        ),
      },
    },
    buff_chr_0017_yvonne_ultimate_skill_potential4_valid: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { ex_usp_up: 0, is_recover: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'is_recover', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'blackboard', key: 'ex_usp_up' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'caster',
                isPercentValue: true,
                ultimateRecoveryTag: 'Skill/Character/chr_0017_yvonne/UltimateEndUsp',
              }),
            ),
          ),
        ),
      },
    },
    buff_chr_0017_yvonne_ultimate_skill_robot_end: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: { start: sequence(step('finishCurrentAbilityEntity', {})) },
    },
    buff_chr_0017_yvonne_ultimate_skill_shield: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'effect_duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { effect_duration: 0 },
      attributeModifiers: [],
    },
    buff_chr_0017_yvonne_ultimate_skill_voice: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 9 },
      attributeModifiers: [],
    },
    buff_chr_0017_yvonne_ultimate_skill_voice_short: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 3.5 },
      attributeModifiers: [],
    },
    buff_chr_0017_yvonne_ultimate_skill_voice_start: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 9 },
      attributeModifiers: [],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0017_yvonne_combo_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 50 },
      childSkill: {
        skillId: 'chr_0017_yvonne_combo_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 3000,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale_boom: 0,
          atk_scale_tick: 0,
          duration: 0,
          has_potential1: 0,
          interval: 0.75,
          maxcnt: 6,
          poise: 10,
          radius: 0,
          usp: 0,
          usp_extra: 0,
        },
        scheduledSequences: [
          scheduled(
            19,
            sequence(
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'blackboard', key: 'usp' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'caster',
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0017_yvonne_combo_skill',
                target: 'currentAbilityEntity',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: {
                  radius: 'radius',
                  atk_scale_tick: 'atk_scale_tick',
                  duration: 'duration',
                  atk_scale_boom: 'atk_scale_boom',
                  poise: 'poise',
                  has_potential1: 'has_potential1',
                  interval: 'interval',
                  maxcnt: 'maxcnt',
                  usp: 'usp_extra',
                },
              }),
            ),
            20,
          ),
        ],
      },
    },
    abilityentity_chr_0017_yvonne_ultimate_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0017_yvonne/UltimateAbilityEntity',
      ],
      lifetime: { kind: 'limited', durationSeconds: 50 },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0017_yvonne_ultimate_skill_abilityentity',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 3000,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale_boom: 0, atk_scale_tick: 0, duration: 0, radius: 0 },
        scheduledSequences: [],
      },
    },
    abilityentity_chr_0017_yvonne_ultimate_skill2: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0017_yvonne/UltimateAbilityEntity',
      ],
      lifetime: { kind: 'limited', durationSeconds: 50 },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0017_yvonne_ultimate_skill_abilityentity',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 3000,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale_boom: 0, atk_scale_tick: 0, duration: 0, radius: 0 },
        scheduledSequences: [],
      },
    },
    abilityentity_chr_0017_yvonne_ultimate_skill3: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0017_yvonne/UltimateAbilityEntity',
      ],
      lifetime: { kind: 'limited', durationSeconds: 50 },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0017_yvonne_ultimate_skill_abilityentity',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 3000,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale_boom: 0, atk_scale_tick: 0, duration: 0, radius: 0 },
        scheduledSequences: [],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default yvonne;
