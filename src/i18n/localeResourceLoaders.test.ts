import { createI18n } from 'vue-i18n';
import { describe, expect, it, vi } from 'vitest';
import {
  createLocaleResourceLoaders,
  localeResourceLoaders,
  type LocaleTable,
} from './localeResourceLoaders';

function table(id: string): LocaleTable {
  return { id };
}

describe('localeResourceLoaders', () => {
  it.each(['en', 'zh-CN'] as const)('loads and resolves shared UI text for %s', async locale => {
    const [ui, terms] = await Promise.all([
      localeResourceLoaders.loadUiLocale(locale),
      localeResourceLoaders.loadGameTextFamily(locale, 'terms'),
    ]);

    expect(ui).toHaveProperty('common');
    expect(ui).toHaveProperty('actionGraphEditor.nodes.launchProjectile.name');
    const translator = createI18n({ legacy: false, locale, messages: {} });
    translator.global.setLocaleMessage(locale, ui);
    const t = translator.global.t;
    expect(t('assetWorkspace.close')).toBe(t('common.close'));
    expect(t('actionGraphEditor.options.roleCaster')).toBe(t('enumTerms.class.caster'));
    if (locale === 'zh-CN') {
      expect(t('actionGraphEditor.options.caster')).toBe('施放者');
      expect(t('actionGraphEditor.options.roleCaster')).toBe('术师');
    }
    expect(t('assetWorkspace.operatorProperties.strength')).toBe(t('stats.strength'));
    translator.dispose();
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
      ui: {
        './locales/zh-CN/common.json': importer,
        './locales/zh-CN/asset-editor.json': async () => ({}),
      },
      gameText: {},
    });

    const first = loaders.loadUiLocale('zh-CN');
    const second = loaders.loadUiLocale('zh-CN');

    expect(second).toBe(first);
    expect(importer).toHaveBeenCalledTimes(1);
    resolveImport(table('ui:zh'));
    await expect(first).resolves.toEqual({ id: 'ui:zh' });
  });

  it('loads an ordinary game text family from the effective locale', async () => {
    const loaders = createLocaleResourceLoaders({
      ui: {},
      gameText: { './game-locales/zh/operators.json': async () => table('operators') },
    });
    await expect(loaders.loadGameTextFamily('zh-CN', 'operators')).resolves.toEqual({
      id: 'operators',
    });
  });

  it('forms terms from battle text and the effective UI locale enum terms', async () => {
    const loaders = createLocaleResourceLoaders({
      ui: {
        './locales/en/common.json': async () => ({ enumTerms: table('enum-terms') }),
        './locales/en/asset-editor.json': async () => ({}),
      },
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
