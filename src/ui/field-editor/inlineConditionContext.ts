import type { ComputedRef, InjectionKey } from 'vue';
import type { BlackboardFieldContext } from '../../application/editor/blackboardFieldContext';
export const definitionConditionContextKey: InjectionKey<ComputedRef<BlackboardFieldContext>> =
  Symbol('definitionConditionContext');
/** Only a condition's local draft is allowed to edit its children before whole-value validation. */
export const inlineConditionDraftKey: InjectionKey<ComputedRef<unknown>> =
  Symbol('inlineConditionDraft');
/** Render-only repair is confined to an active transaction, never imported readonly values. */
export const inlineConditionEditingKey: InjectionKey<ComputedRef<boolean>> =
  Symbol('inlineConditionEditing');
