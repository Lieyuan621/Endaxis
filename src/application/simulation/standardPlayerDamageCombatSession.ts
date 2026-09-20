import type { CombatStateGraph } from '../../core/combat/state/combatState';
import {
  CombatRuntimeAssembly,
  getCombatRuntimeInputRules,
  type CombatRuntimeAssemblyOptions,
} from '../../core/combat/runtime/combatRuntimeAssembly';
import {
  CombatRuntimeSession,
  type CombatRuntimeCheckpoint,
  type RestoreCombatRuntimeAssembly,
} from '../../core/combat/runtime/combatRuntimeSession';
import type { RestoredCombatEnvironmentInput } from '../../core/combat/runtime/restoration/combatRuntimeRestoreFoundation';
import {
  collectStandardPlayerDamageStateGraphResult,
  type StandardPlayerDamageScenarioResult,
} from './runStandardPlayerDamageScenarioSimulation';

interface CombatProgramTree {
  readonly abilityEntities: CombatRuntimeAssembly['abilityEntityChildSkillPrograms'];
  readonly operations: CombatRuntimeAssembly['combatOperationPrograms'];
  readonly projectileCallbacks: CombatRuntimeAssembly['projectileLifetimes']['callbackPrograms'];
  readonly timeDilation: NonNullable<CombatRuntimeAssembly['timeDilation']>['programs'] | null;
}

/** 应用层对完整战斗会话、固定程序树和当前候选输入的组合。 */
export class StandardPlayerDamageCombatSession {
  readonly #programs: CombatProgramTree;

  constructor(
    readonly runtime: CombatRuntimeSession,
    readonly compiled: CombatRuntimeAssemblyOptions,
    readonly environment: RestoredCombatEnvironmentInput,
    programs: CombatProgramTree,
  ) {
    this.#programs = programs;
  }

  advanceToFrame(endFrame: number): void {
    if (!Number.isInteger(endFrame) || endFrame < this.runtime.frame) {
      throw new RangeError('endFrame must be an integer at or after the current combat frame');
    }
    this.runtime.advanceFrames(endFrame - this.runtime.frame);
  }

  collectResult(): StandardPlayerDamageScenarioResult {
    return collectStandardPlayerDamageStateGraphResult(
      this.runtime.readState(),
      this.compiled,
      this.runtime.readHistory(),
    );
  }

  fork(
    checkpoint: CombatRuntimeCheckpoint,
    compiled: CombatRuntimeAssemblyOptions = this.compiled,
    environment: RestoredCombatEnvironmentInput = this.environment,
  ): StandardPlayerDamageCombatSession {
    const restore = createRestoreAssembly(compiled, environment, this.#programs);
    return new StandardPlayerDamageCombatSession(
      this.runtime.fork(checkpoint, restore),
      compiled,
      environment,
      this.#programs,
    );
  }
}

/** 从已编译标准战斗创建可保存、分叉并使用正式结果投影的应用会话。 */
export function createStandardPlayerDamageCombatSession(
  compiled: CombatRuntimeAssemblyOptions,
  environment: RestoredCombatEnvironmentInput,
): StandardPlayerDamageCombatSession {
  const assembly = new CombatRuntimeAssembly(compiled);
  const programs: CombatProgramTree = {
    abilityEntities: assembly.abilityEntityChildSkillPrograms,
    operations: assembly.combatOperationPrograms,
    projectileCallbacks: assembly.projectileLifetimes.callbackPrograms,
    timeDilation: assembly.timeDilation?.programs ?? null,
  };
  return new StandardPlayerDamageCombatSession(
    new CombatRuntimeSession(assembly, createRestoreAssembly(compiled, environment, programs)),
    compiled,
    environment,
    programs,
  );
}

function createRestoreAssembly(
  compiled: CombatRuntimeAssemblyOptions,
  environment: RestoredCombatEnvironmentInput,
  programs: CombatProgramTree,
): RestoreCombatRuntimeAssembly {
  return (graph: CombatStateGraph, skillPrograms, receiptHistory) =>
    CombatRuntimeAssembly.restore({
      receiptHistory,
      graph,
      resources: compiled.resources,
      enemy: compiled.enemy,
      operators: compiled.operators,
      ...(compiled.consumables === undefined ? {} : { consumables: compiled.consumables }),
      ...(compiled.consumableUses === undefined ? {} : { consumableUses: compiled.consumableUses }),
      ...(compiled.inputs === undefined ? {} : { inputs: compiled.inputs }),
      ...(compiled.dodgeInputs === undefined ? {} : { dodgeInputs: compiled.dodgeInputs }),
      ...getCombatRuntimeInputRules(compiled),
      ...(compiled.skillInputGroups === undefined
        ? {}
        : { skillInputGroups: compiled.skillInputGroups }),
      ...(compiled.externalEvents === undefined ? {} : { externalEvents: compiled.externalEvents }),
      environment,
      abilityEntityChildSkillPrograms: programs.abilityEntities,
      combatOperationPrograms: programs.operations,
      combatSkillPrograms: skillPrograms,
      projectileCallbackPrograms: programs.projectileCallbacks,
      ...(compiled.timeDilation === undefined || programs.timeDilation === null
        ? {}
        : {
            timeDilation: {
              config: compiled.timeDilation.config,
              programs: programs.timeDilation,
            },
          }),
      ...(compiled.enemyStatusContainer === undefined
        ? {}
        : { enemyStatusContainer: compiled.enemyStatusContainer }),
    });
}
