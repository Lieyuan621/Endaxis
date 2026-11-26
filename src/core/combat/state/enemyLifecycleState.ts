/** 敌人实例的存在状态；离开可选范围不意味着死亡或重新出生。 */
export type EnemyLifePhase = 'unspawned' | 'present' | 'absent' | 'dead';

/** 只有数据进入切面；恢复对象不能重放出生、切入或死亡事件。 */
export interface EnemyLifecycleState {
  phase: EnemyLifePhase;
  deathFrame: number | null;
  lastFrame: number | null;
}

export function createEnemyLifecycleState(): EnemyLifecycleState {
  return { phase: 'unspawned', deathFrame: null, lastFrame: null };
}
