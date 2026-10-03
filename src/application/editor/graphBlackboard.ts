/** 编辑器的黑板清单与调用环境分析。只说明静态可知的来源，不推测运行时的值。 */
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { globalBuffBoardEvidence, isGlobalBuffDefinitionPath } from './globalBuffFieldContext';
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
  /** Declaration node, for editor navigation only. */
  nodeId?: string;
}
export interface BlackboardVariable {
  key: string;
  scope: string;
  layer: 'direct' | 'entity' | 'parameter';
  reads: string[];
  requiredReads: string[];
  writes: string[];
  initial?: unknown;
  /** Numeric entity assignments have a known type but no statically known initial value. */
  assignedType?: 'number';
  readSites?: { id: string; owner: 'action' | 'data' }[];
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
            nodeId: id,
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
  const fieldContexts = new Map<string, Set<string>>();
  const globalBuffScopes = new Set<string>();
  const globalOverrides = new Map<string, readonly string[]>();
  for (const [id, environments] of contexts) {
    const action = graph.nodes[id]!.action;
    if (action.kind !== 'createGlobalBuff') continue;
    const evidence = globalBuffBoardEvidence(
      action.parameters.definition,
      action.parameters.blackboardAssignments,
    );
    if (!evidence) continue;
    const local = new Set<string>();
    for (const parent of environments) {
      const scope = JSON.stringify(['globalBuff', parent, id]);
      scopes.set(scope, {
        id: scope,
        label: `GlobalBuff · ${id}`,
        nodeId: id,
        initial: evidence.initial,
        entityInitial: {},
        copiesParent: false,
        sharesEntity: false,
      });
      globalBuffScopes.add(scope);
      globalOverrides.set(scope, evidence.overrideKeys);
      local.add(scope);
    }
    fieldContexts.set(id, local);
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
    for (const [key, value] of Object.entries(scope.entityInitial)) {
      const item = variable(scope.id, key, 'entity');
      if (value && typeof value === 'object' && 'kind' in value) item.assignedType = 'number';
      else item.initial = value;
    }
  }
  for (const [scope, keys] of globalOverrides)
    for (const key of keys) variable(scope, key, 'direct').assignedType = 'number';
  for (const key of parameters) variable('current', key, 'parameter');
  function visitData(id: string, scope: string) {
    const seen = dataContexts.get(id) ?? new Set<string>();
    if (seen.has(scope)) return;
    seen.add(scope);
    dataContexts.set(id, seen);
    const node = graph.dataNodes?.[id];
    if (!node) return;
    const e = node.expression;
    if (node.type === 'string' && typeof e === 'object' && 'blackboardKey' in e) {
      const item = variable(
        scope,
        e.blackboardKey,
        !globalBuffScopes.has(scope) && e.blackboardKey.startsWith('EntityBB_')
          ? 'entity'
          : 'direct',
      );
      item.reads.push(id);
      item.requiredReads.push(id);
      (item.readSites ??= []).push({ id, owner: 'data' });
    }
    if (
      typeof e === 'object' &&
      'kind' in e &&
      (e.kind === 'blackboard' || e.kind === 'parameter')
    ) {
      const item = variable(
        e.kind === 'parameter' ? 'current' : scope,
        e.kind === 'parameter' ? e.parameter : e.key,
        e.kind === 'parameter'
          ? 'parameter'
          : !globalBuffScopes.has(scope) && e.key.startsWith('EntityBB_')
            ? 'entity'
            : 'direct',
      );
      item.reads.push(id);
      (item.readSites ??= []).push({ id, owner: 'data' });
      if (e.kind === 'blackboard' && e.fallback === undefined) item.requiredReads.push(id);
    }
    for (const input of dataNodeInputs(node))
      if (input.source !== null) visitData(input.source, scope);
  }
  for (const [id, environments] of contexts) {
    const action = graph.nodes[id]!.action;
    for (const scope of environments) {
      const localScope =
        action.kind === 'createGlobalBuff' ? JSON.stringify(['globalBuff', scope, id]) : scope;
      function read(key: string, required = true, sourceScope = scope) {
        const item = variable(
          sourceScope,
          key,
          !globalBuffScopes.has(sourceScope) && key.startsWith('EntityBB_') ? 'entity' : 'direct',
        );
        if (!item.reads.includes(id)) item.reads.push(id);
        (item.readSites ??= []).push({ id, owner: 'action' });
        if (required && !item.requiredReads.includes(id)) item.requiredReads.push(id);
      }
      function visitInline(value: unknown, path: readonly string[] = []) {
        const sourceScope = isGlobalBuffDefinitionPath(action.kind, path) ? localScope : scope;
        if (!value || typeof value !== 'object' || 'actionGraph' in value || '$sequence' in value)
          return;
        if ('blackboardKey' in value && typeof value.blackboardKey === 'string') {
          read(value.blackboardKey, true, sourceScope);
          return;
        }
        if (
          'kind' in value &&
          value.kind === 'blackboard' &&
          'key' in value &&
          typeof value.key === 'string'
        ) {
          read(value.key, !('fallback' in value), sourceScope);
          return;
        }
        for (const [key, child] of Object.entries(value)) visitInline(child, [...path, key]);
      }
      visitInline(action);
      if (action.kind === 'applyBuff')
        for (const key of Object.values(action.parameters.copiedBlackboardAssignments ?? {}))
          read(key);
      for (const input of listDataInputs(action))
        if (input.source !== null)
          visitData(
            input.source,
            isGlobalBuffDefinitionPath(action.kind, input.path) ? localScope : scope,
          );
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
        case 'readBuffBlackboard':
        case 'readAbilityEntityRemainingDuration':
        case 'readEventBuffBlackboard':
        case 'readCurrentBuffRemainingDuration':
        case 'readBuffRemainingDuration':
          write(action.parameters.outputKey);
          break;
        case 'storeEventSpGainAmount':
          write(action.parameters.outputKey);
          write(action.parameters.realDeltaOutputKey);
          break;
        case 'storeSourceAttributeValue':
        case 'storeEntityPropertyValue':
          write(action.parameters.targetKey);
          break;
        case 'readSkillSettingData':
          for (const item of action.parameters.items) write(item.storeKey);
          break;
        case 'storeEventHealValues':
          write(action.parameters.finalHealOutputKey);
          write(action.parameters.realHealOutputKey);
          break;
      }
    }
  }
  return {
    scopes,
    contexts,
    dataContexts,
    fieldContexts,
    globalBuffScopes,
    variables: [...variables.values()],
  };
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
    if (!declarations.length) continue;
    let scope = analysis.scopes.get(variable.scope);
    let accessible = false;
    while (scope) {
      if (
        Object.hasOwn(scope.initial, variable.key) ||
        Object.hasOwn(scope.entityInitial, variable.key) ||
        analysis.variables.some(
          v =>
            v.scope === scope!.id &&
            v.key === variable.key &&
            (v.writes.length || v.assignedType !== undefined),
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

/** A consumer path, not merely its owning action, determines its read board. */
export function graphFieldContexts(
  analysis: ReturnType<typeof analyzeGraphBlackboard>,
  graph: ActionGraphDefinition,
  owner: 'action' | 'data',
  id: string,
  path: readonly (string | number)[],
): ReadonlySet<string> | undefined {
  if (owner === 'data') return analysis.dataContexts.get(id);
  return isGlobalBuffDefinitionPath(graph.nodes[id]?.action.kind, path)
    ? analysis.fieldContexts.get(id)
    : analysis.contexts.get(id);
}
