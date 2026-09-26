/** 编辑器的黑板清单与调用环境分析。只说明静态可知的来源，不推测运行时的值。 */
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { listGraphPorts } from './actionGraphEditing';
import { dataNodeInputs, listDataInputs } from '../../core/action-graph/actionGraphDataNodes';

export interface BlackboardScope {
  id: string;
  label: string;
  initial: Readonly<Record<string, unknown>>;
  entityInitial: Readonly<Record<string, unknown>>;
  parent?: string;
  copiesParent: boolean;
  sharesEntity?: boolean;
}
export interface BlackboardVariable {
  key: string;
  scope: string;
  layer: 'direct' | 'entity' | 'parameter';
  reads: string[];
  requiredReads: string[];
  writes: string[];
  initial?: unknown;
}
export function analyzeGraphBlackboard(
  graph: ActionGraphDefinition,
  roots: readonly string[],
  parameters: readonly string[] = [],
  initial: Readonly<Record<string, unknown>> = {},
  rootLabel = 'root',
) {
  const scopes = new Map<string, BlackboardScope>([
    [
      'current',
      {
        id: 'current',
        label: rootLabel,
        initial,
        entityInitial: {},
        copiesParent: false,
      },
    ],
  ]);
  const contexts = new Map<string, Set<string>>();
  const dataContexts = new Map<string, Set<string>>();
  const pending = roots.map(id => ({ id, scope: 'current' }));
  while (pending.length) {
    const { id, scope } = pending.pop()!;
    const node = graph.nodes[id];
    if (!node) continue;
    const seen = contexts.get(id) ?? new Set<string>();
    if (seen.has(scope)) continue;
    seen.add(scope);
    contexts.set(id, seen);
    for (const port of listGraphPorts(node)) {
      if (port.target === null) continue;
      let child = scope;
      if (
        node.action.kind === 'withActionBlackboardScope' &&
        port.path[0] === 'action' &&
        port.path[1] === 'body'
      ) {
        const p = node.action.parameters;
        if (!p.shareParentBlackboard) {
          child = `${scope}/${id}`;
          scopes.set(child, {
            id: child,
            parent: scope,
            label: p.scopeKey ?? id,
            initial: p.initialValues,
            entityInitial: { ...p.entityInitialValues, ...p.entityAssignments },
            copiesParent: p.inheritParent,
            sharesEntity: p.entityInitialValues === undefined && p.entityAssignments === undefined,
          });
        }
      }
      pending.push({ id: port.target, scope: child });
    }
  }
  const variables = new Map<string, BlackboardVariable>();
  function variable(scope: string, key: string, layer: BlackboardVariable['layer']) {
    const id = JSON.stringify([scope, layer, key]);
    let item = variables.get(id);
    if (!item) {
      item = { key, scope, layer, reads: [], requiredReads: [], writes: [] };
      variables.set(id, item);
    }
    return item;
  }
  for (const scope of scopes.values()) {
    for (const [key, value] of Object.entries(scope.initial))
      variable(scope.id, key, 'direct').initial = value;
    for (const [key, value] of Object.entries(scope.entityInitial))
      variable(scope.id, key, 'entity').initial = value;
  }
  for (const key of parameters) variable('current', key, 'parameter');
  function visitData(id: string, scope: string) {
    const seen = dataContexts.get(id) ?? new Set<string>();
    if (seen.has(scope)) return;
    seen.add(scope);
    dataContexts.set(id, seen);
    const node = graph.dataNodes?.[id];
    if (!node) return;
    const e = node.expression;
    if (e.kind === 'blackboard' || e.kind === 'parameter') {
      const item = variable(
        scope,
        e.kind === 'parameter' ? e.parameter : e.key,
        e.kind === 'parameter' ? 'parameter' : 'direct',
      );
      item.reads.push(id);
      if (e.kind === 'blackboard' && e.fallback === undefined) item.requiredReads.push(id);
    }
    for (const input of dataNodeInputs(node))
      if (input.source !== null) visitData(input.source, scope);
  }
  for (const [id, environments] of contexts) {
    const action = graph.nodes[id]!.action;
    for (const scope of environments) {
      for (const input of listDataInputs(action))
        if (input.source !== null) visitData(input.source, scope);
      if (action.kind === 'modifyActionValue' || action.kind === 'calculateActionValue') {
        const key = action.parameters.key;
        variable(scope, key, key.startsWith('EntityBB_') ? 'entity' : 'direct').writes.push(id);
      }
      const write = (key: string | undefined) => {
        if (key)
          variable(scope, key, key.startsWith('EntityBB_') ? 'entity' : 'direct').writes.push(id);
      };
      switch (action.kind) {
        case 'storeCurrentTimelineFrame':
        case 'storeShieldValue':
        case 'readBuffStackCount':
        case 'readEventBuffBlackboard':
        case 'readCurrentBuffRemainingDuration':
        case 'readBuffRemainingDuration':
          write(action.parameters.outputKey);
          break;
        case 'storeEventSpGainAmount':
          write(action.parameters.outputKey);
          write(action.parameters.realDeltaOutputKey);
          break;
        case 'storeEventHealValues':
          write(action.parameters.finalHealOutputKey);
          write(action.parameters.realHealOutputKey);
          break;
      }
    }
  }
  return { scopes, contexts, dataContexts, variables: [...variables.values()] };
}

/** 提示只在别的局部板发现的键。外部调用仍可能提供它，不能据此拒绝合法定义。 */
export function blackboardScopeWarnings(
  analysis: ReturnType<typeof analyzeGraphBlackboard>,
): string[] {
  const result: string[] = [];
  for (const variable of analysis.variables) {
    if (!variable.requiredReads.length || variable.layer === 'parameter') continue;
    const declarations = [...analysis.scopes.values()].filter(s =>
      Object.hasOwn(s.initial, variable.key),
    );
    if (!declarations.length || declarations.some(s => s.id === 'current')) continue;
    let scope = analysis.scopes.get(variable.scope);
    let accessible = false;
    while (scope) {
      if (
        Object.hasOwn(scope.initial, variable.key) ||
        Object.hasOwn(scope.entityInitial, variable.key) ||
        analysis.variables.some(
          v => v.scope === scope!.id && v.key === variable.key && v.writes.length,
        )
      ) {
        accessible = true;
        break;
      }
      scope = scope.copiesParent && scope.parent ? analysis.scopes.get(scope.parent) : undefined;
    }
    let entityScope = analysis.scopes.get(variable.scope);
    while (!accessible && entityScope) {
      if (Object.hasOwn(entityScope.entityInitial, variable.key)) accessible = true;
      entityScope =
        entityScope.sharesEntity && entityScope.parent
          ? analysis.scopes.get(entityScope.parent)
          : undefined;
    }
    if (!accessible)
      result.push(
        `变量 ${variable.key} 只在作用域 ${declarations.map(s => s.label).join('、')} 中设置了初值；作用域 ${analysis.scopes.get(variable.scope)?.label} 无法读取它，需要单独提供该变量。`,
      );
  }
  return result;
}
