import { createRenderer, createSSRApp, h, ssrContextKey, type ComponentOptions } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { expect, it } from 'vitest';
import Page from './SkillGroupPlacementSettings.vue';
import { perlica } from '../../../../data/operators/perlica.generated';
import type { SkillGroupDefinition } from '../../../../core/game-data/operatorDefinition';
const render = (group: SkillGroupDefinition) =>
  renderToString(createSSRApp({ render: () => h(Page, { group }) }));
it('selects on add, permits repeated and empty references, and cancels without an edit', () => {
  let editor: any;
  const source = perlica.skillGroups[0]!;
  const group = { ...source, placementSequenceSkillKeys: [] };
  const updates: SkillGroupDefinition[] = [];
  const component = {
    ...(Page as ComponentOptions),
    setup(props: any, context: any) {
      editor = (Page as any).setup(props, context);
      return editor;
    },
    render: () => null,
  };
  const renderer = createRenderer<object, object>({
    insert() {},
    remove() {},
    patchProp() {},
    setText() {},
    setElementText() {},
    createElement: () => ({}),
    createText: () => ({}),
    createComment: () => ({}),
    parentNode: () => null,
    nextSibling: () => null,
  });
  const app = renderer.createApp({
    render: () =>
      h(component, { group, onUpdate: (value: SkillGroupDefinition) => updates.push(value) }),
  });
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  const event = { clientX: 10, clientY: 20 };
  editor.pick(event);
  expect(updates).toHaveLength(0);
  editor.picker.value = undefined;
  editor.choose('empty');
  expect(updates).toHaveLength(0);
  editor.pick(event);
  const firstSkillKey = 'key' in group.skills ? group.skills.key : group.skills[0]!.key;
  editor.choose(`skill:${firstSkillKey}`);
  expect(updates.at(-1)!.placementSequenceSkillKeys).toEqual([firstSkillKey]);
  expect(editor.picker.value).toBeUndefined();
  editor.pick(event);
  editor.choose('empty');
  expect(updates.at(-1)!.placementSequenceSkillKeys).toEqual(['']);
  expect(group.placementSequenceSkillKeys).toEqual([]);
  app.unmount();
});
it('previews a base/replacement chain using production placement rules without mutating definitions', async () => {
  const source = perlica.skillGroups[0]!;
  const first = Array.isArray(source.skills) ? source.skills[0]! : source.skills;
  const group: SkillGroupDefinition = {
    ...source,
    placementSequenceSkillKeys: [first.key, 'next'],
    replacementSkills: [{ ...first, key: 'next' }],
    replacementSkillPlacements: { next: 'standard' },
    replacementSkillNameQualifiers: { next: 'enhanced' },
  };
  const before = JSON.stringify(group);
  const html = await render(group);
  expect(html).toContain(`${first.key} → next`);
  expect(html).toContain('恢复基础成员顺序');
  expect(JSON.stringify(group)).toBe(before);
});
it('keeps invalid and explicitly empty sequences editable instead of throwing or silently restoring defaults', async () => {
  const source = perlica.skillGroups[0]!;
  expect(await render({ ...source, placementSequenceSkillKeys: ['missing'] })).toContain(
    '草稿仍可继续编辑',
  );
  expect(await render({ ...source, placementSequenceSkillKeys: [] })).toContain('空条目');
  expect(await render(source)).toContain('自定义顺序');
});
it('keeps orphaned placement settings visible and editable after a skill is deleted', async () => {
  const html = await render({
    ...perlica.skillGroups[0]!,
    replacementSkillPlacements: { deleted: 'internal' },
  });
  expect(html).toContain('deleted');
  expect(html).toContain('未找到对应替换技能');
  expect(html).toContain('未指定（普通展示）');
});
