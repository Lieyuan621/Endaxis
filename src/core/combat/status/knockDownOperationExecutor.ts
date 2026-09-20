import type {
  ResolvedCombatOperationStep,
  ResolvedSkillBuffDefinition,
} from '../../compiler/combatProgram';
import type { CombatCondition } from '../../game-data/operatorDefinition';
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
  readonly skillCastInfo: CombatSkillCastInfo;
  readonly attachBuffToCurrentSkill?: (buff: BuffApplicationHandle) => void;
}

export interface KnockDownOperationDependencies {
  /** null 是实际缺来源；不可用缺省值冒充已绑定的干员。 */
  readonly sourceId: string | null;
  readonly target: BuffDefinitionOperationTarget<string>;
  readonly isTargetAlive: () => boolean;
  readonly predefine: GameplayTagPredefine;
  /** Buff 生命周期可能改变目标组件，故在状态 Buff 执行后查询。 */
  readonly getControl: () => OrdinaryKnockDownRuntime | null;
  readonly readSourceDurationAddition: () => number;
  readonly resolveBuffDefinition: (id: string) => ResolvedSkillBuffDefinition | undefined;
  readonly emit: (event: KnockDownAbilityEvent, payload: KnockDownEventPayload) => void;
  readonly onNoGuard: (payload: KnockDownEventPayload) => void;
  readonly onControlApplied: (payload: KnockDownEventPayload) => void;
  readonly onPhysicalInflictionApplied: (payload: KnockDownEventPayload) => void;
  readonly delegate: CombatOperationExecutor;
}

const NO_GUARD = 'buff_physical_no_guard';
const KNOCK_DOWN = 'buff_physical_knockdown';
const PHYSICAL_STATUS_TAG = 'Skill/Character/Common/PhysicalStatus/KnockdownStatus';

/**
 * 普通根 KnockDownAction 的单敌人执行链。固定木桩省略动作中断和朝向变化；
 * 不删除破防门、状态 Buff、两层免疫、干员事件或原生返回策略。
 * 标准环境可显式装配实体时钟；正式入口的消费者门禁验收前，能力预检继续拒绝该步骤。
 */
export class KnockDownOperationExecutor implements CombatOperationExecutor {
  constructor(readonly dependencies: KnockDownOperationDependencies) {}

  execute(step: ResolvedCombatOperationStep, context?: CombatOperationContext): boolean {
    if (step.kind !== 'applyKnockDown') return this.dependencies.delegate.execute(step, context);
    const d = this.dependencies;
    if (d.sourceId === null) return false;
    if (context?.skillCastInfo === undefined)
      throw new Error('applyKnockDown requires a skill runtime context');
    // IsExtra 的通用 BuffAddContext 尚未贯通，不可把 true 静默投影成普通异常。
    if (step.parameters.isExtra)
      throw new Error('extra knock-down requires BuffAddContext support');
    const payload: KnockDownEventPayload = {
      sourceId: d.sourceId,
      targetId: d.target.ownerId,
      type: 'knockDown',
      isExtra: step.parameters.isExtra,
      fromAirborne: false,
      skillCastInfo: context.skillCastInfo,
      ...(context.attachBuffToCurrentSkill === undefined
        ? {}
        : { attachBuffToCurrentSkill: context.attachBuffToCurrentSkill }),
    };
    let success = false;
    let interrupted = false;
    if (step.parameters.targetFilter === 'aliveOnly' && d.isTargetAlive()) {
      // 181 是 OnTriggerDodge 的事件身份，不表示目标真的执行了闪避。
      d.emit('triggerDodge', payload);
      if (!step.parameters.force && d.isTargetAlive() && d.target.getCountByIds([NO_GUARD]) <= 0) {
        this.#applyBuff(NO_GUARD, payload, context);
        d.onNoGuard(payload);
      } else if (d.predefine.canAddTag(d.target.container, PHYSICAL_STATUS_TAG)) {
        d.emit('beforeOutputPhysicalInfliction', payload);
        d.emit('beforeTakePhysicalInfliction', payload);
        this.#applyBuff(KNOCK_DOWN, payload, context);
        const control = d.getControl();
        if (control !== null) {
          if (control.entity !== d.target.container || control.predefine !== d.predefine)
            throw new Error(
              'knock-down control must share the target container and tag configuration',
            );
          // duration 不传入 Buff，也不能在前置事件/状态 Buff 之前求值。
          const duration = resolveActionValueOperand(step.parameters.duration, context.blackboard);
          const result = control.apply(duration, {
            readSourceDurationAddition: d.readSourceDurationAddition,
            emit: event => d.emit(event, payload),
            onApplied: () => d.onControlApplied(payload),
          });
          success = result === 'success';
          interrupted = result === 'interruption';
        }
        // 无控制组件或控制拒绝也仍发通用 After；不以 Buff 添加返回值决定。
        d.emit('afterOutputPhysicalInfliction', payload);
        d.emit('afterTakePhysicalInfliction', payload);
        d.onPhysicalInflictionApplied(payload);
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
    buffId: string,
    payload: KnockDownEventPayload,
    context: CombatOperationContext,
  ): void {
    this.dependencies.target.apply({
      buffId,
      physicalInflictionType: 'knockDown',
      producedBy: operationProducer(context, {
        ownerId: payload.sourceId,
        actionId: context.actionSourceId ?? payload.skillCastInfo.originSkillId,
      }),
      definition: this.dependencies.resolveBuffDefinition(buffId),
      sourceId: payload.sourceId,
      sourceActionId: context.actionSourceId ?? payload.skillCastInfo.originSkillId,
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
  evaluate(condition: CombatCondition, context?: CombatOperationContext): boolean {
    return this.dependencies.delegate.evaluate(condition, context);
  }
}
