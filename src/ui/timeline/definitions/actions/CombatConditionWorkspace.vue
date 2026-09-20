<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, shallowRef, watch } from 'vue';
import type { CombatCondition } from '../../../../core/game-data/operatorDefinition';
import {
  buildCombatConditionMindMap,
  indexSkillStructureNodes,
  findSkillStructureNodeForPath,
  type SkillStructureNode,
} from '../skillStructureMindMapModel';
import {
  resolveStructureValue,
  replaceStructureValueAtPath,
  insertStructureArrayItem,
  removeStructureArrayItem,
  moveStructureArrayItem,
  cloneStructureValue,
  structurePathSegments,
} from '../skillStructureEditorCommands';
import SkillStructureMindMap from '../SkillStructureMindMap.vue';
import CombatConditionTypePicker from './CombatConditionTypePicker.vue';
import type { InspectorPropertyPath } from '../inspector/inspectorProperty';
import { useInspectorPropertyReveal } from '../inspector/useInspectorPropertyReveal';

const Inspector = defineAsyncComponent(() => import('./CombatConditionEditor.vue'));
const props = defineProps<{
  condition: CombatCondition;
  restoredPropertyPath?: InspectorPropertyPath;
}>();
const emit = defineEmits<{
  update: [condition: CombatCondition, propertyPath?: InspectorPropertyPath];
}>();
// 不另建历史：这里的所有结构和参数操作均提交给原保存范围的宿主。
const document = computed(() => ({ condition: props.condition }));
const root = computed(() => buildCombatConditionMindMap(props.condition));
const nodes = computed(() => indexSkillStructureNodes(root.value));
const selectedPath = ref('condition');
const selected = computed(() => findSkillStructureNodeForPath(root.value, selectedPath.value));
const value = computed(
  () => resolveStructureValue(document.value, selected.value.sourcePath) as CombatCondition,
);
const map = ref<{ revealNode(id: string): Promise<void> }>();
const pending = ref<{ node: SkillStructureNode; anchor: { x: number; y: number } }>();
const clipboard = shallowRef<CombatCondition>();
const workspaceRoot = ref<HTMLElement | null>(null);
const revealProperty = useInspectorPropertyReveal(workspaceRoot);
let restoreRevision = 0;
function selectNode(path: string) {
  restoreRevision++;
  void revealProperty();
  selectedPath.value = path;
}
watch(
  () => props.restoredPropertyPath,
  async path => {
    const revision = ++restoreRevision;
    void revealProperty();
    if (!path) return;
    // 用真实路径段匹配最深节点，不把字典键中的点误读为结构分隔符。
    const fullPath = ['condition', ...path];
    let target = root.value;
    let consumed = 1;
    for (const node of nodes.value.values()) {
      const segments = structurePathSegments(node.sourcePath);
      if (segments.length > consumed && segments.every((part, index) => part === fullPath[index])) {
        target = node;
        consumed = segments.length;
      }
    }
    selectedPath.value = target.sourcePath;
    await nextTick();
    if (revision !== restoreRevision) return;
    await map.value?.revealNode(target.id);
    if (revision === restoreRevision) await revealProperty(fullPath.slice(consumed));
  },
  { immediate: true, flush: 'post' },
);
async function publish(
  next: { condition: CombatCondition },
  path: string,
  propertyPath: InspectorPropertyPath = [],
) {
  selectedPath.value = path;
  // condition 是工作区内部包装；向外报告相对真实条件根的路径。
  emit('update', next.condition, [...structurePathSegments(path).slice(1), ...propertyPath]);
  await nextTick();
  await map.value?.revealNode(selected.value.id);
}
function update(value: CombatCondition, propertyPath?: InspectorPropertyPath) {
  void publish(
    replaceStructureValueAtPath(document.value, selected.value.sourcePath, value),
    selected.value.sourcePath,
    propertyPath,
  );
}
function beginAdd(source: { id: string }, anchor: { x: number; y: number }) {
  const node = nodes.value.get(source.id);
  if (node?.canAddChild === 'combatCondition') pending.value = { node, anchor };
}
function append(value: CombatCondition) {
  if (!pending.value) return;
  const result = insertStructureArrayItem(
    document.value,
    `${pending.value.node.sourcePath}.conditions`,
    value,
  );
  pending.value = undefined;
  void publish(result.root, result.itemPath);
}
function action(action: 'copy' | 'paste' | 'delete', source: { id: string }) {
  const node = nodes.value.get(source.id);
  if (!node) return;
  if (action === 'copy')
    clipboard.value = cloneStructureValue(
      resolveStructureValue(document.value, node.sourcePath) as CombatCondition,
    );
  else if (action === 'delete' && node.canDelete)
    void publish(
      removeStructureArrayItem(document.value, node.sourcePath),
      node.sourcePath.replace(/\.conditions\[\d+\]$/, ''),
    );
  else if (action === 'paste' && clipboard.value) {
    const sibling = /^(.*)\[(\d+)\]$/.exec(node.sourcePath);
    const path =
      node.acceptsChildKind === 'combatCondition' ? `${node.sourcePath}.conditions` : sibling?.[1];
    if (!path) return;
    const result = insertStructureArrayItem(
      document.value,
      path,
      cloneStructureValue(clipboard.value),
      node.acceptsChildKind ? undefined : Number(sibling![2]) + 1,
    );
    void publish(result.root, result.itemPath);
  }
}
function move(operation: {
  source: { id: string };
  target: { id: string };
  placement: 'inside' | 'before' | 'after';
}) {
  const source = nodes.value.get(operation.source.id),
    target = nodes.value.get(operation.target.id);
  if (!source?.canMove || !target) return;
  const sibling = /^(.*)\[(\d+)\]$/.exec(target.sourcePath);
  const path =
    operation.placement === 'inside'
      ? target.acceptsChildKind === 'combatCondition'
        ? `${target.sourcePath}.conditions`
        : undefined
      : sibling?.[1];
  if (!path || path.startsWith(`${source.sourcePath}.`)) return;
  const result = moveStructureArrayItem(
    document.value,
    source.sourcePath,
    path,
    operation.placement === 'inside'
      ? undefined
      : Number(sibling![2]) + (operation.placement === 'after' ? 1 : 0),
  );
  void publish(result.root, result.itemPath);
}
</script>
<template>
  <div ref="workspaceRoot" class="condition-workspace">
    <SkillStructureMindMap
      ref="map"
      :root="root"
      :selected-id="selected.id"
      :show-reference-pins="false"
      :clipboard-kind="clipboard ? 'combatCondition' : undefined"
      @select="selectNode($event.sourcePath)"
      @add-child="beginAdd"
      @node-action="action"
      @move-node="move"
    />
    <aside>
      <Inspector :condition="value" layer-only @update="update" />
    </aside>
    <CombatConditionTypePicker
      v-if="pending"
      :anchor="pending.anchor"
      @select="append"
      @close="pending = undefined"
    />
  </div>
</template>
<style scoped>
.condition-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
  gap: 12px;
  min-width: 0;
  min-height: 420px;
}
.condition-workspace > aside {
  min-width: 0;
  max-height: 620px;
  overflow: auto;
}
@media (max-width: 800px) {
  .condition-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
