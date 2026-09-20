export type SourceRecord = Record<string, unknown>;

/** 只依据调用方提供的精确常量表归一化数字/命名枚举；不按序号猜值，也不做字符串强转。 */
export function requireNativeEnum<T extends string>(
  value: unknown,
  values: ReadonlyMap<number, T>,
  path: string,
): T {
  for (const [number, name] of values) {
    if (value === number || value === name) return name;
  }
  throw new Error(`${path}: unknown native enum ${JSON.stringify(value)}`);
}

/** 严格读取原生对象；数组不能冒充带字段的数据对象。 */
export function requireRecord(value: unknown, path: string): SourceRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${path}: expected object`);
  }
  return value as SourceRecord;
}

export function requireArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path}: expected array`);
  }
  return value;
}

export function requireNumber(value: unknown, path: string): number {
  if (typeof value !== 'number') {
    throw new Error(`${path}: expected number`);
  }
  return value;
}

export function requireBoolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${path}: expected boolean`);
  }
  return value;
}

export function requireString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${path}: expected string`);
  }
  return value;
}

export function requireNonEmptyString(value: unknown, path: string): string {
  const result = requireString(value, path);
  if (result.length === 0) {
    throw new Error(`${path}: expected non-empty string`);
  }
  return result;
}

/** 当前 VFS 用整数 0 表示 Default，命名来源直接使用枚举名。 */
export function requireNativeActionPriority(value: unknown, path: string): string {
  return value === 0 ? 'Default' : requireNonEmptyString(value, path);
}

/** 枚举或位掩码在命名 JSON 中是字符串，在 VFS 原始导出中是整数。 */
export function requireNamedOrInteger(value: unknown, path: string): string | number {
  return typeof value === 'number'
    ? requireInteger(value, path)
    : requireNonEmptyString(value, path);
}

/** 校验版本敏感的原生结构，防止新增字段被旧转换器静默吞掉。 */
export function requireExactFields(
  value: SourceRecord,
  expectedFields: ReadonlySet<string>,
  path: string,
): void {
  const actualFields = Object.keys(value).sort();
  if (
    actualFields.length !== expectedFields.size ||
    actualFields.some(field => !expectedFields.has(field))
  ) {
    throw new Error(`${path}: unexpected fields ${JSON.stringify(actualFields)}`);
  }
}

export function requireNonNegativeInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${path}: expected non-negative integer`);
  }
  return value;
}

export function requireInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${path}: expected integer`);
  }
  return value;
}

export function nativeActionName(typeName: string): string {
  // 原生导出的类型可能同时包含命名空间、嵌套类型和程序集名。
  const qualifiedName = typeName.split(',', 1)[0] ?? '';
  const segments = qualifiedName.split('.');
  const unqualifiedName = segments.at(-1) ?? '';
  const ownerName = segments.at(-2);
  // VFS 的 MemoryPack schema 用点连接嵌套载荷，Unity JSON 用加号。
  // 只归一化已知 Data / OwnerData 形式，不按任意 *Data 后缀推断动作归属。
  if (ownerName && (unqualifiedName === 'Data' || unqualifiedName === `${ownerName}Data`)) {
    return ownerName;
  }
  return unqualifiedName.split('+', 1)[0] ?? '';
}

export function toFloat32(value: number): number {
  return Math.fround(value);
}

/**
 * 按原生 TickIntervalAction 的单精度累计方式投影触发帧。
 * 每次加法和乘法都必须重新截断，不能只在最终结果上截断。
 */
export function projectTickIntervalFrames(
  startFrame: number,
  endFrame: number,
  intervalSeconds: number,
): number[] {
  let timer = toFloat32(0);
  const deltaTime = toFloat32(1 / 30);
  const interval = toFloat32(intervalSeconds);
  let tickedCount = 0;
  const result: number[] = [];

  for (let frame = startFrame; frame <= endFrame; frame += 1) {
    timer = toFloat32(timer + deltaTime);
    const nextTickTime = toFloat32(toFloat32(tickedCount) * interval);
    if (timer >= nextTickTime) {
      result.push(frame);
      tickedCount += 1;
    }
  }
  return result;
}
