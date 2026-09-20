import type { DefinitionHistoryLocation } from './useDefinitionDraftHistory';

/** 描述已记录的编辑意图，不从当前页面或快照差异反推历史目标。 */
export function describeDefinitionHistory(location: DefinitionHistoryLocation | undefined): string {
  if (!location) return '修改定义';
  if (location.section === 'home' && location.propertyPath?.[0] === 'attributes')
    return '修改属性成长';
  if (location.section === 'home' && location.propertyPath?.[0] === 'displayName')
    return '修改展示名称';
  if (location.section === 'skills' && location.page === 'library') return '修改技能库组织';
  const section =
    (location.section === 'runtime'
      ? (
          {
            blackboard: '角色黑板',
            initialization: '条件初始化',
            presentation: '状态表现',
            combo: '连携条件',
            behavior: '角色行为',
            routing: '操作选择规则',
          } as Record<string, string>
        )[location.page ?? '']
      : undefined) ??
    (
      {
        buffs: 'Buff',
        entities: '能力实体',
        skills: '技能',
        progression: '养成',
        runtime: '角色行为',
        panel: '基本信息',
        trust: '信赖规则',
      } as Record<string, string>
    )[location.section ?? ''] ??
    '定义';
  const operation = { add: '新增', duplicate: '复制', remove: '删除', reset: '重置', edit: '修改' }[
    location.operation ?? 'edit'
  ];
  return `${operation}${section}${location.objectId ? `「${location.objectId}」` : ''}`;
}
