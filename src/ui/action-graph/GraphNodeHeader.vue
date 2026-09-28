<script setup lang="ts">
defineProps<{ title: string; instanceId: string }>();
</script>

<template>
  <header class="node-header">
    <strong>{{ title }}</strong>
    <small>{{ instanceId }}</small>
    <slot />
  </header>
</template>

<style scoped>
strong,
small {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
strong {
  font-size: 13px;
  line-height: 20px;
  font-weight: 600;
  color: var(--graph-header-title);
}
small {
  font-size: 10px;
  line-height: 16px;
  color: var(--graph-header-id);
  font-family: ui-monospace, monospace;
}
</style>
