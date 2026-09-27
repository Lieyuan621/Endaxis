<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import WorkspaceIcon from './WorkspaceIcon.vue';
import { EaInput } from '@/design-system';
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
      <button
        v-for="key in ['overview', 'growth', 'skills', 'upgrades']"
        :key="key"
        class="rw-native-button rw-nav"
        :class="{ selected: asset === owner.id && page === key }"
        @click="emit('ownerPage', key)"
      >
        {{ tr(key) }}
      </button>
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
        <button
          v-for="resource in group.items"
          :key="resource.id"
          class="rw-native-button rw-nav"
          :class="{ selected: resource.id === asset }"
          @click="emit('open', resource.id)"
        >
          {{ resource.name
          }}<small v-if="resource.parent !== owner.id">{{ resourceName(resource.parent) }}</small>
        </button>
      </details>
    </section>
    <details v-else class="rw-asset-space" open>
      <summary>{{ owner?.name }} · {{ tr('assetSpace') }}</summary>
      <button
        v-for="resource in ownedResources"
        :key="resource.id"
        class="rw-native-button rw-nav"
        :class="{ selected: resource.id === asset }"
        :style="{
          paddingLeft: `${10 + Math.max(0, workspaceResourcePath(byId, resource.id).length - 1) * 12}px`,
        }"
        @click="emit('open', resource.id)"
      >
        <WorkspaceIcon :name="resource.kind === 'skill' ? 'graph' : 'box'" :size="13" />{{
          resource.name
        }}
      </button>
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
      <button
        class="rw-native-button"
        v-for="key in tabs"
        :key="key"
        role="tab"
        :aria-selected="tab === key"
        @click="emit('tab', key)"
      >
        {{ tr(key) }}
      </button>
    </div>
    <div v-if="owner?.kind !== 'operator' || asset !== owner.id" class="rw-tool-content">
      <slot v-if="tab !== 'references'" name="tools" :tab="tab">
        <template v-if="tab === 'content'">
          <button
            v-for="key in pages"
            :key="key"
            class="rw-native-button rw-nav"
            :class="{ selected: page === key }"
            @click="emit('page', key)"
          >
            <WorkspaceIcon
              :name="key === 'graph' ? 'graph' : key === 'timing' ? 'timeline' : 'list'"
              :size="14"
            />{{ tr(key) }}
          </button>
          <template v-if="hasTimeline"
            ><div class="rw-section-label">{{ tr('entryPoints') }}</div>
            <button class="rw-native-button rw-nav" @click="emit('page', 'graph')">
              <WorkspaceIcon name="timeline" :size="14" />{{ t('assetWorkspace.castTimeline') }}
            </button></template
          >
        </template>
        <template v-else-if="tab === 'variables'">
          <div class="rw-section-label">{{ t('assetWorkspace.thisSkill') }}</div>
          <button
            v-for="variable in variables"
            :key="variable.id"
            class="rw-native-button rw-nav"
            @click="emit('page', 'graph')"
          >
            <span class="ap-variable-dot" />{{ variable.id }}<small>{{ variable.type }}</small>
          </button>
          <p class="rw-hint">{{ tr('scopeHint') }}</p>
        </template>
        <template v-else-if="tab === 'resources'"
          ><button
            v-for="child in children"
            :key="child.id"
            class="rw-native-button rw-nav"
            @click="emit('open', child.id)"
          >
            <WorkspaceIcon name="box" :size="14" />{{ child.name
            }}<WorkspaceIcon name="arrow" :size="12" />
          </button>
          <p v-if="!children.length" class="rw-hint">{{ tr('noResources') }}</p></template
        >
        <template v-else-if="tab === 'find'">
          <EaInput
            class="rw-resource-search"
            v-model="query"
            :placeholder="tr('findPlaceholder')"
          />
          <button
            v-for="node in found"
            :key="node.id"
            class="rw-native-button rw-nav"
            @click="emit('page', 'graph')"
          >
            <WorkspaceIcon name="search" :size="13" />{{ node.name }}<small>{{ node.id }}</small>
          </button>
        </template>
      </slot>
      <template v-if="tab === 'references'">
        <p class="rw-hint">{{ tr('staticReferencesHint') }}</p>
        <button
          v-for="edge in edges"
          :key="JSON.stringify([edge.from, edge.targetAsset?.id, edge.to])"
          class="rw-native-button rw-reference"
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
        </button>
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
  border-bottom: 1px solid #47545e;
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
  color: #aebbc6;
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
  color: #8497a5;
}
.rw-asset-space {
  flex-shrink: 0;
  max-height: 38%;
  overflow: auto;
  border-bottom: 1px solid #47545e;
  padding: 8px 0;
}
.rw-asset-space summary {
  padding: 3px 10px 8px;
  font-size: 11px;
  color: #d5ceaa;
  cursor: pointer;
}
.rw-tools {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #252b30;
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
  color: #8096a5;
  font-size: 10px;
  margin-top: 4px;
}
.rw-tool-tabs {
  display: flex;
  border-bottom: 1px solid #42505a;
  padding: 0 7px;
}
.rw-tool-tabs button {
  flex: 1;
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  padding: 9px 2px;
  font-size: 11px !important;
  color: #96a8b5;
}
.rw-tool-tabs button[aria-selected='true'] {
  border-bottom-color: #dccc70;
  color: #e5d88b;
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
  color: #8d9faa;
}
.rw-hint {
  font-size: 11px;
  line-height: 1.9;
  color: #8d9faa;
  padding: 10px 8px;
}
.rw-reference {
  display: block;
  width: 100%;
  padding: 12px 8px;
  border: 0;
  border-bottom: 1px solid #3a4851;
  background: none;
  text-align: left;
}
.rw-reference small {
  display: block;
  color: #86a4b7;
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
  color: #8296a3;
  font-size: 10px;
  border-top: 1px solid #3b4851;
}
</style>
