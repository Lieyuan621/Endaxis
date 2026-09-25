import { createRenderer, h, nextTick, shallowRef, ssrContextKey, type ComponentOptions } from 'vue';
import { expect, it, vi } from 'vitest';
import Graph from './AbilityEntityDefinitionGraphEditor.vue';
import type { AbilityEntityDefinition } from '../../../../core/game-data/operatorDefinition';
import { resolveStructureValue, structureRecordEntryPath } from '../skillStructureEditorCommands';
import { createAbilityEntityChildSkillDraft } from '../skills/skillDefinitionEditorViewModel';

it('keeps all entity Inspector changes in the same undo/redo transaction history', async () => {
  vi.stubGlobal('document', { addEventListener() {}, removeEventListener() {} });
  const initial = (): AbilityEntityDefinition => ({
    lifetime: { kind: 'limited', durationSeconds: 10 },
    childSkill: {
      ...createAbilityEntityChildSkillDraft('child'),
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: {
            steps: [{ kind: 'finishActionOwnerAbilityEntity', parameters: {} }],
          },
        },
      ],
    },
  });
  const definition = shallowRef(initial());
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
        abilityEntityId: 'entity',
        definition: definition.value,
        skillLevel: 1,
        onUpdate: (value: AbilityEntityDefinition) => {
          definition.value = value;
        },
      }),
  });
  app.provide(ssrContextKey, { modules: new Set() });
  app.mount({});
  const event = (value: string) => ({ target: { value } });
  const select = (path: string) => {
    const node = [...panel.nodeIndex.value.values()].find(
      (node: any) => node.sourcePath === path,
    ) as any;
    expect(node, path).toBeDefined();
    panel.selectNode({ id: node.id });
  };
  try {
    const edits = [
      () => panel.setLifetimeKind(event('infinite')),
      () => panel.setLifetimeDurationValue(20),
      () => panel.setBornTags([1]),
      () => panel.setOptionalDefinitionNumber('maxStackingCount', 3),
      () => panel.setDeathReleaseDelay(event('2')),
      () => {
        select('childSkill');
        return panel.updateChildSkillId(event('renamed'));
      },
      () => {
        select('childSkill');
        panel.updateChildBlackboard({ value: 2 });
      },
      () => {
        select('childSkill.scheduledSequences[0]');
        panel.updateSequenceFrame('startFrame', event('12'));
      },
      () => {
        select('childSkill.scheduledSequences[0].sequence.steps[0]');
        panel.editing.property.value.child('kind').update(() => 'finishCurrentAbilityEntity');
      },
    ];
    for (const edit of edits) {
      definition.value = initial();
      await nextTick();
      const before = JSON.parse(JSON.stringify(definition.value));
      await edit();
      await nextTick();
      const after = JSON.parse(JSON.stringify(definition.value));
      expect(after).not.toEqual(before);
      await panel.restoreStructureHistory('undo');
      expect(definition.value).toEqual(before);
      await panel.restoreStructureHistory('redo');
      expect(definition.value).toEqual(after);
      await panel.restoreStructureHistory('undo');
      await edit();
      await nextTick();
      expect(panel.history.canRedo.value).toBe(false);
      await panel.restoreStructureHistory('redo');
      expect(definition.value).toEqual(after);
    }
    definition.value = {
      lifetime: { kind: 'infinite' },
      childSkills: {
        first: createAbilityEntityChildSkillDraft('first'),
        second: createAbilityEntityChildSkillDraft('second'),
      },
    };
    await nextTick();
    select(structureRecordEntryPath('childSkills', 'first'));
    const beforeRename = definition.value;
    const collision = event('second');
    await panel.updateChildSkillId(collision);
    expect(collision.target.value).toBe('first');
    expect(panel.childSkillRenameError.value).toContain('已存在');
    expect(definition.value).toBe(beforeRename);
    await panel.updateChildSkillId(event(''));
    await nextTick();
    expect(definition.value.childSkills?.['']?.skillId).toBe('');
    expect(definition.value.childSkills?.second).toEqual(beforeRename.childSkills?.second);
    await panel.restoreStructureHistory('undo');
    expect(definition.value).toEqual(beforeRename);
    select(structureRecordEntryPath('childSkills', 'first'));
    await panel.updateChildSkillId(event('constructor'));
    await nextTick();
    expect(definition.value.childSkills?.constructor).toMatchObject({ skillId: 'constructor' });
    definition.value = {
      lifetime: { kind: 'infinite' },
      childSkill: {
        ...createAbilityEntityChildSkillDraft('child'),
        scheduledSequences: [
          {
            startFrame: 0,
            sequence: {
              steps: [
                {
                  kind: 'applyBuff',
                  parameters: {
                    buffId: 'inline',
                    target: 'enemy',
                    definition: { stackingType: 'refresh' },
                  },
                },
              ],
            },
          },
        ],
      },
    };
    await nextTick();
    const damagePath =
      'childSkill.scheduledSequences[0].sequence.steps[0].parameters.definition.damageModifiers';
    const find = (path: string) => {
      const node = [...panel.nodeIndex.value.values()].find(
        (node: any) => node.sourcePath === path,
      ) as any;
      expect(node, path).toBeDefined();
      return node;
    };
    const beforeAdd = definition.value;
    await panel.beginAdd(find(damagePath), { x: 0, y: 0 });
    expect(resolveStructureValue(definition.value, `${damagePath}[0].processors`)).toHaveLength(1);
    expect(panel.selectedPath.value).toBe(`${damagePath}[0]`);
    await panel.restoreStructureHistory('undo');
    expect(definition.value).toEqual(beforeAdd);
    await panel.restoreStructureHistory('redo');
    select(`${damagePath}[0].processors[0]`);
    panel.editing.property.value.child('addition').update(() => 3);
    await nextTick();
    expect(resolveStructureValue(definition.value, `${damagePath}[0].processors[0].addition`)).toBe(
      3,
    );
    const beforeDelete = definition.value;
    await panel.runStructureNodeAction('delete', find(`${damagePath}[0].processors[0]`));
    expect(resolveStructureValue(definition.value, `${damagePath}[0].processors`)).toEqual([]);
    await panel.restoreStructureHistory('undo');
    expect(definition.value).toEqual(beforeDelete);
    await panel.beginAdd(find(`${damagePath}[0].condition`), { x: 0, y: 0 });
    expect(resolveStructureValue(definition.value, `${damagePath}[0].condition`)).toEqual({
      kind: 'casterControlled',
    });
    await panel.runStructureNodeAction('delete', find(`${damagePath}[0].condition`));
    expect(resolveStructureValue(definition.value, `${damagePath}[0].condition`)).toBeUndefined();
  } finally {
    app.unmount();
    vi.unstubAllGlobals();
  }
});
