import type { ActionGraphReference } from '../../../packages/game-data-contract/src/actionGraph';
import type {
  ActionGraphDefinitionRepository,
  ImportedAbilityEntityDefinitions,
} from './actionGraphDefinitionRepository';
import type { CompiledComboSkillConditionProgram } from './combatProgram';
import type { OperatorDefinition } from '../game-data/operatorDefinition';
import type { OperatorInstanceDocument } from '../project/schema';
import { validateComboSkillConditions } from '../game-data/validateComboSkillConditions';
import { listOperatorSkillDefinitionBindings } from '../game-data/operatorSkillDefinitions';

/** 正式定义进入编译程序；引用在这里严格解析，不依赖是否存在技能块。 */
interface ComboGraphContext {
  readonly programs: ActionGraphDefinitionRepository;
  readonly importsForLevel?: (level: number) => ImportedAbilityEntityDefinitions;
}
export function compileOperatorComboSkillConditions(
  operator: OperatorDefinition,
  build: OperatorInstanceDocument,
  context: ComboGraphContext,
): readonly CompiledComboSkillConditionProgram[] {
  const path = `operator '${operator.slug}'.comboSkillConditions`;
  const issues = validateComboSkillConditions(
    operator.comboSkillConditions,
    path,
    (entry, entryPath = path) => {
      if (
        entry === null ||
        typeof entry !== 'object' ||
        Array.isArray(entry) ||
        Object.keys(entry).length !== 1 ||
        !Object.hasOwn(entry, '$sequence') ||
        !(
          (entry as ActionGraphReference).$sequence === null ||
          (typeof (entry as ActionGraphReference).$sequence === 'string' &&
            (entry as ActionGraphReference).$sequence !== '')
        )
      )
        return [{ path: entryPath, message: 'expected an action graph entry reference' }];
      return [];
    },
  );
  if (issues.length > 0)
    throw new Error(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
  return (operator.comboSkillConditions ?? []).map((condition, index) => {
    const p = `${path}[${index}]`;
    if (condition.actionGraph === undefined)
      throw new Error(`${p}: condition requires its own action graph`);
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
      sequence: context.programs
        .compile(condition.actionGraph, level, undefined, context.importsForLevel?.(level))
        .compileEntry(condition.sequence, `${p}.sequence`),
    };
  });
}
