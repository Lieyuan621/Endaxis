import type { InspectorField } from './inspectorFields';

/** 显式集合视图：单值/数组契约保持不变，仅在用户修改时归一化；普通列表不使用此适配。 */
export function enumSelectionField<T extends object>(field: InspectorField<T>): InspectorField<T> {
  const options = field.options ?? field.variants?.find(shape => shape.type === 'enum')?.options;
  if (!options) throw new Error(`枚举集合缺少契约候选值：${field.key}`);
  const allowEmpty = field.optional === true;
  return {
    ...field,
    widget: 'enumSelection',
    options,
    optional: false,
    selection: { allowEmpty, ...(allowEmpty ? { emptyLabelKey: 'common.all' } : {}) },
    read: value => {
      const current = field.read(value);
      return current === undefined ? [] : typeof current === 'string' ? [current] : current;
    },
    write: (value, input) => {
      if (!Array.isArray(input) || input.some(item => !options.includes(item))) return value;
      if (!input.length) return allowEmpty ? field.toggle(value, false) : value;
      return field.write(
        value,
        field.editor === 'enumList' ? input : input.length === 1 ? input[0] : input,
      );
    },
  };
}
