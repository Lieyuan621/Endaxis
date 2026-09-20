<script setup lang="ts">
import { EaButton, EaDialog, EaDialogActions } from '../../../../design-system/index';
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
import InputRegionBoundary from '../../../keyboard/InputRegionBoundary.vue';
import { useInspectorPropertyReveal } from '../inspector/useInspectorPropertyReveal';
import {
  operatorWorkspaceIssueTarget,
  operatorWorkspaceTargetArea,
} from './operatorWorkspaceStructure';
import { useI18n } from 'vue-i18n';
import {
  getGameElementName,
  getGameClassName,
  getGameWeaponTypeName,
  getOperatorGameName,
} from '../../../gameText';
import OperatorDefinitionHome from './OperatorDefinitionHome.vue';
import OperatorSkillLibraryGroupPage from './OperatorSkillLibraryGroupPage.vue';
import {
  createOperatorLibraryGroup,
  appendEmptyOperatorSkill,
  type OperatorSkillCreationDestination,
} from './operatorLibraryCreation';
import OperatorStatusPresentationPage from './OperatorStatusPresentationPage.vue';
import OperatorRoutingPage from './OperatorRoutingPage.vue';
import OperatorInitializationPage from './OperatorInitializationPage.vue';
import type { OperatorInitializationDocument } from './operatorInitializationGraph';
import OperatorProvenancePage from './OperatorProvenancePage.vue';
import type { OperatorComboDocument } from './operatorComboGraph';
import type { OperatorRoutingDocument } from './operatorRoutingGraph';
import type { OperatorRuntimeDraft } from './operatorRuntimeDraft';
import DefinitionReferenceList from '../DefinitionReferenceList.vue';
import { operatorSkillBindingPath, operatorSkillIssueLocation } from './operatorSkillLocation';
import {
  resolveStructureValue,
  structurePathSegments,
  replaceStructureValueAtPath,
} from '../skillStructureEditorCommands';
import type { OperatorSkillDefinitionBinding } from '../../../../core/game-data/operatorSkillDefinitions';
import { describeDefinitionHistory } from '../definitionHistoryPresentation';
import '../definitionWorkspaceLayout.css';
import { editorDefinitionsEqual } from '../../../editorDefinitionsEqual';
import { computed, markRaw, provide, ref, watch } from 'vue';
import { definitionAllLevelsKey } from '../definitionLevelEditing';
import { createDefinitionViewState, definitionViewStateKey } from '../definitionViewState';
import { useEditorHistoryShortcuts } from '../../../keyboard/useEditorHistoryShortcuts';
import {
  COMBAT_RESOURCES,
  DAMAGE_ELEMENTS,
  DEFAULT_TRUST_ATTRIBUTE_BONUS,
  OPERATOR_ATTRIBUTES,
  OPERATOR_RARITIES,
  OPERATOR_ROLES,
  OPERATOR_WEAPON_TYPES,
  type CombatStepDefinition,
  type OperatorAbilityEntityDefinitions,
  type OperatorBuffDefinitions,
  type OperatorDefinition,
  type OperatorUpgradeDefinition,
  type SkillBuffDefinition,
  type UpgradeModifierDefinition,
  type SkillDefinition,
  type SkillGroupDefinition,
} from '../../../../core/game-data/operatorDefinition';
import {
  listOperatorSkillDefinitionBindings,
  listSkillGroupDefinitionBindings,
} from '../../../../core/game-data/operatorSkillDefinitions';
import { validateOperatorDefinition } from '../../../../core/game-data/validateOperatorDefinition';
import { OPERATOR_PROGRESSION_SLOTS } from '../../../../core/game-data/operatorProgressionSlots';
import type { ValidationIssue } from '../../../../core/project/validation';
import {
  collectOperatorDefinitionReferences,
  referencesToDefinition,
  type OperatorDefinitionReference,
} from './operatorDefinitionReferences';
import AbilityEntityDefinitionsDialog from './AbilityEntityDefinitionsDialog.vue';
import BuffDefinitionGraphEditor from '../buffs/BuffDefinitionGraphEditor.vue';
import SkillDefinitionEditorDialog from '../skills/SkillDefinitionEditorDialog.vue';
import OperatorRuntimeGraphPage from './OperatorRuntimeGraphPage.vue';
import OperatorUpgradeGraphPage from './OperatorUpgradeGraphPage.vue';
import OperatorComboGraphPage from './OperatorComboGraphPage.vue';
import {
  useDefinitionDraftHistory,
  type DefinitionDraftHistory,
} from '../useDefinitionDraftHistory';

type Section =
  'home' | 'panel' | 'trust' | 'skills' | 'progression' | 'runtime' | 'buffs' | 'entities';

// This workspace edits the definition, not one instance's selected build level.
provide(definitionAllLevelsKey, true);
const { locale } = useI18n();
type BuffStep = CombatStepForKind<'applyBuff'>;
const ATTRIBUTE_LABELS: Readonly<Record<keyof OperatorDefinition['attributes'], string>> = {
  strength: '力量',
  agility: '敏捷',
  intellect: '智识',
  will: '意志',
  baseAttack: '基础攻击',
  baseHealth: '基础生命',
};
const TRUST_ATTRIBUTE_OPTIONS = [...OPERATOR_ATTRIBUTES, 'main', 'secondary'] as const;
const GROWTH_LEVELS = [1, 20, 40, 60, 80, 90] as const;

interface RequiredSkillReference {
  readonly skillGroupKey: string;
  readonly skillKey: string;
  readonly castId: string;
}

const props = defineProps<{
  visible: boolean;
  baseDefinition: OperatorDefinition;
  customDefinition?: OperatorDefinition;
  commonAbilityEntityDefinitions?: OperatorAbilityEntityDefinitions;
  commonBuffDefinitions?: OperatorBuffDefinitions;
  skillLevel: number;
  requiredSkillReferences?: readonly RequiredSkillReference[];
}>();
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  save: [definition: OperatorDefinition];
  reset: [];
}>();

const section = ref<Section>('home');
const referenceOrigins = ref<ReferenceOrigin[]>([]);
const externalReferenceNotice = ref('');
const viewStates = createDefinitionViewState();
provide(definitionViewStateKey, viewStates);
const draft = ref<OperatorDefinition>(clone(props.baseDefinition));
const workspaceRoot = ref<HTMLElement | null>(null);
const revealRootProperty = useInspectorPropertyReveal(workspaceRoot);
const history = markRaw(
  useDefinitionDraftHistory(
    () => draft.value,
    value => {
      draft.value = value;
    },
  ),
);
useEditorHistoryShortcuts(workspaceRoot, history.restore);
const selectedGroupIndex = ref(0);
const selectedSkillIndex = ref(0);
const selectedSkillDefinitionPath = ref('');
const selectedBuffId = ref('');
const buffDetailOpen = ref(false);
const entityDetailOpen = ref(false);
const showSkillEditor = ref(false);
const skillEntry = ref<'home' | 'library'>('home');
const skillFromHome = computed(
  () => section.value === 'skills' && showSkillEditor.value && skillEntry.value === 'home',
);
const showRuntimeBehaviorEditor = ref(false);
const showUpgradeBehaviorEditor = ref(false);
const showComboEditor = ref(false);
const runtimePage = ref<
  'blackboard' | 'initialization' | 'behavior' | 'combo' | 'presentation' | 'routing' | 'provenance'
>('blackboard');
const editingBehavior = computed(
  () =>
    section.value === 'progression' ||
    (section.value === 'runtime' && (showRuntimeBehaviorEditor.value || showComboEditor.value)),
);
// 保存范围不因进入详情改变；这里只决定页面布局，不接管子草稿生命周期。
const editingPeerDefinition = computed(
  () =>
    section.value === 'progression' ||
    (section.value === 'skills' && showSkillEditor.value) ||
    (section.value === 'runtime' &&
      (showComboEditor.value ||
        showRuntimeBehaviorEditor.value ||
        runtimePage.value === 'routing' ||
        runtimePage.value === 'initialization')) ||
    (section.value === 'buffs' && buffDetailOpen.value) ||
    (section.value === 'entities' && entityDetailOpen.value),
);
const focusedPage = editingPeerDefinition;
const referencedEntityId = ref('');
const objectSearch = ref('');
const showProblems = ref(false);
const progressionKind = ref<'talents' | 'potentials'>('talents');
const selectedUpgradeIndex = ref(0);
const upgradeNavigation = ref<{ propertyPath: readonly (string | number)[] }>();
const skillNavigation = ref<{ propertyPath: readonly (string | number)[] }>();
const runtimeNavigation = ref<{ propertyPath: readonly (string | number)[] }>();
const blackboardRenameError = ref<{ key: string; message: string }>();

watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    viewStates.clear();
    referenceOrigins.value = [];
    externalReferenceNotice.value = '';
    history.reset!(clone(props.customDefinition ?? props.baseDefinition));
    section.value = 'home';
    selectedSkillDefinitionPath.value = '';
    buffDetailOpen.value = false;
    entityDetailOpen.value = false;
    selectedGroupIndex.value = 0;
    selectedSkillIndex.value = 0;
    selectedBuffId.value = Object.keys(draft.value.buffDefinitions ?? {}).sort()[0] ?? '';
    objectSearch.value = '';
    showProblems.value = false;
    progressionKind.value = 'talents';
    selectedUpgradeIndex.value = 0;
  },
  { immediate: true },
);

const groups = computed(() => draft.value.skillGroups);
const selectedGroup = computed(() => groups.value[selectedGroupIndex.value]);
const selectedGroupSkills = computed(() => normalizeSkills(selectedGroup.value?.skills));
const selectedSkill = computed(() =>
  selectedSkillDefinitionPath.value
    ? ((resolveStructureValue(draft.value, selectedSkillDefinitionPath.value) as SkillDefinition) ??
      null)
    : (selectedGroupSkills.value[selectedSkillIndex.value] ?? null),
);
const buffIds = computed(() => Object.keys(draft.value.buffDefinitions ?? {}).sort());
const selectedBuff = computed(() => draft.value.buffDefinitions?.[selectedBuffId.value]);
const selectedBuffStep = computed<BuffStep | null>(() =>
  selectedBuff.value === undefined
    ? null
    : {
        kind: 'applyBuff',
        parameters: {
          target: 'caster',
          buffId: selectedBuffId.value,
          definition: selectedBuff.value,
        },
      },
);
const abilityEntityIds = computed(() =>
  Object.keys({
    ...(props.commonAbilityEntityDefinitions ?? {}),
    ...(draft.value.abilityEntityDefinitions ?? {}),
  }).sort(),
);
const normalizedObjectSearch = computed(() => objectSearch.value.trim().toLocaleLowerCase());
const filteredGroups = computed(() =>
  groups.value
    .map((group, index) => ({ group, index }))
    .filter(({ group }) => group.key.toLocaleLowerCase().includes(normalizedObjectSearch.value)),
);
const filteredBuffIds = computed(() =>
  buffIds.value.filter(id => id.toLocaleLowerCase().includes(normalizedObjectSearch.value)),
);
const draftIssues = computed<readonly ValidationIssue[]>(() => {
  const bindings = listOperatorSkillDefinitionBindings(draft.value);
  const issues = validateOperatorDefinition(draft.value);
  const identities = new Set(bindings.map(({ group, skill }) => `${group.key}\u0000${skill.key}`));
  for (const alias of draft.value.skillAliases ?? []) {
    identities.add(`${alias.from[0]}\u0000${alias.from[1]}`);
  }
  for (const reference of props.requiredSkillReferences ?? []) {
    const identity = `${reference.skillGroupKey}\u0000${reference.skillKey}`;
    if (identities.has(identity)) continue;
    issues.push({
      path: 'skillGroups',
      message: `轴上技能块 '${reference.castId}' 仍引用 ${reference.skillGroupKey}/${reference.skillKey}`,
    });
  }
  const references = collectOperatorDefinitionReferences(draft.value);
  const knownBuffIds = new Set([
    ...Object.keys(props.commonBuffDefinitions ?? {}),
    ...Object.keys(draft.value.buffDefinitions ?? {}),
  ]);
  const knownEntityIds = new Set([
    ...Object.keys(props.commonAbilityEntityDefinitions ?? {}),
    ...Object.keys(draft.value.abilityEntityDefinitions ?? {}),
  ]);
  for (const reference of references) {
    const known =
      reference.kind === 'buff' ? knownBuffIds.has(reference.id) : knownEntityIds.has(reference.id);
    if (known || reference.usage === 'instanceFilter') continue;
    issues.push({
      path: reference.path,
      message: `引用了不存在的${reference.kind === 'buff' ? ' Buff' : '能力实体'} '${reference.id}'`,
    });
  }
  return issues;
});
const selectedUpgrades = computed(() => draft.value[progressionKind.value]);
const upgradeSlots = computed<readonly OperatorUpgradeDefinition[]>(() =>
  Array.from(
    { length: OPERATOR_PROGRESSION_SLOTS[progressionKind.value] },
    (_, index) => selectedUpgrades.value[index] ?? { levels: 1 },
  ),
);
const selectedUpgrade = computed(() => upgradeSlots.value[selectedUpgradeIndex.value]);
const entityBlackboardEntries = computed(() => Object.entries(draft.value.entityBlackboard ?? {}));
const skillGroupKeys = computed(() => draft.value.skillGroups.map(group => group.key));
const comboSkillKeys = computed(() =>
  listOperatorSkillDefinitionBindings(draft.value)
    .filter(({ skill }) => skill.skillType === 'comboSkill')
    .map(({ skill }) => skill.key)
    .filter((key, index, keys) => keys.indexOf(key) === index),
);
const passiveSkillKeys = computed(() => [
  ...(draft.value.passiveSkills ?? []).map(passive => passive.key),
  ...(selectedUpgrade.value?.passiveSkills ?? []).map(passive => passive.key),
]);
const definitionReferences = computed(() => collectOperatorDefinitionReferences(draft.value));
const selectedBuffReferences = computed(() =>
  referencesToDefinition(definitionReferences.value, 'buff', selectedBuffId.value),
);
const isDirty = computed(
  () => !editorDefinitionsEqual(draft.value, props.customDefinition ?? props.baseDefinition),
);
const sectionLabel = computed(() => {
  if (section.value === 'panel') return '基本信息';
  if (section.value === 'trust') return '信赖规则';
  if (section.value === 'skills') return '技能库组织';
  if (section.value === 'progression') return progressionKind.value === 'talents' ? '天赋' : '潜能';
  if (section.value === 'runtime')
    return {
      blackboard: '角色黑板',
      initialization: '条件初始化',
      behavior: '角色行为',
      combo: '连携条件',
      presentation: '状态表现',
      routing: '操作选择规则',
      provenance: '来源与诊断',
    }[runtimePage.value];
  if (section.value === 'buffs') return 'Buff';
  return '能力实体';
});
const objectLabel = computed(() => {
  if (section.value === 'skills') return selectedGroup.value?.key ?? '';
  if (section.value === 'buffs') return buffDetailOpen.value ? selectedBuffId.value : '';
  if (section.value === 'entities') return entityDetailOpen.value ? referencedEntityId.value : '';
  return '';
});

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function commitDraft(value: OperatorDefinition, propertyPath?: readonly (string | number)[]): void {
  history.commit(value, {
    path: '',
    propertyPath,
    section: section.value,
    objectId: objectLabel.value,
    ...(section.value === 'runtime' ? { page: runtimePage.value } : {}),
    ...(section.value === 'skills' && !showSkillEditor.value
      ? { page: 'library', objectId: String(selectedGroupIndex.value) }
      : {}),
  });
}

const selectedBuffHistory = markRaw<DefinitionDraftHistory<SkillBuffDefinition>>({
  commit(value, location) {
    if (selectedBuffId.value === '') return;
    history.commit(
      {
        ...draft.value,
        buffDefinitions: {
          ...(draft.value.buffDefinitions ?? {}),
          [selectedBuffId.value]: clone(value),
        },
      },
      { ...location, path: location?.path ?? '', section: 'buffs', objectId: selectedBuffId.value },
    );
  },
  restore: history.restore,
  canUndo: history.canUndo,
  canRedo: history.canRedo,
  restoredLocation: history.restoredLocation,
});
const entityHistory = markRaw<DefinitionDraftHistory<OperatorAbilityEntityDefinitions>>({
  commit(value, location) {
    history.commit(
      { ...draft.value, abilityEntityDefinitions: Object.keys(value).length ? value : undefined },
      { ...location, path: location?.path ?? '', section: 'entities' },
    );
  },
  restore: history.restore,
  canUndo: history.canUndo,
  canRedo: history.canRedo,
  restoredLocation: history.restoredLocation,
});
const upgradeHistory = markRaw<DefinitionDraftHistory<OperatorUpgradeDefinition>>({
  commit(value, location) {
    const upgrades = [
      ...upgradeSlots.value,
      ...selectedUpgrades.value.slice(upgradeSlots.value.length),
    ];
    upgrades[selectedUpgradeIndex.value] = clone(value);
    history.commit(
      { ...draft.value, [progressionKind.value]: upgrades },
      {
        ...location,
        path: location?.path ?? '',
        section: 'progression',
        page: 'upgradeBehavior',
        upgradeKind: progressionKind.value,
        upgradeIndex: selectedUpgradeIndex.value,
        upgradeCategory: location?.section ?? 'initialization',
      },
    );
  },
  restore: history.restore,
  canUndo: history.canUndo,
  canRedo: history.canRedo,
  restoredLocation: computed(() => {
    const location = history.restoredLocation?.value;
    return location?.section === 'progression' &&
      location.upgradeKind === progressionKind.value &&
      location.upgradeIndex === selectedUpgradeIndex.value
      ? location
      : undefined;
  }),
});
const runtimeHistory = markRaw<DefinitionDraftHistory<OperatorRuntimeDraft>>({
  commit(value, location) {
    history.commit(
      {
        ...draft.value,
        passiveSkills: value.passives.length ? value.passives : undefined,
        eventHandlers: value.handlers.length ? value.handlers : undefined,
      },
      {
        ...location,
        path: location?.path ?? '',
        section: 'runtime',
        page: 'behavior',
        runtimeCategory: location?.section === 'eventHandlers' ? 'eventHandlers' : 'passiveSkills',
      },
    );
  },
  restore: history.restore,
  canUndo: history.canUndo,
  canRedo: history.canRedo,
  restoredLocation: computed(() => {
    const location = history.restoredLocation?.value;
    return location?.section === 'runtime' && location.page === 'behavior' ? location : undefined;
  }),
});
const initializationDocument = computed<OperatorInitializationDocument>(() => ({
  entityBlackboardInitializers: draft.value.entityBlackboardInitializers,
}));
const initializationHistory = markRaw<DefinitionDraftHistory<OperatorInitializationDocument>>({
  commit(value, location) {
    history.commit(
      {
        ...draft.value,
        entityBlackboardInitializers: value.entityBlackboardInitializers?.length
          ? value.entityBlackboardInitializers
          : undefined,
      },
      { ...location, path: location?.path ?? '', section: 'runtime', page: 'initialization' },
    );
  },
  restore: history.restore,
  canUndo: history.canUndo,
  canRedo: history.canRedo,
  restoredLocation: computed(() =>
    history.restoredLocation?.value?.page === 'initialization'
      ? history.restoredLocation.value
      : undefined,
  ),
});
const routingDocument = computed<OperatorRoutingDocument>(() => ({
  skillSlots: draft.value.skillSlots,
  playerActionRoutes: draft.value.playerActionRoutes,
  playerActionModes: draft.value.playerActionModes,
}));
const routingHistory = markRaw<DefinitionDraftHistory<OperatorRoutingDocument>>({
  commit(value, location) {
    history.commit(
      { ...draft.value, ...value },
      { ...location, path: location?.path ?? '', section: 'runtime', page: 'routing' },
    );
  },
  restore: history.restore,
  canUndo: history.canUndo,
  canRedo: history.canRedo,
  restoredLocation: computed(() =>
    history.restoredLocation?.value?.page === 'routing'
      ? history.restoredLocation.value
      : undefined,
  ),
});
const comboDocument = computed<OperatorComboDocument>(() => ({
  comboSkillConditions: draft.value.comboSkillConditions,
  comboSkillPriority: draft.value.comboSkillPriority,
}));
const comboHistory = markRaw<DefinitionDraftHistory<OperatorComboDocument>>({
  commit(value, location) {
    history.commit(
      {
        ...draft.value,
        ...value,
        comboSkillConditions: value.comboSkillConditions?.length
          ? clone(value.comboSkillConditions)
          : undefined,
      },
      { ...location, path: location?.path ?? '', section: 'runtime', page: 'combo' },
    );
  },
  restore: history.restore,
  canUndo: history.canUndo,
  canRedo: history.canRedo,
  restoredLocation: computed(() =>
    history.restoredLocation?.value?.page === 'combo' ? history.restoredLocation.value : undefined,
  ),
});
const selectedSkillHistory = markRaw<DefinitionDraftHistory<SkillDefinition>>({
  commit(value, location) {
    const group = selectedGroup.value;
    if (!group || !selectedSkill.value) return;
    if (selectedSkillDefinitionPath.value) {
      const next = replaceStructureValueAtPath(
        draft.value,
        selectedSkillDefinitionPath.value,
        clone(value),
      );
      history.commit(next, {
        ...location,
        path: location?.path ?? '',
        section: 'skills',
        objectId: selectedSkill.value.key,
        skillGroupKey: group.key,
        skillDefinitionPath: selectedSkillDefinitionPath.value,
        page: skillEntry.value === 'home' ? 'skill-home' : 'skill-library',
      });
      return;
    }
    const skills = [...selectedGroupSkills.value];
    const originalKey = selectedSkill.value.key;
    skills[selectedSkillIndex.value] = clone(value);
    const groups = [...draft.value.skillGroups];
    groups[selectedGroupIndex.value] = {
      ...group,
      skills: Array.isArray(group.skills) ? skills : skills[0]!,
    };
    history.commit(
      { ...draft.value, skillGroups: groups },
      {
        ...location,
        path: location?.path ?? '',
        section: 'skills',
        objectId: originalKey,
        skillGroupKey: group.key,
        page: skillEntry.value === 'home' ? 'skill-home' : 'skill-library',
      },
    );
  },
  restore: history.restore,
  canUndo: history.canUndo,
  canRedo: history.canRedo,
  restoredLocation: history.restoredLocation,
});
watch(
  () => history.restoredLocation?.value,
  location => {
    if (!location?.section) return;
    selectSection(location.section as Section);
    if (location.section === 'panel' || location.section === 'trust' || location.section === 'home')
      void revealRootProperty(location.propertyPath);
    if (
      location.section === 'progression' &&
      location.upgradeKind &&
      location.upgradeIndex !== undefined
    ) {
      progressionKind.value = location.upgradeKind;
      selectedUpgradeIndex.value = location.upgradeIndex;
      showUpgradeBehaviorEditor.value = location.page === 'upgradeBehavior';
    }
    if (
      location.section === 'runtime' &&
      ['blackboard', 'initialization', 'behavior', 'combo', 'presentation', 'routing'].includes(
        location.page ?? '',
      )
    ) {
      runtimePage.value = location.page as typeof runtimePage.value;
      if (runtimePage.value === 'blackboard') void revealRootProperty(location.propertyPath);
      showComboEditor.value = runtimePage.value === 'combo';
      showRuntimeBehaviorEditor.value = runtimePage.value === 'behavior';
    }
    if (location.section === 'skills' && location.page === 'library') {
      selectedGroupIndex.value = Math.max(
        0,
        Math.min(Number(location.objectId ?? 0), draft.value.skillGroups.length - 1),
      );
      selectedSkillDefinitionPath.value = '';
      showSkillEditor.value = false;
    }
    if (location.section === 'skills' && location.skillGroupKey) {
      skillEntry.value = location.page === 'skill-library' ? 'library' : 'home';
      const groupIndex = draft.value.skillGroups.findIndex(
        group => group.key === location.skillGroupKey,
      );
      if (groupIndex >= 0) {
        selectedGroupIndex.value = groupIndex;
        if (
          location.skillDefinitionPath &&
          resolveStructureValue(draft.value, location.skillDefinitionPath)
        ) {
          selectedSkillDefinitionPath.value = location.skillDefinitionPath;
          showSkillEditor.value = true;
          return;
        }
        const skillIndex = normalizeSkills(draft.value.skillGroups[groupIndex]!.skills).findIndex(
          skill => skill.key === location.objectId,
        );
        if (skillIndex >= 0) {
          selectedSkillIndex.value = skillIndex;
          showSkillEditor.value = true;
        }
      }
    }
    if (location.section === 'buffs' && location.objectId) openBuffDetail(location.objectId);
    if (location.section === 'entities' && location.objectId)
      referencedEntityId.value = location.objectId;
  },
  { flush: 'sync' },
);

function setTrustMode(custom: boolean): void {
  commitDraft(
    {
      ...draft.value,
      trustAttributeBonus: custom ? clone(DEFAULT_TRUST_ATTRIBUTE_BONUS) : undefined,
    },
    ['trustAttributeBonus'],
  );
}

function updateTrustValue(index: number, event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  if (raw.trim() === '' || !Number.isFinite(Number(raw))) return;
  const values = [...(draft.value.trustAttributeBonus ?? DEFAULT_TRUST_ATTRIBUTE_BONUS).values];
  if (index < 0 || index >= values.length) return;
  values[index] = Number(raw);
  commitDraft(
    {
      ...draft.value,
      trustAttributeBonus: {
        ...(draft.value.trustAttributeBonus ?? DEFAULT_TRUST_ATTRIBUTE_BONUS),
        values,
      },
    },
    ['trustAttributeBonus', 'values', index],
  );
}

function toggleTrustAttribute(attribute: (typeof TRUST_ATTRIBUTE_OPTIONS)[number]): void {
  const current = draft.value.trustAttributeBonus ?? DEFAULT_TRUST_ATTRIBUTE_BONUS;
  const attributes = current.attributes.includes(attribute as never)
    ? current.attributes.filter(value => value !== attribute)
    : [...current.attributes, attribute];
  commitDraft({ ...draft.value, trustAttributeBonus: { ...current, attributes } }, [
    'trustAttributeBonus',
    'attributes',
  ]);
}

function createUpgradeModifier(kind: UpgradeModifierDefinition['kind']): UpgradeModifierDefinition {
  const skillGroupKey = skillGroupKeys.value[0] ?? '';
  switch (kind) {
    case 'addConditionalDamage':
      return { kind, condition: { kind: 'combatActive' }, values: 0 };
    case 'enableSkillBranch':
      return { kind, skillGroupKey, branchKey: 'branch' };
    case 'multiplyEffectDuration':
      return { kind, skillGroupKey, stepKey: 'step', multiplier: 1 };
    case 'multiplySkillCost':
      return { kind, skillGroupKey, resource: COMBAT_RESOURCES[0], multiplier: 1 };
    case 'setEffectiveness':
      return { kind, skillGroupKey, stepKey: 'step', value: 0 };
    case 'addStaticDamageIncrease':
      return { kind, target: 'normalAttack', value: 0 };
    case 'addStaticHealingIncrease':
      return { kind, target: 'output', value: 0 };
    case 'addSkillStat':
      return { kind, skillGroupKey, stat: 'criticalRate', value: 0 };
    case 'patchSkillBlackboard':
      return { kind, skillGroupKey, blackboardKey: 'value', operation: 'add', value: 0 };
    case 'patchPassiveBlackboard':
      return {
        kind,
        passiveSkillKey: passiveSkillKeys.value[0] ?? '',
        blackboardKey: 'value',
        operation: 'add',
        value: 0,
      };
    case 'multiplySkillDamage':
      return { kind, skillGroupKey, multiplier: 1 };
    case 'multiplyStepDamage':
      return { kind, skillGroupKey, stepKey: 'step', multiplier: 1 };
    case 'multiplySkillCooldown':
      return { kind, skillGroupKey, multiplier: 1 };
    case 'addSkillCooldownFrames':
      return { kind, skillGroupKey, frames: 0 };
    case 'addBuildAttribute':
      return { kind, attributes: ['strength'], value: 0 };
    case 'modifyBasePanelStat':
      return { kind, stat: 'health', operation: 'flat', value: 0 };
    case 'addReactionDuration':
      return { kind, reaction: 'electrification', seconds: 0 };
    case 'addReactionEffectiveness':
      return { kind, reaction: 'electrification', value: 0 };
  }
}

function addEntityBlackboardEntry(): void {
  const values = { ...(draft.value.entityBlackboard ?? {}) };
  let index = 1;
  while (Object.hasOwn(values, `EntityBB_custom_${index}`)) index += 1;
  values[`EntityBB_custom_${index}`] = 0;
  commitDraft({ ...draft.value, entityBlackboard: values }, ['entityBlackboard']);
}

function renameEntityBlackboardEntry(oldKey: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  const key = input.value;
  const current = draft.value.entityBlackboard ?? {};
  if (!Object.hasOwn(current, oldKey)) return;
  blackboardRenameError.value = undefined;
  if (key !== oldKey && Object.hasOwn(current, key)) {
    input.value = oldKey;
    blackboardRenameError.value = {
      key: oldKey,
      message: `键「${key}」已存在，未改名或覆盖任何初值。`,
    };
    return;
  }
  const values = Object.fromEntries(
    entityBlackboardEntries.value.map(([entryKey, value]) => [
      entryKey === oldKey ? key : entryKey,
      value,
    ]),
  );
  commitDraft({ ...draft.value, entityBlackboard: values }, ['entityBlackboard']);
}

function updateEntityBlackboardEntry(key: string, event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  const current = draft.value.entityBlackboard?.[key];
  if (current === undefined) return;
  // Editing the value must not silently change its declared type.
  if (typeof current === 'number' && (raw.trim() === '' || !Number.isFinite(Number(raw)))) return;
  const value = typeof current === 'number' ? Number(raw) : raw;
  commitDraft(
    {
      ...draft.value,
      entityBlackboard: { ...(draft.value.entityBlackboard ?? {}), [key]: value },
    },
    ['entityBlackboard', key],
  );
}

function toggleEntityBlackboardEntryType(key: string): void {
  const current = draft.value.entityBlackboard?.[key];
  if (current === undefined) return;
  const value =
    typeof current === 'number'
      ? String(current)
      : Number.isFinite(Number(current))
        ? Number(current)
        : 0;
  commitDraft(
    {
      ...draft.value,
      entityBlackboard: { ...(draft.value.entityBlackboard ?? {}), [key]: value },
    },
    ['entityBlackboard', key, 'type'],
  );
}

function removeEntityBlackboardEntry(key: string): void {
  const values = { ...(draft.value.entityBlackboard ?? {}) };
  delete values[key];
  commitDraft(
    {
      ...draft.value,
      entityBlackboard: Object.keys(values).length === 0 ? undefined : values,
    },
    ['entityBlackboard'],
  );
}

function normalizeSkills(
  skills: SkillGroupDefinition['skills'] | undefined,
): readonly SkillDefinition[] {
  if (skills === undefined) return [];
  return Array.isArray(skills) ? skills : [skills as SkillDefinition];
}

function updatePanelStat(
  key: keyof OperatorDefinition['attributes'],
  index: number,
  event: Event,
): void {
  const raw = (event.target as HTMLInputElement).value.trim();
  const value = Number(raw);
  if (
    !raw ||
    !Number.isFinite(value) ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= GROWTH_LEVELS.length
  )
    return;
  const values = [...draft.value.attributes[key]];
  values[index] = value;
  commitDraft(
    {
      ...draft.value,
      attributes: { ...draft.value.attributes, [key]: values },
    },
    ['attributes', key, index],
  );
}

function updateIdentity(
  field:
    | 'displayName'
    | 'assetSlug'
    | 'rarity'
    | 'defaultPotential'
    | 'weaponType'
    | 'element'
    | 'role'
    | 'mainAttribute'
    | 'secondaryAttribute',
  event: Event,
): void {
  const raw = (event.target as HTMLInputElement | HTMLSelectElement).value;
  const value =
    (field === 'defaultPotential' || field === 'displayName' || field === 'assetSlug') && raw === ''
      ? undefined
      : field === 'rarity' || field === 'defaultPotential'
        ? Number(raw)
        : raw;
  commitDraft({ ...draft.value, [field]: value } as OperatorDefinition, [field]);
}

function replaceGroup(index: number, group: SkillGroupDefinition): void {
  const next = [...draft.value.skillGroups];
  next[index] = group;
  commitDraft({ ...draft.value, skillGroups: next });
}

function uniqueKey(base: string, existing: readonly string[]): string {
  const keys = new Set(existing);
  let index = 1;
  while (keys.has(`${base}-copy-${index}`)) index += 1;
  return `${base}-copy-${index}`;
}

function duplicateGroup(): void {
  const group = selectedGroup.value;
  if (group === undefined) return;
  const copy = clone(group);
  copy.key = uniqueKey(
    group.key,
    draft.value.skillGroups.map(item => item.key),
  );
  const groups = [...draft.value.skillGroups];
  groups.splice(selectedGroupIndex.value + 1, 0, copy);
  commitDraft({ ...draft.value, skillGroups: groups });
  selectedGroupIndex.value += 1;
  selectedSkillIndex.value = 0;
}

function addLibraryGroup(): void {
  const group = createOperatorLibraryGroup(draft.value);
  const index = draft.value.skillGroups.length;
  history.commit(
    { ...draft.value, skillGroups: [...draft.value.skillGroups, group] },
    { path: '', section: 'skills', page: 'library', objectId: String(index), operation: 'add' },
  );
  selectedGroupIndex.value = index;
  selectedSkillIndex.value = 0;
  selectedSkillDefinitionPath.value = '';
  objectSearch.value = '';
}

function addLibrarySkill(destination: OperatorSkillCreationDestination = 'base'): void {
  skillEntry.value = 'library';
  const group = selectedGroup.value;
  if (!group) return;
  const next = appendEmptyOperatorSkill(group, destination);
  replaceGroup(selectedGroupIndex.value, next.group);
  selectedSkillIndex.value = next.index;
  const container =
    typeof destination === 'object'
      ? `variants[${destination.variant}].skills`
      : destination === 'replacement'
        ? 'replacementSkills'
        : 'skills';
  selectedSkillDefinitionPath.value =
    destination === 'routedReplacement'
      ? `skillGroups[${selectedGroupIndex.value}].routedReplacementSkills[${next.index}].skill`
      : `skillGroups[${selectedGroupIndex.value}].${container}[${next.index}]`;
  showSkillEditor.value = true;
}

function removeGroup(): void {
  if (selectedGroup.value === undefined) return;
  const groups = draft.value.skillGroups.filter((_, index) => index !== selectedGroupIndex.value);
  commitDraft({ ...draft.value, skillGroups: groups });
  selectedGroupIndex.value = Math.max(0, Math.min(selectedGroupIndex.value, groups.length - 1));
  selectedSkillIndex.value = 0;
}

function moveGroup(offset: -1 | 1): void {
  const source = selectedGroupIndex.value;
  const target = source + offset;
  if (target < 0 || target >= draft.value.skillGroups.length) return;
  const groups = [...draft.value.skillGroups];
  [groups[source], groups[target]] = [groups[target]!, groups[source]!];
  commitDraft({ ...draft.value, skillGroups: groups });
  selectedGroupIndex.value = target;
}

function updateBuffStep(step: CombatStepDefinition): void {
  if (step.kind !== 'applyBuff' || step.parameters.definition === undefined) return;
  commitDraft({
    ...draft.value,
    buffDefinitions: {
      ...(draft.value.buffDefinitions ?? {}),
      [selectedBuffId.value]: clone(step.parameters.definition),
    },
  });
}

function addBuff(): void {
  const existing = new Set(buffIds.value);
  let index = 1;
  while (existing.has(`custom-buff-${index}`)) index += 1;
  const id = `custom-buff-${index}`;
  history.commit(
    {
      ...draft.value,
      buffDefinitions: {
        ...(draft.value.buffDefinitions ?? {}),
        [id]: { stackingType: 'refresh', durationSeconds: 10 },
      },
    },
    { path: '', section: 'buffs', objectId: id, operation: 'add' },
  );
  selectedBuffId.value = id;
  buffDetailOpen.value = true;
}

function removeBuff(): void {
  if (selectedBuffId.value === '' || !draft.value.buffDefinitions?.[selectedBuffId.value]) return;
  const next = { ...(draft.value.buffDefinitions ?? {}) };
  delete next[selectedBuffId.value];
  history.commit(
    {
      ...draft.value,
      buffDefinitions: Object.keys(next).length === 0 ? undefined : next,
    },
    { path: '', section: 'buffs', objectId: selectedBuffId.value, operation: 'remove' },
  );
  selectedBuffId.value = Object.keys(next).sort()[0] ?? '';
  buffDetailOpen.value = false;
}

function openBuffDetail(id: string): void {
  selectedBuffId.value = id;
  buffDetailOpen.value = draft.value.buffDefinitions?.[id] !== undefined;
}

function revealDefinitionReference(reference: OperatorDefinitionReference): void {
  rememberReferenceOrigin();
  if (reference.ownerKind === 'skill') {
    const location = operatorSkillIssueLocation(draft.value, reference.path);
    if (!location?.skillPath) return;
    section.value = 'skills';
    selectedGroupIndex.value = location.groupIndex;
    selectedSkillDefinitionPath.value = location.skillPath;
    skillNavigation.value = {
      propertyPath: structurePathSegments(
        reference.path
          .replace(/^\$\.?/, '')
          .slice(location.skillPath.length)
          .replace(/^\./, ''),
      ),
    };
    objectSearch.value = '';
    showSkillEditor.value = true;
    return;
  }
  if (reference.ownerKind === 'buff') {
    section.value = 'buffs';
    selectedBuffId.value = reference.ownerId;
    openBuffDetail(reference.ownerId);
    objectSearch.value = reference.ownerId;
    return;
  }
  if (reference.ownerKind === 'entity') {
    section.value = 'entities';
    referencedEntityId.value = reference.ownerId;
    return;
  }
  // References and diagnostics address the same document fields. Reuse page/graph
  // routing instead of opening an owner page without selecting the actual use.
  // Ordinary page navigation clears the return stack; this cross-object hop retains it.
  const origins = referenceOrigins.value;
  revealIssue({ path: reference.path, message: '' });
  referenceOrigins.value = origins;
}

function revealEntityDefinitionReference(reference: OperatorDefinitionReference): void {
  revealDefinitionReference(reference);
}

function save(): void {
  emit('save', clone(draft.value));
  emit('update:visible', false);
}

function selectSection(value: Section): void {
  skillEntry.value = 'home';
  void revealRootProperty();
  blackboardRenameError.value = undefined;
  // Explicit diagnostics are one navigation intent, not sticky page state.
  // History restoration also enters here, so stale requests must not override its location.
  upgradeNavigation.value = undefined;
  skillNavigation.value = undefined;
  runtimeNavigation.value = undefined;
  runtimePage.value = 'blackboard';
  selectedSkillDefinitionPath.value = '';
  externalReferenceNotice.value = '';
  referenceOrigins.value = [];
  section.value = value;
  buffDetailOpen.value = false;
  entityDetailOpen.value = false;
  referencedEntityId.value = '';
  showSkillEditor.value = false;
  objectSearch.value = '';
  showRuntimeBehaviorEditor.value = false;
  showUpgradeBehaviorEditor.value = false;
  showComboEditor.value = false;
}

function openRuntimePage(page: typeof runtimePage.value): void {
  selectSection('runtime');
  runtimePage.value = page;
  showComboEditor.value = page === 'combo';
  showRuntimeBehaviorEditor.value = page === 'behavior';
}

function openHomeSkill(binding: OperatorSkillDefinitionBinding): void {
  selectSection('skills');
  selectedGroupIndex.value = draft.value.skillGroups.findIndex(
    group => group.key === binding.group.key,
  );
  selectedSkillDefinitionPath.value = operatorSkillBindingPath(binding, selectedGroupIndex.value);
  showSkillEditor.value = true;
}
function openLibrarySkill(binding: OperatorSkillDefinitionBinding): void {
  openHomeSkill(binding);
  skillEntry.value = 'library';
}
function closeSkillEditor(visible: boolean): void {
  if (visible) {
    showSkillEditor.value = true;
    return;
  }
  if (skillEntry.value === 'home') selectSection('home');
  else showSkillEditor.value = false;
}
function openHomeUpgrade(kind: 'talents' | 'potentials', index: number): void {
  selectSection('progression');
  progressionKind.value = kind;
  selectedUpgradeIndex.value = index;
}
function revealIssue(issue: ValidationIssue): void {
  const target = operatorWorkspaceIssueTarget(issue.path);
  if (!target || target.kind !== 'field') return;
  const area = operatorWorkspaceTargetArea(target);
  const runtimePages = {
    actionRouting: 'routing',
    blackboard: 'blackboard',
    initialization: 'initialization',
    passives: 'behavior',
    listeners: 'behavior',
    presentation: 'presentation',
    combo: 'combo',
    provenance: 'provenance',
  } as const;
  if (area in runtimePages) {
    openRuntimePage(runtimePages[area as keyof typeof runtimePages]);
    if (area === 'actionRouting' || area === 'combo' || area === 'initialization')
      runtimeNavigation.value = { propertyPath: [target.field, ...target.path] };
    else if (area === 'passives' || area === 'listeners')
      runtimeNavigation.value = {
        propertyPath: [area === 'passives' ? 'passives' : 'handlers', ...target.path],
      };
    else if (area === 'presentation') runtimeNavigation.value = { propertyPath: target.path };
    else if (area === 'blackboard') void revealRootProperty([target.field, ...target.path]);
  } else if (area === 'identity') {
    openRuntimePage('provenance');
  } else if (area === 'profile' || area === 'defaults') {
    selectSection('panel');
    void revealRootProperty([target.field, ...target.path]);
  } else if (area === 'growth') {
    selectSection(target.field === 'trustAttributeBonus' ? 'trust' : 'home');
    void revealRootProperty([target.field, ...target.path]);
  } else if (area === 'talents' || area === 'potentials') {
    const index = target.path[0];
    if (typeof index === 'number' && draft.value[area][index]) {
      openHomeUpgrade(area, index);
      upgradeNavigation.value = { propertyPath: target.path.slice(1) };
    } else selectSection('home');
  } else if (area === 'buffs' || area === 'entities') {
    selectSection(area);
    const id = target.path[0];
    if (typeof id === 'string') {
      if (area === 'buffs') openBuffDetail(id);
      else {
        referencedEntityId.value = id;
        entityDetailOpen.value = true;
      }
    }
  }
  if (area !== 'skills') {
    showProblems.value = false;
    return;
  }
  const location = operatorSkillIssueLocation(draft.value, issue.path);
  if (!location) return;
  selectSection('skills');
  selectedGroupIndex.value = location.groupIndex;
  selectedSkillIndex.value = 0;
  selectedSkillDefinitionPath.value = location.skillPath ?? '';
  if (location.skillPath)
    skillNavigation.value = {
      propertyPath: structurePathSegments(
        issue.path
          .replace(/^\$\.?/, '')
          .slice(location.skillPath.length)
          .replace(/^\./, ''),
      ),
    };
  showSkillEditor.value = location.skillPath !== undefined;
  showProblems.value = false;
}

function openReferencedDefinition(reference: {
  readonly kind: 'buff' | 'entity';
  readonly id: string;
}): void {
  rememberReferenceOrigin();
  externalReferenceNotice.value = '';
  showSkillEditor.value = false;
  if (reference.kind === 'buff') {
    if (!draft.value.buffDefinitions?.[reference.id]) {
      externalReferenceNotice.value = props.commonBuffDefinitions?.[reference.id]
        ? `公有 Buff「${reference.id}」为只读游戏定义，不属于当前干员的可编辑对象。`
        : `当前目录中未找到 Buff「${reference.id}」。`;
    }
    section.value = 'buffs';
    selectedBuffId.value = reference.id;
    openBuffDetail(reference.id);
    objectSearch.value = reference.id;
    return;
  }
  section.value = 'entities';
  if (!draft.value.abilityEntityDefinitions?.[reference.id]) {
    externalReferenceNotice.value = props.commonAbilityEntityDefinitions?.[reference.id]
      ? `公有能力实体「${reference.id}」为只读游戏定义，不属于当前干员的可编辑对象。`
      : `当前目录中未找到能力实体「${reference.id}」。`;
  }
  referencedEntityId.value = reference.id;
}

type ReferenceOrigin = {
  skillEntry: 'home' | 'library';
  skillDefinitionPath: string;
  section: Section;
  group: string;
  skill: string;
  search: string;
  buff: string;
  entity: string;
  skillOpen: boolean;
  buffOpen: boolean;
  runtimePage: typeof runtimePage.value;
};
function rememberReferenceOrigin(): void {
  referenceOrigins.value = [
    ...referenceOrigins.value,
    {
      section: section.value,
      skillDefinitionPath: selectedSkillDefinitionPath.value,
      skillEntry: skillEntry.value,
      group: selectedGroup.value?.key ?? '',
      skill: selectedSkill.value?.key ?? '',
      search: objectSearch.value,
      buff: selectedBuffId.value,
      entity: referencedEntityId.value,
      skillOpen: showSkillEditor.value,
      buffOpen: buffDetailOpen.value,
      runtimePage: runtimePage.value,
    },
  ];
}
function returnToReferenceOrigin(): void {
  const origin = referenceOrigins.value.at(-1);
  if (!origin) return;
  externalReferenceNotice.value = '';
  referenceOrigins.value = referenceOrigins.value.slice(0, -1);
  section.value = origin.section;
  runtimePage.value = origin.runtimePage;
  const groupIndex = draft.value.skillGroups.findIndex(group => group.key === origin.group);
  const skillIndex =
    groupIndex < 0
      ? -1
      : normalizeSkills(draft.value.skillGroups[groupIndex]!.skills).findIndex(
          skill => skill.key === origin.skill,
        );
  selectedGroupIndex.value = Math.max(0, groupIndex);
  selectedSkillIndex.value = Math.max(0, skillIndex);
  selectedSkillDefinitionPath.value = origin.skillDefinitionPath;
  skillEntry.value = origin.skillEntry;
  objectSearch.value = origin.search;
  selectedBuffId.value = origin.buff;
  referencedEntityId.value = origin.entity;
  showSkillEditor.value =
    origin.skillOpen &&
    (origin.skillDefinitionPath
      ? !!resolveStructureValue(draft.value, origin.skillDefinitionPath)
      : skillIndex >= 0);
  buffDetailOpen.value =
    origin.buffOpen && draft.value.buffDefinitions?.[origin.buff] !== undefined;
}
</script>

<template>
  <InputRegionBoundary label="operator-definition-workspace" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      width="min(1600px, calc(100vw - 32px))"
      top="16px"
      append-to-body
      destroy-on-close
      class="operator-definition-workspace definition-workspace-dialog"
      @update:model-value="emit('update:visible', $event)"
    >
      <template #header>
        <div class="workspace-title">
          <div>
            <strong>自定义干员</strong><span>{{ draft.displayName ?? draft.slug }}</span>
            <em v-if="isDirty">已修改</em>
          </div>
          <small>编辑干员定义；这里的修改由所有引用该定义的干员实例共享。</small>
        </div>
      </template>

      <div
        ref="workspaceRoot"
        class="workspace workspace-home-layout"
        :class="{ 'definition-focused': focusedPage }"
      >
        <main
          class="workspace-main"
          :class="{
            'entity-editing': section === 'entities' || section === 'buffs',
            'behavior-editing': editingBehavior,
            'focused-editing': focusedPage,
          }"
        >
          <nav v-if="section !== 'home'" class="workspace-breadcrumbs" aria-label="当前位置">
            <button v-if="referenceOrigins.length" @click="returnToReferenceOrigin">
              ← 返回上一对象
            </button>
            <button @click="selectSection('home')">← 返回干员总览</button>
            <span v-if="!skillFromHome">›</span>
            <span v-if="section === 'runtime'">{{ sectionLabel }}</span>
            <button v-else-if="!skillFromHome" @click="selectSection(section)">
              {{ sectionLabel }}
            </button>
            <template v-if="objectLabel && !skillFromHome">
              <span>›</span><strong>{{ objectLabel }}</strong>
            </template>
            <template v-if="section === 'skills' && showSkillEditor && selectedSkill">
              <span>›</span><strong>{{ selectedSkill.key }}</strong>
            </template>
          </nav>
          <p v-if="externalReferenceNotice" class="reference-notice">
            {{ externalReferenceNotice }}
          </p>
          <OperatorDefinitionHome
            v-if="section === 'home'"
            :definition="draft"
            @section="selectSection"
            @runtime="openRuntimePage"
            @skill="openHomeSkill"
            @upgrade="openHomeUpgrade"
            @name="updateIdentity('displayName', $event)"
            @growth="updatePanelStat"
          />
          <section v-else-if="section === 'panel'" class="definition-section">
            <header>
              <div>
                <h3>基本信息</h3>
                <p>编辑干员分类与展示信息；属性成长在总览的六个等级节点中填写。</p>
              </div>
            </header>
            <div class="identity-sections">
              <section class="identity-section">
                <h4>展示</h4>
                <p>名称与图像来源，决定选择器和时间轴上如何显示这位干员。</p>
                <div class="identity-grid">
                  <label :data-property-path="JSON.stringify(['displayName'])"
                    >展示名称<input
                      :value="draft.displayName ?? ''"
                      :placeholder="getOperatorGameName(draft.assetSlug ?? draft.slug, locale)"
                      @change="updateIdentity('displayName', $event)"
                  /></label>
                  <label
                    :data-property-path="JSON.stringify(['assetSlug'])"
                    title="继承头像、技能图标和本地化文本时使用的内置干员身份。"
                    >资源来源<input
                      :value="draft.assetSlug ?? ''"
                      :placeholder="`沿用 ${draft.slug}`"
                      @change="updateIdentity('assetSlug', $event)"
                  /></label>
                </div>
              </section>
              <section class="identity-section">
                <h4>战斗分类</h4>
                <div class="identity-grid">
                  <label :data-property-path="JSON.stringify(['rarity'])"
                    >星级<select :value="draft.rarity" @change="updateIdentity('rarity', $event)">
                      <option v-for="value in OPERATOR_RARITIES" :key="value" :value="value">
                        {{ value }} ★
                      </option>
                    </select></label
                  >
                  <label :data-property-path="JSON.stringify(['weaponType'])"
                    >武器类型<select
                      :value="draft.weaponType"
                      @change="updateIdentity('weaponType', $event)"
                    >
                      <option v-for="value in OPERATOR_WEAPON_TYPES" :key="value" :value="value">
                        {{ getGameWeaponTypeName(value, locale) }}
                      </option>
                    </select></label
                  >
                  <label :data-property-path="JSON.stringify(['element'])"
                    >元素<select :value="draft.element" @change="updateIdentity('element', $event)">
                      <option v-for="value in DAMAGE_ELEMENTS" :key="value" :value="value">
                        {{ getGameElementName(value, locale) }}
                      </option>
                    </select></label
                  >
                  <label :data-property-path="JSON.stringify(['role'])"
                    >职业<select :value="draft.role" @change="updateIdentity('role', $event)">
                      <option v-for="value in OPERATOR_ROLES" :key="value" :value="value">
                        {{ getGameClassName(value, locale) }}
                      </option>
                    </select></label
                  >
                  <label :data-property-path="JSON.stringify(['mainAttribute'])"
                    >主属性<select
                      :value="draft.mainAttribute"
                      @change="updateIdentity('mainAttribute', $event)"
                    >
                      <option v-for="value in OPERATOR_ATTRIBUTES" :key="value" :value="value">
                        {{ ATTRIBUTE_LABELS[value] }}
                      </option>
                    </select></label
                  >
                  <label :data-property-path="JSON.stringify(['secondaryAttribute'])"
                    >副属性<select
                      :value="draft.secondaryAttribute"
                      @change="updateIdentity('secondaryAttribute', $event)"
                    >
                      <option v-for="value in OPERATOR_ATTRIBUTES" :key="value" :value="value">
                        {{ ATTRIBUTE_LABELS[value] }}
                      </option>
                    </select></label
                  >
                </div>
              </section>
              <section class="identity-section">
                <h4>实例默认值</h4>
                <p>用于实例的默认构筑，不改变五档潜能的定义。</p>
                <div class="identity-grid">
                  <label :data-property-path="JSON.stringify(['defaultPotential'])"
                    >默认潜能<select
                      :value="draft.defaultPotential ?? ''"
                      @change="updateIdentity('defaultPotential', $event)"
                    >
                      <option value="">沿用星级默认规则</option>
                      <option v-for="n in [0, 1, 2, 3, 4, 5]" :key="n" :value="n">
                        {{ n }} 潜
                      </option>
                    </select></label
                  >
                </div>
              </section>
              <dl class="identity-reference">
                <dt title="项目内稳定引用身份；不随显示名称修改。">模板 ID</dt>
                <dd>{{ draft.slug }}</dd>
                <dt title="来源游戏数据身份，仅用于追溯。">来源游戏 ID</dt>
                <dd>{{ draft.gameId }}</dd>
              </dl>
            </div>
          </section>
          <section v-else-if="section === 'trust'" class="definition-section trust-page">
            <div class="panel-subsection">
              <header :data-property-path="JSON.stringify(['trustAttributeBonus'])">
                <div>
                  <h3>信赖属性节点</h3>
                  <p>四个信赖节点提供的属性值；未自定义时使用全局主属性规则 10、15、15、20。</p>
                </div>
                <EaButton size="sm" @click="setTrustMode(draft.trustAttributeBonus === undefined)">
                  {{ draft.trustAttributeBonus === undefined ? '改为自定义规则' : '恢复全局规则' }}
                </EaButton>
              </header>
              <p v-if="draft.trustAttributeBonus && !draft.trustAttributeBonus.attributes.length">
                未选择属性：这些节点不会增加任何属性。可重新选择，或恢复全局规则。
              </p>
              <div class="trust-values">
                <label
                  v-for="(value, index) in (
                    draft.trustAttributeBonus ?? DEFAULT_TRUST_ATTRIBUTE_BONUS
                  ).values"
                  :key="index"
                  :data-property-path="JSON.stringify(['trustAttributeBonus', 'values', index])"
                >
                  信赖节点 {{ index + 1 }}
                  <input
                    type="number"
                    step="any"
                    :disabled="!draft.trustAttributeBonus"
                    :value="value"
                    @change="updateTrustValue(index, $event)"
                  />
                </label>
              </div>
              <template v-if="draft.trustAttributeBonus">
                <fieldset
                  class="attribute-chips"
                  :data-property-path="JSON.stringify(['trustAttributeBonus', 'attributes'])"
                >
                  <legend>每个节点增加的属性</legend>
                  <button
                    v-for="attribute in TRUST_ATTRIBUTE_OPTIONS"
                    :key="attribute"
                    :class="{ active: draft.trustAttributeBonus.attributes.includes(attribute) }"
                    :aria-pressed="draft.trustAttributeBonus.attributes.includes(attribute)"
                    @click="toggleTrustAttribute(attribute)"
                  >
                    {{
                      attribute === 'main'
                        ? '当前主属性'
                        : attribute === 'secondary'
                          ? '当前副属性'
                          : ATTRIBUTE_LABELS[attribute]
                    }}
                  </button>
                </fieldset>
              </template>
            </div>
          </section>

          <section
            v-else-if="section === 'skills'"
            class="definition-section split-section"
            :class="{ 'focused-definition-section': showSkillEditor }"
          >
            <aside v-if="!showSkillEditor" class="object-list">
              <input v-model="objectSearch" class="object-search" placeholder="搜索技能组…" />
              <button class="add-object" @click="addLibraryGroup">＋ 新建空组</button>
              <button
                class="add-object"
                :disabled="selectedGroup === undefined"
                @click="duplicateGroup"
              >
                ＋ 复制当前技能组
              </button>
              <button
                v-for="entry in filteredGroups"
                :key="`${entry.group.key}:${entry.index}`"
                :class="{ active: selectedGroupIndex === entry.index }"
                @click="
                  selectedGroupIndex = entry.index;
                  selectedSkillIndex = 0;
                  showSkillEditor = false;
                "
              >
                <span>{{ entry.group.key }}</span
                ><small>{{ listSkillGroupDefinitionBindings(entry.group).length }} 个技能</small>
              </button>
            </aside>
            <div v-if="selectedGroup" class="object-editor">
              <SkillDefinitionEditorDialog
                v-if="showSkillEditor && selectedSkill"
                embedded
                :visible="true"
                :title="selectedSkill.key"
                :template-definition="selectedSkill"
                :key="selectedSkillDefinitionPath || `${selectedGroup.key}/${selectedSkill.key}`"
                :navigation-request="skillNavigation"
                :shared-history="selectedSkillHistory"
                :view-state-key="`skill:${selectedSkillDefinitionPath || `${selectedGroup.key}/${selectedSkill.key}`}`"
                :custom-definition="undefined"
                :skill-level="skillLevel"
                :ability-entity-ids="abilityEntityIds"
                show-reference-pins
                allow-invalid-save
                :back-label="skillEntry === 'home' ? '返回干员总览' : '返回技能库组织'"
                @update:visible="closeSkillEditor"
                @reference="openReferencedDefinition"
              />
              <OperatorSkillLibraryGroupPage
                v-else
                :group="selectedGroup"
                :first="selectedGroupIndex === 0"
                :last="selectedGroupIndex === draft.skillGroups.length - 1"
                @update="replaceGroup(selectedGroupIndex, $event)"
                @edit="openLibrarySkill"
                @move="moveGroup"
                @remove="removeGroup"
                @add-skill="addLibrarySkill"
              />
            </div>
          </section>

          <section
            v-else-if="section === 'progression'"
            class="definition-section behavior-editing-section"
          >
            <OperatorUpgradeGraphPage
              v-if="selectedUpgrade"
              :key="`${progressionKind}:${selectedUpgradeIndex}`"
              :upgrade="selectedUpgrade"
              :navigation-request="upgradeNavigation"
              :kind="progressionKind"
              :slot="selectedUpgradeIndex"
              :skill-level="skillLevel"
              :skill-group-keys="skillGroupKeys"
              :passive-skill-keys="passiveSkillKeys"
              :history="upgradeHistory"
              :create-modifier="createUpgradeModifier"
            />
          </section>

          <section
            v-else-if="section === 'runtime'"
            class="definition-section"
            :class="{
              'behavior-editing-section':
                editingBehavior || runtimePage === 'routing' || runtimePage === 'initialization',
            }"
          >
            <OperatorProvenancePage
              v-if="runtimePage === 'provenance'"
              :definition="draft"
              :issues="draftIssues"
              @reveal-issue="revealIssue"
            />
            <OperatorRoutingPage
              :navigation-request="runtimeNavigation"
              v-else-if="runtimePage === 'routing'"
              :value="routingDocument"
              :skill-keys="
                listOperatorSkillDefinitionBindings(draft).map(binding => binding.skill.key)
              "
              :history="routingHistory"
            />
            <OperatorStatusPresentationPage
              :navigation-request="runtimeNavigation"
              v-else-if="runtimePage === 'presentation'"
              :restored-location="history.restoredLocation?.value"
              :value="draft.passiveUi"
              :local-buff-ids="Object.keys(draft.buffDefinitions ?? {})"
              :common-buff-ids="Object.keys(commonBuffDefinitions ?? {})"
              @reveal-buff="
                id => {
                  rememberReferenceOrigin();
                  section = 'buffs';
                  openBuffDetail(id);
                }
              "
              @update="
                (value, field) =>
                  commitDraft({ ...draft, passiveUi: value }, field ? [field] : undefined)
              "
            />
            <OperatorComboGraphPage
              :navigation-request="runtimeNavigation"
              v-else-if="showComboEditor"
              :value="comboDocument"
              :history="comboHistory"
              :skill-keys="comboSkillKeys"
              :skill-level="skillLevel"
            />
            <OperatorInitializationPage
              :navigation-request="runtimeNavigation"
              v-else-if="runtimePage === 'initialization'"
              :value="initializationDocument"
              :history="initializationHistory"
            />
            <OperatorRuntimeGraphPage
              :navigation-request="runtimeNavigation"
              v-else-if="showRuntimeBehaviorEditor"
              :passive-skills="draft.passiveSkills"
              :event-handlers="draft.eventHandlers"
              :history="runtimeHistory"
              :skill-level="skillLevel"
            />
            <template v-else>
              <header
                v-if="runtimePage === 'blackboard'"
                :data-property-path="JSON.stringify(['entityBlackboard'])"
              >
                <div>
                  <h3>角色实体黑板</h3>
                  <p>角色实例跨技能共享的字面初值；与每次技能释放重置的技能黑板不同。</p>
                </div>
                <EaButton size="sm" @click="addEntityBlackboardEntry"> ＋ 添加初值 </EaButton>
              </header>
              <div v-if="runtimePage === 'blackboard'" class="entity-blackboard">
                <table v-if="entityBlackboardEntries.length">
                  <thead>
                    <tr>
                      <th scope="col">黑板键</th>
                      <th scope="col">类型</th>
                      <th scope="col">初始值</th>
                      <th scope="col"><span class="sr-only">操作</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="([key, value], index) in entityBlackboardEntries"
                      :key="`${key}:${index}`"
                    >
                      <td>
                        <input
                          :aria-label="`黑板键 ${key}`"
                          :aria-invalid="blackboardRenameError?.key === key || undefined"
                          :value="key"
                          @change="renameEntityBlackboardEntry(key, $event)"
                        />
                        <small
                          v-if="blackboardRenameError?.key === key"
                          role="alert"
                          class="blackboard-rename-error"
                          >{{ blackboardRenameError.message }}</small
                        >
                      </td>
                      <td :data-property-path="JSON.stringify(['entityBlackboard', key, 'type'])">
                        <select
                          :aria-label="`${key} 的类型`"
                          :value="typeof value"
                          @change="toggleEntityBlackboardEntryType(key)"
                        >
                          <option value="number">数值</option>
                          <option value="string">文本</option>
                        </select>
                      </td>
                      <td :data-property-path="JSON.stringify(['entityBlackboard', key])">
                        <input
                          :aria-label="`${key} 的初始值`"
                          :type="typeof value === 'number' ? 'number' : 'text'"
                          step="any"
                          :value="value"
                          @change="updateEntityBlackboardEntry(key, $event)"
                        />
                      </td>
                      <td>
                        <button
                          class="danger-button"
                          :aria-label="`删除 ${key}`"
                          @click="removeEntityBlackboardEntry(key)"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-if="entityBlackboardEntries.length === 0" class="empty-state">
                  没有角色级字面初值。
                </div>
              </div>
            </template>
          </section>

          <section
            v-else-if="section === 'buffs'"
            class="definition-section split-section buff-editing-section peer-definition-page"
          >
            <aside v-if="!buffDetailOpen" class="object-list">
              <h3>Buff 定义</h3>
              <p>选择对象进入详情；所有修改统一保存到干员定义。</p>
              <input v-model="objectSearch" class="object-search" placeholder="搜索 Buff…" />
              <button class="add-object" @click="addBuff">＋ 新增 Buff</button>
              <button
                v-for="id in filteredBuffIds"
                :key="id"
                :class="{ active: selectedBuffId === id }"
                @click="openBuffDetail(id)"
              >
                {{ id }}
              </button>
              <p v-if="filteredBuffIds.length === 0" class="empty-state">没有匹配的 Buff 定义。</p>
            </aside>
            <div v-else-if="selectedBuffStep" class="object-editor">
              <header>
                <div>
                  <span class="object-kind-label">Buff 定义</span>
                  <p>干员级 Buff 蓝图；技能只通过 ID 引用。</p>
                </div>
                <button
                  class="danger-button"
                  :title="
                    selectedBuffReferences.length > 0
                      ? `删除后保留 ${selectedBuffReferences.length} 处引用，由定义检查报告缺失；可撤销`
                      : '删除 Buff 定义'
                  "
                  @click="removeBuff"
                >
                  删除
                </button>
              </header>
              <DefinitionReferenceList
                :key="selectedBuffId"
                :references="selectedBuffReferences"
                @reveal="revealDefinitionReference"
              />
              <BuffDefinitionGraphEditor
                fill-available
                :buff-id="selectedBuffId"
                :definition="selectedBuff!"
                :skill-level="skillLevel"
                :shared-history="selectedBuffHistory"
                @update="
                  updateBuffStep({
                    kind: 'applyBuff',
                    parameters: {
                      buffId: selectedBuffId,
                      target: 'caster',
                      definition: $event,
                    },
                  })
                "
              />
            </div>
            <div v-else class="empty-state">这个干员还没有 Buff 定义。</div>
          </section>

          <section v-else class="definition-section entity-editing-section">
            <AbilityEntityDefinitionsDialog
              paged
              parent-navigation
              :visible="true"
              :base-definitions="{}"
              :custom-definitions="draft.abilityEntityDefinitions"
              :common-definitions="commonAbilityEntityDefinitions"
              :skill-level="skillLevel"
              :initial-selected-id="referencedEntityId"
              :operator-definition="draft"
              :shared-history="entityHistory"
              @detail-change="entityDetailOpen = $event"
              @selection-change="referencedEntityId = $event"
              @reveal-reference="revealEntityDefinitionReference"
            />
          </section>
        </main>
      </div>

      <template #footer>
        <div v-if="showProblems && draftIssues.length" class="workspace-problems">
          <EaButton
            variant="ghost"
            size="sm"
            v-for="issue in draftIssues"
            :key="`${issue.path}:${issue.message}`"
            @click="revealIssue(issue)"
          >
            <code>{{ issue.path }}</code
            ><span>{{ issue.message }}</span>
          </EaButton>
        </div>
        <EaDialogActions class="workspace-footer" align="start">
          <EaButton
            variant="ghost"
            size="sm"
            class="problem-summary"
            :class="{ invalid: draftIssues.length > 0 }"
            @click="showProblems = !showProblems"
          >
            {{ draftIssues.length > 0 ? `● ${draftIssues.length} 个问题` : '✓ 定义结构有效' }}
          </EaButton>
          <EaButton size="sm" @click="emit('reset')"> 恢复游戏定义 </EaButton>
          <EaButton
            size="sm"
            :disabled="!history.canUndo.value"
            :title="
              history.canUndo.value
                ? `撤销：${describeDefinitionHistory(history.undoLocation?.value)}`
                : '没有可撤销的修改'
            "
            @click="history.restore('undo')"
          >
            撤销
          </EaButton>
          <EaButton
            size="sm"
            :disabled="!history.canRedo.value"
            :title="
              history.canRedo.value
                ? `重做：${describeDefinitionHistory(history.redoLocation?.value)}`
                : '没有可重做的修改'
            "
            @click="history.restore('redo')"
          >
            重做
          </EaButton>
          <span
            class="history-description"
            :title="describeDefinitionHistory(history.undoLocation?.value)"
          >
            {{
              history.canUndo.value
                ? `撤销：${describeDefinitionHistory(history.undoLocation?.value)}`
                : ''
            }}
          </span>
          <EaButton size="sm" @click="emit('update:visible', false)"> 取消 </EaButton>
          <EaButton
            variant="primary"
            size="sm"
            :disabled="!isDirty || draftIssues.length > 0"
            @click="save"
          >
            保存干员定义
          </EaButton>
        </EaDialogActions>
      </template>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.object-kind-label {
  color: var(--ea-text-secondary);
  font-size: 12px;
}

.trust-page {
  max-width: 920px;
}
.trust-values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 12px;
  margin: 20px 0;
}
.trust-values label {
  display: grid;
  gap: 8px;
  font-size: 12px;
}
.trust-values input {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
  padding: 8px;
}
.trust-values input:disabled {
  opacity: 1;
  -webkit-text-fill-color: var(--ea-fg);
}
.combo-priority-setting {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  flex: none;
  font-size: 12px;
}
.combo-priority-setting select {
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
  padding: 5px 8px;
}
.combo-priority-setting small {
  color: var(--ea-text-secondary);
}
.workspace.workspace-home-layout {
  grid-template-columns: minmax(0, 1fr);
}
.modifier-add {
  position: relative;
}
.modifier-type-menu {
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 5;
  max-height: 300px;
  overflow: auto;
  min-width: 250px;
  background: var(--ea-workbench-panel, #252528);
  border: 1px solid #666;
  padding: 6px;
  box-shadow: 0 8px 20px #0008;
}
.modifier-type-menu button {
  display: block;
  width: 100%;
  text-align: left;
}
.workspace {
  display: grid;
  grid-template-columns: var(--definition-outliner-width, 210px) minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  border: 1px solid #3b3b3f;
  background: #171719;
}
.workspace-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.workspace-title div {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.workspace-title strong {
  font-size: 20px;
}
.workspace-title span,
.workspace-title small {
  color: #999;
}
.workspace-title em {
  padding: 2px 7px;
  color: #e7d64f;
  border: 1px solid #776f2c;
  border-radius: 10px;
  font-size: 11px;
  font-style: normal;
}
.workspace-nav {
  min-height: 0;
  overflow: auto;
  padding: 12px;
  border-right: 1px solid #343438;
  background: #121214;
}
.nav-caption {
  padding: 3px 12px 10px;
  color: #68686e;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.workspace-nav button,
.object-list button {
  width: 100%;
  border: 0;
  color: #bbb;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.workspace-nav button {
  display: flex;
  justify-content: space-between;
  padding: 13px 12px;
  border-left: 3px solid transparent;
}
.workspace-nav button.active,
.object-list button.active {
  color: #f3df54;
  background: #2b2a22;
  border-left-color: #e5cf32;
}
.workspace-nav b {
  color: #777;
  font-weight: 500;
}
.workspace-main {
  min-width: 0;
  overflow: auto;
}
.workspace.definition-focused {
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
}
.workspace-main.behavior-editing {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.workspace-main.focused-editing {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.focused-editing .workspace-breadcrumbs {
  flex: none;
}
.behavior-editing .workspace-breadcrumbs {
  flex: none;
}
.workspace-breadcrumbs button:disabled {
  cursor: default;
}
.definition-section.behavior-editing-section {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
  padding: 0 10px;
}
.behavior-editing-section > .object-editor {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  padding: 0;
  overflow: hidden;
}
.definition-section.focused-definition-section {
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 0 10px;
  overflow: hidden;
}
.focused-definition-section > .object-editor {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
.focused-definition-section :deep(.skill-editor) {
  flex: 1;
  height: 100%;
  min-height: 0;
}
.behavior-draft-note {
  margin: 0;
  color: var(--ea-fg-muted);
  font-size: 11px;
  text-align: left;
}
.workspace-main.entity-editing {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.entity-editing .workspace-breadcrumbs {
  flex: none;
}
.definition-section.entity-editing-section {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 10px;
}
.workspace-breadcrumbs {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 0 18px;
  border-bottom: 1px solid #343438;
  background: rgba(23, 23, 25, 0.96);
  color: #777;
}
.workspace-breadcrumbs button {
  padding: 3px 0;
  border: 0;
  background: transparent;
  color: #aaa;
  cursor: pointer;
}
.workspace-breadcrumbs strong {
  color: #ddd;
  font-weight: 500;
}
.definition-section {
  padding: 24px;
}
.definition-section header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 22px;
}
.object-toolbar,
.skill-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.object-toolbar button,
.skill-actions > button {
  min-height: 30px;
  border: 1px solid #444;
  background: #1d1d20;
  color: #bbb;
  cursor: pointer;
}
.object-toolbar button:disabled,
.skill-actions > button:disabled {
  opacity: 0.4;
  cursor: default;
}
h3 {
  margin: 0 0 5px;
  font-size: 18px;
}
p {
  margin: 0;
  color: #8f8f94;
}
.identity-sections {
  max-width: 840px;
  display: grid;
  gap: 18px;
}
.identity-section {
  display: grid;
  gap: 12px;
}
.identity-section + .identity-section {
  border-top: 1px solid var(--ea-border);
  padding-top: 14px;
}
.identity-section h4 {
  margin: 0;
  font-size: 14px;
}
.identity-section p {
  margin: 0;
  color: var(--ea-text-secondary);
  font-size: 12px;
}
.identity-reference {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 6px 16px;
  margin: 0;
  padding-top: 16px;
  border-top: 1px solid var(--ea-border);
  color: var(--ea-text-secondary);
  font-size: 12px;
}
.identity-reference dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.identity-grid,
.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.identity-grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: #aaa;
}
input,
select {
  min-width: 0;
  height: 36px;
  padding: 0 10px;
  color: #eee;
  border: 1px solid #444;
  background: #1d1d20;
}
input:disabled {
  color: #777;
}
.growth-table-scroll {
  overflow-x: auto;
  margin-top: 24px;
}
.growth-table {
  width: 100%;
  min-width: 640px;
  table-layout: fixed;
  border-collapse: collapse;
}
.growth-table caption {
  text-align: left;
  color: #aaa;
  padding-bottom: 12px;
}
.growth-table th,
.growth-table td {
  padding: 5px;
  text-align: left;
}
.growth-table th {
  color: #bbb;
  font-size: 12px;
}
.growth-table input {
  width: 100%;
  box-sizing: border-box;
  padding: 0 6px;
}
.stat-grid label {
  display: grid;
  grid-template-columns: minmax(110px, 1fr) 160px;
  align-items: center;
}
.panel-subsection {
  margin-top: 0;
}
.panel-subsection header {
  margin-bottom: 14px;
}
.panel-subsection label small,
.wide-field small {
  color: #777;
  line-height: 1.45;
}
.attribute-chips {
  margin: 14px 0 0;
  padding: 10px;
  border: 1px solid #3c3c40;
}
.attribute-chips legend {
  color: #888;
}
.attribute-chips button {
  margin: 3px;
  padding: 6px 8px;
  border: 1px solid #444;
  background: #1d1d20;
  color: #aaa;
  cursor: pointer;
}
.attribute-chips button.active {
  border-color: #b5a62e;
  color: #f1dd4e;
  background: #2b2a22;
}
.split-section {
  display: grid;
  grid-template-columns: var(--definition-outliner-width, 240px) minmax(0, 1fr);
  gap: 20px;
  padding: 0;
  min-height: 100%;
}
.object-list {
  padding: 14px;
  border-right: 1px solid #343438;
  background: #151517;
  overflow: auto;
}
.object-search {
  width: 100%;
  margin-bottom: 10px;
  box-sizing: border-box;
}
.object-list button {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 11px 12px;
  overflow-wrap: anywhere;
}
.object-list small {
  color: #777;
}
.object-list .add-object {
  margin-bottom: 10px;
  color: #ddd;
  border: 1px dashed #555;
}
.kind-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-bottom: 10px;
}
.kind-tabs button {
  display: block;
  padding: 8px;
  border: 1px solid #444;
  text-align: center;
}
.structure-summary,
.runtime-boundary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 18px;
  padding: 14px;
  border: 1px solid #3c3c40;
  background: #202023;
}
.structure-summary span,
.runtime-boundary span {
  padding: 5px 8px;
  border: 1px solid #444;
  color: #aaa;
}
.wide-field {
  grid-column: 1 / -1;
}
.entity-blackboard {
  max-width: 1000px;
  overflow-x: auto;
}
.entity-blackboard table {
  width: 100%;
  min-width: 460px;
  border-collapse: collapse;
  table-layout: fixed;
}
.entity-blackboard th {
  text-align: left;
  font-size: 12px;
  color: var(--ea-text-secondary);
  font-weight: normal;
}
.entity-blackboard th:nth-child(2) {
  width: 90px;
}
.entity-blackboard th:last-child {
  width: 60px;
}
.entity-blackboard th,
.entity-blackboard td {
  padding: 8px 8px 8px 0;
  border-bottom: 1px solid var(--ea-border);
}
.entity-blackboard input,
.entity-blackboard select {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.entity-blackboard > .empty-state {
  min-height: 0;
  padding: 16px 0;
  text-align: left;
}
.entity-blackboard .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.runtime-boundary strong {
  width: 100%;
}
.runtime-boundary > p {
  width: 100%;
}
.modifier-workspace {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #343438;
  container-type: inline-size;
}
.modifier-add,
.modifier-toolbar,
.modifier-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.modifier-add select,
.modifier-add button,
.modifier-toolbar button,
.modifier-tabs button {
  min-height: 30px;
  border: 1px solid #444;
  background: #1d1d20;
  color: #bbb;
}
.modifier-tabs button {
  padding: 5px 8px;
}
.modifier-tabs button.active {
  border-color: #b5a62e;
  color: #f1dd4e;
}
.modifier-toolbar {
  margin-top: 8px;
}
.modifier-toolbar span {
  flex: 1;
}
.modifier-toolbar button:disabled {
  opacity: 0.4;
}
.empty-state.compact {
  min-height: 100px;
}
.object-editor {
  min-width: 0;
  padding: 24px 24px 40px 0;
}
.skill-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 22px 0 12px;
}
.skill-tabs button {
  padding: 8px 12px;
  color: #aaa;
  border: 1px solid #444;
  background: #1b1b1e;
  cursor: pointer;
}
.skill-tabs button.active {
  color: #f1dd4e;
  border-color: #b5a62e;
}
.skill-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
  border: 1px solid #3c3c40;
  background: #202023;
}
.skill-summary div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.skill-summary span {
  color: #888;
}
.danger-button {
  color: #e18d8d;
  border: 1px solid #684040;
  background: transparent;
  padding: 7px 12px;
  cursor: pointer;
}
.empty-state {
  display: grid;
  place-items: center;
  color: #777;
  min-height: 300px;
}
.history-description {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ea-fg-muted);
  font-size: 11px;
}
.reference-notice {
  flex: none;
  padding: 8px 12px;
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--ea-fg-muted);
  font-size: 12px;
}
.workspace-footer {
  display: grid;
  grid-template-columns: auto auto auto auto 1fr auto auto;
  gap: 10px;
}
.problem-summary {
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: #80bf93;
  cursor: pointer;
}
.problem-summary.invalid {
  color: #e69a7a;
}
.workspace-problems {
  max-height: 150px;
  margin-bottom: 10px;
  overflow: auto;
  border: 1px solid #4b3430;
  background: #191313;
}
.workspace-problems button {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1fr);
  gap: 14px;
  padding: 8px 10px;
  border: 0;
  border-bottom: 1px solid #332625;
  background: transparent;
  color: #d7b2a4;
  text-align: left;
  cursor: pointer;
}
.workspace-problems code {
  color: #e3876e;
  overflow-wrap: anywhere;
}
.danger-button:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}
@media (max-width: 850px) {
  .workspace {
    grid-template-columns: 150px minmax(0, 1fr);
  }
  .split-section {
    grid-template-columns: 190px minmax(0, 1fr);
  }
  .identity-grid,
  .identity-grid.three,
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 760px) {
  .workspace {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
  }
  .workspace-nav {
    display: flex;
    padding: 4px;
    overflow-x: auto;
    border-right: 0;
    border-bottom: 1px solid #343438;
  }
  .workspace-nav .nav-caption {
    display: none;
  }
  .workspace-nav button {
    flex: none;
    width: auto;
    white-space: nowrap;
    gap: 8px;
    padding: 8px;
  }
}
.definition-section.buff-editing-section {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  grid-template-columns: clamp(150px, 18vw, 210px) minmax(0, 1fr);
  gap: 8px;
}
.definition-section.buff-editing-section.peer-definition-page {
  grid-template-columns: minmax(0, 1fr);
}
.peer-definition-page > .object-list {
  border-right: 0;
}
.buff-editing-section > .object-list {
  min-height: 0;
  overflow: auto;
  padding: 8px;
}
.buff-editing-section > .object-editor {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 8px;
}
.buff-editing-section > .object-editor > header {
  flex: none;
  margin-bottom: 8px;
}
.buff-editing-section :deep(.definition-graph-editor.fill-available) {
  flex: 1;
  height: auto;
}
.blackboard-rename-error {
  display: block;
  margin-top: 6px;
  color: var(--ea-danger, #ff7777);
  overflow-wrap: anywhere;
}
</style>
