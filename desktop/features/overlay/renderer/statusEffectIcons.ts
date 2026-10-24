import { physicalStatusIconPath } from '@/ui/timeline/results/physicalStatusDisplay';

/** 与时间轴共用游戏资源；没有图标的效果不生成空占位。 */
const icons: Readonly<Record<string, string | undefined>> = {
  heat: '/icons/icon_energy_fusion_fire.webp',
  electric: '/icons/icon_energy_fusion_pulse.webp',
  cryo: '/icons/icon_energy_fusion_cryst.webp',
  nature: '/icons/icon_energy_fusion_nature.webp',
  Fire: '/icons/icon_battle_burning.webp',
  Pulse: '/icons/icon_battle_conduct.webp',
  Cryst: '/icons/icon_battle_frozen.webp',
  Natural: '/icons/icon_battle_corrupt.webp',
  airborne: physicalStatusIconPath('buff_physical_airborne'),
  knockDown: physicalStatusIconPath('buff_physical_knockdown'),
  crush: physicalStatusIconPath('buff_physical_crushed'),
  fracture: physicalStatusIconPath('buff_physical_do_fracture'),
};
export function statusEffectIcon(effect: string): string | undefined {
  return icons[effect];
}
