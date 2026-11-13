<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EnemyEffectMarker } from '../../../core/projection/enemyEffectViz';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import { resolveImage } from '../../imageResources';
import { DEFAULT_GAME_ICON_PATH, getSpellBurstIconPath } from '../../gameAssetPaths';
import { resolveBuffDisplayName } from './buffDisplayName';
import TimelineStatusMarker from './TimelineStatusMarker.vue';
const props = defineProps<{
  markers: readonly EnemyEffectMarker[];
  positions: readonly { row: number; slot: number }[];
  iconSize: number;
  top: number;
  framePx: (frame: number) => number;
  burstLabel: string;
}>();
const emit = defineEmits<{ 'open-damage-detail': [sequence: number] }>();
const { t, te } = useI18n();
function spellBurstTitle(burstType: string | undefined): string {
  if (burstType === undefined) return props.burstLabel;
  const key = `timeline.skillEditing.spellBurstTypes.${burstType}`;
  return te(key) ? t(key) : `${props.burstLabel} ${burstType}`;
}

const markers = computed(() =>
  props.markers.map((marker, index) => {
    const attachment =
      marker.kind === 'attachmentTrigger'
        ? elementalAttachments.buffs.find(
            buff =>
              buff.role?.kind === 'elementalAttachment' && buff.role.element === marker.element,
          )
        : undefined;
    const icon =
      marker.kind === 'attachmentTrigger'
        ? (resolveImage(attachment?.presentation?.icon) ?? DEFAULT_GAME_ICON_PATH)
        : (getSpellBurstIconPath(marker.burstType) ?? DEFAULT_GAME_ICON_PATH);
    const title =
      marker.kind === 'attachmentTrigger'
        ? resolveBuffDisplayName(attachment?.id ?? marker.element ?? '', { t, te })
        : spellBurstTitle(marker.burstType);
    return {
      key: `${index}:${marker.kind}:${marker.frame}:${marker.burstType ?? ''}`,
      icon,
      damageSequence: marker.damageSequence,
      // 瞬时标记的角标表示一次触发，不表示新增持续附着层数。
      badge: 1,
      x: props.framePx(marker.frame) + (props.positions[index]?.slot ?? 0) * (props.iconSize + 2),
      top: props.top + (props.positions[index]?.row ?? 0) * (props.iconSize + 4),
      title,
    };
  }),
);
</script>
<template>
  <TimelineStatusMarker
    v-for="marker in markers"
    :key="marker.key"
    :size="iconSize"
    :x="marker.x"
    :y="marker.top"
    :icon="marker.icon"
    :title="marker.title"
    :badge="marker.badge"
    :class="{ 'is-clickable': marker.damageSequence !== undefined }"
    :role="marker.damageSequence === undefined ? undefined : 'button'"
    :tabindex="marker.damageSequence === undefined ? undefined : 0"
    @click.stop="
      marker.damageSequence !== undefined && emit('open-damage-detail', marker.damageSequence)
    "
    @keydown.enter.stop.prevent="
      marker.damageSequence !== undefined && emit('open-damage-detail', marker.damageSequence)
    "
    @keydown.space.stop.prevent="
      marker.damageSequence !== undefined && emit('open-damage-detail', marker.damageSequence)
    "
  />
</template>

<style scoped>
.is-clickable {
  cursor: pointer;
}
</style>
