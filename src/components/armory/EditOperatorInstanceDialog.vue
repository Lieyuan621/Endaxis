<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getOperator, getOperatorTalentGroups } from '@/data'
import {
  getGameAttributeName,
  getGameClassName,
  getGameElementName,
  getGameWeaponTypeName,
  getOperatorPotentialDescription,
  getOperatorPotentialName,
  getOperatorTalentDescription,
  getOperatorTalentName,
  getOperatorUiLabel,
} from '@/data/gameText'
import { getOperatorSkillMax, skillLevelLabel } from '@/utils/operatorBounds'
import { getPromotionCount } from '@/data/stats/baseValues'
import { useOperatorStore } from '@/stores/operatorStore'
import { elementColors } from '@/utils/theme'

const LEVELS = [1, 20, 40, 60, 80, 90]
const SKILL_ORDER = ['basicAttack', 'battleSkill', 'comboSkill', 'ultimate']
const WEAPON_ATTACK_ICON = {
  sword: '/icons/icon_attack_sword.webp',
  greatsword: '/icons/icon_attack_claym.webp',
  polearm: '/icons/icon_attack_lance.webp',
  handcannon: '/icons/icon_attack_pistol.webp',
  'arts-unit': '/icons/icon_attack_funnel.webp',
}

const ATTR_ICON = {
  strength: '/icons/icon_attribute_str.webp',
  agility: '/icons/icon_attribute_agi.webp',
  intellect: '/icons/icon_attribute_wisd.webp',
  will: '/icons/icon_attribute_will.webp',
}

const props = defineProps({
  instance: { type: Object, default: null },
  visible: { type: Boolean, default: false },
  displayName: { type: String, default: '' },
})

const emit = defineEmits(['update:visible'])

const operatorStore = useOperatorStore()
const { t, locale } = useI18n()

const op = computed(() => (props.instance ? getOperator(props.instance.operatorSlug) : null))
const color = computed(() => (op.value ? getRarityBaseColor(Number(op.value.rarity) || 0) : '#888'))
const potentialColor = '#FF4500'
const elColor = computed(() => (op.value ? elementColors[op.value.element] : '#888') ?? '#888')
const skillMax = computed(() =>
  props.instance ? getOperatorSkillMax(props.instance.level, props.instance.promoted) : 1,
)
const talentGroups = computed(() =>
  props.instance ? getOperatorTalentGroups(props.instance.operatorSlug) : [],
)
const canPromote = computed(() =>
  props.instance ? [20, 40, 60, 80].includes(props.instance.level) : false,
)
const maxTrust = computed(() =>
  props.instance ? getPromotionCount(props.instance.level, props.instance.promoted) : 0,
)

function getRarityBaseColor(rarity) {
  if (rarity === 6) return '#FFD700'
  if (rarity === 5) return '#ffc400'
  if (rarity === 4) return '#d8b4fe'
  return '#888'
}

function update(updates) {
  if (props.instance) operatorStore.updateOperator(props.instance.id, updates)
}

function maxOut() {
  if (!props.instance || !op.value) return
  const maxSkills = {}
  for (const key of Object.keys(op.value.combatSkills || {})) maxSkills[key] = 12
  const maxTalents = {}
  for (let i = 0; i < talentGroups.value.length; i += 1) {
    maxTalents[String(i)] = talentGroups.value[i].levels
  }
  const updates = {
    level: 90,
    promoted: true,
    skillLevels: maxSkills,
    talentStates: maxTalents,
    trustLevel: 4,
  }
  if (op.value.defaultPotential != null) updates.potential = op.value.defaultPotential
  else if (op.value.rarity <= 5) updates.potential = 5
  update(updates)
}

function getSkillIcon(key) {
  if (key === 'basicAttack') return WEAPON_ATTACK_ICON[op.value?.weapon] ?? '/icons/default_icon.webp'
  const slug = props.instance?.operatorSlug
  const file = key === 'battleSkill' ? 'battle.webp' : key === 'comboSkill' ? 'combo.webp' : 'ultimate.webp'
  return slug && file ? `/operators/${slug}/${file}` : '/icons/default_icon.webp'
}

function getSkillName(key) {
  return key === 'basicAttack'
    ? t('skillType.attack')
    : key === 'battleSkill'
      ? t('skillType.skill')
      : key === 'comboSkill'
        ? t('skillType.link')
        : t('skillType.ultimate')
}

function getTalentIcon(groupIdx) {
  const slug = props.instance?.operatorSlug
  return slug ? `/operators/${slug}/talent ${groupIdx + 1}.png` : '/icons/default_icon.webp'
}

function talentFlatIndex(groupIdx) {
  return talentGroups.value.slice(0, groupIdx).reduce((sum, group) => sum + (group.levels || 0), 0)
}

function getTalentName(groupIdx) {
  const slug = props.instance?.operatorSlug
  if (!slug) return t('armory.operator.talent', { index: groupIdx + 1 })
  return getOperatorTalentName(slug, talentFlatIndex(groupIdx), 0, locale.value)
}

function getTalentDescription(groupIdx, level) {
  const slug = props.instance?.operatorSlug
  if (!slug) return ''
  return getOperatorTalentDescription(slug, talentFlatIndex(groupIdx), level - 1, locale.value) || ''
}

function getPotentialTooltip(level) {
  const slug = props.instance?.operatorSlug
  if (!slug) return ''
  const idx = level - 1
  const name = getOperatorPotentialName(slug, idx, locale.value)
  const description = getOperatorPotentialDescription(slug, idx, locale.value)
  return description ? `${name} - ${description}` : name
}

function incrementSkill(key) {
  if (!props.instance) return
  const current = props.instance.skillLevels[key] ?? 1
  if (current < skillMax.value) update({ skillLevels: { [key]: current + 1 } })
}

function decrementSkill(key) {
  if (!props.instance) return
  const current = props.instance.skillLevels[key] ?? 1
  if (current > 1) update({ skillLevels: { [key]: current - 1 } })
}

function setTrustLevel(level) {
  if (!props.instance) return
  const current = props.instance.trustLevel ?? 0
  update({ trustLevel: current === level ? level - 1 : level })
}

function setTalentState(groupIdx, level) {
  if (!props.instance) return
  const current = props.instance.talentStates[String(groupIdx)] ?? 0
  update({ talentStates: { [String(groupIdx)]: current === level ? level - 1 : level } })
}

function trustLevelBonus(level) {
  return [10, 15, 15, 20][level - 1] ?? 0
}

function promotedLabel() {
  if (!props.instance) return ''
  if (canPromote.value) return getOperatorUiLabel(props.instance.promoted ? 'promoted' : 'promote', locale.value)
  if (props.instance.level === 90) return getOperatorUiLabel('fullyPromoted', locale.value)
  return getOperatorUiLabel('promotionUnavailable', locale.value)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="760px"
    append-to-body
    class="armory-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <template v-if="instance && op">
      <div class="layout">
        <div class="header">
          <div
            class="portrait-frame"
            :class="`rarity-${op.rarity}-style`"
            :style="op.rarity === 6 ? {} : { borderColor: color }"
          >
            <img :src="`/operators/${instance.operatorSlug}/avatar.webp`" class="portrait" />
          </div>
          <div class="header-info">
            <div class="name-row">
              <span class="name">{{ displayName || instance.operatorSlug }}</span>
              <span class="stars" :class="`header-rarity-${op.rarity}`" :style="{ color }">{{ '★'.repeat(op.rarity) }}</span>
            </div>
            <div class="tags">
              <span class="tag" :style="{ color: elColor, borderColor: elColor }">{{ getGameElementName(op.element, locale) }}</span>
              <span class="tag">{{ getGameClassName(op.class, locale) }}</span>
              <span class="tag">{{ getGameWeaponTypeName(op.weapon, locale) }}</span>
            </div>
            <div class="level-display">
              <span class="level-num">{{ instance.level }}</span>
              <span class="level-text">{{ t('armory.common.level') }}</span>
            </div>
            <div class="row">
              <button
                class="ea-btn ea-btn--sm ea-btn--glass-rect"
                :disabled="!canPromote"
                :style="instance.promoted ? { borderColor: color, color } : {}"
                @click="update({ promoted: !instance.promoted })"
              >
                {{ promotedLabel() }}
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
                  :title="getPotentialTooltip(p)"
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
            :style="instance.level === lv ? { borderColor: color, color: '#fff', background: `${color}33` } : {}"
            @click="update({ level: lv })"
          >
            Lv{{ lv }}
          </button>
        </div>

        <div class="section">
          <div class="section-title">{{ t('armory.common.skills') }}</div>
          <div class="skills-row">
            <div v-for="key in SKILL_ORDER" :key="key" class="skill-card">
              <div class="skill-icon-frame" :style="{ borderColor: elColor }">
                <img :src="getSkillIcon(key)" class="skill-icon" />
              </div>
              <div class="skill-name">{{ getSkillName(key) }}</div>
              <div class="skill-controls">
                <button class="ea-btn ea-btn--sm ea-btn--glass-rect" :disabled="(instance.skillLevels[key] ?? 1) <= 1" @click="decrementSkill(key)">-</button>
                <span class="skill-rank">{{ skillLevelLabel(instance.skillLevels[key] ?? 1) }}</span>
                <button class="ea-btn ea-btn--sm ea-btn--glass-rect" :disabled="(instance.skillLevels[key] ?? 1) >= skillMax" @click="incrementSkill(key)">+</button>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">{{ t('armory.common.talents') }}</div>
          <div class="talent-row">
            <div class="talent-info">
              <span class="talent-name">{{ t('armory.common.trust') }}</span>
              <span class="talent-sub">{{ getGameAttributeName(op.mainAttribute, locale) }}</span>
            </div>
            <div class="talent-nodes">
              <template v-for="lvl in 4" :key="lvl">
                <div v-if="lvl > 1" class="talent-chain" :class="{ active: (instance.trustLevel ?? 0) >= lvl }" />
                <button
                  class="talent-node"
                  :class="{ active: (instance.trustLevel ?? 0) >= lvl, disabled: lvl > maxTrust }"
                  :style="(instance.trustLevel ?? 0) >= lvl ? { borderColor: elColor } : {}"
                  :disabled="lvl > maxTrust"
                  :title="`+${trustLevelBonus(lvl)} ${getGameAttributeName(op.mainAttribute, locale)}`"
                  @click="setTrustLevel(lvl)"
                >
                  <img :src="ATTR_ICON[op.mainAttribute] ?? '/icons/default_icon.webp'" class="talent-icon" />
                </button>
              </template>
            </div>
          </div>
          <div v-for="(group, groupIdx) in talentGroups" :key="groupIdx" class="talent-row">
            <div class="talent-info">
              <span class="talent-name" :title="getTalentDescription(groupIdx, 1)">{{ getTalentName(groupIdx) }}</span>
            </div>
            <div class="talent-nodes">
              <template v-for="lvl in group.levels" :key="lvl">
                <div v-if="lvl > 1" class="talent-chain" :class="{ active: (instance.talentStates[String(groupIdx)] ?? 0) >= lvl }" />
                <button
                  class="talent-node"
                  :class="{ active: (instance.talentStates[String(groupIdx)] ?? 0) >= lvl }"
                  :style="(instance.talentStates[String(groupIdx)] ?? 0) >= lvl ? { borderColor: elColor } : {}"
                  :title="getTalentDescription(groupIdx, lvl)"
                  @click="setTalentState(groupIdx, lvl)"
                >
                  <img :src="getTalentIcon(groupIdx)" class="talent-icon" />
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="footer">
        <button class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--square ea-btn--hover-gold-fill" @click="maxOut">{{ t('common.max') }}</button>
        <button class="ea-btn ea-btn--sm ea-btn--glass-rect" @click="emit('update:visible', false)">{{ t('common.close') }}</button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.layout { display: flex; flex-direction: column; gap: 20px; }
.header { display: flex; gap: 20px; align-items: flex-start; }
.portrait-frame { width: 160px; min-width: 160px; height: 160px; border-radius: 8px; border: 2px solid #555; overflow: hidden; background: #1a1a1e; }
.portrait { width: 100%; height: 100%; object-fit: cover; object-position: top center; }
.rarity-6-style.portrait-frame {
  border: 2px solid transparent;
  background:
    linear-gradient(#1a1a1e, #1a1a1e) padding-box,
    linear-gradient(135deg, #FFD700, #FF8C00, #FF4500) border-box;
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.2);
}
.header-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.name-row { display: flex; align-items: baseline; gap: 10px; }
.name { font-size: 22px; font-weight: 700; color: #f0f0f0; }
.stars { font-size: 14px; letter-spacing: 1px; }
.header-rarity-6.stars {
  background: linear-gradient(45deg, #FFD700, #FF8C00, #FF4500);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent !important;
}
.tags { display: flex; gap: 6px; flex-wrap: wrap; }
.tag { display: inline-flex; align-items: center; padding: 2px 10px; font-size: 11px; border: 1px solid #555; color: #bbb; background: rgba(255,255,255,0.04); }
.level-display { display: flex; align-items: baseline; gap: 6px; margin-top: 4px; }
.level-num { font-size: 28px; font-weight: 700; color: #f0f0f0; line-height: 1; }
.level-text { font-size: 11px; color: #888; letter-spacing: 2px; text-transform: uppercase; }
.row { display: flex; align-items: center; gap: 10px; }
.section-label { font-size: 11px; color: #888; letter-spacing: 1px; text-transform: uppercase; }
.diamonds { display: flex; gap: 8px; }
.diamond { width: 16px; height: 16px; transform: rotate(45deg); border: 1.5px solid #555; background: transparent; cursor: pointer; padding: 0; }
.diamond.active { border-color: transparent; }
.level-selector { display: flex; gap: 6px; }
.level-btn { flex: 1; justify-content: center; }
.section { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 16px; }
.section-title { font-size: 11px; font-weight: 700; color: #888; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px; }
.skills-row { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
.skill-card { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 120px; }
.skill-icon-frame { width: 64px; height: 64px; border-radius: 50%; border: 2px solid #555; background: #222228; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.skill-icon { width: 48px; height: 48px; object-fit: contain; }
.skill-name { font-size: 12px; color: #ccc; text-align: center; min-height: 2.6em; display: flex; align-items: center; }
.skill-controls { display: flex; align-items: center; gap: 6px; }
.skill-rank { font-size: 13px; font-weight: 700; color: #f0f0f0; min-width: 28px; text-align: center; font-family: 'Roboto Mono', monospace; }
.talent-row { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
.talent-row:last-child { border-bottom: none; }
.talent-info { display: flex; flex-direction: column; min-width: 0; }
.talent-name { font-size: 13px; font-weight: 600; color: #e0e0e0; }
.talent-sub { font-size: 11px; color: #888; }
.talent-nodes { display: flex; align-items: center; margin-left: auto; flex-shrink: 0; }
.talent-chain { width: 24px; height: 2px; background: #444; }
.talent-chain.active { background: #777; }
.talent-node { width: 40px; height: 40px; border-radius: 50%; border: 2px solid #555; background: #2a2a2e; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.talent-node:not(.active) { opacity: 0.35; filter: grayscale(1); }
.talent-node.disabled { opacity: 0.2; cursor: not-allowed; }
.talent-icon { width: 28px; height: 28px; object-fit: contain; }
.footer { display: flex; justify-content: flex-end; gap: 8px; width: 100%; }
</style>