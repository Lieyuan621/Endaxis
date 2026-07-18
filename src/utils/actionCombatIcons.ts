/**
 * Mobile timeline helper: map an action's time window to combat-status badges
 * (affliction / physical / reaction icons + optional duration).
 *
 * Primary source is `enemyAfflictionViz` (same projection ResourceMonitor uses).
 * Hit effects are only a non-physical fallback when viz has no match.
 * Physical outcomes always come from viz so forced-lift / 1-stack vuln rules apply.
 */

import { getEffectIcon, resolveEffectDefaults } from '@/data/effectPresets';
import { getDisplayKeyCandidates, resolveEffectDisplayKey } from '@/utils/effectDisplay';
import type { Effect } from '@/data/types';

export interface ActionCombatBadge {
  id: string;
  key: string;
  icon: string;
  stacks: number;
  startTime: number;
  endTime: number | null;
  duration: number;
  isMarker: boolean;
  kind: 'attachment' | 'physical' | 'anomaly' | 'other';
}

export interface EnemyAfflictionVizLike {
  physical?: { markers?: any[]; segments?: any[] };
  attachment?: { markers?: any[]; segments?: any[] };
  anomalies?: { markers?: any[]; segments?: any[] };
}

const FALLBACK_ICON = '/icons/default_icon.webp';
const TIME_EPS = 0.05;

const PHYSICAL_KEYS = new Set([
  'vulnerability',
  'breach',
  'crush',
  'knockdown',
  'lift',
  'physical_combo',
]);

const REACTION_KEYS = new Set([
  'combustion',
  'electrification',
  'corrosion',
  'solidification',
  'shatter',
]);

function isAttachmentKey(key: string) {
  return key.endsWith('_infliction') || key.endsWith('_burst');
}

function classifyKey(key: string): ActionCombatBadge['kind'] {
  if (isAttachmentKey(key)) return 'attachment';
  if (PHYSICAL_KEYS.has(key)) return 'physical';
  if (REACTION_KEYS.has(key)) return 'anomaly';
  return 'other';
}

function resolveIconFromTypeKey(
  typeKey: string,
  preferredIcon: string | null | undefined,
  iconDatabase: Record<string, string> | null | undefined,
): string {
  if (preferredIcon && preferredIcon !== FALLBACK_ICON) return preferredIcon;
  const db = iconDatabase || {};
  for (const candidate of getDisplayKeyCandidates(typeKey)) {
    if (db[candidate]) return db[candidate];
  }
  return db.default || FALLBACK_ICON;
}

function normalizeStacks(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.max(1, Math.round(n));
}

function makeBadge(
  partial: Omit<ActionCombatBadge, 'id' | 'kind'> & {
    id?: string;
    kind?: ActionCombatBadge['kind'];
  },
): ActionCombatBadge {
  const key = String(partial.key || '').trim();
  const kind = partial.kind || classifyKey(key);
  // Attachments: icon + stacks only (no duration bar).
  const hideDuration = kind === 'attachment' || !!partial.isMarker;
  const startTime = Number(partial.startTime) || 0;
  const duration = hideDuration ? 0 : Math.max(0, Number(partial.duration) || 0);
  const endTime = hideDuration
    ? null
    : partial.endTime != null && Number.isFinite(Number(partial.endTime))
      ? Number(partial.endTime)
      : duration > 0
        ? startTime + duration
        : null;
  const resolvedDuration = endTime != null ? Math.max(0, endTime - startTime) : 0;

  return {
    id: partial.id || `${key}@${startTime}`,
    key,
    icon: partial.icon,
    stacks: normalizeStacks(partial.stacks),
    startTime,
    endTime,
    duration: resolvedDuration,
    isMarker: hideDuration || resolvedDuration <= TIME_EPS,
    kind,
  };
}

function upsertBadge(map: Map<string, ActionCombatBadge>, badge: ActionCombatBadge) {
  const prev = map.get(badge.key);
  if (!prev) {
    map.set(badge.key, badge);
    return;
  }
  const prevScore = (prev.isMarker ? 0 : 1000) + prev.stacks * 10 + prev.duration;
  const nextScore = (badge.isMarker ? 0 : 1000) + badge.stacks * 10 + badge.duration;
  if (nextScore >= prevScore) map.set(badge.key, badge);
}

function collectGroupBadges(options: {
  group: { markers?: any[]; segments?: any[] } | null | undefined;
  kind: ActionCombatBadge['kind'];
  trackId?: string | null;
  start: number;
  end: number;
  iconDatabase?: Record<string, string> | null;
  map: Map<string, ActionCombatBadge>;
}) {
  const { group, kind, trackId, start, end, iconDatabase, map } = options;
  if (!group) return;

  for (const segment of group.segments || []) {
    // Vulnerability combo bars are tracked separately on desktop; icons come from markers.
    if (segment?.tracksComboState) continue;
    const segStart = Number(segment?.start);
    const segEnd = Number(segment?.end);
    if (!Number.isFinite(segStart)) continue;
    if (segStart < start - TIME_EPS || segStart > end + TIME_EPS) continue;
    if (trackId && segment?.sourceId && segment.sourceId !== trackId) continue;

    const key = String(segment?.typeKey || '').trim();
    if (!key) continue;
    const icon = resolveIconFromTypeKey(key, segment?.icon, iconDatabase);
    if (!icon || icon === FALLBACK_ICON) continue;

    const duration = Number.isFinite(segEnd) && segEnd > segStart ? segEnd - segStart : 0;
    upsertBadge(
      map,
      makeBadge({
        key,
        icon,
        stacks: segment?.stacks,
        startTime: segStart,
        endTime: Number.isFinite(segEnd) ? segEnd : null,
        duration,
        isMarker: kind === 'attachment' || duration <= TIME_EPS,
        kind,
      }),
    );
  }

  for (const marker of group.markers || []) {
    if (marker?.isDamageHit) continue;
    const time = Number(marker?.time);
    if (!Number.isFinite(time)) continue;
    if (time < start - TIME_EPS || time > end + TIME_EPS) continue;
    if (trackId && marker?.sourceId && marker.sourceId !== trackId) continue;

    const key = String(marker?.typeKey || '').trim();
    if (!key) continue;
    const icon = resolveIconFromTypeKey(key, marker?.icon, iconDatabase);
    if (!icon || icon === FALLBACK_ICON) continue;

    upsertBadge(
      map,
      makeBadge({
        key,
        icon,
        stacks: marker?.stacks,
        startTime: time,
        endTime: null,
        duration: 0,
        isMarker: true,
        kind,
      }),
    );
  }
}

/** Badges from sim affliction viz overlapping the action window. */
export function collectCombatBadgesFromAfflictionViz(options: {
  trackId?: string | null;
  startTime: number;
  endTime: number;
  viz?: EnemyAfflictionVizLike | null;
  iconDatabase?: Record<string, string> | null;
}): ActionCombatBadge[] {
  const start = Number(options.startTime) || 0;
  const end = Math.max(start, Number(options.endTime) || start);
  const map = new Map<string, ActionCombatBadge>();
  const base = {
    trackId: options.trackId,
    start,
    end,
    iconDatabase: options.iconDatabase,
    map,
  };

  collectGroupBadges({ ...base, group: options.viz?.attachment, kind: 'attachment' });
  collectGroupBadges({ ...base, group: options.viz?.physical, kind: 'physical' });
  collectGroupBadges({ ...base, group: options.viz?.anomalies, kind: 'anomaly' });

  return [...map.values()];
}

/** Non-physical hit fallback (infliction / reaction). */
export function collectCombatBadgesFromHits(
  action: { hits?: any[] | null } | null | undefined,
  actionStartTime: number,
  iconDatabase?: Record<string, string> | null,
): ActionCombatBadge[] {
  const hits = Array.isArray(action?.hits) ? action.hits : [];
  const map = new Map<string, ActionCombatBadge>();
  const baseStart = Number(actionStartTime) || 0;

  for (const hit of hits) {
    const hitOffset = Number(hit?.offset) || 0;
    for (const effect of Array.isArray(hit?.effects) ? hit.effects : []) {
      const kindName = String(effect?.kind || '');
      if (kindName === 'physicalStatus') continue;
      if (kindName !== 'infliction' && kindName !== 'burst' && kindName !== 'reaction') {
        const display = String(effect?.displayType || effect?.type || '');
        if (
          !display.endsWith('_infliction') &&
          !display.endsWith('_burst') &&
          !REACTION_KEYS.has(display)
        ) {
          continue;
        }
      }

      const resolved = resolveEffectDefaults(effect as Effect);
      const key =
        resolveEffectDisplayKey(resolved as any) || String((resolved as any)?.kind || '');
      if (PHYSICAL_KEYS.has(key)) continue;

      const icon = resolveIconFromTypeKey(key, getEffectIcon(resolved as Effect), iconDatabase);
      if (!icon || icon === FALLBACK_ICON) continue;

      const kind = classifyKey(key);
      const duration =
        kind === 'attachment' ? 0 : Math.max(0, Number((resolved as any)?.duration) || 0);
      const startTime = baseStart + hitOffset;
      upsertBadge(
        map,
        makeBadge({
          key,
          icon,
          stacks: Number((resolved as any)?.stacks) || 1,
          startTime,
          endTime: duration > 0 ? startTime + duration : null,
          duration,
          isMarker: kind === 'attachment' || duration <= TIME_EPS,
          kind,
        }),
      );
    }
  }

  return [...map.values()];
}

/** Viz-first badges for one action window; fill non-physical gaps from hits. */
export function collectActionCombatBadges(options: {
  action?: { hits?: any[] | null; instanceId?: string } | null;
  trackId?: string | null;
  startTime: number;
  endTime: number;
  viz?: EnemyAfflictionVizLike | null;
  iconDatabase?: Record<string, string> | null;
}): ActionCombatBadge[] {
  const fromViz = collectCombatBadgesFromAfflictionViz(options);
  const map = new Map(fromViz.map(item => [item.key, item]));
  for (const item of collectCombatBadgesFromHits(
    options.action,
    options.startTime,
    options.iconDatabase,
  )) {
    if (!map.has(item.key)) map.set(item.key, item);
  }
  let badges = [...map.values()];
  // Mobile clarity: when a reaction fires, hide the attachment that triggered it.
  if (badges.some(item => item.kind === 'anomaly')) {
    badges = badges.filter(item => item.kind !== 'attachment');
  }
  return badges.sort((a, b) => a.startTime - b.startTime || a.key.localeCompare(b.key));
}
