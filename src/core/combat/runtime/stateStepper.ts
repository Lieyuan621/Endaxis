/**
 * 纯数据运行时的受控步进入口。执行程序只在 step 内访问当前数据；保存、恢复不调用游戏逻辑。
 * 此工具只保证交给它的完整数据根，不代表旧 CombatRuntimeAssembly 已经能够保存整场战斗。
 * 执行程序须保持无状态，不能把拿到的数据引用留在成员、模块变量或跨步进闭包中。
 */
const checkpointIdentity: unique symbol = Symbol('state checkpoint');

/** 内容不对调用方开放；只能恢复到创建它的同一运行实例。 */
export interface StateCheckpoint {
  readonly [checkpointIdentity]: true;
}

/** 只在当前 step 调用期间有效，保存此上下文也不能在步进外再次取数据。 */
export interface StateStep<State> {
  readonly state: State;
}

export type StateStepProgram<State, Input, Result> = (
  step: StateStep<State>,
  input: Input,
) => Result;

export class StateStepper<State, Input, Result> {
  #state: State;
  readonly #program: StateStepProgram<State, Input, Result>;
  readonly #checkpoints = new WeakMap<StateCheckpoint, State>();
  #phase: 'idle' | 'stepping' | 'saving' | 'restoring' | 'faulted' = 'idle';
  #stepId = 0;
  #generation = 0;

  constructor(initialState: State, program: StateStepProgram<State, Input, Result>) {
    this.#state = copyData(initialState);
    this.#program = program;
  }

  /** 恢复后换代，供外部句柄与观察缓存失效使用；不参与游戏计算或随机种子。 */
  get generation(): number {
    return this.#generation;
  }

  /** 返回独立数据副本，不把正在运行的对象交给观察层。 */
  read(): State {
    this.#assertIdle('read');
    return copyData(this.#state);
  }

  step(input: Input): Result {
    this.#assertIdle('step');
    const suppliedInput = copyData(input);
    const stepId = ++this.#stepId;
    const owner = this;
    const step: StateStep<State> = {
      get state() {
        if (owner.#phase !== 'stepping' || owner.#stepId !== stepId)
          throw new Error('step data is only available during its own step');
        return owner.#state;
      },
    };
    this.#phase = 'stepping';
    try {
      const result = copyData(this.#program(step, suppliedInput));
      this.#phase = 'idle';
      return result;
    } catch (error) {
      this.#phase = 'faulted';
      throw error;
    }
  }

  save(): StateCheckpoint {
    this.#assertIdle('save');
    this.#phase = 'saving';
    try {
      const data = copyData(this.#state);
      const checkpoint: StateCheckpoint = Object.freeze({ [checkpointIdentity]: true as const });
      this.#checkpoints.set(checkpoint, data);
      return checkpoint;
    } finally {
      this.#phase = 'idle';
    }
  }

  restore(checkpoint: StateCheckpoint): void {
    if (this.#phase !== 'idle' && this.#phase !== 'faulted')
      throw new Error(`cannot restore while state is ${this.#phase}`);
    if (!this.#checkpoints.has(checkpoint))
      throw new Error('checkpoint does not belong to this state stepper');
    const previousPhase = this.#phase;
    this.#phase = 'restoring';
    try {
      // 完整目标先在当前数据之外准备；此后提交只做赋值，不执行生命周期清理。
      const restored = copyData(this.#checkpoints.get(checkpoint)!);
      this.#state = restored;
      this.#generation += 1;
      this.#phase = 'idle';
    } catch (error) {
      this.#phase = previousPhase;
      throw error;
    }
  }

  #assertIdle(operation: string): void {
    if (this.#phase !== 'idle')
      throw new Error(`cannot ${operation} while state is ${this.#phase}`);
  }
}

/**
 * 只复制已明确支持的数据类型。structuredClone 会丢掉类私有字段，且会调用 getter，
 * 因此先检查原对象，不能把克隆成功误当成状态完整。检查不执行任何业务访问器。
 */
function copyData<Value>(value: Value): Value {
  assertData(value, new WeakSet());
  return structuredClone(value);
}

function assertData(value: unknown, seen: WeakSet<object>): void {
  if (typeof value === 'function' || typeof value === 'symbol')
    throw new TypeError('runtime data cannot contain functions or symbols');
  if (value === null || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  const prototype = Object.getPrototypeOf(value);
  if (prototype === Map.prototype || prototype === Set.prototype) {
    if (Reflect.ownKeys(value).length !== 0)
      throw new TypeError('runtime collections cannot have extra properties');
    if (value instanceof Map) {
      for (const [key, entry] of value) {
        assertData(key, seen);
        assertData(entry, seen);
      }
    } else {
      for (const entry of value as Set<unknown>) assertData(entry, seen);
    }
    return;
  }
  if (prototype !== Object.prototype && prototype !== null && prototype !== Array.prototype)
    throw new TypeError('runtime data must use plain objects, arrays, Map or Set');
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === 'symbol') throw new TypeError('runtime data cannot contain symbol keys');
    if (Array.isArray(value) && key === 'length') continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
    if (!('value' in descriptor) || !descriptor.enumerable)
      throw new TypeError('runtime data cannot contain accessors or hidden properties');
    assertData(descriptor.value, seen);
  }
}
