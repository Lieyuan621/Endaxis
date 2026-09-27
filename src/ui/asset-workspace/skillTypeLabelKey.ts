/** 技能数据分类与现有玩家界面名称的对应关系。 */
export function skillTypeLabelKey(type: string): string {
  const names: Readonly<Record<string, string>> = {
    basicAttack: 'attack',
    battleSkill: 'skill',
    comboSkill: 'link',
    finisher: 'execution',
    plungingAttack: 'dive',
  };
  return `skillType.${names[type] ?? type}`;
}
