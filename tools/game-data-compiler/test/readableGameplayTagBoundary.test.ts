import { describe, expect, it } from 'vitest';
import { GameplayTagRegistry, gameplayTagIdFromPath } from '../src/source/nativeGameplayTags.ts';
import { projectGameplayTags } from '../src/compiler/combatProjectionCommon.ts';

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
});
