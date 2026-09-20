import { describe, expect, it } from 'vitest';
import { parseTargetGroupActionSource } from '../src/source/targetGroup.ts';
import { parseSelectorSummarySource } from '../src/source/target.ts';
import { scalarFixture, targetFixture } from './sourceFixtures.ts';

describe('新版目标集合字段', () => {
  const merge = {
    $type: 'Beyond.Gameplay.Core.MergeTargetAction+Data, Gameplay.Beyond',
    isEnable: true,
    priorityLevel: 'Default',
    priorityOffset: 0,
    serverActionIndex: 0,
    targetGroupKey: 'combined',
    targets: [targetFixture('Context', undefined, 'first'), targetFixture('Target')],
  };
  it('关闭可受击目标合并时保留原有输入身份及顺序', () => {
    const old = parseTargetGroupActionSource(merge, 'merge');
    expect(
      parseTargetGroupActionSource({ ...merge, mergeHittableTargets: false }, 'merge'),
    ).toEqual(old);
    expect(old!.inputTargets.map(target => [target.targetSource, target.targetGroupKey])).toEqual([
      ['Context', 'first'],
      ['Target', ''],
    ]);
  });
  it.each([true, 0, 'false', null, undefined])(
    '阻断新增通道或非法开关 %j',
    mergeHittableTargets => {
      expect(() =>
        parseTargetGroupActionSource({ ...merge, mergeHittableTargets }, 'merge'),
      ).toThrow('mergeHittableTargets');
    },
  );

  const finder = {
    $type: 'Beyond.Gameplay.Core.Selector+RandomPointFinder+Data, Gameplay.Beyond',
    pointNum: scalarFixture(2, 'point_count'),
    shape: 'Sector',
    localPlaneRotationEulers: { x: scalarFixture(0), y: scalarFixture(0), z: scalarFixture(0) },
    radius: scalarFixture(1),
    minRadius: scalarFixture(0),
    angle: scalarFixture(180),
    useExtraJitter: false,
    snapToNavMesh: false,
  };
  const zeroExtent = { x: scalarFixture(0), y: scalarFixture(0) };
  const parse = (finderData: Record<string, unknown>) =>
    parseSelectorSummarySource(
      {
        finderData,
        validatorData: [],
        postProcessorData: [],
      },
      'selector',
      true,
    );

  it.each(['Circle', 'Sector'])('%s 的默认二维尺寸不改变点数和黑板依赖', shape => {
    const old = parse({ ...finder, shape });
    expect(parse({ ...finder, shape, extent2D: zeroExtent })).toEqual(old);
    expect(old.finderRandomPointCount).toEqual({ value: 2, blackboardKey: 'point_count' });
    expect(old.finderPointBlackboardKeys).toContain('point_count');
  });
  it.each([
    null,
    {},
    { x: scalarFixture(0) },
    { ...zeroExtent, z: scalarFixture(0) },
    { x: scalarFixture(1), y: scalarFixture(0) },
    { x: scalarFixture(0), y: scalarFixture(1) },
    { x: scalarFixture(0, 'width'), y: scalarFixture(0) },
    { x: { ...scalarFixture(0), value: '0' }, y: scalarFixture(0) },
  ])('拒绝非法或未开放的二维尺寸 %j', extent2D => {
    expect(() => parse({ ...finder, extent2D })).toThrow('extent2D');
  });
  it('不借默认字段兼容开放新的随机形状', () => {
    expect(() => parse({ ...finder, shape: 'Rect', extent2D: zeroExtent })).toThrow('shape');
  });
});
