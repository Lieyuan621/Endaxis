import type { ComputedRef, InjectionKey } from 'vue';

export interface EaFormFieldContext {
  controlId: ComputedRef<string>;
  describedBy: ComputedRef<string | undefined>;
  invalid: ComputedRef<boolean>;
}

export const eaFormFieldKey: InjectionKey<EaFormFieldContext> = Symbol('ea-form-field');
