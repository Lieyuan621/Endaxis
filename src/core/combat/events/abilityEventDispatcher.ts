/**
 * 技能与 Buff 等 Ability 监听者共享的同步事件边界。
 * 注册动作使用整数优先级；同优先级按原生双缓冲优先队列保持注册顺序。
 */
import type { AbilityEventSubscriptionReference } from '../state/foundationState';
import {
  createAbilityEventState,
  type AbilityEventPhase,
  type AbilityEventState,
} from '../state/foundationState';
import {
  dispatchAbilityEvent,
  registerAbilityEvent,
  unregisterAbilityEvent,
} from './abilityEventExecution';

/** 一次 Ability 事件的稳定身份和只读负载。 */
export interface AbilityEventContext<Event, Payload = unknown> {
  readonly event: Event;
  readonly payload: Payload;
}

/** 先构造完整映射再取订阅子集，泛型订阅也能保留名称与载荷关联。 */
export type AbilityEventFromMap<
  Event extends PropertyKey,
  Payloads extends Record<Event, unknown>,
> = {
  [Name in keyof Payloads]: AbilityEventContext<Name, Payloads[Name]>;
}[Event];

/** 技能或 Buff 等有身份对象通过此接口接收 Ability 事件。 */
export interface AbilityEventListener<
  Event extends PropertyKey,
  Payloads extends Record<Event, unknown> = Record<Event, unknown>,
> {
  onAbilityEvent(context: AbilityEventFromMap<Event, Payloads>): void;
}

/** 不持有监听者身份的轻量 Ability 事件处理函数。 */
export type AbilityEventHandler<
  Event extends PropertyKey,
  Payloads extends Record<Event, unknown> = Record<Event, unknown>,
> = (context: AbilityEventFromMap<Event, Payloads>) => void;

/**
 * 一组已注册事件行为的生命周期句柄。
 * 原生 EventListenerAction 会在结束或中断时释放对应句柄；调用方也必须在所属作用域结束时释放。
 */
export interface AbilityEventRegistration {
  dispose(): void;
}

/** 事件订阅句柄同时提供纯数据引用；合并订阅必须保留每一项，不能只合并 dispose。 */
export interface TrackedAbilityEventRegistration extends AbilityEventRegistration {
  readonly subscriptions: readonly AbilityEventSubscriptionReference[];
}

/**
 * 把可保存的订阅目录与当前分支的处理函数绑定起来。
 * 订阅顺序和编号保存在数据中；技能、Buff 等宿主恢复后按原编号重新绑定处理函数。
 */
export class AbilityEventDispatcher<
  Event extends PropertyKey,
  Payloads extends Record<Event, unknown> = Record<Event, unknown>,
> {
  readonly #state: AbilityEventState<Event>;
  readonly #handlers = new Map<number, AbilityEventHandler<Event, Payloads>>();

  /** 传入已复制的目录时只连接数据；调用方必须先补齐处理函数，再允许分发。 */
  constructor(state: AbilityEventState<Event> = createAbilityEventState<Event>()) {
    this.#state = state;
  }

  /** 订阅顺序与编号的实际数据；处理函数仍由当前事件中心持有。 */
  get runtimeState() {
    return this.#state;
  }

  registerCallback<Name extends Event>(
    event: Name,
    callback: AbilityEventHandler<Name, Payloads>,
  ): TrackedAbilityEventRegistration {
    return this.#register(event, 'callback', callback as AbilityEventHandler<Event, Payloads>);
  }

  registerAction<Name extends Event>(
    event: Name,
    priority: number,
    execute: AbilityEventHandler<Name, Payloads>,
  ): TrackedAbilityEventRegistration {
    return this.#register(
      event,
      'action',
      execute as AbilityEventHandler<Event, Payloads>,
      priority,
    );
  }

  /** 持续监听器也进入同一次分发的原生阶段，不另开一轮事件循环。 */
  registerListener<Name extends Event>(
    event: Name,
    phase: 'skill' | 'combo',
    callback: AbilityEventHandler<Name, Payloads>,
  ): TrackedAbilityEventRegistration {
    return this.#register(event, phase, callback as AbilityEventHandler<Event, Payloads>);
  }

  dispatch(
    context: AbilityEventFromMap<Event, Payloads>,
    skillListeners: readonly AbilityEventListener<Event, Payloads>[],
    comboListener?: AbilityEventListener<Event, Payloads>,
  ): void {
    dispatchAbilityEvent(this.#state, context.event, {
      resolveHandler: id => {
        const handle = this.#handlers.get(id);
        if (handle === undefined) throw new Error(`ability event handler ${id} is not bound`);
        return () => handle(context);
      },
      dispatchSkills: () => {
        for (const listener of skillListeners.slice()) listener.onAbilityEvent(context);
      },
      dispatchCombo: () => comboListener?.onAbilityEvent(context),
    });
  }

  #register(
    event: Event,
    phase: AbilityEventPhase,
    handler: AbilityEventHandler<Event, Payloads>,
    priority = 0,
  ): TrackedAbilityEventRegistration {
    const handlerId = this.#state.nextRegistrationId;
    const id = registerAbilityEvent(this.#state, event, phase, handlerId, priority);
    return this.bindSubscription({ state: this.#state, event, phase, id }, handler);
  }

  /**
   * 给已有订阅接回处理函数，不重新分配编号、不改变优先级或注册顺序。
   * 引用必须属于当前目录且仍有效；重复绑定直接报错，避免悄悄覆盖另一宿主的回调。
   */
  bindSubscription(
    reference: AbilityEventSubscriptionReference,
    handler: AbilityEventHandler<Event, Payloads>,
  ): TrackedAbilityEventRegistration {
    if (reference.state !== this.#state)
      throw new Error('ability event subscription belongs to another state');
    const { event, phase, id } = reference;
    const entry = reference.state.phases[phase].get(event)?.find(entry => entry.id === id);
    if (entry === undefined) throw new Error(`ability event subscription ${id} is missing`);
    const handlerId = entry.handlerId;
    if (this.#handlers.has(handlerId))
      throw new Error(`ability event handler ${handlerId} is already bound`);
    this.#handlers.set(handlerId, handler);
    return {
      subscriptions: [reference],
      dispose: () => {
        unregisterAbilityEvent(reference.state, event, phase, id);
        this.#handlers.delete(handlerId);
      },
    };
  }

  /**
   * 按已知事件名恢复订阅。先核对保存引用的事件，再收窄处理函数类型，避免把不同载荷接到同一回调。
   */
  bindSubscriptionFor<Name extends Event>(
    event: Name,
    reference: AbilityEventSubscriptionReference,
    handler: AbilityEventHandler<Name, Payloads>,
  ): TrackedAbilityEventRegistration {
    if (reference.event !== event) {
      throw new Error(
        `ability event subscription belongs to '${String(reference.event)}', expected '${String(event)}'`,
      );
    }
    return this.bindSubscription(reference, handler as AbilityEventHandler<Event, Payloads>);
  }
}
