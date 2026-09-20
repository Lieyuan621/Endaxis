import type { GlobalCooldownTarget } from '../../../../../packages/game-data-contract/src/primitives.ts';
import type { CombatActionProjectionContextSource } from '../combatProjectionCommon.ts';

/** CheckGlobalCDTimerAction 和 AddGlobalCDTimer 必须解析同一个首目标，不能按动作/条件分别猜 Owner。 */
export function projectGlobalCooldownTarget(
  target: { readonly targetSource: string; readonly targetGroupKey: string },
  context: CombatActionProjectionContextSource,
  sourcePath: string,
): GlobalCooldownTarget {
  const projected =
    target.targetSource === 'Owner'
      ? context.actionOwnerTarget
      : target.targetSource === 'Source'
        ? context.actionSourceTarget
        : null;
  const fixed =
    projected === 'buffOwner'
      ? context.fixedBuffOwnerTarget
      : projected === 'buffSource'
        ? context.fixedBuffSourceTarget
        : undefined;
  if (
    target.targetGroupKey !== '' ||
    (fixed !== undefined && fixed !== 'caster') ||
    (projected !== 'caster' && projected !== 'buffOwner' && projected !== 'buffSource')
  ) {
    throw new Error(`${sourcePath}: unsupported global cooldown character target`);
  }
  return projected;
}
