import type { CompiledComboSkillConditionProgram } from './combatProgram';
import type { OperatorDefinition } from '../game-data/operatorDefinition';
import type { OperatorInstanceDocument } from '../project/schema';
import { validateComboSkillConditions } from '../game-data/validateComboSkillConditions';
import { compileActionSequence } from './compileSkill';
import { listOperatorSkillDefinitionBindings } from '../game-data/operatorSkillDefinitions';

/** 正式定义进入编译程序；引用在这里严格解析，不依赖是否存在技能块。 */
export function compileOperatorComboSkillConditions(
  operator: OperatorDefinition,
  build: OperatorInstanceDocument,
): readonly CompiledComboSkillConditionProgram[] {
  const path = `operator '${operator.slug}'.comboSkillConditions`;
  const issues = validateComboSkillConditions(operator.comboSkillConditions, path);
  if (issues.length > 0)
    throw new Error(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
  return (operator.comboSkillConditions ?? []).map((condition, index) => {
    const p = `${path}[${index}]`;
    const matches = listOperatorSkillDefinitionBindings(operator).filter(
      ({ skill }) => skill.key === condition.skillKey,
    );
    if (matches.length !== 1 || matches[0]!.skill.skillType !== 'comboSkill')
      throw new Error(`${p}.skillKey must resolve to exactly one combo skill`);
    const { group, skill } = matches[0]!;
    if (skill.levelSource === undefined)
      throw new Error(`${p}.skillKey requires an explicit levelSource`);
    const level = build.skillLevels[skill.levelSource];
    if (level === undefined || !Number.isInteger(level) || level <= 0)
      throw new Error(`${p} requires a positive integer level for '${skill.levelSource}'`);
    return {
      key: condition.key,
      skillGroupKey: group.key,
      skillKey: condition.skillKey,
      event: condition.event,
      immediately: condition.immediately,
      initialValues:
        condition.initialValues === null ? null : Object.freeze({ ...condition.initialValues }),
      sequence: compileActionSequence(condition.sequence, level, `${p}.sequence`),
    };
  });
}
