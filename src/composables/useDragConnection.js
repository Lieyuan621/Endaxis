import { computed, readonly } from 'vue'
import { useTimelineStore } from '../stores/timelineStore.js'
import { storeToRefs } from 'pinia'

export function useDragConnection() {
    const store = useTimelineStore()

    const { connectionDragState, connectionSnapState, enableConnectionTool, validConnectionTargetIds, actionMap, effectsMap, statusMap, connections, toggleConnectionTool } = storeToRefs(store)
    const isDragging = computed(() => {
        return connectionDragState.value.isDragging
    })

    function snapTo(targetId, port, pos) {
        connectionSnapState.value = {
            isActive: true,
            targetId,
            targetPort: port,
            snapPos: pos,
        }
    }

    function clearSnap() {
        connectionSnapState.value = {
            isActive: false,
            targetId: null,
            targetPort: null,
            snapPos: null
        }
    }

    function calculateValidTargets(sourceId) {
        const validSet = new Set()

        for (const action of actionMap.value.values()) {
            if (validateConnection(sourceId, action.id)) {
                validSet.add(action.id)
            }
        }

        for (const effect of effectsMap.value.values()) {
            if (validateConnection(sourceId, effect.id)) {
                validSet.add(effect.id)
            }
        }

        for (const status of statusMap.value.values()) {
            if (validateConnection(sourceId, status.id)) {
                validSet.add(status.id)
            }
        }

        validConnectionTargetIds.value = validSet
    }

    function isNodeValid(targetId) {
        if (!isDragging.value) {
            return true
        }
        return validConnectionTargetIds.value.has(targetId)
    }

    function startDrag(payload) {
        connectionDragState.value = {
            isDragging: true,
            mode: payload.mode || 'create',
            sourceId: payload.sourceId,
            existingConnectionId: payload.existingConnectionId,
            startPoint: { x: payload.startX || 0, y: payload.startY || 0 },
            sourcePort: payload.sourcePort,
        }

        calculateValidTargets(payload.sourceId)

        clearSnap()
    }

    function handleLinkDrop(fromNode, toNode, targetPort, connectionData) {
        const state = connectionDragState.value

        let isConsumption = false
        if (state.existingConnectionId) {
            const connection = store.getConnectionById(state.existingConnectionId)
            if (connection) {
                isConsumption = connection.isConsumption
                store.removeConnection(state.existingConnectionId)
            }
        }

        store.createConnection(state.sourcePort, targetPort, isConsumption, connectionData)
    }

    function validateConnection(fromId, toId) {
        if (!fromId || !toId || fromId === toId) {
            return false
        }

        const fromNode = store.resolveNode(fromId)
        const toNode = store.resolveNode(toId)

        if (!fromNode || !toNode) {
            return false
        }

        const getEndpointId = (conn, side) => {
            if (!conn) return null
            if (side === 'from') return conn.fromNodeId || conn.fromEffectId || conn.from || null
            return conn.toNodeId || conn.toEffectId || conn.to || null
        }

        const fromNodeId = fromNode.id
        const toNodeId = toNode.id

        const exists = connections.value.some(c => (
            getEndpointId(c, 'from') === fromNodeId &&
            getEndpointId(c, 'to') === toNodeId
        ))

        if (exists) {
            return false
        }

        return {
            fromNodeId,
            toNodeId,
            fromNodeType: fromNode.type,
            toNodeType: toNode.type,
            from: fromNode.type === 'action' ? fromNode.id : (fromNode.type === 'effect' ? fromNode.actionId : null),
            to: toNode.type === 'action' ? toNode.id : (toNode.type === 'effect' ? toNode.actionId : null),
            fromEffectId: fromNode.type === 'effect' ? fromNode.id : null,
            toEffectId: toNode.type === 'effect' ? toNode.id : null,
            fromEffectIndex: fromNode.type === 'effect' ? fromNode.flatIndex : null,
            toEffectIndex: toNode.type === 'effect' ? toNode.flatIndex : null,
        }
    }

    function endDrag(targetId = null, targetPort = null) {
        if (!isDragging.value) {
            return
        }

        const state = connectionDragState.value

        let finalTargetId = targetId
        let finalPort = targetPort

        if (connectionSnapState.value.isActive && !finalTargetId) {
            finalTargetId = connectionSnapState.value.targetId
            finalPort = connectionSnapState.value.targetPort
        }

        const fromNode = store.resolveNode(state.sourceId)
        const toNode = store.resolveNode(finalTargetId)

        if (fromNode && toNode) {
            const connectionData = validateConnection(state.sourceId, finalTargetId)
            if (connectionData) {
                handleLinkDrop(fromNode, toNode, finalPort, connectionData)
            }
        }

        cancelDrag()
        clearSnap()
    }


    function newConnectionFrom(startPos, sourceId, sourcePort) {
        startDrag({
            mode: 'create',
            sourceId,
            sourcePort,
            startX: startPos.x,
            startY: startPos.y
        })
    }

    function moveConnectionEnd(connectionId, startPos) {
        const connection = store.getConnectionById(connectionId)
        if (!connection) {
            return
        }
        const nodes = store.getNodesOfConnection(connectionId)
        if (!nodes.fromNode || !nodes.toNode) {
            return
        }
        const linkDragConfig = {
            mode: 'create',
            sourceId: nodes.fromNode.id,
            existingConnectionId: connectionId,
            sourcePort: connection.sourcePort,
            startX: startPos.x,
            startY: startPos.y
        }

        startDrag(linkDragConfig)
    }

    function cancelDrag() {
        if (connectionDragState.value.existingConnectionId) {
            store.removeConnection(connectionDragState.value.existingConnectionId)
        }

        connectionDragState.value.isDragging = false;
        connectionDragState.value.sourceId = null;
        validConnectionTargetIds.value = new Set()
    }

    return {
        isDragging,
        toolEnabled: readonly(enableConnectionTool),
        state: readonly(connectionDragState),
        snapState: readonly(connectionSnapState),
        snapTo,
        clearSnap,
        newConnectionFrom,
        moveConnectionEnd,
        endDrag,
        cancelDrag,
        validateConnection,
        isNodeValid
    }
}