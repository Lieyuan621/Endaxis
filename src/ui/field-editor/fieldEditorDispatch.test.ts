import { describe, expect, it } from 'vitest';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import type { NodeFieldSchema } from '../action-graph/nodeSchema';
import { resolveFieldEditor } from './fieldEditorDispatch';
import { actionNodeSchemas, dataNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { definitionSchemas } from '../definition-editor/definitionSchemas.generated';
import { fieldSchemaForValue } from '../definition-editor/definitionFieldRuntime';

const reference = { referenceKind: 'buff' as const };
function node(control: NodeFieldSchema['control'], name = 'buffId'): NodeFieldSchema {
  return {
    path: [name],
    description: '',
    control,
    valueSchema: {
      kind: control === 'string' ? 'string' : 'opaque',
      ...(['buffId', 'skillId'].includes(name) ? reference : {}),
    },
  };
}

describe('shared field editor dispatch', () => {
  it('consumes representative generated schemas without changing their controls or values', () => {
    const buff = definitionSchemas.consumable.fields.applications.element.fields.buffId;
    expect(resolveFieldEditor(buff, { name: 'buffId' })).toMatchObject({
      control: 'reference',
      referenceKind: 'buff',
    });
    const dynamicBuff = actionNodeSchemas.applyBuff.fields.find(
      field => field.path.at(-1) === 'buffId',
    )!;
    expect(resolveFieldEditor(dynamicBuff)).toMatchObject({
      control: 'stringOperand',
      referenceKind: 'buff',
      edit: 'field',
    });
    expect(
      resolveFieldEditor(definitionSchemas.enemy.fields.levelHp, { name: 'levelHp' }),
    ).toMatchObject({
      semantic: 'tuple',
      readonly: true,
    });
    const levelValues = definitionSchemas.skill.variants[0].fields.cooldownFrames;
    const branch = fieldSchemaForValue(levelValues, 10);
    // The adapter carries the declaration's semantic metadata into dispatch only;
    // the branch's identity is still available to the existing union selector.
    expect(resolveFieldEditor({ ...branch, semantics: levelValues.semantics })).toMatchObject({
      control: 'levelValues',
      semantic: 'levelValues',
    });
    expect(fieldSchemaForValue(levelValues, 10)).toBe(branch);
  });

  it('keeps plain human text and unverified similarly named fields as text', () => {
    for (const name of ['name', 'description', 'buffId', 'skillId', 'customCode']) {
      expect(resolveFieldEditor({ kind: 'string' }, { name })).toMatchObject({
        control: 'string',
        semantic: 'plain',
        view: 'value',
        edit: 'field',
      });
    }
  });

  it('keeps equipment SkillData provenance as text rather than an operator picker', () => {
    expect(resolveFieldEditor({ kind: 'string' }, { name: 'skillId' })).toMatchObject({
      control: 'string',
      semantic: 'plain',
    });
  });

  it('dispatches contract references identically across surfaces without needing candidates', () => {
    const definition = resolveFieldEditor({ kind: 'string', ...reference }, { name: 'buffId' });
    expect(definition).toEqual(resolveFieldEditor(node('string')));
    expect(definition).toMatchObject({
      control: 'reference',
      referenceKind: 'buff',
      view: 'reference',
      edit: 'field',
    });
    expect(
      resolveFieldEditor({ kind: 'string', ...reference }, { name: 'buffId', editable: false }),
    ).toMatchObject({
      control: 'reference',
      view: 'reference',
      edit: 'none',
      readonly: true,
    });
  });

  it('uses explicit family context without inventing declaration or write protection', () => {
    expect(resolveFieldEditor({ kind: 'string' }, { referenceKind: 'skill' })).toMatchObject({
      control: 'reference',
      referenceKind: 'skill',
    });
    expect(
      resolveFieldEditor(node('string', 'skillId'), { protectedIdentity: true }),
    ).toMatchObject({
      control: 'string',
      semantic: 'identity',
      edit: 'none',
      readonly: true,
    });
    expect(resolveFieldEditor(node('string', 'skillId'))).toMatchObject({
      control: 'reference',
      edit: 'field',
    });
    expect(resolveFieldEditor({ kind: 'string' }, { name: 'key' })).toMatchObject({
      control: 'string',
      edit: 'field',
    });
  });

  it('retains families on containers and selected string alternatives without replacing their controls', () => {
    const variants: readonly DefinitionFieldSchema[] = [
      { kind: 'string' },
      { kind: 'object', fields: { blackboardKey: { kind: 'string' } } },
    ];
    for (const schema of [
      { kind: 'array', element: variants[0]! },
      { kind: 'record', value: variants[0]! },
      { kind: 'union', variants },
    ] as const) {
      const parent = resolveFieldEditor({ ...schema, ...reference }, { name: 'buffId' });
      expect(parent).toMatchObject({
        control: schema.kind === 'array' ? 'stringCollection' : schema.kind,
        referenceKind: 'buff',
        edit: schema.kind === 'array' ? 'field' : 'recursive',
      });
      expect(
        resolveFieldEditor(variants[0]!, { referenceKind: parent.referenceKind }).control,
      ).toBe('reference');
      expect(
        resolveFieldEditor(variants[1]!, { referenceKind: parent.referenceKind }).control,
      ).toBe('object');
    }
    expect(resolveFieldEditor({ kind: 'string' }, { name: 'blackboardKey' }).control).toBe(
      'string',
    );
    expect(resolveFieldEditor(node('string', 'outputKey')).referenceKind).toBeUndefined();
    expect(resolveFieldEditor(node('string', 'buffIdOutputKey')).referenceKind).toBeUndefined();
  });

  it('recognizes reference list declarations without treating the whole list as a picker', () => {
    expect(
      resolveFieldEditor(
        {
          kind: 'array',
          element: { kind: 'string' },
          referenceKind: 'skill',
        },
        { name: 'skillKeys' },
      ),
    ).toMatchObject({ control: 'stringCollection', referenceKind: 'skill' });
  });

  it('recognizes aliases while preserving existing controls and runtime boundaries', () => {
    for (const [alias, semantic] of [
      ['ActionStringOperand', 'stringOperand'],
      ['ActionValueOperand', 'valueOperand'],
      ['LevelValues', 'levelValues'],
      ['CombatCondition', 'combatCondition'],
      ['BuildCondition', 'buildCondition'],
      ['GameplayTag', 'gameplayTag'],
    ] as const) {
      const semantics = { aliases: [alias] };
      expect(
        resolveFieldEditor({ ...node('json'), valueSchema: { kind: 'opaque', semantics } }),
      ).toMatchObject({
        control: alias === 'ActionStringOperand' ? 'stringOperand' : 'json',
        semantic,
        ...(alias === 'ActionStringOperand' ? {} : { fallback: 'structured-editor-pending' }),
      });
      expect(
        resolveFieldEditor({ kind: 'union', variants: [{ kind: 'number' }], semantics }),
      ).toMatchObject({
        control:
          alias === 'ActionStringOperand'
            ? 'stringOperand'
            : alias === 'LevelValues'
              ? 'levelValues'
              : alias === 'ActionValueOperand'
                ? 'operand'
                : 'union',
        semantic,
        ...(alias === 'ActionValueOperand'
          ? { readonly: true, edit: 'none', fallback: 'structured-editor-pending' }
          : {}),
      });
    }
    expect(
      resolveFieldEditor({
        ...node('levelValues'),
        valueSchema: { kind: 'number', semantics: { aliases: ['LevelValues'] } },
      }),
    ).toMatchObject({ control: 'levelValues', semantic: 'levelValues', edit: 'field' });
    expect(
      resolveFieldEditor({
        kind: 'array',
        element: { kind: 'number' },
        semantics: {
          arrayElement: { aliases: ['ActionValueOperand'] },
        },
      }).semantic,
    ).toBe('plain');
  });

  it('has explicit fallback reasons for structured gaps and preserves navigation boundaries', () => {
    expect(
      resolveFieldEditor({
        kind: 'opaque',
        semantics: {
          tuple: { elements: [], minLength: 2 },
        },
      }),
    ).toMatchObject({
      control: 'opaque',
      semantic: 'tuple',
      readonly: true,
    });
    expect(
      resolveFieldEditor({ kind: 'opaque', fallback: { reason: 'depth-limit' } }).fallback,
    ).toBe('depth-limit');
    expect(resolveFieldEditor({ kind: 'condition' }).fallback).toBe('condition-editor-pending');
    for (const schema of [{ kind: 'graph' }, node('sequence'), node('resource')] as const) {
      expect(resolveFieldEditor(schema)).toMatchObject({
        view: 'navigation',
        edit: 'none',
        readonly: true,
      });
      expect(resolveFieldEditor(schema).fallback).toBeDefined();
    }
    expect(resolveFieldEditor({ kind: 'opaque' }).fallback).toBe('unsupported-type');
  });
});

it('dispatches both generated combat-condition lists without granting container pins or definition-tree editing', () => {
  for (const kind of ['all', 'any']) {
    const field = dataNodeSchemas[`boolean:${kind}`]!.fields[0]!;
    expect(resolveFieldEditor(field)).toMatchObject({
      control: 'conditionList',
      semantic: 'combatConditionList',
      view: 'structure',
      edit: 'field',
    });
    expect(resolveFieldEditor(field).fallback).toBeUndefined();
    expect(resolveFieldEditor(field, { editable: false })).toMatchObject({
      control: 'conditionList',
      edit: 'none',
      readonly: true,
    });
    for (const alias of ['BuildCondition', 'ActionValueOperand'] as const)
      expect(
        resolveFieldEditor({
          ...field,
          valueSchema: {
            ...field.valueSchema,
            semantics: { ...field.valueSchema.semantics!, arrayElement: { aliases: [alias] } },
          },
        }).control,
      ).toBe('json');
    expect(
      resolveFieldEditor({
        ...field,
        valueSchema: { ...field.valueSchema, semantics: { arrayElement: {} } },
      }).control,
    ).toBe('json');
  }
  expect(
    resolveFieldEditor({
      kind: 'array',
      element: { kind: 'condition' },
      semantics: {
        arrayElement: { aliases: ['CombatCondition'] },
      },
    }).control,
  ).toBe('array');
});

it('routes the formal open native-ID query without an asset family or graph connection', () => {
  const field = actionNodeSchemas.finishGlobalBuffsById.fields.find(
    f => f.path.at(-1) === 'globalBuffIds',
  )!;
  expect(resolveFieldEditor(field)).toMatchObject({
    control: 'stringCollection',
    semantic: 'nativeId',
    edit: 'field',
    readonly: false,
  });
  expect(resolveFieldEditor(field).referenceKind).toBeUndefined();
  expect(resolveFieldEditor(field).fallback).toBeUndefined();
  expect(resolveFieldEditor(field, { editable: false })).toMatchObject({
    edit: 'none',
    readonly: true,
  });
  expect(resolveFieldEditor(field.valueSchema!, { name: 'globalBuffIds' }).semantic).toBe(
    'nativeId',
  );
});
