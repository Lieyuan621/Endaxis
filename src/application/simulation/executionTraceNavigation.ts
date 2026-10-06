import { getCompiledGraphLocation } from '../../core/compiler/compileActionGraph';
import type { ExecutionTraceRecord } from '../../core/combat/actions/actionExecutionTrace';

export interface ExecutionTraceCall {
  id: number;
  caller?: ExecutionTraceRecord;
  parent?: ExecutionTraceCall;
  records: ExecutionTraceRecord[];
}

/** 展示层调用索引。普通条件、循环和作用域的执行器嵌套不构成新的浏览层级。 */
export function indexExecutionTrace(
  records: readonly ExecutionTraceRecord[],
  isRootRecord: (record: ExecutionTraceRecord) => boolean = () => true,
) {
  const root: ExecutionTraceCall = { id: 0, records: [] };
  const calls = [root];
  const byRecord = new Map<number, ExecutionTraceCall>();
  const children = new Map<number, ExecutionTraceCall[]>();
  const associated: ExecutionTraceCall[] = [];
  for (const record of records) {
    const parent = record.parent === undefined ? undefined : records[record.parent];
    let call = parent ? byRecord.get(parent.sequence)! : root;
    if (parent) {
      const source = getCompiledGraphLocation(record.program, record.nodeId);
      const parentSource = getCompiledGraphLocation(parent.program, parent.nodeId);
      const parentKind = parent.program.nodes.get(parent.nodeId)?.action.kind;
      const boundary =
        record.callId !== parent.callId ||
        record.executionHostId !== parent.executionHostId ||
        (record.response !== undefined && record.response.id !== parent.response?.id) ||
        record.program !== parent.program ||
        source?.scope !== parentSource?.scope ||
        ((parentKind === 'callMacro' || parentKind === 'callResource') &&
          record.invocation !== parent.invocation);
      if (boundary) {
        const siblings = children.get(parent.sequence) ?? [];
        // 一个调用入口的顺序节点具有相同 invocation；不能只按节点或程序合并。
        const previous = siblings.at(-1);
        const first = previous?.records[0];
        if (
          first &&
          first.callId === record.callId &&
          first.executionHostId === record.executionHostId &&
          first.program === record.program &&
          first.invocation === record.invocation &&
          first.response?.id === record.response?.id &&
          getCompiledGraphLocation(first.program, first.nodeId)?.scope === source?.scope
        )
          call = previous!;
        else {
          call = { id: calls.length, caller: parent, parent: call, records: [] };
          calls.push(call);
          siblings.push(call);
          children.set(parent.sequence, siblings);
        }
      }
    } else if (!isRootRecord(record) || record.response !== undefined) {
      const previous = associated.at(-1);
      const first = previous?.records[0];
      if (
        first &&
        first.callId === record.callId &&
        first.executionHostId === record.executionHostId &&
        first.program === record.program &&
        first.invocation === record.invocation &&
        first.response?.id === record.response?.id
      )
        call = previous!;
      else {
        call = { id: calls.length, records: [] };
        calls.push(call);
        associated.push(call);
      }
    }
    call.records.push(record);
    byRecord.set(record.sequence, call);
  }
  return { root, calls, byRecord, children, associated };
}

/** 父步骤的回执区间包含同步子执行；这里只返回直接产生的回执。 */
export function directTraceReceipts<T>(
  record: ExecutionTraceRecord,
  records: readonly ExecutionTraceRecord[],
  receipts: readonly T[],
): T[] {
  const ranges = records
    .filter(child => child.parent === record.sequence)
    .map(child => [child.receiptStart, child.receiptEnd] as const)
    .sort((a, b) => a[0] - b[0]);
  const result: T[] = [];
  let start = record.receiptStart;
  for (const [from, to] of ranges) {
    result.push(...receipts.slice(start, Math.max(start, from)));
    start = Math.max(start, to);
  }
  result.push(...receipts.slice(start, record.receiptEnd));
  return result;
}
