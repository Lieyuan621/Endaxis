/**
 * locale 资源的异步文件边界。
 *
 * 本模块只负责把 UI locale 与游戏文本 family 定位到独立动态模块；不切换全局语言，
 * 也不向同步 getter 暴露尚未完成的加载。注册与同步读取由 `gameLocaleRegistry` 负责。
 */
import { normalizeLocale, type SupportedLocale } from './elementPlusLocale';

export type GameTextLocale = 'zh' | 'en';
export type GameTextFamily =
  | 'operators'
  | 'weapons'
  | 'gears'
  | 'enemies'
  | 'consumables'
  | 'terms'
  | 'contingency-contracts';
export type LocaleTable = Readonly<Record<string, unknown>>;

export interface GearLocaleTables {
  readonly gearpieces: LocaleTable;
  readonly gearsets: LocaleTable;
}

export interface TermLocaleTables {
  readonly battleTerms: LocaleTable;
  readonly enums: LocaleTable;
}

export interface GameTextFamilyTables {
  readonly 'contingency-contracts': Readonly<
    Record<string, { readonly name: string; readonly description: string }>
  >;
  readonly operators: LocaleTable;
  readonly weapons: LocaleTable;
  readonly gears: GearLocaleTables;
  readonly enemies: LocaleTable;
  readonly consumables: Readonly<
    Record<string, { readonly name: string; readonly description: string }>
  >;
  readonly terms: TermLocaleTables;
}

type LocaleModuleImporter = () => Promise<LocaleTable>;

export interface LocaleResourceModuleMaps {
  readonly ui: Readonly<Record<string, LocaleModuleImporter>>;
  readonly gameText: Readonly<Record<string, LocaleModuleImporter>>;
}

export interface LocaleResourceLoaders {
  loadUiLocale(locale: SupportedLocale): Promise<LocaleTable>;
  loadGameTextFamily<Family extends GameTextFamily>(
    locale: SupportedLocale,
    family: Family,
  ): Promise<GameTextFamilyTables[Family]>;
}

/** 当前缺少俄语游戏文本，显式沿用既有的英文回退语义。 */
export function resolveGameTextLocale(locale: SupportedLocale): GameTextLocale {
  if (locale === 'zh-CN') return 'zh';
  return 'en';
}

function requireImporter(
  modules: Readonly<Record<string, LocaleModuleImporter>>,
  path: string,
): LocaleModuleImporter {
  const importer = modules[path];
  if (importer === undefined) {
    throw new Error(`locale resource module '${path}' does not exist`);
  }
  return importer;
}

/**
 * 创建一组可隔离测试的资源加载器。UI Promise 在同一 locale 内并发去重；游戏文本的
 * family 去重属于 registry 职责，避免加载层与注册层形成两份状态事实来源。
 */
export function createLocaleResourceLoaders(
  modules: LocaleResourceModuleMaps,
): LocaleResourceLoaders {
  const uiPromises = new Map<SupportedLocale, Promise<LocaleTable>>();
  function loadUiLocale(locale: SupportedLocale): Promise<LocaleTable> {
    const normalized = normalizeLocale(locale);
    const existing = uiPromises.get(normalized);
    if (existing !== undefined) return existing;
    const path = `./locales/${normalized}.json`;
    const promise = requireImporter(modules.ui, path)().catch(error => {
      uiPromises.delete(normalized);
      throw error;
    });
    uiPromises.set(normalized, promise);
    return promise;
  }

  return {
    loadUiLocale,

    loadGameTextFamily<Family extends GameTextFamily>(
      locale: SupportedLocale,
      family: Family,
    ): Promise<GameTextFamilyTables[Family]> {
      const gameLocale = resolveGameTextLocale(locale);
      const basePath = `./game-locales/${gameLocale}`;

      if (family === 'gears') {
        // 两张装备表必须共同成功后才形成一个 family 结果，调用方不会看到半加载状态。
        return Promise.all([
          requireImporter(modules.gameText, `${basePath}/gearpieces.json`)(),
          requireImporter(modules.gameText, `${basePath}/gearsets.json`)(),
        ]).then(
          ([gearpieces, gearsets]) => ({ gearpieces, gearsets }) as GameTextFamilyTables[Family],
        );
      }

      if (family === 'terms') {
        const uiLocale = gameLocale === 'zh' ? 'zh-CN' : 'en';
        return Promise.all([
          requireImporter(modules.gameText, `${basePath}/terms.json`)(),
          loadUiLocale(uiLocale),
        ]).then(([battleTerms, uiMessages]) => {
          const enums = uiMessages.enumTerms;
          if (typeof enums !== 'object' || enums === null || Array.isArray(enums))
            throw new Error(`locale resource '${uiLocale}.enumTerms' does not exist`);
          return { battleTerms, enums } as GameTextFamilyTables[Family];
        });
      }

      const path = `${basePath}/${family}.json`;
      return requireImporter(modules.gameText, path)() as Promise<GameTextFamilyTables[Family]>;
    },
  };
}

// `eager` 保持 false，构建产物只在对应 loader 被调用时请求目标 locale 模块。
const uiLocaleModules = import.meta.glob<LocaleTable>('./locales/*.json', {
  eager: false,
  import: 'default',
});
const gameTextLocaleModules = import.meta.glob<LocaleTable>('./game-locales/*/*.json', {
  eager: false,
  import: 'default',
});

export const localeResourceLoaders = createLocaleResourceLoaders({
  ui: uiLocaleModules,
  gameText: gameTextLocaleModules,
});
