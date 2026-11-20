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
  EaFormField,
  EaInput,
  EaTabs,
} from '@/design-system';
import { Search } from '@element-plus/icons-vue';
import { getOperatorGameName, getWeaponGameName, getGearPieceGameName } from '../../gameText';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import OperatorPresetBuildSummary from './OperatorPresetBuildSummary.vue';
import OperatorPresetFileMenu from './OperatorPresetFileMenu.vue';
import {
  captureOperatorBuild,
  sameOperatorBuild,
  type OperatorBuildPreset,
} from '../../../application/editor/operatorBuildPreset';
import {
  loadOperatorBuildPresets,
  saveOperatorBuildPresets,
} from '../../../data/browserOperatorBuildPresets';
import type { GameDataRepository } from '../../../core/game-data/gameDataRepository';
import type { TrackDocument } from '../../../core/project/schema';

const props = defineProps<{
  track: TrackDocument | null;
  gameData: GameDataRepository;
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
const renameDrafts = ref<Record<string, string>>({});
const error = ref('');
const current = computed(() => (props.track?.operator ? captureOperatorBuild(props.track) : null));
const scope = ref<'operator' | 'all'>(props.track?.operator ? 'operator' : 'all');
const expanded = ref<string | null>(null);
const saving = ref(false);
const operatorPresets = computed(() =>
  presets.value.filter(p => p.build.operator.operatorSlug === props.track?.operator?.operatorSlug),
);
const scopeTabs = computed(() => [
  ...(current.value
    ? [
        {
          value: 'operator',
          label: `${getOperatorGameName(current.value.operator.operatorSlug, locale.value)} (${operatorPresets.value.length})`,
        },
      ]
    : []),
  { value: 'all', label: t('operatorPresets.all', { count: presets.value.length }) },
]);
function selectScope(value: string) {
  if (value === 'operator' || value === 'all') scope.value = value;
}
const scopedPresets = computed(() =>
  scope.value === 'operator' ? operatorPresets.value : presets.value,
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
  return [...result].map(([slug, items]) => ({ slug, items }));
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
function rename(id: string, name: string) {
  const label = name.trim();
  if (!label || !write(items => items.map(p => (p.id === id ? { ...p, name: label } : p))))
    refresh();
  delete renameDrafts.value[id];
}
function commitRename(preset: OperatorBuildPreset) {
  const draft = renameDrafts.value[preset.id];
  if (draft !== undefined) rename(preset.id, draft);
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
      <div ref="panel" class="operator-presets">
        <p v-if="error" role="alert" class="operator-presets__error">{{ error }}</p>
        <section v-if="current" class="operator-presets__current">
          <div class="operator-presets__heading">
            <div class="operator-presets__identity">
              <strong
                >{{ t('operatorPresets.current') }} ·
                {{ getOperatorGameName(current.operator.operatorSlug, locale) }}</strong
              >
              <span class="operator-presets__hint"
                >{{ t('operatorPresets.levelValue', { level: current.operator.level }) }} ·
                {{ t('armory.common.potential') }} {{ current.operator.potential }}</span
              >
            </div>
            <div class="operator-presets__toolbar">
              <EaButton
                variant="ghost"
                :aria-expanded="currentExpanded"
                aria-controls="preset-current-details"
                @click="currentExpanded = !currentExpanded"
              >
                <EaChevronIcon :direction="currentExpanded ? 'up' : 'down'" :size="16" />
                {{ currentExpanded ? t('operatorPresets.collapse') : t('operatorPresets.details') }}
              </EaButton>
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
          <EaTabs
            :tabs="scopeTabs"
            :model-value="scope"
            :label="t('operatorPresets.filter')"
            size="sm"
            @update:model-value="selectScope"
          />
          <div class="operator-presets__toolbar">
            <EaInput
              v-model="search"
              :prefix-icon="Search"
              clearable
              :placeholder="t('operatorPresets.search')"
              :aria-label="t('operatorPresets.search')"
            />
            <OperatorPresetFileMenu
              :import-disabled="!!error"
              :export-disabled="!!error || !scopedPresets.length"
              @import-file="emit('importFile')"
              @export-presets="
                emit(
                  'exportPresets',
                  scope === 'operator' ? current?.operator.operatorSlug : undefined,
                )
              "
            />
          </div>
          <p class="operator-presets__hint">{{ t('operatorPresets.applyInfo') }}</p>
        </div>
        <div class="operator-presets__list">
          <div v-if="!filteredPresets.length" class="operator-presets__empty">
            <p>
              {{
                search.trim()
                  ? t('operatorPresets.noMatches')
                  : scope === 'operator'
                    ? t('operatorPresets.noOperatorPresets')
                    : t('operatorPresets.noPresets')
              }}
            </p>
            <EaButton
              v-if="scope === 'operator'"
              @click="
                scope = 'all';
                search = '';
              "
              >{{ t('operatorPresets.viewAll') }}</EaButton
            >
          </div>
          <section v-for="group in groups" :key="group.slug" class="operator-presets__group">
            <h3 v-if="scope === 'all'">
              {{ getOperatorGameName(group.slug, locale) }} ({{ group.items.length }})
            </h3>
            <article v-for="preset in group.items" :key="preset.id" class="operator-presets__card">
              <header class="operator-presets__heading">
                <div class="operator-presets__identity">
                  <strong class="operator-presets__name">{{ preset.name }}</strong>
                  <span v-if="matches(preset)" class="operator-presets__match">{{
                    t('operatorPresets.matches')
                  }}</span>
                </div>
                <div class="operator-presets__toolbar">
                  <EaButton
                    variant="ghost"
                    :aria-expanded="expanded === preset.id"
                    :aria-controls="`preset-build-${preset.id} preset-edit-${preset.id}`"
                    @click="expanded = expanded === preset.id ? null : preset.id"
                  >
                    <EaChevronIcon :direction="expanded === preset.id ? 'up' : 'down'" :size="16" />
                    {{
                      expanded === preset.id
                        ? t('operatorPresets.collapse')
                        : t('operatorPresets.details')
                    }}
                  </EaButton>
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
                :id="`preset-build-${preset.id}`"
                :build="preset.build"
                :game-data="gameData"
                :expanded="expanded === preset.id"
              />
              <EaCollapse
                :expanded="expanded === preset.id"
                :id="`preset-edit-${preset.id}`"
                class="operator-presets__editing"
              >
                <EaFormField
                  :control-id="`preset-name-${preset.id}`"
                  :label="t('operatorPresets.name')"
                >
                  <EaInput
                    :model-value="renameDrafts[preset.id] ?? preset.name"
                    :maxlength="60"
                    :disabled="!!error"
                    @update:model-value="renameDrafts[preset.id] = $event"
                    @blur="commitRename(preset)"
                    @keydown.enter="commitRename(preset)"
                  />
                </EaFormField>
                <EaDialogActions>
                  <EaButton
                    :disabled="
                      !!error ||
                      !current ||
                      current.operator.operatorSlug !== group.slug ||
                      matches(preset)
                    "
                    @click="updatePreset(preset)"
                    >{{ t('operatorPresets.update') }}</EaButton
                  >
                  <EaButton variant="danger" :disabled="!!error" @click="remove(preset)">{{
                    t('operatorPresets.delete')
                  }}</EaButton>
                </EaDialogActions>
              </EaCollapse>
            </article>
          </section>
        </div>
      </div>
    </EaDialog>
  </InputRegionBoundary>
</template>
<style scoped>
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--ea-space-2);
}
.operator-presets__identity {
  display: flex;
  flex: 1 1 220px;
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
.operator-presets__toolbar > .ea-input {
  flex: 1;
  min-width: 160px;
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
.operator-presets__save > .ea-dialog-actions,
.operator-presets__editing > .ea-dialog-actions {
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
.operator-presets__editing {
  display: grid;
  gap: var(--ea-space-2);
  padding-top: var(--ea-space-3);
  border-top: 1px solid var(--ea-border-soft);
}
.operator-presets__error {
  color: var(--ea-danger);
}
@media (max-width: 600px) {
  .operator-presets__heading > .operator-presets__identity {
    flex-basis: 100%;
  }
  .operator-presets__save {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
