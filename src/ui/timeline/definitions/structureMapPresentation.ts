import type { SkillStructureNode } from './skillStructureMindMapModel';

export interface StructureMapNode extends Omit<SkillStructureNode, 'children' | 'editorSection'> {
  readonly editorSection?: SkillStructureNode['editorSection'];
  readonly children: readonly StructureMapNode[];
  /** 隐藏的单序列端口：仅添加、粘贴和向内拖放使用，不能替换父节点的身份。 */
  readonly childActionTarget?: StructureMapNode;
}

/** 只压平展示，不改定义中的路径、动作身份或分支关系。 */
export function presentStructureMap(node: StructureMapNode): StructureMapNode {
  const children = node.children.map(presentStructureMap);
  const port = children.length === 1 ? children[0] : undefined;
  // 多关系语义不能因为当前只有一个分支就被误当作单序列。
  const stepKind = node.details['步骤类型'];
  if (
    node.payloadKind === 'combatStep' &&
    stepKind !== 'conditional' &&
    stepKind !== 'switch' &&
    node.canAddChild === undefined &&
    port?.kind === '动作序列' &&
    port.relationToParent === 'port' &&
    port.canAddChild === 'step'
  ) {
    return {
      ...node,
      children: port.children,
      canAddChild: port.canAddChild,
      acceptsChildKind: port.acceptsChildKind,
      childActionTarget: port,
    };
  }
  return { ...node, children };
}

export function structureChildActionTarget(node: StructureMapNode): StructureMapNode {
  return node.childActionTarget ?? node;
}
