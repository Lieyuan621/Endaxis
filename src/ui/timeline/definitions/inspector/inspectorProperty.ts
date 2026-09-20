import { inspectorFieldIssues, type InspectorField } from './inspectorFields';

export interface InspectorIssue {
  readonly path: string;
  readonly message: string;
}
/** 路径以段保存，字典键中的点号不当作层级；由宿主映射到节点/历史位置。 */
export type InspectorPropertyPath = readonly (string | number)[];
export interface InspectorPropertySource<T extends object> {
  read(): T;
  issues(): readonly InspectorIssue[];
  commit(value: T, path: InspectorPropertyPath): void;
  readonly path?: InspectorPropertyPath;
}
export interface InspectorPropertyHandle<T extends object> {
  readonly field: InspectorField<T>;
  readonly path: InspectorPropertyPath;
  readonly value: unknown;
  readonly present: boolean;
  readonly disabled: boolean;
  readonly issues: readonly InspectorIssue[];
  set(value: unknown, editedPath?: InspectorPropertyPath): void;
  setPresent(present: boolean): void;
}

/** 句柄不保存数据副本和历史：每次读取最新宿主值，联动字段一次提交整个结果。 */
export function inspectorProperty<T extends object>(
  source: InspectorPropertySource<T>,
  field: InspectorField<T>,
  relativePath = field.key === '' ? [] : [field.key],
): InspectorPropertyHandle<T> {
  const path = Object.freeze([...(source.path ?? []), ...relativePath]);
  function change(edit: (value: T) => T, editedPath = path) {
    const current = source.read();
    if (field.disabled?.(current)) return;
    const next = edit(current);
    // 子控件只能报告当前属性内部的位置，不能把事务定位到无关属性。
    const location = path.every((segment, index) => editedPath[index] === segment)
      ? editedPath
      : path;
    if (next !== current) source.commit(next, location);
  }
  return {
    field,
    path,
    get value() {
      return field.read(source.read());
    },
    get present() {
      return field.read(source.read()) !== undefined;
    },
    get disabled() {
      return field.disabled?.(source.read()) ?? false;
    },
    get issues() {
      return inspectorFieldIssues(source.issues(), field.key);
    },
    set: (input, editedPath) => change(value => field.write(value, input), editedPath),
    setPresent: enabled => change(value => field.toggle(value, enabled)),
  };
}
