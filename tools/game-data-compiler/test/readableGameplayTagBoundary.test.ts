import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { GameplayTagRegistry, gameplayTagIdFromPath } from '../src/source/nativeGameplayTags.ts';
import { projectGameplayTags } from '../src/compiler/combatProjectionCommon.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));

describe('可读标签的单向数据边界', () => {
  it('只有来源层解析数字，未知身份不能变成数字字符串或占位标签', () => {
    const registry = new GameplayTagRegistry(['Combat/Buff/Child']);
    expect(
      projectGameplayTags(
        [gameplayTagIdFromPath('Combat/Buff/Child')],
        { gameplayTagRegistry: registry },
        'fixture',
      ),
    ).toEqual(['Combat/Buff/Child']);
    expect(() => projectGameplayTags([123], { gameplayTagRegistry: registry }, 'fixture')).toThrow(
      '无法解析 GameplayTag ID',
    );
    expect(() => projectGameplayTags([123], {}, 'fixture')).toThrow('缺少来源标签目录');
    expect(projectGameplayTags([], {}, 'empty')).toEqual([]);
  });

  it('契约与产品代码不重新引入原生 ID、CRC 或标签转换工厂', () => {
    const violations: string[] = [];
    function inspect(directory: string): void {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) inspect(file);
        else if (/\.(?:ts|vue)$/.test(entry.name) && !/\.test\.ts$/.test(entry.name)) {
          const text = fs.readFileSync(file, 'utf8');
          if (
            /\b(?:GameplayTagId|gameplayTagIdFromPath|gameplayTagId|nativeGameplayTags|buffTagIds|applyTagIds|extendTagIds|allowedRecoveryTagIds|ultimateRecoveryTagId)\b/.test(
              text,
            ) ||
            /\bgameplayTag\s*\(/.test(text)
          ) {
            violations.push(path.relative(root, file));
          }
        }
      }
    }
    for (const directory of ['packages/game-data-contract/src', 'src'])
      inspect(path.join(root, directory));
    expect(violations).toEqual([]);
  });
});
