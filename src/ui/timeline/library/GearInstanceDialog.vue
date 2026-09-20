<script setup lang="ts">
/** Current-definition gear instance editor. Template editing remains a separate project-library action. */
import { EaButton, EaDialog, EaDialogActions } from '../../../design-system/index';
import { computed } from 'vue';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import { useI18n } from 'vue-i18n';
import './armoryDialog.css';
import './armoryDialogTheme.css';
import type { GearInstanceViewModel } from './loadoutBuildViewModel';
import { getEquipmentQualityTier, isEquipmentArtificable } from '../../progression';
import { getGearDefinitionInstanceAffixRows } from './gearAffixPresentation';
import { DEFAULT_GAME_ICON_PATH } from '../../gameAssetPaths';
import { getGameQualityName } from '../../gameText';
import { qualityColors } from '../../gameColors';

const props = defineProps<{
  visible: boolean;
  gear: GearInstanceViewModel | null;
  name: string;
  slotTypeName: string;
  setName: string;
  levelColor: string;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  update: [artificingLevels: readonly number[]];
}>();

const { t, locale } = useI18n({ useScope: 'global' });

const quality = computed(() => getEquipmentQualityTier(props.gear?.definition.levelRequirement));
const qualityName = computed(() => getGameQualityName(quality.value, locale.value));
const qualityColor = computed(() => qualityColors[quality.value] ?? props.levelColor);

const isArtificable = computed(
  () => props.gear !== null && isEquipmentArtificable(props.gear.definition.levelRequirement),
);

const affixRows = computed(() =>
  props.gear === null
    ? []
    : getGearDefinitionInstanceAffixRows(
        props.gear.definition,
        props.gear.artificingLevels,
        (key, named) => String(t(key, named ?? {})),
      ),
);

const traitSlots = computed(() =>
  (props.gear?.definition.traits ?? []).map((trait, traitIndex) => ({
    traitIndex,
    current: Math.max(0, Math.trunc(props.gear?.artificingLevels[traitIndex] ?? 0)),
    maximum: Math.max(0, trait.levelCount - 1),
    rows: affixRows.value.filter(row => row.traitIndex === traitIndex),
  })),
);

function setArtificingLevel(traitIndex: number, selectedLevel: number): void {
  const gear = props.gear;
  const slot = traitSlots.value[traitIndex];
  if (!gear || !slot || !isArtificable.value || selectedLevel < 1) return;
  const levels = [...gear.artificingLevels];
  while (levels.length < gear.definition.traits.length) levels.push(0);
  levels[traitIndex] =
    selectedLevel === slot.current ? Math.max(0, selectedLevel - 1) : selectedLevel;
  emit('update', levels);
}

function maxOut(): void {
  if (!isArtificable.value) return;
  emit(
    'update',
    traitSlots.value.map(slot => slot.maximum),
  );
}
</script>

<template>
  <InputRegionBoundary label="gear-instance" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      width="560px"
      append-to-body
      class="armory-dialog next-armory-dialog"
      @update:model-value="emit('update:visible', $event)"
    >
      <template v-if="gear">
        <div class="layout">
          <div class="header">
            <div class="portrait-frame" :style="{ borderColor: qualityColor }">
              <img
                :src="gear.definition.iconPath || DEFAULT_GAME_ICON_PATH"
                :alt="name"
                class="portrait"
              />
            </div>
            <div class="header-info">
              <div class="name">{{ name }}</div>
              <div class="tags">
                <span class="tag" :style="{ color: qualityColor, borderColor: qualityColor }">
                  {{ qualityName }}
                </span>
                <span class="tag">{{ slotTypeName }}</span>
                <span v-if="setName" class="tag">{{ setName }}</span>
              </div>
              <div v-if="gear.definition.baseDefense" class="row">
                <span class="section-label">{{ t('armory.common.defense') }}</span>
                <span class="value">{{ gear.definition.baseDefense }}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">{{ t('armory.common.artificing') }}</div>
            <div v-for="slot in traitSlots" :key="slot.traitIndex" class="stat-row">
              <div class="stat-info">
                <span v-for="row in slot.rows" :key="row.key" class="stat-name">
                  {{ row.label }}
                  <span class="stat-value-inline">{{ row.valueText }}</span>
                </span>
              </div>
              <div v-if="isArtificable" class="stat-bar-area">
                <div class="stat-slots">
                  <EaButton
                    size="sm"
                    icon-only
                    v-for="level in slot.maximum"
                    :key="level"
                    type="button"
                    class="art-slot"
                    @click="setArtificingLevel(slot.traitIndex, level)"
                    :pressed="level <= slot.current"
                  >
                    <template v-if="level <= slot.current">/</template>
                    <template v-else>&nbsp;</template>
                  </EaButton>
                </div>
                <span class="stat-level">{{ slot.current }}/{{ slot.maximum }}</span>
              </div>
              <div v-else class="stat-locked">{{ t('armory.common.requireLevel70') }}</div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <EaDialogActions>
          <EaButton v-if="isArtificable" variant="primary" size="sm" type="button" @click="maxOut">
            {{ t('common.max') }}
          </EaButton>
          <EaButton size="sm" type="button" @click="emit('update:visible', false)">
            {{ t('common.close') }}
          </EaButton>
        </EaDialogActions>
      </template>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.header {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}
.portrait-frame {
  width: 100px;
  min-width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid var(--ea-border-strong, #555);
  background: var(--ea-keycap-bg, #1a1a1e);
}
.portrait {
  width: 80%;
  height: 80%;
  object-fit: contain;
}
.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.name {
  color: var(--ea-fg, #f0f0f0);
  font-size: 20px;
  font-weight: 700;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border: 1px solid var(--ea-border-strong, #555);
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.04));
  color: var(--ea-fg-secondary, #bbb);
  font-size: 11px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-label {
  color: var(--ea-dialog-hint, #888);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.value {
  color: var(--ea-fg, #f0f0f0);
  font-size: 16px;
  font-weight: 700;
}
.section {
  padding: 16px;
  border: 1px solid var(--ea-border-soft, rgba(255, 255, 255, 0.06));
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.02));
}
.section-title {
  margin-bottom: 14px;
  color: var(--ea-dialog-hint, #888);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
}
.stat-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--ea-border-soft, rgba(255, 255, 255, 0.04));
}
.stat-row:last-child {
  border-bottom: 0;
}
.stat-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-name {
  color: var(--ea-fg, #e0e0e0);
  font-size: 13px;
  font-weight: 600;
}
.stat-value-inline {
  margin-left: 6px;
  color: var(--ea-fg-muted, #aaa);
  font-weight: 400;
}
.stat-bar-area {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}
.stat-slots {
  display: flex;
  gap: 3px;
}
.art-slot {
  color: transparent;
  font-family: 'Roboto Mono', monospace;
}
.art-slot[aria-pressed='true'] {
  color: inherit;
}
.stat-level {
  min-width: 24px;
  color: var(--ea-fg-secondary, #ccc);
  font-family: 'Roboto Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  text-align: right;
}
.stat-locked {
  color: var(--ea-dialog-hint, #777);
  font-size: 12px;
}
@media (hover: hover) and (pointer: fine) {
  .art-slot[aria-pressed='true']:hover:not(:disabled) {
    color: inherit;
  }
}
</style>
