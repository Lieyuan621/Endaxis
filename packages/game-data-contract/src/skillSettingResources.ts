/**
 * 定义从游戏 `SkillSetting.resources` 中提取的全局战斗资源参数，并提供严格的读取函数。
 * 这些数值供技能资源恢复和终结技能量计算使用；缺少、拼错或格式错误的字段会直接报错，
 * 以免模拟时悄悄采用与游戏数据不一致的默认值。
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

/**
 * 检查并读取一份 `SkillSetting.resources` 数据。
 * 只接受上面列出的非负有限数值，额外字段也会被视为数据版本不匹配。
 */
export function parseSkillSettingResources(value: unknown): SkillSettingResources {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('SkillSetting.resources: expected object');
  const row = value as Record<string, unknown>;
  const keys = [
    'atbRecoverInterval',
    'atbGainEfficiency',
    'atbConsumedDefaultUspGainSelf',
    'atbConsumedDefaultUspGainOther',
  ] as const;
  if (Object.keys(row).some(key => !keys.includes(key as (typeof keys)[number])))
    throw new Error('SkillSetting.resources: unknown field');
  const read = (key: (typeof keys)[number]) => {
    const n = row[key];
    if (typeof n !== 'number' || !Number.isFinite(n) || n < 0)
      throw new Error(`SkillSetting.resources.${key}: expected non-negative finite number`);
    return n;
  };
  return {
    atbRecoverInterval: read('atbRecoverInterval'),
    atbGainEfficiency: read('atbGainEfficiency'),
    atbConsumedDefaultUspGainSelf: read('atbConsumedDefaultUspGainSelf'),
    atbConsumedDefaultUspGainOther: read('atbConsumedDefaultUspGainOther'),
  };
}
