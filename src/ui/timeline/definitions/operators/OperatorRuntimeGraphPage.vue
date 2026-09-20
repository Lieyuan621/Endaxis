<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import type { OperatorRuntimeDraft } from './operatorRuntimeDraft';
import type { DefinitionDraftHistory } from '../useDefinitionDraftHistory';
import { definitionAllLevelsKey } from '../definitionLevelEditing';
import { buildOperatorRuntimeGraph } from './operatorUpgradeGraph';
import type { SkillStructureNode } from '../skillStructureMindMapModel';
import { cloneStructureValue, insertStructureArrayItem } from '../skillStructureEditorCommands';
import {
  createSkillEditorStep,
  duplicateSkillEditorDetachedStep,
} from '../skills/skillDefinitionEditorViewModel';
import {
  OPERATOR_EVENTS,
  SKILL_LEVEL_SOURCES,
  type OperatorPassiveSkillDefinition,
  type OperatorEventHandlerDefinition,
} from '../../../../core/game-data/operatorDefinition';
import ActionSequenceGraphEditor from '../actions/ActionSequenceGraphEditor.vue';
import SkillBlackboardEditor from '../skills/SkillBlackboardEditor.vue';
const props = defineProps<{
  navigationRequest?: { readonly propertyPath: readonly (string | number)[] };
  passiveSkills?: readonly OperatorPassiveSkillDefinition[];
  eventHandlers?: readonly OperatorEventHandlerDefinition[];
  history: DefinitionDraftHistory<OperatorRuntimeDraft>;
  skillLevel: number;
}>();
provide(definitionAllLevelsKey, true);
const document = computed<OperatorRuntimeDraft>(() => ({
  passives: props.passiveSkills ?? [],
  handlers: props.eventHandlers ?? [],
}));
const selectedPath = ref<string>();
const synthetic = { key: 'role-editor', timelineBlockFrames: 0, scheduledSequences: [] };
function keyFor(kind: 'passives' | 'handlers') {
  const keys = new Set(document.value[kind].map(x => x.key));
  let n = 1;
  while (keys.has(`custom-${kind}-${n}`)) n++;
  return `custom-${kind}-${n}`;
}
function add(node: SkillStructureNode) {
  if (node.sourcePath !== 'passives' && node.sourcePath !== 'handlers') return;
  const collection = node.sourcePath;
  const item =
    collection === 'passives'
      ? { key: keyFor(collection), enableSequence: { steps: [] } }
      : { key: keyFor(collection), event: 'deckAttributesChanged', sequence: { steps: [] } };
  const next = insertStructureArrayItem(document.value, collection, item);
  props.history.commit(next.root, { path: next.itemPath });
  selectedPath.value = next.itemPath;
}
function duplicate(kind: SkillStructureNode['payloadKind'], value: unknown) {
  const cloned = cloneStructureValue(value);
  if (kind === 'upgradePassive' || kind === 'upgradeHandler')
    return {
      ...(cloned as { key: string }),
      key: keyFor(kind === 'upgradePassive' ? 'passives' : 'handlers'),
    };
  return cloned;
}
const levelNames = {
  basicAttack: '普攻',
  battleSkill: '战技',
  comboSkill: '连携',
  ultimate: '终结技',
};
function text(e: Event) {
  return (e.target as HTMLInputElement).value;
}
</script>
<template>
  <section class="runtime-page">
    <header>
      <strong>角色行为</strong><small>随角色进入战斗安装；不属于时间轴可释放技能。</small>
    </header>
    <ActionSequenceGraphEditor
      :sequence="document"
      :build-root="buildOperatorRuntimeGraph"
      :custom-inspector="node => node.kind.startsWith('角色')"
      :show-details="false"
      :shared-history="history"
      :selected-path="selectedPath"
      :navigation-request="navigationRequest"
      :skill-level="skillLevel"
      :duplicate-payload="duplicate"
      :create-step="kind => createSkillEditorStep(synthetic, kind)"
      :duplicate-step="step => duplicateSkillEditorDetachedStep(synthetic, step)"
      @custom-add="add"
    >
      <template #inspector="{ node, value, update }">
        <div class="fields">
          <template v-if="node.kind === '角色被动'">
            <template
              v-for="passive in [value as OperatorPassiveSkillDefinition]"
              :key="node.sourcePath"
            >
              <label :data-property-path="JSON.stringify(['key'])"
                >被动标识<input
                  :value="passive.key"
                  @change="update({ ...passive, key: text($event) }, ['key'])"
              /></label>
              <label :data-property-path="JSON.stringify(['levelSource'])"
                >等级来源<select
                  :value="passive.levelSource ?? ''"
                  @change="
                    update({ ...passive, levelSource: text($event) || undefined }, ['levelSource'])
                  "
                >
                  <option value="">无技能等级来源</option>
                  <option v-for="source in SKILL_LEVEL_SOURCES" :key="source" :value="source">
                    {{ levelNames[source] }}
                  </option>
                </select></label
              >
              <SkillBlackboardEditor
                :data-property-path="JSON.stringify(['blackboard'])"
                :blackboard="passive.blackboard ?? {}"
                :skill-level="skillLevel"
                title="被动初始黑板"
                description="此被动自己的初始值，不与角色实体黑板混同。"
                @update="bb => update({ ...passive, blackboard: bb }, ['blackboard'])"
              />
            </template>
          </template>
          <template v-else-if="node.kind === '角色监听'">
            <template
              v-for="handler in [value as OperatorEventHandlerDefinition]"
              :key="node.sourcePath"
            >
              <label :data-property-path="JSON.stringify(['key'])"
                >监听标识<input
                  :value="handler.key"
                  @change="update({ ...handler, key: text($event) }, ['key'])"
              /></label>
              <label :data-property-path="JSON.stringify(['event'])"
                >触发事件<select
                  :value="handler.event"
                  @change="update({ ...handler, event: text($event) }, ['event'])"
                >
                  <option v-for="event in OPERATOR_EVENTS" :key="event" :value="event">
                    {{ event === 'deckAttributesChanged' ? '队伍构筑属性变化' : event }}
                  </option>
                </select></label
              >
            </template>
          </template>
          <p v-else>
            常驻被动与角色事件监听各自拥有执行序列。通过图上的＋添加，选择节点编辑本层字段。
          </p>
        </div>
      </template>
    </ActionSequenceGraphEditor>
  </section>
</template>
<style scoped>
.runtime-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
header {
  display: flex;
  gap: 12px;
  align-items: baseline;
  padding: 12px 14px;
  border-bottom: 1px solid var(--ea-border-soft);
}
small,
p {
  color: var(--ea-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}
.runtime-page > :deep(.sequence-graph) {
  flex: 1;
  height: auto;
  min-height: 0;
  border: 0;
}
.fields {
  display: grid;
  gap: 16px;
  min-width: 0;
}
label {
  display: grid;
  gap: 6px;
  font-size: 12px;
}
input,
select {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  background: var(--ea-fill-input);
  color: var(--ea-fg);
  padding: 6px 8px;
  border: 1px solid var(--ea-border);
}
</style>
