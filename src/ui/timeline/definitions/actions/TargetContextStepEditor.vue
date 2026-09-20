<script setup lang="ts">
import type {
  CombatStepForKind,
  CombatStepParameters,
} from '../../../../../packages/game-data-contract/src/actions';
import type { CombatStepDefinition } from '../../../../core/game-data/operatorDefinition';
import ActionValueOperandEditor from './ActionValueOperandEditor.vue';

type TargetContextStep = CombatStepForKind<
  | 'mergeContextTargets'
  | 'findCharacterTeamTargets'
  | 'findOwnerSpawnedAbilityEntities'
  | 'pickContextTarget'
>;
const props = defineProps<{ step: TargetContextStep }>();
type MergeSourceKind = CombatStepParameters['mergeContextTargets']['sources'][number]['kind'];
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();
const operandLabels = {
  constant: '常量',
  blackboard: '动作黑板',
  blackboardKey: '黑板键',
  constantValue: '常量值',
};

function field(event: Event): string {
  return (event.target as HTMLInputElement).value;
}

function update(parameters: TargetContextStep['parameters']): void {
  emit('update', { ...props.step, parameters } as TargetContextStep);
}

function setOptionalText(name: 'ownerContextKey' | 'saveCountToBlackboardKey', event: Event): void {
  if (props.step.kind !== 'findOwnerSpawnedAbilityEntities') return;
  const parameters = { ...props.step.parameters };
  const value = field(event).trim();
  if (value === '') delete parameters[name];
  else parameters[name] = value;
  update(parameters);
}

function setEntityIds(event: Event): void {
  if (props.step.kind !== 'findOwnerSpawnedAbilityEntities') return;
  const values = field(event)
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  const parameters = { ...props.step.parameters };
  if (values.length === 0) delete parameters.abilityEntityIds;
  else parameters.abilityEntityIds = values;
  update(parameters);
}

function setOptionalCount(event: Event): void {
  if (props.step.kind !== 'findOwnerSpawnedAbilityEntities') return;
  const parameters = { ...props.step.parameters };
  const raw = field(event);
  if (raw === '') delete parameters.maxTargets;
  else {
    const value = Math.round(Number(raw));
    if (!Number.isFinite(value) || value < 0) return;
    parameters.maxTargets = value;
  }
  update(parameters);
}

function appendMergeSource(): void {
  if (props.step.kind !== 'mergeContextTargets') return;
  update({
    ...props.step.parameters,
    sources: [...props.step.parameters.sources, { kind: 'target', target: 'caster' }],
  });
}

function setMergeSource(index: number, kind: MergeSourceKind, value: string): void {
  if (props.step.kind !== 'mergeContextTargets') return;
  const sources = [...props.step.parameters.sources];
  sources[index] =
    kind === 'target'
      ? {
          kind,
          target: (value || 'caster') as
            'caster' | 'enemy' | 'eventTarget' | 'buffSource' | 'currentTarget',
        }
      : kind === 'abilitySystemSource'
        ? { kind, owner: value === 'actionOwner' ? 'actionOwner' : 'actionSource' }
        : { kind, contextKey: value };
  update({ ...props.step.parameters, sources });
}

function removeMergeSource(index: number): void {
  if (props.step.kind !== 'mergeContextTargets') return;
  update({
    ...props.step.parameters,
    sources: props.step.parameters.sources.filter((_, i) => i !== index),
  });
}

function setSelectionKind(event: Event): void {
  if (props.step.kind !== 'findCharacterTeamTargets') return;
  const kind = (event.target as HTMLSelectElement).value as
    'allOperators' | 'controlledOperator' | 'lowestHealthRatioOperator';
  update({ ...props.step.parameters, selection: { kind } });
}
</script>

<template>
  <div class="target-context">
    <template v-if="step.kind === 'mergeContextTargets'">
      <label
        ><span>写入 Context 键</span
        ><input
          type="text"
          :value="step.parameters.saveToContextKey"
          @input="update({ ...step.parameters, saveToContextKey: field($event) })"
      /></label>
      <fieldset>
        <legend>合并来源（保持顺序并去重）</legend>
        <div
          v-for="(source, index) in step.parameters.sources"
          :key="index"
          class="target-context__source"
        >
          <select
            :value="source.kind"
            @change="
              setMergeSource(
                index,
                ($event.target as HTMLSelectElement).value as MergeSourceKind,
                '',
              )
            "
          >
            <option value="target">稳定目标</option>
            <option value="context">Context 目标组</option>
            <option value="abilitySystemSource">单层能力系统来源</option>
          </select>
          <select
            v-if="source.kind === 'target'"
            :value="source.target"
            @change="setMergeSource(index, 'target', ($event.target as HTMLSelectElement).value)"
          >
            <option value="caster">施法者</option>
            <option value="enemy">敌人</option>
            <option value="eventTarget">事件目标</option>
            <option value="buffSource">Buff 来源</option>
            <option value="currentTarget">当前迭代目标</option>
          </select>
          <select
            v-else-if="source.kind === 'abilitySystemSource'"
            :value="source.owner"
            @change="setMergeSource(index, 'abilitySystemSource', field($event))"
          >
            <option value="actionSource">查询动作来源的 source</option>
            <option value="actionOwner">查询动作宿主的 source</option>
          </select>
          <input
            v-else
            type="text"
            :value="source.contextKey"
            placeholder="Context 键"
            @input="setMergeSource(index, 'context', field($event))"
          />
          <button type="button" @click="removeMergeSource(index)">×</button>
        </div>
        <button type="button" @click="appendMergeSource">＋ 添加来源</button>
      </fieldset>
    </template>

    <template v-else-if="step.kind === 'findCharacterTeamTargets'">
      <label
        ><span>写入 Context 键</span
        ><input
          type="text"
          :value="step.parameters.saveToContextKey"
          @input="update({ ...step.parameters, saveToContextKey: field($event) })"
      /></label>
      <label
        ><span>队伍筛选</span
        ><select :value="step.parameters.selection.kind" @change="setSelectionKind">
          <option value="allOperators">全体干员快照</option>
          <option value="controlledOperator">当前操控干员</option>
          <option value="lowestHealthRatioOperator">最低生命比例干员</option>
        </select></label
      >
      <template v-if="step.parameters.selection.kind === 'lowestHealthRatioOperator'">
        <label
          ><span>排除 Context 组</span
          ><input
            type="text"
            :value="step.parameters.selection.excludedContextKey ?? ''"
            @input="
              update({
                ...step.parameters,
                selection: {
                  ...step.parameters.selection,
                  excludedContextKey: field($event) || undefined,
                },
              })
            "
        /></label>
        <label class="target-context__toggle"
          ><input
            type="checkbox"
            :checked="step.parameters.selection.excludeCaster === true"
            @change="
              update({
                ...step.parameters,
                selection: {
                  ...step.parameters.selection,
                  excludeCaster: ($event.target as HTMLInputElement).checked ? true : undefined,
                },
              })
            "
          />排除施法者</label
        >
        <label class="target-context__toggle"
          ><input
            type="checkbox"
            :checked="step.parameters.selection.excludeCurrentTarget === true"
            @change="
              update({
                ...step.parameters,
                selection: {
                  ...step.parameters.selection,
                  excludeCurrentTarget: ($event.target as HTMLInputElement).checked
                    ? true
                    : undefined,
                },
              })
            "
          />排除当前迭代目标</label
        >
      </template>
    </template>

    <template v-else-if="step.kind === 'findOwnerSpawnedAbilityEntities'">
      <label
        ><span>写入 Context 键</span
        ><input
          type="text"
          :value="step.parameters.saveToContextKey"
          @input="update({ ...step.parameters, saveToContextKey: field($event) })"
      /></label>
      <label
        ><span>实体 ID（逗号分隔）</span
        ><input
          type="text"
          :value="step.parameters.abilityEntityIds?.join(', ') ?? ''"
          @change="setEntityIds"
      /></label>
      <label
        ><span>Owner Context 键</span
        ><input
          type="text"
          :value="step.parameters.ownerContextKey ?? ''"
          @input="setOptionalText('ownerContextKey', $event)"
      /></label>
      <label
        ><span>最多保留数量</span
        ><input
          type="number"
          min="0"
          step="1"
          :value="step.parameters.maxTargets ?? ''"
          @input="setOptionalCount"
      /></label>
      <label
        ><span>数量写入动作黑板</span
        ><input
          type="text"
          :value="step.parameters.saveCountToBlackboardKey ?? ''"
          @input="setOptionalText('saveCountToBlackboardKey', $event)"
      /></label>
      <label class="target-context__toggle"
        ><input
          type="checkbox"
          :checked="step.parameters.sameSourceSkillCast === true"
          @change="
            update({
              ...step.parameters,
              sameSourceSkillCast: ($event.target as HTMLInputElement).checked,
            })
          "
        />只查同次技能释放来源</label
      >
      <fieldset>
        <legend>环形顺序截取</legend>
        <label class="target-context__toggle"
          ><input
            type="checkbox"
            :checked="step.parameters.circularOrder !== undefined"
            @change="
              update({
                ...step.parameters,
                circularOrder: ($event.target as HTMLInputElement).checked
                  ? { indexBlackboardKey: 'index', desiredCount: 1, reverseFlag: 0 }
                  : undefined,
              })
            "
          />启用</label
        >
        <template v-if="step.parameters.circularOrder"
          ><label
            ><span>起点动作黑板键</span
            ><input
              type="text"
              :value="step.parameters.circularOrder.indexBlackboardKey"
              @input="
                update({
                  ...step.parameters,
                  circularOrder: {
                    ...step.parameters.circularOrder!,
                    indexBlackboardKey: field($event),
                  },
                })
              " /></label
          ><label
            ><span>保留数量</span
            ><input
              type="number"
              min="1"
              step="1"
              :value="step.parameters.circularOrder.desiredCount"
              @input="
                update({
                  ...step.parameters,
                  circularOrder: {
                    ...step.parameters.circularOrder!,
                    desiredCount: Math.max(1, Math.round(Number(field($event)))),
                  },
                })
              " /></label
          ><label
            ><span>方向标志</span
            ><input
              type="number"
              step="1"
              :value="step.parameters.circularOrder.reverseFlag"
              @input="
                update({
                  ...step.parameters,
                  circularOrder: {
                    ...step.parameters.circularOrder!,
                    reverseFlag: Number(field($event)),
                  },
                })
              " /></label
        ></template>
      </fieldset>
    </template>

    <template v-else>
      <label
        ><span>来源 Context 键</span
        ><input
          type="text"
          :value="step.parameters.sourceContextKey"
          @input="update({ ...step.parameters, sourceContextKey: field($event) })"
      /></label>
      <label
        ><span>写入 Context 键</span
        ><input
          type="text"
          :value="step.parameters.saveToContextKey"
          @input="update({ ...step.parameters, saveToContextKey: field($event) })"
      /></label>
      <label
        ><span>运行时索引</span
        ><ActionValueOperandEditor
          :value="step.parameters.index"
          :labels="operandLabels"
          @update="update({ ...step.parameters, index: $event })"
      /></label>
    </template>
  </div>
</template>

<style scoped>
.target-context {
  min-width: 0;
  display: grid;
  gap: 10px;
}
.target-context > label,
.target-context fieldset > label {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(140px, 180px) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}
.target-context .target-context__toggle {
  display: flex;
}
.target-context fieldset {
  min-width: 0;
  display: grid;
  gap: 8px;
  border: 1px solid var(--ea-border-soft);
}
.target-context__source {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr) 28px;
  gap: 8px;
}
.target-context input,
.target-context select,
.target-context button {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
</style>
