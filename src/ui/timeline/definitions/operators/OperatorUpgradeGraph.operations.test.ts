import { createRenderer, h, nextTick, shallowRef, ssrContextKey } from 'vue';
import { expect, it, vi } from 'vitest';
import Graph from '../actions/ActionSequenceGraphEditor.vue';
import { buildOperatorUpgradeGraph } from './operatorUpgradeGraph';
import { findSkillStructureNodeForPath } from '../skillStructureMindMapModel';

it('copies, reorders and undoes upgrade members without editing their source objects', async () => {
  vi.stubGlobal('document', { addEventListener() {}, removeEventListener() {} });
  const original = {
    levels: 2,
    modifiers: [
      { kind: 'addBuildAttribute', attributes: ['strength'], value: [1, 2] },
      {
        kind: 'patchSkillBlackboard',
        skillGroupKey: 'battleSkill',
        blackboardKey: 'value',
        operation: 'add',
        value: 1,
        condition: {
          kind: 'deckAttributeCompare',
          left: 'strength',
          operator: 'equal',
          right: 'agility',
        },
      },
    ],
    passiveSkills: [{ key: 'source', enableSequence: { steps: [] } }],
  };
  const value = shallowRef<any>(original);
  let editor: any;
  const component = {
    ...(Graph as any),
    setup(props: any, ctx: any) {
      editor = (Graph as any).setup(props, ctx);
      return editor;
    },
    render: () => null,
  };
  const app = createRenderer<object, object>({
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
  }).createApp({
    render: () =>
      h(component, {
        sequence: value.value,
        buildRoot: (doc: any) => buildOperatorUpgradeGraph(doc, '天赋 1'),
        skillLevel: 1,
        createStep: () => ({ kind: 'finishActionOwnerAbilityEntity', parameters: {} }),
        duplicateStep: (v: unknown) => structuredClone(v),
        duplicatePayload: (kind: string, v: any) =>
          kind === 'upgradePassive' ? { ...v, key: 'copy' } : structuredClone(v),
        onUpdate: (v: unknown) => {
          value.value = v;
        },
      }),
  });
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  const node = (path: string) => findSkillStructureNodeForPath(editor.root.value, path);
  try {
    editor.nodeAction('copy', node('modifiers[0]'));
    editor.nodeAction('paste', node('modifiers'));
    await nextTick();
    expect(value.value.modifiers).toHaveLength(3);
    await editor.moveNode({
      source: node('modifiers[2]'),
      target: node('modifiers[0]'),
      placement: 'before',
    });
    expect(value.value.modifiers[2].kind).toBe('patchSkillBlackboard');
    editor.history.restore('undo');
    await nextTick();
    expect(value.value.modifiers[1].kind).toBe('patchSkillBlackboard');
    editor.nodeAction('delete', node('modifiers[1].condition'));
    await nextTick();
    expect(value.value.modifiers[1].condition).toBeUndefined();
    expect(node('modifiers[1].condition').canAddChild).toBeDefined();
    editor.history.restore('undo');
    await nextTick();
    expect(value.value.modifiers[1].condition.left).toBe('strength');
    editor.nodeAction('copy', node('passiveSkills[0]'));
    editor.nodeAction('paste', node('passiveSkills'));
    await nextTick();
    expect(value.value.passiveSkills.map((p: any) => p.key)).toEqual(['source', 'copy']);
    expect(original.modifiers).toHaveLength(2);
    expect(original.passiveSkills).toHaveLength(1);
  } finally {
    app.unmount();
    vi.unstubAllGlobals();
  }
});
