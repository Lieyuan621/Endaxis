/** 能力实体子技能的装配与生命周期适配；执行、冷却和清理由普通技能宿主负责。 */
import type { CompiledAbilityEntityChildSkillProgram } from '../../compiler/combatProgram';
import {
  logicalAbilityEntityRuntimeId,
  type AbilityEntityTargetRef,
  type RuntimeTargetRef,
} from '../../game-data/logicalAbilityEntity';
import { ActionBlackboard } from '../actions/actionBlackboard';
import type { BuffApplicationHandle } from '../buffs/combatBuffs';
import type { DamageCalculationSnapshotProgram } from '../damage/damageCalculationSnapshots';
import type { CombatSemanticEventRuntime } from '../events/combatSemanticEventRuntime';
import type { CombatOperationExecutor, LaunchProjectile } from '../skills/skillRuntime';
import type { AbilityEntityChildSkillState } from '../state/abilityState';
import type { CombatOperationHostState } from '../state/actionState';
import type { BuffReference, CombatSkillCastInfo } from '../state/foundationState';
import type {
  CallbackSkillHost,
  CallbackSkillHostFactory,
  EntitySkillHostGroup,
} from './callbackSkillHost';
import type { LogicalAbilityEntityChildRuntime } from './logicalAbilityEntityRuntime';

export class AbilityEntityChildSkillRuntime implements LogicalAbilityEntityChildRuntime {
  readonly runtimeState: AbilityEntityChildSkillState;
  readonly #host: CallbackSkillHost;
  readonly skillId: string;

  constructor(
    program: CompiledAbilityEntityChildSkillProgram,
    dependencies: {
      readonly entity: AbilityEntityTargetRef;
      readonly source?: RuntimeTargetRef;
      readonly entityBlackboard: ActionBlackboard;
      readonly operations: CombatOperationExecutor;
      readonly ownerOperatorId: string;
      readonly semanticEvents?: CombatSemanticEventRuntime;
      readonly inheritedSkillCastInfo?: CombatSkillCastInfo;
      readonly addAbilityChildBuff?: (child: BuffApplicationHandle) => void;
      readonly launchProjectile?: LaunchProjectile;
      readonly createCallbackSkillHost?: CallbackSkillHostFactory;
      readonly skillHostGroup?: EntitySkillHostGroup;
      readonly programId: number;
      readonly damageSnapshotProgram: DamageCalculationSnapshotProgram;
      readonly operationState?: CombatOperationHostState;
    },
    restored?: {
      readonly state: AbilityEntityChildSkillState;
      readonly resolveAttachedBuff?: (
        reference: BuffReference,
      ) => BuffApplicationHandle | undefined;
    },
  ) {
    if (dependencies.createCallbackSkillHost === undefined)
      throw new Error('AbilityEntity child skill host factory is missing');
    if (
      restored !== undefined &&
      (restored.state.programId !== dependencies.programId ||
        restored.state.skillId !== program.skillId)
    )
      throw new Error('restored AbilityEntity child program identity mismatch');
    const saved = restored?.state.host;
    if (
      saved !== undefined &&
      saved.skill.blackboard.entity !== dependencies.entityBlackboard.runtimeState
    )
      throw new Error('restored AbilityEntity child skill must use the restored entity blackboard');
    if (
      saved !== undefined &&
      dependencies.operationState !== undefined &&
      saved.skill.operations !== dependencies.operationState
    )
      throw new Error('restored AbilityEntity child skill must use restored operation state');
    const blackboard =
      saved === undefined
        ? new ActionBlackboard(
            { ...program.initialBlackboard, ...dependencies.entityBlackboard.snapshot() },
            dependencies.entityBlackboard,
          )
        : ActionBlackboard.bindRuntimeState(saved.skill.blackboard);
    this.skillId = program.skillId;
    this.#host = dependencies.createCallbackSkillHost(
      program,
      {
        blackboard,
        currentTarget: dependencies.entity,
        actionOwnerAbilityEntity: dependencies.entity,
        actionSourceId:
          dependencies.source?.kind === 'operator'
            ? dependencies.source.operatorId
            : dependencies.source?.kind === 'enemy'
              ? 'enemy'
              : dependencies.source?.kind === 'abilityEntity'
                ? logicalAbilityEntityRuntimeId(dependencies.source.instanceId)
                : undefined,
        skillCastInfo: dependencies.inheritedSkillCastInfo,
        launchProjectile: dependencies.launchProjectile,
      },
      dependencies.operations,
      saved === undefined
        ? undefined
        : {
            state: saved,
            damageSnapshotProgram: dependencies.damageSnapshotProgram,
            resolveAttachedBuff: restored?.resolveAttachedBuff ?? (() => undefined),
          },
      {
        blackboard,
        damageSnapshotProgram: dependencies.damageSnapshotProgram,
        semanticEvents: dependencies.semanticEvents,
        addAbilityChildBuff: dependencies.addAbilityChildBuff,
        interruptCurrentSkill: false,
        group: dependencies.skillHostGroup,
      },
    );
    this.runtimeState = restored?.state ?? {
      programId: dependencies.programId,
      skillId: program.skillId,
      host: this.#host.runtimeState,
    };
  }

  get damageSnapshotProgram(): DamageCalculationSnapshotProgram {
    return this.#host.skill.damageSnapshotProgram;
  }

  start(): void {
    this.#host.start();
  }
  advance(deltaSeconds: number): void {
    this.#host.advance(deltaSeconds);
  }
  finish(): void {
    this.#host.end();
  }
}
