import type { InjectionKey } from 'vue';
import type { DefinitionFieldSchema } from './fieldSchema';

export const DEFINITION_FIELD_WINDOW_DEPTH = 8;
export const DEFINITION_FIELD_WINDOW_ROWS = 50;
export interface DefinitionFieldFocus {
  readonly path: readonly (string | number)[];
  readonly schema: DefinitionFieldSchema;
  readonly name: string;
  readonly editable: boolean;
  readonly referenceKind?: string;
}
export const definitionFieldWindowKey: InjectionKey<{
  focus: (target: DefinitionFieldFocus) => void;
}> = Symbol('definitionFieldWindow');
