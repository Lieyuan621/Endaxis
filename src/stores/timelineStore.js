import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const uid = () => Math.random().toString(36).substring(2, 9)

export const useTimelineStore = defineStore('timeline', () => {

    // ===================================================================================
    // 系统配置与常量
    // ===================================================================================

    const systemConstants = ref({
        maxSp: 300,
        initialSp: 200,
        spRegenRate: 8,
        skillSpCostDefault: 100,
        maxStagger: 100,
        staggerNodeCount: 0,
        staggerNodeDuration: 2,
        staggerBreakDuration: 10
    })

    const BASE_BLOCK_WIDTH = 50
    const TOTAL_DURATION = 120
    const MAX_SCENARIOS = 114514

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

    // ===================================================================================
    // 核心数据状态
    // ===================================================================================

    const isLoading = ref(true)
    const characterRoster = ref([])
    const iconDatabase = ref({})

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

    // ===================================================================================
    // 交互状态
    // ===================================================================================

    const activeTrackId = ref(null)
    const timelineScrollLeft = ref(0)

    const showCursorGuide = ref(false)
    const cursorCurrentTime = ref(0)
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

    const isLinking = ref(false)
    const linkingSourceId = ref(null)
    const linkingEffectIndex = ref(null)
    const linkingSourceEffectId = ref(null)
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
            systemConstants: systemConstants.value
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
        clearSelection()
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
            systemConstants: {
                maxSp: 300,
                initialSp: 200,
                spRegenRate: 8,
                skillSpCostDefault: 100,
                staggerNodeCount: 0,
                staggerNodeDuration: 2,
                staggerBreakDuration: 10
            }
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

            let defaults = { spCost: 0, gaugeCost: 0, gaugeGain: 0, teamGaugeGain: 0, enhancementTime: 0 }

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

    // ===================================================================================
    // 实体操作 (CRUD)
    // ===================================================================================

    function setScrollLeft(val) { timelineScrollLeft.value = val }
    function setCursorTime(time) { cursorCurrentTime.value = Math.max(0, time) }
    function toggleCursorGuide() { showCursorGuide.value = !showCursorGuide.value }
    function toggleBoxSelectMode() { if (!isBoxSelectMode.value) isLinking.value = false; isBoxSelectMode.value = !isBoxSelectMode.value }
    function toggleSnapStep() { snapStep.value = snapStep.value === 0.5 ? 0.1 : 0.5 }

    function setDraggingSkill(skill) { draggingSkillData.value = skill }
    function setDragOffset(offset) { globalDragOffset.value = offset }

    function selectTrack(trackId) {
        activeTrackId.value = trackId
        selectedLibrarySkillId.value = null
        selectedConnectionId.value = null
        cancelLinking()
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

    function removeAction(instanceId) {
        if (!instanceId) return
        let deleted = false
        for (const track of tracks.value) {
            const index = track.actions.findIndex(a => a.instanceId === instanceId);
            if (index !== -1) { track.actions.splice(index, 1); deleted = true; break; }
        }
        if (deleted) {
            connections.value = connections.value.filter(c => c.from !== instanceId && c.to !== instanceId)
            if (selectedActionId.value === instanceId) selectedActionId.value = null
            multiSelectedIds.value.delete(instanceId)
            commitState()
        }
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

    function startLinking(effectIndex = null) {
        if (!selectedActionId.value) return;
        if (isLinking.value && linkingSourceId.value === selectedActionId.value && linkingEffectIndex.value === effectIndex) { cancelLinking(); return; }

        isLinking.value = true;
        linkingSourceId.value = selectedActionId.value;
        linkingEffectIndex.value = effectIndex;
        linkingSourceEffectId.value = null
        if (effectIndex !== null) {
            const track = tracks.value.find(t => t.actions.some(a => a.instanceId === selectedActionId.value))
            const action = track?.actions.find(a => a.instanceId === selectedActionId.value)
            if (action) {
                const eff = getEffectByIndex(action, effectIndex)
                if (eff) linkingSourceEffectId.value = ensureEffectId(eff)
            }
        }
    }

    function confirmLinking(targetId, targetEffectIndex = null) {
        if (!isLinking.value || !linkingSourceId.value) return cancelLinking();
        if (linkingSourceId.value === targetId) {
            const isSourceEffect = linkingEffectIndex.value !== null;
            const isTargetEffect = targetEffectIndex !== null;
            if (!isSourceEffect || !isTargetEffect) { cancelLinking(); return; }
            if (linkingEffectIndex.value === targetEffectIndex) { cancelLinking(); return; }
        }

        let toEffectId = null
        if (targetEffectIndex !== null) {
            const targetTrack = tracks.value.find(t => t.actions.some(a => a.instanceId === targetId))
            const targetAction = targetTrack?.actions.find(a => a.instanceId === targetId)
            if (targetAction) {
                const eff = getEffectByIndex(targetAction, targetEffectIndex)
                if (eff) toEffectId = ensureEffectId(eff)
            }
        }

        const exists = connections.value.some(c =>
            c.from === linkingSourceId.value && c.to === targetId &&
            (c.fromEffectId ? c.fromEffectId === linkingSourceEffectId.value : c.fromEffectIndex === linkingEffectIndex.value) &&
            (c.toEffectId ? c.toEffectId === toEffectId : c.toEffectIndex === targetEffectIndex)
        )

        if (!exists) {
            connections.value.push({
                id: `conn_${uid()}`,
                from: linkingSourceId.value,
                to: targetId,
                fromEffectIndex: linkingEffectIndex.value,
                toEffectIndex: targetEffectIndex,
                fromEffectId: linkingSourceEffectId.value,
                toEffectId: toEffectId,
                isConsumption: false
            })
            commitState()
        }
        cancelLinking()
    }

    function cancelLinking() {
        isLinking.value = false;
        linkingSourceId.value = null;
        linkingEffectIndex.value = null;
        linkingSourceEffectId.value = null
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
        const { maxSp, spRegenRate, initialSp } = systemConstants.value;
        const events = []
        tracks.value.forEach(track => {
            if (!track.actions) return
            track.actions.forEach(action => {
                if (action.isDisabled) return
                if (action.spCost > 0) events.push({ time: action.startTime, valChange: -action.spCost, type: 'cost' })
                if (['skill'].includes(action.type)) {
                    const lockTime = 0.5;
                    events.push({ time: action.startTime, lockChange: 1, type: 'lock_start' });
                    events.push({ time: action.startTime + lockTime, lockChange: -1, type: 'lock_end' })
                }
                if (action.spGain > 0) events.push({ time: action.startTime + action.duration, valChange: action.spGain, type: 'gain' })
                if (action.damageTicks) {
                    action.damageTicks.forEach(tick => {
                        const spVal = Number(tick.sp) || 0
                        if (spVal > 0) {
                            const tickTime = action.startTime + (Number(tick.offset) || 0)
                            events.push({ time: tickTime, valChange: spVal, type: 'gain' })
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
        const points = []; let currentSp = Number(initialSp) || 200; let currentTime = 0; let regenLockCount = 0; points.push({ time: 0, sp: currentSp });
        const advanceTime = (targetTime) => {
            const timeDiff = targetTime - currentTime; if (timeDiff <= 0) return;
            const effectiveRegenRate = regenLockCount > 0 ? 0 : spRegenRate;
            if (currentSp >= maxSp && effectiveRegenRate > 0) { currentTime = targetTime; points.push({ time: currentTime, sp: maxSp }); return; }
            const potentialGain = timeDiff * effectiveRegenRate; const projectedSp = currentSp + potentialGain;
            if (projectedSp >= maxSp) { const timeToMax = (maxSp - currentSp) / effectiveRegenRate; points.push({ time: currentTime + timeToMax, sp: maxSp }); currentSp = maxSp; currentTime = targetTime; points.push({ time: currentTime, sp: maxSp }); }
            else { currentSp = projectedSp; currentTime = targetTime; points.push({ time: currentTime, sp: currentSp }); }
        }
        events.forEach(ev => {
            advanceTime(ev.time);
            if (ev.valChange) { currentSp += ev.valChange; if (currentSp > maxSp) currentSp = maxSp; }
            if (ev.lockChange) regenLockCount += ev.lockChange;
            points.push({ time: currentTime, sp: currentSp, type: ev.type })
        });
        if (currentTime < TOTAL_DURATION) advanceTime(TOTAL_DURATION);
        return points
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
        watch([tracks, connections, characterOverrides, systemConstants, scenarioList, activeScenarioId],
            ([newTracks, newConns, newOverrides, newSys, newScList, newActiveId]) => {
                if (isLoading.value) return

                const listToSave = JSON.parse(JSON.stringify(newScList))
                const currentSc = listToSave.find(s => s.id === newActiveId)
                if (currentSc) {
                    currentSc.data = {
                        tracks: newTracks,
                        connections: newConns,
                        characterOverrides: newOverrides
                    }
                }

                const snapshot = {
                    version: '1.0.0',
                    timestamp: Date.now(),
                    scenarioList: listToSave,
                    activeScenarioId: newActiveId,
                    systemConstants: newSys
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
            isLoading.value = true; const response = await fetch(import.meta.env.BASE_URL + 'gamedata.json'); if (!response.ok) throw new Error('Failed'); const data = await response.json();
            characterRoster.value = data.characterRoster.sort((a, b) => (b.rarity || 0) - (a.rarity || 0)); iconDatabase.value = data.ICON_DATABASE; historyStack.value = []; historyIndex.value = -1; commitState();
        } catch (error) { console.error("Load failed:", error) } finally { isLoading.value = false }
    }

    function exportProject() {
        const listToExport = JSON.parse(JSON.stringify(scenarioList.value))
        const currentSc = listToExport.find(s => s.id === activeScenarioId.value)
        if (currentSc) {
            currentSc.data = {
                tracks: tracks.value,
                connections: connections.value,
                characterOverrides: characterOverrides.value
            }
        }

        const projectData = {
            timestamp: Date.now(),
            version: '1.0.0',
            scenarioList: listToExport,
            activeScenarioId: activeScenarioId.value,
            systemConstants: systemConstants.value
        };

        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `endaxis_project_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(link.href)
    }

    async function importProject(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (data.systemConstants) { systemConstants.value = { ...systemConstants.value, ...data.systemConstants }; }

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
                    resolve(true)
                } catch (err) { reject(err) }
            };
            reader.readAsText(file)
        })
    }

    return {
        MAX_SCENARIOS,
        systemConstants, isLoading, characterRoster, iconDatabase, tracks, connections, activeTrackId, timelineScrollLeft, globalDragOffset, draggingSkillData,
        selectedActionId, selectedLibrarySkillId, multiSelectedIds, clipboard, isLinking, linkingSourceId, linkingEffectIndex, linkingSourceEffectId, showCursorGuide, isBoxSelectMode, cursorCurrentTime, snapStep,
        selectedAnomalyId, setSelectedAnomalyId,
        teamTracksInfo, activeSkillLibrary, timeBlockWidth, ELEMENT_COLORS, getActionPositionInfo, getIncomingConnections, getCharacterElementColor, isActionSelected, hoveredActionId, setHoveredAction,
        fetchGameData, exportProject, importProject, TOTAL_DURATION, selectTrack, changeTrackOperator, clearTrack, selectLibrarySkill, updateLibrarySkill, selectAction, updateAction, removeAction,
        addSkillToTrack, setDraggingSkill, setDragOffset, setScrollLeft, calculateGlobalSpData, calculateGaugeData, calculateGlobalStaggerData, updateTrackInitialGauge, updateTrackMaxGauge,
        startLinking, confirmLinking, cancelLinking, removeConnection, updateConnection, getColor, toggleCursorGuide, toggleBoxSelectMode, setCursorTime, toggleSnapStep, nudgeSelection,
        setMultiSelection, clearSelection, copySelection, pasteSelection, removeCurrentSelection, undo, redo, commitState,
        removeAnomaly, initAutoSave, loadFromBrowser, resetProject, selectedConnectionId, selectConnection, selectAnomaly, getAnomalyIndexById,
        findEffectIndexById, alignActionToTarget,
        contextMenu, openContextMenu, closeContextMenu,
        toggleActionLock, toggleActionDisable, setActionColor,
        scenarioList, activeScenarioId, switchScenario, addScenario, duplicateScenario, deleteScenario,
    }
})