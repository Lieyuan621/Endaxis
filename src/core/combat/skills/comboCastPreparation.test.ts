import { describe, expect, it } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { prepareComboCast } from './comboCastPreparation';
import { applySkillCastStartPreparation } from './skillCastStartPreparation';
import { StateStepper } from '../runtime/stateStepper';
import type { PendingComboCondition } from './comboSkillConditionRuntime';

function pending(
  assignPairs: PendingComboCondition['assignPairs'] = {
    local: 4,
    label: 'saved',
    empty: null,
    EntityBB_value: 9,
  },
): PendingComboCondition {
  return {
    event: {
      event: 'beforeTakeInfliction',
      payload: {
        sourceId: 'owner',
        targetId: 'enemy',
        skillId: 'test',
        element: 'nature',
        isExtra: false,
      },
    },
    inputTarget: { kind: 'operator', operatorId: 'owner' },
    triggerTarget: { kind: 'enemy' },
    assignPairs,
  };
}

describe('木桩连携施法准备', () => {
  it('普通技能的评分目标直接绑定固定主目标', () => {
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    applySkillCastStartPreparation(prepareComboCast({ smartTarget: 'enemy' }), context);
    expect(context.targetContext.get('smart_target')).toEqual([{ kind: 'enemy' }]);
  });

  it('绑定真实 trigger/smart_target，快照只覆盖 direct，保留字符串/null', () => {
    const source = { local: 4, label: 'saved', empty: null, EntityBB_value: 9 };
    const callback = prepareComboCast({ smartTarget: 'trigger' }, pending(source));
    source.local = 99;
    const entity = new ActionBlackboard({ EntityBB_value: 2 });
    const context = {
      blackboard: new ActionBlackboard({ local: 0 }, entity),
      targetContext: new RuntimeTargetContext(),
    };
    const session = new StateStepper(
      { preparation: callback },
      (step, _: undefined) => step.state.preparation,
    );
    const saved = session.save();
    session.restore(saved);
    applySkillCastStartPreparation(session.step(undefined), context);
    expect(context.blackboard.snapshot()).toEqual({
      local: 4,
      label: 'saved',
      empty: null,
      EntityBB_value: 9,
    });
    expect(entity.getNumber('EntityBB_value')).toBe(2);
    expect(context.targetContext.get('trigger')).toEqual([{ kind: 'enemy' }]);
    expect(context.targetContext.get('smart_target')).toEqual([{ kind: 'enemy' }]);
  });

  it.each([null, {}])('禁用/空局部板 %j 不覆盖技能初值', assignPairs => {
    const context = {
      blackboard: new ActionBlackboard({ local: 3 }),
      targetContext: new RuntimeTargetContext(),
    };
    applySkillCastStartPreparation(prepareComboCast({}, pending(assignPairs)), context);
    expect(context.blackboard.snapshot()).toEqual({ local: 3 });
    expect(context.targetContext.getOptional('smart_target')).toBeUndefined();
  });

  it('无候选时只建立固定主目标，不创建 trigger 或沿用候选板', () => {
    const context = {
      blackboard: new ActionBlackboard({ local: 0 }),
      targetContext: new RuntimeTargetContext(),
    };
    applySkillCastStartPreparation(prepareComboCast({ smartTarget: 'trigger' }), context);
    expect(context.blackboard.snapshot()).toEqual({ local: 0 });
    expect(context.targetContext.getOptional('trigger')).toBeUndefined();
    expect(context.targetContext.get('smart_target')).toEqual([{ kind: 'enemy' }]);
  });

  it('output 事件 input 为木桩时可以选择 input，但保留友方 trigger 身份', () => {
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    applySkillCastStartPreparation(
      prepareComboCast(
        { smartTarget: 'input' },
        {
          ...pending(),
          inputTarget: { kind: 'enemy' },
          triggerTarget: { kind: 'operator', operatorId: 'owner' },
        },
      ),
      context,
    );
    expect(context.targetContext.get('trigger')).toEqual([
      { kind: 'operator', operatorId: 'owner' },
    ]);
    expect(context.targetContext.get('smart_target')).toEqual([{ kind: 'enemy' }]);
  });

  it.each(['input', 'trigger'] as const)('保留 %s 中的真实干员目标，不强换成敌人', smartTarget => {
    const operator = { kind: 'operator' as const, operatorId: 'owner' };
    const result = prepareComboCast({ smartTarget }, { ...pending(), triggerTarget: operator });
    expect(result.smartTarget).toEqual(operator);
    expect(result.trigger).toEqual(operator);
    expect(result.smartTarget).not.toBe(operator);
  });

  it('不把尚未支持的能力实体候选静默改成敌人', () => {
    expect(() =>
      prepareComboCast(
        { smartTarget: 'input' },
        {
          ...pending(),
          inputTarget: { kind: 'abilityEntity', instanceId: 1 },
        },
      ),
    ).toThrow('abilityEntity target');
  });
});
