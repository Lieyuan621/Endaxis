/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type { OperatorDefinition, SkillDefinition } from '../../core/game-data/operatorDefinition';
import {
  branch,
  scheduled,
  sequence,
  step,
  withActionBlackboardScope,
  withSkillBlackboard,
} from './definitionHelpers';

export const perlicaChr_0004_pelica_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0004_pelica_attack1',
    timelineBlockFrames: 16,
    naturalDurationFrames: 166,
    exclusiveFrame: 15,
    offsetRecordFrame: 8,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 5,
          endFrame: 27,
          input: 'basicAttack',
          targetSkillId: 'chr_0004_pelica_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 16, endFrame: 27, skillIds: ['chr_0004_pelica_attack2'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        8,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0004_pelica_attack1.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:projectile_chr_0004_pelica_normal_attack1',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0004_pelica_attack1.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:chr_0004_pelica_attack1_projhit',
                { atb: 0, atk_scale: 0 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'electric',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack'],
                    },
                    'chr_0004_pelica_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0/body/steps/0',
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
        8,
      ),
      scheduled(
        16,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0004_pelica_attack2'] })),
        27,
      ),
    ],
    timelineContinuationSkillId: 'chr_0004_pelica_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.25, 0.28, 0.31, 0.33, 0.36, 0.38, 0.41, 0.43, 0.46, 0.49, 0.53, 0.57] },
);

export const perlicaChr_0004_pelica_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0004_pelica_attack2',
    timelineBlockFrames: 18,
    naturalDurationFrames: 168,
    exclusiveFrame: 22,
    offsetRecordFrame: 12,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 28,
          input: 'basicAttack',
          targetSkillId: 'chr_0004_pelica_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 18, endFrame: 28, skillIds: ['chr_0004_pelica_attack3'] }],
    },
    costFrame: 11,
    scheduledSequences: [
      scheduled(
        9,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0004_pelica_attack2.actionGroupData.timelineActions[1]._sequenceActionData.actionData[0]:projectile_chr_0004_pelica_normal_attack2',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0004_pelica_attack2.actionGroupData.timelineActions[1]._sequenceActionData.actionData[0]:chr_0004_pelica_attack2_projhit',
                { atb: 0, atk_scale: 0 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'electric',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack'],
                    },
                    'chr_0004_pelica_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0/body/steps/0',
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
        9,
      ),
      scheduled(
        12,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0004_pelica_attack2.actionGroupData.timelineActions[2]._sequenceActionData.actionData[0]:projectile_chr_0004_pelica_normal_attack2',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0004_pelica_attack2.actionGroupData.timelineActions[2]._sequenceActionData.actionData[0]:chr_0004_pelica_attack2_projhit',
                { atb: 0, atk_scale: 0 },
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'electric',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack'],
                    },
                    'chr_0004_pelica_attack2:/scheduledSequences/1/sequence/steps/0/body/steps/0/body/steps/0',
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
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0004_pelica_attack3'] })),
        28,
      ),
    ],
    timelineContinuationSkillId: 'chr_0004_pelica_attack3',
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

export const perlicaChr_0004_pelica_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0004_pelica_attack3',
    timelineBlockFrames: 26,
    naturalDurationFrames: 173,
    exclusiveFrame: 29,
    offsetRecordFrame: 22,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 8,
          endFrame: 40,
          input: 'basicAttack',
          targetSkillId: 'chr_0004_pelica_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 26, endFrame: 40, skillIds: ['chr_0004_pelica_attack4'] }],
    },
    costFrame: 13,
    scheduledSequences: [
      scheduled(
        16,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0004_pelica_attack3.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:projectile_chr_0004_pelica_normal_attack3',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0004_pelica_attack3.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:chr_0004_pelica_attack3_projhit',
                {},
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'electric',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack'],
                    },
                    'chr_0004_pelica_attack3:/scheduledSequences/0/sequence/steps/0/body/steps/0/body/steps/0',
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
        16,
      ),
      scheduled(
        19,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0004_pelica_attack3.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0]:projectile_chr_0004_pelica_normal_attack3',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0004_pelica_attack3.actionGroupData.timelineActions[4]._sequenceActionData.actionData[0]:chr_0004_pelica_attack3_projhit',
                {},
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'electric',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack'],
                    },
                    'chr_0004_pelica_attack3:/scheduledSequences/1/sequence/steps/0/body/steps/0/body/steps/0',
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
        19,
      ),
      scheduled(
        22,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0004_pelica_attack3.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:projectile_chr_0004_pelica_normal_attack3',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0004_pelica_attack3.actionGroupData.timelineActions[5]._sequenceActionData.actionData[0]:chr_0004_pelica_attack3_projhit',
                {},
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'electric',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack'],
                    },
                    'chr_0004_pelica_attack3:/scheduledSequences/2/sequence/steps/0/body/steps/0/body/steps/0',
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
        22,
      ),
      scheduled(
        26,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0004_pelica_attack4'] })),
        40,
      ),
    ],
    timelineContinuationSkillId: 'chr_0004_pelica_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.12, 0.14, 0.15, 0.16, 0.17, 0.19, 0.2, 0.21, 0.22, 0.24, 0.26, 0.28],
    display_atk_scale: [0.37, 0.41, 0.45, 0.48, 0.52, 0.56, 0.59, 0.63, 0.67, 0.71, 0.77, 0.84],
  },
);

export const perlicaChr_0004_pelica_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0004_pelica_attack4',
    timelineBlockFrames: 44,
    naturalDurationFrames: 269,
    exclusiveFrame: 43,
    offsetRecordFrame: 27,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 29,
          endFrame: 64,
          input: 'basicAttack',
          targetSkillId: 'chr_0004_pelica_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 54, endFrame: 64, skillIds: ['chr_0004_pelica_attack1'] }],
    },
    costFrame: 13,
    scheduledSequences: [
      scheduled(
        27,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0004_pelica_attack4.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:projectile_chr_0004_pelica_normal_attack4',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0004_pelica_attack4.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:chr_0004_pelica_attack4_projhit',
                {},
                true,
                sequence(
                  step(
                    'dealDamage',
                    {
                      damageType: 'electric',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['normalAttack', 'normalAttackLastCombo'],
                      stagger: { kind: 'blackboard', key: 'poise' },
                      staggerOnlyWhenCasterControlled: true,
                    },
                    'chr_0004_pelica_attack4:/scheduledSequences/0/sequence/steps/0/body/steps/0/body/steps/0',
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
        27,
      ),
      scheduled(
        54,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0004_pelica_attack1'] })),
        64,
      ),
    ],
    timelineContinuationSkillId: 'chr_0004_pelica_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 15,
    atk_scale: [0.57, 0.62, 0.68, 0.73, 0.79, 0.85, 0.9, 0.96, 1.02, 1.09, 1.17, 1.27],
    poise: 15,
  },
);

export const perlicaChr_0004_pelica_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0004_pelica_power_attack',
    timelineBlockFrames: 35,
    naturalDurationFrames: 135,
    exclusiveFrame: 50,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 35,
          endFrame: 58,
          skillIds: ['chr_0004_pelica_normal_skill', 'chr_0004_pelica_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        35,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 1,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0004_pelica_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('applyKnockDown', {
                target: 'enemy',
                duration: { kind: 'constant', value: 1.5 },
                force: true,
                isExtra: false,
                targetFilter: 'skipAll',
                returnWhen: 'always',
              }),
              step('gainFinisherSp', { factor: 1, recipient: 'team' }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        44,
      ),
      scheduled(
        35,
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
        38,
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
        35,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const perlicaChr_0004_pelica_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0004_pelica_plunging_attack_end',
    timelineBlockFrames: 21,
    naturalDurationFrames: 168,
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
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'plungingAttack'],
            },
            'chr_0004_pelica_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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
        8,
      ),
      scheduled(
        1,
        sequence(
          step('launchProjectileLifetime', {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
          }),
          step('launchProjectileLifetime', {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
          }),
          step('launchProjectileLifetime', {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
          }),
          step('launchProjectileLifetime', {
            finish: 'firstTickReach',
            recycleDelaySeconds: 0.0333333350718021,
          }),
        ),
        1,
      ),
    ],
    skillType: 'plungingAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
);

export const perlicaChr_0004_pelica_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0004_pelica_normal_skill',
    timelineBlockFrames: 31,
    naturalDurationFrames: 155,
    exclusiveFrame: 30,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 28, endFrame: 54, skillIds: ['chr_0004_pelica_normal_skill'] },
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
        13,
        sequence(
          step('applyElementalInfliction', { element: 'electric', isExtra: false }),
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0004_pelica_normal_skill:/scheduledSequences/1/sequence/steps/1',
          ),
          step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
        ),
        13,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  { atk_scale: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.85, 3.02, 3.2, 3.42, 3.69, 4], poise: 10 },
);

export const perlicaChr_0004_pelica_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0004_pelica_combo_skill',
    timelineBlockFrames: 46,
    naturalDurationFrames: 115,
    exclusiveFrame: 45,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 25, endFrame: 54, skillIds: ['chr_0004_pelica_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        24,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0004_pelica_combo_skill.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:projectile_chr_0004_pelica_combo_skill',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0004_pelica_combo_skill.actionGroupData.timelineActions[3]._sequenceActionData.actionData[0]:chr_0004_pelica_combo_skill_projhit',
                {
                  atb: 0,
                  atk_scale: 1,
                  duration: 5,
                  extra_scaling: 1,
                  level: 1,
                  poise: 0,
                  talent2: 0,
                  usp: 0,
                },
                true,
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_common_pulse_pulse_conduct_triggered',
                    target: 'enemy',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: {
                      duration: 'duration',
                      extra_scaling: 'extra_scaling',
                    },
                  }),
                  step(
                    'dealDamage',
                    {
                      damageType: 'electric',
                      attackScale: { kind: 'blackboard', key: 'atk_scale' },
                      tags: ['comboSkill'],
                      features: ['canBreakWeakness'],
                      stagger: { kind: 'blackboard', key: 'poise' },
                    },
                    'chr_0004_pelica_combo_skill:/scheduledSequences/0/sequence/steps/0/body/steps/0/body/steps/1',
                  ),
                  step('changeResourceByActionValue', {
                    resource: 'ultimateEnergy',
                    amount: { kind: 'blackboard', key: 'usp' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'caster',
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
        27,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.833 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        22,
      ),
    ],
    cooldownFrames: [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 570],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    duration: 5,
    extra_scaling: 1,
    poise: 10,
    talent2: 0,
    usp: 10,
  },
);

export const perlicaChr_0004_pelica_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0004_pelica_ultimate_skill',
    timelineBlockFrames: 86,
    naturalDurationFrames: 114,
    exclusiveFrame: 85,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 63,
          endFrame: 90,
          skillIds: ['chr_0004_pelica_normal_skill', 'chr_0004_pelica_combo_skill'],
        },
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
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        50,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 52),
      scheduled(
        58,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              instantAttributeModifiers: [
                {
                  targetSide: 'attacker',
                  attribute: 'criticalRate',
                  slot: 'baseAddition',
                  value: { kind: 'blackboard', key: 'crit' },
                  attributeTiming: 'runtime',
                },
              ],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0004_pelica_ultimate_skill:/scheduledSequences/3/sequence/steps/0',
          ),
        ),
        63,
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
        85,
      ),
      scheduled(
        55,
        sequence(
          step('spawnAbilityEntity', {
            abilityEntityId: 'abilityentity_chr_0004_pelica_ultimate_skill',
            childSkillId: 'chr_0004_pelica_ultimate_skill_abilityrange',
            inheritActionBlackboard: true,
            dieWhenSourceDies: false,
          }),
        ),
        58,
      ),
    ],
    cooldownFrames: 300,
    costs: [{ resource: 'ultimateEnergy', value: 80 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale: [4.45, 4.89, 5.34, 5.78, 6.22, 6.67, 7.11, 7.56, 8, 8.56, 9.23, 10],
    atk_scale_2: 0,
    crit: 0,
    poise: 20,
    radius: 4,
    select_radius: 10,
  },
);

export const perlicaCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const perlica: OperatorDefinition = {
  slug: 'perlica',
  gameId: 'PERLICA',
  rarity: 5,
  weaponType: 'arts-unit',
  element: 'electric',
  role: 'caster',
  mainAttribute: 'intellect',
  secondaryAttribute: 'will',
  attributes: {
    strength: [9, 26, 45, 64, 82, 91],
    agility: [9, 27, 46, 65, 84, 93],
    intellect: [21, 51, 83, 114, 145, 161],
    will: [13, 34, 57, 79, 102, 113],
    baseAttack: [30, 88, 150, 211, 272, 303],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        perlicaChr_0004_pelica_attack1,
        perlicaChr_0004_pelica_attack2,
        perlicaChr_0004_pelica_attack3,
        perlicaChr_0004_pelica_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: perlicaChr_0004_pelica_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: perlicaChr_0004_pelica_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: perlicaChr_0004_pelica_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: perlicaChr_0004_pelica_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: perlicaChr_0004_pelica_ultimate_skill,
    },
  ],
  dodgeSkill: perlicaCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0004_pelica_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0004_pelica_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0004_pelica_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0004_pelica_attack1',
        'chr_0004_pelica_attack2',
        'chr_0004_pelica_attack3',
        'chr_0004_pelica_attack4',
        'chr_0004_pelica_plunging_attack_end',
        'chr_0004_pelica_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0004_pelica_attack1',
        'chr_0004_pelica_attack2',
        'chr_0004_pelica_attack3',
        'chr_0004_pelica_attack4',
      ],
      defaultSkillKey: 'chr_0004_pelica_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0004_pelica_combo_skill',
      event: 'beforeTakeDamage',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalAttackLastCombo'] },
          sequence(
            branch(
              { kind: 'eventSourceControlled' },
              sequence(
                branch(
                  {
                    kind: 'contextTargetObjectTypeMatch',
                    contextKey: 'trigger',
                    objectTypes: ['enemy'],
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
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0004_pelica_talent_0',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { dmg: [0.2, 0.3] },
        }),
      ),
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent2',
          operation: 'assign',
          value: 1,
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
          blackboardKey: 'duration',
          operation: 'multiply',
          value: 1.75,
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
          buffId: 'buff_chr_0004_pelica_potential_3',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: {
            atk_up: { kind: 'constant', value: 0.2 },
            atk_duration: { kind: 'constant', value: 5 },
            max_stack: { kind: 'constant', value: 2 },
          },
        }),
      ),
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'extra_scaling',
          operation: 'assign',
          value: 1.33,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'crit',
          operation: 'add',
          value: 0.3,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0004_pelica_potential_3: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 20,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_duration: 0, atk_up: 0, max_stack: 0 },
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
                buffTags: ['Skill/Character/Common/SpellStatus/Conduct'],
              },
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0004_pelica_potential_3_atkup',
                  target: 'buffOwner',
                  source: 'buffSource',
                  inheritSourceSkillCastInfo: true,
                  copiedBlackboardAssignments: { atk_up: 'atk_up', atk_duration: 'atk_duration' },
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0004_pelica_potential_3_atkup: {
      stackingType: 'enhanceAndRefresh',
      priority: 0,
      maxStackCount: 2,
      durationSeconds: { blackboardKey: 'atk_duration' },
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
      blackboard: { atk_duration: 0, atk_up: 0 },
      attributeModifiers: [
        { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
      ],
    },
    buff_chr_0004_pelica_talent_0: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: ['Skill/Character/chr_0004_pelica/PelicaTalent0'],
      extendTags: [],
      blackboard: { dmg: 0 },
      attributeModifiers: [],
      damageModifiers: [
        {
          enabledSide: 'attacker',
          condition: {
            kind: 'targetPoiseCompare',
            target: 'enemy',
            returnValueIfMissing: false,
            operator: 'equal',
            value: 0,
          },
          processors: [
            {
              kind: 'damageScale',
              side: 'attacker',
              zone: 'normal',
              addition: { blackboardKey: 'dmg' },
            },
          ],
        },
      ],
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0004_pelica_ultimate_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
      ],
      lifetime: { kind: 'limited', durationSeconds: 50 },
      childSkill: {
        skillId: 'chr_0004_pelica_ultimate_skill_abilityrange',
        blackboard: {},
        scheduledSequences: [
          scheduled(54, sequence(step('finishActionOwnerAbilityEntity', {})), 54),
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default perlica;
