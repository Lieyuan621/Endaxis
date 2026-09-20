import { describe, expect, it } from 'vitest';
import type { TimelineActionSelection } from './timelineActionSelection';
import {
  applyTimelineMarqueeSelection,
  type TimelineActionRectangle,
} from './timelineMarqueeSelection';

const actions: readonly TimelineActionRectangle[] = [
  { id: 'cast:2', x: 30, y: 0, width: 10, height: 10 },
  { id: 'cast:1', x: 10, y: 0, width: 10, height: 10 },
  { id: 'cast:3', x: 10, y: 20, width: 10, height: 10 },
];

function selection(ids: readonly string[], primaryId: string | null): TimelineActionSelection {
  return { selectedIds: new Set(ids), primaryId };
}

describe('applyTimelineMarqueeSelection', () => {
  it('普通框选替换原选择，并按视觉位置产生稳定主动作', () => {
    const result = applyTimelineMarqueeSelection(
      selection(['old'], 'old'),
      { startX: 5, startY: -5, endX: 45, endY: 15 },
      actions,
    );

    expect([...result.selectedIds]).toEqual(['cast:1', 'cast:2']);
    expect(result.primaryId).toBe('cast:1');
  });

  it('普通框选继续命中原主动作时保持 primaryId', () => {
    const result = applyTimelineMarqueeSelection(
      selection(['cast:2'], 'cast:2'),
      { startX: 5, startY: -5, endX: 45, endY: 15 },
      actions,
    );

    expect([...result.selectedIds]).toEqual(['cast:1', 'cast:2']);
    expect(result.primaryId).toBe('cast:2');
  });

  it.each([
    { ctrlKey: true, metaKey: false },
    { ctrlKey: false, metaKey: true },
  ])('Ctrl/Meta 框选逐项选中和取消选中', modifiers => {
    const result = applyTimelineMarqueeSelection(
      selection(['cast:1', 'cast:3'], 'cast:3'),
      { startX: 5, startY: -5, endX: 45, endY: 15 },
      actions,
      modifiers,
    );

    expect([...result.selectedIds]).toEqual(['cast:3', 'cast:2']);
    expect(result.primaryId).toBe('cast:2');
  });

  it('反向拖拽与正向拖拽得到相同结果', () => {
    const initial = selection([], null);
    const forward = applyTimelineMarqueeSelection(
      initial,
      { startX: 5, startY: -5, endX: 45, endY: 15 },
      actions,
    );
    const backward = applyTimelineMarqueeSelection(
      initial,
      { startX: 45, startY: 15, endX: 5, endY: -5 },
      actions,
    );

    expect(backward).toEqual(forward);
  });

  it('矩形边界接触也视为命中', () => {
    const result = applyTimelineMarqueeSelection(
      selection([], null),
      { startX: 20, startY: 10, endX: 25, endY: 15 },
      actions,
    );

    expect([...result.selectedIds]).toEqual(['cast:1']);
    expect(result.primaryId).toBe('cast:1');
  });

  it('零面积拖拽保持原选择引用', () => {
    const initial = selection(['cast:3'], 'cast:3');

    expect(
      applyTimelineMarqueeSelection(
        initial,
        { startX: 10, startY: 0, endX: 10, endY: 30 },
        actions,
      ),
    ).toBe(initial);
  });

  it('同一动作的多个矩形只切换一次', () => {
    const result = applyTimelineMarqueeSelection(
      selection([], null),
      { startX: 0, startY: 0, endX: 50, endY: 50 },
      [...actions, { id: 'cast:1', x: 12, y: 2, width: 5, height: 5 }],
      { ctrlKey: true },
    );

    expect([...result.selectedIds]).toEqual(['cast:1', 'cast:2', 'cast:3']);
    expect(result.primaryId).toBe('cast:3');
  });

  it('无命中普通框选会清空选择，重复空选保持引用', () => {
    const cleared = applyTimelineMarqueeSelection(
      selection(['cast:1'], 'cast:1'),
      { startX: 100, startY: 100, endX: 120, endY: 120 },
      actions,
    );
    const repeated = applyTimelineMarqueeSelection(
      cleared,
      { startX: 100, startY: 100, endX: 120, endY: 120 },
      actions,
    );

    expect([...cleared.selectedIds]).toEqual([]);
    expect(cleared.primaryId).toBeNull();
    expect(repeated).toBe(cleared);
  });

  it('拒绝无法参与几何计算的坐标', () => {
    expect(() =>
      applyTimelineMarqueeSelection(
        selection([], null),
        { startX: 0, startY: 0, endX: Number.NaN, endY: 10 },
        actions,
      ),
    ).toThrow('endX must be finite');
  });
});
