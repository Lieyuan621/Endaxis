import { describe, expect, it } from 'vitest';
import {
  diffSkillDefinition,
  type SkillDiffEntry,
  type SkillDiffPathSegment,
} from './diffSkillDefinition';
import type { CombatStepDefinition, SkillDefinition } from './operatorDefinition';

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
  return {
    key: 'skill',
    timelineBlockFrames: 30,
    scheduledSequences: [{ startFrame: 0, sequence: { steps } }],
    ...overrides,
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

const stepsPath: readonly SkillDiffPathSegment[] = [
  { kind: 'field', name: 'scheduledSequences' },
  { kind: 'index', index: 0 },
  { kind: 'field', name: 'sequence' },
  { kind: 'field', name: 'steps' },
];

describe('diffSkillDefinition', () => {
  it('相同输入返回空数组', () => {
    const template = skill([damageStep('hit:1', 0.5)]);
    const custom = structuredClone(template);

    expect(diffSkillDefinition(template, custom)).toEqual([]);
  });

  it('标量变化产生 changed（无 key 时按位置匹配）', () => {
    const template = skill([damageStep(undefined, 0.5)]);
    const custom = skill([damageStep(undefined, 0.8)]);

    const items = diffSkillDefinition(template, custom);
    expect(items).toEqual<SkillDiffEntry[]>([
      {
        kind: 'changed',
        path: [
          ...stepsPath,
          { kind: 'index', index: 0 },
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
    const template = skill([damageStep('hit:a', 0.5), damageStep('hit:b', 0.5)]);
    const custom = skill([damageStep('hit:a', 0.6), damageStep('hit:b', 0.5)]);

    const items = diffSkillDefinition(template, custom);
    expect(items).toEqual<SkillDiffEntry[]>([
      {
        kind: 'changed',
        path: [
          ...stepsPath,
          { kind: 'key', key: 'hit:a' },
          { kind: 'field', name: 'parameters' },
          { kind: 'field', name: 'attackScale' },
        ],
        before: 0.5,
        after: 0.6,
      },
    ]);
  });

  it('稳定 key 重排产生 moved，模板原顺序优先', () => {
    const template = skill([damageStep('hit:a'), damageStep('hit:b')]);
    const custom = skill([damageStep('hit:b'), damageStep('hit:a')]);

    const items = diffSkillDefinition(template, custom);
    expect(items.map(item => item.kind)).toEqual(['moved', 'moved']);
    expect(items[0]).toMatchObject({
      kind: 'moved',
      path: [...stepsPath, { kind: 'key', key: 'hit:a' }],
      fromIndex: 0,
      toIndex: 1,
    });
    expect(items[1]).toMatchObject({
      kind: 'moved',
      path: [...stepsPath, { kind: 'key', key: 'hit:b' }],
      fromIndex: 1,
      toIndex: 0,
    });
  });

  it('稳定 key 增删报告完整元素', () => {
    const template = skill([damageStep('hit:a'), damageStep('hit:b')]);
    const custom = skill([damageStep('hit:a'), damageStep('hit:c', 2)]);

    const items = diffSkillDefinition(template, custom);
    expect(items.map(item => item.kind)).toEqual(['removed', 'added']);
    const removed = items[0];
    expect(removed).toMatchObject({
      kind: 'removed',
      path: [...stepsPath, { kind: 'key', key: 'hit:b' }],
    });
    if (removed?.kind !== 'removed') throw new Error('expected removed entry');
    expect(removed.before).toEqual({
      kind: 'dealDamage',
      key: 'hit:b',
      parameters: { damageType: 'physical', attackScale: 1, tags: ['normalAttack'] },
    });
    const added = items[1];
    expect(added).toMatchObject({
      kind: 'added',
      path: [...stepsPath, { kind: 'key', key: 'hit:c' }],
    });
    if (added?.kind !== 'added') throw new Error('expected added entry');
    expect(added.after).toEqual({
      kind: 'dealDamage',
      key: 'hit:c',
      parameters: { damageType: 'physical', attackScale: 2, tags: ['normalAttack'] },
    });
  });

  it('无 key 数组按位置匹配', () => {
    const template = skill([damageStep(undefined, 0.5), damageStep(undefined, 0.5)]);
    const custom = skill([damageStep(undefined, 0.5)]);

    const items = diffSkillDefinition(template, custom);
    expect(items.map(item => pathString(item.path))).toEqual([
      '.scheduledSequences[0].sequence.steps[1]',
    ]);
    expect(items[0]).toMatchObject({
      kind: 'removed',
      path: [...stepsPath, { kind: 'index', index: 1 }],
      before: {
        kind: 'dealDamage',
        parameters: { damageType: 'physical', attackScale: 0.5, tags: ['normalAttack'] },
      },
    });
  });

  it('混合 key 数组退化为位置匹配，不猜相似对象', () => {
    const template = skill([damageStep('hit:a'), damageStep(undefined)]);
    const custom = skill([damageStep(undefined), damageStep('hit:a')]);

    const items = diffSkillDefinition(template, custom);
    // 两边不能按 key 对齐，只能按位置：位置 0 的 key 被删除，位置 1 新增 key。
    expect(items.map(item => pathString(item.path))).toEqual([
      '.scheduledSequences[0].sequence.steps[0].key',
      '.scheduledSequences[0].sequence.steps[1].key',
    ]);
    expect(items[0]).toMatchObject({
      kind: 'removed',
      path: [...stepsPath, { kind: 'index', index: 0 }, { kind: 'field', name: 'key' }],
      before: 'hit:a',
    });
    expect(items[1]).toMatchObject({
      kind: 'added',
      path: [...stepsPath, { kind: 'index', index: 1 }, { kind: 'field', name: 'key' }],
      after: 'hit:a',
    });
  });

  it('重复 key 数组退化为位置匹配', () => {
    const template = skill([damageStep('hit:a', 0.5), damageStep('hit:a')]);
    const custom = skill([damageStep('hit:a', 0.6), damageStep('hit:a')]);

    const items = diffSkillDefinition(template, custom);
    expect(items).toEqual<SkillDiffEntry[]>([
      {
        kind: 'changed',
        path: [
          ...stepsPath,
          { kind: 'index', index: 0 },
          { kind: 'field', name: 'parameters' },
          { kind: 'field', name: 'attackScale' },
        ],
        before: 0.5,
        after: 0.6,
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
    const template = skill([damageStep('hit:a', 0.5)]);
    const mutableStep = {
      key: 'hit:a',
      kind: 'dealDamage' as const,
      parameters: {
        damageType: 'physical' as const,
        attackScale: 0.8,
        tags: ['normalAttack'] as const,
      },
    };
    const custom = skill([mutableStep]);

    const items = diffSkillDefinition(template, custom);
    const changed = items.find(item => item.kind === 'changed');
    expect(changed?.after).toBe(0.8);

    mutableStep.parameters.attackScale = 9;
    expect(changed?.after).toBe(0.8);
  });

  it('相同 key 与顺序变化同时出现时保持模板原顺序', () => {
    const template = skill([damageStep('hit:a'), damageStep('hit:b'), damageStep('hit:c')]);
    const custom = skill([damageStep('hit:b'), damageStep('hit:a'), damageStep('hit:c')]);

    const items = diffSkillDefinition(template, custom);
    expect(items.map(item => item.kind)).toEqual(['moved', 'moved']);
    expect(items[0]).toMatchObject({ path: [...stepsPath, { kind: 'key', key: 'hit:a' }] });
    expect(items[1]).toMatchObject({ path: [...stepsPath, { kind: 'key', key: 'hit:b' }] });
  });
});
