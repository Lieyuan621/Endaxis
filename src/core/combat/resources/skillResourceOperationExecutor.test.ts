import { numberInput } from '../../../test/compiledGraphInputs';
import { describe, expect, it } from 'vitest';

import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatClock } from '../time/combatClock';
import { CombatResources } from './combatResources';
import { SkillResourceOperationExecutor } from './skillResourceOperationExecutor';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { createSharedSpGainModifier } from './sharedSpGainModifiers';
import { createStateTestSession } from '../../../test/stateTestSession';

describe('SkillResourceOperationExecutor', () => {
  it('主控限制只跳过技力获取，切换主控后生效，且不限制终结技能量', () => {
    const resources = new CombatResources({
      sp: 0,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
      squad: [
        {
          operatorId: 'caster',
          ultimateEnergy: 0,
          maxUltimateEnergy: 100,
          ultimateEnergyGainMultiplier: 1,
          allowedUltimateEnergyRecoveryTags: null,
        },
      ],
    });
    const context = { blackboard: new ActionBlackboard() };
    let controlled = false;
    const gainedBy: string[] = [];
    let targetCount = 2;
    const receipt = new CombatReceiptCollector();
    const executor = new SkillResourceOperationExecutor({
      sourceOperatorId: 'caster',
      sourceActionId: 'skill',
      clock: new CombatClock(),
      resources,
      receipt,
      getNonReturnedSpCost: () => 0,
      finisherSpRecovery: 0,
      onSpGained: event => gainedBy.push(event.sourceId),
      delegate: {
        execute: () => false,
        evaluate: condition => condition.kind === 'checkMainCharacter' && controlled,
        queryTargets: () =>
          Array.from({ length: targetCount }, () => ({
            kind: 'operator' as const,
            operatorId: 'caster',
          })),
      },
    });
    const sp = {
      kind: 'changeResource' as const,
      parameters: {
        resource: 'sp' as const,
        source: { kind: 'fixed' as const, target: 'caster' as const },
        targets: { kind: 'fixed' as const, target: 'caster' as const },
        amount: 10,
        onlyMainOperator: true,
      },
    };
    expect(executor.execute(sp, context)).toBe(true);
    expect(receipt.entries).toHaveLength(0);
    executor.execute(
      {
        kind: 'changeResource',
        parameters: {
          resource: 'ultimateEnergy',
          source: { kind: 'fixed', target: 'caster' },
          targets: { kind: 'fixed', target: 'caster' },
          amount: 10,
          onlyMainOperator: true,
        },
      },
      context,
    );
    expect(resources.getUltimateEnergy('caster')).toBe(10);
    controlled = true;
    executor.execute(sp, context);
    expect(receipt.entries).toHaveLength(2);
    const fromOther = {
      ...sp,
      parameters: {
        ...sp.parameters,
        onlyMainOperator: false,
        source: { kind: 'inputTarget' as const },
        targets: { kind: 'characterTeam' as const, excludeOwner: false },
      },
    };
    expect(executor.execute(fromOther, context)).toBe(false);
    const sourceContext = {
      ...context,
      actionInputTarget: { kind: 'operator' as const, operatorId: 'other' },
    };
    executor.execute(fromOther, sourceContext);
    expect(resources.sp).toBe(30);
    expect(gainedBy).toEqual(['caster', 'other', 'other']);
    const mechanism = {
      ...fromOther,
      parameters: {
        ...fromOther.parameters,
        source: { kind: 'godEntity' as const },
        targets: { kind: 'fixed' as const, target: 'caster' as const },
      },
    };
    executor.execute(mechanism, context);
    expect(resources.sp).toBe(40);
    expect(gainedBy.at(-1)).toBe('god-entity');
    executor.execute(
      { ...mechanism, parameters: { ...mechanism.parameters, onlyMainOperator: true } },
      context,
    );
    expect(resources.sp).toBe(40);

    targetCount = 0;
    expect(executor.execute(fromOther, sourceContext)).toBe(true);
    expect(resources.sp).toBe(40);
  });

  it('installs and ends an action-owned ultimate recovery restriction', () => {
    const resources = new CombatResources({
      sp: 0,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
      squad: [
        {
          operatorId: 'arcane',
          ultimateEnergy: 20,
          maxUltimateEnergy: 100,
          ultimateEnergyGainMultiplier: 1,
          allowedUltimateEnergyRecoveryTags: null,
        },
      ],
    });
    const receipt = new CombatReceiptCollector();
    const operations = new SkillResourceOperationExecutor({
      sourceOperatorId: 'arcane',
      sourceActionId: 'ultimate',
      clock: new CombatClock(),
      resources,
      receipt,
      getNonReturnedSpCost: () => 0,
      finisherSpRecovery: 0,
      delegate: { execute: () => false, evaluate: () => false },
    });
    const step = {
      kind: 'restrictUltimateEnergyRecovery' as const,
      parameters: {
        target: 'caster' as const,
        allowedRecoveryTags: ['Test/Allowed'],
        clearUltimateEnergyOnEnd: true,
      },
    };
    expect(operations.execute(step)).toBe(true);
    expect(resources.changeUltimateEnergy('arcane', 5).applied).toBe(false);
    expect(
      resources.changeUltimateEnergy('arcane', 5, { recoveryTag: 'Test/Allowed' }).applied,
    ).toBe(true);
    operations.end(step);
    expect(resources.getUltimateEnergy('arcane')).toBe(0);
    expect(receipt.entries).toHaveLength(1);
    expect(resources.changeUltimateEnergy('arcane', 5).applied).toBe(true);
    operations.end(step);
    expect(resources.getUltimateEnergy('arcane')).toBe(5);
    expect(receipt.entries).toHaveLength(1);
  });

  it('恢复动作宿主后只撤销恢复分支的终结技能量限制', () => {
    const original = new CombatResources({
      sp: 0,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
      squad: [
        {
          operatorId: 'arcane',
          ultimateEnergy: 20,
          maxUltimateEnergy: 100,
          ultimateEnergyGainMultiplier: 1,
          allowedUltimateEnergyRecoveryTags: null,
        },
      ],
    });
    const baseDependencies = {
      sourceOperatorId: 'arcane',
      sourceActionId: 'ultimate',
      clock: new CombatClock(),
      resources: original,
      receipt: new CombatReceiptCollector(),
      getNonReturnedSpCost: () => 0,
      finisherSpRecovery: 0,
      delegate: { execute: () => false, evaluate: () => false },
    };
    const originalExecutor = new SkillResourceOperationExecutor(baseDependencies);
    const step = {
      kind: 'restrictUltimateEnergyRecovery' as const,
      parameters: {
        target: 'caster' as const,
        allowedRecoveryTags: ['Test/Allowed'],
        clearUltimateEnergyOnEnd: false,
      },
    };
    originalExecutor.execute(step);
    const copied = createStateTestSession(
      { resources: original.runtimeState, actions: originalExecutor.runtimeState },
      () => undefined,
    ).read();
    const restored = new CombatResources(original.snapshot(), {}, copied.resources);
    const restoredExecutor = new SkillResourceOperationExecutor(
      { ...baseDependencies, resources: restored, receipt: new CombatReceiptCollector() },
      { state: copied.actions, programs: originalExecutor.programs },
    );

    restoredExecutor.end(step);

    expect(restored.changeUltimateEnergy('arcane', 1).applied).toBe(true);
    expect(original.changeUltimateEnergy('arcane', 1).applied).toBe(false);
  });

  it('uses the enemy finisher recovery and power-attack gain efficiency', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const resources = new CombatResources({
      sp: 20,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
      squad: [
        {
          operatorId: 'perlica',
          ultimateEnergy: 0,
          maxUltimateEnergy: 100,
          ultimateEnergyGainMultiplier: 1,
          allowedUltimateEnergyRecoveryTags: null,
        },
      ],
    });
    resources.sharedSpGainModifiers.add(
      createSharedSpGainModifier('powerAttackEfficiency', 'multiplier', 0.5, false),
    );
    const gains: unknown[] = [];
    const operations = new SkillResourceOperationExecutor({
      sourceOperatorId: 'perlica',
      sourceActionId: 'finisher',
      clock,
      resources,
      receipt,
      getNonReturnedSpCost: () => 0,
      finisherSpRecovery: 80,
      onSpGained: event => gains.push(event),
      delegate: { execute: () => false, evaluate: () => false },
    });

    expect(
      operations.execute({
        kind: 'gainFinisherSp',
        parameters: { factor: 0.5, recipient: 'team' },
      }),
    ).toBe(true);

    expect(resources.sp).toBe(80);
    expect(receipt.entries[0]).toMatchObject({
      event: 'SpChanged',
      sourceId: 'perlica',
      data: {
        skillId: 'finisher',
        recipient: 'team',
        baseValue: 40,
        requestedValue: 60,
        actualValue: 60,
        previousValue: 20,
        currentValue: 80,
        gainKind: 'gain',
        spGainSource: 'powerAttack',
      },
    });
    expect(gains).toEqual([
      {
        sourceId: 'perlica',
        source: 'powerAttack',
        gainKind: 'gain',
        requestedAmount: 60,
        amount: 60,
      },
    ]);
  });

  it('applies caster ultimate-energy gain through the native gain multiplier and cap', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const resources = new CombatResources({
      sp: 0,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
      squad: [
        {
          operatorId: 'perlica',
          ultimateEnergy: 90,
          maxUltimateEnergy: 100,
          ultimateEnergyGainMultiplier: 1.5,
          allowedUltimateEnergyRecoveryTags: null,
        },
      ],
    });
    const delegate: CombatOperationExecutor = {
      execute: () => false,
      evaluate: () => false,
    };
    const operations = new SkillResourceOperationExecutor({
      sourceOperatorId: 'perlica',
      sourceActionId: 'comboSkill',
      clock,
      resources,
      receipt,
      getNonReturnedSpCost: () => 0,
      finisherSpRecovery: 100,
      delegate,
    });

    expect(
      operations.execute(
        {
          kind: 'changeResource',
          parameters: {
            resource: 'ultimateEnergy',
            amount: 10,
            source: { kind: 'fixed', target: 'caster' },
            targets: { kind: 'fixed', target: 'caster' },
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);

    expect(resources.getUltimateEnergy('perlica')).toBe(100);
    expect(receipt.entries).toHaveLength(1);
    expect(receipt.entries[0]).toMatchObject({
      frame: 0,
      time: 0,
      event: 'UltimateEnergyChanged',
      sourceId: 'perlica',
      targetId: 'perlica',
      data: {
        skillId: 'comboSkill',
        baseValue: 10,
        requestedValue: 15,
        applied: true,
        actualValue: 10,
        previousValue: 90,
        currentValue: 100,
      },
    });
  });

  it('records blocked caster ultimate-energy gain without changing the ledger', () => {
    const allowedTag = 'Skill/Character/chr_0026_lastrite';
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const resources = new CombatResources({
      sp: 0,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
      squad: [
        {
          operatorId: 'arcane',
          ultimateEnergy: 40,
          maxUltimateEnergy: 100,
          ultimateEnergyGainMultiplier: 2,
          allowedUltimateEnergyRecoveryTags: new Set([allowedTag]),
        },
      ],
    });
    const operations = new SkillResourceOperationExecutor({
      sourceOperatorId: 'arcane',
      sourceActionId: 'comboSkill',
      clock,
      resources,
      receipt,
      getNonReturnedSpCost: () => 0,
      finisherSpRecovery: 100,
      delegate: { execute: () => false, evaluate: () => false },
    });

    operations.execute(
      {
        kind: 'changeResource',
        parameters: {
          resource: 'ultimateEnergy',
          amount: 10,
          source: { kind: 'fixed', target: 'caster' },
          targets: { kind: 'fixed', target: 'caster' },
        },
      },
      { blackboard: new ActionBlackboard() },
    );

    expect(resources.getUltimateEnergy('arcane')).toBe(40);
    expect(receipt.entries[0]).toMatchObject({
      event: 'UltimateEnergyChanged',
      targetId: 'arcane',
      data: {
        baseValue: 10,
        requestedValue: 20,
        applied: false,
        actualValue: 0,
        previousValue: 40,
        currentValue: 40,
      },
    });

    operations.execute(
      {
        kind: 'changeResource',
        parameters: {
          resource: 'ultimateEnergy',
          amount: 10,
          source: { kind: 'fixed', target: 'caster' },
          targets: { kind: 'fixed', target: 'caster' },
          ultimateRecoveryTag: allowedTag,
        },
      },
      { blackboard: new ActionBlackboard() },
    );

    expect(resources.getUltimateEnergy('arcane')).toBe(60);
    expect(receipt.entries[1]).toMatchObject({
      event: 'UltimateEnergyChanged',
      data: { requestedValue: 20, applied: true, actualValue: 20 },
    });
  });

  it('records refunded team SP in the returned-SP bucket', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const resources = new CombatResources({
      sp: 280,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 10, pauseDuration: 1, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
      squad: [
        {
          operatorId: 'arcane',
          ultimateEnergy: 0,
          maxUltimateEnergy: 100,
          ultimateEnergyGainMultiplier: 1,
          allowedUltimateEnergyRecoveryTags: null,
        },
      ],
    });
    const delegatedKinds: string[] = [];
    const operations = new SkillResourceOperationExecutor({
      sourceOperatorId: 'arcane',
      sourceActionId: 'comboSkill',
      clock,
      resources,
      receipt,
      getNonReturnedSpCost: () => 0,
      finisherSpRecovery: 100,
      delegate: {
        execute: step => {
          delegatedKinds.push(step.kind);
          return true;
        },
        evaluate: () => true,
      },
    });

    expect(
      operations.execute(
        {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: 30,
            source: { kind: 'fixed', target: 'caster' },
            targets: { kind: 'fixed', target: 'caster' },
            spGainKind: 'refund',
          },
        },
        { blackboard: new ActionBlackboard() },
      ),
    ).toBe(true);

    expect(resources.sp).toBe(300);
    expect(resources.returnedSp).toBe(20);
    expect(delegatedKinds).toEqual([]);
    expect(receipt.entries[0]).toMatchObject({
      event: 'SpChanged',
      sourceId: 'arcane',
      data: {
        skillId: 'comboSkill',
        requestedValue: 30,
        actualValue: 20,
        previousValue: 280,
        currentValue: 300,
        gainKind: 'refund',
      },
    });
  });

  it('resolves a dynamic resource amount from the current action blackboard', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const resources = new CombatResources({
      sp: 250,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
      squad: [
        {
          operatorId: 'zhuang-fangyi',
          ultimateEnergy: 0,
          maxUltimateEnergy: 100,
          ultimateEnergyGainMultiplier: 1,
          allowedUltimateEnergyRecoveryTags: null,
        },
      ],
    });
    const operations = new SkillResourceOperationExecutor({
      sourceOperatorId: 'zhuang-fangyi',
      sourceActionId: 'battleSkill',
      clock,
      resources,
      receipt,
      getNonReturnedSpCost: () => 0,
      finisherSpRecovery: 100,
      delegate: { execute: () => false, evaluate: () => false },
    });

    expect(
      operations.execute(
        {
          kind: 'changeResource',
          parameters: {
            resource: 'sp',
            amount: numberInput({ kind: 'blackboard', key: 'atbReturn' }),
            coefficient: numberInput({ kind: 'blackboard', key: 'coefficient' }),
            source: { kind: 'fixed', target: 'caster' },
            targets: { kind: 'fixed', target: 'caster' },
            spGainKind: 'refund',
            spGainSource: 'default',
          },
        },
        { blackboard: new ActionBlackboard({ atbReturn: 30, coefficient: 0.5 }) },
      ),
    ).toBe(true);

    expect(resources.sp).toBe(265);
    expect(resources.returnedSp).toBe(15);
    expect(receipt.entries[0]).toMatchObject({
      event: 'SpChanged',
      data: { baseValue: 15, gainKind: 'refund' },
    });
  });
});
