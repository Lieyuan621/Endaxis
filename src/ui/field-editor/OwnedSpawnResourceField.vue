<script setup lang="ts">
import { computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton } from '@/design-system';
import { structuredFieldContextKey } from './structuredFieldContext';
import { ownedResourceNavigationKey } from './ownedResourceNavigation';
import type { SpawnResourceSlot } from './spawnDefinitionSchema';
const props = defineProps<{
  value: unknown;
  slot: SpawnResourceSlot;
  path: readonly (string | number)[];
  label: string;
}>();
const { t } = useI18n();
const context = inject(structuredFieldContextKey, undefined);
const blocked = computed(() => context?.value.ownedNavigationBlocked === true);
const navigate = inject(ownedResourceNavigationKey, undefined);
const empty = computed(
  () =>
    props.value === undefined ||
    (props.slot === 'passiveSkills' && Array.isArray(props.value) && !props.value.length) ||
    (props.slot === 'childSkills' &&
      props.value !== null &&
      typeof props.value === 'object' &&
      !Array.isArray(props.value) &&
      !Object.keys(props.value).length),
);
const entries = computed(() => {
  const value = props.value;
  const rows: [string | number | undefined, unknown][] =
    props.slot === 'childSkill'
      ? value === undefined
        ? []
        : [[undefined, value]]
      : props.slot === 'childSkills' && value && typeof value === 'object' && !Array.isArray(value)
        ? Object.entries(value)
        : props.slot === 'passiveSkills' && Array.isArray(value)
          ? value.map((value, index) => [index, value])
          : [];
  return rows.slice(0, 50).map(([key, resource]) => {
    const data =
      resource && typeof resource === 'object' ? (resource as Record<string, unknown>) : {};
    const path = [...props.path, ...(key === undefined ? [] : [key])];
    return {
      path,
      label: String(data.skillId ?? data.key ?? key ?? props.slot),
      link: navigate?.(path, resource),
    };
  });
});
</script>
<template>
  <section data-owned-spawn-resource>
    <strong>{{ label }}</strong>
    <p>{{ t('spawnDefinitionField.resourceReadonly') }}</p>
    <p v-if="!entries.length">
      {{ t(empty ? 'spawnDefinitionField.absent' : 'spawnDefinitionField.invalid') }}
    </p>
    <div v-for="entry in entries" :key="JSON.stringify(entry.path)">
      <span>{{ entry.label }}</span>
      <EaButton
        v-if="entry.link"
        size="sm"
        :disabled="blocked"
        @click="!blocked && entry.link.open()"
        >{{ t('definitionEditor.openGraph') }}</EaButton
      >
      <small v-else>{{ t('spawnDefinitionField.navigationUnavailable') }}</small>
    </div>
    <small v-if="blocked">{{ t('spawnDefinitionField.finishDraft') }}</small>
    <small>{{ t('spawnDefinitionField.resourceListHint') }}</small>
  </section>
</template>
