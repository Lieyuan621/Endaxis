<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
import { EaButton } from '../../../../design-system/index';
import { computed, ref, watch } from 'vue';
import { useEditorHistoryShortcuts } from '../../../keyboard/useEditorHistoryShortcuts';
import {
  projectDefinitionHistory,
  type DefinitionDraftHistory,
  type DefinitionHistoryLocation,
} from '../useDefinitionDraftHistory';
import type { EquipmentContributionDefinition } from '../../../../core/game-data/equipmentDefinition';
import { cloneStructureValue } from '../skillStructureEditorCommands';
import type {
  CombatStepDefinition,
  OperatorBuffDefinitions,
  SkillBuffDefinition,
} from '../../../../core/game-data/operatorDefinition';
import BuffDefinitionGraphEditor from '../buffs/BuffDefinitionGraphEditor.vue';

type BuffStep = CombatStepForKind<'applyBuff'>;
const props = defineProps<{
  visible: boolean;
  contribution: EquipmentContributionDefinition;
  sharedHistory: DefinitionDraftHistory<EquipmentContributionDefinition>;
  manageKeyboard?: boolean;
  referenceRoot: unknown;
  level: number;
}>();
const emit = defineEmits<{
  'update:visible': [visible: boolean];
}>();

// 页面只读所属贡献，不另建保存范围或可写副本。
const draft = computed(() => props.contribution.buffDefinitions ?? {});
const history = props.sharedHistory;
const editorRoot = ref<HTMLElement | null>(null);
const selectedId = ref('');
const search = ref('');
function commitDefinitions(
  definitions: OperatorBuffDefinitions,
  location?: DefinitionHistoryLocation,
): void {
  const { buffDefinitions: _previous, ...rest } = props.contribution;
  history.commit(
    Object.keys(definitions).length ? { ...rest, buffDefinitions: definitions } : rest,
    location,
  );
}
const selectedHistory = projectDefinitionHistory<SkillBuffDefinition>(
  history,
  (value, location) => {
    commitDefinitions({ ...draft.value, [selectedId.value]: value }, location);
  },
  // objectId 留给外层效果索引；Buff 页身份不能覆盖它。
  () => ({ page: `buff:${selectedId.value}` }),
);
watch(
  () => history.restoredLocation?.value,
  location => {
    const id = location?.page?.startsWith('buff:') ? location.page.slice(5) : undefined;
    if (id) {
      selectedId.value = draft.value[id] ? id : (Object.keys(draft.value).sort()[0] ?? '');
      search.value = '';
    }
  },
  { flush: 'post', immediate: true },
);
useEditorHistoryShortcuts(editorRoot, history.restore, () => props.manageKeyboard === true);
const ids = computed(() => Object.keys(draft.value).sort());
const filteredIds = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  return ids.value.filter(id => id.toLocaleLowerCase().includes(query));
});
const selectedDefinition = computed(() => draft.value[selectedId.value]);
const selectedStep = computed<BuffStep | null>(() =>
  selectedDefinition.value === undefined
    ? null
    : {
        kind: 'applyBuff',
        parameters: {
          target: 'caster',
          buffId: selectedId.value,
          definition: selectedDefinition.value,
        },
      },
);
const references = computed(() => collectReferences(props.referenceRoot, selectedId.value));

watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    const page = history.restoredLocation?.value?.page;
    const id = page?.startsWith('buff:') ? page.slice(5) : '';
    selectedId.value = draft.value[id] ? id : (Object.keys(draft.value).sort()[0] ?? '');
    search.value = '';
  },
  { immediate: true },
);

function collectReferences(root: unknown, buffId: string): readonly string[] {
  if (buffId === '') return [];
  const paths: string[] = [];
  function visit(value: unknown, path: string): void {
    if (value === buffId) {
      paths.push(path);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${path}[${index}]`));
      return;
    }
    if (value === null || typeof value !== 'object') return;
    for (const [key, entry] of Object.entries(value)) {
      if (key === 'buffDefinitions') continue;
      visit(entry, path === '' ? key : `${path}.${key}`);
    }
  }
  visit(root, '');
  return paths;
}

function addBuff(): void {
  const existing = new Set(ids.value);
  let index = 1;
  while (existing.has(`custom-buff-${index}`)) index += 1;
  const id = `custom-buff-${index}`;
  commitDefinitions(
    {
      ...draft.value,
      [id]: { stackingType: 'refresh', durationSeconds: 10 },
    },
    { path: '', page: `buff:${id}`, operation: 'add' },
  );
  selectedId.value = id;
}

function removeBuff(): void {
  if (selectedId.value === '' || references.value.length > 0) return;
  const next = { ...draft.value };
  delete next[selectedId.value];
  commitDefinitions(next, { path: '', page: `buff:${selectedId.value}`, operation: 'remove' });
  selectedId.value = Object.keys(next).sort()[0] ?? '';
}

function updateBuffStep(step: CombatStepDefinition): void {
  if (step.kind !== 'applyBuff' || step.parameters.definition === undefined) return;
  selectedHistory.commit(cloneStructureValue(step.parameters.definition), { path: '' });
}
</script>

<template>
  <section v-if="visible" ref="editorRoot" class="embedded-editor">
    <div class="embedded-header">
      <div class="title">
        <strong>附属 Buff 定义</strong>
        <small>这些蓝图属于当前装备贡献；行为步骤只通过稳定 Buff ID 引用。</small>
      </div>
      <EaButton class="definition-focused-back" size="sm" @click="emit('update:visible', false)">
        ← 返回所属效果
      </EaButton>
    </div>
    <div class="workspace">
      <aside>
        <input v-model="search" placeholder="搜索 Buff…" />
        <button class="add" @click="addBuff">＋ 新增 Buff</button>
        <button
          v-for="id in filteredIds"
          :key="id"
          :class="{ active: selectedId === id }"
          @click="selectedId = id"
        >
          {{ id }}
        </button>
      </aside>
      <main v-if="selectedStep">
        <header>
          <div>
            <strong>{{ selectedId }}</strong
            ><small>当前贡献内稳定身份</small>
          </div>
          <button
            class="danger"
            :disabled="references.length > 0"
            :title="references.length > 0 ? '仍被当前贡献引用，不能删除' : '删除 Buff 定义'"
            @click="removeBuff"
          >
            删除
          </button>
        </header>
        <details v-if="references.length" class="references">
          <summary>{{ references.length }} 处引用</summary>
          <code v-for="path in references" :key="path">{{ path }}</code>
        </details>
        <BuffDefinitionGraphEditor
          :buff-id="selectedId"
          :definition="selectedDefinition!"
          :skill-level="level"
          :shared-history="selectedHistory"
          @update="
            updateBuffStep({
              kind: 'applyBuff',
              parameters: { target: 'caster', buffId: selectedId, definition: $event },
            })
          "
        />
      </main>
      <main v-else class="empty">当前贡献还没有附属 Buff。</main>
    </div>
    <div class="embedded-footer">
      <small>修改已进入所属定义草稿；由外层统一保存或取消。</small>
    </div>
  </section>
</template>

<style scoped>
.title {
  display: grid;
  gap: 4px;
}
.embedded-editor {
  min-width: 0;
}
.embedded-header,
.embedded-footer {
  padding: 10px 0;
}
.embedded-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.title small,
main header small {
  color: var(--ea-fg-muted);
}
.workspace {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: min(650px, calc(100vh - 210px));
  border: 1px solid var(--ea-border-soft);
}
aside {
  padding: 12px;
  border-right: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}
aside input,
aside button {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
aside input {
  height: 32px;
  margin-bottom: 8px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
aside button {
  padding: 9px;
  border: 0;
  border-left: 3px solid transparent;
  background: transparent;
  color: var(--ea-fg-secondary);
  text-align: left;
  overflow-wrap: anywhere;
  cursor: pointer;
}
aside button.active {
  border-left-color: var(--ea-gold);
  background: var(--ea-active-fill);
  color: var(--ea-gold);
}
aside .add {
  margin-bottom: 8px;
  border: 1px dashed var(--ea-border);
}
main {
  min-width: 0;
  padding: 14px;
  overflow: auto;
}
main > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
main header div {
  display: grid;
  gap: 3px;
}
.danger {
  border: 1px solid #684040;
  background: transparent;
  color: #e18d8d;
}
.danger:disabled {
  opacity: 0.4;
}
.references {
  margin-bottom: 10px;
  color: #e69a7a;
}
.references code {
  display: block;
  padding: 3px;
  overflow-wrap: anywhere;
}
.empty {
  display: grid;
  place-items: center;
  color: var(--ea-fg-muted);
}
@media (max-width: 760px) {
  .workspace {
    grid-template-columns: 1fr;
  }
  aside {
    max-height: 180px;
    overflow: auto;
    border-right: 0;
    border-bottom: 1px solid var(--ea-border-soft);
  }
}
</style>
