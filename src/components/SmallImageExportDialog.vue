<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { ElLoading, ElMessage } from 'element-plus';
import { snapdom } from '@zumer/snapdom';
import { useI18n } from 'vue-i18n';
import { useTimelineStore } from '@/stores/timelineStore.js';
import { addMetadataToPng } from '@/utils/pngUtils';
import TimelineShareCard from '@/components/TimelineShareCard.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialFilename: { type: String, default: '' },
  initialDuration: { type: Number, default: 60 },
});

const emit = defineEmits(['update:modelValue']);

const store = useTimelineStore();
const { t } = useI18n({ useScope: 'global' });

const visible = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
});

const shareCardRef = ref(null);
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
});

watch(
  () => props.modelValue,
  open => {
    if (!open) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    form.value = {
      filename: props.initialFilename || `Endaxis_Card_${dateStr}`,
      duration: Math.min(
        Math.max(10, Math.round(Number(props.initialDuration) || 60)),
        Math.max(10, Math.round(Number(store.TOTAL_DURATION) || 120)),
      ),
      cardWidth: 420,
      blockHeight: 22,
      pxPerSecond: 24,
      showCombatIcons: true,
      showDurationBars: true,
      showKeycaps: true,
      showPrep: true,
      showTimeTicks: true,
    };
  },
);

const watermarkText = computed(() =>
  String(form.value.filename || 'Endaxis')
    .replace(/\.png$/i, '')
    .trim() || 'Endaxis',
);

const maxDuration = computed(() =>
  Math.max(10, Math.round(Number(store.TOTAL_DURATION) || 120)),
);

function close() {
  visible.value = false;
}

async function saveImage() {
  let rawFilename = String(form.value.filename || 'Endaxis_Card').trim();
  if (rawFilename.toLowerCase().endsWith('.png')) rawFilename = rawFilename.slice(0, -4);
  if (!rawFilename) rawFilename = 'Endaxis_Card';
  const userFilename = `${rawFilename}.png`;

  const loading = ElLoading.service({
    lock: true,
    text: t('timeline.export.smallRendering'),
    background: 'rgba(0, 0, 0, 0.9)',
  });

  try {
    await nextTick();
    await new Promise(resolve => setTimeout(resolve, 80));

    const el = shareCardRef.value?.rootEl;
    if (!el) throw new Error('preview missing');

    // Use scroll metrics so long timelines (e.g. 120s) are fully captured,
    // not just the clipped preview viewport.
    const width = Math.max(1, Math.ceil(el.scrollWidth || el.offsetWidth));
    const height = Math.max(1, Math.ceil(el.scrollHeight || el.offsetHeight));
    const capture = await snapdom(el, {
      scale: 2,
      width,
      height,
    });
    const captureBlob = await capture.toBlob({ type: 'png', dpr: 1 });

    let pngBlob = captureBlob;
    try {
      const shareString = await store.exportShareString({
        includeScenarios: store.activeScenarioId,
      });
      pngBlob = await addMetadataToPng(captureBlob, 'EndaxisData', shareString);
    } catch (error) {
      console.error(error);
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(pngBlob);
    link.download = userFilename;
    link.click();
    URL.revokeObjectURL(link.href);

    ElMessage.success(t('timeline.export.smallImageExported', { filename: userFilename }));
    close();
  } catch (error) {
    console.error(error);
    ElMessage.error(t('timeline.export.failed', { msg: error?.message || String(error) }));
  } finally {
    loading.close();
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('timeline.export.smallPreviewTitle')"
    width="880px"
    align-center
    class="custom-dialog small-image-export-dialog"
    :append-to-body="true"
    destroy-on-close
  >
    <div class="small-export">
      <div class="small-export__preview">
        <div class="small-export__preview-scroll">
          <div class="small-export__preview-inner">
            <TimelineShareCard
              ref="shareCardRef"
              :duration="form.duration"
              :card-width="form.cardWidth"
              :block-height="form.blockHeight"
              :px-per-second="form.pxPerSecond"
              :show-combat-icons="form.showCombatIcons"
              :show-duration-bars="form.showDurationBars"
              :show-keycaps="form.showKeycaps"
              :show-prep="form.showPrep"
              :show-time-ticks="form.showTimeTicks"
              :watermark-text="watermarkText"
            />
          </div>
        </div>
      </div>

      <div class="small-export__controls">
        <div class="form-item">
          <label>{{ t('timeline.export.filenameLabel') }}</label>
          <el-input
            v-model="form.filename"
            :placeholder="t('timeline.export.filenamePlaceholder')"
            size="default"
          />
        </div>

        <div class="form-item">
          <label>{{ t('timeline.export.durationLabel') }}</label>
          <el-input-number
            v-model="form.duration"
            :min="10"
            :max="maxDuration"
            :step="10"
            :precision="0"
            size="default"
            style="width: 100%"
          />
          <div class="hint">
            {{ t('timeline.export.durationHintMax', { max: maxDuration }) }}
            · {{ t('timeline.export.smallDurationHint') }}
          </div>
        </div>

        <div class="form-item">
          <label>{{ t('timeline.export.cardWidthLabel') }}</label>
          <div class="ea-range-row">
            <input
              v-model.number="form.cardWidth"
              class="ea-range"
              type="range"
              min="320"
              max="540"
              step="10"
            />
            <span class="ea-range-value">{{ form.cardWidth }}</span>
          </div>
        </div>

        <div class="form-item">
          <label>{{ t('timeline.export.blockHeightLabel') }}</label>
          <div class="ea-range-row">
            <input
              v-model.number="form.blockHeight"
              class="ea-range"
              type="range"
              min="14"
              max="40"
              step="1"
            />
            <span class="ea-range-value">{{ form.blockHeight }}</span>
          </div>
        </div>

        <div class="form-item">
          <label>{{ t('timeline.export.timeScaleLabel') }}</label>
          <div class="ea-range-row">
            <input
              v-model.number="form.pxPerSecond"
              class="ea-range"
              type="range"
              min="6"
              max="40"
              step="1"
            />
            <span class="ea-range-value">{{ form.pxPerSecond }}</span>
          </div>
        </div>

        <div class="form-item form-item--row">
          <span>{{ t('timeline.export.showCombatIcons') }}</span>
          <el-switch v-model="form.showCombatIcons" />
        </div>

        <div class="form-item form-item--row">
          <span>{{ t('timeline.export.showDurationBars') }}</span>
          <el-switch v-model="form.showDurationBars" />
        </div>

        <div class="form-item form-item--row">
          <span>{{ t('timeline.export.showKeycaps') }}</span>
          <el-switch v-model="form.showKeycaps" />
        </div>

        <div class="form-item form-item--row">
          <span>{{ t('timeline.export.showPrep') }}</span>
          <el-switch v-model="form.showPrep" />
        </div>

        <div class="form-item form-item--row">
          <span>{{ t('timeline.export.showTimeTicks') }}</span>
          <el-switch v-model="form.showTimeTicks" />
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <button type="button" class="ea-btn ea-btn--sm ea-btn--lift ea-btn--outline-muted" @click="close">
          {{ t('common.cancel') }}
        </button>
        <button
          type="button"
          class="ea-btn ea-btn--sm ea-btn--lift ea-btn--fill-gold"
          @click="saveImage"
        >
          {{ t('timeline.export.saveSmallImage') }}
        </button>
      </span>
    </template>
  </el-dialog>
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
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px;
  overflow: hidden;
}

.small-export__preview-scroll {
  flex: 1 1 auto;
  min-height: 0;
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

.form-item label,
.form-item--row span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

.form-item--row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
}

@media (max-width: 800px) {
  .small-export {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(240px, 55vh) auto;
  }
}
</style>

<!-- Dialog teleports to body; constrain height so preview can scroll inside. -->
<style>
.small-image-export-dialog.el-dialog {
  max-height: 90vh;
  margin-top: 5vh !important;
  margin-bottom: 5vh !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.small-image-export-dialog .el-dialog__header,
.small-image-export-dialog .el-dialog__footer {
  flex: 0 0 auto;
}

.small-image-export-dialog .el-dialog__header {
  margin-right: 0;
  padding: 15px 20px;
  border-bottom: 1px solid #3a3a3a;
}

.small-image-export-dialog .el-dialog__title {
  color: #f0f0f0;
  font-size: 16px;
  font-weight: 600;
}

.small-image-export-dialog .el-dialog__footer {
  padding: 15px 25px 20px;
  border-top: 1px solid #3a3a3a;
}

.small-image-export-dialog .dialog-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 8px 10px;
  width: 100%;
}

.small-image-export-dialog .dialog-footer .ea-btn {
  flex: 0 0 auto;
  white-space: nowrap;
}

.small-image-export-dialog .el-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px 20px 10px;
}
</style>
