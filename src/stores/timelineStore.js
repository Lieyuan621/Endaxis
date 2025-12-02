import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const uid = () => Math.random().toString(36).substring(2, 9)

export const useTimelineStore = defineStore('timeline', () => {

    // ===================================================================================
    // 1. 系统配置
    // ===================================================================================

    const systemConstants = ref({
        maxSp: 300,
        initialSp: 200,
        spRegenRate: 8,
        skillSpCostDefault: 100,
        maxStagger: 100
    })

    const BASE_BLOCK_WIDTH = 50
    const TOTAL_DURATION = 120

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
    // 2. 核心数据状态
    // ===================================================================================

    const isLoading = ref(true)
    const characterRoster = ref([])
    const iconDatabase = ref({})

    const tracks = ref([
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
    ])
    const connections = ref([])
    const characterOverrides = ref({})

    // ===================================================================================
    // 3. 交互状态
    // ===================================================================================

    const activeTrackId = ref(null)
    const timelineScrollLeft = ref(0)

    const showCursorGuide = ref(false)
    const cursorCurrentTime = ref(0)
    const snapStep = ref(0.5)

    const globalDragOffset = ref(0)
    const draggingSkillData = ref(null)

    // 选中状态
    const selectedConnectionId = ref(null)
    const selectedActionId = ref(null)
    const selectedLibrarySkillId = ref(null)

    // 这里定义为 ref，确保它是可读写的
    const selectedAnomalyId = ref(null)

    const multiSelectedIds = ref(new Set())
    const isBoxSelectMode = ref(false)
    const clipboard = ref(null)

    const isLinking = ref(false)
    const linkingSourceId = ref(null)
    const linkingEffectIndex = ref(null)
    const linkingSourceEffectId = ref(null)

    const isActionSelected = (id) => selectedActionId.value === id || multiSelectedIds.value.has(id)

    // ===================================================================================
    // 4. 历史记录
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
    // 5. 计算属性 & Helper
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

    // 根据 ID 反查坐标 (用于 PropertiesPanel 高亮)
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
        const getRowDelays = (list) => list || []

        const createBaseSkill = (suffix, type, name) => {
            const globalId = `${activeChar.id}_${suffix}`
            const globalOverride = characterOverrides.value[globalId] || {}
            const rawDuration = activeChar[`${suffix}_duration`] || 1
            const rawCooldown = activeChar[`${suffix}_cooldown`] || 0

            let derivedElement = activeChar.element || 'physical';
            if (activeChar[`${suffix}_element`]) derivedElement = activeChar[`${suffix}_element`];
            if (suffix === 'attack' || suffix === 'execution') derivedElement = 'physical';
            if (suffix === 'link') derivedElement = null;

            let defaults = { spCost: 0, spGain: 0, gaugeCost: 0, gaugeGain: 0, stagger: 0, teamGaugeGain: 0 }

            if (suffix === 'attack') {
                defaults.spGain = activeChar.attack_spGain || 0
                defaults.stagger = activeChar.attack_stagger || 0
            } else if (suffix === 'skill') {
                defaults.spCost = activeChar.skill_spCost || systemConstants.value.skillSpCostDefault;
                defaults.spGain = activeChar.skill_spGain || activeChar.skill_spReply || 0;
                defaults.gaugeGain = activeChar.skill_gaugeGain || 0;
                defaults.teamGaugeGain = activeChar.skill_teamGaugeGain || 0;
                defaults.stagger = activeChar.skill_stagger || 0
            } else if (suffix === 'link') {
                defaults.spGain = activeChar.link_spGain || 0
                defaults.gaugeGain = activeChar.link_gaugeGain || 0
                defaults.stagger = activeChar.link_stagger || 0
                defaults.triggerWindow = 0
            } else if (suffix === 'ultimate') {
                defaults.gaugeCost = activeChar.ultimate_gaugeMax || 100
                defaults.spGain = activeChar.ultimate_spGain || activeChar.ultimate_spReply || 0
                defaults.gaugeGain = activeChar.ultimate_gaugeReply || 0
                defaults.stagger = activeChar.ultimate_stagger || 0
            } else if (suffix === 'execution') {
                defaults.spGain = activeChar.execution_spGain || 0;
            }

            const merged = { duration: rawDuration, cooldown: rawCooldown, ...defaults, ...globalOverride }

            return {
                id: globalId, type: type, name: name, element: derivedElement,
                ...merged,
                allowedTypes: getAllowed(activeChar[`${suffix}_allowed_types`]),
                physicalAnomaly: getAnomalies(activeChar[`${suffix}_anomalies`]),
                anomalyRowDelays: getRowDelays(activeChar[`${suffix}_anomaly_delays`])
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

            return {
                ...merged,
                id: globalId,
                physicalAnomaly: getAnomalies(variant.physicalAnomaly),
                allowedTypes: getAllowed(variant.allowedTypes),
                anomalyRowDelays: getRowDelays(variant.anomalyRowDelays)
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
    // 6. 操作 Actions
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
        selectedAnomalyId.value = null // 切动作时清空图标选中

        selectedActionId.value = (instanceId === selectedActionId.value) ? null : instanceId

        multiSelectedIds.value.clear()
        if (selectedActionId.value) { multiSelectedIds.value.add(selectedActionId.value) }
    }

    // 选中图标 (记录 ID)
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

    function pasteSelection() {
        if (!clipboard.value) return
        const { actions, connections: clipConns, baseTime } = clipboard.value
        const idMap = new Map()
        let timeDelta = (cursorCurrentTime.value >= 0) ? (cursorCurrentTime.value - baseTime) : 2.0

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
            const newAction = { ...clonedAction, instanceId: newId, startTime: Math.max(0, item.data.startTime + timeDelta) }
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

    function calculateGlobalStaggerData() {
        const { maxStagger } = systemConstants.value;
        const events = []
        tracks.value.forEach(track => {
            if (!track.actions) return
            track.actions.forEach(action => {
                if (action.stagger > 0) events.push({ time: action.startTime + action.duration, change: action.stagger, type: 'gain' })
                if (action.physicalAnomaly) {
                    const rowDelays = action.anomalyRowDelays || [];
                    action.physicalAnomaly.forEach((row, rowIndex) => {
                        let currentTimeOffset = rowDelays[rowIndex] || 0;
                        row.forEach(effect => {
                            if (effect.stagger > 0) events.push({ time: action.startTime + currentTimeOffset, change: effect.stagger, type: 'gain' });
                            currentTimeOffset += (effect.duration || 0);
                        });
                    });
                }
            })
        })
        events.sort((a, b) => a.time - b.time)
        const points = []; const lockSegments = []; let currentVal = 0; let currentTime = 0; let lockedUntil = -1; points.push({ time: 0, val: 0 });
        const advanceTime = (targetTime) => { if (targetTime > currentTime) { points.push({ time: targetTime, val: currentVal }); currentTime = targetTime; } }
        events.forEach(ev => {
            advanceTime(ev.time);
            if (currentTime >= lockedUntil) {
                currentVal += ev.change;
                if (currentVal >= maxStagger) { currentVal = 0; const endLock = currentTime + 10; lockedUntil = endLock; lockSegments.push({ start: currentTime, end: endLock }); points.push({ time: currentTime, val: 0 }); }
            }
            points.push({ time: currentTime, val: currentVal })
        });
        if (currentTime < TOTAL_DURATION) advanceTime(TOTAL_DURATION);
        return { points, lockSegments }
    }

    function calculateGlobalSpData() {
        const { maxSp, spRegenRate, initialSp } = systemConstants.value;
        const events = []
        tracks.value.forEach(track => {
            if (!track.actions) return
            track.actions.forEach(action => {
                if (action.spCost > 0) events.push({ time: action.startTime, valChange: -action.spCost, type: 'cost' })
                if (action.type === 'skill') { events.push({ time: action.startTime, lockChange: 1, type: 'lock_start' }); events.push({ time: action.startTime + 0.5, lockChange: -1, type: 'lock_end' }) }
                if (action.spGain > 0) events.push({ time: action.startTime + action.duration, valChange: action.spGain, type: 'gain' })
                if (action.physicalAnomaly) {
                    const rowDelays = action.anomalyRowDelays || [];
                    action.physicalAnomaly.forEach((row, rowIndex) => {
                        let currentTimeOffset = rowDelays[rowIndex] || 0;
                        row.forEach(effect => {
                            if (effect.sp > 0) events.push({ time: action.startTime + currentTimeOffset, valChange: effect.sp, type: 'gain' });
                            currentTimeOffset += (effect.duration || 0);
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
        const events = [];
        tracks.value.forEach(sourceTrack => {
            if (!sourceTrack.actions) return;
            sourceTrack.actions.forEach(action => {
                if (sourceTrack.id === trackId) { if (action.gaugeCost > 0) events.push({ time: action.startTime, change: -action.gaugeCost }); if (action.gaugeGain > 0) events.push({ time: action.startTime + action.duration, change: action.gaugeGain }); }
                if (sourceTrack.id !== trackId && action.teamGaugeGain > 0 && canAcceptTeamGauge) events.push({ time: action.startTime + action.duration, change: action.teamGaugeGain });
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

    const STORAGE_KEY = 'endaxis_autosave_v2'
    function initAutoSave() {
        watch([tracks, connections, characterOverrides, systemConstants], ([newTracks, newConns, newOverrides, newSys]) => {
            if (isLoading.value) return
            const snapshot = { version: '2.0.0', timestamp: Date.now(), tracks: newTracks, connections: newConns, characterOverrides: newOverrides, systemConstants: newSys }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
        }, { deep: true })
    }
    function loadFromBrowser() {
        const raw = localStorage.getItem(STORAGE_KEY); if (raw) { try { const data = JSON.parse(raw); if (data.tracks) { tracks.value = data.tracks; connections.value = data.connections || []; characterOverrides.value = data.characterOverrides || {}; if (data.systemConstants) systemConstants.value = { ...systemConstants.value, ...data.systemConstants }; historyStack.value = []; historyIndex.value = -1; commitState(); return true; } } catch (e) { console.error("Auto-save load failed:", e) } } return false;
    }
    function resetProject() { localStorage.removeItem(STORAGE_KEY); tracks.value = [{ id: null, actions: [] }, { id: null, actions: [] }, { id: null, actions: [] }, { id: null, actions: [] }]; connections.value = []; characterOverrides.value = {}; clearSelection(); historyStack.value = []; historyIndex.value = -1; commitState(); }
    async function fetchGameData() {
        try {
            isLoading.value = true; const response = await fetch(import.meta.env.BASE_URL + 'gamedata.json'); if (!response.ok) throw new Error('Failed'); const data = await response.json();
            if (data.SYSTEM_CONSTANTS) { systemConstants.value.maxSp = data.SYSTEM_CONSTANTS.MAX_SP || 300; systemConstants.value.spRegenRate = data.SYSTEM_CONSTANTS.SP_REGEN_PER_SEC || 8; systemConstants.value.skillSpCostDefault = data.SYSTEM_CONSTANTS.SKILL_SP_COST_DEFAULT || 100; }
            characterRoster.value = data.characterRoster.sort((a, b) => (b.rarity || 0) - (a.rarity || 0)); iconDatabase.value = data.ICON_DATABASE; historyStack.value = []; historyIndex.value = -1; commitState();
        } catch (error) { console.error("Load failed:", error) } finally { isLoading.value = false }
    }
    function exportProject() { const projectData = { version: '2.0.0', timestamp: Date.now(), tracks: tracks.value, connections: connections.value, characterOverrides: characterOverrides.value }; const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `endaxis_project_${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href) }
    async function importProject(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (e) => { try { const data = JSON.parse(e.target.result); if (!data.tracks) throw new Error("Invalid"); tracks.value = data.tracks; connections.value = data.connections || []; characterOverrides.value = data.characterOverrides || {}; clearSelection(); historyStack.value = []; historyIndex.value = -1; commitState(); resolve(true) } catch (err) { reject(err) } }; reader.readAsText(file) }) }

    function addAnomalyRow(char, skillType) {
        const isInstance = !!char.instanceId; const anomalyKey = isInstance ? 'physicalAnomaly' : `${skillType}_anomalies`; const allowedKey = isInstance ? 'allowedTypes' : `${skillType}_allowed_types`;
        if (!char[anomalyKey] || (char[anomalyKey].length > 0 && !Array.isArray(char[anomalyKey][0]))) { char[anomalyKey] = char[anomalyKey] || []; if (!Array.isArray(char[anomalyKey][0])) char[anomalyKey] = [char[anomalyKey]]; }
        const allowedList = char[allowedKey] || []; const defaultType = allowedList.length > 0 ? allowedList[0] : 'default';
        char[anomalyKey].push([{ _id: uid(), type: defaultType, stacks: 1, duration: 0, sp: 0, stagger: 0 }]);
        if (isInstance) commitState();
    }
    function addAnomalyToRow(char, skillType, rowIndex) {
        const isInstance = !!char.instanceId; const anomalyKey = isInstance ? 'physicalAnomaly' : `${skillType}_anomalies`; const allowedKey = isInstance ? 'allowedTypes' : `${skillType}_allowed_types`;
        const rows = char[anomalyKey] || []; const allowedList = char[allowedKey] || []; const defaultType = allowedList.length > 0 ? allowedList[0] : 'default';
        if (rows[rowIndex]) rows[rowIndex].push({ _id: uid(), type: defaultType, stacks: 1, duration: 0, sp: 0, stagger: 0 });
        if (isInstance) commitState();
    }

    return {
        systemConstants, isLoading, characterRoster, iconDatabase, tracks, connections, activeTrackId, timelineScrollLeft, globalDragOffset, draggingSkillData,
        selectedActionId, selectedLibrarySkillId, multiSelectedIds, clipboard, isLinking, linkingSourceId, linkingEffectIndex, linkingSourceEffectId, showCursorGuide, isBoxSelectMode, cursorCurrentTime, snapStep,
        selectedAnomalyId,
        teamTracksInfo, activeSkillLibrary, timeBlockWidth, ELEMENT_COLORS, getActionPositionInfo, getIncomingConnections, getCharacterElementColor, isActionSelected,
        fetchGameData, exportProject, importProject, TOTAL_DURATION, selectTrack, changeTrackOperator, clearTrack, selectLibrarySkill, updateLibrarySkill, selectAction, updateAction, removeAction,
        addSkillToTrack, setDraggingSkill, setDragOffset, setScrollLeft, calculateGlobalSpData, calculateGaugeData, calculateGlobalStaggerData, updateTrackInitialGauge, updateTrackMaxGauge,
        startLinking, confirmLinking, cancelLinking, removeConnection, updateConnection, getColor, toggleCursorGuide, toggleBoxSelectMode, setCursorTime, toggleSnapStep, nudgeSelection,
        setMultiSelection, clearSelection, copySelection, pasteSelection, removeCurrentSelection, undo, redo, commitState,
        removeAnomaly, initAutoSave, loadFromBrowser, resetProject, selectedConnectionId, selectConnection, selectAnomaly, getAnomalyIndexById,
        findEffectIndexById, addAnomalyRow, addAnomalyToRow
    }
})