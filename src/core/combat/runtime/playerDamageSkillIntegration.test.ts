import type { SkillDefinition } from '../../../../packages/game-data-contract/src/skills.ts';
import { describe, expect, it } from 'vitest';
import { perlica } from '../../../data/operators/perlica.generated';
import { createEnemyElementalBuffRuntime } from '../../../test/elementalBuffFixture';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { compileSkill } from '../../compiler/compileSkill';
import { ActionGraphDefinitionRepository } from '../../compiler/actionGraphDefinitionRepository';

import {
  DAMAGE_SCALE_ATTRIBUTE_KEYS,
  type DamageScaleAttributeSnapshot,
} from '../damage/damageScaleAttributes';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { CombatResources } from '../resources/combatResources';
import { CombatSimulation } from './combatSimulation';
import { CombatVitals } from '../resources/combatVitals';
import type { CombatEnemyProgram } from './combatRuntimeAssembly';
import { createPlayerActiveOperationExecutorForElementalTarget } from '../damage/playerActiveOperationExecutor';
import { SkillResourceOperationExecutor } from '../resources/skillResourceOperationExecutor';
import { SkillRuntime, type CombatOperationExecutor } from '../skills/skillRuntime';
import { CombatSemanticEventRuntime } from '../events/combatSemanticEventRuntime';

function findPerlicaBattleSkill(): SkillDefinition {
  const group = perlica.skillGroups.find(candidate => candidate.key === 'battleSkill');
  if (group === undefined) throw new Error('missing Perlica battle-skill group');
  const skills = Array.isArray(group.skills) ? group.skills : [group.skills];
  const skill = skills.find(candidate => candidate.key === 'chr_0004_pelica_normal_skill');
  if (skill === undefined) throw new Error('missing Perlica battle skill');
  return skill;
}

describe('Perlica standard damage slice', () => {
  it('orders cost, infliction, health damage, poise damage, and energy gain', () => {
    const clock = new CombatClock();
    const receipt = new CombatReceiptCollector();
    const resources = new CombatResources({
      sp: 100,
      maxSp: 300,
      returnedSp: 0,
      sharedSpGain: { baseGainEfficiency: 1 },
      spRecovery: { valuePerSecond: 10, pauseDuration: 1, pauseRemaining: 0 },
      ultimateEnergySystemUnlocked: true,
      normalSkillUltimateEnergy: { selfGainPerSp: 0.1, otherGainPerSp: 0.2 },
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
    const unresolvedOperations: CombatOperationExecutor = {
      execute: step => {
        if (step.kind === 'findCharacterTeamTargets') return true;
        throw new Error(`unexpected unresolved operation '${step.kind}'`);
      },
      evaluate: () => false,
    };
    const program = compileSkill({
      operatorId: 'perlica',
      skillGroupKey: 'battleSkill',
      skillType: 'battleSkill',
      skillLevel: 12,
      skill: findPerlicaBattleSkill(),
      programs: new ActionGraphDefinitionRepository(),
    });
    const elementalTarget = createEnemyElementalBuffRuntime({
      attributes: new CombatAttributeSet(),
      emitElementalInflictionStarted: () => undefined,
      onSpellBurstTriggered: () => undefined,
    });
    const operations = createPlayerActiveOperationExecutorForElementalTarget({
      context: {
        program,
        enemy: {
          source: { kind: 'custom', level: 90 },
          rank: 'mob',
          health: 1000,
          superArmor: 0,
          defenderAttributes: {
            defense: 0,
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
          stagger: {
            maximum: 100,
            knotThresholds: [0.5],
            knotBreakDurationFrames: 30,
            brokenDurationFrames: 300,
            finisherSpRecovery: 100,
          },
        } satisfies CombatEnemyProgram,
        equipmentContributions: [],
        clock,
        resources,
        receipt,
        semanticEvents: new CombatSemanticEventRuntime(),
      },
      targetId: 'enemy',
      targetVitals,
      elementalTarget,
      delegate: unresolvedOperations,
      damage: {
        captureAttributeSnapshots: () => ({
          attacker: {
            ...(Object.fromEntries(
              DAMAGE_SCALE_ATTRIBUTE_KEYS.map(key => [key, 0]),
            ) as unknown as DamageScaleAttributeSnapshot),
            attack: 100,
            criticalRate: 0,
            criticalDamageIncrease: 0.5,
            weaknessDamageMultiplier: 1,
            igniteDamageMultiplier: 1,
            physicalInflictionDamageMultiplier: 1,
          },
          defender: {
            ...(Object.fromEntries(
              DAMAGE_SCALE_ATTRIBUTE_KEYS.map(key => [key, 0]),
            ) as unknown as DamageScaleAttributeSnapshot),
            defense: 0,
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
      },
      inflictionEvents: {
        emitSourceEvent: () => undefined,
        emitTargetEvent: () => undefined,
      },
    });
    let runtime: SkillRuntime;
    const resourceOperations = new SkillResourceOperationExecutor({
      sourceOperatorId: 'perlica',
      sourceActionId: 'battleSkill',
      clock,
      resources,
      receipt,
      getNonReturnedSpCost: () => runtime.nonReturnedSpCost,
      finisherSpRecovery: 100,
      delegate: operations,
    });
    runtime = new SkillRuntime(program, {
      clock,
      resources,
      receipt,
      operations: resourceOperations,
      allocateSkillCastId: () => 1,
    });
    const simulation = new CombatSimulation(clock);
    simulation.add(runtime);

    expect(runtime.tryStart()).toBe(true);
    simulation.advanceFrames(13);

    expect(targetVitals.health).toBe(600);
    expect(targetVitals.poise).toBe(90);
    expect(elementalTarget.createInflictionAdapter('assertion').getExistingAttachment()).toEqual({
      element: 'electric',
      layers: 1,
    });
    expect(resources.sp).toBe(0);
    expect(resources.getUltimateEnergy('perlica')).toBe(10);
    expect(
      receipt.entries
        .filter(entry =>
          [
            'SkillCostApplied',
            'ElementalInflictionApplied',
            'DamageApplied',
            'PoiseApplied',
            'UltimateEnergyChanged',
          ].includes(entry.event),
        )
        .map(entry => entry.event),
    ).toEqual([
      'SkillCostApplied',
      'ElementalInflictionApplied',
      'DamageApplied',
      'PoiseApplied',
      'UltimateEnergyChanged',
    ]);
  });
});
