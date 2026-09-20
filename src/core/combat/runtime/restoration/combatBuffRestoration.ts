/**
 * 协调整场战斗中所有 Buff 目标的恢复阶段。
 *
 * 调用方先创建敌人、干员和能力实体的容器外壳，再由本类重建全部实例。只有实例目录完整后，
 * 才绑定全局 Buff 父实例与跨容器关系。候选绑定失败后必须丢弃，不能继续使用半绑定的数据图。
 */
import type { ResolvedSkillBuffDefinition } from '../../../compiler/combatProgram';
import { logicalAbilityEntityRuntimeId } from '../../../game-data/logicalAbilityEntity';
import type { SkillGlobalBuffDefinition } from '../../../game-data/operatorDefinition';
import type { LogicalAbilityEntityRuntime } from '../../abilities/logicalAbilityEntityRuntime';
import type { BuffApplicationHandle, BuffOperationTarget } from '../../buffs/buffOperationExecutor';
import { buffReferenceKey } from '../../buffs/buffReference';
import type { GlobalBuffRuntime } from '../../buffs/globalBuffRuntime';
import type { BuffReference, GlobalBuffInstanceState } from '../../state/foundationState';
import type { BuffInstanceState } from '../../state/instanceState';
import type { AbilityEntityBuffRuntime } from '../combatRuntimeAssembly';

export interface CombatBuffRestorationOptions {
  readonly targets: ReadonlyMap<string, BuffOperationTarget>;
  readonly globalBuffs: GlobalBuffRuntime;
  readonly resolveDefinition: (
    definitionOwnerId: string,
    definitionId: string,
  ) => ResolvedSkillBuffDefinition | undefined;
  readonly resolveGlobalDefinition: (
    sourceId: string,
    id: string,
    sourceActionOwnerId: string | undefined,
    sourceActionId: string | undefined,
    definitionProgramId: number | null,
  ) => SkillGlobalBuffDefinition | undefined;
}

export interface RestoredCombatBuffTargetDirectoryOptions {
  readonly enemyState: import('../../state/instanceState').BuffContainerState<string> | null;
  readonly enemyTarget: BuffOperationTarget;
  readonly operatorStates: ReadonlyMap<
    string,
    import('../../state/instanceState').BuffContainerState<string> | null
  >;
  readonly operatorTargets: ReadonlyMap<string, BuffOperationTarget>;
  readonly abilityEntities: LogicalAbilityEntityRuntime;
  readonly createAbilityEntityTarget: Parameters<typeof bindRestoredAbilityEntityBuffTargets>[1];
}

/**
 * 收齐完整恢复候选中的敌人、干员和能力实体 Buff 目标。
 * 所有外壳必须直接绑定候选图里的容器数据；缺少端口或多出目标都会在实例绑定前失败。
 */
export function collectRestoredCombatBuffTargets(
  options: RestoredCombatBuffTargetDirectoryOptions,
): ReadonlyMap<string, BuffOperationTarget> {
  const targets = new Map<string, BuffOperationTarget>();
  const add = (
    ownerId: string,
    state: import('../../state/instanceState').BuffContainerState<string> | null,
    target: BuffOperationTarget | undefined,
  ) => {
    if (state === null) throw new Error(`restored Buff target '${ownerId}' has no saved data`);
    if (target === undefined) throw new Error(`restored Buff target '${ownerId}' has no binding`);
    if (target.ownerId !== ownerId) {
      throw new Error(`restored Buff target '${ownerId}' is bound to owner '${target.ownerId}'`);
    }
    if (target.runtimeState !== state) {
      throw new Error(`restored Buff target '${ownerId}' does not bind its saved state`);
    }
    if (targets.has(ownerId)) throw new Error(`duplicate restored Buff target '${ownerId}'`);
    targets.set(ownerId, target);
  };

  add('enemy', options.enemyState, options.enemyTarget);
  for (const [operatorId, state] of options.operatorStates) {
    add(operatorId, state, options.operatorTargets.get(operatorId));
  }
  for (const operatorId of options.operatorTargets.keys()) {
    if (!options.operatorStates.has(operatorId)) {
      throw new Error(`restored Buff target '${operatorId}' has no operator state`);
    }
  }
  for (const runtime of bindRestoredAbilityEntityBuffTargets(
    options.abilityEntities,
    options.createAbilityEntityTarget,
  ).values()) {
    add(runtime.ownerId, runtime.runtimeState ?? null, runtime);
  }
  return targets;
}

/**
 * 为恢复目录中已经创建过 Buff 容器的能力实体重建目标外壳。
 * 返回表按实例编号索引，可同时加入整场 Buff 协调器和装配根的实体目标目录。
 */
export function bindRestoredAbilityEntityBuffTargets(
  entities: LogicalAbilityEntityRuntime,
  create: (
    entityId: string,
    entityBlackboard: import('../../actions/actionBlackboard').ActionBlackboard,
    target: { readonly kind: 'abilityEntity'; readonly instanceId: number },
    bornTags: readonly import('../../tags/gameplayTags').GameplayTag[],
    restoredState: import('../../state/instanceState').BuffContainerState<string>,
  ) => AbilityEntityBuffRuntime,
): ReadonlyMap<number, AbilityEntityBuffRuntime> {
  const targets = new Map<number, AbilityEntityBuffRuntime>();
  for (const [instanceId, state] of entities.runtimeState.instances) {
    if (!state.buffContainerCreated) {
      if (state.buffs !== null) {
        throw new Error(`AbilityEntity '${instanceId}' has Buff data without a created container`);
      }
      continue;
    }
    if (state.buffs === null) {
      throw new Error(`AbilityEntity '${instanceId}' created Buff container has no saved data`);
    }
    const target = { kind: 'abilityEntity' as const, instanceId };
    const entityId = logicalAbilityEntityRuntimeId(instanceId);
    const runtime = create(
      entityId,
      entities.entityBlackboard(target),
      target,
      state.definition.bornTags ?? [],
      state.buffs,
    );
    if (runtime.ownerId !== entityId || runtime.runtimeState !== state.buffs) {
      throw new Error(`AbilityEntity '${instanceId}' Buff target does not bind its saved state`);
    }
    targets.set(instanceId, runtime);
  }
  return targets;
}

type RestorationPhase = 'ready' | 'instancesBound' | 'relationsBound' | 'failed';

export class CombatBuffRestoration {
  #phase: RestorationPhase = 'ready';
  readonly #globalParentByChild = new Map<string, GlobalBuffInstanceState>();

  constructor(readonly options: CombatBuffRestorationOptions) {
    for (const [ownerId, target] of options.targets) {
      if (target.ownerId !== ownerId) {
        throw new Error(`Buff target '${ownerId}' is bound to owner '${target.ownerId}'`);
      }
    }
    for (const group of options.globalBuffs.runtimeState.groups.values()) {
      for (const parent of group) {
        for (const child of parent.children) {
          const key = buffReferenceKey(child);
          if (this.#globalParentByChild.has(key)) {
            throw new Error(`Buff child '${key}' belongs to more than one global Buff`);
          }
          this.#globalParentByChild.set(key, parent);
        }
      }
    }
  }

  /** 重建全部普通实例，再接回引用这些实例的全局父目录。 */
  bindInstances(): void {
    if (this.#phase !== 'ready') throw new Error(`Buff restoration phase is '${this.#phase}'`);
    try {
      for (const target of this.options.targets.values()) {
        const state = target.runtimeState;
        if (state === undefined) throw new Error(`Buff target '${target.ownerId}' has no state`);
        if (state.instances.size === 0) continue;
        if (target.bindRestoredDefinitionInstances === undefined) {
          throw new Error(`Buff target '${target.ownerId}' cannot restore instances`);
        }
        target.bindRestoredDefinitionInstances(
          (definitionId, definitionOwnerId) =>
            this.options.resolveDefinition(definitionOwnerId, definitionId),
          instance => this.#instanceOptions(instance),
        );
      }
      this.options.globalBuffs.bindRestoredInstances({
        resolveDefinition: this.options.resolveGlobalDefinition,
        resolveChild: reference => this.#resolveHandle(reference),
      });
      this.#phase = 'instancesBound';
    } catch (error) {
      this.#phase = 'failed';
      throw error;
    }
  }

  /** 所有普通实例和全局父实例存在后，统一接回父子及 SkillAffix 对象关系。 */
  bindRelations(): void {
    if (this.#phase !== 'instancesBound') {
      throw new Error(`Buff restoration phase is '${this.#phase}'`);
    }
    try {
      for (const target of this.options.targets.values()) {
        if ((target.runtimeState?.instances.size ?? 0) === 0) continue;
        if (target.bindRestoredRelations === undefined) {
          throw new Error(`Buff target '${target.ownerId}' cannot restore relations`);
        }
        target.bindRestoredRelations(reference => this.#resolveHandle(reference));
      }
      this.#phase = 'relationsBound';
    } catch (error) {
      this.#phase = 'failed';
      throw error;
    }
  }

  #instanceOptions(state: BuffInstanceState<string>) {
    const reference = state.identity;
    const parent = this.#globalParentByChild.get(
      buffReferenceKey({ ownerId: reference.ownerId, instanceId: reference.instanceId }),
    );
    const sourceAttributeOwnerId = state.sourceAttributeOwnerId;
    let sourceAttribute:
      | {
          readonly sourceAttributeOwnerId: string;
          readonly getSourceAttributeValue: (attribute: string) => number;
        }
      | undefined;
    if (sourceAttributeOwnerId !== null) {
      const source = this.options.targets.get(sourceAttributeOwnerId);
      if (source?.getAttributeValue === undefined) {
        throw new Error(
          `Buff '${buffReferenceKey(reference)}' source attribute owner '${sourceAttributeOwnerId}' is missing`,
        );
      }
      sourceAttribute = {
        sourceAttributeOwnerId,
        getSourceAttributeValue: source.getAttributeValue.bind(source),
      };
    }
    return {
      ...(parent === undefined
        ? {}
        : {
            finishParentGlobalBuff: (reason: 'early' | 'other') =>
              this.options.globalBuffs.finishInstance(parent, reason),
          }),
      ...sourceAttribute,
    };
  }

  #resolveHandle(reference: BuffReference): BuffApplicationHandle | undefined {
    return this.options.targets.get(reference.ownerId)?.resolveHandle?.(reference);
  }
}
