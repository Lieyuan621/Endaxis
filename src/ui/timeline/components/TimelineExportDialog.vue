<script setup lang="ts">
/** 导出面板只收集范围、文件名和图片时长；文件生成由编辑器执行。 */
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaDialog, EaFormField, EaInput, EaNumberInput } from '@/design-system';

export type ExportScenarioScope = 'current' | 'all';

const props = defineProps<{
  visible: boolean;
  currentScenarioName: string;
  scenarioCount: number;
  maxDuration: number;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  exportJson: [options: { filename: string; scope: ExportScenarioScope }];
  copyCode: [options: { scope: ExportScenarioScope }];
  exportSmallImage: [options: { filename: string; duration: number }];
  exportImage: [options: { filename: string; duration: number }];
}>();

const { t } = useI18n({ useScope: 'global' });
const scope = ref<ExportScenarioScope>('all');
const filename = ref('');
const duration = ref(60);
const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
});
const currentScenarioSummary = computed(() =>
  t('timeline.export.currentScenarioName', { name: props.currentScenarioName }),
);
const dataScopeSummary = computed(() =>
  scope.value === 'current'
    ? currentScenarioSummary.value
    : t('timeline.export.allScenariosCount', { count: props.scenarioCount }),
);

watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    scope.value = 'all';
    filename.value = `Endaxis_Timeline_${new Date().toISOString().slice(0, 10)}`;
    duration.value = Math.max(10, Math.round(props.maxDuration || 120));
  },
  { immediate: true },
);

function imageOptions() {
  return {
    filename: filename.value,
    duration: Math.max(10, Math.min(props.maxDuration, Math.round(duration.value || 60))),
  };
}
</script>

<template>
  <EaDialog
    v-model="dialogVisible"
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
          id="export-filename"
          v-model="filename"
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
            :aria-checked="scope === 'current'"
            :pressed="scope === 'current'"
            @click="scope = 'current'"
          >
            {{ t('timeline.export.scopeCurrent') }}
          </EaButton>
          <EaButton
            size="sm"
            type="button"
            role="radio"
            :aria-checked="scope === 'all'"
            :pressed="scope === 'all'"
            @click="scope = 'all'"
          >
            {{ t('timeline.export.scopeAll') }}
          </EaButton>
        </div>
        <div class="export-actions-grid">
          <EaButton
            class="export-action-card"
            size="lg"
            type="button"
            @click="emit('exportJson', { filename, scope })"
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
            @click="emit('copyCode', { scope })"
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
            <p>{{ currentScenarioSummary }}</p>
          </div>
        </header>
        <EaFormField
          control-id="export-duration"
          :label="t('timeline.export.durationLabel')"
          :hint="t('timeline.export.durationHintMax', { max: maxDuration })"
        >
          <EaNumberInput
            id="export-duration"
            v-model="duration"
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
            @click="emit('exportSmallImage', imageOptions())"
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
            @click="emit('exportImage', imageOptions())"
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
/* 与 V2 导出面板一致，数据和图片操作分别使用说明卡片。 */
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
