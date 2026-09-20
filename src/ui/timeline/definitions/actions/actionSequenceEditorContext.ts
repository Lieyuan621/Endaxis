import type { InjectionKey } from 'vue';

/** Nested sequence forms contribute edits to their outer sequence's history. */
export const ACTION_SEQUENCE_EDITOR_CONTEXT: InjectionKey<boolean> =
  Symbol('action-sequence-editor');
