import { i18n } from '@/i18n'
import operatorsEn from '../i18n/game-locales/en/operators.json'
import operatorsZh from '../i18n/game-locales/zh/operators.json'
import weaponsEn from '../i18n/game-locales/en/weapons.json'
import weaponsZh from '../i18n/game-locales/zh/weapons.json'
import gearpiecesEn from '../i18n/game-locales/en/gearpieces.json'
import gearpiecesZh from '../i18n/game-locales/zh/gearpieces.json'
import gearsetsEn from '../i18n/game-locales/en/gearsets.json'
import gearsetsZh from '../i18n/game-locales/zh/gearsets.json'
import enemiesEn from '../i18n/game-locales/en/enemies.json'
import enemiesZh from '../i18n/game-locales/zh/enemies.json'

type GameLocale = 'en' | 'zh'
type LocaleTable = Record<string, any>

const operatorsEnTable = operatorsEn as LocaleTable
const operatorsZhTable = operatorsZh as LocaleTable
const weaponsEnTable = weaponsEn as LocaleTable
const weaponsZhTable = weaponsZh as LocaleTable
const gearpiecesEnTable = gearpiecesEn as LocaleTable
const gearpiecesZhTable = gearpiecesZh as LocaleTable
const gearsetsEnTable = gearsetsEn as LocaleTable
const gearsetsZhTable = gearsetsZh as LocaleTable
const enemiesEnTable = enemiesEn as LocaleTable
const enemiesZhTable = enemiesZh as LocaleTable
const gameEnumTerms = {
  en: {
    element: {
      physical: 'Physical',
      heat: 'Heat',
      cryo: 'Cryo',
      electric: 'Electric',
      nature: 'Nature',
      arts: 'Arts',
    },
    class: {
      guard: 'Guard',
      caster: 'Caster',
      defender: 'Defender',
      vanguard: 'Vanguard',
      striker: 'Striker',
      supporter: 'Supporter',
    },
    weaponType: {
      sword: 'Sword',
      greatsword: 'Greatsword',
      polearm: 'Polearm',
      handcannon: 'Handcannon',
      'arts-unit': 'Arts Unit',
      artsunit: 'Arts Unit',
    },
    slotType: {
      armor: 'Armor',
      gloves: 'Gloves',
      kit: 'Kit',
      accessory: 'Accessory',
    },
    quality: {
      green: 'Green',
      blue: 'Blue',
      purple: 'Purple',
      gold: 'Gold',
    },
    attribute: {
      strength: 'Strength',
      agility: 'Agility',
      intellect: 'Intellect',
      will: 'Will',
    },
    operatorUi: {
      promote: 'Promote',
      promoted: 'Promoted',
      fullyPromoted: 'Fully promoted',
      promotionUnavailable: 'Promotion unavailable',
    },
    weaponUi: {
      tuned: 'Tuned',
      fullyTuned: 'Fully tuned',
      tuningUnavailable: 'Tuning unavailable',
    },
  },
  zh: {
    element: {
      physical: '物理',
      heat: '灼热',
      cryo: '寒冷',
      electric: '电磁',
      nature: '自然',
      arts: '法术',
    },
    class: {
      guard: '近卫',
      caster: '术师',
      defender: '重装',
      vanguard: '先锋',
      striker: '突击',
      supporter: '辅助',
    },
    weaponType: {
      sword: '单手剑',
      greatsword: '双手剑',
      polearm: '长柄武器',
      handcannon: '手铳',
      'arts-unit': '施术单元',
      artsunit: '施术单元',
    },
    slotType: {
      armor: '护甲',
      gloves: '护手',
      kit: '配件',
      accessory: '配件',
    },
    quality: {
      green: '绿色',
      blue: '蓝色',
      purple: '紫色',
      gold: '金色',
    },
    attribute: {
      strength: '力量',
      agility: '敏捷',
      intellect: '智识',
      will: '意志',
    },
    operatorUi: {
      promote: '精英化',
      promoted: '精英化',
      fullyPromoted: '满精英化',
      promotionUnavailable: '无法精英化',
    },
    weaponUi: {
      tuned: '突破',
      fullyTuned: '满突破',
      tuningUnavailable: '无法突破',
    },
  },
} as const

function resolveGameLocale(localeLike?: string | null): GameLocale {
  const locale = String(localeLike || i18n.global.locale.value || '').toLowerCase()
  if (locale.startsWith('zh')) return 'zh'
  return 'en'
}

function humanizeIdentifier(value: string | null | undefined) {
  if (!value) return ''
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getSource<T extends Record<string, any>>(zhSource: T, enSource: T, locale?: string | null) {
  return resolveGameLocale(locale) === 'zh' ? zhSource : enSource
}

function getEntry<T extends Record<string, any>>(zhSource: T, enSource: T, slug: string, locale?: string | null) {
  const source = getSource(zhSource, enSource, locale)
  return source?.[slug] || null
}

function getEnemyEntry(slug: string, locale?: string | null) {
  const source = getSource(enemiesZhTable, enemiesEnTable, locale)
  return source?.[slug] || source?.[slug?.replace(/-/g, '_')] || null
}

function readTrimmedText(value: unknown): string | null {
  return (typeof value === 'string' && value.trim()) ? value.trim() : null
}

function getOperatorEntry(slug: string, locale?: string | null) {
  return getEntry(operatorsZhTable, operatorsEnTable, slug, locale)
}

function getWeaponEntry(slug: string, locale?: string | null) {
  return getEntry(weaponsZhTable, weaponsEnTable, slug, locale)
}

function getGearSetEntry(slug: string, locale?: string | null) {
  return getEntry(gearsetsZhTable, gearsetsEnTable, slug, locale)
}

function getGameEnumValue(
  group: keyof typeof gameEnumTerms.en,
  key: string | null | undefined,
  locale?: string | null,
) {
  const normalizedKey = String(key || '').trim().toLowerCase()
  const table = gameEnumTerms[resolveGameLocale(locale)][group] as Record<string, string>
  return table?.[normalizedKey] || table?.[normalizedKey.replace(/\s+/g, '')] || null
}

export function getOperatorGameName(slug: string, locale?: string | null) {
  const entry = getOperatorEntry(slug, locale)
  return readTrimmedText(entry?.name) || humanizeIdentifier(slug)
}

export function getOperatorTalentName(
  slug: string,
  flatStartIndex: number,
  levelIndex = 0,
  locale?: string | null,
) {
  const entry = getOperatorEntry(slug, locale)
  const talents = Array.isArray(entry?.talents) ? entry.talents : []
  const safeFlatStartIndex = Math.max(0, Number(flatStartIndex) || 0)
  const safeLevelIndex = Math.max(0, Number(levelIndex) || 0)
  const flatIndex = safeFlatStartIndex + safeLevelIndex
  return (
    readTrimmedText(talents[flatIndex]?.name)
    || readTrimmedText(talents[safeFlatStartIndex]?.name)
    || `Talent ${safeFlatStartIndex + 1}`
  )
}

export function getOperatorTalentDescription(
  slug: string,
  flatStartIndex: number,
  levelIndex = 0,
  locale?: string | null,
) {
  const entry = getOperatorEntry(slug, locale)
  const talents = Array.isArray(entry?.talents) ? entry.talents : []
  const safeFlatStartIndex = Math.max(0, Number(flatStartIndex) || 0)
  const safeLevelIndex = Math.max(0, Number(levelIndex) || 0)
  const flatIndex = safeFlatStartIndex + safeLevelIndex
  return (
    readTrimmedText(talents[flatIndex]?.description)
    || readTrimmedText(talents[safeFlatStartIndex]?.description)
    || null
  )
}

export function getOperatorPotentialName(slug: string, potentialIndex: number, locale?: string | null) {
  const entry = getOperatorEntry(slug, locale)
  const potentials = Array.isArray(entry?.potentials) ? entry.potentials : []
  const safeIndex = Math.max(0, Number(potentialIndex) || 0)
  return readTrimmedText(potentials[safeIndex]?.name) || `Potential ${safeIndex + 1}`
}

export function getOperatorPotentialDescription(slug: string, potentialIndex: number, locale?: string | null) {
  const entry = getOperatorEntry(slug, locale)
  const potentials = Array.isArray(entry?.potentials) ? entry.potentials : []
  const safeIndex = Math.max(0, Number(potentialIndex) || 0)
  return readTrimmedText(potentials[safeIndex]?.description)
}

export function getOperatorCombatSkillName(slug: string, skillKey: string, locale?: string | null, fallback?: string | null) {
  const entry = getOperatorEntry(slug, locale)
  return (
    readTrimmedText(entry?.combatSkills?.[skillKey]?.name)
    || readTrimmedText(fallback)
    || humanizeIdentifier(skillKey)
  )
}

export function getOperatorCombatSkillDescription(slug: string, skillKey: string, locale?: string | null) {
  const entry = getOperatorEntry(slug, locale)
  return readTrimmedText(entry?.combatSkills?.[skillKey]?.description) || ''
}

export function getOperatorSubSkillName(slug: string, subSkillKey: string, locale?: string | null, fallback?: string | null) {
  const entry = getOperatorEntry(slug, locale)
  return (
    readTrimmedText(entry?.subSkills?.[subSkillKey])
    || readTrimmedText(fallback)
    || humanizeIdentifier(subSkillKey)
  )
}

export function getWeaponGameName(slug: string, locale?: string | null) {
  const entry = getWeaponEntry(slug, locale)
  return readTrimmedText(entry?.name) || humanizeIdentifier(slug)
}

export function getWeaponSkillName(slug: string, skillKey: 'skill1' | 'skill2' | 'skill3', locale?: string | null, fallback?: string | null) {
  const entry = getWeaponEntry(slug, locale)
  return (
    readTrimmedText(entry?.[skillKey]?.name)
    || readTrimmedText(fallback)
    || humanizeIdentifier(skillKey)
  )
}

export function getWeaponSkillDescription(slug: string, skillKey: 'skill1' | 'skill2' | 'skill3', locale?: string | null) {
  const entry = getWeaponEntry(slug, locale)
  return readTrimmedText(entry?.[skillKey]?.description)
}

export function getWeaponSkillPrefix(slug: string, skillKey: 'skill1' | 'skill2' | 'skill3', locale?: string | null) {
  const entry = getWeaponEntry(slug, locale)
  return readTrimmedText(entry?.[skillKey]?.prefix)
}

export function getGearPieceGameName(slug: string, locale?: string | null) {
  const entry = getEntry(gearpiecesZhTable, gearpiecesEnTable, slug, locale)
  return (typeof entry?.name === 'string' && entry.name.trim()) ? entry.name.trim() : humanizeIdentifier(slug)
}

export function getGearSetGameName(slug: string, locale?: string | null) {
  const entry = getGearSetEntry(slug, locale)
  return readTrimmedText(entry?.setName ?? entry?.name) || humanizeIdentifier(slug)
}

export function getGearSetPassiveText(slug: string, locale?: string | null) {
  const entry = getGearSetEntry(slug, locale)
  return readTrimmedText(entry?.passive)
}

export function getGearSetConditionalText(slug: string, locale?: string | null) {
  const entry = getGearSetEntry(slug, locale)
  return readTrimmedText(entry?.conditional)
}

export function getGearSetZhName(slug: string) {
  const entry = gearsetsZhTable?.[slug]
  return readTrimmedText(entry?.setName ?? entry?.name)
}

export function getEnemyGameName(slug: string, locale?: string | null) {
  const entry = getEnemyEntry(slug, locale)
  return readTrimmedText(entry?.name) || humanizeIdentifier(slug)
}

export function getGameElementName(key: string, locale?: string | null) {
  return getGameEnumValue('element', key, locale) || humanizeIdentifier(key)
}

export function getGameClassName(key: string, locale?: string | null) {
  return getGameEnumValue('class', key, locale) || humanizeIdentifier(key)
}

export function getGameWeaponTypeName(key: string, locale?: string | null) {
  return getGameEnumValue('weaponType', key, locale) || humanizeIdentifier(key)
}

export function getGameSlotTypeName(key: string, locale?: string | null) {
  return getGameEnumValue('slotType', key, locale) || humanizeIdentifier(key)
}

export function getGameQualityName(key: string, locale?: string | null) {
  return getGameEnumValue('quality', key, locale) || humanizeIdentifier(key)
}

export function getGameAttributeName(key: string, locale?: string | null) {
  return getGameEnumValue('attribute', key, locale) || humanizeIdentifier(key)
}

export function getOperatorUiLabel(
  key: 'promote' | 'promoted' | 'fullyPromoted' | 'promotionUnavailable',
  locale?: string | null,
) {
  return gameEnumTerms[resolveGameLocale(locale)].operatorUi[key]
}

export function getWeaponUiLabel(
  key: 'tuned' | 'fullyTuned' | 'tuningUnavailable',
  locale?: string | null,
) {
  return gameEnumTerms[resolveGameLocale(locale)].weaponUi[key]
}
