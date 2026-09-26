<script setup lang="ts">
/**
 * Next 时间轴的武器养成编辑弹窗。界面沿用旧版武器编辑器，但只读取稳定的 Build 投影，
 * 所有用户修改均通过事件交给父层持久化；组件本身不访问旧 Store，也不补造定义中不存在的数据。
 */
import { EaButton, EaDialog, EaDialogActions } from '../../../design-system/index';
import { computed } from 'vue';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import { useI18n } from 'vue-i18n';
import './armoryDialog.css';
import {
  getGameWeaponTypeName,
  getWeaponGameName,
  getWeaponSkillDescription,
  getWeaponSkillName,
  getWeaponUiLabel,
} from '../../gameText';
import {
  getWeaponTraitBounds,
  type WeaponLevel,
  type WeaponTraitLevelBounds,
} from '../../progression';
import { GameRichTextRenderer } from '../../presentation';
import type { WeaponInstanceChanges } from './loadoutBuildCommands';
import type { WeaponInstanceViewModel } from './loadoutBuildViewModel';
import { DEFAULT_WEAPON_ICON_PATH } from '../../gameAssetPaths';
import {
  projectMaxWeaponChanges,
  projectWeaponPotentialChange,
  projectWeaponProgressionChange,
} from './loadoutBuildProgression';
import { getWeaponTraitValueText } from './weaponTraitPresentation';

const LEVELS = [1, 20, 40, 60, 80, 90] as const satisfies readonly WeaponLevel[];
type WeaponTraitKey = 'skill1' | 'skill2' | 'skill3';

const props = defineProps<{
  visible: boolean;
  weapon: WeaponInstanceViewModel | null;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
  change: [changes: WeaponInstanceChanges];
}>();

const { t, locale } = useI18n({ useScope: 'global' });

const rarityColor = computed(() => {
  const rarity = props.weapon?.definition.rarity ?? 0;
  if (rarity === 6) return 'var(--ea-gold)';
  if (rarity === 5) return '#ffc400';
  if (rarity === 4) return '#d8b4fe';
  return '#888';
});

const potentialColor = computed(() => {
  const rarity = props.weapon?.definition.rarity ?? 0;
  if (rarity === 6) return '#ff4500';
  if (rarity === 5) return '#ffc400';
  if (rarity === 4) return '#d8b4fe';
  return '#888';
});

const levelNodeIndex = computed(() => LEVELS.findIndex(level => level === props.weapon?.level));

const baseAttack = computed(() => {
  const weapon = props.weapon;
  if (!weapon || levelNodeIndex.value < 0) return null;
  return weapon.definition.baseAttackAtLevelNodes[levelNodeIndex.value] ?? null;
});
const weaponTextSlug = computed(
  () => props.weapon?.definition.assetSlug ?? props.weapon?.weaponSlug ?? '',
);
const weaponDisplayName = computed(
  () =>
    props.weapon?.definition.displayName ?? getWeaponGameName(weaponTextSlug.value, locale.value),
);

const canTune = computed(() => {
  const level = props.weapon?.level;
  return level !== undefined && level !== 1 && level !== 90;
});

const traitKeys = computed<readonly string[]>(() =>
  (props.weapon?.definition.traits ?? []).map(trait => trait.key),
);

function isWeaponTraitKey(value: string): value is WeaponTraitKey {
  return value === 'skill1' || value === 'skill2' || value === 'skill3';
}

function currentLevelNode(): WeaponLevel | null {
  return LEVELS.find(level => level === props.weapon?.level) ?? null;
}

function boundsFor(level: WeaponLevel, tuned: boolean, potential: number) {
  return getWeaponTraitBounds(level, tuned, potential);
}

function currentBounds(): Record<WeaponTraitKey, WeaponTraitLevelBounds> | null {
  const weapon = props.weapon;
  const level = currentLevelNode();
  return weapon && level ? boundsFor(level, weapon.tuned, weapon.potential) : null;
}

function traitIndex(key: string): number {
  return props.weapon?.definition.traits.findIndex(trait => trait.key === key) ?? -1;
}

function traitLevel(key: string): number {
  const index = traitIndex(key);
  return index < 0 ? 1 : (props.weapon?.traitLevels[index] ?? 1);
}

function traitBounds(key: string): WeaponTraitLevelBounds {
  const bounds = isWeaponTraitKey(key) ? currentBounds()?.[key] : undefined;
  if (bounds) return bounds;
  const index = traitIndex(key);
  const levelCount = index < 0 ? 1 : (props.weapon?.definition.traits[index]?.levelCount ?? 1);
  return { min: 1, max: levelCount };
}

function emitChange(changes: WeaponInstanceChanges): void {
  emit('change', changes);
}

function handleLevelChange(level: WeaponLevel): void {
  const weapon = props.weapon;
  if (!weapon) return;
  emitChange(projectWeaponProgressionChange(weapon, level, weapon.tuned));
}

function toggleTuning(): void {
  const weapon = props.weapon;
  const level = currentLevelNode();
  if (!weapon || !level || !canTune.value) return;
  emitChange(projectWeaponProgressionChange(weapon, level, !weapon.tuned));
}

function setPotential(potential: number): void {
  const weapon = props.weapon;
  if (!weapon) return;
  const nextPotential = weapon.potential === potential ? potential - 1 : potential;
  emitChange(projectWeaponPotentialChange(weapon, nextPotential));
}

function setTraitLevel(key: string, selectedLevel: number): void {
  const weapon = props.weapon;
  const index = traitIndex(key);
  const bounds = traitBounds(key);
  if (!weapon || index < 0 || selectedLevel <= bounds.min || selectedLevel > bounds.max) return;
  const current = traitLevel(key);
  const traitLevels = [...weapon.traitLevels];
  traitLevels[index] =
    selectedLevel === current ? Math.max(bounds.min, current - 1) : selectedLevel;
  emitChange({ traitLevels });
}

function slotClass(key: string, level: number): string {
  const bounds = traitBounds(key);
  if (level <= bounds.min) return 'slot-base';
  if (level <= traitLevel(key)) return 'slot-active';
  if (level <= bounds.max) return 'slot-empty';
  return 'slot-locked';
}

function traitName(key: string): string {
  const weapon = props.weapon;
  if (!isWeaponTraitKey(key)) return key;
  if (!weapon) return t(`armory.weapon.${key}`);
  return getWeaponSkillName(weaponTextSlug.value, key, locale.value, t(`armory.weapon.${key}`));
}

function traitDescription(key: string): string {
  const weapon = props.weapon;
  if (!weapon || !isWeaponTraitKey(key)) return '';
  return getWeaponSkillDescription(weaponTextSlug.value, key, locale.value, traitLevel(key)) ?? '';
}

function traitValueText(key: string): string {
  const weapon = props.weapon;
  const index = traitIndex(key);
  const trait = index < 0 ? undefined : weapon?.definition.traits[index];
  return trait ? getWeaponTraitValueText(trait, traitLevel(key)) : '';
}

function traitDisplayLevels(key: string): readonly number[] {
  const index = traitIndex(key);
  const count = index < 0 ? 1 : (props.weapon?.definition.traits[index]?.levelCount ?? 1);
  return Array.from({ length: Math.max(1, count) }, (_, level) => level + 1);
}

function tuningLabel(): string {
  const weapon = props.weapon;
  if (!weapon) return '';
  if (canTune.value) return getWeaponUiLabel('tuned', locale.value);
  return getWeaponUiLabel(weapon.level === 90 ? 'fullyTuned' : 'tuningUnavailable', locale.value);
}

function maxOut(): void {
  const weapon = props.weapon;
  if (!weapon) return;
  emitChange(projectMaxWeaponChanges(weapon));
}
</script>

<template>
  <InputRegionBoundary label="weapon-build" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      width="700px"
      append-to-body
      class="armory-dialog next-armory-dialog"
      @update:model-value="emit('update:visible', $event)"
    >
      <template v-if="weapon">
        <div class="layout">
          <div class="header">
            <div
              class="portrait-frame"
              :class="`rarity-${weapon.definition.rarity}-style`"
              :style="weapon.definition.rarity === 6 ? {} : { borderColor: rarityColor }"
            >
              <img
                :src="weapon.definition.iconPath || DEFAULT_WEAPON_ICON_PATH"
                alt=""
                class="portrait"
              />
            </div>
            <div class="header-info">
              <div class="name-row">
                <span class="name">{{ weaponDisplayName }}</span>
                <span
                  class="stars"
                  :class="`header-rarity-${weapon.definition.rarity}`"
                  :style="{ color: rarityColor }"
                  >{{ '★'.repeat(weapon.definition.rarity) }}</span
                >
              </div>
              <div class="tags">
                <span class="tag">{{
                  getGameWeaponTypeName(weapon.definition.weaponType, locale)
                }}</span>
              </div>
              <div class="level-display">
                <span class="level-num">{{ weapon.level }}</span>
                <span class="level-text">{{ t('armory.common.level') }}</span>
              </div>
              <div v-if="baseAttack !== null" class="row">
                <span class="section-label">{{ t('armory.common.baseAtk') }}</span>
                <span class="value">{{ baseAttack }}</span>
              </div>
              <div class="row row-actions">
                <EaButton
                  size="sm"
                  :disabled="!canTune"
                  :style="weapon.tuned ? { borderColor: rarityColor, color: rarityColor } : {}"
                  @click="toggleTuning"
                >
                  {{ tuningLabel() }}
                </EaButton>
              </div>
              <div class="row">
                <span class="section-label">{{ t('armory.common.potential') }}</span>
                <div class="diamonds">
                  <EaButton
                    v-for="potential in 5"
                    :key="potential"
                    class="diamond"
                    :style="weapon.potential >= potential ? { background: potentialColor } : {}"
                    @click="setPotential(potential)"
                    :pressed="weapon.potential >= potential"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="level-selector">
            <EaButton
              size="sm"
              v-for="level in LEVELS"
              :key="level"
              class="level-btn"
              :style="
                weapon.level === level
                  ? {
                      borderColor: rarityColor,
                      color: rarityColor,
                      background: `color-mix(in srgb, ${rarityColor} 18%, var(--ea-dialog-bg, #fff))`,
                    }
                  : {}
              "
              @click="handleLevelChange(level)"
            >
              Lv{{ level }}
            </EaButton>
          </div>

          <div class="section">
            <div class="section-title">{{ t('armory.common.skills') }}</div>
            <div v-for="key in traitKeys" :key="key" class="skill-row">
              <div class="skill-row-main">
                <div class="skill-info">
                  <span class="skill-name">{{ traitName(key) }}</span>
                  <span v-if="traitValueText(key)" class="skill-value">{{
                    traitValueText(key)
                  }}</span>
                </div>
                <div class="skill-bar-area">
                  <div class="skill-slots">
                    <EaButton
                      v-for="level in traitDisplayLevels(key)"
                      :key="level"
                      class="skill-slot"
                      :class="slotClass(key, level)"
                      :disabled="level <= traitBounds(key).min || level > traitBounds(key).max"
                      @click="setTraitLevel(key, level)"
                    >
                      <template v-if="slotClass(key, level) === 'slot-locked'">&times;</template>
                      <template v-else-if="slotClass(key, level) === 'slot-empty'">&nbsp;</template>
                      <template v-else>/</template>
                    </EaButton>
                  </div>
                  <span class="skill-counter"
                    >{{ traitLevel(key) }}/{{ traitBounds(key).max }}</span
                  >
                </div>
              </div>
              <GameRichTextRenderer
                v-if="traitDescription(key)"
                class="skill-description"
                :text="traitDescription(key)"
                :locale="locale"
              />
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <EaDialogActions>
          <EaButton variant="primary" size="sm" :disabled="weapon === null" @click="maxOut">
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
.layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.row-actions {
  flex-wrap: wrap;
}
.portrait-frame {
  --armory-pad: var(--ea-keycap-bg, #1a1a1e);
  width: 120px;
  min-width: 120px;
  height: 120px;
  border: 2px solid var(--ea-border-strong, #555);
  overflow: hidden;
  background: var(--armory-pad);
}
.portrait {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.rarity-6-style.portrait-frame {
  border: 2px solid transparent;
  background:
    linear-gradient(var(--armory-pad), var(--armory-pad)) padding-box,
    linear-gradient(135deg, var(--ea-gold), #ff8c00, #ff4500) border-box;
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.2);
}
.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.name-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}
.name {
  font-size: 22px;
  font-weight: 700;
  color: var(--ea-fg, #f0f0f0);
}
.stars {
  font-size: 14px;
  letter-spacing: 1px;
}
.header-rarity-6.stars {
  background: linear-gradient(45deg, var(--ea-gold), #ff8c00, #ff4500);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent !important;
}
.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  font-size: 11px;
  border: 1px solid var(--ea-border-strong, #555);
  color: var(--ea-fg-secondary, #bbb);
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.04));
}
.level-display {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 4px;
}
.level-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--ea-fg, #f0f0f0);
  line-height: 1;
}
.level-text,
.section-label {
  font-size: 11px;
  color: var(--ea-dialog-hint, #888);
  letter-spacing: 1px;
  text-transform: uppercase;
}
.level-text {
  letter-spacing: 2px;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.value {
  font-size: 16px;
  font-weight: 700;
  color: var(--ea-fg, #f0f0f0);
}
.diamonds {
  display: flex;
  gap: 8px;
}
.diamond {
  width: 16px;
  height: 16px;
  transform: rotate(45deg);
  border: 1.5px solid var(--ea-border-strong, #555);
  background: transparent;
  cursor: pointer;
  padding: 0;
}
.diamond[aria-pressed='true'] {
  border-color: transparent;
  box-shadow: none;
}
.level-selector {
  display: flex;
  gap: 6px;
}
.level-btn {
  flex: 1;
  justify-content: center;
}
.section {
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.02));
  border: 1px solid var(--ea-border-soft, rgba(255, 255, 255, 0.06));
  padding: 16px;
}
.section-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--ea-dialog-hint, #888);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.skill-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--ea-border-soft, rgba(255, 255, 255, 0.04));
}
.skill-row:last-child {
  border-bottom: none;
}
.skill-row-main {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.skill-info {
  flex: 1;
  min-width: 0;
}
.skill-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ea-fg, #e0e0e0);
}
.skill-value {
  margin-left: 8px;
  color: var(--ea-fg-muted, #aaa);
  font-size: 12px;
}
.skill-bar-area {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  flex-shrink: 0;
}
.skill-slots {
  display: flex;
  gap: 3px;
}
.skill-slot {
  width: 22px;
  height: 22px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  padding: 0;
  font-family: 'Roboto Mono', monospace;
}
.skill-slot.slot-base {
  background: var(--ea-fill-muted, rgba(255, 255, 255, 0.12));
  color: var(--ea-fg-secondary, rgba(255, 255, 255, 0.7));
}
.skill-slot.slot-active {
  background: color-mix(in srgb, var(--ea-gold) 22%, transparent);
  color: var(--ea-gold);
  cursor: pointer;
}
.skill-slot.slot-empty {
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.04));
  color: transparent;
  border: 1px solid var(--ea-border, rgba(255, 255, 255, 0.1));
  cursor: pointer;
}
.skill-slot.slot-locked {
  background: var(--ea-fill-soft, rgba(255, 255, 255, 0.03));
  color: var(--ea-fg-faint, rgba(255, 255, 255, 0.2));
}
.skill-counter {
  font-size: 13px;
  font-weight: 700;
  color: var(--ea-fg-secondary, #ccc);
  min-width: 28px;
  text-align: right;
  font-family: 'Roboto Mono', monospace;
}
.skill-description {
  display: block;
  color: var(--ea-dialog-body, #c8c8c8);
  font-size: 12px;
  line-height: 1.55;
}
.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}

@media (max-width: 768px) {
  .layout,
  .header {
    gap: 12px;
  }

  .portrait-frame {
    width: 82px;
    min-width: 82px;
    height: 82px;
  }

  .name {
    overflow-wrap: anywhere;
    font-size: 18px;
  }

  .level-num {
    font-size: 22px;
  }

  .level-selector,
  .skill-bar-area {
    overflow-x: auto;
  }

  .level-btn {
    min-width: 42px;
    flex: 0 0 auto;
  }

  .section {
    padding: 12px;
  }

  .skill-row-main {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .skill-bar-area {
    width: 100%;
    margin-left: 0;
  }

  .skill-slots {
    flex: 0 0 auto;
  }
}
@media (hover: hover) and (pointer: fine) {
  .diamond[aria-pressed='true']:hover:not(:disabled) {
    border-color: transparent;
    box-shadow: none;
  }
}
</style>
