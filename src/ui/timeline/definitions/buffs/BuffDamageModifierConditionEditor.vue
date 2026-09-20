<script setup lang="ts">
import type { DamageModifierCondition } from '../../../../../packages/game-data-contract/src/modifiers';
import {
  COMPARISON_OPERATORS,
  COMBAT_TARGETS,
  DAMAGE_FEATURES,
  DAMAGE_TAGS,
  DAMAGE_TYPES,
  type ComparisonOperator,
  type DamageFeature,
  type DamageTag,
  type DamageType,
} from '../../../../../packages/game-data-contract/src/primitives';
import { GAMEPLAY_TAG_QUERY_TYPES } from '../../../../../packages/game-data-contract/src/gameplayTags';
import BuffDefinitionScalarEditor from './BuffDefinitionScalarEditor.vue';
import GameplayTagsEditor from '../inspector/GameplayTagsEditor.vue';
import InspectorStringList from '../inspector/InspectorStringList.vue';

const props = defineProps<{ condition: DamageModifierCondition; layerOnly?: boolean }>();
const emit = defineEmits<{ update: [condition: DamageModifierCondition] }>();

const CONDITION_KINDS = [
  'entityTagMatch',
  'casterControlled',
  'buffIdCountCompare',
  'eventDamageTagsMatch',
  'eventDamageFeaturesMatch',
  'eventDamageTypesMatch',
  'targetHealthCompare',
  'targetPoiseCompare',
  'sourceSkillCastMatch',
  'buffBlackboardCompare',
  'not',
  'all',
  'any',
] as const satisfies readonly DamageModifierCondition['kind'][];

function createCondition(kind: DamageModifierCondition['kind']): DamageModifierCondition {
  switch (kind) {
    case 'entityTagMatch':
      return { kind, target: 'caster', tagQueryType: 'hasAny', tags: [] };
    case 'casterControlled':
    case 'sourceSkillCastMatch':
      return { kind };
    case 'buffIdCountCompare':
      return { kind, target: 'caster', buffIds: [], operator: 'greaterOrEqual', value: 1 };
    case 'eventDamageTagsMatch':
      return { kind, match: 'hasAny', tags: ['normalAttack'] };
    case 'eventDamageFeaturesMatch':
      return { kind, match: 'hasAny', features: ['canBreakWeakness'] };
    case 'eventDamageTypesMatch':
      return { kind, damageTypes: ['physical'] };
    case 'targetHealthCompare':
      return { kind, target: 'enemy', valueType: 'ratio', operator: 'less', value: 0.5 };
    case 'targetPoiseCompare':
      return {
        kind,
        target: 'enemy',
        returnValueIfMissing: false,
        operator: 'equal',
        value: 0,
      };
    case 'buffBlackboardCompare':
      return { kind, left: 0, operator: 'equal', right: 0 };
    case 'not':
      return { kind, condition: { kind: 'casterControlled' } };
    case 'all':
    case 'any':
      return { kind, conditions: [{ kind: 'casterControlled' }] };
  }
}

function updatePatch(patch: Partial<DamageModifierCondition>): void {
  emit('update', { ...props.condition, ...patch } as DamageModifierCondition);
}

function setKind(event: Event): void {
  const kind = (event.target as HTMLSelectElement).value as DamageModifierCondition['kind'];
  if (!CONDITION_KINDS.includes(kind) || kind === props.condition.kind) return;
  if (
    (kind === 'all' || kind === 'any') &&
    (props.condition.kind === 'all' || props.condition.kind === 'any')
  ) {
    emit('update', { ...props.condition, kind });
    return;
  }
  emit('update', createCondition(kind));
}

function setOperator(event: Event): void {
  updatePatch({ operator: (event.target as HTMLSelectElement).value as ComparisonOperator });
}

function toggleArrayValue<T extends string>(values: readonly T[], value: T): readonly T[] {
  if (values.includes(value))
    return values.length === 1 ? values : values.filter(item => item !== value);
  return [...values, value];
}

function setChild(index: number, child: DamageModifierCondition): void {
  if (props.condition.kind !== 'all' && props.condition.kind !== 'any') return;
  updatePatch({
    conditions: props.condition.conditions.map((item, i) => (i === index ? child : item)),
  });
}

function addChild(): void {
  if (props.condition.kind !== 'all' && props.condition.kind !== 'any') return;
  updatePatch({ conditions: [...props.condition.conditions, { kind: 'casterControlled' }] });
}

function removeChild(index: number): void {
  if (props.condition.kind !== 'all' && props.condition.kind !== 'any') return;
  if (props.condition.conditions.length <= 1) return;
  updatePatch({ conditions: props.condition.conditions.filter((_, i) => i !== index) });
}
</script>

<template>
  <section class="damage-condition" :class="{ 'damage-condition--layer': layerOnly }">
    <label>
      <span>条件类型</span>
      <select :value="condition.kind" @change="setKind">
        <option v-for="kind in CONDITION_KINDS" :key="kind" :value="kind">{{ kind }}</option>
      </select>
    </label>

    <p v-if="layerOnly" class="condition-kind-help">
      “全部满足”和“任一满足”互换保留子条件；切换为其他类型会替换当前条件及其子树，可撤销。
    </p>
    <template v-if="condition.kind === 'entityTagMatch'">
      <label>
        <span>目标</span>
        <select
          :value="condition.target"
          @change="
            updatePatch({
              target: ($event.target as HTMLSelectElement).value as 'caster' | 'enemy',
            })
          "
        >
          <option v-for="target in COMBAT_TARGETS" :key="target" :value="target">
            {{ target }}
          </option>
        </select>
      </label>
      <label>
        <span>标签查询</span>
        <select
          :value="condition.tagQueryType"
          @change="
            updatePatch({
              tagQueryType: ($event.target as HTMLSelectElement)
                .value as typeof condition.tagQueryType,
            })
          "
        >
          <option v-for="kind in GAMEPLAY_TAG_QUERY_TYPES" :key="kind" :value="kind">
            {{ kind }}
          </option>
        </select>
      </label>
      <GameplayTagsEditor
        :tags="condition.tags"
        :minimum="0"
        @update="updatePatch({ tags: $event })"
      />
    </template>

    <template v-else-if="condition.kind === 'buffIdCountCompare'">
      <label>
        <span>目标</span>
        <select
          :value="condition.target"
          @change="
            updatePatch({
              target: ($event.target as HTMLSelectElement).value as 'caster' | 'enemy',
            })
          "
        >
          <option v-for="target in COMBAT_TARGETS" :key="target" :value="target">
            {{ target }}
          </option>
        </select>
      </label>
      <InspectorStringList
        label="Buff ID"
        :value="condition.buffIds"
        @update="updatePatch({ buffIds: $event })"
      />
      <label
        ><span>比较</span
        ><select :value="condition.operator" @change="setOperator">
          <option v-for="operator in COMPARISON_OPERATORS" :key="operator" :value="operator">
            {{ operator }}
          </option>
        </select></label
      >
      <label
        ><span>数量</span
        ><BuffDefinitionScalarEditor
          :value="condition.value"
          @update="$event !== undefined && updatePatch({ value: $event })"
      /></label>
    </template>

    <template v-else-if="condition.kind === 'eventDamageTagsMatch'">
      <label
        ><span>匹配方式</span
        ><select
          :value="condition.match"
          @change="
            updatePatch({
              match: ($event.target as HTMLSelectElement).value as 'hasAny' | 'hasAll',
            })
          "
        >
          <option value="hasAny">hasAny</option>
          <option value="hasAll">hasAll</option>
        </select></label
      >
      <fieldset>
        <legend>伤害标签</legend>
        <label v-for="tag in DAMAGE_TAGS" :key="tag"
          ><input
            type="checkbox"
            :checked="condition.tags.includes(tag)"
            @change="updatePatch({ tags: toggleArrayValue<DamageTag>(condition.tags, tag) })"
          />{{ tag }}</label
        >
      </fieldset>
    </template>

    <template v-else-if="condition.kind === 'eventDamageFeaturesMatch'">
      <label
        ><span>匹配方式</span
        ><select
          :value="condition.match"
          @change="
            updatePatch({
              match: ($event.target as HTMLSelectElement).value as 'hasAny' | 'hasAll',
            })
          "
        >
          <option value="hasAny">hasAny</option>
          <option value="hasAll">hasAll</option>
        </select></label
      >
      <fieldset>
        <legend>伤害特征</legend>
        <label v-for="feature in DAMAGE_FEATURES" :key="feature"
          ><input
            type="checkbox"
            :checked="condition.features.includes(feature)"
            @change="
              updatePatch({
                features: toggleArrayValue<DamageFeature>(condition.features, feature),
              })
            "
          />{{ feature }}</label
        >
      </fieldset>
    </template>

    <fieldset v-else-if="condition.kind === 'eventDamageTypesMatch'">
      <legend>伤害类型</legend>
      <label v-for="damageType in DAMAGE_TYPES" :key="damageType"
        ><input
          type="checkbox"
          :checked="condition.damageTypes.includes(damageType)"
          @change="
            updatePatch({
              damageTypes: toggleArrayValue<DamageType>(condition.damageTypes, damageType),
            })
          "
        />{{ damageType }}</label
      >
    </fieldset>

    <template v-else-if="condition.kind === 'targetHealthCompare'">
      <label
        ><span>数值类型</span
        ><select
          :value="condition.valueType"
          @change="
            updatePatch({
              valueType: ($event.target as HTMLSelectElement).value as 'current' | 'ratio',
            })
          "
        >
          <option value="current">current</option>
          <option value="ratio">ratio</option>
        </select></label
      >
      <label
        ><span>比较</span
        ><select :value="condition.operator" @change="setOperator">
          <option v-for="operator in COMPARISON_OPERATORS" :key="operator" :value="operator">
            {{ operator }}
          </option>
        </select></label
      >
      <label
        ><span>数值</span
        ><BuffDefinitionScalarEditor
          :value="condition.value"
          @update="$event !== undefined && updatePatch({ value: $event })"
      /></label>
    </template>

    <template v-else-if="condition.kind === 'targetPoiseCompare'">
      <label
        ><span>缺少失衡值时</span
        ><input
          type="checkbox"
          :checked="condition.returnValueIfMissing"
          @change="
            updatePatch({ returnValueIfMissing: ($event.target as HTMLInputElement).checked })
          "
      /></label>
      <label
        ><span>比较</span
        ><select :value="condition.operator" @change="setOperator">
          <option v-for="operator in COMPARISON_OPERATORS" :key="operator" :value="operator">
            {{ operator }}
          </option>
        </select></label
      >
      <label
        ><span>数值</span
        ><BuffDefinitionScalarEditor
          :value="condition.value"
          @update="$event !== undefined && updatePatch({ value: $event })"
      /></label>
    </template>

    <template v-else-if="condition.kind === 'buffBlackboardCompare'">
      <label
        ><span>左操作数</span
        ><BuffDefinitionScalarEditor
          :value="condition.left"
          @update="$event !== undefined && updatePatch({ left: $event })"
      /></label>
      <label
        ><span>比较</span
        ><select :value="condition.operator" @change="setOperator">
          <option v-for="operator in COMPARISON_OPERATORS" :key="operator" :value="operator">
            {{ operator }}
          </option>
        </select></label
      >
      <label
        ><span>右操作数</span
        ><BuffDefinitionScalarEditor
          :value="condition.right"
          @update="$event !== undefined && updatePatch({ right: $event })"
      /></label>
    </template>

    <p
      v-else-if="
        layerOnly &&
        (condition.kind === 'not' || condition.kind === 'all' || condition.kind === 'any')
      "
      class="structure-hint"
    >
      子条件在节点图中编辑。
    </p>
    <BuffDamageModifierConditionEditor
      v-else-if="condition.kind === 'not'"
      :condition="condition.condition"
      @update="updatePatch({ condition: $event })"
    />

    <div
      v-else-if="condition.kind === 'all' || condition.kind === 'any'"
      class="condition-children"
    >
      <article v-for="(child, index) in condition.conditions" :key="index">
        <button
          type="button"
          :disabled="condition.conditions.length <= 1"
          @click="removeChild(index)"
        >
          ×
        </button>
        <BuffDamageModifierConditionEditor :condition="child" @update="setChild(index, $event)" />
      </article>
      <button type="button" @click="addChild">＋添加子条件</button>
    </div>
  </section>
</template>

<style scoped>
.damage-condition {
  display: grid;
  gap: 7px;
  padding: 8px;
  border: 1px solid var(--ea-border-soft);
}
.damage-condition--layer {
  padding: 0;
  border: 0;
}
.damage-condition--layer > label {
  grid-template-columns: minmax(0, 1fr);
}
.structure-hint {
  margin: 0;
  color: var(--ea-fg-muted);
}
.damage-condition > label {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
.damage-condition input,
.damage-condition select,
.damage-condition button {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.damage-condition fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  border: 1px solid var(--ea-border-soft);
}
.damage-condition fieldset label {
  display: flex;
  align-items: center;
  gap: 4px;
}
.damage-condition fieldset input {
  width: 15px;
  height: 15px;
}
.condition-children,
.condition-children > article {
  display: grid;
  gap: 6px;
}
.condition-children > article {
  grid-template-columns: 30px minmax(0, 1fr);
}
</style>
