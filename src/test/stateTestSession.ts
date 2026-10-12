export interface StateTestContext<State> {
  readonly state: State;
}

export interface StateTestSession<State, Input, Result> {
  read(): State;
  step(input: Input): Result;
  save(): State;
  restore(saved: State): void;
}

/** 纯数据执行函数的测试夹具；整场切面行为须通过正式 CombatRuntimeSession 验证。 */
export function createStateTestSession<State, Input, Result>(
  initial: State,
  execute: (context: StateTestContext<State>, input: Input) => Result,
): StateTestSession<State, Input, Result> {
  let state = structuredClone(initial);
  return {
    read: () => structuredClone(state),
    step: input => structuredClone(execute({ state }, structuredClone(input))),
    save: () => structuredClone(state),
    restore: saved => {
      state = structuredClone(saved);
    },
  };
}
