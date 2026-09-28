<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import WorkspaceIcon from './WorkspaceIcon.vue';
import { EaButton, EaFilterChip, EaInput } from '@/design-system';
import OperatorAvatar from '../components/OperatorAvatar.vue';
import type { AssetCatalogEntry } from './assetCatalog';

const props = defineProps<{ selected: string; assets: readonly AssetCatalogEntry[] }>();
const emit = defineEmits<{ navigate: [id: string]; close: [] }>();
const { t } = useI18n();
const tr = (key: string) => t(`assetWorkspace.browser.${key}`);
const byId = computed(() => new Map(props.assets.map(asset => [asset.id, asset])));
const name = (id: string) => byId.value.get(id)?.name ?? id;
const kind = (value: string) => props.assets.find(asset => asset.kind === value)?.kindName ?? value;
const sourceOf = (id: string) => (byId.value.get(id)?.custom ? 'custom' : 'builtin');
const source = ref('');

const typeFilter = ref('');
const selection = ref(props.selected);
const query = ref('');
const view = ref<'grid' | 'list'>('grid');
const types = computed(() => [...new Set(props.assets.map(asset => asset.kind))]);
const results = ref<HTMLElement>();
const matching = computed(() =>
  props.assets.filter(
    asset =>
      (!source.value || sourceOf(asset.id) === source.value) &&
      `${name(asset.id)} ${asset.id} ${kind(asset.kind)}`
        .toLowerCase()
        .includes(query.value.trim().toLowerCase()),
  ),
);
const visible = computed(() =>
  matching.value.filter(asset => !typeFilter.value || asset.kind === typeFilter.value),
);
function clear() {
  source.value = '';
  typeFilter.value = '';
  query.value = '';
}
async function locate() {
  clear();
  const asset = byId.value.get(props.selected);
  if (!asset) return;
  source.value = sourceOf(asset.id);
  typeFilter.value = asset.kind;
  selection.value = asset.id;
  await nextTick();
  results.value?.querySelector('.selected')?.scrollIntoView({ block: 'nearest' });
}
</script>

<template>
  <section class="ab-browser">
    <div class="ab-path">
      <span>{{ tr('filters') }}</span>
      <EaButton size="sm" variant="ghost" v-if="source" @click="source = ''">
        {{ tr(source) }} ×
      </EaButton>
      <EaButton size="sm" variant="ghost" v-if="typeFilter" @click="typeFilter = ''">
        {{ kind(typeFilter) }} ×
      </EaButton>
      <span v-if="!source && !typeFilter" class="ab-muted">{{ tr('all') }}</span>
      <EaButton size="sm" variant="ghost" @click="clear">{{ tr('clear') }}</EaButton>
      <EaButton size="sm" variant="ghost" class="ab-locate" @click="locate">{{
        tr('locate')
      }}</EaButton>
    </div>
    <aside class="ab-sources" :aria-label="tr('filters')">
      <fieldset>
        <legend>{{ tr('sources') }}</legend>
        <EaFilterChip
          v-for="value in ['', 'builtin', 'custom']"
          :key="value"
          :selected="source === value"
          @click="source = value"
          >{{ tr(value || 'all') }}</EaFilterChip
        >
      </fieldset>
      <fieldset>
        <legend>{{ tr('type') }}</legend>
        <EaFilterChip :selected="typeFilter === ''" @click="typeFilter = ''">
          {{ tr('all') }} <small>{{ matching.length }}</small>
        </EaFilterChip>
        <EaFilterChip
          v-for="value in types"
          :key="value"
          :selected="typeFilter === value"
          @click="typeFilter = value"
        >
          {{ kind(value) }}
          <small>{{ matching.filter(asset => asset.kind === value).length }}</small>
        </EaFilterChip>
      </fieldset>
    </aside>
    <main class="ab-content">
      <div class="ab-search">
        <WorkspaceIcon name="search" :size="14" />
        <EaInput
          class="ab-search-input"
          size="sm"
          v-model="query"
          :aria-label="tr('search')"
          :placeholder="tr('search')"
        />
        <EaButton size="sm" :pressed="view === 'grid'" @click="view = 'grid'">
          {{ tr('grid') }}
        </EaButton>
        <EaButton size="sm" :pressed="view === 'list'" @click="view = 'list'">
          {{ tr('list') }}
        </EaButton>
      </div>
      <div ref="results" class="ab-results" :class="view" :aria-label="tr('assets')">
        <article
          v-for="asset in visible"
          :key="asset.id"
          class="ab-asset"
          :class="{ selected: selection === asset.id }"
          :data-kind="asset.kind"
        >
          <EaButton
            variant="ghost"
            class="ab-open"
            :pressed="selection === asset.id"
            :title="asset.id"
            @click="selection = asset.id"
            @dblclick="emit('navigate', asset.id)"
            @keydown.enter.prevent="emit('navigate', asset.id)"
          >
            <OperatorAvatar
              v-if="asset.iconPath && asset.kind === 'operator'"
              class="ab-thumbnail"
              :src="asset.iconPath"
              loading="lazy"
            />
            <img
              v-else-if="asset.iconPath"
              class="ab-thumbnail"
              :src="asset.iconPath"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <WorkspaceIcon
              v-else
              :name="asset.kind === 'skill' ? 'graph' : 'box'"
              :size="view === 'grid' ? 30 : 18"
            />
            <strong>{{ name(asset.id) }}</strong>
            <small
              >{{ kind(asset.kind) }} ·
              {{ tr(sourceOf(asset.id) === 'custom' ? 'custom' : 'readonly') }}</small
            >
          </EaButton>
        </article>
        <p v-if="!visible.length" class="ab-empty">{{ tr('empty') }}</p>
      </div>
      <footer class="ab-count">{{ tr('count') }} {{ visible.length }}</footer>
    </main>
  </section>
</template>

<style scoped>
.ab-browser {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  grid-template-rows: 32px minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  font-size: 11px;
}
.ab-path {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 9px;
  border-bottom: 1px solid var(--ea-border);
  overflow: auto;
  white-space: nowrap;
}
.ab-path :deep(.ea-button) {
  flex-shrink: 0;
}
.ab-path .ab-locate {
  margin-left: auto;
}
.ab-sources {
  overflow: auto;
  border-right: 1px solid var(--ea-border);
  padding: 6px 0;
}

.ab-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.ab-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 9px;
}
.ab-search-input {
  flex: 1;
  min-width: 80px;
}

.ab-results {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 5px 9px;
  align-content: start;
}
.ab-results.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 7px;
}
.ab-asset {
  --type-color: var(--ea-fg-muted);
  border: 1px solid var(--ea-border);
  border-top: 2px solid var(--type-color);
  background: var(--ea-surface-row);
  min-width: 0;
}
.ab-asset[data-kind='skill'],
.ab-asset[data-kind='passive'] {
  --type-color: #b499d3;
}
.ab-asset[data-kind='buff'] {
  --type-color: #78bba0;
}
.ab-asset[data-kind='entity'] {
  --type-color: #73afcd;
}
.ab-asset[data-kind='talent'],
.ab-asset[data-kind='potential'] {
  --type-color: #d1b47a;
}
.ab-asset.selected {
  background: var(--ea-select-hover-bg);
  border-color: var(--ea-gold);
}
@media (hover: hover) and (pointer: fine) {
  .ab-asset:hover {
    background: var(--ea-hover-fill);
  }
}
.ab-open {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  white-space: normal;
  text-align: left;
  width: 100%;
  gap: 5px;
  padding: 9px;
  min-height: 98px;
}
.ab-open > svg {
  align-self: center;
  margin: 3px 0 5px;
  color: var(--type-color);
}
.ab-thumbnail {
  flex: none;
  align-self: center;
  width: 64px;
  height: 64px;
  object-fit: contain;
}
.list .ab-thumbnail {
  width: 28px;
  height: 28px;
}
.ab-open strong {
  font-size: 11px;
  font-weight: 500;
  overflow-wrap: anywhere;
}
.ab-open small {
  color: var(--ea-fg-muted);
  font-size: 10px;
}

.ab-count {
  padding: 4px 9px;
  color: var(--ea-fg-muted);
  font-size: 10px;
}
.list .ab-asset {
  display: flex;
  margin-bottom: 3px;
  border-top-width: 1px;
  border-left: 3px solid var(--type-color);
}
.list .ab-open {
  flex: 1;
  min-width: 0;
  min-height: 30px;
  flex-direction: row;
  align-items: center;
  padding: 5px 8px;
  gap: 10px;
}
.list .ab-open > svg {
  margin: 0;
}
.list .ab-open strong {
  flex: 1;
}

.ab-empty,
.ab-muted {
  color: var(--ea-fg-muted);
}
.ab-result-path {
  overflow-wrap: anywhere;
}

.ab-sources fieldset {
  border: 0;
  margin: 0;
  padding: 8px 12px;
}
.ab-sources legend,
.ab-sources :deep(.ea-filter-chip) {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-bottom: 3px;
}
.ab-sources small {
  margin-left: auto;
  color: var(--ea-fg-muted);
}
</style>
