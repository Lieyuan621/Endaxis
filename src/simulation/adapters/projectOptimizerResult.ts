import { buildByTypeKey } from "@/simulation/projection/effectLayout";
import { projectFromSimLog, layoutEnemyEffects } from "@/simulation/projection/projectEnemyEffects";
import {
  projectOperatorEffects,
  layoutOperatorEffects,
} from "@/simulation/projection/projectOperatorEffects";
import { projectSpSeries } from "@/simulation/projection/projectSpSeries";
import { projectStaggerSeries } from "@/simulation/projection/projectStaggerSeries";
import { projectUltimateSeries } from "@/simulation/projection/projectUltimateSeries";
import { projectActionBuffs } from "@/simulation/projection/projectActionBuffs";
import { resolveEffectDisplayKey } from "@/utils/effectDisplay";

interface ProjectOptimizerResultInput {
  simulation: any;
  compiledScenario: any;
  tracks: any[];
  viewDuration: number;
  prepDuration?: number;
  simulationEndline?: number | null;
}

interface EnemyAfflictionMarker {
  typeKey: string;
  time: number;
  stacks: number;
  icon: string | null;
  isDamageHit?: boolean;
  hitData?: any;
  damageHits?: any[];
  sourceId?: string;
  carryoverKey?: string;
  disabled?: boolean;
}

interface EnemyAfflictionSegment {
  kind: "physical" | "attachment" | "anomaly" | "status";
  typeKey: string;
  stacks: number;
  start: number;
  end: number;
  icon: string | null;
  row: number;
  tracksComboState: boolean;
  sourceId?: string;
}

interface EnemyAfflictionGroup {
  segments: EnemyAfflictionSegment[];
  markers: EnemyAfflictionMarker[];
  rowCount?: number;
  rowByTypeKey?: Map<string, number>;
}

const PHYSICAL_REACTION_KEYS = new Set(["lift", "knockdown", "breach", "crush"]);
const PHYSICAL_STACKING_KEYS = new Set(["lift", "knockdown"]);
const PHYSICAL_CONSUMING_KEYS = new Set(["breach", "crush"]);
const PHYSICAL_MARKER_PRIORITY: Record<string, number> = {
  breach: 500,
  lift: 400,
  knockdown: 300,
  crush: 200,
  vulnerability: 100,
};

function emptyEnemyEffectLayout() {
  return {
    positionedSegments: [],
    totalHeight: 0,
    groupHeights: [0, 0, 0, 0, 0],
  };
}

function emptyStaggerSeries() {
  return {
    points: [],
    lockSegments: [],
    nodeSegments: [],
    nodeStep: 0,
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

  const raw = String(segment?.typeKey || "");
  if (raw.includes(":")) return raw.split(":").pop();
  if (raw === "physical_combo") return "vulnerability";
  return raw || "default";
}

export function projectEnemyAfflictionViz(layout: any) {
  const out = emptyEnemyAfflictionViz();
  const rowMax = { anomaly: -1, status: -1 };
  const epsilon = 0.001;
  const segments = Array.isArray(layout?.positionedSegments)
    ? layout.positionedSegments
    : [];

  for (const segment of segments) {
    const typeKey = getEnemySegmentTypeKey(segment);
    if (!typeKey || typeKey === "default") continue;

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
      tracksComboState: typeKey === "vulnerability",
      sourceId: segment.sourceId,
      carryoverKey: segment.carryoverKey,
      disabled: segment.disabled === true,
    };

    if (segment.group === 0 || segment.group === 1) {
      if (isMarker) out.physical.markers.push({ typeKey, time: start, stacks, icon, isDamageHit: !!segment.isDamageHit, hitData: segment.hitData, sourceId: segment.sourceId });
      else out.physical.segments.push({ ...base, kind: "physical" });
      continue;
    }

    if (segment.group === 2) {
      if (isMarker) out.attachment.markers.push({ typeKey, time: start, stacks, icon, isDamageHit: !!segment.isDamageHit, hitData: segment.hitData, sourceId: segment.sourceId });
      else out.attachment.segments.push({ ...base, kind: "attachment" });
      continue;
    }

    if (segment.group === 3) {
      rowMax.anomaly = Math.max(rowMax.anomaly, row);
      if (isMarker) out.anomalies.markers.push({ typeKey, time: start, stacks, icon, isDamageHit: !!segment.isDamageHit, hitData: segment.hitData, sourceId: segment.sourceId });
      else out.anomalies.segments.push({ ...base, kind: "anomaly" });
      continue;
    }

    if (segment.group === 4) {
      rowMax.status = Math.max(rowMax.status, row);
      if (isMarker) out.statuses.markers.push({ typeKey, time: start, stacks, icon, isDamageHit: !!segment.isDamageHit, hitData: segment.hitData, sourceId: segment.sourceId });
      else out.statuses.segments.push({ ...base, kind: "status" });
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
        (segment) =>
          segment.tracksComboState === true &&
          segment.start <= time + epsilon &&
          segment.end > time + epsilon,
      )
      .map((segment) => Number(segment.stacks) || 1),
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
        (segment) =>
          segment.tracksComboState === true &&
          segment.start < time - epsilon &&
          segment.end > time - epsilon,
      )
      .map((segment) => Number(segment.stacks) || 1),
  );
}

function getPhysicalMarkerPriority(typeKey: string) {
  return PHYSICAL_MARKER_PRIORITY[typeKey] || 0;
}

function getRepresentativePhysicalMarker(
  markers: EnemyAfflictionMarker[],
  previousStacks: number,
  activeStacks: number,
): EnemyAfflictionMarker | null {
  const physicalMarkers = markers.filter((marker) => PHYSICAL_REACTION_KEYS.has(marker.typeKey));
  if (physicalMarkers.length === 0) return null;

  if (previousStacks <= 0) {
    return {
      typeKey: "vulnerability",
      time: physicalMarkers[0]!.time,
      stacks: 1,
      icon: null,
      sourceId: physicalMarkers[0]!.sourceId,
    };
  }

  const representative = [...physicalMarkers].sort(
    (a, b) => getPhysicalMarkerPriority(b.typeKey) - getPhysicalMarkerPriority(a.typeKey),
  )[0]!;

  if (PHYSICAL_CONSUMING_KEYS.has(representative.typeKey)) {
    return {
      typeKey: representative.typeKey,
      time: representative.time,
      stacks: Math.min(
        4,
        Math.max(previousStacks, ...physicalMarkers.map((marker) => Number(marker.stacks) || 1)),
      ),
      icon: representative.icon,
      sourceId: representative.sourceId,
    };
  }

  if (PHYSICAL_STACKING_KEYS.has(representative.typeKey)) {
    return {
      typeKey: representative.typeKey,
      time: representative.time,
      stacks: Math.min(4, Math.max(activeStacks, previousStacks + 1)),
      icon: representative.icon,
      sourceId: representative.sourceId,
    };
  }

  return {
    typeKey: representative.typeKey,
    time: representative.time,
    stacks: Math.min(4, Math.max(activeStacks, previousStacks, Number(representative.stacks) || 1)),
    icon: representative.icon,
    sourceId: representative.sourceId,
  };
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
    .map((markers) => {
      const time = Number(markers[0]?.time) || 0;
      const damageHits = markers
        .filter((marker) => marker.isDamageHit && marker.hitData)
        .sort((a, b) => getPhysicalMarkerPriority(b.typeKey) - getPhysicalMarkerPriority(a.typeKey))
        .map((marker) => marker.hitData);
      const withDamageHits = (marker: EnemyAfflictionMarker) =>
        damageHits.length > 0 ? { ...marker, time, damageHits } : { ...marker, time };

      const previousStacks = getPreviousPhysicalComboStacks(group.segments, time, epsilon);
      const activeStacks = getActivePhysicalComboStacks(group.segments, time, epsilon);
      const representative = getRepresentativePhysicalMarker(markers, previousStacks, activeStacks);
      if (representative) return withDamageHits(representative);

      return withDamageHits([...markers].sort(
        (a, b) => getPhysicalMarkerPriority(b.typeKey) - getPhysicalMarkerPriority(a.typeKey),
      )[0]!);
    })
    .sort((a, b) => a.time - b.time);
}

function clipProjection<S extends { start: number; end: number; typeKey: string }>(
  projection: { segments: S[]; byTypeKey: Map<string, S[]> },
  maxTime: number | null | undefined,
): { segments: S[]; byTypeKey: Map<string, S[]> } {
  if (maxTime == null) return projection;
  const clipped = projection.segments
    .filter((segment) => segment.start < maxTime)
    .map((segment) => (segment.end > maxTime ? { ...segment, end: maxTime } : segment));
  return { segments: clipped, byTypeKey: buildByTypeKey(clipped) };
}

export function projectOptimizerResult(input: ProjectOptimizerResultInput) {
  const {
    simulation,
    compiledScenario,
    tracks,
    viewDuration,
    prepDuration = 0,
    simulationEndline = null,
  } = input;

  const simLog = simulation?.simLog || [];
  const operatorLog = simulation?.operatorLog || [];
  const enemyLog = simulation?.enemyLog || [];
  const initialSnapshot = simulation?.state?.getInitialSnapshot?.();
  const duration = Number(viewDuration) || 0;

  const logsWithPrep =
    initialSnapshot && Number(prepDuration) > 0
      ? [
          {
            type: "SP_REGEN_PAUSE",
            time: 0,
            payload: {
              sourceId: "prep",
              duration: Number(prepDuration) || 0,
              sp: initialSnapshot.team.sp,
            },
          },
          ...simLog,
        ]
      : simLog;

  const spSeries =
    simulation && initialSnapshot ? projectSpSeries(logsWithPrep, initialSnapshot, duration) : [];
  const staggerSeries =
    simulation && initialSnapshot
      ? projectStaggerSeries(simLog, initialSnapshot, compiledScenario?.enemyConfig, duration)
      : emptyStaggerSeries();

  const gaugeSeriesByTrackId = new Map<string, any>();
  if (simulation && initialSnapshot) {
    for (const track of tracks || []) {
      if (!track?.id) continue;
      gaugeSeriesByTrackId.set(
        track.id,
        projectUltimateSeries(simLog, initialSnapshot, track.id, duration),
      );
    }
  }

  const trackBuffLayouts =
    operatorLog.length > 0 ? projectActionBuffs(operatorLog, duration) : new Map();

  const enemyEffectProjection =
    simulation && compiledScenario
      ? clipProjection(projectFromSimLog(enemyLog, simLog), simulationEndline)
      : { segments: [], byTypeKey: new Map() };
  const enemyEffectLayout =
    simulation && compiledScenario ? layoutEnemyEffects(enemyEffectProjection as any) : emptyEnemyEffectLayout();
  const enemyAfflictionViz = projectEnemyAfflictionViz(enemyEffectLayout);

  const operatorEffectLayouts = new Map<string, any>();
  if (simulation && compiledScenario) {
    for (const track of tracks || []) {
      if (!track?.id) continue;
      const projection = clipProjection(
        projectOperatorEffects(track.id, operatorLog),
        simulationEndline,
      );
      operatorEffectLayouts.set(track.id, layoutOperatorEffects(projection as any));
    }
  }

  return {
    simLog,
    operatorLog,
    enemyLog,
    spSeries,
    staggerSeries,
    gaugeSeriesByTrackId,
    trackBuffLayouts,
    enemyEffectProjection,
    enemyEffectLayout,
    enemyAfflictionViz,
    operatorEffectLayouts,
  };
}
