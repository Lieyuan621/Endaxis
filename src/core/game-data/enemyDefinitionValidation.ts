/**
 * 校验项目敌人实例引用的定义身份。
 * 本模块不把定义默认值写回项目，避免加载校验悄悄修改用户文档。
 */
import { getEnemySourceDefinitionId } from './enemyDefinition';
import type { EndaxisProjectDocument } from '../project/schema';
import type { ValidationIssue } from '../project/validation';
import type { EnemyDefinition } from './enemyDefinition';

export interface EnemyDefinitionIndex {
  getEnemy(id: string): EnemyDefinition | null;
}

/** 校验所有预制体敌人实例都能由当前定义按相同身份解析。 */
export function validateProjectEnemyDefinitionReferences(
  project: EndaxisProjectDocument,
  repository: EnemyDefinitionIndex,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  project.scenarios.forEach((scenario, scenarioIndex) => {
    const source = scenario.enemy.source;
    const enemyId = getEnemySourceDefinitionId(source);
    if (enemyId === null) return;
    const field = source.kind === 'stage' ? 'templateId' : 'enemyId';
    const path = `$.scenarios[${scenarioIndex}].enemy.source.${field}`;
    const definition = repository.getEnemy(enemyId);
    if (definition === null) {
      issues.push({ path, message: 'unknown enemy' });
    } else if (definition.id !== enemyId) {
      issues.push({ path, message: 'enemy definition identity mismatch' });
    }
  });

  return issues;
}
