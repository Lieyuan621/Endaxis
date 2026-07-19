import { describe, expect, test } from 'vitest';
import {
  collectOperatorStatusCatalog,
  collectStatusOptions,
  KNOWN_ENEMY_STATUS_KEYS,
  resolveStatusLocaleKey,
  resolveStatusNameKey,
  translateEffectName,
} from './statusOptions';
import { getOperator, getOperatorList } from '@/data';
import { i18n } from '@/i18n';

describe('statusOptions', () => {
  test('maps infliction ids to effects.name keys', () => {
    expect(resolveStatusLocaleKey('cryoInfliction')).toBe('cryo_infliction');
    expect(resolveStatusLocaleKey('vulnerability')).toBe('vulnerability');
  });

  test('translates shared anomaly keys via effects.name only', () => {
    const t = i18n.global.t.bind(i18n.global);
    const te = i18n.global.te.bind(i18n.global);
    i18n.global.locale.value = 'zh-CN';
    expect(translateEffectName(t, te, 'shatter')).toBe('碎冰');
    expect(translateEffectName(t, te, 'breach')).toBe('碎甲');
    expect(translateEffectName(t, te, 'crush')).toBe('猛击');
    expect(translateEffectName(t, te, 'electrification')).toBe('导电');
    expect(translateEffectName(t, te, 'ELEMENT_COMBUSTION')).toBe('燃烧');
    expect(translateEffectName(t, te, 'ELEMENT_ELECTRIFICATION')).toBe('导电');
    expect(translateEffectName(t, te, 'PHYSICAL_BREACH')).toBe('碎甲');
    expect(translateEffectName(t, te, 'combustion_dot')).toBe('燃烧持续伤害');
    expect(translateEffectName(t, te, 'artsBurst')).toBe('元素爆发');
    // Historical display aliases are no longer remapped
    expect(translateEffectName(t, te, 'conductive')).toBe('conductive');
    expect(translateEffectName(t, te, 'knockup')).toBe('knockup');
  });

  test('collects preferred keys and keeps the current value', () => {
    expect(collectStatusOptions(KNOWN_ENEMY_STATUS_KEYS, ['custom-buff'], 'custom-buff')).toEqual(
      expect.arrayContaining(['vulnerability', 'cryoInfliction', 'custom-buff']),
    );
    expect(collectStatusOptions([], ['a', 'a', ''], 'b')).toEqual(['a', 'b']);
  });

  test('resolves operator runtime ids via name map', () => {
    const nameById = { 'tangtang-whirlpools': 'whirlpools' };
    expect(resolveStatusNameKey('tangtang-whirlpools', nameById)).toBe('whirlpools');
    expect(resolveStatusNameKey('cryoInfliction')).toBe('cryo_infliction');
  });

  test('collects tangtang status ids without DoT waterspouts duplicates', () => {
    const catalog = collectOperatorStatusCatalog(getOperator('tangtang'));
    expect(catalog.nameById['tangtang-whirlpools']).toBe('whirlpools');
    expect(catalog.ids).toContain('tangtang-whirlpools');
    expect(catalog.ids).not.toContain('waterspouts');
    expect(catalog.ids).not.toContain('tangtang-t2-waterspouts');
    expect(Object.values(catalog.nameById).filter(name => name === 'waterspouts')).toEqual([]);
  });

  test('scans every operator: status-only catalogs and known named keys resolve', () => {
    const collisions: { slug: string; name: string; ids: string[] }[] = [];

    for (const entry of getOperatorList()) {
      const catalog = collectOperatorStatusCatalog(getOperator(entry.slug));
      const byName = new Map<string, string[]>();
      for (const [id, name] of Object.entries(catalog.nameById)) {
        const list = byName.get(name) || [];
        list.push(id);
        byName.set(name, list);
      }
      for (const [name, ids] of byName) {
        if (ids.length > 1) collisions.push({ slug: entry.slug, name, ids });
      }
    }

    expect(collectOperatorStatusCatalog(getOperator('avywenna')).nameById).toMatchObject({
      'avywenna-thunderlance': expect.any(String),
    });
    expect(
      collectOperatorStatusCatalog(getOperator('xaihi')).nameById['xaihi-auxiliary-crystal'],
    ).toBe('auxiliaryCrystal');
    expect(
      collectOperatorStatusCatalog(getOperator('laevatain')).nameById['laevatain-melting-flame'],
    ).toBe('meltingFlame');
    expect(
      collectOperatorStatusCatalog(getOperator('endministrator')).nameById[
        'endministrator-originium-crystals'
      ],
    ).toBe('originiumCrystals');

    // Same display name on two runtime ids is rare but legal (e.g. Pogranichnik's dual ferventMorale).
    expect(collisions).toEqual([
      {
        slug: 'pogranichnik',
        name: 'ferventMorale',
        ids: ['pogranichnik-t1-atkPercent', 'pogranichnik-t1-artsIntensity'],
      },
    ]);
  });
});
