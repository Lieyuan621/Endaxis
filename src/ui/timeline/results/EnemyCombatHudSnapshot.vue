<script setup lang="ts">
/** 敌人状态栏的光标快照；数值完全来自投影，不在组件内解释回执。 */
import { computed } from 'vue';
import type { EnemyCombatHudSnapshot } from '../../../core/projection/combatHudSnapshot';

const props = defineProps<{
  snapshot: EnemyCombatHudSnapshot;
  name: string;
  level: number;
  /** 状态总览行只显示生命；失衡值由旧版布局中的独立纵向模块承载。 */
  showPoise?: boolean;
  /** 原生 UIPoiseBar 按敌人配置初始化的归一化结点阈值。 */
  poiseKnotThresholds: readonly number[];
  labels: {
    status: string;
    hp: string;
    poise: string;
    recovering: string;
    brokenEndWindow: string;
  };
}>();

function formatNumber(value: number | null): string {
  if (value === null) return '—';
  return Math.round(value).toLocaleString();
}

const poiseStateLabel = computed(() => {
  const state = props.snapshot.poise?.state;
  if (state === 'recovering') return props.labels.recovering;
  if (state === 'brokenEndWindow') return props.labels.brokenEndWindow;
  return null;
});
</script>

<template>
  <section class="enemy-hud-snapshot" :title="`${name} · Lv.${level}`">
    <header>
      <strong>{{ labels.status }}</strong>
    </header>
    <div class="gauge gauge--hp">
      <span class="gauge__value">
        {{ formatNumber(snapshot.health.current)
        }}<span class="gauge__value-max">/{{ formatNumber(snapshot.health.maximum) }}</span>
      </span>
      <span class="gauge__track">
        <span
          class="gauge__fill"
          :style="{ width: `${(snapshot.health.ratio ?? 0) * 100}%` }"
        ></span>
      </span>
    </div>
    <slot />
    <div v-if="showPoise !== false && snapshot.poise !== null" class="gauge gauge--poise">
      <span class="gauge__label">{{ labels.poise }}</span>
      <span v-if="poiseStateLabel !== null" class="gauge__state">{{ poiseStateLabel }}</span>
      <span class="gauge__value">
        {{ formatNumber(snapshot.poise.current) }}/{{ formatNumber(snapshot.poise.maximum) }}
      </span>
      <span class="gauge__track">
        <span
          class="gauge__fill"
          :style="{ width: `${(snapshot.poise.ratio ?? 0) * 100}%` }"
        ></span>
        <i
          v-for="threshold in poiseKnotThresholds"
          :key="threshold"
          class="gauge__knot"
          :style="{ left: `${(1 - threshold) * 100}%` }"
          aria-hidden="true"
        ></i>
      </span>
    </div>
  </section>
</template>

<style scoped>
.enemy-hud-snapshot {
  width: 180px;
  height: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border-right: 1px solid var(--ea-divider, rgb(255 255 255 / 16%));
  border-left: 3px solid #ff7875;
  background: var(--ea-workbench-panel, #252526);
  color: var(--ea-fg);
  font-family:
    Inter,
    -apple-system,
    sans-serif;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}

header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  min-width: 0;
}

header strong {
  min-width: 0;
  overflow: hidden;
  color: #ff7875;
  font-size: 11px;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gauge {
  position: relative;
  display: contents;
  color: #ff7875;
}

.gauge--poise {
  color: #ff9c6e;
}

.gauge__value {
  color: #ff7875;
  font:
    700 12px/1.1 'Roboto Mono',
    monospace;
  white-space: nowrap;
}

.gauge__value-max {
  color: var(--ea-fg-faint, rgb(255 255 255 / 45%));
  font-weight: 600;
}

.gauge__state {
  position: absolute;
  left: 38px;
  top: 0;
  color: currentColor;
  font-size: 8px;
  line-height: 10px;
}

.gauge__track {
  position: relative;
  height: 5px;
  background: var(--ea-fill-soft, rgb(255 255 255 / 8%));
}

.gauge__fill {
  display: block;
  height: 100%;
  background: #d9363e;
  transition: width 0.16s ease;
}

.gauge--poise .gauge__fill {
  background: #d46b08;
}

.gauge__knot {
  position: absolute;
  z-index: 1;
  top: 50%;
  width: 2px;
  height: 7px;
  box-sizing: border-box;
  border: 1px solid #f5c89a;
  background: #4c362b;
  box-shadow: 0 0 0 1px rgb(0 0 0 / 45%);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
</style>
