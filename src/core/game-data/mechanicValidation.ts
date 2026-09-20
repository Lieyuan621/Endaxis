/**
 * 项目机制选择与版本化机制定义之间的引用校验层。
 * 必须在调用 Adapter 前执行，使未知参数和类型漂移无法进入机制编译结果。
 */
import type { GameDataRepository, MechanicParameterDefinition } from './gameDataRepository';
import type { MechanicParameterValue, ScenarioMechanicsDocument } from '../project/schema';
import type { ValidationIssue } from '../project/validation';

type MechanicRepository = Pick<GameDataRepository, 'getMechanic'>;

function matchesParameterType(
  value: MechanicParameterValue,
  definition: MechanicParameterDefinition,
): boolean {
  return (
    typeof value === definition.type && (definition.type !== 'number' || Number.isFinite(value))
  );
}

/** 在版本化游戏数据仓库就绪后校验定义引用。 */
export function validateMechanicSelections(
  mechanics: ScenarioMechanicsDocument,
  repository: MechanicRepository,
  path = '$.mechanics',
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  mechanics.selections.forEach((selection, selectionIndex) => {
    const selectionPath = `${path}.selections[${selectionIndex}]`;
    const definition = repository.getMechanic(selection.mechanicId);
    if (definition === null) {
      issues.push({ path: `${selectionPath}.mechanicId`, message: 'unknown mechanic' });
      return;
    }

    const parameters = new Map(definition.parameters.map(parameter => [parameter.key, parameter]));
    for (const parameter of definition.parameters) {
      if (parameter.required && !(parameter.key in selection.parameters)) {
        issues.push({
          path: `${selectionPath}.parameters.${parameter.key}`,
          message: 'missing required mechanic parameter',
        });
      }
    }

    for (const [key, value] of Object.entries(selection.parameters)) {
      const parameter = parameters.get(key);
      if (parameter === undefined) {
        issues.push({
          path: `${selectionPath}.parameters.${key}`,
          message: 'unknown mechanic parameter',
        });
      } else if (!matchesParameterType(value, parameter)) {
        issues.push({
          path: `${selectionPath}.parameters.${key}`,
          message: `expected mechanic parameter type '${parameter.type}'`,
        });
      }
    }
  });

  return issues;
}
