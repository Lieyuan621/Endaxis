/** 全局效果资产的定义校验；不依赖项目存档或方案启用状态。 */
import type { SkillBuffDefinition } from '../../../packages/game-data-contract/src/buffs';
import { validateActionGraphOwner } from '../action-graph/actionGraphValidation';
import {
  asRecord,
  requireString,
  type SkillDefinitionValidationIssue,
} from './validation/definitionValues';
import {
  validateActionGraphReference,
  validateScheduledSequence,
  validateActionGraphActions,
  validateActionGraphContexts,
} from './validation/actionPrograms';
import { validateBuffDefinition } from './validation/buffApplication';

/** 校验一条全局效果定义的结构；不解析名称语言键是否存在。 */
export function validateGlobalEffectDefinition(
  input: unknown,
  path: string,
  issues: SkillDefinitionValidationIssue[],
): void {
  const value = asRecord(input, path, issues);
  if (value === null) return;
  requireString(value, 'id', path, issues);
  if (value.nameKey !== undefined) requireString(value, 'nameKey', path, issues);
  if (value.descriptionKey !== undefined) requireString(value, 'descriptionKey', path, issues);
  validateScenarioBuff(value.buff, `${path}.buff`, issues);
}

/** 场景直接配置与全局效果资产共用普通 Buff 校验。 */
export function validateScenarioBuff(
  input: unknown,
  buffPath: string,
  issues: SkillDefinitionValidationIssue[],
): void {
  const buff = asRecord(input, buffPath, issues);
  if (buff !== null) {
    const { actionGraph: graph, ...buffFields } = buff;
    validateBuffDefinition(buffFields, buffPath, buffPath, issues, {
      action: validateActionGraphReference,
      scheduled: validateScheduledSequence,
      graph: (graphValue, graphPath, out) =>
        out.push(...validateActionGraphActions(graphValue, graphPath)),
      contexts: (contextsValue, contextsPath, entries, out) =>
        validateActionGraphContexts(contextsValue, contextsPath, entries, out),
    });
    if (graph !== undefined) {
      const resource = asRecord(graph, `${buffPath}.actionGraph`, issues);
      if (resource === null) return;
      if (
        asRecord(resource.main, `${buffPath}.actionGraph.main`, issues) === null ||
        asRecord(resource.macros, `${buffPath}.actionGraph.macros`, issues) === null
      )
        return;
      issues.push(...validateActionGraphActions(graph, `${buffPath}.actionGraph`));
    }
    try {
      // 检查行为入口是否能在 Buff 自己的图中找到，包括缺图时的非法引用。
      validateActionGraphOwner(buff as SkillBuffDefinition, buffPath);
    } catch (error) {
      issues.push({
        path: buffPath,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
