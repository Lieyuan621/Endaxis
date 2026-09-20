import { requireNativeEnum } from './primitives.ts';

// 每张表对应一个精确原生类型。
// 高级方向含成员 5，不能借用 Gameplay.DirectionType 的五项映射。
const ADVANCED_DIRECTIONS = new Map([
  [0, 'SourceForward'],
  [1, 'TargetForward'],
  [2, 'SourceToTarget'],
  [3, 'TargetToSource'],
  [4, 'CameraForward'],
  [5, 'SameAsSourceMountPointDir'],
] as const);
const SELF_ROTATE_TYPES = new Map([
  [0, 'ToTarget'],
  [1, 'ToLocation'],
  [2, 'OnlyEntity'],
] as const);
const ROTATE_DIRECTIONS = new Map([
  [-1, 'CounterClockwise'],
  [0, 'Free'],
  [1, 'Clockwise'],
] as const);
const ROOT_MOTION_DIRECTIONS = new Map([
  [-1, 'CounterClockwise'],
  [1, 'Clockwise'],
] as const);

const MOUNT_POINTS = new Map<number, string>([
  [0, 'None'],
  [1, 'HeadBar'],
  [2, 'FootBar'],
  [3, 'LockPoint'],
  [4, 'HeadStatus'],
  [5, 'DmgTxtSpawnPoint'],
  [6, 'AirborneEffect'],
  [50, 'ModelStart'],
  [51, 'Head'],
  [52, 'VBHit'],
  [53, 'Muzzle'],
  [54, 'Foot'],
  [55, 'Hip'],
  [56, 'HipL'],
  [57, 'HipR'],
  [58, 'Spine1'],
  [59, 'Spine2'],
  [60, 'Spine3'],
  [61, 'WepM'],
  [62, 'WepL'],
  [63, 'WepR'],
  [64, 'KneeL'],
  [65, 'KneeR'],
  [66, 'AnkleL'],
  [67, 'AnkleR'],
  [68, 'ToesL'],
  [69, 'ToesR'],
  [70, 'Chest'],
  [71, 'Neck'],
  [72, 'ScapulaL'],
  [73, 'ScapulaR'],
  [74, 'ShoulderL'],
  [75, 'ShoulderR'],
  [76, 'WristL'],
  [77, 'WristR'],
  [78, 'FingerL'],
  [79, 'FingerR'],
  [80, 'LookAtPoint'],
  [81, 'ModelRoot'],
  [82, 'RootM'],
  [83, 'ThrowPoint'],
  [84, 'IKWepL'],
  [85, 'IKWepR'],
  [86, 'NarrativeFx'],
  [87, 'GoldCoinPoint'],
  // metadata 逐项确认 Custom1–50 精确为 151–200，不扩展至无名值或未来成员。
  ...Array.from({ length: 50 }, (_, index): [number, string] => [
    151 + index,
    `Custom${index + 1}`,
  ]),
  [1000, 'HeadLabel'],
]);

export function readAdvancedDirectionType(value: unknown, path: string) {
  return requireNativeEnum(value, ADVANCED_DIRECTIONS, path);
}

export function readMountPoint(value: unknown, path: string) {
  return requireNativeEnum(value, MOUNT_POINTS, path);
}

export function readSelfRotateType(value: unknown, path: string) {
  return requireNativeEnum(value, SELF_ROTATE_TYPES, path);
}

export function readRotateDirectionType(value: unknown, path: string) {
  return requireNativeEnum(value, ROTATE_DIRECTIONS, path);
}

export function readRootMotionDirectionType(value: unknown, path: string) {
  return requireNativeEnum(value, ROOT_MOTION_DIRECTIONS, path);
}
