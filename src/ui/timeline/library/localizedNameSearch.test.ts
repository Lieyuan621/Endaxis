import { describe, expect, it } from 'vitest';
import { matchesLocalizedNameSearch } from './localizedNameSearch';

describe('localized selection name search', () => {
  it('matches only the current localized display name supplied by the caller', () => {
    expect(matchesLocalizedNameSearch('50式应龙轻甲', '应龙 轻甲')).toBe(true);
    expect(matchesLocalizedNameSearch('50式应龙轻甲', 'item_equip_t4_suit_atk02')).toBe(false);
    expect(matchesLocalizedNameSearch('Perlica', '佩丽卡')).toBe(false);
  });
});
