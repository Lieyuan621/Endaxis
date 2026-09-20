import type { ScenarioDocument } from '../../core/project/schema';
import {
  getSkillCastPlacementChains,
  getDodgeMarkerHistory,
  resolveScenarioInitialFrame,
} from '../../core/project/skillCastPlacement';

/**
 * 复制已确认的历史前缀，不持有来源方案引用或运行时切面。
 * 连续成员的帧必须由调用方从这个 source 的有效模拟结果取得，不能使用展示宽度推算。
 */
export function createInheritedScenario(
  source: ScenarioDocument,
  options: {
    id: string;
    name: string;
    frame: number;
    resolveSkillFrame: (source: ScenarioDocument, castId: string) => number | undefined;
  },
): ScenarioDocument {
  const { frame } = options;
  // 与正式编译器的初始化范围一致：可见准备区不是已经发生的战斗历史。
  const initialFrame = resolveScenarioInitialFrame(source);
  if (frame < initialFrame) throw new RangeError('inheritance precedes the source simulation');
  if (!options.id || options.id === source.id)
    throw new Error('inherited scenario requires a new id');
  if (
    !Number.isSafeInteger(frame) ||
    frame < -source.battle.prepFrames ||
    frame > source.battle.durationFrames
  )
    throw new RangeError('inheritance frame is outside the source timeline');
  if (source.inheritance !== undefined && frame < source.inheritance.frame)
    throw new RangeError('inheritance cannot precede the existing input boundary');
  const result = structuredClone(source);
  result.id = options.id;
  result.name = options.name;
  result.inheritance = { frame, sourceScenarioId: source.id };
  for (const track of result.tracks) {
    if (track === null) continue;
    // 锚点尚未输入的整组必然属于未来，不要求它的后续成员已有执行回执。
    const futureIds = new Set(
      getSkillCastPlacementChains(track.skillCasts)
        .filter(chain => chain.anchor.placement.startFrame! >= frame)
        .flatMap(chain => chain.casts.map(cast => cast.id)),
    );
    track.skillCasts = track.skillCasts.filter(cast => {
      if (futureIds.has(cast.id)) return false;
      const actual = cast.placement.startFrame ?? options.resolveSkillFrame(source, cast.id);
      if (actual === undefined || !Number.isSafeInteger(actual))
        throw new Error(`unresolved inheritance input '${cast.id}'`);
      return actual < frame;
    });
    const ids = new Set(track.skillCasts.map(cast => cast.id));
    for (const cast of track.skillCasts) {
      if (cast.placement.afterCastId !== undefined && !ids.has(cast.placement.afterCastId))
        throw new Error(`inheritance input '${cast.id}' has no historical predecessor`);
    }
    track.consumableUses = track.consumableUses?.filter(use => use.frame < frame);
  }
  result.battle.controlSwitches = result.battle.controlSwitches.filter(
    marker => marker.frame < frame,
  );
  result.battle.externalEventMarkers = result.battle.externalEventMarkers?.filter(
    marker => marker.frame < frame,
  );
  if (result.battle.dodgeMarkers !== undefined)
    result.battle.dodgeMarkers = getDodgeMarkerHistory(result.battle.dodgeMarkers, frame);
  result.battle.cycleBoundaries = result.battle.cycleBoundaries.filter(
    marker => marker.frame < frame,
  );
  result.battle.simulationRange = {
    startFrame: frame,
    endFrame:
      source.battle.simulationRange?.endFrame !== undefined &&
      source.battle.simulationRange.endFrame >= frame
        ? source.battle.simulationRange.endFrame
        : source.battle.durationFrames,
  };
  const ids = new Set(result.tracks.flatMap(track => track?.skillCasts.map(cast => cast.id) ?? []));
  result.connections = result.connections.filter(
    connection => ids.has(connection.from.skillCastId) && ids.has(connection.to.skillCastId),
  );
  return result;
}
