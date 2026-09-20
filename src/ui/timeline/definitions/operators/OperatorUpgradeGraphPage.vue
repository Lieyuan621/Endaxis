<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { definitionAllLevelsKey } from '../definitionLevelEditing';
import { conditionInspectorFields } from '../inspector/conditionInspectorSchema';
import InspectorFields from '../inspector/InspectorFields.vue';
import UpgradeModifierTypePicker from './UpgradeModifierTypePicker.vue';
import { buildOperatorUpgradeGraph } from './operatorUpgradeGraph';
import type { SkillStructureNode } from '../skillStructureMindMapModel';
import type { DefinitionDraftHistory } from '../useDefinitionDraftHistory';
import {
  insertStructureArrayItem,
  replaceStructureValueAtPath,
  cloneStructureValue,
} from '../skillStructureEditorCommands';
import {
  createSkillEditorStep,
  duplicateSkillEditorDetachedStep,
} from '../skills/skillDefinitionEditorViewModel';
import {
  SKILL_LEVEL_SOURCES,
  SP_GAIN_KINDS,
  SP_GAIN_SOURCES,
  type OperatorUpgradeDefinition,
  type UpgradeModifierDefinition,
  type UpgradeEvent,
  type OperatorPassiveSkillDefinition,
  type LevelValues,
  type CombatCondition,
} from '../../../../core/game-data/operatorDefinition';
import ActionSequenceGraphEditor from '../actions/ActionSequenceGraphEditor.vue';
import OperatorUpgradeModifierEditor from './OperatorUpgradeModifierEditor.vue';
import SkillBlackboardEditor from '../skills/SkillBlackboardEditor.vue';
import InspectorStringList from '../inspector/InspectorStringList.vue';

const props = defineProps<{
  upgrade: OperatorUpgradeDefinition;
  kind: 'talents' | 'potentials';
  slot: number;
  navigationRequest?: { readonly propertyPath: readonly (string | number)[] };
  skillLevel: number;
  skillGroupKeys: readonly string[];
  passiveSkillKeys: readonly string[];
  history: DefinitionDraftHistory<OperatorUpgradeDefinition>;
  createModifier: (kind: UpgradeModifierDefinition['kind']) => UpgradeModifierDefinition;
}>();
const title = computed(() => `${props.kind === 'talents' ? '天赋' : '潜能'} ${props.slot + 1}`);
provide(definitionAllLevelsKey, true);
const selectedPath = ref<string>();
const menu = ref<{ x: number; y: number }>();
const synthetic = { key: 'upgrade-editor', timelineBlockFrames: 0, scheduledSequences: [] };
const project = (value: OperatorUpgradeDefinition) => buildOperatorUpgradeGraph(value, title.value);
function nodeLevel(node: SkillStructureNode) {
  const match = /^passiveSkills\[(\d+)\]/.exec(node.sourcePath);
  const passive = match ? props.upgrade.passiveSkills?.[Number(match[1])] : undefined;
  return passive?.levelSource ? props.skillLevel : props.kind === 'potentials' ? 1 : 1;
}
function custom(node: SkillStructureNode) {
  return [
    '养成效果',
    '结构端口',
    '构筑修正',
    '构筑条件',
    '事件监听',
    '常驻被动',
    '触发事件',
  ].includes(node.kind);
}
function write(path: string, value: unknown, propertyPath?: readonly (string | number)[]) {
  props.history.commit(
    path
      ? replaceStructureValueAtPath(props.upgrade, path, value)
      : (value as OperatorUpgradeDefinition),
    { path, propertyPath },
  );
}
function add(node: SkillStructureNode, anchor: { x: number; y: number }) {
  if (/^modifiers\[\d+\]\.condition$/.test(node.sourcePath)) {
    write(node.sourcePath, {
      kind: 'deckAttributeCompare',
      left: 'strength',
      operator: 'equal',
      right: 'strength',
    } satisfies CombatCondition);
    selectedPath.value = node.sourcePath;
    return;
  }
  if (node.sourcePath === 'modifiers') {
    menu.value = anchor;
    return;
  }
  if (node.sourcePath === 'initializationSequence') {
    if (!props.upgrade.initializationSequence) write(node.sourcePath, { steps: [] });
    selectedPath.value = node.sourcePath;
    return;
  }
  const payload =
    node.sourcePath === 'eventHandlers'
      ? { event: { kind: 'spGained' }, sequence: { steps: [] } }
      : { key: nextPassiveKey(), enableSequence: { steps: [] } };
  if (node.sourcePath !== 'eventHandlers' && node.sourcePath !== 'passiveSkills') return;
  const next = insertStructureArrayItem(props.upgrade, node.sourcePath, payload);
  props.history.commit(next.root, { path: next.itemPath });
  selectedPath.value = next.itemPath;
}
function nextPassiveKey() {
  const keys = new Set(props.upgrade.passiveSkills?.map(p => p.key));
  let i = 1;
  while (keys.has(`custom-passive-${i}`)) i++;
  return `custom-passive-${i}`;
}
function duplicatePayload(kind: SkillStructureNode['payloadKind'], value: unknown) {
  const next = cloneStructureValue(value);
  return kind === 'upgradePassive'
    ? { ...(next as OperatorPassiveSkillDefinition), key: nextPassiveKey() }
    : next;
}
function addModifier(kind: UpgradeModifierDefinition['kind']) {
  const next = insertStructureArrayItem(props.upgrade, 'modifiers', props.createModifier(kind));
  props.history.commit(next.root, { path: next.itemPath });
  selectedPath.value = next.itemPath;
  menu.value = undefined;
}
function eventDefault(kind: UpgradeEvent['kind']): UpgradeEvent {
  if (kind === 'buffConsumed') return { kind, buffIds: [] };
  if (kind === 'skillHit')
    return { kind, skillGroupKey: props.skillGroupKeys[0] ?? '', scope: 'operator' };
  return { kind };
}
const events = {
  spGained: '获得技力',
  elementalAttachmentConsumed: '元素附着被消耗',
  buffConsumed: '消费 Buff',
  skillHit: '技能命中',
} as const;
function text(event: Event) {
  return (event.target as HTMLInputElement).value;
}
function patch(path: string, value: unknown, field: string, next: unknown) {
  write(path, { ...(value as object), [field]: next }, [field]);
}
function setTalentLevels(event: Event) {
  const raw = text(event);
  const levels = Number(raw);
  if (props.kind !== 'talents' || !raw.trim() || !Number.isInteger(levels) || levels < 1) return;
  patch('', props.upgrade, 'levels', levels);
}
</script>
<template>
  <section class="upgrade-page">
    <header class="page-heading">
      <div>
        <strong>{{ title }}</strong
        ><small>{{ kind === 'talents' ? '独立天赋定义' : `潜能 ${slot + 1} 解锁的效果` }}</small>
      </div>
    </header>
    <ActionSequenceGraphEditor
      :key="`${kind}:${slot}`"
      :sequence="upgrade"
      :build-root="project"
      :custom-inspector="custom"
      :node-skill-level="nodeLevel"
      :duplicate-payload="duplicatePayload"
      :show-details="false"
      :selected-path="selectedPath"
      :navigation-request="navigationRequest"
      :skill-level="1"
      :shared-history="history"
      :create-step="kind => createSkillEditorStep(synthetic, kind)"
      :duplicate-step="step => duplicateSkillEditorDetachedStep(synthetic, step)"
      @custom-add="add"
    >
      <template #inspector="{ node, value, update }">
        <div class="own-fields">
          <template v-if="node.kind === '养成效果'">
            <label v-if="kind === 'talents'" :data-property-path="JSON.stringify(['levels'])"
              >天赋等级数量<input
                type="number"
                min="1"
                step="1"
                :value="upgrade.levels"
                @change="setTalentLevels"
            /></label>
            <p>在图中选择效果编辑。构筑修正在构筑阶段应用；初始化、监听和被动属于运行行为。</p>
            <label class="secondary" :data-property-path="JSON.stringify(['simulationNoEffect'])"
              >模型适用性<select
                :value="upgrade.simulationNoEffect ?? ''"
                @change="
                  update({ ...upgrade, simulationNoEffect: text($event) || undefined }, [
                    'simulationNoEffect',
                  ])
                "
              >
                <option value="">存在可模拟效果</option>
                <option value="uniqueEnemyHasNoAlternateTarget">唯一敌人没有其他目标</option>
                <option value="enemyDoesNotDealDamage">木桩敌人不造成伤害</option>
                <option value="enemyDoesNotInflictSpellStatusOnOperators">
                  木桩不对干员施加法术状态
                </option>
              </select></label
            >
          </template>
          <InspectorFields
            v-else-if="node.kind === '构筑条件'"
            :value="value as Extract<CombatCondition, { kind: 'deckAttributeCompare' }>"
            :fields="conditionInspectorFields('deckAttributeCompare') ?? []"
            @update="update"
          />
          <OperatorUpgradeModifierEditor
            v-else-if="node.kind === '构筑修正'"
            :modifier="value as UpgradeModifierDefinition"
            :skill-group-keys="skillGroupKeys"
            :passive-skill-keys="passiveSkillKeys"
            condition-in-graph
            @update="update"
          />
          <template v-else-if="node.kind === '常驻被动' || node.kind === '事件监听'">
            <template
              v-for="entry in [value as OperatorPassiveSkillDefinition]"
              :key="node.sourcePath"
            >
              <template v-if="node.kind === '常驻被动'">
                <label :data-property-path="JSON.stringify(['key'])"
                  >被动标识<input
                    :value="(value as OperatorPassiveSkillDefinition).key"
                    @change="patch(node.sourcePath, value, 'key', text($event))"
                /></label>
                <label :data-property-path="JSON.stringify(['levelSource'])"
                  >等级来源<select
                    :value="entry.levelSource ?? ''"
                    @change="
                      patch(node.sourcePath, value, 'levelSource', text($event) || undefined)
                    "
                  >
                    <option value="">当前{{ kind === 'talents' ? '天赋' : '潜能' }}效果</option>
                    <option v-for="source in SKILL_LEVEL_SOURCES" :key="source" :value="source">
                      {{ source }}
                    </option>
                  </select></label
                >
              </template>
              <SkillBlackboardEditor
                :data-property-path="JSON.stringify(['blackboard'])"
                :blackboard="entry.blackboard ?? {}"
                title="实例初始黑板"
                description="此监听或被动自身的常量；不与角色黑板共享。"
                :skill-level="entry.levelSource ? skillLevel : 1"
                @update="
                  (bb: Readonly<Record<string, LevelValues>>) =>
                    patch(node.sourcePath, value, 'blackboard', bb)
                "
              /> </template
          ></template>
          <template v-else-if="node.kind === '触发事件'">
            <template v-for="event in [value as UpgradeEvent]" :key="node.sourcePath">
              <label :data-property-path="JSON.stringify(['kind'])"
                >事件类型<select
                  :value="event.kind"
                  @change="update(eventDefault(text($event) as UpgradeEvent['kind']), ['kind'])"
                >
                  <option v-for="(label, key) in events" :key="key" :value="key">
                    {{ label }}
                  </option>
                </select></label
              >
              <template v-if="event.kind === 'spGained'">
                <label :data-property-path="JSON.stringify(['source'])"
                  >技力来源<select
                    :value="event.source ?? ''"
                    @change="patch(node.sourcePath, value, 'source', text($event) || undefined)"
                  >
                    <option value="">任意</option>
                    <option v-for="s in SP_GAIN_SOURCES" :key="s" :value="s">{{ s }}</option>
                  </select></label
                >
                <label :data-property-path="JSON.stringify(['gainKind'])"
                  >获得方式<select
                    :value="event.gainKind ?? ''"
                    @change="patch(node.sourcePath, value, 'gainKind', text($event) || undefined)"
                  >
                    <option value="">任意</option>
                    <option v-for="s in SP_GAIN_KINDS" :key="s" :value="s">{{ s }}</option>
                  </select></label
                >
              </template>
              <div
                v-if="event.kind === 'buffConsumed'"
                :data-property-path="JSON.stringify(['buffIds'])"
              >
                <p>消费的 Buff 标识</p>
                <InspectorStringList
                  label="Buff 标识"
                  :value="event.buffIds"
                  @update="patch(node.sourcePath, value, 'buffIds', $event)"
                />
              </div>
              <template v-if="event.kind === 'skillHit'"
                ><label :data-property-path="JSON.stringify(['skillGroupKey'])"
                  >技能组<select
                    :value="event.skillGroupKey"
                    @change="patch(node.sourcePath, value, 'skillGroupKey', text($event))"
                  >
                    <option
                      v-if="!skillGroupKeys.includes(event.skillGroupKey)"
                      :value="event.skillGroupKey"
                    >
                      {{ event.skillGroupKey || '未设置' }}（当前引用）
                    </option>
                    <option v-for="key in skillGroupKeys" :key="key" :value="key">{{ key }}</option>
                  </select></label
                ><label :data-property-path="JSON.stringify(['scope'])"
                  >来源范围<select
                    :value="event.scope"
                    @change="patch(node.sourcePath, value, 'scope', text($event))"
                  >
                    <option value="operator">当前干员</option>
                    <option value="team">全队</option>
                  </select></label
                ></template
              >
            </template></template
          >
          <p v-else>此端口表示结构归属。点击图上＋添加条目，选择子节点编辑。</p>
        </div>
      </template>
    </ActionSequenceGraphEditor>
    <UpgradeModifierTypePicker
      v-if="menu"
      :anchor="menu"
      @select="addModifier"
      @close="menu = undefined"
    />
  </section>
</template>
<style scoped>
.upgrade-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}
.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--ea-border-soft);
  flex: none;
}
.page-heading div {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.page-heading small,
.own-fields p {
  color: var(--ea-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}
.upgrade-page > :deep(.sequence-graph) {
  flex: 1;
  height: auto;
  min-height: 0;
  border: 0;
}
.own-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}
.own-fields label {
  display: grid;
  gap: 6px;
  font-size: 12px;
}
.own-fields input,
.own-fields select,
.page-heading select {
  min-width: 0;
  max-width: 100%;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
  padding: 6px 8px;
}
.secondary {
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 14px;
  margin-top: 8px;
}
</style>
