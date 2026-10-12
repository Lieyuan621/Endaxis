import type {
  DamageElement,
  OperatorAttribute,
  OperatorWeaponType,
  SkillType,
} from '../core/game-data/operatorDefinition';

export const DEFAULT_GAME_ICON_PATH = '/icons/default_icon.webp';
export const DEFAULT_WEAPON_ICON_PATH = '/weapons/default.webp';

/** 技能资源的展示约定；定义只保存非默认图标的文件名。 */
export function defaultOperatorSkillIconPath(
  slug: string,
  weaponType: OperatorWeaponType,
  skillType: SkillType,
): string {
  const name =
    skillType === 'battleSkill'
      ? 'battle'
      : skillType === 'comboSkill'
        ? 'combo'
        : skillType === 'ultimate'
          ? 'ultimate'
          : null;
  return name
    ? `/operators/${requireAssetSegment(slug, 'operator asset slug')}/${name} 01.webp`
    : getWeaponActionIconPath(weaponType);
}

const ATTRIBUTE_ICON_PATHS: Readonly<Record<OperatorAttribute, string>> = Object.freeze({
  strength: '/icons/icon_attribute_str.webp',
  agility: '/icons/icon_attribute_agi.webp',
  intellect: '/icons/icon_attribute_wisd.webp',
  will: '/icons/icon_attribute_will.webp',
});

const ELEMENT_ICON_PATHS: Readonly<Record<DamageElement, string>> = Object.freeze({
  physical: '/icons/icon_element_physical.webp',
  heat: '/icons/icon_element_heat.webp',
  cryo: '/icons/icon_element_cryo.webp',
  electric: '/icons/icon_element_electric.webp',
  nature: '/icons/icon_element_nature.webp',
});

const WEAPON_ACTION_ICON_PATHS: Readonly<Record<OperatorWeaponType, string>> = Object.freeze({
  sword: '/icons/icon_attack_sword.webp',
  claym: '/icons/icon_attack_claym.webp',
  lance: '/icons/icon_attack_lance.webp',
  pistol: '/icons/icon_attack_pistol.webp',
  funnel: '/icons/icon_attack_funnel.webp',
});

const SPELL_BURST_ICON_PATHS: Readonly<Record<string, string>> = Object.freeze({
  Fire: '/icons/icon_burst_fusion_fire.webp',
  Pulse: '/icons/icon_burst_fusion_pulse.webp',
  Natural: '/icons/icon_burst_fusion_nature.webp',
  Cryst: '/icons/icon_burst_fusion_cryst.webp',
});

function requireAssetSegment(value: string, label: string): string {
  const normalized = String(value ?? '').trim();
  if (!/^[A-Za-z0-9_-]+$/.test(normalized)) {
    throw new Error(`${label} '${normalized}' is not a safe game asset segment`);
  }
  return normalized;
}

export function getOperatorAvatarPath(assetSlug: string): string {
  return `/operators/${requireAssetSegment(assetSlug, 'operator asset slug')}/avatar.webp`;
}

export function getOperatorTalentIconPath(assetSlug: string, oneBasedIndex: number): string {
  if (!Number.isInteger(oneBasedIndex) || oneBasedIndex < 1) {
    throw new Error(`operator talent index '${oneBasedIndex}' must be a positive integer`);
  }
  return `/operators/${requireAssetSegment(assetSlug, 'operator asset slug')}/talent ${oneBasedIndex}.webp`;
}

export function getAttributeIconPath(attribute: OperatorAttribute): string {
  return ATTRIBUTE_ICON_PATHS[attribute];
}

export function getElementIconPath(element: DamageElement): string {
  return ELEMENT_ICON_PATHS[element];
}

export function getWeaponActionIconPath(weaponType: OperatorWeaponType): string {
  return WEAPON_ACTION_ICON_PATHS[weaponType];
}

export function getSpellBurstIconPath(burstType: string | null | undefined): string | null {
  return SPELL_BURST_ICON_PATHS[String(burstType ?? '')] ?? null;
}
