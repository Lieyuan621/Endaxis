/** 原生投影的表达式只在这里提升为数据节点，发布产物不保留内联输入。 */
import type {
  ActionGraphDefinition,
  ActionGraphDataNode,
  ActionGraphResourceDefinition,
} from '../../../../packages/game-data-contract/src/actionGraph.ts';
import { COMBAT_CONDITION_KINDS } from '../../../../packages/game-data-contract/src/conditions.ts';
import { isDeepStrictEqual } from 'node:util';
import type { IntermediateDefinition } from './intermediateDefinitions.ts';

const conditionKinds = new Set<string>(COMBAT_CONDITION_KINDS);
function expressionType(value: object, stringInput: boolean): ActionGraphDataNode['type'] | null {
  if (stringInput && 'blackboardKey' in value) return 'string';
  if (!('kind' in value)) return null;
  if (value.kind === 'blackboard' || value.kind === 'parameter') return 'number';
  return conditionKinds.has(String(value.kind)) ? 'boolean' : null;
}
function stringFields(kind: unknown): readonly string[] {
  switch (kind) {
    case 'applyBuff':
      return ['buffId'];
    case 'castSkillDuringAction':
      return ['skillId'];
    case 'createTimedMarker':
    case 'timedMarkerPresent':
      return ['markerId'];
    case 'stringEquals':
      return ['left', 'right'];
  }
  return [];
}

function graphExtractor(graph: IntermediateDefinition<ActionGraphDefinition>) {
  const dataNodes: Record<string, ActionGraphDataNode> = {};
  const reserved = new Set(Object.keys(graph.dataNodes ?? {}));
  // 只共享变量读取的定义；各消费点仍在自己的调用作用域中即时求值。
  // 缺省值参与严格比较（包括 -0、Infinity），不合并条件或随机求值节点。
  const reads = new Map<string, string[]>();
  function readKey(type: ActionGraphDataNode['type'], expression: unknown): string | undefined {
    if (!expression || typeof expression !== 'object' || type === 'boolean') return undefined;
    if (type === 'string' && 'blackboardKey' in expression)
      return JSON.stringify([type, expression.blackboardKey]);
    if (type === 'number' && 'kind' in expression) {
      if (expression.kind === 'blackboard' && 'key' in expression)
        return JSON.stringify([type, expression.kind, expression.key]);
      if (expression.kind === 'parameter' && 'parameter' in expression)
        return JSON.stringify([type, expression.kind, expression.parameter]);
    }
    return undefined;
  }
  function registerRead(id: string): void {
    const node = dataNodes[id]!;
    const key = readKey(node.type, node.expression);
    if (key === undefined) return;
    const ids = reads.get(key);
    if (ids) ids.push(id);
    else reads.set(key, [id]);
  }
  let serial = 1;
  function children(value: object, parameterStringField: readonly string[] = []): object {
    const kind = 'kind' in value ? value.kind : undefined;
    if (
      kind === 'twoDirectionAngleCompare' ||
      kind === 'targetFacingAngle' ||
      kind === 'comboCameraAlphaSetting'
    )
      throw new Error(`${kind} still affects combat and cannot be published`);
    const entries = Object.entries(value);
    const result = entries.map(
      ([key, item]) =>
        [
          key,
          visit(
            item,
            parameterStringField.includes(key) || stringFields(kind).includes(key),
            key === 'parameters'
              ? stringFields(kind)
              : key === 'buffs'
                ? parameterStringField
                : undefined,
          ),
        ] as const,
    );
    return result.every(([, item], index) => item === entries[index]![1])
      ? value
      : Object.fromEntries(result);
  }
  function visit(
    value: unknown,
    stringInput = false,
    parameterStringField: readonly string[] = [],
  ): unknown {
    if (!value || typeof value !== 'object' || 'actionGraph' in value) return value;
    if (
      'kind' in value &&
      (value.kind === 'constant' ||
        value.kind === 'valueNode' ||
        value.kind === 'conditionNode' ||
        value.kind === 'stringNode')
    )
      return value;
    if (Array.isArray(value)) {
      const items = value.map(item => visit(item, false, parameterStringField));
      return items.every((item, index) => item === value[index]) ? value : items;
    }
    const type = expressionType(value, stringInput);
    const expression = children(value, parameterStringField);
    if (!type) return expression;
    const key = readKey(type, expression);
    const shared =
      key === undefined
        ? undefined
        : reads.get(key)?.find(id => isDeepStrictEqual(dataNodes[id]!.expression, expression));
    if (shared !== undefined)
      return { kind: type === 'string' ? 'stringNode' : 'valueNode', nodeId: shared };
    let id: string;
    do {
      id = `data_${serial++}`;
    } while (reserved.has(id));
    reserved.add(id);
    // 上方逐个处理表达式子输入；此处是生成中间定义到正式节点的唯一转换。
    dataNodes[id] = { type, expression } as ActionGraphDataNode;
    registerRead(id);
    return {
      kind: type === 'boolean' ? 'conditionNode' : type === 'string' ? 'stringNode' : 'valueNode',
      nodeId: id,
    };
  }
  for (const [id, node] of Object.entries(graph.dataNodes ?? {})) {
    const expression =
      typeof node.expression === 'object' ? children(node.expression) : node.expression;
    dataNodes[id] = { ...node, expression } as ActionGraphDataNode;
    registerRead(id);
  }
  const nodes = Object.fromEntries(
    Object.entries(graph.nodes).map(([id, node]) => {
      if (node.action.kind === 'saveTwoDirectionAngle')
        throw new Error(
          `Action graph node ${id}: direction angle still affects combat and cannot be published`,
        );
      return [
        id,
        {
          ...node,
          action: visit(node.action),
        },
      ];
    }),
  );
  return {
    input: visit,
    finish: () =>
      ({ nodes, ...(Object.keys(dataNodes).length ? { dataNodes } : {}) }) as ActionGraphDefinition,
  };
}

export function extractGraphDataNodes(
  graph: IntermediateDefinition<ActionGraphDefinition>,
): ActionGraphDefinition {
  return graphExtractor(graph).finish();
}
export function extractResourceDataNodes(
  resource: IntermediateDefinition<ActionGraphResourceDefinition>,
): ActionGraphResourceDefinition {
  return {
    main: extractGraphDataNodes(resource.main),
    macros: Object.fromEntries(
      Object.entries(resource.macros).map(([id, macro]) => [
        id,
        {
          ...macro,
          graph: extractGraphDataNodes(macro.graph),
        },
      ]),
    ),
  };
}

/** 图外的技能门禁与事件条件也属于该资源的主图；不建立干员或装备总图。 */
export function extractDefinitionDataNodes<T>(definition: IntermediateDefinition<T>): T {
  function visit(value: unknown): unknown {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(visit);
    const fields = Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, visit(item)]),
    );
    if (!('actionGraph' in fields) || !fields.actionGraph) return fields;
    const resource = fields.actionGraph as IntermediateDefinition<ActionGraphResourceDefinition>;
    const main = graphExtractor(resource.main);
    if (fields.availability !== undefined) fields.availability = main.input(fields.availability);
    if (fields.switchToBuffCast && typeof fields.switchToBuffCast === 'object') {
      const route = fields.switchToBuffCast as Record<string, unknown>;
      if (route.condition !== undefined)
        fields.switchToBuffCast = { ...route, condition: main.input(route.condition) };
    }
    if (Array.isArray(fields.eventHandlers))
      fields.eventHandlers = fields.eventHandlers.map(handler => ({
        ...handler,
        ...(handler.condition === undefined ? {} : { condition: main.input(handler.condition) }),
      }));
    fields.actionGraph = {
      main: main.finish(),
      macros: Object.fromEntries(
        Object.entries(resource.macros).map(([id, macro]) => [
          id,
          {
            ...macro,
            graph: extractGraphDataNodes(macro.graph),
          },
        ]),
      ),
    };
    return fields;
  }
  return visit(definition) as T;
}
