import type { CompiledActionGraph } from '../../compiler/compileActionGraph';
import type { CombatOperationContext } from '../skills/skillRuntime';
import type { CombatObjectRef } from '../receipt/combatReceipt';
import { operationProducer } from '../receipt/combatObjectIdentity';

export type ExecutionTracePhase = 'execute' | 'tick' | 'reset' | 'end';
export interface ExecutionTraceRecord {
  readonly sequence: number;
  readonly parent: number | undefined;
  readonly frame: number;
  readonly program: CompiledActionGraph;
  readonly nodeId: string;
  readonly invocation: string;
  readonly executionHostId?: number;
  readonly callId?: number;
  readonly phase: ExecutionTracePhase;
  readonly producer: CombatObjectRef | undefined;
  readonly castId: string | undefined;
  readonly response?: { readonly id: number; readonly name: string };
  readonly buffId?: string;
  readonly observations: {
    kind: 'condition' | 'value' | 'blackboard';
    input: unknown;
    result: unknown;
  }[];
  readonly receiptStart: number;
  receiptEnd: number;
  result?: boolean;
  failed?: boolean;
  /** 调用方实际消费的完整入口返回值，不从末节点推断。 */
  callOutcome?: { purpose: string; result: boolean };
}

/** 一次诊断重跑独占的观察器；不进入业务回执、程序缓存或战斗切面。 */
export class ActionExecutionTrace {
  readonly records: ExecutionTraceRecord[] = [];
  truncated = false;
  #active: ExecutionTraceRecord | undefined;
  #responses = new WeakMap<object, { id: number; name: string }>();
  #nextResponse = 1;
  #hosts = new WeakMap<object, number>();
  #nextHost = 1;
  #nextCall = 1;
  #callId: number | undefined;
  #observationCount = 0;
  constructor(
    readonly castId: string,
    readonly limit = 20000,
  ) {}

  observeCall(
    purpose: NonNullable<ExecutionTraceRecord['callOutcome']>['purpose'],
    executeAndConsume: () => boolean,
  ): boolean {
    const start = this.records.length;
    const parent = this.#active?.sequence;
    const previous = this.#callId;
    const callId = this.#nextCall++;
    this.#callId = callId;
    try {
      const result = executeAndConsume();
      for (let index = start; index < this.records.length; index++) {
        const record = this.records[index]!;
        if (record.callId === callId && record.phase === 'execute' && record.parent === parent) {
          record.callOutcome = { purpose, result };
          break;
        }
      }
      return result;
    } finally {
      this.#callId = previous;
    }
  }

  run<T>(
    context: CombatOperationContext,
    frame: number,
    program: CompiledActionGraph,
    nodeId: string,
    invocation: string,
    phase: ExecutionTracePhase,
    receiptCount: () => number,
    execute: () => T,
    executionHost?: object,
  ): T {
    const parent = this.#active;
    const castId = context.skillCastInfo?.originCastId ?? context.executionActionId;
    // 同步嵌套响应保留触发关系；延迟响应只依据现有施法身份，不猜测归属。
    if (castId !== this.castId && context.executionActionId !== this.castId && !parent)
      return execute();
    if (this.records.length >= this.limit) {
      this.truncated = true;
      this.#active = undefined;
      try {
        return execute();
      } finally {
        this.#active = parent;
      }
    }
    const event = context.event;
    let response = event && this.#responses.get(event);
    if (event && !response) {
      response = { id: this.#nextResponse++, name: 'event' in event ? event.event : event.kind };
      this.#responses.set(event, response);
    }
    const record: ExecutionTraceRecord = {
      sequence: this.records.length,
      parent: parent?.sequence,
      frame,
      program,
      nodeId,
      invocation,
      executionHostId: executionHost ? this.hostId(executionHost) : undefined,
      callId: this.#callId,
      phase,
      producer: operationProducer(context),
      castId,
      ...(response ? { response } : {}),
      ...(context.executingBuff ? { buffId: context.executingBuff.buffId } : {}),
      observations: [],
      receiptStart: receiptCount(),
      receiptEnd: receiptCount(),
    };
    this.records.push(record);
    this.#active = record;
    try {
      const result = context.blackboard.observeReads(
        (key, value) => this.observe('blackboard', key, value),
        execute,
      );
      if (typeof result === 'boolean') record.result = result;
      return result;
    } catch (error) {
      record.failed = true;
      throw error;
    } finally {
      record.receiptEnd = receiptCount();
      this.#active = parent;
      // 不保存无求值、无效果、无子执行的逐帧空 Tick；有事实的 Tick 仍保留原始顺序。
      if (
        phase === 'tick' &&
        !record.failed &&
        record.observations.length === 0 &&
        record.receiptStart === record.receiptEnd &&
        this.records.length === record.sequence + 1
      )
        this.records.pop();
    }
  }

  observe(kind: 'condition' | 'value' | 'blackboard', input: unknown, result: unknown): void {
    // 输入为不可变定义；这里只保存实际求值的结果，绝不额外读取或求值。
    if (!this.#active) return;
    if (this.#observationCount >= this.limit * 10) {
      this.truncated = true;
      return;
    }
    this.#observationCount++;
    this.#active.observations.push({ kind, input, result });
  }
  private hostId(host: object): number {
    let id = this.#hosts.get(host);
    if (id === undefined) {
      id = this.#nextHost++;
      this.#hosts.set(host, id);
    }
    return id;
  }
}
