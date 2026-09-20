import { describe, expect, it } from 'vitest';
import { COMBAT_STEP_KINDS } from '../../../../core/game-data/operatorDefinition';
import {
  EDITABLE_COMBAT_STEP_KINDS,
  createSkillEditorStep,
} from '../skills/skillDefinitionEditorViewModel';
import {
  PENDING_COMBAT_STEP_EDITOR_KINDS,
  getCombatStepEditorCoverage,
} from './combatStepEditorCoverage';

describe('CombatStep editor coverage', () => {
  it('公共步骤恰好进入可编辑目录或一个显式待办优先级', () => {
    const pending = Object.values(PENDING_COMBAT_STEP_EDITOR_KINDS).flat();
    const all = [...EDITABLE_COMBAT_STEP_KINDS, ...pending];

    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual([...COMBAT_STEP_KINDS].sort());
    expect(getCombatStepEditorCoverage()).toEqual({
      total: COMBAT_STEP_KINDS.length,
      editable: EDITABLE_COMBAT_STEP_KINDS.length,
      pending: {
        'visible-result': PENDING_COMBAT_STEP_EDITOR_KINDS['visible-result'].length,
        'runtime-structure': PENDING_COMBAT_STEP_EDITOR_KINDS['runtime-structure'].length,
        'stump-low': PENDING_COMBAT_STEP_EDITOR_KINDS['stump-low'].length,
      },
    });
  });

  it('可编辑目录中的每种步骤都由默认草稿工厂穷尽处理', () => {
    const draft = {
      key: 'coverage',
      timelineBlockFrames: 1,
      scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
    };
    for (const kind of EDITABLE_COMBAT_STEP_KINDS) {
      expect(createSkillEditorStep(draft, kind).kind).toBe(kind);
    }
  });
});
