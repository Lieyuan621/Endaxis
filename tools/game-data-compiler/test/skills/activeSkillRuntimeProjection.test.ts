import { fixtureGameplayTagRegistry } from '../gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';
import { compileActiveSkillRuntimeProjectionSource } from '../../src/compiler/skills/activeSkillRuntimeProjection.ts';
import { compileCombatActionSequenceSource } from '../../src/compiler/buffs/buffRuntimeProjection.ts';
import { collectCombatInvisiblePresentationAssignmentKeys } from '../../src/compiler/buffs/buffRuntimeProjection.ts';
import { parseKnownNativeActionSequenceSource } from '../../src/source/actionLeaf.ts';
import {
  abilityEntityFixture,
  activeSkillFixture,
  scalarFixture,
  targetFixture,
} from '../sourceFixtures.ts';
import { compileAbilityEntityTemplateCatalogSource } from '../../src/compiler/abilities/abilityEntityCatalog.ts';
import { gameplayTagIdFromPath } from '../../src/source/nativeGameplayTags.ts';

const ACTIVE_CONTEXT = {
  gameplayTagRegistry: fixtureGameplayTagRegistry,
  actionOwnerTarget: 'caster',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'enemy',
  fixedHittableTargetCount: 0,
} as const;

describe('HideUI active source projection', () => {
  it('保留原生 offsetRecordFrame 作为普攻连段身份提交点', () => {
    const value = activeWithActions([]);
    value.offsetRecordFrame = 17;
    const result = compileActiveSkillRuntimeProjectionSource({
      value,
      sourcePath: 'active.offset-record',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.offsetRecordFrame).toBe(17);
  });

  it.each([false, true])('保留独立动作区间与分支 %s，不作为纯表现过滤', onlyBlockInput => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([meta('HideUIAction', { onlyBlockInput })]),
      sourcePath: 'active.hide-ui',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences).toHaveLength(1);
    expect(result.scheduledSequences[0]).toMatchObject({
      startFrame: 5,
      endFrame: 8,
      sequence: { steps: [{ kind: 'hideUi', parameters: { onlyBlockInput } }] },
    });
  });

  it('把原生 MarkCanDash 投影成当前施放的可闪避状态步骤', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([meta('MarkCanDash', {})]),
      sourcePath: 'active.mark-can-dash',
      patch: null,
      context: ACTIVE_CONTEXT,
    });

    expect(result.scheduledSequences).toMatchObject([
      {
        startFrame: 5,
        endFrame: 8,
        sequence: { steps: [{ kind: 'markCurrentSkillCanDash', parameters: {} }] },
      },
    ]);
  });
});

function activeWithActions(actions: unknown[]) {
  const skill = activeSkillFixture('active_runtime');
  skill.actionGroupData = {
    timelineActions: [
      {
        _startFrame: 5,
        _endFrame: 8,
        _sequenceActionData: {
          actionData: actions,
          onlyExecuteWhenSourceIsMainChar: false,
          onlyExecuteWhenSourceIsGuard: false,
        },
        forceSyncAnimData: {
          forceSync: false,
          montageName: '',
          targetFrame: 0,
          playbackSpeed: 1,
        },
      },
    ],
    passiveEventActions: [],
  };
  return skill;
}

function activeWithFilteredActions(
  actions: unknown[],
  filters: { readonly main?: boolean; readonly guard?: boolean },
) {
  const skill = activeWithActions(actions);
  const sequence = (skill.actionGroupData as { timelineActions: any[] }).timelineActions[0]
    ._sequenceActionData;
  sequence.onlyExecuteWhenSourceIsMainChar = filters.main ?? false;
  sequence.onlyExecuteWhenSourceIsGuard = filters.guard ?? false;
  return skill;
}

const meta = (type: string, rest: Record<string, unknown>): Record<string, unknown> => ({
  $type: `Beyond.Gameplay.Core.${type}+Data, Gameplay.Beyond`,
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 1,
  ...rest,
});

const invalidMainCharacterRay = () =>
  meta('RayCastEffectAction', {
    targetGroupKey: 'ray_targets',
    saveAllHitTargets: true,
    hitPosGroupKey: 'ray_positions',
    moveType: 'PointToPoint',
    targetSettings: targetFixture('Owner', {
      finderData: {
        $type: 'Beyond.Gameplay.Core.Selector+FixedPointFinder+Data, Gameplay.Beyond',
        positionOffset: { x: 0, y: 0, z: 6 },
        rotationOffset: { x: 0, y: 0, z: 0, w: 1 },
        snapToNavmesh: false,
        sampleRadius: scalarFixture(0),
      },
      validatorData: [],
      postProcessorData: [],
    }),
    sourceSettings: targetFixture('Owner'),
    rayEffect: {},
    rayHitEffect: {},
    hitEffectDirectionType: 'LookAtNextEndPos',
    hitEffectLayers: {},
    hitLoopSoundEvent: { _id: 0 },
    hitEndSoundEvent: { _id: 0 },
    sourcePosType: 'Follow',
    startPosMountPoint: 'None',
    startPosOffset: { x: 0, y: 0, z: 0 },
    raycastDataList: [],
    mountPointRayData: {},
    curveRayData: {},
    pointToPointRayData: {},
    // Deliberately unsupported: proves main-char filters execute while guard filters do not.
    useFaction: true,
    autoSetTargetFaction: false,
    containsUnMarkable: false,
    factionTarget: 'Anti',
    targetFactionType: 0,
    touchingLayers: {},
    rayMaxLength: 16,
    rayRadius: 2,
    useRealHitLength: false,
    useLastHitForEffect: false,
  });

describe('player input windows', () => {
  it('retains direct command mapping and allowed-next lifetimes outside combat steps', () => {
    const comboCache = meta('ComboCacheAction', {
      mappingDataList: [
        {
          cmdType: 'Attack',
          skillId: 'native.attack2',
          cacheEndByAction: true,
          clearOffsetTargetSkillIdOnEnd: false,
          overrideCacheTime: true,
          cacheTime: scalarFixture(0.2),
        },
        {
          cmdType: 'NormalSkill',
          skillId: 'native.normal2',
          cacheEndByAction: true,
          clearOffsetTargetSkillIdOnEnd: false,
          overrideCacheTime: true,
          cacheTime: scalarFixture(0.2),
        },
      ],
    });
    const allowNext = meta('AllowNextSkillAction', {
      allowedSkillIdList: ['native.attack2'],
    });
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([comboCache, allowNext]),
      sourcePath: 'active.input-windows',
      patch: null,
      context: ACTIVE_CONTEXT,
    });

    expect(result.inputWindows).toEqual({
      commandMappings: [
        {
          startFrame: 5,
          endFrame: 8,
          input: 'basicAttack',
          targetSkillId: 'native.attack2',
        },
      ],
      allowedNextSkills: [{ startFrame: 5, endFrame: 8, skillIds: ['native.attack2'] }],
    });
    expect(result.timelineBlockFrames).toBe(31);
    expect(result.scheduledSequences).toEqual([]);
  });
});

function tangtangTargetPostProcessor(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return meta('TargetPostProcessorAction', {
    target: targetFixture('Context', undefined, 'tar'),
    centerPos: targetFixture('Context', undefined, 'tar'),
    source: targetFixture('Source'),
    direction: {
      directionType: 'SourceForward',
      source: targetFixture('Target'),
      target: targetFixture('Target'),
      sourceMountPoint: 'None',
      targetMountPoint: 'None',
      customSourceAndTarget: false,
      clampToXZ: true,
      invertDirection: false,
    },
    validatorData: [],
    postProcessorData: [
      {
        $type: 'Beyond.Gameplay.Core.Selector+PriorityFilter+Data, Gameplay.Beyond',
        filterType: 'DistanceFromMainCharAsc',
        onlyReserveMaxPriorityTargets: false,
        limitMaxNum: true,
        maxNum: 1,
        buffFilterSettings: {
          buffSettings: {
            checkType: 'Id',
            buffIdList: [],
            tagQuery: { queryType: 'HasAny', tags: [] },
          },
          buffStackNumType: 'BuffCount',
        },
      },
    ],
    targetGroupKey: 'tar01',
    ...overrides,
  });
}

describe('主动技能正式时间轴投影', () => {
  it.each(['Target', 'Owner'])('后处理覆盖前序动作的目标证明（排除%s）', excluded => {
    const source = activeWithActions([
      meta('MergeTargetAction', { targets: [targetFixture('Target')], targetGroupKey: 'tar' }),
      tangtangTargetPostProcessor({
        targetGroupKey: 'tar',
        centerPos: targetFixture('Target'),
        postProcessorData: [
          {
            $type: 'Beyond.Gameplay.Core.Selector+ExcludeTarget+Data, Gameplay.Beyond',
            excludedTargetSettings: targetFixture(excluded),
            processTargetType: 'Targets',
          },
        ],
      }),
      {
        $type: 'Beyond.Gameplay.Core.Conditions.CheckEntityNum+Data, Gameplay.Beyond',
        isEnable: true,
        priorityLevel: 'Default',
        priorityOffset: 0,
        serverActionIndex: 2,
        checkTarget: targetFixture('Context', undefined, 'tar'),
        minNum: 1,
        containsHittableTarget: false,
        compareType: 'GE',
        excludeDeadEntity: false,
        storeKey: '',
      },
      meta('GainBreakingAttackAtb', {
        source: targetFixture('Source'),
        target: targetFixture('Target'),
        factor: scalarFixture(1),
      }),
    ]);
    const project = () =>
      compileActiveSkillRuntimeProjectionSource({
        value: source,
        sourcePath: 'fixture.overwritten-target',
        patch: null,
        context: ACTIVE_CONTEXT,
      });
    if (excluded === 'Owner') {
      expect(project).toThrow('unsupported target postprocessor exclusion');
      return;
    }
    expect(project().scheduledSequences.at(-1)!.sequence.steps).toMatchObject([
      {
        kind: 'mergeContextTargets',
        parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
      },
      { kind: 'mergeContextTargets', parameters: { saveToContextKey: 'tar', sources: [] } },
      { kind: 'conditional', parameters: { condition: { left: { kind: 'constant', value: 0 } } } },
    ]);
  });

  it('用户放置主动技能只执行 main-character 序列并跳过 guard 序列', () => {
    expect(() =>
      compileActiveSkillRuntimeProjectionSource({
        value: activeWithFilteredActions([invalidMainCharacterRay()], { main: true }),
        sourcePath: 'fixture.main-filter',
        patch: null,
        context: ACTIVE_CONTEXT,
      }),
    ).toThrow('unsupported RayCastEffectAction stump projection');

    expect(
      compileActiveSkillRuntimeProjectionSource({
        value: activeWithFilteredActions([invalidMainCharacterRay()], { guard: true }),
        sourcePath: 'fixture.guard-filter',
        patch: null,
        context: ACTIVE_CONTEXT,
      }).scheduledSequences,
    ).toEqual([]);
  });

  it('把汤汤的距离排序 TargetPostProcessor 严格归约为唯一敌人组复制', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('MergeTargetAction', {
          targets: [targetFixture('Target')],
          targetGroupKey: 'tar',
        }),
        tangtangTargetPostProcessor(),
        {
          $type: 'Beyond.Gameplay.Core.Conditions.CheckEntityNum+Data, Gameplay.Beyond',
          isEnable: true,
          priorityLevel: 'Default',
          priorityOffset: 0,
          serverActionIndex: 2,
          checkTarget: targetFixture('Context', undefined, 'tar01'),
          minNum: 1,
          containsHittableTarget: false,
          compareType: 'GE',
          excludeDeadEntity: false,
          storeKey: '',
        },
        meta('GainBreakingAttackAtb', {
          source: targetFixture('Source'),
          target: targetFixture('Target'),
          factor: scalarFixture(1),
        }),
      ]),
      sourcePath: 'active.tangtang.combo',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences[0]!.sequence.steps).toMatchObject([
      {
        kind: 'conditional',
        parameters: { condition: { left: { kind: 'constant', value: 1 } } },
        whenTrue: {
          steps: [{ kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } }],
        },
      },
    ]);
  });

  it('破防回能可读取已证明为唯一木桩的命名 Context', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('MergeTargetAction', {
          targets: [targetFixture('Target')],
          targetGroupKey: 'mainTar',
        }),
        meta('GainBreakingAttackAtb', {
          source: targetFixture('Source'),
          target: targetFixture('Context', undefined, 'mainTar'),
          factor: scalarFixture(1),
        }),
      ]),
      sourcePath: 'active.named-finisher-target',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences[0]!.sequence.steps.at(-1)).toEqual({
      kind: 'gainFinisherSp',
      parameters: { factor: 1, recipient: 'team' },
    });
  });

  it.each([
    ['a non-proven source group', { target: targetFixture('Context', undefined, 'unknown') }],
    [
      'a different sorting rule',
      {
        postProcessorData: [
          {
            $type: 'Beyond.Gameplay.Core.Selector+PriorityFilter+Data, Gameplay.Beyond',
            filterType: 'DistanceFromMainCharDesc',
            onlyReserveMaxPriorityTargets: false,
            limitMaxNum: true,
            maxNum: 1,
            buffFilterSettings: {
              buffSettings: {
                checkType: 'Id',
                buffIdList: [],
                tagQuery: { queryType: 'HasAny', tags: [] },
              },
              buffStackNumType: 'BuffCount',
            },
          },
        ],
      },
    ],
  ])('TargetPostProcessor 对 %s 保持失败关闭', (_label, overrides) => {
    expect(() =>
      compileActiveSkillRuntimeProjectionSource({
        value: activeWithActions([
          meta('MergeTargetAction', {
            targets: [targetFixture('Target')],
            targetGroupKey: 'tar',
          }),
          tangtangTargetPostProcessor(overrides),
          {
            $type: 'Beyond.Gameplay.Core.Conditions.CheckEntityNum+Data, Gameplay.Beyond',
            isEnable: true,
            priorityLevel: 'Default',
            priorityOffset: 0,
            serverActionIndex: 2,
            checkTarget: targetFixture('Context', undefined, 'tar01'),
            minNum: 1,
            containsHittableTarget: false,
            compareType: 'GE',
            excludeDeadEntity: false,
            storeKey: '',
          },
          meta('GainBreakingAttackAtb', {
            source: targetFixture('Source'),
            target: targetFixture('Target'),
            factor: scalarFixture(1),
          }),
        ]),
        sourcePath: 'active.tangtang.combo',
        patch: null,
        context: ACTIVE_CONTEXT,
      }),
    ).toThrow('unaudited single-enemy action target group');
  });

  it('把只供表现叶子读取的直接赋值键识别为战斗不可见数据流', () => {
    const sequence = {
      actions: [
        {
          metadata: { enabled: true },
          body: {
            kind: 'leaf',
            value: {
              family: 'blackboardMutation',
              action: {
                key: 'camera_side',
                directValue: true,
                operation: 'Assign',
                value: { blackboardKey: null },
              },
            },
          },
        },
        {
          metadata: { enabled: true },
          body: {
            kind: 'leaf',
            value: {
              family: 'presentation',
              action: { kind: 'cameraFollow', targetAlpha: { blackboardKey: 'camera_side' } },
            },
          },
        },
      ],
    } as never;
    expect(collectCombatInvisiblePresentationAssignmentKeys([sequence])).toEqual(
      new Set(['camera_side']),
    );
  });

  it('识别只控制嵌套相机分支的直接赋值键', () => {
    const leaf = (family: string, action: unknown) => ({
      metadata: { enabled: true },
      body: { kind: 'leaf', value: { family, action } },
    });
    const emptySequence = { actions: [] };
    const sequence = {
      actions: [
        leaf('blackboardMutation', {
          key: 'is_cam',
          directValue: true,
          operation: 'Assign',
          value: { blackboardKey: null },
        }),
        {
          metadata: { enabled: true },
          body: {
            kind: 'ifElse',
            alwaysNext: true,
            condition: {
              actions: [leaf('condition', { kind: 'floatCompare', key: 'is_cam' })],
            },
            whenTrue: {
              actions: [
                leaf('presentation', { kind: 'cameraControl' }),
                {
                  metadata: { enabled: true },
                  body: {
                    kind: 'ifElse',
                    alwaysNext: true,
                    condition: {
                      actions: [leaf('condition', { kind: 'twoDirectionAngle' })],
                    },
                    whenTrue: {
                      actions: [leaf('presentation', { kind: 'cameraAimLeft' })],
                    },
                    whenFalse: {
                      actions: [leaf('presentation', { kind: 'cameraAimRight' })],
                    },
                  },
                },
              ],
            },
            whenFalse: emptySequence,
          },
        },
      ],
    } as never;

    expect(collectCombatInvisiblePresentationAssignmentKeys([sequence])).toEqual(
      new Set(['is_cam']),
    );
  });

  it('不会把控制战斗动作分支的直接赋值键误判为表现键', () => {
    const leaf = (family: string, action: unknown) => ({
      metadata: { enabled: true },
      body: { kind: 'leaf', value: { family, action } },
    });
    const sequence = {
      actions: [
        leaf('blackboardMutation', {
          key: 'route',
          directValue: true,
          operation: 'Assign',
          value: { blackboardKey: null },
        }),
        {
          metadata: { enabled: true },
          body: {
            kind: 'ifElse',
            alwaysNext: true,
            condition: { actions: [leaf('condition', { kind: 'floatCompare', key: 'route' })] },
            whenTrue: { actions: [leaf('damage', { kind: 'playerDamage' })] },
            whenFalse: { actions: [] },
          },
        },
      ],
    } as never;

    expect(collectCombatInvisiblePresentationAssignmentKeys([sequence])).toEqual(new Set());
  });

  it('沿只服务表现的黑板计算链反向识别条件输入键', () => {
    const leaf = (family: string, action: unknown) => ({
      metadata: { enabled: true },
      body: { kind: 'leaf', value: { family, action } },
    });
    const sequence = {
      actions: [
        leaf('blackboardMutation', {
          key: 'camera_angle',
          directValue: true,
          operation: 'Assign',
          value: { blackboardKey: null },
        }),
        leaf('blackboardMutation', {
          key: 'camera_side',
          directValue: true,
          operation: 'Assign',
          value: { blackboardKey: null },
        }),
        leaf('blackboardMutation', {
          key: 'camera_angle',
          directValue: true,
          operation: 'Multiply',
          value: { blackboardKey: 'camera_side' },
        }),
        leaf('presentation', {
          kind: 'cameraFollow',
          targetAlpha: { blackboardKey: 'camera_angle' },
        }),
      ],
    } as never;

    expect(collectCombatInvisiblePresentationAssignmentKeys([sequence])).toEqual(
      new Set(['camera_angle', 'camera_side']),
    );
  });

  it('保留送入角色被动 HUD 的黑板累计值', () => {
    const sequence = {
      actions: [
        {
          metadata: { enabled: true },
          body: {
            kind: 'leaf',
            value: {
              family: 'blackboardMutation',
              action: {
                key: 'water_num',
                directValue: true,
                operation: 'Add',
                value: { blackboardKey: null },
              },
            },
          },
        },
        {
          metadata: { enabled: true },
          body: {
            kind: 'leaf',
            value: {
              family: 'presentation',
              action: { kind: 'passiveUiValue', value: { blackboardKey: 'water_num' } },
            },
          },
        },
      ],
    } as never;
    expect(collectCombatInvisiblePresentationAssignmentKeys([sequence])).toEqual(new Set());
  });

  const interruptCurrentSkill = () =>
    meta('AbilityActions.InterruptCurSkillAction', {
      skillOwner: targetFixture('Owner'),
    });

  it('把零费用 Owner 路由编译为施放前 Buff 旁路而不是第零帧时间轴', () => {
    const source = activeWithActions([]);
    source.switchToBuffConfig = {
      condition: {
        actionData: [
          meta('Conditions.CheckSkillType', {
            checkTargetCurSkill: true,
            skillOwner: targetFixture('Owner'),
            mustBeforeExclusiveTime: false,
            skillTypeList: ['NormalSkill', 'UltimateSkill', 'ExtraActiveSkill'],
            attackTypeMask: 'All',
          }),
        ],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      buffs: [
        {
          buffId: 'buff_chr_fixture_end',
          assignBlackboard: false,
          assignItems: [],
        },
      ],
      buffSource: targetFixture('Owner'),
      targets: targetFixture('Owner'),
      asSkillCast: false,
    };

    const result = compileActiveSkillRuntimeProjectionSource({
      value: source,
      sourcePath: 'fixture',
      patch: null,
      context: ACTIVE_CONTEXT,
    });

    expect(result.scheduledSequences).toEqual([]);
    expect(result.switchToBuffCast).toEqual({
      currentSkillTypes: ['battleSkill', 'ultimate'],
      asSkillCast: false,
      sequence: {
        steps: [
          {
            kind: 'applyBuff',
            parameters: {
              buffId: 'buff_chr_fixture_end',
              target: 'caster',
              inheritSourceSkillCastInfo: true,
            },
          },
        ],
      },
    });
  });

  it('把普通攻击独占期与主控条件合取为同一 SwitchToAddBuff 路由', () => {
    const source = activeWithActions([]);
    source.switchToBuffConfig = {
      condition: {
        actionData: [
          meta('Conditions.CheckSkillType', {
            checkTargetCurSkill: true,
            skillOwner: targetFixture('Owner'),
            mustBeforeExclusiveTime: true,
            skillTypeList: ['Attack'],
            attackTypeMask: -7,
          }),
          meta('Conditions.CheckMainCharacterCondition', {
            checkTarget: targetFixture('Owner'),
          }),
        ],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      buffs: [{ buffId: 'buff_lastrite_inattack', assignBlackboard: false, assignItems: [] }],
      buffSource: targetFixture('Owner'),
      targets: targetFixture('Owner'),
      asSkillCast: false,
    };

    const result = compileActiveSkillRuntimeProjectionSource({
      value: source,
      sourcePath: 'fixture',
      patch: null,
      context: ACTIVE_CONTEXT,
    });

    expect(result.switchToBuffCast).toMatchObject({
      currentSkillTypes: ['basicAttack'],
      requiresCurrentSkillNotInterruptible: true,
      condition: { kind: 'casterControlled' },
    });
  });

  it('保留 JumpTo 条件序列中只反转下一项的 NotNextCheckAction', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('JumpToAction', {
          conditionAction: {
            actionData: [
              meta('NotNextCheckAction', {}),
              meta('Conditions.CheckMainCharacterCondition', {
                checkTarget: targetFixture('Source'),
              }),
            ],
            onlyExecuteWhenSourceIsMainChar: false,
            onlyExecuteWhenSourceIsGuard: false,
          },
          destFrame: 300,
        }),
      ]),
      sourcePath: 'fixture',
      patch: null,
      context: ACTIVE_CONTEXT,
    });

    expect(result.scheduledSequences[0]?.sequence.steps).toContainEqual({
      kind: 'jumpTimeline',
      parameters: {
        destinationFrame: 300,
        condition: { kind: 'not', condition: { kind: 'casterControlled' } },
      },
    });
  });

  it('把既有 Buff 的原生技能转场白名单投影为同实例继承步骤', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('InheritBuffAction', {
          buffOwner: targetFixture('Owner'),
          targetBuffId: 'buff_chr_fixture_ui',
          inheritSkillIdList: ['chr_fixture_followup'],
          finishByAction: true,
          finishWithNextSkillIfNotInherited: true,
        }),
      ]),
      sourcePath: 'fixture',
      patch: null,
      context: ACTIVE_CONTEXT,
    });

    expect(result.scheduledSequences[0]?.sequence.steps).toEqual([
      {
        kind: 'inheritBuffById',
        parameters: {
          target: 'caster',
          buffId: 'buff_chr_fixture_ui',
          inheritToNextSkillIds: ['chr_fixture_followup'],
          finishByAction: true,
          finishWithNextSkillIfNotInherited: true,
        },
      },
    ]);
  });

  it('等价移植 Python 的唯一根 plain Owner 技能结束动作', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([interruptCurrentSkill()]),
      sourcePath: 'fixture',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences).toMatchObject([
      {
        startFrame: 5,
        endFrame: 8,
        sequence: { steps: [{ kind: 'finishTimeline', parameters: {} }] },
      },
    ]);
  });

  it('拒绝把 InterruptCurSkillAction 从混合根序列或普通公共序列放宽出来', () => {
    expect(() =>
      compileActiveSkillRuntimeProjectionSource({
        value: activeWithActions([interruptCurrentSkill(), assign('after_finish')]),
        sourcePath: 'fixture',
        patch: null,
        context: ACTIVE_CONTEXT,
      }),
    ).toThrow('must be the only enabled root action');
    expect(() =>
      compileCombatActionSequenceSource(
        parseKnownNativeActionSequenceSource(
          seq([interruptCurrentSkill()]),
          'fixture.sequence',
          {},
        ),
        ACTIVE_CONTEXT,
      ),
    ).toThrow('requires a root skill timeline');
  });

  const angle = () =>
    meta('SaveTwoDirectionAngle', {
      dir1Source: targetFixture('Owner'),
      dir1Target: targetFixture('Target'),
      dir2Source: targetFixture('Owner'),
      dir2Target: targetFixture('Target'),
      dir1DirectionType: 'CameraForward',
      dir2DirectionType: 'SourceForward',
      key: 'input_angle',
    });
  const assign = (key: string, value = scalarFixture(100)) =>
    meta('ModifyDynamicBlackboard', {
      key,
      operation: 'Assign',
      directValue: true,
      value,
      calculationTarget: targetFixture('Owner'),
      calculateType: 'HpRatio',
    });
  const seq = (actionData: unknown[]) => ({
    actionData,
    onlyExecuteWhenSourceIsMainChar: false,
    onlyExecuteWhenSourceIsGuard: false,
  });
  const entityCount = (targetGroupKey: string, excludeDeadEntity = false) => ({
    $type: 'Beyond.Gameplay.Core.Conditions.CheckEntityNum+Data, Gameplay.Beyond',
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 20,
    checkTarget: targetFixture('Context', undefined, targetGroupKey),
    minNum: 1,
    containsHittableTarget: false,
    compareType: 'GE',
    excludeDeadEntity,
    storeKey: '',
  });
  const mergeContext = (sourceKey: string, outputKey: string) =>
    meta('MergeTargetAction', {
      targets: [targetFixture('Context', undefined, sourceKey)],
      targetGroupKey: outputKey,
    });
  const fixedPoint = (outputKey: string) =>
    meta('FindTargetAction', {
      targetGroupKey: outputKey,
      center: 'ActionSource',
      centerContextKey: '',
      useCenterEntityMountPoint: false,
      centerMountPoint: 'None',
      centerToGround: false,
      selectorOwner: 'ActionOwner',
      selectorOwnerContextKey: '',
      selectorData: {
        finderData: {
          $type: 'Beyond.Gameplay.Core.Selector+FixedPointFinder+Data, Gameplay.Beyond',
          positionOffset: { x: 0, y: 0, z: 6 },
          rotationOffset: { x: 0, y: 0, z: 0, w: 1 },
          snapToNavmesh: false,
          sampleRadius: scalarFixture(0),
        },
        validatorData: [],
        postProcessorData: [],
      },
      selectorDirection: 'CameraForward',
      target: 'ActionOwner',
      contextKey: '',
      useAdvancedDirectionSetting: false,
      advancedSelectorDirection: {
        directionType: 'SourceForward',
        sourceMountPoint: 'None',
        targetMountPoint: 'None',
        customSourceAndTarget: false,
        clampToXZ: true,
        invertDirection: false,
      },
    });
  const spawnAbilityEntity = (contextKey: string) =>
    meta('SpawnAbilityEntity', {
      abilityEntityId: 'abilityentity_fixture',
      setAbilityEntitySource: true,
      abilityEntitySource: 'ActionOwner',
      abilityEntitySourceContextKey: '',
      setAbilityEntityTarget: false,
      abilityEntityTarget: targetFixture('Target'),
      bornAt: targetFixture('Source'),
      bornMountPoint: 'None',
      bornPosOffset: { x: 0, y: 0, z: 0 },
      checkNavmeshAreaName: false,
      forbiddenAreaNames: [],
      attachToClosestMeshPoint: false,
      yRotateFromBoneToCurPos: false,
      bornRotation: 'SourceForward',
      bornRotationContextTarget: '',
      useAdvancedDirectionSetting: false,
      advancedDirectionSetting: {
        directionType: 'SourceForward',
        sourceMountPoint: 'None',
        targetMountPoint: 'None',
        customSourceAndTarget: false,
        clampToXZ: true,
        invertDirection: false,
      },
      clampToXZPlane: false,
      applyBornRotationOffset: false,
      bornRotationOffset: { x: 0, y: 0, z: 0, w: 1 },
      assignEntityBlackboard: false,
      assignPairs: [],
      assignBlackboard: true,
      abilityEntitySkillId: '',
      overrideDuration: false,
      duration: scalarFixture(0),
      saveToContext: true,
      contextKey,
      pauseEffectOnEnd: false,
      inheritSourceSkillCastId: true,
      dieWhenSourceDie: false,
      forceSyncInit: true,
      dieOnEnd: false,
    });
  const emptyAngleBranch = () =>
    meta('IfElseAction', {
      conditionAction: seq([
        meta('CompareFloat', {
          valueA: scalarFixture(0, 'input_angle'),
          compare: 'GT',
          valueB: scalarFixture(0),
        }),
      ]),
      succeedActions: seq([]),
      failActions: seq([]),
      alwaysNext: true,
    });
  const comboQtePrototypeGuard = () => [
    meta('CompareFloat', {
      valueA: scalarFixture(0, 'EntityBB_Combo_qte_proto_use'),
      compare: 'EQ',
      valueB: scalarFixture(1),
    }),
    meta('IfElseAction', {
      conditionAction: seq([
        meta('CompareFloat', {
          valueA: scalarFixture(0, 'EntityBB_Combo_QTE_Trigger'),
          compare: 'GT',
          valueB: scalarFixture(0.5),
        }),
      ]),
      succeedActions: seq([
        meta('GainBreakingAttackAtb', {
          source: targetFixture('Source'),
          target: targetFixture('Target'),
          factor: scalarFixture(1),
        }),
      ]),
      failActions: seq([
        meta('GainBreakingAttackAtb', {
          source: targetFixture('Source'),
          target: targetFixture('Target'),
          factor: scalarFixture(0),
        }),
      ]),
      alwaysNext: true,
    }),
  ];
  it('仅在 Buff 闭包证明旧版 ComboQte 触发键后解包新原型选择守卫', () => {
    const skill = activeWithActions(comboQtePrototypeGuard());
    const withoutEvidence = compileActiveSkillRuntimeProjectionSource({
      value: skill,
      sourcePath: 'fixture.qte-without-evidence',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    const withEvidence = compileActiveSkillRuntimeProjectionSource({
      value: skill,
      sourcePath: 'fixture.qte-with-evidence',
      patch: null,
      context: {
        ...ACTIVE_CONTEXT,
        comboQteTriggerBlackboardKeys: new Set(['EntityBB_Combo_QTE_Trigger']),
      },
    });

    expect(withoutEvidence.scheduledSequences[0]?.sequence.steps[0]).toMatchObject({
      kind: 'conditional',
      parameters: {
        condition: {
          left: { kind: 'blackboard', key: 'EntityBB_Combo_qte_proto_use' },
        },
      },
    });
    expect(withEvidence.scheduledSequences[0]?.sequence.steps[0]).toMatchObject({
      kind: 'conditional',
      parameters: {
        condition: {
          left: { kind: 'blackboard', key: 'EntityBB_Combo_QTE_Trigger' },
        },
      },
    });
  });
  it('末端为空的角度分支从产物彻底删除，不删除其他黑板写入', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([angle(), emptyAngleBranch(), assign('input_angle')]),
      sourcePath: 'fixture',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences[0]?.sequence.steps).toEqual([
      {
        kind: 'modifyActionValue',
        parameters: {
          key: 'input_angle',
          operation: 'assign',
          value: { kind: 'constant', value: 100 },
        },
      },
    ]);
  });
  it('角度仍流向有效数值时拒绝，跨调度读取也不能绕过', () => {
    const value = activeWithActions([angle()]);
    const group = value.actionGroupData as { timelineActions: Record<string, unknown>[] };
    group.timelineActions.push({
      ...group.timelineActions[0],
      _startFrame: 8,
      _sequenceActionData: seq([assign('attack_scale', scalarFixture(0, 'input_angle'))]),
    });
    expect(() =>
      compileActiveSkillRuntimeProjectionSource({
        value,
        sourcePath: 'fixture',
        patch: null,
        context: ACTIVE_CONTEXT,
      }),
    ).toThrow('presentation output input_angle reaches retained combat program');
  });
  it('把干员受伤前监听接到显式受击标记，不吞掉干员输出伤害监听', () => {
    const listener = (abilityEvent: string) =>
      meta('EventListenerAction', {
        abilityActionMap: [{ abilityEvent, actions: [seq([])] }],
      });
    const compile = (event: string) =>
      compileActiveSkillRuntimeProjectionSource({
        value: activeWithActions([listener(event)]),
        sourcePath: 'fixture',
        patch: null,
        context: ACTIVE_CONTEXT,
      });
    expect(compile('OnBeforeTakeDamage').scheduledSequences[0]?.sequence.steps).toEqual([
      {
        kind: 'listenForCombatEvents',
        parameters: {
          responses: [
            {
              key: 'fixture.actionGroupData.timelineActions[0]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
              event: { kind: 'operatorHit' },
              phase: 'dataAction',
              priority: 0,
              sequence: { steps: [] },
            },
          ],
        },
      },
    ]);
    expect(compile('OnBeforeOutputAirborne').scheduledSequences).toEqual([]);
    expect(compile('OnSkillEnd').scheduledSequences).toEqual([]);
    expect(() => compile('OnBeforeOutputDamage')).toThrow('combat-visible EventListenerAction');
  });
  it('临时监听共用程序遍历，省略空结束回调但保留后续来源下标和独立序列', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('EventListenerAction', {
          abilityActionMap: [
            { abilityEvent: 'OnSkillEnd', actions: [seq([])] },
            { abilityEvent: 'OnBeforeTakeDamage', actions: [seq([]), seq([])] },
          ],
        }),
      ]),
      sourcePath: 'fixture',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    const step = result.scheduledSequences[0]?.sequence.steps[0];
    expect(step?.kind).toBe('listenForCombatEvents');
    if (step?.kind !== 'listenForCombatEvents') throw new Error('missing listener');
    expect(step.parameters.responses.map(response => response.key)).toEqual([
      'fixture.actionGroupData.timelineActions[0]._sequenceActionData.actionData[0].abilityActionMap[1].actions[0]',
      'fixture.actionGroupData.timelineActions[0]._sequenceActionData.actionData[0].abilityActionMap[1].actions[1]',
    ]);
  });

  it.each([
    ['High', 0],
    ['Default', 1],
  ] as const)(
    '临时监听复用公共优先级边界：%s + %s 不静默降为零',
    (priorityLevel, priorityOffset) => {
      const listener = meta('EventListenerAction', {
        abilityActionMap: [
          {
            abilityEvent: 'OnAddedBuff',
            actions: [
              seq([
                meta('JumpToAction', {
                  conditionAction: seq([]),
                  destFrame: 107,
                  priorityLevel,
                  priorityOffset,
                }),
              ]),
            ],
          },
        ],
      });
      expect(() =>
        compileActiveSkillRuntimeProjectionSource({
          value: activeWithActions([listener]),
          sourcePath: 'fixture',
          patch: null,
          context: ACTIVE_CONTEXT,
        }),
      ).toThrow('unsupported native action priority');
    },
  );

  it('把受击监听的持续伤害与残留区域排除掩码保留为事件特征条件', () => {
    const listener = meta('EventListenerAction', {
      abilityActionMap: [
        {
          abilityEvent: 'OnBeforeTakeDamage',
          actions: [
            seq([
              meta('Conditions.CheckDamageDecorateMask', {
                checkType: 'ExceptAny',
                mask: 268435456 + 536870912,
              }),
              meta('JumpToAction', { conditionAction: seq([]), destFrame: 107 }),
            ]),
          ],
        },
      ],
    });
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([listener]),
      sourcePath: 'fixture',
      patch: null,
      context: ACTIVE_CONTEXT,
    });

    expect(
      result.scheduledSequences[0]?.sequence.steps[0]?.kind === 'listenForCombatEvents'
        ? result.scheduledSequences[0].sequence.steps[0].parameters.responses[0]?.sequence.steps
        : undefined,
    ).toEqual([
      {
        kind: 'conditional',
        parameters: {
          condition: {
            kind: 'eventDamageFeaturesMatch',
            match: 'exceptAny',
            features: ['dot', 'remainArea'],
          },
        },
        whenTrue: {
          steps: [{ kind: 'jumpTimeline', parameters: { destinationFrame: 107 } }],
        },
      },
    ]);
  });
  it.each([
    ['Fire', 'heat'],
    ['Pulse', 'electric'],
    ['Cryst', 'cryo'],
    ['Natural', 'nature'],
  ])('元素附着 %s 必须使用正式 DSL 元素 %s', (native, element) => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('SpellInfliction', {
          source: targetFixture('Source'),
          target: targetFixture('Target', undefined, 'inactive-residual-group'),
          inflictionType: native,
          isExtra: false,
        }),
      ]),
      sourcePath: 'active',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences[0]!.sequence.steps[0]).toEqual({
      kind: 'applyElementalInfliction',
      parameters: { element, isExtra: false },
    });
  });

  it('按固定木桩显式提供的零 IHittableObject 计算直接目标数量', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        {
          $type: 'Beyond.Gameplay.Core.Conditions.CheckEntityNum+Data, Gameplay.Beyond',
          isEnable: true,
          priorityLevel: 'Default',
          priorityOffset: 0,
          serverActionIndex: 3,
          checkTarget: targetFixture('Target'),
          minNum: 1,
          containsHittableTarget: true,
          compareType: 'GE',
          excludeDeadEntity: false,
          storeKey: '',
        },
        meta('GainBreakingAttackAtb', {
          source: targetFixture('Source'),
          target: targetFixture('Target'),
          factor: scalarFixture(1),
        }),
      ]),
      sourcePath: 'active',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences[0]!.sequence.steps[0]).toMatchObject({
      kind: 'conditional',
      parameters: {
        condition: {
          kind: 'actionValueCompare',
          left: { kind: 'constant', value: 1 },
          operator: 'greaterOrEqual',
          right: { kind: 'constant', value: 1 },
        },
      },
    });
  });

  it('零距离恒真分支排除不可达的空间写入，并传播唯一敌人 Context', () => {
    const skill = activeWithActions([
      meta('IfElseAction', {
        conditionAction: seq([
          entityCount('smart_target'),
          meta('CheckDistanceCondition', {
            source: targetFixture('MainCharacter'),
            target: targetFixture('Context', undefined, 'smart_target'),
            distance: 15,
            lessThan: true,
            includeTargetRadius: true,
            containsHittableObj: false,
          }),
        ]),
        succeedActions: seq([mergeContext('smart_target', 'selected')]),
        failActions: seq([fixedPoint('selected')]),
        alwaysNext: true,
      }),
      entityCount('selected', true),
      meta('GainBreakingAttackAtb', {
        source: targetFixture('Source'),
        target: targetFixture('Target'),
        factor: scalarFixture(1),
      }),
    ]);
    skill.selectStrategy = 'SelectSmartObject';
    skill.smartTargetSelectStrategy = 'SelectComboSkillTrigger';

    expect(
      compileActiveSkillRuntimeProjectionSource({
        value: skill,
        sourcePath: 'active.static-branch',
        patch: null,
        context: ACTIVE_CONTEXT,
      }).scheduledSequences[0]!.sequence.steps,
    ).toMatchObject([
      {
        kind: 'conditional',
        parameters: {
          condition: {
            kind: 'actionValueCompare',
            left: { kind: 'constant', value: 1 },
            operator: 'greaterOrEqual',
            right: { kind: 'constant', value: 1 },
          },
        },
      },
    ]);
  });

  it('不能证明距离分支时仍计入空间写入，不按 Context 名称放行', () => {
    const skill = activeWithActions([
      meta('IfElseAction', {
        conditionAction: seq([
          entityCount('smart_target'),
          meta('CheckDistanceCondition', {
            source: targetFixture('MainCharacter'),
            target: targetFixture('Context', undefined, 'smart_target'),
            distance: 15,
            lessThan: false,
            includeTargetRadius: true,
            containsHittableObj: false,
          }),
        ]),
        succeedActions: seq([mergeContext('smart_target', 'selected')]),
        failActions: seq([fixedPoint('selected')]),
        alwaysNext: true,
      }),
      entityCount('selected', true),
      meta('GainBreakingAttackAtb', {
        source: targetFixture('Source'),
        target: targetFixture('Target'),
        factor: scalarFixture(1),
      }),
    ]);
    skill.selectStrategy = 'SelectSmartObject';
    skill.smartTargetSelectStrategy = 'SelectComboSkillTrigger';

    expect(() =>
      compileActiveSkillRuntimeProjectionSource({
        value: skill,
        sourcePath: 'active.unknown-branch',
        patch: null,
        context: ACTIVE_CONTEXT,
      }),
    ).toThrow('unsupported Context target count condition');
  });

  it('跨调度的敌人目标并集允许把输出自身作为幂等累加输入', () => {
    const skill = activeWithActions([mergeContext('smart_target', 'selected')]);
    skill.selectStrategy = 'SelectSmartObject';
    skill.smartTargetSelectStrategy = 'SelectComboSkillTrigger';
    const actionGroup = skill.actionGroupData as { timelineActions: Record<string, unknown>[] };
    actionGroup.timelineActions.push(
      {
        ...actionGroup.timelineActions[0],
        _startFrame: 3,
        _endFrame: 4,
        _sequenceActionData: seq([
          meta('MergeTargetAction', {
            targets: [
              targetFixture('Context', undefined, 'smart_target'),
              targetFixture('Context', undefined, 'selected'),
            ],
            targetGroupKey: 'selected',
          }),
        ]),
      },
      {
        ...actionGroup.timelineActions[0],
        _startFrame: 6,
        _endFrame: 7,
        _sequenceActionData: seq([
          entityCount('selected', true),
          meta('GainBreakingAttackAtb', {
            source: targetFixture('Source'),
            target: targetFixture('Target'),
            factor: scalarFixture(1),
          }),
        ]),
      },
    );

    expect(
      compileActiveSkillRuntimeProjectionSource({
        value: skill,
        sourcePath: 'active.self-merge',
        patch: null,
        context: ACTIVE_CONTEXT,
      }).scheduledSequences.at(-1)!.sequence.steps,
    ).toMatchObject([
      {
        kind: 'conditional',
        parameters: {
          condition: {
            kind: 'actionValueCompare',
            left: { kind: 'constant', value: 1 },
            operator: 'greaterOrEqual',
            right: { kind: 'constant', value: 1 },
          },
        },
      },
    ]);
  });

  it('跨调度保留仅由能力实体生成写入的 Context 成员类型', () => {
    const skill = activeWithActions([spawnAbilityEntity('bunshin')]);
    const actionGroup = skill.actionGroupData as { timelineActions: Record<string, unknown>[] };
    actionGroup.timelineActions.push({
      ...actionGroup.timelineActions[0],
      _startFrame: 9,
      _endFrame: 12,
      _sequenceActionData: seq([
        meta('SetAbilityEntityDuration', {
          setMultipleTarget: false,
          targetSettings: targetFixture('Target'),
          actionTargetType: 'ContextTarget',
          targetContextKey: 'bunshin',
          operation: 'Assign',
          value: scalarFixture(30),
        }),
      ]),
    });
    actionGroup.timelineActions.push({
      ...actionGroup.timelineActions[0],
      _startFrame: 13,
      _endFrame: 14,
      _sequenceActionData: seq([
        meta('FinishOwnerAction', {
          owner: targetFixture('Context', undefined, 'bunshin'),
          skipDieDisplay: false,
        }),
      ]),
    });

    const result = compileActiveSkillRuntimeProjectionSource({
      value: skill,
      sourcePath: 'active.cross-timeline-ability-entity',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences[1]).toMatchObject({
      startFrame: 9,
      sequence: {
        steps: [
          {
            kind: 'forEachContextTarget',
            parameters: { contextKey: 'bunshin' },
            body: {
              steps: [
                {
                  kind: 'setAbilityEntityRemainingDuration',
                  parameters: { value: { kind: 'constant', value: 30 } },
                },
              ],
            },
          },
        ],
      },
    });
    expect(result.scheduledSequences[2]).toMatchObject({
      startFrame: 13,
      sequence: {
        steps: [
          {
            kind: 'forEachContextTarget',
            parameters: { contextKey: 'bunshin' },
            body: { steps: [{ kind: 'finishCurrentAbilityEntity', parameters: {} }] },
          },
        ],
      },
    });
  });

  it('能力实体可出生于无过滤的即时 FixedPointFinder 空间点', () => {
    const spawn = spawnAbilityEntity('fixed-point-entity');
    spawn.bornAt = {
      ...targetFixture('InstantSearch', {
        finderData: {
          $type: 'Beyond.Gameplay.Core.Selector+FixedPointFinder+Data, Gameplay.Beyond',
          positionOffset: { x: 0, y: 0, z: 0 },
          rotationOffset: { x: 0, y: 0, z: 0, w: 1 },
          snapToNavmesh: false,
          sampleRadius: scalarFixture(0),
        },
        validatorData: [],
        postProcessorData: [],
      }),
      centerType: 'InputTarget',
      centerToGround: true,
    };
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([spawn]),
      sourcePath: 'active.fixed-point-spawn',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences[0]!.sequence.steps[0]).toMatchObject({
      kind: 'spawnAbilityEntity',
      parameters: { abilityEntityId: 'abilityentity_fixture' },
    });
  });

  it('能力实体可以已证明的 Context 零空间点为中心再做 FixedPoint，Owner 不读残留组名', () => {
    const spawn = spawnAbilityEntity('spawned');
    spawn.setAbilityEntityTarget = true;
    spawn.abilityEntityTarget = {
      ...targetFixture('Owner'),
      targetGroupKey: 'stale-spatial-group',
    };
    spawn.bornAt = {
      ...targetFixture('Context', undefined, 'anchor'),
      centerType: 'InputTarget',
      centerToGround: true,
      selectorData: {
        finderData: {
          $type: 'Beyond.Gameplay.Core.Selector+FixedPointFinder+Data, Gameplay.Beyond',
          positionOffset: { x: 0, y: 0, z: 0 },
          rotationOffset: { x: 0, y: 0, z: 0, w: 1 },
          snapToNavmesh: false,
          sampleRadius: scalarFixture(0),
        },
        validatorData: [],
        postProcessorData: [],
      },
    };
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([fixedPoint('anchor'), spawn]),
      sourcePath: 'active.context-fixed-point-spawn',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences[0]!.sequence.steps).toContainEqual({
      kind: 'spawnAbilityEntity',
      parameters: expect.objectContaining({
        abilityEntityId: 'abilityentity_fixture',
        target: 'caster',
      }),
    });
  });

  it.each([false, true])('RandomPointFinder 跨 Context 保留点数（新版二维尺寸=%s）', withExtent => {
    const randomPoint = meta('FindTargetAction', {
      targetGroupKey: 'random-points',
      center: 'ContextTarget',
      centerContextKey: 'anchor',
      useCenterEntityMountPoint: false,
      centerMountPoint: 'None',
      centerToGround: false,
      selectorOwner: 'ActionOwner',
      selectorOwnerContextKey: '',
      selectorData: {
        finderData: {
          $type: 'Beyond.Gameplay.Core.Selector+RandomPointFinder+Data, Gameplay.Beyond',
          pointNum: scalarFixture(2),
          shape: 'Sector',
          ...(withExtent ? { extent2D: { x: scalarFixture(0), y: scalarFixture(0) } } : {}),
          localPlaneRotationEulers: {
            x: scalarFixture(-90),
            y: scalarFixture(0),
            z: scalarFixture(0),
          },
          radius: scalarFixture(1.6),
          minRadius: scalarFixture(0.4),
          angle: scalarFixture(180),
          useExtraJitter: false,
          snapToNavMesh: false,
        },
        validatorData: [],
        postProcessorData: [],
      },
      selectorDirection: 'SourceForward',
      target: 'ActionSource',
      contextKey: '',
      useAdvancedDirectionSetting: false,
      advancedSelectorDirection: {
        directionType: 'SourceForward',
        sourceMountPoint: 'None',
        targetMountPoint: 'None',
        customSourceAndTarget: false,
        clampToXZ: true,
        invertDirection: false,
      },
    });
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([fixedPoint('anchor'), randomPoint]),
      sourcePath: 'active.context-random-point',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences[0]!.sequence.steps).toContainEqual({
      kind: 'createSpatialPointTargets',
      parameters: {
        saveToContextKey: 'random-points',
        count: { kind: 'constant', value: 2 },
      },
    });
  });

  it('能力实体未覆盖寿命时不读取 duration 的序列化残留黑板键', () => {
    const spawn = spawnAbilityEntity('default-duration-entity');
    spawn.duration = scalarFixture(0, 'attack_scale');
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([spawn]),
      sourcePath: 'active.default-ability-duration',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences[0]!.sequence.steps[0]).toMatchObject({
      kind: 'spawnAbilityEntity',
      parameters: { abilityEntityId: 'abilityentity_fixture' },
    });
    expect(result.scheduledSequences[0]!.sequence.steps[0]).not.toHaveProperty(
      'parameters.overrideDurationSeconds',
    );
  });

  it('Both hit-stop 保留为施法者与木桩的实体时间膨胀', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('HitStopAction', {
          affectType: 'Both',
          curveKey: 'char_hard_stop',
          useDirectCurve: false,
          directCurve: [],
          duration: 0.15,
          timeDilationPriority: { tagId: -2059842104 },
          attacker: targetFixture('Source'),
          target: targetFixture('Target'),
        }),
      ]),
      sourcePath: 'active',
      patch: null,
      context: ACTIVE_CONTEXT,
      extensions: { resolveTimeDilationPriority: tagId => (tagId === -2059842104 ? 10 : NaN) },
    });
    expect(result.scheduledSequences[0]).toMatchObject({ startFrame: 5, endFrame: 8 });
    expect(result.scheduledSequences[0]!.sequence.steps).toEqual([
      {
        kind: 'startTimeDilation',
        parameters: {
          scope: 'entity',
          durationSeconds: { kind: 'constant', value: 0.15 },
          slot: 'TimeDilation/Layer/Entity/HitStop',
          priority: 10,
          curve: { kind: 'named', key: 'char_hard_stop' },
          finishByAction: false,
          targets: ['enemy', 'caster'],
        },
      },
    ]);
  });

  it('技能动作 Owner 已证明为施术者时可作为 Both hit-stop 攻击者', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('HitStopAction', {
          affectType: 'Both',
          curveKey: 'char_hard_stop',
          useDirectCurve: false,
          directCurve: [],
          duration: 0.03,
          timeDilationPriority: { tagId: -2059842104 },
          attacker: targetFixture('Owner'),
          target: targetFixture('Target'),
        }),
      ]),
      sourcePath: 'active',
      patch: null,
      context: ACTIVE_CONTEXT,
      extensions: { resolveTimeDilationPriority: () => 10 },
    });

    expect(result.scheduledSequences[0]!.sequence.steps).toMatchObject([
      { kind: 'startTimeDilation', parameters: { targets: ['enemy', 'caster'] } },
    ]);
  });

  it('OnlyAttacker hit-stop 只缩放施法者自身时钟', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('HitStopAction', {
          affectType: 'OnlyAttacker',
          curveKey: 'char_hard_stop',
          useDirectCurve: false,
          directCurve: [],
          duration: 0.15,
          timeDilationPriority: { tagId: -2059842104 },
          attacker: targetFixture('Source'),
          // OnlyAttacker 不读取序列化 target；萤石原始样本保留 Source 残值。
          target: targetFixture('Source'),
        }),
      ]),
      sourcePath: 'active',
      patch: null,
      context: ACTIVE_CONTEXT,
      extensions: { resolveTimeDilationPriority: () => 10 },
    });
    expect(result.scheduledSequences[0]!.sequence.steps).toMatchObject([
      { kind: 'startTimeDilation', parameters: { targets: ['caster'] } },
    ]);
  });

  it('OnlyAttacker 的 MainCharacter 目标缩放当前主控而不是技能施法者', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('HitStopAction', {
          affectType: 'OnlyAttacker',
          curveKey: 'char_hard_stop',
          useDirectCurve: false,
          directCurve: [],
          duration: 0.15,
          timeDilationPriority: { tagId: -2059842104 },
          attacker: targetFixture('MainCharacter'),
          target: targetFixture('Context', undefined, 'tar'),
        }),
      ]),
      sourcePath: 'active',
      patch: null,
      context: ACTIVE_CONTEXT,
      extensions: { resolveTimeDilationPriority: () => 10 },
    });
    expect(result.scheduledSequences[0]!.sequence.steps).toMatchObject([
      { kind: 'startTimeDilation', parameters: { targets: ['controlled'] } },
    ]);
  });

  it('命名 hit-stop 忽略未选中的内联曲线序列化残值', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('HitStopAction', {
          affectType: 'OnlyAttacker',
          curveKey: 'char_normal_attack',
          useDirectCurve: false,
          directCurve: [{ serialized: 'residual and intentionally not decoded' }],
          duration: 0.2,
          timeDilationPriority: { tagId: -2059842104 },
          attacker: targetFixture('Source'),
          target: targetFixture('Target'),
        }),
      ]),
      sourcePath: 'active',
      patch: null,
      context: ACTIVE_CONTEXT,
      extensions: { resolveTimeDilationPriority: () => 10 },
    });

    expect(result.scheduledSequences[0]!.sequence.steps).toMatchObject([
      {
        kind: 'startTimeDilation',
        parameters: { curve: { kind: 'named', key: 'char_normal_attack' } },
      },
    ]);
  });

  it('内联 hit-stop 恢复 Unity 序列化的无穷切线', () => {
    const curveKey = (time: number, value: number, inTangent: number | string) => ({
      time,
      value,
      inTangent,
      outTangent: 0,
      inWeight: 0,
      outWeight: 0,
      weightedMode: 0,
    });
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('HitStopAction', {
          affectType: 'OnlyAttacker',
          curveKey: 'unused',
          useDirectCurve: true,
          directCurve: [curveKey(0, 1, 0), curveKey(1, 0.02, 'Infinity')],
          duration: 0.4,
          timeDilationPriority: { tagId: -2059842104 },
          attacker: targetFixture('Source'),
          target: targetFixture('Target'),
        }),
      ]),
      sourcePath: 'active.inline-hit-stop',
      patch: null,
      context: ACTIVE_CONTEXT,
      extensions: { resolveTimeDilationPriority: () => 10 },
    });
    expect(result.scheduledSequences[0]!.sequence.steps[0]).toMatchObject({
      kind: 'startTimeDilation',
      parameters: {
        curve: {
          kind: 'inline',
          keys: [
            { time: 0, value: 1 },
            { time: 1, value: 0.02 },
          ],
        },
      },
    });
  });

  it('全局时间膨胀按启用位保留技能冷却受缩放时长', () => {
    const ownerSpawnedAbilityEntities = {
      ...targetFixture('InstantSearch'),
      selectorData: {
        finderData: {
          $type: 'Beyond.Gameplay.Core.Selector+OwnerSpawnedEntityFinder+Data, Gameplay.Beyond',
          spawnedObjectType: 'AbilityEntity',
        },
        validatorData: [],
        postProcessorData: [],
      },
    };
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('TimeDilationAction', {
          layer: 'Global',
          slot: { tagId: 0 },
          timeDilationPriority: { tagId: -593023102 },
          duration: scalarFixture(0.9),
          useCurveKey: true,
          curveKey: 'ComboSkill',
          timeScaleCurve: [],
          finishByAction: false,
          ignoreTargets: [targetFixture('Owner'), ownerSpawnedAbilityEntities],
          effectTargets: [],
          useTimeScaleForSkillCdTick: true,
          influenceSkillCdTime: scalarFixture(0.4),
        }),
      ]),
      sourcePath: 'active',
      patch: null,
      context: ACTIVE_CONTEXT,
      extensions: { resolveTimeDilationPriority: () => 20 },
    });

    expect(result.scheduledSequences[0]!.sequence.steps).toEqual([
      {
        kind: 'startTimeDilation',
        parameters: {
          scope: 'global',
          durationSeconds: { kind: 'constant', value: 0.9 },
          slot: 'unassigned',
          priority: 20,
          curve: { kind: 'named', key: 'ComboSkill' },
          finishByAction: false,
          ignoredTargets: ['caster'],
          ignoredAbilityEntityTargets: [{ kind: 'ownerSpawned' }],
          influenceSkillCooldownSeconds: { kind: 'constant', value: 0.4 },
        },
      },
    ]);
  });

  it('命名全局时间膨胀可只忽略施法者而不虚构能力实体忽略组', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('TimeDilationAction', {
          layer: 'Global',
          slot: { tagId: 0 },
          timeDilationPriority: { tagId: -593023102 },
          duration: scalarFixture(0.5),
          useCurveKey: true,
          curveKey: 'ComboSkill',
          timeScaleCurve: [],
          finishByAction: false,
          ignoreTargets: [targetFixture('Owner')],
          effectTargets: [],
          useTimeScaleForSkillCdTick: false,
          influenceSkillCdTime: scalarFixture(0),
        }),
      ]),
      sourcePath: 'active.caster-only-time-dilation',
      patch: null,
      context: ACTIVE_CONTEXT,
      extensions: { resolveTimeDilationPriority: () => 20 },
    });

    expect(result.scheduledSequences[0]!.sequence.steps).toEqual([
      {
        kind: 'startTimeDilation',
        parameters: {
          scope: 'global',
          durationSeconds: { kind: 'constant', value: 0.5 },
          slot: 'unassigned',
          priority: 20,
          curve: { kind: 'named', key: 'ComboSkill' },
          finishByAction: false,
          ignoredTargets: ['caster'],
        },
      },
    ]);
  });

  it('内联全局时间膨胀按 useCurveKey 选择器忽略命名残值并接受施法者 Owner', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('TimeDilationAction', {
          layer: 'Global',
          slot: { tagId: 0 },
          timeDilationPriority: { tagId: -361293424 },
          duration: scalarFixture(0.4),
          useCurveKey: false,
          curveKey: 'ComboSkill',
          timeScaleCurve: [
            {
              time: 0,
              value: 0.01,
              inTangent: 0,
              outTangent: 0,
              inWeight: 0,
              outWeight: 0,
              weightedMode: 0,
            },
            {
              time: 1,
              value: 0.01,
              inTangent: 0,
              outTangent: 0,
              inWeight: 0,
              outWeight: 0,
              weightedMode: 0,
            },
          ],
          finishByAction: false,
          ignoreTargets: [targetFixture('Owner')],
          effectTargets: [],
          useTimeScaleForSkillCdTick: false,
          influenceSkillCdTime: scalarFixture(0),
        }),
      ]),
      sourcePath: 'active.inline-global-owner',
      patch: null,
      context: ACTIVE_CONTEXT,
      extensions: { resolveTimeDilationPriority: () => 20 },
    });

    expect(result.scheduledSequences[0]!.sequence.steps).toEqual([
      {
        kind: 'startTimeDilation',
        parameters: {
          scope: 'global',
          durationSeconds: { kind: 'constant', value: 0.4 },
          slot: 'unassigned',
          priority: 20,
          curve: {
            kind: 'inline',
            keys: [
              {
                time: 0,
                value: 0.01,
                inTangent: 0,
                outTangent: 0,
                weightedMode: 0,
                inWeight: 0,
                outWeight: 0,
              },
              {
                time: 1,
                value: 0.01,
                inTangent: 0,
                outTangent: 0,
                weightedMode: 0,
                inWeight: 0,
                outWeight: 0,
              },
            ],
          },
          finishByAction: false,
          ignoredTargets: ['caster'],
        },
      },
    ]);
  });

  it('按静态 born tag 目录筛选自有能力实体的全局时间倍率忽略目标', () => {
    const tagId = gameplayTagIdFromPath('Test/Tag123');
    const catalog = compileAbilityEntityTemplateCatalogSource({
      abilityentity_matching: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_matching',
        bornTagIds: [tagId],
      },
      abilityentity_other: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_other',
        bornTagIds: [gameplayTagIdFromPath('Test/Other')],
      },
    });
    const ownerSpawnedByTag = {
      ...targetFixture('InstantSearch'),
      selectorData: {
        finderData: {
          $type: 'Beyond.Gameplay.Core.Selector+OwnerSpawnedEntityFinder+Data, Gameplay.Beyond',
          spawnedObjectType: 'AbilityEntity',
        },
        validatorData: [
          {
            $type: 'Beyond.Gameplay.Core.Selector+TagValidator+Data, Gameplay.Beyond',
            query: { queryType: 'HasAny', tags: [{ tagId }] },
          },
        ],
        postProcessorData: [],
      },
    };

    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('SetIgnoreGlobalTimeScaleAction', {
          targetSettings: ownerSpawnedByTag,
          ignoreGlobalTimeScale: true,
          revertOnEnd: true,
        }),
      ]),
      sourcePath: 'active.tagged-ignore',
      patch: null,
      context: {
        ...ACTIVE_CONTEXT,
        abilityEntityQueries: { catalog, gameplayTagRegistry: fixtureGameplayTagRegistry },
      },
      extensions: {},
    });

    expect(result.scheduledSequences[0]!.sequence.steps).toEqual([
      {
        kind: 'setIgnoreGlobalTimeScale',
        parameters: {
          abilityEntityTargets: [
            { kind: 'ownerSpawned', abilityEntityIds: ['abilityentity_matching'] },
          ],
          ignore: true,
          revertOnEnd: true,
        },
      },
    ]);
  });

  it('FinishOwner 按 born tag 查询并结束真实已生成的自有能力实体', () => {
    const tagId = gameplayTagIdFromPath('Test/Tag123');
    const catalog = compileAbilityEntityTemplateCatalogSource({
      abilityentity_matching: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_matching',
        bornTagIds: [tagId],
      },
      abilityentity_other: {
        ...abilityEntityFixture(),
        gameId: 'abilityentity_other',
        bornTagIds: [gameplayTagIdFromPath('Test/Other')],
      },
    });
    const ownerSpawnedByTag = {
      ...targetFixture('InstantSearch'),
      selectorData: {
        finderData: {
          $type: 'Beyond.Gameplay.Core.Selector+OwnerSpawnedEntityFinder+Data, Gameplay.Beyond',
          spawnedObjectType: 'AbilityEntity',
        },
        validatorData: [
          {
            $type: 'Beyond.Gameplay.Core.Selector+TagValidator+Data, Gameplay.Beyond',
            query: { queryType: 'HasAny', tags: [{ tagId }] },
          },
        ],
        postProcessorData: [],
      },
    };

    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('FinishOwnerAction', { owner: ownerSpawnedByTag, skipDieDisplay: true }),
      ]),
      sourcePath: 'active.tagged-finish',
      patch: null,
      context: {
        ...ACTIVE_CONTEXT,
        abilityEntityQueries: { catalog, gameplayTagRegistry: fixtureGameplayTagRegistry },
      },
      extensions: {},
    });

    const contextKey =
      '__finishOwner:active.tagged-finish.actionGroupData.timelineActions[0]._sequenceActionData.actionData[0]';
    expect(result.scheduledSequences[0]!.sequence.steps).toEqual([
      {
        kind: 'findOwnerSpawnedAbilityEntities',
        parameters: {
          saveToContextKey: contextKey,
          abilityEntityIds: ['abilityentity_matching'],
        },
      },
      {
        kind: 'forEachContextTarget',
        parameters: { contextKey },
        body: { steps: [{ kind: 'finishCurrentAbilityEntity', parameters: {} }] },
      },
    ]);
  });

  it('实体内联时间膨胀忽略未选中的命名曲线残值', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('TimeDilationAction', {
          layer: 'Entity',
          slot: { tagId: 0 },
          timeDilationPriority: { tagId: 1 },
          duration: scalarFixture(99999),
          useCurveKey: false,
          curveKey: 'ComboSkill',
          timeScaleCurve: [
            {
              time: 0,
              value: 1.25,
              inTangent: 0,
              outTangent: 0,
              inWeight: 0,
              outWeight: 0,
              weightedMode: 0,
            },
            {
              time: 1,
              value: 1.25,
              inTangent: 0,
              outTangent: 0,
              inWeight: 0,
              outWeight: 0,
              weightedMode: 0,
            },
          ],
          finishByAction: true,
          ignoreTargets: [],
          effectTargets: [targetFixture('Owner')],
          useTimeScaleForSkillCdTick: false,
          influenceSkillCdTime: scalarFixture(0),
        }),
      ]),
      sourcePath: 'active',
      patch: null,
      context: ACTIVE_CONTEXT,
      extensions: { resolveTimeDilationPriority: () => 30 },
    });

    expect(result.scheduledSequences[0]!.sequence.steps).toMatchObject([
      {
        kind: 'startTimeDilation',
        parameters: {
          targets: ['caster'],
          curve: {
            kind: 'inline',
            keys: [
              { time: 0, value: 1.25 },
              { time: 1, value: 1.25 },
            ],
          },
        },
      },
    ]);
  });

  it('版本化公共回能 Buff 投影为按技能消耗获得全队终结技能量', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('CreateBuffAction', {
          buffs: [
            {
              buffId: 'buff_common_obtain_ultimate_sp',
              assignBlackboard: false,
              assignItems: [],
              readIdFromBlackboard: false,
              buffIdKey: '',
            },
          ],
          count: scalarFixture(1),
          targetSettings: targetFixture('Source'),
          buffSource: 'ActionSource',
          contextKey: '',
          autoFinishByAction: false,
          inheritSkillIdList: [],
          finishWithNextSkillIfNotInherited: true,
          asChildBuff: false,
          inheritSourceSkillCastId: true,
          inheritSourceSkillCastInfo: true,
          isExtra: false,
          passTargetGroupsToBuff: false,
          overrideBuffIconDuration: false,
          buffIconDurationSource: {
            m_abilityEntityTypeInfo: '',
            m_timedMarkerInfo: '',
            durationSourceType: 'AbilityEntity',
            timedMarkerId: '',
          },
        }),
      ]),
      sourcePath: 'active',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences[0]!.sequence.steps).toEqual([
      { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
    ]);

    const projectileCallbackResult = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('CreateBuffAction', {
          buffs: [
            {
              buffId: 'buff_common_obtain_ultimate_sp',
              assignBlackboard: false,
              assignItems: [],
              readIdFromBlackboard: false,
              buffIdKey: '',
            },
          ],
          count: scalarFixture(1),
          targetSettings: targetFixture('Owner'),
          buffSource: 'ActionSource',
          contextKey: '',
          autoFinishByAction: false,
          inheritSkillIdList: [],
          finishWithNextSkillIfNotInherited: true,
          asChildBuff: false,
          inheritSourceSkillCastId: true,
          inheritSourceSkillCastInfo: true,
          isExtra: false,
          passTargetGroupsToBuff: false,
          overrideBuffIconDuration: false,
          buffIconDurationSource: {
            m_abilityEntityTypeInfo: '',
            m_timedMarkerInfo: '',
            durationSourceType: 'AbilityEntity',
            timedMarkerId: '',
          },
        }),
      ]),
      sourcePath: 'projectile-callback',
      patch: null,
      context: {
        ...ACTIVE_CONTEXT,
        actionOwnerTarget: 'unavailable',
      },
    });
    expect(projectileCallbackResult.scheduledSequences[0]!.sequence.steps).toEqual([
      { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
    ]);
  });

  it('能力实体动作允许图标倒计时跟随实体，同时保留真实 Buff 生命周期', () => {
    const createBuff = meta('CreateBuffAction', {
      buffs: [
        {
          buffId: 'buff_fixture_entity_child',
          assignBlackboard: false,
          assignItems: [],
          readIdFromBlackboard: false,
          buffIdKey: '',
        },
      ],
      count: scalarFixture(1),
      targetSettings: targetFixture('Owner'),
      buffSource: 'ActionSource',
      contextKey: '',
      autoFinishByAction: true,
      inheritSkillIdList: [],
      finishWithNextSkillIfNotInherited: true,
      asChildBuff: true,
      inheritSourceSkillCastId: false,
      inheritSourceSkillCastInfo: true,
      isExtra: false,
      passTargetGroupsToBuff: false,
      overrideBuffIconDuration: true,
      buffIconDurationSource: {
        m_abilityEntityTypeInfo: '',
        m_timedMarkerInfo: '',
        durationSourceType: 'AbilityEntity',
        timedMarkerId: '',
      },
    });
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([createBuff]),
      sourcePath: 'ability-entity-child',
      patch: null,
      context: { ...ACTIVE_CONTEXT, actionOwnerTarget: 'currentAbilityEntity' },
    });

    expect(result.scheduledSequences[0]!.sequence.steps).toEqual([
      {
        kind: 'applyBuff',
        parameters: {
          buffId: 'buff_fixture_entity_child',
          target: 'currentAbilityEntity',
          inheritSourceSkillCastInfo: true,
          iconDurationSource: { kind: 'actionOwnerAbilityEntity' },
          finishByAction: true,
          asChildBuff: true,
        },
      },
    ]);
    expect(() =>
      compileActiveSkillRuntimeProjectionSource({
        value: activeWithActions([
          {
            ...createBuff,
            overrideBuffIconDuration: true,
            buffIconDurationSource: {
              m_abilityEntityTypeInfo: '',
              m_timedMarkerInfo: '',
              durationSourceType: 'TimedMarker',
              timedMarkerId: 'marker',
            },
          },
        ]),
        sourcePath: 'ability-entity-child',
        patch: null,
        context: { ...ACTIVE_CONTEXT, actionOwnerTarget: 'currentAbilityEntity' },
      }),
    ).toThrow('unsupported CreateBuff icon duration source');
  });

  it('处决回能读取场景敌人基值并保留技能侧倍率', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('GainBreakingAttackAtb', {
          source: targetFixture('Source'),
          target: targetFixture('Target'),
          factor: scalarFixture(1),
        }),
      ]),
      sourcePath: 'active.finisher',
      patch: null,
      context: ACTIVE_CONTEXT,
    });

    expect(result.scheduledSequences[0]!.sequence.steps).toEqual([
      { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
    ]);

    const groupedTargetResult = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('MergeTargetAction', {
          targets: [targetFixture('Target')],
          targetGroupKey: 'myTar',
        }),
        meta('GainBreakingAttackAtb', {
          source: targetFixture('Source'),
          target: targetFixture('Target', undefined, 'myTar'),
          factor: scalarFixture(0.75),
        }),
      ]),
      sourcePath: 'active.finisher.grouped-target',
      patch: null,
      context: ACTIVE_CONTEXT,
    });

    expect(groupedTargetResult.scheduledSequences[0]!.sequence.steps).toEqual([
      { kind: 'gainFinisherSp', parameters: { factor: 0.75, recipient: 'team' } },
    ]);
  });

  it('只省略空 onEnd 的动画；动画结束战斗子图继续严格拒绝', () => {
    const animation = meta('PlayAnimationAction', {
      animName: 'Skill',
      blendDuration: 0,
      blendOut: 0.2,
      duration: 1,
      playbackSpeed: 1,
      useStartTimeBlackboardKey: false,
      startTime: 0,
      startTimeBlackboardKey: '',
      exitToIdle: false,
      blendOutNextStateHash: 0,
      onEndAction: {
        actionData: [],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      executeOnNormalEndOnly: false,
    });
    expect(
      compileActiveSkillRuntimeProjectionSource({
        value: activeWithActions([animation]),
        sourcePath: 'active',
        patch: null,
        context: ACTIVE_CONTEXT,
      }).scheduledSequences,
    ).toEqual([]);
    animation.onEndAction = {
      ...(animation.onEndAction as object),
      actionData: [
        {
          ...meta('JumpToAction', {
            conditionAction: {
              actionData: [],
              onlyExecuteWhenSourceIsMainChar: false,
              onlyExecuteWhenSourceIsGuard: false,
            },
            destFrame: 996,
          }),
          isEnable: false,
        },
      ],
    };
    expect(
      compileActiveSkillRuntimeProjectionSource({
        value: activeWithActions([animation]),
        sourcePath: 'active',
        patch: null,
        context: ACTIVE_CONTEXT,
      }).scheduledSequences,
    ).toEqual([]);
    animation.onEndAction = {
      ...(animation.onEndAction as object),
      actionData: [meta('FinishOwnerAction', { target: targetFixture('Owner') })],
    };
    expect(() =>
      compileActiveSkillRuntimeProjectionSource({
        value: activeWithActions([animation]),
        sourcePath: 'active',
        patch: null,
        context: ACTIVE_CONTEXT,
      }),
    ).toThrow('animation end combat actions are unsupported');
  });
});
