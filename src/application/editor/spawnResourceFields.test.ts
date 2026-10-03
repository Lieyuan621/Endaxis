import { expect, it } from 'vitest';
import { arclight } from '../../data/operators/arclight.generated';
import {
  listDefinitionResources,
  resourcePresentationKey,
  isInlineSpawnResourcePath,
} from '../../ui/definition-editor/definitionResources';
import { fieldValueAt } from '../../ui/definition-editor/definitionFieldRuntime';
import {
  describeWorkspaceResources,
  workspaceActionReferences,
} from '../../ui/asset-workspace/workspaceResources';
import { workspaceReferenceChoices } from '../../ui/asset-workspace/workspaceReferenceChoices';
import {
  WorkspaceAssetSession,
  type WorkspaceAssetSource,
} from '../../ui/asset-workspace/workspaceSession';
import { ownedActionResourceLink } from '../../ui/asset-workspace/ownedActionResourceNavigation';
import {
  replaceResourceNodeAction,
  type ActionGraphResourceOwner,
} from './actionGraphResourceEditing';
import { actionNodeSchemas } from '../../ui/action-graph/actionNodeSchemas.generated';
import { validateStructuredValue } from '../../ui/field-editor/structuredValue';
import { saveProjectTemplateDefinition } from './projectTemplateCommands';
import { createEmptyProject } from '../../core/project/createProject';
import { parseProjectDocument, serializeProjectDocument } from '../../core/project/serialization';
import { AbilityEntityOperationExecutor } from '../../core/combat/abilities/abilityEntityOperationExecutor';
import { LogicalAbilityEntityRuntime } from '../../core/combat/abilities/logicalAbilityEntityRuntime';
import { ActionBlackboard } from '../../core/combat/actions/actionBlackboard';
import { spawnDefinitionBlackboardContext } from './spawnDefinitionFieldContext';
import { resolveBlackboardKey } from './blackboardFieldContext';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
const entity = Object.values(arclight.abilityEntityDefinitions!)[0]!;
const child = entity.childSkill!;
const passive = {
  key: 'same',
  actionGraph: { main: { nodes: {} }, macros: {} },
  enableSequence: { $sequence: null },
} as const;
const field = actionNodeSchemas.spawnAbilityEntity.fields.find(
  field => field.path.at(-1) === 'definition',
)!;
const action = (definition: unknown): any => ({
  kind: 'spawnAbilityEntity',
  parameters: { abilityEntityId: 'inline', dieWhenSourceDies: false, definition },
});
function fixture() {
  const graph: ActionGraphDefinition = {
    nodes: {
      spawn: { action: action(entity), next: null },
      named: {
        action: action({
          lifetime: { kind: 'infinite' },
          childSkills: { [child.skillId]: child },
          passiveSkills: [passive],
        }),
        next: null,
      },
    },
  };
  const owner = {
    ...arclight.dodgeSkill!,
    scheduledSequences: [{ startFrame: 0, sequence: { $sequence: 'spawn' } }],
    actionGraph: {
      main: graph,
      macros: { repeated: { parameters: [], entry: { $sequence: 'spawn' }, graph } },
    },
  };
  const source: WorkspaceAssetSource = {
    id: 'operator:arclight',
    kind: 'operator',
    kindName: 'operator',
    name: 'Arclight',
    custom: false,
    edit: { kind: 'operator', definition: { ...arclight, dodgeSkill: owner } },
  };
  return { source, graph, owner };
}
it('discovers singular, named and passive owners in main/macros without dropping shared values or registering inline IDs', () => {
  const { source } = fixture();
  const resources = describeWorkspaceResources(source.edit, resource => resource.identity);
  const inline = resources.filter(resource =>
    isInlineSpawnResourcePath(resource.definitionResource.path),
  );
  expect(inline).toHaveLength(6);
  expect(
    inline.filter(
      resource => fieldValueAt(source.edit.definition, resource.definitionResource.path) === child,
    ),
  ).toHaveLength(4);
  expect(new Set(inline.map(resource => resource.id)).size).toBe(6);
  const choices = workspaceReferenceChoices(source, [source], []);
  expect(choices.abilityEntity!.candidates.some(candidate => candidate.value === 'inline')).toBe(
    false,
  );
  expect(choices.skill!.candidates.some(candidate => candidate.value === child.skillId)).toBe(
    false,
  );
  const references = workspaceActionReferences(source.edit.definition, resources);
  expect(references.some(reference => inline.some(resource => resource.id === reference.to))).toBe(
    false,
  );
  expect(isInlineSpawnResourcePath(['buffDefinitions', 'actionGraph'])).toBe(false);
  expect(
    resourcePresentationKey({ buffDefinitions: { actionGraph: {} } }, [
      'buffDefinitions',
      'actionGraph',
    ]),
  ).toBe('buffDefinitions/actionGraph');
});
it('discovers nested spawns and rejects cycles, excessive depth, nodes and empty macro graphs finitely', () => {
  const { source } = fixture();
  const inner = {
    ...child,
    actionGraph: {
      main: {
        nodes: {
          nested: {
            action: action({ lifetime: { kind: 'infinite' }, childSkill: child }),
            next: null,
          },
        },
      },
      macros: {},
    },
  };
  const root: any = {
    ...source.edit.definition,
    dodgeSkill: {
      ...arclight.dodgeSkill,
      actionGraph: {
        main: {
          nodes: {
            spawn: {
              action: action({ lifetime: { kind: 'infinite' }, childSkill: inner }),
              next: null,
            },
          },
        },
        macros: {},
      },
    },
  };
  expect(
    listDefinitionResources('operator', root).filter(resource =>
      isInlineSpawnResourcePath(resource.path),
    ),
  ).toHaveLength(2);
  inner.actionGraph.main.nodes.nested!.action.parameters.definition.childSkill = inner;
  expect(() => listDefinitionResources('operator', root)).toThrow(/cyclic/);
  let deep: any = child;
  for (let index = 0; index < 65; index++)
    deep = {
      ...child,
      actionGraph: {
        main: {
          nodes: {
            spawn: {
              action: action({ lifetime: { kind: 'infinite' }, childSkill: deep }),
              next: null,
            },
          },
        },
        macros: {},
      },
    };
  root.dodgeSkill = deep;
  expect(() => listDefinitionResources('operator', root)).toThrow(/depth/);
  root.dodgeSkill = {
    ...child,
    actionGraph: {
      main: { nodes: {} },
      macros: Object.fromEntries(
        Array.from({ length: 16_385 }, (_, i) => [
          String(i),
          { parameters: [], entry: { $sequence: null }, graph: { nodes: {} } },
        ]),
      ),
    },
  };
  expect(() => listDefinitionResources('operator', root)).toThrow(/budget/);
  root.dodgeSkill.actionGraph = {
    main: {
      nodes: Object.fromEntries(
        Array.from({ length: 16_385 }, (_, i) => [
          String(i),
          { action: { kind: 'finishTimeline', parameters: {} }, next: null },
        ]),
      ),
    },
    macros: {},
  };
  expect(() => listDefinitionResources('operator', root)).toThrow(/budget/);
});
it('keeps arbitrary slash-containing node/macro paths distinct for inline layout storage', () => {
  const paths = [
    [
      'dodgeSkill',
      'actionGraph',
      'main',
      'nodes',
      'a/b',
      'action',
      'parameters',
      'definition',
      'childSkill',
    ],
    [
      'dodgeSkill',
      'actionGraph',
      'main',
      'nodes',
      'a',
      'b',
      'action',
      'parameters',
      'definition',
      'childSkill',
    ],
    [
      'dodgeSkill',
      'actionGraph',
      'macros',
      'main/nodes',
      'graph',
      'nodes',
      'a/b',
      'action',
      'parameters',
      'definition',
      'childSkill',
    ],
  ];
  expect(new Set(paths.map(path => resourcePresentationKey({}, path))).size).toBe(3);
});
it.each(['main', 'macro'] as const)(
  '%s navigates the exact field owner, edits its independent graph in the same history, and officially roundtrips',
  kind => {
    const { source } = fixture();
    const session = new WorkspaceAssetSession(source, 'project:operator:inline');
    const address =
      kind === 'main' ? ({ kind } as const) : ({ kind, macroId: 'repeated' } as const);
    let ownerPath: readonly (string | number)[] = ['dodgeSkill'];
    const definition = () => session.current.edit.definition;
    const graph = () => {
      const owner = fieldValueAt(definition(), ['dodgeSkill']) as ActionGraphResourceOwner;
      return kind === 'main' ? owner.actionGraph.main : owner.actionGraph.macros.repeated!.graph;
    };
    const resources = () => listDefinitionResources('operator', definition() as typeof arclight);
    const actualChild = (graph().nodes.spawn!.action as any).parameters.definition.childSkill;
    let opened: readonly (string | number)[] | undefined;
    const link = ownedActionResourceLink(
      {
        identity: () => 'asset/dodge',
        scope: () => kind,
        ownerPath: () => ownerPath,
        address: () => address,
        graph,
        definition,
        hasResource: path =>
          resources().some(resource => JSON.stringify(resource.path) === JSON.stringify(path)),
        flush: () => true,
        open: path => {
          opened = path;
          ownerPath = path;
        },
      },
      {
        nodeId: 'spawn',
        graph: graph(),
        scope: kind,
        path: ['parameters', 'definition', 'childSkill'],
        resource: actualChild,
      },
    );
    expect(link).toBeDefined();
    void link!.open();
    expect(fieldValueAt(definition(), opened!)).toBe(actualChild);
    const before = session.current;
    const otherPath = [
      'dodgeSkill',
      'actionGraph',
      ...(kind === 'main' ? ['macros', 'repeated', 'graph'] : ['main']),
      'nodes',
      'spawn',
      'action',
      'parameters',
      'definition',
      'childSkill',
    ];
    const otherChild = fieldValueAt(definition(), otherPath);
    const graphOwner = fieldValueAt(definition(), opened!) as ActionGraphResourceOwner;
    const id = Object.keys(graphOwner.actionGraph.main.nodes)[0]!;
    const originalNode = graphOwner.actionGraph.main.nodes[id]!;
    session.changeGraph(
      opened!,
      owner =>
        replaceResourceNodeAction(owner, { kind: 'main' }, id, {
          ...originalNode.action,
          key: 'edited-child',
        }),
      {
        main: { nodePositions: { [id]: { x: 20, y: 30 } }, entryPositions: {}, dataPositions: {} },
        macros: {},
      },
    );
    const changed = session.current;
    expect(
      (fieldValueAt(definition(), opened!) as ActionGraphResourceOwner).actionGraph.main.nodes[id]!
        .action.key,
    ).toBe('edited-child');
    expect(graph().nodes.spawn!.action.kind).toBe('spawnAbilityEntity');
    expect(fieldValueAt(definition(), otherPath)).toBe(otherChild);
    expect(Object.keys(changed.graphPresentations)).toEqual([
      resourcePresentationKey(definition(), opened!),
    ]);
    session.history.undo();
    expect(session.current).toBe(before);
    session.history.redo();
    expect(session.current).toBe(changed);
    ownerPath = ['dodgeSkill']; // independent outer field edit; real Back behavior is covered by the mounted interaction test
    const old = (graph().nodes.spawn!.action as any).parameters.definition;
    const next = { ...old, deathReleaseDelaySeconds: 0.25 };
    validateStructuredValue(field.valueSchema!, old, next, {
      kind: 'spawnAbilityEntity',
      path: field.path,
    });
    session.changeGraph(ownerPath, owner =>
      replaceResourceNodeAction(owner, address, 'spawn', action(next)),
    );
    expect((graph().nodes.spawn!.action as any).parameters.definition.childSkill).toBe(
      old.childSkill,
    );
    const save = session.saveRequest();
    const project = saveProjectTemplateDefinition(
      createEmptyProject({ createdWith: 'spawn-test' }),
      save.draft.edit,
      save.sourceId,
      save.targetId,
      save.draft.name,
      save.replace,
      save.draft.graphPresentations,
    );
    const parsed = parseProjectDocument(serializeProjectDocument(project));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw Error('roundtrip');
    expect(parsed.value.definitionLibrary!.operators[save.targetId]!.definition).toEqual(
      project.definitionLibrary!.operators[save.targetId]!.definition,
    );
    expect(
      fieldValueAt(parsed.value.definitionLibrary!.operators[save.targetId]!.definition, opened!),
    ).toEqual(fieldValueAt(session.current.edit.definition, opened!));
    expect(parsed.value.definitionLibrary!.operators[save.targetId]!.graphPresentations).toEqual(
      session.current.graphPresentations,
    );
    const readonly = new WorkspaceAssetSession(source);
    expect(() =>
      readonly.changeGraph(opened!, owner =>
        replaceResourceNodeAction(owner, { kind: 'main' }, id, {
          ...originalNode.action,
          key: 'no',
        }),
      ),
    ).toThrow();
  },
);
it('rejects stale field navigation after failed flush, removed owner, changed resource scope or replaced resource', async () => {
  for (const change of ['reject', 'remove', 'scope', 'replace'] as const) {
    const { source, graph } = fixture();
    let root: any = source.edit.definition,
      scope = 'main',
      opens = 0,
      rejections = 0;
    const link = ownedActionResourceLink(
      {
        identity: () => 'asset',
        scope: () => scope,
        ownerPath: () => ['dodgeSkill'],
        address: () => ({ kind: 'main' }),
        graph: () => graph,
        definition: () => root,
        hasResource: () => change !== 'remove' || root !== undefined,
        flush: () => {
          if (change === 'remove') root = undefined;
          if (change === 'scope') scope = 'macro';
          if (change === 'replace')
            root = {
              ...root,
              dodgeSkill: {
                ...root.dodgeSkill,
                actionGraph: { ...root.dodgeSkill.actionGraph, main: { nodes: {} } },
              },
            };
          return change !== 'reject';
        },
        reject: () => {
          rejections++;
        },
        open: () => {
          opens++;
        },
      },
      {
        nodeId: 'spawn',
        graph,
        scope: 'main',
        path: ['parameters', 'definition', 'childSkill'],
        resource: child,
      },
    );
    expect(link).toBeDefined();
    await link!.open();
    expect(opens).toBe(0);
    expect(rejections).toBe(1);
  }
});
it('matches real runtime assignments precedence and fallback, excluding template defaults and macro names', () => {
  const enclosing = {
    status: 'known' as const,
    scopes: [],
    candidates: [
      {
        key: 'duration',
        valueType: 'number' as const,
        snapshotValueType: 'number' as const,
        readable: true,
        writable: true,
        scope: 'current',
        source: 'initial',
      },
    ],
    parameters: [
      {
        key: 'macro',
        valueType: 'number' as const,
        readable: true,
        writable: false,
        scope: 'macro',
        source: 'parameter',
      },
    ],
  };
  for (const options of [
    {},
    { inheritActionBlackboard: true },
    {
      inheritActionBlackboard: true,
      blackboardAssignments: { duration: { kind: 'constant', value: 6 } },
    },
    {
      inheritActionBlackboard: true,
      blackboardAssignments: { duration: { kind: 'constant', value: 6 } },
      stringBlackboardAssignments: { duration: 'text' },
    },
  ]) {
    const definition = {
      blackboard: { duration: 99 },
      lifetime: { kind: 'limited', durationSeconds: { blackboardKey: 'duration', fallback: 3 } },
    } as const;
    const a: any = {
      ...action(definition),
      parameters: { ...action(definition).parameters, ...options },
    };
    const context = spawnDefinitionBlackboardContext(enclosing, a);
    expect(context.parameters).toEqual([]);
    expect(
      resolveBlackboardKey(context, 'duration', { mode: 'read', valueType: 'number', fallback: 3 })
        .valid,
    ).toBe(true);
    const runtime = new LogicalAbilityEntityRuntime({});
    const executor = new AbilityEntityOperationExecutor('operator', runtime, {
      execute: () => false,
      evaluate: () => false,
    });
    executor.execute(a, { blackboard: new ActionBlackboard({ duration: 8 }) });
    const [id] = runtime.findOwnerSpawned({ ownerId: 'operator' });
    const expected =
      'stringBlackboardAssignments' in options
        ? 3
        : 'blackboardAssignments' in options
          ? 6
          : options.inheritActionBlackboard
            ? 8
            : 3;
    expect(runtime.snapshot(id!).remainingDurationSeconds).toBe(expected);
  }
});

it('discovers array-indexed skill owners and continues through an indexed passive owner', () => {
  const { source, owner } = fixture();
  const passiveOwner = { ...passive, actionGraph: owner.actionGraph };
  const root: any = {
    ...source.edit.definition,
    skillGroups: [{ ...arclight.skillGroups[0], skills: [owner] }],
    dodgeSkill: undefined,
    passiveSkills: [passiveOwner],
  };
  const resources = listDefinitionResources('operator', root);
  expect(
    resources.some(
      r =>
        r.path.slice(0, 4).join('/') === 'skillGroups/0/skills/0' &&
        isInlineSpawnResourcePath(r.path),
    ),
  ).toBe(true);
  expect(
    resources.some(
      r => r.path[0] === 'passiveSkills' && r.path[1] === 0 && isInlineSpawnResourcePath(r.path),
    ),
  ).toBe(true);
});

it('runtime inheritance copies direct snapshot values only, even when an entity board has the same key', () => {
  for (const direct of [{}, { EntityBB_duration: 7 }] as readonly Readonly<
    Record<string, number>
  >[]) {
    const runtime = new LogicalAbilityEntityRuntime({});
    const executor = new AbilityEntityOperationExecutor('owner', runtime, {
      execute: () => false,
      evaluate: () => false,
    });
    executor.execute(
      {
        ...action({
          blackboard: { EntityBB_duration: 99 },
          lifetime: {
            kind: 'limited',
            durationSeconds: { blackboardKey: 'EntityBB_duration', fallback: 3 },
          },
        }),
        parameters: {
          ...action({
            blackboard: { EntityBB_duration: 99 },
            lifetime: {
              kind: 'limited',
              durationSeconds: { blackboardKey: 'EntityBB_duration', fallback: 3 },
            },
          }).parameters,
          inheritActionBlackboard: true,
        },
      },
      { blackboard: new ActionBlackboard(direct, new ActionBlackboard({ EntityBB_duration: 11 })) },
    );
    const [id] = runtime.findOwnerSpawned({ ownerId: 'owner' });
    expect(runtime.snapshot(id!).remainingDurationSeconds).toBe(
      'EntityBB_duration' in direct ? 7 : 3,
    );
  }
});
