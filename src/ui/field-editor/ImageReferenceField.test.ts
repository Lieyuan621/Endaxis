import { expect, it } from 'vitest';
import { mountSetup } from '../../test/componentSetup';
import ImageReferenceField from './ImageReferenceField.vue';
import { resolveFieldEditor } from './fieldEditorDispatch';
import { definitionSchemas } from '../definition-editor/definitionSchemas.generated';

it('selects catalog resources, clears overrides and rejects writes in read-only mode', async () => {
  expect(resolveFieldEditor(definitionSchemas.weapon.fields.icon).control).toBe('image');
  const changes: unknown[] = [];
  const f = await mountSetup(ImageReferenceField, {
    value: undefined,
    label: 'Icon',
    optional: true,
    onChange: (v: unknown) => changes.push(v),
  });
  try {
    f.state.choose('endaxis:operators/arcane/ultimate_02');
    f.state.choose('endaxis:missing');
    await f.update({ readonly: true });
    f.state.choose(undefined);
    expect(changes).toEqual(['endaxis:operators/arcane/ultimate_02']);
    await f.update({ readonly: false });
    f.state.choose(undefined);
    expect(changes).toEqual(['endaxis:operators/arcane/ultimate_02', undefined]);
  } finally {
    f.stop();
  }
});
