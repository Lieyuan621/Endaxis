<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaInput } from '@/design-system';
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
import ReferenceField from './ReferenceField.vue';
import GameplayTagField from './GameplayTagField.vue';
import { validCollectionEntry, validStringCollection } from './stringCollection';
import type { StringCollectionKind } from './stringCollectionSchema';
const props = defineProps<{
  value: unknown;
  editable: boolean;
  label: string;
  required?: boolean;
  kind: StringCollectionKind;
  referenceKind?: string;
  referenceChoices?: ReferenceChoices;
}>();
const emit = defineEmits<{ change: [value: readonly string[] | undefined]; discard: [] }>();
const { t } = useI18n();
const editing = ref(false);
const draft = shallowRef<readonly string[] | undefined>();
const choice = ref('');
const error = ref('');
const awaiting = ref(false);
const revision = ref(0);
let session = 0;
const displayed = computed(() => (editing.value ? draft.value : props.value));
const rows = computed(() => (Array.isArray(displayed.value) ? displayed.value : []));
const invalidNative = computed(
  () => props.kind === 'nativeId' && !validStringCollection(displayed.value, undefined, 'nativeId'),
);
const validChoice = computed(() =>
  validCollectionEntry(choice.value, props.kind, props.referenceKind, props.referenceChoices),
);
function reset() {
  session++;
  editing.value = false;
  draft.value = undefined;
  choice.value = '';
  error.value = '';
  awaiting.value = false;
}
function begin() {
  if (!props.editable || editing.value) return;
  if (
    props.value !== undefined &&
    (!Array.isArray(props.value) || !props.value.every(item => typeof item === 'string'))
  ) {
    error.value = 'invalid';
    return;
  }
  session++;
  draft.value = props.value === undefined ? undefined : [...props.value];
  editing.value = true;
}
function discard() {
  reset();
  emit('discard');
}
function revise() {
  if (error.value === 'rejected') emit('discard');
  error.value = '';
}
function replace(index: number, value: string) {
  if (
    !props.editable ||
    !editing.value ||
    awaiting.value ||
    (props.kind === 'nativeId'
      ? typeof value !== 'string'
      : !validCollectionEntry(value, props.kind, props.referenceKind, props.referenceChoices))
  )
    return;
  revise();
  draft.value = rows.value.map((item, i) => (i === index ? value : item));
}
function add() {
  if (!props.editable || !editing.value || awaiting.value || !validChoice.value) return;
  revise();
  draft.value = [...(draft.value ?? []), choice.value];
  choice.value = '';
}
function remove(index: number) {
  if (!props.editable || !editing.value || awaiting.value) return;
  revise();
  revision.value++;
  draft.value = rows.value.filter((_, i) => i !== index);
}
function move(index: number, delta: number) {
  if (
    !props.editable ||
    !editing.value ||
    awaiting.value ||
    index + delta < 0 ||
    index + delta >= rows.value.length
  )
    return;
  revise();
  revision.value++;
  const copy = [...rows.value];
  const [item] = copy.splice(index, 1);
  copy.splice(index + delta, 0, item!);
  draft.value = copy;
}
function empty(unset = false) {
  if (
    !props.editable ||
    !editing.value ||
    awaiting.value ||
    (unset && (props.required || props.kind === 'nativeId'))
  )
    return;
  revise();
  draft.value = unset ? undefined : [];
}
async function apply() {
  if (!props.editable || !editing.value || awaiting.value) return;
  if (
    !(draft.value === undefined && !props.required && props.kind !== 'nativeId') &&
    !validStringCollection(
      draft.value,
      props.value,
      props.kind,
      props.referenceKind,
      props.referenceChoices,
    )
  ) {
    error.value = 'invalid';
    return;
  }
  if (JSON.stringify(draft.value) === JSON.stringify(props.value)) {
    reset();
    return;
  }
  const token = session;
  const next = draft.value;
  awaiting.value = true;
  emit('change', next);
  await nextTick();
  if (!editing.value || token !== session) return;
  if (JSON.stringify(props.value) === JSON.stringify(next)) reset();
  else {
    awaiting.value = false;
    error.value = 'rejected';
  }
}
watch(() => [props.value, props.editable, props.kind, props.referenceKind], reset);
</script>
<template>
  <div
    data-string-collection
    :data-collection-kind="kind"
    class="string-collection"
    :aria-label="label"
    @keydown.esc.prevent.stop="discard"
  >
    <small>{{ t('stringCollection.orderHint') }}</small>
    <small v-if="kind === 'nativeId'" role="status">{{ t('stringCollection.nativeIdHint') }}</small>
    <div
      v-for="(item, index) in rows"
      :key="`${session}:${revision}:${index}`"
      class="string-collection__row"
    >
      <span>{{ index + 1 }}.</span>
      <small v-if="typeof item !== 'string'" role="alert"
        >{{ t('stringCollection.invalid') }} {{ String(item) }}</small
      >
      <ReferenceField
        v-else-if="kind === 'reference'"
        :value="item"
        :label="`${label} ${index + 1}`"
        :reference-kind="referenceKind!"
        :choices="referenceChoices?.[referenceKind ?? '']"
        :disabled="!editing || !editable || awaiting"
        @change="replace(index, $event)"
      />
      <EaInput
        v-else-if="kind === 'nativeId'"
        data-native-id
        type="textarea"
        :model-value="item"
        :aria-label="`${label} ${index + 1}`"
        :invalid="!item.length"
        :disabled="!editing || !editable || awaiting"
        @update:model-value="replace(index, $event)"
      />
      <GameplayTagField
        v-else
        :value="item"
        :label="`${label} ${index + 1}`"
        :disabled="!editing || !editable || awaiting"
        @change="replace(index, $event)"
      />
      <small v-if="kind === 'nativeId' && typeof item === 'string'" data-native-id-raw>{{
        JSON.stringify(item)
      }}</small>
      <template v-if="editing && editable">
        <EaButton
          :disabled="index === 0 || awaiting"
          :aria-label="t('conditionList.moveUpLabel', { index: index + 1 })"
          @click="move(index, -1)"
          >↑</EaButton
        >
        <EaButton
          :disabled="index === rows.length - 1 || awaiting"
          :aria-label="t('conditionList.moveDownLabel', { index: index + 1 })"
          @click="move(index, 1)"
          >↓</EaButton
        >
        <EaButton
          :disabled="awaiting"
          :aria-label="t('conditionList.removeLabel', { index: index + 1 })"
          @click="remove(index)"
          >{{ t('common.delete') }}</EaButton
        >
      </template>
    </div>
    <small v-if="!rows.length">{{
      t(displayed === undefined ? 'fieldReference.unset' : 'stringCollection.empty')
    }}</small>
    <EaButton v-if="!editing && editable" @click="begin">{{ t('stringCollection.edit') }}</EaButton>
    <template v-if="editing && editable">
      <ReferenceField
        v-if="kind === 'reference'"
        :value="choice"
        :label="t('stringCollection.newEntry')"
        :reference-kind="referenceKind!"
        :choices="referenceChoices?.[referenceKind ?? '']"
        :disabled="awaiting"
        @change="choice = $event"
      />
      <EaInput
        v-else-if="kind === 'nativeId'"
        v-model="choice"
        type="textarea"
        :aria-label="t('stringCollection.newEntry')"
        :disabled="awaiting"
      />
      <GameplayTagField
        v-else
        :value="choice"
        :label="t('stringCollection.newEntry')"
        :disabled="awaiting"
        @change="choice = $event"
      />
      <div class="string-collection__actions">
        <EaButton :disabled="!validChoice || awaiting" @click="add">{{
          t('definitionEditor.add')
        }}</EaButton>
        <EaButton :disabled="awaiting" @click="empty()">{{
          t('stringCollection.setEmpty')
        }}</EaButton>
        <EaButton
          v-if="!required && kind !== 'nativeId'"
          :disabled="awaiting"
          @click="empty(true)"
          >{{ t('actionGraphEditor.unset') }}</EaButton
        >
        <EaButton :disabled="awaiting" @click="apply">{{ t('graphDataInput.apply') }}</EaButton>
        <EaButton @click="discard">{{ t('graphDataInput.cancel') }}</EaButton>
      </div>
    </template>
    <small v-if="invalidNative" role="alert">{{ t('stringCollection.invalidNativeId') }}</small>
    <small v-if="error && !(invalidNative && error === 'invalid')" role="alert">{{
      t(`stringCollection.${error}`)
    }}</small>
  </div>
</template>
<style scoped>
.string-collection {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.string-collection__row,
.string-collection__actions {
  display: flex;
  align-items: start;
  gap: 6px;
  flex-wrap: wrap;
}
.string-collection__row > div {
  flex: 1;
}
.string-collection [role='alert'] {
  color: var(--ea-danger);
}
</style>
