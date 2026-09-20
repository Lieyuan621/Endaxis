/**
 * Buff 详情面板只消费已经投影出的展示事实，不回查运行时，也不承担游戏规则解释。
 * 时间轴状态段、敌人状态段和光标 HUD 共用这一份稳定的 UI 数据契约。
 */
export interface BuffDetailTarget {
  readonly title: string;
  readonly buffId: string;
  readonly targetId: string;
  readonly sourceName?: string;
  readonly startFrame: number;
  readonly endFrame: number;
  readonly layers: number;
  readonly startReason?: BuffDetailStartReason;
  readonly endReason?: BuffDetailEndReason;
  readonly stackingType?: string;
  readonly parentBuffId?: string;
  readonly icon?: string | null;
  readonly modifierSummary?: string;
  readonly instances?: readonly BuffDetailInstance[];
}

export interface BuffDetailInstance {
  /** 物理异常与破防共用一个显示入口时，每项仍保留各自名称与定义身份。 */
  readonly buffId?: string;
  readonly title?: string;
  /** 合并展示后仍保留真实实例，追溯时不能按 Buff 定义名称寻找。 */
  readonly instanceId?: number;
  readonly startSequence?: number;
  readonly sourceName?: string;
  readonly startFrame: number;
  readonly endFrame: number;
  readonly layers: number;
  readonly startReason?: BuffDetailStartReason;
  readonly endReason?: BuffDetailEndReason;
  readonly stackingType?: string;
  readonly parentBuffId?: string;
  readonly icon?: string | null;
  readonly modifierSummary?: string;
}

export type BuffDetailStartReason = 'applied' | 'reapplied' | 'presentationStarted';

export type BuffDetailEndReason =
  | 'reapplied'
  | 'lifetime'
  | 'ignite'
  | 'early'
  | 'dispelled'
  | 'absorbed'
  | 'other'
  | 'released'
  | 'simulationEnd';
