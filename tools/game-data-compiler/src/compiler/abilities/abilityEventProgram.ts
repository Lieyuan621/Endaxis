import type { NativeSequenceSource } from '../../source/controlFlow.ts';

/**
 * 原生 AbilityEvent 动作组编译后的最小公共形态。
 *
 * 每个原生 SequenceAction 必须保留为独立程序。原生事件队列按优先级排序，并在同优先级时
 * 保持注册顺序；因此这里禁止按事件合并多个序列，也禁止按派生 key 重新排序。
 */
export interface CompiledAbilityEventProgram<TEvent, TSequence> {
  readonly event: TEvent;
  readonly priority: number;
  readonly sequence: TSequence;
  readonly sourceEventIndex: number;
  readonly sourceSequenceIndex: number;
}

export interface AbilityEventProgramSource<TLeaf> {
  readonly abilityEvent: string | number;
  readonly actions: readonly NativeSequenceSource<TLeaf>[];
}

export interface CompileAbilityEventProgramOptions<TLeaf, TEvent, TSequence> {
  readonly sourcePath: string;
  /** 场景策略可省略整类事件，但不能先过滤数组后破坏来源下标。 */
  readonly omitEvent?: (event: string | number) => boolean;
  readonly mapEvent: (event: string | number, sourcePath: string) => TEvent;
  readonly compileSequence: (
    sequence: NativeSequenceSource<TLeaf>,
    sourcePath: string,
    abilityEvent: string | number,
    /** 同一次 mapEvent 的结果；序列上下文不应另行解释原始身份。 */
    projectedEvent: TEvent,
  ) => TSequence;
  readonly isEmptySequence: (sequence: TSequence) => boolean;
}

/**
 * 当前已审计资产的事件序列均为 Default + 0。优先级枚举到整数的完整映射尚未由
 * 原生取证确认，因此新形态必须显式失败，不能在生成器里猜一个数值。
 */
function compileAuditedDefaultPriority<TLeaf>(
  sequence: NativeSequenceSource<TLeaf>,
  sourcePath: string,
): number {
  for (const [index, node] of sequence.actions.entries()) {
    if (!node.metadata.enabled) continue;
    if (node.metadata.priorityLevel !== 'Default' || node.metadata.priorityOffset !== 0) {
      throw new Error(
        `${sourcePath}.actions[${index}]: unsupported native action priority ` +
          `${node.metadata.priorityLevel} + ${node.metadata.priorityOffset}`,
      );
    }
  }
  return 0;
}

/** 按来源事件、来源序列顺序投影；空序列可删除，但其余条目绝不合并或重排。 */
export function compileAbilityEventPrograms<TLeaf, TEvent, TSequence>(
  events: readonly AbilityEventProgramSource<TLeaf>[],
  options: CompileAbilityEventProgramOptions<TLeaf, TEvent, TSequence>,
): CompiledAbilityEventProgram<TEvent, TSequence>[] {
  const result: CompiledAbilityEventProgram<TEvent, TSequence>[] = [];
  for (const [eventIndex, source] of events.entries()) {
    if (options.omitEvent?.(source.abilityEvent)) continue;
    const eventPath = `${options.sourcePath}[${eventIndex}]`;
    const event = options.mapEvent(source.abilityEvent, `${eventPath}.abilityEvent`);
    for (const [sequenceIndex, nativeSequence] of source.actions.entries()) {
      const sequencePath = `${eventPath}.actions[${sequenceIndex}]`;
      const sequence = options.compileSequence(
        nativeSequence,
        sequencePath,
        source.abilityEvent,
        event,
      );
      if (options.isEmptySequence(sequence)) continue;
      result.push({
        event,
        priority: compileAuditedDefaultPriority(nativeSequence, sequencePath),
        sequence,
        sourceEventIndex: eventIndex,
        sourceSequenceIndex: sequenceIndex,
      });
    }
  }
  return result;
}
