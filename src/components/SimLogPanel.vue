<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useTimelineStore } from '@/stores/timelineStore.js';
import { formatSimLogEntry } from '@/simulation/formatSimLogEntry.ts';
import {
  formatBattleLogField,
  translateBattleLogElement,
  translateBattleLogSpReason,
  translateBattleLogStatus,
} from '@/simulation/formatBattleLogLabels.ts';
import {
  formatEnemyBattleLogLine,
  formatEnemyBattleLogSummary,
  isEnemyChannelEntry,
  isEnemyEffectType,
  isEnemyReactionType,
  mergeCorrosionTicksInBattleLog,
  normalizeEnemyLogEntry,
  shouldIncludeEnemyLogEvent,
} from '@/simulation/normalizeEnemyLogForBattleLog.ts';
import { enrichBattleLogAttribution } from '@/simulation/enrichBattleLogAttribution.ts';
import {
  BATTLE_LOG_TYPE_PRESETS,
  matchBattleLogTypePreset,
  resolveBattleLogTypePreset,
} from '@/simulation/battleLogTypePresets.ts';
import {
  BATTLE_LOG_UNKNOWN_SKILL_KIND,
  battleLogSkillKindLabel,
  sortBattleLogSkillKinds,
} from '@/simulation/battleLogSkillKinds.ts';
import {
  formatOperatorBattleLogLine,
  formatOperatorBattleLogSummary,
  isEffectOriginDamage,
  isOperatorChannelEntry,
  isOperatorEffectType,
  normalizeOperatorLogEntry,
  shouldIncludeOperatorLogEvent,
} from '@/simulation/normalizeOperatorLogForBattleLog.ts';
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
const selectedSkillKinds = ref(new Set());
const hasInitializedSkillKinds = ref(false);

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

function formatField(fieldKey, value) {
  return formatBattleLogField(t, te, fieldKey, value);
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

function getDamageElementLabel(entry) {
  return translateBattleLogElement(t, te, getDamageElement(entry));
}

function getReactionRaw(entry) {
  const hitData = entry?.payload?.hitData;
  const breakdown = getDamageBreakdown(entry);
  return breakdown?.reactionType || hitData?._reactionMeta?.reactionType || '';
}

function getReactionLabel(entry) {
  return translateBattleLogStatus(t, te, getReactionRaw(entry));
}

function getConsumedStacksLabel(entry) {
  const hitData = entry?.payload?.hitData;
  const consumed = hitData?.consumedStacks || hitData?._reactionMeta?.consumedStackSources;
  if (!consumed || typeof consumed !== 'object') return '';
  return Object.entries(consumed)
    .filter(([, value]) => Number(value) !== 0)
    .map(([key, value]) => `${translateBattleLogStatus(t, te, key)}:${formatDamageNumber(value)}`)
    .join(', ');
}

function getLmdiEntries(entry) {
  const hitData = entry?.payload?.hitData;
  if (!hitData || hitData._lmdiSelf == null) return [];

  const entries = [
    {
      key: 'self',
      label: t('battleLog.fields.lmdiSelf'),
      value: formatDamageNumber(hitData._lmdiSelf),
    },
  ];

  if (hitData._lmdiExternal && typeof hitData._lmdiExternal === 'object') {
    for (const [key, value] of Object.entries(hitData._lmdiExternal)) {
      if (Number(value) === 0) continue;
      const trackName = getTrackDisplayName(key);
      const statusName = translateBattleLogStatus(t, te, key);
      entries.push({
        key: `ext:${key}`,
        // External LMDI keys are usually operator track ids; status keys are rarer fallbacks.
        label: trackName && trackName !== key ? trackName : statusName || key,
        value: formatDamageNumber(value),
      });
    }
  }

  return entries;
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
  if (isEnemyChannelEntry(entry)) return null;
  if (isOperatorChannelEntry(entry)) return entry.payload?.actionId || null;
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
      return entry.payload?.sourceId || null;
    case 'SP_REGEN_PAUSE':
      return entry.payload?.sourceId || null;
    default:
      return null;
  }
}

function isRealActionId(actionId) {
  return !!(actionId && store.getActionById?.(actionId));
}

function isSyntheticActionId(actionId) {
  if (!actionId) return true;
  return (
    String(actionId).startsWith('triggered:') ||
    String(actionId).startsWith('reaction:') ||
    String(actionId).startsWith('dot:')
  );
}

function getEntryTrackId(entry) {
  if (!entry?.payload) return '';
  if (isEnemyChannelEntry(entry)) {
    return entry.payload.sourceId || '';
  }
  if (isOperatorChannelEntry(entry)) {
    return entry.payload.sourceId || entry.payload.targetTrackId || '';
  }
  switch (entry.type) {
    case 'DAMAGE_HIT':
      return entry.payload.sourceId || '';
    case 'ACTION_START':
    case 'ACTION_END':
    case 'SP_CHANGE':
    case 'CD_REDUCTION':
    case 'STAGGER':
    case 'ULT_ENERGY_CHANGE':
      return entry.payload.actorId || '';
    case 'SP_REGEN_PAUSE': {
      const sourceId = entry.payload.sourceId;
      if (isRealActionId(sourceId)) return getActorIdForAction(sourceId);
      return sourceId || '';
    }
    default:
      return entry.payload.actorId || entry.payload.sourceId || '';
  }
}

/** Latest action on a track that started at or before `time` (same heuristic as ActionItem ticks). */
function buildTrackActionStarts() {
  const byTrack = new Map();
  const entries = store.compiledTimeline?.actionMap?.entries?.() ?? [];
  for (const [id, action] of entries) {
    const trackId = action.trackId;
    if (!trackId) continue;
    let list = byTrack.get(trackId);
    if (!list) {
      list = [];
      byTrack.set(trackId, list);
    }
    list.push({ id, start: Number(action.realStartTime) || 0 });
  }
  for (const list of byTrack.values()) {
    list.sort((left, right) => right.start - left.start);
  }
  return byTrack;
}

function resolveOwnerActionId(entry, trackActionStarts) {
  const raw = getEntryActionId(entry);
  if (isRealActionId(raw)) return raw;

  const trackId = getEntryTrackId(entry);
  const starts = trackId ? trackActionStarts.get(trackId) : null;
  if (starts?.length) {
    const owner = starts.find(item => item.start <= (Number(entry.time) || 0));
    if (owner?.id) return owner.id;
  }

  // Keep a stable synthetic bucket when we cannot resolve a real action.
  if (raw && !isSyntheticActionId(raw)) return raw;
  return raw || null;
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
  if (isEnemyChannelEntry(entry)) {
    return formatEnemyBattleLogLine(entry, {
      t,
      te,
      formatTime: formatFrameTime,
      typeLabel: getTypeLabel,
    });
  }
  if (isOperatorChannelEntry(entry)) {
    return formatOperatorBattleLogLine(entry, {
      t,
      te,
      formatTime: formatFrameTime,
      typeLabel: getTypeLabel,
      trackName: getTrackDisplayName,
    });
  }
  return formatSimLogEntry(entry, {
    formatTime: formatFrameTime,
    t,
    te,
    typeLabel: getTypeLabel,
    trackName: getTrackDisplayName,
    actionName: id => {
      const info = store.getActionById?.(id);
      if (info?.node?.name) return info.node.name;
      return formatEffectId(id);
    },
  });
}

function formatEnemyEffectVerb(entry) {
  if (
    entry?.type === 'ENEMY_EFFECT_EXPIRE' ||
    entry?.type === 'INFLICTION_CONSUMED' ||
    entry?.type === 'VULNERABILITY_CONSUMED'
  ) {
    return t('battleLog.ui.effectRemove');
  }
  if (entry?.type === 'CORROSION_SPAN') {
    return t('battleLog.ui.tick');
  }
  if (entry?.type === 'ARTS_BURST') return t('battleLog.ui.burst');
  if (isEnemyReactionType(entry?.type)) return t('battleLog.ui.reaction');
  return t('battleLog.ui.effectApply');
}

function formatEnemyEffectSummary(entry) {
  return formatEnemyBattleLogSummary(entry, t, te);
}

function formatOperatorEffectVerb(entry) {
  return entry?.type === 'OPERATOR_EFFECT_EXPIRE'
    ? t('battleLog.ui.effectRemove')
    : t('battleLog.ui.effectApply');
}

function formatOperatorEffectSummary(entry) {
  return formatOperatorBattleLogSummary(entry, t, te);
}

function getDamageKindPill(entry) {
  return isEffectOriginDamage(entry)
    ? t('battleLog.ui.effectDamage')
    : t('battleLog.ui.skillDamage');
}

function getEffectDamageSourceLabel(entry, group) {
  const hit = entry?.payload?.hitData;
  if (!hit) return '';

  const rawBy = String(
    hit.triggeredBy || hit._reactionMeta?.reactionType || hit.id || '',
  ).trim();
  const cleaned = rawBy.replace(/^(dot:|reaction:|triggered:)/, '');
  const effectPart = cleaned ? translateBattleLogStatus(t, te, cleaned) || cleaned : '';

  let skillPart = '';
  if (group?.actionName && !isSyntheticActionId(group.actionId)) {
    skillPart = group.actionName;
  } else if (isRealActionId(entry?.payload?.actionId)) {
    skillPart = getActionDisplayName(entry.payload.actionId);
  } else if (hit.skillId) {
    skillPart = formatEffectId(hit.skillId);
  }

  if (effectPart && skillPart && effectPart !== skillPart) {
    return `${effectPart} · ${skillPart}`;
  }
  return effectPart || skillPart;
}

function getSkillDamageEntries(group) {
  return (group.damage || []).filter(entry => !isEffectOriginDamage(entry));
}

function getEffectDamageEntries(group) {
  return (group.damage || []).filter(entry => isEffectOriginDamage(entry));
}

function getGroupSkillDamageTotal(group) {
  return getSkillDamageEntries(group).reduce((sum, entry) => sum + getDamageValue(entry), 0);
}

function getGroupEffectDamageTotal(group) {
  return getEffectDamageEntries(group).reduce((sum, entry) => sum + getDamageValue(entry), 0);
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

function getActionSkillKind(actionId) {
  if (!actionId) return BATTLE_LOG_UNKNOWN_SKILL_KIND;
  const info = store.getActionById?.(actionId);
  const kind = String(info?.node?.type || '').trim();
  return kind || BATTLE_LOG_UNKNOWN_SKILL_KIND;
}

function getEntrySkillKind(entry, trackActionStarts) {
  if (entry?.type === 'ACTION_START' || entry?.type === 'ACTION_END') {
    const fromPayload = String(entry.payload?.type || '').trim();
    if (fromPayload) return fromPayload;
  }
  const actionId = resolveOwnerActionId(entry, trackActionStarts);
  return getActionSkillKind(actionId);
}

function getTypeLabel(type) {
  const key = `battleLog.types.${type}`;
  const out = t(key);
  return out === key ? type : out;
}

function getSummaryStats(group) {
  const skillTotal = getGroupSkillDamageTotal(group);
  const effectTotal = getGroupEffectDamageTotal(group);
  const stats = [
    {
      key: 'damage',
      label: t('battleLog.summary.damage'),
      value: formatDamageNumber(getGroupDamageTotal(group)),
    },
  ];
  if (skillTotal > 0 && effectTotal > 0) {
    stats.push(
      {
        key: 'skillDamage',
        label: t('battleLog.summary.skillDamage'),
        value: formatDamageNumber(skillTotal),
      },
      {
        key: 'effectDamage',
        label: t('battleLog.summary.effectDamage'),
        value: formatDamageNumber(effectTotal),
      },
    );
  }
  stats.push(
    { key: 'gauge', label: t('battleLog.summary.gauge'), value: group.gauge.length },
    { key: 'stagger', label: t('battleLog.summary.stagger'), value: group.stagger.length },
  );
  return stats;
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

/** Corrosion ticks are merged into spans; spans follow the DEBUFF_APPLY type chip. */
function isCorrosionLogType(type) {
  return type === 'CORROSION_SPAN';
}

function isTypeAllowed(type, allow) {
  if (isCorrosionLogType(type)) return allow.has('DEBUFF_APPLY');
  return allow.has(type);
}

const availableTypes = computed(() => {
  const set = new Set();
  for (const entry of displayLog.value) {
    if (!entry?.type || isCorrosionLogType(entry.type)) continue;
    set.add(entry.type);
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

const trackActionStartsForFilter = computed(() => buildTrackActionStarts());

const availableSkillKinds = computed(() => {
  const set = new Set();
  const trackStarts = trackActionStartsForFilter.value;
  for (const entry of displayLog.value) {
    if (!entry?.type) continue;
    set.add(getEntrySkillKind(entry, trackStarts));
  }
  return sortBattleLogSkillKinds(Array.from(set));
});

const skillKindFilterItems = computed(() =>
  availableSkillKinds.value.map(kind => ({
    kind,
    label: battleLogSkillKindLabel(t, te, kind),
  })),
);

watch(availableSkillKinds, kinds => {
  if (!kinds || kinds.length === 0) return;
  if (!hasInitializedSkillKinds.value) {
    selectedSkillKinds.value = new Set(kinds);
    hasInitializedSkillKinds.value = true;
    return;
  }
  let changed = false;
  const kindSet = new Set(kinds);
  const next = new Set();
  selectedSkillKinds.value.forEach(kind => {
    if (kindSet.has(kind)) next.add(kind);
  });
  kinds.forEach(kind => {
    if (selectedSkillKinds.value.size > 0 && !next.has(kind)) {
      next.add(kind);
      changed = true;
    }
  });
  if (!changed && next.size === selectedSkillKinds.value.size) return;
  selectedSkillKinds.value = next;
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
  const sim = Array.isArray(store.simLog) ? store.simLog : [];
  const enemy = Array.isArray(store.enemyLog) ? store.enemyLog : [];
  const operator = Array.isArray(store.operatorLog) ? store.operatorLog : [];
  const normalizedEnemy = [];
  for (let i = 0; i < enemy.length; i++) {
    const event = enemy[i];
    if (!shouldIncludeEnemyLogEvent(event)) continue;
    normalizedEnemy.push(normalizeEnemyLogEntry(event));
  }
  const mergedEnemy = mergeCorrosionTicksInBattleLog(normalizedEnemy);
  const normalizedOperator = [];
  for (let i = 0; i < operator.length; i++) {
    const event = operator[i];
    if (!shouldIncludeOperatorLogEvent(event)) continue;
    normalizedOperator.push(normalizeOperatorLogEntry(event));
  }
  const merged = [...sim, ...mergedEnemy, ...normalizedOperator].sort((a, b) => {
    const dt = (Number(a.time) || 0) - (Number(b.time) || 0);
    if (dt !== 0) return dt;
    const channelRank = entry => {
      if (isOperatorChannelEntry(entry)) return 2;
      if (isEnemyChannelEntry(entry)) return 1;
      return 0;
    };
    return channelRank(a) - channelRank(b);
  });
  displayLog.value = enrichBattleLogAttribution(merged);
  lastRefreshedRevision.value = store.simLogRevision;
  isDirty.value = false;
}

function toggleType(type) {
  const next = new Set(selectedTypes.value);
  if (next.has(type)) next.delete(type);
  else next.add(type);
  selectedTypes.value = next;
}

function toggleSkillKind(kind) {
  const next = new Set(selectedSkillKinds.value);
  if (next.has(kind)) next.delete(kind);
  else next.add(kind);
  selectedSkillKinds.value = next;
}

function clearTypes() {
  selectedTypes.value = new Set();
  selectedSkillKinds.value = new Set();
}

const activeTypePreset = computed(() =>
  matchBattleLogTypePreset(selectedTypes.value, availableTypes.value),
);

function applyTypePreset(presetId) {
  selectedTypes.value = new Set(resolveBattleLogTypePreset(presetId, availableTypes.value));
}

const filteredEntries = computed(() => {
  const kw = (keyword.value || '').trim().toLowerCase();
  const allow = selectedTypes.value;
  const allowSkills = selectedSkillKinds.value;
  const raw = displayLog.value;
  const max = limit.value === 'all' ? Infinity : Math.max(0, Number(limit.value) || 0);
  const trackStarts = trackActionStartsForFilter.value;

  if (availableTypes.value.length > 0 && allow.size === 0) {
    return [];
  }
  if (availableSkillKinds.value.length > 0 && allowSkills.size === 0) {
    return [];
  }

  const out = [];
  for (let i = 0; i < raw.length && out.length < max; i++) {
    const entry = raw[i];
    if (!entry || !entry.type) continue;
    if (!isTypeAllowed(entry.type, allow)) continue;
    if (!allowSkills.has(getEntrySkillKind(entry, trackStarts))) continue;

    const line = formatEntryLine(entry);
    if (kw && !String(line).toLowerCase().includes(kw)) continue;
    out.push(entry);
  }
  return out;
});

const actionGroups = computed(() => {
  const map = new Map();
  const orphans = [];
  const trackActionStarts = buildTrackActionStarts();

  for (const entry of filteredEntries.value) {
    const actionId = resolveOwnerActionId(entry, trackActionStarts);
    if (!actionId) {
      orphans.push(entry);
      continue;
    }

    let group = map.get(actionId);
    if (!group) {
      const actorId = getActorIdForAction(actionId) || getEntryTrackId(entry);
      group = {
        actionId,
        actorId,
        actorName: getTrackDisplayName(actorId),
        actionName: getActionDisplayName(actionId),
        jumpable: isRealActionId(actionId),
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
      case 'REACTION_TRIGGER':
        group.reactions.push(entry);
        break;
      case 'SP_CHANGE':
        group.sp.push(entry);
        break;
      case 'ULT_ENERGY_CHANGE':
        group.gauge.push(entry);
        break;
      case 'STAGGER':
        group.stagger.push(entry);
        break;
      default:
        if (isEnemyReactionType(entry.type)) {
          group.reactions.push(entry);
        } else if (
          isEnemyEffectType(entry.type) ||
          isEnemyChannelEntry(entry) ||
          isOperatorEffectType(entry.type) ||
          isOperatorChannelEntry(entry)
        ) {
          group.effects.push(entry);
        } else {
          group.other.push(entry);
        }
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
    group.focusTime = getGroupTime(group);
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

function focusActionOnTimeline(actionId, focusTime) {
  if (!isRealActionId(actionId)) return;

  // Keep the log group expanded; avoid selectAction toggle-off when already selected.
  openActionId.value = actionId;
  if (store.selectedActionId !== actionId) {
    store.selectAction(actionId);
  }

  const resolved = store.compiledTimeline?.actionMap?.get(actionId);
  const info = store.getActionById?.(actionId);
  const time =
    Number.isFinite(focusTime) && focusTime !== Number.POSITIVE_INFINITY
      ? Number(focusTime)
      : Number(resolved?.realStartTime ?? info?.node?.startTime) || 0;

  const viewportW = Number(store.timelineRect?.width) || 0;
  const targetPx = store.timeToPx(time);
  store.setTimelineShift(Math.max(0, targetPx - viewportW / 2));
  scrollActionGroupIntoView(actionId);
}

function onGroupSummaryClick(group, event) {
  // Controlled `:open` fights the browser's default details toggle — take over fully.
  event?.preventDefault?.();

  if (group?.jumpable) {
    focusActionOnTimeline(group.actionId, group.startTime ?? group.focusTime);
    return;
  }

  openActionId.value = openActionId.value === group.actionId ? null : group.actionId;
}

function onEventRowClick(group, entry) {
  if (!group?.jumpable) return;
  focusActionOnTimeline(group.actionId, entry?.time ?? group.startTime ?? group.focusTime);
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
          </div>
        </div>

        <div class="header-actions">
          <span v-if="isDirty" class="simlog-dirty">{{ t('battleLog.dirtyHint') }}</span>
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
        <button
          type="button"
          class="ea-btn ea-btn--glass-rect simlog-chip simlog-chip--tool"
          @click="clearTypes"
        >
          {{ t('battleLog.ui.clear') }}
        </button>
      </div>

      <div class="simlog-presets">
        <div class="simlog-filter-label">{{ t('battleLog.presets.label') }}</div>
        <div class="simlog-presets__list">
          <button
            v-for="preset in BATTLE_LOG_TYPE_PRESETS"
            :key="preset.id"
            type="button"
            class="ea-btn ea-btn--glass-rect simlog-preset"
            :class="{ 'is-active': activeTypePreset === preset.id }"
            @click="applyTypePreset(preset.id)"
          >
            {{ t(preset.i18nKey) }}
          </button>
        </div>
      </div>

      <div class="simlog-types-row">
        <div class="simlog-filter-label">{{ t('battleLog.ui.types') }}</div>
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
      </div>

      <div v-if="skillKindFilterItems.length > 0" class="simlog-types-row">
        <div class="simlog-filter-label">{{ t('battleLog.ui.skillKinds') }}</div>
        <div class="simlog-types">
          <button
            v-for="item in skillKindFilterItems"
            :key="item.kind"
            type="button"
            class="ea-btn ea-btn--glass-rect simlog-chip"
            :class="{ 'is-active': selectedSkillKinds.has(item.kind) }"
            :title="item.kind"
            @click="toggleSkillKind(item.kind)"
          >
            {{ item.label }}
          </button>
        </div>
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
          <summary
            class="group__summary"
            :class="{ 'is-jumpable': group.jumpable }"
            :title="group.jumpable ? t('battleLog.ui.jumpToTimeline') : undefined"
            @click="onGroupSummaryClick(group, $event)"
          >
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

              <div
                v-if="getSkillDamageEntries(group).length > 0"
                class="damage-subgroup"
              >
                <div class="damage-subgroup__heading">
                  <span class="damage-subgroup__title">{{ t('battleLog.ui.skillDamage') }}</span>
                  <span class="damage-subgroup__count">{{
                    getSkillDamageEntries(group).length
                  }}</span>
                </div>
                <div class="group-section__list">
                  <div
                    v-for="(entry, idx) in getSkillDamageEntries(group)"
                    :key="`skill_${idx}`"
                    class="event-row event-row--stack"
                    :class="{ 'is-jumpable': group.jumpable }"
                    @click="onEventRowClick(group, entry)"
                  >
                    <div class="event-row__main">
                      <span class="event-row__time">{{
                        formatField('time', formatFrameTime(entry.time))
                      }}</span>
                      <span class="event-pill event-pill--skill">{{
                        getDamageKindPill(entry)
                      }}</span>
                      <span class="event-value">{{
                        formatField('damage', formatDamageNumber(getDamageValue(entry)))
                      }}</span>
                      <span v-if="getDamageElementLabel(entry)" class="event-value">{{
                        formatField('element', getDamageElementLabel(entry))
                      }}</span>
                      <span v-if="getConsumedStacksLabel(entry)" class="event-value">{{
                        formatField('consume', getConsumedStacksLabel(entry))
                      }}</span>
                      <span class="event-value">{{
                        formatField('stagger', entry.payload.stagger)
                      }}</span>
                      <span
                        v-if="
                          (entry.payload.hitData?.spReturn || entry.payload.hitData?.spRecovery) > 0
                        "
                        class="event-value"
                        >{{
                          formatField(
                            'spGain',
                            entry.payload.hitData?.spReturn || entry.payload.hitData?.spRecovery,
                          )
                        }}</span
                      >
                    </div>
                    <div
                      v-if="getLmdiEntries(entry).length > 0"
                      class="event-lmdi"
                      :title="t('battleLog.fields.lmdiHint')"
                    >
                      <div class="event-lmdi__title">{{ t('battleLog.fields.lmdi') }}</div>
                      <div
                        v-for="item in getLmdiEntries(entry)"
                        :key="item.key"
                        class="event-lmdi__item"
                      >
                        <span class="event-lmdi__label">{{ item.label }}</span>
                        <span class="event-lmdi__sep">:</span>
                        <span class="event-lmdi__value">{{ item.value }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="getEffectDamageEntries(group).length > 0"
                class="damage-subgroup"
              >
                <div class="damage-subgroup__heading">
                  <span class="damage-subgroup__title">{{ t('battleLog.ui.effectDamage') }}</span>
                  <span class="damage-subgroup__count">{{
                    getEffectDamageEntries(group).length
                  }}</span>
                </div>
                <div class="group-section__list">
                  <div
                    v-for="(entry, idx) in getEffectDamageEntries(group)"
                    :key="`effect_dmg_${idx}`"
                    class="event-row event-row--stack"
                    :class="{ 'is-jumpable': group.jumpable }"
                    @click="onEventRowClick(group, entry)"
                  >
                    <div class="event-row__main">
                      <span class="event-row__time">{{
                        formatField('time', formatFrameTime(entry.time))
                      }}</span>
                      <span class="event-pill event-pill--effect">{{
                        getDamageKindPill(entry)
                      }}</span>
                      <span v-if="getEffectDamageSourceLabel(entry, group)" class="event-text">{{
                        getEffectDamageSourceLabel(entry, group)
                      }}</span>
                      <span class="event-value">{{
                        formatField('damage', formatDamageNumber(getDamageValue(entry)))
                      }}</span>
                      <span v-if="getDamageElementLabel(entry)" class="event-value">{{
                        formatField('element', getDamageElementLabel(entry))
                      }}</span>
                      <span v-if="getReactionLabel(entry)" class="event-value">{{
                        formatField('reaction', getReactionLabel(entry))
                      }}</span>
                      <span v-if="getConsumedStacksLabel(entry)" class="event-value">{{
                        formatField('consume', getConsumedStacksLabel(entry))
                      }}</span>
                      <span class="event-value">{{
                        formatField('stagger', entry.payload.stagger)
                      }}</span>
                      <span
                        v-if="
                          (entry.payload.hitData?.spReturn || entry.payload.hitData?.spRecovery) > 0
                        "
                        class="event-value"
                        >{{
                          formatField(
                            'spGain',
                            entry.payload.hitData?.spReturn || entry.payload.hitData?.spRecovery,
                          )
                        }}</span
                      >
                    </div>
                    <div
                      v-if="getLmdiEntries(entry).length > 0"
                      class="event-lmdi"
                      :title="t('battleLog.fields.lmdiHint')"
                    >
                      <div class="event-lmdi__title">{{ t('battleLog.fields.lmdi') }}</div>
                      <div
                        v-for="item in getLmdiEntries(entry)"
                        :key="item.key"
                        class="event-lmdi__item"
                      >
                        <span class="event-lmdi__label">{{ item.label }}</span>
                        <span class="event-lmdi__sep">:</span>
                        <span class="event-lmdi__value">{{ item.value }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="group.damage.every(entry => getDamageValue(entry) === 0)"
                class="event-hint"
              >
                {{ t('battleLog.ui.damageHint') }}
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
                  :class="{ 'is-jumpable': group.jumpable }"
                  @click="onEventRowClick(group, entry)"
                >
                  <span class="event-row__time">{{
                    formatField('time', formatFrameTime(entry.time))
                  }}</span>
                  <span class="event-pill">{{ formatEnemyEffectVerb(entry) }}</span>
                  <span class="event-text">{{
                    formatEnemyEffectSummary(entry) ||
                    translateBattleLogStatus(
                      t,
                      te,
                      entry.payload?.reactionType || entry.payload?.reactionName,
                    )
                  }}</span>
                  <span class="event-muted">{{ getTypeLabel(entry.type) }}</span>
                </div>
                <div
                  v-for="(entry, idx) in group.effects"
                  :key="`effect_${idx}`"
                  class="event-row"
                  :class="{ 'is-jumpable': group.jumpable }"
                  @click="onEventRowClick(group, entry)"
                >
                  <span class="event-row__time">{{
                    formatField('time', formatFrameTime(entry.time))
                  }}</span>
                  <template v-if="isEnemyChannelEntry(entry)">
                    <span class="event-pill">{{ formatEnemyEffectVerb(entry) }}</span>
                    <span class="event-text">{{ formatEnemyEffectSummary(entry) }}</span>
                    <span class="event-muted">{{ getTypeLabel(entry.type) }}</span>
                  </template>
                  <template v-else-if="isOperatorChannelEntry(entry)">
                    <span class="event-pill">{{ formatOperatorEffectVerb(entry) }}</span>
                    <span class="event-text">{{ formatOperatorEffectSummary(entry) }}</span>
                    <span
                      v-if="entry.payload?.targetTrackId"
                      class="event-muted"
                      >-> {{ getTrackDisplayName(entry.payload.targetTrackId) }}</span
                    >
                    <span class="event-muted">{{ getTypeLabel(entry.type) }}</span>
                  </template>
                  <template v-else>
                    <span class="event-pill">{{ getTypeLabel(entry.type) }}</span>
                    <span class="event-text">{{ formatOtherEntryText(entry) }}</span>
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
                <div
                  v-for="(entry, idx) in group.sp"
                  :key="idx"
                  class="event-row"
                  :class="{ 'is-jumpable': group.jumpable }"
                  @click="onEventRowClick(group, entry)"
                >
                  <span class="event-row__time">{{
                    formatField('time', formatFrameTime(entry.time))
                  }}</span>
                  <span class="event-pill">{{ getTypeLabel(entry.type) }}</span>
                  <span class="event-value">{{
                    formatField('change', formatSignedNumber(entry.payload.change))
                  }}</span>
                  <span class="event-value">{{ formatField('sp', entry.payload.sp) }}</span>
                  <span class="event-muted"
                    >({{ translateBattleLogSpReason(t, te, entry.payload.reason) }})</span
                  >
                </div>
              </div>
            </section>

            <section v-if="group.gauge.length > 0" class="group-section group-section--gauge">
              <div class="group-section__heading">
                <span class="group-section__title">{{ t('battleLog.ui.sections.gauge') }}</span>
                <span class="group-section__count">{{ group.gauge.length }}</span>
              </div>
              <div class="group-section__list">
                <div
                  v-for="(entry, idx) in group.gauge"
                  :key="idx"
                  class="event-row"
                  :class="{ 'is-jumpable': group.jumpable }"
                  @click="onEventRowClick(group, entry)"
                >
                  <span class="event-row__time">{{
                    formatField('time', formatFrameTime(entry.time))
                  }}</span>
                  <span class="event-pill">{{ getTypeLabel(entry.type) }}</span>
                  <span class="event-value">{{
                    formatField('change', formatSignedNumber(entry.payload.change))
                  }}</span>
                  <span class="event-value">{{
                    formatField('gauge', Number(entry.payload.gauge).toFixed(1))
                  }}</span>
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
                <div
                  v-for="(entry, idx) in group.stagger"
                  :key="idx"
                  class="event-row"
                  :class="{ 'is-jumpable': group.jumpable }"
                  @click="onEventRowClick(group, entry)"
                >
                  <span class="event-row__time">{{
                    formatField('time', formatFrameTime(entry.time))
                  }}</span>
                  <span class="event-pill">{{ getTypeLabel(entry.type) }}</span>
                  <span class="event-value">{{ formatSignedNumber(entry.payload.amount) }}</span>
                  <span class="event-value">{{
                    formatField('stagger', Number(entry.payload.stagger).toFixed(1))
                  }}</span>
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
                  :class="{ 'is-jumpable': group.jumpable }"
                  @click="onEventRowClick(group, entry)"
                >
                  <span class="event-row__time">{{
                    formatField('time', formatFrameTime(entry.time))
                  }}</span>
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
  gap: 8px;
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
  border-radius: 0;
}

.simlog-filters,
.simlog-filters .simlog-preset,
.simlog-filters .simlog-chip,
.simlog-filters .simlog-search,
.simlog-filters :deep(.el-select__wrapper),
.simlog-filters :deep(.el-input__wrapper) {
  border-radius: 0;
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
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.simlog-presets,
.simlog-types-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.simlog-presets {
  padding: 8px 10px;
  border-radius: 0;
  background: rgba(56, 189, 248, 0.04);
  border: 1px solid rgba(56, 189, 248, 0.12);
}

.simlog-presets .simlog-filter-label {
  margin-top: 5px;
  color: #7dd3fc;
}

.simlog-presets__list,
.simlog-types {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.simlog-types-row .simlog-filter-label {
  margin-top: 5px;
}

.simlog-preset {
  --ea-btn-py: 4px;
  --ea-btn-px: 10px;
  --ea-btn-font-size: 11px;
  --ea-btn-bg: rgba(14, 165, 233, 0.06);
  --ea-btn-border: rgba(56, 189, 248, 0.22);
  --ea-btn-color: #bae6fd;
  --ea-btn-bg-hover: rgba(14, 165, 233, 0.12);
  --ea-btn-border-hover: rgba(56, 189, 248, 0.36);
  --ea-btn-color-hover: #e0f2fe;
  border-radius: 0;
  min-height: 24px;
}

.simlog-preset.is-active {
  --ea-btn-bg: rgba(14, 165, 233, 0.16);
  --ea-btn-border: rgba(56, 189, 248, 0.48);
  --ea-btn-color: #7dd3fc;
  --ea-btn-bg-hover: rgba(14, 165, 233, 0.2);
  --ea-btn-border-hover: rgba(56, 189, 248, 0.58);
  --ea-btn-color-hover: #7dd3fc;
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
  border-radius: 0;
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

.group__summary.is-jumpable:hover .group__action {
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 2px;
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

.damage-subgroup {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0 2px;
}

.damage-subgroup + .damage-subgroup {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
}

.damage-subgroup__heading {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.damage-subgroup__title {
  color: rgba(255, 255, 255, 0.62);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.damage-subgroup__count {
  color: #666;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
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

.event-row--stack {
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 4px;
}

.event-row__main {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.event-row.is-jumpable {
  cursor: pointer;
  border-radius: 3px;
  margin: 0 -4px;
  padding-left: 4px;
  padding-right: 4px;
}

.event-row.is-jumpable:hover {
  background: rgba(255, 255, 255, 0.04);
}

.event-row + .event-row {
  border-top: 1px dashed rgba(255, 255, 255, 0.04);
}

.event-lmdi {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-left: 2px;
  padding: 4px 8px;
  border-left: 2px solid rgba(148, 163, 184, 0.35);
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0 3px 3px 0;
}

.event-lmdi__title {
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.event-lmdi__item {
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.72);
}

.event-lmdi__label {
  color: #9aa3b2;
}

.event-lmdi__sep {
  color: #555;
}

.event-lmdi__value {
  color: #d7dde8;
  font-variant-numeric: tabular-nums;
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

.event-pill--skill {
  border-color: rgba(248, 113, 113, 0.28);
  background: rgba(248, 113, 113, 0.08);
  color: #fca5a5;
}

.event-pill--effect {
  border-color: rgba(125, 211, 252, 0.28);
  background: rgba(125, 211, 252, 0.08);
  color: #7dd3fc;
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
  .simlog-filter-top,
  .simlog-filter-bottom,
  .group__summary {
    flex-direction: column;
    align-items: stretch;
  }

  .simlog-filters {
    margin: 0 10px;
  }

  .group__title-row {
    white-space: normal;
  }
}
</style>
