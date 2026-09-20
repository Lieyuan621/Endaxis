<script setup lang="ts">
import { ElIcon } from 'element-plus';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type CSSProperties,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { Plus, Search } from '@element-plus/icons-vue';
import type { EditableCombatStepKind } from '../skills/skillDefinitionEditorViewModel';
import { STEP_TYPE_GROUPS } from './stepTypePickerCatalog';
import { useInteractionSession } from '../../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../../interaction/usePopoverInteractionBoundary';

const props = defineProps<{
  disabled?: boolean;
  compact?: boolean;
  openOnMount?: boolean;
  hideTrigger?: boolean;
  anchor?: { readonly x: number; readonly y: number };
}>();
const emit = defineEmits<{ select: [kind: EditableCombatStepKind]; close: [] }>();
const { t } = useI18n({ useScope: 'global' });
const root = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();
const popover = ref<HTMLElement>();
const searchInput = ref<HTMLInputElement>();
const open = ref(false);
usePopoverInteractionBoundary(useInteractionSession(), () => open.value, close);
const query = ref('');
const popoverStyle = ref<CSSProperties>({});

const filteredGroups = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase();
  return STEP_TYPE_GROUPS.map(group => ({
    ...group,
    kinds: needle
      ? group.kinds.filter(kind =>
          String(t(`timeline.skillEditing.stepKinds.${kind}`))
            .toLocaleLowerCase()
            .includes(needle),
        )
      : group.kinds,
  })).filter(group => group.kinds.length > 0);
});

async function toggle(): Promise<void> {
  if (open.value) {
    close();
    return;
  }
  open.value = true;
  query.value = '';
  await nextTick();
  updatePosition();
  searchInput.value?.focus();
}

function close(): void {
  if (!open.value) return;
  open.value = false;
  emit('close');
}

function updatePosition(): void {
  if (!open.value || (trigger.value === undefined && props.anchor === undefined)) return;
  const rect = trigger.value?.getBoundingClientRect();
  const anchorLeft = props.anchor?.x ?? rect!.left;
  const anchorTop = props.anchor?.y ?? rect!.top;
  const anchorBottom = props.anchor?.y ?? rect!.bottom;
  const width = Math.min(360, window.innerWidth - 24);
  const left = Math.max(12, Math.min(anchorLeft, window.innerWidth - width - 12));
  const spaceAbove = anchorTop - 12;
  const spaceBelow = window.innerHeight - anchorBottom - 12;
  const openBelow = spaceBelow >= 320 || spaceBelow >= spaceAbove;
  const availableHeight = openBelow ? spaceBelow : spaceAbove;
  popoverStyle.value = {
    left: `${left}px`,
    width: `${width}px`,
    top: openBelow ? `${anchorBottom + 6}px` : undefined,
    bottom: openBelow ? undefined : `${window.innerHeight - anchorTop + 6}px`,
    '--step-picker-options-height': `${Math.max(140, availableHeight - 112)}px`,
  } as CSSProperties;
}

function choose(kind: EditableCombatStepKind): void {
  emit('select', kind);
  open.value = false;
}

function closeFromOutside(event: PointerEvent): void {
  const target = event.target as Node;
  if (!root.value?.contains(target) && !popover.value?.contains(target)) close();
}

onMounted(() => {
  document.addEventListener('pointerdown', closeFromOutside);
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);
  if (props.openOnMount) void toggle();
});
watch(() => props.anchor, updatePosition, { deep: true });
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeFromOutside);
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition, true);
});
</script>

<template>
  <div ref="root" class="step-type-picker" :class="{ 'is-compact': compact }">
    <button
      v-if="!hideTrigger"
      ref="trigger"
      type="button"
      class="step-type-picker__trigger"
      :disabled="disabled"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="toggle"
    >
      <el-icon><Plus /></el-icon>
      <span v-if="!compact">{{ t('timeline.skillEditing.addStep') }}</span>
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="popover"
        class="step-type-picker__popover"
        :class="{ 'is-compact': props.compact }"
        :style="popoverStyle"
        role="menu"
      >
        <div class="step-type-picker__heading">
          <strong>{{ t('timeline.skillEditing.chooseStepType') }}</strong>
          <span>{{ t('timeline.skillEditing.chooseStepTypeHint') }}</span>
        </div>
        <label class="step-type-picker__search">
          <el-icon><Search /></el-icon>
          <input
            ref="searchInput"
            v-model="query"
            type="search"
            :placeholder="t('timeline.skillEditing.searchStepTypes')"
          />
        </label>
        <div class="step-type-picker__options">
          <section v-for="group in filteredGroups" :key="group.key">
            <h5>{{ t(`timeline.skillEditing.stepTypeGroups.${group.key}`) }}</h5>
            <button
              v-for="kind in group.kinds"
              :key="kind"
              type="button"
              role="menuitem"
              @click="choose(kind)"
            >
              {{ t(`timeline.skillEditing.stepKinds.${kind}`) }}
            </button>
          </section>
          <div v-if="filteredGroups.length === 0" class="step-type-picker__empty">
            {{ t('timeline.skillEditing.noStepTypesFound') }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.step-type-picker {
  position: relative;
}
.step-type-picker__trigger {
  width: 100%;
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px dashed var(--ea-border);
  background: transparent;
  color: var(--ea-fg-muted);
  cursor: pointer;
}
.step-type-picker__trigger:hover:not(:disabled),
.step-type-picker__trigger[aria-expanded='true'] {
  border-color: var(--ea-gold);
  background: var(--ea-active-fill);
  color: var(--ea-gold);
}
.step-type-picker.is-compact .step-type-picker__trigger {
  width: 32px;
  min-height: 30px;
}
.step-type-picker__popover {
  position: fixed;
  z-index: 4000;
  border: 1px solid var(--ea-border);
  background: var(--ea-workbench-panel);
  box-shadow: 0 12px 32px rgb(0 0 0 / 45%);
}
.step-type-picker__heading {
  display: grid;
  gap: 3px;
  padding: 12px 13px 9px;
  border-bottom: 1px solid var(--ea-border-soft);
}
.step-type-picker__heading strong {
  color: var(--ea-fg);
  font-size: 12px;
}
.step-type-picker__heading span {
  color: var(--ea-fg-muted);
  font-size: 10px;
}
.step-type-picker__search {
  height: 32px;
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 9px;
  padding: 0 9px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg-muted);
}
.step-type-picker__search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ea-fg);
}
.step-type-picker__options {
  max-height: min(360px, var(--step-picker-options-height, 360px));
  padding: 0 9px 9px;
  overflow-y: auto;
}
.step-type-picker__options section + section {
  margin-top: 8px;
}
.step-type-picker__options h5 {
  margin: 0;
  padding: 5px 4px;
  color: var(--ea-fg-muted);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.step-type-picker__options button {
  width: 100%;
  min-height: 30px;
  display: block;
  padding: 5px 8px;
  border: 0;
  background: transparent;
  color: var(--ea-fg);
  text-align: left;
  cursor: pointer;
}
.step-type-picker__options button:hover,
.step-type-picker__options button:focus-visible {
  outline: 0;
  background: var(--ea-active-fill);
  color: var(--ea-gold);
}
.step-type-picker__empty {
  padding: 24px 8px;
  color: var(--ea-fg-muted);
  text-align: center;
}
</style>
