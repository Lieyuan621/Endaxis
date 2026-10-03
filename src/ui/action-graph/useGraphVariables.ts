import {
  globalBuffBlackboardContext,
  globalBuffDraftContext,
  isGlobalBuffDefinitionPath,
} from '../../application/editor/globalBuffFieldContext';
import { createGraphDataResolver } from '../../core/action-graph/actionGraphData';
import { assertFiniteFieldValue } from '../../core/editor/resolveDefinitionSchema';
import { validMappingValue, validMappingSources } from '../field-editor/blackboardMapping';
import { computed } from 'vue';
import { validStringOperandDraft } from '../field-editor/stringOperandDraft';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import {
  analyzeGraphBlackboard,
  graphFieldContexts,
  type BlackboardVariable,
} from '../../application/editor/graphBlackboard';
import {
  createBlackboardFieldContext,
  resolveBlackboardKey,
} from '../../application/editor/blackboardFieldContext';
import { setGraphDataInput } from '../../application/editor/graphDataInputEditing';
import { actionTypedInputs, dataTypedInputs } from './typedGraphInputs';
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
  const blackboardContext = computed(() => {
    const { selectedId, selectedDataId } = context.selection;
    return createBlackboardFieldContext(
      analysis.value,
      selectedId.value
        ? analysis.value.contexts.get(selectedId.value)
        : selectedDataId.value
          ? analysis.value.dataContexts.get(selectedDataId.value)
          : undefined,
    );
  });
  const variableKeys = computed(() => {
    const id = context.selection.selectedDataId.value;
    const node = id ? context.graph().dataNodes?.[id] : undefined;
    const expression = node?.expression;
    return resolveBlackboardKey(blackboardContext.value, undefined, {
      mode:
        expression &&
        typeof expression === 'object' &&
        'kind' in expression &&
        expression.kind === 'parameter'
          ? 'parameter'
          : 'read',
      valueType: node?.type === 'string' ? 'string' : 'number',
    })
      .candidates.filter(candidate => candidate.selectable)
      .map(candidate => candidate.key);
  });
  function targetContext(
    graph: ActionGraphDefinition,
    owner: 'action' | 'data',
    id: string,
    path: readonly string[],
  ) {
    const environments = graphFieldContexts(analysis.value, graph, owner, id, path);
    const enclosing = createBlackboardFieldContext(analysis.value, environments);
    if (
      owner === 'action' &&
      !environments?.size &&
      isGlobalBuffDefinitionPath(graph.nodes[id]?.action.kind, path)
    ) {
      const draft = globalBuffDraftContext(graph.nodes[id]?.action);
      return globalBuffBlackboardContext(enclosing, draft?.definition, draft?.overrides);
    }
    return enclosing;
  }
  function targetInput(
    graph: ActionGraphDefinition,
    owner: 'action' | 'data',
    id: string,
    path: readonly string[],
  ) {
    const action = owner === 'action' ? graph.nodes[id]?.action : undefined;
    const data = owner === 'data' ? graph.dataNodes?.[id] : undefined;
    return (action ? actionTypedInputs(action) : data ? dataTypedInputs(data) : []).find(
      input =>
        input.path.length === path.length &&
        input.path.every((part, index) => part === path[index]),
    );
  }
  function assertConnection(
    graph: ActionGraphDefinition,
    owner: 'action' | 'data',
    id: string,
    path: readonly string[],
    source: string | null,
  ): void {
    if (source === null) return;
    const board = targetContext(graph, owner, id, path);
    const input = targetInput(graph, owner, id, path);
    if (!input) throw new Error('数据输入不存在');
    // Open runtime boards still contain reliable incompatible/out-of-scope evidence.
    // Unknown string sources remain permitted by the same inline operand policy.
    if (!board.closed && input.type !== 'string') return;
    assertFiniteFieldValue(graph);
    const value = createGraphDataResolver(graph).node(source, input.type);
    assertFiniteFieldValue(value);
    if (input.type === 'string') {
      if (!validStringOperandDraft(value, undefined, undefined, board))
        throw new Error('字符串读取不兼容其实际调用黑板。');
      return;
    }
    if (
      !validMappingValue(value, 'operand') ||
      !validMappingSources([{ key: 'value', value }], undefined, 'operand', board)
    )
      throw new Error('GlobalBuff 数值读取不兼容其实际局部黑板。');
  }
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
    if (write && analysis.value.globalBuffScopes.has(variable.scope))
      throw new Error('GlobalBuff 局部板没有写入动作入口；请编辑定义或创建覆盖。');
    const sourceContext = createBlackboardFieldContext(analysis.value, new Set([variable.scope]));
    const evidence = resolveBlackboardKey(sourceContext, variable.key, {
      mode: variable.layer === 'parameter' ? 'parameter' : 'read',
      valueType: 'any',
    });
    // Observed reads do not prove a source type. An explicit typed destination can
    // constrain an otherwise unknown runtime key, but cannot change a known type.
    const destinationInput = target
      ? targetInput(graph, target.owner, target.id, target.path)
      : undefined;
    const sourceType = evidence.selected?.valueType;
    const valueType =
      !write &&
      variable.layer !== 'parameter' &&
      (sourceType === 'string' ||
        ((sourceType === undefined || sourceType === 'unknown') &&
          destinationInput?.type === 'string'))
        ? 'string'
        : 'number';
    const source = resolveBlackboardKey(sourceContext, variable.key, {
      mode: variable.layer === 'parameter' ? 'parameter' : write ? 'write' : 'read',
      valueType,
    });
    if (source.state === 'typeMismatch') throw new Error('黑板变量类型不兼容数据节点。');
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
        [id]:
          valueType === 'string'
            ? { type: 'string', expression: { blackboardKey: variable.key } }
            : {
                type: 'number',
                expression:
                  variable.layer === 'parameter'
                    ? { kind: 'parameter', parameter: variable.key }
                    : { kind: 'blackboard', key: variable.key },
              },
      },
    };
    if (!target) return { id, graph: next };
    const environments = graphFieldContexts(
      analysis.value,
      graph,
      target.owner,
      target.id,
      target.path,
    );
    const destination = resolveBlackboardKey(
      targetContext(graph, target.owner, target.id, target.path),
      variable.key,
      { mode: variable.layer === 'parameter' ? 'parameter' : 'read', valueType },
    );
    if (
      !destination.valid ||
      (!environments?.size && variable.scope !== 'current') ||
      (variable.layer !== 'parameter' &&
        (analysis.value.globalBuffScopes.has(variable.scope) ||
          (target.owner === 'action' &&
            isGlobalBuffDefinitionPath(graph.nodes[target.id]?.action.kind, target.path)) ||
          (!!environments?.size &&
            [...environments].every(scope => analysis.value.globalBuffScopes.has(scope)))) &&
        !environments?.has(variable.scope))
    )
      throw new Error('该变量来自另一局部调用环境，不能在这里自动创建同名读取。');
    const input = destinationInput;
    if (!input || input.type !== valueType)
      throw new Error('变量读取只能连接类型相符的正式数据输入。');
    return { id, graph: setGraphDataInput(next, target.owner, target.id, input, id) };
  }
  return {
    analysis,
    selectedScopes,
    variableKeys,
    blackboardContext,
    resolve,
    createNode,
    assertConnection,
  };
}
