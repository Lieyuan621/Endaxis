import { describe, expect, it } from 'vitest';
import {
  createRenderer,
  h,
  nextTick,
  shallowRef,
  computed,
  ssrContextKey,
  type ComponentOptions,
} from 'vue';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import { i18n } from '../../i18n';
import { definitionSchemas } from '../definition-editor/definitionSchemas.generated';
import type {
  DefinitionFieldSchema,
  DefinitionSchemaReferences,
} from '../definition-editor/fieldSchema';
import { resolveDefinitionSchema } from '../../core/editor/resolveDefinitionSchema';
import {
  assertEditableValue,
  assertEditableDefinitionField,
  isCompleteDefinitionValue,
} from '../definition-editor/definitionFieldRuntime';
import { isInlineCombatCondition } from '../../core/editor/inlineCombatCondition';
import { inlineConditionBlackboardContext } from '../../application/editor/inlineConditionContext';
import { resolveBlackboardKey } from '../../application/editor/blackboardFieldContext';
import { definitionConditionContextKey, inlineConditionDraftKey } from './inlineConditionContext';
import InlineCombatConditionField from './InlineCombatConditionField.vue';
import DefinitionField from '../definition-editor/DefinitionField.vue';
import DefinitionValueCreator from '../definition-editor/DefinitionValueCreator.vue';
import BlackboardMappingValueField from './BlackboardMappingValueField.vue';
import { actionNodeSchemas, dataNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { resolveFieldEditor } from './fieldEditorDispatch';

function object(schema: DefinitionFieldSchema, refs: DefinitionSchemaReferences) {
  const resolved = resolveDefinitionSchema(schema, refs);
  if (resolved.kind !== 'object') throw new Error('expected object');
  return resolved.fields;
}
function variants(schema: DefinitionFieldSchema, refs: DefinitionSchemaReferences) {
  const resolved = resolveDefinitionSchema(schema, refs);
  if (resolved.kind !== 'union') throw new Error('expected union');
  return resolved.variants;
}
function element(schema: DefinitionFieldSchema, refs: DefinitionSchemaReferences) {
  const resolved = resolveDefinitionSchema(schema, refs);
  if (resolved.kind !== 'array') throw new Error('expected array');
  return resolved.element;
}
const fixtures: { name: string; schema: DefinitionFieldSchema }[] = [
  'gearSet',
  'weaponTrait',
].flatMap(root => {
  const schema = definitionSchemas[root as 'gearSet' | 'weaponTrait'] as DefinitionFieldSchema;
  const refs = schema.references ?? {};
  return variants(element(object(schema, refs).eventHandlers!, refs), refs).map(
    (branch, index) => ({
      name: `${root}/${index}`,
      schema: { ...object(branch, refs).condition!, optional: false, references: refs },
    }),
  );
});
const skills = definitionSchemas.skill as DefinitionFieldSchema;
const skillRefs = skills.references ?? {};
fixtures.push(
  ...variants(skills, skillRefs).map((branch, index) => ({
    name: `skill/${index}`,
    schema: {
      ...object(object(branch, skillRefs).switchToBuffCast!, skillRefs).condition!,
      optional: false,
      references: skillRefs,
    },
  })),
);
const upgrade = definitionSchemas.operatorUpgrade as DefinitionFieldSchema;
const upgradeRefs = upgrade.references ?? {};
fixtures.push({
  name: 'upgrade',
  schema: {
    ...object(
      variants(element(object(upgrade, upgradeRefs).modifiers!, upgradeRefs), upgradeRefs)[0]!,
      upgradeRefs,
    ).condition!,
    references: upgradeRefs,
  },
});
const inline = fixtures[0]!.schema;
const condition = {
  kind: 'actionValueCompare',
  left: { kind: 'blackboard', key: 'rate' },
  operator: 'greater',
  right: { kind: 'constant', value: 1 },
};

async function mount(component: unknown, initial: Record<string, unknown>, draft?: unknown) {
  const props = shallowRef(initial);
  let state: any;
  const implementation = component as ComponentOptions;
  const renderer = createRenderer<object, object>({
    insert() {},
    remove() {},
    patchProp() {},
    setText() {},
    setElementText() {},
    createElement: () => ({}),
    createText: () => ({}),
    createComment: () => ({}),
    parentNode: () => null,
    nextSibling: () => null,
  });
  const stub = {
    ...implementation,
    setup(p: any, context: any) {
      state = implementation.setup!(p, context);
      return state;
    },
    render: () => null,
  };
  const app = renderer.createApp({ render: () => h(stub, props.value) });
  app.use(i18n).provide(ssrContextKey, { modules: new Set() });
  app.provide(
    definitionConditionContextKey,
    computed(() => inlineConditionBlackboardContext('gearSet', { blackboard: { rate: [1, 2] } })),
  );
  if (draft)
    app.provide(
      inlineConditionDraftKey,
      computed(() => draft),
    );
  app.mount({});
  await nextTick();
  return {
    state,
    stop: () => app.unmount(),
    async update(value: Record<string, unknown>) {
      props.value = { ...props.value, ...value };
      await nextTick();
    },
  };
}

describe('generated inline definition conditions', () => {
  it.each(fixtures)(
    '$name validates creation and whole-value edits, preserving extensions and graph boundaries',
    ({ name, schema }) => {
      expect(isInlineCombatCondition(schema)).toBe(true);
      expect(resolveFieldEditor(schema).control).toBe('inlineCondition');
      const value = name === 'upgrade' ? { kind: 'targetStaggered', target: 'enemy' } : condition;
      expect(() => assertEditableValue(schema, undefined, value, 'value')).not.toThrow();
      expect(isCompleteDefinitionValue(schema, value, 'value')).toBe(true);
      const before = { ...value, extension: Object.freeze({ preserved: 1 }) };
      expect(() =>
        assertEditableValue(schema, before, { ...value, extension: before.extension }, 'value'),
      ).not.toThrow();
      const root = { kind: 'object' as const, fields: { condition: schema } };
      expect(() =>
        assertEditableDefinitionField(root, { condition: value }, ['condition'], value),
      ).not.toThrow();
      expect(() =>
        assertEditableDefinitionField(
          root,
          { condition: value },
          ['condition', 'kind'],
          'constant',
        ),
      ).toThrow(/atomically/);
      for (const invalid of [
        { kind: 'conditionNode', nodeId: 'pin' },
        { kind: 'all', conditions: [] },
        { kind: 'constant', value: 'true' },
      ])
        expect(isCompleteDefinitionValue(schema, invalid, 'value')).toBe(false);
      if (name === 'upgrade') {
        expect(
          isCompleteDefinitionValue(schema, { kind: 'targetStaggered', target: 'caster' }, 'value'),
        ).toBe(false);
        expect(isCompleteDefinitionValue(schema, { kind: 'constant', value: true }, 'value')).toBe(
          false,
        );
      } else {
        expect(
          isCompleteDefinitionValue(
            schema,
            {
              kind: 'all',
              conditions: [
                condition,
                { kind: 'not', condition: { kind: 'constant', value: false } },
              ],
            },
            'value',
          ),
        ).toBe(true);
        for (const operand of [
          { kind: 'parameter', parameter: 'macro' },
          { kind: 'valueNode', nodeId: 'number' },
        ]) {
          const old = { ...condition, left: operand };
          expect(isCompleteDefinitionValue(schema, old, 'value')).toBe(false);
          expect(() =>
            assertEditableValue(schema, old, { ...old, operator: 'equal' }, 'value'),
          ).toThrow();
        }
      }
    },
  );

  it('retains four deferred skill hosts and keeps graph, BuildCondition and Buff-local families separate', () => {
    for (const branch of variants(skills, skillRefs)) {
      const fields = object(branch, skillRefs);
      expect(fields.availability!.kind).toBe('condition');
      expect(object(element(fields.eventHandlers!, skillRefs), skillRefs).condition!.kind).toBe(
        'condition',
      );
    }
    expect(JSON.stringify(definitionSchemas.buff)).not.toContain('\"inlineCondition\"');
    const conditionField = dataNodeSchemas['boolean:not']!.fields.find(
      field => field.path.at(-1) === 'condition',
    )!;
    expect(resolveFieldEditor(conditionField).semantic).toBe('combatCondition');
    expect(conditionField.valueSchema?.inlineCondition).toBeUndefined();
    const operand = actionNodeSchemas.dealStagger.fields.find(
      field => field.path.at(-1) === 'value',
    )!.valueSchema!;
    expect(() =>
      assertEditableValue(operand, undefined, { kind: 'constant', value: 1 }, 'value'),
    ).toThrow(/graph input/);
    const branches = variants(
      element(object(upgrade, upgradeRefs).modifiers!, upgradeRefs),
      upgradeRefs,
    );
    const build = branches
      .map(branch => object(branch, upgradeRefs))
      .find(
        fields =>
          fields.kind?.kind === 'enum' && fields.kind.options.includes('patchSkillBlackboard'),
      )!.condition!;
    expect(build.inlineCondition).toBeUndefined();
    expect(object(build, upgradeRefs).kind).toMatchObject({
      kind: 'enum',
      options: ['deckAttributeCompare'],
    });
  });

  it('shows the intentional readonly reason for all four skill hosts, whether absent or populated', async () => {
    for (const branch of variants(skills, skillRefs)) {
      const fields = object(branch, skillRefs);
      for (const [name, declared, message] of [
        ['availability', fields.availability!, 'availabilityDeferred'],
        [
          'condition',
          object(element(fields.eventHandlers!, skillRefs), skillRefs).condition!,
          'legacyHandlerDeferred',
        ],
      ] as const) {
        expect(declared.fallback?.reason).toBe('condition-editor-pending');
        expect(declared.inlineCondition).toBeUndefined();
        for (const value of [undefined, { kind: 'constant', value: true }]) {
          const html = await renderToString(
            createSSRApp({
              render: () =>
                h(DefinitionField, {
                  name,
                  schema: { ...declared, references: skillRefs },
                  value,
                  path: [name],
                  root: true,
                  editable: true,
                }),
            })
              .use(i18n)
              .provide(ID_INJECTION_KEY, { prefix: 1, current: 0 })
              .provide(ZINDEX_INJECTION_KEY, { current: 0 }),
          );
          expect(html).toContain(i18n.global.t(`inlineCondition.${message}`));
          expect(html).toContain('role="status"');
          expect(html).toContain('disabled');
          expect(html).not.toContain('data-inline-condition');
          expect(html).not.toContain('textarea');
          expect(html).not.toContain('type="number"');
        }
      }
    }
  });

  it('isolates actual host initial boards from graph writers/macros and leaves unknown injection explicit', () => {
    const context = inlineConditionBlackboardContext('skill', {
      blackboard: { rate: [1, 2] },
      actionGraph: {
        main: {
          nodes: {
            writer: {
              action: { kind: 'modifyActionValue', parameters: { key: 'later', value: 2 } },
            },
          },
        },
        macros: { macro: { parameters: ['argument'] } },
      },
    });
    expect(context.parameters).toEqual([]);
    expect(context.candidates.map(candidate => candidate.key)).toEqual(['rate']);
    expect(
      resolveBlackboardKey(context, 'external', { mode: 'read', valueType: 'number' }),
    ).toMatchObject({ state: 'external', valid: true });
    expect(
      inlineConditionBlackboardContext('operatorUpgrade', { blackboard: { wrong: 1 } }).status,
    ).toBe('unknown');
  });

  it('stages repeated edits atomically, retains rejected proposals, and resets cancel/readonly', async () => {
    const changes: unknown[] = [];
    const host = await mount(InlineCombatConditionField, {
      schema: inline,
      value: condition,
      editable: true,
      label: 'Condition',
      onChange: (value: unknown) => changes.push(value),
    });
    try {
      host.state.begin();
      host.state.change(['right'], { kind: 'constant', value: 2 });
      host.state.change(['right'], { kind: 'constant', value: 3 });
      expect(changes).toEqual([]);
      const first = host.state.stage();
      const duplicate = host.state.stage();
      await Promise.all([first, duplicate]);
      expect(changes).toHaveLength(1);
      expect(host.state.error.value).toBe('structuredValue.rejected');
      host.state.change(['right'], { kind: 'constant', value: NaN });
      await host.state.stage();
      expect(changes).toHaveLength(1);
      expect(host.state.error.value).not.toBe('');
      host.state.discard();
      host.state.begin();
      expect(host.state.draft.value).toBe(condition);
      host.state.change(['right'], { kind: 'constant', value: 4 });
      await host.update({ editable: false });
      await host.state.stage();
      expect(changes).toHaveLength(1);
      expect(host.state.editing.value).toBe(false);
    } finally {
      host.stop();
    }
  });

  it.each(fixtures)(
    '$name renders readonly typed conditions without a JSON or nodeId text editor',
    async ({ name, schema }) => {
      const value = name === 'upgrade' ? { kind: 'targetStaggered', target: 'enemy' } : condition;
      const html = await renderToString(
        createSSRApp({
          render: () =>
            h(DefinitionField, {
              name: 'condition',
              schema,
              value,
              path: ['condition'],
              root: true,
              editable: false,
            }),
        })
          .use(i18n)
          .provide(ID_INJECTION_KEY, { prefix: 1, current: 0 })
          .provide(ZINDEX_INJECTION_KEY, { current: 0 }),
      );
      expect(html).toContain('data-inline-condition');
      expect(html).not.toContain('textarea');
      expect(html).not.toContain('nodeId');
      if (name !== 'upgrade') expect(html).toContain('data-mapping-value="operand"');
    },
  );
});

it.each(fixtures)(
  '$name creates only valid condition values through the actual creator',
  async ({ name, schema }) => {
    const created: unknown[] = [];
    const creator = await mount(DefinitionValueCreator, {
      schema,
      editable: true,
      onCreate: (value: unknown) => created.push(value),
    });
    try {
      const kind = name === 'upgrade' ? 'targetStaggered' : 'actionValueCompare';
      const index = creator.state.variants.value.findIndex(
        (variant: DefinitionFieldSchema) =>
          object(variant, schema.references ?? {}).kind?.kind === 'enum' &&
          (object(variant, schema.references ?? {}).kind as any).options.includes(kind),
      );
      creator.state.choose(index);
      const value = name === 'upgrade' ? { kind, target: 'enemy' } : condition;
      creator.state.change([], value);
      expect(creator.state.complete.value).toBe(true);
      creator.state.create();
      expect(created).toEqual([value]);
      creator.state.change([], {
        ...value,
        ...(name === 'upgrade'
          ? { target: 'caster' }
          : { right: { kind: 'constant', value: NaN } }),
      });
      expect(creator.state.complete.value).toBe(false);
      creator.state.create();
      expect(created).toHaveLength(1);
      await creator.update({ editable: false });
      creator.state.change([], value);
      creator.state.create();
      expect(created).toHaveLength(1);
    } finally {
      creator.stop();
    }
  },
);

it('branch creators resolve external Buff read keys from their own new local draft', async () => {
  const refs = inline.references ?? {};
  const branch = variants(inline, refs).find(variant => {
    const kind = object(variant, refs).kind;
    return kind?.kind === 'enum' && kind.options.includes('buffBlackboardValueCompare');
  })!;
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(DefinitionValueCreator, {
          schema: { ...branch, references: refs },
          editable: true,
          editingContext: 'value',
        }),
    })
      .use(i18n)
      .provide(
        inlineConditionDraftKey,
        computed(() => ({ kind: 'constant', value: true })),
      )
      .provide(ID_INJECTION_KEY, { prefix: 1, current: 0 })
      .provide(ZINDEX_INJECTION_KEY, { current: 0 }),
  );
  expect(html).toContain('data-blackboard-mode="read"');
  expect(html).toContain('data-blackboard-mode="write"');
});

it('readonly numeric leaf controls reject forged events and never offer macro parameters', async () => {
  const changes: unknown[] = [];
  const field = await mount(BlackboardMappingValueField, {
    value: { kind: 'constant', value: 1 },
    mode: 'operand',
    label: 'value',
    readonly: true,
    allowsParameters: false,
    onChange: (value: unknown) => changes.push(value),
  });
  try {
    field.state.switchBranch('blackboard');
    field.state.updateOperand('value', 2);
    field.state.change({ kind: 'constant', value: 3 });
    expect(changes).toEqual([]);
    expect(field.state.options.value.some((option: any) => option.value === 'parameter')).toBe(
      false,
    );
  } finally {
    field.stop();
  }
});

it.each(fixtures)(
  '$name changes a real resource through WorkspaceAssetSession history and project roundtrip',
  async ({ name }) => {
    const { WorkspaceAssetSession } = await import('../asset-workspace/workspaceSession');
    const { fieldValueAt } = await import('../definition-editor/definitionFieldRuntime');
    const { saveProjectTemplateDefinition } =
      await import('../../application/editor/projectTemplateCommands');
    const { createEmptyProject } = await import('../../core/project/createProject');
    const { perlica } = await import('../../data/operators/perlica.generated');
    const { generatedWeaponDefinitions } =
      await import('../../data/equipment/generated-weapons/index.generated');
    const { default: gearSet } =
      await import('../../data/equipment/generated-gear-sets/suit_phy01.generated');
    const { EQUIPMENT_ABILITY_EVENTS } =
      await import('../../../packages/game-data-contract/src/equipment');
    const handler = {
      key: 'condition-test',
      ...(name.endsWith('/0')
        ? { event: { kind: 'operatorHit' } }
        : { abilityEvent: EQUIPMENT_ABILITY_EVENTS[0] }),
      sequence: { $sequence: null },
    };
    let kind: 'gearSet' | 'weapon' | 'operator';
    let definition: any;
    let path: (string | number)[];
    if (name.startsWith('gearSet')) {
      kind = 'gearSet';
      definition = {
        ...structuredClone(gearSet),
        eventHandlers: [handler],
        blackboard: { rate: 2 },
      };
      path = ['eventHandlers', 0, 'condition'];
    } else if (name.startsWith('weaponTrait')) {
      kind = 'weapon';
      definition = structuredClone(generatedWeaponDefinitions[0]);
      definition.traits[0].eventHandlers = [handler];
      definition.traits[0].blackboard = { ...definition.traits[0].blackboard, rate: 2 };
      definition.traits[0].actionGraph ??= { main: { nodes: {} }, macros: {} };
      path = ['traits', 0, 'eventHandlers', 0, 'condition'];
    } else {
      kind = 'operator';
      definition = structuredClone(perlica);
      if (name === 'upgrade') {
        definition.talents[0].modifiers = [{ kind: 'addConditionalDamage', values: 1 }];
        path = ['talents', 0, 'modifiers', 0, 'condition'];
      } else {
        const skill = name.endsWith('/1')
          ? definition.dodgeSkill
          : definition.skillGroups[0].skills[0];
        skill.blackboard = { ...skill.blackboard, rate: 2 };
        skill.switchToBuffCast = { asSkillCast: true, sequence: { $sequence: null } };
        path = name.endsWith('/1')
          ? ['dodgeSkill', 'switchToBuffCast', 'condition']
          : ['skillGroups', 0, 'skills', 0, 'switchToBuffCast', 'condition'];
      }
    }
    const source = {
      id: `${kind}:condition`,
      kind,
      kindName: kind,
      name,
      custom: false,
      edit: { kind, definition },
    } as import('../asset-workspace/workspaceSession').WorkspaceAssetSource;
    const next =
      name === 'upgrade'
        ? { kind: 'targetStaggered', target: 'enemy' }
        : { kind: 'all', conditions: [condition, { kind: 'constant', value: true }] };
    const readonly = new WorkspaceAssetSession(source);
    expect(() => readonly.change(path, next)).toThrow(/read-only/);
    const session = new WorkspaceAssetSession(
      source,
      `project:${kind}:condition-${name.replace('/', '-')}`,
    );
    const before = session.current;
    const graphPath = name.startsWith('gearSet')
      ? ['actionGraph']
      : name.startsWith('weaponTrait')
        ? ['traits', 0, 'actionGraph']
        : name === 'upgrade'
          ? ['talents', 0, 'actionGraph']
          : [...path.slice(0, -2), 'actionGraph'];
    const graphBefore = fieldValueAt(before.edit.definition, graphPath);
    session.change(path, next);
    const changed = session.current;
    expect(fieldValueAt(changed.edit.definition, path)).toEqual(next);
    expect(fieldValueAt(changed.edit.definition, graphPath)).toBe(graphBefore);
    expect(() => session.change([...path, 'kind'], 'constant')).toThrow(/atomically/);
    expect(() => session.change(path, { kind: 'conditionNode', nodeId: 'pin' })).toThrow();
    expect(session.current).toBe(changed);
    if (name.startsWith('skill')) {
      expect(() => session.change(path, undefined)).toThrow(/requires condition/);
      expect(session.current).toBe(changed);
    }
    expect(session.history.undo()).toBe(true);
    expect(session.current).toBe(before);
    expect(session.history.redo()).toBe(true);
    expect(session.current).toBe(changed);
    const request = session.saveRequest();
    const saved = saveProjectTemplateDefinition(
      createEmptyProject({ createdWith: 'test' }),
      request.draft.edit,
      request.sourceId,
      request.targetId,
      request.draft.name,
      request.replace,
      request.draft.graphPresentations,
    );
    const { serializeProjectDocument, parseProjectDocument } =
      await import('../../core/project/serialization');
    const parsed = parseProjectDocument(serializeProjectDocument(saved));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('project roundtrip failed');
    const serialized = parsed.value as any;
    const directory =
      kind === 'operator' ? 'operators' : kind === 'weapon' ? 'weapons' : 'gearSets';
    expect(
      fieldValueAt(serialized.definitionLibrary[directory][request.targetId].definition, path),
    ).toEqual(next);
    expect(
      fieldValueAt(serialized.definitionLibrary[directory][request.targetId].definition, graphPath),
    ).toEqual(graphBefore);
    expect(fieldValueAt(definition, path)).toBeUndefined();
  },
);

it('rechecks current reference choices and tag syntax before committing an inline tree', async () => {
  const { referenceCatalog } = await import('./referenceTestFixtures');
  const changes: unknown[] = [];
  const host = await mount(InlineCombatConditionField, {
    schema: inline,
    value: { kind: 'constant', value: true },
    editable: true,
    label: 'Condition',
    referenceChoices: { buff: referenceCatalog() },
    onChange: (value: unknown) => changes.push(value),
  });
  try {
    host.state.begin();
    host.state.change([], {
      kind: 'buffIdStackCompare',
      target: 'caster',
      buffIds: ['known'],
      operator: 'equal',
      value: 1,
    });
    await host.update({ referenceChoices: { buff: referenceCatalog('buff', []) } });
    await host.state.stage();
    expect(changes).toEqual([]);
    expect(host.state.error.value).toBe('fieldReference.invalid');
    host.state.change([], {
      kind: 'entityTagMatch',
      target: 'caster',
      tagQueryType: 'any',
      tags: ['Custom//Bad'],
    });
    await host.state.stage();
    expect(changes).toEqual([]);
    expect(host.state.error.value).not.toBe('');
    host.state.discard();
  } finally {
    host.stop();
  }
});

it('keeps the wrapper schema identity stable across catalog refresh and preserves the child draft', async () => {
  const { referenceCatalog } = await import('./referenceTestFixtures');
  const parent = await mount(DefinitionField, {
    name: 'condition',
    schema: inline,
    value: condition,
    path: ['condition'],
    root: true,
    editable: true,
    referenceChoices: { buff: referenceCatalog() },
  });
  const schema = parent.state.inlineSchema.value;
  const child = await mount(InlineCombatConditionField, {
    schema,
    value: condition,
    label: 'condition',
    editable: true,
  });
  try {
    child.state.begin();
    child.state.change(['right'], { kind: 'constant', value: 8 });
    await parent.update({ referenceChoices: { buff: referenceCatalog('buff', []) } });
    expect(parent.state.inlineSchema.value).toBe(schema);
    await child.update({
      schema: parent.state.inlineSchema.value,
      referenceChoices: { buff: referenceCatalog('buff', []) },
    });
    expect(child.state.editing.value).toBe(true);
    expect(child.state.draft.value.right.value).toBe(8);
  } finally {
    child.stop();
    parent.stop();
  }
});

it('shows a readonly error for unbound imported condition values without editable node IDs', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(DefinitionField, {
          name: 'condition',
          schema: inline,
          value: { ...condition, left: { kind: 'parameter', parameter: 'unbound' } },
          path: ['condition'],
          root: true,
          editable: false,
        }),
    })
      .use(i18n)
      .provide(ID_INJECTION_KEY, { prefix: 1, current: 0 })
      .provide(ZINDEX_INJECTION_KEY, { current: 0 }),
  );
  expect(html).toContain('role="alert"');
  expect(html).not.toContain('textarea');
  expect(html).not.toContain('nodeId');
});

it('resolves generated recursive conditions deeply and rejects over-budget trees', () => {
  let value: unknown = condition;
  for (let index = 0; index < 24; index++) value = { kind: 'not', condition: value };
  expect(isCompleteDefinitionValue(inline, value, 'value')).toBe(true);
  for (let index = 0; index < 200; index++) value = { kind: 'not', condition: value };
  expect(() => assertEditableValue(inline, undefined, value, 'value')).toThrow(/budget/);
});

it('standalone definition conditions cannot introduce string graph references, including nested markers', () => {
  const marker = { kind: 'timedMarkerPresent', target: 'caster', markerId: 'exact marker' };
  expect(isCompleteDefinitionValue(inline, marker, 'value')).toBe(true);
  expect(
    isCompleteDefinitionValue(
      inline,
      { ...marker, markerId: { blackboardKey: 'marker' } },
      'value',
    ),
  ).toBe(true);
  for (const next of [
    { ...marker, markerId: { kind: 'stringNode', nodeId: 'shared' } },
    { kind: 'not', condition: { ...marker, markerId: { kind: 'stringNode', nodeId: 'shared' } } },
  ]) {
    expect(isCompleteDefinitionValue(inline, next, 'value')).toBe(false);
    expect(() => assertEditableValue(inline, marker, next, 'value')).toThrow();
  }
});
