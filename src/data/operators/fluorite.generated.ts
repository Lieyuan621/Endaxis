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
        skillId: 'chr_0022_bounda_attack4_projhit',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 1,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atb: 0, atk_scale: 0, attack_poise: 20 },
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
                  stagger: { kind: 'blackboard', key: 'attack_poise' },
                  staggerOnlyWhenCasterControlled: true,
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

export const fluoriteChr_0022_bounda_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0022_bounda_attack1',
    timelineBlockFrames: 22,
    naturalDurationFrames: 132,
    exclusiveFrame: 25,
    offsetRecordFrame: 13,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 10,
          endFrame: 40,
          input: 'basicAttack',
          targetSkillId: 'chr_0022_bounda_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 22, endFrame: 40, skillIds: ['chr_0022_bounda_attack2'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        13,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0022_bounda_attack1.actionGroupData.timelineActions[5]._sequenceActionData.actionData[1]:projectile_chr_0022_bounda_attack1',
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
                    skillId: 'chr_0022_bounda_attack1_projhit',
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
                            'chr_0022_bounda_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
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
        22,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0022_bounda_attack2'] })),
        40,
      ),
    ],
    timelineContinuationSkillId: 'chr_0022_bounda_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56] },
);

export const fluoriteChr_0022_bounda_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0022_bounda_attack2',
    timelineBlockFrames: 15,
    naturalDurationFrames: 106,
    exclusiveFrame: 20,
    offsetRecordFrame: 9,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 10,
          endFrame: 36,
          input: 'basicAttack',
          targetSkillId: 'chr_0022_bounda_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 15, endFrame: 36, skillIds: ['chr_0022_bounda_attack3'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        9,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0022_bounda_attack2.actionGroupData.timelineActions[4]._sequenceActionData.actionData[1]:projectile_chr_0022_bounda_attack1',
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
                    skillId: 'chr_0022_bounda_attack2_projhit',
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
                            'chr_0022_bounda_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
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
        15,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0022_bounda_attack3'] })),
        36,
      ),
    ],
    timelineContinuationSkillId: 'chr_0022_bounda_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.33, 0.36, 0.39, 0.42, 0.46, 0.49, 0.52, 0.55, 0.59, 0.63, 0.67, 0.73],
    display_atk_scale: [0.33, 0.36, 0.39, 0.42, 0.46, 0.49, 0.52, 0.55, 0.59, 0.63, 0.67, 0.73],
  },
);

export const fluoriteChr_0022_bounda_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0022_bounda_attack3',
    timelineBlockFrames: 18,
    naturalDurationFrames: 137,
    exclusiveFrame: 25,
    offsetRecordFrame: 9,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 10,
          endFrame: 24,
          input: 'basicAttack',
          targetSkillId: 'chr_0022_bounda_attack4',
        },
        {
          startFrame: 24,
          endFrame: 30,
          input: 'basicAttack',
          targetSkillId: 'chr_0022_bounda_attack4_1',
        },
      ],
      allowedNextSkills: [
        { startFrame: 18, endFrame: 24, skillIds: ['chr_0022_bounda_attack4'] },
        { startFrame: 24, endFrame: 30, skillIds: ['chr_0022_bounda_attack4_1'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        9,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0022_bounda_attack3.actionGroupData.timelineActions[3]._sequenceActionData.actionData[1]:projectile_chr_0022_bounda_attack1',
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
                    skillId: 'chr_0022_bounda_attack3_projhit',
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
                            'chr_0022_bounda_attack3:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
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
            }),
            {},
            { lifetime: 'execution' },
          ),
        ),
        10,
      ),
      scheduled(
        18,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0022_bounda_attack4'] })),
        24,
      ),
      scheduled(
        24,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0022_bounda_attack4_1'] })),
        30,
      ),
    ],
    timelineContinuationSkillId: 'chr_0022_bounda_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.26, 0.28, 0.31, 0.33, 0.36, 0.38, 0.41, 0.43, 0.46, 0.49, 0.53, 0.57] },
);

export const fluoriteChr_0022_bounda_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0022_bounda_attack4',
    timelineBlockFrames: 56,
    naturalDurationFrames: 153,
    exclusiveFrame: 55,
    offsetRecordFrame: 29,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 29,
          endFrame: 71,
          input: 'basicAttack',
          targetSkillId: 'chr_0022_bounda_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 52, endFrame: 71, skillIds: ['chr_0022_bounda_attack1'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        29,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0022_bounda_attack4.actionGroupData.timelineActions[3]._sequenceActionData.actionData[1]:projectile_chr_0022_bounda_attack4',
          'chr_0022_bounda_attack4:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        30,
      ),
      scheduled(
        26,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'slow' },
            finishByAction: false,
            targets: ['caster'],
          }),
        ),
        29,
      ),
      scheduled(
        52,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0022_bounda_attack1'] })),
        71,
      ),
    ],
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 15,
    atk_scale: [0.6, 0.66, 0.72, 0.78, 0.84, 0.9, 0.96, 1.02, 1.08, 1.16, 1.25, 1.35],
    attack_poise: 15,
    display_atk_scale: [1.8, 1.98, 2.16, 2.34, 2.52, 2.7, 2.88, 3.06, 3.24, 3.47, 3.74, 4.05],
  },
);

export const fluoriteChr_0022_bounda_attack4_1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0022_bounda_attack4_1',
    timelineBlockFrames: 49,
    naturalDurationFrames: 150,
    exclusiveFrame: 52,
    offsetRecordFrame: 26,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 10,
          endFrame: 70,
          input: 'basicAttack',
          targetSkillId: 'chr_0022_bounda_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 49, endFrame: 70, skillIds: ['chr_0022_bounda_attack1'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        26,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0022_bounda_attack4_1.actionGroupData.timelineActions[3]._sequenceActionData.actionData[1]:projectile_chr_0022_bounda_attack4',
          'chr_0022_bounda_attack4_1:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
        ]),
        27,
      ),
      scheduled(
        23,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'slow' },
            finishByAction: false,
            targets: ['caster'],
          }),
        ),
        26,
      ),
      scheduled(
        49,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0022_bounda_attack1'] })),
        70,
      ),
    ],
    timelineContinuationSkillId: 'chr_0022_bounda_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 15,
    atk_scale: [0.6, 0.66, 0.72, 0.78, 0.84, 0.9, 0.96, 1.02, 1.08, 1.16, 1.25, 1.35],
    attack_poise: 15,
    display_atk_scale: [1.8, 1.98, 2.16, 2.34, 2.52, 2.7, 2.88, 3.06, 3.24, 3.47, 3.74, 4.05],
  },
);

export const fluoriteChr_0022_bounda_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0022_bounda_power_attack',
    timelineBlockFrames: 22,
    naturalDurationFrames: 127,
    exclusiveFrame: 45,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 22,
          endFrame: 45,
          skillIds: ['chr_0022_bounda_normal_skill', 'chr_0022_bounda_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        20,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 1,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0022_bounda_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
        ),
        21,
      ),
      scheduled(
        18,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.12 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_hard_stop' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
            ),
          ),
        ),
        24,
      ),
      scheduled(
        21,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.25 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_normal_attack' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
            ),
          ),
        ),
        25,
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
        22,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const fluoriteChr_0022_bounda_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0022_bounda_plunging_attack_end',
    timelineBlockFrames: 21,
    naturalDurationFrames: 90,
    exclusiveFrame: 20,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        1,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'plungingAttack'],
            },
            'chr_0022_bounda_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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
        6,
      ),
    ],
    skillType: 'plungingAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
);

export const fluoriteChr_0022_bounda_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0022_bounda_normal_skill',
    timelineBlockFrames: 35,
    naturalDurationFrames: 101,
    exclusiveFrame: 34,
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
        10,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0022_bounda_normal_skill_onlymark',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
          withActionBlackboardScope(
            'SkillData.chr_0022_bounda_normal_skill.actionGroupData.timelineActions[7]._sequenceActionData.actionData[2]:projectile_chr_0022_bounda_normal_skill',
            {},
            true,
            sequence({
              kind: 'launchProjectile',
              parameters: {
                finish: 3,
                recycleDelaySeconds: 0.0333333350718021,
                hit: { finishOnHit: true },
              },
              callbacks: [
                {
                  event: 'hit',
                  skill: {
                    skillId: 'chr_0022_bounda_normal_skill_projhit',
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
                      boom_up: 0,
                      duration: 0,
                      duration_potential: 0,
                      move_speed_scalar: 0,
                      poise: 30,
                      potential_lv: 0,
                    },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step('spawnAbilityEntity', {
                            abilityEntityId: 'abilityentity_chr_0022_bounda_normal_skill',
                            childSkillId: 'chr_0022_bounda_normal_skill_abilityrange',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            target: 'enemy',
                          }),
                          step('applyBuff', {
                            buffId: 'buff_common_affixes_slow',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            blackboardAssignments: {
                              duration: { kind: 'constant', value: 3.1 },
                              rate: { kind: 'blackboard', key: 'move_speed_scalar' },
                            },
                          }),
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
        12,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'slow' },
            finishByAction: false,
            targets: ['caster'],
          }),
        ),
        14,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atk_scale: [1.87, 2.06, 2.24, 2.43, 2.62, 2.8, 2.99, 3.18, 3.36, 3.6, 3.88, 4.2],
    boom_up: 0.3,
    cam_angle: 0,
    cam_duration: 0,
    consume_cnt: 0,
    duration: 3,
    duration_potential: 0,
    gained_atb: 0,
    input_angle: 0,
    move_speed_scalar: 0.3,
    poise: 10,
    potential_lv: 0,
  },
);

export const fluoriteChr_0022_bounda_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0022_bounda_ultimate_skill',
    timelineBlockFrames: 77,
    naturalDurationFrames: 120,
    exclusiveFrame: 90,
    offsetRecordFrame: 0,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 68,
          endFrame: 94,
          input: 'basicAttack',
          targetSkillId: 'chr_0022_bounda_attack1',
        },
      ],
      allowedNextSkills: [
        {
          startFrame: 77,
          endFrame: 94,
          skillIds: [
            'chr_0022_bounda_attack1',
            'chr_0022_bounda_normal_skill',
            'chr_0022_bounda_combo_skill',
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
          step('applyBuff', {
            buffId: 'buff_common_damage_immune_ult_skill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        90,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 56),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        56,
      ),
      scheduled(
        59,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0022_bounda_ultimate_skill.actionGroupData.timelineActions[12]._sequenceActionData.actionData[0]:projectile_chr_0022_bounda_ultimate_skill_1',
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
                    skillId: 'chr_0022_bounda_ultimate_skill_1_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atb: 0, atk_scale1: 0, poise: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'nature',
                              attackScale: { kind: 'blackboard', key: 'atk_scale1' },
                              tags: ['ultimateSkill'],
                              features: ['canBreakWeakness'],
                              stagger: { kind: 'blackboard', key: 'poise' },
                            },
                            'chr_0022_bounda_ultimate_skill:/scheduledSequences/4/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                          step('applyBuff', {
                            buffId: 'buff_chr_0022_bounda_ultimate_skill',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          }),
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
        60,
      ),
      scheduled(
        63,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0022_bounda_ultimate_skill.actionGroupData.timelineActions[13]._sequenceActionData.actionData[0]:projectile_chr_0022_bounda_ultimate_skill_1',
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
                    skillId: 'chr_0022_bounda_ultimate_skill_2_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atb: 0, atk_scale2: 0, atk_scale3: 0, poise: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'nature',
                              attackScale: { kind: 'blackboard', key: 'atk_scale2' },
                              tags: ['ultimateSkill'],
                              stagger: { kind: 'blackboard', key: 'poise' },
                            },
                            'chr_0022_bounda_ultimate_skill:/scheduledSequences/5/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                          step('applyBuff', {
                            buffId: 'buff_chr_0022_bounda_ultimate_skill',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          }),
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
        64,
      ),
      scheduled(
        67,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0022_bounda_ultimate_skill.actionGroupData.timelineActions[14]._sequenceActionData.actionData[0]:projectile_chr_0022_bounda_ultimate_skill_1',
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
                    skillId: 'chr_0022_bounda_ultimate_skill_3_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atb: 0, atk_scale3: 0, poise: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'nature',
                              attackScale: { kind: 'blackboard', key: 'atk_scale3' },
                              tags: ['ultimateSkill'],
                              stagger: { kind: 'blackboard', key: 'poise' },
                            },
                            'chr_0022_bounda_ultimate_skill:/scheduledSequences/6/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                          step('applyBuff', {
                            buffId: 'buff_chr_0022_bounda_ultimate_skill',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          }),
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
        68,
      ),
      scheduled(
        72,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0022_bounda_ultimate_skill.actionGroupData.timelineActions[15]._sequenceActionData.actionData[0]:projectile_chr_0022_bounda_ultimate_skill_1',
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
                    skillId: 'chr_0022_bounda_ultimate_skill_4_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atb: 0, atk_scale4: 0, poise: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          branch(
                            {
                              kind: 'buffStackCompare',
                              target: 'enemy',
                              tagQueryType: 'hasAny',
                              buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                              operator: 'greaterOrEqual',
                              value: { kind: 'constant', value: 2 },
                            },
                            sequence(
                              step('applyElementalInfliction', {
                                element: 'nature',
                                isExtra: false,
                              }),
                            ),
                            sequence(
                              branch(
                                {
                                  kind: 'buffStackCompare',
                                  target: 'enemy',
                                  tagQueryType: 'hasAny',
                                  buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
                                  operator: 'greaterOrEqual',
                                  value: { kind: 'constant', value: 2 },
                                },
                                sequence(
                                  step('applyElementalInfliction', {
                                    element: 'cryo',
                                    isExtra: false,
                                  }),
                                ),
                                undefined,
                                { alwaysNext: true },
                              ),
                            ),
                            { alwaysNext: true },
                          ),
                          step(
                            'dealDamage',
                            {
                              damageType: 'nature',
                              attackScale: { kind: 'blackboard', key: 'atk_scale4' },
                              tags: ['ultimateSkill'],
                              stagger: { kind: 'blackboard', key: 'poise' },
                            },
                            'chr_0022_bounda_ultimate_skill:/scheduledSequences/7/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1',
                          ),
                          step('applyBuff', {
                            buffId: 'buff_chr_0022_bounda_ultimate_skill',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          }),
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
        73,
      ),
    ],
    cooldownFrames: 300,
    costs: [{ resource: 'ultimateEnergy', value: 100 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale1: [1.11, 1.22, 1.33, 1.44, 1.56, 1.67, 1.78, 1.89, 2, 2.14, 2.31, 2.5],
    atk_scale2: [1.11, 1.22, 1.33, 1.44, 1.56, 1.67, 1.78, 1.89, 2, 2.14, 2.31, 2.5],
    atk_scale3: [1.11, 1.22, 1.33, 1.44, 1.56, 1.67, 1.78, 1.89, 2, 2.14, 2.31, 2.5],
    atk_scale4: [1.11, 1.22, 1.33, 1.44, 1.56, 1.67, 1.78, 1.89, 2, 2.14, 2.31, 2.5],
    poise: 5,
  },
);

export const fluoriteChr_0022_bounda_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0022_bounda_combo_skill',
    timelineBlockFrames: 25,
    naturalDurationFrames: 93,
    exclusiveFrame: 24,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 17, endFrame: 56, skillIds: ['chr_0022_bounda_normal_skill'] },
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
        15,
        sequence(
          {
            kind: 'switch',
            parameters: {
              choice: { kind: 'blackboard', key: 'EntityBB_combo_index' },
              alwaysNext: true,
            },
            options: [
              {
                value: { kind: 'constant', value: 2 },
                sequence: sequence(
                  step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                ),
              },
              {
                value: { kind: 'constant', value: 3 },
                sequence: sequence(
                  step('applyElementalInfliction', { element: 'nature', isExtra: false }),
                ),
              },
            ],
          },
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0022_bounda_combo_skill:/scheduledSequences/1/sequence/steps/1',
          ),
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'usp' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          }),
        ),
        18,
      ),
      scheduled(
        11,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'slow' },
            finishByAction: false,
            targets: ['caster'],
          }),
        ),
        20,
      ),
      scheduled(
        16,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.33 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'bounda_power_attack' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
            ),
          ),
        ),
        19,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.533 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        13,
      ),
    ],
    smartTarget: 'trigger',
    cooldownFrames: [1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1200, 1140],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [1.69, 1.86, 2.03, 2.2, 2.37, 2.54, 2.7, 2.87, 3.04, 3.25, 3.51, 3.8],
    poise: 10,
    potential_lv: 0,
    usp: 10,
  },
);

export const fluoriteCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const fluorite: OperatorDefinition = {
  slug: 'fluorite',
  gameId: 'FLUORITE',
  rarity: 4,
  weaponType: 'handcannon',
  element: 'nature',
  role: 'caster',
  mainAttribute: 'agility',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [14, 30, 47, 64, 81, 90],
    agility: [14, 47, 81, 116, 150, 168],
    intellect: [12, 34, 57, 80, 103, 114],
    will: [10, 27, 45, 64, 82, 91],
    baseAttack: [30, 88, 150, 211, 272, 303],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        fluoriteChr_0022_bounda_attack1,
        fluoriteChr_0022_bounda_attack2,
        fluoriteChr_0022_bounda_attack3,
        fluoriteChr_0022_bounda_attack4,
        fluoriteChr_0022_bounda_attack4_1,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: fluoriteChr_0022_bounda_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: fluoriteChr_0022_bounda_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: fluoriteChr_0022_bounda_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: fluoriteChr_0022_bounda_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: fluoriteChr_0022_bounda_combo_skill,
    },
  ],
  dodgeSkill: fluoriteCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0022_bounda_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0022_bounda_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0022_bounda_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0022_bounda_attack1',
        'chr_0022_bounda_attack2',
        'chr_0022_bounda_attack3',
        'chr_0022_bounda_attack4',
        'chr_0022_bounda_attack4_1',
        'chr_0022_bounda_plunging_attack_end',
        'chr_0022_bounda_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0022_bounda_attack1',
        'chr_0022_bounda_attack2',
        'chr_0022_bounda_attack3',
        'chr_0022_bounda_attack4',
      ],
      defaultSkillKey: 'chr_0022_bounda_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0022_bounda_combo_skill',
      event: 'beforeTakeInfliction',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'contextTargetBuffStackCompare',
            contextKey: 'trigger',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            operator: 'greaterOrEqual',
            value: { kind: 'constant', value: 1 },
          },
          sequence(
            branch(
              {
                kind: 'eventInflictionElementIn',
                elements: ['cryo'],
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
      skillKey: 'chr_0022_bounda_combo_skill',
      event: 'beforeTakeInfliction',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'contextTargetBuffStackCompare',
            contextKey: 'trigger',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
            operator: 'greaterOrEqual',
            value: { kind: 'constant', value: 1 },
          },
          sequence(
            branch(
              {
                kind: 'eventInflictionElementIn',
                elements: ['nature'],
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
      passiveSkills: [
        {
          key: 'chr_0022_bounda_talent_1',
          blackboard: { dmg_up: [0.1, 0.2] },
          enableSequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0022_bounda_talent_1',
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
          key: 'chr_0022_bounda_talent_2',
          blackboard: { atk_up: [0.1, 0.2], duration: [10, 10], probability: [0.2, 0.2] },
          enableSequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0022_bounda_talent_2',
              target: 'caster',
              inheritSourceSkillCastInfo: false,
              blackboardAssignments: {
                atk_up: { kind: 'blackboard', key: 'atk_up' },
                duration: { kind: 'blackboard', key: 'duration' },
                probability: { kind: 'blackboard', key: 'probability' },
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
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 10 },
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 10 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0022_bounda_talent_2',
          blackboardKey: 'probability',
          operation: 'add',
          value: 0.1,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'duration_potential',
          operation: 'assign',
          value: 6,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_lv',
          operation: 'assign',
          value: 3,
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
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0022_bounda_potential_5_auro',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: {
            CD: { kind: 'constant', value: 1 },
            reduce: { kind: 'constant', value: 1 },
          },
        }),
      ),
    },
  ],
  entityBlackboard: { EntityBB_combo_index: 0 },
  buffDefinitions: {
    buff_chr_0022_bounda_normal_skill_onlymark: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 5,
      triggerIntervalSeconds: 0,
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
      applyTags: ['Status/DisableNormalSkill'],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0022_bounda_potential_5_auro: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { CD: 1, dmg_up: 0, reduce: 1 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0022_bounda_potential_5_cd',
            target: 'enemy',
            source: 'buffOwner',
            finishByAction: true,
            blackboardAssignments: {
              CD: { kind: 'blackboard', key: 'CD' },
              reduce: { kind: 'blackboard', key: 'reduce' },
            },
          }),
        ),
      },
    },
    buff_chr_0022_bounda_potential_5_cd: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { CD: 0, dmg_up: 0, reduce: 0 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'beforeTakeInfliction',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'not',
                condition: { kind: 'timedMarkerPresent', target: 'caster', markerId: 'potential' },
              },
              sequence(
                branch(
                  { kind: 'eventInflictionElementIn', elements: ['cryo', 'nature'] },
                  sequence(
                    step('adjustSkillCooldown', {
                      target: 'caster',
                      skill: { kind: 'id', skillId: 'chr_0022_bounda_combo_skill' },
                      operation: 'reduce',
                      basis: 'absoluteSeconds',
                      value: { kind: 'blackboard', key: 'reduce' },
                    }),
                    step('createTimedMarker', {
                      target: 'caster',
                      markerId: 'potential',
                      durationSeconds: { kind: 'blackboard', key: 'CD' },
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
    buff_chr_0022_bounda_talent_1: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { dmg_up: 0 },
      attributeModifiers: [],
      damageModifiers: [
        {
          enabledSide: 'attacker',
          condition: {
            kind: 'entityTagMatch',
            target: 'enemy',
            tagQueryType: 'hasAny',
            tags: ['Skill/Character/Common/Affixes/Slow'],
          },
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
    buff_chr_0022_bounda_talent_2: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_up: 0.1, duration: 10, probability: 0.2 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'beforeTakeDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'entityTagMatch',
                target: 'buffOwner',
                tagQueryType: 'exceptAny',
                tags: ['Status/DashImmune', 'Status/DashSucceedImmune'],
              },
              sequence(
                branch(
                  { kind: 'eventDamageTypeIn', damageTypes: ['heat'] },
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
                        step('applyBuff', {
                          buffId: 'buff_chr_0022_bounda_talent_2_atkup',
                          target: 'buffSource',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration' },
                        }),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        },
        {
          event: 'beforeTakeDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'entityTagMatch',
                target: 'buffOwner',
                tagQueryType: 'exceptAny',
                tags: ['Status/DashImmune', 'Status/DashSucceedImmune'],
              },
              sequence(
                branch(
                  { kind: 'eventDamageTypeIn', damageTypes: ['electric'] },
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
                        step('applyBuff', {
                          buffId: 'buff_chr_0022_bounda_talent_2_atkup',
                          target: 'buffSource',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration' },
                        }),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        },
        {
          event: 'beforeTakeDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'entityTagMatch',
                target: 'buffOwner',
                tagQueryType: 'exceptAny',
                tags: ['Status/DashImmune', 'Status/DashSucceedImmune'],
              },
              sequence(
                branch(
                  { kind: 'eventDamageTypeIn', damageTypes: ['cryo'] },
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
                        step('applyBuff', {
                          buffId: 'buff_chr_0022_bounda_talent_2_atkup',
                          target: 'buffSource',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration' },
                        }),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        },
        {
          event: 'beforeTakeDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'entityTagMatch',
                target: 'buffOwner',
                tagQueryType: 'exceptAny',
                tags: ['Status/DashImmune', 'Status/DashSucceedImmune'],
              },
              sequence(
                branch(
                  { kind: 'eventDamageTypeIn', damageTypes: ['nature'] },
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
                        step('applyBuff', {
                          buffId: 'buff_chr_0022_bounda_talent_2_atkup',
                          target: 'buffSource',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration' },
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
    buff_chr_0022_bounda_talent_2_atkup: {
      stackingType: 'refresh',
      priority: 0,
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
      blackboard: { atk_up: 0.1, duration: 10 },
      attributeModifiers: [
        { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
      ],
    },
    buff_chr_0022_bounda_ultimate_skill: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 0.2,
      triggerIntervalSeconds: 0,
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0022_bounda_normal_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0022_bounda_normal_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 210,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale: 1,
          boom_up: 0,
          duration: 0,
          duration_potential: 0,
          move_speed_scalar: 0,
          poise: 20,
          potential_lv: 0,
          usp: 5,
        },
        scheduledSequences: [
          scheduled(
            89,
            sequence(
              step('finishBuffsById', {
                target: 'caster',
                buffIds: [
                  'buff_chr_0022_bounda_normal_skill_onlymark',
                  'buff_chr_0022_bounda_ultimate_skill',
                ],
                reason: 'other',
              }),
              step('applyElementalInfliction', { element: 'nature', isExtra: false }),
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                'abilityentity_chr_0022_bounda_normal_skill:chr_0022_bounda_normal_skill_abilityrange:/childSkill/scheduledSequences/0/sequence/steps/2',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'potential_lv', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 3 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_common_affixes_slow',
                    target: 'enemy',
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      duration: { kind: 'blackboard', key: 'duration_potential' },
                      rate: { kind: 'blackboard', key: 'move_speed_scalar' },
                    },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
            ),
            90,
          ),
          scheduled(90, sequence(step('finishActionOwnerAbilityEntity', {})), 90),
          scheduled(
            149,
            sequence(
              step('finishBuffsById', {
                target: 'caster',
                buffIds: [
                  'buff_chr_0022_bounda_normal_skill_onlymark',
                  'buff_chr_0022_bounda_ultimate_skill',
                ],
                reason: 'other',
              }),
              step('applyElementalInfliction', { element: 'nature', isExtra: false }),
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalSkill'],
                  features: ['canBreakWeakness'],
                  instantDamageScaleModifiers: [
                    {
                      side: 'attacker',
                      zone: 'product',
                      addition: { kind: 'constant', value: 0.3 },
                    },
                  ],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                'abilityentity_chr_0022_bounda_normal_skill:chr_0022_bounda_normal_skill_abilityrange:/childSkill/scheduledSequences/2/sequence/steps/2',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'potential_lv', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 3 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_common_affixes_slow',
                    target: 'enemy',
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      duration: { kind: 'blackboard', key: 'duration_potential' },
                      rate: { kind: 'blackboard', key: 'move_speed_scalar' },
                    },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
            ),
            150,
          ),
          scheduled(150, sequence(step('finishActionOwnerAbilityEntity', {})), 150),
          scheduled(
            0,
            sequence(
              step('jumpTimeline', {
                destinationFrame: 89,
                condition: {
                  kind: 'healthCompare',
                  target: 'enemy',
                  valueType: 'ratio',
                  operator: 'lessOrEqual',
                  value: { kind: 'constant', value: 0 },
                },
              }),
            ),
            89,
          ),
          scheduled(
            0,
            sequence(
              step('jumpTimeline', {
                destinationFrame: 149,
                condition: {
                  kind: 'buffIdStackCompare',
                  target: 'enemy',
                  buffIds: ['buff_chr_0022_bounda_ultimate_skill'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
              }),
            ),
            89,
          ),
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default fluorite;
