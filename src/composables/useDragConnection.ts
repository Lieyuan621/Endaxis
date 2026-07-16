import { computed, readonly, type Ref } from 'vue';
import { useTimelineStore } from '../stores/timelineStore';
import { storeToRefs } from 'pinia';

interface Point {
  x: number;
  y: number;
}

interface DragPayload {
  mode?: string;
  sourceId: string;
  existingConnectionId?: string | null;
  sourcePort?: string | null;
  startX?: number;
  startY?: number;
}

interface NodeLike {
  id: string;
  type?: string;
  actionId?: string | null;
  flatIndex?: number | null;
  [key: string]: unknown;
}

interface SnapState {
  isActive: boolean;
  targetId: string | null;
  targetPort: string | null;
  snapPos: Point | null;
}

interface DragState {
  isDragging: boolean;
  mode?: string;
  sourceId: string | null;
  existingConnectionId?: string | null;
  startPoint?: Point;
  sourcePort?: string | null;
}

// The timeline store's connection API. Declared here from the consumer side while
// the store is still JavaScript; Phase 2 moves these types onto the store itself.
interface ConnectionStoreMethods {
  getConnectionById(id: string): { isConsumption?: boolean; sourcePort?: string | null } | null;
  removeConnection(id: string): void;
  createConnection(
    sourcePort: string | null | undefined,
    targetPort: string | null,
    isConsumption: boolean,
    data: unknown,
  ): void;
  resolveNode(id: string | null): NodeLike | null;
  getNodesOfConnection(id: string): { fromNode?: NodeLike | null; toNode?: NodeLike | null };
}

export function useDragConnection() {
  const store = useTimelineStore();
  const api = store as unknown as ConnectionStoreMethods;

  const {
    connectionDragState: dragStateRef,
    connectionSnapState: snapStateRef,
    enableConnectionTool,
    validConnectionTargetIds,
    actionMap,
    effectsMap,
    connections,
  } = storeToRefs(store);
  const connectionDragState = dragStateRef as unknown as Ref<DragState>;
  const connectionSnapState = snapStateRef as unknown as Ref<SnapState>;
  const isDragging = computed(() => {
    return connectionDragState.value.isDragging;
  });

  function snapTo(targetId: string | null, port: string | null, pos: Point | null) {
    connectionSnapState.value = {
      isActive: true,
      targetId,
      targetPort: port,
      snapPos: pos,
    };
  }

  function clearSnap() {
    connectionSnapState.value = {
      isActive: false,
      targetId: null,
      targetPort: null,
      snapPos: null,
    };
  }

  function calculateValidTargets(sourceId: string) {
    const validSet = new Set<string>();

    for (const action of actionMap.value.values()) {
      if (validateConnection(sourceId, action.id)) {
        validSet.add(action.id);
      }
    }

    for (const effect of effectsMap.value.values()) {
      if (validateConnection(sourceId, effect.id)) {
        validSet.add(effect.id);
      }
    }

    validConnectionTargetIds.value = validSet;
  }

  function isNodeValid(targetId: string) {
    if (!isDragging.value) {
      return true;
    }
    return validConnectionTargetIds.value.has(targetId);
  }

  function startDrag(payload: DragPayload) {
    connectionDragState.value = {
      isDragging: true,
      mode: payload.mode || 'create',
      sourceId: payload.sourceId,
      existingConnectionId: payload.existingConnectionId,
      startPoint: { x: payload.startX || 0, y: payload.startY || 0 },
      sourcePort: payload.sourcePort,
    };

    calculateValidTargets(payload.sourceId);

    clearSnap();
  }

  function handleLinkDrop(
    _fromNode: NodeLike,
    _toNode: NodeLike,
    targetPort: string | null,
    connectionData: unknown,
  ) {
    const state = connectionDragState.value;

    let isConsumption = false;
    if (state.existingConnectionId) {
      const connection = api.getConnectionById(state.existingConnectionId);
      if (connection) {
        isConsumption = connection.isConsumption ?? false;
        api.removeConnection(state.existingConnectionId);
      }
    }

    api.createConnection(state.sourcePort, targetPort, isConsumption, connectionData);
  }

  function validateConnection(fromId: string | null | undefined, toId: string | null | undefined) {
    if (!fromId || !toId || fromId === toId) {
      return false;
    }

    const fromNode = api.resolveNode(fromId) as NodeLike | null;
    const toNode = api.resolveNode(toId) as NodeLike | null;

    if (!fromNode || !toNode) {
      return false;
    }

    const getEndpointId = (conn: Record<string, unknown> | null, side: 'from' | 'to') => {
      if (!conn) return null;
      if (side === 'from') return conn.fromNodeId || conn.fromEffectId || conn.from || null;
      return conn.toNodeId || conn.toEffectId || conn.to || null;
    };

    const fromNodeId = fromNode.id;
    const toNodeId = toNode.id;

    const exists = connections.value.some(
      (c: Record<string, unknown>) =>
        getEndpointId(c, 'from') === fromNodeId && getEndpointId(c, 'to') === toNodeId,
    );

    if (exists) {
      return false;
    }

    return {
      fromNodeId,
      toNodeId,
      fromNodeType: fromNode.type,
      toNodeType: toNode.type,
      from:
        fromNode.type === 'action'
          ? fromNode.id
          : fromNode.type === 'effect'
            ? fromNode.actionId
            : null,
      to: toNode.type === 'action' ? toNode.id : toNode.type === 'effect' ? toNode.actionId : null,
      fromEffectId: fromNode.type === 'effect' ? fromNode.id : null,
      toEffectId: toNode.type === 'effect' ? toNode.id : null,
      fromEffectIndex: fromNode.type === 'effect' ? fromNode.flatIndex : null,
      toEffectIndex: toNode.type === 'effect' ? toNode.flatIndex : null,
    };
  }

  function endDrag(targetId: string | null = null, targetPort: string | null = null) {
    if (!isDragging.value) {
      return;
    }

    const state = connectionDragState.value;

    let finalTargetId = targetId;
    let finalPort = targetPort;

    if (connectionSnapState.value.isActive && !finalTargetId) {
      finalTargetId = connectionSnapState.value.targetId;
      finalPort = connectionSnapState.value.targetPort;
    }

    const fromNode = api.resolveNode(state.sourceId) as NodeLike | null;
    const toNode = api.resolveNode(finalTargetId) as NodeLike | null;

    if (fromNode && toNode) {
      const connectionData = validateConnection(state.sourceId, finalTargetId);
      if (connectionData) {
        handleLinkDrop(fromNode, toNode, finalPort, connectionData);
      }
    }

    cancelDrag();
    clearSnap();
  }

  function newConnectionFrom(startPos: Point, sourceId: string, sourcePort: string | null) {
    startDrag({
      mode: 'create',
      sourceId,
      sourcePort,
      startX: startPos.x,
      startY: startPos.y,
    });
  }

  function moveConnectionEnd(connectionId: string, startPos: Point) {
    const connection = api.getConnectionById(connectionId);
    if (!connection) {
      return;
    }
    const nodes = api.getNodesOfConnection(connectionId);
    if (!nodes.fromNode || !nodes.toNode) {
      return;
    }
    const linkDragConfig: DragPayload = {
      mode: 'create',
      sourceId: nodes.fromNode.id,
      existingConnectionId: connectionId,
      sourcePort: connection.sourcePort,
      startX: startPos.x,
      startY: startPos.y,
    };

    startDrag(linkDragConfig);
  }

  function cancelDrag() {
    if (connectionDragState.value.existingConnectionId) {
      api.removeConnection(connectionDragState.value.existingConnectionId);
    }

    connectionDragState.value.isDragging = false;
    connectionDragState.value.sourceId = null;
    validConnectionTargetIds.value = new Set();
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
    isNodeValid,
  };
}
