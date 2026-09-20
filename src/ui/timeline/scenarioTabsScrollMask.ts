export interface ScenarioTabsScrollMetrics {
  readonly scrollLeft: number;
  readonly clientWidth: number;
  readonly scrollWidth: number;
}

export interface ScenarioTabsScrollMaskStyle {
  readonly maskImage: string;
  readonly WebkitMaskImage: string;
}

const EDGE_TOLERANCE_PX = 2;
const EDGE_FADE_WIDTH_PX = 20;

/**
 * Reproduces the old editor's two-sided scenario-tab fade without coupling the
 * scroll calculation to Vue or a concrete DOM element.
 */
export function resolveScenarioTabsScrollMask(
  metrics: ScenarioTabsScrollMetrics,
): ScenarioTabsScrollMaskStyle {
  const isAtStart = metrics.scrollLeft <= EDGE_TOLERANCE_PX;
  const isAtEnd =
    metrics.scrollLeft + metrics.clientWidth >= metrics.scrollWidth - EDGE_TOLERANCE_PX;
  const isNotScrollable = metrics.scrollWidth <= metrics.clientWidth;

  if (isNotScrollable) {
    return { maskImage: 'none', WebkitMaskImage: 'none' };
  }

  const start = isAtStart ? 'black 0%' : `transparent 0px, black ${EDGE_FADE_WIDTH_PX}px`;
  const end = isAtEnd
    ? 'black 100%'
    : `black calc(100% - ${EDGE_FADE_WIDTH_PX}px), transparent 100%`;
  const gradient = `linear-gradient(to right, ${start}, ${end})`;
  return { maskImage: gradient, WebkitMaskImage: gradient };
}
