<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { EaButton, EaDialog, EaInput } from '@/design-system';
import {
  contingencyContractSeasons,
  contingencyContractTags,
} from '../../../data/contingencyContract/contingencyContractCatalog';
import { contingencyContractShareLayouts } from '../../../data/contingencyContract/shareLayouts.generated';
import {
  decodeContractShareCode,
  encodeContractShareCode,
  replaceContractSeasonSelection,
} from '../../../data/contingencyContract/shareCode';

const props = defineProps<{
  season: number;
  selectedTagIds: readonly number[];
  readOnly?: boolean;
}>();
const emit = defineEmits<{
  import: [tagIds: readonly number[], resetParameterTagIds: readonly number[]];
}>();
const { t } = useI18n({ useScope: 'global' });
const visible = ref(false);
const input = ref('');
const feedback = ref('');
const copyPending = ref(false);
const layout = computed(() =>
  contingencyContractShareLayouts.find(
    layout =>
      layout.gameId ===
      contingencyContractSeasons.find(season => season.id === props.season)?.gameId,
  ),
);
const tags = computed(() => contingencyContractTags.filter(tag => tag.season === props.season));
const ids = computed(() => new Set(tags.value.map(tag => tag.tagId)));
const decoded = computed(() =>
  layout.value ? decodeContractShareCode(layout.value, tags.value, input.value) : undefined,
);
const shareCode = computed(() =>
  layout.value
    ? encodeContractShareCode(
        layout.value,
        props.selectedTagIds.filter(id => ids.value.has(id)),
      )
    : '',
);
const score = computed(() =>
  tags.value
    .filter(tag => props.selectedTagIds.includes(tag.tagId))
    .reduce((sum, tag) => sum + tag.score, 0),
);
async function copy(): Promise<void> {
  if (!layout.value || copyPending.value) return;
  copyPending.value = true;
  try {
    await navigator.clipboard.writeText(`<${shareCode.value}>`);
    feedback.value = t('contingencyContract.share.copied');
  } catch {
    feedback.value = t('contingencyContract.share.copyFailed');
  } finally {
    copyPending.value = false;
  }
}
function importCode(): void {
  if (props.readOnly || !decoded.value?.ok) return;
  emit(
    'import',
    replaceContractSeasonSelection(props.selectedTagIds, ids.value, decoded.value.tagIds),
    decoded.value.tagIds,
  );
  input.value = '';
  feedback.value = '';
  ElMessage.success(t('contingencyContract.share.imported'));
}
</script>

<template>
  <span class="cc-share-entry">
    <EaButton
      size="sm"
      class="cc-share-trigger"
      @click="
        visible = true;
        feedback = '';
        input = '';
      "
      >{{ t('contingencyContract.share.open') }}</EaButton
    >
    <EaDialog v-model="visible" :title="t('contingencyContract.share.title')" width="640px">
      <div class="cc-share-sections">
        <section class="cc-share-section">
          <h3>{{ t('contingencyContract.share.generate') }}</h3>
          <div class="cc-share-score">
            <strong>{{ score }}</strong
            ><span>{{ t('contingencyContract.share.total') }}</span>
          </div>
          <div class="cc-share-row">
            <EaInput
              :model-value="shareCode"
              readonly
              :aria-label="t('contingencyContract.share.generate')"
            />
            <EaButton :disabled="!layout || copyPending" @click="copy">{{
              t('contingencyContract.share.copy')
            }}</EaButton>
          </div>
        </section>
        <section class="cc-share-section">
          <h3>{{ t('contingencyContract.share.importTitle') }}</h3>
          <p>{{ t('contingencyContract.share.importHint') }}</p>
          <div class="cc-share-row">
            <EaInput
              v-model="input"
              :disabled="readOnly"
              :placeholder="t('contingencyContract.share.placeholder')"
              :aria-label="t('contingencyContract.share.placeholder')"
              @update:model-value="feedback = ''"
              @keyup.enter="importCode"
            />
            <EaButton variant="primary" :disabled="readOnly || !decoded?.ok" @click="importCode">{{
              t('contingencyContract.share.import')
            }}</EaButton>
          </div>
          <p v-if="input && decoded && !decoded.ok" class="cc-share-error" role="alert">
            {{ t(`contingencyContract.share.errors.${decoded.error}`) }}
          </p>
          <p v-else-if="input && decoded?.ok">
            {{
              t('contingencyContract.share.preview', {
                score: decoded.score,
                count: decoded.tagIds.length,
              })
            }}
          </p>
        </section>
      </div>
      <p class="cc-share-note" aria-live="polite">
        {{ feedback || t('contingencyContract.share.hint') }}
      </p>
    </EaDialog>
  </span>
</template>
<style scoped>
.cc-share-entry {
  display: inline-flex;
}
.cc-share-trigger {
  height: 22px;
  font-size: 10px;
}
.cc-share-sections {
  display: grid;
  gap: 16px;
}
.cc-share-section {
  padding: 16px;
  border: 1px solid var(--ea-border);
  background: var(--ea-control-bg);
}
.cc-share-section h3 {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--ea-gold);
}
.cc-share-section p,
.cc-share-note {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ea-fg-muted);
}
.cc-share-section p + .cc-share-row {
  margin-top: 12px;
}
.cc-share-score {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}
.cc-share-score strong {
  font-size: 26px;
  color: var(--ea-fg);
}
.cc-share-score span {
  font-size: 12px;
  color: var(--ea-fg-muted);
}
.cc-share-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}
.cc-share-row > button {
  min-width: 72px;
}
.cc-share-section .cc-share-error {
  color: var(--ea-danger);
}
</style>
