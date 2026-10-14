import { createNativeEventFixture } from '../../../../src/core/combat/events/nativeEventTestFixture';
import { skillFixture } from '../../../../src/test/skillFixture';
import { extractResourceDataNodes } from '../../src/compiler/extractGraphDataNodes.ts';
/** 验证黑板裁剪的真实读取、缺键错误、跨入口保留和序列生命周期。 */
import { describe, expect, it } from 'vitest';
import type { CombatStepForKind } from '../../src/compiler/intermediateDefinitions.ts';
import type { SkillDefinition } from '../../src/compiler/intermediateDefinitions.ts';
import { pruneUnusedGraphSkillValues } from '../../src/compiler/optimization/graphValueOptimization.ts';
import { optimizeResourceGraphs } from '../../src/compiler/optimization/resourceGraphOptimization.ts';
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
} from '../../src/compiler/intermediateDefinitions.ts';

const literal = (value: number) => ({ kind: 'constant' as const, value });
const board = (key: string) => ({ kind: 'blackboard' as const, key });
const assign = (key: string, value: number): CombatStepForKind<'modifyActionValue'> => ({
  kind: 'modifyActionValue',
  parameters: { key, operation: 'assign', value: literal(value) },
});
const spend = (key: string): ActionGraphStep => ({
  kind: 'changeResource',
  parameters: {
    resource: 'sp',
    source: { kind: 'owner' },
    targets: { kind: 'owner' },
    amount: board(key),
  },
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
    ...skillFixture({
      key: 'fixture',
      timelineBlockFrames: 30,
      scheduledSequences: [],
      actionGraph: { main: { nodes: {} }, macros: {} },
    }),
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
      if (step.kind === 'changeResource') {
        observed.push(
          typeof step.parameters.amount === 'number'
            ? step.parameters.amount
            : resolveActionValueOperand(step.parameters.amount, context!.blackboard),
        );
      }
      if (step.kind === 'createSpatialPointTargets') {
        observed.push(resolveActionValueOperand(step.parameters.count, context!.blackboard));
      }
      return true;
    },
    evaluate: () => true,
  });
  const runtime = new CombatActionSequenceRuntime(
    operations,
    { blackboard },
    {},
    createNativeEventFixture().semanticEvents,
    'fixture',
  );
  for (const entry of input.scheduledSequences) {
    const program = runtime.createSequence(compileGraphSequence(entry.sequence, input.actionGraph));
    program.reset({});
    program.executeInstant({});
  }
  return observed;
}

describe('技能黑板和算术写入裁剪', () => {
  it.each([false, true])('无人读取的逻辑点及距离写入可删，动态数量的读取仍保留：%s', dynamic => {
    const input = skill(
      nodes => {
        const point = chain(nodes, 'point', [
          {
            kind: 'createSpatialPointTargets',
            parameters: {
              saveToContextKey: 'points',
              count: dynamic ? board('distance') : literal(1),
            },
          },
        ]);
        const yes = chain(nodes, 'yes', [assign('distance', 3)]);
        const no = chain(nodes, 'no', [assign('distance', 4)]);
        nodes[yes.$sequence!] = { ...nodes[yes.$sequence!]!, next: point.$sequence };
        nodes[no.$sequence!] = { ...nodes[no.$sequence!]!, next: point.$sequence };
        return [
          {
            startFrame: 0,
            sequence: chain(nodes, 'entry', [
              assign('distance', 0),
              {
                kind: 'ifElse',
                parameters: { alwaysNext: true },
                condition: {
                  kind: 'checkActionResult',
                  action: chain(nodes, 'condition', [
                    {
                      kind: 'checkCondition',
                      parameters: {
                        condition: {
                          kind: 'actionValueCompare',
                          left: board('distance'),
                          operator: 'lessOrEqual',
                          right: literal(10),
                        },
                      },
                    },
                  ]),
                },
                whenTrue: yes,
                whenFalse: no,
              },
            ]),
          },
        ];
      },
      { distance: 0 },
    );
    const result = optimizeResourceGraphs(
      input,
      'apply',
      value => pruneUnusedGraphSkillValues(value).skill,
    ).value;
    const actions = Object.values(result.actionGraph.main.nodes).map(node => node.action);
    expect(actions.some(action => action.kind === 'modifyActionValue')).toBe(dynamic);
    expect(actions.some(action => action.kind === 'createSpatialPointTargets')).toBe(dynamic);
    if (!dynamic) expect(result.blackboard).not.toHaveProperty('distance');
    expect(executeSkillPrograms(input)).toEqual([dynamic ? 3 : 1]);
    expect(executeSkillPrograms(result)).toEqual(dynamic ? [3] : []);
  });

  it.each([false, true])('动画结束回调的无用写入可删空，后续读取仍保留：%s', readAfter => {
    const input = skill(
      nodes => [
        {
          startFrame: 0,
          sequence: chain(nodes, 'main', [
            {
              kind: 'playAnimation',
              parameters: { durationSeconds: 1, blendOutSeconds: 0, executeOnNormalEndOnly: true },
              onEnd: chain(nodes, 'end', [assign('value', 7)]),
            },
          ]),
        },
        ...(readAfter
          ? [{ startFrame: 60, sequence: chain(nodes, 'read', [spend('value')]) }]
          : []),
      ],
      { value: 0 },
    );
    const result = optimizeResourceGraphs(
      input,
      'apply',
      value => pruneUnusedGraphSkillValues(value).skill,
    ).value;
    expect(
      Object.values(result.actionGraph.main.nodes).some(
        node => node.action.kind === 'playAnimation',
      ),
    ).toBe(readAfter);
    if (!readAfter) {
      expect(result.scheduledSequences).toEqual([]);
      expect(result.blackboard).not.toHaveProperty('value');
      return;
    }
    const boardState = new ActionBlackboard({ value: 0 });
    const runtime = new CombatActionSequenceRuntime(
      new ActionBlackboardOperationExecutor({
        execute: () => true,
        evaluate: () => true,
      }),
      { blackboard: boardState },
    );
    const action = runtime.createSequence(
      compileGraphSequence(result.scheduledSequences[0]!.sequence, result.actionGraph),
    );
    action.tryExecute({});
    action.tick(1, {});
    expect(boardState.getNumber('value')).toBe(7);
  });

  it.each([
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ])('无外部消费者的局部计算可删除：外部读取=%s，分支自增=%s', (externalRead, branchWrite) => {
    const input = skill(
      nodes => {
        const condition = chain(nodes, 'condition', [
          ...(!branchWrite ? [assign('local', 5)] : []),
          {
            kind: 'checkCondition',
            parameters: {
              condition: {
                kind: 'actionValueCompare',
                left: board('local'),
                operator: 'greater',
                right: literal(0),
              },
            },
          },
        ]);
        return [
          {
            startFrame: 0,
            sequence: chain(nodes, 'entry', [
              {
                kind: 'ifElse',
                parameters: { alwaysNext: true },
                condition: { kind: 'checkActionResult', action: condition },
                whenTrue: branchWrite
                  ? chain(nodes, 'increment', [
                      {
                        kind: 'calculateActionValue',
                        parameters: {
                          key: 'local',
                          operation: 'add',
                          left: board('local'),
                          right: literal(1),
                        },
                      },
                    ])
                  : { $sequence: null },
                whenFalse: { $sequence: null },
              },
              ...(externalRead ? [spend('local')] : []),
            ]),
          },
        ];
      },
      { local: 1 },
    );
    const result = pruneUnusedGraphSkillValues(input).skill;
    expect(executeSkillPrograms(result)).toEqual(executeSkillPrograms(input));
    expect(
      Object.values(result.actionGraph.main.nodes).some(
        node =>
          node.action.kind === 'modifyActionValue' || node.action.kind === 'calculateActionValue',
      ),
    ).toBe(externalRead);
  });

  it.each([false, true])('分支返回值仅在父节点使用时保留：alwaysNext=%s', alwaysNext => {
    const input = skill(
      nodes => [
        {
          startFrame: 0,
          sequence: chain(nodes, 'main', [
            {
              kind: 'ifElse',
              parameters: { alwaysNext },
              condition: { kind: 'checkActionResult', action: chain(nodes, 'condition', [signal]) },
              whenTrue: chain(nodes, 'body', [assign('unused', 7)]),
              whenFalse: { $sequence: null },
            },
          ]),
        },
      ],
      { unused: 0 },
    );
    const result = pruneUnusedGraphSkillValues(input);
    expect(result.report.removedWrites).toHaveLength(alwaysNext ? 1 : 0);
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
  });

  it('异步读取保护共享值，但不阻止同步区域的独立死写入删除', () => {
    let response: ActionGraphReference;
    const input = skill(
      nodes => {
        response = chain(nodes, 'response', [spend('shared')]);
        return [
          {
            startFrame: 0,
            sequence: chain(nodes, 'main', [
              spend('local'),
              {
                kind: 'listenForCombatEvents',
                parameters: {
                  responses: [
                    {
                      key: 'listener',
                      event: { kind: 'knockDownOutput' },
                      sequence: response,
                    },
                  ],
                },
              },
              assign('shared', 7),
              assign('local', 9),
            ]),
          },
        ];
      },
      { local: 3, shared: 1 },
    );
    const result = pruneUnusedGraphSkillValues(input);
    expect(result.report.removedWrites.map(item => item.key)).toEqual(['local']);
    // 延后执行同一变量板上的事件入口，验证注册之后的写入仍能被观察。
    const executeWithResponse = (value: SkillDefinition) =>
      executeSkillPrograms({
        ...value,
        scheduledSequences: [...value.scheduledSequences, { startFrame: 1, sequence: response! }],
      });
    expect(executeWithResponse(result.skill)).toEqual([3, 7]);
    expect(executeWithResponse(result.skill)).toEqual(executeWithResponse(input));
  });

  it.each(['switch', 'anyCondition'] as const)('%s 的子序列出口连接外层后继', kind => {
    const input = skill(
      nodes => {
        const body = chain(nodes, 'body', [spend('value'), assign('value', 7)]);
        const action: ActionGraphStep =
          kind === 'switch'
            ? {
                kind,
                parameters: { choice: literal(1), alwaysNext: true },
                options: [{ value: literal(1), sequence: body }],
              }
            : { kind, parameters: {}, conditions: [{ kind: 'checkActionResult', action: body }] };
        return [
          {
            startFrame: 0,
            sequence: chain(nodes, 'main', [action, spend('value'), assign('value', 9)]),
          },
        ];
      },
      { value: 3 },
    );
    const result = pruneUnusedGraphSkillValues(input);
    expect(executeSkillPrograms(result.skill)).toEqual([3, 7]);
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
    expect(result.report.removedWrites.map(item => item.path)).toEqual([
      'scheduledSequences[0].sequence→main-2',
    ]);
  });

  it('多个调度分别保留跨入口用途，删除不被其他入口观察的末尾写入', () => {
    const input = skill(
      nodes => [
        {
          startFrame: 0,
          sequence: chain(nodes, 'first', [
            spend('local'),
            assign('local', 9),
            assign('shared', 7),
          ]),
        },
        { startFrame: 1, sequence: chain(nodes, 'second', [spend('shared')]) },
      ],
      { local: 3, shared: 1 },
    );
    const result = pruneUnusedGraphSkillValues(input);
    expect(executeSkillPrograms(result.skill)).toEqual([3, 7]);
    expect(result.report.removedWrites.map(item => item.key)).toEqual(['local']);
  });

  it.each([false, true])('分支末尾写入依据外层后继读取保留：%s', readAfter => {
    const input = skill(
      nodes => {
        const branch = chain(nodes, 'branch', [spend('value'), assign('value', 7)]);
        const condition = chain(nodes, 'condition', [signal]);
        return [
          {
            startFrame: 0,
            sequence: chain(nodes, 'main', [
              {
                kind: 'ifElse',
                parameters: { alwaysNext: true },
                condition: { kind: 'checkActionResult', action: condition },
                whenTrue: branch,
                whenFalse: { $sequence: null },
              },
              ...(readAfter ? [spend('value')] : []),
            ]),
          },
        ];
      },
      { value: 3 },
    );
    const result = pruneUnusedGraphSkillValues(input);
    expect(executeSkillPrograms(result.skill)).toEqual(readAfter ? [3, 7] : [3]);
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
    expect(result.report.removedWrites).toHaveLength(readAfter ? 0 : 1);
  });

  it('共享分支合并所有调用点的后继读取', () => {
    const input = skill(
      nodes => {
        const branch = chain(nodes, 'shared', [spend('value'), assign('value', 7)]);
        const condition = chain(nodes, 'condition', [signal]);
        const call: ActionGraphStep = {
          kind: 'ifElse',
          parameters: { alwaysNext: true },
          condition: { kind: 'checkActionResult', action: condition },
          whenTrue: branch,
          whenFalse: { $sequence: null },
        };
        return [{ startFrame: 0, sequence: chain(nodes, 'main', [call, spend('value'), call]) }];
      },
      { value: 3 },
    );
    const result = pruneUnusedGraphSkillValues(input);
    expect(result.report.removedWrites).toEqual([]);
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
  });

  it('保留读取之前的写入，删除同一入口最后一次读取之后的写入', () => {
    const input = {
      ...single([assign('value', 3), spend('value'), assign('value', 7)]),
      blackboard: { value: 0 },
    };
    const result = pruneUnusedGraphSkillValues(input);
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
    expect(result.report.removedWrites).toEqual([
      { path: 'scheduledSequences[0].sequence→main-2', key: 'value' },
    ]);
    expect(pruneUnusedGraphSkillValues(result.skill).report.removedWrites).toEqual([]);
  });

  it('后续调度读取和受保护变量不能当作直链末尾的死写入', () => {
    const input = skill(
      nodes => [
        { startFrame: 0, sequence: chain(nodes, 'first', [spend('value'), assign('value', 7)]) },
        { startFrame: 1, sequence: chain(nodes, 'second', [spend('value')]) },
      ],
      { value: 3 },
    );
    expect(executeSkillPrograms(pruneUnusedGraphSkillValues(input).skill)).toEqual([3, 7]);
    const protectedInput = {
      ...single([spend('value'), assign('value', 7)]),
      blackboard: { value: 3 },
    };
    expect(
      pruneUnusedGraphSkillValues(protectedInput, new Set(['value'])).report.removedWrites,
    ).toEqual([]);
  });

  it('后续 Assign 在容差内保留旧值，不能据此删除先前写入', () => {
    const input = {
      ...single([assign('value', 1), assign('value', 1.000005), spend('value')]),
      blackboard: { value: 0 },
    };
    const result = pruneUnusedGraphSkillValues(input);
    expect(executeSkillPrograms(result.skill)).toEqual([1]);
    expect(result.report.removedWrites).toEqual([]);
    const withoutFirst = {
      ...single([assign('value', 1.000005), spend('value')]),
      blackboard: { value: 0 },
    };
    expect(executeSkillPrograms(withoutFirst)[0]).not.toBe(1);
  });

  it('投射物实体赋值是发射动作的输入，不依赖额外作用域节点保留来源', () => {
    const input = single([
      assign('payload', 7),
      {
        kind: 'launchProjectile',
        parameters: {
          inheritActionBlackboard: false,
          entityAssignments: { EntityBB_payload: board('payload') },
          finish: 1,
          recycleDelaySeconds: 0,
        },
        callbacks: [],
      },
    ]);
    const result = pruneUnusedGraphSkillValues({
      ...input,
      blackboard: { payload: 0, unused: 3 },
    });
    expect(result.skill.blackboard).toEqual({ payload: 0 });
    expect(result.report.removedWrites).toEqual([]);
    expect(readKinds(result.skill, result.skill.scheduledSequences[0]!.sequence)).toEqual([
      'modifyActionValue',
      'launchProjectile',
    ]);
  });

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
              kind: 'changeResource',
              parameters: {
                resource: 'sp',
                source: { kind: 'owner' },
                targets: { kind: 'owner' },
                amount: board('second'),
              },
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
              kind: 'changeResource',
              parameters: {
                resource: 'sp',
                source: { kind: 'owner' },
                targets: { kind: 'owner' },
                amount: board('later'),
              },
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
                    event: { kind: 'skillHit', skillKey: 'battleSkill', scope: 'operator' },
                    sequence: chain(nodes, 'listener-body', [
                      {
                        kind: 'changeResource',
                        parameters: {
                          resource: 'sp',
                          source: { kind: 'owner' },
                          targets: { kind: 'owner' },
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

  it('时间线不读取根序列返回值，允许删空无用写入及其输入初值', () => {
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
    expect(result.report.retainedLifetimePaths).toEqual([]);
    expect(result.skill.scheduledSequences[0]!.sequence.$sequence).toBeNull();
    expect(result.skill.blackboard).toEqual({});
    expect(executeSkillPrograms(result.skill)).toEqual(executeSkillPrograms(input));
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

it('无用途夹角计算可正式化，存在跨调度消费者时拒绝发布', () => {
  const angle: ActionGraphStep = {
    kind: 'saveTwoDirectionAngle',
    parameters: {
      outputKey: 'angle',
      direction1Source: { kind: 'source' },
      direction1Target: { kind: 'inputTarget' },
      direction1Type: 'CameraForward',
      direction2Source: { kind: 'source' },
      direction2Target: { kind: 'mainTarget', owner: { kind: 'owner' } },
      direction2Type: 'SourceToTarget',
    },
  };
  const create = (consumed: boolean) =>
    skill(
      nodes => [
        {
          startFrame: 0,
          sequence: chain(nodes, 'write', [
            angle,
            {
              kind: 'modifyActionValue',
              parameters: { key: 'copy', operation: 'assign', value: board('angle') },
            },
          ]),
        },
        ...(consumed ? [{ startFrame: 10, sequence: chain(nodes, 'read', [spend('copy')]) }] : []),
      ],
      { angle: 0, copy: 0 },
    );
  const unused = pruneUnusedGraphSkillValues(create(false));
  expect(unused.skill.actionGraph.main.nodes).toEqual({});
  expect(unused.skill.blackboard).toEqual({});
  expect(() => extractResourceDataNodes(unused.skill.actionGraph)).not.toThrow();
  const used = create(true);
  expect(pruneUnusedGraphSkillValues(used).skill).toBe(used);
  expect(() => extractResourceDataNodes(used.actionGraph)).toThrow(
    'direction angle still affects combat',
  );
});
