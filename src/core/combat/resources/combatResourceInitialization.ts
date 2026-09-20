/** 从用户配置快照校验并建立共享资源数据。 */
import type { GameplayTag } from '../tags/gameplayTags';
import type { CombatResourceSnapshot } from './combatResources';
import type { CombatResourceState, OperatorResources } from '../state/environmentState';

export function createCombatResourceState(snapshot: CombatResourceSnapshot): CombatResourceState {
  const dashEnergy = snapshot.dashEnergy ?? {
    spent: 0,
    capacity: null,
    inOverdraft: false,
  };
  requireNonNegativeFinite(dashEnergy.spent, 'dashEnergy.spent');
  if (dashEnergy.capacity !== null) {
    requireNonNegativeFinite(dashEnergy.capacity, 'dashEnergy.capacity');
    if (dashEnergy.spent > dashEnergy.capacity + 1)
      throw new RangeError('dashEnergy.spent exceeds the native overdraft boundary');
  }
  requireNonNegativeFinite(snapshot.sp, 'sp');
  requireNonNegativeFinite(snapshot.maxSp, 'maxSp');
  requireNonNegativeFinite(snapshot.returnedSp, 'returnedSp');
  requireNonNegativeFinite(snapshot.spRecovery.valuePerSecond, 'spRecovery.valuePerSecond');
  requireNonNegativeFinite(snapshot.spRecovery.pauseDuration, 'spRecovery.pauseDuration');
  requireNonNegativeFinite(snapshot.spRecovery.pauseRemaining, 'spRecovery.pauseRemaining');
  if (snapshot.sp > snapshot.maxSp + RESOURCE_EPSILON)
    throw new RangeError('sp exceeds its maximum');
  if (snapshot.returnedSp > snapshot.sp + RESOURCE_EPSILON)
    throw new RangeError('returnedSp exceeds current sp');
  requireFinite(
    snapshot.normalSkillUltimateEnergy.selfGainPerSp,
    'normalSkillUltimateEnergy.selfGainPerSp',
  );
  requireFinite(
    snapshot.normalSkillUltimateEnergy.otherGainPerSp,
    'normalSkillUltimateEnergy.otherGainPerSp',
  );
  if (!Number.isFinite(snapshot.sharedSpGain.baseGainEfficiency))
    throw new TypeError('base shared SP gain efficiency must be finite');

  const operators = new Map<string, OperatorResources>();
  const baseUltimateRecoveryRestrictions = new Map<string, ReadonlySet<GameplayTag> | null>();
  const squad = snapshot.squad.map((member, index) => {
    if (member.operatorId.length === 0)
      throw new Error(`squad[${index}].operatorId must not be empty`);
    requireNonNegativeFinite(member.ultimateEnergy, `squad[${index}].ultimateEnergy`);
    requireNonNegativeFinite(member.maxUltimateEnergy, `squad[${index}].maxUltimateEnergy`);
    requireFinite(
      member.ultimateEnergyGainMultiplier,
      `squad[${index}].ultimateEnergyGainMultiplier`,
    );
    if (member.ultimateEnergy > member.maxUltimateEnergy + ULTIMATE_ENERGY_EPSILON)
      throw new RangeError(`squad[${index}].ultimateEnergy exceeds its maximum`);
    if (operators.has(member.operatorId))
      throw new Error(`duplicate squad operator '${member.operatorId}'`);
    const runtime: OperatorResources = {
      ...member,
      ultimateEnergy: Math.fround(member.ultimateEnergy),
      allowedUltimateEnergyRecoveryTags:
        member.allowedUltimateEnergyRecoveryTags === null
          ? null
          : new Set(member.allowedUltimateEnergyRecoveryTags),
    };
    operators.set(member.operatorId, runtime);
    baseUltimateRecoveryRestrictions.set(
      member.operatorId,
      member.allowedUltimateEnergyRecoveryTags === null
        ? null
        : new Set(member.allowedUltimateEnergyRecoveryTags),
    );
    return runtime;
  });
  return {
    dashEnergy: { ...dashEnergy },
    sp: snapshot.sp,
    maxSp: snapshot.maxSp,
    returnedSp: snapshot.returnedSp,
    spRecoveryPerSecond: snapshot.spRecovery.valuePerSecond,
    spRecoveryPauseDuration: snapshot.spRecovery.pauseDuration,
    spRecoveryPauseRemaining: snapshot.spRecovery.pauseRemaining,
    ultimateEnergySystemUnlocked: snapshot.ultimateEnergySystemUnlocked,
    normalSkillUltimateEnergy: { ...snapshot.normalSkillUltimateEnergy },
    squad,
    operators,
    baseUltimateRecoveryRestrictions,
    ultimateRecoveryRestrictionHandles: new Map(),
    nextUltimateRecoveryRestrictionHandle: 1,
    sharedSpGainModifiers: { modifiers: [] },
    sharedSpRecoveryModifiers: { modifiers: [] },
  };
}

const RESOURCE_EPSILON = 0.0001;
const ULTIMATE_ENERGY_EPSILON = Math.fround(0.00001);

function requireNonNegativeFinite(value: number, path: string): void {
  if (!Number.isFinite(value) || value < 0)
    throw new RangeError(`${path} must be a non-negative finite number`);
}

function requireFinite(value: number, path: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${path} must be a finite number`);
}
