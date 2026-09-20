/**
 * 已审计 Ability 事件的连携条件阶段。每条注册保留自己的 direct 板，共享 owner 的实体板。
 * 只产出 Pending 数据，不选择候选、不施法，也不把它降格为附着后的语义事件。
 */
import type { ResolvedActionSequence } from '../../compiler/combatProgram';
import type {
  AbilityEvent,
  ActionContextBoundAbilityEvent,
} from '../../../../packages/game-data-contract/src/abilityEvents';
import type { CombatAbilityEvent } from '../events/combatAbilityEvent';
import type { RuntimeTargetRef } from '../../game-data/logicalAbilityEntity';
import type { AbilityEventRegistration } from '../events/abilityEventDispatcher';
import { ActionBlackboard, type ActionBlackboardValue } from '../actions/actionBlackboard';
import { CombatActionSequenceRuntime } from '../actions/combatActionSequenceRuntime';
import { COMBAT_FRAMES_PER_SECOND } from '../time/combatClock';
import {
  hasAbilityEventActionContextBinding,
  resolveAbilityEventActionContextBinding,
} from '../events/abilityEventActionContext';
import { abilityEventSkillCastInfo } from '../events/combatAbilityEvent';
import { RuntimeTargetContext } from '../abilities/runtimeTargetContext';
import type { CombatOperationExecutor } from './skillRuntime';
import type { ComboCastParameters } from '../state/environmentState';

type ComboConditionEventContext = CombatAbilityEvent<ActionContextBoundAbilityEvent>;
type BlackboardSnapshot = Readonly<Record<string, ActionBlackboardValue>>;

/** 同步通知仍可查看触发上下文；事件不能作为待释放窗口状态保存。 */
export interface PendingComboCondition extends ComboCastParameters {
  readonly event: ComboConditionEventContext;
}

export interface ComboConditionRegistration {
  readonly event: AbilityEvent;
  readonly ownerId: string;
  readonly sourceId: string;
  readonly sequence: ResolvedActionSequence;
  readonly entityBlackboard: ActionBlackboard;
  readonly initialValues: BlackboardSnapshot | null;
  /** 装配根提供并持有的 direct 黑板；独立使用时省略并从 initialValues 创建。 */
  readonly directBlackboard?: ActionBlackboard;
  readonly operations: CombatOperationExecutor;
  /** entity.markDie 的 alive 语义或显式木桩投影；不能用血量替代。 */
  readonly isOwnerAlive: () => boolean;
  /** InSilence 查询或显式无沉默场景投影，不在此猜 Tag ID。 */
  readonly isOwnerSilenced: () => boolean;
  /** 每次读取当前 ComboSkill 槽位及其计时器，不能缓存替换前的技能。缺失返回 null。 */
  readonly currentComboCooldown: () => {
    readonly oneReady: boolean;
    readonly maxPassedTime: number;
    readonly startCdFrame: number;
  } | null;
  /** ID 到实体身份的显式解析；不能把未知 ID 默认当成角色或敌人。 */
  readonly resolveTarget: (entityId: string) => RuntimeTargetRef;
  readonly onPending: (pending: PendingComboCondition) => void;
}

interface Registration {
  readonly options: ComboConditionRegistration;
  readonly blackboard: ActionBlackboard;
  readonly targets: RuntimeTargetContext;
  readonly captureBlackboard: boolean;
}

export class ComboSkillConditionRuntime {
  readonly #registrations = new Map<ComboConditionRegistration['event'], Registration[]>();
  disableTriggerComboSkill = false;

  registerPendingCondition(options: ComboConditionRegistration): AbilityEventRegistration {
    if (!hasAbilityEventActionContextBinding(options.event))
      throw new Error(`unaudited AbilityEvent action-context binding '${options.event}'`);
    const registration: Registration = {
      options,
      blackboard:
        options.directBlackboard ??
        new ActionBlackboard(options.initialValues ?? {}, options.entityBlackboard),
      targets: new RuntimeTargetContext(),
      captureBlackboard: options.initialValues !== null,
    };
    const entries = this.#registrations.get(options.event) ?? [];
    entries.push(registration);
    this.#registrations.set(options.event, entries);
    let disposed = false;
    return {
      dispose: () => {
        if (disposed) return;
        disposed = true;
        const index = entries.indexOf(registration);
        if (index >= 0) entries.splice(index, 1);
        if (entries.length === 0) this.#registrations.delete(options.event);
      },
    };
  }

  onAbilityEvent(event: ComboConditionEventContext): void {
    if (this.disableTriggerComboSkill) return;
    // 原生注册容器是 set；此处遍历快照不承诺跨注册的原生优先级。
    for (const { options, blackboard, targets, captureBlackboard } of this.#registrations
      .get(event.event)
      ?.slice() ?? []) {
      if (!options.isOwnerAlive() || options.isOwnerSilenced()) continue;
      const cooldown = options.currentComboCooldown();
      if (cooldown === null)
        throw new Error('combo condition requires current ComboSkill cooldown');
      if (!Number.isFinite(cooldown.maxPassedTime) || !Number.isFinite(cooldown.startCdFrame)) {
        throw new Error('combo condition cooldown values must be finite');
      }
      if (
        !cooldown.oneReady &&
        !(
          Math.fround(cooldown.maxPassedTime) <
          Math.fround(Math.fround(cooldown.startCdFrame) / COMBAT_FRAMES_PER_SECOND)
        )
      )
        continue;

      const binding = resolveAbilityEventActionContextBinding(event);
      if (binding === undefined) throw new Error(`unaudited action context for '${event.event}'`);
      // battle 是 GlobalBuff 的归因身份，不是可进入原生动作上下文的 AbilitySystem。
      // 这类镜像 Buff 事件不能产生角色连携候选；其他未知实体仍由 resolver 严格报错。
      if (binding.inputTargetId === 'battle' || binding.triggerTargetId === 'battle') continue;
      const inputTarget = Object.freeze({
        ...options.resolveTarget(binding.inputTargetId),
      });
      const triggerTarget =
        binding.triggerTargetId === null
          ? null
          : Object.freeze({ ...options.resolveTarget(binding.triggerTargetId) });
      if (triggerTarget !== null) targets.setSingle('trigger', triggerTarget);
      const eventSkillCastInfo = abilityEventSkillCastInfo(event);
      // 每次检查重新建立动作状态，但绝不重置该注册的 direct/entity 黑板。
      const runtime = new CombatActionSequenceRuntime(options.operations, {
        blackboard,
        targetContext: targets,
        actionInputTarget: inputTarget,
        actionOwnerId: options.ownerId,
        actionSourceId: options.sourceId,
        event,
        ...(eventSkillCastInfo === undefined ? {} : { eventSkillCastInfo }),
      });
      let passed: boolean;
      try {
        passed = runtime.createSequence(options.sequence).executeInstant({});
      } finally {
        if (triggerTarget !== null) targets.remove('trigger');
        runtime.reset();
      }
      if (passed) {
        options.onPending({
          event,
          inputTarget,
          triggerTarget,
          assignPairs: captureBlackboard ? Object.freeze(blackboard.snapshot()) : null,
        });
      }
    }
  }
}
