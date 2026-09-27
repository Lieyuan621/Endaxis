import { expect, it } from 'vitest';
import { createEditorSelection } from './editorSelection';

it('字段、节点、调度和连线互斥，清理旧面板不会清掉新选择', () => {
  const selection = createEditorSelection();
  selection.field.value = 'durationFrames';
  selection.selectedId.value = 'node_1';
  expect(selection.field.value).toBeNull();
  selection.selectedDataId.value = 'value_1';
  selection.selectedId.value = null;
  expect(selection.selectedDataId.value).toBe('value_1');
  selection.selectedEntryId.value = 'timeline:0';
  expect(selection.selectedDataId.value).toBeNull();
  const connection = { nodeId: null, entryId: 'timeline:0', targetId: 'node_1' };
  selection.selectedConnection.value = connection;
  expect(selection.selectedEntryId.value).toBeNull();
  expect(selection.current.value).toEqual({ kind: 'connection', connection });
  selection.field.value = 'rarity';
  selection.selectedConnection.value = null;
  expect(selection.field.value).toBe('rarity');
  selection.clear();
  expect(selection.current.value).toBeNull();
});
