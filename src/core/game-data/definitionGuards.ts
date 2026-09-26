/** 生成器和应用共用的数据读取校验。只检查传入值，不加载游戏资料或战斗运行状态。 */
import {
  OPERATOR_PASSIVE_ABILITY_EVENTS,
  type OperatorPassiveAbilityEvent,
} from '../../../packages/game-data-contract/src/operators.ts';
import type { GameplayTag } from '../../../packages/game-data-contract/src/gameplayTags.ts';
import type { SkillSettingResources } from '../../../packages/game-data-contract/src/skillSettingResources.ts';

/** 判断外部值是否是受支持的干员被动事件名。 */
export function isOperatorPassiveAbilityEvent(
  event: unknown,
): event is OperatorPassiveAbilityEvent {
  return (OPERATOR_PASSIVE_ABILITY_EVENTS as readonly unknown[]).includes(event);
}

/** 验证一个外部值是否是格式正确的可读标签路径。 */
export function assertGameplayTag(value: unknown): asserts value is GameplayTag {
  if (
    typeof value !== 'string' ||
    value.trim() !== value ||
    value.split('/').some(segment => !segment || !/[\p{L}_]/u.test(segment)) ||
    /^(?:unknown|unresolved)(?:[:/]|$)/i.test(value)
  ) {
    throw new Error(`GameplayTag 必须是可读路径：${JSON.stringify(value)}`);
  }
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
