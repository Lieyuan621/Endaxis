import { describe, expect, it } from 'vitest';
import {
  resolveSkillBlackboardSource,
  selectSkillBlackboardLevel,
} from '../../src/compiler/skills/skillBlackboard.ts';
import { parseScalarSource } from '../../src/source/scalar.ts';
import type { SkillPatchSource } from '../../src/source/skillPatch.ts';
import { scalarFixture } from '../sourceFixtures.ts';

const declarations = [
  { key: 'duration', value: 5, isDynamic: false },
  { key: 'zero', value: 0, isDynamic: false },
  { key: 'damage', value: 0.1, isDynamic: false },
  { key: 'runtime', value: 9, isDynamic: true },
  { key: 'label', value: 'identifier', isDynamic: false },
];

function patch(): SkillPatchSource {
  return {
    levels: Object.freeze([2, 4]),
    blackboard: {
      damage: Object.freeze([0.2, 0.4]),
      patch_only: Object.freeze([0, 0]),
    },
    cooldownSeconds: [0, 0],
    costTypes: [0, 0],
    costValues: [0, 0],
  };
}

describe('默认黑板单值与原生补丁等级列', () => {
  it('默认值不扩列，补丁包括相等值的列都保留原引用和等级身份', () => {
    const sourcePatch = patch();
    const resolved = resolveSkillBlackboardSource(declarations, 1, sourcePatch);
    expect(resolved.values).toEqual({
      duration: 5,
      zero: 0,
      damage: [0.2, 0.4],
      patch_only: [0, 0],
    });
    expect(resolved.levels).toBe(sourcePatch.levels);
    expect(resolved.values.damage).toBe(sourcePatch.blackboard.damage);
    expect(resolved.values.patch_only).toBe(sourcePatch.blackboard.patch_only);
    expect(resolved.declaredDefaults).toEqual({ duration: 5, zero: 0, damage: 0.1 });
  });

  it.each([
    { level: null, selected: 1, patched: false, damage: 0.1 },
    { level: 1, selected: 1, patched: false, damage: 0.1 },
    { level: 3, selected: 1, patched: false, damage: 0.1 },
    { level: 2, selected: 2, patched: true, damage: 0.2 },
    { level: 4, selected: 4, patched: true, damage: 0.4 },
  ])('按原生等级选择、缺档回退：$level', ({ level, selected, patched, damage }) => {
    const resolved = resolveSkillBlackboardSource(declarations, 1, patch());
    expect(selectSkillBlackboardLevel(resolved, level)).toEqual({
      level: selected,
      patchApplied: patched,
      values: { duration: 5, zero: 0, damage, ...(patched ? { patch_only: 0 } : {}) },
    });
    expect(resolved.declaredDefaults.damage).toBe(0.1);
    expect(resolved.values.damage).toEqual([0.2, 0.4]);
  });

  it('无补丁时保留一份单值默认黑板，排除动态和字符串声明', () => {
    const resolved = resolveSkillBlackboardSource(declarations, 7, null);
    expect(resolved).toEqual({
      definitionLevel: 7,
      levels: [7],
      declaredDefaults: { duration: 5, zero: 0, damage: 0.1 },
      values: { duration: 5, zero: 0, damage: 0.1 },
    });
    expect(selectSkillBlackboardLevel(resolved, null).values).toEqual(resolved.declaredDefaults);
  });

  it('补丁可以提供动态声明或未声明键，但不污染缺档回退默认值', () => {
    const sourcePatch = patch();
    const resolved = resolveSkillBlackboardSource(declarations, 1, {
      ...sourcePatch,
      blackboard: { ...sourcePatch.blackboard, runtime: [3, 6] },
    });
    expect(resolved.values.runtime).toEqual([3, 6]);
    expect(selectSkillBlackboardLevel(resolved, 2).values.runtime).toBe(3);
    expect(selectSkillBlackboardLevel(resolved, 3).values.runtime).toBeUndefined();
  });

  it('来源参数区分零值、等级列与未知输入，并始终保留引用键', () => {
    const resolved = resolveSkillBlackboardSource(declarations, 1, patch());
    expect(parseScalarSource(scalarFixture(9, 'zero'), 'zero', resolved.values)).toEqual({
      value: 9,
      blackboardKey: 'zero',
      levelValues: 0,
    });
    const damage = parseScalarSource(scalarFixture(9, 'damage'), 'damage', resolved.values);
    expect(damage.blackboardKey).toBe('damage');
    expect(damage.levelValues).toBe(resolved.values.damage);
    expect(parseScalarSource(scalarFixture(9, 'runtime'), 'runtime', resolved.values)).toEqual({
      value: 9,
      blackboardKey: 'runtime',
      levelValues: null,
    });
    expect(parseScalarSource(scalarFixture(9), 'constant', resolved.values)).toEqual({
      value: 9,
      blackboardKey: null,
      levelValues: null,
    });
  });
});
