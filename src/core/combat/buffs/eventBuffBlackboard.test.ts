import { expect, it } from 'vitest';
import { AbilityEventDispatcher } from '../events/abilityEventDispatcher';
import type { AbilityEventPayloadMap } from '../events/combatAbilityEvent';
import { createEventBuff } from '../events/buffEventTestFixture';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { BuffOperationExecutor } from './buffOperationExecutor';
import { withAbilityEventResponseContext } from '../events/abilityEventResponseContext';
import type { CombatOperationContext } from '../skills/skillRuntime';

it('事件目标和 Buff 存在，也不能代替缺失的动作输入目标', () => {
  const blackboard = new ActionBlackboard({ result: 9 });
  const buff = createEventBuff({ count: 3 });
  const executor = new BuffOperationExecutor({
    sourceId: 'owner',
    resolveTarget: () => {
      throw new Error('must not query another Buff');
    },
    delegate: { execute: () => false, evaluate: () => false },
  });
  const succeeded = executor.execute(
    {
      kind: 'readEventBuffBlackboard',
      parameters: {
        desiredKey: 'count',
        outputKey: 'result',
      },
    },
    {
      blackboard,
      event: {
        event: 'buffConsumed',
        payload: {
          buff,
          sourceId: 'owner',
          targetId: 'enemy',
          buffId: 'buff:test',
          buffTags: [],
          layers: 1,
        },
      },
    },
  );
  expect(succeeded).toBe(false);
  expect(blackboard.getNumber('result')).toBe(9);
});

it.each([
  undefined,
  {
    event: 'customAbilityEvent' as const,
    payload: { sourceId: 'owner', targetId: 'enemy', eventName: 'test', eventParam: 0 },
  },
])('无事件 Buff 时返回失败，不从监听者或历史快照补值：%j', event => {
  const blackboard = new ActionBlackboard({ result: 9 });
  const executor = new BuffOperationExecutor({
    sourceId: 'owner',
    resolveTarget: () => {
      throw new Error('must not query');
    },
    delegate: { execute: () => false, evaluate: () => false },
  });
  expect(
    executor.execute(
      {
        kind: 'readEventBuffBlackboard',
        parameters: {
          desiredKey: 'count',
          outputKey: 'result',
        },
      },
      { blackboard, event, actionInputTarget: { kind: 'enemy' } },
    ),
  ).toBe(false);
  expect(blackboard.getNumber('result')).toBe(9);
});

it.each(['finishedBuff', 'buffEndsEarly', 'buffConsumed', 'buffAbsorbed'] as const)(
  '%s 读取同一已结束实例的实时黑板，保留发布时快照',
  event => {
    const buff = createEventBuff({ count: 3 });
    buff.finish('other');
    const snapshot = Object.freeze(buff.blackboard.snapshot());
    const payload = {
      buff,
      sourceId: 'owner',
      targetId: 'enemy',
      buffId: 'buff:test',
      buffTags: [],
      reason: 'early' as const,
      layers: 1,
      blackboardValues: snapshot,
    };
    const dispatcher = new AbilityEventDispatcher<typeof event, AbilityEventPayloadMap>();
    const output = new ActionBlackboard({ result: 0 });
    const context: CombatOperationContext = { blackboard: output };
    const executor = new BuffOperationExecutor({
      sourceId: 'listener',
      resolveTarget: () => {
        throw new Error('must not query another Buff');
      },
      delegate: { execute: () => false, evaluate: () => false },
    });
    dispatcher.registerAction(event, 10, published => {
      expect(published.payload.buff).toBe(buff);
      published.payload.buff.blackboard.assignDynamic('count', 7);
    });
    dispatcher.registerAction(event, 0, published => {
      withAbilityEventResponseContext(
        context,
        published,
        { inputTarget: { kind: 'enemy' }, triggerTarget: null },
        () => {
          executor.execute(
            {
              kind: 'readEventBuffBlackboard',
              parameters: {
                desiredKey: 'count',
                outputKey: 'result',
              },
            },
            context,
          );
        },
      );
    });
    dispatcher.dispatch({ event, payload }, []);
    expect(output.getNumber('result')).toBe(7);
    expect(snapshot.count).toBe(3);
    expect(buff.isFinished).toBe(true);
    expect(context.event).toBeUndefined();
  },
);
