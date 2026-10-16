import { requireArray, requireNonEmptyString, requireNumber, requireRecord } from './primitives.ts';

/** Native 字段类型来自同版本导出目录；此处只转换 JSON 编码，不推断游戏规则。 */
export interface NativeJsonEncodingSchema {
  readonly classes: readonly {
    readonly class: string;
    readonly memberDetails: readonly { readonly name: string; readonly type: string }[];
  }[];
  readonly enumCatalog: {
    readonly enums: readonly {
      readonly type: string;
      readonly members: readonly { readonly name: string; readonly value: number }[];
    }[];
  };
}

/** 读取显式指定的类型目录；不通过文件名推断版本，也不接受缺失的枚举目录。 */
export function parseNativeJsonEncodingSchema(
  value: unknown,
  path: string,
): NativeJsonEncodingSchema {
  const root = requireRecord(value, path);
  const rows = (value: unknown, path: string) =>
    requireArray(value, path).map((value, index) => ({
      value: requireRecord(value, `${path}[${index}]`),
      path: `${path}[${index}]`,
    }));
  const catalog = requireRecord(root.enumCatalog, `${path}.enumCatalog`);
  return {
    classes: rows(root.classes, `${path}.classes`).map(({ value, path }) => ({
      class: requireNonEmptyString(value.class, `${path}.class`),
      // 导出器会标记序列化中存在但运行时字段未解析到的成员；没有类型依据时保持原文。
      memberDetails: rows(value.memberDetails, `${path}.memberDetails`)
        .filter(({ value }) => value.missingRuntimeField !== true)
        .map(({ value, path }) => ({
          name: requireNonEmptyString(value.name, `${path}.name`),
          type: requireNonEmptyString(value.type, `${path}.type`),
        })),
    })),
    enumCatalog: {
      enums: rows(catalog.enums, `${path}.enumCatalog.enums`).map(({ value, path }) => ({
        type: requireNonEmptyString(value.type, `${path}.type`),
        members: rows(value.members, `${path}.members`).map(({ value, path }) => ({
          name: requireNonEmptyString(value.name, `${path}.name`),
          value: requireNumber(value.value, `${path}.value`),
        })),
      })),
    },
  };
}

/**
 * AKEDB 原文仍原样保存。返回新的读取视图，将已知枚举值变为名称；
 * null 对象、数组与未知字段保持原样，由领域解析器决定是否允许。
 * 字符串 null 不在这里改写：原生可能区分 null 与空字符串。
 */
export function createNativeJsonEncodingReader(schema: NativeJsonEncodingSchema) {
  const classes = new Map(
    schema.classes.map(type => [
      type.class,
      new Map(type.memberDetails.map(member => [member.name, member.type])),
    ]),
  );
  const enums = new Map(schema.enumCatalog.enums.map(type => [type.type, type.members]));

  function read(value: unknown, declaredType: string, path: string): unknown {
    if (value === null) return null;
    const members = enums.get(declaredType);
    if (members && typeof value === 'number') {
      const member = members.find(member => member.value === value);
      // 复合 flags 和未知新增值不能按名称拆分或丢弃；保留数值供具体字段验证。
      return member?.name ?? value;
    }
    if (Array.isArray(value)) {
      const elementType = declaredType.endsWith('[]')
        ? declaredType.slice(0, -2)
        : /^System\.Collections\.Generic\.(?:List|IReadOnlyList|HashSet)<(.+)>$/.exec(
            declaredType,
          )?.[1];
      return value.map((item, index) => read(item, elementType ?? '', `${path}[${index}]`));
    }
    if (typeof value !== 'object') return value;
    const record = value as Record<string, unknown>;
    const type =
      typeof record.$type === 'string'
        ? record.$type.split(',')[0]!.trim().replaceAll('+', '.')
        : declaredType;
    const fields = classes.get(type);
    return Object.fromEntries(
      Object.entries(record).map(([key, item]) => [
        key,
        key === '$type' ? item : read(item, fields?.get(key) ?? '', `${path}.${key}`),
      ]),
    );
  }
  return read;
}
