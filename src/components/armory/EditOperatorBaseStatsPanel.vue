<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getBaseStatValues } from '@/data/stats/baseValues';
import { useOperatorStore } from '@/stores/operatorStore';
import './armoryDialogTheme.css';

const ATTR_KEYS = ['strength', 'agility', 'intellect', 'will'];
const COMMIT_DELAY_MS = 320;

const INTRINSIC_DEFAULTS = {
  critRate: 0.05,
  critDmg: 0.5,
  artsIntensity: 0,
  ultimateGainEfficiency: 0,
  defense: 0,
  comboCdReductionPercent: 0,
};

const props = defineProps({
  instance: { type: Object, default: null },
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['update:visible']);

const operatorStore = useOperatorStore();
const { t } = useI18n();

const ATTR_ICON = {
  strength: '/icons/icon_attribute_str.webp',
  agility: '/icons/icon_attribute_agi.webp',
  intellect: '/icons/icon_attribute_wisd.webp',
  will: '/icons/icon_attribute_will.webp',
};

/** Local draft so typing does not hit store/timeline every keystroke. */
const draft = ref({});
let commitTimer = null;

const sheetDefaults = computed(() => {
  if (!props.instance) return null;
  const { baseStatOverrides: _ignored, ...rest } = props.instance;
  return getBaseStatValues(rest);
});

function syncDraftFromStore() {
  draft.value = { ...(props.instance?.baseStatOverrides ?? {}) };
}

function clearCommitTimer() {
  if (commitTimer != null) {
    clearTimeout(commitTimer);
    commitTimer = null;
  }
}

function cleanOverrides(next) {
  const cleaned = {};
  for (const [k, v] of Object.entries(next)) {
    if (v == null || !Number.isFinite(Number(v))) continue;
    cleaned[k] = Number(v);
  }
  return cleaned;
}

function commitDraftNow() {
  clearCommitTimer();
  if (!props.instance) return;
  const cleaned = cleanOverrides(draft.value);
  operatorStore.updateOperator(props.instance.id, {
    baseStatOverrides: Object.keys(cleaned).length ? cleaned : undefined,
  });
}

function scheduleCommit() {
  clearCommitTimer();
  commitTimer = setTimeout(() => {
    commitTimer = null;
    commitDraftNow();
  }, COMMIT_DELAY_MS);
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

watch(
  () => props.instance?.id,
  () => {
    if (props.visible) {
      clearCommitTimer();
      syncDraftFromStore();
    }
  },
);

onBeforeUnmount(() => {
  commitDraftNow();
});

function isOverridden(key) {
  return draft.value[key] != null;
}

function attrDisplayValue(key) {
  if (isOverridden(key)) return Number(draft.value[key]) || 0;
  return Number(sheetDefaults.value?.baseAttrs?.[key]) || 0;
}

function baseAtkDisplay() {
  if (isOverridden('baseAtk')) return Number(draft.value.baseAtk) || 0;
  return Number(sheetDefaults.value?.baseAtk) || 0;
}

function baseHpDisplay() {
  if (isOverridden('baseHp')) return Number(draft.value.baseHp) || 0;
  return Number(sheetDefaults.value?.baseHp) || 0;
}

function intrinsicDisplay(key) {
  if (isOverridden(key)) return Number(draft.value[key]) || 0;
  return INTRINSIC_DEFAULTS[key] ?? 0;
}

function setOverride(key, raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return;
  draft.value = { ...draft.value, [key]: n };
  scheduleCommit();
}

function clearOverride(key) {
  const next = { ...draft.value };
  delete next[key];
  draft.value = next;
  commitDraftNow();
}

function clearAll() {
  draft.value = {};
  commitDraftNow();
}

function onDialogVisible(next) {
  if (!next) commitDraftNow();
  emit('update:visible', next);
}

const hasAnyOverride = computed(() => Object.keys(draft.value).length > 0);

function pctInputValue(decimal) {
  return Number(((Number(decimal) || 0) * 100).toFixed(2));
}

function setCritPct(key, pctRaw) {
  const pct = Number(pctRaw);
  if (!Number.isFinite(pct)) return;
  setOverride(key, pct / 100);
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="520px"
    append-to-body
    class="armory-dialog base-stats-dialog"
    @update:model-value="onDialogVisible"
  >
    <template #header>
      <span class="dialog-title">{{ t('armory.baseStats.title') }}</span>
    </template>

    <template v-if="instance && sheetDefaults">
      <div class="panel">
        <div class="section">
          <div class="section-title">{{ t('statDetail.attributes') }}</div>
          <div class="rows">
            <div
              v-for="key in ATTR_KEYS"
              :key="key"
              class="row"
              :class="{ overridden: isOverridden(key) }"
            >
              <div class="label">
                <img :src="ATTR_ICON[key]" class="attr-icon" alt="" />
                <span>{{ t(`stats.${key}`) }}</span>
              </div>
              <div class="controls">
                <span class="affix prefix" aria-hidden="true" />
                <el-input-number
                  :model-value="attrDisplayValue(key)"
                  :min="0"
                  :step="1"
                  :controls="false"
                  size="small"
                  class="num-input"
                  @update:model-value="setOverride(key, $event)"
                />
                <span class="affix unit" aria-hidden="true" />
                <button
                  class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger reset-btn"
                  type="button"
                  :class="{ invisible: !isOverridden(key) }"
                  :tabindex="isOverridden(key) ? 0 : -1"
                  :aria-hidden="!isOverridden(key)"
                  @click="clearOverride(key)"
                >
                  {{ t('armory.baseStats.resetOne') }}
                </button>
              </div>
            </div>

            <div class="row" :class="{ overridden: isOverridden('baseAtk') }">
              <div class="label">
                <span>{{ t('statDetail.baseAtk') }}</span>
              </div>
              <div class="controls">
                <span class="affix prefix" aria-hidden="true" />
                <el-input-number
                  :model-value="baseAtkDisplay()"
                  :min="0"
                  :step="1"
                  :controls="false"
                  size="small"
                  class="num-input"
                  @update:model-value="setOverride('baseAtk', $event)"
                />
                <span class="affix unit" aria-hidden="true" />
                <button
                  class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger reset-btn"
                  type="button"
                  :class="{ invisible: !isOverridden('baseAtk') }"
                  :tabindex="isOverridden('baseAtk') ? 0 : -1"
                  :aria-hidden="!isOverridden('baseAtk')"
                  @click="clearOverride('baseAtk')"
                >
                  {{ t('armory.baseStats.resetOne') }}
                </button>
              </div>
            </div>

            <div class="row" :class="{ overridden: isOverridden('baseHp') }">
              <div class="label">
                <span>{{ t('statDetail.baseHp') }}</span>
              </div>
              <div class="controls">
                <span class="affix prefix" aria-hidden="true" />
                <el-input-number
                  :model-value="baseHpDisplay()"
                  :min="0"
                  :step="1"
                  :controls="false"
                  size="small"
                  class="num-input"
                  @update:model-value="setOverride('baseHp', $event)"
                />
                <span class="affix unit" aria-hidden="true" />
                <button
                  class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger reset-btn"
                  type="button"
                  :class="{ invisible: !isOverridden('baseHp') }"
                  :tabindex="isOverridden('baseHp') ? 0 : -1"
                  :aria-hidden="!isOverridden('baseHp')"
                  @click="clearOverride('baseHp')"
                >
                  {{ t('armory.baseStats.resetOne') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">{{ t('statDetail.stats') }}</div>
          <div class="rows">
            <div class="row" :class="{ overridden: isOverridden('critRate') }">
              <div class="label">
                <span>{{ t('stats.crit_rate') }}</span>
              </div>
              <div class="controls">
                <span class="affix prefix" aria-hidden="true" />
                <el-input-number
                  :model-value="pctInputValue(intrinsicDisplay('critRate'))"
                  :min="0"
                  :max="100"
                  :step="0.1"
                  :precision="1"
                  :controls="false"
                  size="small"
                  class="num-input"
                  @update:model-value="setCritPct('critRate', $event)"
                />
                <span class="affix unit">%</span>
                <button
                  class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger reset-btn"
                  type="button"
                  :class="{ invisible: !isOverridden('critRate') }"
                  :tabindex="isOverridden('critRate') ? 0 : -1"
                  :aria-hidden="!isOverridden('critRate')"
                  @click="clearOverride('critRate')"
                >
                  {{ t('armory.baseStats.resetOne') }}
                </button>
              </div>
            </div>

            <div class="row" :class="{ overridden: isOverridden('critDmg') }">
              <div class="label">
                <span>{{ t('stats.crit_dmg') }}</span>
              </div>
              <div class="controls">
                <span class="affix prefix" aria-hidden="true" />
                <el-input-number
                  :model-value="pctInputValue(intrinsicDisplay('critDmg'))"
                  :min="0"
                  :step="0.1"
                  :precision="1"
                  :controls="false"
                  size="small"
                  class="num-input"
                  @update:model-value="setCritPct('critDmg', $event)"
                />
                <span class="affix unit">%</span>
                <button
                  class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger reset-btn"
                  type="button"
                  :class="{ invisible: !isOverridden('critDmg') }"
                  :tabindex="isOverridden('critDmg') ? 0 : -1"
                  :aria-hidden="!isOverridden('critDmg')"
                  @click="clearOverride('critDmg')"
                >
                  {{ t('armory.baseStats.resetOne') }}
                </button>
              </div>
            </div>

            <div class="row" :class="{ overridden: isOverridden('artsIntensity') }">
              <div class="label">
                <span>{{ t('stats.originium_arts_power') }}</span>
              </div>
              <div class="controls">
                <span class="affix prefix" aria-hidden="true" />
                <el-input-number
                  :model-value="intrinsicDisplay('artsIntensity')"
                  :step="1"
                  :controls="false"
                  size="small"
                  class="num-input"
                  @update:model-value="setOverride('artsIntensity', $event)"
                />
                <span class="affix unit" aria-hidden="true" />
                <button
                  class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger reset-btn"
                  type="button"
                  :class="{ invisible: !isOverridden('artsIntensity') }"
                  :tabindex="isOverridden('artsIntensity') ? 0 : -1"
                  :aria-hidden="!isOverridden('artsIntensity')"
                  @click="clearOverride('artsIntensity')"
                >
                  {{ t('armory.baseStats.resetOne') }}
                </button>
              </div>
            </div>

            <div class="row" :class="{ overridden: isOverridden('ultimateGainEfficiency') }">
              <div class="label">
                <span>{{ t('stats.ult_charge_eff') }}</span>
              </div>
              <div class="controls">
                <span class="affix prefix">+</span>
                <el-input-number
                  :model-value="intrinsicDisplay('ultimateGainEfficiency')"
                  :step="1"
                  :controls="false"
                  size="small"
                  class="num-input"
                  @update:model-value="setOverride('ultimateGainEfficiency', $event)"
                />
                <span class="affix unit">%</span>
                <button
                  class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger reset-btn"
                  type="button"
                  :class="{ invisible: !isOverridden('ultimateGainEfficiency') }"
                  :tabindex="isOverridden('ultimateGainEfficiency') ? 0 : -1"
                  :aria-hidden="!isOverridden('ultimateGainEfficiency')"
                  @click="clearOverride('ultimateGainEfficiency')"
                >
                  {{ t('armory.baseStats.resetOne') }}
                </button>
              </div>
            </div>

            <div class="row" :class="{ overridden: isOverridden('comboCdReductionPercent') }">
              <div class="label">
                <span>{{ t('statDetail.comboCdReduction') }}</span>
              </div>
              <div class="controls">
                <span class="affix prefix" aria-hidden="true" />
                <el-input-number
                  :model-value="intrinsicDisplay('comboCdReductionPercent')"
                  :min="0"
                  :max="100"
                  :step="0.1"
                  :precision="1"
                  :controls="false"
                  size="small"
                  class="num-input"
                  @update:model-value="setOverride('comboCdReductionPercent', $event)"
                />
                <span class="affix unit">%</span>
                <button
                  class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger reset-btn"
                  type="button"
                  :class="{ invisible: !isOverridden('comboCdReductionPercent') }"
                  :tabindex="isOverridden('comboCdReductionPercent') ? 0 : -1"
                  :aria-hidden="!isOverridden('comboCdReductionPercent')"
                  @click="clearOverride('comboCdReductionPercent')"
                >
                  {{ t('armory.baseStats.resetOne') }}
                </button>
              </div>
            </div>

            <div class="row" :class="{ overridden: isOverridden('defense') }">
              <div class="label">
                <span>{{ t('statDetail.defense') }}</span>
              </div>
              <div class="controls">
                <span class="affix prefix" aria-hidden="true" />
                <el-input-number
                  :model-value="intrinsicDisplay('defense')"
                  :min="0"
                  :step="1"
                  :controls="false"
                  size="small"
                  class="num-input"
                  @update:model-value="setOverride('defense', $event)"
                />
                <span class="affix unit" aria-hidden="true" />
                <button
                  class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger reset-btn"
                  type="button"
                  :class="{ invisible: !isOverridden('defense') }"
                  :tabindex="isOverridden('defense') ? 0 : -1"
                  :aria-hidden="!isOverridden('defense')"
                  @click="clearOverride('defense')"
                >
                  {{ t('armory.baseStats.resetOne') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="footer">
        <button
          class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger"
          type="button"
          :disabled="!hasAnyOverride"
          @click="clearAll"
        >
          {{ t('armory.baseStats.resetAll') }}
        </button>
        <button
          class="ea-btn ea-btn--sm ea-btn--glass-rect"
          type="button"
          @click="onDialogVisible(false)"
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
  border: 1px solid transparent;
  color: var(--ea-fg, #f0f0f0);
}
.row.overridden {
  border-color: rgba(255, 196, 0, 0.35);
  background: rgba(255, 196, 0, 0.06);
}
.label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
  font-size: 13px;
}
.attr-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.controls {
  display: grid;
  grid-template-columns: 14px 96px 14px 52px;
  align-items: center;
  column-gap: 6px;
  flex-shrink: 0;
}
.num-input {
  width: 96px;
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
.reset-btn {
  width: 52px;
  padding-left: 0;
  padding-right: 0;
  justify-content: center;
  white-space: nowrap;
}
.reset-btn.invisible {
  visibility: hidden;
  pointer-events: none;
}
.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
