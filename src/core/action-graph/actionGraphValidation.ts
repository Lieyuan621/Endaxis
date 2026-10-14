import type {
  ActionGraphDefinition,
  ActionGraphReference,
  ActionGraphResourceDefinition,
} from '../../../packages/game-data-contract/src/actionGraph.ts';
import {
  validateGraphDataReferences,
  graphDataExpression,
  isGraphDataReference,
} from './actionGraphData.ts';

/**
 * 图结构校验由生成器、编辑器和编译器共用。只读取引用，不展开程序。
 * 显式循环的 body 是子入口，重复次数属于运行状态；执行引用本身仍必须无环。
 */
export function validateActionGraph(
  graph: ActionGraphDefinition,
  entries: readonly ActionGraphReference[] = [],
): ReadonlyMap<string, readonly (string | null)[]> {
  validateGraphDataReferences(graph);
  const edges = new Map<string, readonly (string | null)[]>();
  // 调用方向与画布箭头不同：行为调用后续行为，数值消费者调用数值提供者。
  // 两类节点必须放在同一张依赖图中检查，否则转接头形成的跨类型环会漏检。
  const dependencies = new Map<string, string[]>();
  function reference(value: unknown, path: string): string | null {
    if (value !== null && (typeof value !== 'string' || !value))
      throw new Error(`${path}: invalid action graph reference`);
    if (value !== null && !Object.hasOwn(graph.nodes, value))
      throw new Error(`${path}: missing action graph node: ${value}`);
    return value;
  }
  function collect(value: unknown, path: string, targets: string[]): void {
    if (!value || typeof value !== 'object') return;
    if ('actionGraph' in value) {
      validateActionGraphOwner(value as { actionGraph: ActionGraphResourceDefinition }, path);
      return;
    }
    if (isGraphDataReference(value)) {
      targets.push(`data:${value.nodeId}`);
      return;
    }
    if (Object.hasOwn(value, '$sequence')) {
      const record = value as Record<string, unknown>;
      if (Object.keys(record).length !== 1)
        throw new Error(`${path}: action graph reference contains unexpected fields`);
      const target = reference(record.$sequence, path);
      if (target !== null) targets.push(`action:${target}`);
      return;
    }
    for (const [key, item] of Object.entries(value)) collect(item, `${path}.${key}`, targets);
  }
  for (const [id, node] of Object.entries(graph.dataNodes ?? {})) {
    const targets: string[] = [];
    collect(node.expression, `data.${id}`, targets);
    dependencies.set(`data:${id}`, targets);
  }
  for (const [id, node] of Object.entries(graph.nodes)) {
    if (!id) throw new Error('action graph node identity must not be empty');
    if (node.action.kind === 'applyBuff' && 'definition' in node.action.parameters)
      throw new Error(`graph.${id}: applyBuff must reference an owner Buff definition`);
    const next = reference(node.next, `graph.${id}.next`);
    const calls = next === null ? [] : [`action:${next}`];
    // 宏身份绑定不是引用；实参仍然可能依赖本图的数据节点。
    collect(
      node.action.kind === 'callMacro' ? node.action.arguments : node.action,
      `graph.${id}.action`,
      calls,
    );
    edges.set(id, [next]);
    dependencies.set(`action:${id}`, [...new Set(calls)]);
  }
  entries.forEach((entry, index) => reference(entry.$sequence, `entries[${index}]`));
  const complete = new Set<string>();
  const visiting = new Set<string>();
  for (const root of dependencies.keys()) {
    const pending: { id: string | null; exit?: boolean }[] = [{ id: root }];
    while (pending.length) {
      const { id, exit } = pending.pop()!;
      if (id === null || complete.has(id)) continue;
      if (exit) {
        visiting.delete(id);
        complete.add(id);
      } else {
        if (visiting.has(id))
          throw new Error(`recursive action graph: ${id.slice(id.indexOf(':') + 1)}`);
        visiting.add(id);
        pending.push({ id, exit: true });
        for (const target of dependencies.get(id)!) pending.push({ id: target });
      }
    }
  }
  // 编译器按行为入口编译；经数值求值间接调用的行为也属于该入口的依赖。
  for (const [id, targets] of edges) {
    const actions = new Set(targets);
    const seen = new Set<string>();
    const pending = [...dependencies.get(`action:${id}`)!];
    while (pending.length) {
      const target = pending.pop()!;
      if (target.startsWith('action:')) {
        actions.add(target.slice('action:'.length));
      } else if (!seen.has(target)) {
        seen.add(target);
        pending.push(...dependencies.get(target)!);
      }
    }
    edges.set(id, [...actions]);
  }
  return edges;
}

/** 深遍历收集 parameter 操作数位置与形参名；不沿 $sequence 展开，结构内不会出现循环。 */
function collectParameterOperands(
  value: unknown,
  path: string,
  out: { path: string; parameter: string }[],
): void {
  if (!value || typeof value !== 'object') return;
  if ('actionGraph' in value) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectParameterOperands(item, `${path}[${index}]`, out));
    return;
  }
  const record = value as Record<string, unknown>;
  if (record.kind === 'parameter') {
    out.push({ path, parameter: typeof record.parameter === 'string' ? record.parameter : '' });
    return;
  }
  for (const [key, item] of Object.entries(record))
    if (record.kind !== 'callMacro' || key !== 'nodeBindings')
      collectParameterOperands(item, `${path}.${key}`, out);
}

/** 分别校验主图和每张宏图；跨图只允许通过宏调用，宏调用不能递归。 */
export function validateActionGraphResource(resource: ActionGraphResourceDefinition): void {
  validateActionGraph(resource.main);
  const dependencies = new Map<string, Set<string>>();
  const inspect = (graph: ActionGraphDefinition, owner: string): Set<string> => {
    const calls = new Set<string>();
    for (const [id, node] of Object.entries(graph.nodes)) {
      if (node.action.kind !== 'callMacro') continue;
      const target = node.action.macroId;
      if (!Object.hasOwn(resource.macros, target))
        throw new Error(`${owner}.${id}: missing action graph macro: ${target}`);
      calls.add(target);
      const bindings = node.action.nodeBindings;
      if (bindings !== undefined) {
        if (bindings === null || typeof bindings !== 'object' || Array.isArray(bindings))
          throw new Error(`${owner}.${id}.nodeBindings: expected a node identity map`);
        const targetNodes = resource.macros[target]!.graph.nodes;
        for (const nodeId of Object.keys(targetNodes))
          if (!Object.hasOwn(bindings, nodeId))
            throw new Error(`${owner}.${id}.nodeBindings: missing macro node '${nodeId}'`);
        const identities = new Set<string>();
        for (const [nodeId, identity] of Object.entries(bindings)) {
          if (!Object.hasOwn(targetNodes, nodeId))
            throw new Error(`${owner}.${id}.nodeBindings: unknown macro node '${nodeId}'`);
          if (typeof identity !== 'string' || identity.length === 0)
            throw new Error(`${owner}.${id}.nodeBindings.${nodeId}: expected a non-empty identity`);
          if (identities.has(identity))
            throw new Error(`${owner}.${id}.nodeBindings: duplicate identity '${identity}'`);
          identities.add(identity);
        }
      }
      // 实参键集合必须与目标宏声明完全一致；参数不允许嵌套透传。
      const declared = resource.macros[target]!.parameters ?? [];
      const provided = node.action.arguments ?? {};
      for (const name of declared)
        if (!Object.hasOwn(provided, name))
          throw new Error(`${owner}.${id}: missing argument '${name}' for macro '${target}'`);
      for (const [name, operand] of Object.entries(provided)) {
        if (!declared.includes(name))
          throw new Error(`${owner}.${id}: unexpected argument '${name}' for macro '${target}'`);
        const nested: { path: string; parameter: string }[] = [];
        collectParameterOperands(
          operand.kind === 'valueNode'
            ? graphDataExpression(graph, operand.nodeId, 'number')
            : operand,
          `${owner}.${id}.arguments.${name}`,
          nested,
        );
        if (nested.length > 0)
          throw new Error(
            `${nested[0]!.path}: macro arguments must not pass through parameter operands`,
          );
      }
    }
    return calls;
  };
  const mainParameters: { path: string; parameter: string }[] = [];
  for (const [id, node] of Object.entries(resource.main.nodes))
    collectParameterOperands(node.action, `main.${id}.action`, mainParameters);
  for (const [id, node] of Object.entries(resource.main.dataNodes ?? {}))
    collectParameterOperands(node.expression, `main.dataNodes.${id}`, mainParameters);
  if (mainParameters.length > 0)
    throw new Error(
      `${mainParameters[0]!.path}: parameter operand is only allowed inside a macro that declares it`,
    );
  inspect(resource.main, 'main');
  for (const [id, macro] of Object.entries(resource.macros)) {
    if (!id) throw new Error('action graph macro identity must not be empty');
    const declared = macro.parameters ?? [];
    const seen = new Set<string>();
    declared.forEach((name, index) => {
      if (!name)
        throw new Error(`macro.${id}.parameters[${index}]: parameter name must not be empty`);
      if (seen.has(name)) throw new Error(`macro.${id}.parameters: duplicate parameter '${name}'`);
      seen.add(name);
    });
    const used: { path: string; parameter: string }[] = [];
    for (const [nodeId, node] of Object.entries(macro.graph.nodes))
      collectParameterOperands(node.action, `macro.${id}.${nodeId}.action`, used);
    for (const [nodeId, node] of Object.entries(macro.graph.dataNodes ?? {}))
      collectParameterOperands(node.expression, `macro.${id}.dataNodes.${nodeId}`, used);
    for (const use of used)
      if (!seen.has(use.parameter))
        throw new Error(`${use.path}: undeclared macro parameter '${use.parameter}'`);
    validateActionGraph(macro.graph, [macro.entry]);
    dependencies.set(id, inspect(macro.graph, `macro.${id}`));
  }
  const complete = new Set<string>();
  const visiting = new Set<string>();
  const visit = (id: string): void => {
    if (complete.has(id)) return;
    if (visiting.has(id)) throw new Error(`recursive action graph macro: ${id}`);
    visiting.add(id);
    for (const target of dependencies.get(id)!) visit(target);
    visiting.delete(id);
    complete.add(id);
  };
  for (const id of dependencies.keys()) visit(id);
}

/** 校验宿主的所有图入口均属于自己的图，包括嵌套 Buff、实体和养成效果。 */
export function validateActionGraphOwner<
  T extends { readonly actionGraph?: ActionGraphDefinition | ActionGraphResourceDefinition },
>(owner: T, path: string): void {
  const entries: ActionGraphReference[] = [];
  const entryPaths: string[] = [];
  const pending: { value: unknown; path: string }[] = [{ value: owner, path: '' }];
  const seen = new WeakSet<object>();
  while (pending.length > 0) {
    const current = pending.pop()!;
    const value = current.value;
    if (value === null || typeof value !== 'object' || seen.has(value)) continue;
    seen.add(value);
    // 嵌套资源独立校验自身图，不能拿外层过渡图解析它的入口。
    if (value !== owner && Object.hasOwn(value, 'actionGraph')) {
      validateActionGraphOwner(
        value as { readonly actionGraph: ActionGraphDefinition | ActionGraphResourceDefinition },
        `${path}${current.path}`,
      );
      continue;
    }
    if (Object.hasOwn(value, '$sequence')) {
      const reference = value as Record<string, unknown>;
      if (
        Object.keys(reference).length !== 1 ||
        (reference.$sequence !== null &&
          (typeof reference.$sequence !== 'string' || reference.$sequence.length === 0))
      ) {
        throw new Error(`${path}${current.path}: invalid action graph reference`);
      }
      entries.push({ $sequence: reference.$sequence as string | null });
      entryPaths.push(current.path);
      continue;
    }
    for (const [key, child] of Object.entries(value)) {
      if (value === owner && key === 'actionGraph') continue;
      pending.push({ value: child, path: `${current.path}.${key}` });
    }
  }
  if (owner.actionGraph === undefined) {
    if (entries.length > 0)
      throw new Error(`${path}${entryPaths[0]}: graph entry without an owning action graph`);
    return;
  }
  try {
    const graph = 'main' in owner.actionGraph ? owner.actionGraph.main : owner.actionGraph;
    if ('main' in owner.actionGraph) validateActionGraphResource(owner.actionGraph);
    validateActionGraph(graph, entries);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const entryMessage = message.replace(
      /^entries\[(\d+)\]/,
      (_, index: string) => entryPaths[Number(index)] ?? `entries[${index}]`,
    );
    throw new Error(entryMessage === message ? `${path}: ${message}` : `${path}${entryMessage}`);
  }
}
