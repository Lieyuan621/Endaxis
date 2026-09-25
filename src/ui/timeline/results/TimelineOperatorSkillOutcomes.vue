<script setup lang="ts">
/** 开奖时显示技能图标和种类角标，名称放在悬停提示与详情中。 */
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaDialog } from '@/design-system';
import type { OperatorSkillOutcome } from '../../operators/skillOutcomeRegistry';
import TimelineStatusSegment from './TimelineStatusSegment.vue';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import { timelineUpperBuffTop } from './timelineTrackEffectLayout';

const props = defineProps<{
  outcomes: readonly OperatorSkillOutcome[];
  framePx: (frame: number) => number;
  actionTop: number;
  lane: number;
}>();
const { t } = useI18n();
const selectedCastId = ref<string | null>(null);
const groups = computed(() => {
  const grouped = new Map<string, OperatorSkillOutcome[]>();
  for (const result of props.outcomes) {
    const list = grouped.get(result.castId) ?? [];
    list.push(result);
    grouped.set(result.castId, list);
  }
  return [...grouped].map(([castId, results]) => {
    return {
      castId,
      results,
      titleKey: results[0]!.titleKey,
      iconPath: results[0]!.iconPath,
      frame: Math.max(...results.map(result => result.frame)),
    };
  });
});
const selected = computed(() => groups.value.find(group => group.castId === selectedCastId.value));
</script>

<template>
  <div class="skill-outcomes" :style="{ '--buff-action-top': `${actionTop}px` }">
    <template v-for="group in groups" :key="group.castId">
      <TimelineStatusSegment
        v-for="(result, index) in group.results"
        :key="result.receiptSequence"
        :left="framePx(group.frame) + index * 22"
        :top="timelineUpperBuffTop(lane)"
        :width="0"
        :count="result.badge"
        :title="`${t(result.titleKey)} · ${result.badge} · ${t(result.nameKey)}`"
        interactive
        @activate="selectedCastId = group.castId"
      >
        <template #content
          ><img class="gift-result" :src="result.iconPath" alt="" draggable="false"
        /></template>
      </TimelineStatusSegment>
    </template>
  </div>
  <InputRegionBoundary label="OperatorSkillOutcomes" :active="selected !== undefined" modal>
    <EaDialog
      :model-value="selected !== undefined"
      :title="t('timeline.passiveUi.detailTitle')"
      width="440px"
      @update:model-value="selectedCastId = null"
    >
      <header v-if="selected" class="gift-detail__header">
        <span class="gift-detail__preview"
          ><img :src="selected.iconPath" alt="" width="44" height="44"
        /></span>
        <strong>{{ t(selected.titleKey) }}</strong>
      </header>
      <section
        v-for="result in selected?.results ?? []"
        :key="result.receiptSequence"
        class="gift-detail"
      >
        <dl class="gift-detail__facts">
          <dt>{{ t('timeline.passiveUi.giftResults.title') }}</dt>
          <dd>{{ result.badge }} · {{ t(result.nameKey) }}</dd>
          <dt>{{ t('timeline.passiveUi.giftResults.openedAt') }}</dt>
          <dd>
            {{ (result.frame / 30).toFixed(2).replace(/\.00$/, '') }}s ·
            {{ t('timeline.buffDetail.frames', { value: result.frame }) }}
          </dd>
        </dl>
      </section>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.skill-outcomes {
  position: absolute;
  inset: 0;
  z-index: 8;
  overflow: hidden;
  pointer-events: none;
  clip-path: inset(2px 0 calc(100% - var(--buff-action-top)) 0);
}
.gift-result {
  width: 16px;
  height: 16px;
  object-fit: contain;
}
.gift-detail__header {
  display: flex;
  min-height: 58px;
  align-items: center;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--ea-border-subtle, rgb(255 255 255 / 12%));
}
.gift-detail__preview {
  width: 100px;
  min-height: 48px;
  display: grid;
  place-items: center;
}
.gift-detail__preview img {
  object-fit: contain;
}
.gift-detail__header strong {
  color: var(--ea-text-primary, #f1f1f1);
  font-size: 15px;
}
.gift-detail + .gift-detail {
  margin-top: 16px;
  border-top: 1px solid var(--ea-border-subtle, rgb(255 255 255 / 12%));
}
.gift-detail__facts {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 10px 16px;
  margin: 16px 0 0;
  font-size: 13px;
}
.gift-detail__facts dt {
  color: var(--ea-text-muted, #999);
}
.gift-detail__facts dd {
  min-width: 0;
  margin: 0;
  color: var(--ea-text-primary, #eee);
  overflow-wrap: anywhere;
}
</style>
