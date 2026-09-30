import { describe, expect, it } from 'vitest';
import { parseAdvancedDirectionSource } from '../src/source/spatial.ts';
import { parseSelfRotateActionSource } from '../src/source/spatialActions.ts';
import { parseKnownNativeActionLeafSource } from '../src/source/actionLeaf.ts';
import { readDirectionType } from '../src/source/targetEnums.ts';
import {
  readAdvancedDirectionType,
  readMountPoint,
  readRootMotionDirectionType,
  readRotateDirectionType,
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

it('移动碰撞体保留挂点并归为空间动作，未知字段仍报错', () => {
  const raw = {
    ...meta,
    $type: 'Beyond.Gameplay.Core.EnableMoveColliderAction+Data, Gameplay.Beyond',
    mountPoint: 'Custom6',
  };
  expect(parseKnownNativeActionLeafSource(raw, 'collider', {})).toEqual({
    family: 'spatial',
    action: { kind: 'enableMoveCollider', mountPoint: 'Custom6' },
  });
  expect(() => parseKnownNativeActionLeafSource({ ...raw, damage: 1 }, 'collider', {})).toThrow();
  expect(parseKnownNativeActionLeafSource({ ...raw, mountPoint: 156 }, 'collider', {})).toEqual(
    parseKnownNativeActionLeafSource(raw, 'collider', {}),
  );
});

describe('方向枚举的精确原生身份', () => {
  it('高级方向的第 5 项不泄漏到普通 Gameplay.DirectionType', () => {
    expect(readAdvancedDirectionType(5, 'dir')).toBe('SameAsSourceMountPointDir');
    expect(() => readDirectionType(5, 'dir')).toThrow('unknown native enum');
    expect(() => readDirectionType('SameAsSourceMountPointDir', 'dir')).toThrow(
      'unknown native enum',
    );
    expect(() => readAdvancedDirectionType(6, 'dir')).toThrow('unknown native enum');
  });

  it('Free 只属于普通旋转，根运动旋转不接受 0', () => {
    expect(readRotateDirectionType(0, 'dir')).toBe('Free');
    expect(() => readRootMotionDirectionType(0, 'dir')).toThrow('dir');
    expect(() => readRootMotionDirectionType('Free', 'dir')).toThrow('dir');
  });

  it('Custom 挂点支持首尾成员，不外推范围', () => {
    for (const i of [1, 50]) {
      expect(readMountPoint(150 + i, 'mp')).toBe(`Custom${i}`);
    }
    for (const value of [150, 201, 'Custom0', 'Custom51']) {
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
