import { describe, expect, test } from 'vitest';
import source from './SimLogPanel.vue?raw';

describe('SimLogPanel square container styling', () => {
  test('uses square right-panel container styling', () => {
    expect(source).toContain('--right-panel-container-radius: 0');
    expect(source).toContain('border-radius: var(--right-panel-container-radius)');
  });

  test('renders skill log groups collapsed by default', () => {
    const actionGroupDetails =
      source.match(/<details[\s\S]*?v-for="group in actionGroups\.groups"[\s\S]*?<summary/)?.[0] ||
      '';
    expect(actionGroupDetails).toContain('v-for="group in actionGroups.groups"');
    expect(actionGroupDetails).not.toMatch(/\sopen\s/);
  });

  test('uses the timeline action color for each skill log group', () => {
    expect(source).toContain('function getActionColor(actionId)');
    expect(source).toContain('node?.customColor');
    expect(source).toContain("store.getColor('link')");
    expect(source).toContain("store.getColor('execution')");
    expect(source).toContain("store.getColor('attack')");
    expect(source).toContain("store.getColor('dodge')");
    expect(source).toContain('node?.element');
    expect(source).toContain('store.getCharacterElementColor');
    expect(source).toContain(':style="{ \'--group-accent\': getActionColor(group.actionId) }"');
    expect(source).not.toContain('ACTION_TYPE_ACCENTS');
    expect(source).not.toContain('getActionAccent(group.actionType)');
  });

  test('renders the skill name with the timeline action color', () => {
    expect(source).toContain('.group__action');
    expect(source).toContain('color-mix(in srgb, var(--group-accent) 88%, #fff)');
  });

  test('opens the selected timeline action and closes other skill log groups', () => {
    expect(source).toContain('const groupRefs = ref({})');
    expect(source).toContain('const openActionId = ref(null)');
    expect(source).toContain('function syncSelectedActionGroup');
    expect(source).toContain('() => store.selectedActionId');
    expect(source).toContain(':ref="el => setGroupRef(group.actionId, el)"');
    expect(source).toContain(':open="openActionId === group.actionId"');
    expect(source).toContain('@toggle="event => onGroupToggle(group.actionId, event)"');
    expect(source).toContain('scrollIntoView');
  });

  test('groups and formats cooldown reduction events without leaking raw keys', () => {
    expect(source).toContain("case 'CD_REDUCTION':");
    expect(source).toContain('entry.payload?.actionId');
    expect(source).toContain('function formatOtherEntryText(entry)');
    expect(source).toContain("entry?.type === 'CD_REDUCTION'");
    expect(source).toContain("t('battleLog.ui.cdReductionText'");
    expect(source).toContain('{{ formatOtherEntryText(entry) }}');
  });
});
