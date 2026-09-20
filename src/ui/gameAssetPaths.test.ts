import { describe, expect, it } from 'vitest';
import {
  getAttributeIconPath,
  getElementalReactionIconPath,
  getIconAssetPath,
  getOperatorAvatarPath,
  getOperatorSkillIconPath,
  getOperatorTalentIconPath,
  getSpellBurstIconPath,
  getWeaponActionIconPath,
} from './gameAssetPaths';

describe('gameAssetPaths', () => {
  it('resolves semantic UI assets through one boundary', () => {
    expect(getAttributeIconPath('intellect')).toBe('/icons/icon_attribute_wisd.webp');
    expect(getWeaponActionIconPath('arts-unit')).toBe('/icons/icon_attack_funnel.webp');
    expect(getOperatorAvatarPath('chen-qianyu')).toBe('/operators/chen-qianyu/avatar.webp');
    expect(getOperatorSkillIconPath('perlica', 'battleSkill')).toBe(
      '/operators/perlica/battle.webp',
    );
    expect(getOperatorTalentIconPath('perlica', 2)).toBe('/operators/perlica/talent 2.webp');
    expect(getIconAssetPath('icon_battle_buff_atk_up')).toBe('/icons/icon_battle_buff_atk_up.webp');
    expect(getIconAssetPath('icon_energy_fusion_fire')).toBe('/icons/icon_energy_fusion_fire.webp');
    expect(getIconAssetPath('icon_energy_fusion_pulse')).toBe(
      '/icons/icon_energy_fusion_pulse.webp',
    );
    expect(getIconAssetPath('icon_energy_fusion_cryst')).toBe(
      '/icons/icon_energy_fusion_cryst.webp',
    );
    expect(getIconAssetPath('icon_infliction_nature')).toBe(
      '/icons/icon_energy_fusion_nature.webp',
    );
    expect(getSpellBurstIconPath('Pulse')).toBe('/icons/icon_burst_fusion_pulse.webp');
    expect(getElementalReactionIconPath('corrosion')).toBe(
      '/icons/icon_battle_debuff_corrupt.webp',
    );
  });

  it('rejects path injection instead of interpolating arbitrary definition values', () => {
    expect(() => getOperatorAvatarPath('../operator')).toThrow(/safe game asset segment/);
    expect(() => getIconAssetPath('folder/icon')).toThrow(/safe game asset segment/);
  });
});
