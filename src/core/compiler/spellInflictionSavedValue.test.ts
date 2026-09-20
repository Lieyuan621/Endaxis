import { describe, expect, it, vi } from 'vitest';
import { parseConditionLeafSource } from '../../../tools/game-data-compiler/src/source/condition.ts';
import { parseKnownNativeActionSequenceSource } from '../../../tools/game-data-compiler/src/source/actionLeaf.ts';
import { compileCombatActionSequenceSource } from '../../../tools/game-data-compiler/src/compiler/buffs/buffRuntimeProjection.ts';
import { compileActionSequence } from './compileSkill';
import { validateSkillDefinition } from '../game-data/validateSkillDefinition';
import type { ActionSequenceDefinition } from '../game-data/operatorDefinition';
import { CombatActionSequenceRuntime } from '../combat/actions/combatActionSequenceRuntime';
import { EventContextConditionExecutor } from '../combat/events/eventContextConditionExecutor';
import { ActionBlackboardOperationExecutor } from '../combat/actions/actionBlackboardOperationExecutor';
import { ActionBlackboard } from '../combat/actions/actionBlackboard';
import { ElementalInflictionOperationExecutor } from '../combat/infliction/elementalInflictionOperationExecutor';
import { CombatClock } from '../combat/time/combatClock';
import { scalarFixture } from '../../../tools/game-data-compiler/test/sourceFixtures.ts';

const key = 'EntityBB_consumed_type';
const meta = {
  isEnable: true,
  priorityLevel: 'Default',
  priorityOffset: 0,
  serverActionIndex: 1013,
};
function action(name: string, fields: Record<string, unknown> = {}) {
  return { $type: `Beyond.Gameplay.Core.${name}+Data, Gameplay.Beyond`, ...meta, ...fields };
}
const check = (mask: unknown = 15, savedKey = key) =>
  action('Conditions.CheckSpellInflictionType', { mask, savedKey });
const guard = () =>
  action('CompareFloat', {
    serverActionIndex: 1012,
    compare: 'LT',
    valueA: scalarFixture(0, 'EntityBB_wisd_greater_will'),
    valueB: scalarFixture(1),
  });
function compile(actions: unknown[]) {
  return compileCombatActionSequenceSource(
    parseKnownNativeActionSequenceSource(
      {
        onlyExecuteWhenSourceIsMainChar: false,
        onlyExecuteWhenSourceIsGuard: false,
        actionData: actions,
      },
      'character.combo.condition',
      {},
    ),
    {
      actionOwnerTarget: 'caster',
      actionSourceTarget: 'caster',
      actionTargetTarget: 'eventTarget',
    },
  );
}
function runtime(
  actions: unknown[],
  entity: ActionBlackboard,
  direct = new ActionBlackboard({}, entity),
) {
  const projected = compile(actions);
  // 正式定义边界先校验实际子集；公共源 IR 还可表达未进入 Next 的其他动作参数。
  expect(
    validateSkillDefinition({
      key: 'test',
      timelineBlockFrames: 1,
      scheduledSequences: [{ startFrame: 0, sequence: projected }],
    }),
  ).toEqual([]);
  const resolved = compileActionSequence(projected as ActionSequenceDefinition, 1);
  const operations = new ActionBlackboardOperationExecutor(
    new EventContextConditionExecutor({
      execute: () => {
        throw new Error('unexpected operation');
      },
      evaluate: () => {
        throw new Error('unexpected condition');
      },
    }),
  );
  return {
    projected,
    direct,
    run(element: 'heat' | 'electric' | 'cryo' | 'nature') {
      return new CombatActionSequenceRuntime(operations, {
        blackboard: direct,
        event: {
          event: 'beforeTakeInfliction' as const,
          payload: {
            skillId: 'skill',
            isExtra: false,
            sourceId: 'ally',
            targetId: 'enemy',
            element,
          },
        },
      })
        .createSequence(resolved)
        .executeInstant({});
    },
  };
}

describe('原生元素条件从公共编译到运行写回', () => {
  it('嵌套 OR/AND 尾条件保留写入与短路，不执行未选中的分支', () => {
    const group = (actionData: unknown[]) => ({
      actionData,
      onlyExecuteWhenSourceIsMainChar: false,
      onlyExecuteWhenSourceIsGuard: false,
    });
    const any = action('OrConditionAction', {
      conditionList: [group([guard(), check()]), group([check(15, 'other')])],
    });
    const entity = new ActionBlackboard({ [key]: 0, EntityBB_wisd_greater_will: 0 });
    const direct = new ActionBlackboard({ other: 8 }, entity);
    const r = runtime([any], entity, direct);
    expect(r.run('nature')).toBe(true);
    expect(entity.getNumber(key)).toBe(3);
    expect(direct.getNumber('other')).toBe(8);
    entity.assignDynamic('EntityBB_wisd_greater_will', 1);
    expect(r.run('electric')).toBe(true);
    expect(entity.getNumber(key)).toBe(3);
    expect(direct.getNumber('other')).toBe(1);
  });

  it.each(['', 1, null])('正式条件拒绝无效输出键 %j', outputKey => {
    const issues = validateSkillDefinition({
      key: 'test',
      timelineBlockFrames: 1,
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [
              {
                kind: 'conditional',
                parameters: {
                  condition: {
                    kind: 'eventInflictionElementIn',
                    elements: ['nature'],
                    outputKey,
                  },
                },
                whenTrue: { steps: [] },
              },
            ],
          },
        },
      ],
    });
    expect(issues).toContainEqual(
      expect.objectContaining({ path: expect.stringContaining('.outputKey') }),
    );
  });

  it('真实附着动作发布 beforeTake 时写入，早于读取/修改目标附着而非事后语义事件', () => {
    const entity = new ActionBlackboard({ [key]: 0, EntityBB_wisd_greater_will: 0 });
    const condition = runtime([guard(), check()], entity);
    const phases: string[] = [];
    const infliction = new ElementalInflictionOperationExecutor({
      sourceOperatorId: 'ally',
      targetId: 'enemy',
      skillId: 'ally-skill',
      clock: new CombatClock(),
      receipt: { record: () => {} },
      getExistingAttachment: () => {
        expect(entity.getNumber(key)).toBe(3);
        phases.push('read');
        return null;
      },
      applyOperation: () => {
        expect(entity.getNumber(key)).toBe(3);
        phases.push('apply');
      },
      emitSourceEvent: event => {
        phases.push(event);
      },
      emitTargetEvent: (event, payload) => {
        phases.push(event);
        if (event === 'beforeTakeInfliction') {
          expect(condition.run(payload.element)).toBe(true);
          phases.push('write');
        }
      },
      delegate: { execute: () => false, evaluate: () => false },
    });
    expect(
      infliction.execute({
        kind: 'applyElementalInfliction',
        parameters: { element: 'nature', isExtra: false },
      }),
    ).toBe(true);
    expect(phases.slice(0, 5)).toEqual([
      'beforeOutputInfliction',
      'beforeTakeInfliction',
      'write',
      'read',
      'apply',
    ]);
    expect(phases).toContain('afterOutputInfliction');
    expect(phases).toContain('afterTakeInfliction');
    expect(phases.indexOf('afterOutputInfliction')).toBeLessThan(
      phases.indexOf('afterTakeInfliction'),
    );
    // 本测试显式选中并调用条件，不冒充自动注册、冷却门禁及 Pending 链已接通。
  });

  it.each(['wrong', null])('命中时拒绝非数值声明 %j，不覆盖', value => {
    const entity = new ActionBlackboard({ [key]: value });
    expect(() => runtime([check()], entity).run('nature')).toThrow('is missing');
    expect(entity.snapshot()[key]).toBe(value);
  });

  it('缺失元素或其他事件不写黑板', () => {
    const executor = new EventContextConditionExecutor({
      execute: () => false,
      evaluate: () => false,
    });
    const blackboard = new ActionBlackboard();
    const condition = {
      kind: 'eventInflictionElementIn',
      elements: ['nature'],
      outputKey: key,
    } as const;
    expect(
      executor.evaluate(condition, {
        blackboard,
        event: {
          event: 'beforeTakeSpellInfliction',
          payload: { sourceId: 'ally', targetId: 'enemy' },
        },
      }),
    ).toBe(false);
    expect(
      executor.evaluate(condition, {
        blackboard,
        event: {
          event: 'weaknessSet',
          payload: { sourceId: 'ally' },
        },
      }),
    ).toBe(false);
    expect(blackboard.snapshot()).toEqual({});
  });

  it('局部短键只写 direct；成功写入才刷新依赖黑板的属性', () => {
    const entity = new ActionBlackboard({ saved: 8 });
    const blackboard = new ActionBlackboard({ saved: 0 }, entity);
    const refresh = vi.fn();
    const executor = new EventContextConditionExecutor({
      execute: () => false,
      evaluate: () => false,
    });
    const condition = {
      kind: 'eventInflictionElementIn',
      elements: ['nature'],
      outputKey: 'saved',
    } as const;
    const context = {
      blackboard,
      refreshCurrentBuffAttributeModifiers: refresh,
      event: {
        event: 'beforeTakeInfliction',
        payload: {
          skillId: 'skill',
          isExtra: false,
          sourceId: 'ally',
          targetId: 'enemy',
          element: 'nature',
        },
      },
    } as const;
    executor.evaluate(condition, context);
    executor.evaluate(condition, context);
    expect(blackboard.getNumber('saved')).toBe(3);
    expect(entity.getNumber('saved')).toBe(8);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it.each([
    [15, ['heat', 'electric', 'cryo', 'nature']],
    ['All', ['heat', 'electric', 'cryo', 'nature']],
    ['Fire, Cryst', ['heat', 'cryo']],
    ['3', ['heat', 'electric']],
    [0, []],
    ['0', []],
  ] as const)('接受同版本位集 %j', (mask, elements) => {
    expect(parseConditionLeafSource(check(mask), 'source', {})).toMatchObject({
      kind: 'inflictionType',
      elements,
      savedKey: key,
    });
  });
  it.each([16, -1, 1.5, true, null, '', 'Fire,', 'Unknown', 'Physical'])(
    '拒绝非法 mask %j',
    mask => {
      expect(() => parseConditionLeafSource(check(mask), 'source', {})).toThrow('source.mask');
    },
  );

  it.each([
    ['heat', 0],
    ['electric', 1],
    ['cryo', 2],
    ['nature', 3],
  ] as const)('真实第五条守卫/写入切片在 %s 上保留尾条件，写入原生值 %i', (element, expected) => {
    // 诀 raw 33934515...58dca0bc：第五条的 CompareFloat -> CheckSpellInflictionType。
    const entity = new ActionBlackboard({ [key]: 8, EntityBB_wisd_greater_will: 0 });
    const r = runtime([guard(), check()], entity);
    expect(r.projected.steps).toHaveLength(1);
    expect(r.run(element)).toBe(true);
    expect(entity.getNumber(key)).toBe(expected);
    expect(r.direct.snapshot()).toEqual({});
    expect(
      validateSkillDefinition({
        key: 'test',
        timelineBlockFrames: 1,
        scheduledSequences: [{ startFrame: 0, sequence: r.projected }],
      }),
    ).toEqual([]);
  });

  it('守卫失败和 mask 不命中均不读取缺失键；命中时严格失败且不补零', () => {
    const entity = new ActionBlackboard({ EntityBB_wisd_greater_will: 1 });
    const r = runtime([guard(), check()], entity);
    expect(r.run('nature')).toBe(false);
    expect(entity.getNumber(key)).toBeUndefined();
    entity.assignDynamic('EntityBB_wisd_greater_will', 0);
    expect(() => r.run('nature')).toThrow(`action blackboard value '${key}' is missing`);
    expect(runtime([check(0)], entity).run('nature')).toBe(false);
    expect(runtime([check(1)], entity).run('nature')).toBe(false);
  });

  it('NotNext 只反转结果而不阻止已发生的 savedKey 写入', () => {
    const entity = new ActionBlackboard({ [key]: 0 });
    const r = runtime([action('NotNextCheckAction'), check()], entity);
    expect(r.run('nature')).toBe(false);
    expect(entity.getNumber(key)).toBe(3);
  });

  it('连续事件重算，条件 direct 与实体板隔离，普通技能 direct 恢复不清实体值', () => {
    const entity = new ActionBlackboard({ [key]: 0 });
    const direct = new ActionBlackboard({ consumed_type: 9 }, entity);
    const r = runtime([check()], entity, direct);
    r.run('nature');
    r.run('electric');
    expect(entity.getNumber(key)).toBe(1);
    expect(direct.getNumber('consumed_type')).toBe(9);
    const skill = new ActionBlackboard({ consumed_type: 5 }, entity);
    skill.restore({ consumed_type: 5 });
    expect(skill.getNumber(key)).toBe(1);
  });

  it('先读 direct 遮蔽值；float32 epsilon 相等时不写实体', () => {
    const entity = new ActionBlackboard({ [key]: 8 });
    const direct = new ActionBlackboard({ [key]: 3 + 0.000001 }, entity);
    const assign = vi.spyOn(direct, 'assignDynamicUnconditionally');
    expect(runtime([check()], entity, direct).run('nature')).toBe(true);
    expect(assign).not.toHaveBeenCalled();
    expect(entity.getNumber(key)).toBe(8);
    direct.assign({ [key]: 1 });
    runtime([check()], entity, direct).run('nature');
    expect(entity.getNumber(key)).toBe(3);
    expect(direct.getNumber(key)).toBe(1);
  });

  it('direct 与事件不同但 entity 已等于事件时，不能二次比较 entity 而吞掉原生赋值', () => {
    const entity = new ActionBlackboard({ [key]: 3 });
    const direct = new ActionBlackboard({ [key]: 1 }, entity);
    const assign = vi.spyOn(direct, 'assignDynamicUnconditionally');
    expect(runtime([check()], entity, direct).run('nature')).toBe(true);
    expect(assign).toHaveBeenCalledExactlyOnceWith(key, 3);
    expect(entity.getNumber(key)).toBe(3);
    expect(direct.getNumber(key)).toBe(1);
  });

  it('纯尾条件仍可省略，但写入空串已规范为纯条件；空 mask 的正式定义合法', () => {
    expect(compile([check(15, '')]).steps).toEqual([]);
    const projected = compile([check(0)]);
    expect(projected.steps).toHaveLength(1);
    expect(
      validateSkillDefinition({
        key: 'test',
        timelineBlockFrames: 1,
        scheduledSequences: [{ startFrame: 0, sequence: projected }],
      }),
    ).toEqual([]);
  });
});
