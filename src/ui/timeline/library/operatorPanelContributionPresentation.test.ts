import { beforeAll, describe, expect, it } from 'vitest';
import { ensureLocaleResources } from '../../../i18n';
import { capturePublishedEquipmentSources } from '../results/publishedBuffSource';
import { resolveOperatorPanelContributionSourceLabel } from './operatorPanelContributionPresentation';

const context = {
  operator: null,
  locale: 'zh-CN',
  translate: (key: string, params?: Record<string, unknown>) =>
    params?.node === undefined ? key : `${key}:${String(params.node)}`,
};

describe('operator panel contribution presentation', () => {
  beforeAll(() => ensureLocaleResources('zh-CN', ['weapons']));

  it('uses the published weapon display identity for both base stats and traits', () => {
    const weapons = capturePublishedEquipmentSources([
      { slug: 'wpn_funnel_0016', assetSlug: 'wpn_funnel_0016' },
    ]);
    const sources = [
      { kind: 'weaponBase', weaponSlug: 'wpn_funnel_0016' },
      {
        kind: 'equipment',
        contribution: { kind: 'weaponTrait', slug: 'wpn_funnel_0016', traitKey: 'skill3' },
      },
    ] as const;
    for (const source of sources) {
      expect(resolveOperatorPanelContributionSourceLabel({ source }, { ...context, weapons })).toBe(
        '四二式·肃阵',
      );
    }
    const custom = capturePublishedEquipmentSources([
      { slug: 'wpn_funnel_0016', assetSlug: 'wpn_funnel_0016', displayName: '自定义武器' },
    ]);
    expect(
      resolveOperatorPanelContributionSourceLabel(
        { source: sources[0] },
        { ...context, weapons: custom },
      ),
    ).toBe('自定义武器');
  });
});
