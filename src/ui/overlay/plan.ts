/**
 * 游戏内提示条（overlay）的数据模型。
 *
 * 从排轴工具已经编译好的时间轴里抽出一条「可直接提示玩家」的动作序列：
 * 每个图标代表一次**施放**（多段技、普攻链会被合并成一个节点，而不是一段一个图标），
 * 同时带上技力、终结技能量与连携窗口的数据点，用于 HUD 的资源显示。
 *
 * 纯函数、无 Vue 依赖，便于单测。时间统一使用仿真时钟（real 时钟），
 * 与 `compiledTimeline` 里 `realStartTime` 的口径一致。
 */

export type OverlaySkillType =
  | 'battleSkill'
  | 'comboSkill'
  | 'ultimate'
  | 'basicAttack'
  | 'dive'
  | 'finisher'
  | 'other';

export interface OverlayCast {
  id: string;
  trackId: string;
  trackIndex: number;
  operatorSlug: string;
  operatorName: string;
  /** `/operators/<slug>/avatar.webp` */
  avatar: string;
  /** `/operators/<slug>/portrait.webp` */
  portrait: string;
  /** 技能图标；普攻等没有独立图标时为空，由调用方回退到头像。 */
  skillIcon: string;
  name: string;
  type: OverlaySkillType;
  element: string;
  /** 施放开始（仿真时钟，秒）。 */
  start: number;
  /** 施放结束（仿真时钟，秒）。 */
  end: number;
  spCost: number;
  gaugeCost: number;
  /** 合并进来的动作段数（>1 表示多段技/普攻链）。 */
  segments: number;
}

export interface OverlayTrack {
  trackId: string;
  trackIndex: number;
  operatorSlug: string;
  operatorName: string;
  avatar: string;
  portrait: string;
  element: string;
}

export interface OverlayTimePoint {
  time: number;
  value: number;
}

export interface OverlayTimeWindow {
  start: number;
  end: number;
}

export interface OverlayPlan {
  casts: OverlayCast[];
  tracks: OverlayTrack[];
  /** 计划总时长（仿真时钟）。 */
  duration: number;
  /** 团队技力上限，用于把技力条归一化。 */
  maxSp: number;
  /** 团队初始技力。 */
  initialSp: number;
  /** 团队技力曲线。 */
  spPoints: OverlayTimePoint[];
  /** 每轨的终结技能量曲线。 */
  gaugePoints: Record<string, OverlayTimePoint[]>;
  /** 每轨的连携窗口。 */
  comboWindows: Record<string, OverlayTimeWindow[]>;
  /** 是否真的存在可提示的动作。 */
  hasCasts: boolean;
}

export interface OverlayRosterEntry {
  id?: string;
  name?: string;
  avatar?: string;
  element?: string;
}

export interface BuildOverlayPlanInput {
  /** `compiledTimeline.actions`（类型放宽，避免 overlay 依赖编译器内部类型）。 */
  actions?: unknown[];
  roster?: OverlayRosterEntry[];
  spSeries?: unknown[];
  /** `comboWindowLayouts`（Map<trackId, segment[]>）。 */
  comboWindows?: unknown;
  /** `gaugeSeriesByTrackId`（Map<trackId, GaugePoint[]>）。 */
  gaugeSeries?: unknown;
  /** 团队技力上限（默认 300）。 */
  maxSp?: number;
  /** 团队初始技力（默认 0）。 */
  initialSp?: number;
}

const SKILL_TYPE_MAP: Record<string, OverlaySkillType> = {
  battleSkill: 'battleSkill',
  comboSkill: 'comboSkill',
  ultimate: 'ultimate',
  basicAttack: 'basicAttack',
  dive: 'dive',
  finisher: 'finisher',
  nonSkill: 'other',
};

/** 同一个多段技的相邻段之间允许的最大间隔（秒）。超过就当作两次独立施放。 */
const SEGMENT_MERGE_GAP = 0.6;

export function toOverlaySkillType(type: unknown): OverlaySkillType {
  return SKILL_TYPE_MAP[String(type ?? '')] ?? 'other';
}

function readNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

interface NormalizedAction {
  id: string;
  trackId: string;
  trackIndex: number;
  node: Record<string, unknown>;
  type: OverlaySkillType;
  start: number;
  end: number;
  /** 显式分组键（多段技 / 普攻链）；单次技能为空。 */
  groupKey: string;
}

function normalizeAction(raw: unknown, index: number): NormalizedAction | null {
  if (!raw || typeof raw !== 'object') return null;
  const action = raw as Record<string, unknown>;
  const node = (action.node ?? {}) as Record<string, unknown>;
  const trackId = readString(action.trackId ?? node.trackId);
  if (!trackId) return null;

  const type = toOverlaySkillType(node.type ?? action.type);
  const start = readNumber(action.realStartTime ?? node.realStartTime ?? action.startTime, 0);
  const duration = readNumber(action.realDuration ?? action.duration, 0);
  const groupKey = readString(
    node.attackGroupInstanceId ?? node.parentSkillId ?? action.attackGroupInstanceId,
  );
  const id = readString(action.id ?? node.instanceId ?? node.id) || `cast-${index}`;

  return {
    id,
    trackId,
    trackIndex: Math.max(0, Math.trunc(readNumber(action.trackIndex, 0))),
    node,
    type,
    start,
    end: start + Math.max(0, duration),
    groupKey,
  };
}

function splitWindows(source: unknown): Record<string, OverlayTimeWindow[]> {
  const result: Record<string, OverlayTimeWindow[]> = {};
  if (!source) return result;
  const entries: Array<[string, unknown]> =
    source instanceof Map ? [...(source as Map<string, unknown>).entries()] : Object.entries(source as Record<string, unknown>);

  for (const [trackId, segments] of entries) {
    if (!Array.isArray(segments)) continue;
    const windows: OverlayTimeWindow[] = [];
    for (const segment of segments) {
      if (!segment || typeof segment !== 'object') continue;
      const entry = segment as Record<string, unknown>;
      const start = readNumber(entry.start, Number.NaN);
      const end = readNumber(entry.end, Number.NaN);
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
      windows.push({ start, end });
    }
    if (windows.length) {
      result[trackId] = windows.sort((left, right) => left.start - right.start);
    }
  }
  return result;
}

function splitSeries(source: unknown): Record<string, OverlayTimePoint[]> {
  const result: Record<string, OverlayTimePoint[]> = {};
  if (!source) return result;
  const entries: Array<[string, unknown]> =
    source instanceof Map ? [...(source as Map<string, unknown>).entries()] : Object.entries(source as Record<string, unknown>);

  for (const [trackId, points] of entries) {
    if (!Array.isArray(points)) continue;
    const series: OverlayTimePoint[] = [];
    for (const point of points) {
      if (!point || typeof point !== 'object') continue;
      const entry = point as Record<string, unknown>;
      const time = readNumber(entry.time, Number.NaN);
      const value = readNumber(entry.gauge ?? entry.value, Number.NaN);
      if (!Number.isFinite(time) || !Number.isFinite(value)) continue;
      series.push({ time, value });
    }
    if (series.length) {
      result[trackId] = series.sort((left, right) => left.time - right.time);
    }
  }
  return result;
}

function normalizeSpPoints(source: unknown[] | undefined): OverlayTimePoint[] {
  if (!Array.isArray(source)) return [];
  const points: OverlayTimePoint[] = [];
  for (const point of source) {
    if (!point || typeof point !== 'object') continue;
    const entry = point as Record<string, unknown>;
    const time = readNumber(entry.time, Number.NaN);
    const value = readNumber(entry.sp, Number.NaN);
    if (!Number.isFinite(time) || !Number.isFinite(value)) continue;
    points.push({ time, value });
  }
  return points.sort((left, right) => left.time - right.time);
}

/**
 * 把编译后的动作合并成「施放」节点。
 *
 * 只有带显式分组键（`parentSkillId` / `attackGroupInstanceId`）的相邻同组动作才会合并，
 * 其余动作一律各自成一个图标——否则连续两次同技能会被错误地并成一个。
 */
export function buildOverlayPlan(input: BuildOverlayPlanInput): OverlayPlan {
  const rosterById = new Map<string, OverlayRosterEntry>();
  for (const entry of input.roster ?? []) {
    const id = readString(entry?.id);
    if (id) rosterById.set(id, entry);
  }

  const normalized: NormalizedAction[] = [];
  (input.actions ?? []).forEach((raw, index) => {
    const action = normalizeAction(raw, index);
    if (action) normalized.push(action);
  });
  normalized.sort((left, right) => left.start - right.start || left.trackIndex - right.trackIndex);

  const casts: OverlayCast[] = [];
  const openByGroup = new Map<string, OverlayCast>();

  for (const action of normalized) {
    const groupIdentity = action.groupKey ? `${action.trackId}::${action.groupKey}` : '';
    const open = groupIdentity ? openByGroup.get(groupIdentity) : undefined;
    if (open && action.start <= open.end + SEGMENT_MERGE_GAP) {
      open.end = Math.max(open.end, action.end);
      open.segments += 1;
      open.spCost = Math.max(open.spCost, readNumber(action.node.spCost, 0));
      open.gaugeCost = Math.max(open.gaugeCost, readNumber(action.node.gaugeCost, 0));
      continue;
    }

    const slug = action.trackId;
    const rosterEntry = rosterById.get(slug);
    const cast: OverlayCast = {
      id: action.id,
      trackId: action.trackId,
      trackIndex: action.trackIndex,
      operatorSlug: slug,
      operatorName: readString(rosterEntry?.name) || slug,
      avatar: readString(rosterEntry?.avatar) || `/operators/${slug}/avatar.webp`,
      portrait: `/operators/${slug}/portrait.webp`,
      skillIcon: readString(action.node.icon),
      name: readString(action.node.name) || readString(action.node.type),
      type: action.type,
      element: readString(action.node.element) || readString(rosterEntry?.element) || 'physical',
      start: action.start,
      end: action.end,
      spCost: readNumber(action.node.spCost, 0),
      gaugeCost: readNumber(action.node.gaugeCost, 0),
      segments: 1,
    };
    casts.push(cast);
    if (groupIdentity) openByGroup.set(groupIdentity, cast);
  }

  casts.sort((left, right) => left.start - right.start || left.trackIndex - right.trackIndex);

  const trackMap = new Map<string, OverlayTrack>();
  for (const cast of casts) {
    if (trackMap.has(cast.trackId)) continue;
    trackMap.set(cast.trackId, {
      trackId: cast.trackId,
      trackIndex: cast.trackIndex,
      operatorSlug: cast.operatorSlug,
      operatorName: cast.operatorName,
      avatar: cast.avatar,
      portrait: cast.portrait,
      element: cast.element,
    });
  }

  const tracks = [...trackMap.values()].sort((left, right) => left.trackIndex - right.trackIndex);
  const duration = casts.reduce((max, cast) => Math.max(max, cast.end), 0);

  return {
    casts,
    tracks,
    duration,
    maxSp: Math.max(1, readNumber(input.maxSp, 300)),
    initialSp: Math.max(0, readNumber(input.initialSp, 0)),
    spPoints: normalizeSpPoints(input.spSeries),
    gaugePoints: splitSeries(input.gaugeSeries),
    comboWindows: splitWindows(input.comboWindows),
    hasCasts: casts.length > 0,
  };
}

/** HUD 只展示这三类技能（其它类型默认折叠，可在设置里打开）。 */
export const OVERLAY_PRIMARY_TYPES: OverlaySkillType[] = [
  'battleSkill',
  'comboSkill',
  'ultimate',
];

export function filterCasts(
  casts: OverlayCast[],
  options: { showBasic: boolean },
): OverlayCast[] {
  if (options.showBasic) return casts;
  return casts.filter(cast => OVERLAY_PRIMARY_TYPES.includes(cast.type));
}
