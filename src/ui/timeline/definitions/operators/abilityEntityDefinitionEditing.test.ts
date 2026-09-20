import { describe, expect, it } from 'vitest';
import { validateAbilityEntityDefinition } from '../../../../core/game-data/validation/actionPrograms';
import { arcane } from '../../../../data/operators/arcane.generated';
import {
  replaceStructureValueAtPath,
  resolveStructureValue,
  structureRecordEntryPath,
} from '../skillStructureEditorCommands';
import {
  buildAbilityEntityStructureMindMap,
  indexSkillStructureNodes,
} from '../skillStructureMindMapModel';

const ENTITY_ID = 'abilityentity_chr_0032_lizhiyan_combo_skill';
const CHILD_ID = 'chr_0032_lizhiyan_combo_skill_abilityentity_end';

describe('真实能力实体定义编辑往返', () => {
  it('Arcane 多子技能全部进入导图，且每个定义仍通过严格校验', () => {
    const definition = arcane.abilityEntityDefinitions?.[ENTITY_ID];
    expect(definition).toBeDefined();
    expect(validateAbilityEntityDefinition(definition, ENTITY_ID)).toEqual([]);

    const nodes = [
      ...indexSkillStructureNodes(
        buildAbilityEntityStructureMindMap(ENTITY_ID, definition!),
      ).values(),
    ];
    const childNodes = nodes.filter(node => node.payloadKind === 'childSkill');

    expect(childNodes.map(node => node.label)).toEqual(Object.keys(definition!.childSkills!));
    expect(childNodes.every(node => node.relationToParent === 'member')).toBe(true);
  });

  it('只修改一个具名子技能的一个黑板值，不展开、重排或丢失其余真实字段', () => {
    const source = arcane.abilityEntityDefinitions?.[ENTITY_ID];
    expect(source?.childSkills?.[CHILD_ID]).toBeDefined();
    const childPath = structureRecordEntryPath('childSkills', CHILD_ID);
    const valuePath = `${childPath}.blackboard.atk_scale_boom`;
    const changed = replaceStructureValueAtPath(source!, valuePath, 7.25);

    expect(resolveStructureValue(source, valuePath)).toBe(1);
    expect(resolveStructureValue(changed, valuePath)).toBe(7.25);
    expect(Object.keys(changed.childSkills!)).toEqual(Object.keys(source!.childSkills!));
    for (const key of Object.keys(source!.childSkills!)) {
      if (key === CHILD_ID) continue;
      expect(changed.childSkills?.[key]).toEqual(source!.childSkills?.[key]);
    }
    expect(changed.childSkills?.[CHILD_ID]).toEqual({
      ...source!.childSkills?.[CHILD_ID],
      blackboard: {
        ...source!.childSkills?.[CHILD_ID]?.blackboard,
        atk_scale_boom: 7.25,
      },
    });
    expect(validateAbilityEntityDefinition(changed, ENTITY_ID)).toEqual([]);
  });
});
