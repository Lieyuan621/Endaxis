import { expect, it } from 'vitest';
import { isBuffGraphPayload, isBuffGraphClipboard } from './buffGraphOperations';
import { appendBuffGraphChild } from './buffDamageModifierGraph';
import {
  buildBuffStructureMindMap,
  buildActionSequenceMindMap,
  indexSkillStructureNodes,
} from '../skillStructureMindMapModel';

it.each([
  ['buffPresentation', 'presentation'],
  ['buffChildPresentation', 'childPresentations'],
  ['buffPresentationOrder', 'presentation.orderPriority'],
  ['buffProtection', 'sustainedProtection'],
  ['buffRole', 'role'],
  ['buffSpellBurst', 'spellBurst'],
  ['buffShieldAbsorption', 'shields[0].damageAbsorptions'],
])('图命令不再接管 Inspector 属性 %s', (kind, path) => {
  expect(isBuffGraphPayload(kind)).toBe(false);
  expect(isBuffGraphClipboard({ kind, value: {} })).toBe(false);
  const document = { presentation: {}, shields: [{ damageAbsorptions: [] }] };
  expect(appendBuffGraphChild(document, path).root).toBe(document);
});

it('独立与内联 Buff 的纯表现字段归根 Inspector，不生成属性子节点', () => {
  const definition = {
    stackingType: 'refresh' as const,
    presentation: {
      visible: true,
      orderPriority: { useDirectoryValue: false, value: 2, category: '' },
    },
    childPresentations: [{ buffId: 'child', presentation: {} }],
  };
  const roots = [
    buildBuffStructureMindMap('test', definition),
    buildActionSequenceMindMap({
      steps: [
        {
          kind: 'applyBuff',
          parameters: { buffId: 'test', target: 'caster', definition },
        },
      ],
    }),
  ];
  for (const root of roots) {
    const nodes = [...indexSkillStructureNodes(root).values()];
    expect(
      nodes.some(node =>
        /(?:^|\.)(presentation|childPresentations)(?:\.|\[|$)/.test(node.sourcePath),
      ),
    ).toBe(false);
  }
});
