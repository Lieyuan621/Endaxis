/**
 * 复现原生 GameplayTag 的稳定身份与层级查询语义。
 * 标签路径必须由数据导出层提供；未知数值 ID 可以保留，但无法凭哈希反推出父标签。
 */

/** 原生 GameplayTag 使用的有符号 32 位 CRC32 身份。 */
export type GameplayTagId = number & { readonly __gameplayTagId: unique symbol };

import type { GameplayTagQueryType } from '../../../../packages/game-data-contract/src/gameplayTags.ts';
export { GAMEPLAY_TAG_QUERY_TYPES } from '../../../../packages/game-data-contract/src/gameplayTags.ts';
export type { GameplayTagQueryType } from '../../../../packages/game-data-contract/src/gameplayTags.ts';

/** 将解包出的有符号 int32 转为标签身份，同时拒绝被截断或错误解析的数值。 */
export function gameplayTagId(value: number): GameplayTagId {
  if (!Number.isInteger(value) || value < -0x80000000 || value > 0x7fffffff) {
    throw new RangeError('gameplay tag id must be a signed 32-bit integer');
  }
  return value as GameplayTagId;
}

/** 按原生规则计算完整斜杠路径的 CRC32，并转为有符号 int32。 */
export function gameplayTagIdFromPath(path: string): GameplayTagId {
  if (path.length === 0) throw new Error('gameplay tag path must not be empty');
  let crc = 0xffffffff;
  for (const byte of new TextEncoder().encode(path)) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return gameplayTagId((crc ^ 0xffffffff) | 0);
}

/** 标签路径层级。非精确查询依赖它展开父路径；只持有裸 ID 时只能精确匹配。 */
export class GameplayTagRegistry {
  readonly #paths = new Map<GameplayTagId, string>();

  /** 仅供来源投影判定一个原生身份是否属于已核验目录；不把数字身份带入运行时。 */
  find(id: number): string | undefined {
    return this.#paths.get(gameplayTagId(id));
  }

  /** 只在来源侧解析原生身份；未知标签必须阻断输出。 */
  resolve(id: number, sourcePath = 'GameplayTag'): string {
    const path = this.find(id);
    if (path === undefined)
      throw new Error(`${sourcePath}: 无法解析 GameplayTag ID ${id}，请补齐同版本标签目录`);
    return path;
  }

  readonly #ancestors = new Map<GameplayTagId, ReadonlySet<GameplayTagId>>();

  constructor(paths: readonly string[]) {
    for (const path of paths) this.register(path);
  }

  matches(owned: GameplayTagId, required: GameplayTagId, exact = false): boolean {
    if (owned === required) return true;
    return !exact && (this.#ancestors.get(owned)?.has(required) ?? false);
  }

  query(
    ownedTags: Iterable<GameplayTagId>,
    requiredTags: readonly GameplayTagId[],
    type: GameplayTagQueryType,
    exact = false,
  ): boolean {
    const owned = [...ownedTags];
    const matches = (required: GameplayTagId) =>
      owned.some(candidate => this.matches(candidate, required, exact));
    switch (type) {
      case 'hasAny':
        return requiredTags.some(matches);
      case 'hasAll':
        return requiredTags.every(matches);
      case 'exceptAny':
        return !requiredTags.some(matches);
      case 'exceptAll':
        return !requiredTags.every(matches);
    }
  }

  private register(path: string): void {
    if (path.length === 0) throw new Error('gameplay tag path must not be empty');
    const segments = path.split('/');
    if (segments.some(segment => segment.length === 0)) {
      throw new Error(`invalid gameplay tag path '${path}'`);
    }
    const id = gameplayTagIdFromPath(path);
    const ancestors = new Set<GameplayTagId>();
    for (let length = 1; length < segments.length; length += 1) {
      ancestors.add(gameplayTagIdFromPath(segments.slice(0, length).join('/')));
    }
    for (let length = 1; length <= segments.length; length += 1) {
      const name = segments.slice(0, length).join('/');
      const key = gameplayTagIdFromPath(name);
      const previous = this.#paths.get(key);
      if (previous !== undefined && previous !== name)
        throw new Error(`GameplayTag CRC32 collision: ${previous} / ${name}`);
      this.#paths.set(key, name);
    }
    this.#ancestors.set(id, ancestors);
  }
}
