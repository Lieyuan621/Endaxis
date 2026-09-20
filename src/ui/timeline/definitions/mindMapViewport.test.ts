import { expect, it } from 'vitest';
import { mindMapAnchoredScroll, mindMapNodeScroll, mindMapWorldPoint } from './mindMapViewport';

it.each([0.5, 0.9, 1.5])('centers the complete node at zoom %s including short viewports', zoom => {
  const node = { x: 1000, y: 1000, width: 220, height: 52 };
  for (const viewport of [
    { width: 600, height: 400 },
    { width: 340, height: 80 },
  ]) {
    const scroll = mindMapNodeScroll(node, viewport, zoom);
    expect(node.x * zoom - scroll.left + (node.width * zoom) / 2).toBeCloseTo(viewport.width / 2);
    expect(node.y * zoom - scroll.top + (node.height * zoom) / 2).toBeCloseTo(viewport.height / 2);
  }
});
it('keeps oversized nodes at the leading edge and never requests negative scrolling', () => {
  expect(
    mindMapNodeScroll({ x: 10, y: 20, width: 220, height: 52 }, { width: 100, height: 30 }, 1),
  ).toEqual({ left: 10, top: 20 });
  expect(
    mindMapNodeScroll({ x: 10, y: 20, width: 220, height: 52 }, { width: 600, height: 400 }, 1),
  ).toEqual({ left: 0, top: 0 });
});
it('accounts for the stage offset after an in-flow legend', () => {
  const node = { x: 400, y: 300, width: 220, height: 52 };
  const view = { width: 340, height: 80 };
  const base = mindMapNodeScroll(node, view, 0.9);
  expect(mindMapNodeScroll(node, view, 0.9, { left: 0, top: 22 })).toEqual({
    left: base.left,
    top: base.top + 22,
  });
});

it('keeps the pointer world point fixed when zooming with a nonzero stage origin', () => {
  const pointer = { x: 110, y: 70 };
  const offset = { left: 8, top: 22 };
  const before = { left: 200, top: 180 };
  const world = mindMapWorldPoint(pointer, before, offset, 0.9);
  for (const zoom of [0.45, 0.8, 1, 1.25]) {
    const scroll = mindMapAnchoredScroll(world, pointer, offset, zoom);
    const after = mindMapWorldPoint(pointer, scroll, offset, zoom);
    expect(after.x).toBeCloseTo(world.x);
    expect(after.y).toBeCloseTo(world.y);
  }
  expect(mindMapAnchoredScroll(world, pointer, offset, 0.9)).toEqual(before);
});

it('uses the current stage origin after reflow and clamps impossible negative scroll positions', () => {
  const pointer = { x: 10, y: 10 };
  const world = mindMapWorldPoint(pointer, { left: 100, top: 100 }, { left: 0, top: 22 }, 1);
  const offset = { left: 4, top: 30 };
  const scroll = mindMapAnchoredScroll(world, pointer, offset, 1.1);
  expect(mindMapWorldPoint(pointer, scroll, offset, 1.1)).toEqual(world);
  expect(mindMapAnchoredScroll({ x: 0, y: 0 }, pointer, { left: 0, top: 0 }, 1)).toEqual({
    left: 0,
    top: 0,
  });
});
