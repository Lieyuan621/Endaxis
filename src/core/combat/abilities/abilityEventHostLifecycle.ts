import type {
  AbilityEventRegistration,
  TrackedAbilityEventRegistration,
} from '../events/abilityEventDispatcher';
import type { BuffApplicationHandle } from '../buffs/combatBuffs';
import { buffReferenceKey } from '../buffs/buffReference';
import { createAbilityEventHostState, type AbilityEventHostState } from '../state/abilityState';

/** Adapter failure handling, not native gameplay behavior: finish cleanup, then report all errors. */
export function runAbilityHostCleanup(actions: Iterable<() => void>): void {
  const errors: unknown[] = [];
  for (const action of actions) {
    try {
      action();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors, 'Ability host cleanup failed');
}

export function failAfterAbilityHostCleanup(error: unknown, actions: Iterable<() => void>): never {
  try {
    runAbilityHostCleanup(actions);
  } catch (cleanupError) {
    throw new AggregateError([error, cleanupError], 'Ability initialization and cleanup failed');
  }
  throw error;
}

/** Ownership shared by projected passive Abilities, not a new battle-event dispatcher. */
export class AbilityEventHostLifecycle {
  readonly #state: AbilityEventHostState;
  readonly #registrations: AbilityEventRegistration[] = [];
  readonly #children: Array<{
    readonly child: BuffApplicationHandle;
    readonly finished?: { dispose(): void };
  }> = [];
  readonly #cleanup: (() => void)[] = [];
  #disposing = false;

  constructor(state: AbilityEventHostState = createAbilityEventHostState()) {
    this.#state = state;
  }

  get runtimeState(): AbilityEventHostState {
    return this.#state;
  }

  get canExecuteAction(): boolean {
    return this.#state.enabled;
  }

  get acceptsEvents(): boolean {
    return this.#state.enabled && !this.#disposing && !this.#state.disposed;
  }

  enable(): void {
    if (this.#disposing || this.#state.disposed)
      throw new Error('cannot enable a disposed Ability host');
    this.#state.enabled = true;
  }

  register(registration: AbilityEventRegistration): void {
    if (this.#disposing || this.#state.disposed) {
      registration.dispose();
      throw new Error('cannot register with a disposed Ability host');
    }
    this.#registrations.push(registration);
    this.#state.registrations.push([
      ...((registration as Partial<TrackedAbilityEventRegistration>).subscriptions ?? []),
    ]);
  }

  /**
   * 把恢复后重新建立的处理函数连接到保存订阅；不增加订阅数据，也不改变原注册顺序。
   * 调用方必须按来源程序原顺序绑定，并通过事件目录的 bind 接口取得 registration。
   */
  bindRestoredRegistration(registration: TrackedAbilityEventRegistration): void {
    if (this.#disposing || this.#state.disposed) {
      registration.dispose();
      throw new Error('cannot bind a registration to a disposed Ability host');
    }
    const saved = this.#state.registrations[this.#registrations.length];
    if (saved === undefined) {
      registration.dispose();
      throw new Error('restored Ability host has more registrations than saved data');
    }
    if (!sameSubscriptions(saved, registration.subscriptions)) {
      registration.dispose();
      throw new Error('restored Ability host registration does not match saved subscriptions');
    }
    this.#registrations.push(registration);
  }

  addChildBuff(child: BuffApplicationHandle): void {
    if (this.#state.disposed) throw new Error('cannot attach a child to a disposed Ability host');
    if (child.isFinished === true) return;
    if (
      this.#state.childBuffs.some(
        reference => buffReferenceKey(reference) === buffReferenceKey(child.reference),
      )
    )
      return;
    this.#state.childBuffs.push(child.reference);
    this.#bindChild(child);
  }

  #bindChild(child: BuffApplicationHandle): void {
    const key = buffReferenceKey(child.reference);
    const finished = child.bindFinishedCallback?.(() => {
      if (this.#disposing) return;
      const stateIndex = this.#state.childBuffs.findIndex(
        reference => buffReferenceKey(reference) === key,
      );
      if (stateIndex >= 0) this.#state.childBuffs.splice(stateIndex, 1);
      const runtimeIndex = this.#children.findIndex(
        binding => buffReferenceKey(binding.child.reference) === key,
      );
      if (runtimeIndex >= 0) this.#children.splice(runtimeIndex, 1);
    });
    this.#children.push({ child, ...(finished === undefined ? {} : { finished }) });
  }

  /** 所有 Buff 容器恢复后，按保存身份接回当前分支对象；不再次附着或启动 Buff。 */
  bindRestoredChildren(
    resolve: (reference: BuffApplicationHandle['reference']) => BuffApplicationHandle | undefined,
  ): void {
    if (this.#state.disposed) {
      if (this.#state.childBuffs.length !== 0)
        throw new Error('disposed Ability host still owns child Buffs');
      return;
    }
    if (this.#children.length !== 0)
      throw new Error('restored Ability host child Buffs are already bound');
    for (const reference of this.#state.childBuffs) {
      const child = resolve(reference);
      if (child === undefined) {
        throw new Error(
          `restored Ability host child Buff '${buffReferenceKey(reference)}' is missing`,
        );
      }
      this.#bindChild(child);
    }
  }

  onDisable(cleanup: () => void): void {
    if (this.#disposing || this.#state.disposed)
      throw new Error('cannot extend a disposed Ability host');
    this.#cleanup.push(cleanup);
  }

  dispose(): void {
    if (this.#disposing || this.#state.disposed) return;
    this.#disposing = true;
    try {
      runAbilityHostCleanup(this.#cleanupActions());
    } finally {
      for (const binding of this.#children) binding.finished?.dispose();
      this.#children.length = 0;
      this.#state.childBuffs.length = 0;
      this.#state.enabled = false;
      this.#disposing = false;
      this.#state.disposed = true;
    }
  }

  *#cleanupActions(): Generator<() => void> {
    const registrations = this.#registrations.splice(0);
    this.#state.registrations.length = 0;
    for (const registration of registrations) yield () => registration.dispose();
    yield* this.#cleanup.splice(0);
    // Keep the native live-list traversal even when an earlier adapter callback failed.
    for (let index = 0; index < this.#children.length; index++) {
      const child = this.#children[index]!.child;
      yield () => {
        child.finish('other', null);
      };
    }
  }
}

function sameSubscriptions(
  saved: readonly TrackedAbilityEventRegistration['subscriptions'][number][],
  current: readonly TrackedAbilityEventRegistration['subscriptions'][number][],
): boolean {
  return (
    saved.length === current.length &&
    saved.every(
      (reference, index) =>
        reference.state === current[index]!.state &&
        reference.event === current[index]!.event &&
        reference.phase === current[index]!.phase &&
        reference.id === current[index]!.id,
    )
  );
}
