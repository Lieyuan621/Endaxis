<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

type TimelineResetMode = 'currentKeepLoadout' | 'current' | 'all';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    lockScroll?: boolean;
  }>(),
  { lockScroll: true },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [mode: TimelineResetMode];
}>();

const { t } = useI18n();
const selectedMode = ref<TimelineResetMode>('currentKeepLoadout');

const options = computed(() => [
  {
    mode: 'currentKeepLoadout' as const,
    icon: 'loadout',
    title: t('timeline.reset.currentKeepLoadout'),
    description: t('timeline.reset.currentKeepLoadoutDescription'),
  },
  {
    mode: 'current' as const,
    icon: 'current',
    title: t('timeline.reset.current'),
    description: t('timeline.reset.currentDescription'),
  },
  {
    mode: 'all' as const,
    icon: 'all',
    title: t('timeline.reset.all'),
    description: t('timeline.reset.allDescription'),
  },
]);

let previousBodyOverflow = '';
let bodyScrollLocked = false;

function close() {
  emit('update:modelValue', false);
}

function unlockBodyScroll() {
  if (!bodyScrollLocked || typeof document === 'undefined') return;
  document.body.style.overflow = previousBodyOverflow;
  bodyScrollLocked = false;
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close();
}

watch(
  () => props.modelValue,
  open => {
    if (typeof document === 'undefined') return;

    if (open) {
      selectedMode.value = 'currentKeepLoadout';
      document.addEventListener('keydown', handleKeydown);
      if (props.lockScroll) {
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        bodyScrollLocked = true;
      }
    } else {
      document.removeEventListener('keydown', handleKeydown);
      unlockBodyScroll();
    }
  },
);

onUnmounted(() => {
  if (typeof document === 'undefined') return;
  document.removeEventListener('keydown', handleKeydown);
  unlockBodyScroll();
});

function confirm() {
  const mode = selectedMode.value;
  close();
  emit('confirm', mode);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="timeline-reset-fade">
      <div v-if="modelValue" class="timeline-reset-overlay">
        <section
          class="timeline-reset-dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="t('timeline.reset.title')"
        >
          <header class="timeline-reset-dialog__header">
            <h2 class="timeline-reset-dialog__title">{{ t('timeline.reset.title') }}</h2>
            <button
              type="button"
              class="timeline-reset-dialog__close"
              :aria-label="t('common.close')"
              @click="close"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div
            class="timeline-reset-options"
            role="radiogroup"
            :aria-label="t('timeline.reset.title')"
          >
            <button
              v-for="option in options"
              :key="option.mode"
              type="button"
              class="timeline-reset-option"
              :class="{
                'is-selected': selectedMode === option.mode,
                'is-danger': option.mode === 'all',
              }"
              role="radio"
              :aria-checked="selectedMode === option.mode"
              @click="selectedMode = option.mode"
            >
              <span class="timeline-reset-option__icon" aria-hidden="true">
                <svg v-if="option.icon === 'loadout'" viewBox="0 0 24 24">
                  <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                  <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
                  <path d="m16.5 15.5 1.5 1.5 3-3" />
                </svg>
                <svg v-else-if="option.icon === 'current'" viewBox="0 0 24 24">
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 10v7M14 10v7" />
                </svg>
              </span>
              <span class="timeline-reset-option__copy">
                <strong>{{ option.title }}</strong>
                <small>{{ option.description }}</small>
              </span>
              <span class="timeline-reset-option__radio" aria-hidden="true"></span>
            </button>
          </div>

          <footer class="timeline-reset-dialog__footer">
            <button type="button" class="ea-btn ea-btn--glass-rect" @click="close">
              {{ t('common.cancel') }}
            </button>
            <button
              type="button"
              class="ea-btn ea-btn--glass-rect ea-btn--accent-red"
              @click="confirm"
            >
              {{ t('timeline.reset.confirmButton') }}
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.timeline-reset-overlay {
  position: fixed;
  inset: 0;
  z-index: 3100;
  display: grid;
  place-items: center;
  padding: 14px;
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(3px);
}

.timeline-reset-dialog {
  width: min(460px, 100%);
  overflow: hidden;
  border: 1px solid var(--ea-border, rgba(255, 255, 255, 0.14));
  border-radius: 7px;
  background: var(--ea-panel-bg, #1c1c1c);
  color: var(--ea-fg, #eee);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.42);
}

.timeline-reset-dialog__header {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;
  border-bottom: 1px solid var(--ea-border, rgba(255, 255, 255, 0.12));
}

.timeline-reset-dialog__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.timeline-reset-dialog__close {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--ea-text-muted, #aaa);
  cursor: pointer;
}

.timeline-reset-dialog__close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
}

.timeline-reset-dialog__close svg,
.timeline-reset-option__icon svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.timeline-reset-options {
  display: grid;
  margin: 16px;
  border: 1px solid var(--ea-border, rgba(255, 255, 255, 0.14));
  border-radius: 6px;
  overflow: hidden;
}

.timeline-reset-option {
  min-width: 0;
  min-height: 72px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 0;
  border-bottom: 1px solid var(--ea-border, rgba(255, 255, 255, 0.12));
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.timeline-reset-option:last-child {
  border-bottom: 0;
}

.timeline-reset-option:hover,
.timeline-reset-option.is-selected {
  background: rgba(253, 217, 0, 0.08);
}

.timeline-reset-option.is-danger:hover,
.timeline-reset-option.is-danger.is-selected {
  background: rgba(255, 86, 96, 0.09);
}

.timeline-reset-option__icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(253, 217, 0, 0.42);
  border-radius: 5px;
  color: var(--ea-accent, #fdd900);
}

.timeline-reset-option.is-danger .timeline-reset-option__icon {
  border-color: rgba(255, 86, 96, 0.42);
  color: #ff6b74;
}

.timeline-reset-option__copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.timeline-reset-option__copy strong {
  font-size: 14px;
  font-weight: 700;
}

.timeline-reset-option__copy small {
  color: var(--ea-text-muted, #9b9b9b);
  font-size: 12px;
  line-height: 1.45;
}

.timeline-reset-option__radio {
  width: 14px;
  height: 14px;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 50%;
  box-shadow: inset 0 0 0 3px transparent;
}

.timeline-reset-option.is-selected .timeline-reset-option__radio {
  border-color: var(--ea-accent, #fdd900);
  background: var(--ea-accent, #fdd900);
  box-shadow: inset 0 0 0 3px #1b1b1b;
}

.timeline-reset-option.is-danger.is-selected .timeline-reset-option__radio {
  border-color: #ff6b74;
  background: #ff6b74;
}

.timeline-reset-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 16px 16px;
}

.timeline-reset-fade-enter-active,
.timeline-reset-fade-leave-active {
  transition: opacity 0.16s ease;
}

.timeline-reset-fade-enter-from,
.timeline-reset-fade-leave-to {
  opacity: 0;
}

:global(html[data-theme='light'] .timeline-reset-dialog) {
  --ea-panel-bg: #fff;
  --ea-fg: #202020;
  --ea-text-muted: #676767;
  --ea-border: rgba(0, 0, 0, 0.16);
}

:global(html[data-theme='light'] .timeline-reset-option__radio) {
  border-color: rgba(0, 0, 0, 0.3);
}

:global(html[data-theme='light'] .timeline-reset-option.is-selected .timeline-reset-option__radio) {
  box-shadow: inset 0 0 0 3px #fff;
}
</style>
