import { expect, it } from 'vitest';
import type { TimeScaleCurveKeyDefinition } from '../../../packages/game-data-contract/src/conditions';
import {
  assertTimeScaleCurveSelection,
  assertTimeScaleCurveValue,
  switchTimeScaleCurveBranch,
} from './timeScaleCurveValue';
import { timeScaleCurvePreview } from './timeScaleCurvePreview';
import { compileTimeScaleCurve } from '../../core/combat/time/timeScaleCurve';
import {
  timeScaleCurveDefinitions,
  timeDilationRuntimeConfig,
} from '../../data/combat/timeDilationConfig';
import { TIME_DILATION_NAMED_CURVE_DEFINITIONS } from '../../data/combat/timeDilationCatalog';
import { HIT_STOP_NAMED_CURVE_DEFINITIONS } from '../../data/combat/hitStopCurveCatalog.generated';
import {
  assertEditableValue,
  assertEditableDefinitionField,
} from '../definition-editor/definitionFieldRuntime';
import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { validateTimeScaleCurve } from '../../core/game-data/validation/timeScaleCurve';

const key = (
  time: number,
  value = 1,
  rest: Partial<TimeScaleCurveKeyDefinition> = {},
): TimeScaleCurveKeyDefinition => ({
  time,
  value,
  inTangent: 0,
  outTangent: 0,
  weightedMode: 0,
  inWeight: 0.25,
  outWeight: 0.75,
  ...rest,
});
const field = actionNodeSchemas.startTimeDilation.fields.find(
  field => field.path.at(-1) === 'curve',
)!;
it('shares the guarded merged time-dilation and hit-stop definitions with runtime', () => {
  expect(Object.keys(timeScaleCurveDefinitions).sort()).toEqual(
    [
      ...Object.keys(TIME_DILATION_NAMED_CURVE_DEFINITIONS),
      ...Object.keys(HIT_STOP_NAMED_CURVE_DEFINITIONS),
    ].sort(),
  );
  expect(Object.keys(timeScaleCurveDefinitions).sort()).toEqual(
    [...timeDilationRuntimeConfig.curves!.keys()].sort(),
  );
  for (const name of Object.keys(timeScaleCurveDefinitions))
    expect(() =>
      assertTimeScaleCurveSelection(
        undefined,
        { kind: 'named', key: name },
        timeScaleCurveDefinitions,
      ),
    ).not.toThrow();
});
it('accepts out-of-range progress, unclamped weights, inactive weights, and both infinite tangents', () => {
  const next = {
    kind: 'inline',
    keys: [
      key(-2, -3, { inTangent: Infinity, outTangent: -Infinity, inWeight: -2, outWeight: 4 }),
      key(3),
    ],
  };
  expect(() => assertTimeScaleCurveValue(undefined, next)).not.toThrow();
  expect(() => assertEditableValue(field.valueSchema!, undefined, next)).not.toThrow();
  expect(next.keys[0]).toEqual(
    key(-2, -3, { inTangent: Infinity, outTangent: -Infinity, inWeight: -2, outWeight: 4 }),
  );
});
it.each(
  [
    [],
    [key(0), key(0)],
    [key(2), key(1)],
    [key(0, NaN)],
    [key(Infinity)],
    [key(0, 1, { inWeight: Infinity })],
    [key(0, 1, { outTangent: NaN })],
    [key(0, 1, { weightedMode: 4 as 0 })],
  ].map(keys => ({ keys })),
)('rejects invalid keys without repairing or sorting: %j', ({ keys }) => {
  const next = { kind: 'inline', keys };
  const issues: { path: string; message: string }[] = [];
  validateTimeScaleCurve(next, 'curve', issues);
  expect(issues.length).toBeGreaterThan(0);
  expect(() => assertTimeScaleCurveValue(undefined, next)).toThrow(issues[0]!.message);
  expect(next.keys).toBe(keys);
});
it('unknown imported names survive unchanged but cannot be newly chosen', () => {
  const previous = { kind: 'named', key: 'removed' };
  expect(() => assertTimeScaleCurveSelection(previous, { ...previous }, {})).not.toThrow();
  expect(() =>
    assertTimeScaleCurveSelection(previous, { kind: 'named', key: 'different' }, {}),
  ).toThrow('unknownSelection');
  expect(() => assertTimeScaleCurveSelection(undefined, previous, {})).toThrow('unknownSelection');
});
it('preserves imported extensions and confines the identity exception to the formal curve value', () => {
  const extension = { value: Infinity };
  const before = { kind: 'inline', extension, keys: [{ ...key(0), extension }] };
  expect(() =>
    assertTimeScaleCurveValue(before, { ...before, keys: [{ ...before.keys[0], outWeight: 5 }] }),
  ).not.toThrow();
  expect(() =>
    assertTimeScaleCurveValue(before, { ...before, extension: { value: Infinity } }),
  ).toThrow('extensions');
  expect(() =>
    assertTimeScaleCurveValue(before, {
      ...before,
      keys: [{ ...key(0), extension: { changed: true } }],
    }),
  ).toThrow('extensions');
  const named = switchTimeScaleCurveBranch(before, 'named');
  expect(named).toEqual({ kind: 'named', key: '', extension });
  const schema = {
    kind: 'object' as const,
    fields: { curve: field.valueSchema!, key: { kind: 'string' as const } },
  };
  expect(() =>
    assertEditableDefinitionField(
      schema,
      { curve: { kind: 'named', key: 'one' }, key: 'asset' },
      ['curve'],
      { kind: 'named', key: 'two' },
    ),
  ).not.toThrow();
  expect(() => assertEditableDefinitionField(schema, { key: 'asset' }, ['key'], 'other')).toThrow(
    'identity',
  );
  expect(() => assertEditableValue({ kind: 'number' }, 0, Infinity)).toThrow('finite');
  expect(() => assertEditableValue({ kind: 'opaque' }, {}, named)).toThrow('cannot');
});
it('samples the actual weighted runtime, rather than a linear approximation', () => {
  const keys = [
    key(-1, 0, { outTangent: 2, weightedMode: 2, outWeight: 0.75 }),
    key(2, 1, { inTangent: -1, weightedMode: 1, inWeight: 0.1 }),
  ];
  const runtime = compileTimeScaleCurve(keys);
  const preview = timeScaleCurvePreview(keys);
  expect(preview.x).toEqual([-1, 2]);
  for (const point of preview.paths.flat()) expect(point.value).toBe(runtime(point.time));
  expect(runtime(0.5)).not.toBeCloseTo(0.5);
  expect(preview.paths.flat().length).toBeLessThanOrEqual(520);
});
it('represents stepped discontinuities without diagonal joins and preserves exact interior-key semantics', () => {
  const keys = [
    key(0, 1, { outTangent: Infinity }),
    key(0.5, 0, { inTangent: -Infinity, outTangent: -Infinity }),
    key(1, 2),
  ];
  const runtime = compileTimeScaleCurve(keys);
  const preview = timeScaleCurvePreview(keys);
  expect(preview.jumps).toEqual([
    { time: 0.5, left: 1, right: 0, exact: runtime(0.5) },
    { time: 1, left: 0, right: 2, exact: runtime(1) },
  ]);
  expect(preview.keys).toEqual(keys.map(key => ({ time: key.time, value: runtime(key.time) })));
  expect(preview.paths[0]!.every(point => point.value === 1)).toBe(true);
  expect(preview.paths[1]!.every(point => point.value === 0)).toBe(true);
  expect(runtime(0.5)).toBe(1);
  expect(runtime(0.500001)).toBe(0);
});
it('bounds preview work without rejecting or mutating legal data too large or extreme to plot', () => {
  const keys = Array.from({ length: 129 }, (_, index) => key(index));
  expect(() => assertTimeScaleCurveValue(undefined, { kind: 'inline', keys })).not.toThrow();
  expect(() => timeScaleCurvePreview(keys)).toThrow('previewLimit');
  const extreme = [key(-Number.MAX_VALUE), key(Number.MAX_VALUE)];
  expect(() =>
    assertTimeScaleCurveValue(undefined, { kind: 'inline', keys: extreme }),
  ).not.toThrow();
  expect(() => timeScaleCurvePreview(extreme)).toThrow('previewRange');
});

it('keeps every preview sample faithful even with legal weights outside zero to one', () => {
  const keys = [
    key(-2, 2, { outTangent: 4, weightedMode: 2, outWeight: 2 }),
    key(0, 1, { inTangent: -3, weightedMode: 1, inWeight: -1 }),
    key(3, 2),
  ];
  const runtime = compileTimeScaleCurve(keys);
  const preview = timeScaleCurvePreview(keys);
  for (const point of preview.paths.flat()) expect(point.value).toBe(runtime(point.time));
  for (const point of preview.keys) expect(point.value).toBe(runtime(point.time));
});

it('curve graph and reference extensions cannot be removed by row deletion, branch switches or container replacement', () => {
  const schema = field.valueSchema!;
  for (const extension of [
    { $sequence: 'keep' },
    { actionGraph: { main: { nodes: {} }, macros: {} } },
    { kind: 'valueNode', nodeId: 'keep' },
    { kind: 'stringNode', nodeId: 'keep' },
  ]) {
    const previous = { kind: 'inline', keys: [{ ...key(0), extension }, key(1)] };
    expect(() =>
      assertTimeScaleCurveValue(previous, {
        ...previous,
        keys: [{ ...previous.keys[0], value: 2 }, previous.keys[1]],
      }),
    ).not.toThrow();
    expect(() => assertTimeScaleCurveValue(previous, { kind: 'inline', keys: [key(1)] })).toThrow(
      'boundaries',
    );
    expect(() => assertTimeScaleCurveValue(previous, { kind: 'named', key: 'first' })).toThrow(
      'boundaries',
    );
    expect(() => assertEditableValue({ kind: 'array', element: schema }, [previous], [])).toThrow(
      'cannot',
    );
    expect(() =>
      assertEditableValue(
        { kind: 'object', fields: { curve: { ...schema, optional: true } } },
        { curve: previous },
        {},
      ),
    ).toThrow('cannot');
  }
});
