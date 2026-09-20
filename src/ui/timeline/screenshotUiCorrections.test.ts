import { describe, expect, it, vi } from 'vitest';
import router from '../../router';
import { ALL_GAME_TEXT_FAMILIES } from '../../i18n';
import editor from './TimelineEditor.vue?raw';
import ruler from './components/TimelineRuler.vue?raw';

vi.mock('vue-router', async importOriginal => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return { ...actual, createWebHistory: actual.createMemoryHistory };
});

describe('annotated timeline UI corrections', () => {
  it('preloads enemy names before the synchronous selector renders', () => {
    expect(router.resolve('/timeline').meta.gameTextFamilies).toEqual(ALL_GAME_TEXT_FAMILIES);
  });
  it('removes only the cursor white line, retaining keycaps and automatic simulation', () => {
    expect(ruler).not.toContain('<span class="cursor"');
    expect(ruler).toContain('v-for="operation in operationMarkers"');
    expect(editor).not.toContain("{{ t('timeline.reSimulate') }}");
    expect(editor).toContain('useScenarioSimulation');
  });
});
