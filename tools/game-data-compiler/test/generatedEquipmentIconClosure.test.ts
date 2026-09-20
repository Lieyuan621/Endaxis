import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const generatedRoot = resolve('src/data/equipment/generated');

describe('generated equipment icon closure', () => {
  it('gives every generated gear an exported WebP reference', () => {
    const failures = listFiles(generatedRoot)
      .filter(file => file.endsWith('.generated.ts') && !file.endsWith('index.generated.ts'))
      .flatMap(file => {
        const source = readFileSync(file, 'utf8');
        const slug = /slug: '([^']+)'/.exec(source)?.[1] ?? file;
        const iconPath = /iconPath: '([^']+)'/.exec(source)?.[1];
        if (iconPath === undefined) return [`${slug}: missing iconPath`];
        return existsSync(resolve('public', iconPath.replace(/^\//, '')))
          ? []
          : [`${slug}: ${iconPath}`];
      });
    expect(failures).toEqual([]);
  });
});

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const child = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(child) : [child];
  });
}
