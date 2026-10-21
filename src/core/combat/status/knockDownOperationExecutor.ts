import { runtimeTargetEntityId, type RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import {
  PHYSICAL_NO_GUARD_BUFF as NO_GUARD,
  PHYSICAL_INFLICTION_BUFFS,
} from './physicalInfliction';
import type { CompiledCondition } from '../../compiler/compiledGraphData.ts';
import type {
  ResolvedCombatOperationStep,
  ResolvedSkillBuffDefinition,
} from '../../compiler/combatProgram';

import { resolveActionValueOperand } from '../actions/actionBlackboard';
import type { BuffDefinitionOperationTarget } from '../buffs/buffDefinitionOperationTarget';
import type { BuffApplicationHandle } from '../buffs/buffOperationExecutor';
import type { CombatOperationContext, CombatOperationExecutor } from '../skills/skillRuntime';
import type { CombatSkillCastInfo } from '../state/foundationState';
import type { GameplayTagPredefine } from '../tags/gameplayTagPredefine';
import type { KnockDownComponentEvent, OrdinaryKnockDownRuntime } from './ordinaryKnockDownRuntime';
import { operationProducer } from '../receipt/combatObjectIdentity';

export type KnockDownAbilityEvent =
  | KnockDownComponentEvent
  | 'triggerDodge'
  | 'beforeOutputPhysicalInfliction'
  | 'beforeTakePhysicalInfliction'
  | 'afterOutputPhysicalInfliction'
  | 'afterTakePhysicalInfliction';

/** 根动作在单个目标上的同步调用载荷，不是另一个可序列化的数据协议。 */
export interface KnockDownEventPayload {
  readonly sourceId: string;
  readonly targetId: string;
  readonly type: 'knockDown';
  readonly isExtra: boolean;
  readonly fromAirborne: false;
  readonly skillCastInfo?: CombatSkillCastInfo;
  readonly attachBuffToCurrentSkill?: (buff: BuffApplicationHandle) => void;
}

export interface KnockDownTargetBinding {
  readonly target: BuffDefinitionOperationTarget<string>;
  readonly isTargetAlive: () => boolean;
  readonly getControl: () => OrdinaryKnockDownRuntime | null;
}

export interface KnockDownOperationDependencies {
  readonly queryTargets: NonNullable<CombatOperationExecutor['queryTargets']>;
  readonly resolveTarget: (target: RuntimeTargetRef) => KnockDownTargetBinding | undefined;
  readonly predefine: GameplayTagPredefine;
  readonly readSourceDurationAddition: (sourceId: string) => number;
  readonly resolveBuffDefinition: (id: string) => ResolvedSkillBuffDefinition | undefined;
  readonly emit: (event: KnockDownAbilityEvent, payload: KnockDownEventPayload) => void;
  readonly onNoGuard: (payload: KnockDownEventPayload) => void;
  readonly onControlApplied: (payload: KnockDownEventPayload) => void;
  readonly onPhysicalInflictionApplied: (payload: KnockDownEventPayload) => void;
  readonly delegate: CombatOperationExecutor;
}

const KNOCK_DOWN = PHYSICAL_INFLICTION_BUFFS.knockDown;
const PHYSICAL_STATUS_TAG = 'Skill/Character/Common/PhysicalStatus/KnockdownStatus';

/**
 * 普通根 KnockDownAction 的单敌人执行链。固定木桩省略动作中断和朝向变化；
 * 不删除破防门、状态 Buff、两层免疫、干员事件或原生返回策略。
 * 标准环境可显式装配实体时钟；正式入口的消费者门禁验收前，能力预检继续拒绝该步骤。
 */
export class KnockDownOperationExecutor implements CombatOperationExecutor {
  constructor(readonly dependencies: KnockDownOperationDependencies) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind !== 'applyPhysicalInfliction' || step.parameters.type !== 'knockDown')
      return this.dependencies.delegate.execute(step, context);
    const d = this.dependencies;
    if (context === undefined) throw new Error('physical knockDown requires an action context');
    const source = d.queryTargets(step.parameters.source, context)[0];
    const sourceId = source === undefined ? undefined : runtimeTargetEntityId(source);
    if (sourceId === undefined) return false;
    const targets = d.queryTargets(step.parameters.target, context);
    let success = false;
    let interrupted = false;
    for (const selected of targets) {
      if (runtimeTargetEntityId(selected) === undefined) continue;
      const binding = d.resolveTarget(selected);
      if (binding === undefined) continue;
      const payload: KnockDownEventPayload = {
        sourceId,
        targetId: binding.target.ownerId,
        type: 'knockDown',
        isExtra: step.parameters.isExtra,
        fromAirborne: false,
        skillCastInfo: context.skillCastInfo,
        ...(context.attachBuffToCurrentSkill === undefined
          ? {}
          : { attachBuffToCurrentSkill: context.attachBuffToCurrentSkill }),
      };
      if (step.parameters.targetFilter === 'aliveOnly' && binding.isTargetAlive()) {
        // 181 是 OnTriggerDodge 的事件身份，不表示目标真的执行了闪避。
        d.emit('triggerDodge', payload);
        if (
          !step.parameters.force &&
          binding.isTargetAlive() &&
          binding.target.getCountByIds([NO_GUARD]) <= 0
        ) {
          this.#applyBuff(binding.target, NO_GUARD, payload, context);
          d.onNoGuard(payload);
        } else if (d.predefine.canAddTag(binding.target.container, PHYSICAL_STATUS_TAG)) {
          d.emit('beforeOutputPhysicalInfliction', payload);
          d.emit('beforeTakePhysicalInfliction', payload);
          this.#applyBuff(binding.target, KNOCK_DOWN, payload, context);
          const control = binding.getControl();
          if (control !== null) {
            if (control.entity !== binding.target.container || control.predefine !== d.predefine)
              throw new Error(
                'knock-down control must share the target container and tag configuration',
              );
            // duration 不传入 Buff，也不能在前置事件/状态 Buff 之前求值。
            const duration = resolveActionValueOperand(
              step.parameters.duration,
              context.blackboard,
            );
            const result = control.apply(duration, {
              readSourceDurationAddition: () => d.readSourceDurationAddition(sourceId),
              emit: event => d.emit(event, payload),
              onApplied: () => d.onControlApplied(payload),
            });
            success ||= result === 'success';
            interrupted ||= result === 'interruption';
          }
          // 无控制组件或控制拒绝也仍发通用 After；不以 Buff 添加返回值决定。
          d.emit('afterOutputPhysicalInfliction', payload);
          d.emit('afterTakePhysicalInfliction', payload);
          d.onPhysicalInflictionApplied(payload);
        }
      }
    }
    switch (step.parameters.returnWhen) {
      case 'always':
        return true;
      case 'successAndInterrupted':
        return success && interrupted;
      case 'success':
        return success;
      case 'interrupted':
        return interrupted;
    }
  }

  #applyBuff(
    target: BuffDefinitionOperationTarget<string>,
    buffId: string,
    payload: KnockDownEventPayload,
    context: CombatOperationContext,
  ): void {
    target.apply({
      isExtra: buffId === KNOCK_DOWN && payload.isExtra,
      buffId,
      physicalInflictionType: 'knockDown',
      producedBy: operationProducer(context, {
        ownerId: payload.sourceId,
        actionId: context.actionSourceId ?? payload.skillCastInfo?.originSkillId,
      }),
      definition: this.dependencies.resolveBuffDefinition(buffId),
      sourceId: payload.sourceId,
      sourceActionId: context.actionSourceId ?? payload.skillCastInfo?.originSkillId,
      blackboardValues: {},
      skillCastInfo: payload.skillCastInfo,
    });
  }

  prepare(step: ResolvedCombatOperationStep, context: CombatOperationContext): void {
    this.dependencies.delegate.prepare?.(step, context);
  }
  end(step: ResolvedCombatOperationStep, context?: CombatOperationContext): void {
    this.dependencies.delegate.end?.(step, context);
  }
  evaluate(condition: CompiledCondition, context?: CombatOperationContext): boolean {
    return this.dependencies.delegate.evaluate(condition, context);
  }
}
