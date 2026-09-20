import { gameplayTagIdFromPath, type GameplayTagId } from '../../source/nativeGameplayTags.ts';
import type { GameplayTagConfigDumpSource } from '../../source/gameplayTagConfigDump.ts';
import type { GameplayTagConfigReferenceSource } from '../../source/gameplayTagConfigDump.ts';
import { assertGameplayTag } from '../../../../../packages/game-data-contract/src/gameplayTags.ts';

export interface CompiledGameplayTagDefinitionSource {
  readonly id: GameplayTagId;
  readonly path: string;
}

export interface CompiledGameplayTagCatalogSource {
  readonly paths: readonly string[];
  readonly definitions: readonly CompiledGameplayTagDefinitionSource[];
}

/** 计算原生 CRC-32 身份并拒绝路径目录内部的 ID 冲突。 */
export function compileGameplayTagCatalogSource(
  source: GameplayTagConfigDumpSource,
): CompiledGameplayTagCatalogSource {
  source.paths.forEach(assertGameplayTag);
  const definitions = source.paths.map(path => ({ id: gameplayTagIdFromPath(path), path }));
  const ids = new Set<number>();
  for (const definition of definitions) {
    if (ids.has(definition.id)) {
      throw new Error(`GameplayTagConfig CRC-32 collision at ${JSON.stringify(definition.path)}`);
    }
    ids.add(definition.id);
  }
  return { paths: [...source.paths], definitions };
}

/** 来源连接器的输入，不是新的标签协议；身份来自 worker 对象元数据及 CAB 外部表。 */
export interface GameplayTagConfigObjectSource {
  readonly sourceFile: string;
  readonly pathId: string;
  readonly source: GameplayTagConfigDumpSource;
}

/** 按配置集 PPtr 顺序合并，不能把目录里恰好同名或同 pathId 的对象冒充引用目标。 */
export function compileGameplayTagConfigSetSource(
  references: readonly GameplayTagConfigReferenceSource[],
  ownerFile: string,
  dependencies: readonly string[],
  objects: readonly GameplayTagConfigObjectSource[],
) {
  const selected = new Set<GameplayTagConfigObjectSource>();
  const paths = new Set<string>();
  let emptyPathCount = 0,
    duplicatePathCount = 0;
  for (const [index, reference] of references.entries()) {
    const sourceFile = reference.fileId === 0 ? ownerFile : dependencies[reference.fileId - 1];
    const candidates = objects.filter(
      object => object.sourceFile === sourceFile && object.pathId === reference.pathId,
    );
    if (sourceFile === undefined || reference.pathId === '0' || candidates.length !== 1) {
      throw new Error(
        `GameplayTagConfigSet.configs[${index}]: unresolved or ambiguous PPtr ${reference.fileId}:${reference.pathId}`,
      );
    }
    const object = candidates[0]!;
    if (selected.has(object))
      throw new Error(`GameplayTagConfigSet.configs[${index}]: duplicate config reference`);
    selected.add(object);
    for (const tag of object.source.paths) {
      // 原生空字符串 CRC 为 0，即无效 GameplayTag；保留计数，不制造可用标签。
      if (tag === '') {
        emptyPathCount++;
        continue;
      }
      if (paths.has(tag)) duplicatePathCount++;
      paths.add(tag);
    }
  }
  if (selected.size !== objects.length)
    throw new Error('GameplayTagConfigSet: unreferenced config object');
  return {
    catalog: compileGameplayTagCatalogSource({ paths: [...paths] }),
    configCount: selected.size,
    emptyPathCount,
    duplicatePathCount,
  };
}

export function renderGameplayTagCatalogModule(
  catalog: CompiledGameplayTagCatalogSource,
  sourceSha256: string,
): string {
  if (!/^[0-9a-f]{64}$/i.test(sourceSha256)) {
    throw new Error('GameplayTagConfig source SHA-256 is invalid');
  }
  const paths = catalog.paths.map(path => `  ${quoteTypeScriptString(path)},`).join('\n');
  return `/**
 * 由已核验的 GameplayTagConfig / GameplayTagConfigSet 来源生成；只输出可读路径。
 * Source SHA-256: ${sourceSha256.toUpperCase()}
 * Do not edit by hand; rerun npm run generate:game-data:gameplay-tags.
 */
export const GAMEPLAY_TAG_PATHS = Object.freeze([
${paths}
] as const);
`;
}

function quoteTypeScriptString(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}
