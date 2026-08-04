<script setup>
import { onBeforeUnmount, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTimelineStore } from '@/stores/timelineStore';
import CustomNumberInput from '@/components/CustomNumberInput.vue';
import './armory/armoryDialogTheme.css';

const ENEMY_RESISTANCE_ELEMENTS = ['physical', 'heat', 'cryo', 'electric', 'nature'];
const COMMIT_DELAY_MS = 320;

const props = defineProps({
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['update:visible']);

const store = useTimelineStore();
const { t } = useI18n({ useScope: 'global' });

const draft = reactive({
  enemyHp: 1,
  maxStagger: 1,
  staggerNodeCount: 0,
  staggerNodeDuration: 0,
  staggerBreakDuration: 0,
  executionRecovery: 0,
  superArmor: 0,
  resistance: {
    physical: 0,
    heat: 0,
    cryo: 0,
    electric: 0,
    nature: 0,
  },
});

let commitTimer = null;
/** Only commit after syncing from store — placeholder draft defaults must not overwrite. */
let draftHydrated = false;

function getTypeColor(typeKey) {
  return store.getColor?.(typeKey) || '#aaaaaa';
}

function clearCommitTimer() {
  if (commitTimer != null) {
    clearTimeout(commitTimer);
    commitTimer = null;
  }
}

function syncDraftFromStore() {
  const sc = store.systemConstants;
  const res = sc.resistance || {};
  draft.enemyHp = Math.max(1, Number(sc.enemyHp) || 1);
  draft.maxStagger = Math.max(1, Number(sc.maxStagger) || 1);
  draft.staggerNodeCount = Math.max(0, Number(sc.staggerNodeCount) || 0);
  draft.staggerNodeDuration = Number(sc.staggerNodeDuration) || 0;
  draft.staggerBreakDuration = Number(sc.staggerBreakDuration) || 0;
  draft.executionRecovery = Math.max(0, Number(sc.executionRecovery) || 0);
  draft.superArmor = Math.max(0, Number(sc.superArmor) || 0);
  for (const el of ENEMY_RESISTANCE_ELEMENTS) {
    draft.resistance[el] = Math.max(0, Number(res[el]) || 0);
  }
  draftHydrated = true;
}

function commitDraftNow() {
  clearCommitTimer();
  if (!draftHydrated) return;
  const sc = store.systemConstants;
  sc.enemyHp = Math.max(1, Number(draft.enemyHp) || 1);
  sc.maxStagger = Math.max(1, Number(draft.maxStagger) || 1);
  sc.staggerNodeCount = Math.max(0, Number(draft.staggerNodeCount) || 0);
  sc.staggerNodeDuration = Number(draft.staggerNodeDuration) || 0;
  sc.staggerBreakDuration = Number(draft.staggerBreakDuration) || 0;
  sc.executionRecovery = Math.max(0, Number(draft.executionRecovery) || 0);
  sc.superArmor = Math.max(0, Number(draft.superArmor) || 0);
  if (!sc.resistance) sc.resistance = {};
  for (const el of ENEMY_RESISTANCE_ELEMENTS) {
    sc.resistance[el] = Math.max(0, Number(draft.resistance[el]) || 0);
  }
}

function scheduleCommit() {
  if (!draftHydrated) return;
  clearCommitTimer();
  commitTimer = setTimeout(() => {
    commitTimer = null;
    commitDraftNow();
  }, COMMIT_DELAY_MS);
}

function setScalar(key, raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return;
  draft[key] = n;
  scheduleCommit();
}

function setResistance(element, raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return;
  draft.resistance[element] = n;
  scheduleCommit();
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
    class="armory-dialog enemy-base-stats-dialog"
    @update:model-value="onVisible"
  >
    <template #header>
      <span class="dialog-title">{{ t('resourceMonitor.enemy.editStatsTitle') }}</span>
    </template>

    <div class="panel">
      <div class="section">
        <div class="section-title">{{ t('resourceMonitor.sections.enemy') }}</div>
        <div class="rows">
          <div class="row">
            <span class="label">{{ t('resourceMonitor.labels.enemyHp') }}</span>
            <CustomNumberInput
              :model-value="draft.enemyHp"
              :min="1"
              active-color="#ff7875"
              class="stat-input"
              @update:model-value="setScalar('enemyHp', $event)"
            />
          </div>
          <div class="row">
            <span class="label">{{ t('resourceMonitor.labels.maxStagger') }}</span>
            <CustomNumberInput
              :model-value="draft.maxStagger"
              :min="1"
              active-color="#ff9c6e"
              class="stat-input"
              @update:model-value="setScalar('maxStagger', $event)"
            />
          </div>
          <div class="row">
            <span class="label">{{ t('resourceMonitor.labels.staggerNodes') }}</span>
            <CustomNumberInput
              :model-value="draft.staggerNodeCount"
              :min="0"
              class="stat-input"
              @update:model-value="setScalar('staggerNodeCount', $event)"
            />
          </div>
          <div class="row">
            <span class="label">{{ t('resourceMonitor.labels.nodeDuration') }}</span>
            <CustomNumberInput
              :model-value="draft.staggerNodeDuration"
              :step="0.1"
              active-color="#ff9c6e"
              class="stat-input"
              @update:model-value="setScalar('staggerNodeDuration', $event)"
            />
          </div>
          <div class="row">
            <span class="label">{{ t('resourceMonitor.labels.breakDuration') }}</span>
            <CustomNumberInput
              :model-value="draft.staggerBreakDuration"
              :step="0.5"
              active-color="#ff9c6e"
              class="stat-input"
              @update:model-value="setScalar('staggerBreakDuration', $event)"
            />
          </div>
          <div class="row">
            <span class="label">{{ t('resourceMonitor.labels.executionRecovery') }}</span>
            <CustomNumberInput
              :model-value="draft.executionRecovery"
              :min="0"
              class="stat-input"
              @update:model-value="setScalar('executionRecovery', $event)"
            />
          </div>
          <div class="row">
            <span class="label">{{ t('resourceMonitor.labels.superArmor') }}</span>
            <CustomNumberInput
              :model-value="draft.superArmor"
              :min="0"
              class="stat-input"
              @update:model-value="setScalar('superArmor', $event)"
            />
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">{{ t('resourceMonitor.labels.resistanceTitle') }}</div>
        <div class="rows">
          <div v-for="element in ENEMY_RESISTANCE_ELEMENTS" :key="element" class="row">
            <span class="label" :style="{ color: getTypeColor(element) }">
              {{ t(`resourceMonitor.resistance.${element}`) }}
            </span>
            <CustomNumberInput
              :model-value="draft.resistance[element]"
              :min="0"
              :step="1"
              :active-color="getTypeColor(element)"
              class="stat-input"
              @update:model-value="setResistance(element, $event)"
            />
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
  gap: 18px;
}
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ea-fg-secondary, rgba(255, 255, 255, 0.72));
  margin-bottom: 10px;
  letter-spacing: 0.02em;
}
.rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 0;
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--ea-border-soft, transparent);
}
.label {
  min-width: 0;
  flex: 1;
  font-size: 13px;
  color: var(--ea-fg-secondary, rgba(255, 255, 255, 0.78));
}
:global(html[data-theme='light'] .enemy-base-stats-dialog .row) {
  background: var(--ea-surface-row);
  border-color: var(--ea-border);
}
:deep(.stat-input) {
  width: 88px !important;
  height: 26px !important;
  flex-shrink: 0;
}
.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
