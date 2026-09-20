import { expect, it } from 'vitest';
import {
  OPERATOR_WORKSPACE_FIELDS,
  operatorWorkspaceTargetArea,
  operatorWorkspaceTargetPath,
} from './operatorWorkspaceStructure';

it('addresses fixed slots and exact growth cells without editable keys or page state', () => {
  expect(operatorWorkspaceTargetPath({ kind: 'talent', slot: 1 })).toEqual(['talents', 1]);
  expect(operatorWorkspaceTargetPath({ kind: 'potential', slot: 4 })).toEqual(['potentials', 4]);
  const field = { kind: 'field', field: 'attributes', path: ['baseAttack', 5] } as const;
  expect(operatorWorkspaceTargetPath(field)).toEqual(['attributes', 'baseAttack', 5]);
  expect(operatorWorkspaceTargetArea(field)).toBe('growth');
  expect(operatorWorkspaceTargetPath({ kind: 'area', area: 'growth' })).toBeUndefined();
});

it('keeps presentation grouping separate from action routing and provenance', () => {
  expect(OPERATOR_WORKSPACE_FIELDS.skillGroups.area).toBe('skills');
  expect(OPERATOR_WORKSPACE_FIELDS.playerActionRoutes.area).toBe('actionRouting');
  expect(OPERATOR_WORKSPACE_FIELDS.skillAliases.access).toBe('readonly');
  expect(OPERATOR_WORKSPACE_FIELDS.conversionSupport.access).toBe('readonly');
});
