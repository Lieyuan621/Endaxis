<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElColorPickerPanel } from 'element-plus';
import { useI18n } from 'vue-i18n';
import EaNumberInput from '../EaNumberInput/EaNumberInput.vue';
import EaPopover from '../EaPopover/EaPopover.vue';

const props = defineProps<{
  modelValue: string | null;
  label: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{ change: [value: string | null] }>();
const { t } = useI18n({ useScope: 'global' });
const visible = ref(false);
const draft = ref('#8c8c8c');
const format = ref<'hex' | 'rgb'>('hex');
const nativeInput = ref<HTMLInputElement>();
const panel = ref<InstanceType<typeof ElColorPickerPanel>>();

function updatePanelPosition() {
  requestAnimationFrame(() => panel.value?.update());
}

watch(visible, isVisible => {
  if (isVisible) {
    draft.value = props.modelValue || '#8c8c8c';
    format.value = 'hex';
  }
});

const rgb = computed(() => {
  const hex = draft.value.replace('#', '');
  const normalized = hex.length === 3 ? [...hex].map(digit => digit + digit).join('') : hex;
  if (!/^[\da-f]{6}$/i.test(normalized)) return [0, 0, 0];
  return [0, 2, 4].map(index => parseInt(normalized.slice(index, index + 2), 16));
});

function updateRgb(index: number, value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return;
  const channels = [...rgb.value];
  channels[index] = Math.max(0, Math.min(255, Math.round(value)));
  updateColor(`#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`);
}

function updateColor(value: string | null) {
  if (!value || draft.value === value) return;
  draft.value = value;
  emit('change', value);
}

function openNativePicker() {
  const input = nativeInput.value;
  if (!input) return;
  try {
    input.showPicker();
  } catch {
    input.click();
  }
}

async function pickFromScreen() {
  const EyeDropper = (
    window as Window & {
      EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
    }
  ).EyeDropper;
  if (!EyeDropper) {
    openNativePicker();
    return;
  }
  try {
    const result = await new EyeDropper().open();
    updateColor(result.sRGBHex);
  } catch {
    // Closing the browser picker leaves the current color unchanged.
  }
}
</script>

<template>
  <EaPopover
    v-model:visible="visible"
    trigger="click"
    placement="left"
    :disabled="disabled"
    :show-arrow="false"
    :width="250"
    :popper-style="{ padding: '0' }"
    :popper-class="`ea-color-picker-popper${format === 'rgb' ? ' ea-color-picker-popper--rgb' : ''}`"
    @after-enter="updatePanelPosition"
  >
    <template #reference>
      <button type="button" class="ea-color-picker" :aria-label="label" :disabled="disabled">
        <span
          class="ea-color-picker__swatch"
          :style="{ backgroundColor: modelValue || '#8c8c8c' }"
        />
      </button>
    </template>
    <ElColorPickerPanel
      ref="panel"
      :model-value="draft"
      color-format="hex"
      :border="false"
      @update:model-value="updateColor"
    >
      <template #footer>
        <div class="ea-color-picker__footer">
          <div class="ea-color-picker__actions">
            <div class="ea-color-picker__formats" :aria-label="t('common.colorFormat')">
              <button type="button" :aria-pressed="format === 'hex'" @click="format = 'hex'">
                HEX
              </button>
              <button type="button" :aria-pressed="format === 'rgb'" @click="format = 'rgb'">
                RGB
              </button>
            </div>
            <button
              type="button"
              class="ea-color-picker__eyedropper"
              :title="t('common.pickFromScreen')"
              :aria-label="t('common.pickFromScreen')"
              @click="pickFromScreen"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                <path
                  d="m4 20 3-1 10-10-2-2L5 17l-1 3ZM14 8l2-2m-1-1 2-2a2 2 0 0 1 3 3l-2 2"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
          <div v-if="format === 'rgb'" class="ea-color-picker__rgb">
            <label v-for="(channel, index) in rgb" :key="index">
              <EaNumberInput
                :model-value="channel"
                :min="0"
                :max="255"
                :controls="false"
                size="sm"
                @update:model-value="updateRgb(index, $event)"
              />
              <span>{{ ['R', 'G', 'B'][index] }}</span>
            </label>
          </div>
        </div>
      </template>
    </ElColorPickerPanel>
  </EaPopover>
  <input
    ref="nativeInput"
    type="color"
    class="ea-color-picker__native"
    :value="draft"
    tabindex="-1"
    aria-hidden="true"
    @input="updateColor(($event.target as HTMLInputElement).value)"
  />
</template>

<style scoped>
.ea-color-picker {
  width: 24px;
  height: 24px;
  padding: 2px;
  border: 1px solid var(--ea-control-border);
  border-radius: var(--ea-control-radius);
  background: var(--ea-fill-input);
  cursor: pointer;
}

.ea-color-picker__swatch {
  display: block;
  width: 100%;
  height: 100%;
}

.ea-color-picker:focus-visible {
  outline: 1px solid var(--ea-gold);
  outline-offset: 2px;
}

.ea-color-picker:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.ea-color-picker__native {
  position: fixed;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
</style>
