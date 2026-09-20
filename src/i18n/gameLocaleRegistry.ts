/**
 * 已完成加载的游戏文本注册表。
 *
 * 异步调用方必须先 `ensureFamily`，既有同步 getter 才能通过 `getFamily` 读取。未加载时
 * 明确抛错，避免把资源竞态伪装成缺翻译后的名称回退。
 */
import type { SupportedLocale } from './elementPlusLocale';
import {
  localeResourceLoaders,
  resolveGameTextLocale,
  type GameTextFamily,
  type GameTextFamilyTables,
  type GameTextLocale,
  type LocaleResourceLoaders,
} from './localeResourceLoaders';

type FamilyLoader = LocaleResourceLoaders['loadGameTextFamily'];

export class GameTextResourceNotLoadedError extends Error {
  constructor(
    readonly locale: SupportedLocale,
    readonly gameLocale: GameTextLocale,
    readonly family: GameTextFamily,
  ) {
    super(
      `game text resource family '${family}' for locale '${locale}' ` +
        `(game locale '${gameLocale}') is not loaded`,
    );
    this.name = 'GameTextResourceNotLoadedError';
  }
}

function resourceKey(gameLocale: GameTextLocale, family: GameTextFamily): string {
  return `${gameLocale}:${family}`;
}

export class GameLocaleRegistry {
  readonly #loaded = new Map<string, GameTextFamilyTables[GameTextFamily]>();
  readonly #inFlight = new Map<string, Promise<GameTextFamilyTables[GameTextFamily]>>();
  readonly #loadFamily: FamilyLoader;

  constructor(loadFamily: FamilyLoader = localeResourceLoaders.loadGameTextFamily) {
    this.#loadFamily = loadFamily;
  }

  /** 同一有效游戏语言与 family 的并发请求共享一个 Promise。失败后允许重新尝试。 */
  ensureFamily<Family extends GameTextFamily>(
    locale: SupportedLocale,
    family: Family,
  ): Promise<GameTextFamilyTables[Family]> {
    const gameLocale = resolveGameTextLocale(locale);
    const key = resourceKey(gameLocale, family);
    const loaded = this.#loaded.get(key);
    if (loaded !== undefined) {
      return Promise.resolve(loaded as GameTextFamilyTables[Family]);
    }

    const active = this.#inFlight.get(key);
    if (active !== undefined) return active as Promise<GameTextFamilyTables[Family]>;

    const promise = this.#loadFamily(locale, family).then(
      table => {
        this.#loaded.set(key, table);
        this.#inFlight.delete(key);
        return table;
      },
      error => {
        this.#inFlight.delete(key);
        throw error;
      },
    );
    this.#inFlight.set(key, promise);
    return promise;
  }

  /** 仅返回已经完整提交的 family；本方法绝不触发异步加载或跨语言猜测。 */
  getFamily<Family extends GameTextFamily>(
    locale: SupportedLocale,
    family: Family,
  ): GameTextFamilyTables[Family] {
    const gameLocale = resolveGameTextLocale(locale);
    const loaded = this.#loaded.get(resourceKey(gameLocale, family));
    if (loaded === undefined) {
      throw new GameTextResourceNotLoadedError(locale, gameLocale, family);
    }
    return loaded as GameTextFamilyTables[Family];
  }
}

export const gameLocaleRegistry = new GameLocaleRegistry();
