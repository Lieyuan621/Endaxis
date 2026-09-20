<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
/** SkillSetting 专用四列与增强公式编辑；普通属性读取已由公共字段负责。 */
import type {
  ActionValueOperand,
  CombatStepDefinition,
} from '../../../../core/game-data/operatorDefinition';
import ActionValueOperandEditor from './ActionValueOperandEditor.vue';

type SettingStep = CombatStepForKind<'readSkillSettingData'>;

type SettingItem = SettingStep['parameters']['items'][number];

const props = defineProps<{ step: SettingStep }>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();

const operandLabels = {
  constant: '常量',
  blackboard: '动作黑板',
  blackboardKey: '黑板键',
  constantValue: '常量值',
};

function replaceSettingItem(index: number, item: SettingItem): void {
  if (props.step.kind !== 'readSkillSettingData') return;
  const items = [...props.step.parameters.items];
  items[index] = item;
  emit('update', { ...props.step, parameters: { items } });
}

function setSettingValue(index: number, column: number, event: Event): void {
  if (props.step.kind !== 'readSkillSettingData') return;
  const value = Number((event.target as HTMLInputElement).value);
  const item = props.step.parameters.items[index];
  if (!Number.isFinite(value) || item === undefined) return;
  const values = [...item.values];
  values[column] = value;
  replaceSettingItem(index, { ...item, values });
}

function setSettingColumn(index: number, column: ActionValueOperand): void {
  if (props.step.kind !== 'readSkillSettingData') return;
  const item = props.step.parameters.items[index];
  if (item === undefined) return;
  replaceSettingItem(index, { ...item, column });
}

function setSettingKey(index: number, event: Event): void {
  if (props.step.kind !== 'readSkillSettingData') return;
  const item = props.step.parameters.items[index];
  if (item === undefined) return;
  replaceSettingItem(index, { ...item, storeKey: (event.target as HTMLInputElement).value });
}

function toggleEnhance(index: number, event: Event): void {
  if (props.step.kind !== 'readSkillSettingData') return;
  const item = props.step.parameters.items[index];
  if (item === undefined) return;
  const enabled = (event.target as HTMLInputElement).checked;
  if (enabled) {
    replaceSettingItem(index, {
      ...item,
      enhance: { target: 'caster', formula: { kind: 'linear', paramA: 0 } },
    });
  } else {
    const next = { ...item };
    delete next.enhance;
    replaceSettingItem(index, next);
  }
}

function setEnhanceTarget(index: number, event: Event): void {
  if (props.step.kind !== 'readSkillSettingData') return;
  const item = props.step.parameters.items[index];
  if (item?.enhance === undefined) return;
  const target = (event.target as HTMLSelectElement).value as 'caster' | 'buffOwner' | 'buffSource';
  replaceSettingItem(index, { ...item, enhance: { ...item.enhance, target } });
}

function setFormulaKind(index: number, event: Event): void {
  if (props.step.kind !== 'readSkillSettingData') return;
  const item = props.step.parameters.items[index];
  if (item?.enhance === undefined) return;
  const kind = (event.target as HTMLSelectElement).value as 'linear' | 'saturating';
  replaceSettingItem(index, {
    ...item,
    enhance: {
      ...item.enhance,
      formula:
        kind === 'linear'
          ? { kind, paramA: item.enhance.formula.paramA }
          : {
              kind,
              paramA: item.enhance.formula.paramA,
              paramB: item.enhance.formula.kind === 'saturating' ? item.enhance.formula.paramB : 0,
            },
    },
  });
}

function setFormulaParam(index: number, field: 'paramA' | 'paramB', event: Event): void {
  if (props.step.kind !== 'readSkillSettingData') return;
  const item = props.step.parameters.items[index];
  const value = Number((event.target as HTMLInputElement).value);
  if (item?.enhance === undefined || !Number.isFinite(value)) return;
  const formula = item.enhance.formula;
  if (field === 'paramB' && formula.kind !== 'saturating') return;
  replaceSettingItem(index, {
    ...item,
    enhance: { ...item.enhance, formula: { ...formula, [field]: value } },
  });
}

function appendSettingItem(): void {
  if (props.step.kind !== 'readSkillSettingData') return;
  emit('update', {
    ...props.step,
    parameters: {
      items: [
        ...props.step.parameters.items,
        {
          values: [0, 0, 0, 0],
          column: { kind: 'constant', value: 0 },
          storeKey: `custom-setting-value-${props.step.parameters.items.length + 1}`,
        },
      ],
    },
  });
}

function removeSettingItem(index: number): void {
  if (props.step.kind !== 'readSkillSettingData') return;
  emit('update', {
    ...props.step,
    parameters: { items: props.step.parameters.items.filter((_, current) => current !== index) },
  });
}
</script>

<template>
  <div class="source-value-editor">
    <article v-for="(item, index) in step.parameters.items" :key="index" class="setting-item">
      <header>
        <strong>SkillSetting 项 {{ index + 1 }}</strong>
        <button type="button" @click="removeSettingItem(index)">删除</button>
      </header>
      <label>
        <span>写入动作黑板键</span>
        <input :value="item.storeKey" @input="setSettingKey(index, $event)" />
      </label>
      <fieldset>
        <legend>四列原始值</legend>
        <input
          v-for="(value, column) in item.values"
          :key="column"
          type="number"
          step="0.01"
          :aria-label="`第 ${column + 1} 列`"
          :value="value"
          @input="setSettingValue(index, column, $event)"
        />
      </fieldset>
      <label class="source-value-editor__operand">
        <span>运行时列号</span>
        <ActionValueOperandEditor
          :value="item.column"
          :labels="operandLabels"
          @update="setSettingColumn(index, $event)"
        />
      </label>
      <label class="source-value-editor__check">
        <input
          type="checkbox"
          :checked="item.enhance !== undefined"
          @change="toggleEnhance(index, $event)"
        />
        <span>按目标属性强化读取值</span>
      </label>
      <template v-if="item.enhance !== undefined">
        <label>
          <span>强化属性目标</span>
          <select :value="item.enhance.target" @change="setEnhanceTarget(index, $event)">
            <option value="caster">施法者</option>
            <option value="buffOwner">Buff 宿主</option>
            <option value="buffSource">Buff 来源</option>
          </select>
        </label>
        <label>
          <span>强化公式</span>
          <select :value="item.enhance.formula.kind" @change="setFormulaKind(index, $event)">
            <option value="linear">线性</option>
            <option value="saturating">饱和</option>
          </select>
        </label>
        <label>
          <span>参数 A</span>
          <input
            type="number"
            step="0.01"
            :value="item.enhance.formula.paramA"
            @input="setFormulaParam(index, 'paramA', $event)"
          />
        </label>
        <label v-if="item.enhance.formula.kind === 'saturating'">
          <span>参数 B</span>
          <input
            type="number"
            step="0.01"
            :value="item.enhance.formula.paramB"
            @input="setFormulaParam(index, 'paramB', $event)"
          />
        </label>
      </template>
    </article>
    <button type="button" class="source-value-editor__append" @click="appendSettingItem">
      添加 SkillSetting 项
    </button>
    <p>每项固定保存四列原始值；运行时列号可以来自常量或动作黑板，编辑器不会猜当前应选哪一列。</p>
  </div>
</template>

<style scoped>
.source-value-editor {
  display: grid;
  gap: 10px;
  padding: 14px;
}
.setting-item {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--ea-border-soft);
}
.setting-item header,
.setting-item fieldset,
.source-value-editor__operand,
.source-value-editor__note,
.source-value-editor > p {
  grid-column: 1 / -1;
}
.setting-item header {
  display: flex;
  justify-content: space-between;
}
.setting-item label {
  display: grid;
  gap: 5px;
}
.setting-item fieldset {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  border: 0;
  padding: 0;
}
.source-value-editor__check {
  display: flex !important;
  grid-template-columns: none !important;
  align-items: center;
}
.source-value-editor__append {
  min-height: 32px;
  border: 1px dashed var(--ea-border);
  background: transparent;
  color: var(--ea-fg-muted);
}
.source-value-editor__note,
.source-value-editor > p {
  margin: 0;
  padding: 10px 12px;
  border-left: 2px solid var(--ea-gold);
  background: color-mix(in srgb, var(--ea-gold) 7%, transparent);
  color: var(--ea-fg-muted);
  line-height: 1.6;
}
</style>
