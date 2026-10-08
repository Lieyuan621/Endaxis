import { canSelectReference, type ReferenceChoices } from '@/application/editor/referenceResolver';
import {
  resolveBlackboardKey,
  unknownBlackboardContext,
  type BlackboardFieldContext,
} from '@/application/editor/blackboardFieldContext';

/** 节点连接由所属图编辑，文本字段只编辑字符串常量。 */
export function isStringNodeReference(value: unknown): boolean {
  return !!value && typeof value === 'object' && 'kind' in value && value.kind === 'stringNode';
}

/** 字符串常量在提交时按最新资源目录检查。 */
export function validStringOperandDraft(
  value: unknown,
  family?: string,
  choices?: ReferenceChoices,
): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    (!family || canSelectReference(family, value, choices?.[family]))
  );
}

/** 字符串读取节点按目标作用域检查变量类型和可见性。 */
export function validStringReadSource(
  value: unknown,
  context: BlackboardFieldContext = unknownBlackboardContext(),
): boolean {
  if (typeof value === 'string') return value.length > 0;
  if (
    !value ||
    typeof value !== 'object' ||
    !('blackboardKey' in value) ||
    typeof value.blackboardKey !== 'string' ||
    !value.blackboardKey.length
  )
    return false;
  return resolveBlackboardKey(context, value.blackboardKey, {
    mode: 'read',
    valueType: 'string',
  }).valid;
}
