/** 已核对的原生数字枚举与解码名称；未知值必须显式失败。 */
import { requireNativeEnum } from './primitives.ts';

// Beyond.CompareType 的原生枚举值。
const COMPARISONS = new Map([
  [0, 'LT'],
  [1, 'LE'],
  [2, 'GT'],
  [3, 'GE'],
  [4, 'Equals'],
] as const);

export function readCompareType(value: unknown, path: string) {
  if (typeof value === 'string' && value.length > 0 && !/^[+-]?\d+$/.test(value)) return value;
  return requireNativeEnum(value, COMPARISONS, path);
}

// Beyond.CheckDamageDecorateMask.CheckType；已解码模板与原始 SkillData 共用此身份表。
const DAMAGE_DECORATE_MASK_CHECKS = new Map([
  [0, 'Exact'],
  [1, 'HasAny'],
  [2, 'HasAll'],
  [3, 'ExceptAny'],
  [4, 'ExceptAll'],
] as const);

export function readDamageDecorateMaskCheckType(value: unknown, path: string) {
  return requireNativeEnum(value, DAMAGE_DECORATE_MASK_CHECKS, path);
}

// Beyond.SkillType。条件表保留原生命名，投影阶段再映射为时间轴技能类别。
const SKILL_TYPES = new Map([
  [-1, 'PassiveSkill'],
  [0, 'Attack'],
  [1, 'BreakingAttack'],
  [2, 'NormalSkill'],
  [3, 'AttachSkill'],
  [5, 'Dodge'],
  [6, 'ComboSkill'],
  [7, 'UltimateSkill'],
  [8, 'ExtraActiveSkill'],
] as const);

export function readSkillType(value: unknown, path: string) {
  return requireNativeEnum(value, SKILL_TYPES, path);
}

// BuffData.buffEventAction 的原生生命周期事件。数字身份由原始与已解码 BuffData 逐项核对。
const BUFF_EVENTS = new Map([
  [0, 'OnBuffStart'],
  [1, 'OnBuffTrigger'],
  [2, 'OnBuffFinish'],
  [3, 'OnBuffEnable'],
  [5, 'DuringBuffEnable'],
  [6, 'OnBuffEnhanceChanged'],
  [7, 'OnBuffAfterTryEnhanced'],
  [8, 'OnBuffBeforeTryEnhanced'],
  [10, 'OnBuffFinishedEarlyInterrupted'],
] as const);

export function readBuffEvent(value: unknown, path: string) {
  return requireNativeEnum(value, BUFF_EVENTS, path);
}

// 当前原始/解码 BuffData 已证实的 ATB 来源和获取方式；新值保持严格失败。
const ATB_OBTAIN_TYPES = new Map([[3, 'Skill']] as const);
const ATB_OBTAIN_METHODS = new Map([[0, 'Gain']] as const);

export function readAtbObtainType(value: unknown, path: string) {
  if (typeof value === 'string') return value;
  return requireNativeEnum(value, ATB_OBTAIN_TYPES, path);
}

export function readAtbObtainMethod(value: unknown, path: string) {
  if (typeof value === 'string') return value;
  return requireNativeEnum(value, ATB_OBTAIN_METHODS, path);
}

// BuffData 的伤害与失衡 Modifier.enableSide；原始/已解码文件的相同条目对应关系。
const DAMAGE_MODIFIER_SIDES = new Map([
  [0, 'Attacker'],
  [1, 'Defender'],
] as const);

export function readModifierSide(value: unknown, path: string) {
  return requireNativeEnum(value, DAMAGE_MODIFIER_SIDES, path);
}

const HEAL_MODIFIER_SIDES = new Map([[0, 'Healer']] as const);

export function readHealModifierSide(value: unknown, path: string) {
  return requireNativeEnum(value, HEAL_MODIFIER_SIDES, path);
}

// AuraAction 的原始数值与已解码 BuffData 中的名称对应。
const AURA_TYPES = new Map([
  [0, 'RangedAura'],
  [1, 'GlobalAura'],
] as const);
const AURA_TARGET_TYPES = new Map([
  [1, 'Normal'],
  [2, 'Interactive'],
  [4, 'NoInteractive'],
  [8, 'Character'],
  [16, 'Enemy'],
  [16400, 'EnemyAll'],
] as const);

export function readAuraType(value: unknown, path: string) {
  return requireNativeEnum(value, AURA_TYPES, path);
}

export function readAuraTargetType(value: unknown, path: string) {
  return requireNativeEnum(value, AURA_TARGET_TYPES, path);
}

const AURA_SHAPES = new Map([
  [0, 'Box'],
  [1, 'Capsule'],
  [2, 'Sphere'],
] as const);

export function readAuraShape(value: unknown, path: string) {
  return requireNativeEnum(value, AURA_SHAPES, path);
}

const AURA_FACTIONS = new Map([
  [0, 'Ally'],
  [1, 'Anti'],
] as const);
const AURA_BUFF_SOURCES = new Map([
  [0, 'ActionSource'],
  [1, 'ActionOwner'],
  [2, 'InputTarget'],
  [3, 'CurrentTarget'],
  [4, 'ContextTarget'],
] as const);

export function readAuraFaction(value: unknown, path: string) {
  return requireNativeEnum(value, AURA_FACTIONS, path);
}

export function readAuraBuffSource(value: unknown, path: string) {
  return requireNativeEnum(value, AURA_BUFF_SOURCES, path);
}

const AURA_FILTER_OBJECT_TYPES = new Map([
  [-1, 'All'],
  [8, 'Character'],
] as const);

export function readAuraFilterObjectType(value: unknown, path: string) {
  return requireNativeEnum(value, AURA_FILTER_OBJECT_TYPES, path);
}

const ICON_DURATION_SOURCES = new Map([
  [0, 'AbilityEntity'],
  [1, 'TimedMarker'],
] as const);

export function readIconDurationSource(value: unknown, path: string) {
  return requireNativeEnum(value, ICON_DURATION_SOURCES, path);
}

// 当前 BuffData 中已核对的黑板取值类型；其他数字值尚未确认，不做推断。
const BLACKBOARD_CALCULATION_TYPES = new Map([[0, 'HpRatio']] as const);

export function readBlackboardCalculationType(value: unknown, path: string) {
  return requireNativeEnum(value, BLACKBOARD_CALCULATION_TYPES, path);
}
