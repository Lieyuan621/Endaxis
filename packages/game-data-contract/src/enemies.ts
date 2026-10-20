/** 普通敌人选择器的默认等级。关卡可引用其他明确导出的等级，不插值。 */
export const ENEMY_LEVELS = [1, 20, 40, 60, 80, 90] as const;
export type EnemyLevelHp = Readonly<Partial<Record<number, number>>>;
