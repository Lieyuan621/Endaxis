import type { ActorStats } from '@/simulation/compiler/types';

export const DEFAULT_ACTOR_STATS: ActorStats = {
  primary_ability: 0,
  secondary_ability: 0,
  strength: 0,
  agility: 0,
  intellect: 0,
  will: 0,
  attack: 0,
  hp: 0,
  crit_rate: 0,
  blaze_dmg: 0,
  emag_dmg: 0,
  cold_dmg: 0,
  nature_dmg: 0,
  healing_effect: 0,
  physical_dmg: 0,
  arts_dmg: 0,
  originium_arts_power: 0,
  ult_charge_eff: 100,
  link_cd_reduction: 0,
  combo_cd_reduction: 0,
  combo_cd_reduction_flat: 0,
  ult_cd_reduction: 0,
  ult_cd_reduction_flat: 0,
  combo_cd_external_mult: 1,
  ult_cd_external_mult: 1,
};

export function createDefaultStats(): ActorStats {
  return { ...DEFAULT_ACTOR_STATS };
}
