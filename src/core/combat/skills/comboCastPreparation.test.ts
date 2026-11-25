import { describe, expect, it } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import { prepareComboCast } from './comboCastPreparation';
import { applySkillCastStartPreparation } from './skillCastStartPreparation';
import { createStateTestSession } from '../../../test/stateTestSession';
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
    inputTargets: [{ kind: 'operator', operatorId: 'owner' }],
    triggerTargets: [{ kind: 'enemy', enemyId: 'enemy' }],
    assignPairs,
  };
}

describe('木桩连携施法准备', () => {
  it('普通技能的评分目标直接绑定固定主目标', () => {
    const context = {
      blackboard: new ActionBlackboard(),
      targetContext: new RuntimeTargetContext(),
    };
    applySkillCastStartPreparation(
      prepareComboCast(
        { smartTarget: 'enemy' },
        undefined,
        { kind: 'enemy', enemyId: 'enemy' },
        () => true,
      ),
      context,
    );
    expect(context.targetContext.get('smart_target')).toEqual([
      { kind: 'enemy', enemyId: 'enemy' },
    ]);
  });

  it('绑定真实 trigger/smart_target，快照只覆盖 direct，保留字符串/null', () => {
    const source = { local: 4, label: 'saved', empty: null, EntityBB_value: 9 };
    const callback = prepareComboCast(
      { smartTarget: 'trigger' },
      pending(source),
      {
        kind: 'enemy',
        enemyId: 'enemy',
      },
      () => true,
    );
    source.local = 99;
    const entity = new ActionBlackboard({ EntityBB_value: 2 });
    const context = {
      blackboard: new ActionBlackboard({ local: 0 }, entity),
      targetContext: new RuntimeTargetContext(),
    };
    const session = createStateTestSession(
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
    expect(context.targetContext.get('trigger')).toEqual([{ kind: 'enemy', enemyId: 'enemy' }]);
    expect(context.targetContext.get('smart_target')).toEqual([
      { kind: 'enemy', enemyId: 'enemy' },
    ]);
  });

  it.each([null, {}])('禁用/空局部板 %j 不覆盖技能初值', assignPairs => {
    const context = {
      blackboard: new ActionBlackboard({ local: 3 }),
      targetContext: new RuntimeTargetContext(),
    };
    applySkillCastStartPreparation(
      prepareComboCast({}, pending(assignPairs), { kind: 'enemy', enemyId: 'enemy' }, () => true),
      context,
    );
    expect(context.blackboard.snapshot()).toEqual({ local: 3 });
    expect(context.targetContext.getOptional('smart_target')).toBeUndefined();
  });

  it('无候选时只建立固定主目标，不创建 trigger 或沿用候选板', () => {
    const context = {
      blackboard: new ActionBlackboard({ local: 0 }),
      targetContext: new RuntimeTargetContext(),
    };
    applySkillCastStartPreparation(
      prepareComboCast(
        { smartTarget: 'trigger' },
        undefined,
        { kind: 'enemy', enemyId: 'enemy' },
        () => true,
      ),
      context,
    );
    expect(context.blackboard.snapshot()).toEqual({ local: 0 });
    expect(context.targetContext.getOptional('trigger')).toBeUndefined();
    expect(context.targetContext.get('smart_target')).toEqual([
      { kind: 'enemy', enemyId: 'enemy' },
    ]);
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
          inputTargets: [{ kind: 'enemy', enemyId: 'enemy' }],
          triggerTargets: [{ kind: 'operator', operatorId: 'owner' }],
        },
        { kind: 'enemy', enemyId: 'enemy' },
        () => true,
      ),
      context,
    );
    expect(context.targetContext.get('trigger')).toEqual([
      { kind: 'operator', operatorId: 'owner' },
    ]);
    expect(context.targetContext.get('smart_target')).toEqual([
      { kind: 'enemy', enemyId: 'enemy' },
    ]);
  });

  it.each(['input', 'trigger'] as const)('保留 %s 中的真实干员目标，不强换成敌人', smartTarget => {
    const operator = { kind: 'operator' as const, operatorId: 'owner' };
    const result = prepareComboCast(
      { smartTarget },
      { ...pending(), triggerTargets: [operator] },
      { kind: 'enemy', enemyId: 'enemy' },
      () => true,
    );
    expect(result.smartTarget).toEqual(operator);
    expect(result.trigger).toEqual([operator]);
    expect(result.smartTarget).not.toBe(operator);
  });

  it('不把尚未支持的能力实体候选静默改成敌人', () => {
    expect(() =>
      prepareComboCast(
        { smartTarget: 'input' },
        {
          ...pending(),
          inputTargets: [{ kind: 'abilityEntity', instanceId: 1 }],
        },
        { kind: 'enemy', enemyId: 'enemy' },
        () => true,
      ),
    ).toThrow('abilityEntity target');
  });
});

it.each(['enemy', 'input', 'trigger'] as const)(
  '无候选的 %s 连携使用当前可用目标，不回退已离场主敌人',
  smartTarget => {
    expect(
      prepareComboCast(
        { smartTarget },
        undefined,
        { kind: 'enemy', enemyId: 'enemy:other' },
        () => true,
      ).smartTarget,
    ).toEqual({ kind: 'enemy', enemyId: 'enemy:other' });
    expect(
      prepareComboCast({ smartTarget }, undefined, undefined, () => true).smartTarget,
    ).toBeUndefined();
  },
);

it('智能目标跳过离场者，但保留完整触发目标组与空组语义', () => {
  const targets = [
    { kind: 'enemy' as const, enemyId: 'enemy' },
    { kind: 'enemy' as const, enemyId: 'enemy:second' },
  ];
  const preparation = prepareComboCast(
    { smartTarget: 'input' },
    { ...pending(), inputTargets: targets, triggerTargets: targets },
    undefined,
    target => target.kind === 'enemy' && target.enemyId === 'enemy:second',
  );
  expect(preparation.smartTarget).toEqual(targets[1]);
  const context = { blackboard: new ActionBlackboard(), targetContext: new RuntimeTargetContext() };
  applySkillCastStartPreparation(preparation, context);
  expect(context.targetContext.get('trigger')).toEqual(targets);
  const empty = prepareComboCast(
    { smartTarget: 'input' },
    { ...pending(), inputTargets: [], triggerTargets: [] },
    { kind: 'enemy', enemyId: 'enemy' },
    () => true,
  );
  expect(empty.smartTarget).toBeUndefined();
  expect(empty.trigger).toEqual([]);
});
