<script setup>
/**
 * Condensed mobile-style timeline card for small-image export.
 * Time-scaled positions; fixed skill-block height (user-tunable).
 */
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTimelineStore } from '@/stores/timelineStore.js';
import { getOperatorGameName } from '@/data/gameText';
import { toLegacyDisplayType } from '@/utils/hitModel';
import { collectActionCombatBadges } from '@/utils/actionCombatIcons';
import { getDisplayKeyCandidates } from '@/utils/effectDisplay';

const DEFAULT_ICON = '/icons/default_icon.webp';

const props = defineProps({
  duration: { type: Number, default: 60 },
  cardWidth: { type: Number, default: 420 },
  blockHeight: { type: Number, default: 22 },
  /** Pixels per second — same idea as main timeline zoom. */
  pxPerSecond: { type: Number, default: 24 },
  showCombatIcons: { type: Boolean, default: true },
  showDurationBars: { type: Boolean, default: true },
  showKeycaps: { type: Boolean, default: true },
  showPrep: { type: Boolean, default: true },
  showTimeTicks: { type: Boolean, default: true },
  watermarkText: { type: String, default: 'Endaxis' },
});

const store = useTimelineStore();
const { t, locale } = useI18n({ useScope: 'global' });
const rootEl = ref(null);

defineExpose({ rootEl });

const tracks = computed(() => {
  const list = Array.isArray(store.tracks) ? store.tracks.slice(0, 4) : [];
  while (list.length < 4) list.push({ id: null, actions: [] });
  return list;
});

const battleDuration = computed(() => Math.max(1, Number(props.duration) || 60));
/** Export duration is battle time only; prep (negative axis) is separate. */
const prepDuration = computed(() => Math.max(0, Number(store.prepDuration) || 0));
const viewStart = computed(() => (props.showPrep ? 0 : prepDuration.value));
const viewEnd = computed(() => prepDuration.value + battleDuration.value);
const contentDuration = computed(() =>
  props.showPrep ? prepDuration.value + battleDuration.value : battleDuration.value,
);

const pxPerSecond = computed(() => {
  const n = Number(props.pxPerSecond);
  if (!Number.isFinite(n)) return 24;
  return Math.min(40, Math.max(6, n));
});

const timelineHeightPx = computed(() =>
  Math.max(120, Math.ceil(contentDuration.value * pxPerSecond.value)),
);

const battleStartYPx = computed(() => {
  if (!props.showPrep) return 0;
  const prep = prepDuration.value;
  if (prep <= 0) return 0;
  return Math.round(prep * pxPerSecond.value);
});
const showPrepVisual = computed(
  () => props.showPrep && prepDuration.value > 0 && battleStartYPx.value > 0,
);

function timeToY(viewTime) {
  return ((Number(viewTime) || 0) - viewStart.value) * pxPerSecond.value;
}

function isInExportWindow(viewTime) {
  const t = Number(viewTime) || 0;
  return t >= viewStart.value - 0.05 && t <= viewEnd.value + 0.05;
}

function toRgba(color, alpha) {
  const a = Number(alpha);
  const clamped = Number.isFinite(a) ? Math.min(1, Math.max(0, a)) : 1;
  const s = String(color || '').trim();
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map(ch => ch + ch)
            .join('')
        : hex;
    if (full.length === 6) {
      const r = parseInt(full.slice(0, 2), 16);
      const g = parseInt(full.slice(2, 4), 16);
      const b = parseInt(full.slice(4, 6), 16);
      if ([r, g, b].every(v => Number.isFinite(v))) {
        return `rgba(${r}, ${g}, ${b}, ${clamped})`;
      }
    }
  }
  return `rgba(255, 255, 255, ${clamped})`;
}

function withBaseUrl(input) {
  const s = String(input || '').trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const baseUrl = import.meta.env.BASE_URL || '/';
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  if (s.startsWith('/')) return `${base}${s}`;
  return `${base}/${s}`;
}

function onAssetError(evt) {
  try {
    evt.target.src = withBaseUrl(DEFAULT_ICON);
  } catch {
    // ignore
  }
}

function getTrackAvatar(track) {
  const id = track?.id;
  const roster = Array.isArray(store.characterRoster) ? store.characterRoster : [];
  const found = roster.find(c => c && c.id === id);
  return found?.avatar || DEFAULT_ICON;
}

function getTrackName(track) {
  void locale.value;
  const id = track?.id;
  if (!id) return t('common.unknown');
  return getOperatorGameName(id, locale.value) || id || t('common.unknown');
}

function getCompiledAction(action) {
  const id = action?.instanceId;
  if (!id) return null;
  return store.compiledTimeline?.actionMap?.get(id) || null;
}

function getVisualActionStartTime(action) {
  const resolved = getCompiledAction(action);
  return Number(resolved?.realStartTime ?? action?.startTime) || 0;
}

function getVisualActionEndTime(action) {
  const id = action?.instanceId;
  const storeEnd =
    typeof store.getActionVisualEndTime === 'function' ? store.getActionVisualEndTime(id) : null;
  const normalizedStoreEnd = Number(storeEnd);
  if (Number.isFinite(normalizedStoreEnd)) return normalizedStoreEnd;
  const start = getVisualActionStartTime(action);
  const dur = Number(action?.duration);
  return start + (Number.isFinite(dur) && dur > 0 ? dur : 0.1);
}

function getActionColor(action, trackId = null) {
  const node = getCompiledAction(action)?.node || action;
  if (node?.customColor) return node.customColor;
  if (node?.type === 'comboSkill') return store.getColor('link');
  if (node?.type === 'finisher') return store.getColor('execution');
  if (node?.type === 'basicAttack') return store.getColor('attack');
  if (node?.type === 'dive') return store.getColor('dodge');
  if (node?.element) return store.getColor(node.element);
  if (trackId && typeof store.getCharacterElementColor === 'function') {
    return store.getCharacterElementColor(trackId);
  }
  return store.getColor('default');
}

function getTypeLabel(action) {
  if (action?.kind === 'attack_segment') {
    const total = Number(action.attackSequenceTotal) || 0;
    const idx = Number(action.attackSequenceIndex) || 0;
    if (total > 0 && idx === total) {
      const named = String(action.name || '').trim();
      if (named) return named;
      return t('skillType.heavyAttack');
    }
  }
  const named = String(action?.name || '').trim();
  if (named && action?.kind !== 'attack_segment') return named;
  const type = toLegacyDisplayType(action?.type || 'unknown');
  const key = `skillType.${type}`;
  const out = t(key);
  return out === key ? String(type) : out;
}

function getVisibleActions(track) {
  const list = Array.isArray(track?.actions) ? track.actions : [];
  return list.filter(action => {
    if (!action) return false;
    if ((action.triggerWindow || 0) < 0) return false;
    const start = getVisualActionStartTime(action);
    if (!isInExportWindow(start)) return false;
    if (action.kind === 'attack_segment') {
      const total = Number(action.attackSequenceTotal) || 0;
      const idx = Number(action.attackSequenceIndex) || 0;
      if (total > 0 && idx > 0) return idx === total;
    }
    return true;
  });
}

function getActionStyle(action, track, index) {
  const start = getVisualActionStartTime(action);
  const top = timeToY(start);
  const height = Math.max(12, Number(props.blockHeight) || 22);
  const node = getCompiledAction(action)?.node || action;
  const color = getActionColor(action, track?.id);
  const isDisabled = !!action?.isDisabled;
  const isAttack = node?.type === 'basicAttack' || toLegacyDisplayType(node?.type) === 'attack';

  return {
    top: `${top}px`,
    height: `${height}px`,
    borderColor: toRgba(color, isAttack ? 0.45 : 0.9),
    backgroundColor: toRgba(color, isAttack ? 0.08 : 0.22),
    boxShadow: isDisabled || isAttack ? 'none' : `0 0 6px ${toRgba(color, 0.14)}`,
    opacity: isDisabled ? 0.45 : 1,
    zIndex: 10 + index,
  };
}

function collectBadgesForAction(track, action) {
  if (!props.showCombatIcons && !props.showDurationBars) return [];
  const node = getCompiledAction(action)?.node || action;
  const start = getVisualActionStartTime(action);
  const end = Math.min(viewEnd.value, getVisualActionEndTime(action));
  return collectActionCombatBadges({
    action: node,
    trackId: track?.id || null,
    startTime: start,
    endTime: end,
    viz: store.enemyAfflictionViz,
    iconDatabase: store.iconDatabase,
  });
}

function getVisibleActionEntries(track) {
  return getVisibleActions(track).map((action, index) => {
    const allBadges = collectBadgesForAction(track, action);
    return {
      action,
      index,
      badges: props.showCombatIcons ? allBadges : [],
      durationBars: props.showDurationBars
        ? allBadges
            .filter(badge => !badge.isMarker && badge.duration > 0)
            .map((badge, lane) => ({
              ...badge,
              lane,
              color: typeof store.getColor === 'function' ? store.getColor(badge.key) : '#aaaaaa',
            }))
        : [],
    };
  });
}

function getDurationBarStyle(bar) {
  const start = Number(bar.startTime) || 0;
  const end =
    bar.endTime != null && Number.isFinite(Number(bar.endTime))
      ? Number(bar.endTime)
      : start + (Number(bar.duration) || 0);
  const top = Math.round(timeToY(start));
  const bottom = Math.round(timeToY(Math.min(viewEnd.value, end)));
  const height = Math.max(8, bottom - top);
  const lane = Number(bar.lane) || 0;
  return {
    top: `${top}px`,
    height: `${height}px`,
    right: `${1 + lane * 8}px`,
    color: bar.color || '#aaaaaa',
  };
}

function formatBadgeDuration(duration) {
  if (typeof store.formatTimeLabel === 'function') {
    return store.formatTimeLabel(duration);
  }
  const n = Number(duration);
  if (!Number.isFinite(n)) return '';
  return `${(Math.round(n * 1000) / 1000).toFixed(3).replace(/\.?0+$/, '')}s`;
}

function getCombatIconTitle(typeKey) {
  void locale.value;
  for (const candidate of getDisplayKeyCandidates(typeKey)) {
    const localeKey = `effects.name.${candidate}`;
    const out = t(localeKey);
    if (out !== localeKey) return out;
  }
  return String(typeKey || '');
}

const PERFECT_LINK_STATUS_IDS = new Set(['rossi-combo-perfect-timing-satisfied']);

function isPerfectLinkAction(action) {
  if (!action || toLegacyDisplayType(action.type) !== 'link') return false;
  const id = action.instanceId;
  if (!id) return false;
  return (store.operatorLog || []).some(
    entry =>
      entry?.type === 'OPERATOR_EFFECT_APPLY' &&
      entry?.actionId === id &&
      PERFECT_LINK_STATUS_IDS.has(entry?.id),
  );
}

const operationLayout = computed(() => {
  const leftRailW = props.showTimeTicks ? 36 : 0;

  if (!props.showKeycaps) {
    return {
      items: [],
      vars: {
        '--rail-w': `${leftRailW}px`,
        '--opw': '0px',
        '--capw': '0px',
        '--capfs': '8px',
        '--capgap': '0px',
      },
    };
  }

  const out = [];
  const maxT = viewEnd.value;
  const minT = viewStart.value;
  tracks.value.forEach((track, index) => {
    if (!track?.id) return;
    const keyNum = index + 1;
    for (const action of getVisibleActions(track)) {
      const displayType = toLegacyDisplayType(action.type);
      let label = '';
      let isHold = false;
      let customClass = '';
      if (displayType === 'skill') {
        label = `${keyNum}`;
        customClass = 'op-skill';
      } else if (displayType === 'link') {
        label = 'E';
        customClass = 'op-link';
      } else if (displayType === 'ultimate') {
        label = `${keyNum}H`;
        isHold = true;
        customClass = 'op-ultimate';
      } else {
        continue;
      }
      const y = Math.round(timeToY(getVisualActionStartTime(action)));
      out.push({
        id: `op-${action.instanceId}`,
        y,
        label,
        isHold,
        customClass,
        perfectLink: isPerfectLinkAction(action),
      });
    }
    for (const sw of store.switchEvents || []) {
      if (!sw || sw.characterId !== track.id) continue;
      const t0 = Number(sw.time) || 0;
      if (t0 < minT - 0.05 || t0 > maxT + 0.05) continue;
      out.push({
        id: `op-sw-${sw.id}`,
        y: Math.round(timeToY(t0)),
        label: `F${keyNum}`,
        isHold: false,
        customClass: 'op-switch',
      });
    }
  });
  out.sort((a, b) => a.y - b.y);

  const CAP_H = 12;
  const GAP_Y = 1;
  const laneBottom = [];
  const placed = [];
  for (const m of out) {
    const top = m.y;
    let lane = -1;
    for (let i = 0; i < laneBottom.length; i++) {
      if (top >= laneBottom[i] + GAP_Y) {
        lane = i;
        break;
      }
    }
    if (lane < 0) {
      lane = laneBottom.length;
      laneBottom.push(-Infinity);
    }
    laneBottom[lane] = m.y + CAP_H;
    placed.push({ ...m, lane });
  }

  const laneCountClamped = Math.min(4, Math.max(1, laneBottom.length));
  // Fixed cap size — do not stretch to fill the rail (keeps borders + centered text).
  const CAP_GAP = 2;
  const CAP_W = 16;
  const PAD_X = 10; // left + right inset so borders stay visible
  const contentW = laneCountClamped * CAP_W + (laneCountClamped - 1) * CAP_GAP;
  const opW = contentW + PAD_X;

  return {
    items: placed
      .filter(m => m.lane < laneCountClamped)
      .map(m => ({ ...m, lane: Math.min(m.lane, laneCountClamped - 1) })),
    vars: {
      '--rail-w': `${leftRailW}px`,
      '--opw': `${opW}px`,
      '--capw': `${CAP_W}px`,
      '--capfs': '8px',
      '--capgap': `${CAP_GAP}px`,
      '--op-pad': '5px',
    },
  };
});

const timeTicks = computed(() => {
  const battleDur = battleDuration.value;
  const prep = prepDuration.value;
  const step = battleDur <= 30 ? 1 : battleDur <= 90 ? 5 : 10;
  const ticks = [];
  const battleStart = props.showPrep ? -prep : 0;

  for (let battleT = battleStart; battleT <= battleDur + 0.0001; battleT += step) {
    const snappedBattle = Math.round(battleT * 1000) / 1000;
    if (snappedBattle < battleStart - 0.0001 || snappedBattle > battleDur + 0.0001) continue;
    const viewT = prep + snappedBattle;
    const isBattleStart = props.showPrep && prep > 0 && Math.abs(snappedBattle) < 0.0001;
    ticks.push({
      v: viewT,
      y: Math.round(timeToY(viewT)),
      isBattleStart,
      isMajor:
        isBattleStart ||
        snappedBattle % (step * 2) === 0 ||
        Math.abs(snappedBattle) < 0.0001 ||
        Math.abs(snappedBattle - battleDur) < 0.0001,
    });
  }

  if (props.showPrep && prep > 0) {
    const viewT = prep;
    ticks.push({
      v: viewT,
      y: Math.round(timeToY(viewT)),
      isBattleStart: true,
      isMajor: true,
    });
  }

  const byY = new Map();
  for (const item of ticks) {
    const prev = byY.get(item.y);
    if (!prev || item.isBattleStart || item.isMajor) byY.set(item.y, item);
  }
  return Array.from(byY.values()).sort((a, b) => a.y - b.y);
});

const rootStyle = computed(() => {
  const bodyH = timelineHeightPx.value;
  // Keep total card height explicit so long exports (120s) don't collapse
  // inside scroll/flex parents during preview or snapdom capture.
  const headerH = 52;
  return {
    width: `${Math.max(280, Math.min(540, Number(props.cardWidth) || 420))}px`,
    height: `${headerH + bodyH}px`,
    '--sec-px': `${pxPerSecond.value}px`,
    ...operationLayout.value.vars,
  };
});

const gridStyle = computed(() => ({
  height: `${timelineHeightPx.value}px`,
  flex: '0 0 auto',
}));

function formatAxisLabel(viewTime) {
  if (typeof store.formatAxisTimeLabel === 'function') {
    return store.formatAxisTimeLabel(viewTime);
  }
  return `${Math.round(Number(viewTime) || 0)}s`;
}
</script>

<template>
  <div ref="rootEl" class="share-card" :style="rootStyle">
    <div class="share-card__header">
      <div v-if="showTimeTicks" class="share-card__time-head">{{ t('timeline.mobile.time') }}</div>
      <div v-else class="share-card__time-head is-spacer"></div>
      <div v-for="(track, idx) in tracks" :key="idx" class="share-card__track-head">
        <div class="share-card__avatar" :class="{ 'is-empty': !track?.id }">
          <img
            :src="withBaseUrl(getTrackAvatar(track))"
            :alt="getTrackName(track)"
            @error="onAssetError"
          />
        </div>
      </div>
      <div v-if="showKeycaps" class="share-card__op-head"></div>
      <div v-else class="share-card__op-head is-spacer"></div>
    </div>

    <div class="share-card__body" :style="gridStyle">
      <div v-if="showTimeTicks" class="share-card__rail">
        <div
          v-if="showPrepVisual"
          class="share-card__prep"
          :style="{ height: `${battleStartYPx}px` }"
        ></div>
        <div
          v-if="showPrepVisual"
          class="share-card__battle-line"
          :style="{ top: `${battleStartYPx}px` }"
        ></div>

        <div class="share-card__ticks">
          <div
            v-for="tick in timeTicks"
            :key="`${tick.v}-${tick.y}`"
            class="share-card__tick"
            :class="{ 'is-battle-start': tick.isBattleStart && showPrep, 'is-major': tick.isMajor }"
            :style="{ top: `${tick.y}px` }"
          >
            <div class="share-card__tick-mark"></div>
            <div class="share-card__tick-label">{{ formatAxisLabel(tick.v) }}</div>
          </div>
        </div>
      </div>
      <div v-else class="share-card__rail is-spacer"></div>

      <div class="share-card__tracks">
        <div
          v-if="showPrepVisual"
          class="share-card__prep share-card__prep--grid"
          :style="{ height: `${battleStartYPx}px` }"
        >
          <span>{{ t('timelineGrid.prep.title') }}</span>
        </div>
        <div
          v-if="showPrepVisual"
          class="share-card__battle-line"
          :style="{ top: `${battleStartYPx}px` }"
        ></div>

        <div v-for="(track, idx) in tracks" :key="idx" class="share-card__col">
          <div class="share-card__actions">
            <template v-for="entry in getVisibleActionEntries(track)" :key="entry.action.instanceId">
              <div
                v-for="bar in entry.durationBars"
                :key="`dur_${entry.action.instanceId}_${bar.id}`"
                class="share-card__cd-ibar"
                :style="getDurationBarStyle(bar)"
              >
                <div class="share-card__cd-ibar-start"></div>
                <div class="share-card__cd-ibar-line"></div>
                <div class="share-card__cd-ibar-end"></div>
                <span class="share-card__cd-ibar-text">{{ formatBadgeDuration(bar.duration) }}</span>
              </div>

              <div class="share-card__action" :style="getActionStyle(entry.action, track, entry.index)">
                <span class="share-card__action-text">{{ getTypeLabel(entry.action) }}</span>
                <div v-if="entry.badges.length" class="share-card__icons">
                  <div
                    v-for="badge in entry.badges"
                    :key="`${entry.action.instanceId}_${badge.id}`"
                    class="share-card__icon-box"
                    :title="getCombatIconTitle(badge.key)"
                  >
                    <img
                      class="share-card__icon"
                      :src="withBaseUrl(badge.icon)"
                      :alt="getCombatIconTitle(badge.key)"
                      @error="onAssetError"
                    />
                    <span class="share-card__stacks">{{ badge.stacks }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div v-if="showKeycaps" class="share-card__op-rail">
        <div class="share-card__op-layer">
          <div
            v-for="op in operationLayout.items"
            :key="op.id"
            class="share-card__key"
            :class="[op.customClass, { 'is-hold': op.isHold, 'is-perfect-link': op.perfectLink }]"
            :style="{ top: `${op.y}px`, '--lane': op.lane }"
          >
            <span>{{ op.label }}</span>
          </div>
        </div>
      </div>
      <div v-else class="share-card__op-rail is-spacer"></div>
    </div>

    <div class="share-card__watermark">{{ watermarkText || 'Endaxis' }}</div>
  </div>
</template>

<style scoped>
.share-card {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: #121218;
  color: #fff;
  border: 1px solid rgba(255, 215, 0, 0.22);
  overflow: hidden;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.share-card__header {
  display: grid;
  grid-template-columns: var(--rail-w, 0px) repeat(4, minmax(0, 1fr)) var(--opw, 0px);
  gap: 0;
  padding: 6px 4px 8px;
  background: #0c0c10;
  border-bottom: 1px solid rgba(255, 215, 0, 0.18);
  flex: 0 0 auto;
}

.share-card__time-head {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.55);
}

.share-card__track-head {
  display: flex;
  justify-content: center;
}

.share-card__avatar {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
}
.share-card__avatar.is-empty {
  opacity: 0.35;
}
.share-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.share-card__body {
  position: relative;
  display: grid;
  grid-template-columns: var(--rail-w, 0px) minmax(0, 1fr) var(--opw, 0px);
  width: 100%;
  overflow: visible;
  flex: 0 0 auto;
}

.share-card__rail {
  position: relative;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
}
.share-card__rail.is-spacer,
.share-card__op-rail.is-spacer,
.share-card__time-head.is-spacer,
.share-card__op-head.is-spacer {
  border: none;
  background: transparent;
  padding: 0;
  min-width: 0;
  width: 0;
  overflow: hidden;
}

.share-card__op-rail {
  position: relative;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.18);
  box-sizing: border-box;
  overflow: visible;
}

.share-card__op-head {
  min-width: 0;
}

.share-card__prep {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  pointer-events: none;
  z-index: 1;
}
.share-card__prep--grid {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.38);
  z-index: 2;
}

.share-card__battle-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.38);
  border-top: none;
  transform: translateY(-1px);
  z-index: 5;
  pointer-events: none;
}

.share-card__op-layer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  right: var(--op-pad, 4px);
  width: auto;
  pointer-events: none;
  z-index: 6;
}

.share-card__key {
  position: absolute;
  left: calc(var(--lane, 0) * (var(--capw, 16px) + var(--capgap, 2px)));
  width: var(--capw, 16px);
  min-width: var(--capw, 16px);
  max-width: var(--capw, 16px);
  height: 12px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #444;
  border: 1px solid #666;
  border-radius: 2px;
  color: #fff;
  font-weight: 700;
  font-family: Consolas, Monaco, monospace;
  font-size: var(--capfs, 8px);
  line-height: 1;
  overflow: hidden;
  opacity: 0.92;
}
.share-card__key.op-skill {
  background: #3a3a3a;
  border-color: #888;
  color: #fff;
}
.share-card__key.op-link {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
  color: #ffd700;
}
.share-card__key.op-link.is-perfect-link {
  background: rgba(255, 236, 122, 0.36);
  border-color: #fff2a8;
  color: #fff7cf;
  box-shadow:
    0 0 0 1px rgba(255, 242, 168, 0.85),
    0 0 8px rgba(255, 215, 0, 0.75);
}
.share-card__key.op-ultimate,
.share-card__key.is-hold {
  background: #3a3a3a;
  border-color: #888;
  color: #fff;
}
.share-card__key.op-switch {
  background: rgba(211, 173, 255, 0.2);
  border-color: #d3adff;
  color: #d3adff;
}

.share-card__ticks {
  position: absolute;
  inset: 0;
  padding: 0 2px 0 4px;
  pointer-events: none;
  z-index: 4;
}

.share-card__tick {
  position: absolute;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  --mark-color: rgba(255, 255, 255, 0.22);
}
.share-card__tick.is-major {
  --mark-color: rgba(255, 255, 255, 0.45);
}
.share-card__tick.is-battle-start {
  --mark-color: rgba(255, 255, 255, 0.7);
}
.share-card__tick-mark {
  width: 4px;
  height: 1px;
  background: var(--mark-color);
  flex: 0 0 auto;
}
.share-card__tick-label {
  font-size: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  line-height: 1;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.9);
}
.share-card__tick.is-battle-start .share-card__tick-label {
  color: rgba(255, 255, 255, 0.82);
}

.share-card__tracks {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.04) 0px,
    rgba(255, 255, 255, 0.04) 1px,
    transparent 1px,
    transparent var(--sec-px)
  );
}

.share-card__col {
  position: relative;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}
.share-card__col:first-child {
  border-left: none;
}

.share-card__actions {
  position: absolute;
  inset: 0;
  z-index: 3;
}

.share-card__cd-ibar {
  position: absolute;
  width: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  z-index: 2;
}

.share-card__cd-ibar-line {
  flex: 1 1 auto;
  width: 2px;
  background: currentColor;
  opacity: 0.9;
}

.share-card__cd-ibar-start,
.share-card__cd-ibar-end {
  width: 7px;
  height: 1px;
  background: currentColor;
  flex: 0 0 auto;
}

.share-card__cd-ibar-text {
  position: absolute;
  left: 5px;
  top: 0;
  font-size: 8px;
  font-weight: 800;
  line-height: 1;
  color: currentColor;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
}

.share-card__action {
  position: absolute;
  left: 2px;
  right: 2px;
  border: 1px solid transparent;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.share-card__action-text {
  font-size: 10px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
  letter-spacing: 0.4px;
  text-align: center;
  max-width: 100%;
  position: relative;
  z-index: 1;
}

.share-card__icons {
  position: absolute;
  right: 1px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 2px;
  pointer-events: none;
  z-index: 2;
}

.share-card__icon-box {
  position: relative;
  width: 16px;
  height: 16px;
}

.share-card__icon {
  width: 16px;
  height: 16px;
  display: block;
  object-fit: contain;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.85));
}

.share-card__stacks {
  position: absolute;
  right: -3px;
  bottom: -3px;
  min-width: 9px;
  padding: 0 2px;
  background: rgba(0, 0, 0, 0.85);
  color: #ffd700;
  font-size: 8px;
  line-height: 1;
  font-weight: 800;
  text-align: center;
}

.share-card__watermark {
  position: absolute;
  right: 8px;
  bottom: 6px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: rgba(255, 215, 0, 0.35);
  pointer-events: none;
  z-index: 20;
}
</style>
