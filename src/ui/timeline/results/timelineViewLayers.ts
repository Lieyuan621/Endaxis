/** 时间轴当前真实存在、可以独立隐藏的视觉层。 */
export const TIMELINE_VIEW_LAYER_IDS = [
  'upperEffects',
  'lowerBuffs',
  'gauge',
  'skillDecorations',
  'skillErrors',
  'hitMarkers',
  'comboWindows',
  'switchMarkers',
  'effectLinks',
] as const;

export type TimelineViewLayerId = (typeof TIMELINE_VIEW_LAYER_IDS)[number];
export type TimelineViewLayers = Record<TimelineViewLayerId, boolean>;

export function createDefaultTimelineViewLayers(): TimelineViewLayers {
  return Object.fromEntries(TIMELINE_VIEW_LAYER_IDS.map(id => [id, true])) as TimelineViewLayers;
}

/** 未知、缺字段和旧版本设置都按显示处理，避免升级后内容悄悄消失。 */
export function normalizeTimelineViewLayers(source: unknown): TimelineViewLayers {
  const result = createDefaultTimelineViewLayers();
  if (source === null || typeof source !== 'object' || Array.isArray(source)) return result;
  const input = source as Record<string, unknown>;
  for (const id of TIMELINE_VIEW_LAYER_IDS) result[id] = input[id] !== false;
  return result;
}

export function toggleTimelineViewLayerState(
  layers: TimelineViewLayers,
  id: TimelineViewLayerId,
): TimelineViewLayers {
  return { ...layers, [id]: !layers[id] };
}
