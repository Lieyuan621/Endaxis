import type { CombatStepParameters } from '../intermediateDefinitions.ts';
import type { BuffIgniteActionSource } from '../../source/buffActions.ts';
import type { CombatActionProjectionContextSource } from '../combatProjectionCommon.ts';
import { projectActionTargetQuery } from '../conditions/combatConditionProjection.ts';

/** 来源和目标保留原生查询，不把 Context 目标列表折成单个敌人。 */
export function projectBuffIgniteAction(
  action: BuffIgniteActionSource,
  path: string,
  context: CombatActionProjectionContextSource,
): { readonly kind: 'igniteBuffs'; readonly parameters: CombatStepParameters['igniteBuffs'] } {
  return {
    kind: 'igniteBuffs',
    parameters: {
      target: projectActionTargetQuery(action.target, context, `${path}.target`),
      source: projectActionTargetQuery(action.source, context, `${path}.source`),
      igniteType: action.igniteType,
      ...(action.successTargetContextKey === ''
        ? {}
        : { successTargetContextKey: action.successTargetContextKey }),
    },
  };
}
