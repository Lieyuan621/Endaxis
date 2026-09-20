<script setup lang="ts">
import { computed } from 'vue';
import type { PassiveUiWidgetState } from './state';
const props = defineProps<PassiveUiWidgetState>();
const tangtangFillColor = computed(() =>
  props.value >= 2 ? 'rgb(128 182 255)' : props.value >= 1 ? 'white' : 'rgb(98 98 98)',
);
</script>
<template>
  <span class="passive-ui-skin">
    <span class="tangtang-droplet">
      <span class="tangtang-fill" :style="{ backgroundColor: tangtangFillColor }" />
      <span class="tangtang-border" />
    </span>
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
.tangtang-droplet {
  position: absolute;
  display: block;
}

.tangtang-droplet {
  top: 0;
  left: 0;
  width: 48px;
  height: 44px;
}

.tangtang-border {
  position: absolute;
  inset: 0;
  display: block;
  background: rgb(34 34 34);
  mask: url('/next/passive-ui/tangtang-droplet-border.webp') center / 100% 100% no-repeat;
}

.tangtang-fill {
  position: absolute;
  display: block;
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: 100% 100%;
}

.tangtang-fill {
  inset: 0;
  mask-image: url('/next/passive-ui/tangtang-droplet.webp');
}
</style>
