import { describe, expect, it } from 'vitest';

import { nativeActionName, parseScalarSource, projectTickIntervalFrames } from '../src/index.ts';

describe('shared native source primitives', () => {
  it('normalizes serialized native action type names', () => {
    expect(nativeActionName('Endfield.Action.Outer+Nested, Game.Core')).toBe('Outer');
    expect(nativeActionName('Beyond.Gameplay.Core.IfElseAction.IfElseActionData')).toBe(
      'IfElseAction',
    );
  });

  it('uses float32 accumulation when projecting tick frames', () => {
    expect(projectTickIntervalFrames(17, 100, 1 / 3)).toEqual([17, 26, 36, 46, 56, 67, 77, 87, 97]);
  });
});

describe('shared scalar source parser', () => {
  it('rejects an active empty blackboard reference', () => {
    expect(() =>
      parseScalarSource({ value: 0, useBlackboardKey: true, blackboardKey: '' }, 'skill.value', {}),
    ).toThrow('skill.value: active scalar blackboard reference has no key');
  });
});
