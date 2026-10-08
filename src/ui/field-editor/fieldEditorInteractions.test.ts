import { mountSetup as mountComponentSetup } from '../../test/componentSetup';
import { expect, it } from 'vitest';
import DefinitionField from '../definition-editor/DefinitionField.vue';
import DefinitionValueCreator from '../definition-editor/DefinitionValueCreator.vue';
import NodeInspectorFields from '../action-graph/NodeInspectorFields.vue';
import ReferenceField from './ReferenceField.vue';
import StringOperandField from './StringOperandField.vue';
import { actionNodeSchemas, dataNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { validReferenceDraft } from './referenceDraftValidation';
import { referenceCatalog, referenceCandidate } from './referenceTestFixtures';
import { referenceNavigationKey, type ReferenceNavigator } from './referenceNavigation';
import { blackboardNavigationKey, type BlackboardNavigator } from './blackboardFieldContext';
import { validStringOperandDraft } from './stringOperandDraft';

function mountSetup(
  component: unknown,
  initial: Record<string, unknown>,
  navigate?: ReferenceNavigator,
  navigateBlackboard?: BlackboardNavigator,
) {
  return mountComponentSetup(component, initial, app => {
    if (navigate) app.provide(referenceNavigationKey, navigate);
    if (navigateBlackboard) app.provide(blackboardNavigationKey, navigateBlackboard);
  });
}

const candidates = { buff: referenceCatalog() };
const string = { kind: 'string' };

it.each([
  { kind: 'array', element: string },
  { kind: 'record', value: string },
])('does not create $kind reference entries from unlisted or empty values', async schema => {
  const changes: unknown[] = [];
  const f = await mountSetup(DefinitionField, {
    name: 'refs',
    schema,
    value: schema.kind === 'array' ? [] : {},
    path: ['refs'],
    editable: true,
    referenceKind: 'buff',
    referenceChoices: candidates,
    onChange: (_path: unknown, value: unknown) => changes.push(value),
  });
  try {
    f.state.recordKey.value = 'slot';
    f.state.newItemValue.value = 'unlisted';
    (schema.kind === 'array' ? f.state.addArrayEntry : f.state.addRecordEntry)();
    expect(changes).toEqual([]);
    f.state.newItemValue.value = 'known';
    (schema.kind === 'array' ? f.state.addArrayEntry : f.state.addRecordEntry)();
    expect(changes).toEqual([schema.kind === 'array' ? ['known'] : { slot: 'known' }]);
  } finally {
    f.stop();
  }
});

it('leaves a selected union value unchanged until its shared creator applies', async () => {
  const changes: unknown[] = [];
  const f = await mountSetup(DefinitionField, {
    name: 'refs',
    schema: { kind: 'union', variants: [string, { kind: 'null' }] },
    value: null,
    path: ['refs'],
    editable: true,
    referenceKind: 'buff',
    referenceChoices: candidates,
    onChange: (_path: unknown, value: unknown) => changes.push(value),
  });
  try {
    f.state.switchVariant(0);
    expect(f.state.referenceKind.value).toBe('buff');
    expect(f.state.pendingVariant.value.kind).toBe('string');
    expect(changes).toEqual([]);
    f.state.createValue('known');
    expect(changes).toEqual(['known']);
    expect(f.state.pendingVariantIndex.value).toBeNull();
  } finally {
    f.stop();
  }
});

it('restores an explicitly retained optional reference draft without choosing the first candidate', async () => {
  const changes: unknown[] = [];
  const f = await mountSetup(DefinitionField, {
    name: 'refs',
    schema: { ...string, optional: true },
    value: 'stale',
    path: ['refs'],
    editable: true,
    referenceKind: 'buff',
    referenceChoices: candidates,
    onChange: (_path: unknown, value: unknown) => changes.push(value),
  });
  try {
    f.state.toggleOptional(false);
    await f.update({ value: undefined });
    f.state.toggleOptional(true);
    expect(changes).toEqual([undefined, 'stale']);
  } finally {
    f.stop();
  }
});

it('requires a value in the creator, resets when its schema changes, and emits only on apply', async () => {
  const created: unknown[] = [];
  const f = await mountSetup(DefinitionValueCreator, {
    schema: string,
    editable: true,
    referenceKind: 'buff',
    referenceChoices: candidates,
    onCreate: (value: unknown) => created.push(value),
  });
  try {
    expect(f.state.complete.value).toBe(false);
    f.state.create();
    f.state.change([], 'known');
    expect(created).toEqual([]);
    expect(f.state.complete.value).toBe(true);
    f.state.create();
    expect(created).toEqual(['known']);
    await f.update({ schema: { kind: 'number' } });
    expect(f.state.complete.value).toBe(false);
  } finally {
    f.stop();
  }
});

it('candidate refresh never overwrites a node draft; rejection keeps it until explicit discard', async () => {
  const attempts: unknown[] = [];
  const f = await mountSetup(NodeInspectorFields, {
    kind: 'fixture',
    value: { parameters: { skillId: 'before' } },
    fields: [
      {
        path: ['parameters', 'skillId'],
        description: '',
        control: 'string',
        valueSchema: { kind: 'string', referenceKind: 'skill' },
      },
    ],
    referenceChoices: { skill: referenceCatalog('skill', ['after']) },
    applyValue: (value: unknown) => {
      attempts.push(value);
      return false;
    },
  });
  try {
    f.state.selectValue('parameters.skillId', 'after');
    expect(attempts).toEqual([{ parameters: { skillId: 'after' } }]);
    expect(f.state.pending.value).toBe(true);
    await f.update({ referenceChoices: { skill: referenceCatalog('skill', []) } });
    expect(f.state.inputs.value['parameters.skillId']).toBe('after');
    expect(f.state.error.value).toBeTruthy();
    f.state.reset();
    expect(f.state.inputs.value['parameters.skillId']).toBe('before');
    expect(f.state.pending.value).toBe(false);
  } finally {
    f.stop();
  }
});

it('reference control rejects unknown events and cannot write while disabled', async () => {
  const changes: unknown[] = [];
  const f = await mountSetup(ReferenceField, {
    label: 'Buff',
    referenceKind: 'buff',
    choices: candidates.buff,
    onChange: (value: unknown) => changes.push(value),
  });
  try {
    f.state.change('unlisted');
    f.state.change('');
    expect(changes).toEqual([]);
    f.state.change(JSON.stringify(['project', 'project:known']));
    await f.update({ disabled: true });
    f.state.change(JSON.stringify(['project', 'project:known']));
    expect(changes).toEqual(['known']);
  } finally {
    f.stop();
  }
});

it('rejects duplicate and invisible selections and retains stale IDs on catalog refresh', async () => {
  const changes: unknown[] = [];
  const a = referenceCandidate('known');
  const b = referenceCandidate('known', 'buff', {
    identity: 'builtin:known',
    source: { id: 'builtin', label: 'Built-in', kind: 'builtin' },
  });
  const f = await mountSetup(ReferenceField, {
    label: 'Buff',
    referenceKind: 'buff',
    value: 'known',
    choices: { ...referenceCatalog(), candidates: [a, b] },
    onChange: (value: unknown) => changes.push(value),
  });
  try {
    expect(f.state.state.value).toBe('ambiguous');
    expect(
      f.state.options.value
        .filter((option: any) => option.value.startsWith('['))
        .every((option: any) => option.disabled),
    ).toBe(true);
    f.state.change(JSON.stringify(['project', a.identity]));
    await f.update({
      choices: {
        ...referenceCatalog(),
        owner: 'other',
        candidates: [{ ...a, scope: 'owner', owner: 'original' }],
      },
    });
    expect(f.state.state.value).toBe('invisible');
    f.state.change(JSON.stringify(['project', a.identity]));
    await f.update({ choices: undefined });
    expect(f.state.state.value).toBe('contextUnknown');
    expect(f.state.options.value.some((option: any) => option.label === 'known')).toBe(true);
    expect(changes).toEqual([]);
  } finally {
    f.stop();
  }
});

it('navigates a read-only field and target only while uniquely resolved', async () => {
  const target = { assetId: 'builtin', resourcePath: ['buffs', 0] };
  const candidate = referenceCandidate('known', 'buff', { writable: false, target });
  const visits: unknown[] = [];
  const f = await mountSetup(
    ReferenceField,
    {
      label: 'Buff',
      referenceKind: 'buff',
      value: 'known',
      disabled: true,
      choices: { ...referenceCatalog(), candidates: [candidate] },
    },
    async next => {
      visits.push(next);
    },
  );
  try {
    expect(f.state.canNavigate.value).toBe(true);
    await f.state.openTarget();
    expect(visits).toEqual([target]);
    await f.update({
      choices: {
        ...referenceCatalog(),
        candidates: [candidate, { ...candidate, identity: 'duplicate' }],
      },
    });
    expect(f.state.canNavigate.value).toBe(false);
    await f.state.openTarget();
    expect(visits).toEqual([target]);
  } finally {
    f.stop();
  }
});

it.each([
  ['scalar', string, 'known'],
  ['array', { kind: 'array', element: string }, ['known']],
  [
    'record union',
    { kind: 'record', value: { kind: 'union', variants: [string, { kind: 'null' }] } },
    { first: 'known' },
  ],
])(
  '%s creator revalidates new reference leaves after refresh without discarding drafts',
  async (_name, schema, value) => {
    const created: unknown[] = [];
    const f = await mountSetup(DefinitionValueCreator, {
      schema,
      editable: true,
      referenceKind: 'buff',
      referenceChoices: candidates,
      onCreate: (next: unknown) => created.push(next),
    });
    try {
      f.state.change([], value);
      expect(f.state.complete.value).toBe(true);
      await f.update({ referenceChoices: { buff: referenceCatalog('buff', []) } });
      expect(f.state.complete.value).toBe(false);
      f.state.create();
      expect(created).toEqual([]);
      expect(f.state.value.value).toEqual(value);
      await f.update({ referenceChoices: candidates });
      f.state.create();
      expect(created).toEqual([value]);
    } finally {
      f.stop();
    }
  },
);

it('node apply revalidates changed reference IDs and keeps rejected drafts pending', async () => {
  const attempts: unknown[] = [];
  const f = await mountSetup(NodeInspectorFields, {
    kind: 'fixture',
    value: { skillId: 'stale', text: 'before' },
    fields: [
      {
        path: ['skillId'],
        description: '',
        control: 'string',
        valueSchema: { kind: 'string', referenceKind: 'skill' },
      },
      {
        path: ['text'],
        valueSchema: { kind: 'string' },
        description: '',
        control: 'string',
      },
    ],
    referenceChoices: { skill: referenceCatalog('skill', ['after']) },
    applyValue: (value: unknown) => {
      attempts.push(value);
      return true;
    },
  });
  try {
    f.state.change('text', 'next');
    expect(f.state.apply()).toBe(true);
    expect(attempts).toEqual([{ skillId: 'stale', text: 'next' }]);
    f.state.change('skillId', 'after');
    await f.update({ referenceChoices: { skill: referenceCatalog('skill', []) } });
    expect(f.state.apply()).toBe(false);
    expect(attempts).toHaveLength(1);
    expect(f.state.inputs.value.skillId).toBe('after');
    expect(f.state.pending.value).toBe(true);
  } finally {
    f.stop();
  }
});

it('validates semantic object children without inheriting the container family', () => {
  const schema = {
    kind: 'object',
    fields: {
      arbitrary: { kind: 'string' },
      buffId: {
        kind: 'string',
        optional: true,
        referenceKind: 'buff',
      },
    },
  } as const;
  expect(validReferenceDraft(schema, { arbitrary: 'free text' }, candidates, 'buff')).toBe(true);
  expect(
    validReferenceDraft(schema, { arbitrary: 'free text', buffId: 'known' }, candidates, 'skill'),
  ).toBe(true);
  expect(validReferenceDraft(schema, { arbitrary: 'free text', buffId: 'stale' }, candidates)).toBe(
    false,
  );
  expect(
    validReferenceDraft(
      { kind: 'union', variants: [{ kind: 'null' }, { kind: 'string' }] },
      null,
      candidates,
      'buff',
    ),
  ).toBe(true);
});

it('字符串常量草稿支持取消，并在提交时复查目录与只读状态', async () => {
  const changes: unknown[] = [];
  const f = await mountSetup(StringOperandField, {
    value: 'old',
    label: 'Buff',
    editable: true,
    required: true,
    referenceKind: 'buff',
    referenceChoices: candidates,
    onChange: (v: unknown) => changes.push(v),
  });
  try {
    f.state.changeLiteral('known');
    f.state.discard();
    expect(f.state.literal.value).toBe('old');
    expect(changes).toEqual([]);
    f.state.changeLiteral('known');
    await f.update({ referenceChoices: { buff: referenceCatalog('buff', []) } });
    f.state.apply();
    expect(changes).toEqual([]);
    await f.update({ referenceChoices: candidates });
    f.state.apply();
    expect(changes).toEqual(['known']);
    await f.update({ editable: false });
    f.state.changeLiteral('other');
    f.state.apply();
    f.state.unset();
    expect(changes).toEqual(['known']);
  } finally {
    f.stop();
  }
});

it('node string operand commit revalidates catalogs and keeps refused drafts', async () => {
  const field = actionNodeSchemas.applyBuff.fields.find(f => f.path.at(-1) === 'buffId')!;
  const accepted: unknown[] = [];
  const f = await mountSetup(NodeInspectorFields, {
    value: { kind: 'applyBuff', parameters: { buffId: 'old' } },
    kind: 'applyBuff',
    fields: [field],
    referenceChoices: candidates,
    applyValue: (v: unknown) => {
      accepted.push(v);
      return false;
    },
  });
  try {
    f.state.changeStructured(field, 'known');
    expect(accepted).toHaveLength(1);
    expect(f.state.pending.value).toBe(true);
    expect(f.state.inputs.value['parameters.buffId']).toBe('"known"');
    await f.update({ referenceChoices: { buff: referenceCatalog('buff', []) } });
    expect(f.state.apply()).toBe(false);
    expect(accepted).toHaveLength(1);
    await f.update({ referenceChoices: candidates });
    f.state.changeStructured(field, 'known');
    expect(accepted).toHaveLength(2);
    expect(accepted[1]).toEqual({ kind: 'applyBuff', parameters: { buffId: 'known' } });
  } finally {
    f.stop();
  }
});

it('creates typed string operands without a separate untyped union branch chooser', async () => {
  const created: unknown[] = [];
  const schema = actionNodeSchemas.applyBuff.fields.find(
    f => f.path.at(-1) === 'buffId',
  )!.valueSchema;
  const f = await mountSetup(DefinitionValueCreator, {
    schema,
    editable: true,
    referenceKind: 'buff',
    referenceChoices: candidates,
    onCreate: (v: unknown) => created.push(v),
  });
  try {
    expect(f.state.variants.value).toHaveLength(1);
    f.state.change([], 'known');
    expect(f.state.complete.value).toBe(true);
    f.state.create();
    expect(created).toEqual(['known']);
  } finally {
    f.stop();
  }
});

it.each(['buffId', 'blackboardAssignments'])(
  '%s child discard removes a rejected structured proposal before a later parent apply',
  async name => {
    const field = actionNodeSchemas.applyBuff.fields.find(f => f.path.at(-1) === name)!;
    const value = {
      kind: 'applyBuff',
      parameters: { buffId: 'known', blackboardAssignments: { old: 1 } },
    };
    let accepts = false;
    const attempts: unknown[] = [];
    const f = await mountSetup(NodeInspectorFields, {
      value,
      kind: 'applyBuff',
      fields: [field],
      referenceChoices: candidates,
      applyValue: (v: unknown) => {
        attempts.push(v);
        return accepts;
      },
    });
    try {
      f.state.changeStructured(field, name === 'buffId' ? 'known' : { new: 2 });
      expect(f.state.pending.value).toBe(true);
      f.state.discardStructured(field);
      expect(f.state.pending.value).toBe(false);
      accepts = true;
      expect(f.state.apply()).toBe(true);
      expect(attempts).toHaveLength(1);
    } finally {
      f.stop();
    }
  },
);

it('the string child sends discard only for user cancellation, never a parent refresh', async () => {
  let discards = 0;
  const f = await mountSetup(StringOperandField, {
    value: 'known',
    label: 'Buff',
    editable: true,
    onDiscard: () => discards++,
  });
  try {
    f.state.changeLiteral('draft');
    f.state.discard();
    expect(discards).toBe(1);
    await f.update({ value: 'another' });
    expect(discards).toBe(1);
  } finally {
    f.stop();
  }
});

it('discards a rejected structured proposal across readonly transitions before a later parent apply', async () => {
  const field = dataNodeSchemas['boolean:all']!.fields[0]!;
  const original = { kind: 'all', conditions: [] };
  const proposals: unknown[] = [];
  let accept = false;
  const panel = await mountSetup(NodeInspectorFields, {
    value: original,
    kind: 'all',
    fields: [field],
    readonly: false,
    applyValue: (value: unknown) => {
      proposals.push(value);
      return accept;
    },
  });
  try {
    panel.state.changeStructured(field, [{ kind: 'constant', value: false }]);
    expect(panel.state.pending.value).toBe(true);
    expect(proposals).toHaveLength(1);
    await panel.update({ readonly: true });
    await panel.update({ readonly: false });
    accept = true;
    expect(panel.state.apply()).toBe(true);
    expect(proposals).toHaveLength(1);
    expect(panel.state.pending.value).toBe(false);
    expect(original.conditions).toEqual([]);
  } finally {
    panel.stop();
  }
});

it('typed collections apply through real history once, preserving siblings and duplicate order on reopen', async () => {
  const { DefinitionDraftSession } = await import('@/application/editor/definitionDraftSession');
  const { updateResourceGraph } = await import('@/application/editor/actionGraphResourceEditing');
  const graph = {
    nodes: {
      finish: {
        action: {
          kind: 'finishBuffsById' as const,
          parameters: {
            target: 'caster' as const,
            reason: 'other' as const,
            buffIds: ['known', 'stale', 'known'],
          },
        },
        next: null,
      },
    },
  };
  const history = new DefinitionDraftSession({ actionGraph: { main: graph, macros: {} } }, true);
  const before = history.current;
  const field = actionNodeSchemas.finishBuffsById.fields.find(f => f.path.at(-1) === 'buffIds')!;
  const f = await mountSetup(NodeInspectorFields, {
    kind: 'finishBuffsById',
    value: graph.nodes.finish.action,
    fields: [field],
    referenceChoices: candidates,
    applyValue: (action: typeof graph.nodes.finish.action) =>
      history.update(owner =>
        updateResourceGraph(owner, { kind: 'main' }, graph => ({
          ...graph,
          nodes: { ...graph.nodes, finish: { ...graph.nodes.finish!, action } },
        })),
      ),
  });
  try {
    f.state.changeStructured(field, ['stale', 'known', 'known', 'known']);
    expect(history.current.actionGraph.main.nodes.finish!.action.parameters).toEqual({
      target: 'caster',
      reason: 'other',
      buffIds: ['stale', 'known', 'known', 'known'],
    });
    const applied = history.current;
    expect(history.undo()).toBe(true);
    expect(history.current).toBe(before);
    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(true);
    expect(history.current).toBe(applied);
    expect(JSON.parse(JSON.stringify(history.exportDefinition()))).toEqual(applied);
    await f.update({ value: applied.actionGraph.main.nodes.finish!.action });
    f.state.changeStructured(field, ['unknown-new']);
    expect(history.current).toBe(applied);
    expect(f.state.error.value).not.toBe('');
    f.state.discardStructured(field);
    expect(f.state.pending.value).toBe(false);
    expect(history.undo()).toBe(true);
    expect(history.current).toBe(before);
  } finally {
    f.stop();
  }
});
it('cannot use an enclosing entity catalog when an owner override is persisted or pending', async () => {
  const attempts: unknown[] = [];
  const fields = actionNodeSchemas.findOwnerSpawnedAbilityEntities.fields;
  const ids = fields.find(f => f.path.at(-1) === 'abilityEntityIds')!;
  const f = await mountSetup(NodeInspectorFields, {
    kind: 'findOwnerSpawnedAbilityEntities',
    value: { kind: 'findOwnerSpawnedAbilityEntities', parameters: { saveToContextKey: 'targets' } },
    fields,
    referenceChoices: { abilityEntity: referenceCatalog('abilityEntity') },
    applyValue: (value: unknown) => {
      attempts.push(value);
      return true;
    },
  });
  try {
    f.state.change('parameters.ownerContextKey', 'another-owner');
    expect(f.state.collectionChoices(ids)).toBeUndefined();
    f.state.changeStructured(ids, ['known']);
    expect(attempts).toEqual([]);
    await f.update({
      value: {
        kind: 'findOwnerSpawnedAbilityEntities',
        parameters: { saveToContextKey: 'targets', ownerContextKey: 'other' },
      },
    });
    expect(f.state.collectionChoices(ids)).toBeUndefined();
  } finally {
    f.stop();
  }
});
it('tag creation checks semantic syntax and updated reference collections before emitting', async () => {
  const { definitionSchemas } = await import('../definition-editor/definitionSchemas.generated');
  const created: unknown[] = [];
  const f = await mountSetup(DefinitionValueCreator, {
    schema: definitionSchemas.abilityEntity.fields.bornTags,
    editable: true,
    onCreate: (value: unknown) => created.push(value),
  });
  try {
    f.state.change([], ['Custom/Tag', 'Custom/Tag']);
    expect(f.state.complete.value).toBe(true);
    f.state.create();
    expect(created).toEqual([['Custom/Tag', 'Custom/Tag']]);
    f.state.change([], ['Custom//Tag']);
    expect(f.state.complete.value).toBe(false);
    f.state.create();
    expect(created).toHaveLength(1);
  } finally {
    f.stop();
  }
});
it('optional tag leaves unset through the original parser and required leaves still reject empty', async () => {
  const attempts: unknown[] = [];
  const optional = actionNodeSchemas.changeResource.fields.find(
    f => f.path.at(-1) === 'ultimateRecoveryTag',
  )!;
  const f = await mountSetup(NodeInspectorFields, {
    kind: 'changeResource',
    value: { parameters: { ultimateRecoveryTag: 'Custom/Tag' } },
    fields: [optional],
    applyValue: (value: unknown) => {
      attempts.push(value);
      return true;
    },
  });
  try {
    f.state.selectValue('parameters.ultimateRecoveryTag', '');
    expect(attempts).toEqual([{ parameters: {} }]);
  } finally {
    f.stop();
  }
});
it('scalar tags bound suggestions and reset custom drafts on readonly changes', async () => {
  const { default: GameplayTagField } = await import('./GameplayTagField.vue');
  const changes: unknown[] = [];
  const f = await mountSetup(GameplayTagField, {
    value: 'Custom/Old',
    label: 'Tag',
    disabled: false,
    allowUnset: true,
    onChange: (value: unknown) => changes.push(value),
  });
  try {
    f.state.text.value = '';
    expect(f.state.options.value.length).toBeLessThanOrEqual(51);
    f.state.text.value = 'Custom/New';
    await f.update({ disabled: true });
    expect(f.state.text.value).toBe('Custom/Old');
    f.state.apply();
    f.state.unset();
    expect(changes).toEqual([]);
    await f.update({ disabled: false });
    f.state.unset();
    expect(changes).toEqual(['']);
  } finally {
    f.stop();
  }
});

it('stages native timing sibling switches as one validated node transaction with rejection, history and reopen', async () => {
  const { DefinitionDraftSession } = await import('@/application/editor/definitionDraftSession');
  const { updateResourceGraph } = await import('@/application/editor/actionGraphResourceEditing');
  const { validateActionGraphStepDefinition } =
    await import('@/core/game-data/validation/actionPrograms');
  const action = {
    kind: 'repeatEachTick' as const,
    parameters: {
      nativeTickInterval: { executeEachFrame: false, intervalSeconds: 1 },
      extension: { label: 'keep' },
    },
    body: { $sequence: null },
  };
  const graph = {
    nodes: {
      loop: { action, next: 'after' },
      after: {
        action: {
          kind: 'setContextFlag' as const,
          parameters: { flag: 'keep', value: true, target: 'caster' as const },
        },
        next: null,
      },
    },
  };
  const history = new DefinitionDraftSession({ actionGraph: { main: graph, macros: {} } }, true);
  const before = history.current;
  const fields = actionNodeSchemas.repeatEachTick.fields.filter(
    field => field.control !== 'sequence',
  );
  const oldMode = fields.find(field => field.path.at(-1) === 'nativeTickInterval')!;
  const newMode = fields.find(field => field.path.at(-1) === 'nativeExecuteInterval')!;
  let attempts = 0;
  const f = await mountSetup(NodeInspectorFields, {
    kind: 'repeatEachTick',
    value: before.actionGraph.main.nodes.loop.action,
    fields,
    applyValue: (next: typeof action) => {
      attempts++;
      if (validateActionGraphStepDefinition(next, 'action').length) return false;
      return history.update(owner =>
        updateResourceGraph(owner, { kind: 'main' }, current => ({
          ...current,
          nodes: { ...current.nodes, loop: { ...current.nodes.loop!, action: next } },
        })),
      );
    },
  });
  try {
    f.state.stageStructured(newMode, { executeEachFrame: false, intervalSeconds: 2 });
    expect(attempts).toBe(0);
    expect(f.state.apply()).toBe(false); // Both modes are still present.
    expect(history.current).toBe(before);
    expect(f.state.typedDrafts.value['parameters.nativeExecuteInterval']).toEqual({
      executeEachFrame: false,
      intervalSeconds: 2,
    });
    f.state.stageStructured(oldMode, undefined);
    expect(f.state.apply()).toBe(true);
    expect(attempts).toBe(2);
    const committed = history.current;
    expect(committed.actionGraph.main.nodes.loop.action.parameters).toEqual({
      nativeExecuteInterval: { executeEachFrame: false, intervalSeconds: 2 },
      extension: { label: 'keep' },
    });
    expect(committed.actionGraph.main.nodes.loop.action.body).toBe(
      before.actionGraph.main.nodes.loop.action.body,
    );
    expect(committed.actionGraph.main.nodes.after).toBe(before.actionGraph.main.nodes.after);
    expect(f.state.apply()).toBe(true);
    expect(attempts).toBe(2);
    expect(history.undo()).toBe(true);
    expect(history.current).toBe(before);
    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(true);
    expect(history.current).toBe(committed);
    const reopened = new DefinitionDraftSession(
      JSON.parse(JSON.stringify(history.exportDefinition())),
      true,
    );
    expect(reopened.current).toEqual(committed);
    await f.update({ value: committed.actionGraph.main.nodes.loop.action });
    f.state.stageStructured(newMode, { executeEachFrame: false, intervalSeconds: -1 });
    expect(f.state.apply()).toBe(false);
    expect(history.current).toBe(committed);
    f.state.reset();
    expect(f.state.typedDrafts.value).toEqual({});
    expect(f.state.pending.value).toBe(false);
    f.state.stageStructured(newMode, { executeEachFrame: false, intervalSeconds: 3 });
    await f.update({ readonly: true });
    expect(f.state.typedDrafts.value).toEqual({});
    expect(f.state.pending.value).toBe(false);
  } finally {
    f.stop();
  }
});

it('acknowledges existing list controls coherently during a staged structural transaction and clears canceled proposals', async () => {
  const fields = actionNodeSchemas.findOwnerSpawnedAbilityEntities.fields;
  const circular = fields.find(field => field.path.at(-1) === 'circularOrder')!;
  const ids = fields.find(field => field.path.at(-1) === 'abilityEntityIds')!;
  const changes: unknown[] = [];
  const f = await mountSetup(NodeInspectorFields, {
    kind: 'findOwnerSpawnedAbilityEntities',
    value: {
      kind: 'findOwnerSpawnedAbilityEntities',
      parameters: { saveToContextKey: 'targets', abilityEntityIds: ['known'] },
    },
    fields,
    referenceChoices: { abilityEntity: referenceCatalog('abilityEntity', ['known', 'new']) },
    applyValue: (next: unknown) => {
      changes.push(next);
      return true;
    },
  });
  try {
    f.state.stageStructured(circular, {
      indexBlackboardKey: 'index',
      desiredCount: 1,
      reverseFlag: -1,
    });
    f.state.changeStructured(ids, ['new', 'known']);
    expect(changes).toEqual([]);
    await f.update({ fields: [...fields] });
    expect(f.state.pending.value).toBe(true);
    expect(f.state.displayedValue(ids)).toEqual(['new', 'known']);
    expect(f.state.displayedValue(circular)).toHaveProperty('indexBlackboardKey', 'index');
    f.state.discardStructured(ids);
    expect(f.state.displayedValue(ids)).toEqual(['known']);
    expect(f.state.pending.value).toBe(true);
    f.state.changeStructured(ids, ['new']);
    await f.update({ referenceChoices: { abilityEntity: referenceCatalog('abilityEntity') } });
    expect(f.state.apply()).toBe(false);
    expect(changes).toEqual([]);
    expect(f.state.displayedValue(ids)).toEqual(['new']);
    await f.update({
      value: {
        kind: 'findOwnerSpawnedAbilityEntities',
        parameters: { saveToContextKey: 'different-node' },
      },
    });
    expect(f.state.pending.value).toBe(false);
    expect(f.state.typedDrafts.value).toEqual({});
  } finally {
    f.stop();
  }
});

it('structured leaf edits keep immutable drafts, reject incomplete values, recheck catalogs and discard rejected revisions', async () => {
  const { default: StructuredValueField } = await import('./StructuredValueField.vue');
  const field = actionNodeSchemas.applyBuff.fields.find(
    field => field.path.at(-1) === 'onActionEndFinishBuffs',
  )!;
  const original = Object.freeze({
    target: 'caster',
    buffIds: ['known'],
    extension: Object.freeze({ weight: Infinity }),
  });
  const changes: unknown[] = [];
  let discards = 0;
  const f = await mountSetup(StructuredValueField, {
    schema: field.valueSchema,
    value: original,
    editable: true,
    label: 'Finish buffs',
    kind: 'applyBuff',
    path: field.path,
    referenceChoices: { buff: referenceCatalog('buff', ['known', 'new']) },
    onChange: (next: unknown) => changes.push(next),
    onDiscard: () => discards++,
  });
  try {
    f.state.begin();
    f.state.change(['target'], 'party');
    expect(changes).toEqual([]);
    expect(original.target).toBe('caster');
    expect(f.state.draft.value.extension).toBe(original.extension);
    f.state.change(['buffIds'], ['new']);
    await f.update({ referenceChoices: candidates });
    await f.state.stage();
    expect(changes).toEqual([]);
    expect(f.state.editing.value).toBe(true);
    expect(f.state.error.value).toBe('fieldReference.invalid');
    f.state.change(['buffIds'], ['known']);
    await f.state.stage();
    expect(changes).toHaveLength(1);
    expect(f.state.error.value).toBe('structuredValue.rejected');
    f.state.change(['target'], 'caster');
    expect(discards).toBe(1);
    expect(f.state.editing.value).toBe(true);
    f.state.discard();
    expect(f.state.editing.value).toBe(false);
    f.state.begin();
    expect(f.state.draft.value).toBe(original);
    await f.update({ editable: false });
    f.state.change(['target'], 'party');
    await f.state.stage();
    expect(changes).toHaveLength(1);
  } finally {
    f.stop();
  }
});

it('fixed tuple slots and literal-true options render typed controls, while blank LevelValues never invents zero', async () => {
  const { default: NodeLevelValues } = await import('../action-graph/NodeLevelValues.vue');
  const changes: unknown[] = [];
  const f = await mountSetup(NodeLevelValues, {
    value: undefined,
    required: false,
    label: 'Levels',
    onValueChange: (value: unknown) => changes.push(value),
  });
  try {
    f.state.switchMode('single');
    f.state.update(0, '');
    expect(changes).toEqual([]);
    f.state.update(0, '2');
    expect(changes).toEqual([2]);
    await f.update({ value: 2 });
    f.state.switchMode('levels');
    expect(changes).toEqual([2, [2]]);
    await f.update({ value: [2] });
    f.state.switchMode('unset');
    expect(changes).toEqual([2, [2], undefined]);
    await f.update({ readonly: true });
    f.state.update(0, '7');
    expect(changes).toHaveLength(3);
  } finally {
    f.stop();
  }
});

it('union switches preserve only unknown extensions and keep branch creators cancelable', async () => {
  const field = actionNodeSchemas.applyBuff.fields.find(
    field => field.path.at(-1) === 'iconDurationSource',
  )!;
  const schema = field.valueSchema!;
  if (schema.kind !== 'union') throw new Error('expected union');
  const extension = { imported: true };
  const value = { kind: 'actionOwnerTimedMarker', markerId: 'old', extension };
  const changes: unknown[] = [];
  const f = await mountSetup(DefinitionField, {
    name: 'iconDurationSource',
    path: [],
    value,
    schema,
    editable: true,
    editingContext: 'value',
    onChange: (_path: unknown, next: unknown) => changes.push(next),
  });
  try {
    const simple = schema.variants.findIndex(
      variant =>
        variant.kind === 'object' &&
        variant.fields.kind?.kind === 'enum' &&
        variant.fields.kind.options.includes('actionOwnerAbilityEntity'),
    );
    f.state.switchVariant(simple);
    expect(changes).toEqual([{ kind: 'actionOwnerAbilityEntity', extension }]);
    expect((changes[0] as { extension: unknown }).extension).toBe(extension);
    const named = 1 - simple;
    f.state.switchVariant(named);
    expect(f.state.pendingVariantIndex.value).toBe(named);
    expect(changes).toHaveLength(1);
    f.state.pendingVariantIndex.value = null;
    expect(value.markerId).toBe('old');
    f.state.switchVariant(named);
    f.state.createValue({ kind: 'actionOwnerTimedMarker', markerId: 'new' });
    expect(changes[1]).toEqual({ kind: 'actionOwnerTimedMarker', markerId: 'new', extension });
  } finally {
    f.stop();
  }
});

it('reopening an accepted staged structure or collection and applying unchanged keeps the parent proposal', async () => {
  const { default: StructuredValueField } = await import('./StructuredValueField.vue');
  const { default: StringCollectionField } = await import('./StringCollectionField.vue');
  const field = actionNodeSchemas.findOwnerSpawnedAbilityEntities.fields.find(
    field => field.path.at(-1) === 'circularOrder',
  )!;
  const initial = { indexBlackboardKey: 'index', desiredCount: 1, reverseFlag: -1 };
  const changed = { ...initial, desiredCount: 2 };
  let discards = 0;
  const proposals: unknown[] = [];
  const f = await mountSetup(StructuredValueField, {
    schema: field.valueSchema,
    value: initial,
    editable: true,
    label: 'Order',
    kind: 'findOwnerSpawnedAbilityEntities',
    path: field.path,
    onChange: (next: unknown) => proposals.push(next),
    onDiscard: () => discards++,
  });
  try {
    f.state.begin();
    f.state.change(['desiredCount'], 2);
    const staging = f.state.stage();
    await f.update({ value: changed });
    await staging;
    f.state.begin();
    await f.state.stage();
    expect(proposals).toEqual([changed]);
    expect(discards).toBe(0);
    expect(f.state.editing.value).toBe(false);
  } finally {
    f.stop();
  }
  const list = await mountSetup(StringCollectionField, {
    value: ['known'],
    kind: 'reference',
    referenceKind: 'buff',
    referenceChoices: candidates,
    editable: true,
    required: true,
    label: 'Buffs',
    onDiscard: () => discards++,
  });
  try {
    await list.update({ value: ['known', 'known'] });
    list.state.begin();
    await list.state.apply();
    expect(discards).toBe(0);
    expect(list.state.editing.value).toBe(false);
    list.state.begin();
    list.state.discard();
    expect(discards).toBe(1);
  } finally {
    list.stop();
  }
});

it('keeps focused subtree paths and permissions, pages rows, and clears stale branch focus', async () => {
  const first = {
    kind: 'object',
    fields: { kind: { kind: 'enum', options: ['a'] }, amount: { kind: 'number' } },
  };
  const second = {
    kind: 'object',
    fields: { kind: { kind: 'enum', options: ['b'] }, text: { kind: 'string' } },
  };
  const schema = { kind: 'array', element: { kind: 'union', variants: [first, second] } };
  const value = Array.from({ length: 120 }, () => ({ kind: 'a', amount: 1 }));
  const changes: unknown[] = [];
  const host = await mountSetup(DefinitionField, {
    name: 'rows',
    schema,
    value,
    path: ['rows'],
    root: true,
    editable: true,
  });
  try {
    host.state.page.value = 1;
    expect(host.state.arrayEntries.value[0].index).toBe(50);
    expect(host.state.arrayEntries.value).toHaveLength(50);
    host.state.window.focus({
      path: ['rows', 51],
      schema: first,
      name: '52',
      editable: false,
      referenceKind: 'buff',
    });
    expect(host.state.focusedValue.value).toBe(value[51]);
    expect(host.state.focus.value.editable).toBe(false);
    expect(host.state.focus.value.referenceKind).toBe('buff');
    host.state.closeFocus();
    expect(host.state.focus.value).toBeUndefined();
    host.state.window.focus({ path: ['rows', 51], schema: first, name: '52', editable: true });
    const leaf = await mountSetup(DefinitionField, {
      name: 'amount',
      schema: { kind: 'number' },
      value: 1,
      path: ['rows', 51, 'amount'],
      editable: true,
      onChange: (path: unknown, value: unknown) => changes.push([path, value]),
    });
    try {
      leaf.state.update(3);
      expect(changes).toEqual([[['rows', 51, 'amount'], 3]]);
      await leaf.update({ editable: false });
      leaf.state.update(4);
      expect(changes).toHaveLength(1);
    } finally {
      leaf.stop();
    }
    await host.update({
      value: value.map((entry, index) => (index === 51 ? { kind: 'b', text: 'different' } : entry)),
    });
    expect(host.state.focus.value).toBeUndefined();
    host.state.window.focus({ path: ['rows', 51], schema: first, name: '52', editable: true });
    await host.update({ value: [] });
    expect(host.state.focus.value).toBeUndefined();
  } finally {
    host.stop();
  }
});

it('commits open native-ID queries through validated graph commands with exact history and staged retries', async () => {
  const { DefinitionDraftSession } = await import('@/application/editor/definitionDraftSession');
  const { replaceResourceNodeAction, addResourceNode, resourceGraph } =
    await import('@/application/editor/actionGraphResourceEditing');
  const original = {
    kind: 'finishGlobalBuffsById' as const,
    parameters: { globalBuffIds: ['old'], reason: 'other' as const },
  };
  const owner = addResourceNode(
    { actionGraph: { main: { nodes: {} }, macros: {} } },
    { kind: 'main' },
    'finish',
    original,
  );
  const history = new DefinitionDraftSession(owner, true);
  const before = history.current;
  const fields = actionNodeSchemas.finishGlobalBuffsById.fields;
  const ids = fields.find(f => f.path.at(-1) === 'globalBuffIds')!;
  const reason = fields.find(f => f.path.at(-1) === 'reason')!;
  const f = await mountSetup(NodeInspectorFields, {
    kind: 'finishGlobalBuffsById',
    value: original,
    fields,
    referenceChoices: {},
    applyValue: (action: unknown) =>
      history.update(owner => replaceResourceNodeAction(owner, { kind: 'main' }, 'finish', action)),
  });
  const exact = ['unknown', ' \t\r\n ', 'unknown'];
  try {
    f.state.changeStructured(ids, exact);
    const applied = history.current;
    expect(resourceGraph(applied, { kind: 'main' }).nodes.finish!.action).toEqual({
      ...original,
      parameters: { ...original.parameters, globalBuffIds: exact },
    });
    expect(Object.keys(applied.actionGraph.main.nodes)).toEqual(['finish']);
    expect(history.undo()).toBe(true);
    expect(history.current).toBe(before);
    expect(history.undo()).toBe(false);
    expect(history.redo()).toBe(true);
    expect(history.current).toBe(applied);
    expect(JSON.parse(JSON.stringify(history.exportDefinition()))).toEqual(applied);
    await f.update({ value: resourceGraph(applied, { kind: 'main' }).nodes.finish!.action });
    for (const bad of [[], [''], ['ok', '']]) {
      f.state.changeStructured(ids, bad);
      expect(history.current).toBe(applied);
      expect(f.state.error.value).not.toBe('');
      f.state.discardStructured(ids);
    }
    // A sibling draft keeps the complete action atomic. Repeated ID staging must
    // retain the sibling rather than applying an older whole-node snapshot.
    f.state.stageStructured(reason, 'early');
    f.state.changeStructured(ids, ['first proposal']);
    f.state.changeStructured(ids, [' replacement ', ' replacement ']);
    expect(history.current).toBe(applied);
    expect(f.state.displayedValue(reason)).toBe('early');
    expect(f.state.apply()).toBe(true);
    const staged = history.current;
    expect(resourceGraph(staged, { kind: 'main' }).nodes.finish!.action).toEqual({
      kind: 'finishGlobalBuffsById',
      parameters: { globalBuffIds: [' replacement ', ' replacement '], reason: 'early' },
    });
    expect(history.undo()).toBe(true);
    expect(history.current).toBe(applied);
    expect(history.redo()).toBe(true);
    expect(JSON.parse(JSON.stringify(history.exportDefinition()))).toEqual(staged);
    await f.update({ value: resourceGraph(staged, { kind: 'main' }).nodes.finish!.action });
    f.state.stageStructured(ids, ['discard']);
    f.state.discardStructured(ids);
    expect(f.state.pending.value).toBe(false);
    expect(history.current).toBe(staged);
    await f.update({ readonly: true });
    f.state.changeStructured(ids, ['forged']);
    f.state.stageStructured(ids, ['forged']);
    f.state.apply();
    expect(history.current).toBe(staged);
    for (const globalBuffIds of [[], ['']])
      expect(() =>
        replaceResourceNodeAction(owner, { kind: 'main' }, 'finish', {
          ...original,
          parameters: { ...original.parameters, globalBuffIds },
        }),
      ).toThrow();
    expect(() =>
      replaceResourceNodeAction(owner, { kind: 'main' }, 'finish', {
        ...original,
        parameters: { globalBuffIds: exact, reason: 'invalid' },
      }),
    ).toThrow();
  } finally {
    f.stop();
  }
});

it('creates a containing native-ID value only when complete and discards cancelled or readonly drafts', async () => {
  const { addResourceNode } = await import('@/application/editor/actionGraphResourceEditing');
  const schema = {
    kind: 'object' as const,
    fields: Object.fromEntries(
      actionNodeSchemas.finishGlobalBuffsById.fields.map(field => [
        field.path.at(-1)!,
        field.valueSchema!,
      ]),
    ),
  };
  const created: unknown[] = [];
  let cancelled = 0;
  const initial = {
    schema,
    editable: true,
    referenceChoices: {},
    onCreate: (value: unknown) => created.push(value),
    onCancel: () => cancelled++,
  };
  let f = await mountSetup(DefinitionValueCreator, initial);
  try {
    expect(f.state.complete.value).toBe(false);
    f.state.change(['reason'], 'other');
    f.state.create();
    expect(created).toEqual([]);
    f.state.change(['globalBuffIds'], ['unregistered', ' \t\r\n ', 'unregistered']);
    expect(f.state.complete.value).toBe(true);
    f.state.create();
    expect(created).toEqual([
      { globalBuffIds: ['unregistered', ' \t\r\n ', 'unregistered'], reason: 'other' },
    ]);
    const owner = addResourceNode(
      { actionGraph: { main: { nodes: {} }, macros: {} } },
      { kind: 'main' },
      'created',
      { kind: 'finishGlobalBuffsById', parameters: created[0] },
    );
    expect(
      JSON.parse(JSON.stringify(owner)).actionGraph.main.nodes.created.action.parameters,
    ).toEqual(created[0]);
    f.state.change(['globalBuffIds'], ['']);
    expect(f.state.complete.value).toBe(false);
    f.state.create();
    expect(created).toHaveLength(1);
    f.state.emit('cancel');
    expect(cancelled).toBe(1);
    f.stop();
    f = await mountSetup(DefinitionValueCreator, initial);
    expect(f.state.complete.value).toBe(false);
    expect(f.state.value.value.globalBuffIds).toEqual([]);
    await f.update({ editable: false });
    f.state.change(['globalBuffIds'], ['forged']);
    f.state.change(['reason'], 'early');
    f.state.create();
    expect(created).toHaveLength(1);
    expect(f.state.value.value.globalBuffIds).toEqual([]);
  } finally {
    f.stop();
  }
});

it('string graph references are navigable read-only boundaries, even with synthetic field events', async () => {
  const changes: unknown[] = [];
  const visits: unknown[] = [];
  const pin = { kind: 'stringNode', nodeId: 'shared' };
  const f = await mountSetup(
    StringOperandField,
    {
      value: pin,
      label: 'Buff',
      editable: true,
      required: false,
      onChange: (value: unknown) => changes.push(value),
    },
    undefined,
    target => visits.push(target),
  );
  try {
    expect(f.state.mode.value).toBe('graph');
    expect(f.state.graphSource.value).toBe('shared');
    f.state.changeLiteral('other');
    f.state.apply();
    f.state.unset();
    expect(changes).toEqual([]);
    expect(f.state.mode.value).toBe('graph');
    f.state.locate();
    expect(visits).toEqual([{ owner: 'data', id: 'shared' }]);
    await f.update({ editable: false });
    f.state.locate();
    expect(visits).toHaveLength(2);
    await f.update({ value: 'inline', editable: true });
    expect(f.state.mode.value).toBe('literal');
    f.state.changeLiteral(' \tnew\r\n ');
    f.state.apply();
    expect(changes).toEqual([' \tnew\r\n ']);
    await f.update({ value: pin });
    f.state.apply();
    expect(changes).toHaveLength(1);
    expect(f.state.dirty.value).toBe(false);
  } finally {
    f.stop();
  }
  expect(validStringOperandDraft(pin)).toBe(false);
  expect(validStringOperandDraft({ ...pin, blackboardKey: 'smuggled' })).toBe(false);
});

it('cannot replace a connected string operand through a stale or synthetic inline field event', async () => {
  const field = actionNodeSchemas.applyBuff.fields.find(f => f.path.at(-1) === 'buffId')!;
  const accepted: unknown[] = [];
  const f = await mountSetup(NodeInspectorFields, {
    value: { kind: 'applyBuff', parameters: { buffId: { kind: 'stringNode', nodeId: 'shared' } } },
    kind: 'applyBuff',
    fields: [field],
    referenceChoices: candidates,
    applyValue: (value: unknown) => {
      accepted.push(value);
      return true;
    },
  });
  try {
    f.state.changeStructured(field, 'known');
    expect(accepted).toEqual([]);
    expect(f.state.apply()).toBe(false);
  } finally {
    f.stop();
  }
});
