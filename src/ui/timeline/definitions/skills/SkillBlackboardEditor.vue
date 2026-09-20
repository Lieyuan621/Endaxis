<script setup lang="ts">
import { ElIcon } from 'element-plus';
/**
 * 编辑技能每次释放时初始化的动作黑板。
 * 键是技能内部稳定身份；逐级数值显式编辑，不隐式补齐不存在的等级。
 */
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { CaretBottom, CaretRight } from '@element-plus/icons-vue';
import type { LevelValues } from '../../../../core/game-data/operatorDefinition';
import LevelValuesEditor from '../LevelValuesEditor.vue';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';

const props = defineProps<{
  blackboard: Readonly<Record<string, LevelValues>>;
  skillLevel: number;
  collapsible?: boolean;
  initiallyCollapsed?: boolean;
  title?: string;
  description?: string;
  newKeyPrefix?: string;
}>();
const emit = defineEmits<{ update: [blackboard: Readonly<Record<string, LevelValues>>] }>();
const { t } = useI18n({ useScope: 'global' });
const collapsed = ref(props.collapsible === true && props.initiallyCollapsed === true);

function entries(): readonly [string, LevelValues][] {
  return Object.entries(props.blackboard);
}

function addEntry(): void {
  let index = 1;
  const prefix = props.newKeyPrefix ?? 'value';
  while (`${prefix}${index}` in props.blackboard) index += 1;
  emit('update', { ...props.blackboard, [`${prefix}${index}`]: 0 });
}

function removeEntry(key: string): void {
  const next = { ...props.blackboard };
  delete next[key];
  emit('update', next);
}

function renameEntry(oldKey: string, event: Event): void {
  const newKey = (event.target as HTMLInputElement).value.trim();
  if (newKey.length === 0 || (newKey !== oldKey && newKey in props.blackboard)) return;
  const next: Record<string, LevelValues> = {};
  for (const [key, value] of entries()) next[key === oldKey ? newKey : key] = value;
  emit('update', next);
}

function setValue(key: string, value: LevelValues): void {
  emit('update', {
    ...props.blackboard,
    [key]: value,
  });
}
</script>

<template>
  <section class="editor-section">
    <div class="section-heading">
      <div class="blackboard-heading__title">
        <button
          v-if="collapsible"
          type="button"
          class="icon-button blackboard-heading__collapse"
          :aria-expanded="!collapsed"
          :title="
            t(collapsed ? 'timeline.skillEditing.expandStep' : 'timeline.skillEditing.collapseStep')
          "
          @click="collapsed = !collapsed"
        >
          <el-icon><CaretRight v-if="collapsed" /><CaretBottom v-else /></el-icon>
        </button>
        <h4>{{ title ?? t('timeline.skillEditing.initialBlackboard') }}</h4>
        <span class="blackboard-heading__count">{{ entries().length }}</span>
      </div>
      <button
        type="button"
        class="icon-button"
        :title="t('timeline.skillEditing.addBlackboardEntry')"
        @click="addEntry"
      >
        +
      </button>
    </div>
    <p v-if="!collapsed" class="skill-subsection-help">
      {{ description ?? t('timeline.skillEditing.blackboardDescription') }}
    </p>
    <div v-if="!collapsed && entries().length === 0" class="editor-empty">—</div>
    <div v-else-if="!collapsed" class="blackboard-list">
      <div
        v-for="([key, value], index) in entries()"
        :key="`${key}:${index}`"
        class="blackboard-entry"
      >
        <label>
          <EditorFieldLabel
            :label="t('timeline.skillEditing.blackboardKey')"
            :help="t('timeline.skillEditing.fieldHelp.initialBlackboardKey')"
          />
          <input type="text" :value="key" @change="renameEntry(key, $event)" />
        </label>
        <div class="blackboard-entry__values">
          <EditorFieldLabel
            :label="t('timeline.skillEditing.value')"
            :help="t('timeline.skillEditing.fieldHelp.initialBlackboardValue')"
          />
          <LevelValuesEditor
            :value="value"
            :current-level="skillLevel"
            @update="setValue(key, $event)"
          />
        </div>
        <button
          type="button"
          class="icon-button icon-button--danger"
          :title="t('timeline.skillEditing.deleteBlackboardEntry')"
          @click="removeEntry(key)"
        >
          ×
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.section-heading h4 {
  margin: 0;
}
.skill-subsection-help {
  margin: 0 0 14px;
  color: var(--ea-fg-muted);
  font-size: 11px;
}

.blackboard-heading__title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.blackboard-heading__title h4 {
  margin: 0;
}

.blackboard-heading__collapse {
  flex: none;
}

.blackboard-heading__count {
  min-width: 22px;
  padding: 2px 6px;
  background: var(--ea-active-fill);
  color: var(--ea-fg-muted);
  font-size: 11px;
  text-align: center;
}

.blackboard-list {
  display: grid;
  gap: 10px;
}

.blackboard-entry {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 30px;
  align-items: end;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--ea-border-soft);
}

.blackboard-entry label,
.blackboard-entry__values {
  display: grid;
  gap: 6px;
}

.blackboard-entry input {
  width: 100%;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  padding: 0 6px;
}
</style>
