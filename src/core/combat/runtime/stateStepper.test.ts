/** 验证完整数据根的隔离、执行边界和故障恢复，不把模块数量当成整场战斗覆盖。 */
import { expect, it, vi } from 'vitest';
import { StateStepper, type StateStep } from './stateStepper';

it('初始数据、输入、输出和观察结果都不向外泄露工作副本', () => {
  const initial = { values: new Map([['initial', { value: 1 }]]) };
  const runtime = new StateStepper(initial, (step, input: { value: number }) => {
    step.state.values.set('input', input);
    return step.state;
  });
  initial.values.get('initial')!.value = 99;
  const input = { value: 2 };
  const result = runtime.step(input);
  input.value = 88;
  result.values.get('input')!.value = 77;
  const observed = runtime.read();
  observed.values.clear();
  expect([...runtime.read().values.values()]).toEqual([{ value: 1 }, { value: 2 }]);
});

it('同一切面可以反复恢复，保留的兄弟分支互不作废', () => {
  const runtime = new StateStepper({ trace: [] as string[] }, (step, value: string) => {
    step.state.trace.push(value);
  });
  const root = runtime.save();
  runtime.step('A');
  const a = runtime.save();
  runtime.restore(root);
  runtime.step('B');
  const b = runtime.save();
  for (let count = 0; count < 3; count++) {
    runtime.restore(a);
    expect(runtime.read().trace).toEqual(['A']);
    runtime.restore(b);
    expect(runtime.read().trace).toEqual(['B']);
    runtime.restore(root);
    expect(runtime.read().trace).toEqual([]);
  }
  expect(runtime.generation).toBe(10);
});

it('步进内部禁止保存、恢复、读出或重入推进', () => {
  let check = () => {};
  const runtime = new StateStepper({ value: 0 }, (step, _: undefined) => {
    step.state.value++;
    check();
  });
  const root = runtime.save();
  check = () => {
    expect(() => runtime.save()).toThrow('stepping');
    expect(() => runtime.restore(root)).toThrow('stepping');
    expect(() => runtime.read()).toThrow('stepping');
    expect(() => runtime.step(undefined)).toThrow('stepping');
  };
  runtime.step(undefined);
  expect(runtime.read().value).toBe(1);
});

it('离开当前步进的访问上下文立即失效，下一步也不能复用旧上下文', () => {
  let previous: StateStep<{ value: number }> | undefined;
  const runtime = new StateStepper({ value: 0 }, (step, _: undefined) => {
    if (previous !== undefined) expect(() => previous!.state).toThrow('own step');
    previous = step;
    step.state.value++;
  });
  runtime.step(undefined);
  expect(() => previous!.state).toThrow('own step');
  runtime.step(undefined);
  expect(runtime.read().value).toBe(2);
});

it('执行失败后禁止继续推进，恢复完整切面后才能重新试探', () => {
  const runtime = new StateStepper({ value: 0 }, (step, fail: boolean) => {
    step.state.value++;
    if (fail) throw new Error('action failed');
  });
  const root = runtime.save();
  expect(() => runtime.step(true)).toThrow('action failed');
  expect(() => runtime.save()).toThrow('faulted');
  expect(() => runtime.step(false)).toThrow('faulted');
  runtime.restore(root);
  runtime.step(false);
  expect(runtime.read().value).toBe(1);
});

it('外来切面被拒绝时原数据保持不变，恢复不调用执行程序', () => {
  let calls = 0;
  const runtime = new StateStepper({ value: 1 }, (step, value: number) => {
    calls++;
    step.state.value = value;
  });
  const foreign = new StateStepper({ value: 0 }, () => {});
  const root = runtime.save();
  runtime.step(2);
  expect(() => runtime.restore(foreign.save())).toThrow('does not belong');
  expect(runtime.read().value).toBe(2);
  runtime.restore(root);
  expect(runtime.read().value).toBe(1);
  expect(calls).toBe(1);
});

it('拒绝会被克隆悄悄丢掉的私有字段、函数和访问器，检查不执行 getter', () => {
  class HiddenState {
    #value = 1;
    get value() {
      return this.#value;
    }
  }
  expect(() => new StateStepper(new HiddenState(), () => {})).toThrow('plain objects');
  expect(() => new StateStepper({ callback: () => {} }, () => {})).toThrow('functions');
  let reads = 0;
  expect(
    () =>
      new StateStepper(
        {
          get value() {
            reads++;
            return 1;
          },
        },
        () => {},
      ),
  ).toThrow('accessors');
  expect(reads).toBe(0);
});

it('输入校验失败时没有执行程序，也不把正常状态标记为故障', () => {
  const runtime = new StateStepper({ calls: 0 }, (step, _: unknown) => {
    step.state.calls++;
  });
  expect(() => runtime.step({ action: () => {} })).toThrow('functions');
  expect(runtime.read().calls).toBe(0);
  runtime.step({ value: 1 });
  expect(runtime.read().calls).toBe(1);
});

it('恢复目标的复制准备失败时，当前状态和代号完全不变', () => {
  const runtime = new StateStepper({ value: 1 }, (step, value: number) => {
    step.state.value = value;
  });
  const base = runtime.save();
  runtime.step(2);
  const copy = vi.spyOn(globalThis, 'structuredClone').mockImplementationOnce(() => {
    throw new Error('copy preparation failed');
  });
  try {
    expect(() => runtime.restore(base)).toThrow('copy preparation failed');
  } finally {
    copy.mockRestore();
  }
  expect(runtime.read().value).toBe(2);
  expect(runtime.generation).toBe(0);
  runtime.restore(base);
  expect(runtime.read().value).toBe(1);
});
