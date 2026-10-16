import { CombatActionSequenceRuntime } from '../../../../src/core/combat/actions/combatActionSequenceRuntime';
import { ActionBlackboard } from '../../../../src/core/combat/actions/actionBlackboard';
import { compileGraphSequence } from '../support/graphSequence.ts';
import { parseTargetReferenceSource } from '../../src/source/target.ts';
import { parseSkillPatchSource, resolveSkillElement } from '../../src/source/skillPatch.ts';
import { readResourceActions, graphBranch } from '../support/graphAssertions.ts';
import { fixtureGameplayTagRegistry } from '../gameplayTagFixtures.ts';
import { describe, expect, it } from 'vitest';
import { compileActiveSkillRuntimeProjectionSource } from '../../src/compiler/skills/activeSkillRuntimeProjection.ts';
import { optimizeResourceGraphs } from '../../src/compiler/optimization/resourceGraphOptimization.ts';
import { extractResourceDataNodes } from '../../src/compiler/extractGraphDataNodes.ts';
import { compileCombatActionSequenceSource } from '../../src/compiler/buffs/buffRuntimeProjection.ts';
import { collectCombatInvisiblePresentationAssignmentKeys } from '../../src/compiler/optimization/nativePresentationUsage.ts';
import { collectUnconsumedSkillLocalKeys } from '../../src/compiler/skills/skillPresentationTargets.ts';
import {
  collectEnabledNativeActionNodes,
  parseKnownNativeActionSequenceSource,
} from '../../src/source/actionLeaf.ts';
import { summarizeNativeBlackboardUsage } from '../../src/compiler/optimization/nativeBlackboardUsage.ts';
import { parseKnownSkillActionGraphSource } from '../../src/source/skillActionGraph.ts';
import {
  abilityEntityFixture,
  activeSkillFixture,
  scalarFixture,
  targetFixture,
} from '../sourceFixtures.ts';
import { compileAbilityEntityTemplateCatalogSource } from '../../src/compiler/abilities/abilityEntityCatalog.ts';
import { gameplayTagIdFromPath } from '../../src/source/nativeGameplayTags.ts';

import { createActionGraphBuilder } from '../../src/compiler/actions/actionGraphBuilder.ts';
import { readActionGraphChain } from '../../src/compiler/actions/actionGraphBuilder.ts';
import type { CompiledBuffStepSource } from '../../src/compiler/actions/combatActionProjectionTypes.ts';

const ACTIVE_CONTEXT = {
  gameplayTagRegistry: fixtureGameplayTagRegistry,
  actionOwnerTarget: 'caster',
  actionSourceTarget: 'caster',
  actionTargetTarget: 'enemy',
  fixedHittableTargetCount: 0,
} as const;

describe('HideUI active source projection', () => {
  it('保留原生追加战技身份，不改变技能执行图和时长', () => {
    const source = activeWithActions([]);
    const compile = (normalSkillSubType: string | number) =>
      compileActiveSkillRuntimeProjectionSource({
        value: { ...source, normalSkillSubType },
        sourcePath: 'fixture',
        patch: null,
        context: ACTIVE_CONTEXT,
      });
    const ordinary = compile('Normal');
    expect(compile('AdditionalNormalSkill')).toEqual({
      ...ordinary,
      normalSkillSubType: 'additionalNormalSkill',
    });
    expect(compile(1)).toEqual(compile('AdditionalNormalSkill'));
    expect(() => compile(2)).toThrow();
  });
  it('技能属性以等级补丁覆盖基础配置，拒绝等级间不一致', () => {
    const patch = parseSkillPatchSource(
      {
        SkillPatchDataBundle: [
          { level: 1, iconBgType: 3, blackboard: [] },
          { level: 2, iconBgType: 3, blackboard: [] },
        ],
      },
      'test',
    );
    expect(resolveSkillElement('Physical', patch, 'test')).toBe('electric');
    expect(() =>
      parseSkillPatchSource(
        {
          SkillPatchDataBundle: [
            { level: 1, iconBgType: 3, blackboard: [] },
            { level: 2, iconBgType: 2, blackboard: [] },
          ],
        },
        'test',
      ),
    ).toThrow('skill element differs between levels');
  });

  it('只裁剪没有消费者的技能局部常量，不裁剪实体值或后续读取的值', () => {
    const assignment = (key: string) =>
      meta('ModifyDynamicBlackboard', {
        key,
        operation: 'Assign',
        directValue: true,
        value: scalarFixture(1),
        calculationTarget: targetFixture('Owner'),
        calculateType: 'HpRatio',
      });
    const value = activeWithActions([
      assignment('unused_local'),
      assignment('used_local'),
      assignment('EntityBB_shared'),
      { ...assignment('EntityBB_shared'), value: scalarFixture(0, 'used_local') },
    ]);
    value.blackboard = ['unused_local', 'used_local', 'EntityBB_shared'].map(key => ({
      key,
      valueDouble: 0,
      valueStr: '',
      isDynamic: true,
    }));
    const graph = parseKnownSkillActionGraphSource(value, 'local.assignment', {});
    expect([...collectUnconsumedSkillLocalKeys(graph, value)]).toEqual(['unused_local']);
    expect([
      ...collectUnconsumedSkillLocalKeys(graph, {
        ...value,
        externalConsumer: { key: 'unused_local' },
      }),
    ]).toEqual([]);
    const result = compileActiveSkillRuntimeProjectionSource({
      value,
      sourcePath: 'local.assignment',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    const steps = JSON.stringify(
      result.scheduledSequences.flatMap(item => readResourceActions(result, item.sequence)),
    );
    expect(steps).not.toContain('unused_local');
    expect(steps).toContain('used_local');
    expect(steps).toContain('EntityBB_shared');
  });

  it('目标角度是纯读取，只在两分支战斗结果相同时消去判断', () => {
    const wrapper = (actionData: unknown[]) => ({
      actionData,
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
    });
    const gain = (factor: number) =>
      meta('GainBreakingAttackAtb', {
        source: targetFixture('Source'),
        target: targetFixture('Target'),
        factor: scalarFixture(factor),
      });
    const branch = meta('IfElseAction', {
      conditionAction: wrapper([
        meta('Conditions.CheckTargetAngle', {
          origin: targetFixture('Target'),
          target: targetFixture('Owner'),
          angleType: 'TargetForward',
          angle: scalarFixture(180),
        }),
      ]),
      succeedActions: wrapper([
        meta('ModifyDynamicBlackboard', {
          key: 'unused_angle',
          operation: 'Assign',
          directValue: true,
          value: scalarFixture(1),
          calculationTarget: targetFixture('Owner'),
          calculateType: 'HpRatio',
        }),
        gain(1),
      ]),
      failActions: wrapper([
        meta('ModifyDynamicBlackboard', {
          key: 'unused_angle',
          operation: 'Assign',
          directValue: true,
          value: scalarFixture(0),
          calculationTarget: targetFixture('Owner'),
          calculateType: 'HpRatio',
        }),
        gain(1),
      ]),
      alwaysNext: true,
    });
    const value = activeWithActions([branch]);
    value.blackboard = [{ key: 'unused_angle', valueDouble: 0, valueStr: '', isDynamic: true }];
    const compile = () =>
      compileActiveSkillRuntimeProjectionSource({
        value,
        sourcePath: 'active.angle',
        patch: null,
        context: ACTIVE_CONTEXT,
      });
    const compiled = optimizeResourceGraphs(compile(), 'apply').value;
    const equivalent = readResourceActions(compiled, compiled.scheduledSequences[0]!.sequence)[0]!;
    if (equivalent.kind !== 'ifElse') throw new Error('expected preserved native call boundary');
    expect(equivalent.condition).toEqual({
      kind: 'checkActionResult',
      action: { $sequence: null },
    });
    expect(readResourceActions(compiled, equivalent.whenTrue)).toEqual([
      { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
    ]);
    expect(equivalent.whenFalse).toEqual(equivalent.whenTrue);
    branch.failActions = wrapper([gain(0.75)]);
    const different = optimizeResourceGraphs(compile(), 'apply').value;
    const retained = readResourceActions(different, different.scheduledSequences[0]!.sequence)[0]!;
    if (retained.kind !== 'ifElse') throw new Error('expected retained angle branch');
    expect(retained.condition).toMatchObject({ kind: 'targetFacingAngle' });
  });

  it('周期执行动作保留子序列生命周期，不编译成即时 TickInterval', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('ExecuteIntervalAction', {
          executeEachFrame: false,
          executeInterval: scalarFixture(0.5),
          actionOnExecuting: {
            actionData: [meta('MarkCanDash', {})],
            onlyExecuteWhenSourceIsMainChar: false,
            onlyExecuteWhenSourceIsGuard: false,
          },
        }),
      ]),
      sourcePath: 'active.interval',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toEqual([
      {
        kind: 'repeatEachTick',
        parameters: { nativeExecuteInterval: { executeEachFrame: false, intervalSeconds: 0.5 } },
        body: graphBranch(result.actionGraph!.main, [
          { kind: 'markCurrentSkillCanDash', parameters: {} },
        ]),
      },
    ]);
  });

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
      sequence: graphBranch(
        result.actionGraph!.main,
        [{ kind: 'hideUi', parameters: { onlyBlockInput } }],
        true,
      ),
    });
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
    const projectedResult = project();
    expect(
      readResourceActions(projectedResult, projectedResult.scheduledSequences.at(-1)!.sequence),
    ).toMatchObject([
      {
        kind: 'mergeContextTargets',
        parameters: { saveToContextKey: 'tar', sources: [{ kind: 'target', target: 'enemy' }] },
      },
      {
        kind: 'copyContextTargets',
        parameters: {
          source: { kind: 'context', key: 'tar' },
          excludeTargets: { kind: 'inputTarget' },
          saveToContextKey: 'tar',
        },
      },
      {
        kind: 'checkCondition',
        parameters: {
          condition: {
            kind: 'entityCountCompare',
            target: { kind: 'context', key: 'tar' },
            value: 1,
          },
        },
      },
      { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
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
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toMatchObject([
      { kind: 'mergeContextTargets', parameters: { saveToContextKey: 'tar' } },
      { kind: 'mergeContextTargets', parameters: { saveToContextKey: 'tar01' } },
      {
        kind: 'checkCondition',
        parameters: {
          condition: {
            kind: 'entityCountCompare',
            target: { kind: 'fixed', target: 'enemy' },
            value: 1,
          },
        },
      },
      { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
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
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence).at(-1)).toEqual({
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
    expect(collectCombatInvisiblePresentationAssignmentKeys([sequence], () => false)).toEqual(
      new Set(),
    );
    expect(
      collectCombatInvisiblePresentationAssignmentKeys([sequence], key => key === 'camera_side'),
    ).toEqual(new Set(['camera_side']));
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
                      actions: [
                        leaf('condition', {
                          kind: 'twoDirectionAngle',
                          dir1Source: parseTargetReferenceSource(targetFixture('Owner'), 'fixture'),
                          dir1Target: parseTargetReferenceSource(
                            targetFixture('Target'),
                            'fixture',
                          ),
                          dir2Source: parseTargetReferenceSource(targetFixture('Owner'), 'fixture'),
                          dir2Target: parseTargetReferenceSource(
                            targetFixture('Target'),
                            'fixture',
                          ),
                        }),
                      ],
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
    expect(
      collectCombatInvisiblePresentationAssignmentKeys([sequence], key => key !== 'camera_angle'),
    ).toEqual(new Set());
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
    const bypass = result.switchToBuffCast;
    expect(bypass && { ...bypass, sequence: bypass.sequence }).toEqual({
      currentSkillTypes: ['battleSkill', 'ultimate'],
      asSkillCast: false,
      sequence: graphBranch(result.actionGraph!.main, [
        {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_chr_fixture_end' }],
            targets: { kind: 'fixed', target: 'caster' },
            inheritSourceSkillCastInfo: true,
          },
        },
      ]),
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
                checkTarget: { ...targetFixture('Context'), targetGroupKey: 'selected' },
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

    const jump = readResourceActions(result, result.scheduledSequences[0]!.sequence).find(
      action => action.kind === 'jumpTimeline',
    );
    expect(jump?.parameters).toEqual({ destinationFrame: 300 });
    if (jump?.kind !== 'jumpTimeline') throw new Error('missing jump');
    if (jump.condition.kind !== 'checkActionResult') throw new Error('missing result adapter');
    expect(readResourceActions(result, jump.condition.action).map(action => action.kind)).toEqual([
      'invertNextResult',
      'checkCondition',
    ]);
    const check = readResourceActions(result, jump.condition.action)[1];
    if (check?.kind !== 'checkCondition') throw new Error('missing condition');
    expect(check.parameters).toMatchObject({
      condition: {
        kind: 'contextTargetIdentityMatch',
        selection: 'first',
        contextKey: 'selected',
        other: 'controlledOperator',
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

    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toEqual([
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

  it('中断目标当前技能不替换成结束调用者时间线', () => {
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
        sequence: graphBranch(
          result.actionGraph!.main,
          [{ kind: 'interruptCurrentSkill', parameters: { targets: { kind: 'owner' } } }],
          true,
        ),
      },
    ]);
  });

  it('普通公共序列允许中断动作及其后续动作', () => {
    const graph = createActionGraphBuilder<CompiledBuffStepSource>();
    const entry = compileCombatActionSequenceSource(
      parseKnownNativeActionSequenceSource(
        seq([interruptCurrentSkill(), assign('after_interrupt')]),
        'fixture.sequence',
        {},
      ),
      { ...ACTIVE_CONTEXT, graph },
    );
    expect(entry).toEqual(
      graphBranch(
        graph.finish(),
        [
          { kind: 'interruptCurrentSkill', parameters: { targets: { kind: 'owner' } } },
          {
            kind: 'modifyActionValue',
            parameters: {
              key: 'after_interrupt',
              operation: 'assign',
              value: { kind: 'constant', value: 100 },
            },
          },
        ],
        true,
      ),
    );
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
  it('能力实体可能复制整个黑板时，保留技能局部赋值', () => {
    const value = activeWithActions([
      meta('ModifyDynamicBlackboard', {
        key: 'entity_input',
        operation: 'Assign',
        directValue: true,
        value: scalarFixture(7),
        calculationTarget: targetFixture('Owner'),
        calculateType: 'HpRatio',
      }),
      spawnAbilityEntity('spawned'),
    ]);
    value.blackboard = [{ key: 'entity_input', valueDouble: 0, valueStr: '', isDynamic: true }];
    const graph = parseKnownSkillActionGraphSource(value, 'local.export', {});
    expect([...collectUnconsumedSkillLocalKeys(graph, value)]).toEqual([]);
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

    expect(
      readResourceActions(withoutEvidence, withoutEvidence.scheduledSequences[0]!.sequence)[0],
    ).toMatchObject({
      kind: 'checkCondition',
      parameters: {
        condition: {
          left: { kind: 'blackboard', key: 'EntityBB_Combo_qte_proto_use' },
        },
      },
    });
    const replacementGuard = readResourceActions(
      withEvidence,
      withEvidence.scheduledSequences[0]!.sequence,
    )[0]!;
    if (replacementGuard.kind !== 'ifElse') throw new Error('expected native IfElse guard');
    expect(replacementGuard.condition).toMatchObject({
      left: { kind: 'blackboard', key: 'EntityBB_Combo_QTE_Trigger' },
    });
  });
  it('移除无人消费的角度检查和后续变量写入', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([angle(), emptyAngleBranch(), assign('input_angle')]),
      sourcePath: 'fixture',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(result.scheduledSequences).toEqual([]);
  });
  it('角度仍流向有效数值时拒绝，跨调度读取也不能绕过', () => {
    const value = activeWithActions([angle()]);
    const group = value.actionGroupData as { timelineActions: Record<string, unknown>[] };
    group.timelineActions.push({
      ...group.timelineActions[0],
      _startFrame: 8,
      _sequenceActionData: seq([
        assign('attack_scale', scalarFixture(0, 'input_angle')),
        meta('CompareFloat', {
          valueA: scalarFixture(0, 'attack_scale'),
          compare: 'GT',
          valueB: scalarFixture(0),
        }),
        meta('GainBreakingAttackAtb', {
          source: targetFixture('Source'),
          target: targetFixture('Target'),
          factor: scalarFixture(1),
        }),
      ]),
    });
    const compiled = compileActiveSkillRuntimeProjectionSource({
      value,
      sourcePath: 'fixture',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(() => extractResourceDataNodes(compiled.actionGraph!)).toThrow(
      'direction angle still affects combat and cannot be published',
    );
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
    const takeDamageResult = compile('OnBeforeTakeDamage');
    expect(
      readResourceActions(takeDamageResult, takeDamageResult.scheduledSequences[0]!.sequence),
    ).toEqual([
      {
        kind: 'listenForCombatEvents',
        parameters: {
          responses: [
            {
              key: 'fixture.actionGroupData.timelineActions[0]._sequenceActionData.actionData[0].abilityActionMap[0].actions[0]',
              event: { kind: 'operatorHit' },
              phase: 'dataAction',
              priority: 0,
              sequence: graphBranch(takeDamageResult.actionGraph!.main, []),
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
    const step = readResourceActions(result, result.scheduledSequences[0]!.sequence)[0];
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

    const listenerSteps = readResourceActions(result, result.scheduledSequences[0]!.sequence);
    const listenerStep = listenerSteps[0];
    if (listenerStep?.kind !== 'listenForCombatEvents') throw new Error('missing listener');
    expect(readResourceActions(result, listenerStep.parameters.responses[0]?.sequence)).toEqual([
      {
        kind: 'checkCondition',
        parameters: {
          condition: {
            kind: 'eventDamageFeaturesMatch',
            match: 'exceptAny',
            features: ['dot', 'remainArea'],
          },
        },
      },
      {
        kind: 'jumpTimeline',
        parameters: { destinationFrame: 107 },
        condition: { kind: 'checkActionResult', action: { $sequence: null } },
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
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)[0]).toEqual({
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
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)[0]).toMatchObject({
      kind: 'checkCondition',
      parameters: {
        condition: {
          kind: 'entityCountCompare',
          operator: 'greaterOrEqual',
          value: 1,
        },
      },
    });
  });

  it('已存在的智能目标使近距离分支确定，不编译不可达的距离写入', () => {
    const skill = activeWithActions([
      meta('IfElseAction', {
        conditionAction: seq([
          meta('CheckDistanceCondition', {
            source: targetFixture('Owner'),
            target: targetFixture('Context', undefined, 'smart_target'),
            distance: 9,
            lessThan: true,
            includeTargetRadius: false,
            containsHittableObj: false,
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
          meta('SaveTargetDistanceAction', {
            source: targetFixture('Source'),
            target: targetFixture('MainTarget'),
            bbKey: 'unused_distance',
          }),
        ]),
        alwaysNext: true,
      }),
    ]);
    skill.selectStrategy = 'SelectSmartObject';
    skill.smartTargetSelectStrategy = 'SelectComboSkillTrigger';
    const compile = () =>
      compileActiveSkillRuntimeProjectionSource({
        value: skill,
        sourcePath: 'active.known-distance',
        patch: null,
        context: ACTIVE_CONTEXT,
      });
    const result = compile();
    const branch = readResourceActions(result, result.scheduledSequences[0]!.sequence)[0]!;
    expect(branch.kind).toBe('ifElse');
    if (branch.kind !== 'ifElse') throw new Error('missing branch');
    expect(branch.condition).toEqual({ kind: 'checkActionResult', action: { $sequence: null } });
    expect(readResourceActions(result, branch.whenTrue)).toMatchObject([
      { kind: 'gainFinisherSp' },
    ]);
    expect(readResourceActions(result, branch.whenFalse)).toEqual([]);
    // 相同组名没有入口目标保证时，不得凭名字裁剪另一个分支。
    skill.selectStrategy = 'SelectObject';
    expect(compile).toThrow('unresolved target-distance endpoint');
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

    const staticBranchResult = compileActiveSkillRuntimeProjectionSource({
      value: skill,
      sourcePath: 'active.static-branch',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(
      readResourceActions(staticBranchResult, staticBranchResult.scheduledSequences[0]!.sequence),
    ).toMatchObject([
      {
        kind: 'ifElse',
        condition: { kind: 'checkActionResult', action: { $sequence: null } },
        whenFalse: { $sequence: null },
      },
      {
        kind: 'checkCondition',
        parameters: {
          condition: {
            kind: 'entityCountCompare',
            operator: 'greaterOrEqual',
            value: 1,
          },
        },
      },
      { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
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
    ).toThrow('unaudited single-enemy action target group');
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

    const selfMergeResult = compileActiveSkillRuntimeProjectionSource({
      value: skill,
      sourcePath: 'active.self-merge',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(
      readResourceActions(selfMergeResult, selfMergeResult.scheduledSequences.at(-1)!.sequence),
    ).toMatchObject([
      {
        kind: 'checkCondition',
        parameters: {
          condition: {
            kind: 'entityCountCompare',
            operator: 'greaterOrEqual',
            value: 1,
          },
        },
      },
      { kind: 'gainFinisherSp', parameters: { factor: 1, recipient: 'team' } },
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
      sequence: graphBranch(
        result.actionGraph!.main,
        [
          {
            kind: 'setAbilityEntityRemainingDuration',
            parameters: {
              target: { kind: 'context', key: 'bunshin' },
              value: { kind: 'constant', value: 30 },
            },
          },
        ],
        true,
      ),
    });
    expect(result.scheduledSequences[2]).toMatchObject({
      startFrame: 13,
      sequence: graphBranch(
        result.actionGraph!.main,
        [
          {
            kind: 'finishOwner',
            parameters: { targets: { kind: 'context', key: 'bunshin' } },
          },
        ],
        true,
      ),
    });
  });

  it.each([false, true])('能力实体固定出生点不因导航吸附改变数量（snap=%s）', snapToNavmesh => {
    const spawn = spawnAbilityEntity('fixed-point-entity');
    spawn.bornAt = {
      ...targetFixture('InstantSearch', {
        finderData: {
          $type: 'Beyond.Gameplay.Core.Selector+FixedPointFinder+Data, Gameplay.Beyond',
          positionOffset: { x: 4, y: 0, z: 0 },
          rotationOffset: { x: 0, y: 0, z: 0, w: 1 },
          snapToNavmesh,
          sampleRadius: scalarFixture(3),
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
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)[0]).toMatchObject({
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
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toContainEqual({
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
      value: activeWithActions([
        fixedPoint('anchor'),
        randomPoint,
        entityCount('random-points'),
        meta('GainBreakingAttackAtb', {
          source: targetFixture('Source'),
          target: targetFixture('Target'),
          factor: scalarFixture(1),
        }),
      ]),
      sourcePath: 'active.context-random-point',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toContainEqual({
      kind: 'createSpatialPointTargets',
      parameters: {
        saveToContextKey: 'random-points',
        count: { kind: 'constant', value: 2 },
      },
    });
  });

  it('主控为中心的 PointFinder 保留一个空间点，动态方向目标不冒充其实体身份', () => {
    const enemyQuery = {
      ...fixedPoint('selected'),
      selectorData: {
        finderData: { $type: 'Beyond.Gameplay.Core.Selector+AllEnemyFinder+Data, Gameplay.Beyond' },
        validatorData: [
          {
            $type: 'Beyond.Gameplay.Core.Selector+TagValidator+Data, Gameplay.Beyond',
            query: { queryType: 'HasAny', tags: [{ tagId: gameplayTagIdFromPath('Test/Tag123') }] },
          },
        ],
        postProcessorData: [],
      },
    };
    const point = {
      ...fixedPoint('point'),
      center: 'MainCharacter',
      centerContextKey: 'selected',
      selectorOwner: 'MainCharacter',
      selectorOwnerContextKey: 'selected',
      target: 'ContextTarget',
      contextKey: 'selected',
      selectorData: {
        finderData: {
          $type: 'Beyond.Gameplay.Core.Selector+PointFinder+Data, Gameplay.Beyond',
          positionOffset: { x: scalarFixture(0), y: scalarFixture(0), z: scalarFixture(2.2) },
          rotationOffset: { x: scalarFixture(0), y: scalarFixture(0), z: scalarFixture(0) },
        },
        validatorData: [],
        postProcessorData: [],
      },
    };
    const compile = () =>
      compileActiveSkillRuntimeProjectionSource({
        value: activeWithActions([enemyQuery, point, entityCount('point')]),
        sourcePath: 'active.main-character-point',
        patch: null,
        context: ACTIVE_CONTEXT,
      });
    const result = compile();
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toContainEqual({
      kind: 'createSpatialPointTargets',
      parameters: { saveToContextKey: 'point', count: { kind: 'constant', value: 1 } },
    });
    // 动态组可以为空，所以不能同样归约为必定存在的中心。
    point.center = 'ContextTarget';
    expect(compile).toThrow('unaudited single-enemy action target group');
  });

  it.each(['enemy', 'actionInputTarget'] as const)(
    '部位转主体保留动作输入，不受宿主的 %s 假定和 Target 残留组名影响',
    actionTargetTarget => {
      const result = compileActiveSkillRuntimeProjectionSource({
        value: activeWithActions([
          meta('TargetPostProcessorAction', {
            target: targetFixture('Target', undefined, 'stale'),
            source: targetFixture('Source'),
            centerPos: targetFixture('Target'),
            direction: {
              directionType: 'SourceForward',
              sourceMountPoint: 'None',
              targetMountPoint: 'None',
              customSourceAndTarget: false,
              clampToXZ: true,
              invertDirection: false,
            },
            validatorData: [],
            postProcessorData: [
              {
                $type:
                  'Beyond.Gameplay.Core.Selector+ReplacePartWithMainBody+Data, Gameplay.Beyond',
              },
            ],
            targetGroupKey: 'main-body',
          }),
          meta('FinishOwnerAction', {
            owner: targetFixture('Context', undefined, 'main-body'),
            skipDieDisplay: false,
          }),
        ]),
        sourcePath: 'active.input-main-body',
        patch: null,
        context: { ...ACTIVE_CONTEXT, actionTargetTarget },
      });
      expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toContainEqual({
        kind: 'copyContextTargets',
        parameters: {
          source: { kind: 'inputTarget' },
          saveToContextKey: 'main-body',
          replacePartsWithMainBodies: true,
        },
      });
    },
  );

  it('能力实体未覆盖寿命时不读取 duration 的序列化残留黑板键', () => {
    const spawn = spawnAbilityEntity('default-duration-entity');
    spawn.duration = scalarFixture(0, 'attack_scale');
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([spawn]),
      sourcePath: 'active.default-ability-duration',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)[0]).toMatchObject({
      kind: 'spawnAbilityEntity',
      parameters: { abilityEntityId: 'abilityentity_fixture' },
    });
    expect(
      readResourceActions(result, result.scheduledSequences[0]!.sequence)[0],
    ).not.toHaveProperty('parameters.overrideDurationSeconds');
  });

  it('Both hit-stop 对已证明的实体目标组保留查询身份，不替换成木桩', () => {
    const builder = createActionGraphBuilder<CompiledBuffStepSource>();
    const entry = compileCombatActionSequenceSource(
      parseKnownNativeActionSequenceSource(
        {
          actionData: [
            meta('HitStopAction', {
              affectType: 'Both',
              curveKey: 'char_hard_stop',
              useDirectCurve: false,
              directCurve: [],
              duration: 0.15,
              timeDilationPriority: { tagId: -2059842104 },
              attacker: targetFixture('Source'),
              target: { ...targetFixture('Context'), targetGroupKey: 'projectiles' },
            }),
          ],
          onlyExecuteWhenSourceIsMainChar: false,
          onlyExecuteWhenSourceIsGuard: false,
        },
        'active',
        {},
      ),
      {
        ...ACTIVE_CONTEXT,
        graph: builder,
        staticAbilityEntityTargetGroupKeys: new Set(['projectiles']),
      },
      new Set(),
      { resolveTimeDilationPriority: () => 10 },
    );
    expect(readActionGraphChain(builder.finish(), entry)[0]).toMatchObject({
      kind: 'startTimeDilation',
      parameters: {
        targets: ['caster'],
        abilityEntityTargets: [{ kind: 'context', contextKey: 'projectiles' }],
      },
    });
  });

  // 这些输入分别改变接收者身份；不是枚举同一映射的所有取值。
  it.each([
    {
      name: '双方：Source',
      affectType: 'Both',
      attacker: 'Source',
      target: 'Target',
      targets: ['enemy', 'caster'],
    },
    {
      name: '双方：Owner',
      affectType: 'Both',
      attacker: 'Owner',
      target: 'Target',
      targets: ['enemy', 'caster'],
    },
    {
      name: '仅施法者，忽略目标与内联曲线残值',
      affectType: 'OnlyAttacker',
      attacker: 'Source',
      target: 'Source',
      targets: ['caster'],
    },
    {
      name: '仅当前主控',
      affectType: 'OnlyAttacker',
      attacker: 'MainCharacter',
      target: 'Context',
      targets: ['controlled'],
    },
  ])('命中停顿保留实体时间域和实际目标：$name', ({ affectType, attacker, target, targets }) => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('HitStopAction', {
          affectType,
          curveKey: 'char_hard_stop',
          useDirectCurve: false,
          directCurve: [{ serialized: 'inactive residual' }],
          duration: 0.15,
          timeDilationPriority: { tagId: -2059842104 },
          attacker: targetFixture(attacker),
          target: targetFixture(target, undefined, target === 'Context' ? 'unresolved' : undefined),
        }),
      ]),
      sourcePath: 'active.hit-stop',
      patch: null,
      context: ACTIVE_CONTEXT,
      extensions: { resolveTimeDilationPriority: tagId => (tagId === -2059842104 ? 10 : NaN) },
    });
    expect(result.scheduledSequences).toHaveLength(1);
    expect(result.scheduledSequences[0]).toMatchObject({ startFrame: 5, endFrame: 8 });
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toEqual([
      {
        kind: 'startTimeDilation',
        parameters: {
          scope: 'entity',
          durationSeconds: { kind: 'constant', value: 0.15 },
          slot: 'TimeDilation/Layer/Entity/HitStop',
          priority: 10,
          curve: { kind: 'named', key: 'char_hard_stop' },
          finishByAction: false,
          targets,
        },
      },
    ]);
  });

  it('DoOnce 可以按局部值选择一次命中停顿，不能因 Switch 包装而拒绝', () => {
    const body = {
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
      actionData: [
        meta('HitStopAction', {
          affectType: 'Both',
          curveKey: 'char_hard_stop',
          useDirectCurve: false,
          directCurve: [],
          duration: 0.4,
          timeDilationPriority: { tagId: -2059842104 },
          attacker: targetFixture('Source'),
          target: targetFixture('Target'),
        }),
      ],
    };
    const value = activeWithActions([
      meta('DoOnceAction', {
        sequenceActionData: {
          onlyExecuteWhenSourceIsMainChar: false,
          onlyExecuteWhenSourceIsGuard: false,
          actionData: [
            meta('SwitchAction', {
              choice: scalarFixture(0, 'block_count'),
              alwaysNext: true,
              options: [{ value: scalarFixture(1), actionData: body }],
            }),
          ],
        },
      }),
    ]);
    value.blackboard = [{ key: 'block_count', valueDouble: 1, valueStr: '', isDynamic: true }];
    const result = compileActiveSkillRuntimeProjectionSource({
      value,
      sourcePath: 'once.switch',
      patch: null,
      context: ACTIVE_CONTEXT,
      extensions: { resolveTimeDilationPriority: () => 10 },
    });
    const onceSteps = readResourceActions(result, result.scheduledSequences[0]!.sequence);
    expect(onceSteps).toHaveLength(1);
    const once = onceSteps[0]!;
    expect(once.kind).toBe('once');
    if (once.kind !== 'once') throw new Error('expected once step');
    const branches = readResourceActions(result, once.body);
    expect(branches).toHaveLength(1);
    const selected = branches[0]!;
    expect(selected.kind).toBe('switch');
    if (selected.kind !== 'switch') throw new Error('expected switch step');
    expect(readResourceActions(result, selected.options[0]!.sequence)).toMatchObject([
      {
        kind: 'startTimeDilation',
        parameters: { durationSeconds: { kind: 'constant', value: 0.4 } },
      },
    ]);
  });

  it.each(['keys', 'curve'])('内联 hit-stop 恢复无穷切线，支持 %s 导出格式', format => {
    const curveKey = (time: number, value: number, inTangent: number | string) => ({
      time,
      value,
      inTangent,
      outTangent: 0,
      inWeight: 0,
      outWeight: 0,
      weightedMode: 0,
    });
    const keys = [curveKey(0, 1, 0), curveKey(1, 0.02, 'Infinity')];
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('HitStopAction', {
          affectType: 'OnlyAttacker',
          curveKey: 'unused',
          useDirectCurve: true,
          directCurve: format === 'keys' ? keys : { keys, preWrapMode: 8, postWrapMode: 8 },
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
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)[0]).toMatchObject({
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

    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toEqual([
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

    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toEqual([
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

    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toEqual([
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

    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toEqual([
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

  it('实体自身忽略全局时间流速使用当前宿主，不能误用于干员 Owner', () => {
    const input = {
      value: activeWithActions([
        meta('SetIgnoreGlobalTimeScaleAction', {
          targetSettings: targetFixture('Owner'),
          ignoreGlobalTimeScale: true,
          revertOnEnd: true,
        }),
      ]),
      sourcePath: 'active.self-ignore',
      patch: null,
      extensions: {},
    };
    const result = compileActiveSkillRuntimeProjectionSource({
      ...input,
      context: { ...ACTIVE_CONTEXT, actionOwnerTarget: 'currentAbilityEntity' },
    });
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toEqual([
      {
        kind: 'setIgnoreGlobalTimeScale',
        parameters: {
          abilityEntityTargets: [{ kind: 'current' }],
          ignore: true,
          revertOnEnd: true,
        },
      },
    ]);
    expect(() =>
      compileActiveSkillRuntimeProjectionSource({ ...input, context: ACTIVE_CONTEXT }),
    ).toThrow('unsupported global-time-scale ignore target');
  });

  it('空合并显式覆盖目标组，不因没有输入而省略写入', () => {
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([
        meta('MergeTargetAction', {
          targets: [],
          targetGroupKey: 'cleared',
          mergeHittableTargets: false,
        }),
      ]),
      sourcePath: 'active.empty-merge',
      patch: null,
      context: { ...ACTIVE_CONTEXT, actionOwnerTarget: 'currentAbilityEntity' },
      extensions: {},
    });
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toEqual([
      { kind: 'mergeContextTargets', parameters: { saveToContextKey: 'cleared', sources: [] } },
    ]);
  });

  it('敌人标签筛选保留动态查询，仅省略常量正生命门禁', () => {
    const health = {
      $type: 'Beyond.Gameplay.Core.Selector+CurHpRatioValidator+Data, Gameplay.Beyond',
      compareType: 'GT',
      value: scalarFixture(0),
    };
    const query = {
      ...fixedPoint('selected'),
      center: 'MainCharacter',
      selectorOwner: 'MainCharacter',
      selectorData: {
        finderData: { $type: 'Beyond.Gameplay.Core.Selector+AllEnemyFinder+Data, Gameplay.Beyond' },
        validatorData: [
          {
            $type: 'Beyond.Gameplay.Core.Selector+TagValidator+Data, Gameplay.Beyond',
            query: { queryType: 'HasAny', tags: [{ tagId: gameplayTagIdFromPath('Test/Tag123') }] },
          },
          health,
        ],
        postProcessorData: [],
      },
    };
    const compile = () =>
      compileActiveSkillRuntimeProjectionSource({
        value: activeWithActions([
          query,
          meta('TargetPostProcessorAction', {
            target: targetFixture('Context', undefined, 'selected'),
            source: targetFixture('Source'),
            centerPos: targetFixture('Target'),
            direction: {
              directionType: 'SourceForward',
              sourceMountPoint: 'None',
              targetMountPoint: 'None',
              customSourceAndTarget: false,
              clampToXZ: true,
              invertDirection: false,
            },
            validatorData: [],
            postProcessorData: [
              {
                $type:
                  'Beyond.Gameplay.Core.Selector+ReplacePartWithMainBody+Data, Gameplay.Beyond',
              },
            ],
            targetGroupKey: 'selected',
          }),
          meta('SaveBuffLifeTime', {
            buffOwner: targetFixture('Context', undefined, 'selected'),
            buffSettings: {
              checkType: 'Id',
              buffIdList: ['buff_fixture'],
              tagQuery: { queryType: 'HasAny', tags: [] },
            },
            key: 'remaining',
          }),
          meta('FinishOwnerAction', {
            owner: targetFixture('Context', undefined, 'selected'),
            skipDieDisplay: false,
          }),
        ]),
        sourcePath: 'active.enemy-tag-health',
        patch: null,
        context: {
          ...ACTIVE_CONTEXT,
          gameplayTagRegistry: fixtureGameplayTagRegistry,
        },
      });
    const result = compile();
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toContainEqual({
      kind: 'findTargets',
      parameters: {
        owner: { kind: 'mainCharacter' },
        query: { kind: 'enemyByTags', tagQueryType: 'hasAny', tags: ['Test/Tag123'] },
        saveToContextKey: 'selected',
      },
    });
    health.value = scalarFixture(0, 'threshold');
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toContainEqual({
      kind: 'readBuffRemainingDuration',
      parameters: {
        target: { kind: 'context', key: 'selected' },
        query: { kind: 'id', buffIds: ['buff_fixture'] },
        outputKey: 'remaining',
      },
    });
    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toContainEqual({
      kind: 'copyContextTargets',
      parameters: { source: { kind: 'context', key: 'selected' }, saveToContextKey: 'selected' },
    });
    expect(compile).toThrow();
  });

  it('当前调度改写目标组后，不能继续套用前序调度的敌人身份', () => {
    const skill = activeWithActions([
      meta('MergeTargetAction', {
        targets: [targetFixture('Target')],
        targetGroupKey: 'selected',
      }),
    ]);
    const group = skill.actionGroupData as { timelineActions: Record<string, unknown>[] };
    group.timelineActions.push({
      ...group.timelineActions[0],
      _startFrame: 10,
      _endFrame: 11,
      _sequenceActionData: seq([
        fixedPoint('selected'),
        meta('FinishOwnerAction', {
          owner: targetFixture('Context', undefined, 'selected'),
          skipDieDisplay: false,
        }),
      ]),
    });
    const result = compileActiveSkillRuntimeProjectionSource({
      value: skill,
      sourcePath: 'active.overwritten-context',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    expect(readResourceActions(result, result.scheduledSequences.at(-1)!.sequence)).toContainEqual({
      kind: 'finishOwner',
      parameters: { targets: { kind: 'context', key: 'selected' } },
    });
  });

  it.each(['ActionOwner', 'ActionSource'] as const)(
    'FinishOwner 保留 %s 查询且只生成一个动作',
    selectorOwner => {
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
        selectorOwner,
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

      expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toEqual([
        {
          kind: 'finishOwner',
          parameters: {
            targets: {
              kind: 'ownerSpawned',
              objectType: 'abilityEntity',
              owner: { kind: selectorOwner === 'ActionOwner' ? 'owner' : 'source' },
              abilityEntityIds: ['abilityentity_matching'],
              sameSourceSkillCast: false,
            },
          },
        },
      ]);
    },
  );

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

    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toMatchObject([
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

  it.each(['Source', 'Owner'] as const)(
    '公共回能 Buff 保留创建、接收者和来源施法信息：%s',
    target => {
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
            targetSettings: targetFixture(target),
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
        context: { ...ACTIVE_CONTEXT, actionOwnerTarget: 'currentAbilityEntity' },
      });
      expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toMatchObject([
        {
          kind: 'applyBuff',
          parameters: {
            buffs: [{ buffId: 'buff_common_obtain_ultimate_sp' }],
            targets: { kind: target === 'Owner' ? 'owner' : 'source' },
            source: { kind: 'source' },
            inheritSourceSkillCastInfo: true,
          },
        },
      ]);
    },
  );

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

    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toMatchObject([
      {
        kind: 'applyBuff',
        parameters: {
          buffs: [{ buffId: 'buff_fixture_entity_child' }],
          targets: { kind: 'owner' },
          source: { kind: 'source' },
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

    expect(readResourceActions(result, result.scheduledSequences[0]!.sequence)).toEqual([
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

    expect(
      readResourceActions(groupedTargetResult, groupedTargetResult.scheduledSequences[0]!.sequence),
    ).toEqual([{ kind: 'gainFinisherSp', parameters: { factor: 0.75, recipient: 'team' } }]);
  });

  it('裁剪无有效回调的动画，战斗回调保留在原生动画动作内', () => {
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
      actionData: [
        meta('FinishOwnerAction', { owner: targetFixture('Owner'), skipDieDisplay: false }),
        meta('Conditions.CheckHp', {
          hpOwner: targetFixture('Target'),
          compare: 'GT',
          isRatio: false,
          value: scalarFixture(0, 'callback_threshold'),
        }),
      ],
    };
    const result = compileActiveSkillRuntimeProjectionSource({
      value: activeWithActions([animation]),
      sourcePath: 'active',
      patch: null,
      context: ACTIVE_CONTEXT,
    });
    const source = parseKnownNativeActionSequenceSource(
      {
        actionData: [animation],
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
      },
      'animation.callback',
      {},
    );
    const reads = collectEnabledNativeActionNodes(source).flatMap(node => [
      ...summarizeNativeBlackboardUsage(node).reads,
    ]);
    expect(reads).toContain('callback_threshold');
    const actions = readResourceActions(result, result.scheduledSequences[0]!.sequence);
    expect(actions).toHaveLength(1);
    const retained = actions[0]!;
    expect(retained.kind).toBe('playAnimation');
    if (retained.kind !== 'playAnimation') throw new Error('missing animation callback');
    const order: string[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: step => {
          order.push(step.kind);
          return true;
        },
        evaluate: () => {
          order.push('check');
          return false;
        },
      },
      { blackboard: new ActionBlackboard() },
    );
    const callback = runtime.createSequence(
      compileGraphSequence(retained.onEnd, result.actionGraph!),
    );
    expect(callback.executeInstant({})).toBe(false);
    expect(order).toEqual(['finishOwner', 'check']);
  });
});
