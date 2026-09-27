<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, reactive, ref, toRaw, type Raw } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaInput } from '@/design-system';
import { ElConfigProvider } from 'element-plus';
import AssetCatalogBrowser from './AssetCatalogBrowser.vue';
import ResourceTools from './ResourceTools.vue';
import WorkspaceIcon from './WorkspaceIcon.vue';
import AssetResourceContent from './AssetResourceContent.vue';
import { skillTypeLabelKey } from './skillTypeLabelKey';
import {
  OperatorResourceEditError,
  type OperatorResourceCommand,
} from '../../application/editor/operatorResourceCommands';
import InputRegionBoundary from '../keyboard/InputRegionBoundary.vue';
import DefinitionField from '../definition-editor/DefinitionField.vue';
import EditorInspector from '../editor/EditorInspector.vue';
import WeaponGrowthFields from '../editor/WeaponGrowthFields.vue';
import { resourceEditorSelection } from '../editor/resourceEditorView';
import WorkspaceGraphPanels from './WorkspaceGraphPanels.vue';
import { useWorkspaceGraphEditor } from './useWorkspaceGraphEditor';
import {
  WorkspaceAssetSession,
  type WorkspaceAssetSource,
  type WorkspaceAssetSave,
} from './workspaceSession';
import {
  describeWorkspaceResources,
  workspaceActionReferences,
  workspaceResourcePath,
  type WorkspaceDefinitionResource,
} from './workspaceResources';
import { supportsCustomAsset } from './workspaceAssetDefinition';
import { WorkspaceNavigation, type WorkspaceLocation } from './workspaceNavigation';
import { definitionSchemas } from '../definition-editor/definitionSchemas.generated';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import { fieldValueAt, fieldSchemaForValue } from '../definition-editor/definitionFieldRuntime';
import type { SkillDefinition } from '../../core/game-data/operatorDefinition';
import type { ActionGraphResourceOwner } from '../../application/editor/actionGraphResourceEditing';
import { resolveBuffDisplayName } from '../timeline/results/buffDisplayName';
import { nodeName } from '../action-graph/editorNodeText';
import './assetWorkspace.css';
import {
  createWorkspaceDocumentViews,
  resourceView,
  type WorkspaceDocumentViews,
} from './workspaceViews';

const props = defineProps<{
  assets: readonly WorkspaceAssetSource[];
  initialAsset: string;
  saveAsset: (request: WorkspaceAssetSave) => void | Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const { t, te } = useI18n();
const tr = (key: string) => t(`assetWorkspace.${key}`);
// 工作台及其传送到 body 的浮层共用层级起点，避免下拉菜单被工作台遮住。
const workspaceZIndex = 3000;
interface Document {
  key: string;
  session: Raw<WorkspaceAssetSession>;
  asset: string;
  views: WorkspaceDocumentViews;
}
const documents = ref<Document[]>([]);
const revision = ref(0);
const activeKey = ref('');
const active = computed(() => documents.value.find(doc => doc.key === activeKey.value)!);
const activeView = computed(() => resourceView(active.value.views, active.value.asset));
const draft = computed(() => {
  void revision.value;
  return active.value.session.current;
});
const custom = computed(() => active.value.session.history.editable);
const canCustomize = computed(() => !custom.value && supportsCustomAsset(draft.value.edit));
const canUndo = computed(() => {
  void revision.value;
  return active.value.session.history.canUndo;
});
const canRedo = computed(() => {
  void revision.value;
  return active.value.session.history.canRedo;
});
const selection = resourceEditorSelection(() => activeView.value);
const { field } = selection;
const browserVisible = ref(false);
const browserElement = ref<HTMLElement>();
const browserHeight = ref<number>();
let browserResize:
  { pointerId: number; y: number; height: number; previous: number | undefined } | undefined;
function setBrowserHeight(height: number) {
  const maximum = Math.max(120, (workspaceElement.value?.clientHeight ?? window.innerHeight) - 150);
  browserHeight.value = Math.max(Math.min(180, maximum), Math.min(maximum, height));
}
function startBrowserResize(event: PointerEvent) {
  if (event.button !== 0 || !browserElement.value) return;
  event.preventDefault();
  browserResize = {
    pointerId: event.pointerId,
    y: event.clientY,
    height: browserElement.value.clientHeight,
    previous: browserHeight.value,
  };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function moveBrowserResize(event: PointerEvent) {
  if (browserResize?.pointerId !== event.pointerId) return;
  setBrowserHeight(browserResize.height + browserResize.y - event.clientY);
}
function endBrowserResize(event: PointerEvent) {
  if (browserResize?.pointerId !== event.pointerId) return;
  if (event.type === 'pointercancel') browserHeight.value = browserResize.previous;
  browserResize = undefined;
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
}
function resizeBrowserByKey(event: KeyboardEvent) {
  if (!['ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.key === 'Home') browserHeight.value = undefined;
  else
    setBrowserHeight(
      (browserElement.value?.clientHeight ?? 360) + (event.key === 'ArrowUp' ? 24 : -24),
    );
}
const browserPinned = ref(false);
const focused = ref(false);
const workspaceElement = ref<HTMLElement>();
const status = ref('');
const saving = ref(false);
const graphOpen = computed({
  get: () => (active.value ? activeView.value.graphOpen : false),
  set: (value: boolean) => {
    activeView.value.graphOpen = value;
  },
});
function canLeaveGraphFields() {
  return !graphOpen.value || graphEditor.canLeaveFields();
}
const pendingClose = ref<string | 'workspace' | null>(null);
const navigation = reactive(new WorkspaceNavigation());
const layouts = reactive({
  graph: { left: 214, right: 270, leftOpen: true, rightOpen: true },
  operator: { left: 230, right: 300, leftOpen: true, rightOpen: false },
  data: { left: 190, right: 250, leftOpen: true, rightOpen: true },
});
const family = computed(() =>
  graphOpen.value ? 'graph' : draft.value.edit.kind === 'operator' ? 'operator' : 'data',
);
const layout = computed(() => layouts[family.value]);
let stopResize: (() => void) | undefined;
function resizePanel(side: 'left' | 'right', event: PointerEvent) {
  if (event.button !== 0) return;
  event.preventDefault();
  stopResize?.();
  const startX = event.clientX,
    startWidth = layout.value[side],
    target = layout.value;
  const move = (next: PointerEvent) => {
    const width = workspaceElement.value?.clientWidth ?? 1200;
    const other =
      side === 'left' ? (target.rightOpen ? target.right : 0) : target.leftOpen ? target.left : 0;
    target[side] = Math.max(
      160,
      Math.min(
        360,
        width - other - 360,
        startWidth + (next.clientX - startX) * (side === 'left' ? 1 : -1),
      ),
    );
  };
  const end = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', end);
    window.removeEventListener('pointercancel', end);
    stopResize = undefined;
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  stopResize = end;
}
onBeforeUnmount(() => stopResize?.());
function resetLayout() {
  Object.assign(
    layout.value,
    family.value === 'graph'
      ? { left: 214, right: 270 }
      : family.value === 'operator'
        ? { left: 205, right: 260 }
        : { left: 190, right: 250 },
    { leftOpen: true, rightOpen: true },
  );
  focused.value = false;
}

function resourceLabel(resource: WorkspaceDefinitionResource): string {
  if (resource.path.length === 0) return draft.value.name;
  const definition = draft.value.edit.definition;
  const value = fieldValueAt(definition, resource.path) as Record<string, unknown>;
  if (typeof value?.displayName === 'string') return value.displayName;
  if (resource.kind === 'buff') {
    const names = 'buffDisplayNameKeys' in definition ? definition.buffDisplayNameKeys : undefined;
    return resolveBuffDisplayName(
      resource.identity,
      { t, te },
      undefined,
      undefined,
      new Map(Object.entries(names ?? {})),
    );
  }
  if (resource.kind === 'skill' && 'skillDisplayNameKeys' in definition) {
    const nameKey = definition.skillDisplayNameKeys?.[resource.identity];
    if (nameKey && te(nameKey)) return t(nameKey);
  }
  if (resource.kind === 'skill' && draft.value.edit.kind === 'operator') {
    const path = resource.path;
    if (path[0] === 'dodgeSkill') return t('skillType.dodge');
    if (path[0] === 'skillGroups') {
      const group = draft.value.edit.definition.skillGroups[Number(path[1])];
      if (group) {
        const parent = fieldValueAt(definition, path.slice(0, -1));
        const number = Array.isArray(parent) ? ` ${Number(path[path.length - 1]) + 1}` : '';
        return `${t(skillTypeLabelKey(group.skillType))}${number}`;
      }
    }
  }
  if (resource.kind === 'operatorUpgrade')
    return `${tr(resource.path[0] === 'talents' ? 'catalog.kinds.talent' : 'catalog.kinds.potential')} ${Number(resource.path[1]) + 1}`;
  return resource.identity;
}
const resources = computed(() => describeWorkspaceResources(draft.value.edit, resourceLabel));
const byId = computed(() => new Map(resources.value.map(resource => [resource.id, resource])));
const references = computed(() =>
  workspaceActionReferences(
    draft.value.edit.definition,
    resources.value,
    props.assets.flatMap(asset =>
      asset.edit.kind === 'buff' && asset.id !== active.value.session.source.id
        ? [{ id: asset.edit.id, assetId: asset.id, name: asset.name }]
        : [],
    ),
  ),
);
const selected = computed(() => byId.value.get(active.value.asset) ?? resources.value[0]!);
const selectedValue = computed(
  () =>
    fieldValueAt(draft.value.edit.definition, selected.value.definitionResource.path) as Record<
      string,
      unknown
    >,
);
const selectedSchema = computed<DefinitionFieldSchema>(() =>
  fieldSchemaForValue(
    definitionSchemas[selected.value.definitionResource.kind],
    selectedValue.value,
  ),
);
const fields = computed(() => {
  const schema = selectedSchema.value;
  if (schema?.kind !== 'object') return [];
  const ownPath = selected.value.definitionResource.path;
  const directories = new Set(
    resources.value
      .filter(
        resource =>
          resource.definitionResource.path.length > ownPath.length &&
          ownPath.every((part, index) => resource.definitionResource.path[index] === part),
      )
      .map(resource => resource.definitionResource.path[ownPath.length]),
  );
  const identityKey = selected.value.definitionResource.kind === 'globalEffect' ? 'id' : null;
  return Object.keys(schema.fields).filter(
    key =>
      key !== identityKey &&
      !directories.has(key) &&
      ![
        'slug',
        'gameId',
        'actionGraph',
        'conversionSupport',
        'skillAliases',
        'skillGroups',
      ].includes(key),
  );
});
const inspectorSchema = computed(() =>
  selectedSchema.value?.kind === 'object' && field.value
    ? selectedSchema.value.fields[field.value]
    : undefined,
);
const fieldPath = computed(() => [
  ...selected.value.definitionResource.path,
  ...(field.value ? [field.value] : []),
]);
const referenceChoices = computed(() => ({
  gearSet: props.assets.flatMap(asset =>
    asset.edit.kind === 'gearSet' ? [{ value: asset.edit.definition.slug, label: asset.name }] : [],
  ),
  buff: resources.value
    .filter(resource => resource.kind === 'buff')
    .map(resource => ({ value: resource.definitionResource.identity, label: resource.name })),
  skill: resources.value
    .filter(resource => resource.kind === 'skill')
    .map(resource => ({ value: resource.definitionResource.identity, label: resource.name })),
  abilityEntity: resources.value
    .filter(resource => resource.kind === 'entity')
    .map(resource => ({ value: resource.definitionResource.identity, label: resource.name })),
}));
const path = computed(() =>
  workspaceResourcePath(byId.value, selected.value.id).map(id => byId.value.get(id)!),
);
const assetTabs = computed(() => {
  void revision.value;
  return documents.value.map(doc => ({
    key: doc.key,
    documentKey: doc.key,
    name: doc.session.current.name,
    source: doc.session.history.editable ? 'custom' : 'builtin',
  }));
});
const browserAssets = computed(() => {
  void revision.value;
  const entries = new Map(props.assets.map(asset => [asset.id, asset]));
  for (const doc of documents.value)
    if (doc.session.history.editable)
      entries.set(doc.key, {
        ...doc.session.source,
        id: doc.key,
        name: doc.session.current.name,
        custom: true,
      });
  return [...entries.values()];
});
const graphOwner = computed(() =>
  selectedValue.value.actionGraph
    ? (selectedValue.value as unknown as ActionGraphResourceOwner)
    : undefined,
);
const graphSkill = computed(() =>
  selected.value.definitionResource.kind === 'skill'
    ? (selectedValue.value as unknown as SkillDefinition)
    : undefined,
);
const graphEditor = useWorkspaceGraphEditor({
  session: () => {
    void revision.value;
    return active.value.session;
  },
  view: () => activeView.value,
  identity: () => `${activeKey.value}:${active.value?.asset ?? ''}`,
  label: () => selected.value.name,
  path: () => selected.value.definitionResource.path,
  owner: () => graphOwner.value,
  skill: () => graphSkill.value,
  busy: () => saving.value,
  changed: () => {
    revision.value++;
  },
  undo: () => undo(-1),
  redo: () => undo(1),
});
const { skill: skillGraphEditor } = graphEditor;
const graphPanelProps = computed(() => ({
  editor: graphEditor,
  skill: !!graphSkill.value,
  readonly: !custom.value,
  resourceKey: `${activeKey.value}:${active.value.asset}`,
  label: selected.value.name,
  identity: selected.value.definitionResource.identity,
  view: activeView.value,
}));
const variables = computed(() =>
  Object.entries((selectedValue.value.blackboard ?? {}) as Record<string, unknown>).map(
    ([id, value]) => ({ id, type: Array.isArray(value) ? 'number[]' : typeof value }),
  ),
);
const nodes = computed(() =>
  Object.entries(graphOwner.value?.actionGraph.main.nodes ?? {}).map(([id, node]) => ({
    id,
    name: nodeName(node.action.kind),
  })),
);

function recordNavigation() {
  navigation.record({
    document: activeKey.value,
    resource: active.value.asset,
    page: activeView.value.page,
    graphOpen: graphOpen.value,
  });
}
function activate(key: string, record = true) {
  activeKey.value = key;
  reconcileView();
  status.value = '';
  if (record) recordNavigation();
}
async function selectDocument(key: string) {
  if (!canLeaveGraphFields()) return;
  activate(key);
}
async function openSource(id: string) {
  if (!canLeaveGraphFields()) return;
  let doc = documents.value.find(item => item.key === id);
  if (!doc) {
    const source = props.assets.find(item => item.id === id);
    if (!source) throw new Error('asset no longer exists');
    doc = {
      key: id,
      session: markRaw(new WorkspaceAssetSession(toRaw(source))),
      asset: '[]',
      views: createWorkspaceDocumentViews(),
    };
    documents.value.push(doc);
  }
  activate(id);
  if (!browserPinned.value) browserVisible.value = false;
}
async function open(id: string, page?: string) {
  if (!canLeaveGraphFields()) return;
  if (!byId.value.has(id)) return;
  active.value.asset = id;
  reconcileView();
  if (page !== undefined) applyPage(page);
  recordNavigation();
}
function applyPage(page: string) {
  activeView.value.page = page;
  graphOpen.value = ['graph', 'timing'].includes(page) && !!graphOwner.value;
  field.value = null;
}
async function setPage(page: string) {
  if (!canLeaveGraphFields()) return;
  applyPage(page);
  recordNavigation();
}
function openGraph() {
  if (!graphOwner.value) return;
  graphOpen.value = true;
  recordNavigation();
}
function restoreLocation(entry: WorkspaceLocation) {
  activate(entry.document, false);
  active.value.asset = entry.resource;
  activeView.value.page = entry.page;
  graphOpen.value = entry.graphOpen;
  reconcileView();
}
/** 撤销或删除可能使当前资源、宏或图不再存在；浏览状态不能继续指向已删除的内容。 */
function reconcileView() {
  if (!byId.value.has(active.value.asset)) active.value.asset = '[]';
  const owner = graphOwner.value;
  if (!owner) {
    graphOpen.value = false;
    if (['graph', 'timing'].includes(activeView.value.page)) activeView.value.page = 'overview';
  }
  const address = activeView.value.graphAddress;
  if (address.kind === 'macro' && !owner?.actionGraph.macros[address.macroId]) {
    activeView.value.graphAddress = { kind: 'main' };
    selection.clear();
  }
}
async function travel(direction: -1 | 1) {
  if (!canLeaveGraphFields()) return;
  const entry = navigation.travel(direction);
  if (!entry) return;
  restoreLocation(entry);
}
async function customize() {
  if (!canLeaveGraphFields()) return;
  if (!canCustomize.value) return;
  const source = active.value.session.source;
  const id = `project:${source.edit.kind}:${crypto.randomUUID()}`;
  const key = `${source.edit.kind}:${id}`;
  documents.value.push({
    ...active.value,
    key,
    session: markRaw(new WorkspaceAssetSession(source, id)),
    views: createWorkspaceDocumentViews(),
  });
  activate(key);
}
function editOperatorResources(command: OperatorResourceCommand) {
  try {
    active.value.session.editOperatorResources(command);
    revision.value++;
    reconcileView();
    status.value = '';
  } catch (error) {
    status.value =
      error instanceof OperatorResourceEditError
        ? tr(`programs.${error.reason}`)
        : error instanceof Error
          ? error.message
          : String(error);
  }
}
function change(path: readonly (string | number)[], value: unknown) {
  try {
    active.value.session.change(path, value);
    revision.value++;
    status.value = '';
  } catch (error) {
    status.value = error instanceof Error ? error.message : String(error);
  }
}
function rename(name: string) {
  try {
    active.value.session.rename(name);
    revision.value++;
  } catch (error) {
    status.value = error instanceof Error ? error.message : String(error);
  }
}
function undo(direction: number) {
  if (!custom.value || saving.value || !canLeaveGraphFields()) return;
  if (graphOpen.value) graphEditor.cancelConnection();
  if (direction < 0) active.value.session.history.undo();
  else active.value.session.history.redo();
  // 字段输入可保留选中状态；图对象可能已被撤销，不保留指向旧节点或连线的选择。
  if (selection.current.value?.kind !== 'field') selection.clear();
  revision.value++;
  reconcileView();
}
function onWorkspaceKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || !(event.ctrlKey || event.metaKey)) return;
  if ((event.target as HTMLElement).closest('input,textarea,select,[contenteditable]')) return;
  const key = event.key.toLowerCase();
  if (key !== 'z' && key !== 'y') return;
  event.preventDefault();
  event.stopPropagation();
  undo(key === 'y' || event.shiftKey ? 1 : -1);
}
async function save() {
  if (!custom.value || saving.value) return;
  if (!canLeaveGraphFields()) return;
  saving.value = true;
  try {
    const session = active.value.session;
    await props.saveAsset(session.saveRequest());
    session.saved();
    revision.value++;
    status.value = tr('integration.saved');
  } catch (error) {
    status.value = error instanceof Error ? error.message : String(error);
  } finally {
    saving.value = false;
  }
}
async function closeAsset(key: string) {
  if (!canLeaveGraphFields()) return;
  if (documents.value.find(doc => doc.key === key)?.session.dirty) {
    pendingClose.value = key;
    return;
  }
  discardAndClose(key);
}
async function requestClose() {
  if (!canLeaveGraphFields()) return;
  if (documents.value.some(doc => doc.session.dirty)) pendingClose.value = 'workspace';
  else emit('close');
}
function discardAndClose(key: string) {
  pendingClose.value = null;
  if (key === 'workspace' || documents.value.length === 1) {
    emit('close');
    return;
  }
  documents.value = documents.value.filter(doc => doc.key !== key);
  const location = navigation.close(key);
  if (activeKey.value === key) {
    if (location) restoreLocation(location);
    else activate(documents.value.at(-1)!.key);
  }
}
function dismissAssetBrowser(event: PointerEvent) {
  if (!browserVisible.value || browserPinned.value) return;
  if (
    event.target instanceof Element &&
    !event.target.closest('#workspace-asset-browser, .rw-browser-toggle')
  )
    browserVisible.value = false;
}
openSource(props.initialAsset);
browserVisible.value = true;
</script>

<template>
  <InputRegionBoundary label="asset-workspace" :active="true" modal>
    <ElConfigProvider :z-index="workspaceZIndex">
      <main
        ref="workspaceElement"
        class="ap-workspace"
        :style="{
          zIndex: workspaceZIndex,
          '--rw-left': layout.leftOpen && !focused ? layout.left + 'px' : '0px',
          '--rw-right': layout.rightOpen && !focused ? layout.right + 'px' : '0px',
        }"
        @keydown.esc="browserVisible = false"
        @keydown="onWorkspaceKeydown"
        @pointerdown.capture="dismissAssetBrowser"
      >
        <header class="ap-header">
          <WorkspaceIcon name="box" :size="20" /><strong>{{ tr('title') }}</strong
          ><span class="ap-badge">{{ tr('integration.projectAssets') }}</span>
          <div class="ap-spacer" />
          <EaButton variant="ghost" size="sm" :disabled="!canUndo || saving" @click="undo(-1)"
            ><WorkspaceIcon name="undo" />{{ tr('undo') }}</EaButton
          >
          <EaButton variant="ghost" size="sm" :disabled="!canRedo || saving" @click="undo(1)"
            ><WorkspaceIcon name="redo" />{{ tr('redo') }}</EaButton
          >
          <span class="ap-divider" />
          <EaButton v-if="canCustomize" size="sm" @click="customize"
            ><WorkspaceIcon name="copy" />{{ tr('integration.customize') }}</EaButton
          >
          <EaButton v-if="custom" size="sm" :disabled="saving" @click="save"
            ><WorkspaceIcon name="check" />{{ tr('integration.save') }}</EaButton
          >
          <EaButton
            variant="ghost"
            size="sm"
            icon-only
            :aria-label="tr('close')"
            :disabled="saving"
            @click="requestClose"
            ><WorkspaceIcon name="close"
          /></EaButton>
        </header>
        <nav class="ap-tabs" :aria-label="tr('documents')">
          <div
            v-for="doc in assetTabs"
            :key="doc.key"
            class="ap-tab"
            :class="{ 'is-active': activeKey === doc.key }"
          >
            <button class="rw-native-button" @click="selectDocument(doc.documentKey)">
              <WorkspaceIcon :name="doc.source === 'builtin' ? 'lock' : 'graph'" :size="13" />{{
                doc.name
              }}<span v-if="doc.source === 'custom'" class="ap-custom-dot" />
            </button>
            <button
              v-if="assetTabs.length > 1"
              class="rw-native-button ap-tab-close"
              :aria-label="tr('close')"
              @click="closeAsset(doc.key)"
            >
              <WorkspaceIcon name="close" :size="12" />
            </button>
          </div>
        </nav>
        <div class="ap-location">
          <EaButton
            variant="ghost"
            size="sm"
            icon-only
            :aria-label="tr('back')"
            :disabled="!navigation.canBack"
            @click="travel(-1)"
            ><WorkspaceIcon name="back"
          /></EaButton>
          <EaButton
            variant="ghost"
            size="sm"
            icon-only
            :aria-label="tr('forward')"
            :disabled="!navigation.canForward"
            @click="travel(1)"
            ><WorkspaceIcon name="forward"
          /></EaButton>
          <template v-for="part in path" :key="part.id">
            <WorkspaceIcon name="chevron" :size="12" /><button
              class="rw-native-button ap-text-button"
              @click="open(part.id)"
            >
              {{ part.name }}
            </button>
          </template>
          <div class="ap-spacer" />
          <div class="rw-layout-actions">
            <button
              class="rw-native-button"
              :aria-label="tr('workspace.toggleTools')"
              :aria-pressed="layout.leftOpen"
              @click="layout.leftOpen = !layout.leftOpen"
            >
              <WorkspaceIcon name="list" :size="14" />
            </button>
            <button
              class="rw-native-button"
              :aria-label="tr('workspace.toggleInspector')"
              :aria-pressed="layout.rightOpen"
              @click="layout.rightOpen = !layout.rightOpen"
            >
              <WorkspaceIcon name="info" :size="14" />
            </button>
            <button
              class="rw-native-button"
              :aria-label="tr('workspace.focus')"
              :aria-pressed="focused"
              @click="focused = !focused"
            >
              <WorkspaceIcon name="fit" :size="14" />
            </button>
            <button
              class="rw-native-button"
              :aria-label="tr('workspace.resetLayout')"
              @click="resetLayout"
            >
              <WorkspaceIcon name="layout" :size="14" />
            </button>
          </div>
          <span class="ap-mode"
            ><WorkspaceIcon :name="custom ? 'unlock' : 'lock'" :size="12" />{{
              tr(custom ? 'draft' : 'readonly')
            }}</span
          >
          <WorkspaceGraphPanels v-if="graphOpen" area="toolbar" v-bind="graphPanelProps" />
        </div>
        <div class="ap-body rw-body">
          <ResourceTools
            v-show="layout.leftOpen && !focused"
            :resources="resources"
            :references="references"
            :asset="active.asset"
            :page="activeView.page"
            :tab="activeView.toolTab"
            :variables="variables"
            :nodes="nodes"
            :references-ready="true"
            :has-timeline="Array.isArray(selectedValue.scheduledSequences)"
            :has-graph="!!graphOwner"
            @page="setPage"
            @owner-page="open('[]', $event)"
            @tab="activeView.toolTab = $event"
            @open="open($event)"
            @open-asset="openSource"
          >
            <template v-if="graphOpen" #tools="{ tab }">
              <WorkspaceGraphPanels
                area="tools"
                v-bind="graphPanelProps"
                :tool-tab="tab"
                @page="setPage"
              />
            </template>
          </ResourceTools>
          <div
            v-show="layout.leftOpen && !focused"
            class="rw-splitter"
            role="separator"
            aria-orientation="vertical"
            :aria-label="tr('workspace.toolsWidth')"
            tabindex="0"
            @pointerdown="resizePanel('left', $event)"
            @keydown.left.prevent="layout.left = Math.max(160, layout.left - 10)"
            @keydown.right.prevent="layout.left = Math.min(360, layout.left + 10)"
          />
          <section
            :ref="value => (skillGraphEditor.editorRoot = value as HTMLElement)"
            class="ap-document"
            :class="{ 'ap-document--graph': graphOpen }"
            @keydown="graphOpen && graphSkill && skillGraphEditor.onKeydown($event)"
          >
            <WorkspaceGraphPanels v-if="graphOpen" area="content" v-bind="graphPanelProps" />
            <AssetResourceContent
              v-else
              :edit="draft.edit"
              :name="draft.name"
              :custom="custom"
              :resource="selected"
              :resources="resources"
              :page="activeView.page"
              :fields="fields"
              :schema="selectedSchema"
              :reference-choices="referenceChoices"
              @page="setPage"
              @open="open"
              @field="field = $event"
              @change="change"
              @graph="openGraph"
              @command="editOperatorResources"
            />
          </section>
          <div
            v-show="layout.rightOpen && !focused"
            class="rw-splitter"
            role="separator"
            aria-orientation="vertical"
            :aria-label="tr('workspace.inspectorWidth')"
            tabindex="0"
            @pointerdown="resizePanel('right', $event)"
            @keydown.left.prevent="layout.right = Math.min(360, layout.right + 10)"
            @keydown.right.prevent="layout.right = Math.max(160, layout.right - 10)"
          />
          <aside v-show="layout.rightOpen && !focused" class="ap-inspector">
            <div class="ap-section-heading">{{ tr('inspector') }}</div>
            <WorkspaceGraphPanels v-if="graphOpen" area="inspector" v-bind="graphPanelProps" />
            <EditorInspector
              v-else
              :title="
                field
                  ? te(`definitionEditor.fields.${field}`)
                    ? t(`definitionEditor.fields.${field}`)
                    : field
                  : selected.name
              "
              :identity="selected.definitionResource.identity"
            >
              <template v-if="field">
                <WeaponGrowthFields
                  v-if="
                    draft.edit.kind === 'weapon' &&
                    selected.definitionResource.path.length === 0 &&
                    field === 'baseAttackAtLevelNodes'
                  "
                  :values="draft.edit.definition.baseAttackAtLevelNodes"
                  :readonly="!custom || saving"
                  @change="change(fieldPath, $event)"
                />
                <DefinitionField
                  v-else
                  :key="JSON.stringify(fieldPath)"
                  :name="field"
                  :path="fieldPath"
                  :value="selectedValue[field]"
                  :schema="inspectorSchema"
                  :editable="custom && !saving"
                  :reference-choices="referenceChoices"
                  root
                  @change="change"
                  @open-graph="openGraph"
                />
              </template>
              <template v-else>
                <label class="ap-field"
                  >{{ tr('integration.assetName')
                  }}<EaInput
                    :model-value="draft.name"
                    :disabled="!custom || saving"
                    @change="rename"
                /></label>
                <p class="ap-explanation">{{ tr('workspace.selectionHint') }}</p>
              </template>
              <div v-if="!custom" class="ap-readonly-note">
                <WorkspaceIcon name="lock" :size="14" />
                <p>{{ tr(canCustomize ? 'readonlyHelp' : 'integration.readonlyAsset') }}</p>
                <EaButton v-if="canCustomize" size="sm" @click="customize">{{
                  tr('integration.customize')
                }}</EaButton>
              </div>
            </EditorInspector>
          </aside>
        </div>
        <section
          v-show="browserVisible"
          ref="browserElement"
          id="workspace-asset-browser"
          class="rw-asset-drawer"
          :style="browserHeight === undefined ? undefined : { height: `${browserHeight}px` }"
          :aria-label="tr('library')"
        >
          <div
            class="rw-drawer-resizer"
            role="separator"
            tabindex="0"
            aria-orientation="horizontal"
            :aria-label="tr('browser.resize')"
            @pointerdown="startBrowserResize"
            @pointermove="moveBrowserResize"
            @pointerup="endBrowserResize"
            @pointercancel="endBrowserResize"
            @lostpointercapture="endBrowserResize"
            @keydown="resizeBrowserByKey"
            @dblclick="browserHeight = undefined"
          />
          <div class="rw-drawer-heading">
            <strong>{{ tr('library') }}</strong
            ><span>{{ tr('workspace.drawerHint') }}</span>
            <div class="ap-spacer" />
            <button
              class="rw-native-button"
              :aria-pressed="browserPinned"
              @click="browserPinned = !browserPinned"
            >
              <WorkspaceIcon name="pin" :size="13" />{{ tr('workspace.pin') }}</button
            ><button
              class="rw-native-button"
              :aria-label="tr('close')"
              @click="browserVisible = false"
            >
              <WorkspaceIcon name="close" :size="14" />
            </button>
          </div>
          <AssetCatalogBrowser
            :assets="browserAssets"
            :selected="activeKey"
            @navigate="openSource"
            @close="browserVisible = false"
          />
        </section>
        <section
          v-if="pendingClose"
          class="ap-review"
          role="alertdialog"
          :aria-label="tr('integration.unsaved')"
        >
          <h2>{{ tr('integration.unsaved') }}</h2>
          <p>{{ tr('integration.discardHelp') }}</p>
          <EaButton @click="discardAndClose(pendingClose!)">{{
            tr('integration.discard')
          }}</EaButton>
          <EaButton @click="pendingClose = null">{{ tr('integration.cancel') }}</EaButton>
        </section>
        <footer class="ap-status">
          <button
            type="button"
            class="rw-native-button rw-browser-toggle"
            :aria-expanded="browserVisible"
            aria-controls="workspace-asset-browser"
            @click="browserVisible = !browserVisible"
          >
            <WorkspaceIcon name="folder" :size="14" />{{ tr('library') }}
          </button>
          <span class="ap-variable-dot" />{{ status || tr('ready') }}
          <div class="ap-spacer" />
          {{ tr('sharedDraft') }}
        </footer>
      </main>
    </ElConfigProvider>
  </InputRegionBoundary>
</template>
