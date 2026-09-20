import type { SkillBuffDefinition } from '../../../../core/game-data/operatorDefinition';
import type { SkillStructureNode } from '../skillStructureMindMapModel';

export type BuffFlatCollectionKey =
  'attributeModifiers' | 'skillSlotReplacements' | 'keywordEnhancements';
export const BUFF_FLAT_COLLECTIONS = {
  attributeModifiers: {
    label: '属性修正',
    payload: 'buffAttributeModifier',
    create: () => ({ attribute: 'Atk', slot: 'baseAddition', value: 0 }),
  },
  skillSlotReplacements: {
    label: '技能槽替换',
    payload: 'buffSlotReplacement',
    create: () => ({
      skillGroupKey: 'skill',
      targetSkillKey: '',
      revertedSkillKey: '',
      inheritOriginSkillCooldownProgress: false,
    }),
  },
  keywordEnhancements: {
    label: '关键词强化',
    payload: 'buffKeywordEnhancement',
    create: () => ({
      triggerBuffIds: [],
      operation: 'assign',
      targetKey: '',
      initialValue: 0,
      value: 0,
    }),
  },
} as const satisfies {
  [K in BuffFlatCollectionKey]: {
    label: string;
    payload: NonNullable<SkillStructureNode['payloadKind']>;
    create: () => NonNullable<SkillBuffDefinition[K]>[number];
  };
};
export function buildBuffFlatCollectionGraph(
  definition: SkillBuffDefinition,
): SkillStructureNode[] {
  return (Object.keys(BUFF_FLAT_COLLECTIONS) as BuffFlatCollectionKey[]).map(key => {
    const config = BUFF_FLAT_COLLECTIONS[key];
    const values = definition[key] ?? [];
    return {
      id: `buff:${key}`,
      sourcePath: key,
      label: config.label,
      kind: 'Buff 成员集合',
      summary: `${values.length} 项`,
      details: {},
      editorSection: 'overview',
      relationToParent: 'port',
      canAddChild: 'buffMember',
      acceptsChildKind: config.payload,
      canDelete: false,
      canCopy: false,
      canMove: false,
      children: values.map((_value, index) => ({
        id: `buff:${key}[${index}]`,
        sourcePath: `${key}[${index}]`,
        label: `${config.label} ${index + 1}`,
        kind: config.label,
        summary: '',
        details: {},
        editorSection: 'overview',
        relationToParent: 'member',
        payloadKind: config.payload,
        canDelete: true,
        canCopy: true,
        canMove: true,
        children: [],
      })),
    };
  });
}
