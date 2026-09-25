/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type {
  ActionSequenceDefinition,
  OperatorDefinition,
  SkillDefinition,
} from '../../core/game-data/operatorDefinition';
import {
  branch,
  instantiateActionSequence,
  scheduled,
  sequence,
  step,
  withActionBlackboardScope,
  withSkillBlackboard,
} from './definitionHelpers';

const sharedActionSequence1: ActionSequenceDefinition = sequence({
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
                '\u0000endaxis-generated-identity:0',
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
            3,
          ),
        ],
      },
    },
  ],
});

const sharedActionSequence6: ActionSequenceDefinition = sequence(
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
      step('igniteBuffs', { target: 'buffOwner', source: 'buffOwner', igniteType: 'NoGuard' }),
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
      ),
    ),
  },
);

const sharedActionSequence5: ActionSequenceDefinition = sequence({
  kind: 'launchProjectile',
  parameters: {
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
          scheduled(
            0,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'electric',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  calculation: 'breakingAttack',
                  calculationMultiplier: 0.06,
                  tags: ['normalAttack', 'powerAttack'],
                },
                '\u0000endaxis-generated-identity:0',
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
            3,
          ),
        ],
      },
    },
  ],
});

const sharedActionSequence3: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'not',
      condition: { kind: 'timedMarkerPresent', target: 'caster', markerId: 'have_recovered' },
    },
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
        '\u0000endaxis-generated-identity:0',
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
          step('createTimedMarker', {
            target: 'caster',
            markerId: 'have_recovered',
            durationSeconds: { kind: 'constant', value: 0.5 },
            autoFinishByAction: false,
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
          tags: ['normalAttack'],
        },
        '\u0000endaxis-generated-identity:1',
      ),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence4: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    instantiateActionSequence(sharedActionSequence5, ['\u0000endaxis-generated-identity:1']),
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
        scheduledSequences: [
          scheduled(
            0,
            instantiateActionSequence(sharedActionSequence3, [
              '\u0000endaxis-generated-identity:0',
              '\u0000endaxis-generated-identity:1',
            ]),
            3,
          ),
        ],
      },
    },
  ],
});

export const antalChr_0023_antal_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0023_antal_attack1',
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
      scheduled(
        8,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0023_antal_attack1.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0]:projectile_chr_0023_antal_normal_attack1',
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
                            'chr_0023_antal_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
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
        15,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0023_antal_attack2'] })),
        26,
      ),
    ],
    timelineContinuationSkillId: 'chr_0023_antal_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.23, 0.25, 0.28, 0.3, 0.32, 0.35, 0.37, 0.39, 0.41, 0.44, 0.48, 0.52] },
);

export const antalChr_0023_antal_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0023_antal_attack2',
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
      scheduled(
        12,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0023_antal_attack2.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:projectile_chr_0023_antal_normal_attack2',
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
                            'chr_0023_antal_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
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
        12,
      ),
      scheduled(
        20,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0023_antal_attack3'] })),
        31,
      ),
    ],
    timelineContinuationSkillId: 'chr_0023_antal_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.28, 0.31, 0.34, 0.36, 0.39, 0.42, 0.45, 0.48, 0.5, 0.54, 0.58, 0.63],
    display_atk_scale: [0.28, 0.31, 0.34, 0.36, 0.39, 0.42, 0.45, 0.48, 0.5, 0.54, 0.58, 0.63],
  },
);

export const antalChr_0023_antal_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0023_antal_attack3',
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
      scheduled(
        14,
        sequence(
          step('modifyActionValue', {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'constant', value: 0.5 },
          }),
          withActionBlackboardScope(
            'SkillData.chr_0023_antal_attack3.actionGroupData.timelineActions[3]._sequenceActionData.actionData[1]:projectile_chr_0023_antal_normal_attack3',
            {},
            true,
            instantiateActionSequence(sharedActionSequence1, [
              'chr_0023_antal_attack3:/scheduledSequences/0/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
            ]),
            {},
            { lifetime: 'execution' },
          ),
        ),
        14,
      ),
      scheduled(
        18,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0023_antal_attack3.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0]:projectile_chr_0023_antal_normal_attack3',
            {},
            true,
            instantiateActionSequence(sharedActionSequence1, [
              'chr_0023_antal_attack3:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
            ]),
            {},
            { lifetime: 'execution' },
          ),
        ),
        18,
      ),
      scheduled(
        22,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0023_antal_attack4'] })),
        33,
      ),
    ],
    timelineContinuationSkillId: 'chr_0023_antal_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.34, 0.37, 0.41, 0.44, 0.48, 0.51, 0.54, 0.58, 0.61, 0.65, 0.71, 0.77] },
);

export const antalChr_0023_antal_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0023_antal_attack4',
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
      scheduled(
        27,
        sequence(
          step('modifyActionValue', {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'constant', value: 0.5 },
          }),
          withActionBlackboardScope(
            'SkillData.chr_0023_antal_attack4.actionGroupData.timelineActions[3]._sequenceActionData.actionData[1]:projectile_chr_0023_antal_normal_attack4',
            {},
            true,
            instantiateActionSequence(sharedActionSequence2, [
              'chr_0023_antal_attack4:/scheduledSequences/0/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0/whenTrue/steps/0',
              'chr_0023_antal_attack4:/scheduledSequences/0/sequence/steps/1/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0/whenFalse/steps/0',
            ]),
            {},
            { lifetime: 'execution' },
          ),
          withActionBlackboardScope(
            'SkillData.chr_0023_antal_attack4.actionGroupData.timelineActions[3]._sequenceActionData.actionData[2]:projectile_chr_0023_antal_normal_attack4',
            {},
            true,
            instantiateActionSequence(sharedActionSequence2, [
              'chr_0023_antal_attack4:/scheduledSequences/0/sequence/steps/2/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0/whenTrue/steps/0',
              'chr_0023_antal_attack4:/scheduledSequences/0/sequence/steps/2/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0/whenFalse/steps/0',
            ]),
            {},
            { lifetime: 'execution' },
          ),
        ),
        27,
      ),
      scheduled(
        38,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0023_antal_attack1'] })),
        48,
      ),
    ],
    timelineContinuationSkillId: 'chr_0023_antal_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 15,
    atk_scale: [0.51, 0.56, 0.61, 0.66, 0.71, 0.77, 0.82, 0.87, 0.92, 0.98, 1.06, 1.15],
    poise: 15,
  },
);

export const antalChr_0023_antal_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0023_antal_power_attack',
    timelineBlockFrames: 32,
    naturalDurationFrames: 124,
    exclusiveFrame: 42,
    offsetRecordFrame: 0,
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
      scheduled(
        10,
        instantiateActionSequence(sharedActionSequence4, [
          'SkillData.chr_0023_antal_power_attack.actionGroupData.timelineActions[12]._sequenceActionData.actionData[0]:projectile_chr_0023_antal_power_attack02',
          'chr_0023_antal_power_attack:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        10,
      ),
      scheduled(
        12,
        instantiateActionSequence(sharedActionSequence4, [
          'SkillData.chr_0023_antal_power_attack.actionGroupData.timelineActions[13]._sequenceActionData.actionData[0]:projectile_chr_0023_antal_power_attack02',
          'chr_0023_antal_power_attack:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        12,
      ),
      scheduled(
        14,
        instantiateActionSequence(sharedActionSequence4, [
          'SkillData.chr_0023_antal_power_attack.actionGroupData.timelineActions[14]._sequenceActionData.actionData[0]:projectile_chr_0023_antal_power_attack02',
          'chr_0023_antal_power_attack:/scheduledSequences/2/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        14,
      ),
      scheduled(
        15,
        instantiateActionSequence(sharedActionSequence4, [
          'SkillData.chr_0023_antal_power_attack.actionGroupData.timelineActions[15]._sequenceActionData.actionData[0]:projectile_chr_0023_antal_power_attack02',
          'chr_0023_antal_power_attack:/scheduledSequences/3/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        15,
      ),
      scheduled(
        16,
        instantiateActionSequence(sharedActionSequence4, [
          'SkillData.chr_0023_antal_power_attack.actionGroupData.timelineActions[16]._sequenceActionData.actionData[0]:projectile_chr_0023_antal_power_attack02',
          'chr_0023_antal_power_attack:/scheduledSequences/4/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        16,
      ),
      scheduled(
        25,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0023_antal_power_attack.actionGroupData.timelineActions[18]._sequenceActionData.actionData[0]:projectile_chr_0023_antal_power_attack',
            {},
            true,
            sequence({
              kind: 'launchProjectile',
              parameters: {
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
                    blackboard: { atb: 0, atk_scale: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'electric',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              calculation: 'breakingAttack',
                              calculationMultiplier: 0.7,
                              tags: ['normalAttack', 'powerAttack'],
                            },
                            'chr_0023_antal_power_attack:/scheduledSequences/5/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
                        ),
                        3,
                      ),
                      scheduled(
                        1,
                        sequence(
                          step('startTimeDilation', {
                            scope: 'entity',
                            durationSeconds: { kind: 'constant', value: 0.3667 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: { kind: 'named', key: 'char_normal_attack' },
                            finishByAction: false,
                            targets: ['enemy', 'caster'],
                          }),
                        ),
                        2,
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
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_common_power_attack_disable_cast_skill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
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
        42,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const antalChr_0023_antal_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0023_antal_plunging_attack_end',
    timelineBlockFrames: 16,
    naturalDurationFrames: 85,
    exclusiveFrame: 15,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [
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
            'chr_0023_antal_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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

export const antalChr_0023_antal_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0023_antal_normal_skill',
    timelineBlockFrames: 31,
    naturalDurationFrames: 108,
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
        20,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0023_antal_normal_skill'],
            reason: 'other',
          }),
          step('applyBuff', {
            buffId: 'buff_chr_0023_antal_normal_skill',
            target: 'caster',
            source: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              rate: 'rate',
              duration: 'duration',
              potential_3: 'potential_3',
              potential_3_atb: 'potential_3_atb',
              potential_5: 'potential_5',
              delay_time: 'delay_time',
              potential_5_rate: 'potential_5_rate',
            },
          }),
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0023_antal_normal_skill:/scheduledSequences/1/sequence/steps/2',
          ),
          step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
        ),
        20,
      ),
      scheduled(
        20,
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
        23,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
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
);

export const antalChr_0023_antal_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0023_antal_combo_skill',
    timelineBlockFrames: 46,
    naturalDurationFrames: 108,
    exclusiveFrame: 45,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 24, endFrame: 63, skillIds: ['chr_0023_antal_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        21,
        sequence(
          {
            kind: 'switch',
            parameters: {
              choice: { kind: 'blackboard', key: 'EntityBB_combo_type' },
              alwaysNext: true,
            },
            options: [
              {
                value: { kind: 'constant', value: 1 },
                sequence: sequence({
                  kind: 'switch',
                  parameters: {
                    choice: { kind: 'blackboard', key: 'EntityBB_combo_index' },
                    alwaysNext: true,
                  },
                  options: [
                    {
                      value: { kind: 'constant', value: 2 },
                      sequence: sequence(
                        step('applyPhysicalInfliction', {
                          type: 'fracture',
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
                              orderPriority: {
                                useDirectoryValue: false,
                                value: 0,
                                category: 'CommonCharBuff',
                              },
                            },
                            applyTags: ['Skill/Character/Common/NoGuard'],
                            extendTags: [],
                            blackboard: {
                              atk_scale: 0,
                              count: 0,
                              duration: 20,
                              skip_handle_cryst_break: 0,
                            },
                            attributeModifiers: [],
                            lifecycleSequences: {
                              start: sequence(
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
                              finish: sequence(
                                step('applyBuff', {
                                  buffId: 'buff_physical_no_guard_fake',
                                  target: 'buffOwner',
                                  source: 'buffSource',
                                  inheritSourceSkillCastInfo: true,
                                }),
                              ),
                              afterEnhance: sharedActionSequence6,
                            },
                          },
                          fractureBuffId: 'buff_physical_fracture',
                          fractureDefinition: {
                            stackingType: 'unlimited',
                            priority: 0,
                            maxStackCount: 1,
                            durationSeconds: 3,
                            triggerIntervalSeconds: 0,
                            waitFirstTriggerInterval: false,
                            maxTriggerCount: 0,
                            applyTags: [],
                            extendTags: [],
                            blackboard: { count: 0, duration: 15 },
                            attributeModifiers: [],
                            lifecycleSequences: {
                              start: sequence(
                                step('readBuffStackCount', {
                                  target: 'buffOwner',
                                  outputKey: 'count',
                                  query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
                                }),
                                step('readSkillSettingData', {
                                  items: [
                                    {
                                      values: [12, 18, 24, 30],
                                      column: { kind: 'blackboard', key: 'count' },
                                      storeKey: 'duration',
                                    },
                                  ],
                                }),
                                step('applyBuff', {
                                  buffId: 'buff_physical_do_fracture',
                                  target: 'buffOwner',
                                  source: 'buffSource',
                                  inheritSourceSkillCastInfo: true,
                                  copiedBlackboardAssignments: { duration: 'duration' },
                                }),
                              ),
                            },
                          },
                        }),
                      ),
                    },
                    {
                      value: { kind: 'constant', value: 0 },
                      sequence: sequence(
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
                              orderPriority: {
                                useDirectoryValue: false,
                                value: 0,
                                category: 'CommonCharBuff',
                              },
                            },
                            applyTags: ['Skill/Character/Common/NoGuard'],
                            extendTags: [],
                            blackboard: {
                              atk_scale: 0,
                              count: 0,
                              duration: 20,
                              skip_handle_cryst_break: 0,
                            },
                            attributeModifiers: [],
                            lifecycleSequences: {
                              start: sequence(
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
                              finish: sequence(
                                step('applyBuff', {
                                  buffId: 'buff_physical_no_guard_fake',
                                  target: 'buffOwner',
                                  source: 'buffSource',
                                  inheritSourceSkillCastInfo: true,
                                }),
                              ),
                              afterEnhance: sharedActionSequence6,
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
                              orderPriority: {
                                useDirectoryValue: false,
                                value: 0,
                                category: 'CommonCharBuff',
                              },
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
                          duration: { kind: 'constant', value: 1.5 },
                          height: { kind: 'constant', value: 2 },
                          speedFactorMultiplier: 3,
                          force: false,
                          targetFilter: 'aliveOnly',
                          returnWhen: 'always',
                        }),
                      ),
                    },
                    {
                      value: { kind: 'constant', value: 1 },
                      sequence: sequence(
                        step('applyKnockDown', {
                          target: 'enemy',
                          duration: { kind: 'constant', value: 2 },
                          force: false,
                          isExtra: false,
                          targetFilter: 'aliveOnly',
                          returnWhen: 'always',
                        }),
                      ),
                    },
                    {
                      value: { kind: 'constant', value: 3 },
                      sequence: sequence(
                        step('applyPhysicalInfliction', {
                          type: 'crush',
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
                              orderPriority: {
                                useDirectoryValue: false,
                                value: 0,
                                category: 'CommonCharBuff',
                              },
                            },
                            applyTags: ['Skill/Character/Common/NoGuard'],
                            extendTags: [],
                            blackboard: {
                              atk_scale: 0,
                              count: 0,
                              duration: 20,
                              skip_handle_cryst_break: 0,
                            },
                            attributeModifiers: [],
                            lifecycleSequences: {
                              start: sequence(
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
                              finish: sequence(
                                step('applyBuff', {
                                  buffId: 'buff_physical_no_guard_fake',
                                  target: 'buffOwner',
                                  source: 'buffSource',
                                  inheritSourceSkillCastInfo: true,
                                }),
                              ),
                              afterEnhance: sharedActionSequence6,
                            },
                          },
                          crushedBuffId: 'buff_physical_crushed',
                          crushedDefinition: {
                            stackingType: 'stack',
                            stackingKey: 'physical',
                            priority: 0,
                            maxStackCount: 1,
                            durationSeconds: { blackboardKey: 'duration' },
                            triggerIntervalSeconds: 0,
                            waitFirstTriggerInterval: true,
                            maxTriggerCount: 1,
                            presentation: {
                              visible: true,
                              iconId: 'knockback',
                              iconPath: '/icons/knockback.webp',
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
                              orderPriority: {
                                useDirectoryValue: false,
                                value: 0,
                                category: 'CommonCharBuff',
                              },
                            },
                            applyTags: ['Skill/Character/Common/PhysicalStatus/CrushStatus'],
                            extendTags: [],
                            blackboard: {
                              atk_scale: 1,
                              count: 0,
                              dmg_multiplier: 1,
                              duration: 3,
                              ignore_hit_effect: 0,
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
                                    step('readBuffStackCount', {
                                      target: 'buffOwner',
                                      outputKey: 'count',
                                      query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
                                    }),
                                    step('readSkillSettingData', {
                                      items: [
                                        {
                                          values: [3, 4.5, 6, 7.5],
                                          column: { kind: 'blackboard', key: 'count' },
                                          storeKey: 'atk_scale',
                                          enhance: {
                                            target: 'caster',
                                            formula: { kind: 'linear', paramA: 0.01 },
                                          },
                                        },
                                      ],
                                    }),
                                    step('modifyActionValue', {
                                      key: 'atk_scale',
                                      operation: 'multiply',
                                      value: { kind: 'blackboard', key: 'dmg_multiplier' },
                                    }),
                                    step('finishBuffsById', {
                                      target: 'buffOwner',
                                      buffIds: ['buff_physical_no_guard'],
                                      reason: 'early',
                                    }),
                                    step('dealDamage', {
                                      damageType: 'physical',
                                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                                      tags: [],
                                      features: ['physicalInfliction'],
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
                                    scopeKey: 'native-buff-callback:2',
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
                                    branch(
                                      {
                                        kind: 'actionValueCompare',
                                        left: {
                                          kind: 'blackboard',
                                          key: 'ignore_hit_effect',
                                          fallback: 0,
                                        },
                                        operator: 'less',
                                        right: { kind: 'constant', value: 0.5 },
                                      },
                                      sequence({
                                        kind: 'switch',
                                        parameters: {
                                          choice: { kind: 'blackboard', key: 'count' },
                                          alwaysNext: true,
                                        },
                                        options: [
                                          {
                                            value: { kind: 'constant', value: 0 },
                                            sequence: sequence(
                                              step('startTimeDilation', {
                                                scope: 'entity',
                                                durationSeconds: { kind: 'constant', value: 0.1 },
                                                slot: 'TimeDilation/Layer/Entity/HitStop',
                                                priority: 15,
                                                curve: { kind: 'named', key: 'interrupt_weakness' },
                                                finishByAction: false,
                                                targets: ['enemy', 'caster'],
                                              }),
                                            ),
                                          },
                                          {
                                            value: { kind: 'constant', value: 1 },
                                            sequence: sequence(
                                              step('startTimeDilation', {
                                                scope: 'entity',
                                                durationSeconds: { kind: 'constant', value: 0.1 },
                                                slot: 'TimeDilation/Layer/Entity/HitStop',
                                                priority: 10,
                                                curve: { kind: 'named', key: 'interrupt_weakness' },
                                                finishByAction: false,
                                                targets: ['enemy', 'caster'],
                                              }),
                                            ),
                                          },
                                          {
                                            value: { kind: 'constant', value: 2 },
                                            sequence: sequence(
                                              step('startTimeDilation', {
                                                scope: 'entity',
                                                durationSeconds: { kind: 'constant', value: 0.25 },
                                                slot: 'TimeDilation/Layer/Entity/HitStop',
                                                priority: 20,
                                                curve: { kind: 'named', key: 'interrupt_weakness' },
                                                finishByAction: false,
                                                targets: ['enemy', 'caster'],
                                              }),
                                            ),
                                          },
                                          {
                                            value: { kind: 'constant', value: 3 },
                                            sequence: sequence(
                                              step('startTimeDilation', {
                                                scope: 'entity',
                                                durationSeconds: { kind: 'constant', value: 0.5 },
                                                slot: 'TimeDilation/Layer/Entity/HitStop',
                                                priority: 20,
                                                curve: { kind: 'named', key: 'interrupt_weakness' },
                                                finishByAction: false,
                                                targets: ['enemy', 'caster'],
                                              }),
                                            ),
                                          },
                                          {
                                            value: { kind: 'constant', value: 4 },
                                            sequence: sequence(
                                              step('startTimeDilation', {
                                                scope: 'entity',
                                                durationSeconds: { kind: 'constant', value: 0.65 },
                                                slot: 'TimeDilation/Layer/Entity/HitStop',
                                                priority: 20,
                                                curve: { kind: 'named', key: 'interrupt_weakness' },
                                                finishByAction: false,
                                                targets: ['enemy', 'caster'],
                                              }),
                                            ),
                                          },
                                        ],
                                      }),
                                    ),
                                  ),
                                },
                              ),
                            },
                          },
                          damageMultiplier: { kind: 'constant', value: 1 },
                          ignoreHitEffect: false,
                        }),
                      ),
                    },
                  ],
                }),
              },
              {
                value: { kind: 'constant', value: 0 },
                sequence: sequence({
                  kind: 'switch',
                  parameters: {
                    choice: { kind: 'blackboard', key: 'EntityBB_combo_index' },
                    alwaysNext: true,
                  },
                  options: [
                    {
                      value: { kind: 'constant', value: 0 },
                      sequence: sequence(
                        step('applyElementalInfliction', { element: 'heat', isExtra: false }),
                      ),
                    },
                    {
                      value: { kind: 'constant', value: 2 },
                      sequence: sequence(
                        step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                      ),
                    },
                    {
                      value: { kind: 'constant', value: 1 },
                      sequence: sequence(
                        step('applyElementalInfliction', { element: 'electric', isExtra: false }),
                      ),
                    },
                    {
                      value: { kind: 'constant', value: 3 },
                      sequence: sequence(
                        step('applyElementalInfliction', { element: 'nature', isExtra: false }),
                      ),
                    },
                  ],
                }),
              },
              { value: { kind: 'constant', value: 2 }, sequence: sequence() },
            ],
          },
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0023_antal_combo_skill:/scheduledSequences/0/sequence/steps/1',
          ),
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'usp' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          }),
        ),
        24,
      ),
      scheduled(
        23,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        26,
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
    ],
    smartTarget: 'trigger',
    cooldownFrames: [750, 750, 750, 750, 750, 750, 750, 750, 750, 750, 750, 720],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [1.51, 1.66, 1.81, 1.96, 2.11, 2.27, 2.42, 2.57, 2.72, 2.91, 3.13, 3.4],
    poise: 10,
    usp: 10,
  },
);

export const antalChr_0023_antal_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0023_antal_ultimate_skill',
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
        42,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 44),
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
        60,
      ),
      scheduled(
        49,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0023_antal_utimate_skill',
            target: 'party',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration', rate: 'rate' },
          }),
        ),
        51,
      ),
    ],
    cooldownFrames: 600,
    costs: [{ resource: 'ultimateEnergy', value: 100 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  { duration: 12, rate: [0.08, 0.09, 0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.2] },
);

export const antalCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const antal: OperatorDefinition = {
  slug: 'antal',
  gameId: 'ANTAL',
  rarity: 4,
  weaponType: 'arts-unit',
  element: 'electric',
  role: 'supporter',
  mainAttribute: 'intellect',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [15, 40, 65, 91, 116, 129],
    agility: [9, 25, 43, 60, 78, 86],
    intellect: [15, 47, 81, 114, 148, 165],
    will: [9, 25, 41, 58, 74, 82],
    baseAttack: [30, 87, 147, 207, 267, 297],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        antalChr_0023_antal_attack1,
        antalChr_0023_antal_attack2,
        antalChr_0023_antal_attack3,
        antalChr_0023_antal_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: antalChr_0023_antal_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: antalChr_0023_antal_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: antalChr_0023_antal_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: antalChr_0023_antal_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: antalChr_0023_antal_ultimate_skill,
    },
  ],
  dodgeSkill: antalCommon_character_perfect_dodge,
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
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0023_antal_combo_skill',
      event: 'beforeTakeInfliction',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'contextTargetBuffIdStackCompare',
            contextKey: 'trigger',
            buffIds: ['buff_chr_0023_antal_tageffect'],
            operator: 'greaterOrEqual',
            value: { kind: 'constant', value: 1 },
          },
          sequence(
            step('modifyActionValue', {
              key: 'EntityBB_combo_type',
              operation: 'assign',
              value: { kind: 'constant', value: 0 },
            }),
            branch(
              {
                kind: 'eventInflictionElementIn',
                elements: ['heat', 'electric', 'cryo', 'nature'],
                outputKey: 'EntityBB_combo_index',
              },
              sequence(),
            ),
          ),
        ),
      ),
    },
    {
      key: 'native-combo:1',
      skillKey: 'chr_0023_antal_combo_skill',
      event: 'afterTakePhysicalInfliction',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'contextTargetBuffIdStackCompare',
            contextKey: 'trigger',
            buffIds: ['buff_chr_0023_antal_tageffect'],
            operator: 'greaterOrEqual',
            value: { kind: 'constant', value: 1 },
          },
          sequence(
            step('modifyActionValue', {
              key: 'EntityBB_combo_type',
              operation: 'assign',
              value: { kind: 'constant', value: 1 },
            }),
            branch(
              {
                kind: 'eventPhysicalInflictionTypeIn',
                types: ['airborne', 'knockDown', 'fracture', 'crush'],
                outputKey: 'EntityBB_combo_index',
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
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0023_antal_talent_1',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: {
            healvalue: [72, 108],
            cd: { kind: 'constant', value: 30 },
            multiplier: [0.6, 0.9],
          },
        }),
      ),
    },
    {
      levels: 2,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0023_antal_talent_2',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: {
            healvalue: [27, 45],
            probability: { kind: 'constant', value: 0.3 },
            heal_scale: [0.23, 0.38],
          },
        }),
      ),
    },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
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
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_3',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
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
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'delay_time',
          operation: 'add',
          value: 20,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_5_rate',
          operation: 'add',
          value: 0.04,
        },
      ],
    },
  ],
  entityBlackboard: { EntityBB_combo_index: 0, EntityBB_combo_type: 2 },
  buffDefinitions: {
    buff_chr_0023_antal_normal_icon: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0 },
      attributeModifiers: [],
    },
    buff_chr_0023_antal_normal_icon_2: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0 },
      attributeModifiers: [],
    },
    buff_chr_0023_antal_normal_skill: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 2,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: {
        delay_time: 0,
        duration: 60,
        potential_3: 0,
        potential_3_atb: 0,
        potential_5: 0,
        potential_5_rate: 0,
        rate: 0.2,
      },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0023_antal_tageffect',
            target: 'buffSource',
            source: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: {
              rate: 'rate',
              duration: 'duration',
              potential_3: 'potential_3',
              potential_3_atb: 'potential_3_atb',
              potential_5_rate: 'potential_5_rate',
              potential_5: 'potential_5',
              delay_time: 'delay_time',
            },
          }),
        ),
      },
    },
    buff_chr_0023_antal_tageffect: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: { blackboardKey: 'delay_time' },
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
      presentation: {
        visible: true,
        iconId: 'icon_battle_antal_buff',
        iconPath: '/icons/icon_battle_antal_buff.webp',
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
      blackboard: {
        delay_time: 0,
        duration: 0,
        potential_3: 0,
        potential_3_atb: 0,
        potential_5: 0,
        potential_5_rate: 0,
        rate: 0,
        rate_add: 0.05,
      },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_pulse',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            keywordEnhancements: [
              {
                triggerBuffIds: ['buff_chr_0023_antal_talent_1_combotrigger'],
                operation: 'add',
                value: { kind: 'blackboard', key: 'potential_5_rate' },
              },
            ],
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0023_antal_normal_icon_2' },
          }),
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_fire',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            keywordEnhancements: [
              {
                triggerBuffIds: ['buff_chr_0023_antal_talent_1_combotrigger'],
                operation: 'add',
                value: { kind: 'blackboard', key: 'potential_5_rate' },
              },
            ],
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0023_antal_normal_icon' },
          }),
        ),
        trigger: sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential_5', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0023_antal_talent_1_combotrigger',
                target: 'buffOwner',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
              }),
            ),
          ),
        ),
        finish: sequence(
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0023_antal_talent_1_combotrigger'],
            reason: 'other',
          }),
        ),
      },
    },
    buff_chr_0023_antal_talent_1: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 2,
      applyTags: [],
      extendTags: [],
      blackboard: { cd: 30, healvalue: 300, multiplier: 3 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0023_antal_talent_1_heal_trigger',
            target: 'party',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              healvalue: { kind: 'blackboard', key: 'healvalue' },
              cd: { kind: 'blackboard', key: 'cd' },
              multiplier: { kind: 'blackboard', key: 'multiplier' },
            },
          }),
        ),
      },
    },
    buff_chr_0023_antal_talent_1_combotrigger: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 0.1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0023_antal_talent_1_heal_trigger: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 2,
      applyTags: [],
      extendTags: [],
      blackboard: { cd: 0, healvalue: 0, multiplier: 0 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'outputDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'not',
                condition: {
                  kind: 'globalCooldownPresent',
                  target: 'buffOwner',
                  markerId: 'buff_chr_0023_antal_talent_1_heal_trigger',
                },
              },
              sequence(
                branch(
                  {
                    kind: 'entityTagMatch',
                    target: 'buffOwner',
                    tagQueryType: 'hasAny',
                    tags: ['Skill/Character/Common/Affixes/Enhance'],
                  },
                  sequence(
                    branch(
                      {
                        kind: 'eventDamageTagsMatch',
                        match: 'hasAny',
                        tags: ['normalSkill', 'ultimateSkill', 'comboSkill'],
                      },
                      sequence(
                        step('heal', {
                          target: 'buffOwner',
                          alwaysNext: true,
                          tags: [],
                          attribute: 'strength',
                          multiplier: { kind: 'blackboard', key: 'multiplier' },
                          addition: { kind: 'blackboard', key: 'healvalue' },
                        }),
                        step('setGlobalCooldown', {
                          target: 'buffOwner',
                          markerId: 'buff_chr_0023_antal_talent_1_heal_trigger',
                          durationSeconds: { kind: 'blackboard', key: 'cd' },
                        }),
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
    buff_chr_0023_antal_talent_2: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { heal_scale: 0.1, healvalue: 300, probability: 0.3 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'beforeTakeDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'buffIdStackCompare',
                target: 'buffOwner',
                buffIds: ['buff_common_dash'],
                operator: 'lessOrEqual',
                value: { kind: 'constant', value: 0 },
              },
              sequence(
                branch(
                  { kind: 'eventDamageTypeIn', damageTypes: ['physical'] },
                  sequence(
                    branch(
                      {
                        kind: 'probability',
                        probability: { kind: 'blackboard', key: 'probability' },
                      },
                      sequence(
                        step('applyBuff', {
                          buffId: 'buff_common_damage_immune_talent',
                          target: 'buffSource',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                          blackboardAssignments: { duration: { kind: 'constant', value: 0.01 } },
                        }),
                        step('heal', {
                          target: 'buffOwner',
                          alwaysNext: true,
                          tags: [],
                          attribute: 'strength',
                          multiplier: { kind: 'blackboard', key: 'heal_scale' },
                          addition: { kind: 'blackboard', key: 'healvalue' },
                        }),
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
    buff_chr_0023_antal_ultimate_icon: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_affix_fire_enhance',
        iconPath: '/icons/icon_battle_affix_fire_enhance.webp',
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
    buff_chr_0023_antal_ultimate_icon_2: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_affix_pulse_enhance',
        iconPath: '/icons/icon_battle_affix_pulse_enhance.webp',
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
    buff_chr_0023_antal_utimate_skill: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 20, healvalue: 500, multiplier: 3, rate: 0.4 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_enhance_pulse',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0023_antal_ultimate_icon_2' },
          }),
          step('applyBuff', {
            buffId: 'buff_common_affixes_enhance_fire',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0023_antal_ultimate_icon' },
          }),
        ),
      },
    },
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default antal;
