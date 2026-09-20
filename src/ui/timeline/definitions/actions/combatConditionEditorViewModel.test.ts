import { describe, expect, it } from 'vitest';
import {
  COMBAT_CONDITION_KINDS,
  type SkillDefinition,
} from '../../../../core/game-data/operatorDefinition';
import { validateSkillDefinition } from '../../../../core/game-data/validateSkillDefinition';
import {
  createCombatCondition,
  parseConditionIntegerList,
  parseConditionStringList,
} from './combatConditionEditorViewModel';

describe('combatConditionEditorViewModel', () => {
  it('每种条件默认结构都能通过技能定义严格校验', () => {
    for (const kind of COMBAT_CONDITION_KINDS) {
      const conditional = {
        kind: 'conditional' as const,
        parameters: { condition: createCombatCondition(kind) },
        whenTrue: { steps: [] },
      };
      const definition: SkillDefinition = {
        key: `condition-${kind}`,
        timelineBlockFrames: 1,
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: {
              steps:
                kind === 'abilityEntityRemainingDurationCompare'
                  ? [
                      {
                        kind: 'forEachContextTarget',
                        parameters: { contextKey: 'entities' },
                        body: { steps: [conditional] },
                      },
                    ]
                  : [conditional],
            },
          },
        ],
      };
      expect(validateSkillDefinition(definition), kind).toEqual([]);
    }
  });

  it('列表文本只接受非空字符串或完整整数', () => {
    expect(parseConditionStringList('a, b\nc')).toEqual(['a', 'b', 'c']);
    expect(parseConditionStringList(' , ')).toBeUndefined();
    expect(parseConditionIntegerList('1, 2\n3')).toEqual([1, 2, 3]);
    expect(parseConditionIntegerList('1, 2.5')).toBeUndefined();
  });
});
