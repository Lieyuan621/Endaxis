import { buildActionSequenceMindMap } from '../skillStructureMindMapModel';
import { createRenderer, h, nextTick, shallowRef, ssrContextKey } from 'vue';
import { expect, it, vi } from 'vitest';
import Graph from './ActionSequenceGraphEditor.vue';
import { findSkillStructureNodeForPath } from '../skillStructureMindMapModel';

it('edits, copies, moves into a branch, and restores the sequence through actual graph handlers', async () => {
  vi.stubGlobal('document', { addEventListener() {}, removeEventListener() {} });
  const step = { kind: 'finishActionOwnerAbilityEntity', parameters: {} };
  const original = {
    steps: [
      step,
      {
        kind: 'conditional',
        parameters: { condition: { kind: 'all', conditions: [] } },
        whenTrue: { steps: [] },
      },
    ],
  };
  const sequence = shallowRef<any>(original);
  let panel: any;
  const component = {
    ...(Graph as any),
    setup(props: any, ctx: any) {
      panel = (Graph as any).setup(props, ctx);
      return panel;
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
        sequence: sequence.value,
        buildRoot: buildActionSequenceMindMap,
        initialOverview: false,
        skillLevel: 1,
        createStep: () => step,
        duplicateStep: (value: unknown) => structuredClone(value),
        onUpdate: (value: unknown) => {
          sequence.value = value;
        },
      }),
  });
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  const node = (path: string) => findSkillStructureNodeForPath(panel.root.value, path);
  try {
    panel.selectNode(node('steps[0]'));
    panel.updateValue({ ...step, key: 'edited' });
    await nextTick();
    expect(sequence.value.steps[0].key).toBe('edited');
    panel.nodeAction('copy', node('steps[0]'));
    panel.nodeAction('paste', node(''));
    await nextTick();
    expect(sequence.value.steps).toHaveLength(3);
    await panel.moveNode({
      source: node('steps[0]'),
      target: node('steps[1].whenTrue'),
      placement: 'inside',
    });
    expect(sequence.value.steps[0].whenTrue.steps[0].key).toBe('edited');
    panel.history.restore('undo');
    await nextTick();
    expect(sequence.value.steps).toHaveLength(3);
    panel.beginAdd(node('steps[1].whenFalse'), { x: 10, y: 20 });
    panel.appendStep('finishActionOwnerAbilityEntity');
    await nextTick();
    expect(sequence.value.steps[1].whenFalse.steps).toHaveLength(1);
    expect(panel.history.canRedo.value).toBe(false);
    expect(original.steps).toHaveLength(2);
    sequence.value = {
      steps: [
        { kind: 'listenForCombatEvents', parameters: { responses: [] } },
        {
          kind: 'applyBuff',
          parameters: {
            buffId: 'inline',
            definition: { stackingType: 'refresh', durationSeconds: 5 },
          },
        },
      ],
    };
    await nextTick();
    panel.beginAdd(node('steps[0]'), { x: 10, y: 20 });
    await nextTick();
    const responsePath = 'steps[0].parameters.responses[0]';
    expect(node(responsePath).payloadKind).toBe('eventResponse');
    panel.selectNode(node(responsePath));
    panel.updateValue({
      ...sequence.value.steps[0].parameters.responses[0],
      key: 'edited-response',
    });
    await nextTick();
    expect(sequence.value.steps[0].parameters.responses[0].key).toBe('edited-response');
    panel.selectNode(node('steps[1].parameters.definition'));
    expect(panel.inlineBuff.value.parameters.definition.durationSeconds).toBe(5);
    panel.updateInlineBuff({
      kind: 'applyBuff',
      parameters: { definition: { stackingType: 'refresh' } },
    });
    await nextTick();
    expect(sequence.value.steps[1].parameters.definition.durationSeconds).toBeUndefined();
    panel.history.restore('undo');
    await nextTick();
    expect(sequence.value.steps[1].parameters.definition.durationSeconds).toBe(5);
  } finally {
    app.unmount();
    vi.unstubAllGlobals();
  }
});
