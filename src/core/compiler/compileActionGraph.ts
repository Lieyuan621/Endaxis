/** 每个节点只编译一次；控制出口与嵌套宿主保留程序引用，不构造序列树。 */
import type {
  ActionGraphDefinition,
  ActionGraphReference,
  ActionGraphResourceDefinition,
  ActionGraphStepForKind,
} from '../../../packages/game-data-contract/src/actionGraph';
import {
  validateActionGraph,
  validateActionGraphResource,
} from '../action-graph/actionGraphValidation';
import type { ActionValueOperand } from '../../../packages/game-data-contract/src/conditions';
import { resolveGraphData } from '../action-graph/actionGraphData';
import { compileLeafAction, isLeafCombatStep, type ResolvedLeafAction } from './compileLeafAction';
import { compileActionScopeParameters } from './compileActionValues';
import { compileNestedAction, isNestedAction, type NestedActionKind } from './compileNestedAction';
import type { AbilityEntityDefinition } from '../game-data/operatorDefinition';
import type {
  ResolvedAbilityEntityDefinition,
  ResolvedCombatStepForKind,
  CompiledGraphEntry,
} from './combatProgram';
import { createProgramDefinitionCompiler } from './compileProgramDefinitions';

export type CompiledGraphScope = Omit<
  ActionGraphStepForKind<'withActionBlackboardScope'>,
  'parameters'
> & {
  readonly parameters: ReturnType<typeof compileActionScopeParameters>;
};

export type CompiledGraphOperation =
  ResolvedLeafAction | ResolvedCombatStepForKind<NestedActionKind>;

export interface CompiledGraphMacroCall {
  readonly kind: 'callMacro';
  readonly entry: string | null;
  /** 调用点实参随编译节点照传；代入在使用点求值，不进入运行状态。 */
  readonly arguments?: Readonly<Record<string, ActionValueOperand>>;
  /** 宏图限定节点 ID → 调用方图限定原节点 ID；保留提取前的动作身份。 */
  readonly nodeBindings?: Readonly<Record<string, string>>;
  readonly key?: never;
  readonly parameters?: never;
}

export interface CompiledActionGraphNode {
  readonly action:
    | { readonly kind: 'callResource'; readonly entry: CompiledGraphEntry; readonly key?: never }
    | CompiledGraphOperation
    | CompiledGraphMacroCall
    | ActionGraphStepForKind<
        | 'conditional'
        | 'switch'
        | 'once'
        | 'repeatEachTick'
        | 'repeatByActionValue'
        | 'forEachContextTarget'
        | 'listenForCombatEvents'
      >
    | CompiledGraphScope;
  readonly next: string | null;
}

export interface CompiledActionGraph {
  readonly skillLevel: number;
  /** 由定义仓库提供的修订身份；修改程序后必须更换，不能只用技能名称。 */
  readonly revision: string;
  readonly nodes: ReadonlyMap<string, CompiledActionGraphNode>;
  /** 调用位置的操作身份目录，随编译程序共享；不进入战斗切面，不保存执行状态。 */
  readonly operationBindings: Map<string, Map<string, CompiledGraphOperation>>;
  readonly abilityEntityDefinitions: Readonly<Record<string, ResolvedAbilityEntityDefinition>>;
}

// 切面只恢复到原编译程序；身份必须与程序绑定，不能把整个定义序列化进每个调用状态。
let nextCompiledProgramIdentity = 1;

export interface ActionGraphCompilation {
  readonly program: CompiledActionGraph;
  compileEntry(entry: ActionGraphReference, callSite: string): CompiledGraphEntry;
  bindEntityDefinition(
    id: string,
    definition: AbilityEntityDefinition,
    target?: ResolvedAbilityEntityDefinition,
  ): ResolvedAbilityEntityDefinition;
  compileEntityDefinition(
    id: string,
    definition: AbilityEntityDefinition,
  ): ResolvedAbilityEntityDefinition;
  finish(): void;
  compileAll(): CompiledActionGraph;
}

/** 运行程序用限定身份连接各图；正式定义中的节点仍分别保存在各自的图中。 */
function bindResourceGraphs(resource: ActionGraphResourceDefinition) {
  validateActionGraphResource(resource);
  // null identifies the main graph; every string belongs to the macro namespace.
  // Macro names (including "main") must never overwrite main-graph nodes.
  const key = (graphId: string | null, nodeId: string) => JSON.stringify([graphId, nodeId]);
  const macroEntry = (macroId: string) => {
    const entry = resource.macros[macroId]!.entry.$sequence;
    return entry === null ? null : key(macroId, entry);
  };
  const nodes: Record<string, ActionGraphDefinition['nodes'][string]> = {};
  const add = (graphId: string | null, graph: ActionGraphDefinition) => {
    graph = resolveGraphData(graph);
    const reference = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(reference);
      if (value === null || typeof value !== 'object') return value;
      // 独立资源的入口和节点属于其自己的命名空间。
      if ('actionGraph' in value) return value;
      if (Object.hasOwn(value, '$sequence')) {
        const entry = (value as ActionGraphReference).$sequence;
        return { $sequence: entry === null ? null : key(graphId, entry) };
      }
      return Object.fromEntries(
        Object.entries(value).map(([field, item]) => [
          field,
          'kind' in value && value.kind === 'callMacro' && field === 'nodeBindings'
            ? item
            : reference(item),
        ]),
      );
    };
    for (const [id, node] of Object.entries(graph.nodes)) {
      const action = reference(node.action) as typeof node.action;
      nodes[key(graphId, id)] = {
        action:
          action.kind === 'callMacro' && action.nodeBindings !== undefined
            ? {
                ...action,
                nodeBindings: Object.fromEntries(
                  Object.entries(action.nodeBindings).map(([nodeId, identity]) => [
                    key(action.macroId, nodeId),
                    key(graphId, identity),
                  ]),
                ),
              }
            : action,
        next: node.next === null ? null : key(graphId, node.next),
      };
    }
  };
  add(null, resource.main);
  for (const [id, macro] of Object.entries(resource.macros)) add(id, macro.graph);
  return {
    graph: { nodes } as ActionGraphDefinition,
    entry: (entry: string | null) => (entry === null ? null : key(null, entry)),
    macroEntry,
    macroParameters: (macroId: string): readonly string[] =>
      resource.macros[macroId]!.parameters ?? [],
  };
}

/** 同一来源图与等级的一份编译目录；入口按需加入，共享节点只解析一次。 */
export function createActionGraphCompilation(
  definition: ActionGraphDefinition | ActionGraphResourceDefinition,
  skillLevel: number,
  revision: string = `compiled-program:${nextCompiledProgramIdentity++}`,
  abilityEntityDefinitions: Readonly<Record<string, AbilityEntityDefinition>> = {},
  importedAbilityEntityDefinitions: Readonly<Record<string, ResolvedAbilityEntityDefinition>> = {},
  childResources = new WeakMap<ActionGraphResourceDefinition, ActionGraphCompilation>(),
): ActionGraphCompilation {
  if (!revision) throw new Error('action graph requires a revision');
  if (!Number.isInteger(skillLevel) || skillLevel < 0)
    throw new Error('action graph requires a non-negative integer skill level');
  const resource = 'main' in definition ? bindResourceGraphs(definition) : undefined;
  const graph = resource?.graph ?? resolveGraphData(definition as ActionGraphDefinition);
  const dependencies = validateActionGraph(graph);
  const pending = new Set<string>();
  const nodes = new Map<string, CompiledActionGraphNode>();
  const entities: Record<string, ResolvedAbilityEntityDefinition> = {};
  const program: CompiledActionGraph = {
    skillLevel,
    revision: JSON.stringify([revision, skillLevel]),
    nodes,
    operationBindings: new Map(),
    abilityEntityDefinitions: entities,
  };
  const bindNode = (nodeId: string | null, path: string): CompiledGraphEntry => {
    if (nodeId !== null && !Object.hasOwn(graph.nodes, nodeId))
      throw new Error(`${path}: missing action graph node: ${nodeId}`);
    if (nodeId !== null && !nodes.has(nodeId)) pending.add(nodeId);
    return { graph: program, entry: nodeId, callSite: path };
  };
  const bindEntry = (entry: ActionGraphReference, path: string): CompiledGraphEntry =>
    bindNode(resource ? resource.entry(entry.$sequence) : entry.$sequence, path);
  const bindInternalEntry = (entry: ActionGraphReference, path: string): CompiledGraphEntry =>
    bindNode(entry.$sequence, path);
  const bindResource = (graph: ActionGraphResourceDefinition, _path: string) => {
    let child = childResources.get(graph);
    if (!child) {
      child = createActionGraphCompilation(
        graph,
        skillLevel,
        undefined,
        abilityEntityDefinitions,
        importedAbilityEntityDefinitions,
        childResources,
      );
      childResources.set(graph, child);
    }
    return child.compileEntry;
  };
  const definitions = createProgramDefinitionCompiler(skillLevel, bindInternalEntry, bindResource);
  const rootDefinitions = createProgramDefinitionCompiler(skillLevel, bindEntry, bindResource);
  const resolveEntity = (id: string, path: string) => {
    if (Object.hasOwn(entities, id)) return;
    const source = Object.hasOwn(abilityEntityDefinitions, id)
      ? abilityEntityDefinitions[id]
      : undefined;
    if (Object.hasOwn(importedAbilityEntityDefinitions, id)) {
      if (source) throw new Error(`${path}: duplicate imported AbilityEntity definition '${id}'`);
      // Imported templates retain entries bound to their owning compiled program.
      entities[id] = importedAbilityEntityDefinitions[id]!;
      return;
    }
    if (!source) throw new Error(`${path}: AbilityEntity definition '${id}' does not exist`);
    // 这里只绑定入口。生成实体可以再次引用同一实体模板，不是程序递归调用。
    entities[id] = definitions.entity(source, `abilityEntityDefinitions.${JSON.stringify(id)}`);
  };
  function compilePending(): void {
    while (pending.size > 0) {
      const id = pending.values().next().value!;
      pending.delete(id);
      if (nodes.has(id)) continue;
      const node = graph.nodes[id]!;
      let action: CompiledActionGraphNode['action'];
      if (
        node.action.kind === 'conditional' ||
        node.action.kind === 'switch' ||
        node.action.kind === 'once' ||
        node.action.kind === 'repeatEachTick' ||
        node.action.kind === 'repeatByActionValue' ||
        node.action.kind === 'forEachContextTarget'
      ) {
        action = node.action;
      } else if (node.action.kind === 'listenForCombatEvents') {
        action = node.action;
      } else if (node.action.kind === 'callResource') {
        const target = node.action.resource;
        action = {
          kind: 'callResource',
          entry: bindResource(target.actionGraph, target.id)(target.entry, target.id),
        };
      } else if (node.action.kind === 'callMacro') {
        if (!resource) throw new Error(`graph.${id}: macro call requires a resource definition`);
        const entry = resource.macroEntry(node.action.macroId);
        const declared = resource.macroParameters(node.action.macroId);
        const provided = node.action.arguments ? Object.keys(node.action.arguments) : [];
        const missing = declared.filter(name => !provided.includes(name));
        const extra = provided.filter(name => !declared.includes(name));
        if (missing.length > 0 || extra.length > 0)
          throw new Error(
            `graph.${id}: arguments of macro '${node.action.macroId}' do not match declared parameters` +
              ` (missing: ${missing.join(', ') || 'none'}; unexpected: ${extra.join(', ') || 'none'})`,
          );
        action = {
          kind: 'callMacro',
          entry,
          ...(node.action.arguments ? { arguments: node.action.arguments } : {}),
          ...(node.action.nodeBindings ? { nodeBindings: node.action.nodeBindings } : {}),
        };
        if (entry !== null && !nodes.has(entry)) pending.add(entry);
      } else if (node.action.kind === 'withActionBlackboardScope') {
        action = {
          ...node.action,
          parameters: compileActionScopeParameters(
            { ...node.action.parameters, scopeKey: node.action.parameters.scopeKey },
            skillLevel,
            `graph.${id}`,
          ),
        };
      } else if (isNestedAction(node.action)) {
        action = compileNestedAction(
          node.action,
          skillLevel,
          `graph.${id}`,
          bindInternalEntry,
          resolveEntity,
          bindResource,
        );
      } else if (isLeafCombatStep(node.action)) {
        const compiled = compileLeafAction(node.action, skillLevel, `graph.${id}`);
        action = compiled;
      } else {
        const unsupported: never = node.action;
        throw new Error(`graph.${id}: unknown graph action ${JSON.stringify(unsupported)}`);
      }
      nodes.set(id, { action, next: node.next });
      for (const target of dependencies.get(id)!)
        if (target !== null && !nodes.has(target)) pending.add(target);
    }
  }
  let failure: unknown;
  const flush = () => {
    if (failure !== undefined) throw failure;
    try {
      compilePending();
    } catch (error) {
      failure = error;
      throw error;
    }
  };
  const bindEntityDefinition: ActionGraphCompilation['bindEntityDefinition'] = (
    id,
    definition,
    target,
  ) => {
    if (!id) throw new Error('AbilityEntity definition ID must not be empty');
    if (!Object.hasOwn(entities, id)) {
      const compiled = rootDefinitions.entity(
        definition,
        `abilityEntityDefinitions.${JSON.stringify(id)}`,
      );
      if (target !== undefined) {
        Object.assign(target, compiled);
        entities[id] = target;
      } else {
        entities[id] = compiled;
      }
    }
    return entities[id]!;
  };
  return {
    program,
    compileEntry(entry, callSite) {
      const bound = bindEntry(entry, callSite);
      flush();
      return bound;
    },
    bindEntityDefinition,
    compileEntityDefinition(id, definition) {
      const entity = bindEntityDefinition(id, definition);
      flush();
      return entity;
    },
    finish() {
      flush();
    },
    compileAll() {
      for (const id of Object.keys(graph.nodes)) pending.add(id);
      flush();
      return program;
    },
  };
}
