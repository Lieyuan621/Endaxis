<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaCheckbox, EaInput } from '@/design-system';
import type { OperatorBuildPreset } from '../../../application/editor/operatorBuildPreset';
import type { GameDataRepository } from '../../../core/game-data/gameDataRepository';
import { getOperatorGameName } from '../../gameText';
import OperatorPresetBuildSummary from './OperatorPresetBuildSummary.vue';
const props = defineProps<{
  presets: readonly OperatorBuildPreset[];
  gameData: GameDataRepository;
  initialOperatorSlug?: string;
}>();
const emit = defineEmits<{ change: [selected: OperatorBuildPreset[]] }>();
const { t, locale } = useI18n();
const scope = ref(props.initialOperatorSlug ? 'operator' : 'all');
const search = ref('');
const selected = ref(
  new Set(
    props.presets
      .filter(
        p =>
          !props.initialOperatorSlug || p.build.operator.operatorSlug === props.initialOperatorSlug,
      )
      .map(p => p.id),
  ),
);
const visible = computed(() =>
  props.presets.filter(
    p =>
      (scope.value === 'all' || p.build.operator.operatorSlug === props.initialOperatorSlug) &&
      (!search.value.trim() ||
        [p.name, getOperatorGameName(p.build.operator.operatorSlug, locale.value)].some(text =>
          text.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase()),
        )),
  ),
);
const chosen = computed(() => props.presets.filter(p => selected.value.has(p.id)));
const checkedCount = computed(() => visible.value.filter(p => selected.value.has(p.id)).length);
watch(chosen, items => emit('change', items), { immediate: true });
function toggle(id: string, checked: boolean) {
  if (checked) selected.value.add(id);
  else selected.value.delete(id);
}
function toggleVisible(checked: boolean) {
  for (const preset of visible.value) toggle(preset.id, checked);
}
</script>
<template>
  <div class="preset-selection">
    <div class="preset-selection__toolbar">
      <EaButton
        v-if="initialOperatorSlug"
        size="sm"
        :pressed="scope === 'operator'"
        @click="scope = 'operator'"
        >{{ getOperatorGameName(initialOperatorSlug, locale) }}</EaButton
      >
      <EaButton size="sm" :pressed="scope === 'all'" @click="scope = 'all'">{{
        t('operatorPresets.all', { count: presets.length })
      }}</EaButton>
      <EaInput
        v-model="search"
        clearable
        :aria-label="t('operatorPresets.transferSearch')"
        :placeholder="t('operatorPresets.transferSearch')"
      />
    </div>
    <div class="preset-selection__toolbar">
      <EaCheckbox
        :model-value="visible.length > 0 && checkedCount === visible.length"
        :indeterminate="checkedCount > 0 && checkedCount < visible.length"
        @update:model-value="toggleVisible"
        >{{ t('operatorPresets.selectVisible') }}</EaCheckbox
      >
      <span>{{
        t('operatorPresets.selectedCount', { count: chosen.length, total: presets.length })
      }}</span>
    </div>
    <p v-if="!visible.length">{{ t('operatorPresets.noMatches') }}</p>
    <article v-for="preset in visible" :key="preset.id">
      <EaCheckbox
        :model-value="selected.has(preset.id)"
        @update:model-value="toggle(preset.id, $event)"
        >{{ preset.name }}</EaCheckbox
      >
      <OperatorPresetBuildSummary :build="preset.build" :game-data="gameData" />
    </article>
  </div>
</template>
<style scoped>
.preset-selection {
  display: grid;
  gap: var(--ea-space-3);
}
.preset-selection__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ea-space-2);
  font-size: 12px;
}
.preset-selection__toolbar > .ea-input {
  flex: 1;
  min-width: 160px;
}
.preset-selection article {
  display: grid;
  gap: var(--ea-space-2);
  padding: var(--ea-space-3);
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-soft);
}
</style>
