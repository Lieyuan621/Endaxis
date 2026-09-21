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
  scheduled,
  sequence,
  step,
  withSkillBlackboard,
} from './definitionHelpers';

const sharedActionSequence1: ActionSequenceDefinition = sequence(
  step(
    'dealDamage',
    {
      damageType: 'physical',
      attackScale: { kind: 'blackboard', key: 'atk_scale' },
      tags: ['normalAttack'],
    },
    '\u0000endaxis-generated-identity:0',
  ),
  branch(
    { kind: 'casterControlled' },
    sequence(
      step('startTimeDilation', {
        scope: 'entity',
        durationSeconds: { kind: 'constant', value: 0.067 },
        slot: 'TimeDilation/Layer/Entity/HitStop',
        priority: 10,
        curve: {
          kind: 'inline',
          keys: [
            {
              time: 0,
              value: 1,
              inTangent: -1.778889,
              outTangent: -1.778889,
              weightedMode: 0,
              inWeight: 0,
              outWeight: 0,
            },
            {
              time: 0.5059338,
              value: 0.1,
              inTangent: 0.02136457,
              outTangent: 0.02136457,
              weightedMode: 0,
              inWeight: 0,
              outWeight: 0,
            },
            {
              time: 1,
              value: 1,
              inTangent: 1.821618,
              outTangent: 1.821618,
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
);

export const lifengChr_0015_lifeng_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0015_lifeng_attack1',
    timelineBlockFrames: 24,
    naturalDurationFrames: 187,
    exclusiveFrame: 25,
    offsetRecordFrame: 9,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 32,
          input: 'basicAttack',
          targetSkillId: 'chr_0015_lifeng_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 24, endFrame: 32, skillIds: ['chr_0015_lifeng_attack2'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        9,
        instantiateActionSequence(sharedActionSequence1, [
          'chr_0015_lifeng_attack1:/scheduledSequences/0/sequence/steps/0',
        ]),
        10,
      ),
      scheduled(
        17,
        instantiateActionSequence(sharedActionSequence1, [
          'chr_0015_lifeng_attack1:/scheduledSequences/1/sequence/steps/0',
        ]),
        18,
      ),
      scheduled(
        24,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0015_lifeng_attack2'] })),
        32,
      ),
    ],
    timelineContinuationSkillId: 'chr_0015_lifeng_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.12, 0.13, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.22, 0.23, 0.25, 0.27],
    display_atk_scale: [0.24, 0.27, 0.29, 0.32, 0.34, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.55],
  },
);

export const lifengChr_0015_lifeng_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0015_lifeng_attack2',
    timelineBlockFrames: 18,
    naturalDurationFrames: 131,
    exclusiveFrame: 18,
    offsetRecordFrame: 4,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 24,
          input: 'basicAttack',
          targetSkillId: 'chr_0015_lifeng_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 18, endFrame: 24, skillIds: ['chr_0015_lifeng_attack3'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        4,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0015_lifeng_attack2:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.1 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: {
                  kind: 'inline',
                  keys: [
                    {
                      time: 0,
                      value: 1,
                      inTangent: -1.778889,
                      outTangent: -1.778889,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.5059338,
                      value: 0.1,
                      inTangent: 0.02136457,
                      outTangent: 0.02136457,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 1,
                      inTangent: 1.821618,
                      outTangent: 1.821618,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                  ],
                },
                finishByAction: false,
                targets: ['caster'],
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
        5,
      ),
      scheduled(
        18,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0015_lifeng_attack3'] })),
        24,
      ),
    ],
    timelineContinuationSkillId: 'chr_0015_lifeng_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.29, 0.32, 0.35, 0.38, 0.41, 0.44, 0.47, 0.49, 0.52, 0.56, 0.6, 0.65] },
);

export const lifengChr_0015_lifeng_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0015_lifeng_attack3',
    timelineBlockFrames: 14,
    naturalDurationFrames: 115,
    exclusiveFrame: 14,
    offsetRecordFrame: 11,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 30,
          input: 'basicAttack',
          targetSkillId: 'chr_0015_lifeng_attack5',
        },
      ],
      allowedNextSkills: [{ startFrame: 14, endFrame: 30, skillIds: ['chr_0015_lifeng_attack5'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        11,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0015_lifeng_attack3:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.167 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_hard_stop' },
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
        12,
      ),
      scheduled(
        14,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0015_lifeng_attack5'] })),
        30,
      ),
    ],
    timelineContinuationSkillId: 'chr_0015_lifeng_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.67, 0.73, 0.79],
    display_atk_scale: [0.34, 0.37, 0.4, 0.44, 0.47, 0.5, 0.54, 0.57, 0.6, 0.64, 0.7, 0.75],
  },
);

export const lifengChr_0015_lifeng_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0015_lifeng_attack5',
    timelineBlockFrames: 35,
    naturalDurationFrames: 192,
    exclusiveFrame: 35,
    offsetRecordFrame: 13,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 46,
          input: 'basicAttack',
          targetSkillId: 'chr_0015_lifeng_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 35, endFrame: 46, skillIds: ['chr_0015_lifeng_attack1'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        13,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0015_lifeng_attack5:/scheduledSequences/0/sequence/steps/0',
          ),
        ),
        14,
      ),
      scheduled(
        24,
        sequence(
          forEachTarget(
            'enemy',
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale2' },
                  tags: ['normalAttack', 'normalAttackLastCombo'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                  staggerOnlyWhenCasterControlled: true,
                },
                'chr_0015_lifeng_attack5:/scheduledSequences/1/sequence/steps/0/body/steps/0',
              ),
            ),
          ),
          step(
            'dealDamage',
            { damageType: 'physical', attackScale: { kind: 'constant', value: 0 }, tags: [] },
            'chr_0015_lifeng_attack5:/scheduledSequences/1/sequence/steps/1',
          ),
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
                      value: 1,
                      inTangent: -10.34941,
                      outTangent: -10.34941,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.06079425,
                      value: 0.3708155,
                      inTangent: -1.727207,
                      outTangent: -1.727207,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.5059338,
                      value: 0.1,
                      inTangent: -0.1658141,
                      outTangent: -0.1658141,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 1,
                      inTangent: 1.821618,
                      outTangent: 1.821618,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                  ],
                },
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
        24,
      ),
      scheduled(
        35,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0015_lifeng_attack1'] })),
        46,
      ),
    ],
    timelineContinuationSkillId: 'chr_0015_lifeng_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 21,
    atk_scale: [0.18, 0.19, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39],
    atk_scale2: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.96, 1.04, 1.13],
    poise: 19,
    display_atk_scale: [0.68, 0.74, 0.81, 0.88, 0.95, 1.01, 1.08, 1.15, 1.22, 1.3, 1.4, 1.52],
  },
);

export const lifengChr_0015_lifeng_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0015_lifeng_power_attack',
    timelineBlockFrames: 33,
    naturalDurationFrames: 194,
    exclusiveFrame: 68,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 33,
          endFrame: 68,
          skillIds: ['chr_0015_lifeng_normal_skill', 'chr_0015_lifeng_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        6,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.1,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0015_lifeng_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
        ),
        6,
      ),
      scheduled(
        33,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.9,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0015_lifeng_power_attack:/scheduledSequences/1/sequence/steps/0',
          ),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
        ),
        33,
      ),
      scheduled(
        34,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2667 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1,
                  inTangent: -4.725137,
                  outTangent: -4.725137,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1938458,
                  value: 0.08405209,
                  inTangent: -0.1121379,
                  outTangent: -0.1121379,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7754285,
                  value: 0.06392533,
                  inTangent: 0.06279767,
                  outTangent: 0.06279767,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 4.168271,
                  outTangent: 4.168271,
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
        34,
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
        68,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const lifengChr_0015_lifeng_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0015_lifeng_plunging_attack_end',
    timelineBlockFrames: 26,
    naturalDurationFrames: 181,
    exclusiveFrame: 25,
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
            'chr_0015_lifeng_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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

export const lifengChr_0015_lifeng_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0015_lifeng_normal_skill',
    timelineBlockFrames: 71,
    naturalDurationFrames: 216,
    exclusiveFrame: 70,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 67, endFrame: 89, skillIds: ['chr_0015_lifeng_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        54,
        sequence(
          forEachTarget(
            'enemy',
            sequence(
              branch(
                {
                  kind: 'buffStackCompare',
                  target: 'enemy',
                  tagQueryType: 'hasAny',
                  buffTags: ['Skill/Character/Common/NoGuard'],
                  operator: 'lessOrEqual',
                  value: { kind: 'blackboard', key: 'num' },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0015_lifeng_purify',
                    target: 'enemy',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: { rate: 'phy_resist_down', duration: 'duration' },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
            ),
          ),
        ),
        56,
      ),
      scheduled(
        7,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0015_lifeng_normal_skill:/scheduledSequences/1/sequence/steps/0',
          ),
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
        9,
      ),
      scheduled(
        20,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0015_lifeng_normal_skill:/scheduledSequences/2/sequence/steps/0',
          ),
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
        22,
      ),
      scheduled(
        54,
        sequence(
          step('applyKnockDown', {
            target: 'enemy',
            duration: { kind: 'constant', value: 1.5 },
            force: false,
            isExtra: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale2' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0015_lifeng_normal_skill:/scheduledSequences/3/sequence/steps/1',
          ),
          step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
        ),
        56,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atk_scale: [0.38, 0.42, 0.46, 0.5, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.79, 0.86],
    atk_scale2: [1.19, 1.31, 1.43, 1.55, 1.67, 1.78, 1.9, 2.02, 2.14, 2.29, 2.47, 2.68],
    duration: 12,
    num: 0,
    phy_resist_down: [0.05, 0.05, 0.05, 0.05, 0.05, 0.07, 0.07, 0.07, 0.09, 0.1, 0.1, 0.12],
    poise: 10,
  },
);

export const lifengChr_0015_lifeng_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0015_lifeng_ultimate_skill',
    timelineBlockFrames: 76,
    naturalDurationFrames: 190,
    exclusiveFrame: 75,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 66,
          endFrame: 80,
          skillIds: ['chr_0015_lifeng_normal_skill', 'chr_0015_lifeng_combo_skill'],
        },
      ],
    },
    costFrame: 9,
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
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        56,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 56),
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
        75,
      ),
      scheduled(
        1,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'EntityBB_isCombo', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'isCombo',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        3,
      ),
      scheduled(
        58,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0015_lifeng_ultimate_skill',
            childSkillId: 'chr_0015_lifeng_ultimate_skill_abentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
        ),
        59,
      ),
    ],
    cooldownFrames: 450,
    costs: [{ resource: 'ultimateEnergy', value: 90 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale1: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    atk_scale2: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    isCombo: 0,
    poise1: 0,
    poise2: 5,
    atk_scale3: [2.67, 2.94, 3.2, 3.47, 3.74, 4, 4.27, 4.54, 4.8, 5.14, 5.54, 6],
    poise: 5,
    poise3: 5,
  },
);

export const lifengChr_0015_lifeng_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0015_lifeng_combo_skill',
    timelineBlockFrames: 65,
    naturalDurationFrames: 168,
    exclusiveFrame: 64,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 50, endFrame: 89, skillIds: ['chr_0015_lifeng_normal_skill'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('modifyActionValue', {
                key: 'main_near',
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
        19,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0015_lifeng_combo_skill:/scheduledSequences/1/sequence/steps/0',
          ),
        ),
        20,
      ),
      scheduled(
        48,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale2' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0015_lifeng_combo_skill:/scheduledSequences/2/sequence/steps/0',
          ),
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'usp' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          }),
        ),
        49,
      ),
      scheduled(
        19,
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
            blackboardAssignments: { duration: { kind: 'blackboard', key: 'duration' } },
          }),
        ),
        20,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.933 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        25,
      ),
    ],
    smartTarget: 'trigger',
    cooldownFrames: [480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 450],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [0.47, 0.51, 0.56, 0.61, 0.65, 0.7, 0.75, 0.79, 0.84, 0.9, 0.97, 1.05],
    atk_scale2: [1.67, 1.83, 2, 2.17, 2.33, 2.5, 2.67, 2.83, 3, 3.21, 3.46, 3.75],
    duration: 20,
    main_near: 0,
    poise: 10,
    usp: 10,
  },
);

export const lifengCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const lifeng: OperatorDefinition = {
  slug: 'lifeng',
  gameId: 'LIFENG',
  rarity: 6,
  weaponType: 'polearm',
  element: 'physical',
  role: 'guard',
  mainAttribute: 'agility',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [14, 38, 62, 86, 111, 123],
    agility: [20, 44, 69, 94, 119, 132],
    intellect: [13, 35, 58, 81, 104, 115],
    will: [12, 35, 58, 82, 105, 117],
    baseAttack: [30, 90, 153, 217, 280, 312],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        lifengChr_0015_lifeng_attack1,
        lifengChr_0015_lifeng_attack2,
        lifengChr_0015_lifeng_attack3,
        lifengChr_0015_lifeng_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: lifengChr_0015_lifeng_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: lifengChr_0015_lifeng_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: lifengChr_0015_lifeng_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: lifengChr_0015_lifeng_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: lifengChr_0015_lifeng_combo_skill,
    },
  ],
  dodgeSkill: lifengCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0015_lifeng_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0015_lifeng_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0015_lifeng_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0015_lifeng_attack1',
        'chr_0015_lifeng_attack2',
        'chr_0015_lifeng_attack3',
        'chr_0015_lifeng_attack5',
        'chr_0015_lifeng_plunging_attack_end',
        'chr_0015_lifeng_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0015_lifeng_attack1',
        'chr_0015_lifeng_attack2',
        'chr_0015_lifeng_attack3',
        'chr_0015_lifeng_attack5',
      ],
      defaultSkillKey: 'chr_0015_lifeng_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0015_lifeng_combo_skill',
      event: 'beforeTakeDamage',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'contextTargetBuffStackCompare',
            contextKey: 'trigger',
            tagQueryType: 'hasAny',
            buffTags: [
              'Skill/Character/Common/Affixes/Vulnerable/VulnerablePhysic',
              'Skill/Character/Common/PhysicalStatus/FractureStatus',
            ],
            operator: 'greaterOrEqual',
            value: { kind: 'constant', value: 1 },
          },
          sequence(
            branch(
              {
                kind: 'actionInputTargetIdentityMatch',
                other: 'controlledOperator',
                operator: 'equal',
              },
              sequence(
                branch(
                  {
                    kind: 'eventDamageTagsMatch',
                    match: 'hasAny',
                    tags: ['normalAttackLastCombo'],
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
      levels: 2,
      passiveSkills: [
        {
          key: 'chr_0015_lifeng_talent_1',
          blackboard: { atk_up: [0.001, 0.0015] },
          enableSequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0015_lifeng_talent_1',
              target: 'caster',
              inheritSourceSkillCastInfo: false,
              blackboardAssignments: { atk_up: { kind: 'blackboard', key: 'atk_up' } },
            }),
          ),
        },
      ],
    },
    {
      levels: 2,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0015_lifeng_talent_2',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { atk_scale_talent2: [0.5, 1] },
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
          skillGroupKey: 'battleSkill',
          blackboardKey: 'phy_resist_down',
          operation: 'add',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'num',
          operation: 'assign',
          value: 2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['will'], value: 15 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0015_lifeng_talent_1',
          blackboardKey: 'atk_up',
          operation: 'add',
          value: 0.0005,
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
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0015_lifeng_potential_5',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: {
            interval: { kind: 'constant', value: 15 },
            atk_scale_potential5: { kind: 'constant', value: 2.5 },
            poise_potential5: { kind: 'constant', value: 5 },
          },
        }),
      ),
    },
  ],
  entityBlackboard: { EntityBB_isCombo: 0 },
  passiveSkills: [
    {
      key: 'chr_0015_lifeng_passive',
      enableSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0015_lifeng_passive',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
        }),
      ),
    },
  ],
  buffDefinitions: {
    buff_chr_0015_lifeng_passive: {
      stackingType: 'unique',
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
              { kind: 'eventBuffIdMatch', buffIds: ['buff_common_affixes_skillimbue_atk'] },
              sequence(
                step('modifyActionValue', {
                  key: 'EntityBB_isCombo',
                  operation: 'assign',
                  value: { kind: 'constant', value: 1 },
                }),
              ),
            ),
          ),
        },
        {
          event: 'skillEnd',
          priority: 0,
          sequence: sequence(
            step('modifyActionValue', {
              key: 'EntityBB_isCombo',
              operation: 'assign',
              value: { kind: 'constant', value: 0 },
            }),
          ),
        },
      ],
    },
    buff_chr_0015_lifeng_potential_5: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      triggerIntervalSeconds: { blackboardKey: 'interval' },
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale_potential5: 0, interval: 0, poise_potential5: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        trigger: sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'buffOwner',
              buffIds: ['buff_chr_0015_lifeng_talent_2'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0015_lifeng_potential_5_1',
                target: 'buffOwner',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: {
                  atk_scale_potential5: 'atk_scale_potential5',
                  poise_potential5: 'poise_potential5',
                  interval: 'interval',
                },
              }),
              step('finishBuffsById', {
                target: 'buffOwner',
                buffIds: ['buff_chr_0015_lifeng_potential_5'],
                reason: 'other',
              }),
            ),
          ),
        ),
      },
    },
    buff_chr_0015_lifeng_potential_5_1: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      presentation: {
        visible: true,
        iconId: 'icon_battle_lifeng_potential_5',
        iconPath: '/icons/icon_battle_lifeng_potential_5.webp',
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
      blackboard: { atk_scale_potential5: 0, interval: 0, poise_potential5: 0 },
      attributeModifiers: [],
    },
    buff_chr_0015_lifeng_purify: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 12, rate: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_physical',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            stringBlackboardAssignments: { child_buff_id: 'buff_chr_0015_lifeng_purify_icon' },
          }),
        ),
      },
    },
    buff_chr_0015_lifeng_purify_icon: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_affix_physical_vulnerable',
        iconPath: '/icons/icon_battle_affix_physical_vulnerable.webp',
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
    buff_chr_0015_lifeng_talent_1: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      triggerIntervalSeconds: 1,
      waitFirstTriggerInterval: false,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_up: 0 },
      attributeModifiers: [
        {
          attribute: 'AtkIncreaseFactorFromWisd',
          slot: 'baseAddition',
          value: { blackboardKey: 'atk_up' },
        },
        {
          attribute: 'AtkIncreaseFactorFromWill',
          slot: 'addition',
          value: { blackboardKey: 'atk_up' },
        },
      ],
    },
    buff_chr_0015_lifeng_talent_2: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      triggerIntervalSeconds: 1,
      waitFirstTriggerInterval: false,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: {
        atk_scale_potential5: 0,
        atk_scale_talent2: 0,
        final_atk_scale_talent2: 0,
        interval: 0,
        poise_potential5: 0,
      },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'beforeOutputKnockDown',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'buffIdStackCompare',
                target: 'buffOwner',
                buffIds: ['buff_chr_0015_lifeng_potential_5_1'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 1 },
              },
              sequence(
                step('readBuffBlackboard', {
                  target: 'buffOwner',
                  query: { kind: 'id', buffIds: ['buff_chr_0015_lifeng_potential_5_1'] },
                  desiredKey: 'atk_scale_potential5',
                  outputKey: 'atk_scale_potential5',
                }),
                step('readBuffBlackboard', {
                  target: 'buffOwner',
                  query: { kind: 'id', buffIds: ['buff_chr_0015_lifeng_potential_5_1'] },
                  desiredKey: 'interval',
                  outputKey: 'interval',
                }),
                step('readBuffBlackboard', {
                  target: 'buffOwner',
                  query: { kind: 'id', buffIds: ['buff_chr_0015_lifeng_potential_5_1'] },
                  desiredKey: 'poise_potential5',
                  outputKey: 'poise_potential5',
                }),
                step('calculateActionValue', {
                  key: 'final_atk_scale_talent2',
                  operation: 'add',
                  left: { kind: 'blackboard', key: 'atk_scale_talent2' },
                  right: { kind: 'blackboard', key: 'atk_scale_potential5' },
                }),
                step(
                  'dealDamage',
                  {
                    damageType: 'physical',
                    attackScale: { kind: 'blackboard', key: 'final_atk_scale_talent2' },
                    tags: [],
                    stagger: { kind: 'blackboard', key: 'poise_potential5' },
                  },
                  'buff_chr_0015_lifeng_talent_2:/abilityEventResponses/0/sequence/steps/0/whenTrue/steps/4',
                ),
                step('finishBuffsById', {
                  target: 'buffOwner',
                  buffIds: ['buff_chr_0015_lifeng_potential_5_1'],
                  reason: 'other',
                }),
                step('applyBuff', {
                  buffId: 'buff_chr_0015_lifeng_potential_5',
                  target: 'buffOwner',
                  source: 'buffSource',
                  inheritSourceSkillCastInfo: true,
                  copiedBlackboardAssignments: {
                    interval: 'interval',
                    atk_scale_potential5: 'atk_scale_potential5',
                    poise_potential5: 'poise_potential5',
                  },
                }),
              ),
              sequence(
                step(
                  'dealDamage',
                  {
                    damageType: 'physical',
                    attackScale: { kind: 'blackboard', key: 'atk_scale_talent2' },
                    tags: [],
                  },
                  'buff_chr_0015_lifeng_talent_2:/abilityEventResponses/0/sequence/steps/0/whenFalse/steps/0',
                ),
              ),
              { alwaysNext: true },
            ),
          ),
        },
      ],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0015_lifeng_ultimate_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'SelectCategory/ProjectilePassThru',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      deathReleaseDelaySeconds: 0.100000001490116,
      childSkill: {
        skillId: 'chr_0015_lifeng_ultimate_skill_abentity',
        blackboard: {
          atk_scale1: 1,
          atk_scale2: 1.5,
          atk_scale3: 0,
          isCombo: 0,
          poise: 0,
          poise2: 0,
          poise3: 0,
        },
        scheduledSequences: [
          scheduled(
            6,
            sequence(
              step('applyKnockDown', {
                target: 'enemy',
                duration: { kind: 'constant', value: 2.1 },
                force: false,
                isExtra: false,
                targetFilter: 'aliveOnly',
                returnWhen: 'always',
              }),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale1' },
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                'abilityentity_chr_0015_lifeng_ultimate_skill:chr_0015_lifeng_ultimate_skill_abentity:/childSkill/scheduledSequences/0/sequence/steps/1',
              ),
            ),
            7,
          ),
          scheduled(
            66,
            sequence(
              step('applyKnockDown', {
                target: 'enemy',
                duration: { kind: 'constant', value: 2.1 },
                force: false,
                isExtra: false,
                targetFilter: 'aliveOnly',
                returnWhen: 'always',
              }),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale2' },
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise2' },
                },
                'abilityentity_chr_0015_lifeng_ultimate_skill:chr_0015_lifeng_ultimate_skill_abentity:/childSkill/scheduledSequences/1/sequence/steps/1',
              ),
            ),
            67,
          ),
          scheduled(
            121,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale3' },
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise3' },
                },
                'abilityentity_chr_0015_lifeng_ultimate_skill:chr_0015_lifeng_ultimate_skill_abentity:/childSkill/scheduledSequences/2/sequence/steps/0',
              ),
            ),
            122,
          ),
          scheduled(
            67,
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'isCombo', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(step('jumpTimeline', { destinationFrame: 150 })),
                sequence(
                  step('modifyActionValue', {
                    key: 'EntityBB_isCombo',
                    operation: 'assign',
                    value: { kind: 'constant', value: 0 },
                  }),
                ),
                { alwaysNext: true },
              ),
            ),
            68,
          ),
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default lifeng;
