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
  return requireNativeEnum(value, COMPARISONS, path);
}
