import { computed, shallowRef, type Ref } from 'vue';

export interface EditorConnectionSelection {
  readonly nodeId: string | null;
  readonly entryId: string | null;
  readonly targetId: string;
}

export type EditorSelection =
  | { readonly kind: 'field' | 'action' | 'data' | 'entry'; readonly id: string }
  | { readonly kind: 'connection'; readonly connection: EditorConnectionSelection }
  | null;

/** 同一编辑内容只有一个选择；浏览器导航和输入焦点不属于此状态。 */
export function createEditorSelection(current: Ref<EditorSelection> = shallowRef(null)) {
  function idFor(kind: 'field' | 'action' | 'data' | 'entry') {
    return computed({
      get: () => (current.value?.kind === kind && 'id' in current.value ? current.value.id : null),
      set: (id: string | null) => {
        if (id !== null) current.value = { kind, id };
        else if (current.value?.kind === kind) current.value = null;
      },
    });
  }
  const selectedConnection = computed({
    get: () => (current.value?.kind === 'connection' ? current.value.connection : null),
    set: (connection: EditorConnectionSelection | null) => {
      if (connection !== null) current.value = { kind: 'connection', connection };
      else if (current.value?.kind === 'connection') current.value = null;
    },
  });
  return {
    current: computed(() => current.value),
    field: idFor('field'),
    selectedId: idFor('action'),
    selectedDataId: idFor('data'),
    selectedEntryId: idFor('entry'),
    selectedConnection,
    clear: () => {
      current.value = null;
    },
  };
}

export type EditorSelectionState = ReturnType<typeof createEditorSelection>;
