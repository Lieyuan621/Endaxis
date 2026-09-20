/**
 * 战斗实体之外的关卡级同步事件边界。
 * 只有执行身份与时机已确认的事件才能进入；跨机制注册顺序未知时应在编译阶段拒绝冲突。
 */
/** 一次关卡事件的稳定身份和只读负载。 */
export interface GameLevelEventContext<Event, Payload = unknown> {
  readonly event: Event;
  readonly payload: Payload;
}

/** 关卡事件的同步处理函数；不得跨 Tick 延迟修改当前上下文。 */
export type GameLevelEventHandler<Event, Payload = unknown> = (
  context: GameLevelEventContext<Event, Payload>,
) => void;

/** 按注册顺序同步广播关卡事件。 */
export class GameLevelEventDispatcher<Event, Payload = unknown> {
  readonly #callbacks = new Map<Event, GameLevelEventHandler<Event, Payload>[]>();

  registerCallback(event: Event, callback: GameLevelEventHandler<Event, Payload>): void {
    const callbacks = this.#callbacks.get(event);
    if (callbacks === undefined) {
      this.#callbacks.set(event, [callback]);
      return;
    }
    callbacks.push(callback);
  }

  dispatch(context: GameLevelEventContext<Event, Payload>): void {
    for (const callback of this.#callbacks.get(context.event)?.slice() ?? []) callback(context);
  }
}
