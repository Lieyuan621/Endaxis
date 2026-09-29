import { describe, expect, it } from 'vitest';
import {
  GAMEPLAY_TAG_PATHS,
  gameplayTagRegistry,
  parseGameplayTagReference,
  requireGameplayTag,
} from './gameplayTagCatalog';

describe('可读 GameplayTag 目录', () => {
  it('生成目录中的可读路径没有重复或空身份', () => {
    expect(new Set(GAMEPLAY_TAG_PATHS).size).toBe(GAMEPLAY_TAG_PATHS.length);
    expect(GAMEPLAY_TAG_PATHS).not.toContain('');
  });
  it('子路径匹配父标签，但不能误匹配同名前缀', () => {
    expect(
      gameplayTagRegistry.matches(
        requireGameplayTag('Status/Immobilized/Frozen'),
        requireGameplayTag('Status/Immobilized'),
      ),
    ).toBe(true);
    expect(gameplayTagRegistry.matches('Status/ImmobilizedOther', 'Status/Immobilized')).toBe(
      false,
    );
  });
  it('编辑器支持可读自定义路径，拒绝数字串和占位符', () => {
    expect(parseGameplayTagReference('TimeDilation/Layer/Entity/HitStop')).toBe(
      'TimeDilation/Layer/Entity/HitStop',
    );
    expect(parseGameplayTagReference('Custom/MyBuff')).toBe('Custom/MyBuff');
    for (const invalid of ['-123', '2147483648', 'unknown:123'])
      expect(parseGameplayTagReference(invalid)).toBeUndefined();
  });
});
