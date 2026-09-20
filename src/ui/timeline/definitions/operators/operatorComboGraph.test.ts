import { expect, it } from 'vitest';
import { buildOperatorComboGraph, type OperatorComboDocument } from './operatorComboGraph';
import { perlica } from '../../../../data/operators/perlica.generated';
import { resolveStructureValue } from '../skillStructureEditorCommands';

it('projects native registrations and response steps without synthetic saved skill wrappers', () => {
  const value: OperatorComboDocument = perlica;
  const root = buildOperatorComboGraph(value);
  expect(root.children).toHaveLength(perlica.comboSkillConditions!.length);
  function visit(node: typeof root) {
    if (node.sourcePath && !node.canAddChild)
      expect(resolveStructureValue(value, node.sourcePath), node.sourcePath).not.toBeUndefined();
    node.children.forEach(visit);
  }
  visit(root);
  expect(root.children[0]!.children[0]!.sourcePath).toBe('comboSkillConditions[0].sequence');
  expect(root.children[0]!.children[0]!.canDelete).toBe(false);
});

it('keeps disabled registrations visible, distinguishes immediate casts, and has no invented empty entries', () => {
  expect(buildOperatorComboGraph({}).children).toEqual([]);
  const first = perlica.comboSkillConditions![0]!;
  expect(
    buildOperatorComboGraph({ comboSkillConditions: [{ ...first, initialValues: null }] })
      .children[0]!.summary,
  ).toContain('禁用');
  expect(
    buildOperatorComboGraph({
      comboSkillConditions: [{ ...first, initialValues: {}, immediately: true }],
    }).children[0]!.summary,
  ).toContain('立即尝试释放');
});
