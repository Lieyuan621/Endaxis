import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it } from 'vitest';
import Page from './OperatorSkillLibraryGroupPage.vue';
import { perlica } from '../../../../data/operators/perlica.generated';
it('separates placement presentation from actual per-skill levels and exposes all origins', async () => {
  const source = perlica.skillGroups[0]!;
  const skill = Array.isArray(source.skills) ? source.skills[0]! : source.skills;
  const group = {
    ...source,
    variants: [
      {
        key: 'variant-test',
        levelSource: 'ultimate' as const,
        skills: { ...skill, key: 'variant-skill' },
      },
    ],
    replacementSkills: [{ ...skill, key: 'replacement-test' }],
  };
  const html = await renderToString(
    createSSRApp({ render: () => h(Page, { group, first: true, last: false }) }),
  );
  expect(html).toContain('基础放置项名称修饰');
  expect(html).toContain('variant-skill');
  expect(html).toContain('replacement-test');
  expect(html).not.toContain('分组决定');
  expect(html).not.toContain('养成等级来源');
});
