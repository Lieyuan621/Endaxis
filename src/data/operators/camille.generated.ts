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

const sharedActionSequence1: ActionSequenceDefinition = sequence(
  repeatEachTick(
    sequence(
      once(
        '\u0000endaxis-generated-identity:0',
        sequence(
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atb' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          }),
        ),
      ),
      step(
        'dealDamage',
        {
          damageType: 'heat',
          attackScale: { kind: 'blackboard', key: 'atk_scale_2_2' },
          tags: ['comboSkill'],
          features: ['canBreakWeakness'],
          stagger: { kind: 'blackboard', key: 'poise' },
        },
        '\u0000endaxis-generated-identity:1',
      ),
      branch(
        { kind: 'casterControlled' },
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
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
    {
      nativeChanneling: {
        executeEachFrame: true,
        triggerIntervalSeconds: 0.033,
        maxCountPerTarget: 1,
        targetTriggerIntervalSeconds: 0.033,
      },
    },
  ),
);

const sharedActionSequence3: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'talent_0', fallback: 0 },
      operator: 'greaterOrEqual',
      right: { kind: 'constant', value: 1 },
    },
    sequence(
      once(
        '\u0000endaxis-generated-identity:0',
        sequence(
          step('createGlobalBuff', {
            globalBuffId: 'global_buff_combo_trigger',
            definition: {
              stackingType: 'stack',
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              blackboard: { duration: 0, imbue_scale: 0 },
              children: [
                {
                  buffId: 'buff_common_affixes_combo_trigger',
                  blackboardAssignments: {
                    imbue_scale: { kind: 'blackboard', key: 'imbue_scale' },
                  },
                },
              ],
            },
            source: 'caster',
            blackboardAssignments: { duration: { kind: 'blackboard', key: 'combo_duration' } },
          }),
        ),
      ),
    ),
    undefined,
    { alwaysNext: true },
  ),
  branch(
    {
      kind: 'entityTagMatch',
      target: 'enemy',
      tagQueryType: 'hasAny',
      tags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
    },
    sequence(
      step('findOwnerSpawnedAbilityEntities', {
        saveToContextKey: 'Camille_Bat',
        abilityEntityIds: ['abilityentity_chr_0033_camille_normal_skill'],
      }),
      forEachContextTarget(
        'Camille_Bat',
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0033_camille_normal_skill_bateffect',
            target: 'currentAbilityEntity',
            inheritSourceSkillCastInfo: true,
          }),
        ),
      ),
    ),
    undefined,
    { alwaysNext: true },
  ),
  once(
    '\u0000endaxis-generated-identity:1',
    sequence(
      step('changeResourceByActionValue', {
        resource: 'sp',
        amount: { kind: 'blackboard', key: 'atb_ex' },
        coefficient: { kind: 'constant', value: 1 },
        recipient: 'team',
        spGainKind: 'gain',
        spGainSource: 'skill',
      }),
    ),
  ),
  step(
    'dealDamage',
    {
      damageType: 'heat',
      attackScale: { kind: 'blackboard', key: 'atk_scale_2_4' },
      tags: ['comboSkill'],
      features: ['canBreakWeakness'],
      stagger: { kind: 'blackboard', key: 'poise_2' },
    },
    '\u0000endaxis-generated-identity:2',
  ),
  branch(
    {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'talent_0', fallback: 0 },
      operator: 'greaterOrEqual',
      right: { kind: 'constant', value: 1 },
    },
    sequence(
      step('heal', {
        target: 'caster',
        alwaysNext: true,
        tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
        attribute: 'intellect',
        multiplier: { kind: 'blackboard', key: 'heal_sub_multi' },
        addition: { kind: 'blackboard', key: 'heal_base' },
      }),
    ),
    undefined,
    { alwaysNext: true },
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
          time: -0.000869751,
          value: 0.2992066,
          inTangent: 0.02832832,
          outTangent: 0.02832832,
          weightedMode: 0,
          inWeight: 0,
          outWeight: 0,
        },
        {
          time: 1,
          value: 1,
          inTangent: 2.332526,
          outTangent: 2.332526,
          weightedMode: 0,
          inWeight: 0,
          outWeight: 0,
        },
      ],
    },
    finishByAction: false,
    targets: ['enemy', 'caster'],
  }),
  branch(
    {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'usp_gained', fallback: 0 },
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
        key: 'usp_gained',
        operation: 'assign',
        value: { kind: 'constant', value: 1 },
      }),
    ),
  ),
);

const sharedActionSequence2: ActionSequenceDefinition = sequence(
  repeatEachTick(
    instantiateActionSequence(sharedActionSequence3, [
      '\u0000endaxis-generated-identity:0',
      '\u0000endaxis-generated-identity:1',
      '\u0000endaxis-generated-identity:2',
    ]),
    {
      nativeChanneling: {
        executeEachFrame: true,
        triggerIntervalSeconds: 0.033,
        maxCountPerTarget: 1,
        targetTriggerIntervalSeconds: 0.033,
      },
    },
  ),
);

export const camilleChr_0033_camille_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0033_camille_attack1',
    timelineBlockFrames: 12,
    naturalDurationFrames: 118,
    exclusiveFrame: 13,
    offsetRecordFrame: 5,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 29,
          input: 'basicAttack',
          targetSkillId: 'chr_0033_camille_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 12, endFrame: 29, skillIds: ['chr_0033_camille_attack2'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        4,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
              tags: ['normalAttack'],
            },
            'chr_0033_camille_attack1:/scheduledSequences/0/sequence/steps/0',
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
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.04 },
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
        10,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
              tags: ['normalAttack'],
            },
            'chr_0033_camille_attack1:/scheduledSequences/1/sequence/steps/0',
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
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.04 },
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
        12,
      ),
      scheduled(
        12,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0033_camille_attack2'] })),
        29,
      ),
    ],
    timelineContinuationSkillId: 'chr_0033_camille_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale_1: [0.125, 0.138, 0.15, 0.163, 0.175, 0.188, 0.2, 0.213, 0.225, 0.241, 0.259, 0.281],
    atk_scale_2: [0.125, 0.138, 0.15, 0.163, 0.175, 0.188, 0.2, 0.213, 0.225, 0.241, 0.259, 0.281],
    display_atk_scale: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56],
  },
);

export const camilleChr_0033_camille_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0033_camille_attack2',
    timelineBlockFrames: 15,
    naturalDurationFrames: 124,
    exclusiveFrame: 19,
    offsetRecordFrame: 10,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 34,
          input: 'basicAttack',
          targetSkillId: 'chr_0033_camille_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 15, endFrame: 34, skillIds: ['chr_0033_camille_attack3'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        10,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
              tags: ['normalAttack'],
            },
            'chr_0033_camille_attack2:/scheduledSequences/0/sequence/steps/0',
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
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.033 },
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
        14,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
              tags: ['normalAttack'],
            },
            'chr_0033_camille_attack2:/scheduledSequences/1/sequence/steps/0',
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
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.033 },
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
        16,
      ),
      scheduled(
        15,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0033_camille_attack3'] })),
        34,
      ),
    ],
    timelineContinuationSkillId: 'chr_0033_camille_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale_1: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.193, 0.208, 0.225],
    atk_scale_2: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.193, 0.208, 0.225],
    display_atk_scale: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.385, 0.415, 0.45],
  },
);

export const camilleChr_0033_camille_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0033_camille_attack3',
    timelineBlockFrames: 13,
    naturalDurationFrames: 130,
    exclusiveFrame: 19,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 30,
          input: 'basicAttack',
          targetSkillId: 'chr_0033_camille_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 13, endFrame: 30, skillIds: ['chr_0033_camille_attack4'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        7,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0033_camille_attack3:/scheduledSequences/0/sequence/steps/0/body/steps/0',
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
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.04 },
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
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 4,
                targetTriggerIntervalSeconds: 0.033,
              },
            },
          ),
        ),
        22,
      ),
      scheduled(
        13,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0033_camille_attack4'] })),
        30,
      ),
    ],
    timelineContinuationSkillId: 'chr_0033_camille_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.075, 0.083, 0.09, 0.098, 0.105, 0.113, 0.12, 0.128, 0.135, 0.144, 0.156, 0.169],
    display_atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
  },
);

export const camilleChr_0033_camille_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0033_camille_attack4',
    timelineBlockFrames: 22,
    naturalDurationFrames: 187,
    exclusiveFrame: 29,
    offsetRecordFrame: 12,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 34,
          input: 'basicAttack',
          targetSkillId: 'chr_0033_camille_attack5',
        },
      ],
      allowedNextSkills: [{ startFrame: 22, endFrame: 34, skillIds: ['chr_0033_camille_attack5'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        20,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_attack4.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0]:projectile_chr_0033_camille_attack4',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0033_camille_attack4.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0]:chr_0033_camille_attack4_projhit',
                { atk_scale_2: 0.1 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                      tags: ['normalAttack'],
                    },
                    'chr_0033_camille_attack4:/scheduledSequences/0/sequence/steps/0/body/steps/0/body/steps/0',
                  ),
                ),
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        21,
      ),
      scheduled(
        22,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_attack4.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0]:chr_0033_camille_attack4_projhit:delayed:2:0',
            { atk_scale_2: 0.1 },
            true,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalAttack'],
                },
                'chr_0033_camille_attack4:/scheduledSequences/1/sequence/steps/0/body/steps/0',
              ),
            ),
            undefined,
            { lifetime: 'execution', alwaysNext: true },
          ),
        ),
        23,
      ),
      scheduled(
        24,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_attack4.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0]:chr_0033_camille_attack4_projhit:delayed:4:1',
            { atk_scale_2: 0.1 },
            true,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalAttack'],
                },
                'chr_0033_camille_attack4:/scheduledSequences/2/sequence/steps/0/body/steps/0',
              ),
            ),
            undefined,
            { lifetime: 'execution', alwaysNext: true },
          ),
        ),
        25,
      ),
      scheduled(
        26,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_attack4.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0]:chr_0033_camille_attack4_projhit:delayed:6:2',
            { atk_scale_2: 0.1 },
            true,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalAttack'],
                },
                'chr_0033_camille_attack4:/scheduledSequences/3/sequence/steps/0/body/steps/0',
              ),
            ),
            undefined,
            { lifetime: 'execution', alwaysNext: true },
          ),
        ),
        27,
      ),
      scheduled(
        28,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_attack4.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0]:chr_0033_camille_attack4_projhit:delayed:8:3',
            { atk_scale_2: 0.1 },
            true,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalAttack'],
                },
                'chr_0033_camille_attack4:/scheduledSequences/4/sequence/steps/0/body/steps/0',
              ),
            ),
            undefined,
            { lifetime: 'execution', alwaysNext: true },
          ),
        ),
        29,
      ),
      scheduled(
        30,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_attack4.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0]:chr_0033_camille_attack4_projhit:delayed:10:4',
            { atk_scale_2: 0.1 },
            true,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalAttack'],
                },
                'chr_0033_camille_attack4:/scheduledSequences/5/sequence/steps/0/body/steps/0',
              ),
            ),
            undefined,
            { lifetime: 'execution', alwaysNext: true },
          ),
        ),
        31,
      ),
      scheduled(
        32,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_attack4.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0]:chr_0033_camille_attack4_projhit:delayed:12:5',
            { atk_scale_2: 0.1 },
            true,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalAttack'],
                },
                'chr_0033_camille_attack4:/scheduledSequences/6/sequence/steps/0/body/steps/0',
              ),
            ),
            undefined,
            { lifetime: 'execution', alwaysNext: true },
          ),
        ),
        33,
      ),
      scheduled(
        11,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
              tags: ['normalAttack'],
            },
            'chr_0033_camille_attack4:/scheduledSequences/7/sequence/steps/0',
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
            undefined,
            { alwaysNext: true },
          ),
        ),
        15,
      ),
      scheduled(
        22,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0033_camille_attack5'] })),
        34,
      ),
    ],
    timelineContinuationSkillId: 'chr_0033_camille_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale_1: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.385, 0.415, 0.45],
    atk_scale_2: [0.02, 0.022, 0.024, 0.026, 0.028, 0.03, 0.032, 0.034, 0.036, 0.039, 0.042, 0.045],
    display_atk_scale: [
      0.34, 0.374, 0.408, 0.442, 0.476, 0.51, 0.544, 0.578, 0.612, 0.655, 0.706, 0.765,
    ],
  },
);

export const camilleChr_0033_camille_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0033_camille_attack5',
    timelineBlockFrames: 42,
    naturalDurationFrames: 171,
    exclusiveFrame: 41,
    offsetRecordFrame: 21,
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        21,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'normalAttackLastCombo'],
              stagger: { kind: 'blackboard', key: 'poise' },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0033_camille_attack5:/scheduledSequences/0/sequence/steps/0',
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
            undefined,
            { alwaysNext: true },
          ),
        ),
        23,
      ),
      scheduled(
        12,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.08 },
            slot: 'TimeDilation/Layer/Entity/Frozen',
            priority: 50,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.2,
                  inTangent: 0.6,
                  outTangent: 0.6,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 0.8,
                  inTangent: 0.6,
                  outTangent: 0.6,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: ['caster'],
          }),
        ),
        15,
      ),
    ],
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 20,
    atk_scale: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.96, 1.04, 1.13],
    poise: 18,
  },
);

export const camilleChr_0033_camille_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0033_camille_power_attack',
    timelineBlockFrames: 39,
    naturalDurationFrames: 230,
    exclusiveFrame: 50,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 39,
          endFrame: 46,
          skillIds: [
            'chr_0033_camille_normal_skill',
            'chr_0033_camille_normal_skill_2',
            'chr_0033_camille_combo_skill',
          ],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        43,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.65,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0033_camille_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.3 },
                slot: 'TimeDilation/Layer/Entity/VisualAdjust',
                priority: 10,
                curve: {
                  kind: 'inline',
                  keys: [
                    {
                      time: 0,
                      value: 1.5,
                      inTangent: 0,
                      outTangent: 0,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 1.5,
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
              }),
              step('gainFinisherSp', { factor: 1, recipient: 'team' }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        44,
      ),
      scheduled(
        3,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[10]._sequenceActionData.actionData[0]:projectile_chr_0033_camille_power_attack',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[10]._sequenceActionData.actionData[0]:chr_0033_camille_power_attack_projhit_witheff',
                { atb: 0, atk_scale: 0.1 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      calculation: 'breakingAttack',
                      calculationMultiplier: 0.05,
                      tags: ['normalAttack', 'powerAttack'],
                    },
                    'chr_0033_camille_power_attack:/scheduledSequences/1/sequence/steps/0/body/steps/0/body/steps/0',
                  ),
                ),
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        4,
      ),
      scheduled(
        4,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[11]._sequenceActionData.actionData[0]:projectile_chr_0033_camille_power_attack_R_blue',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[11]._sequenceActionData.actionData[0]:chr_0033_camille_power_attack_projhit',
                { atb: 0, atk_scale: 0.1 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      calculation: 'breakingAttack',
                      calculationMultiplier: 0.05,
                      tags: ['normalAttack', 'powerAttack'],
                    },
                    'chr_0033_camille_power_attack:/scheduledSequences/2/sequence/steps/0/body/steps/0/body/steps/0',
                  ),
                ),
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        5,
      ),
      scheduled(
        6,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[12]._sequenceActionData.actionData[0]:projectile_chr_0033_camille_power_attack_R_red',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[12]._sequenceActionData.actionData[0]:chr_0033_camille_power_attack_projhit',
                { atb: 0, atk_scale: 0.1 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      calculation: 'breakingAttack',
                      calculationMultiplier: 0.05,
                      tags: ['normalAttack', 'powerAttack'],
                    },
                    'chr_0033_camille_power_attack:/scheduledSequences/3/sequence/steps/0/body/steps/0/body/steps/0',
                  ),
                ),
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
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
            'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[13]._sequenceActionData.actionData[0]:projectile_chr_0033_camille_power_attack_R_blue',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[13]._sequenceActionData.actionData[0]:chr_0033_camille_power_attack_projhit',
                { atb: 0, atk_scale: 0.1 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      calculation: 'breakingAttack',
                      calculationMultiplier: 0.05,
                      tags: ['normalAttack', 'powerAttack'],
                    },
                    'chr_0033_camille_power_attack:/scheduledSequences/4/sequence/steps/0/body/steps/0/body/steps/0',
                  ),
                ),
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        9,
      ),
      scheduled(
        3,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[14]._sequenceActionData.actionData[0]:projectile_chr_0033_camille_power_attack_L_red',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[14]._sequenceActionData.actionData[0]:chr_0033_camille_power_attack_projhit',
                { atb: 0, atk_scale: 0.1 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      calculation: 'breakingAttack',
                      calculationMultiplier: 0.05,
                      tags: ['normalAttack', 'powerAttack'],
                    },
                    'chr_0033_camille_power_attack:/scheduledSequences/5/sequence/steps/0/body/steps/0/body/steps/0',
                  ),
                ),
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        4,
      ),
      scheduled(
        5,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[15]._sequenceActionData.actionData[0]:projectile_chr_0033_camille_power_attack_L_blue',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[15]._sequenceActionData.actionData[0]:chr_0033_camille_power_attack_projhit',
                { atb: 0, atk_scale: 0.1 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      calculation: 'breakingAttack',
                      calculationMultiplier: 0.05,
                      tags: ['normalAttack', 'powerAttack'],
                    },
                    'chr_0033_camille_power_attack:/scheduledSequences/6/sequence/steps/0/body/steps/0/body/steps/0',
                  ),
                ),
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        6,
      ),
      scheduled(
        7,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[16]._sequenceActionData.actionData[0]:projectile_chr_0033_camille_power_attack_L_red',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0033_camille_power_attack.actionGroupData.timelineActions[16]._sequenceActionData.actionData[0]:chr_0033_camille_power_attack_projhit',
                { atb: 0, atk_scale: 0.1 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      calculation: 'breakingAttack',
                      calculationMultiplier: 0.05,
                      tags: ['normalAttack', 'powerAttack'],
                    },
                    'chr_0033_camille_power_attack:/scheduledSequences/7/sequence/steps/0/body/steps/0/body/steps/0',
                  ),
                ),
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        8,
      ),
      scheduled(
        40,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.1 },
                slot: 'TimeDilation/Layer/Entity/VisualAdjust',
                priority: 50,
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
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 1,
                      inTangent: 2,
                      outTangent: 2,
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
            undefined,
            { alwaysNext: true },
          ),
        ),
        43,
      ),
      scheduled(
        46,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'global',
                durationSeconds: { kind: 'constant', value: 0.25 },
                slot: 'TimeDilation/Layer/Entity/VisualAdjust',
                priority: 50,
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
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 1,
                      inTangent: 2,
                      outTangent: 2,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                  ],
                },
                finishByAction: false,
                ignoredTargets: [],
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        50,
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
        46,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const camilleChr_0033_camille_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0033_camille_plunging_attack_end',
    timelineBlockFrames: 16,
    naturalDurationFrames: 149,
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
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'plungingAttack'],
            },
            'chr_0033_camille_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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
    skillType: 'plungingAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
);

export const camilleChr_0033_camille_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0033_camille_normal_skill',
    timelineBlockFrames: 27,
    naturalDurationFrames: 192,
    exclusiveFrame: 26,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 18, endFrame: 34, skillIds: ['chr_0033_camille_combo_skill'] },
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
        0,
      ),
      scheduled(
        12,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0033_camille_normal_skill.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0033_camille_normal_skill',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0033_camille_normal_skill.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:chr_0033_camille_normal_skill_projhit',
                {
                  atk_scale: 0.1,
                  bat_atk_scale: 0.1,
                  bat_duration: 30,
                  poise: 10,
                  vulnerable_scale: 0,
                  weak_scale: 0.1,
                },
                true,
                sequence(
                  step('spawnAbilityEntity', {
                    abilityEntityId: 'abilityentity_chr_0033_camille_normal_skill',
                    childSkillId: 'chr_0033_camille_normal_skill_abilityrange_first',
                    inheritActionBlackboard: true,
                    dieWhenSourceDies: false,
                    target: 'enemy',
                    saveToContextKey: 'Camille_Bat',
                    blackboardAssignments: {
                      EntityBB_bat_duration: { kind: 'blackboard', key: 'bat_duration' },
                      EntityBB_bat_atk_scale: { kind: 'blackboard', key: 'bat_atk_scale' },
                      EntityBB_atk_scale: { kind: 'blackboard', key: 'atk_scale' },
                      EntityBB_poise: { kind: 'blackboard', key: 'poise' },
                      EntityBB_weak_scale: { kind: 'blackboard', key: 'weak_scale' },
                      EntityBB_vulnerable_scale: { kind: 'blackboard', key: 'vulnerable_scale' },
                    },
                  }),
                  step('modifyActionValue', {
                    key: 'EntityBB_bat_spawned',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  }),
                  forEachContextTarget(
                    'Camille_Bat',
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0033_camille_normal_skill_bateffect',
                        target: 'currentAbilityEntity',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  ),
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.15 },
                    slot: 'TimeDilation/Layer/Entity/HitStop',
                    priority: 10,
                    curve: { kind: 'named', key: 'common' },
                    finishByAction: false,
                    targets: ['enemy', 'caster'],
                  }),
                  step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
                ),
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        13,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb_obtain: 0,
    atk_scale: [0.89, 0.98, 1.07, 1.16, 1.25, 1.34, 1.43, 1.51, 1.6, 1.72, 1.85, 2],
    bat_atk_scale: [0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.93, 1],
    bat_duration: 45,
    cam_angle: 0,
    cam_duration: 0,
    input_angle: 0,
    poise: 10,
    vulnerable_scale: [0.05, 0.05, 0.05, 0.055, 0.055, 0.055, 0.06, 0.06, 0.06, 0.065, 0.065, 0.07],
    weak_scale: [0.05, 0.05, 0.05, 0.055, 0.055, 0.055, 0.06, 0.06, 0.06, 0.065, 0.065, 0.07],
  },
);

export const camilleChr_0033_camille_normal_skill_2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0033_camille_normal_skill_2',
    timelineBlockFrames: 87,
    naturalDurationFrames: 213,
    exclusiveFrame: 86,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 79,
          endFrame: 127,
          skillIds: ['chr_0033_camille_normal_skill', 'chr_0033_camille_normal_skill_2'],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0033_camille_ult_henshin_state'],
            reason: 'early',
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
          }),
        ),
        24,
      ),
      scheduled(
        52,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.5 },
            slot: 'unassigned',
            priority: 100,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
          }),
        ),
        67,
      ),
      scheduled(
        20,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2_1' },
                  tags: ['comboSkill'],
                  features: ['canBreakWeakness'],
                },
                'chr_0033_camille_combo_skill_2:/scheduledSequences/3/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.06 },
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
        33,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0033_camille_combo_skill_2.actionGroupData.timelineActions[40]._sequenceActionData.actionData[0].actionOnTick.actionData[1]',
          'chr_0033_camille_combo_skill_2:/scheduledSequences/4/sequence/steps/0/body/steps/1',
        ]),
        36,
      ),
      scheduled(
        49,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2_3' },
                  tags: ['comboSkill'],
                  features: ['canBreakWeakness'],
                },
                'chr_0033_camille_combo_skill_2:/scheduledSequences/5/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.1 },
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
        51,
      ),
      scheduled(
        70,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0033_camille_combo_skill_2.actionGroupData.timelineActions[42]._sequenceActionData.actionData[0].actionOnTick.actionData[1].succeedActions.actionData[0]',
          'SkillData.chr_0033_camille_combo_skill_2.actionGroupData.timelineActions[42]._sequenceActionData.actionData[0].actionOnTick.actionData[3]',
          'chr_0033_camille_combo_skill_2:/scheduledSequences/6/sequence/steps/0/body/steps/3',
        ]),
        73,
      ),
    ],
    costs: [{ resource: 'sp', value: 40 }],
    cooldownFrames: 90,
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
    atb_ex: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
    atk_scale_1_1: 0.1,
    atk_scale_1_2: 0.1,
    atk_scale_1_3: 0.1,
    atk_scale_2_1: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_2_2: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_2_3: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_2_4: [1.42, 1.57, 1.71, 1.85, 1.99, 2.14, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2],
    combo_duration: 15,
    heal_base: 0,
    heal_sub_multi: 0,
    poise: 10,
    poise_2: 10,
    talent_0: 0,
    usp: 10,
    usp_gained: 0,
  },
);

export const camilleChr_0033_camille_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0033_camille_combo_skill',
    timelineBlockFrames: 64,
    naturalDurationFrames: 191,
    exclusiveFrame: 63,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 51,
          endFrame: 63,
          skillIds: ['chr_0033_camille_normal_skill', 'chr_0033_camille_normal_skill_2'],
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
      scheduled(
        19,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_1_1' },
                  tags: ['comboSkill'],
                  features: ['canBreakWeakness'],
                },
                'chr_0033_camille_combo_skill:/scheduledSequences/1/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.06 },
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
        21,
      ),
      scheduled(
        27,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_1_2' },
                  tags: ['comboSkill'],
                  features: ['canBreakWeakness'],
                },
                'chr_0033_camille_combo_skill:/scheduledSequences/2/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.1 },
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
        29,
      ),
      scheduled(
        47,
        sequence(
          repeatEachTick(
            sequence(
              branch(
                {
                  kind: 'entityTagMatch',
                  target: 'enemy',
                  tagQueryType: 'hasAny',
                  tags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
                },
                sequence(
                  step('findOwnerSpawnedAbilityEntities', {
                    saveToContextKey: 'Camille_Bat',
                    abilityEntityIds: ['abilityentity_chr_0033_camille_normal_skill'],
                  }),
                  forEachContextTarget(
                    'Camille_Bat',
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0033_camille_normal_skill_bateffect',
                        target: 'currentAbilityEntity',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  ),
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'talent_0', fallback: 0 },
                      operator: 'greaterOrEqual',
                      right: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('createGlobalBuff', {
                        globalBuffId: 'global_buff_combo_trigger',
                        definition: {
                          stackingType: 'stack',
                          maxStackCount: 4,
                          durationSeconds: { blackboardKey: 'duration' },
                          blackboard: { duration: 0, imbue_scale: 0 },
                          children: [
                            {
                              buffId: 'buff_common_affixes_combo_trigger',
                              blackboardAssignments: {
                                imbue_scale: { kind: 'blackboard', key: 'imbue_scale' },
                              },
                            },
                          ],
                        },
                        source: 'caster',
                        blackboardAssignments: {
                          duration: { kind: 'blackboard', key: 'combo_duration' },
                        },
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
                  ),
                ),
                undefined,
                { alwaysNext: true },
              ),
              once(
                'SkillData.chr_0033_camille_combo_skill.actionGroupData.timelineActions[27]._sequenceActionData.actionData[0].actionOnTick.actionData[2]',
                sequence(
                  step('changeResourceByActionValue', {
                    resource: 'sp',
                    amount: { kind: 'blackboard', key: 'atb' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'team',
                    spGainKind: 'gain',
                    spGainSource: 'skill',
                  }),
                ),
              ),
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_1_3' },
                  tags: ['comboSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                'chr_0033_camille_combo_skill:/scheduledSequences/3/sequence/steps/0/body/steps/2',
              ),
              branch(
                {
                  kind: 'entityTagMatch',
                  target: 'enemy',
                  tagQueryType: 'hasAny',
                  tags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
                },
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'talent_0', fallback: 0 },
                      operator: 'greaterOrEqual',
                      right: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('heal', {
                        target: 'caster',
                        alwaysNext: true,
                        tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
                        attribute: 'intellect',
                        multiplier: { kind: 'blackboard', key: 'heal_sub_multi' },
                        addition: { kind: 'blackboard', key: 'heal_base' },
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
                  ),
                ),
                undefined,
                { alwaysNext: true },
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.08 },
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
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'usp_gained', fallback: 0 },
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
                    key: 'usp_gained',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  }),
                ),
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
        50,
      ),
    ],
    smartTarget: 'enemy',
    cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 570, 570, 570, 540],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atb: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
    atb_ex: 15,
    atk_scale_1_1: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_1_2: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_1_3: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    atk_scale_2_1: 0.1,
    atk_scale_2_2: 0.1,
    atk_scale_2_3: 0.1,
    atk_scale_2_4: 0.1,
    combo_duration: 15,
    heal_base: 0,
    heal_sub_multi: 0,
    poise: 10,
    talent_0: 0,
    usp: 10,
    usp_gained: 0,
  },
);

export const camilleChr_0033_camille_combo_skill_2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0033_camille_combo_skill_2',
    timelineBlockFrames: 87,
    naturalDurationFrames: 213,
    exclusiveFrame: 86,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 79,
          endFrame: 127,
          skillIds: ['chr_0033_camille_normal_skill', 'chr_0033_camille_normal_skill_2'],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0033_camille_ult_henshin_state'],
            reason: 'early',
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
          }),
        ),
        24,
      ),
      scheduled(
        52,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.5 },
            slot: 'unassigned',
            priority: 100,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
          }),
        ),
        67,
      ),
      scheduled(
        20,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2_1' },
                  tags: ['comboSkill'],
                  features: ['canBreakWeakness'],
                },
                'chr_0033_camille_combo_skill_2:/scheduledSequences/3/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.06 },
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
        33,
        instantiateActionSequence(sharedActionSequence1, [
          'SkillData.chr_0033_camille_combo_skill_2.actionGroupData.timelineActions[40]._sequenceActionData.actionData[0].actionOnTick.actionData[1]',
          'chr_0033_camille_combo_skill_2:/scheduledSequences/4/sequence/steps/0/body/steps/1',
        ]),
        36,
      ),
      scheduled(
        49,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2_3' },
                  tags: ['comboSkill'],
                  features: ['canBreakWeakness'],
                },
                'chr_0033_camille_combo_skill_2:/scheduledSequences/5/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.1 },
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
        51,
      ),
      scheduled(
        70,
        instantiateActionSequence(sharedActionSequence2, [
          'SkillData.chr_0033_camille_combo_skill_2.actionGroupData.timelineActions[42]._sequenceActionData.actionData[0].actionOnTick.actionData[1].succeedActions.actionData[0]',
          'SkillData.chr_0033_camille_combo_skill_2.actionGroupData.timelineActions[42]._sequenceActionData.actionData[0].actionOnTick.actionData[3]',
          'chr_0033_camille_combo_skill_2:/scheduledSequences/6/sequence/steps/0/body/steps/3',
        ]),
        73,
      ),
    ],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
    atb_ex: [16, 16, 16, 16, 16, 16, 18, 18, 18, 20, 20, 20],
    atk_scale_1_1: 0.1,
    atk_scale_1_2: 0.1,
    atk_scale_1_3: 0.1,
    atk_scale_2_1: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_2_2: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_2_3: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_2_4: [1.42, 1.57, 1.71, 1.85, 1.99, 2.14, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2],
    combo_duration: 15,
    heal_base: 0,
    heal_sub_multi: 0,
    poise: 10,
    poise_2: 10,
    talent_0: 0,
    usp: 10,
    usp_gained: 0,
  },
);

export const camilleChr_0033_camille_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0033_camille_ultimate_skill',
    timelineBlockFrames: 134,
    naturalDurationFrames: 236,
    exclusiveFrame: 133,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 125,
          endFrame: 150,
          skillIds: [
            'chr_0033_camille_normal_skill',
            'chr_0033_camille_normal_skill_2',
            'chr_0033_camille_combo_skill',
          ],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(),
            sequence(
              step('findCharacterTeamTargets', {
                saveToContextKey: 'mainChar',
                selection: { kind: 'controlledOperator' },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        2,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 2.77 },
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
        69,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 69),
      scheduled(
        75,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                },
                'chr_0033_camille_ultimate_skill:/scheduledSequences/3/sequence/steps/0/body/steps/0',
              ),
            ),
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 7,
                targetTriggerIntervalSeconds: 0.05,
              },
            },
          ),
        ),
        91,
      ),
      scheduled(
        104,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                },
                'chr_0033_camille_ultimate_skill:/scheduledSequences/4/sequence/steps/0/body/steps/0',
              ),
            ),
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 1,
                targetTriggerIntervalSeconds: -1,
              },
            },
          ),
        ),
        108,
      ),
      scheduled(
        120,
        sequence(
          repeatEachTick(
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'enemy',
                  buffIds: ['buff_chr_0033_camille_ult_hit'],
                  operator: 'lessOrEqual',
                  value: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('applyElementalInfliction', { element: 'heat', isExtra: false }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0033_camille_ult_hit',
                    target: 'enemy',
                    inheritSourceSkillCastInfo: true,
                    asChildBuff: true,
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              once(
                'SkillData.chr_0033_camille_ultimate_skill.actionGroupData.timelineActions[27]._sequenceActionData.actionData[0].actionOnTick.actionData[1]',
                sequence(
                  step('changeResourceByActionValue', {
                    resource: 'sp',
                    amount: { kind: 'blackboard', key: 'atb' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'team',
                    spGainKind: 'gain',
                    spGainSource: 'skill',
                  }),
                ),
              ),
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_3' },
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                'chr_0033_camille_ultimate_skill:/scheduledSequences/5/sequence/steps/0/body/steps/2',
              ),
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.5 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: {
                  kind: 'inline',
                  keys: [
                    {
                      time: -0.000869751,
                      value: 0.2992066,
                      inTangent: 0.02832832,
                      outTangent: 0.02832832,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 1,
                      inTangent: 2.332526,
                      outTangent: 2.332526,
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
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 1,
                targetTriggerIntervalSeconds: -1,
              },
            },
          ),
        ),
        124,
      ),
      scheduled(
        118,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0033_camille_ult_henshin_state',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'duration' },
          }),
        ),
        119,
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
        133,
      ),
    ],
    cooldownFrames: 600,
    costs: [{ resource: 'ultimateEnergy', value: 130 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atb: [32, 32, 32, 32, 32, 32, 32, 32, 36, 36, 36, 40],
    atk_scale_1: [0.178, 0.196, 0.213, 0.231, 0.249, 0.267, 0.284, 0.302, 0.32, 0.342, 0.369, 0.4],
    atk_scale_2: [0.533, 0.587, 0.64, 0.693, 0.747, 0.8, 0.853, 0.907, 0.96, 1.027, 1.106, 1.2],
    atk_scale_3: [
      0.889, 0.978, 1.067, 1.156, 1.245, 1.334, 1.423, 1.512, 1.601, 1.712, 1.845, 2.001,
    ],
    duration: 15,
    poise: 15,
  },
);

export const camilleCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const camille: OperatorDefinition = {
  slug: 'camille',
  gameId: 'CAMILLE',
  skillDisplayNameKeys: { chr_0033_camille_normal_skill_2: 'skillNames.pursuit' },
  rarity: 6,
  weaponType: 'polearm',
  element: 'heat',
  role: 'vanguard',
  mainAttribute: 'agility',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [13, 32, 52, 72, 92, 102],
    agility: [17, 48, 80, 112, 144, 160],
    intellect: [14, 38, 64, 90, 116, 129],
    will: [11, 28, 46, 64, 82, 92],
    baseAttack: [30, 91, 155, 219, 283, 315],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        camilleChr_0033_camille_attack1,
        camilleChr_0033_camille_attack2,
        camilleChr_0033_camille_attack3,
        camilleChr_0033_camille_attack4,
        camilleChr_0033_camille_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: camilleChr_0033_camille_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: camilleChr_0033_camille_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: camilleChr_0033_camille_normal_skill,
      replacementSkillPlacements: { chr_0033_camille_normal_skill_2: 'standard' },
      routedReplacementSkills: [
        {
          skill: camilleChr_0033_camille_normal_skill_2,
          skillType: 'comboSkill',
          levelSource: 'comboSkill',
          executionSkillGroupKey: 'comboSkill',
          executionSkillKey: 'chr_0033_camille_combo_skill_2',
        },
      ],
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: camilleChr_0033_camille_combo_skill,
      replacementSkills: [camilleChr_0033_camille_combo_skill_2],
      replacementSkillPlacements: { chr_0033_camille_combo_skill_2: 'internal' },
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: camilleChr_0033_camille_ultimate_skill,
    },
  ],
  dodgeSkill: camilleCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0033_camille_normal_skill',
      replacementSkillKeys: ['chr_0033_camille_normal_skill_2'],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0033_camille_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0033_camille_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0033_camille_attack1',
        'chr_0033_camille_attack2',
        'chr_0033_camille_attack3',
        'chr_0033_camille_attack4',
        'chr_0033_camille_attack5',
        'chr_0033_camille_plunging_attack_end',
        'chr_0033_camille_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0033_camille_attack1',
        'chr_0033_camille_attack2',
        'chr_0033_camille_attack3',
        'chr_0033_camille_attack4',
        'chr_0033_camille_attack5',
      ],
      defaultSkillKey: 'chr_0033_camille_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0033_camille_combo_skill',
      event: 'buffAbsorbed',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'eventBuffTagsMatch',
            match: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
          },
          sequence(),
        ),
      ),
    },
    {
      key: 'native-combo:1',
      skillKey: 'chr_0033_camille_combo_skill',
      event: 'buffConsumed',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'eventBuffTagsMatch',
            match: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
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
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'talent_0',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'combo_duration',
          operation: 'assign',
          value: [15, 15],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'heal_base',
          operation: 'assign',
          value: [30, 60],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'heal_sub_multi',
          operation: 'assign',
          value: [0.15, 0.3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'talent_0',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'combo_duration',
          operation: 'assign',
          value: [15, 15],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'heal_base',
          operation: 'assign',
          value: [30, 60],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'heal_sub_multi',
          operation: 'assign',
          value: [0.15, 0.3],
        },
      ],
    },
    {
      levels: 2,
      passiveSkills: [
        {
          key: 'chr_0033_camille_passive_talent1',
          blackboard: { atk_up: [0.02, 0.04], duration: [40, 40], teammate_rate: [0.25, 0.25] },
          enableSequence: sequence(),
          abilityEventResponses: [
            {
              event: 'receiveHeal',
              priority: 0,
              sequence: sequence(
                step('calculateActionValue', {
                  key: 'atk_up_teammate',
                  operation: 'multiply',
                  left: { kind: 'blackboard', key: 'atk_up' },
                  right: { kind: 'blackboard', key: 'teammate_rate' },
                }),
                branch(
                  {
                    kind: 'eventHealTagsMatch',
                    match: 'hasAny',
                    tags: [
                      'Skill/Character/Common/Heal/NormalSkillHeal',
                      'Skill/Character/Common/Heal/ComboSkillHeal',
                      'Skill/Character/Common/Heal/UltimateSkillHeal',
                    ],
                  },
                  sequence(
                    step('applyBuff', {
                      buffId: 'buff_chr_0033_camille_talent1_atkup',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration' },
                    }),
                    step('applyBuff', {
                      buffId: 'buff_chr_0033_camille_talent1_atkup',
                      target: 'partyExceptCaster',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        atk_up: 'atk_up_teammate',
                        duration: 'duration',
                      },
                    }),
                    branch(
                      { kind: 'eventOverheal' },
                      sequence(
                        step('applyBuff', {
                          buffId: 'buff_chr_0033_camille_talent1_atkup',
                          target: 'caster',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'duration' },
                        }),
                        step('applyBuff', {
                          buffId: 'buff_chr_0033_camille_talent1_atkup',
                          target: 'partyExceptCaster',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: {
                            atk_up: 'atk_up_teammate',
                            duration: 'duration',
                          },
                        }),
                      ),
                    ),
                  ),
                ),
              ),
            },
          ],
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
          skillKey: 'chr_0033_camille_normal_skill',
          blackboardKey: 'weak_scale',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0033_camille_normal_skill',
          blackboardKey: 'vulnerable_scale',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0033_camille_normal_skill',
          blackboardKey: 'bat_duration',
          operation: 'add',
          value: 15,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 20 },
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 20 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'addSkillCooldownFrames',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          frames: -60,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'atk_scale_1_1',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'atk_scale_1_2',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'atk_scale_1_3',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atk_scale_2_1',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atk_scale_2_2',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atk_scale_2_3',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atk_scale_2_4',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill',
          blackboardKey: 'atb',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atb',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          skillKey: 'chr_0033_camille_combo_skill_2',
          blackboardKey: 'atb_ex',
          operation: 'multiply',
          value: 1.15,
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
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0033_camille_passive_talent1',
          blackboardKey: 'atk_up',
          operation: 'add',
          value: 0.06,
        },
      ],
    },
  ],
  entityBlackboard: {
    EntityBB_bat_spawned: 0,
    EntityBB_henshin: 0,
    EntityBB_trigger_count: 0,
    EntityBB_ult_combo_count: 0,
  },
  passiveSkills: [
    {
      key: 'chr_0033_camille_passive_listen_normal_skill',
      blackboard: { atb: 15 },
      enableSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0033_camille_combo_2_type',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
        }),
      ),
      abilityEventResponses: [
        {
          event: 'abilityEntityFinished',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'entityTagMatch',
                target: 'actionInputTarget',
                tagQueryType: 'hasAny',
                tags: ['Skill/Character/chr_0033_camille/NormalSkillBat'],
              },
              sequence(
                step('modifyActionValue', {
                  key: 'EntityBB_bat_spawned',
                  operation: 'assign',
                  value: { kind: 'constant', value: 0 },
                }),
                step('finishBuffsById', {
                  target: 'caster',
                  buffIds: ['buff_chr_0033_camille_normal_skill_bat_duration_icon'],
                  reason: 'other',
                }),
              ),
            ),
          ),
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0033_camille_cast_combo2: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: { blackboardKey: 'hit_cntmax' },
      durationSeconds: 0.1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('castSkillDuringAction', {
            skillId: 'chr_0033_camille_combo_skill_2',
            target: 'enemy',
            skipApplyCost: false,
            inheritSourceSkillCastInfo: false,
          }),
        ),
      },
    },
    buff_chr_0033_camille_combo_2_type: {
      stackingType: 'unique',
      priority: 1,
      maxStackCount: { blackboardKey: 'max_stack' },
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('changeNativeSkillType', {
            targetSkillKey: 'chr_0033_camille_combo_skill_2',
            nativeSkillType: 'comboSkill',
          }),
        ),
      },
    },
    buff_chr_0033_camille_normal_skill_bat_checktarget: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      triggerIntervalSeconds: 0.5,
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
            sequence(step('finishCurrentAbilityEntity', {})),
            undefined,
            { alwaysNext: true },
          ),
        ),
      },
    },
    buff_chr_0033_camille_normal_skill_bat_duration_icon: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 999,
      presentation: {
        visible: true,
        iconId: 'icon_battle_camille_normal_skill_bat',
        iconPath: '/icons/icon_battle_camille_normal_skill_bat.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordBuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { bat_duration: 30 },
      attributeModifiers: [],
    },
    buff_chr_0033_camille_normal_skill_bateffect: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 3,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0033_camille_normal_skill_delay_damage: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 99,
      durationSeconds: 0.4,
      applyTags: [],
      extendTags: [],
      blackboard: { bat_atk_scale: 5, combo_duration: 20 },
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'bat_atk_scale' },
              tags: ['normalSkill'],
            },
            'buff_chr_0033_camille_normal_skill_delay_damage:/lifecycleSequences/finish/steps/0',
          ),
        ),
      },
    },
    buff_chr_0033_camille_normal_skill_listen_target_dead: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0033_camille_normal_skill_reset_target: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 0.1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale: 0.1, poise: 10, remain_time: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('modifyActionValue', {
            key: 'EntityBB_retargeting',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          }),
        ),
        finish: sequence(
          step('mergeContextTargets', {
            saveToContextKey: 'src',
            sources: [{ kind: 'abilitySystemSource', owner: 'actionOwner' }],
          }),
          step('finishCurrentAbilityEntity', {}),
        ),
      },
    },
    buff_chr_0033_camille_normal_skill_weak: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      presentation: {
        visible: true,
        iconId: 'icon_battle_camille_normal_skill_bat',
        iconPath: '/icons/icon_battle_camille_normal_skill_bat.webp',
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
      applyTags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
      extendTags: [],
      blackboard: { duration: 60, vulnerable_scale: 0.1, weak_scale: 0.1 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_weak',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'weak_scale' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_chr_0033_camille_normal_skill_weak_child',
            },
          }),
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_fire',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'vulnerable_scale' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_chr_0033_camille_normal_skill_weak_child',
            },
          }),
        ),
      },
    },
    buff_chr_0033_camille_normal_skill_weak_child: {
      stackingType: 'refresh',
      priority: { blackboardKey: 'rate' },
      maxStackCount: 0,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 60 },
      attributeModifiers: [],
    },
    buff_chr_0033_camille_talent1_atkup: {
      stackingType: 'stack',
      priority: 1,
      maxStackCount: { blackboardKey: 'max_stack' },
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_fire_dmg_up',
        iconPath: '/icons/icon_battle_fire_dmg_up.webp',
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
      blackboard: { atk_up: 0, duration: 0, max_stack: 5 },
      attributeModifiers: [
        {
          attribute: 'heatDamageIncrease',
          slot: 'baseAddition',
          value: { blackboardKey: 'atk_up' },
        },
      ],
    },
    buff_chr_0033_camille_ult_henshin_state: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_camille_ult_state',
        iconPath: '/icons/icon_battle_camille_ult_state.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 30 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('modifyActionValue', {
            key: 'EntityBB_henshin',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          }),
          step('modifyActionValue', {
            key: 'EntityBB_ult_combo_count',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
        finish: sequence(
          step('modifyActionValue', {
            key: 'EntityBB_henshin',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          step('modifyActionValue', {
            key: 'EntityBB_ult_combo_count',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
      },
      skillSlotReplacements: [
        {
          skillGroupKey: 'battleSkill',
          targetSkillKey: 'chr_0033_camille_normal_skill_2',
          revertedSkillKey: 'chr_0033_camille_normal_skill',
          inheritOriginSkillCooldownProgress: false,
        },
      ],
    },
    buff_chr_0033_camille_ult_hit: {
      stackingType: 'unique',
      priority: 1,
      maxStackCount: { blackboardKey: 'max_stack' },
      durationSeconds: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0033_camille_normal_skill: {
      bornTags: [
        'Immune',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0033_camille/NormalSkillBat',
      ],
      blackboard: {
        EntityBB_atk_scale: 0,
        EntityBB_bat_atk_scale: 0,
        EntityBB_bat_duration: 60,
        EntityBB_combo_duration: 0,
        EntityBB_poise: 0,
        EntityBB_retargeting: 0,
        EntityBB_vulnerable_scale: 0,
        EntityBB_weak_scale: 0,
      },
      lifetime: {
        kind: 'limited',
        durationSeconds: { blackboardKey: 'EntityBB_bat_duration', fallback: 5 },
      },
      maxStackingCount: 1,
      childSkills: {
        chr_0033_camille_normal_skill_abilityrange_first: {
          skillId: 'chr_0033_camille_normal_skill_abilityrange_first',
          blackboard: { atk_scale: 0.1, obtain_count: 0, poise: 10, weak_scale: 0.2 },
          scheduledSequences: [
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
              36,
            ),
            scheduled(
              0,
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0033_camille_normal_skill_weak',
                  target: 'enemy',
                  inheritSourceSkillCastInfo: true,
                  iconDurationSource: { kind: 'actionOwnerAbilityEntity' },
                  finishByAction: true,
                  asChildBuff: true,
                  copiedBlackboardAssignments: {
                    weak_scale: 'EntityBB_weak_scale',
                    vulnerable_scale: 'EntityBB_vulnerable_scale',
                    duration: 'EntityBB_bat_duration',
                  },
                }),
              ),
              2000,
            ),
            scheduled(
              0,
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0033_camille_normal_skill_listen_target_dead',
                  target: 'enemy',
                  source: 'currentAbilityEntity',
                  inheritSourceSkillCastInfo: true,
                  finishByAction: true,
                  asChildBuff: true,
                }),
              ),
              2000,
            ),
            scheduled(
              3,
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0033_camille_normal_skill_bat_duration_icon',
                  target: 'caster',
                  inheritSourceSkillCastInfo: true,
                  iconDurationSource: { kind: 'actionOwnerAbilityEntity' },
                  copiedBlackboardAssignments: { bat_duration: 'EntityBB_bat_duration' },
                }),
              ),
              6,
            ),
            scheduled(
              0,
              sequence(
                step('applyElementalInfliction', { element: 'heat', isExtra: false }),
                step(
                  'dealDamage',
                  {
                    damageType: 'heat',
                    attackScale: { kind: 'blackboard', key: 'EntityBB_atk_scale' },
                    tags: ['normalSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'blackboard', key: 'EntityBB_poise' },
                  },
                  'abilityentity_chr_0033_camille_normal_skill:chr_0033_camille_normal_skill_abilityrange_first|chr_0033_camille_normal_skill_abilityrange:/childSkills/chr_0033_camille_normal_skill_abilityrange_first/scheduledSequences/4/sequence/steps/1',
                ),
              ),
              1,
            ),
          ],
        },
        chr_0033_camille_normal_skill_abilityrange: {
          skillId: 'chr_0033_camille_normal_skill_abilityrange',
          blackboard: { atk_scale: 0.1, obtain_count: 0, poise: 10, weak_scale: 0.2 },
          scheduledSequences: [
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
              36,
            ),
            scheduled(
              0,
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0033_camille_normal_skill_weak',
                  target: 'enemy',
                  inheritSourceSkillCastInfo: true,
                  iconDurationSource: { kind: 'actionOwnerAbilityEntity' },
                  finishByAction: true,
                  asChildBuff: true,
                  copiedBlackboardAssignments: {
                    weak_scale: 'EntityBB_weak_scale',
                    vulnerable_scale: 'EntityBB_vulnerable_scale',
                    duration: 'EntityBB_bat_duration',
                  },
                }),
              ),
              2000,
            ),
            scheduled(
              0,
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0033_camille_normal_skill_listen_target_dead',
                  target: 'enemy',
                  source: 'currentAbilityEntity',
                  inheritSourceSkillCastInfo: true,
                  finishByAction: true,
                  asChildBuff: true,
                }),
              ),
              2000,
            ),
            scheduled(
              0,
              sequence(step('applyElementalInfliction', { element: 'heat', isExtra: false })),
              3,
            ),
            scheduled(
              0,
              sequence(
                step(
                  'dealDamage',
                  {
                    damageType: 'heat',
                    attackScale: { kind: 'blackboard', key: 'EntityBB_atk_scale' },
                    tags: ['normalSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'blackboard', key: 'EntityBB_poise' },
                  },
                  'abilityentity_chr_0033_camille_normal_skill:chr_0033_camille_normal_skill_abilityrange_first|chr_0033_camille_normal_skill_abilityrange:/childSkills/chr_0033_camille_normal_skill_abilityrange/scheduledSequences/4/sequence/steps/0',
                ),
              ),
              3,
            ),
          ],
        },
      },
      passiveSkills: [
        {
          key: 'chr_0033_camille_passive_normal_skill_ability_entity',
          blackboard: { atb: 15 },
          enableSequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0033_camille_normal_skill_bat_checktarget',
              target: 'currentAbilityEntity',
              source: 'currentAbilityEntity',
              inheritSourceSkillCastInfo: false,
            }),
          ),
          abilityEventResponses: [
            {
              event: 'addedBuff',
              priority: 0,
              sequence: sequence(
                branch(
                  {
                    kind: 'eventBuffIdMatch',
                    buffIds: ['buff_chr_0033_camille_normal_skill_bateffect'],
                  },
                  sequence(
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'currentAbilityEntity',
                        buffIds: ['buff_chr_0033_camille_normal_skill_bateffect'],
                        operator: 'greaterOrEqual',
                        value: { kind: 'constant', value: 2 },
                      },
                      sequence(
                        branch(
                          {
                            kind: 'entityTagMatch',
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            tags: ['Skill/Character/chr_0033_camille/NormalSkillBatTarget'],
                          },
                          sequence(
                            step('mergeContextTargets', {
                              saveToContextKey: 'tar',
                              sources: [{ kind: 'target', target: 'enemy' }],
                            }),
                          ),
                          sequence(
                            step('mergeContextTargets', { saveToContextKey: 'tar', sources: [] }),
                          ),
                        ),
                        step('mergeContextTargets', {
                          saveToContextKey: 'src',
                          sources: [{ kind: 'abilitySystemSource', owner: 'actionOwner' }],
                        }),
                        forEachContextTarget(
                          'tar',
                          sequence(
                            step('applyBuff', {
                              buffId: 'buff_chr_0033_camille_normal_skill_delay_damage',
                              target: 'enemy',
                              sourceContextKey: 'src',
                              inheritSourceSkillCastInfo: true,
                              copiedBlackboardAssignments: {
                                bat_atk_scale: 'EntityBB_bat_atk_scale',
                                combo_duration: 'EntityBB_combo_duration',
                              },
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
      ],
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default camille;
