import { translateEffectName } from '@/editor/hits/statusOptions';

type Translate = (key: string, values?: Record<string, unknown>) => string;
type TranslateExists = (key: string) => boolean;

/** Short field label for structured battle-log rows (`伤害`, `属性`, …). */
function battleLogFieldLabel(t: Translate, te: TranslateExists, fieldKey: string): string {
  const key = `battleLog.fields.${fieldKey}`;
  return te(key) ? t(key) : fieldKey;
}

export function formatBattleLogField(
  t: Translate,
  te: TranslateExists,
  fieldKey: string,
  value: string | number,
): string {
  return `${battleLogFieldLabel(t, te, fieldKey)}=${value}`;
}

/** Reuses `hitEditor.elements.*` (物理 / 灼热 / …). */
export function translateBattleLogElement(
  t: Translate,
  te: TranslateExists,
  element: string | null | undefined,
): string {
  const id = String(element || '').trim();
  if (!id) return '';
  const key = `hitEditor.elements.${id}`;
  return te(key) ? t(key) : id;
}

/** Reuses `effects.name.*` via translateEffectName (燃烧 / 碎冰 / …). */
export function translateBattleLogStatus(
  t: Translate,
  te: TranslateExists,
  statusKey: string | null | undefined,
): string {
  return translateEffectName(t, te, String(statusKey || '').trim());
}

export function translateBattleLogSpReason(
  t: Translate,
  te: TranslateExists,
  reason: string | null | undefined,
): string {
  const id = String(reason || '').trim();
  if (!id) return '';
  const key = `battleLog.spReasons.${id}`;
  return te(key) ? t(key) : id;
}

export function translateBattleLogTarget(
  t: Translate,
  te: TranslateExists,
  targetId: string | null | undefined,
): string {
  const id = String(targetId || '').trim();
  if (!id) return '';
  if (id === 'enemy') {
    const key = 'hitEditor.targetScopes.enemy';
    return te(key) ? t(key) : id;
  }
  return id;
}
