import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 工具：生成简易 UUID
const uid = () => Math.random().toString(36).substring(2, 9)

export const useTimelineStore = defineStore('timeline', () => {

    // ===================================================================================
    // 1. 系统常量与配置 (Constants & Config)
    // ===================================================================================

    const systemConstants = ref({
        maxSp: 300,
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
        'break': '#ffffff', 'armor_break': '#f0f0f0', 'stagger': '#e6e6e6',
        'knockdown': '#d9d9d9', 'knockup': '#ffffff',
    }

    const getColor = (key) => ELEMENT_COLORS[key] || ELEMENT_COLORS.default

    // ===================================================================================
    // 2. 核心数据状态 (Core State)
    // ===================================================================================

    const isLoading = ref(true)
    const characterRoster = ref([])
    const iconDatabase = ref({})

    // 核心轨道数据
    const tracks = ref([
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
    ])

    // 连线数据
    const connections = ref([])

    // 属性覆盖 (用于在排轴时临时修改技能属性，不影响全局gamedata)
    const characterOverrides = ref({})

    // ===================================================================================
    // 3. 交互与视图状态 (Interaction & View State)
    // ===================================================================================

    const activeTrackId = ref(null)
    const timelineScrollLeft = ref(0)
    const zoomLevel = ref(1.0)
    const globalDragOffset = ref(0)
    const draggingSkillData = ref(null)

    // 选中状态
    const selectedActionId = ref(null)
    const selectedLibrarySkillId = ref(null)
    const multiSelectedIds = ref(new Set()) // 多选集合

    // 剪贴板
    const clipboard = ref(null)

    // 辅助功能开关
    const showCursorGuide = ref(true)
    const isBoxSelectMode = ref(false)
    const cursorCurrentTime = ref(0) // 鼠标当前所在时间点

    // 连线模式状态
    const isLinking = ref(false)
    const linkingSourceId = ref(null)
    const linkingEffectIndex = ref(null)

    // ===================================================================================
    // 4. 历史记录系统 (Undo / Redo System)
    // ===================================================================================

    const historyStack = ref([])
    const historyIndex = ref(-1)
    const MAX_HISTORY = 50

    function commitState() {
        // 1. 裁剪掉指针之后的“未来”记录
        if (historyIndex.value < historyStack.value.length - 1) {
            historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
        }

        // 2. 创建快照 (深拷贝核心数据)
        const snapshot = JSON.stringify({
            tracks: tracks.value,
            connections: connections.value,
            characterOverrides: characterOverrides.value
        })

        // 3. 入栈
        historyStack.value.push(snapshot)

        // 4. 维护最大长度
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
        clearSelection() // 恢复后清空选中，防止 ID 错乱
    }

    // ===================================================================================
    // 5. 计算属性 (Getters)
    // ===================================================================================

    const timeBlockWidth = computed(() => BASE_BLOCK_WIDTH * zoomLevel.value)

    const isActionSelected = (id) => selectedActionId.value === id || multiSelectedIds.value.has(id)

    const getActionPositionInfo = (instanceId) => {
        for (let i = 0; i < tracks.value.length; i++) {
            const track = tracks.value[i];
            const action = track.actions.find(a => a.instanceId === instanceId);
            if (action) return { trackIndex: i, action };
        }
        return null;
    }

    const getIncomingConnections = (targetId) => connections.value.filter(c => c.to === targetId)

    const getCharacterElementColor = (characterId) => {
        const charInfo = characterRoster.value.find(c => c.id === characterId)
        if (!charInfo || !charInfo.element) return ELEMENT_COLORS.default
        return ELEMENT_COLORS[charInfo.element] || ELEMENT_COLORS.default
    }

    const teamTracksInfo = computed(() => tracks.value.map(track => {
        const charInfo = characterRoster.value.find(c => c.id === track.id)
        return { ...track, ...(charInfo || { name: '未知', avatar: '', rarity: 0 }) }
    }))

    // 动态生成技能库
    const activeSkillLibrary = computed(() => {
        const activeChar = characterRoster.value.find(c => c.id === activeTrackId.value)
        if (!activeChar) return []

        const getAnomalies = (list) => list || []
        const getAllowed = (list) => list || []

        const createBaseSkill = (suffix, type, name) => {
            const globalId = `${activeChar.id}_${suffix}`
            const globalOverride = characterOverrides.value[globalId] || {}

            // 基础属性读取
            const rawDuration = activeChar[`${suffix}_duration`] || 1
            const rawCooldown = activeChar[`${suffix}_cooldown`] || 0

            // 元素属性推导
            let derivedElement = activeChar.element || 'physical';
            if (activeChar[`${suffix}_element`]) derivedElement = activeChar[`${suffix}_element`];
            if (suffix === 'attack' || suffix === 'execution') derivedElement = 'physical';
            if (suffix === 'link') derivedElement = null;

            // 默认值填充
            let defaults = { spCost: 0, spGain: 0, gaugeCost: 0, gaugeGain: 0 , stagger: 0, teamGaugeGain: 0 }

            if (suffix === 'attack') {
                defaults.spGain = activeChar.attack_spGain || 0;
                defaults.stagger = activeChar.attack_stagger || 0
            } else if (suffix === 'skill') {
                defaults.spCost = activeChar.skill_spCost || systemConstants.value.skillSpCostDefault;
                defaults.spGain = activeChar.skill_spGain || activeChar.skill_spReply || 0;
                defaults.gaugeGain = activeChar.skill_gaugeGain || 0;
                defaults.teamGaugeGain = activeChar.skill_teamGaugeGain || 0;
                defaults.stagger = activeChar.skill_stagger || 0
            } else if (suffix === 'link') {
                defaults.spGain = activeChar.link_spGain || 0;
                defaults.gaugeGain = activeChar.link_gaugeGain || 0;
                defaults.stagger = activeChar.link_stagger || 0
            } else if (suffix === 'ultimate') {
                defaults.gaugeCost = activeChar.ultimate_gaugeMax || 100;
                defaults.spGain = activeChar.ultimate_spGain || activeChar.ultimate_spReply || 0;
                defaults.gaugeGain = activeChar.ultimate_gaugeReply || 0;
                defaults.stagger = activeChar.ultimate_stagger || 0
            } else if (suffix === 'execution') {
                defaults.spGain = activeChar.execution_spGain || 0;
            }

            const merged = { duration: rawDuration, cooldown: rawCooldown, ...defaults, ...globalOverride }

            return {
                id: globalId, type: type, name: name, element: derivedElement,
                ...merged,
                allowedTypes: getAllowed(activeChar[`${suffix}_allowed_types`]),
                physicalAnomaly: getAnomalies(activeChar[`${suffix}_anomalies`])
            }
        }

        return [
            createBaseSkill('attack', 'attack', '重击'),
            createBaseSkill('execution', 'execution', '处决'),
            createBaseSkill('skill', 'skill', '战技'),
            createBaseSkill('link', 'link', '连携'),
            createBaseSkill('ultimate', 'ultimate', '终结技')
        ]
    })

    // ===================================================================================
    // 6. 基础操作 Action (Basic Actions)
    // ===================================================================================

    // 视图操作
    function setZoom(val) { if (val < 0.2) val = 0.2; if (val > 3.0) val = 3.0; zoomLevel.value = val }
    function setScrollLeft(val) { timelineScrollLeft.value = val }
    function setCursorTime(time) { cursorCurrentTime.value = Math.max(0, time) }
    function toggleCursorGuide() { showCursorGuide.value = !showCursorGuide.value }
    function toggleBoxSelectMode() {
        if (!isBoxSelectMode.value) isLinking.value = false
        isBoxSelectMode.value = !isBoxSelectMode.value
    }

    // 拖拽辅助
    function setDraggingSkill(skill) { draggingSkillData.value = skill }
    function setDragOffset(offset) { globalDragOffset.value = offset }

    // 选中操作
    function selectTrack(trackId) {
        activeTrackId.value = trackId
        selectedLibrarySkillId.value = null
        cancelLinking()
        clearSelection()
    }

    function selectLibrarySkill(skillId) {
        selectedActionId.value = null;
        selectedLibrarySkillId.value = (selectedLibrarySkillId.value === skillId) ? null : skillId
    }

    function selectAction(instanceId) {
        selectedLibrarySkillId.value = null
        selectedActionId.value = (instanceId === selectedActionId.value) ? null : instanceId
        multiSelectedIds.value.clear()
        if (selectedActionId.value) { multiSelectedIds.value.add(selectedActionId.value) }
    }

    function setMultiSelection(idsArray) {
        multiSelectedIds.value = new Set(idsArray)
        if (idsArray.length === 1) { selectedActionId.value = idsArray[0] }
        else { selectedActionId.value = null }
    }

    function clearSelection() {
        selectedActionId.value = null
        multiSelectedIds.value.clear()
    }

    // ===================================================================================
    // 7. 数据修改 Action (需 Undo 支持)
    // ===================================================================================
    // *以下所有修改数据的操作，都通过 commitState() 记录历史

    // 添加动作
    function addSkillToTrack(trackId, skill, startTime) {
        const track = tracks.value.find(t => t.id === trackId); if (!track) return

        const clonedAnomalies = skill.physicalAnomaly ? JSON.parse(JSON.stringify(skill.physicalAnomaly)) : [];
        const newAction = { ...skill, instanceId: `inst_${uid()}`, physicalAnomaly: clonedAnomalies, startTime }

        track.actions.push(newAction);
        track.actions.sort((a, b) => a.startTime - b.startTime)
        commitState()
    }

    // 移除单个动作
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

    // 批量移除动作
    function removeCurrentSelection() {
        const targets = new Set(multiSelectedIds.value)
        if (selectedActionId.value) targets.add(selectedActionId.value)
        if (targets.size === 0) return 0

        tracks.value.forEach(track => {
            if (!track.actions || track.actions.length === 0) return
            track.actions = track.actions.filter(a => !targets.has(a.instanceId))
        })

        connections.value = connections.value.filter(c => !targets.has(c.from) && !targets.has(c.to))
        clearSelection()

        commitState()
        return targets.size
    }

    // 粘贴 (智能粘贴)
    function pasteSelection() {
        if (!clipboard.value) return

        const { actions, connections: clipConns, baseTime } = clipboard.value
        const idMap = new Map()

        // 计算时间偏移：优先使用鼠标位置，否则默认+2s
        let timeDelta = (cursorCurrentTime.value >= 0) ? (cursorCurrentTime.value - baseTime) : 2.0

        actions.forEach(item => {
            const track = tracks.value[item.trackIndex]
            if (!track) return
            const newId = `inst_${uid()}`
            idMap.set(item.data.instanceId, newId)
            const newAction = { ...item.data, instanceId: newId, startTime: Math.max(0, item.data.startTime + timeDelta) }
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

    // 连线确认
    function confirmLinking(targetId, targetEffectIndex = null) {
        if (!isLinking.value || !linkingSourceId.value) return cancelLinking();
        if (linkingSourceId.value === targetId) { cancelLinking(); return; }

        const exists = connections.value.some(c => c.from === linkingSourceId.value && c.to === targetId && c.fromEffectIndex === linkingEffectIndex.value && c.toEffectIndex === targetEffectIndex)
        if (!exists) {
            connections.value.push({ id: `conn_${uid()}`, from: linkingSourceId.value, to: targetId, fromEffectIndex: linkingEffectIndex.value, toEffectIndex: targetEffectIndex })
            commitState()
        }
        cancelLinking()
    }

    function removeConnection(connId) {
        connections.value = connections.value.filter(c => c.id !== connId)
        commitState()
    }

    // 属性修改
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

    // 轨道设置
    function changeTrackOperator(trackIndex, oldOperatorId, newOperatorId) {
        const track = tracks.value[trackIndex];
        if (track) {
            if (tracks.value.some((t, i) => i !== trackIndex && t.id === newOperatorId)) { alert('该干员已在另一条轨道上！'); return; }
            track.id = newOperatorId; track.actions = [];
            if (activeTrackId.value === oldOperatorId) activeTrackId.value = newOperatorId;
            commitState()
        }
    }

    function updateTrackMaxGauge(trackId, value) { const track = tracks.value.find(t => t.id === trackId); if (track) { track.maxGaugeOverride = value; commitState(); } }
    function updateTrackInitialGauge(trackId, value) { const track = tracks.value.find(t => t.id === trackId); if (track) { track.initialGauge = value; commitState(); } }

    // ===================================================================================
    // 8. 辅助逻辑 (Helpers: Copy, Link, Monitors)
    // ===================================================================================

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

    function startLinking(effectIndex = null) {
        if (!selectedActionId.value) return;
        if (isLinking.value && linkingSourceId.value === selectedActionId.value && linkingEffectIndex.value === effectIndex) { cancelLinking(); return; }
        isLinking.value = true; linkingSourceId.value = selectedActionId.value; linkingEffectIndex.value = effectIndex;
    }

    function cancelLinking() { isLinking.value = false; linkingSourceId.value = null; linkingEffectIndex.value = null; }

    function calculateGlobalSpData() { /* (略，保持原样) */
        // ... (这部分逻辑未变，省略以节省空间，但功能需保留)
        const { maxSp, spRegenRate } = systemConstants.value;
        const events = []
        tracks.value.forEach(track => {
            if (!track.actions) return
            track.actions.forEach(action => {
                if (action.spCost > 0) events.push({ time: action.startTime, change: -action.spCost, type: 'cost' })
                if (action.spGain > 0) events.push({ time: action.startTime + action.duration, change: action.spGain, type: 'gain' })
            })
        })
        events.sort((a, b) => a.time - b.time)
        const points = []; let currentSp = 200; let currentTime = 0; points.push({ time: 0, sp: currentSp });
        const advanceTime = (targetTime) => {
            const timeDiff = targetTime - currentTime; if (timeDiff <= 0) return;
            if (currentSp >= maxSp) { currentTime = targetTime; points.push({ time: currentTime, sp: maxSp }); return; }
            const potentialGain = timeDiff * spRegenRate; const projectedSp = currentSp + potentialGain;
            if (projectedSp >= maxSp) { const timeToMax = (maxSp - currentSp) / spRegenRate; points.push({ time: currentTime + timeToMax, sp: maxSp }); currentSp = maxSp; currentTime = targetTime; points.push({ time: currentTime, sp: maxSp }); }
            else { currentSp = projectedSp; currentTime = targetTime; points.push({ time: currentTime, sp: currentSp }); }
        }
        events.forEach(ev => { advanceTime(ev.time); currentSp += ev.change; if (currentSp > maxSp) currentSp = maxSp; points.push({ time: currentTime, sp: currentSp, type: ev.type }) });
        if (currentTime < TOTAL_DURATION) advanceTime(TOTAL_DURATION);
        return points
    }

    function calculateGlobalStaggerData() { /* (略，保持原样) */
        const { maxStagger } = systemConstants.value;
        const events = []
        tracks.value.forEach(track => { if (!track.actions) return; track.actions.forEach(action => { if (action.stagger > 0) { events.push({ time: action.startTime + action.duration, change: action.stagger, type: 'gain' }) } }) })
        events.sort((a, b) => a.time - b.time)
        const points = []; const lockSegments = []; let currentVal = 0; let currentTime = 0; let lockedUntil = -1; points.push({ time: 0, val: 0 });
        const advanceTime = (targetTime) => { if (targetTime > currentTime) { points.push({ time: targetTime, val: currentVal }); currentTime = targetTime; } }
        events.forEach(ev => { advanceTime(ev.time); if (currentTime >= lockedUntil) { currentVal += ev.change; if (currentVal >= maxStagger) { currentVal = 0; const endLock = currentTime + 10; lockedUntil = endLock; lockSegments.push({ start: currentTime, end: endLock }); points.push({ time: currentTime, val: 0 }); } } points.push({ time: currentTime, val: currentVal }) });
        if (currentTime < TOTAL_DURATION) advanceTime(TOTAL_DURATION);
        return { points, lockSegments }
    }

    function calculateGaugeData(trackId) { /* (略，保持原样) */
        const track = tracks.value.find(t => t.id === trackId); if (!track) return [];
        const charInfo = characterRoster.value.find(c => c.id === trackId); if (!charInfo) return [];
        const libId = `${trackId}_ultimate`; const override = characterOverrides.value[libId];
        const GAUGE_MAX = (track.maxGaugeOverride && track.maxGaugeOverride > 0) ? track.maxGaugeOverride : ((override && override.gaugeCost) ? override.gaugeCost : (charInfo.ultimate_gaugeMax || 100));
        const events = [];
        tracks.value.forEach(sourceTrack => { if (!sourceTrack.actions) return; sourceTrack.actions.forEach(action => { if (sourceTrack.id === trackId) { if (action.gaugeCost > 0) events.push({ time: action.startTime, change: -action.gaugeCost }); if (action.gaugeGain > 0) events.push({ time: action.startTime + action.duration, change: action.gaugeGain }); } if (sourceTrack.id !== trackId && action.teamGaugeGain > 0) { events.push({ time: action.startTime + action.duration, change: action.teamGaugeGain }); } }) });
        events.sort((a, b) => a.time - b.time); const initialGauge = track.initialGauge || 0; let currentGauge = initialGauge > GAUGE_MAX ? GAUGE_MAX : initialGauge; const points = []; points.push({ time: 0, val: currentGauge, ratio: currentGauge / GAUGE_MAX });
        events.forEach(ev => { points.push({ time: ev.time, val: currentGauge, ratio: currentGauge / GAUGE_MAX }); currentGauge += ev.change; if (currentGauge > GAUGE_MAX) currentGauge = GAUGE_MAX; if (currentGauge < 0) currentGauge = 0; points.push({ time: ev.time, val: currentGauge, ratio: currentGauge / GAUGE_MAX }); });
        points.push({ time: TOTAL_DURATION, val: currentGauge, ratio: currentGauge / GAUGE_MAX }); return points;
    }

    // === 外部 IO (IO & Lifecycle) ===
    async function fetchGameData() {
        try {
            isLoading.value = true
            const response = await fetch('/gamedata.json')
            if (!response.ok) throw new Error('无法加载 gamedata.json')
            const data = await response.json()
            if (data.SYSTEM_CONSTANTS) {
                systemConstants.value.maxSp = data.SYSTEM_CONSTANTS.MAX_SP || 300
                systemConstants.value.spRegenRate = data.SYSTEM_CONSTANTS.SP_REGEN_PER_SEC || 8
                systemConstants.value.skillSpCostDefault = data.SYSTEM_CONSTANTS.SKILL_SP_COST_DEFAULT || 100
            }
            const sortedRoster = data.characterRoster.sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
            characterRoster.value = sortedRoster
            iconDatabase.value = data.ICON_DATABASE

            // 初始化快照
            historyStack.value = []
            historyIndex.value = -1
            commitState()
        } catch (error) { console.error("加载数据失败:", error) } finally { isLoading.value = false }
    }

    function exportProject() { const projectData = { version: '2.0.0', timestamp: Date.now(), tracks: tracks.value, connections: connections.value, characterOverrides: characterOverrides.value }; const jsonString = JSON.stringify(projectData, null, 2); const blob = new Blob([jsonString], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `endaxis_project_${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href) }

    async function importProject(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader(); reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result); if (!data.tracks) throw new Error("无效的项目文件");
                    tracks.value = data.tracks; connections.value = data.connections || []; characterOverrides.value = data.characterOverrides || {};
                    clearSelection(); historyStack.value = []; historyIndex.value = -1; commitState(); resolve(true)
                } catch (err) { reject(err) }
            }; reader.readAsText(file)
        })
    }

    return {
        // State
        systemConstants, isLoading, characterRoster, iconDatabase, tracks, connections,
        activeTrackId, timelineScrollLeft, zoomLevel, globalDragOffset, draggingSkillData,
        selectedActionId, selectedLibrarySkillId, multiSelectedIds, clipboard,
        isLinking, linkingSourceId, linkingEffectIndex,
        showCursorGuide, isBoxSelectMode, cursorCurrentTime,
        // Getters
        teamTracksInfo, activeSkillLibrary, timeBlockWidth, ELEMENT_COLORS,
        getActionPositionInfo, getIncomingConnections, getCharacterElementColor, isActionSelected,
        // Actions
        fetchGameData, exportProject, importProject, TOTAL_DURATION,
        selectTrack, changeTrackOperator, selectLibrarySkill, updateLibrarySkill, selectAction, updateAction, removeAction,
        addSkillToTrack, setDraggingSkill, setDragOffset, setScrollLeft, setZoom,
        calculateGlobalSpData, calculateGaugeData, calculateGlobalStaggerData, updateTrackInitialGauge, updateTrackMaxGauge,
        startLinking, confirmLinking, cancelLinking, removeConnection, getColor,
        toggleCursorGuide, toggleBoxSelectMode, setCursorTime,
        setMultiSelection, clearSelection, copySelection, pasteSelection, removeCurrentSelection,
        undo, redo, commitState
    }
})