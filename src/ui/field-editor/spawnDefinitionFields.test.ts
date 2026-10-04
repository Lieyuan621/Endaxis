import { mountSetup } from '../../test/componentSetup';
import { computed, createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import { expect, it, vi } from 'vitest';
import AssetWorkspace from '../asset-workspace/AssetWorkspace.vue';
import { i18n } from '../../i18n';
import { actionNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { spawnDefinitionResources } from './spawnDefinitionSchema';
import { graphOperandSchemas } from './graphOperandContainerSchema';
import { resolveFieldEditor } from './fieldEditorDispatch';
import { supportsStructuredValue } from './structuredValueSchema';
import { validateStructuredValue } from './structuredValue';
import { structuredFieldContextKey } from './structuredFieldContext';
import StructuredValueField from './StructuredValueField.vue';
import ActionNodeInspector from '../action-graph/ActionNodeInspector.vue';
import NodeInspectorFields from '../action-graph/NodeInspectorFields.vue';
import OwnedSpawnResourceField from './OwnedSpawnResourceField.vue';
import { arclight } from '../../data/operators/arclight.generated';
import { replaceResourceNodeAction } from '../../application/editor/actionGraphResourceEditing';
import { analyzeGraphBlackboard } from '../../application/editor/graphBlackboard';
import {
  createBlackboardFieldContext,
  resolveBlackboardKey,
} from '../../application/editor/blackboardFieldContext';
import { spawnDefinitionBlackboardContext } from '../../application/editor/spawnDefinitionFieldContext';
const field = actionNodeSchemas.spawnAbilityEntity.fields.find(
  field => field.path.at(-1) === 'definition',
)!;
const schema = field.valueSchema!;
const definition = Object.values(arclight.abilityEntityDefinitions!)[0]!;
const a = (value: unknown): any => ({
  kind: 'spawnAbilityEntity',
  parameters: { abilityEntityId: 'inline', dieWhenSourceDies: false, definition: value },
});
const options = { kind: 'spawnAbilityEntity', path: field.path };
function mount(component: unknown, initial: Record<string, unknown>) {
  return mountSetup(component, initial, app => {
    app.provide(
      structuredFieldContextKey,
      computed(() => ({
        ...options,
        ownedResources: spawnDefinitionResources(schema, options.kind, options.path),
      })),
    );
  });
}
it('admits only the generated exact spawn definition, without admitting graph numeric operands or other resources', () => {
  expect(resolveFieldEditor(field, { nodeKind: options.kind }).control).toBe('structuredValue');
  expect(supportsStructuredValue(schema)).toBe(false);
  expect(graphOperandSchemas(schema, options.kind, options.path)).toBeUndefined();
  for (const [value, kind, path] of [
    [{ ...schema, declaration: undefined }, options.kind, options.path],
    [schema, 'createGlobalBuff', options.path],
    [schema, options.kind, ['parameters.definition']],
  ] as const)
    expect(spawnDefinitionResources(value, kind, path)).toBeUndefined();
  expect(() =>
    validateStructuredValue(
      schema,
      undefined,
      {
        lifetime: { kind: 'limited', durationSeconds: { blackboardKey: 'external', fallback: 4 } },
        maxStackingCount: 2,
      },
      options,
    ),
  ).not.toThrow();
  expect(() =>
    validateStructuredValue(
      schema,
      undefined,
      { lifetime: { kind: 'limited', durationSeconds: { kind: 'valueNode', nodeId: 'fake' } } },
      options,
    ),
  ).toThrow();
});
it('preserves all three entire resource slots, even unconnected and empty collections, and ordinary unknown extensions', () => {
  const child = definition.childSkill;
  for (const resources of [
    { childSkill: child },
    { childSkills: { a: child } },
    { passiveSkills: [] },
  ]) {
    const before = { lifetime: { kind: 'infinite' }, extension: { note: 'keep' }, ...resources };
    expect(() =>
      validateStructuredValue(schema, before, { ...before, deathReleaseDelaySeconds: 1 }, options),
    ).not.toThrow();
    const key = Object.keys(resources)[0]!;
    for (const replacement of [undefined, {}, [], structuredClone((resources as any)[key])])
      expect(() =>
        validateStructuredValue(schema, before, { ...before, [key]: replacement }, options),
      ).toThrow();
    expect(() => validateStructuredValue(schema, before, undefined, options)).toThrow();
  }
  expect(() =>
    validateStructuredValue(schema, { lifetime: { kind: 'infinite' } }, definition, options),
  ).toThrow();
});
it('uses direct snapshot evidence, excludes entity-only values, and gives explicit string overrides precedence', () => {
  const graph: any = {
    nodes: {
      scope: {
        action: {
          kind: 'withActionBlackboardScope',
          parameters: {
            scopeKey: 'local',
            shareParentBlackboard: false,
            inheritParent: false,
            initialValues: { direct: 2 },
            entityInitialValues: { entity: 9, direct: 'shadow' },
          },
          body: { $sequence: 'spawn' },
        },
        next: null,
      },
      spawn: { action: a({ lifetime: { kind: 'infinite' } }), next: null },
    },
  };
  const analysis = analyzeGraphBlackboard(graph, ['scope']);
  const context = createBlackboardFieldContext(analysis, analysis.contexts.get('spawn'));
  const result = spawnDefinitionBlackboardContext(context, {
    ...a(definition),
    parameters: {
      ...a(definition).parameters,
      inheritActionBlackboard: true,
      stringBlackboardAssignments: { direct: 'last' },
    },
  });
  expect(result.candidates.map(candidate => candidate.key)).toEqual(['direct']);
  expect(result.candidates[0]!.valueType).toBe('string');
  expect(
    resolveBlackboardKey(result, 'direct', { mode: 'read', valueType: 'number', fallback: 3 })
      .state,
  ).toBe('fallback');
  expect(result.parameters).toEqual([]);
});
it('retains atomic outer drafts on error, supports repair/no-op/cancel and rejects forged resource edits', async () => {
  const changes: unknown[] = [];
  const host = await mount(StructuredValueField, {
    schema,
    value: definition,
    actionValue: a(definition),
    editable: true,
    label: 'definition',
    ...options,
    onChange: (value: unknown) => changes.push(value),
  });
  host.state.begin();
  await host.state.stage();
  expect(changes).toEqual([]);
  expect(host.state.editing.value).toBe(false);
  host.state.begin();
  host.state.change(['childSkill'], { ...definition.childSkill });
  await host.state.stage();
  expect(changes).toEqual([]);
  expect(host.state.error.value).toBe('spawnDefinitionField.resourceReadonly');
  host.state.discard();
  host.state.begin();
  host.state.change(['deathReleaseDelaySeconds'], 0.5);
  await host.state.stage();
  expect(changes).toHaveLength(1);
  expect(host.state.error.value).toBe('structuredValue.rejected');
  await host.update({ value: changes[0] });
  expect(host.state.editing.value).toBe(false);
  host.state.begin();
  host.state.change(['deathReleaseDelaySeconds'], 0.7);
  host.state.discard();
  expect(changes).toHaveLength(1);
  await host.update({ editable: false });
  host.state.begin();
  host.state.change(['deathReleaseDelaySeconds'], 9);
  await host.state.stage();
  expect(changes).toHaveLength(1);
  host.stop();
});
it('keeps the generated mixed field visible readonly, with resource identity and an explicit unavailable-host reason', async () => {
  i18n.global.locale.value = 'en';
  const action = a(definition);
  const app = createSSRApp(ActionNodeInspector, {
    nodeId: 'spawn',
    node: { action, next: null },
    graph: { nodes: { spawn: { action, next: null } } },
    readonly: true,
    applyAction: () => false,
  });
  app
    .use(i18n)
    .provide(ID_INJECTION_KEY, { prefix: 1, current: 0 })
    .provide(ZINDEX_INJECTION_KEY, { current: 0 });
  const html = await renderToString(app);
  expect(html).toContain('data-structured-value');
  expect(html).toContain('data-owned-spawn-resource');
  expect(html).toContain(definition.childSkill!.skillId);
  expect(html).toContain('This host cannot open');
  expect(html).not.toContain('<textarea');
  for (const [slot, value] of [
    ['childSkills', {}],
    ['passiveSkills', []],
  ] as const) {
    const empty = createSSRApp(OwnedSpawnResourceField, { slot, value, path: [], label: slot }).use(
      i18n,
    );
    expect(await renderToString(empty)).toContain('No owned resource');
  }
});
it('whole-node validation rejects invalid template values while preserving staged siblings and owned graphs', async () => {
  let owner: any = {
    actionGraph: { main: { nodes: { spawn: { action: a(definition), next: null } } }, macros: {} },
  };
  let commits = 0;
  const host = await mount(NodeInspectorFields, {
    value: owner.actionGraph.main.nodes.spawn.action,
    kind: 'spawnAbilityEntity',
    fields: actionNodeSchemas.spawnAbilityEntity.fields,
    graph: owner.actionGraph.main,
    readonly: false,
    applyValue: (value: unknown) => {
      owner = replaceResourceNodeAction(owner, { kind: 'main' }, 'spawn', value);
      commits++;
      return true;
    },
  });
  host.state.typedDrafts.value = {
    'parameters.definition': { ...definition, deathReleaseDelaySeconds: 300 },
  };
  host.state.pending.value = true;
  expect(host.state.apply()).toBe(false);
  expect(commits).toBe(0);
  expect(host.state.typedDrafts.value['parameters.definition'].deathReleaseDelaySeconds).toBe(300);
  host.state.typedDrafts.value = {
    'parameters.definition': { ...definition, deathReleaseDelaySeconds: 1 },
  };
  expect(host.state.apply()).toBe(true);
  expect(commits).toBe(1);
  expect(owner.actionGraph.main.nodes.spawn.action.parameters.definition.childSkill).toBe(
    definition.childSkill,
  );
  host.stop();
});

it('discovery errors keep graph mode recovery available even with a missing pending inspector', async () => {
  vi.stubGlobal('window', { addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal('PointerEvent', class {});
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  let closed = 0;
  const host = await mount(AssetWorkspace, {
    assets: [
      {
        id: 'operator:arclight',
        kind: 'operator',
        kindName: 'operator',
        name: 'Arclight',
        custom: true,
        edit: { kind: 'operator', definition: arclight },
      },
    ],
    initialAsset: 'operator:arclight',
    saveAsset: () => {},
    onClose: () => closed++,
  });
  const session = host.state.active.value.session;
  const before = session.current;
  host.state.active.value.asset = JSON.stringify(['dodgeSkill']);
  host.state.graphOpen.value = true;
  host.state.focused.value = true;
  host.state.layout.value.rightOpen = false;
  session.history.update((draft: any) => ({
    ...draft,
    edit: {
      ...draft.edit,
      definition: {
        ...draft.edit.definition,
        dodgeSkill: {
          ...draft.edit.definition.dodgeSkill,
          actionGraph: {
            main: { nodes: {} },
            macros: Object.fromEntries(
              Array.from({ length: 16_385 }, (_, i) => [
                String(i),
                { parameters: [], entry: { $sequence: null }, graph: { nodes: {} } },
              ]),
            ),
          },
        },
      },
    },
  }));
  host.state.revision.value++;
  expect(host.state.resourceDiscovery.value.error).toMatch(/budget/);
  expect(host.state.graphOwner.value).toBeUndefined();
  expect(host.state.canLeaveGraphFields()).toBe(true);
  host.state.undo(-1);
  expect(session.current).toBe(before);
  expect(host.state.resourceDiscovery.value.error).toBe('');
  await host.state.requestClose();
  expect(closed).toBe(1);
  host.stop();
});
