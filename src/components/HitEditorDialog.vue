<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import draggable from 'vuedraggable';
import CustomNumberInput from './CustomNumberInput.vue';
import {
  cloneEditorHit,
  createEditorEffect,
  normalizeHits,
  parseEditorJsonField,
  retypeEditorEffect,
  retypeEditorEffectKind,
} from '@/utils/hitModel.js';
import { resolveEffectDisplayKey } from '@/utils/effectDisplay.js';
import {
  filterEffectOptionGroups,
  shouldRetypeEffectForDisplayKind,
} from '@/utils/effectDisplayOptions.js';
import { frameToTime, timeToFrame } from '@/utils/time.js';
import { getDefaultStackStrategy } from '@/data/effectPresets';

const DAMAGE_ELEMENTS = ['physical', 'heat', 'cryo', 'electric', 'nature'];
const ARTS_ELEMENTS = ['heat', 'cryo', 'electric', 'nature'];
const REACTION_TYPES = ['combustion', 'electrification', 'solidification', 'corrosion'];
const PHYSICAL_STATUS_TYPES = ['breach', 'crush', 'lift', 'knockdown'];
const TREAT_AS_ANOMALY_TYPES = [...REACTION_TYPES, ...PHYSICAL_STATUS_TYPES];
const DEFAULT_DAMAGE_ELEMENT_VALUE = '__default_damage_element__';
const SKILL_TYPES = ['basicAttack', 'battleSkill', 'comboSkill', 'ultimate', 'finalStrike', 'dive'];
const EFFECT_KINDS = [
  'status',
  'infliction',
  'burst',
  'reaction',
  'physicalStatus',
  'damageHit',
  'damageOverTime',
  'spRecovery',
  'spReturn',
  'ultEnergyGain',
  'consume',
  'oneTime',
  'cooldownReductionFlat',
  'cooldownReductionPercent',
];
const STACK_STRATEGIES = ['REFRESH_DURATION', 'INDEPENDENT', 'REPLACE'];
const APPLY_TIMINGS = ['afterDamage', 'beforeDamage'];
const JSON_HIT_FIELDS = ['_condition'];
const JSON_EFFECT_FIELDS = [
  'condition',
  'stat',
  'target',
  'scaling',
  'requiresInfliction',
  'multiplierScaling',
  'staggerScaling',
  'hit',
  'readConsumedStacks',
  'consumedStatEffects',
  'operatorStatus',
  'enemyStatus',
  'skillTypes',
  'skillId',
];
const ELEMENT_KEY_ALIASES = Object.freeze({
  blaze: 'heat',
  fire: 'heat',
  heat: 'heat',
  cold: 'cryo',
  ice: 'cryo',
  cryo: 'cryo',
  emag: 'electric',
  electro: 'electric',
  electric: 'electric',
  nature: 'nature',
  physical: 'physical',
});

const props = defineProps({
  visible: { type: Boolean, default: false },
  hit: { type: Object, default: null },
  hitIndex: { type: Number, default: -1 },
  defaultElement: { type: String, default: null },
  effectOptions: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:visible', 'save', 'delete']);
const { t } = useI18n({ useScope: 'global' });

const draft = ref(null);
const selectedEffectId = ref(null);
const jsonErrors = ref({});
const jsonDrafts = ref({});

const open = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
});

function normalizeElementKey(value) {
  const key = String(value || '').trim();
  return ELEMENT_KEY_ALIASES[key] || key;
}

const defaultElementKey = computed(() => normalizeElementKey(props.defaultElement));

watch(
  () => [props.visible, props.hit],
  () => {
    if (!props.visible) return;
    draft.value = cloneEditorHit(props.hit || {}, defaultElementKey.value);
    selectedEffectId.value = null;
    jsonErrors.value = {};
    jsonDrafts.value = {};
  },
  { immediate: true, deep: true },
);

const dialogTitle = computed(() => `Hit ${props.hitIndex + 1}`);

const selectedEffect = computed(() => {
  const effects = draft.value?.effects || [];
  return effects.find(effect => effect._id === selectedEffectId.value) || null;
});

const effectList = computed({
  get: () => draft.value?.effects || [],
  set: effects => {
    if (!draft.value) return;
    draft.value = cloneEditorHit({ ...draft.value, effects }, defaultElementKey.value);
  },
});

const spMode = computed(() => (Number(draft.value?.spReturn) > 0 ? 'refund' : 'recover'));

const spAmount = computed(() =>
  spMode.value === 'refund'
    ? Number(draft.value?.spReturn) || 0
    : Number(draft.value?.spRecovery) || 0,
);

const hasJsonErrors = computed(() => Object.values(jsonErrors.value).some(Boolean));

const selectableDamageElements = computed(() =>
  DAMAGE_ELEMENTS.filter(element => element !== defaultElementKey.value),
);

const damageElementValue = computed(() => {
  const element = normalizeElementKey(draft.value?.element);
  return element && element !== defaultElementKey.value ? element : DEFAULT_DAMAGE_ELEMENT_VALUE;
});

const filteredEffectOptions = computed(() =>
  filterEffectOptionGroups(
    props.effectOptions || [],
    selectedEffect.value?.kind || 'status',
    resolveEffectDisplayKey(selectedEffect.value),
  ),
);

const physicalStatusOptions = computed(() => {
  const current = selectedEffect.value?.physicalType;
  const options = [...PHYSICAL_STATUS_TYPES];
  if (current && !options.includes(current)) options.push(current);
  return options;
});

const canEditStackStrategy = computed(() =>
  ['status', 'infliction', 'physicalStatus', 'reaction'].includes(selectedEffect.value?.kind),
);

const selectedStackStrategyValue = computed(() =>
  selectedEffect.value
    ? selectedEffect.value.stackStrategy || getDefaultStackStrategy(selectedEffect.value)
    : '',
);

function frameValue(value) {
  return timeToFrame(value);
}

function timeValueFromFrame(value) {
  return frameToTime(value);
}

function optionalString(value) {
  const text = String(value ?? '').trim();
  return text || undefined;
}

function optionalDamageElement(value) {
  return value === DEFAULT_DAMAGE_ELEMENT_VALUE ? undefined : optionalString(value);
}

function displayTextValue(value) {
  return value === 'default' ? '' : value || '';
}

function patchHit(key, value) {
  if (!draft.value) return;
  const next = { ...draft.value };
  if (value === undefined || value === '') {
    delete next[key];
  } else {
    next[key] = value;
  }
  draft.value = cloneEditorHit(next, defaultElementKey.value);
}

function patchHitFrame(key, value) {
  patchHit(key, timeValueFromFrame(value));
}

function patchSpMode(mode) {
  if (!draft.value) return;
  const amount = spAmount.value;
  draft.value = cloneEditorHit(
    {
      ...draft.value,
      spRecovery: mode === 'refund' ? 0 : amount,
      spReturn: mode === 'refund' ? amount : 0,
    },
    defaultElementKey.value,
  );
}

function patchSpAmount(value) {
  if (!draft.value) return;
  const amount = Number(value) || 0;
  draft.value = cloneEditorHit(
    {
      ...draft.value,
      spRecovery: spMode.value === 'refund' ? 0 : amount,
      spReturn: spMode.value === 'refund' ? amount : 0,
    },
    defaultElementKey.value,
  );
}

function jsonKey(scope, key) {
  return `${scope}:${key}`;
}

function stringifyJson(value) {
  if (value === undefined || value === null) return '';
  return JSON.stringify(value, null, 2);
}

function jsonText(scope, source, key) {
  const id = jsonKey(scope, key);
  if (Object.prototype.hasOwnProperty.call(jsonDrafts.value, id)) return jsonDrafts.value[id];
  return stringifyJson(source?.[key]);
}

function patchHitJson(key, raw) {
  const id = jsonKey('hit', key);
  jsonDrafts.value = { ...jsonDrafts.value, [id]: raw };
  const parsed = parseEditorJsonField(raw);
  jsonErrors.value = { ...jsonErrors.value, [id]: parsed.ok ? '' : parsed.error };
  if (!parsed.ok) return;
  patchHit(key, parsed.value);
}

function patchSelectedEffect(key, value) {
  if (!draft.value || !selectedEffect.value) return;
  const effects = draft.value.effects.map(effect => {
    if (effect._id !== selectedEffect.value._id) return effect;
    const next = { ...effect };
    if (value === undefined || value === '') {
      delete next[key];
    } else {
      next[key] = value;
    }
    return next;
  });
  draft.value = cloneEditorHit({ ...draft.value, effects }, defaultElementKey.value);
}

function patchSelectedEffectNumber(key, value) {
  patchSelectedEffect(key, Number(value) || 0);
}

function patchSelectedEffectBool(key, value) {
  patchSelectedEffect(key, !!value);
}

function patchSelectedEffectJson(key, raw) {
  if (!selectedEffect.value) return;
  const id = jsonKey(selectedEffect.value._id, key);
  jsonDrafts.value = { ...jsonDrafts.value, [id]: raw };
  const parsed = parseEditorJsonField(raw);
  jsonErrors.value = { ...jsonErrors.value, [id]: parsed.ok ? '' : parsed.error };
  if (!parsed.ok) return;
  patchSelectedEffect(key, parsed.value);
}

function addEffect() {
  if (!draft.value) return;
  const effect = createEditorEffect('default');
  draft.value = cloneEditorHit(
    {
      ...draft.value,
      effects: [...(draft.value.effects || []), effect],
    },
    defaultElementKey.value,
  );
  selectedEffectId.value = draft.value.effects?.[draft.value.effects.length - 1]?._id || effect._id;
}

function removeEffectById(effectId) {
  if (!draft.value) return;
  const effects = draft.value.effects.filter(effect => effect._id !== effectId);
  draft.value = cloneEditorHit({ ...draft.value, effects }, defaultElementKey.value);
  if (selectedEffectId.value === effectId) {
    selectedEffectId.value = null;
  }
}

function updateSelectedEffectDisplayType(value) {
  if (!draft.value || !selectedEffect.value) return;
  const selectedId = selectedEffect.value._id;
  const effects = draft.value.effects.map(effect => {
    if (effect._id !== selectedId) return effect;
    if (shouldRetypeEffectForDisplayKind(effect.kind)) return retypeEditorEffect(effect, value);
    return { ...effect, type: value, displayType: value };
  });
  draft.value = cloneEditorHit({ ...draft.value, effects }, defaultElementKey.value);
  selectedEffectId.value = selectedId;
}

function updateSelectedEffectKind(value) {
  if (!draft.value || !selectedEffect.value) return;
  const selectedId = selectedEffect.value._id;
  const effects = draft.value.effects.map(effect =>
    effect._id === selectedId ? retypeEditorEffectKind(effect, value) : effect,
  );
  draft.value = cloneEditorHit({ ...draft.value, effects }, defaultElementKey.value);
  selectedEffectId.value = selectedId;
}

function effectDisplayName(effect) {
  const key = resolveEffectDisplayKey(effect);
  if (key === 'default') return t('hitEditor.newEffect');
  const localeKey = `effects.name.${key}`;
  const out = t(localeKey);
  if (out !== localeKey) return out;
  const kindKey = `hitEditor.effectKinds.${key}`;
  const kindOut = t(kindKey);
  return kindOut === kindKey ? key : kindOut;
}

function editorLabel(group, value) {
  const key = String(value || '');
  if (!key) return '';
  const localeKey = `hitEditor.${group}.${key}`;
  const out = t(localeKey);
  return out === localeKey ? key : out;
}

function elementLabel(value) {
  return editorLabel('elements', value);
}

function skillTypeLabel(value) {
  return editorLabel('skillTypes', value);
}

function effectKindLabel(value) {
  return editorLabel('effectKinds', value);
}

function reactionLabel(value) {
  return editorLabel('reactions', value);
}

function physicalStatusLabel(value) {
  return editorLabel('physicalStatuses', value);
}

function anomalyTypeLabel(value) {
  return REACTION_TYPES.includes(value) ? reactionLabel(value) : physicalStatusLabel(value);
}

function stackStrategyLabel(value) {
  return editorLabel('stackStrategies', value);
}

function applyTimingLabel(value) {
  return editorLabel('applyTimings', value);
}

function multiplierModeLabel(value) {
  return editorLabel('multiplierModes', value);
}

function consumeScopeLabel(value) {
  return editorLabel('consumeScopes', value);
}

function fieldLabel(value) {
  return editorLabel('fields', value);
}

function save() {
  if (!draft.value || hasJsonErrors.value) return;
  emit('save', normalizeHits([draft.value], defaultElementKey.value)[0]);
  emit('update:visible', false);
}
</script>

<template>
  <el-dialog
    v-model="open"
    :title="dialogTitle"
    width="980px"
    align-center
    append-to-body
    class="hit-editor-dialog"
  >
    <div v-if="draft" class="hit-editor">
      <section class="editor-section">
        <div class="section-title">{{ t('hitEditor.basic') }}</div>
        <div class="field-grid field-grid--input-row">
          <label class="field">
            <span>{{ t('propertiesPanel.damage.tickTime') }}</span>
            <CustomNumberInput
              :model-value="frameValue(draft.offset)"
              @update:model-value="value => patchHitFrame('offset', value)"
              :step="1"
              :min="0"
              border-color="#ff7875"
            />
          </label>
          <label class="field">
            <span>{{ t('propertiesPanel.damage.tickMultiplier') }}</span>
            <CustomNumberInput
              :model-value="draft.multiplier || 0"
              @update:model-value="value => patchHit('multiplier', Number(value) || 0)"
              :step="1"
              :min="0"
              border-color="#ff7875"
            />
          </label>
          <label class="field">
            <span>{{ t('propertiesPanel.damage.tickStagger') }}</span>
            <CustomNumberInput
              :model-value="draft.stagger || 0"
              @update:model-value="value => patchHit('stagger', Number(value) || 0)"
              :step="1"
              :min="0"
              border-color="#ff7875"
            />
          </label>
          <label class="field">
            <span>{{ t('propertiesPanel.damage.tickSpGain') }}</span>
            <CustomNumberInput
              :model-value="spAmount"
              @update:model-value="patchSpAmount"
              :step="1"
              :min="0"
              border-color="#ffd700"
            />
          </label>
          <label class="field">
            <span>{{ t('hitEditor.durationExtension') }}</span>
            <CustomNumberInput
              :model-value="frameValue(draft.durationExtension || 0)"
              @update:model-value="value => patchHitFrame('durationExtension', value)"
              :step="1"
              :min="0"
              border-color="#00e5ff"
            />
          </label>
        </div>
        <div class="field-grid field-grid--select-row">
          <label class="field">
            <span>{{ t('common.element') }}</span>
            <el-select
              :model-value="damageElementValue"
              @update:model-value="value => patchHit('element', optionalDamageElement(value))"
              size="small"
              class="effect-select-dark"
              popper-class="hit-editor-select-popper"
            >
              <el-option
                :value="DEFAULT_DAMAGE_ELEMENT_VALUE"
                :label="defaultElementKey ? elementLabel(defaultElementKey) : t('common.default')"
              />
              <el-option
                v-for="element in selectableDamageElements"
                :key="element"
                :value="element"
                :label="elementLabel(element)"
              />
            </el-select>
          </label>
          <label class="field">
            <span>{{ fieldLabel('treatAsReaction') }}</span>
            <el-select
              :model-value="draft.treatAsReaction || ''"
              @update:model-value="value => patchHit('treatAsReaction', optionalString(value))"
              size="small"
              class="effect-select-dark"
              popper-class="hit-editor-select-popper"
            >
              <el-option value="" :label="t('common.noneParen')" />
              <el-option
                v-for="anomalyType in TREAT_AS_ANOMALY_TYPES"
                :key="anomalyType"
                :value="anomalyType"
                :label="anomalyTypeLabel(anomalyType)"
              />
            </el-select>
          </label>
          <label class="field">
            <span>{{ fieldLabel('treatAsSkillType') }}</span>
            <el-select
              :model-value="draft.treatAsSkillType || ''"
              @update:model-value="value => patchHit('treatAsSkillType', optionalString(value))"
              size="small"
              class="effect-select-dark"
              popper-class="hit-editor-select-popper"
            >
              <el-option value="" :label="t('common.noneParen')" />
              <el-option
                v-for="skillType in SKILL_TYPES"
                :key="skillType"
                :value="skillType"
                :label="skillTypeLabel(skillType)"
              />
            </el-select>
          </label>
          <label class="field">
            <span>{{ t('propertiesPanel.damage.tickSpKind') }}</span>
            <el-select
              :model-value="spMode"
              @update:model-value="patchSpMode"
              size="small"
              class="effect-select-dark"
              popper-class="hit-editor-select-popper"
            >
              <el-option value="recover" :label="t('propertiesPanel.damage.spKindRecover')" />
              <el-option value="refund" :label="t('propertiesPanel.damage.spKindRefund')" />
            </el-select>
          </label>
        </div>
      </section>

      <section class="editor-section">
        <div class="section-title">{{ t('hitEditor.effects') }}</div>
        <div class="effect-layout">
          <div class="effect-list">
            <div class="effect-pane-title">{{ t('hitEditor.effects') }}</div>
            <draggable
              v-model="effectList"
              item-key="_id"
              class="effect-list-body"
              :animation="160"
            >
              <template #item="{ element: effect }">
                <div
                  class="effect-row"
                  :class="{ 'is-active': effect._id === selectedEffectId }"
                  @click="selectedEffectId = effect._id"
                >
                  <span class="effect-row__text">
                    <span class="effect-row__name">{{ effectDisplayName(effect) }}</span>
                    <span class="effect-row__kind">{{ effectKindLabel(effect.kind) }}</span>
                  </span>
                  <button
                    type="button"
                    class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger effect-row__delete"
                    :title="t('common.delete')"
                    @click.stop="removeEffectById(effect._id)"
                  ></button>
                </div>
              </template>
            </draggable>
            <button type="button" class="add-effect-bar" @click="addEffect">
              <span class="plus-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="10"
                  height="10"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="4"
                  aria-hidden="true"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
              <span>{{ t('propertiesPanel.effects.addEffect') }}</span>
            </button>
          </div>

          <div v-if="selectedEffect" class="effect-detail">
            <div class="effect-pane-title">{{ effectDisplayName(selectedEffect) }}</div>
            <div class="effect-field-groups">
              <div class="field-grid field-grid--effect-select-row">
                <label class="field">
                  <span>{{ t('hitEditor.effectKind') }}</span>
                  <el-select
                    :model-value="selectedEffect.kind"
                    @update:model-value="updateSelectedEffectKind"
                    size="small"
                    class="effect-select-dark"
                    popper-class="hit-editor-select-popper"
                  >
                    <el-option
                      v-for="kind in EFFECT_KINDS"
                      :key="kind"
                      :value="kind"
                      :label="effectKindLabel(kind)"
                    />
                  </el-select>
                </label>
                <label class="field full">
                  <span>{{ t('hitEditor.displayType') }}</span>
                  <el-select
                    :model-value="resolveEffectDisplayKey(selectedEffect)"
                    @update:model-value="updateSelectedEffectDisplayType"
                    filterable
                    size="small"
                    class="effect-select-dark"
                    popper-class="hit-editor-select-popper"
                  >
                    <el-option value="default" :label="t('common.none')" />
                    <el-option-group
                      v-for="group in filteredEffectOptions"
                      :key="group.label"
                      :label="group.label"
                    >
                      <el-option
                        v-for="item in group.options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-option-group>
                  </el-select>
                </label>
                <label v-if="canEditStackStrategy" class="field">
                  <span>{{ t('hitEditor.stackStrategy') }}</span>
                  <el-select
                    :model-value="selectedStackStrategyValue"
                    @update:model-value="
                      value => patchSelectedEffect('stackStrategy', optionalString(value))
                    "
                    size="small"
                    class="effect-select-dark"
                    popper-class="hit-editor-select-popper"
                  >
                    <el-option value="" :label="t('common.default')" />
                    <el-option
                      v-for="strategy in STACK_STRATEGIES"
                      :key="strategy"
                      :value="strategy"
                      :label="stackStrategyLabel(strategy)"
                    />
                  </el-select>
                </label>
                <label class="field">
                  <span>{{ t('hitEditor.applyTiming') }}</span>
                  <el-select
                    :model-value="selectedEffect.applyTiming || ''"
                    @update:model-value="
                      value => patchSelectedEffect('applyTiming', optionalString(value))
                    "
                    size="small"
                    class="effect-select-dark"
                    popper-class="hit-editor-select-popper"
                  >
                    <el-option value="" :label="t('common.default')" />
                    <el-option
                      v-for="timing in APPLY_TIMINGS"
                      :key="timing"
                      :value="timing"
                      :label="applyTimingLabel(timing)"
                    />
                  </el-select>
                </label>
              </div>

              <div class="field-grid field-grid--effect-input-row">
                <label class="field">
                  <span>{{ t('common.duration') }}</span>
                  <CustomNumberInput
                    :model-value="frameValue(selectedEffect.duration || 0)"
                    @update:model-value="
                      value => patchSelectedEffect('duration', timeValueFromFrame(value))
                    "
                    :min="0"
                    :step="1"
                    :activeColor="'#ffd700'"
                  />
                </label>
                <label class="field">
                  <span>{{ t('common.stacks') }}</span>
                  <CustomNumberInput
                    :model-value="selectedEffect.stacks || 1"
                    @update:model-value="value => patchSelectedEffectNumber('stacks', value)"
                    :min="0"
                    :activeColor="'#ffd700'"
                  />
                </label>
                <label class="field">
                  <span>{{ t('hitEditor.maxStacks') }}</span>
                  <CustomNumberInput
                    :model-value="selectedEffect.maxStacks || 0"
                    @update:model-value="value => patchSelectedEffectNumber('maxStacks', value)"
                    :min="0"
                    :activeColor="'#ffd700'"
                  />
                </label>
                <label class="field">
                  <span>ICD</span>
                  <CustomNumberInput
                    :model-value="selectedEffect.icd || 0"
                    @update:model-value="value => patchSelectedEffectNumber('icd', value)"
                    :min="0"
                    :activeColor="'#ffd700'"
                  />
                </label>
              </div>

              <div class="field-grid field-grid--effect-text-row">
                <label class="field">
                  <span>ID</span>
                  <input
                    class="simple-input"
                    :value="displayTextValue(selectedEffect.id)"
                    @input="event => patchSelectedEffect('id', optionalString(event.target.value))"
                  />
                </label>
                <label class="field">
                  <span>{{ t('common.name') }}</span>
                  <input
                    class="simple-input"
                    :value="displayTextValue(selectedEffect.name)"
                    @input="
                      event => patchSelectedEffect('name', optionalString(event.target.value))
                    "
                  />
                </label>
                <label class="field">
                  <span>{{ t('hitEditor.icdGroup') }}</span>
                  <input
                    class="simple-input"
                    :value="selectedEffect.icdGroup || ''"
                    @input="
                      event => patchSelectedEffect('icdGroup', optionalString(event.target.value))
                    "
                  />
                </label>
              </div>

              <div class="field-grid field-grid--effect-check-row">
                <label class="check-field ea-check-rect">
                  <input
                    type="checkbox"
                    :checked="!!selectedEffect.hide"
                    @change="event => patchSelectedEffectBool('hide', event.target.checked)"
                  />
                  <span>{{ t('hitEditor.hide') }}</span>
                </label>
                <label class="check-field ea-check-rect">
                  <input
                    type="checkbox"
                    :checked="!!selectedEffect.ignoreTimeShift"
                    @change="
                      event => patchSelectedEffectBool('ignoreTimeShift', event.target.checked)
                    "
                  />
                  <span>{{ t('hitEditor.ignoreTimeShift') }}</span>
                </label>
              </div>
            </div>

            <div class="kind-field-groups">
              <template v-if="selectedEffect.kind === 'status'">
                <div class="field-grid field-grid--effect-input-row">
                  <label class="field">
                    <span>{{ t('common.value') }}</span>
                    <CustomNumberInput
                      :model-value="selectedEffect.value || 0"
                      @update:model-value="value => patchSelectedEffectNumber('value', value)"
                      :activeColor="'#ffd700'"
                    />
                  </label>
                </div>
                <div class="field-grid field-grid--effect-check-row">
                  <label class="check-field ea-check-rect">
                    <input
                      type="checkbox"
                      :checked="!!selectedEffect.silent"
                      @change="event => patchSelectedEffectBool('silent', event.target.checked)"
                    />
                    <span>{{ fieldLabel('silent') }}</span>
                  </label>
                  <label class="check-field ea-check-rect">
                    <input
                      type="checkbox"
                      :checked="!!selectedEffect.external"
                      @change="event => patchSelectedEffectBool('external', event.target.checked)"
                    />
                    <span>{{ fieldLabel('external') }}</span>
                  </label>
                </div>
              </template>

              <template
                v-if="selectedEffect.kind === 'infliction' || selectedEffect.kind === 'burst'"
              >
                <div class="field-grid field-grid--effect-select-row">
                  <label class="field">
                    <span>{{ t('common.element') }}</span>
                    <el-select
                      :model-value="selectedEffect.element || 'heat'"
                      @update:model-value="value => patchSelectedEffect('element', value)"
                      size="small"
                      class="effect-select-dark"
                      popper-class="hit-editor-select-popper"
                    >
                      <el-option
                        v-for="element in ARTS_ELEMENTS"
                        :key="element"
                        :value="element"
                        :label="elementLabel(element)"
                      />
                    </el-select>
                  </label>
                </div>
              </template>

              <template v-if="selectedEffect.kind === 'reaction'">
                <div class="field-grid field-grid--effect-select-row">
                  <label class="field">
                    <span>{{ fieldLabel('reactionType') }}</span>
                    <el-select
                      :model-value="selectedEffect.reactionType || 'combustion'"
                      @update:model-value="value => patchSelectedEffect('reactionType', value)"
                      size="small"
                      class="effect-select-dark"
                      popper-class="hit-editor-select-popper"
                    >
                      <el-option
                        v-for="reaction in REACTION_TYPES"
                        :key="reaction"
                        :value="reaction"
                        :label="reactionLabel(reaction)"
                      />
                    </el-select>
                  </label>
                </div>
                <div class="field-grid field-grid--effect-input-row">
                  <label class="field">
                    <span>{{ fieldLabel('effectiveness') }}</span>
                    <CustomNumberInput
                      :model-value="selectedEffect.effectiveness || 0"
                      @update:model-value="
                        value => patchSelectedEffectNumber('effectiveness', value)
                      "
                      :activeColor="'#ffd700'"
                    />
                  </label>
                  <label class="field">
                    <span>{{ fieldLabel('defaultLevel') }}</span>
                    <CustomNumberInput
                      :model-value="selectedEffect.defaultLevel || 1"
                      @update:model-value="
                        value => patchSelectedEffectNumber('defaultLevel', value)
                      "
                      :min="1"
                      :activeColor="'#ffd700'"
                    />
                  </label>
                </div>
              </template>

              <template v-if="selectedEffect.kind === 'physicalStatus'">
                <div class="field-grid field-grid--effect-select-row">
                  <label class="field">
                    <span>{{ fieldLabel('physicalType') }}</span>
                    <el-select
                      :model-value="selectedEffect.physicalType || 'breach'"
                      @update:model-value="value => patchSelectedEffect('physicalType', value)"
                      size="small"
                      class="effect-select-dark"
                      popper-class="hit-editor-select-popper"
                    >
                      <el-option
                        v-for="status in physicalStatusOptions"
                        :key="status"
                        :value="status"
                        :label="physicalStatusLabel(status)"
                      />
                    </el-select>
                  </label>
                </div>
                <div class="field-grid field-grid--effect-input-row">
                  <label class="field">
                    <span>{{ fieldLabel('effectiveness') }}</span>
                    <CustomNumberInput
                      :model-value="selectedEffect.effectiveness || 0"
                      @update:model-value="
                        value => patchSelectedEffectNumber('effectiveness', value)
                      "
                      :activeColor="'#ffd700'"
                    />
                  </label>
                </div>
                <div class="field-grid field-grid--effect-check-row">
                  <label class="check-field ea-check-rect">
                    <input
                      type="checkbox"
                      :checked="!!selectedEffect.forced"
                      @change="event => patchSelectedEffectBool('forced', event.target.checked)"
                    />
                    <span>{{ fieldLabel('forced') }}</span>
                  </label>
                </div>
              </template>

              <template
                v-if="
                  selectedEffect.kind === 'damageHit' || selectedEffect.kind === 'damageOverTime'
                "
              >
                <div class="field-grid field-grid--effect-select-row">
                  <label class="field">
                    <span>{{ t('common.element') }}</span>
                    <el-select
                      :model-value="selectedEffect.element || 'physical'"
                      @update:model-value="value => patchSelectedEffect('element', value)"
                      size="small"
                      class="effect-select-dark"
                      popper-class="hit-editor-select-popper"
                    >
                      <el-option
                        v-for="element in DAMAGE_ELEMENTS"
                        :key="element"
                        :value="element"
                        :label="elementLabel(element)"
                      />
                    </el-select>
                  </label>
                  <label v-if="selectedEffect.kind === 'damageOverTime'" class="field">
                    <span>{{ fieldLabel('multiplierMode') }}</span>
                    <el-select
                      :model-value="selectedEffect.multiplierMode || ''"
                      @update:model-value="
                        value => patchSelectedEffect('multiplierMode', optionalString(value))
                      "
                      size="small"
                      class="effect-select-dark"
                      popper-class="hit-editor-select-popper"
                    >
                      <el-option value="" :label="t('common.default')" />
                      <el-option value="each" :label="multiplierModeLabel('each')" />
                      <el-option value="split" :label="multiplierModeLabel('split')" />
                    </el-select>
                  </label>
                </div>
                <div class="field-grid field-grid--effect-input-row">
                  <label class="field">
                    <span>{{ t('propertiesPanel.damage.tickMultiplier') }}</span>
                    <CustomNumberInput
                      :model-value="selectedEffect.multiplier || 0"
                      @update:model-value="value => patchSelectedEffectNumber('multiplier', value)"
                      :activeColor="'#ffd700'"
                    />
                  </label>
                  <label class="field">
                    <span>{{ t('common.triggerTime') }}</span>
                    <CustomNumberInput
                      :model-value="frameValue(selectedEffect.offset || 0)"
                      @update:model-value="
                        value => patchSelectedEffect('offset', timeValueFromFrame(value))
                      "
                      :min="0"
                      :step="1"
                      :activeColor="'#ffd700'"
                    />
                  </label>
                  <label v-if="selectedEffect.kind === 'damageOverTime'" class="field">
                    <span>{{ fieldLabel('interval') }}</span>
                    <CustomNumberInput
                      :model-value="selectedEffect.interval || 1"
                      @update:model-value="value => patchSelectedEffectNumber('interval', value)"
                      :min="0"
                      :activeColor="'#ffd700'"
                    />
                  </label>
                </div>
                <div class="field-grid field-grid--effect-check-row">
                  <label class="check-field ea-check-rect">
                    <input
                      type="checkbox"
                      :checked="!!selectedEffect.scaleByCrit"
                      @change="
                        event => patchSelectedEffectBool('scaleByCrit', event.target.checked)
                      "
                    />
                    <span>{{ fieldLabel('scaleByCrit') }}</span>
                  </label>
                  <label
                    v-if="selectedEffect.kind === 'damageOverTime'"
                    class="check-field ea-check-rect"
                  >
                    <input
                      type="checkbox"
                      :checked="!!selectedEffect.snapshot"
                      @change="event => patchSelectedEffectBool('snapshot', event.target.checked)"
                    />
                    <span>{{ fieldLabel('snapshot') }}</span>
                  </label>
                  <label
                    v-if="selectedEffect.kind === 'damageOverTime'"
                    class="check-field ea-check-rect"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedEffect.canCrit !== false"
                      @change="event => patchSelectedEffectBool('canCrit', event.target.checked)"
                    />
                    <span>{{ fieldLabel('canCrit') }}</span>
                  </label>
                  <label
                    v-if="selectedEffect.kind === 'damageOverTime'"
                    class="check-field ea-check-rect"
                  >
                    <input
                      type="checkbox"
                      :checked="!!selectedEffect.skipFirstTick"
                      @change="
                        event => patchSelectedEffectBool('skipFirstTick', event.target.checked)
                      "
                    />
                    <span>{{ fieldLabel('skipFirstTick') }}</span>
                  </label>
                  <label
                    v-if="selectedEffect.kind === 'damageOverTime'"
                    class="check-field ea-check-rect"
                  >
                    <input
                      type="checkbox"
                      :checked="!!selectedEffect.cancelOnRefresh"
                      @change="
                        event => patchSelectedEffectBool('cancelOnRefresh', event.target.checked)
                      "
                    />
                    <span>{{ fieldLabel('cancelOnRefresh') }}</span>
                  </label>
                </div>
              </template>

              <template
                v-if="
                  [
                    'spRecovery',
                    'spReturn',
                    'ultEnergyGain',
                    'oneTime',
                    'cooldownReductionFlat',
                    'cooldownReductionPercent',
                  ].includes(selectedEffect.kind)
                "
              >
                <div class="field-grid field-grid--effect-input-row">
                  <label class="field">
                    <span>{{ t('common.value') }}</span>
                    <CustomNumberInput
                      :model-value="selectedEffect.value || 0"
                      @update:model-value="value => patchSelectedEffectNumber('value', value)"
                      :activeColor="'#ffd700'"
                    />
                  </label>
                </div>
              </template>

              <template v-if="selectedEffect.kind === 'consume'">
                <div class="field-grid field-grid--effect-select-row">
                  <label class="field">
                    <span>{{ fieldLabel('consumeScope') }}</span>
                    <el-select
                      :model-value="selectedEffect.consumeScope || ''"
                      @update:model-value="
                        value => patchSelectedEffect('consumeScope', optionalString(value))
                      "
                      size="small"
                      class="effect-select-dark"
                      popper-class="hit-editor-select-popper"
                    >
                      <el-option value="" :label="t('common.default')" />
                      <el-option value="team" :label="consumeScopeLabel('team')" />
                    </el-select>
                  </label>
                </div>
                <div class="field-grid field-grid--effect-input-row">
                  <label class="field">
                    <span>{{ fieldLabel('consumeStacks') }}</span>
                    <CustomNumberInput
                      :model-value="selectedEffect.consumeStacks || 0"
                      @update:model-value="
                        value => patchSelectedEffectNumber('consumeStacks', value)
                      "
                      :min="0"
                      :activeColor="'#ffd700'"
                    />
                  </label>
                </div>
              </template>
            </div>

            <div class="json-grid">
              <label v-for="key in JSON_EFFECT_FIELDS" :key="key" class="json-field">
                <span>{{ fieldLabel(key) }}</span>
                <textarea
                  class="json-input"
                  :class="{ 'has-error': jsonErrors[jsonKey(selectedEffect._id, key)] }"
                  :value="jsonText(selectedEffect._id, selectedEffect, key)"
                  @input="event => patchSelectedEffectJson(key, event.target.value)"
                />
                <small v-if="jsonErrors[jsonKey(selectedEffect._id, key)]">{{
                  jsonErrors[jsonKey(selectedEffect._id, key)]
                }}</small>
              </label>
            </div>
          </div>

          <div v-else class="effect-detail effect-detail--empty">
            <div class="empty-hint">{{ t('hitEditor.noEffect') }}</div>
          </div>
        </div>
      </section>

      <section class="editor-section">
        <div class="section-title">{{ t('hitEditor.advanced') }}</div>
        <div class="json-grid">
          <label v-for="key in JSON_HIT_FIELDS" :key="key" class="json-field">
            <span>{{ fieldLabel(key) }}</span>
            <textarea
              class="json-input"
              :class="{ 'has-error': jsonErrors[jsonKey('hit', key)] }"
              :value="jsonText('hit', draft, key)"
              @input="event => patchHitJson(key, event.target.value)"
            />
            <small v-if="jsonErrors[jsonKey('hit', key)]">{{
              jsonErrors[jsonKey('hit', key)]
            }}</small>
          </label>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <button
          type="button"
          class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red"
          @click="emit('delete')"
        >
          {{ t('hitEditor.deleteHit') }}
        </button>
        <div class="spacer"></div>
        <button type="button" class="ea-btn ea-btn--sm ea-btn--glass-rect" @click="open = false">
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-gold"
          :disabled="hasJsonErrors"
          @click="save"
        >
          {{ t('hitEditor.save') }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.hit-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 72vh;
  overflow: auto;
  padding-right: 4px;
}

.editor-section {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(20, 22, 26, 0.82);
  padding: 12px;
  border-radius: 0;
}

.section-title {
  color: #ffd700;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.field-grid--select-row,
.field-grid--effect-select-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 10px;
}

.field-grid--input-row,
.field-grid--effect-input-row,
.field-grid--effect-text-row,
.field-grid--effect-check-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.field-grid--effect-select-row {
  margin-top: 0;
}

.effect-field-groups,
.kind-field-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kind-field-groups {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 10px;
}

.field,
.check-field,
.json-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  color: #cfd3dc;
  font-size: 11px;
}

.field.full {
  grid-column: span 2;
}

.check-field {
  flex-direction: row;
  align-items: center;
  min-height: 30px;
}

.simple-input,
.json-input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: #111;
  color: #f0f0f0;
  border-radius: 0;
  padding: 6px 8px;
  font-size: 12px;
}

.effect-select-dark {
  width: 100%;
}

.effect-select-dark,
.effect-layout,
.effect-list,
.effect-list-body,
.effect-row,
.effect-detail,
.add-effect-bar {
  box-sizing: border-box;
}

.simple-input {
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, rgba(255, 255, 255, 0.58) 50%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.58) 50%, transparent 50%);
  background-position:
    calc(100% - 13px) 50%,
    calc(100% - 8px) 50%;
  background-repeat: no-repeat;
  background-size:
    5px 5px,
    5px 5px;
}

input.simple-input,
textarea.json-input {
  background-image: none;
}

.simple-input:focus,
.json-input:focus {
  border-color: rgba(255, 215, 0, 0.62);
  outline: none;
  box-shadow: 0 0 0 1px rgba(255, 215, 0, 0.18);
}

.simple-input option {
  background: #23262d;
  color: #f0f0f0;
}

.json-input {
  min-height: 74px;
  resize: vertical;
  font-family: Consolas, 'Courier New', monospace;
}

.json-input.has-error {
  border-color: #ff7875;
}

.json-field small {
  color: #ff7875;
}

.effect-layout {
  display: grid;
  grid-template-columns: minmax(260px, 280px) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
  background: rgba(7, 8, 10, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px;
}

.effect-list {
  background: rgba(16, 18, 22, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-left: 3px solid rgba(255, 215, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 260px;
  min-width: 0;
  padding: 10px;
}

.effect-list-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.effect-row {
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-left: 3px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.035);
  color: #f0f0f0;
  cursor: pointer;
  display: flex;
  gap: 8px;
  min-height: 40px;
  text-align: left;
  padding: 6px;
  width: 100%;
}

.effect-row__delete {
  margin-left: auto;
}

.add-effect-bar {
  align-items: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0;
  color: #ffd700;
  cursor: pointer;
  display: flex;
  font-size: 11px;
  gap: 8px;
  justify-content: center;
  min-height: 30px;
  padding: 7px 8px;
  position: relative;
  width: 100%;
}

.add-effect-bar:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 215, 0, 0.8);
}

.effect-row.is-active {
  border-color: rgba(255, 215, 0, 0.7);
  border-left-color: #ffd700;
  background: rgba(255, 215, 0, 0.12);
}

.effect-row__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1 1 auto;
}

.effect-row__kind {
  display: block;
  color: #8aa4c8;
  font-size: 10px;
}

.effect-row__name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.effect-detail {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 3px solid rgba(138, 164, 200, 0.55);
  background: rgba(17, 19, 24, 0.94);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 260px;
  min-width: 0;
  padding: 12px;
}

.effect-detail--empty {
  align-items: center;
  justify-content: center;
  min-height: 180px;
}

.effect-pane-title {
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 215, 0, 0.92);
  display: flex;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  min-height: 22px;
  overflow: hidden;
  padding-bottom: 6px;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.dialog-footer {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dialog-footer .ea-btn svg {
  display: block;
}

.dialog-footer button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.json-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.spacer {
  flex: 1;
}

.empty-hint {
  color: #888;
  padding: 12px;
}

:global(.hit-editor-dialog.el-dialog),
:global(.hit-editor-dialog .el-dialog) {
  background: #23262d;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
  max-width: calc(100vw - 32px);
  overflow: hidden;
}

:global(.hit-editor-dialog.el-dialog .el-dialog__header),
:global(.hit-editor-dialog .el-dialog__header) {
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  margin: 0;
  padding: 14px 18px;
}

:global(.hit-editor-dialog.el-dialog .el-dialog__title),
:global(.hit-editor-dialog .el-dialog__title) {
  color: #f2f5f8;
  font-size: 14px;
  font-weight: 700;
}

:global(.hit-editor-dialog.el-dialog .el-dialog__headerbtn),
:global(.hit-editor-dialog .el-dialog__headerbtn) {
  height: 32px;
  top: 6px;
  width: 32px;
}

:global(.hit-editor-dialog.el-dialog .el-dialog__close),
:global(.hit-editor-dialog .el-dialog__close) {
  color: #cfd3dc;
}

:global(.hit-editor-dialog.el-dialog .el-dialog__close:hover),
:global(.hit-editor-dialog .el-dialog__close:hover) {
  color: #ffd700;
}

:global(.hit-editor-dialog.el-dialog .el-dialog__body),
:global(.hit-editor-dialog .el-dialog__body) {
  color: #e8edf5;
  padding: 14px 18px;
}

:global(.hit-editor-dialog.el-dialog .el-dialog__footer),
:global(.hit-editor-dialog .el-dialog__footer) {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 18px 14px;
}

:global(.hit-editor-dialog .el-select__wrapper) {
  background-color: #111;
  border-radius: 0;
  border: 1px solid #444;
  box-shadow: none;
  min-height: 31px;
}

:global(.hit-editor-dialog .custom-number-input),
:global(.hit-editor-dialog .custom-number-input:focus-within) {
  background-color: #111;
}

:global(.hit-editor-dialog input),
:global(.hit-editor-dialog select),
:global(.hit-editor-dialog textarea),
:global(.hit-editor-dialog .el-input__wrapper),
:global(.hit-editor-dialog .el-select__wrapper),
:global(.hit-editor-dialog .el-popper),
:global(.hit-editor-dialog .ea-btn) {
  border-radius: 0 !important;
}

:global(.hit-editor-dialog .el-select__wrapper.is-focused) {
  border-color: rgba(255, 215, 0, 0.72);
  box-shadow: none;
}

:global(.hit-editor-dialog .el-select__selected-item),
:global(.hit-editor-dialog .el-select__placeholder),
:global(.hit-editor-dialog .el-select__caret) {
  color: #f0f0f0;
}

:global(.hit-editor-select-popper.el-popper) {
  background: #111;
  border: 1px solid #444;
  border-radius: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.48);
}

:global(.hit-editor-select-popper .el-select-dropdown) {
  background: #111;
  border-radius: 0;
}

:global(.hit-editor-select-popper .el-select-dropdown__wrap),
:global(.hit-editor-select-popper .el-select-dropdown__list) {
  background: #111;
}

:global(.hit-editor-select-popper .el-select-dropdown__item) {
  color: #dce2ec;
  background: #111;
  font-size: 11px;
}

:global(.hit-editor-select-popper .el-select-dropdown__item.is-hovering),
:global(.hit-editor-select-popper .el-select-dropdown__item:hover) {
  background: rgba(255, 255, 255, 0.08);
}

:global(.hit-editor-select-popper .el-select-dropdown__item.is-selected) {
  color: #ffd700;
}

:global(.hit-editor-select-popper .el-select-group__title) {
  color: #8aa4c8;
  background: #111;
}

:global(.hit-editor-select-popper .el-popper__arrow::before) {
  background: #111;
  border-color: #444;
}

@media (max-width: 900px) {
  .field-grid,
  .json-grid,
  .effect-layout {
    grid-template-columns: 1fr;
  }
}
</style>
