import { beforeAll, describe, expect, it } from 'vitest';
import { ensureLocaleResources } from '../../../i18n';
import { capturePublishedEquipmentSources } from '../results/publishedBuffSource';
import type { OperatorPanelContributionReceipt } from '../../../core/compiler/resolveOperatorPanel';
import { resolveOperatorPanelContributionSourceLabel } from './operatorPanelContributionPresentation';

const context = {
  operator: null,
  locale: 'zh-CN',
  translate: (key: string, params?: Record<string, unknown>) =>
    params?.node === undefined ? key : `${key}:${String(params.node)}`,
};

function entry(
  source: OperatorPanelContributionReceipt['source'],
): OperatorPanelContributionReceipt {
  return { source, stat: 'attack', operation: 'percent', value: 0.1 };
}

describe('operator panel contribution presentation', () => {
  beforeAll(() => ensureLocaleResources('zh-CN', ['weapons']));

  it('uses the published weapon display identity for both base stats and traits', () => {
    const weapons = capturePublishedEquipmentSources([
      { slug: 'wpn_funnel_0016', assetSlug: 'wpn_artsunit_0016' },
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
      { slug: 'wpn_funnel_0016', assetSlug: 'wpn_artsunit_0016', displayName: '自定义武器' },
    ]);
    expect(
      resolveOperatorPanelContributionSourceLabel(
        { source: sources[0] },
        { ...context, weapons: custom },
      ),
    ).toBe('自定义武器');
  });
  it('uses stable translated labels for base and trust sources', () => {
    expect(
      resolveOperatorPanelContributionSourceLabel(
        entry({ kind: 'operatorBase', operatorSlug: 'test' }),
        context,
      ),
    ).toBe('statDetail.baseSource');
    expect(
      resolveOperatorPanelContributionSourceLabel(
        entry({ kind: 'trust', operatorSlug: 'test', node: 4 }),
        context,
      ),
    ).toBe('timeline.panel.trustNode:4');
  });

  it('keeps an unresolved upgrade identity visible rather than inventing a name', () => {
    expect(
      resolveOperatorPanelContributionSourceLabel(
        entry({ kind: 'operatorUpgrade', source: 'potential', index: 9 }),
        context,
      ),
    ).toBe('potential 10');
  });
});
