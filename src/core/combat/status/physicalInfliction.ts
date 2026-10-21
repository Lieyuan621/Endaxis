/** 原生物理异常入口的固定 Buff 身份，不是技能可编辑参数。 */
export const PHYSICAL_NO_GUARD_BUFF = 'buff_physical_no_guard';

/** GetPhysicalInflictionBuff 的固定映射；转换器依赖收集与运行时共用。 */
export const PHYSICAL_INFLICTION_BUFFS = {
  airborne: 'buff_physical_airborne',
  knockDown: 'buff_physical_knockdown',
  fracture: 'buff_physical_fracture',
  crush: 'buff_physical_crushed',
} as const;

/** 原生异常动作在发布 Before 事件之前使用的标签免疫准入。 */
export const PHYSICAL_INFLICTION_TAGS = {
  airborne: 'Skill/Character/Common/PhysicalStatus/AirborneStatus',
  knockDown: 'Skill/Character/Common/PhysicalStatus/KnockdownStatus',
  fracture: 'Skill/Character/Common/PhysicalStatus/FractureStatus',
  crush: 'Skill/Character/Common/PhysicalStatus/CrushStatus',
} as const;
