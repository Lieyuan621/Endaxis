import { computed } from 'vue';
import type { ActionGraphAddress } from '../../application/editor/actionGraphResourceEditing';
import { createEditorSelection, type EditorSelection } from './editorSelection';

/** 同一资源的检查器选择与图导航共用此状态；切换资源不改变它。 */
export interface ResourceEditorView {
  selection: EditorSelection;
  graphAddress: ActionGraphAddress;
}

export function createResourceEditorView(): ResourceEditorView {
  return { selection: null, graphAddress: { kind: 'main' } };
}

export function resourceEditorSelection(view: () => ResourceEditorView) {
  return createEditorSelection(
    computed({
      get: () => view().selection,
      set: value => {
        view().selection = value;
      },
    }),
  );
}

export function resourceGraphAddress(view: () => ResourceEditorView) {
  return computed({
    get: () => view().graphAddress,
    set: value => {
      view().graphAddress = value;
    },
  });
}
