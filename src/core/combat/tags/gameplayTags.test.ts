import { describe, expect, it } from 'vitest';
import { GameplayTagRegistry, assertGameplayTag } from './gameplayTags';

describe('GameplayTag', () => {
  it('运行时只接受可读路径，不接受数字身份或占位符', () => {
    expect(() => assertGameplayTag('Combat/Buff/Pulse')).not.toThrow();
    for (const value of ['123456789', '-1', '', 'unknown:123', 'A//B']) {
      expect(() => assertGameplayTag(value)).toThrow(/可读路径/);
    }
    expect(() => assertGameplayTag(42)).toThrow(/可读路径/);
  });

  it('非精确查询允许子标签匹配父标签', () => {
    const registry = new GameplayTagRegistry(['Combat/Buff/Pulse']);
    const child = 'Combat/Buff/Pulse';
    const parent = 'Combat/Buff';

    expect(registry.matches(child, parent)).toBe(true);
    expect(registry.matches(child, parent, true)).toBe(false);
  });

  it('支持原生四种容器查询语义', () => {
    const registry = new GameplayTagRegistry(['Combat/Buff/Pulse', 'Combat/Buff/Heat']);
    const pulse = 'Combat/Buff/Pulse';
    const heat = 'Combat/Buff/Heat';
    const missing = 'Combat/Buff/Nature';

    expect(registry.query([pulse, heat], [pulse, missing], 'hasAny')).toBe(true);
    expect(registry.query([pulse, heat], [pulse, heat], 'hasAll')).toBe(true);
    expect(registry.query([pulse], [missing], 'exceptAny')).toBe(true);
    expect(registry.query([pulse], [pulse, missing], 'exceptAll')).toBe(true);
  });
});
