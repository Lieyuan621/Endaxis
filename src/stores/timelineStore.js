// src/stores/timelineStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 工具：生成简易 UUID
const uid = () => Math.random().toString(36).substring(2, 9)

export const useTimelineStore = defineStore('timeline', () => {

    // ===================================================================================
    // 1. 系统常量 (Single Source of Truth)
    // ===================================================================================

    // 这里是“兜底默认值”。
    const systemConstants = ref({
        maxSp: 300,
        spRegenRate: 8,
        skillSpCostDefault: 100,
        maxStagger: 100
    })

    const BASE_BLOCK_WIDTH = 50
    const TOTAL_DURATION = 120

    // 元素属性颜色映射表
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
    // 2. 基础状态 (State)
    // ===================================================================================

    const characterRoster = ref([])
    const isLoading = ref(true)
    const iconDatabase = ref({})

    const tracks = ref([
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
        { id: null, actions: [], initialGauge: 0, maxGaugeOverride: null },
    ])

    const connections = ref([])

    // === 交互状态 ===
    const activeTrackId = ref(null)
    const timelineScrollLeft = ref(0)
    const zoomLevel = ref(1.0)
    const globalDragOffset = ref(0)
    const draggingSkillData = ref(null)
    const selectedActionId = ref(null)
    const selectedLibrarySkillId = ref(null)
    const characterOverrides = ref({})

    const isLinking = ref(false)
    const linkingSourceId = ref(null)
    const linkingEffectIndex = ref(null)

    // ===================================================================================
    // 3. 计算属性 (Getters)
    // ===================================================================================

    const getActionPositionInfo = (instanceId) => {
        for (let i = 0; i < tracks.value.length; i++) {
            const track = tracks.value[i];
            const action = track.actions.find(a => a.instanceId === instanceId);
            if (action) return { trackIndex: i, action };
        }
        return null;
    };

    const getIncomingConnections = (targetId) => connections.value.filter(c => c.to === targetId);

    const getCharacterElementColor = (characterId) => {
        const charInfo = characterRoster.value.find(c => c.id === characterId)
        if (!charInfo || !charInfo.element) return ELEMENT_COLORS.default
        return ELEMENT_COLORS[charInfo.element] || ELEMENT_COLORS.default
    }

    const timeBlockWidth = computed(() => BASE_BLOCK_WIDTH * zoomLevel.value)

    /**
     * 生成当前选中干员的技能库列表
     */
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

            let derivedElement = activeChar.element || 'physical';
            if (activeChar[`${suffix}_element`]) derivedElement = activeChar[`${suffix}_element`];
            if (suffix === 'attack' || suffix === 'execution') derivedElement = 'physical';
            if (suffix === 'link') derivedElement = null;

            let defaults = { spCost: 0, spGain: 0, gaugeCost: 0, gaugeGain: 0 , stagger: 0 }

            if (suffix === 'attack') {
                defaults.spGain = activeChar.attack_spGain || 0;
                defaults.stagger = activeChar.attack_stagger || 0
            } else if (suffix === 'skill') {
                // 使用配置中的默认消耗值作为兜底
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

            const merged = {
                duration: rawDuration, cooldown: rawCooldown,
                ...defaults, ...globalOverride
            }

            return {
                id: globalId, type: type, name: name, element: derivedElement,
                duration: merged.duration, cooldown: merged.cooldown,
                spCost: merged.spCost, spGain: merged.spGain,
                gaugeCost: merged.gaugeCost, gaugeGain: merged.gaugeGain,
                teamGaugeGain: merged.teamGaugeGain,
                stagger: merged.stagger,
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

    const teamTracksInfo = computed(() => tracks.value.map(track => {
        const charInfo = characterRoster.value.find(c => c.id === track.id)
        return { ...track, ...(charInfo || { name: '未知', avatar: '', rarity: 0 }) }
    }))

    // ===================================================================================
    // 4. 业务逻辑 (Actions)
    // ===================================================================================

    function setZoom(val) { if (val < 0.2) val = 0.2; if (val > 3.0) val = 3.0; zoomLevel.value = val }
    function setDraggingSkill(skill) { draggingSkillData.value = skill }
    function setDragOffset(offset) { globalDragOffset.value = offset }
    function setScrollLeft(val) { timelineScrollLeft.value = val }

    // 计算全局 SP 曲线

    function calculateGlobalSpData() {
        // 解构配置，确保使用的是最新读取到的值
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

        const points = [];
        let currentSp = 200; // 初始SP，这里如果需要配置也可以提取到 JSON
        let currentTime = 0;
        points.push({ time: 0, sp: currentSp });

        const advanceTime = (targetTime) => {
            const timeDiff = targetTime - currentTime; if (timeDiff <= 0) return;

            if (currentSp >= maxSp) {
                currentTime = targetTime; points.push({ time: currentTime, sp: maxSp }); return;
            }

            const potentialGain = timeDiff * spRegenRate;
            const projectedSp = currentSp + potentialGain;

            if (projectedSp >= maxSp) {
                const timeToMax = (maxSp - currentSp) / spRegenRate;
                points.push({ time: currentTime + timeToMax, sp: maxSp });
                currentSp = maxSp; currentTime = targetTime;
                points.push({ time: currentTime, sp: maxSp });
            } else {
                currentSp = projectedSp; currentTime = targetTime;
                points.push({ time: currentTime, sp: currentSp });
            }
        }

        events.forEach(ev => {
            advanceTime(ev.time);
            currentSp += ev.change;
            if (currentSp > maxSp) currentSp = maxSp; // 溢出截断
            points.push({ time: currentTime, sp: currentSp, type: ev.type })
        });

        if (currentTime < TOTAL_DURATION) advanceTime(TOTAL_DURATION);
        return points
    }

    function calculateGlobalStaggerData() {
        const { maxStagger } = systemConstants.value;
        const events = []

        tracks.value.forEach(track => {
            if (!track.actions) return
            track.actions.forEach(action => {
                if (action.stagger > 0) events.push({ time: action.startTime + action.duration, change: action.stagger, type: 'gain' })
                if (action.type === 'execution') events.push({ time: action.startTime, type: 'execution' })
            })
        })

        events.sort((a, b) => {
            if (a.time !== b.time) return a.time - b.time
            if (a.type === 'gain' && b.type === 'execution') return -1
            if (a.type === 'execution' && b.type === 'gain') return 1
            return 0
        })

        const points = [];
        const lockSegments = [];

        let currentVal = 0;
        let currentTime = 0;
        let lockedUntil = -1;

        points.push({ time: 0, val: 0 });

        const advanceTime = (targetTime) => {
            if (targetTime > currentTime) {
                points.push({ time: targetTime, val: currentVal });
                currentTime = targetTime;
            }
        }

        events.forEach(ev => {
            advanceTime(ev.time);

            if (ev.type === 'execution') {
                currentVal = 0;
                const endLock = currentTime + 10;
                lockedUntil = endLock;

                lockSegments.push({ start: currentTime, end: endLock });
            }
            else if (ev.type === 'gain') {
                if (currentTime >= lockedUntil) {
                    currentVal += ev.change;
                    if (currentVal > maxStagger) currentVal = maxStagger;
                }
            }

            points.push({ time: currentTime, val: currentVal })
        });

        if (currentTime < TOTAL_DURATION) advanceTime(TOTAL_DURATION);

        return { points, lockSegments }
    }

    function calculateGaugeData(trackId) {
        const track = tracks.value.find(t => t.id === trackId)
        if (!track) return []
        const charInfo = characterRoster.value.find(c => c.id === trackId)
        if (!charInfo) return []

        const libId = `${trackId}_ultimate`
        const override = characterOverrides.value[libId]
        const GAUGE_MAX = (track.maxGaugeOverride && track.maxGaugeOverride > 0) ? track.maxGaugeOverride : ((override && override.gaugeCost) ? override.gaugeCost : (charInfo.ultimate_gaugeMax || 100))

        const events = []
        tracks.value.forEach(sourceTrack => {
            if (!sourceTrack.actions) return

            sourceTrack.actions.forEach(action => {
                // 情况 A: 自己的动作 (Self)
                // 判断 sourceTrack.id 是否等于当前计算的目标 trackId
                if (sourceTrack.id === trackId) {
                    if (action.gaugeCost > 0) events.push({ time: action.startTime, change: -action.gaugeCost })
                    if (action.gaugeGain > 0) events.push({ time: action.startTime + action.duration, change: action.gaugeGain })
                }

                // 情况 B: 队友的动作 (Team Support)
                // 如果这个动作来源于别人，且带有 teamGaugeGain
                if (sourceTrack.id !== trackId && action.teamGaugeGain > 0) {
                    events.push({
                        time: action.startTime + action.duration,
                        change: action.teamGaugeGain
                    })
                }
            })
        })
        events.sort((a, b) => a.time - b.time)

        const initialGauge = track.initialGauge || 0
        let currentGauge = initialGauge > GAUGE_MAX ? GAUGE_MAX : initialGauge
        const points = [];
        points.push({ time: 0, val: currentGauge, ratio: currentGauge / GAUGE_MAX });

        events.forEach(ev => {
            points.push({ time: ev.time, val: currentGauge, ratio: currentGauge / GAUGE_MAX })
            currentGauge += ev.change;
            if (currentGauge > GAUGE_MAX) currentGauge = GAUGE_MAX;
            if (currentGauge < 0) currentGauge = 0
            points.push({ time: ev.time, val: currentGauge, ratio: currentGauge / GAUGE_MAX })
        })
        points.push({ time: TOTAL_DURATION, val: currentGauge, ratio: currentGauge / GAUGE_MAX })
        return points
    }

    // === 数据修改 ===
    function updateTrackMaxGauge(trackId, value) { const track = tracks.value.find(t => t.id === trackId); if (track) track.maxGaugeOverride = value }
    function updateTrackInitialGauge(trackId, value) { const track = tracks.value.find(t => t.id === trackId); if (track) track.initialGauge = value }
    function updateLibrarySkill(skillId, props) {
        if (!characterOverrides.value[skillId]) characterOverrides.value[skillId] = {}
        Object.assign(characterOverrides.value[skillId], props)
        tracks.value.forEach(track => { if (!track.actions) return; track.actions.forEach(action => { if (action.id === skillId) { Object.assign(action, props) } }) })
    }
    const cloneSkill = (skill) => {
        const clonedAnomalies = skill.physicalAnomaly ? JSON.parse(JSON.stringify(skill.physicalAnomaly)) : [];
        return { ...skill, instanceId: `inst_${uid()}`, physicalAnomaly: clonedAnomalies }
    }
    function addSkillToTrack(trackId, skill, startTime) {
        const track = tracks.value.find(t => t.id === trackId); if (!track) return
        const newAction = cloneSkill(skill); newAction.startTime = startTime
        track.actions.push(newAction); track.actions.sort((a, b) => a.startTime - b.startTime)
    }
    function selectLibrarySkill(skillId) { selectedActionId.value = null; selectedLibrarySkillId.value = (selectedLibrarySkillId.value === skillId) ? null : skillId }
    function selectAction(instanceId) { selectedLibrarySkillId.value = null; selectedActionId.value = (instanceId === selectedActionId.value) ? null : instanceId }
    function updateAction(instanceId, newProperties) {
        for (const track of tracks.value) { const action = track.actions.find(a => a.instanceId === instanceId); if (action) { Object.assign(action, newProperties); return; } }
    }
    function removeAction(instanceId) {
        if (!instanceId) return
        for (const track of tracks.value) { const index = track.actions.findIndex(a => a.instanceId === instanceId); if (index !== -1) { track.actions.splice(index, 1); break; } }
        connections.value = connections.value.filter(c => c.from !== instanceId && c.to !== instanceId)
        if (selectedActionId.value === instanceId) selectedActionId.value = null
    }
    function selectTrack(trackId) { activeTrackId.value = trackId; selectedActionId.value = null; selectedLibrarySkillId.value = null; cancelLinking() }
    function changeTrackOperator(trackIndex, oldOperatorId, newOperatorId) {
        const track = tracks.value[trackIndex];
        if (track) {
            if (tracks.value.some((t, i) => i !== trackIndex && t.id === newOperatorId)) { alert('该干员已在另一条轨道上！'); return; }
            track.id = newOperatorId; track.actions = [];
            if (activeTrackId.value === oldOperatorId) activeTrackId.value = newOperatorId;
        }
    }

    // === 外部 IO (修正后) ===
    async function fetchGameData() {
        try {
            isLoading.value = true
            const response = await fetch('/gamedata.json')
            if (!response.ok) throw new Error('无法加载 gamedata.json')

            // 1. 先解析 JSON
            const data = await response.json()

            // 2. 再读取常量配置，覆盖 Store 中的默认值
            if (data.SYSTEM_CONSTANTS) {
                systemConstants.value.maxSp = data.SYSTEM_CONSTANTS.MAX_SP || 300
                systemConstants.value.spRegenRate = data.SYSTEM_CONSTANTS.SP_REGEN_PER_SEC || 8
                systemConstants.value.skillSpCostDefault = data.SYSTEM_CONSTANTS.SKILL_SP_COST_DEFAULT || 100
            }

            // 3. 处理干员列表
            const sortedRoster = data.characterRoster.sort((a, b) => (b.rarity || 0) - (a.rarity || 0));
            characterRoster.value = sortedRoster
            iconDatabase.value = data.ICON_DATABASE
        } catch (error) { console.error("加载数据失败:", error) } finally { isLoading.value = false }
    }

    function exportProject() {
        const projectData = { version: '2.0.0', timestamp: Date.now(), tracks: tracks.value, connections: connections.value, characterOverrides: characterOverrides.value }
        const jsonString = JSON.stringify(projectData, null, 2); const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `endaxis_project_${new Date().toISOString().slice(0, 10)}.json`;
        link.click(); URL.revokeObjectURL(link.href)
    }

    async function importProject(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader(); reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result); if (!data.tracks) throw new Error("无效的项目文件");
                    tracks.value = data.tracks; connections.value = data.connections || []; characterOverrides.value = data.characterOverrides || {};
                    selectedActionId.value = null; selectedLibrarySkillId.value = null; resolve(true)
                } catch (err) { reject(err) }
            }; reader.readAsText(file)
        })
    }

    // === 连线逻辑 ===
    function startLinking(effectIndex = null) {
        if (!selectedActionId.value) return;
        if (isLinking.value && linkingSourceId.value === selectedActionId.value && linkingEffectIndex.value === effectIndex) { cancelLinking(); return; }
        isLinking.value = true; linkingSourceId.value = selectedActionId.value; linkingEffectIndex.value = effectIndex;
    }
    function confirmLinking(targetId, targetEffectIndex = null) {
        if (!isLinking.value || !linkingSourceId.value) return cancelLinking();
        if (linkingSourceId.value === targetId) { cancelLinking(); return; }
        const exists = connections.value.some(c => c.from === linkingSourceId.value && c.to === targetId && c.fromEffectIndex === linkingEffectIndex.value && c.toEffectIndex === targetEffectIndex)
        if (!exists) { connections.value.push({ id: `conn_${uid()}`, from: linkingSourceId.value, to: targetId, fromEffectIndex: linkingEffectIndex.value, toEffectIndex: targetEffectIndex }) }
        cancelLinking()
    }
    function cancelLinking() { isLinking.value = false; linkingSourceId.value = null; linkingEffectIndex.value = null; }
    function removeConnection(connId) { connections.value = connections.value.filter(c => c.id !== connId) }

    return {
        // State
        systemConstants, // 暴露出来供组件调试用
        isLoading, characterRoster, iconDatabase, tracks, connections,
        activeTrackId, timelineScrollLeft, zoomLevel,
        globalDragOffset, draggingSkillData,
        selectedActionId, selectedLibrarySkillId,
        isLinking, linkingSourceId, linkingEffectIndex,
        // Getters
        teamTracksInfo, activeSkillLibrary, timeBlockWidth, ELEMENT_COLORS,
        // Actions
        fetchGameData, exportProject, importProject, TOTAL_DURATION,
        selectTrack, changeTrackOperator,
        selectLibrarySkill, updateLibrarySkill,
        selectAction, updateAction, removeAction,
        cloneSkill, addSkillToTrack,
        setDraggingSkill, setDragOffset, setScrollLeft, setZoom,
        calculateGlobalSpData, calculateGaugeData, calculateGlobalStaggerData,
        updateTrackInitialGauge, updateTrackMaxGauge,
        startLinking, confirmLinking, cancelLinking, removeConnection,
        getColor,
        getActionPositionInfo, getIncomingConnections, getCharacterElementColor
    }
})