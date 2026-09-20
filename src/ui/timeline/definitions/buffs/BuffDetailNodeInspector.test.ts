import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { expect, it, vi } from 'vitest';
import Inspector from './BuffDetailNodeInspector.vue';
import { buildBuffFlatCollectionGraph } from './buffFlatCollectionGraph';
import { createDefinitionEditContext } from '../definitionEditContext';
import type { SkillBuffDefinition } from '../../../../core/game-data/operatorDefinition';

it('shows each flat member immediately, without collection controls or nested cards', async () => {
  const definition: SkillBuffDefinition = {
    stackingType: 'refresh',
    attributeModifiers: [
      { attribute: { kind: 'secondary' }, slot: 'baseAddition', value: { blackboardKey: 'scale' } },
    ],
    skillSlotReplacements: [
      {
        skillGroupKey: 'skill',
        targetSkillKey: 'target',
        revertedSkillKey: 'original',
        inheritOriginSkillCooldownProgress: true,
      },
    ],
    keywordEnhancements: [
      {
        triggerBuffIds: ['a,b', 'a,b', ''],
        operation: 'add',
        targetKey: 'rate',
        initialValue: 0,
        value: 1,
      },
    ],
  };
  const binding = createDefinitionEditContext({ read: () => definition, commit: vi.fn() }).root;
  for (const collection of buildBuffFlatCollectionGraph(definition)) {
    const node = collection.children[0]!;
    const app = createSSRApp({
      render: () => h(Inspector, { node, property: binding.child(collection.sourcePath).child(0) }),
    });
    app.use(
      createI18n({
        legacy: false,
        locale: 'zh',
        messages: {},
        missingWarn: false,
        fallbackWarn: false,
      }),
    );
    const html = await renderToString(app);
    expect(html).not.toContain('display:none');
    expect(html).not.toContain('添加属性修正器');
    expect(html).not.toContain('关键词强化 1</strong><button');
    if (node.payloadKind === 'buffAttributeModifier') {
      expect(html).toContain('value="secondary"');
      expect(html).toContain('value="scale"');
    } else if (node.payloadKind === 'buffSlotReplacement') {
      expect(html).toContain('value="target"');
      expect(html).toContain('value="original"');
    } else {
      expect(html.match(/value="a,b"/g)).toHaveLength(2);
      expect(html).toContain('value=""');
    }
  }
});
