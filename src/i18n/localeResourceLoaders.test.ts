import { describe, expect, it, vi } from 'vitest';
import {
  createLocaleResourceLoaders,
  localeResourceLoaders,
  resolveGameTextLocale,
  type LocaleTable,
} from './localeResourceLoaders';

function table(id: string): LocaleTable {
  return { id };
}

describe('localeResourceLoaders', () => {
  it.each([
    ['zh-CN', 'zh'],
    ['en', 'en'],
  ] as const)('maps UI locale %s to game locale %s', (locale, expected) => {
    expect(resolveGameTextLocale(locale)).toBe(expected);
  });

  it('loads existing UI and game text modules through the default non-eager glob maps', async () => {
    const [ui, terms] = await Promise.all([
      localeResourceLoaders.loadUiLocale('en'),
      localeResourceLoaders.loadGameTextFamily('en', 'terms'),
    ]);

    expect(ui).toHaveProperty('common');
    expect(terms.battleTerms).toHaveProperty('ba.fireburst');
    expect(terms.enums).toHaveProperty('element');
  });

  it('deduplicates concurrent UI locale imports', async () => {
    let resolveImport!: (value: LocaleTable) => void;
    const importer = vi.fn(
      () =>
        new Promise<LocaleTable>(resolve => {
          resolveImport = resolve;
        }),
    );
    const loaders = createLocaleResourceLoaders({
      ui: { './locales/zh-CN.json': importer },
      gameText: {},
    });

    const first = loaders.loadUiLocale('zh-CN');
    const second = loaders.loadUiLocale('zh-CN');

    expect(second).toBe(first);
    expect(importer).toHaveBeenCalledTimes(1);
    resolveImport(table('ui:zh'));
    await expect(first).resolves.toEqual({ id: 'ui:zh' });
  });

  it('loads every non-gear family from the effective game locale', async () => {
    const gameText = Object.fromEntries(
      ['operators', 'weapons', 'enemies'].map(family => [
        `./game-locales/en/${family}.json`,
        vi.fn(async () => table(family)),
      ]),
    );
    const loaders = createLocaleResourceLoaders({ ui: {}, gameText });

    await expect(loaders.loadGameTextFamily('en', 'operators')).resolves.toEqual({
      id: 'operators',
    });
    await expect(loaders.loadGameTextFamily('en', 'weapons')).resolves.toEqual({ id: 'weapons' });
    await expect(loaders.loadGameTextFamily('en', 'enemies')).resolves.toEqual({ id: 'enemies' });
  });

  it('forms terms from battle text and the effective UI locale enum terms', async () => {
    const loaders = createLocaleResourceLoaders({
      ui: { './locales/en.json': async () => ({ enumTerms: table('enum-terms') }) },
      gameText: {
        './game-locales/en/terms.json': async () => table('battle-terms'),
      },
    });

    await expect(loaders.loadGameTextFamily('en', 'terms')).resolves.toEqual({
      battleTerms: { id: 'battle-terms' },
      enums: { id: 'enum-terms' },
    });
  });

  it('forms gears only after both gear tables load successfully', async () => {
    const gearpieces = vi.fn(async () => table('gearpieces'));
    const gearsets = vi.fn(async () => table('gearsets'));
    const loaders = createLocaleResourceLoaders({
      ui: {},
      gameText: {
        './game-locales/zh/gearpieces.json': gearpieces,
        './game-locales/zh/gearsets.json': gearsets,
      },
    });

    await expect(loaders.loadGameTextFamily('zh-CN', 'gears')).resolves.toEqual({
      gearpieces: { id: 'gearpieces' },
      gearsets: { id: 'gearsets' },
    });
    expect(gearpieces).toHaveBeenCalledOnce();
    expect(gearsets).toHaveBeenCalledOnce();
  });

  it('rejects the whole gears family when either table fails', async () => {
    const loaders = createLocaleResourceLoaders({
      ui: {},
      gameText: {
        './game-locales/en/gearpieces.json': async () => table('gearpieces'),
        './game-locales/en/gearsets.json': async () => {
          throw new Error('gearsets unavailable');
        },
      },
    });

    await expect(loaders.loadGameTextFamily('en', 'gears')).rejects.toThrow('gearsets unavailable');
  });
});
