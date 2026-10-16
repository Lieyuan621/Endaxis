import { describe, expect, it } from 'vitest';

import { nativeActionName, parseScalarSource, projectTickIntervalFrames } from '../src/index.ts';
import { parseBlackboardDataPairs } from '../src/source/blackboard.ts';
import {
  createNativeJsonEncodingReader,
  parseNativeJsonEncodingSchema,
} from '../src/source/nativeJsonEncoding.ts';

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
  it('accepts numeric null encodings without accepting an active null reference', () => {
    expect(
      parseScalarSource({ value: 3, useBlackboardKey: false, blackboardKey: null }, 'value', {}),
    ).toEqual({ value: 3, blackboardKey: null, levelValues: null });
    expect(() =>
      parseScalarSource({ value: 3, useBlackboardKey: true, blackboardKey: null }, 'value', {}),
    ).toThrow();
    expect(
      parseBlackboardDataPairs(
        [{ key: 'amount', valueDouble: 3, valueStr: null, isDynamic: false }],
        'bb',
      ),
    ).toEqual([{ key: 'amount', value: 3, isDynamic: false }]);
  });
  it('reads enum fields using their declared type without rewriting unrelated numbers or nulls', () => {
    const schema = {
      classes: [
        {
          class: 'Test.Data',
          memberDetails: [
            { name: 'mode', type: 'Test.Mode' },
            { name: 'count', type: 'System.Int32' },
            { name: 'name', type: 'System.String' },
            { name: 'unknown', missingRuntimeField: true },
          ],
        },
      ],
      enumCatalog: { enums: [{ type: 'Test.Mode', members: [{ name: 'Enabled', value: 1 }] }] },
    };
    const read = createNativeJsonEncodingReader(parseNativeJsonEncodingSchema(schema, 'schema'));
    const source = { $type: 'Test+Data, Assembly', mode: 1, count: 1, name: null };
    expect(read(source, '', 'test')).toEqual({ ...source, mode: 'Enabled' });
    expect(source.mode).toBe(1);
    expect(read({ ...source, unknown: 1 }, '', 'test')).toEqual({
      ...source,
      mode: 'Enabled',
      unknown: 1,
    });
    expect(() => parseNativeJsonEncodingSchema({ ...schema, enumCatalog: {} }, 'schema')).toThrow(
      'schema.enumCatalog.enums',
    );
  });
  it('rejects an active empty blackboard reference', () => {
    expect(() =>
      parseScalarSource({ value: 0, useBlackboardKey: true, blackboardKey: '' }, 'skill.value', {}),
    ).toThrow('skill.value: active scalar blackboard reference has no key');
  });
});
