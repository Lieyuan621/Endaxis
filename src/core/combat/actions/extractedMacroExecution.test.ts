import { describe, expect, it } from 'vitest';
import type {
  ActionGraphNode,
  ActionGraphResourceDefinition,
} from '../../../../packages/game-data-contract/src/actionGraph';
import { createActionGraphCompilation } from '../../compiler/compileActionGraph';
import { CombatOperationPrograms } from './combatOperationPrograms';
import { ActionGraphExecution, type ActionGraphExecutionHost } from './actionGraphExecution';
import { CombatStep, STEP_RESULT_MODE } from './combatStep';
import type { ActionStepData, ActionGraphExecutionState } from '../state/actionState';

const hit: ActionGraphNode['action'] = {
  kind: 'dealDamage',
  parameters: { damageType: 'physical', attackScale: 1, tags: [] },
};
const flag = (name: string): ActionGraphNode['action'] => ({
  kind: 'setContextFlag',
  parameters: { flag: name, value: true, target: 'caster' },
});

function definition(extracted: boolean): ActionGraphResourceDefinition {
  const endings = {
    afterA: { action: flag('after-a'), next: 'b1' },
    afterB: { action: flag('after-b'), next: null },
  } satisfies Record<string, ActionGraphNode>;
  if (!extracted)
    return {
      main: {
        nodes: {
          a1: { action: hit, next: 'a2' },
          a2: { action: flag('middle'), next: 'afterA' },
          b1: { action: hit, next: 'b2' },
          b2: { action: flag('middle'), next: 'afterB' },
          ...endings,
        },
      },
      macros: {},
    };
  return {
    main: {
      nodes: {
        a1: {
          action: { kind: 'callMacro', macroId: 'middle', nodeBindings: { hit: 'a1', flag: 'a2' } },
          next: 'afterA',
        },
        b1: {
          action: { kind: 'callMacro', macroId: 'middle', nodeBindings: { hit: 'b1', flag: 'b2' } },
          next: 'afterB',
        },
        ...endings,
      },
    },
    macros: {
      middle: {
        entry: { $sequence: 'hit' },
        graph: {
          nodes: {
            hit: { action: hit, next: 'flag' },
            flag: { action: flag('middle'), next: null },
          },
        },
      },
    },
  };
}

function fixture(extracted: boolean, behavior: 'normal' | 'fail' | 'end' | 'gate' = 'normal') {
  const compilation = createActionGraphCompilation(definition(extracted), 1);
  const entry = compilation.compileEntry({ $sequence: 'a1' }, 'skill:start');
  const slots = new CombatOperationPrograms();
  const trace: unknown[][] = [];
  let executionCount = 0;
  let gateCount = 0;
  let current: ActionGraphExecution;
  const unsupported = (): never => {
    throw new Error('unexpected nested action');
  };
  const host: ActionGraphExecutionHost = {
    canExecute: () => {
      gateCount++;
      return behavior !== 'gate' || executionCount < 1;
    },
    listener: unsupported,
    targets: unsupported,
    withTarget: unsupported,
    evaluate: unsupported,
    value: unsupported,
    once: unsupported,
    scope: unsupported,
    bindOperation: action => {
      const identity = [slots.slot(action), action.key ?? action.kind, action.parameters];
      const record = (phase: string) => trace.push([phase, ...identity]);
      return new (class extends CombatStep {
        override get executionData() {
          return { kind: 'stateless' as const };
        }
        override bindExecutionData(data: ActionStepData | null) {
          if (data?.kind !== 'stateless') throw new Error('invalid probe state');
        }
        execute() {
          this.tryExecute();
        }
        override tryExecute() {
          record('execute');
          executionCount++;
          if (behavior === 'end' && executionCount === 1) current.end({});
          return behavior !== 'fail' || executionCount !== 1;
        }
        override reset() {
          record('reset');
        }
        override tick() {
          record('tick');
        }
        override end() {
          record('end');
        }
      })();
    },
  };
  const make = (state?: ActionGraphExecutionState) => {
    current = new ActionGraphExecution(
      entry.graph,
      entry.entry,
      'invocation',
      host,
      state,
      entry.callSite,
    );
    return current;
  };
  return { make, trace, gates: () => gateCount };
}

describe('提取宏保留原动作身份与顺序', () => {
  it('共用中间段后仍连接各自后续，匿名伤害身份、操作槽与完整生命周期不变', () => {
    const run = (extracted: boolean) => {
      const test = fixture(extracted);
      const execution = test.make();
      execution.reset({});
      expect(execution.tryExecute({})).toBe(true);
      execution.tick(1 / 30, {});
      execution.end({});
      execution.reset({});
      expect(execution.tryExecute({})).toBe(true);
      return { trace: test.trace, gates: test.gates() };
    };
    const before = run(false);
    expect(run(true)).toEqual(before);
    expect(before.trace.filter(([phase]) => phase === 'execute')).toHaveLength(12);
  });

  it.each(['fail', 'end', 'gate'] as const)('%s 时不会越过失败步骤继续宏体或后续', behavior => {
    const run = (extracted: boolean) => {
      const test = fixture(extracted, behavior);
      const execution = test.make();
      const result = execution.tryExecute({});
      execution.tick(1 / 30, {});
      execution.end({});
      return { result, trace: test.trace, gates: test.gates() };
    };
    expect(run(true)).toEqual(run(false));
  });

  it('恢复后不重放已经执行的动作，tick/end 使用原有操作身份', () => {
    const run = (extracted: boolean) => {
      const test = fixture(extracted);
      const execution = test.make();
      execution.tryExecute({});
      const count = test.trace.length;
      const restored = test.make(structuredClone(execution.runtimeState));
      expect(test.trace).toHaveLength(count);
      restored.tryExecute({});
      expect(test.trace).toHaveLength(count);
      restored.tick(1 / 30, {});
      restored.end({});
      return test.trace;
    };
    expect(run(true)).toEqual(run(false));
  });

  it('反转下一动作结果由原首个动作消费，不被宏调用包装提前消费', () => {
    const run = (extracted: boolean) => {
      const test = fixture(extracted);
      const result = test
        .make()
        .tryExecute({ sequence: { resultMode: STEP_RESULT_MODE.invertNextResult } });
      return { result, trace: test.trace, gates: test.gates() };
    };
    expect(run(true)).toEqual(run(false));
    expect(run(true).trace).toHaveLength(1);
  });
});
