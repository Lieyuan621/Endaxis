import { requireNativeEnum, type SourceRecord } from './primitives.ts';

// 1.4.4 metadata 的精确常量，用于被动技能工厂分派。
// 仅在来源边界兼容命名导出与 VFS 整数导出，不让原生整数泄漏到编译结果。
const CAST_TYPES = new Map([
  [0, 'Active'],
  [1, 'Passive'],
] as const);
const PASSIVE_TYPES = new Map([
  [0, 'AddBuff'],
  [1, 'ToggleBuff'],
] as const);

export function readSkillCastType(value: unknown, path: string) {
  return requireNativeEnum(value, CAST_TYPES, path);
}

export function readPassiveSkillType(value: unknown, path: string) {
  return requireNativeEnum(value, PASSIVE_TYPES, path);
}

/** 工厂只在 Passive + ToggleBuff 时消费 toggleBuffs，活动技能不读取被动类型。 */
export function isToggleBuffSkillSource(root: SourceRecord, path: string): boolean {
  return (
    readSkillCastType(root.castType, `${path}.castType`) === 'Passive' &&
    readPassiveSkillType(root.passiveSkillType, `${path}.passiveSkillType`) === 'ToggleBuff'
  );
}
