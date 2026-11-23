<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaChevronIcon, EaPopover } from '@/design-system';
import OperatorAvatar from '@/ui/components/OperatorAvatar.vue';
import { DEFAULT_GAME_ICON_PATH, getOperatorAvatarPath } from '@/ui/gameAssetPaths';
import { getOperatorGameName } from '@/ui/gameText';
import type { OperatorBuildPreset } from '@/application/editor/operatorBuildPreset';
import type { GameDataRepository } from '@/core/game-data/gameDataRepository';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../interaction/usePopoverInteractionBoundary';
const props = defineProps<{
  presets: readonly OperatorBuildPreset[];
  gameData: GameDataRepository;
  currentOperatorSlug?: string;
  disabled?: boolean;
}>();
const model = defineModel<string>({ default: 'all' });
const { t, locale } = useI18n();
const id = useId();
const open = ref(false);
const trigger = ref<HTMLElement>();
const picker = ref<HTMLElement>();
usePopoverInteractionBoundary(
  useInteractionSession(),
  () => open.value,
  () => {
    open.value = false;
  },
);
const operators = computed(() => {
  const options = new Map<
    string,
    { value: string; label: string; avatar: string; count: number }
  >();
  function include(slug: string, count: number) {
    const existing = options.get(slug);
    if (existing) {
      existing.count += count;
      return;
    }
    const definition = props.gameData.getOperator(slug);
    const assetSlug = definition?.assetSlug ?? slug;
    options.set(slug, {
      value: slug,
      label: getOperatorGameName(slug, locale.value),
      avatar: /^[A-Za-z0-9_-]+$/.test(assetSlug)
        ? getOperatorAvatarPath(assetSlug)
        : DEFAULT_GAME_ICON_PATH,
      count,
    });
  }
  for (const preset of props.presets) include(preset.build.operator.operatorSlug, 1);
  // Zero-count selections remain explicit until the user changes the filter.
  if (props.currentOperatorSlug) include(props.currentOperatorSlug, 0);
  if (model.value !== 'all') include(model.value, 0);
  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, locale.value));
});
const selectedOperator = computed(() =>
  operators.value.find(option => option.value === model.value),
);
function selectOperator(value: string) {
  if (props.disabled) return;
  model.value = value;
  open.value = false;
  void nextTick(() => trigger.value?.querySelector('button')?.focus());
}
function focusSelection() {
  if (open.value)
    picker.value?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus();
}
function closePicker(event: KeyboardEvent) {
  if (!open.value) return;
  event.preventDefault();
  event.stopPropagation();
  selectOperator(model.value);
}
function avatarFallback(event: Event) {
  const image = event.target as HTMLImageElement;
  if (image.getAttribute('src') !== DEFAULT_GAME_ICON_PATH) image.src = DEFAULT_GAME_ICON_PATH;
}
watch(
  () => props.disabled,
  value => {
    if (value) open.value = false;
  },
);
</script>
<template>
  <EaPopover
    v-model:visible="open"
    trigger="click"
    placement="bottom-start"
    :width="336"
    @after-enter="focusSelection"
    :popper-style="{ maxWidth: 'calc(100vw - 32px)' }"
  >
    <template #reference>
      <span
        ref="trigger"
        class="preset-operator-filter__operator-trigger"
        @keydown.esc="closePicker"
      >
        <EaButton
          :disabled="disabled"
          :aria-label="t('operatorPresets.filter')"
          :aria-expanded="open"
          :aria-controls="id"
        >
          <OperatorAvatar
            v-if="selectedOperator"
            :src="selectedOperator.avatar"
            @error.capture="avatarFallback"
          />
          <span :class="{ 'preset-operator-filter__filtered-value': model !== 'all' }">{{
            selectedOperator?.label ?? t('operatorPresets.allOperators')
          }}</span>
          <span class="preset-operator-filter__count">{{
            selectedOperator?.count ?? props.presets.length
          }}</span>
          <EaChevronIcon :direction="open ? 'up' : 'down'" :size="16" />
        </EaButton>
      </span>
    </template>
    <div
      ref="picker"
      :id="id"
      class="preset-operator-filter__operator-picker"
      role="group"
      :aria-label="t('operatorPresets.filter')"
      @keydown.esc="closePicker"
    >
      <EaButton
        class="preset-operator-filter__all-operators"
        variant="ghost"
        :pressed="model === 'all'"
        @click="selectOperator('all')"
      >
        {{ t('operatorPresets.allOperators') }} <span>{{ props.presets.length }}</span>
      </EaButton>
      <div class="preset-operator-filter__operator-grid">
        <EaButton
          v-for="option in operators"
          :key="option.value"
          variant="ghost"
          class="preset-operator-filter__operator-option"
          :aria-label="option.label"
          :pressed="model === option.value"
          @click="selectOperator(option.value)"
        >
          <OperatorAvatar :src="option.avatar" @error.capture="avatarFallback" />
          <span class="preset-operator-filter__operator-label"
            >{{ option.label }} <span>{{ option.count }}</span></span
          >
        </EaButton>
      </div>
    </div>
  </EaPopover>
</template>
<style scoped>
.preset-operator-filter__operator-trigger,
.preset-operator-filter__operator-trigger > .ea-button {
  display: flex;
  width: 100%;
  min-width: 0;
}
.preset-operator-filter__operator-trigger > .ea-button {
  border: 0;
  background: var(--ea-number-input-bg, var(--ea-fill-input));
  color: var(--ea-fg-secondary);
  box-shadow: 0 0 0 1px var(--ea-number-input-border, var(--ea-control-border)) inset;
  font-weight: 500;
}
.preset-operator-filter__operator-trigger > .ea-button:hover:not(:disabled) {
  background: var(--ea-number-input-bg, var(--ea-fill-input));
  color: var(--ea-fg);
}
.preset-operator-filter__operator-trigger > .ea-button[aria-expanded='true'] {
  box-shadow: 0 0 0 1px var(--ea-number-input-accent, var(--ea-gold)) inset;
}
.preset-operator-filter__operator-trigger > .ea-button:focus-visible {
  box-shadow:
    0 0 0 1px var(--ea-number-input-accent, var(--ea-gold)) inset,
    var(--ea-focus-ring);
}
.preset-operator-filter__filtered-value {
  color: var(--ea-selection-fg, var(--ea-gold));
  font-weight: 600;
}
.preset-operator-filter__operator-trigger
  > .ea-button
  > span:not(.operator-avatar-crop):not(.preset-operator-filter__count) {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
  white-space: nowrap;
}
.preset-operator-filter__count {
  color: var(--ea-fg-secondary);
  font-size: 12px;
}
.preset-operator-filter__operator-trigger .operator-avatar-crop {
  width: 24px;
  height: 24px;
  flex: none;
}
.preset-operator-filter__operator-picker {
  display: grid;
  gap: var(--ea-space-2);
}
.preset-operator-filter__all-operators {
  justify-content: space-between;
  width: 100%;
}
.preset-operator-filter__operator-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ea-space-2);
  max-height: min(360px, 55dvh);
  overflow-y: auto;
  scrollbar-gutter: stable;
}
.preset-operator-filter__operator-option.ea-button {
  display: flex;
  flex-direction: column;
  height: auto;
  min-width: 0;
  gap: var(--ea-space-1);
  padding: var(--ea-space-1);
}
.preset-operator-filter__operator-option .operator-avatar-crop {
  width: 100%;
  aspect-ratio: 1;
}
.preset-operator-filter__operator-label {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--ea-space-1);
  font-size: 12px;
  width: 100%;
  overflow-wrap: anywhere;
}
.preset-operator-filter__operator-label > span,
.preset-operator-filter__all-operators > span {
  color: var(--ea-fg-secondary);
}
</style>
