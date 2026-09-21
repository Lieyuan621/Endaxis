/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type { OperatorDefinition, SkillDefinition } from '../../core/game-data/operatorDefinition';
import {
  branch,
  once,
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withActionBlackboardScope,
  withSkillBlackboard,
} from './definitionHelpers';

export const snowshineChr_0014_aurora_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0014_aurora_attack1',
    timelineBlockFrames: 32,
    naturalDurationFrames: 111,
    exclusiveFrame: 35,
    offsetRecordFrame: 19,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 47,
          input: 'basicAttack',
          targetSkillId: 'chr_0014_aurora_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 32, endFrame: 47, skillIds: ['chr_0014_aurora_attack2'] }],
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
              tags: ['normalAttack'],
            },
            'chr_0014_aurora_attack1:/scheduledSequences/0/sequence/steps/0',
          ),
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
        20,
      ),
      scheduled(
        32,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0014_aurora_attack2'] })),
        47,
      ),
    ],
    timelineContinuationSkillId: 'chr_0014_aurora_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.55, 0.61, 0.66, 0.72, 0.77, 0.83, 0.88, 0.94, 0.99, 1.06, 1.14, 1.24],
    env_dmg: 20,
  },
);

export const snowshineChr_0014_aurora_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0014_aurora_attack2',
    timelineBlockFrames: 28,
    naturalDurationFrames: 110,
    exclusiveFrame: 30,
    offsetRecordFrame: 19,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 43,
          input: 'basicAttack',
          targetSkillId: 'chr_0014_aurora_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 28, endFrame: 43, skillIds: ['chr_0014_aurora_attack3'] }],
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
            'chr_0014_aurora_attack2:/scheduledSequences/0/sequence/steps/0',
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
        28,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0014_aurora_attack3'] })),
        43,
      ),
    ],
    timelineContinuationSkillId: 'chr_0014_aurora_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.59, 0.64, 0.7, 0.76, 0.82, 0.88, 0.94, 0.99, 1.05, 1.13, 1.21, 1.32],
    env_dmg: 25,
  },
);

export const snowshineChr_0014_aurora_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0014_aurora_attack3',
    timelineBlockFrames: 61,
    naturalDurationFrames: 131,
    exclusiveFrame: 65,
    offsetRecordFrame: 39,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 75,
          input: 'basicAttack',
          targetSkillId: 'chr_0014_aurora_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 61, endFrame: 75, skillIds: ['chr_0014_aurora_attack1'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        21,
        sequence(
          repeatEachTick(
            sequence(
              step('calculateActionValue', {
                key: 'atk_scale1',
                operation: 'multiply',
                left: { kind: 'blackboard', key: 'atk_scale' },
                right: { kind: 'constant', value: 0.4 },
              }),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale1' },
                  tags: ['normalAttack'],
                },
                'chr_0014_aurora_attack3:/scheduledSequences/0/sequence/steps/0/body/steps/1',
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
        27,
      ),
      scheduled(
        39,
        sequence(
          repeatEachTick(
            sequence(
              step('calculateActionValue', {
                key: 'atk_scale2',
                operation: 'multiply',
                left: { kind: 'blackboard', key: 'atk_scale' },
                right: { kind: 'constant', value: 0.6 },
              }),
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale2' },
                  tags: ['normalAttack', 'normalAttackLastCombo'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                  staggerOnlyWhenCasterControlled: true,
                },
                'chr_0014_aurora_attack3:/scheduledSequences/1/sequence/steps/0/body/steps/1',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.35 },
                    slot: 'TimeDilation/Layer/Entity/HitStop',
                    priority: 10,
                    curve: { kind: 'named', key: 'char_normal_attack' },
                    finishByAction: false,
                    targets: ['enemy', 'caster'],
                  }),
                  once(
                    'SkillData.chr_0014_aurora_attack3.actionGroupData.timelineActions[15]._sequenceActionData.actionData[0].actionOnTick.actionData[3].succeedActions.actionData[0].succeedActions.actionData[2]',
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
        43,
      ),
      scheduled(
        61,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0014_aurora_attack1'] })),
        75,
      ),
    ],
    timelineContinuationSkillId: 'chr_0014_aurora_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 25,
    atk_scale: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.93, 2.08, 2.25],
    atk_scale1: 0,
    atk_scale2: 0.8,
    env_dmg: 25,
    env_dmg2: 30,
    poise: 23,
  },
);

export const snowshineChr_0014_aurora_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0014_aurora_power_attack',
    timelineBlockFrames: 41,
    naturalDurationFrames: 133,
    exclusiveFrame: 75,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 41,
          endFrame: 75,
          skillIds: ['chr_0014_aurora_normal_skill', 'chr_0014_aurora_combo_skill'],
        },
      ],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        41,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 1,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0014_aurora_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.6 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'auro_power_attack' },
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
        41,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const snowshineChr_0014_aurora_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0014_aurora_plunging_attack_end',
    timelineBlockFrames: 21,
    naturalDurationFrames: 90,
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
            'chr_0014_aurora_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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

export const snowshineChr_0014_aurora_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0014_aurora_normal_skill',
    timelineBlockFrames: 67,
    naturalDurationFrames: 208,
    exclusiveFrame: 145,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 135, endFrame: 145, skillIds: ['chr_0014_aurora_normal_skill'] },
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
        5,
      ),
      scheduled(67, sequence(step('markCurrentSkillCanInterrupt', {})), 70),
      scheduled(
        107,
        sequence(
          step('applyBuff', {
            buffId: 'buff_common_obtain_ultimate_sp',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { ratio: { kind: 'constant', value: 0.5 } },
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'talent_2_sup', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              step('changeResourceByActionValue', {
                resource: 'ultimateEnergy',
                amount: { kind: 'blackboard', key: 'talent_2_sup' },
                coefficient: { kind: 'constant', value: 1 },
                recipient: 'caster',
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        109,
      ),
      scheduled(106, sequence(step('finishTimeline', {})), 107),
      scheduled(
        0,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0014_aurora_reduce_damage',
            target: 'party',
            finishByAction: true,
            blackboardAssignments: {
              taken_dmg: { kind: 'blackboard', key: 'taken_dmg' },
              potential_1: { kind: 'blackboard', key: 'potential_1' },
            },
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0014_aurora_potential_1_listener',
                target: 'party',
                finishByAction: true,
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        51,
      ),
      scheduled(
        0,
        sequence(
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0014_aurora_normal_skill.actionGroupData.timelineActions[19]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
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
                    sequence(step('jumpTimeline', { destinationFrame: 107 })),
                  ),
                ),
              },
              {
                key: 'SkillData.chr_0014_aurora_normal_skill.actionGroupData.timelineActions[19]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
                event: { kind: 'abilityEvent', event: 'addedBuff' },
                phase: 'dataAction',
                priority: 0,
                sequence: sequence(
                  branch(
                    { kind: 'eventBuffIdMatch', buffIds: ['buff_eny_0018_lbtough_pre_catch'] },
                    sequence(step('jumpTimeline', { destinationFrame: 107 })),
                  ),
                ),
              },
            ],
          }),
        ),
        51,
      ),
      scheduled(
        107,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0014_aurora_reduce_damage',
            target: 'caster',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 1 } },
            copiedBlackboardAssignments: { taken_dmg: 'taken_dmg' },
          }),
        ),
        108,
      ),
      scheduled(
        125,
        sequence(
          repeatEachTick(
            sequence(
              step('applyElementalInfliction', { element: 'cryo', isExtra: false }),
              once(
                'SkillData.chr_0014_aurora_normal_skill.actionGroupData.timelineActions[25]._sequenceActionData.actionData[0].actionOnTick.actionData[1]',
                sequence(
                  step('changeResourceByActionValue', {
                    resource: 'sp',
                    amount: { kind: 'blackboard', key: 'potential_5_atb' },
                    coefficient: { kind: 'constant', value: 1 },
                    recipient: 'team',
                    spGainKind: 'refund',
                    spGainSource: 'skill',
                  }),
                ),
              ),
              step(
                'dealDamage',
                {
                  damageType: 'cryo',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalSkill'],
                  features: ['canBreakWeakness'],
                  stagger: { kind: 'blackboard', key: 'poise' },
                },
                'chr_0014_aurora_normal_skill:/scheduledSequences/9/sequence/steps/0/body/steps/2',
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
        127,
      ),
      scheduled(
        107,
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
        110,
      ),
      scheduled(
        107,
        sequence(
          step('applyBuff', {
            buffId: 'buff_chr_0014_aurora_reduce_damage',
            target: 'party',
            finishByAction: true,
            blackboardAssignments: { taken_dmg: { kind: 'blackboard', key: 'taken_dmg' } },
          }),
        ),
        125,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atb_return_base: 30,
    atk_scale: [2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.85, 4.15, 4.5],
    poise: 20,
    potential_1: 0,
    potential_5_atb: 0,
    taken_dmg: 0.9,
    talent_2_sup: 0,
  },
);

export const snowshineChr_0014_aurora_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0014_aurora_combo_skill',
    timelineBlockFrames: 46,
    naturalDurationFrames: 123,
    exclusiveFrame: 45,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 15, endFrame: 60, skillIds: ['chr_0014_aurora_normal_skill'] },
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
        123,
      ),
      scheduled(
        12,
        sequence(
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'usp' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          }),
          branch(
            { kind: 'casterControlled' },
            sequence(
              withActionBlackboardScope(
                'SkillData.chr_0014_aurora_combo_skill.actionGroupData.timelineActions[4]._sequenceActionData.actionData[2].succeedActions.actionData[1]:projectile_chr_0014_aurora_combo_skill_bear_out',
                {},
                true,
                sequence(
                  withActionBlackboardScope(
                    'SkillData.chr_0014_aurora_combo_skill.actionGroupData.timelineActions[4]._sequenceActionData.actionData[2].succeedActions.actionData[1]:chr_0014_aurora_combo_skill_bear_gene',
                    {
                      atk_scale: 0.42,
                      duration: 0,
                      heal_scale: 0,
                      heal_scale_loop: 0,
                      heal_static_value: 0,
                      heal_static_value_loop: 0,
                      interval: 0,
                    },
                    true,
                    sequence(
                      step('spawnAbilityEntity', {
                        abilityEntityId: 'abilityentity_chr_0014_aurora_combo_skill',
                        childSkillId: 'chr_0014_aurora_combo_skill_abilityrange',
                        inheritActionBlackboard: true,
                        dieWhenSourceDies: false,
                        target: 'enemy',
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
            sequence(
              step('findCharacterTeamTargets', {
                saveToContextKey: 'BearPos',
                selection: { kind: 'controlledOperator' },
              }),
              withActionBlackboardScope(
                'SkillData.chr_0014_aurora_combo_skill.actionGroupData.timelineActions[4]._sequenceActionData.actionData[2].failActions.actionData[2]:projectile_chr_0014_aurora_combo_skill_bear_out',
                {},
                true,
                sequence(
                  withActionBlackboardScope(
                    'SkillData.chr_0014_aurora_combo_skill.actionGroupData.timelineActions[4]._sequenceActionData.actionData[2].failActions.actionData[2]:chr_0014_aurora_combo_skill_bear_gene',
                    {
                      atk_scale: 0.42,
                      duration: 0,
                      heal_scale: 0,
                      heal_scale_loop: 0,
                      heal_static_value: 0,
                      heal_static_value_loop: 0,
                      interval: 0,
                    },
                    true,
                    sequence(
                      step('spawnAbilityEntity', {
                        abilityEntityId: 'abilityentity_chr_0014_aurora_combo_skill',
                        childSkillId: 'chr_0014_aurora_combo_skill_abilityrange',
                        inheritActionBlackboard: true,
                        dieWhenSourceDies: false,
                        target: 'enemy',
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
            { alwaysNext: true },
          ),
        ),
        15,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 0.533 },
            slot: 'unassigned',
            priority: 30,
            curve: { kind: 'named', key: 'ComboSkill' },
            finishByAction: false,
            ignoredTargets: ['caster'],
            ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          }),
        ),
        13,
      ),
    ],
    cooldownFrames: [750, 750, 750, 750, 750, 750, 750, 750, 720, 720, 720, 690],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: 0.42,
    cam_angle: 0,
    cam_duration: 0,
    duration: 3,
    heal_scale: [0.22, 0.27, 0.31, 0.36, 0.38, 0.4, 0.43, 0.45, 0.47, 0.48, 0.49, 0.5],
    heal_scale_loop: [0.06, 0.07, 0.08, 0.09, 0.1, 0.1, 0.11, 0.11, 0.12, 0.12, 0.12, 0.13],
    heal_static_value: [
      96, 115.2, 134.4, 153.6, 163.2, 172.8, 182.4, 192, 201.6, 206.4, 211.2, 216,
    ],
    heal_static_value_loop: [24, 28.8, 33.6, 38.4, 40.8, 43.2, 45.6, 48, 50.4, 51.6, 52.8, 54],
    input_angle: 0,
    interval: 0.5,
    owner_mainchar_alpha: 0,
    owner_mainchar_distance: 0,
    usp: 10,
    trigger_hp_ratio: 0.6,
  },
);

export const snowshineChr_0014_aurora_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0014_aurora_ultimate_skill',
    timelineBlockFrames: 91,
    naturalDurationFrames: 142,
    exclusiveFrame: 90,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 71,
          endFrame: 90,
          skillIds: ['chr_0014_aurora_normal_skill', 'chr_0014_aurora_combo_skill'],
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
        62,
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
            'chr_0014_aurora_ultimate_skill:/scheduledSequences/1/sequence/steps/0',
          ),
        ),
        65,
      ),
      scheduled(
        62,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential_2', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              step('spawnAbilityEntity', {
                abilityEntityId: 'abilityentity_chr_0014_aurora_ultimate_skill',
                childSkillId: 'chr_0014_aurora_ultimate_skill_abilityrange_potential2',
                inheritActionBlackboard: true,
                dieWhenSourceDies: false,
              }),
            ),
            sequence(
              step('spawnAbilityEntity', {
                abilityEntityId: 'abilityentity_chr_0014_aurora_ultimate_skill',
                childSkillId: 'chr_0014_aurora_ultimate_skill_abilityrange',
                inheritActionBlackboard: true,
                dieWhenSourceDies: false,
              }),
            ),
            { alwaysNext: true },
          ),
        ),
        65,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 60),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        60,
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
        90,
      ),
    ],
    cooldownFrames: 600,
    costs: [{ resource: 'ultimateEnergy', value: 80 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale: [2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.85, 4.15, 4.5],
    extra_duration: 0,
    frozen_level: 1,
    poise: [15, 15, 15, 15, 15, 15, 15, 15, 15, 20, 20, 20],
    potential_2: 0,
    potential_2_range: 0,
    atk_scale_loop: [0.29, 0.32, 0.35, 0.37, 0.4, 0.43, 0.46, 0.49, 0.52, 0.55, 0.6, 0.65],
    duration: 5,
    forst_allow_count: 2,
    interval: 0.5,
  },
);

export const snowshineCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const snowshine: OperatorDefinition = {
  slug: 'snowshine',
  gameId: 'SNOWSHINE',
  rarity: 5,
  weaponType: 'greatsword',
  element: 'cryo',
  role: 'defender',
  mainAttribute: 'strength',
  secondaryAttribute: 'will',
  attributes: {
    strength: [18, 47, 78, 108, 139, 154],
    agility: [12, 32, 52, 73, 94, 104],
    intellect: [9, 27, 46, 65, 84, 93],
    will: [10, 31, 53, 75, 97, 108],
    baseAttack: [30, 87, 147, 207, 267, 297],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        snowshineChr_0014_aurora_attack1,
        snowshineChr_0014_aurora_attack2,
        snowshineChr_0014_aurora_attack3,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: snowshineChr_0014_aurora_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: snowshineChr_0014_aurora_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: snowshineChr_0014_aurora_normal_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: snowshineChr_0014_aurora_combo_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: snowshineChr_0014_aurora_ultimate_skill,
    },
  ],
  dodgeSkill: snowshineCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0014_aurora_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0014_aurora_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0014_aurora_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0014_aurora_attack1',
        'chr_0014_aurora_attack2',
        'chr_0014_aurora_attack3',
        'chr_0014_aurora_plunging_attack_end',
        'chr_0014_aurora_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0014_aurora_attack1',
        'chr_0014_aurora_attack2',
        'chr_0014_aurora_attack3',
      ],
      defaultSkillKey: 'chr_0014_aurora_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0014_aurora_combo_skill',
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
                value: { kind: 'constant', value: 0.6 },
              },
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
          buffId: 'buff_chr_0014_aurora_talent_0',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: { heal_up: [0.15, 0.25], rate: [0.45, 0.55] },
        }),
      ),
    },
    {
      levels: 2,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'talent_2_sup',
          operation: 'assign',
          value: [6, 10],
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
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_2',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_2_range',
          operation: 'assign',
          value: 0.2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'extra_duration',
          operation: 'add',
          value: 2,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'modifyBasePanelStat', stat: 'defense', operation: 'flat', value: 20 },
        { kind: 'addBuildAttribute', attributes: ['will'], value: 20 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'potential_5_atb',
          operation: 'assign',
          value: 10,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0014_aurora_combo_skill_heal: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 0,
      durationSeconds: 0.1,
      applyTags: [],
      extendTags: [],
      blackboard: { heal_scale: 1, heal_static_value: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('heal', {
            target: 'buffOwner',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            attribute: 'will',
            multiplier: { kind: 'blackboard', key: 'heal_scale' },
            addition: { kind: 'blackboard', key: 'heal_static_value' },
          }),
        ),
      },
    },
    buff_chr_0014_aurora_combo_skill_heal_loop: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 0,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: { blackboardKey: 'interval' },
      waitFirstTriggerInterval: true,
      maxTriggerCount: 999,
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0, heal_scale_loop: 0, heal_static_value_loop: 0, interval: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        trigger: sequence(
          step('heal', {
            target: 'buffOwner',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            attribute: 'will',
            multiplier: { kind: 'blackboard', key: 'heal_scale_loop' },
            addition: { kind: 'blackboard', key: 'heal_static_value_loop' },
          }),
        ),
      },
    },
    buff_chr_0014_aurora_potential_1: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0.05 },
      attributeModifiers: [],
    },
    buff_chr_0014_aurora_potential_1_listener: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 9999 },
      attributeModifiers: [],
    },
    buff_chr_0014_aurora_reduce_damage: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: ['Skill/Character/Common/Shielded'],
      extendTags: [],
      blackboard: { duration: 9999, potential_1: 0, taken_dmg: 0.1 },
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
            buffId: 'buff_chr_0014_aurora_reduce_damage_remain',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            blackboardAssignments: { duration: { kind: 'constant', value: 0.5 } },
            copiedBlackboardAssignments: { potential_1: 'potential_1', taken_dmg: 'taken_dmg' },
          }),
        ),
      },
    },
    buff_chr_0014_aurora_reduce_damage_remain: {
      stackingType: 'refresh',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 0.5, potential_1: 0, taken_dmg: 0.1 },
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
      },
    },
    buff_chr_0014_aurora_talent_0: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { heal_up: 0.1, rate: 0.5 },
      attributeModifiers: [],
      healModifiers: [
        {
          enabledSide: 'healer',
          condition: {
            kind: 'targetHealthCompare',
            valueType: 'ratio',
            operator: 'lessOrEqual',
            value: { blackboardKey: 'rate' },
          },
          processors: [
            {
              kind: 'modifyCalculationResult',
              timing: 'afterCalculation',
              baseMultiplier: { blackboardKey: 'heal_up' },
              multiplierCount: 1,
            },
          ],
        },
      ],
    },
    buff_chr_0014_aurora_ultimate_skill_dmg: {
      stackingType: 'highPriority',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 5,
      triggerIntervalSeconds: 0.5,
      waitFirstTriggerInterval: true,
      maxTriggerCount: -1,
      applyTags: [],
      extendTags: [],
      blackboard: { atk_scale_loop: 0.1 },
      attributeModifiers: [],
      lifecycleSequences: {
        trigger: sequence(
          step(
            'dealDamage',
            {
              damageType: 'cryo',
              attackScale: { kind: 'blackboard', key: 'atk_scale_loop' },
              tags: ['ultimateSkill'],
            },
            'buff_chr_0014_aurora_ultimate_skill_dmg:/lifecycleSequences/trigger/steps/0',
          ),
        ),
      },
    },
    buff_chr_0014_aurora_ultimate_skill_frost: {
      stackingType: 'stack',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: { blackboardKey: 'duration' },
      triggerIntervalSeconds: 2,
      waitFirstTriggerInterval: true,
      maxTriggerCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { duration: 5, extra_duration: 0, frozen_level: 1 },
      attributeModifiers: [],
      lifecycleSequences: {
        enable: sequence(
          branch(
            {
              kind: 'enemySuperArmorCompare',
              operator: 'less',
              value: { kind: 'constant', value: 30 },
            },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 2 },
                slot: 'TimeDilation/Layer/Entity/Frozen',
                priority: 50,
                curve: {
                  kind: 'inline',
                  keys: [
                    {
                      time: 0,
                      value: 1,
                      inTangent: -1,
                      outTangent: -1,
                      weightedMode: 0,
                      inWeight: 0,
                      outWeight: 0.333333343,
                    },
                    {
                      time: 1,
                      value: 0,
                      inTangent: -1,
                      outTangent: -1,
                      weightedMode: 0,
                      inWeight: 0.333333343,
                      outWeight: 0,
                    },
                  ],
                },
                finishByAction: true,
                targets: ['enemy'],
              }),
            ),
          ),
        ),
        trigger: sequence(
          step('applyBuff', {
            buffId: 'buff_common_cryst_cryst_frozen_triggered',
            target: 'buffOwner',
            source: 'buffSource',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: { extra_duration: 'extra_duration' },
          }),
        ),
      },
    },
  },
  abilityEntityDefinitions: {
    abilityentity_chr_0014_aurora_combo_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'SelectCategory/ProjectilePassThru',
      ],
      lifetime: { kind: 'limited', durationSeconds: 3 },
      deathReleaseDelaySeconds: 0.100000001490116,
      childSkill: {
        skillId: 'chr_0014_aurora_combo_skill_abilityrange',
        blackboard: {
          duration: 0,
          heal_scale: 1,
          heal_scale_loop: 1,
          heal_static_value: 0,
          heal_static_value_loop: 0,
          interval: 0,
        },
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
              step('applyBuff', {
                buffId: 'buff_chr_0014_aurora_combo_skill_heal',
                target: 'partyExceptCaster',
                finishByAction: true,
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: {
                  heal_scale: { kind: 'blackboard', key: 'heal_scale' },
                  heal_static_value: { kind: 'blackboard', key: 'heal_static_value' },
                },
              }),
            ),
            3,
          ),
          scheduled(
            0,
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0014_aurora_combo_skill_heal_loop',
                target: 'partyExceptCaster',
                finishByAction: true,
                inheritSourceSkillCastInfo: true,
                blackboardAssignments: {
                  heal_scale_loop: { kind: 'blackboard', key: 'heal_scale_loop' },
                  heal_static_value_loop: { kind: 'blackboard', key: 'heal_static_value_loop' },
                  duration: { kind: 'blackboard', key: 'duration' },
                  interval: { kind: 'blackboard', key: 'interval' },
                },
              }),
            ),
            900,
          ),
          scheduled(90, sequence(step('finishActionOwnerAbilityEntity', {})), 93),
        ],
      },
    },
    abilityentity_chr_0014_aurora_ultimate_skill: {
      bornTags: [
        'Immune/Damage',
        'SelectCategory/Unmarkable',
        'SelectCategory/UnSkillManualSelectable',
        'SelectCategory/UnSkillAutoSelectable',
        'SelectCategory/ProjectilePassThru',
      ],
      lifetime: { kind: 'limited', durationSeconds: 8 },
      deathReleaseDelaySeconds: 0.100000001490116,
      childSkills: {
        chr_0014_aurora_ultimate_skill_abilityrange_potential2: {
          skillId: 'chr_0014_aurora_ultimate_skill_abilityrange_potential2',
          blackboard: { atk_scale: 4, atk_scale_loop: 1, extra_duration: 0, frozen_level: 1 },
          scheduledSequences: [
            scheduled(
              4,
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0014_aurora_ultimate_skill_frost',
                  target: 'enemy',
                  finishByAction: true,
                  inheritSourceSkillCastInfo: true,
                  blackboardAssignments: {
                    extra_duration: { kind: 'blackboard', key: 'extra_duration' },
                  },
                }),
                step('applyBuff', {
                  buffId: 'buff_chr_0014_aurora_ultimate_skill_dmg',
                  target: 'enemy',
                  finishByAction: true,
                  inheritSourceSkillCastInfo: true,
                  blackboardAssignments: {
                    atk_scale_loop: { kind: 'blackboard', key: 'atk_scale_loop' },
                  },
                }),
              ),
              156,
            ),
          ],
        },
        chr_0014_aurora_ultimate_skill_abilityrange: {
          skillId: 'chr_0014_aurora_ultimate_skill_abilityrange',
          blackboard: { atk_scale: 4, atk_scale_loop: 1, extra_duration: 0, frozen_level: 1 },
          scheduledSequences: [
            scheduled(
              4,
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0014_aurora_ultimate_skill_frost',
                  target: 'enemy',
                  finishByAction: true,
                  inheritSourceSkillCastInfo: true,
                  blackboardAssignments: {
                    extra_duration: { kind: 'blackboard', key: 'extra_duration' },
                  },
                }),
                step('applyBuff', {
                  buffId: 'buff_chr_0014_aurora_ultimate_skill_dmg',
                  target: 'enemy',
                  finishByAction: true,
                  inheritSourceSkillCastInfo: true,
                  blackboardAssignments: {
                    atk_scale_loop: { kind: 'blackboard', key: 'atk_scale_loop' },
                  },
                }),
              ),
              157,
            ),
          ],
        },
      },
    },
  },
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default snowshine;
