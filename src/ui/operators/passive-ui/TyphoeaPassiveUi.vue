<script setup lang="ts">
/**
 * 提弗洛斯原生战斗 HUD。
 *
 * 三张图取自 OverlayInfoNodeTyphoea.prefab 引用的 Unity Sprite：底图 76×56、箭矢 40×8、点 12×12。
 * prefab 将箭矢按 1px 间距纵排，猎矢自下而上积攒、自上而下消耗；八个点从左下开始按两列横向填充。
 */
import type { PassiveUiWidgetState } from './state';

defineProps<PassiveUiWidgetState>();

function pointPosition(index: number) {
  return {
    left: `${((index - 1) % 2) * 9}px`,
    bottom: `${Math.floor((index - 1) / 2) * 9}px`,
  };
}
</script>

<template>
  <span class="passive-ui-skin typhoea-passive-ui">
    <img
      class="typhoea-background"
      src="/next/passive-ui/typhoea-bg.webp"
      alt=""
      draggable="false"
    />
    <span class="typhoea-arrows">
      <span
        v-for="index in Math.max(1, maximum)"
        :key="`arrow:${index}`"
        class="typhoea-arrow"
        :class="{ 'is-filled': index <= value }"
      />
    </span>
    <span class="typhoea-points">
      <span
        v-for="index in 8"
        :key="`point:${index}`"
        class="typhoea-point"
        :class="{ 'is-filled': index <= points }"
        :style="pointPosition(index)"
      />
    </span>
  </span>
</template>

<style scoped>
.passive-ui-skin {
  display: block;
  position: relative;
  width: 76px;
  height: 56px;
}

.typhoea-background,
.typhoea-arrows,
.typhoea-points {
  position: absolute;
}

.typhoea-background {
  inset: 0;
  display: block;
  width: 76px;
  height: 56px;
  pointer-events: none;
}

.typhoea-arrows {
  bottom: 10px;
  left: 8px;
  display: flex;
  flex-direction: column-reverse;
  gap: 1px;
}

.typhoea-points {
  bottom: 8px;
  left: 46px;
  width: 21px;
  height: 39px;
}

.typhoea-arrow {
  display: block;
  width: 40px;
  height: 8px;
  background: rgb(29 255 231);
  -webkit-mask: url('/next/passive-ui/typhoea-arrow.webp') center / contain no-repeat;
  mask: url('/next/passive-ui/typhoea-arrow.webp') center / contain no-repeat;
  opacity: 0;
}

.typhoea-point {
  position: absolute;
  display: block;
  width: 12px;
  height: 12px;
  background: rgb(242 242 240);
  -webkit-mask: url('/next/passive-ui/typhoea-point.webp') center / contain no-repeat;
  mask: url('/next/passive-ui/typhoea-point.webp') center / contain no-repeat;
  opacity: 0;
}

.typhoea-arrow.is-filled,
.typhoea-point.is-filled {
  opacity: 1;
  filter: drop-shadow(0 0 2px rgb(78 255 230 / 70%));
}
</style>
