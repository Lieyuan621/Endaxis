import { expect, it } from 'vitest';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import { actionTypedInputs, dataTypedInputs } from '../../ui/action-graph/typedGraphInputs';
import { DefinitionDraftSession } from './definitionDraftSession';
import { setGraphDataInput } from './graphDataInputEditing';
import { updateResourceGraph } from './actionGraphResourceEditing';
import { WorkspaceAssetSession } from '../../ui/asset-workspace/workspaceSession';
import { saveProjectTemplateDefinition } from './projectTemplateCommands';
import { createEmptyProject } from '../../core/project/createProject';
import { parseProjectDocument, serializeProjectDocument } from '../../core/project/serialization';
import { perlica } from '../../data/operators/perlica.generated';
import { createActionGraphCompilation } from '../../core/compiler/compileActionGraph';

function fixture(): ActionGraphDefinition {
  return {
    nodes: {
      first: {
        action: {
          kind: 'applyBuff',
          parameters: { target: 'caster', buffId: { kind: 'stringNode', nodeId: 'shared' } },
        },
        next: 'second',
      },
      second: {
        action: {
          kind: 'applyBuff',
          parameters: { target: 'caster', buffId: { kind: 'stringNode', nodeId: 'shared' } },
        },
        next: 'legacy',
      },
      legacy: {
        action: {
          kind: 'applyBuff',
          parameters: { target: 'caster', buffId: { blackboardKey: 'legacyBuff' } },
        },
        next: null,
      },
    },
    dataNodes: {
      shared: { type: 'string', expression: { blackboardKey: 'buff' } },
      alias: { type: 'string', expression: { kind: 'stringNode', nodeId: 'shared' } },
      numeric: { type: 'number', expression: { kind: 'constant', value: 1 } },
    },
  };
}
function input(graph: ActionGraphDefinition, id = 'first') {
  return actionTypedInputs(graph.nodes[id]!.action).find(
    input => input.path.join('.') === 'parameters.buffId',
  )!;
}

it('string connections retain raw exact literals, shared readers, legacy operands and one undo/redo step', () => {
  const original = { actionGraph: { main: fixture(), macros: {} } };
  const session = new DefinitionDraftSession(original, true);
  const initial = session.current;
  const literal = ' \tBuff\r\n ';
  expect(input(original.actionGraph.main).type).toBe('string');
  expect(
    session.update(owner =>
      updateResourceGraph(owner, { kind: 'main' }, graph =>
        setGraphDataInput(graph, 'action', 'first', input(graph), null, literal),
      ),
    ),
  ).toBe(true);
  const changed = session.current;
  expect(input(changed.actionGraph.main).value).toBe(literal);
  expect(input(changed.actionGraph.main, 'second').source).toBe('shared');
  expect(changed.actionGraph.main.dataNodes).toBe(initial.actionGraph.main.dataNodes);
  expect(changed.actionGraph.main.nodes.legacy).toBe(initial.actionGraph.main.nodes.legacy);
  expect(session.undo()).toBe(true);
  expect(session.current).toBe(initial);
  expect(session.canUndo).toBe(false);
  expect(session.redo()).toBe(true);
  expect(session.current).toBe(changed);
  expect(JSON.parse(JSON.stringify(session.exportDefinition()))).toEqual(changed);
  const connected = setGraphDataInput(
    changed.actionGraph.main,
    'action',
    'first',
    input(changed.actionGraph.main),
    'alias',
  );
  expect(input(connected).value).toEqual({ kind: 'stringNode', nodeId: 'alias' });
  for (const bad of [undefined, '', 0, false])
    expect(() =>
      setGraphDataInput(connected, 'action', 'first', input(connected), null, bad),
    ).toThrow('合法');
  expect(() =>
    setGraphDataInput(connected, 'action', 'first', input(connected), 'numeric'),
  ).toThrow('类型');
  expect(() =>
    setGraphDataInput(connected, 'action', 'first', input(connected), 'missing'),
  ).toThrow('类型');
  expect(
    setGraphDataInput(connected, 'action', 'first', input(connected), null, '\t\r\n').nodes.first!
      .action,
  ).toHaveProperty('parameters.buffId', '\t\r\n');
});

it('string data root inputs use the same immutable boundary and reject cycles without losing redo', () => {
  const session = new DefinitionDraftSession(
    { actionGraph: { main: fixture(), macros: {} } },
    true,
  );
  const apply = (source: string | null, literal?: string) =>
    session.update(owner =>
      updateResourceGraph(owner, { kind: 'main' }, graph =>
        setGraphDataInput(
          graph,
          'data',
          'alias',
          dataTypedInputs(graph.dataNodes!.alias!)[0]!,
          source,
          literal,
        ),
      ),
    );
  expect(apply(null, 'inline')).toBe(true);
  expect(session.current.actionGraph.main.dataNodes!.alias!.expression).toBe('inline');
  expect(session.undo()).toBe(true);
  const before = session.current;
  expect(() => apply('alias')).toThrow(/recursive/);
  expect(session.current).toBe(before);
  expect(session.canRedo).toBe(true);
  expect(session.redo()).toBe(true);
  expect(apply('shared')).toBe(true);
  expect(session.current.actionGraph.main.dataNodes!.alias!.expression).toEqual({
    kind: 'stringNode',
    nodeId: 'shared',
  });
});

it('main and macro string sources with the same id stay graph-local through edits and serialization', () => {
  const main = fixture();
  const macro = {
    ...fixture(),
    dataNodes: { shared: { type: 'string' as const, expression: 'macro buff' } },
  };
  const original = {
    actionGraph: {
      main,
      macros: { local: { entry: { $sequence: 'first' as const }, graph: macro } },
    },
  };
  const session = new DefinitionDraftSession(original, true);
  const initialMain = session.current.actionGraph.main;
  session.update(owner =>
    updateResourceGraph(owner, { kind: 'macro', macroId: 'local' }, graph =>
      setGraphDataInput(graph, 'action', 'first', input(graph), null, 'changed macro'),
    ),
  );
  expect(session.current.actionGraph.main).toBe(initialMain);
  expect(session.current.actionGraph.macros.local.graph.dataNodes!.shared!.expression).toBe(
    'macro buff',
  );
  expect(session.current.actionGraph.main.dataNodes!.shared!.expression).toEqual({
    blackboardKey: 'buff',
  });
  expect(JSON.parse(JSON.stringify(session.exportDefinition()))).toEqual(session.current);
  expect(session.undo()).toBe(true);
  const before = session.current;
  expect(() =>
    session.update(owner =>
      updateResourceGraph(owner, { kind: 'macro', macroId: 'local' }, graph =>
        setGraphDataInput(graph, 'action', 'first', input(graph), 'alias'),
      ),
    ),
  ).toThrow('类型');
  expect(session.current).toBe(before);
  expect(session.canRedo).toBe(true);
});

it('workspace save and official project import preserve mixed old/new string operands and compile graph-local sources', () => {
  const main = fixture();
  const macro = {
    ...fixture(),
    dataNodes: {
      ...fixture().dataNodes,
      shared: { type: 'string' as const, expression: 'macro buff' },
    },
  };
  const owner = {
    ...perlica.dodgeSkill!,
    scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'first' } }],
    actionGraph: {
      main: {
        ...main,
        nodes: {
          ...main.nodes,
          legacy: { ...main.nodes.legacy!, next: 'literal' },
          literal: {
            action: {
              kind: 'applyBuff' as const,
              parameters: { target: 'caster' as const, buffId: 'legacy literal' },
            },
            next: 'invoke',
          },
          invoke: { action: { kind: 'callMacro' as const, macroId: 'local' }, next: null },
        },
      },
      macros: { local: { parameters: [], entry: { $sequence: 'first' }, graph: macro } },
    },
  };
  const session = new WorkspaceAssetSession(
    {
      id: perlica.slug,
      kind: 'operator',
      kindName: 'Operator',
      name: 'String roundtrip',
      custom: false,
      edit: { kind: 'operator', definition: { ...perlica, dodgeSkill: owner } },
    },
    'project:operator:string-pins',
  );
  const before = session.current;
  const literal = ' \tprecise\r\n ';
  expect(
    session.changeGraph(['dodgeSkill'], resource =>
      updateResourceGraph(resource, { kind: 'main' }, graph =>
        setGraphDataInput(graph, 'action', 'first', input(graph), null, literal),
      ),
    ),
  ).toBe(true);
  const changed = session.current;
  expect(session.history.undo()).toBe(true);
  expect(session.current).toBe(before);
  expect(session.history.redo()).toBe(true);
  expect(session.current).toBe(changed);
  const request = session.saveRequest();
  const project = saveProjectTemplateDefinition(
    createEmptyProject({ createdWith: 'string-pin-test' }),
    request.draft.edit,
    request.sourceId,
    request.targetId,
    request.draft.name,
    request.replace,
    request.draft.graphPresentations,
  );
  const parsed = parseProjectDocument(serializeProjectDocument(project));
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(JSON.stringify(parsed));
  const reopened =
    parsed.value.definitionLibrary!.operators[request.targetId]!.definition.dodgeSkill!;
  expect(reopened.actionGraph.main.nodes.first!.action).toHaveProperty(
    'parameters.buffId',
    literal,
  );
  expect(reopened.actionGraph.main.nodes.second!.action).toHaveProperty('parameters.buffId', {
    kind: 'stringNode',
    nodeId: 'shared',
  });
  expect(reopened.actionGraph.main.nodes.legacy!.action).toHaveProperty('parameters.buffId', {
    blackboardKey: 'legacyBuff',
  });
  expect(reopened.actionGraph.main.nodes.literal!.action).toHaveProperty(
    'parameters.buffId',
    'legacy literal',
  );
  expect(reopened.actionGraph.macros.local!.graph.dataNodes!.shared!.expression).toBe('macro buff');
  expect(reopened.actionGraph.main.dataNodes!.shared!.expression).toEqual({
    blackboardKey: 'buff',
  });
  const compilation = createActionGraphCompilation(reopened.actionGraph, 1);
  compilation.compileEntry({ $sequence: 'first' }, 'roundtrip');
  const ids = [...compilation.program.nodes.values()].flatMap(node =>
    node.action.kind === 'applyBuff' ? [node.action.parameters.buffId] : [],
  );
  expect(ids).toContain(literal);
  expect(ids).toContain('macro buff');
  expect(ids).toContain('legacy literal');
  expect(ids).toContainEqual({ blackboardKey: 'buff' });
  expect(ids).toContainEqual({ blackboardKey: 'legacyBuff' });
  expect(
    ids.some(
      value => value && typeof value === 'object' && 'kind' in value && value.kind === 'stringNode',
    ),
  ).toBe(false);
  expect(() =>
    createActionGraphCompilation(
      {
        ...reopened.actionGraph,
        main: {
          ...reopened.actionGraph.main,
          dataNodes: {
            ...reopened.actionGraph.main.dataNodes,
            shared: { type: 'number', expression: { kind: 'constant', value: 1 } },
          },
        },
      },
      1,
    ),
  ).toThrow(/expected string/);
});
