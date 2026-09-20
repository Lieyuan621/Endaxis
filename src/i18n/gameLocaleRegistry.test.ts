import { describe, expect, it, vi } from 'vitest';
import type { SupportedLocale } from './elementPlusLocale';
import { GameLocaleRegistry, GameTextResourceNotLoadedError } from './gameLocaleRegistry';
import type { GameTextFamily, GameTextFamilyTables, LocaleTable } from './localeResourceLoaders';

function table(id: string): LocaleTable {
  return { id };
}

describe('GameLocaleRegistry', () => {
  it('throws a specific error when a synchronous read precedes loading', () => {
    const registry = new GameLocaleRegistry(vi.fn());

    expect(() => registry.getFamily('zh-CN', 'operators')).toThrow(GameTextResourceNotLoadedError);
    expect(() => registry.getFamily('zh-CN', 'operators')).toThrow(
      "game text resource family 'operators' for locale 'zh-CN' (game locale 'zh') is not loaded",
    );
  });

  it('deduplicates concurrent family loads and exposes the committed table synchronously', async () => {
    let resolveLoad!: (value: LocaleTable) => void;
    let loadCalls = 0;
    const loadFamily = <Family extends GameTextFamily>(
      _locale: SupportedLocale,
      _family: Family,
    ) => {
      loadCalls += 1;
      return new Promise<GameTextFamilyTables[Family]>(resolve => {
        resolveLoad = value => resolve(value as GameTextFamilyTables[Family]);
      });
    };
    const registry = new GameLocaleRegistry(loadFamily);

    const first = registry.ensureFamily('zh-CN', 'operators');
    const second = registry.ensureFamily('zh-CN', 'operators');

    expect(second).toBe(first);
    expect(loadCalls).toBe(1);
    resolveLoad(table('operators:zh'));
    await expect(first).resolves.toEqual({ id: 'operators:zh' });
    expect(registry.getFamily('zh-CN', 'operators')).toEqual({ id: 'operators:zh' });
  });

  it('shares the effective English resource between en and ru', async () => {
    let loadCalls = 0;
    const loadFamily = async <Family extends GameTextFamily>(
      _locale: SupportedLocale,
      _family: Family,
    ): Promise<GameTextFamilyTables[Family]> => {
      loadCalls += 1;
      return table('operators:en') as GameTextFamilyTables[Family];
    };
    const registry = new GameLocaleRegistry(loadFamily);

    await registry.ensureFamily('ru', 'operators');

    expect(registry.getFamily('en', 'operators')).toEqual({ id: 'operators:en' });
    expect(loadCalls).toBe(1);
  });

  it('does not commit a failed gears load and permits a complete retry', async () => {
    const gears: GameTextFamilyTables['gears'] = {
      gearpieces: table('gearpieces'),
      gearsets: table('gearsets'),
    };
    const loadFamily = vi
      .fn()
      .mockRejectedValueOnce(new Error('gear family incomplete'))
      .mockResolvedValueOnce(gears);
    const registry = new GameLocaleRegistry(loadFamily);

    await expect(registry.ensureFamily('en', 'gears')).rejects.toThrow('gear family incomplete');
    expect(() => registry.getFamily('en', 'gears')).toThrow(GameTextResourceNotLoadedError);

    await expect(registry.ensureFamily('en', 'gears')).resolves.toBe(gears);
    expect(registry.getFamily('ru', 'gears')).toBe(gears);
    expect(loadFamily).toHaveBeenCalledTimes(2);
  });
});
