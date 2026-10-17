/**
 * v3 适配层：把「项目 + 场景」投影成提示条可用的 `OverlayPlan`。
 *
 * v3 没有全局 store；时间轴数据来自 `projectTimelineEditor()` 的纯投影
 * （它已经把 `afterCastId` 链式放置解析成帧）。因此这里只做字段映射，
 * 不做任何战斗计算。
 *
 * 注意：v3 的技力/终结技能量/连携窗口来自模拟回执投影（`resourceCurves`、
 * `projectComboWindowTimelineViz`）。本版先只喂「施放序列」，资源条在没有曲线时隐藏；
 * 后续接上模拟服务即可补齐。
 */
import type { EndaxisProjectDocument } from '../../core/project/schema';
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';
import { projectTimelineEditor } from '../timeline/timelineEditorViewModel';
import { buildOverlayPlan, type OverlayCast, type OverlayPlan, type OverlaySkillType } from './plan';

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
  fps: number;
}

export function buildOverlayPlanFromProject(
  project: EndaxisProjectDocument,
  repository: GameDataRepository,
): ProjectOverlayPlanResult {
  const scenario =
    project.scenarios.find(item => item.id === project.activeScenarioId) ?? project.scenarios[0];
  if (!scenario) {
    return { plan: emptyOverlayPlan(), scenarioName: '', fps: project.fps };
  }

  const viewModel = projectTimelineEditor(scenario, repository);
  const fps = Math.max(1, project.fps || 30);

  const tracks = viewModel.tracks.map(track => {
    const slug = track.operatorSlug ?? `track-${track.trackIndex}`;
    const assetSlug = track.operatorAssetSlug ?? track.operatorSlug ?? slug;
    const operator = track.operatorSlug ? repository.getOperator(track.operatorSlug) : null;
    const displayName = (operator as { name?: string } | null)?.name ?? prettifySlug(assetSlug);
    return {
      trackId: slug,
      trackIndex: track.trackIndex,
      operatorSlug: slug,
      operatorName: displayName,
      avatar: `/operators/${assetSlug}/avatar.webp`,
      portrait: `/operators/${assetSlug}/portrait.webp`,
      element: 'physical',
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

  const plan: OverlayPlan = {
    casts,
    tracks,
    duration: casts.reduce((max, cast) => Math.max(max, cast.end), 0),
    maxSp: 300,
    initialSp: 0,
    spPoints: [],
    gaugePoints: {},
    comboWindows: {},
    hasCasts: casts.length > 0,
  };

  return { plan, scenarioName: scenario.name, fps };
}
