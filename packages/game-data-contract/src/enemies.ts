/** 敌人预制体可选择的等级；生命值数组按此顺序排列，不插值。 */
export const ENEMY_LEVELS = [1, 20, 40, 60, 80, 90] as const;
export type EnemyLevelHp = readonly [number, number, number, number, number, number];
