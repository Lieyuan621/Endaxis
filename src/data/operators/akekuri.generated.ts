/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type { OperatorDefinition, SkillDefinition } from '../../core/game-data/operatorDefinition';
import { branch, scheduled, sequence, step, withSkillBlackboard } from './definitionHelpers';

export const akekuriChr_0019_karin_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0019_karin_attack1',
    timelineBlockFrames: 14,
    naturalDurationFrames: 90,
    exclusiveFrame: 17,
    offsetRecordFrame: 9,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 1,
          endFrame: 32,
          input: 'basicAttack',
          targetSkillId: 'chr_0019_karin_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 14, endFrame: 32, skillIds: ['chr_0019_karin_attack2'] }],
    },
    costFrame: 9,
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
            },
            'chr_0019_karin_attack1:/scheduledSequences/0/sequence/steps/0',
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
        10,
      ),
      scheduled(
        14,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0019_karin_attack2'] })),
        32,
      ),
    ],
    timelineContinuationSkillId: 'chr_0019_karin_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45] },
);

export const akekuriChr_0019_karin_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0019_karin_attack2',
    timelineBlockFrames: 22,
    naturalDurationFrames: 112,
    exclusiveFrame: 28,
    offsetRecordFrame: 16,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 13,
          endFrame: 38,
          input: 'basicAttack',
          targetSkillId: 'chr_0019_karin_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 22, endFrame: 38, skillIds: ['chr_0019_karin_attack3'] }],
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
            'chr_0019_karin_attack2:/scheduledSequences/0/sequence/steps/0',
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
        9,
      ),
      scheduled(
        16,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
              tags: ['normalAttack'],
            },
            'chr_0019_karin_attack2:/scheduledSequences/1/sequence/steps/0',
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
        17,
      ),
      scheduled(
        22,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0019_karin_attack3'] })),
        38,
      ),
    ],
    timelineContinuationSkillId: 'chr_0019_karin_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.13, 0.14, 0.15, 0.16, 0.18, 0.19, 0.2, 0.21, 0.23, 0.24, 0.26, 0.28],
    atk_scale_2: [0.15, 0.17, 0.18, 0.2, 0.21, 0.23, 0.24, 0.26, 0.27, 0.29, 0.31, 0.34],
    display_atk_scale: [0.28, 0.3, 0.33, 0.36, 0.39, 0.41, 0.44, 0.47, 0.5, 0.53, 0.57, 0.62],
  },
);

export const akekuriChr_0019_karin_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0019_karin_attack3',
    timelineBlockFrames: 21,
    naturalDurationFrames: 95,
    exclusiveFrame: 27,
    offsetRecordFrame: 10,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 11,
          endFrame: 36,
          input: 'basicAttack',
          targetSkillId: 'chr_0019_karin_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 21, endFrame: 36, skillIds: ['chr_0019_karin_attack4'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        10,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0019_karin_attack3:/scheduledSequences/0/sequence/steps/0',
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
                durationSeconds: { kind: 'constant', value: 0.15 },
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
        11,
      ),
      scheduled(
        21,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0019_karin_attack4'] })),
        36,
      ),
    ],
    timelineContinuationSkillId: 'chr_0019_karin_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.33, 0.36, 0.39, 0.42, 0.46, 0.49, 0.52, 0.55, 0.59, 0.63, 0.67, 0.73] },
);

export const akekuriChr_0019_karin_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0019_karin_attack4',
    timelineBlockFrames: 35,
    naturalDurationFrames: 110,
    exclusiveFrame: 34,
    offsetRecordFrame: 19,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 24,
          endFrame: 52,
          input: 'basicAttack',
          targetSkillId: 'chr_0019_karin_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 35, endFrame: 52, skillIds: ['chr_0019_karin_attack1'] }],
    },
    costFrame: 9,
    scheduledSequences: [
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
            'chr_0019_karin_attack4:/scheduledSequences/0/sequence/steps/0',
          ),
        ),
        20,
      ),
      scheduled(
        20,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0019_karin_attack4:/scheduledSequences/1/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
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
        21,
      ),
      scheduled(
        21,
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
            'chr_0019_karin_attack4:/scheduledSequences/2/sequence/steps/0',
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
        22,
      ),
      scheduled(
        35,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0019_karin_attack1'] })),
        52,
      ),
    ],
    timelineContinuationSkillId: 'chr_0019_karin_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 19,
    atk_scale: [0.17, 0.18, 0.2, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.37],
    poise: 17,
    display_atk_scale: [0.5, 0.54, 0.59, 0.64, 0.69, 0.74, 0.79, 0.84, 0.89, 0.95, 1.03, 1.11],
  },
);

export const akekuriChr_0019_karin_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0019_karin_power_attack',
    timelineBlockFrames: 37,
    naturalDurationFrames: 137,
    exclusiveFrame: 60,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 37,
          endFrame: 60,
          skillIds: ['chr_0019_karin_normal_skill', 'chr_0019_karin_combo_skill'],
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
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.2,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0019_karin_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.16 },
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
        36,
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
            'chr_0019_karin_power_attack:/scheduledSequences/1/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(step('gainFinisherSp', { factor: 1, recipient: 'team' })),
            undefined,
            { alwaysNext: true },
          ),
        ),
        37,
      ),
      scheduled(
        40,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.35 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'common' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
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
        36,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const akekuriChr_0019_karin_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0019_karin_plunging_attack_end',
    timelineBlockFrames: 14,
    naturalDurationFrames: 95,
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
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack', 'plungingAttack'],
            },
            'chr_0019_karin_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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

export const akekuriChr_0019_karin_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0019_karin_normal_skill',
    timelineBlockFrames: 41,
    naturalDurationFrames: 125,
    exclusiveFrame: 40,
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
        20,
        sequence(
          step('applyElementalInfliction', { element: 'heat', isExtra: false }),
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0019_karin_normal_skill:/scheduledSequences/1/sequence/steps/1',
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
        ),
        21,
      ),
      scheduled(20, sequence(step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 })), 21),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  { atk_scale: [1.42, 1.56, 1.71, 1.85, 1.99, 2.13, 2.28, 2.42, 2.56, 2.74, 2.95, 3.2], poise: 10 },
);

export const akekuriChr_0019_karin_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0019_karin_ultimate_skill',
    timelineBlockFrames: 129,
    naturalDurationFrames: 233,
    exclusiveFrame: 150,
    offsetRecordFrame: 0,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 120,
          endFrame: 201,
          input: 'basicAttack',
          targetSkillId: 'chr_0019_karin_attack1',
        },
      ],
      allowedNextSkills: [
        {
          startFrame: 129,
          endFrame: 201,
          skillIds: [
            'chr_0019_karin_normal_skill',
            'chr_0019_karin_attack1',
            'chr_0019_karin_combo_skill',
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
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential_3', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0019_karin_potential_3',
                target: 'party',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                copiedBlackboardAssignments: { atk: 'atk' },
              }),
            ),
          ),
        ),
        150,
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
          step('storeSourceAttributeValue', {
            attribute: { kind: 'secondary' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'blackboard', key: 'sub_ratio' },
            base: { kind: 'constant', value: 1 },
            targetKey: 'atb_up',
          }),
          step('modifyActionValue', {
            key: 'max_ratio',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'atb_up', fallback: 0 },
              operator: 'less',
              right: { kind: 'blackboard', key: 'max_ratio', fallback: 0 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'atb_1',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'atb_up' },
              }),
              step('modifyActionValue', {
                key: 'atb_2',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'atb_up' },
              }),
              step('modifyActionValue', {
                key: 'atb_3',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'atb_up' },
              }),
            ),
            sequence(
              step('modifyActionValue', {
                key: 'atb_1',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'max_ratio' },
              }),
              step('modifyActionValue', {
                key: 'atb_2',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'max_ratio' },
              }),
              step('modifyActionValue', {
                key: 'atb_3',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'max_ratio' },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        12,
      ),
      scheduled(
        59,
        sequence(
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atb_1' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          }),
        ),
        83,
      ),
      scheduled(
        86,
        sequence(
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atb_2' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          }),
        ),
        115,
      ),
      scheduled(
        119,
        sequence(
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atb_3' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'gain',
            spGainSource: 'skill',
          }),
        ),
        159,
      ),
      scheduled(
        0,
        sequence(
          step('findCharacterTeamTargets', {
            saveToContextKey: 'main_char',
            selection: { kind: 'controlledOperator' },
          }),
        ),
        1,
      ),
      scheduled(
        1,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'combo', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0019_karin_talent_2',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                copiedBlackboardAssignments: { potential_5_duration: 'potential_5_duration' },
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0019_karin_talent_2_combo',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: { imbue_scale: 'imbue_scale', duration: 'duration' },
              }),
            ),
          ),
        ),
        150,
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
        83,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 55),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        55,
      ),
    ],
    cooldownFrames: 600,
    costs: [{ resource: 'ultimateEnergy', value: 120 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atb_1: [19, 19, 20, 21, 21, 22, 23, 23, 24, 25, 25, 26],
    atb_2: [19, 20, 21, 21, 22, 23, 23, 24, 25, 25, 26, 27],
    atb_3: [20, 21, 21, 22, 23, 23, 24, 25, 25, 26, 27, 27],
    atb_up: 1,
    atk: 0,
    combo: 0,
    duration: 10,
    imbue_scale: 0,
    max_ratio: 0,
    potential_3: 0,
    potential_5_duration: 0,
    sub_ratio: 0,
  },
);

export const akekuriChr_0019_karin_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0019_karin_combo_skill',
    timelineBlockFrames: 56,
    naturalDurationFrames: 136,
    exclusiveFrame: 55,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 38, endFrame: 71, skillIds: ['chr_0019_karin_normal_skill'] },
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
        22,
        sequence(
          step('modifyActionValue', {
            key: 'sub_ratio',
            operation: 'divide',
            value: { kind: 'blackboard', key: 'rate' },
          }),
          step('storeSourceAttributeValue', {
            attribute: { kind: 'secondary' },
            stage: 'finalNonConverted',
            useFloor: false,
            divisor: { kind: 'constant', value: 1 },
            multiplier: { kind: 'blackboard', key: 'sub_ratio' },
            base: { kind: 'constant', value: 1 },
            targetKey: 'atb_up',
          }),
          step('modifyActionValue', {
            key: 'max_ratio',
            operation: 'add',
            value: { kind: 'constant', value: 1 },
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'atb_up', fallback: 0 },
              operator: 'less',
              right: { kind: 'blackboard', key: 'max_ratio', fallback: 0 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'atb',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'atb_up' },
              }),
            ),
            sequence(
              step('modifyActionValue', {
                key: 'atb',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'max_ratio' },
              }),
            ),
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
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0019_karin_combo_skill:/scheduledSequences/1/sequence/steps/5',
          ),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'count', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 0 },
            },
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
              step('modifyActionValue', {
                key: 'count',
                operation: 'add',
                value: { kind: 'constant', value: 1 },
              }),
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
        26,
      ),
      scheduled(
        31,
        sequence(
          step('modifyActionValue', {
            key: 'count',
            operation: 'assign',
            value: { kind: 'constant', value: 0 },
          }),
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
            'chr_0019_karin_combo_skill:/scheduledSequences/2/sequence/steps/2',
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
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.1 },
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
            undefined,
            { alwaysNext: true },
          ),
        ),
        36,
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
    cooldownFrames: [300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 300, 270],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atb: 7.5,
    atb_up: 1,
    atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8],
    count: 0,
    max_ratio: 0,
    poise: 5,
    rate: 10,
    sub_ratio: 0,
    usp: 5,
  },
);

export const akekuriCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const akekuri: OperatorDefinition = {
  slug: 'akekuri',
  gameId: 'AKEKURI',
  rarity: 4,
  weaponType: 'sword',
  element: 'heat',
  role: 'vanguard',
  mainAttribute: 'agility',
  secondaryAttribute: 'intellect',
  attributes: {
    strength: [13, 34, 55, 77, 99, 110],
    agility: [15, 42, 70, 98, 126, 140],
    intellect: [12, 32, 53, 75, 96, 106],
    will: [9, 30, 52, 74, 96, 108],
    baseAttack: [30, 92, 157, 222, 287, 319],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        akekuriChr_0019_karin_attack1,
        akekuriChr_0019_karin_attack2,
        akekuriChr_0019_karin_attack3,
        akekuriChr_0019_karin_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: akekuriChr_0019_karin_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: akekuriChr_0019_karin_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: akekuriChr_0019_karin_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: akekuriChr_0019_karin_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: akekuriChr_0019_karin_combo_skill,
    },
  ],
  dodgeSkill: akekuriCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0019_karin_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0019_karin_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0019_karin_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0019_karin_attack1',
        'chr_0019_karin_attack2',
        'chr_0019_karin_attack3',
        'chr_0019_karin_attack4',
        'chr_0019_karin_plunging_attack_end',
        'chr_0019_karin_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0019_karin_attack1',
        'chr_0019_karin_attack2',
        'chr_0019_karin_attack3',
        'chr_0019_karin_attack4',
      ],
      defaultSkillKey: 'chr_0019_karin_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0019_karin_combo_skill',
      event: 'poiseZero',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          { kind: 'contextTargetObjectTypeMatch', contextKey: 'trigger', objectTypes: ['enemy'] },
          sequence(),
        ),
      ),
    },
    {
      key: 'native-combo:1',
      skillKey: 'chr_0019_karin_combo_skill',
      event: 'poiseKnotBreak',
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
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'sub_ratio',
          operation: 'assign',
          value: [0.01, 0.015],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'max_ratio',
          operation: 'assign',
          value: [0.5, 0.75],
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
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'combo',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'imbue_scale',
          operation: 'assign',
          value: 0.2,
        },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0019_karin_potential_1',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: {
            atk_up: { kind: 'constant', value: 0.1 },
            duration: { kind: 'constant', value: 10 },
            max_stack: { kind: 'constant', value: 5 },
          },
        }),
      ),
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['agility'], value: 10 },
        { kind: 'addBuildAttribute', attributes: ['intellect'], value: 10 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_3',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk',
          operation: 'assign',
          value: 0.1,
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
          multiplier: 0.9,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_5_duration',
          operation: 'assign',
          value: 5,
        },
      ],
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0019_karin_potential_5',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
        }),
      ),
    },
  ],
  buffDefinitions: {
    buff_chr_0019_karin_potential_1: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_up: 0, duration: 0, max_stack: 1 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'skillSpGained',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventSpGainMatch', sources: ['skill'], gainKinds: ['gain'] },
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0019_karin_potential_1_1',
                  target: 'buffOwner',
                  source: 'buffOwner',
                  inheritSourceSkillCastInfo: true,
                  copiedBlackboardAssignments: { duration: 'duration', atk_up: 'atk_up' },
                }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0019_karin_potential_1_1: {
      stackingType: 'enhanceAndRefresh',
      priority: 0,
      maxStackCount: 5,
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
      blackboard: { atk_up: 0, duration: 5, max_stack: 1 },
      attributeModifiers: [
        { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk_up' } },
      ],
    },
    buff_chr_0019_karin_potential_3: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
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
      blackboard: { atk: 0.1 },
      attributeModifiers: [
        { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'atk' } },
      ],
    },
    buff_chr_0019_karin_potential_5: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0019_karin_potential_5_combo: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'potential_5_duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { potential_5_duration: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(
          step('finishBuffsById', {
            target: 'buffOwner',
            buffIds: ['buff_chr_0019_karin_talent_2_combo'],
            reason: 'other',
          }),
        ),
      },
    },
    buff_chr_0019_karin_talent_2: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { potential_5_duration: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'buffOwner',
              buffIds: ['buff_chr_0019_karin_potential_5'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0019_karin_potential_5_combo',
                target: 'buffOwner',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: { potential_5_duration: 'potential_5_duration' },
              }),
            ),
            sequence(
              step('finishBuffsById', {
                target: 'buffOwner',
                buffIds: ['buff_chr_0019_karin_talent_2_combo'],
                reason: 'other',
              }),
            ),
            { alwaysNext: true },
          ),
        ),
      },
    },
    buff_chr_0019_karin_talent_2_combo: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0, imbue_scale: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
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
            source: 'buffOwner',
            finishByAction: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'duration' },
              imbue_scale: { kind: 'blackboard', key: 'imbue_scale' },
            },
          }),
        ),
      },
    },
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default akekuri;
