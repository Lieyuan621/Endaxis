import type { DamageElement } from '../../../../packages/game-data-contract/src/primitives.ts';

// 兼容旧名；归一输出的身份由独立契约定义，原生枚举及别名仍保留在本模块。
export type { DamageElement as ProjectedDamageElementSource } from '../../../../packages/game-data-contract/src/primitives.ts';

export const NATIVE_DAMAGE_ELEMENTS = ['Physical', 'Fire', 'Pulse', 'Cryst', 'Natural'] as const;

export type NativeDamageElementSource = (typeof NATIVE_DAMAGE_ELEMENTS)[number];

/** 严格读取原生元素身份；兼容名只归一到同一个原生语义，不在来源层使用 Next 名称。 */
export function parseNativeDamageElementSource(
  value: string,
  path: string,
): NativeDamageElementSource {
  const result = NATIVE_DAMAGE_ELEMENT_ALIASES[value];
  if (result === undefined) {
    throw new Error(`${path}: unsupported native damage element ${JSON.stringify(value)}`);
  }
  return result;
}

const NATIVE_DAMAGE_ELEMENT_ALIASES: Readonly<Record<string, NativeDamageElementSource>> = {
  Physical: 'Physical',
  Fire: 'Fire',
  Heat: 'Fire',
  Pulse: 'Pulse',
  Cryst: 'Cryst',
  Cold: 'Cryst',
  Natural: 'Natural',
  Nature: 'Natural',
};

/**
 * 将多个原生 schema 共用的元素身份归一为稳定来源 IR 身份。
 * 条件来源与行为编译器共同复用这里，避免来源层反向依赖 compiler 或各写一份映射。
 */
export function projectNativeDamageElement(value: string, path: string): DamageElement {
  return PROJECTED_NATIVE_DAMAGE_ELEMENTS[parseNativeDamageElementSource(value, path)];
}

const PROJECTED_NATIVE_DAMAGE_ELEMENTS = {
  Physical: 'physical',
  Fire: 'heat',
  Pulse: 'electric',
  Cryst: 'cryo',
  Natural: 'nature',
} as const satisfies Readonly<Record<NativeDamageElementSource, DamageElement>>;

/** 保持旧公共入口的原生遍历顺序；值来自唯一映射，不按契约展示顺序重新排列。 */
export const PROJECTED_DAMAGE_ELEMENTS = [
  PROJECTED_NATIVE_DAMAGE_ELEMENTS.Physical,
  PROJECTED_NATIVE_DAMAGE_ELEMENTS.Fire,
  PROJECTED_NATIVE_DAMAGE_ELEMENTS.Pulse,
  PROJECTED_NATIVE_DAMAGE_ELEMENTS.Cryst,
  PROJECTED_NATIVE_DAMAGE_ELEMENTS.Natural,
] as const;
