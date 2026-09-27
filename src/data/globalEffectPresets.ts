import type { GlobalEffectDefinition } from '../core/game-data/globalEffectDefinition';

/** 全局效果与普通 Buff 使用相同的属性、生命周期和动作图。 */
export const GLOBAL_EFFECT_PRESETS = [
  {
    id: 'combo-cdr-50',
    nameKey: 'globalConfig.comboAcceleration',
    descriptionKey: 'globalConfig.comboAccelerationDescription',
    buff: {
      stackingType: 'unlimited',
      presentation: { visible: false },
      attributeModifiers: [
        { attribute: 'ComboSkillCooldownScalar', slot: 'finalMultiplier', value: 0.5 },
      ],
      actionGraph: { main: { nodes: {} }, macros: {} },
    },
  },
] as const satisfies readonly GlobalEffectDefinition[];
