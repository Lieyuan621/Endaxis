import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import ArmoryLevelSlot from './ArmoryLevelSlot.vue';

async function renderSlot(state: 'base' | 'active' | 'empty' | 'locked') {
  return renderToString(
    createSSRApp({ render: () => h(ArmoryLevelSlot, { state, label: '等级 2' }) }),
  );
}

describe('武器与装备共用等级格', () => {
  it('已激活格使用同一斜杠图形和按钮状态', async () => {
    const html = await renderSlot('active');
    expect(html).toContain('armory-level-slot--active');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-label="等级 2"');
    expect(html).toContain('<svg');
    expect(html).toContain('M4.5 12.5 11.5 3.5');
    expect(html).not.toContain(' disabled');
  });

  it('空格可操作，基础与锁定格不可操作', async () => {
    expect(await renderSlot('empty')).toContain('aria-pressed="false"');
    expect(await renderSlot('empty')).not.toContain(' disabled');
    expect(await renderSlot('base')).toContain(' disabled');
    expect(await renderSlot('locked')).toContain(' disabled');
  });
});
