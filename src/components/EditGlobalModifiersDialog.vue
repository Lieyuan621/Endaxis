<script setup>
import { computed, onBeforeUnmount, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTimelineStore } from '@/stores/timelineStore';
import CustomNumberInput from '@/components/CustomNumberInput.vue';
import {
  GLOBAL_CONFIG_OPERATOR_STAT_CHOICES,
  createDefaultOperatorStatModifier,
  formatGlobalModifierLabel,
} from '@/data/globalConfig';

const COMMIT_DELAY_MS = 320;

const props = defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['update:visible']);

const store = useTimelineStore();
const { t } = useI18n({ useScope: 'global' });

const draft = reactive({
  modifiers: [],
});

let commitTimer = null;
let draftHydrated = false;

function isOperatorStat(mod) {
  return mod?.kind === 'operatorStat';
}

function clearCommitTimer() {
  if (commitTimer != null) {
    clearTimeout(commitTimer);
    commitTimer = null;
  }
}

function syncDraftFromStore() {
  const list = store.globalConfig?.customModifiers || [];
  draft.modifiers = JSON.parse(JSON.stringify(list.filter(isOperatorStat)));
  draftHydrated = true;
}

function commitDraftNow() {
  clearCommitTimer();
  if (!draftHydrated) return;
  store.setGlobalConfigCustomModifiers(
    JSON.parse(JSON.stringify(draft.modifiers.filter(isOperatorStat))),
  );
}

function scheduleCommit() {
  if (!draftHydrated) return;
  clearCommitTimer();
  commitTimer = setTimeout(() => {
    commitTimer = null;
    commitDraftNow();
  }, COMMIT_DELAY_MS);
}

function matchesOperatorChoice(mod, choice) {
  return (
    isOperatorStat(mod) &&
    mod.modifier === choice.modifier &&
    (mod.skillTypes || null) === (choice.skillTypes || null)
  );
}

const operatorGroups = computed(() =>
  GLOBAL_CONFIG_OPERATOR_STAT_CHOICES.map(choice => ({
    choice,
    entries: draft.modifiers.filter(mod => matchesOperatorChoice(mod, choice)),
  })),
);

function addOperatorEntry(choiceKey) {
  draft.modifiers.push(createDefaultOperatorStatModifier(choiceKey));
  scheduleCommit();
}

function removeModifier(id) {
  draft.modifiers = draft.modifiers.filter(m => m.id !== id);
  scheduleCommit();
}

function setModifierValue(id, raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return;
  draft.modifiers = draft.modifiers.map(m => (m.id === id ? { ...m, value: n } : m));
  scheduleCommit();
}

function valueKindOf(choice) {
  return choice?.valueKind || 'flat';
}

function inputStep(choice) {
  return valueKindOf(choice) === 'flat' ? 1 : 0.1;
}

function onVisible(next) {
  if (!next) commitDraftNow();
  emit('update:visible', next);
}

watch(
  () => props.visible,
  open => {
    if (open) {
      clearCommitTimer();
      syncDraftFromStore();
    } else {
      commitDraftNow();
    }
  },
);

onBeforeUnmount(() => {
  commitDraftNow();
});
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="440px"
    append-to-body
    align-center
    class="armory-dialog global-modifiers-dialog"
    @update:model-value="onVisible"
  >
    <template #header>
      <span class="dialog-title">{{ t('globalConfig.editCustomTitle') }}</span>
    </template>

    <div class="panel">
      <div class="blocks">
        <div
          v-for="group in operatorGroups"
          :key="group.choice.key"
          class="stat-block"
          :class="{ 'has-entries': group.entries.length > 0 }"
        >
          <div class="stat-block-head">
            <span class="label">{{
              formatGlobalModifierLabel(
                {
                  kind: 'operatorStat',
                  modifier: group.choice.modifier,
                  skillTypes: group.choice.skillTypes,
                },
                t,
              )
            }}</span>
            <button
              type="button"
              class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-gold add-btn"
              @click="addOperatorEntry(group.choice.key)"
            >
              {{ t('globalConfig.addEntry') }}
            </button>
          </div>
          <div v-if="group.entries.length > 0" class="stat-block-body">
            <div v-for="mod in group.entries" :key="mod.id" class="stat-entry">
              <span
                class="affix prefix"
                :aria-hidden="valueKindOf(group.choice) !== 'percentPlus'"
              >{{ valueKindOf(group.choice) === 'percentPlus' ? '+' : '' }}</span>
              <CustomNumberInput
                :model-value="mod.value"
                :step="inputStep(group.choice)"
                class="stat-input"
                @update:model-value="setModifierValue(mod.id, $event)"
              />
              <span
                class="affix unit"
                :aria-hidden="valueKindOf(group.choice) === 'flat'"
              >{{ valueKindOf(group.choice) === 'flat' ? '' : '%' }}</span>
              <button
                type="button"
                class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger remove-btn"
                @click="removeModifier(mod.id)"
              >
                {{ t('common.delete') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="footer">
        <button
          type="button"
          class="ea-btn ea-btn--sm ea-btn--glass-rect"
          @click="onVisible(false)"
        >
          {{ t('common.close') }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-title {
  font-size: 16px;
  font-weight: 600;
}
.panel {
  display: flex;
  flex-direction: column;
}
.blocks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stat-block {
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.03));
  border: 1px solid transparent;
}
.stat-block.has-entries {
  border-color: var(--ea-border-soft, rgba(255, 255, 255, 0.06));
}
.stat-block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
}
.label {
  min-width: 0;
  flex: 1;
  font-size: 13px;
  color: var(--ea-fg-secondary, rgba(255, 255, 255, 0.78));
}
.add-btn {
  flex-shrink: 0;
  min-width: 52px;
  padding-left: 0;
  padding-right: 0;
  justify-content: center;
}
.stat-block-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 10px 8px;
  border-top: 1px solid var(--ea-border-soft, rgba(255, 255, 255, 0.06));
}
.stat-entry {
  display: grid;
  grid-template-columns: 14px 96px 14px 52px;
  align-items: center;
  column-gap: 6px;
  margin-left: auto;
  width: max-content;
}
.affix {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--ea-fg-muted, rgba(255, 255, 255, 0.55));
  width: 14px;
  text-align: center;
}
:global(html[data-theme='light'] .global-modifiers-dialog .stat-block) {
  background: var(--ea-surface-sunken);
}
:global(html[data-theme='light'] .global-modifiers-dialog .stat-block.has-entries) {
  border-color: var(--ea-border);
}
:deep(.stat-input) {
  width: 96px !important;
  height: 26px !important;
  flex-shrink: 0;
}
.remove-btn {
  width: 52px;
  padding-left: 0;
  padding-right: 0;
  justify-content: center;
  white-space: nowrap;
}
.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

