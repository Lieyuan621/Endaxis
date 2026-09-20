import { requireNativeEnum } from './primitives.ts';

// 按精确原生类型读取常量，不按字段同形合并不同枚举。
const TARGET_SOURCES = new Map([
  [0, 'Target'],
  [1, 'Source'],
  [2, 'Context'],
  [3, 'InstantSearch'],
  [4, 'Owner'],
  [5, 'MainCharacter'],
  [6, 'MainTarget'],
] as const);
const ACTION_TARGETS = new Map([
  [0, 'ActionSource'],
  [1, 'ActionOwner'],
  [2, 'InputTarget'],
  [3, 'CurrentTarget'],
  [4, 'ContextTarget'],
  [5, 'MainCharacter'],
] as const);
const DIRECTIONS = new Map([
  [0, 'SourceForward'],
  [1, 'TargetForward'],
  [2, 'SourceToTarget'],
  [3, 'TargetToSource'],
  [4, 'CameraForward'],
] as const);
const FACTION_TARGETS = new Map([
  [0, 'Ally'],
  [1, 'Anti'],
] as const);
// 这是 HitBoxFinder 的嵌套枚举，不是通用 ObjectType；不能套用 Entity 对象类型掩码。
const HIT_BOX_OBJECT_TYPES = new Map([
  [1, 'Normal'],
  [2, 'Interactive'],
  [4, 'NoInteractive'],
] as const);

export function readTargetSource(value: unknown, path: string) {
  return requireNativeEnum(value, TARGET_SOURCES, path);
}

export function readActionTarget(value: unknown, path: string) {
  return requireNativeEnum(value, ACTION_TARGETS, path);
}

export function readDirectionType(value: unknown, path: string) {
  return requireNativeEnum(value, DIRECTIONS, path);
}

export function readFactionTarget(value: unknown, path: string) {
  return requireNativeEnum(value, FACTION_TARGETS, path);
}

export function readHitBoxObjectType(value: unknown, path: string) {
  return requireNativeEnum(value, HIT_BOX_OBJECT_TYPES, path);
}
