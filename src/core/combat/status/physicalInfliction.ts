/** 原生物理异常入口的固定 Buff 身份，不是技能可编辑参数。 */
export const PHYSICAL_NO_GUARD_BUFF = 'buff_physical_no_guard';

/** GetPhysicalInflictionBuff 的固定映射；转换器依赖收集与运行时共用。 */
export const PHYSICAL_INFLICTION_BUFFS = {
  airborne: 'buff_physical_airborne',
  knockDown: 'buff_physical_knockdown',
  fracture: 'buff_physical_fracture',
  crush: 'buff_physical_crushed',
} as const;
