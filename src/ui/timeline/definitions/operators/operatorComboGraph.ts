import type { OperatorDefinition } from '../../../../core/game-data/operatorDefinition';
import { buildActionSequenceMindMap, type SkillStructureNode } from '../skillStructureMindMapModel';

export type OperatorComboDocument = Pick<
  OperatorDefinition,
  'comboSkillConditions' | 'comboSkillPriority'
>;

export function buildOperatorComboGraph(value: OperatorComboDocument): SkillStructureNode {
  const children = (value.comboSkillConditions ?? []).map((entry, index): SkillStructureNode => {
    const path = `comboSkillConditions[${index}]`;
    const rebase = (node: SkillStructureNode): SkillStructureNode => {
      const sourcePath = `${path}.sequence${node.sourcePath ? '.' + node.sourcePath : ''}`;
      return { ...node, id: sourcePath, sourcePath, children: node.children.map(rebase) };
    };
    return {
      id: path,
      sourcePath: path,
      label: entry.key || '未命名连携条件',
      kind: '连携注册',
      summary: `${entry.skillKey} · ${entry.initialValues === null ? '禁用' : entry.immediately ? '立即尝试释放' : '打开连携窗口'}`,
      details: {},
      editorSection: 'overview',
      relationToParent: 'member',
      canDelete: true,
      children: [
        {
          ...rebase(buildActionSequenceMindMap(entry.sequence, '事件响应')),
          relationToParent: 'port',
          canDelete: false,
        },
      ],
    };
  });
  return {
    id: 'combo',
    sourcePath: '',
    label: '连携条件',
    kind: '连携集合',
    summary: '角色常驻事件注册',
    details: {},
    editorSection: 'overview',
    canDelete: false,
    canAddChild: 'lifecycle',
    children,
  };
}
