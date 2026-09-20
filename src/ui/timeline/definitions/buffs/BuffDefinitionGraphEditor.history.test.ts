import { createRenderer, h, nextTick, shallowRef, ssrContextKey, type ComponentOptions } from 'vue';
import { expect, it, vi } from 'vitest';
import Graph from './BuffDefinitionGraphEditor.vue';

it('records Inspector edits and invalidates redo when editing after undo', async () => {
  vi.stubGlobal('document', { addEventListener() {}, removeEventListener() {} });
  const definition = shallowRef<any>({
    scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
  });
  let panel: any;
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
  const wrapped = {
    ...(Graph as ComponentOptions),
    setup(props: any, ctx: any) {
      panel = (Graph as any).setup(props, ctx);
      return panel;
    },
    render: () => null,
  };
  const app = renderer.createApp({
    render: () =>
      h(wrapped, {
        buffId: 'test',
        definition: definition.value,
        skillLevel: 1,
        onUpdate: (value: unknown) => {
          definition.value = value;
        },
      }),
  });
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  try {
    const edits = [
      () =>
        panel.updateRootStep({
          kind: 'applyBuff',
          parameters: {
            definition: { ...definition.value, durationSeconds: 5 },
          },
        }),
      () => {
        panel.selectedPath.value = 'scheduledSequences[0]';
        panel.updateSequenceFrame('startFrame', { target: { value: '12' } });
      },
      () => {
        panel.selectedPath.value = 'lifecycleSequences.start.steps[0]';
        panel.editing.property.value.child('kind').update(() => 'finishCurrentAbilityEntity');
      },
      () => {
        panel.selectedPath.value = 'abilityEventResponses[0]';
        panel.updateResponse({ event: 'outputDamage', priority: 1, sequence: { steps: [] } });
      },
    ];
    // Exercise each actual Inspector handler, not a duplicate history implementation.
    for (const edit of edits) {
      definition.value = {
        scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
        lifecycleSequences: {
          start: { steps: [{ kind: 'finishActionOwnerAbilityEntity', parameters: {} }] },
        },
        abilityEventResponses: [{ event: 'outputDamage', priority: 0, sequence: { steps: [] } }],
      };
      await nextTick();
      const before = JSON.parse(JSON.stringify(definition.value));
      edit();
      await nextTick();
      const edited = JSON.parse(JSON.stringify(definition.value));
      expect(edited).not.toEqual(before);
      await panel.restoreStructureHistory('undo');
      expect(definition.value).toEqual(before);
      await panel.restoreStructureHistory('redo');
      expect(definition.value).toEqual(edited);
      await panel.restoreStructureHistory('undo');
      edit();
      await nextTick();
      expect(panel.history.canRedo.value).toBe(false);
      await panel.restoreStructureHistory('redo');
      expect(definition.value).toEqual(edited);
    }
    definition.value = {
      stackingType: 'refresh',
      damageModifiers: [
        {
          enabledSide: 'attacker',
          processors: [{ kind: 'damageScale', side: 'attacker', zone: 'normal', addition: 2 }],
        },
      ],
    };
    await nextTick();
    const beforeDelete = definition.value;
    const processorNode = [...panel.nodeIndex.value.values()].find(
      (node: any) => node.sourcePath === 'damageModifiers[0].processors[0]',
    ) as any;
    expect(processorNode.canDelete).toBe(true);
    await panel.runStructureNodeAction('delete', processorNode);
    expect(definition.value.damageModifiers?.[0]?.processors).toEqual([]);
    await panel.restoreStructureHistory('undo');
    expect(definition.value).toEqual(beforeDelete);
    const find = (path: string) =>
      [...panel.nodeIndex.value.values()].find((node: any) => node.sourcePath === path) as any;
    await panel.runStructureNodeAction('copy', find('damageModifiers[0]'));
    expect(panel.structureClipboard.value.kind).toBe('buffDamageModifier');
    await panel.runStructureNodeAction('paste', find('damageModifiers'));
    await nextTick();
    expect(definition.value.damageModifiers).toHaveLength(2);
    await panel.restoreStructureHistory('undo');
    expect(definition.value).toEqual(beforeDelete);
    await panel.restoreStructureHistory('redo');
    await nextTick();
    panel.selectNode(find('damageModifiers[1]'));
    panel.editing.property.value.child('enabledSide').update(() => 'defender');
    await nextTick();
    const beforeMove = definition.value;
    await panel.moveStructureNode({
      source: find('damageModifiers[1]'),
      target: find('damageModifiers[0]'),
      placement: 'before',
    });
    expect(
      definition.value.damageModifiers?.map(
        (modifier: { enabledSide: string }) => modifier.enabledSide,
      ),
    ).toEqual(['defender', 'attacker']);
    await panel.restoreStructureHistory('undo');
    expect(definition.value).toEqual(beforeMove);
    await panel.beginAdd(find('damageModifiers[0].conditionProgram'), { x: 0, y: 0 });
    await nextTick();
    const beforeProgramDelete = definition.value;
    expect(beforeProgramDelete.damageModifiers?.[0]?.conditionProgram).toEqual({ steps: [] });
    await panel.runStructureNodeAction('delete', find('damageModifiers[0].conditionProgram'));
    expect(definition.value.damageModifiers?.[0]?.conditionProgram).toBeUndefined();
    await panel.restoreStructureHistory('undo');
    expect(definition.value).toEqual(beforeProgramDelete);
    for (const key of [
      'attributeModifiers',
      'skillSlotReplacements',
      'keywordEnhancements',
      'healModifiers',
      'poiseModifiers',
      'shields',
    ]) {
      const before = definition.value;
      await panel.beginAdd(find(key), { x: 0, y: 0 });
      await nextTick();
      expect(find(key).children).toHaveLength(1);
      await panel.runStructureNodeAction('copy', find(`${key}[0]`));
      await panel.runStructureNodeAction('paste', find(key));
      await nextTick();
      expect(find(key).children).toHaveLength(2);
      await panel.moveStructureNode({
        source: find(`${key}[1]`),
        target: find(`${key}[0]`),
        placement: 'before',
      });
      await panel.runStructureNodeAction('delete', find(`${key}[0]`));
      expect(find(key).children).toHaveLength(1);
      await panel.restoreStructureHistory('undo');
      expect(find(key).children).toHaveLength(2);
      expect(before[key]).toBeUndefined();
    }
    const beforeAbsorption = definition.value;
    panel.selectNode(find('shields[0]'));
    panel.editing.property.value
      .child('damageAbsorptions')
      .update(() => [{ damageType: 'physical', ratio: 1, scale: 1 }]);
    await nextTick();
    expect(definition.value.shields[0].damageAbsorptions).toHaveLength(1);
    await panel.restoreStructureHistory('undo');
    await nextTick();
    await nextTick();
    expect(definition.value).toEqual(beforeAbsorption);
    expect(panel.selectedPath.value).toBe('shields[0]');
    await panel.restoreStructureHistory('redo');
    expect(definition.value.shields[0].damageAbsorptions).toHaveLength(1);
    // 表现回到根 Inspector，编辑仍进入同一个历史，并以根属性定位。
    for (const [key, value] of Object.entries({
      presentation: { orderPriority: { useDirectoryValue: false, value: 3, category: '' } },
      childPresentations: [{ buffId: 'child', presentation: {} }],
      sustainedProtection: { target: 'owner', superArmor: 0, impactResistance: 2 },
      role: { kind: 'elementalAttachment', element: 'heat' },
      spellBurst: {
        burstType: 'Fire',
        damageType: 'heat',
        skillSettingDataKey: 'test',
        skillSettingColumn: 1,
        atkScaleBase: 0,
      },
    })) {
      const before = definition.value;
      panel.selectNode({ id: 'buff' });
      panel.editing.context.root.update((current: any) => ({ ...current, [key]: value }), [key]);
      await nextTick();
      expect(definition.value[key]).toEqual(value);
      await panel.restoreStructureHistory('undo');
      expect(definition.value).toEqual(before);
      await nextTick();
      await nextTick();
      expect(panel.selectedId.value).toBe('buff');
      await panel.restoreStructureHistory('redo');
      expect(definition.value[key]).toEqual(value);
    }
  } finally {
    app.unmount();
    vi.unstubAllGlobals();
  }
});
