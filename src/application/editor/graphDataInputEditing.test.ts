import { expect, it } from 'vitest';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { CombatCondition } from '../../../packages/game-data-contract/src/conditions';
import { actionTypedInputs, dataTypedInputs } from '../../ui/action-graph/typedGraphInputs';
import {
  appendCondition,
  moveCondition,
  removeCondition,
} from '../../ui/field-editor/conditionList';
import { setGraphDataInput } from './graphDataInputEditing';
import { updateResourceGraph } from './actionGraphResourceEditing';
import { DefinitionDraftSession } from './definitionDraftSession';

function fixture(): ActionGraphDefinition {
  return {
    nodes: {
      first: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'out',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'read' },
          },
        },
        next: 'second',
      },
      second: {
        action: {
          kind: 'modifyActionValue',
          parameters: {
            key: 'out',
            operation: 'assign',
            value: { kind: 'valueNode', nodeId: 'read' },
          },
        },
        next: null,
      },
      branch: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'test' } },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
      optional: { action: { kind: 'dealStagger', parameters: { value: 2 } }, next: null },
    },
    dataNodes: {
      read: { type: 'number', expression: { kind: 'blackboard', key: 'count' } },
      test: {
        type: 'boolean',
        expression: {
          kind: 'actionValueCompare',
          left: { kind: 'valueNode', nodeId: 'read' },
          operator: 'equal',
          right: { kind: 'constant', value: 1 },
        },
      },
    },
  };
}
function input(graph: ActionGraphDefinition, id = 'first', path = 'parameters.value') {
  return actionTypedInputs(graph.nodes[id]!.action).find(input => input.path.join('.') === path)!;
}
it('requires an explicit correctly typed finite inline value; rejected disconnect keeps the old graph', () => {
  const graph = fixture();
  for (const value of [undefined, NaN, Infinity, true])
    expect(() => setGraphDataInput(graph, 'action', 'first', input(graph), null, value)).toThrow(
      '合法',
    );
  expect(() => setGraphDataInput(graph, 'action', 'first', input(graph), 'test')).toThrow('类型');
  expect(input(graph).source).toBe('read');
  expect(
    setGraphDataInput(graph, 'action', 'first', input(graph), null, 0).nodes.first!.action,
  ).toHaveProperty('parameters.value', { kind: 'constant', value: 0 });
});
it('swaps a single consumer atomically, preserving shared reads, undo/redo and saved data', () => {
  const source = { actionGraph: { main: fixture(), macros: {} } };
  const history = new DefinitionDraftSession(source, true);
  history.update(owner =>
    updateResourceGraph(owner, { kind: 'main' }, graph =>
      setGraphDataInput(graph, 'action', 'first', input(graph), null, 7),
    ),
  );
  const changed = history.current.actionGraph.main;
  expect(input(changed).value).toEqual({ kind: 'constant', value: 7 });
  expect(input(changed, 'second').source).toBe('read');
  expect(changed.dataNodes?.read).toEqual(source.actionGraph.main.dataNodes?.read);
  expect(history.undo()).toBe(true);
  expect(input(history.current.actionGraph.main).source).toBe('read');
  expect(history.canUndo).toBe(false);
  expect(history.redo()).toBe(true);
  expect(JSON.parse(JSON.stringify(history.exportDefinition()))).toEqual(history.current);
  history.update(owner =>
    updateResourceGraph(owner, { kind: 'main' }, graph =>
      setGraphDataInput(graph, 'action', 'first', input(graph), 'read'),
    ),
  );
  expect(input(history.current.actionGraph.main).source).toBe('read');
});
it('connects an unassigned schema input without creating a fabricated constant or variable', () => {
  const graph = fixture();
  const slot = input(graph, 'optional', 'parameters.valueMultiplier');
  expect(slot.value).toBeUndefined();
  const connected = setGraphDataInput(graph, 'action', 'optional', slot, 'read');
  expect(input(connected, 'optional', 'parameters.valueMultiplier').source).toBe('read');
  expect(connected.dataNodes).toBe(graph.dataNodes);
  expect(input(graph, 'optional', 'parameters.valueMultiplier').value).toBeUndefined();
});
it('boolean replacement and data-node input replacement share the same transaction boundary', () => {
  const graph = fixture();
  const bool = input(graph, 'branch', 'parameters.condition');
  expect(() => setGraphDataInput(graph, 'action', 'branch', bool, null, 0)).toThrow('合法');
  const changed = setGraphDataInput(graph, 'action', 'branch', bool, null, false);
  expect(input(changed, 'branch', 'parameters.condition').value).toEqual({
    kind: 'constant',
    value: false,
  });
  const left = dataTypedInputs(graph.dataNodes!.test!)[0]!;
  expect(
    setGraphDataInput(graph, 'data', 'test', left, null, 3).dataNodes?.test?.expression,
  ).toHaveProperty('left', { kind: 'constant', value: 3 });
});
it('cycles and illegal macro parameter use are rejected without adding undo history', () => {
  const original = fixture();
  const graph: ActionGraphDefinition = {
    ...original,
    dataNodes: {
      ...original.dataNodes,
      all: {
        type: 'boolean',
        expression: { kind: 'all', conditions: [{ kind: 'constant', value: true }] },
      },
      parameter: { type: 'number', expression: { kind: 'parameter', parameter: 'arg' } },
    },
  };
  const history = new DefinitionDraftSession({ actionGraph: { main: graph, macros: {} } }, true);
  expect(() =>
    history.update(owner =>
      updateResourceGraph(owner, { kind: 'main' }, current =>
        setGraphDataInput(current, 'action', 'first', input(current), 'parameter'),
      ),
    ),
  ).toThrow('parameter');
  expect(history.canUndo).toBe(false);
  expect(() =>
    history.update(owner =>
      updateResourceGraph(owner, { kind: 'main' }, current =>
        setGraphDataInput(
          current,
          'data',
          'all',
          dataTypedInputs(current.dataNodes!.all!)[0]!,
          'all',
        ),
      ),
    ),
  ).toThrow('recursive');
  expect(history.canUndo).toBe(false);
});

function conditionListFixture(kind: 'all' | 'any'): ActionGraphDefinition {
  const graph = fixture();
  return {
    ...graph,
    nodes: {
      ...graph.nodes,
      listConsumer: {
        action: {
          kind: 'conditional',
          parameters: { condition: { kind: 'conditionNode', nodeId: 'list' } },
          whenTrue: { $sequence: null },
          whenFalse: { $sequence: null },
        },
        next: null,
      },
    },
    dataNodes: {
      ...graph.dataNodes,
      list: {
        type: 'boolean',
        expression: {
          kind,
          conditions: [
            { kind: 'conditionNode', nodeId: 'test' },
            { kind: 'conditionNode', nodeId: 'test_data_1' },
            { kind: 'constant', value: true },
            { kind: 'conditionNode', nodeId: 'test' },
          ],
        },
      },
      unused: { type: 'number', expression: { kind: 'constant', value: 19 } },
      test_data_1: {
        type: 'boolean',
        expression: { kind: 'not', condition: { kind: 'constant', value: false } },
      },
    },
  };
}

function conditionList(graph: ActionGraphDefinition) {
  const node = graph.dataNodes!.list!;
  if (node.type !== 'boolean') throw new Error('wrong fixture');
  const expression = node.expression;
  if (expression.kind !== 'all' && expression.kind !== 'any') throw new Error('wrong fixture');
  return expression;
}

function replaceConditionList(
  graph: ActionGraphDefinition,
  conditions: readonly CombatCondition[],
): ActionGraphDefinition {
  return {
    ...graph,
    dataNodes: {
      ...graph.dataNodes,
      list: { type: 'boolean', expression: { ...conditionList(graph), conditions } },
    },
  };
}

it.each(['all', 'any'] as const)(
  '%s 列表暂存增删和排序，Apply 只产生一条历史并保留共享来源和导出顺序',
  kind => {
    const source = { actionGraph: { main: conditionListFixture(kind), macros: {} } };
    const history = new DefinitionDraftSession(source, true);
    const before = history.current;
    const original = conditionList(before.actionGraph.main).conditions;
    const appended = appendCondition(original, false);
    const removed = removeCondition(appended, 0);
    const reordered = moveCondition(removed, 3, 0);
    expect(appended).toEqual([...original, { kind: 'constant', value: false }]);
    expect(original).toHaveLength(4);
    expect(reordered[0]).toBe(appended[4]);
    expect(reordered[1]).toBe(original[1]);
    expect(reordered[2]).toBe(original[2]);
    expect(reordered[3]).toBe(original[3]);
    expect(history.current).toBe(before);
    expect(history.canUndo).toBe(false);

    expect(
      history.update(owner =>
        updateResourceGraph(owner, { kind: 'main' }, graph =>
          replaceConditionList(graph, reordered),
        ),
      ),
    ).toBe(true);
    const applied = history.current;
    const changed = applied.actionGraph.main;
    expect(conditionList(changed).conditions).toBe(reordered);
    expect(changed.nodes).toBe(before.actionGraph.main.nodes);
    for (const id of ['read', 'test', 'unused'])
      expect(changed.dataNodes![id]).toBe(before.actionGraph.main.dataNodes![id]);
    expect(input(changed, 'branch', 'parameters.condition').source).toBe('test');
    expect(input(changed, 'second').source).toBe('read');
    expect(conditionList(source.actionGraph.main).conditions).toHaveLength(4);

    expect(history.undo()).toBe(true);
    expect(history.current).toBe(before);
    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(true);
    expect(history.current).toBe(applied);
    expect(history.redo()).toBe(false);
    const exported = history.exportDefinition();
    expect(exported).not.toBe(applied);
    const reopened = JSON.parse(JSON.stringify(exported));
    expect(reopened).toEqual(applied);
    expect(conditionList(reopened.actionGraph.main).conditions).toEqual(reordered);
  },
);

it('拒绝越界列表操作和失效引用，失败不会新增历史或清空已有 redo', () => {
  const history = new DefinitionDraftSession(
    { actionGraph: { main: conditionListFixture('all'), macros: {} } },
    true,
  );
  const apply = (change: (conditions: readonly CombatCondition[]) => readonly CombatCondition[]) =>
    history.update(owner =>
      updateResourceGraph(owner, { kind: 'main' }, graph =>
        replaceConditionList(graph, change(conditionList(graph).conditions)),
      ),
    );
  apply(conditions => appendCondition(conditions, true));
  const applied = history.current;
  expect(history.undo()).toBe(true);
  const before = history.current;
  const rejected = [
    () => apply(conditions => removeCondition(conditions, -1)),
    () => apply(conditions => moveCondition(conditions, 0, conditions.length)),
    () => apply(conditions => [...conditions, { kind: 'conditionNode', nodeId: 'missing' }]),
    () => apply(conditions => [...conditions, { kind: 'conditionNode', nodeId: 'list' }]),
  ];
  for (const change of rejected) {
    expect(change).toThrow();
    expect(history.current).toBe(before);
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(true);
  }
  expect(history.redo()).toBe(true);
  expect(history.current).toBe(applied);
  expect(history.redo()).toBe(false);
});
