/**
 * 解释用户手动建立的技能顺序链。链保留每项释放身份，不等同于游戏定义中的技能组。
 * 这里只解析引用与显示起点；实际接续边界由模拟提供，任何估计或模拟帧都不写回存档。
 */
import type { DodgeMarkerDocument, ScenarioDocument, SkillCastDocument } from './schema';

/** 截取已经发生的闪避事实；保留 Dash，但不把尚未发生的成功声明带入历史。 */
export function getDodgeMarkerHistory(
  markers: readonly DodgeMarkerDocument[],
  boundary: number,
): DodgeMarkerDocument[] {
  return markers
    .filter(marker => marker.frame < boundary)
    .map(marker =>
      resolveDodgeMarkerLastInputFrame(marker) >= boundary
        ? { ...marker, mode: { kind: 'dodge' } }
        : { ...marker, mode: { ...marker.mode } },
    );
}

/** 闪避标签所代表的最后一个输入帧；普通闪避只有 Dash，极限闪避还包含成功事实。 */
export function resolveDodgeMarkerLastInputFrame(marker: DodgeMarkerDocument): number {
  const frame =
    marker.mode.kind === 'perfectDodge'
      ? marker.frame + marker.mode.successDelayFrames
      : marker.frame;
  if (!Number.isSafeInteger(frame)) {
    throw new RangeError(`dodge marker '${marker.id}' last input frame must be a safe integer`);
  }
  return frame;
}

/** 作者输入确定的初始化帧；准备区的显示长度不会凭空增加战斗历史。 */
export function resolveScenarioInitialFrame(scenario: ScenarioDocument): number {
  return Math.min(
    0,
    ...scenario.tracks.flatMap(track =>
      track === null
        ? []
        : [
            ...getSkillCastPlacementChains(track.skillCasts)
              .filter(chain => chain.casts.some(cast => !cast.presentation?.disabled))
              .map(chain => chain.anchor.placement.startFrame!),
            ...(track.consumableUses ?? []).map(use => use.frame),
          ],
    ),
    ...scenario.battle.controlSwitches.map(marker => marker.frame),
    ...(scenario.battle.dodgeMarkers ?? []).map(marker => marker.frame),
  );
}

export interface SkillCastPlacementChain<
  Cast extends Pick<SkillCastDocument, 'id' | 'placement'> = SkillCastDocument,
> {
  readonly anchor: Cast;
  readonly casts: readonly Cast[];
}

/** 包含独立项；链之间按原数组首次出现成员的顺序，链内按前驱关系排列。 */
export function getSkillCastPlacementChains<
  Cast extends Pick<SkillCastDocument, 'id' | 'placement'>,
>(casts: readonly Cast[]): readonly SkillCastPlacementChain<Cast>[] {
  const byId = new Map<string, Cast>();
  const successor = new Map<string, Cast>();
  for (const cast of casts) {
    if (byId.has(cast.id)) throw new Error(`duplicate skill cast '${cast.id}'`);
    byId.set(cast.id, cast);
  }
  for (const cast of casts) {
    const previous = cast.placement.afterCastId;
    if (previous === undefined) {
      if (!Number.isInteger(cast.placement.startFrame))
        throw new Error(`skill cast '${cast.id}' must have an integer start frame`);
      continue;
    }
    if (cast.placement.startFrame !== undefined)
      throw new Error(`skill cast '${cast.id}' cannot have both start frame and predecessor`);
    if (!byId.has(previous))
      throw new Error(`skill cast '${cast.id}' has no predecessor '${previous}' on its track`);
    if (successor.has(previous))
      throw new Error(`skill cast '${previous}' has more than one successor`);
    successor.set(previous, cast);
  }
  const chainByCast = new Map<string, SkillCastPlacementChain<Cast>>();
  for (const anchor of casts) {
    if (anchor.placement.afterCastId !== undefined) continue;
    const members: Cast[] = [];
    let current: Cast | undefined = anchor;
    while (current !== undefined) {
      members.push(current);
      current = successor.get(current.id);
    }
    const chain = { anchor, casts: members };
    members.forEach(cast => chainByCast.set(cast.id, chain));
  }
  if (chainByCast.size !== casts.length) throw new Error('skill cast placement contains a cycle');
  return [...new Set(casts.map(cast => chainByCast.get(cast.id)!))];
}

export function getSkillCastPlacementAnchor(
  casts: readonly SkillCastDocument[],
  castId: string,
): SkillCastDocument {
  const chain = getSkillCastPlacementChains(casts).find(chain =>
    chain.casts.some(cast => cast.id === castId),
  );
  if (chain === undefined) throw new Error(`missing skill cast '${castId}'`);
  return chain.anchor;
}

/** 实际起点优先；尚无实际结果时按前项宽度估计，禁用项不占时间，零宽启用项至少占一帧。 */
export function resolveSkillCastStartFrames(
  casts: readonly SkillCastDocument[],
  durationFrames: (cast: SkillCastDocument) => number,
  actualStartFrames?: ReadonlyMap<string, number>,
): Map<string, number> {
  const starts = new Map<string, number>();
  for (const chain of getSkillCastPlacementChains(casts)) {
    let next = chain.anchor.placement.startFrame!;
    for (const cast of chain.casts) {
      const start = actualStartFrames?.get(cast.id) ?? next;
      if (!Number.isFinite(start)) throw new Error(`skill cast '${cast.id}' has no finite start`);
      starts.set(cast.id, start);
      const duration = cast.presentation?.disabled ? 0 : Math.max(1, durationFrames(cast));
      if (!Number.isFinite(duration))
        throw new Error(`skill cast '${cast.id}' has no finite display duration`);
      next = start + duration;
    }
  }
  return starts;
}
