import fs from 'node:fs';
import ts from 'typescript';
import { gameplayTagIdFromPath } from '../../source/nativeGameplayTags.ts';

/**
 * 从生成模块的 TypeScript 语法树读取优先级目录。
 * 不执行生成代码，也不依赖 Prettier 的引号、缩进或换行；生成模块仍是运行时与转换器的唯一依据。
 */
export function readGeneratedTimeDilationPriorities(
  file: string,
  text = fs.readFileSync(file, 'utf8'),
): Map<number, number> {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let initializer: ts.Expression | undefined;
  source.forEachChild(node => {
    if (!ts.isVariableStatement(node)) return;
    for (const declaration of node.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === 'TIME_DILATION_PRIORITY_DEFINITIONS'
      ) {
        if (initializer !== undefined)
          throw new Error(`${file}: duplicate TIME_DILATION_PRIORITY_DEFINITIONS`);
        initializer = declaration.initializer;
      }
    }
  });
  if (initializer === undefined)
    throw new Error(`${file}: TIME_DILATION_PRIORITY_DEFINITIONS not found`);

  const expression = unwrap(initializer);
  if (!ts.isCallExpression(expression) || !isObjectFreeze(expression.expression))
    throw new Error(`${file}: priority catalog must use Object.freeze`);
  if (expression.arguments.length !== 1)
    throw new Error(`${file}: priority catalog Object.freeze expects one argument`);
  const array = unwrap(expression.arguments[0]!);
  if (!ts.isArrayLiteralExpression(array) || array.elements.length === 0)
    throw new Error(`${file}: priority catalog must be a non-empty array literal`);

  const rows = array.elements.map((element, index) => {
    const item = unwrap(element);
    if (!ts.isObjectLiteralExpression(item))
      throw new Error(`${file}: priority[${index}] must be an object literal`);
    let tagPath: string | undefined;
    let value: number | undefined;
    const keys = new Set<string>();
    for (const property of item.properties) {
      if (!ts.isPropertyAssignment(property) || !isPlainPropertyName(property.name))
        throw new Error(`${file}: priority[${index}] contains unsupported property syntax`);
      const key = property.name.text;
      if (keys.has(key)) throw new Error(`${file}: priority[${index}] duplicates '${key}'`);
      keys.add(key);
      if (key === 'tagPath') tagPath = readString(property.initializer, file, index, key);
      else if (key === 'value') value = readNumber(property.initializer, file, index, key);
      else throw new Error(`${file}: priority[${index}] contains unknown field '${key}'`);
    }
    if (tagPath === undefined || value === undefined || keys.size !== 2)
      throw new Error(`${file}: priority[${index}] requires tagPath and value`);
    if (!tagPath.startsWith('TimeDilation/Priority/'))
      throw new Error(`${file}: priority[${index}] has invalid path '${tagPath}'`);
    return [gameplayTagIdFromPath(tagPath), value] as const;
  });
  if (new Set(rows.map(([tagId]) => tagId)).size !== rows.length)
    throw new Error(`${file}: duplicate time-dilation priority identity`);
  return new Map(rows);
}

function unwrap(value: ts.Expression): ts.Expression {
  let current = value;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function isObjectFreeze(value: ts.Expression): boolean {
  return (
    ts.isPropertyAccessExpression(value) &&
    ts.isIdentifier(value.expression) &&
    value.expression.text === 'Object' &&
    value.name.text === 'freeze'
  );
}

function isPlainPropertyName(value: ts.PropertyName): value is ts.Identifier | ts.StringLiteral {
  return ts.isIdentifier(value) || ts.isStringLiteral(value);
}

function readString(value: ts.Expression, file: string, index: number, key: string): string {
  const expression = unwrap(value);
  if (!ts.isStringLiteral(expression) || expression.text.length === 0)
    throw new Error(`${file}: priority[${index}].${key} must be a non-empty string literal`);
  return expression.text;
}

function readNumber(value: ts.Expression, file: string, index: number, key: string): number {
  const expression = unwrap(value);
  const result = ts.isNumericLiteral(expression)
    ? Number(expression.text)
    : ts.isPrefixUnaryExpression(expression) &&
        expression.operator === ts.SyntaxKind.MinusToken &&
        ts.isNumericLiteral(expression.operand)
      ? -Number(expression.operand.text)
      : Number.NaN;
  if (!Number.isFinite(result))
    throw new Error(`${file}: priority[${index}].${key} must be a finite numeric literal`);
  return result;
}
