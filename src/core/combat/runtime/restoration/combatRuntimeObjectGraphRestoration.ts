/**
 * 在共享环境和能力实体外壳就绪后，按固定顺序建立整场对象图并提交跨对象关系。
 *
 * 调用前候选图必须已经通过整图预检。任一阶段失败时，整个候选都不可继续使用。
 */
import {
  bindRestoredCombatRuntimeAbilityEntityRelations,
  type RestoreCombatRuntimeAbilityEntityRelationsOptions,
  type RestoredCombatRuntimeAbilityEntityRelations,
} from './combatRuntimeAbilityEntityRelationRestoration';
import type { RestoredCombatAbilityEntityDirectory } from './combatRuntimeAbilityEntityRestoration';
import {
  bindRestoredCombatBuffInstances,
  type RestoreCombatBuffInstancesOptions,
  type RestoredCombatBuffInstances,
} from './combatRuntimeBuffInstanceRestoration';
import { configureRestoredCombatObjectReferences } from './combatRuntimeObjectReferenceRestoration';
import {
  bindRestoredCombatRuntimeOperators,
  type RestoreCombatRuntimeOperatorsOptions,
  type RestoredCombatRuntimeOperators,
} from './combatRuntimeOperatorRestoration';
import {
  bindRestoredCombatProjectileRelations,
  createRestoredCombatProjectileDirectory,
  type ProjectileCallbackRestoreBindings,
} from './combatRuntimeProjectileRestoration';
import type { CombatRuntimeRestorePreparation } from './combatRuntimeRestorePreparation';
import type { RestoredCombatRuntimeFoundation } from './combatRuntimeRestoreFoundation';
import type { ProjectileCallbackPrograms } from '../../abilities/projectileCallbackPrograms';
import type { ProjectileCallbackState } from '../../state/instanceState';
import type { ProjectileLifecycleRuntime } from '../../abilities/projectileLifecycleRuntime';

export interface RestoreCombatRuntimeObjectGraphOptions {
  readonly preparation: CombatRuntimeRestorePreparation;
  readonly foundation: RestoredCombatRuntimeFoundation;
  readonly entities: RestoredCombatAbilityEntityDirectory;
  readonly callbackPrograms: ProjectileCallbackPrograms;
  /** 完整装配可先建立并公开目录，使随后创建的操作链只闭包当前恢复分支。 */
  readonly projectiles?: ProjectileLifecycleRuntime;
  readonly buffs: Omit<
    RestoreCombatBuffInstancesOptions,
    'preparation' | 'foundation' | 'entities'
  >;
  readonly operators: Omit<
    RestoreCombatRuntimeOperatorsOptions,
    'preparation' | 'foundation' | 'entities'
  >;
  readonly abilityEntityRelations: Omit<
    RestoreCombatRuntimeAbilityEntityRelationsOptions,
    'preparation' | 'foundation' | 'entities' | 'operators'
  >;
  readonly createProjectileCallbackBindings: (input: {
    readonly instanceId: number;
    readonly definitionOperatorId: string;
    readonly state: ProjectileCallbackState;
  }) => ProjectileCallbackRestoreBindings;
}

export interface RestoredCombatRuntimeObjectGraph {
  readonly projectiles: ProjectileLifecycleRuntime;
  readonly buffs: RestoredCombatBuffInstances;
  readonly operators: RestoredCombatRuntimeOperators;
  readonly abilityEntityRelations: RestoredCombatRuntimeAbilityEntityRelations;
}

export function bindRestoredCombatRuntimeObjectGraph(
  options: RestoreCombatRuntimeObjectGraphOptions,
): RestoredCombatRuntimeObjectGraph {
  const shared = {
    preparation: options.preparation,
    foundation: options.foundation,
    entities: options.entities,
  };
  const projectiles =
    options.projectiles ??
    createRestoredCombatProjectileDirectory({
      preparation: options.preparation,
      foundation: options.foundation,
      callbackPrograms: options.callbackPrograms,
    });
  if (projectiles.runtimeState !== options.preparation.graph.instances.projectiles) {
    throw new Error('restored projectile directory uses another state');
  }
  if (projectiles.callbackPrograms !== options.callbackPrograms) {
    throw new Error('restored projectile directory uses another callback program directory');
  }
  configureRestoredCombatObjectReferences({ entities: options.entities, projectiles });
  const buffs = bindRestoredCombatBuffInstances({ ...shared, ...options.buffs });
  const operators = bindRestoredCombatRuntimeOperators({ ...shared, ...options.operators });

  operators.bindRestoredChildren();
  const abilityEntityRelations = bindRestoredCombatRuntimeAbilityEntityRelations({
    ...shared,
    operators,
    ...options.abilityEntityRelations,
  });
  bindRestoredCombatProjectileRelations({
    projectiles,
    foundation: options.foundation,
    entities: options.entities,
    createCallbackBindings: options.createProjectileCallbackBindings,
  });
  buffs.restoration.bindRelations();

  return { projectiles, buffs, operators, abilityEntityRelations };
}
