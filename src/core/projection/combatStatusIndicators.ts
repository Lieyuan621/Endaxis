/**
 * 把已发生的 Buff 显示生命周期投影为 HUD 状态指示器。
 * 本层只保留原生显示去向，不决定页面布局，也不反向影响模拟。
 */
import type { BuffTimelineSegment } from './buffTimelineViz';

export const COMBAT_STATUS_DISPLAY_SLOTS = [
  'headBarCommon',
  'headBarAttached',
  'squadIcon',
  'mainCharacterHpBarCommon',
  'mainCharacterHpProgress',
  'normalSkillProgress',
  'ultimateSkillProgress',
] as const;

export type CombatStatusDisplaySlot = (typeof COMBAT_STATUS_DISPLAY_SLOTS)[number];

export type CombatStatusIconStyle = 'Attached' | 'LifeTime' | 'NoLifeTime' | 'SpellAbnormal';

export interface CombatStatusIndicator {
  readonly sourceId?: string;
  readonly sourceActionId?: string;
  readonly targetId: string;
  readonly buffId: string;
  readonly instanceId: number;
  readonly layers: number;
  readonly startFrame: number;
  readonly endFrame: number;
  readonly startReason?: BuffTimelineSegment['startReason'];
  readonly endReason?: BuffTimelineSegment['endReason'];
  readonly stackingType?: string;
  readonly parentBuffId?: string;
  readonly durationEndFrame?: number;
  readonly slots: readonly CombatStatusDisplaySlot[];
  readonly onlyForControlledOperator: boolean;
  readonly hasFiniteLifetime?: boolean;
  readonly simpleModifierAttribute?: string;
  readonly simpleModifierSlot?: string;
  readonly simpleModifierValue?: number;
  readonly iconId?: string;
  readonly iconPath?: string;
  readonly iconStyle?: string;
  readonly abnormalColorType?: string;
  readonly showWarningBackground: boolean;
  readonly useWeakNormalSkillProgress: boolean;
  readonly order?: {
    readonly useDirectoryValue: boolean;
    readonly value: number;
    readonly category: string;
  };
}

function displaySlots(segment: BuffTimelineSegment): CombatStatusDisplaySlot[] {
  const slots: CombatStatusDisplaySlot[] = [];
  if (segment.showInHeadBarCommon === true) slots.push('headBarCommon');
  if (segment.showInHeadBarAttached === true) slots.push('headBarAttached');
  if (segment.showInSquadIcon === true) {
    if (segment.onlyShowForMainCharacter !== true) slots.push('squadIcon');
    slots.push('mainCharacterHpBarCommon');
  }
  if (segment.showProgressInHpBar === true) slots.push('mainCharacterHpProgress');
  if (segment.showProgressInNormalSkillButton === true) slots.push('normalSkillProgress');
  if (segment.showProgressInUltimateSkillButton === true) slots.push('ultimateSkillProgress');
  return slots;
}

/**
 * 复刻 UIBuffNode._GetIconStyle：头顶附着固定 Attached，头顶普通只保留
 * SpellAbnormal 特例，否则显示时长；队伍/主控栏使用配置，Default 再按生命周期回退。
 */
export function combatStatusIconStyle(
  indicator: CombatStatusIndicator,
  slot: CombatStatusDisplaySlot,
): CombatStatusIconStyle {
  if (slot === 'headBarAttached') return 'Attached';
  if (slot === 'headBarCommon') {
    return indicator.iconStyle === 'SpellAbnormal' ? 'SpellAbnormal' : 'LifeTime';
  }
  if (
    indicator.iconStyle === 'Attached' ||
    indicator.iconStyle === 'LifeTime' ||
    indicator.iconStyle === 'NoLifeTime' ||
    indicator.iconStyle === 'SpellAbnormal'
  ) {
    return indicator.iconStyle;
  }
  return indicator.hasFiniteLifetime === true ? 'LifeTime' : 'NoLifeTime';
}

/**
 * Buff 生命周期段按 `[startFrame, endFrame)` 取样。当前模拟终点上尚未结束的段
 * 与正好在该帧结束的段暂无 outcome 位可区分；状态栏因此不在模拟右边界外推测存活。
 */
export function projectCombatStatusIndicators(
  segments: readonly BuffTimelineSegment[],
  frame: number,
): readonly CombatStatusIndicator[] {
  if (!Number.isFinite(frame)) throw new RangeError('status indicator frame must be finite');
  return segments
    .flatMap(segment => {
      if (segment.startFrame > frame || frame >= segment.endFrame) return [];
      const slots = displaySlots(segment);
      if (slots.length === 0) return [];
      const hasOrder =
        segment.orderUseDirectoryValue !== undefined &&
        segment.orderPriorityValue !== undefined &&
        segment.orderPriorityCategory !== undefined;
      return [
        {
          ...(segment.sourceId === undefined ? {} : { sourceId: segment.sourceId }),
          ...(segment.sourceActionId === undefined
            ? {}
            : { sourceActionId: segment.sourceActionId }),
          targetId: segment.targetId,
          buffId: segment.buffId,
          instanceId: segment.instanceId,
          layers: segment.layers,
          startFrame: segment.startFrame,
          endFrame: segment.endFrame,
          ...(segment.startReason === undefined ? {} : { startReason: segment.startReason }),
          ...(segment.endReason === undefined ? {} : { endReason: segment.endReason }),
          ...(segment.stackingType === undefined ? {} : { stackingType: segment.stackingType }),
          ...(segment.parentBuffId === undefined ? {} : { parentBuffId: segment.parentBuffId }),
          ...(segment.durationEndFrame === undefined
            ? {}
            : { durationEndFrame: segment.durationEndFrame }),
          slots,
          onlyForControlledOperator: segment.onlyShowForMainCharacter === true,
          ...(segment.hasFiniteLifetime === undefined
            ? {}
            : { hasFiniteLifetime: segment.hasFiniteLifetime }),
          ...(segment.simpleModifierAttribute === undefined
            ? {}
            : { simpleModifierAttribute: segment.simpleModifierAttribute }),
          ...(segment.simpleModifierSlot === undefined
            ? {}
            : { simpleModifierSlot: segment.simpleModifierSlot }),
          ...(segment.simpleModifierValue === undefined
            ? {}
            : { simpleModifierValue: segment.simpleModifierValue }),
          ...(segment.iconId === undefined ? {} : { iconId: segment.iconId }),
          ...(segment.iconPath === undefined ? {} : { iconPath: segment.iconPath }),
          ...(segment.iconStyleInSquad === undefined
            ? {}
            : { iconStyle: segment.iconStyleInSquad }),
          ...(segment.abnormalColorType === undefined
            ? {}
            : { abnormalColorType: segment.abnormalColorType }),
          showWarningBackground: segment.showWarningBackground === true,
          useWeakNormalSkillProgress: segment.useWeakProgressInNormalSkillButton === true,
          ...(hasOrder
            ? {
                order: {
                  useDirectoryValue: segment.orderUseDirectoryValue!,
                  value: segment.orderPriorityValue!,
                  category: segment.orderPriorityCategory!,
                },
              }
            : {}),
        },
      ];
    })
    .sort((left, right) => {
      const priority = (right.order?.value ?? 0) - (left.order?.value ?? 0);
      return priority !== 0 ? priority : left.instanceId - right.instanceId;
    });
}
