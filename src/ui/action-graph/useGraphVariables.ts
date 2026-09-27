import { computed } from 'vue';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import {
  analyzeGraphBlackboard,
  type BlackboardVariable,
} from '../../application/editor/graphBlackboard';
import { writeNodeField } from './nodeFieldValues';
import type { EditorSelectionState } from '../editor/editorSelection';

/** 所有资源图共用变量来源分析、可选变量及读写节点创建。 */
export function useGraphVariables(context: {
  graph: () => ActionGraphDefinition;
  roots: () => readonly string[];
  parameters: () => readonly string[];
  initial: () => Readonly<Record<string, unknown>>;
  label: () => string;
  selection: EditorSelectionState;
}) {
  const analysis = computed(() =>
    analyzeGraphBlackboard(
      context.graph(),
      context.roots(),
      context.parameters(),
      context.initial(),
      context.label(),
    ),
  );
  const selectedScopes = computed(() => {
    const { selectedId, selectedDataId } = context.selection;
    const scopes = selectedId.value
      ? analysis.value.contexts.get(selectedId.value)
      : selectedDataId.value
        ? analysis.value.dataContexts.get(selectedDataId.value)
        : undefined;
    return [...(scopes ?? [])].flatMap(id => {
      const scope = analysis.value.scopes.get(id);
      return scope ? [scope] : [];
    });
  });
  const variableKeys = computed(() => {
    const id = context.selection.selectedDataId.value;
    const expression = id ? context.graph().dataNodes?.[id]?.expression : undefined;
    const environments = id ? analysis.value.dataContexts.get(id) : undefined;
    const keys = analysis.value.variables
      .filter(variable =>
        expression?.kind === 'parameter'
          ? variable.layer === 'parameter'
          : variable.layer !== 'parameter' &&
            (!environments?.size ||
              variable.scope === 'current' ||
              environments.has(variable.scope)),
      )
      .map(variable => variable.key);
    if (expression?.kind === 'blackboard') keys.push(expression.key);
    if (expression?.kind === 'parameter') keys.push(expression.parameter);
    return [...new Set(keys)];
  });
  function resolve(identity: string) {
    return analysis.value.variables.find(
      variable => JSON.stringify([variable.scope, variable.layer, variable.key]) === identity,
    );
  }
  function createNode(
    graph: ActionGraphDefinition,
    variable: BlackboardVariable,
    write: boolean,
    target?: { owner: 'action' | 'data'; id: string; path: readonly string[] },
  ): { graph: ActionGraphDefinition; id: string } {
    if (write && variable.layer === 'parameter') throw new Error('宏输入参数只允许读取。');
    let index = 1;
    let id: string;
    const collection = write ? graph.nodes : (graph.dataNodes ?? {});
    do {
      id = `${write ? 'node' : 'data'}_${index++}`;
    } while (Object.hasOwn(collection, id));
    if (write)
      return {
        id,
        graph: {
          ...graph,
          nodes: {
            ...graph.nodes,
            [id]: {
              action: {
                kind: 'modifyActionValue',
                parameters: {
                  key: variable.key,
                  operation: 'assign',
                  value: { kind: 'constant', value: 0 },
                },
              },
              next: null,
            },
          },
        },
      };
    const next: ActionGraphDefinition = {
      ...graph,
      dataNodes: {
        ...graph.dataNodes,
        [id]: {
          type: 'number',
          expression:
            variable.layer === 'parameter'
              ? { kind: 'parameter', parameter: variable.key }
              : { kind: 'blackboard', key: variable.key },
        },
      },
    };
    if (!target) return { id, graph: next };
    const environments =
      target.owner === 'action'
        ? analysis.value.contexts.get(target.id)
        : analysis.value.dataContexts.get(target.id);
    if (
      variable.scope !== 'current' &&
      environments?.size &&
      [...environments].some(scope => scope !== variable.scope)
    )
      throw new Error('该变量来自另一局部调用环境，不能在这里自动创建同名读取。');
    return {
      id,
      graph: writeNodeField(
        next,
        target.owner === 'action'
          ? ['nodes', target.id, 'action', ...target.path]
          : ['dataNodes', target.id, 'expression', ...target.path],
        { kind: 'valueNode', nodeId: id },
      ) as ActionGraphDefinition,
    };
  }
  return { analysis, selectedScopes, variableKeys, resolve, createNode };
}
