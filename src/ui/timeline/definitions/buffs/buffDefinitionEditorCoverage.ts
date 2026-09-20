import type { SkillBuffDefinition } from '../../../../core/game-data/operatorDefinition';
import type { CombatBuffPresentation } from '../../../../../packages/game-data-contract/src/buffs';

export type BuffDefinitionEditorCoverage =
  'editable' | 'partiallyEditable' | 'structureEditable' | 'preservedOnly';

/**
 * Buff 根定义 Inspector 的顶层字段覆盖账本。
 *
 * 这份表不重新定义 Buff 协议；`satisfies Record<keyof SkillBuffDefinition, ...>` 保证
 * 公共契约每次增删字段时都必须在这里明确选择编辑边界，避免新字段被界面静默忽略。
 */
export const BUFF_DEFINITION_EDITOR_COVERAGE = {
  affixSkillCastIdentity: 'editable',
  presentation: 'editable',
  childPresentations: 'editable',
  timeClock: 'editable',
  applyTags: 'editable',
  extendTags: 'editable',
  stackingType: 'editable',
  stackingKey: 'editable',
  priority: 'editable',
  durationSeconds: 'editable',
  addingCooldownSeconds: 'editable',
  ignoreAddingCooldown: 'editable',
  triggerIntervalSeconds: 'editable',
  waitFirstTriggerInterval: 'editable',
  maxTriggerCount: 'editable',
  blackboard: 'editable',
  attributeModifiers: 'editable',
  damageModifiers: 'editable',
  keywordEnhancements: 'editable',
  healModifiers: 'editable',
  poiseModifiers: 'editable',
  shields: 'editable',
  sustainedProtection: 'editable',
  role: 'editable',
  spellBurst: 'editable',
  maxStackCount: 'editable',
  scheduledSequences: 'structureEditable',
  lifecycleSequences: 'structureEditable',
  abilityEventResponses: 'structureEditable',
  igniteEventResponses: 'structureEditable',
  skillSlotReplacements: 'editable',
} as const satisfies Readonly<Record<keyof SkillBuffDefinition, BuffDefinitionEditorCoverage>>;

/** presentation 子字段同样必须随公共契约穷尽，不能只靠根字段的 editable 标签兜底。 */
export const BUFF_PRESENTATION_EDITOR_COVERAGE = {
  iconId: 'editable',
  iconPath: 'editable',
  visible: 'editable',
  showInHeadBarCommon: 'editable',
  showInHeadBarAttached: 'editable',
  showInSquadIcon: 'editable',
  onlyShowForMainCharacter: 'editable',
  blinkInMainCharHpBar: 'editable',
  showProgressInHpBar: 'editable',
  showProgressInNormalSkillButton: 'editable',
  useWeakProgressInNormalSkillButton: 'editable',
  showProgressInUltimateSkillButton: 'editable',
  forceRaiseIconEvent: 'editable',
  showWarningBackground: 'editable',
  playStrongInAnimation: 'editable',
  hasCharHpBarVfxType: 'editable',
  charHpBarVfxType: 'editable',
  iconStyleInSquad: 'editable',
  abnormalColorType: 'editable',
  orderPriority: 'editable',
} as const satisfies Readonly<Record<keyof CombatBuffPresentation, 'editable'>>;

export function getBuffDefinitionEditorCoverage(): Readonly<
  Record<BuffDefinitionEditorCoverage, number>
> {
  const result: Record<BuffDefinitionEditorCoverage, number> = {
    editable: 0,
    partiallyEditable: 0,
    structureEditable: 0,
    preservedOnly: 0,
  };
  for (const status of Object.values(BUFF_DEFINITION_EDITOR_COVERAGE)) result[status] += 1;
  return result;
}
