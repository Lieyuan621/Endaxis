import { describe, expect, it } from 'vitest';
import type { ActionGraphResourceDefinition } from '../../../../packages/game-data-contract/src/actionGraph';
import { validateSkillDefinition } from '../validateSkillDefinition';

const reference = ($sequence: string | null) => ({ $sequence });
const graph = (
  nodes: ActionGraphResourceDefinition['main']['nodes'],
  macros: ActionGraphResourceDefinition['macros'] = {},
): ActionGraphResourceDefinition => ({ main: { nodes }, macros });
const skill = (actionGraph: ActionGraphResourceDefinition, endFrame?: number) => ({
  key: 'context-test',
  timelineBlockFrames: 30,
  actionGraph,
  scheduledSequences: [
    {
      startFrame: 0,
      ...(endFrame === undefined ? {} : { endFrame }),
      sequence: reference('start'),
    },
  ],
});

describe('图校验的宏与跨资源上下文', () => {
  it.each([false, true])('正常报告宏递归，不栈溢出：间接递归=%s', indirect => {
    const resource = graph(
      { start: { action: { kind: 'callMacro', macroId: 'a' }, next: null } },
      {
        a: {
          entry: reference('call'),
          graph: {
            nodes: {
              call: { action: { kind: 'callMacro', macroId: indirect ? 'b' : 'a' }, next: null },
            },
          },
        },
        ...(indirect
          ? {
              b: {
                entry: reference('call'),
                graph: {
                  nodes: {
                    call: { action: { kind: 'callMacro' as const, macroId: 'a' }, next: null },
                  },
                },
              },
            }
          : {}),
      },
    );
    expect(
      validateSkillDefinition(skill(resource)).some(issue =>
        issue.message.includes('recursive macro call'),
      ),
    ).toBe(true);
  });

  it('同一宏在迭代内合法、迭代外非法，不因已经访问而漏检', () => {
    const resource = graph(
      {
        start: {
          action: {
            kind: 'forEachContextTarget',
            parameters: { contextKey: 'entities' },
            body: reference('inside'),
          },
          next: 'outside',
        },
        inside: { action: { kind: 'callMacro', macroId: 'finish' }, next: null },
        outside: { action: { kind: 'callMacro', macroId: 'finish' }, next: null },
      },
      {
        finish: {
          entry: reference('finish'),
          graph: {
            nodes: {
              finish: {
                action: { kind: 'finishCurrentAbilityEntity', parameters: {} },
                next: null,
              },
            },
          },
        },
      },
    );
    expect(
      validateSkillDefinition(skill(resource)).filter(issue =>
        issue.message.includes('requires a forEachContextTarget body'),
      ),
    ).toHaveLength(1);
  });

  it('同步外部资源继承实体上下文，但不把迭代上下文泄漏给同级 next', () => {
    const call = {
      kind: 'callResource' as const,
      resource: {
        id: 'finish',
        actionGraph: graph({
          finish: { action: { kind: 'finishCurrentAbilityEntity', parameters: {} }, next: null },
        }),
        entry: reference('finish'),
      },
    };
    const inside = graph({
      start: {
        action: {
          kind: 'forEachContextTarget',
          parameters: { contextKey: 'entities' },
          body: reference('call'),
        },
        next: null,
      },
      call: { action: call, next: null },
    });
    expect(validateSkillDefinition(skill(inside))).toEqual([]);
    const outside = graph({
      ...inside.main.nodes,
      start: { ...inside.main.nodes.start!, next: 'outside' },
      outside: { action: call, next: null },
    });
    expect(
      validateSkillDefinition(skill(outside)).filter(issue =>
        issue.message.includes('requires a forEachContextTarget body'),
      ),
    ).toHaveLength(1);
  });

  it('外部资源内的监听器仍受调用者排程的结束帧约束', () => {
    const resource = graph({
      start: {
        action: {
          kind: 'callResource',
          resource: {
            id: 'listener',
            entry: reference('listen'),
            actionGraph: graph({
              listen: {
                action: {
                  kind: 'listenForCombatEvents',
                  parameters: {
                    responses: [
                      {
                        key: 'hit',
                        event: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
                        sequence: reference(null),
                      },
                    ],
                  },
                },
                next: null,
              },
            }),
          },
        },
        next: null,
      },
    });
    expect(validateSkillDefinition(skill(resource))).toContainEqual({
      path: '$.scheduledSequences[0].endFrame',
      message: 'combat event listeners require an end frame',
    });
    expect(validateSkillDefinition(skill(resource, 30))).toEqual([]);
  });
});
