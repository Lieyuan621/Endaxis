/** 由 tools/game-data-compiler 整名生成；不要手工编辑。 */
import type {
  ActionSequenceDefinition,
  OperatorDefinition,
  SkillDefinition,
} from '../../core/game-data/operatorDefinition';
import {
  branch,
  forEachTarget,
  repeatEachTick,
  scheduled,
  sequence,
  step,
  withSkillBlackboard,
} from './definitionHelpers';

const sharedActionSequence1: ActionSequenceDefinition = sequence(
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
      step('igniteBuffs', { target: 'buffOwner', source: 'buffOwner', igniteType: 'NoGuard' }),
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
      branch(
        {
          kind: 'currentBuffStackCompare',
          operator: 'greaterOrEqual',
          value: { kind: 'constant', value: 2 },
        },
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'skip_handle_cryst_break', fallback: 0 },
              operator: 'equal',
              right: { kind: 'constant', value: 0 },
            },
            sequence(
              step('applyBuff', {
                buffId: 'buff_physical_handle_cryst_break',
                target: 'buffOwner',
                source: 'buffSource',
                inheritSourceSkillCastInfo: true,
              }),
            ),
          ),
        ),
      ),
    ),
  },
);

const sharedActionSequence2: ActionSequenceDefinition = sequence(
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
        buffId: 'buff_physical_no_guard',
        target: 'buffOwner',
        source: 'buffSource',
        inheritSourceSkillCastInfo: true,
        blackboardAssignments: { skip_handle_cryst_break: { kind: 'constant', value: 1 } },
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
      step('readSkillSettingData', {
        items: [
          {
            values: [1.2, 1.2, 1.2, 1.2],
            column: { kind: 'constant', value: 1 },
            storeKey: 'atk_scale',
            enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.01 } },
          },
          {
            values: [10, 10, 10, 10],
            column: { kind: 'constant', value: 1 },
            storeKey: 'poise',
            enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0.005 } },
          },
        ],
      }),
      step('dealDamage', {
        damageType: 'physical',
        attackScale: { kind: 'blackboard', key: 'atk_scale' },
        tags: [],
        features: ['physicalInfliction'],
        stagger: { kind: 'blackboard', key: 'poise' },
      }),
    ),
  },
  {
    kind: 'withActionBlackboardScope',
    parameters: {
      scopeKey: 'native-buff-callback:2',
      lifetime: 'execution',
      alwaysNext: true,
      shareParentBlackboard: true,
      initialValues: {},
      inheritParent: true,
    },
    body: sequence(
      step('applyBuff', {
        buffId: 'buff_physical_handle_cryst_break',
        target: 'buffOwner',
        source: 'buffSource',
        inheritSourceSkillCastInfo: true,
      }),
    ),
  },
  {
    kind: 'withActionBlackboardScope',
    parameters: {
      scopeKey: 'native-buff-callback:3',
      lifetime: 'execution',
      alwaysNext: true,
      shareParentBlackboard: true,
      initialValues: {},
      inheritParent: true,
    },
    body: sequence(
      step('igniteBuffs', { target: 'buffOwner', source: 'caster', igniteType: 'PhysicalStatus' }),
    ),
  },
);

export const daPanChr_0018_dapan_attack1: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0018_dapan_attack1',
    timelineBlockFrames: 15,
    naturalDurationFrames: 176,
    exclusiveFrame: 20,
    offsetRecordFrame: 13,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 30,
          input: 'basicAttack',
          targetSkillId: 'chr_0018_dapan_attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 15, endFrame: 30, skillIds: ['chr_0018_dapan_attack2'] }],
    },
    costFrame: 9,
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
                'chr_0018_dapan_attack1:/scheduledSequences/0/sequence/steps/0/body/steps/0',
              ),
              branch(
                { kind: 'casterControlled' },
                sequence(
                  step('startTimeDilation', {
                    scope: 'entity',
                    durationSeconds: { kind: 'constant', value: 0.08 },
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
        15,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0018_dapan_attack2'] })),
        30,
      ),
    ],
    timelineContinuationSkillId: 'chr_0018_dapan_attack2',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.28, 0.31, 0.34, 0.37, 0.39, 0.42, 0.45, 0.48, 0.51, 0.54, 0.58, 0.63],
    env_dmg: 20,
  },
);

export const daPanChr_0018_dapan_attack2: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0018_dapan_attack2',
    timelineBlockFrames: 20,
    naturalDurationFrames: 171,
    exclusiveFrame: 30,
    offsetRecordFrame: 7,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 25,
          input: 'basicAttack',
          targetSkillId: 'chr_0018_dapan_attack3',
        },
      ],
      allowedNextSkills: [{ startFrame: 20, endFrame: 25, skillIds: ['chr_0018_dapan_attack3'] }],
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
            'chr_0018_dapan_attack2:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.08 },
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
        20,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0018_dapan_attack3'] })),
        25,
      ),
    ],
    timelineContinuationSkillId: 'chr_0018_dapan_attack3',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.34, 0.37, 0.4, 0.44, 0.47, 0.5, 0.54, 0.57, 0.6, 0.64, 0.7, 0.75],
    env_dmg: 20,
  },
);

export const daPanChr_0018_dapan_attack3: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0018_dapan_attack3',
    timelineBlockFrames: 25,
    naturalDurationFrames: 193,
    exclusiveFrame: 38,
    offsetRecordFrame: 10,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 40,
          input: 'basicAttack',
          targetSkillId: 'chr_0018_dapan_attack4',
        },
      ],
      allowedNextSkills: [{ startFrame: 25, endFrame: 40, skillIds: ['chr_0018_dapan_attack4'] }],
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
                'chr_0018_dapan_attack3:/scheduledSequences/0/sequence/steps/0/body/steps/0',
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
        23,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale_2' },
              tags: ['normalAttack'],
            },
            'chr_0018_dapan_attack3:/scheduledSequences/1/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.15 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 10,
                curve: { kind: 'named', key: 'char_hard_zero' },
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
        24,
      ),
      scheduled(
        25,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0018_dapan_attack4'] })),
        40,
      ),
    ],
    timelineContinuationSkillId: 'chr_0018_dapan_attack4',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 0,
    atk_scale: [0.17, 0.18, 0.2, 0.22, 0.23, 0.25, 0.27, 0.28, 0.3, 0.32, 0.35, 0.38],
    atk_scale_2: [0.34, 0.37, 0.4, 0.44, 0.47, 0.5, 0.54, 0.57, 0.6, 0.64, 0.7, 0.75],
    env_dmg: 5,
    env_dmg2: 15,
    display_atk_scale: [0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.97, 1.04, 1.13],
  },
);

export const daPanChr_0018_dapan_attack4: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0018_dapan_attack4',
    timelineBlockFrames: 45,
    naturalDurationFrames: 236,
    exclusiveFrame: 60,
    offsetRecordFrame: 32,
    inputWindows: {
      commandMappings: [
        {
          startFrame: 0,
          endFrame: 70,
          input: 'basicAttack',
          targetSkillId: 'chr_0018_dapan_attack1',
        },
      ],
      allowedNextSkills: [{ startFrame: 45, endFrame: 70, skillIds: ['chr_0018_dapan_attack1'] }],
    },
    costFrame: 9,
    scheduledSequences: [
      scheduled(
        32,
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
            'chr_0018_dapan_attack4:/scheduledSequences/0/sequence/steps/0',
          ),
          branch(
            { kind: 'casterControlled' },
            sequence(
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.1 },
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
        33,
      ),
      scheduled(
        45,
        sequence(step('reachSkillOperableBoundary', { skillIds: ['chr_0018_dapan_attack1'] })),
        70,
      ),
    ],
    timelineContinuationSkillId: 'chr_0018_dapan_attack1',
    skillType: 'basicAttack',
    levelSource: 'basicAttack',
    nativeSkillType: 'attack',
  },
  {
    atb: 21,
    atk_scale: [0.6, 0.66, 0.72, 0.78, 0.84, 0.9, 0.96, 1.03, 1.09, 1.16, 1.25, 1.36],
    env_dmg: 50,
    poise: 20,
    talent_heal: 0,
  },
);

export const daPanChr_0018_dapan_power_attack: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0018_dapan_power_attack',
    timelineBlockFrames: 35,
    naturalDurationFrames: 215,
    exclusiveFrame: 46,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 35,
          endFrame: 56,
          skillIds: ['chr_0018_dapan_normal_skill', 'chr_0018_dapan_combo_skill'],
        },
      ],
    },
    costFrame: 4,
    scheduledSequences: [
      scheduled(
        16,
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
            'chr_0018_dapan_power_attack:/scheduledSequences/0/sequence/steps/0',
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
        ),
        19,
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
            'chr_0018_dapan_power_attack:/scheduledSequences/1/sequence/steps/0',
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
          step('gainFinisherSp', { factor: 1, recipient: 'team' }),
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
        46,
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

export const daPanChr_0018_dapan_plunging_attack_end: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0018_dapan_plunging_attack_end',
    timelineBlockFrames: 16,
    naturalDurationFrames: 188,
    exclusiveFrame: 15,
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
            'chr_0018_dapan_plunging_attack_end:/scheduledSequences/0/sequence/steps/0',
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

export const daPanChr_0018_dapan_normal_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0018_dapan_normal_skill',
    timelineBlockFrames: 65,
    naturalDurationFrames: 210,
    exclusiveFrame: 65,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 65, endFrame: 89, skillIds: ['chr_0018_dapan_normal_skill'] },
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
        11,
      ),
      scheduled(
        8,
        sequence(
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale_pre' },
              tags: ['normalSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0018_dapan_normal_skill:/scheduledSequences/1/sequence/steps/0',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_hard_stop' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        11,
      ),
      scheduled(
        43,
        sequence(
          step('applyPhysicalInfliction', {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            noGuardBuffId: 'buff_physical_no_guard',
            noGuardDefinition: {
              stackingType: 'enhanceAndRefresh',
              priority: 100,
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              presentation: {
                visible: true,
                iconId: 'icon_shadow_attribute_penetrate',
                iconPath: '/icons/icon_shadow_attribute_penetrate.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: true,
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
              applyTags: ['Skill/Character/Common/NoGuard'],
              extendTags: [],
              blackboard: { atk_scale: 0, count: 0, duration: 20, skip_handle_cryst_break: 0 },
              attributeModifiers: [],
              lifecycleSequences: {
                start: sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'skip_handle_cryst_break', fallback: 0 },
                      operator: 'equal',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_physical_handle_cryst_break',
                        target: 'buffOwner',
                        source: 'buffSource',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  ),
                ),
                finish: sequence(
                  step('applyBuff', {
                    buffId: 'buff_physical_no_guard_fake',
                    target: 'buffOwner',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
                afterEnhance: sharedActionSequence1,
              },
            },
            airborneBuffId: 'buff_physical_airborne',
            airborneDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0.1,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'airborne',
                iconPath: '/icons/airborne.webp',
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/AirborneStatus'],
              extendTags: [],
              blackboard: { atk_scale: 0, duration: 3, poise: 10 },
              attributeModifiers: [],
              lifecycleSequences: { start: sharedActionSequence2 },
            },
            duration: { kind: 'blackboard', key: 'airborne_duration' },
            height: { kind: 'constant', value: 2.1 },
            speedFactorMultiplier: 3,
            force: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          }),
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'potential_5_interval', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              branch(
                {
                  kind: 'not',
                  condition: {
                    kind: 'timedMarkerPresent',
                    target: 'caster',
                    markerId: 'potential_5_interval',
                  },
                },
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_physical_no_guard',
                    target: 'enemy',
                    inheritSourceSkillCastInfo: true,
                  }),
                  step('createTimedMarker', {
                    target: 'caster',
                    markerId: 'potential_5_interval',
                    durationSeconds: { kind: 'blackboard', key: 'potential_5_interval' },
                    autoFinishByAction: false,
                  }),
                ),
              ),
            ),
            undefined,
            { alwaysNext: true },
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
            'chr_0018_dapan_normal_skill:/scheduledSequences/2/sequence/steps/2',
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
          step('gainSquadUltimateEnergyFromSkillCost', { coefficient: 1 }),
        ),
        46,
      ),
    ],
    costs: [{ resource: 'sp', value: 100 }],
    skillType: 'battleSkill',
    levelSource: 'battleSkill',
    nativeSkillType: 'normalSkill',
  },
  {
    airborne_duration: 1.8,
    atk_scale: [1.15, 1.27, 1.38, 1.5, 1.61, 1.73, 1.84, 1.96, 2.07, 2.22, 2.39, 2.59],
    atk_scale_pre: [0.18, 0.2, 0.22, 0.23, 0.25, 0.27, 0.29, 0.31, 0.32, 0.35, 0.37, 0.41],
    poise: 10,
    potential_5_interval: 0,
  },
);

export const daPanChr_0018_dapan_ultimate_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0018_dapan_ultimate_skill',
    timelineBlockFrames: 86,
    naturalDurationFrames: 235,
    exclusiveFrame: 100,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        {
          startFrame: 86,
          endFrame: 120,
          skillIds: ['chr_0018_dapan_normal_skill', 'chr_0018_dapan_combo_skill'],
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
        1,
      ),
      scheduled(
        0,
        sequence(
          step('applyPhysicalInfliction', {
            type: 'airborne',
            target: 'enemy',
            isExtra: false,
            noGuardBuffId: 'buff_physical_no_guard',
            noGuardDefinition: {
              stackingType: 'enhanceAndRefresh',
              priority: 100,
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              presentation: {
                visible: true,
                iconId: 'icon_shadow_attribute_penetrate',
                iconPath: '/icons/icon_shadow_attribute_penetrate.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: true,
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
              applyTags: ['Skill/Character/Common/NoGuard'],
              extendTags: [],
              blackboard: { atk_scale: 0, count: 0, duration: 20, skip_handle_cryst_break: 0 },
              attributeModifiers: [],
              lifecycleSequences: {
                start: sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'skip_handle_cryst_break', fallback: 0 },
                      operator: 'equal',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_physical_handle_cryst_break',
                        target: 'buffOwner',
                        source: 'buffSource',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  ),
                ),
                finish: sequence(
                  step('applyBuff', {
                    buffId: 'buff_physical_no_guard_fake',
                    target: 'buffOwner',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
                afterEnhance: sharedActionSequence1,
              },
            },
            airborneBuffId: 'buff_physical_airborne',
            airborneDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0.1,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'airborne',
                iconPath: '/icons/airborne.webp',
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/AirborneStatus'],
              extendTags: [],
              blackboard: { atk_scale: 0, duration: 3, poise: 10 },
              attributeModifiers: [],
              lifecycleSequences: { start: sharedActionSequence2 },
            },
            duration: { kind: 'constant', value: 2 },
            height: { kind: 'constant', value: 2 },
            speedFactorMultiplier: 4,
            force: true,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          }),
        ),
        1,
      ),
      scheduled(
        42,
        sequence(
          repeatEachTick(
            sequence(
              step(
                'dealDamage',
                {
                  damageType: 'physical',
                  attackScale: { kind: 'blackboard', key: 'atk_scale_loop' },
                  tags: ['ultimateSkill'],
                  features: ['canBreakWeakness'],
                },
                'chr_0018_dapan_ultimate_skill:/scheduledSequences/2/sequence/steps/0/body/steps/0',
              ),
              step('startTimeDilation', {
                scope: 'entity',
                durationSeconds: { kind: 'constant', value: 0.034 },
                slot: 'TimeDilation/Layer/Entity/HitStop',
                priority: 15,
                curve: { kind: 'named', key: 'RESETto1' },
                finishByAction: true,
                targets: ['caster'],
              }),
            ),
            {
              nativeChanneling: {
                executeEachFrame: true,
                triggerIntervalSeconds: 0.033,
                maxCountPerTarget: 8,
                targetTriggerIntervalSeconds: 0.13,
              },
            },
          ),
        ),
        64,
      ),
      scheduled(
        80,
        sequence(
          branch(
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'talent_1', fallback: 0 },
              operator: 'greaterOrEqual',
              right: { kind: 'constant', value: 1 },
            },
            sequence(
              forEachTarget(
                'enemy',
                sequence(
                  step('applyBuff', {
                    buffId: 'buff_chr_0018_dapan_talent_1_preparation',
                    target: 'caster',
                    inheritSourceSkillCastInfo: true,
                    copiedBlackboardAssignments: {
                      duration: 'talent_1_duration',
                      max_stack: 'talent_1_stack',
                      talent_1_cd_reduce: 'talent_1_cd_reduce',
                    },
                  }),
                ),
              ),
            ),
            undefined,
            { alwaysNext: true },
          ),
          step('applyKnockDown', {
            target: 'enemy',
            duration: { kind: 'constant', value: 2 },
            force: true,
            isExtra: false,
            targetFilter: 'aliveOnly',
            returnWhen: 'always',
          }),
          step(
            'dealDamage',
            {
              damageType: 'physical',
              attackScale: { kind: 'blackboard', key: 'atk_scale_end' },
              tags: ['ultimateSkill'],
              features: ['canBreakWeakness'],
            },
            'chr_0018_dapan_ultimate_skill:/scheduledSequences/3/sequence/steps/2',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.1 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 10,
            curve: { kind: 'named', key: 'char_normal_attack' },
            finishByAction: false,
            targets: ['enemy', 'caster'],
          }),
        ),
        81,
      ),
      scheduled(
        0,
        sequence(
          step('startTimeDilation', {
            scope: 'global',
            durationSeconds: { kind: 'constant', value: 1.2 },
            slot: 'unassigned',
            priority: 100,
            curve: {
              kind: 'inline',
              keys: [
                {
                  time: 0,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0,
                  outWeight: 0.333333343,
                },
                {
                  time: 1,
                  value: 0,
                  inTangent: 0,
                  outTangent: 0,
                  weightedMode: 0,
                  inWeight: 0.333333343,
                  outWeight: 0,
                },
              ],
            },
            finishByAction: true,
            ignoredTargets: ['caster'],
          }),
        ),
        36,
      ),
      scheduled(0, sequence(step('hideUi', { onlyBlockInput: false })), 46),
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
        100,
      ),
    ],
    cooldownFrames: 450,
    costs: [{ resource: 'ultimateEnergy', value: 90 }],
    skillType: 'ultimate',
    levelSource: 'ultimate',
    nativeSkillType: 'ultimateSkill',
  },
  {
    atk_scale_end: [1.78, 1.96, 2.13, 2.31, 2.49, 2.67, 2.84, 3.02, 3.2, 3.42, 3.69, 4],
    atk_scale_loop: [0.22, 0.24, 0.26, 0.29, 0.31, 0.33, 0.35, 0.37, 0.4, 0.42, 0.46, 0.5],
    potential_1_dmg_up: 0,
    potential_1_duration: 0,
    talent_1: 0,
    talent_1_cd_reduce: 0,
    talent_1_duration: 0,
    talent_1_stack: 0,
  },
);

export const daPanChr_0018_dapan_combo_skill: SkillDefinition = withSkillBlackboard(
  {
    key: 'chr_0018_dapan_combo_skill',
    timelineBlockFrames: 24,
    naturalDurationFrames: 146,
    exclusiveFrame: 52,
    offsetRecordFrame: 0,
    inputWindows: {
      allowedNextSkills: [
        { startFrame: 24, endFrame: 59, skillIds: ['chr_0018_dapan_normal_skill'] },
      ],
    },
    costFrame: 0,
    scheduledSequences: [
      scheduled(
        23,
        sequence(
          step('applyPhysicalInfliction', {
            type: 'crush',
            target: 'enemy',
            isExtra: false,
            noGuardBuffId: 'buff_physical_no_guard',
            noGuardDefinition: {
              stackingType: 'enhanceAndRefresh',
              priority: 100,
              maxStackCount: 4,
              durationSeconds: { blackboardKey: 'duration' },
              presentation: {
                visible: true,
                iconId: 'icon_shadow_attribute_penetrate',
                iconPath: '/icons/icon_shadow_attribute_penetrate.webp',
                showInHeadBarCommon: false,
                showInHeadBarAttached: true,
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
              applyTags: ['Skill/Character/Common/NoGuard'],
              extendTags: [],
              blackboard: { atk_scale: 0, count: 0, duration: 20, skip_handle_cryst_break: 0 },
              attributeModifiers: [],
              lifecycleSequences: {
                start: sequence(
                  branch(
                    {
                      kind: 'actionValueCompare',
                      left: { kind: 'blackboard', key: 'skip_handle_cryst_break', fallback: 0 },
                      operator: 'equal',
                      right: { kind: 'constant', value: 0 },
                    },
                    sequence(
                      step('applyBuff', {
                        buffId: 'buff_physical_handle_cryst_break',
                        target: 'buffOwner',
                        source: 'buffSource',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  ),
                ),
                finish: sequence(
                  step('applyBuff', {
                    buffId: 'buff_physical_no_guard_fake',
                    target: 'buffOwner',
                    source: 'buffSource',
                    inheritSourceSkillCastInfo: true,
                  }),
                ),
                afterEnhance: sharedActionSequence1,
              },
            },
            crushedBuffId: 'buff_physical_crushed',
            crushedDefinition: {
              stackingType: 'stack',
              stackingKey: 'physical',
              priority: 0,
              maxStackCount: 1,
              durationSeconds: { blackboardKey: 'duration' },
              triggerIntervalSeconds: 0,
              waitFirstTriggerInterval: true,
              maxTriggerCount: 1,
              presentation: {
                visible: true,
                iconId: 'knockback',
                iconPath: '/icons/knockback.webp',
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
              applyTags: ['Skill/Character/Common/PhysicalStatus/CrushStatus'],
              extendTags: [],
              blackboard: {
                atk_scale: 1,
                count: 0,
                dmg_multiplier: 1,
                duration: 3,
                ignore_hit_effect: 0,
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
                      step('readBuffStackCount', {
                        target: 'buffOwner',
                        outputKey: 'count',
                        query: { kind: 'id', buffIds: ['buff_physical_no_guard'] },
                      }),
                      step('readSkillSettingData', {
                        items: [
                          {
                            values: [3, 4.5, 6, 7.5],
                            column: { kind: 'blackboard', key: 'count' },
                            storeKey: 'atk_scale',
                            enhance: {
                              target: 'caster',
                              formula: { kind: 'linear', paramA: 0.01 },
                            },
                          },
                        ],
                      }),
                      step('modifyActionValue', {
                        key: 'atk_scale',
                        operation: 'multiply',
                        value: { kind: 'blackboard', key: 'dmg_multiplier' },
                      }),
                      step('finishBuffsById', {
                        target: 'buffOwner',
                        buffIds: ['buff_physical_no_guard'],
                        reason: 'early',
                      }),
                      step('dealDamage', {
                        damageType: 'physical',
                        attackScale: { kind: 'blackboard', key: 'atk_scale' },
                        tags: [],
                        features: ['physicalInfliction'],
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
                        buffId: 'buff_physical_handle_cryst_break',
                        target: 'buffOwner',
                        source: 'buffSource',
                        inheritSourceSkillCastInfo: true,
                      }),
                    ),
                  },
                  {
                    kind: 'withActionBlackboardScope',
                    parameters: {
                      scopeKey: 'native-buff-callback:2',
                      lifetime: 'execution',
                      alwaysNext: true,
                      shareParentBlackboard: true,
                      initialValues: {},
                      inheritParent: true,
                    },
                    body: sequence(
                      step('igniteBuffs', {
                        target: 'buffOwner',
                        source: 'caster',
                        igniteType: 'PhysicalStatus',
                      }),
                    ),
                  },
                  {
                    kind: 'withActionBlackboardScope',
                    parameters: {
                      scopeKey: 'native-buff-callback:3',
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
                          left: { kind: 'blackboard', key: 'ignore_hit_effect', fallback: 0 },
                          operator: 'less',
                          right: { kind: 'constant', value: 0.5 },
                        },
                        sequence({
                          kind: 'switch',
                          parameters: {
                            choice: { kind: 'blackboard', key: 'count' },
                            alwaysNext: true,
                          },
                          options: [
                            {
                              value: { kind: 'constant', value: 0 },
                              sequence: sequence(
                                step('startTimeDilation', {
                                  scope: 'entity',
                                  durationSeconds: { kind: 'constant', value: 0.1 },
                                  slot: 'TimeDilation/Layer/Entity/HitStop',
                                  priority: 15,
                                  curve: { kind: 'named', key: 'interrupt_weakness' },
                                  finishByAction: false,
                                  targets: ['enemy', 'caster'],
                                }),
                              ),
                            },
                            {
                              value: { kind: 'constant', value: 1 },
                              sequence: sequence(
                                step('startTimeDilation', {
                                  scope: 'entity',
                                  durationSeconds: { kind: 'constant', value: 0.1 },
                                  slot: 'TimeDilation/Layer/Entity/HitStop',
                                  priority: 10,
                                  curve: { kind: 'named', key: 'interrupt_weakness' },
                                  finishByAction: false,
                                  targets: ['enemy', 'caster'],
                                }),
                              ),
                            },
                            {
                              value: { kind: 'constant', value: 2 },
                              sequence: sequence(
                                step('startTimeDilation', {
                                  scope: 'entity',
                                  durationSeconds: { kind: 'constant', value: 0.25 },
                                  slot: 'TimeDilation/Layer/Entity/HitStop',
                                  priority: 20,
                                  curve: { kind: 'named', key: 'interrupt_weakness' },
                                  finishByAction: false,
                                  targets: ['enemy', 'caster'],
                                }),
                              ),
                            },
                            {
                              value: { kind: 'constant', value: 3 },
                              sequence: sequence(
                                step('startTimeDilation', {
                                  scope: 'entity',
                                  durationSeconds: { kind: 'constant', value: 0.5 },
                                  slot: 'TimeDilation/Layer/Entity/HitStop',
                                  priority: 20,
                                  curve: { kind: 'named', key: 'interrupt_weakness' },
                                  finishByAction: false,
                                  targets: ['enemy', 'caster'],
                                }),
                              ),
                            },
                            {
                              value: { kind: 'constant', value: 4 },
                              sequence: sequence(
                                step('startTimeDilation', {
                                  scope: 'entity',
                                  durationSeconds: { kind: 'constant', value: 0.65 },
                                  slot: 'TimeDilation/Layer/Entity/HitStop',
                                  priority: 20,
                                  curve: { kind: 'named', key: 'interrupt_weakness' },
                                  finishByAction: false,
                                  targets: ['enemy', 'caster'],
                                }),
                              ),
                            },
                          ],
                        }),
                      ),
                    ),
                  },
                ),
              },
            },
            damageMultiplier: { kind: 'blackboard', key: 'crush_multi' },
            ignoreHitEffect: false,
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
            'chr_0018_dapan_combo_skill:/scheduledSequences/0/sequence/steps/0/whenTrue/steps/1',
          ),
          step('startTimeDilation', {
            scope: 'entity',
            durationSeconds: { kind: 'constant', value: 0.4 },
            slot: 'TimeDilation/Layer/Entity/HitStop',
            priority: 50,
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
        26,
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
    atk_scale: [2.89, 3.18, 3.47, 3.75, 4.04, 4.33, 4.62, 4.91, 5.2, 5.56, 5.99, 6.5],
    crush_multi: [1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1.15, 1.15, 1.15, 1.2],
    poise: 15,
    usp: 10,
  },
);

export const daPanCommon_character_perfect_dodge: SkillDefinition = withSkillBlackboard(
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

export const daPan: OperatorDefinition = {
  slug: 'da-pan',
  gameId: 'DAPAN',
  rarity: 5,
  weaponType: 'greatsword',
  element: 'physical',
  role: 'striker',
  mainAttribute: 'strength',
  secondaryAttribute: 'will',
  attributes: {
    strength: [24, 56, 90, 124, 158, 175],
    agility: [9, 28, 47, 67, 87, 96],
    intellect: [10, 28, 47, 66, 85, 94],
    will: [10, 30, 50, 71, 91, 102],
    baseAttack: [30, 88, 150, 211, 272, 303],
    baseHealth: [500, 1566, 2689, 3811, 4934, 5495],
  },
  skillGroups: [
    {
      key: 'basicAttack',
      skillType: 'basicAttack',
      levelSource: 'basicAttack',
      skills: [
        daPanChr_0018_dapan_attack1,
        daPanChr_0018_dapan_attack2,
        daPanChr_0018_dapan_attack3,
        daPanChr_0018_dapan_attack4,
      ],
    },
    {
      key: 'finisher',
      skillType: 'finisher',
      levelSource: 'basicAttack',
      skills: daPanChr_0018_dapan_power_attack,
    },
    {
      key: 'plungingAttack',
      skillType: 'plungingAttack',
      levelSource: 'basicAttack',
      skills: daPanChr_0018_dapan_plunging_attack_end,
    },
    {
      key: 'battleSkill',
      skillType: 'battleSkill',
      levelSource: 'battleSkill',
      skills: daPanChr_0018_dapan_normal_skill,
    },
    {
      key: 'ultimate',
      skillType: 'ultimate',
      levelSource: 'ultimate',
      skills: daPanChr_0018_dapan_ultimate_skill,
    },
    {
      key: 'comboSkill',
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      skills: daPanChr_0018_dapan_combo_skill,
    },
  ],
  dodgeSkill: daPanCommon_character_perfect_dodge,
  dashBuffs: [
    { buffId: 'buff_common_dash', blackboard: { dodgeSkillId: 'common_character_perfect_dodge' } },
  ],
  skillSlots: [
    { key: 'battleSkill', baseSkillKey: 'chr_0018_dapan_normal_skill', replacementSkillKeys: [] },
    { key: 'comboSkill', baseSkillKey: 'chr_0018_dapan_combo_skill', replacementSkillKeys: [] },
    { key: 'ultimate', baseSkillKey: 'chr_0018_dapan_ultimate_skill', replacementSkillKeys: [] },
  ],
  playerActionRoutes: {
    basicAttack: {
      kind: 'basicAttack',
      skillKeys: [
        'chr_0018_dapan_plunging_attack_end',
        'chr_0018_dapan_attack1',
        'chr_0018_dapan_attack2',
        'chr_0018_dapan_attack3',
        'chr_0018_dapan_attack4',
        'chr_0018_dapan_power_attack',
      ],
      normalAttackSkillKeys: [
        'chr_0018_dapan_attack1',
        'chr_0018_dapan_attack2',
        'chr_0018_dapan_attack3',
        'chr_0018_dapan_attack4',
      ],
      defaultSkillKey: 'chr_0018_dapan_attack1',
    },
    battleSkill: { kind: 'skillSlot', skillSlotKey: 'battleSkill' },
    comboSkill: { kind: 'skillSlot', skillSlotKey: 'comboSkill' },
    ultimate: { kind: 'skillSlot', skillSlotKey: 'ultimate' },
  },
  comboSkillConditions: [
    {
      key: 'native-combo:0',
      skillKey: 'chr_0018_dapan_combo_skill',
      event: 'addedBuff',
      immediately: false,
      initialValues: null,
      sequence: sequence(
        branch(
          {
            kind: 'eventBuffTagsMatch',
            match: 'hasAny',
            buffTags: ['Skill/Character/Common/NoGuard'],
          },
          sequence(
            branch(
              {
                kind: 'contextTargetObjectTypeMatch',
                contextKey: 'trigger',
                objectTypes: ['enemy'],
              },
              sequence(
                branch(
                  {
                    kind: 'contextTargetBuffIdStackCompare',
                    contextKey: 'trigger',
                    buffIds: ['buff_physical_no_guard'],
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 4 },
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
          buffId: 'buff_chr_0018_dapan_talent_0',
          target: 'caster',
          inheritSourceSkillCastInfo: false,
          blackboardAssignments: {
            dmg_up: [0.04, 0.06],
            stack: { kind: 'constant', value: 4 },
            duration: { kind: 'constant', value: 10 },
          },
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
          value: [1, 1],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_1_stack',
          operation: 'assign',
          value: [1, 2],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_1_duration',
          operation: 'assign',
          value: [20, 20],
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_1_cd_reduce',
          operation: 'assign',
          value: [0.4, 0.4],
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
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_1_dmg_up',
          operation: 'assign',
          value: 0.3,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'potential_1_duration',
          operation: 'assign',
          value: 15,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_1_stack',
          operation: 'add',
          value: 1,
        },
        {
          kind: 'patchSkillBlackboard',
          skillGroupKey: 'ultimate',
          blackboardKey: 'talent_1_duration',
          operation: 'add',
          value: 10,
        },
      ],
    },
    {
      levels: 1,
      modifiers: [
        { kind: 'addBuildAttribute', attributes: ['strength'], value: 15 },
        { kind: 'addStaticDamageIncrease', target: 'physical', value: 0.08 },
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
          blackboardKey: 'potential_5_interval',
          operation: 'assign',
          value: 45,
        },
      ],
    },
  ],
  buffDefinitions: {
    buff_chr_0018_dapan_talent_0: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 1,
      applyTags: [],
      extendTags: [],
      blackboard: { consumedLayer: 0, dmg_up: 0, duration: 0, stack: 0 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'buffConsumed',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventBuffIdMatch', buffIds: ['buff_physical_no_guard'] },
              sequence(
                branch(
                  {
                    kind: 'eventConsumedBuffLayerCompare',
                    operator: 'greaterOrEqual',
                    value: { kind: 'constant', value: 1 },
                    outputKey: 'consumedLayer',
                  },
                  sequence(
                    step('applyBuff', {
                      buffId: 'buff_chr_0018_dapan_talent_0_dmg_up',
                      target: 'buffSource',
                      source: 'buffSource',
                      count: { kind: 'blackboard', key: 'consumedLayer' },
                      inheritSourceSkillCastInfo: true,
                      copiedBlackboardAssignments: {
                        dmg_up: 'dmg_up',
                        duration: 'duration',
                        stack: 'stack',
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
    buff_chr_0018_dapan_talent_0_dmg_up: {
      stackingType: 'enhanceAndRefresh',
      priority: 0,
      maxStackCount: { blackboardKey: 'stack' },
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_physical_dmg_up',
        iconPath: '/icons/icon_battle_physical_dmg_up.webp',
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
      blackboard: { consumedLayer: 0, dmg_up: 0, duration: 0, stack: 0 },
      attributeModifiers: [
        {
          attribute: 'physicalDamageIncrease',
          slot: 'baseAddition',
          value: { blackboardKey: 'dmg_up' },
        },
      ],
    },
    buff_chr_0018_dapan_talent_1_cd_reduce: {
      stackingType: 'unique',
      priority: 0,
      maxStackCount: 2,
      applyTags: [],
      extendTags: [],
      blackboard: { cd_reduce: 0.5, duration: 15 },
      attributeModifiers: [],
      lifecycleSequences: { enable: sequence(step('skillAffix', {})) },
      abilityEventResponses: [
        {
          event: 'outputDamage',
          priority: 0,
          sequence: sequence(
            step('adjustSkillCooldown', {
              target: 'caster',
              skill: { kind: 'type', skillType: 'comboSkill' },
              operation: 'reduce',
              basis: 'baseDurationRatio',
              value: { kind: 'blackboard', key: 'cd_reduce' },
            }),
            step('finishBuffsById', {
              target: 'caster',
              buffIds: ['buff_chr_0018_dapan_talent_1_preparation'],
              reason: 'other',
              count: { kind: 'constant', value: 1 },
            }),
            step('finishBuffsById', {
              target: 'caster',
              buffIds: ['buff_chr_0018_dapan_talent_1_cd_reduce'],
              reason: 'other',
            }),
          ),
        },
      ],
    },
    buff_chr_0018_dapan_talent_1_preparation: {
      stackingType: 'enhanceAndRefresh',
      priority: 0,
      maxStackCount: { blackboardKey: 'max_stack' },
      durationSeconds: { blackboardKey: 'duration' },
      presentation: {
        visible: true,
        iconId: 'icon_battle_dapan_buff',
        iconPath: '/icons/icon_battle_dapan_buff.webp',
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
      blackboard: { duration: 15, max_stack: 2, talent_1_cd_reduce: 0 },
      attributeModifiers: [],
      abilityEventResponses: [
        {
          event: 'beforeCastSkill',
          priority: 0,
          sequence: sequence(
            branch(
              { kind: 'eventSkillTypeIn', skillTypes: ['comboSkill'] },
              sequence(
                step('applyBuff', {
                  buffId: 'buff_chr_0018_dapan_talent_1_cd_reduce',
                  target: 'buffOwner',
                  source: 'buffSource',
                  inheritSourceSkillCastInfo: true,
                  copiedBlackboardAssignments: { cd_reduce: 'talent_1_cd_reduce' },
                }),
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

export default daPan;
