import {
  collectUnobservedTargetQueryOutputs,
  summarizeNativeTargetUsage,
} from '../../src/compiler/optimization/nativeTargetUsage.ts';
import { collectCombatInvisibleRandomKeys } from '../../src/compiler/optimization/nativePresentationUsage.ts';
import { targetFixture } from '../sourceFixtures.ts';
import { parseTargetReferenceSource } from '../../src/source/target.ts';
import { parseTargetGroupActionSource } from '../../src/source/targetGroup.ts';
import { simplifyNativeSequences } from '../../src/compiler/optimization/nativeSequenceOptimization.ts';
import type { ProjectileLaunchActionSource } from '../../src/source/referenceActions.ts';
import { describe, expect, it } from 'vitest';
import type { KnownNativeActionLeafSource } from '../../src/source/actionLeaf.ts';
import type { NativeSequenceSource } from '../../src/source/controlFlow.ts';
import type { SkillActionGraphSource } from '../../src/source/skillActionGraph.ts';
import {
  collectPresentationSelectionTimelineIndexes,
  collectPresentationOnlyTargetGroups,
  collectMaterializedTargetGroups,
  collectPresentationOnlyBlackboardKeys,
  collectCombatInvisibleRandomBlackboardKeys,
  collectUnconsumedTargetGroups,
} from '../../src/compiler/skills/skillPresentationTargets.ts';
const scalar = (blackboardKey: string | null = null) => ({
  value: 1,
  blackboardKey,
  levelValues: null,
});

it('纯选位查询与空回调一起裁剪，计数有外部消费者或战斗回调则保留', () => {
  const target = parseTargetReferenceSource(targetFixture('Owner'), 'target');
  const make = (storeKey: string, callback: NativeSequenceSource<KnownNativeActionLeafSource>) => {
    const query = sequence({
      family: 'condition',
      action: {
        kind: 'entityCount',
        sourceType: 'CheckEntityNum',
        target: { ...target, targetSource: 'InstantSearch', finderType: 'ShapeFinder' },
        targetSource: 'InstantSearch',
        targetGroupKey: '',
        minimumCount: 0,
        comparison: 'LE',
        containsHittableTarget: false,
        excludeDeadEntity: false,
        storeKey,
      },
    });
    const motion = sequence({
      family: 'spatial',
      action: {
        kind: 'teleport',
        target,
        radius: scalar(),
      },
    }).actions[0]!;
    if (motion.body.kind !== 'leaf') throw new Error('expected leaf');
    return graph([
      {
        ...query,
        actions: [
          ...query.actions,
          {
            ...motion,
            body: {
              kind: 'actionWithCallback',
              value: motion.body.value,
              trigger: 'targetPointInvalid',
              callback,
            },
          },
        ],
      },
    ]);
  };
  expect(collectPresentationSelectionTimelineIndexes(make('', sequence()))).toEqual(new Set([0]));
  const counted = make('shared', sequence());
  expect(collectPresentationSelectionTimelineIndexes(counted)).toEqual(new Set([0]));
  expect(
    collectPresentationSelectionTimelineIndexes(
      graph([counted.actionGroup.timelineActions[0]!.sequence, consumer]),
    ).size,
  ).toBe(0);
  expect(collectPresentationSelectionTimelineIndexes(make('', consumer)).size).toBe(0);
});

it('夹角写入使用公共输出摘要，战斗消费者阻止整条表现时间线裁剪', () => {
  const target = parseTargetReferenceSource(targetFixture('Owner'), 'target');
  const angle = sequence({
    family: 'directionAngle',
    action: {
      kind: 'saveTwoDirectionAngle',
      direction1Source: target,
      direction1Target: target,
      direction1Type: 'CameraForward',
      direction2Source: target,
      direction2Target: target,
      direction2Type: 'SourceToTarget',
      outputKey: 'shared',
    },
  });
  expect(collectPresentationSelectionTimelineIndexes(graph([angle]))).toEqual(new Set([0]));
  expect(collectPresentationSelectionTimelineIndexes(graph([angle, consumer])).size).toBe(0);
  expect(collectPresentationSelectionTimelineIndexes(graph([angle], [consumer])).size).toBe(0);
});
function sequence(
  ...leaves: KnownNativeActionLeafSource[]
): NativeSequenceSource<KnownNativeActionLeafSource> {
  return {
    onlyExecuteWhenSourceIsMainCharacter: false,
    onlyExecuteWhenSourceIsGuard: false,
    actions: leaves.map((value, index) => ({
      sourcePath: `fixture/${index}`,
      metadata: {
        nativeType: 'fixture',
        nativeName: 'fixture',
        enabled: true,
        priorityLevel: 'Default',
        priorityOffset: 0,
        serverActionIndex: index,
      },
      body: { kind: 'leaf', value },
    })),
  };
}
const consumer = sequence({
  family: 'dashEnergyRecovery',
  action: { kind: 'dashEnergyRecovery', amount: scalar('shared'), canRecoverWhenOverdraft: false },
});
const producer = sequence(
  {
    family: 'blackboardCalculation',
    action: {
      kind: 'blackboardCalculation',
      key: 'shared',
      operation: 'Add',
      left: scalar(),
      right: scalar(),
      addend: null,
    },
  },
  { family: 'presentation', action: { kind: 'cameraRotate', readBlackboardKeys: ['shared'] } },
);
function graph(
  sequences: readonly NativeSequenceSource<KnownNativeActionLeafSource>[],
  passive: readonly NativeSequenceSource<KnownNativeActionLeafSource>[] = [],
): SkillActionGraphSource<KnownNativeActionLeafSource> {
  return {
    skillId: 'fixture',
    level: 1,
    durationFrame: 30,
    declaredBlackboard: [],
    actionGroup: {
      timelineActions: sequences.map(sequence => ({
        startFrame: 0,
        endFrame: 30,
        sequence,
        forceSyncAnimation: { forceSync: false, montageName: '', targetFrame: 0, playbackSpeed: 1 },
      })),
      passiveEvents: passive.length ? [{ abilityEvent: 'fixture', actions: passive }] : [],
    },
  };
}
function projectile(assignBlackboard: boolean): ProjectileLaunchActionSource {
  const target = parseTargetReferenceSource(targetFixture('Source'), 'fixture');
  const zero = [0, 0, 0] as const;
  return {
    kind: 'projectileLaunch',
    projectileId: 'projectile',
    projectileSkillId: 'callback',
    projectileSource: target,
    syncTimeScale: false,
    assignBlackboard,
    assignEntityBlackboard: false,
    assignments: [],
    emitPosition: target,
    emitMountPoint: '',
    useWeaponMountPoint: false,
    weaponIndex: 0,
    weaponMountPoint: 0,
    overrideEmitBone: false,
    emitPositionFixedOffset: zero,
    emitPositionForwardMode: 'World',
    emitPositionRandomOffset: zero,
    target,
    targetFilterMode: 'None',
    targetFilterSettings: null,
    alsoLaunchToHittableTarget: false,
    overrideHitBone: false,
    hitMountPoint: '',
    hitBoneFixedOffset: zero,
    hitBoneForwardMode: 'World',
    hitBoneRandomOffset: zero,
    presetPoints: [],
    callbacks: [],
  };
}
describe('来源裁剪的跨入口消费者', () => {
  it('纯表现分支仅在无副作用且总是继续时删除，随机输入随消费者消失', () => {
    const random = sequence({
      family: 'randomBlackboard',
      action: {
        kind: 'randomBlackboardWrite',
        randomType: 'Int',
        minimum: scalar(),
        maximum: scalar(),
        targetKey: 'shared',
      },
    });
    const source: NativeSequenceSource<KnownNativeActionLeafSource> = {
      ...random,
      actions: [
        ...random.actions,
        {
          ...random.actions[0]!,
          body: {
            kind: 'switch',
            choice: scalar('shared'),
            alwaysNext: true,
            options: [
              {
                value: scalar(),
                action: sequence({ family: 'presentation', action: { kind: 'cameraRotate' } }),
              },
            ],
          },
        },
      ],
    };
    const conditional: NativeSequenceSource<KnownNativeActionLeafSource> = {
      ...source,
      actions: [
        {
          ...random.actions[0]!,
          body: {
            kind: 'ifElse',
            alwaysNext: true,
            condition: sequence(),
            whenTrue: sequence({ family: 'presentation', action: { kind: 'cameraRotate' } }),
            whenFalse: sequence(),
          },
        },
      ],
    };
    expect(simplifyNativeSequences(conditional).actions).toHaveLength(0);
    // 无战斗副作用的调用仍可能是 NotNext 的返回值消费者，不能让反转移到后继。
    for (const branch of [conditional.actions[0]!, source.actions[1]!]) {
      const inverted: NativeSequenceSource<KnownNativeActionLeafSource> = {
        ...conditional,
        actions: [{ ...branch, body: { kind: 'negateNextResult' } }, branch, ...consumer.actions],
      };
      const retained = simplifyNativeSequences(inverted);
      expect(retained.actions.map(node => node.body.kind)).toEqual(
        inverted.actions.map(node => node.body.kind),
      );
    }
    const conditionalNode = conditional.actions[0]!;
    if (conditionalNode.body.kind !== 'ifElse') throw new Error('expected ifElse');
    for (const body of [
      { ...conditionalNode.body, alwaysNext: false },
      { ...conditionalNode.body, condition: consumer },
      { ...conditionalNode.body, whenTrue: consumer },
      {
        ...conditionalNode.body,
        whenTrue: sequence({ family: 'presentation', action: { kind: 'passiveUiValue' } }),
      },
    ]) {
      expect(
        simplifyNativeSequences({
          ...conditional,
          actions: [{ ...conditionalNode, body }],
        }).actions,
      ).toHaveLength(1);
    }
    const pruned = simplifyNativeSequences(source);
    expect(pruned.actions).toHaveLength(1);
    expect(collectCombatInvisibleRandomBlackboardKeys(graph([pruned])).has('shared')).toBe(true);
    const branch = source.actions[1]!;
    if (branch.body.kind !== 'switch') throw new Error('expected switch');
    const visibleUi = {
      ...source,
      actions: [
        source.actions[0]!,
        {
          ...branch,
          body: {
            ...branch.body,
            options: [
              {
                value: scalar(),
                action: sequence({ family: 'presentation', action: { kind: 'passiveUiValue' } }),
              },
            ],
          },
        },
      ],
    };
    expect(simplifyNativeSequences(visibleUi).actions).toHaveLength(2);
    expect(
      collectPresentationSelectionTimelineIndexes(
        graph([sequence({ family: 'presentation', action: { kind: 'passiveUiValue' } })]),
      ).size,
    ).toBe(0);
    const returnsResult = {
      ...source,
      actions: [source.actions[0]!, { ...branch, body: { ...branch.body, alwaysNext: false } }],
    };
    expect(simplifyNativeSequences(returnsResult).actions).toHaveLength(2);
    const effective = {
      ...source,
      actions: [
        source.actions[0]!,
        { ...branch, body: { ...branch.body, options: [{ value: scalar(), action: consumer }] } },
      ],
    };
    expect(
      collectCombatInvisibleRandomBlackboardKeys(graph([simplifyNativeSequences(effective)])).has(
        'shared',
      ),
    ).toBe(false);
  });

  it('同名事件不是变量读取，实际变量消费者仍保护写入', () => {
    const namedEvent = sequence({
      family: 'eventListener',
      action: {
        kind: 'eventListener',
        events: [{ abilityEvent: 'shared', actions: [consumer] }],
      },
    });
    const unrelatedEvent = sequence({
      family: 'eventListener',
      action: {
        kind: 'eventListener',
        events: [{ abilityEvent: 'shared', actions: [] }],
      },
    });
    expect(
      collectPresentationOnlyBlackboardKeys(graph([producer], [unrelatedEvent])).has('shared'),
    ).toBe(true);
    expect(
      collectPresentationSelectionTimelineIndexes(graph([producer], [unrelatedEvent])).has(0),
    ).toBe(true);
    expect(
      collectPresentationOnlyBlackboardKeys(graph([producer], [namedEvent])).has('shared'),
    ).toBe(false);
    expect(
      collectPresentationSelectionTimelineIndexes(graph([producer], [namedEvent])).has(0),
    ).toBe(false);
    const disabledEvent = {
      ...namedEvent,
      actions: namedEvent.actions.map(node => ({
        ...node,
        metadata: { ...node.metadata, enabled: false },
      })),
    };
    expect(
      collectPresentationSelectionTimelineIndexes(graph([producer], [disabledEvent])).has(0),
    ).toBe(true);
  });

  it('表现调度中的无用末端写入可裁剪，有效消费者与调度排列无关', () => {
    const writesLast = { ...producer, actions: [...producer.actions].reverse() };
    expect(collectPresentationSelectionTimelineIndexes(graph([writesLast]))).toEqual(new Set([0]));
    expect(collectPresentationSelectionTimelineIndexes(graph([writesLast, consumer])).size).toBe(0);
    expect(collectPresentationSelectionTimelineIndexes(graph([consumer, writesLast])).size).toBe(0);
    expect(collectPresentationSelectionTimelineIndexes(graph([writesLast], [consumer])).size).toBe(
      0,
    );
  });

  it('等价多动作分支只删除纯条件，保留原生返回边界和条件写入', () => {
    const branch = { ...consumer, actions: [...consumer.actions, ...consumer.actions] };
    const whenFalse = {
      ...branch,
      actions: branch.actions.map(node => ({
        ...node,
        sourcePath: `other/${node.sourcePath}`,
        metadata: { ...node.metadata, serverActionIndex: node.metadata.serverActionIndex + 10 },
      })),
    };
    const node = {
      ...consumer.actions[0]!,
      body: {
        kind: 'ifElse' as const,
        alwaysNext: false,
        condition: sequence({
          family: 'condition',
          action: {
            kind: 'mainOperator',
            sourceType: 'CheckMainCharacterCondition',
            target: parseTargetReferenceSource(targetFixture('Source'), 'checkTarget'),
          },
        }),
        whenTrue: branch,
        whenFalse,
      },
    };
    const result = simplifyNativeSequences({ ...consumer, actions: [node] });
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]!.body).toEqual({
      ...node.body,
      condition: sequence(),
    });
    const writesCondition = {
      ...consumer,
      actions: [{ ...node, body: { ...node.body, condition: producer } }],
    };
    expect(simplifyNativeSequences(writesCondition)).toEqual(writesCondition);
  });
  it('选点输出追踪到有效消费者，目标组不受黑板继承影响', () => {
    const selected = parseTargetReferenceSource(
      targetFixture('Context', undefined, 'point'),
      'fixture',
    );
    const selection = sequence(
      {
        family: 'spatial',
        action: {
          kind: 'teleportPositionSelection',
          target: parseTargetReferenceSource(targetFixture('Target'), 'fixture'),
          teleportType: 'FixedDistance',
          excludeCurrentPosition: false,
          distance: scalar(),
          useAddScoreToPreviousSide: false,
          forwardDistance: scalar(),
          outputContextKey: 'point',
        },
      },
      { family: 'spatial', action: { kind: 'teleport', target: selected, radius: scalar() } },
    );
    const launch = sequence({ family: 'projectile', action: projectile(true) });
    expect(collectPresentationSelectionTimelineIndexes(graph([selection, launch]))).toEqual(
      new Set([0]),
    );
    const effectiveReader = sequence(
      {
        family: 'condition',
        action: {
          kind: 'entityCount',
          sourceType: 'CheckEntityNum',
          target: selected,
          targetSource: 'Context',
          targetGroupKey: 'point',
          minimumCount: 1,
          comparison: 'GE',
          containsHittableTarget: false,
          excludeDeadEntity: false,
          storeKey: '',
        },
      },
      {
        family: 'dashEnergyRecovery',
        action: { kind: 'dashEnergyRecovery', amount: scalar(), canRecoverWhenOverdraft: false },
      },
    );
    expect(
      collectPresentationSelectionTimelineIndexes(graph([selection, effectiveReader, launch])).size,
    ).toBe(0);
  });
  it.each([false, true])('投射物整板继承=%s 时，只在不传出黑板的情况下裁剪局部值', inherited => {
    const launch = sequence({ family: 'projectile', action: projectile(inherited) });
    const source = graph([producer], [launch]);
    expect(collectPresentationSelectionTimelineIndexes(source).has(0)).toBe(!inherited);
    const random = sequence({
      family: 'randomBlackboard',
      action: {
        kind: 'randomBlackboardWrite',
        randomType: 'Float',
        minimum: scalar(),
        maximum: scalar(),
        targetKey: 'shared',
      },
    });
    expect(
      collectCombatInvisibleRandomBlackboardKeys(graph([random], [launch])).has('shared'),
    ).toBe(!inherited);
  });
  it('实体赋值仅在启用且读取变量时保护随机写入', () => {
    const random = sequence({
      family: 'randomBlackboard',
      action: {
        kind: 'randomBlackboardWrite',
        randomType: 'Float',
        minimum: scalar(),
        maximum: scalar(),
        targetKey: 'shared',
      },
    });
    for (const assignEntityBlackboard of [false, true]) {
      for (const useDirectValue of [false, true]) {
        const launch = sequence({
          family: 'projectile',
          action: {
            ...projectile(false),
            assignEntityBlackboard,
            assignments: [
              {
                targetKey: 'EntityBB_Value',
                inputValueKey: 'shared',
                useDirectValue,
                valueType: 'Numeric',
                numericValue: 1,
                stringValue: '',
              },
            ],
          },
        });
        expect(collectCombatInvisibleRandomKeys([random, launch], () => true).has('shared')).toBe(
          !assignEntityBlackboard || useDirectValue,
        );
        const simplified = simplifyNativeSequences(launch, key => key === 'EntityBB_Value');
        expect(
          collectCombatInvisibleRandomKeys([random, simplified], () => true).has('shared'),
        ).toBe(true);
        expect(simplifyNativeSequences(launch, () => false)).toEqual(launch);
      }
    }
  });

  it('整板继承只裁剪外部闭包已证明无用的键，并追踪派生输出', () => {
    const random = sequence({
      family: 'randomBlackboard',
      action: {
        kind: 'randomBlackboardWrite',
        randomType: 'Float',
        minimum: scalar(),
        maximum: scalar(),
        targetKey: 'shared',
      },
    });
    const launch = sequence({ family: 'projectile', action: projectile(true) });
    const unused = (key: string) => key === 'shared';
    // 同样的局部序列，在外部可见性未知时不能删除；其他入口读取也必须保留。
    expect(collectCombatInvisibleRandomKeys([random], () => false).size).toBe(0);
    expect(collectCombatInvisibleRandomKeys([random], unused)).toEqual(new Set(['shared']));
    expect(collectCombatInvisibleRandomKeys([random, consumer], unused).size).toBe(0);

    expect(collectCombatInvisibleRandomBlackboardKeys(graph([random, launch]), unused)).toEqual(
      new Set(['shared']),
    );
    expect(collectPresentationSelectionTimelineIndexes(graph([producer, launch]), unused)).toEqual(
      new Set([0]),
    );
    expect(
      collectPresentationSelectionTimelineIndexes(graph([producer, launch]), () => false).size,
    ).toBe(0);
    const calculation = sequence({
      family: 'blackboardCalculation',
      action: {
        kind: 'blackboardCalculation',
        key: 'externalResult',
        operation: 'Add',
        left: scalar('shared'),
        right: scalar(),
        addend: null,
      },
    });
    expect(
      collectCombatInvisibleRandomBlackboardKeys(graph([random, calculation, launch]), unused).size,
    ).toBe(0);
  });
  it('显式传给投射物的随机输入必须等待回调消费者分析', () => {
    const random = sequence({
      family: 'randomBlackboard',
      action: {
        kind: 'randomBlackboardWrite',
        randomType: 'Float',
        minimum: scalar(),
        maximum: scalar(),
        targetKey: 'shared',
      },
    });
    const launch = sequence({
      family: 'projectile',
      action: {
        ...projectile(false),
        assignEntityBlackboard: true,
        assignments: [
          {
            targetKey: 'EntityBB_result',
            inputValueKey: 'shared',
            useDirectValue: false,
            valueType: 'Float',
            numericValue: 0,
            stringValue: '',
          },
        ],
      },
    });
    expect(collectCombatInvisibleRandomBlackboardKeys(graph([random, launch])).size).toBe(0);
    expect(
      collectCombatInvisibleRandomBlackboardKeys(graph([random, launch]), () => true).size,
    ).toBe(0);
  });

  it.each(['earlier', 'later', 'passive'] as const)(
    '保留由 %s 入口消费的镜头计算结果',
    location => {
      const source =
        location === 'passive'
          ? graph([producer], [consumer])
          : graph(location === 'earlier' ? [consumer, producer] : [producer, consumer]);
      expect(collectPresentationSelectionTimelineIndexes(source).size).toBe(0);
      expect(collectPresentationOnlyBlackboardKeys(source).has('shared')).toBe(false);
      expect(collectPresentationSelectionTimelineIndexes(graph([producer]))).toEqual(new Set([0]));
    },
  );
  it('被动事件读取的随机数不能作为无消费者随机值裁掉', () => {
    const random = sequence({
      family: 'randomBlackboard',
      action: {
        kind: 'randomBlackboardWrite',
        randomType: 'Float',
        minimum: scalar(),
        maximum: scalar(),
        targetKey: 'shared',
      },
    });
    expect(
      collectCombatInvisibleRandomBlackboardKeys(graph([random], [consumer])).has('shared'),
    ).toBe(false);
    expect(collectCombatInvisibleRandomBlackboardKeys(graph([random])).has('shared')).toBe(true);
    const point = sequence({
      family: 'targetGroup',
      action: {
        ...parseTargetGroupActionSource(
          {
            $type: 'Beyond.Gameplay.Core.MergeTargetAction+Data, Gameplay.Beyond',
            isEnable: true,
            priorityLevel: 'Default',
            priorityOffset: 0,
            serverActionIndex: 0,
            targetGroupKey: 'point',
            targets: [],
          },
          'point',
        )!,
        producerType: 'FindTargetAction',
        finderType: 'PointFinder',
        finderPointBlackboardKeys: ['shared'],
      },
    });
    expect(collectCombatInvisibleRandomBlackboardKeys(graph([random, point])).has('shared')).toBe(
      true,
    );
    const pointNode = point.actions[0]!;
    if (pointNode.body.kind !== 'leaf' || pointNode.body.value.family !== 'targetGroup')
      throw new Error('expected target query');
    const converted = sequence({
      family: 'targetGroup',
      action: {
        ...pointNode.body.value.action,
        producerType: 'ConvertToTargetContext',
        conversionOperation: 'ConvertEntityToPosition',
        conversionSource: parseTargetReferenceSource(targetFixture('Owner'), 'owner'),
      },
    });
    const motion = sequence({
      family: 'spatial',
      action: {
        kind: 'teleport',
        target: parseTargetReferenceSource(targetFixture('Context', undefined, 'point'), 'point'),
        radius: scalar(),
      },
    }).actions[0]!;
    if (motion.body.kind !== 'leaf') throw new Error('expected spatial action');
    const motionValue = motion.body.value;
    const withCallback = (callback: NativeSequenceSource<KnownNativeActionLeafSource>) => ({
      ...sequence(),
      actions: [
        {
          ...motion,
          body: {
            kind: 'actionWithCallback' as const,
            value: motionValue,
            trigger: 'targetPointInvalid' as const,
            callback,
          },
        },
      ],
    });
    expect(
      collectPresentationOnlyTargetGroups(graph([point, converted, withCallback(sequence())])),
    ).toContain('point');
    expect(
      collectMaterializedTargetGroups(graph([point, converted, withCallback(sequence())])),
    ).not.toContain('point');
    expect(
      collectPresentationOnlyTargetGroups(graph([point, converted, withCallback(consumer)])),
    ).not.toContain('point');
    const pointCount = sequence({
      family: 'condition',
      action: {
        kind: 'entityCount',
        sourceType: 'CheckEntityNum',
        target: parseTargetReferenceSource(targetFixture('Context', undefined, 'point'), 'point'),
        targetSource: 'Context',
        targetGroupKey: 'point',
        minimumCount: 1,
        comparison: 'GE',
        containsHittableTarget: false,
        excludeDeadEntity: false,
        storeKey: 'count',
      },
    });
    expect(collectMaterializedTargetGroups(graph([point], [pointCount]))).toContain('point');
    expect(
      collectCombatInvisibleRandomBlackboardKeys(graph([random, point, pointCount])).has('shared'),
    ).toBe(false);
    const unrelatedEvent = sequence({
      family: 'eventListener',
      action: {
        kind: 'eventListener',
        events: [{ abilityEvent: 'shared', actions: [] }],
      },
    });
    expect(
      collectCombatInvisibleRandomBlackboardKeys(graph([random], [unrelatedEvent])).has('shared'),
    ).toBe(true);
    const interval: NativeSequenceSource<KnownNativeActionLeafSource> = {
      ...random,
      actions: [
        {
          ...random.actions[0]!,
          body: {
            kind: 'tickInterval',
            bodyLifetime: 'instant',
            executeEachFrame: false,
            intervalSeconds: 1,
            useIntervalBlackboardKey: true,
            intervalBlackboardKey: 'shared',
            actionOnTick: sequence(),
          },
        },
      ],
    };
    expect(
      collectCombatInvisibleRandomBlackboardKeys(graph([random, interval])).has('shared'),
    ).toBe(false);
    const readOwnBound = sequence({
      family: 'randomBlackboard',
      action: {
        kind: 'randomBlackboardWrite',
        randomType: 'Float',
        minimum: scalar('shared'),
        maximum: scalar(),
        targetKey: 'shared',
      },
    });
    expect(collectCombatInvisibleRandomBlackboardKeys(graph([readOwnBound])).has('shared')).toBe(
      false,
    );
  });
  it('被动事件使用的目标组不能判为无人读取', () => {
    const targets = sequence({
      family: 'targetGroup',
      action: parseTargetGroupActionSource(
        {
          $type: 'Beyond.Gameplay.Core.MergeTargetAction+Data, Gameplay.Beyond',
          isEnable: true,
          priorityLevel: 'Default',
          priorityOffset: 0,
          serverActionIndex: 0,
          targetGroupKey: 'selected',
          targets: [targetFixture('Target')],
        },
        'fixture',
      )!,
    });
    const consume = sequence({
      family: 'spatial',
      action: {
        kind: 'selfRotate',
        rotateType: 'ToTarget',
        target: parseTargetReferenceSource(
          targetFixture('Context', undefined, 'selected'),
          'fixture',
        ),
        rootMotion: false,
        immediateRotate: true,
      },
    });
    const targetNode = targets.actions[0]!;
    if (targetNode.body.kind !== 'leaf' || targetNode.body.value.family !== 'targetGroup')
      throw new Error('expected target group');
    for (const center of ['ActionSource', 'ContextTarget']) {
      const query = sequence({
        family: 'targetGroup',
        action: {
          ...targetNode.body.value.action,
          producerType: 'FindTargetAction',
          finderType: 'FixedPointFinder',
          center,
          centerContextKey: 'center',
          selectorOwner: center,
          selectorOwnerContextKey: 'selectorOwner',
        },
      }).actions[0]!;
      const querySequence = { ...targets, actions: [query] };
      expect(collectPresentationSelectionTimelineIndexes(graph([querySequence]))).toEqual(
        new Set([0]),
      );
      expect(
        collectPresentationSelectionTimelineIndexes(graph([querySequence], [consume])).size,
      ).toBe(0);
      expect(collectUnobservedTargetQueryOutputs([querySequence])).toEqual(new Set(['selected']));
      expect(collectUnobservedTargetQueryOutputs([querySequence, consume]).size).toBe(0);
      expect(summarizeNativeTargetUsage(query).reads).toEqual(
        new Set(center === 'ContextTarget' ? ['center', 'selectorOwner'] : []),
      );
      expect(
        summarizeNativeTargetUsage({ ...query, metadata: { ...query.metadata, enabled: false } })
          .writes.size,
      ).toBe(0);
    }
    expect(collectUnconsumedTargetGroups(graph([targets]))).toEqual(new Set(['selected']));
    const staleReference = sequence({
      family: 'spatial',
      action: {
        kind: 'selfRotate',
        rotateType: 'ToTarget',
        target: parseTargetReferenceSource(
          targetFixture('Owner', undefined, 'selected'),
          'fixture',
        ),
        rootMotion: false,
        immediateRotate: true,
      },
    });
    expect(collectUnconsumedTargetGroups(graph([targets], [staleReference]))).toEqual(
      new Set(['selected']),
    );

    expect(collectUnconsumedTargetGroups(graph([targets], [consume])).size).toBe(0);
    const animationResponse = sequence({
      family: 'animationEventListener',
      action: {
        kind: 'animationEventListener',
        eventId: 'consume',
        eventParameterBlackboardKey: '',
        actionOnEvent: consume,
      },
    });
    expect(summarizeNativeTargetUsage(animationResponse.actions[0]!).reads.size).toBe(0);
    const nestedResponse = sequence({
      family: 'eventListener',
      action: {
        kind: 'eventListener',
        events: [{ abilityEvent: 'fixture', actions: [animationResponse] }],
      },
    });
    expect(collectUnconsumedTargetGroups(graph([targets], [nestedResponse])).size).toBe(0);
    const sameNameEvent = sequence({
      family: 'eventListener',
      action: { kind: 'eventListener', events: [{ abilityEvent: 'selected', actions: [] }] },
    });
    expect(collectUnconsumedTargetGroups(graph([targets, sameNameEvent]))).toEqual(
      new Set(['selected']),
    );
    const transfer = sequence({
      family: 'buffApplication',
      action: {
        kind: 'buffApplication',
        lifetimeOwner: 'independent',
        buffs: [],
        count: scalar(),
        target: parseTargetReferenceSource(targetFixture('Owner'), 'fixture'),
        buffSource: 'ActionOwner',
        contextKey: '',
        autoFinishByAction: false,
        inheritSkillIds: [],
        finishWithNextSkillIfNotInherited: false,
        asChildBuff: false,
        inheritSourceSkillCastId: false,
        inheritSourceSkillCastInfo: false,
        isExtra: false,
        passTargetGroupsToBuff: true,
        overrideBuffIconDuration: false,
        buffIconDuration: { durationSourceType: 'Default', timedMarkerId: '' },
      },
    });
    expect(collectUnconsumedTargetGroups(graph([targets, transfer])).size).toBe(0);
  });
});
