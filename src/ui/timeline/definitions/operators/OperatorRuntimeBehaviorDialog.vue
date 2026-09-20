<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { EaButton } from '../../../../design-system/index';
import { cloneStructureValue } from '../skillStructureEditorCommands';
import {
  SKILL_LEVEL_SOURCES,
  type ActionSequenceDefinition,
  type CombatStepDefinition,
  type OperatorEventHandlerDefinition,
  type OperatorPassiveSkillDefinition,
} from '../../../../core/game-data/operatorDefinition';
import {
  createSkillEditorStep,
  duplicateSkillEditorDetachedStep,
  type EditableCombatStepKind,
} from '../skills/skillDefinitionEditorViewModel';
import ActionSequenceWorkspace from '../actions/ActionSequenceWorkspace.vue';
import {
  useDefinitionPageDraft,
  projectDefinitionHistory,
  type DefinitionDraftHistory,
} from '../useDefinitionDraftHistory';
import type { OperatorRuntimeDraft } from './operatorRuntimeDraft';
import { useEditorHistoryShortcuts } from '../../../keyboard/useEditorHistoryShortcuts';
import DefinitionHistoryControls from '../DefinitionHistoryControls.vue';
import SkillBlackboardEditor from '../skills/SkillBlackboardEditor.vue';

const props = defineProps<{
  visible: boolean;
  fillAvailable?: boolean;
  passiveSkills?: readonly OperatorPassiveSkillDefinition[];
  eventHandlers?: readonly OperatorEventHandlerDefinition[];
  skillLevel: number;
  sharedHistory?: DefinitionDraftHistory<OperatorRuntimeDraft>;
}>();
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  save: [
    value: {
      passiveSkills?: readonly OperatorPassiveSkillDefinition[];
      eventHandlers?: readonly OperatorEventHandlerDefinition[];
    },
  ];
}>();

type Category = 'passiveSkills' | 'eventHandlers';
const category = ref<Category>('passiveSkills');
const selectedIndex = ref(0);
const structureRevision = ref(0);
const {
  draft,
  history,
  reset: resetDraft,
} = useDefinitionPageDraft<OperatorRuntimeDraft>(
  () => ({ passives: props.passiveSkills ?? [], handlers: props.eventHandlers ?? [] }),
  props.sharedHistory,
  () => ({ path: '', section: category.value, objectId: String(selectedIndex.value) }),
);
const passives = computed({
  get: () => draft.value.passives,
  set: value => {
    draft.value = { ...draft.value, passives: value };
  },
});
const handlers = computed({
  get: () => draft.value.handlers,
  set: value => {
    draft.value = { ...draft.value, handlers: value };
  },
});
const editorRoot = ref<HTMLElement | null>(null);
useEditorHistoryShortcuts(editorRoot, history.restore);
const sequenceHistory = projectDefinitionHistory<ActionSequenceDefinition>(
  history,
  updateSequence,
  () => ({ section: category.value, objectId: String(selectedIndex.value) }),
);
watch(
  () => history.restoredLocation?.value,
  location => {
    if (!location || (props.sharedHistory && location.page !== 'behavior')) return;
    const restoredCategory = props.sharedHistory ? location.runtimeCategory : location.section;
    if (restoredCategory) category.value = restoredCategory as Category;
    if (location.objectId !== undefined) selectedIndex.value = Number(location.objectId);
  },
  { flush: 'sync' },
);
const items = computed(() =>
  category.value === 'passiveSkills' ? passives.value : handlers.value,
);
const selectedPassive = computed(() =>
  category.value === 'passiveSkills' ? passives.value[selectedIndex.value] : undefined,
);
const selectedHandler = computed(() =>
  category.value === 'eventHandlers' ? handlers.value[selectedIndex.value] : undefined,
);
const selectedSequence = computed(
  () => selectedPassive.value?.enableSequence ?? selectedHandler.value?.sequence,
);

watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    resetDraft({
      passives: [...(props.passiveSkills ?? [])],
      handlers: [...(props.eventHandlers ?? [])],
    });
    const location = props.sharedHistory?.restoredLocation?.value;
    category.value =
      location?.page === 'behavior'
        ? (location.runtimeCategory ?? 'passiveSkills')
        : 'passiveSkills';
    selectedIndex.value = location?.page === 'behavior' ? Number(location.objectId ?? 0) : 0;
  },
  { immediate: true },
);

function syntheticSkill() {
  return {
    key: 'operator-runtime-behavior',
    timelineBlockFrames: 0,
    scheduledSequences: [{ startFrame: 0, sequence: selectedSequence.value ?? { steps: [] } }],
  };
}

function createStep(kind: EditableCombatStepKind): CombatStepDefinition {
  return createSkillEditorStep(syntheticSkill(), kind);
}

function duplicateStep(step: CombatStepDefinition): CombatStepDefinition {
  return duplicateSkillEditorDetachedStep(syntheticSkill(), step);
}

function addItem(): void {
  structureRevision.value++;
  if (category.value === 'passiveSkills') {
    const keys = new Set(passives.value.map(item => item.key));
    let index = 1;
    while (keys.has(`custom-passive-${index}`)) index += 1;
    passives.value = [
      ...passives.value,
      { key: `custom-passive-${index}`, enableSequence: { steps: [] } },
    ];
    selectedIndex.value = passives.value.length - 1;
    return;
  }
  const keys = new Set(handlers.value.map(item => item.key));
  let index = 1;
  while (keys.has(`custom-event-${index}`)) index += 1;
  handlers.value = [
    ...handlers.value,
    { key: `custom-event-${index}`, event: 'deckAttributesChanged', sequence: { steps: [] } },
  ];
  selectedIndex.value = handlers.value.length - 1;
}

function replaceSelected(
  value: OperatorPassiveSkillDefinition | OperatorEventHandlerDefinition,
): void {
  if (category.value === 'passiveSkills') {
    const next = [...passives.value];
    next[selectedIndex.value] = value as OperatorPassiveSkillDefinition;
    passives.value = next;
  } else {
    const next = [...handlers.value];
    next[selectedIndex.value] = value as OperatorEventHandlerDefinition;
    handlers.value = next;
  }
}

function updateKey(event: Event): void {
  const current = selectedPassive.value ?? selectedHandler.value;
  if (current === undefined) return;
  replaceSelected({ ...current, key: (event.target as HTMLInputElement).value });
}

function updatePassiveLevelSource(event: Event): void {
  const current = selectedPassive.value;
  if (current === undefined) return;
  const value = (event.target as HTMLSelectElement).value;
  if (value === '') {
    const { levelSource: _removed, ...next } = current;
    replaceSelected(next);
  } else
    replaceSelected({
      ...current,
      levelSource: value as OperatorPassiveSkillDefinition['levelSource'],
    });
}

function updatePassiveBlackboard(
  blackboard: NonNullable<OperatorPassiveSkillDefinition['blackboard']>,
): void {
  const current = selectedPassive.value;
  if (current === undefined) return;
  replaceSelected({
    ...current,
    blackboard: Object.keys(blackboard).length === 0 ? undefined : blackboard,
  });
}

function updateSequence(sequence: ActionSequenceDefinition): void {
  if (selectedPassive.value !== undefined)
    replaceSelected({ ...selectedPassive.value, enableSequence: sequence });
  else if (selectedHandler.value !== undefined)
    replaceSelected({ ...selectedHandler.value, sequence });
}

function moveItem(offset: -1 | 1): void {
  structureRevision.value++;
  const target = selectedIndex.value + offset;
  const source = category.value === 'passiveSkills' ? [...passives.value] : [...handlers.value];
  if (target < 0 || target >= source.length) return;
  [source[selectedIndex.value], source[target]] = [source[target]!, source[selectedIndex.value]!];
  if (category.value === 'passiveSkills')
    passives.value = source as OperatorPassiveSkillDefinition[];
  else handlers.value = source as OperatorEventHandlerDefinition[];
  selectedIndex.value = target;
}

function removeItem(): void {
  structureRevision.value++;
  if (category.value === 'passiveSkills')
    passives.value = passives.value.filter((_, index) => index !== selectedIndex.value);
  else handlers.value = handlers.value.filter((_, index) => index !== selectedIndex.value);
  selectedIndex.value = Math.max(0, Math.min(selectedIndex.value, items.value.length - 1));
}

function save(): void {
  emit('save', {
    passiveSkills: passives.value.length === 0 ? undefined : cloneStructureValue(passives.value),
    eventHandlers: handlers.value.length === 0 ? undefined : cloneStructureValue(handlers.value),
  });
  emit('update:visible', false);
}
</script>

<template>
  <section
    v-if="visible"
    ref="editorRoot"
    class="embedded-editor"
    :class="{ 'fill-available': fillAvailable }"
  >
    <div v-if="!sharedHistory" class="embedded-header">
      <EaButton class="definition-focused-back" size="sm" @click="emit('update:visible', false)">
        ← 返回角色级运行数据
      </EaButton>
      <div class="title">
        <strong>角色级行为</strong
        ><small>这些行为随角色进入战斗安装，不属于任何时间轴技能块。</small>
      </div>
    </div>
    <div class="workspace">
      <aside>
        <div class="category-tabs">
          <button
            :class="{ active: category === 'passiveSkills' }"
            @click="
              category = 'passiveSkills';
              selectedIndex = 0;
            "
          >
            基础被动
          </button>
          <button
            :class="{ active: category === 'eventHandlers' }"
            @click="
              category = 'eventHandlers';
              selectedIndex = 0;
            "
          >
            角色事件
          </button>
        </div>
        <button class="add" @click="addItem">＋ 新增</button>
        <button
          v-for="(item, index) in items"
          :key="`${item.key}:${index}`"
          :class="{ active: selectedIndex === index }"
          @click="selectedIndex = index"
        >
          {{ item.key }}
        </button>
      </aside>
      <main v-if="selectedPassive || selectedHandler">
        <header>
          <div>
            <strong>{{ selectedPassive ? '基础被动' : '角色事件响应' }}</strong
            ><small>{{ selectedPassive ? '角色创建时启用一次' : '监听角色级事件' }}</small>
          </div>
          <div class="actions">
            <button :disabled="selectedIndex === 0" @click="moveItem(-1)">上移</button
            ><button :disabled="selectedIndex === items.length - 1" @click="moveItem(1)">
              下移</button
            ><button class="danger" @click="removeItem">删除</button>
          </div>
        </header>
        <div class="fields">
          <label
            >稳定 key<input
              :value="selectedPassive?.key ?? selectedHandler?.key"
              @change="updateKey"
          /></label>
          <label v-if="selectedPassive"
            >等级来源<select
              :value="selectedPassive.levelSource ?? ''"
              @change="updatePassiveLevelSource"
            >
              <option value="">不绑定技能养成等级</option>
              <option v-for="value in SKILL_LEVEL_SOURCES" :key="value" :value="value">
                {{ value }}
              </option>
            </select></label
          >
          <label v-else
            >监听事件<input value="牌组属性变化" disabled /><small
              >当前角色级协议只定义此事件。</small
            ></label
          >
        </div>
        <SkillBlackboardEditor
          v-if="selectedPassive"
          :blackboard="selectedPassive.blackboard ?? {}"
          :skill-level="skillLevel"
          @update="updatePassiveBlackboard"
        />
        <section class="sequence-section">
          <header>
            <strong>{{ selectedPassive ? '启用序列' : '响应序列' }}</strong
            ><span>严格按列表顺序执行</span>
          </header>
          <ActionSequenceWorkspace
            class="behavior-sequence"
            :shared-history="sequenceHistory"
            :key="`${category}:${selectedIndex}:${structureRevision}`"
            :sequence="selectedSequence!"
            :skill-level="skillLevel"
            :create-step="createStep"
            :duplicate-step="duplicateStep"
            @update="updateSequence"
          />
        </section>
      </main>
      <main v-else class="empty">当前分类还没有角色级行为。</main>
    </div>
    <div v-if="!sharedHistory" class="embedded-footer">
      <DefinitionHistoryControls :history="history" />
      <EaButton size="sm" @click="emit('update:visible', false)"> 取消</EaButton
      ><EaButton variant="primary" size="sm" @click="save"> 保存角色级行为 </EaButton>
    </div>
  </section>
</template>

<style scoped>
.behavior-sequence {
  height: 520px;
  min-height: 380px;
  flex: none;
}
.title {
  display: grid;
  gap: 4px;
}
.embedded-editor {
  min-width: 0;
}
.embedded-header,
.embedded-footer {
  padding: 12px 0;
}
.embedded-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.title small,
main header small,
main header span,
label small {
  color: var(--ea-fg-muted);
}
.workspace {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: min(680px, calc(100vh - 200px));
  border: 1px solid var(--ea-border-soft);
}
aside {
  padding: 12px;
  border-right: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}
aside button {
  width: 100%;
  padding: 9px;
  border: 0;
  border-left: 3px solid transparent;
  background: transparent;
  color: var(--ea-fg-secondary);
  text-align: left;
  cursor: pointer;
  overflow-wrap: anywhere;
}
aside button.active {
  border-left-color: var(--ea-gold);
  color: var(--ea-gold);
  background: var(--ea-active-fill);
}
.category-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-bottom: 8px;
}
.category-tabs button {
  border: 1px solid var(--ea-border);
  text-align: center;
}
aside .add {
  margin-bottom: 8px;
  border: 1px dashed var(--ea-border);
}
main {
  min-width: 0;
  padding: 16px;
  overflow: auto;
}
main > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}
main > header div:first-child {
  display: grid;
  gap: 3px;
}
.actions {
  display: flex;
  gap: 5px;
}
.actions button {
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg-secondary);
}
.actions .danger {
  color: #e69a7a;
}
.actions button:disabled {
  opacity: 0.4;
}
.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
label {
  display: grid;
  gap: 6px;
  color: var(--ea-fg-muted);
  font-size: 11px;
}
input,
select {
  min-width: 0;
  height: 32px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
.sequence-section {
  margin-top: 18px;
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 14px;
}
.sequence-section > header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.empty {
  display: grid;
  place-items: center;
  color: var(--ea-fg-muted);
}
@media (max-width: 800px) {
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
<style scoped src="../behaviorDefinitionWorkspace.css"></style>
