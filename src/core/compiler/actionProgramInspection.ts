import type {
  CompiledGraphEntry,
  ResolvedActionSequence,
  ResolvedCombatStep,
} from './combatProgram';

/** 只枚举当前入口的顺序节点；控制出口仍是图引用，不展开子程序。 */
export function rootActionSteps(sequence: ResolvedActionSequence): readonly ResolvedCombatStep[] {
  const result: ResolvedCombatStep[] = [];
  const bind = (entry: string | null, port: string): CompiledGraphEntry => ({
    graph: sequence.graph,
    entry,
    callSite: `${sequence.callSite}/${port}`,
  });
  for (let id = sequence.entry; id !== null; id = sequence.graph.nodes.get(id)!.next) {
    const action = sequence.graph.nodes.get(id)!.action;
    if (action.kind === 'callResource') {
      result.push(...rootActionSteps(action.entry));
    } else if (action.kind === 'callMacro') {
      result.push(...rootActionSteps(bind(action.entry, `${id}:macro`)));
    } else if (action.kind === 'conditional') {
      const { whenFalse, ...fields } = action;
      result.push({
        ...fields,
        whenTrue: bind(action.whenTrue.$sequence, `${id}:true`),
        ...(whenFalse === undefined ? {} : { whenFalse: bind(whenFalse.$sequence, `${id}:false`) }),
      });
    } else if (action.kind === 'switch') {
      result.push({
        ...action,
        options: action.options.map((option, index) => ({
          ...option,
          sequence: bind(option.sequence.$sequence, `${id}:${index}`),
        })),
      });
    } else if (action.kind === 'listenForCombatEvents') {
      result.push({
        ...action,
        parameters: {
          responses: action.parameters.responses.map((response, index) => ({
            ...response,
            sequence: bind(response.sequence.$sequence, `${id}:${index}`),
          })),
        },
      });
    } else if (action.kind === 'once') {
      result.push({
        ...action,
        parameters: {
          ...action.parameters,
          scopeKey: action.parameters.scopeKey ?? `${sequence.callSite}/${id}`,
        },
        body: bind(action.body.$sequence, `${id}:body`),
      });
    } else if (action.kind === 'withActionBlackboardScope') {
      result.push({
        ...action,
        parameters: {
          ...action.parameters,
          scopeKey: action.parameters.scopeKey ?? `${sequence.callSite}/${id}`,
        },
        body: bind(action.body.$sequence, `${id}:body`),
      });
    } else if (
      action.kind === 'repeatEachTick' ||
      action.kind === 'repeatByActionValue' ||
      action.kind === 'forEachContextTarget'
    ) {
      result.push({ ...action, body: bind(action.body.$sequence, `${id}:body`) });
    } else result.push(action);
  }
  return result;
}

export function isEmptyActionProgram(sequence: ResolvedActionSequence): boolean {
  return sequence.entry === null;
}
