import { describe, expect, it } from 'vitest';
import {
  diffSkillDefinition,
  type SkillDiffEntry,
  type SkillDiffPathSegment,
} from './diffSkillDefinition';
import type { CombatStepDefinition, SkillDefinition } from './operatorDefinition';
import type { CombatEventHandlerDefinition } from '../../../packages/game-data-contract/src/actions.ts';
import type { ActionGraphNode } from '../../../packages/game-data-contract/src/actionGraph';

function damageStep(key: string | undefined, attackScale = 1): CombatStepDefinition {
  return {
    kind: 'dealDamage',
    ...(key === undefined ? {} : { key }),
    parameters: {
      damageType: 'physical',
      attackScale,
      tags: ['normalAttack'],
    },
  };
}

function skill(
  steps: readonly CombatStepDefinition[],
  overrides: Partial<SkillDefinition> = {},
): SkillDefinition {
  const nodes: Record<string, ActionGraphNode> = {};
  steps.forEach((action, index) => {
    nodes[`step-${index}`] = {
      action,
      next: index + 1 < steps.length ? `step-${index + 1}` : null,
    };
  });
  return {
    key: 'skill',
    timelineBlockFrames: 30,
    scheduledSequences: [
      { startFrame: 0, sequence: { $sequence: steps.length === 0 ? null : 'step-0' } },
    ],
    actionGraph: { main: { nodes }, macros: {} },
    ...overrides,
  };
}

/** 事件处理器是技能定义中仍带稳定 key 的数组；用它保留 key 匹配语义覆盖。 */
function handler(key: string, startFrame = 1): CombatEventHandlerDefinition {
  return {
    key,
    event: { kind: 'operatorHit' },
    scheduledSequences: [{ startFrame, sequence: { $sequence: null } }],
  };
}

function pathString(path: readonly SkillDiffPathSegment[]): string {
  return path
    .map(segment => {
      switch (segment.kind) {
        case 'field':
          return `.${segment.name}`;
        case 'index':
          return `[${segment.index}]`;
        case 'key':
          return `[key:${segment.key}]`;
      }
    })
    .join('');
}

const graphNodesPath: readonly SkillDiffPathSegment[] = [
  { kind: 'field', name: 'actionGraph' },
  { kind: 'field', name: 'main' },
  { kind: 'field', name: 'nodes' },
];

const handlersPath: readonly SkillDiffPathSegment[] = [{ kind: 'field', name: 'eventHandlers' }];

describe('diffSkillDefinition', () => {
  it('相同输入返回空数组', () => {
    const template = skill([damageStep('hit:1', 0.5)]);
    const custom = structuredClone(template);

    expect(diffSkillDefinition(template, custom)).toEqual([]);
  });

  it('标量变化产生 changed（图节点按节点 ID 字段匹配）', () => {
    const template = skill([damageStep(undefined, 0.5)]);
    const custom = skill([damageStep(undefined, 0.8)]);

    const items = diffSkillDefinition(template, custom);
    expect(items).toEqual<SkillDiffEntry[]>([
      {
        kind: 'changed',
        path: [
          ...graphNodesPath,
          { kind: 'field', name: 'step-0' },
          { kind: 'field', name: 'action' },
          { kind: 'field', name: 'parameters' },
          { kind: 'field', name: 'attackScale' },
        ],
        before: 0.5,
        after: 0.8,
      },
    ]);
  });

  it('字段增删在根对象产生 removed 与 added', () => {
    const template = skill([damageStep('hit:1')], {
      costs: [{ resource: 'sp', value: 100 }],
    });
    const custom = skill([damageStep('hit:1')], {
      availability: { kind: 'targetStaggered', target: 'enemy' },
    });

    const items = diffSkillDefinition(template, custom);
    expect(items).toEqual<SkillDiffEntry[]>([
      {
        kind: 'removed',
        path: [{ kind: 'field', name: 'costs' }],
        before: [{ resource: 'sp', value: 100 }],
      },
      {
        kind: 'added',
        path: [{ kind: 'field', name: 'availability' }],
        after: { kind: 'targetStaggered', target: 'enemy' },
      },
    ]);
  });

  it('稳定 key 内容变化只对受影响步骤产生 changed', () => {
    const template = skill([], { eventHandlers: [handler('hit:a', 1), handler('hit:b', 1)] });
    const custom = skill([], { eventHandlers: [handler('hit:a', 2), handler('hit:b', 1)] });

    const items = diffSkillDefinition(template, custom);
    expect(items).toEqual<SkillDiffEntry[]>([
      {
        kind: 'changed',
        path: [
          ...handlersPath,
          { kind: 'key', key: 'hit:a' },
          { kind: 'field', name: 'scheduledSequences' },
          { kind: 'index', index: 0 },
          { kind: 'field', name: 'startFrame' },
        ],
        before: 1,
        after: 2,
      },
    ]);
  });

  it('稳定 key 重排产生 moved，模板原顺序优先', () => {
    const template = skill([], { eventHandlers: [handler('hit:a'), handler('hit:b')] });
    const custom = skill([], { eventHandlers: [handler('hit:b'), handler('hit:a')] });

    const items = diffSkillDefinition(template, custom);
    expect(items.map(item => item.kind)).toEqual(['moved', 'moved']);
    expect(items[0]).toMatchObject({
      kind: 'moved',
      path: [...handlersPath, { kind: 'key', key: 'hit:a' }],
      fromIndex: 0,
      toIndex: 1,
    });
    expect(items[1]).toMatchObject({
      kind: 'moved',
      path: [...handlersPath, { kind: 'key', key: 'hit:b' }],
      fromIndex: 1,
      toIndex: 0,
    });
  });

  it('稳定 key 增删报告完整元素', () => {
    const template = skill([], { eventHandlers: [handler('hit:a'), handler('hit:b')] });
    const custom = skill([], { eventHandlers: [handler('hit:a'), handler('hit:c', 2)] });

    const items = diffSkillDefinition(template, custom);
    expect(items.map(item => item.kind)).toEqual(['removed', 'added']);
    const removed = items[0];
    expect(removed).toMatchObject({
      kind: 'removed',
      path: [...handlersPath, { kind: 'key', key: 'hit:b' }],
    });
    if (removed?.kind !== 'removed') throw new Error('expected removed entry');
    expect(removed.before).toEqual(handler('hit:b'));
    const added = items[1];
    expect(added).toMatchObject({
      kind: 'added',
      path: [...handlersPath, { kind: 'key', key: 'hit:c' }],
    });
    if (added?.kind !== 'added') throw new Error('expected added entry');
    expect(added.after).toEqual(handler('hit:c', 2));
  });

  it('无 key 数组按位置匹配', () => {
    const sequence = (startFrame: number) => ({ startFrame, sequence: { $sequence: null } });
    const template = skill([], { scheduledSequences: [sequence(0), sequence(10)] });
    const custom = skill([], { scheduledSequences: [sequence(0)] });

    const items = diffSkillDefinition(template, custom);
    expect(items.map(item => pathString(item.path))).toEqual(['.scheduledSequences[1]']);
    expect(items[0]).toMatchObject({
      kind: 'removed',
      path: [
        { kind: 'field', name: 'scheduledSequences' },
        { kind: 'index', index: 1 },
      ],
      before: sequence(10),
    });
  });

  it('重复 key 数组退化为位置匹配', () => {
    const template = skill([], { eventHandlers: [handler('hit:a', 1), handler('hit:a')] });
    const custom = skill([], { eventHandlers: [handler('hit:a', 2), handler('hit:a')] });

    const items = diffSkillDefinition(template, custom);
    expect(items).toEqual<SkillDiffEntry[]>([
      {
        kind: 'changed',
        path: [
          ...handlersPath,
          { kind: 'index', index: 0 },
          { kind: 'field', name: 'scheduledSequences' },
          { kind: 'index', index: 0 },
          { kind: 'field', name: 'startFrame' },
        ],
        before: 1,
        after: 2,
      },
    ]);
  });

  it('before/after 不与输入共享可变引用', () => {
    const costs = [{ resource: 'sp' as const, value: 100 }];
    const template = skill([damageStep('hit:a', 0.5)], {
      costs,
    });
    const custom = skill([damageStep('hit:a', 0.5)]);

    const items = diffSkillDefinition(template, custom);
    const removed = items.find(item => item.kind === 'removed');
    expect(removed?.before).toEqual([{ resource: 'sp', value: 100 }]);
    // 修改输入后，已产出的差异值保持快照。
    costs[0]!.value = 999;
    expect(removed?.before).toEqual([{ resource: 'sp', value: 100 }]);
  });

  it('changed 的 after 为快照，不受输入后续修改影响', () => {
    const template = skill([], { eventHandlers: [handler('hit:a', 1)] });
    const scheduled: { startFrame: number; sequence: { $sequence: null } } = {
      startFrame: 2,
      sequence: { $sequence: null },
    };
    const mutableHandler: CombatEventHandlerDefinition = {
      key: 'hit:a',
      event: { kind: 'operatorHit' },
      scheduledSequences: [scheduled],
    };
    const custom = skill([], { eventHandlers: [mutableHandler] });

    const items = diffSkillDefinition(template, custom);
    const changed = items.find(item => item.kind === 'changed');
    expect(changed?.after).toBe(2);

    scheduled.startFrame = 9;
    expect(changed?.after).toBe(2);
  });

  it('相同 key 与顺序变化同时出现时保持模板原顺序', () => {
    const template = skill([], {
      eventHandlers: [handler('hit:a'), handler('hit:b'), handler('hit:c')],
    });
    const custom = skill([], {
      eventHandlers: [handler('hit:b'), handler('hit:a'), handler('hit:c')],
    });

    const items = diffSkillDefinition(template, custom);
    expect(items.map(item => item.kind)).toEqual(['moved', 'moved']);
    expect(items[0]).toMatchObject({ path: [...handlersPath, { kind: 'key', key: 'hit:a' }] });
    expect(items[1]).toMatchObject({ path: [...handlersPath, { kind: 'key', key: 'hit:b' }] });
  });
});
