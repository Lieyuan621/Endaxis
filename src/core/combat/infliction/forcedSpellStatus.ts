import type { InflictionElement } from '../../../../packages/game-data-contract/src/primitives';

/** ForceSpellStatusAction 的固定原生映射；定义仍从公共 Buff 目录解析。 */
export const FORCED_SPELL_STATUS_BUFFS = {
  heat: 'buff_common_fire_fire_burning_triggered',
  electric: 'buff_common_pulse_pulse_conduct_triggered',
  cryo: 'buff_common_cryst_cryst_frozen_triggered',
  nature: 'buff_common_natural_natural_corrupt_triggered',
} as const satisfies Record<InflictionElement, string>;
