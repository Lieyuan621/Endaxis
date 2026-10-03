import { assertFiniteFieldValue } from '../../core/editor/resolveDefinitionSchema.ts';
import type {
  TimeScaleCurveDefinition,
  TimeScaleCurveKeyDefinition,
} from '../../../packages/game-data-contract/src/conditions.ts';
import { validateTimeScaleCurve } from '../../core/game-data/validation/timeScaleCurve.ts';

export type TimeScaleCurveCatalog = Readonly<
  Record<string, readonly TimeScaleCurveKeyDefinition[]>
>;
const curveFields = new Set(['kind', 'key', 'keys']);
const keyFields = new Set([
  'time',
  'value',
  'inTangent',
  'outTangent',
  'weightedMode',
  'inWeight',
  'outWeight',
]);
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function extensions(value: unknown, fields: ReadonlySet<string>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(object(value)).filter(([key]) => !fields.has(key)));
}
function sameExtensions(before: unknown, next: unknown, fields: ReadonlySet<string>): boolean {
  const a = extensions(before, fields);
  const b = extensions(next, fields);
  return (
    Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every(key => Object.hasOwn(b, key) && Object.is(a[key], b[key]))
  );
}
/** Imported graph/resource extensions keep the same identity and multiplicity through edits. */
function curveBoundaryValues(value: unknown): unknown[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  if (
    ['valueNode', 'conditionNode', 'stringNode'].includes(String(record.kind)) &&
    Object.hasOwn(record, 'nodeId')
  )
    return [value];
  return Object.entries(record).flatMap(([key, child]) =>
    key === 'actionGraph' || key === '$sequence' ? [child] : curveBoundaryValues(child),
  );
}
export function timeScaleCurveBoundaryValues(value: unknown): unknown[] {
  assertFiniteFieldValue(value);
  return curveBoundaryValues(value);
}
function assertCurveBoundaries(previous: unknown, next: unknown): void {
  const remaining = timeScaleCurveBoundaryValues(previous);
  for (const token of timeScaleCurveBoundaryValues(next)) {
    const index = remaining.findIndex(old => Object.is(old, token));
    if (index < 0) throw new Error('curve graph/resource boundaries must be preserved');
    remaining.splice(index, 1);
  }
  if (remaining.length) throw new Error('curve graph/resource boundaries must be preserved');
}

/** Preserve imported extensions by identity; only the seven declared key fields are editable. */
export function assertTimeScaleCurveValue(
  previous: unknown,
  next: unknown,
): asserts next is TimeScaleCurveDefinition {
  const issues: { path: string; message: string }[] = [];
  validateTimeScaleCurve(next, 'curve', issues);
  if (issues.length) throw new Error(`${issues[0]!.path}: ${issues[0]!.message}`);
  if (Object.is(previous, next)) return;
  assertCurveBoundaries(previous, next);
  if (!sameExtensions(previous, next, curveFields))
    throw new Error('curve extensions must be preserved');
  const curve = next as TimeScaleCurveDefinition;
  if (curve.kind !== 'inline') return;
  const before =
    object(previous).kind === 'inline' && Array.isArray(object(previous).keys)
      ? (object(previous).keys as unknown[])
      : [];
  const used = new Set<number>();
  for (const key of curve.keys) {
    if (!Object.keys(extensions(key, keyFields)).length) continue;
    const index = before.findIndex(
      (old, index) => !used.has(index) && sameExtensions(old, key, keyFields),
    );
    if (index < 0) throw new Error('curve key extensions must be preserved');
    used.add(index);
  }
  // Rows have no domain identity. Explicit removal/replacement may discard ordinary
  // metadata; leaf edits preserve it in the UI. Never infer those operations from count.
}
/** Unknown imported names may remain unchanged; new selections require the current merged catalog. */
export function assertTimeScaleCurveSelection(
  previous: unknown,
  next: unknown,
  catalog: TimeScaleCurveCatalog,
): asserts next is TimeScaleCurveDefinition {
  assertTimeScaleCurveValue(previous, next);
  if (
    next.kind === 'named' &&
    !Object.hasOwn(catalog, next.key) &&
    !(object(previous).kind === 'named' && object(previous).key === next.key)
  )
    throw new Error('timeScaleCurve.unknownSelection');
}
export function switchTimeScaleCurveBranch(
  previous: unknown,
  kind: 'named' | 'inline',
): TimeScaleCurveDefinition {
  return {
    ...extensions(previous, curveFields),
    ...(kind === 'named' ? { kind, key: '' } : { kind, keys: [] }),
  };
}
/** Only an explicit Add key action uses these defaults; existing data is never normalized. */
export function newTimeScaleCurveKey(
  keys: readonly TimeScaleCurveKeyDefinition[],
): TimeScaleCurveKeyDefinition {
  return {
    time: keys.length ? keys.at(-1)!.time + 1 : 0,
    value: 1,
    inTangent: 0,
    outTangent: 0,
    weightedMode: 0,
    inWeight: 1 / 3,
    outWeight: 1 / 3,
  };
}
