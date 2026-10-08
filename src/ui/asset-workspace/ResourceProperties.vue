<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton } from '@/design-system';
import type { WorkspaceResource } from './workspaceResources';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
import DefinitionField from '../definition-editor/DefinitionField.vue';

const props = defineProps<{
  resource: WorkspaceResource;
  resources: readonly WorkspaceResource[];
  value: Record<string, unknown>;
  schema?: DefinitionFieldSchema;
  fields: readonly string[];
  editable: boolean;
  referenceChoices?: ReferenceChoices;
}>();
const emit = defineEmits<{
  change: [path: readonly (string | number)[], value: unknown];
  graph: [];
  open: [id: string];
}>();
const { t } = useI18n();
const tr = (key: string) => t(`assetWorkspace.programs.${key}`);
const schemas = computed(() => (props.schema?.kind === 'object' ? props.schema.fields : {}));
const sections = computed(() => {
  if (props.resource.definitionResource.kind === 'skill') {
    const groups = [
      { key: 'identity', fields: ['skillType', 'nativeSkillType', 'levelSource'] },
      {
        key: 'timing',
        fields: [
          'timelineBlockFrames',
          'naturalDurationFrames',
          'exclusiveFrame',
          'offsetRecordFrame',
          'timelineContinuationSkillId',
          'timelineBlockFollowUpSkillId',
        ],
      },
      { key: 'targeting', fields: ['smartTarget', 'enhancementStateBuffId'] },
      {
        key: 'casting',
        fields: ['cooldownFrames', 'costs', 'costFrame', 'availability', 'switchToBuffCast'],
      },
      { key: 'inputWindows', fields: ['inputWindows'] },
      { key: 'variables', fields: ['blackboard'] },
    ];
    return groups
      .map(group => ({ ...group, fields: group.fields.filter(key => props.fields.includes(key)) }))
      .filter(group => group.fields.length);
  }
  const variables = ['blackboard', 'blackboardEntries', 'blackboardAssignments'];
  const effects = ['modifiers', 'attachedBuffs', 'eventHandlers', 'attributes'];
  const metadata = ['key', 'id'];
  return [
    {
      key: 'parameters',
      fields: props.fields.filter(key => ![...variables, ...effects, ...metadata].includes(key)),
    },
    { key: 'variables', fields: props.fields.filter(key => variables.includes(key)) },
    { key: 'effects', fields: props.fields.filter(key => effects.includes(key)) },
  ].filter(section => section.fields.length);
});
const children = computed(() =>
  props.resources.filter(resource => resource.parent === props.resource.id),
);
</script>

<template>
  <section class="resource-properties">
    <header class="resource-properties__heading">
      <div>
        <h2>{{ resource.name }}</h2>
        <code>{{ resource.definitionResource.identity }}</code>
      </div>

      <EaButton v-if="value.actionGraph" @click="emit('graph')">{{
        t('assetWorkspace.workspace.graph')
      }}</EaButton>
    </header>
    <section v-for="section in sections" :key="section.key" class="resource-properties__section">
      <h3>{{ tr(section.key) }}</h3>
      <div class="resource-properties__fields">
        <DefinitionField
          v-for="key in section.fields"
          :key="`${resource.id}:${key}`"
          :name="key"
          :value="value[key]"
          :schema="schemas[key]"
          :path="[...resource.definitionResource.path, key]"
          :editable="editable"
          :reference-choices="referenceChoices"
          root
          :expand-depth="2"
          @change="(path, value) => emit('change', path, value)"
          @open-graph="emit('graph')"
        />
      </div>
    </section>
    <section v-if="children.length" class="resource-properties__section">
      <h3>{{ tr('ownedResources') }}</h3>
      <EaButton
        v-for="child in children"
        :key="child.id"
        class="resource-properties__child"
        @click="emit('open', child.id)"
      >
        <strong>{{ child.name }}</strong
        ><code>{{ child.definitionResource.identity }}</code>
      </EaButton>
    </section>
  </section>
</template>

<style scoped>
.resource-properties {
  max-width: 900px;
}
.resource-properties__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
.resource-properties__heading h2 {
  margin: 0 0 5px;
  font-size: 18px;
  overflow-wrap: anywhere;
}
code {
  color: var(--ea-fg-muted);
  font-size: 11px;
  overflow-wrap: anywhere;
}
.resource-properties__section {
  margin-bottom: 24px;
}
.resource-properties__section h3 {
  font-size: 13px;
  border-bottom: 1px solid var(--ea-border);
  padding-bottom: 10px;
  margin: 0 0 12px;
}
.resource-properties__fields {
  display: grid;
  gap: 0;
}
.resource-properties__fields > :deep(.definition-field) {
  padding: 8px 0;
  border-bottom: 1px solid var(--ea-border-soft);
}
.resource-properties__child {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  text-align: left;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--ea-border);
  padding: 12px;
}
</style>
