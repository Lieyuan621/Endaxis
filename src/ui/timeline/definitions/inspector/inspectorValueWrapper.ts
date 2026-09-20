/** 编辑器内部包装不增加真实属性路径；适配器显式关联包装后的类型。 */
export interface InspectorValueAdapter<T extends object> {
  readonly read: (value: unknown) => T;
  readonly write: (value: T) => unknown;
}

export const inspectorValueWrapper: InspectorValueAdapter<{ value: unknown }> = {
  read: value => ({ value }),
  write: wrapped => wrapped.value,
};
