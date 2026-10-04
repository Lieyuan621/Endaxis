import { createSSRApp, h } from 'vue';
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, it } from 'vitest';
import { i18n } from '../../i18n';
import DefinitionField from '../definition-editor/DefinitionField.vue';
import DataNodeInspector from '../action-graph/DataNodeInspector.vue';
import NodeInspectorFields from '../action-graph/NodeInspectorFields.vue';
import ReferenceField from './ReferenceField.vue';
import { referenceCatalog, referenceCandidate } from './referenceTestFixtures';
import { referenceNavigationKey } from './referenceNavigation';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';

function render(component: Parameters<typeof h>[0], props: Record<string, unknown>) {
  return renderToString(
    createSSRApp({ render: () => h(component, props) })
      .use(i18n)
      .provide(referenceNavigationKey, () => {})
      .provide(ID_INJECTION_KEY, { prefix: 100, current: 0 })
      .provide(ZINDEX_INJECTION_KEY, { current: 0 }),
  );
}
const string: DefinitionFieldSchema = { kind: 'string' };
const choices = referenceCatalog();

describe('shared reference rendering', () => {
  it.each([
    [undefined, undefined, 'unset', 'contextUnknown'],
    [undefined, referenceCatalog('buff', []), 'unset', 'empty'],
    ['stale', referenceCatalog('buff', []), 'invalid', 'empty'],
    ['stale', undefined, 'contextUnknown', 'contextUnknown'],
    ['known', choices, 'valid', 'available'],
  ])(
    'keeps identity and candidate states separate (%s)',
    async (value, candidates, state, catalog) => {
      const html = await render(ReferenceField, {
        value,
        choices: candidates,
        referenceKind: 'buff',
        label: 'Buff',
        disabled: true,
      });
      expect(html).toContain(`data-reference-state="${state}"`);
      expect(html).toContain(`data-reference-catalog="${catalog}"`);
      if (value) expect(html).toContain(value);
      expect(html).toContain('ea-select');
      expect(html).not.toContain('ea-input ');
    },
  );

  it.each([
    { kind: 'string' },
    { kind: 'string', optional: true },
    { kind: 'union', variants: [string, { kind: 'null' }] },
  ] satisfies DefinitionFieldSchema[])(
    'preserves existing reference through $kind',
    async schema => {
      const html = await render(DefinitionField, {
        name: 'slot',
        value: 'stale',
        schema,
        path: ['slot'],
        editable: false,
        referenceKind: 'buff',
        referenceChoices: { buff: referenceCatalog('buff', []) },
      });
      expect(html).toContain('data-reference-kind="buff"');
      expect(html).toContain('data-reference-state="invalid"');
      expect(html).not.toContain('ea-input ');
    },
  );

  it.each([
    [{ kind: 'array', element: string }, ['stale']],
    [{ kind: 'record', value: string }, { arbitraryKey: 'stale' }],
  ] as const)(
    'uses reference controls for existing and new container entries',
    async (schema, value) => {
      const html = await render(DefinitionField, {
        name: 'slot',
        value,
        schema,
        path: ['slot'],
        root: true,
        editable: true,
        referenceKind: 'buff',
        referenceChoices: { buff: referenceCatalog('buff', []) },
      });
      expect(html.match(/data-reference-kind="buff"/g)).toHaveLength(
        schema.kind === 'array' ? 1 : 2,
      );
      expect(html).toContain('data-reference-state="invalid"');
      if (schema.kind === 'record') expect(html).toContain('data-reference-state="unset"');
      else expect(html).toContain('data-string-collection');
    },
  );

  it('does not spread a container reference family into object properties', async () => {
    const html = await render(DefinitionField, {
      name: 'slot',
      value: { blackboardKey: 'dynamic-key' },
      schema: { kind: 'object', fields: { blackboardKey: string } },
      path: ['slot'],
      root: true,
      editable: true,
      referenceKind: 'buff',
      referenceChoices: { buff: referenceCatalog('buff', []) },
    });
    expect(html).not.toContain('data-reference-kind=');
    expect(html).toContain('ea-input');
  });

  it('keeps a node reference typed without a supplied catalog, leaving ordinary text alone', async () => {
    const html = await render(NodeInspectorFields, {
      kind: 'fixture',
      value: { skillKey: 'stale', text: 'ordinary' },
      applyValue: () => true,
      fields: [
        {
          path: ['skillKey'],
          description: '',
          control: 'string',
          valueSchema: { kind: 'string', referenceKind: 'skill' },
        },
        {
          path: ['text'],
          description: '',
          control: 'string',
          valueSchema: { kind: 'string' },
        },
      ],
    });
    expect(html).toContain('data-reference-kind="skill"');
    expect(html).toContain('data-reference-catalog="contextUnknown"');
    expect(html).toContain('ea-input');
  });
});

it('renders source, owner and read-only navigation without exposing a duplicate winner', async () => {
  const candidate = referenceCandidate('known', 'buff', {
    owner: 'owner-a',
    writable: false,
    target: { assetId: 'asset', resourcePath: ['buffs', 0] },
  });
  const props = { label: 'Buff', referenceKind: 'buff', value: 'known', disabled: true };
  const html = await render(ReferenceField, {
    ...props,
    choices: { ...choices, candidates: [candidate] },
  });
  expect(html).toContain('reference-field__navigate');
  expect(html).toContain('owner-a');
  expect(html).toContain('Project');
  const duplicate = await render(ReferenceField, {
    ...props,
    choices: { ...choices, candidates: [candidate, { ...candidate, identity: 'other' }] },
  });
  expect(duplicate).toContain('data-reference-state="ambiguous"');
  expect(duplicate).not.toContain('reference-field__navigate');
  expect(duplicate).not.toContain('reference-field__source');
  const invisible = await render(ReferenceField, {
    ...props,
    choices: { ...choices, owner: 'owner-b', candidates: [{ ...candidate, scope: 'owner' }] },
  });
  expect(invisible).toContain('data-reference-state="invisible"');
  expect(invisible).not.toContain('reference-field__navigate');
});

it('renders string literal/read branches through the same control in node and definition surfaces', async () => {
  const semantics = { aliases: ['ActionStringOperand'] as const };
  const schema: DefinitionFieldSchema = {
    kind: 'union',
    variants: [
      { kind: 'string' },
      { kind: 'object', fields: { blackboardKey: { kind: 'string' } } },
    ],
    semantics,
  };
  for (const value of ['known', { blackboardKey: 'runtimeBuff' }]) {
    const html = await render(DefinitionField, {
      name: 'buffId',
      path: ['buffId'],
      schema,
      value,
      editable: false,
      referenceKind: 'buff',
      referenceChoices: { buff: choices },
    });
    expect(html).toContain('data-field-control="stringOperand"');
    expect(html).toContain(
      `data-string-operand-mode="${typeof value === 'string' ? 'literal' : 'blackboard'}"`,
    );
    expect(html).not.toContain('definition-field__variant');
    expect(html).toContain(typeof value === 'string' ? 'known' : 'runtimeBuff');
  }
});

it.each(['all', 'any'] as const)(
  'renders %s empty and populated lists alongside item pins without JSON fallback',
  async kind => {
    for (const readonly of [true, false]) {
      for (const conditions of [
        [],
        [
          { kind: 'constant' as const, value: false },
          { kind: 'conditionNode' as const, nodeId: 'source' },
        ],
      ]) {
        const node = { type: 'boolean' as const, expression: { kind, conditions } };
        const html = await render(DataNodeInspector, {
          node,
          nodeId: 'list',
          graph: {
            nodes: {},
            dataNodes: {
              list: node,
              source: { type: 'boolean', expression: { kind: 'constant', value: true } },
            },
          },
          readonly,
          apply: () => false,
        });
        expect(html).toContain('data-condition-list');
        expect(html).toContain('data-field-control="conditionList"');
        expect(html).not.toContain('<textarea');
        expect(html.includes(i18n.global.t('conditionList.edit'))).toBe(!readonly);
        if (conditions.length) {
          expect(html).toContain('data-input-path="conditions.0"');
          expect(html).toContain('data-input-path="conditions.1"');
          expect(html).toContain(`${i18n.global.t('conditionList.source')}: source`);
        }
      }
    }
  },
);

it('renders every generated typed collection with readonly structure and no JSON editor', async () => {
  const { actionNodeSchemas, dataNodeSchemas } =
    await import('../action-graph/actionNodeSchemas.generated');
  const { stringCollectionDescriptor } = await import('./stringCollectionSchema');
  const { writeNodeField } = await import('../action-graph/nodeFieldValues');
  let covered = 0;
  for (const [kind, schema] of [
    ...Object.entries(actionNodeSchemas),
    ...Object.entries(dataNodeSchemas),
  ]) {
    for (const field of schema.fields) {
      const descriptor = stringCollectionDescriptor(field);
      if (!descriptor) continue;
      const item = descriptor.kind === 'gameplayTag' ? 'Custom/Tag' : 'stale';
      const html = await render(NodeInspectorFields, {
        kind,
        fields: [field],
        value: writeNodeField({}, field.path, [item, item]),
        readonly: true,
        applyValue: () => false,
      });
      expect(html).toContain('data-string-collection');
      expect(html).not.toContain('ea-textarea');
      expect(
        html.match(
          new RegExp(
            descriptor.kind === 'gameplayTag'
              ? 'data-gameplay-tag'
              : descriptor.kind === 'nativeId'
                ? 'data-native-id-raw'
                : 'data-reference-kind=',
            'g',
          ),
        ),
      ).toHaveLength(2);
      covered++;
    }
  }
  expect(covered).toBe(26);
});
it('shows malformed imported collection entries without crashing or exposing an editor', async () => {
  const { default: StringCollectionField } = await import('./StringCollectionField.vue');
  const html = await render(StringCollectionField, {
    kind: 'gameplayTag',
    value: ['A/B', 42],
    label: 'Tags',
    editable: false,
  });
  expect(html).toContain('A/B');
  expect(html).toContain('42');
  expect(html).toContain('role="alert"');
  expect(html).not.toContain('ea-input');
});
it('retains visible labels and description help for definition tag and collection controls', async () => {
  for (const [schema, value] of [
    [
      {
        kind: 'string',
        description: 'Tag description',
        semantics: { aliases: ['GameplayTag'] },
      },
      'Custom/Tag',
    ],
    [
      {
        kind: 'array',
        description: 'Tag description',
        element: { kind: 'string', semantics: { aliases: ['GameplayTag'] } },
      },
      ['Custom/Tag'],
    ],
  ] as const) {
    const html = await render(DefinitionField, {
      name: 'Readable label',
      path: ['tags'],
      schema,
      value,
      editable: false,
    });
    expect(html).toMatch(/<span[^>]*>Readable label/);
    expect(html).toContain('Tag description');
  }
});

it('retains visible labels and help for level values and nested blackboard write keys', async () => {
  const levels = await render(DefinitionField, {
    name: 'Readable levels',
    path: ['levels'],
    value: [1, 2],
    editable: false,
    schema: {
      kind: 'union',
      variants: [{ kind: 'number' }, { kind: 'array', element: { kind: 'number' } }],
      semantics: { aliases: ['LevelValues'] },
      description: 'Level value description',
    },
  });
  expect(levels).toMatch(/<span[^>]*>Readable levels/);
  expect(levels).toContain('Level value description');
  const { default: StructuredValueField } = await import('./StructuredValueField.vue');
  const key = await render(StructuredValueField, {
    kind: 'findOwnerSpawnedAbilityEntities',
    path: ['parameters', 'circularOrder'],
    label: 'Order',
    editable: false,
    value: { indexBlackboardKey: 'index' },
    schema: {
      kind: 'object',
      fields: {
        indexBlackboardKey: {
          kind: 'string',
          description: 'Counter description',
          blackboardOrigin: 'contract',
        },
      },
    },
  });
  expect(key).toContain('data-blackboard-mode="write"');
  expect(key).toMatch(/<span[^>]*>indexBlackboardKey/);
  expect(key).toContain('Counter description');
});

it('bounds recursive field rendering, exposes subtree focus, and paginates rows', async () => {
  const body: DefinitionFieldSchema = { kind: 'array', element: { kind: 'ref', ref: 'list' } };
  const schema: DefinitionFieldSchema = { ...body, references: { list: body } };
  let value: unknown = [];
  for (let depth = 0; depth < 20; depth++) value = [value];
  const html = await render(DefinitionField, {
    name: 'recursive',
    value,
    schema,
    path: [],
    root: true,
    editable: true,
    expandDepth: 99,
  });
  expect(html).toContain('data-field-focus');
  expect((html.match(/class="definition-field /g) ?? []).length).toBeLessThan(15);
  const rows = await render(DefinitionField, {
    name: 'rows',
    value: Array.from({ length: 120 }, (_, index) => index),
    schema: { kind: 'array', element: { kind: 'number' } },
    path: [],
    root: true,
    editable: true,
  });
  expect(rows).toContain('data-field-pages');
  expect((rows.match(/type="number"/g) ?? []).length).toBeLessThanOrEqual(51);
});

it('renders bounded readonly errors for cyclic values and missing references', async () => {
  const value: Record<string, unknown> = {};
  value.self = value;
  const cyclic = await render(DefinitionField, {
    name: 'broken',
    value,
    schema: { kind: 'object', fields: {}, optional: true },
    path: [],
    root: true,
    editable: false,
  });
  expect(cyclic).toContain('data-field-traversal-error');
  expect(cyclic).toContain('cyclic field value');
  expect(cyclic).not.toContain('type="number"');
  const missing = await render(DefinitionField, {
    name: 'broken',
    value: [],
    schema: { kind: 'array', element: { kind: 'ref', ref: 'missing' } },
    path: [],
    root: true,
    editable: false,
  });
  expect(missing).toContain('data-field-traversal-error');
  expect(missing).toContain('missing schema reference');
});

it('offers typed creation for recursive array and record ref elements without rendering node IDs', async () => {
  const item: DefinitionFieldSchema = {
    kind: 'object',
    fields: {
      amount: { kind: 'number' },
      nested: { kind: 'array', element: { kind: 'ref', ref: 'item' }, optional: true },
    },
  };
  for (const schema of [
    { kind: 'array', element: { kind: 'ref', ref: 'item' }, references: { item } },
    { kind: 'record', value: { kind: 'ref', ref: 'item' }, references: { item } },
  ] as const) {
    const html = await render(DefinitionField, {
      name: 'nested',
      schema,
      value: schema.kind === 'array' ? [] : {},
      path: [],
      root: true,
      editable: true,
    });
    expect(html).toContain(i18n.global.t('definitionEditor.add'));
    expect(html).not.toContain('data-field-traversal-error');
  }
  const operand = await render(DefinitionField, {
    name: 'value',
    schema: {
      kind: 'object',
      semantics: { aliases: ['ActionValueOperand'] },
      fields: { kind: { kind: 'enum', options: ['valueNode'] }, nodeId: { kind: 'string' } },
    },
    value: { kind: 'valueNode', nodeId: 'shared' },
    path: [],
    root: true,
    editable: true,
  });
  expect(operand).not.toContain('value="shared"');
  expect(operand).toContain('data-field-control="operand"');
});

it('renders open native IDs as exact text with matching guidance, no catalog navigation or JSON editor', async () => {
  const { actionNodeSchemas } = await import('../action-graph/actionNodeSchemas.generated');
  const field = actionNodeSchemas.finishGlobalBuffsById.fields.find(
    f => f.path.at(-1) === 'globalBuffIds',
  )!;
  for (const readonly of [true, false]) {
    const html = await render(NodeInspectorFields, {
      kind: 'finishGlobalBuffsById',
      fields: [field],
      value: {
        kind: 'finishGlobalBuffsById',
        parameters: { globalBuffIds: ['unknown', ' \t\r\n ', 'unknown'], reason: 'other' },
      },
      readonly,
      referenceChoices: {},
      applyValue: () => false,
    });
    expect(html).toContain('data-collection-kind="nativeId"');
    expect(html).toContain('data-native-id-raw');
    expect(html).toContain('\\t\\r\\n');
    expect(html).not.toContain('data-reference-kind');
    expect(html).not.toContain('reference-field__navigate');
    expect(html).not.toContain('ea-textarea');
    expect(html).toContain('role="status"');
  }
  const { default: StringCollectionField } = await import('./StringCollectionField.vue');
  for (const value of [[], [''], undefined]) {
    const html = await render(StringCollectionField, {
      value,
      editable: false,
      kind: 'nativeId',
      label: 'IDs',
    });
    expect(html).toContain('role="alert"');
  }
});

it('renders direct string data operands and their source pin without numeric coercion or JSON fallback', async () => {
  for (const expression of [
    '  exact  ',
    { blackboardKey: 'marker' },
    { kind: 'stringNode', nodeId: 'read' },
  ]) {
    const node = { type: 'string', expression };
    const html = await render(DataNodeInspector, {
      node,
      nodeId: 'string',
      graph: {
        nodes: {},
        dataNodes: {
          string: node,
          read: { type: 'string', expression: { blackboardKey: 'marker' } },
        },
      },
      readonly: false,
      apply: () => false,
    });
    expect(html).not.toContain('<textarea');
    expect(html).not.toContain('type="number"');
    if (typeof expression === 'object' && 'kind' in expression) {
      expect(html).toContain('data-input-type="string"');
      expect(html).toContain('read');
    } else expect(html).toContain('data-field-control="stringOperand"');
  }
});
