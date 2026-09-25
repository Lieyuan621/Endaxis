/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type { OperatorDefinition, SkillDefinition } from '../../core/game-data/operatorDefinition';
import {
  branch,
  forEachContextTarget,
  forEachTarget,
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withActionBlackboardScope,
  withSkillBlackboard,
} from './definitionHelpers';

export const laevatainChr_0016_laevat_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_attack1',
    timelineBlockFrames: 10,
    naturalDurationFrames: 120,
    exclusiveFrame: 16,
    offsetRecordFrame: 6,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 33,
          input: 'basicAttack',
          targetSkillId: 'chr_0016_laevat_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 10, endFrame: 33, skillIds: ['chr_0016_laevat_attack2'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        6,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0016_laevat_attack1:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.033 },
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
        7,
      ),
      scheduled(
        10,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0016_laevat_attack2'] })),
        33,
      ),
    ],
    timelineContinuationSkillId: 'chr_0016_laevat_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.16, 0.18, 0.19, 0.21, 0.22, 0.24, 0.26, 0.27, 0.29, 0.31, 0.33, 0.36] },
);

export const laevatainChr_0016_laevat_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_attack2',
    timelineBlockFrames: 16,
    naturalDurationFrames: 140,
    exclusiveFrame: 25,
    offsetRecordFrame: 13,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 37,
          input: 'basicAttack',
          targetSkillId: 'chr_0016_laevat_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 16, endFrame: 38, skillIds: ['chr_0016_laevat_attack3'] }],
    },
    costFrame: 8,
    scheduledSequences: [
      scheduled(
        6,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0016_laevat_attack2:/scheduledSequences/0/sequence/steps/0',
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
          ),
        ),
        9,
      ),
      scheduled(
        13,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0016_laevat_attack2:/scheduledSequences/1/sequence/steps/0',
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
        ),
        16,
      ),
      scheduled(
        16,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0016_laevat_attack3'] })),
        38,
      ),
    ],
    timelineContinuationSkillId: 'chr_0016_laevat_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.12, 0.13, 0.14, 0.16, 0.17, 0.18, 0.19, 0.2, 0.22, 0.23, 0.25, 0.27],
    display_atk_scale: [0.24, 0.26, 0.29, 0.31, 0.34, 0.36, 0.38, 0.41, 0.43, 0.46, 0.5, 0.54],
  },
);

export const laevatainChr_0016_laevat_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_attack3',
    timelineBlockFrames: 12,
    naturalDurationFrames: 105,
    exclusiveFrame: 22,
    offsetRecordFrame: 9,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 32,
          input: 'basicAttack',
          targetSkillId: 'chr_0016_laevat_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 12, endFrame: 32, skillIds: ['chr_0016_laevat_attack4'] }],
    },
    costFrame: 12,
    scheduledSequences: [
      scheduled(
        9,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0016_laevat_attack3:/scheduledSequences/0/sequence/steps/0',
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
                durationSeconds: { kind: 'constant', value: 0.05 },
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
        10,
      ),
      scheduled(
        12,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0016_laevat_attack4'] })),
        32,
      ),
    ],
    timelineContinuationSkillId: 'chr_0016_laevat_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.25, 0.28, 0.3, 0.33, 0.35, 0.38, 0.4, 0.43, 0.45, 0.48, 0.52, 0.56] },
);

export const laevatainChr_0016_laevat_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_attack4',
    timelineBlockFrames: 22,
    naturalDurationFrames: 121,
    exclusiveFrame: 35,
    offsetRecordFrame: 19,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 5,
          endFrame: 45,
          input: 'basicAttack',
          targetSkillId: 'chr_0016_laevat_attack5',
        },
      ],
      allowedNextSkills: [{ startFrame: 22, endFrame: 45, skillIds: ['chr_0016_laevat_attack5'] }],
    },
    costFrame: 8,
    scheduledSequences: [
      scheduled(
        12,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0016_laevat_attack4.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0]:projectile_chr_0016_laevat_attack_5',
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
                    skillId: 'chr_0016_laevat_attack_5_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atk_scale: 0, duration: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'heat',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0016_laevat_attack4:/scheduledSequences/0/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        1,
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
        19,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0016_laevat_attack4.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0016_laevat_attack_4_2',
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
                    skillId: 'chr_0016_laevat_attack_5_projhit',
                    nativeSkillType: 'normalSkill',
                    naturalDurationFrames: 1,
                    castResource: {
                      costFrame: 0,
                      cooldownSeconds: 0,
                      maxChargeTime: 1,
                      cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
                    },
                    blackboard: { atk_scale: 0, duration: 0 },
                    scheduledSequences: [
                      scheduled(
                        0,
                        sequence(
                          step(
                            'dealDamage',
                            {
                              damageType: 'heat',
                              attackScale: { kind: 'blackboard', key: 'atk_scale' },
                              tags: ['normalAttack'],
                            },
                            'chr_0016_laevat_attack4:/scheduledSequences/1/sequence/steps/0/body/steps/0/callbacks/0/skill/scheduledSequences/0/sequence/steps/0',
                          ),
                        ),
                        1,
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
        21,
      ),
      scheduled(
        6,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0016_laevat_attack4:/scheduledSequences/2/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.05 },
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
        ),
        7,
      ),
      scheduled(
        22,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0016_laevat_attack5'] })),
        45,
      ),
    ],
    timelineContinuationSkillId: 'chr_0016_laevat_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.13, 0.14, 0.16, 0.17, 0.18, 0.2, 0.21, 0.22, 0.23, 0.25, 0.27, 0.29],
    display_atk_scale: [0.39, 0.43, 0.47, 0.51, 0.55, 0.59, 0.62, 0.66, 0.7, 0.75, 0.81, 0.88],
  },
);

export const laevatainChr_0016_laevat_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_attack5',
    timelineBlockFrames: 34,
    naturalDurationFrames: 145,
    exclusiveFrame: 42,
    offsetRecordFrame: 23,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 4,
          endFrame: 46,
          input: 'basicAttack',
          targetSkillId: 'chr_0016_laevat_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 34, endFrame: 46, skillIds: ['chr_0016_laevat_attack1'] }],
    },
    costFrame: 12,
    scheduledSequences: [
      scheduled(
        23,
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
                'chr_0016_laevat_attack5:/scheduledSequences/0/sequence/steps/0/body/steps/0',
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
        26,
      ),
      scheduled(
        26,
        sequence(
          repeatEachTick(
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
                'chr_0016_laevat_attack5:/scheduledSequences/1/sequence/steps/0/body/steps/0',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'count', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
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
        30,
      ),
      scheduled(
        34,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0016_laevat_attack1'] })),
        46,
      ),
    ],
    timelineContinuationSkillId: 'chr_0016_laevat_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 20,
    atk_scale: [0.27, 0.29, 0.32, 0.34, 0.37, 0.4, 0.42, 0.45, 0.48, 0.51, 0.55, 0.6],
    count: 0,
    poise: 18,
    display_atk_scale: [0.53, 0.58, 0.64, 0.69, 0.74, 0.8, 0.85, 0.9, 0.95, 1.02, 1.1, 1.19],
  },
);

export const laevatainChr_0016_laevat_ult_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_ult_attack1',
    timelineBlockFrames: 17,
    naturalDurationFrames: 155,
    exclusiveFrame: 25,
    offsetRecordFrame: 11,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 32,
          input: 'basicAttack',
          targetSkillId: 'chr_0016_laevat_ult_attack2',
        },
      ],
      allowedNextSkills: [
        {
          startFrame: 17,
          endFrame: 32,
          skillIds: ['chr_0016_laevat_ult_attack2', 'chr_0016_laevat_attack1'],
        },
        { startFrame: 17, endFrame: 32, skillIds: ['chr_0016_laevat_ult_attack2'] },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        12,
        sequence(
          step('modifyActionValue', {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'ratio' },
          }),
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0016_laevat_ult_attack1:/scheduledSequences/0/sequence/steps/1/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'stopped', fallback: 0 },
                      operator: 'equal',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'stopped',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
                      step('startTimeDilation', {
                        scope: 'entity',
                        durationSeconds: { kind: 'constant', value: 0.05 },
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
        17,
        sequence(
          step('reachSkillOperableBoundary', {
            skillIds: ['chr_0016_laevat_ult_attack2', 'chr_0016_laevat_attack1'],
          }),
        ),
        32,
      ),
    ],
    timelineContinuationSkillId: 'chr_0016_laevat_ult_attack2',
    skillType: 'basicAttack',
    levelSource: 'ultimate',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.65, 0.71, 0.78, 0.84, 0.91, 0.97, 1.04, 1.1, 1.17, 1.25, 1.34, 1.46],
    ratio: 1,
    stopped: 0,
  },
);

export const laevatainChr_0016_laevat_ult_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_ult_attack2',
    timelineBlockFrames: 27,
    naturalDurationFrames: 245,
    exclusiveFrame: 36,
    offsetRecordFrame: 10,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 44,
          input: 'basicAttack',
          targetSkillId: 'chr_0016_laevat_ult_attack3',
        },
      ],
      allowedNextSkills: [
        {
          startFrame: 27,
          endFrame: 44,
          skillIds: ['chr_0016_laevat_ult_attack3', 'chr_0016_laevat_attack1'],
        },
        { startFrame: 27, endFrame: 44, skillIds: ['chr_0016_laevat_ult_attack3'] },
      ],
    },
    costFrame: 8,
    scheduledSequences: [
      scheduled(
        10,
        sequence(
          step('modifyActionValue', {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'ratio' },
          }),
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0016_laevat_ult_attack2:/scheduledSequences/0/sequence/steps/1/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'stopped1', fallback: 0 },
                      operator: 'equal',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'stopped1',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
                      step('startTimeDilation', {
                        scope: 'entity',
                        durationSeconds: { kind: 'constant', value: 0.05 },
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
                            coefficient: { kind: 'constant', value: 0.5 },
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
        19,
      ),
      scheduled(
        21,
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
                'chr_0016_laevat_ult_attack2:/scheduledSequences/1/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'stopped2', fallback: 0 },
                      operator: 'equal',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'stopped2',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
                      }),
                      step('startTimeDilation', {
                        scope: 'entity',
                        durationSeconds: { kind: 'constant', value: 0.05 },
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
                            coefficient: { kind: 'constant', value: 0.5 },
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
        29,
      ),
      scheduled(
        27,
        sequence(
          step('reachSkillOperableBoundary', {
            skillIds: ['chr_0016_laevat_ult_attack3', 'chr_0016_laevat_attack1'],
          }),
        ),
        44,
      ),
    ],
    timelineContinuationSkillId: 'chr_0016_laevat_ult_attack3',
    skillType: 'basicAttack',
    levelSource: 'ultimate',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.41, 0.45, 0.49, 0.53, 0.57, 0.61, 0.65, 0.69, 0.73, 0.78, 0.84, 0.91],
    ratio: 1,
    stopped1: 0,
    stopped2: 0,
    display_atk_scale: [0.81, 0.89, 0.97, 1.05, 1.13, 1.22, 1.3, 1.38, 1.46, 1.56, 1.68, 1.82],
  },
);

export const laevatainChr_0016_laevat_ult_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_ult_attack3',
    timelineBlockFrames: 14,
    naturalDurationFrames: 180,
    exclusiveFrame: 20,
    offsetRecordFrame: 9,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 28,
          input: 'basicAttack',
          targetSkillId: 'chr_0016_laevat_ult_attack4',
        },
      ],
      allowedNextSkills: [
        {
          startFrame: 14,
          endFrame: 28,
          skillIds: ['chr_0016_laevat_ult_attack4', 'chr_0016_laevat_attack1'],
        },
        { startFrame: 14, endFrame: 28, skillIds: ['chr_0016_laevat_ult_attack4'] },
      ],
    },
    costFrame: 8,
    scheduledSequences: [
      scheduled(
        9,
        sequence(
          step('modifyActionValue', {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'ratio' },
          }),
          repeatEachTick(
            sequence(
              step('applyElementalInfliction', { element: 'heat', isExtra: false }),
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0016_laevat_ult_attack3:/scheduledSequences/0/sequence/steps/1/body/steps/1',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'stopped', fallback: 0 },
                      operator: 'equal',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'stopped',
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
        14,
        sequence(
          step('reachSkillOperableBoundary', {
            skillIds: ['chr_0016_laevat_ult_attack4', 'chr_0016_laevat_attack1'],
          }),
        ),
        28,
      ),
    ],
    timelineContinuationSkillId: 'chr_0016_laevat_ult_attack4',
    skillType: 'basicAttack',
    levelSource: 'ultimate',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [1.15, 1.27, 1.39, 1.5, 1.62, 1.73, 1.85, 1.96, 2.08, 2.22, 2.4, 2.6],
    ratio: 1,
    stopped: 0,
  },
);

export const laevatainChr_0016_laevat_ult_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_ult_attack4',
    timelineBlockFrames: 35,
    naturalDurationFrames: 181,
    exclusiveFrame: 47,
    offsetRecordFrame: 22,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 68,
          input: 'basicAttack',
          targetSkillId: 'chr_0016_laevat_ult_attack1',
        },
      ],
      allowedNextSkills: [
        {
          startFrame: 35,
          endFrame: 68,
          skillIds: ['chr_0016_laevat_ult_attack1', 'chr_0016_laevat_attack1'],
        },
        { startFrame: 35, endFrame: 68, skillIds: ['chr_0016_laevat_ult_attack1'] },
      ],
    },
    costFrame: 8,
    scheduledSequences: [
      scheduled(
        22,
        sequence(
          step('modifyActionValue', {
            key: 'atk_scale',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'ratio' },
          }),
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0016_laevat_ult_attack4:/scheduledSequences/0/sequence/steps/1/body/steps/0',
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
        26,
      ),
      scheduled(
        26,
        sequence(
          repeatEachTick(
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
                'chr_0016_laevat_ult_attack4:/scheduledSequences/1/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'stopped', fallback: 0 },
                      operator: 'equal',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'stopped',
                        operation: 'add',
                        value: { kind: 'constant', value: 1 },
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
        35,
      ),
      scheduled(
        35,
        sequence(
          step('reachSkillOperableBoundary', {
            skillIds: ['chr_0016_laevat_ult_attack1', 'chr_0016_laevat_attack1'],
          }),
        ),
        68,
      ),
    ],
    timelineContinuationSkillId: 'chr_0016_laevat_ult_attack1',
    skillType: 'basicAttack',
    levelSource: 'ultimate',
    nativeSkillType: 'attack',
  },
  {
    atb: 22,
    atk_scale: [1.01, 1.11, 1.22, 1.32, 1.42, 1.52, 1.62, 1.72, 1.82, 1.95, 2.1, 2.28],
    hit: 0,
    poise: 24,
    ratio: 1,
    stopped: 0,
    display_atk_scale: [2.03, 2.23, 2.43, 2.63, 2.84, 3.04, 3.24, 3.44, 3.65, 3.9, 4.2, 4.56],
  },
);

export const laevatainChr_0016_laevat_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_power_attack',
    timelineBlockFrames: 42,
    naturalDurationFrames: 141,
    exclusiveFrame: 50,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 42,
          endFrame: 62,
          skillIds: ['chr_0016_laevat_normal_skill', 'chr_0016_laevat_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        5,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.2,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0016_laevat_power_attack:/scheduledSequences/0/sequence/steps/0',
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
        11,
      ),
      scheduled(
        42,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.8,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0016_laevat_power_attack:/scheduledSequences/1/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(step('gainFinisherSp', { factor: 1, recipient: 'team' })),
            undefined,
            { alwaysNext: true },
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.45 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 1,
                  inTangent: -2.315953,
                  outTangent: -2.315953,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.3436488,
                  value: 0.2041256,
                  inTangent: -0.6439322,
                  outTangent: 0.0176236,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 0.8204471,
                  value: 0.3652225,
                  inTangent: 0.4345389,
                  outTangent: 2.729132,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 3.535323,
                  outTangent: 3.535323,
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
        46,
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
        42,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const laevatainChr_0016_laevat_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_plunging_attack_end',
    timelineBlockFrames: 14,
    naturalDurationFrames: 145,
    exclusiveFrame: 13,
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
            'chr_0016_laevat_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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

export const laevatainChr_0016_laevat_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_normal_skill',
    timelineBlockFrames: 118,
    naturalDurationFrames: 282,
    exclusiveFrame: 117,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [
      scheduled(214, sequence(step('jumpTimeline', { destinationFrame: 231 })), 215),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0016_laevat_energy'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 4 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0016_laevat_has_max_energy',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
              }),
            ),
          ),
        ),
        3,
      ),
      scheduled(
        30,
        sequence(
          step('jumpTimeline', {
            destinationFrame: 80,
            condition: {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0016_laevat_has_max_energy'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
          }),
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0016_laevat_has_max_energy'],
            reason: 'other',
          }),
        ),
        31,
      ),
      scheduled(37, sequence(step('jumpTimeline', { destinationFrame: 215 })), 51),
      scheduled(
        4,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0016_laevat_normal_skill',
            childSkillId: 'chr_0016_laevat_normal_skill_abilityentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
            saveToContextKey: 'ball',
          }),
        ),
        7,
      ),
      scheduled(
        104,
        sequence(
          step('modifyActionValue', {
            key: 'atk_scale_3',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'ratio' },
          }),
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0016_laevat_energy'],
            reason: 'other',
          }),
          repeatEachTick(
            sequence(
              step('applyBuff', {
                buffId: 'buff_common_fire_fire_burning_triggered',
                target: 'enemy',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: {
                  duration: 'duration',
                  extra_scaling: 'extra_scaling',
                },
              }),
              step('modifyActionValue', {
                key: 'second_hit',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'second_hit', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('changeResourceByActionValue', {
                    resource: 'sp',
                    amount: { kind: 'blackboard', key: 'atb' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'team',
                    spGainKind: 'refund',
                    spGainSource: 'skill',
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_3' },
                  tags: ['normalSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise_extra' },
                },
                'chr_0016_laevat_normal_skill:/scheduledSequences/5/sequence/steps/2/body/steps/3',
              ),
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.35 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_hard_stop' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'second_hit', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('changeResourceByActionValue', {
                    resource: 'ultimateEnergy',
                    amount: { kind: 'blackboard', key: 'extra_usp' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'caster',
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
        105,
      ),
      scheduled(
        105,
        sequence(forEachContextTarget('ball', sequence(step('finishCurrentAbilityEntity', {})))),
        109,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb: 0,
    atk_scale: [0.62, 0.68, 0.75, 0.81, 0.87, 0.93, 0.99, 1.06, 1.12, 1.2, 1.29, 1.4],
    atk_scale_2: [0.06, 0.07, 0.08, 0.08, 0.09, 0.09, 0.1, 0.11, 0.11, 0.12, 0.13, 0.14],
    atk_scale_3: [3.42, 3.76, 4.1, 4.45, 4.79, 5.13, 5.47, 5.81, 6.16, 6.58, 7.1, 7.7],
    cam_angle: 0,
    cam_duration: 0,
    consumed_fire_count: 0,
    count: 4,
    duration: 5,
    entered: 0,
    extra_scaling: 1,
    extra_usp: 100,
    input_angle: 0,
    level: 1,
    max_consumed_fire_count: 0,
    poise: 10,
    poise_extra: 10,
    ratio: 1,
    second_hit: 0,
    triggered_burning: 0,
  },
);

export const laevatainChr_0016_laevat_normal_skill_during_ult: SkillDefinition =
  withSkillBlackboard(
    {
      key: 'chr_0016_laevat_normal_skill_during_ult',
      timelineBlockFrames: 116,
      naturalDurationFrames: 271,
      exclusiveFrame: 115,
      offsetRecordFrame: 0,
      inputWindows: {
        allowedNextSkills: [
          {
            startFrame: 33,
            endFrame: 75,
            skillIds: ['chr_0016_laevat_normal_skill', 'chr_0016_laevat_normal_skill_during_ult'],
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
                buffIds: ['buff_chr_0016_laevat_energy'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 4 },
              },
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0016_laevat_has_max_energy',
                  target: 'caster',
                  inheritSourceSkillCastInfo: true,
                }),
              ),
            ),
          ),
          3,
        ),
        scheduled(
          24,
          sequence(
            step('jumpTimeline', {
              destinationFrame: 75,
              condition: {
                kind: 'buffIdStackCompare',
                target: 'caster',
                buffIds: ['buff_chr_0016_laevat_has_max_energy'],
                operator: 'greaterOrEqual',
                value: { kind: 'constant', value: 1 },
              },
            }),
          ),
          27,
        ),
        scheduled(39, sequence(step('jumpTimeline', { destinationFrame: 196 })), 40),
        scheduled(195, sequence(step('jumpTimeline', { destinationFrame: 270 })), 196),
        scheduled(
          13,
          sequence(
            repeatEachTick(
              sequence(
                branch(
                  {
                    kind: 'all',
                    conditions: [
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_common_energy_shard_attached_fire'],
                        operator: 'greaterOrEqual',
                        value: { kind: 'constant', value: 1 },
                      },
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'triggered_burning', fallback: 0 },
                        operator: 'equal',
                        right: { kind: 'constant', value: 0 },
                      },
                    ],
                  },
                  sequence(
                    step('modifyActionValue', {
                      key: 'triggered_burning',
                      operation: 'add',
                      value: { kind: 'constant', value: 1 },
                    }),
                  ),
                  undefined,
                  { alwaysNext: true },
                ),
                step(
                  'dealDamage',
                  {
                    damageType: 'heat',
                    attackScale: { kind: 'blackboard', key: 'atk_scale' },
                    tags: ['normalSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'blackboard', key: 'poise' },
                  },
                  'chr_0016_laevat_normal_skill_during_ult:/scheduledSequences/4/sequence/steps/0/body/steps/1',
                ),
                step('startTimeDilation', {
                  scope: 'entity',
                  durationSeconds: { kind: 'constant', value: 0.15 },
                  slot: 'TimeDilation/Layer/Entity/HitStop',
                  priority: 10,
                  curve: { kind: 'named', key: 'char_hard_stop' },
                  finishByAction: false,
                  targets: ['enemy', 'caster'],
                }),
                branch(
                  {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'entered', fallback: 0 },
                    operator: 'equal',
                    right: { kind: 'constant', value: 0 },
                  },
                  sequence(
                    step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
                    step('modifyActionValue', {
                      key: 'entered',
                      operation: 'add',
                      value: { kind: 'constant', value: 1 },
                    }),
                    step('applyBuff', {
                      buffId: 'buff_chr_0016_laevat_energy',
                      target: 'caster',
                      inheritSourceSkillCastInfo: true,
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
          14,
        ),
        scheduled(
          23,
          sequence(
            repeatEachTick(
              sequence(
                branch(
                  {
                    kind: 'all',
                    conditions: [
                      {
                        kind: 'buffIdStackCompare',
                        target: 'enemy',
                        buffIds: ['buff_common_energy_shard_attached_fire'],
                        operator: 'greaterOrEqual',
                        value: { kind: 'constant', value: 1 },
                      },
                      {
                        kind: 'actionValueCompare',
                        left: { kind: 'blackboard', key: 'triggered_burning', fallback: 0 },
                        operator: 'equal',
                        right: { kind: 'constant', value: 0 },
                      },
                    ],
                  },
                  sequence(
                    step('modifyActionValue', {
                      key: 'triggered_burning',
                      operation: 'add',
                      value: { kind: 'constant', value: 1 },
                    }),
                  ),
                  undefined,
                  { alwaysNext: true },
                ),
                step(
                  'dealDamage',
                  {
                    damageType: 'heat',
                    attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                    tags: ['normalSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'blackboard', key: 'poise' },
                  },
                  'chr_0016_laevat_normal_skill_during_ult:/scheduledSequences/5/sequence/steps/0/body/steps/1',
                ),
                step('startTimeDilation', {
                  scope: 'entity',
                  durationSeconds: { kind: 'constant', value: 0.25 },
                  slot: 'TimeDilation/Layer/Entity/HitStop',
                  priority: 10,
                  curve: { kind: 'named', key: 'char_hard_stop' },
                  finishByAction: false,
                  targets: ['enemy', 'caster'],
                }),
                branch(
                  {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'entered', fallback: 0 },
                    operator: 'equal',
                    right: { kind: 'constant', value: 0 },
                  },
                  sequence(
                    step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
                    step('modifyActionValue', {
                      key: 'entered',
                      operation: 'add',
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
          24,
        ),
        scheduled(
          98,
          sequence(
            step('modifyActionValue', {
              key: 'atk_scale_3',
              operation: 'multiply',
              value: { kind: 'blackboard', key: 'ratio' },
            }),
            step('finishBuffsById', {
              target: 'caster',
              buffIds: ['buff_chr_0016_laevat_energy'],
              reason: 'other',
            }),
            repeatEachTick(
              sequence(
                step('applyBuff', {
                  buffId: 'buff_common_fire_fire_burning_triggered',
                  target: 'enemy',
                  inheritSourceSkillCastInfo: true,
                  copiedBlackboardAssignments: {
                    duration: 'duration',
                    extra_scaling: 'extra_scaling',
                  },
                }),
                step('modifyActionValue', {
                  key: 'second_hit',
                  operation: 'add',
                  value: { kind: 'constant', value: 1 },
                }),
                branch(
                  {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'second_hit', fallback: 0 },
                    operator: 'equal',
                    right: { kind: 'constant', value: 1 },
                  },
                  sequence(
                    step('changeResourceByActionValue', {
                      resource: 'sp',
                      amount: { kind: 'blackboard', key: 'atb' },
                      coefficient: { kind: 'constant', value: 1 },
                      recipient: 'team',
                      spGainKind: 'refund',
                      spGainSource: 'skill',
                    }),
                  ),
                  undefined,
                  { alwaysNext: true },
                ),
                step(
                  'dealDamage',
                  {
                    damageType: 'heat',
                    attackScale: { kind: 'blackboard', key: 'atk_scale_3' },
                    tags: ['normalSkill'],
                    features: ['canBreakWeakness'],
                    stagger: { kind: 'blackboard', key: 'poise' },
                  },
                  'chr_0016_laevat_normal_skill_during_ult:/scheduledSequences/6/sequence/steps/2/body/steps/3',
                ),
                branch(
                  {
                    kind: 'actionValueCompare',
                    left: { kind: 'blackboard', key: 'second_hit', fallback: 0 },
                    operator: 'lessOrEqual',
                    right: { kind: 'constant', value: 1 },
                  },
                  sequence(
                    step('startTimeDilation', {
                      scope: 'entity',
                      durationSeconds: { kind: 'constant', value: 0.65 },
                      slot: 'TimeDilation/Layer/Entity/HitStop',
                      priority: 10,
                      curve: { kind: 'named', key: 'char_normal_attack' },
                      finishByAction: false,
                      targets: ['enemy', 'caster'],
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
          99,
        ),
        scheduled(
          0,
          sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0016_laevat_pause_ult',
              target: 'caster',
              inheritSourceSkillCastInfo: true,
              finishByAction: true,
            }),
          ),
          115,
        ),
      ],
      costs: [{ resource: 'sp', value: 100 }],
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      nativeSkillType: 'normalSkill',
    },
    {
      atb: 0,
      atk_scale: [1.47, 1.61, 1.76, 1.91, 2.05, 2.2, 2.35, 2.49, 2.64, 2.82, 3.04, 3.3],
      atk_scale_2: [1.64, 1.81, 1.97, 2.14, 2.3, 2.47, 2.63, 2.79, 2.96, 3.16, 3.41, 3.7],
      atk_scale_3: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9],
      duration: 5,
      entered: 0,
      extra_scaling: 1,
      poise: 10,
      ratio: 1,
      second_hit: 0,
      triggered_burning: 0,
    },
  );

export const laevatainChr_0016_laevat_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_ultimate_skill',
    timelineBlockFrames: 74,
    naturalDurationFrames: 245,
    exclusiveFrame: 73,
    offsetRecordFrame: 0,
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: [
              'buff_chr_0016_laevat_ult_dash',
              'buff_chr_0016_laevat_show_weapon',
              'buff_chr_0016_laevat_ring_start_asset',
              'buff_chr_0016_laevat_ult_dash',
              'buff_chr_0016_laevat_ult_end',
              'buff_chr_0016_laevat_ultimate_sfx_loop',
            ],
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
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 61),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        61,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0016_laevat_show_weapon',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        87,
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
        73,
      ),
    ],
    cooldownFrames: 300,
    costs: [{ resource: 'ultimateEnergy', value: 300 }],
    enhancementStateBuffId: 'buff_chr_0016_laevat_show_weapon',
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  { duration: 15 },
);

export const laevatainChr_0016_laevat_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0016_laevat_combo_skill',
    timelineBlockFrames: 58,
    naturalDurationFrames: 180,
    exclusiveFrame: 57,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 41,
          endFrame: 85,
          skillIds: ['chr_0016_laevat_normal_skill', 'chr_0016_laevat_normal_skill_during_ult'],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        20,
        sequence(
          branch(
            {
              kind: 'contextTargetCountCompare',
              contextKey: 'tar',
              operator: 'greaterOrEqual',
              value: 1,
            },
            sequence(),
            sequence(
              step('mergeContextTargets', {
                saveToContextKey: 'tar',
                sources: [{ kind: 'target', target: 'enemy' }],
              }),
            ),
            { alwaysNext: true },
          ),
          forEachContextTarget(
            'tar',
            sequence({
              kind: 'launchProjectile',
              parameters: { finish: 'firstTickReach', recycleDelaySeconds: 0.0333333350718021 },
              callbacks: [],
            }),
          ),
          step('applyBuff', {
            buffId: 'buff_chr_0016_laevat_combo_skill_hit_self',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
          forEachContextTarget(
            'tar',
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'index', fallback: 0 },
                  operator: 'less',
                  right: { kind: 'constant', value: 5 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'index',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              {
                kind: 'switch',
                parameters: { choice: { kind: 'blackboard', key: 'index' }, alwaysNext: true },
                options: [
                  {
                    value: { kind: 'constant', value: 1 },
                    sequence: sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0016_laevat_combo_skill_start',
                        target: 'enemy',
                        inheritSourceSkillCastInfo: true,
                        blackboardAssignments: { trigger: { kind: 'constant', value: 0.7 } },
                        copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
                      }),
                    ),
                  },
                  {
                    value: { kind: 'constant', value: 2 },
                    sequence: sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0016_laevat_combo_skill_start',
                        target: 'enemy',
                        inheritSourceSkillCastInfo: true,
                        blackboardAssignments: { trigger: { kind: 'constant', value: 0.65 } },
                        copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
                      }),
                    ),
                  },
                  {
                    value: { kind: 'constant', value: 3 },
                    sequence: sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0016_laevat_combo_skill_start',
                        target: 'enemy',
                        inheritSourceSkillCastInfo: true,
                        blackboardAssignments: { trigger: { kind: 'constant', value: 0.6 } },
                        copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
                      }),
                    ),
                  },
                  {
                    value: { kind: 'constant', value: 4 },
                    sequence: sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0016_laevat_combo_skill_start',
                        target: 'enemy',
                        inheritSourceSkillCastInfo: true,
                        blackboardAssignments: { trigger: { kind: 'constant', value: 0.55 } },
                        copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
                      }),
                    ),
                  },
                  {
                    value: { kind: 'constant', value: 5 },
                    sequence: sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0016_laevat_combo_skill_start',
                        target: 'enemy',
                        inheritSourceSkillCastInfo: true,
                        blackboardAssignments: { trigger: { kind: 'constant', value: 0.55 } },
                        copiedBlackboardAssignments: { atk_scale: 'atk_scale', poise: 'poise' },
                      }),
                    ),
                  },
                ],
              },
              step('applyBuff', {
                buffId: 'buff_chr_0016_laevat_combo_skill_hitstop',
                target: 'enemy',
                inheritSourceSkillCastInfo: true,
              }),
            ),
          ),
        ),
        56,
      ),
      scheduled(
        0,
        sequence(
          repeatEachTick(
            sequence(
              branch(
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0016_laevat_ult_end'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0016_laevat_show_weapon',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: { duration: { kind: 'constant', value: 0.1 } },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0016_laevat_ult_end',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                    blackboardAssignments: { duration: { kind: 'constant', value: 0.1 } },
                  }),
                ),
              ),
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
        57,
      ),
      scheduled(
        5,
        sequence(
          branch(
            {
              kind: 'entityTagMatch',
              target: 'enemy',
              tagQueryType: 'hasAny',
              tags: [
                'Skill/Character/Common/SpellStatus/Burning',
                'Skill/Character/Common/SpellStatus/Corrupt',
              ],
            },
            sequence(
              step('mergeContextTargets', {
                saveToContextKey: 'tar',
                sources: [{ kind: 'target', target: 'enemy' }],
              }),
            ),
            sequence(step('mergeContextTargets', { saveToContextKey: 'tar', sources: [] })),
          ),
          branch(
            {
              kind: 'contextTargetCountCompare',
              contextKey: 'tar',
              operator: 'greaterOrEqual',
              value: 1,
            },
            sequence(
              forEachContextTarget(
                'tar',
                sequence(
                  step('modifyActionValue', {
                    key: 'count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'count', fallback: 0 },
                      operator: 'greaterOrEqual',
                      right: { kind: 'blackboard', key: 'limit', fallback: 0 },
                    },
                    sequence(
                      step('modifyActionValue', {
                        key: 'count',
                        operation: 'assign',
                        value: { kind: 'blackboard', key: 'limit' },
                      }),
                    ),
                  ),
                ),
              ),
            ),
            sequence(
              step('mergeContextTargets', {
                saveToContextKey: 'tar',
                sources: [{ kind: 'context', contextKey: 'smart_target' }],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        8,
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
    cooldownFrames: [300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 270],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [2.4, 2.64, 2.88, 3.12, 3.36, 3.6, 3.84, 4.08, 4.32, 4.62, 4.98, 5.4],
    count: 0,
    duration: 10,
    index: 0,
    limit: 5,
    poise: 10,
  },
);

export const laevatainCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const laevatain: OperatorDefinition = {
  slug: 'laevatain',
  gameId: 'LAEVATAIN',
  rarity: 6,
  weaponType: 'sword',
  element: 'heat',
  role: 'striker',
  mainAttribute: 'intellect',
  secondaryAttribute: 'strength',
  attributes: {
    strength: [13, 36, 60, 85, 109, 121],
    agility: [9, 28, 49, 69, 89, 99],
    intellect: [22, 55, 90, 125, 160, 177],
    will: [9, 26, 44, 62, 80, 89],
    baseAttack: [30, 91, 156, 221, 285, 318],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  passiveUi: { kind: 'numeric', appearance: 'laevatainCounter', maximum: 4, activeAt: 4 },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        laevatainChr_0016_laevat_attack1,
        laevatainChr_0016_laevat_attack2,
        laevatainChr_0016_laevat_attack3,
        laevatainChr_0016_laevat_attack4,
        laevatainChr_0016_laevat_attack5,
      ],
      variants: [
        {
          key: 'enhancedBasicAttack',
          levelSource: 'ultimate',
          libraryNameQualifier: 'enhanced',
          skills: [
            laevatainChr_0016_laevat_ult_attack1,
            laevatainChr_0016_laevat_ult_attack2,
            laevatainChr_0016_laevat_ult_attack3,
            laevatainChr_0016_laevat_ult_attack4,
          ],
        },
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: laevatainChr_0016_laevat_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: laevatainChr_0016_laevat_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: laevatainChr_0016_laevat_normal_skill,
      replacementSkills: [laevatainChr_0016_laevat_normal_skill_during_ult],
      replacementSkillPlacements: { chr_0016_laevat_normal_skill_during_ult: 'standard' },
      replacementSkillNameQualifiers: { chr_0016_laevat_normal_skill_during_ult: 'enhanced' },
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: laevatainChr_0016_laevat_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: laevatainChr_0016_laevat_combo_skill,
    },
  ],
  dodgeSkill: laevatainCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    {
      key: 'battleSkill',
      baseSkillKey: 'chr_0016_laevat_normal_skill',
      replacementSkillKeys: ['chr_0016_laevat_normal_skill_during_ult'],
    },
    { key: 'comboSkill', baseSkillKey: 'chr_0016_laevat_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0016_laevat_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0016_laevat_attack1',
        'chr_0016_laevat_attack2',
        'chr_0016_laevat_attack3',
        'chr_0016_laevat_attack4',
        'chr_0016_laevat_attack5',
        'chr_0016_laevat_plunging_attack_end',
        'chr_0016_laevat_ult_attack1',
        'chr_0016_laevat_ult_attack2',
        'chr_0016_laevat_ult_attack3',
        'chr_0016_laevat_ult_attack4',
        'chr_0016_laevat_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0016_laevat_attack1',
        'chr_0016_laevat_attack2',
        'chr_0016_laevat_attack3',
        'chr_0016_laevat_attack4',
        'chr_0016_laevat_attack5',
      ],
      defaultSkillKey: 'chr_0016_laevat_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  playerActionModes: [
    {
      modeId: 'ult',
      modeLayer: 'ult',
      defaultEnabled: false,
      normalAttackSkillKeys: [
        'chr_0016_laevat_ult_attack1',
        'chr_0016_laevat_ult_attack2',
        'chr_0016_laevat_ult_attack3',
        'chr_0016_laevat_ult_attack4',
      ],
      commandMappings: { basicAttack: { skillId: 'chr_0016_laevat_ult_attack1' } },
    },
  ],
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0016_laevat_combo_skill',
      event: 'addedBuff',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'eventBuffTagsMatch',
            match: 'hasAny',
            buffTags: [
              'Skill/Character/Common/SpellStatus/Burning',
              'Skill/Character/Common/SpellStatus/Corrupt',
            ],
          },
          sequence(),
        ),
      ),
    },
  ],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 3,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0016_laevat_passive',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: {
            ignore_fire_resist: [-10, -15, -20],
            ignore_fire_resist_duration: { kind: 'constant', value: 20 },
            max_stack: { kind: 'constant', value: 4 },
          },
        }),
      ),
    },
    {
      levels: 2,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0016_laevat_talent_2_0',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: {
            hp_threshold: { kind: 'constant', value: 0.4 },
            heal_max_hp: { kind: 'constant', value: 0.05 },
            shelter: { kind: 'constant', value: 0.9 },
            duration: [4, 8],
            cd: { kind: 'constant', value: 120 },
            shelter_real: { kind: 'constant', value: 0.9 },
          },
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
          skillKey: 'chr_0016_laevat_normal_skill',
          blackboardKey: 'atb',
          operation: 'add',
          value: 20,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill_during_ult',
          blackboardKey: 'atb',
          operation: 'add',
          value: 20,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill_during_ult',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 20 },
        { kind: 'addStaticDamageIncrease', target: 'normalAttack', value: 0.15 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill',
          blackboardKey: 'duration',
          operation: 'multiply',
          value: 1.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill',
          blackboardKey: 'extra_scaling',
          operation: 'assign',
          value: 1.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill_during_ult',
          blackboardKey: 'duration',
          operation: 'multiply',
          value: 1.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          skillKey: 'chr_0016_laevat_normal_skill_during_ult',
          blackboardKey: 'extra_scaling',
          operation: 'assign',
          value: 1.5,
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
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0016_laevat_ult_attack1',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0016_laevat_ult_attack2',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0016_laevat_ult_attack3',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'basicAttack',
          skillKey: 'chr_0016_laevat_ult_attack4',
          blackboardKey: 'ratio',
          operation: 'assign',
          value: 1.2,
        },
      ],
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0016_laevat_potential_5',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: {
            extend_duration: { kind: 'constant', value: 1 },
            max_duration: { kind: 'constant', value: 7 },
          },
        }),
      ),
    },
  ],
  buffDefinitions: {
    buff_chr_0016_laevat_absorb_fire_inflict: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 3,
      triggerIntervalSeconds: 0.5,
      waitFirstTriggerInterval: false,
      maxTriggerCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          branch(
            {
              kind: 'buffStackCompare',
              target: 'buffOwner',
              tagQueryType: 'hasAny',
              buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('finishBuffsByTag', {
                target: 'buffOwner',
                tagQueryType: 'hasAny',
                buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
                reason: 'early',
                count: { kind: 'constant', value: 1 },
              }),
              {
                kind: 'launchProjectile',
                parameters: { finish: 'firstTickReach', recycleDelaySeconds: 5 },
                callbacks: [],
              },
            ),
          ),
        ),
      },
    },
    buff_chr_0016_laevat_combo_skill_hit: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 2,
      triggerIntervalSeconds: 0.7,
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale: 0, poise: 0 },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          0,
          sequence(
            step(
              'dealDamage',
              {
                damageType: 'heat',
                attackScale: { kind: 'blackboard', key: 'atk_scale' },
                tags: ['comboSkill'],
                features: ['canBreakWeakness'],
                stagger: { kind: 'blackboard', key: 'poise' },
              },
              'buff_chr_0016_laevat_combo_skill_hit:/scheduledSequences/0/sequence/steps/0',
            ),
            branch(
              { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
              sequence(
                branch(
                  { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
                  sequence(
                    branch(
                      { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
                      sequence(),
                      undefined,
                      { alwaysNext: true },
                    ),
                  ),
                  sequence(
                    branch(
                      { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
                      sequence(),
                      undefined,
                      { alwaysNext: true },
                    ),
                  ),
                  { alwaysNext: true },
                ),
              ),
              sequence(
                branch(
                  { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
                  sequence(
                    branch(
                      { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
                      sequence(),
                      undefined,
                      { alwaysNext: true },
                    ),
                  ),
                  sequence(
                    branch(
                      { kind: 'probability', probability: { kind: 'constant', value: 0.5 } },
                      sequence(),
                      undefined,
                      { alwaysNext: true },
                    ),
                  ),
                  { alwaysNext: true },
                ),
              ),
              { alwaysNext: true },
            ),
            step('applyBuff', {
              buffId: 'buff_chr_0016_laevat_combo_skill_usp',
              target: 'buffSource',
              source: 'buffSource',
              inheritSourceSkillCastInfo: true,
            }),
          ),
          3,
        ),
      ],
    },
    buff_chr_0016_laevat_combo_skill_hit_self: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          21,
          sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0016_laevat_energy',
              target: 'buffOwner',
              source: 'buffSource',
              inheritSourceSkillCastInfo: true,
            }),
          ),
          24,
        ),
      ],
    },
    buff_chr_0016_laevat_combo_skill_hitstop: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          25,
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
          28,
        ),
      ],
    },
    buff_chr_0016_laevat_combo_skill_start: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 2,
      triggerIntervalSeconds: { blackboardKey: 'trigger' },
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale: 0, poise: 0, trigger: 1 },
      attributeModifiers: [],
      lifecycleSequences: {
        trigger: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0016_laevat_combo_skill_hit',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { poise: 'poise', atk_scale: 'atk_scale' },
          }),
        ),
      },
    },
    buff_chr_0016_laevat_combo_skill_usp: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 3,
      applyTags: [],
      extendTags: [],
      blackboard: { count: 0, usp_1: 25, usp_2: 5, usp_3: 5, usp_4: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('readBuffStackCount', {
            target: 'buffOwner',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['buff_chr_0016_laevat_combo_skill_usp'] },
          }),
          {
            kind: 'switch',
            parameters: { choice: { kind: 'blackboard', key: 'count' }, alwaysNext: true },
            options: [
              {
                value: { kind: 'constant', value: 0 },
                sequence: sequence(
                  step('changeResourceByActionValue', {
                    resource: 'ultimateEnergy',
                    amount: { kind: 'blackboard', key: 'usp_1' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'caster',
                  }),
                ),
              },
              {
                value: { kind: 'constant', value: 1 },
                sequence: sequence(
                  step('changeResourceByActionValue', {
                    resource: 'ultimateEnergy',
                    amount: { kind: 'blackboard', key: 'usp_2' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'caster',
                  }),
                ),
              },
              {
                value: { kind: 'constant', value: 2 },
                sequence: sequence(
                  step('changeResourceByActionValue', {
                    resource: 'ultimateEnergy',
                    amount: { kind: 'blackboard', key: 'usp_3' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'caster',
                  }),
                ),
              },
              {
                value: { kind: 'constant', value: 3 },
                sequence: sequence(
                  step('changeResourceByActionValue', {
                    resource: 'ultimateEnergy',
                    amount: { kind: 'blackboard', key: 'usp_4' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'caster',
                  }),
                ),
              },
            ],
          },
        ),
      },
    },
    buff_chr_0016_laevat_energy: {
      stackingType: 'enhance',
      priority: 0,
      maxStackCount: { blackboardKey: 'max_stack' },
      applyTags: [],
      extendTags: [],
      blackboard: {
        count: 0,
        duration: 0,
        ignore: 0,
        ignore_fire_resist: 0,
        ignore_fire_resist_duration: 0,
        max_stack: 4,
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
              step('setCharacterPassiveUiValue', {
                target: 'caster',
                value: { kind: 'constant', value: 1 },
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
              step('readBuffBlackboard', {
                target: 'buffOwner',
                query: { kind: 'id', buffIds: ['buff_chr_0016_laevat_passive'] },
                desiredKey: 'ignore_fire_resist',
                outputKey: 'ignore_fire_resist',
              }),
              step('readBuffBlackboard', {
                target: 'buffOwner',
                query: { kind: 'id', buffIds: ['buff_chr_0016_laevat_passive'] },
                desiredKey: 'ignore_fire_resist_duration',
                outputKey: 'ignore_fire_resist_duration',
              }),
            ),
          },
        ),
        enhanceChanged: sequence(
          step('readBuffStackCount', {
            target: 'buffOwner',
            outputKey: 'count',
            query: { kind: 'id', buffIds: ['buff_chr_0016_laevat_energy'] },
          }),
          step('setCharacterPassiveUiValue', {
            target: 'caster',
            value: { kind: 'blackboard', key: 'count' },
          }),
          {
            kind: 'switch',
            parameters: { choice: { kind: 'blackboard', key: 'count' }, alwaysNext: true },
            options: [
              {
                value: { kind: 'blackboard', key: 'max_stack' },
                sequence: sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0016_laevat_energy_icon_5',
                    target: 'buffOwner',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: {
                      ignore_fire_resist: 'ignore_fire_resist',
                      ignore_fire_resist_duration: 'ignore_fire_resist_duration',
                    },
                  }),
                ),
              },
            ],
          },
        ),
        finish: sequence(
          step('setCharacterPassiveUiValue', {
            target: 'caster',
            value: { kind: 'constant', value: 0 },
          }),
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0016_laevat_energy_icon_5'],
            reason: 'other',
          }),
        ),
      },
    },
    buff_chr_0016_laevat_energy_icon_5: {
      stackingType: 'unlimited',
      priority: 5,
      maxStackCount: 5,
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0, ignore_fire_resist: 0, ignore_fire_resist_duration: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0016_laevat_ignore_fire_resist',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              ignore_fire_resist_duration: 'ignore_fire_resist_duration',
              ignore_fire_resist: 'ignore_fire_resist',
            },
          }),
        ),
      },
    },
    buff_chr_0016_laevat_has_max_energy: {
      stackingType: 'unlimited',
      priority: 1,
      maxStackCount: 5,
      durationSeconds: 2,
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0 },
      attributeModifiers: [],
    },
    buff_chr_0016_laevat_ignore_fire_resist: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'ignore_fire_resist_duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_laevat_potential_1',
        iconPath: '/icons/icon_battle_laevat_potential_1.webp',
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
      blackboard: { ignore_fire_resist: 0, ignore_fire_resist_duration: 0 },
      attributeModifiers: [],
      damageModifiers: [
        {
          enabledSide: 'attacker',
          processors: [
            {
              kind: 'instantAttribute',
              targetSide: 'defender',
              attribute: 'FireResistance',
              values: { slot: 'baseAddition', value: { blackboardKey: 'ignore_fire_resist' } },
              attributeTiming: 'runtime',
            },
          ],
        },
      ],
    },
    buff_chr_0016_laevat_passive: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { ignore_fire_resist: 0, ignore_fire_resist_duration: 0, max_stack: 4 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
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
                buffId: 'buff_chr_0016_laevat_passive_enemy',
                target: 'enemy',
                finishByAction: true,
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
              step('applyBuff', {
                buffId: 'buff_chr_0016_laevat_passive_teammate',
                target: 'party',
                finishByAction: true,
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: { max_stack: { kind: 'blackboard', key: 'max_stack' } },
              }),
            ),
          },
        ),
      },
    },
    buff_chr_0016_laevat_passive_enemy: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { count: 0 },
      attributeModifiers: [],
    },
    buff_chr_0016_laevat_passive_teammate: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { count: 0, curve_rate: 0, distance: 0, max_stack: 0, speed: 0 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'beforeOutputDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'eventDamageTagsMatch',
                match: 'hasAny',
                tags: ['powerAttack', 'normalAttackLastCombo'],
              },
              sequence(
                branch(
                  { kind: 'casterControlled' },
                  sequence(
                    branch(
                      {
                        kind: 'buffIdStackCompare',
                        target: 'caster',
                        buffIds: ['buff_chr_0016_laevat_energy'],
                        operator: 'less',
                        value: { kind: 'blackboard', key: 'max_stack' },
                      },
                      sequence(
                        branch(
                          {
                            kind: 'buffIdStackCompare',
                            target: 'buffOwner',
                            buffIds: ['buff_chr_0016_laevat_passive_teammate_cd'],
                            operator: 'equal',
                            value: { kind: 'constant', value: 0 },
                          },
                          sequence(
                            step('applyBuff', {
                              buffId: 'buff_chr_0016_laevat_passive_teammate_cd',
                              target: 'buffOwner',
                              source: 'buffSource',
                              inheritSourceSkillCastInfo: true,
                            }),
                            branch(
                              {
                                kind: 'entityTagMatch',
                                target: 'enemy',
                                tagQueryType: 'hasAny',
                                tags: ['Skill/Character/Common/SpellInflict/FireInflict'],
                              },
                              sequence(
                                step('mergeContextTargets', {
                                  saveToContextKey: 'fire_inflicted',
                                  sources: [{ kind: 'target', target: 'enemy' }],
                                }),
                              ),
                              sequence(
                                step('mergeContextTargets', {
                                  saveToContextKey: 'fire_inflicted',
                                  sources: [],
                                }),
                              ),
                            ),
                            step('modifyActionValue', {
                              key: 'distance',
                              operation: 'assign',
                              value: { kind: 'constant', value: 0 },
                            }),
                            forEachContextTarget(
                              'fire_inflicted',
                              sequence(
                                step('readBuffStackCount', {
                                  target: 'enemy',
                                  outputKey: 'count',
                                  query: {
                                    kind: 'tag',
                                    tagQueryType: 'hasAny',
                                    buffTags: ['Skill/Character/Common/SpellInflict/FireInflict'],
                                  },
                                }),
                                {
                                  kind: 'switch',
                                  parameters: {
                                    choice: { kind: 'blackboard', key: 'count' },
                                    alwaysNext: true,
                                  },
                                  options: [
                                    {
                                      value: { kind: 'constant', value: 1 },
                                      sequence: sequence(
                                        branch(
                                          {
                                            kind: 'buffIdStackCompare',
                                            target: 'caster',
                                            buffIds: ['buff_chr_0016_laevat_energy'],
                                            operator: 'less',
                                            value: { kind: 'blackboard', key: 'max_stack' },
                                          },
                                          sequence(
                                            step('finishBuffsByTag', {
                                              target: 'enemy',
                                              tagQueryType: 'hasAny',
                                              buffTags: [
                                                'Skill/Character/Common/SpellInflict/FireInflict',
                                              ],
                                              reason: 'absorbed',
                                            }),
                                            step('applyBuff', {
                                              buffId: 'buff_chr_0016_laevat_energy',
                                              target: 'buffSource',
                                              source: 'buffSource',
                                              inheritSourceSkillCastInfo: true,
                                            }),
                                            {
                                              kind: 'launchProjectile',
                                              parameters: {
                                                finish: 'firstTickReach',
                                                recycleDelaySeconds: 5,
                                              },
                                              callbacks: [],
                                            },
                                          ),
                                        ),
                                      ),
                                    },
                                    {
                                      value: { kind: 'constant', value: 2 },
                                      sequence: sequence(
                                        branch(
                                          {
                                            kind: 'buffIdStackCompare',
                                            target: 'caster',
                                            buffIds: ['buff_chr_0016_laevat_energy'],
                                            operator: 'less',
                                            value: { kind: 'blackboard', key: 'max_stack' },
                                          },
                                          sequence(
                                            step('finishBuffsByTag', {
                                              target: 'enemy',
                                              tagQueryType: 'hasAny',
                                              buffTags: [
                                                'Skill/Character/Common/SpellInflict/FireInflict',
                                              ],
                                              reason: 'absorbed',
                                              count: { kind: 'constant', value: 1 },
                                            }),
                                            step('applyBuff', {
                                              buffId: 'buff_chr_0016_laevat_energy',
                                              target: 'buffSource',
                                              source: 'buffSource',
                                              inheritSourceSkillCastInfo: true,
                                            }),
                                            {
                                              kind: 'launchProjectile',
                                              parameters: {
                                                finish: 'firstTickReach',
                                                recycleDelaySeconds: 5,
                                              },
                                              callbacks: [],
                                            },
                                            branch(
                                              {
                                                kind: 'buffIdStackCompare',
                                                target: 'caster',
                                                buffIds: ['buff_chr_0016_laevat_energy'],
                                                operator: 'less',
                                                value: { kind: 'blackboard', key: 'max_stack' },
                                              },
                                              sequence(
                                                step('finishBuffsByTag', {
                                                  target: 'enemy',
                                                  tagQueryType: 'hasAny',
                                                  buffTags: [
                                                    'Skill/Character/Common/SpellInflict/FireInflict',
                                                  ],
                                                  reason: 'absorbed',
                                                  count: { kind: 'constant', value: 1 },
                                                }),
                                                step('applyBuff', {
                                                  buffId: 'buff_chr_0016_laevat_energy',
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
                                    {
                                      value: { kind: 'constant', value: 3 },
                                      sequence: sequence(
                                        branch(
                                          {
                                            kind: 'buffIdStackCompare',
                                            target: 'caster',
                                            buffIds: ['buff_chr_0016_laevat_energy'],
                                            operator: 'less',
                                            value: { kind: 'blackboard', key: 'max_stack' },
                                          },
                                          sequence(
                                            step('finishBuffsByTag', {
                                              target: 'enemy',
                                              tagQueryType: 'hasAny',
                                              buffTags: [
                                                'Skill/Character/Common/SpellInflict/FireInflict',
                                              ],
                                              reason: 'absorbed',
                                              count: { kind: 'constant', value: 1 },
                                            }),
                                            step('applyBuff', {
                                              buffId: 'buff_chr_0016_laevat_energy',
                                              target: 'buffSource',
                                              source: 'buffSource',
                                              inheritSourceSkillCastInfo: true,
                                            }),
                                            {
                                              kind: 'launchProjectile',
                                              parameters: {
                                                finish: 'firstTickReach',
                                                recycleDelaySeconds: 5,
                                              },
                                              callbacks: [],
                                            },
                                            branch(
                                              {
                                                kind: 'buffIdStackCompare',
                                                target: 'caster',
                                                buffIds: ['buff_chr_0016_laevat_energy'],
                                                operator: 'less',
                                                value: { kind: 'blackboard', key: 'max_stack' },
                                              },
                                              sequence(
                                                step('finishBuffsByTag', {
                                                  target: 'enemy',
                                                  tagQueryType: 'hasAny',
                                                  buffTags: [
                                                    'Skill/Character/Common/SpellInflict/FireInflict',
                                                  ],
                                                  reason: 'absorbed',
                                                  count: { kind: 'constant', value: 1 },
                                                }),
                                                step('applyBuff', {
                                                  buffId: 'buff_chr_0016_laevat_energy',
                                                  target: 'buffSource',
                                                  source: 'buffSource',
                                                  inheritSourceSkillCastInfo: true,
                                                }),
                                                branch(
                                                  {
                                                    kind: 'buffIdStackCompare',
                                                    target: 'caster',
                                                    buffIds: ['buff_chr_0016_laevat_energy'],
                                                    operator: 'less',
                                                    value: { kind: 'blackboard', key: 'max_stack' },
                                                  },
                                                  sequence(
                                                    step('finishBuffsByTag', {
                                                      target: 'enemy',
                                                      tagQueryType: 'hasAny',
                                                      buffTags: [
                                                        'Skill/Character/Common/SpellInflict/FireInflict',
                                                      ],
                                                      reason: 'absorbed',
                                                      count: { kind: 'constant', value: 1 },
                                                    }),
                                                    step('applyBuff', {
                                                      buffId: 'buff_chr_0016_laevat_energy',
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
                                    },
                                    {
                                      value: { kind: 'constant', value: 4 },
                                      sequence: sequence(
                                        branch(
                                          {
                                            kind: 'buffIdStackCompare',
                                            target: 'caster',
                                            buffIds: ['buff_chr_0016_laevat_energy'],
                                            operator: 'less',
                                            value: { kind: 'blackboard', key: 'max_stack' },
                                          },
                                          sequence(
                                            step('finishBuffsByTag', {
                                              target: 'enemy',
                                              tagQueryType: 'hasAny',
                                              buffTags: [
                                                'Skill/Character/Common/SpellInflict/FireInflict',
                                              ],
                                              reason: 'absorbed',
                                              count: { kind: 'constant', value: 1 },
                                            }),
                                            step('applyBuff', {
                                              buffId: 'buff_chr_0016_laevat_energy',
                                              target: 'buffSource',
                                              source: 'buffSource',
                                              inheritSourceSkillCastInfo: true,
                                            }),
                                            {
                                              kind: 'launchProjectile',
                                              parameters: {
                                                finish: 'firstTickReach',
                                                recycleDelaySeconds: 5,
                                              },
                                              callbacks: [],
                                            },
                                            branch(
                                              {
                                                kind: 'buffIdStackCompare',
                                                target: 'caster',
                                                buffIds: ['buff_chr_0016_laevat_energy'],
                                                operator: 'less',
                                                value: { kind: 'blackboard', key: 'max_stack' },
                                              },
                                              sequence(
                                                step('finishBuffsByTag', {
                                                  target: 'enemy',
                                                  tagQueryType: 'hasAny',
                                                  buffTags: [
                                                    'Skill/Character/Common/SpellInflict/FireInflict',
                                                  ],
                                                  reason: 'absorbed',
                                                  count: { kind: 'constant', value: 1 },
                                                }),
                                                step('applyBuff', {
                                                  buffId: 'buff_chr_0016_laevat_energy',
                                                  target: 'buffSource',
                                                  source: 'buffSource',
                                                  inheritSourceSkillCastInfo: true,
                                                }),
                                                branch(
                                                  {
                                                    kind: 'buffIdStackCompare',
                                                    target: 'caster',
                                                    buffIds: ['buff_chr_0016_laevat_energy'],
                                                    operator: 'less',
                                                    value: { kind: 'blackboard', key: 'max_stack' },
                                                  },
                                                  sequence(
                                                    step('finishBuffsByTag', {
                                                      target: 'enemy',
                                                      tagQueryType: 'hasAny',
                                                      buffTags: [
                                                        'Skill/Character/Common/SpellInflict/FireInflict',
                                                      ],
                                                      reason: 'absorbed',
                                                      count: { kind: 'constant', value: 1 },
                                                    }),
                                                    step('applyBuff', {
                                                      buffId: 'buff_chr_0016_laevat_energy',
                                                      target: 'buffSource',
                                                      source: 'buffSource',
                                                      inheritSourceSkillCastInfo: true,
                                                    }),
                                                    branch(
                                                      {
                                                        kind: 'buffIdStackCompare',
                                                        target: 'caster',
                                                        buffIds: ['buff_chr_0016_laevat_energy'],
                                                        operator: 'less',
                                                        value: {
                                                          kind: 'blackboard',
                                                          key: 'max_stack',
                                                        },
                                                      },
                                                      sequence(
                                                        step('finishBuffsByTag', {
                                                          target: 'enemy',
                                                          tagQueryType: 'hasAny',
                                                          buffTags: [
                                                            'Skill/Character/Common/SpellInflict/FireInflict',
                                                          ],
                                                          reason: 'absorbed',
                                                          count: { kind: 'constant', value: 1 },
                                                        }),
                                                        step('applyBuff', {
                                                          buffId: 'buff_chr_0016_laevat_energy',
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
                                    },
                                  ],
                                },
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
      ],
    },
    buff_chr_0016_laevat_passive_teammate_cd: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0016_laevat_pause_ult: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0016_laevat_potential_5: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { curr_duration: 0, extend_duration: 0, max_duration: 0 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'finishedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0016_laevat_ring_start_asset'] },
              sequence(
                step('modifyActionValue', {
                  key: 'curr_duration',
                  operation: 'assign',
                  value: { kind: 'constant', value: 0 },
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0016_laevat_ring_start_asset: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('changePlayerActionMode', { modeId: 'ult', lifetime: 'finishByAction' }),
        ),
        finish: sequence(
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0016_laevat_wpn_vfx'],
            reason: 'other',
          }),
        ),
      },
      skillSlotReplacements: [
        {
          skillGroupKey: 'battleSkill',
          targetSkillKey: 'chr_0016_laevat_normal_skill_during_ult',
          revertedSkillKey: 'chr_0016_laevat_normal_skill',
          inheritOriginSkillCooldownProgress: false,
        },
      ],
    },
    buff_chr_0016_laevat_show_weapon: {
      stackingType: 'extend',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: 15,
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
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
        orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
      },
      applyTags: ['Status/DisableBreakingAttack'],
      extendTags: [],
      blackboard: { duration: 16 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0016_laevat_ring_start_asset',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          }),
          step('applyBuff', {
            buffId: 'buff_chr_0016_laevat_ult_end',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        enable: sequence(
          step('restrictUltimateEnergyRecovery', {
            target: 'caster',
            allowedRecoveryTags: [],
            clearUltimateEnergyOnEnd: false,
          }),
        ),
        finish: sequence(
          step('adjustSkillCooldown', {
            target: 'caster',
            skill: { kind: 'type', skillType: 'ultimate' },
            operation: 'set',
            basis: 'absoluteSeconds',
            value: { kind: 'constant', value: 10 },
          }),
        ),
      },
      abilityEventResponses: [
        {
          event: 'addedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0016_laevat_pause_ult'] },
              sequence(step('setCurrentBuffTimePaused', { paused: true })),
            ),
          ),
        },
        {
          event: 'finishedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0016_laevat_pause_ult'] },
              sequence(step('setCurrentBuffTimePaused', { paused: false })),
            ),
          ),
        },
      ],
    },
    buff_chr_0016_laevat_talent_2_0: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {
        cd: 0,
        duration: 0,
        heal_max_hp: 0,
        hp_threshold: 0,
        shelter: 0,
        shelter_real: 0,
      },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'takeDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'healthCompare',
                target: 'caster',
                valueType: 'ratio',
                operator: 'less',
                value: { kind: 'blackboard', key: 'hp_threshold' },
              },
              sequence(
                branch(
                  {
                    kind: 'not',
                    condition: {
                      kind: 'globalCooldownPresent',
                      target: 'caster',
                      markerId: 'buff_chr_0016_laevat_talent_2_0',
                    },
                  },
                  sequence(
                    step('setGlobalCooldown', {
                      target: 'caster',
                      markerId: 'buff_chr_0016_laevat_talent_2_0',
                      durationSeconds: { kind: 'blackboard', key: 'cd' },
                    }),
                    step('applyBuff', {
                      buffId: 'buff_chr_0016_laevat_talent_2_1',
                      target: 'buffOwner',
                      source: 'buffSource',
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        heal_max_hp: 'heal_max_hp',
                        duration: 'duration',
                        shelter: 'shelter_real',
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
    buff_chr_0016_laevat_talent_2_1: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 5,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: 1,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0, heal_max_hp: 0, shelter: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_shelter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              rate: { kind: 'blackboard', key: 'shelter' },
            },
          }),
        ),
        trigger: sequence(
          step('heal', {
            target: 'buffOwner',
            alwaysNext: true,
            tags: [],
            attribute: 'maxHealth',
            multiplier: { kind: 'blackboard', key: 'heal_max_hp' },
            addition: { kind: 'constant', value: 0 },
          }),
        ),
      },
    },
    buff_chr_0016_laevat_ult_end: {
      stackingType: 'extend',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_atk_up',
        iconPath: '/icons/icon_battle_buff_atk_up.webp',
        showInHeadBarCommon: false,
        showInHeadBarAttached: false,
        showInSquadIcon: false,
        onlyShowForMainCharacter: false,
        blinkInMainCharHpBar: false,
        showProgressInHpBar: true,
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
      blackboard: { duration: 15 },
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: [
              'buff_chr_0016_laevat_ring_start_asset',
              'buff_chr_0016_laevat_ultimate_sfx_loop',
            ],
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
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0016_laevat_pause_ult'] },
              sequence(step('setCurrentBuffTimePaused', { paused: true })),
            ),
          ),
        },
        {
          event: 'finishedBuff',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_chr_0016_laevat_pause_ult'] },
              sequence(step('setCurrentBuffTimePaused', { paused: false })),
            ),
          ),
        },
      ],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0016_laevat_normal_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 5 },
      childSkill: {
        skillId: 'chr_0016_laevat_normal_skill_abilityentity',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 100,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: { atk_scale: 3, atk_scale_2: 0, atk_scale_3: 0, hit_count: 0, poise: 0 },
        scheduledSequences: [
          scheduled(
            18,
            sequence(
              forEachTarget(
                'enemy',
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'blackboard', key: 'poise' },
                    },
                    'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/scheduledSequences/0/sequence/steps/0/body/steps/0',
                  ),
                ),
              ),
              step('applyBuff', {
                buffId: 'buff_chr_0016_laevat_energy',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
              }),
              step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
              step('modifyActionValue', {
                key: 'hit_count',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            18,
          ),
          scheduled(
            25,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalSkill'],
                },
                'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/scheduledSequences/1/sequence/steps/0',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hit_count', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0016_laevat_energy',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                  step('applyBuff', {
                    buffId: 'buff_common_obtain_ultimate_sp',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            25,
          ),
          scheduled(
            29,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalSkill'],
                },
                'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/scheduledSequences/2/sequence/steps/0',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hit_count', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0016_laevat_energy',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                  step('applyBuff', {
                    buffId: 'buff_common_obtain_ultimate_sp',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            29,
          ),
          scheduled(
            33,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalSkill'],
                },
                'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/scheduledSequences/3/sequence/steps/0',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hit_count', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0016_laevat_energy',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                  step('applyBuff', {
                    buffId: 'buff_common_obtain_ultimate_sp',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            33,
          ),
          scheduled(
            37,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalSkill'],
                },
                'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/scheduledSequences/4/sequence/steps/0',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hit_count', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0016_laevat_energy',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                  step('applyBuff', {
                    buffId: 'buff_common_obtain_ultimate_sp',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            37,
          ),
          scheduled(
            41,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalSkill'],
                },
                'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/scheduledSequences/5/sequence/steps/0',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hit_count', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0016_laevat_energy',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                  step('applyBuff', {
                    buffId: 'buff_common_obtain_ultimate_sp',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            41,
          ),
          scheduled(
            45,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalSkill'],
                },
                'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/scheduledSequences/6/sequence/steps/0',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hit_count', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0016_laevat_energy',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                  step('applyBuff', {
                    buffId: 'buff_common_obtain_ultimate_sp',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            45,
          ),
          scheduled(
            50,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalSkill'],
                },
                'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/scheduledSequences/7/sequence/steps/0',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hit_count', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0016_laevat_energy',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                  step('applyBuff', {
                    buffId: 'buff_common_obtain_ultimate_sp',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            50,
          ),
          scheduled(
            54,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalSkill'],
                },
                'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/scheduledSequences/8/sequence/steps/0',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hit_count', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0016_laevat_energy',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                  step('applyBuff', {
                    buffId: 'buff_common_obtain_ultimate_sp',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            54,
          ),
          scheduled(
            58,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalSkill'],
                },
                'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/scheduledSequences/9/sequence/steps/0',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hit_count', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0016_laevat_energy',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                  step('applyBuff', {
                    buffId: 'buff_common_obtain_ultimate_sp',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            58,
          ),
          scheduled(
            62,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
                  tags: ['normalSkill'],
                },
                'abilityentity_chr_0016_laevat_normal_skill:chr_0016_laevat_normal_skill_abilityentity:/childSkill/scheduledSequences/10/sequence/steps/0',
              ),
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'hit_count', fallback: 0 },
                  operator: 'equal',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'hit_count',
                    operation: 'add',
                    value: { kind: 'constant', value: 1 },
                  }),
                  step('applyBuff', {
                    buffId: 'buff_chr_0016_laevat_energy',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                  step('applyBuff', {
                    buffId: 'buff_common_obtain_ultimate_sp',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
              ),
            ),
            62,
          ),
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default laevatain;
