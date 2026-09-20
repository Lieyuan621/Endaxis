import type { ComputedRef, InjectionKey } from 'vue';

/** 由当前干员附属对象工作区提供给任意深度步骤编辑器的可引用实体身份。 */
export const ABILITY_ENTITY_IDS_KEY: InjectionKey<ComputedRef<readonly string[]>> =
  Symbol('next-ability-entity-ids');
