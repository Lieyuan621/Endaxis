import type { ActionValueOperand } from '../../../../../packages/game-data-contract/src/conditions';
import type { LevelValues } from '../../../../../packages/game-data-contract/src/primitives';
import type { CombatStepParameters } from '../../../../../packages/game-data-contract/src/actions';

export type { ActionStringOperand as InspectorStringReference } from '../../../../../packages/game-data-contract/src/primitives';
import type { ActionStringOperand as InspectorStringReference } from '../../../../../packages/game-data-contract/src/primitives';
export type InspectorBuffAssignments = NonNullable<
  CombatStepParameters['applyBuff']['blackboardAssignments']
>;

/** 联合值保留各分支的结构，不把数值、表达式或单值/列表互相隐式归一化。 */
export interface InspectorValueShape {
  readonly type:
    | 'text'
    | 'number'
    | 'boolean'
    | 'enum'
    | 'textList'
    | 'enumList'
    | 'actionValue'
    | 'stringReference'
    | 'union'
    | 'object'
    | 'array'
    | 'levelValues'
    | 'dictionary';
  readonly element?: InspectorValueShape;
  readonly options?: readonly string[];
  readonly variants?: readonly InspectorValueShape[];
  readonly properties?: Readonly<
    Record<string, InspectorValueShape & { readonly optional?: boolean }>
  >;
}
export function matchesInspectorValue(shape: InspectorValueShape, value: unknown): boolean {
  switch (shape.type) {
    case 'dictionary':
      return (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !!shape.element &&
        Object.values(value).every(item => matchesInspectorValue(shape.element!, item))
      );
    case 'array':
      return (
        Array.isArray(value) &&
        !!shape.element &&
        value.every(item => matchesInspectorValue(shape.element!, item))
      );
    case 'levelValues':
      return typeof value === 'number'
        ? Number.isFinite(value)
        : Array.isArray(value) &&
            value.every(item => typeof item === 'number' && Number.isFinite(item));
    case 'text':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'enum':
      return typeof value === 'string' && !!shape.options?.includes(value);
    case 'textList':
      return Array.isArray(value) && value.every(item => typeof item === 'string');
    case 'enumList':
      return (
        Array.isArray(value) &&
        value.every(item => typeof item === 'string' && shape.options?.includes(item))
      );
    case 'actionValue':
      return typeof value === 'object' && value !== null && 'kind' in value;
    case 'stringReference':
      return (
        typeof value === 'string' ||
        (typeof value === 'object' && value !== null && 'blackboardKey' in value)
      );
    case 'union':
      return !!shape.variants?.some(variant => matchesInspectorValue(variant, value));
    case 'object': {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
      const discriminators = Object.entries(shape.properties ?? {}).filter(
        ([key, field]) => field.type === 'enum' && (key === 'kind' || field.options?.length === 1),
      );
      // 无 kind 的联合通过必需字段区分；不能让第一个空判别集合匹配所有对象。
      if (
        !discriminators.length &&
        Object.entries(shape.properties ?? {}).some(
          ([key, field]) => !field.optional && !Object.hasOwn(value, key),
        )
      )
        return false;
      // 用判别字段选择对象分支；允许其余参数短暂非法，让领域校验展示具体错误。
      return discriminators.every(([key, field]) =>
        matchesInspectorValue(field, (value as Record<string, unknown>)[key]),
      );
    }
  }
}
export function initialInspectorValue(shape: InspectorValueShape): unknown {
  switch (shape.type) {
    case 'dictionary':
      return {};
    case 'array':
      return [];
    case 'levelValues':
      return 0;
    case 'text':
    case 'stringReference':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'enum':
      return shape.options?.[0];
    case 'textList':
    case 'enumList':
      return [];
    case 'actionValue':
      return { kind: 'constant', value: 0 };
    case 'union':
      return shape.variants?.[0] ? initialInspectorValue(shape.variants[0]) : undefined;
    case 'object':
      return Object.fromEntries(
        Object.entries(shape.properties ?? {})
          .filter(([, field]) => !field.optional)
          .map(([key, field]) => [key, initialInspectorValue(field)]),
      );
  }
}

/** 元数据只描述编辑方式，不重新声明游戏枚举或领域校验规则。 */
type Control<V> =
  | (NonNullable<V> extends LevelValues
      ? LevelValues extends NonNullable<V>
        ? { editor: 'levelValues' }
        : never
      : never)
  | (string extends NonNullable<V>
      ? NonNullable<V> extends string
        ? { editor: 'text' }
        : never
      : never)
  | (NonNullable<V> extends string
      ? { editor: 'enum'; options: readonly NonNullable<V>[]; optionLabelPrefix: string }
      : never)
  | (NonNullable<V> extends number ? { editor: 'number' } : never)
  | (NonNullable<V> extends boolean ? { editor: 'boolean' } : never)
  | (NonNullable<V> extends ActionValueOperand ? { editor: 'actionValue' } : never)
  | (InspectorStringReference extends NonNullable<V>
      ? NonNullable<V> extends InspectorStringReference
        ? { editor: 'stringReference' }
        : never
      : never)
  | (InspectorBuffAssignments extends NonNullable<V>
      ? NonNullable<V> extends InspectorBuffAssignments
        ? { editor: 'buffAssignments' }
        : never
      : never);

type FieldOptions<T, K extends keyof T> = Control<T[K]> & {
  labelKey: string;
  helpKey?: string;
  disabled?: (value: T) => boolean;
  /** 需要联动清理的字段使用显式命令；普通字段不必提供。 */
  replace?: (value: T, input: NonNullable<T[K]>) => T;
} & (undefined extends T[K]
    ? { optional: true; create: () => NonNullable<T[K]> }
    : { optional?: false });

export interface InspectorField<T> {
  /** 语义控件覆盖不改变契约字段的结构类型。 */
  readonly widget?: 'gameplayTags' | 'enumSelection';
  /** 集合选择控件的交互边界，不把普通枚举列表隐式变成集合。 */
  readonly selection?: { readonly allowEmpty: boolean; readonly emptyLabelKey?: string };
  readonly key: string;
  readonly editor:
    | 'text'
    | 'enum'
    | 'textList'
    | 'enumList'
    | 'number'
    | 'boolean'
    | 'actionValue'
    | 'stringReference'
    | 'buffAssignments'
    | 'union'
    | 'object'
    | 'array'
    | 'levelValues'
    | 'dictionary';
  readonly variants?: readonly InspectorValueShape[];
  readonly properties?: InspectorValueShape['properties'];
  readonly element?: InspectorValueShape;
  readonly labelKey: string;
  readonly helpKey?: string;
  readonly options?: readonly string[];
  readonly optionLabelPrefix?: string;
  readonly optional?: boolean;
  readonly disabled?: (value: T) => boolean;
  read(value: T): unknown;
  write(value: T, input: unknown): T;
  toggle(value: T, enabled: boolean): T;
}

/** 字段名和控件类型在声明处检查；来自 DOM 的值在写入边界检查。 */
export function inspectorField<T extends object>() {
  return <K extends Extract<keyof T, string>>(
    key: K,
    options: FieldOptions<T, K>,
  ): InspectorField<T> => {
    return createInspectorField<T>(key, options as unknown as StructureFieldOptions<T>);
  };
}

/** 供契约自动生成结构使用的入口；手写声明仍必须经过上面的类型约束工厂。 */
export type StructureFieldOptions<T> = Pick<
  InspectorField<T>,
  | 'editor'
  | 'labelKey'
  | 'helpKey'
  | 'options'
  | 'optionLabelPrefix'
  | 'optional'
  | 'disabled'
  | 'variants'
  | 'properties'
  | 'element'
> & {
  create?: () => unknown;
  replace?: (value: T, input: unknown) => T;
};
export function createInspectorField<T extends object>(
  key: string,
  spec: StructureFieldOptions<T>,
): InspectorField<T> {
  return {
    ...spec,
    key,
    read: value => (value as Record<string, unknown>)[key],
    write(value, input) {
      if (spec.disabled?.(value)) return value;
      if (
        (spec.editor === 'array' ||
          spec.editor === 'levelValues' ||
          spec.editor === 'dictionary') &&
        !matchesInspectorValue({ type: spec.editor, element: spec.element }, input)
      )
        return value;
      if (
        spec.editor === 'object' &&
        !matchesInspectorValue({ type: 'object', properties: spec.properties }, input)
      )
        return value;
      if (
        spec.editor === 'union' &&
        !matchesInspectorValue({ type: 'union', variants: spec.variants }, input)
      )
        return value;
      if (
        (spec.editor === 'textList' || spec.editor === 'enumList') &&
        (!Array.isArray(input) ||
          input.some(
            item =>
              typeof item !== 'string' ||
              (spec.editor === 'enumList' && !spec.options?.includes(item)),
          ))
      )
        return value;
      if (spec.editor === 'text' && typeof input !== 'string') return value;
      if (spec.editor === 'enum' && (typeof input !== 'string' || !spec.options?.includes(input)))
        return value;
      if (spec.editor === 'number' && (typeof input !== 'number' || !Number.isFinite(input)))
        return value;
      if (spec.editor === 'boolean' && typeof input !== 'boolean') return value;
      // 复合操作数由专用控件生成，完整合法性仍交给已有领域校验器。
      if (
        spec.editor === 'actionValue' &&
        (input === null || typeof input !== 'object' || !('kind' in input))
      )
        return value;
      if (
        spec.editor === 'stringReference' &&
        typeof input !== 'string' &&
        (input === null ||
          typeof input !== 'object' ||
          !('blackboardKey' in input) ||
          typeof input.blackboardKey !== 'string')
      )
        return value;
      if (
        spec.editor === 'buffAssignments' &&
        (input === null || typeof input !== 'object' || Array.isArray(input))
      )
        return value;
      return spec.replace ? spec.replace(value, input as unknown) : { ...value, [key]: input };
    },
    toggle(value, enabled) {
      if (!spec.optional || spec.disabled?.(value)) return value;
      if (enabled)
        return (value as Record<string, unknown>)[key] === undefined
          ? { ...value, [key]: spec.create?.() }
          : value;
      const next = { ...value };
      delete (next as Record<string, unknown>)[key];
      return next;
    },
  };
}

/** 字段级错误按路径归属，包含复合字段内部的错误。 */
export function inspectorFieldIssues(
  issues: readonly { path: string; message: string }[],
  key: string,
) {
  if (key === '') return issues;
  return issues.filter(
    issue =>
      issue.path === key || issue.path.startsWith(`${key}.`) || issue.path.startsWith(`${key}[`),
  );
}
