import type { BuffTimelineSegment } from '../../../core/projection/buffTimelineViz';

/**
 * Buff 详情面板只消费已经投影出的展示事实，不回查运行时，也不承担游戏规则解释。
 * 时间轴状态段、敌人状态段和光标 HUD 共用这一份稳定的 UI 数据契约。
 */
export interface BuffDetailTarget {
  readonly title: string;
  readonly buffId: string;
  readonly targetId: string;
  /** 点击的聚合段所采用的代表实例，优先打开其当前生效窗口。 */
  readonly instanceId?: number;
  readonly startSequence?: number;
  readonly sourceName?: string;
  readonly startFrame: number;
  readonly endFrame: number;
  /** 点击阶段的生效状态与有效强化层数；各候选原始数量保存在 instances。 */
  readonly enabled: boolean;
  readonly enhanceCount: number;
  /** 法术异常显式显示等级，与原始强化层数分开。 */
  readonly displayCount?: number;
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
  /** 原始窗口是否参与效果计算；被压制的候选仍保留其数量供追溯。 */
  readonly enabled: boolean;
  readonly enhanceCount: number;
  /** 法术异常显式显示等级，与原始强化层数分开。 */
  readonly displayCount?: number;
  readonly layers: number;
  readonly startReason?: BuffDetailStartReason;
  readonly endReason?: BuffDetailEndReason;
  readonly stackingType?: string;
  readonly parentBuffId?: string;
  readonly icon?: string | null;
  readonly modifierSummary?: string;
}

export type BuffDetailStartReason = NonNullable<BuffTimelineSegment['startReason']>;
export type BuffDetailEndReason = NonNullable<BuffTimelineSegment['endReason']>;

/** 首次打开定位到点击的有效阶段；历史候选和同帧切段仍按原顺序保留供翻页。 */
export function initialBuffDetailInstanceIndex(target: BuffDetailTarget | null): number {
  if (target?.instances === undefined) return 0;
  const coversPhase = (instance: BuffDetailInstance): boolean =>
    instance.enabled &&
    instance.startFrame <= target.startFrame &&
    instance.endFrame >= target.endFrame &&
    (instance.endFrame > target.startFrame || instance.startFrame === target.startFrame);
  if (target.instanceId !== undefined) {
    if (target.startSequence !== undefined) {
      const exactIndex = target.instances.findIndex(
        instance =>
          instance.instanceId === target.instanceId &&
          instance.startSequence === target.startSequence &&
          coversPhase(instance),
      );
      if (exactIndex >= 0) return exactIndex;
    }
    const representativeIndex = target.instances.findIndex(
      instance => instance.instanceId === target.instanceId && coversPhase(instance),
    );
    if (representativeIndex >= 0) return representativeIndex;
  }
  return Math.max(0, target.instances.findIndex(coversPhase));
}
