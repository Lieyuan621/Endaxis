import { describe, expect, test } from 'vitest';
import editorSource from '@/views/TimelineEditor.vue?raw';
import cardSource from '@/components/TimelineShareCard.vue?raw';
import dialogSource from '@/components/SmallImageExportDialog.vue?raw';

describe('small image export wiring', () => {
  test('TimelineEditor exposes small image export entry', () => {
    expect(editorSource).toContain('SmallImageExportDialog');
    expect(editorSource).toContain('openSmallImageExport');
    expect(editorSource).toContain('timeline.export.exportSmallImage');
  });

  test('share card uses fixed block height and combat icon toggle', () => {
    expect(cardSource).toContain('blockHeight');
    expect(cardSource).toContain('showCombatIcons');
    expect(cardSource).toContain('showKeycaps');
    expect(cardSource).toContain('showPrep');
    expect(cardSource).toContain('showTimeTicks');
    expect(cardSource).toContain('collectActionCombatBadges');
    expect(cardSource).toContain('share-card__op-rail');
  });

  test('preview dialog saves via snapdom', () => {
    expect(dialogSource).toContain('snapdom');
    expect(dialogSource).toContain('addMetadataToPng');
    expect(dialogSource).toContain('saveSmallImage');
  });
});
