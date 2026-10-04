import { nextTick, ref, shallowRef } from 'vue';
import { writeNodeField } from '../action-graph/nodeFieldValues';
import { sameStructuredValue } from './structuredValue';

/** 整值草稿只在宿主接受后关闭；取消或重开会使旧的异步确认失效。 */
export function useStructuredDraft(
  props: { readonly value: unknown; readonly editable: boolean },
  callbacks: {
    validate: (next: unknown) => void;
    change: (next: unknown) => void;
    discard: () => void;
  },
) {
  const editing = ref(false);
  const draft = shallowRef<unknown>();
  const error = ref('');
  const awaitingAcceptance = ref(false);
  const session = ref(0);

  function reset() {
    session.value++;
    editing.value = false;
    draft.value = undefined;
    error.value = '';
    awaitingAcceptance.value = false;
  }
  function begin() {
    if (!props.editable || editing.value) return;
    session.value++;
    draft.value = props.value;
    editing.value = true;
    error.value = '';
  }
  function discard() {
    reset();
    callbacks.discard();
  }
  function change(path: readonly (string | number)[], value: unknown) {
    if (!props.editable || !editing.value || awaitingAcceptance.value) return;
    if (error.value === 'structuredValue.rejected') callbacks.discard();
    error.value = '';
    draft.value = writeNodeField(draft.value, path.map(String), value);
  }
  async function stage() {
    if (!props.editable || !editing.value || awaitingAcceptance.value) return;
    try {
      callbacks.validate(draft.value);
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause);
      return;
    }
    if (sameStructuredValue(props.value, draft.value)) {
      reset();
      return;
    }
    const applying = session.value;
    const next = draft.value;
    awaitingAcceptance.value = true;
    callbacks.change(next);
    await nextTick();
    if (!editing.value || applying !== session.value) return;
    if (sameStructuredValue(props.value, next)) reset();
    else {
      awaitingAcceptance.value = false;
      error.value = 'structuredValue.rejected';
    }
  }
  return {
    editing,
    draft,
    error,
    awaitingAcceptance,
    session,
    reset,
    begin,
    discard,
    change,
    stage,
  };
}
