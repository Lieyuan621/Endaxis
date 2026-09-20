/**
 * 按旧轴的全局技能顺序，逐个用新版模拟结果修正放置时间。
 *
 * 这里只负责可组合的启发式排程：调用方提供模拟器，本文件读取回执中的
 * 真实开始、技能块实际显示结束和终结技时间膨胀区间。后续规则应作为新的明确步骤加入，
 * 不要把它们隐藏在存档转换或技能定义中。
 */
import type { CombatReceiptEntry } from '../../core/combat/receipt/combatReceipt';
import type { ScheduledCombatFrameInput } from '../simulation/combatInputSchedule';
import type {
  EndaxisProjectDocument,
  ScenarioDocument,
  SkillCastDocument,
} from '../../core/project/schema';
import {
  projectSkillCastActualDurationFrames,
  projectSkillCastActualStartFrames,
  projectSkillCastInterruptionFrames,
} from '../../core/projection/timelineDisplayTime';
import {
  isLegacyControlledInputCast,
  legacyInferredControlSwitchId,
  synchronizeLegacyInferredControlSwitches,
} from './controlInference';

type UnknownRecord = Record<string, unknown>;

/** 保留时间只判断形态和补主控标记，不顺延技能或寻找可接续窗口。 */
export type LegacyTimingMode = 'repair' | 'preserve';

/** 严格比较模拟输入中的纯数据；转换器需要同时运行在 Node CLI 和浏览器中。 */
function isSameInputData(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((value, index) => isSameInputData(value, right[index]));
  }
  if (Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) return false;
  const leftRecord = left as UnknownRecord;
  const rightRecord = right as UnknownRecord;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      key => Object.hasOwn(rightRecord, key) && isSameInputData(leftRecord[key], rightRecord[key]),
    )
  );
}

export interface LegacyTimingAdjustment {
  readonly scenarioId: string;
  readonly castId: string;
  readonly trackIndex: number;
  readonly actionIndex: number;
  readonly sourceStartFrame: number;
  readonly adjustedStartFrame: number;
  readonly sameTrackEndCandidate?: number;
  readonly globalOrderCandidate?: number;
  readonly pushedByUltimateTimeDilation: boolean;
  readonly ultimateTimeDilationEndFrame?: number;
  readonly inputWindowDelayFrames?: number;
  readonly inputWindowSearchExhausted?: boolean;
  /** 不同干员的两个主控动作原本落在同一帧时，为后一个动作增加的最小间隔。 */
  readonly controlInputSeparationFrames?: number;
}

export interface LegacySkillFormAdjustment {
  readonly scenarioId: string;
  readonly castId: string;
  readonly trackIndex: number;
  readonly actionIndex: number;
  /** 旧轴只记录基础操作时，转换前写入的基础技能。 */
  readonly sourceSkillKey: string;
  /** 模拟按当前原生技能槽解析出的实际替换形态。 */
  readonly resolvedSkillKey: string;
}

export interface LegacyControlSwitchAdjustment {
  readonly scenarioId: string;
  readonly switchId: string;
  readonly trackIndex: number;
  readonly sourceFrame: number;
  readonly adjustedFrame: number;
  readonly previousCastId?: string;
  readonly nextCastId?: string;
}

export interface LegacyInferredControlSwitch {
  readonly scenarioId: string;
  readonly switchId: string;
  readonly castId: string;
  readonly trackIndex: number;
  readonly sourceFrame: number;
  readonly inferredFrame: number;
}

export interface LegacyDodgeMarkerAdjustment {
  readonly scenarioId: string;
  readonly markerId: string;
  readonly trackIndex: number;
  readonly sourceFrame: number;
  readonly adjustedFrame: number;
  readonly previousCastId?: string;
  readonly nextCastId?: string;
}

export interface LegacyRetimingResult {
  readonly timingAdjustments: readonly LegacyTimingAdjustment[];
  readonly skillFormAdjustments: readonly LegacySkillFormAdjustment[];
  readonly controlSwitchAdjustments: readonly LegacyControlSwitchAdjustment[];
  readonly inferredControlSwitches: readonly LegacyInferredControlSwitch[];
  readonly dodgeMarkerAdjustments: readonly LegacyDodgeMarkerAdjustment[];
  readonly simulationStats: {
    readonly scenarioCount: number;
    readonly castCount: number;
    readonly candidateProbes: number;
    readonly simulationRuns: number;
    /** simulationRuns 保留观察次数口径；这里区分新建分支与沿原分支延长观察。 */
    readonly checkpoints?: {
      readonly compiledSessions: number;
      readonly trials: number;
      readonly observationExtensions: number;
    };
  };
}

export interface LegacyRetimingSimulationResult {
  readonly receiptEntries: readonly CombatReceiptEntry[];
}

export type LegacyRetimingSimulationRunner = (
  scenario: ScenarioDocument,
  endFrame: number,
) => LegacyRetimingSimulationResult;

export interface LegacyRetimingTrial {
  advanceToFrame(
    endFrame: number,
    stopWhen?: (result: LegacyRetimingSimulationResult) => boolean,
  ): LegacyRetimingSimulationResult;
  /** 释放候选分支、排程器和游标；释放后不能继续观察。 */
  dispose(): void;
}

export interface LegacyRetimingCheckpointSession {
  readonly inputBoundary: number;
  advanceBefore(
    frame: number,
    confirmedInputsFromCurrentBoundary: readonly ScheduledCombatFrameInput[],
  ): void;
  trial(inputsAfterCheckpoint: readonly ScheduledCombatFrameInput[]): LegacyRetimingTrial;
}

export interface LegacyRetimingCheckpointSupport {
  compileInputs(scenario: ScenarioDocument): readonly ScheduledCombatFrameInput[];
  createSession(scenario: ScenarioDocument, initialFrame: number): LegacyRetimingCheckpointSession;
}

/** 同帧任何人工输入变化都必须回到该帧之前，包括被移走的标记原帧。 */
function firstChangedInputFrame(
  accepted: readonly ScheduledCombatFrameInput[],
  candidate: readonly ScheduledCombatFrameInput[],
): number {
  let index = 0;
  while (
    index < accepted.length &&
    index < candidate.length &&
    isSameInputData(accepted[index], candidate[index])
  )
    index += 1;
  return Math.min(accepted[index]?.frame ?? Infinity, candidate[index]?.frame ?? Infinity);
}

export type LegacyRuntimeReplacementResolver = (input: {
  readonly scenario: ScenarioDocument;
  readonly trackIndex: number;
  readonly skillGroupKey: string;
  readonly expectedSkillKey: string;
  readonly actualSkillKey: string;
}) => string | null;

interface OrderedCast {
  readonly castId: string;
  readonly trackIndex: number;
  readonly actionIndex: number;
  readonly sourceStartFrame: number;
}

interface FrameInterval {
  readonly startFrame: number;
  readonly endFrame: number;
}

const PLANNING_LOOKAHEAD_FRAMES = 300;
const MAX_PLANNING_EXTENSIONS = 12;
const MAX_INPUT_WINDOW_DELAY_FRAMES = 300;

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(record).filter(value => value !== null) : [];
}

function integer(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null;
}

function ultimateTimeDilationIntervals(
  entries: readonly CombatReceiptEntry[],
  simulationEndFrame: number,
): readonly FrameInterval[] {
  const active = new Map<number, number>();
  const intervals: FrameInterval[] = [];
  for (const entry of entries) {
    if (entry.event === 'TimeDilationStarted') {
      if (entry.data?.kind !== 'global' || entry.data.slot !== 'ultimate') continue;
      const instanceId = entry.data.instanceId;
      if (!Number.isSafeInteger(instanceId)) continue;
      active.set(instanceId as number, entry.frame);
      continue;
    }
    if (entry.event !== 'TimeDilationEnded') continue;
    const instanceId = entry.data?.instanceId;
    if (!Number.isSafeInteger(instanceId)) continue;
    const startFrame = active.get(instanceId as number);
    if (startFrame === undefined) continue;
    active.delete(instanceId as number);
    if (entry.frame > startFrame) intervals.push({ startFrame, endFrame: entry.frame });
  }
  for (const startFrame of active.values()) {
    if (simulationEndFrame > startFrame)
      intervals.push({ startFrame, endFrame: simulationEndFrame });
  }
  return intervals.sort(
    (left, right) => left.startFrame - right.startFrame || left.endFrame - right.endFrame,
  );
}

function hasOpenUltimateTimeDilation(entries: readonly CombatReceiptEntry[]): boolean {
  const active = new Set<number>();
  for (const entry of entries) {
    const instanceId = entry.data?.instanceId;
    if (!Number.isSafeInteger(instanceId)) continue;
    if (
      entry.event === 'TimeDilationStarted' &&
      entry.data?.kind === 'global' &&
      entry.data.slot === 'ultimate'
    ) {
      active.add(instanceId as number);
    } else if (entry.event === 'TimeDilationEnded') {
      active.delete(instanceId as number);
    }
  }
  return active.size > 0;
}

function moveOutsideUltimateTimeDilation(
  frame: number,
  intervals: readonly FrameInterval[],
): { frame: number; intervalEnd?: number } {
  for (const interval of intervals) {
    if (frame < interval.startFrame) break;
    // TimeDilationEnded 与玩家输入在同一实际帧时，输入阶段仍可能先观察到演出状态。
    // “时间膨胀结束后”因此是结束回执的下一帧，不能把技能放在结束回执同帧。
    if (frame <= interval.endFrame)
      return { frame: interval.endFrame + 1, intervalEnd: interval.endFrame };
  }
  return { frame };
}

interface InputWindowCandidate {
  readonly frame: number;
  readonly latestUltimateTimeDilationEndFrame?: number;
}

/**
 * 预先生成逐帧试探原本会访问的位置，但不启动模拟。
 * 终结技膨胀区间整体跳过，因此序号仍对应“最多尝试多少次”，不会改变旧规则的搜索边界。
 */
function inputWindowCandidates(
  initialFrame: number,
  intervals: readonly FrameInterval[],
): readonly InputWindowCandidate[] {
  const candidates: InputWindowCandidate[] = [{ frame: initialFrame }];
  let frame = initialFrame;
  let latestUltimateTimeDilationEndFrame: number | undefined;
  for (let index = 0; index < MAX_INPUT_WINDOW_DELAY_FRAMES; index += 1) {
    const next = moveOutsideUltimateTimeDilation(frame + 1, intervals);
    frame = next.frame;
    if (next.intervalEnd !== undefined) latestUltimateTimeDilationEndFrame = next.intervalEnd;
    candidates.push({
      frame,
      ...(latestUltimateTimeDilationEndFrame === undefined
        ? {}
        : { latestUltimateTimeDilationEndFrame }),
    });
  }
  return candidates;
}

interface InputWindowProbeResult {
  readonly settled: boolean;
  readonly blocked: boolean;
}

/** 初始候选已确认被拦截后，定位第一个未被拦截的候选，并让最后一次探测停在该位置。 */
function findFirstAllowedInputWindowCandidate(
  candidateCount: number,
  probe: (index: number) => InputWindowProbeResult,
): { readonly settled: boolean; readonly allowedIndex?: number } {
  // AllowedNextSkill 可以短暂开放后关闭，之后才到达可打断边界，许可并不单调。
  // 在运行时切面可用之前逐帧检查，不能用二分或指数跳步漏掉中间的合法窗口。
  for (let probeIndex = 1; probeIndex < candidateCount; probeIndex += 1) {
    const result = probe(probeIndex);
    if (!result.settled) return { settled: false };
    if (!result.blocked) return { settled: true, allowedIndex: probeIndex };
  }
  return { settled: true };
}

function projectDisplayedCastEndFrames(
  entries: readonly CombatReceiptEntry[],
  starts: ReadonlyMap<string, number>,
): ReadonlyMap<string, number> {
  const actualDurations = new Map(projectSkillCastActualDurationFrames(entries));
  const ends = new Map<string, number>();
  for (const [castId, duration] of actualDurations) {
    const startFrame = starts.get(castId);
    if (startFrame !== undefined) ends.set(castId, startFrame + duration);
  }
  for (const [castId, interruptionFrame] of projectSkillCastInterruptionFrames(entries)) {
    ends.set(castId, interruptionFrame);
  }
  for (const entry of entries) {
    if (entry.event !== 'SkillSwitchedToBuff') continue;
    const castId = entry.data?.castId;
    if (typeof castId === 'string') ends.set(castId, entry.frame + 1);
  }
  return ends;
}

/** 同步切换成 Buff 的输入没有技能生命周期，但它确实在该帧执行并占用一个输入边界。 */
function projectExecutedCastStartFrames(
  entries: readonly CombatReceiptEntry[],
): ReadonlyMap<string, number> {
  const starts = new Map(projectSkillCastActualStartFrames(entries));
  for (const entry of entries) {
    if (entry.event !== 'SkillSwitchedToBuff') continue;
    const castId = entry.data?.castId;
    if (typeof castId === 'string' && !starts.has(castId)) starts.set(castId, entry.frame);
  }
  return starts;
}

function setSimulationDisabled(cast: SkillCastDocument, disabled: boolean): void {
  if (disabled) {
    cast.presentation = { ...cast.presentation, disabled: true };
    return;
  }
  if (cast.presentation === undefined) return;
  const { disabled: _disabled, ...presentation } = cast.presentation;
  cast.presentation = Object.keys(presentation).length === 0 ? undefined : presentation;
}

function castCannotInterruptCurrentSkill(
  entries: readonly CombatReceiptEntry[],
  castId: string,
): boolean {
  return entries.some(
    entry =>
      entry.event === 'SkillInputCannotInterruptCurrentSkill' && entry.data?.castId === castId,
  );
}

function mismatchedActualSkillKey(
  entries: readonly CombatReceiptEntry[],
  castId: string,
): string | null {
  const mismatch = entries.find(
    entry => entry.event === 'SkillInputResolvedToDifferentSkill' && entry.data?.castId === castId,
  );
  return typeof mismatch?.data?.actualSkillId === 'string' ? mismatch.data.actualSkillId : null;
}

function retimeControlSwitches(
  scenario: ScenarioDocument,
  working: ScenarioDocument,
  sourceData: UnknownRecord,
  processed: readonly OrderedCast[],
): void {
  const sourceSwitches = records(sourceData.switchEvents);
  const targetSwitches = scenario.battle.controlSwitches ?? [];
  const workingSwitches = working.battle.controlSwitches ?? [];
  for (const [index, sourceSwitch] of sourceSwitches.entries()) {
    const sourceFrame = integer(sourceSwitch.time);
    if (sourceFrame === null) continue;
    const switchId =
      typeof sourceSwitch.id === 'string' ? sourceSwitch.id : `legacy-switch-${index}`;
    const target = targetSwitches.find(item => item.id === switchId);
    const simulationTarget = workingSwitches.find(item => item.id === switchId);
    if (target === undefined || simulationTarget === undefined) continue;

    const { frame } = retimeMarkerFrame(scenario, processed, sourceFrame);
    target.frame = frame;
    simulationTarget.frame = frame;
  }
}

function retimeMarkerFrame(
  scenario: ScenarioDocument,
  processed: readonly OrderedCast[],
  sourceFrame: number,
): { readonly frame: number; readonly previous?: OrderedCast; readonly next?: OrderedCast } {
  const previous = processed.findLast(item => item.sourceStartFrame <= sourceFrame);
  const next = processed.find(item => item.sourceStartFrame >= sourceFrame);
  let frame = sourceFrame;
  if (previous !== undefined) {
    const previousStart = scenario.tracks[previous.trackIndex]?.skillCasts.find(
      cast => cast.id === previous.castId,
    )?.placement.startFrame;
    if (previousStart !== undefined) {
      frame = previousStart + (sourceFrame - previous.sourceStartFrame);
    }
  } else if (next !== undefined) {
    const nextStart = scenario.tracks[next.trackIndex]?.skillCasts.find(
      cast => cast.id === next.castId,
    )?.placement.startFrame;
    if (nextStart !== undefined) frame = nextStart - (next.sourceStartFrame - sourceFrame);
  }
  if (next !== undefined) {
    const nextStart = scenario.tracks[next.trackIndex]?.skillCasts.find(
      cast => cast.id === next.castId,
    )?.placement.startFrame;
    if (nextStart !== undefined) frame = Math.min(frame, nextStart);
  }
  return { frame, previous, next };
}

function retimeDodgeMarkers(
  scenario: ScenarioDocument,
  working: ScenarioDocument,
  sourceData: UnknownRecord,
  processed: readonly OrderedCast[],
): void {
  records(sourceData.tracks).forEach((sourceTrack, trackIndex) => {
    records(sourceTrack.actions).forEach((action, actionIndex) => {
      if (record(action.convertedDodge) === null) return;
      const sourceFrame = integer(action.startTime) ?? integer(action.logicalStartTime);
      if (sourceFrame === null) return;
      const markerId = `legacy:${scenario.id}:track:${trackIndex}:dodge:${actionIndex}`;
      const target = scenario.battle.dodgeMarkers?.find(marker => marker.id === markerId);
      const simulationTarget = working.battle.dodgeMarkers?.find(marker => marker.id === markerId);
      if (target === undefined || simulationTarget === undefined) return;
      const { frame } = retimeMarkerFrame(scenario, processed, sourceFrame);
      target.frame = frame;
      simulationTarget.frame = frame;
    });
  });
}

function moveAfterConflictingControlledInput(
  scenario: ScenarioDocument,
  current: OrderedCast,
  processed: readonly OrderedCast[],
  frame: number,
): number {
  const currentCast = scenario.tracks[current.trackIndex]?.skillCasts.find(
    cast => cast.id === current.castId,
  );
  if (currentCast === undefined || !isLegacyControlledInputCast(currentCast)) return frame;
  let candidate = frame;
  while (
    processed.some(item => {
      if (item.trackIndex === current.trackIndex) return false;
      const cast = scenario.tracks[item.trackIndex]?.skillCasts.find(
        candidateCast => candidateCast.id === item.castId,
      );
      return (
        cast !== undefined &&
        isLegacyControlledInputCast(cast) &&
        cast.placement.startFrame === candidate
      );
    })
  ) {
    candidate += 1;
  }
  return candidate;
}

/** 原地修正转换结果，返回不写入项目存档的审计记录。 */
export function retimeLegacyProjectBySimulation(
  project: EndaxisProjectDocument,
  preparedSource: unknown,
  runSimulation: LegacyRetimingSimulationRunner,
  resolveRuntimeReplacement?: LegacyRuntimeReplacementResolver,
  checkpointSupport?: LegacyRetimingCheckpointSupport,
  timingMode: LegacyTimingMode = 'repair',
): LegacyRetimingResult {
  const repairTiming = timingMode === 'repair';
  const root = record(preparedSource);
  const sourceScenarios = records(root?.scenarioList);
  const timingAdjustments: LegacyTimingAdjustment[] = [];
  const skillFormAdjustments: LegacySkillFormAdjustment[] = [];
  const controlSwitchAdjustments: LegacyControlSwitchAdjustment[] = [];
  const inferredControlSwitches: LegacyInferredControlSwitch[] = [];
  const dodgeMarkerAdjustments: LegacyDodgeMarkerAdjustment[] = [];
  let retimedScenarioCount = 0;
  let retimedCastCount = 0;
  let candidateProbes = 0;
  let simulationRuns = 0;
  let compiledSessions = 0;
  let checkpointTrials = 0;
  let observationExtensions = 0;

  for (const scenario of project.scenarios) {
    const sourceWrapper = sourceScenarios.find(wrapper => wrapper.id === scenario.id);
    const sourceData = record(sourceWrapper?.data);
    if (sourceData === null) continue;
    const sourceTracks = records(sourceData.tracks);
    const ordered: OrderedCast[] = [];

    scenario.tracks.forEach((track, trackIndex) => {
      if (track === null) return;
      const sourceActions = records(sourceTracks[trackIndex]?.actions);
      sourceActions.forEach((action, actionIndex) => {
        const baseId = `legacy:${scenario.id}:track:${trackIndex}:cast:${actionIndex}`;
        const actionStartFrame = integer(action.startTime) ?? integer(action.logicalStartTime);
        const casts = track.skillCasts.filter(
          candidate => candidate.id === baseId || candidate.id.startsWith(`${baseId}:sequence:`),
        );
        casts.forEach(cast => {
          if (cast.presentation?.disabled === true) return;
          const sourceStartFrame = cast.placement.startFrame ?? actionStartFrame ?? undefined;
          if (sourceStartFrame === undefined) return;
          cast.placement = { startFrame: sourceStartFrame };
          ordered.push({ castId: cast.id, trackIndex, actionIndex, sourceStartFrame });
        });
      });
    });
    ordered.sort(
      (left, right) =>
        left.sourceStartFrame - right.sourceStartFrame ||
        left.trackIndex - right.trackIndex ||
        left.actionIndex - right.actionIndex,
    );
    if (ordered.length === 0) continue;
    retimedScenarioCount += 1;
    retimedCastCount += ordered.length;

    const working = structuredClone(scenario);
    const workingCasts = new Map(
      working.tracks.flatMap(track =>
        (track?.skillCasts ?? []).map(cast => [cast.id, cast] as const),
      ),
    );
    for (const item of ordered) setSimulationDisabled(workingCasts.get(item.castId)!, true);

    const previousByTrack = new Map<number, OrderedCast>();
    let previousGlobal: OrderedCast | undefined;
    let actualStarts = new Map<string, number>();
    let actualEnds = new Map<string, number>();
    let ultimateIntervals: readonly FrameInterval[] = [];
    let lastReceiptEntries: readonly CombatReceiptEntry[] = [];
    let checkpointSession: LegacyRetimingCheckpointSession | undefined;
    let acceptedInputs: readonly ScheduledCombatFrameInput[] = [];

    for (const [index, current] of ordered.entries()) {
      let candidate = current.sourceStartFrame;
      let sameTrackEndCandidate: number | undefined;
      let globalOrderCandidate: number | undefined;
      if (repairTiming && index > 0) {
        const previousTrack = previousByTrack.get(current.trackIndex);
        if (previousTrack !== undefined) {
          sameTrackEndCandidate = actualEnds.get(previousTrack.castId);
          if (sameTrackEndCandidate === undefined) {
            const lifecycle = lastReceiptEntries
              .filter(entry => entry.data?.castId === previousTrack.castId)
              .map(entry => `${entry.frame}:${entry.event}`)
              .join(', ');
            throw new Error(
              `cast '${previousTrack.castId}' has no simulated display end (${lifecycle || 'no receipts'})`,
            );
          }
          candidate = Math.max(candidate, sameTrackEndCandidate);
        }
        const previousStart = actualStarts.get(previousGlobal!.castId);
        if (previousStart === undefined) {
          throw new Error(`cast '${previousGlobal!.castId}' has no simulated start`);
        }
        globalOrderCandidate =
          previousStart + (current.sourceStartFrame - previousGlobal!.sourceStartFrame);
        candidate = Math.max(candidate, globalOrderCandidate);
      }
      const priorUltimateIntervals = ultimateIntervals;
      const outsideDilation = repairTiming
        ? moveOutsideUltimateTimeDilation(candidate, priorUltimateIntervals)
        : { frame: candidate, intervalEnd: undefined };
      let adjustedStartFrame = outsideDilation.frame;
      let ultimateTimeDilationEndFrame = outsideDilation.intervalEnd;
      const separatedStartFrame = repairTiming
        ? moveAfterConflictingControlledInput(
            scenario,
            current,
            ordered.slice(0, index),
            adjustedStartFrame,
          )
        : adjustedStartFrame;
      const controlInputSeparationFrames = separatedStartFrame - adjustedStartFrame;
      if (controlInputSeparationFrames > 0) {
        const separatedOutsideDilation = moveOutsideUltimateTimeDilation(
          separatedStartFrame,
          priorUltimateIntervals,
        );
        adjustedStartFrame = separatedOutsideDilation.frame;
        if (separatedOutsideDilation.intervalEnd !== undefined)
          ultimateTimeDilationEndFrame = separatedOutsideDilation.intervalEnd;
      }
      const initialAdjustedStartFrame = adjustedStartFrame;
      let inputWindowDelayFrames = 0;
      let inputWindowSearchExhausted = false;
      let fallbackActualStarts: ReadonlyMap<string, number> | undefined;
      let fallbackActualEnds: ReadonlyMap<string, number> | undefined;
      let fallbackUltimateIntervals: readonly FrameInterval[] | undefined;
      let sourceSkillKey: string | undefined;
      let resolvedSkillKey: string | undefined;

      const targetCast = scenario.tracks[current.trackIndex]!.skillCasts.find(
        cast => cast.id === current.castId,
      )!;
      const workingCast = workingCasts.get(current.castId)!;
      setSimulationDisabled(workingCast, false);

      let settled = false;
      let candidateCheckpointPrepared = false;
      const simulateCandidate = (candidateFrame: number): boolean => {
        candidateProbes += 1;
        adjustedStartFrame = candidateFrame;
        targetCast.placement = { startFrame: candidateFrame };
        workingCast.placement = { startFrame: candidateFrame };
        retimeControlSwitches(scenario, working, sourceData, ordered.slice(0, index + 1));
        retimeDodgeMarkers(scenario, working, sourceData, ordered.slice(0, index + 1));
        synchronizeLegacyInferredControlSwitches(
          scenario,
          ordered.slice(0, index + 1).map((item, order) => ({ ...item, order })),
        );
        synchronizeLegacyInferredControlSwitches(
          working,
          ordered.slice(0, index + 1).map((item, order) => ({ ...item, order })),
        );
        const beginTrial = (): LegacyRetimingTrial | undefined => {
          if (checkpointSupport === undefined) return undefined;
          const inputs = checkpointSupport.compileInputs(working);
          if (checkpointSession === undefined) {
            checkpointSession = checkpointSupport.createSession(
              working,
              Math.min(0, ...inputs.map(input => input.frame)),
            );
            compiledSessions += 1;
          }
          if (!candidateCheckpointPrepared) {
            const boundary = Math.min(
              candidateFrame,
              firstChangedInputFrame(acceptedInputs, inputs),
            );
            checkpointSession.advanceBefore(
              boundary,
              acceptedInputs.filter(input => input.frame >= checkpointSession!.inputBoundary),
            );
            candidateCheckpointPrepared = true;
          }
          const past = (schedule: readonly ScheduledCombatFrameInput[]) =>
            schedule.filter(input => input.frame < checkpointSession!.inputBoundary);
          if (!isSameInputData(past(acceptedInputs), past(inputs))) {
            throw new Error(`candidate '${current.castId}' changes inputs before its checkpoint`);
          }
          const result = checkpointSession.trial(
            inputs.filter(input => input.frame >= checkpointSession!.inputBoundary),
          );
          checkpointTrials += 1;
          let observed = false;
          return {
            advanceToFrame(endFrame, stopWhen) {
              if (observed) observationExtensions += 1;
              observed = true;
              return result.advanceToFrame(endFrame, stopWhen);
            },
            dispose() {
              result.dispose();
            },
          };
        };
        let trial = beginTrial();
        try {
          const maximumPlanningEndFrame = Math.max(
            0,
            candidateFrame + PLANNING_LOOKAHEAD_FRAMES * (MAX_PLANNING_EXTENSIONS + 1),
          );
          let planningLookaheadFrames = PLANNING_LOOKAHEAD_FRAMES;
          let planningEndFrame = Math.max(0, candidateFrame + planningLookaheadFrames);
          const hasRequiredEnds = (ends: ReadonlyMap<string, number>) =>
            ends.has(current.castId) &&
            [...previousByTrack.values()].every(previous => ends.has(previous.castId));
          for (let attempt = 0; attempt <= MAX_PLANNING_EXTENSIONS; attempt += 1) {
            working.battle.durationFrames = planningEndFrame;
            simulationRuns += 1;
            const run =
              trial === undefined
                ? runSimulation(working, planningEndFrame)
                : trial.advanceToFrame(planningEndFrame, observation => {
                    const starts = projectExecutedCastStartFrames(observation.receiptEntries);
                    const ends = projectDisplayedCastEndFrames(observation.receiptEntries, starts);
                    // 其他轨道的上一输入可能比当前输入更晚到达边界；下一项排程仍需要这些事实。
                    return (
                      hasRequiredEnds(ends) &&
                      !hasOpenUltimateTimeDilation(observation.receiptEntries)
                    );
                  });
            lastReceiptEntries = run.receiptEntries;
            if (
              resolveRuntimeReplacement !== undefined &&
              workingCast.source.kind === 'operatorSkill'
            ) {
              const actualSkillKey = mismatchedActualSkillKey(run.receiptEntries, current.castId);
              if (actualSkillKey !== null) {
                const replacement = resolveRuntimeReplacement({
                  scenario: working,
                  trackIndex: current.trackIndex,
                  skillGroupKey: workingCast.source.skillGroupKey,
                  expectedSkillKey: workingCast.source.skillKey,
                  actualSkillKey,
                });
                if (replacement !== null && replacement !== workingCast.source.skillKey) {
                  sourceSkillKey ??= workingCast.source.skillKey;
                  resolvedSkillKey = replacement;
                  workingCast.source = { ...workingCast.source, skillKey: replacement };
                  targetCast.source = { ...workingCast.source };
                  trial?.dispose();
                  trial = beginTrial();
                  continue;
                }
              }
            }
            actualStarts = new Map(projectExecutedCastStartFrames(run.receiptEntries));
            actualEnds = new Map(projectDisplayedCastEndFrames(run.receiptEntries, actualStarts));
            if (hasRequiredEnds(actualEnds) && !hasOpenUltimateTimeDilation(run.receiptEntries)) {
              ultimateIntervals = ultimateTimeDilationIntervals(
                run.receiptEntries,
                planningEndFrame,
              );
              settled = true;
              break;
            }
            if (planningEndFrame >= maximumPlanningEndFrame) break;
            planningLookaheadFrames *= 2;
            planningEndFrame = Math.min(
              maximumPlanningEndFrame,
              candidateFrame + planningLookaheadFrames,
            );
          }
          return settled;
        } finally {
          trial?.dispose();
        }
      };

      const candidates = inputWindowCandidates(initialAdjustedStartFrame, priorUltimateIntervals);
      try {
        simulateCandidate(initialAdjustedStartFrame);
      } catch (error) {
        throw new Error(
          `cast '${current.castId}' probe failed: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
      if (
        repairTiming &&
        settled &&
        castCannotInterruptCurrentSkill(lastReceiptEntries, current.castId)
      ) {
        fallbackActualStarts = actualStarts;
        fallbackActualEnds = actualEnds;
        fallbackUltimateIntervals = ultimateIntervals;

        const search = findFirstAllowedInputWindowCandidate(candidates.length, probeIndex => {
          settled = false;
          const candidateSettled = simulateCandidate(candidates[probeIndex]!.frame);
          return {
            settled: candidateSettled,
            blocked:
              candidateSettled &&
              castCannotInterruptCurrentSkill(lastReceiptEntries, current.castId),
          };
        });
        settled = search.settled;

        if (settled && search.allowedIndex !== undefined) {
          const selected = candidates[search.allowedIndex]!;
          adjustedStartFrame = selected.frame;
          inputWindowDelayFrames = selected.frame - initialAdjustedStartFrame;
          if (selected.latestUltimateTimeDilationEndFrame !== undefined) {
            ultimateTimeDilationEndFrame = selected.latestUltimateTimeDilationEndFrame;
          }
        } else if (settled) {
          adjustedStartFrame = initialAdjustedStartFrame;
          targetCast.placement = { startFrame: adjustedStartFrame };
          workingCast.placement = { startFrame: adjustedStartFrame };
          actualStarts = new Map(fallbackActualStarts);
          actualEnds = new Map(fallbackActualEnds);
          ultimateIntervals = fallbackUltimateIntervals;
          inputWindowDelayFrames = 0;
          inputWindowSearchExhausted = true;
        }
      }
      if (!settled) {
        const lifecycle = lastReceiptEntries
          .filter(entry => entry.data?.castId === current.castId)
          .map(entry => `${entry.frame}:${entry.event}`)
          .join(', ');
        throw new Error(
          `cast '${current.castId}' did not reach a stable display end (${lifecycle || 'no receipts'})`,
        );
      }
      const actualEndFrame = actualEnds.get(current.castId)!;
      if (checkpointSupport !== undefined)
        acceptedInputs = checkpointSupport.compileInputs(working);
      scenario.battle.durationFrames = Math.max(scenario.battle.durationFrames, actualEndFrame);
      if (scenario.battle.simulationRange?.endFrame !== undefined) {
        scenario.battle.simulationRange.endFrame = Math.max(
          scenario.battle.simulationRange.endFrame,
          actualEndFrame,
        );
      }

      previousByTrack.set(current.trackIndex, current);
      previousGlobal = current;
      if (adjustedStartFrame !== current.sourceStartFrame || inputWindowSearchExhausted) {
        timingAdjustments.push({
          scenarioId: scenario.id,
          castId: current.castId,
          trackIndex: current.trackIndex,
          actionIndex: current.actionIndex,
          sourceStartFrame: current.sourceStartFrame,
          adjustedStartFrame,
          ...(sameTrackEndCandidate === undefined ? {} : { sameTrackEndCandidate }),
          ...(globalOrderCandidate === undefined ? {} : { globalOrderCandidate }),
          pushedByUltimateTimeDilation: ultimateTimeDilationEndFrame !== undefined,
          ...(ultimateTimeDilationEndFrame === undefined ? {} : { ultimateTimeDilationEndFrame }),
          ...(inputWindowDelayFrames === 0 ? {} : { inputWindowDelayFrames }),
          ...(controlInputSeparationFrames === 0 ? {} : { controlInputSeparationFrames }),
          ...(inputWindowSearchExhausted ? { inputWindowSearchExhausted: true } : {}),
        });
      }
      if (sourceSkillKey !== undefined && resolvedSkillKey !== undefined) {
        skillFormAdjustments.push({
          scenarioId: scenario.id,
          castId: current.castId,
          trackIndex: current.trackIndex,
          actionIndex: current.actionIndex,
          sourceSkillKey,
          resolvedSkillKey,
        });
      }
    }
    retimeControlSwitches(scenario, working, sourceData, ordered);
    retimeDodgeMarkers(scenario, working, sourceData, ordered);
    const inferred = synchronizeLegacyInferredControlSwitches(
      scenario,
      ordered.map((item, order) => ({ ...item, order })),
    );
    records(sourceData.switchEvents).forEach((sourceSwitch, index) => {
      const sourceFrame = integer(sourceSwitch.time);
      if (sourceFrame === null) return;
      const switchId =
        typeof sourceSwitch.id === 'string' ? sourceSwitch.id : `legacy-switch-${index}`;
      const target = scenario.battle.controlSwitches.find(item => item.id === switchId);
      if (target === undefined || target.frame === sourceFrame) return;
      const previous = ordered.findLast(item => item.sourceStartFrame <= sourceFrame);
      const next = ordered.find(item => item.sourceStartFrame >= sourceFrame);
      controlSwitchAdjustments.push({
        scenarioId: scenario.id,
        switchId,
        trackIndex: target.trackIndex,
        sourceFrame,
        adjustedFrame: target.frame,
        ...(previous === undefined ? {} : { previousCastId: previous.castId }),
        ...(next === undefined ? {} : { nextCastId: next.castId }),
      });
    });
    for (const controlSwitch of inferred) {
      const cast = ordered.find(
        item => controlSwitch.id === legacyInferredControlSwitchId(item.castId),
      );
      if (cast === undefined) continue;
      inferredControlSwitches.push({
        scenarioId: scenario.id,
        switchId: controlSwitch.id,
        castId: cast.castId,
        trackIndex: controlSwitch.trackIndex,
        sourceFrame: cast.sourceStartFrame,
        inferredFrame: controlSwitch.frame,
      });
    }
    records(sourceData.tracks).forEach((sourceTrack, trackIndex) => {
      records(sourceTrack.actions).forEach((action, actionIndex) => {
        if (record(action.convertedDodge) === null) return;
        const sourceFrame = integer(action.startTime) ?? integer(action.logicalStartTime);
        if (sourceFrame === null) return;
        const markerId = `legacy:${scenario.id}:track:${trackIndex}:dodge:${actionIndex}`;
        const marker = scenario.battle.dodgeMarkers?.find(item => item.id === markerId);
        if (marker === undefined || marker.frame === sourceFrame) return;
        const { previous, next } = retimeMarkerFrame(scenario, ordered, sourceFrame);
        dodgeMarkerAdjustments.push({
          scenarioId: scenario.id,
          markerId,
          trackIndex,
          sourceFrame,
          adjustedFrame: marker.frame,
          ...(previous === undefined ? {} : { previousCastId: previous.castId }),
          ...(next === undefined ? {} : { nextCastId: next.castId }),
        });
      });
    });
  }
  return {
    timingAdjustments,
    skillFormAdjustments,
    controlSwitchAdjustments,
    inferredControlSwitches,
    dodgeMarkerAdjustments,
    simulationStats: {
      scenarioCount: retimedScenarioCount,
      castCount: retimedCastCount,
      candidateProbes,
      simulationRuns,
      ...(checkpointSupport === undefined
        ? {}
        : {
            checkpoints: { compiledSessions, trials: checkpointTrials, observationExtensions },
          }),
    },
  };
}
