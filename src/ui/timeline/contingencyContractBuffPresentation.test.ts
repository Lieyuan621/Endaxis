import { describe, expect, it } from 'vitest';
import {
  formatContingencyContractBuffSourceName,
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

  it('identifies both the contract operation and its exact tag in the source label', () => {
    expect(
      formatContingencyContractBuffSourceName('危机合约', '重燃测试作战', '改写：刺激 Ⅱ'),
    ).toBe('危机合约「重燃测试作战」· 改写：刺激 Ⅱ');
  });
});
