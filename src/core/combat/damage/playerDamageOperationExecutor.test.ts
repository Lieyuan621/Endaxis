import type { ResolvedCombatStepForKind } from '../../compiler/combatProgram';
import { describe, expect, it, vi } from 'vitest';
import {
  DAMAGE_SCALE_ATTRIBUTE_KEYS,
  type DamageScaleAttributeSnapshot,
} from './damageScaleAttributes';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { CombatVitals } from '../resources/combatVitals';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { PlayerDamageOperationExecutor } from './playerDamageOperationExecutor';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { deriveHitId } from '../timeline/deriveHitId';
import { NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY } from '../../../../packages/game-data-contract/src/conditions';
import type { DamageModifierSide } from '../../../../packages/game-data-contract/src/modifiers';

const DAMAGE_STEP: ResolvedCombatStepForKind<'dealDamage'> = {
  kind: 'dealDamage',
  parameters: {
    damageType: 'electric',
    attackScale: 4,
    tags: ['normalSkill'],
    stagger: 20,
  },
};

const scaleAttributes = Object.fromEntries(
  DAMAGE_SCALE_ATTRIBUTE_KEYS.map(key => [key, 0]),
) as unknown as DamageScaleAttributeSnapshot;

function createAttributeSnapshots(attack = 100, defense = 0, criticalRate = 0) {
  return {
    attacker: {
      ...scaleAttributes,
      attack,
      criticalRate,
      criticalDamageIncrease: 0.5,
      weaknessDamageMultiplier: 1,
      igniteDamageMultiplier: 1,
      physicalInflictionDamageMultiplier: 1,
    },
    defender: {
      ...scaleAttributes,
      defense,
      shelterDamageMultiplier: 0,
      breakingAttackDamageTakenMultiplier: 1,
      resistances: {
        physical: { percent: 0, damageTakenMultiplier: 1 },
        heat: { percent: 0, damageTakenMultiplier: 1 },
        electric: { percent: 0, damageTakenMultiplier: 1 },
        cryo: { percent: 0, damageTakenMultiplier: 1 },
        nature: { percent: 0, damageTakenMultiplier: 1 },
        ether: { percent: 0, damageTakenMultiplier: 1 },
      },
    },
  } as const;
}

describe('PlayerDamageOperationExecutor', () => {
  it.each([
    ['electric', 'standard'],
    ['nature', 'standard'],
    ['true', 'standard'],
    ['electric', 'fixed'],
    ['electric', 'attribute'],
  ] as const)(
    'records attributes used by %s / %s at their calculation stage',
    (damageType, calculation) => {
      const snapshots = createAttributeSnapshots();
      let afterCalculation = false;
      const receipt = new CombatReceiptCollector();
      const attribute = (
        name: string,
        side: DamageModifierSide,
        value: number,
      ): import('./damageScale').AppliedDamageModifier => ({
        kind: 'attribute',
        buffId: `${side}:${name}`,
        sourceId: 'support',
        side,
        attribute: name,
        slot: 'baseAddition',
        value,
      });
      const targetVitals = new CombatVitals({
        health: 2000,
        maxHealth: 2000,
        maxPoise: 0,
        poise: 0,
        poiseRecoveryTime: 0,
        poiseRecoveryTimeMultiplier: 1,
        poiseBrokenEndTime: 0,
        poiseImmune: false,
      });
      const executor = new PlayerDamageOperationExecutor({
        sourceOperatorId: 'operator',
        targetId: 'enemy',
        targetVitals,
        clock: new CombatClock(),
        receipt,
        captureAttributeSnapshots: () => ({
          attacker: {
            ...snapshots.attacker,
            calculationAttributeValue: 100,
            attackDetail: {
              panelAttack: 100,
              operatorBaseAttack: 100,
              weaponBaseAttack: 0,
              attackPercent: 0,
              flatAttack: 0,
              mainAttribute: 'strength',
              secondaryAttribute: 'agility',
              attributes: { strength: 10, agility: 10, intellect: 0, will: 10 },
              coefficients: { strength: 0.01, agility: 0.005, intellect: 0, will: 0 },
            },
            electricEnhancedDamageIncrease: 0.2,
            natureEnhancedDamageIncrease: 0.3,
            modifierDetails: [
              attribute('Atk', 'attacker', afterCalculation ? 99 : 10),
              attribute('strength', 'attacker', 5),
              attribute('will', 'attacker', 5),
              attribute('AtkIncreaseFactorFromWill', 'attacker', 0.01),
              attribute('AtkIncreaseFactorFromWisd', 'attacker', 0.01),
              attribute('Def', 'attacker', 12),
              attribute('SlowActionSpeedScalar', 'attacker', 0.2),
              attribute('healOutputIncrease', 'attacker', 0.4),
              attribute('criticalRate', 'attacker', afterCalculation ? 0.2 : 0.1),
              attribute('electricEnhancedDamageIncrease', 'attacker', 0.2),
              attribute('natureEnhancedDamageIncrease', 'attacker', 0.3),
              attribute('comboSkillDamageIncrease', 'attacker', 0.8),
              attribute('damageToStaggeredEnemyIncrease', 'attacker', 0.9),
              attribute('normalSkillDamageIncrease', 'attacker', 0),
            ],
          },
          defender: {
            ...snapshots.defender,
            natureVulnerabilityIncrease: 0.1,
            modifierDetails: [
              attribute('natureVulnerabilityIncrease', 'defender', 0.1),
              attribute('PulseResistance', 'defender', 10),
              attribute('NaturalResistance', 'defender', 20),
              attribute('weaknessDamageMultiplier', 'defender', 0.2),
            ],
          },
        }),
        criticalSamples: { nextCriticalSample: () => 1 },
        resolveNonRandomRuntimeSnapshot: () => ({
          runtimeExtensionMultiplier: 1,
          appliesIgniteDamageMultiplier: false,
          appliesPhysicalInflictionDamageMultiplier: false,
        }),
        applyDamageModifiers: (timing, side, context) => {
          if (timing !== 'afterCalculation' || side !== 'attacker') return;
          afterCalculation = true;
          context.appliedDamageModifiers.push(
            {
              kind: 'damageScale',
              buffId: 'zero',
              sourceId: 'support',
              side,
              zone: 'normal',
              addition: 0,
            },
            { kind: 'multiplyValue', buffId: 'identity', sourceId: 'support', side, multiplier: 1 },
          );
        },
        addInstantAttributeModifier: () => undefined,
        clearInstantAttributeModifiers: () => undefined,
        emitPreparationEvent: () => undefined,
        resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
        emitHealthSourceEvent: () => undefined,
        emitHealthTargetEvent: () => undefined,
        emitPoiseSourceEvent: () => undefined,
        emitPoiseTargetEvent: () => undefined,
        delegate: { execute: () => false, evaluate: () => false },
      });
      executor.execute(
        calculation === 'fixed'
          ? {
              kind: 'dealFixedDamage',
              parameters: { damageType, value: 400, tags: ['normalSkill'] },
            }
          : {
              ...DAMAGE_STEP,
              parameters: {
                ...DAMAGE_STEP.parameters,
                damageType,
                stagger: undefined,
                calculation,
                ...(calculation === 'attribute' ? { calculationAttribute: 'Def' } : {}),
              },
            },
      );
      const hit = receipt.entries.find(entry => entry.event === 'DamageApplied')!;
      expect(hit.appliedDamageModifiers).toEqual([
        ...(calculation === 'fixed'
          ? []
          : [
              attribute(
                calculation === 'attribute' ? 'Def' : 'Atk',
                'attacker',
                calculation === 'attribute' ? 12 : 10,
              ),
            ]),
        ...(calculation === 'standard'
          ? [
              attribute('strength', 'attacker', 5),
              attribute('AtkIncreaseFactorFromWill', 'attacker', 0.01),
            ]
          : []),
        attribute('criticalRate', 'attacker', 0.2),
        ...(damageType === 'true'
          ? []
          : [
              attribute(
                damageType === 'electric' ? 'PulseResistance' : 'NaturalResistance',
                'defender',
                damageType === 'electric' ? 10 : 20,
              ),
            ]),
        ...(damageType === 'true'
          ? []
          : [
              {
                ...attribute(
                  `${damageType}EnhancedDamageIncrease`,
                  'attacker',
                  damageType === 'electric' ? 0.2 : 0.3,
                ),
                zone: 'enhanced',
              },
            ]),
        ...(damageType === 'nature'
          ? [{ ...attribute('natureVulnerabilityIncrease', 'defender', 0.1), zone: 'vulnerable' }]
          : []),
      ]);
      const expected =
        400 * (damageType === 'true' ? 1 : damageType === 'electric' ? 1.2 : 1.3 * 1.1);
      expect(hit.data?.value).toBeCloseTo(expected);
      expect(targetVitals.health).toBeCloseTo(2000 - expected);
      executor.execute(
        {
          ...DAMAGE_STEP,
          parameters: {
            ...DAMAGE_STEP.parameters,
            stagger: undefined,
            instantDamageScaleModifiers: [
              { side: 'attacker', zone: 'product', addition: { kind: 'constant', value: 0.5 } },
              { side: 'attacker', zone: 'normal', addition: { kind: 'constant', value: 0 } },
            ],
            instantAttributeModifiers: [
              {
                targetSide: 'attacker',
                attribute: 'criticalRate',
                slot: 'finalMultiplier',
                attributeTiming: 'runtime',
                value: { kind: 'constant', value: 1 },
              },
              {
                targetSide: 'attacker',
                attribute: 'criticalRate',
                slot: 'baseAddition',
                attributeTiming: 'runtime',
                value: { kind: 'constant', value: 0.1 },
              },
            ],
          },
        },
        {
          blackboard: new ActionBlackboard(),
          actionOwnerId: 'actual-owner',
          executionActionId: 'actual-action',
        },
      );
      const direct = receipt.entries
        .filter(entry => entry.event === 'DamageApplied')
        .at(-1)!.appliedDamageModifiers!;
      expect(direct.filter(item => item.sourceActionId === 'actual-action')).toHaveLength(2);
      expect(direct).toContainEqual({
        kind: 'damageScale',
        sourceId: 'actual-owner',
        sourceActionId: 'actual-action',
        side: 'attacker',
        zone: 'product',
        addition: 0.5,
      });
      expect(direct).toContainEqual({
        kind: 'attribute',
        sourceId: 'actual-owner',
        sourceActionId: 'actual-action',
        side: 'attacker',
        attribute: 'criticalRate',
        slot: 'baseAddition',
        value: 0.1,
      });
      executor.execute(
        {
          ...DAMAGE_STEP,
          parameters: {
            ...DAMAGE_STEP.parameters,
            instantDamageScaleModifiers: [
              { side: 'attacker', zone: 'product', addition: { kind: 'constant', value: 0.5 } },
            ],
          },
        },
        {
          blackboard: new ActionBlackboard(),
          actionOwnerId: 'buff-owner',
          executionActionId: 'buff-action',
          executingBuff: { buffId: 'direct-buff', buffOwnerId: 'buff-owner', buffInstanceId: 17 },
        },
      );
      const buffHit = receipt.entries.filter(entry => entry.event === 'DamageApplied').at(-1)!;
      expect(buffHit.appliedDamageModifiers).toContainEqual({
        kind: 'damageScale',
        sourceId: 'buff-owner',
        sourceActionId: 'buff-action',
        buffId: 'direct-buff',
        buff: { ownerId: 'buff-owner', instanceId: 17 },
        side: 'attacker',
        zone: 'product',
        addition: 0.5,
      });
    },
  );

  function runCriticalPolicy(
    randomMode: 'expected' | 'sampled',
    override?: boolean,
    canCritical = true,
  ): {
    readonly damage: number;
    readonly isCritical: boolean;
    readonly triggersCriticalEffects: boolean;
    readonly samples: number;
  } {
    const targetVitals = new CombatVitals({
      health: 2000,
      maxHealth: 2000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const receipt = new CombatReceiptCollector();
    let samples = 0;
    let triggersCriticalEffects = false;
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: 'operator',
      castId: 'cast:1',
      targetId: 'enemy',
      targetVitals,
      clock: new CombatClock(),
      receipt,
      captureAttributeSnapshots: () => createAttributeSnapshots(100, 0, 0.5),
      criticalSamples: {
        nextCriticalSample: () => {
          samples += 1;
          return 0;
        },
      },
      randomMode,
      canCritical,
      ...(override === undefined ? {} : { resolveCriticalOverride: () => override }),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      applyDamageModifiers: () => undefined,
      addInstantAttributeModifier: () => undefined,
      clearInstantAttributeModifiers: () => undefined,
      emitPreparationEvent: () => undefined,
      resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
      emitHealthSourceEvent: (event, payload) => {
        if (event === 'outputDamage')
          triggersCriticalEffects = payload.triggersCriticalEffects === true;
      },
      emitHealthTargetEvent: () => undefined,
      emitPoiseSourceEvent: () => undefined,
      emitPoiseTargetEvent: () => undefined,
      delegate: { execute: () => false, evaluate: () => false },
    });
    executor.execute({ ...DAMAGE_STEP, key: 'damage:1' });
    const damage = receipt.entries.find(entry => entry.event === 'DamageApplied')!;
    return {
      damage: Number(damage.data?.value),
      isCritical: damage.data?.isCritical === true,
      triggersCriticalEffects,
      samples,
    };
  }

  it('期望模式写入数学期望但不伪造实际暴击，也不推进随机流', () => {
    expect(runCriticalPolicy('expected')).toEqual({
      damage: 500,
      isCritical: false,
      triggersCriticalEffects: true,
      samples: 0,
    });
    expect(runCriticalPolicy('sampled')).toEqual({
      damage: 600,
      isCritical: true,
      triggersCriticalEffects: true,
      samples: 1,
    });
    expect(runCriticalPolicy('expected', undefined, false)).toEqual({
      damage: 400,
      isCritical: false,
      triggersCriticalEffects: false,
      samples: 0,
    });
  });

  it('lets an explicit hit result override sampling in either direction', () => {
    expect(runCriticalPolicy('sampled', false)).toEqual({
      damage: 400,
      isCritical: false,
      triggersCriticalEffects: false,
      samples: 0,
    });
    expect(runCriticalPolicy('sampled', true)).toEqual({
      damage: 600,
      isCritical: true,
      triggersCriticalEffects: true,
      samples: 0,
    });
    expect(runCriticalPolicy('expected', true)).toEqual({
      damage: 600,
      isCritical: true,
      triggersCriticalEffects: true,
      samples: 0,
    });
  });

  it('在实际执行生命伤害后置位本次技能的原生命中状态', () => {
    const targetVitals = new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: 'mifu',
      targetId: 'enemy',
      targetVitals,
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      captureAttributeSnapshots: () => createAttributeSnapshots(),
      criticalSamples: { nextCriticalSample: () => 1 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      applyDamageModifiers: () => undefined,
      addInstantAttributeModifier: () => undefined,
      clearInstantAttributeModifiers: () => undefined,
      emitPreparationEvent: () => undefined,
      resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
      emitHealthSourceEvent: () => undefined,
      emitHealthTargetEvent: () => undefined,
      emitPoiseSourceEvent: () => undefined,
      emitPoiseTargetEvent: () => undefined,
      delegate: { execute: () => true, evaluate: () => false },
    });
    const blackboard = new ActionBlackboard({ [NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY]: 0 });

    expect(executor.execute(DAMAGE_STEP, { blackboard })).toBe(true);
    expect(blackboard.getNumber(NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY)).toBe(1);
  });

  it('applies standard health damage before the hit poise unit', () => {
    let sourceControlled = false;
    let runtimeAttack = 100;
    let attackModifiers: import('./damageScale').AppliedDamageModifier[] = [];
    const healthEvents: string[] = [];
    const targetVitals = new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      maxPoise: 100,
      poise: 100,
      poiseRecoveryTime: 1,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const receipt = new CombatReceiptCollector();
    const nextCriticalSample = vi.fn(() => 1);
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: 'perlica',
      castId: 'cast:buff-source',
      targetId: 'enemy',
      targetVitals,
      clock: new CombatClock(),
      receipt,
      captureAttributeSnapshots: () => {
        const snapshots = createAttributeSnapshots(runtimeAttack);
        return {
          ...snapshots,
          attacker: { ...snapshots.attacker, modifierDetails: attackModifiers },
        };
      },
      criticalSamples: { nextCriticalSample },
      attackDetail: {
        panelAttack: 100,
        operatorBaseAttack: 80,
        weaponBaseAttack: 20,
        attackPercent: 0,
        flatAttack: 0,
        mainAttribute: 'intellect',
        secondaryAttribute: 'will',
        attributes: { strength: 10, agility: 20, intellect: 30, will: 40 },
        coefficients: { strength: 0, agility: 0, intellect: 0.001, will: 0.0005 },
      },
      resolveCriticalOverride: step => (step.key === 'forced' ? true : undefined),
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      applyDamageModifiers: () => undefined,
      addInstantAttributeModifier: () => undefined,
      clearInstantAttributeModifiers: () => undefined,
      emitPreparationEvent: () => undefined,
      resolvePoiseMultipliers: () => ({ output: 1.5, taken: 2 }),
      isSourceControlled: () => sourceControlled,
      emitHealthSourceEvent: event => healthEvents.push(`source:${event}`),
      emitHealthTargetEvent: event => healthEvents.push(`target:${event}`),
      emitPoiseSourceEvent: () => undefined,
      emitPoiseTargetEvent: () => undefined,
      delegate: { execute: vi.fn(() => true), evaluate: vi.fn(() => false) },
    });

    const keyedDamageStep = { ...DAMAGE_STEP, key: 'buff-child-hit' };
    expect(executor.execute(keyedDamageStep)).toBe(true);
    expect(targetVitals.health).toBe(600);
    expect(targetVitals.poise).toBe(40);
    expect(healthEvents).toEqual([
      'target:beforeTakeDamage',
      'source:beforeOutputDamage',
      'target:takeDamage',
      'source:outputDamage',
    ]);
    expect(receipt.entries.map(entry => entry.event)).toEqual(['DamageApplied', 'PoiseApplied']);
    expect(receipt.entries[0]?.data).toMatchObject({
      castId: 'cast:buff-source',
      stepKey: 'buff-child-hit',
      hitId: deriveHitId('cast:buff-source', 'buff-child-hit'),
      attack: 100,
      attackDetailOperatorBase: 80,
      attackDetailWeaponBase: 20,
      attackDetailAttackPercent: 0,
      attackDetailFlatAttack: 0,
      attackDetailMainAttribute: 'intellect',
      attackDetailSecondaryAttribute: 'will',
      attackDetailIntellect: 30,
      attackDetailWill: 40,
      attackDetailIntellectCoefficient: 0.001,
      attackDetailWillCoefficient: 0.0005,
      baseDamage: 400,
      finalAttackValue: 400,
      standardCalculation: true,
      skillMultiplierPercent: 400,
      calculationMultiplier: 1,
      damageScaleMultiplier: 1,
      criticalRate: 0,
      criticalDamageIncrease: 0.5,
      criticalExpectationMultiplier: 1,
      nonCriticalDamage: 400,
      criticalDamage: 600,
      expectedDamage: 400,
      enemyDefense: 0,
      enemyResistancePercent: 0,
      damageTakenMultiplier: 1,
      weaknessDamageMultiplier: 1,
      shelterDamageMultiplier: 0,
      directDamageMultiplier: 1,
      resistancePercentMultiplier: 1,
    });

    const controlledOnlyStaggerStep = {
      ...DAMAGE_STEP,
      parameters: {
        ...DAMAGE_STEP.parameters,
        attackScale: 0,
        stagger: 10,
        staggerOnlyWhenCasterControlled: true,
      },
    };
    executor.execute(controlledOnlyStaggerStep);
    expect(targetVitals.poise).toBe(40);
    sourceControlled = true;
    executor.execute(controlledOnlyStaggerStep);
    expect(targetVitals.poise).toBe(10);

    executor.execute(
      {
        ...DAMAGE_STEP,
        parameters: {
          ...DAMAGE_STEP.parameters,
          attackScale: { kind: 'blackboard', key: 'attackScale' },
          stagger: undefined,
        },
      },
      { blackboard: new ActionBlackboard({ attackScale: 1 }) },
    );
    expect(targetVitals.health).toBe(500);
    expect(nextCriticalSample).not.toHaveBeenCalled();

    executor.execute({
      ...DAMAGE_STEP,
      key: 'forced',
      parameters: { ...DAMAGE_STEP.parameters, attackScale: 1, stagger: undefined },
    });
    expect(targetVitals.health).toBe(350);
    expect(receipt.entries.at(-1)?.data).toMatchObject({
      value: 150,
      isCritical: true,
      expectedDamage: 100,
      criticalDamage: 150,
      nonCriticalDamage: 100,
    });
    expect(nextCriticalSample).not.toHaveBeenCalled();

    const snapshotStep = {
      ...DAMAGE_STEP,
      parameters: {
        ...DAMAGE_STEP.parameters,
        attackScale: 1,
        takeAttackSnapshot: true,
        stagger: undefined,
      },
    };
    const snapshotContext = {
      blackboard: new ActionBlackboard(),
      damageCalculationSnapshots: new DamageCalculationSnapshots(),
    };
    attackModifiers = [
      {
        kind: 'attribute',
        side: 'attacker',
        attribute: 'Atk',
        slot: 'baseMultiplier',
        value: 0.2,
        buffId: 'old-buff',
        sourceId: 'operator',
        buff: { ownerId: 'operator', instanceId: 7 },
      },
    ];
    executor.prepare(snapshotStep, snapshotContext);
    attackModifiers[0] = { ...attackModifiers[0]!, buffId: 'new-buff' };
    runtimeAttack = 999;
    executor.prepare(snapshotStep, snapshotContext);
    const savedSnapshots = structuredClone(snapshotContext.damageCalculationSnapshots.runtimeState);
    const restoredContext = {
      ...snapshotContext,
      damageCalculationSnapshots: new DamageCalculationSnapshots(
        snapshotContext.damageCalculationSnapshots.program,
        savedSnapshots,
      ),
    };
    snapshotContext.damageCalculationSnapshots.clear();
    executor.execute(snapshotStep, restoredContext);
    expect(targetVitals.health).toBe(250);
    expect(receipt.entries.at(-1)?.data).toMatchObject({
      attack: 100,
      currentAttack: 999,
      usesAttackSnapshot: true,
      skillMultiplierPercent: 100,
      baseDamage: 100,
    });
    expect(receipt.entries.at(-1)?.appliedDamageModifiers).toContainEqual({
      kind: 'attribute',
      side: 'attacker',
      attribute: 'Atk',
      slot: 'baseMultiplier',
      value: 0.2,
      buffId: 'old-buff',
      sourceId: 'operator',
      buff: { ownerId: 'operator', instanceId: 7 },
    });
    expect(
      receipt.entries.at(-1)?.appliedDamageModifiers?.some(item => item.buffId === 'new-buff'),
    ).toBe(false);

    // 未选 Switch 分支内的 IfElse 也必须在 Reset 时建立快照，不能等命中后读实时攻击。
    const branchContext = {
      blackboard: new ActionBlackboard({ choice: 0 }),
      damageCalculationSnapshots: new DamageCalculationSnapshots(),
    };
    const branchRuntime = new CombatActionSequenceRuntime(
      {
        execute: (step, context) => executor.execute(step, context),
        prepare: (step, context) => executor.prepare(step, context),
        evaluate: () => false,
      },
      branchContext,
    );
    const branchSequence = branchRuntime.createSequence(
      compileGraphEntry('damage-snapshot-branch', 'switch-0', {
        'switch-0': {
          action: {
            kind: 'switch',
            parameters: { choice: { kind: 'blackboard', key: 'choice' }, alwaysNext: false },
            options: [
              { value: { kind: 'constant', value: 0 }, sequence: { $sequence: null } },
              { value: { kind: 'constant', value: 1 }, sequence: { $sequence: 'case-1-0' } },
            ],
          },
          next: null,
        },
        'case-1-0': {
          action: {
            kind: 'conditional',
            parameters: { condition: { kind: 'combatActive' } },
            whenTrue: { $sequence: null },
            whenFalse: { $sequence: 'false-0' },
          },
          next: null,
        },
        'false-0': { action: snapshotStep, next: null },
      }),
    );
    runtimeAttack = 200;
    branchSequence.reset({});
    expect(branchContext.damageCalculationSnapshots.size).toBe(1);
    branchSequence.executeInstant({});
    expect(targetVitals.health).toBe(250);
    runtimeAttack = 999;
    branchContext.blackboard.assignDynamic('choice', 1);
    branchSequence.executeInstant({});
    expect(targetVitals.health).toBe(50);
  });

  it('does not publish a stale panel attack tree after runtime attack changes', () => {
    const targetVitals = new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const receipt = new CombatReceiptCollector();
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: 'perlica',
      targetId: 'enemy',
      targetVitals,
      clock: new CombatClock(),
      receipt,
      captureAttributeSnapshots: () => createAttributeSnapshots(120),
      criticalSamples: { nextCriticalSample: () => 1 },
      attackDetail: {
        panelAttack: 100,
        operatorBaseAttack: 80,
        weaponBaseAttack: 20,
        attackPercent: 0,
        flatAttack: 0,
        mainAttribute: 'intellect',
        secondaryAttribute: 'will',
        attributes: { strength: 0, agility: 0, intellect: 0, will: 0 },
        coefficients: { strength: 0, agility: 0, intellect: 0.001, will: 0.0005 },
      },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      applyDamageModifiers: () => undefined,
      addInstantAttributeModifier: () => undefined,
      clearInstantAttributeModifiers: () => undefined,
      emitPreparationEvent: () => undefined,
      resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
      emitHealthSourceEvent: () => undefined,
      emitHealthTargetEvent: () => undefined,
      emitPoiseSourceEvent: () => undefined,
      emitPoiseTargetEvent: () => undefined,
      delegate: { execute: vi.fn(() => true), evaluate: vi.fn(() => false) },
    });

    executor.execute({
      ...DAMAGE_STEP,
      parameters: { ...DAMAGE_STEP.parameters, attackScale: 1, stagger: undefined },
    });

    expect(receipt.entries[0]?.data?.attack).toBe(120);
    expect(receipt.entries[0]?.data?.attackDetailOperatorBase).toBeUndefined();
  });

  it('applies the physical infliction multiplier when the generated damage feature requires it', () => {
    const targetVitals = new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const snapshots = createAttributeSnapshots(100);
    const receipt = new CombatReceiptCollector();
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: 'antal',
      targetId: 'enemy',
      targetVitals,
      clock: new CombatClock(),
      receipt,
      captureAttributeSnapshots: () => ({
        ...snapshots,
        attacker: {
          ...snapshots.attacker,
          physicalInflictionDamageMultiplier: 2,
        },
        defender: {
          ...snapshots.defender,
          resistances: {
            ...snapshots.defender.resistances,
            physical: { percent: 20, damageTakenMultiplier: 1.25 },
          },
        },
      }),
      criticalSamples: { nextCriticalSample: () => 1 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      applyDamageModifiers: () => undefined,
      addInstantAttributeModifier: () => undefined,
      clearInstantAttributeModifiers: () => undefined,
      emitPreparationEvent: () => undefined,
      resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
      emitHealthSourceEvent: () => undefined,
      emitHealthTargetEvent: () => undefined,
      emitPoiseSourceEvent: () => undefined,
      emitPoiseTargetEvent: () => undefined,
      delegate: { execute: vi.fn(() => true), evaluate: vi.fn(() => false) },
    });

    executor.execute({
      kind: 'dealDamage',
      parameters: {
        damageType: 'physical',
        attackScale: 1,
        tags: ['normalSkill'],
        features: ['physicalInfliction'],
      },
    });

    expect(targetVitals.health).toBe(800);
    expect(receipt.entries[0]?.data).toMatchObject({
      physicalInflictionMultiplier: 2,
      directDamageMultiplier: 2,
      criticalExpectationMultiplier: 1,
      enemyResistancePercent: 20,
      resistancePercentMultiplier: 0.8,
      damageTakenMultiplier: 1.25,
    });
  });

  it('uses fixed damage as the calculation result while preserving the damage formula', () => {
    const targetVitals = new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: 'rossi',
      targetId: 'enemy',
      targetVitals,
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      captureAttributeSnapshots: () => createAttributeSnapshots(9999, 100),
      criticalSamples: { nextCriticalSample: () => 1 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      applyDamageModifiers: (timing, side, context) => {
        if (timing === 'afterCalculation' && side === 'attacker') {
          context.multiplyCalculationValue(2);
        }
      },
      addInstantAttributeModifier: () => undefined,
      clearInstantAttributeModifiers: () => undefined,
      emitPreparationEvent: () => undefined,
      resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
      emitHealthSourceEvent: () => undefined,
      emitHealthTargetEvent: () => undefined,
      emitPoiseSourceEvent: () => undefined,
      emitPoiseTargetEvent: () => undefined,
      delegate: { execute: vi.fn(() => true), evaluate: vi.fn(() => false) },
    });

    executor.execute({
      kind: 'dealFixedDamage',
      parameters: { damageType: 'physical', value: 100, tags: ['ultimateSkill'] },
    });

    expect(targetVitals.health).toBe(900);
  });

  it('executes a standalone stagger step without entering the health damage path', () => {
    const targetVitals = new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      maxPoise: 100,
      poise: 100,
      poiseRecoveryTime: 1,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const receipt = new CombatReceiptCollector();
    const captureAttributeSnapshots = vi.fn();
    const emitPreparationEvent = vi.fn();
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: 'mifu',
      targetId: 'enemy',
      targetVitals,
      clock: new CombatClock(),
      receipt,
      captureAttributeSnapshots,
      criticalSamples: { nextCriticalSample: vi.fn() },
      resolveNonRandomRuntimeSnapshot: vi.fn(),
      applyDamageModifiers: vi.fn(),
      addInstantAttributeModifier: vi.fn(),
      clearInstantAttributeModifiers: vi.fn(),
      emitPreparationEvent,
      resolvePoiseMultipliers: () => ({ output: 1.5, taken: 2 }),
      emitHealthSourceEvent: vi.fn(),
      emitHealthTargetEvent: vi.fn(),
      emitPoiseSourceEvent: vi.fn(),
      emitPoiseTargetEvent: vi.fn(),
      delegate: { execute: vi.fn(() => true), evaluate: vi.fn(() => false) },
    });

    expect(executor.execute({ kind: 'dealStagger', parameters: { value: 20 } })).toBe(true);
    expect(targetVitals.health).toBe(1000);
    expect(targetVitals.poise).toBe(40);
    expect(captureAttributeSnapshots).not.toHaveBeenCalled();
    expect(emitPreparationEvent).not.toHaveBeenCalled();
    expect(receipt.entries.map(entry => entry.event)).toEqual(['PoiseApplied']);
  });

  it('resolves and scales dynamic stagger from the current action blackboard', () => {
    const targetVitals = new CombatVitals({
      health: 1000,
      maxHealth: 1000,
      maxPoise: 100,
      poise: 100,
      poiseRecoveryTime: 1,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: 'mifu',
      targetId: 'enemy',
      targetVitals,
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      captureAttributeSnapshots: vi.fn(),
      criticalSamples: { nextCriticalSample: vi.fn() },
      resolveNonRandomRuntimeSnapshot: vi.fn(),
      applyDamageModifiers: vi.fn(),
      addInstantAttributeModifier: vi.fn(),
      clearInstantAttributeModifiers: vi.fn(),
      emitPreparationEvent: vi.fn(),
      resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
      emitHealthSourceEvent: vi.fn(),
      emitHealthTargetEvent: vi.fn(),
      emitPoiseSourceEvent: vi.fn(),
      emitPoiseTargetEvent: vi.fn(),
      delegate: { execute: vi.fn(() => true), evaluate: vi.fn(() => false) },
    });

    executor.execute(
      {
        kind: 'dealStagger',
        parameters: {
          value: { kind: 'blackboard', key: 'poise' },
          valueMultiplier: { kind: 'blackboard', key: 'poise_scale' },
        },
      },
      { blackboard: new ActionBlackboard({ poise: 25, poise_scale: 0.5 }) },
    );

    expect(targetVitals.poise).toBe(87.5);
  });

  it('drives preparation events and both modifier stages before the formula', () => {
    const order: string[] = [];
    let attack = 100;
    let defense = 0;
    const targetVitals = new CombatVitals({
      health: 2000,
      maxHealth: 2000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: 'perlica',
      targetId: 'enemy',
      targetVitals,
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      captureAttributeSnapshots: () => {
        order.push('capture');
        return createAttributeSnapshots(attack, defense);
      },
      criticalSamples: { nextCriticalSample: () => 1 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      applyDamageModifiers: (timing, side, context) => {
        order.push(`${timing}:${side}`);
        if (timing === 'beforeCalculation' && side === 'attacker') {
          attack = 120;
          context.multiplyCalculationValue(1.5);
        }
        if (timing === 'afterCalculation' && side === 'attacker') {
          context.multiplyCalculationValue(2);
          context.damageScales.modify('attacker', 'product', 0.25);
        }
        if (timing === 'afterCalculation' && side === 'defender') defense = 100;
      },
      addInstantAttributeModifier: () => undefined,
      clearInstantAttributeModifiers: side => order.push(`clear:${side}`),
      emitPreparationEvent: event => order.push(event),
      resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
      emitHealthSourceEvent: () => undefined,
      emitHealthTargetEvent: () => undefined,
      emitPoiseSourceEvent: () => undefined,
      emitPoiseTargetEvent: () => undefined,
      delegate: { execute: vi.fn(() => true), evaluate: vi.fn(() => false) },
    });

    executor.execute({
      ...DAMAGE_STEP,
      parameters: { ...DAMAGE_STEP.parameters, stagger: undefined },
    });

    // 先计算 120 * 4 * 1.5 * 2 * 1.25，再由 100 点防御将结果减半。
    expect(targetVitals.health).toBe(1100);
    expect(order).toEqual([
      'capture',
      'beforeDamageAction',
      'beforeCalculateDamage',
      'beforeCalculation:attacker',
      'beforeCalculation:defender',
      'capture',
      'clear:attacker',
      'clear:defender',
      'afterCalculation:attacker',
      'afterCalculation:defender',
      'capture',
      'clear:attacker',
      'clear:defender',
    ]);
  });

  it('uses the enemy and per-hit multipliers for breaking-attack base damage', () => {
    const targetVitals = new CombatVitals({
      health: 2000,
      maxHealth: 2000,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const snapshots = createAttributeSnapshots();
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: 'zhuang-fangyi',
      targetId: 'enemy',
      targetVitals,
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      captureAttributeSnapshots: () => ({
        ...snapshots,
        defender: {
          ...snapshots.defender,
          breakingAttackDamageTakenMultiplier: 1.5,
        },
      }),
      criticalSamples: { nextCriticalSample: () => 1 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      applyDamageModifiers: () => undefined,
      addInstantAttributeModifier: () => undefined,
      clearInstantAttributeModifiers: () => undefined,
      emitPreparationEvent: () => undefined,
      resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
      emitHealthSourceEvent: () => undefined,
      emitHealthTargetEvent: () => undefined,
      emitPoiseSourceEvent: () => undefined,
      emitPoiseTargetEvent: () => undefined,
      delegate: { execute: vi.fn(() => true), evaluate: vi.fn(() => false) },
    });

    executor.execute({
      kind: 'dealDamage',
      parameters: {
        damageType: 'physical',
        attackScale: 4,
        calculation: 'breakingAttack',
        calculationMultiplier: 0.1,
        tags: ['normalAttack', 'powerAttack'],
      },
    });

    expect(targetVitals.health).toBeCloseTo(1940);
  });

  it('consumes one critical sample per HP unit only after the final critical-rate snapshot', () => {
    let criticalRate = 0;
    const nextCriticalSample = vi.fn(() => 0.5);
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: 'perlica',
      targetId: 'enemy',
      targetVitals: new CombatVitals({
        health: 10000,
        maxHealth: 10000,
        maxPoise: 100,
        poise: 100,
        poiseRecoveryTime: 1,
        poiseRecoveryTimeMultiplier: 1,
        poiseBrokenEndTime: 0,
        poiseImmune: false,
      }),
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      captureAttributeSnapshots: () => createAttributeSnapshots(100, 0, criticalRate),
      criticalSamples: { nextCriticalSample },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      applyDamageModifiers: timing => {
        if (timing === 'afterCalculation') criticalRate = 1;
      },
      addInstantAttributeModifier: () => undefined,
      clearInstantAttributeModifiers: () => undefined,
      emitPreparationEvent: () => undefined,
      resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
      emitHealthSourceEvent: () => undefined,
      emitHealthTargetEvent: () => undefined,
      emitPoiseSourceEvent: () => undefined,
      emitPoiseTargetEvent: () => undefined,
      delegate: { execute: vi.fn(() => true), evaluate: vi.fn(() => false) },
    });

    executor.execute(DAMAGE_STEP);
    expect(nextCriticalSample).toHaveBeenCalledTimes(1);

    criticalRate = 0;
    executor.execute({
      ...DAMAGE_STEP,
      parameters: { ...DAMAGE_STEP.parameters, stagger: undefined },
    });
    expect(nextCriticalSample).toHaveBeenCalledTimes(2);
  });

  it('uses a frozen source attribute for MultiplyAttributeCalculation damage', () => {
    const targetVitals = new CombatVitals({
      health: 5000,
      maxHealth: 5000,
      maxPoise: 100,
      poise: 100,
      poiseRecoveryTime: 1,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const snapshots = createAttributeSnapshots();
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: 'catcher',
      targetId: 'enemy',
      targetVitals,
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      captureAttributeSnapshots: () => ({
        ...snapshots,
        attacker: { ...snapshots.attacker, calculationAttributeValue: 200 },
      }),
      criticalSamples: { nextCriticalSample: () => 1 },
      resolveNonRandomRuntimeSnapshot: () => ({
        runtimeExtensionMultiplier: 1,
        appliesIgniteDamageMultiplier: false,
        appliesPhysicalInflictionDamageMultiplier: false,
      }),
      applyDamageModifiers: () => undefined,
      addInstantAttributeModifier: () => undefined,
      clearInstantAttributeModifiers: () => undefined,
      emitPreparationEvent: () => undefined,
      resolvePoiseMultipliers: () => ({ output: 1, taken: 1 }),
      emitHealthSourceEvent: () => undefined,
      emitHealthTargetEvent: () => undefined,
      emitPoiseSourceEvent: () => undefined,
      emitPoiseTargetEvent: () => undefined,
      delegate: { execute: vi.fn(() => true), evaluate: vi.fn(() => false) },
    });

    executor.execute({
      kind: 'dealDamage',
      parameters: {
        damageType: 'physical',
        calculation: 'attribute',
        calculationAttribute: 'Def',
        attackScale: 5,
        calculationAddition: 300,
        tags: [],
      },
    });

    expect(targetVitals.health).toBe(3700);
  });

  it('delegates operations outside the damage path', () => {
    const delegate = { execute: vi.fn(() => true), evaluate: vi.fn(() => false) };
    const executor = new PlayerDamageOperationExecutor({
      sourceOperatorId: 'perlica',
      targetId: 'enemy',
      targetVitals: new CombatVitals({
        health: 1,
        maxHealth: 1,
        maxPoise: 0,
        poise: 0,
        poiseRecoveryTime: 0,
        poiseRecoveryTimeMultiplier: 1,
        poiseBrokenEndTime: 0,
        poiseImmune: false,
      }),
      clock: new CombatClock(),
      receipt: new CombatReceiptCollector(),
      captureAttributeSnapshots: vi.fn(),
      criticalSamples: { nextCriticalSample: vi.fn() },
      resolveNonRandomRuntimeSnapshot: vi.fn(),
      applyDamageModifiers: vi.fn(),
      addInstantAttributeModifier: vi.fn(),
      clearInstantAttributeModifiers: vi.fn(),
      emitPreparationEvent: vi.fn(),
      resolvePoiseMultipliers: vi.fn(),
      emitHealthSourceEvent: () => undefined,
      emitHealthTargetEvent: () => undefined,
      emitPoiseSourceEvent: () => undefined,
      emitPoiseTargetEvent: () => undefined,
      delegate,
    });
    const step: ResolvedCombatStepForKind<'applyElementalInfliction'> = {
      kind: 'applyElementalInfliction',
      parameters: { element: 'electric', isExtra: false },
    };

    expect(executor.execute(step)).toBe(true);
    expect(delegate.execute).toHaveBeenCalledWith(step);
  });
});
import { DamageCalculationSnapshots } from './damageCalculationSnapshots';
import { compileGraphEntry } from '../../../test/compiledGraphEntry';
