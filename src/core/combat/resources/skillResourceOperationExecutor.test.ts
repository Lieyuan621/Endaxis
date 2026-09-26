import type { SkillDefinition } from '../../../../packages/game-data-contract/src/skills.ts';
import { describe, expect, it } from 'vitest';
import { perlica } from '../../../data/operators/perlica.generated';
import { compileSkill } from '../../compiler/compileSkill';
import { ActionGraphDefinitionRepository } from '../../compiler/actionGraphDefinitionRepository';

import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatClock } from '../time/combatClock';
import { CombatResources } from './combatResources';
import { CombatSimulation } from '../runtime/combatSimulation';
import { SkillResourceOperationExecutor } from './skillResourceOperationExecutor';
import { SkillRuntime, type CombatOperationExecutor } from '../skills/skillRuntime';
import { createSharedSpGainModifier } from './sharedSpGainModifiers';
import { StateStepper } from '../runtime/stateStepper';

function findSkill(key: string): SkillDefinition {
  for (const group of perlica.skillGroups) {
    const skills = Array.isArray(group.skills) ? group.skills : [group.skills];
    const skill = skills.find(candidate => candidate.key === key);
    if (skill !== undefined) return skill;
  }
  throw new Error(`missing Perlica skill '${key}'`);
}

describe('SkillResourceOperationExecutor', () => {
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
    const copied = new StateStepper(
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
        sourceOperatorId: 'perlica',
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
      operations.execute({
        kind: 'changeResource',
        parameters: {
          resource: 'ultimateEnergy',
          amount: 10,
          recipient: 'caster',
        },
      }),
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

    operations.execute({
      kind: 'changeResource',
      parameters: {
        resource: 'ultimateEnergy',
        amount: 10,
        recipient: 'caster',
      },
    });

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

    operations.execute({
      kind: 'changeResource',
      parameters: {
        resource: 'ultimateEnergy',
        amount: 10,
        recipient: 'caster',
        ultimateRecoveryTag: allowedTag,
      },
    });

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
      operations.execute({
        kind: 'changeResource',
        parameters: {
          resource: 'sp',
          amount: 30,
          recipient: 'team',
          spGainKind: 'refund',
        },
      }),
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
          kind: 'changeResourceByActionValue',
          parameters: {
            resource: 'sp',
            amount: { kind: 'blackboard', key: 'atbReturn' },
            coefficient: { kind: 'blackboard', key: 'coefficient' },
            recipient: 'team',
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

  it('carries a Perlica cast cost into ordered squad ultimate-energy changes', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const resources = new CombatResources({
      sp: 100,
      maxSp: 300,
      returnedSp: 10,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 10, pauseDuration: 1, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.1, otherGainPerSp: 0.2 },
      squad: [
        {
          operatorId: 'perlica',
          ultimateEnergy: 0,
          maxUltimateEnergy: 100,
          ultimateEnergyGainMultiplier: 1.5,
          allowedUltimateEnergyRecoveryTags: null,
        },
        {
          operatorId: 'ally',
          ultimateEnergy: 0,
          maxUltimateEnergy: 100,
          ultimateEnergyGainMultiplier: 0.5,
          allowedUltimateEnergyRecoveryTags: null,
        },
      ],
    });
    const delegatedKinds: string[] = [];
    const delegate: CombatOperationExecutor = {
      execute: step => {
        delegatedKinds.push(step.kind);
        return true;
      },
      evaluate: () => true,
    };
    let runtime: SkillRuntime;
    const operations = new SkillResourceOperationExecutor({
      sourceOperatorId: 'perlica',
      sourceActionId: 'battleSkill',
      clock,
      resources,
      receipt,
      getNonReturnedSpCost: () => runtime.nonReturnedSpCost,
      finisherSpRecovery: 100,
      delegate,
    });
    runtime = new SkillRuntime(
      compileSkill({
        operatorId: 'perlica',
        skillGroupKey: 'battleSkill',
        skillType: 'battleSkill',
        skillLevel: 12,
        skill: findSkill('chr_0004_pelica_normal_skill'),
        programs: new ActionGraphDefinitionRepository(),
      }),
      { clock, resources, receipt, operations, allocateSkillCastId: () => 1 },
    );
    const simulation = new CombatSimulation(clock);
    simulation.add(runtime);

    expect(runtime.tryStart()).toBe(true);
    simulation.advanceFrames(13);

    expect(runtime.nonReturnedSpCost).toBe(90);
    expect(delegatedKinds).toEqual([
      'findCharacterTeamTargets',
      'applyElementalInfliction',
      'dealDamage',
    ]);
    expect(resources.getUltimateEnergy('perlica')).toBe(13.5);
    expect(resources.getUltimateEnergy('ally')).toBe(9);
    expect(
      receipt.entries
        .filter(entry => entry.event === 'UltimateEnergyChanged')
        .map(entry => ({ targetId: entry.targetId, data: entry.data })),
    ).toEqual([
      {
        targetId: 'perlica',
        data: {
          skillId: 'battleSkill',
          recipient: 'operator',
          baseValue: 9,
          requestedValue: 13.5,
          applied: true,
          actualValue: 13.5,
          previousValue: 0,
          currentValue: 13.5,
        },
      },
      {
        targetId: 'ally',
        data: {
          skillId: 'battleSkill',
          recipient: 'operator',
          baseValue: 18,
          requestedValue: 9,
          applied: true,
          actualValue: 9,
          previousValue: 0,
          currentValue: 9,
        },
      },
    ]);
  });
});
