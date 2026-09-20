import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import { describe, expect, it } from 'vitest';

import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { ElementalReactionContainer } from './elementalReactionState';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { ElementalReactionOperationExecutor } from './elementalReactionOperationExecutor';
import { ActionBlackboard } from '../actions/actionBlackboard';

function createExecutor() {
  const clock = new CombatClock();
  const receipt = new CombatReceiptCollector();
  const container = new ElementalReactionContainer();
  const delegated: string[] = [];
  const delegate: CombatOperationExecutor = {
    execute: step => {
      delegated.push(`execute:${step.kind}`);
      return true;
    },
    evaluate: condition => {
      delegated.push(`evaluate:${condition.kind}`);
      return false;
    },
  };
  const executor = new ElementalReactionOperationExecutor({
    sourceOperatorId: 'perlica',
    targetId: 'enemy',
    clock,
    receipt,
    container,
    delegate,
  });
  return { clock, receipt, container, executor, delegated };
}

describe('ElementalReactionOperationExecutor', () => {
  it('按步骤位置施加反应并记录回执', () => {
    const { clock, receipt, executor, container } = createExecutor();
    for (let frame = 0; frame < 24; frame += 1) clock.advanceFrame();
    const step: ResolvedCombatStepForKind<'applyElementalReaction'> = {
      kind: 'applyElementalReaction',
      parameters: {
        reaction: 'electrification',
        target: 'enemy',
        durationSeconds: 5,
        effectiveness: 1,
      },
    };

    expect(executor.execute(step)).toBe(true);
    expect(container.isActive('electrification', 1, clock.time)).toBe(true);
    expect(receipt.entries.at(-1)).toMatchObject({
      event: 'ElementalReactionApplied',
      frame: 24,
      sourceId: 'perlica',
      targetId: 'enemy',
      data: { reaction: 'electrification', level: 1, previousLevel: 0 },
    });
  });

  it('从动作黑板读取反应寿命并在运行时应用倍率', () => {
    const { receipt, executor, container } = createExecutor();
    const step: ResolvedCombatStepForKind<'applyElementalReaction'> = {
      kind: 'applyElementalReaction',
      parameters: {
        reaction: 'electrification',
        target: 'enemy',
        durationSeconds: { kind: 'blackboard', key: 'duration' },
        durationMultiplier: 1.5,
        effectiveness: 1,
      },
    };

    expect(executor.execute(step, { blackboard: new ActionBlackboard({ duration: 4 }) })).toBe(
      true,
    );
    expect(container.isActive('electrification', 1, 5.99)).toBe(true);
    expect(container.isActive('electrification', 1, 6.01)).toBe(false);
    expect(receipt.entries.at(-1)).toMatchObject({
      event: 'ElementalReactionApplied',
      data: { durationSeconds: 6 },
    });
  });

  it('消费反应并记录回执，其余步骤交给后继执行器', () => {
    const { receipt, executor, container, delegated } = createExecutor();
    container.apply({
      reaction: 'electrification',
      durationSeconds: 5,
      sourceId: 'perlica',
      time: 0,
    });
    const consume: ResolvedCombatStepForKind<'consumeElementalReaction'> = {
      kind: 'consumeElementalReaction',
      parameters: { reaction: 'electrification', target: 'enemy' },
    };

    expect(executor.execute(consume)).toBe(true);
    expect(receipt.entries.at(-1)).toMatchObject({
      event: 'ElementalReactionConsumed',
      data: { reaction: 'electrification', level: 1, consumed: true },
    });
    expect(container.isActive('electrification', undefined, 0.5)).toBe(false);

    const damage = {
      kind: 'dealDamage' as const,
      parameters: { damageType: 'electric' as const, attackScale: 1, tags: [] },
    };
    expect(executor.execute(damage)).toBe(true);
    expect(delegated).toEqual(['execute:dealDamage']);
  });

  it('求值反应条件，其余条件交给后继执行器', () => {
    const { executor, container, delegated } = createExecutor();
    container.apply({
      reaction: 'electrification',
      durationSeconds: 5,
      sourceId: 'perlica',
      time: 0,
    });

    expect(
      executor.evaluate({
        kind: 'elementalReactionActive',
        reaction: 'electrification',
        minimumLevel: 1,
      }),
    ).toBe(true);
    expect(executor.evaluate({ kind: 'elementalReactionActive', reaction: 'corrosion' })).toBe(
      false,
    );
    expect(executor.evaluate({ kind: 'combatActive' })).toBe(false);
    expect(delegated).toEqual(['evaluate:combatActive']);
  });
});
