<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ATTRIBUTES } from '@/data/enums';
import { getGameAttributeName } from '@/data/gameText';
import {
  collectStatusOptions,
  KNOWN_ENEMY_STATUS_KEYS,
  translateEffectName,
} from '@/editor/hits/statusOptions';

const props = defineProps({
  modelValue: { default: undefined },
  label: { type: String, default: '' },
  operatorStatusOptions: { type: Array, default: () => [] },
  operatorStatusNameById: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['update:modelValue']);
const { t, te, locale } = useI18n({ useScope: 'global' });

const TERM_KINDS = Object.freeze(['flat', 'stack', 'attribute']);
/** Scaling basis only evaluates the four attributes (not main/sub placeholders). */
const SCALING_ATTRIBUTES = Object.freeze(
  ATTRIBUTES.filter(attr => attr !== 'main' && attr !== 'sub'),
);

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isLeveledNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return true;
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(item => typeof item === 'number' && Number.isFinite(item))
  );
}

function termKind(term) {
  if (isLeveledNumber(term)) return 'flat';
  if (!isPlainObject(term)) return null;
  if (typeof term.key === 'string') return 'stack';
  if (typeof term.basis === 'string' || Array.isArray(term.basis)) return 'attribute';
  return null;
}

function formatLeveled(value) {
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  return '';
}

function parseLeveled(raw, fallback = 0) {
  const text = String(raw ?? '').trim();
  if (!text) return fallback;
  if (text.includes(',')) {
    const parts = text.split(',').map(part => Number(part.trim()));
    if (parts.some(part => !Number.isFinite(part))) return fallback;
    return parts;
  }
  const num = Number(text);
  return Number.isFinite(num) ? num : fallback;
}

function toEditableTerm(term) {
  const kind = termKind(term);
  if (kind === 'flat') {
    return { kind: 'flat', value: formatLeveled(term) };
  }
  if (kind === 'stack') {
    return {
      kind: 'stack',
      key: term.key || '',
      target: term.target === 'enemy' ? 'enemy' : 'self',
      coefficient: formatLeveled(term.coefficient),
    };
  }
  if (kind === 'attribute') {
    return {
      kind: 'attribute',
      basis: normalizeBasisList(term.basis),
      coefficient: formatLeveled(term.coefficient),
    };
  }
  return null;
}

function normalizeBasisList(basis) {
  const parts = Array.isArray(basis) ? basis : [basis];
  const list = parts.map(part => String(part || '').trim().toLowerCase()).filter(Boolean);
  return list.length ? list : ['strength'];
}

function serializeBasis(list) {
  const cleaned = normalizeBasisList(list);
  return cleaned.length === 1 ? cleaned[0] : cleaned;
}

function basisOptions(term) {
  return collectStatusOptions(SCALING_ATTRIBUTES, term.basis || []);
}

function fromEditableTerm(term) {
  if (term.kind === 'stack') {
    const next = {
      key: String(term.key || '').trim() || KNOWN_ENEMY_STATUS_KEYS[0],
      coefficient: parseLeveled(term.coefficient, 1),
    };
    if (term.target === 'enemy') next.target = 'enemy';
    return next;
  }
  if (term.kind === 'attribute') {
    return {
      basis: serializeBasis(term.basis),
      coefficient: parseLeveled(term.coefficient, 1),
    };
  }
  return parseLeveled(term.value, 0);
}

const heading = computed(() => props.label || t('hitEditor.fields.scaling'));

const additiveTerms = computed(() => {
  const list = Array.isArray(props.modelValue?.additive) ? props.modelValue.additive : [];
  return list.map(toEditableTerm).filter(Boolean);
});

const multiplierTexts = computed(() => {
  const list = Array.isArray(props.modelValue?.multiplier) ? props.modelValue.multiplier : [];
  return list.filter(isLeveledNumber).map(formatLeveled);
});

const capText = computed(() =>
  props.modelValue?.cap != null && isLeveledNumber(props.modelValue.cap)
    ? formatLeveled(props.modelValue.cap)
    : '',
);

function emitScaling({ additive, multiplier, cap }) {
  const next = {};
  if (additive?.length) next.additive = additive;
  if (multiplier?.length) next.multiplier = multiplier;
  if (cap != null && cap !== '') next.cap = cap;
  emit('update:modelValue', Object.keys(next).length ? next : undefined);
}

function commitAdditive(editableList) {
  emitScaling({
    additive: editableList.map(fromEditableTerm),
    multiplier: multiplierTexts.value.map(text => parseLeveled(text, 0)),
    cap: capText.value ? parseLeveled(capText.value) : undefined,
  });
}

function commitMultiplier(texts) {
  emitScaling({
    additive: additiveTerms.value.map(fromEditableTerm),
    multiplier: texts.map(text => parseLeveled(text, 0)),
    cap: capText.value ? parseLeveled(capText.value) : undefined,
  });
}

function commitCap(raw) {
  const text = String(raw ?? '').trim();
  emitScaling({
    additive: additiveTerms.value.map(fromEditableTerm),
    multiplier: multiplierTexts.value.map(item => parseLeveled(item, 0)),
    cap: text ? parseLeveled(text) : undefined,
  });
}

function updateAdditive(index, patch) {
  const next = additiveTerms.value.map((term, i) =>
    i === index ? { ...term, ...patch } : { ...term },
  );
  commitAdditive(next);
}

function stackStatusOptions(term) {
  if (term.target === 'enemy') {
    return collectStatusOptions(KNOWN_ENEMY_STATUS_KEYS, [], term.key);
  }
  return collectStatusOptions([], props.operatorStatusOptions, term.key);
}

function statusLabel(value) {
  return translateEffectName(t, te, value, props.operatorStatusNameById);
}

function changeAdditiveKind(index, kind) {
  if (kind === 'stack') {
    updateAdditive(index, {
      kind: 'stack',
      key: KNOWN_ENEMY_STATUS_KEYS[0],
      target: 'enemy',
      coefficient: '1',
      value: undefined,
      basis: undefined,
    });
    return;
  }
  if (kind === 'attribute') {
    updateAdditive(index, {
      kind: 'attribute',
      basis: ['strength'],
      coefficient: '1',
      value: undefined,
      key: undefined,
      target: undefined,
    });
    return;
  }
  updateAdditive(index, {
    kind: 'flat',
    value: '0',
    key: undefined,
    target: undefined,
    basis: undefined,
    coefficient: undefined,
  });
}

function removeAdditive(index) {
  commitAdditive(additiveTerms.value.filter((_, i) => i !== index));
}

function addAdditive() {
  commitAdditive([...additiveTerms.value, { kind: 'flat', value: '0' }]);
}

function updateMultiplier(index, raw) {
  const next = [...multiplierTexts.value];
  next[index] = raw;
  commitMultiplier(next);
}

function removeMultiplier(index) {
  commitMultiplier(multiplierTexts.value.filter((_, i) => i !== index));
}

function addMultiplier() {
  commitMultiplier([...multiplierTexts.value, '0']);
}

function termKindLabel(value) {
  const key = `hitEditor.scalingTerms.${value}`;
  const out = t(key);
  return out === key ? value : out;
}
</script>

<template>
  <div class="structured-block">
    <div class="block-title">{{ heading }}</div>

    <div v-for="(term, index) in additiveTerms" :key="`add-${index}`" class="term-row">
      <div class="term-row__fields field-grid field-grid--effect-select-row">
        <label class="field">
          <span>{{ t('common.type') }}</span>
          <el-select
            :model-value="term.kind"
            @update:model-value="value => changeAdditiveKind(index, value)"
            size="small"
            class="effect-select-dark"
            popper-class="hit-editor-select-popper"
          >
            <el-option
              v-for="kind in TERM_KINDS"
              :key="kind"
              :value="kind"
              :label="termKindLabel(kind)"
            />
          </el-select>
        </label>

        <template v-if="term.kind === 'flat'">
          <label class="field">
            <span>{{ t('common.value') }}</span>
            <input
              class="simple-input"
              :value="term.value"
              @change="event => updateAdditive(index, { value: event.target.value })"
            />
          </label>
        </template>

        <template v-else-if="term.kind === 'stack'">
          <label class="field">
            <span>{{ t('hitEditor.fields.conditionTarget') }}</span>
            <el-select
              :model-value="term.target"
              @update:model-value="
                value =>
                  updateAdditive(index, {
                    target: value,
                    key:
                      value === 'enemy'
                        ? KNOWN_ENEMY_STATUS_KEYS[0]
                        : props.operatorStatusOptions[0] || term.key,
                  })
              "
              size="small"
              class="effect-select-dark"
              popper-class="hit-editor-select-popper"
            >
              <el-option value="self" :label="t('hitEditor.targetScopes.self')" />
              <el-option value="enemy" :label="t('hitEditor.targetScopes.enemy')" />
            </el-select>
          </label>
          <label class="field">
            <span>{{ t('hitEditor.fields.conditionStatus') }}</span>
            <el-select
              :model-value="term.key"
              @update:model-value="value => updateAdditive(index, { key: value })"
              size="small"
              filterable
              class="effect-select-dark"
              popper-class="hit-editor-select-popper"
            >
              <el-option
                v-for="status in stackStatusOptions(term)"
                :key="status"
                :value="status"
                :label="statusLabel(status)"
              />
            </el-select>
          </label>
          <label class="field">
            <span>{{ t('common.value') }}</span>
            <input
              class="simple-input"
              :value="term.coefficient"
              @change="event => updateAdditive(index, { coefficient: event.target.value })"
            />
          </label>
        </template>

        <template v-else>
          <label class="field">
            <span>{{ t('hitEditor.fields.attribute') }}</span>
            <el-select
              :model-value="term.basis"
              @update:model-value="value => updateAdditive(index, { basis: value })"
              size="small"
              multiple
              collapse-tags
              collapse-tags-tooltip
              class="effect-select-dark"
              popper-class="hit-editor-select-popper"
            >
              <el-option
                v-for="attr in basisOptions(term)"
                :key="attr"
                :value="attr"
                :label="getGameAttributeName(attr, locale)"
              />
            </el-select>
          </label>
          <label class="field">
            <span>{{ t('common.value') }}</span>
            <input
              class="simple-input"
              :value="term.coefficient"
              @change="event => updateAdditive(index, { coefficient: event.target.value })"
            />
          </label>
        </template>
      </div>

      <button
        type="button"
        class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger term-remove"
        @click="removeAdditive(index)"
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path
            d="M3 3l10 10M13 3L3 13"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <button type="button" class="add-effect-bar" @click="addAdditive">
      + {{ t('hitEditor.addScalingTerm') }}
    </button>

    <div v-for="(text, index) in multiplierTexts" :key="`mul-${index}`" class="term-row">
      <div class="term-row__fields field-grid field-grid--effect-input-row">
        <label class="field">
          <span>{{ termKindLabel('multiplier') }}</span>
          <input
            class="simple-input"
            :value="text"
            @change="event => updateMultiplier(index, event.target.value)"
          />
        </label>
      </div>
      <button
        type="button"
        class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger term-remove"
        @click="removeMultiplier(index)"
      >
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
          <path
            d="M3 3l10 10M13 3L3 13"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <button type="button" class="add-effect-bar" @click="addMultiplier">
      + {{ t('hitEditor.addScalingMultiplier') }}
    </button>

    <div class="field-grid field-grid--effect-text-row">
      <label class="field">
        <span>{{ t('hitEditor.fields.scalingCap') }}</span>
        <input
          class="simple-input"
          :value="capText"
          @change="event => commitCap(event.target.value)"
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.structured-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.block-title {
  color: #ffd700;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

.term-row {
  align-items: end;
  display: flex;
  gap: 8px;
}

.term-row__fields {
  flex: 1 1 auto;
  min-width: 0;
}

.field-grid {
  display: grid;
  gap: 10px;
}

.field-grid--effect-select-row,
.field-grid--effect-input-row,
.field-grid--effect-text-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.field {
  color: #cfd3dc;
  display: flex;
  flex-direction: column;
  font-size: 11px;
  gap: 5px;
  min-width: 0;
}

.effect-select-dark,
.simple-input {
  box-sizing: border-box;
  width: 100%;
}

.simple-input {
  appearance: none;
  background: #111;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 0;
  color: #f0f0f0;
  font-family: inherit;
  font-size: 12px;
  height: 31px;
  line-height: 1.2;
  min-height: 31px;
  padding: 0 8px;
}

.simple-input:focus {
  border-color: rgba(255, 215, 0, 0.72);
  outline: none;
}

.term-remove {
  flex: 0 0 auto;
  height: 31px;
  width: 31px;
}

.add-effect-bar {
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffd700;
  cursor: pointer;
  display: flex;
  font-size: 11px;
  justify-content: center;
  min-height: 30px;
  padding: 7px 8px;
  width: 100%;
}

.add-effect-bar:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 215, 0, 0.8);
}
</style>
