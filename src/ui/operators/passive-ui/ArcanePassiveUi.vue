<script setup lang="ts">
import type { PassiveUiWidgetState } from './state';
const props = defineProps<PassiveUiWidgetState>();
const arcanePartColor = (part: 1 | 2) => {
  if (props.value === 1) return part === 1 ? 'white' : 'rgb(68 67 67)';
  if (props.value === 2) return 'rgb(35 231 188)';
  return 'rgb(68 67 67)';
};
</script>
<template>
  <span class="passive-ui-skin">
    <template v-if="value > 0">
      <span class="arcane-frame" />
      <span
        class="arcane-energy arcane-energy--part-1"
        :style="{ backgroundColor: arcanePartColor(1) }"
      />
      <span
        class="arcane-energy arcane-energy--part-2"
        :style="{ backgroundColor: arcanePartColor(2) }"
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
.native-fill {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.arcane-energy {
  position: absolute;
  display: block;
  mask-position: center;
  mask-repeat: no-repeat;
  mask-size: 100% 100%;
}

.arcane-frame {
  position: absolute;
  display: block;
  top: -1.5px;
  left: 2px;
  width: 42px;
  height: 33px;
  background: rgb(34 34 34);
  mask: url('/next/passive-ui/arcane-frame.webp') center / 100% 100% no-repeat;
}

.arcane-energy {
  top: 3px;
  width: 18px;
  height: 24px;
}

.arcane-energy--part-1 {
  left: 6.25px;
  mask-image: url('/next/passive-ui/arcane-energy-1.webp');
}

.arcane-energy--part-2 {
  left: 22.25px;
  mask-image: url('/next/passive-ui/arcane-energy-2.webp');
}
</style>
