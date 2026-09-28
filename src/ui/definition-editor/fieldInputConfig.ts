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
};

export interface FieldChoice {
  readonly value: string;
  readonly label: string;
}
export type ReferenceChoices = Readonly<Record<string, readonly FieldChoice[]>>;
