<script setup lang="ts">
import { computed, provide } from 'vue';
import { definitionPropertyKey, type DefinitionProperty } from './definitionEditContext';

const props = defineProps<{ property: DefinitionProperty }>();
// 仅指定视图绑定的数据位置，不接收 update、不负责历史转发。
provide(
  definitionPropertyKey,
  computed(() => props.property),
);
</script>
<template><slot /></template>
