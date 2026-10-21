import { numberInput } from '../../../test/compiledGraphInputs';
import { describe, expect, it } from 'vitest';

import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { CombatClock } from '../time/combatClock';
import { CombatResources } from './combatResources';
import { SkillResourceOperationExecutor } from './skillResourceOperationExecutor';
import { TargetContextOperationExecutor } from '../abilities/targetContextOperationExecutor';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import type { CombatOperationExecutor } from '../skills/skillRuntime';
import { createSharedSpGainModifier } from './sharedSpGainModifiers';
import { createStateTestSession } from '../../../test/stateTestSession';

describe('SkillResourceOperationExecutor', () => {
  it.each([
    [undefined, 3.25],
    [25, 1.625],
    [0, 0],
  ] as const)('回能读取当前来源费用 %s，显式零不回退缓存的50点费用', (cost, expected) => {
    const resources = new CombatResources({
      sp: 0,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.065, otherGainPerSp: 0.065 },
      squad: ['caster', 'ally'].map(operatorId => ({
        operatorId,
        ultimateEnergy: 0,
        maxUltimateEnergy: 100,
        ultimateEnergyGainMultiplier: 1,
        allowedUltimateEnergyRecoveryTags: null,
      })),
    });
    const executor = new SkillResourceOperationExecutor({
      sourceOperatorId: 'caster',
      sourceActionId: 'host',
      clock: new CombatClock(),
      resources,
      receipt: new CombatReceiptCollector(),
      getNonReturnedSpCost: () => 50,
      readFinisherSpRecovery: () => 0,
      delegate: { execute: () => false, evaluate: () => false },
    });
    expect(
      executor.execute(
        { kind: 'gainSquadUltimateEnergyFromSkillCost', parameters: { coefficient: 1 } },
        {
          blackboard: new ActionBlackboard(),
          ...(cost === undefined
            ? {}
            : {
                skillCastInfo: { skillCastId: 87, originSkillId: 'new', nonReturnedSpCost: cost },
              }),
        },
      ),
    ).toBe(true);
    expect(resources.getUltimateEnergy('caster')).toBe(expected);
    expect(resources.getUltimateEnergy('ally')).toBe(expected);
  });

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
      readFinisherSpRecovery: () => 0,
      onSpGained: event => gainedBy.push(event.sourceId),
      delegate: {
        execute: () => false,
        evaluate: condition => condition.kind === 'checkMainCharacter' && controlled,
      },
      queryTargets: () =>
        Array.from({ length: targetCount }, () => ({
          kind: 'operator' as const,
          operatorId: 'caster',
        })),
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

  it('restricts queried allies and clears only those recipients on action end', () => {
    const resources = new CombatResources({
      sp: 0,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 0, pauseDuration: 0, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0, otherGainPerSp: 0 },
      squad: ['arcane', 'ally1', 'ally2'].map(operatorId => ({
        operatorId,
        ultimateEnergy: 20,
        maxUltimateEnergy: 100,
        ultimateEnergyGainMultiplier: 1,
        allowedUltimateEnergyRecoveryTags: null,
      })),
    });
    const receipt = new CombatReceiptCollector();
    const operations = new SkillResourceOperationExecutor({
      sourceOperatorId: 'arcane',
      sourceActionId: 'ultimate',
      clock: new CombatClock(),
      resources,
      receipt,
      getNonReturnedSpCost: () => 0,
      readFinisherSpRecovery: () => 0,
      delegate: {
        execute: () => false,
        evaluate: () => false,
      },
      queryTargets: () => [
        { kind: 'operator', operatorId: 'ally1' },
        { kind: 'operator', operatorId: 'ally2' },
      ],
    });
    const step = {
      kind: 'restrictUltimateEnergyRecovery' as const,
      parameters: {
        target: { kind: 'characterTeam' as const, excludeOwner: true },
        allowedRecoveryTags: ['Test/Allowed'],
        clearUltimateEnergyOnEnd: true,
      },
    };
    expect(operations.execute(step, { blackboard: new ActionBlackboard() })).toBe(true);
    expect(resources.changeUltimateEnergy('ally1', 5).applied).toBe(false);
    expect(
      resources.changeUltimateEnergy('ally1', 5, { recoveryTag: 'Test/Allowed' }).applied,
    ).toBe(true);
    expect(resources.getUltimateEnergy('arcane')).toBe(20);
    expect(resources.changeUltimateEnergy('ally2', 5).applied).toBe(false);
    operations.end(step);
    expect(resources.getUltimateEnergy('ally1')).toBe(0);
    expect(resources.getUltimateEnergy('ally2')).toBe(0);
    expect(resources.getUltimateEnergy('arcane')).toBe(20);
    expect(receipt.entries).toHaveLength(2);
    expect(resources.changeUltimateEnergy('ally1', 5).applied).toBe(true);
    operations.end(step);
    expect(resources.getUltimateEnergy('ally1')).toBe(5);
    expect(receipt.entries).toHaveLength(2);
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
      readFinisherSpRecovery: () => 0,
      delegate: { execute: () => false, evaluate: () => false },
    };
    const originalExecutor = new SkillResourceOperationExecutor(baseDependencies);
    const step = {
      kind: 'restrictUltimateEnergyRecovery' as const,
      parameters: {
        target: { kind: 'fixed' as const, target: 'caster' as const },
        allowedRecoveryTags: ['Test/Allowed'],
        clearUltimateEnergyOnEnd: false,
      },
    };
    originalExecutor.execute(step, { blackboard: new ActionBlackboard() });
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
      readFinisherSpRecovery: () => 80,
      onSpGained: event => gains.push(event),
      delegate: { execute: () => false, evaluate: () => false },
    });

    expect(
      operations.execute(
        {
          kind: 'gainFinisherSp',
          parameters: {
            source: { kind: 'source' },
            target: { kind: 'battleMainTarget' },
            factor: numberInput({ kind: 'constant', value: 0.5 }),
          },
        },
        { blackboard: new ActionBlackboard(), actionSourceId: 'perlica' },
      ),
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
    const terminal = { execute: () => false, evaluate: () => false };
    const queryExecutor = new TargetContextOperationExecutor('perlica', terminal);
    const queried = new SkillResourceOperationExecutor({
      ...operations.dependencies,
      readFinisherSpRecovery: target => (target.kind === 'enemy' ? 80 : undefined),
      delegate: terminal,
      queryTargets: queryExecutor.queryTargets.bind(queryExecutor),
    });
    const targetContext = new RuntimeTargetContext();
    const context = { blackboard: new ActionBlackboard(), targetContext };
    const step = {
      kind: 'gainFinisherSp' as const,
      parameters: {
        source: { kind: 'context' as const, key: 'sources' },
        target: { kind: 'context' as const, key: 'targets' },
        factor: numberInput({ kind: 'blackboard', key: 'factor' }),
      },
    };
    expect(queried.execute(step, context)).toBe(false);
    targetContext.set('sources', [
      { kind: 'spatialPoint', pointId: 1 },
      { kind: 'operator', operatorId: 'actual-source' },
    ]);
    expect(queried.execute(step, context)).toBe(false);
    targetContext.set('sources', [
      { kind: 'operator', operatorId: 'actual-source' },
      { kind: 'operator', operatorId: 'ignored-source' },
    ]);
    expect(queried.execute(step, context)).toBe(false);
    for (const first of [
      { kind: 'spatialPoint' as const, pointId: 2 },
      { kind: 'operator' as const, operatorId: 'recipient' },
    ]) {
      targetContext.set('targets', [first, { kind: 'enemy' }]);
      expect(queried.execute(step, context)).toBe(false);
    }
    targetContext.set('targets', [{ kind: 'enemy' }, { kind: 'enemy' }]);
    expect(() => queried.execute(step, context)).toThrow('factor');
    context.blackboard.assign({ factor: 0.5 });
    expect(queried.execute(step, context)).toBe(true);
    expect(resources.sp).toBe(140);
    expect(receipt.entries).toHaveLength(2);
    expect(receipt.entries.at(-1)).toMatchObject({
      sourceId: 'actual-source',
      data: { baseValue: 40, actualValue: 60 },
    });
    expect(gains.at(-1)).toMatchObject({ sourceId: 'actual-source', amount: 60 });
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
      readFinisherSpRecovery: () => 100,
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
      readFinisherSpRecovery: () => 100,
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
      readFinisherSpRecovery: () => 100,
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
      readFinisherSpRecovery: () => 100,
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
