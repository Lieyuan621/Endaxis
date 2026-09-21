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
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withSkillBlackboard,
} from './definitionHelpers';

const sharedActionSequence5: ActionSequenceDefinition = sequence(
  step('readBuffBlackboard', {
    target: 'buffSource',
    query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent2'] },
    desiredKey: 'duration',
    outputKey: 'duration_temp',
  }),
  step('readBuffBlackboard', {
    target: 'buffSource',
    query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
    desiredKey: 'atk_up',
    outputKey: 'atk_up_temp',
  }),
  step('readBuffBlackboard', {
    target: 'buffSource',
    query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
    desiredKey: 'physpell_up',
    outputKey: 'physpell_up_temp',
  }),
  step('readBuffBlackboard', {
    target: 'buffSource',
    query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
    desiredKey: 'max_stack_owner',
    outputKey: 'max_stack_owner_temp',
  }),
  step('applyBuff', {
    buffId: 'buff_chr_0029_pograni_talent1',
    target: 'buffSource',
    source: 'buffSource',
    inheritSourceSkillCastInfo: true,
    copiedBlackboardAssignments: {
      duration: 'duration_temp',
      atk_up: 'atk_up_temp',
      physpell_up: 'physpell_up_temp',
      max_stack: 'max_stack_owner_temp',
    },
  }),
);

const sharedActionSequence1: ActionSequenceDefinition = sequence(
  step('calculateActionValue', {
    key: 'calc_atb1',
    operation: 'multiply',
    left: { kind: 'blackboard', key: 'atb1' },
    right: { kind: 'blackboard', key: 'atb_ratio' },
  }),
  step('changeResourceByActionValue', {
    resource: 'sp',
    amount: { kind: 'blackboard', key: 'calc_atb1' },
    coefficient: { kind: 'constant', value: 1 },
    recipient: 'team',
    spGainKind: 'gain',
    spGainSource: 'skill',
  }),
  step(
    'dealDamage',
    {
      damageType: 'physical',
      attackScale: { kind: 'blackboard', key: 'atk_scale' },
      tags: ['comboSkill'],
      features: ['canBreakWeakness'],
      stagger: { kind: 'blackboard', key: 'poise1' },
    },
    '\u0000endaxis-generated-identity:0',
  ),
  step('startTimeDilation', {
    scope: 'entity',
    durationSeconds: { kind: 'constant', value: 0.133 },
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
);

const sharedActionSequence4: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'buffIdStackCompare',
      target: 'buffSource',
      buffIds: ['buff_chr_0029_pograni_talent1_exist'],
      operator: 'greaterOrEqual',
      value: { kind: 'constant', value: 1 },
    },
    sharedActionSequence5,
  ),
);

const sharedActionSequence3: ActionSequenceDefinition = sequence(
  step('readBuffBlackboard', {
    target: 'buffSource',
    query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent2'] },
    desiredKey: 'duration',
    outputKey: 'duration_temp',
  }),
  step('readBuffBlackboard', {
    target: 'buffSource',
    query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
    desiredKey: 'atk_up',
    outputKey: 'atk_up_temp',
  }),
  step('readBuffBlackboard', {
    target: 'buffSource',
    query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
    desiredKey: 'physpell_up',
    outputKey: 'physpell_up_temp',
  }),
  step('readBuffBlackboard', {
    target: 'buffSource',
    query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
    desiredKey: 'max_stack_owner',
    outputKey: 'max_stack_owner_temp',
  }),
  step('readBuffBlackboard', {
    target: 'buffSource',
    query: { kind: 'id', buffIds: ['buff_chr_0029_pograni_talent1_exist'] },
    desiredKey: 'max_stack_team',
    outputKey: 'max_stack_team_temp',
  }),
  branch(
    { kind: 'actionInputTargetIdentityMatch', other: 'actionSource', operator: 'equal' },
    sequence(
      step('applyBuff', {
        buffId: 'buff_chr_0029_pograni_talent1',
        target: 'eventSource',
        source: 'buffSource',
        inheritSourceSkillCastInfo: true,
        copiedBlackboardAssignments: {
          duration: 'duration_temp',
          atk_up: 'atk_up_temp',
          physpell_up: 'physpell_up_temp',
          max_stack: 'max_stack_owner_temp',
        },
      }),
    ),
    sequence(
      step('applyBuff', {
        buffId: 'buff_chr_0029_pograni_talent1',
        target: 'eventSource',
        source: 'buffSource',
        inheritSourceSkillCastInfo: true,
        copiedBlackboardAssignments: {
          duration: 'duration_temp',
          atk_up: 'atk_up_temp',
          physpell_up: 'physpell_up_temp',
          max_stack: 'max_stack_team_temp',
        },
      }),
    ),
    { alwaysNext: true },
  ),
);

const sharedActionSequence2: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'buffIdStackCompare',
      target: 'buffSource',
      buffIds: ['buff_chr_0029_pograni_talent1_exist'],
      operator: 'greaterOrEqual',
      value: { kind: 'constant', value: 1 },
    },
    sharedActionSequence3,
  ),
);

export const pogranichnikChr_0029_pograni_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0029_pograni_attack1',
    timelineBlockFrames: 12,
    naturalDurationFrames: 118,
    exclusiveFrame: 17,
    offsetRecordFrame: 8,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 7,
          endFrame: 29,
          input: 'basicAttack',
          targetSkillId: 'chr_0029_pograni_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 12, endFrame: 29, skillIds: ['chr_0029_pograni_attack2'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        8,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0029_pograni_attack1:/scheduledSequences/0/sequence/steps/0',
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
                durationSeconds: { kind: 'constant', value: 0.06 },
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
        9,
      ),
      scheduled(
        12,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0029_pograni_attack2'] })),
        29,
      ),
    ],
    timelineContinuationSkillId: 'chr_0029_pograni_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.23, 0.25, 0.28, 0.3, 0.32, 0.35, 0.37, 0.39, 0.41, 0.44, 0.48, 0.52] },
);

export const pogranichnikChr_0029_pograni_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0029_pograni_attack2',
    timelineBlockFrames: 19,
    naturalDurationFrames: 124,
    exclusiveFrame: 22,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 7,
          endFrame: 39,
          input: 'basicAttack',
          targetSkillId: 'chr_0029_pograni_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 19, endFrame: 39, skillIds: ['chr_0029_pograni_attack3'] }],
    },
    costFrame: 8,
    scheduledSequences: [
      scheduled(
        7,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0029_pograni_attack2:/scheduledSequences/0/sequence/steps/0',
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
                durationSeconds: { kind: 'constant', value: 0.02 },
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
        13,
      ),
      scheduled(
        14,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0029_pograni_attack2:/scheduledSequences/1/sequence/steps/0',
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
                durationSeconds: { kind: 'constant', value: 0.06 },
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
        20,
      ),
      scheduled(
        19,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0029_pograni_attack3'] })),
        39,
      ),
    ],
    timelineContinuationSkillId: 'chr_0029_pograni_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.14, 0.15, 0.17, 0.18, 0.2, 0.21, 0.22, 0.24, 0.25, 0.27, 0.29, 0.32],
    display_atk_scale: [0.28, 0.31, 0.34, 0.36, 0.39, 0.42, 0.45, 0.48, 0.5, 0.54, 0.58, 0.63],
  },
);

export const pogranichnikChr_0029_pograni_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0029_pograni_attack3',
    timelineBlockFrames: 19,
    naturalDurationFrames: 175,
    exclusiveFrame: 29,
    offsetRecordFrame: 9,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 11,
          endFrame: 37,
          input: 'basicAttack',
          targetSkillId: 'chr_0029_pograni_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 19, endFrame: 37, skillIds: ['chr_0029_pograni_attack4'] }],
    },
    costFrame: 12,
    scheduledSequences: [
      scheduled(
        9,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
              stagger: { kind: 'blackboard', key: 'poise' },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0029_pograni_attack3:/scheduledSequences/0/sequence/steps/0',
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
        10,
      ),
      scheduled(
        15,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
              stagger: { kind: 'blackboard', key: 'poise' },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0029_pograni_attack3:/scheduledSequences/1/sequence/steps/0',
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
                durationSeconds: { kind: 'constant', value: 0.15 },
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
        19,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0029_pograni_attack4'] })),
        37,
      ),
    ],
    timelineContinuationSkillId: 'chr_0029_pograni_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.17, 0.18, 0.2, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.37],
    poise: 0,
    display_atk_scale: [0.33, 0.36, 0.4, 0.43, 0.46, 0.5, 0.53, 0.56, 0.59, 0.64, 0.68, 0.74],
  },
);

export const pogranichnikChr_0029_pograni_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0029_pograni_attack4',
    timelineBlockFrames: 18,
    naturalDurationFrames: 125,
    exclusiveFrame: 26,
    offsetRecordFrame: 3,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 10,
          endFrame: 33,
          input: 'basicAttack',
          targetSkillId: 'chr_0029_pograni_attack5',
        },
      ],
      allowedNextSkills: [{ startFrame: 18, endFrame: 33, skillIds: ['chr_0029_pograni_attack5'] }],
    },
    costFrame: 8,
    scheduledSequences: [
      scheduled(
        3,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
              stagger: { kind: 'blackboard', key: 'poise' },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0029_pograni_attack4:/scheduledSequences/0/sequence/steps/0',
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
        4,
      ),
      scheduled(
        5,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
              stagger: { kind: 'blackboard', key: 'poise' },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0029_pograni_attack4:/scheduledSequences/1/sequence/steps/0',
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
        7,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
              stagger: { kind: 'blackboard', key: 'poise' },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0029_pograni_attack4:/scheduledSequences/2/sequence/steps/0',
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
        8,
      ),
      scheduled(
        11,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
              stagger: { kind: 'blackboard', key: 'poise' },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0029_pograni_attack4:/scheduledSequences/3/sequence/steps/0',
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
        12,
      ),
      scheduled(
        13,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
              stagger: { kind: 'blackboard', key: 'poise' },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0029_pograni_attack4:/scheduledSequences/4/sequence/steps/0',
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
        17,
        sequence(
          branch(
            { kind: 'casterControlled' },
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
                      value: 0.3,
                      inTangent: -11.12636,
                      outTangent: -11.12636,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.05082683,
                      value: 0.06,
                      inTangent: -0.8463666,
                      outTangent: 0.1598016,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.5199714,
                      value: 0.2766429,
                      inTangent: 0.9066172,
                      outTangent: 0.9066172,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 1,
                      inTangent: 2.363477,
                      outTangent: 2.363477,
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
        20,
      ),
      scheduled(
        15,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
              stagger: { kind: 'blackboard', key: 'poise' },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0029_pograni_attack4:/scheduledSequences/6/sequence/steps/0',
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
        16,
      ),
      scheduled(
        18,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0029_pograni_attack5'] })),
        33,
      ),
    ],
    timelineContinuationSkillId: 'chr_0029_pograni_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.06, 0.07, 0.08, 0.08, 0.09, 0.1, 0.1, 0.11, 0.11, 0.12, 0.13, 0.14],
    poise: 0,
    display_atk_scale: [0.38, 0.42, 0.46, 0.5, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.79, 0.86],
  },
);

export const pogranichnikChr_0029_pograni_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0029_pograni_attack5',
    timelineBlockFrames: 24,
    naturalDurationFrames: 124,
    exclusiveFrame: 32,
    offsetRecordFrame: 16,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 15,
          endFrame: 32,
          input: 'basicAttack',
          targetSkillId: 'chr_0029_pograni_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 24, endFrame: 32, skillIds: ['chr_0029_pograni_attack1'] }],
    },
    costFrame: 12,
    scheduledSequences: [
      scheduled(
        16,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'normalAttackLastCombo'],
              stagger: { kind: 'blackboard', key: 'poise' },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0029_pograni_attack5:/scheduledSequences/0/sequence/steps/0',
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
        17,
      ),
      scheduled(
        19,
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
                durationSeconds: { kind: 'constant', value: 0.35 },
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
        21,
      ),
      scheduled(
        24,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0029_pograni_attack1'] })),
        32,
      ),
    ],
    timelineContinuationSkillId: 'chr_0029_pograni_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 20,
    atk_scale: [0.43, 0.47, 0.52, 0.56, 0.6, 0.65, 0.69, 0.73, 0.77, 0.83, 0.89, 0.97],
    isHitbyMain: 0,
    poise: 18,
  },
);

export const pogranichnikChr_0029_pograni_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0029_pograni_power_attack',
    timelineBlockFrames: 27,
    naturalDurationFrames: 145,
    exclusiveFrame: 47,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 27,
          endFrame: 49,
          skillIds: ['chr_0029_pograni_normal_skill', 'chr_0029_pograni_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        7,
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
            'chr_0029_pograni_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
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
            undefined,
            { alwaysNext: true },
          ),
        ),
        10,
      ),
      scheduled(
        14,
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
            'chr_0029_pograni_power_attack:/scheduledSequences/1/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.15 },
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
        17,
      ),
      scheduled(
        25,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.8,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0029_pograni_power_attack:/scheduledSequences/2/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(step('gainFinisherSp', { factor: 1, recipient: 'team' })),
            undefined,
            { alwaysNext: true },
          ),
        ),
        27,
      ),
      scheduled(
        25,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
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
          ),
        ),
        28,
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
        47,
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
        27,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const pogranichnikChr_0029_pograni_plunging_attack_end: SkillDefinition =
  withSkillBlackboard(
    {
      key: 'chr_0029_pograni_plunging_attack_end',
      timelineBlockFrames: 21,
      naturalDurationFrames: 93,
      exclusiveFrame: 20,
      offsetRecordFrame: 0,
      costFrame: 0,
      scheduledSequences: [
        scheduled(
          3,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'physical',
                attackScale: { kind: 'blackboard', key: 'atk_scale' },
                tags: ['normalAttack', 'plungingAttack'],
              },
              'chr_0029_pograni_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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
          8,
        ),
      ],
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      nativeSkillType: 'attack',
    },
    { atb: 0, atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
  );

export const pogranichnikChr_0029_pograni_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0029_pograni_normal_skill',
    timelineBlockFrames: 48,
    naturalDurationFrames: 218,
    exclusiveFrame: 55,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 48,
          endFrame: 55,
          skillIds: [
            'chr_0029_pograni_attack1',
            'chr_0029_pograni_attack2',
            'chr_0029_pograni_attack3',
            'chr_0029_pograni_attack4',
            'chr_0029_pograni_attack5',
          ],
        },
        { startFrame: 45, endFrame: 55, skillIds: ['chr_0029_pograni_normal_skill'] },
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
        7,
      ),
      scheduled(
        38,
        sequence(
          repeatEachTick(
            sequence(
              step('readBuffStackCount', {
                target: 'enemy',
                outputKey: 'num_1',
                query: {
                  kind: 'tag',
                  tagQueryType: 'hasAny',
                  buffTags: ['Skill/Character/Common/NoGuard'],
                },
              }),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'num_1', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'blackboard', key: 'num', fallback: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'num',
                    operation: 'assign',
                    value: { kind: 'blackboard', key: 'num_1' },
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
        39,
      ),
      scheduled(
        38,
        sequence({
          kind: 'switch',
          parameters: { choice: { kind: 'blackboard', key: 'num' }, alwaysNext: true },
          options: [
            {
              value: { kind: 'constant', value: 1 },
              sequence: sequence(
                step('changeResourceByActionValue', {
                  resource: 'sp',
                  amount: { kind: 'blackboard', key: 'atb1' },
                  coefficient: { kind: 'constant', value: 1 },
                  recipient: 'team',
                  spGainKind: 'gain',
                  spGainSource: 'skill',
                }),
              ),
            },
            {
              value: { kind: 'constant', value: 2 },
              sequence: sequence(
                step('changeResourceByActionValue', {
                  resource: 'sp',
                  amount: { kind: 'blackboard', key: 'atb2' },
                  coefficient: { kind: 'constant', value: 1 },
                  recipient: 'team',
                  spGainKind: 'gain',
                  spGainSource: 'skill',
                }),
              ),
            },
            {
              value: { kind: 'constant', value: 3 },
              sequence: sequence(
                step('changeResourceByActionValue', {
                  resource: 'sp',
                  amount: { kind: 'blackboard', key: 'atb3' },
                  coefficient: { kind: 'constant', value: 1 },
                  recipient: 'team',
                  spGainKind: 'gain',
                  spGainSource: 'skill',
                }),
              ),
            },
            {
              value: { kind: 'constant', value: 4 },
              sequence: sequence(
                step('changeResourceByActionValue', {
                  resource: 'sp',
                  amount: { kind: 'blackboard', key: 'atb4' },
                  coefficient: { kind: 'constant', value: 1 },
                  recipient: 'team',
                  spGainKind: 'gain',
                  spGainSource: 'skill',
                }),
              ),
            },
          ],
        }),
        39,
      ),
      scheduled(
        28,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0029_pograni_normal_skill:/scheduledSequences/3/sequence/steps/0',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.15 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        29,
      ),
      scheduled(
        38,
        sequence(
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
                orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
              },
              applyTags: ['Skill/Character/Common/NoGuard'],
              extendTags: [],
              blackboard: { atk_scale: 0, count: 0, duration: 20, skip_handle_cryst_break: 0 },
              attributeModifiers: [],
              lifecycleSequences: {
                start: sequence(
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
                finish: sequence(
                  step('applyBuff', {
                    buffId: 'buff_physical_no_guard_fake',
                    target: 'buffOwner',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
                afterEnhance: sequence(
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
                      step('igniteBuffs', {
                        target: 'buffOwner',
                        source: 'buffOwner',
                        igniteType: 'NoGuard',
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
                          kind: 'currentBuffStackCompare',
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 2 },
                        },
                        sequence(
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
                      ),
                    ),
                  },
                ),
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
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale2' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0029_pograni_normal_skill:/scheduledSequences/4/sequence/steps/1',
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
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.15,
                  value: 1,
                  inTangent: Number.POSITIVE_INFINITY,
                  outTangent: -4.930326,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.2077375,
                  value: 0.02,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.6975113,
                  value: 0.02,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 4.753838,
                  outTangent: 4.753838,
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
        38,
        sequence(
          step('applyBuff', {
            buffId: 'buff_common_obtain_ultimate_sp',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        39,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb_return: 15,
    atb1: 5,
    atb2: [10, 10, 10, 10, 10, 10, 10, 10, 10, 15, 15, 15],
    atb3: [20, 20, 20, 20, 20, 20, 20, 20, 20, 25, 25, 25],
    atb4: [30, 30, 30, 30, 30, 30, 30, 30, 30, 35, 35, 35],
    atk_scale: [0.86, 0.94, 1.03, 1.11, 1.2, 1.28, 1.37, 1.45, 1.54, 1.65, 1.77, 1.92],
    atk_scale2: [1.06, 1.16, 1.27, 1.37, 1.48, 1.58, 1.69, 1.8, 1.9, 2.03, 2.19, 2.38],
    has_potential1: 0,
    num: 0,
    num_1: 0,
    poise: 5,
  },
);

export const pogranichnikChr_0029_pograni_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0029_pograni_combo_skill',
    timelineBlockFrames: 72,
    naturalDurationFrames: 728,
    exclusiveFrame: 649,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 66, endFrame: 96, skillIds: ['chr_0029_pograni_normal_skill'] },
        { startFrame: 266, endFrame: 296, skillIds: ['chr_0029_pograni_normal_skill'] },
        { startFrame: 442, endFrame: 460, skillIds: ['chr_0029_pograni_normal_skill'] },
        { startFrame: 628, endFrame: 660, skillIds: ['chr_0029_pograni_normal_skill'] },
        {
          startFrame: 72,
          endFrame: 96,
          skillIds: [
            'chr_0029_pograni_attack1',
            'chr_0029_pograni_attack2',
            'chr_0029_pograni_attack3',
            'chr_0029_pograni_attack4',
            'chr_0029_pograni_attack5',
          ],
        },
        {
          startFrame: 272,
          endFrame: 296,
          skillIds: [
            'chr_0029_pograni_attack1',
            'chr_0029_pograni_attack2',
            'chr_0029_pograni_attack3',
            'chr_0029_pograni_attack4',
            'chr_0029_pograni_attack5',
          ],
        },
        {
          startFrame: 446,
          endFrame: 460,
          skillIds: [
            'chr_0029_pograni_attack1',
            'chr_0029_pograni_attack2',
            'chr_0029_pograni_attack3',
            'chr_0029_pograni_attack4',
            'chr_0029_pograni_attack5',
          ],
        },
        {
          startFrame: 632,
          endFrame: 660,
          skillIds: [
            'chr_0029_pograni_attack1',
            'chr_0029_pograni_attack2',
            'chr_0029_pograni_attack3',
            'chr_0029_pograni_attack4',
            'chr_0029_pograni_attack5',
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
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0029_pograni_combo_skill_count4'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'EntityBB_noguard_count',
                operation: 'assign',
                value: { kind: 'constant', value: 4 },
              }),
              step('finishBuffsById', {
                target: 'enemy',
                buffIds: [
                  'buff_chr_0029_pograni_combo_skill_count1',
                  'buff_chr_0029_pograni_combo_skill_count2',
                  'buff_chr_0029_pograni_combo_skill_count3',
                  'buff_chr_0029_pograni_combo_skill_count4',
                ],
                reason: 'other',
              }),
            ),
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0029_pograni_combo_skill_count3'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'EntityBB_noguard_count',
                    operation: 'assign',
                    value: { kind: 'constant', value: 3 },
                  }),
                  step('finishBuffsById', {
                    target: 'enemy',
                    buffIds: [
                      'buff_chr_0029_pograni_combo_skill_count1',
                      'buff_chr_0029_pograni_combo_skill_count2',
                      'buff_chr_0029_pograni_combo_skill_count3',
                      'buff_chr_0029_pograni_combo_skill_count4',
                    ],
                    reason: 'other',
                  }),
                ),
                sequence(
                  branch(
                    {
                      kind: 'buffIdStackCompare',
                      target: 'caster',
                      buffIds: ['buff_chr_0029_pograni_combo_skill_count2'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'EntityBB_noguard_count',
                        operation: 'assign',
                        value: { kind: 'constant', value: 2 },
                      }),
                      step('finishBuffsById', {
                        target: 'enemy',
                        buffIds: [
                          'buff_chr_0029_pograni_combo_skill_count1',
                          'buff_chr_0029_pograni_combo_skill_count2',
                          'buff_chr_0029_pograni_combo_skill_count3',
                          'buff_chr_0029_pograni_combo_skill_count4',
                        ],
                        reason: 'other',
                      }),
                    ),
                    sequence(
                      step('modifyActionValue', {
                        key: 'EntityBB_noguard_count',
                        operation: 'assign',
                        value: { kind: 'constant', value: 1 },
                      }),
                      step('finishBuffsById', {
                        target: 'enemy',
                        buffIds: [
                          'buff_chr_0029_pograni_combo_skill_count1',
                          'buff_chr_0029_pograni_combo_skill_count2',
                          'buff_chr_0029_pograni_combo_skill_count3',
                          'buff_chr_0029_pograni_combo_skill_count4',
                        ],
                        reason: 'other',
                      }),
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
        3,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'EntityBB_noguard_count', fallback: 0 },
              operator: 'lessOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(step('jumpTimeline', { destinationFrame: 600 })),
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'EntityBB_noguard_count', fallback: 0 },
                  operator: 'lessOrEqual',
                  right: { kind: 'constant', value: 2 },
                },
                sequence(step('jumpTimeline', { destinationFrame: 400 })),
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'EntityBB_noguard_count', fallback: 0 },
                      operator: 'lessOrEqual',
                      right: { kind: 'constant', value: 3 },
                    },
                    sequence(step('jumpTimeline', { destinationFrame: 200 })),
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
        200,
        sequence(
          step('findCharacterTeamTargets', {
            saveToContextKey: 'mainchar',
            selection: { kind: 'controlledOperator' },
          }),
        ),
        201,
      ),
      scheduled(
        400,
        sequence(
          step('findCharacterTeamTargets', {
            saveToContextKey: 'mainchar',
            selection: { kind: 'controlledOperator' },
          }),
        ),
        401,
      ),
      scheduled(
        600,
        sequence(
          step('findCharacterTeamTargets', {
            saveToContextKey: 'mainchar',
            selection: { kind: 'controlledOperator' },
          }),
        ),
        601,
      ),
      scheduled(80, sequence(step('markCurrentSkillCanInterrupt', {})), 83),
      scheduled(191, sequence(step('finishTimeline', {})), 194),
      scheduled(280, sequence(step('markCurrentSkillCanInterrupt', {})), 283),
      scheduled(391, sequence(step('finishTimeline', {})), 394),
      scheduled(450, sequence(step('markCurrentSkillCanInterrupt', {})), 453),
      scheduled(545, sequence(step('finishTimeline', {})), 548),
      scheduled(
        23,
        instantiateActionSequence(sharedActionSequence1, [
          'chr_0029_pograni_combo_skill:/scheduledSequences/12/sequence/steps/2',
        ]),
        26,
      ),
      scheduled(
        37,
        sequence(
          step('calculateActionValue', {
            key: 'calc_atb2',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'atb2' },
            right: { kind: 'blackboard', key: 'atb_ratio' },
          }),
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'calc_atb2' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale2' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise1' },
            },
            'chr_0029_pograni_combo_skill:/scheduledSequences/13/sequence/steps/2',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.133 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        40,
      ),
      scheduled(
        61,
        sequence(
          step('calculateActionValue', {
            key: 'calc_atb4',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'atb4' },
            right: { kind: 'blackboard', key: 'atb_ratio' },
          }),
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'calc_atb4' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale4' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise4' },
            },
            'chr_0029_pograni_combo_skill:/scheduledSequences/14/sequence/steps/2',
          ),
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
                  value: 0.45,
                  inTangent: -7.146868,
                  outTangent: -7.146868,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.08,
                  value: 0.05,
                  inTangent: 0.0647267,
                  outTangent: 0.0647267,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.4542674,
                  value: 0.08,
                  inTangent: 0.09682205,
                  outTangent: 0.857443,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 2.77354,
                  outTangent: 2.77354,
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
        64,
      ),
      scheduled(
        223,
        instantiateActionSequence(sharedActionSequence1, [
          'chr_0029_pograni_combo_skill:/scheduledSequences/15/sequence/steps/2',
        ]),
        226,
      ),
      scheduled(
        237,
        sequence(
          step('calculateActionValue', {
            key: 'calc_atb2',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'atb2' },
            right: { kind: 'blackboard', key: 'atb_ratio' },
          }),
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'calc_atb2' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale2' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise1' },
            },
            'chr_0029_pograni_combo_skill:/scheduledSequences/16/sequence/steps/2',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.133 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        240,
      ),
      scheduled(
        261,
        sequence(
          step('calculateActionValue', {
            key: 'calc_atb3',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'atb3' },
            right: { kind: 'blackboard', key: 'atb_ratio' },
          }),
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'calc_atb3' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale3' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise3' },
            },
            'chr_0029_pograni_combo_skill:/scheduledSequences/17/sequence/steps/2',
          ),
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
                  value: 0.45,
                  inTangent: -7.146868,
                  outTangent: -7.146868,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.08,
                  value: 0.05,
                  inTangent: 0.0647267,
                  outTangent: 0.0647267,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.4542674,
                  value: 0.08,
                  inTangent: 0.09682205,
                  outTangent: 0.857443,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 2.77354,
                  outTangent: 2.77354,
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
        264,
      ),
      scheduled(
        423,
        instantiateActionSequence(sharedActionSequence1, [
          'chr_0029_pograni_combo_skill:/scheduledSequences/18/sequence/steps/2',
        ]),
        426,
      ),
      scheduled(
        437,
        sequence(
          step('calculateActionValue', {
            key: 'calc_atb2',
            operation: 'multiply',
            left: { kind: 'blackboard', key: 'atb2' },
            right: { kind: 'blackboard', key: 'atb_ratio' },
          }),
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'calc_atb2' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale2' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise1' },
            },
            'chr_0029_pograni_combo_skill:/scheduledSequences/19/sequence/steps/2',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.133 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        440,
      ),
      scheduled(
        623,
        instantiateActionSequence(sharedActionSequence1, [
          'chr_0029_pograni_combo_skill:/scheduledSequences/20/sequence/steps/2',
        ]),
        626,
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
        200,
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
        221,
      ),
      scheduled(
        400,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.700000048 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        418,
      ),
      scheduled(
        600,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.73300004 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        619,
      ),
    ],
    smartTarget: 'trigger',
    cooldownFrames: [540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540, 510],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atb_ratio: 1,
    atb1: 5,
    atb2: 7,
    atb3: 13,
    atb4: 23,
    atk_scale: [0.42, 0.46, 0.5, 0.55, 0.59, 0.63, 0.67, 0.71, 0.76, 0.81, 0.87, 0.95],
    atk_scale2: [0.54, 0.59, 0.65, 0.7, 0.76, 0.81, 0.86, 0.92, 0.97, 1.04, 1.12, 1.22],
    atk_scale3: [0.66, 0.73, 0.79, 0.86, 0.92, 0.99, 1.06, 1.12, 1.19, 1.27, 1.37, 1.49],
    atk_scale4: [1.32, 1.45, 1.58, 1.72, 1.85, 1.98, 2.11, 2.24, 2.38, 2.54, 2.74, 2.97],
    calc_atb1: 0,
    calc_atb2: 0,
    calc_atb3: 0,
    calc_atb4: 0,
    poise1: 3,
    poise3: 4,
    poise4: 9,
    usp: 10,
  },
);

export const pogranichnikChr_0029_pograni_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0029_pograni_ultimate_skill',
    timelineBlockFrames: 91,
    naturalDurationFrames: 210,
    exclusiveFrame: 90,
    offsetRecordFrame: 0,
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
        74,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ae1',
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ae2',
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ae3',
          }),
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
            childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            target: 'enemy',
            saveToContextKey: 'ae4',
          }),
          step('setIgnoreGlobalTimeScale', {
            abilityEntityTargets: [{ kind: 'context', contextKey: 'ae1' }],
            ignore: true,
            revertOnEnd: true,
          }),
          step('setIgnoreGlobalTimeScale', {
            abilityEntityTargets: [{ kind: 'context', contextKey: 'ae2' }],
            ignore: true,
            revertOnEnd: true,
          }),
          step('setIgnoreGlobalTimeScale', {
            abilityEntityTargets: [{ kind: 'context', contextKey: 'ae3' }],
            ignore: true,
            revertOnEnd: true,
          }),
          step('setIgnoreGlobalTimeScale', {
            abilityEntityTargets: [{ kind: 'context', contextKey: 'ae4' }],
            ignore: true,
            revertOnEnd: true,
          }),
        ),
        77,
      ),
      scheduled(
        76,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale_rush' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise_rush' },
            },
            'chr_0029_pograni_ultimate_skill:/scheduledSequences/3/sequence/steps/0',
          ),
        ),
        82,
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
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 75),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        75,
      ),
      scheduled(
        0,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'soldiers',
            abilityEntityIds: ['abilityentity_chr_0029_pograni_ultimate_skill'],
          }),
          forEachContextTarget('soldiers', sequence(step('finishCurrentAbilityEntity', {}))),
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0029_pograni_ultimate_skill'],
            reason: 'other',
          }),
        ),
        3,
      ),
    ],
    cooldownFrames: 300,
    costs: [{ resource: 'ultimateEnergy', value: 90 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    angle: 120,
    atb_final: [30, 30, 30, 30, 30, 30, 30, 30, 30, 40, 40, 40],
    atb_trigger: [7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 10, 10, 10],
    atk_scale_final: [2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.85, 4.15, 4.5],
    atk_scale_rush: [1.33, 1.47, 1.6, 1.73, 1.86, 2, 2.13, 2.26, 2.4, 2.56, 2.76, 3],
    atk_scale_trigger: [0.45, 0.49, 0.53, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.92, 1],
    center_radius: 6,
    duration: 30,
    height: 4,
    poise_final: 15,
    poise_rush: 10,
    radius: 5,
  },
);

export const pogranichnikCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const pogranichnik: OperatorDefinition = {
  slug: 'pogranichnik',
  gameId: 'POGRANICHNK',
  rarity: 6,
  weaponType: 'sword',
  element: 'physical',
  role: 'vanguard',
  mainAttribute: 'will',
  secondaryAttribute: 'agility',
  attributes: {
    strength: [12, 31, 51, 71, 91, 101],
    agility: [13, 34, 55, 77, 99, 110],
    intellect: [10, 28, 48, 67, 87, 97],
    will: [20, 52, 87, 121, 156, 173],
    baseAttack: [30, 92, 157, 223, 288, 321],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        pogranichnikChr_0029_pograni_attack1,
        pogranichnikChr_0029_pograni_attack2,
        pogranichnikChr_0029_pograni_attack3,
        pogranichnikChr_0029_pograni_attack4,
        pogranichnikChr_0029_pograni_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: pogranichnikChr_0029_pograni_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: pogranichnikChr_0029_pograni_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: pogranichnikChr_0029_pograni_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: pogranichnikChr_0029_pograni_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: pogranichnikChr_0029_pograni_ultimate_skill,
    },
  ],
  dodgeSkill: pogranichnikCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0029_pograni_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0029_pograni_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0029_pograni_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0029_pograni_attack1',
        'chr_0029_pograni_attack2',
        'chr_0029_pograni_attack3',
        'chr_0029_pograni_attack4',
        'chr_0029_pograni_attack5',
        'chr_0029_pograni_power_attack',
        'chr_0029_pograni_plunging_attack_end',
      ],
      normalAttackSkillKeys: [
        'chr_0029_pograni_attack1',
        'chr_0029_pograni_attack2',
        'chr_0029_pograni_attack3',
        'chr_0029_pograni_attack4',
        'chr_0029_pograni_attack5',
      ],
      defaultSkillKey: 'chr_0029_pograni_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0029_pograni_combo_skill',
      event: 'beforeAddedBuff',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'eventBuffTagsMatch',
            match: 'hasAny',
            buffTags: [
              'Skill/Character/Common/PhysicalStatus/FractureStatus',
              'Skill/Character/Common/PhysicalStatus/CrushStatus',
            ],
          },
          sequence(
            branch(
              {
                kind: 'contextTargetBuffIdStackCompare',
                contextKey: 'trigger',
                buffIds: ['buff_physical_no_guard'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 1 },
              },
              sequence(
                branch(
                  {
                    kind: 'contextTargetObjectTypeMatch',
                    contextKey: 'trigger',
                    objectTypes: ['enemy', 'enemyPart'],
                  },
                  sequence(
                    step('readBuffStackCount', {
                      target: 'eventTarget',
                      outputKey: 'EntityBB_noguard_count',
                      query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
                    }),
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'EntityBB_noguard_count', fallback: 0 },
                        operator: 'equal',
                        right: { kind: 'constant', value: 4 },
                      },
                      sequence(
                        step('applyBuff', {
                          buffId: 'buff_chr_0029_pograni_combo_skill_count4',
                          target: 'caster',
                          inheritSourceSkillCastInfo: true,
                        }),
                      ),
                      sequence(
                        branch(
                          {
                            kind: 'actionValueCompare',
                            left: {
                              kind: 'blackboard',
                              key: 'EntityBB_noguard_count',
                              fallback: 0,
                            },
                            operator: 'equal',
                            right: { kind: 'constant', value: 3 },
                          },
                          sequence(
                            step('applyBuff', {
                              buffId: 'buff_chr_0029_pograni_combo_skill_count3',
                              target: 'caster',
                              inheritSourceSkillCastInfo: true,
                            }),
                          ),
                          sequence(
                            branch(
                              {
                                kind: 'actionValueCompare',
                                left: {
                                  kind: 'blackboard',
                                  key: 'EntityBB_noguard_count',
                                  fallback: 0,
                                },
                                operator: 'equal',
                                right: { kind: 'constant', value: 2 },
                              },
                              sequence(
                                step('applyBuff', {
                                  buffId: 'buff_chr_0029_pograni_combo_skill_count2',
                                  target: 'caster',
                                  inheritSourceSkillCastInfo: true,
                                }),
                              ),
                              sequence(
                                step('applyBuff', {
                                  buffId: 'buff_chr_0029_pograni_combo_skill_count1',
                                  target: 'caster',
                                  inheritSourceSkillCastInfo: true,
                                }),
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
          key: 'chr_0029_pograni_talent1',
          blackboard: {
            atb_gain: [80, 80],
            atk_up: [0.04, 0.08],
            duration: [20, 20],
            max_stack_owner: [3, 3],
            max_stack_team: [3, 3],
            physpell_up: [4, 8],
          },
          enableSequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0029_pograni_talent1_exist',
              target: 'caster',
              inheritSourceSkillCastInfo: false,
              blackboardAssignments: {
                atk_up: { kind: 'blackboard', key: 'atk_up' },
                max_stack_owner: { kind: 'blackboard', key: 'max_stack_owner' },
                physpell_up: { kind: 'blackboard', key: 'physpell_up' },
              },
            }),
          ),
          abilityEventResponses: [
            {
              event: 'skillSpGained',
              priority: 0,
              sequence: sequence(
                branch(
                  { kind: 'eventSpGainMatch', sources: ['skill'], gainKinds: ['gain'] },
                  sequence(
                    step('storeEventSpGainAmount', { outputKey: 'atb_contain_temp' }),
                    step('modifyActionValue', {
                      key: 'EntityBB_atb_contain',
                      operation: 'add',
                      value: { kind: 'blackboard', key: 'atb_contain_temp' },
                    }),
                    branch(
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'EntityBB_atb_contain', fallback: 0 },
                        operator: 'greaterOrEqual',
                        right: { kind: 'blackboard', key: 'atb_gain', fallback: 0 },
                      },
                      sequence(
                        step('calculateActionValue', {
                          key: 'atb_gain_minus',
                          operation: 'multiply',
                          left: { kind: 'blackboard', key: 'atb_gain' },
                          right: { kind: 'constant', value: -1 },
                        }),
                        step('modifyActionValue', {
                          key: 'EntityBB_atb_contain',
                          operation: 'add',
                          value: { kind: 'blackboard', key: 'atb_gain_minus' },
                        }),
                        step('applyBuff', {
                          buffId: 'buff_chr_0029_pograni_talent1',
                          target: 'caster',
                          inheritSourceSkillCastInfo: true,
                          asChildBuff: true,
                          copiedBlackboardAssignments: {
                            duration: 'duration',
                            atk_up: 'atk_up',
                            physpell_up: 'physpell_up',
                            max_stack: 'max_stack_owner',
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
    {
      levels: 2,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0029_pograni_talent2',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { duration: [5, 10] },
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
          blackboardKey: 'has_potential1',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'atb_return',
          operation: 'assign',
          value: 15,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['will'], value: 20 },
        { kind: 'addStaticDamageIncrease', target: 'physical', value: 0.1 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0029_pograni_talent1',
          blackboardKey: 'atb_gain',
          operation: 'assign',
          value: 60,
        },
        {
          kind: 'patchPassiveBlackboard',
          passiveSkillKey: 'chr_0029_pograni_talent1',
          blackboardKey: 'max_stack_owner',
          operation: 'assign',
          value: 5,
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
        { kind: 'addSkillCooldownFrames', skillGroupKey: 'comboSkill', frames: -60 },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'atb_ratio',
          operation: 'assign',
          value: 1.2,
        },
      ],
    },
  ],
  entityBlackboard: { EntityBB_atb_contain: 0, EntityBB_noguard_count: 0 },
  buffDefinitions: {
    buff_chr_0029_pograni_combo_skill_count1: {
      stackingType: 'overwriteDuration',
      priority: 0,
      maxStackCount: 99,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: ['Skill/Character/chr_0029_pgrani/combo/combo1'],
      extendTags: [],
      blackboard: { duration: 6 },
      attributeModifiers: [],
    },
    buff_chr_0029_pograni_combo_skill_count2: {
      stackingType: 'overwriteDuration',
      priority: 0,
      maxStackCount: 99,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: ['Skill/Character/chr_0029_pgrani/combo/combo2'],
      extendTags: [],
      blackboard: { duration: 6 },
      attributeModifiers: [],
    },
    buff_chr_0029_pograni_combo_skill_count3: {
      stackingType: 'overwriteDuration',
      priority: 0,
      maxStackCount: 99,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: ['Skill/Character/chr_0029_pgrani/combo/combo3'],
      extendTags: [],
      blackboard: { duration: 6 },
      attributeModifiers: [],
    },
    buff_chr_0029_pograni_combo_skill_count4: {
      stackingType: 'overwriteDuration',
      priority: 0,
      maxStackCount: 99,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: ['Skill/Character/chr_0029_pgrani/combo/combo4'],
      extendTags: [],
      blackboard: { duration: 6 },
      attributeModifiers: [],
    },
    buff_chr_0029_pograni_talent1: {
      stackingType: 'highPriorityWithMaxStack',
      priority: 0,
      maxStackCount: { blackboardKey: 'max_stack' },
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_pograni_talent_1',
        iconPath: '/icons/icon_battle_pograni_talent_1.webp',
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
      applyTags: [],
      extendTags: [],
      blackboard: { atk_up: 0.1, duration: 20, max_stack: 3, physpell_up: 10 },
      attributeModifiers: [
        { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
        {
          attribute: 'PhysicalAndSpellInflictionEnhance',
          slot: 'baseAddition',
          value: { blackboardKey: 'physpell_up' },
        },
      ],
    },
    buff_chr_0029_pograni_talent1_exist: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: { blackboardKey: 'max_stack' },
      applyTags: [],
      extendTags: [],
      blackboard: { atk_up: 0, max_stack_owner: 5, max_stack_team: 3, physpell_up: 0 },
      attributeModifiers: [],
    },
    buff_chr_0029_pograni_talent2: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: { blackboardKey: 'max_stack' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 20 },
      attributeModifiers: [],
    },
    buff_chr_0029_pograni_ultimate_skill: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: {
        atb_final: 0,
        atb_trigger: 0,
        atk_scale_final: 0,
        atk_scale_rush: 0,
        atk_scale_trigger: 0,
        count: 5,
        duration: 20,
        poise_final: 0,
      },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0029_pograni_ultimate_skill_count',
            target: 'buffSource',
            source: 'buffSource',
            count: { kind: 'blackboard', key: 'count' },
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            copiedBlackboardAssignments: { duration: 'duration' },
          }),
        ),
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0029_pograni_ultimate_skill_abilityentity_inaura',
            target: 'enemy',
            source: 'buffOwner',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              atk_scale_trigger: { kind: 'blackboard', key: 'atk_scale_trigger' },
              atk_scale_final: { kind: 'blackboard', key: 'atk_scale_final' },
              atb_trigger: { kind: 'blackboard', key: 'atb_trigger' },
              atb_final: { kind: 'blackboard', key: 'atb_final' },
              poise_final: { kind: 'blackboard', key: 'poise_final' },
            },
          }),
        ),
        finish: sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0029_pograni_ultimate_skill_effect_layer'],
            reason: 'other',
          }),
        ),
      },
    },
    buff_chr_0029_pograni_ultimate_skill_abilityentity_inaura: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: {
        atb_final: 0,
        atb_trigger: 0,
        atk_scale_final: 0,
        atk_scale_trigger: 0,
        atk_up_temp: 0,
        duration: 20,
        duration_temp: 0,
        interval: 0.1,
        max_stack_owner_temp: 0,
        max_stack_team_temp: 0,
        physpell_up_temp: 0,
        poise_final: 0,
        radius: 5,
      },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'beforeTakePhysicalInfliction',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'not',
                condition: {
                  kind: 'timedMarkerPresent',
                  target: 'buffSource',
                  markerId: 'chr_0029_pograni_soldier_attacked',
                },
              },
              sequence(
                branch(
                  {
                    kind: 'buffIdStackCompare',
                    target: 'buffSource',
                    buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                    operator: 'equal',
                    value: { kind: 'constant', value: 1 },
                  },
                  sequence(
                    step('finishBuffsById', {
                      target: 'caster',
                      buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                      reason: 'other',
                      count: { kind: 'constant', value: 1 },
                    }),
                    step('applyBuff', {
                      buffId: 'buff_chr_0029_pograni_ultimate_skill_finall_rush',
                      target: 'buffOwner',
                      source: 'buffSource',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        atk_scale_final: 'atk_scale_final',
                        atb_final: 'atb_final',
                        poise_final: 'poise_final',
                      },
                    }),
                    step('createTimedMarker', {
                      target: 'buffSource',
                      markerId: 'chr_0029_pograni_soldier_attacked',
                      durationSeconds: { kind: 'blackboard', key: 'interval' },
                      autoFinishByAction: false,
                    }),
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'buffSource',
                        buffIds: ['buff_chr_0029_pograni_talent2'],
                        operator: 'greaterOrEqual',
                        value: { kind: 'constant', value: 1 },
                      },
                      sharedActionSequence2,
                    ),
                  ),
                ),
              ),
            ),
          ),
        },
        {
          event: 'beforeTakePhysicalInfliction',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'not',
                condition: {
                  kind: 'timedMarkerPresent',
                  target: 'buffSource',
                  markerId: 'chr_0029_pograni_soldier_attacked',
                },
              },
              sequence(
                branch(
                  {
                    kind: 'buffIdStackCompare',
                    target: 'buffSource',
                    buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                    operator: 'greater',
                    value: { kind: 'constant', value: 1 },
                  },
                  sequence(
                    step('spawnAbilityEntity', {
                      abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
                      childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity_attack2',
                      inheritActionBlackboard: true,
                      dieWhenSourceDies: false,
                      target: 'enemy',
                    }),
                    step('finishBuffsById', {
                      target: 'caster',
                      buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                      reason: 'other',
                      count: { kind: 'constant', value: 1 },
                    }),
                    step('createTimedMarker', {
                      target: 'buffSource',
                      markerId: 'chr_0029_pograni_soldier_attacked',
                      durationSeconds: { kind: 'blackboard', key: 'interval' },
                      autoFinishByAction: false,
                    }),
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'buffSource',
                        buffIds: ['buff_chr_0029_pograni_talent2'],
                        operator: 'greaterOrEqual',
                        value: { kind: 'constant', value: 1 },
                      },
                      sharedActionSequence2,
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
                kind: 'not',
                condition: {
                  kind: 'timedMarkerPresent',
                  target: 'buffSource',
                  markerId: 'chr_0029_pograni_soldier_attacked',
                },
              },
              sequence(
                branch(
                  { kind: 'eventSourceMatchesBuffSource' },
                  sequence(
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'buffSource',
                        buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                        operator: 'equal',
                        value: { kind: 'constant', value: 1 },
                      },
                      sequence(
                        branch(
                          { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['comboSkill'] },
                          sequence(
                            step('finishBuffsById', {
                              target: 'caster',
                              buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                              reason: 'other',
                              count: { kind: 'constant', value: 1 },
                            }),
                            step('applyBuff', {
                              buffId: 'buff_chr_0029_pograni_ultimate_skill_finall_rush',
                              target: 'buffOwner',
                              source: 'buffSource',
                              inheritSourceSkillCastInfo: true,
                              copiedBlackboardAssignments: {
                                atk_scale_final: 'atk_scale_final',
                                atb_final: 'atb_final',
                                poise_final: 'poise_final',
                              },
                            }),
                            step('createTimedMarker', {
                              target: 'buffSource',
                              markerId: 'chr_0029_pograni_soldier_attacked',
                              durationSeconds: { kind: 'blackboard', key: 'interval' },
                              autoFinishByAction: false,
                            }),
                            branch(
                              {
                                kind: 'buffIdStackCompare',
                                target: 'buffSource',
                                buffIds: ['buff_chr_0029_pograni_talent2'],
                                operator: 'greaterOrEqual',
                                value: { kind: 'constant', value: 1 },
                              },
                              sharedActionSequence4,
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
          event: 'beforeTakeDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'not',
                condition: {
                  kind: 'timedMarkerPresent',
                  target: 'buffSource',
                  markerId: 'chr_0029_pograni_soldier_attacked',
                },
              },
              sequence(
                branch(
                  { kind: 'eventSourceMatchesBuffSource' },
                  sequence(
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'buffSource',
                        buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                        operator: 'greater',
                        value: { kind: 'constant', value: 1 },
                      },
                      sequence(
                        branch(
                          { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['comboSkill'] },
                          sequence(
                            step('spawnAbilityEntity', {
                              abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
                              childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity_attack2',
                              inheritActionBlackboard: true,
                              dieWhenSourceDies: false,
                              target: 'enemy',
                            }),
                            step('finishBuffsById', {
                              target: 'caster',
                              buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                              reason: 'other',
                              count: { kind: 'constant', value: 1 },
                            }),
                            step('createTimedMarker', {
                              target: 'buffSource',
                              markerId: 'chr_0029_pograni_soldier_attacked',
                              durationSeconds: { kind: 'blackboard', key: 'interval' },
                              autoFinishByAction: false,
                            }),
                            branch(
                              {
                                kind: 'buffIdStackCompare',
                                target: 'buffSource',
                                buffIds: ['buff_chr_0029_pograni_talent2'],
                                operator: 'greaterOrEqual',
                                value: { kind: 'constant', value: 1 },
                              },
                              sharedActionSequence4,
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
      ],
    },
    buff_chr_0029_pograni_ultimate_skill_count: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 99,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_pograni_buff',
        iconPath: '/icons/icon_battle_pograni_buff.webp',
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
      applyTags: [],
      extendTags: [],
      blackboard: { count: 4, duration: 30 },
      attributeModifiers: [],
    },
    buff_chr_0029_pograni_ultimate_skill_finall_rush: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 1.2,
      applyTags: [],
      extendTags: [],
      blackboard: { atb_final: 0, atk_scale_final: 0, count: 4, duration: 20, poise_final: 0 },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          0,
          sequence(
            step('spawnAbilityEntity', {
              abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
              childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish4',
              inheritActionBlackboard: true,
              dieWhenSourceDies: false,
              target: 'enemy',
            }),
          ),
          3,
        ),
        scheduled(
          0,
          sequence(
            step('spawnAbilityEntity', {
              abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
              childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish4',
              inheritActionBlackboard: true,
              dieWhenSourceDies: false,
              target: 'enemy',
            }),
          ),
          3,
        ),
        scheduled(
          0,
          sequence(
            step('spawnAbilityEntity', {
              abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
              childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish4',
              inheritActionBlackboard: true,
              dieWhenSourceDies: false,
              target: 'enemy',
            }),
          ),
          3,
        ),
        scheduled(
          0,
          sequence(
            step('spawnAbilityEntity', {
              abilityEntityId: 'abilityentity_chr_0029_pograni_ultimate_skill',
              childSkillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish4',
              inheritActionBlackboard: true,
              dieWhenSourceDies: false,
              target: 'enemy',
            }),
          ),
          3,
        ),
        scheduled(
          0,
          sequence(
            step('startTimeDilation', {
              scope: 'global',
              durationSeconds: { kind: 'constant', value: 1 },
              slot: 'unassigned',
              priority: 100,
              curve: { kind: 'named', key: 'ComboSkill' },
              finishByAction: false,
              ignoredTargets: [],
              ignoredAbilityEntityTargets: [
                {
                  kind: 'ownerSpawned',
                  abilityEntityIds: ['abilityentity_chr_0029_pograni_ultimate_skill'],
                },
              ],
            }),
          ),
          30,
        ),
      ],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0029_pograni_ultimate_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Skill/Character/chr_0029_pgrani/Soldier',
      ],
      lifetime: { kind: 'limited', durationSeconds: 50 },
      childSkills: {
        chr_0029_pograni_ultimate_skill_abilityentity: {
          skillId: 'chr_0029_pograni_ultimate_skill_abilityentity',
          blackboard: {
            atb_final: 0,
            atb_trigger: 4,
            atk_scale_final: 0,
            atk_scale_rush: 1,
            atk_scale_trigger: 0,
            duration: 20,
            poise_final: 0,
            radius: 5,
          },
          scheduledSequences: [
            scheduled(50, sequence(step('finishActionOwnerAbilityEntity', {})), 53),
            scheduled(
              3,
              sequence(
                branch(
                  {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0029_pograni_ultimate_skill'],
                    operator: 'equal',
                    value: { kind: 'constant', value: 0 },
                  },
                  sequence(
                    step('applyBuff', {
                      buffId: 'buff_chr_0029_pograni_ultimate_skill',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        duration: 'duration',
                        atk_scale_trigger: 'atk_scale_trigger',
                        atk_scale_final: 'atk_scale_final',
                        atb_trigger: 'atb_trigger',
                        atb_final: 'atb_final',
                        poise_final: 'poise_final',
                      },
                    }),
                  ),
                ),
              ),
              17,
            ),
          ],
        },
        chr_0029_pograni_ultimate_skill_abilityentity_attack2: {
          skillId: 'chr_0029_pograni_ultimate_skill_abilityentity_attack2',
          blackboard: {
            atb_trigger: 10,
            atk_scale_trigger: 1,
            minAngle: 0,
            number: 0,
            owner_mainchar_alpha: 0,
            owner_mainchar_distance: 0,
            radius: 5,
          },
          scheduledSequences: [
            scheduled(
              0,
              sequence(
                branch(
                  {
                    kind: 'buffIdStackCompare',
                    target: 'caster',
                    buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                    operator: 'equal',
                    value: { kind: 'constant', value: 5 },
                  },
                  sequence(),
                  sequence(
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'caster',
                        buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                        operator: 'equal',
                        value: { kind: 'constant', value: 4 },
                      },
                      sequence(step('jumpTimeline', { destinationFrame: 100 })),
                      sequence(
                        branch(
                          {
                            kind: 'buffIdStackCompare',
                            target: 'caster',
                            buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                            operator: 'equal',
                            value: { kind: 'constant', value: 3 },
                          },
                          sequence(step('jumpTimeline', { destinationFrame: 200 })),
                          sequence(
                            branch(
                              {
                                kind: 'buffIdStackCompare',
                                target: 'caster',
                                buffIds: ['buff_chr_0029_pograni_ultimate_skill_count'],
                                operator: 'equal',
                                value: { kind: 'constant', value: 2 },
                              },
                              sequence(step('jumpTimeline', { destinationFrame: 300 })),
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
              3,
            ),
            scheduled(59, sequence(step('finishActionOwnerAbilityEntity', {})), 62),
            scheduled(157, sequence(step('finishActionOwnerAbilityEntity', {})), 160),
            scheduled(257, sequence(step('finishActionOwnerAbilityEntity', {})), 260),
            scheduled(357, sequence(step('finishActionOwnerAbilityEntity', {})), 360),
            scheduled(
              9,
              sequence(
                step('changeResourceByActionValue', {
                  resource: 'sp',
                  amount: { kind: 'blackboard', key: 'atb_trigger' },
                  coefficient: { kind: 'constant', value: 1 },
                  recipient: 'team',
                  spGainKind: 'gain',
                  spGainSource: 'skill',
                }),
                step(
                  'dealDamage',
                  {
                    damageType: 'physical',
                    attackScale: { kind: 'blackboard', key: 'atk_scale_trigger' },
                    tags: ['ultimateSkill'],
                  },
                  'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_attack2/scheduledSequences/5/sequence/steps/1',
                ),
                step('startTimeDilation', {
                  scope: 'entity',
                  durationSeconds: { kind: 'constant', value: 0.2 },
                  slot: 'TimeDilation/Layer/Entity/HitStop',
                  priority: 10,
                  curve: { kind: 'named', key: 'char_normal_attack' },
                  finishByAction: false,
                  targets: ['enemy'],
                  abilityEntityTargets: [{ kind: 'current' }],
                }),
              ),
              13,
            ),
            scheduled(
              108,
              sequence(
                step('changeResourceByActionValue', {
                  resource: 'sp',
                  amount: { kind: 'blackboard', key: 'atb_trigger' },
                  coefficient: { kind: 'constant', value: 1 },
                  recipient: 'team',
                  spGainKind: 'gain',
                  spGainSource: 'skill',
                }),
                step(
                  'dealDamage',
                  {
                    damageType: 'physical',
                    attackScale: { kind: 'blackboard', key: 'atk_scale_trigger' },
                    tags: ['ultimateSkill'],
                  },
                  'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_attack2/scheduledSequences/6/sequence/steps/1',
                ),
                step('startTimeDilation', {
                  scope: 'entity',
                  durationSeconds: { kind: 'constant', value: 0.2 },
                  slot: 'TimeDilation/Layer/Entity/HitStop',
                  priority: 10,
                  curve: { kind: 'named', key: 'char_normal_attack' },
                  finishByAction: false,
                  targets: ['enemy'],
                  abilityEntityTargets: [{ kind: 'current' }],
                }),
              ),
              112,
            ),
            scheduled(
              209,
              sequence(
                step('changeResourceByActionValue', {
                  resource: 'sp',
                  amount: { kind: 'blackboard', key: 'atb_trigger' },
                  coefficient: { kind: 'constant', value: 1 },
                  recipient: 'team',
                  spGainKind: 'gain',
                  spGainSource: 'skill',
                }),
                step(
                  'dealDamage',
                  {
                    damageType: 'physical',
                    attackScale: { kind: 'blackboard', key: 'atk_scale_trigger' },
                    tags: ['ultimateSkill'],
                  },
                  'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_attack2/scheduledSequences/7/sequence/steps/1',
                ),
                step('startTimeDilation', {
                  scope: 'entity',
                  durationSeconds: { kind: 'constant', value: 0.2 },
                  slot: 'TimeDilation/Layer/Entity/HitStop',
                  priority: 10,
                  curve: { kind: 'named', key: 'char_normal_attack' },
                  finishByAction: false,
                  targets: ['enemy'],
                  abilityEntityTargets: [{ kind: 'current' }],
                }),
              ),
              213,
            ),
            scheduled(
              307,
              sequence(
                step('changeResourceByActionValue', {
                  resource: 'sp',
                  amount: { kind: 'blackboard', key: 'atb_trigger' },
                  coefficient: { kind: 'constant', value: 1 },
                  recipient: 'team',
                  spGainKind: 'gain',
                  spGainSource: 'skill',
                }),
                step(
                  'dealDamage',
                  {
                    damageType: 'physical',
                    attackScale: { kind: 'blackboard', key: 'atk_scale_trigger' },
                    tags: ['ultimateSkill'],
                  },
                  'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_attack2/scheduledSequences/8/sequence/steps/1',
                ),
                step('startTimeDilation', {
                  scope: 'entity',
                  durationSeconds: { kind: 'constant', value: 0.2 },
                  slot: 'TimeDilation/Layer/Entity/HitStop',
                  priority: 10,
                  curve: { kind: 'named', key: 'char_normal_attack' },
                  finishByAction: false,
                  targets: ['enemy'],
                  abilityEntityTargets: [{ kind: 'current' }],
                }),
              ),
              311,
            ),
            scheduled(
              0,
              sequence(
                step('startTimeDilation', {
                  scope: 'entity',
                  durationSeconds: { kind: 'constant', value: 0.4 },
                  slot: 'TimeDilation/Layer/Entity/HitStop',
                  priority: 30,
                  curve: {
                    kind: 'inline',
                    keys: [
                      {
                        time: 0,
                        value: 0.3,
                        inTangent: -11.5167389,
                        outTangent: -11.5167389,
                        weightedMode: 2,
                        inWeight: 0,
                        outWeight: 0.318046421,
                      },
                      {
                        time: 0.05494036,
                        value: 0.04303966,
                        inTangent: 0.115633719,
                        outTangent: 0.115633719,
                        weightedMode: 1,
                        inWeight: 0.333333343,
                        outWeight: 0.6580062,
                      },
                      {
                        time: 1,
                        value: 1,
                        inTangent: 4.71006632,
                        outTangent: 4.71006632,
                        weightedMode: 1,
                        inWeight: 0.2407477,
                        outWeight: 0,
                      },
                    ],
                  },
                  finishByAction: false,
                  targets: ['caster'],
                  abilityEntityTargets: [{ kind: 'current' }],
                }),
              ),
              3,
            ),
            scheduled(
              100,
              sequence(
                step('startTimeDilation', {
                  scope: 'entity',
                  durationSeconds: { kind: 'constant', value: 0.4 },
                  slot: 'TimeDilation/Layer/Entity/HitStop',
                  priority: 30,
                  curve: {
                    kind: 'inline',
                    keys: [
                      {
                        time: 0,
                        value: 0.3,
                        inTangent: -11.5167389,
                        outTangent: -11.5167389,
                        weightedMode: 2,
                        inWeight: 0,
                        outWeight: 0.318046421,
                      },
                      {
                        time: 0.05494036,
                        value: 0.04303966,
                        inTangent: 0.115633719,
                        outTangent: 0.115633719,
                        weightedMode: 1,
                        inWeight: 0.333333343,
                        outWeight: 0.6580062,
                      },
                      {
                        time: 1,
                        value: 1,
                        inTangent: 4.71006632,
                        outTangent: 4.71006632,
                        weightedMode: 1,
                        inWeight: 0.2407477,
                        outWeight: 0,
                      },
                    ],
                  },
                  finishByAction: false,
                  targets: ['caster'],
                  abilityEntityTargets: [{ kind: 'current' }],
                }),
              ),
              103,
            ),
            scheduled(
              200,
              sequence(
                step('startTimeDilation', {
                  scope: 'entity',
                  durationSeconds: { kind: 'constant', value: 0.4 },
                  slot: 'TimeDilation/Layer/Entity/HitStop',
                  priority: 30,
                  curve: {
                    kind: 'inline',
                    keys: [
                      {
                        time: 0,
                        value: 0.3,
                        inTangent: -11.5167389,
                        outTangent: -11.5167389,
                        weightedMode: 2,
                        inWeight: 0,
                        outWeight: 0.318046421,
                      },
                      {
                        time: 0.05494036,
                        value: 0.04303966,
                        inTangent: 0.115633719,
                        outTangent: 0.115633719,
                        weightedMode: 1,
                        inWeight: 0.333333343,
                        outWeight: 0.6580062,
                      },
                      {
                        time: 1,
                        value: 1,
                        inTangent: 4.71006632,
                        outTangent: 4.71006632,
                        weightedMode: 1,
                        inWeight: 0.2407477,
                        outWeight: 0,
                      },
                    ],
                  },
                  finishByAction: false,
                  targets: ['caster'],
                  abilityEntityTargets: [{ kind: 'current' }],
                }),
              ),
              203,
            ),
            scheduled(
              300,
              sequence(
                step('startTimeDilation', {
                  scope: 'entity',
                  durationSeconds: { kind: 'constant', value: 0.4 },
                  slot: 'TimeDilation/Layer/Entity/HitStop',
                  priority: 30,
                  curve: {
                    kind: 'inline',
                    keys: [
                      {
                        time: 0,
                        value: 0.3,
                        inTangent: -11.5167389,
                        outTangent: -11.5167389,
                        weightedMode: 2,
                        inWeight: 0,
                        outWeight: 0.318046421,
                      },
                      {
                        time: 0.05494036,
                        value: 0.04303966,
                        inTangent: 0.115633719,
                        outTangent: 0.115633719,
                        weightedMode: 1,
                        inWeight: 0.333333343,
                        outWeight: 0.6580062,
                      },
                      {
                        time: 1,
                        value: 1,
                        inTangent: 4.71006632,
                        outTangent: 4.71006632,
                        weightedMode: 1,
                        inWeight: 0.2407477,
                        outWeight: 0,
                      },
                    ],
                  },
                  finishByAction: false,
                  targets: ['caster'],
                  abilityEntityTargets: [{ kind: 'current' }],
                }),
              ),
              303,
            ),
          ],
        },
        chr_0029_pograni_ultimate_skill_abilityentity_finish4: {
          skillId: 'chr_0029_pograni_ultimate_skill_abilityentity_finish4',
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
          scheduledSequences: [
            scheduled(75, sequence(step('finishActionOwnerAbilityEntity', {})), 78),
            scheduled(
              31,
              sequence(
                step('finishBuffsById', {
                  target: 'caster',
                  buffIds: ['buff_chr_0029_pograni_ultimate_skill'],
                  reason: 'other',
                }),
              ),
              38,
            ),
            scheduled(
              25,
              sequence(
                branch(
                  {
                    kind: 'not',
                    condition: {
                      kind: 'timedMarkerPresent',
                      target: 'caster',
                      markerId: 'chr_0029_pograni_ultimate_finalhit',
                    },
                  },
                  sequence(
                    step('changeResourceByActionValue', {
                      resource: 'sp',
                      amount: { kind: 'blackboard', key: 'atb_final' },
                      coefficient: { kind: 'constant', value: 1 },
                      recipient: 'team',
                      spGainKind: 'gain',
                      spGainSource: 'skill',
                    }),
                    step('createTimedMarker', {
                      target: 'caster',
                      markerId: 'chr_0029_pograni_ultimate_finalhit',
                      durationSeconds: { kind: 'constant', value: 0.1 },
                      autoFinishByAction: false,
                    }),
                    step(
                      'dealDamage',
                      {
                        damageType: 'physical',
                        attackScale: { kind: 'blackboard', key: 'atk_scale_final' },
                        tags: ['ultimateSkill'],
                        features: ['canBreakWeakness'],
                        stagger: { kind: 'blackboard', key: 'poise_final' },
                      },
                      'abilityentity_chr_0029_pograni_ultimate_skill:chr_0029_pograni_ultimate_skill_abilityentity|chr_0029_pograni_ultimate_skill_abilityentity_attack2|chr_0029_pograni_ultimate_skill_abilityentity_finish4:/childSkills/chr_0029_pograni_ultimate_skill_abilityentity_finish4/scheduledSequences/2/sequence/steps/0/whenTrue/steps/2',
                    ),
                  ),
                  undefined,
                  { alwaysNext: true },
                ),
              ),
              52,
            ),
            scheduled(
              0,
              sequence(
                step('startTimeDilation', {
                  scope: 'entity',
                  durationSeconds: { kind: 'constant', value: 0.4 },
                  slot: 'TimeDilation/Layer/Entity/HitStop',
                  priority: 30,
                  curve: {
                    kind: 'inline',
                    keys: [
                      {
                        time: 0,
                        value: 0.3,
                        inTangent: -11.5167389,
                        outTangent: -11.5167389,
                        weightedMode: 2,
                        inWeight: 0,
                        outWeight: 0.318046421,
                      },
                      {
                        time: 0.05,
                        value: 0.01,
                        inTangent: 0.15876019,
                        outTangent: 0.0561449826,
                        weightedMode: 3,
                        inWeight: 0.333333343,
                        outWeight: 0.73591876,
                      },
                      {
                        time: 1,
                        value: 1,
                        inTangent: 3.72562432,
                        outTangent: 3.72562432,
                        weightedMode: 1,
                        inWeight: 0.306914866,
                        outWeight: 0,
                      },
                    ],
                  },
                  finishByAction: false,
                  targets: ['caster'],
                  abilityEntityTargets: [{ kind: 'current' }],
                }),
              ),
              3,
            ),
          ],
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default pogranichnik;
