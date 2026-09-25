import type { CombatStepParameters } from '../../../../../packages/game-data-contract/src/actions.ts';
import { projectNativeDamageElement } from '../../source/damageElement.ts';
import type { ElementalInflictionActionSource } from '../../source/elementalInflictionActions.ts';
import type { CombatActionProjectionContextSource } from '../combatProjectionCommon.ts';

/** 法术异常的 Source 与 Owner 是独立身份，不因宿主类型改变目标。 */
export function projectElementalInflictionAction(
  action: ElementalInflictionActionSource,
  path: string,
  context: CombatActionProjectionContextSource,
): {
  readonly kind: 'applyElementalInfliction';
  readonly parameters: CombatStepParameters['applyElementalInfliction'];
} {
  const sourceIsCaster =
    (action.source.targetSource === 'Source' && context.actionSourceTarget === 'caster') ||
    (action.source.targetSource === 'Owner' && context.actionOwnerTarget === 'caster');
  const targetsFixedEnemy =
    (action.target.targetSource === 'Target' && context.actionTargetTarget === 'enemy') ||
    (action.target.targetSource === 'Context' &&
      context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true);
  const targetsBuffOwner =
    action.target.targetSource === 'Owner' &&
    action.target.targetGroupKey === '' &&
    context.actionOwnerTarget === 'buffOwner';
  if (
    !sourceIsCaster ||
    action.source.targetGroupKey !== '' ||
    (!targetsFixedEnemy && !targetsBuffOwner)
  )
    throw new Error(`${path}: unsupported elemental infliction source/target`);
  const element = projectNativeDamageElement(action.element, `${path}.element`);
  if (element === 'physical') throw new Error(`${path}: physical is not an infliction element`);
  return {
    kind: 'applyElementalInfliction',
    parameters: {
      element,
      isExtra: action.isExtra,
      ...(action.inverseReaction ? { inverseReaction: true } : {}),
      ...(targetsBuffOwner ? { target: 'buffOwner' as const } : {}),
    },
  };
}
