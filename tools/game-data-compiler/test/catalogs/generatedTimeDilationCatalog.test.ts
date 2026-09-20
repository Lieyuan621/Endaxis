import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readGeneratedTimeDilationPriorities } from '../../src/compiler/catalogs/generatedTimeDilationCatalog.ts';
import { gameplayTagIdFromPath } from '../../src/source/nativeGameplayTags.ts';

const files: string[] = [];
afterEach(() => {
  for (const file of files.splice(0)) fs.rmSync(file, { force: true });
});

function fixture(content: string): string {
  const file = path.join(os.tmpdir(), `endaxis-time-dilation-${crypto.randomUUID()}.ts`);
  fs.writeFileSync(file, content);
  files.push(file);
  return file;
}

describe('生成时间膨胀目录结构读取', () => {
  it('读取目录且不依赖引号或排版', () => {
    const file = fixture(`
      export const TIME_DILATION_PRIORITY_DEFINITIONS = Object.freeze([
        { tagPath: 'TimeDilation/Priority/A', value: 10 },
        { "tagPath": "TimeDilation/Priority/B", "value": -2 },
      ] as const satisfies readonly unknown[]);
    `);
    expect(readGeneratedTimeDilationPriorities(file)).toEqual(
      new Map([
        [gameplayTagIdFromPath('TimeDilation/Priority/A'), 10],
        [gameplayTagIdFromPath('TimeDilation/Priority/B'), -2],
      ]),
    );
  });

  it.each([
    `export const TIME_DILATION_PRIORITY_DEFINITIONS = [];`,
    `export const TIME_DILATION_PRIORITY_DEFINITIONS = Object.freeze([{ tagPath: 'TimeDilation/Priority/A', value: dynamic }]);`,
    `export const TIME_DILATION_PRIORITY_DEFINITIONS = Object.freeze([{ tagPath: 'TimeDilation/Priority/A', value: 1, extra: 2 }]);`,
    `export const TIME_DILATION_PRIORITY_DEFINITIONS = Object.freeze([{ tagPath: 'Other/A', value: 1 }]);`,
  ])('拒绝非生成契约结构 %#', content => {
    expect(() => readGeneratedTimeDilationPriorities(fixture(content))).toThrow();
  });

  it('读取仓库当前生成目录', () => {
    expect(
      readGeneratedTimeDilationPriorities('src/data/combat/timeDilationCatalog.generated.ts').size,
    ).toBe(10);
  });
});
