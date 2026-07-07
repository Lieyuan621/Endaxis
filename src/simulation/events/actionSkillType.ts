import type { ActionType, ResolvedAction } from '@/simulation/compiler/types';
import type { SimulationContext } from '@/simulation/engine/SimulationContext';
import { evaluateEffectCondition } from '@/simulation/events/effectDispatch';

export function resolveEffectiveActionSkillType(
  action: ResolvedAction,
  time: number,
  actorId: string,
  ctx: SimulationContext,
): ActionType {
  const explicitActionType = (action.node as any).treatAsSkillType as ActionType | undefined;
  if (explicitActionType) return explicitActionType;

  for (const hit of action.node.hits || []) {
    const treatAsSkillType = (hit as any).treatAsSkillType as ActionType | undefined;
    if (!treatAsSkillType) continue;

    const condition = (hit as any)._condition;
    if (!condition) return treatAsSkillType;

    if (
      evaluateEffectCondition(
        condition,
        time,
        actorId,
        ctx,
        ctx.state.enemy.statusSnapshot(),
        action.id,
      )
    ) {
      return treatAsSkillType;
    }
  }

  return action.node.type;
}