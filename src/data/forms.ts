import type { OperatorSheet, WeaponSheet } from './types';

/**
 * Resolve an operator's effective sheet for a form key by layering the form's per-entry
 * overrides onto the general (base) sections: combatSkills merged by skill key, talents/
 * potentials merged by index. Identity when the sheet has no forms or the key is null/unknown.
 */
export function applyForm(sheet: OperatorSheet, formKey: string | null | undefined): OperatorSheet {
  if (!sheet.forms || !formKey) return sheet;
  const form = sheet.forms.forms.find(f => f.key === formKey);
  if (!form) return sheet;
  return {
    ...sheet,
    combatSkills: form.combatSkills
      ? { ...sheet.combatSkills, ...form.combatSkills }
      : sheet.combatSkills,
    talents: mergeByIndex(sheet.talents, form.talents),
    potentials: mergeByIndex(sheet.potentials, form.potentials),
  };
}

function mergeByIndex<T>(base: T[], overrides?: (T | undefined)[]): T[] {
  if (!overrides) return base;
  return base.map((entry, i) => overrides[i] ?? entry);
}

/**
 * Resolve a weapon's effective sheet for a form key by replacing each skill slot the form names
 * with its override; unlisted slots keep the base (general-form) skill. Identity when the sheet has
 * no forms or the key is null/unknown.
 */
export function applyWeaponForm(
  sheet: WeaponSheet,
  formKey: string | null | undefined,
): WeaponSheet {
  if (!sheet.forms || !formKey) return sheet;
  const form = sheet.forms.forms.find(f => f.key === formKey);
  if (!form) return sheet;
  return {
    ...sheet,
    skill1: form.skill1 ?? sheet.skill1,
    skill2: form.skill2 ?? sheet.skill2,
    skill3: form.skill3 ?? sheet.skill3,
  };
}
