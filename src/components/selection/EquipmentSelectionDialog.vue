<script setup>
import { computed, ref } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useTimelineStore } from '@/stores/timelineStore.js';
import { EQUIPMENT_LEVELS, getEquipmentLevelColor } from '@/utils/equipmentLevels';
import { EQUIPMENT_REFINE_MAX_TIER } from '@/stores/timeline/normalizers';
import { mergeEquipmentElementPairEffects } from '@/utils/equipmentEffectDisplay';
import { getGearPiece, getOperator } from '@/data';
import {
  getGameAttributeName,
  getGameSlotTypeName,
  getGearPieceGameName,
  getGearSetGameName,
} from '@/data/gameText';
import EquipmentSelectionTooltip from '@/components/selection/EquipmentSelectionTooltip.vue';

const store = useTimelineStore();
const { t, locale } = useI18n();

const visible = ref(false);
const targetTrackIndex = ref(null);
const slotKey = ref('armor');
const searchQuery = ref('');
const categoryFilter = ref('ALL');
const affixFilter = ref('ALL');
const levelFilter = ref('ALL');
const refineTier = ref(0);
const refineTiers = [0, 1, 2, 3];

const EQUIPMENT_AFFIX_FILTER_GROUPS = [
  {
    key: 'elementDamage',
    items: [
      { value: 'arts_dmg', accent: '#ef4444' },
      { value: 'cryo_electric_dmg_bonus', accent: '#ef4444' },
      { value: 'heat_nature_dmg_bonus', accent: '#ef4444' },
      { value: 'physical_dmg', accent: '#ef4444' },
    ],
  },
  {
    key: 'skillDamage',
    items: [
      { value: 'all_skill_dmg_bonus', accent: '#ef4444' },
      { value: 'attack_dmg_bonus', accent: '#fde68a' },
      { value: 'skill_dmg_bonus', accent: '#93c5fd' },
      { value: 'link_dmg_bonus', accent: '#facc15' },
      { value: 'ultimate_dmg_bonus', accent: '#38bdf8' },
    ],
  },
  {
    key: 'brokenDamage',
    items: [{ value: 'broken_dmg_bonus', accent: '#fb7185' }],
  },
  {
    key: 'ability',
    items: [
      { value: 'primary_ability', accent: '#a3e635' },
      { value: 'secondary_ability', accent: '#84cc16' },
    ],
  },
  {
    key: 'attack',
    items: [{ value: 'attack', accent: '#991b1b' }],
  },
  {
    key: 'crit',
    items: [{ value: 'crit_rate', accent: '#f43f5e' }],
  },
  {
    key: 'artsPower',
    items: [{ value: 'originium_arts_power', accent: '#a78bfa' }],
  },
  {
    key: 'ultimateCharge',
    items: [{ value: 'ult_charge_eff', accent: '#38bdf8' }],
  },
  {
    key: 'survival',
    items: [
      { value: 'hp', accent: '#4ade80' },
      { value: 'final_dmg_reduction', accent: '#4ade80' },
      { value: 'healing_effect', accent: '#4ade80' },
    ],
  },
];

const EQUIPMENT_PRIMARY_STAT_ICON_MAP = {
  primary_ability: '/icons/icon_battle_primary_attribute_all_up.webp',
  secondary_ability: '/icons/icon_battle_primary_attribute_all_up.webp',
  strength: '/icons/icon_attribute_str.webp',
  agility: '/icons/icon_attribute_agi.webp',
  intellect: '/icons/icon_attribute_wisd.webp',
  will: '/icons/icon_attribute_will.webp',
};

const EQUIPMENT_BONUS_STAT_ICON_MAP = {
  primary_ability: '/icons/icon_battle_primary_attribute_all_up.webp',
  secondary_ability: '/icons/icon_battle_primary_attribute_all_up.webp',
  strength: '/icons/icon_attribute_str.webp',
  agility: '/icons/icon_attribute_agi.webp',
  intellect: '/icons/icon_attribute_wisd.webp',
  will: '/icons/icon_attribute_will.webp',
  attack: '/icons/icon_battle_buff_atk_up.webp',
  hp: '/icons/icon_attribute_maxHp.webp',
  crit_rate: '/icons/icon_attribute_criticalRate.webp',
  crit_dmg: '/icons/icon_attribute_criticalDamageIncrease.webp',
  blaze_dmg: '/icons/icon_battle_fire_dmg_up.webp',
  emag_dmg: '/icons/icon_battle_pulse_dmg_up.webp',
  cold_dmg: '/icons/icon_battle_cryst_dmg_up.webp',
  nature_dmg: '/icons/icon_battle_natural_dmg_up.webp',
  physical_dmg: '/icons/icon_physical_damage_increase.webp',
  arts_dmg: '/icons/icon_battle_spell_up.webp',
  attack_dmg_bonus: '/icons/icon_normal_atk_efficiency.webp',
  skill_dmg_bonus: '/icons/icon_normal_skill_efficiency.webp',
  link_dmg_bonus: '/icons/icon_comboskill_cooldown_scalar.webp',
  ultimate_dmg_bonus: '/icons/icon_ultimate_skill_efficiency.webp',
  all_skill_dmg_bonus: '/icons/icon_battle_affix_enhance.webp',
  broken_dmg_bonus: '/icons/icon_attr_damage_to_broken_unit_increase.webp',
  healing_effect: '/icons/icon_heal_output_increase.webp',
  final_dmg_reduction: '/icons/icon_battle_affix_shelter.webp',
  originium_arts_power: '/icons/icon_originium_arts.webp',
  ult_charge_eff: '/icons/icon_ultimate_sp_gain_scalar.webp',
  link_cd_reduction: '/icons/icon_comboskill_cooldown_scalar.webp',
  susceptibility: '/icons/icon_battle_affix_vulnerable.webp',
  susceptibility_physical: '/icons/icon_battle_affix_physical_vulnerable.webp',
  susceptibility_heat: '/icons/icon_battle_affix_fire_vulnerable.webp',
  susceptibility_cryo: '/icons/icon_battle_affix_cryst_vulnerable.webp',
  susceptibility_electric: '/icons/icon_battle_affix_pulse_vulnerable.webp',
  susceptibility_nature: '/icons/icon_battle_affix_natural_vulnerable.webp',
};

function getEquipmentAffixIconSrc(modifierId) {
  return (
    EQUIPMENT_PRIMARY_STAT_ICON_MAP[modifierId] ||
    EQUIPMENT_BONUS_STAT_ICON_MAP[modifierId] ||
    '/icons/default_icon.webp'
  );
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function normalizeEquipmentStatArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

function normalizeEquipmentAttributeId(attribute) {
  if (attribute === 'main') return 'primary_ability';
  if (attribute === 'sub') return 'secondary_ability';
  if (['strength', 'agility', 'intellect', 'will'].includes(attribute)) return attribute;
  return '';
}

function isEquipmentAttributeStat(stat) {
  return stat?.modifier === 'attributeFlat' || stat?.modifier === 'attributePercent';
}

function getEquipmentDialogOperator(track) {
  if (!track?.id) return null;
  return getOperator(track.id) || null;
}

const CORE_ATTRIBUTES = new Set(['strength', 'agility', 'intellect', 'will']);

function getEquipmentAbilityMatch(eq, operator) {
  const piece = getGearPiece(eq?.canonicalId || eq?.canonicalGearPieceId || eq?.id);

  if (!piece || !operator) {
    return {
      matched: false,
      primaryMatched: false,
      secondaryMatched: false,
      attributeLineCount: 0,
      unmatchedAttributeLineCount: 0,
      type: '',
    };
  }

  const mainAttribute =
    operator?.mainAttribute || operator?.primaryAbility || operator?.primaryAttribute || '';

  const subAttribute =
    operator?.subAttribute || operator?.secondaryAbility || operator?.secondaryAttribute || '';

  let primaryMatched = false;
  let secondaryMatched = false;
  let attributeLineCount = 0;
  let unmatchedAttributeLineCount = 0;

  const skills = [piece.skill1, piece.skill2, piece.skill3].filter(Boolean);

  for (const skill of skills) {
    const effects = Array.isArray(skill?.effects) ? skill.effects : [];

    const visibleEffects = mergeEquipmentElementPairEffects(effects).filter(
      effect => effect?.kind === 'status',
    );

    for (const effect of visibleEffects) {
      const stat = effect?.stat;
      if (!isEquipmentAttributeStat(stat)) continue;

      const attrs = normalizeEquipmentStatArray(stat.attribute).filter(attr =>
        CORE_ATTRIBUTES.has(attr),
      );

      if (attrs.length === 0) continue;

      attributeLineCount += 1;

      const matchedPrimary = Boolean(mainAttribute && attrs.includes(mainAttribute));
      const matchedSecondary = Boolean(subAttribute && attrs.includes(subAttribute));

      if (matchedPrimary) primaryMatched = true;
      if (matchedSecondary) secondaryMatched = true;

      if (!matchedPrimary && !matchedSecondary) {
        unmatchedAttributeLineCount += 1;
      }
    }
  }

  const allAttributeLinesMatched = attributeLineCount > 0 && unmatchedAttributeLineCount === 0;

  const strongMatch =
    allAttributeLinesMatched &&
    ((primaryMatched && secondaryMatched) || (attributeLineCount === 1 && primaryMatched));

  return {
    matched: strongMatch,
    primaryMatched,
    secondaryMatched,
    attributeLineCount,
    unmatchedAttributeLineCount,
    type: strongMatch ? 'both' : '',
  };
}

function getEquipmentElementPairId(elements) {
  const set = new Set(elements);
  if (set.size !== 2) return '';
  if (set.has('heat') && set.has('nature')) return 'heat_nature_dmg_bonus';
  if (set.has('cryo') && set.has('electric')) return 'cryo_electric_dmg_bonus';
  return '';
}

function isEquipmentArtsDmgElements(elements) {
  const set = new Set(normalizeEquipmentStatArray(elements));
  return (
    set.size === 4 && set.has('heat') && set.has('cryo') && set.has('electric') && set.has('nature')
  );
}

function isEquipmentPairModifierId(modifierId) {
  return modifierId === 'heat_nature_dmg_bonus' || modifierId === 'cryo_electric_dmg_bonus';
}

function getEquipmentDmgBonusModifierIds(stat) {
  const elements = normalizeEquipmentStatArray(stat?.elements);
  if (elements.length > 0) {
    if (isEquipmentArtsDmgElements(elements)) {
      return ['arts_dmg'];
    }
    const pairId = getEquipmentElementPairId(elements);
    if (pairId) return [pairId];
    const mapped = elements
      .map(
        element =>
          ({
            physical: 'physical_dmg',
            heat: 'blaze_dmg',
            cryo: 'cold_dmg',
            electric: 'emag_dmg',
            nature: 'nature_dmg',
          })[element],
      )
      .filter(Boolean);
    return mapped.length > 0 ? mapped : ['all_skill_dmg_bonus'];
  }

  const skillTypes = normalizeEquipmentStatArray(stat?.skillTypes);
  if (skillTypes.length > 0) {
    if (skillTypes.length === 1) {
      return [
        {
          basicAttack: 'attack_dmg_bonus',
          battleSkill: 'skill_dmg_bonus',
          comboSkill: 'link_dmg_bonus',
          ultimate: 'ultimate_dmg_bonus',
        }[skillTypes[0]] || 'all_skill_dmg_bonus',
      ];
    }
    if (
      skillTypes.includes('battleSkill') &&
      skillTypes.includes('comboSkill') &&
      skillTypes.includes('ultimate')
    ) {
      return ['all_skill_dmg_bonus'];
    }
  }

  return ['all_skill_dmg_bonus'];
}

function getEquipmentEffectModifierIds(stat) {
  if (!stat?.modifier) return [];
  if (stat.modifier === 'attributeFlat' || stat.modifier === 'attributePercent') {
    return normalizeEquipmentStatArray(stat.attribute)
      .map(normalizeEquipmentAttributeId)
      .filter(Boolean);
  }
  if (stat.modifier === 'atkFlat' || stat.modifier === 'atkPercent') return ['attack'];
  if (stat.modifier === 'flatHp' || stat.modifier === 'hpPercent') return ['hp'];
  if (stat.modifier === 'critRate') return ['crit_rate'];
  if (stat.modifier === 'critDmg') return ['crit_dmg'];
  if (stat.modifier === 'artsIntensity') return ['originium_arts_power'];
  if (stat.modifier === 'ultimateGainEfficiency') return ['ult_charge_eff'];
  if (stat.modifier === 'heal') return ['healing_effect'];
  if (stat.modifier === 'protection') return ['final_dmg_reduction'];
  if (stat.modifier === 'dmgBonus') return getEquipmentDmgBonusModifierIds(stat);
  if (stat.modifier === 'susceptibility') {
    const elements = normalizeEquipmentStatArray(stat.elements);
    return elements.length > 0
      ? elements.map(element => `susceptibility_${element}`)
      : ['susceptibility'];
  }
  return [stat.modifier];
}

function trOrFallback(key, fallback) {
  const out = t(key);
  return out === key ? fallback : out;
}

function getEquipmentModifierLabel(modifierId) {
  return trOrFallback(
    `timelineGrid.equipmentDialog.affixFilters.${modifierId}`,
    trOrFallback(`stats.${modifierId}`, modifierId),
  );
}

function getEquipmentEffectLabel(stat, modifierId) {
  if (!stat?.modifier) return getEquipmentModifierLabel(modifierId);
  if (stat.modifier === 'attributeFlat' || stat.modifier === 'attributePercent') {
    const attr = normalizeEquipmentStatArray(stat.attribute)[0];
    const normalizedAttr = normalizeEquipmentAttributeId(attr);
    if (normalizedAttr === 'primary_ability' || normalizedAttr === 'secondary_ability') {
      return getEquipmentModifierLabel(normalizedAttr);
    }
    if (attr) return getGameAttributeName(attr, locale.value);
  }
  if (stat.modifier === 'dmgBonus') {
    return getEquipmentModifierLabel(modifierId);
  }

  if (stat.modifier === 'susceptibility') {
    const elements = normalizeEquipmentStatArray(stat.elements);
    if (elements.length === 1) {
      return trOrFallback(
        `game.stat.susceptibility:${elements[0]}`,
        trOrFallback('game.stat.susceptibility', '脆弱'),
      );
    }
    return trOrFallback('game.stat.susceptibility', '脆弱');
  }

  if (stat.modifier === 'artsIntensity') return getEquipmentModifierLabel('originium_arts_power');
  if (stat.modifier === 'ultimateGainEfficiency')
    return getEquipmentModifierLabel('ult_charge_eff');
  if (stat.modifier === 'heal') return getEquipmentModifierLabel('healing_effect');
  if (stat.modifier === 'protection') return getEquipmentModifierLabel('final_dmg_reduction');
  return getEquipmentModifierLabel(modifierId);
}

function equipmentValueNeedsPercent(stat) {
  return [
    'attributePercent',
    'atkPercent',
    'hpPercent',
    'critRate',
    'critDmg',
    'dmgBonus',
    'ultimateGainEfficiency',
    'susceptibility',
    'heal',
    'protection',
  ].includes(stat?.modifier);
}

function formatEquipmentNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value ?? '');
  if (Math.abs(num - Math.round(num)) < 0.0001) return String(Math.round(num));
  return num.toFixed(1).replace(/\.0$/, '');
}

function formatEquipmentEffectValue(effect) {
  const rawValues = Array.isArray(effect?.value) ? effect.value : [effect?.value];
  const values = rawValues.filter(value => value !== undefined && value !== null);
  if (values.length === 0) return '';
  const suffix = equipmentValueNeedsPercent(effect?.stat) ? '%' : '';
  return values.map(value => `+${formatEquipmentNumber(value)}${suffix}`).join(' / ');
}

function getEquipmentPieceAffixRows(eq) {
  const piece = getGearPiece(eq?.canonicalId || eq?.canonicalGearPieceId || eq?.id);
  if (!piece) return [];
  return [piece.skill1, piece.skill2, piece.skill3].filter(Boolean).flatMap((skill, slotIndex) => {
    const effects = Array.isArray(skill?.effects) ? skill.effects : [];
    return mergeEquipmentElementPairEffects(effects)
      .filter(effect => effect?.kind === 'status')
      .flatMap((effect, effectIndex) =>
        getEquipmentEffectModifierIds(effect.stat).map(modifierId => {
          const label = getEquipmentEffectLabel(effect.stat, modifierId);
          const valueText = formatEquipmentEffectValue(effect);
          return {
            key: `${eq?.id || 'eq'}-${slotIndex}-${effectIndex}-${modifierId}`,
            modifierId,
            label,
            valueText,
            src: isEquipmentPairModifierId(modifierId) ? '' : getEquipmentAffixIconSrc(modifierId),
            marker: isEquipmentPairModifierId(modifierId) ? 'hollow-dot' : 'image',
            title: valueText ? `${label} ${valueText}` : label,
          };
        }),
      );
  });
}

function getEquipmentAffixRows(eq) {
  return getEquipmentPieceAffixRows(eq);
}

function getEquipmentAffixFilterLabel(filterId) {
  return trOrFallback(
    `timelineGrid.equipmentDialog.affixFilters.${filterId}`,
    getEquipmentModifierLabel(filterId),
  );
}

function getEquipmentAffixModifierIds(equipment) {
  return getEquipmentAffixRows(equipment)
    .map(row => row.modifierId)
    .filter(Boolean);
}

function equipmentMatchesAffixFilter(equipment, filterId) {
  if (!filterId || filterId === 'ALL') return true;
  return getEquipmentAffixModifierIds(equipment).includes(filterId);
}

function getEquipmentForTrack(track, targetSlotKey) {
  if (!track) return null;
  let equipmentId = null;
  if (targetSlotKey === 'armor') equipmentId = track.equipArmorId;
  else if (targetSlotKey === 'gloves') equipmentId = track.equipGlovesId;
  else if (targetSlotKey === 'accessory1') equipmentId = track.equipAccessory1Id;
  else if (targetSlotKey === 'accessory2') equipmentId = track.equipAccessory2Id;
  return store.getEquipmentById(equipmentId);
}

function getEquipmentTierForTrack(track, targetSlotKey) {
  if (!track) return 0;
  if (targetSlotKey === 'armor') return Number(track.equipArmorRefineTier) || 0;
  if (targetSlotKey === 'gloves') return Number(track.equipGlovesRefineTier) || 0;
  if (targetSlotKey === 'accessory1') return Number(track.equipAccessory1RefineTier) || 0;
  if (targetSlotKey === 'accessory2') return Number(track.equipAccessory2RefineTier) || 0;
  return 0;
}

const currentTrack = computed(() =>
  targetTrackIndex.value === null ? null : store.tracks[targetTrackIndex.value] || null,
);

const currentEquipment = computed(() => getEquipmentForTrack(currentTrack.value, slotKey.value));

const currentEquipmentId = computed(() => currentEquipment.value?.id || '');

const slotType = computed(() =>
  slotKey.value === 'accessory1' || slotKey.value === 'accessory2' ? 'accessory' : slotKey.value,
);

const slotLabel = computed(() => {
  locale.value;
  if (slotKey.value === 'armor') return t('timelineGrid.equipmentSlot.armor');
  if (slotKey.value === 'gloves') return t('timelineGrid.equipmentSlot.gloves');
  if (slotKey.value === 'accessory1') return t('timelineGrid.equipmentSlot.accessory1');
  if (slotKey.value === 'accessory2') return t('timelineGrid.equipmentSlot.accessory2');
  return t('timelineGrid.equipmentSlot.equipment');
});

const categories = computed(() => {
  locale.value;
  return (store.equipmentCategories || []).map(value => ({
    value,
    label:
      typeof store.getSetBonusDisplayName === 'function'
        ? store.getSetBonusDisplayName(value)
        : getGearSetGameName(value, locale.value),
  }));
});

const affixFilterGroups = computed(() => {
  locale.value;
  return EQUIPMENT_AFFIX_FILTER_GROUPS.map(group => ({
    ...group,
    items: group.items.map(item => ({
      ...item,
      label: getEquipmentAffixFilterLabel(item.value),
    })),
  }));
});

const equipmentItems = computed(() => {
  locale.value;
  return (store.equipmentDatabase || []).map(equipment => ({
    id: equipment.id,
    canonicalId: equipment.canonicalGearPieceId || equipment.id,
    name: getGearPieceGameName(equipment.canonicalGearPieceId || equipment.id, locale.value),
    icon: equipment.icon || '/icons/default_icon.webp',
    level: Number(equipment.level) || 0,
    slot: equipment.slot || '',
    category: equipment.category || '',
    searchTerms: [
      getGearPieceGameName(equipment.canonicalGearPieceId || equipment.id, locale.value),
      equipment.id,
      equipment.canonicalGearPieceId,
      equipment.category,
      equipment.category ? getGearSetGameName(equipment.category, locale.value) : '',
      getGameSlotTypeName(equipment.slot, locale.value),
    ]
      .map(normalizeSearchText)
      .filter(Boolean),
  }));
});

const groups = computed(() => {
  const track = currentTrack.value;
  if (!track?.id) return [];

  const operator = getEquipmentDialogOperator(track);
  let equipmentList = equipmentItems.value.filter(equipment => equipment.slot === slotType.value);

  if (categoryFilter.value !== 'ALL') {
    if (categoryFilter.value === '__UNCAT__') {
      const knownCategories = new Set(store.equipmentCategories || []);
      equipmentList = equipmentList.filter(
        equipment => !equipment.category || !knownCategories.has(equipment.category),
      );
    } else {
      equipmentList = equipmentList.filter(
        equipment => equipment.category === categoryFilter.value,
      );
    }
  }

  if (affixFilter.value !== 'ALL') {
    equipmentList = equipmentList.filter(equipment =>
      equipmentMatchesAffixFilter(equipment, affixFilter.value),
    );
  }

  if (levelFilter.value !== 'ALL') {
    const targetLevel = Number(levelFilter.value);
    equipmentList = equipmentList.filter(equipment => Number(equipment.level) === targetLevel);
  }

  if (searchQuery.value) {
    const query = normalizeSearchText(searchQuery.value);
    equipmentList = equipmentList.filter(equipment =>
      equipment.searchTerms.some(term => term.includes(query)),
    );
  }

  const byLevel = new Map();
  for (const equipment of equipmentList) {
    const level = Number(equipment.level) || 0;
    if (!byLevel.has(level)) byLevel.set(level, []);
    byLevel.get(level).push({
      ...equipment,
      abilityMatch: getEquipmentAbilityMatch(equipment, operator),
      previewRows: getEquipmentAffixRows(equipment),
    });
  }

  return [...byLevel.entries()]
    .sort(([a], [b]) => b - a)
    .map(([level, list]) => ({
      level,
      list: list.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    }));
});

function open(trackIndex, targetSlotKey) {
  const track = store.tracks[trackIndex];
  if (!track?.id) return;

  store.selectTrack(trackIndex);
  targetTrackIndex.value = trackIndex;
  slotKey.value = targetSlotKey;
  searchQuery.value = '';
  categoryFilter.value = 'ALL';
  affixFilter.value = 'ALL';
  levelFilter.value = 'ALL';

  const equipped = getEquipmentForTrack(track, targetSlotKey);
  refineTier.value = equipped
    ? getEquipmentTierForTrack(track, targetSlotKey)
    : EQUIPMENT_REFINE_MAX_TIER;
  visible.value = true;
}

function select(equipmentId) {
  const track = currentTrack.value;
  if (track?.id) {
    store.updateTrackEquipment(track.id, slotKey.value, equipmentId);
    store.updateTrackEquipmentTier(track.id, slotKey.value, refineTier.value);
  }
  close();
}

function remove() {
  const track = currentTrack.value;
  if (track?.id) store.updateTrackEquipment(track.id, slotKey.value, null);
  refineTier.value = 0;
  close();
}

function setRefineTier(tier) {
  const nextTier = Math.max(0, Math.min(3, Number(tier) || 0));
  refineTier.value = nextTier;
  const track = currentTrack.value;
  if (track?.id && currentEquipment.value) {
    store.updateTrackEquipmentTier(track.id, slotKey.value, nextTier);
  }
}

function close() {
  visible.value = false;
}

function onClosed() {
  targetTrackIndex.value = null;
}

defineExpose({ open, isOpen: () => visible.value });
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="t('timelineGrid.equipmentDialog.title', { slot: slotLabel })"
    width="600px"
    align-center
    class="char-selector-dialog"
    append-to-body
    @closed="onClosed"
  >
    <div class="selector-header">
      <div class="header-left-group">
        <el-input
          v-model="searchQuery"
          :placeholder="t('timelineGrid.equipmentDialog.searchPlaceholder')"
          :prefix-icon="Search"
          clearable
          style="width: 180px"
        />
        <button
          class="ea-btn ea-btn--glass-cut ea-btn--glass-cut-danger ea-btn--cut-left ea-btn--lift"
          :disabled="!currentEquipmentId"
          :title="t('timelineGrid.equipmentDialog.unequipTooltip')"
          @click="remove"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
          >
            <path d="M3 6h18" />
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            />
          </svg>
          {{ t('common.unequip') }}
        </button>
        <div class="equipment-tier-picker">
          <span class="tier-label">{{ t('timelineGrid.equipmentDialog.refine') }}</span>
          <div class="equipment-refine-buttons">
            <button
              v-for="tier in refineTiers"
              :key="`tier_${tier}`"
              type="button"
              class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-gold equipment-refine-btn"
              :class="{ 'is-active': refineTier === tier }"
              @click="setRefineTier(tier)"
            >
              {{ tier === 0 ? t('timelineGrid.equipmentDialog.refineBase') : tier }}
            </button>
          </div>
        </div>
      </div>
      <div class="element-filters">
        <button
          class="ea-btn ea-btn--glass-cut equipment-filter-chip"
          :class="{ 'is-active': categoryFilter === 'ALL' }"
          :style="{ '--ea-btn-accent': '#2dd4bf' }"
          @click="categoryFilter = 'ALL'"
        >
          {{ t('timelineGrid.equipmentDialog.allCategories') }}
        </button>
        <button
          class="ea-btn ea-btn--glass-cut equipment-filter-chip"
          :class="{ 'is-active': categoryFilter === '__UNCAT__' }"
          :style="{ '--ea-btn-accent': '#888' }"
          @click="categoryFilter = '__UNCAT__'"
        >
          {{ t('timelineGrid.equipmentDialog.uncategorized') }}
        </button>
        <button
          v-for="category in categories"
          :key="`eqcat_${category.value}`"
          class="ea-btn ea-btn--glass-cut"
          :class="{ 'is-active': categoryFilter === category.value }"
          :style="{ '--ea-btn-accent': '#2dd4bf' }"
          @click="categoryFilter = category.value"
        >
          {{ category.label }}
        </button>
      </div>
      <div class="equipment-affix-filter-section">
        <div class="equipment-affix-filter-strip">
          <button
            class="ea-btn ea-btn--glass-cut equipment-filter-chip"
            :class="{ 'is-active': affixFilter === 'ALL' }"
            :style="{ '--ea-btn-accent': '#2dd4bf' }"
            @click="affixFilter = 'ALL'"
          >
            {{ t('timelineGrid.equipmentDialog.allAffixes') }}
          </button>
          <template
            v-for="(group, groupIndex) in affixFilterGroups"
            :key="`eq_affix_group_${group.key}`"
          >
            <span v-if="groupIndex > 0" class="equipment-affix-filter-divider" aria-hidden="true" />
            <button
              v-for="option in group.items"
              :key="`eq_affix_filter_${option.value}`"
              class="ea-btn ea-btn--glass-cut equipment-filter-chip"
              :class="{ 'is-active': affixFilter === option.value }"
              :style="{ '--ea-btn-accent': option.accent }"
              @click="affixFilter = option.value"
            >
              {{ option.label }}
            </button>
          </template>
        </div>
      </div>
      <div class="element-filters">
        <button
          class="ea-btn ea-btn--glass-cut equipment-filter-chip"
          :class="{ 'is-active': levelFilter === 'ALL' }"
          :style="{ '--ea-btn-accent': '#2dd4bf' }"
          @click="levelFilter = 'ALL'"
        >
          {{ t('timelineGrid.equipmentDialog.allLevels') }}
        </button>
        <button
          v-for="level in EQUIPMENT_LEVELS"
          :key="`eqlv_${level}`"
          class="ea-btn ea-btn--glass-cut equipment-filter-chip"
          :class="{ 'is-active': levelFilter === level }"
          :style="{ '--ea-btn-accent': getEquipmentLevelColor(level) }"
          @click="levelFilter = level"
        >
          Lv{{ level }}
        </button>
      </div>
    </div>
    <div class="roster-scroll-container">
      <template v-for="group in groups" :key="group.level">
        <div class="rarity-header" :style="{ color: getEquipmentLevelColor(group.level) }">
          <span class="rarity-label">Lv{{ group.level }}</span>
          <div class="rarity-line"></div>
        </div>
        <div class="roster-grid">
          <div
            v-for="equipment in group.list"
            :key="equipment.id"
            class="roster-card equipment-roster-card"
            :class="{ 'is-ability-match-both': equipment.abilityMatch?.type === 'both' }"
            @click="select(equipment.id)"
          >
            <el-tooltip
              placement="top-start"
              effect="dark"
              :show-after="160"
              popper-class="equipment-selection-preview-popper"
            >
              <template #content>
                <EquipmentSelectionTooltip
                  :equipment="equipment"
                  :affix-rows="equipment.previewRows"
                />
              </template>
              <div class="selection-card-tooltip-target">
                <div
                  class="card-avatar-wrapper"
                  :class="{ 'is-ability-match-both': equipment.abilityMatch?.type === 'both' }"
                  :style="{ borderColor: getEquipmentLevelColor(equipment.level) }"
                >
                  <div class="eq-affix-icon-stack">
                    <div
                      v-for="icon in equipment.previewRows"
                      :key="`eq_affix_${equipment.id}_${icon.key || icon.modifierId}`"
                      class="eq-affix-icon-cell"
                      :class="{
                        'has-img': !!icon.src,
                        'has-hollow-marker': icon.marker === 'hollow-dot',
                      }"
                      :title="icon.title"
                    >
                      <span class="eq-affix-icon-dot" aria-hidden="true"></span>
                      <svg
                        v-if="icon.marker === 'hollow-dot'"
                        class="eq-affix-icon-hollow"
                        viewBox="0 0 12 12"
                        aria-hidden="true"
                      >
                        <circle
                          cx="6"
                          cy="6"
                          r="3"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.4"
                        />
                      </svg>
                      <img
                        v-else-if="icon.src"
                        class="eq-affix-icon-img"
                        :src="icon.src"
                        loading="lazy"
                        @load="
                          event =>
                            event.target
                              .closest('.eq-affix-icon-cell')
                              ?.classList.remove('img-failed')
                        "
                        @error="
                          event =>
                            event.target.closest('.eq-affix-icon-cell')?.classList.add('img-failed')
                        "
                      />
                    </div>
                  </div>
                  <img :src="equipment.icon || '/icons/default_icon.webp'" loading="lazy" />
                </div>
                <div class="card-name">{{ equipment.name }}</div>
              </div>
            </el-tooltip>
            <div
              v-if="
                currentEquipmentId === equipment.id || currentEquipmentId === equipment.canonicalId
              "
              class="in-team-tag weapon-equipped"
            >
              {{ t('timelineGrid.weaponDialog.equipped') }}
            </div>
          </div>
        </div>
      </template>
      <div v-if="groups.length === 0" class="empty-roster">
        {{ t('timelineGrid.equipmentDialog.empty') }}
      </div>
    </div>
  </el-dialog>
</template>

<style src="./selectionDialog.css"></style>
