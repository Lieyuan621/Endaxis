import { afterEach, describe, expect, it, vi } from 'vitest';
import { SUPPORTED_LOCALES, normalizeLocale } from './elementPlusLocale';
import { detectLocale } from './index';

describe('normalizeLocale', () => {
  it('offers exactly the two shipped locales', () => {
    expect(SUPPORTED_LOCALES).toEqual(['zh-CN', 'en']);
  });

  it('selects zh-CN for any Chinese tag', () => {
    for (const raw of ['zh', 'zh-CN', 'zh-cn', 'ZH-Hans', 'zh-TW', ' zh ']) {
      expect(normalizeLocale(raw)).toBe('zh-CN');
    }
  });

  it('defaults to English when there is no preference at all', () => {
    for (const raw of [undefined, null, '', '   ', 0, false]) {
      expect(normalizeLocale(raw)).toBe('en');
    }
  });

  it('sends every other language to English, including the retired ru', () => {
    // Users with endaxis_locale:'ru' persisted, or a Russian browser, must land on English.
    for (const raw of ['ru', 'ru-RU', 'RU', 'en', 'en-GB', 'fr', 'ja', 'nonsense']) {
      expect(normalizeLocale(raw)).toBe('en');
    }
  });
});

describe('detectLocale on a first visit', () => {
  afterEach(() => vi.unstubAllGlobals());

  function visitWith(languages: string[], language = languages[0] ?? '') {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
    vi.stubGlobal('navigator', { languages, language });
    return detectLocale();
  }

  it('picks Chinese wherever it appears in the list, not only when first', () => {
    expect(visitWith(['zh-CN', 'en'])).toBe('zh-CN');
    expect(visitWith(['en-US', 'zh-CN'])).toBe('zh-CN');
    expect(visitWith(['ru', 'zh-CN'])).toBe('zh-CN');
    expect(visitWith(['fr', 'de', 'zh'])).toBe('zh-CN');
  });

  it('falls back to English when no Chinese preference is listed', () => {
    expect(visitWith(['en-US', 'en'])).toBe('en');
    expect(visitWith(['ru', 'ru-RU'])).toBe('en');
    expect(visitWith([])).toBe('en');
  });

  it('reads navigator.language when the list is empty', () => {
    expect(visitWith([], 'zh-TW')).toBe('zh-CN');
    expect(visitWith([], 'ru')).toBe('en');
  });

  it('prefers a saved choice over the browser', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'en', setItem: () => {} });
    vi.stubGlobal('navigator', { languages: ['zh-CN'], language: 'zh-CN' });
    expect(detectLocale()).toBe('en');
  });
});
