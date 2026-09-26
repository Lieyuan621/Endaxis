import {
  type GameplayTag,
  type GameplayTagQueryType,
} from '../../../../packages/game-data-contract/src/gameplayTags.ts';
import { assertGameplayTag } from '../../game-data/definitionGuards.ts';
export { GAMEPLAY_TAG_QUERY_TYPES } from '../../../../packages/game-data-contract/src/gameplayTags.ts';
export { assertGameplayTag } from '../../game-data/definitionGuards.ts';
export type {
  GameplayTag,
  GameplayTagQueryType,
} from '../../../../packages/game-data-contract/src/gameplayTags.ts';

/** 路径本身表达层级；运行时不需要数字身份、哈希函数或反查目录。 */
export class GameplayTagRegistry {
  constructor(paths: readonly string[] = []) {
    paths.forEach(assertGameplayTag);
  }

  matches(owned: GameplayTag, required: GameplayTag, exact = false): boolean {
    return owned === required || (!exact && owned.startsWith(required + '/'));
  }

  query(
    ownedTags: Iterable<GameplayTag>,
    requiredTags: readonly GameplayTag[],
    type: GameplayTagQueryType,
    exact = false,
  ): boolean {
    const owned = [...ownedTags];
    const matches = (required: GameplayTag) =>
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
}
