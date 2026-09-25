/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type {
  ActionSequenceDefinition,
  OperatorDefinition,
  SkillDefinition,
} from '../../core/game-data/operatorDefinition';
import {
  branch,
  forEachTarget,
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withSkillBlackboard,
} from './definitionHelpers';

const sharedActionSequence1: ActionSequenceDefinition = sequence(
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

const sharedActionSequence4: ActionSequenceDefinition = sequence({
  kind: 'switch',
  parameters: { choice: { kind: 'blackboard', key: 'count' }, alwaysNext: true },
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
});

const sharedActionSequence3: ActionSequenceDefinition = sequence(
  branch(
    {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: 'ignore_hit_effect', fallback: 0 },
      operator: 'less',
      right: { kind: 'constant', value: 0.5 },
    },
    sharedActionSequence4,
  ),
);

const sharedActionSequence2: ActionSequenceDefinition = sequence(
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
            enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
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
      step('igniteBuffs', { target: 'buffOwner', source: 'caster', igniteType: 'PhysicalStatus' }),
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
    body: sharedActionSequence3,
  },
);

export const endministratorChr_0003_endminf_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0003_endminf_attack1',
    timelineBlockFrames: 9,
    naturalDurationFrames: 179,
    exclusiveFrame: 12,
    offsetRecordFrame: 6,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 5,
          endFrame: 24,
          input: 'basicAttack',
          targetSkillId: 'chr_0003_endminf_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 9, endFrame: 24, skillIds: ['chr_0003_endminf_attack2'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        6,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0003_endminf_attack1:/scheduledSequences/0/sequence/steps/0',
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
        7,
      ),
      scheduled(
        9,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0003_endminf_attack2'] })),
        24,
      ),
    ],
    timelineContinuationSkillId: 'chr_0003_endminf_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.23, 0.25, 0.27, 0.29, 0.32, 0.34, 0.36, 0.39, 0.41, 0.44, 0.47, 0.51],
    poise: 0,
  },
);

export const endministratorChr_0003_endminf_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0003_endminf_attack2',
    timelineBlockFrames: 12,
    naturalDurationFrames: 105,
    exclusiveFrame: 15,
    offsetRecordFrame: 5,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 4,
          endFrame: 30,
          input: 'basicAttack',
          targetSkillId: 'chr_0003_endminf_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 12, endFrame: 30, skillIds: ['chr_0003_endminf_attack3'] }],
    },
    costFrame: 8,
    scheduledSequences: [
      scheduled(
        5,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0003_endminf_attack2:/scheduledSequences/0/sequence/steps/0',
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
        11,
      ),
      scheduled(
        12,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0003_endminf_attack3'] })),
        30,
      ),
    ],
    timelineContinuationSkillId: 'chr_0003_endminf_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.27, 0.3, 0.32, 0.35, 0.38, 0.41, 0.43, 0.46, 0.49, 0.52, 0.56, 0.61],
    poise: 0,
  },
);

export const endministratorChr_0003_endminf_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0003_endminf_attack3',
    timelineBlockFrames: 17,
    naturalDurationFrames: 101,
    exclusiveFrame: 22,
    offsetRecordFrame: 5,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 12,
          endFrame: 35,
          input: 'basicAttack',
          targetSkillId: 'chr_0003_endminf_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 17, endFrame: 35, skillIds: ['chr_0003_endminf_attack4'] }],
    },
    costFrame: 12,
    scheduledSequences: [
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
            'chr_0003_endminf_attack3:/scheduledSequences/0/sequence/steps/0',
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
        12,
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
            'chr_0003_endminf_attack3:/scheduledSequences/1/sequence/steps/0',
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
        13,
      ),
      scheduled(
        17,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0003_endminf_attack4'] })),
        35,
      ),
    ],
    timelineContinuationSkillId: 'chr_0003_endminf_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    poise: 0,
    display_atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.63, 0.68],
  },
);

export const endministratorChr_0003_endminf_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0003_endminf_attack4',
    timelineBlockFrames: 32,
    naturalDurationFrames: 127,
    exclusiveFrame: 34,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 18,
          endFrame: 45,
          input: 'basicAttack',
          targetSkillId: 'chr_0003_endminf_attack5',
        },
      ],
      allowedNextSkills: [{ startFrame: 32, endFrame: 45, skillIds: ['chr_0003_endminf_attack5'] }],
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
            'chr_0003_endminf_attack4:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb' },
                coefficient: { kind: 'constant', value: 0.25 },
                recipient: 'team',
                spGainKind: 'gain',
                spGainSource: 'normalAttack',
              }),
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.03 },
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
        8,
      ),
      scheduled(
        9,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0003_endminf_attack4:/scheduledSequences/1/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb' },
                coefficient: { kind: 'constant', value: 0.25 },
                recipient: 'team',
                spGainKind: 'gain',
                spGainSource: 'normalAttack',
              }),
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.03 },
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
        19,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0003_endminf_attack4:/scheduledSequences/2/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb' },
                coefficient: { kind: 'constant', value: 0.25 },
                recipient: 'team',
                spGainKind: 'gain',
                spGainSource: 'normalAttack',
              }),
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
            undefined,
            { alwaysNext: true },
          ),
        ),
        20,
      ),
      scheduled(
        18,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0003_endminf_attack4:/scheduledSequences/3/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb' },
                coefficient: { kind: 'constant', value: 0.25 },
                recipient: 'team',
                spGainKind: 'gain',
                spGainSource: 'normalAttack',
              }),
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.02 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'endminf_stone' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        19,
      ),
      scheduled(
        32,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0003_endminf_attack5'] })),
        45,
      ),
    ],
    timelineContinuationSkillId: 'chr_0003_endminf_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.09, 0.1, 0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19],
    poise: 0,
    display_atk_scale: [0.35, 0.38, 0.41, 0.45, 0.48, 0.52, 0.55, 0.59, 0.62, 0.67, 0.72, 0.78],
  },
);

export const endministratorChr_0003_endminf_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0003_endminf_attack5',
    timelineBlockFrames: 25,
    naturalDurationFrames: 125,
    exclusiveFrame: 26,
    offsetRecordFrame: 18,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 15,
          endFrame: 32,
          input: 'basicAttack',
          targetSkillId: 'chr_0003_endminf_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 25, endFrame: 32, skillIds: ['chr_0003_endminf_attack1'] }],
    },
    costFrame: 12,
    scheduledSequences: [
      scheduled(
        16,
        sequence(
          step('mergeContextTargets', {
            saveToContextKey: 'tar',
            sources: [{ kind: 'target', target: 'enemy' }],
          }),
        ),
        19,
      ),
      scheduled(
        18,
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
            'chr_0003_endminf_attack5:/scheduledSequences/1/sequence/steps/0',
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
        19,
      ),
      scheduled(
        18,
        sequence(
          step('mergeContextTargets', {
            saveToContextKey: 'tar',
            sources: [{ kind: 'target', target: 'enemy' }],
          }),
        ),
        19,
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
                durationSeconds: { kind: 'constant', value: 0.3 },
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
        18,
        sequence(
          step('finishBuffsById', {
            target: 'enemy',
            buffIds: ['buff_chr_0003_endminf_attack4'],
            reason: 'other',
          }),
        ),
        21,
      ),
      scheduled(
        25,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0003_endminf_attack1'] })),
        32,
      ),
    ],
    timelineContinuationSkillId: 'chr_0003_endminf_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 20,
    atk_scale: [0.4, 0.44, 0.48, 0.52, 0.56, 0.6, 0.64, 0.68, 0.72, 0.77, 0.83, 0.9],
    isHitbyMain: 0,
    poise: 18,
  },
);

export const endministratorChr_0003_endminf_power_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0003_endminf_power_attack2',
    timelineBlockFrames: 27,
    naturalDurationFrames: 192,
    exclusiveFrame: 47,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 27,
          endFrame: 58,
          skillIds: ['chr_0003_endminf_normal_skill', 'chr_0003_endminf_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        9,
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
            'chr_0003_endminf_power_attack2:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'constant', value: 0 },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'team',
                spGainKind: 'gain',
                spGainSource: 'default',
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        15,
      ),
      scheduled(
        27,
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
            'chr_0003_endminf_power_attack2:/scheduledSequences/1/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(step('gainFinisherSp', { factor: 1, recipient: 'team' })),
            undefined,
            { alwaysNext: true },
          ),
        ),
        29,
      ),
      scheduled(
        30,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
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
          ),
        ),
        32,
      ),
      scheduled(
        11,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.12 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_normal_attack' },
                finishByAction: false,
                targets: ['caster'],
              }),
            ),
          ),
        ),
        29,
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

export const endministratorChr_0003_endminf_plunging_attack_end: SkillDefinition =
  withSkillBlackboard(
    {
      key: 'chr_0003_endminf_plunging_attack_end',
      timelineBlockFrames: 21,
      naturalDurationFrames: 154,
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
                damageType: 'physical',
                attackScale: { kind: 'blackboard', key: 'atk_scale' },
                tags: ['normalAttack', 'plungingAttack'],
              },
              'chr_0003_endminf_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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
      ],
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      nativeSkillType: 'attack',
    },
    { atb: 0, atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
  );

export const endministratorChr_0003_endminf_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0003_endminf_normal_skill',
    timelineBlockFrames: 29,
    naturalDurationFrames: 151,
    exclusiveFrame: 28,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 24, endFrame: 54, skillIds: ['chr_0003_endminf_normal_skill'] },
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
        11,
        sequence(
          repeatEachTick(
            sequence(
              branch(
                {
                  kind: 'all',
                  conditions: [
                    {
                      kind: 'buffIdStackCompare',
                      target: 'caster',
                      buffIds: ['buff_chr_0003_endminf_potential1'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    {
                      kind: 'buffIdStackCompare',
                      target: 'enemy',
                      buffIds: ['buff_common_originum_frozen'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'has_returned', fallback: 0 },
                      operator: 'equal',
                      right: { kind: 'constant', value: 0 },
                    },
                  ],
                },
                sequence(
                  branch(
                    {
                      kind: 'buffIdStackCompare',
                      target: 'enemy',
                      buffIds: ['buff_common_originum_frozen'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'constant', value: 1 },
                    },
                    sequence(
                      step('readBuffBlackboard', {
                        target: 'caster',
                        query: { kind: 'id', buffIds: ['buff_chr_0003_endminf_potential1'] },
                        desiredKey: 'atb_return',
                        outputKey: 'atb_return',
                      }),
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
                            afterEnhance: sharedActionSequence1,
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
                          lifecycleSequences: { start: sharedActionSequence2 },
                        },
                        damageMultiplier: { kind: 'constant', value: 1 },
                        ignoreHitEffect: false,
                      }),
                      step('changeResourceByActionValue', {
                        resource: 'sp',
                        amount: { kind: 'blackboard', key: 'atb_return' },
                        coefficient: { kind: 'constant', value: 1 },
                        recipient: 'team',
                        spGainKind: 'refund',
                        spGainSource: 'skill',
                      }),
                      step('modifyActionValue', {
                        key: 'has_returned',
                        operation: 'assign',
                        value: { kind: 'constant', value: 1 },
                      }),
                      step(
                        'dealDamage',
                        {
                          damageType: 'physical',
                          attackScale: { kind: 'blackboard', key: 'atk_scale' },
                          tags: ['normalSkill'],
                          features: ['canBreakWeakness'],
                          stagger: { kind: 'blackboard', key: 'poise' },
                        },
                        'chr_0003_endminf_normal_skill:/scheduledSequences/1/sequence/steps/0/body/steps/0/whenTrue/steps/0/whenTrue/steps/4',
                      ),
                      branch(
                        {
                          kind: 'actionValueCompare',
                          left: { kind: 'blackboard', key: 'trigger', fallback: 0 },
                          operator: 'lessOrEqual',
                          right: { kind: 'constant', value: 0 },
                        },
                        sequence(
                          step('startTimeDilation', {
                            scope: 'entity',
                            durationSeconds: { kind: 'constant', value: 0.36 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: {
                              kind: 'inline',
                              keys: [
                                {
                                  time: 0,
                                  value: 0.4,
                                  inTangent: -4.16987,
                                  outTangent: -4.16987,
                                  weightedMode: 0,
                                  inWeight: 0,
                                  outWeight: 0,
                                },
                                {
                                  time: 0.15,
                                  value: 0.05,
                                  inTangent: 0,
                                  outTangent: 0,
                                  weightedMode: 0,
                                  inWeight: 0,
                                  outWeight: 0,
                                },
                                {
                                  time: 0.4844323,
                                  value: 0.07220779,
                                  inTangent: 0.1940728,
                                  outTangent: 0.1940728,
                                  weightedMode: 0,
                                  inWeight: 0,
                                  outWeight: 0,
                                },
                                {
                                  time: 1,
                                  value: 1,
                                  inTangent: 3.032697,
                                  outTangent: 3.032697,
                                  weightedMode: 0,
                                  inWeight: 0,
                                  outWeight: 0,
                                },
                              ],
                            },
                            finishByAction: false,
                            targets: ['enemy', 'caster'],
                          }),
                          step('modifyActionValue', {
                            key: 'trigger',
                            operation: 'add',
                            value: { kind: 'constant', value: 1 },
                          }),
                        ),
                        undefined,
                        { alwaysNext: true },
                      ),
                    ),
                  ),
                ),
                sequence(
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
                        afterEnhance: sharedActionSequence1,
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
                      lifecycleSequences: { start: sharedActionSequence2 },
                    },
                    damageMultiplier: { kind: 'constant', value: 1 },
                    ignoreHitEffect: false,
                  }),
                  step(
                    'dealDamage',
                    {
                      damageType: 'physical',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'blackboard', key: 'poise' },
                    },
                    'chr_0003_endminf_normal_skill:/scheduledSequences/1/sequence/steps/0/body/steps/0/whenFalse/steps/1',
                  ),
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'trigger', fallback: 0 },
                      operator: 'lessOrEqual',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('startTimeDilation', {
                        scope: 'entity',
                        durationSeconds: { kind: 'constant', value: 0.36 },
                        slot: 'TimeDilation/Layer/Entity/HitStop',
                        priority: 10,
                        curve: {
                          kind: 'inline',
                          keys: [
                            {
                              time: 0,
                              value: 0.4,
                              inTangent: -4.16987,
                              outTangent: -4.16987,
                              weightedMode: 0,
                              inWeight: 0,
                              outWeight: 0,
                            },
                            {
                              time: 0.15,
                              value: 0.05,
                              inTangent: 0,
                              outTangent: 0,
                              weightedMode: 0,
                              inWeight: 0,
                              outWeight: 0,
                            },
                            {
                              time: 0.4844323,
                              value: 0.07220779,
                              inTangent: 0.1940728,
                              outTangent: 0.1940728,
                              weightedMode: 0,
                              inWeight: 0,
                              outWeight: 0,
                            },
                            {
                              time: 1,
                              value: 1,
                              inTangent: 3.032697,
                              outTangent: 3.032697,
                              weightedMode: 0,
                              inWeight: 0,
                              outWeight: 0,
                            },
                          ],
                        },
                        finishByAction: false,
                        targets: ['enemy', 'caster'],
                      }),
                      step('modifyActionValue', {
                        key: 'trigger',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
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
        12,
      ),
      scheduled(11, sequence(step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 })), 12),
      scheduled(
        11,
        sequence(
          branch(
            {
              kind: 'all',
              conditions: [
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0003_endminf_potential5'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0003_endminf_potential5_trigger'],
                  operator: 'lessOrEqual',
                  value: { kind: 'constant', value: 0 },
                },
              ],
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0003_endminf_potential5_trigger',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
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
    atb_return: 0,
    atk_scale: [1.56, 1.71, 1.87, 2.02, 2.18, 2.34, 2.49, 2.65, 2.8, 3, 3.23, 3.5],
    has_returned: 0,
    poise: 10,
    trigger: 0,
  },
);

export const endministratorChr_0003_endminf_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0003_endminf_ultimate_skill',
    timelineBlockFrames: 56,
    naturalDurationFrames: 250,
    exclusiveFrame: 55,
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
        50,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0003_endminf_ultimate_skill:/scheduledSequences/2/sequence/steps/0',
          ),
          forEachTarget(
            'enemy',
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'enemy',
                  buffIds: ['buff_common_originum_frozen'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'physical',
                      attackScale: { kind: 'blackboard', key: 'originum_ult_break_scale' },
                      tags: ['ultimateSkill'],
                    },
                    'chr_0003_endminf_ultimate_skill:/scheduledSequences/2/sequence/steps/1/body/steps/0/whenTrue/steps/0',
                  ),
                  step('igniteBuffs', {
                    target: 'enemy',
                    source: 'caster',
                    igniteType: 'EndminUlt',
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
            ),
          ),
        ),
        53,
      ),
      scheduled(
        50,
        sequence(
          branch(
            {
              kind: 'all',
              conditions: [
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0003_endminf_potential5'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0003_endminf_potential5_trigger'],
                  operator: 'lessOrEqual',
                  value: { kind: 'constant', value: 0 },
                },
              ],
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0003_endminf_potential5_trigger',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        53,
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
        55,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 44),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        44,
      ),
    ],
    cooldownFrames: 300,
    costs: [{ resource: 'ultimateEnergy', value: 80 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale: [3.56, 3.91, 4.27, 4.62, 4.98, 5.33, 5.69, 6.04, 6.4, 6.84, 7.38, 8],
    originum_ult_break_scale: [2.67, 2.94, 3.2, 3.47, 3.74, 4, 4.27, 4.54, 4.8, 5.14, 5.54, 6],
    poise: 25,
  },
);

export const endministratorChr_0003_endminf_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0003_endminf_combo_skill',
    timelineBlockFrames: 31,
    naturalDurationFrames: 164,
    exclusiveFrame: 30,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 23, endFrame: 54, skillIds: ['chr_0003_endminf_normal_skill'] },
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
        23,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'constant', value: 0 },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0003_endminf_combo_skill:/scheduledSequences/1/sequence/steps/0',
          ),
          step('applyBuff', {
            buffId: 'buff_common_originum_frozen',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'duration',
              atk_scale_trigger: 'atk_scale_trigger',
              originum_ult_break_scale: 'originum_ult_break_scale',
            },
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0003_endminf_combo_skill:/scheduledSequences/1/sequence/steps/2',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
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
        24,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.867000043 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        23,
      ),
      scheduled(
        0,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(),
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.15 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 30,
                curve: {
                  kind: 'inline',
                  keys: [
                    {
                      time: 0,
                      value: 0.05,
                      inTangent: 0.000489342,
                      outTangent: 0.000489342,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.6112276,
                      value: 0.03604198,
                      inTangent: 0.3674083,
                      outTangent: 0.3674083,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 1,
                      inTangent: 4.44,
                      outTangent: 4.44,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                  ],
                },
                finishByAction: false,
                targets: ['caster'],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        4,
      ),
    ],
    smartTarget: 'input',
    cooldownFrames: [480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 480, 450],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [0.45, 0.49, 0.54, 0.58, 0.62, 0.67, 0.71, 0.76, 0.8, 0.86, 0.93, 1],
    atk_scale_trigger: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    duration: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4.5, 4.5, 5],
    originum_ult_break_scale: [2.67, 2.94, 3.2, 3.47, 3.74, 4, 4.27, 4.54, 4.8, 5.14, 5.54, 6],
    poise: 10,
    usp: 10,
  },
);

export const endministratorCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const endministrator: OperatorDefinition = {
  slug: 'endministrator',
  gameId: 'ENDMINISTRATOR',
  rarity: 6,
  weaponType: 'sword',
  element: 'physical',
  role: 'guard',
  mainAttribute: 'agility',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [14, 38, 62, 86, 111, 123],
    agility: [14, 41, 69, 98, 126, 140],
    intellect: [9, 28, 47, 67, 87, 96],
    will: [10, 31, 53, 74, 96, 107],
    baseAttack: [30, 92, 157, 222, 287, 319],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        endministratorChr_0003_endminf_attack1,
        endministratorChr_0003_endminf_attack2,
        endministratorChr_0003_endminf_attack3,
        endministratorChr_0003_endminf_attack4,
        endministratorChr_0003_endminf_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: endministratorChr_0003_endminf_power_attack2,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: endministratorChr_0003_endminf_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: endministratorChr_0003_endminf_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: endministratorChr_0003_endminf_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: endministratorChr_0003_endminf_combo_skill,
    },
  ],
  dodgeSkill: endministratorCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0003_endminf_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0003_endminf_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0003_endminf_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0003_endminf_attack1',
        'chr_0003_endminf_attack2',
        'chr_0003_endminf_attack3',
        'chr_0003_endminf_attack4',
        'chr_0003_endminf_attack5',
        'chr_0003_endminf_plunging_attack_end',
        'chr_0003_endminf_power_attack2',
      ],
      normalAttackSkillKeys: [
        'chr_0003_endminf_attack1',
        'chr_0003_endminf_attack2',
        'chr_0003_endminf_attack3',
        'chr_0003_endminf_attack4',
        'chr_0003_endminf_attack5',
      ],
      defaultSkillKey: 'chr_0003_endminf_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0003_endminf_combo_skill',
      event: 'outputDamage',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['comboSkill'] },
          sequence(
            branch(
              {
                kind: 'not',
                condition: {
                  kind: 'contextTargetIdentityMatch',
                  contextKey: 'trigger',
                  other: 'actionSource',
                  operator: 'equal',
                },
              },
              sequence(
                branch(
                  { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['enemy'] },
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
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0003_endminf_talent_1',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { atk_up: [0.15, 0.3], duration: { kind: 'constant', value: 15 } },
        }),
      ),
    },
    {
      levels: 2,
      passiveSkills: [
        {
          key: 'chr_0003_endminf_talent_0',
          blackboard: { dmg: [0.1, 0.2] },
          enableSequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0003_endminf_talent_0_aura',
              target: 'caster',
              inheritSourceSkillCastInfo: false,
              blackboardAssignments: { dmg: { kind: 'blackboard', key: 'dmg' } },
            }),
          ),
        },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0003_endminf_potential1',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { atb_return: { kind: 'constant', value: 50 } },
        }),
      ),
    },
    {
      levels: 1,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0003_endminf_potential2',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { ratio: { kind: 'constant', value: 0.5 } },
        }),
      ),
    },
    {
      levels: 1,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0003_endminf_potential3',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { usp: { kind: 'constant', value: 15 } },
        }),
      ),
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'modifyBasePanelStat', stat: 'health', operation: 'percent', value: 0.1 },
      ],
    },
    {
      levels: 1,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0003_endminf_potential5',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { cd_minus: { kind: 'constant', value: 2 } },
        }),
      ),
    },
  ],
  buffDefinitions: {
    buff_chr_0003_endminf_potential1: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { atb_return: 50 },
      attributeModifiers: [],
    },
    buff_chr_0003_endminf_potential2: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { ratio: 0.5 },
      attributeModifiers: [],
    },
    buff_chr_0003_endminf_potential3: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { usp: 15 },
      attributeModifiers: [],
    },
    buff_chr_0003_endminf_potential5: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { cd_minus: 0 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'addedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0003_endminf_potential5_trigger'] },
              sequence(
                step('adjustSkillCooldown', {
                  target: 'caster',
                  skill: { kind: 'id', skillId: 'chr_0003_endminf_combo_skill' },
                  operation: 'reduce',
                  basis: 'absoluteSeconds',
                  value: { kind: 'blackboard', key: 'cd_minus' },
                }),
                step('adjustSkillCooldown', {
                  target: 'caster',
                  skill: { kind: 'id', skillId: 'chr_0002_endminm_combo_skill' },
                  operation: 'reduce',
                  basis: 'absoluteSeconds',
                  value: { kind: 'blackboard', key: 'cd_minus' },
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0003_endminf_potential5_trigger: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 0.1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0003_endminf_talent_0: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { dmg: 0 },
      attributeModifiers: [],
      damageModifiers: [
        {
          enabledSide: 'attacker',
          condition: {
            kind: 'all',
            conditions: [
              {
                kind: 'buffIdCountCompare',
                target: 'enemy',
                buffIds: ['buff_common_originum_frozen'],
                operator: 'greaterOrEqual',
                value: 1,
              },
              { kind: 'eventDamageTypesMatch', damageTypes: ['physical'] },
            ],
          },
          processors: [
            {
              kind: 'damageScale',
              side: 'defender',
              zone: 'normal',
              addition: { blackboardKey: 'dmg' },
            },
          ],
        },
      ],
    },
    buff_chr_0003_endminf_talent_0_aura: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { dmg: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0003_endminf_talent_0',
            target: 'party',
            finishByAction: true,
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { dmg: { kind: 'blackboard', key: 'dmg' } },
          }),
        ),
      },
    },
    buff_chr_0003_endminf_talent_1: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_up: 0.15, duration: 15 },
      attributeModifiers: [],
    },
    buff_chr_0003_endminf_talent_1_tirgger: {
      stackingType: 'stack',
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
        iconStyleInSquad: 'LifeTime',
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
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default endministrator;
