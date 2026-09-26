/** 验证黑板裁剪的真实读取、缺键错误、跨入口保留和序列生命周期。 */
import { describe, expect, it } from 'vitest';
import type { CombatStepForKind } from '../../../../packages/game-data-contract/src/actions.ts';
import type { SkillDefinition } from '../../../../packages/game-data-contract/src/skills.ts';
import { pruneUnusedGraphSkillValues } from '../../src/compiler/optimization/graphValueOptimization.ts';
import { compileGraphSequence } from '../support/graphSequence.ts';
import { CombatActionSequenceRuntime } from '../../../../src/core/combat/actions/combatActionSequenceRuntime.ts';
import {
  ActionBlackboard,
  resolveActionValueOperand,
} from '../../../../src/core/combat/actions/actionBlackboard.ts';
import { ActionBlackboardOperationExecutor } from '../../../../src/core/combat/actions/actionBlackboardOperationExecutor.ts';
import type {
  ActionGraphNode,
  ActionGraphReference,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph.ts';

const literal = (value: number) => ({ kind: 'constant' as const, value });
const board = (key: string) => ({ kind: 'blackboard' as const, key });
const assign = (key: string, value: number): CombatStepForKind<'modifyActionValue'> => ({
  kind: 'modifyActionValue',
  parameters: { key, operation: 'assign', value: literal(value) },
});
const spend = (key: string): ActionGraphStep => ({
  kind: 'changeResourceByActionValue',
  parameters: { resource: 'sp', recipient: 'team', amount: board(key) },
});
const signal: ActionGraphStep = {
  kind: 'triggerCustomAbilityEvent',
  parameters: {
    eventName: 'fixture',
    eventParam: 0,
    target: 'caster',
  },
};

/** 定义内平铺动作串链；控制动作体先链入同一节点表再引用。 */
function chain(
  nodes: Record<string, ActionGraphNode>,
  prefix: string,
  actions: readonly ActionGraphStep[],
): ActionGraphReference {
  actions.forEach((action, index) => {
    nodes[`${prefix}-${index}`] = {
      action,
      next: index + 1 < actions.length ? `${prefix}-${index + 1}` : null,
    };
  });
  return { $sequence: `${prefix}-0` };
}

function scope(
  nodes: Record<string, ActionGraphNode>,
  prefix: string,
  parameters: CombatStepForKind<'withActionBlackboardScope'>['parameters'],
  ...steps: ActionGraphStep[]
): ActionGraphStep {
  return {
    kind: 'withActionBlackboardScope',
    parameters,
    body: chain(nodes, `${prefix}-body`, steps),
  };
}

function skill(
  build: (nodes: Record<string, ActionGraphNode>) => {
    startFrame: number;
    sequence: ActionGraphReference;
  }[],
  blackboard: SkillDefinition['blackboard'] = {},
): SkillDefinition {
  const nodes: Record<string, ActionGraphNode> = {};
  const scheduledSequences = build(nodes);
  return {
    key: 'skill',
    timelineBlockFrames: 30,
    blackboard,
    scheduledSequences,
    actionGraph: { main: { nodes }, macros: {} },
  };
}
const single = (actions: readonly ActionGraphStep[]) =>
  skill(nodes => [{ startFrame: 0, sequence: chain(nodes, 'main', actions) }], undefined);

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
    const program = runtime.createSequence(compileGraphSequence(entry.sequence, input.actionGraph));
    program.reset({});
    program.executeInstant({});
  }
  return observed;
}

describe('技能黑板和算术写入裁剪', () => {
  it('删除不影响行为的写入与初值，保留事件且不改变输入', () => {
    const input = single([assign('unused', 3), signal]);
    const withBlackboard: SkillDefinition = {
      ...input,
      blackboard: { unused: [1, 2], neverRead: 8 },
    };
    const before = structuredClone(withBlackboard);
    const result = pruneUnusedGraphSkillValues(withBlackboard);
    expect(result.skill.blackboard).toEqual({});
    expect(readKinds(result.skill, result.skill.scheduledSequences[0]!.sequence)).toEqual([
      'triggerCustomAbilityEvent',
    ]);
    expect(result.report.removedWrites).toHaveLength(1);
    expect(result.report.removedWrites[0]?.key).toBe('unused');
    expect(result.report.removedInitialKeys).toEqual(['unused', 'neverRead']);
    expect(withBlackboard).toEqual(before);
    expect(pruneUnusedGraphSkillValues(result.skill).skill).toBe(result.skill);
  });

  it('沿有用结果反查完整计算链，并保留各等级的初值', () => {
    const input = skill(
      nodes => [
        {
          startFrame: 0,
          sequence: chain(nodes, 'main', [
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
          ]),
        },
      ],
      { first: 1, second: 2, scale: [1, 2, 3], unused: 5 },
    );
    const result = pruneUnusedGraphSkillValues(input);
    expect(result.report.removedWrites).toEqual([]);
    expect(result.skill.blackboard).toEqual({ first: 1, second: 2, scale: [1, 2, 3] });
  });

  it('无人使用的计算链一起删除，不因目的键 epsilon 自读取把整条链留住', () => {
    const input = skill(
      nodes => [
        {
          startFrame: 0,
          sequence: chain(nodes, 'main', [
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
          ]),
        },
      ],
      { first: 1, second: 2 },
    );
    const result = pruneUnusedGraphSkillValues(input);
    expect(result.report.removedWrites).toHaveLength(2);
    expect(result.skill.blackboard).toEqual({});
  });

  it('未初始化的严格读取仍保留，不能把原来的缺键错误裁掉', () => {
    const input = skill(nodes => [
      {
        startFrame: 0,
        sequence: chain(nodes, 'main', [
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
        ]),
      },
    ]);
    expect(pruneUnusedGraphSkillValues(input).skill).toBe(input);
  });

  it('后续时间线和已安装事件监听都使值保持有效', () => {
    const input = skill(
      nodes => [
        {
          startFrame: 0,
          sequence: chain(nodes, 'main', [assign('later', 3), assign('eventValue', 4), signal]),
        },
        {
          startFrame: 10,
          sequence: chain(nodes, 'later', [
            {
              kind: 'changeResourceByActionValue',
              parameters: { resource: 'sp', recipient: 'team', amount: board('later') },
            },
          ]),
        },
        {
          startFrame: 0,
          sequence: chain(nodes, 'listener', [
            {
              kind: 'listenForCombatEvents',
              parameters: {
                responses: [
                  {
                    key: 'listener',
                    event: { kind: 'skillHit', skillGroupKey: 'battleSkill', scope: 'operator' },
                    sequence: chain(nodes, 'listener-body', [
                      {
                        kind: 'changeResourceByActionValue',
                        parameters: {
                          resource: 'sp',
                          recipient: 'team',
                          amount: board('eventValue'),
                        },
                      },
                    ]),
                  },
                ],
              },
            },
          ]),
        },
      ],
      { later: 0, eventValue: 0 },
    );
    expect(pruneUnusedGraphSkillValues(input).skill).toBe(input);
  });

  it('实体板、养成补丁、带引用身份的写入都保留', () => {
    const input = skill(
      nodes => [
        {
          startFrame: 0,
          sequence: chain(nodes, 'main', [
            assign('EntityBB_shared', 1),
            assign('patched', 2),
            { ...assign('named', 3), key: 'saved-reference' },
            signal,
          ]),
        },
      ],
      { EntityBB_shared: 0, patched: 0, named: 0 },
    );
    expect(pruneUnusedGraphSkillValues(input, new Set(['patched'])).skill).toBe(input);
  });

  it('序列不能删空，恢复保留动作时也恢复其输入初值', () => {
    const input = skill(
      nodes => [
        {
          startFrame: 0,
          sequence: chain(nodes, 'main', [
            {
              kind: 'calculateActionValue',
              parameters: {
                key: 'unused',
                operation: 'add',
                left: board('input'),
                right: literal(1),
              },
            },
          ]),
        },
      ],
      { input: 1, unused: 0, unrelated: 5 },
    );
    const result = pruneUnusedGraphSkillValues(input);
    expect(result.report.retainedLifetimePaths).toHaveLength(1);
    expect(result.skill.scheduledSequences).toEqual(input.scheduledSequences);
    expect(result.skill.blackboard).toEqual({ input: 1, unused: 0 });
  });

  it('父快照覆盖子初值，保留子程序读写涉及的父键，但不裁剪子写入', () => {
    const input = skill(
      nodes => [
        {
          startFrame: 0,
          sequence: chain(nodes, 'main', [
            assign('unused', 3),
            scope(
              nodes,
              'child',
              {
                scopeKey: 'child',
                initialValues: { inherited: 1, localUnused: 0 },
                inheritParent: true,
              },
              assign('localUnused', 7),
              spend('inherited'),
            ),
          ]),
        },
      ],
      { inherited: 9, unused: 2 },
    );
    const result = pruneUnusedGraphSkillValues(input);
    expect(result.report.retainedReason).toBeUndefined();
    expect(result.report.removedInitialKeys).toEqual(['unused']);
    expect(result.report.removedWrites.map(item => item.key)).toEqual(['unused']);
    const remaining = readKinds(result.skill, result.skill.scheduledSequences[0]!.sequence);
    expect(remaining).toEqual(['withActionBlackboardScope']);
    expect(executeSkillPrograms(input)).toEqual([9]);
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
  });

  it('同 scopeKey 的后续入口沿用首次创建的父快照，不能按后续 inheritParent=false 删值', () => {
    const input = skill(
      nodes => [
        {
          startFrame: 0,
          sequence: chain(nodes, 'first', [
            scope(
              nodes,
              'first',
              { scopeKey: 'shared', initialValues: {}, inheritParent: true },
              signal,
            ),
          ]),
        },
        {
          startFrame: 10,
          sequence: chain(nodes, 'second', [
            scope(
              nodes,
              'second',
              { scopeKey: 'shared', initialValues: { inherited: 1 }, inheritParent: false },
              spend('inherited'),
            ),
          ]),
        },
      ],
      { inherited: 9, unused: 2 },
    );
    const result = pruneUnusedGraphSkillValues(input);
    expect(result.skill.blackboard).toEqual({ inherited: 9 });
    expect(executeSkillPrograms(input)).toEqual([9]);
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
  });

  it('shareParentBlackboard 的子写入能被其他入口读取，保留同一父板及近似初值', () => {
    const input = skill(
      nodes => [
        {
          startFrame: 0,
          sequence: chain(nodes, 'main', [
            scope(
              nodes,
              'shared',
              {
                scopeKey: 'shared',
                initialValues: {},
                inheritParent: true,
                shareParentBlackboard: true,
              },
              assign('value', 3),
            ),
            spend('value'),
          ]),
        },
      ],
      { value: 3.000001, unused: 9 },
    );
    const result = pruneUnusedGraphSkillValues(input);
    expect(result.skill.blackboard).toEqual({ value: 3.000001 });
    expect(executeSkillPrograms(input)).toEqual([3.000001]);
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
  });

  it('独立子板的 entityAssignments 仍严格读取父板，实体初值被赋值覆盖', () => {
    const input = skill(
      nodes => [
        {
          startFrame: 0,
          sequence: chain(nodes, 'main', [
            scope(
              nodes,
              'isolated',
              {
                scopeKey: 'isolated',
                initialValues: {},
                inheritParent: false,
                entityInitialValues: { assigned: 1 },
                entityAssignments: { assigned: board('source') },
              },
              spend('assigned'),
            ),
          ]),
        },
      ],
      { source: 6, unused: 9 },
    );
    const result = pruneUnusedGraphSkillValues(input);
    expect(result.skill.blackboard).toEqual({ source: 6 });
    expect(executeSkillPrograms(input)).toEqual([6]);
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
  });

  it('实体整板继承及其外层子作用域继续阻止技能裁剪', () => {
    const escaped: ActionGraphStep = {
      kind: 'spawnAbilityEntity',
      parameters: {
        abilityEntityId: 'entity',
        dieWhenSourceDies: true,
        inheritActionBlackboard: true,
      },
    };
    for (const build of [
      (nodes: Record<string, ActionGraphNode>) =>
        chain(nodes, 'main', [assign('copied', 1), escaped]),
      (nodes: Record<string, ActionGraphNode>) =>
        chain(nodes, 'main', [
          assign('copied', 1),
          scope(
            nodes,
            'child',
            { scopeKey: 'child', initialValues: {}, inheritParent: true },
            escaped,
          ),
        ]),
      (nodes: Record<string, ActionGraphNode>) =>
        chain(nodes, 'main', [
          assign('copied', 1),
          scope(
            nodes,
            'isolated',
            { scopeKey: 'isolated', initialValues: {}, inheritParent: false },
            escaped,
          ),
        ]),
    ]) {
      const input = skill(nodes => [{ startFrame: 0, sequence: build(nodes) }], {
        copied: 0,
        mayBeReadByChild: 5,
      });
      const result = pruneUnusedGraphSkillValues(input);
      expect(result.skill).toBe(input);
      expect(result.report.retainedReason).toBe('unresolved-blackboard-access');
    }
  });
});

/** 读取入口同层动作的 kind 列表。 */
function readKinds(skillValue: SkillDefinition, reference: ActionGraphReference): string[] {
  const kinds: string[] = [];
  let cursor = reference.$sequence;
  while (cursor !== null) {
    const node = skillValue.actionGraph.main.nodes[cursor];
    if (!node) throw new Error(`missing node ${cursor}`);
    kinds.push(node.action.kind);
    cursor = node.next;
  }
  return kinds;
}
