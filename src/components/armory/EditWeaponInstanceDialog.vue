<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getWeapon } from '@/data';
import {
  getGameWeaponTypeName,
  getWeaponGameName,
  getWeaponSkillName,
  getWeaponUiLabel,
} from '@/data/gameText';
import { useWeaponStore } from '@/stores/weaponStore';
import { getSkillBounds } from '@/utils/weaponBounds';

const LEVELS = [1, 20, 40, 60, 80, 90];
const ALL_SKILL_KEYS = ['skill1', 'skill2', 'skill3'];
const ABSOLUTE_MAX = 9;

const props = defineProps({
  instance: { type: Object, default: null },
  visible: { type: Boolean, default: false },
  displayName: { type: String, default: '' },
});

const emit = defineEmits(['update:visible']);

const weaponStore = useWeaponStore();
const { t, locale } = useI18n();

const weapon = computed(() => (props.instance ? getWeapon(props.instance.weaponSlug) : null));
const color = computed(() =>
  weapon.value ? getRarityBaseColor(Number(weapon.value.rarity) || 0) : '#888',
);

const potentialColor = computed(() => {
  const rarity = Number(weapon.value?.rarity) || 0;
  if (rarity === 5) return '#ffc400';
  if (rarity === 4) return '#d8b4fe';
  if (rarity === 6) return '#FF4500';
  return '#888';
});
const activeSkillKeys = computed(() => {
  if (!weapon.value) return ALL_SKILL_KEYS;
  return ALL_SKILL_KEYS.filter(key => weapon.value[key]);
});

const bounds = computed(() => {
  if (!props.instance) return null;
  return getSkillBounds(props.instance.level, props.instance.tuned, props.instance.potential);
});

const baseAtk = computed(() => {
  if (!weapon.value || !props.instance) return 0;
  const levelIdx = LEVELS.indexOf(props.instance.level);
  return weapon.value.baseAtk[levelIdx] ?? weapon.value.baseAtk[0] ?? 0;
});

const canTune = computed(() => {
  if (!props.instance) return false;
  return props.instance.level !== 1 && props.instance.level !== 90;
});

function getRarityBaseColor(rarity) {
  if (rarity === 6) return '#FFD700';
  if (rarity === 5) return '#ffc400';
  if (rarity === 4) return '#d8b4fe';
  return '#888';
}

function update(updates) {
  if (props.instance) weaponStore.updateWeapon(props.instance.id, updates);
}

function handleLevelChange(level) {
  if (!props.instance) return;
  let tuned = props.instance.tuned;
  if (level === 1) tuned = false;
  if (level === 90) tuned = true;
  update({ level, tuned });
}

function maxOut() {
  if (!props.instance || !weapon.value) return;
  const maxPotential = weapon.value.rarity <= 5 ? 5 : props.instance.potential;
  const nextBounds = getSkillBounds(90, true, maxPotential);
  const updates = {
    level: 90,
    tuned: true,
    skill1Level: nextBounds.skill1.max,
    skill2Level: nextBounds.skill2.max,
    skill3Level: nextBounds.skill3.max,
  };
  if (weapon.value.rarity <= 5) updates.potential = 5;
  update(updates);
}

function tunedLabel() {
  if (!props.instance) return '';
  if (canTune.value) return getWeaponUiLabel('tuned', locale.value);
  if (props.instance.level === 90) return getWeaponUiLabel('fullyTuned', locale.value);
  return getWeaponUiLabel('tuningUnavailable', locale.value);
}

function getSkillLevel(skillKey) {
  if (!props.instance) return 1;
  return props.instance[`${skillKey}Level`] ?? 1;
}

function getSkillBoundsForKey(skillKey) {
  if (!bounds.value) return { min: 1, max: 1 };
  return bounds.value[skillKey];
}

function setSkillLevel(skillKey, slotLevel) {
  const skillBounds = getSkillBoundsForKey(skillKey);
  if (slotLevel < skillBounds.min || slotLevel > skillBounds.max) return;
  const current = getSkillLevel(skillKey);
  const levelKey = `${skillKey}Level`;
  update({
    [levelKey]: slotLevel === current ? Math.max(skillBounds.min, current - 1) : slotLevel,
  });
}

function slotClass(skillKey, slotLevel) {
  const skillBounds = getSkillBoundsForKey(skillKey);
  const current = getSkillLevel(skillKey);
  if (slotLevel <= skillBounds.min) return 'slot-base';
  if (slotLevel <= current) return 'slot-active';
  if (slotLevel <= skillBounds.max) return 'slot-empty';
  return 'slot-locked';
}

function slotClickable(skillKey, slotLevel) {
  const skillBounds = getSkillBoundsForKey(skillKey);
  return slotLevel > skillBounds.min && slotLevel <= skillBounds.max;
}

function fmtNum(v) {
  if (Number.isInteger(v)) return String(v);
  return parseFloat(Number(v).toFixed(1)).toString();
}

function getSkillValueSuffix(skillKey) {
  if (!weapon.value) return '';
  const current = weapon.value[skillKey];
  const values = Array.isArray(current?.values) ? current.values : [];
  const val = values[getSkillLevel(skillKey) - 1] ?? values[0];
  if (val == null) return '';
  return `+${fmtNum(val)}${current?.isPercent ? '%' : ''}`;
}

function getSkillName(skillKey) {
  const slug = props.instance?.weaponSlug;
  if (!slug) return t(`armory.weapon.${skillKey}`);
  return getWeaponSkillName(slug, skillKey, locale.value, t(`armory.weapon.${skillKey}`));
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="700px"
    append-to-body
    class="armory-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <template v-if="instance && weapon">
      <div class="layout">
        <div class="header">
          <div
            class="portrait-frame"
            :class="`rarity-${weapon.rarity}-style`"
            :style="weapon.rarity === 6 ? {} : { borderColor: color }"
          >
            <img :src="weapon.icon" class="portrait" />
          </div>
          <div class="header-info">
            <div class="name-row">
              <span class="name">{{
                displayName || getWeaponGameName(instance.weaponSlug, locale) || instance.weaponSlug
              }}</span>
              <span class="stars" :class="`header-rarity-${weapon.rarity}`" :style="{ color }">{{
                '★'.repeat(weapon.rarity)
              }}</span>
            </div>
            <div class="tags">
              <span class="tag">{{ getGameWeaponTypeName(weapon.type, locale) }}</span>
            </div>
            <div class="level-display">
              <span class="level-num">{{ instance.level }}</span>
              <span class="level-text">{{ t('armory.common.level') }}</span>
            </div>
            <div class="row">
              <span class="section-label">{{ t('armory.common.baseAtk') }}</span>
              <span class="value">{{ baseAtk }}</span>
            </div>
            <div class="row">
              <button
                class="ea-btn ea-btn--sm ea-btn--glass-rect"
                :disabled="!canTune"
                :style="instance.tuned ? { borderColor: color, color } : {}"
                @click="update({ tuned: !instance.tuned })"
              >
                {{ tunedLabel() }}
              </button>
            </div>
            <div class="row">
              <span class="section-label">{{ t('armory.common.potential') }}</span>
              <div class="diamonds">
                <button
                  v-for="p in 5"
                  :key="p"
                  class="diamond"
                  :class="{ active: instance.potential >= p }"
                  :style="instance.potential >= p ? { background: potentialColor } : {}"
                  @click="update({ potential: instance.potential === p ? p - 1 : p })"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="level-selector">
          <button
            v-for="lv in LEVELS"
            :key="lv"
            class="ea-btn ea-btn--sm ea-btn--glass-rect level-btn"
            :style="
              instance.level === lv
                ? { borderColor: color, color: '#fff', background: `${color}33` }
                : {}
            "
            @click="handleLevelChange(lv)"
          >
            Lv{{ lv }}
          </button>
        </div>

        <div class="section">
          <div class="section-title">{{ t('armory.common.skills') }}</div>
          <div v-for="sk in activeSkillKeys" :key="sk" class="skill-row">
            <div class="skill-info">
              <span class="skill-name">{{ getSkillName(sk) }}</span>
              <span class="skill-value">{{ getSkillValueSuffix(sk) }}</span>
            </div>
            <div class="skill-bar-area">
              <div class="skill-slots">
                <button
                  v-for="slot in ABSOLUTE_MAX"
                  :key="slot"
                  class="skill-slot"
                  :class="slotClass(sk, slot)"
                  :disabled="!slotClickable(sk, slot)"
                  @click="setSkillLevel(sk, slot)"
                >
                  <template v-if="slotClass(sk, slot) === 'slot-locked'">&times;</template>
                  <template v-else-if="slotClass(sk, slot) === 'slot-empty'">&nbsp;</template>
                  <template v-else>/</template>
                </button>
              </div>
              <span class="skill-counter"
                >{{ getSkillLevel(sk) }}/{{ getSkillBoundsForKey(sk).max }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="footer">
        <button
          class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--square ea-btn--hover-gold-fill"
          @click="maxOut"
        >
          {{ t('common.max') }}
        </button>
        <button class="ea-btn ea-btn--sm ea-btn--glass-rect" @click="emit('update:visible', false)">
          {{ t('common.close') }}
        </button>
      </div>
    </template>
  </el-dialog>
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
.portrait-frame {
  width: 120px;
  min-width: 120px;
  height: 120px;
  border: 2px solid #555;
  overflow: hidden;
  background: #1a1a1e;
}
.portrait {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.rarity-6-style.portrait-frame {
  border: 2px solid transparent;
  background:
    linear-gradient(#1a1a1e, #1a1a1e) padding-box,
    linear-gradient(135deg, #ffd700, #ff8c00, #ff4500) border-box;
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
  color: #f0f0f0;
}
.stars {
  font-size: 14px;
  letter-spacing: 1px;
}
.header-rarity-6.stars {
  background: linear-gradient(45deg, #ffd700, #ff8c00, #ff4500);
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
  border: 1px solid #555;
  color: #bbb;
  background: rgba(255, 255, 255, 0.04);
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
  color: #f0f0f0;
  line-height: 1;
}
.level-text {
  font-size: 11px;
  color: #888;
  letter-spacing: 2px;
  text-transform: uppercase;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.value {
  font-size: 16px;
  font-weight: 700;
  color: #f0f0f0;
}
.section-label {
  font-size: 11px;
  color: #888;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.diamonds {
  display: flex;
  gap: 8px;
}
.diamond {
  width: 16px;
  height: 16px;
  transform: rotate(45deg);
  border: 1.5px solid #555;
  background: transparent;
  cursor: pointer;
  padding: 0;
}
.diamond.active {
  border-color: transparent;
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
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 16px;
}
.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #888;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 14px;
}
.skill-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.skill-row:last-child {
  border-bottom: none;
}
.skill-info {
  flex: 1;
  min-width: 0;
}
.skill-name {
  font-size: 13px;
  font-weight: 600;
  color: #e0e0e0;
}
.skill-value {
  font-size: 12px;
  color: #aaa;
  margin-left: 8px;
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
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.7);
}
.skill-slot.slot-active {
  background: rgba(234, 179, 8, 0.25);
  color: #eab308;
  cursor: pointer;
}
.skill-slot.slot-empty {
  background: rgba(255, 255, 255, 0.04);
  color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
}
.skill-slot.slot-locked {
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.2);
}
.skill-counter {
  font-size: 13px;
  font-weight: 700;
  color: #ccc;
  min-width: 28px;
  text-align: right;
  font-family: 'Roboto Mono', monospace;
}
.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  width: 100%;
}
</style>
