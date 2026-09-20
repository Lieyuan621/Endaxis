<script setup lang="ts">
/** 旧版小图预览与微调弹窗；预览节点也是最终 PNG 的唯一渲染源。 */
import { computed, nextTick, ref, watch } from 'vue';
import { snapdom } from '@zumer/snapdom';
import { ElLoading, ElMessage } from 'element-plus';
import {
  EaButton,
  EaDialog,
  EaDialogActions,
  EaFormField,
  EaInput,
  EaNumberInput,
  EaSwitch,
} from '@/design-system';
import TimelineShareCard, { type TimelineShareTrack } from './TimelineShareCard.vue';
import type { OperationKeycapMode } from '../timelineOperationMarkers';
import { downloadBlob, imageFilename } from '../timelineExport';
import { embedProjectCodeInPng } from '../pngProjectData';

const props = defineProps<{
  visible: boolean;
  initialFilename: string;
  initialDuration: number;
  maxDuration: number;
  scenarioName: string;
  tracks: readonly TimelineShareTrack[];
  prepFrames: number;
  editorAppearance: 'light' | 'dark';
  keycapMode: OperationKeycapMode;
  createShareCode: () => Promise<string>;
  labels: {
    title: string;
    filename: string;
    filenamePlaceholder: string;
    duration: string;
    durationHint: string;
    cardAppearance: string;
    light: string;
    dark: string;
    cardWidth: string;
    blockHeight: string;
    timeScale: string;
    showCombatIcons: string;
    showDurationBars: string;
    showKeycaps: string;
    showPrep: string;
    showTimeTicks: string;
    cancel: string;
    save: string;
    rendering: string;
    exported: (filename: string) => string;
    failed: (message: string) => string;
  };
}>();
const emit = defineEmits<{ 'update:visible': [visible: boolean] }>();
const shareCard = ref<{ rootEl: HTMLElement | null } | null>(null);
const form = ref({
  filename: '',
  duration: 60,
  cardWidth: 420,
  blockHeight: 22,
  pxPerSecond: 24,
  showCombatIcons: true,
  showDurationBars: true,
  showKeycaps: true,
  showPrep: true,
  showTimeTicks: true,
  appearance: 'dark' as 'light' | 'dark',
});

watch(
  () => props.visible,
  visible => {
    if (!visible) return;
    form.value = {
      filename:
        props.initialFilename.trim().replace(/^Endaxis_Timeline_/i, 'Endaxis_Card_') ||
        `Endaxis_Card_${new Date().toISOString().slice(0, 10)}`,
      duration: Math.min(
        Math.max(10, Math.round(props.initialDuration || 60)),
        Math.max(10, Math.round(props.maxDuration || 120)),
      ),
      cardWidth: 420,
      blockHeight: 22,
      pxPerSecond: 24,
      showCombatIcons: true,
      showDurationBars: true,
      showKeycaps: true,
      showPrep: true,
      showTimeTicks: true,
      appearance: props.editorAppearance,
    };
  },
  { immediate: true },
);
const watermark = computed(
  () => form.value.filename.replace(/\.(?:png|webp)$/i, '').trim() || 'Endaxis',
);

async function save(): Promise<void> {
  const filename = imageFilename(form.value.filename, 'Endaxis_Card');
  const loading = ElLoading.service({
    lock: true,
    text: props.labels.rendering,
    background: 'rgba(0, 0, 0, 0.9)',
  });
  try {
    await nextTick();
    const root = shareCard.value?.rootEl;
    if (root === null || root === undefined) throw new Error('preview missing');
    const capture = await snapdom(root, {
      scale: 2,
      width: root.scrollWidth,
      height: root.scrollHeight,
      backgroundColor: form.value.appearance === 'light' ? '#f4f5f7' : '#191a1d',
    });
    const image = await capture.toBlob({ type: 'png', dpr: 1 });
    const exportImage = await embedProjectCodeInPng(image, await props.createShareCode());
    downloadBlob(exportImage, filename);
    ElMessage.success(props.labels.exported(filename));
    emit('update:visible', false);
  } catch (error) {
    ElMessage.error(props.labels.failed(error instanceof Error ? error.message : String(error)));
  } finally {
    loading.close();
  }
}
</script>

<template>
  <EaDialog
    :model-value="visible"
    :title="labels.title"
    width="880px"
    align-center
    class="custom-dialog small-image-export-dialog"
    :append-to-body="true"
    destroy-on-close
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="small-export">
      <div class="small-export__preview" :class="{ 'is-light-card': form.appearance === 'light' }">
        <div class="small-export__preview-scroll">
          <div class="small-export__preview-inner">
            <TimelineShareCard
              ref="shareCard"
              :scenario-name="scenarioName"
              :tracks="tracks"
              :prep-frames="prepFrames"
              :duration="form.duration"
              :card-width="form.cardWidth"
              :block-height="form.blockHeight"
              :px-per-second="form.pxPerSecond"
              :show-combat-icons="form.showCombatIcons"
              :show-duration-bars="form.showDurationBars"
              :show-keycaps="form.showKeycaps"
              :keycap-mode="keycapMode"
              :show-prep="form.showPrep"
              :show-time-ticks="form.showTimeTicks"
              :watermark="watermark"
              :appearance="form.appearance"
            />
          </div>
        </div>
      </div>
      <div class="small-export__controls">
        <div class="form-item form-item--row">
          <span>{{ labels.cardAppearance }}</span>
          <div class="card-appearance" role="group" :aria-label="labels.cardAppearance">
            <EaButton
              size="sm"
              type="button"
              class="card-appearance__btn"
              :pressed="form.appearance === 'light'"
              :title="labels.light"
              :aria-label="labels.light"
              @click="form.appearance = 'light'"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                />
              </svg>
            </EaButton>
            <EaButton
              size="sm"
              type="button"
              class="card-appearance__btn"
              :pressed="form.appearance === 'dark'"
              :title="labels.dark"
              :aria-label="labels.dark"
              @click="form.appearance = 'dark'"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </EaButton>
          </div>
        </div>

        <EaFormField control-id="small-export-filename" :label="labels.filename">
          <EaInput
            id="small-export-filename"
            v-model="form.filename"
            :placeholder="labels.filenamePlaceholder"
            size="md"
          />
        </EaFormField>

        <EaFormField
          control-id="small-export-duration"
          :label="labels.duration"
          :hint="labels.durationHint"
        >
          <EaNumberInput
            id="small-export-duration"
            v-model="form.duration"
            :min="10"
            :max="maxDuration"
            :step="10"
            :precision="0"
            size="md"
            style="width: 100%"
          />
        </EaFormField>

        <EaFormField control-id="small-export-card-width" :label="labels.cardWidth">
          <div class="ea-range-row">
            <input
              id="small-export-card-width"
              v-model.number="form.cardWidth"
              class="ea-range"
              type="range"
              min="320"
              max="540"
              step="10"
            />
            <span class="ea-range-value">{{ form.cardWidth }}</span>
          </div>
        </EaFormField>

        <EaFormField control-id="small-export-block-height" :label="labels.blockHeight">
          <div class="ea-range-row">
            <input
              id="small-export-block-height"
              v-model.number="form.blockHeight"
              class="ea-range"
              type="range"
              min="14"
              max="40"
              step="1"
            />
            <span class="ea-range-value">{{ form.blockHeight }}</span>
          </div>
        </EaFormField>

        <EaFormField control-id="small-export-time-scale" :label="labels.timeScale">
          <div class="ea-range-row">
            <input
              id="small-export-time-scale"
              v-model.number="form.pxPerSecond"
              class="ea-range"
              type="range"
              min="6"
              max="40"
              step="1"
            />
            <span class="ea-range-value">{{ form.pxPerSecond }}</span>
          </div>
        </EaFormField>

        <div class="form-item form-item--row">
          <span>{{ labels.showCombatIcons }}</span>
          <EaSwitch v-model="form.showCombatIcons" :aria-label="labels.showCombatIcons" />
        </div>
        <div class="form-item form-item--row">
          <span>{{ labels.showDurationBars }}</span>
          <EaSwitch v-model="form.showDurationBars" :aria-label="labels.showDurationBars" />
        </div>
        <div class="form-item form-item--row">
          <span>{{ labels.showKeycaps }}</span>
          <EaSwitch v-model="form.showKeycaps" :aria-label="labels.showKeycaps" />
        </div>
        <div class="form-item form-item--row">
          <span>{{ labels.showPrep }}</span>
          <EaSwitch v-model="form.showPrep" :aria-label="labels.showPrep" />
        </div>
        <div class="form-item form-item--row">
          <span>{{ labels.showTimeTicks }}</span>
          <EaSwitch v-model="form.showTimeTicks" :aria-label="labels.showTimeTicks" />
        </div>
      </div>
    </div>
    <template #footer>
      <EaDialogActions>
        <EaButton size="sm" type="button" @click="emit('update:visible', false)">
          {{ labels.cancel }}
        </EaButton>
        <EaButton variant="primary" size="sm" type="button" @click="save">
          {{ labels.save }}
        </EaButton>
      </EaDialogActions>
    </template>
  </EaDialog>
</template>

<style scoped>
.small-export {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}
.small-export__preview {
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--ea-fill-muted);
  border: 1px solid var(--ea-border);
  padding: 12px;
  overflow: hidden;
}
.small-export__preview.is-light-card {
  background: var(--ea-workbench-main);
  border-color: rgba(26, 27, 30, 0.16);
}
.small-export__preview-scroll {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
.small-export__preview-inner {
  display: block;
  width: max-content;
  max-width: 100%;
  margin: 0 auto;
  padding-bottom: 12px;
}
.small-export__controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}
.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-item--row span {
  color: var(--ea-fg-secondary);
  font-size: 12px;
}
.form-item--row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.card-appearance {
  display: inline-flex;
  gap: 4px;
}
.card-appearance__btn.ea-button {
  min-width: 30px;
  padding: 4px 8px;
}
.card-appearance__btn.ea-button[aria-pressed='true'] {
  color: var(--ea-gold);
  border-color: color-mix(in srgb, var(--ea-gold) 55%, transparent);
  background: color-mix(in srgb, var(--ea-gold) 12%, transparent);
}
@media (max-width: 800px) {
  .small-export {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(240px, 55vh) auto;
  }
}
</style>

<style>
.small-image-export-dialog.el-dialog {
  max-height: 90vh;
  margin-top: 5vh !important;
  margin-bottom: 5vh !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--ea-dialog-bg);
  border: 1px solid var(--ea-dialog-border);
}

.small-image-export-dialog .el-dialog__header,
.small-image-export-dialog .el-dialog__footer {
  flex: 0 0 auto;
}

.small-image-export-dialog .el-dialog__header {
  margin-right: 0;
  padding: 15px 20px;
  border-bottom: 1px solid var(--ea-dialog-divider);
}

.small-image-export-dialog .el-dialog__title {
  color: var(--ea-dialog-title);
  font-size: 16px;
  font-weight: 600;
}

.small-image-export-dialog .el-dialog__footer {
  padding: 15px 25px 20px;
  border-top: 1px solid var(--ea-dialog-divider);
}

.small-image-export-dialog .el-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px 20px 10px;
  color: var(--ea-dialog-body);
}
</style>
