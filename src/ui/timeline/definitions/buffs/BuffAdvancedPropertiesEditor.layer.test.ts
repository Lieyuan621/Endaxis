import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it } from 'vitest';
import Editor from './BuffAdvancedPropertiesEditor.vue';
import { BUFF_OPTIONAL_OBJECTS } from './buffOptionalPropertyDefaults';

it('根 Inspector 每组独立折叠，字段保持挂载并提供统一历史定位路径', async () => {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(Editor, {
          propertyPath: ['definition'],
          sustainedProtection: BUFF_OPTIONAL_OBJECTS.sustainedProtection.create(),
          role: BUFF_OPTIONAL_OBJECTS.role.create(),
          spellBurst: BUFF_OPTIONAL_OBJECTS.spellBurst.create(),
        }),
    }),
  );
  expect(html.match(/<details/g)).toHaveLength(4);
  expect(html).not.toContain('<details open');
  expect(html).toContain('冲击抗性');
  expect(html).toContain('SkillSetting 数据键');
  expect(html).toContain('data-property-path="[&quot;definition&quot;,&quot;role&quot;]"');
});
