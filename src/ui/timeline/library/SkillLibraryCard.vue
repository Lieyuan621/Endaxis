<script setup>
/**
 * Next 时间轴照录旧版视觉规格的技能库卡片展示层。
 * 调用方负责名称、颜色和技能段语义，本组件只维持统一 DOM、尺寸与交互事件。
 */
defineProps({
  name: { type: String, required: true },
  typeLabel: { type: String, default: '' },
  duration: { type: Number, required: true },
  icon: { type: String, default: '' },
  accentColor: { type: String, default: '#8c8c8c' },
  selected: { type: Boolean, default: false },
  tooltip: { type: String, default: '' },
  segments: { type: Array, default: () => [] },
});

defineEmits(['select', 'dragstart', 'dragend', 'select-segment', 'dragstart-segment']);
</script>

<template>
  <div class="skill-item" :style="{ '--accent-color': accentColor }">
    <div
      class="skill-card"
      :class="{ 'is-selected': selected }"
      :title="tooltip || name"
      draggable="true"
      @dragstart="$emit('dragstart', $event)"
      @dragend="$emit('dragend', $event)"
      @click="$emit('select')"
    >
      <div class="card-edge"></div>
      <div class="card-body">
        <div class="skill-meta">
          <span class="skill-secondary">{{ name }}</span>
          <span class="skill-time">{{ duration }}s</span>
        </div>
        <div class="skill-primary">{{ typeLabel || name }}</div>
      </div>

      <div v-if="icon" class="card-bg-deco">
        <img :src="icon" class="weapon-icon-inner" alt="" />
      </div>
      <div v-else class="card-bg-deco-empty"></div>
    </div>

    <div v-if="segments.length > 1" class="attack-segment-row" @click.stop>
      <div
        v-for="(segment, index) in segments"
        :key="segment.id"
        class="attack-segment-chip"
        :class="{ 'is-selected': segment.selected, 'is-last': index === segments.length - 1 }"
        :draggable="!segment.disabled"
        @dragstart="$emit('dragstart-segment', { event: $event, skillKey: segment.id })"
        @dragend="$emit('dragend', $event)"
        @click.stop="$emit('select-segment', segment.id)"
      >
        {{ segment.label }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.skill-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  --accent-color: #8c8c8c;
}

.skill-card {
  position: relative;
  height: 60px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0;
  cursor: grab;
  overflow: hidden;
  box-sizing: border-box;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.skill-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}
.skill-card.is-selected {
  border-color: var(--ea-gold);
  box-shadow: inset 0 0 10px color-mix(in srgb, var(--ea-gold) 10%, transparent);
  background: color-mix(in srgb, var(--ea-gold) 5%, transparent);
}

.attack-segment-row {
  display: flex;
  gap: 2px;
  width: 100%;
  min-height: 22px;
  align-items: center;
}
.attack-segment-chip {
  position: relative;
  flex: 1 1 0;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 6px;
  border: 1px solid var(--ea-border, rgba(255, 255, 255, 0.12));
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.05));
  color: var(--ea-fg-secondary, rgba(255, 255, 255, 0.75));
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1;
  user-select: none;
  cursor: grab;
  box-sizing: border-box;
  min-width: 0;
}
.attack-segment-chip::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background-color: var(--accent-color);
  box-shadow: 2px 0 10px color-mix(in srgb, var(--accent-color) 25%, transparent);
  opacity: 0.75;
}
.attack-segment-chip:not(.is-last)::after {
  content: '>';
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.28);
  pointer-events: none;
}
.attack-segment-chip:hover {
  border-color: var(--accent-color);
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}
.attack-segment-chip.is-selected {
  border-color: var(--ea-gold);
  color: var(--ea-gold);
  box-shadow: 0 0 10px color-mix(in srgb, var(--ea-gold) 12%, transparent);
}

.card-edge {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background-color: var(--accent-color);
  box-shadow: 2px 0 10px var(--accent-color);
}
.card-body {
  padding: 10px 12px 10px 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.1);
}
.skill-meta {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}
.skill-secondary {
  max-width: calc(100% - 52px);
  overflow: hidden;
  font-size: 9px;
  color: var(--ea-fg-muted, rgba(255, 255, 255, 0.48));
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.skill-time {
  position: absolute;
  top: 5px;
  right: 21px;
  width: 38px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 10px;
  font-weight: 500;
  color: var(--ea-fg-muted, rgba(255, 255, 255, 0.45));
  z-index: 3;
}
.skill-time::before {
  content: '';
  width: 1px;
  height: 8px;
  background: var(--accent-color);
  opacity: 0.4;
}
.skill-primary {
  font-size: 15px;
  color: var(--ea-fg, rgba(255, 255, 255, 0.9));
  font-weight: 800;
  margin-top: 2px;
  padding-right: 65px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-bg-deco {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, transparent 20%, var(--accent-color) 100%);
  opacity: 0.6;
  clip-path: polygon(100% 0, 0 100%, 100% 100%);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  z-index: 1;
}
.weapon-icon-inner {
  width: 28px;
  height: 28px;
  filter: brightness(1.2) drop-shadow(0 0 5px var(--accent-color));
  opacity: 0.9;
  margin: 0 2px 2px 0;
  pointer-events: none;
}
.skill-card:hover .card-bg-deco {
  opacity: 0.85;
  transform: scale(1.05);
}
.skill-card:hover .weapon-icon-inner {
  filter: brightness(1.5) drop-shadow(0 0 8px #fff);
  transform: scale(1.1);
  opacity: 1;
}
.card-bg-deco-empty {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 15px;
  height: 15px;
  background: var(--accent-color);
  opacity: 0.2;
  clip-path: polygon(100% 0, 0 100%, 100% 100%);
}

:global(html[data-theme='light'] .skill-card) {
  background: #fff;
  border-color: var(--ea-border-strong);
  box-shadow: 0 1px 2px var(--ea-shadow);
}
:global(html[data-theme='light'] .skill-card:hover) {
  background: var(--ea-surface-soft);
}
:global(html[data-theme='light'] .skill-primary) {
  color: var(--ea-fg);
}
:global(html[data-theme='light'] .skill-secondary) {
  color: var(--ea-fg-secondary);
}
:global(html[data-theme='light'] .weapon-icon-inner) {
  filter: brightness(0) opacity(0.72);
  opacity: 1;
}
</style>
