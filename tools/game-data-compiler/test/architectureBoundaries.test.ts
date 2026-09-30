import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const sourceRoot = fileURLToPath(new URL('../src', import.meta.url));
const strictSourceRoot = join(sourceRoot, 'source');
const commonRoots = [join(sourceRoot, 'source'), join(sourceRoot, 'compiler')];
const domainsRoot = join(sourceRoot, 'domains');

describe('游戏数据编译器架构边界', () => {
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
