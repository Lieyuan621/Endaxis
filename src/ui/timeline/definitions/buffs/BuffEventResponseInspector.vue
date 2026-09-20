<script setup lang="ts">
import type {
  SkillBuffAbilityEventResponse,
  SkillBuffIgniteEventResponse,
} from '../../../../core/game-data/operatorDefinition';
import { BUFF_ABILITY_EVENTS } from '../../../../core/game-data/operatorDefinition';
import AbilityEventOptions from '../actions/AbilityEventOptions.vue';
import type { DefinitionProperty } from '../definitionEditContext';

const props = defineProps<
  | { kind: 'ability'; response: SkillBuffAbilityEventResponse; binding?: DefinitionProperty }
  | { kind: 'ignite'; response: SkillBuffIgniteEventResponse; binding?: DefinitionProperty }
>();
const emit = defineEmits<{
  update: [response: SkillBuffAbilityEventResponse | SkillBuffIgniteEventResponse];
}>();
function fieldPath(field: string) {
  return JSON.stringify([...(props.binding?.path ?? []), field]);
}
function write(field: string, value: unknown) {
  if (props.binding)
    props.binding.update(
      current => ({ ...(current as object), [field]: value }),
      [...props.binding.path, field],
    );
  else emit('update', { ...props.response, [field]: value });
}

function setAbilityEvent(event: Event): void {
  if (props.kind !== 'ability') return;
  write('event', (event.target as HTMLSelectElement).value);
}

function setPriority(event: Event): void {
  if (props.kind !== 'ability') return;
  if ((event.target as HTMLInputElement).value.trim() === '') return;
  const priority = Number((event.target as HTMLInputElement).value);
  if (Number.isInteger(priority)) write('priority', priority);
}

function setIgniteType(event: Event): void {
  if (props.kind !== 'ignite') return;
  write('igniteType', (event.target as HTMLInputElement).value);
}

function setFinishAfterIgnited(event: Event): void {
  if (props.kind !== 'ignite') return;
  write('finishAfterIgnited', (event.target as HTMLInputElement).checked);
}
</script>

<template>
  <section class="response-inspector">
    <header>
      <strong>{{ kind === 'ability' ? 'Buff Ability 事件响应' : 'Buff 点燃响应' }}</strong>
      <span>{{ kind === 'ability' ? response.event : response.igniteType }}</span>
    </header>
    <template v-if="kind === 'ability'">
      <label :data-property-path="fieldPath('event')">
        <span>事件</span>
        <select :value="response.event" @change="setAbilityEvent">
          <AbilityEventOptions :events="BUFF_ABILITY_EVENTS" :current="response.event" />
        </select>
      </label>
      <label :data-property-path="fieldPath('priority')">
        <span>优先级（整数）</span>
        <input type="number" step="1" :value="response.priority" @change="setPriority" />
      </label>
    </template>
    <template v-else>
      <label :data-property-path="fieldPath('igniteType')">
        <span>点燃类型</span>
        <input :value="response.igniteType" @change="setIgniteType" />
      </label>
      <label class="check-field" :data-property-path="fieldPath('finishAfterIgnited')">
        <input
          type="checkbox"
          :checked="response.finishAfterIgnited"
          @change="setFinishAfterIgnited"
        />
        <span>触发后结束 Buff</span>
      </label>
    </template>
    <p>响应序列在画布的子节点中编辑。</p>
  </section>
</template>

<style scoped>
.response-inspector {
  min-width: 0;
  display: grid;
  gap: 12px;
}
header {
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ea-border-soft);
}
header span,
label span,
p {
  color: var(--ea-fg-muted);
  font-size: 11px;
}
header span {
  min-width: 0;
  overflow-wrap: anywhere;
}
label {
  min-width: 0;
  display: grid;
  gap: 6px;
}
input,
select {
  width: 100%;
  height: 32px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
.check-field {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
}
.check-field input {
  width: 16px;
  height: 16px;
}
p {
  margin: 0;
}
</style>
