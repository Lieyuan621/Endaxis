<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import WorkspaceIcon from './WorkspaceIcon.vue';
import { EaButton, EaInput } from '@/design-system';
import {
  workspaceResourcePath,
  type WorkspaceResource,
  type WorkspaceResourceReference,
} from './workspaceResources';

const props = defineProps<{
  asset: string;
  page: string;
  tab: string;
  variables: readonly { id: string; type: string }[];
  nodes: readonly { id: string; name: string }[];
  referencesReady?: boolean;
  hasTimeline?: boolean;
  hasGraph?: boolean;
  resources: readonly Pick<WorkspaceResource, 'id' | 'kind' | 'name' | 'parent'>[];
  references: readonly WorkspaceResourceReference[];
}>();
const emit = defineEmits<{
  page: [page: string];
  tab: [tab: string];
  open: [id: string];
  openAsset: [id: string];
  ownerPage: [page: string];
}>();
const { t } = useI18n();
const tr = (key: string) => t(`assetWorkspace.workspace.${key}`);
const query = ref('');
const byId = computed(() => new Map(props.resources.map(resource => [resource.id, resource])));
const resourceName = (id: string | undefined) =>
  id === undefined ? '' : (byId.value.get(id)?.name ?? id);
const owner = computed(() =>
  byId.value.get(workspaceResourcePath(byId.value, props.asset)[0] ?? ''),
);
const ownedResources = computed(() =>
  props.resources.filter(item => workspaceResourcePath(byId.value, item.id)[0] === owner.value?.id),
);
const resourceQuery = ref('');
const resourceGroups = computed(() =>
  ['skill', 'talent', 'potential', 'passive', 'buff', 'entity']
    .map(type => ({
      type,
      items: ownedResources.value.filter(
        item =>
          item.kind === type && item.name.toLowerCase().includes(resourceQuery.value.toLowerCase()),
      ),
    }))
    .filter(group => group.items.length),
);
const kind = computed(() => byId.value.get(props.asset)?.kind ?? props.asset);
const pages = computed(() => {
  if (kind.value === 'skill') return ['graph', 'timing', 'settings'];
  if (kind.value === 'operator') return ['overview', 'growth', 'skills', 'upgrades'];
  if (kind.value === 'weapon') return ['overview', 'growth', 'traits'];
  if (['gear', 'set'].includes(kind.value)) return ['overview', 'traits'];
  return ['overview'];
});
const tabs = computed(() =>
  kind.value === 'skill' || props.hasGraph
    ? ['content', 'variables', 'find', 'references']
    : ['content', 'resources', 'references'],
);
const children = computed(() => props.resources.filter(item => item.parent === props.asset));
const edges = computed(() =>
  props.references
    .filter(edge => edge.from === props.asset || (!edge.targetAsset && edge.to === props.asset))
    .sort((left, right) => Number(right.from === props.asset) - Number(left.from === props.asset)),
);
const found = computed(() =>
  props.nodes.filter(node =>
    `${node.name} ${node.id}`.toLowerCase().includes(query.value.toLowerCase()),
  ),
);
</script>

<template>
  <aside class="rw-tools">
    <section v-if="owner?.kind === 'operator'" class="rw-operator-navigation">
      <strong>{{ owner.name }}</strong>
      <div class="rw-section-label">{{ tr('operatorProperties') }}</div>
      <EaButton
        v-for="key in ['overview', 'growth', 'skills', 'upgrades']"
        :key="key"
        class="rw-nav"
        variant="ghost"
        :pressed="asset === owner.id && page === key"
        @click="emit('ownerPage', key)"
      >
        {{ tr(key) }}
      </EaButton>
      <div class="rw-section-label">{{ tr('assetSpace') }}</div>
      <EaInput
        class="rw-resource-search"
        v-model="resourceQuery"
        :aria-label="tr('searchOwned')"
        :placeholder="tr('searchOwned')"
      />
      <details v-for="group in resourceGroups" :key="group.type" open>
        <summary>
          {{ t(`assetWorkspace.catalog.kinds.${group.type}`) }}
          <small>{{ group.items.length }}</small>
        </summary>
        <EaButton
          v-for="resource in group.items"
          :key="resource.id"
          class="rw-nav"
          variant="ghost"
          :pressed="resource.id === asset"
          @click="emit('open', resource.id)"
        >
          {{ resource.name
          }}<small v-if="resource.parent !== owner.id">{{ resourceName(resource.parent) }}</small>
        </EaButton>
      </details>
    </section>
    <details v-else class="rw-asset-space" open>
      <summary>{{ owner?.name }} · {{ tr('assetSpace') }}</summary>
      <EaButton
        v-for="resource in ownedResources"
        :key="resource.id"
        class="rw-nav"
        variant="ghost"
        :pressed="resource.id === asset"
        :style="{
          paddingLeft: `${10 + Math.max(0, workspaceResourcePath(byId, resource.id).length - 1) * 12}px`,
        }"
        @click="emit('open', resource.id)"
      >
        <WorkspaceIcon :name="resource.kind === 'skill' ? 'graph' : 'box'" :size="13" />{{
          resource.name
        }}
      </EaButton>
    </details>
    <div v-if="owner?.kind !== 'operator' || asset !== owner.id" class="rw-resource">
      <WorkspaceIcon name="box" />
      <div>
        <strong>{{ resourceName(asset) }}</strong
        ><small>{{ tr('currentResource') }}</small>
      </div>
    </div>
    <div
      v-if="owner?.kind !== 'operator' || asset !== owner.id"
      class="rw-tool-tabs"
      role="tablist"
      :aria-label="tr('resourceTools')"
    >
      <EaButton
        variant="ghost"
        v-for="key in tabs"
        :key="key"
        role="tab"
        :pressed="tab === key"
        :aria-selected="tab === key"
        @click="emit('tab', key)"
      >
        {{ tr(key) }}
      </EaButton>
    </div>
    <div v-if="owner?.kind !== 'operator' || asset !== owner.id" class="rw-tool-content">
      <slot v-if="tab !== 'references'" name="tools" :tab="tab">
        <template v-if="tab === 'content'">
          <EaButton
            v-for="key in pages"
            :key="key"
            class="rw-nav"
            variant="ghost"
            :pressed="page === key"
            @click="emit('page', key)"
          >
            <WorkspaceIcon
              :name="key === 'graph' ? 'graph' : key === 'timing' ? 'timeline' : 'list'"
              :size="14"
            />{{ tr(key) }}
          </EaButton>
          <template v-if="hasTimeline"
            ><div class="rw-section-label">{{ tr('entryPoints') }}</div>
            <EaButton class="rw-nav" variant="ghost" @click="emit('page', 'graph')">
              <WorkspaceIcon name="timeline" :size="14" />{{ t('assetWorkspace.castTimeline') }}
            </EaButton></template
          >
        </template>
        <template v-else-if="tab === 'variables'">
          <div class="rw-section-label">{{ t('assetWorkspace.thisSkill') }}</div>
          <EaButton
            v-for="variable in variables"
            :key="variable.id"
            class="rw-nav"
            variant="ghost"
            @click="emit('page', 'graph')"
          >
            <span class="ap-variable-dot" />{{ variable.id }}<small>{{ variable.type }}</small>
          </EaButton>
          <p class="rw-hint">{{ tr('scopeHint') }}</p>
        </template>
        <template v-else-if="tab === 'resources'"
          ><EaButton
            v-for="child in children"
            :key="child.id"
            class="rw-nav"
            variant="ghost"
            @click="emit('open', child.id)"
          >
            <WorkspaceIcon name="box" :size="14" />{{ child.name
            }}<WorkspaceIcon name="arrow" :size="12" />
          </EaButton>
          <p v-if="!children.length" class="rw-hint">{{ tr('noResources') }}</p></template
        >
        <template v-else-if="tab === 'find'">
          <EaInput
            class="rw-resource-search"
            v-model="query"
            :placeholder="tr('findPlaceholder')"
          />
          <EaButton
            v-for="node in found"
            :key="node.id"
            class="rw-nav"
            variant="ghost"
            @click="emit('page', 'graph')"
          >
            <WorkspaceIcon name="search" :size="13" />{{ node.name }}<small>{{ node.id }}</small>
          </EaButton>
        </template>
      </slot>
      <template v-if="tab === 'references'">
        <p class="rw-hint">{{ tr('staticReferencesHint') }}</p>
        <EaButton
          v-for="edge in edges"
          :key="JSON.stringify([edge.from, edge.targetAsset?.id, edge.to])"
          class="rw-reference"
          variant="ghost"
          @click="
            edge.targetAsset
              ? emit('openAsset', edge.targetAsset.id)
              : emit('open', edge.from === asset ? edge.to : edge.from)
          "
        >
          <small
            >{{ t(`assetWorkspace.catalog.${edge.from === asset ? 'outgoing' : 'incoming'}`) }} ·
            {{ t(`assetWorkspace.catalog.relations.${edge.kind}`) }}</small
          >
          <span
            >{{ edge.targetAsset?.name ?? resourceName(edge.from === asset ? edge.to : edge.from)
            }}<WorkspaceIcon name="arrow" :size="12"
          /></span>
        </EaButton>
        <p v-if="!referencesReady" class="rw-hint">
          {{ t('assetWorkspace.integration.referencesPending') }}
        </p>
        <p v-else-if="!edges.length" class="rw-hint">{{ tr('noStaticReferences') }}</p>
      </template>
    </div>
    <div class="rw-tool-footer"><WorkspaceIcon name="info" :size="12" />{{ tr('localTools') }}</div>
  </aside>
</template>

<style scoped>
.rw-operator-navigation {
  min-height: 0;
  overflow: auto;
  flex: 1;
  padding: 12px 8px;
  border-bottom: 1px solid var(--ea-border);
}
.rw-operator-navigation > strong {
  display: block;
  padding: 0 8px;
}
.rw-operator-navigation > .rw-resource-search {
  width: 100%;
  margin: 3px 0 8px;
  font-size: 11px;
}
.rw-operator-navigation summary {
  cursor: pointer;
  padding: 7px 5px;
  color: var(--ea-fg-secondary);
  font-size: 11px;
}
.rw-operator-navigation summary small {
  float: right;
}
.rw-operator-navigation details .rw-nav {
  padding-left: 15px;
  flex-wrap: wrap;
}
.rw-operator-navigation details .rw-nav small {
  font-size: 9px;
  color: var(--ea-fg-muted);
}
.rw-asset-space {
  flex-shrink: 0;
  max-height: 38%;
  overflow: auto;
  border-bottom: 1px solid var(--ea-border);
  padding: 8px 0;
}
.rw-asset-space summary {
  padding: 3px 10px 8px;
  font-size: 11px;
  color: var(--ea-gold);
  cursor: pointer;
}
.rw-tools {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--ea-workbench-panel);
  overflow: hidden;
}
.rw-resource {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 16px 14px;
}
.rw-resource strong {
  font-size: 12px;
}
.rw-resource small {
  display: block;
  color: var(--ea-fg-muted);
  font-size: 10px;
  margin-top: 4px;
}
.rw-tool-tabs {
  display: flex;
  border-bottom: 1px solid var(--ea-border);
  padding: 0 7px;
}
.rw-tool-tabs button {
  flex: 1;
}
.rw-tool-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 13px 8px;
}
.rw-section-label {
  margin: 21px 8px 7px;
  font-size: 10px;
  color: var(--ea-fg-muted);
}
.rw-hint {
  font-size: 11px;
  line-height: 1.9;
  color: var(--ea-fg-muted);
  padding: 10px 8px;
}
.rw-reference {
  display: block;
  width: 100%;
  height: auto;
  white-space: normal;
  padding: 12px 8px;
  border-bottom: 1px solid var(--ea-border);
  text-align: left;
}
.rw-reference small {
  display: block;
  color: var(--ea-fg-muted);
  font-size: 9px;
  margin-bottom: 7px;
}
.rw-reference span {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}
.rw-tool-footer {
  display: flex;
  gap: 7px;
  padding: 14px;
  color: var(--ea-fg-muted);
  font-size: 10px;
  border-top: 1px solid var(--ea-border);
}
</style>
