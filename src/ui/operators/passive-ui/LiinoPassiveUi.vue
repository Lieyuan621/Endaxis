<script setup lang="ts">
import { computed } from 'vue';
import type { PassiveUiWidgetState } from './state';
const props = defineProps<PassiveUiWidgetState>();
const progressRatio = computed(() => Math.max(0, Math.min(1, props.ratio ?? 1)));
const progressClip = computed(() => `inset(${(1 - progressRatio.value) * 100}% 0 0 0)`);
</script>
<template>
  <span class="passive-ui-skin">
    <span class="liino-ring" />
    <img class="liino-deco" src="/next/passive-ui/liino-deco.webp" alt="" />
    <img
      class="liino-note-bg"
      :src="
        mode === 'ultimate'
          ? '/next/passive-ui/liino-ultimate-bg.webp'
          : '/next/passive-ui/liino-normal-bg.webp'
      "
      alt=""
    />
    <img
      class="liino-note-bar"
      :src="
        mode === 'ultimate'
          ? '/next/passive-ui/liino-ultimate-bar.webp'
          : '/next/passive-ui/liino-normal-bar.webp'
      "
      :style="{ clipPath: progressClip }"
      alt=""
    />
    <img
      v-if="ratio !== null"
      class="liino-star liino-star--big"
      src="/next/passive-ui/liino-big-star.webp"
      alt=""
    />
    <img
      v-if="ratio !== null"
      class="liino-star liino-star--small"
      src="/next/passive-ui/liino-small-star.webp"
      alt=""
    />
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
.native-fill {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.liino-ring {
  position: absolute;
  display: block;
  top: 6px;
  left: 12px;
  width: 44px;
  height: 44px;
  background: rgb(254 201 255 / 60%);
  mask: url('/next/passive-ui/liino-bg.webp') center / 100% 100% no-repeat;
}

.liino-deco {
  top: 8px;
  left: 14px;
  width: 40px;
  height: 40px;
}

.liino-note-bg {
  top: -1px;
  left: 11px;
  width: 52px;
  height: 56px;
}

.liino-note-bar {
  top: 10px;
  left: 16px;
  width: 32px;
  height: 36px;
}

.liino-note-bg[src*='ultimate'] {
  left: 2.75px;
  width: 56px;
}

.liino-note-bar[src*='ultimate'] {
  top: 7px;
  left: 8.75px;
  width: 44px;
  height: 40px;
}

.liino-star--big {
  top: 24px;
  left: 14px;
  width: 28px;
  height: 28px;
}

.liino-star--small {
  top: 2px;
  left: 43px;
  width: 28px;
  height: 28px;
}
</style>
