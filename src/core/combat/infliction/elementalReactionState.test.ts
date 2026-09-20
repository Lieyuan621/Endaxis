import { describe, expect, it } from 'vitest';
import { ElementalReactionContainer, MAX_REACTION_LEVEL } from './elementalReactionState';

describe('ElementalReactionContainer', () => {
  it('复制后恢复反应等级和到期时间，两个分支可独立消费', () => {
    const original = new ElementalReactionContainer();
    const input = {
      reaction: 'electrification' as const,
      durationSeconds: 5,
      sourceId: 'operator',
      time: 1,
    };
    original.apply(input);
    original.apply(input);
    const saved = structuredClone(original.runtimeState);
    const restored = new ElementalReactionContainer(saved);
    expect(original.consume('electrification', 2)).toEqual({ consumedLevel: 2 });
    expect(restored.isActive('electrification', 2, 5.9)).toBe(true);
    expect(restored.snapshot(5.9)[0]!.sourceId).toBe('operator');
    expect(restored.isActive('electrification', undefined, 6)).toBe(false);
    expect(original.snapshot(2)).toEqual([]);
  });

  it('首次施加建立 1 级并按时长到期', () => {
    const container = new ElementalReactionContainer();
    const result = container.apply({
      reaction: 'electrification',
      durationSeconds: 5,
      sourceId: 'perlica',
      time: 1,
    });
    expect(result).toEqual({
      reaction: 'electrification',
      previousLevel: 0,
      level: 1,
      durationSeconds: 5,
    });
    expect(container.isActive('electrification', undefined, 5.9)).toBe(true);
    expect(container.isActive('electrification', undefined, 6)).toBe(false);
  });

  it('重复施加升一级并刷新时长，最多 4 级', () => {
    const container = new ElementalReactionContainer();
    container.apply({ reaction: 'electrification', durationSeconds: 5, sourceId: 'a', time: 0 });
    expect(
      container.apply({ reaction: 'electrification', durationSeconds: 5, sourceId: 'a', time: 2 })
        .level,
    ).toBe(2);
    expect(
      container.apply({ reaction: 'electrification', durationSeconds: 5, sourceId: 'a', time: 4 })
        .level,
    ).toBe(3);
    expect(
      container.apply({ reaction: 'electrification', durationSeconds: 5, sourceId: 'a', time: 6 })
        .level,
    ).toBe(4);
    expect(
      container.apply({ reaction: 'electrification', durationSeconds: 5, sourceId: 'a', time: 8 })
        .level,
    ).toBe(4);
    expect(MAX_REACTION_LEVEL).toBe(4);
  });

  it('消费返回等级并清除状态；没有反应时返回 null', () => {
    const container = new ElementalReactionContainer();
    expect(container.consume('electrification', 0)).toBeNull();
    container.apply({ reaction: 'electrification', durationSeconds: 5, sourceId: 'a', time: 0 });
    expect(container.consume('electrification', 1)).toEqual({ consumedLevel: 1 });
    expect(container.isActive('electrification', undefined, 1)).toBe(false);
  });

  it('按最低等级判断条件，过期状态自动清理', () => {
    const container = new ElementalReactionContainer();
    container.apply({ reaction: 'electrification', durationSeconds: 5, sourceId: 'a', time: 0 });
    expect(container.isActive('electrification', 2, 1)).toBe(false);
    container.apply({ reaction: 'electrification', durationSeconds: 5, sourceId: 'a', time: 1 });
    expect(container.isActive('electrification', 2, 1.1)).toBe(true);
    expect(container.snapshot(100)).toEqual([]);
  });
});
