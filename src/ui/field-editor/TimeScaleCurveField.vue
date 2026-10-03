<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaInput, EaSelect, type EaSelectValue } from '@/design-system';
import type {
  TimeScaleCurveDefinition,
  TimeScaleCurveKeyDefinition,
} from '../../../packages/game-data-contract/src/conditions';
import { useTimeScaleCurveCatalog } from './timeScaleCurveCatalog';
import {
  assertTimeScaleCurveSelection,
  newTimeScaleCurveKey,
  switchTimeScaleCurveBranch,
} from './timeScaleCurveValue';
import { sameStructuredValue } from './structuredValue';
import { timeScaleCurvePreview, TIME_SCALE_CURVE_PREVIEW_MAX_KEYS } from './timeScaleCurvePreview';

const props = defineProps<{ value: unknown; editable: boolean; label: string; staged?: boolean }>();
const emit = defineEmits<{ change: [value: TimeScaleCurveDefinition]; discard: [] }>();
const { t, te } = useI18n();
const catalog = useTimeScaleCurveCatalog();
const editing = ref(false);
const draft = shallowRef<unknown>();
const error = ref('');
const awaitingAcceptance = ref(false);
const page = ref(0);
const search = ref('');
const rawInputs = ref<Record<string, string>>({});
const tangentNumbers = new Map<string, number>();
let session = 0;
const PAGE_SIZE = 12;
const shown = computed(() => (editing.value ? draft.value : props.value));
function asCurve(value: unknown): TimeScaleCurveDefinition | undefined {
  if (!value || typeof value !== 'object') return;
  const curve = value as TimeScaleCurveDefinition;
  if (curve.kind === 'named' && typeof curve.key === 'string') return curve;
  if (
    curve.kind === 'inline' &&
    Array.isArray(curve.keys) &&
    curve.keys.every(key => key && typeof key === 'object' && !Array.isArray(key))
  )
    return curve;
}
const curve = computed(() => asCurve(shown.value));
const keys = computed(() => (curve.value?.kind === 'inline' ? curve.value.keys : []));
const visibleKeys = computed(() =>
  keys.value
    .slice(page.value * PAGE_SIZE, (page.value + 1) * PAGE_SIZE)
    .map((key, index) => ({ key, index: index + page.value * PAGE_SIZE })),
);
const namedKey = computed(() => (curve.value?.kind === 'named' ? curve.value.key : ''));
const knownName = computed(() => Object.hasOwn(catalog.value, namedKey.value));
const candidates = computed(() => {
  const all = Object.keys(catalog.value);
  const selected = namedKey.value;
  return [
    ...new Set([
      ...(selected ? [selected] : []),
      ...all.filter(key => key.toLowerCase().includes(search.value.toLowerCase())).slice(0, 50),
    ]),
  ].map(key => ({ value: key, label: key, disabled: !Object.hasOwn(catalog.value, key) }));
});
const preview = computed(() => {
  try {
    if (!curve.value) return { error: 'timeScaleCurve.invalid' };
    const source =
      curve.value.kind === 'inline'
        ? curve.value.keys
        : knownName.value
          ? catalog.value[curve.value.key]
          : undefined;
    if (!source) return { error: 'timeScaleCurve.unknownName' };
    if (source.length > TIME_SCALE_CURVE_PREVIEW_MAX_KEYS)
      return { error: 'timeScaleCurve.previewLimit' };
    assertTimeScaleCurveSelection(shown.value, shown.value, catalog.value);
    return { value: timeScaleCurvePreview(source) };
  } catch (cause) {
    return { error: cause instanceof Error ? cause.message : String(cause) };
  }
});
function px(time: number) {
  const x = preview.value.value!.x;
  return 42 + ((time - x[0]) / (x[1] - x[0])) * 330;
}
function py(value: number) {
  const y = preview.value.value!.y;
  return 160 - ((value - y[0]) / (y[1] - y[0])) * 140;
}
function displayError(message: string) {
  return te(message) ? t(message) : message;
}
function reset() {
  session++;
  branchDrafts.clear();
  editing.value = false;
  draft.value = undefined;
  error.value = '';
  awaitingAcceptance.value = false;
  rawInputs.value = {};
  tangentNumbers.clear();
  page.value = 0;
  search.value = '';
}
function begin() {
  if (!props.editable || editing.value) return;
  session++;
  draft.value = props.value;
  editing.value = true;
  error.value = '';
}
function discard() {
  reset();
  emit('discard');
}
function change(next: unknown) {
  if (!props.editable || !editing.value || awaitingAcceptance.value) return;
  if (error.value === 'timeScaleCurve.rejected') emit('discard');
  error.value = '';
  draft.value = next;
}
const branchDrafts = new Map<'named' | 'inline', unknown>();
function chooseBranch(value: EaSelectValue | EaSelectValue[]) {
  if (
    !props.editable ||
    !editing.value ||
    awaitingAcceptance.value ||
    (value !== 'named' && value !== 'inline')
  )
    return;
  if (curve.value) branchDrafts.set(curve.value.kind, draft.value);
  change(branchDrafts.get(value) ?? switchTimeScaleCurveBranch(draft.value, value));
  rawInputs.value = {};
  page.value = 0;
}
function chooseName(value: EaSelectValue | EaSelectValue[]) {
  if (typeof value !== 'string' || curve.value?.kind !== 'named') return;
  change({ ...curve.value, key: value });
}
function updateKey(index: number, field: keyof TimeScaleCurveKeyDefinition, value: number) {
  if (curve.value?.kind !== 'inline' || !keys.value[index]) return;
  change({
    ...curve.value,
    keys: keys.value.map((key, i) => (i === index ? { ...key, [field]: value } : key)),
  });
}
function inputNumber(index: number, field: keyof TimeScaleCurveKeyDefinition, text: string) {
  if (!props.editable || !editing.value || awaitingAcceptance.value) return;
  rawInputs.value[`${index}.${field}`] = text;
  const parsed = text.trim() ? Number(text) : NaN;
  updateKey(index, field, Number.isFinite(parsed) ? parsed : NaN);
}
function numberText(index: number, field: keyof TimeScaleCurveKeyDefinition, value: number) {
  return rawInputs.value[`${index}.${field}`] ?? String(value ?? '');
}
function tangentMode(value: number): string {
  return value === Infinity ? 'positive' : value === -Infinity ? 'negative' : 'finite';
}
function chooseTangent(
  index: number,
  field: 'inTangent' | 'outTangent',
  mode: EaSelectValue | EaSelectValue[],
) {
  if (!props.editable || !editing.value || awaitingAcceptance.value) return;
  const key = keys.value[index];
  if (!key || !['finite', 'positive', 'negative'].includes(String(mode))) return;
  const name = `${index}.${field}`;
  if (Number.isFinite(key[field])) tangentNumbers.set(name, key[field]);
  delete rawInputs.value[name];
  updateKey(
    index,
    field,
    mode === 'positive'
      ? Infinity
      : mode === 'negative'
        ? -Infinity
        : (tangentNumbers.get(name) ?? 0),
  );
}
function addKey() {
  if (curve.value?.kind !== 'inline') return;
  change({ ...curve.value, keys: [...keys.value, newTimeScaleCurveKey(keys.value)] });
  page.value = Math.floor((keys.value.length - 1) / PAGE_SIZE);
}
function removeKey(index: number) {
  if (curve.value?.kind !== 'inline') return;
  change({ ...curve.value, keys: keys.value.filter((_, i) => i !== index) });
  rawInputs.value = {};
  tangentNumbers.clear();
  page.value = Math.min(page.value, Math.max(0, Math.ceil(keys.value.length / PAGE_SIZE) - 1));
}
async function apply() {
  if (!props.editable || !editing.value || awaitingAcceptance.value) return;
  try {
    assertTimeScaleCurveSelection(props.value, draft.value, catalog.value);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause);
    return;
  }
  if (sameStructuredValue(props.value, draft.value)) {
    reset();
    return;
  }
  const applying = session;
  const next = draft.value;
  awaitingAcceptance.value = true;
  emit('change', next);
  await nextTick();
  if (!editing.value || applying !== session) return;
  if (sameStructuredValue(props.value, next)) reset();
  else {
    awaitingAcceptance.value = false;
    error.value = 'timeScaleCurve.rejected';
  }
}
watch(
  () => [props.value, props.editable],
  () => {
    branchDrafts.clear();
    reset();
  },
);
</script>

<template>
  <section
    class="time-scale-curve"
    data-time-scale-curve
    :data-curve-kind="curve?.kind ?? 'unset'"
    @keydown.esc.prevent.stop="discard"
  >
    <label v-if="editing" class="time-scale-curve__branch">
      <span>{{ t('timeScaleCurve.branch') }}</span>
      <EaSelect
        :aria-label="`${label}: ${t('timeScaleCurve.branch')}`"
        :model-value="curve?.kind ?? ''"
        :disabled="!editable || awaitingAcceptance"
        :options="[
          { value: '', label: t('definitionEditor.chooseValue'), disabled: true },
          { value: 'named', label: t('timeScaleCurve.named') },
          { value: 'inline', label: t('timeScaleCurve.inline') },
        ]"
        @change="chooseBranch"
      />
    </label>
    <strong v-else-if="curve">{{ t(`timeScaleCurve.${curve.kind}`) }}</strong>
    <div v-if="curve?.kind === 'named'">
      <template v-if="editing">
        <EaInput
          :model-value="search"
          :disabled="!editable || awaitingAcceptance"
          :aria-label="t('timeScaleCurve.search')"
          @input="search = $event"
        />
        <EaSelect
          :model-value="namedKey"
          :disabled="!editable || awaitingAcceptance"
          :aria-label="t('timeScaleCurve.name')"
          :options="[
            { value: '', label: t('definitionEditor.chooseValue'), disabled: true },
            ...candidates,
          ]"
          @change="chooseName"
        />
      </template>
      <span v-else>{{ namedKey }}</span>
      <small v-if="!knownName" role="status">{{ t('timeScaleCurve.unknownName') }}</small>
    </div>
    <div v-if="curve?.kind === 'inline'" class="time-scale-curve__table-scroll">
      <table>
        <caption>
          {{
            t('timeScaleCurve.keyTable')
          }}
        </caption>
        <thead>
          <tr>
            <th>#</th>
            <th
              v-for="field in [
                'time',
                'value',
                'inTangent',
                'outTangent',
                'weightedMode',
                'inWeight',
                'outWeight',
              ]"
              :key="field"
            >
              {{ t(`timeScaleCurve.${field}`) }}
            </th>
            <th v-if="editing">{{ t('timeScaleCurve.remove') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="{ key, index } in visibleKeys" :key="index" :data-curve-key="index">
            <th>{{ index + 1 }}</th>
            <td
              v-for="field in [
                'time',
                'value',
                'inTangent',
                'outTangent',
                'weightedMode',
                'inWeight',
                'outWeight',
              ] as const"
              :key="field"
            >
              <template v-if="editing">
                <EaSelect
                  v-if="field === 'weightedMode'"
                  :aria-label="`${index + 1}: ${t(`timeScaleCurve.${field}`)}`"
                  :model-value="key[field]"
                  :disabled="!editable || awaitingAcceptance"
                  :options="
                    [0, 1, 2, 3].map(value => ({ value, label: t(`timeScaleCurve.mode${value}`) }))
                  "
                  @change="updateKey(index, field, Number($event))"
                />
                <template v-else-if="field === 'inTangent' || field === 'outTangent'">
                  <EaSelect
                    :aria-label="`${index + 1}: ${t(`timeScaleCurve.${field}`)} ${t('timeScaleCurve.mode')}`"
                    :model-value="tangentMode(key[field])"
                    :disabled="!editable || awaitingAcceptance"
                    :options="[
                      { value: 'finite', label: t('timeScaleCurve.finite') },
                      { value: 'positive', label: '+Infinity' },
                      { value: 'negative', label: '-Infinity' },
                    ]"
                    @change="chooseTangent(index, field, $event)"
                  />
                  <EaInput
                    v-if="tangentMode(key[field]) === 'finite'"
                    type="number"
                    step="any"
                    :aria-label="`${index + 1}: ${t(`timeScaleCurve.${field}`)}`"
                    :model-value="numberText(index, field, key[field])"
                    :disabled="!editable || awaitingAcceptance"
                    @input="inputNumber(index, field, $event)"
                  />
                </template>
                <EaInput
                  v-else
                  type="number"
                  step="any"
                  :aria-label="`${index + 1}: ${t(`timeScaleCurve.${field}`)}`"
                  :model-value="numberText(index, field, key[field])"
                  :disabled="!editable || awaitingAcceptance"
                  @input="inputNumber(index, field, $event)"
                />
              </template>
              <span v-else>{{ String(key[field]) }}</span>
            </td>
            <td v-if="editing">
              <EaButton
                :disabled="!editable || awaitingAcceptance"
                size="sm"
                @click="removeKey(index)"
                >{{ t('timeScaleCurve.remove') }}</EaButton
              >
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="keys.length > PAGE_SIZE" class="time-scale-curve__actions">
        <EaButton size="sm" :disabled="page === 0" @click="page--">{{
          t('timeScaleCurve.previous')
        }}</EaButton>
        <span>{{ page + 1 }} / {{ Math.ceil(keys.length / PAGE_SIZE) }}</span>
        <EaButton size="sm" :disabled="(page + 1) * PAGE_SIZE >= keys.length" @click="page++">{{
          t('timeScaleCurve.next')
        }}</EaButton>
      </div>
      <EaButton
        v-if="editing"
        size="sm"
        :disabled="!editable || awaitingAcceptance"
        @click="addKey"
        >{{ t('timeScaleCurve.addKey') }}</EaButton
      >
    </div>
    <figure v-if="preview.value" class="time-scale-curve__preview">
      <svg
        viewBox="0 0 400 205"
        role="img"
        :aria-label="t('timeScaleCurve.preview')"
        data-curve-preview
      >
        <path d="M42 20V160H372" fill="none" stroke="currentColor" />
        <polyline
          v-for="(path, index) in preview.value.paths"
          :key="index"
          :points="path.map(point => `${px(point.time)},${py(point.value)}`).join(' ')"
          fill="none"
          stroke="var(--ea-accent, #56aaff)"
          stroke-width="2"
        />
        <template v-for="(jump, index) in preview.value.jumps" :key="`jump${index}`">
          <circle
            :cx="px(jump.time)"
            :cy="py(jump.left)"
            r="3"
            fill="var(--ea-bg, white)"
            stroke="currentColor"
          />
          <circle
            :cx="px(jump.time)"
            :cy="py(jump.right)"
            r="3"
            fill="var(--ea-bg, white)"
            stroke="currentColor"
          />
        </template>
        <circle
          v-for="(point, index) in preview.value.keys"
          :key="`key${index}`"
          :cx="px(point.time)"
          :cy="py(point.value)"
          r="2.5"
          fill="currentColor"
        />
        <text x="42" y="176">{{ preview.value.x[0] }}</text>
        <text x="372" y="176" text-anchor="end">{{ preview.value.x[1] }}</text>
        <text x="38" y="25" text-anchor="end">{{ preview.value.y[1].toPrecision(3) }}</text>
        <text x="38" y="160" text-anchor="end">{{ preview.value.y[0].toPrecision(3) }}</text>
        <text x="207" y="197" text-anchor="middle">{{ t('timeScaleCurve.xAxis') }}</text>
      </svg>
      <figcaption>
        {{ t('timeScaleCurve.yAxis') }} · {{ t('timeScaleCurve.previewHint') }}
      </figcaption>
    </figure>
    <small v-else role="status">{{ displayError(preview.error!) }}</small>
    <EaButton v-if="!editing && editable" size="sm" @click="begin">{{
      t('timeScaleCurve.edit')
    }}</EaButton>
    <div v-if="editing && editable" class="time-scale-curve__actions">
      <EaButton size="sm" :disabled="awaitingAcceptance" @click="apply">{{
        t(staged ? 'structuredValue.stage' : 'definitionEditor.applyValue')
      }}</EaButton>
      <EaButton size="sm" @click="discard">{{ t('common.cancel') }}</EaButton>
      <small v-if="staged">{{ t('structuredValue.stageHint') }}</small>
    </div>
    <small v-if="error" role="alert">{{ displayError(error) }}</small>
  </section>
</template>
<style scoped>
.time-scale-curve {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.time-scale-curve__table-scroll {
  overflow-x: auto;
}
table {
  border-collapse: collapse;
  width: 100%;
  font-size: 12px;
}
th,
td {
  padding: 5px;
  text-align: left;
  border-bottom: 1px solid var(--ea-border-soft);
}
td .ea-input,
td .ea-select {
  min-width: 90px;
}
caption {
  text-align: left;
  color: var(--ea-fg-muted);
}
.time-scale-curve__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.time-scale-curve__preview {
  margin: 0;
  max-width: 520px;
}
svg {
  width: 100%;
  max-height: 240px;
  color: var(--ea-fg-muted);
  font-size: 10px;
}
figcaption,
small {
  color: var(--ea-fg-muted);
  font-size: 12px;
}
[role='alert'] {
  color: var(--ea-danger);
}
</style>
