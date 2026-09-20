import type { CompiledProjectileCallbackSkillProgram } from '../../compiler/combatProgram';
import { ActionBlackboard } from '../actions/actionBlackboard';
import { hasActiveCombatOperationState } from '../actions/combatOperationHostInspection';
import type { BuffApplicationHandle } from '../buffs/buffOperationExecutor';
import type { DamageCalculationSnapshotProgram } from '../damage/damageCalculationSnapshots';
import type { AbilitySkillPayload } from '../events/combatAbilityEvent';
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

export interface CallbackSkillHost {
  readonly runtimeState: CallbackSkillHostState;
  readonly skill: SkillRuntime;
  readonly ability: AbilitySystemRuntime;
  start(): void;
  end(): void;
  advance(deltaSeconds: number): void;
}
export type CallbackSkillHostFactory = (
  program: CompiledProjectileCallbackSkillProgram,
  context: CombatOperationContext,
  operations: CombatOperationExecutor,
  restored?: {
    readonly state: CallbackSkillHostState;
    readonly damageSnapshotProgram: DamageCalculationSnapshotProgram;
    readonly resolveAttachedBuff: (reference: BuffReference) => BuffApplicationHandle | undefined;
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
  const create: CallbackSkillHostFactory = (program, context, operations, restored) => {
    const target = context.actionOwnerAbilityEntity;
    const source = context.skillCastInfo;
    if (target === undefined || source === undefined)
      throw new Error('callback skill requires its entity identity and inherited cast information');
    if (program.castResource.cost.availabilityThreshold !== 0)
      throw new Error('callback skill has a nonzero SP availability threshold');
    const ownerId = `ability-entity:${target.instanceId}`;
    const directory = dependencies.callbackPrograms;
    const damageSnapshotProgram = directory?.resolveDamageSnapshots(directory.register(program));
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
        ...(operationState === undefined ? {} : { operationState }),
        ...(damageSnapshotProgram === undefined ? {} : { damageSnapshotProgram }),
        actionBlackboard:
          restored === undefined
            ? context.blackboard.createLocalScope(program.initialBlackboard, true)
            : ActionBlackboard.bindRuntimeState(restored.state.skill.blackboard),
        scheduleProjectileFinishCallback: context.scheduleProjectileFinishCallback,
        createCallbackSkillHost: create,
        hostIdentity: {
          actionOwnerId: ownerId,
          actionSourceId: ownerId,
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
    let delta = 0;
    const ability = new AbilitySystemRuntime(
      {
        skills: [skill],
        emitBeforeSkillCast: payload =>
          dependencies.emitEvent?.(ownerId, 'beforeCastSkill', payload),
        resolveTickDeltas: () => uniformAbilityTickDeltas(delta),
      },
      restored?.state.ability,
    );
    return {
      runtimeState: restored?.state ?? { skill: skill.runtimeState, ability: ability.runtimeState },
      skill,
      ability,
      start: () => {
        ability.prepareBeforeSkillCastStart(program.skillId, undefined, {
          sourceId: ownerId,
          targetId: ownerId,
          skillId: program.skillId,
          skillCastId: source.skillCastId,
          skillCastInfo: source,
        });
        ability.tryStartProjectileCallbackSkill(program.skillId, source);
      },
      end: () => skill.interrupt('default'),
      advance: deltaSeconds => {
        if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0)
          throw new RangeError('callback delta must be finite and non-negative');
        delta = deltaSeconds;
        ability.advanceFrame();
      },
    };
  };
  return create;
}
