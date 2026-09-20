import { describe, expect, it } from 'vitest';
import {
  BUFF_DEFINITION_EDITOR_COVERAGE,
  BUFF_PRESENTATION_EDITOR_COVERAGE,
  getBuffDefinitionEditorCoverage,
} from './buffDefinitionEditorCoverage';

describe('Buff definition editor coverage', () => {
  it('所有字段只进入一个明确的编辑边界', () => {
    const keys = Object.keys(BUFF_DEFINITION_EDITOR_COVERAGE);
    const coverage = getBuffDefinitionEditorCoverage();

    expect(new Set(keys).size).toBe(keys.length);
    expect(Object.values(coverage).reduce((sum, count) => sum + count, 0)).toBe(keys.length);
    expect(coverage.structureEditable).toBe(4);
    expect(coverage.partiallyEditable).toBe(0);
    expect(coverage.preservedOnly).toBe(0);
  });

  it('动态数值和时间域不能再被误记为仅保留', () => {
    expect(BUFF_DEFINITION_EDITOR_COVERAGE.durationSeconds).toBe('editable');
    expect(BUFF_DEFINITION_EDITOR_COVERAGE.triggerIntervalSeconds).toBe('editable');
    expect(BUFF_DEFINITION_EDITOR_COVERAGE.maxStackCount).toBe('editable');
    expect(BUFF_DEFINITION_EDITOR_COVERAGE.maxTriggerCount).toBe('editable');
    expect(BUFF_DEFINITION_EDITOR_COVERAGE.priority).toBe('editable');
    expect(BUFF_DEFINITION_EDITOR_COVERAGE.timeClock).toBe('editable');
    expect(BUFF_DEFINITION_EDITOR_COVERAGE.blackboard).toBe('editable');
  });

  it('原生 Buff 展示身份的全部子字段都有明确控件', () => {
    expect(Object.keys(BUFF_PRESENTATION_EDITOR_COVERAGE)).toHaveLength(20);
    expect(new Set(Object.values(BUFF_PRESENTATION_EDITOR_COVERAGE))).toEqual(
      new Set(['editable']),
    );
    expect(BUFF_DEFINITION_EDITOR_COVERAGE.presentation).toBe('editable');
    expect(BUFF_DEFINITION_EDITOR_COVERAGE.childPresentations).toBe('editable');
  });
});
