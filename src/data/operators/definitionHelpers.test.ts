import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  CombatStepForKind,
  CombatStepDefinition,
} from '../../../packages/game-data-contract/src/actions';
import {
  basicAttackOfType,
  damageOfType,
  multiplyLevelValues,
  reactionActive,
  sequence,
  step,
  scaleDamageByStatusStacks,
  statusActive,
  statusStacksExactly,
  withActionBlackboardScope,
  withSkillBlackboard,
} from './definitionHelpers';

describe('operator definition helpers', () => {
  it('公共成员入口保留多kind的结构关联', () => {
    type BranchOrOnce = CombatStepForKind<'conditional' | 'once'>;
    expectTypeOf<BranchOrOnce>().not.toBeNever();
    expectTypeOf<BranchOrOnce>().toEqualTypeOf<
      Extract<CombatStepDefinition, { kind: 'conditional' | 'once' }>
    >();
    const once: BranchOrOnce = {
      kind: 'once',
      parameters: { scopeKey: 'once' },
      body: { steps: [] },
    };
    expect(once.body.steps).toEqual([]);
    const invalid: BranchOrOnce = {
      kind: 'once',
      parameters: { scopeKey: 'once' },
      // @ts-expect-error once不能以条件分支字段代替body。
      whenTrue: { steps: [] },
    };
    void invalid;
  });
  it('只接受不需要额外必填结构的步骤，并保留具体节点类型', () => {
    expectTypeOf<Parameters<typeof step>[0]>()
      .exclude<
        | 'scheduleProjectileFinishCallback'
        | 'conditional'
        | 'switch'
        | 'once'
        | 'repeatEachTick'
        | 'repeatByActionValue'
        | 'forEachContextTarget'
        | 'withActionBlackboardScope'
      >()
      .toEqualTypeOf<Parameters<typeof step>[0]>();
    const node = step('finishTimeline', {}, 'finish');
    expectTypeOf(node.kind).toEqualTypeOf<'finishTimeline'>();
    expect(node).toEqual({ kind: 'finishTimeline', parameters: {}, key: 'finish' });
  });

  it('附加初始黑板时不修改原技能定义', () => {
    const skill = basicAttackOfType('electric')('basicAttack1', 10, 5, 0.2);
    const wrapped = withSkillBlackboard(skill, { attackScale: [0.2, 0.3] });

    expect(skill.blackboard).toBeUndefined();
    expect(wrapped.blackboard).toEqual({ attackScale: [0.2, 0.3] });
    expect(wrapped.scheduledSequences).toBe(skill.scheduledSequences);
  });

  it('keeps the explicitly bound damage type on every basic-attack hit', () => {
    const natureBasicAttack = basicAttackOfType('nature');
    const segment = natureBasicAttack('basicAttack1', 20, [5, 8], [0.1, 0.2]);

    expect(segment.scheduledSequences.map(item => item.sequence.steps[0])).toEqual([
      {
        kind: 'dealDamage',
        key: 'basicAttack1.hit.1',
        parameters: {
          damageType: 'nature',
          attackScale: [0.1, 0.2],
          tags: ['normalAttack'],
        },
      },
      {
        kind: 'dealDamage',
        key: 'basicAttack1.hit.2',
        parameters: {
          damageType: 'nature',
          attackScale: [0.1, 0.2],
          tags: ['normalAttack'],
        },
      },
    ]);
  });

  it('adds final-hit identity and SP recovery only to the last hit', () => {
    const segment = basicAttackOfType('electric')('basicAttack4', 40, [20, 24], 0.5, {
      final: true,
      stagger: 15,
      spRecovery: 17,
    });

    expect(segment.scheduledSequences.map(item => item.startFrame)).toEqual([20, 24]);
    expect(segment.scheduledSequences[0]?.sequence.steps).toHaveLength(1);
    expect(segment.scheduledSequences[1]?.sequence.steps).toEqual([
      {
        kind: 'dealDamage',
        key: 'basicAttack4.hit.2',
        parameters: {
          damageType: 'electric',
          attackScale: 0.5,
          tags: ['normalAttack', 'normalAttackLastCombo'],
          stagger: 15,
        },
      },
      {
        kind: 'changeResource',
        parameters: {
          resource: 'sp',
          amount: 17,
          recipient: 'team',
          spGainSource: 'normalAttack',
        },
      },
    ]);
  });

  it('builds status conditions without emitting absent optional fields', () => {
    expect(statusActive('enhancement')).toEqual({
      kind: 'statusActive',
      statusKey: 'enhancement',
      target: 'caster',
    });
    expect(statusActive('mark', 'enemy', 2)).toEqual({
      kind: 'statusActive',
      statusKey: 'mark',
      target: 'enemy',
      minimumStacks: 2,
    });
  });

  it('expresses exact stacks as a lower bound plus the negated next bound', () => {
    expect(statusStacksExactly('sword', 3)).toEqual({
      kind: 'all',
      conditions: [
        {
          kind: 'statusActive',
          statusKey: 'sword',
          target: 'caster',
          minimumStacks: 3,
        },
        {
          kind: 'not',
          condition: {
            kind: 'statusActive',
            statusKey: 'sword',
            target: 'caster',
            minimumStacks: 4,
          },
        },
      ],
    });
  });

  it('keeps reaction level optional', () => {
    expect(reactionActive('electrification')).toEqual({
      kind: 'elementalReactionActive',
      reaction: 'electrification',
    });
    expect(reactionActive('electrification', 2)).toEqual({
      kind: 'elementalReactionActive',
      reaction: 'electrification',
      minimumLevel: 2,
    });
  });

  it('scales scalar and leveled values without mutating the source array', () => {
    const values = [0.2, 0.4] as const;
    const scaled = multiplyLevelValues(values, 6);

    expect(multiplyLevelValues(0.2, 6)).toBeCloseTo(1.2);
    expect(scaled).toHaveLength(2);
    expect(scaled[0]).toBeCloseTo(1.2);
    expect(scaled[1]).toBeCloseTo(2.4);
    expect(values).toEqual([0.2, 0.4]);
  });

  it('adds status-stack scaling without discarding base damage semantics', () => {
    const damage = damageOfType('electric')(0.2, ['normalSkill'], { stagger: 15 });

    expect(scaleDamageByStatusStacks(damage, 'consumedLevel', 0.03)).toEqual({
      damageType: 'electric',
      attackScale: 0.2,
      tags: ['normalSkill'],
      stagger: 15,
      attackScalePerStatusStack: {
        statusKey: 'consumedLevel',
        target: 'caster',
        coefficient: 0.03,
      },
    });
    expect(damage).not.toHaveProperty('attackScalePerStatusStack');
  });
  it('flattens nested generated sequences without changing step order', () => {
    const first = step('modifyActionValue', {
      key: 'value',
      operation: 'assign',
      value: { kind: 'constant', value: 1 },
    });
    const second = step('modifyActionValue', {
      key: 'value',
      operation: 'add',
      value: { kind: 'constant', value: 2 },
    });

    expect(sequence(sequence(first), second)).toEqual({ steps: [first, second] });
  });

  it('preserves generated action-blackboard lifetime and callback flow options', () => {
    expect(
      withActionBlackboardScope('projectile:child', { scale: 1 }, true, sequence(), undefined, {
        lifetime: 'execution',
        alwaysNext: true,
      }),
    ).toEqual({
      kind: 'withActionBlackboardScope',
      parameters: {
        scopeKey: 'projectile:child',
        initialValues: { scale: 1 },
        inheritParent: true,
        lifetime: 'execution',
        alwaysNext: true,
      },
      body: { steps: [] },
    });
  });
});
