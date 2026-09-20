import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { expect, it } from 'vitest';

it('切面数据不反向依赖战斗执行模块，包括类型导入和内联类型引用', () => {
  const directory = new URL('./', import.meta.url);
  const violations: string[] = [];
  for (const name of readdirSync(directory)) {
    if (!name.endsWith('.ts') || name.endsWith('.test.ts')) continue;
    const file = new URL(name, directory);
    const source = ts.createSourceFile(
      name,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const check = (specifier: string) => {
      if (!specifier.startsWith('.')) {
        violations.push(`${name}: ${specifier}`);
        return;
      }
      const target = fileURLToPath(new URL(specifier, file)).replaceAll('\\', '/');
      if (
        !target.includes('/core/combat/state/') &&
        !target.includes('/core/game-data/') &&
        !target.includes('/packages/game-data-contract/')
      )
        violations.push(`${name}: ${specifier}`);
    };
    const visit = (node: ts.Node) => {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        check(node.moduleSpecifier.text);
      if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)
      )
        check(node.argument.literal.text);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  expect(violations).toEqual([]);
});
