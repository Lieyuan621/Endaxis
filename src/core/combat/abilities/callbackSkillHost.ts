import type { CompiledAbilityEntityChildSkillProgram } from '../../compiler/combatProgram';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { hasActiveCombatOperationState } from '../actions/combatOperationHostInspection';
import type { BuffApplicationHandle } from '../buffs/buffOperationExecutor';
import type { DamageCalculationSnapshotProgram } from '../damage/damageCalculationSnapshots';
import type { AbilitySkillPayload } from '../events/combatAbilityEvent';
import type { CombatSemanticEventRuntime } from '../events/combatSemanticEventRuntime';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import {
  SkillRuntime,
  type CombatOperationContext,
  type CombatOperationExecutor,
} from '../skills/skillRuntime';
import type { CallbackSkillHostState } from '../state/abilityState';
import type { BuffReference } from '../state/foundationState';
import { COMBAT_FRAMES_PER_SECOND, type CombatClock } from '../time/combatClock';
import { uniformAbilityTickDeltas } from '../time/timeDilationRuntime';
import { AbilitySystemRuntime } from './abilitySystemRuntime';
import type { ProjectileCallbackPrograms } from './projectileCallbackPrograms';

/** 同一实体的技能共享当前技能和施放状态；技能本身仍各自保存时间轴与冷却。 */
export class EntitySkillHostGroup {
  readonly #skills: SkillRuntime[] = [];
  #state?: CallbackSkillHostState['ability'];
  #ability?: AbilitySystemRuntime;
  #emitBeforeSkillCast?: (payload: AbilitySkillPayload) => void;
  #delta = 0;

  get hasSkills(): boolean {
    return this.#skills.length > 0;
  }

  register(
    skill: SkillRuntime,
    restored: CallbackSkillHostState['ability'] | undefined,
    emitBeforeSkillCast: (payload: AbilitySkillPayload) => void,
  ): void {
    if (this.#skills.some(existing => existing.skillId === skill.skillId))
      throw new Error(`duplicate entity skill host '${skill.skillId}'`);
    if (restored !== undefined && this.#state !== undefined && restored !== this.#state)
      throw new Error('restored entity skills must share the same ability state');
    if (restored === undefined && this.#state !== undefined) {
      if (skill.nativeSkillType === undefined)
        throw new Error('entity skill native type is missing');
      this.#state.nativeSkillTypeBySkillId.set(skill.skillId, skill.nativeSkillType);
    }
    this.#state ??= restored;
    this.#emitBeforeSkillCast ??= emitBeforeSkillCast;
    this.#skills.push(skill);
    this.#ability = undefined;
  }

  get ability(): AbilitySystemRuntime {
    // 恢复时先登记全部技能，再绑定能力系统，避免当前技能尚未登记就解析其引用。
    this.#ability ??= new AbilitySystemRuntime(
      {
        skills: this.#skills,
        emitBeforeSkillCast: this.#emitBeforeSkillCast,
        resolveTickDeltas: () => uniformAbilityTickDeltas(this.#delta),
      },
      this.#state,
    );
    this.#state = this.#ability.runtimeState;
    return this.#ability;
  }

  advance(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0)
      throw new RangeError('entity skill delta must be finite and non-negative');
    this.#delta = deltaSeconds;
    this.ability.advanceFrame();
  }
}

export interface CallbackSkillHost {
  readonly runtimeState: CallbackSkillHostState;
  readonly skill: SkillRuntime;
  readonly ability: AbilitySystemRuntime;
  start(inputTarget?: import('../../game-data/logicalAbilityEntity').RuntimeTargetRef): void;
  end(): void;
  advance(deltaSeconds: number): void;
}
export type CallbackSkillHostFactory = (
  program: CompiledAbilityEntityChildSkillProgram,
  context: CombatOperationContext,
  operations: CombatOperationExecutor,
  restored?: {
    readonly state: CallbackSkillHostState;
    readonly damageSnapshotProgram: DamageCalculationSnapshotProgram;
    readonly resolveAttachedBuff: (reference: BuffReference) => BuffApplicationHandle | undefined;
  },
  binding?: {
    readonly blackboard: ActionBlackboard;
    readonly damageSnapshotProgram: DamageCalculationSnapshotProgram;
    readonly semanticEvents?: CombatSemanticEventRuntime;
    readonly addAbilityChildBuff?: (child: BuffApplicationHandle) => void;
    readonly interruptCurrentSkill: boolean;
    readonly group?: EntitySkillHostGroup;
  },
) => CallbackSkillHost;

/** 仅装配公共技能/能力系统；时间轴、支付事件和Buff清理由SkillRuntime负责。 */
export function createCallbackSkillHostFactory(dependencies: {
  readonly clock: CombatClock;
  readonly receipt: CombatReceiptSink;
  readonly definitionOperatorId: string;
  readonly allocateSkillCastId: () => number;
  readonly callbackPrograms?: ProjectileCallbackPrograms;
  readonly emitEvent?: (
    ownerId: string,
    event: 'beforeCastSkill' | 'skillEnd' | 'afterSkillApplyCost',
    payload: AbilitySkillPayload,
  ) => void;
}): CallbackSkillHostFactory {
  const create: CallbackSkillHostFactory = (program, context, operations, restored, binding) => {
    const target = context.actionOwnerAbilityEntity;
    const source = context.skillCastInfo;
    if (target === undefined) throw new Error('entity skill requires its entity identity');
    if (
      program.castResource.cost.availabilityThreshold !== 0 ||
      program.castResource.cost.value !== 0 ||
      program.castResource.maxChargeTime !== 1
    )
      throw new Error('entity skill requires unsupported costs or multiple charges');
    const ownerId = `ability-entity:${target.instanceId}`;
    const directory = dependencies.callbackPrograms;
    const damageSnapshotProgram =
      binding?.damageSnapshotProgram ??
      directory?.resolveDamageSnapshots(directory.register(program));
    if (
      restored !== undefined &&
      damageSnapshotProgram !== undefined &&
      restored.damageSnapshotProgram !== damageSnapshotProgram
    )
      throw new Error('restored callback uses a different damage snapshot program');
    const boundOperationState = operations.operationHost?.state;
    if (
      restored !== undefined &&
      ((boundOperationState !== undefined &&
        boundOperationState !== restored.state.skill.operations) ||
        (boundOperationState === undefined &&
          hasActiveCombatOperationState(restored.state.skill.operations)))
    ) {
      throw new Error('restored callback must use its restored operation host state');
    }
    const operationState = boundOperationState ?? restored?.state.skill.operations;
    const skill = new SkillRuntime(
      {
        operatorId: dependencies.definitionOperatorId,
        skillId: program.skillId,
        nativeSkillType: program.nativeSkillType,
        naturalDurationFrames: program.naturalDurationFrames,
        initialBlackboard: program.initialBlackboard,
        timelineActions: program.timelineActions,
        costFrame: program.castResource.costFrame,
        ...(program.castResource.cooldownSeconds > 0
          ? { cooldownFrames: program.castResource.cooldownSeconds * COMBAT_FRAMES_PER_SECOND }
          : {}),
        costs: [program.castResource.cost],
      },
      {
        clock: dependencies.clock,
        receipt: dependencies.receipt,
        resources: null,
        allocateSkillCastId: dependencies.allocateSkillCastId,
        operations,
        semanticEvents: binding?.semanticEvents,
        addAbilityChildBuff: binding?.addAbilityChildBuff,
        currentTarget: context.currentTarget,
        ...(operationState === undefined ? {} : { operationState }),
        ...(damageSnapshotProgram === undefined ? {} : { damageSnapshotProgram }),
        actionBlackboard:
          restored === undefined
            ? (binding?.blackboard ??
              context.blackboard.createLocalScope(program.initialBlackboard, true))
            : ActionBlackboard.bindRuntimeState(restored.state.skill.blackboard),
        launchProjectile: context.launchProjectile,
        createCallbackSkillHost: create,
        hostIdentity: {
          actionOwnerId: ownerId,
          actionSourceId: context.actionSourceId ?? ownerId,
          eventSourceId: ownerId,
          actionOwnerAbilityEntity: target,
          // 回调技能的动作 Owner 是投射物实体，但它仍由创建该回调定义的干员
          // AbilitySystem 解释。嵌套回调继续需要这个干员身份来解析下一层程序。
          semanticEventOwnerOperatorId: dependencies.definitionOperatorId,
        },
        emitSkillEnd: payload => dependencies.emitEvent?.(ownerId, 'skillEnd', payload),
        emitAfterSkillApplyCost: payload =>
          dependencies.emitEvent?.(ownerId, 'afterSkillApplyCost', payload),
      },
      restored === undefined
        ? undefined
        : {
            state: restored.state.skill,
            damageSnapshotProgram: restored.damageSnapshotProgram,
            resolveAttachedBuff: restored.resolveAttachedBuff,
          },
    );
    const group = binding?.group ?? new EntitySkillHostGroup();
    group.register(skill, restored?.state.ability, payload =>
      dependencies.emitEvent?.(ownerId, 'beforeCastSkill', payload),
    );
    return {
      runtimeState: restored?.state ?? {
        skill: skill.runtimeState,
        ability: group.ability.runtimeState,
      },
      skill,
      get ability() {
        return group.ability;
      },
      start: (inputTarget = context.actionInputTarget) => {
        const ability = group.ability;
        ability.tryStartEntitySkill(
          program.skillId,
          source,
          inputTarget,
          binding?.interruptCurrentSkill ?? true,
          () => {
            const castSource = source ?? {
              skillCastId: dependencies.allocateSkillCastId(),
              originSkillId: program.skillId,
              nonReturnedSpCost: 0,
            };
            ability.prepareBeforeSkillCastStart(program.skillId, undefined, {
              sourceId: ownerId,
              targetId: ownerId,
              skillId: program.skillId,
              skillCastId: castSource.skillCastId,
              skillCastInfo: castSource,
            });
            return castSource;
          },
        );
      },
      end: () => skill.interrupt('default'),
      advance: deltaSeconds => group.advance(deltaSeconds),
    };
  };
  return create;
}
