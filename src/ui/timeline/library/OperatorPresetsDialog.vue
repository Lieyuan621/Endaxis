<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  EaButton,
  EaChevronIcon,
  EaCollapse,
  EaDialog,
  EaDialogActions,
  EaDeleteIcon,
  EaExportIcon,
  EaFormField,
  EaImportIcon,
  EaInput,
  EaTooltip,
} from '@/design-system';
import { EditPen, Refresh, Search } from '@element-plus/icons-vue';
import { getOperatorGameName, getWeaponGameName, getGearPieceGameName } from '../../gameText';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import OperatorPresetBuildSummary from './OperatorPresetBuildSummary.vue';
import OperatorPresetOperatorFilter from './OperatorPresetOperatorFilter.vue';
import {
  captureOperatorBuild,
  sameOperatorBuild,
  type OperatorBuildPreset,
} from '../../../application/editor/operatorBuildPreset';
import {
  loadOperatorBuildPresets,
  saveOperatorBuildPresets,
} from '../../../data/browserOperatorBuildPresets';
import { orderByOperatorDirectory } from '../../appearance/operatorGroups';
import type {
  GameDataRepository,
  GameDataBrowser,
} from '../../../core/game-data/gameDataRepository';
import type { TrackDocument } from '../../../core/project/schema';

const props = defineProps<{
  track: TrackDocument | null;
  gameData: GameDataRepository & Partial<Pick<GameDataBrowser, 'getOperators'>>;
  readOnly: boolean;
  suspended?: boolean;
  apply: (preset: OperatorBuildPreset) => void;
}>();
const emit = defineEmits<{
  close: [];
  importFile: [];
  exportPresets: [operatorSlug: string | undefined];
}>();
const { t, locale } = useI18n();
const panel = ref<HTMLElement>();
let scrollPosition = 0;
const currentExpanded = ref(false);
const search = ref('');
const presets = ref<OperatorBuildPreset[]>([]);
const name = ref('');
const renaming = ref<OperatorBuildPreset | null>(null);
const renameName = ref('');
const error = ref('');
const current = computed(() => (props.track?.operator ? captureOperatorBuild(props.track) : null));
const selectedOperator = ref(props.track?.operator?.operatorSlug ?? 'all');
const expanded = ref<string | null>(null);
const saving = ref(false);
const scopedPresets = computed(() =>
  selectedOperator.value === 'all'
    ? presets.value
    : presets.value.filter(p => p.build.operator.operatorSlug === selectedOperator.value),
);
const searchPlaceholder = computed(() =>
  t(selectedOperator.value !== 'all' ? 'operatorPresets.searchOperator' : 'operatorPresets.search'),
);
const filteredPresets = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  return scopedPresets.value.filter(preset => {
    const { operator, weapon, gears } = preset.build;
    return (
      !query ||
      [
        preset.name,
        getOperatorGameName(operator.operatorSlug, locale.value),
        weapon ? getWeaponGameName(weapon.weaponSlug, locale.value) : '',
        ...Object.values(gears).map(gear =>
          gear ? getGearPieceGameName(gear.gearSlug, locale.value) : '',
        ),
      ].some(value => value.toLocaleLowerCase().includes(query))
    );
  });
});
const groups = computed(() => {
  const result = new Map<string, OperatorBuildPreset[]>();
  for (const preset of filteredPresets.value) {
    const slug = preset.build.operator.operatorSlug;
    const group = result.get(slug) ?? [];
    group.push(preset);
    result.set(slug, group);
  }
  return orderByOperatorDirectory(
    [...result].map(([slug, items]) => ({ slug, items })),
    group => group.slug,
    props.gameData.getOperators?.() ?? [],
  );
});
function beginSave() {
  const base = t('operatorPresets.defaultName', {
    operator: getOperatorGameName(props.track!.operator!.operatorSlug, locale.value),
  });
  let index = 1;
  while (presets.value.some(p => p.name === `${base} ${index}`)) index++;
  name.value = `${base} ${index}`;
  saving.value = true;
}
function matches(preset: OperatorBuildPreset): boolean {
  return current.value !== null && sameOperatorBuild(current.value, preset.build);
}
async function updatePreset(preset: OperatorBuildPreset) {
  if (!current.value || current.value.operator.operatorSlug !== preset.build.operator.operatorSlug)
    return;
  const build = captureOperatorBuild(props.track!);
  if (!(await confirmChange(t('operatorPresets.updateConfirm', { name: preset.name })))) return;
  if (write(items => items.map(item => (item.id === preset.id ? { ...item, build } : item))))
    ElMessage.success(t('operatorPresets.updated'));
}
function refresh() {
  try {
    presets.value = loadOperatorBuildPresets();
    error.value = '';
  } catch {
    error.value = t('operatorPresets.loadError');
  }
}
watch(
  () => props.suspended,
  suspended => {
    if (suspended) {
      scrollPosition = panel.value?.closest('.el-dialog__body')?.scrollTop ?? 0;
    } else {
      refresh();
      void nextTick(() => {
        const body = panel.value?.closest('.el-dialog__body');
        if (body) body.scrollTop = scrollPosition;
      });
    }
  },
);
onMounted(() => {
  refresh();
  window.addEventListener('storage', refresh);
});
onUnmounted(() => window.removeEventListener('storage', refresh));
function write(update: (items: OperatorBuildPreset[]) => OperatorBuildPreset[]): boolean {
  try {
    const next = update(loadOperatorBuildPresets());
    saveOperatorBuildPresets(next);
    presets.value = next;
    return true;
  } catch {
    ElMessage.error(t('operatorPresets.saveError'));
    return false;
  }
}
function save() {
  const label = name.value.trim();
  if (!label || !current.value) return;
  const build = current.value;
  if (write(items => [...items, { id: crypto.randomUUID(), name: label, build }])) {
    if (
      selectedOperator.value !== 'all' &&
      selectedOperator.value !== build.operator.operatorSlug
    ) {
      selectedOperator.value = build.operator.operatorSlug;
    }
    search.value = '';
    name.value = '';
    saving.value = false;
    ElMessage.success(t('operatorPresets.saved'));
  }
}
async function confirmChange(message: string): Promise<boolean> {
  try {
    await ElMessageBox.confirm(message, t('operatorPresets.title'), {
      confirmButtonText: t('operatorPresets.confirm'),
      cancelButtonText: t('operatorPresets.cancel'),
      type: 'warning',
    });
    return true;
  } catch {
    return false;
  }
}
async function remove(preset: OperatorBuildPreset) {
  if (await confirmChange(t('operatorPresets.deleteConfirm', { name: preset.name })))
    write(items => items.filter(p => p.id !== preset.id));
}
function beginRename(preset: OperatorBuildPreset) {
  renaming.value = preset;
  renameName.value = preset.name;
}
function commitRename() {
  const id = renaming.value?.id;
  const label = renameName.value.trim();
  if (!id || !label || label.length > 60) return;
  if (write(items => items.map(p => (p.id === id ? { ...p, name: label } : p)))) {
    renaming.value = null;
    renameName.value = '';
  }
}
async function apply(preset: OperatorBuildPreset) {
  if (props.readOnly) return;
  if (
    props.track?.operator &&
    props.track.operator.operatorSlug !== preset.build.operator.operatorSlug &&
    props.track.skillCasts.length
  ) {
    if (!(await confirmChange(t('operatorPresets.replaceOperatorConfirm')))) return;
  }
  try {
    props.apply(preset);
    ElMessage.success(t('operatorPresets.applied'));
    emit('close');
  } catch (cause) {
    ElMessage.error(
      `${t('operatorPresets.applyError')} ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }
}
</script>
<template>
  <InputRegionBoundary label="operator-presets" :active="!suspended" modal>
    <EaDialog
      v-if="!suspended"
      :model-value="true"
      :title="t('operatorPresets.title')"
      class="operator-presets-dialog"
      width="760px"
      scroll-mode="body"
      @update:model-value="!suspended && emit('close')"
    >
      <template #header>
        <div class="operator-presets__dialog-heading">
          <span class="el-dialog__title">{{ t('operatorPresets.title') }}</span>
          <div class="operator-presets__file-actions">
            <EaButton
              size="sm"
              :disabled="!!error"
              :aria-label="t('operatorPresets.import')"
              :title="t('operatorPresets.import')"
              @click="emit('importFile')"
            >
              <EaImportIcon :size="14" />{{ t('operatorPresets.importShort') }}
            </EaButton>
            <EaButton
              size="sm"
              :disabled="!!error || !scopedPresets.length"
              :aria-label="t('operatorPresets.export')"
              :title="t('operatorPresets.export')"
              @click="
                emit('exportPresets', selectedOperator === 'all' ? undefined : selectedOperator)
              "
            >
              <EaExportIcon :size="14" />{{ t('operatorPresets.exportShort') }}
            </EaButton>
          </div>
        </div>
      </template>
      <div ref="panel" class="operator-presets">
        <p v-if="error" role="alert" class="operator-presets__error">{{ error }}</p>
        <section v-if="current" class="operator-presets__current">
          <div class="operator-presets__heading">
            <EaButton
              variant="ghost"
              class="operator-presets__disclosure"
              :aria-expanded="currentExpanded"
              aria-controls="preset-current-details"
              :aria-label="`${t(currentExpanded ? 'operatorPresets.collapse' : 'operatorPresets.details')} · ${t('operatorPresets.current')}`"
              @click="currentExpanded = !currentExpanded"
            >
              <EaChevronIcon :direction="currentExpanded ? 'down' : 'right'" :size="16" />
              <span class="operator-presets__identity">
                <strong
                  >{{ t('operatorPresets.current') }} ·
                  {{ getOperatorGameName(current.operator.operatorSlug, locale) }}</strong
                >
                <span class="operator-presets__hint"
                  >{{ t('operatorPresets.levelValue', { level: current.operator.level }) }} ·
                  {{ t('armory.common.potential') }} {{ current.operator.potential }}</span
                >
              </span>
            </EaButton>
            <div class="operator-presets__toolbar">
              <EaButton :disabled="!!error" @click="beginSave">{{
                t('operatorPresets.saveNew')
              }}</EaButton>
            </div>
          </div>
          <EaCollapse :expanded="currentExpanded" id="preset-current-details">
            <OperatorPresetBuildSummary
              class="operator-presets__current-details"
              :build="current"
              :game-data="gameData"
              expanded
            />
          </EaCollapse>
          <div v-if="saving" class="operator-presets__save">
            <EaFormField control-id="preset-save-name" :label="t('operatorPresets.name')">
              <EaInput v-model="name" :maxlength="60" @keydown.enter="save" />
            </EaFormField>
            <EaDialogActions>
              <EaButton @click="saving = false">{{ t('operatorPresets.cancel') }}</EaButton>
              <EaButton variant="primary" :disabled="!!error || !name.trim()" @click="save">{{
                t('operatorPresets.confirmSave')
              }}</EaButton>
            </EaDialogActions>
          </div>
        </section>
        <div class="operator-presets__filters">
          <div class="operator-presets__filter-toolbar">
            <OperatorPresetOperatorFilter
              v-model="selectedOperator"
              :presets="presets"
              :game-data="gameData"
              :current-operator-slug="current?.operator.operatorSlug"
              :disabled="!!error"
            />
            <EaInput
              v-model="search"
              :prefix-icon="Search"
              clearable
              :placeholder="searchPlaceholder"
              :aria-label="t('operatorPresets.search')"
            />
          </div>
          <div class="operator-presets__filter-meta">
            <p class="operator-presets__hint">{{ t('operatorPresets.applyInfo') }}</p>
            <span v-if="search.trim()" class="operator-presets__result-count" role="status">{{
              t('operatorPresets.resultCount', { count: filteredPresets.length })
            }}</span>
          </div>
        </div>
        <div class="operator-presets__list">
          <div v-if="!filteredPresets.length" class="operator-presets__empty">
            <p>
              {{
                search.trim()
                  ? t('operatorPresets.noMatches')
                  : selectedOperator !== 'all'
                    ? t(
                        selectedOperator === current?.operator.operatorSlug
                          ? 'operatorPresets.noOperatorPresets'
                          : 'operatorPresets.noFilteredOperatorPresets',
                      )
                    : t('operatorPresets.noPresets')
              }}
            </p>
            <EaButton
              v-if="selectedOperator !== 'all'"
              @click="
                selectedOperator = 'all';
                search = '';
              "
              >{{ t('operatorPresets.viewAll') }}</EaButton
            >
          </div>
          <section v-for="group in groups" :key="group.slug" class="operator-presets__group">
            <h3 v-if="selectedOperator === 'all'">
              {{ getOperatorGameName(group.slug, locale) }} ({{ group.items.length }})
            </h3>
            <article v-for="preset in group.items" :key="preset.id" class="operator-presets__card">
              <header class="operator-presets__heading">
                <EaButton
                  variant="ghost"
                  class="operator-presets__disclosure"
                  :aria-expanded="expanded === preset.id"
                  :aria-controls="`preset-details-${preset.id}`"
                  :aria-label="`${t(expanded === preset.id ? 'operatorPresets.collapse' : 'operatorPresets.details')} · ${preset.name}`"
                  @click="expanded = expanded === preset.id ? null : preset.id"
                >
                  <EaChevronIcon
                    :direction="expanded === preset.id ? 'down' : 'right'"
                    :size="16"
                  />
                  <span class="operator-presets__identity">
                    <strong class="operator-presets__name">{{ preset.name }}</strong>
                    <span v-if="matches(preset)" class="operator-presets__match">{{
                      t('operatorPresets.matches')
                    }}</span>
                  </span>
                </EaButton>
                <div class="operator-presets__toolbar">
                  <EaButton
                    variant="primary"
                    :disabled="readOnly || !!error"
                    @click="apply(preset)"
                    >{{
                      current && current.operator.operatorSlug !== group.slug
                        ? t('operatorPresets.replaceAndApply', {
                            operator: getOperatorGameName(group.slug, locale),
                          })
                        : t('operatorPresets.apply')
                    }}</EaButton
                  >
                </div>
              </header>
              <OperatorPresetBuildSummary
                :build="preset.build"
                :game-data="gameData"
                :expanded="expanded === preset.id"
                :details-id="`preset-details-${preset.id}`"
              >
                <template #details-footer>
                  <div
                    class="operator-presets__actions"
                    role="group"
                    :aria-label="t('operatorPresets.manage', { name: preset.name })"
                  >
                    <EaButton size="sm" :disabled="!!error" @click="beginRename(preset)">
                      <EditPen width="14" height="14" aria-hidden="true" />
                      {{ t('operatorPresets.rename') }}
                    </EaButton>
                    <EaTooltip
                      :content="t('operatorPresets.update')"
                      :show-after="300"
                      placement="top"
                    >
                      <span class="operator-presets__action-tooltip">
                        <EaButton
                          size="sm"
                          :disabled="
                            !!error ||
                            !current ||
                            current.operator.operatorSlug !== group.slug ||
                            matches(preset)
                          "
                          :aria-label="t('operatorPresets.update')"
                          @click="updatePreset(preset)"
                        >
                          <Refresh width="14" height="14" aria-hidden="true" />
                          {{ t('operatorPresets.updateShort') }}
                        </EaButton>
                      </span>
                    </EaTooltip>
                    <EaButton
                      variant="danger"
                      size="sm"
                      :disabled="!!error"
                      @click="remove(preset)"
                    >
                      <EaDeleteIcon :size="14" />{{ t('operatorPresets.delete') }}
                    </EaButton>
                  </div>
                </template>
              </OperatorPresetBuildSummary>
            </article>
          </section>
        </div>
      </div>
    </EaDialog>
    <EaDialog
      v-if="renaming && !suspended"
      :model-value="true"
      :title="t('operatorPresets.rename')"
      width="420px"
      @update:model-value="!$event && (renaming = null)"
    >
      <EaFormField control-id="preset-rename-name" :label="t('operatorPresets.name')">
        <EaInput
          id="preset-rename-name"
          v-model="renameName"
          :maxlength="60"
          @keydown.enter="commitRename"
        />
      </EaFormField>
      <template #footer>
        <EaDialogActions>
          <EaButton @click="renaming = null">{{ t('operatorPresets.cancel') }}</EaButton>
          <EaButton
            variant="primary"
            :disabled="!renameName.trim() || !!error"
            @click="commitRename"
            >{{ t('operatorPresets.confirmSave') }}</EaButton
          >
        </EaDialogActions>
      </template>
    </EaDialog>
  </InputRegionBoundary>
</template>
<style scoped>
.operator-presets__dialog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ea-space-2);
  height: 24px;
  padding-right: 32px;
  min-width: 0;
}
.operator-presets__dialog-heading > .el-dialog__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.operator-presets__file-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--ea-space-1);
}
.operator-presets {
  display: flex;
  flex-direction: column;
  gap: var(--ea-space-3);
  min-height: 0;
}
.operator-presets p,
.operator-presets h3 {
  margin: 0;
}
.operator-presets h3 {
  display: flex;
  align-items: center;
  gap: var(--ea-space-3);
  font-size: 14px;
}
.operator-presets h3::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--ea-border-soft);
}
.operator-presets__heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--ea-space-2);
}
.operator-presets__disclosure.ea-button {
  justify-content: flex-start;
  align-items: center;
  min-width: 0;
  height: auto;
  min-height: 32px;
  padding: var(--ea-space-1);
  text-align: left;
  white-space: normal;
}
.operator-presets__disclosure > .ea-chevron-icon {
  flex-shrink: 0;
}
.operator-presets__identity {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  min-width: 0;
  gap: var(--ea-space-2);
}
.operator-presets__name {
  overflow-wrap: anywhere;
  font-size: 14px;
}
.operator-presets__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ea-space-2);
}
.operator-presets__current,
.operator-presets__card {
  padding: var(--ea-space-3);
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}
.operator-presets__current,
.operator-presets__filters {
  display: grid;
  gap: var(--ea-space-3);
}
.operator-presets__filters {
  gap: var(--ea-space-2);
  padding-bottom: var(--ea-space-3);
  border-bottom: 1px solid color-mix(in srgb, var(--ea-gold) 15%, transparent);
}
.operator-presets__filter-toolbar {
  display: grid;
  grid-template-columns: minmax(160px, 0.65fr) minmax(0, 1.35fr);
  align-items: center;
  gap: var(--ea-space-2);
}
.operator-presets__filter-toolbar > .ea-input {
  min-width: 0;
}
.operator-presets__filter-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--ea-space-1) var(--ea-space-2);
}
.operator-presets__result-count {
  color: var(--ea-fg-secondary);
  font-size: 12px;
}
.operator-presets__current-details,
.operator-presets__save {
  padding-top: var(--ea-space-3);
  border-top: 1px solid var(--ea-border-soft);
}
.operator-presets__save {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: var(--ea-space-2);
  font-size: 12px;
}
.operator-presets__save > .ea-dialog-actions {
  padding-top: 0;
}
.operator-presets__list,
.operator-presets__group {
  display: flex;
  flex-direction: column;
  gap: var(--ea-space-2);
}
.operator-presets__card {
  display: flex;
  flex-direction: column;
  gap: var(--ea-space-3);
}
.operator-presets__hint,
.operator-presets__empty {
  color: var(--ea-fg-secondary);
  font-size: 12px;
}
.operator-presets__empty {
  display: grid;
  justify-items: start;
  gap: var(--ea-space-2);
  padding: var(--ea-space-3);
}
.operator-presets__match {
  color: var(--ea-gold);
  font-size: 12px;
}
.operator-presets__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--ea-space-2);
  margin-top: var(--ea-space-3);
  padding-top: var(--ea-space-3);
  border-top: 1px solid var(--ea-border-soft);
}
.operator-presets__action-tooltip {
  display: inline-flex;
}
.operator-presets__error {
  color: var(--ea-danger);
}
@media (max-width: 600px) {
  .operator-presets__filter-toolbar {
    grid-template-columns: minmax(0, 1fr);
  }
  .operator-presets__heading {
    grid-template-columns: minmax(0, 1fr);
  }
  .operator-presets__heading > .operator-presets__toolbar {
    justify-self: end;
  }
  .operator-presets__save {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
