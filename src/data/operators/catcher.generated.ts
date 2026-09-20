/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type { OperatorDefinition, SkillDefinition } from '../../core/game-data/operatorDefinition';
import {
  branch,
  once,
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withSkillBlackboard,
} from './definitionHelpers';

export const catcherChr_0020_meurs_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0020_meurs_attack1',
    timelineBlockFrames: 21,
    naturalDurationFrames: 114,
    exclusiveFrame: 25,
    offsetRecordFrame: 12,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 39,
          input: 'basicAttack',
          targetSkillId: 'chr_0020_meurs_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 21, endFrame: 39, skillIds: ['chr_0020_meurs_attack2'] }],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        12,
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
                'chr_0020_meurs_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0',
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
                maxCountPerTarget: 1,
                targetTriggerIntervalSeconds: 0.033,
              },
            },
          ),
        ),
        14,
      ),
      scheduled(
        21,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0020_meurs_attack2'] })),
        39,
      ),
    ],
    timelineContinuationSkillId: 'chr_0020_meurs_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.35, 0.39, 0.42, 0.46, 0.49, 0.53, 0.56, 0.6, 0.63, 0.67, 0.73, 0.79],
    env_dmg: 20,
  },
);

export const catcherChr_0020_meurs_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0020_meurs_attack2',
    timelineBlockFrames: 21,
    naturalDurationFrames: 126,
    exclusiveFrame: 25,
    offsetRecordFrame: 10,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 35,
          input: 'basicAttack',
          targetSkillId: 'chr_0020_meurs_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 21, endFrame: 35, skillIds: ['chr_0020_meurs_attack3'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        10,
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
                'chr_0020_meurs_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.25 },
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
        21,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0020_meurs_attack3'] })),
        35,
      ),
    ],
    timelineContinuationSkillId: 'chr_0020_meurs_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.39, 0.42, 0.46, 0.5, 0.54, 0.58, 0.62, 0.65, 0.69, 0.74, 0.8, 0.87],
    env_dmg: 20,
  },
);

export const catcherChr_0020_meurs_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0020_meurs_attack3',
    timelineBlockFrames: 28,
    naturalDurationFrames: 126,
    exclusiveFrame: 32,
    offsetRecordFrame: 16,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 44,
          input: 'basicAttack',
          targetSkillId: 'chr_0020_meurs_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 28, endFrame: 44, skillIds: ['chr_0020_meurs_attack4'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        16,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['normalAttack'],
            },
            'chr_0020_meurs_attack3:/scheduledSequences/0/sequence/steps/0',
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
        17,
      ),
      scheduled(
        28,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0020_meurs_attack4'] })),
        44,
      ),
    ],
    timelineContinuationSkillId: 'chr_0020_meurs_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.54, 0.59, 0.65, 0.7, 0.76, 0.81, 0.86, 0.92, 0.97, 1.04, 1.12, 1.22],
    env_dmg: 20,
  },
);

export const catcherChr_0020_meurs_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0020_meurs_attack4',
    timelineBlockFrames: 45,
    naturalDurationFrames: 114,
    exclusiveFrame: 47,
    offsetRecordFrame: 23,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 60,
          input: 'basicAttack',
          targetSkillId: 'chr_0020_meurs_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 45, endFrame: 60, skillIds: ['chr_0020_meurs_attack1'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        23,
        sequence(
          repeatEachTick(
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
                'chr_0020_meurs_attack4:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
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
                  once(
                    'SkillData.chr_0020_meurs_attack4.actionGroupData.timelineActions[6]._sequenceActionData.actionData[0].actionOnTick.actionData[2].succeedActions.actionData[2]',
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
                maxCountPerTarget: 1,
                targetTriggerIntervalSeconds: 0.033,
              },
            },
          ),
        ),
        25,
      ),
      scheduled(
        45,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0020_meurs_attack1'] })),
        60,
      ),
    ],
    timelineContinuationSkillId: 'chr_0020_meurs_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 25,
    atk_scale: [0.71, 0.78, 0.85, 0.92, 0.99, 1.07, 1.14, 1.21, 1.28, 1.37, 1.47, 1.6],
    atk_scale2: 0.5,
    env_dmg: 40,
    poise: 22,
  },
);

export const catcherChr_0020_meurs_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0020_meurs_power_attack',
    timelineBlockFrames: 35,
    naturalDurationFrames: 135,
    exclusiveFrame: 75,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 35,
          endFrame: 75,
          skillIds: ['chr_0020_meurs_normal_skill', 'chr_0020_meurs_combo_skill'],
        },
      ],
    },
    costFrame: 9,
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
              calculationMultiplier: 0.4,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0020_meurs_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
        ),
        17,
      ),
      scheduled(
        35,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.6,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0020_meurs_power_attack:/scheduledSequences/1/sequence/steps/0',
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
                targets: ['caster'],
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        37,
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
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const catcherChr_0020_meurs_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0020_meurs_plunging_attack_end',
    timelineBlockFrames: 21,
    naturalDurationFrames: 108,
    exclusiveFrame: 20,
    offsetRecordFrame: 0,
    costFrame: 9,
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
            'chr_0020_meurs_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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
        2,
      ),
    ],
    skillType: 'plungingAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.8, 0.88, 0.96, 1.04, 1.12, 1.2, 1.28, 1.36, 1.44, 1.54, 1.66, 1.8] },
);

export const catcherChr_0020_meurs_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0020_meurs_normal_skill',
    timelineBlockFrames: 95,
    naturalDurationFrames: 373,
    exclusiveFrame: 285,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 95, endFrame: 129, skillIds: ['chr_0020_meurs_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
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
      scheduled(
        0,
        sequence(
          step('changeResourceByActionValue', {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atb_return_base' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'team',
            spGainKind: 'refund',
            spGainSource: 'default',
          }),
        ),
        3,
      ),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_common_obtain_ultimate_sp',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { ratio: { kind: 'constant', value: 0.5 } },
          }),
        ),
        3,
      ),
      scheduled(
        60,
        sequence(
          step('applyBuff', {
            buffId: 'buff_common_obtain_ultimate_sp',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { ratio: { kind: 'constant', value: 0.5 } },
          }),
        ),
        62,
      ),
      scheduled(45, sequence(step('jumpTimeline', { destinationFrame: 255 })), 46),
      scheduled(194, sequence(step('finishTimeline', {})), 195),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0020_meurs_reduce_damage',
            target: 'party',
            finishByAction: true,
            blackboardAssignments: { taken_dmg: { kind: 'blackboard', key: 'taken_dmg' } },
          }),
        ),
        83,
      ),
      scheduled(
        0,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0020_meurs_normal_skill.actionGroupData.timelineActions[19]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
                event: { kind: 'operatorHit' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    {
                      kind: 'eventDamageFeaturesMatch',
                      match: 'exceptAny',
                      features: ['dot', 'remainArea'],
                    },
                    sequence(step('jumpTimeline', { destinationFrame: 60 })),
                  ),
                ),
              },
              {
                key: 'SkillData.chr_0020_meurs_normal_skill.actionGroupData.timelineActions[19]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
                    sequence(step('jumpTimeline', { destinationFrame: 60 })),
                  ),
                ),
              },
            ],
          }),
        ),
        60,
      ),
      scheduled(
        83,
        sequence(
          repeatEachTick(
            sequence(
              step('applyBuff', {
                buffId: 'buff_physical_no_guard',
                target: 'enemy',
                inheritSourceSkillCastInfo: true,
              }),
              once(
                'SkillData.chr_0020_meurs_normal_skill.actionGroupData.timelineActions[25]._sequenceActionData.actionData[0].actionOnTick.actionData[1]',
                sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'potential5_atb', fallback: 0 },
                      operator: 'greater',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      branch(
                        {
                          kind: 'buffStackCompare',
                          target: 'caster',
                          tagQueryType: 'hasAny',
                          buffTags: ['Skill/Character/Common/HpShield'],
                          operator: 'greaterOrEqual',
                          value: { kind: 'constant', value: 1 },
                        },
                        sequence(
                          step('changeResourceByActionValue', {
                            resource: 'sp',
                            amount: { kind: 'blackboard', key: 'potential5_atb' },
                            coefficient: { kind: 'constant', value: 1 },
                            recipient: 'team',
                            spGainKind: 'refund',
                            spGainSource: 'skill',
                          }),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                'chr_0020_meurs_normal_skill:/scheduledSequences/8/sequence/steps/0/body/steps/2',
              ),
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
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 1,
                targetTriggerIntervalSeconds: 0,
              },
            },
          ),
        ),
        85,
      ),
      scheduled(
        60,
        sequence(
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.7 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0.3,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 0.5,
                  value: 0.3,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 1,
                  inTangent: 4.596606,
                  outTangent: 4.596606,
                  weightedMode: 0,
                  inWeight: 0.0243593454,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        63,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb_return_base: 30,
    atk_scale: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.85, 3.02, 3.2, 3.42, 3.69, 4],
    poise: 20,
    potential5_atb: 0,
    taken_dmg: 0.9,
  },
);

export const catcherChr_0020_meurs_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0020_meurs_combo_skill',
    timelineBlockFrames: 24,
    naturalDurationFrames: 98,
    exclusiveFrame: 45,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 24, endFrame: 60, skillIds: ['chr_0020_meurs_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        17,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0020_meurs_combo_skill:/scheduledSequences/0/sequence/steps/0',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
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
        18,
      ),
      scheduled(
        20,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
              tags: ['comboSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0020_meurs_combo_skill:/scheduledSequences/1/sequence/steps/0',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.2 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'meurs_comboskill2' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        21,
      ),
      scheduled(
        20,
        sequence(
          step('modifyActionValue', {
            key: 'shield_duration',
            operation: 'add',
            value: { kind: 'blackboard', key: 'potential3_duration' },
          }),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('findCharacterTeamTargets', {
                saveToContextKey: 'aMate',
                selection: { kind: 'lowestHealthRatioOperator', excludeCaster: true },
              }),
              step('mergeContextTargets', {
                saveToContextKey: 'shieldTar',
                sources: [
                  { kind: 'context', contextKey: 'aMate' },
                  { kind: 'target', target: 'caster' },
                ],
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0020_meurs_combo_skill_shield',
                target: 'casterAndLowestHealthRatioOperatorExceptCaster',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: {
                  shield_def_rate: 'shield_def_rate',
                  shield_base: 'shield_base',
                  duration: 'shield_duration',
                },
              }),
            ),
            sequence(
              step('findCharacterTeamTargets', {
                saveToContextKey: 'mainChar',
                selection: { kind: 'controlledOperator' },
              }),
              step('mergeContextTargets', {
                saveToContextKey: 'shieldTar',
                sources: [
                  { kind: 'context', contextKey: 'mainChar' },
                  { kind: 'target', target: 'caster' },
                ],
              }),
              step('applyBuff', {
                buffId: 'buff_chr_0020_meurs_combo_skill_shield',
                target: 'casterAndControlledOperator',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: {
                  shield_def_rate: 'shield_def_rate',
                  shield_base: 'shield_base',
                  duration: 'shield_duration',
                },
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        21,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.567000031 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        14,
      ),
    ],
    smartTarget: 'trigger',
    cooldownFrames: [1050, 1050, 1050, 1050, 1050, 1050, 1050, 1050, 1050, 1050, 1050, 990],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [0.25, 0.27, 0.3, 0.32, 0.34, 0.37, 0.39, 0.42, 0.44, 0.47, 0.51, 0.55],
    atk_scale_1: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.93, 2.08, 2.25],
    poise: 10,
    potential3_duration: 0,
    shield_base: [360, 432, 504, 576, 612, 648, 684, 720, 756, 774, 792, 810],
    shield_def_rate: [2.25, 2.7, 3.15, 3.6, 3.825, 4.05, 4.275, 4.5, 4.725, 4.84, 4.95, 5.06],
    shield_duration: 10,
    usp: 10,
  },
);

export const catcherChr_0020_meurs_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0020_meurs_ultimate_skill',
    timelineBlockFrames: 103,
    naturalDurationFrames: 193,
    exclusiveFrame: 120,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 103,
          endFrame: 120,
          skillIds: ['chr_0020_meurs_combo_skill', 'chr_0020_meurs_normal_skill'],
        },
      ],
    },
    costFrame: 9,
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
        46,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0020_meurs_ult_weak',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              weak_scale: 'weak_scale',
              weak_duration: 'weak_duration',
            },
          }),
        ),
        49,
      ),
      scheduled(
        46,
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
            'chr_0020_meurs_ultimate_skill:/scheduledSequences/2/sequence/steps/0',
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
        49,
      ),
      scheduled(
        64,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale_1' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0020_meurs_ultimate_skill:/scheduledSequences/3/sequence/steps/0',
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
        67,
      ),
      scheduled(
        85,
        sequence(
          step('applyKnockDown', {
            target: 'enemy',
            duration: { kind: 'blackboard', key: 'knockdown_time' },
            force: false,
            isExtra: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise1' },
            },
            'chr_0020_meurs_ultimate_skill:/scheduledSequences/4/sequence/steps/1',
          ),
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
        88,
      ),
      scheduled(
        102,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'talent_1', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('spawnAbilityEntity', {
                abilityEntityId: 'abilityentity_chr_0020_meurs_talent_shockwave',
                childSkillId: 'chr_0020_meurs_talent_shockwave',
                inheritActionBlackboard: true,
                dieWhenSourceDies: false,
              }),
            ),
          ),
        ),
        105,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 38),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        38,
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
        120,
      ),
    ],
    cooldownFrames: 450,
    costs: [{ resource: 'ultimateEnergy', value: 80 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale: [0.89, 0.98, 1.07, 1.16, 1.25, 1.34, 1.43, 1.51, 1.6, 1.72, 1.85, 2],
    atk_scale_1: [1.2, 1.32, 1.44, 1.56, 1.68, 1.8, 1.92, 2.04, 2.16, 2.31, 2.49, 2.7],
    atk_scale_2: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    atk_scale_shockwave: 0.45,
    knockdown_time: 2,
    poise: 5,
    poise1: 10,
    talent_1: 0,
    weak_duration: 8,
    weak_scale: [0.2, 0.2, 0.2, 0.2, 0.2, 0.25, 0.25, 0.25, 0.25, 0.3, 0.3, 0.3],
    poise_display: 20,
  },
);

export const catcherCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const catcher: OperatorDefinition = {
  slug: 'catcher',
  gameId: 'CATCHER',
  rarity: 4,
  weaponType: 'greatsword',
  element: 'physical',
  role: 'defender',
  mainAttribute: 'strength',
  secondaryAttribute: 'will',
  attributes: {
    strength: [21, 54, 89, 124, 159, 176],
    agility: [9, 28, 47, 67, 87, 96],
    intellect: [8, 25, 42, 60, 77, 86],
    will: [11, 31, 53, 74, 96, 106],
    baseAttack: [30, 88, 148, 209, 270, 300],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        catcherChr_0020_meurs_attack1,
        catcherChr_0020_meurs_attack2,
        catcherChr_0020_meurs_attack3,
        catcherChr_0020_meurs_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: catcherChr_0020_meurs_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: catcherChr_0020_meurs_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: catcherChr_0020_meurs_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: catcherChr_0020_meurs_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: catcherChr_0020_meurs_ultimate_skill,
    },
  ],
  dodgeSkill: catcherCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0020_meurs_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0020_meurs_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0020_meurs_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0020_meurs_attack1',
        'chr_0020_meurs_attack2',
        'chr_0020_meurs_attack3',
        'chr_0020_meurs_attack4',
        'chr_0020_meurs_plunging_attack_end',
        'chr_0020_meurs_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0020_meurs_attack1',
        'chr_0020_meurs_attack2',
        'chr_0020_meurs_attack3',
        'chr_0020_meurs_attack4',
      ],
      defaultSkillKey: 'chr_0020_meurs_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0020_meurs_combo_skill',
      event: 'takeDamage',
      immediately: false,
      initialValues: null,
      sequence: sequence(
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
                kind: 'healthCompare',
                target: 'contextTarget',
                contextKey: 'trigger',
                valueType: 'ratio',
                operator: 'less',
                value: { kind: 'constant', value: 0.4 },
              },
              sequence(
                branch(
                  {
                    kind: 'eventDamageFeaturesMatch',
                    match: 'exceptAny',
                    features: ['dot', 'remainArea'],
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
    {
      key: 'native-combo:1',
      skillKey: 'chr_0020_meurs_combo_skill',
      event: 'weaknessSet',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0020_meurs_signal_weakness_trigger_combo',
          target: 'enemy',
          inheritSourceSkillCastInfo: true,
        }),
        branch({ kind: 'constant', value: false }, sequence()),
      ),
    },
  ],
  comboSkillPriority: 'default',
  talents: [
    {
      levels: 2,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0020_meurs_talent_0',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { rate: [1, 1.2] },
        }),
      ),
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_1',
          operation: 'assign',
          value: [1, 2],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'atk_scale_shockwave',
          operation: 'assign',
          value: [0.3, 0.45],
        },
      ],
    },
  ],
  potentials: [
    {
      levels: 1,
      initializationSequence: sequence(
        step('applyBuff', {
          buffId: 'buff_chr_0020_meurs_potential_1',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: {
            def_scale: { kind: 'constant', value: 5 },
            dmg_base: { kind: 'constant', value: 300 },
          },
        }),
      ),
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'modifyBasePanelStat', stat: 'defense', operation: 'flat', value: 20 },
        { kind: 'addBuildAttribute', attributes: ['will'], value: 10 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential3_duration',
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
          multiplier: 0.9,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential5_atb',
          operation: 'assign',
          value: 10,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0020_meurs_combo_skill_shield: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_buff_def_up',
        iconPath: '/icons/icon_battle_buff_def_up.webp',
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
      blackboard: { duration: 10, shield_base: 100, shield_def_rate: 0.5 },
      attributeModifiers: [],
      shields: [
        {
          infinityValue: false,
          value: {
            attributeSource: 'buffSource',
            attribute: 'Def',
            multiplier: { blackboardKey: 'shield_def_rate' },
            addition: { blackboardKey: 'shield_base' },
          },
          damageAbsorptions: [],
          absorbCount: -1,
          absorbAllDamageWhenConsumed: false,
          removeBuffWhenConsumed: true,
          priority: 'normal',
          replaceHitEffect: true,
        },
      ],
    },
    buff_chr_0020_meurs_potential_1: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 0,
      applyTags: [],
      extendTags: [],
      blackboard: { def_scale: 1, dmg_base: 100 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'outputDamage',
          priority: 0,
          sequence: sequence(
            branch(
              {
                kind: 'eventDamageTagsMatch',
                match: 'hasAny',
                tags: ['normalSkill', 'ultimateSkill'],
              },
              sequence(
                step(
                  'dealDamage',
                  {
                    damageType: 'physical',
                    attackScale: { kind: 'blackboard', key: 'def_scale' },
                    calculation: 'attribute',
                    calculationAttribute: 'Def',
                    calculationAddition: { kind: 'blackboard', key: 'dmg_base' },
                    tags: [],
                  },
                  'buff_chr_0020_meurs_potential_1:/abilityEventResponses/0/sequence/steps/0/whenTrue/steps/0',
                ),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0020_meurs_reduce_damage: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: ['Skill/Character/Common/Shielded'],
      extendTags: [],
      blackboard: { duration: 9999, taken_dmg: 0.1 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_shelter',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'constant', value: 9999999 },
              rate: { kind: 'blackboard', key: 'taken_dmg' },
            },
          }),
        ),
        finish: sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0020_meurs_reduce_damage_remain',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 0.5 } },
            copiedBlackboardAssignments: { taken_dmg: 'taken_dmg' },
          }),
        ),
      },
    },
    buff_chr_0020_meurs_reduce_damage_remain: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0.5, taken_dmg: 0.1 },
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
              rate: { kind: 'blackboard', key: 'taken_dmg' },
            },
          }),
        ),
      },
    },
    buff_chr_0020_meurs_signal_weakness_trigger_combo: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 0.4,
      applyTags: [],
      extendTags: [],
      blackboard: {},
      attributeModifiers: [],
      lifecycleSequences: {
        finish: sequence(step('openComboWindow', { nextSkillKeyFromSlot: 'comboSkill' })),
      },
    },
    buff_chr_0020_meurs_talent_0: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 0,
      triggerIntervalSeconds: 0.1,
      waitFirstTriggerInterval: false,
      maxTriggerCount: 99999,
      applyTags: [],
      extendTags: [],
      blackboard: { def_up: 0, rate: 1 },
      attributeModifiers: [
        { attribute: 'Def', slot: 'baseAddition', value: { blackboardKey: 'def_up' } },
      ],
      lifecycleSequences: {
        trigger: sequence(
          step('storeSourceAttributeValue', {
            attribute: { kind: 'specific', key: 'will' },
            stage: 'finalNonConverted',
            useFloor: true,
            divisor: { kind: 'constant', value: 10 },
            multiplier: { kind: 'blackboard', key: 'rate' },
            base: { kind: 'constant', value: 0 },
            targetKey: 'def_up',
          }),
        ),
      },
    },
    buff_chr_0020_meurs_ult_weak: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'weak_duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { weak_duration: 0, weak_scale: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_weak',
            target: 'enemy',
            inheritSourceSkillCastInfo: true,
            asChildBuff: true,
            blackboardAssignments: {
              duration: { kind: 'blackboard', key: 'weak_duration' },
              rate: { kind: 'blackboard', key: 'weak_scale' },
            },
          }),
        ),
      },
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0020_meurs_talent_shockwave: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'SelectCategory/ProjectilePassThru',
      ],
      lifetime: { kind: 'limited', durationSeconds: 2 },
      deathReleaseDelaySeconds: 0.100000001490116,
      childSkill: {
        skillId: 'chr_0020_meurs_talent_shockwave',
        blackboard: { atb: 0, atk_scale_shockwave: 0.42, env_dmg: 20, spawn_count: 0, talent_1: 0 },
        scheduledSequences: [
          scheduled(
            3,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_shockwave' },
                  tags: ['ultimateSkill'],
                },
                'abilityentity_chr_0020_meurs_talent_shockwave:chr_0020_meurs_talent_shockwave:/childSkill/scheduledSequences/0/sequence/steps/0',
              ),
            ),
            5,
          ),
          scheduled(
            18,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_shockwave' },
                  tags: ['ultimateSkill'],
                },
                'abilityentity_chr_0020_meurs_talent_shockwave:chr_0020_meurs_talent_shockwave:/childSkill/scheduledSequences/1/sequence/steps/0',
              ),
            ),
            20,
          ),
          scheduled(
            33,
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_shockwave' },
                  tags: ['ultimateSkill'],
                },
                'abilityentity_chr_0020_meurs_talent_shockwave:chr_0020_meurs_talent_shockwave:/childSkill/scheduledSequences/2/sequence/steps/0',
              ),
            ),
            35,
          ),
          scheduled(
            29,
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'talent_1', fallback: 0 },
                  operator: 'less',
                  right: { kind: 'constant', value: 2 },
                },
                sequence(step('finishTimeline', {})),
              ),
            ),
            32,
          ),
        ],
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default catcher;
