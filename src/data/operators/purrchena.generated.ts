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

const sharedActionSequence4: ActionSequenceDefinition = sequence(
  branch(
    { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
    sequence(
      step('modifyActionValue', {
        key: 'comboType',
        operation: 'assign',
        value: { kind: 'constant', value: 2 },
      }),
      step('modifyActionValue', {
        key: 'comboType_last',
        operation: 'assign',
        value: { kind: 'blackboard', key: 'comboType' },
      }),
      step('applyBuff', {
        buffId: 'buff_chr_0038_purrche_combo_lasttype',
        target: 'caster',
        inheritSourceSkillCastInfo: true,
        copiedBlackboardAssignments: { combotype: 'comboType_last' },
      }),
    ),
    sequence(
      step('modifyActionValue', {
        key: 'comboType',
        operation: 'assign',
        value: { kind: 'constant', value: 3 },
      }),
      step('modifyActionValue', {
        key: 'comboType_last',
        operation: 'assign',
        value: { kind: 'blackboard', key: 'comboType' },
      }),
      step('applyBuff', {
        buffId: 'buff_chr_0038_purrche_combo_lasttype',
        target: 'caster',
        inheritSourceSkillCastInfo: true,
        copiedBlackboardAssignments: { combotype: 'comboType_last' },
      }),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence7: ActionSequenceDefinition = sequence(
  branch(
    { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
    sequence(
      step('modifyActionValue', {
        key: 'comboType',
        operation: 'assign',
        value: { kind: 'constant', value: 1 },
      }),
      step('modifyActionValue', {
        key: 'comboType_last',
        operation: 'assign',
        value: { kind: 'blackboard', key: 'comboType' },
      }),
      step('applyBuff', {
        buffId: 'buff_chr_0038_purrche_combo_lasttype',
        target: 'caster',
        inheritSourceSkillCastInfo: true,
        copiedBlackboardAssignments: { combotype: 'comboType_last' },
      }),
    ),
    sequence(
      step('modifyActionValue', {
        key: 'comboType',
        operation: 'assign',
        value: { kind: 'constant', value: 3 },
      }),
      step('modifyActionValue', {
        key: 'comboType_last',
        operation: 'assign',
        value: { kind: 'blackboard', key: 'comboType' },
      }),
      step('applyBuff', {
        buffId: 'buff_chr_0038_purrche_combo_lasttype',
        target: 'caster',
        inheritSourceSkillCastInfo: true,
        copiedBlackboardAssignments: { combotype: 'comboType_last' },
      }),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence9: ActionSequenceDefinition = sequence(
  branch(
    { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
    sequence(
      step('modifyActionValue', {
        key: 'comboType',
        operation: 'assign',
        value: { kind: 'constant', value: 1 },
      }),
      step('modifyActionValue', {
        key: 'comboType_last',
        operation: 'assign',
        value: { kind: 'blackboard', key: 'comboType' },
      }),
      step('applyBuff', {
        buffId: 'buff_chr_0038_purrche_combo_lasttype',
        target: 'caster',
        inheritSourceSkillCastInfo: true,
        copiedBlackboardAssignments: { combotype: 'comboType_last' },
      }),
    ),
    sequence(
      step('modifyActionValue', {
        key: 'comboType',
        operation: 'assign',
        value: { kind: 'constant', value: 2 },
      }),
      step('modifyActionValue', {
        key: 'comboType_last',
        operation: 'assign',
        value: { kind: 'blackboard', key: 'comboType' },
      }),
      step('applyBuff', {
        buffId: 'buff_chr_0038_purrche_combo_lasttype',
        target: 'caster',
        inheritSourceSkillCastInfo: true,
        copiedBlackboardAssignments: { combotype: 'comboType_last' },
      }),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence15: ActionSequenceDefinition = sequence(
  step('startTimeDilation', {
    scope: 'entity',
    durationSeconds: { kind: 'constant', value: 0.034 },
    slot: 'TimeDilation/Layer/Entity/HitStop',
    priority: 10,
    curve: {
      kind: 'inline',
      keys: [
        {
          time: -0.002857149,
          value: 0.07730663,
          inTangent: 0,
          outTangent: 0,
          weightedMode: 0,
          inWeight: 0,
          outWeight: 0,
        },
        {
          time: 0.9971429,
          value: 0.07730663,
          inTangent: 0,
          outTangent: 0,
          weightedMode: 0,
          inWeight: 0,
          outWeight: 0,
        },
      ],
    },
    finishByAction: false,
    targets: ['enemy', 'caster'],
  }),
  step('findUnfinishedProjectileTargets', { saveToContextKey: 'projectile' }),
  step('startTimeDilation', {
    scope: 'entity',
    durationSeconds: { kind: 'constant', value: 0.034 },
    slot: 'TimeDilation/Layer/Entity/HitStop',
    priority: 10,
    curve: {
      kind: 'inline',
      keys: [
        {
          time: -0.002857149,
          value: 0.07730663,
          inTangent: 0,
          outTangent: 0,
          weightedMode: 0,
          inWeight: 0,
          outWeight: 0,
        },
        {
          time: 0.9971429,
          value: 0.07730663,
          inTangent: 0,
          outTangent: 0,
          weightedMode: 0,
          inWeight: 0,
          outWeight: 0,
        },
      ],
    },
    finishByAction: false,
    targets: ['caster'],
    abilityEntityTargets: [{ kind: 'context', contextKey: 'projectile' }],
  }),
);

const sharedActionSequence12: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    sequence({
      kind: 'launchProjectile',
      parameters: {
        finish: 'firstTickReach',
        syncTimeScale: true,
        recycleDelaySeconds: 0.0666666701436043,
        hit: { onReach: true, target: 'controlledOperator', finishOnHit: true },
      },
      callbacks: [
        {
          event: 'hit',
          skill: {
            skillId: 'chr_0038_purrche_combo_skill_gene',
            nativeSkillType: 'normalSkill',
            naturalDurationFrames: 2,
            castResource: {
              costFrame: 0,
              cooldownSeconds: 0,
              maxChargeTime: 1,
              cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
            },
            blackboard: {
              atk_scale_blackhole_dot: 0,
              atk_scale_blackhole_end: 0.1,
              atk_scale_boom: 1,
              comboType: 0,
              duration: 0,
              poise: 15,
              usp: 0,
            },
            scheduledSequences: [
              scheduled(
                0,
                sequence(
                  step('spawnAbilityEntity', {
                    abilityEntityId: 'abilityentity_chr_0038_purrche_combo',
                    childSkillId: 'chr_0038_purrche_combo_skill_giftbox_abilityrange',
                    inheritActionBlackboard: true,
                    dieWhenSourceDies: false,
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
);

const sharedActionSequence16: ActionSequenceDefinition = sequence(
  step('startTimeDilation', {
    scope: 'entity',
    durationSeconds: { kind: 'constant', value: 0.0667 },
    slot: 'TimeDilation/Layer/Entity/HitStop',
    priority: 10,
    curve: {
      kind: 'inline',
      keys: [
        {
          time: 0.002857089,
          value: 0.05236897,
          inTangent: 0,
          outTangent: 0,
          weightedMode: 0,
          inWeight: 0,
          outWeight: 0,
        },
        {
          time: 1.002857,
          value: 0.05236897,
          inTangent: 0,
          outTangent: 0,
          weightedMode: 0,
          inWeight: 0,
          outWeight: 0,
        },
      ],
    },
    finishByAction: false,
    targets: ['enemy'],
    abilityEntityTargets: [{ kind: 'current' }],
  }),
  step('findUnfinishedProjectileTargets', { saveToContextKey: 'projectile' }),
  step('startTimeDilation', {
    scope: 'entity',
    durationSeconds: { kind: 'constant', value: 0.0667 },
    slot: 'TimeDilation/Layer/Entity/HitStop',
    priority: 10,
    curve: {
      kind: 'inline',
      keys: [
        {
          time: -0.005714298,
          value: 0.0488777,
          inTangent: 0,
          outTangent: 0,
          weightedMode: 0,
          inWeight: 0,
          outWeight: 0,
        },
        {
          time: 0.9942858,
          value: 0.0488777,
          inTangent: 0,
          outTangent: 0,
          weightedMode: 0,
          inWeight: 0,
          outWeight: 0,
        },
      ],
    },
    finishByAction: false,
    targets: [],
    abilityEntityTargets: [{ kind: 'context', contextKey: 'projectile' }],
  }),
);

const sharedActionSequence18: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    sequence({
      kind: 'launchProjectile',
      parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
      callbacks: [
        {
          event: 'reach',
          skill: {
            skillId: 'chr_0038_purrche_ult_skill_normal_bomb_projhit',
            nativeSkillType: 'normalSkill',
            naturalDurationFrames: 1,
            castResource: {
              costFrame: 0,
              cooldownSeconds: 0,
              maxChargeTime: 1,
              cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
            },
            blackboard: { atk_scale: 1, duration: 0, poise_1: 5, stack: 0, usp: 0 },
            scheduledSequences: [
              scheduled(
                0,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'physical',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'blackboard', key: 'poise_1' },
                    },
                    '\u0000endaxis-generated-identity:1',
                  ),
                ),
                0,
              ),
              scheduled(0, sequence(), 3),
              scheduled(0, sequence(), 10),
              scheduled(0, sequence(), 14),
            ],
          },
        },
      ],
    }),
    {},
    { lifetime: 'execution' },
  ),
);

const sharedActionSequence20: ActionSequenceDefinition = sequence(
  step('modifyActionValue', {
    key: 'black_hole_count',
    operation: 'assign',
    value: { kind: 'constant', value: 1 },
  }),
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    sequence({
      kind: 'launchProjectile',
      parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
      callbacks: [
        {
          event: 'reach',
          skill: {
            skillId: 'chr_0038_purrche_ult_skill_normal_blackhole_projhit',
            nativeSkillType: 'normalSkill',
            naturalDurationFrames: 1,
            castResource: {
              costFrame: 0,
              cooldownSeconds: 0,
              maxChargeTime: 1,
              cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
            },
            blackboard: {
              atk_scale: 1,
              atk_scale_blackhole_dot: 0,
              atk_scale_blackhole_end: 0,
              duration: 0,
              poise_1: 15,
              stack: 0,
              usp: 0,
            },
            scheduledSequences: [
              scheduled(
                0,
                sequence(
                  step('spawnAbilityEntity', {
                    abilityEntityId: 'abilityentity_chr_0038_purrche_combo_item_1',
                    childSkillId: 'chr_0038_purrche_ultimate_skill_abilityrange_blackhole',
                    inheritActionBlackboard: true,
                    dieWhenSourceDies: false,
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
);

const sharedActionSequence22: ActionSequenceDefinition = sequence({
  kind: 'launchProjectile',
  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
  callbacks: [
    {
      event: 'reach',
      skill: {
        skillId: 'chr_0038_purrche_combo_skill_projhit_1',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 1,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale: 1,
          atk_scale_blackhole_dot: 0,
          duration: 0,
          poise: 10,
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
                  left: { kind: 'blackboard', key: 'potential_3', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('spawnAbilityEntity', {
                    abilityEntityId: 'abilityentity_chr_0038_purrche_combo_item_1',
                    childSkillId: 'chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3',
                    inheritActionBlackboard: true,
                    dieWhenSourceDies: false,
                  }),
                ),
                sequence(
                  step('spawnAbilityEntity', {
                    abilityEntityId: 'abilityentity_chr_0038_purrche_combo_item_1',
                    childSkillId: 'chr_0038_purrche_combo_skill_abilityrange_1_1',
                    inheritActionBlackboard: true,
                    dieWhenSourceDies: false,
                  }),
                ),
                { alwaysNext: true },
              ),
            ),
            0,
          ),
          scheduled(0, sequence(), 3),
        ],
      },
    },
  ],
});

const sharedActionSequence21: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    sharedActionSequence22,
    {},
    { lifetime: 'execution' },
  ),
);

const sharedActionSequence3: ActionSequenceDefinition = sequence(
  step('modifyActionValue', {
    key: 'comboType',
    operation: 'assign',
    value: { kind: 'constant', value: 1 },
  }),
  branch(
    {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'comboType', fallback: 0 },
      operator: 'equal',
      right: { kind: 'blackboard', key: 'comboType_last', fallback: 0 },
    },
    sharedActionSequence4,
    sequence(
      step('modifyActionValue', {
        key: 'comboType_last',
        operation: 'assign',
        value: { kind: 'blackboard', key: 'comboType' },
      }),
      step('applyBuff', {
        buffId: 'buff_chr_0038_purrche_combo_lasttype',
        target: 'caster',
        inheritSourceSkillCastInfo: true,
        copiedBlackboardAssignments: { combotype: 'comboType_last' },
      }),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence6: ActionSequenceDefinition = sequence(
  step('modifyActionValue', {
    key: 'comboType',
    operation: 'assign',
    value: { kind: 'constant', value: 2 },
  }),
  branch(
    {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'comboType', fallback: 0 },
      operator: 'equal',
      right: { kind: 'blackboard', key: 'comboType_last', fallback: 0 },
    },
    sharedActionSequence7,
    sequence(
      step('modifyActionValue', {
        key: 'comboType_last',
        operation: 'assign',
        value: { kind: 'blackboard', key: 'comboType' },
      }),
      step('applyBuff', {
        buffId: 'buff_chr_0038_purrche_combo_lasttype',
        target: 'caster',
        inheritSourceSkillCastInfo: true,
        copiedBlackboardAssignments: { combotype: 'comboType_last' },
      }),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence8: ActionSequenceDefinition = sequence(
  step('modifyActionValue', {
    key: 'comboType',
    operation: 'assign',
    value: { kind: 'constant', value: 3 },
  }),
  branch(
    {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'comboType', fallback: 0 },
      operator: 'equal',
      right: { kind: 'blackboard', key: 'comboType_last', fallback: 0 },
    },
    sharedActionSequence9,
    sequence(
      step('modifyActionValue', {
        key: 'comboType_last',
        operation: 'assign',
        value: { kind: 'blackboard', key: 'comboType' },
      }),
      step('applyBuff', {
        buffId: 'buff_chr_0038_purrche_combo_lasttype',
        target: 'caster',
        inheritSourceSkillCastInfo: true,
        copiedBlackboardAssignments: { combotype: 'comboType_last' },
      }),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence11: ActionSequenceDefinition = sequence(
  branch(
    { kind: 'casterControlled' },
    instantiateActionSequence(sharedActionSequence12, ['\u0000endaxis-generated-identity:0']),
    instantiateActionSequence(sharedActionSequence12, ['\u0000endaxis-generated-identity:1']),
    { alwaysNext: true },
  ),
);

const sharedActionSequence19: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'black_hole_count', fallback: 0 },
      operator: 'less',
      right: { kind: 'constant', value: 1 },
    },
    instantiateActionSequence(sharedActionSequence20, ['\u0000endaxis-generated-identity:0']),
    instantiateActionSequence(sharedActionSequence18, [
      '\u0000endaxis-generated-identity:1',
      '\u0000endaxis-generated-identity:2',
    ]),
    { alwaysNext: true },
  ),
);

const sharedActionSequence14: ActionSequenceDefinition = sequence({
  kind: 'launchProjectile',
  parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.466666668653488 },
  callbacks: [
    {
      event: 'reach',
      skill: {
        skillId: 'chr_0038_purrche_ult_skill_projhit',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 14,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale: 1,
          atk_scale_ult: 4,
          duration: 0,
          duration_vul: 0,
          poise_2: 10,
          rate_vul: 0,
          stack: 0,
          usp: 0,
        },
        scheduledSequences: [
          scheduled(
            0,
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0038_purrche_ult_spell_vulnerable',
                target: 'enemy',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: { duration_vul: 'duration_vul', rate: 'rate_vul' },
              }),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_ult' },
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise_2' },
                },
                '\u0000endaxis-generated-identity:0',
              ),
            ),
            0,
          ),
          scheduled(2, sharedActionSequence15, 2),
          scheduled(6, sharedActionSequence16, 6),
          scheduled(0, sequence(), 44),
          scheduled(2, sequence(), 2),
          scheduled(7, sequence(), 7),
          scheduled(0, sequence(), 15),
        ],
      },
    },
  ],
});

const sharedActionSequence13: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    instantiateActionSequence(sharedActionSequence14, ['\u0000endaxis-generated-identity:1']),
    {},
    { lifetime: 'execution' },
  ),
);

const sharedActionSequence5: ActionSequenceDefinition = sequence(
  branch(
    { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
    sharedActionSequence6,
    sharedActionSequence8,
    { alwaysNext: true },
  ),
);

const sharedActionSequence17: ActionSequenceDefinition = sequence(
  branch(
    { kind: 'probability', probability: { kind: 'blackboard', key: 'normal_boom_prob' } },
    instantiateActionSequence(sharedActionSequence18, [
      '\u0000endaxis-generated-identity:0',
      '\u0000endaxis-generated-identity:1',
    ]),
    instantiateActionSequence(sharedActionSequence19, [
      '\u0000endaxis-generated-identity:2',
      '\u0000endaxis-generated-identity:3',
      '\u0000endaxis-generated-identity:4',
    ]),
    { alwaysNext: true },
  ),
);

const sharedActionSequence10: ActionSequenceDefinition = sequence(
  step('applyBuff', {
    buffId: 'buff_chr_0038_purrche_combo_lasttype',
    target: 'caster',
    inheritSourceSkillCastInfo: true,
  }),
  branch(
    { kind: 'probability', probability: { kind: 'constant', value: 0.3333 } },
    sharedActionSequence3,
    sharedActionSequence5,
    { alwaysNext: true },
  ),
);

const sharedActionSequence2: ActionSequenceDefinition = sequence(
  step('readBuffBlackboard', {
    target: 'caster',
    query: { kind: 'id', buffIds: ['buff_chr_0038_purrche_combo_lasttype'] },
    desiredKey: 'combotype',
    outputKey: 'comboType_last',
  }),
  branch(
    { kind: 'probability', probability: { kind: 'constant', value: 0.3333 } },
    sharedActionSequence3,
    sharedActionSequence5,
    { alwaysNext: true },
  ),
);

const sharedActionSequence1: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'buffIdStackCompare',
      target: 'caster',
      buffIds: ['buff_chr_0038_purrche_combo_lasttype'],
      operator: 'greaterOrEqual',
      value: { kind: 'constant', value: 1 },
    },
    sharedActionSequence2,
    sharedActionSequence10,
    { alwaysNext: true },
  ),
);

export const purrchenaChr_0038_purrche_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0038_purrche_attack1',
    timelineBlockFrames: 23,
    naturalDurationFrames: 130,
    exclusiveFrame: 28,
    offsetRecordFrame: 10,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 42,
          input: 'basicAttack',
          targetSkillId: 'chr_0038_purrche_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 23, endFrame: 42, skillIds: ['chr_0038_purrche_attack2'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        10,
        sequence(
          repeatEachTick(
            sequence(
              step('calculateActionValue', {
                key: 'atk_scale_1',
                operation: 'multiply',
                left: { kind: 'blackboard', key: 'atk_scale' },
                right: { kind: 'constant', value: 0.4 },
              }),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
                  tags: ['normalAttack'],
                },
                'chr_0038_purrche_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/1',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  once(
                    'SkillData.chr_0038_purrche_attack1.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0].actionOnTick.actionData[3].succeedActions.actionData[0].succeedActions.actionData[0]',
                    sequence(
                      step('startTimeDilation', {
                        scope: 'entity',
                        durationSeconds: { kind: 'constant', value: 0.08 },
                        slot: 'TimeDilation/Layer/Entity/HitStop',
                        priority: 10,
                        curve: { kind: 'named', key: 'char_normal_attack' },
                        finishByAction: false,
                        targets: ['enemy', 'caster'],
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
                targetTriggerIntervalSeconds: 0.033,
              },
            },
          ),
        ),
        11,
      ),
      scheduled(
        17,
        sequence(
          repeatEachTick(
            sequence(
              step('calculateActionValue', {
                key: 'atk_scale_2',
                operation: 'multiply',
                left: { kind: 'blackboard', key: 'atk_scale' },
                right: { kind: 'constant', value: 0.6 },
              }),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalAttack'],
                },
                'chr_0038_purrche_attack1:/scheduledSequences/1/sequence/steps/0/body/steps/1',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  once(
                    'SkillData.chr_0038_purrche_attack1.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].actionOnTick.actionData[3].succeedActions.actionData[0].succeedActions.actionData[0]',
                    sequence(
                      step('startTimeDilation', {
                        scope: 'entity',
                        durationSeconds: { kind: 'constant', value: 0.1 },
                        slot: 'TimeDilation/Layer/Entity/HitStop',
                        priority: 10,
                        curve: { kind: 'named', key: 'char_normal_attack' },
                        finishByAction: false,
                        targets: ['enemy', 'caster'],
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
                targetTriggerIntervalSeconds: 0.033,
              },
            },
          ),
        ),
        18,
      ),
      scheduled(
        23,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0038_purrche_attack2'] })),
        42,
      ),
    ],
    timelineContinuationSkillId: 'chr_0038_purrche_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.48, 0.53, 0.58, 0.62, 0.67, 0.72, 0.77, 0.82, 0.86, 0.92, 1, 1.08],
    atk_scale_1: 0,
    atk_scale_2: 0,
    env_dmg: 15,
  },
);

export const purrchenaChr_0038_purrche_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0038_purrche_attack2',
    timelineBlockFrames: 46,
    naturalDurationFrames: 180,
    exclusiveFrame: 48,
    offsetRecordFrame: 22,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 53,
          input: 'basicAttack',
          targetSkillId: 'chr_0038_purrche_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 46, endFrame: 53, skillIds: ['chr_0038_purrche_attack3'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        11,
        sequence(
          repeatEachTick(
            sequence(
              step('calculateActionValue', {
                key: 'atk_scale_1',
                operation: 'multiply',
                left: { kind: 'blackboard', key: 'atk_scale' },
                right: { kind: 'constant', value: 0.2 },
              }),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
                  tags: ['normalAttack'],
                },
                'chr_0038_purrche_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/1',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'hitstoptime_1', fallback: 0 },
                      operator: 'less',
                      right: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'hitstoptime_1',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
                      step('startTimeDilation', {
                        scope: 'entity',
                        durationSeconds: { kind: 'constant', value: 0.12 },
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
                undefined,
                { alwaysNext: true },
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
        12,
      ),
      scheduled(
        14,
        sequence(
          repeatEachTick(
            sequence(
              step('calculateActionValue', {
                key: 'atk_scale_2',
                operation: 'multiply',
                left: { kind: 'blackboard', key: 'atk_scale' },
                right: { kind: 'constant', value: 0.3 },
              }),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalAttack'],
                },
                'chr_0038_purrche_attack2:/scheduledSequences/1/sequence/steps/0/body/steps/1',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'hitstoptime_2', fallback: 0 },
                      operator: 'less',
                      right: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'hitstoptime_2',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
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
                    undefined,
                    { alwaysNext: true },
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
                targetTriggerIntervalSeconds: 0.033,
              },
            },
          ),
        ),
        15,
      ),
      scheduled(
        22,
        sequence(
          repeatEachTick(
            sequence(
              step('calculateActionValue', {
                key: 'atk_scale_3',
                operation: 'multiply',
                left: { kind: 'blackboard', key: 'atk_scale' },
                right: { kind: 'constant', value: 0.5 },
              }),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_3' },
                  tags: ['normalAttack'],
                },
                'chr_0038_purrche_attack2:/scheduledSequences/2/sequence/steps/0/body/steps/1',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'hitstoptime_3', fallback: 0 },
                      operator: 'less',
                      right: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'hitstoptime_3',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
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
                    undefined,
                    { alwaysNext: true },
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
                targetTriggerIntervalSeconds: 0.033,
              },
            },
          ),
        ),
        24,
      ),
      scheduled(
        46,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0038_purrche_attack3'] })),
        53,
      ),
    ],
    timelineContinuationSkillId: 'chr_0038_purrche_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atk_scale: [0.52, 0.57, 0.62, 0.67, 0.72, 0.77, 0.82, 0.88, 0.93, 0.99, 1.07, 1.16],
    atk_scale_1: 0,
    atk_scale_2: 0,
    atk_scale_3: 0,
    hitstoptime_1: 0,
    hitstoptime_2: 0,
    hitstoptime_3: 0,
    atb: 0,
  },
);

export const purrchenaChr_0038_purrche_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0038_purrche_attack3',
    timelineBlockFrames: 47,
    naturalDurationFrames: 209,
    exclusiveFrame: 47,
    offsetRecordFrame: 21,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 58,
          input: 'basicAttack',
          targetSkillId: 'chr_0038_purrche_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 47, endFrame: 58, skillIds: ['chr_0038_purrche_attack1'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        18,
        sequence(
          step('modifyActionValue', {
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          repeatEachTick(
            sequence(
              step('calculateActionValue', {
                key: 'atk_scale_1',
                operation: 'multiply',
                left: { kind: 'blackboard', key: 'atk_scale' },
                right: { kind: 'constant', value: 0.2 },
              }),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
                  tags: ['normalAttack'],
                },
                'chr_0038_purrche_attack3:/scheduledSequences/0/sequence/steps/1/body/steps/1',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'hitstop_times_1', fallback: 0 },
                      operator: 'less',
                      right: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'hitstop_times_1',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
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
                    undefined,
                    { alwaysNext: true },
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
                targetTriggerIntervalSeconds: 0.033,
              },
            },
          ),
        ),
        20,
      ),
      scheduled(
        21,
        sequence(
          step('modifyActionValue', {
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          repeatEachTick(
            sequence(
              step('calculateActionValue', {
                key: 'atk_scale_2',
                operation: 'multiply',
                left: { kind: 'blackboard', key: 'atk_scale' },
                right: { kind: 'constant', value: 0.8 },
              }),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalAttack', 'normalAttackLastCombo'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                  staggerOnlyWhenCasterControlled: true,
                },
                'chr_0038_purrche_attack3:/scheduledSequences/1/sequence/steps/1/body/steps/1',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  once(
                    'SkillData.chr_0038_purrche_attack3.actionGroupData.timelineActions[8]._sequenceActionData.actionData[1].actionOnTick.actionData[3].succeedActions.actionData[0].succeedActions.actionData[0]',
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
                targetTriggerIntervalSeconds: 0.033,
              },
            },
          ),
        ),
        23,
      ),
      scheduled(
        47,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0038_purrche_attack1'] })),
        58,
      ),
    ],
    timelineContinuationSkillId: 'chr_0038_purrche_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 23,
    atk_scale: [1.02, 1.12, 1.22, 1.33, 1.43, 1.53, 1.63, 1.73, 1.84, 1.96, 2.12, 2.3],
    atk_scale_1: 0,
    atk_scale_2: 0,
    env_dmg: 20,
    hitstop_times_1: 0,
    hitstop_times_2: 0,
    poise: 21,
  },
);

export const purrchenaChr_0038_purrche_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0038_purrche_power_attack',
    timelineBlockFrames: 47,
    naturalDurationFrames: 137,
    exclusiveFrame: 46,
    offsetRecordFrame: 0,
    inputWindows: { allowedNextSkills: [{ startFrame: 37, endFrame: 56, skillIds: [] }] },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        24,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 1,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0038_purrche_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.42 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0.004006803,
                  value: 0.4333363,
                  inTangent: -14.53776,
                  outTangent: -14.53776,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.03453654,
                  value: -0.0104978,
                  inTangent: -0.00949474,
                  outTangent: -0.00949474,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.9195074,
                  value: 0.001982015,
                  inTangent: 0.01377201,
                  outTangent: 0.01377201,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.9931734,
                  value: 1.999922,
                  inTangent: 27.12162,
                  outTangent: 27.12162,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
        ),
        26,
      ),
      scheduled(
        33,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.15 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0.005714327,
                  value: 0.2817955,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 1.0057143,
                  value: 0.2817955,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        35,
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
        46,
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
        25,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const purrchenaChr_0038_purrche_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0038_purrche_plunging_attack_end',
    timelineBlockFrames: 22,
    naturalDurationFrames: 228,
    exclusiveFrame: 21,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        1,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'plungingAttack'],
            },
            'chr_0038_purrche_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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
        6,
      ),
    ],
    skillType: 'plungingAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
);

export const purrchenaChr_0038_purrche_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0038_purrche_normal_skill',
    timelineBlockFrames: 12,
    naturalDurationFrames: 184,
    exclusiveFrame: 50,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 12, endFrame: 50, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
        { startFrame: 300, endFrame: 585, skillIds: ['chr_0038_purrche_normal_skill_sp'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        49,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
          step('castSkillDuringAction', {
            skillId: 'chr_0038_purrche_normal_skill_loop_1',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          }),
        ),
        49,
      ),
      scheduled(1007, sequence(step('markCurrentSkillCanInterrupt', {})), 1010),
      scheduled(1134, sequence(step('finishTimeline', {})), 1137),
      scheduled(1429, sequence(step('markCurrentSkillCanInterrupt', {})), 1432),
      scheduled(1492, sequence(step('finishTimeline', {})), 1495),
      scheduled(
        0,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: [
              'buff_chr_0038_purrche_enter_normal_skill_end',
              'buff_chr_0038_purrche_block_end',
            ],
            reason: 'other',
          }),
        ),
        3,
      ),
      scheduled(
        0,
        sequence(
          step('findCharacterTeamTargets', {
            saveToContextKey: 'MainChar',
            selection: { kind: 'controlledOperator' },
          }),
        ),
        3,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_common_obtain_ultimate_sp',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        5,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_aura_block',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
              'chr_0038_purrche_normal_skill_counter',
            ],
            copiedBlackboardAssignments: {
              dmg_taken_down_1: 'dmg_taken_down_1',
              dmg_taken_down_2: 'dmg_taken_down_2',
              dmg_taken_down_3: 'dmg_taken_down_3',
              dmg_taken_down_4: 'dmg_taken_down_4',
            },
          }),
        ),
        50,
      ),
      scheduled(
        0,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[29]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    {
                      kind: 'eventDamageFeaturesMatch',
                      match: 'exceptAny',
                      features: ['dot', 'remainArea'],
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_counter',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_block_1',
                        target: 'enemy',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                        interruptCurrentSkillOnlyWhenTargetCastable: true,
                      }),
                    ),
                  ),
                ),
              },
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[29]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_block_1',
                        target: 'actionInputTarget',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                        interruptCurrentSkillOnlyWhenTargetCastable: true,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        50,
      ),
      scheduled(
        1204,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[30]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    {
                      kind: 'eventDamageFeaturesMatch',
                      match: 'exceptAny',
                      features: ['dot', 'remainArea'],
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_counter',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_block',
                        target: 'enemy',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                      }),
                    ),
                  ),
                ),
              },
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[30]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
                    sequence(step('jumpTimeline', { destinationFrame: 107 })),
                  ),
                ),
              },
            ],
          }),
        ),
        1410,
      ),
      scheduled(
        312,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[32]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
                    sequence(step('jumpTimeline', { destinationFrame: 252 })),
                  ),
                ),
              },
            ],
          }),
        ),
        417,
      ),
      scheduled(
        874,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[33]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
                    sequence(step('jumpTimeline', { destinationFrame: 252 })),
                  ),
                ),
              },
            ],
          }),
        ),
        1006,
      ),
      scheduled(
        1204,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[34]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
                    sequence(step('jumpTimeline', { destinationFrame: 674 })),
                  ),
                ),
              },
            ],
          }),
        ),
        1285,
      ),
      scheduled(
        1285,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill.actionGroupData.timelineActions[35]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
                    sequence(step('jumpTimeline', { destinationFrame: 674 })),
                  ),
                ),
              },
            ],
          }),
        ),
        1428,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block_counter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        3,
      ),
      scheduled(
        0,
        sequence(
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atb_return_1' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'default',
          }),
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'potential_5_atb' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'default',
          }),
        ),
        3,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block_change_skill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        3,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    timelineBlockFollowUpSkillId: 'chr_0038_purrche_normal_skill_counter',
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb_return_1: 20,
    dmg_taken_down_1: 0.9,
    dmg_taken_down_2: 0.8,
    dmg_taken_down_3: 0.7,
    dmg_taken_down_4: 0.6,
    potential_5_atb: 0,
  },
);

export const purrchenaChr_0038_purrche_normal_skill_counter: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0038_purrche_normal_skill_counter',
    timelineBlockFrames: 36,
    naturalDurationFrames: 399,
    exclusiveFrame: 35,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 15, endFrame: 45, skillIds: ['chr_0038_purrche_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('readBuffStackCount', {
            target: 'caster',
            outputKey: 'is_block',
            query: { kind: 'id', buffIds: ['buff_chr_0038_purrche_block_counter_mark'] },
          }),
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_block_counter_mark'],
            reason: 'other',
          }),
          step('readBuffStackCount', {
            target: 'caster',
            outputKey: 'block_time',
            query: { kind: 'id', buffIds: ['buff_chr_0038_purrche_block_counter'] },
          }),
          step('finishBuffsById', {
            target: 'caster',
            buffIds: [
              'buff_chr_0038_purrche_block_counter',
              'buff_chr_0038_purrche_block_change_skill',
            ],
            reason: 'other',
          }),
        ),
        3,
      ),
      scheduled(
        9,
        sequence(
          repeatEachTick(
            sequence(
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
                'chr_0038_purrche_normal_skill_counter:/scheduledSequences/1/sequence/steps/0/body/steps/1',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'is_block', fallback: 0 },
                  operator: 'greaterOrEqual',
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
                  step('changeResourceByActionValue', {
                    resource: 'sp',
                    amount: { kind: 'blackboard', key: 'potential_5_atb' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'team',
                    spGainKind: 'refund',
                    spGainSource: 'skill',
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              once(
                'SkillData.chr_0038_purrche_normal_skill_counter.actionGroupData.timelineActions[9]._sequenceActionData.actionData[0].actionOnTick.actionData[7].succeedActions.actionData[0]',
                sequence({
                  kind: 'switch',
                  parameters: {
                    choice: { kind: 'blackboard', key: 'block_time' },
                    alwaysNext: true,
                  },
                  options: [
                    {
                      value: { kind: 'constant', value: 1 },
                      sequence: sequence(
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
                    },
                    {
                      value: { kind: 'constant', value: 2 },
                      sequence: sequence(
                        step('startTimeDilation', {
                          scope: 'entity',
                          durationSeconds: { kind: 'constant', value: 0.55 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 10,
                          curve: { kind: 'named', key: 'char_hard_stop' },
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
                          durationSeconds: { kind: 'constant', value: 0.7 },
                          slot: 'TimeDilation/Layer/Entity/HitStop',
                          priority: 10,
                          curve: { kind: 'named', key: 'char_hard_stop' },
                          finishByAction: false,
                          targets: ['enemy', 'caster'],
                        }),
                      ),
                    },
                  ],
                }),
              ),
            ),
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 1,
                targetTriggerIntervalSeconds: 0,
              },
            },
          ),
        ),
        13,
      ),
      scheduled(
        0,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: [
              'buff_chr_0038_purrche_aura_block',
              'buff_chr_0038_purrche_block_shelter_down_aura_instance',
            ],
            reason: 'other',
          }),
        ),
        0,
      ),
    ],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb_return: 0,
    atk_scale: [1.78, 1.95, 2.13, 2.31, 2.49, 2.66, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    block_time: 1,
    is_block: 0,
    poise: 20,
    potential_5_atb: 0,
  },
);

export const purrchenaChr_0038_purrche_normal_skill_block_1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0038_purrche_normal_skill_block_1',
    timelineBlockFrames: 26,
    naturalDurationFrames: 25,
    exclusiveFrame: 25,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 0, endFrame: 24, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0038_purrche_aura_block',
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
              'chr_0038_purrche_normal_skill_counter',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
        ),
        25,
      ),
      scheduled(
        23,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
          step('castSkillDuringAction', {
            skillId: 'chr_0038_purrche_normal_skill_loop_2',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          }),
        ),
        23,
      ),
      scheduled(
        3,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_1.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    {
                      kind: 'eventDamageFeaturesMatch',
                      match: 'exceptAny',
                      features: ['dot', 'remainArea'],
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_counter',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_block_2',
                        target: 'enemy',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                        interruptCurrentSkillOnlyWhenTargetCastable: true,
                      }),
                    ),
                  ),
                ),
              },
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_1.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_block_2',
                        target: 'actionInputTarget',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                        interruptCurrentSkillOnlyWhenTargetCastable: true,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        24,
      ),
      scheduled(
        0,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_1.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_enter_normal_skill_end',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        9,
      ),
      scheduled(
        9,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_1.actionGroupData.timelineActions[8]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_enter_normal_skill_end',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_loop_2',
                        target: 'actionInputTarget',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        24,
      ),
      scheduled(
        9,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('castSkillDuringAction', {
                skillId: 'chr_0038_purrche_normal_skill_loop_2',
                target: 'enemy',
                skipApplyCost: false,
                inheritSourceSkillCastInfo: false,
              }),
            ),
          ),
        ),
        9,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.6 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0.000007561175,
                  value: 0.9554025,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 0.17689614,
                  value: 0.05861299,
                  inTangent: 3.83089883e-7,
                  outTangent: 3.83089883e-7,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
                {
                  time: 0.8731842,
                  value: 0.0586136,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 4.596606,
                  outTangent: 4.596606,
                  weightedMode: 0,
                  inWeight: 0.0243593454,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        3,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_pause_block',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        9,
      ),
      scheduled(
        0,
        sequence(
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'talent_1_usp' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          }),
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atb_return_2' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'default',
          }),
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'potential_5_atb' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'default',
          }),
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_ult_add_red',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { stack: 'talent_1_stack' },
          }),
        ),
        3,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block_shelter_stay',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        21,
      ),
    ],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'extraActiveSkill',
  },
  { atb_return_2: 20, potential_5_atb: 0, talent_1_stack: 0, talent_1_usp: 0 },
);

export const purrchenaChr_0038_purrche_normal_skill_block_2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0038_purrche_normal_skill_block_2',
    timelineBlockFrames: 26,
    naturalDurationFrames: 25,
    exclusiveFrame: 25,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 0, endFrame: 25, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0038_purrche_aura_block',
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
              'chr_0038_purrche_normal_skill_counter',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
        ),
        25,
      ),
      scheduled(
        22,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
          step('castSkillDuringAction', {
            skillId: 'chr_0038_purrche_normal_skill_loop_2',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
            interruptCurrentSkillOnlyWhenTargetCastable: true,
          }),
        ),
        22,
      ),
      scheduled(
        2,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_2.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    {
                      kind: 'eventDamageFeaturesMatch',
                      match: 'exceptAny',
                      features: ['dot', 'remainArea'],
                    },
                    sequence(
                      branch(
                        {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0038_purrche_aura_block'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                        sequence(
                          step('applyBuff', {
                            buffId: 'buff_chr_0038_purrche_block_counter',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                          }),
                          step('applyBuff', {
                            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                            target: 'caster',
                            inheritSourceSkillCastInfo: true,
                          }),
                          step('castSkillDuringAction', {
                            skillId: 'chr_0038_purrche_normal_skill_block_2',
                            target: 'enemy',
                            skipApplyCost: true,
                            inheritSourceSkillCastInfo: true,
                            interruptCurrentSkillOnlyWhenTargetCastable: true,
                          }),
                        ),
                      ),
                    ),
                  ),
                ),
              },
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_2.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_block_2',
                        target: 'actionInputTarget',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                        interruptCurrentSkillOnlyWhenTargetCastable: true,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        25,
      ),
      scheduled(
        0,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_2.actionGroupData.timelineActions[8]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_enter_normal_skill_end',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        12,
      ),
      scheduled(
        12,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_block_2.actionGroupData.timelineActions[9]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_enter_normal_skill_end',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_loop_2',
                        target: 'actionInputTarget',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        25,
      ),
      scheduled(
        12,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
              }),
              step('castSkillDuringAction', {
                skillId: 'chr_0038_purrche_normal_skill_loop_2',
                target: 'enemy',
                skipApplyCost: false,
                inheritSourceSkillCastInfo: false,
              }),
            ),
          ),
        ),
        12,
      ),
      scheduled(
        0,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.4 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: {
                  kind: 'inline',
                  keys: [
                    {
                      time: -0.003320307,
                      value: 0.06893496,
                      inTangent: 0.002727071,
                      outTangent: 0.002727071,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.1933896,
                      value: 0.0694714,
                      inTangent: -0.005988318,
                      outTangent: -0.005988318,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.2475097,
                      value: 0.2076706,
                      inTangent: -0.007820179,
                      outTangent: -0.007820179,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.8658105,
                      value: 0.2205032,
                      inTangent: 0.08536714,
                      outTangent: 0.08536714,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 1,
                      inTangent: 5.808926,
                      outTangent: 5.808926,
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
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.3 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: {
                  kind: 'inline',
                  keys: [
                    {
                      time: 0.002380371,
                      value: 0.01728821,
                      inTangent: -0.009265231,
                      outTangent: -0.009265231,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.1802043,
                      value: 0.02063313,
                      inTangent: -0.1249941,
                      outTangent: -0.1249941,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.307336,
                      value: 0.1805526,
                      inTangent: 0.04394849,
                      outTangent: 0.04394849,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.9206635,
                      value: 0.1941004,
                      inTangent: -0.002866605,
                      outTangent: -0.002866605,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 1,
                      inTangent: 10.158,
                      outTangent: 10.158,
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
            { alwaysNext: true },
          ),
        ),
        3,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_pause_block',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        11,
      ),
    ],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'extraActiveSkill',
  },
  {},
);

export const purrchenaChr_0038_purrche_normal_skill_loop_1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0038_purrche_normal_skill_loop_1',
    timelineBlockFrames: 362,
    naturalDurationFrames: 494,
    exclusiveFrame: 361,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 1, endFrame: 494, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0038_purrche_aura_block',
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
              'chr_0038_purrche_normal_skill_counter',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
        ),
        494,
      ),
      scheduled(361, sequence(step('markCurrentSkillCanInterrupt', {})), 364),
      scheduled(491, sequence(step('finishTimeline', {})), 494),
      scheduled(675, sequence(step('markCurrentSkillCanInterrupt', {})), 678),
      scheduled(738, sequence(step('finishTimeline', {})), 741),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
                reason: 'other',
              }),
              step('jumpTimeline', { destinationFrame: 360 }),
            ),
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0038_purrche_aura_block'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(),
                sequence(
                  step('finishBuffsById', {
                    target: 'caster',
                    buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
                    reason: 'other',
                  }),
                  step('jumpTimeline', { destinationFrame: 360 }),
                ),
                { alwaysNext: true },
              ),
            ),
            { alwaysNext: true },
          ),
        ),
        1,
      ),
      scheduled(
        1,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_combo_anim'],
            reason: 'other',
          }),
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_loop_anim'],
            reason: 'other',
          }),
        ),
        2,
      ),
      scheduled(
        0,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_loop_1.actionGroupData.timelineActions[25]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    {
                      kind: 'eventDamageFeaturesMatch',
                      match: 'exceptAny',
                      features: ['dot', 'remainArea'],
                    },
                    sequence(
                      step('mergeContextTargets', {
                        saveToContextKey: 'Attacker',
                        sources: [{ kind: 'target', target: 'enemy' }],
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_counter',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_block_1',
                        target: 'enemy',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                        interruptCurrentSkillOnlyWhenTargetCastable: true,
                      }),
                    ),
                  ),
                ),
              },
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_loop_1.actionGroupData.timelineActions[25]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
                    sequence(
                      step('mergeContextTargets', {
                        saveToContextKey: 'Attacker',
                        sources: [{ kind: 'target', target: 'eventSource' }],
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_block_1',
                        target: 'actionInputTarget',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                        interruptCurrentSkillOnlyWhenTargetCastable: true,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        360,
      ),
      scheduled(
        0,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_loop_1.actionGroupData.timelineActions[26]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
                    sequence(step('jumpTimeline', { destinationFrame: 360 })),
                  ),
                ),
              },
            ],
          }),
        ),
        360,
      ),
    ],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'extraActiveSkill',
  },
  {},
);

export const purrchenaChr_0038_purrche_normal_skill_loop_2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0038_purrche_normal_skill_loop_2',
    timelineBlockFrames: 362,
    naturalDurationFrames: 431,
    exclusiveFrame: 361,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 0, endFrame: 431, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0038_purrche_aura_block',
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
              'chr_0038_purrche_normal_skill_counter',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
        ),
        431,
      ),
      scheduled(361, sequence(step('markCurrentSkillCanInterrupt', {})), 364),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
                reason: 'other',
              }),
              step('jumpTimeline', { destinationFrame: 360 }),
            ),
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0038_purrche_aura_block'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(),
                sequence(
                  step('finishBuffsById', {
                    target: 'caster',
                    buffIds: ['buff_chr_0038_purrche_enter_normal_skill_end'],
                    reason: 'other',
                  }),
                  step('jumpTimeline', { destinationFrame: 360 }),
                ),
                { alwaysNext: true },
              ),
            ),
            { alwaysNext: true },
          ),
        ),
        1,
      ),
      scheduled(
        1,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_combo_anim'],
            reason: 'other',
          }),
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_loop_anim'],
            reason: 'other',
          }),
        ),
        2,
      ),
      scheduled(
        361,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_combo_anim'],
            reason: 'other',
          }),
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_loop_anim'],
            reason: 'other',
          }),
        ),
        362,
      ),
      scheduled(
        0,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_loop_2.actionGroupData.timelineActions[18]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    {
                      kind: 'eventDamageFeaturesMatch',
                      match: 'exceptAny',
                      features: ['dot', 'remainArea'],
                    },
                    sequence(
                      step('mergeContextTargets', {
                        saveToContextKey: 'Attacker',
                        sources: [{ kind: 'target', target: 'enemy' }],
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_counter',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_block_2',
                        targetContextKey: 'Attacker',
                        target: 'context',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                        interruptCurrentSkillOnlyWhenTargetCastable: true,
                      }),
                    ),
                  ),
                ),
              },
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_loop_2.actionGroupData.timelineActions[18]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
                    sequence(
                      step('mergeContextTargets', {
                        saveToContextKey: 'Attacker',
                        sources: [{ kind: 'target', target: 'eventSource' }],
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_block_2',
                        target: 'actionInputTarget',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                        interruptCurrentSkillOnlyWhenTargetCastable: true,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        360,
      ),
      scheduled(
        0,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_normal_skill_loop_2.actionGroupData.timelineActions[19]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
                    sequence(step('jumpTimeline', { destinationFrame: 360 })),
                  ),
                ),
              },
            ],
          }),
        ),
        360,
      ),
    ],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'extraActiveSkill',
  },
  {},
);

export const purrchenaChr_0038_purrche_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0038_purrche_combo_skill',
    timelineBlockFrames: 28,
    naturalDurationFrames: 330,
    exclusiveFrame: 330,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 26,
          endFrame: 75,
          skillIds: ['chr_0038_purrche_normal_skill_counter', 'chr_0038_purrche_normal_skill'],
        },
        { startFrame: 221, endFrame: 251, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
        { startFrame: 281, endFrame: 310, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0038_purrche_aura_block',
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
        ),
        332,
      ),
      scheduled(
        210,
        sequence(
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0038_purrche_aura_block',
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
              'chr_0038_purrche_normal_skill_counter',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
        ),
        251,
      ),
      scheduled(
        270,
        sequence(
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0038_purrche_aura_block',
            inheritToNextSkillIds: [
              'chr_0038_purrche_normal_skill_block_1',
              'chr_0038_purrche_normal_skill_block_2',
              'chr_0038_purrche_normal_skill_loop_1',
              'chr_0038_purrche_normal_skill_loop_2',
              'chr_0038_purrche_combo_skill',
              'chr_0038_purrche_normal_skill_counter',
            ],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
        ),
        310,
      ),
      scheduled(
        0,
        sequence(
          step('findCharacterTeamTargets', {
            saveToContextKey: 'box_pos',
            selection: { kind: 'controlledOperator' },
          }),
        ),
        0,
      ),
      scheduled(
        0,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_loop_anim', 'buff_chr_0038_purrche_combo_anim'],
            reason: 'other',
          }),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0038_purrche_aura_block'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0038_purrche_block_counter'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 2 },
                },
                sequence(step('jumpTimeline', { destinationFrame: 270 })),
                sequence(step('jumpTimeline', { destinationFrame: 210 })),
                { alwaysNext: true },
              ),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        0,
      ),
      scheduled(28, sequence(step('markCurrentSkillCanInterrupt', {})), 28),
      scheduled(206, sequence(step('finishTimeline', {})), 206),
      scheduled(
        250,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
          step('castSkillDuringAction', {
            skillId: 'chr_0038_purrche_normal_skill_loop_1',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          }),
        ),
        250,
      ),
      scheduled(
        309,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
          step('castSkillDuringAction', {
            skillId: 'chr_0038_purrche_normal_skill_loop_2',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          }),
        ),
        309,
      ),
      scheduled(1, sharedActionSequence1, 1),
      scheduled(
        2,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0038_purrche_combo_always_black_hole'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'comboType',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0038_purrche_combo_always_bomb'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'comboType',
                    operation: 'assign',
                    value: { kind: 'constant', value: 2 },
                  }),
                ),
                sequence(
                  branch(
                    {
                      kind: 'buffIdStackCompare',
                      target: 'caster',
                      buffIds: ['buff_chr_0038_purrche_combo_always_fish'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'comboType',
                        operation: 'assign',
                        value: { kind: 'constant', value: 3 },
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
                  ),
                ),
                { alwaysNext: true },
              ),
            ),
            { alwaysNext: true },
          ),
        ),
        2,
      ),
      scheduled(
        17,
        instantiateActionSequence(sharedActionSequence11, [
          'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[23]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0038_purrche_combo_skill_giftbox_self',
          'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[23]._sequenceActionData.actionData[0].failActions.actionData[0]:projectile_chr_0038_purrche_combo_skill_giftbox',
        ]),
        20,
      ),
      scheduled(211, sharedActionSequence1, 211),
      scheduled(
        221,
        instantiateActionSequence(sharedActionSequence11, [
          'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[25]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0038_purrche_combo_skill_giftbox',
          'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[25]._sequenceActionData.actionData[0].failActions.actionData[0]:projectile_chr_0038_purrche_combo_skill_giftbox',
        ]),
        224,
      ),
      scheduled(271, sharedActionSequence1, 271),
      scheduled(
        281,
        instantiateActionSequence(sharedActionSequence11, [
          'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[27]._sequenceActionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0038_purrche_combo_skill_giftbox',
          'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[27]._sequenceActionData.actionData[0].failActions.actionData[0]:projectile_chr_0038_purrche_combo_skill_giftbox',
        ]),
        284,
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
        210,
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
        225,
      ),
      scheduled(
        270,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.5 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        282,
      ),
      scheduled(
        221,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[49]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    {
                      kind: 'eventDamageFeaturesMatch',
                      match: 'exceptAny',
                      features: ['dot', 'remainArea'],
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_counter',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_counter_mark',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_block_1',
                        target: 'enemy',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                      }),
                    ),
                  ),
                ),
              },
              {
                key: 'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[49]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_counter',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_block_1',
                        target: 'actionInputTarget',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        251,
      ),
      scheduled(
        281,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[50]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    {
                      kind: 'eventDamageFeaturesMatch',
                      match: 'exceptAny',
                      features: ['dot', 'remainArea'],
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_counter',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_counter_mark',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_block_2',
                        target: 'enemy',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                      }),
                    ),
                  ),
                ),
              },
              {
                key: 'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[50]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_counter',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_combo_to_normal_skill_hit',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_block_immune_skillfx',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                      step('castSkillDuringAction', {
                        skillId: 'chr_0038_purrche_normal_skill_block_2',
                        target: 'actionInputTarget',
                        skipApplyCost: false,
                        inheritSourceSkillCastInfo: false,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        310,
      ),
      scheduled(
        210,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[51]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_enter_normal_skill_end',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        251,
      ),
      scheduled(
        270,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0038_purrche_combo_skill.actionGroupData.timelineActions[52]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_end'] },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0038_purrche_enter_normal_skill_end',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        310,
      ),
      scheduled(
        210,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_pause_block',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        251,
      ),
      scheduled(
        270,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_pause_block',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        310,
      ),
    ],
    cooldownFrames: [720, 720, 720, 720, 720, 720, 720, 720, 690, 690, 690, 660],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    angletorotate: 60,
    angletotarget: 0,
    atk_scale_blackhole_dot: [
      0.11, 0.12, 0.13, 0.14, 0.16, 0.17, 0.18, 0.19, 0.2, 0.21, 0.23, 0.25,
    ],
    atk_scale_blackhole_end: [0.22, 0.24, 0.27, 0.29, 0.31, 0.33, 0.36, 0.38, 0.4, 0.43, 0.46, 0.5],
    atk_scale_boom: [1.33, 1.47, 1.6, 1.73, 1.87, 2, 2.13, 2.27, 2.4, 2.57, 2.77, 3],
    cam_angle: 0,
    cam_duration: 0,
    comboType: 1,
    comboType_last: 0,
    heal_scale: [0.5, 0.6, 0.71, 0.81, 0.86, 0.91, 0.96, 1.01, 1.06, 1.08, 1.11, 1.13],
    heal_scale_fish: [0.34, 0.4, 0.47, 0.54, 0.57, 0.6, 0.64, 0.67, 0.71, 0.72, 0.74, 0.76],
    heal_static_value: [
      216, 259.2, 302.4, 345.6, 367.2, 388.8, 410.4, 432, 453.6, 464.4, 475.2, 486,
    ],
    heal_static_value_fish: [
      144, 172.8, 201.6, 230.4, 244.8, 259.2, 273.6, 288, 302.4, 309.6, 316.8, 324,
    ],
    input_angle: 0,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    poise: 10,
    potential_3: 0,
    radiusadd_display: 0,
    usp: 10,
    display_atk_scale_blackhole: [
      0.66, 0.72, 0.79, 0.85, 0.95, 1.01, 1.08, 1.14, 1.2, 1.27, 1.38, 1.5,
    ],
    display_usp: 10,
  },
);

export const purrchenaChr_0038_purrche_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0038_purrche_ultimate_skill',
    timelineBlockFrames: 158,
    naturalDurationFrames: 262,
    exclusiveFrame: 157,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 146,
          endFrame: 180,
          skillIds: ['chr_0038_purrche_combo_skill', 'chr_0038_purrche_normal_skill'],
        },
        { startFrame: 146, endFrame: 180, skillIds: ['chr_0038_purrche_normal_skill_counter'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        1,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_pause_change_skill_buff',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        143,
      ),
      scheduled(
        69,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_pause_change_skill_buff',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        143,
      ),
      scheduled(
        1,
        sequence(
          step('findCharacterTeamTargets', {
            saveToContextKey: 'MainChar',
            selection: { kind: 'controlledOperator' },
          }),
        ),
        6,
      ),
      scheduled(
        68,
        sequence(
          step('findCharacterTeamTargets', {
            saveToContextKey: 'MainChar',
            selection: { kind: 'controlledOperator' },
          }),
        ),
        71,
      ),
      scheduled(
        0,
        sequence(
          step('readBuffStackCount', {
            target: 'caster',
            outputKey: 'skill_defend_count',
            query: { kind: 'id', buffIds: ['buff_chr_0038_purrche_ult_add_red'] },
          }),
          step('calculateActionValue', {
            key: 'add_prob',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'skill_defend_count' },
            right: { kind: 'blackboard', key: 'talent1_prob_up' },
          }),
          step('calculateActionValue', {
            key: 'prob',
            operation: 'add',
            left: { kind: 'blackboard', key: 'prob' },
            right: { kind: 'blackboard', key: 'add_prob' },
          }),
          branch(
            { kind: 'probability', probability: { kind: 'blackboard', key: 'prob' } },
            sequence(
              step('modifyActionValue', {
                key: 'box_num',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          branch(
            { kind: 'probability', probability: { kind: 'blackboard', key: 'prob' } },
            sequence(
              step('modifyActionValue', {
                key: 'box_num',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          branch(
            { kind: 'probability', probability: { kind: 'blackboard', key: 'prob' } },
            sequence(
              step('modifyActionValue', {
                key: 'box_num',
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
              buffIds: ['buff_chr_0038_purrche_train_ult_always3y'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'box_num',
                operation: 'assign',
                value: { kind: 'constant', value: 0 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0038_purrche_train_ult_always2y1r'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'box_num',
                operation: 'assign',
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
              buffIds: ['buff_chr_0038_purrche_perform_test_always3r'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'box_num',
                operation: 'assign',
                value: { kind: 'constant', value: 3 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0038_purrche_perform_test_always3boom'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'box_num',
                operation: 'assign',
                value: { kind: 'constant', value: 0 },
              }),
              step('modifyActionValue', {
                key: 'normal_boom_prob',
                operation: 'assign',
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
              buffIds: ['buff_chr_0038_purrche_perform_test_always1r1b1h'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'box_num',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
              step('modifyActionValue', {
                key: 'normal_boom_prob',
                operation: 'assign',
                value: { kind: 'constant', value: 0 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0038_purrche_perform_test_always2r1h'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'box_num',
                operation: 'assign',
                value: { kind: 'constant', value: 2 },
              }),
              step('modifyActionValue', {
                key: 'normal_boom_prob',
                operation: 'assign',
                value: { kind: 'constant', value: 0 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0038_purrche_ult_add_red'],
            reason: 'other',
          }),
        ),
        3,
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
        1,
      ),
      scheduled(
        138,
        sequence({
          kind: 'switch',
          parameters: { choice: { kind: 'blackboard', key: 'box_num' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 2 },
              sequence: instantiateActionSequence(sharedActionSequence13, [
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[11]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[0].actionData.actionData[1]:projectile_chr_0038_purrche_ult_skill_1',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/6/sequence/steps/0/options/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1',
              ]),
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: instantiateActionSequence(sharedActionSequence13, [
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[11]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[1].actionData.actionData[1]:projectile_chr_0038_purrche_ult_skill_1',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/6/sequence/steps/0/options/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1',
              ]),
            },
            {
              value: { kind: 'constant', value: 0 },
              sequence: instantiateActionSequence(sharedActionSequence17, [
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[11]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[2].actionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0038_purrche_ult_skill_2',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/6/sequence/steps/0/options/2/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[11]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[2].actionData.actionData[0].failActions.actionData[0].succeedActions.actionData[1]:projectile_chr_0038_purrche_ult_skill_3',
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[11]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[2].actionData.actionData[0].failActions.actionData[0].failActions.actionData[0]:projectile_chr_0038_purrche_ult_skill_2',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/6/sequence/steps/0/options/2/sequence/steps/0/whenFalse/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
              ]),
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: instantiateActionSequence(sharedActionSequence17, [
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[11]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[3].actionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0038_purrche_ult_skill_2',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/6/sequence/steps/0/options/3/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[11]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[3].actionData.actionData[0].failActions.actionData[0].succeedActions.actionData[1]:projectile_chr_0038_purrche_ult_skill_3',
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[11]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[3].actionData.actionData[0].failActions.actionData[0].failActions.actionData[0]:projectile_chr_0038_purrche_ult_skill_2',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/6/sequence/steps/0/options/3/sequence/steps/0/whenFalse/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
              ]),
            },
          ],
        }),
        139,
      ),
      scheduled(
        138,
        sequence({
          kind: 'switch',
          parameters: { choice: { kind: 'blackboard', key: 'box_num' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 1 },
              sequence: instantiateActionSequence(sharedActionSequence13, [
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[14]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[0].actionData.actionData[1]:projectile_chr_0038_purrche_ult_skill_1',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/7/sequence/steps/0/options/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1',
              ]),
            },
            {
              value: { kind: 'constant', value: 0 },
              sequence: instantiateActionSequence(sharedActionSequence17, [
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[14]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[1].actionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0038_purrche_ult_skill_2',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/7/sequence/steps/0/options/1/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[14]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[1].actionData.actionData[0].failActions.actionData[0].succeedActions.actionData[1]:projectile_chr_0038_purrche_ult_skill_3',
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[14]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[1].actionData.actionData[0].failActions.actionData[0].failActions.actionData[0]:projectile_chr_0038_purrche_ult_skill_2',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/7/sequence/steps/0/options/1/sequence/steps/0/whenFalse/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
              ]),
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: instantiateActionSequence(sharedActionSequence13, [
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[14]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[2].actionData.actionData[1]:projectile_chr_0038_purrche_ult_skill_1',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/7/sequence/steps/0/options/2/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1',
              ]),
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: instantiateActionSequence(sharedActionSequence13, [
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[14]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[3].actionData.actionData[1]:projectile_chr_0038_purrche_ult_skill_1',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/7/sequence/steps/0/options/3/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1',
              ]),
            },
          ],
        }),
        139,
      ),
      scheduled(
        138,
        sequence({
          kind: 'switch',
          parameters: { choice: { kind: 'blackboard', key: 'box_num' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 3 },
              sequence: instantiateActionSequence(sharedActionSequence13, [
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[17]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[0].actionData.actionData[1]:projectile_chr_0038_purrche_ult_skill_1',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/8/sequence/steps/0/options/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/1',
              ]),
            },
            {
              value: { kind: 'constant', value: 0 },
              sequence: instantiateActionSequence(sharedActionSequence17, [
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[17]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[1].actionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0038_purrche_ult_skill_2',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/8/sequence/steps/0/options/1/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[17]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[1].actionData.actionData[0].failActions.actionData[0].succeedActions.actionData[1]:projectile_chr_0038_purrche_ult_skill_3',
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[17]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[1].actionData.actionData[0].failActions.actionData[0].failActions.actionData[0]:projectile_chr_0038_purrche_ult_skill_2',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/8/sequence/steps/0/options/1/sequence/steps/0/whenFalse/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
              ]),
            },
            {
              value: { kind: 'constant', value: 1 },
              sequence: instantiateActionSequence(sharedActionSequence17, [
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[17]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[2].actionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0038_purrche_ult_skill_2',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/8/sequence/steps/0/options/2/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[17]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[2].actionData.actionData[0].failActions.actionData[0].succeedActions.actionData[1]:projectile_chr_0038_purrche_ult_skill_3',
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[17]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[2].actionData.actionData[0].failActions.actionData[0].failActions.actionData[0]:projectile_chr_0038_purrche_ult_skill_2',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/8/sequence/steps/0/options/2/sequence/steps/0/whenFalse/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
              ]),
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: instantiateActionSequence(sharedActionSequence17, [
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[17]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[3].actionData.actionData[0].succeedActions.actionData[0]:projectile_chr_0038_purrche_ult_skill_2',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/8/sequence/steps/0/options/3/sequence/steps/0/whenTrue/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[17]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[3].actionData.actionData[0].failActions.actionData[0].succeedActions.actionData[1]:projectile_chr_0038_purrche_ult_skill_3',
                'SkillData.chr_0038_purrche_ultimate_skill.actionGroupData.timelineActions[17]._sequenceActionData.actionData[1].succeedActions.actionData[0].succeedActions.actionData[0].options[3].actionData.actionData[0].failActions.actionData[0].failActions.actionData[0]:projectile_chr_0038_purrche_ult_skill_2',
                'chr_0038_purrche_ultimate_skill:/scheduledSequences/8/sequence/steps/0/options/3/sequence/steps/0/whenFalse/steps/0/whenFalse/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
              ]),
            },
          ],
        }),
        139,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 2.3 },
            slot: 'unassigned',
            priority: 100,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: true,
            ignoredTargets: ['caster'],
          }),
        ),
        135,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 135),
      scheduled(
        0,
        sequence(
          step('jumpTimeline', {
            destinationFrame: 68,
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'box_num', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
          }),
        ),
        2,
      ),
      scheduled(67, sequence(step('jumpTimeline', { destinationFrame: 135 })), 67),
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
        157,
      ),
      scheduled(
        68,
        sequence(
          step('applyBuff', {
            buffId: 'buff_common_damage_immune_ult_skill',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        157,
      ),
    ],
    cooldownFrames: 600,
    costs: [{ resource: 'ultimateEnergy', value: 100 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    add_prob: 0,
    atk_scale: [1.33, 1.47, 1.6, 1.73, 1.87, 2, 2.13, 2.27, 2.4, 2.57, 2.77, 3],
    atk_scale_blackhole_dot: [
      0.11, 0.12, 0.13, 0.14, 0.16, 0.17, 0.18, 0.19, 0.2, 0.21, 0.23, 0.25,
    ],
    atk_scale_blackhole_end: [0.22, 0.24, 0.27, 0.29, 0.31, 0.33, 0.36, 0.38, 0.4, 0.43, 0.46, 0.5],
    atk_scale_ult: [2.67, 2.93, 3.2, 3.47, 3.73, 4, 4.27, 4.53, 4.8, 5.13, 5.53, 6],
    black_hole_count: 0,
    box_num: 0,
    duration_vul: 5,
    normal_boom_prob: 0.5,
    poise_1: 10,
    poise_2: 15,
    prob: [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.18, 0.18, 0.18, 0.2],
    rate_vul: [0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.015, 0.02, 0.02, 0.02, 0.025],
    skill_defend_count: 0,
    talent_add_red: 0,
    talent1_prob_up: 0,
    display_atk_scale_blackhole: [
      0.66, 0.72, 0.79, 0.85, 0.95, 1.01, 1.08, 1.14, 1.2, 1.27, 1.38, 1.5,
    ],
  },
);

export const purrchenaCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const purrchena: OperatorDefinition = {
  slug: 'purrchena',
  gameId: 'PURRCHENA',
  rarity: 5,
  weaponType: 'sword',
  element: 'physical',
  role: 'defender',
  mainAttribute: 'strength',
  secondaryAttribute: 'will',
  attributes: {
    strength: [20, 52, 85, 118, 152, 168],
    agility: [8, 26, 45, 64, 84, 93],
    intellect: [9, 26, 44, 62, 80, 89],
    will: [12, 34, 56, 79, 102, 113],
    baseAttack: [30, 90, 152, 215, 277, 309],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        purrchenaChr_0038_purrche_attack1,
        purrchenaChr_0038_purrche_attack2,
        purrchenaChr_0038_purrche_attack3,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: purrchenaChr_0038_purrche_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: purrchenaChr_0038_purrche_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: purrchenaChr_0038_purrche_normal_skill,
      placementSequenceSkillKeys: [
        'chr_0038_purrche_normal_skill',
        'chr_0038_purrche_normal_skill_counter',
      ],
      replacementSkills: [
        purrchenaChr_0038_purrche_normal_skill_counter,
        purrchenaChr_0038_purrche_normal_skill_block_1,
        purrchenaChr_0038_purrche_normal_skill_block_2,
        purrchenaChr_0038_purrche_normal_skill_loop_1,
        purrchenaChr_0038_purrche_normal_skill_loop_2,
      ],
      replacementSkillPlacements: {
        chr_0038_purrche_normal_skill_block_1: 'internal',
        chr_0038_purrche_normal_skill_block_2: 'internal',
        chr_0038_purrche_normal_skill_loop_1: 'internal',
        chr_0038_purrche_normal_skill_loop_2: 'internal',
      },
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: purrchenaChr_0038_purrche_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: purrchenaChr_0038_purrche_ultimate_skill,
    },
  ],
  dodgeSkill: purrchenaCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0038_purrche_normal_skill',
      replacementSkillKeys: ['chr_0038_purrche_normal_skill_counter'],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0038_purrche_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0038_purrche_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0038_purrche_attack1',
        'chr_0038_purrche_attack2',
        'chr_0038_purrche_attack3',
        'chr_0038_purrche_power_attack',
        'chr_0038_purrche_plunging_attack_end',
      ],
      normalAttackSkillKeys: [
        'chr_0038_purrche_attack1',
        'chr_0038_purrche_attack2',
        'chr_0038_purrche_attack3',
      ],
      defaultSkillKey: 'chr_0038_purrche_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0038_purrche_combo_skill',
      event: 'takeDamage',
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
          sequence(),
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
          skillKey: 'chr_0038_purrche_normal_skill_block_1',
          blackboardKey: 'talent_1_usp',
          operation: 'assign',
          value: [6, 10],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent1_prob_up',
          operation: 'assign',
          value: [0.1, 0.1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0038_purrche_normal_skill_block_1',
          blackboardKey: 'talent_1_stack',
          operation: 'assign',
          value: [3, 3],
        },
      ],
    },
    {
      levels: 2,
      passiveSkills: [
        {
          key: 'chr_0038_purrche_talent_2',
          blackboard: { cd: [180, 90], dmg_down: [0.5, 0.5] },
          enableSequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0038_purrche_talent_2',
              target: 'caster',
              inheritSourceSkillCastInfo: false,
              blackboardAssignments: {
                cd: { kind: 'blackboard', key: 'cd' },
                dmg_down: { kind: 'blackboard', key: 'dmg_down' },
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
          skillGroupKey: 'ultimate',
          blackboardKey: 'prob',
          operation: 'multiply',
          value: 1.5,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'modifyBasePanelStat', stat: 'defense', operation: 'flat', value: 20 },
        { kind: 'addBuildAttribute', attributes: ['will'], value: 20 },
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
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'heal_static_value_fish',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'heal_scale_fish',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale_boom',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'radiusadd_display',
          operation: 'multiply',
          value: 0.2,
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
          blackboardKey: 'atk_scale_ult',
          operation: 'multiply',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'rate_vul',
          operation: 'multiply',
          value: 1.2,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0038_purrche_aura_block: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 999,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_shield',
        iconPath: '/icons/icon_battle_shield.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: {
        count: 0,
        dmg_taken_down_1: 0.9,
        dmg_taken_down_2: 0.7,
        dmg_taken_down_3: 0.5,
        dmg_taken_down_4: 0.3,
        duration: 3,
        hit: 0,
      },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: {
              dmg_taken_down_1: 'dmg_taken_down_1',
              dmg_taken_down_2: 'dmg_taken_down_2',
              dmg_taken_down_3: 'dmg_taken_down_3',
              dmg_taken_down_4: 'dmg_taken_down_4',
            },
          }),
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
              step('applyBuff', {
                buffId: 'buff_chr_0038_purrche_block_end',
                target: 'buffOwner',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
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
              step('finishBuffsById', {
                target: 'buffOwner',
                buffIds: [
                  'buff_chr_0038_purrche_block_shelter_down',
                  'buff_chr_0038_purrche_block_shelter_down_count',
                ],
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
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'buffOwner',
                  buffIds: ['buff_chr_0038_purrche_block_change_skill'],
                  operator: 'less',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('finishBuffsById', {
                    target: 'buffOwner',
                    buffIds: ['buff_chr_0038_purrche_block_counter'],
                    reason: 'other',
                  }),
                ),
              ),
            ),
          },
        ),
      },
      abilityEventResponses: [
        {
          event: 'finishedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_pause_block'] },
              sequence(step('setCurrentBuffTimePaused', { paused: false })),
            ),
          ),
        },
        {
          event: 'beforeCastSkill',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'eventSkillIdIn',
                skillIds: [
                  'chr_0038_purrche_normal_skill_block_1',
                  'chr_0038_purrche_normal_skill_block_2',
                  'chr_0038_purrche_combo_skill',
                ],
              },
              sequence(step('setCurrentBuffTimePaused', { paused: true })),
            ),
          ),
        },
        {
          event: 'addedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_common_dash'] },
              sequence(
                step('finishBuffsById', {
                  target: 'buffOwner',
                  buffIds: ['buff_chr_0038_purrche_aura_block'],
                  reason: 'other',
                }),
              ),
            ),
          ),
        },
        {
          event: 'ownerSwitchToGuard',
          priority: 0,
          sequence: sequence(
            step('finishBuffsById', {
              target: 'buffOwner',
              buffIds: ['buff_chr_0038_purrche_aura_block'],
              reason: 'other',
            }),
          ),
        },
        {
          event: 'ownerSwitchToCenter',
          priority: 0,
          sequence: sequence(
            step('finishBuffsById', {
              target: 'buffOwner',
              buffIds: ['buff_chr_0038_purrche_aura_block'],
              reason: 'other',
            }),
          ),
        },
        {
          event: 'beforeCastSkill',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventSkillTypeIn', skillTypes: ['ultimate'] },
              sequence(
                step('finishCurrentBuff', { reason: 'other', finishSource: 'actionSource' }),
              ),
            ),
          ),
        },
        {
          event: 'addedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_counter'] },
              sequence(
                branch(
                  {
                    kind: 'buffIdStackCompare',
                    target: 'actionInputTarget',
                    buffIds: ['buff_chr_0038_purrche_block_counter'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 2 },
                  },
                  sequence(
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'count', fallback: 0 },
                        operator: 'equal',
                        right: { kind: 'constant', value: 0 },
                      },
                      sequence(
                        step('setCurrentBuffRemainingDuration', {
                          operation: 'assign',
                          value: { kind: 'constant', value: 3 },
                          target: 'eventTarget',
                        }),
                        step('modifyActionValue', {
                          key: 'count',
                          operation: 'assign',
                          value: { kind: 'constant', value: 1 },
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
          event: 'addedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_block_counter'] },
              sequence(
                branch(
                  {
                    kind: 'buffIdStackCompare',
                    target: 'buffOwner',
                    buffIds: ['buff_chr_0038_purrche_block_counter'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 2 },
                  },
                  sequence(
                    step('applyBuff', {
                      buffId: 'buff_chr_0038_purrche_block_shelter_down',
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
      ],
    },
    buff_chr_0038_purrche_block: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 999,
      triggerIntervalSeconds: 0.1,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      presentation: {
        visible: true,
        iconId: 'icon_battle_shield',
        iconPath: '/icons/icon_battle_shield.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: ['Skill/Character/Common/Shielded'],
      extendTags: [],
      blackboard: {
        count: 0,
        dmg_taken_down: 0.9,
        dmg_taken_down_1: 0.9,
        dmg_taken_down_2: 0.7,
        dmg_taken_down_3: 0.5,
        dmg_taken_down_4: 0.3,
      },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('readBuffStackCount', {
            target: 'caster',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['buff_chr_0038_purrche_block_shelter_down_count'] },
          }),
          {
            kind: 'switch',
            parameters: { choice: { kind: 'blackboard', key: 'count' }, alwaysNext: true },
            options: [
              {
                value: { kind: 'constant', value: 0 },
                sequence: sequence(
                  step('modifyActionValue', {
                    key: 'dmg_taken_down',
                    operation: 'assign',
                    value: { kind: 'blackboard', key: 'dmg_taken_down_1' },
                  }),
                ),
              },
              {
                value: { kind: 'constant', value: 1 },
                sequence: sequence(
                  step('modifyActionValue', {
                    key: 'dmg_taken_down',
                    operation: 'assign',
                    value: { kind: 'blackboard', key: 'dmg_taken_down_2' },
                  }),
                ),
              },
              {
                value: { kind: 'constant', value: 2 },
                sequence: sequence(
                  step('modifyActionValue', {
                    key: 'dmg_taken_down',
                    operation: 'assign',
                    value: { kind: 'blackboard', key: 'dmg_taken_down_3' },
                  }),
                ),
              },
              {
                value: { kind: 'constant', value: 3 },
                sequence: sequence(
                  step('modifyActionValue', {
                    key: 'dmg_taken_down',
                    operation: 'assign',
                    value: { kind: 'blackboard', key: 'dmg_taken_down_4' },
                  }),
                ),
              },
            ],
          },
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0038_purrche_block_instance'],
            reason: 'other',
          }),
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block_instance_aura',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { dmg_taken_down: 'dmg_taken_down' },
          }),
        ),
      },
      abilityEventResponses: [
        {
          event: 'addedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'eventBuffIdMatch',
                buffIds: ['buff_chr_0038_purrche_block_shelter_down_count'],
              },
              sequence(
                branch(
                  {
                    kind: 'buffIdStackCompare',
                    target: 'buffOwner',
                    buffIds: ['buff_chr_0038_purrche_aura_block'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 1 },
                  },
                  sequence(
                    step('applyBuff', {
                      buffId: 'buff_chr_0038_purrche_block_shelter_down_aura',
                      target: 'buffOwner',
                      source: 'buffSource',
                      inheritSourceSkillCastInfo: true,
                      asChildBuff: true,
                    }),
                  ),
                ),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0038_purrche_block_change_skill: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 3,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: 0.5,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      timeClock: 'global',
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
        showProgressInNormalSkillButton: true,
        useWeakProgressInNormalSkillButton: false,
        showProgressInUltimateSkillButton: false,
        forceRaiseIconEvent: false,
        showWarningBackground: false,
        playStrongInAnimation: false,
        hasCharHpBarVfxType: false,
        charHpBarVfxType: 'Fire',
        iconStyleInSquad: 'Default',
        abnormalColorType: 'Physical',
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 10 },
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0038_purrche_block_counter'],
            reason: 'other',
          }),
        ),
      },
      abilityEventResponses: [
        {
          event: 'addedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'eventBuffIdMatch',
                buffIds: ['buff_chr_0038_purrche_pause_change_skill_buff'],
              },
              sequence(step('setCurrentBuffTimePaused', { paused: true })),
            ),
          ),
        },
        {
          event: 'finishedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'eventBuffIdMatch',
                buffIds: ['buff_chr_0038_purrche_pause_change_skill_buff'],
              },
              sequence(step('setCurrentBuffTimePaused', { paused: false })),
            ),
          ),
        },
      ],
      skillSlotReplacements: [
        {
          skillGroupKey: 'battleSkill',
          targetSkillKey: 'chr_0038_purrche_normal_skill_counter',
          revertedSkillKey: 'chr_0038_purrche_normal_skill',
          inheritOriginSkillCooldownProgress: false,
        },
      ],
    },
    buff_chr_0038_purrche_block_counter: {
      stackingType: 'enhanceAndRefresh',
      priority: 0,
      maxStackCount: 3,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: 0.5,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_atk_up',
        iconPath: '/icons/icon_battle_buff_atk_up.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 30, enhance: 0, stack: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enhanceChanged: sequence(
          step('readBuffStackCount', {
            target: 'buffOwner',
            outputKey: 'enhance',
            query: { kind: 'id', buffIds: ['buff_chr_0038_purrche_block_counter'] },
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'enhance', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 2 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0038_purrche_block_counter_mark',
                target: 'buffOwner',
                source: 'buffSource',
                asChildBuff: true,
              }),
            ),
          ),
        ),
      },
    },
    buff_chr_0038_purrche_block_counter_mark: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 3,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0038_purrche_block_end: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 999,
      durationSeconds: 2,
      presentation: {
        visible: true,
        iconId: 'icon_battle_shield',
        iconPath: '/icons/icon_battle_shield.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { dmg_taken_down: 0.1 },
      attributeModifiers: [],
    },
    buff_chr_0038_purrche_block_immune_skillfx: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 999,
      durationSeconds: 0.5,
      applyTags: ['Skill/Character/chr_0038_purrche/ImmuneNormalSkillfx'],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0038_purrche_block_instance: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 999,
      presentation: {
        visible: true,
        iconId: 'icon_battle_shield',
        iconPath: '/icons/icon_battle_shield.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: ['Skill/Character/Common/Shielded'],
      extendTags: [],
      blackboard: { dmg_taken_down: 0.9, shelter_add: -0.2 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_shelter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'constant', value: 99999 },
              rate: { kind: 'blackboard', key: 'dmg_taken_down' },
            },
            keywordEnhancements: [
              {
                triggerBuffIds: ['buff_chr_0038_purrche_block_shelter_down_aura_instance'],
                operation: 'add',
                value: { kind: 'blackboard', key: 'shelter_add' },
              },
            ],
          }),
        ),
      },
    },
    buff_chr_0038_purrche_block_instance_aura: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 999,
      presentation: {
        visible: true,
        iconId: 'icon_battle_shield',
        iconPath: '/icons/icon_battle_shield.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: ['Skill/Character/Common/Shielded'],
      extendTags: [],
      blackboard: { dmg_taken_down: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block_instance',
            target: 'party',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              dmg_taken_down: { kind: 'blackboard', key: 'dmg_taken_down' },
            },
          }),
        ),
      },
    },
    buff_chr_0038_purrche_block_shelter_down: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 4,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_shield',
        iconPath: '/icons/icon_battle_shield.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0.3 },
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'buffOwner',
              buffIds: ['buff_chr_0038_purrche_aura_block'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'buffOwner',
                  buffIds: ['buff_chr_0038_purrche_block_shelter_down_count'],
                  operator: 'less',
                  value: { kind: 'constant', value: 3 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0038_purrche_block_shelter_down_count',
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
      abilityEventResponses: [
        {
          event: 'finishedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_aura_block'] },
              sequence(
                step('finishCurrentBuff', { reason: 'other', finishSource: 'actionSource' }),
              ),
            ),
          ),
        },
        {
          event: 'finishedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_pause_block'] },
              sequence(step('setCurrentBuffTimePaused', { paused: false })),
            ),
          ),
        },
        {
          event: 'beforeCastSkill',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'eventSkillIdIn',
                skillIds: [
                  'chr_0038_purrche_normal_skill_block_1',
                  'chr_0038_purrche_normal_skill_block_2',
                  'chr_0038_purrche_combo_skill',
                ],
              },
              sequence(step('setCurrentBuffTimePaused', { paused: true })),
            ),
          ),
        },
      ],
    },
    buff_chr_0038_purrche_block_shelter_down_aura: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 3,
      presentation: {
        visible: true,
        iconId: 'icon_battle_shield',
        iconPath: '/icons/icon_battle_shield.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { dmg_taken_down: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block_shelter_down_aura_instance',
            target: 'party',
            finishByAction: true,
            onActionEndFinishBuffs: {
              target: 'buffOwner',
              buffIds: ['buff_chr_0038_purrche_block_shelter_down_aura_instance'],
            },
            inheritSourceSkillCastInfo: true,
          }),
        ),
      },
    },
    buff_chr_0038_purrche_block_shelter_down_aura_instance: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 3,
      presentation: {
        visible: true,
        iconId: 'icon_battle_shield',
        iconPath: '/icons/icon_battle_shield.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'finishedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_aura_block'] },
              sequence(
                step('finishBuffsById', {
                  target: 'buffOwner',
                  buffIds: ['buff_chr_0038_purrche_block_shelter_down_aura_instance'],
                  reason: 'other',
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0038_purrche_block_shelter_down_count: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 3,
      durationSeconds: 3,
      presentation: {
        visible: true,
        iconId: 'icon_battle_shield',
        iconPath: '/icons/icon_battle_shield.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0038_purrche_block_shelter_stay: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 999,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_shield',
        iconPath: '/icons/icon_battle_shield.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: ['Skill/Character/Common/Shielded'],
      extendTags: [],
      blackboard: { dmg_taken_down: 0.9, duration: 0.7 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(step('setCurrentBuffTimePaused', { paused: true })),
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_block_shelter_stay_instance',
            target: 'party',
            finishByAction: true,
            blackboardAssignments: {
              dmg_taken_down: { kind: 'blackboard', key: 'dmg_taken_down' },
            },
          }),
        ),
      },
      abilityEventResponses: [
        {
          event: 'finishedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_aura_block'] },
              sequence(
                step('finishCurrentBuff', { reason: 'other', finishSource: 'actionSource' }),
              ),
            ),
          ),
        },
        {
          event: 'finishedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0038_purrche_pause_block'] },
              sequence(step('setCurrentBuffTimePaused', { paused: false })),
            ),
          ),
        },
        {
          event: 'beforeCastSkill',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'eventSkillIdIn',
                skillIds: [
                  'chr_0038_purrche_normal_skill_block_1',
                  'chr_0038_purrche_normal_skill_block_2',
                  'chr_0038_purrche_combo_skill',
                ],
              },
              sequence(step('setCurrentBuffTimePaused', { paused: true })),
            ),
          ),
        },
      ],
    },
    buff_chr_0038_purrche_block_shelter_stay_instance: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 999,
      presentation: {
        visible: true,
        iconId: 'icon_battle_shield',
        iconPath: '/icons/icon_battle_shield.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: ['Skill/Character/Common/Shielded'],
      extendTags: [],
      blackboard: { dmg_taken_down: 0.9, duration: 0.7 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_shelter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'constant', value: 99999 },
              rate: { kind: 'blackboard', key: 'dmg_taken_down' },
            },
          }),
        ),
      },
    },
    buff_chr_0038_purrche_combo_lasttype: {
      stackingType: 'modify',
      priority: 0,
      maxStackCount: 999,
      applyTags: [],
      extendTags: [],
      blackboard: { combotype: 0 },
      attributeModifiers: [],
    },
    buff_chr_0038_purrche_combo_to_normal_skill_hit: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 999,
      durationSeconds: 5,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0038_purrche_enter_normal_skill_end: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 999,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0038_purrche_pause_block: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 999,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0038_purrche_pause_change_skill_buff: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 3,
      triggerIntervalSeconds: 0.5,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      timeClock: 'global',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0038_purrche_talent_2: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { cd: 0, dmg_down: 0.3 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0038_purrche_talent_2_effectbuff',
            target: 'party',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              dmg_down: { kind: 'blackboard', key: 'dmg_down' },
              cd: { kind: 'blackboard', key: 'cd' },
            },
          }),
        ),
      },
    },
    buff_chr_0038_purrche_talent_2_effectbuff: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      triggerIntervalSeconds: 0.5,
      waitFirstTriggerInterval: false,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: { cd: 0, dmg_down: 0, dmg_down_true: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          branch(
            {
              kind: 'not',
              condition: {
                kind: 'globalCooldownPresent',
                target: 'buffOwner',
                markerId: 'buff_chr_0038_purrche_talent_2_effectbuff',
              },
            },
            sequence(
              branch(
                {
                  kind: 'healthCompare',
                  target: 'caster',
                  valueType: 'ratio',
                  operator: 'equal',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('calculateActionValue', {
                    key: 'dmg_down_true',
                    operation: 'multiply',
                    left: { kind: 'blackboard', key: 'dmg_down' },
                    right: { kind: 'constant', value: -1 },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0038_purrche_talent_2_effectbuff_Add',
                    target: 'buffOwner',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                    asChildBuff: true,
                    copiedBlackboardAssignments: { dmg_down: 'dmg_down_true', cd: 'cd' },
                  }),
                ),
              ),
            ),
          ),
        ),
        trigger: sequence(
          branch(
            {
              kind: 'not',
              condition: {
                kind: 'globalCooldownPresent',
                target: 'buffOwner',
                markerId: 'buff_chr_0038_purrche_talent_2_effectbuff',
              },
            },
            sequence(
              branch(
                {
                  kind: 'healthCompare',
                  target: 'caster',
                  valueType: 'ratio',
                  operator: 'equal',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('calculateActionValue', {
                    key: 'dmg_down_true',
                    operation: 'multiply',
                    left: { kind: 'blackboard', key: 'dmg_down' },
                    right: { kind: 'constant', value: -1 },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0038_purrche_talent_2_effectbuff_Add',
                    target: 'buffOwner',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                    asChildBuff: true,
                    copiedBlackboardAssignments: { dmg_down: 'dmg_down_true', cd: 'cd' },
                  }),
                ),
              ),
            ),
          ),
        ),
      },
      abilityEventResponses: [
        {
          event: 'hpChanged',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'healthCompare',
                target: 'caster',
                valueType: 'ratio',
                operator: 'equal',
                value: { kind: 'constant', value: 1 },
              },
              sequence(
                branch(
                  {
                    kind: 'not',
                    condition: {
                      kind: 'globalCooldownPresent',
                      target: 'buffOwner',
                      markerId: 'buff_chr_0038_purrche_talent_2_effectbuff',
                    },
                  },
                  sequence(
                    step('calculateActionValue', {
                      key: 'dmg_down_true',
                      operation: 'multiply',
                      left: { kind: 'blackboard', key: 'dmg_down' },
                      right: { kind: 'constant', value: -1 },
                    }),
                    step('applyBuff', {
                      buffId: 'buff_chr_0038_purrche_talent_2_effectbuff_Add',
                      target: 'buffOwner',
                      source: 'buffSource',
                      inheritSourceSkillCastInfo: true,
                      asChildBuff: true,
                      copiedBlackboardAssignments: { dmg_down: 'dmg_down_true', cd: 'cd' },
                    }),
                  ),
                ),
              ),
            ),
          ),
        },
        {
          event: 'hpChanged',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'healthCompare',
                target: 'caster',
                valueType: 'ratio',
                operator: 'less',
                value: { kind: 'constant', value: 1 },
              },
              sequence(
                step('calculateActionValue', {
                  key: 'dmg_down_true',
                  operation: 'multiply',
                  left: { kind: 'blackboard', key: 'dmg_down' },
                  right: { kind: 'constant', value: -1 },
                }),
                step('finishBuffsById', {
                  target: 'buffOwner',
                  buffIds: ['buff_chr_0038_purrche_talent_2_effectbuff_Add'],
                  reason: 'other',
                }),
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
                kind: 'buffIdStackCompare',
                target: 'buffOwner',
                buffIds: ['buff_chr_0038_purrche_talent_2_effectbuff_Add'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 1 },
              },
              sequence(
                step('setGlobalCooldown', {
                  target: 'buffOwner',
                  markerId: 'buff_chr_0038_purrche_talent_2_effectbuff',
                  durationSeconds: { kind: 'blackboard', key: 'cd' },
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0038_purrche_talent_2_effectbuff_Add: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_purrche_talent_02',
        iconPath: '/icons/icon_battle_buff_purrche_talent_02.webp',
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
      blackboard: { cd: 0, dmg_down: 0 },
      attributeModifiers: [],
      damageModifiers: [
        {
          enabledSide: 'defender',
          processors: [
            {
              kind: 'damageScale',
              side: 'attacker',
              zone: 'product',
              addition: { blackboardKey: 'dmg_down' },
            },
          ],
        },
      ],
      abilityEventResponses: [
        {
          event: 'takeDamage',
          priority: 0,
          sequence: sequence(
            step('finishCurrentBuff', { reason: 'other', finishSource: 'actionSource' }),
          ),
        },
      ],
    },
    buff_chr_0038_purrche_ult_add_red: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 3,
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_purrche_talent_01',
        iconPath: '/icons/icon_battle_buff_purrche_talent_01.webp',
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
      blackboard: { stack: 0 },
      attributeModifiers: [],
    },
    buff_chr_0038_purrche_ult_spell_vulnerable: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 3,
      durationSeconds: { blackboardKey: 'duration_vul' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_purrche_ult_vulnerable',
        iconPath: '/icons/icon_battle_buff_purrche_ult_vulnerable.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'AttentionDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { duration_vul: 0, rate: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_spell',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration_vul' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_chr_0038_purrche_vulnerable_spell_child',
            },
          }),
        ),
      },
    },
    buff_chr_0038_purrche_vulnerable_spell_child: {
      stackingType: 'unlimited',
      priority: { blackboardKey: 'rate' },
      maxStackCount: 0,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_purrche_ult_vulnerable',
        iconPath: '/icons/icon_battle_buff_purrche_ult_vulnerable.webp',
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
        iconStyleInSquad: 'LifeTime',
        abnormalColorType: 'Physical',
        orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0, rate: 0.2 },
      attributeModifiers: [],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0038_purrche_combo: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'infinite' },
      maxStackingCount: 1,
      childSkill: {
        skillId: 'chr_0038_purrche_combo_skill_giftbox_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 120,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 10,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale_blackhole_dot: 0.1,
          atk_scale_blackhole_end: 0,
          atk_scale_boom: 0,
          comboType: 0,
          heal_scale: 1,
          heal_scale_fish: 1,
          heal_static_value: 100,
          heal_static_value_fish: 100,
          poise: 15,
          usp: 0,
        },
        scheduledSequences: [
          scheduled(64, sequence(step('finishActionOwnerAbilityEntity', {})), 67),
          scheduled(
            45,
            sequence({
              kind: 'switch',
              parameters: { choice: { kind: 'blackboard', key: 'comboType' }, alwaysNext: true },
              options: [
                {
                  value: { kind: 'constant', value: 0 },
                  sequence: instantiateActionSequence(sharedActionSequence21, [
                    'SkillData.chr_0038_purrche_combo_skill_giftbox_abilityrange.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0].options[0].actionData.actionData[0].succeedActions.actionData[0].succeedActions.actionData[1]:projectile_chr_0038_purrche_combo_skill_1',
                  ]),
                },
                {
                  value: { kind: 'constant', value: 1 },
                  sequence: instantiateActionSequence(sharedActionSequence21, [
                    'SkillData.chr_0038_purrche_combo_skill_giftbox_abilityrange.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0].options[1].actionData.actionData[0].succeedActions.actionData[0].succeedActions.actionData[1]:projectile_chr_0038_purrche_combo_skill_1',
                  ]),
                },
                {
                  value: { kind: 'constant', value: 3 },
                  sequence: sequence(
                    step('findCharacterTeamTargets', {
                      saveToContextKey: 'team',
                      selection: { kind: 'controlledOperator' },
                    }),
                    forEachContextTarget(
                      'team',
                      sequence(
                        withActionBlackboardScope(
                          'SkillData.chr_0038_purrche_combo_skill_giftbox_abilityrange.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0].options[2].actionData.actionData[1].action.actionData[0]:projectile_chr_0038_purrche_combo_skill_4',
                          {},
                          true,
                          sequence({
                            kind: 'launchProjectile',
                            parameters: {
                              finish: { reachAfterTicks: 2, maxDurationSeconds: 5 },
                              recycleDelaySeconds: 0.0666666701436043,
                              hit: { onReach: true, target: 'currentTarget', finishOnHit: true },
                            },
                            callbacks: [
                              {
                                event: 'hit',
                                skill: {
                                  skillId: 'chr_0038_purrche_combo_skill_projhit_4',
                                  nativeSkillType: 'normalSkill',
                                  naturalDurationFrames: 2,
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
                                  blackboard: { heal_scale_fish: 1, heal_static_value_fish: 100 },
                                  scheduledSequences: [
                                    scheduled(
                                      0,
                                      sequence(
                                        step('heal', {
                                          target: 'actionInputTarget',
                                          alwaysNext: true,
                                          tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
                                          attribute: 'will',
                                          multiplier: {
                                            kind: 'blackboard',
                                            key: 'heal_scale_fish',
                                          },
                                          addition: {
                                            kind: 'blackboard',
                                            key: 'heal_static_value_fish',
                                          },
                                        }),
                                      ),
                                      0,
                                    ),
                                    scheduled(0, sequence(), 10),
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
                {
                  value: { kind: 'constant', value: 2 },
                  sequence: sequence(
                    withActionBlackboardScope(
                      'SkillData.chr_0038_purrche_combo_skill_giftbox_abilityrange.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0].options[3].actionData.actionData[0].succeedActions.actionData[0].succeedActions.actionData[0]:projectile_chr_0038_purrche_combo_skill_3',
                      {},
                      true,
                      sequence({
                        kind: 'launchProjectile',
                        parameters: {
                          finish: 'firstTickReach',
                          recycleDelaySeconds: 0.0333333350718021,
                        },
                        callbacks: [
                          {
                            event: 'reach',
                            skill: {
                              skillId: 'chr_0038_purrche_combo_skill_projhit_3',
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
                              blackboard: { atk_scale_boom: 1, duration: 0, poise: 15, usp: 0 },
                              scheduledSequences: [
                                scheduled(
                                  0,
                                  sequence(
                                    step(
                                      'dealDamage',
                                      {
                                        damageType: 'physical',
                                        attackScale: { kind: 'blackboard', key: 'atk_scale_boom' },
                                        tags: ['comboSkill'],
                                        features: ['canBreakWeakness'],
                                        stagger: { kind: 'blackboard', key: 'poise' },
                                      },
                                      'abilityentity_chr_0038_purrche_combo:chr_0038_purrche_combo_skill_giftbox_abilityrange:/childSkill/scheduledSequences/1/sequence/steps/0/options/3/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                                    ),
                                  ),
                                  0,
                                ),
                                scheduled(0, sequence(), 3),
                                scheduled(0, sequence(), 10),
                                scheduled(0, sequence(), 10),
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
              ],
            }),
            48,
          ),
          scheduled(
            44,
            sequence(
              step('findCharacterTeamTargets', {
                saveToContextKey: 'team',
                selection: { kind: 'allOperators' },
              }),
            ),
            45,
          ),
          scheduled(
            44,
            sequence(
              forEachContextTarget(
                'team',
                sequence(
                  repeatEachTick(
                    sequence(
                      step('heal', {
                        target: 'currentTarget',
                        alwaysNext: true,
                        tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
                        attribute: 'will',
                        multiplier: { kind: 'blackboard', key: 'heal_scale' },
                        addition: { kind: 'blackboard', key: 'heal_static_value' },
                      }),
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
              ),
            ),
            45,
          ),
          scheduled(
            44,
            sequence(
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'blackboard', key: 'usp' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'caster',
              }),
            ),
            47,
          ),
        ],
      },
    },
    abilityentity_chr_0038_purrche_combo_item_1: {
      bornTags: ['SelectCategory/Unmarkable', 'Immune/Damage'],
      lifetime: { kind: 'infinite' },
      maxStackingCount: 1,
      childSkills: {
        chr_0038_purrche_ultimate_skill_abilityrange_blackhole: {
          skillId: 'chr_0038_purrche_ultimate_skill_abilityrange_blackhole',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 67,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 10,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale_blackhole_dot: 0.1, atk_scale_blackhole_end: 0 },
          scheduledSequences: [
            scheduled(
              56,
              sequence(
                step(
                  'dealDamage',
                  {
                    damageType: 'physical',
                    attackScale: { kind: 'blackboard', key: 'atk_scale_blackhole_end' },
                    tags: ['ultimateSkill'],
                    features: ['canBreakWeakness'],
                  },
                  'abilityentity_chr_0038_purrche_combo_item_1:chr_0038_purrche_ultimate_skill_abilityrange_blackhole|chr_0038_purrche_combo_skill_abilityrange_1_1|chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3:/childSkills/chr_0038_purrche_ultimate_skill_abilityrange_blackhole/scheduledSequences/0/sequence/steps/0',
                ),
              ),
              59,
            ),
            scheduled(64, sequence(step('finishActionOwnerAbilityEntity', {})), 67),
            scheduled(
              0,
              sequence(
                repeatEachTick(
                  sequence(
                    step(
                      'dealDamage',
                      {
                        damageType: 'physical',
                        attackScale: { kind: 'blackboard', key: 'atk_scale_blackhole_dot' },
                        tags: ['ultimateSkill'],
                      },
                      'abilityentity_chr_0038_purrche_combo_item_1:chr_0038_purrche_ultimate_skill_abilityrange_blackhole|chr_0038_purrche_combo_skill_abilityrange_1_1|chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3:/childSkills/chr_0038_purrche_ultimate_skill_abilityrange_blackhole/scheduledSequences/2/sequence/steps/0/body/steps/0',
                    ),
                  ),
                  { nativeExecuteInterval: { executeEachFrame: false, intervalSeconds: 0.5 } },
                ),
              ),
              56,
            ),
          ],
        },
        chr_0038_purrche_combo_skill_abilityrange_1_1: {
          skillId: 'chr_0038_purrche_combo_skill_abilityrange_1_1',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 67,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 10,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale_blackhole_dot: 0.1, atk_scale_blackhole_end: 0 },
          scheduledSequences: [
            scheduled(
              56,
              sequence(
                step(
                  'dealDamage',
                  {
                    damageType: 'physical',
                    attackScale: { kind: 'blackboard', key: 'atk_scale_blackhole_end' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                  },
                  'abilityentity_chr_0038_purrche_combo_item_1:chr_0038_purrche_ultimate_skill_abilityrange_blackhole|chr_0038_purrche_combo_skill_abilityrange_1_1|chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3:/childSkills/chr_0038_purrche_combo_skill_abilityrange_1_1/scheduledSequences/0/sequence/steps/0',
                ),
              ),
              59,
            ),
            scheduled(64, sequence(step('finishActionOwnerAbilityEntity', {})), 67),
            scheduled(
              0,
              sequence(
                repeatEachTick(
                  sequence(
                    step(
                      'dealDamage',
                      {
                        damageType: 'physical',
                        attackScale: { kind: 'blackboard', key: 'atk_scale_blackhole_dot' },
                        tags: ['comboSkill'],
                      },
                      'abilityentity_chr_0038_purrche_combo_item_1:chr_0038_purrche_ultimate_skill_abilityrange_blackhole|chr_0038_purrche_combo_skill_abilityrange_1_1|chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3:/childSkills/chr_0038_purrche_combo_skill_abilityrange_1_1/scheduledSequences/2/sequence/steps/0/body/steps/0',
                    ),
                  ),
                  { nativeExecuteInterval: { executeEachFrame: false, intervalSeconds: 0.5 } },
                ),
              ),
              56,
            ),
          ],
        },
        chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3: {
          skillId: 'chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 67,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 10,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale_blackhole_dot: 0.1, atk_scale_blackhole_end: 0 },
          scheduledSequences: [
            scheduled(
              56,
              sequence(
                step(
                  'dealDamage',
                  {
                    damageType: 'physical',
                    attackScale: { kind: 'blackboard', key: 'atk_scale_blackhole_end' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                  },
                  'abilityentity_chr_0038_purrche_combo_item_1:chr_0038_purrche_ultimate_skill_abilityrange_blackhole|chr_0038_purrche_combo_skill_abilityrange_1_1|chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3:/childSkills/chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3/scheduledSequences/0/sequence/steps/0',
                ),
              ),
              59,
            ),
            scheduled(64, sequence(step('finishActionOwnerAbilityEntity', {})), 67),
            scheduled(
              0,
              sequence(
                repeatEachTick(
                  sequence(
                    step(
                      'dealDamage',
                      {
                        damageType: 'physical',
                        attackScale: { kind: 'blackboard', key: 'atk_scale_blackhole_dot' },
                        tags: ['comboSkill'],
                      },
                      'abilityentity_chr_0038_purrche_combo_item_1:chr_0038_purrche_ultimate_skill_abilityrange_blackhole|chr_0038_purrche_combo_skill_abilityrange_1_1|chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3:/childSkills/chr_0038_purrche_combo_skill_abilityrange_1_1_potential_3/scheduledSequences/2/sequence/steps/0/body/steps/0',
                    ),
                  ),
                  { nativeExecuteInterval: { executeEachFrame: false, intervalSeconds: 0.5 } },
                ),
              ),
              56,
            ),
          ],
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default purrchena;
