<script setup lang="ts">
import { publicAssetUrl } from '../../../utils/publicAssetUrl';

defineProps<{ kind: 'dodge' | 'perfectDodge' }>();
</script>

<template>
  <img
    :src="
      publicAssetUrl(
        kind === 'perfectDodge'
          ? '/icons/icon_attribute_big_agi.webp'
          : '/icons/icon_attribute_agi.webp',
      )
    "
    alt=""
    draggable="false"
  />
</template>
