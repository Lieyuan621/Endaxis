<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getGearPiece } from '@/data/index.js';
import { getGearSetGameDescription, getGearSetGameName } from '@/data/gameText.js';
import GameRichTextRenderer from '@/components/GameRichTextRenderer.vue';

const props = defineProps({
  equipment: { type: Object, required: true },
  affixRows: { type: Array, default: () => [] },
});

const { t, locale } = useI18n();

const setPreview = computed(() => {
  const equipment = props.equipment;
  const piece = getGearPiece(
    equipment?.canonicalId || equipment?.canonicalGearPieceId || equipment?.id,
  );
  const setSlug = piece?.setSlug || equipment?.category || '';
  if (!setSlug) return null;
  return {
    name: getGearSetGameName(setSlug, locale.value),
    description: getGearSetGameDescription(setSlug, locale.value) || '',
  };
});
</script>

<template>
  <div class="equipment-selection-preview">
    <div class="equipment-selection-preview__name">{{ equipment.name }}</div>
    <div v-if="affixRows.length" class="equipment-selection-preview__affixes">
      <div
        v-for="row in affixRows"
        :key="`eq_tip_${row.key}`"
        class="equipment-selection-preview__affix-row"
      >
        <svg
          v-if="row.marker === 'hollow-dot'"
          class="equipment-selection-preview__marker"
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <circle cx="6" cy="6" r="3.25" fill="none" stroke="currentColor" stroke-width="1.5" />
        </svg>
        <img v-else class="equipment-selection-preview__icon" :src="row.src" loading="lazy" />
        <span class="equipment-selection-preview__label">{{ row.label }}</span>
        <strong class="equipment-selection-preview__value">{{ row.valueText }}</strong>
      </div>
    </div>
    <div v-if="setPreview" class="equipment-selection-preview__set-bonus">
      <div class="equipment-selection-preview__set-heading">
        <span>{{ t('timelineGrid.equipmentDialog.setBonusTitle') }}</span>
        <strong>{{ setPreview.name }}</strong>
      </div>
      <GameRichTextRenderer
        v-if="setPreview.description"
        :text="setPreview.description"
        :locale="locale"
      />
    </div>
  </div>
</template>

<style scoped>
:global(.equipment-selection-preview-popper) {
  max-width: min(440px, calc(100vw - 32px));
}

:global(.equipment-selection-preview-popper.el-popper.is-dark) {
  background: #050505;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.72);
}

:global(.equipment-selection-preview-popper.el-popper.is-dark .el-popper__arrow::before) {
  background: #050505;
  border-color: rgba(255, 255, 255, 0.18);
}

:global(html[data-theme='light'] .equipment-selection-preview-popper.el-popper.is-dark) {
  background: #ffffff;
  border: 1px solid rgba(26, 27, 30, 0.14);
  box-shadow: 0 14px 34px rgba(26, 27, 30, 0.16);
  color: #1a1b1e;
}

:global(html[data-theme='light'] .equipment-selection-preview-popper.el-popper .el-popper__arrow) {
  display: none !important;
}

:global(html[data-theme='light'] .equipment-selection-preview__name) {
  border-bottom-color: rgba(26, 27, 30, 0.12);
  color: #1a1b1e;
}

:global(html[data-theme='light'] .equipment-selection-preview__label),
:global(html[data-theme='light'] .equipment-selection-preview__set-bonus) {
  color: rgba(26, 27, 30, 0.86);
}

:global(html[data-theme='light'] .equipment-selection-preview__marker) {
  color: rgba(26, 27, 30, 0.72);
}

:global(html[data-theme='light'] .equipment-selection-preview__set-heading span) {
  color: rgba(26, 27, 30, 0.55);
}

:global(.equipment-selection-preview) {
  width: min(400px, calc(100vw - 64px));
  display: flex;
  flex-direction: column;
  gap: 10px;
  line-height: 1.5;
}

:global(.equipment-selection-preview__name) {
  padding: 2px 0 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.96);
  font-size: 14px;
  font-weight: 700;
}

:global(.equipment-selection-preview__affixes) {
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:global(.equipment-selection-preview__affix-row) {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 22px;
}

:global(.equipment-selection-preview__icon) {
  width: 18px;
  height: 18px;
  object-fit: contain;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
}

:global(.equipment-selection-preview__marker) {
  width: 12px;
  height: 12px;
  justify-self: center;
  color: rgba(255, 255, 255, 0.9);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
}

:global(.equipment-selection-preview__label) {
  overflow: hidden;
  color: rgba(255, 255, 255, 0.9);
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.equipment-selection-preview__value) {
  color: #facc15;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

:global(.equipment-selection-preview__set-bonus) {
  padding-top: 9px;
  border-top: 1px solid rgba(45, 212, 191, 0.3);
  color: rgba(255, 255, 255, 0.88);
}

:global(.equipment-selection-preview__set-heading) {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 5px;
}

:global(.equipment-selection-preview__set-heading span) {
  color: rgba(255, 255, 255, 0.62);
  font-size: 12px;
}

:global(.equipment-selection-preview__set-heading strong) {
  color: #2dd4bf;
}
</style>
