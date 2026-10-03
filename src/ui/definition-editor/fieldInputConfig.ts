/** 只有契约仍使用普通字符串、无法由类型得知引用类别的位置才在编辑层声明。 */
export const REFERENCE_FIELD_KIND: Readonly<
  Record<string, 'gearSet' | 'buff' | 'skillGroup' | 'skillSlot' | 'skill' | 'abilityEntity'>
> = {
  gearSetSlug: 'gearSet',
  buffId: 'buff',
  normalBuffId: 'buff',
  ultimateBuffId: 'buff',
  reserveArrowBuffId: 'buff',
  battleArrowBuffId: 'buff',
  pointBuffId: 'buff',
  skillGroupKey: 'skillGroup',
  skillSlotKey: 'skillSlot',
  skillKey: 'skill',
  executionSkillKey: 'skill',
  skillId: 'skill',
  targetSkillKey: 'skill',
  targetSkillId: 'skill',
  timelineContinuationSkillId: 'skill',
  timelineBlockFollowUpSkillId: 'skill',
  skillIds: 'skill',
  enhancementStateBuffId: 'buff',
  revertedSkillKey: 'skill',
  baseSkillKey: 'skill',
  defaultSkillKey: 'skill',
  firstSkillKey: 'skill',
  terminalSkillKey: 'skill',
  placementSequenceSkillKeys: 'skill',
  replacementSkillKeys: 'skill',
  stableSkillKeys: 'skill',
  normalAttackSkillKeys: 'skill',
  abilityEntityId: 'abilityEntity',
  skillKeys: 'skill',
  buffIds: 'buff',
  triggerBuffIds: 'buff',
  inheritToNextSkillIds: 'skill',
  abilityEntityIds: 'abilityEntity',
};

export type { ReferenceChoices } from '../../application/editor/referenceResolver';

/** Legacy plain-string references are scoped to their formal contract declarations.
 * A coincidentally named property in an imported/custom schema is ordinary text.
 * Keep this separate from candidates: an empty resource catalog does not erase a type.
 */
const REFERENCE_DECLARATION_FILES: Readonly<Record<string, readonly string[]>> = {
  gearSetSlug: ['equipment'],
  buffId: ['buffs', 'actions', 'operators', 'consumables'],
  normalBuffId: ['operators'],
  ultimateBuffId: ['operators'],
  reserveArrowBuffId: ['operators'],
  battleArrowBuffId: ['operators'],
  pointBuffId: ['operators'],
  skillGroupKey: ['operators'],
  skillSlotKey: ['buffs', 'actions', 'skills'],
  skillKey: ['actions', 'operators'],
  executionSkillKey: ['skills'],
  // Equipment skillId records provenance; it is not an operator skill reference.
  skillId: ['actions', 'skills'],
  targetSkillKey: ['buffs', 'actions'],
  targetSkillId: ['skills'],
  timelineContinuationSkillId: ['skills'],
  timelineBlockFollowUpSkillId: ['skills'],
  skillIds: ['actions', 'skills', 'conditions'],
  enhancementStateBuffId: ['skills'],
  revertedSkillKey: ['buffs', 'actions'],
  baseSkillKey: ['skills'],
  defaultSkillKey: ['skills'],
  firstSkillKey: ['skills'],
  terminalSkillKey: ['skills'],
  placementSequenceSkillKeys: ['skills'],
  replacementSkillKeys: ['skills'],
  stableSkillKeys: ['skills'],
  normalAttackSkillKeys: ['skills'],
  abilityEntityId: ['actions', 'operators'],
  skillKeys: ['skills'],
  triggerBuffIds: ['actions', 'buffs'],
  buffIds: ['actions', 'operators', 'conditions', 'modifiers'],
  inheritToNextSkillIds: ['actions'],
  abilityEntityIds: ['actions', 'skills', 'conditions'],
};

export function referenceKindForDeclaration(
  name: string,
  source: readonly string[] | undefined,
): string | undefined {
  const files = REFERENCE_DECLARATION_FILES[name];
  if (!files || !source?.length) return undefined;
  if (
    !source.some(origin => {
      const match = /^packages\/game-data-contract\/src\/([^/]+)\.ts:\d+:\d+$/.exec(origin);
      return match !== null && files.includes(match[1]!);
    })
  )
    return undefined;
  return REFERENCE_FIELD_KIND[name];
}
