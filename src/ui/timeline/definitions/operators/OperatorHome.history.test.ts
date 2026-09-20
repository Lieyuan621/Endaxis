import { createRenderer, h, nextTick, ssrContextKey, type ComponentOptions } from 'vue';
import { it, expect } from 'vitest';
import { createI18n } from 'vue-i18n';
import Workspace from './OperatorDefinitionWorkspaceDialog.vue';
import { perlica } from '../../../../data/operators/perlica.generated';
import { listOperatorSkillDefinitionBindings } from '../../../../core/game-data/operatorSkillDefinitions';
import { resolveStructureValue } from '../skillStructureEditorCommands';
import { operatorSkillBindingPath } from './operatorSkillLocation';
import {
  appendEmptyOperatorVariant,
  editOperatorLibrarySkillMember,
} from './operatorLibraryCreation';
it('edits all same-key containment variants through root history and returns to the exact skill', async () => {
  const skill = { key: 'same', scheduledSequences: [], timelineBlockFrames: 1 };
  const definition = {
    ...perlica,
    skillGroups: [
      {
        key: 'group',
        skills: [skill],
        variants: [{ key: 'variant', skills: [{ ...skill }] }],
        replacementSkills: [{ ...skill }],
        routedReplacementSkills: [{ skill: { ...skill } }],
      },
    ],
  } as unknown as typeof perlica;
  let editor: any;
  const component = {
    ...(Workspace as ComponentOptions),
    setup(props: any, context: any) {
      editor = (Workspace as any).setup(props, context);
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
    render: () => h(component, { visible: true, baseDefinition: definition, skillLevel: 1 }),
  });
  app.provide(ssrContextKey, { modules: new Set() });
  app.use(createI18n({ legacy: false, locale: 'zh-CN', messages: {} }));
  app.mount({});
  expect(editor.section.value).toBe('home');
  const binding = listOperatorSkillDefinitionBindings(definition)[0]!;
  for (const origin of ['home', 'library']) {
    if (origin === 'home') editor.openHomeSkill(binding);
    else editor.openLibrarySkill(binding);
    expect(editor.skillEntry.value).toBe(origin);
    expect(editor.skillFromHome.value).toBe(origin === 'home');
    editor.rememberReferenceOrigin();
    editor.section.value = 'buffs';
    editor.skillEntry.value = 'home';
    editor.returnToReferenceOrigin();
    expect(editor.skillEntry.value).toBe(origin);
    const before = editor.draft.value;
    editor.selectedSkillHistory.commit(
      { ...editor.selectedSkill.value, timelineBlockFrames: 3 },
      { path: '' },
    );
    editor.selectSection('home');
    editor.history.restore('undo');
    await nextTick();
    expect(editor.skillEntry.value).toBe(origin);
    expect(editor.showSkillEditor.value).toBe(true);
    expect(editor.draft.value).toEqual(before);
    editor.closeSkillEditor(false);
    expect(editor.section.value).toBe(origin === 'home' ? 'home' : 'skills');
    expect(editor.showSkillEditor.value).toBe(false);
  }
  editor.section.value = 'entities';
  editor.referencedEntityId.value = 'test-entity';
  editor.entityDetailOpen.value = true;
  expect(editor.objectLabel.value).toBe('test-entity');
  editor.selectSection('entities');
  expect(editor.objectLabel.value).toBe('');
  expect(editor.referencedEntityId.value).toBe('');
  editor.section.value = 'runtime';
  editor.runtimePage.value = 'presentation';
  const beforeNavigation = editor.draft.value;
  editor.rememberReferenceOrigin();
  editor.section.value = 'buffs';
  editor.runtimePage.value = 'blackboard';
  editor.returnToReferenceOrigin();
  expect(editor.section.value).toBe('runtime');
  expect(editor.runtimePage.value).toBe('presentation');
  expect(editor.draft.value).toBe(beforeNavigation);
  editor.selectSection('buffs');
  editor.openBuffDetail('buff_chr_0004_pelica_talent_0');
  editor.revealDefinitionReference({
    kind: 'buff',
    id: 'buff_chr_0004_pelica_talent_0',
    ownerKind: 'upgrade',
    ownerId: 'talents/0',
    path: 'talents[0].initializationSequence.steps[0].parameters.buffId',
  });
  expect(editor.section.value).toBe('progression');
  expect(editor.upgradeNavigation.value.propertyPath).toEqual([
    'initializationSequence',
    'steps',
    0,
    'parameters',
    'buffId',
  ]);
  editor.returnToReferenceOrigin();
  expect(editor.section.value).toBe('buffs');
  expect(editor.buffDetailOpen.value).toBe(true);
  expect(editor.selectedBuffId.value).toBe('buff_chr_0004_pelica_talent_0');
  for (const [ownerKind, path, page, propertyPath] of [
    [
      'operatorEvent',
      'eventHandlers[0].response.steps[0].parameters.buffId',
      'behavior',
      ['handlers', 0, 'response', 'steps', 0, 'parameters', 'buffId'],
    ],
    [
      'comboCondition',
      'comboSkillConditions[0].condition.buffId',
      'combo',
      ['comboSkillConditions', 0, 'condition', 'buffId'],
    ],
    ['operator', 'passiveUi.normalBuffId', 'presentation', ['normalBuffId']],
  ]) {
    editor.revealDefinitionReference({ kind: 'buff', id: 'qa', ownerKind, ownerId: 'qa', path });
    expect(editor.runtimePage.value).toBe(page);
    expect(editor.runtimeNavigation.value.propertyPath).toEqual(propertyPath);
    editor.returnToReferenceOrigin();
    expect(editor.section.value).toBe('buffs');
  }
  expect(editor.draft.value).toBe(beforeNavigation);
  expect(editor.history.canUndo.value).toBe(false);
  for (const [path, page] of [
    ['$.entityBlackboard.value', 'blackboard'],
    ['$.comboSkillPriority', 'combo'],
    ['$.eventHandlers[0].key', 'behavior'],
  ] as const) {
    editor.revealIssue({ path, message: 'test' });
    expect(editor.runtimePage.value).toBe(page);
    expect(editor.draft.value).toBe(beforeNavigation);
  }
  editor.section.value = 'home';
  editor.revealIssue({ path: '$.passiveUi.normalBuffId', message: 'expected a non-empty Buff ID' });
  expect(editor.section.value).toBe('runtime');
  expect(editor.runtimePage.value).toBe('presentation');
  expect(editor.draft.value).toBe(beforeNavigation);
  for (let i = 0; i < 4; i++) {
    const binding = listOperatorSkillDefinitionBindings(editor.draft.value)[i]!;
    const path = operatorSkillBindingPath(binding, 0);
    editor.revealDefinitionReference({
      ownerKind: 'skill',
      ownerId: 'same',
      kind: 'buff',
      id: 'qa',
      path: `${path}.scheduledSequences[0].sequence.steps[0]`,
    });
    expect(editor.selectedSkillDefinitionPath.value).toBe(path);
    expect(editor.showSkillEditor.value).toBe(true);
    expect(editor.skillNavigation.value.propertyPath).toEqual([
      'scheduledSequences',
      0,
      'sequence',
      'steps',
      0,
    ]);
    editor.selectSection('skills');
    expect(editor.skillNavigation.value).toBeUndefined();
    editor.replaceGroup(0, editOperatorLibrarySkillMember(binding.group, binding, 'copy'));
    expect(listOperatorSkillDefinitionBindings(editor.draft.value)).toHaveLength(5);
    editor.history.restore('undo');
    expect(listOperatorSkillDefinitionBindings(editor.draft.value)).toHaveLength(4);
    expect(editor.section.value).toBe('skills');
    editor.history.restore('redo');
    expect(listOperatorSkillDefinitionBindings(editor.draft.value)).toHaveLength(5);
    editor.history.restore('undo');
    editor.revealIssue({ path: `$.${path}.timelineBlockFrames`, message: 'test' });
    expect(editor.selectedSkillDefinitionPath.value).toBe(path);
    expect(editor.skillNavigation.value.propertyPath).toEqual(['timelineBlockFrames']);
    expect(editor.showSkillEditor.value).toBe(true);
    editor.openHomeSkill(binding);
    editor.selectedSkillHistory.commit(
      { ...editor.selectedSkill.value, timelineBlockFrames: 20 },
      { path: '' },
    );
    expect(resolveStructureValue(editor.draft.value, path)).toMatchObject({
      timelineBlockFrames: 20,
    });
    editor.selectSection('home');
    editor.history.restore('undo');
    expect(editor.selectedSkillDefinitionPath.value).toBe(path);
    expect(editor.selectedSkill.value.timelineBlockFrames).toBe(1);
    expect(editor.showSkillEditor.value).toBe(true);
  }
  expect(definition.skillGroups[0]!.skills).toEqual([skill]);
  editor.revealIssue({
    path: '$.skillGroups[0].routedReplacementSkills[0].executionSkillKey',
    message: 'test',
  });
  expect(editor.section.value).toBe('skills');
  expect(editor.showSkillEditor.value).toBe(false);
  editor.openHomeUpgrade('potentials', 2);
  const before = JSON.parse(JSON.stringify(editor.selectedUpgrade.value));
  editor.upgradeHistory.commit(
    { ...before, initializationSequence: { steps: [] } },
    { path: '', section: 'initialization', objectId: '0' },
  );
  expect(editor.draft.value.potentials[2].initializationSequence.steps).toEqual([]);
  editor.selectSection('home');
  editor.history.restore('undo');
  expect(editor.progressionKind.value).toBe('potentials');
  expect(editor.selectedUpgradeIndex.value).toBe(2);
  expect(editor.showUpgradeBehaviorEditor.value).toBe(true);
  expect(editor.selectedUpgrade.value).toEqual(before);
  expect(editor.focusedPage.value).toBe(true);
  editor.history.restore('redo');
  expect(editor.selectedUpgrade.value.initializationSequence.steps).toEqual([]);
  editor.openHomeUpgrade('talents', 1);
  expect(editor.upgradeHistory.restoredLocation.value).toBeUndefined();
  const talentBefore = editor.selectedUpgrade.value.levels;
  editor.upgradeHistory.commit(
    { ...editor.selectedUpgrade.value, levels: talentBefore + 1 },
    { path: '' },
  );
  editor.openHomeUpgrade('potentials', 4);
  editor.history.restore('undo');
  expect(editor.progressionKind.value).toBe('talents');
  expect(editor.selectedUpgradeIndex.value).toBe(1);
  expect(editor.sectionLabel.value).toBe('天赋');
  expect(editor.selectedUpgrade.value.levels).toBe(talentBefore);
  editor.openRuntimePage('initialization');
  expect(editor.sectionLabel.value).toBe('条件初始化');
  const initializersBefore = editor.draft.value.entityBlackboardInitializers;
  editor.initializationHistory.commit(
    {
      entityBlackboardInitializers: [
        {
          key: 'EntityBB_history',
          condition: {
            kind: 'deckAttributeCompare',
            left: 'strength',
            operator: 'equal',
            right: 'strength',
          },
          trueValue: 1,
          falseValue: 0,
        },
      ],
    },
    { path: 'entityBlackboardInitializers[0]' },
  );
  editor.openRuntimePage('combo');
  expect(editor.showComboEditor.value).toBe(true);
  editor.history.restore('undo');
  expect(editor.runtimePage.value).toBe('initialization');
  expect(editor.showComboEditor.value).toBe(false);
  expect(editor.draft.value.entityBlackboardInitializers).toEqual(initializersBefore);
  editor.history.restore('redo');
  expect(editor.draft.value.entityBlackboardInitializers[0].key).toBe('EntityBB_history');
  editor.initializationHistory.commit(
    {
      entityBlackboardInitializers: [
        { ...editor.draft.value.entityBlackboardInitializers[0], trueValue: 7 },
      ],
    },
    { path: 'entityBlackboardInitializers[0]', propertyPath: ['trueValue'] },
  );
  editor.selectSection('home');
  editor.history.restore('undo');
  expect(editor.runtimePage.value).toBe('initialization');
  expect(editor.initializationHistory.restoredLocation.value.propertyPath).toEqual(['trueValue']);
  expect(editor.draft.value.entityBlackboardInitializers[0].trueValue).toBe(1);
  editor.initializationHistory.commit({ entityBlackboardInitializers: [] }, { path: '' });
  expect(editor.draft.value.entityBlackboardInitializers).toBeUndefined();
  editor.openRuntimePage('combo');
  const comboBefore = editor.draft.value.comboSkillPriority;
  editor.comboHistory.commit(
    { ...editor.comboDocument.value, comboSkillPriority: 'enemyRank' },
    { path: '', propertyPath: ['comboSkillPriority'] },
  );
  editor.selectSection('home');
  editor.history.restore('undo');
  expect(editor.runtimePage.value).toBe('combo');
  expect(editor.comboHistory.restoredLocation.value.propertyPath).toEqual(['comboSkillPriority']);
  expect(editor.draft.value.comboSkillPriority).toBe(comboBefore);
  editor.history.restore('redo');
  expect(editor.draft.value.comboSkillPriority).toBe('enemyRank');
  editor.openRuntimePage('blackboard');
  expect(editor.sectionLabel.value).toBe('角色黑板');
  editor.openRuntimePage('behavior');
  expect(editor.sectionLabel.value).toBe('角色行为');
  expect(editor.showRuntimeBehaviorEditor.value).toBe(true);
  const runtimeBefore = JSON.parse(JSON.stringify(editor.draft.value.passiveSkills ?? []));
  editor.runtimeHistory.commit(
    {
      passives: [...runtimeBefore, { key: 'history-test', enableSequence: { steps: [] } }],
      handlers: editor.draft.value.eventHandlers ?? [],
    },
    { path: '', section: 'passiveSkills', objectId: String(runtimeBefore.length) },
  );
  editor.selectSection('home');
  editor.history.restore('undo');
  expect(editor.runtimePage.value).toBe('behavior');
  expect(editor.showRuntimeBehaviorEditor.value).toBe(true);
  expect(editor.draft.value.passiveSkills ?? []).toEqual(runtimeBefore);
  expect(editor.runtimeHistory.restoredLocation.value.runtimeCategory).toBe('passiveSkills');
  editor.openRuntimePage('presentation');
  expect(editor.sectionLabel.value).toBe('状态表现');
  const statusBefore = editor.draft.value.passiveUi;
  editor.commitDraft(
    {
      ...editor.draft.value,
      passiveUi: { kind: 'numeric', appearance: 'tangtangDroplets', maximum: 2 },
    },
    ['maximum'],
  );
  editor.selectSection('home');
  editor.history.restore('undo');
  expect(editor.runtimePage.value).toBe('presentation');
  expect(editor.draft.value.passiveUi).toEqual(statusBefore);
  expect(editor.history.restoredLocation.value.propertyPath).toEqual(['maximum']);
  editor.openRuntimePage('routing');
  expect(editor.sectionLabel.value).toBe('操作选择规则');
  const routingBefore = JSON.stringify(editor.routingDocument.value);
  editor.routingHistory.commit(
    { ...editor.routingDocument.value, skillSlots: [] },
    { path: 'skillSlots' },
  );
  editor.selectSection('home');
  editor.history.restore('undo');
  expect(editor.runtimePage.value).toBe('routing');
  expect(JSON.stringify(editor.routingDocument.value)).toBe(routingBefore);
  editor.routingHistory.commit(
    {
      ...editor.routingDocument.value,
      skillSlots: editor.routingDocument.value.skillSlots.map((slot: any, index: number) =>
        index === 0 ? { ...slot, baseSkillKey: 'qa-base' } : slot,
      ),
    },
    { path: 'skillSlots[0]', propertyPath: ['baseSkillKey'] },
  );
  editor.selectSection('home');
  editor.history.restore('undo');
  expect(editor.runtimePage.value).toBe('routing');
  expect(editor.routingHistory.restoredLocation.value.propertyPath).toEqual(['baseSkillKey']);
  expect(JSON.stringify(editor.routingDocument.value)).toBe(routingBefore);
  const stableBefore = editor.routingDocument.value.skillSlots[0].stableSkillKeys;
  editor.routingHistory.commit(
    {
      ...editor.routingDocument.value,
      skillSlots: editor.routingDocument.value.skillSlots.map((slot: any, index: number) =>
        index === 0 ? { ...slot, stableSkillKeys: [] } : slot,
      ),
    },
    { path: 'skillSlots[0]', propertyPath: ['stableSkillKeys'] },
  );
  expect(editor.routingDocument.value.skillSlots[0].stableSkillKeys).toEqual([]);
  editor.selectSection('home');
  editor.history.restore('undo');
  expect(editor.runtimePage.value).toBe('routing');
  expect(editor.routingDocument.value.skillSlots[0].stableSkillKeys).toEqual(stableBefore);
  expect(editor.routingHistory.restoredLocation.value.propertyPath).toEqual(['stableSkillKeys']);
  editor.history.restore('redo');
  expect(editor.routingDocument.value.skillSlots[0].stableSkillKeys).toEqual([]);
  editor.history.restore('undo');
  editor.selectSection('trust');
  expect(editor.sectionLabel.value).toBe('信赖规则');
  const trustBefore = editor.draft.value.trustAttributeBonus;
  editor.setTrustMode(trustBefore === undefined);
  editor.selectSection('panel');
  editor.history.restore('undo');
  expect(editor.section.value).toBe('trust');
  expect(editor.draft.value.trustAttributeBonus).toEqual(trustBefore);
  editor.setTrustMode(true);
  editor.updateTrustValue(1, { target: { value: '23' } });
  expect(editor.history.undoLocation.value.propertyPath).toEqual([
    'trustAttributeBonus',
    'values',
    1,
  ]);
  expect(editor.draft.value.trustAttributeBonus.values).toEqual([10, 23, 15, 20]);
  editor.history.restore('undo');
  expect(editor.draft.value.trustAttributeBonus.values).toEqual([10, 15, 15, 20]);
  editor.updateTrustValue(1, { target: { value: '' } });
  expect(editor.draft.value.trustAttributeBonus.values).toEqual([10, 15, 15, 20]);
  editor.toggleTrustAttribute('main');
  expect(editor.draft.value.trustAttributeBonus.attributes).toEqual([]);
  expect(editor.history.undoLocation.value.propertyPath).toEqual([
    'trustAttributeBonus',
    'attributes',
  ]);
  editor.history.restore('undo');
  expect(editor.draft.value.trustAttributeBonus.attributes).toEqual(['main']);
  editor.selectSection('skills');
  const groupsBefore = editor.draft.value.skillGroups.length;
  editor.addLibraryGroup();
  expect(editor.selectedGroupIndex.value).toBe(groupsBefore);
  expect(editor.selectedGroup.value.skills).toEqual([]);
  editor.addLibrarySkill();
  expect(editor.showSkillEditor.value).toBe(true);
  expect(editor.selectedSkill.value.levelSource).toBeUndefined();
  expect(editor.selectedSkillDefinitionPath.value).toBe(`skillGroups[${groupsBefore}].skills[0]`);
  editor.history.restore('undo');
  expect(editor.showSkillEditor.value).toBe(false);
  expect(editor.selectedGroup.value.skills).toEqual([]);
  editor.history.restore('undo');
  expect(editor.draft.value.skillGroups).toHaveLength(groupsBefore);
  editor.addLibraryGroup();
  editor.addLibrarySkill('replacement');
  expect(editor.selectedSkillDefinitionPath.value).toBe(
    `skillGroups[${groupsBefore}].replacementSkills[0]`,
  );
  expect(editor.selectedSkill.value.levelSource).toBeUndefined();
  expect(editor.selectedGroup.value.skills).toEqual([]);
  editor.history.restore('undo');
  expect(editor.selectedGroup.value.replacementSkills).toBeUndefined();
  expect(editor.showSkillEditor.value).toBe(false);
  editor.replaceGroup(
    editor.selectedGroupIndex.value,
    appendEmptyOperatorVariant(editor.selectedGroup.value),
  );
  editor.addLibrarySkill({ variant: 0 });
  expect(editor.selectedSkillDefinitionPath.value).toBe(
    `skillGroups[${groupsBefore}].variants[0].skills[0]`,
  );
  expect(editor.selectedSkill.value.levelSource).toBeUndefined();
  editor.history.restore('undo');
  expect(editor.selectedGroup.value.variants[0].skills).toEqual([]);
  expect(editor.showSkillEditor.value).toBe(false);
  editor.addLibrarySkill('routedReplacement');
  expect(editor.selectedSkillDefinitionPath.value).toBe(
    `skillGroups[${groupsBefore}].routedReplacementSkills[0].skill`,
  );
  expect(editor.selectedSkill.value.levelSource).toBeUndefined();
  editor.history.restore('undo');
  expect(editor.selectedGroup.value.routedReplacementSkills).toBeUndefined();
  const beforeIssueNavigation = JSON.stringify(editor.draft.value);
  const undoBeforeNavigation = editor.history.undoLocation.value;
  editor.revealIssue({
    path: '$.potentials[0].modifiers[0].blackboardKey',
    message: 'missing key',
  });
  expect(editor.progressionKind.value).toBe('potentials');
  expect(editor.selectedUpgradeIndex.value).toBe(0);
  expect(editor.upgradeNavigation.value.propertyPath).toEqual(['modifiers', 0, 'blackboardKey']);
  expect(JSON.stringify(editor.draft.value)).toBe(beforeIssueNavigation);
  expect(editor.history.undoLocation.value).toBe(undoBeforeNavigation);
  editor.openHomeUpgrade('talents', 0);
  expect(editor.upgradeNavigation.value).toBeUndefined();
  for (const [path, page, propertyPath] of [
    ['$.skillSlots[0].baseSkillKey', 'routing', ['skillSlots', 0, 'baseSkillKey']],
    ['$.passiveUi.maximum', 'presentation', ['maximum']],
    ['$.passiveSkills[0].key', 'behavior', ['passives', 0, 'key']],
    ['$.eventHandlers[0].key', 'behavior', ['handlers', 0, 'key']],
    ['$.comboSkillConditions[0].event', 'combo', ['comboSkillConditions', 0, 'event']],
    [
      '$.entityBlackboardInitializers[0].trueValue',
      'initialization',
      ['entityBlackboardInitializers', 0, 'trueValue'],
    ],
  ] as const) {
    editor.revealIssue({ path, message: 'field issue' });
    expect(editor.runtimePage.value).toBe(page);
    expect(editor.runtimeNavigation.value.propertyPath).toEqual(propertyPath);
    expect(editor.history.undoLocation.value).toBe(undoBeforeNavigation);
  }
  editor.openRuntimePage('routing');
  expect(editor.runtimeNavigation.value).toBeUndefined();
  editor.routingHistory.commit(
    {
      ...editor.routingDocument.value,
      skillSlots: editor.routingDocument.value.skillSlots.map((slot: any, index: number) =>
        index === 0 ? { ...slot, baseSkillKey: 'navigation-check' } : slot,
      ),
    },
    { path: 'skillSlots[0]', propertyPath: ['baseSkillKey'] },
  );
  editor.revealIssue({
    path: '$.playerActionRoutes.basicAttack.defaultSkillKey',
    message: 'another field',
  });
  expect(editor.runtimeNavigation.value).toBeDefined();
  editor.history.restore('undo');
  await nextTick();
  expect(editor.runtimePage.value).toBe('routing');
  expect(editor.runtimeNavigation.value).toBeUndefined();
  expect(editor.routingHistory.restoredLocation.value.propertyPath).toEqual(['baseSkillKey']);
  editor.revealIssue({
    path: '$.potentials[0].modifiers[0].blackboardKey',
    message: 'missing key',
  });
  editor.selectSection('home');
  expect(editor.upgradeNavigation.value).toBeUndefined();
  expect(editor.runtimeNavigation.value).toBeUndefined();
  editor.selectSection('panel');
  const beforeName = editor.draft.value.displayName;
  editor.updateIdentity('displayName', { target: { value: 'QA display name' } });
  editor.selectSection('home');
  editor.history.restore('undo');
  await nextTick();
  expect(editor.section.value).toBe('panel');
  expect(editor.draft.value.displayName).toBe(beforeName);
  expect(editor.history.restoredLocation.value.propertyPath).toEqual(['displayName']);
  editor.revealIssue({ path: '$.gameId', message: 'identity issue' });
  expect(editor.runtimePage.value).toBe('provenance');
  editor.selectSection('home');
  const beforeGrowth = editor.draft.value.attributes.strength[2];
  editor.updatePanelStat('strength', 2, { target: { value: String(beforeGrowth + 10) } });
  editor.openRuntimePage('routing');
  editor.history.restore('undo');
  await nextTick();
  expect(editor.section.value).toBe('home');
  expect(editor.draft.value.attributes.strength[2]).toBe(beforeGrowth);
  expect(editor.history.restoredLocation.value.propertyPath).toEqual(['attributes', 'strength', 2]);
  app.unmount();
});
