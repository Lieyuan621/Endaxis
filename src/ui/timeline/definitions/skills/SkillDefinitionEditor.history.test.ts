import { computed, createSSRApp, h, type ComponentOptions } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createI18n } from 'vue-i18n';
import { describe, expect, it, vi } from 'vitest';
import SkillDefinitionEditor from './SkillDefinitionEditor.vue';
import type { SkillDefinition } from '../../../../core/game-data/operatorDefinition';
const { revealProperty } = vi.hoisted(() => ({ revealProperty: vi.fn(async () => {}) }));
vi.mock('../inspector/useInspectorPropertyReveal', () => ({
  useInspectorPropertyReveal: () => revealProperty,
}));

describe('skill inspector history integration', () => {
  it('edits inline Buff damage nodes through the skill document and its history', async () => {
    const template: SkillDefinition = {
      key: 'inline',
      timelineBlockFrames: 1,
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
                  definition: { stackingType: 'refresh', durationSeconds: 10 },
                },
              },
            ],
          },
        },
      ],
    };
    let editor: any;
    const app = createSSRApp({
      render: () =>
        h(
          {
            ...(SkillDefinitionEditor as ComponentOptions),
            setup(props: any, context: any) {
              editor = (SkillDefinitionEditor as any).setup(props, context);
              return editor;
            },
            ssrRender: () => {},
          },
          { template, customDefinition: undefined, skillLevel: 1, labels: {} },
        ),
    });
    app.use(
      createI18n({
        legacy: false,
        locale: 'en',
        messages: {},
        missingWarn: false,
        fallbackWarn: false,
      }),
    );
    await renderToString(app);
    const rootPath = 'scheduledSequences[0].sequence.steps[0].parameters.definition';
    const path = `${rootPath}.damageModifiers`;
    const find = (path: string) => {
      const node = [...editor.structureNodeIndex.value.values()].find(
        (node: any) => node.sourcePath === path,
      ) as any;
      expect(node, path).toBeDefined();
      return node;
    };
    expect(find(rootPath).kind).toBe('内联 Buff 定义');
    editor.beginAddChild(find('scheduledSequences[0]'), { x: 0, y: 0 });
    expect(editor.pendingStepTargetPath.value).toBe('scheduledSequences[0].sequence');
    await editor.appendStepToPendingSequence('applyBuff');
    expect(editor.draft.value.scheduledSequences[0].sequence.steps).toHaveLength(2);
    expect(editor.selectedStructureSourcePath.value).toBe(
      'scheduledSequences[0].sequence.steps[1]',
    );
    await editor.restoreStructureHistory('undo');
    expect(editor.draft.value.scheduledSequences[0].sequence.steps).toHaveLength(1);
    editor.beginAddChild(find(path), { x: 0, y: 0 });
    const modifier = find(`${path}[0]`);
    await editor.runStructureNodeAction('copy', modifier);
    await editor.runStructureNodeAction('paste', find(path));
    expect(find(path).children).toHaveLength(2);
    await editor.moveStructureNode({
      source: find(`${path}[1]`),
      target: modifier,
      placement: 'before',
    });
    await editor.runStructureNodeAction('delete', find(`${path}[0]`));
    expect(find(path).children).toHaveLength(1);
    await editor.restoreStructureHistory('undo');
    expect(find(path).children).toHaveLength(2);
    expect(template.scheduledSequences[0]!.sequence.steps[0]).toMatchObject({
      parameters: { definition: { stackingType: 'refresh' } },
    });
    expect(JSON.stringify(template)).not.toContain('damageModifiers');
    await editor.selectStructurePath(rootPath);
    editor.selectedProperty.value.child('durationSeconds').update(() => 25);
    expect(editor.structureUndoStack.value.at(-1).propertyPath).toEqual(['durationSeconds']);
    await editor.restoreStructureHistory('undo');
    expect(editor.selectedStructureSourcePath.value).toBe(rootPath);
    expect(revealProperty).toHaveBeenCalledWith([
      'scheduledSequences',
      0,
      'sequence',
      'steps',
      0,
      'parameters',
      'definition',
      'durationSeconds',
    ]);
  });
  it('delegates embedded edits and history commands to the owning definition without a local transaction', async () => {
    const template: SkillDefinition = {
      key: 'shared',
      timelineBlockFrames: 10,
      scheduledSequences: [],
    };
    const sharedHistory = {
      commit: vi.fn(),
      restore: vi.fn(),
      canUndo: computed(() => true),
      canRedo: computed(() => false),
    };
    let editor: any;
    const app = createSSRApp({
      render: () =>
        h(
          {
            ...(SkillDefinitionEditor as ComponentOptions),
            setup(props: any, context: any) {
              editor = (SkillDefinitionEditor as any).setup(props, context);
              return editor;
            },
            ssrRender: () => {},
          },
          { template, customDefinition: undefined, skillLevel: 1, labels: {}, sharedHistory },
        ),
    });
    app.use(
      createI18n({
        legacy: false,
        locale: 'en',
        messages: {},
        missingWarn: false,
        fallbackWarn: false,
      }),
    );
    await renderToString(app);
    editor.setField('timelineBlockFrames', { target: { value: '20' } });
    expect(sharedHistory.commit).toHaveBeenCalledWith(
      { ...template, timelineBlockFrames: 20 },
      { path: '', propertyPath: undefined },
    );
    expect(editor.structureUndoStack.value).toHaveLength(0);
    expect(editor.draft.value).toBe(template);
    editor.editContext.root.update(
      (value: SkillDefinition) => ({ ...value, naturalDurationFrames: 60 }),
      ['naturalDurationFrames'],
    );
    expect(sharedHistory.commit).toHaveBeenLastCalledWith(
      { ...template, naturalDurationFrames: 60 },
      { path: '', propertyPath: ['naturalDurationFrames'] },
    );
    expect(editor.canUndoStructure.value).toBe(true);
    await editor.restoreStructureHistory('undo');
    expect(sharedHistory.restore).toHaveBeenCalledWith('undo');
    expect(template.timelineBlockFrames).toBe(10);
    editor.beginAddChild(
      { id: 'inputWindows', sourcePath: 'inputWindows', canAddChild: 'lifecycle' },
      { x: 0, y: 0 },
    );
    expect(sharedHistory.commit).toHaveBeenLastCalledWith(
      { ...template, inputWindows: {} },
      { path: 'inputWindows', propertyPath: undefined },
    );
    await editor.beginAddChild(
      { id: 'switchToBuffCast', sourcePath: 'switchToBuffCast', canAddChild: 'lifecycle' },
      { x: 0, y: 0 },
    );
    expect(sharedHistory.commit).toHaveBeenLastCalledWith(
      { ...template, switchToBuffCast: { sequence: { steps: [] } } },
      { path: 'switchToBuffCast', propertyPath: undefined },
    );
  });
  const input = (value: string) => ({ target: { value } });
  const edits: [string, (editor: any) => void][] = [
    [
      'direct property handle',
      editor =>
        editor.editContext.root
          .child('scheduledSequences')
          .child(0)
          .child('sequence')
          .child('steps')
          .child(0)
          .child('kind')
          .update(() => 'finishCurrentAbilityEntityWhenSourceDies'),
    ],
    [
      'combat step',
      editor =>
        editor.replaceSelectedCombatStep({
          kind: 'finishCurrentAbilityEntityWhenSourceDies',
          parameters: {},
        }),
    ],
    ['width', editor => editor.setField('timelineBlockFrames', input('20'))],
    ['cooldown', editor => editor.setField('cooldownFrames', input('40'))],
    ['cost frame', editor => editor.setField('costFrame', input('2'))],
    ['enhancement buff', editor => editor.setEnhancementStateBuffId(input('custom-buff'))],
    ['blackboard', editor => editor.setBlackboard({ test: 1 })],
    ['SP cost', editor => editor.setResourceCost('sp', 25)],
    ['ultimate energy cost', editor => editor.setResourceCost('ultimateEnergy', 20)],
    ['zero cost', editor => editor.setResourceCost('sp', 0)],
    ['level costs', editor => editor.setResourceCost('sp', [30, 20, 10])],
    [
      'delete bypass',
      editor =>
        editor.runStructureNodeAction('delete', {
          id: 'switchToBuffCast',
          sourcePath: 'switchToBuffCast',
          canDelete: true,
        }),
    ],
    [
      'add bypass response',
      async editor => {
        editor.pendingStepTargetPath.value = 'switchToBuffCast.sequence';
        await editor.appendStepToPendingSequence('finishCurrentAbilityEntity');
      },
    ],
    [
      'delete selected step',
      editor => editor.runStructureNodeAction('delete', editor.selectedStructureNode.value),
    ],
  ];
  it.each(edits)('records %s and restores the complete draft on undo/redo', async (_name, edit) => {
    const rootCostEdit = ['SP cost', 'ultimate energy cost', 'zero cost', 'level costs'].includes(
      _name,
    );
    const bypassPath =
      _name === 'delete bypass'
        ? 'switchToBuffCast'
        : _name === 'add bypass response'
          ? 'switchToBuffCast.sequence'
          : undefined;
    const template: SkillDefinition = {
      key: 'test',
      timelineBlockFrames: 10,
      costs: [{ resource: 'sp', value: 10 }],
      switchToBuffCast: { asSkillCast: false, sequence: { steps: [] } },
      scheduledSequences: [
        {
          startFrame: 0,
          sequence: { steps: [{ kind: 'finishCurrentAbilityEntity', parameters: {} }] },
        },
      ],
    };
    let editor: any;
    // Exercise the real parent draft handlers. No template, browser input or
    // nested curve rendering is claimed by this setup-level integration test.
    const component = {
      ...(SkillDefinitionEditor as ComponentOptions),
      setup(props: any, context: any) {
        editor = (SkillDefinitionEditor as any).setup(props, context);
        return editor;
      },
      ssrRender: () => {},
    };
    const app = createSSRApp({
      render: () =>
        h(component, {
          template,
          customDefinition: undefined,
          skillLevel: 1,
          labels: {},
        }),
    });
    app.use(
      createI18n({
        legacy: false,
        locale: 'en',
        messages: { en: {} },
        missingWarn: false,
        fallbackWarn: false,
      }),
    );
    await renderToString(app);
    await editor.selectStructurePath('scheduledSequences[0].sequence.steps[0]');
    const before = JSON.parse(JSON.stringify(editor.draft.value));
    await edit(editor);
    const afterSelection = editor.selectedStructureSourcePath.value;
    const after = JSON.parse(JSON.stringify(editor.draft.value));
    expect(after).not.toEqual(before);
    expect(editor.structureUndoStack.value).toHaveLength(1);
    if (_name === 'direct property handle') {
      expect(editor.structureUndoStack.value[0].propertyPath).toEqual(['kind']);
      expect(editor.structureUndoStack.value[0].selectedPath).toBe(
        'scheduledSequences[0].sequence.steps[0]',
      );
    }
    expect(template.scheduledSequences[0]!.sequence.steps[0]!.kind).toBe(
      'finishCurrentAbilityEntity',
    );
    await editor.restoreStructureHistory('undo');
    expect(editor.draft.value).toEqual(before);
    expect(editor.selectedStructureSourcePath.value).toBe(
      rootCostEdit ? '' : (bypassPath ?? 'scheduledSequences[0].sequence.steps[0]'),
    );
    editor.setResourceCost('sp', undefined);
    expect(editor.structureUndoStack.value).toHaveLength(0);
    expect(editor.structureRedoStack.value).toHaveLength(1);
    await editor.restoreStructureHistory('redo');
    expect(editor.draft.value).toEqual(after);
    expect(editor.selectedStructureSourcePath.value).toBe(
      rootCostEdit ? '' : (bypassPath ?? afterSelection),
    );
  });
});
