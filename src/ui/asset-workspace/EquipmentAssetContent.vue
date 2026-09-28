<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton } from '@/design-system';
import type { WorkspaceAssetDefinition } from './workspaceAssetDefinition';
import type { WorkspaceResource } from './workspaceResources';
import WorkspaceIcon from './WorkspaceIcon.vue';

const props = defineProps<{
  edit: Extract<WorkspaceAssetDefinition, { kind: 'weapon' | 'gear' | 'gearSet' }>;
  name: string;
  page: string;
  fields: readonly string[];
  resources: readonly WorkspaceResource[];
}>();
const emit = defineEmits<{
  page: [page: string];
  field: [field: string];
  open: [id: string];
  graph: [];
}>();
const { t, te } = useI18n();
const label = (field: string) => t(`definitionEditor.fields.${field}`);
const levels = [1, 20, 40, 60, 80, 90];
const contributionFields = ['modifiers', 'eventHandlers', 'blackboard'];
const basicFields = computed(() =>
  props.fields.filter(
    field =>
      ![
        'baseAttackAtLevelNodes',
        'enableSequence',
        'initializationSequence',
        ...contributionFields,
      ].includes(field),
  ),
);
const traits = computed(() =>
  props.resources.filter(resource =>
    ['weaponTrait', 'gearTrait'].includes(resource.definitionResource.kind),
  ),
);
function summary(field: string) {
  const value = Reflect.get(props.edit.definition, field);
  if (value === undefined) return '—';
  const key = `definitionEditor.options.${String(value)}`;
  return te(key) ? t(key) : String(value);
}
</script>

<template>
  <div class="ap-document-heading">
    <img v-if="edit.definition.iconPath" :src="edit.definition.iconPath" alt="" />
    <WorkspaceIcon v-else name="box" :size="30" />
    <div>
      <div class="ap-eyebrow">{{ t(`definitionEditor.kinds.${edit.kind}`) }}</div>
      <h1>{{ name }}</h1>
    </div>
  </div>
  <template v-if="page === 'overview'">
    <div class="ap-property-grid">
      <EaButton
        v-for="field in basicFields"
        :key="field"
        class="ap-reference-row"
        @click="emit('field', field)"
      >
        <span>{{ label(field) }}</span
        ><strong>{{ summary(field) }}</strong>
        <WorkspaceIcon name="arrow" :size="14" />
      </EaButton>
    </div>
    <div class="rw-operator-overview">
      <EaButton v-if="edit.kind === 'weapon'" @click="emit('page', 'growth')">
        <strong>{{ t('assetWorkspace.workspace.growth') }}</strong>
        <span>{{ label('baseAttackAtLevelNodes') }}</span
        ><WorkspaceIcon name="arrow" />
      </EaButton>
      <EaButton @click="emit('page', 'traits')">
        <strong>{{ t('assetWorkspace.workspace.traits') }}</strong>
        <span>{{ t('assetWorkspace.equipment.effectsHint') }}</span
        ><WorkspaceIcon name="arrow" />
      </EaButton>
    </div>
  </template>
  <template v-else-if="page === 'growth' && edit.kind === 'weapon'">
    <h2>{{ label('baseAttackAtLevelNodes') }}</h2>
    <p class="ap-muted">{{ t('assetWorkspace.equipment.growthHint') }}</p>
    <table class="rw-data-table">
      <thead>
        <tr>
          <th>{{ t('assetWorkspace.equipment.attribute') }}</th>
          <th v-for="level in levels" :key="level">Lv{{ level }}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>
            <EaButton size="sm" variant="ghost" @click="emit('field', 'baseAttackAtLevelNodes')">
              {{ t('assetWorkspace.equipment.attack') }}
            </EaButton>
          </th>
          <td v-for="(level, index) in levels" :key="level">
            {{ edit.definition.baseAttackAtLevelNodes[index] ?? '—' }}
          </td>
        </tr>
      </tbody>
    </table>
    <EaButton class="ap-reference-row" @click="emit('field', 'baseAttackAtLevelNodes')">
      {{ t('assetWorkspace.equipment.editGrowth') }}<WorkspaceIcon name="arrow" />
    </EaButton>
  </template>
  <template v-else-if="page === 'traits'">
    <h2>{{ t('assetWorkspace.workspace.traits') }}</h2>
    <template v-if="edit.kind === 'gearSet'">
      <p class="ap-muted">{{ t('assetWorkspace.equipment.setHint') }}</p>
      <EaButton v-if="edit.definition.actionGraph" class="ap-reference-row" @click="emit('graph')">
        <WorkspaceIcon name="graph" />{{ t('assetWorkspace.workspace.graph')
        }}<WorkspaceIcon name="arrow" />
      </EaButton>
      <div class="ap-property-grid">
        <EaButton
          v-for="field in contributionFields"
          :key="field"
          class="ap-reference-row"
          @click="emit('field', field)"
        >
          {{ label(field) }}<WorkspaceIcon name="arrow" />
        </EaButton>
      </div>
    </template>
    <div v-else class="ap-skill-family">
      <EaButton
        v-for="(trait, index) in traits"
        :key="trait.id"
        class="ap-skill-entry"
        @click="emit('open', trait.id)"
      >
        <WorkspaceIcon name="box" />
        <div>
          <strong>{{ t('assetWorkspace.equipment.traitSlot', { number: index + 1 }) }}</strong
          ><small>{{ trait.name }}</small>
        </div>
        <WorkspaceIcon name="arrow" />
      </EaButton>
    </div>
  </template>
</template>
