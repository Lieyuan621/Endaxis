import {
  assertGameplayTag,
  GameplayTagRegistry,
  type GameplayTag,
} from '../../core/combat/tags/gameplayTags';
import { GAMEPLAY_TAG_PATHS } from './gameplayTagCatalog.generated';
export { GAMEPLAY_TAG_PATHS };

/** 不含单次模拟状态；只提供路径查询语义和编辑器候选。 */
export const gameplayTagRegistry = new GameplayTagRegistry(GAMEPLAY_TAG_PATHS);
const paths = new Set<string>(GAMEPLAY_TAG_PATHS);

export function requireGameplayTag(path: string): GameplayTag {
  if (!paths.has(path)) throw new Error("GameplayTagConfig 未包含 '" + path + "'");
  return path;
}

/** 自定义干员可以使用可读自定义路径，不接受数字或 unknown 占位符。 */
export function parseGameplayTagReference(value: string): GameplayTag | undefined {
  try {
    const path = value.trim();
    assertGameplayTag(path);
    return path;
  } catch {
    return undefined;
  }
}
