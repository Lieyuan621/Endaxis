import {
  PLAYER_SKILL_INPUTS,
  type OperatorDefinition,
} from '../../../../core/game-data/operatorDefinition';
import type { SkillStructureNode } from '../skillStructureMindMapModel';
export type OperatorRoutingDocument = Pick<
  OperatorDefinition,
  'skillSlots' | 'playerActionRoutes' | 'playerActionModes'
>;
export const actionNames = {
  basicAttack: '普攻',
  battleSkill: '战技',
  comboSkill: '连携',
  ultimate: '终结技',
} as const;
function node(
  path: string,
  label: string,
  kind: string,
  children: readonly SkillStructureNode[] = [],
): SkillStructureNode {
  return {
    id: path || 'routing',
    sourcePath: path,
    label,
    kind,
    summary: '',
    details: {},
    children,
    editorSection: 'overview',
    relationToParent: 'port',
    canDelete: false,
  };
}
export function buildOperatorRoutingGraph(value: OperatorRoutingDocument): SkillStructureNode {
  const routes = PLAYER_SKILL_INPUTS.map(input => ({
    ...node(
      `playerActionRoutes.${input}`,
      actionNames[input],
      value.playerActionRoutes?.[input] ? '操作路由' : '未设置路由',
    ),
    canDelete: !!value.playerActionRoutes?.[input],
    ...(!value.playerActionRoutes?.[input] ? { canAddChild: 'lifecycle' as const } : {}),
  }));
  const slots = (value.skillSlots ?? []).map((slot, index) => ({
    ...node(`skillSlots[${index}]`, slot.key, '技能槽位'),
    summary: slot.baseSkillKey,
    canDelete: true,
    relationToParent: 'member' as const,
  }));
  const modes = (value.playerActionModes ?? []).map((mode, index) => {
    const path = `playerActionModes[${index}]`;
    const commands = PLAYER_SKILL_INPUTS.map(input => ({
      ...node(
        `${path}.commandMappings.${input}`,
        actionNames[input],
        mode.commandMappings?.[input] ? '命令映射' : '未设置映射',
      ),
      canDelete: !!mode.commandMappings?.[input],
      ...(!mode.commandMappings?.[input] ? { canAddChild: 'lifecycle' as const } : {}),
    }));
    return {
      ...node(path, mode.modeId, '操作模式', commands),
      summary: mode.modeLayer,
      canDelete: true,
      relationToParent: 'member' as const,
    };
  });
  return node('', '操作选择规则', '操作选择规则', [
    node('playerActionRoutes', '四类操作', '路由集合', routes),
    { ...node('skillSlots', '技能槽位', '槽位集合', slots), canAddChild: 'lifecycle' },
    { ...node('playerActionModes', '操作模式', '模式集合', modes), canAddChild: 'lifecycle' },
  ]);
}
