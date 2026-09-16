<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaDialog, EaFormField, EaInput, EaNumberInput } from '@/design-system';

export type ExportScenarioScope = 'current' | 'all';

interface ExportFilePayload {
  filename: string;
  duration: number;
}

interface ExportDataPayload {
  filename: string;
  scope: ExportScenarioScope;
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    currentScenarioName?: string;
    scenarioCount?: number;
    maxDuration?: number;
  }>(),
  {
    modelValue: false,
    currentScenarioName: '',
    scenarioCount: 1,
    maxDuration: 120,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'export-json': [payload: ExportDataPayload];
  'copy-code': [payload: { scope: ExportScenarioScope }];
  'export-small-image': [payload: ExportFilePayload];
  'export-long-image': [payload: ExportFilePayload];
}>();

const { t } = useI18n({ useScope: 'global' });
const dataScope = ref<ExportScenarioScope>('all');
const form = ref({ filename: '', duration: 60 });

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
});

const dataScopeSummary = computed(() =>
  dataScope.value === 'current'
    ? t('timeline.export.currentScenarioName', {
        name: props.currentScenarioName || t('timeline.scenario.unnamed'),
      })
    : t('timeline.export.allScenariosCount', { count: props.scenarioCount }),
);

const imageScopeSummary = computed(() =>
  t('timeline.export.currentScenarioName', {
    name: props.currentScenarioName || t('timeline.scenario.unnamed'),
  }),
);

watch(
  () => props.modelValue,
  open => {
    if (!open) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    dataScope.value = 'all';
    form.value = {
      filename: `Endaxis_Timeline_${dateStr}`,
      duration: Math.min(60, Math.max(10, Math.round(Number(props.maxDuration) || 120))),
    };
  },
  { immediate: true },
);

function filePayload(): ExportFilePayload {
  return {
    filename: form.value.filename,
    duration: form.value.duration,
  };
}
</script>

<template>
  <EaDialog
    v-model="visible"
    :title="t('timeline.export.dialogTitle')"
    width="680px"
    align-center
    class="custom-dialog export-dialog-shell"
  >
    <div class="export-dialog-content">
      <EaFormField
        control-id="export-filename"
        :label="t('timeline.export.filenameLabel')"
        :hint="t('timeline.export.filenameHint')"
      >
        <EaInput
          v-model="form.filename"
          :placeholder="t('timeline.export.filenamePlaceholder')"
          size="md"
        />
      </EaFormField>

      <section class="export-section export-section--data">
        <header class="export-section__header">
          <div>
            <h3>{{ t('timeline.export.dataSectionTitle') }}</h3>
            <p>{{ dataScopeSummary }}</p>
          </div>
        </header>

        <div class="export-scope" role="radiogroup" :aria-label="t('timeline.export.scopeLabel')">
          <EaButton
            size="sm"
            type="button"
            role="radio"
            :aria-checked="dataScope === 'current'"
            :pressed="dataScope === 'current'"
            @click="dataScope = 'current'"
          >
            {{ t('timeline.export.scopeCurrent') }}
          </EaButton>
          <EaButton
            size="sm"
            type="button"
            role="radio"
            :aria-checked="dataScope === 'all'"
            :pressed="dataScope === 'all'"
            @click="dataScope = 'all'"
          >
            {{ t('timeline.export.scopeAll') }}
          </EaButton>
        </div>

        <div class="export-actions-grid">
          <EaButton
            class="export-action-card"
            size="lg"
            type="button"
            @click="emit('export-json', { filename: form.filename, scope: dataScope })"
          >
            <span class="export-action-card__icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="square"
                stroke-linejoin="miter"
              >
                <path d="M5 2.5h8l5 5v14H5zM13 2.5v5h5" />
                <path
                  d="M10 10H9c-.7 0-1 .3-1 1v1c0 .7-.3 1-1 1 .7 0 1 .3 1 1v1c0 .7.3 1 1 1h1M14 10h1c.7 0 1 .3 1 1v1c0 .7.3 1 1 1-.7 0-1 .3-1 1v1c0 .7-.3 1-1 1h-1"
                />
              </svg>
            </span>
            <span class="export-action-card__body">
              <strong>{{ t('timeline.export.exportJson') }}</strong>
              <small>{{ t('timeline.export.exportJsonDescription') }}</small>
            </span>
          </EaButton>

          <EaButton
            class="export-action-card"
            size="lg"
            type="button"
            @click="emit('copy-code', { scope: dataScope })"
          >
            <span class="export-action-card__icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="square"
                stroke-linejoin="miter"
              >
                <path d="M6 16H3V3h13v3" />
                <rect x="7" y="7" width="14" height="14" />
                <path d="M11 12h6M11 16h6" />
              </svg>
            </span>
            <span class="export-action-card__body">
              <strong>{{ t('timeline.export.copyCode') }}</strong>
              <small>{{ t('timeline.export.copyCodeDescription') }}</small>
            </span>
          </EaButton>
        </div>
      </section>

      <section class="export-section export-section--image">
        <header class="export-section__header">
          <div>
            <h3>{{ t('timeline.export.imageSectionTitle') }}</h3>
            <p>{{ imageScopeSummary }}</p>
          </div>
        </header>

        <EaFormField
          control-id="export-duration"
          :label="t('timeline.export.durationLabel')"
          :hint="t('timeline.export.durationHintMax', { max: maxDuration })"
        >
          <EaNumberInput
            v-model="form.duration"
            :min="10"
            :max="maxDuration"
            :step="10"
            :precision="0"
            size="md"
            style="width: 100%"
          />
        </EaFormField>

        <div class="export-actions-grid">
          <EaButton
            class="export-action-card"
            size="lg"
            type="button"
            @click="emit('export-small-image', filePayload())"
          >
            <span class="export-action-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="4" width="18" height="16" />
                <circle cx="9" cy="9" r="2" />
                <path d="m4 17 5-5 3 3 2-2 6 5" />
              </svg>
            </span>
            <span class="export-action-card__body">
              <strong>{{ t('timeline.export.exportSmallImage') }}</strong>
              <small>{{ t('timeline.export.exportSmallImageDescription') }}</small>
            </span>
          </EaButton>

          <EaButton
            class="export-action-card"
            size="lg"
            type="button"
            @click="emit('export-long-image', filePayload())"
          >
            <span class="export-action-card__icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="square"
                stroke-linejoin="miter"
              >
                <rect x="2" y="5" width="20" height="14" />
                <path d="M5 9h14M5 15h3v-4h4v6h3v-3h4" />
              </svg>
            </span>
            <span class="export-action-card__body">
              <strong>{{ t('timeline.export.exportImage') }}</strong>
              <small>{{ t('timeline.export.exportImageDescription') }}</small>
            </span>
          </EaButton>
        </div>
      </section>
    </div>
  </EaDialog>
</template>

<style scoped>
.export-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.export-section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  overflow: hidden;
  border: 1px solid var(--ea-border);
  background: var(--ea-surface-soft);
}

.export-section::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background: var(--ea-gold);
  content: '';
  opacity: 0.7;
}

.export-section__header h3,
.export-section__header p {
  margin: 0;
}

.export-section__header h3 {
  color: var(--ea-fg);
  font-size: 14px;
  line-height: 1.4;
}

.export-section__header p {
  margin-top: 3px;
  color: var(--ea-fg-muted);
  font-size: 11px;
  line-height: 1.4;
}

.export-scope {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-muted);
}

.export-scope :deep(.ea-button) {
  --ea-control-pressed-border-hover: transparent;
  --ea-control-pressed-bg-hover: transparent;
  --ea-control-pressed-fg-hover: var(--ea-gold);

  width: 100%;
  border-color: transparent;
  background: transparent;
}

.export-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.export-action-card.ea-button {
  width: 100%;
  height: auto;
  min-height: 70px;
  justify-content: flex-start;
  padding: 10px 12px;
  border-color: var(--ea-border);
  background: var(--ea-control-bg);
  text-align: left;
  white-space: normal;
}

.export-action-card__icon {
  display: inline-flex;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--ea-fg-secondary);
}

.export-action-card__icon svg {
  width: 22px;
  height: 22px;
}

.export-action-card__body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.export-action-card__body strong {
  color: var(--ea-fg);
  font-size: 12px;
}

.export-action-card__body small {
  color: var(--ea-fg-muted);
  font-size: 10px;
  font-weight: 500;
  line-height: 1.35;
}

@media (hover: hover) and (pointer: fine) {
  .export-action-card.ea-button:hover:not(:disabled) {
    border-color: var(--ea-border-strong);
    background: var(--ea-hover-fill);
  }

  .export-action-card.ea-button:hover:not(:disabled) .export-action-card__icon {
    color: var(--ea-gold);
  }
}

@media (max-width: 620px) {
  .export-actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
