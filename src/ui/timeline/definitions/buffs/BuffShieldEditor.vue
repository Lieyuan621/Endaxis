<script setup lang="ts">
import { ref } from 'vue';
import type { InspectorPropertyPath } from '../inspector/inspectorProperty';
import type {
  BuffDuration,
  BuffShieldDefinition,
  BuffShieldAttributeValue,
} from '../../../../../packages/game-data-contract/src/buffs';
import BuffDefinitionScalarEditor from './BuffDefinitionScalarEditor.vue';
import BuffShieldAbsorptionInspector from './BuffShieldAbsorptionInspector.vue';
import { createBuffShield, createBuffShieldAbsorption } from './buffShieldGraph';
import { cloneStructureValue } from '../skillStructureEditorCommands';

const props = defineProps<{
  shields: readonly BuffShieldDefinition[];
  singleEntry?: boolean;
  propertyPath?: InspectorPropertyPath;
}>();
const emit = defineEmits<{
  update: [shields: readonly BuffShieldDefinition[], field?: 'damageAbsorptions'];
}>();
const collapsed = ref(true);

function replace(index: number, shield: BuffShieldDefinition, field?: 'damageAbsorptions'): void {
  emit(
    'update',
    props.shields.map((item, itemIndex) => (itemIndex === index ? shield : item)),
    field,
  );
}
function add(): void {
  emit('update', [...props.shields, createBuffShield()]);
}
function remove(index: number): void {
  emit(
    'update',
    props.shields.filter((_, itemIndex) => itemIndex !== index),
  );
}
function move(index: number, offset: -1 | 1): void {
  const target = index + offset;
  if (target < 0 || target >= props.shields.length) return;
  const next = [...props.shields];
  [next[index], next[target]] = [next[target]!, next[index]!];
  emit('update', next);
}
function setValueKind(index: number, shield: BuffShieldDefinition, event: Event): void {
  const kind = (event.target as HTMLSelectElement).value;
  if (kind !== 'attribute' && kind !== 'direct') return;
  if (
    kind ===
    (typeof shield.value === 'object' && 'attribute' in shield.value ? 'attribute' : 'direct')
  )
    return;
  replace(index, {
    ...shield,
    value: kind === 'attribute' ? { attribute: 'HpMax', multiplier: 1, addition: 0 } : 0,
  });
}
function updateAttributeValue(
  index: number,
  shield: BuffShieldDefinition,
  patch: Partial<BuffShieldAttributeValue>,
): void {
  if (!(typeof shield.value === 'object' && 'attribute' in shield.value)) return;
  replace(index, { ...shield, value: { ...shield.value, ...patch } });
}
function setScalar(callback: (value: BuffDuration) => void, value: BuffDuration | undefined): void {
  if (value !== undefined) callback(value);
}
function addAbsorption(index: number, shield: BuffShieldDefinition): void {
  replace(
    index,
    {
      ...shield,
      damageAbsorptions: [...shield.damageAbsorptions, createBuffShieldAbsorption()],
    },
    'damageAbsorptions',
  );
}
function replaceAbsorption(
  index: number,
  shield: BuffShieldDefinition,
  absorptionIndex: number,
  patch: Partial<BuffShieldDefinition['damageAbsorptions'][number]>,
): void {
  replace(
    index,
    {
      ...shield,
      damageAbsorptions: shield.damageAbsorptions.map((item, itemIndex) =>
        itemIndex === absorptionIndex ? { ...item, ...patch } : item,
      ),
    },
    'damageAbsorptions',
  );
}
function removeAbsorption(
  index: number,
  shield: BuffShieldDefinition,
  absorptionIndex: number,
): void {
  replace(
    index,
    {
      ...shield,
      damageAbsorptions: shield.damageAbsorptions.filter(
        (_, itemIndex) => itemIndex !== absorptionIndex,
      ),
    },
    'damageAbsorptions',
  );
}

function moveAbsorption(
  index: number,
  shield: BuffShieldDefinition,
  from: number,
  offset: -1 | 1,
): void {
  const to = from + offset;
  if (to < 0 || to >= shield.damageAbsorptions.length) return;
  const entries = [...shield.damageAbsorptions];
  [entries[from], entries[to]] = [entries[to]!, entries[from]!];
  replace(index, { ...shield, damageAbsorptions: entries }, 'damageAbsorptions');
}

function duplicateAbsorption(index: number, shield: BuffShieldDefinition, from: number): void {
  const entries = [...shield.damageAbsorptions];
  const entry = entries[from];
  if (!entry) return;
  entries.splice(from + 1, 0, cloneStructureValue(entry));
  replace(index, { ...shield, damageAbsorptions: entries }, 'damageAbsorptions');
}
</script>

<template>
  <section class="shield-editor" :class="{ 'single-entry': singleEntry }">
    <header v-if="!singleEntry">
      <button type="button" @click="collapsed = !collapsed">
        {{ collapsed ? '▸' : '▾' }} 护盾定义 <span>{{ shields.length }}</span></button
      ><button type="button" @click="add">＋</button>
    </header>
    <article v-for="(shield, index) in shields" v-show="singleEntry || !collapsed" :key="index">
      <header v-if="!singleEntry">
        <strong>护盾 {{ index + 1 }}</strong
        ><button type="button" :disabled="index === 0" @click="move(index, -1)">↑</button
        ><button type="button" :disabled="index === shields.length - 1" @click="move(index, 1)">
          ↓</button
        ><button type="button" @click="remove(index)">×</button>
      </header>
      <label class="check"
        ><input
          type="checkbox"
          :checked="shield.infinityValue"
          @change="
            replace(index, {
              ...shield,
              infinityValue: ($event.target as HTMLInputElement).checked,
            })
          "
        /><span>无限护盾值</span></label
      >
      <label
        ><span>护盾值来源</span
        ><select
          :value="
            typeof shield.value === 'object' && 'attribute' in shield.value ? 'attribute' : 'direct'
          "
          @change="setValueKind(index, shield, $event)"
        >
          <option value="direct">直接值</option>
          <option value="attribute">属性公式</option>
        </select></label
      >
      <p v-if="singleEntry" class="value-kind-hint">切换值来源会替换当前数值或公式，可撤销。</p>
      <template v-if="typeof shield.value === 'object' && 'attribute' in shield.value">
        <label
          ><span>属性来源</span
          ><select
            :value="shield.value.attributeSource ?? ''"
            @change="
              updateAttributeValue(index, shield, {
                attributeSource:
                  ($event.target as HTMLSelectElement).value === ''
                    ? undefined
                    : (($event.target as HTMLSelectElement).value as 'buffOwner' | 'buffSource'),
              })
            "
          >
            <option value="">默认</option>
            <option value="buffOwner">buffOwner</option>
            <option value="buffSource">buffSource</option>
          </select></label
        >
        <label
          ><span>属性键</span
          ><input
            type="text"
            :value="shield.value.attribute"
            @input="
              updateAttributeValue(index, shield, {
                attribute: ($event.target as HTMLInputElement).value,
              })
            "
        /></label>
        <label
          ><span>倍率</span
          ><BuffDefinitionScalarEditor
            :value="shield.value.multiplier"
            @update="
              setScalar(multiplier => updateAttributeValue(index, shield, { multiplier }), $event)
            "
        /></label>
        <label
          ><span>加值</span
          ><BuffDefinitionScalarEditor
            :value="shield.value.addition"
            @update="
              setScalar(addition => updateAttributeValue(index, shield, { addition }), $event)
            "
        /></label>
      </template>
      <label v-else
        ><span>护盾值</span
        ><BuffDefinitionScalarEditor
          :value="shield.value"
          @update="setScalar(value => replace(index, { ...shield, value }), $event)"
      /></label>
      <label
        ><span>吸收次数</span
        ><BuffDefinitionScalarEditor
          :value="shield.absorbCount"
          :minimum="-1"
          integer
          @update="setScalar(absorbCount => replace(index, { ...shield, absorbCount }), $event)"
      /></label>
      <label
        ><span>消费优先级</span
        ><select
          :value="shield.priority"
          @change="
            replace(index, {
              ...shield,
              priority: ($event.target as HTMLSelectElement)
                .value as BuffShieldDefinition['priority'],
            })
          "
        >
          <option value="normal">normal</option>
          <option value="prioritizeConsume">prioritizeConsume</option>
        </select></label
      >
      <label class="check"
        ><input
          type="checkbox"
          :checked="shield.absorbAllDamageWhenConsumed"
          @change="
            replace(index, {
              ...shield,
              absorbAllDamageWhenConsumed: ($event.target as HTMLInputElement).checked,
            })
          "
        /><span>耗尽时吸收整次伤害</span></label
      >
      <label class="check"
        ><input
          type="checkbox"
          :checked="shield.removeBuffWhenConsumed"
          @change="
            replace(index, {
              ...shield,
              removeBuffWhenConsumed: ($event.target as HTMLInputElement).checked,
            })
          "
        /><span>耗尽时移除 Buff</span></label
      >
      <label class="check"
        ><input
          type="checkbox"
          :checked="shield.replaceHitEffect"
          @change="
            replace(index, {
              ...shield,
              replaceHitEffect: ($event.target as HTMLInputElement).checked,
            })
          "
        /><span>替换受击效果证据位</span></label
      >
      <details
        class="absorptions"
        :data-property-path="propertyPath && JSON.stringify([...propertyPath, 'damageAbsorptions'])"
      >
        <summary>
          分伤害类型吸收 <small>{{ shield.damageAbsorptions.length }}</small>
        </summary>
        <button type="button" @click="addAbsorption(index, shield)">＋ 添加规则</button>
        <div
          v-for="(absorption, absorptionIndex) in shield.damageAbsorptions"
          :key="absorptionIndex"
        >
          <BuffShieldAbsorptionInspector
            :absorption="absorption"
            @update="replaceAbsorption(index, shield, absorptionIndex, $event)"
          />
          <div class="absorption-actions">
            <button
              type="button"
              title="上移"
              :disabled="absorptionIndex === 0"
              @click="moveAbsorption(index, shield, absorptionIndex, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              title="下移"
              :disabled="absorptionIndex === shield.damageAbsorptions.length - 1"
              @click="moveAbsorption(index, shield, absorptionIndex, 1)"
            >
              ↓
            </button>
            <button
              type="button"
              title="复制规则"
              @click="duplicateAbsorption(index, shield, absorptionIndex)"
            >
              复制
            </button>
            <button
              type="button"
              title="删除规则"
              @click="removeAbsorption(index, shield, absorptionIndex)"
            >
              ×
            </button>
          </div>
        </div>
      </details>
    </article>
  </section>
</template>

<style scoped>
.shield-editor {
  margin-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 10px;
}
.shield-editor > header,
.shield-editor article > header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) repeat(3, 30px);
  gap: 5px;
}
.shield-editor > header {
  grid-template-columns: minmax(0, 1fr) 30px;
}
.shield-editor button,
.shield-editor input,
.shield-editor select {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.shield-editor article {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid var(--ea-border-soft);
}
.shield-editor article > header,
.absorptions {
  grid-column: 1 / -1;
}
.shield-editor article > label {
  display: grid;
  grid-template-columns: 115px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
.shield-editor article > .check {
  display: flex;
}
.check input {
  width: 15px;
  height: 15px;
}
.absorptions {
  border: 1px solid var(--ea-border-soft);
}
.absorptions > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
  margin-top: 6px;
}
.absorptions summary {
  cursor: pointer;
  padding: 8px;
}
.absorption-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
.single-entry {
  margin-top: 0;
  border: 0;
  padding: 0;
}
.single-entry article {
  margin: 0;
  padding: 0;
  border: 0;
  grid-template-columns: minmax(0, 1fr);
}
.single-entry article > label {
  grid-template-columns: minmax(0, 1fr);
  gap: 5px;
}
.value-kind-hint {
  margin: 0;
  color: var(--ea-fg-muted);
  font-size: 12px;
}
</style>
