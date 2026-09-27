import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';

/** 命令只返回失败原因，显示文案由调用方决定。 */
export class OperatorResourceEditError extends Error {
  constructor(readonly reason: 'lastSkill' | 'skillReferenced') {
    super(reason);
    this.name = 'OperatorResourceEditError';
  }
}

/** 结构操作只能进入已知的技能列表；普通字段编辑不能创建或改写资源身份。 */
export type OperatorResourceCommand =
  | { kind: 'addSkill'; group: number }
  | { kind: 'removeSkill' | 'moveSkillUp' | 'moveSkillDown'; group: number; index: number }
  | { kind: 'addUpgrade'; collection: 'talents' | 'potentials' }
  | { kind: 'removeUpgrade'; collection: 'talents' | 'potentials'; index: number };

export function editOperatorResources(
  definition: OperatorDefinition,
  command: OperatorResourceCommand,
): OperatorDefinition {
  if (command.kind === 'addUpgrade') {
    return {
      ...definition,
      [command.collection]: [...(definition[command.collection] ?? []), { levels: 1 }],
    };
  }
  if (command.kind === 'removeUpgrade') {
    const items = definition[command.collection] ?? [];
    if (!items[command.index]) throw new Error('Invalid upgrade index');
    return {
      ...definition,
      [command.collection]: items.filter((_, index) => index !== command.index),
    };
  }
  const group = definition.skillGroups[command.group];
  if (!group) throw new Error('Invalid skill group');
  const skills: SkillDefinition[] = Array.isArray(group.skills)
    ? [...group.skills]
    : [group.skills as SkillDefinition];
  if (command.kind === 'addSkill') {
    // 自定义 ID 在整份定义内避让，避免与变体、换槽或实体子技能冲突。
    const used = new Set<string>();
    const visit = (value: unknown): void => {
      if (typeof value === 'string') used.add(value);
      else if (value && typeof value === 'object') Object.values(value).forEach(visit);
    };
    visit(definition);
    let index = 1;
    while (used.has(`custom_skill_${index}`)) index++;
    skills.push({
      key: `custom_skill_${index}`,
      ...(group.skillType === 'dodge'
        ? { skillType: 'dodge' as const }
        : { skillType: group.skillType, levelSource: group.levelSource }),
      nativeSkillType:
        group.skillType === 'basicAttack' || group.skillType === 'plungingAttack'
          ? 'attack'
          : group.skillType === 'finisher'
            ? 'breakingAttack'
            : group.skillType === 'battleSkill'
              ? 'normalSkill'
              : group.skillType === 'comboSkill'
                ? 'comboSkill'
                : group.skillType === 'dodge'
                  ? 'dodge'
                  : 'ultimateSkill',
      timelineBlockFrames: 30,
      naturalDurationFrames: 30,
      exclusiveFrame: 0,
      offsetRecordFrame: 0,
      scheduledSequences: [],
      actionGraph: { main: { nodes: {} }, macros: {} },
    });
  } else {
    const skill = skills[command.index];
    if (!skill) throw new Error('Invalid skill index');
    if (command.kind === 'removeSkill') {
      if (skills.length === 1) throw new OperatorResourceEditError('lastSkill');
      let referenced = false;
      const visit = (value: unknown): void => {
        if (value === skill) return;
        if (value === skill.key) referenced = true;
        else if (value && typeof value === 'object') {
          for (const [key, item] of Object.entries(value)) {
            if (key === skill.key) referenced = true;
            visit(item);
          }
        }
      };
      visit(definition);
      if (referenced) throw new OperatorResourceEditError('skillReferenced');
      skills.splice(command.index, 1);
    } else {
      const target = command.index + (command.kind === 'moveSkillUp' ? -1 : 1);
      if (target < 0 || target >= skills.length) return definition;
      [skills[command.index], skills[target]] = [skills[target]!, skill];
    }
  }
  return {
    ...definition,
    skillGroups: definition.skillGroups.map((item, index) =>
      index === command.group ? { ...group, skills } : item,
    ),
  };
}
