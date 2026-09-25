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
            4,
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

const sharedActionSequence4: ActionSequenceDefinition = sequence({
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
          scheduled(
            0,
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'exist_talent_1', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  branch(
                    {
                      kind: 'entityTagMatch',
                      target: 'enemy',
                      tagQueryType: 'hasAny',
                      tags: [
                        'Skill/Character/Common/SpellInflict/CrystInflict',
                        'Skill/Character/Common/SpellStatus/Frozen',
                      ],
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0011_seraph_talent_1_crystup',
                        target: 'enemy',
                        inheritSourceSkillCastInfo: true,
                        copiedBlackboardAssignments: { cryst_up: 'cryst_up', duration: 'duration' },
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
                  ),
                ),
                undefined,
                { alwaysNext: true },
              ),
            ),
            3,
          ),
          scheduled(
            0,
            sequence(
              step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
              step(
                'dealDamage',
                {
                  damageType: 'cryo',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['comboSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                '\u0000endaxis-generated-identity:0',
              ),
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.2 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_hard_stop' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'blackboard', key: 'usp' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'caster',
              }),
            ),
            3,
          ),
        ],
      },
    },
  ],
});

const sharedActionSequence3: ActionSequenceDefinition = sequence(
  forEachContextTarget(
    'ball',
    sequence(
      step('applyBuff', {
        buffId: 'buff_chr_0011_seraph_finishball_02',
        target: 'currentAbilityEntity',
        inheritSourceSkillCastInfo: true,
      }),
    ),
  ),
  step('finishBuffsById', {
    target: 'party',
    buffIds: ['buff_chr_0011_seraph_atk_buff_normal_skill'],
    reason: 'other',
  }),
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    instantiateActionSequence(sharedActionSequence4, ['\u0000endaxis-generated-identity:1']),
    {},
    { lifetime: 'execution' },
  ),
);

export const xaihiChr_0011_seraph_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0011_seraph_attack1',
    timelineBlockFrames: 13,
    naturalDurationFrames: 117,
    exclusiveFrame: 14,
    offsetRecordFrame: 10,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 25,
          input: 'basicAttack',
          targetSkillId: 'chr_0011_seraph_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 13, endFrame: 25, skillIds: ['chr_0011_seraph_attack2'] }],
    },
    costFrame: 11,
    scheduledSequences: [
      scheduled(
        10,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0011_seraph_attack1.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0]:projectile_chr_0011_seraph_normal_attack',
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
                            'chr_0011_seraph_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
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
        10,
      ),
      scheduled(
        13,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0011_seraph_attack2'] })),
        25,
      ),
    ],
    timelineContinuationSkillId: 'chr_0011_seraph_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    display_atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
  },
);

export const xaihiChr_0011_seraph_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0011_seraph_attack2',
    timelineBlockFrames: 17,
    naturalDurationFrames: 121,
    exclusiveFrame: 20,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 28,
          input: 'basicAttack',
          targetSkillId: 'chr_0011_seraph_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 17, endFrame: 28, skillIds: ['chr_0011_seraph_attack3'] }],
    },
    costFrame: 7,
    scheduledSequences: [
      scheduled(
        7,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0011_seraph_attack2.actionGroupData.timelineActions[2]._sequenceActionData.actionData[0]:projectile_chr_0011_seraph_normal_attack2',
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
                            'chr_0011_seraph_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
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
        17,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0011_seraph_attack3'] })),
        28,
      ),
    ],
    timelineContinuationSkillId: 'chr_0011_seraph_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.16, 0.18, 0.19, 0.21, 0.22, 0.24, 0.26, 0.27, 0.29, 0.31, 0.33, 0.36],
    display_atk_scale: [0.16, 0.18, 0.19, 0.21, 0.22, 0.24, 0.26, 0.27, 0.29, 0.31, 0.33, 0.36],
  },
);

export const xaihiChr_0011_seraph_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0011_seraph_attack3',
    timelineBlockFrames: 14,
    naturalDurationFrames: 125,
    exclusiveFrame: 14,
    offsetRecordFrame: 8,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 25,
          input: 'basicAttack',
          targetSkillId: 'chr_0011_seraph_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 14, endFrame: 25, skillIds: ['chr_0011_seraph_attack4'] }],
    },
    costFrame: 11,
    scheduledSequences: [
      scheduled(
        8,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0011_seraph_attack3.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0]:projectile_chr_0011_seraph_normal_attack3_true',
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
                            'chr_0011_seraph_attack3:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
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
        8,
      ),
      scheduled(
        14,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0011_seraph_attack4'] })),
        25,
      ),
    ],
    timelineContinuationSkillId: 'chr_0011_seraph_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.21, 0.23, 0.25, 0.27, 0.29, 0.32, 0.34, 0.36, 0.38, 0.4, 0.44, 0.47],
    display_atk_scale: [0.21, 0.23, 0.25, 0.27, 0.29, 0.32, 0.34, 0.36, 0.38, 0.4, 0.44, 0.47],
  },
);

export const xaihiChr_0011_seraph_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0011_seraph_attack4',
    timelineBlockFrames: 21,
    naturalDurationFrames: 128,
    exclusiveFrame: 24,
    offsetRecordFrame: 12,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 33,
          input: 'basicAttack',
          targetSkillId: 'chr_0011_seraph_attack5',
        },
      ],
      allowedNextSkills: [{ startFrame: 21, endFrame: 33, skillIds: ['chr_0011_seraph_attack5'] }],
    },
    costFrame: 12,
    scheduledSequences: [
      scheduled(
        12,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0011_seraph_attack4.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:projectile_chr_0011_seraph_normal_attack3',
          'chr_0011_seraph_attack4:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        12,
      ),
      scheduled(
        7,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0011_seraph_attack4.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0]:projectile_chr_0011_seraph_normal_attack3_02',
          'chr_0011_seraph_attack4:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        7,
      ),
      scheduled(
        21,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0011_seraph_attack5'] })),
        33,
      ),
    ],
    timelineContinuationSkillId: 'chr_0011_seraph_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.17, 0.18, 0.2, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.37],
    display_atk_scale: [0.33, 0.36, 0.4, 0.43, 0.46, 0.5, 0.53, 0.56, 0.59, 0.64, 0.68, 0.74],
  },
);

export const xaihiChr_0011_seraph_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0011_seraph_attack5',
    timelineBlockFrames: 33,
    naturalDurationFrames: 137,
    exclusiveFrame: 33,
    offsetRecordFrame: 19,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 40,
          input: 'basicAttack',
          targetSkillId: 'chr_0011_seraph_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 33, endFrame: 40, skillIds: ['chr_0011_seraph_attack1'] }],
    },
    costFrame: 12,
    scheduledSequences: [
      scheduled(
        19,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'normalAttackLastCombo'],
              stagger: { kind: 'blackboard', key: 'poise' },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0011_seraph_attack5:/scheduledSequences/0/sequence/steps/0',
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
            undefined,
            { alwaysNext: true },
          ),
        ),
        19,
      ),
      scheduled(
        33,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0011_seraph_attack1'] })),
        40,
      ),
    ],
    timelineContinuationSkillId: 'chr_0011_seraph_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 15,
    atk_scale: [0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24],
    poise: 15,
    display_atk_scale: [0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24],
  },
);

export const xaihiChr_0011_seraph_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0011_seraph_power_attack',
    timelineBlockFrames: 34,
    naturalDurationFrames: 160,
    exclusiveFrame: 50,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 34,
          endFrame: 53,
          skillIds: ['chr_0011_seraph_normal_skill', 'chr_0011_seraph_combo_skill'],
        },
      ],
    },
    costFrame: 12,
    scheduledSequences: [
      scheduled(
        34,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.2 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'common' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        35,
      ),
      scheduled(
        32,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 1,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0011_seraph_power_attack:/scheduledSequences/1/sequence/steps/0',
          ),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
        ),
        32,
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
        34,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const xaihiChr_0011_seraph_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0011_seraph_plunging_attack_end',
    timelineBlockFrames: 13,
    naturalDurationFrames: 116,
    exclusiveFrame: 12,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        1,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'plungingAttack'],
            },
            'chr_0011_seraph_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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
    ],
    skillType: 'plungingAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
);

export const xaihiChr_0011_seraph_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0011_seraph_normal_skill',
    timelineBlockFrames: 31,
    naturalDurationFrames: 145,
    exclusiveFrame: 30,
    offsetRecordFrame: 0,
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
        6,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0011_seraph_talent_1_atb'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'team',
                spGainKind: 'gain',
                spGainSource: 'skill',
              }),
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0011_seraph_talent_1_atb'],
                reason: 'other',
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
          step('applyBuff', {
            buffId: 'buff_chr_0011_seraph_spawnball',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_up: 'atk_up',
              atk_scale: 'atk_scale',
              heal_value: 'heal_value',
              buff_duration: 'buff_duration',
              will_up: 'will_up',
            },
          }),
        ),
        8,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb: 0,
    atk_scale: 0.1,
    atk_up: [0.09, 0.09, 0.09, 0.09, 0.09, 0.11, 0.11, 0.11, 0.13, 0.13, 0.13, 0.15],
    buff_duration: 25,
    duration: 20,
    heal_value: [144, 172.8, 201.6, 230.4, 244.8, 259.2, 273.6, 288, 302.4, 309.6, 316.8, 324],
    will_up: [0.336, 0.4, 0.47, 0.54, 0.57, 0.6, 0.64, 0.67, 0.71, 0.72, 0.74, 0.76],
  },
);

export const xaihiChr_0011_seraph_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0011_seraph_combo_skill',
    timelineBlockFrames: 43,
    naturalDurationFrames: 122,
    exclusiveFrame: 42,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 25, endFrame: 60, skillIds: ['chr_0011_seraph_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('findCharacterTeamTargets', {
            saveToContextKey: 'mainchr',
            selection: { kind: 'controlledOperator' },
          }),
        ),
        24,
      ),
      scheduled(
        24,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'ball',
            abilityEntityIds: [
              'abilityentity_chr_0011_seraph_normal_skill',
              'abilityentity_chr_0011_seraph_normal_skill_02',
              'abilityentity_chr_0011_seraph_normal_skill_03',
              'abilityentity_chr_0011_seraph_normal_skill_buff',
              'abilityentity_chr_0027_tangtang_normal_skill_02_02',
            ],
          }),
          branch(
            {
              kind: 'contextTargetCountCompare',
              contextKey: 'ball',
              operator: 'greaterOrEqual',
              value: 1,
            },
            instantiateActionSequence(sharedActionSequence3, [
              'SkillData.chr_0011_seraph_combo_skill.actionGroupData.timelineActions[2]._sequenceActionData.actionData[1].succeedActions.actionData[0]:projectile_chr_0011_seraph_combo_skill',
              'chr_0011_seraph_combo_skill:/scheduledSequences/1/sequence/steps/1/whenTrue/steps/2/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/1',
            ]),
            instantiateActionSequence(sharedActionSequence3, [
              'SkillData.chr_0011_seraph_combo_skill.actionGroupData.timelineActions[2]._sequenceActionData.actionData[1].failActions.actionData[0]:projectile_chr_0011_seraph_combo_skill',
              'chr_0011_seraph_combo_skill:/scheduledSequences/1/sequence/steps/1/whenFalse/steps/2/body/steps/0/callbacks/0/skill/scheduledSequences/1/sequence/steps/1',
            ]),
            { alwaysNext: true },
          ),
        ),
        25,
      ),
      scheduled(
        0,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: [
              'buff_chr_0011_seraph_combo_skill_listener',
              'buff_chr_0011_seraph_normal_skill_heal',
            ],
            reason: 'other',
          }),
        ),
        1,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.900000036 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
            influenceSkillCooldownSeconds: { kind: 'constant', value: 0.4 },
          }),
        ),
        24,
      ),
    ],
    cooldownFrames: [240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 210],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.85, 4.15, 4.5],
    cryst_up: 0,
    duration: 0,
    exist_talent_1: 0,
    poise: 10,
    potential_3: 0,
    usp: 10,
  },
);

export const xaihiChr_0011_seraph_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0011_seraph_ultimate_skill',
    timelineBlockFrames: 81,
    naturalDurationFrames: 183,
    exclusiveFrame: 80,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 67,
          endFrame: 100,
          skillIds: ['chr_0011_seraph_normal_skill', 'chr_0011_seraph_combo_skill'],
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
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        45,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 47),
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
        80,
      ),
      scheduled(
        58,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0011_seraph_atk_buff',
            target: 'party',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_up: 'atk_up',
              duration: 'duration',
              wisd_up: 'wisd_up',
              wisd_max: 'wisd_max',
            },
          }),
        ),
        61,
      ),
    ],
    cooldownFrames: 600,
    costs: [{ resource: 'ultimateEnergy', value: 80 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_up: [0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.22, 0.24],
    duration: 12,
    exist_talent_2: 0,
    wisd_max: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.36],
    wisd_up: [
      0.00014, 0.00015, 0.00016, 0.00018, 0.00019, 0.0002, 0.00022, 0.00023, 0.00024, 0.00026,
      0.00028, 0.0003,
    ],
  },
);

export const xaihiCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const xaihi: OperatorDefinition = {
  slug: 'xaihi',
  gameId: 'XAIHI',
  rarity: 5,
  weaponType: 'arts-unit',
  element: 'cryo',
  role: 'supporter',
  mainAttribute: 'will',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [9, 26, 44, 62, 80, 89],
    agility: [9, 26, 45, 64, 82, 91],
    intellect: [15, 39, 64, 89, 114, 127],
    will: [15, 43, 74, 104, 134, 150],
    baseAttack: [30, 86, 144, 203, 262, 291],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  passiveUi: {
    kind: 'abilityEntityCount',
    abilityEntityId: 'abilityentity_chr_0011_seraph_normal_skill',
    icon: '/operators/xaihi/battle.webp',
    nameKey: 'effects.name.auxiliaryCrystal',
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        xaihiChr_0011_seraph_attack1,
        xaihiChr_0011_seraph_attack2,
        xaihiChr_0011_seraph_attack3,
        xaihiChr_0011_seraph_attack4,
        xaihiChr_0011_seraph_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: xaihiChr_0011_seraph_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: xaihiChr_0011_seraph_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: xaihiChr_0011_seraph_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: xaihiChr_0011_seraph_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: xaihiChr_0011_seraph_ultimate_skill,
    },
  ],
  dodgeSkill: xaihiCommon_character_perfect_dodge,
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
          skillGroupKey: 'comboSkill',
          blackboardKey: 'exist_talent_1',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'cryst_up',
          operation: 'assign',
          value: [0.07, 0.1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
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
          skillGroupKey: 'ultimate',
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
          skillGroupKey: 'battleSkill',
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
          skillGroupKey: 'ultimate',
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
          skillGroupKey: 'comboSkill',
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
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_up',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'wisd_up',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'wisd_max',
          operation: 'multiply',
          value: 1.1,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0011_seraph_atk_buff: {
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
      lifecycleSequences: {
        start: sequence(
          step('storeSourceAttributeValue', {
            attribute: { kind: 'specific', key: 'intellect' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'blackboard', key: 'wisd_up' },
            base: { kind: 'constant', value: 0 },
            targetKey: 'final_atkup',
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'final_atkup', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'blackboard', key: 'wisd_max', fallback: 0 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'final_final_atkup',
                operation: 'assign',
                value: { kind: 'blackboard', key: 'wisd_max' },
              }),
            ),
            sequence(
              step('modifyActionValue', {
                key: 'final_final_atkup',
                operation: 'assign',
                value: { kind: 'blackboard', key: 'final_atkup' },
              }),
            ),
            { alwaysNext: true },
          ),
          step('calculateActionValue', {
            key: 'final_final_atkup',
            operation: 'add',
            left: { kind: 'blackboard', key: 'final_final_atkup' },
            right: { kind: 'blackboard', key: 'atk_up' },
          }),
          step('applyBuff', {
            buffId: 'buff_common_affixes_enhance_crystal',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'final_final_atkup' },
            },
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0011_seraph_ultimate_effect' },
          }),
          step('applyBuff', {
            buffId: 'buff_common_affixes_enhance_natural',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'final_final_atkup' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_chr_0011_seraph_ultimate_effect_2',
            },
          }),
        ),
      },
    },
    buff_chr_0011_seraph_combo_count: {
      stackingType: 'enhance',
      priority: 0,
      maxStackCount: 2,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        enhanceChanged: sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'buffOwner',
              buffIds: ['buff_chr_0011_seraph_combo_count'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 2 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0011_seraph_finishball_04',
                target: 'buffOwner',
                source: 'buffOwner',
                inheritSourceSkillCastInfo: true,
              }),
              step('mergeContextTargets', {
                saveToContextKey: 'seraph',
                sources: [{ kind: 'abilitySystemSource', owner: 'actionOwner' }],
              }),
              step('openComboWindow', {
                nextSkillKeyFromSlot: 'comboSkill',
                ownerContextKey: 'seraph',
              }),
              step('finishBuffsById', {
                target: 'buffOwner',
                buffIds: ['buff_chr_0011_seraph_combo_count'],
                reason: 'other',
              }),
            ),
          ),
        ),
      },
    },
    buff_chr_0011_seraph_finishball_02: {
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
      lifecycleSequences: { start: sequence(step('finishCurrentAbilityEntity', {})) },
    },
    buff_chr_0011_seraph_finishball_04: {
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
      lifecycleSequences: {
        trigger: sequence(
          step('mergeContextTargets', {
            saveToContextKey: 'seraph',
            sources: [{ kind: 'abilitySystemSource', owner: 'actionOwner' }],
          }),
          forEachContextTarget(
            'seraph',
            sequence(
              step('finishBuffsById', {
                target: 'currentTarget',
                buffIds: ['buff_chr_0011_seraph_combo_skill_listener'],
                reason: 'other',
              }),
            ),
          ),
          step('finishCurrentAbilityEntity', {}),
        ),
      },
    },
    buff_chr_0011_seraph_mainchr_heal: {
      stackingType: 'unlimited',
      priority: 1,
      maxStackCount: 1,
      durationSeconds: 2,
      triggerIntervalSeconds: 0.25,
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {
        atk_scale: 0,
        atk_up: 0,
        buff_duration: 0,
        final_heal_value: 0,
        heal_value: 0,
        potential_1: 0,
        will_up: 0,
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
              step('storeSourceAttributeValue', {
                attribute: { kind: 'specific', key: 'will' },
                stage: 'finalNonConverted',
                useFloor: false,
                divisor: { kind: 'constant', value: 1 },
                multiplier: { kind: 'blackboard', key: 'will_up' },
                base: { kind: 'blackboard', key: 'heal_value' },
                targetKey: 'final_heal_value',
              }),
              step('heal', {
                target: 'buffOwner',
                alwaysNext: true,
                tags: ['Skill/Character/Common/Heal/NormalSkillHeal'],
                amount: { kind: 'blackboard', key: 'final_heal_value' },
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
                  kind: 'healthCompare',
                  target: 'caster',
                  valueType: 'ratio',
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0011_seraph_potential_1_atkup',
                    target: 'buffOwner',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: {
                      buff_duration: 'buff_duration',
                      atk_up: 'atk_up',
                    },
                  }),
                ),
              ),
            ),
          },
        ),
      },
    },
    buff_chr_0011_seraph_normal_skill_heal: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: {
        atk_scale: 0.1,
        atk_up: 0,
        buff_duration: 0,
        duration: 20,
        heal_value: 20,
        potential_1: 0,
        will_up: 0,
      },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'beforeOutputDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'not',
                condition: {
                  kind: 'timedMarkerPresent',
                  target: 'buffOwner',
                  markerId: 'buff_chr_0011_seraph_normal_skill_heal',
                },
              },
              sequence(
                branch(
                  {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0011_seraph_finishball_04'],
                    operator: 'lessOrEqual',
                    value: { kind: 'constant', value: 0 },
                  },
                  sequence(
                    branch(
                      { kind: 'casterControlled' },
                      sequence(
                        branch(
                          {
                            kind: 'eventDamageTagsMatch',
                            match: 'hasAny',
                            tags: ['normalAttackLastCombo'],
                          },
                          sequence(
                            step('mergeContextTargets', {
                              saveToContextKey: 'seraph',
                              sources: [{ kind: 'abilitySystemSource', owner: 'actionSource' }],
                            }),
                            step('findOwnerSpawnedAbilityEntities', {
                              saveToContextKey: 'ball',
                              abilityEntityIds: ['abilityentity_chr_0011_seraph_normal_skill'],
                              ownerContextKey: 'seraph',
                            }),
                            forEachContextTarget(
                              'ball',
                              sequence(
                                step('applyBuff', {
                                  buffId: 'buff_chr_0011_seraph_combo_count',
                                  target: 'currentAbilityEntity',
                                  source: 'buffSource',
                                  inheritSourceSkillCastInfo: true,
                                }),
                              ),
                            ),
                            step('applyBuff', {
                              buffId: 'buff_chr_0011_seraph_mainchr_heal',
                              target: 'buffOwner',
                              sourceContextKey: 'seraph',
                              inheritSourceSkillCastInfo: true,
                              copiedBlackboardAssignments: {
                                atk_scale: 'atk_scale',
                                heal_value: 'heal_value',
                                potential_1: 'potential_1',
                                buff_duration: 'buff_duration',
                                atk_up: 'atk_up',
                                will_up: 'will_up',
                              },
                            }),
                            step('createTimedMarker', {
                              target: 'buffOwner',
                              markerId: 'buff_chr_0011_seraph_normal_skill_heal',
                              durationSeconds: { kind: 'constant', value: 0.3 },
                              autoFinishByAction: false,
                            }),
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
    },
    buff_chr_0011_seraph_potential_1_atkup: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'buff_duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { atk_up: 0, buff_duration: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_enhance_spell',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'buff_duration' },
              rate: { kind: 'blackboard', key: 'atk_up' },
            },
          }),
        ),
      },
    },
    buff_chr_0011_seraph_spawnball: {
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
      lifecycleSequences: {
        trigger: sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0011_seraph_normal_skill',
            childSkillId: 'chr_0011_seraph_normal_skill_abentity_onfield',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
          step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
        ),
      },
    },
    buff_chr_0011_seraph_talent_1_crystup: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_cryst_taken_up',
        iconPath: '/icons/icon_battle_cryst_taken_up.webp',
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
      blackboard: { cryst_up: 0, duration: 0 },
      attributeModifiers: [],
      damageModifiers: [
        {
          enabledSide: 'defender',
          condition: { kind: 'eventDamageTypesMatch', damageTypes: ['cryo'] },
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
    },
    buff_chr_0011_seraph_ultimate_effect: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_affix_cryst_enhance',
        iconPath: '/icons/icon_battle_affix_cryst_enhance.webp',
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
      blackboard: { duration: 0 },
      attributeModifiers: [],
    },
    buff_chr_0011_seraph_ultimate_effect_2: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_affix_natural_enhance',
        iconPath: '/icons/icon_battle_affix_natural_enhance.webp',
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
      blackboard: { duration: 0 },
      attributeModifiers: [],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0011_seraph_normal_skill: {
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
        skillId: 'chr_0011_seraph_normal_skill_abentity_onfield',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 900,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale: 0.1,
          atk_up: 0,
          buff_duration: 0,
          heal_value: 20,
          poise: 0,
          potential_1: 0,
          usp: 0,
          will_up: 0,
        },
        scheduledSequences: [
          scheduled(
            1,
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0011_seraph_normal_skill_heal',
                target: 'party',
                source: 'currentAbilityEntity',
                finishByAction: true,
                blackboardAssignments: {
                  atk_scale: { kind: 'blackboard', key: 'atk_scale' },
                  heal_value: { kind: 'blackboard', key: 'heal_value' },
                  potential_1: { kind: 'blackboard', key: 'potential_1' },
                  buff_duration: { kind: 'blackboard', key: 'buff_duration' },
                  atk_up: { kind: 'blackboard', key: 'atk_up' },
                  will_up: { kind: 'blackboard', key: 'will_up' },
                },
              }),
            ),
            901,
          ),
          scheduled(
            0,
            sequence(
              step('applyBuff', {
                buffId: 'buff_common_full_immune',
                target: 'currentAbilityEntity',
                source: 'currentAbilityEntity',
                inheritSourceSkillCastInfo: true,
              }),
            ),
            1,
          ),
          scheduled(
            600,
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'currentAbilityEntity',
                  buffIds: ['buff_chr_0011_seraph_finishball_04'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(),
                sequence(
                  step('finishBuffsById', {
                    target: 'caster',
                    buffIds: ['buff_chr_0011_seraph_combo_skill_listener'],
                    reason: 'other',
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0011_seraph_finishball_02',
                    target: 'currentAbilityEntity',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
                { alwaysNext: true },
              ),
            ),
            603,
          ),
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default xaihi;
