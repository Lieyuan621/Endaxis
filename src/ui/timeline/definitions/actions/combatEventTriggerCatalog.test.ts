import { describe, expect, it } from 'vitest';
import { validateCombatEventTriggerDefinition } from '../../../../core/game-data/validation/actionPrograms';
import { COMBAT_EVENT_TRIGGER_KINDS } from '../../../../core/game-data/operatorDefinition';
import {
  createCombatEventTriggerDraft,
  EDITABLE_COMBAT_EVENT_TRIGGER_KINDS,
} from './combatEventTriggerCatalog';

describe('combatEventTriggerCatalog', () => {
  it('creates a structurally valid draft for every editable trigger kind', () => {
    for (const kind of EDITABLE_COMBAT_EVENT_TRIGGER_KINDS) {
      expect(
        validateCombatEventTriggerDefinition(createCombatEventTriggerDraft(kind), '$.event'),
      ).toEqual([]);
    }
  });

  it('covers every trigger kind declared by the public protocol', () => {
    expect(EDITABLE_COMBAT_EVENT_TRIGGER_KINDS).toEqual(COMBAT_EVENT_TRIGGER_KINDS);
  });
});
