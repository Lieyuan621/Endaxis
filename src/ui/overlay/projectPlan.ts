/**
 * v3 适配层：把「项目 + 场景 +（可选）模拟结果」投影成提示条用的 `OverlayPlan`。
 *
 * - 施放序列来自 `projectTimelineEditor()` 的纯投影（已解析 afterCastId 链式放置）；
 * - 技力 / 终结技能量来自模拟结果的 `resourceCurves`；
 * - 连携窗口来自 `projectComboWindowTimelineViz(receiptHistory, endFrame)`；
 * 三者都按「轨道 → operatorInstanceId」对齐到 HUD 的 trackId。
 *
 * 帧统一按项目 fps 换成秒（v3 的 `PROJECT_FPS = 30`）。
 */
import type { EndaxisProjectDocument, ScenarioDocument } from '../../core/project/schema';
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';
import type { ScenarioSimulationRun } from '../../application/simulation/scenarioSimulationService';
import { projectComboWindowTimelineViz } from '../../core/projection/comboWindowTimelineViz';
import { projectTimelineEditor } from '../timeline/timelineEditorViewModel';
import {
  buildOverlayPlan,
  type OverlayCast,
  type OverlayPlan,
  type OverlaySkillType,
  type OverlayTimePoint,
  type OverlayTimeWindow,
} from './plan';

const OPERATION_TYPE_MAP: Record<string, OverlaySkillType> = {
  basicAttack: 'basicAttack',
  battleSkill: 'battleSkill',
  comboSkill: 'comboSkill',
  ultimate: 'ultimate',
  finisher: 'finisher',
  plungingAttack: 'dive',
  dodge: 'other',
};

function prettifySlug(value: string | null | undefined): string {
  if (!value) return '干员';
  return value.replace(/[-_]/g, ' ');
}

/** 空计划：用于「没有项目 / 读取失败」时保持视图稳定。 */
export function emptyOverlayPlan(): OverlayPlan {
  return buildOverlayPlan({});
}

export interface ProjectOverlayPlanResult {
  plan: OverlayPlan;
  scenarioName: string;
  scenario: ScenarioDocument | null;
  fps: number;
}

export function buildOverlayPlanFromProject(
  project: EndaxisProjectDocument,
  repository: GameDataRepository,
  run?: ScenarioSimulationRun | null,
): ProjectOverlayPlanResult {
  const scenario =
    project.scenarios.find(item => item.id === project.activeScenarioId) ?? project.scenarios[0];
  if (!scenario) {
    return { plan: emptyOverlayPlan(), scenarioName: '', scenario: null, fps: project.fps };
  }

  const viewModel = projectTimelineEditor(scenario, repository);
  const fps = Math.max(1, project.fps || 30);

  /** 轨道身份：优先用 operatorInstanceId（模拟曲线/连携窗口用的就是它）。 */
  const tracks = viewModel.tracks.map(track => {
    const trackId =
      track.operatorInstanceId ?? track.operatorSlug ?? `track-${track.trackIndex}`;
    const slug = track.operatorSlug ?? trackId;
    const assetSlug = track.operatorAssetSlug ?? track.operatorSlug ?? slug;
    const operator = track.operatorSlug ? repository.getOperator(track.operatorSlug) : null;
    const displayName = (operator as { name?: string } | null)?.name ?? prettifySlug(assetSlug);
    return {
      trackId,
      operatorSlug: slug,
      operatorName: displayName,
      avatar: `/operators/${assetSlug}/avatar.webp`,
      portrait: `/operators/${assetSlug}/portrait.webp`,
      element: 'physical',
      trackIndex: track.trackIndex,
    };
  });

  const trackByIndex = new Map(tracks.map(track => [track.trackIndex, track]));
  const casts: OverlayCast[] = [];

  for (const track of viewModel.tracks) {
    const trackInfo = trackByIndex.get(track.trackIndex);
    if (!trackInfo) continue;
    for (const cast of track.skillCasts) {
      if (cast.disabled) continue;
      const source = cast.source as
        | { kind: 'operatorSkill'; skillKey: string; action?: unknown }
        | { kind: 'custom'; actionType: string; name: string };
      const operationType =
        cast.operationType ?? (source.kind === 'custom' ? source.actionType : 'basicAttack');
      const type = OPERATION_TYPE_MAP[operationType] ?? 'other';
      const start = cast.startFrame / fps;
      const end = (cast.startFrame + Math.max(0, cast.durationFrames)) / fps;
      casts.push({
        id: cast.id,
        trackId: trackInfo.trackId,
        trackIndex: track.trackIndex,
        operatorSlug: trackInfo.operatorSlug,
        operatorName: trackInfo.operatorName,
        avatar: trackInfo.avatar,
        portrait: trackInfo.portrait,
        skillIcon: '',
        name: source.kind === 'custom' ? source.name : operationType,
        type,
        element: 'physical',
        start,
        end,
        spCost: 0,
        gaugeCost: 0,
        segments: 1,
      });
    }
  }

  casts.sort((left, right) => left.start - right.start || left.trackIndex - right.trackIndex);

  const basePlan: OverlayPlan = {
    casts,
    tracks: tracks.map(({ trackIndex, ...rest }) => ({ ...rest, trackIndex })),
    duration: casts.reduce((max, cast) => Math.max(max, cast.end), 0),
    maxSp: 300,
    initialSp: 0,
    spPoints: [],
    gaugePoints: {},
    comboWindows: {},
    hasCasts: casts.length > 0,
  };

  if (!run) {
    return { plan: basePlan, scenarioName: scenario.name, scenario, fps };
  }

  return {
    plan: applySimulationResources(basePlan, run, fps),
    scenarioName: scenario.name,
    scenario,
    fps,
  };
}

/** 把模拟结果里的技力/终结技能量/连携窗口挂到 HUD 计划上。 */
export function applySimulationResources(
  plan: OverlayPlan,
  run: ScenarioSimulationRun,
  fps: number,
): OverlayPlan {
  const frameToTime = (frame: number) => frame / fps;

  const spPoints: OverlayTimePoint[] = run.resourceCurves.sp.points.map(point => ({
    time: frameToTime(point.frame),
    value: point.value,
  }));
  const maxSp = run.resourceCurves.sp.maxValue;

  const gaugePoints: Record<string, OverlayTimePoint[]> = {};
  for (const curve of run.resourceCurves.ultimateEnergy) {
    const points = curve.points.map(point => ({
      time: frameToTime(point.frame),
      value: point.value,
    }));
    if (points.length > 0) gaugePoints[curve.operatorId] = points;
  }

  const comboWindows: Record<string, OverlayTimeWindow[]> = {};
  try {
    const entries = run.receiptHistory.toArray();
    const segments = projectComboWindowTimelineViz(entries, run.frame);
    for (const segment of segments) {
      const windows = comboWindows[segment.operatorId] ?? [];
      windows.push({ start: frameToTime(segment.startFrame), end: frameToTime(segment.endFrame) });
      comboWindows[segment.operatorId] = windows;
    }
  } catch {
    // 没有连携回执（例如空轴）时忽略即可，HUD 会把「连携窗口」显示为待命。
  }

  return {
    ...plan,
    maxSp: maxSp > 0 ? maxSp : plan.maxSp,
    initialSp: spPoints[0]?.value ?? plan.initialSp,
    spPoints,
    gaugePoints,
    comboWindows,
  };
}
