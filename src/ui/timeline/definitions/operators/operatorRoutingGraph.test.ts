import { it, expect } from 'vitest';
import { buildOperatorRoutingGraph } from './operatorRoutingGraph';
import { indexSkillStructureNodes } from '../skillStructureMindMapModel';
import { resolveStructureValue } from '../skillStructureEditorCommands';
import { perlica } from '../../../../data/operators/perlica.generated';
it('projects native routing paths separately from skill library groups', () => {
  const root = buildOperatorRoutingGraph(perlica);
  expect(root.children.map(n => n.sourcePath)).toEqual([
    'playerActionRoutes',
    'skillSlots',
    'playerActionModes',
  ]);
  for (const node of indexSkillStructureNodes(root).values()) {
    if (node.kind.startsWith('未设置') || node.kind.endsWith('集合')) continue;
    expect(resolveStructureValue(perlica, node.sourcePath), node.sourcePath).toBeDefined();
  }
  expect(root.children[0]!.children).toHaveLength(4);
});
it('shows missing command mappings without synthesizing data', () => {
  const value = {
    playerActionModes: [{ modeId: 'mode', modeLayer: 'layer', defaultEnabled: false }],
  };
  const root = buildOperatorRoutingGraph(value);
  const commands = root.children[2]!.children[0]!.children;
  expect(commands).toHaveLength(4);
  expect(commands.every(n => n.kind === '未设置映射')).toBe(true);
  expect(value.playerActionModes[0]).not.toHaveProperty('commandMappings');
});
