import {
  contingencyContractBuffDefinitions,
  contingencyContractTagDefinitions,
} from '../../data/contingencyContract/generated/contingencyContract.indie_contract002.generated';
import { describe, expect, it } from 'vitest';
import {
  localizedContingencyContractTagName,
  resolveContingencyContractBuffPresentation,
} from './contingencyContractBuffPresentation';

describe('contingency contract Buff presentation', () => {
  const selections = [
    {
      id: 'custom-selection-id:with-colons',
      mechanicId: 'contingency-contract:tag:100202',
      enabled: true,
      parameters: {},
    },
  ];

  it('uses the receipt selection identity to resolve the exact contract tag', () => {
    const presentation = resolveContingencyContractBuffPresentation(
      'upgrade-initialization:mechanic:custom-selection-id:with-colons:0',
      selections,
    );

    expect(presentation?.selectionId).toBe('custom-selection-id:with-colons');
    expect(presentation?.tag.tagId).toBe(100202);
  });

  it('includes the native level suffix in the localized display name', () => {
    const presentation = resolveContingencyContractBuffPresentation(
      'upgrade-initialization:mechanic:custom-selection-id:with-colons:0',
      selections,
    );

    expect(presentation).toBeDefined();
    expect(localizedContingencyContractTagName(presentation!.tag, 'zh-CN')).toBe('改写：刺激 Ⅱ');
    expect(localizedContingencyContractTagName(presentation!.tag, 'en')).toBe('Edit: Thrill Ⅱ');
    expect(localizedContingencyContractTagName(presentation!.tag, 'fr')).toBe('Edit: Thrill Ⅱ');
  });

  it('does not relabel disabled, missing, or non-contract mechanic sources', () => {
    expect(
      resolveContingencyContractBuffPresentation(
        'upgrade-initialization:mechanic:custom-selection-id:with-colons:0',
        [{ ...selections[0]!, enabled: false }],
      ),
    ).toBeUndefined();
    expect(
      resolveContingencyContractBuffPresentation(
        'upgrade-initialization:talent:talent1',
        selections,
      ),
    ).toBeUndefined();
  });
  it.each([
    ['buff_cc_chr_combo_lock_instance', 113502],
    ['buff_cc_chr_disable_normal_skill', 110302],
  ] as const)('锁定 Buff %s 使用对应正式指标图标', (buffId, tagId) => {
    const tag = contingencyContractTagDefinitions.find(tag => tag.tagId === tagId);
    expect(tag).toBeDefined();
    expect(contingencyContractBuffDefinitions[buffId]?.presentation).toMatchObject({
      visible: true,
      showInSquadIcon: true,
      icon: tag!.icon,
    });
  });
});
