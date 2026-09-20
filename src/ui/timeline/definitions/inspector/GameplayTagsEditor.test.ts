import { expect, it } from 'vitest';
import { conditionInspectorFields } from './conditionInspectorSchema';
import { defaultInspectorEditors } from './inspectorEditors';

it('replaces every editable raw GameplayTag number list', () => {
  for (const [kind, key] of [
    ['eventBuffTagsMatch', 'buffTags'],
    ['entityTagMatch', 'tags'],
  ] as const) {
    const field = conditionInspectorFields(kind)!.find(field => field.key === key)!;
    expect(field.editor).toBe('textList');
    expect(field.widget).toBe('gameplayTags');
  }
  expect(defaultInspectorEditors.gameplayTags).toBeDefined();
});
