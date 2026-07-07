import { defineStore } from 'pinia'
import { ref, computed, watch, toRaw } from 'vue'
import { watchThrottled } from '@vueuse/core'
import { compressGzip, decompressGzip } from '@/utils/gzipUtils'
import { createDefaultStats } from '@/simulation/defaultActorStats'
import { simulate } from '@/simulation/simulator'
import { resetEnemyStaggerCarryover } from '@/simulation/state/EnemyState'
import { resolveEffectValueStatic } from '@/simulation/events/effectDispatch'
import { compileEndaxisScenario } from '@/simulation/adapters/compileEndaxisScenario'
import { projectOptimizerResult } from '@/simulation/adapters/projectOptimizerResult'
import { i18n } from '@/i18n'
import { snapMs } from '@/utils/precision.js'
import { FRAME_DURATION, formatTimeWithFrames, snapTimeToFrame } from '@/utils/time.js'
import { deserializeProjectData, serializeProjectData } from '@/utils/timeSerialization.js'
import { useOperatorStore } from '@/stores/operatorStore'
import { useWeaponStore } from '@/stores/weaponStore'
import { useGearStore } from '@/stores/gearStore'
import { findOperatorInstance, findWeaponInstance, findGearInstance } from '@/stores/timeline/instanceLookup'
import { buildControlledOperatorSegments, resolveControlledOperatorAt } from '@/stores/timeline/controlledOperator'
import {
    getOperator as getOperatorSheet,
    getOperatorList as getTimelineOperatorList,
    getWeapon as getWeaponSheet,
    getGearPiece,
    getOperatorTalentGroups,
    resolveOperatorSlug,
    resolveWeaponSlug,
    resolveGearPieceSlug,
    getWeaponList as getTimelineWeaponList,
    getGearPieceList as getTimelineGearPieceList,
    getEquipmentCategories as getTimelineEquipmentCategories,
    getEquipmentCategoryConfigs as getTimelineEquipmentCategoryConfigs,
    getIconDatabase as getTimelineIconDatabase,
    getSystemConstants as getTimelineSystemConstants,
    getEnemyList as getTimelineEnemyList,
    getEnemy
} from '@/data'
import {
    getEnemyGameName,
    getGearPieceGameName,
    getGearSetConditionalText,
    getGearSetGameName,
    getGearSetPassiveText,
    getGearSetZhName,
    getOperatorGameName,
    getOperatorSubSkillName,
    getWeaponGameName,
    getWeaponSkillDescription,
    getWeaponSkillPrefix,
    getWeaponSkillName,
} from '@/data/gameText'
import { getTeamStatus, statusToKey } from '@/data/team-status'
import { buildEffectById, collectEffects, collectTriggerEffects, patchCombatSkills, resolveEffect, resolveStatAttributes, resolveTriggerEffectLevel } from '@/data/collect'
import { CRITERION_MECHANISMS } from '@/data/contingencyContracts/criteriaEffects'
import {
    buildEffectiveEnemySystemConstants,
    getContingencyEnemyHealingRate,
} from '@/data/contingencyContracts/criteriaEffects'
import { isEnemyEffect } from '@/data/types'
import { createDefaultEnemyResistance, normalizeEnemyResistance } from '@/data/enemyResistance'
import { getBaseStatValues } from '@/data/stats/baseValues'
import { computeStats } from '@/data/stats/computeStats'
import { getSkillBounds, clampSkillLevel } from '@/utils/weaponBounds'
import {
    buildResolvedSegmentPayload,
    extractAggregateRawEntries,
    extractRawEntries,
    resolveHitsFromSheet,
} from '@/stores/timeline/resolveHits'

const tr = (key, params) => i18n.global.t(key, params)
const getI18nSkillType = (type) => {
    const displayType = OPTIMIZER_TO_DISPLAY_TYPE[type] || type
    const key = `skillType.${displayType}`
    const out = tr(key)
    return out === key ? tr('skillType.unknown') : out
}

const uid = () => Math.random().toString(36).substring(2, 9)
const COLLAPSED_PREP_PX = 18
const MIN_PREP_DURATION = FRAME_DURATION
const COARSE_SNAP_STEP = FRAME_DURATION * 6
const EQUIPMENT_REFINE_MAX_TIER = 3
const OPTIMIZER_TO_DISPLAY_TYPE = {
    basicAttack: 'attack',
    battleSkill: 'skill',
    comboSkill: 'link',
    ultimate: 'ultimate',
    finisher: 'execution',
    dive: 'dive',
}
const DEFAULT_BATTLE_SKILL_UE = 0
const DEFAULT_COMBO_SKILL_UE = 0
const LEGACY_WEAPON_STATUS_KEY = `weapon${'Statuses'}`
const resolveActionOptimizerSkillType = (action) => {
    if (!action) return null
    return action.type || null
}
const isComboLikeAction = (action) => resolveActionOptimizerSkillType(action) === 'comboSkill'
const isUltimateLikeAction = (action) => resolveActionOptimizerSkillType(action) === 'ultimate'

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
                const actionSkillType = resolveActionOptimizerSkillType(a)
                if (actionSkillType !== 'battleSkill' && actionSkillType !== 'comboSkill') continue
                if (processed.has(a.instanceId)) continue

                const t = Number(a.startTime) || 0
                if (t + epsilon < enhStart) continue
                if (t >= currentEnd - epsilon) continue

                let delta = Number(a.duration) || 0
                if (actionSkillType === 'comboSkill') {
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

const laevatainEnhancementExtender = createOwnSkillLinkEnhancer({ linkSubtract: 0 })

const ULTIMATE_ENHANCEMENT_EXTENDERS = {
    laevatain: laevatainEnhancementExtender,
}

function getUltimateEnhancementExtender(trackId) {
    const key = String(trackId ?? '').trim()
    return ULTIMATE_ENHANCEMENT_EXTENDERS[key]
        ?? ULTIMATE_ENHANCEMENT_EXTENDERS[key.toLowerCase()]
        ?? null
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

function dropLegacyTimedStatusData(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return snapshot
    delete snapshot[LEGACY_WEAPON_STATUS_KEY]
    return snapshot
}

function cloneJsonData(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value))
}

function resolveLevelNumber(value, levelIndex = 0, fallback = 0) {
    const raw = Array.isArray(value)
        ? value[Math.max(0, Math.min(levelIndex, value.length - 1))]
        : value
    const num = Number(raw)
    return Number.isFinite(num) ? num : fallback
}

function cloneActionHits(rawHits = [], effectIdMap = null) {
    const clonedHits = cloneJsonData(rawHits) || []
    clonedHits.forEach((hit) => {
        const effects = Array.isArray(hit?.effects) ? hit.effects : []
        effects.forEach((effect) => {
            if (!effect) return
            const oldId = effect._id
            effect._id = uid()
            if (effectIdMap && oldId) effectIdMap.set(oldId, effect._id)
        })
    })
    return clonedHits
}

function humanizeIdentifier(value) {
    if (!value) return ''
    return String(value)
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

function translateOperatorDisplayName(slug) {
    return getOperatorGameName(slug)
}

function getOperatorSkillIcon(slug, optimizerSkillType, skill) {
    if (typeof skill?.icon === 'string' && skill.icon.trim()) return skill.icon.trim()
    if (optimizerSkillType === 'battleSkill') return `/operators/${slug}/battle.webp`
    if (optimizerSkillType === 'comboSkill') return `/operators/${slug}/combo.webp`
    if (optimizerSkillType === 'ultimate') return `/operators/${slug}/ultimate.webp`
    return ''
}

export const useTimelineStore = defineStore('timeline', () => {
    const operatorStore = useOperatorStore()
    const weaponStore = useWeaponStore()
    const gearStore = useGearStore()

    // ===================================================================================
    // System configuration and constants
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
        executionRecovery: 25,
        enemyHp: 100000,
        superArmor: 0,
        resistance: createDefaultEnemyResistance()
    }

    function normalizeEnemyConfig(base, patch = {}) {
        return {
            ...base,
            ...(patch || {}),
            resistance: normalizeEnemyResistance(patch?.resistance ?? base?.resistance),
        }
    }

    function createDefaultSystemConstantsState() {
        return normalizeEnemyConfig(DEFAULT_SYSTEM_CONSTANTS)
    }

    const systemConstants = ref(createDefaultSystemConstantsState())
    const customEnemyParams = ref(normalizeEnemyConfig({
        maxStagger: 100,
        staggerNodeCount: 0,
        staggerNodeDuration: 2,
        staggerBreakDuration: 10,
        executionRecovery: 25,
        enemyHp: 100000,
        superArmor: 0,
    }))

    watch(systemConstants, (newVal) => {
        if (activeEnemyId.value === 'custom') {
            customEnemyParams.value = {
                maxStagger: newVal.maxStagger,
                staggerNodeCount: newVal.staggerNodeCount,
                staggerNodeDuration: newVal.staggerNodeDuration,
                staggerBreakDuration: newVal.staggerBreakDuration,
                executionRecovery: newVal.executionRecovery,
                enemyHp: newVal.enemyHp,
                superArmor: Number(newVal.superArmor) || 0,
                resistance: normalizeEnemyResistance(newVal.resistance)
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
        return formatTimeWithFrames(bt)
    }

    const ELEMENT_COLORS = {
        heat: "#ff4d4f", cryo: "#00e5ff", electric: "#ffbf00", nature: "#52c41a", physical: "#e0e0e0",
        comboSkill: "#fdd900", finisher: "#a61d24", dive: "#69c0ff", battleSkill: "#ffffff", ultimate: "#00e5ff", basicAttack: "#aaaaaa", default: "#8c8c8c",
        attack: "#aaaaaa", skill: "#ffffff", link: "#fdd900", execution: "#a61d24", dodge: "#69c0ff",
        heat_infliction: '#ff4d4f', heat_burst: '#ff7875', combustion: '#f5222d',
        cryo_infliction: '#00e5ff', cryo_burst: '#40a9ff', solidification: '#1890ff', shatter: '#bae7ff',
        electric_infliction: '#ffd700', electric_burst: '#fff566', electrification: '#ffec3d',
        nature_infliction: '#95de64', nature_burst: '#73d13d', corrosion: '#52c41a',
        lift: '#d9d9d9', knockdown: '#d9d9d9', crush: '#d9d9d9', breach: '#d9d9d9', vulnerability: '#d9d9d9',
    }

    const getColor = (key) => {
        return ELEMENT_COLORS[key] || ELEMENT_COLORS.default
    }

    const ENEMY_TIERS = [
        { labelKey: 'enemyTier.normal', label: 'Normal', value: 'normal', color: '#a0a0a0' },
        { labelKey: 'enemyTier.advanced', label: 'Advanced', value: 'advanced', color: '#52c41a' },
        { labelKey: 'enemyTier.elite', label: 'Elite', value: 'elite', color: '#d8b4fe' },
        { labelKey: 'enemyTier.boss', label: 'Boss', value: 'boss', color: '#ffd700' },
        { labelKey: 'enemyTier.leader', label: 'Leader', value: 'leader', color: '#ff4d4f' },
    ]
    // ===================================================================================
    // Core reactive state
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
    const activeEnemyLevel = ref(90)
    const enemyCategories = ref([])
    const cycleBoundaries = ref([])

    const activeScenarioId = ref('default_sc')
    function normalizeEnemyLevel(level) {
        const num = Number(level)
        if ([1, 20, 40, 60, 80, 90].includes(num)) return num
        return 90
    }

    function getEnemyHpForLevel(enemy, enemySheet, level) {
        const normalizedLevel = normalizeEnemyLevel(level)
        const levelHp = enemy?.levelHp ?? enemySheet?.levelHp
        return Number(levelHp?.[normalizedLevel]) || 0
    }

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

    watchThrottled([
        () => operatorStore.operators,
        () => weaponStore.weapons,
        () => gearStore.gears,
    ], () => {
        if (isLoading.value) return
        recomputeAllTrackOperatorStatuses()
        commitState()
    }, { deep: true, throttle: 120 })

    const createEmptyTrack = () => ({
        id: null,
        operatorInstanceId: null,
        actions: [],
        initialGauge: 0,
        maxGaugeOverride: null,
        gaugeEfficiency: 100,
        originiumArtsPower: 0,
        weaponId: null,
        weaponInstanceId: null,
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
        equipArmorInstanceId: null,
        equipGlovesInstanceId: null,
        equipAccessory1InstanceId: null,
        equipAccessory2InstanceId: null,
        equipArmorRefineTier: 0,
        equipGlovesRefineTier: 0,
        equipAccessory1RefineTier: 0,
        equipAccessory2RefineTier: 0,
        linkCdReduction: 0,
        operatorStatus: null,
        enemyStatus: null,
        triggerEffects: [],
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
    const runtimeInitialEffects = ref([])
    // Selected Contingency Contract criteria tags (numeric tag ids, e.g. 102803). The criterion
    // group + level is derived from the id: group = Math.floor(id/100), level = id % 100.
    const contingencyContractTags = ref([])

    function setContingencyContractTags(tagIds) {
        contingencyContractTags.value = Array.isArray(tagIds) ? tagIds.map(Number).filter(Number.isFinite) : []
    }

    const effectiveSystemConstants = computed(() =>
        buildEffectiveEnemySystemConstants(systemConstants.value, contingencyContractTags.value),
    )

    const effectiveEnemyHp = computed(() =>
        Math.max(1, Number(effectiveSystemConstants.value.enemyHp) || 1),
    )

    const contingencyEnemyHealingRate = computed(() =>
        getContingencyEnemyHealingRate(contingencyContractTags.value),
    )

    // Recompute when the selected Contingency Contract criteria change.
    watch(contingencyContractTags, () => {
        if (isLoading.value) return
        recomputeAllTrackOperatorStatuses()
        commitState()
    }, { deep: true })

    const inheritedInitialEffects = ref([])
    const inheritedInitialEnemyState = ref(null)
    const simulationEndline = ref(null)
    const lmdiAttributionMode = ref('stacks')

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
                let currentFlatIndex = 0
                for (let i = 0; i < (action.hits || []).length; i++) {
                    const hit = action.hits[i]
                    const effects = Array.isArray(hit?.effects) ? hit.effects : []
                    for (let j = 0; j < effects.length; j++) {
                        const effect = effects[j]
                        if (!effect?._id) continue
                        map.set(effect._id, {
                            id: effect._id,
                            node: effect,
                            actionId: action.instanceId,
                            hitIndex: i,
                            effectIndex: j,
                            flatIndex: currentFlatIndex++,
                            type: 'effect'
                        })
                    }
                }
            }
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

    function resolveNode(nodeId) {
        return getActionById(nodeId) || getEffectById(nodeId)
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
        if (!fromId || !toId) return null

        if (fromId) conn.fromNodeId = fromId
        if (toId) conn.toNodeId = toId

        const fromNode = fromId ? resolveNode(fromId) : null
        const toNode = toId ? resolveNode(toId) : null
        if (!fromNode || !toNode) return null

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

    function updateTrackGaugeEfficiency(trackId, value) {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
            recomputeAllTrackOperatorStatuses()
            commitState();
        }
    }

    function updateTrackOriginiumArtsPower(trackId, value) {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
            recomputeAllTrackOperatorStatuses()
            commitState();
        }
    }

    function updateTrackLinkCdReduction(trackId, value) {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
            recomputeAllTrackOperatorStatuses()
            commitState();
        }
    }

    function updateTrackWeapon(trackId, weaponId) {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
            track.weaponId = resolveWeaponSlug(weaponId) || weaponId || null;
            if (!track.weaponId) {
                track.weaponInstanceId = null
                projectTrackWeaponFromInstance(track, null)
            } else {
                const existing = track.weaponInstanceId ? findWeaponInstance(track.weaponInstanceId) : null
                if (existing && (resolveWeaponSlug(existing.weaponSlug) || existing.weaponSlug) === track.weaponId) {
                    projectTrackWeaponFromInstance(track, existing)
                } else {
                    replaceTrackWeaponInstance(track)
                }
            }
                pruneDanglingConnections()
            track.weaponAppliedDeltas = {}
            recomputeAllTrackOperatorStatuses()
            commitState();
        }
    }

    function updateTrackWeaponTier(trackId, part, tier) {
        const track = tracks.value.find(t => t.id === trackId)
        if (!track) return
        const nextTier = clampTier9(tier)
        let wpInst = track.weaponInstanceId ? findWeaponInstance(track.weaponInstanceId) : null
        if (!wpInst && track.weaponId) {
            wpInst = replaceTrackWeaponInstance(track)
        }
        if (!wpInst) return

        if (part === 'common1') weaponStore.updateWeapon(wpInst.id, { skill1Level: nextTier })
        else if (part === 'common2') weaponStore.updateWeapon(wpInst.id, { skill2Level: nextTier })
        else if (part === 'buff') weaponStore.updateWeapon(wpInst.id, { skill3Level: nextTier })
        else return

        wpInst = findWeaponInstance(wpInst.id) || wpInst
        projectTrackWeaponFromInstance(track, wpInst)
        track.weaponAppliedDeltas = {}
        recomputeAllTrackOperatorStatuses()
        commitState()
    }

    function updateTrackEquipment(trackId, slotKey, equipmentId) {
        const track = tracks.value.find(t => t.id === trackId);
        if (!track) return;

        const normalizedId = resolveGearPieceSlug(equipmentId) || equipmentId || null

        if (slotKey === 'armor') track.equipArmorId = normalizedId
        else if (slotKey === 'gloves') track.equipGlovesId = normalizedId
        else if (slotKey === 'accessory1') track.equipAccessory1Id = normalizedId
        else if (slotKey === 'accessory2') track.equipAccessory2Id = normalizedId

        const slotConfig = TRACK_GEAR_SLOTS.find(config => config.slotKey === slotKey)
        if (!slotConfig) return

        if (!normalizedId) {
            track[slotConfig.instanceKey] = null
            projectTrackGearSlotFromInstance(track, slotConfig, null)
        } else {
            const existing = track[slotConfig.instanceKey] ? findGearInstance(track[slotConfig.instanceKey]) : null
            if (existing && (resolveGearPieceSlug(existing.gearPieceId) || existing.gearPieceId) === normalizedId) {
                projectTrackGearSlotFromInstance(track, slotConfig, existing)
            } else {
                replaceTrackGearInstance(track, slotConfig)
            }
        }

        track.equipmentAppliedDeltas = {}
        recomputeAllTrackOperatorStatuses()
        commitState()
    }

    function updateTrackEquipmentTier(trackId, slotKey, tier, { commit = true } = {}) {
        const track = tracks.value.find(t => t.id === trackId)
        if (!track) return

        const slotConfig = TRACK_GEAR_SLOTS.find(config => config.slotKey === slotKey)
        if (!slotConfig) return

        let gearInst = track[slotConfig.instanceKey] ? findGearInstance(track[slotConfig.instanceKey]) : null
        if (!gearInst && track[slotConfig.idKey]) {
            gearInst = replaceTrackGearInstance(track, slotConfig)
        }
        if (!gearInst) return

        const piece = getGearPiece(gearInst.gearPieceId)
        const next = piece && Number(piece.levelRequirement) >= 70 ? clampEquipmentRefineTier(tier) : 0
        const levels = next > 0 ? createGearArtificingLevels(next) : []
        gearStore.updateGear(gearInst.id, { artificingLevels: levels })
        gearInst = findGearInstance(gearInst.id) || gearInst
        projectTrackGearSlotFromInstance(track, slotConfig, gearInst)
        track.equipmentAppliedDeltas = {}
        recomputeAllTrackOperatorStatuses()
        if (commit) commitState()
    }

    // ===================================================================================
    // Interaction state
    // ===================================================================================

    const activeTrackId = ref(null)
    const activeTrackIndex = ref(null)
    const timelineScrollTop = ref(0)
    const timelineShift = ref(0)
    const timelineRect = ref({ width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 })

    const trackLaneRects = ref({})

    const showCursorGuide = ref(false)
    const OPERATOR_EFFECTS_VISIBLE_KEY = 'endaxis:operator-effects-visible:v1'
    const operatorEffectsVisible = ref(loadOperatorEffectsVisible())
    const cursorPosition = ref({ x: 0, y: 0 })
    const snapStep = ref(FRAME_DURATION)

    const draggingSkillData = ref(null)

    const selectedConnectionId = ref(null)
    const selectedActionId = ref(null)
    const selectedLibrarySkillId = ref(null)
    const selectedAnomalyId = ref(null)

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
        return snapTimeToFrame(clamped)
    })

    function setIsCapturing(val) { isCapturing.value = val }

    function getOperatorEffectsTrackCount() {
        return Math.max(4, Array.isArray(tracks.value) ? tracks.value.length : 0)
    }

    function normalizeOperatorEffectsVisible(source, length = getOperatorEffectsTrackCount()) {
        const targetLength = Math.max(1, Number(length) || 0)
        return Array.from({ length: targetLength }, (_, index) => source?.[index] !== false)
    }

    function loadOperatorEffectsVisible() {
        try {
            const raw = localStorage.getItem(OPERATOR_EFFECTS_VISIBLE_KEY)
            if (!raw) return normalizeOperatorEffectsVisible([])
            const parsed = JSON.parse(raw)
            return normalizeOperatorEffectsVisible(Array.isArray(parsed) ? parsed : [])
        } catch {
            return normalizeOperatorEffectsVisible([])
        }
    }

    function persistOperatorEffectsVisible() {
        try {
            localStorage.setItem(
                OPERATOR_EFFECTS_VISIBLE_KEY,
                JSON.stringify(normalizeOperatorEffectsVisible(operatorEffectsVisible.value))
            )
        } catch {
            // ignore
        }
    }

    function ensureOperatorEffectsVisible() {
        const normalized = normalizeOperatorEffectsVisible(operatorEffectsVisible.value)
        const current = operatorEffectsVisible.value
        if (
            normalized.length !== current.length ||
            normalized.some((value, index) => value !== current[index])
        ) {
            operatorEffectsVisible.value = normalized
        }
    }

    function isOperatorEffectsVisible(index) {
        ensureOperatorEffectsVisible()
        return operatorEffectsVisible.value[index] !== false
    }

    watch(() => tracks.value.length, () => {
        ensureOperatorEffectsVisible()
        persistOperatorEffectsVisible()
    }, { immediate: true })

    const isActionSelected = (id) => selectedActionId.value === id || multiSelectedIds.value.has(id)

    // ===================================================================================
    // History state (undo/redo)
    // ===================================================================================

    const historyStack = ref([])
    const historyIndex = ref(-1)
    const MAX_HISTORY = 50

    function commitState() {
        const currentScenario = scenarioList.value.find(s => s.id === activeScenarioId.value)
        if (currentScenario) {
            currentScenario.data = _createSnapshot()
        }

        const snapshot = JSON.stringify({
            tracks: tracks.value,
            connections: connections.value,
            characterOverrides: characterOverrides.value,
            weaponOverrides: weaponOverrides.value,
            equipmentCategoryOverrides: equipmentCategoryOverrides.value,
            prepDuration: prepDuration.value,
            prepExpanded: prepExpanded.value,
            systemConstants: systemConstants.value,
            activeEnemyId: activeEnemyId.value,
            activeEnemyLevel: activeEnemyLevel.value,
            customEnemyParams: customEnemyParams.value,
            cycleBoundaries: cycleBoundaries.value,
            switchEvents: switchEvents.value,
            inheritedInitialEffects: inheritedInitialEffects.value,
            inheritedInitialEnemyState: inheritedInitialEnemyState.value,
            contingencyContractTags: contingencyContractTags.value,
            operators: operatorStore.operators,
            weapons: weaponStore.weapons,
            gears: gearStore.gears,
        })

        if (historyStack.value[historyIndex.value] === snapshot) {
            return
        }

        if (historyIndex.value < historyStack.value.length - 1) {
            historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
        }
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
        dropLegacyTimedStatusData(snapshot)
        restoreArmoryFromSnapshot(snapshot)
        tracks.value = normalizeTracks(snapshot.tracks)
        connections.value = normalizeConnections(snapshot.connections)
        characterOverrides.value = snapshot.characterOverrides || {}
        weaponOverrides.value = snapshot.weaponOverrides || {}
        equipmentCategoryOverrides.value = snapshot.equipmentCategoryOverrides || {}

        if (snapshot.systemConstants) {
            systemConstants.value = normalizeEnemyConfig(systemConstants.value, snapshot.systemConstants)
        }

        activeEnemyId.value = snapshot.activeEnemyId || activeEnemyId.value || 'custom'
        activeEnemyLevel.value = normalizeEnemyLevel(snapshot.activeEnemyLevel ?? activeEnemyLevel.value)

        if (snapshot.customEnemyParams) {
            customEnemyParams.value = normalizeEnemyConfig(customEnemyParams.value, snapshot.customEnemyParams)
        }

        if (snapshot.prepDuration !== undefined) {
            prepDuration.value = Math.max(MIN_PREP_DURATION, Number(snapshot.prepDuration) || 0)
        }

        if (snapshot.prepExpanded !== undefined) {
            prepExpanded.value = snapshot.prepExpanded !== false
        }

        cycleBoundaries.value = snapshot.cycleBoundaries || []
        switchEvents.value = snapshot.switchEvents || []
        inheritedInitialEffects.value = Array.isArray(snapshot.inheritedInitialEffects)
            ? JSON.parse(JSON.stringify(snapshot.inheritedInitialEffects))
            : []
        inheritedInitialEnemyState.value = snapshot.inheritedInitialEnemyState
            ? JSON.parse(JSON.stringify(snapshot.inheritedInitialEnemyState))
            : null
        contingencyContractTags.value = Array.isArray(snapshot.contingencyContractTags)
            ? snapshot.contingencyContractTags.map(Number).filter(Number.isFinite)
            : []
        recomputeAllTrackOperatorStatuses()
        clearSelection()
    }

    // ===================================================================================
    // Scenario management
    // ===================================================================================

    function _createSnapshot() {
        return dropLegacyTimedStatusData(JSON.parse(JSON.stringify({
            tracks: tracks.value,
            connections: connections.value,
            characterOverrides: characterOverrides.value,
            weaponOverrides: weaponOverrides.value,
            equipmentCategoryOverrides: equipmentCategoryOverrides.value,
            prepDuration: prepDuration.value,
            prepExpanded: prepExpanded.value,
            systemConstants: systemConstants.value,
            activeEnemyId: activeEnemyId.value,
            activeEnemyLevel: activeEnemyLevel.value,
            customEnemyParams: customEnemyParams.value,
            cycleBoundaries: cycleBoundaries.value,
            switchEvents: switchEvents.value,
            inheritedInitialEffects: inheritedInitialEffects.value,
            inheritedInitialEnemyState: inheritedInitialEnemyState.value,
            contingencyContractTags: contingencyContractTags.value,
            operators: operatorStore.operators,
            weapons: weaponStore.weapons,
            gears: gearStore.gears,
        })))
    }

    function _loadSnapshot(data) {
        if (!data) return
        const normalized = normalizePrepConfig(JSON.parse(JSON.stringify(data)))
        const incoming = dropLegacyTimedStatusData(normalized.snapshot)

        restoreArmoryFromSnapshot(incoming)
        const incomingTracks = incoming.tracks
            ? JSON.parse(JSON.stringify(incoming.tracks))
            : createDefaultTracks()
        tracks.value = normalizeTracks(incomingTracks)
        connections.value = normalizeConnections(JSON.parse(JSON.stringify(incoming.connections || [])))
        normalizeComboLinksInTracks()
        characterOverrides.value = JSON.parse(JSON.stringify(incoming.characterOverrides || {}))
        weaponOverrides.value = JSON.parse(JSON.stringify(incoming.weaponOverrides || {}))
        equipmentCategoryOverrides.value = JSON.parse(JSON.stringify(incoming.equipmentCategoryOverrides || {}))
        prepDuration.value = Math.max(MIN_PREP_DURATION, Number(incoming.prepDuration) || 0)
        prepExpanded.value = incoming.prepExpanded !== false

        if (incoming.systemConstants) {
            systemConstants.value = normalizeEnemyConfig(systemConstants.value, incoming.systemConstants)
        }
        activeEnemyId.value = incoming.activeEnemyId || 'custom'
        activeEnemyLevel.value = normalizeEnemyLevel(incoming.activeEnemyLevel ?? activeEnemyLevel.value)
        if (incoming.customEnemyParams) {
            customEnemyParams.value = normalizeEnemyConfig(customEnemyParams.value, incoming.customEnemyParams)
        }
        cycleBoundaries.value = incoming.cycleBoundaries ? JSON.parse(JSON.stringify(incoming.cycleBoundaries)) : []
        switchEvents.value = incoming.switchEvents ? JSON.parse(JSON.stringify(incoming.switchEvents)) : []
        inheritedInitialEffects.value = Array.isArray(incoming.inheritedInitialEffects)
            ? JSON.parse(JSON.stringify(incoming.inheritedInitialEffects))
            : []
        inheritedInitialEnemyState.value = incoming.inheritedInitialEnemyState
            ? JSON.parse(JSON.stringify(incoming.inheritedInitialEnemyState))
            : null
        contingencyContractTags.value = Array.isArray(incoming.contingencyContractTags)
            ? incoming.contingencyContractTags.map(Number).filter(Number.isFinite)
            : []
        recomputeAllTrackOperatorStatuses()
        clearSelection()
    }

    // ===================================================================================
    // Connection drag state
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
        resetTimelineViewport()
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
            prepDuration: 5,
            prepExpanded: true,
            systemConstants: createDefaultSystemConstantsState(),
            inheritedInitialEffects: [],
            inheritedInitialEnemyState: null,
        }

        scenarioList.value.push({ id: newId, name: newName, data: emptySnapshot })
        activeScenarioId.value = newId
        _loadSnapshot(emptySnapshot)
        resetTimelineViewport()

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

    function clampNumber(value, min, max) {
        const num = Number(value)
        if (!Number.isFinite(num)) return min
        return Math.max(min, Math.min(num, max))
    }

    function collectActionNodeIds(action, out) {
        if (!action || !out) return

        if (action.instanceId) out.add(action.instanceId)

        const collectEffect = (effect) => {
            if (effect?._id) out.add(effect._id)
        }

        if (Array.isArray(action.effects)) {
            action.effects.forEach(collectEffect)
        }

        if (Array.isArray(action.hits)) {
            action.hits.forEach((hit) => {
                if (Array.isArray(hit?.effects)) {
                    hit.effects.forEach(collectEffect)
                }
            })
        }
    }

    function buildInheritedResourceSnapshotAt(boundaryTime, sourceSnapshot) {
        const time = Math.max(0, Number(boundaryTime) || 0)

        const compiled = compileEndaxisScenario({
            scenarioData: sourceSnapshot,
            tracks: sourceSnapshot.tracks || tracks.value,
            characterRoster: characterRoster.value,
            systemConstants: buildEffectiveEnemySystemConstants(
                sourceSnapshot.systemConstants || systemConstants.value,
                sourceSnapshot.contingencyContractTags ?? contingencyContractTags.value,
            ),
            prepDuration: sourceSnapshot.prepDuration ?? prepDuration.value,
            activeEnemyId: sourceSnapshot.activeEnemyId ?? activeEnemyId.value,
            runtimeInitialEffects: [
                ...runtimeInitialEffects.value,
                ...(sourceSnapshot.inheritedInitialEffects || []),
            ],
            runtimeInitialEnemyState: sourceSnapshot.inheritedInitialEnemyState || inheritedInitialEnemyState.value,
            simulationEndline: time,
            lmdiAttributionMode: lmdiAttributionMode.value,
            controlledOperatorSegments: buildControlledOperatorSegments(
                (sourceSnapshot.tracks || tracks.value)?.[0]?.id ?? null,
                sourceSnapshot.switchEvents || [],
            ),
        })

        if (!compiled) return null

        const result = simulate(
            compiled.timeline,
            compiled.teamConfig,
            compiled.enemyConfig,
            compiled.actors,
            compiled.triggerRegistry,
            compiled.consumedStacksWriteKeys,
            {
                initialEffects: compiled.initialEffects,
                initialEnemyState: compiled.initialEnemyState,
                baseStatsByTrack: compiled.baseStatsByTrack,
                enemyDef: compiled.enemyDef,
                enemyResistance: compiled.enemyResistance,
                endlineTime: time,
                lmdiAttributionMode: compiled.lmdiAttributionMode,
                controlledOperatorSegments: compiled.controlledOperatorSegments,
            },
        )

        const finalSnapshot = result.state?.exportCarryoverSnapshot
            ? result.state.exportCarryoverSnapshot(time)
            : result.state?.snapshot?.()
        if (!finalSnapshot) return null

        return {
            time,
            team: {
                sp: Number(finalSnapshot.team?.sp) || 0,
                maxSp: Number(finalSnapshot.team?.maxSp) || Number(systemConstants.value.maxSp) || 300,
            },
            actors: (finalSnapshot.actors || []).map(actor => ({
                id: actor.id,
                gauge: Number(actor.resources?.gauge) || 0,
                maxGauge: Number(actor.resources?.maxGauge) || 0,
            })),
            operatorEffects: finalSnapshot.operatorEffects || [],
            enemyCarryover: finalSnapshot.enemyCarryover || null,
        }
    }

    function createInheritedScenarioData(sourceSnapshot, inheritedState, boundaryTime) {
        const time = Math.max(0, Number(boundaryTime) || 0)
        const epsilon = 0.0001

        const next = JSON.parse(JSON.stringify(sourceSnapshot))

        const sourcePrepDuration = Number(sourceSnapshot.prepDuration ?? prepDuration.value)
        const nextPrepDuration = Math.max(
            MIN_PREP_DURATION,
            Number.isFinite(sourcePrepDuration) ? sourcePrepDuration : 0,
        )

        const actorGaugeById = new Map(
            (inheritedState?.actors || []).map(actor => [actor.id, actor])
        )

        const shiftTime = (value) => {
            const battleOffset = Math.max(0, (Number(value) || 0) - time)
            return snapTimeToFrame(nextPrepDuration + battleOffset)
        }

        const keptNodeIds = new Set()

        next.tracks = (next.tracks || []).map(track => {
            const inheritedActor = actorGaugeById.get(track.id)

            const shiftedActions = (track.actions || [])
                .filter(action => {
                    const start = Number(action.startTime) || 0
                    return start >= time - epsilon
                })
                .map(action => {
                    const copy = JSON.parse(JSON.stringify(action))

                    copy.startTime = shiftTime(copy.startTime)

                    if (copy.logicalStartTime !== undefined) {
                        copy.logicalStartTime = shiftTime(copy.logicalStartTime)
                    } else {
                        copy.logicalStartTime = copy.startTime
                    }

                    collectActionNodeIds(copy, keptNodeIds)
                    return copy
                })

            let initialGauge = Number(track.initialGauge) || 0

            if (inheritedActor) {
                const charInfo = characterRoster.value.find(c => c.id === track.id)
                const maxGauge = charInfo
                    ? resolveGaugeMax(track.id, track, charInfo)
                    : Number(inheritedActor.maxGauge) || Number(track.maxGaugeOverride) || 100

                initialGauge = clampNumber(inheritedActor.gauge, 0, maxGauge)
            }

            return {
                ...track,
                initialGauge,
                actions: shiftedActions,
            }
        })

        next.connections = (next.connections || []).filter(conn => {
            const fromId = _getConnectionEndpointId(conn, 'from')
            const toId = _getConnectionEndpointId(conn, 'to')
            return keptNodeIds.has(fromId) && keptNodeIds.has(toId)
        })

        next.switchEvents = (next.switchEvents || [])
            .filter(event => (Number(event.time) || 0) >= time - epsilon)
            .map(event => ({
                ...event,
                time: shiftTime(event.time),
            }))

        next.cycleBoundaries = []
        next.inheritedInitialEffects = buildInheritedOperatorInitialEffects(inheritedState)
        next.inheritedInitialEnemyState = inheritedState?.enemyCarryover
            ? JSON.parse(JSON.stringify(inheritedState.enemyCarryover))
            : null
        next.prepDuration = nextPrepDuration
        next.prepExpanded = sourceSnapshot.prepExpanded !== false

        const maxSp = Number(next.systemConstants?.maxSp ?? systemConstants.value.maxSp) || 300
        const inheritedSp = Number(inheritedState?.team?.sp)

        next.systemConstants = {
            ...(next.systemConstants || {}),
            initialSp: Number.isFinite(inheritedSp)
                ? clampNumber(inheritedSp, 0, maxSp)
                : Number(next.systemConstants?.initialSp ?? systemConstants.value.initialSp) || 0,
        }

        return next
    }

    function createInheritedScenarioFromCycleBoundary(boundaryId) {
        if (scenarioList.value.length >= MAX_SCENARIOS) {
            return {
                ok: false,
                reason: 'limit',
            }
        }

        const boundary = cycleBoundaries.value.find(b => b.id === boundaryId)
        if (!boundary) {
            return {
                ok: false,
                reason: 'missing-boundary',
            }
        }

        const boundaryTime = Math.max(0, Number(boundary.time) || 0)

        const currentScenario = scenarioList.value.find(s => s.id === activeScenarioId.value)
        if (!currentScenario) {
            return {
                ok: false,
                reason: 'missing-scenario',
            }
        }

        currentScenario.data = _createSnapshot()

        const sourceSnapshot = JSON.parse(JSON.stringify(currentScenario.data))
        const inheritedState = buildInheritedResourceSnapshotAt(boundaryTime, sourceSnapshot)

        if (!inheritedState) {
            return {
                ok: false,
                reason: 'simulation-failed',
            }
        }

        const newData = createInheritedScenarioData(
            sourceSnapshot,
            inheritedState,
            boundaryTime,
        )

        const newId = `sc_${uid()}`
        const sourceName = currentScenario.name || tr('timeline.scenario.unnamed')
        const newName = `${sourceName} 继承 ${formatTimeLabel(boundaryTime)}`

        scenarioList.value.push({
            id: newId,
            name: newName,
            data: newData,
        })

        activeScenarioId.value = newId
        _loadSnapshot(newData)
        resetTimelineViewport()

        historyStack.value = []
        historyIndex.value = -1
        commitState()

        return {
            ok: true,
            scenarioId: newId,
            inheritedState,
        }
    }

    function buildInheritedOperatorInitialEffects(inheritedState) {
        if (!inheritedState) return []

        const sourceTime = Math.max(0, Number(inheritedState.time) || 0)

        return (inheritedState.operatorEffects || []).flatMap(group => {
            const targetTrackId = group.trackId
            if (!targetTrackId) return []

            const statusEffects = (group.effects || [])
                .map(entry => {
                    if (!entry?.id) return null

                    const expiresAt = Number(entry.expiresAt)
                    if (!Number.isFinite(expiresAt)) return null

                    const remainingDuration = Math.max(0, expiresAt - sourceTime)
                    if (remainingDuration <= 0) return null

                    return {
                        kind: 'status',
                        targetTrackId,
                        id: entry.id,
                        stat: entry.stat,
                        value: Number(entry.value) || 0,
                        sourceId: entry.sourceId || targetTrackId,
                        effect: entry.effect,
                        stacks: Math.max(1, Number(entry.stacks) || 1),
                        maxStacks: Math.max(1, Number(entry.maxStacks) || 1),
                        stackStrategy: entry.stackStrategy,
                        remainingDuration,
                        consumedStacks: entry.consumedStacks,
                    }
                })
                .filter(Boolean)

            const oneTimeEffects = (group.oneTimeEffects || [])
                .map(entry => {
                    if (!entry?.id) return null

                    const expiresAt = Number(entry.expiresAt)
                    if (!Number.isFinite(expiresAt)) return null

                    const remainingDuration = Math.max(0, expiresAt - sourceTime)
                    if (remainingDuration <= 0) return null

                    return {
                        kind: 'oneTime',
                        targetTrackId,
                        id: entry.id,
                        stat: entry.stat,
                        value: Number(entry.value) || 0,
                        sourceId: entry.sourceId || targetTrackId,
                        effect: entry.effect,
                        stacks: Math.max(1, Number(entry.stacks) || 1),
                        maxStacks: Math.max(1, Number(entry.maxStacks) || 1),
                        remainingDuration,
                        skillTypes: entry.skillTypes,
                        skillId: entry.skillId,
                    }
                })
                .filter(Boolean)

            return [
                ...statusEffects,
                ...oneTimeEffects,
            ]
        })
    }

    // ===================================================================================
    // Getters and helpers
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
        if (!('operatorStatus' in merged)) merged.operatorStatus = null
        if (!('baseStats' in merged)) merged.baseStats = null
        if (!('enemyStatus' in merged)) merged.enemyStatus = null
        if (!Array.isArray(merged.triggerEffects)) merged.triggerEffects = []

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

    const TRACK_GEAR_SLOTS = [
        { slotKey: 'armor', idKey: 'equipArmorId', instanceKey: 'equipArmorInstanceId', tierKey: 'equipArmorRefineTier' },
        { slotKey: 'gloves', idKey: 'equipGlovesId', instanceKey: 'equipGlovesInstanceId', tierKey: 'equipGlovesRefineTier' },
        { slotKey: 'accessory1', idKey: 'equipAccessory1Id', instanceKey: 'equipAccessory1InstanceId', tierKey: 'equipAccessory1RefineTier', teamKey: 'kit1' },
        { slotKey: 'accessory2', idKey: 'equipAccessory2Id', instanceKey: 'equipAccessory2InstanceId', tierKey: 'equipAccessory2RefineTier', teamKey: 'kit2' },
    ]

    const createDefaultTeamConditions = () => ({
        enemyStatusState: {
            toggles: {},
            stacks: {},
            hpThresholds: {},
            reactionDebuffs: {
                electrification: { active: false, level: 1, triggeringOperatorSlot: 0, corrosionTime: 0 },
                corrosion: { active: false, level: 1, triggeringOperatorSlot: 0, corrosionTime: 0 },
                breach: { active: false, level: 1, triggeringOperatorSlot: 0, corrosionTime: 0 },
            },
        },
        operatorStatusState: {
            stateToggles: {},
            hpThresholds: {},
        },
    })

    function createMaxOperatorInstanceData(operatorSlug) {
        const resolvedSlug = resolveOperatorSlug(operatorSlug) || operatorSlug
        const op = getOperatorSheet(resolvedSlug)
        const skillLevels = {}
        for (const key of Object.keys(op?.combatSkills || {})) {
            skillLevels[key] = 12
        }

        const talentStates = {}
        const talentGroups = getOperatorTalentGroups(operatorSlug) || []
        for (let i = 0; i < talentGroups.length; i++) {
            talentStates[String(i)] = talentGroups[i]?.levels ?? 0
        }

        return {
            operatorSlug: resolvedSlug,
            level: 90,
            promoted: true,
            potential: op?.defaultPotential ?? ((op?.rarity || 6) <= 5 ? 5 : 0),
            skillLevels,
            talentStates,
            trustLevel: 4,
        }
    }

    function createWeaponInstanceData(track, weaponSlug) {
        const resolvedSlug = resolveWeaponSlug(weaponSlug) || weaponSlug
        const weaponSheet = getWeaponSheet(resolvedSlug)
        const rarity = Number(weaponSheet?.rarity) || 6
        const potential = rarity <= 5 ? 5 : 0
        const bounds = getSkillBounds(90, true, potential)

        return {
            weaponSlug: resolvedSlug,
            level: 90,
            tuned: true,
            potential,
            skill1Level: bounds.skill1.max,
            skill2Level: bounds.skill2.max,
            skill3Level: bounds.skill3.max,
        }
    }

    function createGearArtificingLevels(tier) {
        const level = clampEquipmentRefineTier(tier)
        return [level, level, level, level]
    }

    function createGearInstanceData(track, slotConfig, gearPieceId) {
        const resolvedGearPieceId = resolveGearPieceSlug(gearPieceId) || gearPieceId
        const piece = getGearPiece(resolvedGearPieceId)
        return {
            gearPieceId: resolvedGearPieceId,
            artificingLevels: piece && Number(piece.levelRequirement) >= 70
                ? createGearArtificingLevels(track?.[slotConfig.tierKey])
                : [],
        }
    }

    function projectTrackWeaponFromInstance(track, weaponInstance = null) {
        if (!track) return
        const wpInst = weaponInstance || (track.weaponInstanceId ? findWeaponInstance(track.weaponInstanceId) : null)
        if (!wpInst) {
            track.weaponId = null
            track.weaponCommon1Tier = 1
            track.weaponCommon2Tier = 1
            track.weaponBuffTier = 1
            return
        }

        track.weaponId = resolveWeaponSlug(wpInst.weaponSlug) || wpInst.weaponSlug
        track.weaponCommon1Tier = clampTier9(wpInst.skill1Level ?? 1)
        track.weaponCommon2Tier = clampTier9(wpInst.skill2Level ?? 1)
        track.weaponBuffTier = clampTier9(wpInst.skill3Level ?? 1)
    }

    function projectTrackGearSlotFromInstance(track, slotConfig, gearInstance = null) {
        if (!track || !slotConfig) return
        const gearInst = gearInstance || (track[slotConfig.instanceKey] ? findGearInstance(track[slotConfig.instanceKey]) : null)
        if (!gearInst) {
            track[slotConfig.idKey] = null
            track[slotConfig.tierKey] = 0
            return
        }

        track[slotConfig.idKey] = resolveGearPieceSlug(gearInst.gearPieceId) || gearInst.gearPieceId
        const piece = getGearPiece(track[slotConfig.idKey])
        const levels = Array.isArray(gearInst.artificingLevels) ? gearInst.artificingLevels : []
        const projectedTier = levels.length > 0 ? Math.max(...levels.map(level => clampEquipmentRefineTier(level))) : 0
        track[slotConfig.tierKey] = piece && Number(piece.levelRequirement) >= 70 ? projectedTier : 0
    }

    function projectTrackLoadoutFromInstances(track) {
        if (!track) return
        projectTrackWeaponFromInstance(track)
        for (const slotConfig of TRACK_GEAR_SLOTS) {
            projectTrackGearSlotFromInstance(track, slotConfig)
        }
    }

    function replaceTrackWeaponInstance(track) {
        if (!track?.weaponId) {
            track.weaponInstanceId = null
            return null
        }
        const instance = weaponStore.importWeapon(createWeaponInstanceData(track, track.weaponId))
        track.weaponInstanceId = instance.id
        projectTrackWeaponFromInstance(track, instance)
        return instance
    }

    function replaceTrackGearInstance(track, slotConfig) {
        const gearPieceId = track?.[slotConfig.idKey]
        if (!gearPieceId) {
            track[slotConfig.instanceKey] = null
            return null
        }
        const instance = gearStore.importGear(createGearInstanceData(track, slotConfig, gearPieceId))
        track[slotConfig.instanceKey] = instance.id
        projectTrackGearSlotFromInstance(track, slotConfig, instance)
        return instance
    }

    function hydrateTrackInstances(track) {
        if (!track) return

        let opInst = track.operatorInstanceId ? findOperatorInstance(track.operatorInstanceId) : null
        const normalizedTrackOperatorId = resolveOperatorSlug(track.id) || track.id
        if (normalizedTrackOperatorId !== track.id) {
            track.id = normalizedTrackOperatorId
        }
        if (opInst) {
            const normalizedOperatorSlug = resolveOperatorSlug(opInst.operatorSlug) || opInst.operatorSlug
            if (normalizedOperatorSlug !== opInst.operatorSlug) {
                opInst.operatorSlug = normalizedOperatorSlug
            }
        }
        if (!opInst && track.id) {
            opInst = operatorStore.importOperator(createMaxOperatorInstanceData(track.id))
            track.operatorInstanceId = opInst.id
        }
        if (opInst) {
            track.id = resolveOperatorSlug(opInst.operatorSlug) || opInst.operatorSlug
        } else {
            track.operatorInstanceId = null
            track.id = null
        }

        let wpInst = track.weaponInstanceId ? findWeaponInstance(track.weaponInstanceId) : null
        const normalizedTrackWeaponId = resolveWeaponSlug(track.weaponId) || track.weaponId
        if (normalizedTrackWeaponId !== track.weaponId) {
            track.weaponId = normalizedTrackWeaponId
        }
        if (wpInst) {
            const normalizedWeaponSlug = resolveWeaponSlug(wpInst.weaponSlug) || wpInst.weaponSlug
            if (normalizedWeaponSlug !== wpInst.weaponSlug) {
                wpInst.weaponSlug = normalizedWeaponSlug
            }
        }
        if (wpInst && wpInst.weaponSlug !== track.weaponId) {
            wpInst = null
        }
        if (!track.weaponId) {
            track.weaponInstanceId = null
        } else if (!wpInst) {
            wpInst = replaceTrackWeaponInstance(track)
        } else {
            projectTrackWeaponFromInstance(track, wpInst)
        }

        for (const slotConfig of TRACK_GEAR_SLOTS) {
            const normalizedGearPieceId = resolveGearPieceSlug(track[slotConfig.idKey]) || track[slotConfig.idKey]
            if (normalizedGearPieceId !== track[slotConfig.idKey]) {
                track[slotConfig.idKey] = normalizedGearPieceId
            }
            let gearInst = track[slotConfig.instanceKey]
                ? findGearInstance(track[slotConfig.instanceKey])
                : null
            if (gearInst && gearInst.gearPieceId !== track[slotConfig.idKey]) {
                gearInst = null
            }
            if (!track[slotConfig.idKey]) {
                track[slotConfig.instanceKey] = null
            } else if (!gearInst) {
                gearInst = replaceTrackGearInstance(track, slotConfig)
            } else {
                projectTrackGearSlotFromInstance(track, slotConfig, gearInst)
            }
        }

        projectTrackLoadoutFromInstances(track)
    }

    function restoreArmoryFromSnapshot(snapshot) {
        if (Array.isArray(snapshot?.operators)) operatorStore.setAll(snapshot.operators)
        else operatorStore.clearAll()

        if (Array.isArray(snapshot?.weapons)) weaponStore.setAll(snapshot.weapons)
        else weaponStore.clearAll()

        if (Array.isArray(snapshot?.gears)) gearStore.setAll(snapshot.gears)
        else gearStore.clearAll()
    }

    function applyOperatorStatusProjection(track, status) {
        if (!track.stats || typeof track.stats !== 'object') {
            track.stats = createDefaultStats()
        }

        if (!status) {
            track.operatorStatus = null
            track.baseStats = null
            track.enemyStatus = null
            track.triggerEffects = []
            track.stats.primary_ability = 0
            track.stats.secondary_ability = 0
            track.stats.attack = 0
            track.stats.hp = 0
            track.stats.crit_rate = 0
            track.stats.crit_dmg = 0
            track.stats.strength = 0
            track.stats.agility = 0
            track.stats.intellect = 0
            track.stats.will = 0
            track.stats.originium_arts_power = 0
            track.stats.ult_charge_eff = 100
            track.stats.link_cd_reduction = 0
            track.stats.combo_cd_reduction = 0
            track.stats.combo_cd_reduction_flat = 0
            track.stats.ult_cd_reduction = 0
            track.stats.ult_cd_reduction_flat = 0
            track.stats.combo_cd_external_mult = 1
            track.stats.ult_cd_external_mult = 1
            track.gaugeEfficiency = 100
            track.originiumArtsPower = 0
            track.linkCdReduction = 0
            return
        }

        track.operatorStatus = status
        track.stats.strength = status.attributes?.strength ?? 0
        track.stats.agility = status.attributes?.agility ?? 0
        track.stats.intellect = status.attributes?.intellect ?? 0
        track.stats.will = status.attributes?.will ?? 0
        track.stats.primary_ability = status.mainAttribute ?? 0
        track.stats.secondary_ability = status.secondaryAttribute ?? 0
        track.stats.attack = status.attack ?? 0
        track.stats.hp = status.health ?? 0
        track.stats.crit_rate = (status.critRate ?? 0) * 100
        track.stats.crit_dmg = (status.critDmg ?? 0) * 100
        track.stats.originium_arts_power = status.artsIntensity ?? 0
        track.stats.ult_charge_eff = 100 + (status.ultimateGainEfficiency ?? 0)
        track.stats.link_cd_reduction = status.comboCdReductionPercent ?? 0
        track.stats.combo_cd_reduction = status.comboCdReductionPercent ?? 0
        track.stats.combo_cd_reduction_flat = status.comboCdReductionFlat ?? 0
        track.stats.ult_cd_reduction = status.ultCdReductionPercent ?? 0
        track.stats.ult_cd_reduction_flat = status.ultCdReductionFlat ?? 0
        track.stats.combo_cd_external_mult = status.comboCdExternalMult ?? 1
        track.stats.ult_cd_external_mult = status.ultCdExternalMult ?? 1
        track.gaugeEfficiency = Number(track.stats.ult_charge_eff) || 100
        track.originiumArtsPower = Number(track.stats.originium_arts_power) || 0
        track.linkCdReduction = clampPercent(track.stats.link_cd_reduction)
    }

    function buildTimelineArmoryContext() {
        const emptySlot = { operatorId: null, weaponId: null, gear: { armor: null, gloves: null, kit1: null, kit2: null } }
        const teamSlots = [JSON.parse(JSON.stringify(emptySlot)), JSON.parse(JSON.stringify(emptySlot)), JSON.parse(JSON.stringify(emptySlot)), JSON.parse(JSON.stringify(emptySlot))]
        const operatorInstances = []
        const weaponInstances = []
        const gearInstances = []
        const operatorIds = new Set()
        const weaponIds = new Set()
        const gearIds = new Set()
        const slotTrackIds = []
        const trackMetaById = new Map()

        for (let index = 0; index < Math.min(tracks.value.length, 4); index++) {
            const track = tracks.value[index]
            const opInst = track?.operatorInstanceId ? findOperatorInstance(track.operatorInstanceId) : null
            if (!opInst) continue

            const wpInst = track.weaponInstanceId ? findWeaponInstance(track.weaponInstanceId) : null
            const gear = { armor: null, gloves: null, kit1: null, kit2: null }
            for (const slotConfig of TRACK_GEAR_SLOTS) {
                const gearInstId = track[slotConfig.instanceKey]
                const gearInst = gearInstId ? findGearInstance(gearInstId) : null
                if (!gearInst) continue
                gear[slotConfig.teamKey || slotConfig.slotKey] = gearInst.id
                if (!gearIds.has(gearInst.id)) {
                    gearIds.add(gearInst.id)
                    gearInstances.push(toRaw(gearInst))
                }
            }

            teamSlots[index] = {
                operatorId: opInst.id,
                weaponId: wpInst?.id || null,
                gear,
            }
            slotTrackIds[index] = track.id || null

            const operatorSheet = getOperatorSheet(opInst.operatorSlug)
            trackMetaById.set(track.id, {
                slotIndex: index,
                operatorSlug: opInst.operatorSlug,
                class: operatorSheet?.class || null,
                element: operatorSheet?.element || null,
                mainAttribute: operatorSheet?.mainAttribute || operatorSheet?.primaryAttribute || null,
                subAttribute: operatorSheet?.subAttribute || operatorSheet?.secondaryAttribute || null,
            })

            if (!operatorIds.has(opInst.id)) {
                operatorIds.add(opInst.id)
                operatorInstances.push(toRaw(opInst))
            }
            if (wpInst && !weaponIds.has(wpInst.id)) {
                weaponIds.add(wpInst.id)
                weaponInstances.push(toRaw(wpInst))
            }
        }

        return {
            team: { id: '_timeline_armory', name: '', slots: teamSlots },
            operatorInstances,
            weaponInstances,
            gearInstances,
            slotTrackIds,
            trackMetaById,
        }
    }

    function resolveInitialEffectTargetTrackIds(effect, sourceSlotIndex, slotTrackIds, trackMetaById) {
        const sourceTrackId = slotTrackIds[sourceSlotIndex] || null
        const rawTarget = effect?.target
        const scope = typeof rawTarget === 'string' ? rawTarget : rawTarget?.scope
        const allowedClasses = Array.isArray(rawTarget?.classes) ? rawTarget.classes : null

        const candidateTrackIds = [...trackMetaById.keys()].filter((trackId) => {
            if (!allowedClasses?.length) return true
            const trackClass = trackMetaById.get(trackId)?.class
            return !!trackClass && allowedClasses.includes(trackClass)
        })

        if (scope === 'enemy') return ['boss']
        if (!sourceTrackId) return []

        const sourceElement = trackMetaById.get(sourceTrackId)?.element || null
        switch (scope) {
            case 'team':
                return candidateTrackIds
            case 'teamExcludeSelf':
                return candidateTrackIds.filter((trackId) => trackId !== sourceTrackId)
            case 'teamExcludeSameElement':
                return candidateTrackIds.filter((trackId) => {
                    if (trackId === sourceTrackId) return false
                    return trackMetaById.get(trackId)?.element !== sourceElement
                })
            case 'owner':
            case 'self':
            case undefined:
            case null:
                return [sourceTrackId]
            default:
                return [sourceTrackId]
        }
    }

    function buildInitialRuntimeEffectsFromCollected(collectedEffects, armoryContext) {
        const ENEMY_STAT_MODIFIERS = new Set(['susceptibility', 'increasedDmgTaken', 'resistanceShred'])
        const actorStatsMap = new Map(tracks.value.map(track => [track.id, track.stats]))

        return collectedEffects.flatMap((ce) => {
            const effect = ce?.effect
            if (!effect || effect.kind !== 'status' || effect.condition || !effect.stat) return []

            const rawTarget = effect.target
            const scope = typeof rawTarget === 'string' ? rawTarget : rawTarget?.scope
            if (scope === 'enemy') return []
            if (effect.stat?.modifier && ENEMY_STAT_MODIFIERS.has(effect.stat.modifier)) return []

            const sourceActorId = armoryContext.slotTrackIds[ce.sourceSlotIndex] || null
            if (!sourceActorId) return []
            const value = resolveEffectValueStatic(effect, actorStatsMap.get(sourceActorId))
            const runtimeEffect = {
                ...effect,
                hide: true,
            }

            return resolveInitialEffectTargetTrackIds(
                effect,
                ce.sourceSlotIndex,
                armoryContext.slotTrackIds,
                armoryContext.trackMetaById,
            ).filter((targetId) => targetId !== 'boss').map((targetId) => {
                const targetMeta = armoryContext.trackMetaById.get(targetId)
                const resolvedStat = resolveStatAttributes(
                    effect.stat,
                    targetMeta?.mainAttribute,
                    targetMeta?.subAttribute,
                )
                return {
                    targetTrackId: targetId,
                    id: effect.id,
                    stat: resolvedStat,
                    value,
                    sourceId: sourceActorId,
                    effect: { ...runtimeEffect, stat: resolvedStat },
                    stacks: effect.stacks,
                    maxStacks: effect.maxStacks,
                    stackStrategy: effect.stackStrategy,
                    external: effect.external,
                }
            })
        })
    }

    function buildConditionalPassiveTriggerEffectsFromCollected(collectedEffects, armoryContext) {
        const out = []

        collectedEffects.forEach((ce) => {
            const effect = ce?.effect
            if (!effect || effect.kind !== 'status' || !effect.condition) return
            if (Array.isArray(effect.condition)) return

            let cond = effect.condition
            if (cond.kind === 'enemyStaggered') {
                cond = { kind: 'enemyStatus', status: 'staggered' }
            }
            if (cond.kind !== 'operatorStatus' && cond.kind !== 'enemyStatus') return

            const sourceTrackId = armoryContext.slotTrackIds[ce.sourceSlotIndex] || null
            if (!sourceTrackId) return

            const isEnemyTarget = isEnemyEffect(effect)
            const idempotencyCondition = isEnemyTarget
                ? { kind: 'not', condition: { kind: 'enemyStatus', status: effect.id } }
                : { kind: 'not', condition: { kind: 'operatorStatus', status: effect.id } }

            const scope = cond.kind === 'operatorStatus' ? 'self' : 'enemy'
            out.push({
                triggerEffect: {
                    trigger: { kind: 'onStatusApplied', status: cond.status, scope },
                    effects: [{ ...effect, duration: 999, condition: idempotencyCondition }],
                },
                sourceSlotIndex: ce.sourceSlotIndex,
                sourceOperatorSlug: ce.sourceOperatorSlug,
                sourceTrackId,
                stacksConstraint: cond.stacks,
            })

            const removeCondition = cond.stacks
                ? { kind: 'not', condition: { kind: cond.kind, status: cond.status, stacks: cond.stacks } }
                : undefined
            const isTeamScoped = effect.target === 'team' || effect.target?.scope === 'team'
            const removeEffect = isEnemyTarget
                ? {
                    kind: 'consume',
                    enemyStatus: effect.id,
                    ...(removeCondition ? { condition: removeCondition } : {}),
                }
                : {
                    kind: 'consume',
                    operatorStatus: effect.id,
                    ...(isTeamScoped ? { consumeScope: 'team' } : {}),
                    ...(removeCondition ? { condition: removeCondition } : {}),
                }

            ;['onStatusExpire', 'onStatusConsumed'].forEach((kind) => {
                out.push({
                    triggerEffect: {
                        trigger: {
                            kind,
                            status: cond.status,
                            scope,
                            ...(isTeamScoped ? { triggerScope: 'global' } : {}),
                        },
                        effects: [removeEffect],
                    },
                    sourceSlotIndex: ce.sourceSlotIndex,
                    sourceOperatorSlug: ce.sourceOperatorSlug,
                    sourceTrackId,
                })
            })
        })

        return out
    }

    // Build operator-side passive effects + enemy/reactive triggers for the selected Contingency
    // Contract criteria. The criterion group + level index is derived from each tag id:
    // group = Math.floor(id/100), levelIdx = (id % 100) - 1 (scalar-valued criteria are idx-invariant).
    function buildContingencyCriteriaInjection() {
        const effects = []
        const triggers = []
        const firstTrackId = tracks.value[0]?.id || null
        const seenGroups = new Set()
        for (const rawId of contingencyContractTags.value || []) {
            const tagId = Number(rawId)
            if (!Number.isFinite(tagId)) continue
            const group = Math.floor(tagId / 100)
            const mech = CRITERION_MECHANISMS[group]
            if (!mech || seenGroups.has(group)) continue
            seenGroups.add(group)
            const idx = Math.max(0, Math.min((tagId % 100) - 1, (mech.levelCount || 1) - 1))
            const slug = `cc:${group}`
            ;(mech.effects || []).forEach((eff, ei) => {
                const resolved = resolveEffect(eff, idx)
                if (!resolved.id) resolved.id = `${slug}:e${ei}`
                effects.push({
                    effect: resolved,
                    sourceSlotIndex: 0,
                    sourceOperatorSlug: `${slug}:e${ei}`,
                })
            })
            // Level-invariant triggers plus the structure for the selected level.
            const levelTriggers = [
                ...(mech.triggers || []),
                ...(mech.triggersByLevel?.[idx] || []),
            ]
            levelTriggers.forEach((te, ti) => {
                const resolved = resolveTriggerEffectLevel(te, idx)
                resolved.effects = (resolved.effects || []).map((effect, j) =>
                    effect.id ? effect : { ...effect, id: `${slug}:t${ti}:e${j}` },
                )
                triggers.push({
                    triggerEffect: resolved,
                    sourceSlotIndex: 0,
                    sourceOperatorSlug: `${slug}:t${ti}`,
                    sourceSkillType: undefined,
                    sourceTrackId: firstTrackId,
                })
            })
        }
        return { effects, triggers }
    }

    function recomputeAllTrackOperatorStatuses() {
        tracks.value.forEach(track => hydrateTrackInstances(track))
        const armoryContext = buildTimelineArmoryContext()
        const { team, operatorInstances, weaponInstances, gearInstances } = armoryContext

        tracks.value.forEach((track) => {
            if (!track?.operatorInstanceId || !track?.id || !armoryContext.trackMetaById.has(track.id)) {
                applyOperatorStatusProjection(track, null)
            }
        })

        const computeFallbackStatus = (track) => {
            const opInst = track?.operatorInstanceId ? findOperatorInstance(track.operatorInstanceId) : null
            if (!opInst) return null
            const wpInst = track.weaponInstanceId ? findWeaponInstance(track.weaponInstanceId) : null
            const base = getBaseStatValues(toRaw(opInst), wpInst ? toRaw(wpInst) : undefined)
            track.baseStats = cloneJsonData(base)
            return computeStats(base, [], [])
        }

        try {
            const conditions = createDefaultTeamConditions()

            const collected = collectEffects(team, operatorInstances, weaponInstances, gearInstances)
            for (const ce of collected) {
                const cond = ce?.effect?.condition
                if (!cond || Array.isArray(cond)) continue
                if (cond.kind === 'operatorStatus') {
                    conditions.operatorStatusState.stateToggles[`${ce.sourceSlotIndex}::${statusToKey(cond.status)}`] = true
                }
            }

            const cc = buildContingencyCriteriaInjection()

            const result = getTeamStatus(
                team, operatorInstances, weaponInstances, gearInstances, conditions,
                undefined, undefined, undefined, cc.effects,
            )
            const effectById = buildEffectById(collected)
            const collectedTriggers = collectTriggerEffects(team, operatorInstances, weaponInstances, gearInstances, effectById)
            const conditionalPassiveTriggers = buildConditionalPassiveTriggerEffectsFromCollected(collected, armoryContext)
            const serializedTriggers = cloneJsonData([...collectedTriggers, ...conditionalPassiveTriggers]).map((cte) => ({
                ...cte,
                sourceTrackId: cte?.sourceTrackId || tracks.value[cte?.sourceSlotIndex]?.id || cte?.sourceOperatorSlug || null,
            }))
            // CC triggers already carry a resolved sourceTrackId; append after the cloned operator triggers.
            // Use structuredClone (not cloneJsonData) to preserve `duration: Infinity`, the engine's
            // sentinel for permanent statuses — JSON.stringify turns Infinity into null, which collapses
            // to a 0 duration and silently drops the status (breaks Bent Edges, Wrap).
            const allTriggers = [...serializedTriggers, ...structuredClone(cc.triggers)]
            runtimeInitialEffects.value = buildInitialRuntimeEffectsFromCollected(
                [...collected, ...cc.effects], armoryContext,
            )
            tracks.value.forEach((track, index) => {
                const fallbackStatus = computeFallbackStatus(track)
                track.enemyStatus = cloneJsonData(result.enemyStatus)
                track.triggerEffects = allTriggers || []
                applyOperatorStatusProjection(track, result.operatorStatuses?.[index] || fallbackStatus)
                refreshTrackActionPayloads(track)
            })
        } catch (error) {
            console.error('Failed to recompute operator statuses, falling back to base stats.', error)
            runtimeInitialEffects.value = []
            tracks.value.forEach(track => {
                track.enemyStatus = null
                track.triggerEffects = []
                applyOperatorStatusProjection(track, computeFallbackStatus(track))
                refreshTrackActionPayloads(track)
            })
        }
    }

    function getTrackPatchedSkills(track) {
        if (!track?.id || !track?.operatorInstanceId) return null
        const operator = getOperatorSheet(track.id)
        const operatorInstance = findOperatorInstance(track.operatorInstanceId)
        if (!operator || !operatorInstance) return null
        return {
            operatorInstance,
            flatSkills: patchCombatSkills(operator, operatorInstance),
        }
    }

    function getActionSourceSkillKey(action) {
        if (!action) return null
        return action.sourceSkillKey || action.skillId || action.type || null
    }

    function getActionSegmentIndex(action) {
        const raw = action?.segmentIndex ?? action?.attackSegmentIndex ?? action?.comboSegmentIndex ?? action?.attackSequenceIndex
        const index = Number(raw) || 0
        return index > 0 ? index - 1 : null
    }

    function resolveActionRefreshPayload(skillIdBase, flatSkill, action, levelIndex) {
        const segmentIndex = getActionSegmentIndex(action)
        if (segmentIndex !== null) {
            const segment = flatSkill?.segments?.[segmentIndex]
            const segmentEntries = segment
                ? extractRawEntries({ segments: [segment] }, 0)
                : []
            return {
                rawEntries: segmentEntries,
                duration: Number(segment?.duration) || 0,
                element: segment?.damageGroups?.find((group) => group?.element)?.element || action.element,
            }
        }

        const aggregateRawEntries = extractAggregateRawEntries(flatSkill)
        const segmentPayload = buildResolvedSegmentPayload(skillIdBase, flatSkill, levelIndex)
        return {
            rawEntries: aggregateRawEntries,
            duration: Math.max(0, Number(segmentPayload.totalDuration) || Number(flatSkill?.segments?.[0]?.duration) || 0),
            element: segmentPayload.element || action.element,
        }
    }

    function refreshTrackActionPayloads(track) {
        const patched = getTrackPatchedSkills(track)
        if (!patched) return

        const { operatorInstance, flatSkills } = patched
        const skillLevels = operatorInstance?.skillLevels || {}

        track.actions.forEach((action) => {
            const sourceSkillKey = getActionSourceSkillKey(action)
            const flatSkill = sourceSkillKey ? flatSkills?.[sourceSkillKey] : null
            if (!flatSkill) return

            const rawLevel = Number(skillLevels?.[flatSkill.levelKey] ?? 1)
            const levelIndex = Math.max(0, Math.min((Number.isFinite(rawLevel) ? rawLevel : 1) - 1, 11))
            const refreshPayload = resolveActionRefreshPayload(sourceSkillKey, flatSkill, action, levelIndex)
            if (!refreshPayload?.rawEntries?.length) {
                action.hits = []
                return
            }

            action.hits = resolveHitsFromSheet(
                Array.isArray(action.hits) ? action.hits : [],
                refreshPayload.rawEntries,
                levelIndex,
                { preserveCondition: true },
            )

            if (Number.isFinite(refreshPayload.duration) && refreshPayload.duration > 0) {
                action.duration = refreshPayload.duration
            }
            if (refreshPayload.element) {
                action.element = refreshPayload.element
            }

            if (flatSkill.cooldown != null && !action.comboSegmentIndex && !action.attackSegmentIndex) {
                action.cooldown = resolveLevelNumber(flatSkill.cooldown, levelIndex, action.cooldown || 0)
            }
            if (flatSkill.type === 'ultimate') {
                action.animationTime = Number(flatSkill.animationTime) || 0
                action.enhancementTime = Number(flatSkill.enhancementTime) || 0
            }
        })
    }

    const getCharacterElementColor = (characterId) => {
        const charInfo = characterRoster.value.find(c => c.id === characterId)
        if (!charInfo || !charInfo.element) return ELEMENT_COLORS.default
        return getColor(charInfo.element)
    }

    const getWeaponById = (weaponId) => {
        if (!weaponId) return null
        const resolvedId = resolveWeaponSlug(weaponId) || weaponId
        return weaponDatabase.value.find(w => w.id === weaponId || w.id === resolvedId || w.canonicalSlug === weaponId || w.canonicalSlug === resolvedId) || null
    }

    const getModifierLabel = (modifierId) => {
        const found = (misc.value?.modifierDefs || []).find(d => d.id === modifierId)
        if (found?.label) return found.label
        const translated = tr(`stats.${modifierId}`)
        if (translated !== `stats.${modifierId}`) return translated
        return modifierId || ''
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
            base.canonicalGearPieceId = resolveGearPieceSlug(base.id) || null
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
            accessory: normalizeOne(safe.accessory ?? safe.kit, fb.accessory ?? fb.kit),
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

    const buildOptimizerCharacterRoster = () => {
        const optimizerCharacters = getTimelineOperatorList().map((entry) => {
            const slug = resolveOperatorSlug(entry?.slug) || entry?.slug
            const operator = getOperatorSheet(slug) || {}
            const ultimateSkill = operator?.combatSkills?.ultimate || {}
            const maxUltimateGauge = Number(ultimateSkill?.ultimateEnergyCost) || 100
            const acceptTeamGauge = operator?.acceptTeamUltEnergy !== false

            return {
                id: slug,
                slug,
                name: translateOperatorDisplayName(slug),
                avatar: operator?.avatar || `/operators/${slug}/avatar.webp`,
                rarity: Number(entry?.rarity) || Number(operator?.rarity) || 0,
                weapon: operator?.weapon || '',
                element: operator?.element || 'physical',
                class: operator?.class || '',
                exclusive_buffs: cloneJsonData(operator?.exclusiveBuffs) || [],
                maxUltimateGauge,
                ultimate_gaugeMax: maxUltimateGauge,
                acceptTeamGauge,
                accept_team_gauge: acceptTeamGauge,
                acceptSelfSpCostUltEnergy: operator?.acceptSelfSpCostUltEnergy !== false,
                accept_self_sp_cost_ult_energy: operator?.acceptSelfSpCostUltEnergy !== false,
                beta: !!entry?.beta,
                new: !!entry?.new,
            }
        })

        optimizerCharacters.sort((a, b) => (b.rarity || 0) - (a.rarity || 0))
        return optimizerCharacters
    }

    const buildOptimizerWeaponDatabase = () => {
        return getTimelineWeaponList().map((entry) => {
            const weapon = getWeaponSheet(entry.slug) || {}
            return {
                id: entry.slug,
                canonicalSlug: entry.slug,
                name: getWeaponGameName(entry.slug),
                buffName: getWeaponSkillPrefix(entry.slug, 'skill3') || getWeaponSkillName(entry.slug, 'skill3', undefined, getWeaponGameName(entry.slug)),
                rarity: Number(entry.rarity) || Number(weapon.rarity) || 0,
                type: entry.type || weapon.type || '',
                icon: weapon.icon || '',
                baseAtk: cloneJsonData(weapon.baseAtk) || [],
                commonSlots: normalizeWeaponCommonSlots(weapon.commonSlots),
                buffBonuses: normalizeWeaponBuffBonuses(weapon.buffBonuses),
            }
        })
    }

    const buildOptimizerEquipmentDatabase = () => {
        const list = getTimelineGearPieceList().map((entry) => {
            const piece = getGearPiece(entry.slug) || {}
            return {
                id: entry.slug,
                canonicalGearPieceId: entry.slug,
                name: getGearPieceGameName(entry.slug),
                slot: (entry.slotType || piece.slotType || '') === 'kit' ? 'accessory' : (entry.slotType || piece.slotType || ''),
                icon: piece.icon || '',
                category: entry.setSlug || piece.setSlug || '',
                categoryName: getGearSetGameName(entry.setSlug || piece.setSlug || ''),
                level: Number(entry.levelRequirement) || Number(piece.levelRequirement) || 0,
            }
        })
        return normalizeEquipmentDatabase(list)
    }

    const buildOptimizerMisc = () => {
        const systemData = getTimelineSystemConstants() || {}
        const eqCfg = normalizeEquipmentMiscConfig(systemData)
        return {
            modifierDefs: normalizeModifierDefs(systemData?.modifierDefs),
            weaponCommonModifiers: normalizeWeaponCommonModifiersTable(systemData?.weaponCommonModifiers),
            equipmentTemplates: eqCfg.equipmentTemplates,
            equipmentAdapterTable: eqCfg.equipmentAdapterTable,
            domainConfig: eqCfg.domainConfig,
        }
    }

    const buildOptimizerEnemyDatabase = () => {
        return getTimelineEnemyList().map((enemy) => ({
            ...cloneJsonData(enemy),
            name: getEnemyGameName(enemy.id),
            executionRecovery: Number(enemy.executionRecovery) || Number(enemy.finisherRecovery) || 25,
            resistance: normalizeEnemyResistance(enemy.resistance),
        }))
    }

    const initializeOptimizerGameData = () => {
        iconDatabase.value = cloneJsonData(getTimelineIconDatabase()) || {}
        characterRoster.value = buildOptimizerCharacterRoster()
        weaponDatabase.value = buildOptimizerWeaponDatabase()
        equipmentDatabase.value = buildOptimizerEquipmentDatabase()
        equipmentCategories.value = [...new Set(equipmentDatabase.value.map(item => item?.category).filter(Boolean))]
        equipmentCategoryConfigs.value = cloneJsonData(getTimelineEquipmentCategoryConfigs()) || {}
        misc.value = buildOptimizerMisc()
        enemyDatabase.value = buildOptimizerEnemyDatabase()
        enemyCategories.value = [...new Set(enemyDatabase.value.map(enemy => enemy?.category).filter(Boolean))]
    }

    const computeWeaponDeltasForTrack = (track) => {
        return {}
    }

    const applyWeaponDeltasToTrack = (track, newDeltas) => {
        if (!track) return
        track.weaponAppliedDeltas = { ...(newDeltas || {}) }
    }

    function syncTrackWeaponModifiers(trackId) {
        if (!trackId) return
        const track = tracks.value.find(t => t.id === trackId)
        if (!track) return
        if (!track.weaponId) {
            track.weaponInstanceId = null
            projectTrackWeaponFromInstance(track, null)
            track.weaponAppliedDeltas = {}
            recomputeAllTrackOperatorStatuses()
            return
        }

        const existing = track.weaponInstanceId ? findWeaponInstance(track.weaponInstanceId) : null
        if (existing && (resolveWeaponSlug(existing.weaponSlug) || existing.weaponSlug) === track.weaponId) {
            projectTrackWeaponFromInstance(track, existing)
        } else {
            replaceTrackWeaponInstance(track)
        }

        track.weaponAppliedDeltas = {}
        recomputeAllTrackOperatorStatuses()
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
        const resolvedId = resolveGearPieceSlug(equipmentId) || equipmentId
        return equipmentDatabase.value.find(e => e.id === equipmentId || e.id === resolvedId || e.canonicalGearPieceId === equipmentId || e.canonicalGearPieceId === resolvedId) || null
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
        return {}
    }

    const applyEquipmentDeltasToTrack = (track, newDeltas) => {
        if (!track) return
        track.equipmentAppliedDeltas = { ...(newDeltas || {}) }
    }

    function syncTrackEquipmentModifiers(trackId) {
        if (!trackId) return
        const track = tracks.value.find(t => t.id === trackId)
        if (!track) return
        for (const slotConfig of TRACK_GEAR_SLOTS) {
            const gearPieceId = track[slotConfig.idKey]
            const piece = gearPieceId ? getGearPiece(gearPieceId) : null
            if (!gearPieceId) {
                track[slotConfig.instanceKey] = null
                projectTrackGearSlotFromInstance(track, slotConfig, null)
                continue
            }

            const existing = track[slotConfig.instanceKey]
                ? findGearInstance(track[slotConfig.instanceKey])
                : null
            if (existing && existing.gearPieceId === gearPieceId) {
                projectTrackGearSlotFromInstance(track, slotConfig, existing)
            } else {
                replaceTrackGearInstance(track, slotConfig)
            }
        }
        track.equipmentAppliedDeltas = {}
        recomputeAllTrackOperatorStatuses()
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
        return equipmentCategoryConfigs.value?.[category]
            || equipmentCategoryConfigs.value?.[getGearSetZhName(category)]
            || null
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

    const getSetBonusDisplayName = (category) => {
        if (!category) return ''
        return getGearSetGameName(category)
    }

    const getSetBonusDescription = (category) => {
        if (!category) return ''
        const parts = [
            getGearSetPassiveText(category),
            getGearSetConditionalText(category),
        ].filter(Boolean)
        return parts.join('\n')
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
        i18n.global.locale.value
        const charInfo = characterRoster.value.find(c => c.id === track.id)
        if (!charInfo) return { ...track, name: tr('timelineGrid.track.selectOperator'), avatar: '', rarity: 0 }
        return {
            ...track,
            ...charInfo,
            name: getOperatorGameName(charInfo.id || charInfo.slug || track.id),
        }
    }))

    // ─── Controlled operator ─────────────────────────────────────────────────
    // The initial controlled operator is the first track's operator; each switch event changes
    // control from its time onward. Derived from existing state — nothing extra is persisted.
    const controlledOperatorSegments = computed(() =>
        buildControlledOperatorSegments(tracks.value[0]?.id ?? null, switchEvents.value)
    )

    /** Returns the controlled operator (track id) at the given time, or null if none. */
    function getControlledOperatorAt(time) {
        return resolveControlledOperatorAt(tracks.value[0]?.id ?? null, switchEvents.value, time)
    }

    const activeWeapon = computed(() => {
        const track = activeTrackIndex.value !== null
            ? tracks.value[activeTrackIndex.value] || null
            : tracks.value.find(t => t.id === activeTrackId.value)
        if (!track || !track.weaponId) return null
        return getWeaponById(track.weaponId) || null
    })

    const formatTimeLabel = (time) => {
        if (time === undefined || time === null) return '';
        return formatTimeWithFrames(time);
    };

    const activeSkillLibrary = computed(() => {
        i18n.global.locale.value
        const activeTrack = activeTrackIndex.value !== null
            ? tracks.value[activeTrackIndex.value] || null
            : null
        const activeChar = activeTrack?.id
            ? characterRoster.value.find(c => c.id === activeTrack.id)
            : characterRoster.value.find(c => c.id === activeTrackId.value)
        if (!activeChar) return []
        const operator = getOperatorSheet(activeChar.id)
        if (!operator?.combatSkills) return []

        const activeOpInstance = activeTrack?.operatorInstanceId
            ? findOperatorInstance(activeTrack.operatorInstanceId)
            : null
        const displayInstance = activeOpInstance || createMaxOperatorInstanceData(activeChar.id)
        const flatSkills = patchCombatSkills(operator, displayInstance)
        const TYPE_ORDER = {
            'basicAttack': 1,
            'dive': 2,
            'finisher': 3,
            'battleSkill': 4,
            'comboSkill': 5,
            'ultimate': 6
        }

        const getLevelIndex = (skill) => {
            const rawLevel = Number(displayInstance?.skillLevels?.[skill?.levelKey] ?? 1)
            return Math.max(0, Math.min((Number.isFinite(rawLevel) ? rawLevel : 1) - 1, 11))
        }

        const buildSegmentModels = (skillIdBase, skill, levelIndex) => {
            const resolved = buildResolvedSegmentPayload(skillIdBase, skill, levelIndex)
            return {
                ...resolved,
                element: resolved.element || activeChar.element || 'physical',
                segmentPayloads: (resolved.segmentPayloads || []).map((segment) => ({
                    ...segment,
                    element: segment.element || activeChar.element || 'physical',
                })),
            }
        }

        const buildBaseAction = ({
            id,
            type,
            name,
            skillId,
            element,
            icon,
            duration,
            cooldown = 0,
            spCost = 0,
            gaugeCost = 0,
            gaugeGain = 0,
            teamGaugeGain = 0,
            enhancementTime = 0,
            animationTime = 0,
            payload,
            override = {},
            extra = {},
            sourceSkillKey = skillId,
        }) => {
            const safePayload = payload || { hits: [] }
            return {
                id,
                type,
                skillId,
                name,
                librarySource: 'character',
                element: element || activeChar.element || 'physical',
                icon: icon || '',
                duration,
                cooldown,
                spCost,
                gaugeCost,
                gaugeGain,
                teamGaugeGain,
                enhancementTime,
                animationTime,
                hits: cloneJsonData(safePayload.hits) || [],
                sourceSkillKey,
                ...(override && typeof override === 'object' ? override : {}),
                ...(extra && typeof extra === 'object' ? extra : {}),
            }
        }

        const buildSkillDisplayName = (skill, isStandard) => {
            if (isStandard) {
                return getI18nSkillType(skill.type || 'unknown')
            }
            if (!isStandard && skill?.skillKey) {
                return getOperatorSubSkillName(activeChar.id, skill.skillKey, undefined, skill?.name)
            }
            const fallback = skill?.name || skill?.skillKey || ''
            return humanizeIdentifier(fallback) || getI18nSkillType(skill.type || 'unknown')
        }

        const buildStandardOrVariantSkill = (skill, { isStandard = false } = {}) => {
            if (!skill?.type) return null

            const skillIdBase = isStandard
                ? `${activeChar.id}_${skill.type}`
                : `${activeChar.id}_variant_${skill.skillKey}`
            const levelIndex = getLevelIndex(skill)
            const displayName = buildSkillDisplayName(skill, isStandard)
            const icon = getOperatorSkillIcon(activeChar.id, skill.type, skill)
            const actionType = skill.type
            const skillId = isStandard ? (skill.skillKey || skill.type) : (skill.skillKey || skill.type)
            const cooldown = resolveLevelNumber(skill?.cooldown, levelIndex, 0)
            const segmentData = buildSegmentModels(skillIdBase, skill, levelIndex)
            const gaugeGainDefault = skill.type === 'battleSkill'
                ? Number(skill?.ultimateEnergyGain ?? DEFAULT_BATTLE_SKILL_UE) || 0
                : (skill.type === 'comboSkill'
                    ? Number(skill?.ultimateEnergyGain ?? DEFAULT_COMBO_SKILL_UE) || 0
                    : Number(skill?.ultimateEnergyGain) || 0)
            const baseDefaults = {
                spCost: skill.type === 'battleSkill' ? systemConstants.value.skillSpCostDefault : 0,
                gaugeCost: skill.type === 'ultimate' ? (Number(skill?.ultimateEnergyCost) || 100) : 0,
                gaugeGain: gaugeGainDefault,
                teamGaugeGain: skill.type === 'battleSkill' ? gaugeGainDefault : 0,
                enhancementTime: Number(skill?.enhancementTime) || 0,
                animationTime: skill.type === 'ultimate'
                    ? (Number(skill?.animationTime) || 0.5)
                    : (Number(skill?.animationTime) || 0),
            }
            const globalOverride = characterOverrides.value[skillIdBase] || {}

            if (skill.type === 'basicAttack') {
                const groupOverrideRaw = characterOverrides.value[skillIdBase] || {}
                const { duration: _ignoredDuration, ...groupOverride } = (groupOverrideRaw && typeof groupOverrideRaw === 'object') ? groupOverrideRaw : {}
                const attackGroupName = displayName

                const segmentSkills = segmentData.segmentPayloads.map((segmentInfo, idx) => {
                    const segOverride = characterOverrides.value[segmentInfo.id] || {}
                    const mergedOverride = { ...groupOverride, ...(segOverride && typeof segOverride === 'object' ? segOverride : {}) }
                    return buildBaseAction({
                        id: segmentInfo.id,
                        type: 'basicAttack',
                        skillId,
                        name: `${attackGroupName} ${idx + 1}`,
                        element: segmentInfo.element,
                        icon,
                        duration: segmentInfo.duration,
                        payload: segmentInfo.payload,
                        override: mergedOverride,
                        extra: {
                            kind: 'attack_segment',
                            attackSegmentIndex: idx + 1,
                            segmentIndex: idx + 1,
                            hiddenInLibraryGrid: true,
                        },
                    })
                })

                const enabledSegments = segmentSkills
                    .filter(segment => (Number(segment.duration) || 0) > 0)
                    .map((segment, idx, list) => ({
                        ...segment,
                        attackSequenceIndex: idx + 1,
                        attackSequenceTotal: list.length,
                        attackGroupName,
                    }))

                return buildBaseAction({
                    id: skillIdBase,
                    type: 'basicAttack',
                    skillId,
                    name: attackGroupName,
                    element: segmentData.element,
                    icon,
                    duration: enabledSegments.reduce((sum, segment) => sum + (Number(segment.duration) || 0), 0),
                    payload: segmentData.aggregatePayload,
                    override: groupOverrideRaw,
                    extra: {
                        kind: 'attack_group',
                        attackSegments: enabledSegments,
                    },
                })
            }

            const multiSegmentTypes = new Set(['battleSkill', 'comboSkill', 'ultimate'])
            if (multiSegmentTypes.has(skill.type) && segmentData.segmentPayloads.length >= 2) {
                const segments = segmentData.segmentPayloads.map((segmentInfo, idx, list) => {
                    const segOverride = characterOverrides.value[segmentInfo.id] || {}
                    const segmentSkillId = segmentInfo.skillId || skillId
                    const segmentSpCost = skill.type === 'battleSkill'
                        ? (segmentInfo.spCost ?? baseDefaults.spCost)
                        : (idx === 0 ? baseDefaults.spCost : 0)
                    const segmentGaugeGain = skill.type === 'battleSkill'
                        ? (Number(segmentInfo.ultimateEnergyGain ?? DEFAULT_BATTLE_SKILL_UE) || 0)
                        : (skill.type === 'comboSkill'
                            ? baseDefaults.gaugeGain
                            : (idx === list.length - 1 ? baseDefaults.gaugeGain : 0))
                    return buildBaseAction({
                        id: segmentInfo.id,
                        type: actionType,
                        skillId: segmentSkillId,
                        name: `${displayName} ${idx + 1}`,
                        element: segmentInfo.element,
                        icon,
                        duration: segmentInfo.duration,
                        cooldown: skill.type === 'comboSkill' ? cooldown : 0,
                        spCost: segmentSpCost,
                        gaugeCost: idx === 0 ? baseDefaults.gaugeCost : 0,
                        gaugeGain: segmentGaugeGain,
                        teamGaugeGain: skill.type === 'battleSkill' ? segmentGaugeGain : (idx === list.length - 1 ? baseDefaults.teamGaugeGain : 0),
                        enhancementTime: idx === 0 ? baseDefaults.enhancementTime : 0,
                        animationTime: idx === 0 ? baseDefaults.animationTime : 0,
                        payload: segmentInfo.payload,
                        override: segOverride,
                        sourceSkillKey: skillId,
                        extra: {
                            kind: 'segment',
                            segmentIndex: idx + 1,
                            followupDelay: segmentInfo.followupDelay,
                            hiddenInLibraryGrid: true,
                        },
                    })
                })

                return buildBaseAction({
                    id: skillIdBase,
                    type: actionType,
                    skillId,
                    name: displayName,
                    element: segmentData.element,
                    icon,
                    duration: segmentData.totalDuration || 1,
                    cooldown,
                    spCost: baseDefaults.spCost,
                    gaugeCost: baseDefaults.gaugeCost,
                    gaugeGain: baseDefaults.gaugeGain,
                    teamGaugeGain: baseDefaults.teamGaugeGain,
                    enhancementTime: baseDefaults.enhancementTime,
                    animationTime: baseDefaults.animationTime,
                    payload: segmentData.aggregatePayload,
                    override: globalOverride,
                    extra: {
                        kind: 'group',
                        segments,
                        segmentsAll: segments,
                    },
                    sourceSkillKey: skillId,
                })
            }

            return buildBaseAction({
                id: skillIdBase,
                type: actionType,
                skillId,
                name: displayName,
                element: segmentData.element,
                icon,
                duration: Math.max(0, segmentData.totalDuration || Number(skill?.segments?.[0]?.duration) || 1),
                cooldown,
                spCost: baseDefaults.spCost,
                gaugeCost: baseDefaults.gaugeCost,
                gaugeGain: baseDefaults.gaugeGain,
                teamGaugeGain: baseDefaults.teamGaugeGain,
                enhancementTime: baseDefaults.enhancementTime,
                animationTime: baseDefaults.animationTime,
                payload: segmentData.aggregatePayload,
                override: globalOverride,
            })
        }

        const standardSkillOrder = ['basicAttack', 'dive', 'finisher', 'battleSkill', 'comboSkill', 'ultimate']
        const standardSkills = standardSkillOrder
            .map((skillKey) => buildStandardOrVariantSkill(flatSkills[skillKey], { isStandard: true }))
            .filter(Boolean)

        const variantSkills = Object.values(flatSkills)
            .filter((skill) => !standardSkillOrder.includes(skill?.skillKey))
            .map((skill) => buildStandardOrVariantSkill(skill, { isStandard: false }))
            .filter(Boolean)

        return [...standardSkills, ...variantSkills].sort((a, b) => {
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


    function applyEnemyPreset(enemyId) {
        if (enemyId === activeEnemyId.value) return

        activeEnemyId.value = enemyId

        if (enemyId === 'custom') {
            // Restore custom parameters when switching back to the custom enemy.
            Object.assign(systemConstants.value, {
                ...customEnemyParams.value,
                resistance: normalizeEnemyResistance(customEnemyParams.value.resistance),
            })
        } else {
            // Apply the selected preset enemy.
            const enemy = enemyDatabase.value.find(e => e.id === enemyId)
            if (enemy) {
                const enemySheet = getEnemy(enemyId)
                systemConstants.value.maxStagger = enemy.maxStagger
                systemConstants.value.staggerNodeCount = enemy.staggerNodeCount
                systemConstants.value.staggerNodeDuration = enemy.staggerNodeDuration
                systemConstants.value.staggerBreakDuration = enemy.staggerBreakDuration
                systemConstants.value.executionRecovery = enemy.executionRecovery
                systemConstants.value.enemyHp = getEnemyHpForLevel(enemy, enemySheet, activeEnemyLevel.value)
                systemConstants.value.resistance = normalizeEnemyResistance(enemy.resistance ?? enemySheet?.resistance)
                systemConstants.value.superArmor = Number(enemy.superArmor ?? enemySheet?.superArmor) || 0
            }
        }

        inheritedInitialEnemyState.value = resetEnemyStaggerCarryover(
            inheritedInitialEnemyState.value,
            systemConstants.value,
        )
    }

    function setActiveEnemyLevel(level) {
        activeEnemyLevel.value = normalizeEnemyLevel(level)
        if (activeEnemyId.value === 'custom') return

        const enemy = enemyDatabase.value.find(e => e.id === activeEnemyId.value)
        const enemySheet = getEnemy(activeEnemyId.value)
        const nextHp = getEnemyHpForLevel(enemy, enemySheet, activeEnemyLevel.value)
        if (nextHp > 0) {
            systemConstants.value.enemyHp = nextHp
        }
    }

    // ===================================================================================
    // Entity CRUD operations
    // ===================================================================================

    function setTimelineShift(val) {
        const width = totalTimelineWidthPx.value
        const maxShift = Math.max(0, width - timelineRect.value.width)
        timelineShift.value = Math.min(Math.max(0, val), maxShift)
    }
    function setScrollTop(val) { timelineScrollTop.value = val }
    function resetTimelineViewport() {
        setTimelineShift(0)
        setScrollTop(0)
    }
    function setTimelineRect(width, height, top, right, bottom, left) { timelineRect.value = { width, height, top, left, right, bottom } }
    function setTrackLaneRect(trackId, rect) { trackLaneRects.value[trackId] = rect }
    function setNodeRect(nodeId, rect) { nodeRects.value[nodeId] = rect }
    function setCursorPosition(x, y) { cursorPosition.value = { x, y } }
    function toggleCursorGuide() { showCursorGuide.value = !showCursorGuide.value }
    function toggleOperatorEffectsVisible(index) {
        const normalized = normalizeOperatorEffectsVisible(operatorEffectsVisible.value)
        if (index < 0 || index >= normalized.length) return
        normalized[index] = !normalized[index]
        operatorEffectsVisible.value = normalized
        persistOperatorEffectsVisible()
    }
    function toggleBoxSelectMode() { if (!isBoxSelectMode.value) connectionDragState.value.isDragging = false; isBoxSelectMode.value = !isBoxSelectMode.value }
    function toggleSnapStep() {
        if (snapStep.value > FRAME_DURATION) {
            snapStep.value = FRAME_DURATION;
        } else {
            snapStep.value = COARSE_SNAP_STEP;
        }
    }

    function setDraggingSkill(skill) { draggingSkillData.value = skill }

    function selectTrack(trackRef) {
        if (trackRef === null || trackRef === undefined) {
            activeTrackIndex.value = null
            activeTrackId.value = null
            clearSelection()
            return
        }

        if (typeof trackRef === 'number') {
            const index = trackRef >= 0 && trackRef < tracks.value.length ? trackRef : null
            activeTrackIndex.value = index
            activeTrackId.value = index !== null ? (tracks.value[index]?.id ?? null) : null
            clearSelection()
            return
        }

        const index = tracks.value.findIndex(t => t.id === trackRef)
        activeTrackIndex.value = index >= 0 ? index : null
        activeTrackId.value = index >= 0 ? trackRef : null
        clearSelection()
    }

    function selectLibrarySkill(skillId) {
        const isSame = selectedLibrarySkillId.value === skillId
        if (skillId) {
            clearSelection()
            if (!isSame) selectedLibrarySkillId.value = skillId
        } else {
            selectedLibrarySkillId.value = null
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

        const hit = action?.hits?.[rowIndex]
        if (hit && Array.isArray(hit.effects)) {
            const effect = hit.effects[colIndex]
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
    }

    function clearSelection() {
        selectedActionId.value = null
        selectedConnectionId.value = null
        selectedAnomalyId.value = null
        selectedCycleBoundaryId.value = null
        selectedSwitchEventId.value = null
        multiSelectedIds.value.clear()
        selectedLibrarySkillId.value = null
    }

    function normalizeComboLinksInTracks() {
        const byGroup = new Map()
        tracks.value.forEach(track => {
            (track.actions || []).forEach(action => {
                const gid = action?.comboGroupId
                if (!gid) return
                if (!byGroup.has(gid)) byGroup.set(gid, [])
                byGroup.get(gid).push({ action, track })
            })
        })

        for (const [, list] of byGroup.entries()) {
            const actions = list.map(x => x.action).filter(Boolean)
            const segIndices = actions.map(a => Number(a.comboSegmentIndex) || 0)
            const totals = actions.map(a => Number(a.comboSegmentTotal) || 0).filter(Boolean)

            const maxIndex = Math.max(0, ...segIndices)
            const total = Math.max(maxIndex, ...totals, 0)
            if (total < 2) continue

            const used = new Set()
            let valid = true
            actions.forEach(a => {
                const idx = Number(a.comboSegmentIndex) || 0
                if (idx <= 0 || idx > total) valid = false
                if (used.has(idx)) valid = false
                used.add(idx)
            })
            for (let i = 1; i <= total; i++) {
                if (!used.has(i)) valid = false
            }

            const sorted = actions.slice().sort((a, b) => (Number(a.comboSegmentIndex) || 0) - (Number(b.comboSegmentIndex) || 0))

            if (!valid) {
                const clearCombo = (a) => {
                    delete a.comboGroupId
                    delete a.comboSegmentIndex
                    delete a.comboSegmentTotal
                    delete a.comboLinked
                    delete a.comboFollowupDelay
                    delete a.comboParentSkillId
                    delete a.comboPrevId
                    delete a.comboNextId
                }
                sorted.forEach(a => {
                    clearCombo(a)
                })
                continue
            }

            const linked = sorted.every(a => a.comboLinked !== false)
            sorted.forEach(a => { a.comboLinked = linked })

            sorted.forEach((a, i) => {
                a.comboSegmentTotal = total
                a.comboPrevId = i > 0 ? sorted[i - 1].instanceId : null
                a.comboNextId = i < total - 1 ? sorted[i + 1].instanceId : null
            })

            if (linked) {
                for (let i = 0; i < total; i++) {
                    const a = sorted[i]
                    if (i === total - 1) {
                        a.comboFollowupDelay = 0
                        continue
                    }
                    const raw = Number(a.comboFollowupDelay)
                    a.comboFollowupDelay = Number.isFinite(raw) ? snapTimeToFrame(Math.max(0, raw)) : 0
                }
            }
        }
    }

    function getMinSkillStartTime() {
        if (prepExpanded.value) return 0
        return snapTimeToFrame(Math.max(0, Number(prepDuration.value) || 0))
    }

    function clampSkillStartTime(time) {
        const raw = Number(time) || 0
        return Math.max(getMinSkillStartTime(), snapTimeToFrame(raw))
    }

    function addSkillToTrack(trackId, skill, startTime) {
        const track = tracks.value.find(t => t.id === trackId); if (!track) return

        const actionStartTime = clampSkillStartTime(startTime)
        const cloneEffectsForAction = (skillForClone) => {
            return cloneActionHits(skillForClone.hits)
        }

        const createActionFromSkill = (skillForCreate, actionStartTime) => {
            return {
                ...skillForCreate,
                instanceId: `inst_${uid()}`,
                librarySource: skillForCreate.librarySource || 'character',
                sourceWeaponId: skillForCreate.weaponId || track.weaponId || null,
                hits: cloneEffectsForAction(skillForCreate),
                logicalStartTime: actionStartTime,
                startTime: actionStartTime
            }
        }

        if (Array.isArray(skill?.segments) && skill.segments.length >= 2) {
            const rawSegments = skill.segments.filter(Boolean)
            if (rawSegments.length < 2) return

            const mergeSeg = (seg) => {
                const merged = { ...skill, ...(seg || {}) }
                delete merged.segments
                delete merged.followupDelay
                return merged
            }

            const segmentSkills = rawSegments.map(mergeSeg)

            const getDelayAfter = (rawSeg, index, total) => {
                if (index >= total - 1) return 0
                const segDelayRaw = Number(rawSeg?.followupDelay)
                if (!Number.isFinite(segDelayRaw)) return 0
                return snapTimeToFrame(Math.max(0, segDelayRaw))
            }

            const inserted = []
            let cursor = actionStartTime

            for (let i = 0; i < segmentSkills.length; i++) {
                const segSkill = segmentSkills[i]
                const action = createActionFromSkill(segSkill, cursor)
                const delay = getDelayAfter(rawSegments[i], i, segmentSkills.length)

                action.segmentIndex = i + 1
                action.segmentTotal = segmentSkills.length
                action.followupDelay = delay
                action.parentSkillId = skill.id || null

                inserted.push(action)

                const end = (Number(action.startTime) || 0) + (Number(action.duration) || 0)
                cursor = snapTimeToFrame(end + delay)
            }

            track.actions.push(...inserted)
            track.actions.sort((a, b) => a.startTime - b.startTime)

            const insertedIds = inserted.map(a => a.instanceId)
            if (isComboLikeAction(skill) || isUltimateLikeAction(skill)) {
                const amount = isComboLikeAction(skill) ? 0.5 : (Number(skill.animationTime) || 1.5)
                pushSubsequentActions(actionStartTime, amount, insertedIds)
            }

            normalizeComboLinksInTracks()
            commitState()
            return
        }

        if (skill?.kind === 'attack_group' && Array.isArray(skill.attackSegments)) {
            const segments = skill.attackSegments.filter(s => (Number(s?.duration) || 0) > 0)
            if (segments.length === 0) {
                return
            }

            const attackGroupInstanceId = `atkgrp_${uid()}`
            const attackSequenceTotal = segments.length
            const attackGroupName = skill.name || getI18nSkillType('attack')
            let cursor = actionStartTime

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
            const newAction = createActionFromSkill(skill, actionStartTime)
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

        const newAction = createActionFromSkill(skill, actionStartTime)
        track.actions.push(newAction)
        track.actions.sort((a, b) => a.startTime - b.startTime)
        if (isComboLikeAction(skill) || isUltimateLikeAction(skill)) {
            const amount = isComboLikeAction(skill) ? 0.5 : (Number(skill.animationTime) || 1.5);
            pushSubsequentActions(actionStartTime, amount, newAction.instanceId)
        }
        commitState()
    }

    function removeCurrentSelection() {
        const itemsToPull = [];

        const targets = new Set(multiSelectedIds.value);
        if (selectedActionId.value) targets.add(selectedActionId.value);

        Array.from(targets).forEach((id) => {
            const wrap = getActionById(id)
            const action = wrap ? wrap.node : null
            if (!action) return
            if (action.comboGroupId && action.comboLinked !== false) {
                tracks.value.forEach(t => (t.actions || []).forEach(a => {
                    if (a?.comboGroupId === action.comboGroupId) targets.add(a.instanceId)
                }))
            }
        })

        targets.forEach(id => {
            const actionWrap = getActionById(id);
            const action = actionWrap ? actionWrap.node : null;

            if (action && (isComboLikeAction(action) || isUltimateLikeAction(action))) {
                const amount = isComboLikeAction(action) ? 0.5 : (Number(action.animationTime) || 1.5);
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

        if (activeTrackIndex.value === fromIndex) activeTrackIndex.value = toIndex
        else if (activeTrackIndex.value === toIndex) activeTrackIndex.value = fromIndex
        if (activeTrackIndex.value !== null) {
            activeTrackId.value = tracks.value[activeTrackIndex.value]?.id ?? null
        }

        commitState()
    }

    function pasteSelection(targetStartTime = null) {
        if (!clipboard.value) return
        const { actions, connections: clipConns, baseTime } = clipboard.value
        const idMap = new Map()
        const globalEffectIdMap = new Map()
        const pasted = []

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
            clonedAction.hits = cloneActionHits(clonedAction.hits, globalEffectIdMap)
            const newStartTime = clampSkillStartTime(item.data.startTime + timeDelta)
            const newAction = { ...clonedAction, instanceId: newId, startTime: newStartTime, logicalStartTime: newStartTime }
            track.actions.push(newAction)
            track.actions.sort((a, b) => a.startTime - b.startTime)
            pasted.push(newAction)
        })

        if (pasted.length > 0) {
            const groupMap = new Map()

            pasted.forEach((a) => {
                if (!a || !a.comboGroupId) return
                const oldGroup = a.comboGroupId
                if (!groupMap.has(oldGroup)) groupMap.set(oldGroup, `combo_${uid()}`)
                a.comboGroupId = groupMap.get(oldGroup)
                delete a.comboPrevId
                delete a.comboNextId
            })

            normalizeComboLinksInTracks()
        }
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
        const locate = (id) => {
            for (const t of tracks.value) {
                const idx = t.actions.findIndex(a => a.instanceId === id)
                if (idx !== -1) return { action: t.actions[idx], track: t }
            }
            return null
        }

        const getGroup = (groupId) => {
            const out = []
            if (!groupId) return out
            tracks.value.forEach(t => {
                (t.actions || []).forEach(a => {
                    if (a?.comboGroupId === groupId) out.push({ action: a, track: t })
                })
            })
            return out
        }

        const wrap = locate(actionId)
        if (!wrap || !wrap.action) return

        const found = wrap.action
        const foundTrack = wrap.track

        const has = (key) => patch && Object.prototype.hasOwnProperty.call(patch, key)
        const startTouched = has('startTime')
        const durationTouched = has('duration')
        const delayTouched = has('comboFollowupDelay')
        const linkTouched = has('comboLinked')

        const isCombo = !!found.comboGroupId && (Number(found.comboSegmentIndex) > 0)
        const oldStart = Number(found.startTime) || 0

        const applyStart = (action, nextStart) => {
            if (!action) return false
            const raw = Number(nextStart)
            if (!Number.isFinite(raw)) return false
            const clamped = raw < 0 ? 0 : snapTimeToFrame(raw)
            const prev = Number(action.startTime) || 0
            if (Math.abs(prev - clamped) < 0.0001) return false
            action.startTime = clamped
            action.logicalStartTime = clamped
            return true
        }

        const computeEnd = (action) => {
            const st = Number(action?.startTime) || 0
            const dur = Number(action?.duration) || 0
            return getShiftedEndTime(st, dur, action?.instanceId)
        }

        Object.assign(found, patch)

        let anyStartChanged = false

        if (isCombo) {
            const group = getGroup(found.comboGroupId)
            const groupActions = group.map(x => x.action).filter(Boolean)
            const total = Math.max(0, ...groupActions.map(a => Number(a.comboSegmentIndex) || 0))
            const sorted = groupActions.slice().sort((a, b) => (Number(a.comboSegmentIndex) || 0) - (Number(b.comboSegmentIndex) || 0))

            const idx0 = sorted.findIndex(a => a.instanceId === found.instanceId)

            if (idx0 !== -1 && total >= 2) {
                sorted.forEach((a, i) => {
                    a.comboSegmentTotal = total
                    a.comboPrevId = i > 0 ? sorted[i - 1].instanceId : null
                    a.comboNextId = i < total - 1 ? sorted[i + 1].instanceId : null
                })

                if (linkTouched) {
                    const nextLinked = !!found.comboLinked
                    sorted.forEach(a => { a.comboLinked = nextLinked })
                    if (nextLinked) {
                        // derive delays from current layout, then snap chain positions
                        for (let i = 0; i < total - 1; i++) {
                            const end = computeEnd(sorted[i])
                            const nextStart = Number(sorted[i + 1].startTime) || 0
                            sorted[i].comboFollowupDelay = snapTimeToFrame(Math.max(0, nextStart - end))
                        }
                        sorted[total - 1].comboFollowupDelay = 0
                        for (let i = 0; i < total - 1; i++) {
                            const end = computeEnd(sorted[i])
                            const delay = snapTimeToFrame(Math.max(0, Number(sorted[i].comboFollowupDelay) || 0))
                            sorted[i].comboFollowupDelay = delay
                            anyStartChanged = applyStart(sorted[i + 1], snapTimeToFrame(end + delay)) || anyStartChanged
                        }
                    }
                }

                const linked = sorted.every(a => a.comboLinked !== false)
                if (linked) {
                    if (delayTouched) {
                        if (idx0 < total - 1) {
                            const rawDelay = Number(found.comboFollowupDelay)
                            found.comboFollowupDelay = Number.isFinite(rawDelay) ? snapTimeToFrame(Math.max(0, rawDelay)) : 0
                            for (let i = idx0; i < total - 1; i++) {
                                const end = computeEnd(sorted[i])
                                const delay = snapTimeToFrame(Math.max(0, Number(sorted[i].comboFollowupDelay) || 0))
                                sorted[i].comboFollowupDelay = delay
                                anyStartChanged = applyStart(sorted[i + 1], snapTimeToFrame(end + delay)) || anyStartChanged
                            }
                        } else {
                            found.comboFollowupDelay = 0
                        }
                    }

                    if (startTouched) {
                        if (idx0 === 0) {
                            const newStart = Number(found.startTime) || 0
                            const delta = newStart - oldStart
                            if (Number.isFinite(delta) && Math.abs(delta) > 0.0001) {
                                sorted.forEach(a => { anyStartChanged = applyStart(a, (Number(a.startTime) || 0) + delta) || anyStartChanged })
                            }
                        } else {
                            const prev = sorted[idx0 - 1]
                            const prevEnd = computeEnd(prev)
                            const desiredDelay = snapTimeToFrame(Math.max(0, (Number(found.startTime) || 0) - prevEnd))
                            prev.comboFollowupDelay = desiredDelay
                            anyStartChanged = applyStart(found, snapTimeToFrame(prevEnd + desiredDelay)) || anyStartChanged
                            for (let i = idx0; i < total - 1; i++) {
                                const end = computeEnd(sorted[i])
                                const delay = snapTimeToFrame(Math.max(0, Number(sorted[i].comboFollowupDelay) || 0))
                                sorted[i].comboFollowupDelay = delay
                                anyStartChanged = applyStart(sorted[i + 1], snapTimeToFrame(end + delay)) || anyStartChanged
                            }
                        }
                    }

                    if (durationTouched && idx0 < total - 1) {
                        for (let i = idx0; i < total - 1; i++) {
                            const end = computeEnd(sorted[i])
                            const delay = snapTimeToFrame(Math.max(0, Number(sorted[i].comboFollowupDelay) || 0))
                            sorted[i].comboFollowupDelay = delay
                            anyStartChanged = applyStart(sorted[i + 1], snapTimeToFrame(end + delay)) || anyStartChanged
                        }
                    }
                }
            }
        }

        if (startTouched) {
            found.logicalStartTime = snapTimeToFrame(Number(found.startTime) || 0)
            anyStartChanged = true
        }

        if (anyStartChanged) {
            refreshAllActionShifts()
        }

        if (anyStartChanged && foundTrack?.actions) {
            foundTrack.actions.sort((a, b) => (Number(a.startTime) || 0) - (Number(b.startTime) || 0))
        }

        commitState()
    }

    function updateLibrarySkill(skillId, props) {
        const targetMap = characterOverrides.value
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
            const normalizedOldOperatorId = resolveOperatorSlug(oldOperatorId) || oldOperatorId || null
            const normalizedNewOperatorId = resolveOperatorSlug(newOperatorId) || newOperatorId || null
            if (!normalizedNewOperatorId) return
            if (tracks.value.some((t, i) => i !== trackIndex && (resolveOperatorSlug(t.id) || t.id) === normalizedNewOperatorId)) {
                alert(tr('timelineGrid.track.operatorAlreadyInUse'));
                return;
            }
            const actionIdsToDelete = new Set(track.actions.map(a => a.instanceId));
            if (actionIdsToDelete.size > 0) {
                connections.value = connections.value.filter(conn => !_connectionTouchesAnyActionId(conn, actionIdsToDelete));
            }
            if (normalizedOldOperatorId) {
                switchEvents.value = switchEvents.value.filter(s => s.characterId !== normalizedOldOperatorId);
                pruneDanglingConnections()
            }
            track.weaponId = null;
            track.weaponInstanceId = null
            track.equipArmorId = null;
            track.equipGlovesId = null;
            track.equipAccessory1Id = null;
            track.equipAccessory2Id = null;
            track.equipArmorInstanceId = null
            track.equipGlovesInstanceId = null
            track.equipAccessory1InstanceId = null
            track.equipAccessory2InstanceId = null
            track.equipArmorRefineTier = 0
            track.equipGlovesRefineTier = 0
            track.equipAccessory1RefineTier = 0
            track.equipAccessory2RefineTier = 0
            track.weaponAppliedDeltas = {}
            track.equipmentAppliedDeltas = {}
            track.id = normalizedNewOperatorId;
            track.operatorInstanceId = normalizedNewOperatorId
                ? operatorStore.importOperator(createMaxOperatorInstanceData(normalizedNewOperatorId)).id
                : null
            track.weaponCommon1Tier = 1
            track.weaponCommon2Tier = 1
            track.weaponBuffTier = 1
            track.stats = createDefaultStats()
            track.operatorStatus = null
            track.initialGauge = 0
            track.actions = [];
            activeTrackIndex.value = trackIndex
            activeTrackId.value = normalizedNewOperatorId
            if (selectedActionId.value && actionIdsToDelete.has(selectedActionId.value)) clearSelection();
            recomputeAllTrackOperatorStatuses()
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
            pruneDanglingConnections()
        }
        track.weaponId = null;
        track.weaponInstanceId = null
        track.equipArmorId = null;
        track.equipGlovesId = null;
        track.equipAccessory1Id = null;
        track.equipAccessory2Id = null;
        track.equipArmorInstanceId = null
        track.equipGlovesInstanceId = null
        track.equipAccessory1InstanceId = null
        track.equipAccessory2InstanceId = null
        track.equipArmorRefineTier = 0
        track.equipGlovesRefineTier = 0
        track.equipAccessory1RefineTier = 0
        track.equipAccessory2RefineTier = 0
        track.id = null;
        track.operatorInstanceId = null
        track.weaponCommon1Tier = 1
        track.weaponCommon2Tier = 1
        track.weaponBuffTier = 1
        track.weaponAppliedDeltas = {}
        track.equipmentAppliedDeltas = {}
        track.stats = createDefaultStats()
        track.operatorStatus = null
        track.initialGauge = 0
        track.actions = [];
        if (activeTrackIndex.value === trackIndex || activeTrackId.value === oldOperatorId) {
            activeTrackIndex.value = trackIndex
            activeTrackId.value = null
        }
        if (selectedActionId.value && actionIdsToDelete.has(selectedActionId.value)) clearSelection();
        recomputeAllTrackOperatorStatuses()
        commitState();
    }

    function updateTrackMaxGauge(trackId, value) {
        const track = tracks.value.find(t => t.id === trackId);
        if (track) {
            track.maxGaugeOverride = value;
            track.initialGauge = clampTrackInitialGauge(track, track.initialGauge)
            commitState();
        }
    }
    function clampTrackInitialGauge(track, value) {
        const max = track?.id ? getTrackGaugeMax(track.id) : 0
        const num = Number(value)
        if (!Number.isFinite(num)) return 0
        return Math.max(0, Math.min(num, max > 0 ? max : num))
    }
    function updateTrackInitialGauge(trackId, value) {
        const track = tracks.value.find(t => t.id === trackId)
        if (track) {
            track.initialGauge = clampTrackInitialGauge(track, value)
            commitState()
        }
    }

    function removeAnomaly(instanceId, rowIndex, colIndex) {
        let action = null;
        for (const track of tracks.value) {
            const found = track.actions.find(a => a.instanceId === instanceId);
            if (found) { action = found; break; }
        }
        if (!action) return;
        const hit = action.hits?.[rowIndex]
        const effects = Array.isArray(hit?.effects) ? hit.effects : []
        if (!effects[colIndex]) return;

        const effectToDelete = effects[colIndex]
        const idToDelete = effectToDelete._id
        if (idToDelete) {
            connections.value = connections.value.filter(conn => {
                const fromId = _getConnectionEndpointId(conn, 'from')
                const toId = _getConnectionEndpointId(conn, 'to')
                return fromId !== idToDelete && toId !== idToDelete && conn.fromEffectId !== idToDelete && conn.toEffectId !== idToDelete
            })
        }
        effects.splice(colIndex, 1);
        commitState();
    }

    function nudgeSelection(direction) {
        const targets = new Set(multiSelectedIds.value)
        if (selectedActionId.value) targets.add(selectedActionId.value)

        const delta = direction * snapStep.value
        let hasChanged = false

        if (targets.size === 0) {

            if (selectedSwitchEventId.value) {
                const event = switchEvents.value.find((item) => item.id === selectedSwitchEventId.value)
                if (!event) return
                let newTime = snapTimeToFrame((Number(event.time) || 0) + delta)
                if (newTime < 0) newTime = 0
                if (event.time !== newTime) {
                    event.time = newTime
                    commitState()
                }
                return
            }

            if (selectedCycleBoundaryId.value) {
                const boundary = cycleBoundaries.value.find((item) => item.id === selectedCycleBoundaryId.value)
                if (!boundary) return
                let newTime = snapTimeToFrame((Number(boundary.time) || 0) + delta)
                if (newTime < 0) newTime = 0
                if (boundary.time !== newTime) {
                    boundary.time = newTime
                    commitState()
                }
                return
            }

            return
        }

        tracks.value.forEach(track => {
            track.actions.forEach(action => {
                if (targets.has(action.instanceId) && !action.isLocked) {
                    if (action.logicalStartTime === undefined) action.logicalStartTime = action.startTime

                    let newLogicalTime = snapTimeToFrame(action.logicalStartTime + delta)
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

        // Compute the aligned render position.
        switch (alignMode) {
            case 'RL': newStartTime = tStart - sDur; break
            case 'LR': newStartTime = tEnd + sourceTw; break
            case 'LL': newStartTime = tStart + sourceTw; break
            case 'RR': newStartTime = tEnd - sDur; break
        }

        newStartTime = snapTimeToFrame(newStartTime)

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

    function buildVisibleEndMap(items, {
        getId,
        getTrackIndex,
        getStart,
        getEnd,
        isVisible = () => true,
    }) {
        const trackBuckets = new Map()
        items.forEach((item, originalIndex) => {
            if (!item || !isVisible(item)) return
            const trackIndex = Number(getTrackIndex(item))
            if (!Number.isFinite(trackIndex)) return
            const start = Number(getStart(item)) || 0
            const end = Number(getEnd(item)) || start
            const normalizedEnd = end < start ? start : end
            if (!trackBuckets.has(trackIndex)) trackBuckets.set(trackIndex, [])
            trackBuckets.get(trackIndex).push({
                item,
                originalIndex,
                start,
                end: normalizedEnd,
            })
        })

        const visibleEndMap = new Map()
        trackBuckets.forEach((bucket) => {
            bucket.sort((a, b) => {
                if (a.start !== b.start) return a.start - b.start
                return a.originalIndex - b.originalIndex
            })

            bucket.forEach((entry, idx) => {
                const nextEntry = bucket[idx + 1]
                const nextStart = nextEntry ? nextEntry.start : Infinity
                const visibleEnd = Math.min(entry.end, nextStart)
                visibleEndMap.set(getId(entry.item), visibleEnd < entry.start ? entry.start : visibleEnd)
            })
        })

        return visibleEndMap
    }

    function buildNextStartMap(items, {
        getId,
        getTrackIndex,
        getStart,
        isVisible = () => true,
    }) {
        const trackBuckets = new Map()
        items.forEach((item, originalIndex) => {
            if (!item || !isVisible(item)) return
            const trackIndex = Number(getTrackIndex(item))
            if (!Number.isFinite(trackIndex)) return
            const start = Number(getStart(item)) || 0
            if (!trackBuckets.has(trackIndex)) trackBuckets.set(trackIndex, [])
            trackBuckets.get(trackIndex).push({
                item,
                originalIndex,
                start,
            })
        })

        const nextStartMap = new Map()
        trackBuckets.forEach((bucket) => {
            bucket.sort((a, b) => {
                if (a.start !== b.start) return a.start - b.start
                return a.originalIndex - b.originalIndex
            })

            bucket.forEach((entry, idx) => {
                const nextEntry = bucket[idx + 1]
                nextStartMap.set(getId(entry.item), nextEntry ? nextEntry.start : Infinity)
            })
        })

        return nextStartMap
    }

    const newActionCoverStartMap = computed(() => {
        const map = new Map()
        ;(compiledTimeline.value.actions || []).forEach((action) => {
            const interruptTime = Number(action?.interruptTime)
            if (Number.isFinite(interruptTime)) {
                map.set(action.id, interruptTime)
            }
        })
        return map
    })

    function getActionCoverStartTime(actionId) {
        const value = newActionCoverStartMap.value.get(actionId)
        return Number.isFinite(value) ? value : null
    }

    function getResolvedActionVisualEndTime(resolvedAction) {
        if (!resolvedAction) return null

        const simEnd = simulation.value?.actionEndTimes?.get(resolvedAction.id)
        const normalizedSimEnd = Number(simEnd)
        if (Number.isFinite(normalizedSimEnd)) return normalizedSimEnd

        const start = Number(resolvedAction.realStartTime) || 0
        const duration = Number(resolvedAction.realDuration) || 0
        return start + duration
    }

    function getActionVisualEndTime(actionId) {
        if (!actionId) return null
        const resolvedAction = compiledTimeline.value?.actionMap?.get(actionId)
        if (resolvedAction) return getResolvedActionVisualEndTime(resolvedAction)

        const actionWrap = getActionById(actionId)
        const action = actionWrap?.node
        if (!action) return null
        return (Number(action.startTime) || 0) + (Number(action.duration) || 0)
    }

    function getActionVisualDuration(actionId) {
        if (!actionId) return null
        const resolvedAction = compiledTimeline.value?.actionMap?.get(actionId)
        const visualEnd = getActionVisualEndTime(actionId)
        if (visualEnd == null) return null

        const start = Number(resolvedAction?.realStartTime ?? getActionById(actionId)?.node?.startTime) || 0
        return Math.max(0, visualEnd - start)
    }

    const nodeRects = computed(() => {
        return newNodeRects.value;
    });

    const newNodeRects = computed(() => {
        const rects = {}
        const ACTION_BORDER = 2
        const LINE_GAP = 6
        const LINE_HEIGHT = 2
        const visibleEndMap = buildVisibleEndMap(compiledTimeline.value.actions || [], {
            getId: (action) => action.id,
            getTrackIndex: (action) => action.trackIndex,
            getStart: (action) => action.realStartTime,
            getEnd: (action) => getResolvedActionVisualEndTime(action),
        })

        const actions = compiledTimeline.value?.actions || []

        actions.forEach(resAction => {
            const left = timeToPx(resAction.realStartTime)
            const visibleEnd = visibleEndMap.get(resAction.id) ?? getResolvedActionVisualEndTime(resAction)
            const width = timeToPx(visibleEnd) - timeToPx(resAction.realStartTime)
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

    const effectLayouts = computed(() => {
        return newEffectLayouts.value;
    });

    const newEffectLayouts = computed(() => {
        const layoutMap = new Map()
        const ICON_SIZE = 20
        const BAR_MARGIN = 2
        const VERTICAL_GAP = 3
        const ACTION_BORDER = 2

        const actions = compiledTimeline.value?.actions || []

        actions.forEach(resAction => {
            const actionRect = nodeRects.value[resAction.id]?.rect
            if (!actionRect) return

            resAction.effects.forEach(effect => {
                const effectId = effect.id

                const effectLeft = timeToPx(effect.realStartTime)

                const relativeX = effectLeft - actionRect.left
                const relativeY = (effect.hitIndex * (VERTICAL_GAP + ICON_SIZE)) + VERTICAL_GAP + ACTION_BORDER;
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
                    startTime: effect.realStartTime,
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

    function getNodeRect(id) {
        if (nodeRects.value[id]) return nodeRects.value[id]
        const effectLayout = effectLayouts.value.get(id)
        if (effectLayout) return effectLayout.rect
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
    // Context menu state
    // ===================================================================================
    const contextMenu = ref({
        visible: false,
        x: 0,
        y: 0,
        targetId: null,
        targetType: null,
        time: 0
    })

    function openContextMenu(evt, instanceId = null, time = 0, targetType = null) {
        contextMenu.value = {
            visible: true,
            x: evt.clientX,
            y: evt.clientY,
            targetId: instanceId,
            targetType,
            time
        }
    }

    function closeContextMenu() {
        contextMenu.value.visible = false
    }

    // ===================================================================================
    // Action property toggles (lock, disable, color)
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

    function getInheritedEnemyBuffEntry(key) {
        const snapshot = inheritedInitialEnemyState.value
        if (!snapshot || !key) return null
        if (key === 'infliction') return snapshot.infliction || null
        if (key === 'vulnerability') return snapshot.vulnerability || null
        if (key.startsWith('debuff:')) return snapshot.debuffs?.[key.slice('debuff:'.length)] || null
        if (key.startsWith('status:')) {
            const id = key.slice('status:'.length)
            return (snapshot.statuses || []).find(entry => entry?.id === id) || null
        }
        return null
    }

    function isInheritedEnemyBuffDisabled(key) {
        return Array.isArray(inheritedInitialEnemyState.value?.disabledEffects)
            && inheritedInitialEnemyState.value.disabledEffects.includes(key)
    }

    function toggleInheritedEnemyBuffDisable(key) {
        if (!getInheritedEnemyBuffEntry(key)) return false
        const snapshot = inheritedInitialEnemyState.value
        const disabled = new Set(Array.isArray(snapshot.disabledEffects) ? snapshot.disabledEffects : [])
        if (disabled.has(key)) disabled.delete(key)
        else disabled.add(key)
        snapshot.disabledEffects = [...disabled]
        commitState()
        return true
    }

    function removeInheritedEnemyBuff(key) {
        const snapshot = inheritedInitialEnemyState.value
        if (!snapshot || !getInheritedEnemyBuffEntry(key)) return false

        if (key === 'infliction') snapshot.infliction = null
        else if (key === 'vulnerability') snapshot.vulnerability = null
        else if (key.startsWith('debuff:') && snapshot.debuffs) {
            snapshot.debuffs[key.slice('debuff:'.length)] = null
        } else if (key.startsWith('status:')) {
            const id = key.slice('status:'.length)
            snapshot.statuses = (snapshot.statuses || []).filter(entry => entry?.id !== id)
        }

        snapshot.disabledEffects = (snapshot.disabledEffects || []).filter(item => item !== key)
        commitState()
        return true
    }

    function setActionColor(instanceId, color) {
        const info = getActionById(instanceId)
        if (info) {
            info.node.customColor = color
            commitState()
        }
    }

    function isHitForcedCrit(actionInstanceId, hitIndex) {
        if (!actionInstanceId || hitIndex == null) return false
        const info = getActionById(actionInstanceId)
        return Array.isArray(info?.node?.forcedCritHits) && info.node.forcedCritHits.includes(hitIndex)
    }

    function toggleHitForcedCrit(actionInstanceId, hitIndex) {
        if (!actionInstanceId || hitIndex == null) return
        const info = getActionById(actionInstanceId)
        if (!info?.node) return

        const list = Array.isArray(info.node.forcedCritHits) ? info.node.forcedCritHits : []
        if (list.includes(hitIndex)) {
            const next = list.filter((item) => item !== hitIndex)
            if (next.length) info.node.forcedCritHits = next
            else delete info.node.forcedCritHits
        } else {
            info.node.forcedCritHits = [...list, hitIndex]
        }
        commitState()
    }

    function getHitDisplayDamage(hit) {
        if (!hit) return 0
        if (isHitForcedCrit(hit._actionInstanceId, hit._hitIndex) && hit._damageBreakdown) {
            return hit._damageBreakdown.critDamage
        }
        return hit._expectedDamage ?? hit._damageBreakdown?.expectedDamage ?? 0
    }

    // ===================================================================================
    // Monitor data
    // ===================================================================================
    const compiledScenario = computed(() => {
        const currentScenario = scenarioList.value.find(s => s.id === activeScenarioId.value);
        if (!currentScenario) return null;
        return compileEndaxisScenario({
            scenarioData: currentScenario.data,
            tracks: tracks.value,
            characterRoster: characterRoster.value,
            systemConstants: effectiveSystemConstants.value,
            prepDuration: prepDuration.value,
            activeEnemyId: activeEnemyId.value,
            runtimeInitialEffects: [
                ...runtimeInitialEffects.value,
                ...inheritedInitialEffects.value,
            ],
            runtimeInitialEnemyState: inheritedInitialEnemyState.value,
            simulationEndline: simulationEndline.value,
            lmdiAttributionMode: lmdiAttributionMode.value,
            controlledOperatorSegments: controlledOperatorSegments.value,
        });
    });

    const compiledTimeline = computed(() => {
        return compiledScenario.value?.timeline;
    });

    const simulation = computed(() => {
        const scenario = compiledScenario.value;
        if (!scenario) return null;
        return simulate(
            scenario.timeline,
            scenario.teamConfig,
            scenario.enemyConfig,
            scenario.actors,
            scenario.triggerRegistry,
            scenario.consumedStacksWriteKeys,
            {
                initialEffects: scenario.initialEffects,
                initialEnemyState: scenario.initialEnemyState,
                baseStatsByTrack: scenario.baseStatsByTrack,
                enemyDef: scenario.enemyDef,
                enemyResistance: scenario.enemyResistance,
                endlineTime: scenario.endlineTime,
                lmdiAttributionMode: scenario.lmdiAttributionMode,
                controlledOperatorSegments: scenario.controlledOperatorSegments,
            },
        );
    });

    const optimizerProjection = computed(() => {
        return projectOptimizerResult({
            simulation: simulation.value,
            compiledScenario: compiledScenario.value,
            tracks: tracks.value,
            viewDuration: viewDuration.value,
            prepDuration: prepDuration.value,
            simulationEndline: simulationEndline.value,
        })
    })

    const simLog = computed(() => {
        return optimizerProjection.value.simLog
    })

    const operatorLog = computed(() => {
        return optimizerProjection.value.operatorLog
    })

    const enemyLog = computed(() => {
        return optimizerProjection.value.enemyLog
    })

    const simLogRevision = computed(() => {
        return simLog.value.length + enemyLog.value.length
    })

    const spSeries = computed(() => {
        return optimizerProjection.value.spSeries
    });

    const staggerSeries = computed(() => {
        return optimizerProjection.value.staggerSeries
    });

    const trackBuffLayouts = computed(() => {
        return optimizerProjection.value.trackBuffLayouts
    })

    const enemyEffectLayout = computed(() => {
        return optimizerProjection.value.enemyEffectLayout
    })

    const enemyAfflictionViz = computed(() => {
        return optimizerProjection.value.enemyAfflictionViz
    })

    const operatorEffectLayouts = computed(() => {
        return optimizerProjection.value.operatorEffectLayouts
    })

    const timeContext = computed(() => compiledTimeline.value?.timeContext || null);

    const globalExtensions = computed(() => {
        return compiledTimeline.value?.timeExtensions || [];
    });

    function refreshAllActionShifts(excludeIds = []) {
        const excludeSet = new Set(Array.isArray(excludeIds) ? excludeIds : [excludeIds]);

        const allActions = tracks.value.flatMap(t => t.actions)
            .sort((a, b) => (a.logicalStartTime ?? a.startTime) - (b.logicalStartTime ?? b.startTime));

        const stopSources = allActions.filter(a => (isComboLikeAction(a) || isUltimateLikeAction(a)) && !a.isDisabled && (a.triggerWindow || 0) >= 0);

        let lastPhysicalEnd = 0;
        const sourceShiftMap = new Map();

        stopSources.forEach((source, index) => {
            const nextSource = stopSources[index + 1];

            const physicalStart = Math.max(source.logicalStartTime, lastPhysicalEnd);

            let amount = 0;
            if (isUltimateLikeAction(source)) {
                amount = Number(source.animationTime) || 1.5;
            } else {
                if (nextSource) {
                    const gap = nextSource.logicalStartTime - source.logicalStartTime;
                    amount = Math.min(0.5, Math.max(0.1, snapTimeToFrame(gap)));
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
                    a.startTime = snapTimeToFrame(ctx.physicalStart);
                } else {
                    const normalShiftedTime = a.logicalStartTime + ctx.shift;
                    a.startTime = snapTimeToFrame(Math.max(normalShiftedTime, ctx.physicalEnd));
                }
            } else {
                a.startTime = a.logicalStartTime;
            }
        });

        tracks.value.forEach(t => t.actions.sort((a, b) => a.startTime - b.startTime));
    }

    function getShiftedEndTime(startTime, duration, excludeActionId = null) {
        return timeContext.value
            ? timeContext.value.getShiftedEndTime(startTime, duration, excludeActionId)
            : startTime + duration;
    }

    const ultimateEnhancementMetricsMap = computed(() => {
        const map = new Map()

        const getMetrics = (trackId, action) => {
            if (!action || !isUltimateLikeAction(action)) return null
            const baseDuration = Number(action.enhancementTime) || 0
            if (baseDuration <= 0) return null

            const resolvedAction = compiledTimeline.value?.actionMap?.get(action.instanceId)
            const start = Number(resolvedAction?.realStartTime ?? action.startTime) || 0
            const freezeDuration = Number(action.animationTime || action.duration) || 0
            const enhStart = getShiftedEndTime(start, freezeDuration, action.instanceId)

            let extraDuration = 0

            const extender = getUltimateEnhancementExtender(trackId)
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
        return timeContext.value ? timeContext.value.toGameTime(realTimeS) : realTimeS;
    }

    function toRealTime(gameTimeS) {
        return timeContext.value ? timeContext.value.toRealTime(gameTimeS) : gameTimeS;
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

    function resolveGaugeMax(trackId, track, charInfo) {
        const libId = `${trackId}_ultimate`
        const override = characterOverrides.value[libId]

        const manualOverride = Number(track.maxGaugeOverride)
        if (Number.isFinite(manualOverride) && manualOverride > 0) {
            return manualOverride
        }

        const rawBaseMax = (override && override.gaugeCost)
            ? override.gaugeCost
            : (charInfo.ultimate_gaugeMax || 100)

        const baseMax = Number(rawBaseMax)
        const safeBaseMax = Number.isFinite(baseMax) && baseMax > 0 ? baseMax : 100

        const costReduction = Number(track.operatorStatus?.ultimateEnergyCostReduction) || 0
        const reducedMax = safeBaseMax * (1 - Math.max(0, Math.min(costReduction, 0.99)))

        return Math.max(1, Math.ceil(reducedMax))
    }

    function getTrackGaugeMax(trackId) {
        const track = tracks.value.find(t => t.id === trackId);
        if (!track) return 0;
        const charInfo = characterRoster.value.find(c => c.id === trackId);
        if (!charInfo) return 0;
        return resolveGaugeMax(trackId, track, charInfo);
    }

    const gaugeSeriesByTrackId = computed(() => {
        return optimizerProjection.value.gaugeSeriesByTrackId
    })

    function calculateGaugeData(trackId) {
        const track = tracks.value.find(t => t.id === trackId);
        if (!track) return [];

        const efficiency = ((track.gaugeEfficiency ?? 100)) / 100;
        const charInfo = characterRoster.value.find(c => c.id === trackId);
        if (!charInfo) return [];

        const canAcceptTeamGauge = (charInfo.accept_team_gauge !== false);
        const GAUGE_MAX = resolveGaugeMax(trackId, track, charInfo);

        // Add a prep-time pause event so projected SP matches the frozen opening window.
        const blockWindows = [];
        if (track.actions) {
            track.actions.forEach(action => {
                if (isUltimateLikeAction(action) && !action.isDisabled) {
                    const start = snapTimeToFrame(action.startTime);
                    const animT = Number(action.animationTime || 0);
                    const enhT = Number(action.enhancementTime || 0);

                    let end = null
                    if (typeof getUltimateEnhancementExtender(trackId) === 'function' && enhT > 0) {
                        const metrics = getUltimateEnhancementMetrics(action.instanceId)
                        if (metrics?.finalEnd) end = snapTimeToFrame(metrics.finalEnd)
                    }

                    if (!end) {
                        end = snapTimeToFrame(getShiftedEndTime(
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
            const t = snapTimeToFrame(time);
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

                // Apply gauge changes caused by this track's own actions.
                if (sourceTrack.id === trackId) {
                    // Costs are applied at action start.
                    if (action.gaugeCost > 0) {
                        events.push({ time: snapTimeToFrame(action.startTime), change: -Number(action.gaugeCost) });
                    }
                    // Self gauge gain is applied when the action ends.
                    if (action.gaugeGain > 0) {
                        const triggerTime = getShiftedEndTime(action.startTime, action.duration, action.instanceId);
                        if (!isBlocked(triggerTime, action.instanceId)) {
                            events.push({ time: snapTimeToFrame(triggerTime), change: action.gaugeGain * efficiency });
                        }
                    }
                }
                // Team gauge gain from allies applies to receivers that accept it.
                else if (action.teamGaugeGain > 0 && canAcceptTeamGauge) {
                    const triggerTime = getShiftedEndTime(action.startTime, action.duration, action.instanceId);
                    if (!isBlocked(triggerTime, action.instanceId)) {
                        events.push({ time: snapTimeToFrame(triggerTime), change: action.teamGaugeGain * efficiency });
                    }
                }
            });
        });

        // Sort all gauge change events.
        events.sort((a, b) => a.time - b.time);

        const initialGauge = Number(track.initialGauge) || 0;
        let currentGauge = initialGauge > GAUGE_MAX ? GAUGE_MAX : initialGauge;
        const points = [{ time: 0, val: currentGauge, ratio: currentGauge / GAUGE_MAX }];

        // Simulate the resulting gauge curve.
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
        cycleBoundaries.value.forEach(b => { b.time = shiftVal(b.time) })
        switchEvents.value.forEach(e => { e.time = shiftVal(e.time) })

        prepDuration.value = prev + appliedDelta
        refreshAllActionShifts()
        setTimelineShift(timelineShift.value)
        if (commit) commitState()
    }

    // ===================================================================================
    // Persistence and data loading
    // ===================================================================================

    const STORAGE_KEY = 'endaxis_autosave'

    function initAutoSave() {
        watchThrottled([
                tracks,
                connections,
                characterOverrides,
                weaponOverrides,
                equipmentCategoryOverrides,
                systemConstants,
                scenarioList,
                activeScenarioId,
                activeEnemyId,
                activeEnemyLevel,
                customEnemyParams,
                cycleBoundaries,
                switchEvents,
                inheritedInitialEffects,
                inheritedInitialEnemyState,
                contingencyContractTags,
                () => operatorStore.operators,
                () => weaponStore.weapons,
                () => gearStore.gears
            ],
            ([
                 newTracks,
                 newConns,
                 newOverrides,
                 newWeaponOverrides,
                 newEquipmentCatOverrides,
                 newSys,
                 newScList,
                 newActiveId,
                 newEnemyId,
                 newEnemyLevel,
                 newCustomParams,
                 newBoundaries,
                 newSwEvents,
                 newInheritedInitialEffects,
                 newInheritedInitialEnemyState,
                 newContingencyContractTags,
                 newOperators,
                 newWeapons,
                 newGears
             ]) => {

                if (isLoading.value) return

                const listToSave = JSON.parse(JSON.stringify(newScList))
                listToSave.forEach(sc => {
                    if (sc?.data) dropLegacyTimedStatusData(sc.data)
                })
                const currentSc = listToSave.find(s => s.id === newActiveId)

                if (currentSc) {
                    currentSc.data = {
                        tracks: newTracks,
                        connections: newConns,
                        operators: toRaw(newOperators),
                        weapons: toRaw(newWeapons),
                        gears: toRaw(newGears),
                        characterOverrides: newOverrides,
                        weaponOverrides: newWeaponOverrides,
                        equipmentCategoryOverrides: newEquipmentCatOverrides,
                        prepDuration: prepDuration.value,
                        prepExpanded: prepExpanded.value,
                        systemConstants: newSys,
                        activeEnemyId: newEnemyId,
                        activeEnemyLevel: newEnemyLevel,
                        customEnemyParams: newCustomParams,
                        cycleBoundaries: newBoundaries,
                        switchEvents: newSwEvents,
                        inheritedInitialEffects: newInheritedInitialEffects,
                        inheritedInitialEnemyState: newInheritedInitialEnemyState,
                        contingencyContractTags: newContingencyContractTags,
                    }
                }

                const snapshot = {
                    version: '1.0.0',
                    timestamp: Date.now(),
                    scenarioList: listToSave,
                    activeScenarioId: newActiveId,
                    systemConstants: newSys,
                    activeEnemyId: newEnemyId,
                    activeEnemyLevel: newEnemyLevel
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeProjectData(snapshot)))
            }, { deep: true, throttle: 500 })
    }

    function loadFromBrowser() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const data = deserializeProjectData(JSON.parse(raw));

                if (!data.scenarioList) return false;

                if (data.systemConstants) {
                    systemConstants.value = normalizeEnemyConfig(systemConstants.value, data.systemConstants);
                }
                activeEnemyLevel.value = normalizeEnemyLevel(data.activeEnemyLevel ?? activeEnemyLevel.value)

                scenarioList.value = data.scenarioList.map(sc => {
                    const cloned = JSON.parse(JSON.stringify(sc))
                    if (cloned?.data) {
                        const normalized = normalizePrepConfig(cloned.data)
                        cloned.data = dropLegacyTimedStatusData(normalized.snapshot)
                    }
                    return cloned
                })
                activeScenarioId.value = data.activeScenarioId || scenarioList.value[0].id

                const currentSc = scenarioList.value.find(s => s.id === activeScenarioId.value)
                if (currentSc && currentSc.data) {
                    _loadSnapshot(currentSc.data)
                } else {
                    restoreArmoryFromSnapshot(null)
                    tracks.value = createDefaultTracks();
                    connections.value = [];
                    characterOverrides.value = {};
                    weaponOverrides.value = {};
                    equipmentCategoryOverrides.value = {};
                    prepDuration.value = 5
                    prepExpanded.value = true
                    inheritedInitialEffects.value = []
                    inheritedInitialEnemyState.value = null
                    recomputeAllTrackOperatorStatuses()
                }

                historyStack.value = []; historyIndex.value = -1; commitState();
                return true;
            } catch (e) { console.error("Auto-save load failed:", e) }
        }
        return false;
    }

    function resetProject() {
        localStorage.removeItem(STORAGE_KEY);
        operatorStore.clearAll()
        weaponStore.clearAll()
        gearStore.clearAll()
        tracks.value = createDefaultTracks();
        connections.value = [];
        characterOverrides.value = {};
        weaponOverrides.value = {};
        equipmentCategoryOverrides.value = {};
        cycleBoundaries.value = [];
        switchEvents.value = [];
        inheritedInitialEffects.value = []
        inheritedInitialEnemyState.value = null
        prepDuration.value = 5
        prepExpanded.value = true

        systemConstants.value = createDefaultSystemConstantsState();

        activeEnemyId.value = 'custom';
        activeEnemyLevel.value = 90;
        // Reset scenarios to the default single-scenario state.
        scenarioList.value = [{ id: 'default_sc', name: tr('timeline.scenario.defaultName', { index: 1 }), data: null }];
        activeScenarioId.value = 'default_sc';

        recomputeAllTrackOperatorStatuses()
        clearSelection();
        historyStack.value = [];
        historyIndex.value = -1;
        commitState();
    }


    async function fetchGameData() {
        try {
            isLoading.value = true
            initializeOptimizerGameData()
            historyStack.value = []
            historyIndex.value = -1
            recomputeAllTrackOperatorStatuses()
            commitState()

        } catch (error) {
            console.error("Load failed:", error)
        } finally {
            isLoading.value = false
        }
    }

    function getProjectData({ includeScenarios = null } = {}) {
        let listToExport = JSON.parse(JSON.stringify(scenarioList.value))
        listToExport.forEach(sc => {
            if (sc?.data) dropLegacyTimedStatusData(sc.data)
        })

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
                operators: toRaw(operatorStore.operators),
                weapons: toRaw(weaponStore.weapons),
                gears: toRaw(gearStore.gears),
                characterOverrides: characterOverrides.value,
                weaponOverrides: weaponOverrides.value,
                equipmentCategoryOverrides: equipmentCategoryOverrides.value,
                prepDuration: prepDuration.value,
                prepExpanded: prepExpanded.value,
                systemConstants: systemConstants.value,
                activeEnemyId: activeEnemyId.value,
                activeEnemyLevel: activeEnemyLevel.value,
                customEnemyParams: customEnemyParams.value,
                cycleBoundaries: cycleBoundaries.value,
                switchEvents: switchEvents.value,
                inheritedInitialEffects: inheritedInitialEffects.value,
                inheritedInitialEnemyState: inheritedInitialEnemyState.value,
                contingencyContractTags: contingencyContractTags.value,
            }
        }

        return {
            timestamp: Date.now(),
            version: '1.0.0',
            scenarioList: listToExport,
            activeScenarioId: activeScenarioId.value,
            systemConstants: systemConstants.value,
            activeEnemyId: activeEnemyId.value,
            activeEnemyLevel: activeEnemyLevel.value
        };
    }

    function exportProject({ filename } = {}) {
        const projectData = serializeProjectData(getProjectData());

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
        const projectData = serializeProjectData(getProjectData({ includeScenarios }));
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
            const normalizedData = deserializeProjectData(data)

            if (normalizedData.systemConstants) {
                systemConstants.value = normalizeEnemyConfig(systemConstants.value, normalizedData.systemConstants);
            }

            if (normalizedData.activeEnemyId) { activeEnemyId.value = normalizedData.activeEnemyId }
            activeEnemyLevel.value = normalizeEnemyLevel(normalizedData.activeEnemyLevel ?? activeEnemyLevel.value)

            if (normalizedData.customEnemyParams) {
                customEnemyParams.value = normalizeEnemyConfig(customEnemyParams.value, normalizedData.customEnemyParams)
            }

            if (normalizedData.scenarioList) {
                // normalize & migrate legacy scenarios
                scenarioList.value = normalizedData.scenarioList.map(sc => {
                    const cloned = JSON.parse(JSON.stringify(sc))
                    if (cloned?.data) {
                        const normalized = normalizePrepConfig(cloned.data)
                        cloned.data = dropLegacyTimedStatusData(normalized.snapshot)
                    }
                    return cloned
                })
                const validId = scenarioList.value.find(s => s.id === normalizedData.activeScenarioId) ? normalizedData.activeScenarioId : scenarioList.value[0].id
                activeScenarioId.value = validId

                const currentSc = scenarioList.value.find(s => s.id === activeScenarioId.value)
                if (currentSc && currentSc.data) {
                    _loadSnapshot(currentSc.data)
                } else {
                    tracks.value = createDefaultTracks();
                    connections.value = [];
                    characterOverrides.value = {};
                    weaponOverrides.value = {};
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
        MAX_SCENARIOS, toTimelineSpace, toViewportSpace, toGameTime, toRealTime,
        systemConstants, effectiveSystemConstants, effectiveEnemyHp, contingencyEnemyHealingRate, isLoading, characterRoster, iconDatabase, tracks, connections, activeTrackId, activeTrackIndex, timelineScrollTop, timelineShift, timelineRect, trackLaneRects, nodeRects, draggingSkillData,
        lmdiAttributionMode,
        selectedActionId, selectedLibrarySkillId, multiSelectedIds, clipboard, isCapturing, setIsCapturing, showCursorGuide, operatorEffectsVisible, isBoxSelectMode, cursorPosTimeline, cursorCurrentTime, cursorPosition, snapStep,
        selectedAnomalyId, setSelectedAnomalyId, updateTrackGaugeEfficiency,
        teamTracksInfo, controlledOperatorSegments, getControlledOperatorAt, activeSkillLibrary, BASE_BLOCK_WIDTH, setBaseBlockWidth, formatTimeLabel, ZOOM_LIMITS, timeBlockWidth, ELEMENT_COLORS, getCharacterElementColor, isActionSelected, hoveredActionId, setHoveredAction,
        fetchGameData, exportProject, importProject, exportShareString, importShareString, TOTAL_DURATION, selectTrack, changeTrackOperator, clearTrack, selectLibrarySkill, updateLibrarySkill, selectAction, updateAction,
        addSkillToTrack, setDraggingSkill, setTimelineShift, setScrollTop, resetTimelineViewport, setTimelineRect, setTrackLaneRect, setNodeRect, calculateGaugeData, getTrackGaugeMax, updateTrackInitialGauge, updateTrackMaxGauge, updateTrackOriginiumArtsPower, updateTrackLinkCdReduction, updateTrackWeapon,
        updateTrackWeaponTier, syncAllWeaponModifiers, getModifierLabel,
        removeConnection, updateConnection, updateConnectionPort, getColor, toggleCursorGuide, toggleOperatorEffectsVisible, isOperatorEffectsVisible, toggleBoxSelectMode, setCursorPosition, toggleSnapStep, nudgeSelection,
        setMultiSelection, clearSelection, copySelection, pasteSelection, removeCurrentSelection, undo, redo, commitState,
        removeAnomaly, initAutoSave, loadFromBrowser, resetProject, selectedConnectionId, selectConnection, selectAnomaly,
        alignActionToTarget, moveTrack,
        connectionMap, actionMap, effectsMap, getConnectionById, resolveNode, getNodesOfConnection, enableConnectionTool, connectionDragState, connectionSnapState, validConnectionTargetIds, createConnection, toggleConnectionTool,
        cycleBoundaries, selectedCycleBoundaryId, addCycleBoundary, updateCycleBoundary, selectCycleBoundary,
        contextMenu, openContextMenu, closeContextMenu,
        switchEvents, selectedSwitchEventId, addSwitchEvent, updateSwitchEvent, selectSwitchEvent,
        toggleActionLock, toggleActionDisable, setActionColor, isHitForcedCrit, toggleHitForcedCrit, getHitDisplayDamage,
        getInheritedEnemyBuffEntry, isInheritedEnemyBuffDisabled, toggleInheritedEnemyBuffDisable, removeInheritedEnemyBuff,
        globalExtensions, getShiftedEndTime, refreshAllActionShifts, getActionById, getEffectById,
        getUltimateEnhancementMetrics,
        enemyDatabase, activeEnemyId, activeEnemyLevel, applyEnemyPreset, setActiveEnemyLevel, ENEMY_TIERS, enemyCategories,
        scenarioList, activeScenarioId, switchScenario, addScenario, duplicateScenario, deleteScenario,
        createInheritedScenarioFromCycleBoundary,
        effectLayouts, getNodeRect, weaponDatabase, weaponOverrides, activeWeapon, getWeaponById,
        equipmentDatabase, equipmentCategories, equipmentCategoryConfigs, getEquipmentById, updateTrackEquipment, updateTrackEquipmentTier,
        equipmentCategoryOverrides, updateEquipmentCategoryOverride, getSetBonusDisplayName,
        getActiveSetBonusCategories,
        misc,
        prepDuration, prepExpanded, viewDuration, prepZoneWidthPx, totalTimelineWidthPx,
        timeToPx, pxToTime, formatAxisTimeLabel, togglePrepExpanded, setPrepDuration,
        getActionCoverStartTime, getActionVisualEndTime, getActionVisualDuration,
        compiledTimeline, spSeries, staggerSeries,
        trackBuffLayouts,
        enemyEffectLayout,
        enemyAfflictionViz,
        operatorEffectLayouts,
        gaugeSeriesByTrackId,
        simLog,
        operatorLog,
        enemyLog,
        simLogRevision,
        contingencyContractTags,
        setContingencyContractTags,
    }
})
