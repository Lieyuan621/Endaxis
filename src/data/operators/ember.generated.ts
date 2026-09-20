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

export const emberChr_0009_azrila_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0009_azrila_attack1',
    timelineBlockFrames: 24,
    naturalDurationFrames: 163,
    exclusiveFrame: 38,
    offsetRecordFrame: 13,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 38,
          input: 'basicAttack',
          targetSkillId: 'chr_0009_azrila_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 24, endFrame: 38, skillIds: ['chr_0009_azrila_attack2'] }],
    },
    costFrame: 15,
    scheduledSequences: [
      scheduled(
        13,
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
                'chr_0009_azrila_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0',
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
        18,
      ),
      scheduled(
        24,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0009_azrila_attack2'] })),
        38,
      ),
    ],
    timelineContinuationSkillId: 'chr_0009_azrila_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.38, 0.42, 0.46, 0.5, 0.54, 0.57, 0.61, 0.65, 0.69, 0.74, 0.79, 0.86] },
);

export const emberChr_0009_azrila_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0009_azrila_attack2',
    timelineBlockFrames: 18,
    naturalDurationFrames: 151,
    exclusiveFrame: 26,
    offsetRecordFrame: 6,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 41,
          input: 'basicAttack',
          targetSkillId: 'chr_0009_azrila_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 18, endFrame: 41, skillIds: ['chr_0009_azrila_attack3'] }],
    },
    costFrame: 6,
    scheduledSequences: [
      scheduled(
        6,
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
                'chr_0009_azrila_attack2:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.26 },
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
        12,
      ),
      scheduled(
        18,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0009_azrila_attack3'] })),
        41,
      ),
    ],
    timelineContinuationSkillId: 'chr_0009_azrila_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.54, 0.59, 0.64, 0.7, 0.75, 0.8, 0.86, 0.91, 0.96, 1.03, 1.11, 1.2] },
);

export const emberChr_0009_azrila_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0009_azrila_attack3',
    timelineBlockFrames: 35,
    naturalDurationFrames: 182,
    exclusiveFrame: 47,
    offsetRecordFrame: 18,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 50,
          input: 'basicAttack',
          targetSkillId: 'chr_0009_azrila_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 35, endFrame: 50, skillIds: ['chr_0009_azrila_attack4'] }],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        18,
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
                'chr_0009_azrila_attack3:/scheduledSequences/0/sequence/steps/0/body/steps/0',
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
        22,
      ),
      scheduled(
        35,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0009_azrila_attack4'] })),
        50,
      ),
    ],
    timelineContinuationSkillId: 'chr_0009_azrila_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  { atb: 0, atk_scale: [0.66, 0.73, 0.8, 0.86, 0.93, 0.99, 1.06, 1.13, 1.19, 1.28, 1.38, 1.49] },
);

export const emberChr_0009_azrila_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0009_azrila_attack4',
    timelineBlockFrames: 53,
    naturalDurationFrames: 180,
    exclusiveFrame: 52,
    offsetRecordFrame: 26,
    costFrame: 12,
    scheduledSequences: [
      scheduled(
        26,
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
                'chr_0009_azrila_attack4:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.3 },
                    slot: 'TimeDilation/Layer/Entity/HitStop',
                    priority: 10,
                    curve: { kind: 'named', key: 'char_hard_stop' },
                    finishByAction: false,
                    targets: ['enemy', 'caster'],
                  }),
                  once(
                    'SkillData.chr_0009_azrila_attack4.actionGroupData.timelineActions[7]._sequenceActionData.actionData[0].actionOnTick.actionData[2].succeedActions.actionData[2]',
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
        29,
      ),
    ],
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 28,
    atk_scale: [0.82, 0.9, 0.98, 1.06, 1.14, 1.22, 1.31, 1.39, 1.47, 1.57, 1.69, 1.84],
    poise: 25,
  },
);

export const emberChr_0009_azrila_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0009_azrila_power_attack',
    timelineBlockFrames: 28,
    naturalDurationFrames: 222,
    exclusiveFrame: 50,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 28,
          endFrame: 44,
          skillIds: ['chr_0009_azrila_normal_skill', 'chr_0009_azrila_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        23,
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
            'chr_0009_azrila_power_attack:/scheduledSequences/0/sequence/steps/0',
          ),
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
        ),
        32,
      ),
      scheduled(
        23,
        sequence(
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.5 },
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
        26,
      ),
      scheduled(
        9,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              calculation: 'breakingAttack',
              calculationMultiplier: 0.1,
              tags: ['normalAttack', 'powerAttack'],
            },
            'chr_0009_azrila_power_attack:/scheduledSequences/2/sequence/steps/0',
          ),
          repeatEachTick(
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
        28,
      ),
    ],
    skillType: 'finisher',
    levelSource: 'basicAttack',
    nativeSkillType: 'breakingAttack',
  },
  { atk_scale: [4, 4.4, 4.8, 5.2, 5.6, 6, 6.4, 6.8, 7.2, 7.7, 8.3, 9] },
);

export const emberChr_0009_azrila_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0009_azrila_plunging_attack_end',
    timelineBlockFrames: 12,
    naturalDurationFrames: 128,
    exclusiveFrame: 20,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [{ startFrame: 12, endFrame: 21, skillIds: ['chr_0009_azrila_attack1'] }],
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
            'chr_0009_azrila_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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

export const emberChr_0009_azrila_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0009_azrila_normal_skill',
    timelineBlockFrames: 51,
    naturalDurationFrames: 162,
    exclusiveFrame: 55,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 51, endFrame: 60, skillIds: ['chr_0009_azrila_normal_skill'] },
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
          step('listenForCombatEvents', {
            responses: [
              {
                key: 'SkillData.chr_0009_azrila_normal_skill.actionGroupData.timelineActions[2]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
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
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_chr_0009_azrila_normal_skill_gpsuccess',
                        target: 'caster',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  ),
                ),
              },
            ],
          }),
        ),
        38,
      ),
      scheduled(
        0,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'talent1', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'shelterrate',
                    operation: 'add',
                    value: { kind: 'blackboard', key: 'extrashelter' },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              step('applyBuff', {
                buffId: 'buff_chr_0009_azrila_normal_skill_shelter',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                blackboardAssignments: { duration: { kind: 'constant', value: -1 } },
                copiedBlackboardAssignments: { rate: 'shelterrate' },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        38,
      ),
      scheduled(
        10,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'heat',
                  attackScale: { kind: 'blackboard', key: 'atk_scale' },
                  tags: ['normalSkill'],
                  features: ['canBreakWeakness'],
                },
                'chr_0009_azrila_normal_skill:/scheduledSequences/3/sequence/steps/0/body/steps/0',
              ),
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
        15,
      ),
      scheduled(
        38,
        sequence(
          branch(
            {
              kind: 'all',
              conditions: [
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'talent1', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
              ],
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0009_azrila_normal_skill_shelter',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: { rate: 'shelterrate', duration: 'extratime' },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('applyKnockDown', {
            target: 'enemy',
            duration: { kind: 'constant', value: 1.5 },
            force: false,
            isExtra: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          }),
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale2' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0009_azrila_normal_skill:/scheduledSequences/4/sequence/steps/2',
          ),
          branch(
            {
              kind: 'buffIdStackCompare',
              target: 'caster',
              buffIds: ['buff_chr_0009_azrila_normal_skill_gpsuccess'],
              operator: 'greaterOrEqual',
              value: { kind: 'constant', value: 1 },
            },
            sequence(step('dealStagger', { value: { kind: 'blackboard', key: 'extrapoise' } })),
            undefined,
            { alwaysNext: true },
          ),
          step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
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
        41,
      ),
      scheduled(
        0,
        sequence(
          step('modifyActionValue', {
            key: 'input_angle',
            operation: 'assign',
            value: { kind: 'constant', value: 100 },
          }),
        ),
        3,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    atk_scale: [0.32, 0.36, 0.39, 0.42, 0.45, 0.49, 0.52, 0.55, 0.58, 0.62, 0.67, 0.73],
    atk_scale2: [1.41, 1.55, 1.69, 1.83, 1.97, 2.11, 2.26, 2.4, 2.54, 2.71, 2.92, 3.17],
    extrapoise: 10,
    extrashelter: 0,
    extratime: 0,
    input_angle: 0,
    poise: 10,
    potential_1: 0,
    shelterrate: 0,
    talent1: 0,
  },
);

export const emberChr_0009_azrila_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0009_azrila_ultimate_skill',
    timelineBlockFrames: 59,
    naturalDurationFrames: 262,
    exclusiveFrame: 90,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 59,
          endFrame: 90,
          skillIds: ['chr_0009_azrila_normal_skill', 'chr_0009_azrila_combo_skill'],
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
        50,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential_5', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              step('modifyActionValue', {
                key: 'hp_percent',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'extrashield' },
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
            targetKey: 'FinalShield',
          }),
          step('modifyActionValue', {
            key: 'FinalShield',
            operation: 'multiply',
            value: { kind: 'blackboard', key: 'hp_percent' },
          }),
          step(
            'dealDamage',
            {
              damageType: 'heat',
              attackScale: { kind: 'blackboard', key: 'atk_scale' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
              stagger: { kind: 'blackboard', key: 'poise' },
            },
            'chr_0009_azrila_ultimate_skill:/scheduledSequences/1/sequence/steps/3',
          ),
          step('applyBuff', {
            buffId: 'buff_chr_0009_azrila_ultimateshield',
            target: 'party',
            inheritSourceSkillCastInfo: true,
            copiedBlackboardAssignments: {
              duration: 'duration',
              hp_percent: 'hp_percent',
              potential_5: 'potential_5',
              extraattack: 'extraattack',
              FinalShield: 'FinalShield',
            },
          }),
        ),
        51,
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
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 48),
      scheduled(
        0,
        sequence(
          step('startUltimateTimeDilation', {
            priority: 100,
            targetScale: { kind: 'constant', value: 0 },
            ignoredTargets: [],
          }),
        ),
        48,
      ),
    ],
    cooldownFrames: 600,
    costs: [{ resource: 'ultimateEnergy', value: 100 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale: [2.89, 3.18, 3.47, 3.76, 4.04, 4.33, 4.62, 4.91, 5.2, 5.56, 5.99, 6.5],
    duration: 10,
    extraattack: 0,
    extrashield: 0,
    FinalShield: 0,
    hp_percent: [0.18, 0.18, 0.18, 0.2, 0.2, 0.2, 0.22, 0.22, 0.22, 0.25, 0.25, 0.25],
    poise: 25,
    potential_5: 0,
  },
);

export const emberChr_0009_azrila_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0009_azrila_combo_skill',
    timelineBlockFrames: 39,
    naturalDurationFrames: 161,
    exclusiveFrame: 38,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 40, endFrame: 60, skillIds: ['chr_0009_azrila_normal_skill'] },
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
              left: { kind: 'blackboard', key: 'talent1', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              branch(
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                sequence(
                  step('modifyActionValue', {
                    key: 'shelterrate',
                    operation: 'add',
                    value: { kind: 'blackboard', key: 'extrashelter' },
                  }),
                ),
                undefined,
                { alwaysNext: true },
              ),
              step('applyBuff', {
                buffId: 'buff_chr_0009_azrila_normal_skill_shelter',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                finishByAction: true,
                blackboardAssignments: { duration: { kind: 'constant', value: -1 } },
                copiedBlackboardAssignments: { rate: 'shelterrate' },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
        ),
        26,
      ),
      scheduled(
        26,
        sequence(
          branch(
            {
              kind: 'all',
              conditions: [
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'potential_1', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
                {
                  kind: 'actionValueCompare',
                  left: { kind: 'blackboard', key: 'talent1', fallback: 0 },
                  operator: 'greater',
                  right: { kind: 'constant', value: 0 },
                },
              ],
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0009_azrila_normal_skill_shelter',
                target: 'caster',
                inheritSourceSkillCastInfo: true,
                copiedBlackboardAssignments: { rate: 'shelterrate', duration: 'extratime' },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('applyKnockDown', {
            target: 'enemy',
            duration: { kind: 'constant', value: 1.5 },
            force: false,
            isExtra: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
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
            'chr_0009_azrila_combo_skill:/scheduledSequences/1/sequence/steps/2',
          ),
          step('heal', {
            target: 'controlledOperator',
            alwaysNext: true,
            tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
            attribute: 'will',
            multiplier: { kind: 'blackboard', key: 'will_additive' },
            addition: { kind: 'blackboard', key: 'heal_base' },
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential_3', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              step('findCharacterTeamTargets', {
                saveToContextKey: 'Main',
                selection: { kind: 'controlledOperator' },
              }),
              step('findCharacterTeamTargets', {
                saveToContextKey: 'CureTarget',
                selection: { kind: 'lowestHealthRatioOperator', excludedContextKey: 'Main' },
              }),
              step('modifyActionValue', {
                key: 'will_additive',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'extracure' },
              }),
              step('modifyActionValue', {
                key: 'heal_base',
                operation: 'multiply',
                value: { kind: 'blackboard', key: 'extracure' },
              }),
              step('heal', {
                target: 'contextTarget',
                contextKey: 'CureTarget',
                alwaysNext: true,
                tags: ['Skill/Character/Common/Heal/ComboSkillHeal'],
                attribute: 'will',
                multiplier: { kind: 'blackboard', key: 'will_additive' },
                addition: { kind: 'blackboard', key: 'heal_base' },
              }),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('changeResourceByActionValue', {
            resource: 'ultimateEnergy',
            amount: { kind: 'blackboard', key: 'usp' },
            coefficient: { kind: 'constant', value: 1 },
            recipient: 'caster',
          }),
        ),
        27,
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
    smartTarget: 'input',
    cooldownFrames: [570, 570, 570, 570, 570, 570, 570, 570, 570, 570, 570, 540],
    skillType: 'comboSkill',
    levelSource: 'comboSkill',
    nativeSkillType: 'comboSkill',
  },
  {
    atk_scale: [1.02, 1.12, 1.22, 1.33, 1.43, 1.53, 1.63, 1.73, 1.84, 1.96, 2.12, 2.3],
    extracure: 0,
    extrashelter: 0,
    extratime: 0,
    heal_base: [300, 360, 420, 480, 510, 540, 570, 600, 630, 645, 660, 675],
    poise: 10,
    potential_1: 0,
    potential_3: 0,
    shelterrate: 0,
    talent1: 0,
    usp: 10,
    will_additive: [0.7, 0.84, 0.98, 1.12, 1.19, 1.26, 1.33, 1.4, 1.47, 1.51, 1.54, 1.58],
  },
);

export const emberCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const ember: OperatorDefinition = {
  slug: 'ember',
  gameId: 'EMBER',
  rarity: 6,
  weaponType: 'greatsword',
  element: 'heat',
  role: 'defender',
  mainAttribute: 'strength',
  secondaryAttribute: 'will',
  attributes: {
    strength: [21, 54, 89, 124, 159, 176],
    agility: [9, 28, 47, 67, 87, 96],
    intellect: [8, 25, 42, 60, 77, 86],
    will: [13, 36, 60, 84, 108, 120],
    baseAttack: [30, 93, 159, 225, 291, 323],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        emberChr_0009_azrila_attack1,
        emberChr_0009_azrila_attack2,
        emberChr_0009_azrila_attack3,
        emberChr_0009_azrila_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: emberChr_0009_azrila_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: emberChr_0009_azrila_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: emberChr_0009_azrila_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: emberChr_0009_azrila_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: emberChr_0009_azrila_combo_skill,
    },
  ],
  dodgeSkill: emberCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0009_azrila_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0009_azrila_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0009_azrila_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0009_azrila_attack1',
        'chr_0009_azrila_attack2',
        'chr_0009_azrila_attack3',
        'chr_0009_azrila_attack4',
        'chr_0009_azrila_plunging_attack_end',
        'chr_0009_azrila_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0009_azrila_attack1',
        'chr_0009_azrila_attack2',
        'chr_0009_azrila_attack3',
        'chr_0009_azrila_attack4',
      ],
      defaultSkillKey: 'chr_0009_azrila_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0009_azrila_combo_skill',
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
          blackboardKey: 'talent1',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'shelterrate',
          operation: 'assign',
          value: [0.3, 0.5],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'talent1',
          operation: 'assign',
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'shelterrate',
          operation: 'assign',
          value: [0.3, 0.5],
        },
      ],
    },
    {
      levels: 2,
      passiveSkills: [
        {
          key: 'chr_0009_azrila_talent_2',
          blackboard: { attack: [0.06, 0.09], duration: [7, 7] },
          enableSequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0009_azrila_talent_2',
              target: 'caster',
              inheritSourceSkillCastInfo: false,
              blackboardAssignments: {
                attack: { kind: 'blackboard', key: 'attack' },
                duration: { kind: 'blackboard', key: 'duration' },
              },
            }),
          ),
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
          blackboardKey: 'extrashelter',
          operation: 'assign',
          value: 0.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'battleSkill',
          blackboardKey: 'extratime',
          operation: 'assign',
          value: 1.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential_1',
          operation: 'assign',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'extrashelter',
          operation: 'assign',
          value: 0.2,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'extratime',
          operation: 'assign',
          value: 1.5,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 20 },
        { kind: 'addBuildAttribute', attributes: ['will'], value: 20 },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'extracure',
          operation: 'assign',
          value: 0.5,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'comboSkill',
          blackboardKey: 'potential_3',
          operation: 'assign',
          value: 1,
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
          blackboardKey: 'extrashield',
          operation: 'assign',
          value: 1.2,
        },
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
          blackboardKey: 'extraattack',
          operation: 'assign',
          value: 0.1,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0009_azrila_normal_skill_gpsuccess: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      durationSeconds: 2,
      applyTags: [],
      extendTags: [],
      blackboard: { def: 0, dur: 0, prob: 0 },
      attributeModifiers: [],
      scheduledSequences: [
        scheduled(
          0,
          sequence(
            step('startTimeDilation', {
              scope: 'entity',
              durationSeconds: { kind: 'constant', value: 0.2 },
              slot: 'TimeDilation/Layer/Entity/HitStop',
              priority: 100,
              curve: { kind: 'named', key: 'char_hard_stop' },
              finishByAction: false,
              targets: ['enemy', 'caster'],
            }),
          ),
          96,
        ),
      ],
      abilityEventResponses: [
        {
          event: 'skillEnd',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventSkillIdIn', skillIds: ['chr_0009_azrila_normal_skill'] },
              sequence(
                step('finishCurrentBuff', { reason: 'other', finishSource: 'actionSource' }),
              ),
            ),
          ),
        },
      ],
    },
    buff_chr_0009_azrila_normal_skill_shelter: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 0,
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_affix_shelter',
        iconPath: '/icons/icon_battle_affix_shelter.webp',
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
      blackboard: { duration: 0, rate: 0 },
      attributeModifiers: [],
      lifecycleSequences: {
        start: sequence(
          step('applyBuff', {
            buffId: 'buff_common_affixes_shelter',
            target: 'caster',
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
    buff_chr_0009_azrila_talent_2: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { attack: 0, duration: 0 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'takeDamage',
          priority: 0,
          sequence: sequence(
            step('applyBuff', {
              buffId: 'buff_chr_0009_azrila_talent_2_buff',
              target: 'buffOwner',
              source: 'buffOwner',
              inheritSourceSkillCastInfo: true,
              asChildBuff: true,
              copiedBlackboardAssignments: { attack: 'attack', duration: 'duration' },
            }),
          ),
        },
      ],
    },
    buff_chr_0009_azrila_talent_2_buff: {
      stackingType: 'enhanceAndOverwriteDuration',
      priority: 0,
      maxStackCount: 3,
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
      blackboard: { attack: 0, duration: 0 },
      attributeModifiers: [
        { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'attack' } },
      ],
    },
    buff_chr_0009_azrila_ultimate_skill_shield_extraattack: {
      stackingType: 'unlimited',
      priority: 0,
      maxStackCount: 0,
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
      blackboard: {
        duration: 8,
        extraattack: 0,
        extrashield: 0,
        hp_percent: 0,
        potential_5: 0,
        shelter: 0,
      },
      attributeModifiers: [
        { attribute: 'Atk', slot: 'baseMultiplier', value: { blackboardKey: 'extraattack' } },
      ],
    },
    buff_chr_0009_azrila_ultimateshield: {
      stackingType: 'unlimited',
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
      blackboard: {
        duration: 8,
        extraattack: 0,
        extrashield: 0,
        FinalShield: 0,
        hp_percent: 0,
        potential_5: 0,
        shelter: 0,
      },
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
          replaceHitEffect: false,
        },
      ],
      lifecycleSequences: {
        start: sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential_5', fallback: 0 },
              operator: 'greater',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_chr_0009_azrila_ultimate_skill_shield_extraattack',
                target: 'buffOwner',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
                asChildBuff: true,
                copiedBlackboardAssignments: { extraattack: 'extraattack' },
              }),
            ),
          ),
        ),
      },
    },
  },
  abilityEntityDefinitions: {},
  conversionSupport: { completeness: 'complete', missingCapabilities: [] },
} as const satisfies OperatorDefinition;

export default ember;
