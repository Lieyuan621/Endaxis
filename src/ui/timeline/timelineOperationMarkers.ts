import { frameToTimelinePx } from './timelineGeometry';

export type TimelineOperationMarkerKind = 'skill' | 'combo' | 'ultimate' | 'switch';
export type OperationKeycapMode = 'keyboard' | 'gamepad';

export interface TimelineOperationMarkerInput {
  readonly id: string;
  readonly kind: TimelineOperationMarkerKind;
  readonly trackIndex: number;
  readonly frame: number;
  readonly durationFrames?: number;
  readonly perfect?: boolean;
}

export interface TimelineOperationMarkerLayout {
  readonly id: string;
  readonly kind: TimelineOperationMarkerKind;
  readonly label: string;
  readonly left: number;
  /** 旧版 Hold 按键帽由文字自然撑开，不把技能持续时间画成提示条。 */
  readonly width: number | null;
  readonly top: number;
  readonly height: number;
  readonly fontSize: number;
  readonly hold: boolean;
  readonly perfect: boolean;
}

interface MutableMarker extends Omit<TimelineOperationMarkerLayout, 'top' | 'height' | 'fontSize'> {
  right: number;
  rowIndex: number;
  top: number;
  height: number;
  fontSize: number;
}

export function timelineOperationKeycapLabel(
  kind: TimelineOperationMarkerKind,
  trackIndex: number,
  mode: OperationKeycapMode,
  compact = false,
): string {
  if (mode === 'gamepad') {
    // 游戏手柄说明图：技能轮盘为 LB + X/Y/B/A，切人为 LB + 左/上/右/下。
    const skillButtons = ['X', 'Y', 'B', 'A'];
    const switchDirections = ['←', '↑', '→', '↓'];
    if (kind === 'skill') return `LB+${skillButtons[trackIndex]}`;
    if (kind === 'combo') return 'RB';
    if (kind === 'ultimate') return `LB+${skillButtons[trackIndex]}${compact ? 'H' : ' (Hold)'}`;
    return `LB+${switchDirections[trackIndex]}`;
  }
  const key = trackIndex + 1;
  if (kind === 'skill') return String(key);
  if (kind === 'combo') return 'E';
  if (kind === 'ultimate') return compact ? `${key}H` : `${key} (Hold)`;
  return `F${key}`;
}

/** 复刻旧版按键帽的重叠分层；输入只使用 Next 的现实帧投影，不读写场景。 */
export function projectTimelineOperationMarkers(
  inputs: readonly TimelineOperationMarkerInput[],
  prepFrames: number,
  pxPerFrame: number,
  prepExpanded = true,
  prepEndFrame = 0,
  keycapMode: OperationKeycapMode = 'keyboard',
): readonly TimelineOperationMarkerLayout[] {
  const markers: MutableMarker[] = inputs
    .map(input => {
      const left = frameToTimelinePx(
        input.frame,
        prepFrames,
        pxPerFrame,
        prepExpanded,
        prepEndFrame,
      );
      const hold = input.kind === 'ultimate';
      const width = hold
        ? null
        : keycapMode === 'gamepad'
          ? input.kind === 'combo'
            ? 24
            : 40
          : input.kind === 'switch'
            ? 28
            : 20;
      // 旧版只用技能持续区间做按键提示的分层避让；按键帽本身仍是自适应文字宽度。
      const projectedDurationWidth =
        frameToTimelinePx(
          input.frame + (input.durationFrames ?? 0),
          prepFrames,
          pxPerFrame,
          prepExpanded,
          prepEndFrame,
        ) - left;
      const collisionWidth = hold
        ? Math.max(keycapMode === 'gamepad' ? 78 : 42, projectedDurationWidth)
        : input.kind === 'switch'
          ? (width ?? 28)
          : Math.max(24, width ?? 20);
      return {
        id: input.id,
        kind: input.kind,
        label: timelineOperationKeycapLabel(input.kind, input.trackIndex, keycapMode),
        left,
        width,
        right: left + collisionWidth,
        rowIndex: 0,
        top: 0,
        height: 14,
        fontSize: 9,
        hold,
        perfect: input.kind === 'combo' && input.perfect === true,
      };
    })
    // 同时操作按输入顺序（轨道/动作顺序）排层，不能让生成 ID 改变可见顺序。
    .sort((left, right) => left.left - right.left);

  const result: MutableMarker[] = [];
  let cluster: MutableMarker[] = [];
  let clusterRight = -1;
  const flush = () => {
    if (cluster.length === 0) return;
    const rowRights: number[] = [];
    for (const marker of cluster) {
      const reusableRow = rowRights.findIndex(right => right + 1 <= marker.left);
      marker.rowIndex = reusableRow < 0 ? rowRights.length : reusableRow;
      rowRights[marker.rowIndex] = marker.right;
    }
    const depth = rowRights.length;
    const height = depth <= 2 ? 14 : depth === 3 ? 12 : 10;
    const step = depth <= 2 ? 16 : depth === 3 ? 13 : 10;
    const fontSize = depth <= 3 ? 9 : 8;
    for (const marker of cluster) {
      marker.top = marker.rowIndex * step;
      marker.height = height;
      marker.fontSize = fontSize;
      result.push(marker);
    }
    cluster = [];
  };

  for (const marker of markers) {
    if (cluster.length === 0 || marker.left < clusterRight) {
      cluster.push(marker);
      clusterRight = Math.max(clusterRight, marker.right);
    } else {
      flush();
      cluster = [marker];
      clusterRight = marker.right;
    }
  }
  flush();
  return result.map(({ right: _right, rowIndex: _rowIndex, ...marker }) => marker);
}
