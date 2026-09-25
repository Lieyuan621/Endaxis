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
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withSkillBlackboard,
} from './definitionHelpers';

const sharedActionSequence2: ActionSequenceDefinition = sequence(
  step('mergeContextTargets', { saveToContextKey: 'first', sources: [] }),
  step('mergeContextTargets', { saveToContextKey: 'second', sources: [] }),
  step('mergeContextTargets', { saveToContextKey: 'third', sources: [] }),
  step('mergeContextTargets', { saveToContextKey: 'forth', sources: [] }),
  step('mergeContextTargets', { saveToContextKey: 'fifth', sources: [] }),
  step('pickContextTarget', {
    sourceContextKey: 'placesorted',
    saveToContextKey: 'first',
    index: { kind: 'constant', value: 0 },
  }),
  step('pickContextTarget', {
    sourceContextKey: 'placesorted',
    saveToContextKey: 'second',
    index: { kind: 'constant', value: 1 },
  }),
  step('pickContextTarget', {
    sourceContextKey: 'placesorted',
    saveToContextKey: 'third',
    index: { kind: 'constant', value: 2 },
  }),
  step('pickContextTarget', {
    sourceContextKey: 'placesorted',
    saveToContextKey: 'forth',
    index: { kind: 'constant', value: 3 },
  }),
  step('pickContextTarget', {
    sourceContextKey: 'placesorted',
    saveToContextKey: 'fifth',
    index: { kind: 'constant', value: 4 },
  }),
);

const sharedActionSequence1: ActionSequenceDefinition = sequence(
  step('storeSourceAttributeValue', {
    attribute: { kind: 'specific', key: 'will' },
    stage: 'armedNonConverted',
    useFloor: false,
    divisor: { kind: 'constant', value: 1 },
    multiplier: { kind: 'constant', value: 1 },
    base: { kind: 'constant', value: 0 },
    targetKey: 'will',
  }),
  step('calculateActionValue', {
    key: 'rate_final',
    operation: 'multiply',
    left: { kind: 'blackboard', key: 'spell_vul_per_will' },
    right: { kind: 'blackboard', key: 'will' },
  }),
  branch(
    {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'rate_final', fallback: 0 },
      operator: 'lessOrEqual',
      right: { kind: 'blackboard', key: 'max_spell_vul_will', fallback: 0 },
    },
    sequence(
      step('calculateActionValue', {
        key: 'rate_final',
        operation: 'add',
        left: { kind: 'blackboard', key: 'rate_final' },
        right: { kind: 'blackboard', key: 'rate_pre' },
      }),
    ),
    sequence(
      step('calculateActionValue', {
        key: 'rate_final',
        operation: 'multiply',
        left: { kind: 'blackboard', key: 'max_spell_vul_will' },
        right: { kind: 'constant', value: 1 },
      }),
      step('calculateActionValue', {
        key: 'rate_final',
        operation: 'add',
        left: { kind: 'blackboard', key: 'rate_final' },
        right: { kind: 'blackboard', key: 'rate_pre' },
      }),
    ),
    { alwaysNext: true },
  ),
);

export const arcaneChr_0032_lizhiyan_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0032_lizhiyan_attack1',
    timelineBlockFrames: 10,
    naturalDurationFrames: 224,
    exclusiveFrame: 30,
    offsetRecordFrame: 10,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 3,
          endFrame: 30,
          input: 'basicAttack',
          targetSkillId: 'chr_0032_lizhiyan_attack2',
        },
      ],
      allowedNextSkills: [
        { startFrame: 10, endFrame: 30, skillIds: ['chr_0032_lizhiyan_attack2'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        10,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0032_lizhiyan_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0',
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
        12,
      ),
      scheduled(
        10,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0032_lizhiyan_attack1:/scheduledSequences/1/sequence/steps/0/body/steps/0',
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
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0032_lizhiyan_attack1:/scheduledSequences/1/sequence/steps/1/body/steps/0',
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
        12,
      ),
      scheduled(
        10,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0032_lizhiyan_attack2'] })),
        30,
      ),
    ],
    timelineContinuationSkillId: 'chr_0032_lizhiyan_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.062, 0.069, 0.075, 0.081, 0.087, 0.094, 0.1, 0.106, 0.112, 0.12, 0.129, 0.14],
    display_atk_scale: [0.19, 0.21, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42],
  },
);

export const arcaneChr_0032_lizhiyan_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0032_lizhiyan_attack2',
    timelineBlockFrames: 14,
    naturalDurationFrames: 215,
    exclusiveFrame: 30,
    offsetRecordFrame: 11,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 32,
          input: 'basicAttack',
          targetSkillId: 'chr_0032_lizhiyan_attack3',
        },
      ],
      allowedNextSkills: [
        { startFrame: 14, endFrame: 32, skillIds: ['chr_0032_lizhiyan_attack3'] },
      ],
    },
    costFrame: 11,
    scheduledSequences: [
      scheduled(
        11,
        sequence(
          forEachTarget(
            'enemy',
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0032_lizhiyan_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
            ),
          ),
        ),
        12,
      ),
      scheduled(
        12,
        sequence(
          forEachTarget(
            'enemy',
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0032_lizhiyan_attack2:/scheduledSequences/1/sequence/steps/0/body/steps/0',
              ),
            ),
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb' },
                coefficient: { kind: 'constant', value: 0.167 },
                recipient: 'team',
                spGainKind: 'gain',
                spGainSource: 'normalAttack',
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        13,
      ),
      scheduled(
        13,
        sequence(
          forEachTarget(
            'enemy',
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0032_lizhiyan_attack2:/scheduledSequences/2/sequence/steps/0/body/steps/0',
              ),
            ),
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb' },
                coefficient: { kind: 'constant', value: 0.167 },
                recipient: 'team',
                spGainKind: 'gain',
                spGainSource: 'normalAttack',
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        14,
      ),
      scheduled(
        14,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0032_lizhiyan_attack3'] })),
        32,
      ),
    ],
    timelineContinuationSkillId: 'chr_0032_lizhiyan_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.071, 0.078, 0.085, 0.092, 0.099, 0.107, 0.114, 0.121, 0.128, 0.137, 0.147, 0.16],
    poise: 0,
    rand_offset_x: 0,
    rand_offset_y: 0,
    rand_scale: 0,
    display_atk_scale: [0.21, 0.23, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.38, 0.41, 0.44, 0.48],
  },
);

export const arcaneChr_0032_lizhiyan_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0032_lizhiyan_attack3',
    timelineBlockFrames: 22,
    naturalDurationFrames: 235,
    exclusiveFrame: 30,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 39,
          input: 'basicAttack',
          targetSkillId: 'chr_0032_lizhiyan_attack4',
        },
      ],
      allowedNextSkills: [
        { startFrame: 22, endFrame: 39, skillIds: ['chr_0032_lizhiyan_attack4'] },
      ],
    },
    costFrame: 13,
    scheduledSequences: [
      scheduled(
        5,
        sequence(
          forEachTarget(
            'enemy',
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0032_lizhiyan_attack3:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
            ),
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb' },
                coefficient: { kind: 'constant', value: 0.167 },
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
        13,
        sequence(
          forEachTarget(
            'enemy',
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0032_lizhiyan_attack3:/scheduledSequences/1/sequence/steps/0/body/steps/0',
              ),
            ),
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb' },
                coefficient: { kind: 'constant', value: 0.167 },
                recipient: 'team',
                spGainKind: 'gain',
                spGainSource: 'normalAttack',
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        14,
      ),
      scheduled(
        22,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0032_lizhiyan_attack4'] })),
        39,
      ),
    ],
    timelineContinuationSkillId: 'chr_0032_lizhiyan_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.17, 0.18, 0.2, 0.22, 0.23, 0.25, 0.27, 0.28, 0.3, 0.32, 0.35, 0.38],
    poise: 0,
    display_atk_scale: [0.33, 0.37, 0.4, 0.43, 0.47, 0.5, 0.53, 0.57, 0.6, 0.64, 0.69, 0.75],
  },
);

export const arcaneChr_0032_lizhiyan_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0032_lizhiyan_attack4',
    timelineBlockFrames: 18,
    naturalDurationFrames: 230,
    exclusiveFrame: 26,
    offsetRecordFrame: 8,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 39,
          input: 'basicAttack',
          targetSkillId: 'chr_0032_lizhiyan_attack5',
        },
      ],
      allowedNextSkills: [
        { startFrame: 18, endFrame: 39, skillIds: ['chr_0032_lizhiyan_attack5'] },
      ],
    },
    costFrame: 13,
    scheduledSequences: [
      scheduled(
        2,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0032_lizhiyan_attack4:/scheduledSequences/0/sequence/steps/0',
          ),
        ),
        3,
      ),
      scheduled(
        5,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0032_lizhiyan_attack4:/scheduledSequences/1/sequence/steps/0',
          ),
        ),
        6,
      ),
      scheduled(
        8,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0032_lizhiyan_attack4:/scheduledSequences/2/sequence/steps/0',
          ),
        ),
        9,
      ),
      scheduled(
        11,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0032_lizhiyan_attack4:/scheduledSequences/3/sequence/steps/0',
          ),
        ),
        12,
      ),
      scheduled(
        2,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0032_lizhiyan_attack4:/scheduledSequences/4/sequence/steps/0',
          ),
        ),
        3,
      ),
      scheduled(
        5,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0032_lizhiyan_attack4:/scheduledSequences/5/sequence/steps/0',
          ),
        ),
        6,
      ),
      scheduled(
        8,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0032_lizhiyan_attack4:/scheduledSequences/6/sequence/steps/0',
          ),
        ),
        9,
      ),
      scheduled(
        11,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0032_lizhiyan_attack4:/scheduledSequences/7/sequence/steps/0',
          ),
        ),
        12,
      ),
      scheduled(
        4,
        sequence(
          forEachTarget(
            'enemy',
            sequence(
              branch(
                {
                  kind: 'not',
                  condition: {
                    kind: 'timedMarkerPresent',
                    target: 'caster',
                    markerId: 'lizhiyan_attack4',
                  },
                },
                sequence(
                  branch(
                    {
                      kind: 'buffIdStackCompare',
                      target: 'enemy',
                      buffIds: ['buff_chr_0032_lizhiyan_combo_skill_seal'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('createTimedMarker', {
                        target: 'caster',
                        markerId: 'lizhiyan_attack4',
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
        36,
      ),
      scheduled(
        18,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0032_lizhiyan_attack5'] })),
        39,
      ),
    ],
    timelineContinuationSkillId: 'chr_0032_lizhiyan_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.045, 0.049, 0.053, 0.058, 0.062, 0.067, 0.071, 0.076, 0.08, 0.086, 0.092, 0.1],
    display_atk_scale: [0.36, 0.39, 0.43, 0.46, 0.5, 0.53, 0.57, 0.61, 0.64, 0.69, 0.74, 0.8],
    poise: 0,
  },
);

export const arcaneChr_0032_lizhiyan_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0032_lizhiyan_attack5',
    timelineBlockFrames: 40,
    naturalDurationFrames: 300,
    exclusiveFrame: 41,
    offsetRecordFrame: 22,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 50,
          input: 'basicAttack',
          targetSkillId: 'chr_0032_lizhiyan_attack1',
        },
      ],
      allowedNextSkills: [
        { startFrame: 40, endFrame: 50, skillIds: ['chr_0032_lizhiyan_attack1'] },
      ],
    },
    costFrame: 13,
    scheduledSequences: [
      scheduled(
        22,
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
            'chr_0032_lizhiyan_attack5:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('modifyActionValue', {
                key: 'isHitbyMain',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
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
        23,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'isHitbyMain', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
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
                      time: 0,
                      value: 0.6,
                      inTangent: -7.07589,
                      outTangent: -7.07589,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.15,
                      value: 0.03,
                      inTangent: 0,
                      outTangent: 0,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.5,
                      value: 0.1,
                      inTangent: 0.4752959,
                      outTangent: 0.4752959,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 0.8,
                      inTangent: 2.06752,
                      outTangent: 2.06752,
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
        25,
      ),
      scheduled(
        22,
        sequence(
          forEachTarget(
            'enemy',
            sequence(
              branch(
                {
                  kind: 'not',
                  condition: {
                    kind: 'timedMarkerPresent',
                    target: 'caster',
                    markerId: 'lizhiyan_attack5',
                  },
                },
                sequence(
                  branch(
                    {
                      kind: 'buffIdStackCompare',
                      target: 'enemy',
                      buffIds: ['buff_chr_0032_lizhiyan_combo_skill_seal'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('createTimedMarker', {
                        target: 'caster',
                        markerId: 'lizhiyan_attack5',
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
        25,
      ),
      scheduled(
        40,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0032_lizhiyan_attack1'] })),
        50,
      ),
    ],
    timelineContinuationSkillId: 'chr_0032_lizhiyan_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 17,
    atk_scale: [0.47, 0.52, 0.56, 0.61, 0.66, 0.71, 0.75, 0.8, 0.85, 0.9, 0.98, 1.06],
    finish_angle1: 20,
    finish_angle2: 160,
    isHitbyMain: 0,
    poise: 17,
    start_angle1: 60,
    start_angle2: 120,
    display_atk_scale: [0.47, 0.52, 0.56, 0.61, 0.66, 0.71, 0.75, 0.8, 0.85, 0.9, 0.98, 1.06],
  },
);

export const arcaneChr_0032_lizhiyan_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0032_lizhiyan_power_attack',
    timelineBlockFrames: 34,
    naturalDurationFrames: 163,
    exclusiveFrame: 51,
    offsetRecordFrame: 21,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 34,
          endFrame: 51,
          skillIds: ['chr_0032_lizhiyan_normal_skill', 'chr_0032_lizhiyan_combo_skill'],
        },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        7,
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
            'chr_0032_lizhiyan_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
        ),
        8,
      ),
      scheduled(
        10,
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
            'chr_0032_lizhiyan_power_attack:/scheduledSequences/1/sequence/steps/0',
          ),
        ),
        11,
      ),
      scheduled(
        13,
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
            'chr_0032_lizhiyan_power_attack:/scheduledSequences/2/sequence/steps/0',
          ),
        ),
        14,
      ),
      scheduled(
        36,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.5,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0032_lizhiyan_power_attack:/scheduledSequences/3/sequence/steps/0',
          ),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.55 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.5,
                  inTangent: -7,
                  outTangent: -7,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.07,
                  value: 0.01,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.898291,
                  value: 0.1031128,
                  inTangent: 0.03048408,
                  outTangent: 0.03048408,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.3,
                  inTangent: 2.232943,
                  outTangent: 2.232943,
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
        39,
      ),
      scheduled(
        32,
        sequence(
          repeatEachTick(
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
                'chr_0032_lizhiyan_power_attack:/scheduledSequences/4/sequence/steps/0/body/steps/0',
              ),
            ),
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 2,
                targetTriggerIntervalSeconds: 0.067,
              },
            },
          ),
        ),
        35,
      ),
      scheduled(
        7,
        sequence(
          step('createTimedMarker', {
            target: 'caster',
            markerId: 'lizhiyan_power_attack_effect',
            durationSeconds: { kind: 'constant', value: 1 },
            autoFinishByAction: false,
          }),
        ),
        37,
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
        51,
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
        37,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const arcaneChr_0032_lizhiyan_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0032_lizhiyan_plunging_attack_end',
    timelineBlockFrames: 13,
    naturalDurationFrames: 120,
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
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'plungingAttack'],
            },
            'chr_0032_lizhiyan_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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

export const arcaneChr_0032_lizhiyan_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0032_lizhiyan_normal_skill',
    timelineBlockFrames: 33,
    naturalDurationFrames: 225,
    exclusiveFrame: 32,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 24, endFrame: 56, skillIds: ['chr_0032_lizhiyan_combo_skill'] },
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
        0,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_normal_skill',
            childSkillId: 'chr_0032_lizhiyan_normal_skill_abilityrange2',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'constant', value: 7 },
            blackboardAssignments: {
              EntityBB_wisd_greater_will: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will' },
            },
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
    atk_scale: 2.85,
    atk_scale_will: [1.33, 1.47, 1.6, 1.73, 1.87, 2, 2.13, 2.27, 2.4, 2.57, 2.77, 3],
    atk_scale_wisd: [2.22, 2.45, 2.67, 2.89, 3.11, 3.33, 3.56, 3.78, 4, 4.28, 4.61, 5],
    atk_scale_wisd_ratio: 1.5,
    cam_angle: 0,
    cam_duration: 0,
    consume_cnt: 0,
    duration: 6,
    input_angle: 0,
    poise: 10,
    radius: 5,
  },
);

export const arcaneChr_0032_lizhiyan_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0032_lizhiyan_combo_skill',
    timelineBlockFrames: 24,
    naturalDurationFrames: 122,
    exclusiveFrame: 23,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 16, endFrame: 39, skillIds: ['chr_0032_lizhiyan_normal_skill'] },
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
              left: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('calculateActionValue', {
                key: 'duration_final',
                operation: 'add',
                left: { kind: 'blackboard', key: 'duration_pre' },
                right: { kind: 'blackboard', key: 'duration' },
              }),
              step('calculateActionValue', {
                key: 'trigger_time',
                operation: 'add',
                left: { kind: 'blackboard', key: 'duration_final' },
                right: { kind: 'constant', value: -0.5 },
              }),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'rate_final',
                    operation: 'assign',
                    value: { kind: 'blackboard', key: 'rate_pre' },
                  }),
                ),
                sharedActionSequence1,
                { alwaysNext: true },
              ),
            ),
            sequence(
              step('calculateActionValue', {
                key: 'duration',
                operation: 'add',
                left: { kind: 'constant', value: 0 },
                right: { kind: 'blackboard', key: 'duration_will' },
              }),
              step('calculateActionValue', {
                key: 'duration_final',
                operation: 'add',
                left: { kind: 'blackboard', key: 'duration_pre' },
                right: { kind: 'blackboard', key: 'duration' },
              }),
              step('calculateActionValue', {
                key: 'trigger_time',
                operation: 'add',
                left: { kind: 'blackboard', key: 'duration_final' },
                right: { kind: 'constant', value: -0.5 },
              }),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'rate_final',
                    operation: 'assign',
                    value: { kind: 'blackboard', key: 'rate_pre' },
                  }),
                ),
                sharedActionSequence1,
                { alwaysNext: true },
              ),
            ),
            { alwaysNext: true },
          ),
        ),
        3,
      ),
      scheduled(
        9,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.033 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'RESETto1' },
            finishByAction: false,
            ignoredTargets: [],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        10,
      ),
      scheduled(
        9,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_combo_skill',
            childSkillId: 'chr_032_lizhiyan_combo_skill_abilityentity_seal',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'constant', value: 40 },
            saveToContextKey: 'bunshin1',
            blackboardAssignments: {
              EntityBB_wisd_greater_will: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will' },
            },
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_combo_skill',
            childSkillId: 'chr_032_lizhiyan_combo_skill_abilityentity_seal',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'constant', value: 40 },
            saveToContextKey: 'bunshin2',
            blackboardAssignments: {
              EntityBB_wisd_greater_will: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will' },
            },
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_combo_skill',
            childSkillId: 'chr_032_lizhiyan_combo_skill_abilityentity_seal',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'constant', value: 40 },
            saveToContextKey: 'bunshin3',
            blackboardAssignments: {
              EntityBB_wisd_greater_will: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will' },
            },
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_combo_skill',
            childSkillId: 'chr_032_lizhiyan_combo_skill_abilityentity_seal',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'constant', value: 40 },
            saveToContextKey: 'bunshin4',
            blackboardAssignments: {
              EntityBB_wisd_greater_will: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will' },
            },
          }),
          forEachContextTarget(
            'bunshin1',
            sequence(
              step('setAbilityEntityRemainingDuration', {
                value: { kind: 'constant', value: 0.5 },
              }),
            ),
          ),
          forEachContextTarget(
            'bunshin2',
            sequence(
              step('setAbilityEntityRemainingDuration', {
                value: { kind: 'constant', value: 0.5 },
              }),
            ),
          ),
          forEachContextTarget(
            'bunshin3',
            sequence(
              step('setAbilityEntityRemainingDuration', {
                value: { kind: 'constant', value: 0.5 },
              }),
            ),
          ),
          forEachContextTarget(
            'bunshin4',
            sequence(
              step('setAbilityEntityRemainingDuration', {
                value: { kind: 'constant', value: 0.5 },
              }),
            ),
          ),
        ),
        10,
      ),
      scheduled(
        9,
        sequence(
          forEachContextTarget(
            'bunshin1',
            sequence(
              step('setAbilityEntityRemainingDuration', { value: { kind: 'constant', value: 30 } }),
            ),
          ),
          forEachContextTarget(
            'bunshin2',
            sequence(
              step('setAbilityEntityRemainingDuration', { value: { kind: 'constant', value: 30 } }),
            ),
          ),
          forEachContextTarget(
            'bunshin3',
            sequence(
              step('setAbilityEntityRemainingDuration', { value: { kind: 'constant', value: 30 } }),
            ),
          ),
          forEachContextTarget(
            'bunshin4',
            sequence(
              step('setAbilityEntityRemainingDuration', { value: { kind: 'constant', value: 30 } }),
            ),
          ),
        ),
        12,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0032_lizhiyan_combo_skill_precheck',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        11,
      ),
      scheduled(
        9,
        sequence(
          step('calculateActionValue', {
            key: 'duration_total',
            operation: 'add',
            left: { kind: 'blackboard', key: 'duration_final' },
            right: { kind: 'constant', value: 0.067 },
          }),
        ),
        12,
      ),
      scheduled(
        9,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_total',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration_total: 'duration_total',
              duration_final: 'duration_final',
              rate_final: 'rate_final',
              trigger_time: 'trigger_time',
              isWisd: 'EntityBB_wisd_greater_will',
              atk_scale_boom: 'atk_scale_boom',
              poise_boom: 'poise_boom',
              radius: 'radius',
              duration_seal2: 'duration',
              rate_pre: 'rate_pre',
              atk_scale_touch: 'atk_scale_touch',
              poise_touch: 'poise_touch',
              usp: 'usp',
              atb_return_wisd: 'atb_return_wisd',
            },
          }),
        ),
        30,
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
    cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 570, 570, 570, 540],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atb_return_wisd: [28, 28, 28, 28, 28, 28, 28, 28, 28, 30, 30, 30],
    atk_scale_boom: [0.53, 0.59, 0.64, 0.69, 0.75, 0.8, 0.85, 0.91, 0.96, 1.03, 1.11, 1.2],
    atk_scale_laser1: [0.27, 0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.45, 0.48, 0.51, 0.55, 0.6],
    atk_scale_laser2: [1.15, 1.27, 1.38, 1.5, 1.62, 1.73, 1.85, 1.96, 2.08, 2.22, 2.39, 2.6],
    atk_scale_touch: [0.35, 0.39, 0.42, 0.46, 0.5, 0.53, 0.57, 0.6, 0.64, 0.68, 0.73, 0.8],
    atk_scale_wisd_ratio: 5,
    cd_reduce: 0,
    consumed_layer: 0,
    consumed_type: 0,
    duration: 4,
    duration_effect: 0,
    duration_extra: 6,
    duration_final: 0,
    duration_pre: 0.633,
    duration_seal2: 0,
    duration_total: 0,
    duration_will: 6,
    max_spell_vul_will: [0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.07, 0.075, 0.075, 0.075, 0.08],
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    poise_boom: 5,
    poise_laser: 0,
    poise_touch: 5,
    radius: 5.67,
    rate: 0.4,
    rate_final: 0,
    rate_pre: 0.04,
    spell_vul_per_will: 0.000125,
    trigger_time: 0,
    usp: 10,
    will: 0,
    display_atk_scale_laser_wisd: [
      2.22, 2.44, 2.66, 2.89, 3.11, 3.33, 3.55, 3.77, 4, 4.27, 4.61, 5,
    ],
    display_max_spell_vul_will: [560, 560, 560, 560, 560, 560, 560, 560, 600, 600, 600, 640],
    duration_wisd: 2,
  },
);

export const arcaneChr_0032_lizhiyan_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0032_lizhiyan_ultimate_skill',
    timelineBlockFrames: 73,
    naturalDurationFrames: 308,
    exclusiveFrame: 72,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 48,
          endFrame: 79,
          skillIds: ['chr_0032_lizhiyan_combo_skill', 'chr_0032_lizhiyan_normal_skill'],
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
            buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_time_dilation_listener',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        44,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 47),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        47,
      ),
      scheduled(
        0,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: [
              'buff_chr_0032_lizhiyan_ultimate_skill_listener',
              'buff_chr_0032_lizhiyan_ultimate_skill_layer',
            ],
            reason: 'other',
          }),
        ),
        3,
      ),
      scheduled(
        41,
        sequence(
          step('modifyActionValue', {
            key: 'isWisd',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will' },
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill',
            childSkillId: 'chr_0032_lizhiyan_ultimate_skill_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'blackboard', key: 'duration_aura' },
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'blackboard', key: 'duration_aura' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 0 } },
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'blackboard', key: 'duration_aura' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 1 } },
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'blackboard', key: 'duration_aura' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 2 } },
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'blackboard', key: 'duration_aura' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 3 } },
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'blackboard', key: 'duration_aura' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 4 } },
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'blackboard', key: 'duration_aura' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 5 } },
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'blackboard', key: 'duration_aura' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 6 } },
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            overrideDurationSeconds: { kind: 'blackboard', key: 'duration_aura' },
            blackboardAssignments: { EntityBB_index: { kind: 'constant', value: 7 } },
          }),
          step('setIgnoreGlobalTimeScale', {
            abilityEntityTargets: [
              {
                kind: 'ownerSpawned',
                abilityEntityIds: [
                  'abilityentity_chr_0032_lizhiyan_ultimate_skill',
                  'abilityentity_chr_0032_lizhiyan_ultimate_skill_place',
                ],
              },
            ],
            ignore: true,
            revertOnEnd: true,
          }),
        ),
        55,
      ),
      scheduled(
        0,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey:
              '__finishOwner:SkillData.chr_0032_lizhiyan_ultimate_skill.actionGroupData.timelineActions[14]._sequenceActionData.actionData[0]',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
          }),
          forEachContextTarget(
            '__finishOwner:SkillData.chr_0032_lizhiyan_ultimate_skill.actionGroupData.timelineActions[14]._sequenceActionData.actionData[0]',
            sequence(step('finishCurrentAbilityEntity', {})),
          ),
        ),
        3,
      ),
      scheduled(
        47,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_listener_owner',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'duration',
              isWisd: 'EntityBB_wisd_greater_will',
            },
          }),
        ),
        50,
      ),
      scheduled(
        0,
        sequence(
          step('restrictUltimateEnergyRecovery', {
            target: 'caster',
            allowedRecoveryTags: ['Skill/Character/chr_0032_lizhiyan/special_usp'],
            clearUltimateEnergyOnEnd: false,
          }),
        ),
        47,
      ),
      scheduled(
        47,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_common_natural_natural_corrupt_triggered',
                target: 'enemy',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: { count: 'count', duration: 'duration2' },
              }),
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
                      buffTags: ['Skill/Character/Common/SpellInflict/NaturalInflict'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('applyElementalInfliction', { element: 'nature', isExtra: false }),
                    ),
                    sequence(
                      branch(
                        {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                        sequence(
                          step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
                        ),
                        sequence(
                          branch(
                            {
                              kind: 'buffStackCompare',
                              target: 'enemy',
                              tagQueryType: 'hasAny',
                              buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                              operator: 'greaterOrEqual',
                              value: { kind: 'constant', value: 1 },
                            },
                            sequence(
                              step('applyElementalInfliction', {
                                element: 'electric',
                                isExtra: false,
                              }),
                            ),
                            sequence(
                              branch(
                                {
                                  kind: 'buffStackCompare',
                                  target: 'enemy',
                                  tagQueryType: 'hasAny',
                                  buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
                                  operator: 'greaterOrEqual',
                                  value: { kind: 'constant', value: 1 },
                                },
                                sequence(
                                  step('applyElementalInfliction', {
                                    element: 'heat',
                                    isExtra: false,
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
                    { alwaysNext: true },
                  ),
                ),
              ),
            ),
            { alwaysNext: true },
          ),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(),
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0032_lizhiyan_talent1'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('readBuffBlackboard', {
                    target: 'caster',
                    query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
                    desiredKey: 'spell_vul_rate',
                    outputKey: 'spell_vul_rate',
                  }),
                  step('readBuffBlackboard', {
                    target: 'caster',
                    query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
                    desiredKey: 'spell_vul_rate_potential',
                    outputKey: 'spell_vul_rate_potential',
                  }),
                  step('calculateActionValue', {
                    key: 'spell_vul_rate_calc',
                    operation: 'add',
                    left: { kind: 'blackboard', key: 'spell_vul_rate' },
                    right: { kind: 'blackboard', key: 'spell_vul_rate_potential' },
                  }),
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'spell_vul_rate_calc', fallback: 0 },
                      operator: 'greater',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('readBuffBlackboard', {
                        target: 'caster',
                        query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
                        desiredKey: 'duration',
                        outputKey: 'duration_vul',
                      }),
                      step('readBuffBlackboard', {
                        target: 'caster',
                        query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
                        desiredKey: 'spell_vul_rate_per_will',
                        outputKey: 'spell_vul_rate_per_will',
                      }),
                      step('storeSourceAttributeValue', {
                        attribute: { kind: 'specific', key: 'will' },
                        stage: 'armedNonConverted',
                        useFloor: false,
                        divisor: { kind: 'constant', value: 1 },
                        multiplier: { kind: 'constant', value: 1 },
                        base: { kind: 'constant', value: 0 },
                        targetKey: 'will',
                      }),
                      step('calculateActionValue', {
                        key: 'spell_vul_rate_calc',
                        operation: 'multiply',
                        left: { kind: 'blackboard', key: 'will' },
                        right: { kind: 'blackboard', key: 'spell_vul_rate_per_will' },
                      }),
                      branch(
                        {
                          kind: 'actionValueCompare',
                          left: { kind: 'blackboard', key: 'spell_vul_rate_calc', fallback: 0 },
                          operator: 'lessOrEqual',
                          right: { kind: 'blackboard', key: 'spell_vul_rate', fallback: 0 },
                        },
                        sequence(
                          step('modifyActionValue', {
                            key: 'spell_vul_rate_calc',
                            operation: 'add',
                            value: { kind: 'blackboard', key: 'spell_vul_rate_potential' },
                          }),
                          step('applyBuff', {
                            buffId: 'buff_chr_0032_lizhiyan_talent1_vulnerable',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: {
                              rate: 'spell_vul_rate_calc',
                              duration: 'duration_vul',
                            },
                          }),
                        ),
                        sequence(
                          step('modifyActionValue', {
                            key: 'spell_vul_rate',
                            operation: 'add',
                            value: { kind: 'blackboard', key: 'spell_vul_rate_potential' },
                          }),
                          step('applyBuff', {
                            buffId: 'buff_chr_0032_lizhiyan_talent1_vulnerable',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: {
                              rate: 'spell_vul_rate',
                              duration: 'duration_vul',
                            },
                          }),
                        ),
                        { alwaysNext: true },
                      ),
                    ),
                  ),
                ),
              ),
            ),
            { alwaysNext: true },
          ),
          step(
            'dealDamage',
            {
              damageType: 'nature',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0032_lizhiyan_ultimate_skill:/scheduledSequences/9/sequence/steps/2',
          ),
        ),
        47,
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
        72,
      ),
      scheduled(48, sequence(step('markCurrentSkillCanDash', {})), 79),
    ],
    cooldownFrames: 600,
    costs: [{ resource: 'ultimateEnergy', value: 100 }],
    enhancementStateBuffId: 'buff_chr_0032_lizhiyan_ultimate_skill_listener_owner',
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    atk_scale_laser: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.38, 0.41, 0.45],
    atk_scale_laser_will: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.38, 0.41, 0.45],
    count: 1,
    duration: 20,
    duration_aura: 60,
    duration_vul: 0,
    duration2: 15,
    isWisd: 1,
    lv: 0,
    poise: 10,
    radius: 30,
    select_radius: 10,
    spell_vul_rate: 0,
    spell_vul_rate_calc: 0,
    spell_vul_rate_per_will: 0,
    spell_vul_rate_potential: 0,
    will: 0,
    display_atk_scale_laser: [1.6, 1.76, 1.92, 2.08, 2.24, 2.4, 2.56, 2.72, 2.88, 3.08, 3.32, 3.6],
    display_atk_scale_laser_will: [
      1.6, 1.76, 1.92, 2.08, 2.24, 2.4, 2.56, 2.72, 2.88, 3.08, 3.32, 3.6,
    ],
    laser_count: 8,
  },
);

export const arcaneChr_0032_lizhiyan_ultimate_skill2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0032_lizhiyan_ultimate_skill2',
    timelineBlockFrames: 76,
    naturalDurationFrames: 287,
    exclusiveFrame: 75,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 60,
          endFrame: 91,
          skillIds: ['chr_0032_lizhiyan_normal_skill', 'chr_0032_lizhiyan_combo_skill'],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0032_lizhiyan_talent1'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('readBuffBlackboard', {
                target: 'caster',
                query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
                desiredKey: 'enhance_rate',
                outputKey: 'enhance_rate',
              }),
              step('readBuffBlackboard', {
                target: 'caster',
                query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
                desiredKey: 'spell_vul_rate',
                outputKey: 'spell_vul_rate',
              }),
              step('readBuffBlackboard', {
                target: 'caster',
                query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
                desiredKey: 'lv',
                outputKey: 'lv',
              }),
              step('readBuffBlackboard', {
                target: 'caster',
                query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
                desiredKey: 'spell_vul_rate_potential',
                outputKey: 'spell_vul_rate_potential',
              }),
              step('calculateActionValue', {
                key: 'spell_vul_rate_calc',
                operation: 'add',
                left: { kind: 'blackboard', key: 'spell_vul_rate' },
                right: { kind: 'blackboard', key: 'spell_vul_rate_potential' },
              }),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'enhance_rate', fallback: 0 },
                      operator: 'greater',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0032_lizhiyan_talent1_enhance',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                        finishByAction: true,
                        asChildBuff: true,
                        copiedBlackboardAssignments: { enhance_rate: 'enhance_rate' },
                      }),
                    ),
                  ),
                ),
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'spell_vul_rate_calc', fallback: 0 },
                      operator: 'greater',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('readBuffBlackboard', {
                        target: 'caster',
                        query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
                        desiredKey: 'duration',
                        outputKey: 'duration_vul',
                      }),
                      step('readBuffBlackboard', {
                        target: 'caster',
                        query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
                        desiredKey: 'spell_vul_rate_per_will',
                        outputKey: 'spell_vul_rate_per_will',
                      }),
                      step('storeSourceAttributeValue', {
                        attribute: { kind: 'specific', key: 'will' },
                        stage: 'armedNonConverted',
                        useFloor: false,
                        divisor: { kind: 'constant', value: 1 },
                        multiplier: { kind: 'constant', value: 1 },
                        base: { kind: 'constant', value: 0 },
                        targetKey: 'will',
                      }),
                      step('calculateActionValue', {
                        key: 'spell_vul_rate_calc',
                        operation: 'multiply',
                        left: { kind: 'blackboard', key: 'will' },
                        right: { kind: 'blackboard', key: 'spell_vul_rate_per_will' },
                      }),
                      branch(
                        {
                          kind: 'actionValueCompare',
                          left: { kind: 'blackboard', key: 'spell_vul_rate_calc', fallback: 0 },
                          operator: 'lessOrEqual',
                          right: { kind: 'blackboard', key: 'spell_vul_rate', fallback: 0 },
                        },
                        sequence(
                          step('modifyActionValue', {
                            key: 'spell_vul_rate',
                            operation: 'assign',
                            value: { kind: 'blackboard', key: 'spell_vul_rate_calc' },
                          }),
                          step('modifyActionValue', {
                            key: 'spell_vul_rate',
                            operation: 'add',
                            value: { kind: 'blackboard', key: 'spell_vul_rate_potential' },
                          }),
                        ),
                        sequence(
                          step('modifyActionValue', {
                            key: 'spell_vul_rate',
                            operation: 'add',
                            value: { kind: 'blackboard', key: 'spell_vul_rate_potential' },
                          }),
                        ),
                        { alwaysNext: true },
                      ),
                    ),
                  ),
                ),
                { alwaysNext: true },
              ),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        287,
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
          step('applyBuff', {
            buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_time_dilation_listener',
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
          step('finishBuffsById', {
            target: 'caster',
            buffIds: [
              'buff_chr_0032_lizhiyan_ultimate_skill_listener',
              'buff_chr_0032_lizhiyan_ultimate_skill_layer',
            ],
            reason: 'other',
          }),
        ),
        3,
      ),
      scheduled(
        57,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'ult_abilityentity',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
          }),
          forEachContextTarget(
            'ult_abilityentity',
            sequence(step('finishCurrentAbilityEntity', {})),
          ),
        ),
        58,
      ),
      scheduled(
        0,
        sequence(
          step('changeSkillSlot', {
            skillGroupKey: 'ultimate',
            targetSkillKey: 'chr_0032_lizhiyan_ultimate_skill',
            inheritOriginSkillCooldownProgress: false,
            lifetime: 'infinite',
          }),
        ),
        3,
      ),
      scheduled(
        58,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'spell_vul_rate', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0032_lizhiyan_talent1_vulnerable',
                    target: 'enemy',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: {
                      rate: 'spell_vul_rate',
                      duration: 'duration_vul',
                    },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_will' },
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                'chr_0032_lizhiyan_ultimate_skill2:/scheduledSequences/6/sequence/steps/0/whenTrue/steps/1',
              ),
            ),
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
                'chr_0032_lizhiyan_ultimate_skill2:/scheduledSequences/6/sequence/steps/0/whenFalse/steps/0',
              ),
            ),
            { alwaysNext: true },
          ),
        ),
        58,
      ),
      scheduled(
        60,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 15,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.7,
                  inTangent: -6.591719,
                  outTangent: -6.591719,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1,
                  value: 0.015,
                  inTangent: 0.03159265,
                  outTangent: 0.03159265,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7484403,
                  value: 0.1815591,
                  inTangent: 0.9312042,
                  outTangent: 0.9312042,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 0.7,
                  inTangent: 2.428422,
                  outTangent: 2.428422,
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
        63,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'all',
              conditions: [
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'cd_minus', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
              ],
            },
            sequence(
              step('adjustSkillCooldown', {
                target: 'caster',
                skill: { kind: 'id', skillId: 'chr_0032_lizhiyan_combo_skill' },
                operation: 'reduce',
                basis: 'baseDurationRatio',
                value: { kind: 'blackboard', key: 'cd_minus' },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        3,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 50),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        50,
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
        59,
      ),
      scheduled(
        59,
        sequence(
          step('applyBuff', {
            buffId: 'buff_common_damage_immune_medium',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        75,
      ),
    ],
    cooldownFrames: 300,
    costs: [{ resource: 'ultimateEnergy', value: 100 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'normalSkill',
  },
  {
    atk_scale: [6.4, 7.04, 7.68, 8.32, 8.96, 9.6, 10.24, 10.88, 11.52, 12.32, 13.28, 14.4],
    atk_scale_will: [1.6, 1.76, 1.92, 2.08, 2.24, 2.4, 2.56, 2.72, 2.88, 3.08, 3.32, 3.6],
    cd_minus: 0,
    duration_vul: 0,
    enhance_rate: 0,
    lv: 0,
    poise: 10,
    spell_vul_rate: 0,
    spell_vul_rate_calc: 0,
    spell_vul_rate_per_will: 0,
    spell_vul_rate_potential: 0,
    will: 0,
  },
);

export const arcaneCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const arcane: OperatorDefinition = {
  slug: 'arcane',
  gameId: 'ARCANE',
  rarity: 6,
  weaponType: 'arts-unit',
  element: 'nature',
  role: 'caster',
  mainAttribute: 'intellect',
  secondaryAttribute: 'will',
  attributes: {
    strength: [9, 26, 45, 64, 82, 91],
    agility: [9, 27, 46, 65, 84, 93],
    intellect: [21, 54, 89, 124, 159, 176],
    will: [14, 37, 61, 85, 109, 121],
    baseAttack: [30, 90, 153, 217, 280, 312],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  trustAttributeBonus: { values: [8, 10, 10, 15], attributes: ['intellect', 'will'] },
  passiveUi: { kind: 'numeric', appearance: 'arcaneSigils', maximum: 3 },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        arcaneChr_0032_lizhiyan_attack1,
        arcaneChr_0032_lizhiyan_attack2,
        arcaneChr_0032_lizhiyan_attack3,
        arcaneChr_0032_lizhiyan_attack4,
        arcaneChr_0032_lizhiyan_attack5,
      ],
      presentationVariants: [
        {
          key: 'int',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
        {
          key: 'will',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
        },
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: arcaneChr_0032_lizhiyan_power_attack,
      presentationVariants: [
        {
          key: 'int',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
        {
          key: 'will',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
        },
      ],
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: arcaneChr_0032_lizhiyan_plunging_attack_end,
      presentationVariants: [
        {
          key: 'int',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
        {
          key: 'will',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
        },
      ],
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: arcaneChr_0032_lizhiyan_normal_skill,
      presentationVariants: [
        {
          key: 'int',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
        {
          key: 'will',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
        },
      ],
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: arcaneChr_0032_lizhiyan_combo_skill,
      presentationVariants: [
        {
          key: 'int',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
        {
          key: 'will',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
        },
      ],
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: arcaneChr_0032_lizhiyan_ultimate_skill,
      replacementSkills: [arcaneChr_0032_lizhiyan_ultimate_skill2],
      replacementSkillPlacements: { chr_0032_lizhiyan_ultimate_skill2: 'standard' },
      presentationVariants: [
        {
          key: 'int',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
        {
          key: 'will',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
        },
      ],
    },
  ],
  dodgeSkill: arcaneCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0032_lizhiyan_normal_skill',
      replacementSkillKeys: [],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0032_lizhiyan_combo_skill', replacementSkillKeys: [] },
    {
      key: 'ultimate',
      baseSkillKey: 'chr_0032_lizhiyan_ultimate_skill',
      replacementSkillKeys: ['chr_0032_lizhiyan_ultimate_skill2'],
    },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0032_lizhiyan_attack1',
        'chr_0032_lizhiyan_attack2',
        'chr_0032_lizhiyan_attack3',
        'chr_0032_lizhiyan_attack4',
        'chr_0032_lizhiyan_attack5',
        'chr_0032_lizhiyan_plunging_attack_end',
        'chr_0032_lizhiyan_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0032_lizhiyan_attack1',
        'chr_0032_lizhiyan_attack2',
        'chr_0032_lizhiyan_attack3',
        'chr_0032_lizhiyan_attack4',
        'chr_0032_lizhiyan_attack5',
      ],
      defaultSkillKey: 'chr_0032_lizhiyan_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0032_lizhiyan_combo_skill',
      event: 'beforeTakeInfliction',
      immediately: false,
      initialValues: { consumed_layer: 0, consumed_type: 0 },
      sequence: sequence(
        branch(
          { kind: 'contextTargetObjectTypeMatch', contextKey: 'trigger', objectTypes: ['enemy'] },
          sequence(branch({ kind: 'eventInflictionElementIn', elements: ['nature'] }, sequence())),
        ),
      ),
    },
    {
      key: 'native-combo:1',
      skillKey: 'chr_0032_lizhiyan_combo_skill',
      event: 'beforeTakeInfliction',
      immediately: false,
      initialValues: { consumed_layer: 0, consumed_type: 0 },
      sequence: sequence(
        branch(
          { kind: 'contextTargetObjectTypeMatch', contextKey: 'trigger', objectTypes: ['enemy'] },
          sequence(
            branch(
              { kind: 'eventInflictionElementIn', elements: ['heat'] },
              sequence(
                branch(
                  {
                    kind: 'contextTargetBuffStackCompare',
                    contextKey: 'trigger',
                    tagQueryType: 'hasAny',
                    buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 1 },
                  },
                  sequence(),
                ),
              ),
            ),
          ),
        ),
      ),
    },
    {
      key: 'native-combo:2',
      skillKey: 'chr_0032_lizhiyan_combo_skill',
      event: 'beforeTakeInfliction',
      immediately: false,
      initialValues: { consumed_layer: 0, consumed_type: 0 },
      sequence: sequence(
        branch(
          { kind: 'contextTargetObjectTypeMatch', contextKey: 'trigger', objectTypes: ['enemy'] },
          sequence(
            branch(
              { kind: 'eventInflictionElementIn', elements: ['electric'] },
              sequence(
                branch(
                  {
                    kind: 'contextTargetBuffStackCompare',
                    contextKey: 'trigger',
                    tagQueryType: 'hasAny',
                    buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 1 },
                  },
                  sequence(),
                ),
              ),
            ),
          ),
        ),
      ),
    },
    {
      key: 'native-combo:3',
      skillKey: 'chr_0032_lizhiyan_combo_skill',
      event: 'beforeTakeInfliction',
      immediately: false,
      initialValues: { consumed_layer: 0, consumed_type: 0 },
      sequence: sequence(
        branch(
          { kind: 'contextTargetObjectTypeMatch', contextKey: 'trigger', objectTypes: ['enemy'] },
          sequence(
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
                    value: { kind: 'constant', value: 1 },
                  },
                  sequence(),
                ),
              ),
            ),
          ),
        ),
      ),
    },
    {
      key: 'native-combo:4',
      skillKey: 'chr_0032_lizhiyan_combo_skill',
      event: 'beforeTakeInfliction',
      immediately: false,
      initialValues: { consumed_layer: 0, consumed_type: 0 },
      sequence: sequence(
        branch(
          {
            kind: 'actionValueCompare',
            left: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
            operator: 'less',
            right: { kind: 'constant', value: 1 },
          },
          sequence(
            branch(
              {
                kind: 'eventInflictionElementIn',
                elements: ['heat', 'electric', 'cryo', 'nature'],
                outputKey: 'EntityBB_consumed_type',
              },
              sequence(),
            ),
          ),
        ),
      ),
    },
  ],
  comboSkillPriority: 'enemyRank',
  talents: [
    {
      levels: 2,
      modifiers: [
        {
          kind: 'addSkillCooldownFrames',
          skillGroupKey: 'comboSkill',
          frames: -180,
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
      ],
      passiveSkills: [
        {
          key: 'chr_0032_lizhiyan_talent1',
          blackboard: {
            duration: [10, 10],
            enhance_rate: [0, 0.24],
            lv: [1, 2],
            spell_vul_rate: [0, 0.128],
            spell_vul_rate_per_will: [0, 0.0002],
            spell_vul_rate_potential: [0, 0],
          },
          enableSequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0032_lizhiyan_talent1',
              target: 'caster',
              inheritSourceSkillCastInfo: false,
              blackboardAssignments: {
                duration: { kind: 'blackboard', key: 'duration' },
                enhance_rate: { kind: 'blackboard', key: 'enhance_rate' },
                lv: { kind: 'blackboard', key: 'lv' },
                spell_vul_rate: { kind: 'blackboard', key: 'spell_vul_rate' },
                spell_vul_rate_per_will: { kind: 'blackboard', key: 'spell_vul_rate_per_will' },
                spell_vul_rate_potential: { kind: 'blackboard', key: 'spell_vul_rate_potential' },
              },
            }),
          ),
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        { kind: 'addReactionDuration', reaction: 'corrosion', seconds: [5, 10] },
        { kind: 'addReactionEffectiveness', reaction: 'corrosion', value: [0.05, 0.1] },
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
          blackboardKey: 'atk_scale_touch',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale_boom',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale_laser1',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atk_scale_laser2',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atb_return_wisd',
          operation: 'add',
          value: 10,
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'greaterOrEqual',
            right: 'will',
          },
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'rate_pre',
          operation: 'add',
          value: 0.06,
          condition: {
            kind: 'deckAttributeCompare',
            left: 'intellect',
            operator: 'less',
            right: 'will',
          },
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['will'], value: 15 },
        { kind: 'modifyBasePanelStat', stat: 'artsIntensity', operation: 'flat', value: 16 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addReactionDuration', reaction: 'corrosion', seconds: 5 },
        { kind: 'addReactionEffectiveness', reaction: 'corrosion', value: 0.2 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'multiplySkillCost',
          skillGroupKey: 'ultimate',
          skillKey: 'chr_0032_lizhiyan_ultimate_skill',
          resource: 'ultimateEnergy',
          multiplier: 0.85,
        },
        {
          kind: 'multiplySkillCost',
          skillGroupKey: 'ultimate',
          skillKey: 'chr_0032_lizhiyan_ultimate_skill2',
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
          passiveSkillKey: 'chr_0032_lizhiyan_talent1',
          blackboardKey: 'enhance_rate',
          operation: 'add',
          value: 0.16,
        },
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0032_lizhiyan_talent1',
          blackboardKey: 'spell_vul_rate_potential',
          operation: 'add',
          value: 0.07,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          skillKey: 'chr_0032_lizhiyan_ultimate_skill2',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          skillKey: 'chr_0032_lizhiyan_ultimate_skill2',
          blackboardKey: 'cd_minus',
          operation: 'add',
          value: 0.3,
        },
      ],
    },
  ],
  entityBlackboard: {
    EntityBB_consumed_layer: 0,
    EntityBB_consumed_type: 0,
    EntityBB_ult_hit: 0,
    EntityBB_wisd_greater_will: 1,
  },
  passiveSkills: [
    {
      key: 'chr_0032_lizhiyan_passive',
      enableSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0032_lizhiyan_passive',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
        }),
      ),
    },
  ],
  entityBlackboardInitializers: [
    {
      key: 'EntityBB_wisd_greater_will',
      condition: {
        kind: 'deckAttributeCompare',
        left: 'intellect',
        operator: 'greaterOrEqual',
        right: 'will',
      },
      trueValue: 1,
      falseValue: 0,
    },
  ],
  buffDefinitions: {
    buff_chr_0032_lizhiyan_combo_skill_precheck: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      triggerIntervalSeconds: 0,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0032_lizhiyan_combo_skill_seal: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: { blackboardKey: 'trigger_time' },
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 5, isWisd: 0, rate_pre: 0.1, trigger_time: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable_pre',
            target: 'enemy',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { duration_vul: 'duration', rate: 'rate_pre' },
          }),
        ),
        trigger: sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'bunshin',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_combo_skill'],
            sameSourceSkillCast: true,
          }),
          forEachContextTarget(
            'bunshin',
            sequence(
              step('startCurrentAbilityEntityChildSkillById', {
                childSkillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_end',
              }),
            ),
          ),
        ),
      },
    },
    buff_chr_0032_lizhiyan_combo_skill_seal_atb: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 0.1,
      triggerIntervalSeconds: 0,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0032_lizhiyan_combo_skill_seal_bunshin_end_listener: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      triggerIntervalSeconds: 0,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: {
        atb_return_wisd: 10,
        atk_scale_early_finish: 1,
        poise_early_finish: 1,
        radius_early_finish: 5.67,
      },
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
                buffIds: ['buff_chr_0032_lizhiyan_combo_skill_seal2'],
                operator: 'less',
                value: { kind: 'constant', value: 1 },
                sameSourceSkillCast: true,
              },
              sequence(
                branch(
                  {
                    kind: 'buffIdStackCompare',
                    target: 'buffOwner',
                    buffIds: ['buff_chr_0032_lizhiyan_combo_skill_seal_atb'],
                    operator: 'less',
                    value: { kind: 'constant', value: 1 },
                    sameSourceSkillCast: true,
                  },
                  sequence(
                    branch(
                      {
                        kind: 'actionInputTargetIdentityMatch',
                        other: 'actionSource',
                        operator: 'equal',
                      },
                      sequence(
                        branch(
                          { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalSkill'] },
                          sequence(
                            step('changeResourceByActionValue', {
                              resource: 'sp',
                              amount: { kind: 'blackboard', key: 'atb_return_wisd' },
                              coefficient: { kind: 'constant', value: 1 },
                              recipient: 'team',
                              spGainKind: 'refund',
                              spGainSource: 'default',
                            }),
                            step(
                              'dealDamage',
                              {
                                damageType: 'nature',
                                attackScale: { kind: 'blackboard', key: 'atk_scale_early_finish' },
                                tags: ['comboSkill'],
                                features: ['canBreakWeakness'],
                                stagger: { kind: 'blackboard', key: 'poise_early_finish' },
                              },
                              'buff_chr_0032_lizhiyan_combo_skill_seal_bunshin_end_listener:/abilityEventResponses/0/sequence/steps/0/whenTrue/steps/0/whenTrue/steps/0/whenTrue/steps/0/whenTrue/steps/1',
                            ),
                            step('createTimedMarker', {
                              target: 'buffSource',
                              markerId: 'lizhiyan_combo_hit',
                              durationSeconds: { kind: 'constant', value: 0.1 },
                              autoFinishByAction: false,
                            }),
                            step('finishCurrentBuff', {
                              reason: 'early',
                              finishSource: 'actionSource',
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
    buff_chr_0032_lizhiyan_combo_skill_seal_finish_count: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0032_lizhiyan_combo_skill_seal_finisher: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 5,
      triggerIntervalSeconds: 0,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale_laser2: 0, cd_reduce: 7, isWisd: 0, poise_final: 10, radius: 5 },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          0,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'nature',
                attackScale: { kind: 'blackboard', key: 'atk_scale_laser2' },
                tags: ['comboSkill'],
                features: ['canBreakWeakness'],
                stagger: { kind: 'blackboard', key: 'poise_final' },
              },
              'buff_chr_0032_lizhiyan_combo_skill_seal_finisher:/scheduledSequences/0/sequence/steps/0',
            ),
            step('createTimedMarker', {
              target: 'caster',
              markerId: 'lizhiyan_combo_hit',
              durationSeconds: { kind: 'constant', value: 0.1 },
              autoFinishByAction: false,
            }),
          ),
          6,
        ),
        scheduled(
          1,
          sequence(
            step('findOwnerSpawnedAbilityEntities', {
              saveToContextKey: 'bunshin',
              abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_combo_skill'],
              sameSourceSkillCast: true,
            }),
            step('startTimeDilation', {
              scope: 'entity',
              durationSeconds: { kind: 'constant', value: 0.55 },
              slot: 'TimeDilation/Layer/Entity/HitStop',
              priority: 15,
              curve: {
                kind: 'inline',
                keys: [
                  {
                    time: 0,
                    value: 0.5,
                    inTangent: -6.042728,
                    outTangent: -6.042728,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                  {
                    time: 0.1,
                    value: 0.015,
                    inTangent: 0.03159265,
                    outTangent: 0.03159265,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                  {
                    time: 0.85,
                    value: 0.18,
                    inTangent: 0.5393099,
                    outTangent: 0.5393099,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                  {
                    time: 1,
                    value: 0.7,
                    inTangent: 4.793082,
                    outTangent: 4.793082,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                ],
              },
              finishByAction: false,
              targets: [],
              abilityEntityTargets: [{ kind: 'context', contextKey: 'bunshin' }],
            }),
          ),
          4,
        ),
        scheduled(
          0,
          sequence(
            forEachTarget(
              'enemy',
              sequence(
                step('finishBuffsById', {
                  target: 'enemy',
                  buffIds: ['buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable'],
                  reason: 'other',
                }),
              ),
            ),
          ),
          3,
        ),
      ],
    },
    buff_chr_0032_lizhiyan_combo_skill_seal_finisher_wisd: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 3,
      triggerIntervalSeconds: 0,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: {
        atb_return_wisd: 0,
        atk_scale_laser1: 0.5,
        atk_scale_laser2: 3,
        cd_reduce: 7,
        isWisd: 0,
        poise_final: 10,
        radius: 5.67,
      },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          0,
          sequence(
            step('findCharacterTeamTargets', {
              saveToContextKey: 'mainchar',
              selection: { kind: 'controlledOperator' },
            }),
            step('spawnAbilityEntity', {
              abilityEntityId: 'abilityentity_chr_0032_lizhiyan_combo_skill_place',
              inheritActionBlackboard: true,
              dieWhenSourceDies: false,
              overrideDurationSeconds: { kind: 'constant', value: 2 },
              saveToContextKey: 'laser_root',
            }),
          ),
          3,
        ),
        scheduled(
          2,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'nature',
                attackScale: { kind: 'blackboard', key: 'atk_scale_laser1' },
                tags: ['comboSkill'],
                features: ['canBreakWeakness'],
              },
              'buff_chr_0032_lizhiyan_combo_skill_seal_finisher_wisd:/scheduledSequences/1/sequence/steps/0',
            ),
          ),
          4,
        ),
        scheduled(
          5,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'nature',
                attackScale: { kind: 'blackboard', key: 'atk_scale_laser1' },
                tags: ['comboSkill'],
                features: ['canBreakWeakness'],
              },
              'buff_chr_0032_lizhiyan_combo_skill_seal_finisher_wisd:/scheduledSequences/2/sequence/steps/0',
            ),
          ),
          7,
        ),
        scheduled(
          8,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'nature',
                attackScale: { kind: 'blackboard', key: 'atk_scale_laser1' },
                tags: ['comboSkill'],
                features: ['canBreakWeakness'],
              },
              'buff_chr_0032_lizhiyan_combo_skill_seal_finisher_wisd:/scheduledSequences/3/sequence/steps/0',
            ),
          ),
          10,
        ),
        scheduled(
          11,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'nature',
                attackScale: { kind: 'blackboard', key: 'atk_scale_laser1' },
                tags: ['comboSkill'],
                features: ['canBreakWeakness'],
              },
              'buff_chr_0032_lizhiyan_combo_skill_seal_finisher_wisd:/scheduledSequences/4/sequence/steps/0',
            ),
          ),
          13,
        ),
        scheduled(
          17,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'nature',
                attackScale: { kind: 'blackboard', key: 'atk_scale_laser2' },
                tags: ['comboSkill'],
                features: ['canBreakWeakness'],
                stagger: { kind: 'blackboard', key: 'poise_final' },
              },
              'buff_chr_0032_lizhiyan_combo_skill_seal_finisher_wisd:/scheduledSequences/5/sequence/steps/0',
            ),
            step('createTimedMarker', {
              target: 'caster',
              markerId: 'lizhiyan_combo_hit',
              durationSeconds: { kind: 'constant', value: 0.1 },
              autoFinishByAction: false,
            }),
          ),
          23,
        ),
        scheduled(
          11,
          sequence(
            step('findOwnerSpawnedAbilityEntities', {
              saveToContextKey: 'bunshin',
              abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_combo_skill'],
              sameSourceSkillCast: true,
            }),
          ),
          14,
        ),
        scheduled(
          18,
          sequence(
            step('findOwnerSpawnedAbilityEntities', {
              saveToContextKey: 'bunshin',
              abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_combo_skill'],
              sameSourceSkillCast: true,
            }),
            step('startTimeDilation', {
              scope: 'entity',
              durationSeconds: { kind: 'constant', value: 0.55 },
              slot: 'TimeDilation/Layer/Entity/HitStop',
              priority: 15,
              curve: {
                kind: 'inline',
                keys: [
                  {
                    time: 0,
                    value: 0.6,
                    inTangent: -5.656393,
                    outTangent: -5.656393,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                  {
                    time: 0.1,
                    value: 0.015,
                    inTangent: 0.03159265,
                    outTangent: 0.03159265,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                  {
                    time: 0.85,
                    value: 0.18,
                    inTangent: 0.5393099,
                    outTangent: 0.5393099,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                  {
                    time: 1,
                    value: 0.7,
                    inTangent: 4.793082,
                    outTangent: 4.793082,
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
            step('startTimeDilation', {
              scope: 'entity',
              durationSeconds: { kind: 'constant', value: 0.55 },
              slot: 'TimeDilation/Layer/Entity/HitStop',
              priority: 15,
              curve: {
                kind: 'inline',
                keys: [
                  {
                    time: 0,
                    value: 0.6,
                    inTangent: -5.656393,
                    outTangent: -5.656393,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                  {
                    time: 0.1,
                    value: 0.015,
                    inTangent: 0.03159265,
                    outTangent: 0.03159265,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                  {
                    time: 0.85,
                    value: 0.18,
                    inTangent: 0.5393099,
                    outTangent: 0.5393099,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                  {
                    time: 1,
                    value: 0.7,
                    inTangent: 4.793082,
                    outTangent: 4.793082,
                    weightedMode: 0,
                    inWeight: 0,
                    outWeight: 0,
                  },
                ],
              },
              finishByAction: false,
              targets: [],
              abilityEntityTargets: [{ kind: 'context', contextKey: 'bunshin' }],
            }),
          ),
          21,
        ),
        scheduled(
          17,
          sequence(
            forEachTarget(
              'enemy',
              sequence(
                step('finishBuffsById', {
                  target: 'enemy',
                  buffIds: ['buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable'],
                  reason: 'other',
                }),
              ),
            ),
          ),
          20,
        ),
      ],
      lifecycleSequences: {
        start: sequence(
          step('createTimedMarker', {
            target: 'caster',
            markerId: 'lizhiyan_combo_wisd_has_finish',
            durationSeconds: { kind: 'constant', value: 1 },
            autoFinishByAction: false,
          }),
        ),
        finish: sequence(
          step('triggerCustomAbilityEvent', {
            eventName: 'lizhiyan_combo_wisd_end',
            eventParam: 0,
            target: 'caster',
            source: 'currentAbilityEntity',
          }),
        ),
      },
    },
    buff_chr_0032_lizhiyan_combo_skill_seal_listener: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: {
        atk_scale_early_finish: 5,
        atk_scale_wisd_ratio: 0,
        duration: 5,
        duration_extra: 0,
        poise_early_finish: 5,
        radius: 5.67,
        radius_early_finish: 5.67,
        wisd_greater_will: 0,
      },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'buffEndsEarly',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'eventBuffIdMatch',
                buffIds: [
                  'buff_chr_0032_lizhiyan_combo_skill_seal',
                  'buff_chr_0032_lizhiyan_combo_skill_seal_bunshin_end_listener',
                ],
              },
              sequence(
                step('findOwnerSpawnedAbilityEntities', {
                  saveToContextKey: 'bunshin',
                  abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_combo_skill'],
                  sameSourceSkillCast: true,
                }),
                forEachContextTarget(
                  'bunshin',
                  sequence(
                    step('startCurrentAbilityEntityChildSkillById', {
                      childSkillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_seal_again',
                    }),
                  ),
                ),
                step('finishCurrentBuff', { reason: 'other', finishSource: 'actionSource' }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0032_lizhiyan_combo_skill_seal_total: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration_total' },
      timeClock: 'global',
      applyTags: [],
      extendTags: [],
      blackboard: {
        atb_return_wisd: 0,
        atk_scale_boom: 0,
        atk_scale_touch: 0,
        duration_effect: 0,
        duration_final: 0,
        duration_seal2: 0,
        duration_total: 5,
        isWisd: 0,
        poise_boom: 0,
        poise_touch: 0,
        radius: 5.67,
        rate_final: 0,
        rate_pre: 0,
        trigger_time: 0.1,
        usp: 0,
      },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          2,
          sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal',
              target: 'enemy',
              source: 'buffSource',
              inheritSourceSkillCastInfo: true,
              copiedBlackboardAssignments: {
                duration: 'duration_final',
                rate_pre: 'rate_final',
                trigger_time: 'trigger_time',
                isWisd: 'EntityBB_wisd_greater_will',
              },
            }),
            step('applyBuff', {
              buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_listener',
              target: 'enemy',
              source: 'buffSource',
              inheritSourceSkillCastInfo: true,
              copiedBlackboardAssignments: {
                duration: 'duration_final',
                wisd_greater_will: 'EntityBB_wisd_greater_will',
                atk_scale_early_finish: 'atk_scale_boom',
                poise_early_finish: 'poise_boom',
              },
            }),
          ),
          21,
        ),
        scheduled(
          0,
          sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0032_lizhiyan_combo_skill_precheck',
              target: 'enemy',
              source: 'buffSource',
              inheritSourceSkillCastInfo: true,
              finishByAction: true,
            }),
          ),
          2,
        ),
        scheduled(
          6,
          sequence(
            branch(
              {
                kind: 'actionValueCompare',
                left: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
                operator: 'less',
                right: { kind: 'constant', value: 1 },
              },
              sequence({
                kind: 'switch',
                parameters: {
                  choice: { kind: 'blackboard', key: 'EntityBB_consumed_type' },
                  alwaysNext: true,
                },
                options: [
                  {
                    value: { kind: 'constant', value: 3 },
                    sequence: sequence(
                      step('applyElementalInfliction', { element: 'nature', isExtra: false }),
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
                    value: { kind: 'constant', value: 0 },
                    sequence: sequence(
                      step('applyElementalInfliction', { element: 'heat', isExtra: false }),
                    ),
                  },
                ],
              }),
              undefined,
              { alwaysNext: true },
            ),
            step('applyBuff', {
              buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal2',
              target: 'enemy',
              source: 'buffSource',
              inheritSourceSkillCastInfo: true,
              copiedBlackboardAssignments: {
                duration: 'duration_seal2',
                isWisd: 'EntityBB_wisd_greater_will',
                rate_pre: 'rate_pre',
                atk_scale_early_finish: 'atk_scale_boom',
                poise_early_finish: 'poise_boom',
                atb_return_wisd: 'atb_return_wisd',
              },
            }),
            forEachTarget(
              'enemy',
              sequence(
                step(
                  'dealDamage',
                  {
                    damageType: 'nature',
                    attackScale: { kind: 'blackboard', key: 'atk_scale_touch' },
                    tags: ['comboSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'blackboard', key: 'poise_touch' },
                  },
                  'buff_chr_0032_lizhiyan_combo_skill_seal_total:/scheduledSequences/2/sequence/steps/2/body/steps/0',
                ),
              ),
            ),
            step('changeResourceByActionValue', {
              resource: 'ultimateEnergy',
              amount: { kind: 'blackboard', key: 'usp' },
              coefficient: { kind: 'constant', value: 1 },
              recipient: 'caster',
            }),
            branch(
              {
                kind: 'buffIdStackCompare',
                target: 'caster',
                buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_time_dilation_listener'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 1 },
              },
              sequence(),
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
              ),
              { alwaysNext: true },
            ),
          ),
          9,
        ),
        scheduled(
          0,
          sequence(
            step('calculateActionValue', {
              key: 'duration_effect',
              operation: 'add',
              left: { kind: 'blackboard', key: 'duration_final' },
              right: { kind: 'constant', value: -0.2 },
            }),
          ),
          3,
        ),
      ],
    },
    buff_chr_0032_lizhiyan_combo_skill_seal2: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_lizhiyan_combo_seal',
        iconPath: '/icons/icon_battle_buff_lizhiyan_combo_seal.webp',
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
      applyTags: ['Skill/Character/chr_0032_lizhiyan/combo_seal'],
      extendTags: [],
      blackboard: {
        atb_return_wisd: 0,
        atk_scale_early_finish: 1,
        duration: 5,
        isWisd: 1,
        poise_early_finish: 1,
        radius_early_finish: 5.67,
        rate_pre: 0.1,
        trigger_time: 0,
      },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'beforeTakeDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'actionValueCompare',
                left: { kind: 'blackboard', key: 'isWisd', fallback: 0 },
                operator: 'greaterOrEqual',
                right: { kind: 'constant', value: 1 },
              },
              sequence(
                branch(
                  { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalSkill'] },
                  sequence(
                    branch(
                      {
                        kind: 'actionInputTargetIdentityMatch',
                        other: 'actionSource',
                        operator: 'equal',
                      },
                      sequence(
                        step('changeResourceByActionValue', {
                          resource: 'sp',
                          amount: { kind: 'blackboard', key: 'atb_return_wisd' },
                          coefficient: { kind: 'constant', value: 1 },
                          recipient: 'team',
                          spGainKind: 'refund',
                          spGainSource: 'default',
                        }),
                        step(
                          'dealDamage',
                          {
                            damageType: 'nature',
                            attackScale: { kind: 'blackboard', key: 'atk_scale_early_finish' },
                            tags: ['comboSkill'],
                            features: ['canBreakWeakness'],
                            stagger: { kind: 'blackboard', key: 'poise_early_finish' },
                          },
                          'buff_chr_0032_lizhiyan_combo_skill_seal2:/abilityEventResponses/0/sequence/steps/0/whenTrue/steps/0/whenTrue/steps/0/whenTrue/steps/1',
                        ),
                        step('applyBuff', {
                          buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_atb',
                          target: 'buffOwner',
                          source: 'buffSource',
                          inheritSourceSkillCastInfo: true,
                        }),
                        step('finishBuffsById', {
                          target: 'buffOwner',
                          buffIds: [
                            'buff_chr_0032_lizhiyan_combo_skill_seal',
                            'buff_chr_0032_lizhiyan_combo_skill_seal_effect',
                          ],
                          reason: 'early',
                        }),
                        step('finishCurrentBuff', {
                          reason: 'early',
                          finishSource: 'actionSource',
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
    buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration_vul' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_lizhiyan_combo_vulnerable',
        iconPath: '/icons/icon_battle_buff_lizhiyan_combo_vulnerable.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: {
        atk_scale_calc: 0,
        atk_scale_laser1: 0,
        atk_scale_laser2: 0,
        cd_reduce: 7,
        duration_vul: 6,
        isWisd: 0,
        poise_final: 0,
        rate: 0.2,
      },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_natural',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration_vul' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_common_affixes_vulnerable_natural_lizhiyan_child',
            },
          }),
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_crystal',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration_vul' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_common_affixes_vulnerable_crystal_lizhiyan_child',
            },
          }),
        ),
      },
    },
    buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable_pre: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration_vul' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_lizhiyan_combo_vulnerable',
        iconPath: '/icons/icon_battle_buff_lizhiyan_combo_vulnerable.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { duration_vul: 6, isWisd: 0, rate: 0.2 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_natural',
            target: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration_vul' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_common_affixes_vulnerable_natural_lizhiyan_child',
            },
          }),
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_crystal',
            target: 'buffOwner',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration_vul' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_common_affixes_vulnerable_crystal_lizhiyan_child',
            },
          }),
        ),
      },
    },
    buff_chr_0032_lizhiyan_normal_skill_aura: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'beforeTakeInfliction',
          priority: 0,
          sequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0032_lizhiyan_normal_skill_listener',
              target: 'buffSource',
              source: 'buffOwner',
              inheritSourceSkillCastInfo: true,
            }),
          ),
        },
      ],
    },
    buff_chr_0032_lizhiyan_normal_skill_listener: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 0.5,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0032_lizhiyan_passive: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 3,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          branch(
            {
              kind: 'deckAttributeCompare',
              left: 'intellect',
              operator: 'greaterOrEqual',
              right: 'will',
            },
            sequence(
              step('modifyActionValue', {
                key: 'EntityBB_wisd_greater_will',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            sequence(
              step('modifyActionValue', {
                key: 'EntityBB_wisd_greater_will',
                operation: 'assign',
                value: { kind: 'constant', value: 0 },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
      },
    },
    buff_chr_0032_lizhiyan_talent1: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 3,
      applyTags: [],
      extendTags: [],
      blackboard: {
        duration: 10,
        enhance_rate: 0.1,
        lv: 2,
        spell_vul_rate: 0.1,
        spell_vul_rate_per_will: 0,
        spell_vul_rate_potential: 0,
      },
      attributeModifiers: [],
    },
    buff_chr_0032_lizhiyan_talent1_enhance: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { enhance_rate: 0.1 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_enhance_spell',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'constant', value: -1 },
              rate: { kind: 'blackboard', key: 'enhance_rate' },
            },
          }),
        ),
      },
    },
    buff_chr_0032_lizhiyan_talent1_vulnerable: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_lizhiyan_combo_vulnerable',
        iconPath: '/icons/icon_battle_buff_lizhiyan_combo_vulnerable.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'KeywordDebuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0, rate: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_natural',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_common_affixes_vulnerable_natural_lizhiyan_child',
            },
          }),
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_crystal',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'rate' },
            },
            stringBlackboardAssignments: {
              child_buff_id: 'buff_common_affixes_vulnerable_crystal_lizhiyan_child',
            },
          }),
        ),
      },
    },
    buff_chr_0032_lizhiyan_ultimate_skill_abilityentity_finish_self: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 1.5,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: { finish: sequence(step('finishCurrentAbilityEntity', {})) },
    },
    buff_chr_0032_lizhiyan_ultimate_skill_inaura: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale_laser: 0.5, is_power_attacked: 0, usp_step: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('storeSourceAttributeValue', {
            attribute: { kind: 'specific', key: 'maxUltimateEnergy' },
            stage: 'armedNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'constant', value: 1 },
            base: { kind: 'constant', value: 0 },
            targetKey: 'usp_step',
          }),
          step('calculateActionValue', {
            key: 'usp_step',
            operation: 'divide',
            left: { kind: 'blackboard', key: 'usp_step' },
            right: { kind: 'constant', value: 2 },
          }),
        ),
      },
      abilityEventResponses: [
        {
          event: 'beforeTakeDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'actionInputTargetIdentityMatch',
                other: 'controlledOperator',
                operator: 'equal',
              },
              sequence(
                branch(
                  {
                    kind: 'ownerSpawnedAbilityEntityPresent',
                    abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
                  },
                  sequence(
                    branch(
                      {
                        kind: 'eventDamageTagsMatch',
                        match: 'hasAny',
                        tags: ['normalAttackLastCombo'],
                      },
                      sequence(
                        step('spawnAbilityEntity', {
                          abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_death',
                          inheritActionBlackboard: true,
                          dieWhenSourceDies: false,
                          overrideDurationSeconds: { kind: 'constant', value: 0.2 },
                          saveToContextKey: 'ult_death',
                        }),
                        forEachContextTarget(
                          'ult_death',
                          sequence(
                            step('applyBuff', {
                              buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_target_mark',
                              target: 'currentAbilityEntity',
                              source: 'buffSource',
                              inheritSourceSkillCastInfo: true,
                              copiedBlackboardAssignments: {
                                atk_scale_laser: 'atk_scale_laser',
                                usp_step: 'usp_step',
                              },
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
        {
          event: 'beforeTakeDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'actionInputTargetIdentityMatch',
                other: 'controlledOperator',
                operator: 'equal',
              },
              sequence(
                branch(
                  {
                    kind: 'ownerSpawnedAbilityEntityPresent',
                    abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
                  },
                  sequence(
                    branch(
                      { kind: 'eventDamageTagsMatch', match: 'hasAny', tags: ['powerAttack'] },
                      sequence(
                        branch(
                          {
                            kind: 'actionValueCompare',
                            left: { kind: 'blackboard', key: 'is_power_attacked', fallback: 0 },
                            operator: 'equal',
                            right: { kind: 'constant', value: 0 },
                          },
                          sequence(
                            branch(
                              {
                                kind: 'not',
                                condition: {
                                  kind: 'timedMarkerPresent',
                                  target: 'buffSource',
                                  markerId: 'chr_0032_lizhiyan_ultimate_count',
                                },
                              },
                              sequence(
                                step('createTimedMarker', {
                                  target: 'buffSource',
                                  markerId: 'chr_0032_lizhiyan_ultimate_count',
                                  durationSeconds: { kind: 'constant', value: 0.4 },
                                  autoFinishByAction: false,
                                }),
                                step('modifyActionValue', {
                                  key: 'is_power_attacked',
                                  operation: 'assign',
                                  value: { kind: 'constant', value: 1 },
                                }),
                                step('findOwnerSpawnedAbilityEntities', {
                                  saveToContextKey: 'ult_aura',
                                  abilityEntityIds: [
                                    'abilityentity_chr_0032_lizhiyan_ultimate_skill',
                                  ],
                                }),
                                branch(
                                  {
                                    kind: 'buffIdStackCompare',
                                    target: 'buffSource',
                                    buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
                                    operator: 'lessOrEqual',
                                    value: { kind: 'constant', value: 0 },
                                  },
                                  sequence(
                                    step('spawnAbilityEntity', {
                                      abilityEntityId:
                                        'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser_target',
                                      inheritActionBlackboard: true,
                                      dieWhenSourceDies: false,
                                      saveToContextKey: 'laser_target1',
                                    }),
                                    forEachContextTarget(
                                      'laser_target1',
                                      sequence(
                                        step('applyBuff', {
                                          buffId:
                                            'buff_chr_0032_lizhiyan_ultimate_skill_inaura_laser1',
                                          target: 'currentAbilityEntity',
                                          source: 'buffSource',
                                          inheritSourceSkillCastInfo: true,
                                          copiedBlackboardAssignments: {
                                            atk_scale_laser: 'atk_scale_laser',
                                          },
                                        }),
                                      ),
                                    ),
                                    step('changeResourceByActionValue', {
                                      resource: 'ultimateEnergy',
                                      amount: { kind: 'blackboard', key: 'usp_step' },
                                      coefficient: { kind: 'constant', value: 1 },
                                      recipient: 'caster',
                                      ultimateRecoveryTag:
                                        'Skill/Character/chr_0032_lizhiyan/special_usp',
                                      ignoreUltimateEnergyGainMultiplier: true,
                                    }),
                                  ),
                                  sequence(
                                    branch(
                                      {
                                        kind: 'buffIdStackCompare',
                                        target: 'buffSource',
                                        buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
                                        operator: 'lessOrEqual',
                                        value: { kind: 'constant', value: 1 },
                                      },
                                      sequence(
                                        step('spawnAbilityEntity', {
                                          abilityEntityId:
                                            'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser_target',
                                          inheritActionBlackboard: true,
                                          dieWhenSourceDies: false,
                                          saveToContextKey: 'laser_target2',
                                        }),
                                        forEachContextTarget(
                                          'laser_target2',
                                          sequence(
                                            step('applyBuff', {
                                              buffId:
                                                'buff_chr_0032_lizhiyan_ultimate_skill_inaura_laser2',
                                              target: 'currentAbilityEntity',
                                              source: 'buffSource',
                                              inheritSourceSkillCastInfo: true,
                                              copiedBlackboardAssignments: {
                                                atk_scale_laser: 'atk_scale_laser',
                                              },
                                            }),
                                          ),
                                        ),
                                        step('changeResourceByActionValue', {
                                          resource: 'ultimateEnergy',
                                          amount: { kind: 'blackboard', key: 'usp_step' },
                                          coefficient: { kind: 'constant', value: 1 },
                                          recipient: 'caster',
                                          ultimateRecoveryTag:
                                            'Skill/Character/chr_0032_lizhiyan/special_usp',
                                          ignoreUltimateEnergyGainMultiplier: true,
                                        }),
                                      ),
                                      undefined,
                                      { alwaysNext: true },
                                    ),
                                  ),
                                  { alwaysNext: true },
                                ),
                                step('applyBuff', {
                                  buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_layer',
                                  target: 'buffSource',
                                  source: 'buffSource',
                                  inheritSourceSkillCastInfo: true,
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
            ),
          ),
        },
        {
          event: 'poiseZero',
          priority: 0,
          sequence: sequence(
            step('modifyActionValue', {
              key: 'is_power_attacked',
              operation: 'assign',
              value: { kind: 'constant', value: 0 },
            }),
          ),
        },
      ],
    },
    buff_chr_0032_lizhiyan_ultimate_skill_inaura_laser1: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 2,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale_laser: 10, trigger_time: 0 },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          0,
          sequence(
            step('findOwnerSpawnedAbilityEntities', {
              saveToContextKey: 'placesorted',
              abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill_place'],
              circularOrder: {
                indexBlackboardKey: 'EntityBB_index',
                desiredCount: 8,
                reverseFlag: 1,
              },
            }),
          ),
          3,
        ),
        scheduled(0, sharedActionSequence2, 3),
        scheduled(
          0,
          sequence(
            branch(
              {
                kind: 'contextTargetCountCompare',
                contextKey: 'first',
                operator: 'greater',
                value: 0,
              },
              sequence(
                step('spawnAbilityEntity', {
                  abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
                  childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
                  inheritActionBlackboard: true,
                  dieWhenSourceDies: false,
                  target: 'currentAbilityEntity',
                }),
              ),
            ),
          ),
          3,
        ),
        scheduled(
          4,
          sequence(
            branch(
              {
                kind: 'contextTargetCountCompare',
                contextKey: 'second',
                operator: 'greater',
                value: 0,
              },
              sequence(
                step('spawnAbilityEntity', {
                  abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
                  childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
                  inheritActionBlackboard: true,
                  dieWhenSourceDies: false,
                  target: 'currentAbilityEntity',
                }),
              ),
            ),
          ),
          7,
        ),
        scheduled(
          8,
          sequence(
            branch(
              {
                kind: 'contextTargetCountCompare',
                contextKey: 'third',
                operator: 'greater',
                value: 0,
              },
              sequence(
                step('spawnAbilityEntity', {
                  abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
                  childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
                  inheritActionBlackboard: true,
                  dieWhenSourceDies: false,
                  target: 'currentAbilityEntity',
                }),
              ),
            ),
          ),
          11,
        ),
        scheduled(
          12,
          sequence(
            branch(
              {
                kind: 'contextTargetCountCompare',
                contextKey: 'forth',
                operator: 'greater',
                value: 0,
              },
              sequence(
                step('spawnAbilityEntity', {
                  abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
                  childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
                  inheritActionBlackboard: true,
                  dieWhenSourceDies: false,
                  target: 'currentAbilityEntity',
                }),
              ),
            ),
          ),
          15,
        ),
      ],
      lifecycleSequences: {
        start: sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'ult_aura',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
          }),
        ),
      },
    },
    buff_chr_0032_lizhiyan_ultimate_skill_inaura_laser2: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 2,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale_laser: 10, trigger_time: 0 },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          0,
          sequence(
            step('findOwnerSpawnedAbilityEntities', {
              saveToContextKey: 'placesorted',
              abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill_place'],
              circularOrder: {
                indexBlackboardKey: 'EntityBB_index',
                desiredCount: 8,
                reverseFlag: -1,
              },
            }),
          ),
          3,
        ),
        scheduled(0, sharedActionSequence2, 3),
        scheduled(
          0,
          sequence(
            branch(
              {
                kind: 'contextTargetCountCompare',
                contextKey: 'first',
                operator: 'greater',
                value: 0,
              },
              sequence(
                step('spawnAbilityEntity', {
                  abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
                  childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
                  inheritActionBlackboard: true,
                  dieWhenSourceDies: false,
                  target: 'currentAbilityEntity',
                }),
              ),
            ),
          ),
          3,
        ),
        scheduled(
          4,
          sequence(
            branch(
              {
                kind: 'contextTargetCountCompare',
                contextKey: 'second',
                operator: 'greater',
                value: 0,
              },
              sequence(
                step('spawnAbilityEntity', {
                  abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
                  childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
                  inheritActionBlackboard: true,
                  dieWhenSourceDies: false,
                  target: 'currentAbilityEntity',
                }),
              ),
            ),
          ),
          7,
        ),
        scheduled(
          8,
          sequence(
            branch(
              {
                kind: 'contextTargetCountCompare',
                contextKey: 'third',
                operator: 'greater',
                value: 0,
              },
              sequence(
                step('spawnAbilityEntity', {
                  abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
                  childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
                  inheritActionBlackboard: true,
                  dieWhenSourceDies: false,
                  target: 'currentAbilityEntity',
                }),
              ),
            ),
          ),
          11,
        ),
        scheduled(
          12,
          sequence(
            branch(
              {
                kind: 'contextTargetCountCompare',
                contextKey: 'forth',
                operator: 'greater',
                value: 0,
              },
              sequence(
                step('spawnAbilityEntity', {
                  abilityEntityId: 'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser',
                  childSkillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
                  inheritActionBlackboard: true,
                  dieWhenSourceDies: false,
                  target: 'currentAbilityEntity',
                }),
              ),
            ),
          ),
          15,
        ),
      ],
      lifecycleSequences: {
        start: sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'ult_aura',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
          }),
        ),
      },
    },
    buff_chr_0032_lizhiyan_ultimate_skill_layer: {
      stackingType: 'enhance',
      priority: 0,
      maxStackCount: 3,
      applyTags: [],
      extendTags: [],
      blackboard: { count: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('setCharacterPassiveUiValue', {
            target: 'caster',
            value: { kind: 'constant', value: 1 },
          }),
        ),
        enhanceChanged: sequence(
          step('readBuffStackCount', {
            target: 'caster',
            outputKey: 'count',
            query: { kind: 'environment' },
          }),
          step('setCharacterPassiveUiValue', {
            target: 'caster',
            value: { kind: 'blackboard', key: 'count' },
          }),
        ),
      },
    },
    buff_chr_0032_lizhiyan_ultimate_skill_listener: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_ult_laser',
        iconPath: '/icons/icon_battle_buff_ult_laser.webp',
        showInHeadBarCommon: false,
        showInHeadBarAttached: false,
        showInSquadIcon: true,
        onlyShowForMainCharacter: false,
        blinkInMainCharHpBar: false,
        showProgressInHpBar: false,
        showProgressInNormalSkillButton: false,
        useWeakProgressInNormalSkillButton: false,
        showProgressInUltimateSkillButton: true,
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
      blackboard: { duration: 10, enhance_rate: 0, lv: 0 },
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
              step('finishBuffsById', {
                target: 'buffOwner',
                buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_listener_owner'],
                reason: 'other',
              }),
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'constant', value: 1 },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'caster',
                isPercentValue: true,
                ultimateRecoveryTag: 'Skill/Character/chr_0032_lizhiyan/special_usp',
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
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  branch(
                    {
                      kind: 'buffIdStackCompare',
                      target: 'caster',
                      buffIds: ['buff_chr_0032_lizhiyan_talent1'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('readBuffBlackboard', {
                        target: 'caster',
                        query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
                        desiredKey: 'enhance_rate',
                        outputKey: 'enhance_rate',
                      }),
                      branch(
                        {
                          kind: 'actionValueCompare',
                          left: { kind: 'blackboard', key: 'enhance_rate', fallback: 0 },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0 },
                        },
                        sequence(
                          step('applyBuff', {
                            buffId: 'buff_chr_0032_lizhiyan_talent1_enhance',
                            target: 'buffSource',
                            source: 'buffSource',
                            inheritSourceSkillCastInfo: true,
                            asChildBuff: true,
                            copiedBlackboardAssignments: { enhance_rate: 'enhance_rate' },
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
              step('setCharacterPassiveUiValue', {
                target: 'caster',
                value: { kind: 'constant', value: 2 },
              }),
            ),
          },
        ),
        enable: sequence(
          step('restrictUltimateEnergyRecovery', {
            target: 'caster',
            allowedRecoveryTags: ['Skill/Character/chr_0032_lizhiyan/special_usp'],
            clearUltimateEnergyOnEnd: true,
          }),
        ),
        finish: sequence(
          step('setCharacterPassiveUiValue', {
            target: 'caster',
            value: { kind: 'constant', value: 0 },
          }),
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
            reason: 'other',
          }),
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'constant', value: -999 },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          }),
        ),
      },
      skillSlotReplacements: [
        {
          skillGroupKey: 'ultimate',
          targetSkillKey: 'chr_0032_lizhiyan_ultimate_skill2',
          revertedSkillKey: 'chr_0032_lizhiyan_ultimate_skill',
          inheritOriginSkillCooldownProgress: false,
        },
      ],
    },
    buff_chr_0032_lizhiyan_ultimate_skill_listener_abilityentity: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
            reason: 'other',
          }),
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey:
              '__finishOwner:BuffData.buff_chr_0032_lizhiyan_ultimate_skill_listener_abilityentity.buffEventAction[0].actions[0].actionData[1]',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill_place'],
          }),
          forEachContextTarget(
            '__finishOwner:BuffData.buff_chr_0032_lizhiyan_ultimate_skill_listener_abilityentity.buffEventAction[0].actions[0].actionData[1]',
            sequence(step('finishCurrentAbilityEntity', {})),
          ),
        ),
      },
    },
    buff_chr_0032_lizhiyan_ultimate_skill_listener_owner: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_ult_skill',
        iconPath: '/icons/icon_battle_buff_ult_skill.webp',
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
      blackboard: { duration: 30, enhance_rate: 0, isWisd: 0, lv: 0 },
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
              step('setCharacterPassiveUiValue', {
                target: 'caster',
                value: { kind: 'constant', value: 3 },
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
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'isWisd', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  branch(
                    {
                      kind: 'buffIdStackCompare',
                      target: 'caster',
                      buffIds: ['buff_chr_0032_lizhiyan_talent1'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('readBuffBlackboard', {
                        target: 'caster',
                        query: { kind: 'id', buffIds: ['buff_chr_0032_lizhiyan_talent1'] },
                        desiredKey: 'enhance_rate',
                        outputKey: 'enhance_rate',
                      }),
                      branch(
                        {
                          kind: 'actionValueCompare',
                          left: { kind: 'blackboard', key: 'enhance_rate', fallback: 0 },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0 },
                        },
                        sequence(
                          step('applyBuff', {
                            buffId: 'buff_chr_0032_lizhiyan_talent1_enhance',
                            target: 'buffSource',
                            source: 'buffSource',
                            inheritSourceSkillCastInfo: true,
                            asChildBuff: true,
                            copiedBlackboardAssignments: { enhance_rate: 'enhance_rate' },
                          }),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          },
        ),
        enable: sequence(
          step('restrictUltimateEnergyRecovery', {
            target: 'caster',
            allowedRecoveryTags: ['Skill/Character/chr_0032_lizhiyan/special_usp'],
            clearUltimateEnergyOnEnd: true,
          }),
        ),
        finish: sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 2 },
            },
            sequence(),
            sequence(
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'constant', value: -999 },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'caster',
              }),
              step('setCharacterPassiveUiValue', {
                target: 'caster',
                value: { kind: 'constant', value: 0 },
              }),
            ),
            { alwaysNext: true },
          ),
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'ult_aura',
            abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
            sameSourceSkillCast: true,
          }),
          forEachContextTarget(
            'ult_aura',
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_abilityentity_finish_self',
                target: 'currentAbilityEntity',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
              }),
            ),
          ),
        ),
      },
      abilityEventResponses: [
        {
          event: 'addedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'buffIdStackCompare',
                target: 'buffOwner',
                buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 2 },
              },
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_listener',
                  target: 'buffSource',
                  source: 'buffSource',
                  inheritSourceSkillCastInfo: true,
                }),
              ),
              undefined,
              { alwaysNext: true },
            ),
          ),
        },
      ],
      skillSlotReplacements: [
        {
          skillGroupKey: 'ultimate',
          targetSkillKey: 'chr_0032_lizhiyan_ultimate_skill2',
          revertedSkillKey: 'chr_0032_lizhiyan_ultimate_skill',
          inheritOriginSkillCooldownProgress: false,
        },
      ],
    },
    buff_chr_0032_lizhiyan_ultimate_skill_target_mark: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 0.1,
      triggerIntervalSeconds: 0.033,
      waitFirstTriggerInterval: false,
      maxTriggerCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale_laser: 0, usp_step: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        trigger: sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_listener_owner'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              branch(
                {
                  kind: 'not',
                  condition: {
                    kind: 'timedMarkerPresent',
                    target: 'caster',
                    markerId: 'chr_0032_lizhiyan_ultimate_count',
                  },
                },
                sequence(
                  step('createTimedMarker', {
                    target: 'caster',
                    markerId: 'chr_0032_lizhiyan_ultimate_count',
                    durationSeconds: { kind: 'constant', value: 0.4 },
                    autoFinishByAction: false,
                  }),
                  step('findOwnerSpawnedAbilityEntities', {
                    saveToContextKey: 'ult_aura',
                    abilityEntityIds: ['abilityentity_chr_0032_lizhiyan_ultimate_skill'],
                  }),
                  branch(
                    {
                      kind: 'buffIdStackCompare',
                      target: 'caster',
                      buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
                      operator: 'lessOrEqual',
                      value: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('spawnAbilityEntity', {
                        abilityEntityId:
                          'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser_target',
                        inheritActionBlackboard: true,
                        dieWhenSourceDies: false,
                        saveToContextKey: 'laser_target1',
                      }),
                      forEachContextTarget(
                        'laser_target1',
                        sequence(
                          step('applyBuff', {
                            buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_inaura_laser1',
                            target: 'currentAbilityEntity',
                            source: 'buffSource',
                            inheritSourceSkillCastInfo: true,
                            copiedBlackboardAssignments: { atk_scale_laser: 'atk_scale_laser' },
                          }),
                        ),
                      ),
                      step('changeResourceByActionValue', {
                        resource: 'ultimateEnergy',
                        amount: { kind: 'blackboard', key: 'usp_step' },
                        coefficient: { kind: 'constant', value: 1 },
                        recipient: 'caster',
                        ultimateRecoveryTag: 'Skill/Character/chr_0032_lizhiyan/special_usp',
                        ignoreUltimateEnergyGainMultiplier: true,
                      }),
                    ),
                    sequence(
                      branch(
                        {
                          kind: 'buffIdStackCompare',
                          target: 'caster',
                          buffIds: ['buff_chr_0032_lizhiyan_ultimate_skill_layer'],
                          operator: 'lessOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                        sequence(
                          step('spawnAbilityEntity', {
                            abilityEntityId:
                              'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser_target',
                            inheritActionBlackboard: true,
                            dieWhenSourceDies: false,
                            saveToContextKey: 'laser_target2',
                          }),
                          forEachContextTarget(
                            'laser_target2',
                            sequence(
                              step('applyBuff', {
                                buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_inaura_laser2',
                                target: 'currentAbilityEntity',
                                source: 'buffSource',
                                inheritSourceSkillCastInfo: true,
                                copiedBlackboardAssignments: { atk_scale_laser: 'atk_scale_laser' },
                              }),
                            ),
                          ),
                          step('changeResourceByActionValue', {
                            resource: 'ultimateEnergy',
                            amount: { kind: 'blackboard', key: 'usp_step' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'caster',
                            ultimateRecoveryTag: 'Skill/Character/chr_0032_lizhiyan/special_usp',
                            ignoreUltimateEnergyGainMultiplier: true,
                          }),
                        ),
                        undefined,
                        { alwaysNext: true },
                      ),
                    ),
                    { alwaysNext: true },
                  ),
                  step('applyBuff', {
                    buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_layer',
                    target: 'buffSource',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
          ),
        ),
      },
    },
    buff_chr_0032_lizhiyan_ultimate_skill_time_dilation_listener: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 3,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0032_lizhiyan_combo_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0032_lizhiyan/combo_bunshin',
      ],
      blackboard: { EntityBB_wisd_greater_will: 1 },
      lifetime: { kind: 'limited', durationSeconds: 50 },
      childSkills: {
        chr_032_lizhiyan_combo_skill_abilityentity_seal: {
          skillId: 'chr_032_lizhiyan_combo_skill_abilityentity_seal',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 190,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb_final: 50,
            atk_scale_final: 1,
            minAngle: 0,
            number: 0,
            owner_mainchar_alpha: 0,
            owner_mainchar_distance: 0,
            poise_final: 0,
            radius: 5,
          },
          scheduledSequences: [],
        },
        chr_0032_lizhiyan_combo_skill_abilityentity_end: {
          skillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_end',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 45,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb_final: 50,
            atb_return_wisd: 0,
            atk_scale_boom: 1,
            minAngle: 0,
            number: 0,
            owner_mainchar_alpha: 0,
            owner_mainchar_distance: 0,
            poise_boom: 5,
            radius: 5,
          },
          scheduledSequences: [
            scheduled(
              9,
              sequence(
                step('finishBuffsById', {
                  target: 'currentAbilityEntity',
                  buffIds: [
                    'buff_chr_0032_lizhiyan_combo_skill_abilityentity_effect',
                    'buff_chr_0032_lizhiyan_combo_skill_abilityentity_effect_line',
                  ],
                  reason: 'other',
                }),
              ),
              12,
            ),
            scheduled(
              21,
              sequence(
                step('triggerCustomAbilityEvent', {
                  eventName: 'lizhiyan_combo_normal_end',
                  eventParam: 0,
                  target: 'caster',
                  source: 'currentAbilityEntity',
                }),
              ),
              22,
            ),
            scheduled(44, sequence(step('finishActionOwnerAbilityEntity', {})), 45),
            scheduled(
              0,
              sequence(
                repeatEachTick(sequence(), {
                  nativeChanneling: {
                    executeEachFrame: true,
                    triggerIntervalSeconds: 0.033,
                    maxCountPerTarget: -1,
                    targetTriggerIntervalSeconds: 0.033,
                  },
                }),
              ),
              15,
            ),
            scheduled(
              0,
              sequence(
                branch(
                  {
                    kind: 'not',
                    condition: {
                      kind: 'timedMarkerPresent',
                      target: 'caster',
                      markerId: 'lizhiyan_combo_end_not_finish',
                    },
                  },
                  sequence(
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: {
                          kind: 'blackboard',
                          key: 'EntityBB_wisd_greater_will',
                          fallback: 0,
                        },
                        operator: 'greaterOrEqual',
                        right: { kind: 'constant', value: 1 },
                      },
                      sequence(
                        step('applyBuff', {
                          buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_bunshin_end_listener',
                          target: 'enemy',
                          inheritSourceSkillCastInfo: true,
                          finishByAction: true,
                          copiedBlackboardAssignments: {
                            atk_scale_early_finish: 'atk_scale_boom',
                            poise_early_finish: 'poise_boom',
                            atb_return_wisd: 'atb_return_wisd',
                          },
                        }),
                        step('createTimedMarker', {
                          target: 'caster',
                          markerId: 'lizhiyan_combo_end_not_finish',
                          durationSeconds: { kind: 'constant', value: 0.1 },
                          autoFinishByAction: false,
                        }),
                      ),
                    ),
                  ),
                ),
              ),
              14,
            ),
            scheduled(
              14,
              sequence(
                branch(
                  {
                    kind: 'not',
                    condition: {
                      kind: 'timedMarkerPresent',
                      target: 'caster',
                      markerId: 'lizhiyan_combo_hit',
                    },
                  },
                  sequence(
                    step(
                      'dealDamage',
                      {
                        damageType: 'nature',
                        attackScale: { kind: 'blackboard', key: 'atk_scale_boom' },
                        tags: ['comboSkill'],
                        features: ['canBreakWeakness'],
                        stagger: { kind: 'blackboard', key: 'poise_boom' },
                      },
                      'abilityentity_chr_0032_lizhiyan_combo_skill:chr_032_lizhiyan_combo_skill_abilityentity_seal|chr_0032_lizhiyan_combo_skill_abilityentity_end|chr_0032_lizhiyan_combo_skill_abilityentity_seal_again|chr_0032_lizhiyan_combo_skill_abilityentity_seal_finisher:/childSkills/chr_0032_lizhiyan_combo_skill_abilityentity_end/scheduledSequences/5/sequence/steps/0/whenTrue/steps/0',
                    ),
                    step('createTimedMarker', {
                      target: 'caster',
                      markerId: 'lizhiyan_combo_hit',
                      durationSeconds: { kind: 'constant', value: 0.1 },
                      autoFinishByAction: false,
                    }),
                  ),
                  undefined,
                  { alwaysNext: true },
                ),
                step('startTimeDilation', {
                  scope: 'entity',
                  durationSeconds: { kind: 'constant', value: 0.3 },
                  slot: 'TimeDilation/Layer/Entity/HitStop',
                  priority: 15,
                  curve: {
                    kind: 'inline',
                    keys: [
                      {
                        time: 0,
                        value: 1,
                        inTangent: -14.14286,
                        outTangent: -14.14286,
                        weightedMode: 0,
                        inWeight: 0,
                        outWeight: 0,
                      },
                      {
                        time: 0.07,
                        value: 0.01,
                        inTangent: 0.03159265,
                        outTangent: 0.03159265,
                        weightedMode: 0,
                        inWeight: 0,
                        outWeight: 0,
                      },
                      {
                        time: 0.9385403,
                        value: 0.1655021,
                        inTangent: 0.5255258,
                        outTangent: 0.5255258,
                        weightedMode: 0,
                        inWeight: 0,
                        outWeight: 0,
                      },
                      {
                        time: 1,
                        value: 0.3,
                        inTangent: 3.249784,
                        outTangent: 3.249784,
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
              ),
              20,
            ),
            scheduled(
              0,
              sequence(
                step('createAbilityEntityTimedMarker', {
                  markerId: 'lizhiyan_bunshin_end',
                  durationSeconds: { kind: 'constant', value: 1 },
                  autoFinishByAction: false,
                  timeDomain: 'self',
                }),
              ),
              3,
            ),
            scheduled(
              14,
              sequence(
                forEachTarget(
                  'enemy',
                  sequence(
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable'],
                        operator: 'greaterOrEqual',
                        value: { kind: 'constant', value: 1 },
                      },
                      sequence(
                        step('finishBuffsById', {
                          target: 'enemy',
                          buffIds: ['buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable'],
                          reason: 'other',
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                  ),
                ),
              ),
              17,
            ),
          ],
        },
        chr_0032_lizhiyan_combo_skill_abilityentity_seal_again: {
          skillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_seal_again',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 243,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb_final: 50,
            atb_return_wisd: 10,
            atk_scale_calc: 0,
            atk_scale_laser1: 6,
            atk_scale_laser2: 2,
            atk_scale_wisd_ratio: 0,
            cd_reduce: 3,
            duration_calc: 0,
            duration_extra: 0,
            duration_vul: 2,
            isWisd: 1,
            minAngle: 0,
            number: 0,
            owner_mainchar_alpha: 0,
            owner_mainchar_distance: 0,
            poise_laser: 5,
            radius: 5,
            radius_early_finish: 5.67,
            rate_final: 0.3,
          },
          scheduledSequences: [
            scheduled(
              0,
              sequence(
                step('finishBuffsById', {
                  target: 'currentAbilityEntity',
                  buffIds: ['buff_chr_0032_lizhiyan_combo_skill_abilityentity_effect_line'],
                  reason: 'other',
                }),
              ),
              3,
            ),
            scheduled(
              0,
              sequence(
                branch(
                  {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                  sequence(
                    step('modifyActionValue', {
                      key: 'isWisd',
                      operation: 'assign',
                      value: { kind: 'constant', value: 1 },
                    }),
                    step('calculateActionValue', {
                      key: 'duration_calc',
                      operation: 'add',
                      left: { kind: 'blackboard', key: 'duration_vul' },
                      right: { kind: 'constant', value: 0 },
                    }),
                  ),
                  sequence(
                    step('modifyActionValue', {
                      key: 'isWisd',
                      operation: 'assign',
                      value: { kind: 'constant', value: 0 },
                    }),
                    step('calculateActionValue', {
                      key: 'duration_calc',
                      operation: 'add',
                      left: { kind: 'blackboard', key: 'duration_vul' },
                      right: { kind: 'blackboard', key: 'duration_extra' },
                    }),
                  ),
                  { alwaysNext: true },
                ),
              ),
              3,
            ),
            scheduled(
              41,
              sequence(
                branch(
                  {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'isWisd', fallback: 0 },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                  sequence(
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'caster',
                        buffIds: ['buff_chr_0032_lizhiyan_combo_skill_seal_finish_count'],
                        operator: 'less',
                        value: { kind: 'constant', value: 1 },
                        sameSourceSkillCast: true,
                      },
                      sequence(
                        step('applyBuff', {
                          buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_finish_count',
                          target: 'caster',
                          source: 'currentAbilityEntity',
                          inheritSourceSkillCastInfo: true,
                        }),
                        step('spawnAbilityEntity', {
                          abilityEntityId: 'abilityentity_chr_0032_lizhiyan_combo_skill_death',
                          childSkillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_death_move',
                          inheritActionBlackboard: true,
                          dieWhenSourceDies: false,
                          target: 'enemy',
                          saveToContextKey: 'death',
                        }),
                        forEachContextTarget(
                          'death',
                          sequence(
                            step('applyBuff', {
                              buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_finisher_wisd',
                              target: 'currentAbilityEntity',
                              inheritSourceSkillCastInfo: true,
                              copiedBlackboardAssignments: {
                                atk_scale_laser1: 'atk_scale_laser1',
                                atk_scale_laser2: 'atk_scale_laser2',
                                poise_final: 'poise_laser',
                                isWisd: 'isWisd',
                                cd_reduce: 'cd_reduce',
                                atb_return_wisd: 'atb_return_wisd',
                              },
                            }),
                          ),
                        ),
                        step('jumpTimeline', { destinationFrame: 239 }),
                      ),
                      sequence(step('jumpTimeline', { destinationFrame: 240 })),
                      { alwaysNext: true },
                    ),
                  ),
                  undefined,
                  { alwaysNext: true },
                ),
              ),
              44,
            ),
            scheduled(
              23,
              sequence(
                step('finishBuffsById', {
                  target: 'currentAbilityEntity',
                  buffIds: ['buff_chr_0032_lizhiyan_combo_skill_abilityentity_effect'],
                  reason: 'other',
                }),
              ),
              26,
            ),
            scheduled(
              239,
              sequence(
                branch(
                  {
                    kind: 'not',
                    condition: {
                      kind: 'timedMarkerPresent',
                      target: 'caster',
                      markerId: 'lizhiyan_combo_finisher',
                    },
                  },
                  sequence(
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'isWisd', fallback: 0 },
                        operator: 'greaterOrEqual',
                        right: { kind: 'constant', value: 1 },
                      },
                      sequence(),
                      sequence(
                        step('applyBuff', {
                          buffId: 'buff_chr_0032_lizhiyan_combo_skill_seal_finisher',
                          target: 'enemy',
                          inheritSourceSkillCastInfo: true,
                          copiedBlackboardAssignments: {
                            atk_scale_laser2: 'atk_scale_laser2',
                            poise_final: 'poise_laser',
                            isWisd: 'isWisd',
                          },
                        }),
                        step('createTimedMarker', {
                          target: 'caster',
                          markerId: 'lizhiyan_combo_finisher',
                          durationSeconds: { kind: 'constant', value: 0.1 },
                          autoFinishByAction: false,
                        }),
                      ),
                      { alwaysNext: true },
                    ),
                  ),
                ),
              ),
              239,
            ),
            scheduled(240, sequence(step('finishActionOwnerAbilityEntity', {})), 243),
            scheduled(
              0,
              sequence(
                branch(
                  {
                    kind: 'not',
                    condition: {
                      kind: 'timedMarkerPresent',
                      target: 'caster',
                      markerId: 'lizhiyan_combo_vul',
                    },
                  },
                  sequence(
                    step('createTimedMarker', {
                      target: 'caster',
                      markerId: 'lizhiyan_combo_vul',
                      durationSeconds: { kind: 'constant', value: 0.1 },
                      autoFinishByAction: false,
                    }),
                    step('applyBuff', {
                      buffId: 'buff_chr_0032_lizhiyan_combo_skill_spell_vulnerable',
                      target: 'enemy',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        rate: 'rate_final',
                        duration_vul: 'duration_calc',
                        atk_scale_calc: 'atk_scale_calc',
                        poise_final: 'poise_laser',
                        isWisd: 'isWisd',
                        atk_scale_laser1: 'atk_scale_laser1',
                        atk_scale_laser2: 'atk_scale_laser2',
                      },
                    }),
                  ),
                ),
              ),
              240,
            ),
          ],
        },
        chr_0032_lizhiyan_combo_skill_abilityentity_seal_finisher: {
          skillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_seal_finisher',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 19,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb_final: 50,
            atk_scale_calc: 0,
            atk_scale_final: 6,
            atk_scale_wisd_ratio: 0,
            duration_calc: 0,
            duration_extra: 0,
            duration_vul: 6,
            isWisd: 1,
            minAngle: 0,
            number: 0,
            owner_mainchar_alpha: 0,
            owner_mainchar_distance: 0,
            poise_final: 5,
            radius: 5,
            rate: 0.3,
          },
          scheduledSequences: [
            scheduled(18, sequence(step('finishActionOwnerAbilityEntity', {})), 19),
          ],
        },
      },
    },
    abilityentity_chr_0032_lizhiyan_normal_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      blackboard: { EntityBB_wisd_greater_will: 1 },
      lifetime: { kind: 'limited', durationSeconds: 6 },
      childSkills: {
        chr_0032_lizhiyan_normal_skill_abilityrange2: {
          skillId: 'chr_0032_lizhiyan_normal_skill_abilityrange2',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 240,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {
            atb_return_dynamic: 20,
            atk_scale: 0,
            atk_scale_final: 0,
            atk_scale_will: 1,
            atk_scale_wisd: 1,
            atk_scale_wisd_ratio: 1.5,
            duration: 6,
            effect_count: 0,
            has_returned: 0,
            isJumped: 0,
            max_effect_count: 3,
            poise: 0,
            radius: 5,
          },
          scheduledSequences: [
            scheduled(
              0,
              sequence(
                step('modifyActionValue', {
                  key: 'radius',
                  operation: 'add',
                  value: { kind: 'constant', value: 0.67 },
                }),
              ),
              3,
            ),
            scheduled(
              20,
              sequence(
                forEachTarget(
                  'enemy',
                  sequence(
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'effect_count', fallback: 0 },
                        operator: 'less',
                        right: { kind: 'blackboard', key: 'max_effect_count', fallback: 0 },
                      },
                      sequence(
                        step('calculateActionValue', {
                          key: 'effect_count',
                          operation: 'add',
                          left: { kind: 'blackboard', key: 'effect_count' },
                          right: { kind: 'constant', value: 1 },
                        }),
                      ),
                      undefined,
                      { alwaysNext: true },
                    ),
                  ),
                ),
                step('applyElementalInfliction', { element: 'nature', isExtra: false }),
                branch(
                  {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'EntityBB_wisd_greater_will', fallback: 0 },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                  sequence(
                    step(
                      'dealDamage',
                      {
                        damageType: 'nature',
                        attackScale: { kind: 'blackboard', key: 'atk_scale_wisd' },
                        tags: ['normalSkill'],
                        features: ['canBreakWeakness'],
                        stagger: { kind: 'blackboard', key: 'poise' },
                      },
                      'abilityentity_chr_0032_lizhiyan_normal_skill:chr_0032_lizhiyan_normal_skill_abilityrange2|chr_0032_lizhiyan_normal_skill_abilityrange:/childSkills/chr_0032_lizhiyan_normal_skill_abilityrange2/scheduledSequences/1/sequence/steps/2/whenTrue/steps/0',
                    ),
                  ),
                  sequence(
                    step(
                      'dealDamage',
                      {
                        damageType: 'nature',
                        attackScale: { kind: 'blackboard', key: 'atk_scale_will' },
                        tags: ['normalSkill'],
                        features: ['canBreakWeakness'],
                        stagger: { kind: 'blackboard', key: 'poise' },
                      },
                      'abilityentity_chr_0032_lizhiyan_normal_skill:chr_0032_lizhiyan_normal_skill_abilityrange2|chr_0032_lizhiyan_normal_skill_abilityrange:/childSkills/chr_0032_lizhiyan_normal_skill_abilityrange2/scheduledSequences/1/sequence/steps/2/whenFalse/steps/0',
                    ),
                  ),
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
                        time: 0,
                        value: 1,
                        inTangent: -14.14286,
                        outTangent: -14.14286,
                        weightedMode: 0,
                        inWeight: 0,
                        outWeight: 0,
                      },
                      {
                        time: 0.07,
                        value: 0.01,
                        inTangent: 0,
                        outTangent: 0,
                        weightedMode: 0,
                        inWeight: 0,
                        outWeight: 0,
                      },
                      {
                        time: 1,
                        value: 0.1,
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
              ),
              22,
            ),
            scheduled(
              20,
              sequence(step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 })),
              23,
            ),
            scheduled(22, sequence(step('finishActionOwnerAbilityEntity', {})), 25),
          ],
        },
        chr_0032_lizhiyan_normal_skill_abilityrange: {
          skillId: 'chr_0032_lizhiyan_normal_skill_abilityrange',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 240,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: { atk_scale: 0, duration: 6, isJumped: 0, poise: 0, radius: 5 },
          scheduledSequences: [
            scheduled(
              21,
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0032_lizhiyan_normal_skill_aura',
                  target: 'enemy',
                  source: 'currentAbilityEntity',
                  finishByAction: true,
                }),
              ),
              180,
            ),
            scheduled(
              21,
              sequence(
                step('listenForCombatEvents', {
                  responses: [
                    {
                      key: 'SkillData.chr_0032_lizhiyan_normal_skill_abilityrange.actionGroupData.timelineActions[1]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                      event: { kind: 'abilityEvent', event: 'beforeAddedBuff' },
                      phase: 'dataAction',
                      priority: 0,
                      sequence: sequence(
                        branch(
                          {
                            kind: 'eventBuffIdMatch',
                            buffIds: ['buff_chr_0032_lizhiyan_normal_skill_listener'],
                          },
                          sequence(
                            step('modifyActionValue', {
                              key: 'isJumped',
                              operation: 'assign',
                              value: { kind: 'constant', value: 1 },
                            }),
                            step('jumpTimeline', { destinationFrame: 180 }),
                          ),
                        ),
                      ),
                    },
                  ],
                }),
              ),
              180,
            ),
            scheduled(187, sequence(step('finishActionOwnerAbilityEntity', {})), 190),
            scheduled(
              20,
              sequence(
                forEachTarget('enemy', sequence()),
                step(
                  'dealDamage',
                  {
                    damageType: 'nature',
                    attackScale: { kind: 'blackboard', key: 'atk_scale' },
                    tags: ['normalSkill'],
                    stagger: { kind: 'blackboard', key: 'poise' },
                  },
                  'abilityentity_chr_0032_lizhiyan_normal_skill:chr_0032_lizhiyan_normal_skill_abilityrange2|chr_0032_lizhiyan_normal_skill_abilityrange:/childSkills/chr_0032_lizhiyan_normal_skill_abilityrange/scheduledSequences/3/sequence/steps/1',
                ),
                step('applyElementalInfliction', {
                  element: 'nature',
                  isExtra: false,
                  inverseReaction: true,
                }),
              ),
              23,
            ),
            scheduled(
              186,
              sequence(
                forEachTarget('enemy', sequence()),
                step(
                  'dealDamage',
                  {
                    damageType: 'nature',
                    attackScale: { kind: 'blackboard', key: 'atk_scale' },
                    tags: ['normalSkill'],
                    stagger: { kind: 'blackboard', key: 'poise' },
                  },
                  'abilityentity_chr_0032_lizhiyan_normal_skill:chr_0032_lizhiyan_normal_skill_abilityrange2|chr_0032_lizhiyan_normal_skill_abilityrange:/childSkills/chr_0032_lizhiyan_normal_skill_abilityrange/scheduledSequences/4/sequence/steps/1',
                ),
                branch(
                  {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'isJumped', fallback: 0 },
                    operator: 'greaterOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                  sequence(
                    step('applyElementalInfliction', {
                      element: 'nature',
                      isExtra: false,
                      inverseReaction: true,
                    }),
                  ),
                ),
              ),
              189,
            ),
          ],
        },
      },
    },
    abilityentity_chr_0032_lizhiyan_ultimate_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0032_lizhiyan/ultimate_aura',
      ],
      lifetime: { kind: 'limited', durationSeconds: 30 },
      childSkill: {
        skillId: 'chr_0032_lizhiyan_ultimate_skill_abilityrange',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 1800,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale_laser: 0.5,
          atk_scale_laser_will: 0.2,
          duration: 0,
          isWisd: 0,
          radius: 5,
        },
        scheduledSequences: [
          scheduled(
            0,
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_listener_abilityentity',
                target: 'currentAbilityEntity',
                inheritSourceSkillCastInfo: true,
                asChildBuff: true,
              }),
            ),
            1800,
          ),
          scheduled(
            0,
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'isWisd', fallback: 0 },
                  operator: 'greaterOrEqual',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_inaura',
                    target: 'enemy',
                    finishByAction: true,
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      atk_scale_laser: { kind: 'blackboard', key: 'atk_scale_laser' },
                    },
                  }),
                ),
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0032_lizhiyan_ultimate_skill_inaura',
                    target: 'enemy',
                    finishByAction: true,
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: {
                      atk_scale_laser: { kind: 'blackboard', key: 'atk_scale_laser_will' },
                    },
                  }),
                ),
                { alwaysNext: true },
              ),
            ),
            1800,
          ),
        ],
      },
    },
    abilityentity_chr_0032_lizhiyan_ultimate_skill_place: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0032_lizhiyan/ultimate_place',
      ],
      blackboard: { EntityBB_index: 0 },
      lifetime: { kind: 'limited', durationSeconds: 30 },
    },
    abilityentity_chr_0032_lizhiyan_combo_skill_death: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 6 },
      childSkill: {
        skillId: 'chr_0032_lizhiyan_combo_skill_abilityentity_death_move',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 200,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atb_final: 50,
          atk_scale_final: 1,
          minAngle: 0,
          number: 0,
          owner_mainchar_alpha: 0,
          owner_mainchar_distance: 0,
          poise_final: 0,
          radius: 5,
        },
        scheduledSequences: [],
      },
    },
    abilityentity_chr_0032_lizhiyan_combo_skill_place: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 6 },
    },
    abilityentity_chr_0032_lizhiyan_ultimate_skill_death: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 6 },
    },
    abilityentity_chr_0032_lizhiyan_ultimate_skill_laser_target: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 2 },
    },
    abilityentity_chr_0032_lizhiyan_ultimate_skill_laser: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0032_lizhiyan/ultimate_tower',
      ],
      lifetime: { kind: 'limited', durationSeconds: 2 },
      childSkill: {
        skillId: 'chr_0032_lizhiyan_ultimate_skill_laser',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 90,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale_laser: 1, duration: 0, radius: 5.67 },
        scheduledSequences: [
          scheduled(
            12,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'nature',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_laser' },
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                },
                'abilityentity_chr_0032_lizhiyan_ultimate_skill_laser:chr_0032_lizhiyan_ultimate_skill_laser:/childSkill/scheduledSequences/0/sequence/steps/0',
              ),
            ),
            28,
          ),
          scheduled(
            13,
            sequence(
              branch(
                {
                  kind: 'not',
                  condition: {
                    kind: 'timedMarkerPresent',
                    target: 'caster',
                    markerId: 'lizhiyan_ult_laser_hit1',
                  },
                },
                sequence(
                  step('createTimedMarker', {
                    target: 'caster',
                    markerId: 'lizhiyan_ult_laser_hit1',
                    durationSeconds: { kind: 'constant', value: 0.8 },
                    autoFinishByAction: false,
                  }),
                ),
                sequence(
                  branch(
                    {
                      kind: 'not',
                      condition: {
                        kind: 'timedMarkerPresent',
                        target: 'caster',
                        markerId: 'lizhiyan_ult_laser_hit2',
                      },
                    },
                    sequence(
                      step('createTimedMarker', {
                        target: 'caster',
                        markerId: 'lizhiyan_ult_laser_hit2',
                        durationSeconds: { kind: 'constant', value: 0.8 },
                        autoFinishByAction: false,
                      }),
                    ),
                    sequence(
                      branch(
                        {
                          kind: 'not',
                          condition: {
                            kind: 'timedMarkerPresent',
                            target: 'caster',
                            markerId: 'lizhiyan_ult_laser_hit3',
                          },
                        },
                        sequence(
                          step('createTimedMarker', {
                            target: 'caster',
                            markerId: 'lizhiyan_ult_laser_hit3',
                            durationSeconds: { kind: 'constant', value: 0.8 },
                            autoFinishByAction: false,
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
            45,
          ),
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default arcane;
