import ts from 'typescript';
import {
  requireArray,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
} from '../../source/primitives.ts';

/** 图标保留原生文件名，统一平铺到 icons；同名资源共用一份。 */
export function iconPath(value: unknown, context: string): string {
  if (!value) return '';
  const raw = requireNonEmptyString(value, context);
  const native = raw
    .replaceAll('\\', '/')
    .replace(/^\/+/, '')
    .replace(/^(?:public\/)?images\//, '')
    .replace(/^assets\/beyond\/dynamicassets\/gameplay\/ui\/sprites\//, '')
    .replace(/\.(?:png|webp)$/i, '')
    .toLowerCase();
  if (!/^[a-z0-9_-]+(?:\/[a-z0-9_-]+)+$/.test(native))
    throw new Error(`${context}: unsafe native sprite path: ${raw}`);
  return `/icons/${native.split('/').at(-1)}.webp`;
}

export function normalizeRichText(text: string, context: string, plain = false): string {
  let depth = 0;
  const result = text.replace(/\r\n?/g, '\n').replace(/<[^>]*>/g, tag => {
    if (tag === '</>') {
      if (depth-- === 0) throw new Error(`${context}: unmatched closing tag`);
      return plain ? '' : tag;
    }
    if (/^<[@#][A-Za-z0-9_.-]+>$/.test(tag)) {
      depth++;
      return plain ? '' : tag;
    }
    const image = /^<image="([^"]+)"(?:\s+scale=[0-9.]+)?>$/.exec(tag);
    if (image) {
      const path = iconPath(image[1], context);
      return plain ? '' : `<image="${path}">`;
    }
    throw new Error(`${context}: unexpected rich text tag: ${tag}`);
  });
  if (depth) throw new Error(`${context}: unclosed rich text tag`);
  return result.trim();
}

export function resolveText(value: unknown, texts: Readonly<Record<string, unknown>>): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  const ref = requireRecord(value, 'text reference');
  if (typeof ref.text === 'string' && ref.text) return ref.text;
  const result = texts[String(ref.id ?? 0)];
  return typeof result === 'string' ? result : '';
}

export function hasTextReference(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return !!value;
  const ref = requireRecord(value, 'text reference');
  return !!(ref.text || ref.id);
}

export function addBlackboardEntries(
  values: Record<string, number>,
  source: unknown,
  context: string,
): void {
  if (source == null) return;
  for (const [index, value] of requireArray(source, context).entries()) {
    const item = requireRecord(value, `${context}[${index}]`);
    if (Object.keys(item).some(key => !['key', 'value', 'valueStr'].includes(key)))
      throw new Error(`${context}: unexpected blackboard fields`);
    if (item.valueStr != null && item.valueStr !== '')
      throw new Error(`${context}: unexpected non-empty valueStr`);
    values[requireNonEmptyString(item.key, context)] = requireNumber(item.value, context);
  }
}

export function parsePlaceholder(inner: string, context: string): [string, string] {
  const parts = inner.split(':');
  const expression = parts[0].trim();
  if (parts.length > 2 || !/[a-zA-Z_][a-zA-Z0-9_]*/.test(expression))
    throw new Error(`${context}: unexpected placeholder syntax: {${inner}}`);
  return [expression, parts[1]?.trim() ?? ''];
}

/** 只解释数字、黑板变量及四则运算；不执行来源文本。 */
export function evaluateExpression(
  expression: string,
  values: Readonly<Record<string, number>>,
  context: string,
): number {
  const lowered: Record<string, number> = {};
  for (const [key, value] of Object.entries(values)) {
    if (Object.hasOwn(lowered, key.toLowerCase()) && lowered[key.toLowerCase()] !== value)
      throw new Error(`${context}: conflicting case-insensitive blackboard key: ${key}`);
    lowered[key.toLowerCase()] = requireNumber(value, context);
  }
  const source = ts.createSourceFile(
    'placeholder.ts',
    `(${expression})`,
    ts.ScriptTarget.Latest,
    true,
  );
  const statement = source.statements[0];
  // Parser recovery must not turn a malformed expression into a valid partial expression.
  const diagnostics = (source as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] })
    .parseDiagnostics;
  if (
    diagnostics.length ||
    source.statements.length !== 1 ||
    !statement ||
    !ts.isExpressionStatement(statement)
  )
    throw new Error(`${context}: invalid placeholder expression: ${expression}`);
  const visit = (node: ts.Node): number => {
    if (ts.isParenthesizedExpression(node)) return visit(node.expression);
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (ts.isIdentifier(node) && Object.hasOwn(lowered, node.text.toLowerCase()))
      return lowered[node.text.toLowerCase()];
    if (ts.isPrefixUnaryExpression(node)) {
      if (node.operator === ts.SyntaxKind.PlusToken) return visit(node.operand);
      if (node.operator === ts.SyntaxKind.MinusToken) return -visit(node.operand);
    }
    if (ts.isBinaryExpression(node)) {
      const left = visit(node.left),
        right = visit(node.right);
      switch (node.operatorToken.kind) {
        case ts.SyntaxKind.PlusToken:
          return left + right;
        case ts.SyntaxKind.MinusToken:
          return left - right;
        case ts.SyntaxKind.AsteriskToken:
          return left * right;
        case ts.SyntaxKind.SlashToken:
          if (right === 0) throw new Error(`${context}: division by zero`);
          return left / right;
      }
    }
    throw new Error(
      `${context}: unsupported placeholder expression or unknown variable: ${node.getText(source)}`,
    );
  };
  const result = visit(statement.expression);
  if (!Number.isFinite(result)) throw new Error(`${context}: non-finite placeholder result`);
  return result;
}

/** 保留原导出器的 ties-to-even 十进制舍入，包括二进制浮点恰好处于中点的情况。 */
function fixedEven(value: number, digits: number): string {
  const buffer = new DataView(new ArrayBuffer(8));
  buffer.setFloat64(0, Math.abs(value));
  const bits = buffer.getBigUint64(0);
  const exponent = Number((bits >> 52n) & 2047n);
  let numerator = (bits & ((1n << 52n) - 1n)) | (exponent ? 1n << 52n : 0n);
  numerator *= 10n ** BigInt(digits);
  const power = (exponent || 1) - 1023 - 52;
  const denominator = power < 0 ? 1n << BigInt(-power) : 1n;
  if (power > 0) numerator <<= BigInt(power);
  let rounded = numerator / denominator;
  const remainder = numerator % denominator;
  if (remainder * 2n > denominator || (remainder * 2n === denominator && rounded % 2n === 1n))
    rounded++;
  const text = rounded.toString().padStart(digits + 1, '0');
  return `${value < 0 || Object.is(value, -0) ? '-' : ''}${digits ? `${text.slice(0, -digits)}.${text.slice(-digits)}` : text}`;
}

export function formatPlaceholder(value: number, format: string, context: string): string {
  if (!Number.isFinite(value)) throw new Error(`${context}: non-finite placeholder result`);
  if (!format) return String(value);
  const match = /^0(?:\.(0+|#+))?(%)?$/.exec(format);
  if (!match) throw new Error(`${context}: unexpected placeholder format: ${format}`);
  const result = fixedEven(match[2] ? value * 100 : value, match[1]?.length ?? 0);
  const formatted = match[1]?.startsWith('#')
    ? result.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
    : result;
  return `${formatted === '-0' && !match[1] ? '0' : formatted}${match[2] ?? ''}`;
}

export function replacePlaceholders(
  text: string,
  values: Readonly<Record<string, number>>,
  context: string,
): string {
  return text.replace(/\{([^}]+)\}/g, (_, inner: string) => {
    const [expr, format] = parsePlaceholder(inner, context);
    // Consumable descriptions use buffId\key names; map them to ordinary identifiers before parsing.
    const scoped: Record<string, number> = { ...values };
    let index = 0;
    const expression = expr.replace(/[A-Za-z0-9_]+\\[A-Za-z0-9_]+/g, key => {
      const name = `__locale${index++}`;
      const value = values[key.toLowerCase()];
      if (value === undefined) throw new Error(`${context}: unknown consumable value ${key}`);
      scoped[name] = value;
      return name;
    });
    return formatPlaceholder(evaluateExpression(expression, scoped, context), format, context);
  });
}
