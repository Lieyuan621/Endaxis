// 纯数据契约由独立包唯一声明；此路径保留兼容导出。
export {
  ENEMY_RANKS,
  type EnemyRank,
} from '../../../packages/game-data-contract/src/primitives.ts';
import {
  ENEMY_RANKS,
  type EnemyRank,
} from '../../../packages/game-data-contract/src/primitives.ts';
export function isEnemyRank(value: unknown): value is EnemyRank {
  return typeof value === 'string' && (ENEMY_RANKS as readonly string[]).includes(value);
}
