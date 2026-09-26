/**
 * 定义从游戏 `SkillSetting.resources` 中提取的全局战斗资源参数，供技能资源恢复和终结技能量计算使用。
 */

/** `SkillSetting.resources` 中会影响行动技力和终结技能量的数值。 */
export interface SkillSettingResources {
  /** 每次自然恢复行动技力之间的秒数。 */
  readonly atbRecoverInterval: number;
  /** 行动技力恢复量使用的全局效率系数。 */
  readonly atbGainEfficiency: number;
  /** 当前干员消耗行动技力时，自己获得的基础终结技能量。 */
  readonly atbConsumedDefaultUspGainSelf: number;
  /** 当前干员消耗行动技力时，队友获得的基础终结技能量。 */
  readonly atbConsumedDefaultUspGainOther: number;
}
