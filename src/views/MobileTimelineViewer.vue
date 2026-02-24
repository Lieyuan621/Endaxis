<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElAlert, ElDialog, ElInput, ElMessage, ElButton, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessageBox } from 'element-plus'
import { useTimelineStore } from '@/stores/timelineStore.js'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'

const store = useTimelineStore()
const { t, locale } = useI18n({ useScope: 'global' })

const loadoutOpen = ref(false)
const loadoutTrackIndex = ref(null)

const actionInfoOpen = ref(false)
const selectedActionId = ref(null)

const importVisible = ref(false)
const shareCode = ref('')
const importing = ref(false)

const aboutVisible = ref(false)
const aboutLoaded = ref(false)
const aboutAnnouncement = ref({
  subtitle: '',
  systemInfoP1: '',
  systemInfoP2: '',
})

const scenarioList = computed(() => (Array.isArray(store.scenarioList) ? store.scenarioList : []))
const activeScenarioId = computed({
  get: () => store.activeScenarioId,
  set: (nextId) => store.switchScenario(nextId),
})

const tracks = computed(() => (Array.isArray(store.tracks) ? store.tracks.slice(0, 4) : []))
const pxPerSecond = computed(() => {
  const raw = Number(store.timeBlockWidth) || 50
  return Math.min(Math.max(raw, 20), 80)
})

const COLLAPSED_PREP_PX = 18

function toRgba(color, alpha) {
  const a = Number(alpha)
  const clamped = Number.isFinite(a) ? Math.min(1, Math.max(0, a)) : 1
  const s = String(color || '').trim()

  if (s.startsWith('#')) {
    const hex = s.slice(1)
    const full = hex.length === 3
      ? hex.split('').map((ch) => ch + ch).join('')
      : hex

    if (full.length === 6) {
      const r = parseInt(full.slice(0, 2), 16)
      const g = parseInt(full.slice(2, 4), 16)
      const b = parseInt(full.slice(4, 6), 16)
      if ([r, g, b].every((v) => Number.isFinite(v))) {
        return `rgba(${r}, ${g}, ${b}, ${clamped})`
      }
    }
  }

  return `rgba(255, 255, 255, ${clamped})`
}

function timeToY(time) {
  const v = Number(time) || 0
  const prep = Math.max(0, Number(store.prepDuration) || 0)
  const expanded = store.prepExpanded !== false

  if (prep <= 0 || expanded) return v * pxPerSecond.value
  if (v <= prep) return (v / prep) * COLLAPSED_PREP_PX
  return COLLAPSED_PREP_PX + (v - prep) * pxPerSecond.value
}

const viewDuration = computed(() => Number(store.viewDuration) || 0)
const timelineHeightPx = computed(() => Math.max(0, Math.ceil(timeToY(viewDuration.value))))
const prepDuration = computed(() => Math.max(0, Number(store.prepDuration) || 0))
const battleStartYPx = computed(() => Math.max(0, Math.round(timeToY(prepDuration.value))))
const prepHeightPx = computed(() => battleStartYPx.value)

function enforceMobilePrepExpanded() {
  store.prepExpanded = true
}

onMounted(() => {
  enforceMobilePrepExpanded()
  try {
    document?.body?.classList?.add('endaxis-mobile-viewer')
  } catch {
    // ignore
  }
})

onUnmounted(() => {
  try {
    document?.body?.classList?.remove('endaxis-mobile-viewer')
  } catch {
    // ignore
  }
})

async function loadAboutAnnouncement() {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/'
    const url = baseUrl.endsWith('/') ? `${baseUrl}announcement.json` : `${baseUrl}/announcement.json`

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return false

    const json = await res.json()
    const next = (json && typeof json === 'object' && json.default && typeof json.default === 'object')
      ? json.default
      : json

    if (next && typeof next === 'object') {
      aboutAnnouncement.value = {
        ...aboutAnnouncement.value,
        ...(typeof next.subtitle === 'string' ? { subtitle: next.subtitle } : {}),
        ...(typeof next.systemInfoP1 === 'string' ? { systemInfoP1: next.systemInfoP1 } : {}),
        ...(typeof next.systemInfoP2 === 'string' ? { systemInfoP2: next.systemInfoP2 } : {}),
      }
    }

    aboutLoaded.value = true
    return true
  } catch {
    return false
  }
}

async function openAbout() {
  aboutVisible.value = true
  if (!aboutLoaded.value) {
    await loadAboutAnnouncement()
  }
}

function changeLocale(next) {
  locale.value = setLocale(next)
}

function handleReset() {
  ElMessageBox.confirm(
    t('timeline.reset.confirm'),
    t('common.warning'),
    {
      confirmButtonText: t('timeline.reset.confirmButton'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
      lockScroll: false,
    },
  ).then(() => {
    store.resetProject()
    ElMessage.success(t('timeline.reset.done'))
  }).catch(() => {})
}

function handleMoreCommand(command) {
  if (command === 'about') {
    openAbout()
    return
  }
  if (command === 'import') {
    importVisible.value = true
    return
  }
  if (command === 'reset') {
    handleReset()
    return
  }
  if (typeof command === 'string' && command.startsWith('locale:')) {
    changeLocale(command.slice('locale:'.length))
  }
}

function getTrackAvatar(track) {
  const id = track?.id
  const roster = Array.isArray(store.characterRoster) ? store.characterRoster : []
  const found = roster.find((c) => c && c.id === id)
  return found?.avatar || '/avatars/default.webp'
}

function withBaseUrl(input) {
  const s = String(input || '').trim()
  if (!s) return ''

  if (/^https?:\/\//i.test(s)) return s

  const baseUrl = import.meta.env.BASE_URL || '/'
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

  if (s.startsWith('/')) return `${base}${s}`
  return `${base}/${s}`
}

function onAssetError(evt) {
  try {
    evt.target.src = withBaseUrl('/avatars/default.webp')
  } catch {
    // ignore
  }
}

function getTrackName(track) {
  const id = track?.id
  const roster = Array.isArray(store.characterRoster) ? store.characterRoster : []
  const found = roster.find((c) => c && c.id === id)
  return found?.name || (id || t('common.unknown'))
}

function openLoadout(index) {
  const i = Number(index)
  if (!Number.isFinite(i) || i < 0 || i >= tracks.value.length) return

  const track = tracks.value[i]
  if (!track?.id) return

  loadoutTrackIndex.value = i
  loadoutOpen.value = true
}

const selectedTrack = computed(() => {
  const i = Number(loadoutTrackIndex.value)
  if (!Number.isFinite(i)) return null
  return tracks.value[i] || null
})

const selectedWeapon = computed(() => {
  const id = selectedTrack.value?.weaponId
  if (!id || typeof store.getWeaponById !== 'function') return null
  return store.getWeaponById(id) || null
})

function formatSlotLabel(slot) {
  void locale.value
  const modifierId = slot?.modifierId || slot?.key
  if (!modifierId) return t('common.noneParen')
  const sizeLabel = slot.size === 'large'
    ? t('common.size.large')
    : (slot.size === 'medium' ? t('common.size.medium') : t('common.size.small'))
  return `${store.getModifierLabel(modifierId)} · ${sizeLabel}`
}

function formatTierLabel(val) {
  const n = Number(val)
  if (!Number.isFinite(n)) return '-'
  return `${n}${t('common.levelSuffix')}`
}

const selectedWeaponSlot1Label = computed(() => formatSlotLabel(selectedWeapon.value?.commonSlots?.[0]))
const selectedWeaponSlot2Label = computed(() => formatSlotLabel(selectedWeapon.value?.commonSlots?.[1]))
const selectedWeaponBuffKeysLabel = computed(() => {
  void locale.value
  const list = Array.isArray(selectedWeapon.value?.buffBonuses) ? selectedWeapon.value.buffBonuses : []
  const ids = list.map(b => b?.modifierId || b?.key).filter(Boolean)
  if (ids.length === 0) return t('common.noneParen')
  return ids.map(k => store.getModifierLabel(k)).join('、')
})

const equipmentSlots = computed(() => {
  void locale.value
  const track = selectedTrack.value
  if (!track) return []

  const resolve = (slotKey, id, refineTier) => {
    const item = (typeof store.getEquipmentById === 'function') ? store.getEquipmentById(id) : null
    const level = item?.level !== undefined ? Number(item.level) : null
    const is70 = level === 70
    return {
      slotKey,
      slotLabel: t(`timeline.mobile.loadout.slot.${slotKey}`),
      id: id || null,
      item,
      level: Number.isFinite(level) ? level : null,
      refineTier: is70 ? (Number(refineTier) || 0) : null,
    }
  }

  return [
    resolve('armor', track.equipArmorId, track.equipArmorRefineTier),
    resolve('gloves', track.equipGlovesId, track.equipGlovesRefineTier),
    resolve('accessory1', track.equipAccessory1Id, track.equipAccessory1RefineTier),
    resolve('accessory2', track.equipAccessory2Id, track.equipAccessory2RefineTier),
  ]
})

function getTypeLabel(action) {
  const type = action?.type || 'unknown'
  const key = `skillType.${type}`
  const out = t(key)
  return out === key ? String(type) : out
}

function formatSec(val) {
  const n = Number(val)
  if (!Number.isFinite(n)) return '-'
  return (Math.round(n * 1000) / 1000).toFixed(3).replace(/\.?0+$/, '')
}

function formatAxisLabel(viewTime) {
  if (typeof store.formatAxisTimeLabel === 'function') {
    return store.formatAxisTimeLabel(viewTime)
  }
  return `${formatSec(viewTime)}s`
}

function getActionColor(action) {
  const type = action?.type
  if (typeof store.getColor === 'function') return store.getColor(type || 'default')
  return '#8c8c8c'
}

function normalizeDuration(action) {
  const base = Number(action?.duration)
  if (Number.isFinite(base) && base > 0) return base
  return 0.1
}

function getActionStyle(action) {
  const start = Number(action?.startTime) || 0
  const duration = normalizeDuration(action)
  const top = timeToY(start)
  const bottom = timeToY(start + duration)
  const height = Math.max(16, bottom - top)

  const color = getActionColor(action)
  const isDisabled = !!action?.isDisabled
  const isAttack = action?.type === 'attack'

  return {
    top: `${top}px`,
    height: `${height}px`,
    borderColor: toRgba(color, isAttack ? 0.45 : 0.9),
    backgroundColor: toRgba(color, isAttack ? 0.06 : 0.18),
    boxShadow: isDisabled || isAttack ? 'none' : `0 0 8px ${toRgba(color, 0.16)}`,
    opacity: isDisabled ? 0.45 : 1,
  }
}

function getVisibleActions(track) {
  const list = Array.isArray(track?.actions) ? track.actions : []
  return list.filter((action) => {
    if (!action) return false

    if (action.kind === 'attack_segment') {
      const total = Number(action.attackSequenceTotal) || 0
      const idx = Number(action.attackSequenceIndex) || 0
      if (total > 0 && idx > 0) return idx === total
    }

    return true
  })
}

function openActionInfo(instanceId) {
  const id = String(instanceId || '').trim()
  if (!id) return
  selectedActionId.value = id
  actionInfoOpen.value = true
}

const resolvedAction = computed(() => {
  const id = String(selectedActionId.value || '').trim()
  if (!id) return null

  const timeline = store.compiledTimeline
  const map = timeline?.actionMap
  if (!map || typeof map.get !== 'function') return null
  return map.get(id) || null
})

const resolvedActionEndTime = computed(() => {
  if (!resolvedAction.value) return null
  return (Number(resolvedAction.value.realStartTime) || 0) + (Number(resolvedAction.value.realDuration) || 0)
})

const resolvedOperator = computed(() => {
  const id = resolvedAction.value?.trackId
  if (!id) return null
  const roster = Array.isArray(store.characterRoster) ? store.characterRoster : []
  const found = roster.find((c) => c && c.id === id)
  return {
    id,
    name: found?.name || id,
    avatar: found?.avatar || '/avatars/default.webp',
  }
})

watch(() => store.compiledTimeline, () => {
  if (!actionInfoOpen.value) return
  if (!resolvedAction.value) {
    actionInfoOpen.value = false
    selectedActionId.value = null
  }
})

const gridStyle = computed(() => {
  const secPx = pxPerSecond.value
  return {
    height: `${timelineHeightPx.value}px`,
    '--sec-px': `${secPx}px`,
  }
})

const timeTicks = computed(() => {
  const duration = viewDuration.value
  const step = 1
  if (!Number.isFinite(duration) || duration <= 0) return []

  const ticks = []
  const max = Math.floor(duration)
  const prep = prepDuration.value
  for (let v = 0; v <= max; v += step) {
    const isBattleStart = prep > 0 && Math.abs(v - prep) < 0.0001
    const isMajor = isBattleStart || v % 5 === 0
    ticks.push({ v, y: Math.round(timeToY(v)), isBattleStart, isMajor })
  }
  if (prep > 0) {
    ticks.push({ v: prep, y: Math.round(timeToY(prep)), isBattleStart: true, isMajor: true })
  }

  const byY = new Map()
  for (const item of ticks) {
    const k = item.y
    const prev = byY.get(k)
    if (!prev || item.isBattleStart || item.isMajor) byY.set(k, item)
  }

  return Array.from(byY.values()).sort((a, b) => a.y - b.y)
})

const operationHintsRaw = computed(() => {
  const out = []
  const safeTracks = tracks.value

  safeTracks.forEach((track, index) => {
    if (!track?.id) return
    const keyNum = index + 1

    const actions = Array.isArray(track.actions) ? track.actions : []
    for (const action of actions) {
      if (!action) continue
      if ((action.triggerWindow || 0) < 0) continue

      let label = ''
      let isHold = false
      let customClass = ''

      if (action.type === 'skill') {
        label = `${keyNum}`
        customClass = 'op-skill'
      } else if (action.type === 'link') {
        label = 'E'
        customClass = 'op-link'
      } else if (action.type === 'ultimate') {
        label = `${keyNum}H`
        isHold = true
        customClass = 'op-ultimate'
      } else {
        continue
      }

      const y = Math.round(timeToY(action.startTime || 0))
      out.push({
        id: `op-${action.instanceId}`,
        y,
        label,
        isHold,
        customClass,
      })
    }

    const switchEvents = Array.isArray(store.switchEvents) ? store.switchEvents : []
    for (const sw of switchEvents) {
      if (!sw || sw.characterId !== track.id) continue
      const y = Math.round(timeToY(sw.time))
      out.push({
        id: `op-sw-${sw.id}`,
        y,
        label: `F${keyNum}`,
        isHold: false,
        customClass: 'op-switch',
      })
    }
  })

  out.sort((a, b) => a.y - b.y)
  return out
})

const operationLayout = computed(() => {
  const raw = Array.isArray(operationHintsRaw.value) ? operationHintsRaw.value : []

  const CAP_H = 14
  const GAP_Y = 2

  const laneBottom = []
  const placed = []

  for (const m of raw) {
    const top = m.y - CAP_H / 2
    let lane = -1

    for (let i = 0; i < laneBottom.length; i++) {
      if (top >= laneBottom[i] + GAP_Y) {
        lane = i
        break
      }
    }

    if (lane < 0) {
      lane = laneBottom.length
      laneBottom.push(-Infinity)
    }

    laneBottom[lane] = m.y + CAP_H / 2
    placed.push({ ...m, lane })
  }

  const laneCount = Math.max(1, laneBottom.length)
  const laneCountClamped = Math.min(4, laneCount)

  const CAP_GAP = 2
  const MAX_OP_W = 46
  const MIN_CAP_W = 10
  const minOpW = 2 + laneCountClamped * MIN_CAP_W + (laneCountClamped - 1) * CAP_GAP
  const opW = Math.min(MAX_OP_W, Math.max(24, minOpW))
  const capW = Math.max(8, Math.floor((opW - 2 - (laneCountClamped - 1) * CAP_GAP) / laneCountClamped))
  const capFs = capW <= 10 ? 8 : 9

  const items = placed
    .filter((m) => m.lane < laneCountClamped)
    .map((m) => ({ ...m, lane: Math.min(m.lane, laneCountClamped - 1) }))

  return {
    items,
    vars: {
      '--opw': `${opW}px`,
      '--capw': `${capW}px`,
      '--capfs': `${capFs}px`,
      '--capgap': `${CAP_GAP}px`,
    },
  }
})

watch(activeScenarioId, async () => {
  await nextTick()
  enforceMobilePrepExpanded()
})

async function doImport() {
  const code = String(shareCode.value || '').trim()
  if (!code) {
    ElMessage.warning(t('timeline.share.inputRequired'))
    return
  }

  try {
    importing.value = true
    const ok = await store.importShareString(code)
    if (!ok) {
      ElMessage.error(t('timeline.share.importFailed'))
      return
    }

    enforceMobilePrepExpanded()
    ElMessage.success(t('timeline.share.imported'))
    importVisible.value = false
  } catch (e) {
    ElMessage.error(t('timeline.share.importFailed'))
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="mobile-viewer-root">
    <div class="mobile-topbar">
      <div class="mobile-topbar-title">
        <div class="mobile-topbar-kicker">ENDAXIS</div>
      </div>
      <div class="mobile-topbar-actions">
        <el-select
          v-if="scenarioList.length > 1"
          v-model="activeScenarioId"
          size="small"
          class="mobile-scenario-select"
          :teleported="true"
          popper-class="mobile-scenario-popper"
        >
          <el-option
            v-for="(sc, idx) in scenarioList"
            :key="sc.id"
            :label="sc?.name || t('timeline.scenario.defaultName', { index: idx + 1 })"
            :value="sc.id"
          />
        </el-select>

        <el-button class="mobile-primary-btn" size="small" type="primary" plain @click="importVisible = true">
          <span class="btn-inline">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 11 12 14 22 4"></polyline>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            <span>{{ t('timeline.mobile.import') }}</span>
          </span>
        </el-button>

        <el-dropdown
          trigger="click"
          placement="bottom-end"
          :teleported="true"
          popper-class="mobile-more-popper"
          @command="handleMoreCommand"
        >
          <el-button class="mobile-icon-btn" size="small" plain :title="t('timeline.mobile.more')">
            <span class="btn-inline">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="5" r="1.6"></circle>
                <circle cx="12" cy="12" r="1.6"></circle>
                <circle cx="12" cy="19" r="1.6"></circle>
              </svg>
            </span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="about">
                <div class="mobile-menu-item">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>{{ t('common.about') }}</span>
                </div>
              </el-dropdown-item>

              <el-dropdown-item divided disabled>
                <div class="mobile-menu-item">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M2 12h20"></path>
                    <path d="M12 2a15 15 0 0 1 0 20"></path>
                    <path d="M12 2a15 15 0 0 0 0 20"></path>
                  </svg>
                  <span>{{ t('common.language') }}</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item command="locale:zh-CN" :disabled="locale === 'zh-CN'">
                {{ t('locale.zhCN') }}
              </el-dropdown-item>
              <el-dropdown-item command="locale:en" :disabled="locale === 'en'">
                {{ t('locale.en') }}
              </el-dropdown-item>
              <el-dropdown-item command="locale:ru" :disabled="locale === 'ru'">
                {{ t('locale.ru') }}
              </el-dropdown-item>

              <el-dropdown-item divided command="reset">
                <div class="mobile-menu-item">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <span>{{ t('common.reset') }}</span>
                </div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="mobile-scroll">
      <div class="mobile-tracks-header">
        <div class="mobile-time-head">{{ t('timeline.mobile.time') }}</div>
        <div v-for="(track, idx) in tracks" :key="idx" class="mobile-track-head">
          <button
            type="button"
            class="mobile-avatar mobile-avatar-btn"
            :class="{ 'is-disabled': !track?.id }"
            :disabled="!track?.id"
            :aria-label="t('timeline.mobile.loadout.openAria', { name: getTrackName(track) })"
            @click.stop="openLoadout(idx)"
          >
            <img :src="withBaseUrl(getTrackAvatar(track))" :alt="getTrackName(track)" @error="onAssetError" />
          </button>
        </div>
      </div>

      <div class="mobile-timeline-wrap" :style="gridStyle">
        <div class="mobile-time-rail" :style="operationLayout.vars">
          <div v-if="prepDuration > 0" class="mobile-prep-zone" :style="{ height: `${prepHeightPx}px` }"></div>
          <div v-if="prepDuration > 0" class="mobile-battle-start-line" :style="{ top: `${battleStartYPx}px` }"></div>
          <div class="mobile-op-layer">
            <div
              v-for="op in operationLayout.items"
              :key="op.id"
              class="mobile-key-cap"
              :class="[op.customClass, { 'is-hold': op.isHold }]"
              :style="{ top: `${op.y}px`, '--lane': op.lane }"
            >
              <span class="key-text">{{ op.label }}</span>
            </div>
          </div>
          <div class="mobile-time-ticks">
            <div
              v-for="tick in timeTicks"
              :key="`${tick.v}-${Math.round(tick.y)}`"
              class="mobile-time-tick"
              :class="{ 'is-battle-start': tick.isBattleStart, 'is-major': tick.isMajor }"
              :style="{ top: `${tick.y}px` }"
            >
              <div class="mobile-time-mark"></div>
              <div class="mobile-time-label">
                {{ typeof store.formatAxisTimeLabel === 'function' ? store.formatAxisTimeLabel(tick.v) : `${tick.v}s` }}
              </div>
            </div>
          </div>
        </div>

        <div class="mobile-timeline">
          <div v-if="prepDuration > 0" class="mobile-prep-zone mobile-prep-zone--grid" :style="{ height: `${prepHeightPx}px` }">
            <div class="mobile-prep-center-label">{{ t('timelineGrid.prep.title') }}</div>
          </div>
          <div v-if="prepDuration > 0" class="mobile-battle-start-line mobile-battle-start-line--grid" :style="{ top: `${battleStartYPx}px` }"></div>

          <div v-for="(track, idx) in tracks" :key="idx" class="mobile-track-col">
            <div class="mobile-actions-layer">
              <div
                v-for="action in getVisibleActions(track)"
                :key="action.instanceId"
                class="mobile-action-block"
                :style="getActionStyle(action)"
                :class="{ 'is-info-target': actionInfoOpen && selectedActionId === action.instanceId }"
                @click.stop="openActionInfo(action.instanceId)"
              >
                <span class="mobile-action-text">{{ getTypeLabel(action) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-drawer
      v-model="actionInfoOpen"
      direction="btt"
      size="85%"
      :with-header="false"
      :append-to-body="true"
      :lock-scroll="false"
      :close-on-click-modal="false"
      class="mobile-actioninfo-drawer"
    >
      <div class="m-drawer">
        <div class="m-drawer__header">
          <div class="m-drawer__title">{{ t('timeline.mobile.actionInfo.title') }}</div>
          <button
            type="button"
            class="ea-btn ea-btn--icon ea-btn--icon-38 ea-btn--glass-rect ea-btn--radius-6 m-drawer__close"
            :aria-label="t('common.close')"
            @click="actionInfoOpen = false"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="m-drawer__content">
          <div v-if="resolvedAction" class="tech-style border-gold section-container actioninfo-hero">
            <div class="actioninfo-hero__top">
              <div class="actioninfo-hero__avatar">
                <img :src="withBaseUrl(resolvedOperator?.avatar)" :alt="resolvedOperator?.name || ''" @error="onAssetError" />
              </div>
              <div class="actioninfo-hero__meta">
                <div class="actioninfo-hero__name">{{ resolvedAction?.node?.name || resolvedAction?.node?.id || t('common.unknown') }}</div>
                <div class="actioninfo-hero__sub">
                  <span class="mono">{{ resolvedOperator?.name || resolvedAction.trackId }}</span>
                  <span class="dot">·</span>
                  <span class="mono">{{ getTypeLabel(resolvedAction.node) }}</span>
                </div>
              </div>
            </div>
            <div class="actioninfo-hero__time">
              <div class="time-chip">
                <div class="time-chip__label">{{ t('timeline.mobile.actionInfo.start') }}</div>
                <div class="time-chip__val mono">{{ formatAxisLabel(resolvedAction.realStartTime) }}</div>
              </div>
              <div class="time-chip">
                <div class="time-chip__label">{{ t('timeline.mobile.actionInfo.end') }}</div>
                <div class="time-chip__val mono">{{ formatAxisLabel(resolvedActionEndTime) }}</div>
              </div>
              <div class="time-chip">
                <div class="time-chip__label">{{ t('timeline.mobile.actionInfo.duration') }}</div>
                <div class="time-chip__val mono">{{ formatSec(resolvedAction.realDuration) }}s</div>
              </div>
            </div>
          </div>

          <div v-else class="tech-style">
            {{ t('timeline.mobile.actionInfo.notFound') }}
          </div>

        </div>
      </div>
    </el-drawer>

    <el-drawer
      v-model="loadoutOpen"
      direction="btt"
      size="85%"
      :with-header="false"
      :append-to-body="true"
      :lock-scroll="false"
      :close-on-click-modal="false"
      class="mobile-loadout-drawer"
    >
      <div class="m-drawer">
        <div class="m-drawer__header">
          <div class="m-drawer__title">{{ t('timeline.mobile.loadout.title') }}</div>
          <button
            type="button"
            class="ea-btn ea-btn--icon ea-btn--icon-38 ea-btn--glass-rect ea-btn--radius-6 m-drawer__close"
            :aria-label="t('common.close')"
            @click="loadoutOpen = false"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div class="m-drawer__content">
          <div v-if="selectedTrack" class="loadout-header tech-style border-gold">
            <div class="loadout-operator">
              <div class="loadout-operator__avatar">
                <img :src="withBaseUrl(getTrackAvatar(selectedTrack))" :alt="getTrackName(selectedTrack)" @error="onAssetError" />
              </div>
              <div class="loadout-operator__meta">
                <div class="loadout-operator__name">{{ getTrackName(selectedTrack) }}</div>
                <div class="loadout-operator__sub">{{ selectedTrack.id }}</div>
              </div>
            </div>
          </div>

          <div class="m-field">
            <div class="m-label">{{ t('timeline.mobile.loadout.weapon') }}</div>
            <div class="loadout-item tech-style">
              <div class="loadout-item__icon">
                <img :src="withBaseUrl(selectedWeapon?.icon || '/avatars/default.webp')" :alt="selectedWeapon?.name || ''" @error="onAssetError" />
              </div>
              <div class="loadout-item__main">
                <div class="loadout-item__title">
                  {{ selectedWeapon?.name || t('timeline.mobile.loadout.none') }}
                </div>
                <div class="loadout-item__sub loadout-weapon-sub" v-if="selectedTrack && selectedWeapon">
                  <div class="loadout-weapon-line">
                    <span class="loadout-weapon-name">{{ selectedWeaponSlot1Label }}</span>
                    <span class="loadout-weapon-tier mono">{{ formatTierLabel(selectedTrack.weaponCommon1Tier) }}</span>
                  </div>
                  <div class="loadout-weapon-line">
                    <span class="loadout-weapon-name">{{ selectedWeaponSlot2Label }}</span>
                    <span class="loadout-weapon-tier mono">{{ formatTierLabel(selectedTrack.weaponCommon2Tier) }}</span>
                  </div>
                  <div class="loadout-weapon-line">
                    <span class="loadout-weapon-name">
                      {{ selectedWeapon?.buffName || t('actionLibrary.labels.exclusiveBuff') }}：{{ selectedWeaponBuffKeysLabel }}
                    </span>
                    <span class="loadout-weapon-tier mono">{{ formatTierLabel(selectedTrack.weaponBuffTier) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="m-field">
            <div class="m-label">{{ t('timeline.mobile.loadout.equipment') }}</div>
            <div class="loadout-eq-list">
              <div v-for="slot in equipmentSlots" :key="slot.slotKey" class="loadout-item tech-style">
                <div class="loadout-item__icon">
                  <img :src="withBaseUrl(slot.item?.icon || '/avatars/default.webp')" :alt="slot.item?.name || ''" @error="onAssetError" />
                </div>
                <div class="loadout-item__main">
                  <div class="loadout-item__title">
                    <span class="slot-label">{{ slot.slotLabel }}</span>
                    <span class="title-main">{{ slot.item?.name || t('timeline.mobile.loadout.none') }}</span>
                  </div>
                  <div class="loadout-item__sub" v-if="slot.item">
                    <span class="mono">Lv{{ slot.level ?? '-' }}</span>
                    <template v-if="slot.refineTier !== null">
                      <span class="dot">·</span>
                      <span class="mono">+{{ slot.refineTier }}</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="importVisible"
      :title="t('timeline.import.dialogTitle')"
      width="92%"
      align-center
      class="custom-dialog"
      :append-to-body="true"
      :lock-scroll="false"
      :close-on-click-modal="false"
    >
      <div class="share-import-container">
        <p class="dialog-hint">{{ t('timeline.import.dialogHint') }}</p>

        <el-alert
          :title="t('timeline.import.dialogAlert')"
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 10px;"
        />

        <el-input
          v-model="shareCode"
          type="textarea"
          :rows="6"
          :placeholder="t('timeline.import.dialogPlaceholder')"
          resize="none"
          autocomplete="off"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <button type="button" class="ea-btn ea-btn--sm ea-btn--lift ea-btn--outline-muted" @click="importVisible = false">{{ t('common.cancel') }}</button>
          <button type="button" class="ea-btn ea-btn--sm ea-btn--lift ea-btn--fill-gold" :disabled="importing" @click="doImport">
            {{ importing ? t('timeline.mobile.importing') : t('timeline.import.dialogConfirm') }}
          </button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="aboutVisible"
      width="92%"
      align-center
      class="custom-dialog"
      :append-to-body="true"
      :lock-scroll="false"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="module-deco header-type">
          <span class="module-code">{{ t('common.about') }}</span>
          <span v-if="aboutAnnouncement.subtitle" class="module-label">{{ aboutAnnouncement.subtitle }}</span>
        </div>
      </template>

      <div class="about-container">
        <div class="section-container tech-style border-gold">
          <div class="panel-tag-mini gold">{{ t('timeline.mobile.aboutMobileTag') }}</div>
          <el-alert
            :title="t('timeline.mobile.aboutMobileAlert')"
            type="warning"
            show-icon
            :closable="false"
          />
        </div>

        <div class="section-container tech-style no-margin">
          <div class="panel-tag-mini">{{ t('timeline.about.systemInfoTitle') }}</div>
          <div class="section-content-tech">
            <p v-if="aboutAnnouncement.systemInfoP1" class="tech-p">{{ aboutAnnouncement.systemInfoP1 }}</p>
            <p v-if="aboutAnnouncement.systemInfoP2" class="tech-p" style="margin-top: 6px;">{{ aboutAnnouncement.systemInfoP2 }}</p>
            <p v-if="!aboutAnnouncement.systemInfoP1 && !aboutAnnouncement.systemInfoP2" class="tech-p">{{ t('timeline.mobile.aboutNoticeEmpty') }}</p>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <button type="button" class="ea-btn ea-btn--md ea-btn--lift ea-btn--fill-gold" @click="aboutVisible = false">{{ t('timeline.about.startUsing') }}</button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.mobile-viewer-root {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background:
    radial-gradient(900px 520px at 30% -10%, rgba(0, 229, 255, 0.10), transparent 60%),
    linear-gradient(180deg, #0b0c10 0%, #111218 60%, #0b0c10 100%);
}

.mobile-topbar {
  height: 44px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(0, 229, 255, 0.12);
  background:
    linear-gradient(90deg, rgba(0, 229, 255, 0.10), transparent 40%),
    rgba(10, 10, 14, 0.78);
  backdrop-filter: blur(8px);
}

.mobile-topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.mobile-topbar-actions :deep(.el-button + .el-button) {
  margin-left: 0 !important;
}

.mobile-topbar-title {
  display: flex;
  align-items: center;
  min-width: 0;
}

.mobile-topbar-kicker {
  font-size: 13px;
  letter-spacing: 2px;
  color: rgba(0, 229, 255, 0.85);
  font-weight: 900;
  line-height: 1;
}

.mobile-primary-btn {
  --el-button-bg-color: rgba(0, 229, 255, 0.10);
  --el-button-border-color: rgba(0, 229, 255, 0.35);
  --el-button-text-color: rgba(0, 229, 255, 0.95);
  --el-button-hover-bg-color: rgba(0, 229, 255, 0.16);
  --el-button-hover-border-color: rgba(0, 229, 255, 0.60);
  --el-button-hover-text-color: rgba(255, 255, 255, 0.95);
  border-radius: 0 !important;
  font-weight: 900;
  letter-spacing: 1px;
}

.mobile-secondary-btn {
  --el-button-bg-color: rgba(0, 0, 0, 0.18);
  --el-button-border-color: rgba(255, 255, 255, 0.16);
  --el-button-text-color: rgba(255, 255, 255, 0.75);
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.08);
  --el-button-hover-border-color: rgba(255, 255, 255, 0.26);
  --el-button-hover-text-color: #fff;
  border-radius: 0 !important;
  font-weight: 800;
  letter-spacing: 1px;
}

.btn-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1;
}

.btn-inline svg {
  flex: 0 0 auto;
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-menu-item svg {
  flex: 0 0 auto;
  opacity: 0.9;
}

.mobile-icon-btn {
  --el-button-bg-color: rgba(0, 0, 0, 0.18);
  --el-button-border-color: rgba(255, 255, 255, 0.16);
  --el-button-text-color: rgba(255, 255, 255, 0.75);
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.08);
  --el-button-hover-border-color: rgba(255, 255, 255, 0.26);
  --el-button-hover-text-color: #fff;
  border-radius: 0 !important;
  padding: 0 10px !important;
  min-width: 34px;
  font-weight: 900;
  letter-spacing: 2px;
}

.mobile-scenario-select {
  width: 108px;
}

:deep(.mobile-scenario-select .el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.22);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.16) inset;
  border-radius: 0;
}

:deep(.mobile-scenario-select .el-input__inner) {
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  font-weight: 700;
}

:deep(.mobile-scenario-select .el-input__suffix-inner) {
  color: rgba(255, 255, 255, 0.55);
}

:global(.mobile-scenario-popper.el-popper) {
  background-color: #1e1e1e !important;
  border: 1px solid #444 !important;
  border-radius: 0 !important;
}

:global(.mobile-scenario-popper .el-select-dropdown__item) {
  color: rgba(255, 255, 255, 0.78);
}

:global(.mobile-scenario-popper .el-select-dropdown__item.hover),
:global(.mobile-scenario-popper .el-select-dropdown__item:hover) {
  background: rgba(255, 215, 0, 0.08);
  color: #ffd700;
}

:global(.mobile-more-popper.el-popper) {
  background-color: #1e1e1e !important;
  border: 1px solid #444 !important;
  border-radius: 0 !important;
}

:global(.mobile-more-popper .el-dropdown-menu__item) {
  color: rgba(255, 255, 255, 0.78);
}

:global(.mobile-more-popper .el-dropdown-menu__item:hover) {
  background: rgba(0, 229, 255, 0.10);
  color: rgba(0, 229, 255, 0.95);
}

:global(.mobile-more-popper .el-dropdown-menu__item.is-disabled) {
  color: rgba(255, 255, 255, 0.40);
}

.mobile-scroll {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.mobile-tracks-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: 48px repeat(4, minmax(0, 1fr));
  gap: 0;
  padding: 6px 6px 8px 6px;
  background:
    linear-gradient(90deg, rgba(255, 215, 0, 0.08), transparent 55%),
    rgba(12, 12, 16, 0.90);
  border-bottom: 1px solid rgba(255, 215, 0, 0.16);
}

.mobile-time-head {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.55);
}

.mobile-track-head {
  display: flex;
  justify-content: center;
}

.mobile-avatar {
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.03);
  overflow: hidden;
  border-radius: 0;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
}
.mobile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mobile-timeline-wrap {
  position: relative;
  display: grid;
  grid-template-columns: 48px 1fr;
  width: 100%;
  overflow: hidden;
}

.mobile-time-rail {
  position: relative;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.16);
  box-sizing: border-box;
}

.mobile-time-ticks {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: -1px;
  padding-left: var(--opw, 26px);
  pointer-events: none;
}

.mobile-op-layer {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  width: var(--opw, 22px);
  pointer-events: none;
}

.mobile-key-cap {
  position: absolute;
  left: calc(1px + var(--lane, 0) * (var(--capw, 20px) + var(--capgap, 2px)));
  width: var(--capw, 20px);
  height: 14px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #444;
  border: 1px solid #666;
  border-radius: 2px;
  color: #fff;
  font-weight: bold;
  font-family: Consolas, Monaco, monospace;
  box-shadow: 0 1px 1px rgba(0,0,0,0.5);
  white-space: nowrap;
  opacity: 0.92;
  font-size: var(--capfs, 9px);
  line-height: 1;
  overflow: hidden;
}

.mobile-key-cap.op-skill {
  background: #3a3a3a;
  border-color: #888;
}

.mobile-key-cap.op-link {
  background: rgba(255, 215, 0, 0.2);
  border-color: #ffd700;
  color: #ffd700;
}

.mobile-key-cap.op-switch {
  background: rgba(211, 173, 255, 0.2);
  border-color: #d3adff;
  color: #d3adff;
}

.mobile-key-cap.is-hold {
  background: #3a3a3a;
  border-color: #888;
}

.mobile-key-cap .key-text {
  font-size: inherit;
  line-height: inherit;
}

.mobile-time-tick {
  position: absolute;
  left: 0;
  right: 0;
  transform: none;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  padding: 0 0 0 2px;
  --mark-len: 12px;
  --mark-color: rgba(255, 255, 255, 0.22);
}

.mobile-time-mark {
  height: 1px;
  width: 100%;
  background: linear-gradient(
    to left,
    var(--mark-color) 0,
    var(--mark-color) var(--mark-len),
    transparent var(--mark-len)
  );
}

.mobile-time-label {
  width: 100%;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
  text-align: right;
  color: rgba(255, 255, 255, 0.55);
  white-space: nowrap;
  padding-right: 2px;
}

.mobile-time-tick.is-major .mobile-time-mark {
  --mark-len: 18px;
  --mark-color: rgba(255, 255, 255, 0.30);
}

.mobile-time-tick.is-battle-start .mobile-time-mark {
  --mark-len: 22px;
  --mark-color: rgba(255, 255, 255, 0.55);
}

.mobile-time-tick.is-battle-start .mobile-time-label {
  color: rgba(255, 255, 255, 0.82);
}

.mobile-prep-zone {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  pointer-events: none;
}

.mobile-prep-zone--grid {
  z-index: 1;
}

.mobile-prep-center-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.38);
  pointer-events: none;
}

.mobile-battle-start-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.38);
  transform: translateY(-1px);
  pointer-events: none;
}

.mobile-battle-start-line--grid {
  z-index: 2;
}

.mobile-timeline {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  width: 100%;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 25%),
    repeating-linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.05) 0px,
      rgba(255, 255, 255, 0.05) 1px,
      transparent 1px,
      transparent var(--sec-px)
    );
}

.mobile-track-col {
  position: relative;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
}
.mobile-track-col:first-child {
  border-left: none;
}

.mobile-actions-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
}

.mobile-action-block {
  position: absolute;
  left: 6px;
  right: 6px;
  border: 1px solid transparent;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0;
}

.mobile-action-text {
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
  letter-spacing: 1px;
}

:deep(.el-dialog) {
  background-color: #2b2b2b;
  border: 1px solid #444;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
:deep(.el-dialog__header) {
  margin-right: 0;
  border-bottom: 1px solid #3a3a3a;
  padding: 15px 20px;
}
:deep(.el-dialog__title) {
  color: #f0f0f0;
  font-size: 16px;
  font-weight: 600;
}
:deep(.el-dialog__body) {
  color: #ccc;
  padding: 25px 25px 10px 25px;
}
:deep(.el-dialog__footer) {
  padding: 15px 25px 20px;
  border-top: 1px solid #3a3a3a;
}

.share-import-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dialog-hint {
  color: #888;
  font-size: 12px;
  margin: 0;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

.about-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-container {
  position: relative;
}

.tech-style {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 3px solid #ffd700;
  padding: 14px;
  overflow: visible;
}

.tech-style.border-gold { border-left-color: #ffd700; }
.no-margin { margin: 0; }

.module-deco {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  border-left: 2px solid currentColor;
  padding-left: 8px;
}

.module-code {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 1px;
  color: #ffd700;
}

.module-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 4px;
}

.panel-tag-mini {
  position: absolute;
  right: 0;
  top: -12px;
  background: #1a1a1a;
  border: 1px solid #444;
  border-bottom: none;
  font-size: 10px;
  color: #888;
  padding: 2px 10px;
  font-family: sans-serif;
  letter-spacing: 1px;
  z-index: 2;
}
.panel-tag-mini.gold { color: #ffd700; border-color: rgba(255, 215, 0, 0.2); }

.section-content-tech {
  display: flex;
  flex-direction: column;
}

.tech-p {
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
}

:deep(.el-textarea__inner) {
  background-color: #1a1a1a;
  box-shadow: inset 0 0 0 1px #333;
  color: #e0e0e0;
  border: none;
  font-family: monospace;
}
:deep(.el-textarea__inner:focus) {
  box-shadow: inset 0 0 0 1px #ffd700;
}

:global(body.endaxis-mobile-viewer) {
  overflow-x: hidden !important;
}

:global(body.endaxis-mobile-viewer.el-popup-parent--hidden) {
  padding-right: 0 !important;
}

:global(.mobile-loadout-drawer),
:global(.mobile-actioninfo-drawer) {
  background: #18181c !important;
}

:global(.mobile-loadout-drawer .el-drawer__body),
:global(.mobile-actioninfo-drawer .el-drawer__body) {
  padding: 0 !important;
  background: #18181c !important;
}

.m-drawer {
  padding: 0;
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;
  background: #18181c;
}

.m-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 14px 12px 10px 12px;
  background: #18181c;
  border-bottom: 0;
}

.m-drawer__title {
  font-size: 14px;
  font-weight: 900;
}

.m-drawer__close {
  flex-shrink: 0;
}

.m-drawer__content {
  padding: 12px 12px calc(16px + env(safe-area-inset-bottom)) 12px;
  box-sizing: border-box;
}

.m-field {
  margin-bottom: 14px;
}

.m-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 900;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.mobile-avatar-btn {
  background: transparent;
  border: none;
  padding: 0;
  line-height: 0;
}

.mobile-avatar-btn:not(.is-disabled) {
  cursor: pointer;
}

.mobile-avatar-btn.is-disabled {
  opacity: 0.55;
}

.mobile-action-block {
  cursor: pointer;
}

.mobile-action-block.is-info-target {
  outline: 1px solid rgba(255, 215, 0, 0.85);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.14);
}

.actioninfo-hero {
  margin-bottom: 14px;
}

.actioninfo-hero__top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.actioninfo-hero__avatar {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border: 1px solid rgba(255, 215, 0, 0.22);
  background: rgba(255, 215, 0, 0.06);
  overflow: hidden;
}

.actioninfo-hero__avatar img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.actioninfo-hero__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.actioninfo-hero__name {
  font-size: 14px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.15;
}

.actioninfo-hero__sub {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
}

.actioninfo-hero__time {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.time-chip {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.time-chip__label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 900;
}

.time-chip__val {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.86);
}

.loadout-header {
  margin-bottom: 14px;
}

.loadout-operator {
  display: flex;
  gap: 12px;
  align-items: center;
}

.loadout-operator__avatar {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border: 1px solid rgba(255, 215, 0, 0.22);
  background: rgba(255, 215, 0, 0.06);
  overflow: hidden;
}

.loadout-operator__avatar img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.loadout-operator__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.loadout-operator__name {
  font-size: 14px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.92);
  line-height: 1.15;
}

.loadout-operator__sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  font-family: 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
}

.loadout-eq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.loadout-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}

.loadout-item__icon {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
}

.loadout-item__icon img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.loadout-item__main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.loadout-item__title {
  display: flex;
  gap: 10px;
  align-items: baseline;
  flex-wrap: wrap;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.86);
  font-weight: 900;
  font-size: 13px;
}

.loadout-item__sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
}

.loadout-weapon-sub {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.loadout-weapon-line {
  width: 100%;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.loadout-weapon-name {
  flex: 1 1 auto;
  min-width: 0;
  word-break: break-word;
}

.loadout-weapon-tier {
  flex: 0 0 auto;
  opacity: 0.85;
  white-space: nowrap;
}

.mono {
  font-family: 'Roboto Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
}

.dot {
  opacity: 0.35;
}

.slot-label {
  color: rgba(255, 215, 0, 0.88);
}

.title-main {
  min-width: 0;
  word-break: break-word;
}
</style>