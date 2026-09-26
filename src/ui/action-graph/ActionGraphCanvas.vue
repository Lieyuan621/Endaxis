<script setup lang="ts">
/** 独立动作图画布。节点位置和视口只用于显示，所有程序修改都交给父级校验与提交。 */
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import * as dagre from '@dagrejs/dagre';
import type { ActionGraphDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { GraphEntryGroup } from '../../application/editor/actionGraphEditing';
import { actionNodeTitle, dataNodeTitle, compactDataSymbol } from './nodePresentation';
import { listGraphPorts } from '../../application/editor/actionGraphEditing';
import type { GraphPresentation } from '../../core/project/graphPresentation';
import {
  listDataInputs,
  dataNodeInputs,
  dataNodeHasEffects,
} from '../../core/action-graph/actionGraphDataNodes';
import { fieldName } from './editorNodeText';
import GraphNodeHeader from './GraphNodeHeader.vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = defineProps<{
  graph: ActionGraphDefinition;
  readonly?: boolean;
  creationItems: readonly { key: string; label: string; group: string }[];
  selectedDataId?: string | null;
  presentation?: GraphPresentation;
  selectedId: string | null;
  entryGroups: readonly GraphEntryGroup[];
  selectedEntryId: string | null;
  beforeInteraction: () => boolean;
}>();
const emit = defineEmits<{
  createNode: [key: string, point: { x: number; y: number }];
  dropVariable: [
    identity: string,
    write: boolean,
    point: { x: number; y: number },
    target?: { owner: 'action' | 'data'; id: string; path: readonly string[] },
  ];
  selectData: [id: string];
  removeData: [id: string];
  connectData: [
    owner: 'action' | 'data',
    id: string,
    path: readonly string[],
    source: string | null,
  ];
  constantData: [
    owner: 'action' | 'data',
    id: string,
    path: readonly string[],
    value: number | boolean,
  ];
  changePresentation: [value: GraphPresentation, userEdit: boolean];
  select: [id: string];
  connect: [nodeId: string, path: readonly string[], targetId: string | null];
  selectEntry: [id: string];
  connectEntry: [entryIds: readonly string[], targetId: string | null];
  editTimeline: [];
  clearSelection: [];
  removeNode: [id: string];
  disconnectInput: [id: string];
  openNode: [id: string];
  selectConnection: [nodeId: string | null, entryId: string | null, targetId: string];
}>();

const NODE_WIDTH = 266;
const ENTRY_WIDTH = 390;
const HEADER_HEIGHT = 58;
const VARIABLE_HEIGHT = 36;
const PORT_HEIGHT = 28;
const ENTRY_ROW_HEIGHT = 48;
const MIN_ZOOM = 0.12;
const MAX_ZOOM = 2;
const viewport = ref<HTMLDivElement>();
const viewportSize = reactive({ width: 0, height: 0 });
const camera = reactive({ x: 0, y: 0, zoom: 1 });
const positions = reactive(new Map<string, { x: number; y: number }>());
// 显示节点与正式节点分别登记身份；布局库从不接收原始节点 ID。
const actionLayoutIds = new Map<string, string>();
const entryLayoutIds = new Map<string, string>();
const dataLayoutIds = new Map<string, string>();
function layoutId(ids: Map<string, string>, prefix: string, id: string): string {
  let result = ids.get(id);
  if (result === undefined) {
    result = `${prefix}:${ids.size}`;
    ids.set(id, result);
  }
  return result;
}
const layoutError = ref('');
type OutputPin =
  | { kind: 'action'; nodeId: string; path: readonly string[]; label: string }
  | { kind: 'entry'; groupId: string; entryIds: readonly string[]; label: string };
type DataPin =
  | {
      kind: 'data-input';
      owner: 'action' | 'data';
      nodeId: string;
      path: readonly string[];
      type: 'number' | 'boolean';
      label: string;
    }
  | { kind: 'data-output'; nodeId: string; type: 'number' | 'boolean'; label: string };
type PendingConnection = OutputPin | { kind: 'input'; nodeId: string; label: string } | DataPin;
const pendingConnection = ref<PendingConnection | null>(null);
const hoveredPin = ref<string | null>(null);
const hoveredWire = ref<string | null>(null);
const selectedWire = ref<string | null>(null);
const contextMenu = ref<{
  x: number;
  y: number;
  items: { label: string; group?: string; run: () => void }[];
  searchable?: boolean;
} | null>(null);
const menuQuery = ref('');
const menuGroup = ref('');
const menuGroups = computed(() => [
  ...new Set(contextMenu.value?.items.flatMap(item => (item.group ? [item.group] : [])) ?? []),
]);
const menuItems = computed(
  () =>
    contextMenu.value?.items.filter(
      item =>
        !contextMenu.value?.searchable ||
        (menuQuery.value.trim()
          ? `${item.group ?? ''} ${item.label}`
              .toLowerCase()
              .includes(menuQuery.value.trim().toLowerCase())
          : !item.group || item.group === menuGroup.value),
    ) ?? [],
);
let pinGesture:
  | {
      pointerId: number;
      startX: number;
      startY: number;
      previous: PendingConnection | null;
      moved: boolean;
    }
  | undefined;
let dragCapture: HTMLElement | undefined;
let suppressContextMenu = false;
const pointer = reactive({ x: 0, y: 0 });
let resizeObserver: ResizeObserver | undefined;
let cameraInteracted = false;
let drag:
  | {
      kind: 'pan';
      pointerId: number;
      startX: number;
      startY: number;
      x: number;
      y: number;
      moved: boolean;
    }
  | {
      kind: 'node';
      pointerId: number;
      layoutId: string;
      startX: number;
      startY: number;
      x: number;
      y: number;
      moved: boolean;
    }
  | undefined;

// 动作内容与位置分开计算，拖动节点不会重新扫描整张图的参数或控制出口。
const nodeMetadata = computed(() =>
  Object.entries(props.graph.nodes).map(([id, node]) => {
    const title = actionNodeTitle(node.action.kind);
    const ports = listGraphPorts(node).map(port => {
      if (port.path[0] === 'next')
        return {
          ...port,
          label: t('actionGraphEditor.next'),
        };
      const fieldPath = port.path.slice(1, -1);
      const index = fieldPath.find(part => /^\d+$/.test(part));
      return {
        ...port,
        label: `${fieldName(fieldPath)}${index === undefined ? '' : ` ${Number(index) + 1}`}`,
      };
    });
    return {
      id,
      layoutId: layoutId(actionLayoutIds, 'action', id),
      width: NODE_WIDTH,
      kind: node.action.kind,
      title,
      dataInputs: listDataInputs(node.action),
      ports,
      height:
        HEADER_HEIGHT +
        Math.max(1, ports.length, listDataInputs(node.action).length + 1) * PORT_HEIGHT +
        12,
      isBranch: ports.length > 1,
      isCall: node.action.kind === 'callMacro' || node.action.kind === 'callResource',
    };
  }),
);
const nodeMetadataById = computed(() => new Map(nodeMetadata.value.map(node => [node.id, node])));
const dataMetadata = computed(() =>
  Object.entries(props.graph.dataNodes ?? {}).map(([id, node]) => {
    const inputs = dataNodeInputs(node);
    const variable = node.expression.kind === 'blackboard' || node.expression.kind === 'parameter';
    const title = dataNodeTitle(node);
    const symbol = compactDataSymbol(node);
    const inputTop = symbol ? 8 : HEADER_HEIGHT;
    const height = variable
      ? VARIABLE_HEIGHT
      : inputTop + Math.max(1, inputs.length) * PORT_HEIGHT + 12;
    return {
      id,
      layoutId: layoutId(dataLayoutIds, 'data', id),
      width: NODE_WIDTH,
      height,
      inputTop,
      symbol,
      outputY: variable || symbol ? height / 2 : HEADER_HEIGHT + PORT_HEIGHT / 2,
      variableName:
        node.expression.kind === 'blackboard'
          ? node.expression.key
          : node.expression.kind === 'parameter'
            ? node.expression.parameter
            : '',
      variable,
      parameter: node.expression.kind === 'parameter',
      inputs,
      type: node.type,
      title,
      effects: dataNodeHasEffects(props.graph, id),
    };
  }),
);
const dataMetadataById = computed(() => new Map(dataMetadata.value.map(node => [node.id, node])));
const dataModels = computed(() =>
  dataMetadata.value.map(node => ({
    ...node,
    ...(positions.get(node.layoutId) ?? { x: 0, y: 0 }),
  })),
);
function dataInputPin(
  owner: 'action' | 'data',
  nodeId: string,
  input: ReturnType<typeof listDataInputs>[number],
): DataPin {
  return {
    kind: 'data-input',
    owner,
    nodeId,
    path: input.path,
    type: input.type,
    label: dataInputLabel(owner, nodeId, input.path),
  };
}
function dataInputLabel(owner: 'action' | 'data', nodeId: string, path: readonly string[]): string {
  const action = owner === 'action' ? props.graph.nodes[nodeId]?.action : undefined;
  if (action?.kind === 'modifyActionValue' && path.join('.') === 'parameters.value')
    return action.parameters.key;
  return fieldName(path);
}
function dataOutputPin(node: { id: string; type: 'number' | 'boolean' }): DataPin {
  return { kind: 'data-output', nodeId: node.id, type: node.type, label: '结果' };
}
const dataConnections = computed(() => {
  const owners = [
    ...nodeMetadata.value.map(n => ({
      ...n,
      owner: 'action' as const,
      inputs: n.dataInputs,
      offset: 1,
    })),
    ...dataMetadata.value.map(n => ({ ...n, owner: 'data' as const, offset: 0 })),
  ];
  return owners.flatMap(node =>
    node.inputs.flatMap((input, i) => {
      const from = input.source === null ? undefined : dataLayoutIds.get(input.source);
      if (!from) return [];
      return [
        {
          id: JSON.stringify([node.owner, node.id, input.path]),
          from,
          to: node.layoutId,
          input: dataInputPin(node.owner, node.id, input),
          source: input.source!,
          y:
            ('inputTop' in node ? node.inputTop : HEADER_HEIGHT) +
            (i + node.offset + 0.5) * PORT_HEIGHT,
        },
      ];
    }),
  );
});
const dataCurves = computed(() =>
  dataConnections.value.map(edge => {
    const from = positions.get(edge.from) ?? { x: 0, y: 0 };
    const to = positions.get(edge.to) ?? { x: 0, y: 0 };
    return {
      ...edge,
      path: curve(
        from.x + NODE_WIDTH,
        from.y + dataMetadataById.value.get(edge.source)!.outputY,
        to.x,
        to.y + edge.y,
      ),
    };
  }),
);
const entryMetadata = computed(() =>
  props.entryGroups.map(group => {
    const isTimeline = group.id === 'timeline';
    // 每个正式调度完整显示为一行和一个输出，保持原配置顺序与独立调用身份。
    const rows = group.entries.map((entry, index) => {
      const targetTitle =
        entry.targetId === null
          ? '尚未连接动作'
          : (nodeMetadataById.value.get(entry.targetId)?.title ?? entry.targetId);
      return {
        id: entry.id,
        index,
        targetId: entry.targetId,
        targetTitle,
        entryIds: [entry.id],
        timeLabel:
          entry.startFrame === undefined
            ? entry.label
            : entry.endFrame === undefined
              ? `${entry.startFrame}f`
              : `${entry.startFrame}–${entry.endFrame}f`,
        tooltip:
          entry.startFrame === undefined
            ? `${entry.label} · ${targetTitle}`
            : `第 ${entry.startFrame} 帧启动，${entry.endFrame === undefined ? '未单独设置结束帧' : `第 ${entry.endFrame} 帧结束`}（相对此入口的触发时刻） · ${targetTitle}`,
        height: ENTRY_ROW_HEIGHT,
        top: HEADER_HEIGHT + index * ENTRY_ROW_HEIGHT,
        outputY: HEADER_HEIGHT + (index + 0.5) * ENTRY_ROW_HEIGHT,
      };
    });
    return {
      id: group.id,
      label: group.label,
      count: group.entries.length,
      isTimeline,
      layoutId: layoutId(entryLayoutIds, 'entry', group.id),
      width: ENTRY_WIDTH,
      height: HEADER_HEIGHT + rows.length * ENTRY_ROW_HEIGHT + 12,
      rows,
    };
  }),
);
const nodeModels = computed(() =>
  nodeMetadata.value.map(node => ({
    ...node,
    ...(positions.get(node.layoutId) ?? { x: 0, y: 0 }),
  })),
);
const entryModels = computed(() =>
  entryMetadata.value.map(group => ({
    ...group,
    ...(positions.get(group.layoutId) ?? { x: 0, y: 0 }),
  })),
);
const nodeById = computed(() => new Map(nodeModels.value.map(node => [node.id, node])));
const entryById = computed(() => new Map(entryModels.value.map(group => [group.id, group])));
function pinKey(pin: PendingConnection): string {
  if (pin.kind === 'data-input') return JSON.stringify([pin.kind, pin.owner, pin.nodeId, pin.path]);
  if (pin.kind === 'data-output') return JSON.stringify([pin.kind, pin.nodeId]);
  return JSON.stringify(
    pin.kind === 'action'
      ? ['action', pin.nodeId, pin.path]
      : pin.kind === 'entry'
        ? ['entry', pin.groupId, pin.entryIds]
        : ['input', pin.nodeId],
  );
}
function actionPin(nodeId: string, port: ReturnType<typeof listGraphPorts>[number]): OutputPin {
  return { kind: 'action', nodeId, path: port.path, label: port.label };
}
function entryPin(groupId: string, entryId: string): OutputPin {
  return { kind: 'entry', groupId, entryIds: [entryId], label: '调度出口' };
}
function inputPin(nodeId: string): PendingConnection {
  return { kind: 'input', nodeId, label: '执行入口' };
}
const pins = computed(() => {
  const result = new Map<string, PendingConnection>();
  for (const node of dataMetadata.value) {
    const output = dataOutputPin(node);
    result.set(pinKey(output), output);
    for (const input of node.inputs) {
      const pin = dataInputPin('data', node.id, input);
      result.set(pinKey(pin), pin);
    }
  }
  for (const node of nodeMetadata.value) {
    for (const input of node.dataInputs) {
      const pin = dataInputPin('action', node.id, input);
      result.set(pinKey(pin), pin);
    }
    const input = inputPin(node.id);
    result.set(pinKey(input), input);
    for (const port of node.ports) {
      const output = actionPin(node.id, port);
      result.set(pinKey(output), output);
    }
  }
  for (const group of entryMetadata.value)
    for (const row of group.rows) {
      const output = entryPin(group.id, row.id);
      result.set(pinKey(output), output);
    }
  return result;
});
const selectedEntryTarget = computed(() => {
  if (props.selectedEntryId === null) return null;
  for (const group of entryMetadata.value) {
    const row = group.rows.find(row => row.entryIds.includes(props.selectedEntryId!));
    if (row !== undefined) return row.targetId;
  }
  return null;
});
const layoutMetadata = computed(() => [
  ...nodeMetadata.value,
  ...entryMetadata.value,
  ...dataMetadata.value,
]);
const layoutModels = computed(() => [
  ...nodeModels.value,
  ...entryModels.value,
  ...dataModels.value,
]);
const visibleWorldBounds = computed(() => {
  const margin = 180 / camera.zoom;
  return {
    left: -camera.x / camera.zoom - margin,
    top: -camera.y / camera.zoom - margin,
    right: (viewportSize.width - camera.x) / camera.zoom + margin,
    bottom: (viewportSize.height - camera.y) / camera.zoom + margin,
  };
});
function intersectsViewport(node: {
  x: number;
  y: number;
  width: number;
  height: number;
}): boolean {
  const view = visibleWorldBounds.value;
  // 使用完整矩形；标题在视口上方时，超高时间线的下半部仍然可能覆盖整个视口。
  return (
    node.x + node.width >= view.left &&
    node.x <= view.right &&
    node.y + node.height >= view.top &&
    node.y <= view.bottom
  );
}
const visibleNodes = computed(() => nodeModels.value.filter(intersectsViewport));
const visibleDataNodes = computed(() => dataModels.value.filter(intersectsViewport));
const visibleEntries = computed(() => entryModels.value.filter(intersectsViewport));
const bounds = computed(() => {
  if (layoutModels.value.length === 0) return { x: 0, y: 0, width: NODE_WIDTH, height: 140 };
  const left = Math.min(...layoutModels.value.map(node => node.x));
  const top = Math.min(...layoutModels.value.map(node => node.y));
  return {
    x: left,
    y: top,
    width: Math.max(...layoutModels.value.map(node => node.x + node.width)) - left,
    height: Math.max(...layoutModels.value.map(node => node.y + node.height)) - top,
  };
});

function curve(fromX: number, fromY: number, toX: number, toY: number): string {
  const bend = Math.max(70, Math.abs(toX - fromX) * 0.46);
  return `M ${fromX} ${fromY} C ${fromX + bend} ${fromY}, ${toX - bend} ${toY}, ${toX} ${toY}`;
}
function outputPoint(node: (typeof nodeModels.value)[number], index: number) {
  return { x: node.x + NODE_WIDTH, y: node.y + HEADER_HEIGHT + PORT_HEIGHT * (index + 0.5) };
}
const edgeTopology = computed(() => [
  ...nodeMetadata.value.flatMap(node =>
    node.ports.flatMap((port, index) => {
      if (port.target === null) return [];
      const target = actionLayoutIds.get(port.target);
      if (target === undefined || !Object.hasOwn(props.graph.nodes, port.target)) return [];
      return [
        {
          id: JSON.stringify([node.id, port.path]),
          from: node.layoutId,
          to: target,
          fromAction: node.id,
          toAction: port.target,
          entryIds: [] as readonly string[],
          sourcePin: actionPin(node.id, port),
          width: NODE_WIDTH,
          outputY: HEADER_HEIGHT + PORT_HEIGHT * (index + 0.5),
        },
      ];
    }),
  ),
  ...entryMetadata.value.flatMap(group =>
    group.rows.flatMap(row => {
      if (row.targetId === null) return [];
      const target = actionLayoutIds.get(row.targetId);
      if (target === undefined || !Object.hasOwn(props.graph.nodes, row.targetId)) return [];
      return [
        {
          id: JSON.stringify(['entry-edge', group.id, row.id]),
          from: group.layoutId,
          to: target,
          fromAction: null,
          toAction: row.targetId,
          entryIds: row.entryIds,
          sourcePin: entryPin(group.id, row.id),
          width: ENTRY_WIDTH,
          outputY: row.outputY,
        },
      ];
    }),
  ),
]);
const edges = computed(() =>
  edgeTopology.value.map(edge => {
    const from = positions.get(edge.from) ?? { x: 0, y: 0 };
    const to = positions.get(edge.to) ?? { x: 0, y: 0 };
    const selected =
      selectedWire.value !== null
        ? edge.id === selectedWire.value
        : props.selectedEntryId !== null
          ? edge.entryIds.includes(props.selectedEntryId)
          : props.selectedId !== null &&
            (edge.fromAction === props.selectedId || edge.toAction === props.selectedId);
    return {
      ...edge,
      selected,
      hovered:
        hoveredWire.value === edge.id ||
        hoveredPin.value === pinKey(edge.sourcePin) ||
        hoveredPin.value === pinKey(inputPin(edge.toAction)),
      faded:
        (selectedWire.value !== null ||
          props.selectedEntryId !== null ||
          props.selectedId !== null) &&
        !selected,
      path: curve(
        from.x + edge.width,
        from.y + edge.outputY,
        to.x,
        to.y + HEADER_HEIGHT + PORT_HEIGHT / 2,
      ),
    };
  }),
);
const pendingCurve = computed(() => {
  const pending = pendingConnection.value;
  if (pending?.kind === 'data-input' || pending?.kind === 'data-output') {
    const metadata =
      pending.kind === 'data-output' || pending.owner === 'data'
        ? dataMetadata.value.find(n => n.id === pending.nodeId)
        : nodeMetadata.value.find(n => n.id === pending.nodeId);
    if (!metadata) return null;
    const position = positions.get(metadata.layoutId);
    if (!position) return null;
    let row = 0;
    if (pending.kind === 'data-input') {
      const inputs = 'inputs' in metadata ? metadata.inputs : metadata.dataInputs;
      row =
        inputs.findIndex(p => JSON.stringify(p.path) === JSON.stringify(pending.path)) +
        (pending.owner === 'action' ? 1 : 0);
    }
    const x = position.x + (pending.kind === 'data-output' ? NODE_WIDTH : 0);
    const y =
      position.y +
      (pending.kind === 'data-output' && 'outputY' in metadata
        ? metadata.outputY
        : ('inputTop' in metadata ? metadata.inputTop : HEADER_HEIGHT) + (row + 0.5) * PORT_HEIGHT);
    const mouseX = (pointer.x - camera.x) / camera.zoom;
    const mouseY = (pointer.y - camera.y) / camera.zoom;
    return pending.kind === 'data-output'
      ? curve(x, y, mouseX, mouseY)
      : curve(mouseX, mouseY, x, y);
  }
  if (pending === null) return null;
  if (pending.kind === 'input') {
    const node = nodeById.value.get(pending.nodeId);
    if (!node) return null;
    return curve(
      (pointer.x - camera.x) / camera.zoom,
      (pointer.y - camera.y) / camera.zoom,
      node.x,
      node.y + HEADER_HEIGHT + PORT_HEIGHT / 2,
    );
  }
  let from: { x: number; y: number };
  if (pending.kind === 'action') {
    const node = nodeById.value.get(pending.nodeId);
    if (node === undefined) return null;
    const index = node.ports.findIndex(
      port => JSON.stringify(port.path) === JSON.stringify(pending.path),
    );
    if (index < 0) return null;
    from = outputPoint(node, index);
  } else {
    const group = entryById.value.get(pending.groupId);
    const row = group?.rows.find(row => row.entryIds[0] === pending.entryIds[0]);
    if (group === undefined || row === undefined) return null;
    from = { x: group.x + ENTRY_WIDTH, y: group.y + row.outputY };
  }
  return curve(
    from.x,
    from.y,
    (pointer.x - camera.x) / camera.zoom,
    (pointer.y - camera.y) / camera.zoom,
  );
});
const worldStyle = computed(() => ({
  transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
  width: `${Math.max(1, bounds.value.x + bounds.value.width)}px`,
  height: `${Math.max(1, bounds.value.y + bounds.value.height)}px`,
}));
const gridStyle = computed(() => ({
  backgroundSize: `${32 * camera.zoom}px ${32 * camera.zoom}px`,
  backgroundPosition: `${camera.x}px ${camera.y}px`,
}));

function fitToBounds(): void {
  if (!viewportSize.width || !viewportSize.height) return;
  const area = bounds.value;
  camera.zoom = Math.max(
    MIN_ZOOM,
    Math.min(1, (viewportSize.width - 100) / area.width, (viewportSize.height - 150) / area.height),
  );
  camera.x = (viewportSize.width - area.width * camera.zoom) / 2 - area.x * camera.zoom;
  camera.y = (viewportSize.height - area.height * camera.zoom) / 2 - area.y * camera.zoom;
}

function fit(): void {
  cameraInteracted = true;
  fitToBounds();
}

function focusNode(id: string): void {
  const node = nodeById.value.get(id);
  if (node === undefined) return;
  cameraInteracted = true;
  camera.zoom = Math.max(0.75, camera.zoom);
  camera.x = viewportSize.width / 2 - (node.x + NODE_WIDTH / 2) * camera.zoom;
  camera.y = viewportSize.height / 2 - (node.y + node.height / 2) * camera.zoom;
}
function focusData(id: string): void {
  const node = dataModels.value.find(node => node.id === id);
  if (!node) return;
  cameraInteracted = true;
  camera.zoom = Math.max(0.75, camera.zoom);
  camera.x = viewportSize.width / 2 - (node.x + NODE_WIDTH / 2) * camera.zoom;
  camera.y = viewportSize.height / 2 - (node.y + node.height / 2) * camera.zoom;
}

function focusEntry(id: string): void {
  for (const group of entryModels.value) {
    const row = group.rows.find(row => row.entryIds.includes(id));
    if (row === undefined) continue;
    cameraInteracted = true;
    camera.zoom = Math.max(0.75, camera.zoom);
    camera.x = viewportSize.width / 2 - (group.x + ENTRY_WIDTH / 2) * camera.zoom;
    camera.y = viewportSize.height / 2 - (group.y + row.top + row.height / 2) * camera.zoom;
    return;
  }
}

function revealEntryIfOutside(id: string): void {
  if (!viewportSize.width || !viewportSize.height) return;
  for (const group of entryModels.value) {
    const row = group.rows.find(row => row.id === id);
    if (row === undefined) continue;
    const left = camera.x + group.x * camera.zoom;
    const right = left + group.width * camera.zoom;
    const top = camera.y + (group.y + row.top) * camera.zoom;
    const bottom = top + row.height * camera.zoom;
    if (bottom < 50 || top > viewportSize.height - 12 || right < 0 || left > viewportSize.width)
      focusEntry(id);
    return;
  }
}

watch(
  () => props.selectedEntryId,
  id => {
    if (id !== null) revealEntryIfOutside(id);
  },
  { flush: 'post' },
);

function focusTimeline(): void {
  const timeline = entryModels.value.find(group => group.isTimeline);
  if (timeline === undefined) return;
  if (focusEntryGroup(timeline)) cameraInteracted = true;
}

function openTimelineEditor(): void {
  pendingConnection.value = null;
  emit('editTimeline');
}

function cancelConnection(): void {
  cancelGesture();
  pendingConnection.value = null;
  pinGesture = undefined;
  hoveredPin.value = null;
  selectedWire.value = null;
  if (dragCapture && !drag) releaseCapture();
}

watch([() => props.selectedId, () => props.selectedEntryId], ([nodeId, entryId]) => {
  if (nodeId !== null || entryId !== null) selectedWire.value = null;
});

function focusFirstEntryGroup(): void {
  const first = entryModels.value[0];
  if (first === undefined) {
    fitToBounds();
    return;
  }
  focusEntryGroup(first);
}

function focusEntryGroup(group: { x: number; y: number; width: number; height: number }): boolean {
  if (viewport.value) {
    viewportSize.width = viewport.value.clientWidth;
    viewportSize.height = viewport.value.clientHeight;
  }
  // 弹窗尚未展开时不拿零宽高计算缩放；可用尺寸到达后由 ResizeObserver 再定位。
  if (viewportSize.width < 200 || viewportSize.height < 200) return false;
  const top = 60;
  camera.zoom = 0.75;
  camera.x = 36 - group.x * camera.zoom;
  camera.y = top - group.y * camera.zoom;
  return true;
}

function arrange(): void {
  layoutError.value = '';
  // 布局只需要节点之间的依赖。不同引脚之间的连线仍由画布逐条绘制，
  // 不让同一对节点的重复调度在 Dagre 中生成重叠的平行边辅助节点。
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: 'LR', ranksep: 110, nodesep: 48, marginx: 40, marginy: 40 });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const node of layoutMetadata.value)
    graph.setNode(node.layoutId, { width: node.width, height: node.height });
  for (const edge of edgeTopology.value) graph.setEdge(edge.from, edge.to);
  for (const edge of dataConnections.value) graph.setEdge(edge.from, edge.to);
  // 入口节点可能有数千像素高，不能与无执行输入的数据源共享一列。
  // 这只是 Dagre 的列约束，不绘制成线，也不进入技能图的执行关系。
  for (const entry of entryMetadata.value)
    for (const node of dataMetadata.value)
      graph.setEdge(entry.layoutId, node.layoutId, { weight: 1, minlen: 1 });
  // 最早调用某节点的调度决定整条后继分支的上下次序；共享后继只登记一次。
  const scheduleOrder = new Map<string, number>();
  const timeline = entryMetadata.value.find(group => group.isTimeline);
  for (const [index, row] of (timeline?.rows ?? []).entries()) {
    const target = row.targetId === null ? undefined : actionLayoutIds.get(row.targetId);
    if (target === undefined || !graph.hasNode(target)) continue;
    const pending = [target];
    while (pending.length > 0) {
      const id = pending.pop()!;
      if (scheduleOrder.has(id)) continue;
      scheduleOrder.set(id, index);
      pending.push(...(graph.successors(id) ?? []));
    }
  }
  // 数据依赖方向与执行方向相反：从消费者向输入追溯，使条件和黑板读取
  // 跟随使用它们的最早调度排序，但数据连线仍保留来源 → 消费者的真实方向。
  const inputsByConsumer = new Map<string, string[]>();
  for (const edge of dataConnections.value) {
    const inputs = inputsByConsumer.get(edge.to) ?? [];
    inputs.push(edge.from);
    inputsByConsumer.set(edge.to, inputs);
  }
  const consumers = [...scheduleOrder.entries()].sort((a, b) => a[1] - b[1]);
  for (const [consumer, priority] of consumers) {
    const pending = [...(inputsByConsumer.get(consumer) ?? [])];
    while (pending.length) {
      const id = pending.pop()!;
      if (scheduleOrder.has(id) && scheduleOrder.get(id)! <= priority) continue;
      scheduleOrder.set(id, priority);
      pending.push(...(inputsByConsumer.get(id) ?? []));
    }
  }
  try {
    dagre.layout(graph, {
      customOrder(layoutGraph, order) {
        order(layoutGraph);
        // Dagre 只看到入口节点的中心，不知道各调度出口的上下位置。
        // 在默认排序之后，按首次调度顺序交换同列动作的既有位置。
        const layoutOrder = new Map(scheduleOrder);
        for (const id of layoutGraph.nodes()) {
          const node = layoutGraph.node(id);
          if (node.dummy !== 'edge' && node.dummy !== 'edge-label') continue;
          const edge = node.edgeObj;
          if (edge === undefined) continue;
          const priority = scheduleOrder.get(edge.v) ?? scheduleOrder.get(edge.w);
          if (priority !== undefined) layoutOrder.set(id, priority);
        }
        const targetsByRank = new Map<number, string[]>();
        for (const target of layoutOrder.keys()) {
          const node = layoutGraph.node(target);
          const rank = node?.rank;
          if (rank === undefined || node.order === undefined) continue;
          const targets = targetsByRank.get(rank) ?? [];
          targets.push(target);
          targetsByRank.set(rank, targets);
        }
        for (const targets of targetsByRank.values()) {
          const slots = targets.map(id => layoutGraph.node(id).order!).sort((a, b) => a - b);
          targets.sort(
            (a, b) =>
              layoutOrder.get(a)! - layoutOrder.get(b)! ||
              layoutGraph.node(a).order! - layoutGraph.node(b).order!,
          );
          targets.forEach((id, index) => {
            layoutGraph.node(id).order = slots[index]!;
          });
        }
        // 长连线的辅助节点跟随其分支，避免它们留在反向位置把整张图撑开。
        // 只置换既有位置，不创建执行边或复制共享节点。
      },
    });
    for (const node of layoutMetadata.value) {
      const placed = graph.node(node.layoutId);
      positions.set(node.layoutId, { x: placed.x - node.width / 2, y: placed.y - node.height / 2 });
    }
  } catch (cause) {
    console.error('Action graph layout failed', cause);
    // 布局失败只影响显示，不改动程序，也不让整个编辑器无法打开。
    layoutError.value = '自动布局未完成，可拖动节点调整位置';
    let rowTop = 40;
    let rowHeight = 0;
    layoutMetadata.value.forEach((node, index) => {
      if (index > 0 && index % 4 === 0) {
        rowTop += rowHeight + 50;
        rowHeight = 0;
      }
      positions.set(node.layoutId, { x: 40 + (index % 4) * (ENTRY_WIDTH + 90), y: rowTop });
      rowHeight = Math.max(rowHeight, node.height);
    });
  }
}

function autoLayout(): void {
  if (props.readonly) return;
  if (!props.beforeInteraction()) return;
  arrange();
  publishPositions(true);
  fit();
}

function publishPositions(userEdit: boolean): void {
  emit(
    'changePresentation',
    {
      nodePositions: Object.fromEntries(
        nodeMetadata.value.map(node => [node.id, { ...positions.get(node.layoutId)! }]),
      ),
      dataPositions: Object.fromEntries(
        dataMetadata.value.map(node => [node.id, { ...positions.get(node.layoutId)! }]),
      ),
      entryPositions: Object.fromEntries(
        entryMetadata.value.map(node => [node.id, { ...positions.get(node.layoutId)! }]),
      ),
    },
    userEdit,
  );
}

watch(
  [() => props.graph, () => props.entryGroups, () => props.presentation],
  () => {
    positions.clear();
    for (const node of dataMetadata.value) {
      const point = props.presentation?.dataPositions?.[node.id];
      if (point) positions.set(node.layoutId, { ...point });
    }
    for (const node of nodeMetadata.value) {
      const point = props.presentation?.nodePositions[node.id];
      if (point) positions.set(node.layoutId, { ...point });
    }
    for (const node of entryMetadata.value) {
      const point = props.presentation?.entryPositions[node.id];
      if (point) positions.set(node.layoutId, { ...point });
    }
    const currentIds = new Set(layoutMetadata.value.map(item => item.layoutId));
    for (const id of positions.keys()) if (!currentIds.has(id)) positions.delete(id);
    if (positions.size === 0) {
      arrange();
    } else if (positions.size < currentIds.size) {
      const saved = new Map(positions);
      // 新节点同样由完整 DAG 计算位置。以最近的已有消费者为参照平移新增
      // 分支，只采用新节点的坐标，避免重新打开时覆盖用户已调整的布局。
      arrange();
      const arranged = new Map(positions);
      const outgoing = new Map<string, string[]>();
      for (const edge of [...edgeTopology.value, ...dataConnections.value]) {
        const targets = outgoing.get(edge.from) ?? [];
        targets.push(edge.to);
        outgoing.set(edge.from, targets);
      }
      for (const id of currentIds) {
        if (saved.has(id)) continue;
        const queue = [...(outgoing.get(id) ?? [])];
        const seen = new Set([id]);
        let anchor: string | undefined;
        for (let i = 0; i < queue.length; i++) {
          const target = queue[i]!;
          if (seen.has(target)) continue;
          seen.add(target);
          if (saved.has(target)) {
            anchor = target;
            break;
          }
          queue.push(...(outgoing.get(target) ?? []));
        }
        if (anchor) {
          const point = arranged.get(id)!;
          const before = saved.get(anchor)!;
          const after = arranged.get(anchor)!;
          positions.set(id, { x: point.x + before.x - after.x, y: point.y + before.y - after.y });
        }
      }
      for (const [id, point] of saved) positions.set(id, point);
    }
    publishPositions(false);
    const pending = pendingConnection.value;
    if (pending?.kind === 'action' && !Object.hasOwn(props.graph.nodes, pending.nodeId))
      pendingConnection.value = null;
    if (
      pending?.kind === 'entry' &&
      !props.entryGroups.some(
        group =>
          group.id === pending.groupId &&
          pending.entryIds.every(id => group.entries.some(entry => entry.id === id)),
      )
    )
      pendingConnection.value = null;
  },
  { immediate: true },
);

function updatePointer(event: PointerEvent): void {
  const rect = viewport.value?.getBoundingClientRect();
  if (rect === undefined) return;
  pointer.x = event.clientX - rect.left;
  pointer.y = event.clientY - rect.top;
}

function startPan(event: PointerEvent): void {
  if (drag || pinGesture) return;
  if (event.button === 0) {
    if (!props.beforeInteraction()) return;
    contextMenu.value = null;
    selectedWire.value = null;
    cancelConnection();
    emit('clearSelection');
  }
  if (event.button !== 0 && event.button !== 1 && event.button !== 2) return;
  contextMenu.value = null;
  cameraInteracted = true;
  event.preventDefault();
  viewport.value?.focus({ preventScroll: true });
  updatePointer(event);
  drag = {
    kind: 'pan',
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    x: camera.x,
    y: camera.y,
    moved: false,
  };
  dragCapture = event.currentTarget as HTMLElement;
  activePointerId = event.pointerId;
  dragCapture.setPointerCapture(event.pointerId);
}

function startItemDrag(event: PointerEvent, id: string, actionId?: string): void {
  if (props.readonly && event.button === 0) return;
  if (event.button === 1 || event.button === 2) {
    startPan(event);
    return;
  }
  if (event.button !== 0 || drag || pinGesture || !props.beforeInteraction()) return;
  contextMenu.value = null;
  selectedWire.value = null;
  cameraInteracted = true;
  event.preventDefault();
  viewport.value?.focus({ preventScroll: true });
  if (actionId !== undefined) emit('select', actionId);
  const position = positions.get(id);
  if (position === undefined) return;
  drag = {
    kind: 'node',
    pointerId: event.pointerId,
    layoutId: id,
    startX: event.clientX,
    startY: event.clientY,
    x: position.x,
    y: position.y,
    moved: false,
  };
  // 由标题自身捕获，移动事件仍冒泡到画布；双击仍归属标题，可打开时间线编辑区。
  dragCapture = event.currentTarget as HTMLElement;
  activePointerId = event.pointerId;
  dragCapture.setPointerCapture(event.pointerId);
}

function pointerMove(event: PointerEvent): void {
  updatePointer(event);
  if (pinGesture?.pointerId === event.pointerId) {
    if (Math.hypot(event.clientX - pinGesture.startX, event.clientY - pinGesture.startY) > 3)
      pinGesture.moved = true;
    hoveredPin.value = pinAtPoint(event)?.key ?? null;
    return;
  }
  if (drag === undefined || drag.pointerId !== event.pointerId) return;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  if (Math.hypot(dx, dy) > 3) drag.moved = true;
  if (drag.kind === 'pan') {
    camera.x = drag.x + dx;
    camera.y = drag.y + dy;
  } else {
    positions.set(drag.layoutId, { x: drag.x + dx / camera.zoom, y: drag.y + dy / camera.zoom });
  }
}

function pointerUp(event: PointerEvent): void {
  if (pinGesture?.pointerId === event.pointerId) {
    const gesture = pinGesture;
    const origin = pendingConnection.value;
    const target = pinAtPoint(event)?.pin;
    pinGesture = undefined;
    releaseCapture();
    if (gesture.moved) {
      if (origin && target) connectPins(origin, target);
      pendingConnection.value = null;
    } else if (gesture.previous && origin) {
      if (pinKey(gesture.previous) === pinKey(origin)) pendingConnection.value = null;
      else connectPins(gesture.previous, origin);
    }
    return;
  }
  if (drag === undefined || drag.pointerId !== event.pointerId) return;
  suppressContextMenu = event.button === 2 && drag.moved;
  if (drag.kind === 'pan' && !drag.moved) pendingConnection.value = null;
  if (drag.kind === 'node' && drag.moved) publishPositions(true);
  drag = undefined;
  releaseCapture();
}

function releaseCapture(): void {
  const capture = dragCapture;
  dragCapture = undefined;
  // 正常结束先清空手势，再释放捕获，避免 lostpointercapture 把已提交操作当成取消。
  if (capture) {
    if (activePointerId !== undefined && capture.hasPointerCapture(activePointerId))
      capture.releasePointerCapture(activePointerId);
  }
  activePointerId = undefined;
}
let activePointerId: number | undefined;
function cancelGesture(event?: Event): void {
  if (event instanceof PointerEvent && activePointerId !== event.pointerId) return;
  if (drag?.kind === 'node') positions.set(drag.layoutId, { x: drag.x, y: drag.y });
  else if (drag?.kind === 'pan') {
    camera.x = drag.x;
    camera.y = drag.y;
  }
  drag = undefined;
  pinGesture = undefined;
  pendingConnection.value = null;
  contextMenu.value = null;
  hoveredPin.value = null;
  releaseCapture();
}

function pinAtPoint(event: PointerEvent) {
  const element = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest<HTMLElement>('[data-graph-pin]');
  if (!element || !viewport.value?.contains(element)) return;
  const key = element.dataset.graphPin!;
  const pin = pins.value.get(key);
  return pin ? { key, pin } : undefined;
}
function connectPins(first: PendingConnection, second: PendingConnection): void {
  if (props.readonly) return;
  if (
    first.kind === 'data-input' ||
    first.kind === 'data-output' ||
    second.kind === 'data-input' ||
    second.kind === 'data-output'
  ) {
    const input =
      first.kind === 'data-input' ? first : second.kind === 'data-input' ? second : null;
    const output =
      first.kind === 'data-output' ? first : second.kind === 'data-output' ? second : null;
    if (input && output && props.beforeInteraction()) {
      if (input.type !== output.type) {
        layoutError.value = '数值和布尔引脚不能相连';
        return;
      }
      emit('connectData', input.owner, input.nodeId, input.path, output.nodeId);
      pendingConnection.value = null;
    }
    return;
  }
  const input = first.kind === 'input' ? first : second.kind === 'input' ? second : null;
  const output = first.kind !== 'input' ? first : second.kind !== 'input' ? second : null;
  if (!input || !output || !props.beforeInteraction()) return;
  if (output.kind === 'action') emit('connect', output.nodeId, output.path, input.nodeId);
  else emit('connectEntry', output.entryIds, input.nodeId);
  pendingConnection.value = null;
}
function startPin(event: PointerEvent, pin: PendingConnection): void {
  if (props.readonly) return;
  if (event.button !== 0 || drag || pinGesture || !props.beforeInteraction()) return;
  event.preventDefault();
  contextMenu.value = null;
  selectedWire.value = null;
  if (event.altKey) {
    disconnectPin(pin);
    return;
  }
  updatePointer(event);
  pinGesture = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    previous: pendingConnection.value,
    moved: false,
  };
  pendingConnection.value = pin;
  activePointerId = event.pointerId;
  dragCapture = viewport.value;
  dragCapture?.setPointerCapture(event.pointerId);
  viewport.value?.focus({ preventScroll: true });
}
function activatePin(event: MouseEvent, pin: PendingConnection): void {
  if (props.readonly) return;
  // 鼠标由 pointer 手势处理；键盘激活仍可逐个选择引脚接线。
  if (event.detail !== 0 || !props.beforeInteraction()) return;
  if (pendingConnection.value) connectPins(pendingConnection.value, pin);
  else pendingConnection.value = pin;
}
function disconnectPin(pin: PendingConnection): void {
  if (props.readonly) return;
  if (!props.beforeInteraction()) return;
  if (pin.kind === 'data-input') {
    emit('connectData', pin.owner, pin.nodeId, pin.path, null);
    cancelConnection();
    return;
  }
  if (pin.kind === 'data-output') {
    layoutError.value = '请从需要断开的输入端断线；断线后使用默认常量';
    return;
  }
  if (pin.kind === 'input') emit('disconnectInput', pin.nodeId);
  else if (pin.kind === 'action') emit('connect', pin.nodeId, pin.path, null);
  else emit('connectEntry', pin.entryIds, null);
  cancelConnection();
}
function showMenu(
  event: MouseEvent,
  items: NonNullable<typeof contextMenu.value>['items'],
  searchable = false,
): void {
  if (suppressContextMenu) {
    suppressContextMenu = false;
    return;
  }
  if (!props.beforeInteraction()) return;
  const rect = viewport.value!.getBoundingClientRect();
  menuQuery.value = '';
  menuGroup.value = items.find(item => item.group)?.group ?? '';
  contextMenu.value = {
    x: Math.max(0, Math.min(event.clientX - rect.left, rect.width - (searchable ? 430 : 210))),
    y: Math.max(0, Math.min(event.clientY - rect.top, rect.height - items.length * 34 - 12)),
    items,
    searchable,
  };
  void nextTick(() =>
    viewport.value
      ?.querySelector<HTMLElement>(searchable ? '.graph-context-menu input' : '[role="menuitem"]')
      ?.focus({ preventScroll: true }),
  );
}
function menuKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    contextMenu.value = null;
    viewport.value?.focus({ preventScroll: true });
    return;
  }
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  event.preventDefault();
  const items = Array.from(
    viewport.value?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
  );
  const index = items.indexOf(document.activeElement as HTMLButtonElement);
  items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
}
function pinMenu(event: MouseEvent, pin: PendingConnection): void {
  if (pin.kind === 'data-output') {
    const connections = dataCurves.value.filter(edge => edge.source === pin.nodeId);
    showMenu(event, [
      { label: '查看数据节点', run: () => emit('selectData', pin.nodeId) },
      ...connections.map(edge => ({
        label: `定位使用者 · ${edge.input.nodeId}`,
        run: () => locateDataInput(edge.input),
      })),
      ...(props.readonly
        ? []
        : connections.map(edge => ({
            label: `断开连接 · ${edge.input.nodeId} · ${edge.input.label}`,
            run: () => disconnectPin(edge.input),
          }))),
    ]);
    return;
  }
  showMenu(event, [
    {
      label: '查看所属节点',
      run: () => {
        if (pin.kind === 'entry') focusEntry(pin.entryIds[0]!);
        else if (pin.kind === 'data-input' && pin.owner === 'data') emit('selectData', pin.nodeId);
        else emit('select', pin.nodeId);
      },
    },
    ...(props.readonly
      ? []
      : [
          {
            label:
              pin.kind === 'input'
                ? '断开全部输入连线'
                : pin.kind === 'data-input'
                  ? '断开并使用默认常量'
                  : '断开连线',
            run: () => disconnectPin(pin),
          },
        ]),
  ]);
}
function locateDataInput(pin: DataPin) {
  if (pin.kind !== 'data-input') return;
  if (pin.owner === 'data') {
    emit('selectData', pin.nodeId);
    focusData(pin.nodeId);
  } else {
    emit('select', pin.nodeId);
    focusNode(pin.nodeId);
  }
}
function dataWireMenu(event: MouseEvent, edge: (typeof dataCurves.value)[number]) {
  showMenu(event, [
    {
      label: '定位来源节点',
      run: () => {
        emit('selectData', edge.source);
        focusData(edge.source);
      },
    },
    { label: '定位目标节点', run: () => locateDataInput(edge.input) },
    ...(props.readonly
      ? []
      : [{ label: '断开并使用默认常量', run: () => disconnectPin(edge.input) }]),
  ]);
}
function dataMenu(event: MouseEvent, id: string) {
  showMenu(event, [
    { label: '查看节点属性', run: () => emit('selectData', id) },
    {
      label: '定位节点',
      run: () => {
        emit('selectData', id);
        focusData(id);
      },
    },
    ...(props.readonly ? [] : [{ label: '删除节点', run: () => emit('removeData', id) }]),
  ]);
}
function canvasMenu(event: MouseEvent) {
  const rect = viewport.value!.getBoundingClientRect();
  const point = {
    x: (event.clientX - rect.left - camera.x) / camera.zoom,
    y: (event.clientY - rect.top - camera.y) / camera.zoom,
  };
  showMenu(event, [
    ...(props.readonly
      ? []
      : [
          {
            label: t('actionGraphEditor.addNode'),
            run: () =>
              showMenu(
                event,
                props.creationItems.map(item => ({
                  label: item.label,
                  group: item.group,
                  run: () => emit('createNode', item.key, point),
                })),
                true,
              ),
          },
        ]),
    { label: '适应视口', run: fit },
    ...(props.readonly ? [] : [{ label: '自动布局', run: autoLayout }]),
  ]);
}
function nodeMenu(event: MouseEvent, id: string): void {
  showMenu(event, [
    { label: '查看节点属性', run: () => emit('select', id) },
    ...(props.graph.nodes[id]?.action.kind === 'callMacro'
      ? [{ label: '打开宏', run: () => emit('openNode', id) }]
      : []),
    {
      label: '定位节点',
      run: () => {
        emit('select', id);
        focusNode(id);
      },
    },
    ...(props.readonly ? [] : [{ label: '删除节点', run: () => emit('removeNode', id) }]),
  ]);
}
function wireMenu(event: MouseEvent, edge: (typeof edges.value)[number]): void {
  showMenu(event, [
    {
      label: '定位来源节点',
      run: () => {
        if (edge.sourcePin.kind === 'action') {
          emit('select', edge.sourcePin.nodeId);
          focusNode(edge.sourcePin.nodeId);
        } else focusEntry(edge.sourcePin.entryIds[0]!);
      },
    },
    {
      label: '定位目标节点',
      run: () => {
        emit('select', edge.toAction);
        focusNode(edge.toAction);
      },
    },
    ...(props.readonly
      ? []
      : [{ label: '断开这条连线', run: () => disconnectPin(edge.sourcePin) }]),
  ]);
}
function clickWire(event: MouseEvent, edge: (typeof edges.value)[number]): void {
  if (!props.beforeInteraction()) return;
  if (event.altKey) {
    disconnectPin(edge.sourcePin);
    return;
  }
  selectedWire.value = edge.id;
  contextMenu.value = null;
  viewport.value?.focus({ preventScroll: true });
  emit('selectConnection', edge.fromAction, edge.entryIds[0] ?? null, edge.toAction);
}
function canvasKeydown(event: KeyboardEvent): void {
  if ((event.target as HTMLElement).closest('input,textarea,select,[contenteditable]')) return;
  if (event.key === 'Escape') {
    event.stopPropagation();
    cancelGesture();
  } else if (event.key === 'Delete' && !props.readonly && props.beforeInteraction()) {
    event.preventDefault();
    const wire = edges.value.find(edge => edge.id === selectedWire.value);
    if (props.selectedDataId) emit('removeData', props.selectedDataId);
    else if (wire) disconnectPin(wire.sourcePin);
    else if (props.selectedId !== null) emit('removeNode', props.selectedId);
  } else if (event.key.toLowerCase() === 'f' || event.key === 'Home') {
    event.preventDefault();
    if (props.selectedDataId) focusData(props.selectedDataId);
    else if (props.selectedId !== null) focusNode(props.selectedId);
    else if (props.selectedEntryId !== null) focusEntry(props.selectedEntryId);
    else fit();
  }
}

function zoomAt(factor: number, x: number, y: number): void {
  cameraInteracted = true;
  const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camera.zoom * factor));
  const ratio = next / camera.zoom;
  camera.x = x - (x - camera.x) * ratio;
  camera.y = y - (y - camera.y) * ratio;
  camera.zoom = next;
}

function wheel(event: WheelEvent): void {
  const rect = viewport.value?.getBoundingClientRect();
  if (!rect) return;
  zoomAt(
    Math.exp(-Math.max(-150, Math.min(150, event.deltaY)) * 0.002),
    event.clientX - rect.left,
    event.clientY - rect.top,
  );
}

onMounted(async () => {
  window.addEventListener('blur', cancelGesture);
  await nextTick();
  if (!viewport.value) return;
  viewportSize.width = viewport.value.clientWidth;
  viewportSize.height = viewport.value.clientHeight;
  focusFirstEntryGroup();
  if (props.selectedEntryId !== null) revealEntryIfOutside(props.selectedEntryId);
  resizeObserver = new ResizeObserver(entries => {
    const entry = entries[0];
    if (!entry) return;
    viewportSize.width = entry.contentRect.width;
    viewportSize.height = entry.contentRect.height;
    if (!cameraInteracted) focusFirstEntryGroup();
  });
  resizeObserver.observe(viewport.value);
});
onBeforeUnmount(() => {
  cancelGesture();
  resizeObserver?.disconnect();
  window.removeEventListener('blur', cancelGesture);
});
function placeNode(id: string, data: boolean, point: { x: number; y: number }) {
  const layoutId = (data ? dataLayoutIds : actionLayoutIds).get(id);
  if (layoutId) {
    positions.set(layoutId, point);
    publishPositions(false);
  }
}
function dropVariable(identity: string, event: PointerEvent, readonly: boolean) {
  if (props.readonly) return;
  if (!identity || !props.beforeInteraction()) return;
  const rect = viewport.value!.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    return;
  const point = {
    x: (event.clientX - rect.left - camera.x) / camera.zoom,
    y: (event.clientY - rect.top - camera.y) / camera.zoom,
  };
  const element = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest('[data-graph-pin]');
  const pin = pins.value.get(element?.getAttribute('data-graph-pin') ?? '');
  if (pin) {
    if (pin.kind !== 'data-input' || pin.type !== 'number') {
      layoutError.value = '变量只能拖到数值输入引脚。';
      return;
    }
    emit(
      'dropVariable',
      identity,
      false,
      { x: point.x - NODE_WIDTH - 80, y: point.y },
      { owner: pin.owner, id: pin.nodeId, path: pin.path },
    );
    return;
  }
  if (event.ctrlKey || event.altKey) emit('dropVariable', identity, event.altKey, point);
  else
    showMenu(event, [
      { label: '读取变量', run: () => emit('dropVariable', identity, false, point) },
      ...(readonly
        ? []
        : [{ label: '设置变量', run: () => emit('dropVariable', identity, true, point) }]),
    ]);
}
defineExpose({
  focusNode,
  focusData,
  focusEntry,
  focusTimeline,
  cancelConnection,
  fit,
  placeNode,
  dropVariable,
});
</script>

<template>
  <div
    ref="viewport"
    class="action-graph-canvas"
    :class="{ 'is-connecting': pendingConnection !== null }"
    :style="[
      gridStyle,
      { '--node-header-height': `${HEADER_HEIGHT}px`, '--node-port-height': `${PORT_HEIGHT}px` },
    ]"
    tabindex="0"
    aria-label="动作图画布"
    @pointerdown="startPan"
    @pointermove="pointerMove"
    @pointerup="pointerUp"
    @pointercancel="cancelGesture"
    @lostpointercapture="(drag || pinGesture) && cancelGesture()"
    @wheel.prevent.stop="wheel"
    @keydown="canvasKeydown"
    @contextmenu.prevent="canvasMenu($event)"
  >
    <div class="canvas-toolbar" @pointerdown.stop>
      <span class="node-count"
        >{{ nodeModels.length }} 个动作 · {{ entryModels.length }} 组入口</span
      >
      <button
        type="button"
        title="缩小"
        @click="zoomAt(1 / 1.2, viewportSize.width / 2, viewportSize.height / 2)"
      >
        −
      </button>
      <span class="zoom-label">{{ Math.round(camera.zoom * 100) }}%</span>
      <button
        type="button"
        title="放大"
        @click="zoomAt(1.2, viewportSize.width / 2, viewportSize.height / 2)"
      >
        +
      </button>
      <button type="button" @click="fit">适应视口</button>
      <button type="button" :disabled="readonly" @click="autoLayout">自动布局</button>
    </div>

    <div v-if="!nodeModels.length && !entryModels.length" class="empty-graph">
      这张图还没有节点，请从左侧添加动作。
    </div>

    <div class="graph-world" :style="worldStyle">
      <svg class="graph-wires" aria-hidden="true">
        <path
          v-for="edge in edges"
          :key="edge.id"
          :d="edge.path"
          class="execution-wire"
          :class="{
            selected: edge.selected,
            faded: edge.faded,
            hovered: edge.hovered,
            'entry-wire': edge.entryIds.length > 0,
          }"
        />
        <path
          v-for="edge in edges"
          :key="`hit:${edge.id}`"
          :d="edge.path"
          class="wire-hit"
          :style="{ strokeWidth: `${12 / camera.zoom}px` }"
          @pointerdown.stop
          @pointerenter="hoveredWire = edge.id"
          @pointerleave="hoveredWire = null"
          @click.stop="clickWire($event, edge)"
          @contextmenu.prevent.stop="wireMenu($event, edge)"
        />
        <path
          v-for="edge in dataCurves"
          :key="`data:${edge.id}`"
          :d="edge.path"
          class="data-wire"
          :class="[
            edge.input.type,
            {
              highlighted:
                selectedDataId === edge.source ||
                selectedDataId === edge.input.nodeId ||
                selectedId === edge.input.nodeId,
            },
          ]"
        />
        <path
          v-for="edge in dataCurves"
          :key="`data-hit:${edge.id}`"
          :d="edge.path"
          class="wire-hit"
          :style="{ strokeWidth: `${12 / camera.zoom}px` }"
          @pointerdown.stop
          @click.stop="emit('selectData', edge.source)"
          @contextmenu.prevent.stop="dataWireMenu($event, edge)"
        />
        <path v-if="pendingCurve" :d="pendingCurve" class="execution-wire pending" />
      </svg>
      <article
        v-for="node in visibleDataNodes"
        :key="node.layoutId"
        class="graph-node data-node"
        @contextmenu.prevent.stop="dataMenu($event, node.id)"
        :class="[
          node.type,
          {
            selected: selectedDataId === node.id,
            variable: node.variable,
            'compact-operation': !!node.symbol,
            effectful: node.effects,
          },
        ]"
        :style="{
          left: `${node.x}px`,
          top: `${node.y}px`,
          width: `${node.width}px`,
          height: `${node.height}px`,
        }"
        @pointerdown.stop="
          emit('selectData', node.id);
          startItemDrag($event, node.layoutId);
        "
      >
        <span v-if="node.variable" class="variable-name">{{ node.variableName }}</span>
        <span v-else-if="node.symbol" class="operation-symbol" :aria-label="node.title">{{
          node.symbol
        }}</span>
        <GraphNodeHeader v-else :title="node.title" :instance-id="node.id" />
        <span
          v-if="!node.variable && !node.symbol"
          class="data-output-label"
          :style="{ top: `${HEADER_HEIGHT}px` }"
          >{{ t('actionGraphEditor.result') }}</span
        >
        <button
          class="data-pin output"
          :class="node.type"
          :style="{ top: `${node.outputY}px` }"
          :data-graph-pin="pinKey(dataOutputPin(node))"
          :aria-label="`${node.title} 结果`"
          @pointerdown.stop="startPin($event, dataOutputPin(node))"
          @click.stop="activatePin($event, dataOutputPin(node))"
          @contextmenu.prevent.stop="pinMenu($event, dataOutputPin(node))"
        />
        <div
          v-for="(input, index) in node.inputs"
          :key="input.path.join('.')"
          class="data-input-row"
          :style="{ top: `${node.inputTop + index * PORT_HEIGHT}px` }"
        >
          <button
            class="data-pin input"
            :class="input.type"
            :data-graph-pin="pinKey(dataInputPin('data', node.id, input))"
            :aria-label="`${node.title} ${dataInputLabel('data', node.id, input.path)} 输入`"
            @pointerdown.stop="startPin($event, dataInputPin('data', node.id, input))"
            @click.stop="activatePin($event, dataInputPin('data', node.id, input))"
            @contextmenu.prevent.stop="pinMenu($event, dataInputPin('data', node.id, input))"
          />
          <span v-if="!node.symbol">{{ fieldName(input.path) }}</span>
          <input
            v-if="input.source === null && input.type === 'number'"
            :disabled="readonly"
            type="number"
            :value="(input.value as { value: number }).value"
            :aria-label="`${node.title} ${input.path.join('.')} 常量`"
            @pointerdown.stop
            @change="
              emit(
                'constantData',
                'data',
                node.id,
                input.path,
                +($event.target as HTMLInputElement).value,
              )
            "
          />
          <select
            v-else-if="input.source === null"
            :disabled="readonly"
            :value="String((input.value as { value: boolean }).value)"
            @pointerdown.stop
            @change="
              emit(
                'constantData',
                'data',
                node.id,
                input.path,
                ($event.target as HTMLSelectElement).value === 'true',
              )
            "
          >
            <option value="true">成立</option>
            <option value="false">不成立</option>
          </select>
        </div>
      </article>
      <article
        v-for="group in visibleEntries"
        :key="group.layoutId"
        class="graph-node entry-node"
        @contextmenu.prevent.stop="
          showMenu($event, [
            {
              label: '定位入口',
              run: () => {
                focusEntryGroup(group);
              },
            },
            ...(group.isTimeline
              ? [{ label: readonly ? '查看时间线' : '编辑时间线', run: openTimelineEditor }]
              : []),
          ])
        "
        :class="{
          selected:
            selectedEntryId !== null &&
            group.rows.some(row => row.entryIds.includes(selectedEntryId!)),
        }"
        :style="{
          left: `${group.x}px`,
          top: `${group.y}px`,
          width: `${ENTRY_WIDTH}px`,
          height: `${group.height}px`,
        }"
        @pointerdown.stop="($event.button === 1 || $event.button === 2) && startPan($event)"
        @click.stop
      >
        <GraphNodeHeader
          class="node-header entry-header"
          :title="group.label"
          :instance-id="group.id"
          :class="{ 'timeline-header': group.isTimeline }"
          @pointerdown.stop="startItemDrag($event, group.layoutId)"
          @dblclick.stop="group.isTimeline && openTimelineEditor()"
        >
          <button
            v-if="group.isTimeline"
            type="button"
            class="edit-timeline-button"
            @pointerdown.stop
            @click.stop="openTimelineEditor"
          >
            {{ readonly ? '查看时间线' : '编辑时间线' }}
          </button>
        </GraphNodeHeader>
        <div
          v-for="row in group.rows"
          :key="row.id"
          class="entry-row"
          :class="{ 'selected-entry-row': row.id === selectedEntryId }"
          :style="{ top: `${row.top - 1}px`, height: `${row.height}px` }"
          @pointerdown.stop
        >
          <button
            type="button"
            class="entry-item"
            :title="`${row.tooltip}\n${row.targetId ?? '点击右侧输出，再点击动作的执行入口'}`"
            @click.stop="emit('selectEntry', row.id)"
          >
            <span class="entry-number">{{ row.index + 1 }}</span>
            <span class="entry-summary"
              ><strong>{{ row.timeLabel }}</strong
              ><span>{{ row.targetTitle }}</span></span
            >
          </button>
          <button
            type="button"
            class="entry-output port-button"
            :class="{
              connected: row.targetId !== null,
              pending:
                pendingConnection?.kind === 'entry' &&
                pendingConnection.groupId === group.id &&
                pendingConnection.entryIds[0] === row.id,
            }"
            :data-graph-pin="pinKey(entryPin(group.id, row.id))"
            @pointerenter="hoveredPin = pinKey(entryPin(group.id, row.id))"
            @pointerleave="hoveredPin = null"
            @pointerdown.stop="startPin($event, entryPin(group.id, row.id))"
            @click.stop="activatePin($event, entryPin(group.id, row.id))"
            @contextmenu.prevent.stop="pinMenu($event, entryPin(group.id, row.id))"
          >
            <span class="port-pin" />
          </button>
        </div>
      </article>
      <article
        v-for="node in visibleNodes"
        :key="node.id"
        class="graph-node"
        :class="{
          selected: node.id === selectedId,
          'entry-target': node.id === selectedEntryTarget,
          branch: node.isBranch,
          call: node.isCall,
          'variable-write':
            node.kind === 'modifyActionValue' || node.kind === 'calculateActionValue',
          'scope-node': node.kind === 'withActionBlackboardScope',
        }"
        :style="{
          left: `${node.x}px`,
          top: `${node.y}px`,
          width: `${NODE_WIDTH}px`,
          height: `${node.height}px`,
        }"
        @pointerdown.stop="startItemDrag($event, node.layoutId, node.id)"
        @click.stop="emit('select', node.id)"
        @contextmenu.prevent.stop="nodeMenu($event, node.id)"
        @dblclick.stop="emit('openNode', node.id)"
      >
        <GraphNodeHeader
          :title="node.title"
          :instance-id="node.id"
          @pointerdown.stop="startItemDrag($event, node.layoutId, node.id)"
        />
        <div class="node-ports">
          <button
            type="button"
            class="input-port port-button"
            :class="{ available: pendingConnection !== null && pendingConnection.kind !== 'input' }"
            :data-graph-pin="pinKey(inputPin(node.id))"
            @pointerenter="hoveredPin = pinKey(inputPin(node.id))"
            @pointerleave="hoveredPin = null"
            @pointerdown.stop="startPin($event, inputPin(node.id))"
            @click.stop="activatePin($event, inputPin(node.id))"
            @contextmenu.prevent.stop="pinMenu($event, inputPin(node.id))"
          >
            <span class="port-pin" /><span class="input-label">{{
              t('actionGraphEditor.input')
            }}</span>
          </button>
          <div class="output-ports">
            <button
              v-for="port in node.ports"
              :key="JSON.stringify(port.path)"
              type="button"
              class="output-port port-button"
              :class="{
                connected: port.target !== null,
                pending:
                  pendingConnection?.kind === 'action' &&
                  pendingConnection.nodeId === node.id &&
                  JSON.stringify(pendingConnection.path) === JSON.stringify(port.path),
              }"
              :data-graph-pin="pinKey(actionPin(node.id, port))"
              @pointerenter="hoveredPin = pinKey(actionPin(node.id, port))"
              @pointerleave="hoveredPin = null"
              @pointerdown.stop="startPin($event, actionPin(node.id, port))"
              @click.stop="activatePin($event, actionPin(node.id, port))"
              @contextmenu.prevent.stop="pinMenu($event, actionPin(node.id, port))"
            >
              <span class="port-label">{{ port.label }}</span
              ><span class="port-pin" />
            </button>
          </div>
        </div>
        <div
          v-for="(input, index) in node.dataInputs"
          :key="input.path.join('.')"
          class="data-input-row action-data-input"
          :style="{ top: `${HEADER_HEIGHT + (index + 1) * PORT_HEIGHT}px` }"
        >
          <button
            class="data-pin input"
            :class="input.type"
            :data-graph-pin="pinKey(dataInputPin('action', node.id, input))"
            :aria-label="`${node.title} ${dataInputLabel('action', node.id, input.path)} 输入`"
            @pointerdown.stop="startPin($event, dataInputPin('action', node.id, input))"
            @click.stop="activatePin($event, dataInputPin('action', node.id, input))"
            @contextmenu.prevent.stop="pinMenu($event, dataInputPin('action', node.id, input))"
          />
          <span>{{ dataInputLabel('action', node.id, input.path) }}</span>
          <input
            v-if="input.source === null && input.type === 'number'"
            :disabled="readonly"
            type="number"
            :value="(input.value as { value: number }).value"
            @pointerdown.stop
            @change="
              emit(
                'constantData',
                'action',
                node.id,
                input.path,
                +($event.target as HTMLInputElement).value,
              )
            "
          />
          <select
            v-else-if="input.source === null"
            :disabled="readonly"
            :value="String((input.value as { value: boolean }).value)"
            @pointerdown.stop
            @change="
              emit(
                'constantData',
                'action',
                node.id,
                input.path,
                ($event.target as HTMLSelectElement).value === 'true',
              )
            "
          >
            <option value="true">成立</option>
            <option value="false">不成立</option>
          </select>
        </div>
      </article>
    </div>

    <div v-if="pendingConnection" class="connection-status" @pointerdown.stop>
      <span>{{ pendingConnection.label }} · 拖到另一端引脚接线，Esc 取消</span>
      <button type="button" @click="cancelGesture">取消</button>
    </div>
    <div
      v-else
      class="canvas-help"
      title="左键拖动空白或右键、中键拖动画布 · 滚轮缩放 · 左键拖动节点 · 拖拽引脚接线 · Alt 单击断线 · 右键菜单 · F 定位 · Delete 删除"
      @pointerdown.stop
    >
      操作说明
    </div>
    <div v-if="layoutError" class="layout-error">{{ layoutError }}</div>
    <div
      v-if="contextMenu"
      role="menu"
      class="graph-context-menu"
      :class="{ 'node-creation-menu': contextMenu.searchable }"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @pointerdown.stop
      @contextmenu.prevent.stop
      @keydown.stop="menuKeydown"
      @wheel.stop
    >
      <input
        v-if="contextMenu.searchable"
        v-model="menuQuery"
        :placeholder="t('actionGraphEditor.searchNodes')"
        :aria-label="t('actionGraphEditor.searchNodes')"
      />
      <div class="menu-panels">
        <div v-if="contextMenu.searchable && !menuQuery.trim()" class="menu-groups">
          <button
            v-for="group in menuGroups"
            :key="group"
            role="menuitem"
            :aria-expanded="menuGroup === group"
            :class="{ active: menuGroup === group }"
            @click.stop="menuGroup = group"
          >
            {{ group }} <span aria-hidden="true">›</span>
          </button>
        </div>
        <div class="menu-results">
          <button
            v-for="item in menuItems"
            :key="item.label"
            type="button"
            role="menuitem"
            @click.stop="
              contextMenu = null;
              item.run();
            "
          >
            {{ item.label }}
          </button>
          <span v-if="contextMenu.searchable && !menuItems.length" class="menu-empty">{{
            t('actionGraphEditor.noMatchingNodes')
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-output-label {
  position: absolute;
  right: 12px;
  line-height: var(--node-port-height);
  font-size: 11px;
  pointer-events: none;
}
.data-node {
  border-color: #548f86;
}
.compact-operation {
  background: linear-gradient(#30343d, #20242c);
}
.operation-symbol {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #d6dce4;
  font: 600 24px/1 sans-serif;
  pointer-events: none;
}
.compact-operation .data-input-row {
  right: calc(50% + 24px);
}
.data-node.variable {
  border-radius: 18px;
  background: linear-gradient(#2d3937, #192220);
}
.variable-name {
  display: block;
  padding: 0 22px 0 14px;
  line-height: 34px;
  font-size: 12px;
  color: #d7e8e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.data-node.effectful {
  border-color: #e39b4a;
}
.data-node.boolean:not(.effectful) .node-header {
  background: #434047;
}
.data-node.effectful .node-header {
  background: #614728;
}
.graph-node.variable-write .node-header {
  background: #315346;
}
.graph-node.scope-node .node-header {
  background: #53406c;
}
.graph-node.branch .node-header {
  background: #4d5058;
}
.graph-node.call .node-header {
  background: #344b6b;
}
.data-node.boolean {
  border-color: #ad5961;
}
.data-wire {
  fill: none;
  stroke-width: 2;
  stroke: #62c5a7;
  pointer-events: none;
}
.data-wire.boolean {
  stroke: #e07987;
}
.data-wire.highlighted {
  stroke-width: 4;
}
.data-pin {
  position: absolute;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 3px solid #193039;
  border-radius: 50%;
  background: #62c5a7;
  z-index: 4;
  transform: translateY(-50%);
  cursor: crosshair;
}
.data-pin.boolean {
  background: #e07987;
}
.data-pin:hover {
  outline: 2px solid #fff;
}
.data-pin.input {
  left: -8px;
  top: 14px;
}
.data-pin.output {
  right: -8px;
}
.data-input-row {
  position: absolute;
  left: 0;
  right: 65px;
  height: var(--node-port-height);
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 12px;
  font-size: 11px;
}
.action-data-input {
  right: 115px;
}
.data-input-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
}
.data-input-row input,
.data-input-row select {
  width: 60px;
  min-width: 40px;
  background: #171f2b;
  border: 1px solid #4c647a;
  color: #e0e7ed;
}
.action-graph-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 240px;
  /* 画布由 camera 平移；聚焦菜单或节点不能触发浏览器自身滚动。 */
  overflow: clip;
  outline: none;
  background-color: #151920;
  background-image: radial-gradient(circle, #323944 1px, transparent 1px);
  color: #dce2eb;
  font-family: inherit;
  user-select: none;
  touch-action: none;
  cursor: grab;
}
.action-graph-canvas:active {
  cursor: grabbing;
}
.canvas-toolbar {
  position: absolute;
  z-index: 5;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 7px;
  border: 1px solid #3c4551;
  border-radius: 6px;
  background: #202630ed;
  font-size: 12px;
  cursor: default;
  box-shadow: 0 3px 14px #0005;
}
.canvas-toolbar button,
.connection-status button {
  padding: 5px 9px;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  color: #dce2eb;
  font: inherit;
  cursor: pointer;
}
.canvas-toolbar button:hover,
.connection-status button:hover {
  background: #3b4655;
}
.canvas-toolbar button:focus-visible,
.connection-status button:focus-visible,
.port-button:focus-visible {
  outline: 2px solid #84c4ff;
  outline-offset: -2px;
}
.node-count {
  padding: 0 9px 0 4px;
  border-right: 1px solid #495362;
  color: #aeb9c9;
}
.zoom-label {
  min-width: 35px;
  text-align: center;
  color: #b6c3d3;
  font-variant-numeric: tabular-nums;
}
.graph-world {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  overflow: visible;
}
.graph-wires {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.execution-wire {
  fill: none;
  stroke: #94a6ba;
  stroke-width: 2;
  opacity: 0.72;
}
.execution-wire.selected {
  stroke: #ffd26d;
  stroke-width: 2.5;
  opacity: 1;
}
.execution-wire.entry-wire:not(.selected) {
  stroke: #91badb;
  opacity: 0.88;
}
.execution-wire.faded {
  opacity: 0.12;
}
.execution-wire.entry-wire.faded {
  opacity: 0.12;
}
.execution-wire.pending {
  stroke: #79ceff;
  stroke-width: 2.5;
  stroke-dasharray: 7 5;
  opacity: 1;
}
.execution-wire.hovered {
  stroke: #ffe5a0;
  opacity: 1;
  stroke-width: 3;
}
.wire-hit {
  fill: none;
  stroke: transparent;
  pointer-events: stroke;
  cursor: pointer;
}
.graph-context-menu {
  max-height: calc(100% - 12px);
  overflow-y: auto;
  position: absolute;
  z-index: 10;
  min-width: 190px;
  padding: 5px;
  background: #252c37;
  border: 1px solid #596779;
  border-radius: 4px;
  box-shadow: 0 4px 16px #0008;
}
.graph-context-menu button {
  display: block;
  width: 100%;
  height: 34px;
  text-align: left;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.node-creation-menu {
  width: min(420px, calc(100% - 12px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.node-creation-menu > input {
  box-sizing: border-box;
  width: 100%;
  margin-bottom: 6px;
  padding: 7px;
  background: #151920;
  border: 1px solid #455168;
  color: inherit;
}
.menu-panels {
  display: flex;
  min-height: 0;
}
.menu-groups {
  flex: 0 0 135px;
  overflow-y: auto;
  border-right: 1px solid #455168;
}
.menu-groups button {
  display: flex;
  justify-content: space-between;
}
.menu-groups .active {
  background: #414d5e;
}
.menu-results {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
}
.menu-empty {
  display: block;
  padding: 10px;
  color: #9aa8bc;
}
.graph-context-menu button:hover,
.graph-context-menu button:focus-visible {
  background: #414d5e;
}
.graph-node {
  position: absolute;
  box-sizing: border-box;
  border: 1px solid #506076;
  border-radius: 7px;
  background: #252c37;
  box-shadow: 0 4px 12px #0008;
  cursor: default;
}
.graph-node.selected {
  border-color: #ffd26d;
  box-shadow:
    0 0 0 2px #ffd26d,
    0 5px 16px #0008;
  z-index: 1;
}
.graph-node.entry-target {
  border-color: #ffd26d;
  box-shadow:
    0 0 0 2px #ffd26d88,
    0 5px 16px #0008;
}
.node-header {
  position: relative;
  display: grid;
  grid-template-rows: 20px 16px;
  row-gap: 4px;
  box-sizing: border-box;
  height: var(--node-header-height);
  padding: 9px 12px 8px;
  border-radius: 6px 6px 0 0;
  border-bottom: 1px solid #526075;
  background: #30455b;
  cursor: move;
}
.entry-header {
  position: relative;
  background: #663743;
  border-bottom-color: #955563;
}
.timeline-header {
  padding-right: 112px;
}
.edit-timeline-button {
  position: absolute;
  top: 15px;
  right: 10px;
  padding: 7px 9px;
  border: 1px solid #ba8794;
  border-radius: 4px;
  background: #83505f;
  color: #fff0f4;
  font-family: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
}
.edit-timeline-button:hover {
  background: #996474;
}
.entry-row {
  position: absolute;
  left: 0;
  right: 0;
  box-sizing: border-box;
  padding: 0;
  box-shadow: inset 0 -1px #3b4554;
  background: #282e38;
}
.entry-row:nth-of-type(even) {
  background: #252b35;
}
.entry-row.selected-entry-row {
  background: #393d36;
  box-shadow:
    inset 3px 0 #ffd26d,
    inset 0 -1px #3b4554;
}
.entry-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 6px 22px 6px 12px;
  border: none;
  background: transparent;
  color: #d7e7fa;
  text-align: left;
  cursor: pointer;
}
.entry-item:hover {
  background: #43596e44;
}
.entry-number {
  flex: 0 0 24px;
  color: #9bafc8;
  font:
    11px/18px ui-monospace,
    monospace;
  text-align: right;
}
.entry-summary {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.entry-summary > strong,
.entry-summary > span {
  overflow: hidden;
  line-height: 18px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.entry-summary > strong {
  color: #c3e2ff;
  font:
    12px/18px ui-monospace,
    monospace;
}
.entry-summary > span {
  color: #b8c7d8;
  font-size: 11px;
}
.entry-item:focus-visible,
.edit-timeline-button:focus-visible {
  outline: 2px solid #84c4ff;
  outline-offset: -2px;
}
.entry-output {
  position: absolute;
  top: 50%;
  right: -9px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  padding: 0;
  transform: translateY(-50%);
}
.node-ports {
  position: relative;
}
.port-button {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  box-sizing: border-box;
  border: none;
  background: transparent;
  color: #c8d5e5;
  font: inherit;
  font-size: 11px;
  cursor: crosshair;
}
.input-port {
  position: absolute;
  left: -9px;
  top: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.output-ports {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  padding-top: 6px;
  margin-left: 64px;
}
.output-port {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-right: -9px;
}
.port-label {
  position: absolute;
  right: 22px;
  pointer-events: none;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 181px;
}
.input-label {
  position: absolute;
  left: 22px;
  pointer-events: none;
  white-space: nowrap;
}
.port-pin {
  pointer-events: none;
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  box-sizing: border-box;
  border: 2px solid #ccd9e9;
  border-radius: 2px;
  background: #252c37;
  transform: rotate(45deg);
}
.connected .port-pin {
  background: #d7e7f9;
}
.port-button:hover {
  color: #fff;
}
.port-button:hover .port-pin,
.port-button.pending .port-pin,
.input-port.available .port-pin {
  border-color: #7ed1ff;
  background: #347698;
  box-shadow: 0 0 7px #60c7ff99;
}
.input-port.available {
  color: #8bd7ff;
}
.canvas-help,
.layout-error,
.empty-graph {
  position: absolute;
  pointer-events: none;
  font-size: 12px;
  color: #8798ad;
}
.canvas-help {
  right: 10px;
  bottom: 8px;
  padding: 4px 7px;
  border-radius: 3px;
  background: #151920d9;
  pointer-events: auto;
  cursor: help;
}
.layout-error {
  left: 16px;
  top: 16px;
  max-width: 40%;
  color: #efbf77;
}
.empty-graph {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
}
.connection-status {
  position: absolute;
  z-index: 5;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 10px 6px 15px;
  border: 1px solid #527e9e;
  border-radius: 5px;
  background: #243e51;
  color: #bbdfff;
  font-size: 12px;
  white-space: nowrap;
  cursor: default;
}
@media (max-width: 700px) {
  .node-count {
    display: none;
  }
  .canvas-help {
    max-width: calc(100% - 32px);
    font-size: 10px;
  }
}
</style>
