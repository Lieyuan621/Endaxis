import { describe, expect, it } from 'vitest';
import { parseSkillPatchSource } from '../src/source/skillPatch.ts';
import { normalizeNativeTableNumbers } from '../src/source/nativeTableNumbers.ts';

describe('SkillPatch float32 JSON 读取', () => {
  it('黑板与冷却缩写后保持 float32 位值，不改来源对象', () => {
    const raw = {
      SkillPatchDataBundle: [
        {
          level: 1,
          blackboard: [{ key: 'ratio', value: Math.fround(0.09) }],
          coolDown: Math.fround(0.1),
          costValue: 100,
        },
      ],
    };
    const before = structuredClone(raw);
    const parsed = parseSkillPatchSource(raw, 'skill');
    expect(parsed.blackboard.ratio).toEqual([0.09]);
    expect(parsed.cooldownSeconds).toEqual([0.1]);
    expect(raw).toEqual(before);
  });
  it('覆盖负数、小数和科学计数，保留 double、整数及文本', () => {
    for (const value of [0.05, 0.09, -0.3, 0.0000000123, 12345.67, 1 / 30]) {
      const expanded = Math.fround(value);
      const normalized = normalizeNativeTableNumbers(expanded);
      expect(Math.fround(Number(normalized))).toBe(expanded);
      expect(normalizeNativeTableNumbers(normalized)).toBe(normalized);
    }
    const precise = [1 / 3, 20.4123711340206, 0.123456789012345, 123456789, '0.09000000357627869'];
    expect(normalizeNativeTableNumbers(precise)).toEqual(precise);
    expect(normalizeNativeTableNumbers([Math.fround(0.05), Math.fround(-0.3)])).toEqual([
      0.05, -0.3,
    ]);
  });
});
