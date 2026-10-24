/**
 * 游戏内提示条（overlay）的数据模型。
 *
 * 每个图标对应当前项目中的一次技能输入，导出时使用正式模拟回执校正时间与费用。
 * 时间统一为实际战斗帧换算后的秒数，准备期保留负数。
 */

export type OverlaySkillType =
  | 'battleSkill'
  | 'comboSkill'
  | 'ultimate'
  | 'basicAttack'
  | 'dive'
  | 'finisher'
  | 'switch'
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
  /** 与时间轴一致的操作短名；旧快照缺省时显示技能类型。 */
  actionLabel?: string;
  heavyAttack?: boolean;
  statusEffects?: { result: string; from?: string }[];
  type: OverlaySkillType;
  element: string;
  /** 施放开始（仿真时钟，秒）。 */
  start: number;
  /** 施放结束（仿真时钟，秒）。 */
  end: number;
  /** 模拟确认的技力费用；无法确认时为 null。 */
  spCost: number | null;
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
  /** 模拟敌方可见 Buff 的生效区间，时间单位为秒。 */
  frameRate?: number;
  enemyBuffs?: {
    id: string;
    buffId: string;
    name: string;
    icon?: string;
    startFrame: number;
    endFrame: number;
    startSequence?: number;
    endReason?: string;
    maxStackCount?: number;
    displayCount?: number;
    layers: number;
  }[];
  tracks: OverlayTrack[];
  /** 最早提示时间（秒）；准备期保留负数。 */
  startTime: number;
  /** 计划结束时间（仿真时钟）。 */
  duration: number;
  /** 团队技力上限，用于把技力条归一化。 */
  maxSp: number;
  /** 团队初始技力。 */
  initialSp: number;
  /** 团队技力曲线。 */
  spPoints: OverlayTimePoint[];
  /** 每轨的终结技能量曲线。 */
  gaugePoints: Record<string, OverlayTimePoint[]>;
  /** 每轨真实终结技能量上限。 */
  gaugeMaxValues: Record<string, number>;
  /** 每轨的连携窗口。 */
  comboWindows: Record<string, OverlayTimeWindow[]>;
  /** 是否真的存在可提示的动作。 */
  hasCasts: boolean;
}

/** HUD 只展示这三类技能（其它类型默认折叠，可在设置里打开）。 */
export const OVERLAY_PRIMARY_TYPES: OverlaySkillType[] = [
  'battleSkill',
  'comboSkill',
  'ultimate',
  'switch',
];

export function filterCasts(
  casts: OverlayCast[],
  options: { showBasic: boolean; showHeavy: boolean },
): OverlayCast[] {
  return casts.filter(cast => {
    if (cast.type === 'basicAttack' && cast.heavyAttack) return options.showHeavy;
    return options.showBasic || OVERLAY_PRIMARY_TYPES.includes(cast.type);
  });
}

/** 没有导出方案时的视图初始值。 */
export function emptyOverlayPlan(): OverlayPlan {
  return {
    casts: [],
    tracks: [],
    startTime: 0,
    duration: 0,
    maxSp: 300,
    initialSp: 0,
    spPoints: [],
    gaugePoints: {},
    gaugeMaxValues: {},
    comboWindows: {},
    hasCasts: false,
  };
}
