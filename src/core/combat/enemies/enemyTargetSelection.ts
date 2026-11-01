export interface EnemyTargetSelection {
  readonly order: readonly string[];
  readonly switches: readonly { readonly frame: number; readonly targetId: string }[];
}

/** 手动目标不可命中时从首轨查找可用敌人；全部离场则没有主攻击目标。 */
export function selectMainEnemyTarget(
  selection: EnemyTargetSelection,
  frame: number,
  present: (id: string) => boolean,
): string | undefined {
  let preferred = selection.order[0];
  let latest = -Infinity;
  for (const marker of selection.switches) {
    if (marker.frame <= frame && marker.frame >= latest) {
      preferred = marker.targetId;
      latest = marker.frame;
    }
  }
  if (preferred !== undefined && selection.order.includes(preferred) && present(preferred))
    return preferred;
  return selection.order.find(present);
}
