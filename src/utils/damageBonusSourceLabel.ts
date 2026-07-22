import { getGearSetGameName, getWeaponGameName } from '@/data/gameText';
import { translateEffectName } from '@/editor/hits/statusOptions';

type TranslateFn = (key: string) => string;
type TranslateExistsFn = (key: string) => boolean;

const GENERATED_ID_RE = /(?:^|-)(?:skill\d+|trigger\d+|effect\d+|gear-implicit)(?:-|$)/i;

function looksLikeGeneratedId(value: string): boolean {
  return GENERATED_ID_RE.test(value) || value.includes('gear-implicit');
}

function humanizeCamel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
}

/** Prefer locale effect names, then weapon/set game names from generated ids. */
export function resolveDamageBonusSourceLabel(
  rawLabel: string | null | undefined,
  t: TranslateFn,
  te: TranslateExistsFn,
  locale?: string | null,
): string {
  const label = String(rawLabel || '').trim();
  if (!label) return '';

  // Already localized display text (e.g. stamped gear/weapon names).
  if (/[\u4e00-\u9fff]/.test(label) || /\s/.test(label)) return label;

  const translated = translateEffectName(t, te, label);
  if (translated && translated !== label) return translated;

  // Synthetic reaction helper statuses (e.g. corrosion:resShred).
  const syntheticMatch = label.match(/^([a-zA-Z]+)(?::|$)/);
  if (syntheticMatch?.[1]) {
    const reactionTranslated = translateEffectName(t, te, syntheticMatch[1]);
    if (reactionTranslated && reactionTranslated !== syntheticMatch[1]) return reactionTranslated;
  }

  const weaponSkillMatch = label.match(/^(.+?)-skill\d+/i);
  if (weaponSkillMatch?.[1]) {
    const weaponName = getWeaponGameName(weaponSkillMatch[1], locale);
    if (weaponName) return weaponName;
  }

  const setTriggerMatch = label.match(/^(.+?)-trigger\d+/i);
  if (setTriggerMatch?.[1] && !weaponSkillMatch) {
    const setName = getGearSetGameName(setTriggerMatch[1], locale);
    if (setName) return setName;
  }

  const setEffectMatch = label.match(/^(.+?)-effect\d+$/i);
  if (setEffectMatch?.[1] && !looksLikeGeneratedId(setEffectMatch[1])) {
    const setName = getGearSetGameName(setEffectMatch[1], locale);
    if (setName) return setName;
  }

  if (looksLikeGeneratedId(label)) return label;
  if (/^[a-z][a-zA-Z0-9]*$/.test(label)) return humanizeCamel(label);
  return label;
}
