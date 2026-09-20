/**
 * 将现有步骤对象接到数据驱动的序列内核。
 * 步骤对象仍可能持有内部状态，所以此绑定层尚不能作为完整战斗切面。
 */
import { createActionSequenceState, type ActionSequenceState } from '../state/actionState';
import {
  endActionSequence,
  executeActionSequence,
  resetActionSequence,
  tickActionSequence,
  type ActionSequenceExecutionHost,
} from './actionSequenceExecution';
import { CombatStep, type CombatExecutionContext } from './combatStep';

/** 按配置数组的顺序同步执行战斗步骤。 */
export class ActionSequence extends CombatStep {
  readonly #steps: readonly CombatStep[];
  readonly #state: ActionSequenceState;

  constructor(
    steps: readonly CombatStep[],
    readonly canExecuteAction?: () => boolean,
    state?: ActionSequenceState,
  ) {
    super();
    this.#steps = [...steps];
    this.#state = state ?? createActionSequenceState(steps.length);
    if (this.#state.entries.length !== steps.length || this.#state.steps.length !== steps.length)
      throw new Error('action sequence state does not match program length');
    steps.forEach((step, index) => {
      if (state === undefined) this.#state.steps[index] = step.executionData;
      else step.bindExecutionData(state.steps[index]!);
    });
  }

  get isEmpty(): boolean {
    return this.#steps.length === 0;
  }

  override get executionData() {
    return { kind: 'sequence' as const, sequence: this.#state };
  }

  /** 序列进度和已经接入的步骤数据，共同组成递归动作树。 */
  get runtimeState(): ActionSequenceState {
    return this.#state;
  }

  override createRuntimeInstance(): ActionSequence {
    return new ActionSequence(
      this.#steps.map(step => step.createRuntimeInstance()),
      this.canExecuteAction,
    );
  }

  execute(context: CombatExecutionContext): void {
    this.tryExecute(context);
  }

  override tryExecute(context: CombatExecutionContext): boolean {
    return executeActionSequence(this.#state, context, this.#host(context));
  }

  executeInstant(context: CombatExecutionContext): boolean {
    const result = this.tryExecute(context);
    this.end(context);
    this.reset(context);
    return result;
  }

  override reset(context: CombatExecutionContext): void {
    resetActionSequence(this.#state, this.#host(context));
  }

  override tick(deltaTime: number, context: CombatExecutionContext): void {
    tickActionSequence(this.#state, deltaTime, this.#host(context));
  }

  override end(context: CombatExecutionContext): void {
    endActionSequence(this.#state, this.#host(context));
  }

  #host(context: CombatExecutionContext): ActionSequenceExecutionHost {
    return {
      canExecute: () => this.canExecuteAction?.() !== false,
      execute: index => this.#steps[index]!.tryExecute(context),
      reset: index => this.#steps[index]!.reset(context),
      tick: (index, deltaTime) => this.#steps[index]!.tick(deltaTime, context),
      end: index => this.#steps[index]!.end(context),
    };
  }
}
