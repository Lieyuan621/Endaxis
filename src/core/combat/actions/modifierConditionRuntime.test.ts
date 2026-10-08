import { describe, expect, it } from 'vitest';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import { ActionBlackboard } from './actionBlackboard';
import { CombatActionSequenceRuntime } from './combatActionSequenceRuntime';
import { createModifierConditionRuntime } from './modifierConditionRuntime';
import { EventContextConditionExecutor } from '../events/eventContextConditionExecutor';
import type { CombatOperationContext } from '../skills/skillRuntime';
import type { ActionSequenceState } from '../state/actionState';

describe('修正条件的公共动作宿主', () => {
  it('重入可重跑已复位的前缀，但不能结束仍在执行的动作或覆盖外层上下文', () => {
    const graph = createActionGraphCompilation(
      {
        nodes: Object.fromEntries(
          ['first', 'second'].map((id, index) => [
            id,
            {
              action: {
                kind: 'conditional' as const,
                parameters: { condition: { kind: 'conditionNode' as const, nodeId: id } },
                whenTrue: { $sequence: null },
              },
              next: index === 0 ? 'second' : null,
            },
          ]),
        ),
        dataNodes: {
          first: {
            type: 'boolean',
            expression: { kind: 'eventHealTagsMatch', match: 'hasAny', tags: ['first'] },
          },
          second: {
            type: 'boolean',
            expression: { kind: 'eventHealTagsMatch', match: 'hasAny', tags: ['second'] },
          },
        },
      },
      1,
      'reentry',
    ).compileAll();
    const visited: string[] = [];
    const runtime = new CombatActionSequenceRuntime(
      {
        execute: () => true,
        evaluate(check, context) {
          if (check.kind !== 'eventHealTagsMatch') throw new Error('unexpected check');
          const tag = check.tags[0]!;
          const current = context!.modifierContext;
          visited.push(
            `${tag}:${context!.actionInputTarget?.kind === 'operator' ? context!.actionInputTarget.operatorId : ''}`,
          );
          if (tag === 'second') {
            expect(condition.execute('nested')).toBe(false);
            expect(context!.modifierContext).toBe(current);
            expect(context!.actionInputTarget).toEqual({ kind: 'operator', operatorId: 'outer' });
          }
          return true;
        },
      },
      { blackboard: new ActionBlackboard() },
    );
    const condition = createModifierConditionRuntime<string>(
      { graph, entry: 'first', callSite: 'reentry' },
      runtime,
      receiverId => ({
        target: { kind: 'operator', operatorId: receiverId },
        context: {
          kind: 'heal',
          input: { side: 'healer', healerId: 'owner', receiverId, tags: [] },
        },
      }),
    );
    expect(condition.execute('outer')).toBe(true);
    expect(condition.execute('outer')).toBe(true);
    expect(visited).toEqual([
      'first:outer',
      'second:outer',
      'first:nested',
      'first:outer',
      'second:outer',
      'first:nested',
    ]);
  });
  it.each(['heal', 'poise'] as const)(
    '%s 使用独立计算上下文，连续执行及恢复不残留上次输入',
    kind => {
      const graph = createActionGraphCompilation(
        {
          nodes: {
            guard: {
              action: {
                kind: 'conditional',
                parameters: {
                  condition: { kind: 'conditionNode', nodeId: 'tags' },
                },
                whenTrue: { $sequence: null },
              },
              next: null,
            },
          },
          dataNodes: {
            tags: {
              type: 'boolean',
              expression:
                kind === 'heal'
                  ? { kind: 'eventHealTagsMatch', match: 'hasAny', tags: ['Skill/Test/Heal'] }
                  : {
                      kind: 'eventDamageTagsMatch',
                      match: 'hasAny',
                      tags: ['normalAttackLastCombo'],
                    },
            },
          },
        },
        1,
        'modifier',
      ).compileAll();
      let observed: CombatOperationContext | undefined;
      const events = new EventContextConditionExecutor({
        execute: () => true,
        evaluate: () => {
          throw new Error('unexpected condition');
        },
      });
      const runtime = new CombatActionSequenceRuntime(
        {
          execute: () => true,
          evaluate(condition, context) {
            observed = context;
            expect(context?.modifierContext?.kind).toBe(kind);
            expect(context?.actionInputTarget).toEqual({ kind: 'operator', operatorId: 'other' });
            return events.evaluate(condition, context);
          },
        },
        { blackboard: new ActionBlackboard() },
      );
      const create = (state?: ActionSequenceState) =>
        createModifierConditionRuntime<boolean>(
          { graph, entry: 'guard', callSite: 'modifier' },
          runtime,
          matches => ({
            target: { kind: 'operator', operatorId: 'other' },
            context:
              kind === 'heal'
                ? {
                    kind,
                    input: {
                      side: 'healer',
                      healerId: 'owner',
                      receiverId: 'other',
                      tags: matches ? ['Skill/Test/Heal'] : [],
                    },
                  }
                : {
                    kind,
                    input: {
                      side: 'attacker',
                      attackerId: 'owner',
                      defenderId: 'other',
                      tags: matches ? ['normalAttackLastCombo'] : [],
                      features: [],
                    },
                  },
          }),
          state,
        );
      const condition = create();
      expect(condition.execute(true)).toBe(true);
      expect(condition.execute(false)).toBe(false);
      expect(observed?.modifierContext).toBeUndefined();
      expect(observed?.actionInputTarget).toBeUndefined();
      const state = structuredClone(condition.runtimeState);
      const restored = create(state);
      expect(restored.runtimeState).toBe(state);
      expect(restored.execute(true)).toBe(true);
      expect(restored.execute(false)).toBe(false);
    },
  );
});
