import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const uid = () => Math.random().toString(36).substring(2, 9)

export const useTimelineStore = defineStore('timeline', () => {

    const characterRoster = ref([])
    const isLoading = ref(true)
    const iconDatabase = ref({})

    // 初始轨道，这里先写死默认干员，后续可以改成加载后动态匹配
    const tracks = ref([
        { id: null, actions: [] },
        { id: null, actions: [] },
        { id: null, actions: [] },
        { id: null, actions: [] },
    ])

    const activeTrackId = ref(null)
    const linkState = ref({ windows: {} })

    // 全局拖拽偏移量
    const globalDragOffset = ref(0)
    function setDragOffset(offset) {
        globalDragOffset.value = offset
    }

    const connections = ref([])
    const isLinking = ref(false)
    const linkingSourceId = ref(null)
    const linkingEffectIndex = ref(null)

    // 1. 开始连线
    function startLinking(effectIndex = null) {
        if (selectedActionId.value) {
            isLinking.value = true
            linkingSourceId.value = selectedActionId.value
            linkingEffectIndex.value = effectIndex // 记录效果索引
        }
    }

    // 2. 完成连线
    function confirmLinking(targetId) {
        if (!isLinking.value || !linkingSourceId.value) {
            isLinking.value = false;
            linkingSourceId.value = null;
            linkingEffectIndex.value = null;
            return;
        }

        if (linkingSourceId.value === targetId) {
            alert("不能连接自己！");
        } else {
            const exists = connections.value.some(c =>
                c.from === linkingSourceId.value &&
                c.to === targetId &&
                // 【修改】防止重复时也要检查效果索引是否一致
                c.fromEffectIndex === linkingEffectIndex.value
            )

            if (!exists) {
                connections.value.push({
                    id: `conn_${uid()}`,
                    from: linkingSourceId.value,
                    to: targetId,
                    // 【新增】保存来源效果的索引
                    fromEffectIndex: linkingEffectIndex.value
                })
            } else {
                alert("该连接已存在！");
            }
        }

        // 重置所有状态
        isLinking.value = false
        linkingSourceId.value = null
        linkingEffectIndex.value = null
    }

    // 3. 取消连线
    function cancelLinking() {
        isLinking.value = false
        linkingSourceId.value = null
        linkingEffectIndex.value = null
    }

    function removeConnection(connId) {
        connections.value = connections.value.filter(c => c.id !== connId)
    }

    const teamTracksInfo = computed(() => {
        return tracks.value.map(track => {
            const charInfo = characterRoster.value.find(c => c.id === track.id)
            // 如果找不到干员信息（比如新加的），提供一个默认空对象防止报错
            return { ...track, ...(charInfo || { name: '未知', avatar: '', rarity: 0 }) }
        })
    })

    const activeSkillLibrary = computed(() => {
        const activeChar = characterRoster.value.find(c => c.id === activeTrackId.value)
        if (!activeChar) return []

        const getAnomalies = (list) => list || []

        const getAllowed = (list) => list || []

        return [
            {
                id: `${activeChar.id}_attack`,
                type: 'attack',
                name: '重击',
                duration: activeChar.attack_duration,
                cooldown: activeChar.attack_cooldown,
                spCost: activeChar.attack_spCost,
                spGain: activeChar.attack_spGain,
                allowedTypes: getAllowed(activeChar.attack_allowed_types),
                physicalAnomaly: getAnomalies(activeChar.attack_anomalies)
            },
            {
                id: `${activeChar.id}_skill`,
                type: 'skill',
                name: '战技',
                duration: activeChar.skill_duration,
                cooldown: activeChar.skill_cooldown,
                spCost: activeChar.skill_spCost,
                spGain: activeChar.skill_spGain,
                allowedTypes: getAllowed(activeChar.skill_allowed_types),
                physicalAnomaly: getAnomalies(activeChar.skill_anomalies)
            },
            {
                id: `${activeChar.id}_link`,
                type: 'link',
                name: '连携',
                duration: activeChar.link_duration,
                cooldown: activeChar.link_cooldown,
                spCost: activeChar.link_spCost,
                spGain: activeChar.link_spGain,
                allowedTypes: getAllowed(activeChar.link_allowed_types),
                physicalAnomaly: getAnomalies(activeChar.link_anomalies)
            },
            {
                id: `${activeChar.id}_ultimate`,
                type: 'ultimate',
                name: '终结技',
                duration: activeChar.ultimate_duration,
                cooldown: activeChar.ultimate_cooldown,
                spCost: activeChar.ultimate_spCost,
                spGain: activeChar.ultimate_spGain,
                allowedTypes: getAllowed(activeChar.ultimate_allowed_types),
                physicalAnomaly: getAnomalies(activeChar.ultimate_anomalies)
            }
        ]
    })

    const cloneSkill = (skill) => {
        const clonedAnomalies = skill.physicalAnomaly
            ? JSON.parse(JSON.stringify(skill.physicalAnomaly))
            : [];

        return {
            ...skill,
            instanceId: `inst_${uid()}`,
            physicalAnomaly: clonedAnomalies
        }
    }

    function updateAction(instanceId, newProperties) {
        for (const track of tracks.value) {
            const action = track.actions.find(a => a.instanceId === instanceId)
            if (action) {
                Object.assign(action, newProperties)
                return
            }
        }
    }

    const selectedActionId = ref(null)

    function selectAction(instanceId) {
        selectedActionId.value = instanceId === selectedActionId.value ? null : instanceId
    }

    function selectTrack(trackId) {
        activeTrackId.value = trackId
        selectedActionId.value = null
        cancelLinking()
    }

    function removeAction(instanceId) {
        if (!instanceId) return

        for (const track of tracks.value) {
            const index = track.actions.findIndex(a => a.instanceId === instanceId)
            if (index !== -1) {
                track.actions.splice(index, 1)
                break
            }
        }
        connections.value = connections.value.filter(c => c.from !== instanceId && c.to !== instanceId)
        if (selectedActionId.value === instanceId) {
            selectedActionId.value = null
        }
    }

    async function fetchGameData() {
        try {
            isLoading.value = true
            const response = await fetch('/gamedata.json')
            if (!response.ok) throw new Error('无法加载 gamedata.json')
            const data = await response.json()

            // 【修改】加载后自动排序：按星级 (rarity) 降序排列
            const sortedRoster = data.characterRoster.sort((a, b) => {
                return (b.rarity || 0) - (a.rarity || 0);
            });

            characterRoster.value = sortedRoster
            iconDatabase.value = data.ICON_DATABASE
        } catch (error) {
            console.error("加载游戏数据失败:", error)
        } finally {
            isLoading.value = false
        }
    }

    function changeTrackOperator(trackIndex, oldOperatorId, newOperatorId) {
        const track = tracks.value[trackIndex];
        if (track) {
            const isAlreadyInUse = tracks.value.some((t, index) => index !== trackIndex && t.id === newOperatorId);
            if (isAlreadyInUse) {
                alert('该干员已在另一条轨道上！');
                return;
            }
            track.id = newOperatorId;
            track.actions = [];
            if (activeTrackId.value === oldOperatorId) {
                activeTrackId.value = newOperatorId;
            }
        }
    }

    return {
        isLoading,
        fetchGameData,
        characterRoster,
        iconDatabase,
        teamTracksInfo,
        activeTrackId,
        selectTrack,
        activeSkillLibrary,
        tracks,
        cloneSkill,
        connections,
        removeConnection,
        isLinking,
        linkingSourceId,
        startLinking,
        confirmLinking,
        cancelLinking,
        updateAction,
        selectedActionId,
        selectAction,
        linkState,
        changeTrackOperator,
        globalDragOffset,
        setDragOffset,
        removeAction
    }
})