import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { describe, expect, it } from 'vitest';
import Widget from './OperatorPassiveUiWidget.vue';
import { passiveUiSkins } from '../../operators/passive-ui/registry';
import type { OperatorPassiveUiAppearance } from '../../../../packages/game-data-contract/src/operators';

function render(appearance: OperatorPassiveUiAppearance, state = {}) {
  return renderToString(createSSRApp({ render: () => h(Widget, { appearance, ...state }) }));
}

describe('专属 HUD 外观通过通用容器显示', () => {
  it.each(Object.keys(passiveUiSkins) as OperatorPassiveUiAppearance[])(
    'loads %s and scales to the available space',
    async appearance => {
      const html = await render(appearance, { height: 20, maxWidth: 10 });
      expect(html).toContain('passive-ui-skin');
      expect(html).toContain('width:10px');
      expect(html).not.toContain('NaN');
    },
  );

  it('preserves droplet states and leaf counters', async () => {
    expect(await render('tangtangDroplets', { value: 0 })).toContain(
      'background-color:rgb(98 98 98)',
    );
    expect(await render('tangtangDroplets', { value: 2 })).toContain(
      'background-color:rgb(128 182 255)',
    );
    expect(await render('laevatainCounter', { value: 2, maximum: 4 })).toContain(
      'laevatain-leaf--2',
    );
    const full = await render('laevatainCounter', { value: 4, maximum: 4 });
    expect(full).toContain('laevatain-max');
    expect(full).not.toContain('laevatain-leaf--');
  });

  it('preserves point order, full state and sigil colors', async () => {
    const full = await render('zhuangFangyiThunder', { value: 9, active: true });
    expect(full).toContain('zhuang-fangyi-glow.webp');
    expect(full).toContain('background-color:rgb(255 151 151)');
    expect(full.match(/class="zhuang-point"/g) ?? []).toHaveLength(9);
    expect(await render('arcaneSigils', { value: 0 })).not.toContain('arcane-frame');
    expect(await render('arcaneSigils', { value: 2 })).toContain(
      'background-color:rgb(35 231 188)',
    );
  });

  it('preserves music mode/progress and arrow/point state independently', async () => {
    const music = await render('liinoMusic', { mode: 'ultimate', ratio: 0.25 });
    expect(music).toContain('liino-ultimate-bar.webp');
    expect(music).toContain('inset(75% 0 0 0)');
    const arrows = await render('typhoeaArrows', { value: 2, maximum: 4, points: 3 });
    const classes = [...arrows.matchAll(/class="([^"]*)"/g)].map(match => match[1]!.split(' '));
    expect(
      classes.filter(items => items.includes('typhoea-arrow') && items.includes('is-filled')),
    ).toHaveLength(2);
    expect(
      classes.filter(items => items.includes('typhoea-point') && items.includes('is-filled')),
    ).toHaveLength(3);
    expect(arrows).toContain('/next/passive-ui/typhoea-bg.webp');
  });
});
