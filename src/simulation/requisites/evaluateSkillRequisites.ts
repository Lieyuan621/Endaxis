import type { EffectCondition, SkillRequisite } from '@/data/types';
import type { ResolvedAction } from '@/simulation/compiler/types';
import type { SimulationContext } from '@/simulation/engine/SimulationContext';
import { evaluateEffectCondition } from '@/simulation/events/effectDispatch';

export interface SkillRequisiteFailure {
  requisiteId: string;
  messageKey?: string;
  params?: Record<string, unknown>;
}

function assertPureCondition(condition: EffectCondition | EffectCondition[], requisiteId: string) {
  if (Array.isArray(condition)) {
    condition.forEach(item => assertPureCondition(item, requisiteId));
    return;
  }

  if (condition.kind === 'or') {
    condition.conditions.forEach(item => assertPureCondition(item, requisiteId));
    return;
  }

  if (condition.kind === 'not') {
    assertPureCondition(condition.condition, requisiteId);
    return;
  }

  if (
    (condition.kind === 'enemyStatus' || condition.kind === 'operatorStatus') &&
    condition.consume !== undefined
  ) {
    throw new Error(`Skill requisite "${requisiteId}" must not consume condition state.`);
  }
}

/**
 * Evaluates release-time prerequisites against live simulation state.
 *
 * The check is diagnostic-only: unmet requisites are logged for the editor, but
 * the simulator keeps executing the action so existing projects remain readable.
 */
export function evaluateSkillRequisites(
  action: ResolvedAction,
  ctx: SimulationContext,
): SkillRequisiteFailure[] {
  const requisites = action.node.requisites as SkillRequisite[] | undefined;
  if (!Array.isArray(requisites) || requisites.length === 0) return [];

  const failures: SkillRequisiteFailure[] = [];
  for (const requisite of requisites) {
    assertPureCondition(requisite.condition, requisite.id);
    if (
      evaluateEffectCondition(
        requisite.condition,
        action.realStartTime,
        action.trackId,
        ctx,
        undefined,
        action.id,
      )
    ) {
      continue;
    }
    failures.push({
      requisiteId: requisite.id,
      messageKey: requisite.messageKey,
      params: requisite.params,
    });
  }

  return failures;
}
