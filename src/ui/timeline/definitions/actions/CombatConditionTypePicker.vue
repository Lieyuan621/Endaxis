<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, type CSSProperties } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  COMBAT_CONDITION_KINDS,
  type CombatCondition,
  type CombatConditionKind,
} from '../../../../core/game-data/operatorDefinition';
import { createCombatCondition } from './combatConditionEditorViewModel';
import { useInteractionSession } from '../../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../../interaction/usePopoverInteractionBoundary';

const props = defineProps<{ anchor: { readonly x: number; readonly y: number } }>();
const emit = defineEmits<{ select: [condition: CombatCondition]; close: [] }>();
usePopoverInteractionBoundary(
  useInteractionSession(),
  () => true,
  () => emit('close'),
);
const { t } = useI18n({ useScope: 'global' });
const popover = ref<HTMLElement>();
const search = ref<HTMLInputElement>();
const query = ref('');
const style = ref<CSSProperties>({});
const kinds = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase();
  return needle === ''
    ? COMBAT_CONDITION_KINDS
    : COMBAT_CONDITION_KINDS.filter(kind => label(kind).toLocaleLowerCase().includes(needle));
});

function label(kind: CombatConditionKind): string {
  return kind === 'enemyRankIn'
    ? 'Enemy rank'
    : String(t(`timeline.skillEditing.conditionKinds.${kind}`));
}

function choose(kind: CombatConditionKind): void {
  emit('select', createCombatCondition(kind));
}

function position(): void {
  const width = Math.min(360, window.innerWidth - 24);
  const left = Math.max(12, Math.min(props.anchor.x, window.innerWidth - width - 12));
  const below = window.innerHeight - props.anchor.y > 360;
  style.value = {
    left: `${left}px`,
    width: `${width}px`,
    top: below ? `${props.anchor.y + 6}px` : undefined,
    bottom: below ? undefined : `${window.innerHeight - props.anchor.y + 6}px`,
  };
}

function outside(event: PointerEvent): void {
  if (!popover.value?.contains(event.target as Node)) emit('close');
}

onMounted(async () => {
  await nextTick();
  position();
  search.value?.focus();
  document.addEventListener('pointerdown', outside);
  window.addEventListener('resize', position);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', outside);
  window.removeEventListener('resize', position);
});
</script>

<template>
  <Teleport to="body">
    <div ref="popover" class="condition-type-picker" :style="style">
      <header>
        <strong>选择条件类型</strong>
        <span>组合关系将在画布中展开</span>
      </header>
      <input ref="search" v-model="query" type="search" placeholder="搜索条件类型" />
      <div class="options">
        <button v-for="kind in kinds" :key="kind" @click="choose(kind)">{{ label(kind) }}</button>
        <p v-if="kinds.length === 0">没有匹配的条件</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.condition-type-picker {
  position: fixed;
  z-index: 4100;
  border: 1px solid var(--ea-border);
  background: var(--ea-workbench-panel);
  box-shadow: 0 12px 32px rgb(0 0 0 / 45%);
}
header {
  display: grid;
  gap: 3px;
  padding: 12px;
  border-bottom: 1px solid var(--ea-border-soft);
}
header span,
.options p {
  color: var(--ea-fg-muted);
  font-size: 10px;
}
input {
  width: calc(100% - 20px);
  height: 32px;
  box-sizing: border-box;
  margin: 10px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
.options {
  display: grid;
  max-height: min(390px, calc(100vh - 180px));
  padding: 0 10px 10px;
  overflow: auto;
}
button {
  min-height: 30px;
  padding: 5px 8px;
  border: 0;
  background: transparent;
  color: var(--ea-fg-secondary);
  text-align: left;
  cursor: pointer;
}
button:hover,
button:focus-visible {
  outline: 0;
  background: var(--ea-active-fill);
  color: var(--ea-gold);
}
</style>
