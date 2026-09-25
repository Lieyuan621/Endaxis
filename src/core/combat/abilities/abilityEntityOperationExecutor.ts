import type { CombatCondition } from '../../game-data/operatorDefinition';
import type {
  CompiledAbilityEntityChildSkillProgram,
  ResolvedAbilityEntityDefinition,
  ResolvedCombatOperationStep,
} from '../../compiler/combatProgram';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { ActionBlackboard, resolveActionValueOperand } from '../actions/actionBlackboard';
import { compareCombatNumbers } from '../../../../packages/game-data-contract/src/primitives';
import type { LogicalAbilityEntityRuntime } from './logicalAbilityEntityRuntime';
import type {
  CombatOperationContext,
  CombatOperationExecutor,
  LaunchProjectile,
} from '../skills/skillRuntime';
import { AbilityEntityChildSkillRuntime } from './abilityEntityChildSkillRuntime';
import type { CombatSemanticEventRuntime } from '../events/combatSemanticEventRuntime';
import type { CallbackSkillHostFactory } from './callbackSkillHost';
import type { AbilityEntityChildSkillState } from '../state/abilityState';
import { AbilityEntityChildSkillPrograms } from './abilityEntityChildSkillPrograms';
import { CombatOperationPrograms } from '../actions/combatOperationPrograms';
import { operationProducer } from '../receipt/combatObjectIdentity';
import type { AbilityEntityActionState } from '../state/actionState';
import {
  createCombatOperationHostState,
  type CombatOperationHostState,
} from '../state/actionState';

type RuntimeOperation = ResolvedCombatOperationStep;

/** 将能力实体 DSL 步骤接到本场战斗唯一的逻辑实例目录。 */
export class AbilityEntityOperationExecutor implements CombatOperationExecutor {
  readonly #operatorId: string;
  readonly #entities: LogicalAbilityEntityRuntime;
  readonly #delegate: CombatOperationExecutor;
  readonly #childRuntimeDependencies?: {
    readonly resolveOperations: (state: CombatOperationHostState) => CombatOperationExecutor;
    readonly semanticEvents?: CombatSemanticEventRuntime;
    readonly launchProjectile?: LaunchProjectile;
    readonly createCallbackSkillHost?: CallbackSkillHostFactory;
    readonly installPassiveSkills?: (
      entity: RuntimeTargetRef,
      definition: ResolvedAbilityEntityDefinition,
    ) => void;
  };
  readonly #resolveDefinition?: (
    abilityEntityId: string,
  ) => ResolvedAbilityEntityDefinition | undefined;
  readonly #childSkillPrograms: AbilityEntityChildSkillPrograms;
  readonly runtimeState: AbilityEntityActionState;
  readonly programs: CombatOperationPrograms;

  constructor(
    operatorId: string,
    entities: LogicalAbilityEntityRuntime,
    delegate: CombatOperationExecutor,
    childRuntimeDependencies?: {
      readonly resolveOperations: (state: CombatOperationHostState) => CombatOperationExecutor;
      readonly semanticEvents?: CombatSemanticEventRuntime;
      readonly launchProjectile?: LaunchProjectile;
      readonly createCallbackSkillHost?: CallbackSkillHostFactory;
      readonly installPassiveSkills?: (
        entity: RuntimeTargetRef,
        definition: ResolvedAbilityEntityDefinition,
      ) => void;
      readonly programs?: AbilityEntityChildSkillPrograms;
    },
    resolveDefinition?: (abilityEntityId: string) => ResolvedAbilityEntityDefinition | undefined,
    restored?: {
      readonly state: AbilityEntityActionState;
      readonly programs: CombatOperationPrograms;
    },
  ) {
    this.#operatorId = operatorId;
    this.#entities = entities;
    this.#delegate = delegate;
    this.#childRuntimeDependencies = childRuntimeDependencies;
    this.#resolveDefinition = resolveDefinition;
    this.#childSkillPrograms =
      childRuntimeDependencies?.programs ?? new AbilityEntityChildSkillPrograms();
    this.runtimeState = restored?.state ?? { actionDurationEntities: new Map() };
    this.programs = restored?.programs ?? new CombatOperationPrograms();
  }

  /** 按实体定义和保存的 skillId 重建子技能程序绑定，不执行 Start。 */
  bindRestoredChildSkill(
    entity: RuntimeTargetRef,
    entityBlackboard: ActionBlackboard,
    state: AbilityEntityChildSkillState,
  ): AbilityEntityChildSkillRuntime {
    if (this.#childRuntimeDependencies === undefined || this.#resolveDefinition === undefined) {
      throw new Error('AbilityEntity child skill restore is not configured');
    }
    const snapshot = this.#entities.snapshot(entity);
    const definition = this.#resolveDefinition(snapshot.abilityEntityId);
    if (definition === undefined) {
      throw new Error(`AbilityEntity definition '${snapshot.abilityEntityId}' does not exist`);
    }
    const childSkill = this.#resolveSpawnChildSkill(definition, state.skillId);
    if (childSkill === undefined) {
      throw new Error(`AbilityEntity child skill '${state.skillId}' does not exist`);
    }
    const binding = this.#childSkillPrograms.resolve(state.programId);
    if (binding.program.skillId !== childSkill.skillId) {
      throw new Error(
        `AbilityEntity child program '${state.programId}' belongs to '${binding.program.skillId}', expected '${childSkill.skillId}'`,
      );
    }
    return this.#createChildRuntime(
      binding.program,
      entity,
      entityBlackboard,
      {
        blackboard: entityBlackboard,
        ...(snapshot.skillCastInfo == null ? {} : { skillCastInfo: snapshot.skillCastInfo }),
      },
      snapshot.skillCastInfo != null,
      { state },
    );
  }

  execute(step: RuntimeOperation, context?: CombatOperationContext): boolean {
    if (step.kind === 'findOwnerSpawnedAbilityEntities') {
      if (context?.targetContext === undefined) {
        throw new Error('AbilityEntity query requires a combat target context');
      }
      const ownerId =
        step.parameters.ownerContextKey === undefined
          ? this.#operatorId
          : this.#requireSingleOperatorTarget(
              context.targetContext.get(step.parameters.ownerContextKey),
              step.parameters.ownerContextKey,
            );
      let targets = this.#entities.findOwnerSpawned({
        ownerId,
        ...(step.parameters.abilityEntityIds === undefined
          ? {}
          : { abilityEntityIds: step.parameters.abilityEntityIds }),
        ...(step.parameters.sameSourceSkillCast
          ? {
              sourceSkillCastId:
                context.skillCastInfo?.skillCastId ??
                (() => {
                  throw new Error(
                    'AbilityEntity same-cast query requires inherited skill-cast info',
                  );
                })(),
            }
          : {}),
      });
      const circularOrder = step.parameters.circularOrder;
      if (circularOrder !== undefined) {
        if (targets.length !== circularOrder.desiredCount) {
          targets = [];
        } else {
          const indexed = new Array<RuntimeTargetRef | undefined>(targets.length);
          let valid = true;
          for (const target of targets) {
            const index = this.#entities
              .entityBlackboard(target)
              .getNumber(circularOrder.indexBlackboardKey);
            if (
              index === undefined ||
              !Number.isInteger(index) ||
              index < 0 ||
              index >= targets.length ||
              indexed[index] !== undefined
            ) {
              valid = false;
              break;
            }
            indexed[index] = target;
          }
          if (valid) {
            // 所有实例在零空间模型中共点；原生最近槽位回退的首个稳定起点为索引 0。
            const direction = circularOrder.reverseFlag < 0 ? 1 : -1;
            targets = indexed.map((_, offset) => {
              const index = (direction * offset + indexed.length) % indexed.length;
              return indexed[index]!;
            });
          }
        }
      }
      if (step.parameters.maxTargets !== undefined) {
        targets = targets.slice(0, step.parameters.maxTargets);
      }
      context.targetContext.set(step.parameters.saveToContextKey, targets);
      if (step.parameters.saveCountToBlackboardKey !== undefined) {
        context.blackboard.assignDynamic(step.parameters.saveCountToBlackboardKey, targets.length);
      }
      return true;
    }
    if (step.kind === 'pickContextTarget') {
      if (context?.targetContext === undefined) {
        throw new Error('Context target selection requires a combat target context');
      }
      const index = resolveActionValueOperand(step.parameters.index, context.blackboard);
      if (!Number.isInteger(index) || index < 0) {
        throw new RangeError('Context target index must be a non-negative integer');
      }
      const target = context.targetContext.get(step.parameters.sourceContextKey)[index];
      if (target === undefined) return false;
      context.targetContext.setSingle(step.parameters.saveToContextKey, target);
      return true;
    }
    if (step.kind === 'readAbilityEntityRemainingDuration') {
      if (context?.currentTarget === undefined) {
        throw new Error('AbilityEntity duration read requires a current Context target');
      }
      const remaining = this.#entities.snapshot(context.currentTarget).remainingDurationSeconds;
      if (remaining === null) {
        throw new Error('infinite AbilityEntity does not have a finite remaining duration');
      }
      context.blackboard.assignDynamic(step.parameters.outputKey, remaining);
      return true;
    }
    if (step.kind === 'setAbilityEntityRemainingDuration') {
      if (context?.currentTarget === undefined) {
        throw new Error('AbilityEntity duration assignment requires a current Context target');
      }
      this.#entities.setRemainingDuration(
        context.currentTarget,
        resolveActionValueOperand(step.parameters.value, context.blackboard),
      );
      return true;
    }
    if (step.kind === 'finishCurrentAbilityEntity') {
      if (context?.currentTarget === undefined) {
        throw new Error('AbilityEntity finish requires a current Context target');
      }
      if (this.#entities.isActive(context.currentTarget)) {
        this.#entities.kill(context.currentTarget, 'explicit');
      }
      return true;
    }
    if (step.kind === 'finishActionOwnerAbilityEntity') {
      if (context?.actionOwnerAbilityEntity === undefined) {
        throw new Error('AbilityEntity ActionOwner finish requires an entity child-skill context');
      }
      if (this.#entities.isActive(context.actionOwnerAbilityEntity)) {
        this.#entities.kill(context.actionOwnerAbilityEntity, 'explicit');
      }
      return true;
    }
    if (step.kind === 'finishCurrentAbilityEntityWhenSourceDies') {
      if (context?.currentTarget === undefined) {
        throw new Error('AbilityEntity source-death finish requires a current Context target');
      }
      if (this.#entities.isSourceDead(context.currentTarget)) {
        this.#entities.kill(context.currentTarget, 'sourceDied');
      }
      return true;
    }
    if (step.kind === 'startCurrentAbilityEntityChildSkill') {
      if (context?.currentTarget === undefined) {
        throw new Error('AbilityEntity child skill start requires a current Context target');
      }
      if (this.#childRuntimeDependencies === undefined) {
        throw new Error('AbilityEntity child skill runtime is not configured');
      }
      const childSkill = step.parameters.childSkill;
      this.#entities.startChildSkill(
        context.currentTarget,
        childSkill.skillId,
        (entity, entityBlackboard) =>
          this.#createChildRuntime(childSkill, entity, entityBlackboard, context),
      );
      return true;
    }
    if (step.kind === 'startCurrentAbilityEntityChildSkillById') {
      if (context?.currentTarget === undefined) {
        throw new Error('AbilityEntity child skill start requires a current Context target');
      }
      if (this.#childRuntimeDependencies === undefined || this.#resolveDefinition === undefined) {
        throw new Error(
          'AbilityEntity child skill runtime or definition resolver is not configured',
        );
      }
      const snapshot = this.#entities.snapshot(context.currentTarget);
      const definition = this.#resolveDefinition(snapshot.abilityEntityId);
      if (definition === undefined) {
        throw new Error(`AbilityEntity definition '${snapshot.abilityEntityId}' does not exist`);
      }
      const childSkill = this.#resolveSpawnChildSkill(definition, step.parameters.childSkillId);
      if (childSkill === undefined) {
        throw new Error(
          `AbilityEntity child skill '${step.parameters.childSkillId}' does not exist`,
        );
      }
      this.#entities.startChildSkill(
        context.currentTarget,
        childSkill.skillId,
        (entity, entityBlackboard) =>
          this.#createChildRuntime(childSkill, entity, entityBlackboard, context),
      );
      return true;
    }
    if (step.kind !== 'spawnAbilityEntity') return this.#delegate.execute(step, context);
    if (context === undefined) {
      throw new Error('spawnAbilityEntity requires a combat operation context');
    }
    const parameters = step.parameters;
    const inheritSourceSkillCastInfo = parameters.inheritSourceSkillCastInfo !== false;
    const definition =
      parameters.definition ?? this.#resolveDefinition?.(parameters.abilityEntityId);
    if (definition === undefined) {
      throw new Error(`AbilityEntity definition '${parameters.abilityEntityId}' does not exist`);
    }
    const explicitAssignments = Object.fromEntries(
      Object.entries(parameters.blackboardAssignments ?? {}).map(([key, operand]) => [
        key,
        resolveActionValueOperand(operand, context.blackboard),
      ]),
    );
    const stringAssignments = parameters.stringBlackboardAssignments ?? {};
    const assignments = {
      ...(parameters.inheritActionBlackboard ? context.blackboard.snapshot() : {}),
      ...explicitAssignments,
      ...stringAssignments,
    };
    const resolveDefinitionNumber = (
      value: number | { readonly blackboardKey: string; readonly fallback: number },
    ): number => {
      if (typeof value === 'number') return value;
      const assigned = assignments[value.blackboardKey];
      return typeof assigned === 'number' ? assigned : value.fallback;
    };
    const casterSource: RuntimeTargetRef = { kind: 'operator', operatorId: this.#operatorId };
    const currentAbilityEntitySource =
      context.actionOwnerAbilityEntity ??
      (context.currentTarget?.kind === 'abilityEntity' ? context.currentTarget : undefined);
    if (
      parameters.source === 'currentAbilityEntity' &&
      currentAbilityEntitySource === undefined &&
      parameters.dieWhenSourceDies
    ) {
      throw new Error(
        'spawnAbilityEntity source-death tracking requires a materialized current AbilityEntity source',
      );
    }
    // 投射物回调只保留独立动作/实体黑板，尚未把投射物物化进逻辑能力实体目录。
    // 当原生 dieWhenSourceDie=false 时，Source 身份不参与存活判定；此时以所属干员作为
    // 运行时代表，但契约中的 source 仍保留真实 ActionOwner 身份。需要跟随来源死亡的动作
    // 必须命中上面的严格门禁，不能套用这个简化。
    const source =
      parameters.source === 'currentAbilityEntity'
        ? (currentAbilityEntitySource ?? casterSource)
        : casterSource;
    const childSkill = this.#resolveSpawnChildSkill(definition, parameters.childSkillId);
    if (childSkill !== undefined && this.#childRuntimeDependencies === undefined) {
      throw new Error('spawnAbilityEntity child skill runtime is not configured');
    }
    const target =
      parameters.target === undefined
        ? undefined
        : parameters.target === 'enemy'
          ? ({ kind: 'enemy' } as const)
          : parameters.target === 'currentAbilityEntity'
            ? context.currentTarget
            : casterSource;
    if (parameters.target === 'currentAbilityEntity' && target === undefined) {
      throw new Error('spawnAbilityEntity currentAbilityEntity target requires a current target');
    }
    const entity = this.#entities.spawn({
      definitionProgramId: this.programs.slot(definition),
      producedBy: operationProducer(context),
      ...(!inheritSourceSkillCastInfo
        ? { skillCastInfo: null }
        : context.skillCastInfo === undefined
          ? {}
          : { skillCastInfo: context.skillCastInfo }),
      abilityEntityId: parameters.abilityEntityId,
      definition: {
        ...(definition.bornTags === undefined ? {} : { bornTags: definition.bornTags }),
        ...(definition.blackboard === undefined ? {} : { blackboard: definition.blackboard }),
        lifetime:
          definition.lifetime.kind === 'infinite'
            ? definition.lifetime
            : {
                kind: 'limited',
                durationSeconds: resolveDefinitionNumber(definition.lifetime.durationSeconds),
              },
        ...(definition.deathReleaseDelaySeconds === undefined
          ? {}
          : { deathReleaseDelaySeconds: definition.deathReleaseDelaySeconds }),
        ...(definition.maxStackingCount === undefined
          ? {}
          : { maxStackingCount: resolveDefinitionNumber(definition.maxStackingCount) }),
        ...(childSkill === undefined ? {} : { childSkill: { skillId: childSkill.skillId } }),
      },
      ownerId: this.#operatorId,
      source,
      ...(!inheritSourceSkillCastInfo || context.skillCastInfo === undefined
        ? {}
        : { sourceSkillCastId: context.skillCastInfo.skillCastId }),
      ...(target === undefined ? {} : { target }),
      ...(parameters.overrideDurationSeconds === undefined
        ? {}
        : {
            overrideDurationSeconds: resolveActionValueOperand(
              parameters.overrideDurationSeconds,
              context.blackboard,
            ),
          }),
      dieWhenSourceDies: parameters.dieWhenSourceDies,
      ...(Object.keys(assignments).length === 0 ? {} : { blackboardAssignments: assignments }),
      ...(childSkill === undefined
        ? {}
        : {
            createChildRuntime: (entity, entityBlackboard) =>
              this.#createChildRuntime(
                childSkill,
                entity,
                entityBlackboard,
                context,
                inheritSourceSkillCastInfo,
              ),
          }),
    });
    try {
      this.#childRuntimeDependencies?.installPassiveSkills?.(entity, definition);
    } catch (error) {
      try {
        if (this.#entities.isActive(entity)) this.#entities.finish(entity, 'explicit');
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          `AbilityEntity '${parameters.abilityEntityId}' passive installation and cleanup failed`,
        );
      }
      throw error;
    }
    if (parameters.saveToContextKey !== undefined) {
      if (context.targetContext === undefined) {
        throw new Error('spawnAbilityEntity context output requires a target context');
      }
      context.targetContext.setSingle(parameters.saveToContextKey, entity);
    }
    if (parameters.finishByAction) {
      const slot = this.programs.slot(step);
      this.runtimeState.actionDurationEntities.set(slot, [
        ...(this.runtimeState.actionDurationEntities.get(slot) ?? []),
        entity,
      ]);
    }
    return true;
  }

  #resolveSpawnChildSkill(
    definition: ResolvedAbilityEntityDefinition,
    requestedSkillId: string | undefined,
  ): CompiledAbilityEntityChildSkillProgram | undefined {
    if (requestedSkillId !== undefined) {
      if (definition.childSkill?.skillId === requestedSkillId) return definition.childSkill;
      const selected = definition.childSkills?.[requestedSkillId];
      if (selected !== undefined) return selected;
      throw new Error(`AbilityEntity child skill '${requestedSkillId}' does not exist`);
    }
    if (definition.childSkill !== undefined) return definition.childSkill;
    const children = Object.values(definition.childSkills ?? {});
    if (children.length <= 1) return children[0];
    throw new Error('AbilityEntity definition has multiple child skills but Spawn selected none');
  }

  #requireSingleOperatorTarget(targets: readonly RuntimeTargetRef[], contextKey: string): string {
    if (targets.length !== 1 || targets[0]?.kind !== 'operator') {
      throw new Error(
        `AbilityEntity query owner Context '${contextKey}' requires exactly one operator`,
      );
    }
    return targets[0].operatorId;
  }

  end(step: RuntimeOperation, context?: CombatOperationContext): void {
    if (step.kind === 'spawnAbilityEntity') {
      const slot = this.programs.slot(step);
      for (const entity of this.runtimeState.actionDurationEntities.get(slot) ?? []) {
        if (this.#entities.isActive(entity)) this.#entities.finish(entity, 'ownerFinished');
      }
      this.runtimeState.actionDurationEntities.delete(slot);
      return;
    }
    this.#delegate.end?.(step, context);
  }

  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    if (condition.kind === 'ownerSpawnedAbilityEntityPresent') {
      const sourceSkillCastId = condition.sameSourceSkillCast
        ? context?.skillCastInfo?.skillCastId
        : undefined;
      if (condition.sameSourceSkillCast && sourceSkillCastId === undefined) {
        throw new Error('AbilityEntity same-cast presence check requires SkillCastInfo');
      }
      return (
        this.#entities.findOwnerSpawned({
          ownerId: this.#operatorId,
          ...(condition.abilityEntityIds === undefined
            ? {}
            : { abilityEntityIds: condition.abilityEntityIds }),
          ...(sourceSkillCastId === undefined ? {} : { sourceSkillCastId }),
        }).length > 0
      );
    }
    if (condition.kind === 'contextTargetCountCompare') {
      if (context?.targetContext === undefined) {
        throw new Error('Context target count comparison requires a combat target context');
      }
      const count = context.targetContext.get(condition.contextKey).length;
      if (condition.outputKey !== undefined) {
        context.blackboard.assignDynamic(condition.outputKey, count);
      }
      return compareCombatNumbers(count, condition.value, condition.operator);
    }
    if (condition.kind === 'abilityEntityRemainingDurationCompare') {
      if (context?.currentTarget === undefined) {
        throw new Error('AbilityEntity duration comparison requires a current Context target');
      }
      const remaining = this.#entities.snapshot(context.currentTarget).remainingDurationSeconds;
      if (remaining === null) {
        throw new Error('infinite AbilityEntity does not have a finite remaining duration');
      }
      if (condition.outputKey !== undefined) {
        context.blackboard.assignDynamic(condition.outputKey, remaining);
      }
      return compareCombatNumbers(
        remaining,
        resolveActionValueOperand(condition.value, context.blackboard),
        condition.operator,
      );
    }
    return this.#delegate.evaluate(condition, context);
  }

  #createChildRuntime(
    program: CompiledAbilityEntityChildSkillProgram,
    entity: RuntimeTargetRef,
    entityBlackboard: ActionBlackboard,
    context: CombatOperationContext,
    inheritSourceSkillCastInfo = true,
    restored?: {
      readonly state: AbilityEntityChildSkillState;
    },
  ): AbilityEntityChildSkillRuntime {
    if (this.#childRuntimeDependencies === undefined) {
      throw new Error('AbilityEntity child skill runtime is not configured');
    }
    if (entity.kind !== 'abilityEntity') {
      throw new Error('AbilityEntity child skill requires an ability-entity runtime target');
    }
    // 程序共享，动作持有的运行态归每个子技能实例，不能靠复制步骤对象区分实例。
    const binding =
      restored === undefined
        ? this.#childSkillPrograms.register(program)
        : this.#childSkillPrograms.resolve(restored.state.programId);
    const instanceProgram = binding.program;
    const operationState =
      restored?.state.host.skill.operations ?? createCombatOperationHostState();
    const runtime = new AbilityEntityChildSkillRuntime(
      instanceProgram,
      {
        entity,
        entityBlackboard,
        operations: this.#childRuntimeDependencies.resolveOperations(operationState),
        source: this.#entities.snapshot(entity).source,
        skillHostGroup: this.#entities.childSkillHosts(entity),
        ownerOperatorId: this.#operatorId,
        ...(this.#childRuntimeDependencies.semanticEvents === undefined
          ? {}
          : { semanticEvents: this.#childRuntimeDependencies.semanticEvents }),
        ...(this.#childRuntimeDependencies.launchProjectile === undefined
          ? {}
          : {
              launchProjectile: this.#childRuntimeDependencies.launchProjectile,
            }),
        ...(this.#childRuntimeDependencies.createCallbackSkillHost === undefined
          ? {}
          : { createCallbackSkillHost: this.#childRuntimeDependencies.createCallbackSkillHost }),
        ...(!inheritSourceSkillCastInfo || context.skillCastInfo === undefined
          ? {}
          : { inheritedSkillCastInfo: context.skillCastInfo }),
        addAbilityChildBuff: child => this.#entities.addChildBuff(entity, child),
        programId: binding.id,
        damageSnapshotProgram: binding.damageSnapshots,
        operationState,
      },
      restored,
    );
    if (restored === undefined) {
      const owner = this.#entities.runtimeState.instances.get(entity.instanceId);
      if (owner === undefined) throw new Error('AbilityEntity child skill owner is missing');
      owner.childSkills.push(runtime.runtimeState);
    }
    return runtime;
  }
}
