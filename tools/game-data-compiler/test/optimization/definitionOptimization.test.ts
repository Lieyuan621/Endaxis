import { describe, expect, it } from 'vitest';
import type {
  ActionSequenceDefinition,
  CombatStepDefinition,
} from '../../../../packages/game-data-contract/src/actions.ts';
import type { CombatCondition } from '../../../../packages/game-data-contract/src/conditions.ts';
import {
  optimizeActionSequenceDefinition,
  simplifyDefinitionCondition,
} from '../../src/compiler/optimization/definitionOptimization.ts';
import {
  analyzeConditionUsage,
  analyzeSequenceUsage,
} from '../../src/compiler/optimization/definitionUsageAnalysis.ts';
import { compileActionSequence } from '../../../../src/core/compiler/compileSkill.ts';
import { CombatActionSequenceRuntime } from '../../../../src/core/combat/actions/combatActionSequenceRuntime.ts';
import { ActionBlackboard } from '../../../../src/core/combat/actions/actionBlackboard.ts';
import { ActionBlackboardOperationExecutor } from '../../../../src/core/combat/actions/actionBlackboardOperationExecutor.ts';

const literal = (value: number) => ({ kind: 'constant' as const, value });
const constant = (value: boolean): CombatCondition => ({ kind: 'constant', value });
const sequence = (...steps: CombatStepDefinition[]): ActionSequenceDefinition => ({ steps });
const assign = (key: string, value: number): CombatStepDefinition => ({
  kind: 'modifyActionValue',
  parameters: { key, operation: 'assign', value: literal(value) },
});
const guard = (
  condition: CombatCondition,
  ...steps: CombatStepDefinition[]
): CombatStepDefinition => ({
  kind: 'conditional',
  parameters: { condition },
  whenTrue: sequence(...steps),
});

function optimize(input: ActionSequenceDefinition) {
  return optimizeActionSequenceDefinition(input, { mode: 'apply', definitionId: 'fixture' });
}

/** 使用正式等级编译和序列执行器，检查重入、重复执行、重置、结束和黑板最终值。 */
function execute(input: ActionSequenceDefinition, initial: Record<string, number> = {}) {
  const blackboard = new ActionBlackboard(initial);
  const log: string[] = [];
  let sampled = 0;
  const executor = new ActionBlackboardOperationExecutor(
    {
      execute: step => {
        log.push(step.kind);
        return true;
      },
      evaluate: condition => {
        log.push(condition.kind);
        return false;
      },
    },
    {
      nextProbabilitySample: () => {
        sampled++;
        return 0.1;
      },
    },
  );
  const runtime = new CombatActionSequenceRuntime(executor, { blackboard });
  const program = runtime.createSequence(compileActionSequence(input, 1));
  program.reset({});
  const first = program.tryExecute({});
  program.tick(0, {});
  const repeated = program.tryExecute({});
  program.end({});
  program.reset({});
  const reset = program.tryExecute({});
  program.end({});
  return { first, repeated, reset, values: blackboard.snapshot(), log, sampled };
}

describe('定义优化的分支与执行语义', () => {
  it('报告模式保持原对象，关闭模式不报告改动，应用保留步骤 key 且不修改输入', () => {
    const damage: CombatStepDefinition = {
      key: 'original/steps/1',
      kind: 'dealDamage',
      parameters: { damageType: 'physical', attackScale: 0, tags: [] },
    };
    const input = sequence(
      guard(
        { kind: 'actionValueCompare', left: literal(1), operator: 'equal', right: literal(1) },
        damage,
      ),
    );
    const before = structuredClone(input);
    const report = optimizeActionSequenceDefinition(input, {
      mode: 'report',
      definitionId: 'fixture',
    });
    expect(report.sequence).toBe(input);
    expect(report.report.before.steps).toBe(2);
    expect(report.report.after.steps).toBe(1);
    const applied = optimize(input);
    expect(applied.sequence.steps).toEqual([damage]);
    expect(applied.sequence.steps[0]).toBe(damage);
    expect(input).toEqual(before);
    expect(optimize(applied.sequence).report.changes).toEqual([]);
    expect(
      optimizeActionSequenceDefinition(input, { mode: 'off', definitionId: 'fixture' }).report
        .changes,
    ).toEqual([]);
  });

  it.each(['less', 'lessOrEqual', 'greater', 'greaterOrEqual', 'equal', 'notEqual'] as const)(
    '字面量 %s 使用运行时容差，保留真假和重复执行结果',
    operator => {
      for (const right of [1, 1 + 0.000001, 1 + 0.00002, -1]) {
        const input = sequence(
          guard(
            { kind: 'actionValueCompare', left: literal(1), operator, right: literal(right) },
            assign('result', 3),
          ),
        );
        expect(execute(optimize(input).sequence)).toEqual(execute(input));
      }
    },
  );

  it('短路之前的随机抽样保留，之后的缺键读取不执行', () => {
    const input = sequence(
      guard(
        {
          kind: 'all',
          conditions: [
            { kind: 'probability', probability: literal(1) },
            constant(false),
            {
              kind: 'actionValueCompare',
              left: { kind: 'blackboard', key: 'missing' },
              operator: 'equal',
              right: literal(0),
            },
          ],
        },
        assign('never', 1),
      ),
    );
    expect(execute(optimize(input).sequence)).toEqual(execute(input));
    expect(execute(input).sampled).toBe(2);
    const condition = simplifyDefinitionCondition(
      (input.steps[0] as Extract<CombatStepDefinition, { kind: 'conditional' }>).parameters
        .condition,
    );
    expect(condition).toEqual({
      kind: 'all',
      conditions: [{ kind: 'probability', probability: literal(1) }, constant(false)],
    });
  });

  it('any 和 not 简化时不丢弃停止值前的带写入条件', () => {
    const condition: CombatCondition = {
      kind: 'any',
      conditions: [
        constant(false),
        { kind: 'eventOverheal', realHealKey: 'heal' },
        { kind: 'not', condition: constant(false) },
        { kind: 'probability', probability: literal(1) },
      ],
    };
    expect(simplifyDefinitionCondition(condition)).toEqual({
      kind: 'any',
      conditions: [{ kind: 'eventOverheal', realHealKey: 'heal' }, constant(true)],
    });
    expect(analyzeConditionUsage(simplifyDefinitionCondition(condition)).writes).toEqual(
      new Set(['heal']),
    );
  });

  it('可能报缺键错误的比较不会因后面恒假而消失', () => {
    const input = sequence(
      guard({
        kind: 'all',
        conditions: [
          {
            kind: 'actionValueCompare',
            left: { kind: 'blackboard', key: 'missing' },
            operator: 'equal',
            right: literal(0),
          },
          constant(false),
        ],
      }),
    );
    expect(() => execute(input)).toThrow("'missing' is missing");
    expect(() => execute(optimize(input).sequence)).toThrow("'missing' is missing");
  });

  it('保留空恒真守卫的已执行状态，不能改为空序列', () => {
    const input = sequence(guard(constant(true)));
    const result = optimize(input);
    expect(result.report.retained[0]?.reason).toBe('sequence-lifetime');
    expect(execute(result.sequence)).toEqual(execute(input));
    expect(execute(result.sequence).repeated).toBe(false);
  });

  it('alwaysNext 仍吞掉内部停止结果，空 else 不变成顺序守卫', () => {
    const input = sequence(
      {
        kind: 'conditional',
        parameters: { condition: constant(true), alwaysNext: true },
        whenTrue: sequence(guard(constant(false), assign('never', 1))),
        whenFalse: sequence(assign('unused', 1)),
      },
      assign('after', 2),
    );
    const result = optimize(input);
    expect(result.sequence.steps[0]).toMatchObject({
      kind: 'conditional',
      whenFalse: { steps: [] },
    });
    expect(execute(result.sequence)).toEqual(execute(input));
    expect(execute(result.sequence).values).toEqual({ after: 2 });
  });

  it('未执行分支的伤害准备和具名步骤保留', () => {
    for (const step of [
      { key: 'linked-step', ...assign('value', 3) },
      {
        kind: 'dealDamage' as const,
        parameters: {
          damageType: 'physical' as const,
          attackScale: { kind: 'blackboard' as const, key: 'snapshot' },
          takeAttackSnapshot: true,
          tags: [],
        },
      },
    ]) {
      const input = sequence(guard(constant(false), step));
      const result = optimize(input);
      expect(result.sequence).toBe(input);
      expect(result.report.retained[0]?.reason).toBe('preparation-or-identity');
    }
  });

  it('switch 保留顺序、重复标签和空匹配项，不用后面的非空项替代', () => {
    const input = sequence(
      {
        kind: 'switch',
        parameters: { choice: literal(1), alwaysNext: false },
        options: [
          { value: literal(1), sequence: sequence() },
          { value: literal(1), sequence: sequence(guard(constant(true), assign('wrong', 1))) },
        ],
      },
      assign('after', 2),
    );
    expect(execute(optimize(input).sequence)).toEqual(execute(input));
    expect(execute(input).values).toEqual({ after: 2 });
  });

  it('黑板 epsilon 写入不是无条件覆盖，当前不删除这两次赋值', () => {
    const input = sequence(assign('value', 2), assign('value', 3));
    expect(optimize(input).sequence).toBe(input);
    expect(execute(input, { value: 3.000001 }).values.value).toBe(3);
    expect(execute(sequence(assign('value', 3)), { value: 3.000001 }).values.value).toBe(3.000001);
    expect(analyzeSequenceUsage(input).reads).toEqual(new Set(['value']));
  });

  it('子作用域保守汇总键用途，整板逃逸仍阻止判定无人读取', () => {
    const input = sequence({
      kind: 'withActionBlackboardScope',
      parameters: {
        scopeKey: 'local',
        initialValues: {},
        inheritParent: true,
      },
      body: sequence(assign('child', 1)),
    });
    const usage = analyzeSequenceUsage(input);
    expect(usage.unknownAccess).toBe(false);
    expect(usage.reads).toEqual(new Set(['child']));
    expect(usage.writes).toEqual(new Set(['child']));
    expect(
      analyzeSequenceUsage(
        sequence({
          kind: 'spawnAbilityEntity',
          parameters: {
            abilityEntityId: 'fixture',
            dieWhenSourceDies: true,
            inheritActionBlackboard: true,
          },
        }),
      ).unknownAccess,
    ).toBe(true);
  });
});
