import { describe, expect, it } from 'vitest';
import { ActionBlackboard, resolveActionValueOperand } from './actionBlackboard';

describe('ActionBlackboard', () => {
  it('applies runtime values over definition defaults with typed reads', () => {
    const blackboard = new ActionBlackboard({ count: 1, label: 'default', empty: null });
    blackboard.assign({ count: 3, label: 5 });

    expect(blackboard.getNumber('count')).toBe(3);
    expect(blackboard.getString('label')).toBeUndefined();
    expect(blackboard.getNumber('missing')).toBeUndefined();
    expect(blackboard.snapshot()).toEqual({ count: 3, label: 5, empty: null });
  });

  it('uses an explicit call-site fallback without weakening strict operands', () => {
    const blackboard = new ActionBlackboard();

    expect(
      resolveActionValueOperand(
        { kind: 'blackboard', key: 'EntityBB_counter', fallback: 0 },
        blackboard,
      ),
    ).toBe(0);
    expect(() =>
      resolveActionValueOperand({ kind: 'blackboard', key: 'missing' }, blackboard),
    ).toThrow("action blackboard value 'missing' is missing");
  });

  it('supports dynamic assignment and exact snapshot restoration', () => {
    const blackboard = new ActionBlackboard({ count: 1 });
    const snapshot = blackboard.snapshot();
    expect(blackboard.assignDynamic('count', 4)).toBe(true);
    blackboard.restore(snapshot);

    expect(blackboard.snapshot()).toEqual({ count: 1 });
  });

  it('only reports a dynamic numeric assignment when it exceeds the native epsilon', () => {
    const blackboard = new ActionBlackboard({ count: 4 });

    expect(blackboard.assignDynamic('count', 4.000001)).toBe(false);
    expect(blackboard.getNumber('count')).toBe(4);
    expect(blackboard.assignDynamic('count', 4.00002)).toBe(true);
    expect(blackboard.getNumber('count')).toBe(4.00002);
    expect(blackboard.assignDynamic('missing', 0)).toBe(true);
  });

  it('shares entity values across skill blackboards without mixing skill snapshots', () => {
    const entityBlackboard = new ActionBlackboard({ EntityBB_SwordNum: 2 });
    const firstSkill = new ActionBlackboard(
      { localCount: 1, EntityBB_SwordNum: 8 },
      entityBlackboard,
    );
    const secondSkill = new ActionBlackboard(undefined, entityBlackboard);

    expect(firstSkill.getNumber('EntityBB_SwordNum')).toBe(8);
    expect(secondSkill.getNumber('EntityBB_SwordNum')).toBe(2);
    expect(firstSkill.assignDynamic('EntityBB_SwordNum', 3)).toBe(true);
    expect(secondSkill.getNumber('EntityBB_SwordNum')).toBe(3);

    firstSkill.restore({ localCount: 4 });
    expect(firstSkill.snapshot()).toEqual({ localCount: 4 });
    expect(firstSkill.getNumber('EntityBB_SwordNum')).toBe(3);
    expect(secondSkill.getNumber('localCount')).toBeUndefined();
  });

  it('creates child SkillData scopes without exposing child direct values to the parent', () => {
    const entity = new ActionBlackboard({ EntityBB_shared: 4 });
    const parent = new ActionBlackboard({ inherited: 7, local: 9 }, entity);
    const child = parent.createLocalScope({ local: 1, childOnly: 2 }, true);

    expect(child.snapshot()).toEqual({ local: 9, childOnly: 2, inherited: 7 });
    child.assignDynamic('childOnly', 5);
    child.assignDynamic('EntityBB_shared', 6);

    expect(parent.getNumber('childOnly')).toBeUndefined();
    expect(parent.getNumber('EntityBB_shared')).toBe(6);
  });

  it('creates an independent entity layer for a projectile template scope', () => {
    const operatorEntity = new ActionBlackboard({ EntityBB_shared: 4 });
    const parent = new ActionBlackboard({ inherited: 7 }, operatorEntity);
    const firstProjectile = parent.createLocalScope({ local: 1 }, true, {
      EntityBB_projectileHitCount: 0,
    });
    const secondProjectile = parent.createLocalScope({ local: 1 }, true, {
      EntityBB_projectileHitCount: 0,
    });

    firstProjectile.assignDynamic('EntityBB_projectileHitCount', 1);

    expect(firstProjectile.getNumber('EntityBB_projectileHitCount')).toBe(1);
    expect(secondProjectile.getNumber('EntityBB_projectileHitCount')).toBe(0);
    expect(parent.getNumber('EntityBB_projectileHitCount')).toBeUndefined();
    expect(firstProjectile.getNumber('EntityBB_shared')).toBeUndefined();
    expect(parent.getNumber('EntityBB_shared')).toBe(4);
  });
});
