<script setup lang="ts">
import type {
  ActionBlackboardValue,
  SkillGlobalBuffDefinition,
} from '../../../../core/game-data/operatorDefinition';

const props = defineProps<{ definition: SkillGlobalBuffDefinition }>();
const emit = defineEmits<{ update: [definition: SkillGlobalBuffDefinition] }>();

function replace(patch: Partial<SkillGlobalBuffDefinition>): void {
  emit('update', { ...props.definition, ...patch });
}

function setOptionalNumber(field: 'maxStackCount', event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  const next = { ...props.definition };
  if (raw === '') delete next[field];
  else {
    const value = Math.round(Number(raw));
    if (!Number.isFinite(value) || value <= 0) return;
    next[field] = value;
  }
  emit('update', next);
}

function setDurationKind(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  const next = { ...props.definition };
  if (value === 'none') delete next.durationSeconds;
  else next.durationSeconds = value === 'number' ? 10 : { blackboardKey: 'duration' };
  emit('update', next);
}

function setDuration(event: Event): void {
  const duration = props.definition.durationSeconds;
  if (typeof duration === 'number') {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value) && value >= 0) replace({ durationSeconds: value });
  } else if (duration !== undefined) {
    replace({ durationSeconds: { blackboardKey: (event.target as HTMLInputElement).value } });
  }
}

function appendBlackboard(): void {
  let index = 1;
  while (`value${index}` in props.definition.blackboard) index += 1;
  replace({ blackboard: { ...props.definition.blackboard, [`value${index}`]: 0 } });
}

function removeBlackboard(key: string): void {
  const blackboard = { ...props.definition.blackboard };
  delete blackboard[key];
  replace({ blackboard });
}

function renameBlackboard(oldKey: string, event: Event): void {
  const key = (event.target as HTMLInputElement).value.trim();
  if (key === '' || (key !== oldKey && key in props.definition.blackboard)) return;
  const blackboard: Record<string, ActionBlackboardValue> = {};
  for (const [entryKey, value] of Object.entries(props.definition.blackboard)) {
    blackboard[entryKey === oldKey ? key : entryKey] = value;
  }
  replace({ blackboard });
}

function setBlackboardValue(key: string, event: Event): void {
  const input = event.target as HTMLInputElement;
  const raw = input.value;
  const value: ActionBlackboardValue = input.dataset.kind === 'number' ? Number(raw) : raw;
  if (typeof value === 'number' && !Number.isFinite(value)) return;
  replace({ blackboard: { ...props.definition.blackboard, [key]: value } });
}

function setBlackboardKind(key: string, event: Event): void {
  const kind = (event.target as HTMLSelectElement).value;
  replace({
    blackboard: {
      ...props.definition.blackboard,
      [key]: kind === 'number' ? 0 : kind === 'null' ? null : '',
    },
  });
}
</script>

<template>
  <section class="global-definition">
    <label
      ><span>叠加方式</span
      ><select
        :value="definition.stackingType"
        @change="
          replace({
            stackingType: ($event.target as HTMLSelectElement).value as 'unlimited' | 'stack',
          })
        "
      >
        <option value="unlimited">实例无限制</option>
        <option value="stack">同组叠层</option>
      </select></label
    >
    <label v-if="definition.stackingType === 'stack'"
      ><span>最大层数</span
      ><input
        type="number"
        min="1"
        step="1"
        :value="definition.maxStackCount ?? ''"
        @input="setOptionalNumber('maxStackCount', $event)"
    /></label>
    <label
      ><span>持续时间来源</span
      ><select
        :value="
          definition.durationSeconds === undefined
            ? 'none'
            : typeof definition.durationSeconds === 'number'
              ? 'number'
              : 'blackboard'
        "
        @change="setDurationKind"
      >
        <option value="none">无限</option>
        <option value="number">固定秒数</option>
        <option value="blackboard">父黑板键</option>
      </select></label
    >
    <label v-if="definition.durationSeconds !== undefined"
      ><span>{{ typeof definition.durationSeconds === 'number' ? '持续秒数' : '父黑板键' }}</span
      ><input
        :type="typeof definition.durationSeconds === 'number' ? 'number' : 'text'"
        :value="
          typeof definition.durationSeconds === 'number'
            ? definition.durationSeconds
            : definition.durationSeconds.blackboardKey
        "
        @input="setDuration"
    /></label>
    <label class="global-definition__toggle"
      ><input
        type="checkbox"
        :checked="definition.applyIconDurationToBuffs === true"
        @change="replace({ applyIconDurationToBuffs: ($event.target as HTMLInputElement).checked })"
      />将父时长显示为子 Buff 图标时长</label
    >
    <fieldset>
      <legend>父实例初始黑板</legend>
      <div
        v-for="(value, key) in definition.blackboard"
        :key="key"
        class="global-definition__blackboard-row"
      >
        <input type="text" :value="key" @change="renameBlackboard(String(key), $event)" />
        <select
          :value="value === null ? 'null' : typeof value === 'number' ? 'number' : 'string'"
          @change="setBlackboardKind(String(key), $event)"
        >
          <option value="number">数值</option>
          <option value="string">文本</option>
          <option value="null">空值</option>
        </select>
        <input
          :disabled="value === null"
          :data-kind="typeof value === 'number' ? 'number' : 'string'"
          :type="typeof value === 'number' ? 'number' : 'text'"
          :value="value ?? ''"
          @input="setBlackboardValue(String(key), $event)"
        />
        <button type="button" @click="removeBlackboard(String(key))">×</button>
      </div>
      <button type="button" @click="appendBlackboard">＋ 添加父黑板值</button>
    </fieldset>
    <p>子 Buff 是父定义的有序成员，请从左侧导图添加和选择。</p>
  </section>
</template>

<style scoped>
.global-definition {
  display: grid;
  gap: 10px;
}
.global-definition > label {
  display: grid;
  grid-template-columns: minmax(140px, 180px) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}
.global-definition .global-definition__toggle {
  display: flex;
}
.global-definition input,
.global-definition select,
.global-definition button {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.global-definition fieldset {
  min-width: 0;
  display: grid;
  gap: 8px;
  border: 1px solid var(--ea-border-soft);
}
.global-definition__blackboard-row {
  display: grid;
  grid-template-columns: minmax(80px, 0.7fr) 75px minmax(80px, 1fr) 28px;
  gap: 8px;
}
.global-definition p {
  margin: 0;
  color: var(--ea-fg-muted);
}
</style>
