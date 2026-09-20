<script setup lang="ts">
import AbilityEventOptions from '../actions/AbilityEventOptions.vue';
import { EaButton } from '../../../../design-system/index';
import { computed, ref, watch } from 'vue';
import {
  useDefinitionPageDraft,
  projectDefinitionHistory,
  type DefinitionDraftHistory,
} from '../useDefinitionDraftHistory';
import { useEditorHistoryShortcuts } from '../../../keyboard/useEditorHistoryShortcuts';
import DefinitionHistoryControls from '../DefinitionHistoryControls.vue';
import { cloneStructureValue } from '../skillStructureEditorCommands';
import {
  ABILITY_EVENTS,
  type ActionSequenceDefinition,
  type CombatStepDefinition,
  type ComboSkillConditionDefinition,
} from '../../../../core/game-data/operatorDefinition';
import {
  createSkillEditorStep,
  duplicateSkillEditorDetachedStep,
  type EditableCombatStepKind,
} from '../skills/skillDefinitionEditorViewModel';
import ActionSequenceWorkspace from '../actions/ActionSequenceWorkspace.vue';

const props = defineProps<{
  visible: boolean;
  fillAvailable?: boolean;
  conditions?: readonly ComboSkillConditionDefinition[];
  skillKeys: readonly string[];
  skillLevel: number;
  sharedHistory?: DefinitionDraftHistory<readonly ComboSkillConditionDefinition[]>;
}>();
const emit = defineEmits<{
  'update:visible': [visible: boolean];
  save: [value: { conditions?: readonly ComboSkillConditionDefinition[] }];
}>();
const selectedIndex = ref(0);
const structureRevision = ref(0);
const {
  draft: conditions,
  history,
  reset: resetConditions,
} = useDefinitionPageDraft<readonly ComboSkillConditionDefinition[]>(
  () => props.conditions ?? [],
  props.sharedHistory,
  () => ({ path: '', objectId: String(selectedIndex.value) }),
);
const editorRoot = ref<HTMLElement | null>(null);
useEditorHistoryShortcuts(editorRoot, history.restore);
const sequenceHistory = projectDefinitionHistory<ActionSequenceDefinition>(
  history,
  updateSequence,
  () => ({ objectId: String(selectedIndex.value) }),
);
watch(
  () => history.restoredLocation?.value,
  location => {
    if (!location || (props.sharedHistory && location.page !== 'combo')) return;

    if (location.objectId !== undefined) selectedIndex.value = Number(location.objectId);
  },
  { flush: 'post', immediate: true },
);
const selectedCondition = computed(() => conditions.value[selectedIndex.value]);

watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    resetConditions([...(props.conditions ?? [])]);
    const location = props.sharedHistory?.restoredLocation?.value;
    selectedIndex.value = location?.page === 'combo' ? Number(location.objectId ?? 0) : 0;
  },
  { immediate: true },
);
function syntheticSkill() {
  return {
    key: 'operator-combo-condition',
    timelineBlockFrames: 0,
    scheduledSequences: [
      { startFrame: 0, sequence: selectedCondition.value?.sequence ?? { steps: [] } },
    ],
  };
}
function createStep(kind: EditableCombatStepKind): CombatStepDefinition {
  return createSkillEditorStep(syntheticSkill(), kind);
}
function duplicateStep(step: CombatStepDefinition): CombatStepDefinition {
  return duplicateSkillEditorDetachedStep(syntheticSkill(), step);
}
function addCondition(): void {
  structureRevision.value++;
  const keys = new Set(conditions.value.map(value => value.key));
  let index = 1;
  while (keys.has(`custom-combo-condition-${index}`)) index += 1;
  conditions.value = [
    ...conditions.value,
    {
      key: `custom-combo-condition-${index}`,
      skillKey: props.skillKeys[0] ?? '',
      event: ABILITY_EVENTS[0],
      immediately: false,
      initialValues: {},
      sequence: { steps: [] },
    },
  ];
  selectedIndex.value = conditions.value.length - 1;
}
function updateCondition(value: ComboSkillConditionDefinition): void {
  const next = [...conditions.value];
  next[selectedIndex.value] = value;
  conditions.value = next;
}
function updateSequence(sequence: ActionSequenceDefinition): void {
  if (selectedCondition.value) updateCondition({ ...selectedCondition.value, sequence });
}
function addInitialValue(): void {
  if (!selectedCondition.value) return;
  const values = { ...(selectedCondition.value.initialValues ?? {}) };
  let index = 1;
  while (`value${index}` in values) index += 1;
  values[`value${index}`] = 0;
  updateCondition({ ...selectedCondition.value, initialValues: values });
}
function renameInitialValue(oldKey: string, event: Event): void {
  if (!selectedCondition.value?.initialValues) return;
  const key = (event.target as HTMLInputElement).value.trim();
  if (!key || (key !== oldKey && key in selectedCondition.value.initialValues)) return;
  updateCondition({
    ...selectedCondition.value,
    initialValues: Object.fromEntries(
      Object.entries(selectedCondition.value.initialValues).map(([entryKey, value]) => [
        entryKey === oldKey ? key : entryKey,
        value,
      ]),
    ),
  });
}
function updateInitialValue(key: string, event: Event): void {
  if (!selectedCondition.value?.initialValues) return;
  const raw = (event.target as HTMLInputElement).value;
  const current = selectedCondition.value.initialValues[key];
  const value =
    current === null
      ? null
      : typeof current === 'number' && Number.isFinite(Number(raw))
        ? Number(raw)
        : raw;
  updateCondition({
    ...selectedCondition.value,
    initialValues: { ...selectedCondition.value.initialValues, [key]: value },
  });
}
function cycleInitialValueType(key: string): void {
  if (!selectedCondition.value?.initialValues) return;
  const current = selectedCondition.value.initialValues[key];
  const value = current === null ? 0 : typeof current === 'number' ? String(current) : null;
  updateCondition({
    ...selectedCondition.value,
    initialValues: { ...selectedCondition.value.initialValues, [key]: value },
  });
}
function removeInitialValue(key: string): void {
  if (!selectedCondition.value?.initialValues) return;
  const values = { ...selectedCondition.value.initialValues };
  delete values[key];
  updateCondition({ ...selectedCondition.value, initialValues: values });
}
function moveCondition(offset: -1 | 1): void {
  structureRevision.value++;
  const target = selectedIndex.value + offset;
  if (target < 0 || target >= conditions.value.length) return;
  const next = [...conditions.value];
  [next[selectedIndex.value], next[target]] = [next[target]!, next[selectedIndex.value]!];
  conditions.value = next;
  selectedIndex.value = target;
}
function removeCondition(): void {
  structureRevision.value++;
  conditions.value = conditions.value.filter((_, index) => index !== selectedIndex.value);
  selectedIndex.value = Math.max(0, Math.min(selectedIndex.value, conditions.value.length - 1));
}
function save(): void {
  emit('save', {
    conditions: conditions.value.length ? cloneStructureValue(conditions.value) : undefined,
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
    <div class="embedded-header title">
      <EaButton class="definition-focused-back" size="sm" @click="emit('update:visible', false)">
        ← 返回角色级运行数据
      </EaButton>
      <strong>角色原生连携条件</strong>
      <small>条件来自角色模板，统一使用战斗事件、上下文条件与动作序列。</small>
    </div>
    <div class="workspace">
      <aside>
        <button class="add" @click="addCondition">＋ 新增条件</button>
        <button
          v-for="(condition, index) in conditions"
          :key="condition.key"
          :class="{ active: selectedIndex === index }"
          @click="selectedIndex = index"
        >
          {{ condition.key }}
        </button>
      </aside>
      <main v-if="selectedCondition">
        <header>
          <div>
            <strong>附着事件常驻条件</strong
            ><small>角色进入战斗时安装一次，不按技能块重复安装。</small>
          </div>
          <div class="actions">
            <button :disabled="selectedIndex === 0" @click="moveCondition(-1)">上移</button>
            <button :disabled="selectedIndex === conditions.length - 1" @click="moveCondition(1)">
              下移
            </button>
            <button class="danger" @click="removeCondition">删除</button>
          </div>
        </header>
        <div class="fields">
          <label
            >稳定 key<input
              :value="selectedCondition.key"
              @change="
                updateCondition({
                  ...selectedCondition,
                  key: ($event.target as HTMLInputElement).value,
                })
              "
          /></label>
          <label
            >绑定具体技能<select
              :value="selectedCondition.skillKey"
              @change="
                updateCondition({
                  ...selectedCondition,
                  skillKey: ($event.target as HTMLSelectElement).value,
                })
              "
            >
              <option v-for="key in skillKeys" :key="key" :value="key">{{ key }}</option>
            </select></label
          >
          <label
            >监听事件<select
              :value="selectedCondition.event"
              @change="
                updateCondition({
                  ...selectedCondition,
                  event: ($event.target as HTMLSelectElement)
                    .value as ComboSkillConditionDefinition['event'],
                })
              "
            >
              <AbilityEventOptions
                :events="ABILITY_EVENTS"
                :current="selectedCondition.event"
              /></select
          ></label>
          <label class="checkbox-field"
            ><input
              type="checkbox"
              :checked="selectedCondition.initialValues !== null"
              @change="
                updateCondition({
                  ...selectedCondition,
                  initialValues: ($event.target as HTMLInputElement).checked ? {} : null,
                })
              "
            />启用此常驻条件</label
          >
        </div>
        <section v-if="selectedCondition.initialValues !== null" class="literal-board">
          <header>
            <strong>每次注册复制的字面黑板</strong><button @click="addInitialValue">＋ 添加</button>
          </header>
          <div
            v-for="([key, value], index) in Object.entries(selectedCondition.initialValues)"
            :key="`${key}:${index}`"
            class="literal-row"
          >
            <input :value="key" @change="renameInitialValue(key, $event)" />
            <input
              :value="value ?? ''"
              :disabled="value === null"
              @change="updateInitialValue(key, $event)"
            />
            <button @click="cycleInitialValueType(key)">
              {{ value === null ? '空值' : typeof value === 'number' ? '数值' : '文本' }}
            </button>
            <button class="danger" @click="removeInitialValue(key)">×</button>
          </div>
        </section>
        <ActionSequenceWorkspace
          class="behavior-sequence"
          :shared-history="sequenceHistory"
          :key="`${selectedIndex}:${structureRevision}`"
          :sequence="selectedCondition.sequence"
          :skill-level="skillLevel"
          :create-step="createStep"
          :duplicate-step="duplicateStep"
          @update="updateSequence"
        />
      </main>
      <main v-else class="empty">当前干员没有连携条件。</main>
    </div>
    <div v-if="!sharedHistory" class="embedded-footer">
      <DefinitionHistoryControls :history="history" />
      <EaButton size="sm" @click="emit('update:visible', false)"> 取消 </EaButton>
      <EaButton variant="primary" size="sm" @click="save"> 保存连携条件 </EaButton>
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
  padding: 10px 0;
}
.embedded-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.title small,
header small,
label {
  color: var(--ea-fg-muted);
}
.workspace {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  min-height: min(720px, calc(100vh - 190px));
  border: 1px solid var(--ea-border-soft);
}
aside {
  padding: 12px;
  overflow: auto;
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
}
aside button.active {
  border-left-color: var(--ea-gold);
  background: var(--ea-active-fill);
  color: var(--ea-gold);
}
aside .add {
  margin-bottom: 9px;
  border: 1px dashed var(--ea-border);
}
main {
  min-width: 0;
  padding: 16px;
  overflow: auto;
}
main > header,
.literal-board > header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}
main > header > div:first-child {
  display: grid;
  gap: 3px;
}
.actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.actions button,
.literal-board button {
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg-secondary);
}
.actions .danger,
.literal-row .danger {
  color: #e69a7a;
}
.actions button:disabled {
  opacity: 0.4;
}
.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
label {
  display: grid;
  gap: 6px;
  font-size: 11px;
}
.checkbox-field {
  display: flex;
  align-items: center;
}
input,
select {
  min-width: 0;
  height: 32px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
.checkbox-field input {
  width: auto;
  height: auto;
}
.literal-board {
  margin: 16px 0;
  padding-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
}
.literal-row {
  display: grid;
  grid-template-columns: 1fr 1fr 60px 30px;
  gap: 5px;
  margin: 6px 0;
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
    border-right: 0;
    border-bottom: 1px solid var(--ea-border-soft);
  }
  .fields {
    grid-template-columns: 1fr;
  }
}
</style>
<style scoped src="../behaviorDefinitionWorkspace.css"></style>
