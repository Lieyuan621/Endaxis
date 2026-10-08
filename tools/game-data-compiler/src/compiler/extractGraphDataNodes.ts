/** 原生投影的表达式只在这里提升为数据节点，发布产物不保留内联输入。 */
import type {
  ActionGraphDefinition,
  ActionGraphDataNode,
  ActionGraphResourceDefinition,
} from '../../../../packages/game-data-contract/src/actionGraph.ts';
import { COMBAT_CONDITION_KINDS } from '../../../../packages/game-data-contract/src/conditions.ts';
import type { IntermediateDefinition } from './intermediateDefinitions.ts';

const conditionKinds = new Set<string>(COMBAT_CONDITION_KINDS);
function expressionType(value: object, stringInput: boolean): ActionGraphDataNode['type'] | null {
  if (stringInput && 'blackboardKey' in value) return 'string';
  if (!('kind' in value)) return null;
  if (value.kind === 'blackboard' || value.kind === 'parameter') return 'number';
  return conditionKinds.has(String(value.kind)) ? 'boolean' : null;
}
function stringField(kind: unknown): string | undefined {
  switch (kind) {
    case 'applyBuff':
      return 'buffId';
    case 'castSkillDuringAction':
      return 'skillId';
    case 'createTimedMarker':
    case 'createAbilityEntityTimedMarker':
    case 'timedMarkerPresent':
    case 'abilityEntityTimedMarkerPresent':
      return 'markerId';
  }
}

function graphExtractor(graph: IntermediateDefinition<ActionGraphDefinition>) {
  const dataNodes: Record<string, ActionGraphDataNode> = {};
  const reserved = new Set(Object.keys(graph.dataNodes ?? {}));
  let serial = 1;
  function children(value: object, parameterStringField?: string): object {
    const kind = 'kind' in value ? value.kind : undefined;
    const entries = Object.entries(value);
    const result = entries.map(
      ([key, item]) =>
        [
          key,
          visit(
            item,
            key === parameterStringField || key === stringField(kind),
            key === 'parameters' ? stringField(kind) : undefined,
          ),
        ] as const,
    );
    return result.every(([, item], index) => item === entries[index]![1])
      ? value
      : Object.fromEntries(result);
  }
  function visit(value: unknown, stringInput = false, parameterStringField?: string): unknown {
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
      const items = value.map(item => visit(item));
      return items.every((item, index) => item === value[index]) ? value : items;
    }
    const type = expressionType(value, stringInput);
    const expression = children(value, parameterStringField);
    if (!type) return expression;
    let id: string;
    do {
      id = `data_${serial++}`;
    } while (reserved.has(id));
    reserved.add(id);
    // 上方逐个处理表达式子输入；此处是生成中间定义到正式节点的唯一转换。
    dataNodes[id] = { type, expression } as ActionGraphDataNode;
    return {
      kind: type === 'boolean' ? 'conditionNode' : type === 'string' ? 'stringNode' : 'valueNode',
      nodeId: id,
    };
  }
  for (const [id, node] of Object.entries(graph.dataNodes ?? {})) {
    const expression =
      typeof node.expression === 'object' ? children(node.expression) : node.expression;
    dataNodes[id] = { ...node, expression } as ActionGraphDataNode;
  }
  const nodes = Object.fromEntries(
    Object.entries(graph.nodes).map(([id, node]) => [
      id,
      {
        ...node,
        action: visit(node.action),
      },
    ]),
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
