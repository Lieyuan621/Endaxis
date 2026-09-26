import { validateActionGraphOwner } from '../../../../../src/core/action-graph/actionGraphValidation.ts';
import type { ActionGraphResourceDefinition } from '../../../../../packages/game-data-contract/src/actionGraph.ts';

type RecordValue = Readonly<Record<string, unknown>>;

export interface RenderContext {
  readonly helpers: Set<string>;
}

export interface RawExpression {
  readonly rawExpression: string;
}

export function createRenderContext(): RenderContext {
  return { helpers: new Set() };
}

export function raw(expression: string): RawExpression {
  return { rawExpression: expression };
}

function isRaw(value: unknown): value is RawExpression {
  return typeof value === 'object' && value !== null && 'rawExpression' in value;
}

/** 生成文件须保留阶跃曲线使用的无穷值，但不能写入 NaN。 */
export function assertFiniteNumbers(value: unknown, path: string): void {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) throw new Error(`cannot render NaN at ${path}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFiniteNumbers(item, `${path}[${index}]`));
    return;
  }
  if (value === null || typeof value !== 'object' || isRaw(value)) return;
  for (const [key, item] of Object.entries(value)) assertFiniteNumbers(item, `${path}.${key}`);
}

/** 只负责 TS 输出；程序必须在来源编译阶段完成构图，禁止在渲染时补转。 */
export function renderValue(value: unknown, context: RenderContext): string {
  if (isRaw(value)) return value.rawExpression;
  if (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    sameKeys(Object.keys(value), ['steps']) &&
    Array.isArray((value as RecordValue).steps)
  ) {
    throw new Error(
      'renderer received an action tree; compile the resource graph before rendering',
    );
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === null || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (value === Number.POSITIVE_INFINITY) return 'Number.POSITIVE_INFINITY';
    if (value === Number.NEGATIVE_INFINITY) return 'Number.NEGATIVE_INFINITY';
    if (Number.isNaN(value)) throw new Error('cannot render NaN');
    return renderNumber(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(item => renderValue(item, context)).join(', ')}]`;
  }
  const record = requireRecord(value);
  return `{${Object.entries(record)
    .map(([key, item]) => `${JSON.stringify(key)}: ${renderValue(item, context)}`)
    .join(', ')}}`;
}

/** 图节点使用与既有生成结果相同的浮点精度。 */
export function renderGraphValue(value: unknown, property?: string): string {
  if (typeof value === 'number') {
    if (value === Infinity) return 'Number.POSITIVE_INFINITY';
    if (value === -Infinity) return 'Number.NEGATIVE_INFINITY';
    if (Number.isNaN(value)) throw new Error('cannot render NaN');
    return property === 'attackScale'
      ? String(Number((value * 100).toPrecision(15)) / 100)
      : renderNumber(value);
  }
  if (value === undefined) return 'undefined';
  if (Array.isArray(value))
    return `[${value.map(item => renderGraphValue(item, property)).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .map(([key, item]) => `${JSON.stringify(key)}:${renderGraphValue(item, key)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

/** 输出已经构建好的独立资源图；渲染器不创建节点、不提取宏。 */
export function renderIndependentGraphDefinition(
  value: RecordValue,
  graphExpression = 'actionGraph',
) {
  assertFiniteNumbers(value, '$');
  if (
    !value.actionGraph ||
    typeof value.actionGraph !== 'object' ||
    !('main' in value.actionGraph) ||
    !('macros' in value.actionGraph)
  )
    throw new Error('independent resource must have a completed actionGraph before rendering');
  const actionGraph = value.actionGraph as ActionGraphResourceDefinition;
  validateActionGraphOwner({ ...value, actionGraph }, 'independent graph definition');
  const context = createRenderContext();
  const definition = renderValue({ ...value, actionGraph: raw(graphExpression) }, context);
  return {
    definition,
    graph: renderGraphValue(actionGraph),
    helpers: [...context.helpers].sort(),
  };
}

function renderNumber(value: number): string {
  return String(Number(value.toPrecision(15)));
}

function sameKeys(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length && expected.every(key => actual.includes(key));
}

function requireRecord(value: unknown): RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('rendered value: expected object');
  return value as RecordValue;
}
