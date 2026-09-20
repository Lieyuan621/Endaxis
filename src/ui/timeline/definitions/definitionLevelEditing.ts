import type { InjectionKey } from 'vue';

/** Definition pages edit the entire value table, rather than a selected build level. */
export const definitionAllLevelsKey: InjectionKey<boolean> = Symbol('definition-all-levels');
