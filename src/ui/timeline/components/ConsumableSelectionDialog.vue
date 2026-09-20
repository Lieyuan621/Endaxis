<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ConsumableDefinition } from '../../../core/game-data/consumableDefinition';
import { getConsumableGameDescription, getConsumableGameName } from '../../gameText';
import { EaButton, EaInput } from '../../../design-system';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../interaction/usePopoverInteractionBoundary';

const props = defineProps<{
  visible: boolean;
  consumables: readonly ConsumableDefinition[];
}>();
const emit = defineEmits<{ close: []; select: [consumableId: string] }>();
usePopoverInteractionBoundary(
  useInteractionSession(),
  () => props.visible,
  () => emit('close'),
);
const { t } = useI18n({ useScope: 'global' });
const query = ref('');
watch(
  () => props.visible,
  visible => {
    if (visible) query.value = '';
  },
);
const filtered = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase();
  if (!keyword) return props.consumables;
  return props.consumables.filter(item => {
    const text = `${getConsumableGameName(item.id)} ${getConsumableGameDescription(item.id) ?? ''}`;
    return text.toLocaleLowerCase().includes(keyword);
  });
});
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="consumable-dialog-backdrop" @pointerdown.self="$emit('close')">
      <section class="consumable-dialog" role="dialog" aria-modal="true">
        <header>
          <h2>{{ t('consumable.dialogTitle') }}</h2>
          <EaButton variant="ghost" type="button" @click="$emit('close')">
            {{ t('common.close') }}
          </EaButton>
        </header>
        <EaInput
          v-model="query"
          clearable
          :placeholder="t('consumable.searchPlaceholder')"
          autofocus
        />
        <div class="consumable-dialog__grid">
          <EaButton
            v-for="item in filtered"
            :key="item.id"
            type="button"
            variant="ghost"
            class="consumable-dialog__item"
            @click="$emit('select', item.id)"
          >
            <img :src="item.iconPath" alt="" aria-hidden="true" />
            <span>
              <strong>{{ getConsumableGameName(item.id) }}</strong>
              <small>{{ getConsumableGameDescription(item.id) }}</small>
            </span>
            <b>{{ item.durationSeconds }}s</b>
          </EaButton>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.consumable-dialog-backdrop {
  position: fixed;
  z-index: 10020;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgb(0 0 0 / 55%);
}

.consumable-dialog {
  width: min(760px, calc(100vw - 36px));
  max-height: min(720px, calc(100vh - 36px));
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--ea-border);
  border-radius: 10px;
  background: var(--ea-bg);
  color: var(--ea-fg);
  box-shadow: 0 18px 60px rgb(0 0 0 / 55%);
}

.consumable-dialog header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.consumable-dialog h2 {
  margin: 0;
  font-size: 18px;
}

.consumable-dialog__grid {
  min-height: 0;
  overflow: auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.consumable-dialog__item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: start;
  justify-content: initial;
  gap: 9px;
  height: auto;
  min-height: 64px;
  padding: 8px;
  border: 1px solid var(--ea-border);
  border-radius: 7px;
  background: var(--ea-bg-soft);
  color: inherit;
  line-height: normal;
  text-align: left;
  white-space: normal;
  cursor: pointer;
}

.consumable-dialog__item:hover {
  border-color: var(--ea-accent);
}

.consumable-dialog__item img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.consumable-dialog__item span {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.consumable-dialog__item strong,
.consumable-dialog__item small {
  white-space: normal;
  overflow-wrap: anywhere;
}

.consumable-dialog__item strong {
  line-height: 1.35;
}

.consumable-dialog__item small {
  line-height: 1.5;
}

.consumable-dialog__item small,
.consumable-dialog__item b {
  color: var(--ea-fg-secondary);
  font-size: 11px;
}
</style>
