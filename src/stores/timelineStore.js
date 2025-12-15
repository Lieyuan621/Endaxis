import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { executeFetch } from '@/api/fetchStrategy.js'
import LZString from 'lz-string'

const uid = () => Math.random().toString(36).substring(2, 9)

export const useTimelineStore = defineStore('timeline', () => {

    // ===================================================================================
    // 系统配置与常量
    // ===================================================================================

    const DEFAULT_SYSTEM_CONSTANTS = {
        maxSp: 300,
        initialSp: 200,
        spRegenRate: 8,
        skillSpCostDefault: 100,
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

    const BASE_BLOCK_WIDTH = 50
    const TOTAL_DURATION = 120
    const MAX_SCENARIOS = 14

    const ELEMENT_COLORS = {
        "blaze": "#ff4d4f", "cold": "#00e5ff", "emag": "#ffd700", "nature": "#52c41a", "physical": "#e0e0e0",
        "link": "#fdd900", "execution": "#a61d24", "skill": "#ffffff", "ultimate": "#00e5ff", "attack": "#aaaaaa", "default": "#8c8c8c",
        'blaze_attach': '#ff4d4f', 'blaze_burst': '#ff7875', 'burning': '#f5222d',
        'cold_attach': '#00e5ff', 'cold_burst': '#40a9ff', 'frozen': '#1890ff', 'ice_shatter': '#bae7ff',
        'emag_attach': '#ffd700', 'emag_burst': '#fff566', 'conductive': '#ffec3d',
        'nature_attach': '#95de64', 'nature_burst': '#73d13d', 'corrosion': '#52c41a',
        'break': '#d9d9d9', 'armor_break': '#d9d9d9', 'stagger': '#d9d9d9',
        'knockdown': '#d9d9d9', 'knockup': '#d9d9d9',
    }

    const getColor = (key) => ELEMENT_COLORS[key] || ELEMENT_COLORS.default

    const ENEMY_TIERS = [
        { label: '普通', value: 'normal', color: '#a0a0a0' },
        { label: '进阶', value: 'elite', color: '#52c41a' },
        { label: '精英', value: 'champion', color: '#d8b4fe' },
        { label: '领袖', value: 'boss', color: '#ff4d4f' }
    ]
    // ===================================================================================
    // 核心数据状态
    // ===================================================================================

    const isLoading = ref(true)
    const characterRoster = ref([])
    const iconDatabase = ref({})
    const enemyDatabase = ref([])
    const activeEnemyId = ref('custom')
    const enemyCategories = ref([])

    const activeScenarioId = ref('default_sc')
    const scenarioList = ref([
        { id: 'default_sc', name: '方案 1', data: null }
    ])

    const tracks = ref([
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
    ])
    const connections = ref([])
    const characterOverrides = ref({})

    const connectionMap = computed(() => {
        const map = new Map()
        for (const conn of connections.value) {
            map.set(conn.id, conn)
        }
        return map
    })

    const actionMap = computed(() => {
        const map = new Map()
        for (const track of tracks.value) {
            for (const action of track.actions) {
                map.set(action.instanceId, {
                    trackId: track.id,
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

        let fromNode = null
        let toNode = null

        if (conn.fromEffectId) {
            fromNode = getEffectById(conn.fromEffectId)
        } else if (conn.from) {
            fromNode = getActionById(conn.from)
        }
        if (conn.toEffectId) {
            toNode = getEffectById(conn.toEffectId)
        } else if (conn.to) {
            toNode = getActionById(conn.to)
        }

        return { fromNode, toNode }
    }

    // ===================================================================================
    // 交互状态
    // ===================================================================================

    const activeTrackId = ref(null)
    const timelineScrollLeft = ref(0)

    const showCursorGuide = ref(false)
    const cursorCurrentTime = ref(0)
    const cursorPosition = ref({ x: 0, y: 0 })
    const snapStep = ref(0.5)

    const globalDragOffset = ref(0)
    const draggingSkillData = ref(null)

    const selectedConnectionId = ref(null)
    const selectedActionId = ref(null)
    const selectedLibrarySkillId = ref(null)
    const selectedAnomalyId = ref(null)

    const multiSelectedIds = ref(new Set())
    const isBoxSelectMode = ref(false)
    const clipboard = ref(null)

    const hoveredActionId = ref(null)

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
            characterOverrides: characterOverrides.value
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
        tracks.value = snapshot.tracks
        connections.value = snapshot.connections
        characterOverrides.value = snapshot.characterOverrides
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
            systemConstants: systemConstants.value,
            activeEnemyId: activeEnemyId.value,
            customEnemyParams: customEnemyParams.value
        }))
    }

    function _loadSnapshot(data) {
        if (!data) return
        tracks.value = JSON.parse(JSON.stringify(data.tracks))
        connections.value = JSON.parse(JSON.stringify(data.connections || []))
        characterOverrides.value = JSON.parse(JSON.stringify(data.characterOverrides || {}))
        if (data.systemConstants) {
            systemConstants.value = { ...systemConstants.value, ...data.systemConstants }
        }
        activeEnemyId.value = data.activeEnemyId || 'custom'
        if (data.customEnemyParams) {
            customEnemyParams.value = { ...customEnemyParams.value, ...data.customEnemyParams }
        }
        clearSelection()
    }

    // ===================================================================================
    // 连线拖拽
    // ===================================================================================
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

    function createConnection(fromNode, toNode, fromPortDir, targetPortDir, isConsumption = false) {
        let from = null
        let to = null
        let fromEffectIndex = null
        let toEffectIndex = null
        let fromEffectId = null
        let toEffectId = null

        if (fromNode.type === 'action') {
            from = fromNode.id
        } else if (fromNode.type === 'effect') {
            from = fromNode.actionId
            fromEffectId = fromNode.id
            fromEffectIndex = fromNode.flatIndex
        }

        if (toNode.type === 'action') {
            to = toNode.id
        } else if (toNode.type === 'effect') {
            to = toNode.actionId
            toEffectId = toNode.id
            toEffectIndex = toNode.flatIndex
        }

        if (!from || !to) {
            return
        }

        const exists = connections.value.some(c =>
            c.from === fromNode.id && c.to === toNode.id &&
            (c.fromEffectId ? c.fromEffectId === fromEffectId : c.fromEffectIndex === fromEffectIndex) &&
            (c.toEffectId ? c.toEffectId === toEffectId : c.toEffectIndex === toEffectIndex)
        )

        if (exists) {
            return
        }

        const newConn = {
            id: `conn_${uid()}`,
            from,
            to,
            fromEffectIndex,
            toEffectIndex,
            fromEffectId,
            toEffectId,
            isConsumption,
            sourcePort: fromPortDir || 'right',
            targetPort: targetPortDir || 'left'
        }

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
        const newName = `方案 ${scenarioList.value.length + 1}`

        const emptySnapshot = {
            tracks: [{ id: null, actions: [] }, { id: null, actions: [] }, { id: null, actions: [] }, { id: null, actions: [] }],
            connections: [],
            characterOverrides: {},
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
        const newName = `${source.name} (副本)`
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

    const timeBlockWidth = computed(() => BASE_BLOCK_WIDTH)

    function getDomNodeIdByNodeId(id, { isTransfer = false } = {}) {
        const node = resolveNode(id)

        let elementId = null
        if (node.type === 'action') {
            elementId = `action-${node.id}`
        } else if (node.type === 'effect') {
            if (isTransfer) {
                elementId = `transfer-${node.actionId}-${node.flatIndex}`
            } else {
                elementId = `anomaly-${node.actionId}-${node.flatIndex}`
            }
        }

        if (!elementId) {
            return null
        }

        return elementId
    }

    const getActionPositionInfo = (instanceId) => {
        for (let i = 0; i < tracks.value.length; i++) {
            const track = tracks.value[i];
            const action = track.actions.find(a => a.instanceId === instanceId);
            if (action) return { trackIndex: i, action };
        }
        return null;
    }

    const findEffectIndexById = (action, effectId) => {
        if (!action || !action.physicalAnomaly || !effectId) return -1
        let current = 0
        for (const row of action.physicalAnomaly) {
            for (const effect of row) {
                if (effect._id === effectId) return current
                current++
            }
        }
        return -1
    }

    const ensureEffectId = (effect) => {
        if (!effect._id) effect._id = uid()
        return effect._id
    }

    const getEffectByIndex = (action, flatIndex) => {
        if (!action || !action.physicalAnomaly) return null
        let current = 0
        for (const row of action.physicalAnomaly) {
            if (flatIndex < current + row.length) {
                return row[flatIndex - current]
            }
            current += row.length
        }
        return null
    }

    const getAnomalyIndexById = (actionId, effectId) => {
        if (!actionId || !effectId) return null
        const track = tracks.value.find(t => t.actions.some(a => a.instanceId === actionId))
        const action = track?.actions.find(a => a.instanceId === actionId)
        if (!action || !action.physicalAnomaly) return null

        for (let r = 0; r < action.physicalAnomaly.length; r++) {
            const row = action.physicalAnomaly[r]
            const c = row.findIndex(e => e._id === effectId)
            if (c !== -1) return { rowIndex: r, colIndex: c }
        }
        return null
    }

    const getIncomingConnections = (targetId) => connections.value.filter(c => c.to === targetId)

    const getCharacterElementColor = (characterId) => {
        const charInfo = characterRoster.value.find(c => c.id === characterId)
        if (!charInfo || !charInfo.element) return ELEMENT_COLORS.default
        return ELEMENT_COLORS[charInfo.element] || ELEMENT_COLORS.default
    }

    const teamTracksInfo = computed(() => tracks.value.map(track => {
        const charInfo = characterRoster.value.find(c => c.id === track.id)
        return { ...track, ...(charInfo || { name: '请选择干员', avatar: '', rarity: 0 }) }
    }))

    const activeSkillLibrary = computed(() => {
        const activeChar = characterRoster.value.find(c => c.id === activeTrackId.value)
        if (!activeChar) return []

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
            } else if (suffix === 'attack') {
                defaults.gaugeGain = activeChar.attack_gaugeGain || 0
            }

            const merged = { duration: rawDuration, cooldown: rawCooldown, ...defaults, ...globalOverride }

            const specificElement = activeChar[`${suffix}_element`]
            const derivedElement = specificElement || activeChar.element || 'physical'

            const finalDamageTicks = globalOverride.damageTicks || rawTicks
            const finalAnomalies = globalOverride.physicalAnomaly || getAnomalies(activeChar[`${suffix}_anomalies`])
            const finalAllowedTypes = getAllowed(activeChar[`${suffix}_allowed_types`])

            return {
                id: globalId, type: type, name: name,
                element: derivedElement,
                ...merged,
                damageTicks: finalDamageTicks,
                allowedTypes: finalAllowedTypes,
                physicalAnomaly: finalAnomalies,
            }
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
                physicalAnomaly: finalAnomalies,
                damageTicks: finalDamageTicks,
                allowedTypes: getAllowed(variant.allowedTypes),
            }
        }

        const standardSkills = [
            createBaseSkill('attack', 'attack', '重击'),
            createBaseSkill('execution', 'execution', '处决'),
            createBaseSkill('skill', 'skill', '战技'),
            createBaseSkill('link', 'link', '连携'),
            createBaseSkill('ultimate', 'ultimate', '终结技')
        ]

        const variantSkills = (activeChar.variants || []).map(v => createVariantSkill(v))

        return [...standardSkills, ...variantSkills]
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

    function setScrollLeft(val) { timelineScrollLeft.value = val }
    function setCursorTime(time) { cursorCurrentTime.value = Math.max(0, time) }
    function setCursorPosition(x, y) { cursorPosition.value = { x, y } }
    function toggleCursorGuide() { showCursorGuide.value = !showCursorGuide.value }
    function toggleBoxSelectMode() { if (!isBoxSelectMode.value) connectionDragState.value.isDragging = false; isBoxSelectMode.value = !isBoxSelectMode.value }
    function toggleSnapStep() { snapStep.value = snapStep.value === 0.5 ? 0.1 : 0.5 }

    function setDraggingSkill(skill) { draggingSkillData.value = skill }
    function setDragOffset(offset) { globalDragOffset.value = offset }

    function selectTrack(trackId) {
        activeTrackId.value = trackId
        selectedLibrarySkillId.value = null
        selectedConnectionId.value = null
        clearSelection()
    }

    function selectLibrarySkill(skillId) {
        selectedActionId.value = null;
        multiSelectedIds.value.clear();
        selectedConnectionId.value = null
        selectedLibrarySkillId.value = (selectedLibrarySkillId.value === skillId) ? null : skillId
    }

    function selectAction(instanceId) {
        selectedLibrarySkillId.value = null
        selectedConnectionId.value = null
        selectedAnomalyId.value = null
        selectedActionId.value = (instanceId === selectedActionId.value) ? null : instanceId
        multiSelectedIds.value.clear()
        if (selectedActionId.value) { multiSelectedIds.value.add(selectedActionId.value) }
    }

    function setSelectedAnomalyId(id) { selectedAnomalyId.value = id }

    function selectAnomaly(instanceId, rowIndex, colIndex) {
        selectedLibrarySkillId.value = null
        selectedConnectionId.value = null
        selectedActionId.value = instanceId
        multiSelectedIds.value.clear()
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
        selectedLibrarySkillId.value = null
        selectedActionId.value = null
        multiSelectedIds.value.clear()
        selectedConnectionId.value = (selectedConnectionId.value === connId) ? null : connId
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
        multiSelectedIds.value.clear()
    }

    function addSkillToTrack(trackId, skill, startTime) {
        const track = tracks.value.find(t => t.id === trackId); if (!track) return
        const clonedAnomalies = skill.physicalAnomaly ? JSON.parse(JSON.stringify(skill.physicalAnomaly)) : [];
        clonedAnomalies.forEach(row => { row.forEach(effect => ensureEffectId(effect)) })
        const newAction = { ...skill, instanceId: `inst_${uid()}`, physicalAnomaly: clonedAnomalies, startTime }
        track.actions.push(newAction);
        track.actions.sort((a, b) => a.startTime - b.startTime)
        commitState()
    }

    function removeCurrentSelection() {
        let actionCount = 0
        let connCount = 0
        const targets = new Set(multiSelectedIds.value)
        if (selectedActionId.value) targets.add(selectedActionId.value)

        if (targets.size > 0) {
            tracks.value.forEach(track => {
                if (!track.actions || track.actions.length === 0) return
                const initialLen = track.actions.length
                track.actions = track.actions.filter(a => !targets.has(a.instanceId))
                if (track.actions.length < initialLen) actionCount += (initialLen - track.actions.length)
            })
            connections.value = connections.value.filter(c => !targets.has(c.from) && !targets.has(c.to))
        }
        if (selectedConnectionId.value) {
            const initialLen = connections.value.length
            connections.value = connections.value.filter(c => c.id !== selectedConnectionId.value)
            if (connections.value.length < initialLen) connCount++
            selectedConnectionId.value = null
        }

        if (actionCount + connCount > 0) {
            clearSelection()
            commitState()
        }
        return { actionCount, connCount, total: actionCount + connCount }
    }

    function pasteSelection(targetStartTime = null) {
        if (!clipboard.value) return
        const { actions, connections: clipConns, baseTime } = clipboard.value
        const idMap = new Map()

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
            if (clonedAction.physicalAnomaly) {
                clonedAction.physicalAnomaly.forEach(row => {
                    row.forEach(eff => eff._id = uid())
                })
            }
            const newStartTime = Math.max(0, item.data.startTime + timeDelta)

            const newAction = { ...clonedAction, instanceId: newId, startTime: newStartTime }
            track.actions.push(newAction)
            track.actions.sort((a, b) => a.startTime - b.startTime)
        })
        clipConns.forEach(conn => {
            const newFrom = idMap.get(conn.from)
            const newTo = idMap.get(conn.to)
            if (newFrom && newTo) {
                connections.value.push({ ...conn, id: `conn_${uid()}`, from: newFrom, to: newTo })
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

    function updateAction(instanceId, newProperties) {
        for (const track of tracks.value) {
            const action = track.actions.find(a => a.instanceId === instanceId);
            if (action) { Object.assign(action, newProperties); commitState(); return; }
        }
    }

    function updateLibrarySkill(skillId, props) {
        if (!characterOverrides.value[skillId]) characterOverrides.value[skillId] = {}
        Object.assign(characterOverrides.value[skillId], props)
        tracks.value.forEach(track => {
            if (!track.actions) return;
            track.actions.forEach(action => { if (action.id === skillId) { Object.assign(action, props) } })
        })
        commitState()
    }

    function changeTrackOperator(trackIndex, oldOperatorId, newOperatorId) {
        const track = tracks.value[trackIndex];
        if (track) {
            if (tracks.value.some((t, i) => i !== trackIndex && t.id === newOperatorId)) { alert('该干员已在另一条轨道上！'); return; }
            const actionIdsToDelete = new Set(track.actions.map(a => a.instanceId));
            if (actionIdsToDelete.size > 0) {
                connections.value = connections.value.filter(conn => !actionIdsToDelete.has(conn.from) && !actionIdsToDelete.has(conn.to));
            }
            track.id = newOperatorId;
            track.actions = [];
            if (activeTrackId.value === oldOperatorId) activeTrackId.value = newOperatorId;
            if (selectedActionId.value && actionIdsToDelete.has(selectedActionId.value)) clearSelection();
            commitState();
        }
    }

    function clearTrack(trackIndex) {
        const track = tracks.value[trackIndex];
        if (!track) return;
        const actionIdsToDelete = new Set(track.actions.map(a => a.instanceId));
        if (actionIdsToDelete.size > 0) {
            connections.value = connections.value.filter(conn => !actionIdsToDelete.has(conn.from) && !actionIdsToDelete.has(conn.to));
        }
        track.id = null;
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
            connections.value = connections.value.filter(conn => conn.fromEffectId !== idToDelete && conn.toEffectId !== idToDelete)
        }
        rows[rowIndex].splice(colIndex, 1);
        if (rows[rowIndex].length === 0) rows.splice(rowIndex, 1);
        commitState();
    }

    function nudgeSelection(delta) {
        const targets = new Set(multiSelectedIds.value)
        if (selectedActionId.value) targets.add(selectedActionId.value)
        if (targets.size === 0) return
        let hasChanged = false
        tracks.value.forEach(track => {
            let trackChanged = false
            track.actions.forEach(action => {
                if (targets.has(action.instanceId)) {
                    if (action.isLocked) return
                    let newTime = Math.round((action.startTime + delta) * 10) / 10
                    if (newTime < 0) newTime = 0
                    if (action.startTime !== newTime) { action.startTime = newTime; trackChanged = true; hasChanged = true }
                }
            })
            if (trackChanged) track.actions.sort((a, b) => a.startTime - b.startTime)
        })
        if (hasChanged) commitState()
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

        const sourceInfo = getActionPositionInfo(sourceId)
        const targetInfo = getActionPositionInfo(targetInstanceId)

        if (!sourceInfo || !targetInfo) return false

        const sourceAction = sourceInfo.action
        if (sourceAction.isLocked) return false
        const targetAction = targetInfo.action

        const tStart = targetAction.startTime
        const tEnd = targetAction.startTime + targetAction.duration

        const sDur = sourceAction.duration
        const sourceTw = Math.abs(Number(sourceAction.triggerWindow || 0))

        let newStartTime = sourceAction.startTime

        switch (alignMode) {
            case 'RL': // [前接]
                newStartTime = tStart - sDur
                break

            case 'LR': // [后接]
                newStartTime = tEnd + sourceTw
                break

            case 'LL': // [左对齐]
                newStartTime = tStart + sourceTw
                break

            case 'RR': // [右对齐]
                newStartTime = tEnd - sDur
                break
        }

        newStartTime = Math.round(newStartTime * 10) / 10

        if (sourceAction.startTime !== newStartTime) {
            sourceAction.startTime = newStartTime
            tracks.value[sourceInfo.trackIndex].actions.sort((a, b) => a.startTime - b.startTime)
            commitState()
            return true
        }
        return false
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
        contextMenu.value = {
            visible: true,
            x: evt.clientX,
            y: evt.clientY,
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
        const info = getActionPositionInfo(instanceId)
        if (info) {
            info.action.isLocked = !info.action.isLocked
            commitState()
        }
    }

    function toggleActionDisable(instanceId) {
        const info = getActionPositionInfo(instanceId)
        if (info) {
            info.action.isDisabled = !info.action.isDisabled
            commitState()
        }
    }

    function setActionColor(instanceId, color) {
        const info = getActionPositionInfo(instanceId)
        if (info) {
            info.action.customColor = color
            commitState()
        }
    }

    // ===================================================================================
    // 监控数据计算 (Monitor Data)
    // ===================================================================================

    function calculateGlobalStaggerData() {
        const {
            maxStagger,
            staggerNodeCount,
            staggerNodeDuration,
            staggerBreakDuration
        } = systemConstants.value;
        const events = []
        tracks.value.forEach(track => {
            if (!track.actions) return
            track.actions.forEach(action => {
                if (action.isDisabled) return
                if (action.stagger > 0) events.push({ time: action.startTime + action.duration, change: action.stagger, type: 'gain' })
                if (action.damageTicks) {
                    action.damageTicks.forEach(tick => {
                        const staggerVal = Number(tick.stagger) || 0
                        if (staggerVal > 0) {
                            const tickTime = action.startTime + (Number(tick.offset) || 0)
                            events.push({ time: tickTime, change: staggerVal, type: 'gain' })
                        }
                    })
                }
                if (action.physicalAnomaly) {
                    action.physicalAnomaly.forEach((row, rowIndex) => {
                        row.forEach(effect => {
                            const triggerTime = action.startTime + (Number(effect.offset) || 0);
                            if (effect.stagger > 0) {
                                events.push({ time: triggerTime, change: effect.stagger, type: 'gain' });
                            }
                        });
                    });
                }
            })
        })
        events.sort((a, b) => a.time - b.time)
        const points = []; const lockSegments = []; const nodeSegments = []; let currentVal = 0; let currentTime = 0; let lockedUntil = -1; const nodeStep = maxStagger / (staggerNodeCount + 1); const hasNodes = staggerNodeCount > 0; points.push({ time: 0, val: 0 });
        const advanceTime = (targetTime) => { if (targetTime > currentTime) { points.push({ time: targetTime, val: currentVal }); currentTime = targetTime; } }
        events.forEach(ev => {
            advanceTime(ev.time)
            if (currentTime >= lockedUntil) {
                const prevVal = currentVal
                currentVal += ev.change
                if (currentVal >= maxStagger) {
                    currentVal = 0
                    const endLock = currentTime + staggerBreakDuration
                    lockedUntil = endLock
                    lockSegments.push({ start: currentTime, end: endLock })
                    points.push({ time: currentTime, val: 0 })
                }
                else if (hasNodes) {
                    const prevNodeIdx = Math.floor(prevVal / nodeStep)
                    const currNodeIdx = Math.floor(currentVal / nodeStep)

                    if (currNodeIdx > prevNodeIdx) {
                        nodeSegments.push({
                            start: currentTime,
                            end: currentTime + staggerNodeDuration,
                            thresholdVal: currNodeIdx * nodeStep
                        })
                    }
                }
            }
            points.push({ time: currentTime, val: currentVal })
        })
        if (currentTime < TOTAL_DURATION) advanceTime(TOTAL_DURATION)
        return { points, lockSegments, nodeSegments, nodeStep }
    }

    function calculateGlobalSpData() {
        const { maxSp, spRegenRate, initialSp, executionRecovery } = systemConstants.value;

        const instantEvents = []
        const pauseWindows = []

        tracks.value.forEach(track => {
            if (!track.actions) return
            track.actions.forEach(action => {
                if (action.isDisabled) return

                if (action.spCost > 0) {
                    instantEvents.push({ time: action.startTime, change: -action.spCost, type: 'cost' })
                }

                if (['skill', 'link'].includes(action.type)) {
                    pauseWindows.push({ start: action.startTime, end: action.startTime + 0.5 })
                }

                if (action.spGain > 0) {
                    instantEvents.push({ time: action.startTime + action.duration, change: action.spGain, type: 'gain' })
                }

                if (action.type === 'execution') {
                    const rec = Number(executionRecovery) || 0
                    if (rec > 0) {
                        instantEvents.push({ time: action.startTime + action.duration, change: rec, type: 'gain' })
                    }
                }

                if (action.damageTicks) {
                    action.damageTicks.forEach(tick => {
                        const spVal = Number(tick.sp) || 0
                        if (spVal > 0) {
                            const tickTime = action.startTime + (Number(tick.offset) || 0)
                            instantEvents.push({ time: tickTime, change: spVal, type: 'gain' })
                        }
                    })
                }
            })
        })

        const criticalTimes = new Set([0, TOTAL_DURATION])
        instantEvents.forEach(e => criticalTimes.add(e.time))
        pauseWindows.forEach(w => { criticalTimes.add(w.start); criticalTimes.add(w.end) })

        const sortedTimes = Array.from(criticalTimes).sort((a, b) => a - b)

        const isPausedInterval = (t1, t2) => {
            const mid = (t1 + t2) / 2
            return pauseWindows.some(w => mid >= w.start && mid < w.end)
        }

        const points = []
        let currentSp = Number(initialSp) || 200
        let prevTime = 0

        for (let i = 0; i < sortedTimes.length; i++) {
            const now = sortedTimes[i]

            const dt = now - prevTime
            if (dt > 0) {
                if (!isPausedInterval(prevTime, now)) {
                    if (currentSp < maxSp) {
                        const needed = maxSp - currentSp
                        const potentialGain = dt * spRegenRate

                        if (potentialGain > needed) {
                            const timeToCap = needed / spRegenRate
                            const capTime = prevTime + timeToCap

                            points.push({ time: capTime, sp: maxSp })

                            currentSp = maxSp
                        } else {
                            currentSp += potentialGain
                        }
                    }
                }
            }

            points.push({ time: now, sp: currentSp })

            const eventsNow = instantEvents.filter(e => Math.abs(e.time - now) < 0.0001)
            if (eventsNow.length > 0) {
                let netChange = 0
                eventsNow.forEach(e => netChange += e.change)

                currentSp += netChange
                points.push({ time: now, sp: currentSp })
            }

            prevTime = now
        }

        return points
    }

    function calculateCdReduction(myStartTime, myRawCooldown, myInstanceId) {
        const startT = Number(myStartTime)
        const rawCd = Number(myRawCooldown)

        if (rawCd <= 0) return 0

        let freezeEvents = []

        tracks.value.forEach(track => {
            if (!track.actions) return
            track.actions.forEach(other => {
                if (other.isDisabled) return

                const isSelf = other.instanceId === myInstanceId
                if (isSelf && other.type !== 'link') return

                let duration = 0
                if (other.type === 'link') {
                    duration = 0.5
                } else if (other.type === 'ultimate') {
                    duration = Number(other.animationTime) || 0.5
                }

                if (duration > 0) {
                    if (other.startTime + duration <= startT) return

                    freezeEvents.push({
                        start: other.startTime,
                        end: other.startTime + duration
                    })
                }
            })
        })

        if (freezeEvents.length === 0) return 0

        freezeEvents.sort((a, b) => a.start - b.start)

        const mergedEvents = []
        if (freezeEvents.length > 0) {
            let currentEvent = freezeEvents[0]
            for (let i = 1; i < freezeEvents.length; i++) {
                const nextEvent = freezeEvents[i]
                if (nextEvent.start < currentEvent.end) {
                    currentEvent.end = Math.max(currentEvent.end, nextEvent.end)
                } else {
                    mergedEvents.push(currentEvent)
                    currentEvent = nextEvent
                }
            }
            mergedEvents.push(currentEvent)
        }

        let visualDuration = rawCd

        for (const freeze of mergedEvents) {
            const validStart = Math.max(startT, freeze.start)
            const validEnd = freeze.end

            if (validEnd <= validStart) continue

            if (validStart >= startT + visualDuration) break

            const freezeLen = validEnd - validStart

            const remaining = (startT + visualDuration) - validStart
            const reduction = Math.min(freezeLen, remaining)

            visualDuration -= reduction
        }

        return rawCd - visualDuration
    }

    function calculateGaugeData(trackId) {
        const track = tracks.value.find(t => t.id === trackId); if (!track) return [];
        const charInfo = characterRoster.value.find(c => c.id === trackId); if (!charInfo) return [];
        const canAcceptTeamGauge = (charInfo.accept_team_gauge !== false);
        const libId = `${trackId}_ultimate`; const override = characterOverrides.value[libId];
        const GAUGE_MAX = (track.maxGaugeOverride && track.maxGaugeOverride > 0) ? track.maxGaugeOverride : ((override && override.gaugeCost) ? override.gaugeCost : (charInfo.ultimate_gaugeMax || 100));
        const blockWindows = []
        if (track.actions) {
            track.actions.forEach(action => {
                if (action.type === 'ultimate') {
                    const start = action.startTime
                    const end = start + Number(action.duration || 0) + Number(action.enhancementTime || 0)
                    if (end > start) {
                        blockWindows.push({ start, end })
                    }
                }
            })
        }
        const isBlocked = (time) => {
            const epsilon = 0.0001
            return blockWindows.some(w => time > w.start + epsilon && time < w.end - epsilon)
        }
        const events = [];
        tracks.value.forEach(sourceTrack => {
            if (!sourceTrack.actions) return;
            sourceTrack.actions.forEach(action => {
                if (action.isDisabled) return
                if (sourceTrack.id === trackId) {
                    if (action.gaugeCost > 0) events.push({ time: action.startTime, change: -action.gaugeCost });
                    if (action.gaugeGain > 0) {
                        const triggerTime = action.startTime + action.duration
                        if (!isBlocked(triggerTime)) {
                            events.push({ time: triggerTime, change: action.gaugeGain });
                        }
                    }
                }
                if (sourceTrack.id !== trackId && action.teamGaugeGain > 0 && canAcceptTeamGauge) {
                    const triggerTime = action.startTime + action.duration
                    if (!isBlocked(triggerTime)) {
                        events.push({ time: triggerTime, change: action.teamGaugeGain });
                    }
                }
            })
        });
        events.sort((a, b) => a.time - b.time);
        const initialGauge = track.initialGauge || 0; let currentGauge = initialGauge > GAUGE_MAX ? GAUGE_MAX : initialGauge;
        const points = []; points.push({ time: 0, val: currentGauge, ratio: currentGauge / GAUGE_MAX });
        events.forEach(ev => {
            points.push({ time: ev.time, val: currentGauge, ratio: currentGauge / GAUGE_MAX });
            currentGauge += ev.change; if (currentGauge > GAUGE_MAX) currentGauge = GAUGE_MAX; if (currentGauge < 0) currentGauge = 0;
            points.push({ time: ev.time, val: currentGauge, ratio: currentGauge / GAUGE_MAX });
        });
        points.push({ time: TOTAL_DURATION, val: currentGauge, ratio: currentGauge / GAUGE_MAX });
        return points;
    }

    // ===================================================================================
    // 持久化与数据加载 (Persistence)
    // ===================================================================================

    const STORAGE_KEY = 'endaxis_autosave'

    function initAutoSave() {
        watch([tracks, connections, characterOverrides, systemConstants, scenarioList, activeScenarioId, activeEnemyId, customEnemyParams],
            ([newTracks, newConns, newOverrides, newSys, newScList, newActiveId, newEnemyId, newCustomParams]) => {

                if (isLoading.value) return

                const listToSave = JSON.parse(JSON.stringify(newScList))
                const currentSc = listToSave.find(s => s.id === newActiveId)

                if (currentSc) {
                    currentSc.data = {
                        tracks: newTracks,
                        connections: newConns,
                        characterOverrides: newOverrides,
                        systemConstants: newSys,
                        activeEnemyId: newEnemyId,
                        customEnemyParams: newCustomParams
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
            }, { deep: true })
    }

    function loadFromBrowser() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const data = JSON.parse(raw);

                if (!data.scenarioList) return false;

                if (data.systemConstants) systemConstants.value = { ...systemConstants.value, ...data.systemConstants };

                scenarioList.value = data.scenarioList
                activeScenarioId.value = data.activeScenarioId || scenarioList.value[0].id

                const currentSc = scenarioList.value.find(s => s.id === activeScenarioId.value)
                if (currentSc && currentSc.data) {
                    _loadSnapshot(currentSc.data)
                } else {
                    tracks.value = [{ id: null, actions: [] }, { id: null, actions: [] }, { id: null, actions: [] }, { id: null, actions: [] }];
                    connections.value = [];
                    characterOverrides.value = {};
                }

                historyStack.value = []; historyIndex.value = -1; commitState();
                return true;
            } catch (e) { console.error("Auto-save load failed:", e) }
        }
        return false;
    }

    function resetProject() {
        localStorage.removeItem(STORAGE_KEY);
        tracks.value = [{ id: null, actions: [] }, { id: null, actions: [] }, { id: null, actions: [] }, { id: null, actions: [] }];
        connections.value = [];
        characterOverrides.value = {};

        systemConstants.value = { ...DEFAULT_SYSTEM_CONSTANTS };

        // 重置方案
        scenarioList.value = [{ id: 'default_sc', name: '方案 1', data: null }];
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

    function getProjectData() {
        const listToExport = JSON.parse(JSON.stringify(scenarioList.value))
        const currentSc = listToExport.find(s => s.id === activeScenarioId.value)
        if (currentSc) {
            currentSc.data = {
                tracks: tracks.value,
                connections: connections.value,
                characterOverrides: characterOverrides.value,
                activeEnemyId: activeEnemyId.value
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

    function exportProject() {
        const projectData = getProjectData();

        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `endaxis_project_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(link.href)
    }

    function exportShareString() {
        const projectData = getProjectData();
        const jsonString = JSON.stringify(projectData);
        return LZString.compressToEncodedURIComponent(jsonString);
    }

    function importShareString(compressedStr) {
        try {
            const jsonString = LZString.decompressFromEncodedURIComponent(compressedStr);
            if (!jsonString) return false;

            const data = JSON.parse(jsonString);
            return loadProjectData(data);
        } catch (e) {
            console.error("Import share string failed:", e);
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
                scenarioList.value = data.scenarioList
                const validId = data.scenarioList.find(s => s.id === data.activeScenarioId) ? data.activeScenarioId : data.scenarioList[0].id
                activeScenarioId.value = validId

                const currentSc = scenarioList.value.find(s => s.id === activeScenarioId.value)
                if (currentSc && currentSc.data) {
                    _loadSnapshot(currentSc.data)
                } else {
                    tracks.value = [{ id: null, actions: [] }, { id: null, actions: [] }, { id: null, actions: [] }, { id: null, actions: [] }];
                    connections.value = [];
                    characterOverrides.value = {};
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
        MAX_SCENARIOS,
        systemConstants, isLoading, characterRoster, iconDatabase, tracks, connections, activeTrackId, timelineScrollLeft, globalDragOffset, draggingSkillData,
        selectedActionId, selectedLibrarySkillId, multiSelectedIds, clipboard, showCursorGuide, isBoxSelectMode, cursorCurrentTime, cursorPosition, snapStep,
        selectedAnomalyId, setSelectedAnomalyId,
        teamTracksInfo, activeSkillLibrary, timeBlockWidth, ELEMENT_COLORS, getActionPositionInfo, getIncomingConnections, getCharacterElementColor, isActionSelected, hoveredActionId, setHoveredAction,
        fetchGameData, exportProject, importProject, exportShareString, importShareString, TOTAL_DURATION, selectTrack, changeTrackOperator, clearTrack, selectLibrarySkill, updateLibrarySkill, selectAction, updateAction,
        addSkillToTrack, setDraggingSkill, setDragOffset, setScrollLeft, calculateGlobalSpData, calculateCdReduction, calculateGaugeData, calculateGlobalStaggerData, updateTrackInitialGauge, updateTrackMaxGauge,
        removeConnection, updateConnection, updateConnectionPort, getColor, toggleCursorGuide, toggleBoxSelectMode, setCursorTime, setCursorPosition, toggleSnapStep, nudgeSelection,
        setMultiSelection, clearSelection, copySelection, pasteSelection, removeCurrentSelection, undo, redo, commitState,
        removeAnomaly, initAutoSave, loadFromBrowser, resetProject, selectedConnectionId, selectConnection, selectAnomaly, getAnomalyIndexById,
        findEffectIndexById, alignActionToTarget, getDomNodeIdByNodeId,
        connectionMap,
        actionMap,
        effectsMap,
        getConnectionById,
        getActionById,
        getEffectById,
        resolveNode,
        getNodesOfConnection,
        connectionDragState,
        connectionSnapState,
        createConnection,
        contextMenu, openContextMenu, closeContextMenu,
        toggleActionLock, toggleActionDisable, setActionColor,
        enemyDatabase, activeEnemyId, applyEnemyPreset, ENEMY_TIERS, enemyCategories,
        scenarioList, activeScenarioId, switchScenario, addScenario, duplicateScenario, deleteScenario,
    }
})