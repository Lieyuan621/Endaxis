/** 图编辑器只持有不可变快照。冻结包含所有嵌套字段；自定义时才复制源数据。 */
const frozen = new WeakSet<object>();
export function freezeGraphDocument<T>(value: T): T {
  if (value === null || typeof value !== 'object' || frozen.has(value)) return value;
  // 先登记，允许共享对象和循环引用；不能因为外层已经 freeze 就跳过内层。
  frozen.add(value);
  for (const child of Object.values(value)) freezeGraphDocument(child);
  Object.freeze(value);
  return value;
}
export function copyCustomGraphDocument<T>(source: T): T {
  return freezeGraphDocument(structuredClone(source));
}
