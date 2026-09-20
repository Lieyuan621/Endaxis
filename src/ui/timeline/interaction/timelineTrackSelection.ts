/**
 * 计算时间轴轨道的临时选择顺序。轨道选择不是项目数据，循环时只访问已配置干员的轨道，
 * 避免键盘切换意外打开空轨道的干员选择弹窗。
 */
import type { ScenarioDocument, TrackIndex } from '../../../core/project/schema';

export function findAdjacentOccupiedTrack(
  tracks: ScenarioDocument['tracks'],
  currentTrackIndex: TrackIndex,
  direction: -1 | 1,
): TrackIndex | null {
  for (let offset = 1; offset <= tracks.length; offset += 1) {
    const candidate = (currentTrackIndex + direction * offset + tracks.length) % tracks.length;
    if (tracks[candidate]?.operator != null) return candidate as TrackIndex;
  }
  return null;
}
