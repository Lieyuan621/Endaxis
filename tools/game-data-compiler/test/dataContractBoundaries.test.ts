import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const contractRoot = join(root, 'packages/game-data-contract/src');
const compilerRoot = join(root, 'tools/game-data-compiler');
const toolsRoot = join(root, 'tools');
const productRoot = join(root, 'src');

/** Vue 的模板和样式不是 TypeScript；保留普通 script 和 script setup 的检查。 */
function scriptSources(path: string, text: string): string[] {
  return path.endsWith('.vue')
    ? [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]!)
    : [text];
}

function inside(file: string, directory: string): boolean {
  const path = relative(directory, file);
  return path === '' || (!path.startsWith('..') && !path.includes(':'));
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : /\.(ts|vue)$/.test(entry.name) ? [path] : [];
  });
}

/** 类型导入和动态导入同样是依赖；字符串中的生成代码不算当前模块的依赖。 */
function moduleReferences(text: string): string[] {
  const file = ts.createSourceFile('source.ts', text, ts.ScriptTarget.Latest, true);
  const references: string[] = [];
  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      references.push(node.moduleSpecifier.text);
    }
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    ) {
      references.push(node.argument.literal.text);
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      const argument = node.arguments[0];
      references.push(
        argument && ts.isStringLiteral(argument) ? argument.text : '<computed-import>',
      );
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return references;
}

function loadProgram(configFile: string): ts.Program {
  const config = ts.readConfigFile(configFile, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configFile));
  expect(parsed.errors).toEqual([]);
  return ts.createProgram(parsed.fileNames, parsed.options);
}

describe('独立游戏数据契约边界', () => {
  it('条件与叶子投影不得直接或间接回流到上层编排，包括类型依赖', () => {
    const directory = join(compilerRoot, 'src/compiler');
    const layers = new Map([
      [join(directory, 'combatProjectionCommon.ts'), 0],
      [join(directory, 'combatConditionProjection.ts'), 1],
      [join(directory, 'combatActionLeafProjection.ts'), 1],
      [join(directory, 'combatEntityAndTimeProjection.ts'), 2],
      [join(directory, 'buffRuntimeProjection.ts'), 3],
    ]);
    const graph = new Map(
      sourceFiles(join(compilerRoot, 'src')).map(path => [
        path,
        moduleReferences(readFileSync(path, 'utf8'))
          .filter(specifier => specifier.startsWith('.'))
          .map(specifier => resolve(dirname(path), specifier)),
      ]),
    );
    const violations: string[] = [];
    for (const [start, layer] of layers) {
      const visited = new Set<string>();
      const visit = (path: string, chain: readonly string[]): void => {
        for (const dependency of graph.get(path) ?? []) {
          const next = [...chain, dependency];
          const targetLayer = layers.get(dependency);
          if (targetLayer !== undefined && targetLayer >= layer) {
            violations.push(next.map(item => relative(directory, item)).join(' -> '));
          }
          if (!visited.has(dependency)) {
            visited.add(dependency);
            visit(dependency, next);
          }
        }
      };
      visit(start, [start]);
    }
    expect(violations).toEqual([]);
  });

  it('依赖扫描覆盖类型、转导出及动态引用，但不把生成字符串误判成 import', () => {
    expect(
      moduleReferences(`
      import type { A } from './a.ts';
      export { B } from './b.ts';
      type C = import('./c.ts').C;
      const d = import('./d.ts');
      const e = require('./e.ts');
      const f = import(variable);
      const generated = "import { G } from './g.ts'";
    `),
    ).toEqual(['./a.ts', './b.ts', './c.ts', './d.ts', './e.ts', '<computed-import>']);
  });

  it('Vue 扫描保留两个脚本块，不解析模板和样式', () => {
    const scripts = scriptSources(
      'component.vue',
      `
      <template><div>import('./template.ts')</div></template>
      <script lang="ts">import './normal.ts';</script>
      <script setup lang="ts">type T = import('./setup.ts').T;</script>
      <style>.label::after { content: "import('./style.ts')"; }</style>
    `,
    );
    expect(scripts.flatMap(moduleReferences)).toEqual(['./normal.ts', './setup.ts']);
  });

  it('契约只能依赖包内声明，不得包含运行类或回调字段', () => {
    const violations: string[] = [];
    for (const path of sourceFiles(contractRoot)) {
      const text = readFileSync(path, 'utf8');
      for (const specifier of moduleReferences(text)) {
        if (
          !specifier.startsWith('.') ||
          !inside(resolve(dirname(path), specifier), contractRoot)
        ) {
          violations.push(`${relative(root, path)}: ${specifier}`);
        }
      }
      const ast = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
      function visit(node: ts.Node): void {
        if (
          ts.isClassDeclaration(node) ||
          ts.isFunctionDeclaration(node) ||
          ts.isFunctionExpression(node) ||
          ts.isArrowFunction(node) ||
          ts.isFunctionTypeNode(node) ||
          ts.isMethodSignature(node) ||
          ts.isCallSignatureDeclaration(node)
        ) {
          violations.push(`${relative(root, path)}: 运行类或回调不能进入数据契约`);
        }
        ts.forEachChild(node, visit);
      }
      ast.statements.forEach(visit);
    }
    expect(violations).toEqual([]);
  });

  it('契约的源码依赖闭包只包含契约自身', () => {
    const program = loadProgram(join(contractRoot, '../tsconfig.json'));
    const external = program
      .getSourceFiles()
      .filter(file => !file.isDeclarationFile && !inside(file.fileName, contractRoot));
    expect(external.map(file => file.fileName)).toEqual([]);
  });

  it('转换器只共享主包的纯逻辑，不加载应用状态、UI 或正式数据仓库', () => {
    const program = loadProgram(join(compilerRoot, 'tsconfig.production.json'));
    const sharedDirectories = [join(productRoot, 'core/action-graph')];
    const sharedFiles = [
      join(productRoot, 'core/game-data/definitionGuards.ts'),
      join(productRoot, 'core/mechanics/combatNumbers.ts'),
      // Graph input discovery shares finite, pure schema projection. Keep this an
      // explicit file allowlist; no UI, application state, or catalog imports.
      join(productRoot, 'core/editor/fieldSemantics.ts'),
      join(productRoot, 'core/editor/fieldSchema.ts'),
      join(productRoot, 'core/editor/resolveDefinitionSchema.ts'),
      join(productRoot, 'core/editor/selectDefinitionSchema.ts'),
      join(productRoot, 'core/game-data/validation/timeScaleCurve.ts'),
    ];
    const violations = program
      .getSourceFiles()
      .filter(
        file =>
          !file.isDeclarationFile &&
          ![compilerRoot, contractRoot, ...sharedDirectories].some(directory =>
            inside(file.fileName, directory),
          ) &&
          !sharedFiles.some(path => relative(path, file.fileName) === ''),
      );
    expect(violations.map(file => relative(root, file.fileName))).toEqual([]);
  });

  it('本体生产代码不得引用命令行工具或游戏数据编译器，跨端测试是显式例外', () => {
    const violations: string[] = [];
    for (const path of sourceFiles(productRoot).filter(path => !/\.(test|spec)\.ts$/.test(path))) {
      const text = readFileSync(path, 'utf8');
      if (!/game-data-compiler|tools[/\\]/.test(text)) continue;
      // Vue 文件只扫描 script / script setup，不能拿整个模板当 TypeScript 解析。
      const scripts = scriptSources(path, text);
      for (const specifier of scripts.flatMap(moduleReferences)) {
        if (
          specifier.includes('game-data-compiler') ||
          (specifier.startsWith('.') && inside(resolve(dirname(path), specifier), toolsRoot))
        ) {
          violations.push(`${relative(root, path)}: ${specifier}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
