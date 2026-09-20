<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
import { EaButton } from '../../../../design-system/index';
import { computed, markRaw, nextTick, provide, ref, useId, watch } from 'vue';
import { useEditorHistoryShortcuts } from '../../../keyboard/useEditorHistoryShortcuts';
import { useI18n } from 'vue-i18n';
import type {
  AbilityEntityDefinition,
  CombatStepDefinition,
  OperatorAbilityEntityDefinitions,
  OperatorDefinition,
} from '../../../../core/game-data/operatorDefinition';
import { validateAbilityEntityDefinition } from '../../../../core/game-data/validation/actionPrograms';
import { ABILITY_ENTITY_IDS_KEY } from './abilityEntityEditorContext';
import {
  collectOperatorDefinitionReferences,
  referencesToDefinition,
  type OperatorDefinitionReference,
} from './operatorDefinitionReferences';
import AbilityEntityDefinitionGraphEditor from './AbilityEntityDefinitionGraphEditor.vue';
import DefinitionReferenceList from '../DefinitionReferenceList.vue';
import {
  useDefinitionDraftHistory,
  type DefinitionDraftHistory,
} from '../useDefinitionDraftHistory';

type SpawnAbilityEntityStep = CombatStepForKind<'spawnAbilityEntity'>;

const props = defineProps<{
  visible: boolean;
  baseDefinitions: OperatorAbilityEntityDefinitions;
  customDefinitions?: OperatorAbilityEntityDefinitions;
  commonDefinitions?: OperatorAbilityEntityDefinitions;
  skillLevel: number;
  initialSelectedId?: string;
  operatorDefinition?: OperatorDefinition;
  sharedHistory?: DefinitionDraftHistory<OperatorAbilityEntityDefinitions>;
  paged?: boolean;
  parentNavigation?: boolean;
}>();
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  save: [definitions: OperatorAbilityEntityDefinitions];
  'reveal-reference': [reference: OperatorDefinitionReference];
  'detail-change': [open: boolean];
  'selection-change': [id: string];
}>();
const { t } = useI18n({ useScope: 'global' });

const localDraft = ref<Record<string, AbilityEntityDefinition>>({});
// 嵌入根工作区时直接读取根草稿；独立入口才拥有本地草稿和保存操作。
const draft = computed({
  get: () => (props.sharedHistory ? (props.customDefinitions ?? {}) : localDraft.value),
  set: value => {
    if (!props.sharedHistory) localDraft.value = value;
  },
});
const editorRoot = ref<HTMLElement | null>(null);
const selectedId = ref('');
const detailOpen = ref(false);
watch(detailOpen, open => emit('detail-change', open));
function openDefinition(id: string): void {
  creating.value = false;
  selectedId.value = id;
  emit('selection-change', id);
  detailOpen.value = mergedDefinitions.value[id] !== undefined;
}
const newId = ref('');
const creating = ref(false);
const newIdInput = ref<HTMLInputElement>();
const createButton = ref<HTMLButtonElement>();
const createErrorId = useId();
function beginCreate() {
  newId.value = nextCustomId();
  creating.value = true;
  void nextTick(() => {
    newIdInput.value?.focus();
    newIdInput.value?.select();
  });
}
function cancelCreate() {
  creating.value = false;
  void nextTick(() => createButton.value?.focus());
}
const filterText = ref('');
const mergedDefinitions = computed<Record<string, AbilityEntityDefinition>>(() => ({
  ...props.baseDefinitions,
  ...draft.value,
}));
const operatorIds = computed(() => Object.keys(mergedDefinitions.value).sort());
const commonIds = computed(() => Object.keys(props.commonDefinitions ?? {}).sort());
const allIds = computed(() => [...new Set([...operatorIds.value, ...commonIds.value])].sort());
const normalizedFilter = computed(() => filterText.value.trim().toLocaleLowerCase());
const filteredOperatorIds = computed(() =>
  operatorIds.value.filter(id => id.toLocaleLowerCase().includes(normalizedFilter.value)),
);
const filteredCommonIds = computed(() =>
  commonIds.value.filter(id => id.toLocaleLowerCase().includes(normalizedFilter.value)),
);
const canAdd = computed(() => {
  const id = newId.value.trim();
  return id.length > 0 && !allIds.value.includes(id);
});
const createError = computed(() =>
  !newId.value.trim()
    ? '请填写用于技能引用的定义 ID。'
    : allIds.value.includes(newId.value.trim())
      ? '此 ID 已被干员或公共能力实体使用，请换一个。'
      : '',
);
provide(ABILITY_ENTITY_IDS_KEY, allIds);
const history = markRaw(
  props.sharedHistory ??
    useDefinitionDraftHistory(
      () => draft.value,
      value => {
        draft.value = value;
      },
    ),
);
const selectedDefinitionHistory = markRaw<DefinitionDraftHistory<AbilityEntityDefinition>>({
  commit(value, location) {
    if (selectedId.value === '') return;
    history.commit(
      { ...draft.value, [selectedId.value]: cloneProjectJson(value) },
      { ...location, path: location?.path ?? '', objectId: selectedId.value },
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
    if (props.sharedHistory && location?.section !== 'entities') return;
    if (location?.objectId && mergedDefinitions.value[location.objectId]) {
      selectedId.value = location.objectId;
      filterText.value = '';
      detailOpen.value = true;
    } else if (props.paged) {
      detailOpen.value = false;
    }
  },
  // 根草稿通过 props 下传，恢复选择必须等待本次根数据更新完成。
  { flush: 'post' },
);
useEditorHistoryShortcuts(editorRoot, history.restore);

const selectedDefinition = computed(() => mergedDefinitions.value[selectedId.value]);
const selectedIsOverride = computed(() => draft.value[selectedId.value] !== undefined);
const selectedIsBase = computed(() => props.baseDefinitions[selectedId.value] !== undefined);
const editingStep = computed<SpawnAbilityEntityStep | null>(() => {
  const definition = selectedDefinition.value;
  if (definition === undefined) return null;
  return {
    kind: 'spawnAbilityEntity',
    parameters: {
      abilityEntityId: selectedId.value,
      definition,
      dieWhenSourceDies: false,
    },
  };
});
const validationIssues = computed(() =>
  Object.entries(draft.value).flatMap(([id, definition]) =>
    validateAbilityEntityDefinition(definition, `abilityEntityDefinitions['${id}']`),
  ),
);
const definitionReferences = computed(() =>
  props.operatorDefinition === undefined
    ? []
    : collectOperatorDefinitionReferences({
        ...props.operatorDefinition,
        abilityEntityDefinitions: mergedDefinitions.value,
      }),
);
const selectedReferences = computed(() =>
  referencesToDefinition(definitionReferences.value, 'entity', selectedId.value),
);

watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    creating.value = false;
    if (!props.sharedHistory) draft.value = cloneProjectJson(props.customDefinitions ?? {});
    const ids = Object.keys({ ...props.baseDefinitions, ...draft.value }).sort();
    selectedId.value =
      props.initialSelectedId !== undefined && ids.includes(props.initialSelectedId)
        ? props.initialSelectedId
        : (ids[0] ?? '');
    newId.value = nextCustomId(ids);
    filterText.value = '';
    detailOpen.value = Boolean(props.initialSelectedId && ids.includes(props.initialSelectedId));
  },
  { immediate: true },
);

watch(
  () => props.initialSelectedId,
  id => {
    if (id && mergedDefinitions.value[id]) {
      selectedId.value = id;
      filterText.value = '';
      detailOpen.value = true;
    } else if (props.paged) {
      detailOpen.value = false;
    }
  },
);

function nextCustomId(existing = allIds.value): string {
  const used = new Set(existing);
  for (let suffix = 1; ; suffix += 1) {
    const candidate = `custom-ability-entity-${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
}

/**
 * Ability-entity definitions cross the Vue editor/project-data boundary here.
 * JSON serialization deliberately unwraps nested reactive proxies, which
 * structuredClone cannot clone.
 */
function cloneProjectJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function updateDefinition(step: CombatStepDefinition): void {
  if (step.kind !== 'spawnAbilityEntity' || step.parameters.definition === undefined) return;
  selectedDefinitionHistory.commit(step.parameters.definition);
}

function addDefinition(): void {
  const id = newId.value.trim();
  if (id.length === 0 || allIds.value.includes(id)) return;
  history.commit(
    {
      ...draft.value,
      [id]: { lifetime: { kind: 'limited', durationSeconds: 10 } },
    },
    { path: '', objectId: id, operation: 'add' },
  );
  selectedId.value = id;
  creating.value = false;
  detailOpen.value = true;
  emit('selection-change', id);
  newId.value = nextCustomId([...allIds.value, id]);
}

function duplicateDefinition(): void {
  const definition = selectedDefinition.value;
  if (definition === undefined) return;
  const id = nextCustomId();
  history.commit(
    { ...draft.value, [id]: cloneProjectJson(definition) },
    { path: '', objectId: id, operation: 'duplicate' },
  );
  selectedId.value = id;
  detailOpen.value = true;
  emit('selection-change', id);
  newId.value = nextCustomId([...allIds.value, id]);
}

function removeOrResetDefinition(): void {
  const id = selectedId.value;
  if (draft.value[id] === undefined) return;
  const next = { ...draft.value };
  delete next[id];
  history.commit(next, {
    path: '',
    objectId: id,
    operation: props.baseDefinitions[id] ? 'reset' : 'remove',
  });
  if (props.baseDefinitions[id] === undefined)
    selectedId.value = Object.keys({ ...props.baseDefinitions, ...next }).sort()[0] ?? '';
  if (props.baseDefinitions[id] === undefined) detailOpen.value = false;
}

function revealReference(reference: OperatorDefinitionReference): void {
  if (props.paged) {
    emit('reveal-reference', reference);
    return;
  }
  if (reference.ownerKind === 'entity') {
    selectedId.value = reference.ownerId;
    detailOpen.value = true;
    filterText.value = '';
    return;
  }
  emit('reveal-reference', reference);
}

function save(): void {
  if (validationIssues.value.length > 0) return;
  emit('save', cloneProjectJson(draft.value));
}
</script>

<template>
  <section v-if="visible" ref="editorRoot" class="ability-entity-definitions-editor">
    <header v-if="!sharedHistory" class="definition-focused-header entity-workspace__heading">
      <div>
        <strong>{{ t('timeline.skillEditing.abilityEntityObjects') }}</strong>
        <span>选择定义只切换当前画布，不会打开新的面板。</span>
      </div>
      <EaButton
        type="button"
        class="definition-focused-back"
        size="sm"
        @click="emit('update:visible', false)"
      >
        ← 返回能力实体概览
      </EaButton>
    </header>
    <div class="entity-workspace" :class="{ 'entity-workspace--paged': paged }">
      <aside v-if="!paged || !detailOpen" class="entity-workspace__sidebar">
        <div class="entity-workspace__create">
          <EaButton
            v-if="!creating"
            ref="createButton"
            type="button"
            size="sm"
            @click="beginCreate"
          >
            ＋ 新增能力实体
          </EaButton>
          <div v-else class="entity-create-form" @keydown.esc.stop.prevent="cancelCreate">
            <label
              >定义 ID<input
                ref="newIdInput"
                v-model="newId"
                type="text"
                :aria-invalid="!!createError"
                :aria-describedby="createErrorId"
                @keydown.enter.stop.prevent="!$event.isComposing && addDefinition()"
            /></label>
            <p :id="createErrorId" role="status">
              {{ createError || '用于技能引用，与图标和显示名称无关。创建后进入定义图编辑。' }}
            </p>
            <div class="entity-create-actions">
              <EaButton
                type="button"
                variant="primary"
                size="sm"
                :disabled="!canAdd"
                @click="addDefinition"
              >
                创建并编辑
              </EaButton>
              <EaButton type="button" size="sm" @click="cancelCreate">取消</EaButton>
            </div>
          </div>
        </div>
        <input
          v-model="filterText"
          class="entity-workspace__search"
          type="search"
          :placeholder="t('timeline.skillEditing.abilityEntitySearchPlaceholder')"
        />
        <div class="entity-workspace__list">
          <div class="entity-workspace__group-heading">
            <span>{{ t('timeline.skillEditing.abilityEntityOperatorGroup') }}</span>
            <span>{{ filteredOperatorIds.length }}</span>
          </div>
          <button
            v-for="id in filteredOperatorIds"
            :key="id"
            type="button"
            class="entity-workspace__item"
            :class="{ active: id === selectedId && (!paged || detailOpen) }"
            :title="id"
            @click="openDefinition(id)"
          >
            <span class="entity-workspace__item-id">{{ id }}</span>
            <span v-if="!sharedHistory && draft[id]" class="entity-workspace__badge">
              {{
                baseDefinitions[id]
                  ? t('timeline.skillEditing.abilityEntityOverride')
                  : t('timeline.skillEditing.abilityEntityCustom')
              }}
            </span>
          </button>
          <div v-if="commonIds.length" class="entity-workspace__common">
            {{
              t('timeline.skillEditing.readonlyCommonAbilityEntity', {
                count: commonIds.length,
              })
            }}
            <div
              v-for="id in filteredCommonIds"
              :key="id"
              class="entity-workspace__common-id"
              :title="id"
            >
              {{ id }}
            </div>
          </div>
        </div>
      </aside>

      <main v-if="!paged || detailOpen" class="entity-workspace__editor">
        <template v-if="editingStep">
          <div class="entity-workspace__toolbar">
            <EaButton
              v-if="paged && !parentNavigation"
              type="button"
              size="sm"
              @click="detailOpen = false"
            >
              ← 返回能力实体列表
            </EaButton>
            <strong v-if="!parentNavigation">{{ selectedId }}</strong>
            <span v-else class="entity-workspace__kind">能力实体定义</span>
            <span v-if="selectedIsBase && !selectedIsOverride" class="entity-workspace__source">
              {{ t('timeline.skillEditing.abilityEntityGenerated') }}
            </span>
            <EaButton type="button" size="sm" @click="duplicateDefinition">
              {{ t('timeline.skillEditing.duplicateAbilityEntityObject') }}
            </EaButton>
            <EaButton
              v-if="selectedIsOverride"
              type="button"
              variant="danger"
              size="sm"
              :title="
                !selectedIsBase && selectedReferences.length > 0
                  ? `删除后保留 ${selectedReferences.length} 处引用，由定义检查报告缺失；可撤销`
                  : undefined
              "
              @click="removeOrResetDefinition"
            >
              {{
                selectedIsBase
                  ? t('timeline.skillEditing.resetAbilityEntityObject')
                  : t('timeline.skillEditing.deleteAbilityEntityObject')
              }}
            </EaButton>
          </div>
          <DefinitionReferenceList
            :key="selectedId"
            :references="selectedReferences"
            @reveal="revealReference"
          />
          <div class="entity-workspace__scroll">
            <AbilityEntityDefinitionGraphEditor
              fill-available
              :ability-entity-id="selectedId"
              :definition="selectedDefinition!"
              :skill-level="skillLevel"
              :shared-history="selectedDefinitionHistory"
              @update="
                updateDefinition({
                  kind: 'spawnAbilityEntity',
                  parameters: {
                    abilityEntityId: selectedId,
                    definition: $event,
                    dieWhenSourceDies: false,
                  },
                })
              "
            />
          </div>
        </template>
        <p v-else class="entity-workspace__empty">
          {{ t('timeline.skillEditing.noAbilityEntityObjects') }}
        </p>
      </main>
    </div>

    <div v-if="!sharedHistory" class="entity-workspace__footer">
      <span v-if="validationIssues.length" class="entity-workspace__error">
        {{ t('timeline.skillEditing.validationIssueCount', { count: validationIssues.length }) }}
      </span>
      <EaButton
        type="button"
        size="sm"
        :disabled="!history.canUndo.value"
        @click="history.restore('undo')"
      >
        撤销
      </EaButton>
      <EaButton
        type="button"
        size="sm"
        :disabled="!history.canRedo.value"
        @click="history.restore('redo')"
      >
        重做
      </EaButton>
      <span class="entity-workspace__footer-spacer" />
      <EaButton type="button" size="sm" @click="emit('update:visible', false)">
        {{ t('timeline.skillEditing.cancel') }}
      </EaButton>
      <EaButton variant="primary" type="button" size="sm" @click="save">
        {{ t('timeline.skillEditing.saveAbilityEntityObjects') }}
      </EaButton>
    </div>
  </section>
</template>

<style scoped>
.entity-workspace__kind {
  margin-right: auto;
  color: var(--ea-text-secondary);
  font-size: 12px;
}

.ability-entity-definitions-editor {
  display: flex;
  min-height: 0;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 10px;
}
.entity-workspace__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.entity-workspace__heading div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}
.entity-workspace__heading span {
  color: var(--ea-fg-muted);
  font-size: 12px;
}
.entity-workspace {
  display: grid;
  min-height: 0;
  flex: 1;
  grid-template-columns: var(--definition-outliner-width, clamp(180px, 15vw, 240px)) minmax(0, 1fr);
  gap: 0;
  overflow: hidden;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-workbench-panel);
}
.entity-workspace__sidebar {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 14px;
  overflow: hidden;
  border-right: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}
.entity-workspace.entity-workspace--paged {
  grid-template-columns: minmax(0, 1fr);
}
.entity-workspace--paged .entity-workspace__sidebar {
  border-right: 0;
}
.entity-workspace--paged .entity-workspace__create {
  max-width: 560px;
}
.entity-workspace__create {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}
.entity-workspace__create input {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
  padding: 7px;
}
.entity-create-form,
.entity-create-form label {
  display: grid;
  gap: 8px;
  font-size: 12px;
}
.entity-create-form p {
  margin: 0;
  color: var(--ea-text-secondary);
  line-height: 1.6;
}
.entity-create-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.entity-workspace__search {
  width: 100%;
  height: 34px;
  box-sizing: border-box;
  margin-bottom: 12px;
  padding: 0 10px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.entity-workspace__list {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  scrollbar-gutter: stable;
}
.entity-workspace__group-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 8px;
  color: var(--ea-fg-muted);
  font-size: 11px;
  text-transform: uppercase;
}
.entity-workspace__item {
  display: flex;
  width: 100%;
  min-height: 34px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ea-fg-secondary);
  text-align: left;
  cursor: pointer;
}
.entity-workspace__item-id {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.entity-workspace__item.active {
  border-color: var(--ea-gold);
  color: var(--ea-fg);
  background: var(--ea-fill-soft);
}
.entity-workspace__badge,
.entity-workspace__source {
  flex: none;
  color: var(--ea-gold);
  font-size: 11px;
}
.entity-workspace__common,
.entity-workspace__empty {
  color: var(--ea-fg-muted);
  font-size: 12px;
}
.entity-workspace__common {
  margin-top: 10px;
  padding: 10px 4px;
  border-top: 1px solid var(--ea-border-soft);
}
.entity-workspace__common-id {
  margin-top: 6px;
  overflow: hidden;
  color: var(--ea-fg-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.entity-workspace__editor {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}
.entity-workspace__toolbar,
.entity-workspace__footer {
  display: flex;
  align-items: center;
  gap: 8px;
}
.entity-workspace__toolbar {
  min-height: 52px;
  flex: none;
  padding: 0 16px;
  border-bottom: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}
.entity-workspace__toolbar strong {
  min-width: 0;
  margin-right: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.entity-workspace__scroll {
  min-height: 0;
  flex: 1;
  padding: 6px;
  overflow: hidden;
}
.entity-workspace__footer {
  justify-content: flex-end;
}
.entity-workspace__footer-spacer {
  flex: 1;
}
.entity-workspace__error {
  margin-right: auto;
  color: var(--el-color-danger);
}
@media (max-width: 760px) {
  .entity-workspace {
    grid-template-columns: 150px minmax(0, 1fr);
  }
  .entity-workspace__toolbar {
    min-height: 36px;
    padding: 0 8px;
  }
  .entity-workspace__heading span {
    display: none;
  }
}
:global(.ability-entity-definitions-dialog) {
  max-width: calc(100vw - 48px);
  margin-top: 4vh;
}
:global(.ability-entity-definitions-dialog .el-dialog__body) {
  padding: 0 16px;
  overflow: hidden;
}
</style>
