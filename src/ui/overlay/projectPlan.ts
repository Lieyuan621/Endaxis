/**
 * 导出适配层：读取原编辑器的项目与模拟结果，生成 HUD 可独立播放的计划。
 *
 * - 施放序列来自 `projectTimelineEditor()`，实际起止由同一模拟回执校正；
 * - 技力 / 终结技能量来自模拟结果的 `resourceCurves`；
 * - 连携窗口来自 `projectComboWindowTimelineViz(receiptHistory, endFrame)`；
 * 三者都按「轨道 → operatorInstanceId」对齐到 HUD 的 trackId。
 *
 * 帧统一按项目 fps 换成秒（v3 的 `PROJECT_FPS = 30`）。
 */
import type { EndaxisProjectDocument, ScenarioDocument } from '../../core/project/schema';
import type { GameDataRepository } from '../../core/game-data/gameDataRepository';
import type { ScenarioSimulationRun } from '../../application/simulation/scenarioSimulationService';
import type { CombatReceiptEntry } from '../../core/combat/receipt/combatReceipt';
import { projectComboWindowTimelineViz } from '../../core/projection/comboWindowTimelineViz';
import { projectResourceChangePoints } from '../../core/projection/resourceChangePoints';
import {
  projectSkillCastActualDurationFrames,
  projectSkillCastActualStartFrames,
  projectSkillCastInterruptionFrames,
} from '../../core/projection/timelineDisplayTime';
import { resolveEffectiveSkillDefinition } from '../../core/compiler/resolveSkillDefinition';
import { getOperatorCombatSkillName, getOperatorGameName } from '../../data/gameText';
import { getOperatorAvatarPath } from '../gameAssetPaths';
import {
  resolveOperatorPresentationFormKey,
  resolveOperatorSkillIcon,
} from '../timeline/library/operatorFormPresentation';
import { projectTimelineEditor } from '../timeline/timelineEditorViewModel';
import {
  emptyOverlayPlan,
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
  locale?: string,
): ProjectOverlayPlanResult {
  const scenario =
    project.scenarios.find(item => item.id === project.activeScenarioId) ?? project.scenarios[0];
  if (!scenario) {
    return { plan: emptyOverlayPlan(), scenarioName: '', scenario: null, fps: project.fps };
  }

  const viewModel = projectTimelineEditor(scenario, repository);
  const fps = Math.max(1, project.fps || 30);

  /** 轨道身份：优先用 operatorInstanceId（模拟曲线/连携窗口用的就是它）。 */
  const tracks = viewModel.tracks.flatMap(track => {
    if (track.operatorInstanceId === null || track.operatorSlug === null) return [];
    const trackId = track.operatorInstanceId;
    const slug = track.operatorSlug;
    const assetSlug = track.operatorAssetSlug ?? track.operatorSlug ?? slug;
    const operator = repository.getOperator(slug);
    const displayName = operator?.displayName ?? getOperatorGameName(assetSlug, locale);
    return [
      {
        trackId,
        operatorSlug: slug,
        operatorName: displayName,
        avatar: getOperatorAvatarPath(assetSlug),
        portrait: `/operators/${assetSlug}/portrait.webp`,
        element: operator?.element ?? 'physical',
        trackIndex: track.trackIndex,
      },
    ];
  });

  const trackByIndex = new Map(tracks.map(track => [track.trackIndex, track]));
  const casts: OverlayCast[] = [];

  for (const track of viewModel.tracks) {
    const trackInfo = trackByIndex.get(track.trackIndex);
    if (!trackInfo) continue;
    const operator = repository.getOperator(trackInfo.operatorSlug);
    const panel = run?.operatorPanels.find(panel => panel.operatorId === trackInfo.trackId);
    const formKey =
      operator && panel ? resolveOperatorPresentationFormKey(operator, panel.attributes) : null;
    for (const cast of track.skillCasts) {
      if (cast.disabled) continue;
      const source = cast.source;
      const document = scenario.tracks[track.trackIndex]?.skillCasts.find(
        item => item.id === cast.id,
      );
      const resolved =
        operator && document && source.kind === 'operatorSkill' && !cast.resolutionIssue
          ? resolveEffectiveSkillDefinition(document, operator)
          : null;
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
        skillIcon:
          operator && resolved
            ? resolveOperatorSkillIcon(
                {
                  skill: resolved.definition,
                  group: resolved.group,
                  origin: resolved.variantKey === undefined ? 'base' : 'variant',
                },
                formKey,
                operator,
              )
            : '',
        name:
          source.kind === 'custom'
            ? source.name
            : getOperatorCombatSkillName(
                track.operatorAssetSlug ?? trackInfo.operatorSlug,
                resolved?.group.key ?? source.skillGroupKey,
                locale,
                operationType,
                resolved?.variantKey ?? formKey,
              ),
        type,
        element:
          source.kind === 'custom' ? (source.element ?? trackInfo.element) : trackInfo.element,
        start,
        end,
        spCost: null,
        gaugeCost: 0,
        segments: 1,
      });
    }
  }

  casts.sort((left, right) => left.start - right.start || left.trackIndex - right.trackIndex);

  const basePlan: OverlayPlan = {
    casts,
    tracks: tracks.map(({ trackIndex, ...rest }) => ({ ...rest, trackIndex })),
    startTime: Math.min(0, ...casts.map(cast => cast.start)),
    duration: casts.reduce((max, cast) => Math.max(max, cast.end), 0),
    maxSp: 300,
    initialSp: 0,
    spPoints: [],
    gaugePoints: {},
    gaugeMaxValues: Object.fromEntries(
      viewModel.tracks.flatMap(track =>
        track.operatorInstanceId !== null && track.maxUltimateEnergy !== null
          ? [[track.operatorInstanceId, track.maxUltimateEnergy]]
          : [],
      ),
    ),
    comboWindows: {},
    hasCasts: casts.length > 0,
  };

  if (!run) {
    return { plan: basePlan, scenarioName: scenario.name, scenario, fps };
  }

  return {
    plan: applySimulationResult(basePlan, run, fps),
    scenarioName: scenario.name,
    scenario,
    fps,
  };
}

/** 同一回执同时决定动作时间、费用和资源曲线，避免预览帧与实际帧混用。 */
export function applySimulationResult(
  plan: OverlayPlan,
  run: ScenarioSimulationRun,
  fps: number,
): OverlayPlan {
  const frameToTime = (frame: number) => frame / fps;
  const entries = run.receiptHistory.toArray();
  const starts = projectSkillCastActualStartFrames(entries);
  const durations = projectSkillCastActualDurationFrames(entries);
  const interruptions = projectSkillCastInterruptionFrames(entries);
  const costs = projectCastResourceCosts(entries);
  const casts = plan.casts
    .map(cast => {
      const startFrame = starts.get(cast.id);
      const start = startFrame === undefined ? cast.start : frameToTime(startFrame);
      const durationFrames = durations.get(cast.id);
      const end =
        start +
        (durationFrames === undefined ? cast.end - cast.start : frameToTime(durationFrames));
      const interruptionFrame = interruptions.get(cast.id);
      const cost = costs.get(cast.id);
      return {
        ...cast,
        start,
        end: interruptionFrame === undefined ? end : Math.min(end, frameToTime(interruptionFrame)),
        spCost: cost?.sp ?? null,
        gaugeCost: cost?.ultimateEnergy ?? cast.gaugeCost,
      };
    })
    .sort((left, right) => left.start - right.start || left.trackIndex - right.trackIndex);

  const spPoints: OverlayTimePoint[] = run.resourceCurves.sp.points.map(point => ({
    time: frameToTime(point.frame),
    value: point.value,
  }));
  const maxSp = run.resourceCurves.sp.maxValue;

  const gaugePoints: Record<string, OverlayTimePoint[]> = {};
  const gaugeMaxValues: Record<string, number> = {};
  for (const curve of run.resourceCurves.ultimateEnergy) {
    gaugeMaxValues[curve.operatorId] = curve.maxValue;
    const points = curve.points.map(point => ({
      time: frameToTime(point.frame),
      value: point.value,
    }));
    if (points.length > 0) gaugePoints[curve.operatorId] = points;
  }

  const comboWindows: Record<string, OverlayTimeWindow[]> = {};
  const segments = projectComboWindowTimelineViz(entries, run.frame);
  const windowsByOperator = new Map<string, Map<number, OverlayTimeWindow>>();
  for (const segment of segments) {
    const windows =
      windowsByOperator.get(segment.operatorId) ?? new Map<number, OverlayTimeWindow>();
    const window = windows.get(segment.sequence);
    const start = frameToTime(segment.startFrame);
    const end = frameToTime(segment.endFrame);
    // 时间轴为精准区间切段；HUD 的剩余时间仍以同一真实窗口的完整边界为准。
    if (window) {
      window.start = Math.min(window.start, start);
      window.end = Math.max(window.end, end);
    } else windows.set(segment.sequence, { start, end });
    windowsByOperator.set(segment.operatorId, windows);
  }
  for (const [operatorId, windows] of windowsByOperator)
    comboWindows[operatorId] = [...windows.values()];

  return {
    ...plan,
    casts,
    startTime: Math.min(0, ...casts.map(cast => cast.start)),
    duration: casts.reduce((max, cast) => Math.max(max, cast.end), 0),
    maxSp: maxSp > 0 ? maxSp : plan.maxSp,
    initialSp: spPoints[0]?.value ?? plan.initialSp,
    spPoints,
    gaugePoints,
    gaugeMaxValues,
    comboWindows,
  };
}

/** 支付变化与支付失败的门禁回执都保留已解析费用，不从定义或资源净变化猜测。 */
function projectCastResourceCosts(entries: readonly CombatReceiptEntry[]) {
  const changes = new Map(
    projectResourceChangePoints(entries).map(point => [point.sequence, point]),
  );
  const result = new Map<string, { sp: number; ultimateEnergy: number }>();
  const unavailableSpCosts = new Map<string, number>();
  entries.forEach((entry, index) => {
    const castId = entry.data?.castId;
    if (typeof castId !== 'string') return;
    if (entry.event === 'SkillCostUnavailableAtStart' || entry.event === 'SkillCostRejected') {
      const spNeed = entry.data?.spNeed;
      if (typeof spNeed === 'number' && Number.isFinite(spNeed) && spNeed >= 0)
        unavailableSpCosts.set(castId, spNeed);
    }
    if (entry.event !== 'SkillCostApplied') return;
    const cost = result.get(castId) ?? { sp: 0, ultimateEnergy: 0 };
    // 运行时先连续发布本次支付的资源变化，再发布 SkillCostApplied。
    // requestedValue 保留真实应付金额，即使终结技能量 Setter 拒绝变化也不会变成零费用。
    for (let previousIndex = index - 1; previousIndex >= 0; previousIndex--) {
      const previous = entries[previousIndex]!;
      const change = changes.get(previous.sequence);
      if (
        !change ||
        previous.frame !== entry.frame ||
        previous.sourceId !== entry.sourceId ||
        previous.data?.castId !== castId ||
        previous.data?.skillId !== entry.data?.skillId
      )
        break;
      cost[change.resource] += Math.max(0, -change.requestedValue);
    }
    result.set(castId, cost);
  });
  // 已支付金额优先；没有支付回执时，用运行时明确报告的应付 SP 保留不足提示。
  for (const [castId, sp] of unavailableSpCosts)
    if (!result.has(castId)) result.set(castId, { sp, ultimateEnergy: 0 });
  return result;
}
