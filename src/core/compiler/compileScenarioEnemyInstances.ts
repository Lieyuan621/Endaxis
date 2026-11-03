import type { EnemyInstanceDocument } from '../project/schema';
import type { CombatEnemyProgram } from '../combat/runtime/combatRuntimeAssembly';
import { compileScenarioEnemy } from './compileScenarioEnemy';
import { compileEnemyLifecycle } from './compileEnemyLifecycle';

/** 文档顺序只决定候选顺序，实例身份不随排序或同种敌人的数量变化。 */
export function compileScenarioEnemyInstances(
  instances: readonly EnemyInstanceDocument[] | undefined,
  initialFrame: number,
  index?: Parameters<typeof compileScenarioEnemy>[1],
): ReadonlyMap<string, CombatEnemyProgram> {
  const result = new Map<string, CombatEnemyProgram>();
  for (const instance of instances ?? []) {
    if (!instance.id.trim()) throw new Error('enemy instance requires a non-empty id');
    const id = instance.id;
    if (result.has(id)) throw new Error(`duplicate enemy instance '${instance.id}'`);
    result.set(id, {
      ...compileScenarioEnemy(instance.enemy, index),
      lifecycle: compileEnemyLifecycle(instance.enemy.lifecycle, initialFrame),
    });
  }
  return result;
}
