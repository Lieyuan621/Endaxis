<script setup lang="ts">
import {
  COMBAT_RESOURCES,
  COMPARISON_OPERATORS,
  ELEMENTAL_REACTIONS,
  OPERATOR_ATTRIBUTES,
  UPGRADE_BASE_PANEL_STATS,
  UPGRADE_STATIC_DAMAGE_INCREASE_TARGETS,
  type CombatCondition,
  type OperatorAttribute,
  type UpgradeModifierDefinition,
} from '../../../../core/game-data/operatorDefinition';
import CombatConditionEditor from '../actions/CombatConditionEditor.vue';
import LevelValuesEditor from '../LevelValuesEditor.vue';

const props = defineProps<{
  modifier: UpgradeModifierDefinition;
  skillGroupKeys: readonly string[];
  passiveSkillKeys: readonly string[];
  conditionInGraph?: boolean;
}>();
const emit = defineEmits<{
  update: [modifier: UpgradeModifierDefinition, propertyPath?: readonly (string | number)[]];
}>();
import { upgradeModifierLabels as labels } from './upgradeModifierLabels';
const attributeLabels: Readonly<Record<OperatorAttribute, string>> = {
  strength: '力量',
  agility: '敏捷',
  intellect: '智识',
  will: '意志',
};

function patch(values: Record<string, unknown>): void {
  emit(
    'update',
    { ...props.modifier, ...values } as UpgradeModifierDefinition,
    Object.keys(values),
  );
}
function input(field: string, event: Event): void {
  patch({ [field]: (event.target as HTMLInputElement | HTMLSelectElement).value });
}
function numberInput(field: string, event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  const value = Number(raw);
  if (raw.trim() && Number.isFinite(value)) patch({ [field]: value });
}
function optionalNumber(field: string, event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  if (raw.trim() === '') patch({ [field]: undefined });
  else if (Number.isFinite(Number(raw))) patch({ [field]: Number(raw) });
}
function toggleAttribute(attribute: OperatorAttribute): void {
  if (props.modifier.kind !== 'addBuildAttribute') return;
  const current = props.modifier.attributes;
  const next = current.includes(attribute)
    ? current.filter(value => value !== attribute)
    : [...current, attribute];
  if (next.length > 0) patch({ attributes: next });
}
function updateBuildCondition(field: 'left' | 'operator' | 'right', event: Event): void {
  if (
    props.modifier.kind !== 'patchSkillBlackboard' &&
    props.modifier.kind !== 'addSkillCooldownFrames'
  )
    return;
  const current = props.modifier.condition ?? {
    kind: 'deckAttributeCompare',
    left: 'strength',
    operator: 'equal',
    right: 'strength',
  };
  patch({ condition: { ...current, [field]: (event.target as HTMLSelectElement).value } });
}
function addBuildCondition(): void {
  patch({
    condition: {
      kind: 'deckAttributeCompare',
      left: 'strength',
      operator: 'equal',
      right: 'strength',
    },
  });
}
function clearBuildCondition(): void {
  patch({ condition: undefined });
}
</script>

<template>
  <div class="modifier-editor" :class="{ 'modifier-editor--inspector': conditionInGraph }">
    <header>
      <strong>{{ labels[modifier.kind] }}</strong
      ><code>{{ modifier.kind }}</code>
    </header>
    <CombatConditionEditor
      v-if="modifier.kind === 'addConditionalDamage' && !conditionInGraph"
      :condition="modifier.condition"
      @update="patch({ condition: $event as CombatCondition })"
    />
    <div
      v-if="modifier.kind === 'addConditionalDamage'"
      class="level-field"
      :data-property-path="JSON.stringify(['values'])"
    >
      <span>伤害值</span
      ><LevelValuesEditor
        :value="modifier.values"
        :current-level="1"
        @update="patch({ values: $event })"
      />
    </div>

    <label
      :data-property-path="JSON.stringify(['skillGroupKey'])"
      v-if="'skillGroupKey' in modifier"
      >技能组<select :value="modifier.skillGroupKey" @change="input('skillGroupKey', $event)">
        <option v-for="key in skillGroupKeys" :key="key" :value="key">{{ key }}</option>
      </select></label
    >
    <label
      :data-property-path="JSON.stringify(['skillKey'])"
      v-if="
        modifier.kind === 'multiplySkillCost' ||
        modifier.kind === 'patchSkillBlackboard' ||
        modifier.kind === 'addSkillCooldownFrames'
      "
      >限定技能 key<input
        :value="modifier.skillKey ?? ''"
        @change="input('skillKey', $event)"
      /><small>留空表示组内全部形态。</small></label
    >
    <label :data-property-path="JSON.stringify(['stepKey'])" v-if="'stepKey' in modifier"
      >步骤 key<input :value="modifier.stepKey" @change="input('stepKey', $event)"
    /></label>
    <label
      :data-property-path="JSON.stringify(['branchKey'])"
      v-if="modifier.kind === 'enableSkillBranch' || modifier.kind === 'multiplySkillCooldown'"
      >分支 key<input :value="modifier.branchKey ?? ''" @change="input('branchKey', $event)"
    /></label>

    <label
      :data-property-path="JSON.stringify(['resource'])"
      v-if="modifier.kind === 'multiplySkillCost'"
      >资源<select :value="modifier.resource" @change="input('resource', $event)">
        <option v-for="value in COMBAT_RESOURCES" :key="value" :value="value">{{ value }}</option>
      </select></label
    >
    <label
      :data-property-path="JSON.stringify(['target'])"
      v-if="modifier.kind === 'addStaticDamageIncrease'"
      >伤害类别<select :value="modifier.target" @change="input('target', $event)">
        <option v-for="value in UPGRADE_STATIC_DAMAGE_INCREASE_TARGETS" :key="value" :value="value">
          {{ value }}
        </option>
      </select></label
    >
    <label
      :data-property-path="JSON.stringify(['target'])"
      v-if="modifier.kind === 'addStaticHealingIncrease'"
      >治疗方向<select :value="modifier.target" @change="input('target', $event)">
        <option value="output">造成的治疗</option>
        <option value="taken">受到的治疗</option>
      </select></label
    >
    <label
      :data-property-path="JSON.stringify(['stat'])"
      v-if="modifier.kind === 'modifyBasePanelStat'"
      >面板字段<select :value="modifier.stat" @change="input('stat', $event)">
        <option v-for="value in UPGRADE_BASE_PANEL_STATS" :key="value" :value="value">
          {{ value }}
        </option>
      </select></label
    >
    <label
      :data-property-path="JSON.stringify(['operation'])"
      v-if="
        modifier.kind === 'modifyBasePanelStat' ||
        modifier.kind === 'patchSkillBlackboard' ||
        modifier.kind === 'patchPassiveBlackboard'
      "
      >运算方式<select :value="modifier.operation" @change="input('operation', $event)">
        <option value="add">加算</option>
        <option value="multiply">乘算</option>
        <option value="assign">覆盖</option>
        <option v-if="modifier.kind === 'modifyBasePanelStat'" value="flat">固定值加算</option>
        <option v-if="modifier.kind === 'modifyBasePanelStat'" value="percent">基础倍率加算</option>
      </select></label
    >
    <label
      :data-property-path="JSON.stringify(['blackboardKey'])"
      v-if="modifier.kind === 'patchSkillBlackboard' || modifier.kind === 'patchPassiveBlackboard'"
      >黑板键<input :value="modifier.blackboardKey" @change="input('blackboardKey', $event)"
    /></label>
    <label
      :data-property-path="JSON.stringify(['passiveSkillKey'])"
      v-if="modifier.kind === 'patchPassiveBlackboard'"
      >被动技能<select :value="modifier.passiveSkillKey" @change="input('passiveSkillKey', $event)">
        <option v-for="key in passiveSkillKeys" :key="key" :value="key">{{ key }}</option>
      </select></label
    >
    <label
      :data-property-path="JSON.stringify(['reaction'])"
      v-if="modifier.kind === 'addReactionDuration' || modifier.kind === 'addReactionEffectiveness'"
      >元素反应<select :value="modifier.reaction" @change="input('reaction', $event)">
        <option v-for="value in ELEMENTAL_REACTIONS" :key="value" :value="value">
          {{ value }}
        </option>
      </select></label
    >

    <fieldset
      :data-property-path="JSON.stringify(['attributes'])"
      v-if="modifier.kind === 'addBuildAttribute'"
    >
      <legend>增加的四维（至少一项）</legend>
      <button
        v-for="attribute in OPERATOR_ATTRIBUTES"
        :key="attribute"
        :class="{ active: modifier.attributes.includes(attribute) }"
        @click="toggleAttribute(attribute)"
      >
        {{ attributeLabels[attribute] }}
      </button>
    </fieldset>

    <label
      :data-property-path="JSON.stringify(['minimumUpgradeLevel'])"
      v-if="modifier.kind === 'patchSkillBlackboard'"
      >最低养成等级<input
        type="number"
        min="1"
        :value="modifier.minimumUpgradeLevel ?? ''"
        @change="optionalNumber('minimumUpgradeLevel', $event)"
    /></label>
    <label
      :data-property-path="JSON.stringify(['maximumUpgradeLevel'])"
      v-if="modifier.kind === 'patchSkillBlackboard'"
      >最高养成等级<input
        type="number"
        min="1"
        :value="modifier.maximumUpgradeLevel ?? ''"
        @change="optionalNumber('maximumUpgradeLevel', $event)"
    /></label>
    <section
      v-if="
        !conditionInGraph &&
        (modifier.kind === 'patchSkillBlackboard' || modifier.kind === 'addSkillCooldownFrames')
      "
      class="build-condition"
    >
      <header>
        <strong>构筑条件</strong
        ><button v-if="modifier.condition" @click="clearBuildCondition">移除条件</button>
      </header>
      <button v-if="!modifier.condition" @click="addBuildCondition">＋ 添加四维比较条件</button>
      <div v-else class="condition-row">
        <select :value="modifier.condition.left" @change="updateBuildCondition('left', $event)">
          <option v-for="attribute in OPERATOR_ATTRIBUTES" :key="attribute" :value="attribute">
            {{ attributeLabels[attribute] }}
          </option></select
        ><select
          :value="modifier.condition.operator"
          @change="updateBuildCondition('operator', $event)"
        >
          <option v-for="operator in COMPARISON_OPERATORS" :key="operator" :value="operator">
            {{ operator }}
          </option></select
        ><select :value="modifier.condition.right" @change="updateBuildCondition('right', $event)">
          <option v-for="attribute in OPERATOR_ATTRIBUTES" :key="attribute" :value="attribute">
            {{ attributeLabels[attribute] }}
          </option>
        </select>
      </div>
    </section>

    <div
      v-if="modifier.kind === 'patchSkillBlackboard' || modifier.kind === 'patchPassiveBlackboard'"
      class="level-field"
      :data-property-path="JSON.stringify(['value'])"
    >
      <span>修正值</span
      ><LevelValuesEditor
        :value="modifier.value"
        :current-level="1"
        @update="patch({ value: $event })"
      />
    </div>
    <div
      v-else-if="modifier.kind === 'addReactionDuration'"
      class="level-field"
      :data-property-path="JSON.stringify(['seconds'])"
    >
      <span>持续时间加算（秒）</span
      ><LevelValuesEditor
        :value="modifier.seconds"
        :current-level="1"
        @update="patch({ seconds: $event })"
      />
    </div>
    <label :data-property-path="JSON.stringify(['multiplier'])" v-else-if="'multiplier' in modifier"
      >倍率<input
        type="number"
        step="0.01"
        :value="modifier.multiplier"
        @change="numberInput('multiplier', $event)"
      /><small>1 表示不改变，1.15 表示乘以 115%。</small></label
    >
    <label :data-property-path="JSON.stringify(['frames'])" v-else-if="'frames' in modifier"
      >冷却帧加算<input
        type="number"
        step="1"
        :value="modifier.frames"
        @change="numberInput('frames', $event)"
    /></label>
    <label :data-property-path="JSON.stringify(['value'])" v-else-if="'value' in modifier"
      >数值<input
        type="number"
        step="0.01"
        :value="modifier.value"
        @change="numberInput('value', $event)"
    /></label>
  </div>
</template>

<style scoped>
.modifier-editor {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
  padding: 14px;
  border: 1px solid #3c3c40;
  background: #1b1b1e;
}
.modifier-editor > header,
.build-condition,
.modifier-editor > fieldset,
.modifier-editor > :deep(.condition-editor) {
  grid-column: 1 / -1;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
header code,
label small {
  color: var(--ea-fg-muted);
}
label {
  min-width: 0;
  display: grid;
  gap: 6px;
  color: var(--ea-fg-muted);
  font-size: 11px;
}
input,
select {
  width: 100%;
  min-width: 0;
  height: 32px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
fieldset {
  border: 1px solid var(--ea-border-soft);
}
fieldset button,
.build-condition button {
  margin: 3px;
  padding: 5px 7px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg-secondary);
}
fieldset button.active {
  border-color: var(--ea-gold);
  color: var(--ea-gold);
}
.build-condition {
  padding: 10px;
  border: 1px solid var(--ea-border-soft);
}
.condition-row {
  display: grid;
  grid-template-columns: 1fr 0.8fr 1fr;
  gap: 6px;
  margin-top: 8px;
}
@container (max-width: 520px) {
  .modifier-editor {
    grid-template-columns: 1fr;
  }
  .modifier-editor > * {
    grid-column: 1;
  }
}
.level-field {
  display: grid;
  gap: 8px;
  min-width: 0;
  grid-column: 1 / -1;
  font-size: 12px;
}
.modifier-editor--inspector {
  grid-template-columns: 1fr;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
}
.modifier-editor--inspector > header {
  display: none;
}
</style>
