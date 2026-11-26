<script setup lang="ts">
defineProps<{ icon?: string | undefined }>();
</script>

<template>
  <svg class="pickup-icon" viewBox="0 0 32 32" aria-hidden="true">
    <path
      d="M2 22l4-3 5 2h7c2 0 2 3 0 3h-6l7 1 9-6c2-1 3 1 2 2l-9 8H10l-4 2z"
      transform="translate(4.5 5.4) scale(.72)"
      fill="#f2f2f2"
      stroke="#29292d"
      stroke-width="1.2"
      stroke-linejoin="round"
    />
    <image
      x="3.5"
      y="-1"
      width="25"
      height="25"
      v-if="icon"
      :href="icon"
    />
  </svg>
</template>

<style scoped>
.pickup-icon {
  display: inline-block;
  width: 1.5em;
  height: 1.5em;
  flex: none;
  vertical-align: middle;
}
</style>
