import { i18n } from '@/i18n';
import { normalizeLocale } from '../i18n/elementPlusLocale';
import { gameLocaleRegistry } from '../i18n/gameLocaleRegistry';
import { weaponPresentationSlugByAsset } from './weaponPresentationSlugs';

type LocaleTable = Record<string, any>;
/** 以slug直接索引条目的语言表；装备与术语有各自的嵌套结构。 */
type EntryGameTextFamily = 'operators' | 'weapons' | 'enemies' | 'consumables';

type GameEnumGroup =
  | 'element'
  | 'class'
  | 'weaponType'
  | 'slotType'
  | 'quality'
  | 'attribute'
  | 'operatorUi'
  | 'weaponUi';

function humanizeIdentifier(value: string | null | undefined) {
  if (!value) return '';
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function getFamilySource(family: EntryGameTextFamily, locale?: string | null) {
  return gameLocaleRegistry.getFamily(
    normalizeLocale(locale ?? i18n.global.locale.value),
    family,
  ) as LocaleTable;
}

function getEntry(family: EntryGameTextFamily, slug: string, locale?: string | null) {
  const source = getFamilySource(family, locale);
  return source?.[slug] || null;
}

function getEnemyEntry(slug: string, locale?: string | null) {
  const source = getFamilySource('enemies', locale);
  return source?.[slug] || source?.[slug?.replace(/-/g, '_')] || null;
}

function readTrimmedText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function formatGameTextValue(value: unknown): string {
  if (typeof value === 'string') return value;
  const number = Number(value);
  if (!Number.isFinite(number)) return '';
  if (Number.isInteger(number)) return String(number);
  return number.toFixed(2).replace(/\.?0+$/, '');
}

function getIndexedValues(values: unknown, level: number): unknown[] {
  if (!Array.isArray(values) || values.length === 0) return [];
  const index = Math.max(0, Math.min(values.length - 1, Math.floor(Number(level) || 1) - 1));
  const row = values[index] ?? values[0];
  return Array.isArray(row) ? row : [row];
}

function formatIndexedDescription(template: string, values: unknown[]) {
  if (!values.length) return template;
  return template.replace(/\{(\d+)\}/g, (match, indexText) => {
    const value = values[Number(indexText)];
    const formatted = formatGameTextValue(value);
    return formatted || match;
  });
}

function getOperatorEntry(slug: string, locale?: string | null) {
  return getEntry('operators', slug, locale);
}

function getOperatorCombatSkillEntry(
  slug: string,
  skillKey: string,
  locale?: string | null,
  formKey?: string | null,
) {
  const entry = getOperatorEntry(slug, locale);
  const skill = entry?.combatSkills?.[skillKey] || null;
  const key = String(formKey || '').trim();
  if (!key) return { skill, formSkill: null };
  const forms = skill?.forms;
  const formSkill =
    forms && typeof forms === 'object' && !Array.isArray(forms) ? forms[key] || null : null;
  return { skill, formSkill };
}

const weaponAssetSlugByPresentation = Object.freeze(
  Object.fromEntries(
    Object.entries(weaponPresentationSlugByAsset).map(([assetSlug, presentationSlug]) => [
      presentationSlug,
      assetSlug,
    ]),
  ) as Readonly<Record<string, string>>,
);

function getWeaponEntry(slug: string, locale?: string | null) {
  return (
    getEntry('weapons', slug, locale) ||
    getEntry('weapons', weaponAssetSlugByPresentation[slug] ?? '', locale)
  );
}

function getGearSetEntry(slug: string, locale?: string | null) {
  const source = gameLocaleRegistry.getFamily(
    normalizeLocale(locale ?? i18n.global.locale.value),
    'gears',
  );
  return (source.gearsets as LocaleTable)[slug] || null;
}

function getGameEnumValue(
  group: GameEnumGroup,
  key: string | null | undefined,
  locale?: string | null,
) {
  const sourceKey = String(key || '').trim();
  const compactKey = sourceKey.replace(/\s+/g, '');
  const normalizedKey = compactKey.toLowerCase();
  const terms = gameLocaleRegistry.getFamily(
    normalizeLocale(locale ?? i18n.global.locale.value),
    'terms',
  ).enums as LocaleTable;
  const table = terms[group] as Record<string, string> | undefined;
  if (!table) return null;
  return (
    table[sourceKey] ||
    table[compactKey] ||
    table[normalizedKey] ||
    Object.entries(table).find(([candidate]) => candidate.toLowerCase() === normalizedKey)?.[1] ||
    null
  );
}

export function getOperatorGameName(slug: string, locale?: string | null) {
  const entry = getOperatorEntry(slug, locale);
  return readTrimmedText(entry?.name) || humanizeIdentifier(slug);
}

export function getConsumableGameName(id: string, locale?: string | null) {
  const entry = getEntry('consumables', id, locale);
  return readTrimmedText(entry?.name) || humanizeIdentifier(id);
}

export function getConsumableGameDescription(id: string, locale?: string | null) {
  const entry = getEntry('consumables', id, locale);
  return readTrimmedText(entry?.description);
}

/** Localized operator form label (e.g. arcane `int` → 阵诀·智). */
export function getOperatorFormName(
  slug: string,
  formKey: string | null | undefined,
  locale?: string | null,
) {
  const key = String(formKey || '').trim();
  if (!key) return null;
  const entry = getOperatorEntry(slug, locale);
  const forms = entry?.forms;
  if (forms && typeof forms === 'object' && !Array.isArray(forms)) {
    const named = readTrimmedText((forms as Record<string, unknown>)[key]);
    if (named) return named;
  }
  return humanizeIdentifier(key);
}

export function getOperatorTalentName(
  slug: string,
  flatStartIndex: number,
  levelIndex = 0,
  locale?: string | null,
) {
  const entry = getOperatorEntry(slug, locale);
  const talents = Array.isArray(entry?.talents) ? entry.talents : [];
  const safeFlatStartIndex = Math.max(0, Number(flatStartIndex) || 0);
  const safeLevelIndex = Math.max(0, Number(levelIndex) || 0);
  const flatIndex = safeFlatStartIndex + safeLevelIndex;
  return (
    readTrimmedText(talents[flatIndex]?.name) ||
    readTrimmedText(talents[safeFlatStartIndex]?.name) ||
    `Talent ${safeFlatStartIndex + 1}`
  );
}

export function getOperatorTalentDescription(
  slug: string,
  flatStartIndex: number,
  levelIndex = 0,
  locale?: string | null,
) {
  const entry = getOperatorEntry(slug, locale);
  const talents = Array.isArray(entry?.talents) ? entry.talents : [];
  const safeFlatStartIndex = Math.max(0, Number(flatStartIndex) || 0);
  const safeLevelIndex = Math.max(0, Number(levelIndex) || 0);
  const flatIndex = safeFlatStartIndex + safeLevelIndex;
  return (
    readTrimmedText(talents[flatIndex]?.description) ||
    readTrimmedText(talents[safeFlatStartIndex]?.description) ||
    null
  );
}

export function getOperatorPotentialName(
  slug: string,
  potentialIndex: number,
  locale?: string | null,
) {
  const entry = getOperatorEntry(slug, locale);
  const potentials = Array.isArray(entry?.potentials) ? entry.potentials : [];
  const safeIndex = Math.max(0, Number(potentialIndex) || 0);
  return readTrimmedText(potentials[safeIndex]?.name) || `Potential ${safeIndex + 1}`;
}

export function getOperatorPotentialDescription(
  slug: string,
  potentialIndex: number,
  locale?: string | null,
) {
  const entry = getOperatorEntry(slug, locale);
  const potentials = Array.isArray(entry?.potentials) ? entry.potentials : [];
  const safeIndex = Math.max(0, Number(potentialIndex) || 0);
  return readTrimmedText(potentials[safeIndex]?.description);
}

export function getOperatorCombatSkillName(
  slug: string,
  skillKey: string,
  locale?: string | null,
  fallback?: string | null,
  formKey?: string | null,
) {
  const { skill, formSkill } = getOperatorCombatSkillEntry(slug, skillKey, locale, formKey);
  return (
    readTrimmedText(formSkill?.name) ||
    readTrimmedText(skill?.name) ||
    readTrimmedText(fallback) ||
    humanizeIdentifier(skillKey)
  );
}

export function getOperatorCombatSkillDescription(
  slug: string,
  skillKey: string,
  locale?: string | null,
  formKey?: string | null,
) {
  const { skill, formSkill } = getOperatorCombatSkillEntry(slug, skillKey, locale, formKey);
  return readTrimmedText(formSkill?.description) || readTrimmedText(skill?.description) || '';
}

export function getOperatorCombatSkillFormKeys(
  slug: string,
  skillKey: string,
  locale?: string | null,
) {
  const { skill } = getOperatorCombatSkillEntry(slug, skillKey, locale);
  const forms = skill?.forms;
  if (!forms || typeof forms !== 'object' || Array.isArray(forms)) return [];
  return Object.keys(forms).filter(key => key.trim());
}

export function getOperatorSubSkillName(
  slug: string,
  subSkillKey: string,
  locale?: string | null,
  fallback?: string | null,
) {
  const semanticKey = `${subSkillKey} ${fallback ?? ''}`.replace(/[^a-z]/gi, '').toLowerCase();
  const commonSkillTypeKey = semanticKey.includes('enhancedbasicattack')
    ? 'enhancedAttack'
    : semanticKey.includes('enhancedbattleskill')
      ? 'enhancedSkill'
      : semanticKey.includes('enhancedcomboskill')
        ? 'enhancedLink'
        : semanticKey.includes('enhancedultimate')
          ? 'enhancedUltimate'
          : null;
  if (commonSkillTypeKey) {
    const messages = i18n.global.getLocaleMessage(
      normalizeLocale(locale ?? i18n.global.locale.value),
    ) as LocaleTable;
    const commonName = readTrimmedText(messages.skillType?.[commonSkillTypeKey]);
    if (commonName) return commonName;
  }
  const entry = getOperatorEntry(slug, locale);
  const table = entry?.subSkills;
  const fallbackKey = readTrimmedText(fallback);
  return (
    readTrimmedText(table?.[subSkillKey]) ||
    (fallbackKey ? readTrimmedText(table?.[fallbackKey]) : null) ||
    humanizeIdentifier(fallbackKey || subSkillKey)
  );
}

export function getWeaponGameName(slug: string, locale?: string | null) {
  const entry = getWeaponEntry(slug, locale);
  return readTrimmedText(entry?.name) || humanizeIdentifier(slug);
}

export function getWeaponSkillName(
  slug: string,
  skillKey: 'skill1' | 'skill2' | 'skill3',
  locale?: string | null,
  fallback?: string | null,
) {
  const entry = getWeaponEntry(slug, locale);
  return (
    readTrimmedText(entry?.[skillKey]?.name) ||
    readTrimmedText(fallback) ||
    humanizeIdentifier(skillKey)
  );
}

export function getWeaponSkillDescription(
  slug: string,
  skillKey: 'skill1' | 'skill2' | 'skill3',
  locale?: string | null,
  level?: number | null,
) {
  const entry = getWeaponEntry(slug, locale);
  const description = readTrimmedText(entry?.[skillKey]?.description);
  if (!description || !level) return description;
  return formatIndexedDescription(description, getIndexedValues(entry?.[skillKey]?.values, level));
}

export function getWeaponSkillPrefix(
  slug: string,
  skillKey: 'skill1' | 'skill2' | 'skill3',
  locale?: string | null,
) {
  const entry = getWeaponEntry(slug, locale);
  return readTrimmedText(entry?.[skillKey]?.prefix);
}

export function getGearPieceGameName(slug: string, locale?: string | null) {
  const source = gameLocaleRegistry.getFamily(
    normalizeLocale(locale ?? i18n.global.locale.value),
    'gears',
  );
  const entry = (source.gearpieces as LocaleTable)[slug];
  return typeof entry?.name === 'string' && entry.name.trim()
    ? entry.name.trim()
    : humanizeIdentifier(slug);
}

export function getGearSetGameName(slug: string, locale?: string | null) {
  const entry = getGearSetEntry(slug, locale);
  return readTrimmedText(entry?.setName ?? entry?.name) || humanizeIdentifier(slug);
}

export function getGearSetGameDescription(slug: string, locale?: string | null) {
  const entry = getGearSetEntry(slug, locale);
  if (!entry || typeof entry !== 'object') return null;
  return readTrimmedText(entry.description);
}

export function getGearSetZhName(slug: string) {
  const entry = (gameLocaleRegistry.getFamily('zh-CN', 'gears').gearsets as LocaleTable)[slug];
  return readTrimmedText(entry?.setName ?? entry?.name);
}

export function getEnemyGameName(slug: string, locale?: string | null) {
  const entry = getEnemyEntry(slug, locale);
  return readTrimmedText(entry?.name) || humanizeIdentifier(slug);
}

export function getGameElementName(key: string, locale?: string | null) {
  return getGameEnumValue('element', key, locale) || humanizeIdentifier(key);
}

export function getGameClassName(key: string, locale?: string | null) {
  return getGameEnumValue('class', key, locale) || humanizeIdentifier(key);
}

export function getGameWeaponTypeName(key: string, locale?: string | null) {
  return getGameEnumValue('weaponType', key, locale) || humanizeIdentifier(key);
}

export function getGameSlotTypeName(key: string, locale?: string | null) {
  return getGameEnumValue('slotType', key, locale) || humanizeIdentifier(key);
}

export function getGameQualityName(key: string, locale?: string | null) {
  return getGameEnumValue('quality', key, locale) || humanizeIdentifier(key);
}

export function getGameAttributeName(key: string, locale?: string | null) {
  return getGameEnumValue('attribute', key, locale) || humanizeIdentifier(key);
}

export function getOperatorUiLabel(
  key: 'promote' | 'promoted' | 'fullyPromoted' | 'promotionUnavailable',
  locale?: string | null,
) {
  return getGameEnumValue('operatorUi', key, locale) || humanizeIdentifier(key);
}

export function getWeaponUiLabel(
  key: 'tuned' | 'fullyTuned' | 'tuningUnavailable',
  locale?: string | null,
) {
  return getGameEnumValue('weaponUi', key, locale) || humanizeIdentifier(key);
}
