import { describe, expect, it } from 'vitest';
import { parseAdvancedDirectionSource } from '../src/source/spatial.ts';
import { parseSelfRotateActionSource } from '../src/source/spatialActions.ts';
import { parseKnownNativeActionLeafSource } from '../src/source/actionLeaf.ts';
import { readActionTarget, readDirectionType } from '../src/source/targetEnums.ts';
import {
  readAdvancedDirectionType,
  readMountPoint,
  readRootMotionDirectionType,
  readRotateDirectionType,
  readSelfRotateType,
} from '../src/source/spatialEnums.ts';
import { targetFixture } from './sourceFixtures.ts';

const direction = {
  directionType: 'SourceForward',
  sourceMountPoint: 'None',
  targetMountPoint: 'None',
  customSourceAndTarget: false,
  clampToXZ: true,
  invertDirection: false,
};
const meta = { isEnable: true, priorityLevel: 'Default', priorityOffset: 0, serverActionIndex: 1 };

describe('方向枚举的精确原生身份', () => {
  it('ActionTargetType 保留新增的全局主控角色成员', () => {
    expect(readActionTarget(5, 'target')).toBe('MainCharacter');
    expect(readActionTarget('MainCharacter', 'target')).toBe('MainCharacter');
  });
  it.each([
    [0, 'SourceForward'],
    [1, 'TargetForward'],
    [2, 'SourceToTarget'],
    [3, 'TargetToSource'],
    [4, 'CameraForward'],
    [5, 'SameAsSourceMountPointDir'],
  ])('高级方向 %s / %s', (value, name) => {
    expect(readAdvancedDirectionType(value, 'dir')).toBe(name);
    expect(readAdvancedDirectionType(name, 'dir')).toBe(name);
  });

  it('高级方向的第 5 项不泄漏到普通 Gameplay.DirectionType', () => {
    expect(() => readDirectionType(5, 'dir')).toThrow('unknown native enum');
    expect(() => readDirectionType('SameAsSourceMountPointDir', 'dir')).toThrow(
      'unknown native enum',
    );
    expect(() => readAdvancedDirectionType(6, 'dir')).toThrow('unknown native enum');
  });

  it.each([
    [-1, 'CounterClockwise'],
    [1, 'Clockwise'],
  ])('旋转的有符号数值 %s / %s', (value, name) => {
    for (const parse of [readRotateDirectionType, readRootMotionDirectionType]) {
      expect(parse(value, 'dir')).toBe(name);
      expect(parse(name, 'dir')).toBe(name);
    }
  });

  it('Free 只属于普通旋转，根运动旋转不接受 0', () => {
    expect(readRotateDirectionType(0, 'dir')).toBe('Free');
    expect(() => readRootMotionDirectionType(0, 'dir')).toThrow('dir');
    expect(() => readRootMotionDirectionType('Free', 'dir')).toThrow('dir');
  });

  it.each([
    [0, 'ToTarget'],
    [1, 'ToLocation'],
    [2, 'OnlyEntity'],
  ])('自身旋转类型 %s / %s', (value, name) => {
    expect(readSelfRotateType(value, 'rotate')).toBe(name);
    expect(readSelfRotateType(name, 'rotate')).toBe(name);
  });

  it.each([
    [0, 'None'],
    [6, 'AirborneEffect'],
    [50, 'ModelStart'],
    [51, 'Head'],
    [87, 'GoldCoinPoint'],
    [1000, 'HeadLabel'],
  ])('非连续挂点 %s / %s', (value, name) => {
    expect(readMountPoint(value, 'mp')).toBe(name);
    expect(readMountPoint(name, 'mp')).toBe(name);
  });

  it('精确支持 50 个 Custom 挂点，不外推范围', () => {
    for (let i = 1; i <= 50; i++) {
      expect(readMountPoint(150 + i, 'mp')).toBe(`Custom${i}`);
      expect(readMountPoint(`Custom${i}`, 'mp')).toBe(`Custom${i}`);
    }
    for (const value of [7, 49, 88, 150, 201, 'Custom0', 'Custom51', '0', null]) {
      expect(() => readMountPoint(value, 'mp')).toThrow('mp');
    }
  });
});

describe('共享方向设置解析', () => {
  it('数字挂点/方向与命名表示产生完整相同 IR，null 与省略空覆盖等价', () => {
    expect(
      parseAdvancedDirectionSource(
        {
          ...direction,
          directionType: 0,
          sourceMountPoint: 0,
          targetMountPoint: 0,
          source: null,
          target: null,
        },
        'dir',
      ),
    ).toEqual(parseAdvancedDirectionSource(direction, 'dir'));
  });

  it.each([false, true])('有效覆盖引用无论是否启用都保留：%s', customSourceAndTarget => {
    const source = targetFixture('Source');
    const target = targetFixture('Target');
    expect(
      parseAdvancedDirectionSource({ ...direction, customSourceAndTarget, source, target }, 'dir'),
    ).toMatchObject({ source: { targetSource: 'Source' }, target: { targetSource: 'Target' } });
  });

  it('单侧序列化时保留覆盖侧，省略侧回落原生 TargetSettings.Default', () => {
    expect(
      parseAdvancedDirectionSource(
        {
          ...direction,
          customSourceAndTarget: true,
          source: targetFixture('Owner'),
        },
        'dir',
      ),
    ).toMatchObject({ source: { targetSource: 'Owner' }, target: null });
  });

  it.each([
    { source: undefined, target: undefined },
    { source: {}, target: {} },
    { directionType: '0' },
    { extra: 1 },
  ])('不以来源兼容为由放开缺失覆盖或非法字段：%j', overrides => {
    expect(() => parseAdvancedDirectionSource({ ...direction, ...overrides }, 'dir')).toThrow(
      'dir',
    );
  });

  it('目标后处理动作与控制动作复用同一方向设置解析结果', () => {
    const action = {
      ...meta,
      $type: 'Beyond.Gameplay.Core.TargetPostProcessorAction+Data, Gameplay.Beyond',
      target: targetFixture('Context', undefined, 'tar'),
      centerPos: targetFixture('Source'),
      source: targetFixture('Source'),
      targetGroupKey: 'out',
      validatorData: [],
      postProcessorData: [],
      direction,
    };
    expect(
      parseKnownNativeActionLeafSource(
        {
          ...action,
          direction: {
            ...direction,
            directionType: 0,
            sourceMountPoint: 0,
            targetMountPoint: 0,
            source: null,
            target: null,
          },
        },
        'action',
        {},
      ),
    ).toEqual(parseKnownNativeActionLeafSource(action, 'action', {}));
  });

  it('SelfRotate 接受精确数字枚举，关闭 rootMotion 也不吞掉非法枚举', () => {
    const action = {
      ...meta,
      $type: 'Beyond.Gameplay.Core.SelfRotateAction+Data, Gameplay.Beyond',
      rotateType: 'ToTarget',
      useAdvancedDirectionSetting: false,
      targetSettings: targetFixture('Target'),
      advancedDirectionSettings: direction,
      rootMotion: false,
      rootMotionAnimKey: '',
      rootMotionStartFrame: 0,
      isRootMotionScale: false,
      rootMotionDirectionType: 'Clockwise',
      immediateRotate: true,
      overrideRotateRate: false,
      rotateRate: 0,
      rotateDirType: 'Free',
      ignoreImmobilized: false,
    };
    expect(
      parseSelfRotateActionSource(
        { ...action, rotateType: 0, rootMotionDirectionType: 1, rotateDirType: 0 },
        'rotate',
      ),
    ).toEqual(parseSelfRotateActionSource(action, 'rotate'));
    expect(() =>
      parseSelfRotateActionSource({ ...action, rootMotionDirectionType: 0 }, 'rotate'),
    ).toThrow('rootMotionDirectionType');
  });
});
