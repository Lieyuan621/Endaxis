import { resolveEffectDisplayKey } from './effectDisplay';

export interface TimelineGuidePoint {
  time?: number;
}

export interface EnemyEffectGuideItem {
  typeKey: string;
  stacks: number;
  icon: string | null;
  disabled: boolean;
}

export interface EnemyEffectGuideSnapshot {
  time: number;
  buffs: EnemyEffectGuideItem[];
}

export interface EnemyEffectGuideSample {
  buffs: EnemyEffectGuideItem[];
  overflow: number;
}

interface EnemyEffectSegmentLike {
  start?: number;
  end?: number;
  typeKey?: string;
  stacks?: number;
  icon?: string | null;
  disabled?: boolean;
  showIcon?: boolean;
  isDamageHit?: boolean;
  effect?: Parameters<typeof resolveEffectDisplayKey>[0];
}

interface IndexedEnemyEffect extends EnemyEffectGuideItem {
  id: number;
}

interface EnemyEffectBoundary {
  starts: IndexedEnemyEffect[];
  ends: number[];
}

export function sampleStepSeriesAtTime<T extends TimelineGuidePoint>(
  points: T[] | null | undefined,
  time: number,
): T | null {
  if (!Array.isArray(points) || points.length === 0) return null;

  let lo = 0;
  let hi = points.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if ((Number(points[mid]?.time) || 0) <= time) lo = mid + 1;
    else hi = mid - 1;
  }

  return hi >= 0 ? points[hi] || null : null;
}

export function buildCumulativeDamageSeries<T>(
  entries: T[] | null | undefined,
  getTime: (entry: T) => number,
  getDamage: (entry: T) => number,
) {
  const hits = (Array.isArray(entries) ? entries : [])
    .map(entry => ({
      time: Number(getTime(entry)) || 0,
      damage: Math.max(0, Number(getDamage(entry)) || 0),
    }))
    .sort((left, right) => left.time - right.time);

  let total = 0;
  return hits.map(hit => {
    total += hit.damage;
    return { time: hit.time, total };
  });
}

function aggregateActiveEffects(active: Map<number, IndexedEnemyEffect>) {
  const byType = new Map<string, EnemyEffectGuideItem>();
  for (const effect of active.values()) {
    const previous = byType.get(effect.typeKey);
    if (!previous || effect.stacks > previous.stacks) {
      byType.set(effect.typeKey, {
        typeKey: effect.typeKey,
        stacks: effect.stacks,
        icon: effect.icon,
        disabled: effect.disabled,
      });
    }
  }

  return Array.from(byType.values()).sort((left, right) => {
    if (left.disabled !== right.disabled) return left.disabled ? 1 : -1;
    return left.typeKey.localeCompare(right.typeKey);
  });
}

export function buildEnemyEffectGuideTimeline(
  segments: EnemyEffectSegmentLike[] | null | undefined,
): EnemyEffectGuideSnapshot[] {
  const boundaries = new Map<number, EnemyEffectBoundary>();

  for (const [id, segment] of (Array.isArray(segments) ? segments : []).entries()) {
    if (!segment || segment.isDamageHit || segment.showIcon === false) continue;

    const start = Number(segment.start) || 0;
    const end = Number(segment.end) || start;
    if (end <= start) continue;

    const rawTypeKey = String(segment.typeKey || '').trim();
    if (!rawTypeKey || rawTypeKey === 'default') continue;

    const effectTypeKey = segment.effect ? resolveEffectDisplayKey(segment.effect) : '';
    const typeKey = effectTypeKey && effectTypeKey !== 'default' ? effectTypeKey : rawTypeKey;
    const indexed: IndexedEnemyEffect = {
      id,
      typeKey,
      stacks: Math.max(1, Number(segment.stacks) || 1),
      icon: segment.icon || null,
      disabled: segment.disabled === true,
    };

    const startBoundary = boundaries.get(start) || { starts: [], ends: [] };
    startBoundary.starts.push(indexed);
    boundaries.set(start, startBoundary);

    const endBoundary = boundaries.get(end) || { starts: [], ends: [] };
    endBoundary.ends.push(id);
    boundaries.set(end, endBoundary);
  }

  const active = new Map<number, IndexedEnemyEffect>();
  const snapshots: EnemyEffectGuideSnapshot[] = [];
  for (const [time, boundary] of Array.from(boundaries.entries()).sort(
    ([left], [right]) => left - right,
  )) {
    for (const id of boundary.ends) active.delete(id);
    for (const effect of boundary.starts) active.set(effect.id, effect);
    snapshots.push({ time, buffs: aggregateActiveEffects(active) });
  }

  return snapshots;
}

export function sampleEnemyEffectGuideTimeline(
  snapshots: EnemyEffectGuideSnapshot[] | null | undefined,
  time: number,
  limit = Infinity,
): EnemyEffectGuideSample {
  const snapshot = sampleStepSeriesAtTime(snapshots, time);
  const buffs = snapshot?.buffs || [];
  const normalizedLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : buffs.length;
  return {
    buffs: buffs.slice(0, normalizedLimit),
    overflow: Math.max(0, buffs.length - normalizedLimit),
  };
}
