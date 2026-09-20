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
  scheduled,
  sequence,
  step,
  withActionBlackboardScope,
  withSkillBlackboard,
} from './definitionHelpers';

const sharedActionSequence1: ActionSequenceDefinition = sequence(
  {
    kind: 'withActionBlackboardScope',
    parameters: {
      scopeKey: 'chr_0012_avywen_combo_skill_lance_back_reach:immediate-timeline:0',
      lifetime: 'execution',
      alwaysNext: true,
      shareParentBlackboard: true,
      initialValues: {},
      inheritParent: true,
    },
    body: sequence(
      step('startTimeDilation', {
        scope: 'global',
        durationSeconds: { kind: 'constant', value: 0.2 },
        slot: 'TimeDilation/Layer/Entity/HitStop',
        priority: 10,
        curve: {
          kind: 'inline',
          keys: [
            {
              time: 0,
              value: 0.2,
              inTangent: 0.04379496,
              outTangent: 0.04379496,
              weightedMode: 0,
              inWeight: 0,
              outWeight: 0,
            },
            {
              time: 0.8847446,
              value: 0.2387474,
              inTangent: 0.04379496,
              outTangent: 6.604918,
              weightedMode: 0,
              inWeight: 0,
              outWeight: 0,
            },
            {
              time: 1,
              value: 1,
              inTangent: 6.604918,
              outTangent: 6.604918,
              weightedMode: 0,
              inWeight: 0,
              outWeight: 0,
            },
          ],
        },
        finishByAction: false,
        ignoredTargets: ['controlled'],
      }),
    ),
  },
  {
    kind: 'withActionBlackboardScope',
    parameters: {
      scopeKey: 'chr_0012_avywen_combo_skill_lance_back_reach:immediate-timeline:1',
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
          left: { kind: 'blackboard', key: 'EntityBB_talent0', fallback: 0 },
          operator: 'greater',
          right: { kind: 'constant', value: 0 },
        },
        sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0012_avywen_talent_0'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'blackboard', key: 'EntityBB_talent0' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'caster',
              }),
            ),
          ),
        ),
      ),
    ),
  },
);

export const avywennaChr_0012_avywen_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0012_avywen_attack1',
    timelineBlockFrames: 8,
    naturalDurationFrames: 188,
    exclusiveFrame: 20,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 27,
          input: 'basicAttack',
          targetSkillId: 'chr_0012_avywen_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 8, endFrame: 27, skillIds: ['chr_0012_avywen_attack2'] }],
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
            'chr_0012_avywen_attack1:/scheduledSequences/0/sequence/steps/0',
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
        8,
      ),
      scheduled(
        8,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0012_avywen_attack2'] })),
        27,
      ),
    ],
    timelineContinuationSkillId: 'chr_0012_avywen_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.17, 0.18, 0.2, 0.21, 0.23, 0.25, 0.26, 0.28, 0.3, 0.32, 0.34, 0.37] },
);

export const avywennaChr_0012_avywen_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0012_avywen_attack2',
    timelineBlockFrames: 14,
    naturalDurationFrames: 224,
    exclusiveFrame: 17,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 25,
          input: 'basicAttack',
          targetSkillId: 'chr_0012_avywen_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 14, endFrame: 25, skillIds: ['chr_0012_avywen_attack3'] }],
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
            'chr_0012_avywen_attack2:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.07 },
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
            undefined,
            { alwaysNext: true },
          ),
        ),
        8,
      ),
      scheduled(
        14,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0012_avywen_attack3'] })),
        25,
      ),
    ],
    timelineContinuationSkillId: 'chr_0012_avywen_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.37, 0.39, 0.41, 0.45, 0.48] },
);

export const avywennaChr_0012_avywen_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0012_avywen_attack3',
    timelineBlockFrames: 10,
    naturalDurationFrames: 183,
    exclusiveFrame: 17,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 25,
          input: 'basicAttack',
          targetSkillId: 'chr_0012_avywen_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 10, endFrame: 25, skillIds: ['chr_0012_avywen_attack4'] }],
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
            'chr_0012_avywen_attack3:/scheduledSequences/0/sequence/steps/0',
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
        8,
      ),
      scheduled(
        10,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0012_avywen_attack4'] })),
        25,
      ),
    ],
    timelineContinuationSkillId: 'chr_0012_avywen_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.21, 0.23, 0.25, 0.27, 0.29, 0.31, 0.33, 0.35, 0.37, 0.39, 0.43, 0.46] },
);

export const avywennaChr_0012_avywen_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0012_avywen_attack4',
    timelineBlockFrames: 22,
    naturalDurationFrames: 208,
    exclusiveFrame: 30,
    offsetRecordFrame: 5,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 40,
          input: 'basicAttack',
          targetSkillId: 'chr_0012_avywen_attack5',
        },
      ],
      allowedNextSkills: [{ startFrame: 22, endFrame: 40, skillIds: ['chr_0012_avywen_attack5'] }],
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
            'chr_0012_avywen_attack4:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
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
            undefined,
            { alwaysNext: true },
          ),
        ),
        6,
      ),
      scheduled(
        18,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
              tags: ['normalAttack'],
            },
            'chr_0012_avywen_attack4:/scheduledSequences/1/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.22 },
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
        19,
      ),
      scheduled(
        22,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0012_avywen_attack5'] })),
        40,
      ),
    ],
    timelineContinuationSkillId: 'chr_0012_avywen_attack5',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.21, 0.23],
    atk_scale_2: [0.2, 0.22, 0.24, 0.26, 0.28, 0.3, 0.32, 0.34, 0.36, 0.39, 0.42, 0.45],
    display_atk_scale: [0.3, 0.33, 0.36, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.62, 0.68],
  },
);

export const avywennaChr_0012_avywen_attack5: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0012_avywen_attack5',
    timelineBlockFrames: 45,
    naturalDurationFrames: 192,
    exclusiveFrame: 45,
    offsetRecordFrame: 24,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 55,
          input: 'basicAttack',
          targetSkillId: 'chr_0012_avywen_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 45, endFrame: 55, skillIds: ['chr_0012_avywen_attack1'] }],
    },
    costFrame: 12,
    scheduledSequences: [
      scheduled(
        24,
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
            'chr_0012_avywen_attack5:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
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
        45,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0012_avywen_attack1'] })),
        55,
      ),
    ],
    timelineContinuationSkillId: 'chr_0012_avywen_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 19,
    atk_scale: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.96, 1.04, 1.13],
    poise: 17,
  },
);

export const avywennaChr_0012_avywen_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0012_avywen_power_attack',
    timelineBlockFrames: 29,
    naturalDurationFrames: 207,
    exclusiveFrame: 44,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 29,
          endFrame: 49,
          skillIds: ['chr_0012_avywen_normal_skill', 'chr_0012_avywen_combo_skill'],
        },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        27,
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
            'chr_0012_avywen_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(step('gainFinisherSp', { factor: 1, recipient: 'team' })),
            undefined,
            { alwaysNext: true },
          ),
        ),
        28,
      ),
      scheduled(
        28,
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
            'chr_0012_avywen_power_attack:/scheduledSequences/1/sequence/steps/0',
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
        29,
      ),
      scheduled(
        29,
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
            'chr_0012_avywen_power_attack:/scheduledSequences/2/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.5 },
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
        30,
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
        44,
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
        29,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const avywennaChr_0012_avywen_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0012_avywen_plunging_attack_end',
    timelineBlockFrames: 11,
    naturalDurationFrames: 228,
    exclusiveFrame: 15,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [{ startFrame: 11, endFrame: 15, skillIds: ['chr_0012_avywen_attack1'] }],
    },
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
            'chr_0012_avywen_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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

export const avywennaChr_0012_avywen_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0012_avywen_normal_skill',
    timelineBlockFrames: 34,
    naturalDurationFrames: 306,
    exclusiveFrame: 38,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 34, endFrame: 60, skillIds: ['chr_0012_avywen_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        0,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'lances',
            abilityEntityIds: [
              'abilityentity_chr_0012_avywen_combo_skill_lance',
              'abilityentity_chr_0012_avywen_ultimate_skill_lance',
            ],
          }),
          branch(
            {
              kind: 'contextTargetCountCompare',
              contextKey: 'lances',
              operator: 'greaterOrEqual',
              value: 1,
            },
            sequence(
              step('modifyActionValue', {
                key: 'lance_count',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
            ),
          ),
        ),
        3,
      ),
      scheduled(
        0,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(),
            sequence(
              step('findCharacterTeamTargets', {
                saveToContextKey: 'MainChar',
                selection: { kind: 'controlledOperator' },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        3,
      ),
      scheduled(18, sequence(step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 })), 21),
      scheduled(
        18,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0012_avywen_normal_skill:/scheduledSequences/3/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
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
        21,
      ),
      scheduled(
        0,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'lances',
            abilityEntityIds: [
              'abilityentity_chr_0012_avywen_combo_skill_lance',
              'abilityentity_chr_0012_avywen_ultimate_skill_lance',
            ],
          }),
          branch(
            {
              kind: 'contextTargetCountCompare',
              contextKey: 'lances',
              operator: 'greaterOrEqual',
              value: 1,
            },
            sequence(
              step('modifyActionValue', {
                key: 'lance_count',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
              forEachContextTarget('lances', sequence()),
            ),
          ),
        ),
        6,
      ),
      scheduled(
        7,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'ComboLances',
            abilityEntityIds: ['abilityentity_chr_0012_avywen_combo_skill_lance'],
          }),
          branch(
            {
              kind: 'contextTargetCountCompare',
              contextKey: 'ComboLances',
              operator: 'greaterOrEqual',
              value: 1,
            },
            sequence(
              step('modifyActionValue', {
                key: 'lance_count',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
              forEachContextTarget(
                'ComboLances',
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0012_avywen_lance_becalled',
                    target: 'currentAbilityEntity',
                    inheritSourceSkillCastInfo: true,
                  }),
                  withActionBlackboardScope(
                    'SkillData.chr_0012_avywen_normal_skill.actionGroupData.timelineActions[9]._sequenceActionData.actionData[3].action.actionData[3]:projectile_chr_0012_avywen_combo_skill_lance_back',
                    {},
                    true,
                    sequence(
                      withActionBlackboardScope(
                        'SkillData.chr_0012_avywen_normal_skill.actionGroupData.timelineActions[9]._sequenceActionData.actionData[3].action.actionData[3]:chr_0012_avywen_combo_skill_lance_back',
                        {
                          atk_scale_lance: 3,
                          poise_lance: 0,
                          potential_5_rate: 0,
                          radius: 4,
                          talent0_usp: 0,
                        },
                        true,
                        sequence(
                          step('modifyActionValue', {
                            key: 'EntityBB_talent0',
                            operation: 'assign',
                            value: { kind: 'blackboard', key: 'talent0_usp' },
                          }),
                          branch(
                            {
                              kind: 'all',
                              conditions: [
                                {
                                  kind: 'actionValueCompare',
                                  left: {
                                    kind: 'blackboard',
                                    key: 'potential_5_rate',
                                    fallback: 0,
                                  },
                                  operator: 'greater',
                                  right: { kind: 'constant', value: 0 },
                                },
                                {
                                  kind: 'buffStackCompare',
                                  target: 'enemy',
                                  tagQueryType: 'hasAny',
                                  buffTags: [
                                    'Skill/Character/Common/Affixes/Vulnerable/VulnerablePulse',
                                  ],
                                  operator: 'greaterOrEqual',
                                  value: { kind: 'constant', value: 1 },
                                },
                              ],
                            },
                            sequence(
                              step('modifyActionValue', {
                                key: 'atk_scale_lance',
                                operation: 'multiply',
                                value: { kind: 'blackboard', key: 'potential_5_rate' },
                              }),
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale_lance' },
                                  tags: ['normalSkill'],
                                  features: ['canBreakWeakness'],
                                  stagger: { kind: 'blackboard', key: 'poise_lance' },
                                },
                                'chr_0012_avywen_normal_skill:/scheduledSequences/5/sequence/steps/1/whenTrue/steps/1/body/steps/0/whenTrue/steps/1/body/steps/0/body/steps/0/whenTrue/steps/1/whenTrue/steps/1',
                              ),
                            ),
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale_lance' },
                                  tags: ['normalSkill'],
                                  features: ['canBreakWeakness'],
                                  stagger: { kind: 'blackboard', key: 'poise_lance' },
                                },
                                'chr_0012_avywen_normal_skill:/scheduledSequences/5/sequence/steps/1/whenTrue/steps/1/body/steps/0/whenTrue/steps/1/body/steps/0/body/steps/0/whenTrue/steps/1/whenFalse/steps/0',
                              ),
                            ),
                            { alwaysNext: true },
                          ),
                        ),
                        undefined,
                        { lifetime: 'execution', alwaysNext: true },
                      ),
                      withActionBlackboardScope(
                        'SkillData.chr_0012_avywen_normal_skill.actionGroupData.timelineActions[9]._sequenceActionData.actionData[3].action.actionData[3]:chr_0012_avywen_combo_skill_lance_back_reach',
                        { atk_scale: 3, radius: 4 },
                        true,
                        sharedActionSequence1,
                        undefined,
                        { lifetime: 'execution', alwaysNext: true },
                      ),
                    ),
                    { EntityBB_talent0: 0 },
                    { lifetime: 'execution' },
                  ),
                ),
              ),
            ),
          ),
        ),
        10,
      ),
      scheduled(
        7,
        sequence(
          step('findOwnerSpawnedAbilityEntities', {
            saveToContextKey: 'UltiLances',
            abilityEntityIds: ['abilityentity_chr_0012_avywen_ultimate_skill_lance'],
          }),
          branch(
            {
              kind: 'contextTargetCountCompare',
              contextKey: 'UltiLances',
              operator: 'greaterOrEqual',
              value: 1,
            },
            sequence(
              step('modifyActionValue', {
                key: 'lance_count',
                operation: 'assign',
                value: { kind: 'constant', value: 1 },
              }),
              forEachContextTarget(
                'UltiLances',
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0012_avywen_lance_becalled',
                    target: 'currentAbilityEntity',
                    inheritSourceSkillCastInfo: true,
                  }),
                  withActionBlackboardScope(
                    'SkillData.chr_0012_avywen_normal_skill.actionGroupData.timelineActions[10]._sequenceActionData.actionData[3].action.actionData[3]:projectile_chr_0012_avywen_ultimate_skill_lance_back',
                    {},
                    true,
                    sequence(
                      withActionBlackboardScope(
                        'SkillData.chr_0012_avywen_normal_skill.actionGroupData.timelineActions[10]._sequenceActionData.actionData[3].action.actionData[3]:chr_0012_avywen_ultimate_skill_lance_back',
                        {
                          atk_scale_lance_ult: 3,
                          poise_lance: 0,
                          poise_lance_ult: 0,
                          potential_5_rate: 0,
                          radius: 4,
                          talent0_usp: 0,
                        },
                        true,
                        sequence(
                          step('applyBuff', {
                            buffId: 'buff_chr_0012_avywen_lance_pulse_check',
                            target: 'enemy',
                            inheritSourceSkillCastInfo: true,
                          }),
                          step('modifyActionValue', {
                            key: 'EntityBB_talent0',
                            operation: 'assign',
                            value: { kind: 'blackboard', key: 'talent0_usp' },
                          }),
                          branch(
                            {
                              kind: 'all',
                              conditions: [
                                {
                                  kind: 'actionValueCompare',
                                  left: {
                                    kind: 'blackboard',
                                    key: 'potential_5_rate',
                                    fallback: 0,
                                  },
                                  operator: 'greater',
                                  right: { kind: 'constant', value: 0 },
                                },
                                {
                                  kind: 'buffStackCompare',
                                  target: 'enemy',
                                  tagQueryType: 'hasAny',
                                  buffTags: [
                                    'Skill/Character/Common/Affixes/Vulnerable/VulnerablePulse',
                                  ],
                                  operator: 'greaterOrEqual',
                                  value: { kind: 'constant', value: 1 },
                                },
                              ],
                            },
                            sequence(
                              step('modifyActionValue', {
                                key: 'atk_scale_lance_ult',
                                operation: 'multiply',
                                value: { kind: 'blackboard', key: 'potential_5_rate' },
                              }),
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale_lance_ult' },
                                  tags: ['normalSkill'],
                                  features: ['canBreakWeakness'],
                                  stagger: { kind: 'blackboard', key: 'poise_lance_ult' },
                                },
                                'chr_0012_avywen_normal_skill:/scheduledSequences/6/sequence/steps/1/whenTrue/steps/1/body/steps/0/whenTrue/steps/1/body/steps/0/body/steps/0/whenTrue/steps/2/whenTrue/steps/1',
                              ),
                              step('startTimeDilation', {
                                scope: 'entity',
                                durationSeconds: { kind: 'constant', value: 0.4 },
                                slot: 'TimeDilation/Layer/Entity/HitStop',
                                priority: 10,
                                curve: { kind: 'named', key: 'interrupt_weakness' },
                                finishByAction: false,
                                targets: ['enemy', 'caster'],
                              }),
                            ),
                            sequence(
                              step(
                                'dealDamage',
                                {
                                  damageType: 'electric',
                                  attackScale: { kind: 'blackboard', key: 'atk_scale_lance_ult' },
                                  tags: ['normalSkill'],
                                  features: ['canBreakWeakness'],
                                  stagger: { kind: 'blackboard', key: 'poise_lance_ult' },
                                },
                                'chr_0012_avywen_normal_skill:/scheduledSequences/6/sequence/steps/1/whenTrue/steps/1/body/steps/0/whenTrue/steps/1/body/steps/0/body/steps/0/whenTrue/steps/2/whenFalse/steps/0',
                              ),
                              step('startTimeDilation', {
                                scope: 'entity',
                                durationSeconds: { kind: 'constant', value: 0.4 },
                                slot: 'TimeDilation/Layer/Entity/HitStop',
                                priority: 10,
                                curve: { kind: 'named', key: 'interrupt_weakness' },
                                finishByAction: false,
                                targets: ['enemy', 'caster'],
                              }),
                            ),
                            { alwaysNext: true },
                          ),
                        ),
                        undefined,
                        { lifetime: 'execution', alwaysNext: true },
                      ),
                      withActionBlackboardScope(
                        'SkillData.chr_0012_avywen_normal_skill.actionGroupData.timelineActions[10]._sequenceActionData.actionData[3].action.actionData[3]:chr_0012_avywen_combo_skill_lance_back_reach',
                        { atk_scale: 3, radius: 4 },
                        true,
                        sharedActionSequence1,
                        undefined,
                        { lifetime: 'execution', alwaysNext: true },
                      ),
                    ),
                    { EntityBB_talent0: 0 },
                    { lifetime: 'execution' },
                  ),
                ),
              ),
            ),
          ),
        ),
        10,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atk_scale: [0.67, 0.73, 0.8, 0.87, 0.93, 1, 1.07, 1.13, 1.2, 1.28, 1.38, 1.5],
    atk_scale_lance: [0.75, 0.82, 0.9, 0.97, 1.04, 1.12, 1.19, 1.27, 1.34, 1.44, 1.55, 1.68],
    atk_scale_lance_ult: [1.92, 2.11, 2.3, 2.5, 2.69, 2.88, 3.07, 3.26, 3.46, 3.7, 3.98, 4.32],
    lance_count: 0,
    poise: 5,
    poise_lance: 5,
    poise_lance_ult: 10,
    potential_5_rate: 0,
    talent0_usp: 0,
  },
);

export const avywennaChr_0012_avywen_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0012_avywen_combo_skill',
    timelineBlockFrames: 21,
    naturalDurationFrames: 254,
    exclusiveFrame: 40,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 21, endFrame: 68, skillIds: ['chr_0012_avywen_normal_skill'] },
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
                saveToContextKey: 'MainChar',
                selection: { kind: 'controlledOperator' },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        3,
      ),
      scheduled(
        14,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0012_avywen_combo_skill.actionGroupData.timelineActions[6]._sequenceActionData.actionData[4]:projectile_chr_0012_avywen_combo_skill_lance_out',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0012_avywen_combo_skill.actionGroupData.timelineActions[6]._sequenceActionData.actionData[4]:chr_0012_avywen_combo_skill_lance_gene',
                { atk_scale_lance_back: 1, potential_2: 0, radius: 4, talent_atb_gain: 0 },
                true,
                sequence(
                  step('spawnAbilityEntity', {
                    abilityEntityId: 'abilityentity_chr_0012_avywen_combo_skill_lance',
                    childSkillId: 'chr_0012_avywen_combo_skill_lance',
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
        15,
      ),
      scheduled(
        14,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0012_avywen_combo_skill:/scheduledSequences/2/sequence/steps/0',
          ),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0012_avywen_talent_0'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              forEachTarget(
                'enemy',
                sequence(
                  step('changeResourceByActionValue', {
                    resource: 'ultimateEnergy',
                    amount: { kind: 'blackboard', key: 'talent0_usp' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'caster',
                  }),
                ),
              ),
            ),
          ),
        ),
        15,
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
          }),
        ),
        12,
      ),
    ],
    cooldownFrames: [390, 390, 390, 390, 390, 390, 390, 390, 390, 390, 390, 360],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [1.69, 1.86, 2.03, 2.19, 2.36, 2.53, 2.7, 2.87, 3.04, 3.25, 3.5, 3.8],
    atk_scale_lance_back: 1,
    cam_angle: 0,
    cam_duration: 0,
    input_angle: 0,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    poise: 10,
    poise_lance: 0,
    potential_2: 0,
    radius: 4,
    talent0_usp: 0,
    usp: 10,
    lance_duration: 30,
  },
);

export const avywennaChr_0012_avywen_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0012_avywen_ultimate_skill',
    timelineBlockFrames: 57,
    naturalDurationFrames: 273,
    exclusiveFrame: 65,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 57,
          endFrame: 73,
          skillIds: ['chr_0012_avywen_combo_skill', 'chr_0012_avywen_normal_skill'],
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
        30,
      ),
      scheduled(
        0,
        sequence(
          step('findCharacterTeamTargets', {
            saveToContextKey: 'MainChar',
            selection: { kind: 'controlledOperator' },
          }),
        ),
        3,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 45),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        45,
      ),
      scheduled(
        45,
        sequence(
          withActionBlackboardScope(
            'SkillData.chr_0012_avywen_ultimate_skill.actionGroupData.timelineActions[7]._sequenceActionData.actionData[1]:projectile_chr_0012_avywen_ultimate_skill_lance_out',
            {},
            true,
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0012_avywen_ultimate_skill.actionGroupData.timelineActions[7]._sequenceActionData.actionData[1]:chr_0012_avywen_ultimate_skill_lance_gene',
                {
                  atk_scale_ulti_lance_back: 0,
                  potential_2: 0,
                  radius: 4,
                  talent_atb_gain_ulti: 0,
                },
                true,
                sequence(
                  step('spawnAbilityEntity', {
                    abilityEntityId: 'abilityentity_chr_0012_avywen_ultimate_skill_lance',
                    childSkillId: 'chr_0012_avywen_ultimate_skill_lance',
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
        48,
      ),
      scheduled(
        51,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'pulse_vul_duration', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0012_avywen_ultimate_skill_debuff',
                target: 'enemy',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: {
                  pulse_vul_rate: 'pulse_vul_rate',
                  pulse_vul_duration: 'pulse_vul_duration',
                },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step(
            'dealDamage',
            {
              damageType: 'electric',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0012_avywen_ultimate_skill:/scheduledSequences/5/sequence/steps/1',
          ),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0012_avywen_talent_0'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(
              forEachTarget(
                'enemy',
                sequence(
                  step('changeResourceByActionValue', {
                    resource: 'ultimateEnergy',
                    amount: { kind: 'blackboard', key: 'talent0_usp' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'caster',
                  }),
                ),
              ),
            ),
          ),
        ),
        54,
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
        65,
      ),
    ],
    cooldownFrames: 300,
    costs: [{ resource: 'ultimateEnergy', value: 100 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale: [4.22, 4.64, 5.07, 5.49, 5.91, 6.33, 6.75, 7.18, 7.6, 8.13, 8.76, 9.5],
    atk_scale_ulti_lance_back: 1,
    poise: [15, 15, 15, 15, 15, 15, 15, 15, 15, 20, 20, 20],
    poise_lance: 0,
    potential_2: 0,
    pulse_vul_duration: 0,
    pulse_vul_rate: 0,
    radius: 5,
    talent0_usp: 0,
    lance_duration_ult: 30,
    pulse_resist_down_duration: [5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 7, 8],
    pulse_resist_down_rate: [0.3, 0.32, 0.32, 0.32, 0.32, 0.34, 0.34, 0.34, 0.34, 0.36, 0.38, 0.4],
  },
);

export const avywennaCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const avywenna: OperatorDefinition = {
  slug: 'avywenna',
  gameId: 'AVYWENNA',
  rarity: 5,
  weaponType: 'polearm',
  element: 'electric',
  role: 'striker',
  mainAttribute: 'will',
  secondaryAttribute: 'agility',
  attributes: {
    strength: [12, 33, 54, 75, 96, 107],
    agility: [10, 31, 52, 74, 95, 106],
    intellect: [14, 34, 56, 78, 99, 110],
    will: [15, 43, 73, 103, 133, 148],
    baseAttack: [30, 90, 153, 217, 280, 312],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        avywennaChr_0012_avywen_attack1,
        avywennaChr_0012_avywen_attack2,
        avywennaChr_0012_avywen_attack3,
        avywennaChr_0012_avywen_attack4,
        avywennaChr_0012_avywen_attack5,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: avywennaChr_0012_avywen_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: avywennaChr_0012_avywen_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: avywennaChr_0012_avywen_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: avywennaChr_0012_avywen_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: avywennaChr_0012_avywen_ultimate_skill,
    },
  ],
  dodgeSkill: avywennaCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0012_avywen_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0012_avywen_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0012_avywen_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0012_avywen_attack1',
        'chr_0012_avywen_attack2',
        'chr_0012_avywen_attack3',
        'chr_0012_avywen_attack4',
        'chr_0012_avywen_attack5',
        'chr_0012_avywen_plunging_attack_end',
        'chr_0012_avywen_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0012_avywen_attack1',
        'chr_0012_avywen_attack2',
        'chr_0012_avywen_attack3',
        'chr_0012_avywen_attack4',
        'chr_0012_avywen_attack5',
      ],
      defaultSkillKey: 'chr_0012_avywen_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0012_avywen_combo_skill',
      event: 'beforeOutputDamage',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          { kind: 'eventDamageTagsMatch', match: 'hasAll', tags: ['normalAttackLastCombo'] },
          sequence(
            branch(
              {
                kind: 'contextTargetIdentityMatch',
                contextKey: 'trigger',
                other: 'controlledOperator',
                operator: 'equal',
              },
              sequence(
                branch(
                  {
                    kind: 'entityTagMatch',
                    target: 'actionInputTarget',
                    tagQueryType: 'hasAny',
                    tags: [
                      'Skill/Character/Common/SpellStatus/Conduct',
                      'Skill/Character/Common/SpellInflict/PulseInflict',
                    ],
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
          blackboardKey: 'talent0_usp',
          operation: 'assign',
          value: [3, 4],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent0_usp',
          operation: 'assign',
          value: [3, 4],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent0_usp',
          operation: 'assign',
          value: [3, 4],
        },
      ],
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0012_avywen_talent_0',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
        }),
      ),
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'pulse_vul_rate',
          operation: 'assign',
          value: [0.06, 0.1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'pulse_vul_duration',
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
          blackboardKey: 'talent0_usp',
          operation: 'add',
          value: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent0_usp',
          operation: 'add',
          value: 2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent0_usp',
          operation: 'add',
          value: 2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential_2',
          operation: 'assign',
          value: 20,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_2',
          operation: 'assign',
          value: 20,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['will'], value: 15 },
        { kind: 'addStaticDamageIncrease', target: 'electric', value: 0.08 },
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
          blackboardKey: 'potential_5_rate',
          operation: 'assign',
          value: 1.15,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0012_avywen_lance_becalled: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 2,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0012_avywen_lance_pulse_check: {
      stackingType: 'unique',
      priority: 1,
      maxStackCount: 1,
      durationSeconds: 0.3,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'buffOwner',
              buffIds: ['buff_chr_0012_avywen_lance_pulse_check'],
              operator: 'lessOrEqual',
              value: { kind: 'constant', value: 0 },
            },
            sequence(
              step('applyElementalInfliction', {
                element: 'electric',
                isExtra: false,
                target: 'buffOwner',
              }),
            ),
          ),
        ),
      },
    },
    buff_chr_0012_avywen_talent_0: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
    },
    buff_chr_0012_avywen_ultimate_skill_debuff: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'pulse_vul_duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { pulse_vul_duration: 10, pulse_vul_rate: 0.3 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_vulnerable_pulse',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'pulse_vul_duration' },
              rate: { kind: 'blackboard', key: 'pulse_vul_rate' },
            },
          }),
        ),
      },
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0012_avywen_combo_skill_lance: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'SelectCategory/ProjectilePassThru',
        'Skill/Character/chr_0012_avywen/Lance/ComboLance',
      ],
      lifetime: { kind: 'limited', durationSeconds: 62 },
      childSkill: {
        skillId: 'chr_0012_avywen_combo_skill_lance',
        blackboard: { atk_scale_lance: 1, poise_lance: 0, potential_2: 0, talent_atb_gain: 0 },
        scheduledSequences: [
          scheduled(
            0,
            sequence(
              step('jumpTimeline', {
                destinationFrame: 1500,
                condition: {
                  kind: 'buffIdStackCompare',
                  target: 'currentAbilityEntity',
                  buffIds: ['buff_chr_0012_avywen_lance_becalled'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
              }),
            ),
            1500,
          ),
          scheduled(1500, sequence(step('finishActionOwnerAbilityEntity', {})), 1501),
          scheduled(
            900,
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'potential_2', fallback: 0 },
                  operator: 'less',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(step('finishActionOwnerAbilityEntity', {})),
              ),
            ),
            901,
          ),
          scheduled(1500, sequence(step('finishActionOwnerAbilityEntity', {})), 1501),
        ],
      },
    },
    abilityentity_chr_0012_avywen_ultimate_skill_lance: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'Category/EnergyShard/Pulse',
        'Immune/Stunned',
        'Immune/Frozen',
        'Immune/Airborne',
        'Immune/KnockDown',
        'Immune/KnockBack',
        'Immune/Pull',
        'Immune/PowerSmash',
        'Immune/Poise',
        'Skill/Character/chr_0012_avywen/Lance/UltiLance',
      ],
      lifetime: { kind: 'limited', durationSeconds: 62 },
      childSkill: {
        skillId: 'chr_0012_avywen_ultimate_skill_lance',
        blackboard: {
          atk_scale_lance_ult: 1,
          poise_lance_ult: 0,
          potential_2: 0,
          talent_atb_gain_ulti: 0,
        },
        scheduledSequences: [
          scheduled(
            0,
            sequence(
              step('jumpTimeline', {
                destinationFrame: 1500,
                condition: {
                  kind: 'buffIdStackCompare',
                  target: 'currentAbilityEntity',
                  buffIds: ['buff_chr_0012_avywen_lance_becalled'],
                  operator: 'greaterOrEqual',
                  value: { kind: 'constant', value: 1 },
                },
              }),
            ),
            1500,
          ),
          scheduled(1500, sequence(step('finishActionOwnerAbilityEntity', {})), 1501),
          scheduled(
            900,
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'potential_2', fallback: 0 },
                  operator: 'less',
                  right: { kind: 'constant', value: 1 },
                },
                sequence(step('finishActionOwnerAbilityEntity', {})),
              ),
            ),
            901,
          ),
          scheduled(1500, sequence(step('finishActionOwnerAbilityEntity', {})), 1501),
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default avywenna;
