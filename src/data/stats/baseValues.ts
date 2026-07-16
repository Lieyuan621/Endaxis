import type { OperatorInstance, WeaponInstance } from '../../types';
import type { Attributes, BaseStatValues } from './types';
import { getOperator, getWeapon } from '../index';

// ─── Level index map ────────────────────────────────────────────────────────

const LEVEL_INDEX: Record<number, number> = { 1: 0, 20: 1, 40: 2, 60: 3, 80: 4, 90: 5 };

// ─── Promotion helpers ──────────────────────────────────────────────────────

/** Main attribute bonus per promotion: [promo1, promo2, promo3, promo4]. */
const PROMOTION_ATTR_BONUS = [10, 15, 15, 20];

/** Count completed promotions based on level + promoted flag. */
export function getPromotionCount(level: number, promoted: boolean): number {
  if (level >= 90) return 4;
  if (level >= 80) return promoted ? 4 : 3;
  if (level >= 60) return promoted ? 3 : 2;
  if (level >= 40) return promoted ? 2 : 1;
  if (level >= 20) return promoted ? 1 : 0;
  return 0;
}

/** Cumulative main attribute bonus from trust level (0-4). */
export function getTrustAttrBonus(trustLevel: number): number {
  const clamped = Math.min(Math.max(0, trustLevel), PROMOTION_ATTR_BONUS.length);
  let total = 0;
  for (let i = 0; i < clamped; i++) total += PROMOTION_ATTR_BONUS[i] ?? 0;
  return total;
}

// ─── Attribute name mapping ────────────────────────────────────────────────

/** Maps attribute display name to key (accepts both capitalized and lowercase). */
export const ATTR_MAP: Record<string, keyof Attributes> = {
  Strength: 'strength',
  Agility: 'agility',
  Intellect: 'intellect',
  Will: 'will',
  strength: 'strength',
  agility: 'agility',
  intellect: 'intellect',
  will: 'will',
};

// ─── Base stat extraction ──────────────────────────────────────────────────

/**
 * Extract base stat values from operator and weapon instances.
 * Includes promotion bonus applied to the main attribute.
 */
export function getBaseStatValues(
  opInst: OperatorInstance,
  wInst?: WeaponInstance,
): BaseStatValues {
  const opData = getOperator(opInst.operatorSlug);
  const levelIdx = LEVEL_INDEX[opInst.level] ?? 5;

  const baseAtk = opData?.attributes['Base ATK']?.[levelIdx] ?? 0;
  const baseHp = opData?.attributes['Base HP']?.[levelIdx] ?? 0;
  const baseAttrs: Attributes = {
    strength: opData?.attributes['Strength']?.[levelIdx] ?? 0,
    agility: opData?.attributes['Agility']?.[levelIdx] ?? 0,
    intellect: opData?.attributes['Intellect']?.[levelIdx] ?? 0,
    will: opData?.attributes['Will']?.[levelIdx] ?? 0,
  };

  const mainAttributeName = opData?.mainAttribute ?? 'Agility';
  const secondaryAttributeName = opData?.subAttribute ?? 'Intellect';

  // Apply trust-level bonus to main attribute (replaces auto-computed promotion bonus)
  const trustBonus = getTrustAttrBonus(opInst.trustLevel ?? 0);
  const mainAttrKey = ATTR_MAP[mainAttributeName];
  if (mainAttrKey) {
    baseAttrs[mainAttrKey] += trustBonus;
  }

  // Weapon base ATK
  const weaponData = wInst ? getWeapon(wInst.weaponSlug) : undefined;
  const weaponLevelIdx = wInst ? (LEVEL_INDEX[wInst.level] ?? 5) : 0;
  const weaponAtk = weaponData?.baseAtk[weaponLevelIdx] ?? 0;

  return {
    level: opInst.level,
    baseAtk,
    baseHp,
    weaponAtk,
    baseAttrs,
    mainAttributeName,
    secondaryAttributeName,
  };
}
