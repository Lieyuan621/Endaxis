import { describe, expect, it } from 'vitest';

import {
  nativeActionName,
  parseScalarSource,
  projectTickIntervalFrames,
  requireNonNegativeInteger,
} from '../src/index.ts';

interface ScalarCase {
  readonly value: {
    readonly value: number;
    readonly useBlackboardKey: boolean;
    readonly blackboardKey: string;
  };
  readonly path: string;
  readonly blackboard: Readonly<Record<string, readonly number[]>>;
}

const SCALAR_CASES: readonly ScalarCase[] = [
  {
    value: { value: 1.25, useBlackboardKey: false, blackboardKey: '' },
    path: 'skill.duration',
    blackboard: {},
  },
  {
    value: { value: 0, useBlackboardKey: true, blackboardKey: 'atk_scale' },
    path: 'skill.damage.attackScale',
    blackboard: { atk_scale: [1, 1.1, 1.2] },
  },
  {
    value: { value: 3, useBlackboardKey: true, blackboardKey: 'runtime_only' },
    path: 'buff.duration',
    blackboard: {},
  },
];

describe('shared native source primitives', () => {
  it('normalizes serialized native action type names', () => {
    expect(nativeActionName('Endfield.Action.SequenceAction, Game.Core')).toBe('SequenceAction');
    expect(nativeActionName('Endfield.Action.Outer+Nested, Game.Core')).toBe('Outer');
    expect(nativeActionName('Beyond.Gameplay.Core.IfElseAction.IfElseActionData')).toBe(
      'IfElseAction',
    );
    expect(nativeActionName('Beyond.Gameplay.Core.CastSkill.Data')).toBe('CastSkill');
    expect(nativeActionName('Example.OuterAction.UnknownData')).toBe('UnknownData');
  });

  it('rejects booleans and fractions as native action indexes', () => {
    expect(() => requireNonNegativeInteger(true, 'action.serverActionIndex')).toThrow(
      'action.serverActionIndex: expected non-negative integer',
    );
    expect(() => requireNonNegativeInteger(1.5, 'action.serverActionIndex')).toThrow(
      'action.serverActionIndex: expected non-negative integer',
    );
  });

  it.each([
    { startFrame: 0, endFrame: 90, intervalSeconds: 0.1 },
    { startFrame: 17, endFrame: 180, intervalSeconds: 1 / 3 },
    { startFrame: 0, endFrame: 1500, intervalSeconds: 0.033333335 },
  ])('locks the verified float32 tick projection for %o', payload => {
    expect(
      projectTickIntervalFrames(payload.startFrame, payload.endFrame, payload.intervalSeconds),
    ).toMatchSnapshot();
  });
});

describe('shared scalar source parser', () => {
  it.each(SCALAR_CASES)('locks the verified source shape for %o', payload => {
    expect(parseScalarSource(payload.value, payload.path, payload.blackboard)).toMatchSnapshot();
  });

  it('rejects an active empty blackboard reference', () => {
    expect(() =>
      parseScalarSource({ value: 0, useBlackboardKey: true, blackboardKey: '' }, 'skill.value', {}),
    ).toThrow('skill.value: active scalar blackboard reference has no key');
  });
});
