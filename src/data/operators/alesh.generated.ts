/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type { OperatorDefinition, SkillDefinition } from '../../core/game-data/operatorDefinition';
import {
  branch,
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withSkillBlackboard,
} from './definitionHelpers';

export const aleshChr_0024_deepfin_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0024_deepfin_attack1',
    timelineBlockFrames: 12,
    naturalDurationFrames: 130,
    exclusiveFrame: 25,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 7,
          endFrame: 25,
          input: 'basicAttack',
          targetSkillId: 'chr_0024_deepfin_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 12, endFrame: 25, skillIds: ['chr_0024_deepfin_attack2'] }],
    },
    costFrame: 9,
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
            'chr_0024_deepfin_attack1:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.06 },
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
        8,
      ),
      scheduled(
        12,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0024_deepfin_attack2'] })),
        25,
      ),
    ],
    timelineContinuationSkillId: 'chr_0024_deepfin_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.18, 0.19, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39] },
);

export const aleshChr_0024_deepfin_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0024_deepfin_attack2',
    timelineBlockFrames: 10,
    naturalDurationFrames: 128,
    exclusiveFrame: 25,
    offsetRecordFrame: 5,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 6,
          endFrame: 25,
          input: 'basicAttack',
          targetSkillId: 'chr_0024_deepfin_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 10, endFrame: 25, skillIds: ['chr_0024_deepfin_attack3'] }],
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
            'chr_0024_deepfin_attack2:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.03 },
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
        5,
        sequence(
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
        8,
      ),
      scheduled(
        10,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0024_deepfin_attack3'] })),
        25,
      ),
    ],
    timelineContinuationSkillId: 'chr_0024_deepfin_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23] },
);

export const aleshChr_0024_deepfin_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0024_deepfin_attack3',
    timelineBlockFrames: 16,
    naturalDurationFrames: 145,
    exclusiveFrame: 29,
    offsetRecordFrame: 13,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 13,
          endFrame: 31,
          input: 'basicAttack',
          targetSkillId: 'chr_0024_deepfin_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 16, endFrame: 31, skillIds: ['chr_0024_deepfin_attack4'] }],
    },
    costFrame: 12,
    scheduledSequences: [
      scheduled(
        13,
        sequence(
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
        14,
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
            },
            'chr_0024_deepfin_attack3:/scheduledSequences/1/sequence/steps/0',
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
        14,
      ),
      scheduled(
        16,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0024_deepfin_attack4'] })),
        31,
      ),
    ],
    timelineContinuationSkillId: 'chr_0024_deepfin_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62] },
);

export const aleshChr_0024_deepfin_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0024_deepfin_attack4',
    timelineBlockFrames: 22,
    naturalDurationFrames: 90,
    exclusiveFrame: 30,
    offsetRecordFrame: 15,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 15,
          endFrame: 33,
          input: 'basicAttack',
          targetSkillId: 'chr_0024_deepfin_attack5',
        },
      ],
      allowedNextSkills: [{ startFrame: 22, endFrame: 33, skillIds: ['chr_0024_deepfin_attack5'] }],
    },
    costFrame: 8,
    scheduledSequences: [
      scheduled(
        15,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0024_deepfin_attack4:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.12 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_hard_stop' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
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
        16,
      ),
      scheduled(
        22,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0024_deepfin_attack5'] })),
        33,
      ),
    ],
    timelineContinuationSkillId: 'chr_0024_deepfin_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62] },
);

export const aleshChr_0024_deepfin_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0024_deepfin_attack5',
    timelineBlockFrames: 31,
    naturalDurationFrames: 104,
    exclusiveFrame: 40,
    offsetRecordFrame: 18,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 14,
          endFrame: 40,
          input: 'basicAttack',
          targetSkillId: 'chr_0024_deepfin_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 31, endFrame: 40, skillIds: ['chr_0024_deepfin_attack1'] }],
    },
    costFrame: 12,
    scheduledSequences: [
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
            'chr_0024_deepfin_attack5:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.2 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_hard_zero' },
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
        19,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
              stagger: { kind: 'constant', value: 0 },
              staggerOnlyWhenCasterControlled: true,
            },
            'chr_0024_deepfin_attack5:/scheduledSequences/1/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.2 },
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
        20,
      ),
      scheduled(
        31,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0024_deepfin_attack1'] })),
        40,
      ),
    ],
    timelineContinuationSkillId: 'chr_0024_deepfin_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 19,
    atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62],
    poise: 17,
    atk_scale_display: [0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24],
  },
);

export const aleshChr_0024_deepfin_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0024_deepfin_power_attack',
    timelineBlockFrames: 47,
    naturalDurationFrames: 113,
    exclusiveFrame: 75,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 47,
          endFrame: 75,
          skillIds: ['chr_0024_deepfin_normal_skill', 'chr_0024_deepfin_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        13,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale1' },
              calculation: 'breakingAttack',
              calculationMultiplier: 1,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0024_deepfin_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.2 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_hard_zero' },
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
        15,
      ),
      scheduled(
        47,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale2' },
              calculation: 'breakingAttack',
              calculationMultiplier: 1,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0024_deepfin_power_attack:/scheduledSequences/1/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(step('gainFinisherSp', { factor: 1, recipient: 'team' })),
            undefined,
            { alwaysNext: true },
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.3 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        49,
      ),
      scheduled(
        13,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.12 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_hard_stop' },
                finishByAction: false,
                targets: ['caster'],
              }),
            ),
          ),
        ),
        15,
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
        75,
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
        47,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  {
    atk_scale1: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    atk_scale2: [3.2, 3.52, 3.84, 4.16, 4.48, 4.8, 5.12, 5.44, 5.76, 6.16, 6.64, 7.2],
  },
);

export const aleshChr_0024_deepfin_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0024_deepfin_plunging_attack_end',
    timelineBlockFrames: 21,
    naturalDurationFrames: 92,
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
            'chr_0024_deepfin_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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

export const aleshChr_0024_deepfin_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0024_deepfin_normal_skill',
    timelineBlockFrames: 51,
    naturalDurationFrames: 126,
    exclusiveFrame: 50,
    offsetRecordFrame: 0,
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
        27,
        sequence(
          repeatEachTick(
            sequence(
              step('readBuffStackCount', {
                target: 'enemy',
                outputKey: 'num_1',
                query: {
                  kind: 'tag',
                  tagQueryType: 'hasAny',
                  buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
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
        28,
      ),
      scheduled(
        27,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('calculateActionValue', {
                key: 'atb_1',
                operation: 'add',
                left: { kind: 'blackboard', key: 'atb_1' },
                right: { kind: 'blackboard', key: 'potential_1_atb' },
              }),
              step('calculateActionValue', {
                key: 'atb_2',
                operation: 'add',
                left: { kind: 'blackboard', key: 'atb_2' },
                right: { kind: 'blackboard', key: 'potential_1_atb' },
              }),
              step('calculateActionValue', {
                key: 'atb_3',
                operation: 'add',
                left: { kind: 'blackboard', key: 'atb_3' },
                right: { kind: 'blackboard', key: 'potential_1_atb' },
              }),
              step('calculateActionValue', {
                key: 'atb_4',
                operation: 'add',
                left: { kind: 'blackboard', key: 'atb_4' },
                right: { kind: 'blackboard', key: 'potential_1_atb' },
              }),
              {
                kind: 'switch',
                parameters: { choice: { kind: 'blackboard', key: 'num' }, alwaysNext: true },
                options: [
                  {
                    value: { kind: 'constant', value: 1 },
                    sequence: sequence(
                      step('changeResourceByActionValue', {
                        resource: 'sp',
                        amount: { kind: 'blackboard', key: 'atb_1' },
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
                        amount: { kind: 'blackboard', key: 'atb_2' },
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
                        amount: { kind: 'blackboard', key: 'atb_3' },
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
                        amount: { kind: 'blackboard', key: 'atb_4' },
                        coefficient: { kind: 'constant', value: 1 },
                        recipient: 'team',
                        spGainKind: 'gain',
                        spGainSource: 'skill',
                      }),
                    ),
                  },
                ],
              },
            ),
            sequence({
              kind: 'switch',
              parameters: { choice: { kind: 'blackboard', key: 'num' }, alwaysNext: true },
              options: [
                {
                  value: { kind: 'constant', value: 1 },
                  sequence: sequence(
                    step('changeResourceByActionValue', {
                      resource: 'sp',
                      amount: { kind: 'blackboard', key: 'atb_1' },
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
                      amount: { kind: 'blackboard', key: 'atb_2' },
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
                      amount: { kind: 'blackboard', key: 'atb_3' },
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
                      amount: { kind: 'blackboard', key: 'atb_4' },
                      coefficient: { kind: 'constant', value: 1 },
                      recipient: 'team',
                      spGainKind: 'gain',
                      spGainSource: 'skill',
                    }),
                  ),
                },
              ],
            }),
            { alwaysNext: true },
          ),
        ),
        28,
      ),
      scheduled(
        27,
        sequence(
          repeatEachTick(
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
                'chr_0024_deepfin_normal_skill:/scheduledSequences/3/sequence/steps/0/body/steps/0',
              ),
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.3 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_hard_stop' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
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
        28,
      ),
      scheduled(27, sequence(step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 })), 28),
      scheduled(
        27,
        sequence(
          repeatEachTick(
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
                  step('readBuffStackCount', {
                    target: 'enemy',
                    outputKey: 'count',
                    query: {
                      kind: 'tag',
                      tagQueryType: 'hasAny',
                      buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
                    },
                  }),
                  branch(
                    {
                      kind: 'buffStackCompare',
                      target: 'enemy',
                      tagQueryType: 'hasAny',
                      buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
                      operator: 'greaterOrEqual',
                      value: { kind: 'blackboard', key: 'count' },
                    },
                    sequence(
                      step('finishBuffsByTag', {
                        target: 'enemy',
                        tagQueryType: 'hasAny',
                        buffTags: ['Skill/Character/Common/SpellInflict/CrystInflict'],
                        reason: 'early',
                        count: { kind: 'blackboard', key: 'count' },
                      }),
                      step('applyBuff', {
                        buffId: 'buff_common_cryst_cryst_frozen_triggered',
                        target: 'enemy',
                        inheritSourceSkillCastInfo: true,
                        blackboardAssignments: {
                          consumed_type: { kind: 'constant', value: 2 },
                          consumed_layer: { kind: 'blackboard', key: 'count' },
                          count: { kind: 'blackboard', key: 'count' },
                        },
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
        28,
      ),
    ],
    smartTarget: 'enemy',
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb_1: [10, 10, 10, 10, 10, 10, 10, 10, 10, 15, 15, 15],
    atb_2: [20, 20, 20, 20, 20, 20, 20, 20, 20, 25, 25, 25],
    atb_3: [30, 30, 30, 30, 30, 30, 30, 30, 30, 35, 35, 35],
    atb_4: [40, 40, 40, 40, 40, 40, 40, 40, 40, 45, 45, 45],
    atk_scale: [2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.85, 4.15, 4.5],
    count: 0,
    num: 0,
    num_1: 0,
    poise: 10,
    potential_1: 0,
    potential_1_atb: 0,
  },
);

export const aleshChr_0024_deepfin_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0024_deepfin_combo_skill',
    timelineBlockFrames: 39,
    naturalDurationFrames: 213,
    exclusiveFrame: 130,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 39, endFrame: 65, skillIds: ['chr_0024_deepfin_normal_skill'] },
        { startFrame: 94, endFrame: 120, skillIds: ['chr_0024_deepfin_normal_skill'] },
        { startFrame: 120, endFrame: 130, skillIds: ['chr_0024_deepfin_normal_skill'] },
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
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0024_deepfin_combo_camera',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
          }),
        ),
        23,
      ),
      scheduled(
        38,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0024_deepfin_combo_skill:/scheduledSequences/2/sequence/steps/0',
          ),
        ),
        41,
      ),
      scheduled(
        93,
        sequence(
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atb_sp' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'default',
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale_2ex' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0024_deepfin_combo_skill:/scheduledSequences/3/sequence/steps/1',
          ),
        ),
        96,
      ),
      scheduled(
        38,
        sequence(
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'usp_normal' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          }),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.95 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'deepfin_combo2' },
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
                curve: { kind: 'named', key: 'deepfin_combo2' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        43,
      ),
      scheduled(
        93,
        sequence(
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'usp_normal' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          }),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.95 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'deepfin_combo2' },
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
                curve: { kind: 'named', key: 'deepfin_combo2' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        98,
      ),
      scheduled(
        22,
        sequence(
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atb' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
              tags: ['comboSkill'],
            },
            'chr_0024_deepfin_combo_skill:/scheduledSequences/6/sequence/steps/1',
          ),
        ),
        24,
      ),
      scheduled(64, sequence(step('jumpTimeline', { destinationFrame: 120 })), 66),
      scheduled(
        77,
        sequence(
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atb' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale_1ex' },
              tags: ['comboSkill'],
            },
            'chr_0024_deepfin_combo_skill:/scheduledSequences/8/sequence/steps/1',
          ),
        ),
        79,
      ),
      scheduled(
        10,
        sequence(
          step('calculateActionValue', {
            key: 'prob_max',
            operation: 'add',
            left: { kind: 'blackboard', key: 'prob' },
            right: { kind: 'blackboard', key: 'prob_max' },
          }),
          step('calculateActionValue', {
            key: 'prob_add',
            operation: 'divide',
            left: { kind: 'blackboard', key: 'prob_add' },
            right: { kind: 'blackboard', key: 'rate' },
          }),
          step('storeSourceAttributeValue', {
            attribute: { kind: 'secondary' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'blackboard', key: 'prob_add' },
            base: { kind: 'blackboard', key: 'prob' },
            targetKey: 'prob',
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'prob', fallback: 0 },
              operator: 'lessOrEqual',
              right: { kind: 'blackboard', key: 'prob_max', fallback: 0 },
            },
            sequence(
              branch(
                { kind: 'probability', probability: { kind: 'blackboard', key: 'prob' } },
                sequence(step('jumpTimeline', { destinationFrame: 65 })),
              ),
            ),
            sequence(
              branch(
                { kind: 'probability', probability: { kind: 'blackboard', key: 'prob_max' } },
                sequence(step('jumpTimeline', { destinationFrame: 65 })),
              ),
            ),
            { alwaysNext: true },
          ),
        ),
        11,
      ),
      scheduled(
        93,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential_3', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0024_deepfin_potential_3',
                target: 'party',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: { atk_up: 'atk_up', duration: 'Duration' },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        96,
      ),
    ],
    smartTarget: 'trigger',
    cooldownFrames: [270, 270, 270, 270, 270, 270, 270, 270, 270, 270, 270, 240],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atb: [10, 10, 10, 10, 10, 12, 12, 12, 12, 13, 13, 15],
    atb_sp: 10,
    atk_scale_1: [0.33, 0.37, 0.4, 0.43, 0.47, 0.5, 0.53, 0.57, 0.6, 0.64, 0.69, 0.75],
    atk_scale_1ex: [0.53, 0.59, 0.64, 0.69, 0.75, 0.8, 0.85, 0.91, 0.96, 1.03, 1.11, 1.2],
    atk_scale_2: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.93, 2.08, 2.25],
    atk_scale_2ex: [1.6, 1.76, 1.92, 2.08, 2.24, 2.4, 2.56, 2.72, 2.88, 3.08, 3.32, 3.6],
    atk_up: 0.15,
    Duration: 10,
    poise: 10,
    potential_3: 0,
    prob: 0.1,
    prob_add: 0,
    prob_max: 0,
    rate: 10,
    usp_normal: 10,
  },
);

export const aleshChr_0024_deepfin_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0024_deepfin_ultimate_skill',
    timelineBlockFrames: 96,
    naturalDurationFrames: 180,
    exclusiveFrame: 110,
    offsetRecordFrame: 0,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 87,
          endFrame: 113,
          input: 'basicAttack',
          targetSkillId: 'chr_0024_deepfin_attack1',
        },
      ],
      allowedNextSkills: [
        {
          startFrame: 96,
          endFrame: 113,
          skillIds: [
            'chr_0024_deepfin_attack1',
            'chr_0024_deepfin_normal_skill',
            'chr_0024_deepfin_combo_skill',
          ],
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
        90,
        sequence(
          step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
          repeatEachTick(
            sequence(
              branch(
                {
                  kind: 'all',
                  conditions: [
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'potential_5', fallback: 0 },
                      operator: 'greaterOrEqual',
                      right: { kind: 'constant', value: 1 },
                    },
                    {
                      kind: 'healthCompare',
                      target: 'enemy',
                      valueType: 'ratio',
                      operator: 'lessOrEqual',
                      value: { kind: 'blackboard', key: 'hp_tar' },
                    },
                  ],
                },
                sequence(
                  step('calculateActionValue', {
                    key: 'atk_scale',
                    operation: 'multiply',
                    left: { kind: 'blackboard', key: 'atk_scale' },
                    right: { kind: 'blackboard', key: 'atk_up' },
                  }),
                  step(
                    'dealDamage',
                    {
                      damageType: 'cryo',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['ultimateSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'blackboard', key: 'poise' },
                    },
                    'chr_0024_deepfin_ultimate_skill:/scheduledSequences/1/sequence/steps/1/body/steps/0/whenTrue/steps/1',
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
                      stagger: { kind: 'blackboard', key: 'poise' },
                    },
                    'chr_0024_deepfin_ultimate_skill:/scheduledSequences/1/sequence/steps/1/body/steps/0/whenFalse/steps/0',
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
        93,
      ),
      scheduled(
        91,
        sequence(
          step('modifyActionValue', {
            key: 'atb_up',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'kill_num' },
          }),
          step('modifyActionValue', {
            key: 'atb_up',
            operation: 'add',
            value: { kind: 'blackboard', key: 'atb' },
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'atb_up', fallback: 0 },
              operator: 'lessOrEqual',
              right: { kind: 'constant', value: 100 },
            },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb_up' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'team',
                spGainKind: 'gain',
                spGainSource: 'skill',
              }),
            ),
            sequence(
              step('changeResourceByActionValue', {
                resource: 'sp',
                amount: { kind: 'blackboard', key: 'atb_max' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'team',
                spGainKind: 'gain',
                spGainSource: 'skill',
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        94,
      ),
      scheduled(
        90,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.4 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'deepfin_ult' },
                finishByAction: false,
                targets: ['enemy', 'caster'],
              }),
            ),
          ),
        ),
        93,
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
        110,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 77),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        77,
      ),
    ],
    cooldownFrames: 600,
    costs: [{ resource: 'ultimateEnergy', value: 100 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atb: [20, 20, 20, 20, 20, 20, 20, 20, 20, 25, 25, 25],
    atb_max: 100,
    atb_up: [12, 12, 12, 12, 12, 12, 12, 12, 12, 15, 15, 15],
    atk_scale: [4.36, 4.79, 5.23, 5.66, 6.1, 6.53, 6.97, 7.41, 7.84, 8.39, 9.04, 9.8],
    atk_up: 1.5,
    hp_tar: 0.5,
    kill_num: 0,
    poise: 20,
    potential_5: 0,
  },
);

export const aleshCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const alesh: OperatorDefinition = {
  slug: 'alesh',
  gameId: 'ALESH',
  rarity: 5,
  weaponType: 'sword',
  element: 'cryo',
  role: 'vanguard',
  mainAttribute: 'strength',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [20, 49, 80, 111, 142, 158],
    agility: [9, 27, 47, 66, 86, 95],
    intellect: [13, 37, 62, 87, 113, 125],
    will: [10, 27, 45, 63, 81, 89],
    baseAttack: [30, 90, 152, 215, 277, 309],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        aleshChr_0024_deepfin_attack1,
        aleshChr_0024_deepfin_attack2,
        aleshChr_0024_deepfin_attack3,
        aleshChr_0024_deepfin_attack4,
        aleshChr_0024_deepfin_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: aleshChr_0024_deepfin_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: aleshChr_0024_deepfin_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: aleshChr_0024_deepfin_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: aleshChr_0024_deepfin_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: aleshChr_0024_deepfin_ultimate_skill,
    },
  ],
  dodgeSkill: aleshCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0024_deepfin_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0024_deepfin_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0024_deepfin_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0024_deepfin_attack1',
        'chr_0024_deepfin_attack2',
        'chr_0024_deepfin_attack3',
        'chr_0024_deepfin_attack4',
        'chr_0024_deepfin_attack5',
        'chr_0024_deepfin_plunging_attack_end',
        'chr_0024_deepfin_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0024_deepfin_attack1',
        'chr_0024_deepfin_attack2',
        'chr_0024_deepfin_attack3',
        'chr_0024_deepfin_attack4',
        'chr_0024_deepfin_attack5',
      ],
      defaultSkillKey: 'chr_0024_deepfin_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0024_deepfin_combo_skill',
      event: 'buffEndsEarly',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['enemy'] },
          sequence(
            branch(
              {
                kind: 'eventBuffTagsMatch',
                match: 'hasAny',
                buffTags: ['Skill/Character/Common/SpellStatus'],
              },
              sequence(),
            ),
          ),
        ),
      ),
    },
    {
      key: 'native-combo:1',
      skillKey: 'chr_0024_deepfin_combo_skill',
      event: 'buffEndsEarly',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          { kind: 'actionInputTargetObjectTypeMatch', objectTypes: ['enemy'] },
          sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_common_originum_frozen'] },
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
          buffId: 'buff_chr_0024_deepfin_talent_1_auro',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { usp: [3, 4], usp_self: [6, 8] },
        }),
      ),
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'prob_add',
          operation: 'assign',
          value: [0.002, 0.005],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'prob_max',
          operation: 'assign',
          value: [0.3, 0.3],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'rate',
          operation: 'assign',
          value: [10, 10],
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
          blackboardKey: 'potential_1',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_1_atb',
          operation: 'add',
          value: 10,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 15 },
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
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 0.15,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'Duration',
          operation: 'assign',
          value: 10,
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
          blackboardKey: 'potential_5',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'hp_tar',
          operation: 'assign',
          value: 0.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_up',
          operation: 'assign',
          value: 1.5,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0024_deepfin_combo_camera: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 2,
      durationSeconds: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { CD: 0, count: 0, owner_mainchar_alpha: 0, owner_mainchar_distance: 0, usp: 10 },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          0,
          sequence(
            step('startTimeDilation', {
              scope: 'global',
              durationSeconds: { kind: 'constant', value: 0.63 },
              slot: 'unassigned',
              priority: 30,
              curve: { kind: 'named', key: 'ComboSkill' },
              finishByAction: false,
              ignoredTargets: ['caster'],
              ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
              influenceSkillCooldownSeconds: { kind: 'constant', value: 0.3 },
            }),
          ),
          16,
        ),
      ],
    },
    buff_chr_0024_deepfin_potential_3: {
      stackingType: 'refresh',
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
        iconStyleInSquad: 'Default',
        abnormalColorType: 'Physical',
        orderPriority: { useDirectoryValue: false, value: 0, category: 'CommonCharBuff' },
      },
      applyTags: [],
      extendTags: [],
      blackboard: { atk_up: 0.15, duration: 0 },
      attributeModifiers: [
        { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
      ],
    },
    buff_chr_0024_deepfin_talent_1: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 2,
      applyTags: [],
      extendTags: [],
      blackboard: { CD: 0, count: 0, usp: 10 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'outputBuff',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'not',
                condition: { kind: 'timedMarkerPresent', target: 'caster', markerId: 'talent' },
              },
              sequence(
                branch(
                  { kind: 'eventBuffIdMatch', buffIds: ['buff_common_originum_frozen'] },
                  sequence(
                    step('changeResourceByActionValue', {
                      resource: 'ultimateEnergy',
                      amount: { kind: 'blackboard', key: 'usp' },
                      coefficient: { kind: 'constant', value: 1 },
                      recipient: 'caster',
                    }),
                    step('createTimedMarker', {
                      target: 'caster',
                      markerId: 'talent',
                      durationSeconds: { kind: 'blackboard', key: 'CD' },
                      autoFinishByAction: false,
                    }),
                  ),
                ),
              ),
            ),
          ),
        },
        {
          event: 'outputBuff',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'not',
                condition: { kind: 'timedMarkerPresent', target: 'caster', markerId: 'talent' },
              },
              sequence(
                branch(
                  {
                    kind: 'eventBuffTagsMatch',
                    match: 'hasAny',
                    buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
                  },
                  sequence(
                    step('changeResourceByActionValue', {
                      resource: 'ultimateEnergy',
                      amount: { kind: 'blackboard', key: 'usp' },
                      coefficient: { kind: 'constant', value: 1 },
                      recipient: 'caster',
                    }),
                    step('createTimedMarker', {
                      target: 'caster',
                      markerId: 'talent',
                      durationSeconds: { kind: 'blackboard', key: 'CD' },
                      autoFinishByAction: false,
                    }),
                  ),
                ),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0024_deepfin_talent_1_auro: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 2,
      applyTags: [],
      extendTags: [],
      blackboard: { CD: 3, count: 0, usp: 10, usp_final: 0, usp_self: 12 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0024_deepfin_talent_1',
            target: 'partyExceptCaster',
            finishByAction: true,
            blackboardAssignments: {
              usp: { kind: 'blackboard', key: 'usp' },
              CD: { kind: 'blackboard', key: 'CD' },
            },
          }),
        ),
      },
      abilityEventResponses: [
        {
          event: 'outputBuff',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'not',
                condition: { kind: 'timedMarkerPresent', target: 'caster', markerId: 'talent' },
              },
              sequence(
                branch(
                  {
                    kind: 'eventBuffTagsMatch',
                    match: 'hasAny',
                    buffTags: ['Skill/Character/Common/SpellStatus/Frozen'],
                  },
                  sequence(
                    step('calculateActionValue', {
                      key: 'usp_final',
                      operation: 'add',
                      left: { kind: 'blackboard', key: 'usp' },
                      right: { kind: 'blackboard', key: 'usp_self' },
                    }),
                    step('changeResourceByActionValue', {
                      resource: 'ultimateEnergy',
                      amount: { kind: 'blackboard', key: 'usp_final' },
                      coefficient: { kind: 'constant', value: 1 },
                      recipient: 'caster',
                    }),
                    step('createTimedMarker', {
                      target: 'caster',
                      markerId: 'talent',
                      durationSeconds: { kind: 'blackboard', key: 'CD' },
                      autoFinishByAction: false,
                    }),
                  ),
                ),
              ),
            ),
          ),
        },
      ],
    },
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default alesh;
