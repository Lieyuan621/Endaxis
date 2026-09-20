/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type { OperatorDefinition, SkillDefinition } from '../../core/game-data/operatorDefinition';
import {
  branch,
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withActionBlackboardScope,
  withSkillBlackboard,
} from './definitionHelpers';

export const wulfgardChr_0006_wolfgd_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0006_wolfgd_attack1',
    timelineBlockFrames: 24,
    naturalDurationFrames: 121,
    exclusiveFrame: 30,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 49,
          input: 'basicAttack',
          targetSkillId: 'chr_0006_wolfgd_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 24, endFrame: 49, skillIds: ['chr_0006_wolfgd_attack2'] }],
    },
    costFrame: 13,
    scheduledSequences: [
      scheduled(
        7,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0006_wolfgd_attack1.actionGroupData.timelineActions[2]._sequenceActionData.actionData[1]:projectile_chr_0006_wolfgd_normal_attack',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_attack1.actionGroupData.timelineActions[2]._sequenceActionData.actionData[1]:chr_0006_wolfgd_attack1_projhit01',
                { atb: 0, atk_scale: 0, duration: 0 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack'],
                    },
                    'chr_0006_wolfgd_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0/body/steps/0',
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
        14,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0006_wolfgd_attack1.actionGroupData.timelineActions[3]._sequenceActionData.actionData[1]:projectile_chr_0006_wolfgd_normal_attack',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_attack1.actionGroupData.timelineActions[3]._sequenceActionData.actionData[1]:chr_0006_wolfgd_attack1_projhit',
                { atb: 0, atk_scale: 0, duration: 0 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack'],
                    },
                    'chr_0006_wolfgd_attack1:/scheduledSequences/1/sequence/steps/0/body/steps/0/body/steps/0',
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
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        15,
      ),
      scheduled(
        24,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0006_wolfgd_attack2'] })),
        49,
      ),
    ],
    timelineContinuationSkillId: 'chr_0006_wolfgd_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    display_atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
  },
);

export const wulfgardChr_0006_wolfgd_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0006_wolfgd_attack2',
    timelineBlockFrames: 23,
    naturalDurationFrames: 129,
    exclusiveFrame: 35,
    offsetRecordFrame: 10,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 38,
          input: 'basicAttack',
          targetSkillId: 'chr_0006_wolfgd_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 23, endFrame: 38, skillIds: ['chr_0006_wolfgd_attack3'] }],
    },
    costFrame: 11,
    scheduledSequences: [
      scheduled(
        10,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0006_wolfgd_attack2.actionGroupData.timelineActions[1]._sequenceActionData.actionData[1]:projectile_chr_0006_wolfgd_normal_attack_2',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_attack2.actionGroupData.timelineActions[1]._sequenceActionData.actionData[1]:chr_0006_wolfgd_attack2_projhit',
                { atb: 0, atk_scale: 0, duration: 0 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack'],
                    },
                    'chr_0006_wolfgd_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0/body/steps/0',
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
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        10,
      ),
      scheduled(
        16,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0006_wolfgd_attack2.actionGroupData.timelineActions[2]._sequenceActionData.actionData[1]:projectile_chr_0006_wolfgd_normal_attack_2',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_attack2.actionGroupData.timelineActions[2]._sequenceActionData.actionData[1]:chr_0006_wolfgd_attack2_projhit',
                { atb: 0, atk_scale: 0, duration: 0 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack'],
                    },
                    'chr_0006_wolfgd_attack2:/scheduledSequences/1/sequence/steps/0/body/steps/0/body/steps/0',
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
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        16,
      ),
      scheduled(
        23,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0006_wolfgd_attack3'] })),
        38,
      ),
    ],
    timelineContinuationSkillId: 'chr_0006_wolfgd_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.18, 0.19, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39],
    display_atk_scale: [0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.67, 0.73, 0.79],
  },
);

export const wulfgardChr_0006_wolfgd_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0006_wolfgd_attack3',
    timelineBlockFrames: 32,
    naturalDurationFrames: 146,
    exclusiveFrame: 52,
    offsetRecordFrame: 12,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 52,
          input: 'basicAttack',
          targetSkillId: 'chr_0006_wolfgd_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 32, endFrame: 52, skillIds: ['chr_0006_wolfgd_attack4'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        12,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0006_wolfgd_attack3.actionGroupData.timelineActions[1]._sequenceActionData.actionData[1]:projectile_chr_0006_wolfgd_normal_attack_3',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_attack3.actionGroupData.timelineActions[1]._sequenceActionData.actionData[1]:chr_0006_wolfgd_attack3_projhit',
                { atb: 0, atk_scale: 0, duration: 0 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack'],
                    },
                    'chr_0006_wolfgd_attack3:/scheduledSequences/0/sequence/steps/0/body/steps/0/body/steps/0',
                  ),
                  branch(
                    { kind: 'casterControlled' },
                    sequence(
                      step('changeResourceByActionValue', {
                        resource: 'sp',
                        amount: { kind: 'blackboard', key: 'atb' },
                        coefficient: { kind: 'constant', value: 0.3333333 },
                        recipient: 'team',
                        spGainKind: 'gain',
                        spGainSource: 'normalAttack',
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
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
        12,
      ),
      scheduled(
        18,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0006_wolfgd_attack3.actionGroupData.timelineActions[2]._sequenceActionData.actionData[1]:projectile_chr_0006_wolfgd_normal_attack_3',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_attack3.actionGroupData.timelineActions[2]._sequenceActionData.actionData[1]:chr_0006_wolfgd_attack3_projhit',
                { atb: 0, atk_scale: 0, duration: 0 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack'],
                    },
                    'chr_0006_wolfgd_attack3:/scheduledSequences/1/sequence/steps/0/body/steps/0/body/steps/0',
                  ),
                  branch(
                    { kind: 'casterControlled' },
                    sequence(
                      step('changeResourceByActionValue', {
                        resource: 'sp',
                        amount: { kind: 'blackboard', key: 'atb' },
                        coefficient: { kind: 'constant', value: 0.3333333 },
                        recipient: 'team',
                        spGainKind: 'gain',
                        spGainSource: 'normalAttack',
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
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
        18,
      ),
      scheduled(
        24,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0006_wolfgd_attack3.actionGroupData.timelineActions[3]._sequenceActionData.actionData[1]:projectile_chr_0006_wolfgd_normal_attack_3',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_attack3.actionGroupData.timelineActions[3]._sequenceActionData.actionData[1]:chr_0006_wolfgd_attack3_projhit',
                { atb: 0, atk_scale: 0, duration: 0 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack'],
                    },
                    'chr_0006_wolfgd_attack3:/scheduledSequences/2/sequence/steps/0/body/steps/0/body/steps/0',
                  ),
                  branch(
                    { kind: 'casterControlled' },
                    sequence(
                      step('changeResourceByActionValue', {
                        resource: 'sp',
                        amount: { kind: 'blackboard', key: 'atb' },
                        coefficient: { kind: 'constant', value: 0.3333333 },
                        recipient: 'team',
                        spGainKind: 'gain',
                        spGainSource: 'normalAttack',
                      }),
                    ),
                    undefined,
                    { alwaysNext: true },
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
        24,
      ),
      scheduled(
        32,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0006_wolfgd_attack4'] })),
        52,
      ),
    ],
    timelineContinuationSkillId: 'chr_0006_wolfgd_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.19, 0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.31, 0.33, 0.36, 0.38, 0.42],
    display_atk_scale: [0.56, 0.61, 0.67, 0.72, 0.78, 0.83, 0.89, 0.94, 1, 1.07, 1.15, 1.25],
  },
);

export const wulfgardChr_0006_wolfgd_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0006_wolfgd_attack4',
    timelineBlockFrames: 53,
    naturalDurationFrames: 141,
    exclusiveFrame: 52,
    offsetRecordFrame: 23,
    costFrame: 23,
    scheduledSequences: [
      scheduled(
        23,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0006_wolfgd_attack4.actionGroupData.timelineActions[4]._sequenceActionData.actionData[1]:projectile_chr_0006_wolfgd_normal_attack_4',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_attack4.actionGroupData.timelineActions[4]._sequenceActionData.actionData[1]:chr_0006_wolfgd_attack4_projhit',
                { atb: 0, atk_scale: 0, duration: 0, poise: 0 },
                true,
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
                    'chr_0006_wolfgd_attack4:/scheduledSequences/0/sequence/steps/0/body/steps/0/body/steps/0',
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
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        33,
      ),
    ],
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 18,
    atk_scale: [0.68, 0.74, 0.81, 0.88, 0.95, 1.01, 1.08, 1.15, 1.22, 1.3, 1.4, 1.52],
    poise: 18,
  },
);

export const wulfgardChr_0006_wolfgd_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0006_wolfgd_power_attack',
    timelineBlockFrames: 34,
    naturalDurationFrames: 150,
    exclusiveFrame: 60,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 34,
          endFrame: 58,
          skillIds: ['chr_0006_wolfgd_normal_skill', 'chr_0006_wolfgd_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        34,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 1,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0006_wolfgd_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(step('gainFinisherSp', { factor: 1, recipient: 'team' })),
            undefined,
            { alwaysNext: true },
          ),
        ),
        44,
      ),
      scheduled(
        34,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.07 },
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
        43,
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
        60,
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
        34,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const wulfgardChr_0006_wolfgd_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0006_wolfgd_plunging_attack_end',
    timelineBlockFrames: 8,
    naturalDurationFrames: 120,
    exclusiveFrame: 20,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [{ startFrame: 8, endFrame: 20, skillIds: ['chr_0006_wolfgd_attack1'] }],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        2,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'plungingAttack'],
            },
            'chr_0006_wolfgd_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
          ),
        ),
        6,
      ),
    ],
    skillType: 'plungingAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
);

export const wulfgardChr_0006_wolfgd_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0006_wolfgd_normal_skill',
    timelineBlockFrames: 32,
    naturalDurationFrames: 272,
    exclusiveFrame: 159,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 32, endFrame: 54, skillIds: ['chr_0006_wolfgd_normal_skill'] },
        { startFrame: 152, endFrame: 184, skillIds: ['chr_0006_wolfgd_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        6,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0006_wolfgd_normal_skill.actionGroupData.timelineActions[3]._sequenceActionData.actionData[2]:projectile_chr_0006_wolfgd_normal_skill',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_normal_skill.actionGroupData.timelineActions[3]._sequenceActionData.actionData[2]:chr_0006_wolfgd_normal_skill_projhit',
                { atk_scale: 0, duration: 0, poise_first_bullet: 0 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'blackboard', key: 'poise_first_bullet' },
                    },
                    'chr_0006_wolfgd_normal_skill:/scheduledSequences/0/sequence/steps/0/body/steps/0/body/steps/0',
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
        16,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0006_wolfgd_normal_skill.actionGroupData.timelineActions[4]._sequenceActionData.actionData[2]:projectile_chr_0006_wolfgd_normal_skill',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_normal_skill.actionGroupData.timelineActions[4]._sequenceActionData.actionData[2]:chr_0006_wolfgd_normal_skill_projhit',
                { atk_scale: 0, duration: 0, poise_first_bullet: 0 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'heat',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'blackboard', key: 'poise_first_bullet' },
                    },
                    'chr_0006_wolfgd_normal_skill:/scheduledSequences/1/sequence/steps/0/body/steps/0/body/steps/0',
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
        20,
      ),
      scheduled(
        23,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'SpellInflict', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_normal_skill.actionGroupData.timelineActions[5]._sequenceActionData.actionData[2].succeedActions.actionData[0]:projectile_chr_0006_wolfgd_normal_skill',
                {},
                true,
                sequence(
                  withActionBlackboardScope(
                    'SkillData.chr_0006_wolfgd_normal_skill.actionGroupData.timelineActions[5]._sequenceActionData.actionData[2].succeedActions.actionData[0]:chr_0006_wolfgd_normal_skill_projhit_1',
                    { atk_scale: 0, duration: 0, poise_first_bullet: 0 },
                    true,
                    sequence(
                      step(
                        'dealDamage',
                        {
                          damageType: 'heat',
                          attackScale: { kind: 'blackboard', key: 'atk_scale' },
                          tags: ['normalSkill'],
                          features: ['canBreakWeakness'],
                          stagger: { kind: 'blackboard', key: 'poise_first_bullet' },
                        },
                        'chr_0006_wolfgd_normal_skill:/scheduledSequences/2/sequence/steps/0/whenTrue/steps/0/body/steps/0/body/steps/0',
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
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_normal_skill.actionGroupData.timelineActions[5]._sequenceActionData.actionData[2].failActions.actionData[0]:projectile_chr_0006_wolfgd_normal_skill',
                {},
                true,
                sequence(
                  withActionBlackboardScope(
                    'SkillData.chr_0006_wolfgd_normal_skill.actionGroupData.timelineActions[5]._sequenceActionData.actionData[2].failActions.actionData[0]:chr_0006_wolfgd_normal_skill_projhit_FireSpellInfiction',
                    { atk_scale: 0, duration: 0, poise_first_bullet: 0 },
                    true,
                    sequence(
                      step('applyElementalInfliction', { element: 'heat', isExtra: false }),
                      step(
                        'dealDamage',
                        {
                          damageType: 'heat',
                          attackScale: { kind: 'blackboard', key: 'atk_scale' },
                          tags: ['normalSkill'],
                          features: ['canBreakWeakness'],
                          stagger: { kind: 'blackboard', key: 'poise_first_bullet' },
                        },
                        'chr_0006_wolfgd_normal_skill:/scheduledSequences/2/sequence/steps/0/whenFalse/steps/0/body/steps/0/body/steps/1',
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
            { alwaysNext: true },
          ),
          step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
        ),
        26,
      ),
      scheduled(
        141,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0006_wolfgd_normal_skill.actionGroupData.timelineActions[7]._sequenceActionData.actionData[1]:projectile_chr_0006_wolfgd_normal_skill_plus',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_normal_skill.actionGroupData.timelineActions[7]._sequenceActionData.actionData[1]:chr_0006_wolfgd_normal_skill_plus_projhit',
                {
                  atk_scale_plus: 0,
                  atk_scale_plus_fail: 0,
                  duration: 0,
                  poise_extra_bullet: 0,
                  poise_extra_bullet_fail: 0,
                  potential_2: 0,
                  potential_skillpower: 0,
                  returnskillpower: 0,
                  talent2: 0,
                },
                true,
                sequence(
                  branch(
                    {
                      kind: 'entityTagMatch',
                      target: 'enemy',
                      tagQueryType: 'hasAny',
                      tags: [
                        'Skill/Character/Common/SpellStatus/Burning',
                        'Skill/Character/Common/SpellStatus/Conduct',
                      ],
                    },
                    sequence(
                      branch(
                        {
                          kind: 'actionValueCompare',
                          left: { kind: 'blackboard', key: 'talent2', fallback: 0 },
                          operator: 'greater',
                          right: { kind: 'constant', value: 0 },
                        },
                        sequence(
                          branch(
                            {
                              kind: 'actionValueCompare',
                              left: { kind: 'blackboard', key: 'potential_2', fallback: 0 },
                              operator: 'greater',
                              right: { kind: 'constant', value: 0 },
                            },
                            sequence(
                              step('modifyActionValue', {
                                key: 'returnskillpower',
                                operation: 'add',
                                value: { kind: 'blackboard', key: 'potential_skillpower' },
                              }),
                            ),
                            undefined,
                            { alwaysNext: true },
                          ),
                          step('changeResourceByActionValue', {
                            resource: 'sp',
                            amount: { kind: 'blackboard', key: 'returnskillpower' },
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
                          attackScale: { kind: 'blackboard', key: 'atk_scale_plus' },
                          tags: ['normalSkill'],
                          features: ['canBreakWeakness'],
                          stagger: { kind: 'blackboard', key: 'poise_extra_bullet' },
                        },
                        'chr_0006_wolfgd_normal_skill:/scheduledSequences/3/sequence/steps/0/body/steps/0/body/steps/0/whenTrue/steps/1',
                      ),
                    ),
                    sequence(
                      step('applyElementalInfliction', { element: 'heat', isExtra: false }),
                      step(
                        'dealDamage',
                        {
                          damageType: 'heat',
                          attackScale: { kind: 'blackboard', key: 'atk_scale_plus_fail' },
                          tags: ['normalSkill'],
                          features: ['canBreakWeakness'],
                          stagger: { kind: 'blackboard', key: 'poise_extra_bullet_fail' },
                        },
                        'chr_0006_wolfgd_normal_skill:/scheduledSequences/3/sequence/steps/0/body/steps/0/body/steps/0/whenFalse/steps/1',
                      ),
                    ),
                    { alwaysNext: true },
                  ),
                  branch(
                    {
                      kind: 'entityTagMatch',
                      target: 'enemy',
                      tagQueryType: 'hasAny',
                      tags: ['Skill/Character/Common/SpellStatus/Burning'],
                    },
                    sequence(
                      step('finishBuffsByTag', {
                        target: 'enemy',
                        tagQueryType: 'hasAny',
                        buffTags: ['Skill/Character/Common/SpellStatus/Burning'],
                        reason: 'early',
                      }),
                    ),
                    sequence(
                      branch(
                        {
                          kind: 'entityTagMatch',
                          target: 'enemy',
                          tagQueryType: 'hasAny',
                          tags: ['Skill/Character/Common/SpellStatus/Conduct'],
                        },
                        sequence(
                          step('finishBuffsByTag', {
                            target: 'enemy',
                            tagQueryType: 'hasAny',
                            buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
                            reason: 'early',
                          }),
                        ),
                        undefined,
                        { alwaysNext: true },
                      ),
                    ),
                    { alwaysNext: true },
                  ),
                ),
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
          branch(
            {
              kind: 'all',
              conditions: [
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'potential_3', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                {
                  kind: 'buffIdStackCompare',
                  target: 'caster',
                  buffIds: ['buff_chr_0006_wolfgd_talent_0_effectbuff'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
              ],
            },
            sequence(
              step('readBuffBlackboard', {
                target: 'caster',
                query: { kind: 'id', buffIds: ['buff_chr_0006_wolfgd_talent_0'] },
                desiredKey: 'add',
                outputKey: 'add',
              }),
              step('readBuffBlackboard', {
                target: 'caster',
                query: { kind: 'id', buffIds: ['buff_chr_0006_wolfgd_talent_0'] },
                desiredKey: 'duration',
                outputKey: 'duration',
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0006_wolfgd_talent_0_effectbuff',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: { add: 'add', duration: 'duration' },
              }),
              step('modifyActionValue', {
                key: 'teammate_percent',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'add' },
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0006_wolfgd_talent_0_effectbuff',
                target: 'party',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: { add: 'teammate_percent', duration: 'duration' },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        146,
      ),
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
          branch(
            {
              kind: 'entityTagMatch',
              target: 'enemy',
              tagQueryType: 'hasAny',
              tags: [
                'Skill/Character/Common/SpellStatus/Burning',
                'Skill/Character/Common/SpellStatus/Conduct',
              ],
            },
            sequence(
              step('modifyActionValue', {
                key: 'SpellInflict',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        2,
      ),
      scheduled(
        31,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'SpellInflict', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(step('jumpTimeline', { destinationFrame: 118 })),
            undefined,
            { alwaysNext: true },
          ),
        ),
        32,
      ),
      scheduled(117, sequence(step('jumpTimeline', { destinationFrame: 247 })), 117),
    ],
    smartTarget: 'enemy',
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    add: 0,
    atk_scale: [0.34, 0.37, 0.41, 0.44, 0.48, 0.51, 0.54, 0.58, 0.61, 0.65, 0.71, 0.77],
    atk_scale_plus: [3.78, 4.15, 4.53, 4.91, 5.29, 5.66, 6.04, 6.42, 6.8, 7.27, 7.84, 8.5],
    atk_scale_plus_fail: [0.36, 0.4, 0.43, 0.47, 0.5, 0.54, 0.58, 0.61, 0.65, 0.69, 0.75, 0.81],
    duration: 0,
    poise_extra_bullet: 5,
    poise_extra_bullet_fail: 0,
    poise_first_bullet: 1.67,
    potential_2: 0,
    potential_3: 0,
    potential_skillpower: 0,
    returnskillpower: 0,
    SpellInflict: 0,
    talent2: 0,
    teammate_percent: 0,
  },
);

export const wulfgardChr_0006_wolfgd_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0006_wolfgd_combo_skill',
    timelineBlockFrames: 30,
    naturalDurationFrames: 138,
    exclusiveFrame: 30,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 30, endFrame: 65, skillIds: ['chr_0006_wolfgd_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        12,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0006_wolfgd_combo_skill.actionGroupData.timelineActions[1]._sequenceActionData.actionData[1]:projectile_chr_0006_wolfgd_combo_skill',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0006_wolfgd_combo_skill.actionGroupData.timelineActions[1]._sequenceActionData.actionData[1]:chr_0006_wolfgd_combo_skill_projhit',
                { atk_scale: 0, duration: 0, poise: 0, usp: 0 },
                true,
                sequence(
                  step('spawnAbilityEntity', {
                    abilityEntityId: 'abilityentity_chr_0006_wolfgd_combo_skill',
                    childSkillId: 'chr_0006_wolfgd_combo_skill_abilityrange',
                    inheritActionBlackboard: true,
                    dieWhenSourceDies: false,
                  }),
                ),
                undefined,
                { lifetime: 'execution', alwaysNext: true },
              ),
            ),
            {},
            { lifetime: 'execution' },
          ),
        ),
        16,
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
    cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 570],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [0.6, 0.66, 0.72, 0.78, 0.84, 0.9, 0.96, 1.02, 1.08, 1.16, 1.25, 1.35],
    cam_angle: 0,
    cam_duration: 0,
    count: 0,
    input_angle: 0,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    poise: 10,
    select_radius: 4,
    usp: 10,
  },
);

export const wulfgardChr_0006_wolfgd_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0006_wolfgd_ultimate_skill',
    timelineBlockFrames: 75,
    naturalDurationFrames: 168,
    exclusiveFrame: 80,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 75,
          endFrame: 89,
          skillIds: ['chr_0006_wolfgd_normal_skill', 'chr_0006_wolfgd_combo_skill'],
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
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential_5', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              step('adjustSkillCooldown', {
                target: 'caster',
                skill: { kind: 'type', skillType: 'comboSkill' },
                operation: 'set',
                basis: 'absoluteSeconds',
                value: { kind: 'constant', value: 0 },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        14,
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
      scheduled(45, sequence(step('launchProjectileLifetime', { finish: 'firstTickReach' })), 47),
      scheduled(50, sequence(step('launchProjectileLifetime', { finish: 'firstTickReach' })), 52),
      scheduled(56, sequence(step('launchProjectileLifetime', { finish: 'firstTickReach' })), 58),
      scheduled(61, sequence(step('launchProjectileLifetime', { finish: 'firstTickReach' })), 63),
      scheduled(45, sequence(step('launchProjectileLifetime', { finish: 'firstTickReach' })), 47),
      scheduled(63, sequence(step('launchProjectileLifetime', { finish: 'firstTickReach' })), 65),
      scheduled(
        46,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0006_wolfgd_ultimate_skill:/scheduledSequences/8/sequence/steps/0',
          ),
        ),
        49,
      ),
      scheduled(
        52,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0006_wolfgd_ultimate_skill:/scheduledSequences/9/sequence/steps/0',
          ),
        ),
        55,
      ),
      scheduled(
        59,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0006_wolfgd_ultimate_skill:/scheduledSequences/10/sequence/steps/0',
          ),
        ),
        62,
      ),
      scheduled(
        64,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0006_wolfgd_ultimate_skill:/scheduledSequences/11/sequence/steps/0',
          ),
        ),
        67,
      ),
      scheduled(
        69,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0006_wolfgd_ultimate_skill:/scheduledSequences/12/sequence/steps/0',
          ),
        ),
        72,
      ),
      scheduled(
        45,
        sequence(
          repeatEachTick(
            sequence(
              step('applyBuff', {
                buffId: 'buff_common_fire_fire_burning_triggered',
                target: 'enemy',
                inheritSourceSkillCastInfo: true,
              }),
            ),
            {
              nativeChanneling: {
                executeEachFrame: false,
                triggerIntervalSeconds: 0.2,
                maxCountPerTarget: 1,
                targetTriggerIntervalSeconds: 0.2,
              },
            },
          ),
        ),
        72,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 46),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        46,
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
        80,
      ),
    ],
    cooldownFrames: 300,
    costs: [{ resource: 'ultimateEnergy', value: 90 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale: [0.32, 0.35, 0.38, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.66, 0.72],
    poise: 3,
    potential_5: 0,
  },
);

export const wulfgardCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const wulfgard: OperatorDefinition = {
  slug: 'wulfgard',
  gameId: 'WULFGARD',
  rarity: 5,
  weaponType: 'handcannon',
  element: 'heat',
  role: 'caster',
  mainAttribute: 'strength',
  secondaryAttribute: 'agility',
  attributes: {
    strength: [18, 49, 81, 113, 145, 161],
    agility: [9, 27, 47, 66, 85, 95],
    intellect: [9, 27, 45, 64, 83, 92],
    will: [13, 34, 56, 78, 100, 111],
    baseAttack: [30, 86, 146, 205, 264, 294],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        wulfgardChr_0006_wolfgd_attack1,
        wulfgardChr_0006_wolfgd_attack2,
        wulfgardChr_0006_wolfgd_attack3,
        wulfgardChr_0006_wolfgd_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: wulfgardChr_0006_wolfgd_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: wulfgardChr_0006_wolfgd_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: wulfgardChr_0006_wolfgd_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: wulfgardChr_0006_wolfgd_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: wulfgardChr_0006_wolfgd_ultimate_skill,
    },
  ],
  dodgeSkill: wulfgardCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0006_wolfgd_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0006_wolfgd_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0006_wolfgd_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0006_wolfgd_attack1',
        'chr_0006_wolfgd_attack2',
        'chr_0006_wolfgd_attack3',
        'chr_0006_wolfgd_attack4',
        'chr_0006_wolfgd_plunging_attack_end',
        'chr_0006_wolfgd_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0006_wolfgd_attack1',
        'chr_0006_wolfgd_attack2',
        'chr_0006_wolfgd_attack3',
        'chr_0006_wolfgd_attack4',
      ],
      defaultSkillKey: 'chr_0006_wolfgd_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0006_wolfgd_combo_skill',
      event: 'beforeTakeInfliction',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          { kind: 'contextTargetObjectTypeMatch', contextKey: 'trigger', objectTypes: ['enemy'] },
          sequence(),
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
          buffId: 'buff_chr_0006_wolfgd_talent_0',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { add: [0.2, 0.3], duration: { kind: 'constant', value: 10 } },
        }),
      ),
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'returnskillpower',
          operation: 'assign',
          value: [5, 10],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'talent2',
          operation: 'assign',
          value: [1, 1],
        },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 15 },
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 15 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_skillpower',
          operation: 'assign',
          value: 10,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_2',
          operation: 'assign',
          value: 1,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_3',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'teammate_percent',
          operation: 'assign',
          value: 0.5,
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
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0006_wolfgd_talent_0: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      triggerIntervalSeconds: 1,
      waitFirstTriggerInterval: false,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: { add: 0, duration: 0 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'outputBuff',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'eventBuffTagsMatch',
                match: 'hasAny',
                buffTags: ['Skill/Character/Common/SpellStatus/Burning'],
              },
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0006_wolfgd_talent_0_effectbuff',
                  target: 'buffSource',
                  source: 'buffSource',
                  inheritSourceSkillCastInfo: true,
                  copiedBlackboardAssignments: { duration: 'duration', add: 'add' },
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0006_wolfgd_talent_0_effectbuff: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: 1,
      waitFirstTriggerInterval: false,
      maxTriggerCount: -1,
      presentation: {
        visible: true,
        iconId: 'icon_battle_wolfgd_talent_1',
        iconPath: '/icons/icon_battle_wolfgd_talent_1.webp',
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
      blackboard: { add: 0, duration: 0 },
      attributeModifiers: [
        { attribute: 'heatDamageIncrease', slot: 'baseAddition', value: { blackboardKey: 'add' } },
      ],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0006_wolfgd_combo_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Category/EnergyShard/Pulse',
      ],
      lifetime: { kind: 'limited', durationSeconds: 1.5 },
      childSkill: {
        skillId: 'chr_0006_wolfgd_combo_skill_abilityrange',
        blackboard: {
          atk_scale: 5,
          duration: 0,
          move_speed_scalar: 1,
          poise: 0,
          radius: 5,
          usp: 0,
        },
        scheduledSequences: [
          scheduled(
            0,
            sequence(
              step('applyElementalInfliction', { element: 'heat', isExtra: false }),
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['comboSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                'abilityentity_chr_0006_wolfgd_combo_skill:chr_0006_wolfgd_combo_skill_abilityrange:/childSkill/scheduledSequences/0/sequence/steps/1',
              ),
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'blackboard', key: 'usp' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'caster',
              }),
            ),
            0,
          ),
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default wulfgard;
