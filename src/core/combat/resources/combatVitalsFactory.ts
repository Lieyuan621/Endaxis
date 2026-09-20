/**
 * 由场景装配层创建本次模拟唯一的敌人生命账本。
 * 编译后的敌人静态程序是唯一输入；标准伤害环境、条件求值与结果收集都必须引用这里返回的同一实例，
 * 不得各自再造一份生命或失衡状态。
 */
import { COMBAT_FRAME_INTERVAL } from '../time/combatClock';
import type { CombatEnemyProgram } from '../runtime/combatRuntimeAssembly';
import { CombatVitals } from './combatVitals';

/** 从场景编译出的敌人静态程序创建敌人生命与失衡账本。 */
export function createEnemyCombatVitals(enemy: CombatEnemyProgram): CombatVitals {
  return new CombatVitals({
    health: enemy.health,
    maxHealth: enemy.health,
    // 原生 hasPoise 只取决于失衡上限；中间节点不会把失衡拆成多条独立账本。
    maxPoise: enemy.stagger.maximum,
    poise: enemy.stagger.maximum,
    poiseRecoveryTime: enemy.stagger.brokenDurationFrames * COMBAT_FRAME_INTERVAL,
    poiseRecoveryTimeMultiplier: 1,
    poiseBrokenEndTime: 0,
    poiseImmune: false,
  });
}
