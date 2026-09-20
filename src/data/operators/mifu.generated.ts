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

export const mifuChr_0031_mifu_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0031_mifu_attack1',
    timelineBlockFrames: 17,
    naturalDurationFrames: 196,
    exclusiveFrame: 27,
    offsetRecordFrame: 11,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 38,
          input: 'basicAttack',
          targetSkillId: 'chr_0031_mifu_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 17, endFrame: 38, skillIds: ['chr_0031_mifu_attack2'] }],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        9,
        sequence(
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          step('modifyActionValue', {
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0031_mifu_attack1:/scheduledSequences/0/sequence/steps/2/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('modifyActionValue', {
                    key: 'hit_target',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  {
                    kind: 'switch',
                    parameters: {
                      choice: { kind: 'blackboard', key: 'hitstop_times' },
                      alwaysNext: true,
                    },
                    options: [
                      {
                        value: { kind: 'constant', value: 3 },
                        sequence: sequence(
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
                      },
                      {
                        value: { kind: 'constant', value: 4 },
                        sequence: sequence(
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
                      },
                      {
                        value: { kind: 'constant', value: 0 },
                        sequence: sequence(
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
                      },
                      {
                        value: { kind: 'constant', value: 1 },
                        sequence: sequence(
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
                      },
                      {
                        value: { kind: 'constant', value: 2 },
                        sequence: sequence(
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
                      },
                    ],
                  },
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
        9,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hitstop_times',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
        10,
      ),
      scheduled(
        10,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hitstop_times',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
        11,
      ),
      scheduled(
        11,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hitstop_times',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
        12,
      ),
      scheduled(
        17,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0031_mifu_attack2'] })),
        38,
      ),
    ],
    timelineContinuationSkillId: 'chr_0031_mifu_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.34, 0.37, 0.41, 0.44, 0.47, 0.51, 0.54, 0.57, 0.61, 0.65, 0.7, 0.76],
    hit_target: 0,
    hitstop_times: 0,
  },
);

export const mifuChr_0031_mifu_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0031_mifu_attack2',
    timelineBlockFrames: 21,
    naturalDurationFrames: 217,
    exclusiveFrame: 29,
    offsetRecordFrame: 9,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 67,
          input: 'basicAttack',
          targetSkillId: 'chr_0031_mifu_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 21, endFrame: 67, skillIds: ['chr_0031_mifu_attack3'] }],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        9,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale1' },
                  tags: ['normalAttack'],
                },
                'chr_0031_mifu_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.03 },
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
        10,
      ),
      scheduled(
        16,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale2' },
                  tags: ['normalAttack'],
                },
                'chr_0031_mifu_attack2:/scheduledSequences/1/sequence/steps/0/body/steps/0',
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
        19,
      ),
      scheduled(
        21,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0031_mifu_attack3'] })),
        67,
      ),
    ],
    timelineContinuationSkillId: 'chr_0031_mifu_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale1: [0.13, 0.15, 0.16, 0.17, 0.19, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.3],
    atk_scale2: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56],
    display_atk_scale: [0.38, 0.42, 0.46, 0.5, 0.54, 0.57, 0.61, 0.65, 0.69, 0.74, 0.79, 0.86],
  },
);

export const mifuChr_0031_mifu_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0031_mifu_attack3',
    timelineBlockFrames: 37,
    naturalDurationFrames: 425,
    exclusiveFrame: 54,
    offsetRecordFrame: 16,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 76,
          input: 'basicAttack',
          targetSkillId: 'chr_0031_mifu_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 37, endFrame: 76, skillIds: ['chr_0031_mifu_attack4'] }],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        10,
        sequence(
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          step('modifyActionValue', {
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale1' },
                  tags: ['normalAttack'],
                },
                'chr_0031_mifu_attack3:/scheduledSequences/0/sequence/steps/2/body/steps/0',
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
        13,
      ),
      scheduled(
        16,
        sequence(
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          step('modifyActionValue', {
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale1' },
                  tags: ['normalAttack'],
                },
                'chr_0031_mifu_attack3:/scheduledSequences/1/sequence/steps/2/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('modifyActionValue', {
                    key: 'hit_target',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  {
                    kind: 'switch',
                    parameters: {
                      choice: { kind: 'blackboard', key: 'hitstop_times' },
                      alwaysNext: true,
                    },
                    options: [
                      {
                        value: { kind: 'constant', value: 3 },
                        sequence: sequence(
                          step('startTimeDilation', {
                            scope: 'entity',
                            durationSeconds: { kind: 'constant', value: 0.03 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: { kind: 'named', key: 'char_hard_stop' },
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
                            durationSeconds: { kind: 'constant', value: 0.03 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: { kind: 'named', key: 'char_hard_stop' },
                            finishByAction: false,
                            targets: ['enemy', 'caster'],
                          }),
                        ),
                      },
                      {
                        value: { kind: 'constant', value: 0 },
                        sequence: sequence(
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
                      },
                      {
                        value: { kind: 'constant', value: 1 },
                        sequence: sequence(
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
                      },
                      {
                        value: { kind: 'constant', value: 2 },
                        sequence: sequence(
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
                      },
                    ],
                  },
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
        30,
        sequence(
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          step('modifyActionValue', {
            key: 'hitstop_times',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale2' },
                  tags: ['normalAttack'],
                },
                'chr_0031_mifu_attack3:/scheduledSequences/2/sequence/steps/2/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('modifyActionValue', {
                    key: 'hit_target',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  {
                    kind: 'switch',
                    parameters: {
                      choice: { kind: 'blackboard', key: 'hitstop_times' },
                      alwaysNext: true,
                    },
                    options: [
                      {
                        value: { kind: 'constant', value: 0 },
                        sequence: sequence(
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
                      },
                      {
                        value: { kind: 'constant', value: 1 },
                        sequence: sequence(
                          step('startTimeDilation', {
                            scope: 'entity',
                            durationSeconds: { kind: 'constant', value: 0.15 },
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
                            durationSeconds: { kind: 'constant', value: 0.15 },
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
                            durationSeconds: { kind: 'constant', value: 0.03 },
                            slot: 'TimeDilation/Layer/Entity/HitStop',
                            priority: 10,
                            curve: { kind: 'named', key: 'char_hard_stop' },
                            finishByAction: false,
                            targets: ['enemy', 'caster'],
                          }),
                        ),
                      },
                    ],
                  },
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
        33,
      ),
      scheduled(
        10,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hitstop_times',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
        11,
      ),
      scheduled(
        11,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hitstop_times',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
        12,
      ),
      scheduled(
        12,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hitstop_times',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
        13,
      ),
      scheduled(
        16,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hitstop_times',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
        17,
      ),
      scheduled(
        17,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hitstop_times',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
        18,
      ),
      scheduled(
        18,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hitstop_times',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
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
              left: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hitstop_times',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
        20,
      ),
      scheduled(
        30,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hitstop_times',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
        31,
      ),
      scheduled(
        31,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hitstop_times',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
        32,
      ),
      scheduled(
        32,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'hit_target', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hitstop_times',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('modifyActionValue', {
            key: 'hit_target',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
        ),
        33,
      ),
      scheduled(
        37,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0031_mifu_attack4'] })),
        76,
      ),
    ],
    timelineContinuationSkillId: 'chr_0031_mifu_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale1: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    atk_scale2: [0.31, 0.34, 0.37, 0.4, 0.43, 0.46, 0.49, 0.52, 0.55, 0.59, 0.63, 0.69],
    hit_target: 0,
    hitstop_times: 0,
    display_atk_scale: [0.61, 0.67, 0.73, 0.79, 0.85, 0.91, 0.97, 1.03, 1.09, 1.16, 1.26, 1.36],
  },
);

export const mifuChr_0031_mifu_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0031_mifu_attack4',
    timelineBlockFrames: 38,
    naturalDurationFrames: 280,
    exclusiveFrame: 54,
    offsetRecordFrame: 30,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 99,
          input: 'basicAttack',
          targetSkillId: 'chr_0031_mifu_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 38, endFrame: 99, skillIds: ['chr_0031_mifu_attack1'] }],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        7,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale1' },
                  tags: ['normalAttack'],
                },
                'chr_0031_mifu_attack4:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.03 },
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
        7,
      ),
      scheduled(
        30,
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
            'chr_0031_mifu_attack4:/scheduledSequences/1/sequence/steps/0',
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
        30,
      ),
      scheduled(
        38,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0031_mifu_attack1'] })),
        99,
      ),
    ],
    timelineContinuationSkillId: 'chr_0031_mifu_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 28,
    atk_scale1: [0.05, 0.06, 0.06, 0.07, 0.07, 0.08, 0.08, 0.09, 0.09, 0.1, 0.1, 0.11],
    atk_scale2: [0.72, 0.79, 0.86, 0.93, 1, 1.07, 1.14, 1.22, 1.29, 1.38, 1.48, 1.61],
    poise: 25,
    display_atk_scale: [0.77, 0.84, 0.92, 0.99, 1.07, 1.15, 1.22, 1.3, 1.38, 1.47, 1.59, 1.72],
  },
);

export const mifuChr_0031_mifu_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0031_mifu_plunging_attack_end',
    timelineBlockFrames: 21,
    naturalDurationFrames: 206,
    exclusiveFrame: 20,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [{ startFrame: 12, endFrame: 21, skillIds: ['chr_0009_azrila_attack1'] }],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        2,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'plungingAttack'],
            },
            'chr_0031_mifu_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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
        7,
      ),
    ],
    skillType: 'plungingAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
);

export const mifuChr_0031_mifu_powerattack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0031_mifu_powerattack',
    timelineBlockFrames: 38,
    naturalDurationFrames: 282,
    exclusiveFrame: 53,
    offsetRecordFrame: 26,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 38,
          endFrame: 67,
          skillIds: [
            'chr_0031_mifu_combo_skill',
            'chr_0031_mifu_normalskill_1',
            'chr_0031_mifu_normalskill_2',
            'chr_0031_mifu_normalskill_3',
          ],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        5,
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
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7471619,
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
            targets: ['enemy', 'caster'],
          }),
        ),
        5,
      ),
      scheduled(
        6,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.3,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0031_mifu_powerattack:/scheduledSequences/1/sequence/steps/0',
          ),
        ),
        6,
      ),
      scheduled(
        17,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.2,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0031_mifu_powerattack:/scheduledSequences/2/sequence/steps/0',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.03 },
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
                  time: 0.8024494,
                  value: 0,
                  inTangent: 0,
                  outTangent: 2.530997,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 5.061995,
                  outTangent: 5.061995,
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
        17,
      ),
      scheduled(
        37,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.5,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0031_mifu_powerattack:/scheduledSequences/3/sequence/steps/0',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.23 },
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
                  time: 0.7007455,
                  value: 0,
                  inTangent: 0,
                  outTangent: 1.670819,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 3.341638,
                  outTangent: 3.341638,
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
        53,
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
        38,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0031_mifu_buffpause',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        38,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9], atk_scale2: 0.58 },
);

export const mifuChr_0031_mifu_normalskill_1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0031_mifu_normalskill_1',
    timelineBlockFrames: 11,
    naturalDurationFrames: 203,
    exclusiveFrame: 125,
    offsetRecordFrame: 0,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 131,
          input: 'basicAttack',
          targetSkillId: 'chr_0031_mifu_attack2',
        },
      ],
      allowedNextSkills: [
        { startFrame: 11, endFrame: 30, skillIds: ['chr_0031_mifu_normalskill_2'] },
        { startFrame: 115, endFrame: 131, skillIds: ['chr_0031_mifu_normalskill_2'] },
        { startFrame: 11, endFrame: 30, skillIds: ['chr_0031_mifu_attack2'] },
        { startFrame: 115, endFrame: 131, skillIds: ['chr_0031_mifu_attack2'] },
        { startFrame: 11, endFrame: 30, skillIds: ['chr_0031_mifu_powerattack'] },
        { startFrame: 115, endFrame: 131, skillIds: ['chr_0031_mifu_powerattack'] },
        { startFrame: 11, endFrame: 30, skillIds: ['chr_0031_mifu_combo_skill'] },
        { startFrame: 115, endFrame: 131, skillIds: ['chr_0031_mifu_combo_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        11,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0031_mifu_comboprocess',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0031_mifu_normalskill_2', 'chr_0031_mifu_normalskill_3'],
          }),
        ),
        38,
      ),
      scheduled(
        105,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0031_mifu_comboprocess',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0031_mifu_normalskill_2', 'chr_0031_mifu_normalskill_3'],
          }),
        ),
        156,
      ),
      scheduled(
        0,
        sequence(
          step('findCharacterTeamTargets', {
            saveToContextKey: 'MainChar',
            selection: { kind: 'controlledOperator' },
          }),
        ),
        0,
      ),
      scheduled(
        0,
        sequence(
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'constant', value: 50 },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'skill',
          }),
        ),
        0,
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
            'chr_0031_mifu_normalskill_1:/scheduledSequences/4/sequence/steps/0/whenTrue/steps/0/whenTrue/steps/0',
          ),
          step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
          branch(
            {
              kind: 'enemySuperArmorCompare',
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 30 },
            },
            sequence(step('jumpTimeline', { destinationFrame: 105 })),
            sequence(forEachTarget('enemy', sequence())),
            { alwaysNext: true },
          ),
        ),
        12,
      ),
      scheduled(
        0,
        sequence(
          step('modifyActionValue', {
            key: 'effect_z_scale',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          step('modifyActionValue', {
            key: 'effect_z_scale',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
          step('modifyActionValue', {
            key: 'effect_z_scale',
            operation: 'divide',
            value: { kind: 'constant', value: 8 },
          }),
        ),
        0,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0031_mifu_normalskill_2',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        0,
      ),
      scheduled(104, sequence(step('jumpTimeline', { destinationFrame: 204 })), 104),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atk_scale: [0.67, 0.73, 0.8, 0.87, 0.93, 1, 1.07, 1.13, 1.2, 1.28, 1.38, 1.5],
    effect_z_scale: 1,
  },
);

export const mifuChr_0031_mifu_normalskill_2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0031_mifu_normalskill_2',
    timelineBlockFrames: 28,
    naturalDurationFrames: 150,
    exclusiveFrame: 34,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 28, endFrame: 62, skillIds: ['chr_0031_mifu_normalskill_3'] },
        { startFrame: 28, endFrame: 62, skillIds: ['chr_0031_mifu_powerattack'] },
        { startFrame: 28, endFrame: 62, skillIds: ['chr_0031_mifu_combo_skill'] },
        {
          startFrame: 28,
          endFrame: 62,
          skillIds: [
            'chr_0031_mifu_attack1',
            'chr_0031_mifu_attack2',
            'chr_0031_mifu_attack3',
            'chr_0031_mifu_attack4',
          ],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        24,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0031_mifu_normalskill_2'],
            reason: 'other',
          }),
        ),
        24,
      ),
      scheduled(
        28,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0031_mifu_comboprocess',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0031_mifu_normalskill_3'],
          }),
        ),
        129,
      ),
      scheduled(
        0,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(),
            sequence(
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0031_mifu_comboprocess'],
                reason: 'other',
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        0,
      ),
      scheduled(
        3,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0031_mifu_normalskill_2:/scheduledSequences/3/sequence/steps/0/whenTrue/steps/0',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.03 },
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
                  time: 0.1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7465571,
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
                  inTangent: 3.945662,
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
        ),
        3,
      ),
      scheduled(
        10,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0031_mifu_normalskill_2:/scheduledSequences/4/sequence/steps/0/whenTrue/steps/0',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.03 },
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
                  time: 0.1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7465571,
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
                  inTangent: 3.945662,
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
        ),
        10,
      ),
      scheduled(
        24,
        sequence(
          forEachTarget(
            'enemy',
            sequence(
              step('readBuffStackCount', {
                target: 'enemy',
                outputKey: 'stack',
                query: {
                  kind: 'tag',
                  tagQueryType: 'hasAny',
                  buffTags: ['Skill/Character/Common/NoGuard'],
                },
              }),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'stack', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'blackboard', key: 'maxstack', fallback: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'maxstack',
                    operation: 'assign',
                    value: { kind: 'blackboard', key: 'stack' },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
            ),
          ),
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
                orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
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
                          left: { kind: 'blackboard', key: 'ignore_hit_effect', fallback: 0 },
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
            ignoreHitEffect: true,
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
            'chr_0031_mifu_normalskill_2:/scheduledSequences/5/sequence/steps/0/whenTrue/steps/2',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.12 },
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
                  time: 0.1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7465571,
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
                  inTangent: 3.945662,
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
          step('applyBuff', {
            buffId: 'buff_common_obtain_ultimate_sp',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        24,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 99999 },
            slot: 'TimeDilation/Layer/Entity/VisualAdjust',
            priority: 50,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1.25,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 1.25,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: true,
            targets: ['caster'],
          }),
        ),
        15,
      ),
      scheduled(
        22,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0031_mifu_listen_crush',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        27,
      ),
    ],
    smartTarget: 'enemy',
    costs: [{ resource: 'sp', value: 50 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atk_scale: [0.27, 0.3, 0.32, 0.35, 0.38, 0.41, 0.43, 0.46, 0.49, 0.52, 0.56, 0.61],
    atk_scale2: [0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.68, 0.73, 0.79],
    maxstack: 0,
    poise: 5,
    potential: 0,
    stack: 4,
  },
);

export const mifuChr_0031_mifu_normalskill_3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0031_mifu_normalskill_3',
    timelineBlockFrames: 46,
    naturalDurationFrames: 241,
    exclusiveFrame: 45,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(),
            sequence(
              step('finishBuffsById', {
                target: 'caster',
                buffIds: ['buff_chr_0031_mifu_comboprocess'],
                reason: 'other',
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        0,
      ),
      scheduled(
        21,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0031_mifu_normalskill_3'],
            reason: 'other',
          }),
        ),
        21,
      ),
      scheduled(
        23,
        sequence(
          step('dealStagger', {
            value: { kind: 'blackboard', key: 'poise' },
            features: ['canBreakWeakness'],
          }),
          branch(
            {
              kind: 'enemySuperArmorCompare',
              operator: 'greater',
              value: { kind: 'constant', value: 10 },
            },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.2 },
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
                targets: ['enemy', 'caster'],
              }),
            ),
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.16 },
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
                targets: ['enemy', 'caster'],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        23,
      ),
      scheduled(
        25,
        sequence(
          branch(
            {
              kind: 'enemySuperArmorCompare',
              operator: 'greater',
              value: { kind: 'constant', value: 10 },
            },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.08888 },
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
                      time: 0.7513477,
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
                targets: ['enemy', 'caster'],
              }),
            ),
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.06666 },
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
                      time: 0.7513477,
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
                targets: ['enemy', 'caster'],
              }),
            ),
            { alwaysNext: true },
          ),
          step('dealStagger', { value: { kind: 'blackboard', key: 'poise' } }),
        ),
        25,
      ),
      scheduled(
        26,
        sequence(
          forEachTarget(
            'enemy',
            sequence(
              step('modifyActionValue', {
                key: 'atk_scale_runtime',
                operation: 'assign',
                value: { kind: 'blackboard', key: 'atk_scale' },
              }),
              step('readSkillSettingData', {
                items: [
                  {
                    values: [1, 1, 1, 1],
                    column: { kind: 'constant', value: 1 },
                    storeKey: 'yuanshi_multi',
                    enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
                  },
                ],
              }),
              step('modifyActionValue', {
                key: 'atk_scale_runtime',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'yuanshi_multi' },
              }),
              branch(
                {
                  kind: 'all',
                  conditions: [
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'talent', fallback: 0 },
                      operator: 'greater',
                      right: { kind: 'constant', value: 0 },
                    },
                    {
                      kind: 'any',
                      conditions: [
                        {
                          kind: 'poiseCompare',
                          target: 'enemy',
                          returnValueIfMissing: false,
                          operator: 'equal',
                          value: { kind: 'constant', value: 0 },
                        },
                        {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/Affixes/Vulnerable/VulnerablePhysic'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                      ],
                    },
                  ],
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'crushmulti',
                    operation: 'assign',
                    value: { kind: 'constant', value: 1 },
                  }),
                  step('modifyActionValue', {
                    key: 'crushmultiadd_talent_runtime',
                    operation: 'assign',
                    value: { kind: 'blackboard', key: 'crushmultiadd_talent' },
                  }),
                  step('modifyActionValue', {
                    key: 'crushmulti',
                    operation: 'add',
                    value: { kind: 'blackboard', key: 'crushmultiadd_talent_runtime' },
                  }),
                  step('modifyActionValue', {
                    key: 'atk_scale_runtime',
                    operation: 'multiply',
                    value: { kind: 'blackboard', key: 'crushmulti' },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_runtime' },
                  tags: [],
                  features: ['canBreakWeakness', 'physicalInfliction'],
                },
                'chr_0031_mifu_normalskill_3:/scheduledSequences/4/sequence/steps/0/body/steps/4',
              ),
            ),
          ),
          step('applyBuff', {
            buffId: 'buff_common_obtain_ultimate_sp',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        26,
      ),
      scheduled(
        21,
        sequence(
          branch(
            { kind: 'constant', value: true },
            sequence(
              step('modifyActionValue', {
                key: 'Ifmoveto',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        23,
      ),
    ],
    smartTarget: 'enemy',
    costs: [{ resource: 'sp', value: 50 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atk_scale: [4, 4.16, 4.32, 4.48, 4.64, 4.8, 4.96, 5.12, 5.28, 5.48, 5.72, 6],
    atk_scale_runtime: 0,
    crushmulti: 1,
    crushmultiadd_talent: 0,
    crushmultiadd_talent_runtime: 0,
    Ifmoveto: 0,
    poise: 5,
    potential: 0,
    talent: 0,
    yuanshi_multi: 1,
  },
);

export const mifuChr_0031_mifu_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0031_mifu_ultimate_skill',
    timelineBlockFrames: 113,
    naturalDurationFrames: 249,
    exclusiveFrame: 118,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 113, endFrame: 124, skillIds: ['chr_0031_mifu_powerattack'] },
        { startFrame: 113, endFrame: 124, skillIds: ['chr_0031_mifu_normalskill_2'] },
        { startFrame: 113, endFrame: 124, skillIds: ['chr_0031_mifu_normalskill_3'] },
        { startFrame: 113, endFrame: 124, skillIds: ['chr_0031_mifu_combo_skill'] },
        {
          startFrame: 113,
          endFrame: 124,
          skillIds: [
            'chr_0031_mifu_attack1',
            'chr_0031_mifu_attack2',
            'chr_0031_mifu_attack3',
            'chr_0031_mifu_attack4',
          ],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0031_mifu_buffpause',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
          }),
        ),
        105,
      ),
      scheduled(
        102,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0031_mifu_normalskill_2',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        102,
      ),
      scheduled(
        75,
        sequence(
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
                afterEnhance: sharedActionSequence1,
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
                orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
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
            duration: { kind: 'constant', value: 0.8 },
            height: { kind: 'constant', value: 1.2 },
            speedFactorMultiplier: 1,
            force: true,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0031_mifu_ultimate_skill:/scheduledSequences/2/sequence/steps/0/whenTrue/steps/1',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.12 },
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
                  time: 0.1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.596829,
                  value: 0,
                  inTangent: 0,
                  outTangent: 2.480337,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: -0.5423906,
                  outTangent: -0.5423906,
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
        75,
      ),
      scheduled(
        98,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'constant', value: 0 },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0031_mifu_ultimate_skill:/scheduledSequences/3/sequence/steps/0/whenTrue/steps/0',
          ),
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
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7465571,
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
            targets: ['enemy', 'caster'],
          }),
        ),
        98,
      ),
      scheduled(
        102,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale2' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise2' },
            },
            'chr_0031_mifu_ultimate_skill:/scheduledSequences/4/sequence/steps/0',
          ),
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
                  inTangent: 0,
                  outTangent: -3.065404,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.3262213,
                  value: 0,
                  inTangent: -0.1830944,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7465571,
                  value: 0,
                  inTangent: 0,
                  outTangent: -0.5801874,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 3.945662,
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
        ),
        102,
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
        118,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 71),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        71,
      ),
    ],
    cooldownFrames: 450,
    costs: [{ resource: 'ultimateEnergy', value: 80 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale: [0.9, 0.99, 1.08, 1.17, 1.26, 1.35, 1.44, 1.53, 1.62, 1.73, 1.87, 2.03],
    atk_scale2: [2.21, 2.43, 2.65, 2.87, 3.09, 3.31, 3.54, 3.76, 3.98, 4.25, 4.58, 4.97],
    poise2: 20,
  },
);

export const mifuChr_0031_mifu_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0031_mifu_combo_skill',
    timelineBlockFrames: 35,
    naturalDurationFrames: 211,
    exclusiveFrame: 41,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 35, endFrame: 73, skillIds: ['chr_0031_mifu_powerattack'] },
        {
          startFrame: 35,
          endFrame: 73,
          skillIds: ['chr_0031_mifu_normalskill_2', 'chr_0031_mifu_normalskill_3'],
        },
        {
          startFrame: 35,
          endFrame: 73,
          skillIds: [
            'chr_0031_mifu_attack1',
            'chr_0031_mifu_attack2',
            'chr_0031_mifu_attack3',
            'chr_0031_mifu_attack4',
          ],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        27,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0031_mifu_normalskill_2',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        28,
      ),
      scheduled(
        35,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0031_mifu_comboprocess',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            finishByAction: true,
            inheritToNextSkillIds: ['chr_0031_mifu_normalskill_2', 'chr_0031_mifu_normalskill_3'],
          }),
        ),
        73,
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
                  left: { kind: 'blackboard', key: 'talent', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                {
                  kind: 'not',
                  condition: {
                    kind: 'globalCooldownPresent',
                    target: 'caster',
                    markerId: 'buff_chr_0031_mifu_shield',
                  },
                },
              ],
            },
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'potential', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0031_mifu_potential_addattack',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: {
                      addattack_effect: 'potential_addattack_effect',
                      addattack_duraion: 'potential_addattack_duration',
                    },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              step('storeSourceAttributeValue', {
                attribute: { kind: 'specific', key: 'maxHealth' },
                stage: 'finalNonConverted',
                useFloor: false,
                divisor: { kind: 'constant', value: 1 },
                multiplier: { kind: 'constant', value: 1 },
                base: { kind: 'constant', value: 0 },
                targetKey: 'talent_shield_maxhp',
              }),
              step('modifyActionValue', {
                key: 'talent_shield_maxhp',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'talent_shield_hppercent' },
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0031_mifu_shield',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: {
                  duration: 'talent_shield_duration',
                  FinalShield: 'talent_shield_maxhp',
                },
              }),
              step('setGlobalCooldown', {
                target: 'caster',
                markerId: 'buff_chr_0031_mifu_shield',
                durationSeconds: { kind: 'blackboard', key: 'talent_shield_cd' },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        1,
      ),
      scheduled(
        2,
        sequence(
          step('modifyActionValue', {
            key: 'Ifmoveto',
            operation: 'assign',
            value: { kind: 'constant', value: 1 },
          }),
        ),
        8,
      ),
      scheduled(
        8,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale1' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0031_mifu_combo_skill:/scheduledSequences/4/sequence/steps/0',
          ),
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
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.7500001,
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
            targets: ['enemy', 'caster'],
          }),
        ),
        9,
      ),
      scheduled(
        10,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale1' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0031_mifu_combo_skill:/scheduledSequences/5/sequence/steps/0',
          ),
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
            targets: ['enemy', 'caster'],
          }),
        ),
        11,
      ),
      scheduled(
        27,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.06 },
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
                  time: 0.7,
                  value: 0,
                  inTangent: 0,
                  outTangent: 2.481606,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 3.333333,
                  outTangent: 3.333333,
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
        28,
      ),
      scheduled(
        31,
        sequence(
          step('modifyActionValue', {
            key: 'final_effect',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'rate' },
          }),
          step('modifyActionValue', {
            key: 'final_time',
            operation: 'assign',
            value: { kind: 'blackboard', key: 'duration' },
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'final_effect',
                operation: 'add',
                value: { kind: 'blackboard', key: 'extra_effect' },
              }),
              step('modifyActionValue', {
                key: 'final_time',
                operation: 'add',
                value: { kind: 'blackboard', key: 'extra_time' },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('applyBuff', {
            buffId: 'buff_chr_0031_mifu_vulnerablephysic_comboskill',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { duration: 'final_time', rate: 'final_effect' },
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale2' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0031_mifu_combo_skill:/scheduledSequences/7/sequence/steps/4',
          ),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: '__endaxis_native_skill_has_hit' },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'blackboard', key: 'usp' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'caster',
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        32,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.36666 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        8,
      ),
    ],
    smartTarget: 'trigger',
    cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 570],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale1: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
    atk_scale2: [0.51, 0.56, 0.61, 0.66, 0.71, 0.77, 0.82, 0.87, 0.92, 0.98, 1.06, 1.15],
    duration: 16,
    extra_effect: 0,
    extra_time: 0,
    final_effect: 0,
    final_time: 0,
    Ifmoveto: 0,
    poise: 10,
    potential: 0,
    potential_addattack_duration: 0,
    potential_addattack_effect: 0,
    rate: 0.05,
    talent: 0,
    talent_shield_cd: 0,
    talent_shield_duration: 0,
    talent_shield_hppercent: 0,
    talent_shield_maxhp: 0,
    usp: 10,
    __endaxis_native_skill_has_hit: 0,
  },
);

export const mifuCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const mifu: OperatorDefinition = {
  slug: 'mifu',
  gameId: 'MIFU',
  rarity: 6,
  weaponType: 'greatsword',
  element: 'physical',
  role: 'guard',
  mainAttribute: 'strength',
  secondaryAttribute: 'will',
  attributes: {
    strength: [22, 54, 88, 122, 156, 173],
    agility: [10, 27, 46, 65, 83, 92],
    intellect: [9, 27, 45, 63, 81, 90],
    will: [14, 37, 60, 84, 107, 119],
    baseAttack: [30, 91, 155, 219, 283, 315],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        mifuChr_0031_mifu_attack1,
        mifuChr_0031_mifu_attack2,
        mifuChr_0031_mifu_attack3,
        mifuChr_0031_mifu_attack4,
      ],
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: mifuChr_0031_mifu_plunging_attack_end,
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: mifuChr_0031_mifu_powerattack,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: mifuChr_0031_mifu_normalskill_1,
      placementSequenceSkillKeys: [
        'chr_0031_mifu_normalskill_1',
        'chr_0031_mifu_normalskill_2',
        'chr_0031_mifu_normalskill_3',
      ],
      replacementSkills: [mifuChr_0031_mifu_normalskill_2, mifuChr_0031_mifu_normalskill_3],
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: mifuChr_0031_mifu_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: mifuChr_0031_mifu_combo_skill,
    },
  ],
  dodgeSkill: mifuCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0031_mifu_normalskill_1',
      replacementSkillKeys: ['chr_0031_mifu_normalskill_2', 'chr_0031_mifu_normalskill_3'],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0031_mifu_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0031_mifu_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0031_mifu_attack1',
        'chr_0031_mifu_attack2',
        'chr_0031_mifu_attack3',
        'chr_0031_mifu_attack4',
        'chr_0031_mifu_plunging_attack_end',
        'chr_0031_mifu_powerattack',
      ],
      normalAttackSkillKeys: [
        'chr_0031_mifu_attack1',
        'chr_0031_mifu_attack2',
        'chr_0031_mifu_attack3',
        'chr_0031_mifu_attack4',
      ],
      defaultSkillKey: 'chr_0031_mifu_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0031_mifu_combo_skill',
      event: 'addedBuff',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'eventBuffTagsMatch',
            match: 'hasAny',
            buffTags: ['Skill/Character/Common/NoGuard'],
          },
          sequence(
            branch(
              {
                kind: 'contextTargetObjectTypeMatch',
                contextKey: 'trigger',
                objectTypes: ['enemy'],
              },
              sequence(
                branch(
                  {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'trigger',
                    buffIds: ['buff_physical_no_guard'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 3 },
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
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0031_mifu_normalskill_3',
          blackboardKey: 'talent',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0031_mifu_normalskill_3',
          blackboardKey: 'crushmultiadd_talent',
          operation: 'assign',
          value: [0.1, 0.2],
        },
      ],
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent_shield_hppercent',
          operation: 'assign',
          value: [0.15, 0.3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent_shield_duration',
          operation: 'assign',
          value: [10, 10],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent_shield_cd',
          operation: 'assign',
          value: [60, 60],
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
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'extra_effect',
          operation: 'assign',
          value: 0.05,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'extra_time',
          operation: 'assign',
          value: 4,
        },
        { kind: 'addSkillCooldownFrames', skillGroupKey: 'comboSkill', frames: -60 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 20 },
        { kind: 'modifyBasePanelStat', stat: 'artsIntensity', operation: 'flat', value: 16 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent_shield_cd',
          operation: 'add',
          value: -15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent_shield_duration',
          operation: 'add',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential_addattack_effect',
          operation: 'assign',
          value: 0.06,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential_addattack_duration',
          operation: 'assign',
          value: 20,
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
          blackboardKey: 'poise2',
          operation: 'add',
          value: 5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0031_mifu_normalskill_1',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0031_mifu_normalskill_2',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0031_mifu_normalskill_2',
          blackboardKey: 'atk_scale2',
          operation: 'multiply',
          value: 1.1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0031_mifu_normalskill_3',
          blackboardKey: 'atk_scale',
          operation: 'multiply',
          value: 1.1,
        },
      ],
    },
  ],
  entityBlackboard: { EntityBB_normalskill_1_moveto: 0 },
  buffDefinitions: {
    buff_chr_0031_mifu_buffpause: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_def_down',
        iconPath: '/icons/icon_battle_buff_def_down.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { def: 0, dur: 0, prob: 0 },
      attributeModifiers: [],
    },
    buff_chr_0031_mifu_comboprocess: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0031_mifu_listen_crush: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      triggerIntervalSeconds: 0,
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'beforeOutputPhysicalInfliction',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventPhysicalInflictionTypeIn', types: ['crush'] },
              sequence(
                branch(
                  { kind: 'originSkillTypeIn', skillTypes: ['battleSkill'] },
                  sequence(
                    branch(
                      {
                        kind: 'not',
                        condition: {
                          kind: 'globalCooldownPresent',
                          target: 'buffOwner',
                          markerId: 'buff_chr_0031_mifu_listen_crush',
                        },
                      },
                      sequence(
                        branch(
                          {
                            kind: 'buffStackCompare',
                            target: 'actionInputTarget',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/NoGuard'],
                            operator: 'greaterOrEqual',
                            value: { kind: 'constant', value: 3 },
                          },
                          sequence(
                            step('applyBuff', {
                              buffId: 'buff_chr_0031_mifu_normalskill_3',
                              target: 'buffOwner',
                              source: 'buffOwner',
                              inheritSourceSkillCastInfo: true,
                            }),
                            step('setGlobalCooldown', {
                              target: 'buffOwner',
                              markerId: 'buff_chr_0031_mifu_listen_crush',
                              durationSeconds: { kind: 'constant', value: 0.1 },
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
    buff_chr_0031_mifu_normalskill_2: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 15,
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_def_up',
        iconPath: '/icons/icon_battle_buff_def_up.webp',
        showInHeadBarCommon: false,
        showInHeadBarAttached: false,
        showInSquadIcon: false,
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
      applyTags: ['Skill/Character/chr_0031_mifu/normalskill_2'],
      extendTags: [],
      blackboard: { def: 0, dur: 0, prob: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0031_mifu_normalskill_3'],
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
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0031_mifu_buffpause'] },
              sequence(step('setCurrentBuffTimePaused', { paused: true })),
            ),
          ),
        },
        {
          event: 'finishedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0031_mifu_buffpause'] },
              sequence(step('setCurrentBuffTimePaused', { paused: false })),
            ),
          ),
        },
      ],
      skillSlotReplacements: [
        {
          skillGroupKey: 'battleSkill',
          targetSkillKey: 'chr_0031_mifu_normalskill_2',
          revertedSkillKey: 'chr_0031_mifu_normalskill_1',
          inheritOriginSkillCooldownProgress: false,
        },
      ],
    },
    buff_chr_0031_mifu_normalskill_3: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 15,
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_def_up',
        iconPath: '/icons/icon_battle_buff_def_up.webp',
        showInHeadBarCommon: false,
        showInHeadBarAttached: false,
        showInSquadIcon: false,
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
      applyTags: ['Skill/Character/chr_0031_mifu/normalskill_3'],
      extendTags: [],
      blackboard: { def: 0, dur: 0, prob: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0031_mifu_normalskill_2'],
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
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0031_mifu_buffpause'] },
              sequence(step('setCurrentBuffTimePaused', { paused: true })),
            ),
          ),
        },
        {
          event: 'finishedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0031_mifu_buffpause'] },
              sequence(step('setCurrentBuffTimePaused', { paused: false })),
            ),
          ),
        },
      ],
      skillSlotReplacements: [
        {
          skillGroupKey: 'battleSkill',
          targetSkillKey: 'chr_0031_mifu_normalskill_3',
          revertedSkillKey: 'chr_0031_mifu_normalskill_1',
          inheritOriginSkillCooldownProgress: false,
        },
      ],
    },
    buff_chr_0031_mifu_potential_addattack: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'addattack_duraion' },
      triggerIntervalSeconds: 0,
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
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
      blackboard: { addattack_duraion: 0, addattack_effect: 0 },
      attributeModifiers: [
        { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'addattack_effect' } },
      ],
    },
    buff_chr_0031_mifu_shield: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
      },
      applyTags: ['Skill/Character/Common/HpShield'],
      extendTags: [],
      blackboard: { duration: 8, extraattack: 0, FinalShield: 1000, potential_5: 0, shelter: 0 },
      attributeModifiers: [],
      shields: [
        {
          infinityValue: false,
          value: { blackboardKey: 'FinalShield' },
          damageAbsorptions: [],
          absorbCount: -1,
          absorbAllDamageWhenConsumed: false,
          removeBuffWhenConsumed: true,
          priority: 'normal',
          replaceHitEffect: true,
        },
      ],
    },
    buff_chr_0031_mifu_vulnerablephysic_comboskill: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_def_down',
        iconPath: '/icons/icon_battle_buff_def_down.webp',
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 15, rate: 0.25 },
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
          }),
        ),
      },
    },
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default mifu;
