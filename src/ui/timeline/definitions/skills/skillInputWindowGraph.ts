import type { SkillDefinition } from '../../../../core/game-data/operatorDefinition';
import type { SkillStructureNode } from '../skillStructureMindMapModel';
function node(
  path: string,
  label: string,
  children: readonly SkillStructureNode[] = [],
): SkillStructureNode {
  return {
    id: path,
    sourcePath: path,
    label,
    kind: '输入窗口',
    summary: '',
    details: {},
    children,
    editorSection: 'overview',
    relationToParent: 'port',
  };
}
export function buildSkillInputWindowGraph(skill: SkillDefinition): SkillStructureNode {
  const windows = skill.inputWindows;
  if (!windows)
    return { ...node('inputWindows', '输入窗口'), summary: '未设置', canAddChild: 'lifecycle' };
  return {
    ...node(
      'inputWindows',
      '输入窗口',
      (['commandMappings', 'allowedNextSkills'] as const).map(kind => {
        const path = `inputWindows.${kind}`;
        return {
          ...node(
            path,
            kind === 'commandMappings' ? '操作映射窗口' : '允许接续窗口',
            (windows[kind] ?? []).map((window, index) => ({
              ...node(`${path}[${index}]`, `窗口 ${index + 1}`),
              kind: kind === 'commandMappings' ? '输入映射条目' : '输入接续条目',
              summary: `${window.startFrame}–${window.endFrame} 帧`,
              relationToParent: 'member',
              canDelete: true,
            })),
          ),
          canAddChild: 'lifecycle',
        };
      }),
    ),
    canDelete: true,
  };
}
