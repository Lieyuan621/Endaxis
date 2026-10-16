import { runtimeTargetEntityId } from '../../game-data/logicalAbilityEntity';
import type { TargetContextOperationExecutor } from './targetContextOperationExecutor';
import {
  valueInputBlackboardKey,
  type CompiledCondition,
} from '../../compiler/compiledGraphData.ts';

import type {
  CompiledAbilityEntityChildSkillProgram,
  ResolvedAbilityEntityDefinition,
  ResolvedCombatOperationStep,
} from '../../compiler/combatProgram';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import { ActionBlackboard, resolveActionValueOperand } from '../actions/actionBlackboard';
import { compareCombatNumbers } from '../../math/combatNumbers.ts';
import type {
  LogicalAbilityEntityRuntime,
  LogicalAbilityEntitySpawnRequest,
} from './logicalAbilityEntityRuntime';
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
import type { ActionValueCalculation, PostSkillCastRequest } from '../state/foundationState';

type RuntimeOperation = ResolvedCombatOperationStep;

interface AbilityEntityRuntimeDependencies {
  readonly resolveOperations: (state: CombatOperationHostState) => CombatOperationExecutor;
  readonly semanticEvents?: CombatSemanticEventRuntime;
  readonly launchProjectile?: LaunchProjectile;
  readonly finishProjectile?: (target: RuntimeTargetRef) => boolean;
  readonly createCallbackSkillHost?: CallbackSkillHostFactory;
  readonly installPassiveSkills?: (
    entity: RuntimeTargetRef,
    definition: ResolvedAbilityEntityDefinition,
  ) => void;
  readonly prepareSoul?: (
    target: RuntimeTargetRef,
    definition: NonNullable<ResolvedAbilityEntityDefinition['soul']>,
  ) => NonNullable<LogicalAbilityEntitySpawnRequest['soul']>;
  readonly initializeSoul?: (
    entity: RuntimeTargetRef,
    definition: ResolvedAbilityEntityDefinition,
  ) => void;
  readonly programs?: AbilityEntityChildSkillPrograms;
}

/** 将能力实体 DSL 步骤接到本场战斗唯一的逻辑实例目录。 */
export class AbilityEntityOperationExecutor implements CombatOperationExecutor {
  readonly #operatorId: string;
  readonly #entities: LogicalAbilityEntityRuntime;
  readonly #delegate: CombatOperationExecutor &
    Pick<TargetContextOperationExecutor, 'queryTargets'>;
  readonly #childRuntimeDependencies?: AbilityEntityRuntimeDependencies;
  readonly #resolveDefinition?: (
    abilityEntityId: string,
  ) => ResolvedAbilityEntityDefinition | undefined;
  readonly #childSkillPrograms: AbilityEntityChildSkillPrograms;
  readonly runtimeState: AbilityEntityActionState;
  readonly programs: CombatOperationPrograms;

  constructor(
    operatorId: string,
    entities: LogicalAbilityEntityRuntime,
    delegate: CombatOperationExecutor & Pick<TargetContextOperationExecutor, 'queryTargets'>,
    childRuntimeDependencies?: AbilityEntityRuntimeDependencies,
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

  /** CastSkill 登记实体自己的技能并写公共请求槽，不在动作执行栈内启动技能。 */
  requestSkillCast(
    entity: RuntimeTargetRef,
    request: Omit<PostSkillCastRequest, 'skillId'> & { readonly nativeSkillId: string },
    context: CombatOperationContext,
  ): void {
    const snapshot = this.#entities.snapshot(entity);
    const definition = this.#resolveDefinition?.(snapshot.abilityEntityId);
    if (!definition)
      throw new Error(`AbilityEntity definition '${snapshot.abilityEntityId}' does not exist`);
    const program = this.#resolveSpawnChildSkill(definition, request.nativeSkillId);
    if (!program)
      throw new Error(`AbilityEntity child skill '${request.nativeSkillId}' does not exist`);
    this.#entities.ensureChildSkill(entity, program.skillId, (owner, blackboard) =>
      this.#createChildRuntime(program, owner, blackboard, context, false),
    );
    const { nativeSkillId: _, ...input } = request;
    this.#entities.childSkillHosts(entity).ability.requestPostSkillCast({
      ...input,
      skillId: program.skillId,
      resolveSkillSlot: false,
    });
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
      const owner = this.#delegate.queryTargets(step.parameters.owner, context)[0];
      if (owner === undefined || owner.kind === 'spatialPoint') return false;
      const sourceSkillCastId = step.parameters.sameSourceSkillCast
        ? context.skillCastInfo?.skillCastId
        : undefined;
      if (step.parameters.sameSourceSkillCast && sourceSkillCastId === undefined)
        throw new Error('AbilityEntity same-cast query requires inherited skill-cast info');
      let targets = this.#entities.findOwnerSpawned({
        ownerId: runtimeTargetEntityId(owner)!,
        ...(step.parameters.abilityEntityIds === undefined
          ? {}
          : { abilityEntityIds: step.parameters.abilityEntityIds }),
        ...(sourceSkillCastId === undefined ? {} : { sourceSkillCastId }),
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
      const target = context.targetContext.getOptional(step.parameters.sourceContextKey)?.[index];
      if (target === undefined) return false;
      context.targetContext.setSingle(step.parameters.saveToContextKey, target);
      return true;
    }
    if (step.kind === 'setAbilityEntityRemainingDuration') {
      if (!context) throw new Error('AbilityEntity duration assignment requires an action context');
      const target = this.#delegate.queryTargets(step.parameters.target, context)[0];
      // 原生 _ApplyDurationToTarget 先检查目标及实体控制器，之后才读取数值。
      // 单目标模式不能越过首个非能力实体，继续寻找其他可赋值目标。
      if (target?.kind !== 'abilityEntity') return true;
      this.#entities.setRemainingDuration(
        target,
        resolveActionValueOperand(step.parameters.value, context.blackboard),
      );
      return true;
    }
    if (step.kind === 'finishOwner') {
      if (!context) throw new Error('FinishOwner requires an action context');
      const targets = [...this.#delegate.queryTargets(step.parameters.targets, context)];
      for (const target of targets) {
        if (this.#childRuntimeDependencies?.finishProjectile?.(target)) continue;
        if (target.kind !== 'abilityEntity')
          throw new Error('FinishOwner currently requires an ability entity target');
        if (this.#entities.isActive(target)) this.#entities.kill(target, 'explicit');
      }
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
    const bornTargets = [...this.#delegate.queryTargets(parameters.bornAt, context)];
    const explicitAssignments = Object.fromEntries(
      Object.entries(parameters.blackboardAssignments ?? {}).map(([key, operand]) => [
        key,
        resolveActionValueOperand(operand, context.blackboard),
      ]),
    );
    const stringAssignments = parameters.stringBlackboardAssignments ?? {};
    const inheritedValues = parameters.inheritActionBlackboard ? context.blackboard.snapshot() : {};
    const assignments = {
      ...inheritedValues,
      ...explicitAssignments,
      ...stringAssignments,
    };
    const valueCalculations: Record<string, ActionValueCalculation> = {};
    for (const [key, value] of Object.entries(inheritedValues)) {
      if (Object.hasOwn(explicitAssignments, key) || Object.hasOwn(stringAssignments, key))
        continue;
      const calculation = context.blackboard.getValueCalculation(key);
      if (typeof value === 'number' && calculation?.result === value)
        valueCalculations[key] = calculation;
    }
    for (const [key, operand] of Object.entries(parameters.blackboardAssignments ?? {})) {
      if (Object.hasOwn(stringAssignments, key)) continue;
      const sourceKey = valueInputBlackboardKey(operand);
      const value = explicitAssignments[key];
      const calculation =
        sourceKey === undefined ? undefined : context.blackboard.getValueCalculation(sourceKey);
      if (typeof value === 'number' && calculation?.result === value)
        valueCalculations[key] = calculation;
    }
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
    if (parameters.source === 'currentAbilityEntity' && currentAbilityEntitySource === undefined) {
      throw new Error('spawnAbilityEntity requires its current AbilityEntity source');
    }
    // 来源身份同时决定直接父子查询和死亡联动，不能用归属干员替代。
    const source =
      parameters.source === 'currentAbilityEntity' ? currentAbilityEntitySource! : casterSource;
    const childSkill = this.#resolveSpawnChildSkill(definition, parameters.childSkillId);
    if (childSkill !== undefined && this.#childRuntimeDependencies === undefined) {
      throw new Error('spawnAbilityEntity child skill runtime is not configured');
    }
    const resolveTarget = () =>
      parameters.target === undefined
        ? undefined
        : typeof parameters.target === 'object'
          ? this.#delegate.queryTargets(parameters.target, context)[0]
          : parameters.target === 'enemy'
            ? ({ kind: 'enemy' } as const)
            : parameters.target === 'actionInputTarget'
              ? context.actionInputTarget
              : parameters.target === 'currentAbilityEntity'
                ? context.currentTarget
                : casterSource;
    if (parameters.target === 'currentAbilityEntity' && context.currentTarget === undefined) {
      throw new Error('spawnAbilityEntity currentAbilityEntity target requires a current target');
    }
    const overrideDurationSeconds =
      parameters.overrideDurationSeconds === undefined
        ? undefined
        : resolveActionValueOperand(parameters.overrideDurationSeconds, context.blackboard);
    const spawnedTargets: RuntimeTargetRef[] = [];
    // 出生目标在执行开始时确定；子技能修改同名目标组不改变本次遍历。
    for (let bornIndex = 0; bornIndex < bornTargets.length; bornIndex++) {
      const resolvedSource =
        typeof parameters.source === 'object'
          ? this.#delegate.queryTargets(parameters.source, context)[0]
          : source;
      if (resolvedSource === undefined || resolvedSource.kind === 'spatialPoint')
        throw new Error('spawnAbilityEntity requires a valid source ability system');
      const target = resolveTarget();
      let soul: LogicalAbilityEntitySpawnRequest['soul'];
      if (definition.soul !== undefined) {
        if (target === undefined) throw new Error('Soul spawn requires an explicit target');
        if (
          !this.#childRuntimeDependencies?.prepareSoul ||
          !this.#childRuntimeDependencies.initializeSoul
        )
          throw new Error('Soul spawn requires ability-system initialization');
        soul = this.#childRuntimeDependencies.prepareSoul(target, definition.soul);
      }
      const entity = this.#entities.spawn({
        ...(soul === undefined ? {} : { soul }),
        initialize: entity => {
          if (definition.soul !== undefined)
            this.#childRuntimeDependencies!.initializeSoul!(entity, definition);
          else this.#childRuntimeDependencies?.installPassiveSkills?.(entity, definition);
        },
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
          ...(definition.faction === undefined ? {} : { faction: definition.faction }),
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
        source: resolvedSource,
        ...(!inheritSourceSkillCastInfo || context.skillCastInfo === undefined
          ? {}
          : { sourceSkillCastId: context.skillCastInfo.skillCastId }),
        ...(target === undefined ? {} : { target }),
        ...(overrideDurationSeconds === undefined ? {} : { overrideDurationSeconds }),
        dieWhenSourceDies: parameters.dieWhenSourceDies,
        ...(Object.keys(assignments).length === 0 ? {} : { blackboardAssignments: assignments }),
        ...(Object.keys(valueCalculations).length === 0
          ? {}
          : { blackboardValueCalculations: valueCalculations }),
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
      if (parameters.saveToContextKey !== undefined) spawnedTargets.push(entity);
      if (parameters.finishByAction) {
        const slot = this.programs.slot(step);
        this.runtimeState.actionDurationEntities.set(slot, [
          ...(this.runtimeState.actionDurationEntities.get(slot) ?? []),
          entity,
        ]);
      }
    }
    if (parameters.saveToContextKey !== undefined) {
      if (context.targetContext === undefined)
        throw new Error('spawnAbilityEntity context output requires a target context');
      context.targetContext.set(parameters.saveToContextKey, spawnedTargets);
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
      // 原生 OnSpawn 的 TryCastSkill 失败不撤销实体出生，也不选择其他子技能。
      return undefined;
    }
    if (definition.childSkill !== undefined) return definition.childSkill;
    const children = Object.values(definition.childSkills ?? {});
    if (children.length <= 1) return children[0];
    throw new Error('AbilityEntity definition has multiple child skills but Spawn selected none');
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

  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
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
    if (condition.kind === 'abilityEntityRemainingDurationCompare') {
      if (context === undefined)
        throw new Error('AbilityEntity duration comparison requires a context');
      const target =
        condition.target === undefined
          ? context.currentTarget
          : this.#delegate.queryTargets(condition.target, context)[0];
      if (target === undefined || !this.#entities.isActive(target)) return false;
      const remaining = this.#entities.snapshot(target).remainingDurationSeconds;
      const seconds = Math.fround(remaining ?? -1);
      const matches = compareCombatNumbers(
        // 原生无限期实体调用 PeriodicTimer.MarkInvalid，remainingTime 为 -1。
        seconds,
        Math.fround(resolveActionValueOperand(condition.value, context.blackboard)),
        condition.operator,
        'double',
      );
      if (matches && condition.outputKey !== undefined)
        context.blackboard.assignDynamic(condition.outputKey, seconds);
      return matches;
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
        target: this.#entities.snapshot(entity).target,
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
