import { createGraphDataResolver } from '../../core/action-graph/actionGraphData';
import type {
  ActionGraphDefinition,
  ActionGraphNode,
  ActionGraphReference,
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import { validateActionGraphOwner } from '../../core/action-graph/actionGraphValidation';
import { validateActionGraphStepDefinition } from '../../core/game-data/validation/actionPrograms';
import { listGraphPorts } from './actionGraphPorts';

export type ActionGraphAddress =
  { readonly kind: 'main' } | { readonly kind: 'macro'; readonly macroId: string };
export type ActionGraphResourceOwner = {
  readonly actionGraph: ActionGraphResourceDefinition;
  readonly blackboard?: Readonly<Record<string, unknown>>;
};

export function resourceGraph(
  owner: ActionGraphResourceOwner,
  address: ActionGraphAddress,
): ActionGraphDefinition {
  if (address.kind === 'main') return owner.actionGraph.main;
  const macro = Object.hasOwn(owner.actionGraph.macros, address.macroId)
    ? owner.actionGraph.macros[address.macroId]
    : undefined;
  if (!macro) throw new Error(`resource has no macro '${address.macroId}'`);
  return macro.graph;
}

export function updateResourceGraph<T extends ActionGraphResourceOwner>(
  owner: T,
  address: ActionGraphAddress,
  update: (graph: ActionGraphDefinition) => ActionGraphDefinition,
): T {
  const previous = resourceGraph(owner, address);
  const next = update(previous);
  if (next === previous) return owner;
  const resource = owner.actionGraph;
  const changed = {
    ...owner,
    actionGraph:
      address.kind === 'main'
        ? { ...resource, main: next }
        : {
            ...resource,
            macros: {
              ...resource.macros,
              [address.macroId]: { ...resource.macros[address.macroId]!, graph: next },
            },
          },
  } as T;
  validateActionGraphOwner(changed, 'resource');
  return changed;
}

function node(graph: ActionGraphDefinition, id: string): ActionGraphNode {
  const value = graph.nodes[id];
  if (!value) throw new Error(`missing action graph node: ${id}`);
  return value;
}

export function replaceGraphField(
  value: unknown,
  path: readonly (string | number)[],
  replacement: unknown,
): unknown {
  if (!path.length) return replacement;
  const [key, ...rest] = path;
  const record = (value === undefined ? {} : value) as Record<string | number, unknown>;
  const child = replaceGraphField(record[key!], rest, replacement);
  if (Array.isArray(value)) {
    const result = [...value];
    result[Number(key)] = child;
    return result;
  }
  return { ...record, [key!]: child };
}

function requireUnboundMacroStructure(
  owner: ActionGraphResourceOwner,
  address: ActionGraphAddress,
): void {
  if (address.kind !== 'macro') return;
  const graphs = [
    owner.actionGraph.main,
    ...Object.values(owner.actionGraph.macros).map(macro => macro.graph),
  ];
  for (const graph of graphs)
    for (const entry of Object.values(graph.nodes))
      if (
        entry.action.kind === 'callMacro' &&
        entry.action.macroId === address.macroId &&
        entry.action.nodeBindings !== undefined
      )
        throw new Error(
          `macro '${address.macroId}' has nodeBindings; changing its nodes requires an identity mapping`,
        );
}

export function connectResourceNode<T extends ActionGraphResourceOwner>(
  owner: T,
  address: ActionGraphAddress,
  nodeId: string,
  path: readonly string[],
  targetId: string | null,
): T {
  const graph = resourceGraph(owner, address);
  const source = node(graph, nodeId);
  const port = listGraphPorts(source).find(
    item =>
      item.path.length === path.length && item.path.every((part, index) => part === path[index]),
  );
  if (!port) throw new Error(`node '${nodeId}' has no control port '${path.join('.')}'`);
  if (targetId !== null) node(graph, targetId);
  if (port.target === targetId) return owner;
  const changed = replaceGraphField(source, path, targetId) as ActionGraphNode;
  return updateResourceGraph(owner, address, previous => ({
    ...previous,
    nodes: { ...previous.nodes, [nodeId]: changed },
  }));
}

export function replaceResourceNodeAction<T extends ActionGraphResourceOwner>(
  owner: T,
  address: ActionGraphAddress,
  nodeId: string,
  action: unknown,
): T {
  const graph = resourceGraph(owner, address);
  const source = node(graph, nodeId);
  if (source.action === action) return owner;
  const issues = validateActionGraphStepDefinition(
    createGraphDataResolver(graph).bind(action),
    'action',
  );
  if (issues.length)
    throw new Error(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
  return updateResourceGraph(owner, address, previous => ({
    ...previous,
    nodes: { ...previous.nodes, [nodeId]: { ...source, action: action as ActionGraphStep } },
  }));
}

export function addResourceNode<T extends ActionGraphResourceOwner>(
  owner: T,
  address: ActionGraphAddress,
  nodeId: string,
  action: unknown,
): T {
  const graph = resourceGraph(owner, address);
  if (!nodeId) throw new Error('action graph node identity must not be empty');
  if (Object.hasOwn(graph.nodes, nodeId))
    throw new Error(`action graph node already exists: ${nodeId}`);
  requireUnboundMacroStructure(owner, address);
  const issues = validateActionGraphStepDefinition(action, 'action');
  if (issues.length)
    throw new Error(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
  return updateResourceGraph(owner, address, previous => ({
    ...previous,
    nodes: { ...previous.nodes, [nodeId]: { action: action as ActionGraphStep, next: null } },
  }));
}

function disconnect(value: unknown, nodeId: string): unknown {
  if (!value || typeof value !== 'object' || Object.hasOwn(value, 'actionGraph')) return value;
  if (Object.hasOwn(value, '$sequence')) {
    const reference = value as ActionGraphReference;
    return reference.$sequence === nodeId ? { $sequence: null } : value;
  }
  let result: unknown = value;
  for (const [key, child] of Object.entries(value as object)) {
    if (key === 'nodeBindings') continue;
    const changed = disconnect(child, nodeId);
    if (changed !== child) result = replaceGraphField(result, [key], changed);
  }
  return result;
}

export function removeResourceNode<T extends ActionGraphResourceOwner>(
  owner: T,
  address: ActionGraphAddress,
  nodeId: string,
): T {
  const graph = resourceGraph(owner, address);
  node(graph, nodeId);
  requireUnboundMacroStructure(owner, address);
  const nodes = Object.fromEntries(
    Object.entries(graph.nodes)
      .filter(([id]) => id !== nodeId)
      .map(([id, source]) => {
        let changed = source;
        for (const port of listGraphPorts(source))
          if (port.target === nodeId)
            changed = replaceGraphField(changed, port.path, null) as ActionGraphNode;
        return [id, changed];
      }),
  );
  let withEntries: T = owner;
  if (address.kind === 'main') {
    for (const [key, value] of Object.entries(owner)) {
      if (key === 'actionGraph') continue;
      const changed = disconnect(value, nodeId);
      if (changed !== value) withEntries = { ...withEntries, [key]: changed };
    }
  } else {
    const macro = owner.actionGraph.macros[address.macroId]!;
    if (macro.entry.$sequence === nodeId)
      withEntries = {
        ...owner,
        actionGraph: {
          ...owner.actionGraph,
          macros: {
            ...owner.actionGraph.macros,
            [address.macroId]: { ...macro, entry: { $sequence: null } },
          },
        },
      };
  }
  return updateResourceGraph(withEntries, address, () => ({ ...graph, nodes }));
}

export interface ResourceGraphEntry {
  readonly id: string;
  readonly label: string;
  readonly path: readonly (string | number)[];
  readonly targetId: string | null;
}

/** 主图入口来自当前完整资源的引用，不从整个干员或装备中搜寻。 */
export function listResourceGraphEntries(
  owner: ActionGraphResourceOwner,
  address: ActionGraphAddress,
): readonly ResourceGraphEntry[] {
  if (address.kind === 'macro') {
    const macro = Object.hasOwn(owner.actionGraph.macros, address.macroId)
      ? owner.actionGraph.macros[address.macroId]
      : undefined;
    if (!macro) return [];
    return [
      {
        id: 'macro',
        label: address.macroId,
        path: ['actionGraph', 'macros', address.macroId, 'entry'],
        targetId: macro.entry.$sequence,
      },
    ];
  }
  const result: ResourceGraphEntry[] = [];
  const visit = (value: unknown, path: readonly (string | number)[]): void => {
    if (!value || typeof value !== 'object' || Object.hasOwn(value, 'actionGraph')) return;
    if (Object.hasOwn(value, '$sequence')) {
      const reference = value as ActionGraphReference;
      result.push({
        id: JSON.stringify(path),
        label: path.join(' · '),
        path,
        targetId: reference.$sequence,
      });
      return;
    }
    for (const [key, child] of Object.entries(value))
      visit(child, [...path, Array.isArray(value) ? Number(key) : key]);
  };
  for (const [key, value] of Object.entries(owner)) if (key !== 'actionGraph') visit(value, [key]);
  return result;
}

export function connectResourceEntry<T extends ActionGraphResourceOwner>(
  owner: T,
  address: ActionGraphAddress,
  entryId: string,
  targetId: string | null,
): T {
  const entry = listResourceGraphEntries(owner, address).find(item => item.id === entryId);
  if (!entry) throw new Error(`missing graph entry '${entryId}'`);
  if (targetId !== null) node(resourceGraph(owner, address), targetId);
  if (entry.targetId === targetId) return owner;
  const changed = replaceGraphField(owner, [...entry.path, '$sequence'], targetId) as T;
  validateActionGraphOwner(changed, 'resource');
  return changed;
}
