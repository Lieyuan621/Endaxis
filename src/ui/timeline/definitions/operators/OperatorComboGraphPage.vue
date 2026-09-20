<script setup lang="ts">
import { ref } from 'vue';
import {
  ABILITY_EVENTS,
  COMBO_SKILL_PRIORITIES,
  type ComboSkillConditionDefinition,
  type ComboSkillPriority,
} from '../../../../core/game-data/operatorDefinition';
import { buildOperatorComboGraph, type OperatorComboDocument } from './operatorComboGraph';
import type { DefinitionDraftHistory } from '../useDefinitionDraftHistory';
import { insertStructureArrayItem } from '../skillStructureEditorCommands';
import {
  createSkillEditorStep,
  duplicateSkillEditorDetachedStep,
} from '../skills/skillDefinitionEditorViewModel';
import ActionSequenceGraphEditor from '../actions/ActionSequenceGraphEditor.vue';
import ComboLiteralBoard from './ComboLiteralBoard.vue';
import AbilityEventOptions from '../actions/AbilityEventOptions.vue';
const props = defineProps<{
  navigationRequest?: { readonly propertyPath: readonly (string | number)[] };
  value: OperatorComboDocument;
  history: DefinitionDraftHistory<OperatorComboDocument>;
  skillKeys: readonly string[];
  skillLevel: number;
}>();
const selectedPath = ref<string>();
const factoryContext = { key: 'combo-editor', timelineBlockFrames: 0, scheduledSequences: [] };
function add() {
  const keys = new Set(props.value.comboSkillConditions?.map(entry => entry.key));
  let n = 1;
  while (keys.has(`custom-combo-condition-${n}`)) n++;
  const entry: ComboSkillConditionDefinition = {
    key: `custom-combo-condition-${n}`,
    skillKey: props.skillKeys[0] ?? '',
    event: ABILITY_EVENTS[0],
    immediately: false,
    initialValues: {},
    sequence: { steps: [] },
  };
  const next = insertStructureArrayItem(props.value, 'comboSkillConditions', entry);
  props.history.commit(next.root, { path: next.itemPath });
  selectedPath.value = next.itemPath;
}
function text(event: Event) {
  return (event.target as HTMLInputElement).value;
}
</script>
<template>
  <section class="combo-page">
    <ActionSequenceGraphEditor
      :sequence="value"
      :build-root="buildOperatorComboGraph"
      :custom-inspector="node => node.kind === '连携集合' || node.kind === '连携注册'"
      :shared-history="history"
      :selected-path="selectedPath"
      :navigation-request="navigationRequest"
      :show-details="false"
      :skill-level="skillLevel"
      :create-step="kind => createSkillEditorStep(factoryContext, kind)"
      :duplicate-step="step => duplicateSkillEditorDetachedStep(factoryContext, step)"
      @custom-add="add"
    >
      <template #inspector="{ node, value: current, update }">
        <div class="fields">
          <template v-if="node.kind === '连携集合'">
            <label :data-property-path="JSON.stringify(['comboSkillPriority'])"
              >原生目标优先级<select
                :value="value.comboSkillPriority ?? ''"
                @change="
                  update(
                    {
                      ...value,
                      comboSkillPriority: (text($event) || undefined) as
                        ComboSkillPriority | undefined,
                    },
                    ['comboSkillPriority'],
                  )
                "
              >
                <option value="">未指定</option>
                <option
                  v-for="priority in COMBO_SKILL_PRIORITIES"
                  :key="priority"
                  :value="priority"
                >
                  {{
                    { default: '默认', firstBlackboard: '首黑板值', enemyRank: '敌人等级排序' }[
                      priority
                    ]
                  }}
                </option>
              </select></label
            >
            <p>每条规则随角色进入战斗注册；不按技能块重复安装。唯一敌人模型不进行多目标评分。</p>
          </template>
          <template
            v-else
            v-for="entry in [current as ComboSkillConditionDefinition]"
            :key="node.sourcePath"
          >
            <label :data-property-path="JSON.stringify(['key'])"
              >注册标识<input
                :value="entry.key"
                @change="update({ ...entry, key: text($event) }, ['key'])"
            /></label>
            <label :data-property-path="JSON.stringify(['skillKey'])"
              >绑定连携技能<input
                :value="entry.skillKey"
                @change="update({ ...entry, skillKey: text($event) }, ['skillKey'])"
            /></label>
            <label :data-property-path="JSON.stringify(['event'])"
              >监听事件<select
                :value="entry.event"
                @change="update({ ...entry, event: text($event) }, ['event'])"
              >
                <AbilityEventOptions :events="ABILITY_EVENTS" :current="entry.event" /></select
            ></label>
            <label :data-property-path="JSON.stringify(['immediately'])"
              >条件命中后<select
                :value="entry.immediately ? 'immediate' : 'pending'"
                @change="
                  update({ ...entry, immediately: text($event) === 'immediate' }, ['immediately'])
                "
              >
                <option value="pending">打开连携窗口</option>
                <option value="immediate">立即尝试释放</option>
              </select></label
            >
            <ComboLiteralBoard
              :value="entry.initialValues"
              @update="
                (next, path) =>
                  update({ ...entry, initialValues: next }, ['initialValues', ...(path ?? [])])
              "
            />
          </template>
        </div>
      </template>
    </ActionSequenceGraphEditor>
  </section>
</template>
<style scoped>
.combo-page {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.combo-page > :deep(.sequence-graph) {
  flex: 1;
  min-height: 0;
  height: auto;
  border: 0;
}
.fields {
  display: grid;
  gap: 14px;
  min-width: 0;
}
label {
  display: grid;
  gap: 6px;
  font-size: 12px;
}
input,
select {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
  padding: 6px 8px;
}
p {
  font-size: 12px;
  line-height: 1.6;
  color: var(--ea-text-secondary);
}
</style>
