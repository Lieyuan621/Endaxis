import type { ActionGraphReference } from '../intermediateDefinitions.ts';

/**
 * 枚举当前资源内动作字段的执行入口。独立资源拥有自己的节点空间，不能越界扫描；
 * nodeBindings 是调用身份映射，不是执行连线。数组中的事件响应和回调同样参与枚举。
 * 此处只枚举引用，不推断执行顺序、调用次数或变量作用域。
 */
export function visitActionGraphReferences(
  value: unknown,
  visit: (reference: ActionGraphReference) => void,
): void {
  if (!value || typeof value !== 'object' || 'actionGraph' in value) return;
  if (Array.isArray(value)) {
    value.forEach(item => visitActionGraphReferences(item, visit));
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (key === 'nodeBindings') continue;
    if (key === '$sequence' && (typeof item === 'string' || item === null)) {
      visit({ $sequence: item });
    } else visitActionGraphReferences(item, visit);
  }
}
