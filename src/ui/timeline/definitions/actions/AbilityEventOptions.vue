<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { abilityEventDisplayLabel } from './abilityEventPresentation';
defineProps<{ events: readonly string[]; current?: string }>();
const { locale } = useI18n({ useScope: 'global' });
</script>
<template>
  <option v-if="current && !events.includes(current)" :value="current">
    {{ current }}（当前未知事件）
  </option>
  <option v-for="event in events" :key="event" :value="event">
    {{ abilityEventDisplayLabel(event, locale) }}
  </option>
</template>
