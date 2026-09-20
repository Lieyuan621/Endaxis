import { describe, expect, it } from 'vitest';
import {
  EQUIPMENT_CONTRIBUTION_EDITOR_COVERAGE,
  EQUIPMENT_EVENT_HANDLER_EDITOR_COVERAGE,
  EQUIPMENT_MODIFIER_EDITOR_COVERAGE,
  GEAR_DEFINITION_EDITOR_COVERAGE,
  GEAR_INSTANCE_EDITOR_COVERAGE,
  GEAR_SET_DEFINITION_EDITOR_COVERAGE,
  GEAR_TRAIT_EDITOR_COVERAGE,
  WEAPON_DEFINITION_EDITOR_COVERAGE,
  WEAPON_INSTANCE_EDITOR_COVERAGE,
  WEAPON_TRAIT_EDITOR_COVERAGE,
} from './equipmentDefinitionEditorCoverage';

describe('equipment definition editor coverage', () => {
  it('定义、贡献、词条和实例分别拥有契约穷尽账本', () => {
    expect(Object.keys(WEAPON_DEFINITION_EDITOR_COVERAGE)).toHaveLength(8);
    expect(Object.keys(GEAR_DEFINITION_EDITOR_COVERAGE)).toHaveLength(9);
    expect(Object.keys(GEAR_SET_DEFINITION_EDITOR_COVERAGE)).toHaveLength(9);
    expect(Object.keys(EQUIPMENT_CONTRIBUTION_EDITOR_COVERAGE)).toHaveLength(6);
    expect(Object.keys(WEAPON_TRAIT_EDITOR_COVERAGE)).toHaveLength(8);
    expect(Object.keys(GEAR_TRAIT_EDITOR_COVERAGE)).toHaveLength(9);
    expect(Object.keys(WEAPON_INSTANCE_EDITOR_COVERAGE)).toHaveLength(5);
    expect(Object.keys(GEAR_INSTANCE_EDITOR_COVERAGE)).toHaveLength(2);
  });

  it('六类公共配装修正均有专用编辑边界', () => {
    expect(Object.keys(EQUIPMENT_MODIFIER_EDITOR_COVERAGE)).toEqual([
      'attribute',
      'panelStat',
      'damageBonus',
      'damageScale',
      'staticHealingIncrease',
      'skillCooldownMultiplier',
    ]);
  });

  it('事件响应保留优先级和事件身份，黑板只在能力根编辑', () => {
    expect(EQUIPMENT_EVENT_HANDLER_EDITOR_COVERAGE.priority).toBe('editable');
    expect(EQUIPMENT_EVENT_HANDLER_EDITOR_COVERAGE).not.toHaveProperty('blackboard');
    expect(EQUIPMENT_EVENT_HANDLER_EDITOR_COVERAGE.event).toBe('editable');
    expect(EQUIPMENT_EVENT_HANDLER_EDITOR_COVERAGE.abilityEvent).toBe('editable');
    expect(EQUIPMENT_EVENT_HANDLER_EDITOR_COVERAGE.sequence).toBe('structureEditable');
  });
});
