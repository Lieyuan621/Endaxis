<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import WorkspaceIcon from './WorkspaceIcon.vue';
import { EaInput } from '@/design-system';
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
      <button class="rw-native-button" v-if="source" @click="source = ''">
        {{ tr(source) }} ×
      </button>
      <button class="rw-native-button" v-if="typeFilter" @click="typeFilter = ''">
        {{ kind(typeFilter) }} ×
      </button>
      <span v-if="!source && !typeFilter" class="ab-muted">{{ tr('all') }}</span>
      <button class="rw-native-button" @click="clear">{{ tr('clear') }}</button>
      <button class="rw-native-button ab-locate" @click="locate">{{ tr('locate') }}</button>
    </div>
    <aside class="ab-sources" :aria-label="tr('filters')">
      <fieldset>
        <legend>{{ tr('sources') }}</legend>
        <label v-for="value in ['', 'builtin', 'custom']" :key="value">
          <input v-model="source" type="radio" name="asset-source" :value="value" />
          {{ tr(value || 'all') }}
        </label>
      </fieldset>
      <fieldset>
        <legend>{{ tr('type') }}</legend>
        <label
          ><input v-model="typeFilter" type="radio" name="asset-type" value="" />{{ tr('all') }}
          <small>{{ matching.length }}</small></label
        >
        <label v-for="value in types" :key="value">
          <input v-model="typeFilter" type="radio" name="asset-type" :value="value" />
          {{ kind(value) }}
          <small>{{ matching.filter(asset => asset.kind === value).length }}</small>
        </label>
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
        <button class="rw-native-button" :aria-pressed="view === 'grid'" @click="view = 'grid'">
          {{ tr('grid') }}
        </button>
        <button class="rw-native-button" :aria-pressed="view === 'list'" @click="view = 'list'">
          {{ tr('list') }}
        </button>
      </div>
      <div ref="results" class="ab-results" :class="view" :aria-label="tr('assets')">
        <article
          v-for="asset in visible"
          :key="asset.id"
          class="ab-asset"
          :class="{ selected: selection === asset.id }"
          :data-kind="asset.kind"
        >
          <button
            class="rw-native-button ab-open"
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
          </button>
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
.ab-browser .rw-native-button {
  border: 0;
  background: transparent;
  text-align: left;
}
.ab-path {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 9px;
  border-bottom: 1px solid #414b52;
  overflow: auto;
  white-space: nowrap;
}
.ab-path button {
  padding: 3px 6px;
  flex-shrink: 0;
}
.ab-path .ab-locate {
  margin-left: auto;
  color: #c8bd87;
}
.ab-sources {
  overflow: auto;
  border-right: 1px solid #46515a;
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

.ab-search button,
.ab-filters button {
  padding: 3px 6px;
  white-space: nowrap;
  color: #abbac6;
}
.ab-browser .rw-native-button[aria-pressed='true'] {
  background: #494b37;
  color: #e5d991;
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
  --type-color: #879aa8;
  border: 1px solid #46525b;
  border-top: 2px solid var(--type-color);
  background: #303940;
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
  background: #4a503d;
  border-color: #c4b86c;
}
.ab-asset:hover {
  background: #414c55;
}
.ab-open {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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
  color: #a7b7c4;
  font-size: 10px;
}

.ab-count {
  padding: 4px 9px;
  color: #8fa3b2;
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
  color: #91a2af;
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
.ab-sources fieldset label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
}
.ab-sources input {
  width: 12px;
  height: 12px;
  accent-color: #ddcc78;
  margin: 0;
}
.ab-sources small {
  margin-left: auto;
  color: #8d9dab;
}
</style>
