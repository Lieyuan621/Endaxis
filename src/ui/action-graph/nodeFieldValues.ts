/** 节点表单只改指定字段，保留未展示的参数、引脚及运行身份映射。 */
import type { NodeFieldSchema } from './nodeSchema';

/** 独立资源可能包在实体模板或回调容器内，不能用普通 JSON 参数框绕过资源边界。 */
export function containsActionGraph(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    (Object.hasOwn(value, 'actionGraph') || Object.values(value).some(containsActionGraph))
  );
}

/** 动态分支表也含执行出口；不能让 JSON 表单成为第二套接线入口。 */
export function containsGraphReference(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    (Object.hasOwn(value, '$sequence') || Object.values(value).some(containsGraphReference))
  );
}

export function readNodeField(value: unknown, path: readonly string[]): unknown {
  for (const key of path) {
    if (value === null || typeof value !== 'object') return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

export function writeNodeField(
  value: unknown,
  path: readonly string[],
  fieldValue: unknown,
): unknown {
  if (path.length === 0) return fieldValue;
  const [key, ...rest] = path;
  if (key === '__proto__' || key === 'prototype' || key === 'constructor')
    throw new Error('不能编辑对象原型字段');
  if (Array.isArray(value)) {
    if (!/^(0|[1-9]\d*)$/.test(key!) || Number(key) >= value.length)
      throw new Error('数组输入位置不存在');
    const result = [...value];
    result[Number(key)] = writeNodeField(value[Number(key)], rest, fieldValue);
    return result;
  }
  const record = value !== null && typeof value === 'object' ? value : {};
  const result: Record<string, unknown> = { ...record };
  const child = writeNodeField(readNodeField(record, [key!]), rest, fieldValue);
  if (child === undefined) delete result[key!];
  else result[key!] = child;
  return result;
}

export function formatNodeField(value: unknown, field: NodeFieldSchema): string {
  if (value === undefined) return '';
  return field.control === 'string' ? String(value) : JSON.stringify(value, null, 2);
}

export function parseNodeField(text: string, field: NodeFieldSchema): unknown {
  if (text === '' && !field.required) return undefined;
  if (field.control === 'string') return text;
  const value: unknown = JSON.parse(text);
  if (field.control === 'number' && (typeof value !== 'number' || !Number.isFinite(value)))
    throw new Error(`${field.label} 必须是有限数值`);
  if (field.control === 'boolean' && typeof value !== 'boolean')
    throw new Error(`${field.label} 必须为 true 或 false`);
  if (field.control === 'select' && !field.options?.includes(value as string | number | boolean))
    throw new Error(`${field.label} 不在允许的选项中`);
  if (
    field.control === 'multiselect' &&
    (!Array.isArray(value) || value.some(item => !field.options?.includes(item)))
  )
    throw new Error(`${field.label} 必须从允许的选项中选择`);
  return value;
}
