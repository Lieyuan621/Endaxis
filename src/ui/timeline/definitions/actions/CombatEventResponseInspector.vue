<script setup lang="ts">
import { computed } from 'vue';
import type {
  CombatEventResponseDefinition,
  CombatEventHandlerDefinition,
} from '../../../../core/game-data/operatorDefinition';
import type { DefinitionProperty } from '../definitionEditContext';
import { eventOwnerInspectorFields } from '../inspector/eventInspectorSchema';
import InspectorFields from '../inspector/InspectorFields.vue';
import CombatEventTriggerEditor from './CombatEventTriggerEditor.vue';

type EventOwner = CombatEventResponseDefinition | CombatEventHandlerDefinition;
const props = defineProps<{
  response: EventOwner;
  binding: DefinitionProperty;
  scheduled?: boolean;
}>();
const fields = computed(() => eventOwnerInspectorFields<EventOwner>(props.scheduled === true));
</script>
<template>
  <section class="response-inspector">
    <header>
      <strong>{{ scheduled ? '技能事件响应' : '事件响应' }}</strong
      ><span>{{ response.event.kind }}</span>
    </header>
    <InspectorFields :value="response" :binding="binding" :fields="fields" />
    <CombatEventTriggerEditor :event="response.event" :binding="binding.child('event')" />
    <p>可选条件与{{ scheduled ? '调度' : '响应' }}序列在画布中作为子节点编辑。</p>
  </section>
</template>
<style scoped>
.response-inspector {
  min-width: 0;
  display: grid;
  gap: 12px;
}
header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ea-border-soft);
}
header span,
p {
  color: var(--ea-fg-muted);
  font-size: 11px;
}
p {
  margin: 0;
}
</style>
