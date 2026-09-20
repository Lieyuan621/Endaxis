export interface GameplayTagConfigDumpSource {
  /** 来源保留空串和重复项；空串无效，完整配置集投影负责显式计数/去重。 */
  readonly paths: readonly string[];
}

/** Unity PPtr 的来源身份；Int64 必须保留十进制字符串，不能经 JS number 舍入。 */
export interface GameplayTagConfigReferenceSource {
  readonly fileId: number;
  readonly pathId: string;
}

/** 严格读取 AnimeStudio TypeTree dump 中 GameplayTagConfig._keyData 的有序路径。 */
export function parseGameplayTagConfigDumpSource(
  bytes: Uint8Array,
  sourcePath: string,
): GameplayTagConfigDumpSource {
  const text = decodeDump(bytes, sourcePath);
  const header = /vector _keyData\s+Array Array\s+int size = (\d+)/.exec(text);
  if (!header || header.index === undefined) {
    throw new Error(`${sourcePath}: GameplayTagConfig _keyData vector was not found`);
  }
  const expectedCount = Number(header[1]);
  if (!Number.isSafeInteger(expectedCount) || expectedCount < 0) {
    throw new Error(`${sourcePath}: invalid GameplayTagConfig path count ${header[1]}`);
  }
  // obsoletes 属于另一组来源数据，不能拿它补足被截断的活动 _keyData。
  const tail = text.slice(header.index + header[0].length).split(/\bvector obsoletes\b/, 1)[0]!;
  const paths = [...tail.matchAll(/string data = "([^"]*)"/g)].map(match => match[1]!);
  if (paths.length !== expectedCount) {
    throw new Error(`${sourcePath}: expected ${expectedCount} tag paths, found ${paths.length}`);
  }
  return { paths };
}

/** 只读取配置集实际引用的对象，不从目录文件名推断成员。 */
export function parseGameplayTagConfigSetDumpSource(
  bytes: Uint8Array,
  sourcePath: string,
): readonly GameplayTagConfigReferenceSource[] {
  const text = decodeDump(bytes, sourcePath);
  const header = /vector configs\s+Array Array\s+int size = (\d+)/.exec(text);
  if (!header) throw new Error(`${sourcePath}: GameplayTagConfigSet configs vector was not found`);
  const count = Number(header[1]);
  if (!Number.isSafeInteger(count)) throw new Error(`${sourcePath}: invalid config count`);
  const tail = text.slice(header.index + header[0].length);
  const references = [
    ...tail.matchAll(
      /PPtr<\$GameplayTagConfig> data\s+int m_FileID = (\d+)\s+SInt64 m_PathID = (-?\d+)/g,
    ),
  ].map(match => {
    const fileId = Number(match[1]);
    const pathId = match[2]!;
    if (
      !Number.isSafeInteger(fileId) ||
      BigInt(pathId) < -(1n << 63n) ||
      BigInt(pathId) >= 1n << 63n
    ) {
      throw new Error(`${sourcePath}: invalid config PPtr`);
    }
    return { fileId, pathId };
  });
  if (references.length !== count)
    throw new Error(
      `${sourcePath}: expected ${count} config references, found ${references.length}`,
    );
  return references;
}

function decodeDump(bytes: Uint8Array, sourcePath: string): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`${sourcePath}: expected UTF-8 TypeTree dump`);
  }
}
