import { GAMEPLAY_TAG_PATHS } from '../../../src/data/combat/gameplayTagCatalog.generated.ts';
import { GameplayTagRegistry } from '../src/source/nativeGameplayTags.ts';

/** 测试显式注入来源目录，不让生产编译器隐式加载本体或猜测未知身份。 */
export const fixtureGameplayTagCatalog = decodeURIComponent(
  new URL('../../../src/data/combat/gameplayTagCatalog.generated.ts', import.meta.url).pathname,
).replace(/^\/(?=[A-Za-z]:\/)/, '');
export const fixtureGameplayTagRegistry = new GameplayTagRegistry([
  ...GAMEPLAY_TAG_PATHS,
  'buff/test/crystal',
  'Test/Tag123',
  'Immune/Physical',
  'Immune/Physical/Boss',
]);
