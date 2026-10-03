import { expect, it } from 'vitest';
import { stringCollectionDescriptor } from './stringCollectionSchema';
import { validCollectionEntry, validStringCollection } from './stringCollection';
import { referenceCatalog } from './referenceTestFixtures';
import { actionNodeSchemas, dataNodeSchemas } from '../action-graph/actionNodeSchemas.generated';
import { validReferenceDraft } from './referenceDraftValidation';
import { definitionSchemas } from '../definition-editor/definitionSchemas.generated';

it('uses all generated tag collections including aggregate heal variants without guessing ordinary arrays', () => {
  const rows = [...Object.values(actionNodeSchemas), ...Object.values(dataNodeSchemas)].flatMap(
    s => s.fields,
  );
  expect(
    rows.filter(field => stringCollectionDescriptor(field)?.kind === 'gameplayTag'),
  ).toHaveLength(13);
  expect(
    stringCollectionDescriptor(actionNodeSchemas.heal.fields.find(f => f.path.at(-1) === 'tags')!),
  ).toEqual({ kind: 'gameplayTag' });
  expect(
    stringCollectionDescriptor({ kind: 'array', element: { kind: 'string' } }),
  ).toBeUndefined();
  expect(
    stringCollectionDescriptor(
      { kind: 'array', element: { kind: 'object', fields: {} } },
      'buffIds',
      'buff',
    ),
  ).toBeUndefined();
});
it('keeps asset references strict and classifies formal GlobalBuff IDs as an open native query', () => {
  for (const [kind, name, family] of [
    ['applyBuff', 'inheritToNextSkillIds', 'skill'],
    ['finishBuffsById', 'buffIds', 'buff'],
    ['findOwnerSpawnedAbilityEntities', 'abilityEntityIds', 'abilityEntity'],
  ] as const)
    expect(
      stringCollectionDescriptor(actionNodeSchemas[kind].fields.find(f => f.path.at(-1) === name)!),
    ).toEqual({ kind: 'reference', referenceKind: family });
  expect(
    stringCollectionDescriptor(
      actionNodeSchemas.finishGlobalBuffsById.fields.find(f => f.path.at(-1) === 'globalBuffIds')!,
    ),
  ).toEqual({ kind: 'nativeId' });
});
it('retains imported stale strings and duplicates without allowing new invalid selections or mutation', () => {
  const old = Object.freeze(['stale', 'stale']);
  const choices = { buff: referenceCatalog() };
  expect(
    validStringCollection(['stale', 'known', 'stale'], old, 'reference', 'buff', choices),
  ).toBe(true);
  expect(
    validStringCollection(['stale', 'stale', 'stale'], old, 'reference', 'buff', choices),
  ).toBe(false);
  expect(validStringCollection([], old, 'reference', 'buff', choices)).toBe(true);
  expect(
    validStringCollection(['known'], old, 'reference', 'buff', {
      buff: referenceCatalog('buff', []),
    }),
  ).toBe(false);
  expect(validStringCollection(['known'], old, 'reference', 'buff')).toBe(false);
  expect(old).toEqual(['stale', 'stale']);
});
it('accepts readable custom paths, rejects malformed new tags, and validates creator completion', () => {
  expect(validCollectionEntry('Custom/Effect', 'gameplayTag')).toBe(true);
  for (const value of ['', 'A//B', 'unknown/path', ' Custom/Effect '])
    expect(validCollectionEntry(value, 'gameplayTag')).toBe(false);
  expect(validStringCollection(['A/B', 'A/B'], [], 'gameplayTag')).toBe(true);
  const schema = definitionSchemas.abilityEntity.fields.bornTags;
  expect(validReferenceDraft(schema, ['Custom/Effect'], undefined)).toBe(true);
  expect(validReferenceDraft(schema, ['A//B'], undefined)).toBe(false);
});

it('only admits the formally declared native-ID list and enforces its exact string contract', () => {
  const field = actionNodeSchemas.finishGlobalBuffsById.fields.find(
    f => f.path.at(-1) === 'globalBuffIds',
  )!;
  expect(
    stringCollectionDescriptor({ ...field, source: ['custom/actions.ts:738:5'] }),
  ).toBeUndefined();
  expect(stringCollectionDescriptor({ ...field, source: undefined })).toBeUndefined();
  expect(
    stringCollectionDescriptor({ ...field, path: ['other', 'globalBuffIds'] }),
  ).toBeUndefined();
  expect(
    stringCollectionDescriptor({
      ...field,
      semantics: { type: 'readonly number[]', arrayElement: { type: 'number' } },
    }),
  ).toBeUndefined();
  expect(
    stringCollectionDescriptor({ kind: 'array', element: { kind: 'string' } }, 'globalBuffIds'),
  ).toBeUndefined();
  const exact = ['unknown', ' unknown ', ' ', '\t', '\r\n', 'unknown'];
  expect(validStringCollection(exact, [], 'nativeId', undefined, {})).toBe(true);
  for (const value of [[], [''], ['ok', ''], [1], undefined, 'id'])
    expect(validStringCollection(value, value, 'nativeId')).toBe(false);
  expect(
    validReferenceDraft(field.valueSchema!, exact, undefined, undefined, 'globalBuffIds'),
  ).toBe(true);
  expect(validReferenceDraft(field.valueSchema!, [''], undefined, undefined, 'globalBuffIds')).toBe(
    false,
  );
});
