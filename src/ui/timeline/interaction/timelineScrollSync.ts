interface HorizontalScrollTarget {
  scrollLeft: number;
}

/** 原生 scroll 事件异步派发；同步写入不能再次作为新的滚动输入回传。 */
export function createTimelineScrollSync() {
  const observed = new WeakMap<HorizontalScrollTarget, number>();
  return (source: HorizontalScrollTarget, target: HorizontalScrollTarget): void => {
    const left = source.scrollLeft;
    if (observed.get(source) === left) return;
    observed.set(source, left);
    if (Math.abs(target.scrollLeft - left) > 0.5) target.scrollLeft = left;
    // 保存实际值，兼容浏览器对范围和小数像素的限位。
    observed.set(target, target.scrollLeft);
  };
}

interface VerticalScrollTarget {
  scrollTop: number;
}

/** 纵向假滚动条与轨道视口共用已观察位置，避免异步 scroll 事件互相回写。 */
export function createTimelineVerticalScrollSync() {
  const observed = new WeakMap<VerticalScrollTarget, number>();
  return (source: VerticalScrollTarget, target: VerticalScrollTarget): void => {
    const top = source.scrollTop;
    if (observed.get(source) === top) return;
    observed.set(source, top);
    if (Math.abs(target.scrollTop - top) > 0.5) target.scrollTop = top;
    observed.set(target, target.scrollTop);
  };
}
