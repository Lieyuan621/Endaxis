import { expect, it } from 'vitest';
import {
  operatorWorkspaceIssueTarget,
  operatorWorkspaceTargetArea,
} from './operatorWorkspaceStructure';
it.each([
  ['$.passiveUi.normalBuffId', 'presentation'],
  ['talents[1].levels', 'talents'],
  ['$.potentials[4].modifiers[0]', 'potentials'],
  ['$.entityBlackboardInitializers[0].condition', 'initialization'],
  ['$.trustAttributeBonus.values[0]', 'growth'],
  ['$.eventHandlers[0].sequence', 'listeners'],
])('resolves %s using shared ownership', (path, area) => {
  const target = operatorWorkspaceIssueTarget(path);
  expect(target).toBeDefined();
  expect(operatorWorkspaceTargetArea(target!)).toBe(area);
});
it('preserves literal dictionary keys and rejects unknown roots', () => {
  expect(
    operatorWorkspaceIssueTarget('$.buffDefinitions["buff.with.dot"].durationSeconds'),
  ).toEqual({
    kind: 'field',
    field: 'buffDefinitions',
    path: ['buff.with.dot', 'durationSeconds'],
  });
  expect(operatorWorkspaceIssueTarget('$.unknown.field')).toBeUndefined();
});
