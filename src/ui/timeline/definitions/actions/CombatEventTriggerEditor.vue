<script setup lang="ts">
import { computed } from 'vue';
import type { CombatEventTrigger } from '../../../../core/game-data/operatorDefinition';
import type { DefinitionProperty } from '../definitionEditContext';
import { eventInspectorFields } from '../inspector/eventInspectorSchema';
import InspectorFields from '../inspector/InspectorFields.vue';

const props = defineProps<{ event: CombatEventTrigger; binding?: DefinitionProperty }>();
const emit = defineEmits<{ update: [event: CombatEventTrigger] }>();
const fields = computed(() => eventInspectorFields(props.event));
</script>
<template>
  <InspectorFields
    :value="event"
    :binding="binding"
    :fields="fields"
    @update="emit('update', $event)"
  />
</template>
