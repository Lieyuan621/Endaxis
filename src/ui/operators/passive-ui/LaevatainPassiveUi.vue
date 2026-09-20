<script setup lang="ts">
import type { PassiveUiWidgetState } from './state';
defineProps<PassiveUiWidgetState>();
</script>
<template>
  <span class="passive-ui-skin">
    <img class="laevatain-bg" src="/next/passive-ui/laevatain-bg.webp" alt="" />
    <span v-if="value >= maximum" class="laevatain-max" />
    <template v-else>
      <span
        v-for="index in Math.min(value, 4)"
        :key="index"
        class="laevatain-leaf"
        :class="`laevatain-leaf--${index}`"
      />
    </template>
  </span>
</template>
<style scoped>
.passive-ui-skin {
  display: contents;
}
img {
  position: absolute;
  display: block;
}
.laevatain-bg {
  top: 0;
  left: 0;
  width: 32px;
  height: 32px;
}

.laevatain-max {
  position: absolute;
  display: block;
  top: 2px;
  left: 2px;
  width: 28px;
  height: 28px;
  background: rgb(255 101 112);
  mask: url('/next/passive-ui/laevatain-max.webp') center / 100% 100% no-repeat;
  transform: scaleX(-1);
}
.laevatain-leaf {
  position: absolute;
  display: block;
  width: 16px;
  height: 16px;
  background: rgb(255 101 112);
  mask: url('/next/passive-ui/laevatain-leaf.webp') center / 100% 100% no-repeat;
}

.laevatain-leaf--1 {
  top: 2px;
  left: 15px;
}

.laevatain-leaf--2 {
  top: 14px;
  left: 15px;
  transform: scaleY(-1);
}

.laevatain-leaf--3 {
  top: 14px;
  left: 1px;
  transform: scale(-1);
}

.laevatain-leaf--4 {
  top: 2px;
  left: 1px;
  transform: scaleX(-1);
}
</style>
