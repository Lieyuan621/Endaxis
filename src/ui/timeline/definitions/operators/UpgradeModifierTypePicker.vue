<script setup lang="ts">
import SearchableOptionPicker from '../../components/SearchableOptionPicker.vue';
import {
  UPGRADE_MODIFIER_KINDS,
  type UpgradeModifierDefinition,
} from '../../../../core/game-data/operatorDefinition';
import { upgradeModifierLabels } from './upgradeModifierLabels';
defineProps<{ anchor: { x: number; y: number } }>();
const emit = defineEmits<{ select: [kind: UpgradeModifierDefinition['kind']]; close: [] }>();
const options = UPGRADE_MODIFIER_KINDS.map(value => ({
  value,
  label: upgradeModifierLabels[value],
}));
function select(value: string) {
  const kind = UPGRADE_MODIFIER_KINDS.find(kind => kind === value);
  if (kind) emit('select', kind);
}
</script>
<template>
  <SearchableOptionPicker
    :anchor="anchor"
    title="构筑修正类型"
    :options="options"
    @select="select"
    @close="emit('close')"
  />
</template>
