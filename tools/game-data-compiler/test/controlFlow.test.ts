import { describe, expect, it } from 'vitest';

import { nativeActionName, parseNativeSequenceSource } from '../src/index.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

const META = {
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 1,
} as const;

describe('原生控制流来源树', () => {
  it('VFS 的嵌套类型名和零优先级进入相同控制流，保留原始类型身份', () => {
    const node = {
      ...META,
      $type: 'Example.IfElseAction+IfElseActionData, Example',
      conditionAction: sequence([]),
      succeedActions: sequence([]),
      failActions: sequence([]),
      alwaysNext: false,
    };
    const parse = (item: unknown) =>
      parseNativeSequenceSource(sequence([item]), 'fixture', {}, parseLeafName);
    const before = parse(node);
    const after = parse({
      ...node,
      $type: 'Example.IfElseAction.IfElseActionData',
      priorityLevel: 0,
    });
    expect(after.actions[0]?.body).toEqual(before.actions[0]?.body);
    expect(after.actions[0]?.metadata).toEqual({
      ...before.actions[0]?.metadata,
      nativeType: 'Example.IfElseAction.IfElseActionData',
    });
    for (const value of [-1, 1, -100, 100, null]) {
      expect(() => parse({ ...node, priorityLevel: value })).toThrow('priorityLevel');
    }
  });

  it('保留根序列守卫、关闭项和 IfElse 三个独立序列', () => {
    const parsed = parseNativeSequenceSource(
      sequence(
        [
          {
            ...META,
            $type: 'Example.IfElseAction+IfElseActionData, Example',
            conditionAction: sequence([leaf('CheckHpAction', false)]),
            succeedActions: sequence([leaf('DamageAction')]),
            failActions: sequence([]),
            alwaysNext: false,
          },
        ],
        true,
      ),
      'fixture.sequence',
      {},
      parseLeafName,
    );
    expect(parsed).toMatchObject({
      onlyExecuteWhenSourceIsMainCharacter: true,
      onlyExecuteWhenSourceIsGuard: false,
      actions: [
        {
          metadata: { nativeName: 'IfElseAction', enabled: true },
          body: {
            kind: 'ifElse',
            alwaysNext: false,
            condition: {
              actions: [{ metadata: { nativeName: 'CheckHpAction', enabled: false } }],
            },
            whenTrue: { actions: [{ body: { kind: 'leaf', value: 'DamageAction' } }] },
            whenFalse: { actions: [] },
          },
        },
      ],
    });
  });

  it('递归读取 Switch 和 ForEach，而不在来源层展开选择或循环', () => {
    const parsed = parseNativeSequenceSource(
      sequence([
        {
          ...META,
          $type: 'Example.ForEachAction+Data, Example',
          target: targetFixture('Context', undefined, 'targets'),
          action: sequence([
            {
              ...META,
              serverActionIndex: 2,
              $type: 'Example.SwitchAction+Data, Example',
              choice: scalarFixture(0, 'choice'),
              options: [
                { value: scalarFixture(1), actionData: sequence([leaf('CreateBuffAction')]) },
              ],
              alwaysNext: true,
            },
          ]),
        },
      ]),
      'fixture.sequence',
      { choice: [1, 2] },
      parseLeafName,
    );
    expect(parsed.actions[0]?.body).toMatchObject({
      kind: 'forEach',
      target: { targetSource: 'Context', targetGroupKey: 'targets' },
      action: {
        actions: [
          {
            body: {
              kind: 'switch',
              choice: { blackboardKey: 'choice', levelValues: [1, 2] },
              options: [
                {
                  value: { value: 1 },
                  action: { actions: [{ body: { value: 'CreateBuffAction' } }] },
                },
              ],
            },
          },
        ],
      },
    });
  });

  it('Channeling 保留逐帧、间隔、每目标限制和递归 Tick 序列', () => {
    const parsed = parseNativeSequenceSource(
      sequence([
        {
          ...META,
          $type: 'Example.ChannelingAction+Data, Example',
          targetSettings: targetFixture('Context', undefined, 'targets'),
          executeEachFrame: false,
          triggerInterval: 0.1,
          maxCountPerTarget: -1,
          targetTriggerInterval: 0.5,
          actionOnTick: sequence([leaf('DamageAction')]),
        },
      ]),
      'fixture.sequence',
      {},
      parseLeafName,
    );
    expect(parsed.actions[0]?.body).toMatchObject({
      kind: 'channeling',
      target: { targetSource: 'Context', targetGroupKey: 'targets' },
      executeEachFrame: false,
      triggerIntervalSeconds: 0.1,
      maxCountPerTarget: -1,
      targetTriggerIntervalSeconds: 0.5,
      actionOnTick: { actions: [{ body: { value: 'DamageAction' } }] },
    });
  });

  it('ChannelingActionV2 按 1.4.4 的同构 Data 保留同一控制流', () => {
    const parsed = parseNativeSequenceSource(
      sequence([
        {
          ...META,
          $type: 'Example.ChannelingActionV2+Data, Example',
          targetSettings: { ...targetFixture('Target'), targetContextKey: 'tar' },
          executeEachFrame: true,
          triggerInterval: 0.033,
          maxCountPerTarget: 3,
          targetTriggerInterval: 0.1,
          actionOnTick: sequence([leaf('DamageAction')]),
        },
      ]),
      'fixture.sequence',
      {},
      parseLeafName,
    );
    expect(parsed.actions[0]?.body).toMatchObject({
      kind: 'channeling',
      target: { targetSource: 'Target', targetContextKey: 'tar' },
      executeEachFrame: true,
      triggerIntervalSeconds: 0.033,
      maxCountPerTarget: 3,
      targetTriggerIntervalSeconds: 0.1,
      actionOnTick: { actions: [{ body: { value: 'DamageAction' } }] },
    });
  });

  it('JumpTo 保留局部条件序列和目标帧，不在来源层限制跳转方向', () => {
    const parsed = parseNativeSequenceSource(
      sequence([
        {
          ...META,
          $type: 'Example.JumpToAction+Data, Example',
          conditionAction: sequence([leaf('CompareFloat')]),
          destFrame: 2,
        },
      ]),
      'fixture.sequence',
      {},
      parseLeafName,
    );
    expect(parsed.actions[0]?.body).toMatchObject({
      kind: 'timelineJump',
      destinationFrame: 2,
      condition: { actions: [{ body: { value: 'CompareFloat' } }] },
    });
  });

  it('TickInterval 保留动态间隔开关和递归 Tick 序列', () => {
    const parsed = parseNativeSequenceSource(
      sequence([
        {
          ...META,
          $type: 'Example.TickIntervalAction+Data, Example',
          executeEachFrame: false,
          tickInterval: 0.07,
          tickIntervalBlackboardKey: 'dynamic_interval',
          useTickIntervalBlackboardKey: true,
          actionOnTick: sequence([leaf('DamageAction')]),
        },
      ]),
      'fixture.sequence',
      {},
      parseLeafName,
    );
    expect(parsed.actions[0]?.body).toMatchObject({
      kind: 'tickInterval',
      executeEachFrame: false,
      intervalSeconds: 0.07,
      useIntervalBlackboardKey: true,
      intervalBlackboardKey: 'dynamic_interval',
      actionOnTick: { actions: [{ body: { value: 'DamageAction' } }] },
    });
  });

  it('TickIntervalV2 保留三态、两个黑板数值、次数、时长和递归 Tick 序列', () => {
    const parsed = parseNativeSequenceSource(
      sequence([
        {
          ...META,
          $type: 'Example.TickIntervalActionV2+Data, Example',
          tickMode: 'FixedCount',
          tickInterval: scalarFixture(0.1, 'dynamic_interval'),
          fixedTickCount: scalarFixture(3),
          totalTickCount: 9,
          totalDuration: 2.5,
          actionOnTick: sequence([leaf('DamageAction')]),
        },
      ]),
      'fixture.sequence',
      { dynamic_interval: [0.1, 0.2] },
      parseLeafName,
    );
    expect(parsed.actions[0]?.body).toMatchObject({
      kind: 'tickIntervalV2',
      tickMode: 'FixedCount',
      tickInterval: { blackboardKey: 'dynamic_interval', levelValues: [0.1, 0.2] },
      fixedTickCount: { value: 3, blackboardKey: null },
      totalTickCount: 9,
      totalDurationSeconds: 2.5,
      actionOnTick: { actions: [{ body: { value: 'DamageAction' } }] },
    });
  });

  it('TickIntervalV2 拒绝未知模式、非整数次数和与开关不一致的黑板键', () => {
    const fixture = (overrides: Record<string, unknown>) =>
      sequence([
        {
          ...META,
          $type: 'Example.TickIntervalActionV2+Data, Example',
          tickMode: 'Interval',
          tickInterval: scalarFixture(0.1),
          fixedTickCount: scalarFixture(1),
          totalTickCount: 3,
          totalDuration: 1,
          actionOnTick: sequence([]),
          ...overrides,
        },
      ]);

    expect(() =>
      parseNativeSequenceSource(
        fixture({ tickMode: 'Unknown' }),
        'fixture.sequence',
        {},
        parseLeafName,
      ),
    ).toThrow(/tickMode: unsupported value/);
    expect(() =>
      parseNativeSequenceSource(
        fixture({ fixedTickCount: scalarFixture(1.5) }),
        'fixture.sequence',
        {},
        parseLeafName,
      ),
    ).toThrow(/fixedTickCount\.value: expected integer/);
    expect(() =>
      parseNativeSequenceSource(
        fixture({
          tickInterval: {
            value: 0.1,
            useBlackboardKey: false,
            blackboardKey: 'inactive_residue',
          },
        }),
        'fixture.sequence',
        {},
        parseLeafName,
      ),
    ).toThrow(/key presence must match useBlackboardKey/);
  });

  it('NotNext 作为一次性序列策略保留，不伪装成独立逻辑非条件', () => {
    const parsed = parseNativeSequenceSource(
      sequence([
        { ...META, $type: 'Example.NotNextCheckAction+Data, Example' },
        leaf('CheckMainCharacterCondition'),
      ]),
      'fixture.sequence',
      {},
      parseLeafName,
    );
    expect(parsed.actions).toMatchObject([
      { body: { kind: 'negateNextResult' } },
      { body: { kind: 'leaf', value: 'CheckMainCharacterCondition' } },
    ]);
  });

  it('PhysicsCast 保留命中/未命中子序列与物理查询协议', () => {
    const parsed = parseNativeSequenceSource(
      sequence([
        {
          ...META,
          $type: 'Beyond.Gameplay.Core.PhysicsCastAction+PhysicsCastActionData, Gameplay.Beyond',
          succeedActions: sequence([leaf('HitAction')]),
          failActions: sequence([leaf('MissAction')]),
          hitPositionTargetGroupKey: 'hitPos',
          hitDistanceBlackboardKey: '',
          pointDirType: 'SourceToTarget',
          sourceSettings: targetFixture('Source'),
          targetSettings: targetFixture('Source'),
          sourceForwardData: {
            mountPoint: 'None',
            offsetForwardDirectionType: 'SourceForward',
            startPosOffset: {},
            directionSubType: 'MountPointTransformForward',
            rayLocalRotationEuler: {},
          },
          sourceToTargetData: {
            sourceMountPoint: 'None',
            offsetForwardDirectionType: 'SourceForward',
            startPosOffset: {},
            targetMountPoint: 'None',
            endPosOffset: {},
            rayLocalRotationEuler: {},
          },
          layerMask: {},
          maxDistance: scalarFixture(100),
          queryTriggerInteraction: 'UseGlobal',
          sphereRadius: scalarFixture(0),
          needTick: false,
          tickInterval: 0.1,
          stopTickWhenHit: false,
        },
      ]),
      'fixture.sequence',
      {},
      parseLeafName,
    );
    expect(parsed.actions[0]?.body).toMatchObject({
      kind: 'physicsCast',
      value: {
        hitPositionTargetGroupKey: 'hitPos',
        hitDistanceBlackboardKey: '',
        pointDirectionType: 'SourceToTarget',
        needTick: false,
      },
      whenHit: { actions: [{ body: { kind: 'leaf', value: 'HitAction' } }] },
      whenMiss: { actions: [{ body: { kind: 'leaf', value: 'MissAction' } }] },
    });
  });
});

function sequence(
  actionData: unknown[],
  onlyExecuteWhenSourceIsMainChar = false,
): Record<string, unknown> {
  return {
    actionData,
    onlyExecuteWhenSourceIsMainChar,
    onlyExecuteWhenSourceIsGuard: false,
  };
}

function leaf(name: string, isEnable = true): Record<string, unknown> {
  return { ...META, $type: `Example.${name}+Data, Example`, isEnable };
}

function parseLeafName(value: unknown): string {
  const type = (value as { $type: string }).$type;
  return nativeActionName(type);
}
