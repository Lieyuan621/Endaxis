// ─── Enemy affliction visualization ─────────────────────────────────────────
// Normalizes the raw enemy-effect layout (positioned segments/markers) into the
// grouped affliction view model the timeline renders: physical reactions,
// attachments, anomalies, and statuses — with physical markers collapsed to a
// single representative per instant according to reaction priority/stacking
// rules. Pure transform over the laid-out enemy effects.

import { resolveEffectDisplayKey } from '@/utils/effectDisplay';

export interface EnemyAfflictionMarker {
  typeKey: string;
  time: number;
  stacks: number;
  icon: string | null;
  row: number;
  isDamageHit?: boolean;
  hitData?: any;
  damageHits?: any[];
  sourceId?: string;
  carryoverKey?: string;
  disabled?: boolean;
}

export interface EnemyAfflictionSegment {
  kind: 'physical' | 'attachment' | 'anomaly' | 'status';
  typeKey: string;
  stacks: number;
  start: number;
  end: number;
  icon: string | null;
  row: number;
  tracksComboState: boolean;
  sourceId?: string;
}

export interface EnemyAfflictionGroup {
  segments: EnemyAfflictionSegment[];
  markers: EnemyAfflictionMarker[];
  rowCount?: number;
  rowByTypeKey?: Map<string, number>;
}

const PHYSICAL_REACTION_KEYS = new Set(['lift', 'knockdown', 'breach', 'crush']);
const PHYSICAL_STACKING_KEYS = new Set(['lift', 'knockdown']);
const PHYSICAL_CONSUMING_KEYS = new Set(['breach', 'crush']);
const PHYSICAL_MARKER_PRIORITY: Record<string, number> = {
  breach: 500,
  lift: 400,
  knockdown: 300,
  crush: 200,
  vulnerability: 100,
};

export type PhysicalMarkerLike = {
  typeKey: string;
  stacks?: number;
  icon?: string | null;
  sourceId?: string;
  time?: number;
  row?: number;
};

/**
 * Pick the icon/stacks shown for a physical combo instant.
 * Mirrors enemy-state rules: without prior vulnerability, normal physical hits
 * only seed 1 vulnerability stack, but forced lift/knockdown keep their control icon.
 */
export function pickRepresentativePhysicalMarker(
  markers: PhysicalMarkerLike[],
  previousStacks: number,
  activeStacks: number,
): PhysicalMarkerLike | null {
  const physicalMarkers = markers.filter(marker => PHYSICAL_REACTION_KEYS.has(marker.typeKey));
  if (physicalMarkers.length === 0) return null;

  const byPriority = (a: PhysicalMarkerLike, b: PhysicalMarkerLike) =>
    (PHYSICAL_MARKER_PRIORITY[b.typeKey] || 0) - (PHYSICAL_MARKER_PRIORITY[a.typeKey] || 0);

  if (previousStacks <= 0) {
    const controlMarker = [...physicalMarkers]
      .filter(marker => PHYSICAL_STACKING_KEYS.has(marker.typeKey))
      .sort(byPriority)[0];
    if (controlMarker) {
      return {
        typeKey: controlMarker.typeKey,
        time: controlMarker.time,
        stacks: Math.min(4, Math.max(1, Number(controlMarker.stacks) || 1)),
        icon: controlMarker.icon ?? null,
        row: 0,
        sourceId: controlMarker.sourceId,
      };
    }

    return {
      typeKey: 'vulnerability',
      time: physicalMarkers[0]!.time,
      stacks: 1,
      icon: null,
      row: 0,
      sourceId: physicalMarkers[0]!.sourceId,
    };
  }

  const representative = [...physicalMarkers].sort(byPriority)[0]!;

  if (PHYSICAL_CONSUMING_KEYS.has(representative.typeKey)) {
    return {
      typeKey: representative.typeKey,
      time: representative.time,
      stacks: Math.min(
        4,
        Math.max(previousStacks, ...physicalMarkers.map(marker => Number(marker.stacks) || 1)),
      ),
      icon: representative.icon ?? null,
      row: 0,
      sourceId: representative.sourceId,
    };
  }

  if (PHYSICAL_STACKING_KEYS.has(representative.typeKey)) {
    return {
      typeKey: representative.typeKey,
      time: representative.time,
      stacks: Math.min(4, Math.max(activeStacks, previousStacks + 1)),
      icon: representative.icon ?? null,
      row: 0,
      sourceId: representative.sourceId,
    };
  }

  return {
    typeKey: representative.typeKey,
    time: representative.time,
    stacks: Math.min(
      4,
      Math.max(activeStacks, previousStacks, Number(representative.stacks) || 1),
    ),
    icon: representative.icon ?? null,
    row: 0,
    sourceId: representative.sourceId,
  };
}

function emptyEnemyAfflictionViz() {
  return {
    physical: { segments: [], markers: [] } as EnemyAfflictionGroup,
    attachment: { segments: [], markers: [] } as EnemyAfflictionGroup,
    anomalies: {
      segments: [],
      markers: [],
      rowCount: 0,
      rowByTypeKey: new Map<string, number>(),
    } as EnemyAfflictionGroup,
    statuses: {
      segments: [],
      markers: [],
      rowCount: 0,
      rowByTypeKey: new Map<string, number>(),
    } as EnemyAfflictionGroup,
  };
}

function getEnemySegmentTypeKey(segment: any) {
  const effect = segment?.effect;
  if (effect && Object.keys(effect).length > 0) {
    const resolved = resolveEffectDisplayKey(effect);
    if (resolved) return resolved;
  }

  const raw = String(segment?.typeKey || '');
  if (raw.includes(':')) return raw.split(':').pop();
  if (raw === 'physical_combo') return 'vulnerability';
  return raw || 'default';
}

export function projectEnemyAfflictionViz(layout: any) {
  const out = emptyEnemyAfflictionViz();
  const rowMax = { anomaly: -1, status: -1 };
  const epsilon = 0.001;
  const segments = Array.isArray(layout?.positionedSegments) ? layout.positionedSegments : [];

  for (const segment of segments) {
    const typeKey = getEnemySegmentTypeKey(segment);
    if (!typeKey || typeKey === 'default') continue;

    const start = Number(segment.start) || 0;
    const end = Number(segment.end) || start;
    const stacks = Math.max(1, Number(segment.stacks) || 1);
    const row = Math.max(0, Number(segment.subRow) || 0);
    const icon = segment.icon || null;
    const isMarker = segment.isDamageHit || end <= start + epsilon;
    const base = {
      typeKey,
      stacks,
      start,
      end,
      icon,
      row,
      tracksComboState: typeKey === 'vulnerability',
      sourceId: segment.sourceId,
      carryoverKey: segment.carryoverKey,
      disabled: segment.disabled === true,
    };

    if (segment.group === 0 || segment.group === 1) {
      if (isMarker)
        out.physical.markers.push({
          typeKey,
          time: start,
          stacks,
          icon,
          row,
          isDamageHit: !!segment.isDamageHit,
          hitData: segment.hitData,
          sourceId: segment.sourceId,
        });
      else out.physical.segments.push({ ...base, kind: 'physical' });
      continue;
    }

    if (segment.group === 2) {
      if (isMarker)
        out.attachment.markers.push({
          typeKey,
          time: start,
          stacks,
          icon,
          row,
          isDamageHit: !!segment.isDamageHit,
          hitData: segment.hitData,
          sourceId: segment.sourceId,
        });
      else out.attachment.segments.push({ ...base, kind: 'attachment' });
      continue;
    }

    if (segment.group === 3) {
      rowMax.anomaly = Math.max(rowMax.anomaly, row);
      if (isMarker)
        out.anomalies.markers.push({
          typeKey,
          time: start,
          stacks,
          icon,
          row,
          isDamageHit: !!segment.isDamageHit,
          hitData: segment.hitData,
          sourceId: segment.sourceId,
        });
      else out.anomalies.segments.push({ ...base, kind: 'anomaly' });
      continue;
    }

    if (segment.group === 4) {
      rowMax.status = Math.max(rowMax.status, row);
      if (isMarker)
        out.statuses.markers.push({
          typeKey,
          time: start,
          stacks,
          icon,
          row,
          isDamageHit: !!segment.isDamageHit,
          hitData: segment.hitData,
          sourceId: segment.sourceId,
        });
      else out.statuses.segments.push({ ...base, kind: 'status' });
    }
  }

  normalizePhysicalMarkers(out.physical);
  out.anomalies.rowCount = rowMax.anomaly + 1;
  out.statuses.rowCount = rowMax.status + 1;
  return out;
}

function getActivePhysicalComboStacks(
  segments: EnemyAfflictionSegment[],
  time: number,
  epsilon = 0.001,
) {
  return Math.max(
    0,
    ...segments
      .filter(
        segment =>
          segment.tracksComboState === true &&
          segment.start <= time + epsilon &&
          segment.end > time + epsilon,
      )
      .map(segment => Number(segment.stacks) || 1),
  );
}

function getPreviousPhysicalComboStacks(
  segments: EnemyAfflictionSegment[],
  time: number,
  epsilon = 0.001,
) {
  return Math.max(
    0,
    ...segments
      .filter(
        segment =>
          segment.tracksComboState === true &&
          segment.start < time - epsilon &&
          segment.end > time - epsilon,
      )
      .map(segment => Number(segment.stacks) || 1),
  );
}

function getPhysicalMarkerPriority(typeKey: string) {
  return PHYSICAL_MARKER_PRIORITY[typeKey] || 0;
}

function normalizePhysicalMarkers(group: EnemyAfflictionGroup) {
  const epsilon = 0.001;
  const groups = new Map<number, EnemyAfflictionMarker[]>();

  for (const marker of group.markers || []) {
    const time = Number(marker.time) || 0;
    const timeKey = Math.round(time / epsilon);
    const list = groups.get(timeKey) || [];
    list.push({ ...marker, time });
    groups.set(timeKey, list);
  }

  group.markers = Array.from(groups.values())
    .map(markers => {
      const time = Number(markers[0]?.time) || 0;
      const damageHits = markers
        .filter(marker => marker.isDamageHit && marker.hitData)
        .sort((a, b) => getPhysicalMarkerPriority(b.typeKey) - getPhysicalMarkerPriority(a.typeKey))
        .map(marker => marker.hitData);
      const withDamageHits = (marker: EnemyAfflictionMarker) =>
        damageHits.length > 0 ? { ...marker, time, damageHits } : { ...marker, time };

      const previousStacks = getPreviousPhysicalComboStacks(group.segments, time, epsilon);
      const activeStacks = getActivePhysicalComboStacks(group.segments, time, epsilon);
      const picked = pickRepresentativePhysicalMarker(markers, previousStacks, activeStacks);
      if (picked) {
        return withDamageHits({
          typeKey: picked.typeKey,
          time: Number(picked.time) || 0,
          stacks: Number(picked.stacks) || 1,
          icon: picked.icon ?? null,
          row: Number(picked.row) || 0,
          sourceId: picked.sourceId,
        });
      }

      return withDamageHits(
        [...markers].sort(
          (a, b) => getPhysicalMarkerPriority(b.typeKey) - getPhysicalMarkerPriority(a.typeKey),
        )[0]!,
      );
    })
    .sort((a, b) => a.time - b.time);
}
