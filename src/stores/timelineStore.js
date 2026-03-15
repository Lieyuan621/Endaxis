import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { watchThrottled } from '@vueuse/core'
import { executeFetch } from '@/api/fetchStrategy.js'
import { compressGzip, decompressGzip } from '@/utils/gzipUtils'
import { CORE_STATS, createDefaultStats } from '@/utils/coreStats.js'
import { compileScenario } from '@/simulation/compiler/compileScenario'
import { simulate } from '@/simulation/simulator'
import { projectSpSeries } from '@/simulation/projection/projectSpSeries'
import { projectStaggerSeries } from '@/simulation/projection/projectStaggerSeries'
import { i18n } from '@/i18n'
import { snapMs } from '@/utils/precision.js'

const tr = (key, params) => i18n.global.t(key, params)
const getI18nSkillType = (type) => {
    const key = `skillType.${type}`
    const out = tr(key)
    return out === key ? tr('skillType.unknown') : out
}

const uid = () => Math.random().toString(36).substring(2, 9)
const ATTACK_SEGMENT_COUNT = 5
const COLLAPSED_PREP_PX = 18
const MIN_PREP_DURATION = 0.5
const EQUIPMENT_REFINE_MAX_TIER = 3

const createOwnSkillLinkEnhancer = ({ linkSubtract = 0.0 } = {}) => {
    return ({ track, enhStart, baseDuration, ultimateAction, getShiftedEndTime }) => {
        const epsilon = 0.0001
        const processed = new Set()
        let extraDuration = 0

        let guard = 0
        while (guard++ < 200) {
            const currentEnd = getShiftedEndTime(enhStart, baseDuration + extraDuration, ultimateAction.instanceId)

            let foundAny = false
            for (const a of (track?.actions || [])) {
                if (!a || a.isDisabled || (a.triggerWindow || 0) < 0) continue
                if (a.type !== 'skill' && a.type !== 'link') continue
                if (processed.has(a.instanceId)) continue

                const t = Number(a.startTime) || 0
                if (t + epsilon < enhStart) continue
                if (t >= currentEnd - epsilon) continue

                let delta = Number(a.duration) || 0
                if (a.type === 'link') {
                    delta = Math.max(0, delta - linkSubtract)
                }
                processed.add(a.instanceId)

                if (delta <= 0) continue
                extraDuration += delta
                foundAny = true
            }

            if (!foundAny) break
        }

        return extraDuration
    }
}

const ULTIMATE_ENHANCEMENT_EXTENDERS = {
    ['LAEVATAIN']: createOwnSkillLinkEnhancer({ linkSubtract: 0.5 }),
}

function shiftSnapshotTimes(snapshot, delta) {
    const d = Number(delta) || 0
    if (!snapshot || !Number.isFinite(d) || d === 0) return snapshot

    const shiftVal = (v) => {
        const n = Number(v) || 0
        const out = n + d
        return out < 0 ? 0 : out
    }

    const shiftStartLike = (obj) => {
        if (!obj || typeof obj !== 'object') return
        if (obj.startTime !== undefined) obj.startTime = shiftVal(obj.startTime)
        if (obj.logicalStartTime !== undefined) obj.logicalStartTime = shiftVal(obj.logicalStartTime)
        if (obj.time !== undefined) obj.time = shiftVal(obj.time)
    }

    if (Array.isArray(snapshot.tracks)) {
        snapshot.tracks.forEach((track) => {
            if (!track || !Array.isArray(track.actions)) return
            track.actions.forEach(shiftStartLike)
        })
    }

    if (Array.isArray(snapshot.weaponStatuses)) {
        snapshot.weaponStatuses.forEach(shiftStartLike)
    }

    if (Array.isArray(snapshot.cycleBoundaries)) {
        snapshot.cycleBoundaries.forEach(shiftStartLike)
    }

    if (Array.isArray(snapshot.switchEvents)) {
        snapshot.switchEvents.forEach(shiftStartLike)
    }

    return snapshot
}

function normalizePrepConfig(snapshot) {
    const hasPrep = snapshot && (snapshot.prepDuration !== undefined || snapshot.prepExpanded !== undefined)
    if (hasPrep) {
        const dur = Number(snapshot.prepDuration)
        if (Number.isFinite(dur)) {
            const clamped = Math.max(MIN_PREP_DURATION, dur)
            if (Math.abs(clamped - dur) > 0.0001) {
                shiftSnapshotTimes(snapshot, clamped - dur)
            }
            snapshot.prepDuration = clamped
        } else {
            snapshot.prepDuration = 5
        }
        snapshot.prepExpanded = snapshot.prepExpanded !== false
        return { snapshot, migrated: false }
    }

    // Legacy project: assume old "0s == battle start", migrate to default prepDuration=5
    const migratedSnapshot = snapshot || {}
    migratedSnapshot.prepDuration = 5
    migratedSnapshot.prepExpanded = true
    shiftSnapshotTimes(migratedSnapshot, 5)
    return { snapshot: migratedSnapshot, migrated: true }
}

function normalizeAttackSegmentsForCharacter(char) {
    if (!char) return

    const legacy = {
        duration: Number(char.attack_duration) || 0,
        gaugeGain: Number(char.attack_gaugeGain) || 0,
        allowed_types: Array.isArray(char.attack_allowed_types) ? [...char.attack_allowed_types] : [],
        anomalies: char.attack_anomalies ? JSON.parse(JSON.stringify(char.attack_anomalies)) : [],
        damage_ticks: char.attack_damage_ticks ? JSON.parse(JSON.stringify(char.attack_damage_ticks)) : [],
    }

    const sanitizeSeg = (seg, fallback) => {
        const raw = seg && typeof seg === 'object' ? seg : {}
        const base = fallback && typeof fallback === 'object' ? fallback : {}
        return {
            duration: Number(raw.duration ?? base.duration) || 0,
            gaugeGain: Number(raw.gaugeGain ?? base.gaugeGain) || 0,
            allowed_types: Array.isArray(raw.allowed_types) ? raw.allowed_types : (Array.isArray(base.allowed_types) ? [...base.allowed_types] : []),
            anomalies: raw.anomalies ? JSON.parse(JSON.stringify(raw.anomalies)) : (base.anomalies ? JSON.parse(JSON.stringify(base.anomalies)) : []),
            damage_ticks: raw.damage_ticks ? JSON.parse(JSON.stringify(raw.damage_ticks)) : (base.damage_ticks ? JSON.parse(JSON.stringify(base.damage_ticks)) : []),
            element: typeof raw.element === 'string' ? raw.element : (typeof base.element === 'string' ? base.element : undefined),
            icon: typeof raw.icon === 'string' ? raw.icon : (typeof base.icon === 'string' ? base.icon : undefined),
        }
    }

    if (!Array.isArray(char.attack_segments)) {
        const seg0 = sanitizeSeg(null, legacy)
        char.attack_segments = Array.from({ length: ATTACK_SEGMENT_COUNT }, (_, idx) => {
            if (idx === 0) return seg0
            return sanitizeSeg({ duration: 0 }, seg0)
        })
        return
    }

    const normalized = char.attack_segments.slice(0, ATTACK_SEGMENT_COUNT).map(seg => sanitizeSeg(seg, legacy))
    while (normalized.length < ATTACK_SEGMENT_COUNT) normalized.push(sanitizeSeg({ duration: 0 }, legacy))
    char.attack_segments = normalized
}

export const useTimelineStore = defineStore('timeline', () => {

    // ===================================================================================
    // 系统配置与常量
    // ===================================================================================

    const DEFAULT_SYSTEM_CONSTANTS = {
        maxSp: 300,
        initialSp: 200,
        spRegenRate: 8,
        skillSpCostDefault: 100,
        linkCdReduction: 0,
        maxStagger: 100,
        staggerNodeCount: 0,
        staggerNodeDuration: 2,
        staggerBreakDuration: 10,
        executionRecovery: 25
    }

    const systemConstants = ref({ ...DEFAULT_SYSTEM_CONSTANTS })
    const customEnemyParams = ref({
        maxStagger: 100,
        staggerNodeCount: 0,
        staggerNodeDuration: 2,
        staggerBreakDuration: 10,
        executionRecovery: 25
    })

    watch(systemConstants, (newVal) => {
        if (activeEnemyId.value === 'custom') {
            customEnemyParams.value = {
                maxStagger: newVal.maxStagger,
                staggerNodeCount: newVal.staggerNodeCount,
                staggerNodeDuration: newVal.staggerNodeDuration,
                staggerBreakDuration: newVal.staggerBreakDuration,
                executionRecovery: newVal.executionRecovery
            }
        }
    }, { deep: true })

    const BASE_BLOCK_WIDTH = ref(50)
    const ZOOM_LIMITS = {
        MIN: 15,
        MAX: 1200
    }
    const TOTAL_DURATION = 120
    const MAX_SCENARIOS = 14

    const prepDuration = ref(5)
    const prepExpanded = ref(true)

    const viewDuration = computed(() => (Number(prepDuration.value) || 0) + TOTAL_DURATION)
    const prepZoneWidthPx = computed(() => {
        const dur = Number(prepDuration.value) || 0
        if (dur <= 0) return 0
        if (prepExpanded.value) return dur * timeBlockWidth.value
        return COLLAPSED_PREP_PX
    })

    function timeToPx(time) {
        const t = Number(time) || 0
        const dur = Number(prepDuration.value) || 0
        const width = timeBlockWidth.value
        if (dur <= 0 || prepExpanded.value) return t * width
        if (t <= dur) return (t / dur) * COLLAPSED_PREP_PX
        return COLLAPSED_PREP_PX + (t - dur) * width
    }

    function pxToTime(px) {
        const x = Number(px) || 0
        const dur = Number(prepDuration.value) || 0
        const width = timeBlockWidth.value
        if (dur <= 0 || prepExpanded.value) return x / width
        if (x <= COLLAPSED_PREP_PX) return (x / COLLAPSED_PREP_PX) * dur
        return dur + (x - COLLAPSED_PREP_PX) / width
    }

    const totalTimelineWidthPx = computed(() => timeToPx(viewDuration.value))

    function toBattleTime(viewTime) {
        return (Number(viewTime) || 0) - (Number(prepDuration.value) || 0)
    }

    function formatAxisTimeLabel(viewTime) {
        const bt = toBattleTime(viewTime)
        if (!Number.isFinite(bt)) return ''
        const sign = bt < 0 ? '-' : ''
        const abs = Math.abs(bt)
        const totalFrames = Math.round(abs * 60)
        const s = Math.floor(totalFrames / 60)
        const f = totalFrames % 60
        if (f === 0) return `${sign}${s}s`
        return `${sign}${s}s ${f.toString().padStart(2, '0')}f`
    }

    const ELEMENT_COLORS = {
        "blaze": "#ff4d4f", "cold": "#00e5ff", "emag": "#ffbf00", "nature": "#52c41a", "physical": "#e0e0e0",
        "link": "#fdd900", "execution": "#a61d24", "dodge": "#69c0ff", "skill": "#ffffff", "ultimate": "#00e5ff", "attack": "#aaaaaa", "default": "#8c8c8c",
        'blaze_attach': '#ff4d4f', 'blaze_burst': '#ff7875', 'burning': '#f5222d',
        'cold_attach': '#00e5ff', 'cold_burst': '#40a9ff', 'frozen': '#1890ff', 'ice_shatter': '#bae7ff',
        'emag_attach': '#ffd700', 'emag_burst': '#fff566', 'conductive': '#ffec3d',
        'nature_attach': '#95de64', 'nature_burst': '#73d13d', 'corrosion': '#52c41a',
        'break': '#d9d9d9', 'armor_break': '#d9d9d9', 'stagger': '#d9d9d9',
        'knockdown': '#d9d9d9', 'knockup': '#d9d9d9',
    }

    const getColor = (key) => ELEMENT_COLORS[key] || ELEMENT_COLORS.default

    const ENEMY_TIERS = [
        { labelKey: 'enemyTier.normal', label: '普通', value: 'normal', color: '#a0a0a0' },
        { labelKey: 'enemyTier.elite', label: '进阶', value: 'elite', color: '#52c41a' },
        { labelKey: 'enemyTier.champion', label: '精英', value: 'champion', color: '#d8b4fe' },
        { labelKey: 'enemyTier.head', label: '头目', value: 'head', color: '#ffd700' },
        { labelKey: 'enemyTier.boss', label: '领袖', value: 'boss', color: '#ff4d4f' }
    ]
    // ===================================================================================
    // 核心数据状态
    // ===================================================================================

    const isLoading = ref(true)
    const characterRoster = ref([])
    const iconDatabase = ref({})
    const enemyDatabase = ref([])
    const weaponDatabase = ref([])
    const equipmentDatabase = ref([])
    const equipmentCategories = ref([])
    const equipmentCategoryConfigs = ref({})
    const misc = ref({
        modifierDefs: [],
        weaponCommonModifiers: {},
        equipmentTemplates: {
            armor: { primary1: [0, 0, 0, 0], primary2: [0, 0, 0, 0], primary1Single: [0, 0, 0, 0] },
            gloves: { primary1: [0, 0, 0, 0], primary2: [0, 0, 0, 0], primary1Single: [0, 0, 0, 0] },
            accessory: { primary1: [0, 0, 0, 0], primary2: [0, 0, 0, 0], primary1Single: [0, 0, 0, 0] },
        },
        equipmentAdapterTable: {},
        domainConfig: {}
    })
    const activeEnemyId = ref('custom')
    const enemyCategories = ref([])
    const cycleBoundaries = ref([])

    const activeScenarioId = ref('default_sc')
    const scenarioList = ref([
        { id: 'default_sc', name: tr('timeline.scenario.defaultName', { index: 1 }), data: null }
    ])

    watchThrottled([weaponDatabase, misc], () => {
        if (isLoading.value) return
        syncAllWeaponModifiers()
    }, { deep: true, throttle: 600 })

    watchThrottled([equipmentDatabase], () => {
        if (isLoading.value) return
        syncAllEquipmentModifiers()
    }, { deep: true, throttle: 80 })

    const createEmptyTrack = () => ({
        id: null,
        actions: [],
        initialGauge: 0,
        maxGaugeOverride: null,
        gaugeEfficiency: 100,
        originiumArtsPower: 0,
        weaponId: null,
        weaponCommon1Tier: 1,
        weaponCommon2Tier: 1,
        weaponBuffTier: 1,
        weaponAppliedDeltas: {},
        equipmentAppliedDeltas: {},
        stats: createDefaultStats(),
        equipArmorId: null,
        equipGlovesId: null,
        equipAccessory1Id: null,
        equipAccessory2Id: null,
        equipArmorRefineTier: 0,
        equipGlovesRefineTier: 0,
        equipAccessory1RefineTier: 0,
        equipAccessory2RefineTier: 0,
        linkCdReduction: 0,
    })

    const createDefaultTracks = () => [
        createEmptyTrack(),
        createEmptyTrack(),
        createEmptyTrack(),
        createEmptyTrack(),
    ]

    const tracks = ref(createDefaultTracks())
    const connections = ref([])
    const characterOverrides = ref({})
    const weaponOverrides = ref({})
    const equipmentCategoryOverrides = ref({})
    const weaponStatuses = ref([])

    const connectionMap = computed(() => {
        const map = new Map()
        for (const conn of connections.value) {
            map.set(conn.id, conn)
        }
        return map
    })

    const actionMap = computed(() => {
        const map = new Map()
        for (let i = 0; i < tracks.value.length; i++) {
            const track = tracks.value[i]
            for (const action of track.actions) {
                map.set(action.instanceId, {
                    trackId: track.id,
                    trackIndex: i,
                    node: action,
                    type: 'action',
                    id: action.instanceId,
                })
            }
        }
        return map
    })

    const effectsMap = computed(() => {
        const map = new Map()
        for (const track of tracks.value) {
            for (const action of track.actions) {
                if (!action.physicalAnomaly || !action.physicalAnomaly.length) {
                    continue
                }
                let currentFlatIndex = 0
                for (let i = 0; i < action.physicalAnomaly.length; i++) {
                    const row = action.physicalAnomaly[i]
                    for (let j = 0; j < row.length; j++) {
                        const effect = row[j]
                        map.set(effect._id, {
                            id: effect._id,
                            node: effect,
                            actionId: action.instanceId,
                            rowIndex: i,
                            colIndex: j,
                            flatIndex: currentFlatIndex++,
                            type: 'effect'
                        })
                    }
                }
            }
        }
        return map
    })

    const statusMap = computed(() => {
        const map = new Map()
        for (const status of weaponStatuses.value) {
            if (!status?.id) continue
            const trackIndex = tracks.value.findIndex(t => t?.id && t.id === status.trackId)
            map.set(status.id, {
                id: status.id,
                node: status,
                trackId: status.trackId,
                trackIndex,
                type: 'status'
            })
        }
        return map
    })

    function setBaseBlockWidth(val) {
        const sanitizedVal = Math.min(ZOOM_LIMITS.MAX, Math.max(ZOOM_LIMITS.MIN, val))
        BASE_BLOCK_WIDTH.value = sanitizedVal
    }

    function getConnectionById(connectionId) {
        return connectionMap.value.get(connectionId)
    }

    function getActionById(actionId) {
        return actionMap.value.get(actionId)
    }

    function getEffectById(effectId) {
        return effectsMap.value.get(effectId)
    }

    function getStatusById(statusId) {
        return statusMap.value.get(statusId)
    }

    function resolveNode(nodeId) {
        return getActionById(nodeId) || getEffectById(nodeId) || getStatusById(nodeId)
    }

    function getNodesOfConnection(connectionId) {
        const conn = getConnectionById(connectionId)
        if (!conn) {
            return { fromNode: null, toNode: null }
        }

        const fromId = conn.fromNodeId || conn.fromEffectId || conn.from || null
        const toId = conn.toNodeId || conn.toEffectId || conn.to || null

        const fromNode = fromId ? resolveNode(fromId) : null
        const toNode = toId ? resolveNode(toId) : null

        return { fromNode, toNode }
    }

    function _getConnectionEndpointId(conn, side) {
        if (!conn) return null
        if (side === 'from') return conn.fromNodeId || conn.fromEffectId || conn.from || null
        return conn.toNodeId || conn.toEffectId || conn.to || null
    }

    function normalizeConnection(rawConn) {
        if (!rawConn) return null
        const conn = { ...rawConn }

        const fromId = _getConnectionEndpointId(conn, 'from')
        const toId = _getConnectionEndpointId(conn, 'to')

        if (fromId) conn.fromNodeId = fromId
        if (toId) conn.toNodeId = toId

        const fromNode = fromId ? resolveNode(fromId) : null
        const toNode = toId ? resolveNode(toId) : null

        if (!conn.fromNodeType && fromNode?.type) conn.fromNodeType = fromNode.type
        if (!conn.toNodeType && toNode?.type) conn.toNodeType = toNode.type

        if (fromNode?.type === 'effect') {
            conn.fromEffectId = fromNode.id
            conn.fromEffectIndex = fromNode.flatIndex
            conn.from = fromNode.actionId
        } else if (fromNode?.type === 'action') {
            conn.from = fromNode.id
        }

        if (toNode?.type === 'effect') {
            conn.toEffectId = toNode.id
            conn.toEffectIndex = toNode.flatIndex
            conn.to = toNode.actionId
        } else if (toNode?.type === 'action') {
            conn.to = toNode.id
        }

        return conn
    }

    function normalizeConnections(list) {
        if (!Array.isArray(list)) return []
        const out = []
        for (const conn of list) {
            const normalized = normalizeConnection(conn)
            if (normalized) out.push(normalized)
        }
        return out
    }

    function pruneDanglingConnections() {
        const before = connections.value.length
        connections.value = connections.value.filter(conn => {
            const fromId = _getConnectionEndpointId(conn, 'from')
            const toId = _getConnectionEndpointId(conn, 'to')
            if (!fromId || !toId) return false
            return !!resolveNode(fromId) && !!resolveNode(toId)
        })
        return before - connections.value.length
    }

    function _connectionTouchesAnyActionId(conn, actionIds) {
        if (!conn || !actionIds || actionIds.size === 0) return false
        const fromId = _getConnectionEndpointId(conn, 'from')
        const toId = _getConnectionEndpointId(conn, 'to')
        if (!fromId || !toId) return false

        const check = (nodeId) => {
            const node = resolveNode(nodeId)
            if (!node) return false
            if (node.type === 'action') return actionIds.has(node.id)
            if (node.type === 'effect') return actionIds.has(node.actionId)
            return false
        }

        return check(fromId) || check(toId)
    }

    function _connectionTouchesStatusId(conn, statusId) {
        if (!conn || !statusId) return false
        const fromId = _getConnectionEndpointId(conn, 'from')
        const toId = _getConnectionEndpointId(conn, 'to')
        return fromId === statusId || toId === statusId
    }

    function updateTrackGaugeEfficiency(trackId, value) {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
            const cleanValue = snapMs(Number(value));

            track.gaugeEfficiency = cleanValue;
            if (!track.stats) track.stats = createDefaultStats();
            track.stats.ult_charge_eff = cleanValue;
            commitState();
        }
    }

    function updateTrackOriginiumArtsPower(trackId, value) {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
            track.originiumArtsPower = value;
            if (!track.stats) track.stats = createDefaultStats()
            track.stats.originium_arts_power = Number(value) || 0
            commitState();
        }
    }

    function updateTrackLinkCdReduction(trackId, value) {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
            track.linkCdReduction = clampPercent(value);
            if (!track.stats) track.stats = createDefaultStats()
            track.stats.link_cd_reduction = Number(track.linkCdReduction) || 0
            commitState();
        }
    }

    function updateTrackWeapon(trackId, weaponId) {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
            track.weaponId = weaponId || null;
            if (selectedLibrarySource.value === 'weapon') {
                selectedLibrarySkillId.value = null;
                selectedLibrarySource.value = 'character';
            }
            weaponStatuses.value = weaponStatuses.value.filter(s => !(s.trackId === track.id && (!s.type || s.type === 'weapon')));
            pruneDanglingConnections()
            syncTrackWeaponModifiers(trackId)
            commitState();
        }
    }

    function updateTrackWeaponTier(trackId, part, tier) {
        const track = tracks.value.find(t => t.id === trackId)
        if (!track) return
        const nextTier = clampTier9(tier)
        if (part === 'common1') track.weaponCommon1Tier = nextTier
        else if (part === 'common2') track.weaponCommon2Tier = nextTier
        else if (part === 'buff') track.weaponBuffTier = nextTier
        else return
        syncTrackWeaponModifiers(trackId)
        commitState()
    }

    function updateTrackEquipment(trackId, slotKey, equipmentId) {
        const track = tracks.value.find(t => t.id === trackId);
        if (!track) return;

        const normalizedId = equipmentId || null

        if (slotKey === 'armor') track.equipArmorId = normalizedId
        else if (slotKey === 'gloves') track.equipGlovesId = normalizedId
        else if (slotKey === 'accessory1') track.equipAccessory1Id = normalizedId
        else if (slotKey === 'accessory2') track.equipAccessory2Id = normalizedId

        const eq = getEquipmentById(normalizedId)
        if (!eq || Number(eq.level) !== 70) {
            updateTrackEquipmentTier(trackId, slotKey, 0, { commit: false })
        }

        syncTrackEquipmentModifiers(trackId)
        commitState()
    }

    function updateTrackEquipmentTier(trackId, slotKey, tier, { commit = true } = {}) {
        const track = tracks.value.find(t => t.id === trackId)
        if (!track) return

        const next = clampEquipmentRefineTier(tier)
        const eq = getEquipmentById(getEquipmentIdForSlot(track, slotKey))
        const enforced = (eq && Number(eq.level) === 70) ? next : 0

        if (slotKey === 'armor') track.equipArmorRefineTier = enforced
        else if (slotKey === 'gloves') track.equipGlovesRefineTier = enforced
        else if (slotKey === 'accessory1') track.equipAccessory1RefineTier = enforced
        else if (slotKey === 'accessory2') track.equipAccessory2RefineTier = enforced
        else return

        syncTrackEquipmentModifiers(trackId)
        if (commit) commitState()
    }

    // ===================================================================================
    // 交互状态
    // ===================================================================================

    const activeTrackId = ref(null)
    const timelineScrollTop = ref(0)
    const timelineShift = ref(0)
    const timelineRect = ref({ width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 })

    const trackLaneRects = ref({})

    const showCursorGuide = ref(false)
    const cursorPosition = ref({ x: 0, y: 0 })
    const snapStep = ref(0.1)

    const draggingSkillData = ref(null)

    const selectedConnectionId = ref(null)
    const selectedActionId = ref(null)
    const selectedLibrarySkillId = ref(null)
    const selectedLibrarySource = ref('character')
    const selectedAnomalyId = ref(null)
    const selectedWeaponStatusId = ref(null)

    const selectedCycleBoundaryId = ref(null)
    const switchEvents = ref([])
    const selectedSwitchEventId = ref(null)

    const multiSelectedIds = ref(new Set())
    const isBoxSelectMode = ref(false)
    const clipboard = ref(null)

    const isCapturing = ref(false)

    const hoveredActionId = ref(null)

    const cursorPosTimeline = computed(() => {
        return toTimelineSpace(cursorPosition.value.x, cursorPosition.value.y)
    })

    const cursorCurrentTime = computed(() => {
        const exactTime = pxToTime(cursorPosTimeline.value.x)
        const clamped = Math.min(Math.max(0, exactTime), viewDuration.value)
        return snapMs(clamped)
    })

    function setIsCapturing(val) { isCapturing.value = val }

    const isActionSelected = (id) => selectedActionId.value === id || multiSelectedIds.value.has(id)

    // ===================================================================================
    // 历史记录 (Undo/Redo)
    // ===================================================================================

    const historyStack = ref([])
    const historyIndex = ref(-1)
    const MAX_HISTORY = 50

    function commitState() {
        if (historyIndex.value < historyStack.value.length - 1) {
            historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
        }
        const snapshot = JSON.stringify({
            tracks: tracks.value,
            connections: connections.value,
            characterOverrides: characterOverrides.value,
            weaponOverrides: weaponOverrides.value,
            equipmentCategoryOverrides: equipmentCategoryOverrides.value,
            weaponStatuses: weaponStatuses.value,
            prepDuration: prepDuration.value,
            prepExpanded: prepExpanded.value,
            cycleBoundaries: cycleBoundaries.value,
            switchEvents: switchEvents.value
        })
        historyStack.value.push(snapshot)
        if (historyStack.value.length > MAX_HISTORY) {
            historyStack.value.shift()
        } else {
            historyIndex.value++
        }
    }

    function undo() {
        if (historyIndex.value <= 0) return
        historyIndex.value--
        const prevSnapshot = JSON.parse(historyStack.value[historyIndex.value])
        restoreState(prevSnapshot)
    }

    function redo() {
        if (historyIndex.value >= historyStack.value.length - 1) return
        historyIndex.value++
        const nextSnapshot = JSON.parse(historyStack.value[historyIndex.value])
        restoreState(nextSnapshot)
    }

    function restoreState(snapshot) {
        const rawPrep = Number(snapshot?.prepDuration)
        if (snapshot?.prepDuration !== undefined && Number.isFinite(rawPrep) && rawPrep < MIN_PREP_DURATION) {
            shiftSnapshotTimes(snapshot, MIN_PREP_DURATION - rawPrep)
        }
        tracks.value = normalizeTracks(snapshot.tracks)
        connections.value = normalizeConnections(snapshot.connections)
        characterOverrides.value = snapshot.characterOverrides
        weaponOverrides.value = snapshot.weaponOverrides || {}
        equipmentCategoryOverrides.value = snapshot.equipmentCategoryOverrides || {}
        weaponStatuses.value = snapshot.weaponStatuses || []
        if (snapshot.prepDuration !== undefined) prepDuration.value = Math.max(MIN_PREP_DURATION, Number(snapshot.prepDuration) || 0)
        if (snapshot.prepExpanded !== undefined) prepExpanded.value = snapshot.prepExpanded !== false
        cycleBoundaries.value = snapshot.cycleBoundaries || []
        switchEvents.value = snapshot.switchEvents || []
        clearSelection()
    }

    // ===================================================================================
    // 方案管理逻辑 (Scenarios)
    // ===================================================================================

    function _createSnapshot() {
        return JSON.parse(JSON.stringify({
            tracks: tracks.value,
            connections: connections.value,
            characterOverrides: characterOverrides.value,
            weaponOverrides: weaponOverrides.value,
            equipmentCategoryOverrides: equipmentCategoryOverrides.value,
            weaponStatuses: weaponStatuses.value,
            prepDuration: prepDuration.value,
            prepExpanded: prepExpanded.value,
            systemConstants: systemConstants.value,
            activeEnemyId: activeEnemyId.value,
            customEnemyParams: customEnemyParams.value,
            cycleBoundaries: cycleBoundaries.value,
            switchEvents: switchEvents.value
        }))
    }

    function _loadSnapshot(data) {
        if (!data) return
        const normalized = normalizePrepConfig(JSON.parse(JSON.stringify(data)))
        const incoming = normalized.snapshot

        const incomingTracks = incoming.tracks
            ? JSON.parse(JSON.stringify(incoming.tracks))
            : createDefaultTracks()
        tracks.value = normalizeTracks(incomingTracks)
        connections.value = normalizeConnections(JSON.parse(JSON.stringify(incoming.connections || [])))
        characterOverrides.value = JSON.parse(JSON.stringify(incoming.characterOverrides || {}))
        weaponOverrides.value = JSON.parse(JSON.stringify(incoming.weaponOverrides || {}))
        equipmentCategoryOverrides.value = JSON.parse(JSON.stringify(incoming.equipmentCategoryOverrides || {}))
        weaponStatuses.value = JSON.parse(JSON.stringify(incoming.weaponStatuses || []))

        prepDuration.value = Math.max(MIN_PREP_DURATION, Number(incoming.prepDuration) || 0)
        prepExpanded.value = incoming.prepExpanded !== false

        if (incoming.systemConstants) {
            systemConstants.value = { ...systemConstants.value, ...incoming.systemConstants }
        }
        activeEnemyId.value = incoming.activeEnemyId || 'custom'
        if (incoming.customEnemyParams) {
            customEnemyParams.value = { ...customEnemyParams.value, ...incoming.customEnemyParams }
        }
        cycleBoundaries.value = incoming.cycleBoundaries ? JSON.parse(JSON.stringify(incoming.cycleBoundaries)) : []
        switchEvents.value = incoming.switchEvents ? JSON.parse(JSON.stringify(incoming.switchEvents)) : []
        syncAllWeaponModifiers()
        syncAllEquipmentModifiers()
        clearSelection()
    }

    // ===================================================================================
    // 连线拖拽
    // ===================================================================================
    const enableConnectionTool = ref(false)

    const validConnectionTargetIds = ref(new Set())

    const connectionDragState = ref({
        isDragging: false,
        mode: 'create',
        sourceId: null,
        existingConnectionId: null,
        startPoint: { x: 0, y: 0 },
        sourcePort: 'right',
    })

    const connectionSnapState = ref({
        isActive: false,
        targetId: null,
        targetPort: null,
        snapPos: null, // {x, y}
    })

    function toggleConnectionTool() {
        enableConnectionTool.value = !enableConnectionTool.value
    }

    function createConnection(fromPortDir, targetPortDir, isConsumption = false, connectionData) {
        const rawConn = {
            id: `conn_${uid()}`,
            isConsumption,
            sourcePort: fromPortDir || 'right',
            targetPort: targetPortDir || 'left',
            ...connectionData
        }

        const newConn = normalizeConnection(rawConn)
        if (!newConn) return
        connections.value.push(newConn)
        commitState()
    }

    function switchScenario(targetId) {
        if (targetId === activeScenarioId.value) return

        const currentScenario = scenarioList.value.find(s => s.id === activeScenarioId.value)
        if (currentScenario) {
            currentScenario.data = _createSnapshot()
        }

        const targetScenario = scenarioList.value.find(s => s.id === targetId)
        if (!targetScenario) return

        if (targetScenario.data) {
            _loadSnapshot(targetScenario.data)
        } else {
            targetScenario.data = _createSnapshot()
        }

        activeScenarioId.value = targetId
        historyStack.value = []
        historyIndex.value = -1
        commitState()
    }

    function addScenario() {
        if (scenarioList.value.length >= MAX_SCENARIOS) return

        const currentScenario = scenarioList.value.find(s => s.id === activeScenarioId.value)
        if (currentScenario) currentScenario.data = _createSnapshot()

        const newId = `sc_${uid()}`
        const newName = tr('timeline.scenario.defaultName', { index: scenarioList.value.length + 1 })

        const emptySnapshot = {
            tracks: [{ id: null, actions: [] }, { id: null, actions: [] }, { id: null, actions: [] }, { id: null, actions: [] }],
            connections: [],
            characterOverrides: {},
            weaponOverrides: {},
            equipmentCategoryOverrides: {},
            weaponStatuses: [],
            prepDuration: 5,
            prepExpanded: true,
            systemConstants: { ...DEFAULT_SYSTEM_CONSTANTS }
        }

        scenarioList.value.push({ id: newId, name: newName, data: emptySnapshot })
        activeScenarioId.value = newId
        _loadSnapshot(emptySnapshot)

        historyStack.value = []
        historyIndex.value = -1
        commitState()
    }

    function duplicateScenario(sourceId) {
        if (scenarioList.value.length >= MAX_SCENARIOS) return

        const currentActive = scenarioList.value.find(s => s.id === activeScenarioId.value)
        if (currentActive) currentActive.data = _createSnapshot()

        const source = scenarioList.value.find(s => s.id === sourceId)
        if (!source) return

        const newId = `sc_${uid()}`
        const newName = `${source.name} (${tr('timeline.scenario.copySuffix')})`
        const newData = JSON.parse(JSON.stringify(source.data || _createSnapshot()))

        scenarioList.value.push({ id: newId, name: newName, data: newData })
        activeScenarioId.value = newId
        _loadSnapshot(newData)

        historyStack.value = []
        historyIndex.value = -1
        commitState()
    }

    function deleteScenario(targetId) {
        if (scenarioList.value.length <= 1) return

        const idx = scenarioList.value.findIndex(s => s.id === targetId)
        if (idx === -1) return

        if (targetId === activeScenarioId.value) {
            const nextSc = scenarioList.value[idx - 1] || scenarioList.value[idx + 1]
            switchScenario(nextSc.id)
        }
        scenarioList.value.splice(idx, 1)
    }

    // ===================================================================================
    // 辅助计算 (Getters & Helpers)
    // ===================================================================================

    const timeBlockWidth = computed(() => BASE_BLOCK_WIDTH.value)

    const ensureEffectId = (effect) => {
        if (!effect._id) effect._id = uid()
        return effect._id
    }

    const clampPercent = (val) => {
        const num = Number(val) || 0;
        if (num < 0) return 0;
        if (num > 100) return 100;
        return num;
    }

    const clampTier9 = (val) => {
        const num = Math.round(Number(val))
        if (!Number.isFinite(num)) return 1
        if (num < 1) return 1
        if (num > 9) return 9
        return num
    }

    const clampEquipmentRefineTier = (val) => {
        const num = Math.round(Number(val))
        if (!Number.isFinite(num)) return 0
        if (num < 0) return 0
        if (num > EQUIPMENT_REFINE_MAX_TIER) return EQUIPMENT_REFINE_MAX_TIER
        return num
    }

    const normalizeArray4 = (arr) => {
        const list = Array.isArray(arr) ? arr.slice(0, 4) : []
        while (list.length < 4) list.push(0)
        return list.map(v => Number(v) || 0)
    }

    const normalizeArray9 = (arr) => {
        const list = Array.isArray(arr) ? arr.slice(0, 9) : []
        while (list.length < 9) list.push(0)
        return list.map(v => Number(v) || 0)
    }

    const normalizeTrack = (track) => {
        if (!track) return createEmptyTrack()
        const merged = {
            ...createEmptyTrack(),
            ...track,
            actions: track.actions || []
        }

        const baseStats = createDefaultStats()
        const hasIncomingStats = track.stats && typeof track.stats === 'object'
        merged.stats = { ...baseStats, ...(hasIncomingStats ? track.stats : {}) }

        if (!merged.weaponAppliedDeltas || typeof merged.weaponAppliedDeltas !== 'object') merged.weaponAppliedDeltas = {}
        if (!merged.equipmentAppliedDeltas || typeof merged.equipmentAppliedDeltas !== 'object') merged.equipmentAppliedDeltas = {}

        merged.equipArmorRefineTier = clampEquipmentRefineTier(merged.equipArmorRefineTier)
        merged.equipGlovesRefineTier = clampEquipmentRefineTier(merged.equipGlovesRefineTier)
        merged.equipAccessory1RefineTier = clampEquipmentRefineTier(merged.equipAccessory1RefineTier)
        merged.equipAccessory2RefineTier = clampEquipmentRefineTier(merged.equipAccessory2RefineTier)

        if (!hasIncomingStats) {
            const eff = Number(track.gaugeEfficiency)
            if (Number.isFinite(eff)) merged.stats.ult_charge_eff = eff
            const link = Number(track.linkCdReduction)
            if (Number.isFinite(link)) merged.stats.link_cd_reduction = link
            const arts = Number(track.originiumArtsPower)
            if (Number.isFinite(arts)) merged.stats.originium_arts_power = arts
        }

        merged.gaugeEfficiency = Number(merged.stats.ult_charge_eff) || 0
        merged.linkCdReduction = clampPercent(merged.stats.link_cd_reduction)
        merged.originiumArtsPower = Number(merged.stats.originium_arts_power) || 0

        return merged
    }

    const normalizeTracks = (list = []) => list.map(t => normalizeTrack(t))

    const getCharacterElementColor = (characterId) => {
        const charInfo = characterRoster.value.find(c => c.id === characterId)
        if (!charInfo || !charInfo.element) return ELEMENT_COLORS.default
        return ELEMENT_COLORS[charInfo.element] || ELEMENT_COLORS.default
    }

    const getWeaponById = (weaponId) => {
        return weaponDatabase.value.find(w => w.id === weaponId)
    }

    const getModifierLabel = (modifierId) => {
        const found = (misc.value?.modifierDefs || []).find(d => d.id === modifierId)
        if (found?.label) return found.label
        const core = CORE_STATS.find(s => s.id === modifierId)
        if (core?.labelKey) {
            const translated = tr(core.labelKey)
            if (translated !== core.labelKey) return translated
        }
        return core?.label || modifierId || ''
    }

    const normalizeWeaponCommonSlots = (slots) => {
        const list = Array.isArray(slots) ? slots.slice(0, 2) : []
        while (list.length < 2) list.push({})
        return list.map(s => ({
            modifierId: typeof s?.modifierId === 'string' && s.modifierId.trim()
                ? s.modifierId.trim()
                : (typeof s?.key === 'string' && s.key.trim() ? s.key.trim() : null),
            size: (s?.size === 'large' || s?.size === 'medium' || s?.size === 'small') ? s.size : 'small'
        }))
    }

    const normalizeWeaponBuffBonuses = (bonuses) => {
        if (!Array.isArray(bonuses)) return []
        return bonuses.map(b => ({
            modifierId: typeof b?.modifierId === 'string' && b.modifierId.trim()
                ? b.modifierId.trim()
                : (typeof b?.key === 'string' && b.key.trim() ? b.key.trim() : null),
            values: normalizeArray9(b?.values)
        })).filter(b => b.modifierId)
    }

    const normalizeWeaponCommonModifiersTable = (table) => {
        const safe = (table && typeof table === 'object') ? table : {}
        const out = {}
        for (const [key, entry] of Object.entries(safe)) {
            if (!key) continue
            out[key] = {
                small: normalizeArray9(entry?.small),
                medium: normalizeArray9(entry?.medium),
                large: normalizeArray9(entry?.large)
            }
        }
        return out
    }

    const normalizeEquipmentAdapterTable = (table) => {
        const safe = (table && typeof table === 'object') ? table : {}
        const out = {}
        const normalizeOne = (entry) => {
            const raw = (entry && typeof entry === 'object') ? entry : {}
            return {
                armorSingle: normalizeArray4(raw.armorSingle),
                armorDual: normalizeArray4(raw.armorDual),
                glovesSingle: normalizeArray4(raw.glovesSingle),
                glovesDual: normalizeArray4(raw.glovesDual),
                accessorySingle: normalizeArray4(raw.accessorySingle),
                accessoryDual: normalizeArray4(raw.accessoryDual),
            }
        }
        for (const [key, entry] of Object.entries(safe)) {
            if (!key) continue
            out[key] = normalizeOne(entry)
        }
        return out
    }

    const normalizeDomainConfig = (incoming) => {
        const safe = (incoming && typeof incoming === 'object') ? incoming : {}
        const normalizeDomain = (domainLike) => {
            const raw = (domainLike && typeof domainLike === 'object') ? domainLike : {}
            const enabledRaw = Array.isArray(raw.enabled) ? raw.enabled : []
            const enabled = []
            const seen = new Set()
            for (const idLike of enabledRaw) {
                const id = typeof idLike === 'string' ? idLike.trim() : ''
                if (!id) continue
                if (seen.has(id)) continue
                seen.add(id)
                enabled.push(id)
            }
            const unitsRaw = (raw.units && typeof raw.units === 'object') ? raw.units : {}
            const units = {}
            for (const [id, unit] of Object.entries(unitsRaw)) {
                if (!id) continue
                if (unit !== 'flat' && unit !== 'percent') continue
                units[id] = unit
            }
            return { enabled, units }
        }

        return {
            weapon: normalizeDomain(safe.weapon),
            equipmentAdapter: normalizeDomain(safe.equipmentAdapter)
        }
    }

    const normalizeEquipmentAffixes = (level, affixesLike) => {
        const safe = (affixesLike && typeof affixesLike === 'object') ? affixesLike : {}
        const is70 = Number(level) === 70
        const size = is70 ? 4 : 1

        const normalizePrimary = (input) => {
            const raw = (input && typeof input === 'object') ? input : {}
            const modifierId = typeof raw.modifierId === 'string' && raw.modifierId.trim()
                ? raw.modifierId.trim()
                : (typeof raw.key === 'string' && raw.key.trim() ? raw.key.trim() : null)
            const vals = is70 ? normalizeArray4(raw.values) : [Number(Array.isArray(raw.values) ? raw.values[0] : raw.value) || 0]
            return {
                modifierId: modifierId || null,
                values: vals.slice(0, size)
            }
        }

        const normalizeAdapter = (input) => {
            const raw = (input && typeof input === 'object') ? input : {}
            const baseVals = is70 ? normalizeArray4(raw.values) : [Number(Array.isArray(raw.values) ? raw.values[0] : raw.value) || 0]
            const baseValues = baseVals.slice(0, size)

            const entriesRaw = Array.isArray(raw.entries) ? raw.entries : null
            let entries = []

            if (entriesRaw) {
                entries = entriesRaw.map((e) => {
                    const ent = (e && typeof e === 'object') ? e : {}
                    const modifierId = typeof ent.modifierId === 'string' && ent.modifierId.trim()
                        ? ent.modifierId.trim()
                        : (typeof ent.key === 'string' && ent.key.trim() ? ent.key.trim() : null)
                    const vals = is70 ? normalizeArray4(ent.values) : [Number(Array.isArray(ent.values) ? ent.values[0] : ent.value) || 0]
                    return { modifierId: modifierId || null, values: vals.slice(0, size) }
                })
            } else {
                const ids = Array.isArray(raw.modifierIds) ? raw.modifierIds : (raw.modifierId ? [raw.modifierId] : [])
                const cleaned = []
                for (const id of ids) {
                    if (typeof id !== 'string') continue
                    const trimmed = id.trim()
                    if (!trimmed) continue
                    if (!cleaned.includes(trimmed)) cleaned.push(trimmed)
                }
                entries = cleaned.map((modifierId) => ({ modifierId, values: [...baseValues] }))
            }

            const seen = new Set()
            const cleanedEntries = []
            for (const ent of entries) {
                const modifierId = typeof ent?.modifierId === 'string' ? ent.modifierId.trim() : ''
                if (!modifierId) continue
                if (seen.has(modifierId)) continue
                const vals = is70 ? normalizeArray4(ent.values) : [Number(Array.isArray(ent.values) ? ent.values[0] : ent.value) || 0]
                cleanedEntries.push({ modifierId, values: vals.slice(0, size) })
                seen.add(modifierId)
            }

            return {
                entries: cleanedEntries,
                modifierIds: cleanedEntries.map(e => e.modifierId),
                values: baseValues
            }
        }

        return {
            primary1: normalizePrimary(safe.primary1),
            primary2: normalizePrimary(safe.primary2),
            adapter: normalizeAdapter(safe.adapter)
        }
    }

    const normalizeEquipmentDatabase = (list) => {
        const safe = Array.isArray(list) ? list : []
        return safe.map(eq => {
            const base = { ...(eq || {}) }
            const is70 = Number(base.level) === 70
            const legacy = base.affixes70 && typeof base.affixes70 === 'object' ? base.affixes70 : null
            const affixesInput = (base.affixes && typeof base.affixes === 'object') ? base.affixes : (legacy || null)
            if (affixesInput) {
                base.affixes = normalizeEquipmentAffixes(base.level, affixesInput)
                if (!is70) {
                    base.affixes.primary1.values = base.affixes.primary1.values.slice(0, 1)
                    base.affixes.primary2.values = base.affixes.primary2.values.slice(0, 1)
                    base.affixes.adapter.values = base.affixes.adapter.values.slice(0, 1)
                    if (Array.isArray(base.affixes.adapter.entries)) {
                        base.affixes.adapter.entries.forEach(e => {
                            if (Array.isArray(e?.values)) e.values = e.values.slice(0, 1)
                        })
                    }
                }
            }
            return base
        })
    }

    const normalizeEquipmentTemplates = (templatesLike, fallback = null) => {
        const safe = (templatesLike && typeof templatesLike === 'object') ? templatesLike : {}
        const fb = (fallback && typeof fallback === 'object') ? fallback : {}

        const normalizeOne = (input, fbInput) => {
            const raw = (input && typeof input === 'object') ? input : {}
            const fbRaw = (fbInput && typeof fbInput === 'object') ? fbInput : {}
            return {
                primary1: normalizeArray4(raw.primary1 ?? fbRaw.primary1),
                primary2: normalizeArray4(raw.primary2 ?? fbRaw.primary2),
                primary1Single: normalizeArray4(raw.primary1Single ?? fbRaw.primary1Single),
            }
        }

        return {
            armor: normalizeOne(safe.armor, fb.armor),
            gloves: normalizeOne(safe.gloves, fb.gloves),
            accessory: normalizeOne(safe.accessory, fb.accessory),
        }
    }

    const normalizeEquipmentMiscConfig = (incoming) => {
        const safe = (incoming && typeof incoming === 'object') ? incoming : {}

        if (safe.equipmentTemplates || safe.equipmentAdapterTable) {
            return {
                equipmentTemplates: normalizeEquipmentTemplates(safe.equipmentTemplates),
                equipmentAdapterTable: normalizeEquipmentAdapterTable(safe.equipmentAdapterTable),
                domainConfig: normalizeDomainConfig(safe.domainConfig)
            }
        }

        const hasLegacyDeltas = Array.isArray(safe.equipmentRefineDeltas)
        const hasLegacyDefaults = !!(safe.equipment70SlotDefaults && typeof safe.equipment70SlotDefaults === 'object' && Object.keys(safe.equipment70SlotDefaults).length > 0)

        if (!hasLegacyDeltas && !hasLegacyDefaults) {
            return {
                equipmentTemplates: normalizeEquipmentTemplates({
                    armor: { primary1: [0, 0, 0, 0], primary2: [0, 0, 0, 0], primary1Single: [0, 0, 0, 0] },
                    gloves: { primary1: [0, 0, 0, 0], primary2: [0, 0, 0, 0], primary1Single: [0, 0, 0, 0] },
                    accessory: { primary1: [0, 0, 0, 0], primary2: [0, 0, 0, 0], primary1Single: [0, 0, 0, 0] },
                }),
                equipmentAdapterTable: {},
                domainConfig: normalizeDomainConfig(null)
            }
        }

        const legacyDeltas = normalizeArray4(safe.equipmentRefineDeltas)
        legacyDeltas[0] = 0
        const legacyDefaults = (safe.equipment70SlotDefaults && typeof safe.equipment70SlotDefaults === 'object') ? safe.equipment70SlotDefaults : {}

        const buildFromLegacy = (slotKey, baseFallback) => {
            const raw = (legacyDefaults[slotKey] && typeof legacyDefaults[slotKey] === 'object') ? legacyDefaults[slotKey] : {}
            const p1 = Number(raw.primary1 ?? baseFallback.primary1) || 0
            const p2 = Number(raw.primary2 ?? baseFallback.primary2) || 0
            const p1s = Number(raw.primary1Single ?? baseFallback.primary1Single) || 0
            const ladder = (base) => [0, 1, 2, 3].map(t => (Number(base) || 0) + (Number(legacyDeltas[t]) || 0))
            return { primary1: ladder(p1), primary2: ladder(p2), primary1Single: ladder(p1s) }
        }

        const gloves = buildFromLegacy('gloves', { primary1: 65, primary2: 43, primary1Single: 65 })
        const accessory = buildFromLegacy('accessory', { primary1: 32, primary2: 21, primary1Single: 32 })
        const armor = { primary1: [0, 0, 0, 0], primary2: [0, 0, 0, 0], primary1Single: [0, 0, 0, 0] }

        return { equipmentTemplates: normalizeEquipmentTemplates({ armor, gloves, accessory }), equipmentAdapterTable: {}, domainConfig: normalizeDomainConfig(null) }
    }

    const normalizeModifierDefs = (defs) => {
        const list = Array.isArray(defs) ? defs : []
        const seen = new Set()
        const out = []
        for (const def of list) {
            const id = typeof def?.id === 'string' ? def.id.trim()
                : (typeof def?.key === 'string' ? def.key.trim() : '')
            if (!id || seen.has(id)) continue
            out.push({ id, label: def?.label || id, note: def?.note, domainTags: def?.domainTags })
            seen.add(id)
        }
        return out
    }

    const computeWeaponDeltasForTrack = (track) => {
        const deltas = {}
        if (!track?.weaponId) return deltas

        const weapon = getWeaponById(track.weaponId)
        if (!weapon) return deltas

        const slots = normalizeWeaponCommonSlots(weapon.commonSlots)
        const table = normalizeWeaponCommonModifiersTable(misc.value?.weaponCommonModifiers)

        const commonTiers = [clampTier9(track.weaponCommon1Tier), clampTier9(track.weaponCommon2Tier)]
        for (let i = 0; i < 2; i++) {
            const slot = slots[i]
            if (!slot?.modifierId) continue
            const entry = table[slot.modifierId]
            if (!entry) continue
            const ladder = entry[slot.size]
            const val = Number(ladder?.[commonTiers[i] - 1]) || 0
            if (val !== 0) deltas[slot.modifierId] = (deltas[slot.modifierId] || 0) + val
        }

        const buffTier = clampTier9(track.weaponBuffTier)
        const bonuses = normalizeWeaponBuffBonuses(weapon.buffBonuses)
        for (const b of bonuses) {
            const val = Number(b.values[buffTier - 1]) || 0
            if (val !== 0) deltas[b.modifierId] = (deltas[b.modifierId] || 0) + val
        }

        const filtered = {}
        const stats = track?.stats && typeof track.stats === 'object' ? track.stats : {}
        for (const [modifierId, val] of Object.entries(deltas)) {
            if (!(modifierId in stats)) continue
            filtered[modifierId] = val
        }
        return filtered
    }

    const applyWeaponDeltasToTrack = (track, newDeltas) => {
        const old = (track.weaponAppliedDeltas && typeof track.weaponAppliedDeltas === 'object')
            ? track.weaponAppliedDeltas
            : {}

        if (!track.stats) track.stats = createDefaultStats()

        const keys = new Set([...Object.keys(old), ...Object.keys(newDeltas || {})])
        for (const modifierId of keys) {
            if (!(modifierId in track.stats)) continue
            const prev = Number(old[modifierId]) || 0
            const next = Number(newDeltas?.[modifierId]) || 0
            const diff = next - prev
            if (diff === 0) continue
            const current = Number(track.stats[modifierId]) || 0
            track.stats[modifierId] = current + diff
        }

        track.weaponAppliedDeltas = { ...(newDeltas || {}) }

        track.gaugeEfficiency = Number(track.stats.ult_charge_eff) || 0
        track.linkCdReduction = clampPercent(track.stats.link_cd_reduction)
        track.originiumArtsPower = Number(track.stats.originium_arts_power) || 0
    }

    function syncTrackWeaponModifiers(trackId) {
        if (!trackId) return
        const track = tracks.value.find(t => t.id === trackId)
        if (!track) return
        const newDeltas = computeWeaponDeltasForTrack(track)
        applyWeaponDeltasToTrack(track, newDeltas)
    }

    function syncAllWeaponModifiers({ commit = false } = {}) {
        for (const track of tracks.value) {
            if (!track?.id) continue
            syncTrackWeaponModifiers(track.id)
        }
        if (commit) commitState()
    }

    const getEquipmentById = (equipmentId) => {
        if (!equipmentId) return null
        return equipmentDatabase.value.find(e => e.id === equipmentId) || null
    }

    const getEquipmentIdForSlot = (track, slotKey) => {
        if (!track) return null
        if (slotKey === 'armor') return track.equipArmorId
        if (slotKey === 'gloves') return track.equipGlovesId
        if (slotKey === 'accessory1') return track.equipAccessory1Id
        if (slotKey === 'accessory2') return track.equipAccessory2Id
        return null
    }

    const getEquipmentRefineTierForSlot = (track, slotKey) => {
        if (!track) return 0
        if (slotKey === 'armor') return clampEquipmentRefineTier(track.equipArmorRefineTier)
        if (slotKey === 'gloves') return clampEquipmentRefineTier(track.equipGlovesRefineTier)
        if (slotKey === 'accessory1') return clampEquipmentRefineTier(track.equipAccessory1RefineTier)
        if (slotKey === 'accessory2') return clampEquipmentRefineTier(track.equipAccessory2RefineTier)
        return 0
    }

    const computeEquipmentDeltasForTrack = (track) => {
        const deltas = {}
        if (!track?.id) return deltas

        const slotKeys = ['armor', 'gloves', 'accessory1', 'accessory2']
        for (const slotKey of slotKeys) {
            const equipmentId = getEquipmentIdForSlot(track, slotKey)
            if (!equipmentId) continue
            const eq = getEquipmentById(equipmentId)
            if (!eq) continue
            const is70 = Number(eq.level) === 70
            const tier = is70 ? getEquipmentRefineTierForSlot(track, slotKey) : 0
            const affixes = eq.affixes ? normalizeEquipmentAffixes(eq.level, eq.affixes) : null
            if (!affixes) continue

            const pick = (values) => {
                if (!Array.isArray(values) || values.length === 0) return 0
                const idx = is70 ? tier : 0
                return Number(values[idx] ?? values[0]) || 0
            }

            if (affixes.primary1?.modifierId) {
                const v = pick(affixes.primary1.values)
                if (v !== 0) deltas[affixes.primary1.modifierId] = (deltas[affixes.primary1.modifierId] || 0) + v
            }

            if (affixes.primary2?.modifierId) {
                const v = pick(affixes.primary2.values)
                if (v !== 0) deltas[affixes.primary2.modifierId] = (deltas[affixes.primary2.modifierId] || 0) + v
            }

            const entries = Array.isArray(affixes.adapter?.entries) ? affixes.adapter.entries : []
            if (entries.length > 0) {
                for (const ent of entries) {
                    const id = typeof ent?.modifierId === 'string' ? ent.modifierId.trim() : ''
                    if (!id) continue
                    const v = pick(ent.values)
                    if (v === 0) continue
                    deltas[id] = (deltas[id] || 0) + v
                }
            } else {
                const adapterIds = Array.isArray(affixes.adapter?.modifierIds) ? affixes.adapter.modifierIds : []
                if (adapterIds.length > 0) {
                    const v = pick(affixes.adapter.values)
                    if (v !== 0) {
                        for (const id of adapterIds) {
                            if (!id) continue
                            deltas[id] = (deltas[id] || 0) + v
                        }
                    }
                }
            }
        }

        const filtered = {}
        const stats = track?.stats && typeof track.stats === 'object' ? track.stats : {}
        for (const [modifierId, val] of Object.entries(deltas)) {
            if (!(modifierId in stats)) continue
            filtered[modifierId] = val
        }
        return filtered
    }

    const applyEquipmentDeltasToTrack = (track, newDeltas) => {
        const old = (track.equipmentAppliedDeltas && typeof track.equipmentAppliedDeltas === 'object')
            ? track.equipmentAppliedDeltas
            : {}

        if (!track.stats) track.stats = createDefaultStats()

        const keys = new Set([...Object.keys(old), ...Object.keys(newDeltas || {})])
        for (const modifierId of keys) {
            if (!(modifierId in track.stats)) continue
            const prev = Number(old[modifierId]) || 0
            const next = Number(newDeltas?.[modifierId]) || 0
            const diff = next - prev
            if (diff === 0) continue
            const current = Number(track.stats[modifierId]) || 0
            track.stats[modifierId] = current + diff
        }

        track.equipmentAppliedDeltas = { ...(newDeltas || {}) }
        track.gaugeEfficiency = Number(track.stats.ult_charge_eff) || 0
        track.linkCdReduction = clampPercent(track.stats.link_cd_reduction)
        track.originiumArtsPower = Number(track.stats.originium_arts_power) || 0
    }

    function syncTrackEquipmentModifiers(trackId) {
        if (!trackId) return
        const track = tracks.value.find(t => t.id === trackId)
        if (!track) return
        // Enforce: only Lv70 equipment can keep refine tiers
        const slotRules = [
            { slotKey: 'armor', id: track.equipArmorId, tierKey: 'equipArmorRefineTier' },
            { slotKey: 'gloves', id: track.equipGlovesId, tierKey: 'equipGlovesRefineTier' },
            { slotKey: 'accessory1', id: track.equipAccessory1Id, tierKey: 'equipAccessory1RefineTier' },
            { slotKey: 'accessory2', id: track.equipAccessory2Id, tierKey: 'equipAccessory2RefineTier' },
        ]
        for (const s of slotRules) {
            const eq = getEquipmentById(s.id)
            if (!eq || Number(eq.level) !== 70) {
                track[s.tierKey] = 0
            } else {
                track[s.tierKey] = clampEquipmentRefineTier(track[s.tierKey])
            }
        }
        const newDeltas = computeEquipmentDeltasForTrack(track)
        applyEquipmentDeltasToTrack(track, newDeltas)
    }

    function syncAllEquipmentModifiers({ commit = false } = {}) {
        for (const track of tracks.value) {
            if (!track?.id) continue
            syncTrackEquipmentModifiers(track.id)
        }
        if (commit) commitState()
    }

    const getEquipmentCategoryConfig = (category) => {
        if (!category) return null
        return equipmentCategoryConfigs.value?.[category] || null
    }

    const getEquipmentCategoryOverride = (category) => {
        if (!category) return null
        return equipmentCategoryOverrides.value?.[category] || null
    }

    function updateEquipmentCategoryOverride(category, patch) {
        if (!category || !patch) return
        if (!equipmentCategoryOverrides.value) equipmentCategoryOverrides.value = {}
        if (!equipmentCategoryOverrides.value[category]) equipmentCategoryOverrides.value[category] = {}
        Object.assign(equipmentCategoryOverrides.value[category], patch)
        commitState()
    }

    const getTrackEquipmentIds = (trackId) => {
        const track = tracks.value.find(t => t.id === trackId)
        if (!track) return []
        return [track.equipArmorId, track.equipGlovesId, track.equipAccessory1Id, track.equipAccessory2Id].filter(Boolean)
    }

    const getActiveSetBonusCategories = (trackId) => {
        const ids = getTrackEquipmentIds(trackId)
        const counts = new Map()
        for (const id of ids) {
            const eq = getEquipmentById(id)
            const cat = eq?.category
            if (!cat) continue
            counts.set(cat, (counts.get(cat) || 0) + 1)
        }
        return [...counts.entries()].filter(([, count]) => count >= 3).map(([cat]) => cat)
    }

    const getSetBonusDuration = (category) => {
        const override = getEquipmentCategoryOverride(category)
        const cfg = getEquipmentCategoryConfig(category)
        const duration = override?.setBonus?.duration ?? cfg?.setBonus?.duration
        const num = Number(duration)
        return Number.isFinite(num) ? Math.max(0, num) : 0
    }

    const getSetBonusIcon = (trackId, category) => {
        const track = tracks.value.find(t => t.id === trackId)
        if (!track || !category) return ''

        const equippedIds = [track.equipArmorId, track.equipGlovesId, track.equipAccessory1Id, track.equipAccessory2Id].filter(Boolean)
        for (const id of equippedIds) {
            const eq = getEquipmentById(id)
            if (eq?.category === category && eq?.icon) return eq.icon
        }

        const fallback = equipmentDatabase.value.find(e => e.category === category && e.icon)
        return fallback?.icon || ''
    }

    const teamTracksInfo = computed(() => tracks.value.map(track => {
        const charInfo = characterRoster.value.find(c => c.id === track.id)
        return { ...track, ...(charInfo || { name: tr('timelineGrid.track.selectOperator'), avatar: '', rarity: 0 }) }
    }))

    const activeWeapon = computed(() => {
        const track = tracks.value.find(t => t.id === activeTrackId.value)
        if (!track || !track.weaponId) return null
        return getWeaponById(track.weaponId) || null
    })

    const formatTimeLabel = (time) => {
        if (time === undefined || time === null) return '';
        const totalFrames = Math.round(time * 60);
        const s = Math.floor(totalFrames / 60);
        const f = totalFrames % 60;
        if (f === 0) return `${s}s`;
        return `${s}s ${f.toString().padStart(2, '0')}f`;
    };

    const activeSkillLibrary = computed(() => {
        i18n.global.locale.value
        const activeChar = characterRoster.value.find(c => c.id === activeTrackId.value)
        if (!activeChar) return []

        const TYPE_ORDER = {
            'attack': 1,
            'dodge': 2,
            'execution': 3,
            'skill': 4,
            'link': 5,
            'ultimate': 6
        }

        const getAnomalies = (list) => list || []
        const getAllowed = (list) => list || []

        const createBaseSkill = (suffix, type, name) => {
            const globalId = `${activeChar.id}_${suffix}`
            const globalOverride = characterOverrides.value[globalId] || {}
            const rawDuration = activeChar[`${suffix}_duration`] || 1
            const rawCooldown = activeChar[`${suffix}_cooldown`] || 0

            const rawTicks = activeChar[`${suffix}_damage_ticks`]
                ? JSON.parse(JSON.stringify(activeChar[`${suffix}_damage_ticks`]))
                : []

            let defaults = { spCost: 0, gaugeCost: 0, gaugeGain: 0, teamGaugeGain: 0, enhancementTime: 0, animationTime: 0 }

            if (suffix === 'skill') {
                defaults.spCost = activeChar.skill_spCost || systemConstants.value.skillSpCostDefault;
                defaults.gaugeGain = activeChar.skill_gaugeGain || 0;
                defaults.teamGaugeGain = activeChar.skill_teamGaugeGain || 0;
            } else if (suffix === 'link') {
                defaults.gaugeGain = activeChar.link_gaugeGain || 0
            } else if (suffix === 'ultimate') {
                defaults.gaugeCost = activeChar.ultimate_gaugeMax || 100
                defaults.gaugeGain = activeChar.ultimate_gaugeReply || 0
                defaults.enhancementTime = activeChar.ultimate_enhancementTime || 0
                defaults.animationTime = activeChar.ultimate_animationTime || 0.5
            }

            const merged = { duration: rawDuration, cooldown: rawCooldown, icon: activeChar[`${suffix}_icon`] || "", ...defaults, ...globalOverride }

            const specificElement = activeChar[`${suffix}_element`]
            const derivedElement = specificElement || activeChar.element || 'physical'

            const finalDamageTicks = globalOverride.damageTicks || rawTicks
            const finalAnomalies = globalOverride.physicalAnomaly || getAnomalies(activeChar[`${suffix}_anomalies`])
            const finalAllowedTypes = getAllowed(activeChar[`${suffix}_allowed_types`])

            return {
                id: globalId, type: type, name: name,
                librarySource: 'character',
                element: derivedElement,
                ...merged,
                damageTicks: finalDamageTicks,
                allowedTypes: finalAllowedTypes,
                physicalAnomaly: finalAnomalies,
            }
        }

        const createAttackLibrary = () => {
            normalizeAttackSegmentsForCharacter(activeChar)

            const groupId = `${activeChar.id}_attack`
            const groupOverrideRaw = characterOverrides.value[groupId] || {}
            const { duration: _ignoredDuration, ...groupOverride } = (groupOverrideRaw && typeof groupOverrideRaw === 'object') ? groupOverrideRaw : {}

            const derivedElement = activeChar.attack_element || activeChar.element || 'physical'
            const attackGroupName = getI18nSkillType('attack')

            const segmentSkills = (activeChar.attack_segments || []).slice(0, ATTACK_SEGMENT_COUNT).map((seg, idx) => {
                const segId = `${groupId}_seg${idx + 1}`
                const segOverride = characterOverrides.value[segId] || {}
                const mergedOverride = { ...groupOverride, ...(segOverride && typeof segOverride === 'object' ? segOverride : {}) }

                const rawDuration = Number(seg?.duration) || 0
                const rawTicks = seg?.damage_ticks ? JSON.parse(JSON.stringify(seg.damage_ticks)) : []
                const rawAnomalies = seg?.anomalies ? JSON.parse(JSON.stringify(seg.anomalies)) : []
                const rawAllowed = Array.isArray(seg?.allowed_types) ? [...seg.allowed_types] : []

                const merged = {
                    id: segId,
                    type: 'attack',
                    name: `${attackGroupName} ${idx + 1}`,
                    librarySource: 'character',
                    element: seg?.element || derivedElement,
                    icon: seg?.icon || '',
                    duration: rawDuration,
                    cooldown: 0,
                    gaugeGain: Number(seg?.gaugeGain) || 0,
                    ...mergedOverride,
                }

                const finalDamageTicks = mergedOverride.damageTicks || rawTicks
                const finalAnomalies = mergedOverride.physicalAnomaly || rawAnomalies
                const finalAllowedTypes = mergedOverride.allowedTypes || rawAllowed

                return {
                    ...merged,
                    kind: 'attack_segment',
                    attackSegmentIndex: idx + 1,
                    hiddenInLibraryGrid: true,
                    damageTicks: finalDamageTicks,
                    allowedTypes: finalAllowedTypes,
                    physicalAnomaly: finalAnomalies,
                }
            })

            const enabledSegments = segmentSkills.filter(s => (Number(s.duration) || 0) > 0).map((seg, idx, list) => ({
                ...seg,
                attackSequenceIndex: idx + 1,
                attackSequenceTotal: list.length,
                attackGroupName
            }))
            const totalDuration = enabledSegments.reduce((acc, s) => acc + (Number(s.duration) || 0), 0)

            const groupSkill = {
                id: groupId,
                type: 'attack',
                name: attackGroupName,
                librarySource: 'character',
                element: derivedElement,
                duration: totalDuration,
                kind: 'attack_group',
                attackSegments: enabledSegments,
                attackSegmentsAll: segmentSkills,
            }

            return { groupSkill, segmentSkills }
        }

        const createVariantAttackLibrary = (variant) => {
            const groupId = `${activeChar.id}_variant_${variant.id}`
            const groupOverrideRaw = characterOverrides.value[groupId] || {}
            const { duration: _ignoredDuration, ...groupOverride } = (groupOverrideRaw && typeof groupOverrideRaw === 'object') ? groupOverrideRaw : {}

            const derivedElement = variant.element || activeChar.attack_element || activeChar.element || 'physical'
            const attackGroupName = variant.name || tr('timeline.attack.enhancedAttack')

            const segmentSkills = (variant.attackSegments || []).slice(0, ATTACK_SEGMENT_COUNT).map((seg, idx) => {
                const segId = `${groupId}_seg${idx + 1}`
                const segOverride = characterOverrides.value[segId] || {}
                const mergedOverride = { ...groupOverride, ...(segOverride && typeof segOverride === 'object' ? segOverride : {}) }

                const rawDuration = Number(seg?.duration) || 0
                const rawTicks = seg?.damageTicks ? JSON.parse(JSON.stringify(seg.damageTicks)) : []
                const rawAnomalies = seg?.physicalAnomaly ? JSON.parse(JSON.stringify(seg.physicalAnomaly)) : []
                const rawAllowed = Array.isArray(seg?.allowedTypes) ? [...seg.allowedTypes] : []

                const merged = {
                    id: segId,
                    type: 'attack',
                    name: `${attackGroupName} ${idx + 1}`,
                    librarySource: 'character',
                    element: seg?.element || derivedElement,
                    icon: seg?.icon || '',
                    duration: rawDuration,
                    cooldown: 0,
                    gaugeGain: Number(seg?.gaugeGain) || 0,
                    ...mergedOverride,
                }

                const finalDamageTicks = mergedOverride.damageTicks || rawTicks
                const finalAnomalies = mergedOverride.physicalAnomaly || rawAnomalies
                const finalAllowedTypes = mergedOverride.allowedTypes || rawAllowed

                return {
                    ...merged,
                    kind: 'attack_segment',
                    attackSegmentIndex: idx + 1,
                    hiddenInLibraryGrid: true,
                    damageTicks: finalDamageTicks,
                    allowedTypes: finalAllowedTypes,
                    physicalAnomaly: finalAnomalies,
                }
            })

            const enabledSegments = segmentSkills.filter(s => (Number(s.duration) || 0) > 0).map((seg, idx, list) => ({
                ...seg,
                attackSequenceIndex: idx + 1,
                attackSequenceTotal: list.length,
                attackGroupName
            }))
            const totalDuration = enabledSegments.reduce((acc, s) => acc + (Number(s.duration) || 0), 0)

            const groupSkill = {
                id: groupId,
                type: 'attack',
                name: attackGroupName,
                librarySource: 'character',
                element: derivedElement,
                duration: totalDuration,
                kind: 'attack_group',
                attackSegments: enabledSegments,
                attackSegmentsAll: segmentSkills,
            }

            return { groupSkill, segmentSkills }
        }

        const createVariantSkill = (variant) => {
            const globalId = `${activeChar.id}_variant_${variant.id}`
            const globalOverride = characterOverrides.value[globalId] || {}
            const defaults = {
                duration: 1, cooldown: 0, spCost: 0, spGain: 0, gaugeCost: 0, gaugeGain: 0,
                stagger: 0, teamGaugeGain: 0, element: activeChar.element || 'physical'
            }
            const merged = { ...defaults, ...variant, ...globalOverride }

            const finalAnomalies = globalOverride.physicalAnomaly || getAnomalies(variant.physicalAnomaly)
            const finalDamageTicks = globalOverride.damageTicks || (variant.damageTicks ? JSON.parse(JSON.stringify(variant.damageTicks)) : [])

            return {
                ...merged,
                id: globalId,
                librarySource: 'character',
                physicalAnomaly: finalAnomalies,
                damageTicks: finalDamageTicks,
                allowedTypes: getAllowed(variant.allowedTypes),
            }
        }

        const { groupSkill: attackGroupSkill, segmentSkills: attackSegmentSkills } = createAttackLibrary()

        const createDodgeSkill = () => {
            const globalId = `${activeChar.id}_dodge`
            const globalOverride = characterOverrides.value[globalId] || {}

            const rawDuration = Number(activeChar.dodge_duration)
            const duration = Number.isFinite(rawDuration) ? Math.max(0, rawDuration) : 0.5

            return {
                id: globalId,
                type: 'dodge',
                name: getI18nSkillType('dodge'),
                librarySource: 'character',
                duration,
                damageTicks: [],
                physicalAnomaly: [],
                ...globalOverride,
            }
        }

        const standardSkills = [
            attackGroupSkill,
            createDodgeSkill(),
            createBaseSkill('execution', 'execution', getI18nSkillType('execution')),
            createBaseSkill('skill', 'skill', getI18nSkillType('skill')),
            createBaseSkill('link', 'link', getI18nSkillType('link')),
            createBaseSkill('ultimate', 'ultimate', getI18nSkillType('ultimate'))
        ]

        const variantSkills = []
        const variantAttackSegmentSkills = []
        for (const v of (activeChar.variants || [])) {
            if (v?.type === 'attack' && Array.isArray(v.attackSegments)) {
                const { groupSkill, segmentSkills } = createVariantAttackLibrary(v)
                variantSkills.push(groupSkill)
                variantAttackSegmentSkills.push(...segmentSkills)
            } else {
                variantSkills.push(createVariantSkill(v))
            }
        }

        const allSkills = [...standardSkills, ...variantSkills, ...attackSegmentSkills, ...variantAttackSegmentSkills];

        return allSkills.sort((a, b) => {
            const weightA = TYPE_ORDER[a.type] || 99;
            const weightB = TYPE_ORDER[b.type] || 99;

            if (weightA !== weightB) {
                return weightA - weightB;
            }

            const isVariantA = a.id.includes('_variant_');
            const isVariantB = b.id.includes('_variant_');

            if (isVariantA !== isVariantB) {
                return isVariantA ? 1 : -1;
            }

            return 0;
        });
    })

    const isWeaponSkillId = (id) => typeof id === 'string' && id.startsWith('weaponlib_')

    const activeWeaponSkillLibrary = computed(() => {
        i18n.global.locale.value
        const weapon = activeWeapon.value
        if (!weapon) return []

        const TYPE_ORDER = { weapon: 1, attack: 2, skill: 3, link: 4, ultimate: 5, execution: 6 }

        const rawList = Array.isArray(weapon.skills) && weapon.skills.length > 0
            ? weapon.skills
            : [{
                id: 'core',
                name: weapon.buffName || weapon.name || tr('weapon.skill'),
                type: 'weapon',
                duration: weapon.duration ?? 0,
                icon: weapon.icon || '/weapons/default.webp',
            }]

        return rawList.map((raw, idx) => {
            const libId = `weaponlib_${weapon.id}_${raw.id || idx}`
            const override = weaponOverrides.value[libId] || {}
            const baseDuration = raw.duration ?? weapon.duration ?? 0
            const durationVal = Number(baseDuration)
            const safeDuration = Number.isFinite(durationVal) ? durationVal : 0
            const baseCooldown = raw.cooldown ?? weapon.cooldown ?? 0
            const clonedAnomalies = raw.physicalAnomaly ? JSON.parse(JSON.stringify(raw.physicalAnomaly)) : []
            const clonedTicks = raw.damageTicks ? JSON.parse(JSON.stringify(raw.damageTicks)) : []

            const baseSkill = {
                id: libId,
                name: raw.name || weapon.buffName || weapon.name || tr('weapon.skill'),
                type: raw.type || 'weapon',
                librarySource: 'weapon',
                weaponId: weapon.id,
                duration: safeDuration,
                cooldown: Number(baseCooldown) || 0,
                icon: raw.icon || weapon.icon || '/weapons/default.webp',
                element: raw.element || weapon.element || 'physical',
                customColor: '#b37feb',
                gaugeCost: raw.gaugeCost || 0,
                gaugeGain: raw.gaugeGain || 0,
                teamGaugeGain: raw.teamGaugeGain || 0,
                spCost: raw.spCost || 0,
                spGain: raw.spGain || 0,
                triggerWindow: raw.triggerWindow || 0,
                physicalAnomaly: clonedAnomalies,
                damageTicks: clonedTicks,
                enhancementTime: raw.enhancementTime || 0,
                animationTime: raw.animationTime || 0,
            }

            return { ...baseSkill, ...override }
        }).sort((a, b) => {
            const weightA = TYPE_ORDER[a.type] || 99
            const weightB = TYPE_ORDER[b.type] || 99
            if (weightA !== weightB) return weightA - weightB
            return 0
        })
    })

    const activeSetBonusLibrary = computed(() => {
        if (!activeTrackId.value) return []
        const categories = getActiveSetBonusCategories(activeTrackId.value)
        if (!categories.length) return []

        return categories.map(cat => ({
            id: `setlib_${activeTrackId.value}_${cat}`,
            name: cat,
            type: 'set',
            librarySource: 'set',
            setCategory: cat,
            duration: getSetBonusDuration(cat),
            icon: getSetBonusIcon(activeTrackId.value, cat),
            customColor: '#2dd4bf'
        }))
    })

    function applyEnemyPreset(enemyId) {
        if (enemyId === activeEnemyId.value) return

        activeEnemyId.value = enemyId

        if (enemyId === 'custom') {
            // 切回自定义时，从备份恢复数值
            Object.assign(systemConstants.value, customEnemyParams.value)
        } else {
            // 切换到预设敌人
            const enemy = enemyDatabase.value.find(e => e.id === enemyId)
            if (enemy) {
                systemConstants.value.maxStagger = enemy.maxStagger
                systemConstants.value.staggerNodeCount = enemy.staggerNodeCount
                systemConstants.value.staggerNodeDuration = enemy.staggerNodeDuration
                systemConstants.value.staggerBreakDuration = enemy.staggerBreakDuration
                systemConstants.value.executionRecovery = enemy.executionRecovery
            }
        }
    }

    // ===================================================================================
    // 实体操作 (CRUD)
    // ===================================================================================

    function setTimelineShift(val) {
        const width = totalTimelineWidthPx.value
        const maxShift = width - timelineRect.value.width
        timelineShift.value = Math.min(Math.max(0, val), maxShift)
    }
    function setScrollTop(val) { timelineScrollTop.value = val }
    function setTimelineRect(width, height, top, right, bottom, left) { timelineRect.value = { width, height, top, left, right, bottom } }
    function setTrackLaneRect(trackId, rect) { trackLaneRects.value[trackId] = rect }
    function setNodeRect(nodeId, rect) { nodeRects.value[nodeId] = rect }
    function setCursorPosition(x, y) { cursorPosition.value = { x, y } }
    function toggleCursorGuide() { showCursorGuide.value = !showCursorGuide.value }
    function toggleBoxSelectMode() { if (!isBoxSelectMode.value) connectionDragState.value.isDragging = false; isBoxSelectMode.value = !isBoxSelectMode.value }
    function toggleSnapStep() {
        if (snapStep.value > 0.02) {
            snapStep.value = 1 / 60;
        } else {
            snapStep.value = 0.1;
        }
    }

    function setDraggingSkill(skill) { draggingSkillData.value = skill }

    function selectTrack(trackId) {
        activeTrackId.value = trackId
        clearSelection()
    }

    function selectLibrarySkill(skillId, source = 'character') {
        const normalizedSource = source || 'character'
        const isSame = (selectedLibrarySkillId.value === skillId && selectedLibrarySource.value === normalizedSource)
        if (skillId) {
            clearSelection()
            if (!isSame) {
                selectedLibrarySkillId.value = skillId
                selectedLibrarySource.value = normalizedSource
            } else {
                selectedLibrarySource.value = normalizedSource
            }
        } else {
            selectedLibrarySkillId.value = null
            selectedLibrarySource.value = normalizedSource
        }
    }

    function selectAction(instanceId) {
        const isSame = (instanceId === selectedActionId.value)
        clearSelection()
        if (!isSame) {
            selectedActionId.value = instanceId
            multiSelectedIds.value.add(instanceId)
        }
    }

    function setSelectedAnomalyId(id) { selectedAnomalyId.value = id }

    function selectAnomaly(instanceId, rowIndex, colIndex) {
        clearSelection()

        selectedActionId.value = instanceId
        multiSelectedIds.value.add(instanceId)

        const track = tracks.value.find(t => t.actions.some(a => a.instanceId === instanceId))
        const action = track?.actions.find(a => a.instanceId === instanceId)

        if (action && action.physicalAnomaly && action.physicalAnomaly[rowIndex]) {
            const effect = action.physicalAnomaly[rowIndex][colIndex]
            if (effect) {
                if (!effect._id) effect._id = uid()
                selectedAnomalyId.value = effect._id
            }
        }
    }

    function selectConnection(connId) {
        const isSame = (selectedConnectionId.value === connId)
        clearSelection()
        if (!isSame) {
            selectedConnectionId.value = connId
        }
    }

    function addSwitchEvent(time, characterId) {
        switchEvents.value.push({
            id: `sw_${uid()}`,
            time: time,
            characterId: characterId
        })
        commitState()
    }

    function updateSwitchEvent(id, time) {
        const event = switchEvents.value.find(e => e.id === id)
        if (event) {
            event.time = time
        }
    }

    function selectSwitchEvent(id) {
        const isSame = (selectedSwitchEventId.value === id)
        clearSelection()
        if (!isSame) {
            selectedSwitchEventId.value = id
        }
    }

    function selectWeaponStatus(id) {
        const isSame = (selectedWeaponStatusId.value === id)
        clearSelection()
        if (!isSame) {
            selectedWeaponStatusId.value = id
        }
    }

    function selectCycleBoundary(id) {
        const isSame = (selectedCycleBoundaryId.value === id)
        clearSelection()
        if (!isSame) {
            selectedCycleBoundaryId.value = id
        }
    }

    function addCycleBoundary(time) {
        cycleBoundaries.value.push({
            id: `cb_${uid()}`,
            time: time
        })
        commitState()
    }

    function updateCycleBoundary(id, time) {
        const boundary = cycleBoundaries.value.find(b => b.id === id)
        if (boundary) {
            boundary.time = time
        }
    }

    function setHoveredAction(id) { hoveredActionId.value = id }

    function setMultiSelection(idsArray) {
        multiSelectedIds.value = new Set(idsArray)
        if (idsArray.length === 1) { selectedActionId.value = idsArray[0] } else { selectedActionId.value = null }
        selectedWeaponStatusId.value = null
    }

    function clearSelection() {
        selectedActionId.value = null
        selectedConnectionId.value = null
        selectedAnomalyId.value = null
        selectedCycleBoundaryId.value = null
        selectedSwitchEventId.value = null
        selectedWeaponStatusId.value = null
        multiSelectedIds.value.clear()
        selectedLibrarySkillId.value = null
        selectedLibrarySource.value = 'character'
    }

    function addSkillToTrack(trackId, skill, startTime) {
        const track = tracks.value.find(t => t.id === trackId); if (!track) return

        const cloneEffectsForAction = (skillForClone) => {
            const clonedAnomalies = skillForClone.physicalAnomaly ? JSON.parse(JSON.stringify(skillForClone.physicalAnomaly)) : []
            const anomalyRows = Array.isArray(clonedAnomalies?.[0]) ? clonedAnomalies : [clonedAnomalies]
            const effectIdMap = new Map()

            anomalyRows.forEach(row => {
                if (!Array.isArray(row)) return
                row.forEach(effect => {
                    if (!effect) return
                    const oldId = effect._id
                    const newId = uid()
                    effect._id = newId
                    if (oldId) effectIdMap.set(oldId, newId)
                })
            })

            const clonedTicks = skillForClone.damageTicks ? JSON.parse(JSON.stringify(skillForClone.damageTicks)) : []
            clonedTicks.forEach(tick => {
                if (!tick || !Array.isArray(tick.boundEffects) || tick.boundEffects.length === 0) return
                tick.boundEffects = tick.boundEffects.map(id => effectIdMap.get(id) || id)
            })

            return { clonedAnomalies, clonedTicks }
        }

        const createActionFromSkill = (skillForCreate, actionStartTime) => {
            const { clonedAnomalies, clonedTicks } = cloneEffectsForAction(skillForCreate)
            return {
                ...skillForCreate,
                instanceId: `inst_${uid()}`,
                librarySource: skillForCreate.librarySource || 'character',
                sourceWeaponId: skillForCreate.weaponId || track.weaponId || null,
                physicalAnomaly: clonedAnomalies,
                damageTicks: clonedTicks,
                logicalStartTime: actionStartTime,
                startTime: actionStartTime
            }
        }

        if (skill?.kind === 'attack_group' && Array.isArray(skill.attackSegments)) {
            const segments = skill.attackSegments.filter(s => (Number(s?.duration) || 0) > 0)
            if (segments.length === 0) {
                return
            }

            const attackGroupInstanceId = `atkgrp_${uid()}`
            const attackSequenceTotal = segments.length
            const attackGroupName = skill.name || getI18nSkillType('attack')
            let cursor = startTime

            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i]
                const newAction = createActionFromSkill(seg, cursor)
                newAction.attackGroupInstanceId = attackGroupInstanceId
                newAction.attackSequenceIndex = i + 1
                newAction.attackSequenceTotal = attackSequenceTotal
                newAction.attackGroupName = attackGroupName
                track.actions.push(newAction)
                cursor += Number(seg.duration) || 0
            }

            track.actions.sort((a, b) => a.startTime - b.startTime)
            commitState()
            return
        }

        if (skill?.kind === 'attack_segment') {
            const idx = Number(skill.attackSequenceIndex) || Number(skill.attackSegmentIndex) || 0
            const total = Number(skill.attackSequenceTotal) || 0
            const newAction = createActionFromSkill(skill, startTime)
            if (idx > 0) {
                newAction.attackSequenceIndex = idx
                if (total > 0) {
                    newAction.attackSequenceTotal = total
                }
                newAction.attackGroupName = (typeof skill.attackGroupName === 'string' && skill.attackGroupName.trim())
                    ? skill.attackGroupName.trim()
                    : ((typeof skill.name === 'string' && skill.name.trim()) ? skill.name.trim().replace(/\s*\d+\s*$/, '') : getI18nSkillType('attack'))
            }
            track.actions.push(newAction)
            track.actions.sort((a, b) => a.startTime - b.startTime)
            commitState()
            return
        }

        const newAction = createActionFromSkill(skill, startTime)
        track.actions.push(newAction)
        track.actions.sort((a, b) => a.startTime - b.startTime)
        if (skill.type === 'link' || skill.type === 'ultimate') {
            const amount = skill.type === 'link' ? 0.5 : (Number(skill.animationTime) || 1.5);
            pushSubsequentActions(startTime, amount, newAction.instanceId);
        }
        commitState()
    }

    function addWeaponStatus(trackId, skill, startTime) {
        if (!trackId) return
        const durationVal = Number(skill.duration) || 0
        const newStatus = {
            id: `wstatus_${uid()}`,
            trackId,
            weaponId: skill.weaponId || null,
            skillId: skill.id,
            name: skill.name || tr('weapon.effect'),
            icon: skill.icon || '',
            color: skill.customColor || '#b37feb',
            startTime: startTime,
            logicalStartTime: startTime,
            duration: durationVal > 0 ? durationVal : 0,
            type: 'weapon'
        }
        weaponStatuses.value.push(newStatus)
        commitState()
    }

    function addSetBonusStatus(trackId, setCategory, startTime) {
        if (!trackId || !setCategory) return
        const durationVal = getSetBonusDuration(setCategory)
        const newStatus = {
            id: `wstatus_${uid()}`,
            trackId,
            setCategory,
            name: setCategory,
            icon: getSetBonusIcon(trackId, setCategory),
            color: '#2dd4bf',
            startTime: startTime,
            logicalStartTime: startTime,
            duration: durationVal > 0 ? durationVal : 0,
            type: 'set'
        }
        weaponStatuses.value.push(newStatus)
        commitState()
    }

    function removeCurrentSelection() {
        if (selectedWeaponStatusId.value) {
            const toDeleteId = selectedWeaponStatusId.value
            const before = weaponStatuses.value.length
            weaponStatuses.value = weaponStatuses.value.filter(s => s.id !== toDeleteId)
            const removed = before - weaponStatuses.value.length
            selectedWeaponStatusId.value = null
            if (removed > 0) {
                connections.value = connections.value.filter(conn => !_connectionTouchesStatusId(conn, toDeleteId))
                commitState()
                return { statusCount: removed, total: removed }
            }
        }
        const itemsToPull = [];

        const targets = new Set(multiSelectedIds.value);
        if (selectedActionId.value) targets.add(selectedActionId.value);

        targets.forEach(id => {
            const actionWrap = getActionById(id);
            const action = actionWrap ? actionWrap.node : null;

            if (action && (action.type === 'link' || action.type === 'ultimate')) {
                const amount = action.type === 'link' ? 0.5 : (Number(action.animationTime) || 1.5);
                itemsToPull.push({ time: action.startTime, amount });
            }
        });

        if (selectedSwitchEventId.value) {
            switchEvents.value = switchEvents.value.filter(s => s.id !== selectedSwitchEventId.value)
            selectedSwitchEventId.value = null
            commitState()
            return { total: 1 }
        }

        if (selectedCycleBoundaryId.value) {
            cycleBoundaries.value = cycleBoundaries.value.filter(b => b.id !== selectedCycleBoundaryId.value);
            selectedCycleBoundaryId.value = null;
            commitState();
            return { total: 1 };
        }

        let actionCount = 0;
        let connCount = 0;

        if (targets.size > 0) {
            tracks.value.forEach(track => {
                if (!track.actions || track.actions.length === 0) return;
                const initialLen = track.actions.length;
                track.actions = track.actions.filter(a => !targets.has(a.instanceId));
                if (track.actions.length < initialLen) {
                    actionCount += (initialLen - track.actions.length);
                }
            });
            const connBefore = connections.value.length
            connections.value = connections.value.filter(conn => !_connectionTouchesAnyActionId(conn, targets));
            connCount += (connBefore - connections.value.length)
        }

        if (selectedConnectionId.value) {
            const initialLen = connections.value.length;
            connections.value = connections.value.filter(c => c.id !== selectedConnectionId.value);
            if (connections.value.length < initialLen) connCount++;
            selectedConnectionId.value = null;
        }

        itemsToPull.sort((a, b) => b.time - a.time).forEach(item => {
            pullSubsequentActions(item.time, item.amount);
        });

        if (actionCount + connCount > 0) {
            clearSelection();
            commitState();
        }

        return { actionCount, connCount, total: actionCount + connCount };
    }

    function moveTrack(fromIndex, toIndex) {
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= tracks.value.length || toIndex >= tracks.value.length) {
            return
        }

        const temp = tracks.value[fromIndex]
        tracks.value[fromIndex] = tracks.value[toIndex]
        tracks.value[toIndex] = temp

        commitState()
    }

    function pasteSelection(targetStartTime = null) {
        if (!clipboard.value) return
        const { actions, connections: clipConns, baseTime } = clipboard.value
        const idMap = new Map()
        const globalEffectIdMap = new Map()

        let timeDelta = 0
        if (targetStartTime !== null) {
            timeDelta = targetStartTime - baseTime
        } else {
            timeDelta = (cursorCurrentTime.value >= 0) ? (cursorCurrentTime.value - baseTime) : 1.0
        }

        actions.forEach(item => {
            const track = tracks.value[item.trackIndex]
            if (!track) return
            const newId = `inst_${uid()}`
            idMap.set(item.data.instanceId, newId)
            const clonedAction = JSON.parse(JSON.stringify(item.data))

            if (clonedAction.physicalAnomaly && clonedAction.physicalAnomaly.length > 0) {
                const anomalyRows = Array.isArray(clonedAction.physicalAnomaly?.[0]) ? clonedAction.physicalAnomaly : [clonedAction.physicalAnomaly]
                anomalyRows.forEach(row => {
                    if (!Array.isArray(row)) return
                    row.forEach(effect => {
                        if (!effect) return
                        const oldId = effect._id
                        const newEffectId = uid()
                        effect._id = newEffectId
                        if (oldId) globalEffectIdMap.set(oldId, newEffectId)
                    })
                })
            }
            if (globalEffectIdMap.size > 0 && clonedAction.damageTicks) {
                clonedAction.damageTicks.forEach(tick => {
                    if (!tick || !Array.isArray(tick.boundEffects) || tick.boundEffects.length === 0) return
                    tick.boundEffects = tick.boundEffects.map(id => globalEffectIdMap.get(id) || id)
                })
            }
            const newStartTime = Math.max(0, item.data.startTime + timeDelta)
            const newAction = { ...clonedAction, instanceId: newId, startTime: newStartTime, logicalStartTime: newStartTime }
            track.actions.push(newAction)
            track.actions.sort((a, b) => a.startTime - b.startTime)
        })
        clipConns.forEach(conn => {
            const newFrom = idMap.get(conn.from)
            const newTo = idMap.get(conn.to)
            if (newFrom && newTo) {
                const newConn = {
                    ...conn,
                    id: `conn_${uid()}`,
                    from: newFrom,
                    to: newTo
                }

                if (conn.fromEffectId && globalEffectIdMap.has(conn.fromEffectId)) {
                    newConn.fromEffectId = globalEffectIdMap.get(conn.fromEffectId)
                }

                if (conn.toEffectId && globalEffectIdMap.has(conn.toEffectId)) {
                    newConn.toEffectId = globalEffectIdMap.get(conn.toEffectId)
                }
                connections.value.push(newConn)
            }
        })

        clearSelection()
        setMultiSelection(Array.from(idMap.values()))
        commitState()
    }

    function updateConnectionPort(connectionId, portType, direction) {
        const conn = connections.value.find(c => c.id === connectionId)
        if (conn) {
            if (portType === 'source') {
                conn.sourcePort = direction
            } else if (portType === 'target') {
                conn.targetPort = direction
            }
            commitState()
        }
    }

    function removeConnection(connId) {
        connections.value = connections.value.filter(c => c.id !== connId)
        commitState()
    }

    function updateConnection(id, payload) {
        const conn = connections.value.find(c => c.id === id)
        if (conn) { Object.assign(conn, payload); commitState(); }
    }

    function updateAction(actionId, patch) {
        let found = null;
        let trackRef = null;

        tracks.value.forEach(t => {
            const idx = t.actions.findIndex(a => a.instanceId === actionId);
            if (idx !== -1) {
                found = t.actions[idx];
                trackRef = t;
            }
        });

        if (found) {
            Object.assign(found, patch);
            if (patch.startTime !== undefined) {
                found.logicalStartTime = patch.startTime;
                refreshAllActionShifts();
            }
            commitState();
        }
    }

    function updateWeaponStatus(statusId, patch) {
        const status = weaponStatuses.value.find(s => s.id === statusId)
        if (!status) return
        Object.assign(status, patch)
        if (patch.startTime !== undefined) {
            status.logicalStartTime = status.startTime
        }
        commitState()
    }

    function updateLibrarySkill(skillId, props) {
        const targetMap = isWeaponSkillId(skillId) ? weaponOverrides.value : characterOverrides.value
        if (!targetMap[skillId]) targetMap[skillId] = {}
        Object.assign(targetMap[skillId], props)
        tracks.value.forEach(track => {
            if (!track.actions) return;
            track.actions.forEach(action => { if (action.id === skillId) { Object.assign(action, props) } })
        })
        commitState()
    }

    function changeTrackOperator(trackIndex, oldOperatorId, newOperatorId) {
        const track = tracks.value[trackIndex];
        if (track) {
            if (tracks.value.some((t, i) => i !== trackIndex && t.id === newOperatorId)) { alert(tr('timelineGrid.track.operatorAlreadyInUse')); return; }
            const actionIdsToDelete = new Set(track.actions.map(a => a.instanceId));
            if (actionIdsToDelete.size > 0) {
                connections.value = connections.value.filter(conn => !_connectionTouchesAnyActionId(conn, actionIdsToDelete));
            }
            if (oldOperatorId) {
                switchEvents.value = switchEvents.value.filter(s => s.characterId !== oldOperatorId);
                weaponStatuses.value = weaponStatuses.value.filter(s => s.trackId !== oldOperatorId);
                pruneDanglingConnections()
            }
            track.weaponId = null;
            syncTrackWeaponModifiers(oldOperatorId)
            track.equipArmorId = null;
            track.equipGlovesId = null;
            track.equipAccessory1Id = null;
            track.equipAccessory2Id = null;
            track.equipArmorRefineTier = 0
            track.equipGlovesRefineTier = 0
            track.equipAccessory1RefineTier = 0
            track.equipAccessory2RefineTier = 0
            syncTrackEquipmentModifiers(oldOperatorId)
            track.id = newOperatorId;
            track.weaponCommon1Tier = 1
            track.weaponCommon2Tier = 1
            track.weaponBuffTier = 1
            track.actions = [];
            if (activeTrackId.value === oldOperatorId) activeTrackId.value = newOperatorId;
            if (selectedActionId.value && actionIdsToDelete.has(selectedActionId.value)) clearSelection();
            commitState();
        }
    }

    function clearTrack(trackIndex) {
        const track = tracks.value[trackIndex];
        if (!track) return;
        const oldOperatorId = track.id;
        const actionIdsToDelete = new Set(track.actions.map(a => a.instanceId));
        if (actionIdsToDelete.size > 0) {
            connections.value = connections.value.filter(conn => !_connectionTouchesAnyActionId(conn, actionIdsToDelete));
        }
        if (oldOperatorId) {
            switchEvents.value = switchEvents.value.filter(s => s.characterId !== oldOperatorId);
            weaponStatuses.value = weaponStatuses.value.filter(s => s.trackId !== oldOperatorId);
            pruneDanglingConnections()
        }
        track.weaponId = null;
        if (oldOperatorId) syncTrackWeaponModifiers(oldOperatorId)
        track.equipArmorId = null;
        track.equipGlovesId = null;
        track.equipAccessory1Id = null;
        track.equipAccessory2Id = null;
        track.equipArmorRefineTier = 0
        track.equipGlovesRefineTier = 0
        track.equipAccessory1RefineTier = 0
        track.equipAccessory2RefineTier = 0
        if (oldOperatorId) syncTrackEquipmentModifiers(oldOperatorId)
        track.id = null;
        track.weaponCommon1Tier = 1
        track.weaponCommon2Tier = 1
        track.weaponBuffTier = 1
        track.actions = [];
        if (selectedActionId.value && actionIdsToDelete.has(selectedActionId.value)) clearSelection();
        commitState();
    }

    function updateTrackMaxGauge(trackId, value) { const track = tracks.value.find(t => t.id === trackId); if (track) { track.maxGaugeOverride = value; commitState(); } }
    function updateTrackInitialGauge(trackId, value) { const track = tracks.value.find(t => t.id === trackId); if (track) { track.initialGauge = value; commitState(); } }

    function removeAnomaly(instanceId, rowIndex, colIndex) {
        let action = null;
        for (const track of tracks.value) {
            const found = track.actions.find(a => a.instanceId === instanceId);
            if (found) { action = found; break; }
        }
        if (!action) return;
        const rows = action.physicalAnomaly || [];
        if (!rows[rowIndex]) return;

        const effectToDelete = rows[rowIndex][colIndex]
        const idToDelete = effectToDelete._id
        if (idToDelete) {
            connections.value = connections.value.filter(conn => {
                const fromId = _getConnectionEndpointId(conn, 'from')
                const toId = _getConnectionEndpointId(conn, 'to')
                return fromId !== idToDelete && toId !== idToDelete && conn.fromEffectId !== idToDelete && conn.toEffectId !== idToDelete
            })
        }
        rows[rowIndex].splice(colIndex, 1);
        if (rows[rowIndex].length === 0) rows.splice(rowIndex, 1);
        commitState();
    }

    function nudgeSelection(direction) {
        const targets = new Set(multiSelectedIds.value)
        if (selectedActionId.value) targets.add(selectedActionId.value)
        if (targets.size === 0) return

        const delta = direction * snapStep.value
        let hasChanged = false

        tracks.value.forEach(track => {
            track.actions.forEach(action => {
                if (targets.has(action.instanceId) && !action.isLocked) {
                    if (action.logicalStartTime === undefined) action.logicalStartTime = action.startTime

                    let newLogicalTime = snapMs(action.logicalStartTime + delta)
                    if (newLogicalTime < 0) newLogicalTime = 0

                    if (action.logicalStartTime !== newLogicalTime) {
                        action.logicalStartTime = newLogicalTime
                        hasChanged = true
                    }
                }
            })
        })

        if (hasChanged) {
            refreshAllActionShifts()
            commitState()
        }
    }

    function copySelection() {
        const targetIds = new Set(multiSelectedIds.value)
        if (selectedActionId.value) targetIds.add(selectedActionId.value)
        if (targetIds.size === 0) return
        const copiedActions = []
        let minStartTime = Infinity
        tracks.value.forEach((track, trackIndex) => {
            track.actions.forEach(action => {
                if (targetIds.has(action.instanceId)) {
                    copiedActions.push({ trackIndex: trackIndex, data: JSON.parse(JSON.stringify(action)) })
                    if (action.startTime < minStartTime) minStartTime = action.startTime
                }
            })
        })
        const copiedConnections = connections.value.filter(conn => targetIds.has(conn.from) && targetIds.has(conn.to)).map(conn => JSON.parse(JSON.stringify(conn)))
        clipboard.value = { actions: copiedActions, connections: copiedConnections, baseTime: minStartTime }
    }

    function alignActionToTarget(targetInstanceId, alignMode) {
        const sourceId = selectedActionId.value
        if (!sourceId || sourceId === targetInstanceId) return false

        const sourceInfo = getActionById(sourceId)
        const targetInfo = getActionById(targetInstanceId)

        if (!sourceInfo || !targetInfo) return false

        const sourceAction = sourceInfo.node
        if (sourceAction.isLocked) return false
        const targetAction = targetInfo.node

        const tStart = targetAction.startTime
        const tEnd = targetAction.startTime + targetAction.duration

        const sDur = sourceAction.duration
        const sourceTw = Math.abs(Number(sourceAction.triggerWindow || 0))

        let newStartTime = sourceAction.startTime

        // 计算对齐后的渲染位置
        switch (alignMode) {
            case 'RL': newStartTime = tStart - sDur; break // [前接]
            case 'LR': newStartTime = tEnd + sourceTw; break // [后接]
            case 'LL': newStartTime = tStart + sourceTw; break // [左对齐]
            case 'RR': newStartTime = tEnd - sDur; break // [右对齐]
        }

        newStartTime = snapMs(newStartTime)

        if (sourceAction.startTime !== newStartTime) {
            sourceAction.startTime = newStartTime
            sourceAction.logicalStartTime = newStartTime
            refreshAllActionShifts()

            tracks.value[sourceInfo.trackIndex].actions.sort((a, b) => a.startTime - b.startTime)
            commitState()
            return true
        }
        return false
    }

    const nodeRects = computed(() => {
        return useNewCompiler.value ? newNodeRects.value : legacyNodeRects.value;
    });

    const newNodeRects = computed(() => {
        const rects = {}
        const ACTION_BORDER = 2
        const LINE_GAP = 6
        const LINE_HEIGHT = 2

        compiledTimeline.value.actions.forEach(resAction => {
            const left = timeToPx(resAction.realStartTime)
            const width = timeToPx(resAction.realStartTime + resAction.realDuration) - timeToPx(resAction.realStartTime)
            const finalWidth = width < 2 ? 2 : width
            const trackRect = trackLaneRects.value[resAction.trackIndex]

            let y = 0
            if (trackRect) {
                y = trackRect.top
            }

            const rect = {
                left,
                width: finalWidth,
                right: left + finalWidth,
                height: trackRect?.height ?? 0,
                top: y - timelineRect.value.top,
            }

            let triggerWindowLayout = { hasWindow: false }
            if (resAction.triggerWindow && resAction.triggerWindow.hasWindow) {
                const twDuration = resAction.triggerWindow.duration
                const twStart = Math.max(0, resAction.realStartTime - twDuration)
                const twWidth = timeToPx(resAction.realStartTime) - timeToPx(twStart)

                const barYRelative = ACTION_BORDER + LINE_GAP - LINE_HEIGHT / 2

                const leftEdge = -ACTION_BORDER
                const barY = rect.top + rect.height + barYRelative - ACTION_BORDER
                const triggerBarRight = rect.left + leftEdge
                const triggerBarLeft = triggerBarRight - twWidth

                triggerWindowLayout = {
                    rect: {
                        left: triggerBarLeft,
                        right: triggerBarRight,
                        top: barY,
                        height: LINE_HEIGHT,
                        width: twWidth
                    },
                    localTransform: `translate(${leftEdge - twWidth}px, ${barYRelative}px)`,
                    hasWindow: true
                }
            }

            const barYRelative = ACTION_BORDER + LINE_GAP - LINE_HEIGHT / 2
            const leftEdge = -ACTION_BORDER
            const rightEdge = leftEdge + finalWidth + ACTION_BORDER
            const barY = rect.top + rect.height + barYRelative - ACTION_BORDER

            rects[resAction.id] = {
                rect,
                bar: {
                    top: barY,
                    relativeY: barYRelative,
                    leftEdge,
                    rightEdge
                },
                triggerWindow: undefined
            }
        })
        return rects
    });

    const legacyNodeRects = computed(() => {
        const rects = {}
        const ACTION_BORDER = 2
        const LINE_GAP = 6
        const LINE_HEIGHT = 2

        actionMap.value.forEach(action => {
            const end = getShiftedEndTime(action.node.startTime, action.node.duration, action.id)
            const start = action.node.startTime || 0
            const left = timeToPx(start)
            const width = timeToPx(end) - timeToPx(start)
            const finalWidth = width < 2 ? 2 : width
            const trackRect = trackLaneRects.value[action.trackIndex]

            let y = 0
            if (trackRect) {
                y = trackRect.top
            }

            const rect = {
                left,
                width: finalWidth,
                right: left + finalWidth,
                height: trackRect?.height ?? 0,
                top: y - timelineRect.value.top,
            }

            // 计算触发窗口布局
            const rawTw = action.node.triggerWindow || 0
            const snappedWindow = Math.round(Math.abs(rawTw) * 10) / 10
            let triggerWindowLayout = null

            // 相对动作底部的位移
            const barYRelative = ACTION_BORDER + LINE_GAP - LINE_HEIGHT / 2
            const leftEdge = -ACTION_BORDER
            const rightEdge = leftEdge + finalWidth + ACTION_BORDER

            // 相对时间轴的位移
            // rect.top 包含一个 ACTION_BORDER，所以这里要减去
            const barY = rect.top + rect.height + barYRelative - ACTION_BORDER

            if (snappedWindow > 0) {
                const twStart = Math.max(0, start - snappedWindow)
                const twWidth = timeToPx(start) - timeToPx(twStart)

                const triggerBarRight = rect.left + leftEdge
                const triggerBarLeft = triggerBarRight - twWidth

                triggerWindowLayout = {
                    rect: {
                        left: triggerBarLeft,
                        right: triggerBarRight,
                        top: barY,
                        height: LINE_HEIGHT,
                        width: twWidth
                    },
                    localTransform: `translate(${leftEdge - twWidth}px, ${barYRelative}px)`,
                    hasWindow: true
                }
            } else {
                triggerWindowLayout = { hasWindow: false }
            }

            rects[action.id] = {
                rect,
                bar: {
                    top: barY,
                    relativeY: barYRelative,
                    leftEdge,
                    rightEdge
                },
                triggerWindow: triggerWindowLayout
            }
        })

        return rects
    })

    const effectLayouts = computed(() => {
        return useNewCompiler.value ? newEffectLayouts.value : legacyEffectLayouts.value;
    });

    const newEffectLayouts = computed(() => {
        const layoutMap = new Map()
        const ICON_SIZE = 20
        const BAR_MARGIN = 2
        const VERTICAL_GAP = 3
        const ACTION_BORDER = 2

        compiledTimeline.value.actions.forEach(resAction => {
            const actionRect = nodeRects.value[resAction.id]?.rect
            if (!actionRect) return

            resAction.effects.forEach(effect => {
                const effectId = effect.id

                const effectLeft = timeToPx(effect.realStartTime)

                const relativeX = effectLeft - actionRect.left
                const relativeY = (effect.rowIndex * (VERTICAL_GAP + ICON_SIZE)) + VERTICAL_GAP + ACTION_BORDER;
                const localTransform = `translate(${relativeX}px, ${-relativeY}px)`

                const absoluteTop = actionRect.top - relativeY - ICON_SIZE + ACTION_BORDER;
                const absoluteLeft = effectLeft + 1

                const iconRect = {
                    left: absoluteLeft,
                    width: ICON_SIZE,
                    right: absoluteLeft + ICON_SIZE,
                    height: ICON_SIZE,
                    top: absoluteTop
                };

                const displayDuration = effect.displayDuration

                let finalBarWidth = displayDuration > 0 ? (timeToPx(effect.realStartTime + displayDuration) - timeToPx(effect.realStartTime)) : 0;
                if (finalBarWidth > 0) {
                    finalBarWidth = Math.max(0, finalBarWidth - ICON_SIZE - BAR_MARGIN)
                }

                layoutMap.set(effectId, {
                    rect: iconRect,
                    localTransform,
                    barData: {
                        width: finalBarWidth,
                        isConsumed: effect.isConsumed,
                        displayDuration,
                        extensionAmount: effect.extensionAmount
                    },
                    data: effect.node,
                    actionId: resAction.id,
                    flatIndex: effect.flatIndex
                })

                if (effect.isConsumed) {
                    const barLeft = absoluteLeft + ICON_SIZE + BAR_MARGIN;
                    const barRight = barLeft + finalBarWidth;

                    const transferRect = {
                        left: barRight,
                        width: 0,
                        right: barRight,
                        height: ICON_SIZE,
                        top: absoluteTop
                    };
                    layoutMap.set(`${effectId}_transfer`, { rect: transferRect })
                }
            });
        });

        return layoutMap;
    });

    const legacyEffectLayouts = computed(() => {
        const layoutMap = new Map()
        const consumptionMap = new Map()

        connections.value.forEach(conn => {
            if (conn.isConsumption) {
                const fromEffectId = conn.fromEffectId || (conn.fromNodeType === 'effect' ? conn.fromNodeId : null)
                if (fromEffectId) {
                    consumptionMap.set(fromEffectId, conn)
                }
            }
        })

        const ICON_SIZE = 20
        const BAR_MARGIN = 2
        const VERTICAL_GAP = 3
        const ACTION_BORDER = 2

        actionMap.value.forEach(action => {
            const actionRect = nodeRects.value[action.id]?.rect

            if (!actionRect) return

            if (action.node.physicalAnomaly && action.node.physicalAnomaly.length > 0) {
                const rows = Array.isArray(action.node.physicalAnomaly[0])
                    ? action.node.physicalAnomaly
                    : [action.node.physicalAnomaly];

                let globalFlatIndex = 0

                rows.forEach((row, rowIndex) => {
                    row.forEach((effect, colIndex) => {
                        const effectId = ensureEffectId(effect);
                        const myEffectIndex = globalFlatIndex++;

                        const originalOffset = Number(effect.offset) || 0;

                        // 计算图标的起始现实位置
                        const shiftedStartTimestamp = getShiftedEndTime(action.node.startTime, originalOffset, action.id);
                        const effectLeft = timeToPx(shiftedStartTimestamp);

                        // 相对动作的位置
                        const relativeX = effectLeft - actionRect.left
                        const relativeY = (rowIndex * (VERTICAL_GAP + ICON_SIZE)) + VERTICAL_GAP + ACTION_BORDER;
                        const localTransform = `translate(${relativeX}px, ${-relativeY}px)`

                        // 相对时间轴的位置
                        const absoluteTop = actionRect.top - relativeY - ICON_SIZE + ACTION_BORDER;
                        const absoluteLeft = effectLeft + 1

                        const iconRect = {
                            left: absoluteLeft,
                            width: ICON_SIZE,
                            right: absoluteLeft + ICON_SIZE,
                            height: ICON_SIZE,
                            top: absoluteTop
                        };

                        // 计算 Buff 的偏移后总时长
                        let finalDuration = getShiftedEndTime(shiftedStartTimestamp, effect.duration, action.id) - shiftedStartTimestamp;
                        let isConsumed = false

                        // 连线消耗逻辑
                        let conn = consumptionMap.get(effectId) || consumptionMap.get(`${action.id}_${myEffectIndex}`);

                        if (conn && conn.isConsumption) {
                            const targetTrack = tracks.value.find(t => t.actions.some(a => a.instanceId === conn.to));
                            const targetAction = targetTrack?.actions.find(a => a.instanceId === conn.to);
                            if (targetAction) {
                                const consumptionTime = targetAction.startTime - (conn.consumptionOffset || 0);
                                const cutDuration = consumptionTime - shiftedStartTimestamp;
                                const snappedCutDuration = snapMs(cutDuration);
                                if (snappedCutDuration >= 0) {
                                    finalDuration = Math.min(finalDuration, snappedCutDuration);
                                    isConsumed = true
                                }
                            }
                        }

                        let finalBarWidth = finalDuration > 0 ? (timeToPx(shiftedStartTimestamp + finalDuration) - timeToPx(shiftedStartTimestamp)) : 0;
                        if (finalBarWidth > 0) {
                            finalBarWidth = Math.max(0, finalBarWidth - ICON_SIZE - BAR_MARGIN)
                        }


                        layoutMap.set(effectId, {
                            rect: iconRect,
                            localTransform,
                            barData: {
                                width: finalBarWidth,
                                isConsumed,
                                displayDuration: finalDuration,
                                extensionAmount: snapMs(finalDuration - effect.duration)
                            },
                            data: effect,
                            actionId: action.id,
                            flatIndex: myEffectIndex
                        })

                        if (isConsumed) {
                            const barLeft = absoluteLeft + ICON_SIZE + BAR_MARGIN;
                            const barRight = barLeft + finalBarWidth;

                            // 时间条末端位置
                            const transferRect = {
                                left: barRight,
                                width: 0,
                                right: barRight,
                                height: ICON_SIZE,
                                top: absoluteTop
                            };
                            layoutMap.set(`${effectId}_transfer`, { rect: transferRect })
                        }
                    })
                })
            }
        })
        return layoutMap
    })

    const statusNodeRects = computed(() => {
        const map = new Map()
        const ICON_SIZE = 20
        const BAR_MARGIN = 2
        const WEAPON_OFFSET = 8
        const SET_OFFSET = 32

        for (const status of weaponStatuses.value) {
            if (!status?.id || !status.trackId) continue
            const trackIndex = tracks.value.findIndex(t => t?.id && t.id === status.trackId)
            if (trackIndex < 0) continue

            const trackRect = trackLaneRects.value[trackIndex]
            if (!trackRect) continue

            const start = Number(status.startTime) || 0
            const left = timeToPx(start)

            const offset = status.type === 'set' ? SET_OFFSET : WEAPON_OFFSET
            const top = (trackRect.top + trackRect.height + offset) - timelineRect.value.top

            const iconRect = {
                left,
                top,
                width: ICON_SIZE,
                height: ICON_SIZE,
                right: left + ICON_SIZE,
            }

            map.set(status.id, { rect: iconRect })

            const rawDuration = Number(status.duration) || 0
            const shiftedEnd = getShiftedEndTime(start, rawDuration, status.id)
            const baseFinalDuration = Math.max(0, shiftedEnd - start)

            let finalDuration = baseFinalDuration
            let isConsumed = false

            const cutTime = statusConsumptionTimeById.value?.get(status.id)
            if (Number.isFinite(cutTime)) {
                const cutDuration = cutTime - start
                if (cutDuration >= 0 && cutDuration < finalDuration - 0.0001) {
                    finalDuration = Math.max(0, cutDuration)
                    isConsumed = true
                }
            }

            if (isConsumed) {
                let finalBarWidth = finalDuration > 0 ? (timeToPx(start + finalDuration) - timeToPx(start)) : 0
                if (finalBarWidth > 0) {
                    finalBarWidth = Math.max(0, finalBarWidth - ICON_SIZE - BAR_MARGIN)
                }

                const barLeft = iconRect.left + ICON_SIZE + BAR_MARGIN
                const barRight = barLeft + finalBarWidth

                const transferRect = {
                    left: barRight,
                    width: 0,
                    right: barRight,
                    height: ICON_SIZE,
                    top: iconRect.top
                }
                map.set(`${status.id}_transfer`, { rect: transferRect })
            }
        }

        return map
    })

    const statusConsumptionTimeById = computed(() => {
        const map = new Map()

        const getNodeTime = (nodeWrap) => {
            if (!nodeWrap) return null
            if (nodeWrap.type === 'action') return Number(nodeWrap.node.startTime) || 0
            if (nodeWrap.type === 'status') return Number(nodeWrap.node.startTime) || 0
            if (nodeWrap.type === 'effect') {
                const actionWrap = getActionById(nodeWrap.actionId)
                if (!actionWrap) return null
                const offset = Number(nodeWrap.node?.offset) || 0
                return getShiftedEndTime(actionWrap.node.startTime, offset, actionWrap.id)
            }
            return null
        }

        for (const conn of connections.value) {
            if (!conn?.isConsumption) continue

            const fromId = _getConnectionEndpointId(conn, 'from')
            const toId = _getConnectionEndpointId(conn, 'to')
            if (!fromId || !toId) continue

            const fromNode = resolveNode(fromId)
            if (!fromNode || fromNode.type !== 'status') continue

            const toNode = resolveNode(toId)
            if (!toNode) continue

            const targetTime = getNodeTime(toNode)
            if (!Number.isFinite(targetTime)) continue

            const offset = Number(conn.consumptionOffset) || 0
            const consumptionTime = snapMs(targetTime - offset)

            const prev = map.get(fromId)
            if (prev === undefined || consumptionTime < prev) {
                map.set(fromId, consumptionTime)
            }
        }

        return map
    })

    function getNodeRect(id) {
        if (nodeRects.value[id]) return nodeRects.value[id]
        const effectLayout = effectLayouts.value.get(id)
        if (effectLayout) return effectLayout.rect
        const statusLayout = statusNodeRects.value.get(id)
        if (statusLayout) return statusLayout.rect
        return null
    }

    function toTimelineSpace(viewX, viewY) {
        return {
            x: viewX - timelineRect.value.left + timelineShift.value,
            y: viewY - timelineRect.value.top + timelineScrollTop.value
        }
    }

    function toViewportSpace(timelineX, timelineY) {
        return {
            x: timelineX - timelineShift.value + timelineRect.value.left,
            y: timelineY - timelineScrollTop.value + timelineRect.value.top
        }
    }


    // ===================================================================================
    // 右键菜单状态
    // ===================================================================================
    const contextMenu = ref({
        visible: false,
        x: 0,
        y: 0,
        targetId: null,
        time: 0
    })

    function openContextMenu(evt, instanceId = null, time = 0) {
        const timelinePos = toTimelineSpace(evt.clientX, evt.clientY)
        contextMenu.value = {
            visible: true,
            x: timelinePos.x,
            y: timelinePos.y,
            targetId: instanceId,
            time: time
        }
    }

    function closeContextMenu() {
        contextMenu.value.visible = false
    }

    // ===================================================================================
    // 动作属性切换 (锁定/静音/改色)
    // ===================================================================================

    function toggleActionLock(instanceId) {
        const info = getActionById(instanceId)
        if (info) {
            info.node.isLocked = !info.node.isLocked
            commitState()
        }
    }

    function toggleActionDisable(instanceId) {
        const info = getActionById(instanceId)
        if (info) {
            info.node.isDisabled = !info.node.isDisabled
            commitState()
        }
    }

    function setActionColor(instanceId, color) {
        const info = getActionById(instanceId)
        if (info) {
            info.node.customColor = color
            commitState()
        }
    }

    // ===================================================================================
    // 监控数据计算 (Monitor Data)
    // ===================================================================================
    const useNewCompiler = ref(false);

    function toggleNewCompiler() {
        useNewCompiler.value = !useNewCompiler.value;
    }

    const compiledScenario = computed(() => {
        const currentScenario = scenarioList.value.find(s => s.id === activeScenarioId.value);
        if (!currentScenario) return null;
        const { timeline, actors, teamConfig, enemyConfig } = compileScenario(
            {
                ...currentScenario.data,
                tracks: tracks.value // add tracks as a dependency
            }
            , { systemConstants: systemConstants.value });
        return { timeline, actors, teamConfig, enemyConfig };
    });

    const compiledTimeline = computed(() => {
        return compiledScenario.value?.timeline;
    });

    const simulation = computed(() => {
        const scenario = compiledScenario.value;
        if (!scenario) return null;
        const timeline = scenario.timeline;
        const teamConfig = scenario.teamConfig;
        const enemyConfig = scenario.enemyConfig;
        const actors = scenario.actors;
        return simulate(timeline, teamConfig, enemyConfig, actors);
    });

    const spSeries = computed(() => {
        if (!simulation.value) return [];
        return projectSpSeries(simulation.value.simLog, simulation.value.state.getInitialSnapshot());
    });

    const staggerSeries = computed(() => {
        if (!simulation.value) return [];
        return projectStaggerSeries(simulation.value.simLog, simulation.value.state.getInitialSnapshot(), compiledScenario.value.enemyConfig);
    });

    const timeContext = computed(() => compiledTimeline.value.timeContext);

    const legacyGlobalExtensions = computed(() => {
        const sources = [];
        tracks.value.forEach(track => {
            track.actions.forEach(action => {
                if (action.isDisabled || (action.triggerWindow || 0) < 0) return;
                if (action.type === 'link' || action.type === 'ultimate') {
                    sources.push({
                        logicalTime: action.logicalStartTime ?? action.startTime,
                        startTime: action.startTime,
                        type: action.type,
                        instanceId: action.instanceId,
                        animationTime: Number(action.animationTime) || 1.5
                    });
                }
            });
        });
        sources.sort((a, b) => a.logicalTime - b.logicalTime);

        const extensions = [];
        let cumulativeTime = 0;
        for (let i = 0; i < sources.length; i++) {
            const current = sources[i];
            const next = sources[i + 1];
            let amount = 0;

            if (current.type === 'ultimate') {
                amount = current.animationTime;
            } else {
                if (next) {
                    const gap = next.logicalTime - current.logicalTime;
                    amount = Math.min(0.5, Math.max(0.1, snapMs(gap)));
                } else {
                    amount = 0.5;
                }
            }
            const gameTime = current.startTime - cumulativeTime;
            extensions.push({
                time: current.startTime,
                gameTime: gameTime,
                amount: amount,
                sourceId: current.instanceId,
                logicalTime: current.logicalTime,
                cumulativeFreezeTime: cumulativeTime
            });
            cumulativeTime += amount;
        }
        return extensions;
    });

    const globalExtensions = computed(() => {
        return useNewCompiler.value ? compiledTimeline.value.timeExtensions : legacyGlobalExtensions.value;
    });

    function refreshAllActionShifts(excludeIds = []) {
        const excludeSet = new Set(Array.isArray(excludeIds) ? excludeIds : [excludeIds]);

        const allActions = tracks.value.flatMap(t => t.actions)
            .sort((a, b) => (a.logicalStartTime ?? a.startTime) - (b.logicalStartTime ?? b.startTime));

        const stopSources = allActions.filter(a => (a.type === 'link' || a.type === 'ultimate') && !a.isDisabled && (a.triggerWindow || 0) >= 0);

        let lastPhysicalEnd = 0;
        const sourceShiftMap = new Map();

        stopSources.forEach((source, index) => {
            const nextSource = stopSources[index + 1];

            const physicalStart = Math.max(source.logicalStartTime, lastPhysicalEnd);

            let amount = 0;
            if (source.type === 'ultimate') {
                amount = Number(source.animationTime) || 1.5;
            } else {
                if (nextSource) {
                    const gap = nextSource.logicalStartTime - source.logicalStartTime;
                    amount = Math.min(0.5, Math.max(0.1, snapMs(gap)));
                } else {
                    amount = 0.5;
                }
            }

            const shift = physicalStart - source.logicalStartTime;
            sourceShiftMap.set(source.instanceId, { shift, amount, physicalStart, physicalEnd: physicalStart + amount });

            lastPhysicalEnd = physicalStart + amount;
        });

        allActions.forEach(a => {
            if (excludeSet.has(a.instanceId)) return;

            const activeSource = [...stopSources].reverse().find(s => s.logicalStartTime <= a.logicalStartTime);

            if (activeSource) {
                const ctx = sourceShiftMap.get(activeSource.instanceId);

                if (a.instanceId === activeSource.instanceId) {
                    a.startTime = snapMs(ctx.physicalStart);
                } else {
                    const normalShiftedTime = a.logicalStartTime + ctx.shift;
                    a.startTime = snapMs(Math.max(normalShiftedTime, ctx.physicalEnd));
                }
            } else {
                a.startTime = a.logicalStartTime;
            }
        });

        tracks.value.forEach(t => t.actions.sort((a, b) => a.startTime - b.startTime));
    }

    function getShiftedEndTime(startTime, duration, excludeActionId = null) {
        if (useNewCompiler.value) {
            return timeContext.value.getShiftedEndTime(startTime, duration, excludeActionId);
        }

        let currentTimeLimit = startTime + duration;
        let processedExtensions = new Set();
        let changed = true;
        while (changed) {
            changed = false;
            globalExtensions.value.forEach(ext => {
                if (ext.sourceId !== excludeActionId && !processedExtensions.has(ext.sourceId) &&
                    ext.time >= startTime && ext.time < currentTimeLimit) {
                    currentTimeLimit += ext.amount;
                    processedExtensions.add(ext.sourceId);
                    changed = true;
                }
            });
        }
        return currentTimeLimit;
    }

    const ultimateEnhancementMetricsMap = computed(() => {
        const map = new Map()

        const getMetrics = (trackId, action) => {
            if (!action || action.type !== 'ultimate') return null
            const baseDuration = Number(action.enhancementTime) || 0
            if (baseDuration <= 0) return null

            const start = Number(action.startTime) || 0
            const enhStart = getShiftedEndTime(start, Number(action.duration) || 0, action.instanceId)

            let extraDuration = 0

            const extender = ULTIMATE_ENHANCEMENT_EXTENDERS[trackId]
            if (typeof extender === 'function') {
                const track = tracks.value.find(t => t.id === trackId)
                if (track) {
                    extraDuration = extender({
                        track,
                        enhStart,
                        baseDuration,
                        ultimateAction: action,
                        getShiftedEndTime,
                    })
                }
            }

            const finalEnd = getShiftedEndTime(enhStart, baseDuration + extraDuration, action.instanceId)
            const shiftedEnhDuration = finalEnd - enhStart
            const extensionAmount = snapMs(shiftedEnhDuration - baseDuration)

            return {
                enhStart,
                baseDuration,
                finalEnd,
                extensionAmount: Math.max(0, extensionAmount),
            }
        }

        for (const track of tracks.value) {
            if (!track?.id || !Array.isArray(track.actions)) continue
            for (const action of track.actions) {
                const metrics = getMetrics(track.id, action)
                if (!metrics) continue
                map.set(action.instanceId, metrics)
            }
        }

        return map
    })

    function getUltimateEnhancementMetrics(actionInstanceId) {
        return ultimateEnhancementMetricsMap.value.get(actionInstanceId) || null
    }

    function toGameTime(realTimeS) {
        if (useNewCompiler.value) {
            return timeContext.value.toGameTime(realTimeS);
        }

        const extensions = globalExtensions.value;

        for (const ext of extensions) {
            const freezeRealStart = ext.gameTime + ext.cumulativeFreezeTime;

            const freezeRealEnd = freezeRealStart + ext.amount;

            if (realTimeS >= freezeRealStart && realTimeS < freezeRealEnd) {
                return ext.gameTime;
            }

            if (realTimeS < freezeRealStart) {
                return realTimeS - ext.cumulativeFreezeTime;
            }
        }

        const last = extensions[extensions.length - 1];
        if (last) {
            const totalOffset = last.cumulativeFreezeTime + last.amount;
            return realTimeS - totalOffset;
        }

        return realTimeS;
    }

    function toRealTime(gameTimeS) {
        if (useNewCompiler.value) {
            return timeContext.value.toRealTime(gameTimeS);
        }

        const extensions = globalExtensions.value;
        const breakPoint = extensions.toReversed().find(e => e.gameTime <= gameTimeS);

        if (!breakPoint) return gameTimeS;

        if (gameTimeS === breakPoint.gameTime) {
            return gameTimeS + breakPoint.cumulativeFreezeTime;
        }

        return gameTimeS + breakPoint.cumulativeFreezeTime + breakPoint.amount;
    }

    function pushSubsequentActions(triggerTime, amount, excludeIds = []) {
        const excludeSet = new Set(Array.isArray(excludeIds) ? excludeIds : [excludeIds]);
        tracks.value.forEach(track => {
            track.actions.forEach(action => {
                if (!excludeSet.has(action.instanceId) && action.startTime >= triggerTime) {
                    action.startTime += amount;
                    if (action.logicalStartTime !== undefined) {
                        action.logicalStartTime += amount;
                    } else {
                        action.logicalStartTime = action.startTime;
                    }
                }
            });
            track.actions.sort((a, b) => a.startTime - b.startTime);
        });
    }

    function pullSubsequentActions(triggerTime, amount, excludeIds = []) {
        if (amount <= 0) return;
        const excludeSet = new Set(Array.isArray(excludeIds) ? excludeIds : [excludeIds]);
        tracks.value.forEach(track => {
            track.actions.forEach(action => {
                if (!excludeSet.has(action.instanceId) && action.startTime >= triggerTime) {
                    action.startTime = Math.max(0, action.startTime - amount);
                    if (action.logicalStartTime !== undefined) {
                        action.logicalStartTime = Math.max(0, action.logicalStartTime - amount);
                    } else {
                        action.logicalStartTime = action.startTime;
                    }
                }
            });
            track.actions.sort((a, b) => a.startTime - b.startTime);
        });
    }

    function calculateGlobalStaggerData() {
        const {
            maxStagger,
            staggerNodeCount,
            staggerNodeDuration,
            staggerBreakDuration
        } = systemConstants.value;

        const ORIGINIUM_ARTS_FACTOR = 0.005;

        const events = [];
        tracks.value.forEach(track => {
            if (!track.actions) return;
            const originiumArtsPower = Number(track.originiumArtsPower) || 0;
            const knockBonusMultiplier = 1 + originiumArtsPower * ORIGINIUM_ARTS_FACTOR;
            track.actions.forEach(action => {
                if (action.isDisabled || (action.triggerWindow || 0) < 0) return;

                // 收集所有失衡值变动事件，并进行时间对齐
                const effectTypeMap = new Map();
                if (action.physicalAnomaly && action.physicalAnomaly.length > 0) {
                    const rows = Array.isArray(action.physicalAnomaly[0])
                        ? action.physicalAnomaly
                        : [action.physicalAnomaly];
                    rows.forEach(row => {
                        row.forEach(effect => {
                            const id = ensureEffectId(effect);
                            effectTypeMap.set(id, effect.type);
                        })
                    })
                }

                if (action.damageTicks) {
                    action.damageTicks.forEach(tick => {
                        const staggerVal = Number(tick.stagger) || 0;
                        if (staggerVal > 0) {
                            const boundEffects = Array.isArray(tick.boundEffects) ? tick.boundEffects : [];
                            const hasKnockBinding = boundEffects.some(id => {
                                const type = effectTypeMap.get(id);
                                return type === 'knockup' || type === 'knockdown';
                            });
                            const bonusMultiplier = hasKnockBinding ? knockBonusMultiplier : 1;
                            const adjustedStagger = snapMs(staggerVal * bonusMultiplier);

                            const actualTickTime = getShiftedEndTime(action.startTime, Number(tick.offset) || 0, action.instanceId);
                            events.push({ time: snapMs(actualTickTime), change: adjustedStagger });
                        }
                    });
                }
            });
        });

        // 按物理时间排序
        events.sort((a, b) => a.time - b.time);

        const points = [{ time: 0, val: 0 }];
        const lockSegments = [];
        const nodeSegments = [];
        let currentVal = 0;
        let currentTime = 0;
        let lockedUntil = -1;
        const nodeStep = maxStagger / (staggerNodeCount + 1);
        const hasNodes = staggerNodeCount > 0;

        const advanceTime = (targetTime) => {
            const t = snapMs(targetTime);
            if (t > currentTime) {
                points.push({ time: t, val: currentVal });
                currentTime = t;
            }
        };

        events.forEach(ev => {
            advanceTime(ev.time);

            if (currentTime >= lockedUntil - 0.0001) {
                const prevVal = currentVal;
                currentVal += ev.change;

                // 触发失衡
                if (currentVal >= maxStagger - 0.0001) {
                    currentVal = 0;
                    // 击破时长受全局时间延长逻辑（时停）影响
                    const breakEnd = getShiftedEndTime(currentTime, staggerBreakDuration);
                    lockedUntil = snapMs(breakEnd);

                    lockSegments.push({ start: currentTime, end: lockedUntil });
                    points.push({ time: currentTime, val: 0 });
                }
                // 触发节点
                else if (hasNodes) {
                    const prevNodeIdx = Math.floor(prevVal / nodeStep + 0.0001);
                    const currNodeIdx = Math.floor(currentVal / nodeStep + 0.0001);

                    if (currNodeIdx > prevNodeIdx) {
                        // 节点锁定时间同样受延长逻辑影响
                        const nodeEnd = getShiftedEndTime(currentTime, staggerNodeDuration);
                        const finalNodeEnd = snapMs(nodeEnd);

                        nodeSegments.push({
                            start: currentTime,
                            end: finalNodeEnd,
                            thresholdVal: currNodeIdx * nodeStep
                        });
                    }
                }
            }
            points.push({ time: currentTime, val: currentVal });
        });

        if (currentTime < viewDuration.value) advanceTime(viewDuration.value);

        return { points, lockSegments, nodeSegments, nodeStep };
    }

    function calculateGlobalSpData() {
        const { maxSp, spRegenRate, initialSp, executionRecovery } = systemConstants.value;
        const prep = Math.max(MIN_PREP_DURATION, Number(prepDuration.value) || 0)
        const endTime = viewDuration.value

        const instantEvents = [];
        const pauseWindows = [];

        tracks.value.forEach(track => {
            track.actions.forEach(action => {
                if (action.isDisabled || (action.triggerWindow || 0) < 0) return;

                if (action.type === 'skill') {
                    pauseWindows.push({
                        start: snapMs(action.startTime),
                        end: snapMs(action.startTime + 0.5)
                    });
                }

                if (action.spCost > 0) {
                    instantEvents.push({
                        time: snapMs(action.startTime),
                        change: -Number(action.spCost)
                    });
                }

                if (action.spGain > 0) {
                    const actualEndTime = getShiftedEndTime(action.startTime, action.duration, action.instanceId);
                    instantEvents.push({ time: snapMs(actualEndTime), change: Number(action.spGain) });
                }

                if (action.type === 'execution') {
                    const actualEndTime = getShiftedEndTime(action.startTime, action.duration, action.instanceId);
                    instantEvents.push({
                        time: snapMs(actualEndTime),
                        change: Number(executionRecovery) || 0
                    });
                }

                if (action.damageTicks) {
                    action.damageTicks.forEach(tick => {
                        if (tick.sp > 0) {
                            const actualTickTime = getShiftedEndTime(action.startTime, tick.offset, action.instanceId);
                            instantEvents.push({ time: snapMs(actualTickTime), change: Number(tick.sp) });
                        }
                    });
                }
            });
        });

        // 战前准备：冻结全部 SP 变化
        if (prep > 0) {
            pauseWindows.push({ start: 0, end: snapMs(prep) })
        }

        globalExtensions.value.forEach(ext => {
            pauseWindows.push({
                start: snapMs(ext.time),
                end: snapMs(ext.time + ext.amount)
            });
        });

        const criticalTimes = new Set();
        criticalTimes.add(0);
        criticalTimes.add(snapMs(endTime));
        if (prep > 0) criticalTimes.add(snapMs(prep))

        instantEvents
            .filter(e => e.time >= prep - 0.0001)
            .forEach(e => criticalTimes.add(e.time));
        pauseWindows.forEach(w => {
            criticalTimes.add(w.start);
            criticalTimes.add(w.end);
        });

        const sortedTimes = Array.from(criticalTimes).sort((a, b) => a - b);

        const isPausedInterval = (t1, t2) => {
            const mid = (t1 + t2) / 2;
            return pauseWindows.some(w => mid >= w.start && mid < w.end);
        };

        const points = [];
        const parsedInit = Number(initialSp);
        let currentSp = isNaN(parsedInit) ? 200 : parsedInit;
        let prevTime = 0;

        for (let i = 0; i < sortedTimes.length; i++) {
            const now = sortedTimes[i];
            const dt = now - prevTime;

            if (dt > 0) {
                if (!isPausedInterval(prevTime, now)) {
                    if (currentSp < maxSp) {
                        const needed = maxSp - currentSp;
                        const potentialGain = dt * spRegenRate;

                        if (potentialGain > needed) {
                            const timeToCap = needed / spRegenRate;
                            points.push({ time: snapMs(prevTime + timeToCap), sp: maxSp });
                            currentSp = maxSp;
                        } else {
                            currentSp += potentialGain;
                        }
                    }
                }
            }

            points.push({ time: now, sp: currentSp });

            if (now < prep - 0.0001) {
                prevTime = now
                continue
            }

            const eventsNow = instantEvents.filter(e => e.time === now && e.time >= prep - 0.0001);
            if (eventsNow.length > 0) {
                eventsNow.forEach(e => {
                    currentSp += e.change;
                });
                if (currentSp > maxSp) currentSp = maxSp;
                points.push({ time: now, sp: currentSp });
            }
            prevTime = now;
        }

        return points;
    }

    function resolveGaugeMax(trackId, track, charInfo) {
        const libId = `${trackId}_ultimate`;
        const override = characterOverrides.value[libId];
        const max = (track.maxGaugeOverride && track.maxGaugeOverride > 0)
            ? track.maxGaugeOverride
            : ((override && override.gaugeCost) ? override.gaugeCost : (charInfo.ultimate_gaugeMax || 100));
        const num = Number(max);
        return Number.isFinite(num) && num > 0 ? num : 100;
    }

    function getTrackGaugeMax(trackId) {
        const track = tracks.value.find(t => t.id === trackId);
        if (!track) return 0;
        const charInfo = characterRoster.value.find(c => c.id === trackId);
        if (!charInfo) return 0;
        return resolveGaugeMax(trackId, track, charInfo);
    }

    const gaugeSeriesByTrackId = computed(() => {
        const map = new Map()
        for (const track of tracks.value) {
            if (!track?.id) continue
            map.set(track.id, calculateGaugeData(track.id))
        }
        return map
    })

    function calculateGaugeData(trackId) {
        const track = tracks.value.find(t => t.id === trackId);
        if (!track) return [];

        const efficiency = ((track.gaugeEfficiency ?? 100)) / 100;
        const charInfo = characterRoster.value.find(c => c.id === trackId);
        if (!charInfo) return [];

        const canAcceptTeamGauge = (charInfo.accept_team_gauge !== false);
        const GAUGE_MAX = resolveGaugeMax(trackId, track, charInfo);

        // 识别大招封禁区间（大招动画及强化期间不涨能）
        const blockWindows = [];
        if (track.actions) {
            track.actions.forEach(action => {
                if (action.type === 'ultimate' && !action.isDisabled) {
                    const start = snapMs(action.startTime);
                    const animT = Number(action.animationTime || 0);
                    const enhT = Number(action.enhancementTime || 0);

                    let end = null
                    if (typeof ULTIMATE_ENHANCEMENT_EXTENDERS[trackId] === 'function' && enhT > 0) {
                        const metrics = getUltimateEnhancementMetrics(action.instanceId)
                        if (metrics?.finalEnd) end = snapMs(metrics.finalEnd)
                    }

                    if (!end) {
                        end = snapMs(getShiftedEndTime(
                            action.startTime,
                            animT + enhT,
                            action.instanceId
                        ));
                    }

                    blockWindows.push({ start, end, sourceId: action.instanceId });
                }
            });
        }

        const isBlocked = (time, excludeId = null) => {
            const t = snapMs(time);
            const epsilon = 0.0001;
            return blockWindows.some(w =>
                w.sourceId !== excludeId &&
                t > w.start + epsilon &&
                t < w.end - epsilon
            );
        };

        const events = [];
        tracks.value.forEach(sourceTrack => {
            if (!sourceTrack.actions) return;
            sourceTrack.actions.forEach(action => {
                if (action.isDisabled || (action.triggerWindow || 0) < 0) return;

                // 自身动作能量变动
                if (sourceTrack.id === trackId) {
                    // 消耗：在开始时刻发生
                    if (action.gaugeCost > 0) {
                        events.push({ time: snapMs(action.startTime), change: -Number(action.gaugeCost) });
                    }
                    // 自身回能：在结束时刻触发
                    if (action.gaugeGain > 0) {
                        const triggerTime = getShiftedEndTime(action.startTime, action.duration, action.instanceId);
                        if (!isBlocked(triggerTime, action.instanceId)) {
                            events.push({ time: snapMs(triggerTime), change: action.gaugeGain * efficiency });
                        }
                    }
                }
                // 队友动作产生的全队回能
                else if (action.teamGaugeGain > 0 && canAcceptTeamGauge) {
                    const triggerTime = getShiftedEndTime(action.startTime, action.duration, action.instanceId);
                    if (!isBlocked(triggerTime, action.instanceId)) {
                        events.push({ time: snapMs(triggerTime), change: action.teamGaugeGain * efficiency });
                    }
                }
            });
        });

        // 排序所有变动事件
        events.sort((a, b) => a.time - b.time);

        const initialGauge = Number(track.initialGauge) || 0;
        let currentGauge = initialGauge > GAUGE_MAX ? GAUGE_MAX : initialGauge;
        const points = [{ time: 0, val: currentGauge, ratio: currentGauge / GAUGE_MAX }];

        // 模拟计算能量曲线
        events.forEach(ev => {
            points.push({ time: ev.time, val: currentGauge, ratio: currentGauge / GAUGE_MAX });
            currentGauge += ev.change;
            if (currentGauge > GAUGE_MAX) currentGauge = GAUGE_MAX;
            if (currentGauge < 0) currentGauge = 0;
            points.push({ time: ev.time, val: currentGauge, ratio: currentGauge / GAUGE_MAX });
        });

        points.push({ time: viewDuration.value, val: currentGauge, ratio: currentGauge / GAUGE_MAX });
        return points;
    }

    function togglePrepExpanded() {
        prepExpanded.value = !prepExpanded.value
        commitState()
    }

    function setPrepDuration(newDuration, { commit = true } = {}) {
        const next = Math.max(MIN_PREP_DURATION, Number(newDuration) || 0)
        const prev = Math.max(MIN_PREP_DURATION, Number(prepDuration.value) || 0)
        if (Math.abs(next - prev) < 0.0001) return

        const delta = next - prev

        // clamp so that no VT time becomes negative
        let minTime = Infinity
        tracks.value.forEach(t => {
            t.actions?.forEach(a => {
                const st = Number(a.startTime) || 0
                const lt = (a.logicalStartTime !== undefined) ? (Number(a.logicalStartTime) || 0) : st
                minTime = Math.min(minTime, st, lt)
            })
        })
        weaponStatuses.value.forEach(s => {
            const st = Number(s.startTime) || 0
            const lt = (s.logicalStartTime !== undefined) ? (Number(s.logicalStartTime) || 0) : st
            minTime = Math.min(minTime, st, lt)
        })
        cycleBoundaries.value.forEach(b => { minTime = Math.min(minTime, Number(b.time) || 0) })
        switchEvents.value.forEach(e => { minTime = Math.min(minTime, Number(e.time) || 0) })
        if (!Number.isFinite(minTime)) minTime = 0

        const minAllowedDelta = -minTime
        const appliedDelta = Math.max(delta, minAllowedDelta)

        const shiftVal = (v) => {
            const n = Number(v) || 0
            const out = n + appliedDelta
            return out < 0 ? 0 : out
        }

        tracks.value.forEach(track => {
            track.actions?.forEach(a => {
                a.startTime = shiftVal(a.startTime)
                if (a.logicalStartTime !== undefined) a.logicalStartTime = shiftVal(a.logicalStartTime)
                else a.logicalStartTime = a.startTime
            })
            track.actions?.sort((a, b) => a.startTime - b.startTime)
        })
        weaponStatuses.value.forEach(s => {
            s.startTime = shiftVal(s.startTime)
            if (s.logicalStartTime !== undefined) s.logicalStartTime = shiftVal(s.logicalStartTime)
            else s.logicalStartTime = s.startTime
        })
        cycleBoundaries.value.forEach(b => { b.time = shiftVal(b.time) })
        switchEvents.value.forEach(e => { e.time = shiftVal(e.time) })

        prepDuration.value = prev + appliedDelta
        refreshAllActionShifts()
        setTimelineShift(timelineShift.value)
        if (commit) commitState()
    }

    // ===================================================================================
    // 持久化与数据加载 (Persistence)
    // ===================================================================================

    const STORAGE_KEY = 'endaxis_autosave'

    function initAutoSave() {
        watchThrottled([tracks, connections, characterOverrides, weaponOverrides, equipmentCategoryOverrides, weaponStatuses, systemConstants, scenarioList, activeScenarioId, activeEnemyId, customEnemyParams, cycleBoundaries, switchEvents],
            ([newTracks, newConns, newOverrides, newWeaponOverrides, newEquipmentCatOverrides, newWeaponStatuses, newSys, newScList, newActiveId, newEnemyId, newCustomParams, newBoundaries, newSwEvents]) => {

                if (isLoading.value) return

                const listToSave = JSON.parse(JSON.stringify(newScList))
                const currentSc = listToSave.find(s => s.id === newActiveId)

                if (currentSc) {
                    currentSc.data = {
                        tracks: newTracks,
                        connections: newConns,
                        characterOverrides: newOverrides,
                        weaponOverrides: newWeaponOverrides,
                        equipmentCategoryOverrides: newEquipmentCatOverrides,
                        weaponStatuses: newWeaponStatuses,
                        prepDuration: prepDuration.value,
                        prepExpanded: prepExpanded.value,
                        systemConstants: newSys,
                        activeEnemyId: newEnemyId,
                        customEnemyParams: newCustomParams,
                        cycleBoundaries: newBoundaries,
                        switchEvents: newSwEvents
                    }
                }

                const snapshot = {
                    version: '1.0.0',
                    timestamp: Date.now(),
                    scenarioList: listToSave,
                    activeScenarioId: newActiveId,
                    systemConstants: newSys,
                    activeEnemyId: newEnemyId
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
            }, { deep: true, throttle: 500 })
    }

    function loadFromBrowser() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const data = JSON.parse(raw);

                if (!data.scenarioList) return false;

                if (data.systemConstants) systemConstants.value = { ...systemConstants.value, ...data.systemConstants };

                scenarioList.value = data.scenarioList.map(sc => {
                    const cloned = JSON.parse(JSON.stringify(sc))
                    if (cloned?.data) {
                        const normalized = normalizePrepConfig(cloned.data)
                        cloned.data = normalized.snapshot
                    }
                    return cloned
                })
                activeScenarioId.value = data.activeScenarioId || scenarioList.value[0].id

                const currentSc = scenarioList.value.find(s => s.id === activeScenarioId.value)
                if (currentSc && currentSc.data) {
                    _loadSnapshot(currentSc.data)
                } else {
                    tracks.value = createDefaultTracks();
                    connections.value = [];
                    characterOverrides.value = {};
                    weaponOverrides.value = {};
                    equipmentCategoryOverrides.value = {};
                    prepDuration.value = 5
                    prepExpanded.value = true
                }

                historyStack.value = []; historyIndex.value = -1; commitState();
                return true;
            } catch (e) { console.error("Auto-save load failed:", e) }
        }
        return false;
    }

    function resetProject() {
        localStorage.removeItem(STORAGE_KEY);
        tracks.value = createDefaultTracks();
        connections.value = [];
        characterOverrides.value = {};
        weaponOverrides.value = {};
        equipmentCategoryOverrides.value = {};
        weaponStatuses.value = [];
        cycleBoundaries.value = [];
        switchEvents.value = [];
        prepDuration.value = 5
        prepExpanded.value = true

        systemConstants.value = { ...DEFAULT_SYSTEM_CONSTANTS };

        activeEnemyId.value = 'custom';
        // 重置方案
        scenarioList.value = [{ id: 'default_sc', name: tr('timeline.scenario.defaultName', { index: 1 }), data: null }];
        activeScenarioId.value = 'default_sc';

        clearSelection();
        historyStack.value = [];
        historyIndex.value = -1;
        commitState();
    }


    async function fetchGameData() {
        try {
            isLoading.value = true

            const data = await executeFetch()

        if (data) {
            if (data.characterRoster) {
                characterRoster.value = data.characterRoster.sort((a, b) => (b.rarity || 0) - (a.rarity || 0))
                characterRoster.value.forEach(c => normalizeAttackSegmentsForCharacter(c))
            }
            if (data.ICON_DATABASE) {
                iconDatabase.value = data.ICON_DATABASE
            }
            if (data.enemyDatabase) {
                enemyDatabase.value = data.enemyDatabase
            }
            if (data.enemyCategories) {
                enemyCategories.value = data.enemyCategories
            }
            if (data.weaponDatabase) {
                weaponDatabase.value = (data.weaponDatabase || []).map(w => ({
                    ...w,
                    commonSlots: normalizeWeaponCommonSlots(w.commonSlots),
                    buffBonuses: normalizeWeaponBuffBonuses(w.buffBonuses),
                }))
            }
            if (data.equipmentDatabase) {
                equipmentDatabase.value = normalizeEquipmentDatabase(data.equipmentDatabase)
            } else {
                equipmentDatabase.value = []
            }
            if (data.equipmentCategories) {
                equipmentCategories.value = data.equipmentCategories
            } else {
                equipmentCategories.value = []
            }
            if (data.equipmentCategoryConfigs) {
                equipmentCategoryConfigs.value = data.equipmentCategoryConfigs
            } else {
                equipmentCategoryConfigs.value = {}
            }
            if (data.misc) {
                const eqCfg = normalizeEquipmentMiscConfig(data.misc)
                misc.value = {
                    modifierDefs: normalizeModifierDefs(data.misc?.modifierDefs),
                    weaponCommonModifiers: normalizeWeaponCommonModifiersTable(data.misc?.weaponCommonModifiers),
                    equipmentTemplates: eqCfg.equipmentTemplates,
                    equipmentAdapterTable: eqCfg.equipmentAdapterTable,
                    domainConfig: eqCfg.domainConfig,
                }
            } else {
                const eqCfg = normalizeEquipmentMiscConfig(null)
                misc.value = {
                    modifierDefs: [],
                    weaponCommonModifiers: {},
                    equipmentTemplates: eqCfg.equipmentTemplates,
                    equipmentAdapterTable: eqCfg.equipmentAdapterTable,
                    domainConfig: eqCfg.domainConfig,
                }
            }
        }

            historyStack.value = []
            historyIndex.value = -1
            commitState()

        } catch (error) {
            console.error("Load failed:", error)
        } finally {
            isLoading.value = false
        }
    }

    function getProjectData({ includeScenarios = null } = {}) {
        let listToExport = JSON.parse(JSON.stringify(scenarioList.value))

        if (includeScenarios) {
            const ids = Array.isArray(includeScenarios) ? includeScenarios : [includeScenarios];
            const allowedSet = new Set(ids);
            listToExport = listToExport.filter(s => allowedSet.has(s.id));
        }

        const currentSc = listToExport.find(s => s.id === activeScenarioId.value)
        if (currentSc) {
            currentSc.data = {
                tracks: tracks.value,
                connections: connections.value,
                characterOverrides: characterOverrides.value,
                weaponOverrides: weaponOverrides.value,
                equipmentCategoryOverrides: equipmentCategoryOverrides.value,
                weaponStatuses: weaponStatuses.value,
                prepDuration: prepDuration.value,
                prepExpanded: prepExpanded.value,
                activeEnemyId: activeEnemyId.value,
                customEnemyParams: customEnemyParams.value,
                cycleBoundaries: cycleBoundaries.value,
                switchEvents: switchEvents.value
            }
        }

        return {
            timestamp: Date.now(),
            version: '1.0.0',
            scenarioList: listToExport,
            activeScenarioId: activeScenarioId.value,
            systemConstants: systemConstants.value
        };
    }

    function exportProject({ filename } = {}) {
        const projectData = getProjectData();

        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const baseName = filename && filename.trim()
            ? filename.trim()
            : `endaxis_project_${new Date().toISOString().slice(0, 10)}.json`;
        link.download = baseName.toLowerCase().endsWith('.json') ? baseName : `${baseName}.json`;
        link.click();
        URL.revokeObjectURL(link.href)
    }

    async function exportShareString({ includeScenarios = null } = {}) {
        const projectData = getProjectData({ includeScenarios });
        const jsonString = JSON.stringify(projectData);
        return await compressGzip(jsonString);
    }

    async function importShareString(compressedStr) {
        try {
            const jsonString = await decompressGzip(compressedStr);
            if (!jsonString) return false;

            const data = JSON.parse(jsonString);
            return loadProjectData(data);
        } catch (e) {
            console.error("Import share code failed:", e);
            return false;
        }
    }

    function loadProjectData(data) {
        try {
            if (data.systemConstants) { systemConstants.value = { ...systemConstants.value, ...data.systemConstants }; }

            if (data.activeEnemyId) { activeEnemyId.value = data.activeEnemyId }

            if (data.customEnemyParams) {
                customEnemyParams.value = { ...customEnemyParams.value, ...data.customEnemyParams }
            }

            if (data.scenarioList) {
                // normalize & migrate legacy scenarios
                scenarioList.value = data.scenarioList.map(sc => {
                    const cloned = JSON.parse(JSON.stringify(sc))
                    if (cloned?.data) {
                        const normalized = normalizePrepConfig(cloned.data)
                        cloned.data = normalized.snapshot
                    }
                    return cloned
                })
                const validId = scenarioList.value.find(s => s.id === data.activeScenarioId) ? data.activeScenarioId : scenarioList.value[0].id
                activeScenarioId.value = validId

                const currentSc = scenarioList.value.find(s => s.id === activeScenarioId.value)
                if (currentSc && currentSc.data) {
                    _loadSnapshot(currentSc.data)
                } else {
                    tracks.value = createDefaultTracks();
                    connections.value = [];
                    characterOverrides.value = {};
                    weaponOverrides.value = {};
                    weaponStatuses.value = [];
                    cycleBoundaries.value = [];
                    switchEvents.value = [];
                    equipmentCategoryOverrides.value = {};
                    prepDuration.value = 5
                    prepExpanded.value = true
                }
            }

            clearSelection();
            historyStack.value = [];
            historyIndex.value = -1;
            commitState();
            return true;
        } catch (err) {
            console.error("Load project data failed:", err)
            return false
        }
    }

    async function importProject(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const success = loadProjectData(data);
                    if (success) resolve(true);
                    else reject(new Error("Invalid data structure"));
                } catch (err) { reject(err) }
            };
            reader.readAsText(file)
        })
    }

    return {
        MAX_SCENARIOS, toTimelineSpace, toViewportSpace, toGameTime, toRealTime, toggleNewCompiler,
        systemConstants, isLoading, characterRoster, iconDatabase, tracks, connections, activeTrackId, timelineScrollTop, timelineShift, timelineRect, trackLaneRects, nodeRects, draggingSkillData,
        selectedActionId, selectedLibrarySkillId, selectedLibrarySource, selectedWeaponStatusId, multiSelectedIds, clipboard, isCapturing, setIsCapturing, showCursorGuide, isBoxSelectMode, cursorPosTimeline, cursorCurrentTime, cursorPosition, snapStep,
        selectedAnomalyId, setSelectedAnomalyId, updateTrackGaugeEfficiency,
        teamTracksInfo, activeSkillLibrary, activeWeaponSkillLibrary, BASE_BLOCK_WIDTH, setBaseBlockWidth, formatTimeLabel, ZOOM_LIMITS, timeBlockWidth, ELEMENT_COLORS, getCharacterElementColor, isActionSelected, hoveredActionId, setHoveredAction,
        fetchGameData, exportProject, importProject, exportShareString, importShareString, TOTAL_DURATION, selectTrack, changeTrackOperator, clearTrack, selectLibrarySkill, updateLibrarySkill, selectAction, updateAction, updateWeaponStatus,
        addSkillToTrack, setDraggingSkill, setTimelineShift, setScrollTop, setTimelineRect, setTrackLaneRect, setNodeRect, calculateGlobalSpData, calculateGaugeData, getTrackGaugeMax, calculateGlobalStaggerData, updateTrackInitialGauge, updateTrackMaxGauge, updateTrackOriginiumArtsPower, updateTrackLinkCdReduction, updateTrackWeapon,
        updateTrackWeaponTier, syncAllWeaponModifiers, getModifierLabel,
        removeConnection, updateConnection, updateConnectionPort, getColor, toggleCursorGuide, toggleBoxSelectMode, setCursorPosition, toggleSnapStep, nudgeSelection,
        setMultiSelection, clearSelection, copySelection, pasteSelection, removeCurrentSelection, undo, redo, commitState,
        removeAnomaly, initAutoSave, loadFromBrowser, resetProject, selectedConnectionId, selectConnection, selectAnomaly,
        alignActionToTarget, moveTrack,
        connectionMap, actionMap, effectsMap, getConnectionById, resolveNode, getNodesOfConnection, enableConnectionTool, connectionDragState, connectionSnapState, validConnectionTargetIds, createConnection, toggleConnectionTool,
        cycleBoundaries, selectedCycleBoundaryId, addCycleBoundary, updateCycleBoundary, selectCycleBoundary,
        contextMenu, openContextMenu, closeContextMenu,
        switchEvents, selectedSwitchEventId, addSwitchEvent, updateSwitchEvent, selectSwitchEvent, selectWeaponStatus,
        toggleActionLock, toggleActionDisable, setActionColor,
        globalExtensions, getShiftedEndTime, refreshAllActionShifts, getActionById, getEffectById,
        getUltimateEnhancementMetrics,
        statusMap, getStatusById, statusNodeRects, statusConsumptionTimeById,
        enemyDatabase, activeEnemyId, applyEnemyPreset, ENEMY_TIERS, enemyCategories,
        scenarioList, activeScenarioId, switchScenario, addScenario, duplicateScenario, deleteScenario,
        effectLayouts, getNodeRect, weaponDatabase, weaponOverrides, weaponStatuses, activeWeapon, getWeaponById, isWeaponSkillId, addWeaponStatus,
        equipmentDatabase, equipmentCategories, equipmentCategoryConfigs, getEquipmentById, updateTrackEquipment, updateTrackEquipmentTier,
        equipmentCategoryOverrides, updateEquipmentCategoryOverride,
        activeSetBonusLibrary, addSetBonusStatus, getActiveSetBonusCategories,
        misc,
        prepDuration, prepExpanded, viewDuration, prepZoneWidthPx, totalTimelineWidthPx,
        timeToPx, pxToTime, formatAxisTimeLabel, togglePrepExpanded, setPrepDuration,
        useNewCompiler, compiledTimeline, spSeries, staggerSeries,
        gaugeSeriesByTrackId
    }
})