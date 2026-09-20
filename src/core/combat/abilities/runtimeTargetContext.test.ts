/** 验证目标身份在选择时复制，并随技能状态一起保存、恢复。 */
import { expect, it } from 'vitest';
import { RuntimeTargetContext, setRuntimeTargetGroup } from './runtimeTargetContext';
import { createSkillExecutionState } from '../state/abilityState';
import { StateStepper } from '../runtime/stateStepper';

it('修改输入目标对象不会改写已选择的身份', () => {
  const context = new RuntimeTargetContext();
  const target = { kind: 'abilityEntity' as const, instanceId: 1 };
  const targets = [target];
  context.set('selected', targets);
  target.instanceId = 2;
  targets.length = 0;
  expect(context.get('selected')).toEqual([{ kind: 'abilityEntity', instanceId: 1 }]);
});

it('技能状态恢复后，目标组可以独立替换而不污染另一个分支', () => {
  const state = createSkillExecutionState();
  const context = new RuntimeTargetContext(state.targetContext);
  context.setSingle('selected', { kind: 'abilityEntity', instanceId: 1 });
  const session = new StateStepper(state, (step, id: number) => {
    setRuntimeTargetGroup(step.state.targetContext, 'selected', [
      { kind: 'abilityEntity', instanceId: id },
    ]);
    return step.state.targetContext.groups.get('selected');
  });
  const saved = session.save();
  expect(session.step(2)).toEqual([{ kind: 'abilityEntity', instanceId: 2 }]);
  session.restore(saved);
  expect(session.read().targetContext.groups.get('selected')).toEqual([
    { kind: 'abilityEntity', instanceId: 1 },
  ]);
  expect(session.step(3)).toEqual([{ kind: 'abilityEntity', instanceId: 3 }]);
  expect(context.get('selected')).toEqual([{ kind: 'abilityEntity', instanceId: 1 }]);
});
