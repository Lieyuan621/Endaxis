/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type { OperatorDefinition, SkillDefinition } from '../../core/game-data/operatorDefinition';
import {
  branch,
  forEachTarget,
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withSkillBlackboard,
} from './definitionHelpers';

export const arclightChr_0007_ikut_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0007_ikut_attack1',
    timelineBlockFrames: 9,
    naturalDurationFrames: 64,
    exclusiveFrame: 21,
    offsetRecordFrame: 5,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 26,
          input: 'basicAttack',
          targetSkillId: 'chr_0007_ikut_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 9, endFrame: 26, skillIds: ['chr_0007_ikut_attack2'] }],
    },
    costFrame: 9,
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
            'chr_0007_ikut_attack1:/scheduledSequences/0/sequence/steps/0',
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
        9,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0007_ikut_attack2'] })),
        26,
      ),
    ],
    timelineContinuationSkillId: 'chr_0007_ikut_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23] },
);

export const arclightChr_0007_ikut_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0007_ikut_attack2',
    timelineBlockFrames: 10,
    naturalDurationFrames: 74,
    exclusiveFrame: 15,
    offsetRecordFrame: 5,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 26,
          input: 'basicAttack',
          targetSkillId: 'chr_0007_ikut_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 10, endFrame: 26, skillIds: ['chr_0007_ikut_attack3'] }],
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
            'chr_0007_ikut_attack2:/scheduledSequences/0/sequence/steps/0',
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
        10,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0007_ikut_attack3'] })),
        26,
      ),
    ],
    timelineContinuationSkillId: 'chr_0007_ikut_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.13, 0.14, 0.15, 0.16, 0.18, 0.19, 0.2, 0.21, 0.23, 0.24, 0.26, 0.28] },
);

export const arclightChr_0007_ikut_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0007_ikut_attack3',
    timelineBlockFrames: 20,
    naturalDurationFrames: 71,
    exclusiveFrame: 33,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 30,
          input: 'basicAttack',
          targetSkillId: 'chr_0007_ikut_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 20, endFrame: 30, skillIds: ['chr_0007_ikut_attack4'] }],
    },
    costFrame: 12,
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
            'chr_0007_ikut_attack3:/scheduledSequences/0/sequence/steps/0',
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
        8,
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
            'chr_0007_ikut_attack3:/scheduledSequences/1/sequence/steps/0',
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
        14,
      ),
      scheduled(
        20,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0007_ikut_attack4'] })),
        30,
      ),
    ],
    timelineContinuationSkillId: 'chr_0007_ikut_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.13, 0.14, 0.16, 0.17, 0.18, 0.2, 0.21, 0.22, 0.23, 0.25, 0.27, 0.29],
    display_atk_scale: [0.26, 0.29, 0.31, 0.34, 0.36, 0.39, 0.42, 0.44, 0.47, 0.5, 0.54, 0.59],
  },
);

export const arclightChr_0007_ikut_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0007_ikut_attack4',
    timelineBlockFrames: 27,
    naturalDurationFrames: 77,
    exclusiveFrame: 36,
    offsetRecordFrame: 5,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 40,
          input: 'basicAttack',
          targetSkillId: 'chr_0007_ikut_attack5',
        },
      ],
      allowedNextSkills: [{ startFrame: 27, endFrame: 40, skillIds: ['chr_0007_ikut_attack5'] }],
    },
    costFrame: 8,
    scheduledSequences: [
      scheduled(
        5,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalAttack'],
                },
                'chr_0007_ikut_attack4:/scheduledSequences/0/sequence/steps/0/body/steps/0',
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
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 3,
                targetTriggerIntervalSeconds: 0.033,
              },
            },
          ),
        ),
        20,
      ),
      scheduled(
        27,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0007_ikut_attack5'] })),
        40,
      ),
    ],
    timelineContinuationSkillId: 'chr_0007_ikut_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.12, 0.13, 0.14, 0.16, 0.17, 0.18, 0.19, 0.2, 0.22, 0.23, 0.25, 0.27],
    display_atk_scale: [0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81],
  },
);

export const arclightChr_0007_ikut_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0007_ikut_attack5',
    timelineBlockFrames: 27,
    naturalDurationFrames: 83,
    exclusiveFrame: 26,
    offsetRecordFrame: 12,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 40,
          input: 'basicAttack',
          targetSkillId: 'chr_0007_ikut_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 29, endFrame: 40, skillIds: ['chr_0007_ikut_attack1'] }],
    },
    costFrame: 12,
    scheduledSequences: [
      scheduled(
        12,
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
            'chr_0007_ikut_attack5:/scheduledSequences/0/sequence/steps/0',
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
        13,
      ),
      scheduled(
        13,
        sequence(
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
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        14,
      ),
      scheduled(
        29,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0007_ikut_attack1'] })),
        40,
      ),
    ],
    timelineContinuationSkillId: 'chr_0007_ikut_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 17,
    atk_scale: [0.48, 0.52, 0.57, 0.62, 0.67, 0.71, 0.76, 0.81, 0.86, 0.91, 0.99, 1.07],
    poise: 16,
  },
);

export const arclightChr_0007_ikut_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0007_ikut_power_attack',
    timelineBlockFrames: 40,
    naturalDurationFrames: 131,
    exclusiveFrame: 68,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 40,
          endFrame: 68,
          skillIds: ['chr_0007_ikut_normal_skill', 'chr_0007_ikut_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        15,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.05,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0007_ikut_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
        ),
        15,
      ),
      scheduled(
        23,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.05,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0007_ikut_power_attack:/scheduledSequences/1/sequence/steps/0',
          ),
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
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.9,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0007_ikut_power_attack:/scheduledSequences/2/sequence/steps/0',
          ),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
        ),
        38,
      ),
      scheduled(
        39,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2667 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        39,
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
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const arclightChr_0007_ikut_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0007_ikut_plunging_attack_end',
    timelineBlockFrames: 26,
    naturalDurationFrames: 88,
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
            'chr_0007_ikut_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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

export const arclightChr_0007_ikut_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0007_ikut_normal_skill',
    timelineBlockFrames: 34,
    naturalDurationFrames: 214,
    exclusiveFrame: 164,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 36, endFrame: 60, skillIds: ['chr_0007_ikut_normal_skill'] },
        { startFrame: 162, endFrame: 188, skillIds: ['chr_0007_ikut_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        19,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0007_ikut_normal_skill:/scheduledSequences/0/sequence/steps/0',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.066 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        19,
      ),
      scheduled(
        24,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise1' },
            },
            'chr_0007_ikut_normal_skill:/scheduledSequences/1/sequence/steps/0',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
          step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
        ),
        24,
      ),
      scheduled(
        112,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0007_ikut_normal_skill:/scheduledSequences/2/sequence/steps/0',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.066 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        112,
      ),
      scheduled(
        118,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise1' },
            },
            'chr_0007_ikut_normal_skill:/scheduledSequences/3/sequence/steps/0',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.066 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        118,
      ),
      scheduled(
        136,
        sequence(
          branch(
            {
              kind: 'entityTagMatch',
              target: 'enemy',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/Common/SpellStatus/Conduct'],
            },
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'talent_1', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0007_ikut_normal_skill_extra_count',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: {
                      pulse_up: 'pulse_up',
                      duration: 'duration',
                      count: 'count',
                    },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
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
                  damageType: 'electric',
                  attackScale: { kind: 'blackboard', key: 'atk_scale2' },
                  tags: ['normalSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise2' },
                },
                'chr_0007_ikut_normal_skill:/scheduledSequences/4/sequence/steps/0/whenTrue/steps/2',
              ),
              step('modifyActionValue', {
                key: 'thirdhit',
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
                },
                'chr_0007_ikut_normal_skill:/scheduledSequences/4/sequence/steps/0/whenTrue/steps/4',
              ),
              step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
              step('finishBuffsByTag', {
                target: 'enemy',
                tagQueryType: 'hasAny',
                buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
                reason: 'early',
              }),
            ),
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise2' },
                },
                'chr_0007_ikut_normal_skill:/scheduledSequences/4/sequence/steps/0/whenFalse/steps/0',
              ),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalSkill'],
                  features: ['canBreakWeakness'],
                },
                'chr_0007_ikut_normal_skill:/scheduledSequences/4/sequence/steps/0/whenFalse/steps/1',
              ),
              step('applyBuff', {
                buffId: 'buff_common_obtain_ultimate_sp',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        136,
      ),
      scheduled(
        137,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'thirdhit', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 1 },
            },
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
                      value: 0.2,
                      inTangent: -3.063443,
                      outTangent: -3.063443,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.05224372,
                      value: 0.03995434,
                      inTangent: -0.110653,
                      outTangent: -0.110653,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.425575,
                      value: 0.03096347,
                      inTangent: 0.04099823,
                      outTangent: 0.04099823,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 0.7615593,
                      value: 0.2709492,
                      inTangent: 0.9447426,
                      outTangent: 0.9447426,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0,
                    },
                    {
                      time: 1,
                      value: 0.5,
                      inTangent: 0.7728162,
                      outTangent: 0.7728162,
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
        137,
      ),
      scheduled(34, sequence(step('markCurrentSkillCanInterrupt', {})), 35),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'entityTagMatch',
              target: 'enemy',
              tagQueryType: 'hasAny',
              tags: ['Skill/Character/Common/SpellStatus/Conduct'],
            },
            sequence(
              step('modifyActionValue', {
                key: 'SpawnThird',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        0,
      ),
      scheduled(
        4,
        sequence(
          step('jumpTimeline', {
            destinationFrame: 96,
            condition: {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'SpawnThird', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 1 },
            },
          }),
        ),
        5,
      ),
      scheduled(95, sequence(step('jumpTimeline', { destinationFrame: 204 })), 95),
    ],
    smartTarget: 'enemy',
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb: [30, 30, 30, 30, 30, 35, 35, 35, 35, 35, 35, 40],
    atk_scale: [0.45, 0.5, 0.54, 0.59, 0.63, 0.68, 0.72, 0.77, 0.81, 0.87, 0.93, 1.01],
    atk_scale2: [1.8, 1.98, 2.16, 2.34, 2.52, 2.7, 2.88, 3.06, 3.24, 3.47, 3.74, 4.05],
    count: 0,
    duration: 0,
    poise1: 5,
    poise2: 5,
    pulse_up: 0,
    SpawnThird: 0,
    talent_1: 0,
    thirdhit: 0,
  },
);

export const arclightChr_0007_ikut_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0007_ikut_ultimate_skill',
    timelineBlockFrames: 86,
    naturalDurationFrames: 141,
    exclusiveFrame: 85,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 77,
          endFrame: 89,
          skillIds: ['chr_0007_ikut_normal_skill', 'chr_0007_ikut_combo_skill'],
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
          step('mergeContextTargets', {
            saveToContextKey: 'tar1',
            sources: [{ kind: 'target', target: 'enemy' }],
          }),
          branch(
            { kind: 'casterControlled' },
            sequence(
              branch(
                {
                  kind: 'contextTargetCountCompare',
                  contextKey: 'tar1',
                  operator: 'greaterOrEqual',
                  value: 1,
                },
                sequence(),
                sequence(
                  step('createSpatialPointTargets', {
                    saveToContextKey: 'tar1',
                    count: { kind: 'constant', value: 1 },
                  }),
                ),
                { alwaysNext: true },
              ),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        0,
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
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 55),
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
        85,
      ),
      scheduled(
        54,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0007_ikut_ultimate_skill',
            childSkillId: 'chr_0007_ikut_ultimate_skill_abentity',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
        ),
        55,
      ),
    ],
    cooldownFrames: 450,
    costs: [{ resource: 'ultimateEnergy', value: 90 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale1: [1.56, 1.71, 1.87, 2.02, 2.18, 2.34, 2.49, 2.65, 2.8, 3, 3.23, 3.5],
    atk_scale2: [2.44, 2.69, 2.93, 3.18, 3.42, 3.67, 3.91, 4.15, 4.4, 4.7, 5.07, 5.5],
    isWall: 0,
    poise1: [7, 7, 7, 7, 7, 7, 7, 7, 7, 10, 10, 10],
    poise2: [7, 7, 7, 7, 7, 7, 7, 7, 7, 10, 10, 10],
    radius: 1,
  },
);

export const arclightChr_0007_ikut_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0007_ikut_combo_skill',
    timelineBlockFrames: 38,
    naturalDurationFrames: 86,
    exclusiveFrame: 37,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 27, endFrame: 60, skillIds: ['chr_0007_ikut_normal_skill'] },
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
                saveToContextKey: 'mainchar',
                selection: { kind: 'controlledOperator' },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        1,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.5 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
            influenceSkillCooldownSeconds: { kind: 'constant', value: 0.4 },
          }),
        ),
        12,
      ),
      scheduled(
        0,
        sequence(
          step('finishBuffsById', {
            target: 'caster',
            buffIds: ['buff_chr_0007_ikut_combo_skill_counts'],
            reason: 'other',
          }),
        ),
        3,
      ),
      scheduled(
        17,
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
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0007_ikut_combo_skill:/scheduledSequences/3/sequence/steps/1',
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
        ),
        17,
      ),
      scheduled(
        21,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0007_ikut_combo_skill:/scheduledSequences/4/sequence/steps/0',
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
        21,
      ),
      scheduled(
        25,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0007_ikut_combo_skill:/scheduledSequences/5/sequence/steps/0',
          ),
        ),
        25,
      ),
    ],
    smartTarget: 'input',
    cooldownFrames: 90,
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atb: [8, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10],
    atk_scale: [0.52, 0.57, 0.62, 0.67, 0.73, 0.78, 0.83, 0.88, 0.93, 1, 1.07, 1.17],
    count: 0,
    duration: 0,
    poise: 5,
    usp: 5,
  },
);

export const arclightCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const arclight: OperatorDefinition = {
  slug: 'arclight',
  gameId: 'ARCLIGHT',
  rarity: 5,
  weaponType: 'sword',
  element: 'electric',
  role: 'vanguard',
  mainAttribute: 'agility',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [14, 33, 54, 75, 96, 107],
    agility: [14, 42, 71, 101, 130, 145],
    intellect: [12, 36, 61, 86, 111, 123],
    will: [10, 29, 49, 69, 89, 100],
    baseAttack: [30, 89, 151, 213, 275, 306],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        arclightChr_0007_ikut_attack1,
        arclightChr_0007_ikut_attack2,
        arclightChr_0007_ikut_attack3,
        arclightChr_0007_ikut_attack4,
        arclightChr_0007_ikut_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: arclightChr_0007_ikut_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: arclightChr_0007_ikut_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: arclightChr_0007_ikut_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: arclightChr_0007_ikut_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: arclightChr_0007_ikut_combo_skill,
    },
  ],
  dodgeSkill: arclightCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0007_ikut_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0007_ikut_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0007_ikut_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0007_ikut_attack1',
        'chr_0007_ikut_attack2',
        'chr_0007_ikut_attack3',
        'chr_0007_ikut_attack4',
        'chr_0007_ikut_attack5',
        'chr_0007_ikut_plunging_attack_end',
        'chr_0007_ikut_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0007_ikut_attack1',
        'chr_0007_ikut_attack2',
        'chr_0007_ikut_attack3',
        'chr_0007_ikut_attack4',
        'chr_0007_ikut_attack5',
      ],
      defaultSkillKey: 'chr_0007_ikut_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0007_ikut_combo_skill',
      event: 'outputBuff',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'eventBuffTagsMatch',
            match: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
          },
          sequence(),
        ),
      ),
    },
    {
      key: 'native-combo:1',
      skillKey: 'chr_0007_ikut_combo_skill',
      event: 'buffEndsEarly',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'eventBuffTagsMatch',
            match: 'hasAny',
            buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
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
          skillGroupKey: 'battleSkill',
          blackboardKey: 'talent_1',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'duration',
          operation: 'assign',
          value: [15, 15],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'pulse_up',
          operation: 'add',
          value: [0.0005, 0.0008],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'count',
          operation: 'assign',
          value: [3, 3],
        },
      ],
    },
    {
      levels: 2,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0007_ikut_talent_2',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { prob: [0.3, 0.5] },
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
          blackboardKey: 'atb',
          operation: 'add',
          value: 10,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 15 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'pulse_up',
          operation: 'multiply',
          value: 1.3,
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
          blackboardKey: 'count',
          operation: 'assign',
          value: 2,
        },
      ],
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0007_ikut_finish_count_p5',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
        }),
      ),
    },
  ],
  buffDefinitions: {
    buff_chr_0007_ikut_atk_buff_talent: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_pulse_dmg_up',
        iconPath: '/icons/icon_battle_pulse_dmg_up.webp',
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
      blackboard: { duration: 0, pulse_up: 0 },
      attributeModifiers: [
        {
          attribute: 'electricDamageIncrease',
          slot: 'baseAddition',
          value: { blackboardKey: 'pulse_up' },
        },
      ],
    },
    buff_chr_0007_ikut_finish_count_p5: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0007_ikut_normal_skill_extra_count'],
            reason: 'other',
          }),
        ),
      },
    },
    buff_chr_0007_ikut_normal_skill_extra_count: {
      stackingType: 'enhance',
      priority: 0,
      maxStackCount: 3,
      presentation: {
        visible: true,
        iconId: 'icon_battle_ikut_talent_1',
        iconPath: '/icons/icon_battle_ikut_talent_1.webp',
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
      blackboard: { count: 0, duration: 0, final_pulse_up: 0, pulse_up: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enhanceChanged: sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'buffOwner',
              buffIds: ['buff_chr_0007_ikut_normal_skill_extra_count'],
              operator: 'greaterOrEqual',
              value: { kind: 'blackboard', key: 'count' },
            },
            sequence(
              step('storeSourceAttributeValue', {
                attribute: { kind: 'specific', key: 'intellect' },
                stage: 'finalNonConverted',
                useFloor: false,
                divisor: { kind: 'constant', value: 1 },
                multiplier: { kind: 'blackboard', key: 'pulse_up' },
                base: { kind: 'constant', value: 0 },
                targetKey: 'final_pulse_up',
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0007_ikut_atk_buff_talent',
                target: 'party',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: { pulse_up: 'final_pulse_up', duration: 'duration' },
              }),
              step('finishBuffsById', {
                target: 'buffOwner',
                buffIds: ['buff_chr_0007_ikut_normal_skill_extra_count'],
                reason: 'other',
              }),
            ),
          ),
        ),
      },
    },
    buff_chr_0007_ikut_talent_2: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { prob: 0.3 },
      attributeModifiers: [],
    },
    buff_chr_0007_ikut_talent_2_immune: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 0,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: ['Immune/SpellInflictOnChar'],
      extendTags: [],
      blackboard: { duration: 9999 },
      attributeModifiers: [],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0007_ikut_ultimate_skill: {
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
        skillId: 'chr_0007_ikut_ultimate_skill_abentity',
        nativeSkillType: 'normalSkill',
        naturalDurationFrames: 150,
        castResource: {
          costFrame: 0,
          cooldownSeconds: 0,
          maxChargeTime: 1,
          cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
        },
        blackboard: {
          atk_scale1: 0.2,
          atk_scale2: 0,
          count: 0,
          duration: 12,
          poise1: 0,
          poise2: 0,
        },
        scheduledSequences: [
          scheduled(
            7,
            sequence(
              step('applyElementalInfliction', { element: 'electric', isExtra: false }),
              step(
                'dealDamage',
                {
                  damageType: 'electric',
                  attackScale: { kind: 'blackboard', key: 'atk_scale1' },
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise1' },
                },
                'abilityentity_chr_0007_ikut_ultimate_skill:chr_0007_ikut_ultimate_skill_abentity:/childSkill/scheduledSequences/0/sequence/steps/1',
              ),
            ),
            8,
          ),
          scheduled(7, sequence(forEachTarget('enemy', sequence())), 8),
          scheduled(
            63,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'electric',
                  attackScale: { kind: 'blackboard', key: 'atk_scale2' },
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise2' },
                },
                'abilityentity_chr_0007_ikut_ultimate_skill:chr_0007_ikut_ultimate_skill_abentity:/childSkill/scheduledSequences/2/sequence/steps/0',
              ),
            ),
            64,
          ),
          scheduled(
            63,
            sequence(
              forEachTarget(
                'enemy',
                sequence(
                  branch(
                    {
                      kind: 'entityTagMatch',
                      target: 'enemy',
                      tagQueryType: 'hasAny',
                      tags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                    },
                    sequence(
                      step('readBuffStackCount', {
                        target: 'enemy',
                        outputKey: 'count',
                        query: {
                          kind: 'tag',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                        },
                      }),
                      branch(
                        {
                          kind: 'buffStackCompare',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'blackboard', key: 'count' },
                        },
                        sequence(
                          step('finishBuffsByTag', {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellInflict/PulseInflict'],
                            reason: 'early',
                            count: { kind: 'blackboard', key: 'count' },
                          }),
                          step('applyBuff', {
                            buffId: 'buff_common_pulse_pulse_conduct_triggered',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                            blackboardAssignments: {
                              consumed_type: { kind: 'constant', value: 1 },
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
              ),
            ),
            64,
          ),
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default arclight;
