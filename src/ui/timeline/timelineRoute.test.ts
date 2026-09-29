import { describe, expect, it, vi } from 'vitest';
import router from '../../router';
import { ALL_GAME_TEXT_FAMILIES } from '../../i18n';

vi.mock('vue-router', async importOriginal => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return { ...actual, createWebHistory: actual.createMemoryHistory };
});

describe('timeline route data requirements', () => {
  it('preloads enemy names before the synchronous selector renders', () => {
    expect(router.resolve('/timeline').meta.gameTextFamilies).toEqual(ALL_GAME_TEXT_FAMILIES);
  });
});
