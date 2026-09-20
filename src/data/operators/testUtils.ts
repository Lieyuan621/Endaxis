/**
 * 干员定义测试专用的结构查询入口。生产代码不得依赖这些宽松检索工具，
 * 以免绕过编译器的严格引用解析。
 */
import type {
  ActionSequenceDefinition,
  CombatStepDefinition,
  OperatorDefinition,
  SkillDefinition,
  SkillGroupDefinition,
} from '../../core/game-data/operatorDefinition';

export function getGroupSkills(group: SkillGroupDefinition): readonly SkillDefinition[] {
  return Array.isArray(group.skills) ? group.skills : [group.skills as SkillDefinition];
}

export function getSkill(operator: OperatorDefinition, key: string): SkillDefinition {
  const skill = operator.skillGroups
    .flatMap(getGroupSkills)
    .find(candidate => candidate.key === key);
  if (!skill) throw new Error(`missing skill: ${key}`);
  return skill;
}

export function collectSteps(sequence: ActionSequenceDefinition): CombatStepDefinition[] {
  return sequence.steps.flatMap(step => [
    step,
    ...(step.kind === 'conditional' ? collectSteps(step.whenTrue) : []),
    ...(step.kind === 'switch'
      ? step.options.flatMap(option => collectSteps(option.sequence))
      : []),
    ...(step.kind === 'conditional' && step.whenFalse ? collectSteps(step.whenFalse) : []),
    ...(step.kind === 'once' ||
    step.kind === 'withActionBlackboardScope' ||
    step.kind === 'repeatEachTick' ||
    step.kind === 'forEachContextTarget'
      ? collectSteps(step.body)
      : []),
  ]);
}
