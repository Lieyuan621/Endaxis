import { describe, expect, it } from 'vitest';
import { definitionSchemas } from './definitionSchemas.generated';
import {
  assertEditableDefinitionField,
  editableDefault,
  emptyDefinitionActionGraph,
  fieldSchemaForValue,
} from './definitionFieldRuntime';
import { perlica } from '../../data/operators/perlica.generated';

describe('definition field command boundary', () => {
  it('preserves required nullable skill routes instead of treating null as a removable field', () => {
    const skillSchema = fieldSchemaForValue(definitionSchemas.skill, { skillType: 'basicAttack' });
    if (skillSchema.kind !== 'object') throw new Error('expected skill fields');
    const windows = skillSchema.fields.inputWindows;
    if (windows?.kind !== 'object') throw new Error('expected input windows');
    const mappings = windows.fields.commandMappings;
    if (mappings?.kind !== 'array') throw new Error('expected command mappings');
    const mapping = { startFrame: 0, endFrame: 10, input: 'basicAttack', targetSkillId: null };
    for (const target of [null, 'next_skill']) {
      expect(() =>
        assertEditableDefinitionField(mappings.element, mapping, ['targetSkillId'], target),
      ).not.toThrow();
    }
    expect(() =>
      assertEditableDefinitionField(mappings.element, mapping, ['targetSkillId'], undefined),
    ).toThrow();
    expect(
      fieldSchemaForValue({ kind: 'union', variants: [{ kind: 'null' }, { kind: 'string' }] }, null)
        .kind,
    ).toBe('null');
    expect(editableDefault({ kind: 'null' })).toBeNull();
  });
  it('marks native conditions for a dedicated editor instead of guessing a union branch', () => {
    const schema = fieldSchemaForValue(definitionSchemas.skill, { skillType: 'basicAttack' });
    expect(schema.kind).toBe('object');
    if (schema.kind !== 'object') return;
    expect(schema.fields.availability?.kind).toBe('condition');
    expect(schema.fields.levelSource?.optional).not.toBe(true);
    const dodge = fieldSchemaForValue(definitionSchemas.skill, perlica.dodgeSkill);
    expect(dodge.kind).toBe('object');
    if (dodge.kind === 'object') expect(dodge.fields.levelSource?.optional).toBe(true);
  });
  it('accepts known scalar fields and rejects identity, unknown or invalid input', () => {
    expect(() =>
      assertEditableDefinitionField(definitionSchemas.operator, perlica, ['rarity'], 6),
    ).not.toThrow();
    expect(() =>
      assertEditableDefinitionField(definitionSchemas.operator, perlica, ['rarity'], 7),
    ).toThrow(/choice/);
    expect(() =>
      assertEditableDefinitionField(definitionSchemas.operator, perlica, ['slug'], 'other'),
    ).toThrow(/read-only/);
    expect(() =>
      assertEditableDefinitionField(definitionSchemas.operator, perlica, ['madeUp'], 1),
    ).toThrow(/unknown/);
    expect(() =>
      assertEditableDefinitionField(definitionSchemas.operator, perlica, ['gameId'], 'other'),
    ).toThrow(/read-only/);
    expect(() =>
      assertEditableDefinitionField(
        definitionSchemas.operator,
        perlica,
        ['displayName'],
        undefined,
      ),
    ).not.toThrow();
  });
  it('keeps an unmatched union read-only instead of recursively rendering the same union', () => {
    const shape = {
      kind: 'union',
      variants: [{ kind: 'object', fields: { kind: { kind: 'enum', options: ['known'] } } }],
    } as const;
    expect(fieldSchemaForValue(shape, { kind: 'unknown' }).kind).toBe('opaque');
  });
  it('does not invent scalar values when adding structured entries', () => {
    expect(editableDefault({ kind: 'number' })).toBeUndefined();
    expect(editableDefault({ kind: 'string' })).toBeUndefined();
    expect(editableDefault({ kind: 'enum', options: ['first', 'second'] })).toBeUndefined();
    expect(editableDefault({ kind: 'enum', options: ['only'] })).toBe('only');
    expect(editableDefault({ kind: 'object', fields: { id: { kind: 'string' } } })).toBeUndefined();
  });
  it('checks nested replacements without letting a container edit change identity or opaque data', () => {
    const schema = {
      kind: 'object',
      fields: {
        entries: {
          kind: 'array',
          element: {
            kind: 'object',
            fields: {
              key: { kind: 'string' },
              amount: { kind: 'number' },
              graph: { kind: 'graph' },
            },
          },
        },
      },
    } as const;
    const graph = { nodes: [] };
    const original = { entries: [{ key: 'first', amount: 1, graph }] };
    expect(() =>
      assertEditableDefinitionField(
        schema,
        original,
        ['entries'],
        [{ key: 'first', amount: 2, graph }],
      ),
    ).not.toThrow();
    expect(() =>
      assertEditableDefinitionField(
        schema,
        original,
        ['entries'],
        [{ key: 'second', amount: 2, graph }],
      ),
    ).toThrow(/read-only/);
    expect(() =>
      assertEditableDefinitionField(
        schema,
        original,
        ['entries'],
        [{ key: 'first', amount: 2, graph: { nodes: [] } }],
      ),
    ).toThrow(/cannot be changed/);
  });
  it('allows a nested skill reference while protecting the resource skill identity', () => {
    const schema = {
      kind: 'object',
      fields: {
        skillId: { kind: 'string' },
        mapping: { kind: 'object', fields: { skillId: { kind: 'string' } } },
      },
    } as const;
    const value = { skillId: 'source', mapping: { skillId: 'old' } };
    expect(() => assertEditableDefinitionField(schema, value, ['skillId'], 'new')).toThrow(
      /read-only/,
    );
    expect(() =>
      assertEditableDefinitionField(schema, value, ['mapping', 'skillId'], 'new'),
    ).not.toThrow();
  });
  it('does not change a skill identity by replacing its containing list', () => {
    const schema = {
      kind: 'object',
      fields: {
        skills: {
          kind: 'array',
          element: {
            kind: 'object',
            fields: {
              skillId: { kind: 'string' },
              actionGraph: { kind: 'graph' },
            },
          },
        },
      },
    } as const;
    const graph = { main: { nodes: {} } };
    const current = { skills: [{ skillId: 'one', actionGraph: graph }] };
    expect(() =>
      assertEditableDefinitionField(
        schema,
        current,
        ['skills'],
        [{ skillId: 'two', actionGraph: graph }],
      ),
    ).toThrow(/read-only/);
  });
  it('creates an optional empty graph without allowing arbitrary graph replacement', () => {
    const schema = {
      kind: 'object',
      fields: { actionGraph: { kind: 'graph', optional: true } },
    } as const;
    expect(() =>
      assertEditableDefinitionField(schema, {}, ['actionGraph'], emptyDefinitionActionGraph()),
    ).not.toThrow();
    expect(() =>
      assertEditableDefinitionField(schema, {}, ['actionGraph'], {
        main: { nodes: { injected: { action: { kind: 'noop' }, next: null } } },
        macros: {},
      }),
    ).toThrow(/cannot be changed/);
  });
});
