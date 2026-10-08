/** 原生 SpellInflictionOnChar 的固定资源映射，与敌人侧附着/反应分开。 */
export const CHARACTER_INFLICTION_BUFFS = {
  Fire: ['buff_common_enemy_spell_fire_attached', 'buff_common_enemy_spell_fire_triggered_burning'],
  Pulse: [
    'buff_common_enemy_spell_pulse_attached',
    'buff_common_enemy_spell_pulse_triggered_conduct',
  ],
  Cryst: [
    'buff_common_enemy_spell_cryst_attached',
    'buff_common_enemy_spell_cryst_triggered_frozen',
  ],
  Natural: [
    'buff_common_enemy_spell_natural_attached',
    'buff_common_enemy_spell_natural_triggered_corrupt',
  ],
} as const;
