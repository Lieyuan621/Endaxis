import { analyzeGraphBlackboard } from './graphBlackboard';
import { createBlackboardFieldContext, unknownBlackboardContext } from './blackboardFieldContext';

/** Outer conditions run before their sequence and are not macro/graph binding sites.
 * Initial declarations are evidence only; injected/prepared runtime keys stay external. */
export function inlineConditionBlackboardContext(kind: string, definition: unknown) {
  if (
    !['gearSet', 'weaponTrait', 'skill'].includes(kind) ||
    !definition ||
    typeof definition !== 'object'
  )
    return unknownBlackboardContext();
  const board =
    'blackboard' in definition &&
    definition.blackboard &&
    typeof definition.blackboard === 'object' &&
    !Array.isArray(definition.blackboard)
      ? (definition.blackboard as Record<string, unknown>)
      : {};
  return createBlackboardFieldContext(
    analyzeGraphBlackboard(
      { nodes: {} },
      [],
      [],
      board,
      kind === 'skill' ? 'skill initial blackboard' : 'contribution blackboard',
    ),
    new Set(['current']),
  );
}
