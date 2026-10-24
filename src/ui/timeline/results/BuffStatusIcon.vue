<script setup lang="ts">
defineProps<{ icon?: string; label: string; count?: number }>();
</script>
<template>
  <span class="buff-status-icon" :title="label">
    <img v-if="icon" :src="icon" :alt="label" draggable="false" />
    <span v-else class="buff-fallback">+</span>
    <span v-if="count !== undefined" class="anomaly-stacks">{{ count }}</span>
  </span>
</template>
<style scoped>
.buff-status-icon {
  appearance: none;
  position: relative;
  width: var(--buff-status-size, 18px);
  height: var(--buff-status-size, 18px);
  flex: 0 0 var(--buff-status-size, 18px);
  padding: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ea-keycap-skill-bg, #333);
  border: 1px solid var(--ea-keycap-skill-border, #999);
  cursor: default;
}
.buff-status-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.buff-fallback {
  color: #eef6ff;
  font-size: 10px;
  font-weight: 700;
}
.anomaly-stacks {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: rgb(0 0 0 / 80%);
  color: var(--ea-gold, #ffd166);
  font-size: 8px;
  line-height: 1;
  padding: 0 2px;
  border-radius: 2px;
}
</style>
