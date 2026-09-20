import { describe, expect, it } from 'vitest';
import { CombatStatusContainer, type CombatStatusDefinition } from './combatStatuses';

const MARK: CombatStatusDefinition = {
  statusKey: 'mark',
  applyStacks: 1,
  maxStacks: 3,
  durationFrames: 3,
  durationStacking: 'refresh',
  consumeStacks: 1,
};

describe('CombatStatusContainer', () => {
  it('恢复剩余寿命、层数和首次来源，另一分支的消费不会污染副本', () => {
    const original = new CombatStatusContainer('operator', [MARK]);
    original.apply({ statusKey: 'mark', sourceId: 'first', skillId: 'skill1', stacks: 2 });
    original.advanceFrame();
    const saved = structuredClone(original.runtimeState);
    original.consume({ statusKey: 'mark', sourceId: 'consumer', skillId: 'skill2', stacks: 2 });
    const restored = new CombatStatusContainer('operator', [MARK], structuredClone(saved));
    expect(restored.getSnapshot('mark')).toEqual({ stacks: 2, remainingFrames: 2 });
    expect(restored.advanceFrame()).toEqual([]);
    expect(restored.advanceFrame()[0]).toMatchObject({
      reason: 'expired',
      sourceId: 'first',
      skillId: 'skill1',
    });
    expect(saved.statuses.get('mark')?.remainingFrames).toBe(2);
    expect(original.getStacks('mark')).toBe(0);
  });

  it('从固定定义模板绑定复制状态，不施加或推进状态', () => {
    const template = new CombatStatusContainer('operator', [MARK]);
    template.apply({ statusKey: 'mark', sourceId: 'first', skillId: 'skill1', stacks: 2 });
    template.advanceFrame();
    const saved = structuredClone(template.runtimeState);

    const restored = template.bindRuntimeState(saved);

    expect(restored).not.toBe(template);
    expect(restored.runtimeState).toBe(saved);
    expect(restored.getSnapshot('mark')).toEqual({ stacks: 2, remainingFrames: 2 });
    restored.apply({ statusKey: 'mark', sourceId: 'second', skillId: 'skill2' });
    expect(saved.statuses.get('mark')?.stacks).toBe(3);
    expect(template.getSnapshot('mark')).toEqual({ stacks: 2, remainingFrames: 2 });
  });

  it('uses explicit definitions, adds layers and caps them', () => {
    const statuses = new CombatStatusContainer('operator', [MARK]);
    statuses.apply({ statusKey: 'mark', sourceId: 'first', skillId: 'skill1' });
    const reapplied = statuses.apply({
      statusKey: 'mark',
      sourceId: 'second',
      skillId: 'skill2',
      stacks: 5,
      durationFrames: 5,
    });

    expect(reapplied).toMatchObject({
      sourceId: 'second',
      skillId: 'skill2',
      previous: { stacks: 1, remainingFrames: 3 },
      current: { stacks: 3, remainingFrames: 5 },
    });
    statuses.advanceFrame();
    statuses.advanceFrame();
    statuses.advanceFrame();
    statuses.advanceFrame();
    expect(statuses.advanceFrame()[0]).toMatchObject({ sourceId: 'first', skillId: 'skill1' });
  });

  it('implements the three evidence-backed duration stacking rules', () => {
    const remainingAfterReapply = (
      durationStacking: CombatStatusDefinition['durationStacking'],
    ) => {
      const statuses = new CombatStatusContainer('operator', [{ ...MARK, durationStacking }]);
      statuses.apply({ statusKey: 'mark', sourceId: 'operator', skillId: 'skill' });
      statuses.advanceFrame();
      statuses.apply({
        statusKey: 'mark',
        sourceId: 'operator',
        skillId: 'skill',
        durationFrames: 2,
      });
      return statuses.getSnapshot('mark').remainingFrames;
    };

    expect(remainingAfterReapply('refresh')).toBe(2);
    expect(remainingAfterReapply('extend')).toBe(4);
    expect(remainingAfterReapply('overwrite')).toBe(2);
  });

  it('consumes explicit layers or the definition-owned all-layers policy', () => {
    const statuses = new CombatStatusContainer('operator', [
      MARK,
      { ...MARK, statusKey: 'all', consumeStacks: 'all' },
    ]);
    statuses.apply({ statusKey: 'mark', sourceId: 'operator', skillId: 'skill', stacks: 3 });
    statuses.apply({ statusKey: 'all', sourceId: 'operator', skillId: 'skill', stacks: 3 });

    const consume = (statusKey: string, stacks?: number) =>
      statuses.consume({
        statusKey,
        sourceId: 'operator',
        skillId: 'consumer',
        ...(stacks === undefined ? {} : { stacks }),
      });
    expect(consume('mark').current.stacks).toBe(2);
    expect(consume('mark', 2).current.stacks).toBe(0);
    expect(consume('all').current.stacks).toBe(0);
  });

  it('expires finite statuses in insertion order while infinite statuses remain', () => {
    const statuses = new CombatStatusContainer('operator', [
      { ...MARK, statusKey: 'first', durationFrames: 1 },
      { ...MARK, statusKey: 'infinite', durationFrames: null },
      { ...MARK, statusKey: 'second', durationFrames: 1 },
    ]);
    statuses.apply({ statusKey: 'first', sourceId: 'one', skillId: 'skill1' });
    statuses.apply({ statusKey: 'infinite', sourceId: 'two', skillId: 'skill2' });
    statuses.apply({ statusKey: 'second', sourceId: 'three', skillId: 'skill3' });

    expect(statuses.advanceFrame().map(change => change.statusKey)).toEqual(['first', 'second']);
    expect(statuses.getStacks('infinite')).toBe(1);
  });

  it('rejects unknown identities and invalid explicit definitions', () => {
    const statuses = new CombatStatusContainer('operator', [MARK]);
    expect(() =>
      statuses.apply({ statusKey: 'unknown', sourceId: 'operator', skillId: 'skill' }),
    ).toThrow("unknown combat status 'unknown'");
    expect(() => new CombatStatusContainer('operator', [{ ...MARK, applyStacks: 0 }])).toThrow(
      "status 'mark' default apply stacks must be a positive safe integer",
    );
    expect(
      () =>
        new CombatStatusContainer('operator', [
          { ...MARK, durationStacking: 'unknown' as CombatStatusDefinition['durationStacking'] },
        ]),
    ).toThrow("status 'mark' has unknown duration stacking 'unknown'");
  });
});
