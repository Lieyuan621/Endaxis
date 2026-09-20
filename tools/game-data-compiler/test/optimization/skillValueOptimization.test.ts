/** 验证黑板裁剪的真实读取、缺键错误、跨入口保留和序列生命周期。 */
import { describe, expect, it } from 'vitest';
import type {
  ActionSequenceDefinition,
  CombatStepDefinition,
  CombatStepForKind,
} from '../../../../packages/game-data-contract/src/actions.ts';
import type { SkillDefinition } from '../../../../packages/game-data-contract/src/skills.ts';
import { pruneUnusedSkillValues } from '../../src/compiler/optimization/skillValueOptimization.ts';
import { compileActionSequence } from '../../../../src/core/compiler/compileSkill.ts';
import { CombatActionSequenceRuntime } from '../../../../src/core/combat/actions/combatActionSequenceRuntime.ts';
import {
  ActionBlackboard,
  resolveActionValueOperand,
} from '../../../../src/core/combat/actions/actionBlackboard.ts';
import { ActionBlackboardOperationExecutor } from '../../../../src/core/combat/actions/actionBlackboardOperationExecutor.ts';

const sequence = (...steps: CombatStepDefinition[]): ActionSequenceDefinition => ({ steps });
const literal = (value: number) => ({ kind: 'constant' as const, value });
const board = (key: string) => ({ kind: 'blackboard' as const, key });
const assign = (key: string, value: number): CombatStepDefinition => ({
  kind: 'modifyActionValue',
  parameters: { key, operation: 'assign', value: literal(value) },
});
const spend = (key: string): CombatStepDefinition => ({
  kind: 'changeResourceByActionValue',
  parameters: { resource: 'sp', recipient: 'team', amount: board(key) },
});
const scope = (
  parameters: CombatStepForKind<'withActionBlackboardScope'>['parameters'],
  ...steps: CombatStepDefinition[]
): CombatStepDefinition => ({
  kind: 'withActionBlackboardScope',
  parameters,
  body: sequence(...steps),
});
const signal: CombatStepDefinition = {
  kind: 'triggerCustomAbilityEvent',
  parameters: {
    eventName: 'fixture',
    eventParam: 0,
    target: 'caster',
  },
};
function skill(
  program: ActionSequenceDefinition,
  blackboard: SkillDefinition['blackboard'] = {},
): SkillDefinition {
  return {
    key: 'skill',
    timelineBlockFrames: 30,
    blackboard,
    scheduledSequences: [{ startFrame: 0, sequence: program }],
  };
}

/** 用同一正式序列运行时执行全部入口，让 scopeKey 复用和父/实体板查找按实际规则发生。 */
function executeSkillPrograms(input: SkillDefinition): readonly number[] {
  const blackboard = new ActionBlackboard(
    Object.fromEntries(
      Object.entries(input.blackboard ?? {}).map(([key, value]) => [
        key,
        typeof value === 'number' ? value : value[0]!,
      ]),
    ),
    new ActionBlackboard(),
  );
  const observed: number[] = [];
  const operations = new ActionBlackboardOperationExecutor({
    execute(step, context) {
      if (step.kind === 'changeResourceByActionValue') {
        observed.push(resolveActionValueOperand(step.parameters.amount, context!.blackboard));
      }
      return true;
    },
    evaluate: () => true,
  });
  const runtime = new CombatActionSequenceRuntime(operations, { blackboard });
  for (const entry of input.scheduledSequences) {
    const program = runtime.createSequence(compileActionSequence(entry.sequence, 1));
    program.reset({});
    program.executeInstant({});
  }
  return observed;
}

describe('技能黑板和算术写入裁剪', () => {
  it('删除不影响行为的写入与初值，保留事件且不改变输入', () => {
    const input = skill(sequence(assign('unused', 3), signal), { unused: [1, 2], neverRead: 8 });
    const before = structuredClone(input);
    const result = pruneUnusedSkillValues(input);
    expect(result.skill.blackboard).toEqual({});
    expect(result.skill.scheduledSequences[0]?.sequence.steps).toEqual([signal]);
    expect(result.report.removedWrites).toEqual([
      { path: 'scheduledSequences[0].sequence.steps[0]', key: 'unused' },
    ]);
    expect(result.report.removedInitialKeys).toEqual(['unused', 'neverRead']);
    expect(input).toEqual(before);
    expect(pruneUnusedSkillValues(result.skill).skill).toBe(result.skill);
  });

  it('沿有用结果反查完整计算链，并保留各等级的初值', () => {
    const input = skill(
      sequence(
        assign('first', 3),
        {
          kind: 'calculateActionValue',
          parameters: {
            key: 'second',
            operation: 'multiply',
            left: board('first'),
            right: board('scale'),
          },
        },
        {
          kind: 'changeResourceByActionValue',
          parameters: { resource: 'sp', recipient: 'team', amount: board('second') },
        },
      ),
      { first: 1, second: 2, scale: [1, 2, 3], unused: 5 },
    );
    const result = pruneUnusedSkillValues(input);
    expect(result.report.removedWrites).toEqual([]);
    expect(result.skill.blackboard).toEqual({ first: 1, second: 2, scale: [1, 2, 3] });
  });

  it('无人使用的计算链一起删除，不因目的键 epsilon 自读取把整条链留住', () => {
    const input = skill(
      sequence(
        assign('first', 3),
        {
          kind: 'calculateActionValue',
          parameters: {
            key: 'second',
            operation: 'multiply',
            left: board('first'),
            right: literal(2),
          },
        },
        signal,
      ),
      { first: 1, second: 2 },
    );
    const result = pruneUnusedSkillValues(input);
    expect(result.report.removedWrites).toHaveLength(2);
    expect(result.skill.blackboard).toEqual({});
  });

  it('未初始化的严格读取仍保留，不能把原来的缺键错误裁掉', () => {
    const input = skill(
      sequence(
        {
          kind: 'calculateActionValue',
          parameters: {
            key: 'unused',
            operation: 'add',
            left: board('missing'),
            right: literal(1),
          },
        },
        signal,
      ),
    );
    expect(pruneUnusedSkillValues(input).skill).toBe(input);
  });

  it('后续时间线和已安装事件监听都使值保持有效', () => {
    const input = skill(sequence(assign('later', 3), assign('eventValue', 4), signal), {
      later: 0,
      eventValue: 0,
    });
    input.scheduledSequences = [
      ...input.scheduledSequences,
      {
        startFrame: 10,
        sequence: sequence({
          kind: 'changeResourceByActionValue',
          parameters: { resource: 'sp', recipient: 'team', amount: board('later') },
        }),
      },
      {
        startFrame: 0,
        sequence: sequence({
          kind: 'listenForCombatEvents',
          parameters: {
            responses: [
              {
                key: 'listener',
                event: { kind: 'skillHit', skillGroupKey: 'battleSkill', scope: 'operator' },
                sequence: sequence({
                  kind: 'changeResourceByActionValue',
                  parameters: { resource: 'sp', recipient: 'team', amount: board('eventValue') },
                }),
              },
            ],
          },
        }),
      },
    ];
    expect(pruneUnusedSkillValues(input).skill).toBe(input);
  });

  it('实体板、养成补丁、带引用身份的写入都保留', () => {
    const input = skill(
      sequence(
        assign('EntityBB_shared', 1),
        assign('patched', 2),
        { ...assign('named', 3), key: 'saved-reference' },
        signal,
      ),
      { EntityBB_shared: 0, patched: 0, named: 0 },
    );
    expect(pruneUnusedSkillValues(input, new Set(['patched'])).skill).toBe(input);
  });

  it('序列不能删空，恢复保留动作时也恢复其输入初值', () => {
    const input = skill(
      sequence({
        kind: 'calculateActionValue',
        parameters: {
          key: 'unused',
          operation: 'add',
          left: board('input'),
          right: literal(1),
        },
      }),
      { input: 1, unused: 0, unrelated: 5 },
    );
    const result = pruneUnusedSkillValues(input);
    expect(result.report.retainedLifetimePaths).toHaveLength(1);
    expect(result.skill.scheduledSequences).toEqual(input.scheduledSequences);
    expect(result.skill.blackboard).toEqual({ input: 1, unused: 0 });
  });

  it('父快照覆盖子初值，保留子程序读写涉及的父键，但不裁剪子写入', () => {
    const child = scope(
      { scopeKey: 'child', initialValues: { inherited: 1, localUnused: 0 }, inheritParent: true },
      assign('localUnused', 7),
      spend('inherited'),
    );
    const input = skill(sequence(assign('unused', 3), child), { inherited: 9, unused: 2 });
    const result = pruneUnusedSkillValues(input);
    expect(result.report.retainedReason).toBeUndefined();
    expect(result.report.removedInitialKeys).toEqual(['unused']);
    expect(result.report.removedWrites.map(item => item.key)).toEqual(['unused']);
    expect(result.skill.scheduledSequences[0]?.sequence.steps).toEqual([child]);
    expect(result.skill.scheduledSequences[0]?.sequence.steps[0]).toBe(child);
    expect(executeSkillPrograms(input)).toEqual([9]);
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
  });

  it('同 scopeKey 的后续入口沿用首次创建的父快照，不能按后续 inheritParent=false 删值', () => {
    const input = skill(
      sequence(scope({ scopeKey: 'shared', initialValues: {}, inheritParent: true }, signal)),
      { inherited: 9, unused: 2 },
    );
    input.scheduledSequences = [
      ...input.scheduledSequences,
      {
        startFrame: 10,
        sequence: sequence(
          scope(
            { scopeKey: 'shared', initialValues: { inherited: 1 }, inheritParent: false },
            spend('inherited'),
          ),
        ),
      },
    ];
    const result = pruneUnusedSkillValues(input);
    expect(result.skill.blackboard).toEqual({ inherited: 9 });
    expect(executeSkillPrograms(input)).toEqual([9]);
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
  });

  it('shareParentBlackboard 的子写入能被其他入口读取，保留同一父板及近似初值', () => {
    const input = skill(
      sequence(
        scope(
          {
            scopeKey: 'shared',
            initialValues: {},
            inheritParent: true,
            shareParentBlackboard: true,
          },
          assign('value', 3),
        ),
        spend('value'),
      ),
      { value: 3.000001, unused: 9 },
    );
    const result = pruneUnusedSkillValues(input);
    expect(result.skill.blackboard).toEqual({ value: 3.000001 });
    expect(executeSkillPrograms(input)).toEqual([3.000001]);
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
  });

  it('独立子板的 entityAssignments 仍严格读取父板，实体初值被赋值覆盖', () => {
    const input = skill(
      sequence(
        scope(
          {
            scopeKey: 'isolated',
            initialValues: {},
            inheritParent: false,
            entityInitialValues: { assigned: 1 },
            entityAssignments: { assigned: board('source') },
          },
          spend('assigned'),
        ),
      ),
      { source: 6, unused: 9 },
    );
    const result = pruneUnusedSkillValues(input);
    expect(result.skill.blackboard).toEqual({ source: 6 });
    expect(executeSkillPrograms(input)).toEqual([6]);
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
  });

  it('实体整板继承及其外层子作用域继续阻止技能裁剪', () => {
    const escaped: CombatStepDefinition = {
      kind: 'spawnAbilityEntity',
      parameters: {
        abilityEntityId: 'entity',
        dieWhenSourceDies: true,
        inheritActionBlackboard: true,
      },
    };
    for (const step of [
      escaped,
      scope({ scopeKey: 'child', initialValues: {}, inheritParent: true }, escaped),
      scope({ scopeKey: 'isolated', initialValues: {}, inheritParent: false }, escaped),
    ]) {
      const input = skill(sequence(assign('copied', 1), step), { copied: 0, mayBeReadByChild: 5 });
      const result = pruneUnusedSkillValues(input);
      expect(result.skill).toBe(input);
      expect(result.report.retainedReason).toBe('unresolved-blackboard-access');
    }
  });
});
