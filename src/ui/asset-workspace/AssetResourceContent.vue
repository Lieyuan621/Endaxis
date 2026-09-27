<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { WorkspaceAssetDefinition } from './workspaceAssetDefinition';
import type { WorkspaceResource } from './workspaceResources';
import { fieldValueAt } from '../definition-editor/definitionFieldRuntime';
import WorkspaceIcon from './WorkspaceIcon.vue';
import EquipmentAssetContent from './EquipmentAssetContent.vue';
import OperatorProperties from './OperatorProperties.vue';
import OperatorPrograms from './OperatorPrograms.vue';
import ResourceProperties from './ResourceProperties.vue';
import type { DefinitionFieldSchema } from '../definition-editor/fieldSchema';
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
import type { OperatorResourceCommand } from '../../application/editor/operatorResourceCommands';

const props = defineProps<{
  edit: WorkspaceAssetDefinition;
  name: string;
  custom: boolean;
  resource: WorkspaceResource;
  resources: readonly WorkspaceResource[];
  page: string;
  fields: readonly string[];
  schema?: DefinitionFieldSchema;
  referenceChoices?: ReferenceChoices;
}>();
const emit = defineEmits<{
  page: [page: string];
  open: [id: string];
  field: [name: string];
  graph: [];
  change: [path: readonly (string | number)[], value: unknown];
  command: [command: OperatorResourceCommand];
}>();
const { t } = useI18n();
const tr = (key: string) => t(`assetWorkspace.${key}`);
const operator = computed(() =>
  props.edit.kind === 'operator' ? props.edit.definition : undefined,
);
const root = computed(() => props.resource.definitionResource.path.length === 0);
const value = computed(
  () =>
    fieldValueAt(props.edit.definition, props.resource.definitionResource.path) as Record<
      string,
      unknown
    >,
);
</script>

<template>
  <div class="ap-content-scroll">
    <template v-if="operator && root">
      <OperatorProperties
        v-if="page === 'overview' || page === 'growth'"
        :definition="operator"
        :editable="custom"
        :page="page"
        @change="(path, value) => emit('change', path, value)"
      />
      <OperatorPrograms
        v-else
        :definition="operator"
        :resources="resources"
        :page="page"
        :editable="custom"
        @command="emit('command', $event)"
        @open="emit('open', $event)"
        @field="emit('field', $event)"
      />
    </template>
    <EquipmentAssetContent
      v-else-if="
        root && (edit.kind === 'weapon' || edit.kind === 'gear' || edit.kind === 'gearSet')
      "
      :edit="edit"
      :name="name"
      :page="page"
      :fields="fields"
      :resources="resources"
      @page="emit('page', $event)"
      @field="emit('field', $event)"
      @open="emit('open', $event)"
      @graph="emit('graph')"
    />
    <template v-else-if="edit.kind === 'globalEffect' && root">
      <div class="ap-document-heading">
        <WorkspaceIcon name="box" :size="30" />
        <div>
          <div class="ap-eyebrow">{{ tr('types.globalEffect') }}</div>
          <h1>{{ name }}</h1>
        </div>
      </div>
      <p class="ap-muted">{{ tr('globalEffect.hint') }}</p>
      <h2>{{ tr('globalEffect.buff') }}</h2>
      <p class="ap-muted">{{ tr('globalEffect.buffHint') }}</p>
      <button
        class="rw-native-button ap-reference-row"
        @click="emit('open', JSON.stringify(['buff']))"
      >
        {{ tr('globalEffect.openBuff') }}<WorkspaceIcon name="arrow" />
      </button>
    </template>
    <ResourceProperties
      v-else
      :resource="resource"
      :resources="resources"
      :value="value"
      :schema="schema"
      :fields="fields"
      :editable="custom"
      :reference-choices="referenceChoices"
      @change="(path, value) => emit('change', path, value)"
      @open="emit('open', $event)"
      @graph="emit('graph')"
    />
  </div>
</template>
