import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it } from 'vitest';
import Page from './OperatorProvenancePage.vue';
import { perlica } from '../../../../data/operators/perlica.generated';
it('groups editable diagnostics by destination without offering dead links for readonly or unknown fields', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Page, {
          definition: perlica,
          issues: [
            { path: 'passiveUi.maximum', message: '显示范围错误' },
            { path: 'gameId', message: '身份错误' },
            { path: 'unknown.field', message: '未知问题' },
            { path: 'passiveSkills[0].key', message: '被动问题' },
            { path: 'eventHandlers[0].event', message: '监听问题' },
          ],
        }),
    }),
  );
  expect(html).toContain('前往状态表现');
  expect(html).toContain('只读来源记录');
  expect(html).toContain('尚无对应编辑入口');
  expect(html).not.toContain('前往定义身份');
  expect(html.match(/class="issue-group"/g)).toHaveLength(4);
  expect(html.indexOf('显示范围错误')).toBeLessThan(html.indexOf('passiveUi.maximum'));
});
it('distinguishes missing conversion evidence from complete and preserves alias direction', async () => {
  const definition = {
    ...perlica,
    conversionSupport: undefined,
    skillAliases: [
      { from: ['old-group', 'old-skill'] as const, to: ['new-group', 'new-skill'] as const },
    ],
  };
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Page, { definition, issues: [{ path: 'skillGroups[0]', message: '测试问题' }] }),
    }),
  );
  expect(html).toContain('未提供转换结论');
  expect(html).toContain('old-group / old-skill');
  expect(html).toContain('new-group / new-skill');
  expect(html).toContain('测试问题');
  expect(html).not.toContain('<input');
});
