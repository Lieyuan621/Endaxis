import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';
import ts from 'typescript';

const sourceRoot = fileURLToPath(new URL('../src', import.meta.url));
const strictSourceRoot = join(sourceRoot, 'source');
const compilerRoot = join(sourceRoot, 'compiler');
const commonRoots = [join(sourceRoot, 'source'), join(sourceRoot, 'compiler')];
const domainsRoot = join(sourceRoot, 'domains');

describe('游戏数据编译器架构边界', () => {
  it('工具及跨端测试自身只允许 Node 可直接擦除的语法', () => {
    // 完整测试配置包含本体集成探针；执行器的类只属于测试依赖。
    // 生产入口另由 dataContractBoundaries 的独立配置证明不加载本体。
    const configPath = join(sourceRoot, '..', 'tsconfig.json');
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, join(sourceRoot, '..'));
    const program = ts.createProgram(parsed.fileNames, {
      ...parsed.options,
      erasableSyntaxOnly: true,
    });
    // 只请求工具文件的诊断，依赖仍交给同一个 Program 解析。
    // 先检查整个应用再过滤，会为本项不约束的应用及生成数据重复执行类型检查。
    const violations = program
      .getSourceFiles()
      .filter(file => !relative(join(sourceRoot, '..'), file.fileName).startsWith('..'))
      .flatMap(file => program.getSemanticDiagnostics(file))
      .filter(diagnostic => diagnostic.code === 1294);
    expect(
      violations.map(diagnostic => `${diagnostic.file!.fileName}: ${diagnostic.messageText}`),
    ).toEqual([]);
    // 此项包含整棵跨端 TypeScript 图的语义检查，本机单独执行也可能超过 20 秒。
  }, 120_000);

  it('禁止公共层反向依赖领域适配器', () => {
    const violations = commonRoots.flatMap(root =>
      sourceFiles(root).flatMap(path => {
        const content = readFileSync(path, 'utf8');
        return /from\s+['"][^'"]*domains\//.test(content) ? [display(path)] : [];
      }),
    );
    expect(violations).toEqual([]);
  });

  it('禁止严格来源层依赖编译器，并禁止领域之间横向耦合', () => {
    const sourceViolations = sourceFiles(strictSourceRoot).flatMap(path => {
      const content = readFileSync(path, 'utf8');
      return /from\s+['"][^'"]*compiler\//.test(content) ? [display(path)] : [];
    });
    const domainViolations = sourceFiles(domainsRoot).flatMap(path => {
      const content = readFileSync(path, 'utf8');
      const ownDomain = relative(domainsRoot, path).split(/[\\/]/)[0];
      const imports = [...content.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match => match[1]!);
      const importsSibling = imports.some(specifier =>
        ['operator', 'weapon', 'equipment'].some(
          domain =>
            domain !== ownDomain &&
            (specifier.includes(`/domains/${domain}/`) || specifier.startsWith(`../${domain}/`)),
        ),
      );
      return importsSibling ? [display(path)] : [];
    });
    expect([...sourceViolations, ...domainViolations]).toEqual([]);
    expect(sourceFiles(compilerRoot).length).toBeGreaterThan(0);
  });

  it('禁止领域层重新声明公共战斗步骤、条件、序列或 Buff 定义', () => {
    const declaration =
      /export\s+(?:type|interface)\s+Compiled(?:Buff|Combat|Action|Condition|Sequence)(?:\w)*(?:Step|Condition|Sequence|Definition)(?:Source)?\b/;
    const violations = sourceFiles(domainsRoot).flatMap(path => {
      const content = readFileSync(path, 'utf8');
      return declaration.test(content) ? [display(path)] : [];
    });
    expect(violations).toEqual([]);
  });

  it('禁止领域层按原生 Action 类型建立第二个分派入口', () => {
    const violations = sourceFiles(domainsRoot).flatMap(path => {
      const content = readFileSync(path, 'utf8');
      const dispatchesNativeAction =
        /switch\s*\([^)]*(?:\$type|actionType|nativeType)[^)]*\)/.test(content) ||
        /(?:parse|compile)(?:Known)?NativeAction(?:Leaf|Node|Source)/.test(content);
      return dispatchesNativeAction ? [display(path)] : [];
    });
    expect(violations).toEqual([]);
  });

  it('CardSkill 属性参数绑定只能在公共编译层实现，领域只选择等级与装配', () => {
    const violations = sourceFiles(domainsRoot).flatMap(path => {
      const content = readFileSync(path, 'utf8');
      const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
      let readsCardAttributes = false;
      function visit(node: ts.Node): void {
        if (
          (ts.isPropertyAccessExpression(node) && node.name.text === 'cardAttributeModifiers') ||
          (ts.isElementAccessExpression(node) &&
            ts.isStringLiteral(node.argumentExpression) &&
            node.argumentExpression.text === 'cardAttributeModifiers')
        )
          readsCardAttributes = true;
        ts.forEachChild(node, visit);
      }
      visit(source);
      return readsCardAttributes ? [display(path)] : [];
    });
    expect(violations).toEqual([]);
  });

  it('禁止领域层直接取得公共原生属性解释能力', () => {
    const violations = sourceFiles(domainsRoot).flatMap(path => {
      const content = readFileSync(path, 'utf8');
      const importsCommonNativeAttributeSource = [...content.matchAll(/from\s+['"]([^'"]+)['"]/g)]
        .map(match => match[1]!)
        .some(specifier => /(?:^|\/)source\/attributeModifiers\.ts$/.test(specifier));
      return importsCommonNativeAttributeSource ? [display(path)] : [];
    });
    expect(violations).toEqual([]);
  });
});

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return extname(entry.name) === '.ts' ? [path] : [];
  });
}

function display(path: string): string {
  return relative(sourceRoot, path).replaceAll('\\', '/');
}
