<script setup lang="ts">
import { ref } from 'vue';
import { buildOperatorRoutingGraph, type OperatorRoutingDocument } from './operatorRoutingGraph';
import type { SkillStructureNode } from '../skillStructureMindMapModel';
import type { DefinitionDraftHistory } from '../useDefinitionDraftHistory';
import type {
  OperatorSkillSlotDefinition,
  OperatorPlayerActionModeDefinition,
  PlayerActionRouteDefinition,
} from '../../../../core/game-data/operatorDefinition';
import {
  insertStructureArrayItem,
  replaceStructureValueAtPath,
  cloneStructureValue,
} from '../skillStructureEditorCommands';
import RoutingSkillListField from './RoutingSkillListField.vue';
import ActionSequenceGraphEditor from '../actions/ActionSequenceGraphEditor.vue';
const props = defineProps<{
  navigationRequest?: { readonly propertyPath: readonly (string | number)[] };
  value: OperatorRoutingDocument;
  history: DefinitionDraftHistory<OperatorRoutingDocument>;
  skillKeys?: readonly string[];
}>();
const selectedPath = ref<string>();
function text(e: Event) {
  return (e.target as HTMLInputElement).value;
}

function add(node: SkillStructureNode) {
  const path = node.sourcePath;
  if (path === 'skillSlots' || path === 'playerActionModes') {
    const keys = new Set(
      path === 'skillSlots'
        ? props.value.skillSlots?.map(s => s.key)
        : props.value.playerActionModes?.map(m => m.modeId),
    );
    let n = 1;
    while (keys.has(`custom-${n}`)) n++;
    const item =
      path === 'skillSlots'
        ? { key: `custom-${n}`, baseSkillKey: '', replacementSkillKeys: [] }
        : { modeId: `custom-${n}`, modeLayer: '', defaultEnabled: false };
    const next = insertStructureArrayItem(props.value, path, item);
    props.history.commit(next.root, { path: next.itemPath });
    selectedPath.value = next.itemPath;
    return;
  }
  const item =
    node.kind === '未设置路由'
      ? { kind: 'skillSlot', skillSlotKey: '' }
      : node.kind === '未设置映射'
        ? { skillId: '' }
        : undefined;
  if (!item) return;
  props.history.commit(replaceStructureValueAtPath(props.value, path, item), { path });
  selectedPath.value = path;
}
</script>
<template>
  <section class="routing-page">
    <header>
      <strong>操作选择规则</strong
      ><small>四类操作通过模式与技能槽选择技能；技能库分组不参与这里的逻辑。</small>
    </header>
    <ActionSequenceGraphEditor
      :sequence="value"
      :build-root="buildOperatorRoutingGraph"
      :custom-inspector="() => true"
      :shared-history="history"
      :selected-path="selectedPath"
      :navigation-request="navigationRequest"
      :show-details="false"
      :skill-level="1"
      :create-step="
        () => {
          throw new Error('Routing nodes do not contain combat steps');
        }
      "
      :duplicate-step="cloneStructureValue"
      @custom-add="add"
    >
      <template #inspector="{ node, value: current, update }"
        ><div class="fields">
          <template
            v-if="node.kind === '操作路由'"
            v-for="route in [current as PlayerActionRouteDefinition]"
            :key="'kind-1:' + node.sourcePath"
          >
            <label :data-property-path="JSON.stringify(['kind'])"
              >请求来源<select
                :value="route.kind"
                @change="
                  update(
                    text($event) === 'basicAttack'
                      ? { kind: 'basicAttack', skillKeys: [] }
                      : { kind: 'skillSlot', skillSlotKey: '' },
                    ['kind'],
                  )
                "
              >
                <option value="skillSlot">技能槽位</option>
                <option value="basicAttack">普攻技能集合</option>
              </select></label
            >
            <label
              v-if="route.kind === 'skillSlot'"
              :data-property-path="JSON.stringify(['skillSlotKey'])"
              >槽位标识<input
                :value="route.skillSlotKey"
                @change="update({ ...route, skillSlotKey: text($event) }, ['skillSlotKey'])"
            /></label>
            <template v-else
              ><RoutingSkillListField
                field="skillKeys"
                :skill-keys="skillKeys"
                label="可请求技能"
                :value="route.skillKeys"
                @update="update({ ...route, skillKeys: $event }, ['skillKeys'])" /><label
                :data-property-path="JSON.stringify(['defaultSkillKey'])"
                >默认技能（可不设）<input
                  :value="route.defaultSkillKey ?? ''"
                  @change="
                    update({ ...route, defaultSkillKey: text($event) || undefined }, [
                      'defaultSkillKey',
                    ])
                  " /></label
            ></template>
          </template>
          <template
            v-else-if="node.kind === '技能槽位'"
            v-for="slot in [current as OperatorSkillSlotDefinition]"
            :key="'kind-2:' + node.sourcePath"
          >
            <label :data-property-path="JSON.stringify(['key'])"
              >槽位标识<input
                :value="slot.key"
                @change="update({ ...slot, key: text($event) }, ['key'])" /></label
            ><label :data-property-path="JSON.stringify(['baseSkillKey'])"
              >基础技能<input
                :value="slot.baseSkillKey"
                @change="update({ ...slot, baseSkillKey: text($event) }, ['baseSkillKey'])"
            /></label>
            <RoutingSkillListField
              field="stableSkillKeys"
              :skill-keys="skillKeys"
              label="稳定可请求技能"
              :value="slot.stableSkillKeys"
              optional
              @update="update({ ...slot, stableSkillKeys: $event }, ['stableSkillKeys'])"
            /><RoutingSkillListField
              field="replacementSkillKeys"
              :skill-keys="skillKeys"
              label="替换技能"
              :value="slot.replacementSkillKeys"
              @update="update({ ...slot, replacementSkillKeys: $event }, ['replacementSkillKeys'])"
            />
          </template>
          <template
            v-else-if="node.kind === '操作模式'"
            v-for="mode in [current as OperatorPlayerActionModeDefinition]"
            :key="'kind-3:' + node.sourcePath"
          >
            <label :data-property-path="JSON.stringify(['modeId'])"
              >模式标识<input
                :value="mode.modeId"
                @change="update({ ...mode, modeId: text($event) }, ['modeId'])" /></label
            ><label :data-property-path="JSON.stringify(['modeLayer'])"
              >模式层<input
                :value="mode.modeLayer"
                @change="update({ ...mode, modeLayer: text($event) }, ['modeLayer'])"
            /></label>
            <label :data-property-path="JSON.stringify(['defaultEnabled'])"
              ><span
                ><input
                  type="checkbox"
                  :checked="mode.defaultEnabled"
                  @change="
                    update(
                      { ...mode, defaultEnabled: ($event.target as HTMLInputElement).checked },
                      ['defaultEnabled'],
                    )
                  "
                />
                默认启用</span
              ></label
            ><RoutingSkillListField
              field="normalAttackSkillKeys"
              :skill-keys="skillKeys"
              label="普攻技能序列"
              :value="mode.normalAttackSkillKeys"
              optional
              @update="
                update({ ...mode, normalAttackSkillKeys: $event }, ['normalAttackSkillKeys'])
              "
            />
            <p>四类命令映射分别在图中编辑。</p>
          </template>
          <template
            v-else-if="node.kind === '命令映射'"
            v-for="mapping in [current as { skillId: string }]"
            :key="'kind-4:' + node.sourcePath"
          >
            <label :data-property-path="JSON.stringify(['skillId'])"
              >技能 ID<input
                :value="mapping.skillId"
                @change="update({ ...mapping, skillId: text($event) }, ['skillId'])"
            /></label>
          </template>
          <p v-else>
            选择图中节点编辑。未设置的路由或映射不会自动从技能库分组推导；点击对应端口的＋显式添加。
          </p>
        </div></template
      >
    </ActionSequenceGraphEditor>
  </section>
</template>
<style scoped>
.routing-page {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
header {
  display: flex;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--ea-border-soft);
}
small,
p {
  font-size: 12px;
  color: var(--ea-text-secondary);
  line-height: 1.6;
}
.routing-page > :deep(.sequence-graph) {
  flex: 1;
  min-height: 0;
  height: auto;
  border: 0;
}
.fields,
label {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.fields {
  gap: 18px;
}
label {
  font-size: 12px;
}
input:not([type='checkbox']),
select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 7px;
  background: var(--ea-fill-input);
  color: var(--ea-fg);
  border: 1px solid var(--ea-border);
}
</style>
