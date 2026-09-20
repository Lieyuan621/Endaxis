import { describe, expect, it } from 'vitest';
import {
  presentStructureMap,
  structureChildActionTarget,
  type StructureMapNode,
} from './structureMapPresentation';
import { appendCombatStepInStructure } from './skillStructureEditorCommands';
import { buildActionSequenceMindMap } from './skillStructureMindMapModel';

function node(overrides: Partial<StructureMapNode> = {}): StructureMapNode {
  return {
    id: 'scope',
    label: '作用域',
    kind: '战斗步骤',
    summary: '',
    sourcePath: 'steps[0]',
    details: { 步骤类型: 'withActionBlackboardScope' },
    payloadKind: 'combatStep',
    children: [],
    ...overrides,
  };
}
function scope(children: readonly StructureMapNode[] = []): StructureMapNode {
  return node({
    children: [
      node({
        id: 'body',
        label: 'Body',
        kind: '动作序列',
        sourcePath: 'steps[0].body',
        details: {},
        payloadKind: undefined,
        relationToParent: 'port',
        canAddChild: 'step',
        acceptsChildKind: 'combatStep',
        children,
      }),
    ],
  });
}

describe('结构图单序列展示', () => {
  it('接入正式模型生成的单序列节点', () => {
    const root = buildActionSequenceMindMap({
      steps: [
        {
          kind: 'once',
          parameters: { scopeKey: 'test' },
          body: { steps: [{ kind: 'finishCurrentAbilityEntity', parameters: {} }] },
        },
      ],
    });
    const original = root.children[0]!;
    const shown = presentStructureMap(root).children[0]!;
    expect(shown.children[0]!.payloadKind).toBe('combatStep');
    expect(shown.children[0]!.id).toBe(original.children[0]!.children[0]!.id);
    expect(structureChildActionTarget(shown).sourcePath).toBe('steps[0].body');
  });
  it('隐藏端口但保留父节点身份和子动作路径', () => {
    const child = node({ id: 'damage', sourcePath: 'steps[0].body.steps[0]' });
    const original = scope([child]);
    const result = presentStructureMap(original);
    expect(result.children.map(n => n.id)).toEqual(['damage']);
    expect(result.sourcePath).toBe('steps[0]');
    expect(result.children[0]!.sourcePath).toBe(child.sourcePath);
    expect(original.children[0]!.id).toBe('body');
    expect(structureChildActionTarget(result).sourcePath).toBe('steps[0].body');
  });
  it('空序列仍可在父节点添加，并写入真实 body', () => {
    const shown = presentStructureMap(scope());
    expect(shown.children).toHaveLength(0);
    expect(shown.canAddChild).toBe('step');
    expect(shown.acceptsChildKind).toBe('combatStep');
    const root = {
      steps: [{ kind: 'withActionBlackboardScope', parameters: {}, body: { steps: [] } }],
    };
    const updated = appendCombatStepInStructure(
      root,
      structureChildActionTarget(shown).sourcePath,
      { kind: 'finishCurrentAbilityEntity', parameters: {} },
    ).root;
    expect(updated.steps[0]!.body.steps).toHaveLength(1);
  });
  it('自叶子向根压平嵌套单序列', () => {
    const result = presentStructureMap(scope([scope()]));
    expect(result.children[0]!.children).toHaveLength(0);
    expect(result.children[0]!.childActionTarget?.id).toBe('body');
  });
  it.each(['conditional', 'switch'])('保留 %s 的命名端口，即使只有一组', kind => {
    const result = presentStructureMap({ ...scope(), details: { 步骤类型: kind } });
    expect(result.children[0]!.id).toBe('body');
    expect(result.childActionTarget).toBeUndefined();
  });
  it('多组关系和拥有独立添加入口的节点不压平', () => {
    const original = scope();
    expect(
      presentStructureMap({ ...original, children: [...original.children, node()] }).children,
    ).toHaveLength(2);
    expect(
      presentStructureMap({ ...original, canAddChild: 'eventResponse' }).childActionTarget,
    ).toBeUndefined();
  });
});
