import { type BuffModifierNumberSource } from '../state/foundationState';
/** 修正器的取值来源。保存黑板引用而非捕获 Buff 对象的函数，执行时才读取当前值。 */
import { readActionBlackboard } from '../actions/actionBlackboardExecution';

export function resolveBuffModifierNumber(
  source: BuffModifierNumberSource | undefined,
  value: number | { readonly blackboardKey: string },
  kind: 'damage' | 'heal' | 'poise',
): number {
  if (typeof value === 'number') return value;
  if (source === undefined)
    throw new Error(
      `${kind} modifier blackboard value '${value.blackboardKey}' cannot be resolved`,
    );
  const resolved = readActionBlackboard(source.blackboard, value.blackboardKey);
  if (typeof resolved !== 'number')
    throw new Error(
      `buff '${source.buffId}' ${kind} modifier blackboard value '${value.blackboardKey}' is missing`,
    );
  return resolved;
}
