import { describe, expect, it } from 'vitest';
import {
  getOperatorDefinitionEditorCoverage,
  OPERATOR_DEFINITION_EDITOR_COVERAGE,
} from './operatorDefinitionEditorCoverage';

describe('operatorDefinitionEditorCoverage', () => {
  it('keeps stable identities read-only and records every currently preserved-only root field', () => {
    expect(OPERATOR_DEFINITION_EDITOR_COVERAGE.slug).toBe('identityReadOnly');
    expect(OPERATOR_DEFINITION_EDITOR_COVERAGE.gameId).toBe('identityReadOnly');
    expect(
      Object.entries(OPERATOR_DEFINITION_EDITOR_COVERAGE)
        .filter(([, status]) => status === 'preservedOnly')
        .map(([field]) => field),
    ).toEqual([
      'skillSlots',
      'playerActionRoutes',
      'playerActionModes',
      'skillAliases',
      'dodgeSkill',
      'dashBuffs',
      'buffDisplayNameKeys',
      'skillDisplayNameKeys',
      'comboSkillPriority',
      'passiveUi',
      'conversionSupport',
    ]);
  });

  it('reports an explicit, exhaustive baseline instead of treating skill validity as root coverage', () => {
    expect(getOperatorDefinitionEditorCoverage()).toEqual({
      identityReadOnly: 2,
      editable: 13,
      structureEditable: 8,
      preservedOnly: 11,
    });
  });
});
