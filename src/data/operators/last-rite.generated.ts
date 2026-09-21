/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type {
  ActionSequenceDefinition,
  OperatorDefinition,
  SkillDefinition,
} from '../../core/game-data/operatorDefinition';
import {
  branch,
  forEachTarget,
  instantiateActionSequence,
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
      branch(
        {
          kind: 'actionValueCompare',
          left: { kind: 'blackboard', key: 'talent_2', fallback: 0 },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              instantAttributeModifiers: [
                {
                  targetSide: 'defender',
                  attribute: 'cryoVulnerabilityIncrease',
                  slot: 'baseFinalMultiplier',
                  value: { kind: 'blackboard', key: 'rate' },
                  attributeTiming: 'runtime',
                },
              ],
              stagger: { kind: 'blackboard', key: 'poise1' },
            },
            '\u0000endaxis-generated-identity:0',
          ),
        ),
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise1' },
            },
            '\u0000endaxis-generated-identity:1',
          ),
        ),
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

export const lastRiteChr_0026_lastrite_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0026_lastrite_attack1',
    timelineBlockFrames: 20,
    naturalDurationFrames: 171,
    exclusiveFrame: 25,
    offsetRecordFrame: 12,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 35,
          input: 'basicAttack',
          targetSkillId: 'chr_0026_lastrite_attack2',
        },
      ],
      allowedNextSkills: [
        { startFrame: 20, endFrame: 35, skillIds: ['chr_0026_lastrite_attack2'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        12,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0026_lastrite_attack1:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.2 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_normal_attack' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
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
        13,
      ),
      scheduled(
        20,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0026_lastrite_attack2'] })),
        35,
      ),
    ],
    timelineContinuationSkillId: 'chr_0026_lastrite_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
    env_dmg: 20,
  },
);

export const lastRiteChr_0026_lastrite_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0026_lastrite_attack2',
    timelineBlockFrames: 29,
    naturalDurationFrames: 175,
    exclusiveFrame: 34,
    offsetRecordFrame: 10,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 44,
          input: 'basicAttack',
          targetSkillId: 'chr_0026_lastrite_attack3',
        },
      ],
      allowedNextSkills: [
        { startFrame: 29, endFrame: 44, skillIds: ['chr_0026_lastrite_attack3'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        10,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0026_lastrite_attack2:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.067 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_normal_attack' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
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
        11,
      ),
      scheduled(
        24,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0026_lastrite_attack2:/scheduledSequences/1/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.067 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_normal_attack' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
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
        25,
      ),
      scheduled(
        29,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0026_lastrite_attack3'] })),
        44,
      ),
    ],
    timelineContinuationSkillId: 'chr_0026_lastrite_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62],
    env_dmg: 12.5,
    display_atk_scale: [0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24],
  },
);

export const lastRiteChr_0026_lastrite_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0026_lastrite_attack3',
    timelineBlockFrames: 36,
    naturalDurationFrames: 230,
    exclusiveFrame: 47,
    offsetRecordFrame: 29,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 48,
          input: 'basicAttack',
          targetSkillId: 'chr_0026_lastrite_attack4',
        },
      ],
      allowedNextSkills: [
        { startFrame: 36, endFrame: 48, skillIds: ['chr_0026_lastrite_attack4'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        9,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0026_lastrite_attack3:/scheduledSequences/0/sequence/steps/0',
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
                targets: ['enemy', 'caster'],
              }),
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
        10,
      ),
      scheduled(
        27,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0026_lastrite_attack3:/scheduledSequences/1/sequence/steps/0',
          ),
        ),
        28,
      ),
      scheduled(
        26,
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
                      time: 0,
                      value: 0.3,
                      inTangent: 0.1907342,
                      outTangent: 0.1907342,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.5,
                      value: 0.03,
                      inTangent: 0.008590988,
                      outTangent: 0.28,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.75,
                      value: 0.1,
                      inTangent: 0.4178908,
                      outTangent: 0.4481447,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 0.5,
                      inTangent: 3.019252,
                      outTangent: 3.019252,
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
        28,
      ),
      scheduled(
        36,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0026_lastrite_attack4'] })),
        48,
      ),
    ],
    timelineContinuationSkillId: 'chr_0026_lastrite_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.34, 0.37, 0.41, 0.44, 0.48, 0.51, 0.54, 0.58, 0.61, 0.65, 0.71, 0.77],
    env_dmg: 10,
    display_atk_scale: [0.68, 0.75, 0.82, 0.88, 0.95, 1.02, 1.09, 1.16, 1.22, 1.31, 1.41, 1.53],
  },
);

export const lastRiteChr_0026_lastrite_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0026_lastrite_attack4',
    timelineBlockFrames: 46,
    naturalDurationFrames: 182,
    exclusiveFrame: 54,
    offsetRecordFrame: 21,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 54,
          input: 'basicAttack',
          targetSkillId: 'chr_0026_lastrite_attack1',
        },
      ],
      allowedNextSkills: [
        { startFrame: 46, endFrame: 54, skillIds: ['chr_0026_lastrite_attack1'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'all',
              conditions: [
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0026_lastrite_normal_skill'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                { kind: 'casterControlled' },
              ],
            },
            sequence(
              step('modifyActionValue', {
                key: 'isBuffed',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        1,
      ),
      scheduled(
        17,
        sequence(
          branch(
            {
              kind: 'all',
              conditions: [
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0026_lastrite_normal_skill'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                { kind: 'casterControlled' },
              ],
            },
            sequence(
              step('modifyActionValue', {
                key: 'isBuffed',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
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
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'normalAttackLastCombo'],
              stagger: { kind: 'blackboard', key: 'poise' },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0026_lastrite_attack4:/scheduledSequences/2/sequence/steps/0',
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
        22,
      ),
      scheduled(
        22,
        sequence(
          branch(
            { kind: 'casterControlled' },
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
                      time: 0,
                      value: 0.3,
                      inTangent: -0.956214,
                      outTangent: -0.956214,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.1934154,
                      value: 0.1150535,
                      inTangent: -0.5494284,
                      outTangent: -0.5494284,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 0,
                      inTangent: -0.1426428,
                      outTangent: -0.1426428,
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
        23,
      ),
      scheduled(
        46,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0026_lastrite_attack1'] })),
        54,
      ),
    ],
    timelineContinuationSkillId: 'chr_0026_lastrite_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 30,
    atk_scale: [0.9, 0.99, 1.08, 1.17, 1.26, 1.35, 1.44, 1.53, 1.62, 1.73, 1.87, 2.03],
    atk_scale2: 0.2,
    env_dmg: 35,
    isBuffed: 0,
    poise: 25,
  },
);

export const lastRiteChr_0026_lastrite_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0026_lastrite_power_attack',
    timelineBlockFrames: 40,
    naturalDurationFrames: 176,
    exclusiveFrame: 58,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 40,
          endFrame: 58,
          skillIds: ['chr_0026_lastrite_normal_skill', 'chr_0026_lastrite_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        41,
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
        42,
      ),
      scheduled(
        40,
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
            'chr_0026_lastrite_power_attack:/scheduledSequences/1/sequence/steps/0',
          ),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
        ),
        40,
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
        40,
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
        58,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const lastRiteChr_0026_lastrite_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0026_lastrite_plunging_attack_end',
    timelineBlockFrames: 21,
    naturalDurationFrames: 133,
    exclusiveFrame: 20,
    offsetRecordFrame: 0,
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        2,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'plungingAttack'],
            },
            'chr_0026_lastrite_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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
        3,
      ),
    ],
    skillType: 'plungingAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
);

export const lastRiteChr_0026_lastrite_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0026_lastrite_normal_skill',
    timelineBlockFrames: 34,
    naturalDurationFrames: 429,
    exclusiveFrame: 373,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 34,
          endFrame: 51,
          skillIds: [
            'chr_0026_lastrite_attack1',
            'chr_0026_lastrite_attack2',
            'chr_0026_lastrite_attack3',
            'chr_0026_lastrite_attack4',
          ],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('modifyActionValue', {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'constant', value: 0.5 },
          }),
          step('modifyActionValue', {
            key: 'EntityBB_ns_atkscale1',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'atk_scale' },
          }),
          step('modifyActionValue', {
            key: 'EntityBB_ns_atkscale2',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'atk_scale' },
          }),
          step('modifyActionValue', {
            key: 'EntityBB_ns_atb',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'atb' },
          }),
        ),
        1,
      ),
      scheduled(
        0,
        sequence(
          step('jumpTimeline', {
            destinationFrame: 300,
            condition: { kind: 'not', condition: { kind: 'casterControlled' } },
          }),
        ),
        2,
      ),
      scheduled(51, sequence(step('markCurrentSkillCanInterrupt', {})), 52),
      scheduled(187, sequence(step('jumpTimeline', { destinationFrame: 429 })), 188),
      scheduled(
        300,
        sequence(
          step('findCharacterTeamTargets', {
            saveToContextKey: 'mainchar',
            selection: { kind: 'controlledOperator' },
          }),
        ),
        301,
      ),
      scheduled(
        6,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0026_lastrite_normal_skill_main_start',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_scale: 'atk_scale',
              duration: 'duration',
              atb: 'atb',
              atk_up: 'atk_up',
              potential_1: 'potential_1',
              usp: 'usp',
            },
          }),
        ),
        7,
      ),
      scheduled(
        300,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0026_lastrite_normal_skill.actionGroupData.timelineActions[14]._sequenceActionData.actionData[0]:projectile_chr_0026_lastrite_normal_skill',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0026_lastrite_normal_skill.actionGroupData.timelineActions[14]._sequenceActionData.actionData[0]:chr_0026_lastrite_normal_skill_projhit',
                { atk_scale: 0, duration: 0 },
                true,
                sequence(),
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        301,
      ),
      scheduled(
        300,
        sequence(
          step('finishBuffsById', {
            target: 'party',
            buffIds: ['buff_chr_0026_lastrite_normal_skill_tag'],
            reason: 'other',
          }),
          step('applyBuff', {
            buffId: 'buff_chr_0026_lastrite_normal_skill_self',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              atk_scale: 'atk_scale',
              duration: 'duration',
              atb: 'atb',
              atk_up: 'atk_up',
              potential_1: 'potential_1',
              poise: 'poise',
            },
          }),
          step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'usp' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          }),
        ),
        301,
      ),
    ],
    switchToBuffCast: {
      currentSkillTypes: ['basicAttack'],
      requiresCurrentSkillNotInterruptible: true,
      condition: { kind: 'casterControlled' },
      asSkillCast: true,
      sequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0026_lastrite_normal_skill_inattack',
          target: 'caster',
          inheritSourceSkillCastInfo: true,
          blackboardAssignments: {
            atk_scale: { kind: 'blackboard', key: 'atk_scale' },
            duration: { kind: 'blackboard', key: 'duration' },
            atb: { kind: 'blackboard', key: 'atb' },
            atk_up: { kind: 'blackboard', key: 'atk_up' },
            poise: { kind: 'blackboard', key: 'poise' },
            potential_1: { kind: 'blackboard', key: 'potential_1' },
            usp: { kind: 'blackboard', key: 'usp' },
          },
        }),
      ),
    },
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb: 30,
    atk_scale: [1.42, 1.56, 1.71, 1.85, 1.99, 2.13, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2],
    atk_up: 0.2,
    duration: 15,
    poise: 5,
    potential_1: 0,
    usp: 16,
  },
);

export const lastRiteChr_0026_lastrite_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0026_lastrite_ultimate_skill',
    timelineBlockFrames: 171,
    naturalDurationFrames: 360,
    exclusiveFrame: 170,
    offsetRecordFrame: 0,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 86,
          endFrame: 170,
          input: 'basicAttack',
          targetSkillId: 'chr_0026_lastrite_combo_skill',
        },
      ],
      allowedNextSkills: [
        {
          startFrame: 140,
          endFrame: 170,
          skillIds: ['chr_0026_lastrite_normal_skill', 'chr_0026_lastrite_combo_skill'],
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
            saveToContextKey: 'mainchr',
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
        85,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 85),
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
        172,
      ),
      scheduled(
        86,
        instantiateActionSequence(sharedActionSequence1, [
          'chr_0026_lastrite_ultimate_skill:/scheduledSequences/5/sequence/steps/0/body/steps/0/whenTrue/steps/0',
          'chr_0026_lastrite_ultimate_skill:/scheduledSequences/5/sequence/steps/0/body/steps/0/whenFalse/steps/0',
        ]),
        89,
      ),
      scheduled(
        105,
        instantiateActionSequence(sharedActionSequence1, [
          'chr_0026_lastrite_ultimate_skill:/scheduledSequences/6/sequence/steps/0/body/steps/0/whenTrue/steps/0',
          'chr_0026_lastrite_ultimate_skill:/scheduledSequences/6/sequence/steps/0/body/steps/0/whenFalse/steps/0',
        ]),
        108,
      ),
      scheduled(
        134,
        sequence(
          repeatEachTick(
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'talent_2', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'cryo',
                      attackScale: { kind: 'blackboard', key: 'atk_scale2' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      instantAttributeModifiers: [
                        {
                          targetSide: 'defender',
                          attribute: 'cryoVulnerabilityIncrease',
                          slot: 'baseFinalMultiplier',
                          value: { kind: 'blackboard', key: 'rate' },
                          attributeTiming: 'runtime',
                        },
                      ],
                      stagger: { kind: 'blackboard', key: 'poise2' },
                    },
                    'chr_0026_lastrite_ultimate_skill:/scheduledSequences/7/sequence/steps/0/body/steps/0/whenTrue/steps/0',
                  ),
                ),
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'cryo',
                      attackScale: { kind: 'blackboard', key: 'atk_scale2' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'blackboard', key: 'poise2' },
                    },
                    'chr_0026_lastrite_ultimate_skill:/scheduledSequences/7/sequence/steps/0/body/steps/0/whenFalse/steps/0',
                  ),
                ),
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
        137,
      ),
      scheduled(
        86,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        86,
      ),
      scheduled(
        85,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 50,
            curve: { kind: 'named', key: 'RESETto1' },
            finishByAction: false,
            targets: ['caster'],
          }),
        ),
        145,
      ),
    ],
    cooldownFrames: 600,
    costs: [{ resource: 'ultimateEnergy', value: 240 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    atk_scale2: [3.56, 3.91, 4.27, 4.62, 4.98, 5.33, 5.69, 6.04, 6.4, 6.84, 7.38, 8],
    poise1: 5,
    poise2: 10,
    rate: 0,
    talent_2: 0,
  },
);

export const lastRiteChr_0026_lastrite_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0026_lastrite_combo_skill',
    timelineBlockFrames: 91,
    naturalDurationFrames: 216,
    exclusiveFrame: 90,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 65, endFrame: 91, skillIds: ['chr_0026_lastrite_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        13,
        sequence(
          step('readBuffStackCount', {
            target: 'enemy',
            outputKey: 'infliction_num',
            query: {
              kind: 'tag',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
            },
          }),
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
            },
            'chr_0026_lastrite_combo_skill:/scheduledSequences/0/sequence/steps/1',
          ),
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'usp_base' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
            ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
          }),
          branch(
            {
              kind: 'healthCompare',
              target: 'enemy',
              valueType: 'current',
              operator: 'lessOrEqual',
              value: { kind: 'constant', value: 0 },
            },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'blackboard', key: 'usp' },
                coefficient: { kind: 'blackboard', key: 'infliction_num' },
                recipient: 'caster',
                ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
              }),
              step('modifyActionValue', {
                key: 'recover_usp',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        13,
      ),
      scheduled(
        63,
        sequence(
          forEachTarget(
            'enemy',
            sequence(
              step('readBuffStackCount', {
                target: 'enemy',
                outputKey: 'infliction_num',
                query: {
                  kind: 'tag',
                  tagQueryType: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
                },
              }),
              step('calculateActionValue', {
                key: 'final_combo_atkscale',
                operation: 'multiply',
                left: { kind: 'blackboard', key: 'atk_scale3' },
                right: { kind: 'blackboard', key: 'infliction_num' },
              }),
              step('modifyActionValue', {
                key: 'infliction_num_total',
                operation: 'add',
                value: { kind: 'blackboard', key: 'infliction_num' },
              }),
              step(
                'dealDamage',
                {
                  damageType: 'cryo',
                  attackScale: { kind: 'blackboard', key: 'final_combo_atkscale' },
                  tags: ['comboSkill'],
                  features: ['canBreakWeakness'],
                },
                'chr_0026_lastrite_combo_skill:/scheduledSequences/1/sequence/steps/0/body/steps/3',
              ),
              step(
                'dealDamage',
                {
                  damageType: 'cryo',
                  attackScale: { kind: 'blackboard', key: 'atk_scale2' },
                  tags: ['comboSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                'chr_0026_lastrite_combo_skill:/scheduledSequences/1/sequence/steps/0/body/steps/4',
              ),
              step('finishBuffsByTag', {
                target: 'enemy',
                tagQueryType: 'hasAny',
                buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
                reason: 'early',
              }),
            ),
          ),
        ),
        63,
      ),
      scheduled(
        2,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0026_lastrite_combo_skill_hitstop',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        3,
      ),
      scheduled(
        63,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'recover_usp', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'infliction_num_total', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 4 },
                },
                sequence(
                  step('changeResourceByActionValue', {
                    resource: 'ultimateEnergy',
                    amount: { kind: 'blackboard', key: 'usp' },
                    coefficient: { kind: 'constant', value: 4 },
                    recipient: 'caster',
                    ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
                  }),
                ),
                sequence(
                  step('changeResourceByActionValue', {
                    resource: 'ultimateEnergy',
                    amount: { kind: 'blackboard', key: 'usp' },
                    coefficient: { kind: 'blackboard', key: 'infliction_num_total' },
                    recipient: 'caster',
                    ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
                  }),
                ),
                { alwaysNext: true },
              ),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        63,
      ),
      scheduled(
        64,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.333 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        64,
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
    smartTarget: 'trigger',
    cooldownFrames: [270, 270, 270, 270, 270, 270, 270, 270, 270, 270, 270, 240],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atb: 0,
    atk_scale: [0.71, 0.78, 0.85, 0.92, 0.99, 1.07, 1.14, 1.21, 1.28, 1.37, 1.47, 1.6],
    atk_scale2: [0.71, 0.78, 0.85, 0.92, 0.99, 1.07, 1.14, 1.21, 1.28, 1.37, 1.47, 1.6],
    atk_scale3: [1.07, 1.17, 1.28, 1.39, 1.49, 1.6, 1.71, 1.81, 1.92, 2.05, 2.21, 2.4],
    final_combo_atkscale: 0,
    infliction_num: 0,
    infliction_num_total: 0,
    poise: 15,
    recover_usp: 0,
    usp: 15,
    usp_base: 40,
  },
);

export const lastRiteCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const lastRite: OperatorDefinition = {
  slug: 'last-rite',
  gameId: 'LASTRITE',
  rarity: 6,
  weaponType: 'greatsword',
  element: 'cryo',
  role: 'striker',
  mainAttribute: 'strength',
  secondaryAttribute: 'will',
  attributes: {
    strength: [21, 50, 80, 110, 140, 155],
    agility: [8, 29, 50, 72, 93, 104],
    intellect: [9, 27, 46, 65, 84, 93],
    will: [15, 35, 56, 77, 98, 109],
    baseAttack: [30, 95, 162, 230, 298, 332],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        lastRiteChr_0026_lastrite_attack1,
        lastRiteChr_0026_lastrite_attack2,
        lastRiteChr_0026_lastrite_attack3,
        lastRiteChr_0026_lastrite_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: lastRiteChr_0026_lastrite_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: lastRiteChr_0026_lastrite_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: lastRiteChr_0026_lastrite_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: lastRiteChr_0026_lastrite_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: lastRiteChr_0026_lastrite_combo_skill,
    },
  ],
  dodgeSkill: lastRiteCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0026_lastrite_normal_skill',
      replacementSkillKeys: [],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0026_lastrite_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0026_lastrite_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0026_lastrite_attack1',
        'chr_0026_lastrite_attack2',
        'chr_0026_lastrite_attack3',
        'chr_0026_lastrite_attack4',
        'chr_0026_lastrite_plunging_attack_end',
        'chr_0026_lastrite_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0026_lastrite_attack1',
        'chr_0026_lastrite_attack2',
        'chr_0026_lastrite_attack3',
        'chr_0026_lastrite_attack4',
      ],
      defaultSkillKey: 'chr_0026_lastrite_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0026_lastrite_combo_skill',
      event: 'beforeTakeInfliction',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          { kind: 'eventInflictionElementIn', elements: ['cryo'] },
          sequence(
            branch(
              {
                kind: 'contextTargetBuffStackCompare',
                contextKey: 'trigger',
                tagQueryType: 'hasAny',
                buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 2 },
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
          buffId: 'buff_chr_0026_lastrite_talent_1',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: {
            crystal_up: [0.02, 0.04],
            duration: { kind: 'constant', value: 15 },
          },
        }),
      ),
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_2',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'rate',
          operation: 'assign',
          value: [1.2, 1.5],
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
          operation: 'assign',
          value: 0.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'poise',
          operation: 'assign',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_1',
          operation: 'assign',
          value: 1,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 20 },
        { kind: 'addStaticDamageIncrease', target: 'cryo', value: 0.1 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale2',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale3',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale2',
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
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atb',
          operation: 'add',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.2,
        },
      ],
    },
  ],
  entityBlackboard: { EntityBB_ns_atb: 0, EntityBB_ns_atkscale1: 0, EntityBB_ns_atkscale2: 0 },
  passiveSkills: [
    {
      key: 'chr_0026_lastrite_passive',
      enableSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0026_lastrite_passive',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
        }),
      ),
    },
  ],
  buffDefinitions: {
    buff_chr_0026_lastrite_combo_skill_hitstop: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 2,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: -1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
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
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: true,
            targets: ['enemy'],
          }),
        ),
      },
    },
    buff_chr_0026_lastrite_normal_skill: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_lastrite_buff',
        iconPath: '/icons/icon_battle_lastrite_buff.webp',
        showInHeadBarCommon: false,
        showInHeadBarAttached: false,
        showInSquadIcon: true,
        onlyShowForMainCharacter: true,
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { atb: 30, atk_scale: 3, atk_up: 0, duration: 15, poise: 0, potential_1: 0 },
      attributeModifiers: [],
      damageModifiers: [
        {
          enabledSide: 'attacker',
          condition: {
            kind: 'all',
            conditions: [
              { kind: 'casterControlled' },
              { kind: 'eventDamageTagsMatch', match: 'hasAny', tags: ['normalAttackLastCombo'] },
              {
                kind: 'buffBlackboardCompare',
                left: { blackboardKey: 'potential_1' },
                operator: 'equal',
                right: 1,
              },
            ],
          },
          processors: [
            {
              kind: 'damageScale',
              side: 'attacker',
              zone: 'normal',
              addition: { blackboardKey: 'atk_up' },
            },
          ],
        },
      ],
      abilityEventResponses: [
        {
          event: 'beforeOutputDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'healthCompare',
                target: 'enemy',
                valueType: 'current',
                operator: 'greater',
                value: { kind: 'constant', value: 0 },
              },
              sequence(
                branch(
                  {
                    kind: 'eventDamageTagsMatch',
                    match: 'hasAny',
                    tags: ['normalAttackLastCombo'],
                  },
                  sequence(
                    branch(
                      { kind: 'casterControlled' },
                      sequence(
                        branch(
                          {
                            kind: 'actionValueCompare',
                            left: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
                            operator: 'equal',
                            right: { kind: 'constant', value: 1 },
                          },
                          sequence(
                            step('dealStagger', { value: { kind: 'blackboard', key: 'poise' } }),
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
        {
          event: 'beforeOutputDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'healthCompare',
                target: 'enemy',
                valueType: 'current',
                operator: 'greater',
                value: { kind: 'constant', value: 0 },
              },
              sequence(
                branch(
                  {
                    kind: 'not',
                    condition: {
                      kind: 'timedMarkerPresent',
                      target: 'buffOwner',
                      markerId: 'buff_chr_0026_lastrite_normal_skill_marker',
                    },
                  },
                  sequence(
                    branch(
                      {
                        kind: 'eventDamageTagsMatch',
                        match: 'hasAny',
                        tags: ['normalAttackLastCombo'],
                      },
                      sequence(
                        branch(
                          { kind: 'casterControlled' },
                          sequence(
                            branch(
                              {
                                kind: 'entityTagMatch',
                                target: 'buffOwner',
                                tagQueryType: 'hasAny',
                                tags: ['Skill/Character/chr_0026_lastrite'],
                              },
                              sequence(
                                step('applyBuff', {
                                  buffId: 'buff_chr_0026_lastrite_normal_skill_phantom_main',
                                  target: 'enemy',
                                  source: 'buffSource',
                                  inheritSourceSkillCastInfo: true,
                                  copiedBlackboardAssignments: { atk_scale1: 'atk_scale' },
                                }),
                                step('applyBuff', {
                                  buffId: 'buff_chr_0026_lastrite_normal_skill_tag',
                                  target: 'buffSource',
                                  source: 'buffSource',
                                  inheritSourceSkillCastInfo: true,
                                }),
                              ),
                              sequence(
                                step('applyBuff', {
                                  buffId: 'buff_chr_0026_lastrite_normal_skill_phantom',
                                  target: 'enemy',
                                  source: 'buffSource',
                                  inheritSourceSkillCastInfo: true,
                                  copiedBlackboardAssignments: { atk_scale: 'atk_scale' },
                                }),
                                step('applyBuff', {
                                  buffId: 'buff_chr_0026_lastrite_normal_skill_tag',
                                  target: 'buffSource',
                                  source: 'buffSource',
                                  inheritSourceSkillCastInfo: true,
                                }),
                              ),
                              { alwaysNext: true },
                            ),
                            step('createTimedMarker', {
                              target: 'buffOwner',
                              markerId: 'buff_chr_0026_lastrite_normal_skill_marker',
                              durationSeconds: { kind: 'constant', value: 0.1 },
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
    buff_chr_0026_lastrite_normal_skill_inattack: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 1,
      applyTags: ['Status/DisableNormalSkill'],
      extendTags: [],
      blackboard: {
        atb: 0,
        atk_scale: 0,
        atk_up: 0,
        duration: 0,
        poise: 0,
        potential_1: 0,
        usp: 0,
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
              step('modifyActionValue', {
                key: 'atk_scale',
                operation: 'multiply',
                value: { kind: 'constant', value: 0.5 },
              }),
              step('finishBuffsById', {
                target: 'party',
                buffIds: ['buff_chr_0026_lastrite_normal_skill'],
                reason: 'other',
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0026_lastrite_normal_skill_self',
                target: 'buffSource',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: {
                  atk_scale: 'atk_scale',
                  duration: 'duration',
                  atb: 'atb',
                  atk_up: 'atk_up',
                  poise: 'poise',
                  potential_1: 'potential_1',
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
              step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'blackboard', key: 'usp' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'caster',
                ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
              }),
            ),
          },
        ),
      },
    },
    buff_chr_0026_lastrite_normal_skill_main_start: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 1.5,
      applyTags: [],
      extendTags: [],
      blackboard: { atb: 0, atk_scale: 0, atk_up: 0, duration: 0, potential_1: 0, usp: 0 },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          26,
          sequence(
            step('finishBuffsById', {
              target: 'party',
              buffIds: ['buff_chr_0026_lastrite_normal_skill_tag'],
              reason: 'other',
            }),
            step('applyBuff', {
              buffId: 'buff_chr_0026_lastrite_normal_skill_self',
              target: 'buffSource',
              source: 'buffSource',
              inheritSourceSkillCastInfo: true,
              copiedBlackboardAssignments: {
                atk_scale: 'atk_scale',
                duration: 'duration',
                atb: 'atb',
                atk_up: 'atk_up',
                potential_1: 'potential_1',
              },
            }),
            step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
            step('changeResourceByActionValue', {
              resource: 'ultimateEnergy',
              amount: { kind: 'blackboard', key: 'usp' },
              coefficient: { kind: 'constant', value: 1 },
              recipient: 'caster',
              ultimateRecoveryTag: 'Skill/Character/chr_0026_lastrite',
            }),
          ),
          27,
        ),
      ],
    },
    buff_chr_0026_lastrite_normal_skill_phantom: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 2,
      durationSeconds: 3,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale: 0 },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          0,
          sequence(
            step('findCharacterTeamTargets', {
              saveToContextKey: 'main',
              selection: { kind: 'controlledOperator' },
            }),
          ),
          1,
        ),
        scheduled(
          9,
          sequence(
            step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
            step('startTimeDilation', {
              scope: 'entity',
              durationSeconds: { kind: 'constant', value: 0.2 },
              slot: 'TimeDilation/Layer/Entity/HitStop',
              priority: 10,
              curve: { kind: 'named', key: 'char_hard_stop' },
              finishByAction: false,
              targets: ['controlled'],
            }),
            step(
              'dealDamage',
              {
                damageType: 'cryo',
                attackScale: { kind: 'blackboard', key: 'atk_scale' },
                tags: ['normalSkill'],
                features: ['canBreakWeakness'],
              },
              'buff_chr_0026_lastrite_normal_skill_phantom:/scheduledSequences/1/sequence/steps/2',
            ),
          ),
          10,
        ),
        scheduled(
          9,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'cryo',
                attackScale: { kind: 'blackboard', key: 'atk_scale' },
                tags: ['normalSkill'],
                features: ['canBreakWeakness'],
              },
              'buff_chr_0026_lastrite_normal_skill_phantom:/scheduledSequences/2/sequence/steps/0',
            ),
          ),
          10,
        ),
      ],
    },
    buff_chr_0026_lastrite_normal_skill_phantom_main: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 2,
      durationSeconds: 3,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale1: 0, atk_scale2: 0 },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          21,
          sequence(
            step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
            step('startTimeDilation', {
              scope: 'entity',
              durationSeconds: { kind: 'constant', value: 0.33 },
              slot: 'TimeDilation/Layer/Entity/HitStop',
              priority: 10,
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
                    value: 0,
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
            }),
            step(
              'dealDamage',
              {
                damageType: 'cryo',
                attackScale: { kind: 'blackboard', key: 'atk_scale1' },
                tags: ['normalSkill'],
                features: ['canBreakWeakness'],
              },
              'buff_chr_0026_lastrite_normal_skill_phantom_main:/scheduledSequences/0/sequence/steps/2',
            ),
          ),
          22,
        ),
        scheduled(
          21,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'cryo',
                attackScale: { kind: 'blackboard', key: 'atk_scale1' },
                tags: ['normalSkill'],
                features: ['canBreakWeakness'],
              },
              'buff_chr_0026_lastrite_normal_skill_phantom_main:/scheduledSequences/1/sequence/steps/0',
            ),
          ),
          22,
        ),
      ],
    },
    buff_chr_0026_lastrite_normal_skill_self: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { atb: 0, atk_scale: 0, atk_up: 0, duration: 0, poise: 0, potential_1: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0026_lastrite_normal_skill',
            target: 'party',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'duration',
              atk_scale: 'atk_scale',
              atb: 'atb',
              poise: 'poise',
              atk_up: 'atk_up',
              potential_1: 'potential_1',
            },
          }),
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atb' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'skill',
          }),
        ),
      },
    },
    buff_chr_0026_lastrite_normal_skill_tag: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'addedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'buffIdStackCompare',
                target: 'buffOwner',
                buffIds: ['buff_chr_0026_lastrite_normal_skill_tag'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 1 },
              },
              sequence(
                step('finishBuffsById', {
                  target: 'party',
                  buffIds: ['buff_chr_0026_lastrite_normal_skill'],
                  reason: 'other',
                }),
                step('finishBuffsById', {
                  target: 'buffOwner',
                  buffIds: ['buff_chr_0026_lastrite_normal_skill_tag'],
                  reason: 'other',
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0026_lastrite_passive: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('restrictUltimateEnergyRecovery', {
            target: 'caster',
            allowedRecoveryTags: ['Skill/Character/chr_0026_lastrite'],
            clearUltimateEnergyOnEnd: false,
          }),
        ),
      },
    },
    buff_chr_0026_lastrite_talent_1: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { crystal_up: 0, crystal_vul: 0, duration: 0, infliction_num: 0 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'buffConsumed',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'eventBuffTagsMatch',
                match: 'hasAny',
                buffTags: ['Skill/Character/Common/SpellInflict'],
              },
              sequence(
                branch(
                  {
                    kind: 'eventConsumedBuffLayerCompare',
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 1 },
                    outputKey: 'infliction_num',
                  },
                  sequence(
                    step('calculateActionValue', {
                      key: 'crystal_vul',
                      operation: 'multiply',
                      left: { kind: 'blackboard', key: 'infliction_num' },
                      right: { kind: 'blackboard', key: 'crystal_up' },
                    }),
                    step('applyBuff', {
                      buffId: 'buff_chr_0026_lastrite_talent_1_vul',
                      target: 'eventTarget',
                      source: 'buffSource',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        crystal_vul: 'crystal_vul',
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
    buff_chr_0026_lastrite_talent_1_vul: {
      stackingType: 'highPriority',
      priority: { blackboardKey: 'crystal_vul' },
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { crystal_vul: 0, duration: 0, real_duration: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('readCurrentBuffRemainingDuration', { outputKey: 'real_duration' }),
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_crystal',
            target: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'real_duration' },
              rate: { kind: 'blackboard', key: 'crystal_vul' },
            },
          }),
        ),
      },
    },
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default lastRite;
