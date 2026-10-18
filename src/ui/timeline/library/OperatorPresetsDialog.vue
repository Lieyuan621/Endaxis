<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';
import { EaButton, EaDialog, EaDialogActions, EaInput, EaDeleteIcon } from '@/design-system';
import { getOperatorGameName, getWeaponGameName, getGearPieceGameName } from '../../gameText';
import OperatorPresetTransferDialog from './OperatorPresetTransferDialog.vue';
import {
  readOperatorPresetFile,
  serializeOperatorPresets,
  operatorPresetFilename,
} from '../../../application/editor/operatorBuildPresetFile';
import { downloadProjectJson } from '../projectFileSession';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import OperatorPresetBuildSummary from './OperatorPresetBuildSummary.vue';
import {
  captureOperatorBuild,
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
  apply: (preset: OperatorBuildPreset) => void;
}>();
const emit = defineEmits<{ close: [] }>();
const { t, locale } = useI18n();
const fileInput = ref<HTMLInputElement>();
const transfer = ref<{ mode: 'import' | 'export'; presets: OperatorBuildPreset[] } | null>(null);
async function readFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  try {
    transfer.value = { mode: 'import', presets: readOperatorPresetFile(await file.text()) };
  } catch {
    ElMessage.error(t('operatorPresets.importError'));
  }
}
function exportPresets() {
  try {
    transfer.value = { mode: 'export', presets: loadOperatorBuildPresets() };
  } catch {
    ElMessage.error(t('operatorPresets.loadError'));
  }
}
function finishTransfer(selected: OperatorBuildPreset[]) {
  if (transfer.value?.mode === 'import') {
    // 导入为独立副本，不覆盖浏览器里同名或同 ID 的预设。
    if (
      !write(items => [
        ...items,
        ...selected.map(preset => ({ ...preset, id: crypto.randomUUID() })),
      ])
    )
      return;
    ElMessage.success(t('operatorPresets.imported', { count: selected.length }));
  } else {
    try {
      downloadProjectJson(serializeOperatorPresets(selected), operatorPresetFilename());
    } catch {
      ElMessage.error(t('operatorPresets.exportError'));
      return;
    }
  }
  transfer.value = null;
}
const search = ref('');
const presets = ref<OperatorBuildPreset[]>([]);
const name = ref('');
const error = ref('');
const current = computed(() => (props.track?.operator ? captureOperatorBuild(props.track) : null));
const filteredPresets = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  if (!query) return presets.value;
  return presets.value.filter(preset => {
    const { operator, weapon, gears } = preset.build;
    return [
      preset.name,
      getOperatorGameName(operator.operatorSlug, locale.value),
      weapon ? getWeaponGameName(weapon.weaponSlug, locale.value) : '',
      ...Object.values(gears).map(gear =>
        gear ? getGearPieceGameName(gear.gearSlug, locale.value) : '',
      ),
    ].some(value => value.toLocaleLowerCase().includes(query));
  });
});
function refresh() {
  try {
    presets.value = loadOperatorBuildPresets();
    error.value = '';
  } catch {
    error.value = t('operatorPresets.loadError');
  }
}
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
  <InputRegionBoundary label="operator-presets" active modal>
    <EaDialog
      :model-value="true"
      :title="t('operatorPresets.title')"
      class="operator-presets-dialog"
      size="lg"
      scroll-mode="body"
      @update:model-value="emit('close')"
    >
      <div class="operator-presets">
        <p v-if="error" role="alert" class="operator-presets__error">{{ error }}</p>
        <section v-if="current" class="operator-presets__current">
          <h3 class="operator-presets__heading">{{ t('operatorPresets.current') }}</h3>
          <OperatorPresetBuildSummary :build="current" :game-data="gameData" />
          <div class="operator-presets__save">
            <EaInput
              v-model="name"
              :placeholder="t('operatorPresets.name')"
              :aria-label="t('operatorPresets.name')"
              :maxlength="60"
              @keydown.enter="save"
            />
            <EaButton :disabled="!!error || !name.trim()" @click="save">{{
              t('operatorPresets.saveNew')
            }}</EaButton>
          </div>
        </section>
        <div class="operator-presets__list-heading">
          <h3>{{ t('operatorPresets.list', { count: presets.length }) }}</h3>
          <EaInput
            v-model="search"
            clearable
            :placeholder="t('operatorPresets.search')"
            :aria-label="t('operatorPresets.search')"
          />
          <EaButton size="sm" :disabled="!!error" @click="fileInput?.click()">{{
            t('operatorPresets.import')
          }}</EaButton>
          <EaButton size="sm" :disabled="!!error || !presets.length" @click="exportPresets">{{
            t('operatorPresets.export')
          }}</EaButton>
          <input
            ref="fileInput"
            type="file"
            accept=".json,application/json"
            hidden
            @change="readFile"
          />
        </div>
        <div class="operator-presets__list">
          <p v-if="presets.length && !filteredPresets.length" class="operator-presets__hint">
            {{ t('operatorPresets.noMatches') }}
          </p>
          <p v-if="!presets.length" class="operator-presets__hint">
            {{ t('operatorPresets.noPresets') }}
          </p>
          <article
            v-for="preset in filteredPresets"
            :key="preset.id"
            class="operator-presets__card"
          >
            <div class="operator-presets__heading">
              <span class="operator-presets__bracket" aria-hidden="true">[</span>
              <span class="operator-presets__name-wrap">
                <span class="operator-presets__name-measure" aria-hidden="true">{{
                  preset.name || ' '
                }}</span>
                <EaInput
                  v-model="preset.name"
                  class="operator-presets__name"
                  variant="inline"
                  :aria-label="t('operatorPresets.name')"
                  :maxlength="60"
                  @change="rename(preset.id, $event)"
                  @keydown.enter="($event.target as HTMLInputElement).blur()"
                />
              </span>
              <span class="operator-presets__bracket" aria-hidden="true">]</span>
            </div>
            <OperatorPresetBuildSummary :build="preset.build" :game-data="gameData" />
            <div class="operator-presets__actions">
              <EaButton
                size="sm"
                variant="ghost"
                icon-only
                :title="t('operatorPresets.delete')"
                :aria-label="t('operatorPresets.delete')"
                @click="remove(preset)"
              >
                <EaDeleteIcon />
              </EaButton>
              <EaButton
                size="sm"
                variant="ghost"
                icon-only
                :title="t('operatorPresets.apply')"
                :aria-label="t('operatorPresets.apply')"
                :disabled="readOnly"
                @click="apply(preset)"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
              </EaButton>
            </div>
          </article>
        </div>
      </div>
      <template #footer
        ><EaDialogActions
          ><EaButton @click="emit('close')">{{
            t('operatorPresets.close')
          }}</EaButton></EaDialogActions
        ></template
      >
    </EaDialog>
    <OperatorPresetTransferDialog
      v-if="transfer"
      :mode="transfer.mode"
      :presets="transfer.presets"
      :game-data="gameData"
      @close="transfer = null"
      @confirm="finishTransfer"
    />
  </InputRegionBoundary>
</template>
<style scoped>
.operator-presets {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: min(720px, calc(100dvh - 150px));
  gap: var(--ea-space-3);
}
.operator-presets h3,
.operator-presets p {
  margin: 0;
}
.operator-presets h3 {
  font-size: 14px;
}
.operator-presets__hint {
  color: var(--ea-fg-secondary);
  font-size: 12px;
  line-height: 1.6;
}
.operator-presets__current,
.operator-presets__card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 156px;
  gap: var(--ea-space-1) var(--ea-space-3);
  padding: var(--ea-space-2) var(--ea-space-3);
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-soft);
}
.operator-presets__current {
  border-left: 3px solid var(--ea-gold);
}
.operator-presets__heading {
  grid-column: 1;
  display: flex;
  align-items: center;
  gap: var(--ea-space-2);
  min-width: 0;
}
.operator-presets__name-wrap {
  position: relative;
  display: inline-block;
  min-width: 1em;
  max-width: calc(100% - 32px);
}
.operator-presets__name-measure,
.operator-presets__name {
  line-height: 24px;
  font-size: 14px;
  font-weight: 700;
}
.operator-presets__name-measure {
  visibility: hidden;
  white-space: pre;
  padding: 0 2px;
}
.operator-presets__name {
  position: absolute;
  inset: 0;
  width: 100%;
  min-width: 0;
}
.operator-presets__bracket {
  color: var(--ea-fg-faint);
  font-weight: 300;
  line-height: 24px;
}
.operator-presets__heading:has(.operator-presets__name-wrap) {
  gap: 2px;
}
.operator-presets__name :deep(.el-input__wrapper) {
  padding: 0 2px;
}
.operator-presets__name :deep(.el-input__inner) {
  font: inherit;
  height: 24px;
  line-height: 24px;
}
.operator-presets__list-heading {
  display: flex;
  align-items: center;
  gap: var(--ea-space-3);
}
.operator-presets__list-heading h3 {
  flex-shrink: 0;
}
.operator-presets__list-heading .ea-input {
  width: 240px;
  max-width: 100%;
}
.operator-presets__list {
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--ea-space-2);
}
.operator-presets__card,
.operator-presets__current {
  flex-shrink: 0;
}
.operator-presets-dialog :deep(.el-dialog__body) {
  overflow: hidden;
}
.operator-presets__name {
  --ea-number-input-bg: transparent;
  --ea-number-input-border: transparent;
  --ea-control-border: transparent;
  font-weight: 700;
}
.operator-presets__heading strong {
  overflow-wrap: anywhere;
}
.operator-presets__current > .preset-build,
.operator-presets__card > .preset-build {
  grid-column: 1;
}
.operator-presets__save,
.operator-presets__actions {
  grid-column: 2;
  grid-row: 1 / span 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  gap: var(--ea-space-2);
  padding-left: var(--ea-space-4);
  border-left: 1px solid var(--ea-border);
}
.operator-presets__actions {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
.operator-presets__actions .ea-button {
  width: 34px;
  height: 34px;
  padding: 6px;
  border-radius: 50%;
}
.operator-presets__actions svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.operator-presets__error {
  color: var(--ea-danger);
}
@media (max-width: 650px) {
  .operator-presets__current,
  .operator-presets__card {
    grid-template-columns: minmax(0, 1fr);
  }
  .operator-presets__save,
  .operator-presets__actions {
    grid-column: 1;
    grid-row: auto;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
    padding-left: 0;
    padding-top: var(--ea-space-3);
    border-left: 0;
    border-top: 1px solid var(--ea-border);
  }
  .operator-presets__save > :first-child {
    flex: 1;
    min-width: 100px;
  }
}
</style>
