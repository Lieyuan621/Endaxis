import type { InjectionKey, Ref } from 'vue';
import type { InspectorPropertyPath } from './inspector/inspectorProperty';

export interface DefinitionProperty {
  readonly path: InspectorPropertyPath;
  read(): unknown;
  child(key: string | number): DefinitionProperty;
  /** 转换整个当前属性，联动修改仍为一个事务。 */
  update(change: (current: unknown) => unknown, focus?: InspectorPropertyPath): void;
}

export const definitionPropertyKey: InjectionKey<Readonly<Ref<DefinitionProperty>> | undefined> =
  Symbol('definition-property');

/** 派生字段视图保留父字段的读写规则，子修改不能绕过联动清理或校验。 */
export function projectDefinitionProperty(
  parent: DefinitionProperty,
  relativePath: InspectorPropertyPath,
  read: (parent: unknown) => unknown,
  write: (parent: unknown, value: unknown) => unknown,
): DefinitionProperty {
  const path = Object.freeze([...parent.path, ...relativePath]);
  const property: DefinitionProperty = {
    path,
    read: () => {
      const current = parent.read();
      return current === undefined ? undefined : read(current);
    },
    update: (change, focus = path) =>
      parent.update(
        current => (current === undefined ? current : write(current, change(read(current)))),
        focus,
      ),
    child: key =>
      projectDefinitionProperty(
        property,
        [key],
        current =>
          current !== null && typeof current === 'object' && Object.hasOwn(current, key)
            ? (current as Record<string | number, unknown>)[key]
            : undefined,
        (current, value) => {
          if (current === null || typeof current !== 'object' || !Object.hasOwn(current, key))
            return current;
          if (Object.is((current as Record<string | number, unknown>)[key], value)) return current;
          if (Array.isArray(current)) {
            const next = [...current];
            Object.defineProperty(next, key, {
              value,
              writable: true,
              configurable: true,
              enumerable: true,
            });
            return next;
          }
          return { ...current, [key]: value };
        },
      ),
  };
  return property;
}

/** 迁移期唯一适配：已绑定控件读取最新句柄，旧宿主只回传修改结果。 */
export function editPropertyValue<T>(
  binding: DefinitionProperty | undefined,
  value: T,
  change: (current: T) => T,
  fallback: (next: T) => void,
) {
  if (binding) binding.update(current => change(current as T));
  else {
    const next = change(value);
    if (next !== value) fallback(next);
  }
}

/** 容器禁用约束随子句柄继承，不能通过内部字段绕过父属性权限。 */
export function guardDefinitionProperty(
  property: DefinitionProperty,
  enabled: () => boolean,
): DefinitionProperty {
  return {
    path: property.path,
    read: () => property.read(),
    child: key => guardDefinitionProperty(property.child(key), enabled),
    update: (change, focus) => {
      if (enabled()) property.update(change, focus);
    },
  };
}

/** 保存宿主提供根草稿与唯一提交入口；句柄不保存快照、不拥有历史。 */
export function createDefinitionEditContext<T extends object>(host: {
  read(): T;
  commit(next: T, focus: InspectorPropertyPath): void;
}) {
  function at(path: InspectorPropertyPath): DefinitionProperty {
    const stablePath = Object.freeze([...path]);
    function read() {
      let value: unknown = host.read();
      for (const key of stablePath) {
        if (typeof value !== 'object' || value === null || !Object.hasOwn(value, key))
          return undefined;
        value = (value as Record<string | number, unknown>)[key];
      }
      return value;
    }
    return {
      path: stablePath,
      read,
      child: key => at([...stablePath, key]),
      update(change, focus = stablePath) {
        const root = host.read();
        // 容器必须仍然存在；失效句柄不得重新创建已删除的子树。
        function visit(value: unknown, depth: number): unknown {
          if (depth === stablePath.length) return change(value);
          const key = stablePath[depth]!;
          if (typeof value !== 'object' || value === null || !Object.hasOwn(value, key))
            return value;
          const old = (value as Record<string | number, unknown>)[key];
          const next = visit(old, depth + 1);
          if (Object.is(old, next)) return value;
          if (Array.isArray(value)) {
            const copy = [...value];
            Object.defineProperty(copy, key, {
              value: next,
              writable: true,
              configurable: true,
              enumerable: true,
            });
            return copy;
          }
          return { ...value, [key]: next };
        }
        const next = visit(root, 0) as T;
        if (next !== root)
          host.commit(
            next,
            stablePath.every((key, index) => focus[index] === key) ? [...focus] : stablePath,
          );
      },
    };
  }
  return { root: at([]), at };
}
