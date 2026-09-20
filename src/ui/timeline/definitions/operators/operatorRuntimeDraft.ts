import type {
  OperatorEventHandlerDefinition,
  OperatorPassiveSkillDefinition,
} from '../../../../core/game-data/operatorDefinition';

/** Editable projection of the two role-owned behavior collections. */
export interface OperatorRuntimeDraft {
  passives: readonly OperatorPassiveSkillDefinition[];
  handlers: readonly OperatorEventHandlerDefinition[];
}
