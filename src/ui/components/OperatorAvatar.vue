<script setup lang="ts">
defineProps<{
  src: string;
  alt?: string;
  loading?: 'eager' | 'lazy';
  framed?: boolean;
}>();
</script>

<template>
  <span class="operator-avatar-crop" :class="{ 'operator-avatar--framed': framed }">
    <img :src="src" :alt="alt ?? ''" :loading="loading" />
  </span>
</template>

<style scoped>
.operator-avatar-crop {
  display: block;
  overflow: hidden;
}

.operator-avatar--framed {
  box-sizing: border-box;
  width: 44px;
  height: 44px;
  border: 2px solid #555;
  border-radius: 50%;
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
