<script setup lang="ts">
import { publicAssetUrl } from '../../../utils/publicAssetUrl';

const source = publicAssetUrl('/contingency_contract/1/icon_activity_contract_tag_101.webp');
</script>

<template>
  <svg class="receive-hit-icon" viewBox="23 36 73 81" aria-hidden="true">
    <image transform="translate(11.9 15.3) scale(0.8)"
      :href="source"
      width="124"
      height="124"
      style="clip-path: path('M23 46H44L34 102H32Z M45 36H74L61 117H57Z M74 46H95L87 102H83Z')"
    />
  </svg>
</template>

<style scoped>
.receive-hit-icon {
  display: inline-block;
  width: 1.25em;
  height: 1.25em;
  flex: none;
  vertical-align: middle;
}
</style>
