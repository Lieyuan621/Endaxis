import type { GlobalOperatorStatModifierDocument } from './schema';

/** 编辑器提供的场景预设；只声明配置，执行仍由全局 Buff 编译入口负责。 */
export const GLOBAL_CONFIG_PRESETS = [
  {
    id: 'combo-cdr-50',
    nameKey: 'globalConfig.comboAcceleration',
    descriptionKey: 'globalConfig.comboAccelerationDescription',
    modifiers: [
      {
        id: 'preset:combo-cdr-50',
        kind: 'operatorStat',
        modifier: 'skillCooldownReduction',
        skillType: 'comboSkill',
        value: 0.5,
      },
    ] satisfies GlobalOperatorStatModifierDocument[],
  },
] as const;
