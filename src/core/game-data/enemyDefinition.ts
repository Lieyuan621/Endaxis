import type { EnemyDefinition } from '../../../packages/game-data-contract/src/enemies';
import type { EnemyDocument } from '../project/schema';

export {
  ENEMY_LEVELS,
  ENEMY_TIERS,
  type EnemyDefinition,
  type EnemyTier,
  type EnemyStaggerDefinition,
} from '../../../packages/game-data-contract/src/enemies';

/** 只接受定义中明确存在的等级节点，避免把推测插值伪装成游戏数据。 */
export function getEnemyHpAtLevel(definition: EnemyDefinition, level: number): number | null {
  return definition.levelHp[level] ?? null;
}

/** 选择器的名称和图片查询基础模板；战斗条目与关卡出生配置分别解析。 */
export function getEnemySourceDefinitionId(source: EnemyDocument['source']): string | null {
  if (source.kind === 'custom') return null;
  return source.kind === 'stage' ? source.templateId : source.enemyId;
}

/** 战斗定义使用原生 EnemyTable 条目，展示模板身份不代替其固有规则。 */
export function getEnemyRuntimeDefinitionId(enemy: EnemyDocument): string | null {
  if (enemy.source.kind === 'stage') return enemy.source.enemyId.replaceAll('_', '-');
  return getEnemySourceDefinitionId(enemy.source);
}
