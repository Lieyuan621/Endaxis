import { SKILL_TYPES } from '@/data/enums';

/** Maps optimizer / sheet skill types to `skillType.*` display keys (普攻 / 战技 / …). */
const OPTIMIZER_TO_DISPLAY_TYPE: Record<string, string> = {
  basicAttack: 'attack',
  battleSkill: 'skill',
  comboSkill: 'link',
  ultimate: 'ultimate',
  finisher: 'execution',
  finalStrike: 'execution',
  dive: 'dive',
};

export const BATTLE_LOG_UNKNOWN_SKILL_KIND = 'unknown';

const SKILL_KIND_ORDER = Object.freeze([
  ...SKILL_TYPES,
  'finisher',
  BATTLE_LOG_UNKNOWN_SKILL_KIND,
]);

export function sortBattleLogSkillKinds(kinds: readonly string[]): string[] {
  const rank = new Map(SKILL_KIND_ORDER.map((kind, index) => [kind, index]));
  return [...kinds].sort((a, b) => {
    const left = rank.has(a) ? rank.get(a)! : SKILL_KIND_ORDER.length;
    const right = rank.has(b) ? rank.get(b)! : SKILL_KIND_ORDER.length;
    if (left !== right) return left - right;
    return a.localeCompare(b);
  });
}

export function battleLogSkillKindLabel(
  t: (key: string) => string,
  te: (key: string) => boolean,
  kind: string | null | undefined,
): string {
  const id = String(kind || '').trim() || BATTLE_LOG_UNKNOWN_SKILL_KIND;
  if (id === BATTLE_LOG_UNKNOWN_SKILL_KIND) {
    return te('skillType.unknown') ? t('skillType.unknown') : id;
  }
  const display = OPTIMIZER_TO_DISPLAY_TYPE[id] || id;
  const key = `skillType.${display}`;
  return te(key) ? t(key) : id;
}
