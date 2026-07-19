<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useTimelineStore } from '@/stores/timelineStore.js';
import { formatSimLogEntry } from '@/simulation/formatSimLogEntry.ts';
import { useI18n } from 'vue-i18n';
import { formatTimeWithFrames } from '@/utils/time';
import { translateEffectName } from '@/editor/hits/statusOptions';

const store = useTimelineStore();
const { t, te } = useI18n({ useScope: 'global' });

const displayLog = ref([]);
const lastRefreshedRevision = ref(0);
const isDirty = ref(false);
const hasInitializedTypes = ref(false);
const groupRefs = ref({});
const openActionId = ref(null);

const keyword = ref('');
const limit = ref('all');
const selectedTypes = ref(new Set());

function formatSignedNumber(value) {
  const num = Number(value) || 0;
  if (num > 0) return `+${num}`;
  return `${num}`;
}

function formatDamageNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

function getDamageValue(entry) {
  return Number(entry?.payload?.hitData?._expectedDamage ?? entry?.payload?.damage ?? 0) || 0;
}

function getDamageBreakdown(entry) {
  return entry?.payload?.hitData?._damageBreakdown || null;
}

function getDamageElement(entry) {
  const hitData = entry?.payload?.hitData;
  const breakdown = getDamageBreakdown(entry);
  return breakdown?.element || hitData?.element || '';
}

function getReactionLabel(entry) {
  const hitData = entry?.payload?.hitData;
  const breakdown = getDamageBreakdown(entry);
  return breakdown?.reactionType || hitData?._reactionMeta?.reactionType || '';
}

function getConsumedStacksLabel(entry) {
  const hitData = entry?.payload?.hitData;
  const consumed = hitData?.consumedStacks || hitData?._reactionMeta?.consumedStackSources;
  if (!consumed || typeof consumed !== 'object') return '';
  return Object.entries(consumed)
    .filter(([, value]) => Number(value) !== 0)
    .map(([key, value]) => `${key}:${formatDamageNumber(value)}`)
    .join(', ');
}

function getLmdiLabel(entry) {
  const hitData = entry?.payload?.hitData;
  if (!hitData || hitData._lmdiSelf == null) return '';
  const external =
    hitData._lmdiExternal && typeof hitData._lmdiExternal === 'object'
      ? Object.entries(hitData._lmdiExternal)
          .filter(([, value]) => Number(value) !== 0)
          .map(([key, value]) => `${key}:${formatDamageNumber(value)}`)
          .join(', ')
      : '';
  const self = `self:${formatDamageNumber(hitData._lmdiSelf)}`;
  return external ? `${self} ext:${external}` : self;
}

function getGroupDamageTotal(group) {
  return group.damage.reduce((sum, entry) => sum + getDamageValue(entry), 0);
}

function getActionColor(actionId) {
  const info = store.getActionById?.(actionId);
  const node = info?.node;
  if (node?.customColor) return node.customColor;
  if (node?.type === 'comboSkill') return store.getColor('link');
  if (node?.type === 'finisher') return store.getColor('execution');
  if (node?.type === 'basicAttack') return store.getColor('attack');
  if (node?.type === 'dive') return store.getColor('dodge');
  if (node?.element) return store.getColor(node.element);
  if (info?.trackId)
    return store.getCharacterElementColor?.(info.trackId) || store.getColor('default');
  return store.getColor('default');
}

function getEntryActionId(entry) {
  if (!entry || !entry.type) return null;
  switch (entry.type) {
    case 'ACTION_START':
    case 'ACTION_END':
      return entry.payload?.actionId || null;
    case 'DAMAGE_HIT':
      return entry.payload?.actionId || null;
    case 'CD_REDUCTION':
      return entry.payload?.actionId || null;
    case 'STAGGER':
      return entry.payload?.actionId || null;
    case 'SP_CHANGE':
      return entry.payload?.sourceId || null;
    case 'ULT_ENERGY_CHANGE':
    case 'ULTIMATE_CHARGE_CHANGE':
      return entry.payload?.sourceId || null;
    case 'EFFECT_START':
    case 'REACTION_OCCURRED':
      return entry.payload?.actionId || null;
    default:
      return null;
  }
}

function getTrackDisplayName(trackId) {
  if (!trackId) return '';
  const found = store.characterRoster?.find(c => c?.id === trackId);
  return found?.name || trackId;
}

function getActionDisplayName(actionId) {
  const info = store.getActionById?.(actionId);
  const node = info?.node;
  if (node?.name) return node.name;
  if (node?.id) return node.id;
  return formatEffectId(actionId);
}

function getActionType(actionId) {
  const info = store.getActionById?.(actionId);
  return info?.node?.type || '';
}

function getActorIdForAction(actionId) {
  const info = store.getActionById?.(actionId);
  return info?.trackId || '';
}

function formatFrameTime(timeSeconds) {
  const prep = Number(store.prepDuration) || 0;
  const battleTime = (Number(timeSeconds) || 0) - prep;
  return formatTimeWithFrames(battleTime);
}

function formatEntryLine(entry) {
  return formatSimLogEntry(entry, { formatTime: formatFrameTime });
}

function formatOtherEntryText(entry) {
  if (entry?.type === 'CD_REDUCTION') {
    return t('battleLog.ui.cdReductionText', {
      amount: formatDamageNumber(entry.payload?.reduction),
    });
  }
  return formatEntryLine(entry);
}

function formatEffectId(effectId) {
  return translateEffectName(t, te, effectId);
}

function formatEffectSourceId(sourceId) {
  if (!sourceId) return '';
  const action = store.getActionById?.(sourceId);
  if (action?.node?.name) return action.node.name;
  if (action?.node?.id) return action.node.id;
  return formatEffectId(sourceId);
}

function getTypeLabel(type) {
  const key = `battleLog.types.${type}`;
  const out = t(key);
  return out === key ? type : out;
}

function getSummaryStats(group) {
  return [
    {
      key: 'damage',
      label: t('battleLog.summary.damage'),
      value: formatDamageNumber(getGroupDamageTotal(group)),
    },
    { key: 'gauge', label: t('battleLog.summary.gauge'), value: group.gauge.length },
    { key: 'stagger', label: t('battleLog.summary.stagger'), value: group.stagger.length },
  ];
}

function hasRenderableSections(group) {
  return (
    group.damage.length > 0 ||
    group.effects.length > 0 ||
    group.reactions.length > 0 ||
    group.sp.length > 0 ||
    group.gauge.length > 0 ||
    group.stagger.length > 0 ||
    group.other.some(entry => entry.type !== 'ACTION_START' && entry.type !== 'ACTION_END')
  );
}

const availableTypes = computed(() => {
  const set = new Set();
  for (const entry of displayLog.value) {
    if (entry?.type) set.add(entry.type);
  }
  return Array.from(set).sort();
});

const typeFilterItems = computed(() =>
  availableTypes.value.map(type => ({
    type,
    label: getTypeLabel(type),
  })),
);

watch(availableTypes, types => {
  if (!types || types.length === 0) return;
  if (!hasInitializedTypes.value) {
    selectedTypes.value = new Set(types);
    hasInitializedTypes.value = true;
    return;
  }
  let changed = false;
  const typeSet = new Set(types);
  const next = new Set();
  selectedTypes.value.forEach(type => {
    if (typeSet.has(type)) next.add(type);
  });
  types.forEach(type => {
    if (selectedTypes.value.size > 0 && !next.has(type)) {
      next.add(type);
      changed = true;
    }
  });
  if (!changed && next.size === selectedTypes.value.size) return;
  selectedTypes.value = next;
});

const currentRevision = computed(() => store.simLogRevision);

watch(
  currentRevision,
  rev => {
    if (rev !== lastRefreshedRevision.value) {
      isDirty.value = true;
    }
  },
  { immediate: true },
);

function refresh() {
  displayLog.value = Array.isArray(store.simLog) ? store.simLog.slice() : [];
  lastRefreshedRevision.value = store.simLogRevision;
  isDirty.value = false;
}

function toggleType(type) {
  const next = new Set(selectedTypes.value);
  if (next.has(type)) next.delete(type);
  else next.add(type);
  selectedTypes.value = next;
}

function selectAllTypes() {
  selectedTypes.value = new Set(availableTypes.value);
}

function clearTypes() {
  selectedTypes.value = new Set();
}

const filteredEntries = computed(() => {
  const kw = (keyword.value || '').trim().toLowerCase();
  const allow = selectedTypes.value;
  const raw = displayLog.value;
  const max = limit.value === 'all' ? Infinity : Math.max(0, Number(limit.value) || 0);

  if (availableTypes.value.length > 0 && allow.size === 0) {
    return [];
  }

  const out = [];
  for (let i = 0; i < raw.length && out.length < max; i++) {
    const entry = raw[i];
    if (!entry || !entry.type) continue;
    if (!allow.has(entry.type)) continue;

    const line = formatEntryLine(entry);
    if (kw && !String(line).toLowerCase().includes(kw)) continue;
    out.push(entry);
  }
  return out;
});

const actionGroups = computed(() => {
  const map = new Map();
  const orphans = [];

  for (const entry of filteredEntries.value) {
    const actionId = getEntryActionId(entry);
    if (!actionId) {
      orphans.push(entry);
      continue;
    }

    let group = map.get(actionId);
    if (!group) {
      const actorId = getActorIdForAction(actionId);
      group = {
        actionId,
        actorId,
        actorName: getTrackDisplayName(actorId),
        actionName: getActionDisplayName(actionId),
        actionType: getActionType(actionId),
        startTime: null,
        endTime: null,
        damage: [],
        effects: [],
        reactions: [],
        sp: [],
        gauge: [],
        stagger: [],
        other: [],
      };
      map.set(actionId, group);
    }

    switch (entry.type) {
      case 'ACTION_START':
        group.startTime = group.startTime ?? entry.time;
        group.other.push(entry);
        break;
      case 'ACTION_END':
        group.endTime = group.endTime ?? entry.time;
        group.other.push(entry);
        break;
      case 'DAMAGE_HIT':
        group.damage.push(entry);
        break;
      case 'EFFECT_START':
      case 'EFFECT_END':
        group.effects.push(entry);
        break;
      case 'REACTION_OCCURRED':
        group.reactions.push(entry);
        break;
      case 'SP_CHANGE':
        group.sp.push(entry);
        break;
      case 'ULT_ENERGY_CHANGE':
      case 'ULTIMATE_CHARGE_CHANGE':
        group.gauge.push(entry);
        break;
      case 'STAGGER':
        group.stagger.push(entry);
        break;
      default:
        group.other.push(entry);
        break;
    }
  }

  const groups = Array.from(map.values());

  const getGroupTime = group => {
    const times = [];
    if (group.startTime != null) times.push(group.startTime);
    if (group.damage[0]) times.push(group.damage[0].time);
    if (group.effects[0]) times.push(group.effects[0].time);
    if (group.reactions[0]) times.push(group.reactions[0].time);
    if (group.sp[0]) times.push(group.sp[0].time);
    if (group.gauge[0]) times.push(group.gauge[0].time);
    if (group.stagger[0]) times.push(group.stagger[0].time);
    if (group.other[0]) times.push(group.other[0].time);
    if (times.length === 0) return Number.POSITIVE_INFINITY;
    return Math.min(...times);
  };

  groups.sort((a, b) => getGroupTime(a) - getGroupTime(b));

  groups.forEach(group => {
    group.damage.sort((a, b) => a.time - b.time);
    group.effects.sort((a, b) => a.time - b.time);
    group.reactions.sort((a, b) => a.time - b.time);
    group.sp.sort((a, b) => a.time - b.time);
    group.gauge.sort((a, b) => a.time - b.time);
    group.stagger.sort((a, b) => a.time - b.time);
    group.other.sort((a, b) => a.time - b.time);
  });

  return { groups, orphans };
});

const filteredGroupCount = computed(() => actionGroups.value.groups.length);
const filteredEntryCount = computed(() => filteredEntries.value.length);
const hasAnyVisibleData = computed(
  () => filteredGroupCount.value > 0 || actionGroups.value.orphans.length > 0,
);

function setGroupRef(actionId, el) {
  if (!actionId) return;
  if (el) groupRefs.value[actionId] = el;
  else delete groupRefs.value[actionId];
}

function scrollActionGroupIntoView(actionId) {
  nextTick(() => {
    groupRefs.value[actionId]?.scrollIntoView?.({
      block: 'nearest',
      behavior: 'smooth',
    });
  });
}

function syncSelectedActionGroup(actionId = store.selectedActionId) {
  if (!actionId) {
    openActionId.value = null;
    return;
  }

  const hasGroup = actionGroups.value.groups.some(group => group.actionId === actionId);
  if (!hasGroup) {
    openActionId.value = null;
    return;
  }

  openActionId.value = actionId;
  scrollActionGroupIntoView(actionId);
}

function onGroupToggle(actionId, event) {
  const isOpen = !!event?.target?.open;
  if (isOpen) {
    openActionId.value = actionId;
    return;
  }
  if (openActionId.value === actionId) {
    openActionId.value = null;
  }
}

watch(
  () => store.selectedActionId,
  actionId => {
    syncSelectedActionGroup(actionId);
  },
  { flush: 'post' },
);

watch(
  actionGroups,
  () => {
    syncSelectedActionGroup(store.selectedActionId);
  },
  { flush: 'post' },
);

onMounted(() => {
  refresh();
});
</script>

<template>
  <div class="simlog-panel">
    <div class="panel-header simlog-panel-header">
      <div class="header-main-row">
        <div class="left-group">
          <div class="header-icon-bar"></div>
          <div class="simlog-title-stack">
            <div class="char-name">{{ t('battleLog.title') }}</div>
            <span v-if="isDirty" class="simlog-dirty">{{ t('battleLog.dirtyHint') }}</span>
          </div>
        </div>

        <div class="header-actions">
          <button type="button" class="ea-btn ea-btn--sm ea-btn--glass-rect" @click="refresh">
            {{ t('battleLog.refresh') }}
          </button>
        </div>
      </div>
      <div class="header-divider"></div>
    </div>

    <div class="simlog-filters simlog-block">
      <div class="simlog-filter-top">
        <div class="simlog-filter-label">
          {{ t('battleLog.ui.filtered') }} {{ filteredEntryCount }} /
          {{ t('battleLog.ui.actionGroups') }} {{ filteredGroupCount }}
        </div>
        <div class="simlog-filter-actions">
          <button
            type="button"
            class="ea-btn ea-btn--glass-rect simlog-chip simlog-chip--tool"
            @click="selectAllTypes"
          >
            {{ t('battleLog.ui.selectAll') }}
          </button>
          <button
            type="button"
            class="ea-btn ea-btn--glass-rect simlog-chip simlog-chip--tool"
            @click="clearTypes"
          >
            {{ t('battleLog.ui.clear') }}
          </button>
        </div>
      </div>

      <div class="simlog-types">
        <button
          v-for="item in typeFilterItems"
          :key="item.type"
          type="button"
          class="ea-btn ea-btn--glass-rect simlog-chip"
          :class="{ 'is-active': selectedTypes.has(item.type) }"
          :title="item.type"
          @click="toggleType(item.type)"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="simlog-filter-bottom">
        <input
          v-model="keyword"
          class="simlog-search"
          type="text"
          :placeholder="t('battleLog.searchPlaceholder')"
        />

        <label class="simlog-limit">
          <span class="simlog-limit__label">{{ t('battleLog.limit') }}</span>
          <el-select v-model="limit" size="small" class="effect-select-dark simlog-limit-select">
            <el-option :label="t('battleLog.ui.allResults')" value="all" />
            <el-option label="200" value="200" />
            <el-option label="1000" value="1000" />
            <el-option label="5000" value="5000" />
          </el-select>
        </label>
      </div>
    </div>

    <div class="simlog-body">
      <div v-if="!hasAnyVisibleData" class="simlog-empty">
        <div class="simlog-empty__text">{{ t('battleLog.ui.noResults') }}</div>
      </div>

      <div v-else class="group-list">
        <details
          v-for="group in actionGroups.groups"
          :key="group.actionId"
          :ref="el => setGroupRef(group.actionId, el)"
          class="group simlog-block"
          :open="openActionId === group.actionId"
          :style="{ '--group-accent': getActionColor(group.actionId) }"
          @toggle="event => onGroupToggle(group.actionId, event)"
        >
          <summary class="group__summary">
            <div class="group__summary-main">
              <div class="group__title-row">
                <span class="group__actor">{{ group.actorName }}</span>
                <span class="group__title-sep">·</span>
                <span class="group__action">{{ group.actionName }}</span>
              </div>
              <div v-if="group.startTime != null || group.endTime != null" class="group__timing">
                <span v-if="group.startTime != null" class="group__timing-item">
                  <span class="group__timing-label">{{ t('battleLog.ui.start') }}</span>
                  <span class="group__timing-value">{{ formatFrameTime(group.startTime) }}</span>
                </span>
                <span v-if="group.endTime != null" class="group__timing-item">
                  <span class="group__timing-label">{{ t('battleLog.ui.end') }}</span>
                  <span class="group__timing-value">{{ formatFrameTime(group.endTime) }}</span>
                </span>
              </div>
              <div class="group__stats">
                <span v-for="stat in getSummaryStats(group)" :key="stat.key" class="group__stat">
                  <span class="group__stat-label">{{ stat.label }}</span>
                  <span class="group__stat-sep">:</span>
                  <span class="group__stat-value">{{ stat.value }}</span>
                </span>
              </div>
            </div>
          </summary>

          <div v-if="hasRenderableSections(group)" class="group__body">
            <section v-if="group.damage.length > 0" class="group-section group-section--damage">
              <div class="group-section__heading">
                <span class="group-section__title">{{ t('battleLog.ui.sections.damage') }}</span>
                <span class="group-section__count">{{ group.damage.length }}</span>
              </div>
              <div class="group-section__list">
                <div v-for="(entry, idx) in group.damage" :key="idx" class="event-row">
                  <span class="event-row__time">t={{ formatFrameTime(entry.time) }}</span>
                  <span class="event-pill">{{ getTypeLabel(entry.type) }}</span>
                  <span class="event-value"
                    >dmg={{ formatDamageNumber(getDamageValue(entry)) }}</span
                  >
                  <span v-if="getDamageElement(entry)" class="event-value"
                    >elem={{ getDamageElement(entry) }}</span
                  >
                  <span v-if="getReactionLabel(entry)" class="event-value"
                    >rx={{ getReactionLabel(entry) }}</span
                  >
                  <span v-if="getConsumedStacksLabel(entry)" class="event-value"
                    >consume={{ getConsumedStacksLabel(entry) }}</span
                  >
                  <span v-if="getLmdiLabel(entry)" class="event-value"
                    >lmdi={{ getLmdiLabel(entry) }}</span
                  >
                  <span class="event-value">stg={{ entry.payload.stagger }}</span>
                  <span
                    v-if="
                      (entry.payload.hitData?.spReturn || entry.payload.hitData?.spRecovery) > 0
                    "
                    class="event-value"
                    >sp+={{
                      entry.payload.hitData?.spReturn || entry.payload.hitData?.spRecovery
                    }}</span
                  >
                </div>
                <div
                  v-if="group.damage.every(entry => getDamageValue(entry) === 0)"
                  class="event-hint"
                >
                  {{ t('battleLog.ui.damageHint') }}
                </div>
              </div>
            </section>

            <section
              v-if="group.effects.length > 0 || group.reactions.length > 0"
              class="group-section group-section--effects"
            >
              <div class="group-section__heading">
                <span class="group-section__title">{{ t('battleLog.ui.sections.effects') }}</span>
                <span class="group-section__count">{{
                  group.effects.length + group.reactions.length
                }}</span>
              </div>
              <div class="group-section__list">
                <div
                  v-for="(entry, idx) in group.reactions"
                  :key="`reaction_${idx}`"
                  class="event-row"
                >
                  <span class="event-row__time">t={{ formatFrameTime(entry.time) }}</span>
                  <span class="event-pill">{{ getTypeLabel(entry.type) }}</span>
                  <span class="event-text">{{ entry.payload.reactionName }}</span>
                </div>
                <div v-for="(entry, idx) in group.effects" :key="`effect_${idx}`" class="event-row">
                  <span class="event-row__time">t={{ formatFrameTime(entry.time) }}</span>
                  <template v-if="entry.type === 'EFFECT_START'">
                    <span class="event-pill">{{ t('battleLog.ui.effectApply') }}</span>
                    <span class="event-text">{{
                      formatEffectId(entry.payload.effectSnapshot?.id)
                    }}</span>
                    <span class="event-muted">-> {{ entry.payload.targetId }}</span>
                  </template>
                  <template v-else>
                    <span class="event-pill">{{ t('battleLog.ui.effectRemove') }}</span>
                    <span class="event-text">{{ formatEffectId(entry.payload.effectId) }}</span>
                    <span class="event-muted">({{ entry.payload.type }})</span>
                  </template>
                </div>
              </div>
            </section>

            <section v-if="group.sp.length > 0" class="group-section group-section--sp">
              <div class="group-section__heading">
                <span class="group-section__title">{{ t('battleLog.ui.sections.sp') }}</span>
                <span class="group-section__count">{{ group.sp.length }}</span>
              </div>
              <div class="group-section__list">
                <div v-for="(entry, idx) in group.sp" :key="idx" class="event-row">
                  <span class="event-row__time">t={{ formatFrameTime(entry.time) }}</span>
                  <span class="event-pill">{{ getTypeLabel(entry.type) }}</span>
                  <span class="event-value"
                    >chg={{ formatSignedNumber(entry.payload.change) }}</span
                  >
                  <span class="event-value">sp={{ entry.payload.sp }}</span>
                  <span class="event-muted">({{ entry.payload.reason }})</span>
                </div>
              </div>
            </section>

            <section v-if="group.gauge.length > 0" class="group-section group-section--gauge">
              <div class="group-section__heading">
                <span class="group-section__title">{{ t('battleLog.ui.sections.gauge') }}</span>
                <span class="group-section__count">{{ group.gauge.length }}</span>
              </div>
              <div class="group-section__list">
                <div v-for="(entry, idx) in group.gauge" :key="idx" class="event-row">
                  <span class="event-row__time">t={{ formatFrameTime(entry.time) }}</span>
                  <span class="event-pill">{{ getTypeLabel(entry.type) }}</span>
                  <span class="event-value"
                    >chg={{ formatSignedNumber(entry.payload.change) }}</span
                  >
                  <span class="event-value"
                    >gauge={{ Number(entry.payload.gauge).toFixed(1) }}</span
                  >
                  <span v-if="entry.payload.actorId" class="event-muted"
                    >-> {{ getTrackDisplayName(entry.payload.actorId) }}</span
                  >
                  <span v-if="entry.payload.sourceId" class="event-muted"
                    >({{ formatEffectSourceId(entry.payload.sourceId) }})</span
                  >
                </div>
              </div>
            </section>

            <section v-if="group.stagger.length > 0" class="group-section group-section--stagger">
              <div class="group-section__heading">
                <span class="group-section__title">{{ t('battleLog.ui.sections.stagger') }}</span>
                <span class="group-section__count">{{ group.stagger.length }}</span>
              </div>
              <div class="group-section__list">
                <div v-for="(entry, idx) in group.stagger" :key="idx" class="event-row">
                  <span class="event-row__time">t={{ formatFrameTime(entry.time) }}</span>
                  <span class="event-pill">{{ getTypeLabel(entry.type) }}</span>
                  <span class="event-value">{{ formatSignedNumber(entry.payload.amount) }}</span>
                  <span class="event-value"
                    >stg={{ Number(entry.payload.stagger).toFixed(1) }}</span
                  >
                  <span v-if="entry.payload.isBroken" class="event-tag">{{
                    t('battleLog.ui.broken')
                  }}</span>
                </div>
              </div>
            </section>

            <section
              v-if="
                group.other.some(
                  entry => entry.type !== 'ACTION_START' && entry.type !== 'ACTION_END',
                )
              "
              class="group-section group-section--other"
            >
              <div class="group-section__heading">
                <span class="group-section__title">{{ t('battleLog.ui.sections.other') }}</span>
                <span class="group-section__count">{{
                  group.other.filter(
                    entry => entry.type !== 'ACTION_START' && entry.type !== 'ACTION_END',
                  ).length
                }}</span>
              </div>
              <div class="group-section__list">
                <div
                  v-for="(entry, idx) in group.other.filter(
                    entry => entry.type !== 'ACTION_START' && entry.type !== 'ACTION_END',
                  )"
                  :key="idx"
                  class="event-row"
                >
                  <span class="event-row__time">t={{ formatFrameTime(entry.time) }}</span>
                  <span class="event-pill">{{ getTypeLabel(entry.type) }}</span>
                  <span class="event-text">{{ formatOtherEntryText(entry) }}</span>
                </div>
              </div>
            </section>
          </div>
        </details>

        <details
          v-if="actionGroups.orphans.length > 0"
          class="group group--orphans simlog-block"
          :style="{ '--group-accent': '#94a3b8' }"
          open
        >
          <summary class="group__summary">
            <div class="group__summary-main">
              <div class="group__title-row">
                <span class="group__actor">{{ t('battleLog.ui.orphans') }}</span>
              </div>
              <div class="group__stats">
                <span class="group__stat">
                  <span class="group__stat-label">{{ t('battleLog.ui.lines') }}</span>
                  <span class="group__stat-sep">:</span>
                  <span class="group__stat-value">{{ actionGroups.orphans.length }}</span>
                </span>
              </div>
            </div>
          </summary>
          <div class="group__body">
            <pre
              class="simlog-pre"
            ><code v-for="(entry, idx) in actionGroups.orphans" :key="idx" class="simlog-line">{{ formatEntryLine(entry) }}</code></pre>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<style scoped>
.simlog-panel {
  --right-panel-container-radius: 0;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #252525;
}

.panel-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 0;
}

.simlog-panel-header {
  flex-shrink: 0;
  padding: 15px 15px 0;
}

.header-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  overflow: hidden;
}

.left-group {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.header-icon-bar {
  width: 4px;
  height: 18px;
  background-color: #ffd700;
}

.simlog-title-stack {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.char-name {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.simlog-dirty {
  padding: 1px 6px;
  border-radius: 2px;
  border: 1px solid rgba(255, 215, 0, 0.2);
  background: rgba(255, 215, 0, 0.08);
  color: #ffd700;
  font-size: 10px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.header-divider {
  height: 2px;
  background: linear-gradient(90deg, #ffd700 0%, transparent 100%);
  opacity: 0.3;
  margin-top: 3px;
}

.simlog-block {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 3px solid rgba(255, 255, 255, 0.16);
  border-radius: 4px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.18);
}

.simlog-filters {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 14px 0;
  padding: 10px 12px;
  border-left-color: rgba(255, 255, 255, 0.18);
}

.simlog-filter-top,
.simlog-filter-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.simlog-filter-label,
.simlog-limit__label {
  color: #999;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.simlog-filter-label {
  min-width: 80px;
  font-variant-numeric: tabular-nums;
}

.simlog-filter-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.simlog-types {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.simlog-chip {
  --ea-btn-py: 4px;
  --ea-btn-px: 10px;
  --ea-btn-font-size: 11px;
  border-radius: var(--right-panel-container-radius);
  min-height: 24px;
}

.simlog-chip--tool {
  --ea-btn-font-size: 10px;
  --ea-btn-px: 8px;
}

.simlog-chip.is-active {
  --ea-btn-bg: rgba(255, 215, 0, 0.08);
  --ea-btn-border: rgba(255, 215, 0, 0.24);
  --ea-btn-color: #ffd700;
  --ea-btn-bg-hover: rgba(255, 215, 0, 0.12);
  --ea-btn-border-hover: rgba(255, 215, 0, 0.34);
  --ea-btn-color-hover: #ffd700;
}

.simlog-search {
  appearance: none;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.simlog-search {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 12px;
  border-radius: 4px;
  font-family: 'Roboto Mono', 'Consolas', monospace;
}

.simlog-search:focus {
  border-color: rgba(255, 215, 0, 0.45);
  box-shadow: 0 0 0 1px rgba(255, 215, 0, 0.16) inset;
}

.simlog-limit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.simlog-limit-select {
  width: 88px;
}

:deep(.effect-select-dark.simlog-limit-select .el-input__wrapper) {
  min-height: 28px;
  height: 28px;
  box-sizing: border-box;
  background-color: #111;
  box-shadow: none;
  border: 1px solid #444;
  border-radius: var(--right-panel-container-radius);
}

:deep(.effect-select-dark.simlog-limit-select .el-select__wrapper) {
  border-radius: var(--right-panel-container-radius);
}

:deep(.effect-select-dark.simlog-limit-select .el-input__inner),
:deep(.effect-select-dark.simlog-limit-select .el-select__selected-item) {
  color: #eee;
  font-size: 11px;
}

:deep(.effect-select-dark.simlog-limit-select .el-select__placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

.simlog-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 14px 14px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.simlog-body::-webkit-scrollbar {
  display: none;
}

.simlog-empty {
  min-height: 160px;
  display: grid;
  place-items: center;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.02);
}

.simlog-empty__text {
  max-width: 320px;
  text-align: center;
  color: #777;
  font-size: 12px;
  line-height: 1.5;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group {
  border-left-color: color-mix(in srgb, var(--group-accent) 72%, rgba(255, 255, 255, 0.16));
  overflow: hidden;
}

.group__summary {
  list-style: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px 8px;
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.group__summary:hover {
  background: rgba(255, 255, 255, 0.025);
}

.group__summary::-webkit-details-marker {
  display: none;
}

.group__summary-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group__title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  white-space: nowrap;
}

.group__actor {
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.group__title-sep {
  color: #666;
  flex-shrink: 0;
}

.group__action {
  color: color-mix(in srgb, var(--group-accent) 88%, #fff);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
  text-shadow: 0 0 8px color-mix(in srgb, var(--group-accent) 32%, transparent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.group__timing {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  color: #777;
  font-size: 11px;
}

.group__timing-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Roboto Mono', 'Consolas', monospace;
}

.group__timing-label {
  color: #777;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.group__timing-value {
  color: #bcbcbc;
}

.group__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.group__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #888;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.group__stat-label {
  color: #888;
}

.group__stat-sep {
  color: #555;
}

.group__stat-value {
  color: #ccc;
  font-family: 'Roboto Mono', 'Consolas', monospace;
}

.group__body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.group-section {
  --section-accent: rgba(255, 255, 255, 0.36);
  padding: 8px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.group-section--damage {
  --section-accent: var(--ea-danger-soft);
}
.group-section--effects {
  --section-accent: var(--ea-info);
}
.group-section--sp {
  --section-accent: var(--ea-gold);
}
.group-section--gauge {
  --section-accent: #f59e0b;
}
.group-section--stagger {
  --section-accent: #fb7185;
}
.group-section--other {
  --section-accent: #94a3b8;
}

.group-section:first-child {
  padding-top: 0;
  border-top: none;
}

.group-section__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.group-section__title {
  color: rgba(255, 255, 255, 0.72);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.group-section__count {
  color: #666;
  font-size: 10px;
  font-family: 'Roboto Mono', 'Consolas', monospace;
}

.group-section__list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.event-row {
  min-height: 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  color: rgba(255, 255, 255, 0.84);
  background: transparent;
  border: none;
}

.event-row + .event-row {
  border-top: 1px dashed rgba(255, 255, 255, 0.04);
}

.event-row__time,
.event-value,
.event-muted {
  font-family: 'Roboto Mono', 'Consolas', monospace;
}

.event-row__time {
  color: #777;
  font-size: 11px;
}

.event-pill {
  display: inline-flex;
  align-items: center;
  min-height: 18px;
  padding: 0 6px;
  border-radius: 2px;
  border: 1px solid color-mix(in srgb, var(--section-accent) 24%, rgba(255, 255, 255, 0.08));
  background: color-mix(in srgb, var(--section-accent) 8%, transparent);
  color: color-mix(in srgb, var(--section-accent) 64%, #fff);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.event-value,
.event-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
}

.event-muted {
  color: #777;
  font-size: 11px;
}

.event-tag {
  padding: 1px 6px;
  border-radius: 2px;
  background: rgba(255, 120, 117, 0.16);
  color: #ffb4b0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.event-hint {
  margin-top: 4px;
  color: #d8b650;
  font-size: 12px;
  line-height: 1.45;
}

.simlog-pre {
  margin: 0;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.84);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Roboto Mono', 'Consolas', monospace;
}

.simlog-dirty,
.simlog-block,
.simlog-search,
.simlog-empty,
.event-pill,
.event-tag,
.simlog-pre {
  border-radius: var(--right-panel-container-radius);
}

.simlog-line {
  display: block;
  padding: 2px 0;
}

@media (max-width: 720px) {
  .simlog-header,
  .simlog-filter-top,
  .simlog-filter-bottom,
  .group__summary {
    flex-direction: column;
    align-items: stretch;
  }

  .simlog-tools,
  .simlog-filter-actions {
    justify-content: flex-start;
  }

  .simlog-filters {
    margin: 0 10px;
  }

  .group__title-row {
    white-space: normal;
  }
}
</style>
