import type { CombatBuffSemanticRole } from '../../../../../packages/game-data-contract/src/buffs';

/** Inspector 显式启用可选属性时的草稿默认值，不包含图节点或剪贴板语义。 */
export const BUFF_OPTIONAL_OBJECTS = {
  sustainedProtection: {
    label: '持续保护',
    create: () => ({ target: 'owner' as const, superArmor: 0, impactResistance: 0 }),
  },
  role: {
    label: '元素语义',
    create: (): CombatBuffSemanticRole => ({ kind: 'elementalAttachment', element: 'heat' }),
  },
  spellBurst: {
    label: '法术爆发参数',
    create: () => ({
      burstType: '',
      damageType: 'physical' as const,
      skillSettingDataKey: '',
      skillSettingColumn: 1,
      atkScaleBase: 0,
    }),
  },
} as const;
