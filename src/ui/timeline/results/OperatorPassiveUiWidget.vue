<script setup lang="ts">
/** 通用 HUD 容器只选择外观、缩放并传递模拟状态。 */
import { computed } from 'vue';
import type { OperatorPassiveUiAppearance } from '../../../../packages/game-data-contract/src/operators';
import { passiveUiSkins } from '../../operators/passive-ui/registry';

const props = withDefaults(
  defineProps<{
    appearance: OperatorPassiveUiAppearance;
    value?: number;
    maximum?: number;
    active?: boolean;
    mode?: 'normal' | 'ultimate';
    ratio?: number | null;
    points?: number;
    height?: number;
    maxWidth?: number | null;
  }>(),
  {
    value: 0,
    maximum: 0,
    active: false,
    mode: 'normal',
    ratio: null,
    points: 0,
    height: 20,
    maxWidth: null,
  },
);

const skin = computed(() => passiveUiSkins[props.appearance]);
const nativeScale = computed(() =>
  Math.min(
    props.height / skin.value.height,
    props.maxWidth === null ? Number.POSITIVE_INFINITY : props.maxWidth / skin.value.width,
  ),
);
const rootStyle = computed(() => ({
  width: `${skin.value.width * nativeScale.value}px`,
  height: `${skin.value.height * nativeScale.value}px`,
}));
const canvasStyle = computed(() => ({
  width: `${skin.value.width}px`,
  height: `${skin.value.height}px`,
  transform: `scale(${nativeScale.value})`,
}));
</script>
<template>
  <span
    class="operator-passive-widget"
    :class="[`is-${appearance}`, { 'is-active': active }]"
    :style="rootStyle"
    aria-hidden="true"
  >
    <span class="operator-passive-widget__canvas" :style="canvasStyle">
      <component
        :is="skin.component"
        :value="value"
        :maximum="maximum"
        :active="active"
        :mode="mode"
        :ratio="ratio"
        :points="points"
      />
    </span>
  </span>
</template>
<style scoped>
.operator-passive-widget {
  position: relative;
  display: inline-block;
  flex: 0 0 auto;
  overflow: visible;
  vertical-align: middle;
}
.operator-passive-widget__canvas {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  transform-origin: left top;
}
</style>
