/** Convert a viewport-local pointer into unscaled stage coordinates. */
export function mindMapWorldPoint(
  pointer: { x: number; y: number },
  scroll: { left: number; top: number },
  stageOffset: { left: number; top: number },
  zoom: number,
): { x: number; y: number } {
  return {
    x: (scroll.left + pointer.x - stageOffset.left) / zoom,
    y: (scroll.top + pointer.y - stageOffset.top) / zoom,
  };
}

export function mindMapAnchoredScroll(
  world: { x: number; y: number },
  pointer: { x: number; y: number },
  stageOffset: { left: number; top: number },
  zoom: number,
): { left: number; top: number } {
  return {
    left: Math.max(0, stageOffset.left + world.x * zoom - pointer.x),
    top: Math.max(0, stageOffset.top + world.y * zoom - pointer.y),
  };
}

/** Center a node in the visible viewport; oversized nodes keep their leading edge visible. */
export function mindMapNodeScroll(
  node: { x: number; y: number; width: number; height: number },
  viewport: { width: number; height: number },
  zoom: number,
  stageOffset = { left: 0, top: 0 },
): { left: number; top: number } {
  return {
    left: Math.max(
      0,
      stageOffset.left + node.x * zoom - Math.max(0, (viewport.width - node.width * zoom) / 2),
    ),
    top: Math.max(
      0,
      stageOffset.top + node.y * zoom - Math.max(0, (viewport.height - node.height * zoom) / 2),
    ),
  };
}
