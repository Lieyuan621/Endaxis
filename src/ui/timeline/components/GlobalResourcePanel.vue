<script setup lang="ts">
import { computed, ref, defineAsyncComponent, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaDialog, EaDialogActions, EaNumberInput } from '@/design-system';
import type {
  GlobalConfigDocument,
  GlobalBuffDocument,
  GlobalOperatorStatModifier,
  GlobalOperatorStatModifierDocument,
} from '../../../core/project/schema';
import { GLOBAL_CONFIG_PRESETS } from '../../../core/project/globalConfigPresets';
import TimelineAsyncDialogLoading from './TimelineAsyncDialogLoading.vue';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';

const props = defineProps<{
  readOnly?: boolean;
  mode?: 'modifiers' | 'presets';
  config: GlobalConfigDocument;
}>();
const emit = defineEmits<{
  setModifiers: [modifiers: readonly GlobalOperatorStatModifierDocument[]];
  setConfig: [config: GlobalConfigDocument];
}>();
const { t } = useI18n({ useScope: 'global' });
const editorVisible = ref(false);
interface ModifierChoice {
  modifier: GlobalOperatorStatModifier;
  nameKey: string;
  percentage: boolean;
  skillType?: 'comboSkill';
}
const choices: readonly ModifierChoice[] = [
  {
    modifier: 'skillCooldownReduction',
    nameKey: 'statDetail.comboCdReduction',
    percentage: true,
    skillType: 'comboSkill',
  },
  {
    modifier: 'ultimateEnergyGainEfficiency',
    nameKey: 'effects.name.ultimateGainEfficiency',
    percentage: true,
  },
  { modifier: 'artsIntensity', nameKey: 'effects.name.artsIntensity', percentage: false },
  { modifier: 'attackPercent', nameKey: 'effects.name.atkPercent', percentage: true },
  { modifier: 'criticalRate', nameKey: 'effects.name.critRate', percentage: true },
  { modifier: 'criticalDamage', nameKey: 'effects.name.critDmg', percentage: true },
];
const groups = computed(() =>
  choices.map(choice => ({
    ...choice,
    entries: props.config.modifiers.filter(item => item.modifier === choice.modifier),
  })),
);
const modifiers = computed(() => props.config.modifiers);
const GlobalBuffEditorDialog = defineAsyncComponent({
  loader: () => import('./GlobalBuffEditorDialog.vue'),
  loadingComponent: TimelineAsyncDialogLoading,
  delay: 0,
});
const editingBuff = shallowRef<GlobalBuffDocument | null>(null);
function togglePreset(id: string) {
  if (props.readOnly) return;
  const ids = props.config.enabledPresetIds ?? [];
  emit('setConfig', {
    ...props.config,
    enabledPresetIds: ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id],
  });
}
function saveBuff(buff: GlobalBuffDocument) {
  if (props.readOnly) return;
  const buffs = props.config.customBuffs ?? [];
  emit('setConfig', {
    ...props.config,
    customBuffs: buffs.some(item => item.id === buff.id)
      ? buffs.map(item => (item.id === buff.id ? buff : item))
      : [...buffs, buff],
  });
  editingBuff.value = null;
}
function addBuff() {
  if (props.readOnly) return;
  let index = 1;
  while (props.config.customBuffs?.some(item => item.id === `scenario:custom-global:${index}`))
    index++;
  editingBuff.value = {
    id: `scenario:custom-global:${index}`,
    name: t('globalConfig.customBuff'),
    enabled: true,
    definition: { stackingType: 'unlimited', presentation: { visible: false } },
  };
}
function deleteBuff(id: string) {
  if (!props.readOnly)
    emit('setConfig', {
      ...props.config,
      customBuffs: (props.config.customBuffs ?? []).filter(buff => buff.id !== id),
    });
}
function choiceFor(modifier: GlobalOperatorStatModifierDocument) {
  return choices.find(choice => choice.modifier === modifier.modifier)!;
}
function formatValue(modifier: GlobalOperatorStatModifierDocument) {
  const choice = choiceFor(modifier);
  const value = Number((choice.percentage ? modifier.value * 100 : modifier.value).toFixed(3));
  return `${value > 0 && !choice.skillType ? '+' : ''}${value}${choice.percentage ? '%' : ''}`;
}
function addModifier(choice: ModifierChoice) {
  if (props.readOnly) return;
  let index = 1;
  const ids = new Set(props.config.modifiers.map(item => item.id));
  while (ids.has(`global:modifier:${index}`)) index++;
  emit('setModifiers', [
    ...props.config.modifiers,
    {
      id: `global:modifier:${index}`,
      kind: 'operatorStat',
      modifier: choice.modifier,
      value: 0,
      ...(choice.skillType ? { skillType: choice.skillType } : {}),
    },
  ]);
}
function updateModifierValue(
  modifier: GlobalOperatorStatModifierDocument,
  displayValue: number | undefined,
) {
  if (props.readOnly || displayValue === undefined || !Number.isFinite(displayValue)) return;
  const value = choiceFor(modifier).percentage ? displayValue / 100 : displayValue;
  if (modifier.modifier === 'skillCooldownReduction' && value >= 1) return;
  emit(
    'setModifiers',
    props.config.modifiers.map(item => (item.id === modifier.id ? { ...item, value } : item)),
  );
}
function removeModifier(id: string) {
  if (!props.readOnly)
    emit(
      'setModifiers',
      props.config.modifiers.filter(item => item.id !== id),
    );
}
</script>

<template>
  <section v-if="mode === 'presets'" class="global-config-presets">
    <div class="preset-title">{{ t('globalConfig.buffsTitle') }}</div>
    <div class="preset-grid" role="group" :aria-label="t('globalConfig.buffsTitle')">
      <EaButton
        v-for="preset in GLOBAL_CONFIG_PRESETS"
        :key="preset.id"
        class="preset-tile"
        :pressed="config.enabledPresetIds?.includes(preset.id) ?? false"
        :disabled="readOnly"
        @click="togglePreset(preset.id)"
      >
        <strong>{{ t(preset.nameKey) }}</strong
        ><small>{{ t(preset.descriptionKey) }}</small>
      </EaButton>
      <article v-for="buff in config.customBuffs ?? []" :key="buff.id" class="custom-buff-card">
        <EaButton
          class="preset-tile"
          :pressed="buff.enabled"
          :disabled="readOnly"
          @click="saveBuff({ ...buff, enabled: !buff.enabled })"
        >
          <strong>{{ buff.name }}</strong
          ><small>{{ t(buff.enabled ? 'globalConfig.enabled' : 'globalConfig.disabled') }}</small>
        </EaButton>
        <div class="buff-actions">
          <EaButton size="sm" :disabled="readOnly" @click="editingBuff = buff">{{
            t('common.edit')
          }}</EaButton>
          <EaButton size="sm" variant="danger" :disabled="readOnly" @click="deleteBuff(buff.id)">{{
            t('common.delete')
          }}</EaButton>
        </div>
      </article>
      <EaButton class="preset-tile add-buff" :disabled="readOnly" @click="addBuff"
        >+ {{ t('globalConfig.addBuff') }}</EaButton
      >
    </div>
    <GlobalBuffEditorDialog
      v-if="editingBuff"
      :buff="editingBuff"
      @save="saveBuff"
      @close="editingBuff = null"
    />
  </section>
  <section v-else class="global-config-settings">
    <div class="panel-title">{{ t('globalConfig.customSection') }}</div>
    <div class="stats-summary">
      <p v-if="modifiers.length === 0" class="empty-hint">{{ t('globalConfig.customEmpty') }}</p>
      <div v-for="modifier in modifiers" :key="modifier.id" class="summary-row">
        <span>{{ t(choiceFor(modifier).nameKey) }}</span
        ><strong>{{ formatValue(modifier) }}</strong>
      </div>
      <EaButton size="sm" class="stats-edit-btn" @click="editorVisible = true">{{
        t('globalConfig.editCustom')
      }}</EaButton>
    </div>
    <InputRegionBoundary label="global-modifiers" :active="editorVisible" modal>
      <EaDialog
        v-model="editorVisible"
        width="440px"
        append-to-body
        align-center
        class="armory-dialog global-modifiers-dialog"
        :title="t('globalConfig.editCustomTitle')"
      >
        <div class="stat-blocks">
          <section
            v-for="group in groups"
            :key="group.modifier"
            class="stat-block"
            :class="{ 'has-entries': group.entries.length }"
          >
            <div class="stat-block-head">
              <span>{{ t(group.nameKey) }}</span>
              <EaButton size="sm" :disabled="readOnly" @click="addModifier(group)">{{
                t('globalConfig.addEntry')
              }}</EaButton>
            </div>
            <div v-if="group.entries.length" class="stat-block-body">
              <div v-for="(modifier, index) in group.entries" :key="modifier.id" class="stat-entry">
                <span class="affix">{{ group.percentage && !group.skillType ? '+' : '' }}</span>
                <EaNumberInput
                  size="sm"
                  controls-position="right"
                  :aria-label="`${t(group.nameKey)} ${index + 1}`"
                  :disabled="readOnly"
                  :max="group.skillType ? 99.999 : undefined"
                  :step="group.percentage ? 0.1 : 1"
                  :model-value="group.percentage ? modifier.value * 100 : modifier.value"
                  @change="updateModifierValue(modifier, $event)"
                />
                <span class="affix">{{ group.percentage ? '%' : '' }}</span>
                <EaButton
                  variant="danger"
                  size="sm"
                  :disabled="readOnly"
                  @click="removeModifier(modifier.id)"
                  >{{ t('common.delete') }}</EaButton
                >
              </div>
            </div>
          </section>
        </div>
        <template #footer>
          <EaDialogActions>
            <EaButton size="sm" @click="editorVisible = false">{{ t('common.close') }}</EaButton>
          </EaDialogActions>
        </template>
      </EaDialog>
    </InputRegionBoundary>
  </section>
</template>
<style scoped>
.global-config-settings,
.global-config-presets {
  height: 100%;
  overflow: auto;
  padding: 12px 12px 16px;
  box-sizing: border-box;
  background: var(--ea-workbench-panel);
  color: var(--ea-fg);
}
.panel-title {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ea-fg-secondary);
}
.stats-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  background: var(--ea-fill-soft);
  border: 1px solid var(--ea-border-soft);
  font-size: 12px;
}
.summary-row span {
  min-width: 0;
  flex: 1;
  color: var(--ea-fg-secondary);
}
.summary-row strong {
  flex: none;
  font-weight: normal;
  font-variant-numeric: tabular-nums;
}
.empty-hint {
  margin: 0;
  padding: 4px 0 2px;
  color: var(--ea-fg-faint);
  font-size: 12px;
}
.stats-edit-btn {
  align-self: stretch;
  margin-top: 4px;
}
.global-config-presets {
  padding: 14px 16px 20px;
}
.preset-title {
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ea-fg-secondary);
}
.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 160px));
  gap: 8px;
  max-width: none;
}
.preset-tile {
  height: 64px;
  min-height: 64px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  white-space: normal;
  background: var(--ea-keycap-bg);
  border: 1px solid var(--ea-border-strong);
}
.preset-tile strong {
  font-size: 13px;
  line-height: 1.25;
}
.preset-tile small {
  color: var(--ea-fg-muted);
  font-size: 11px;
  line-height: 1.3;
}
.preset-tile[aria-pressed='true'] {
  --ea-control-pressed-border-hover: color-mix(in srgb, var(--ea-gold) 55%, transparent);
  --ea-control-pressed-bg-hover: color-mix(in srgb, var(--ea-gold) 12%, var(--ea-keycap-bg));
  border-color: var(--ea-control-pressed-border-hover);
  background: var(--ea-control-pressed-bg-hover);
  box-shadow: none;
}
.stat-blocks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 65vh;
  overflow: hidden auto;
}
.stat-block {
  background: var(--ea-fill-soft);
  border: 1px solid transparent;
}
.stat-block.has-entries {
  border-color: var(--ea-border-soft);
}
.stat-block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
}
.stat-block-head > span {
  min-width: 0;
  flex: 1;
  font-size: 13px;
  color: var(--ea-fg-secondary);
}
.stat-block-head .ea-button {
  flex: none;
  min-width: 52px;
}
.stat-block-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 10px 8px;
  border-top: 1px solid var(--ea-border-soft);
}
.stat-entry {
  display: grid;
  grid-template-columns: 14px 96px 14px 52px;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}
.affix {
  text-align: center;
  font-size: 12px;
  color: var(--ea-fg-muted);
}
.stat-entry :deep(.ea-number-input) {
  width: 96px;
  min-width: 0;
}
.stat-entry .ea-button {
  padding: 0;
}
.custom-buff-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.custom-buff-card .preset-tile {
  width: 100%;
}
.buff-actions {
  display: flex;
  gap: 6px;
  padding-top: 6px;
}
.buff-actions > * {
  flex: 1;
}
.preset-grid {
  align-items: start;
}
.preset-tile strong {
  overflow-wrap: anywhere;
}
.add-buff {
  border-style: dashed;
}
</style>
