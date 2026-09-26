import { describe, expect, it } from 'vitest';
import { parseKnownNativeActionSequenceSource } from '../src/source/actionLeaf.ts';
import { compileEventCondition } from '../src/compiler/conditions/combatConditionProjection.ts';
import { withProjectionGraph } from './support/projectionContext.ts';
import { EventContextConditionExecutor } from '../../../src/core/combat/events/eventContextConditionExecutor';
import { ActionBlackboard } from '../../../src/core/combat/actions/actionBlackboard';
import {
  SP_GAIN_KINDS,
  SP_GAIN_SOURCES,
} from '../../../packages/game-data-contract/src/primitives';

function compile(types: string[], methods: string[], checkType = true, checkMethod = true) {
  const sequence = parseKnownNativeActionSequenceSource(
    {
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
      actionData: [
        {
          $type:
            'Beyond.Gameplay.Core.Abilities.Condition.CheckObtainAtbType+Data, Gameplay.Beyond',
          isEnable: true,
          priorityLevel: 'Default',
          priorityOffset: 0,
          serverActionIndex: 0,
          checkObtainType: checkType,
          obtainTypeList: types,
          checkObtainMethod: checkMethod,
          obtainMethodList: methods,
        },
      ],
    },
    'fixture.spFilter',
    {},
  );
  const result = compileEventCondition(
    sequence.actions[0]!,
    withProjectionGraph({
      actionOwnerTarget: 'caster',
      actionSourceTarget: 'caster',
      actionTargetTarget: 'eventTarget',
    }),
    new Map(),
  );
  if (result?.kind !== 'eventSpGainMatch') throw new Error('expected SP condition');
  return result;
}

describe('技力事件公共条件的转换与执行', () => {
  const executor = new EventContextConditionExecutor({
    execute: () => true,
    evaluate: () => false,
  });
  it('完整来源/方式集合沿公共协议进入运行时，而不是只准入 Skill/Gain', () => {
    const all = compile(['Default', 'NormalAttack', 'PowerAttack', 'Skill'], ['Gain', 'Return']);
    expect(all.sources).toEqual(['default', 'normalAttack', 'powerAttack', 'skill']);
    expect(all.gainKinds).toEqual(['gain', 'refund']);
    const selected = compile(['NormalAttack', 'PowerAttack'], ['Return']);
    for (const source of SP_GAIN_SOURCES)
      for (const gainKind of SP_GAIN_KINDS) {
        const context = {
          blackboard: new ActionBlackboard(),
          event: {
            event: 'skillSpGained' as const,
            payload: {
              sourceOperatorId: 'operator',
              source,
              gainKind,
              requestedAmount: 10,
              amount: 0,
            },
          },
        };
        expect(executor.evaluate(all, context)).toBe(true);
        expect(executor.evaluate(selected, context)).toBe(
          (source === 'normalAttack' || source === 'powerAttack') && gainKind === 'refund',
        );
        expect(executor.evaluate(compile([], []), context)).toBe(false);
        expect(executor.evaluate(compile(['unused'], ['unused'], false, false), context)).toBe(
          true,
        );
      }
  });
  it('启用的未知枚举失败，不能被当作默认来源或无筛选', () => {
    expect(() => compile(['Unknown'], ['Gain'])).toThrow('unsupported GainAtbType');
    expect(() => compile(['Skill'], ['Unknown'])).toThrow('unsupported GainAtbMethod');
  });
});
