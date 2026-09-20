<script setup lang="ts">
defineProps<{
  src: string;
  alt?: string;
  loading?: 'eager' | 'lazy';
}>();
</script>

<template>
  <span class="operator-avatar-crop">
    <img :src="src" :alt="alt ?? ''" :loading="loading" />
  </span>
</template>

<style scoped>
.operator-avatar-crop {
  display: block;
  overflow: hidden;
}

.operator-avatar-crop > img {
  display: block;
  width: 130%;
  max-width: none;
  height: 130%;
  margin: -15%;
  object-fit: cover;
}
</style>
