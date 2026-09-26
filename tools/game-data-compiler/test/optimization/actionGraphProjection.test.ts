/**
 * 树→图投影器（createActionGraphProjection / createActionGraphResourceProjection）已随树桥接删除。
 * 仅测已删接口的用例随之删除：
 * - 自动宏提取已删除，重复结构由 actionGraphDeduplication.test.ts 验证分支去重。
 * - 'shares equal tails without deleting calls or mutable instance boundaries'
 *   （投影器尾部共享与实例边界语义）
 * - 'does not merge distinct numeric values or user scope names'
 *   （投影器按值 interning 语义）
 * 保留的用例改为直接验证仍存在的 prepareActionGraphIdentities 与已生成图资源本身。
 */
import { describe, expect, it } from 'vitest';
import { prepareActionGraphIdentities } from '../../src/compiler/optimization/actionGraphProjection.ts';
import { validateActionGraphResource } from '../../../../src/core/action-graph/actionGraphValidation.ts';
import type {
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../../packages/game-data-contract/src/actionGraph.ts';
import { typhoeus } from '../../../../src/data/operators/typhoeus.generated.ts';

const finish: ActionGraphStep = { kind: 'finishTimeline', parameters: {} };

describe('prepareActionGraphIdentities 与已生成图资源', () => {
  it('真实提弗洛斯浮空普攻已经是独立技能图资源', () => {
    const group = typhoeus.skillGroups.find(item => item.key === 'basicAttack');
    const skill = group?.variants?.[0]?.skills;
    if (!Array.isArray(skill)) throw new Error('missing floating attack sequence');
    const definition = skill.find(item => item.key === 'chr_0034_typhoea_floating_attack2');
    if (!definition) throw new Error('missing floating attack 2');
    const prepared = prepareActionGraphIdentities(definition);
    validateActionGraphResource(prepared.actionGraph);
    expect(Object.keys(prepared.actionGraph.main.nodes).length).toBeLessThan(100);
    expect(prepared.scheduledSequences[2]?.sequence).toEqual(
      prepared.scheduledSequences[4]?.sequence,
    );
  });

  it('omits per-call identities and binds local scopes when loading', () => {
    const make = (id: string): { actionGraph: ActionGraphResourceDefinition } => ({
      actionGraph: {
        main: {
          nodes: {
            entry: {
              action: {
                kind: 'withActionBlackboardScope',
                parameters: {
                  scopeKey: `SkillData.${id}`,
                  inheritParent: true,
                  initialValues: { hit_num: 0 },
                  lifetime: 'execution',
                },
                body: { $sequence: 'hit' },
              },
              next: null,
            },
            hit: { action: { ...finish, key: `SkillData.${id}:hit` }, next: null },
          },
        },
        macros: {},
      },
    });
    const a = prepareActionGraphIdentities(make('a'));
    const b = prepareActionGraphIdentities(make('b'));
    expect(b).toEqual(a);
    const scopeNode = a.actionGraph.main.nodes.entry!.action;
    if (scopeNode.kind !== 'withActionBlackboardScope') throw new Error('scope');
    expect(scopeNode.parameters).toMatchObject({
      lifetime: 'execution',
      initialValues: { hit_num: 0 },
      inheritParent: true,
    });
    expect(scopeNode.parameters).not.toHaveProperty('scopeKey');
    expect(scopeNode.body).toEqual({ $sequence: 'hit' });
    // 未被引用的生成 key 删除。
    expect(a.actionGraph.main.nodes.hit!.action).toEqual(finish);
  });

  it('preserves explicit step references and shared once scopes, while isolating independent ones', () => {
    const source = {
      modifiers: [{ stepKey: 'SkillData.hit' }],
      actionGraph: {
        main: {
          nodes: {
            hit: {
              action: {
                kind: 'dealDamage',
                key: 'SkillData.hit',
                parameters: { damageType: 'physical', attackScale: 1, tags: ['normalAttack'] },
              },
              next: 'once-shared-1',
            },
            'once-shared-1': {
              action: {
                kind: 'once',
                parameters: { scopeKey: 'SkillData.shared' },
                body: { $sequence: 'end' },
              },
              next: 'once-shared-2',
            },
            'once-shared-2': {
              action: {
                kind: 'once',
                parameters: { scopeKey: 'SkillData.shared' },
                body: { $sequence: 'end' },
              },
              next: 'once-other',
            },
            'once-other': {
              action: {
                kind: 'once',
                parameters: { scopeKey: 'SkillData.other' },
                body: { $sequence: 'end' },
              },
              next: null,
            },
            end: { action: finish, next: null },
          },
        },
        macros: {},
      },
    } satisfies { modifiers: { stepKey: string }[]; actionGraph: ActionGraphResourceDefinition };
    const prepared = prepareActionGraphIdentities(source);
    // 被显式引用的生成 key 保留原名。
    const damage = prepared.actionGraph.main.nodes.hit!.action;
    if (damage.kind !== 'dealDamage') throw new Error('damage');
    expect(damage.key).toBe(prepared.modifiers[0]!.stepKey);
    // 两个共享 scopeKey 的 once 调用保留相同的作用域身份；单人 scopeKey 被删去。
    const onceActions = [
      prepared.actionGraph.main.nodes['once-shared-1']!.action,
      prepared.actionGraph.main.nodes['once-shared-2']!.action,
      prepared.actionGraph.main.nodes['once-other']!.action,
    ];
    for (const action of onceActions)
      if (action.kind !== 'once') throw new Error('once fixture broken');
    const [shared1, shared2, other] = onceActions as Extract<ActionGraphStep, { kind: 'once' }>[];
    expect(shared1.parameters.scopeKey).toBeDefined();
    expect(shared1.parameters.scopeKey).toBe(shared2.parameters.scopeKey);
    expect(other.parameters.scopeKey).toBeUndefined();
    expect(shared1.body).toEqual({ $sequence: 'end' });
    expect(other.body).toEqual({ $sequence: 'end' });
  });
});
