<script setup lang="ts">
/**
 * Next 时间轴的整轨装备养成编辑器。
 *
 * 组件复刻旧版四槽配装弹窗的布局与统一精锻交互，但只消费父层投影好的 Build；
 * 它不读取存档或旧 store，也不直接写入持久化数据。词条名称、当前数值和逐词条实例编辑均从
 * 当前 GearDefinition 投影。装备定义编辑待图数据和模拟流程稳定后重新设计。
 */
import { EaButton, EaDialog, EaDialogActions } from '../../../design-system/index';
import { computed, ref, watch } from 'vue';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import { useI18n } from 'vue-i18n';
import './armoryDialog.css';
import {
  getGameSlotTypeName,
  getGearPieceGameName,
  getGearSetGameDescription,
  getGearSetGameName,
} from '../../gameText';
import { getEquipmentLevelColor, isEquipmentArtificable } from '../../progression';
import { GameRichTextRenderer } from '../../presentation';
import {
  resolveGearArtificingLevels,
  resolveMaxGearArtificingLevels,
} from '../../../application/editor/loadoutBuildFactory';
import type {
  GearInstanceViewModel,
  GearSlotsViewModel,
  LoadoutGearSlot,
} from './loadoutBuildViewModel';
import { DEFAULT_GAME_ICON_PATH } from '../../gameAssetPaths';
import { getGearDefinitionInstanceAffixRows } from './gearAffixPresentation';
import GearInstanceDialog from './GearInstanceDialog.vue';

const props = defineProps<{
  visible: boolean;
  gears: GearSlotsViewModel;
  gearSetNames: Readonly<Record<string, string>>;
  gearSetTextSlugs: Readonly<Record<string, string>>;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  update: [slot: LoadoutGearSlot, artificingLevels: readonly number[]];
}>();

const { t, locale } = useI18n({ useScope: 'global' });
const SET_BONUS_REQUIRED_COUNT = 3;
const editingSlot = ref<LoadoutGearSlot | null>(null);
watch(
  () => props.visible,
  visible => {
    if (!visible) editingSlot.value = null;
  },
  { flush: 'sync' },
);

interface SlotConfig {
  readonly slot: LoadoutGearSlot;
  readonly labelKey: string;
  readonly fallback: string;
}

const SLOT_CONFIGS: readonly SlotConfig[] = [
  {
    slot: 'armor',
    labelKey: 'timelineGrid.equipmentSlot.armor',
    fallback: 'Armor',
  },
  {
    slot: 'gloves',
    labelKey: 'timelineGrid.equipmentSlot.gloves',
    fallback: 'Gloves',
  },
  {
    slot: 'accessory1',
    labelKey: 'timelineGrid.equipmentSlot.accessory1',
    fallback: 'Accessory 1',
  },
  {
    slot: 'accessory2',
    labelKey: 'timelineGrid.equipmentSlot.accessory2',
    fallback: 'Accessory 2',
  },
];

function translate(key: string, fallback: string): string {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

function normalizedArtificingLevels(build: GearInstanceViewModel): readonly number[] {
  return build.definition.traits.map((trait, index) =>
    Math.max(
      0,
      Math.min(
        Math.max(0, trait.levelCount - 1),
        Math.trunc(Number(build.artificingLevels[index]) || 0),
      ),
    ),
  );
}

function refineLevels(build: GearInstanceViewModel): readonly number[] {
  const maximum = Math.max(0, ...resolveMaxGearArtificingLevels(build.definition));
  return Array.from({ length: maximum + 1 }, (_, level) => level);
}

function isUniformLevel(build: GearInstanceViewModel, level: number): boolean {
  const levels = normalizedArtificingLevels(build);
  return levels.length > 0 && levels.every(candidate => candidate === level);
}

function setUniformLevel(build: GearInstanceViewModel, level: number): void {
  if (!isEquipmentArtificable(build.definition.levelRequirement)) return;
  emit('update', build.slot, resolveGearArtificingLevels(build.definition, level));
}

function maxOut(): void {
  for (const config of SLOT_CONFIGS) {
    const build = props.gears[config.slot];
    if (build !== null && isEquipmentArtificable(build.definition.levelRequirement)) {
      emit('update', build.slot, resolveMaxGearArtificingLevels(build.definition));
    }
  }
}

const slots = computed(() =>
  SLOT_CONFIGS.map(config => {
    const build = props.gears[config.slot];
    if (build === null) {
      return {
        ...config,
        build: null,
        name: '',
        setName: '',
        slotTypeName: '',
        levelColor: '#888',
        isArtificable: false,
        levels: [] as readonly number[],
        affixRows: [],
      };
    }
    const definition = build.definition;
    const gearSetSlug = definition.gearSetSlug ?? '';
    return {
      ...config,
      build,
      name: definition.displayName ?? getGearPieceGameName(definition.slug, locale.value),
      setName:
        gearSetSlug === ''
          ? ''
          : (props.gearSetNames[gearSetSlug] ?? getGearSetGameName(gearSetSlug, locale.value)),
      slotTypeName: getGameSlotTypeName(definition.slotType, locale.value),
      levelColor: getEquipmentLevelColor(definition.levelRequirement),
      isArtificable: isEquipmentArtificable(definition.levelRequirement),
      levels: normalizedArtificingLevels(build),
      affixRows: getGearDefinitionInstanceAffixRows(
        definition,
        build.artificingLevels,
        (key, named) => String(t(key, named ?? {})),
      ),
    };
  }),
);

const editingGear = computed(() => {
  const slot = editingSlot.value;
  if (slot === null) return null;
  return slots.value.find(candidate => candidate.slot === slot && candidate.build !== null) ?? null;
});

function updateEditingGear(artificingLevels: readonly number[]): void {
  const gear = editingGear.value;
  if (gear === null || gear.build === null) return;
  emit('update', gear.slot, artificingLevels);
}

const activeSetBonuses = computed(() => {
  const counts = new Map<string, number>();
  for (const build of Object.values(props.gears)) {
    const setSlug = build?.definition.gearSetSlug;
    if (setSlug === undefined || setSlug === 'no-set-bonuses') continue;
    counts.set(setSlug, (counts.get(setSlug) ?? 0) + 1);
  }
  return [...counts.entries()].flatMap(([setSlug, equippedCount]) => {
    if (equippedCount < SET_BONUS_REQUIRED_COUNT) return [];
    const description = getGearSetGameDescription(
      props.gearSetTextSlugs[setSlug] ?? setSlug,
      locale.value,
    );
    if (description === null) return [];
    return [
      {
        setSlug,
        equippedCount,
        description,
        setName: props.gearSetNames[setSlug] ?? getGearSetGameName(setSlug, locale.value),
      },
    ];
  });
});
</script>

<template>
  <InputRegionBoundary label="gear-build" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      width="980px"
      append-to-body
      class="gear-loadout-dialog next-armory-dialog"
      @update:model-value="emit('update:visible', $event)"
    >
      <div class="loadout-layout">
        <div
          v-for="slot in slots"
          :key="slot.slot"
          class="gear-slot-card"
          :class="{ 'is-empty': slot.build === null }"
        >
          <div class="slot-head">
            <div class="slot-title">{{ translate(slot.labelKey, slot.fallback) }}</div>
            <div v-if="slot.build !== null" class="slot-tags">
              <span
                class="slot-tag"
                :style="{ color: slot.levelColor, borderColor: slot.levelColor }"
              >
                Lv{{ slot.build.definition.levelRequirement }}
              </span>
              <span class="slot-tag">{{ slot.slotTypeName }}</span>
            </div>
          </div>

          <template v-if="slot.build !== null">
            <div class="gear-main">
              <div class="gear-icon-frame" :style="{ borderColor: slot.levelColor }">
                <img
                  :src="slot.build.definition.iconPath || DEFAULT_GAME_ICON_PATH"
                  :alt="slot.name"
                  class="gear-icon"
                />
              </div>
              <div class="gear-info">
                <div class="gear-name">{{ slot.name }}</div>
                <div class="gear-subline">
                  Lv{{ slot.build.definition.levelRequirement
                  }}<span v-if="slot.setName"> / {{ slot.setName }}</span>
                </div>
                <div v-if="slot.affixRows.length > 0" class="stat-list">
                  <div v-for="row in slot.affixRows" :key="row.key" class="stat-row">
                    <span>{{ row.label }}</span>
                    <strong>{{ row.valueText }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="refine-row">
              <span class="refine-label">
                {{ translate('timelineGrid.equipmentDialog.refine', 'Refine') }}
              </span>
              <span v-if="slot.levels.length > 0" class="refine-mixed">
                {{ slot.levels.join('/') }}
              </span>
              <div v-if="slot.isArtificable" class="refine-buttons">
                <EaButton
                  size="sm"
                  v-for="level in refineLevels(slot.build)"
                  :key="`${slot.slot}-${level}`"
                  type="button"
                  class="refine-btn"
                  @click="setUniformLevel(slot.build, level)"
                  :pressed="isUniformLevel(slot.build, level)"
                >
                  {{
                    level === 0
                      ? translate('timelineGrid.equipmentDialog.refineBase', 'Base')
                      : level
                  }}
                </EaButton>
              </div>
              <span v-else class="refine-locked">
                {{ t('actionLibrary.hints.noRefineNonGold') }}
              </span>
            </div>
            <div class="slot-actions">
              <EaButton size="sm" type="button" @click="editingSlot = slot.slot">
                {{ t('actionLibrary.buttons.editItem') }}
              </EaButton>
            </div>
          </template>

          <div v-else class="empty-slot">
            {{ translate('actionLibrary.fallback.noEquip', 'No gear equipped') }}
          </div>
        </div>

        <div v-if="activeSetBonuses.length > 0" class="gear-set-bonus-panel">
          <div class="gear-set-bonus-title">
            {{ t('timelineGrid.equipmentDialog.setBonusTitle') }}
          </div>
          <div v-for="bonus in activeSetBonuses" :key="bonus.setSlug" class="gear-set-bonus-entry">
            <div class="gear-set-bonus-head">
              <span class="gear-set-bonus-name">{{ bonus.setName }}</span>
              <span class="gear-set-bonus-count">
                {{
                  t('timelineGrid.equipmentDialog.setBonusEquipped', {
                    count: bonus.equippedCount,
                    required: SET_BONUS_REQUIRED_COUNT,
                  })
                }}
              </span>
            </div>
            <GameRichTextRenderer
              class="gear-set-bonus-desc"
              :text="bonus.description"
              :locale="locale"
            />
          </div>
        </div>
      </div>

      <GearInstanceDialog
        :visible="visible && editingGear !== null"
        :gear="editingGear?.build ?? null"
        :name="editingGear?.name ?? ''"
        :slot-type-name="editingGear?.slotTypeName ?? ''"
        :set-name="editingGear?.setName ?? ''"
        :level-color="editingGear?.levelColor ?? '#888'"
        @update:visible="
          value => {
            if (!value) editingSlot = null;
          }
        "
        @update="updateEditingGear"
      />

      <template #footer>
        <EaDialogActions>
          <EaButton variant="primary" size="sm" @click="maxOut">
            {{ t('common.max') }}
          </EaButton>
          <EaButton size="sm" @click="emit('update:visible', false)">
            {{ t('common.close') }}
          </EaButton>
        </EaDialogActions>
      </template>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.loadout-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.gear-slot-card {
  min-height: 230px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--ea-border-soft, rgba(255, 255, 255, 0.08));
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.03));
}

.gear-slot-card.is-empty {
  justify-content: space-between;
  opacity: 0.65;
}

.slot-head,
.gear-set-bonus-head,
.refine-row {
  display: flex;
  align-items: center;
}

.slot-actions {
  display: flex;
  align-self: flex-end;
  gap: 8px;
}

.slot-head {
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.slot-title,
.gear-name {
  color: var(--ea-fg, #f0f0f0);
  font-weight: 700;
}

.slot-title {
  font-size: 14px;
  letter-spacing: 1px;
}

.slot-tags,
.refine-buttons {
  display: flex;
  gap: 6px;
}

.slot-tag {
  padding: 2px 8px;
  color: var(--ea-fg-muted, #bbb);
  font-size: 10px;
  border: 1px solid var(--ea-border-strong, #555);
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.04));
}

.gear-main {
  display: flex;
  gap: 14px;
  min-width: 0;
}

.gear-icon-frame {
  width: 76px;
  height: 76px;
  flex: 0 0 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--ea-keycap-border, #555);
  background: var(--ea-keycap-bg, #1a1a1e);
}

.gear-icon {
  width: 72%;
  height: 72%;
  object-fit: contain;
}

.gear-info {
  min-width: 0;
  flex: 1;
}

.gear-name {
  font-size: 16px;
  line-height: 1.3;
}

.gear-subline {
  margin-top: 4px;
  color: var(--ea-dialog-hint, #999);
  font-size: 12px;
}

.stat-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 10px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--ea-dialog-body, #bdbdbd);
  font-size: 12px;
}

.stat-row strong {
  color: var(--ea-gold);
  font-family: 'Roboto Mono', monospace;
}

.refine-row {
  min-height: 28px;
  margin-top: auto;
  gap: 10px;
}

.refine-label {
  color: var(--ea-dialog-hint, #888);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.refine-mixed {
  color: var(--ea-gold);
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
}

.refine-btn {
  min-width: 34px;
  height: 24px;
  padding: 0 8px;
}

.refine-locked,
.empty-slot {
  color: var(--ea-dialog-hint, #777);
  font-size: 12px;
}

.gear-set-bonus-panel {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 13px 14px;
  border: 1px solid var(--ea-border-soft, rgba(255, 255, 255, 0.08));
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.03));
}

.gear-set-bonus-title {
  color: var(--ea-fg-secondary, #d6d6d6);
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
}

.gear-set-bonus-entry {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--ea-fg-secondary, #d6d6d6);
  font-size: 12px;
  line-height: 1.55;
}

.gear-set-bonus-head {
  gap: 8px;
  min-width: 0;
}

.gear-set-bonus-name {
  min-width: 0;
  color: var(--ea-gear-accent-fg, #2dd4bf);
  font-size: 14px;
  font-weight: 800;
}

.gear-set-bonus-count {
  margin-left: auto;
  color: var(--ea-gear-accent-fg, #2dd4bf);
  font-family: 'Roboto Mono', monospace;
  white-space: nowrap;
  opacity: 0.85;
}

.gear-set-bonus-desc {
  color: var(--ea-fg-secondary, #d0d0d0);
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}

@media (max-width: 760px) {
  .loadout-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .gear-set-bonus-panel {
    grid-column: 1;
  }
}
</style>
