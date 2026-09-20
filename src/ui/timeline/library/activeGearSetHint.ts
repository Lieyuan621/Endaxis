import type { TrackLoadoutInstanceViewModel } from './loadoutBuildViewModel';

const ACTIVE_GEAR_SET_PIECES = 3;

/**
 * 按正式场景编译器相同的三件套门槛，投影轨道头可显示的套装名称。
 * 只接受已经由当前项目数据仓库解析出的名称；未知套装不伪装成已生效。
 */
export function projectActiveGearSetLabels(
  loadout: TrackLoadoutInstanceViewModel,
  gearSetNames: Readonly<Record<string, string>>,
): readonly string[] {
  const counts = new Map<string, number>();
  for (const gear of Object.values(loadout.gears)) {
    const slug = gear?.definition.gearSetSlug;
    if (slug === undefined) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return [...counts.entries()].flatMap(([slug, count]) => {
    const name = gearSetNames[slug];
    return count >= ACTIVE_GEAR_SET_PIECES && name !== undefined ? [name] : [];
  });
}
