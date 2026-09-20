import { describe, expect, it } from 'vitest';
import type { MechanicDefinitionRef } from './gameDataRepository';
import { validateMechanicSelections } from './mechanicValidation';

const mechanic: MechanicDefinitionRef = {
  id: 'season-tower:test',
  family: 'seasonTower',
  revision: 'fixture:1',
  parameters: [
    { key: 'damageUp', type: 'number', required: true },
    { key: 'label', type: 'string', required: false },
  ],
};

describe('validateMechanicSelections', () => {
  it('accepts parameters declared by the referenced mechanic', () => {
    const issues = validateMechanicSelections(
      {
        selections: [
          {
            id: 'selection:1',
            mechanicId: mechanic.id,
            enabled: true,
            parameters: { damageUp: 0.5 },
          },
        ],
      },
      { getMechanic: id => (id === mechanic.id ? mechanic : null) },
    );

    expect(issues).toEqual([]);
  });

  it('reports unknown mechanics without guessing their parameter contract', () => {
    const issues = validateMechanicSelections(
      {
        selections: [{ id: 'selection:1', mechanicId: 'missing', enabled: true, parameters: {} }],
      },
      { getMechanic: () => null },
    );

    expect(issues).toEqual([
      {
        path: '$.mechanics.selections[0].mechanicId',
        message: 'unknown mechanic',
      },
    ]);
  });

  it('reports missing, unknown, and incorrectly typed parameters', () => {
    const issues = validateMechanicSelections(
      {
        selections: [
          {
            id: 'selection:1',
            mechanicId: mechanic.id,
            enabled: true,
            parameters: { label: 1, unsupported: true },
          },
        ],
      },
      { getMechanic: () => mechanic },
      '$.scenarios[0].mechanics',
    );

    expect(issues).toEqual([
      {
        path: '$.scenarios[0].mechanics.selections[0].parameters.damageUp',
        message: 'missing required mechanic parameter',
      },
      {
        path: '$.scenarios[0].mechanics.selections[0].parameters.label',
        message: "expected mechanic parameter type 'string'",
      },
      {
        path: '$.scenarios[0].mechanics.selections[0].parameters.unsupported',
        message: 'unknown mechanic parameter',
      },
    ]);
  });
});
