import { buildByTypeKey } from '@/simulation/projection/effectLayout';
import { projectFromSimLog, layoutEnemyEffects } from '@/simulation/projection/projectEnemyEffects';
import {
  projectOperatorEffects,
  layoutOperatorEffects,
} from '@/simulation/projection/projectOperatorEffects';
import { projectSpSeries } from '@/simulation/projection/projectSpSeries';
import { projectStaggerSeries } from '@/simulation/projection/projectStaggerSeries';
import { projectUltimateSeries } from '@/simulation/projection/projectUltimateSeries';
import { projectActionBuffs } from '@/simulation/projection/projectActionBuffs';
import { projectAllComboWindows } from '@/simulation/projection/projectComboWindows';
import { projectRequisiteWarnings } from '@/simulation/projection/projectRequisiteWarnings';
import { projectEnemyAfflictionViz } from '@/simulation/projection/projectEnemyAfflictionViz';

interface ProjectOptimizerResultInput {
  simulation: any;
  compiledScenario: any;
  tracks: any[];
  viewDuration: number;
  prepDuration?: number;
  simulationEndline?: number | null;
}

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

function clipProjection<S extends { start: number; end: number; typeKey: string }>(
  projection: { segments: S[]; byTypeKey: Map<string, S[]> },
  maxTime: number | null | undefined,
): { segments: S[]; byTypeKey: Map<string, S[]> } {
  if (maxTime == null) return projection;
  const clipped = projection.segments
    .filter(segment => segment.start < maxTime)
    .map(segment => (segment.end > maxTime ? { ...segment, end: maxTime } : segment));
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
            type: 'SP_REGEN_PAUSE',
            time: 0,
            payload: {
              sourceId: 'prep',
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
    simulation && compiledScenario
      ? layoutEnemyEffects(enemyEffectProjection as any)
      : emptyEnemyEffectLayout();
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

  const comboWindowLayouts =
    operatorLog.length > 0 && tracks?.length
      ? projectAllComboWindows(
          operatorLog,
          tracks.filter(t => t?.id).map(t => t.id),
          duration,
        )
      : new Map<string, any>();

  const requisiteWarnings = projectRequisiteWarnings(
    tracks || [],
    comboWindowLayouts,
    spSeries,
    gaugeSeriesByTrackId,
  );

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
    comboWindowLayouts,
    requisiteWarnings,
  };
}
