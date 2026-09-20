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

const sharedActionSequence1: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    sequence(
      withActionBlackboardScope(
        '\u0000endaxis-generated-identity:1',
        { atb: 0, atk_scale: 0 },
        true,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            '\u0000endaxis-generated-identity:2',
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
        undefined,
        { lifetime: 'execution', alwaysNext: true },
      ),
    ),
    {},
    { lifetime: 'execution' },
  ),
);

const sharedActionSequence2: ActionSequenceDefinition = sequence(
  step('createSpatialPointTargets', {
    saveToContextKey: 'firePoint',
    count: { kind: 'constant', value: 1 },
  }),
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    sequence(
      withActionBlackboardScope(
        '\u0000endaxis-generated-identity:1',
        { atb: 0, atk_scale: 0 },
        true,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            '\u0000endaxis-generated-identity:2',
          ),
          branch(
            { kind: 'probability', probability: { kind: 'constant', value: 0.3 } },
            sequence(),
            undefined,
            { alwaysNext: true },
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
        undefined,
        { lifetime: 'execution', alwaysNext: true },
      ),
    ),
    {},
    { lifetime: 'execution' },
  ),
);

const sharedActionSequence3: ActionSequenceDefinition = sequence(
  step('finishBuffsById', {
    target: 'caster',
    buffIds: ['buff_chr_0025_ardelia_normal_skill_kill_sheep'],
    reason: 'other',
  }),
  forEachTarget(
    'enemy',
    sequence(
      branch(
        {
          kind: 'buffTagIdCountCompare',
          target: 'enemy',
          tagQueryType: 'hasAny',
          buffTags: ['Skill/Character/Common/SpellStatus/Corrupt'],
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 1 },
        },
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0025_ardelia_normal_skill_vulnerable',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration_vul', rate: 'rate_vul_base' },
          }),
          step('finishBuffsByTag', {
            target: 'enemy',
            tagQueryType: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellStatus/Corrupt'],
            reason: 'early',
          }),
          step('createTimedMarker', {
            target: 'caster',
            markerId: 'talent1_mark',
            durationSeconds: { kind: 'constant', value: 1 },
            autoFinishByAction: false,
          }),
        ),
      ),
    ),
  ),
  step(
    'dealDamage',
    {
      damageType: 'nature',
      attackScale: { kind: 'blackboard', key: 'atk_scale' },
      tags: ['normalSkill'],
      features: ['canBreakWeakness'],
      stagger: { kind: 'blackboard', key: 'poise' },
    },
    '\u0000endaxis-generated-identity:0',
  ),
  step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
);

const sharedActionSequence9: ActionSequenceDefinition = sequence(
  step('mergeContextTargets', {
    saveToContextKey: 'healTar',
    sources: [{ kind: 'target', target: 'currentTarget' }],
  }),
  branch(
    {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'potential2', fallback: 0 },
      operator: 'greaterOrEqual',
      right: { kind: 'constant', value: 1 },
    },
    sequence(
      step('findCharacterTeamTargets', {
        saveToContextKey: 'otherMate',
        selection: { kind: 'lowestHealthRatioOperator', excludedContextKey: 'healTar' },
      }),
      step('calculateActionValue', {
        key: 'heal_scale_half',
        operation: 'multiply',
        left: { kind: 'blackboard', key: 'heal_scale' },
        right: { kind: 'constant', value: 0.5 },
      }),
      step('calculateActionValue', {
        key: 'heal_value_half',
        operation: 'multiply',
        left: { kind: 'blackboard', key: 'heal_value' },
        right: { kind: 'constant', value: 0.5 },
      }),
      step('heal', {
        target: 'contextTarget',
        contextKey: 'otherMate',
        alwaysNext: true,
        tags: [],
        attribute: 'will',
        multiplier: { kind: 'blackboard', key: 'heal_scale_half' },
        addition: { kind: 'blackboard', key: 'heal_value_half' },
      }),
    ),
    undefined,
    { alwaysNext: true },
  ),
  step('heal', {
    target: 'contextTarget',
    contextKey: 'healTar',
    alwaysNext: true,
    tags: [],
    attribute: 'will',
    multiplier: { kind: 'blackboard', key: 'heal_scale' },
    addition: { kind: 'blackboard', key: 'heal_value' },
  }),
  step('finishActionOwnerAbilityEntity', {}),
);

const sharedActionSequence8: ActionSequenceDefinition = sequence(
  {
    kind: 'withActionBlackboardScope',
    parameters: {
      scopeKey: 'chr_0025_ardelia_ultimate_skill_sheep_projhit:immediate-timeline:0',
      lifetime: 'execution',
      alwaysNext: true,
      shareParentBlackboard: true,
      initialValues: {},
      inheritParent: true,
    },
    body: sequence(
      branch(
        { kind: 'probability', probability: { kind: 'blackboard', key: 'effect_prob' } },
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0025_ardelia_remain_loop',
            childSkillId: 'chr_0025_ardelia_remain_loop_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
        ),
      ),
    ),
  },
  {
    kind: 'withActionBlackboardScope',
    parameters: {
      scopeKey: 'chr_0025_ardelia_ultimate_skill_sheep_projhit:immediate-timeline:1',
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
              kind: 'not',
              condition: {
                kind: 'timedMarkerPresent',
                target: 'enemy',
                markerId: 'ArdeliaUltMark',
              },
            },
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                '\u0000endaxis-generated-identity:0',
              ),
              step('createTimedMarker', {
                target: 'enemy',
                markerId: 'ArdeliaUltMark',
                durationSeconds: { kind: 'blackboard', key: 'interval' },
                autoFinishByAction: false,
              }),
            ),
          ),
        ),
      ),
    ),
  },
);

const sharedActionSequence7: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {
      atk_scale: 0,
      effect_prob: 0,
      heal_scale: 0,
      heal_value: 0,
      interval: 0,
      poise: 0,
      potential3_rate: 0,
      random_phy: 0,
      random_spe: 0,
    },
    true,
    instantiateActionSequence(sharedActionSequence8, ['\u0000endaxis-generated-identity:1']),
    undefined,
    { lifetime: 'execution', alwaysNext: true },
  ),
);

const sharedActionSequence6: ActionSequenceDefinition = sequence(
  withActionBlackboardScope(
    '\u0000endaxis-generated-identity:0',
    {},
    true,
    instantiateActionSequence(sharedActionSequence7, [
      '\u0000endaxis-generated-identity:1',
      '\u0000endaxis-generated-identity:2',
    ]),
    {},
    { lifetime: 'execution' },
  ),
);

const sharedActionSequence5: ActionSequenceDefinition = sequence(
  step('createSpatialPointTargets', {
    saveToContextKey: 'ranPos',
    count: { kind: 'constant', value: 1 },
  }),
  repeatByActionValue(
    { kind: 'constant', value: 1 },
    instantiateActionSequence(sharedActionSequence6, [
      '\u0000endaxis-generated-identity:0',
      '\u0000endaxis-generated-identity:1',
      '\u0000endaxis-generated-identity:2',
    ]),
  ),
);

const sharedActionSequence4: ActionSequenceDefinition = sequence(
  repeatEachTick(
    instantiateActionSequence(sharedActionSequence5, [
      '\u0000endaxis-generated-identity:0',
      '\u0000endaxis-generated-identity:1',
      '\u0000endaxis-generated-identity:2',
    ]),
    {
      nativeChanneling: {
        executeEachFrame: false,
        triggerIntervalSeconds: 0.1,
        maxCountPerTarget: -1,
        targetTriggerIntervalSeconds: 0.03,
      },
    },
  ),
);

export const ardeliaChr_0025_ardelia_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0025_ardelia_attack1',
    timelineBlockFrames: 11,
    naturalDurationFrames: 110,
    exclusiveFrame: 15,
    offsetRecordFrame: 6,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 30,
          input: 'basicAttack',
          targetSkillId: 'chr_0025_ardelia_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 11, endFrame: 30, skillIds: ['chr_0025_ardelia_attack2'] }],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        6,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0025_ardelia_attack1.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:projectile_chr_0025_ardelia_normal_attack1',
          'SkillData.chr_0025_ardelia_attack1.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:chr_0025_ardelia_attack1_projhit',
          'chr_0025_ardelia_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0/body/steps/0',
        ]),
        7,
      ),
      scheduled(
        11,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0025_ardelia_attack2'] })),
        30,
      ),
    ],
    timelineContinuationSkillId: 'chr_0025_ardelia_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68] },
);

export const ardeliaChr_0025_ardelia_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0025_ardelia_attack2',
    timelineBlockFrames: 20,
    naturalDurationFrames: 118,
    exclusiveFrame: 26,
    offsetRecordFrame: 8,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 36,
          input: 'basicAttack',
          targetSkillId: 'chr_0025_ardelia_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 20, endFrame: 36, skillIds: ['chr_0025_ardelia_attack3'] }],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        8,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0025_ardelia_attack2.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0025_ardelia_normal_attack2_1',
          'SkillData.chr_0025_ardelia_attack2.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:chr_0025_ardelia_attack1_projhit',
          'chr_0025_ardelia_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0/body/steps/0',
        ]),
        9,
      ),
      scheduled(
        10,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0025_ardelia_attack2.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0]:projectile_chr_0025_ardelia_normal_attack2',
          'SkillData.chr_0025_ardelia_attack2.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0]:chr_0025_ardelia_attack1_projhit',
          'chr_0025_ardelia_attack2:/scheduledSequences/1/sequence/steps/0/body/steps/0/body/steps/0',
        ]),
        11,
      ),
      scheduled(
        20,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0025_ardelia_attack3'] })),
        36,
      ),
    ],
    timelineContinuationSkillId: 'chr_0025_ardelia_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45],
    atk_scale_display: [0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.77, 0.83, 0.9],
  },
);

export const ardeliaChr_0025_ardelia_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0025_ardelia_attack3',
    timelineBlockFrames: 45,
    naturalDurationFrames: 164,
    exclusiveFrame: 47,
    offsetRecordFrame: 27,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 58,
          input: 'basicAttack',
          targetSkillId: 'chr_0025_ardelia_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 45, endFrame: 58, skillIds: ['chr_0025_ardelia_attack4'] }],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        11,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[4]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[4]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/0/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        12,
      ),
      scheduled(
        13,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[5]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[5]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/1/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        14,
      ),
      scheduled(
        15,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[6]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[6]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/2/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        16,
      ),
      scheduled(
        17,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[7]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[7]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/3/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        18,
      ),
      scheduled(
        19,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[8]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[8]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/4/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        20,
      ),
      scheduled(
        21,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[9]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[9]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/5/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        22,
      ),
      scheduled(
        23,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[10]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[10]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/6/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        24,
      ),
      scheduled(
        25,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[11]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[11]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/7/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        26,
      ),
      scheduled(
        27,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[12]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[12]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/8/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        28,
      ),
      scheduled(
        29,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[13]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[13]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/9/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        30,
      ),
      scheduled(
        31,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[14]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[14]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/10/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        32,
      ),
      scheduled(
        33,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[15]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[15]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/11/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        34,
      ),
      scheduled(
        35,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[16]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[16]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/12/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        36,
      ),
      scheduled(
        37,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[17]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[17]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/13/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        38,
      ),
      scheduled(
        39,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[18]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_attack3',
          'SkillData.chr_0025_ardelia_attack3.actionGroupData.timelineActions[18]._sequenceActionData.actionData[2]:chr_0025_ardelia_attack3_projhit',
          'chr_0025_ardelia_attack3:/scheduledSequences/14/sequence/steps/1/body/steps/0/body/steps/0',
        ]),
        40,
      ),
      scheduled(
        45,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0025_ardelia_attack4'] })),
        58,
      ),
    ],
    timelineContinuationSkillId: 'chr_0025_ardelia_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.04, 0.04, 0.04, 0.05, 0.05, 0.05, 0.06, 0.06, 0.06, 0.07, 0.07, 0.08],
    atk_scale_display: [0.53, 0.58, 0.63, 0.68, 0.74, 0.79, 0.84, 0.89, 0.95, 1.01, 1.09, 1.18],
  },
);

export const ardeliaChr_0025_ardelia_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0025_ardelia_attack4',
    timelineBlockFrames: 50,
    naturalDurationFrames: 198,
    exclusiveFrame: 50,
    offsetRecordFrame: 24,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 58,
          input: 'basicAttack',
          targetSkillId: 'chr_0025_ardelia_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 50, endFrame: 58, skillIds: ['chr_0025_ardelia_attack1'] }],
    },
    costFrame: 8,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              branch(
                { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
                sequence(
                  step('spawnAbilityEntity', {
                    abilityEntityId: 'abilityentity_chr_0025_ardelia_attack4',
                    childSkillId: 'chr_0025_ardelia_attack4_sheep',
                    inheritActionBlackboard: true,
                    dieWhenSourceDies: false,
                    target: 'enemy',
                  }),
                ),
                sequence(
                  step('spawnAbilityEntity', {
                    abilityEntityId: 'abilityentity_chr_0025_ardelia_attack4',
                    childSkillId: 'chr_0025_ardelia_attack4_sheep',
                    inheritActionBlackboard: true,
                    dieWhenSourceDies: false,
                    target: 'enemy',
                  }),
                ),
                { alwaysNext: true },
              ),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        1,
      ),
      scheduled(
        65,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0025_ardelia_attack4_end',
            childSkillId: 'chr_0025_ardelia_attack4_end_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'caster',
          }),
        ),
        66,
      ),
      scheduled(
        0,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(),
            sequence(
              branch(
                { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
                sequence(
                  step('spawnAbilityEntity', {
                    abilityEntityId: 'abilityentity_chr_0025_ardelia_attack4_low',
                    childSkillId: 'chr_0025_ardelia_attack4_sheep',
                    inheritActionBlackboard: true,
                    dieWhenSourceDies: false,
                    target: 'enemy',
                  }),
                ),
                sequence(
                  step('spawnAbilityEntity', {
                    abilityEntityId: 'abilityentity_chr_0025_ardelia_attack4_low',
                    childSkillId: 'chr_0025_ardelia_attack4_sheep',
                    inheritActionBlackboard: true,
                    dieWhenSourceDies: false,
                    target: 'enemy',
                  }),
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
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0025_ardelia_attack4_kill_sheep',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        198,
      ),
      scheduled(
        50,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0025_ardelia_attack1'] })),
        58,
      ),
    ],
    timelineContinuationSkillId: 'chr_0025_ardelia_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 18,
    atk_scale: [0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24],
    poise: 18,
  },
);

export const ardeliaChr_0025_ardelia_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0025_ardelia_power_attack',
    timelineBlockFrames: 57,
    naturalDurationFrames: 215,
    exclusiveFrame: 65,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 57,
          endFrame: 65,
          skillIds: ['chr_0025_ardelia_normal_skill', 'chr_0025_ardelia_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(10, sequence(step('launchProjectileLifetime', { finish: 'firstTickReach' })), 11),
      scheduled(
        18,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.1,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0025_ardelia_power_attack:/scheduledSequences/1/sequence/steps/0',
          ),
        ),
        21,
      ),
      scheduled(
        21,
        sequence(
          repeatEachTick(
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
                'chr_0025_ardelia_power_attack:/scheduledSequences/2/sequence/steps/0/body/steps/0',
              ),
            ),
            { nativeTickInterval: { executeEachFrame: false, intervalSeconds: 0.11 } },
          ),
        ),
        53,
      ),
      scheduled(
        57,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.4,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0025_ardelia_power_attack:/scheduledSequences/3/sequence/steps/0',
          ),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
        ),
        60,
      ),
      scheduled(
        15,
        sequence(
          repeatEachTick(
            sequence(
              step('launchProjectileLifetime', { finish: 'firstTickReach' }),
              step('launchProjectileLifetime', { finish: 'firstTickReach' }),
              step('launchProjectileLifetime', { finish: 'firstTickReach' }),
            ),
            {
              nativeChanneling: {
                executeEachFrame: false,
                triggerIntervalSeconds: 0.1,
                maxCountPerTarget: -1,
                targetTriggerIntervalSeconds: 0,
              },
            },
          ),
        ),
        28,
      ),
      scheduled(
        28,
        sequence(
          repeatEachTick(
            sequence(
              step('launchProjectileLifetime', { finish: 'firstTickReach' }),
              step('launchProjectileLifetime', { finish: 'firstTickReach' }),
            ),
            {
              nativeChanneling: {
                executeEachFrame: false,
                triggerIntervalSeconds: 0.1,
                maxCountPerTarget: -1,
                targetTriggerIntervalSeconds: 0,
              },
            },
          ),
        ),
        41,
      ),
      scheduled(
        41,
        sequence(
          repeatEachTick(sequence(step('launchProjectileLifetime', { finish: 'firstTickReach' })), {
            nativeChanneling: {
              executeEachFrame: false,
              triggerIntervalSeconds: 0.1,
              maxCountPerTarget: -1,
              targetTriggerIntervalSeconds: 0,
            },
          }),
        ),
        51,
      ),
      scheduled(
        59,
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
                  time: 0,
                  value: 0.4,
                  inTangent: -14.1076889,
                  outTangent: -14.1076889,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.283485949,
                },
                {
                  time: 0.05,
                  value: 0.01,
                  inTangent: 0.00631965976,
                  outTangent: 0.00631965976,
                  weightedMode: 2,
                  inWeight: 0.333333343,
                  outWeight: 0.7771024,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 8.266109,
                  outTangent: 5.233175,
                  weightedMode: 1,
                  inWeight: 0.08745263,
                  outWeight: 0.333333343,
                },
              ],
            },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        62,
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
        65,
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
        57,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const ardeliaChr_0025_ardelia_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0025_ardelia_plunging_attack_end',
    timelineBlockFrames: 23,
    naturalDurationFrames: 156,
    exclusiveFrame: 22,
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
            'chr_0025_ardelia_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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
        6,
      ),
      scheduled(
        0,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'Sheep',
            abilityEntityIds: ['abilityentity_chr_0025_ardelia_air_attack'],
          }),
        ),
        1,
      ),
      scheduled(
        5,
        sequence(forEachContextTarget('Sheep', sequence(step('finishCurrentAbilityEntity', {})))),
        8,
      ),
      scheduled(
        0,
        sequence(
          step('inheritBuffById', {
            target: 'caster',
            buffId: 'buff_chr_0025_ardelia_air_attack_interrupt_listener',
            inheritToNextSkillIds: [],
            finishByAction: true,
            finishWithNextSkillIfNotInherited: true,
          }),
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

export const ardeliaChr_0025_ardelia_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0025_ardelia_normal_skill',
    timelineBlockFrames: 47,
    naturalDurationFrames: 378,
    exclusiveFrame: 239,
    offsetRecordFrame: 7,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 47, endFrame: 52, skillIds: ['chr_0025_ardelia_attack1'] },
        { startFrame: 236, endFrame: 241, skillIds: ['chr_0025_ardelia_attack1'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(188, sequence(step('finishTimeline', {})), 189),
      scheduled(
        25,
        sequence(
          step('jumpTimeline', {
            destinationFrame: 32,
            condition: { kind: 'constant', value: true },
          }),
        ),
        31,
      ),
      scheduled(
        214,
        sequence(
          step('jumpTimeline', {
            destinationFrame: 221,
            condition: {
              kind: 'contextTargetCountCompare',
              contextKey: 'other_cor_tar',
              operator: 'greater',
              value: 0,
            },
          }),
        ),
        220,
      ),
      scheduled(
        32,
        sequence(
          step('createSpatialPointTargets', {
            saveToContextKey: 'SheepPoint',
            count: { kind: 'blackboard', key: 'sheep_num' },
          }),
          repeatByActionValue(
            { kind: 'blackboard', key: 'sheep_num' },
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0025_ardelia_normal_skill.actionGroupData.timelineActions[19]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_skill',
                {},
                true,
                sequence(
                  withActionBlackboardScope(
                    'SkillData.chr_0025_ardelia_normal_skill.actionGroupData.timelineActions[19]._sequenceActionData.actionData[2]:chr_0025_ardelia_normal_skill_gene_sheep',
                    { atb: 0, atk_scale: 0, heal_scale: 0, heal_value: 0, potential2: 0 },
                    true,
                    sequence(
                      step('spawnAbilityEntity', {
                        abilityEntityId: 'abilityentity_chr_0025_ardelia_remain_loop',
                        childSkillId: 'chr_0025_ardelia_remain_loop_sheep',
                        inheritActionBlackboard: true,
                        dieWhenSourceDies: false,
                      }),
                    ),
                    undefined,
                    { lifetime: 'execution', alwaysNext: true },
                  ),
                ),
                {},
                { lifetime: 'execution' },
              ),
            ),
          ),
        ),
        35,
      ),
      scheduled(
        221,
        sequence(
          step('createSpatialPointTargets', {
            saveToContextKey: 'SheepPoint',
            count: { kind: 'blackboard', key: 'sheep_num' },
          }),
          repeatByActionValue(
            { kind: 'blackboard', key: 'sheep_num' },
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0025_ardelia_normal_skill.actionGroupData.timelineActions[20]._sequenceActionData.actionData[2]:projectile_chr_0025_ardelia_normal_skill',
                {},
                true,
                sequence(
                  withActionBlackboardScope(
                    'SkillData.chr_0025_ardelia_normal_skill.actionGroupData.timelineActions[20]._sequenceActionData.actionData[2]:chr_0025_ardelia_normal_skill_gene_sheep',
                    { atb: 0, atk_scale: 0, heal_scale: 0, heal_value: 0, potential2: 0 },
                    true,
                    sequence(
                      step('spawnAbilityEntity', {
                        abilityEntityId: 'abilityentity_chr_0025_ardelia_remain_loop',
                        childSkillId: 'chr_0025_ardelia_remain_loop_sheep',
                        inheritActionBlackboard: true,
                        dieWhenSourceDies: false,
                      }),
                    ),
                    undefined,
                    { lifetime: 'execution', alwaysNext: true },
                  ),
                ),
                {},
                { lifetime: 'execution' },
              ),
            ),
          ),
        ),
        224,
      ),
      scheduled(
        32,
        instantiateActionSequence(sharedActionSequence3, [
          'chr_0025_ardelia_normal_skill:/scheduledSequences/5/sequence/steps/2',
        ]),
        33,
      ),
      scheduled(
        221,
        instantiateActionSequence(sharedActionSequence3, [
          'chr_0025_ardelia_normal_skill:/scheduledSequences/6/sequence/steps/2',
        ]),
        222,
      ),
      scheduled(
        33,
        sequence(
          branch(
            { kind: 'timedMarkerPresent', target: 'caster', markerId: 'talent1_mark' },
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'talent1', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  branch(
                    {
                      kind: 'entityTagMatch',
                      target: 'enemy',
                      tagQueryType: 'hasAny',
                      tags: ['Skill/Character/Common/SpellStatus/Corrupt'],
                    },
                    sequence(
                      step('mergeContextTargets', {
                        saveToContextKey: 'other_cor_tar',
                        sources: [{ kind: 'target', target: 'enemy' }],
                      }),
                    ),
                    sequence(
                      step('mergeContextTargets', {
                        saveToContextKey: 'other_cor_tar',
                        sources: [],
                      }),
                    ),
                  ),
                  branch(
                    {
                      kind: 'contextTargetCountCompare',
                      contextKey: 'other_cor_tar',
                      operator: 'greaterOrEqual',
                      value: 1,
                    },
                    sequence(step('jumpTimeline', { destinationFrame: 189 })),
                  ),
                ),
              ),
            ),
          ),
        ),
        36,
      ),
      scheduled(
        0,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0025_ardelia_normal_skill',
            childSkillId: 'chr_0025_ardelia_normal_skill_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
        ),
        3,
      ),
      scheduled(
        189,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0025_ardelia_normal_skill',
            childSkillId: 'chr_0025_ardelia_normal_skill_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
        ),
        192,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0025_ardelia_normal_skill_kill_sheep',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        189,
      ),
      scheduled(
        189,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0025_ardelia_normal_skill_kill_sheep',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        378,
      ),
    ],
    smartTarget: 'enemy',
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    additional_def_decrease: 0,
    atk_scale: [1.42, 1.56, 1.71, 1.85, 1.99, 2.13, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2],
    cam_angle: 0,
    def_decrease: 0,
    duration_vul: 30,
    heal_scale: 0,
    heal_value: 0,
    input_angle: 0,
    poise: 10,
    potential2: 0,
    rate_vul: 0,
    rate_vul_base: [0.12, 0.12, 0.12, 0.13, 0.13, 0.13, 0.14, 0.14, 0.16, 0.17, 0.18, 0.2],
    sheep_num: 0,
    talent1: 0,
    rate_vul_max: [0.36, 0.36, 0.36, 0.37, 0.37, 0.37, 0.38, 0.38, 0.4, 0.41, 0.42, 0.4],
  },
);

export const ardeliaChr_0025_ardelia_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0025_ardelia_combo_skill',
    timelineBlockFrames: 23,
    naturalDurationFrames: 160,
    exclusiveFrame: 40,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 23, endFrame: 40, skillIds: ['chr_0025_ardelia_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0025_ardelia_combo_skill',
            childSkillId: 'chr_0025_ardelia_combo_skill_sheep',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
        ),
        3,
      ),
      scheduled(
        20,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0025_ardelia_combo_skill.actionGroupData.timelineActions[6]._sequenceActionData.actionData[1].succeedActions.actionData[0]:projectile_chr_0025_ardelia_combo_skill',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0025_ardelia_combo_skill.actionGroupData.timelineActions[6]._sequenceActionData.actionData[1].succeedActions.actionData[0]:chr_0025_ardelia_combo_skill_projhit',
                {
                  atk_scale: 0,
                  atk_scale_boom: 0,
                  duration_corrupt: 0,
                  potential3: 0,
                  potential5_dmg_rate: 0,
                  potential5_duration: 0,
                  usp: 0,
                },
                true,
                sequence(
                  {
                    kind: 'withActionBlackboardScope',
                    parameters: {
                      scopeKey: 'chr_0025_ardelia_combo_skill_projhit:immediate-timeline:0',
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
                          left: { kind: 'blackboard', key: 'potential5_dmg_rate', fallback: 0 },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0 },
                        },
                        sequence(
                          step('modifyActionValue', {
                            key: 'atk_scale',
                            operation: 'multiply',
                            value: { kind: 'blackboard', key: 'potential5_dmg_rate' },
                          }),
                          step('modifyActionValue', {
                            key: 'atk_scale_boom',
                            operation: 'multiply',
                            value: { kind: 'blackboard', key: 'potential5_dmg_rate' },
                          }),
                          step(
                            'dealDamage',
                            {
                              damageType: 'nature',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['comboSkill'],
                              features: ['canBreakWeakness'],
                            },
                            'chr_0025_ardelia_combo_skill:/scheduledSequences/1/sequence/steps/0/body/steps/0/body/steps/0/body/steps/0/whenTrue/steps/2',
                          ),
                          step('changeResourceByActionValue', {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'blackboard', key: 'usp' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          }),
                        ),
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'nature',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['comboSkill'],
                              features: ['canBreakWeakness'],
                            },
                            'chr_0025_ardelia_combo_skill:/scheduledSequences/1/sequence/steps/0/body/steps/0/body/steps/0/body/steps/0/whenFalse/steps/0',
                          ),
                          step('changeResourceByActionValue', {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'blackboard', key: 'usp' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                          }),
                        ),
                        { alwaysNext: true },
                      ),
                    ),
                  },
                  {
                    kind: 'withActionBlackboardScope',
                    parameters: {
                      scopeKey: 'chr_0025_ardelia_combo_skill_projhit:immediate-timeline:1',
                      lifetime: 'execution',
                      alwaysNext: true,
                      shareParentBlackboard: true,
                      initialValues: {},
                      inheritParent: true,
                    },
                    body: sequence(
                      step('spawnAbilityEntity', {
                        abilityEntityId: 'abilityentity_chr_0025_ardelia_combo_skill_bomb',
                        childSkillId: 'chr_0025_ardelia_combo_skill_bomb',
                        inheritActionBlackboard: true,
                        dieWhenSourceDies: false,
                        target: 'enemy',
                      }),
                    ),
                  },
                ),
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        23,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.8 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        21,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0025_ardelia_combo_skill_kill_sheep',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        160,
      ),
    ],
    smartTarget: 'input',
    cooldownFrames: [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 510],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.93, 1],
    atk_scale_boom: [1.11, 1.22, 1.33, 1.44, 1.55, 1.67, 1.78, 1.89, 2, 2.14, 2.3, 2.5],
    cam_angle: 0,
    cam_duration: 0,
    count: 0,
    duration_corrupt: 7,
    input_angle: 0,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    posie: 0,
    potential3: 0,
    potential5_dmg_rate: 0,
    potential5_duration: 0,
    usp: 10,
    poise: 10,
  },
);

export const ardeliaChr_0025_ardelia_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0025_ardelia_ultimate_skill',
    timelineBlockFrames: 209,
    naturalDurationFrames: 261,
    exclusiveFrame: 223,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 209,
          endFrame: 226,
          skillIds: ['chr_0025_ardelia_normal_skill', 'chr_0025_ardelia_combo_skill'],
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
        1,
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
        171,
        sequence(
          step('jumpTimeline', {
            destinationFrame: 201,
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential3_duration', fallback: 0 },
              operator: 'less',
              right: { kind: 'constant', value: 1 },
            },
          }),
        ),
        174,
      ),
      scheduled(
        81,
        instantiateActionSequence(sharedActionSequence4, [
          'SkillData.chr_0025_ardelia_ultimate_skill.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].actionOnTick.actionData[1]:projectile_chr_0025_ardelia_ultimate_skill',
          'SkillData.chr_0025_ardelia_ultimate_skill.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].actionOnTick.actionData[1]:chr_0025_ardelia_ultimate_skill_sheep_projhit',
          'chr_0025_ardelia_ultimate_skill:/scheduledSequences/3/sequence/steps/0/body/steps/1/body/steps/0/body/steps/0/body/steps/1/body/steps/0/body/steps/0/whenTrue/steps/0',
        ]),
        201,
      ),
      scheduled(
        81,
        instantiateActionSequence(sharedActionSequence4, [
          'SkillData.chr_0025_ardelia_ultimate_skill.actionGroupData.timelineActions[8]._sequenceActionData.actionData[0].actionOnTick.actionData[1]:projectile_chr_0025_ardelia_ultimate_skill',
          'SkillData.chr_0025_ardelia_ultimate_skill.actionGroupData.timelineActions[8]._sequenceActionData.actionData[0].actionOnTick.actionData[1]:chr_0025_ardelia_ultimate_skill_sheep_projhit',
          'chr_0025_ardelia_ultimate_skill:/scheduledSequences/4/sequence/steps/0/body/steps/1/body/steps/0/body/steps/0/body/steps/1/body/steps/0/body/steps/0/whenTrue/steps/0',
        ]),
        201,
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
        80,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 80),
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
        81,
      ),
    ],
    cooldownFrames: 450,
    costs: [{ resource: 'ultimateEnergy', value: 90 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale: [0.73, 0.81, 0.88, 0.95, 1.03, 1.1, 1.17, 1.25, 1.32, 1.41, 1.52, 1.65],
    atk_scale_2: 0,
    effect_prob: 0.1,
    heal_scale: 0,
    heal_value: 0,
    interval: 0.3,
    poise: [2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3],
    potential2: 0,
    potential3_duration: 0,
    potential3_rate: 0,
    radius: 4,
    ranCount: 0,
    select_radius: 10,
    tarDisMax: 0,
    duration: 3,
  },
);

export const ardeliaCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const ardelia: OperatorDefinition = {
  slug: 'ardelia',
  gameId: 'ARDELIA',
  rarity: 6,
  weaponType: 'arts-unit',
  element: 'nature',
  role: 'supporter',
  mainAttribute: 'intellect',
  secondaryAttribute: 'will',
  attributes: {
    strength: [9, 31, 54, 77, 100, 112],
    agility: [9, 27, 46, 65, 84, 93],
    intellect: [20, 46, 75, 103, 131, 145],
    will: [15, 37, 60, 83, 106, 118],
    baseAttack: [30, 93, 159, 225, 291, 323],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        ardeliaChr_0025_ardelia_attack1,
        ardeliaChr_0025_ardelia_attack2,
        ardeliaChr_0025_ardelia_attack3,
        ardeliaChr_0025_ardelia_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: ardeliaChr_0025_ardelia_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: ardeliaChr_0025_ardelia_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: ardeliaChr_0025_ardelia_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: ardeliaChr_0025_ardelia_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: ardeliaChr_0025_ardelia_ultimate_skill,
    },
  ],
  dodgeSkill: ardeliaCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0025_ardelia_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0025_ardelia_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0025_ardelia_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0025_ardelia_attack1',
        'chr_0025_ardelia_attack2',
        'chr_0025_ardelia_attack3',
        'chr_0025_ardelia_attack4',
        'chr_0025_ardelia_plunging_attack_end',
        'chr_0025_ardelia_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0025_ardelia_attack1',
        'chr_0025_ardelia_attack2',
        'chr_0025_ardelia_attack3',
        'chr_0025_ardelia_attack4',
      ],
      defaultSkillKey: 'chr_0025_ardelia_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0025_ardelia_combo_skill',
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
              { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalAttackLastCombo'] },
              sequence(
                branch(
                  {
                    kind: 'buffStackCompare',
                    target: 'actionInputTarget',
                    tagQueryType: 'hasAny',
                    buffTags: [
                      'Skill/Character/Common/NoGuard',
                      'Skill/Character/Common/SpellInflict',
                    ],
                    operator: 'equal',
                    value: { kind: 'constant', value: 0 },
                  },
                  sequence(),
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
      levels: 3,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.38, 0.53, 0.75],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'heal_value',
          operation: 'assign',
          value: [45, 63, 90],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'heal_scale',
          operation: 'assign',
          value: [0.38, 0.53, 0.75],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'heal_value',
          operation: 'assign',
          value: [45, 63, 90],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'sheep_num',
          operation: 'assign',
          value: [3, 3, 3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'effect_prob',
          operation: 'assign',
          value: [0.1, 0.1, 0.1],
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'talent1',
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
          blackboardKey: 'rate_vul_base',
          operation: 'add',
          value: 0.08,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential2',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential2',
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
          blackboardKey: 'potential3_duration',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'effect_prob',
          operation: 'multiply',
          value: 1.2,
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
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential5_duration',
          operation: 'assign',
          value: 4,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential5_dmg_rate',
          operation: 'add',
          value: 1.2,
        },
        { kind: 'addSkillCooldownFrames', skillGroupKey: 'comboSkill', frames: -60 },
      ],
    },
  ],
  entityBlackboard: { EntityBB_skill_bg_type: 99 },
  buffDefinitions: {
    buff_chr_0025_ardelia_affixes_vulnerable_physic_child: {
      stackingType: 'unlimited',
      priority: { blackboardKey: 'rate' },
      maxStackCount: 0,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0, rate: 0.2 },
      attributeModifiers: [],
    },
    buff_chr_0025_ardelia_affixes_vulnerable_spell_child: {
      stackingType: 'unlimited',
      priority: { blackboardKey: 'rate' },
      maxStackCount: 0,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_affix_vulnerable',
        iconPath: '/icons/icon_battle_affix_vulnerable.webp',
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
      blackboard: { duration: 0, rate: 0.2 },
      attributeModifiers: [],
    },
    buff_chr_0025_ardelia_attack4_kill_sheep: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'attack4_sheep',
            abilityEntityIds: [
              'abilityentity_chr_0025_ardelia_attack4',
              'abilityentity_chr_0025_ardelia_attack4_end',
              'abilityentity_chr_0025_ardelia_attack4_low',
            ],
          }),
          forEachContextTarget('attack4_sheep', sequence(step('finishCurrentAbilityEntity', {}))),
        ),
      },
    },
    buff_chr_0025_ardelia_combo_skill_kill_sheep: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'combo_skill_sheep',
            abilityEntityIds: ['abilityentity_chr_0025_ardelia_combo_skill'],
          }),
          forEachContextTarget(
            'combo_skill_sheep',
            sequence(step('finishCurrentAbilityEntity', {})),
          ),
        ),
      },
    },
    buff_chr_0025_ardelia_normal_skill_kill_sheep: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'normal_skill_sheep',
            abilityEntityIds: ['abilityentity_chr_0025_ardelia_normal_skill'],
          }),
          forEachContextTarget(
            'normal_skill_sheep',
            sequence(step('finishCurrentAbilityEntity', {})),
          ),
        ),
      },
    },
    buff_chr_0025_ardelia_normal_skill_vulnerable: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 7, rate: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_spell',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_chr_0025_ardelia_affixes_vulnerable_spell_child',
            },
          }),
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_physical',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_chr_0025_ardelia_affixes_vulnerable_physic_child',
            },
          }),
        ),
      },
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0025_ardelia_attack4: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0025_ardelia/Attack4Sheep',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        skillId: 'chr_0025_ardelia_attack4_sheep',
        blackboard: { atb: 0, atk_scale: 0, poise: 0 },
        scheduledSequences: [
          scheduled(
            24,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack', 'normalAttackLastCombo'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                  staggerOnlyWhenCasterControlled: true,
                },
                'abilityentity_chr_0025_ardelia_attack4:chr_0025_ardelia_attack4_sheep:/childSkill/scheduledSequences/0/sequence/steps/0',
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
            27,
          ),
          scheduled(27, sequence(step('finishActionOwnerAbilityEntity', {})), 30),
        ],
      },
    },
    abilityentity_chr_0025_ardelia_attack4_end: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0025_ardelia/Attack4Sheep',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        skillId: 'chr_0025_ardelia_attack4_end_sheep',
        blackboard: { atb: 0, atk_scale: 0 },
        scheduledSequences: [
          scheduled(109, sequence(step('finishActionOwnerAbilityEntity', {})), 112),
        ],
      },
    },
    abilityentity_chr_0025_ardelia_attack4_low: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0025_ardelia/Attack4Sheep',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        skillId: 'chr_0025_ardelia_attack4_sheep',
        blackboard: { atb: 0, atk_scale: 0, poise: 0 },
        scheduledSequences: [
          scheduled(
            24,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack', 'normalAttackLastCombo'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                  staggerOnlyWhenCasterControlled: true,
                },
                'abilityentity_chr_0025_ardelia_attack4_low:chr_0025_ardelia_attack4_sheep:/childSkill/scheduledSequences/0/sequence/steps/0',
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
            27,
          ),
          scheduled(27, sequence(step('finishActionOwnerAbilityEntity', {})), 30),
        ],
      },
    },
    abilityentity_chr_0025_ardelia_normal_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0025_ardelia/NormalSkillSheep',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        skillId: 'chr_0025_ardelia_normal_skill_sheep',
        blackboard: { atb: 0, atk_scale: 0 },
        scheduledSequences: [
          scheduled(31, sequence(step('finishActionOwnerAbilityEntity', {})), 34),
        ],
      },
    },
    abilityentity_chr_0025_ardelia_remain_loop: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 10 },
      maxStackingCount: 10,
      childSkill: {
        skillId: 'chr_0025_ardelia_remain_loop_sheep',
        blackboard: {
          atb: 0,
          heal_scale: 1,
          heal_scale_half: 0,
          heal_value: 0,
          heal_value_half: 0,
          potential2: 0,
          RandomSheep: 0,
        },
        scheduledSequences: [
          scheduled(
            9,
            sequence(
              step('findCharacterTeamTargets', {
                saveToContextKey:
                  '__auraParty:SkillData.chr_0025_ardelia_remain_loop_sheep.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]',
                selection: { kind: 'controlledOperator' },
              }),
              forEachContextTarget(
                '__auraParty:SkillData.chr_0025_ardelia_remain_loop_sheep.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]',
                sequence(
                  branch(
                    {
                      kind: 'healthCompare',
                      target: 'currentTarget',
                      valueType: 'ratio',
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 0.99 },
                    },
                    sequence(
                      step('findCharacterTeamTargets', {
                        saveToContextKey: 'healTar',
                        selection: {
                          kind: 'lowestHealthRatioOperator',
                          excludeCurrentTarget: true,
                        },
                      }),
                      branch(
                        {
                          kind: 'contextTargetCountCompare',
                          contextKey: 'healTar',
                          operator: 'greaterOrEqual',
                          value: 1,
                        },
                        sequence(
                          branch(
                            {
                              kind: 'healthCompare',
                              target: 'contextTarget',
                              contextKey: 'healTar',
                              valueType: 'ratio',
                              operator: 'greaterOrEqual',
                              value: { kind: 'constant', value: 0.99 },
                            },
                            sharedActionSequence9,
                            sequence(
                              branch(
                                {
                                  kind: 'actionValueCompare',
                                  left: { kind: 'blackboard', key: 'potential2', fallback: 0 },
                                  operator: 'greaterOrEqual',
                                  right: { kind: 'constant', value: 1 },
                                },
                                sequence(
                                  step('findCharacterTeamTargets', {
                                    saveToContextKey: 'otherMate',
                                    selection: {
                                      kind: 'lowestHealthRatioOperator',
                                      excludedContextKey: 'healTar',
                                    },
                                  }),
                                  step('calculateActionValue', {
                                    key: 'heal_scale_half',
                                    operation: 'multiply',
                                    left: { kind: 'blackboard', key: 'heal_scale' },
                                    right: { kind: 'constant', value: 0.5 },
                                  }),
                                  step('calculateActionValue', {
                                    key: 'heal_value_half',
                                    operation: 'multiply',
                                    left: { kind: 'blackboard', key: 'heal_value' },
                                    right: { kind: 'constant', value: 0.5 },
                                  }),
                                  step('heal', {
                                    target: 'contextTarget',
                                    contextKey: 'otherMate',
                                    alwaysNext: true,
                                    tags: [],
                                    attribute: 'will',
                                    multiplier: { kind: 'blackboard', key: 'heal_scale_half' },
                                    addition: { kind: 'blackboard', key: 'heal_value_half' },
                                  }),
                                ),
                                undefined,
                                { alwaysNext: true },
                              ),
                              step('heal', {
                                target: 'contextTarget',
                                contextKey: 'healTar',
                                alwaysNext: true,
                                tags: [],
                                attribute: 'will',
                                multiplier: { kind: 'blackboard', key: 'heal_scale' },
                                addition: { kind: 'blackboard', key: 'heal_value' },
                              }),
                              step('finishActionOwnerAbilityEntity', {}),
                            ),
                            { alwaysNext: true },
                          ),
                        ),
                        sharedActionSequence9,
                        { alwaysNext: true },
                      ),
                    ),
                    sharedActionSequence9,
                    { alwaysNext: true },
                  ),
                ),
              ),
            ),
            300,
          ),
          scheduled(299, sequence(step('finishActionOwnerAbilityEntity', {})), 300),
        ],
      },
    },
    abilityentity_chr_0025_ardelia_combo_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0025_ardelia/ComboSkillSheep',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        skillId: 'chr_0025_ardelia_combo_skill_sheep',
        blackboard: { atb: 0, atk_scale: 0 },
        scheduledSequences: [
          scheduled(66, sequence(step('finishActionOwnerAbilityEntity', {})), 69),
        ],
      },
    },
    abilityentity_chr_0025_ardelia_combo_skill_bomb: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 3 },
      childSkill: {
        skillId: 'chr_0025_ardelia_combo_skill_bomb',
        blackboard: {
          atb: 0,
          atk_scale_boom: 0,
          duration_corrupt: 0,
          duration_corrupt_final: 0,
          poise: 0,
          potential5_dmg_rate: 0,
          potential5_duration: 0,
        },
        scheduledSequences: [
          scheduled(
            52,
            sequence(
              step('calculateActionValue', {
                key: 'duration_corrupt_final',
                operation: 'add',
                left: { kind: 'blackboard', key: 'duration_corrupt' },
                right: { kind: 'blackboard', key: 'potential5_duration' },
              }),
              step('applyBuff', {
                buffId: 'buff_common_natural_natural_corrupt_triggered',
                target: 'enemy',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: { duration: 'duration_corrupt_final' },
              }),
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_boom' },
                  tags: ['comboSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                'abilityentity_chr_0025_ardelia_combo_skill_bomb:chr_0025_ardelia_combo_skill_bomb:/childSkill/scheduledSequences/0/sequence/steps/2',
              ),
              step('mergeContextTargets', { saveToContextKey: 'tar', sources: [] }),
              step('modifyActionValue', {
                key: 'atk_scale_boom',
                operation: 'multiply',
                value: { kind: 'constant', value: 0.5 },
              }),
            ),
            55,
          ),
          scheduled(119, sequence(step('finishActionOwnerAbilityEntity', {})), 120),
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default ardelia;
