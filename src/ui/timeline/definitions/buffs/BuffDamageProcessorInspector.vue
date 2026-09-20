<script setup lang="ts">
import type { CombatBuffDefinitionDamageProcessor } from '../../../../../packages/game-data-contract/src/buffs';
import {
  ATTRIBUTE_MODIFIER_SLOTS,
  DAMAGE_MODIFIER_SIDES,
  DAMAGE_SCALE_ZONES,
  type AttributeModifierSlot,
} from '../../../../../packages/game-data-contract/src/modifiers';
import BuffDefinitionScalarEditor from './BuffDefinitionScalarEditor.vue';
import { createBuffDamageProcessor } from './buffDamageProcessorEditing';

const props = defineProps<{ processor: CombatBuffDefinitionDamageProcessor }>();
const emit = defineEmits<{ update: [processor: CombatBuffDefinitionDamageProcessor] }>();
function patch(patch: Partial<CombatBuffDefinitionDamageProcessor>) {
  emit('update', { ...props.processor, ...patch } as CombatBuffDefinitionDamageProcessor);
}
function setKind(event: Event) {
  const kind = (event.target as HTMLSelectElement).value;
  if ((kind === 'damageScale' || kind === 'instantAttribute') && kind !== props.processor.kind)
    emit('update', createBuffDamageProcessor(kind));
}
function setFullValue(slot: AttributeModifierSlot, event: Event) {
  if (props.processor.kind !== 'instantAttribute' || 'slot' in props.processor.values) return;
  const raw = (event.target as HTMLInputElement).value;
  if (!raw.trim() || !Number.isFinite(Number(raw))) return;
  patch({ values: { ...props.processor.values, [slot]: Number(raw) } });
}
</script>

<template>
  <section class="processor-fields">
    <label
      ><span>处理器类型</span
      ><select :value="processor.kind" @change="setKind">
        <option value="damageScale">伤害倍率区间</option>
        <option value="instantAttribute">即时属性</option>
      </select></label
    >
    <small>切换类型会替换当前处理器参数，可撤销。</small>
    <template v-if="processor.kind === 'damageScale'">
      <label
        ><span>作用侧</span
        ><select
          :value="processor.side"
          @change="
            patch({ side: ($event.target as HTMLSelectElement).value as typeof processor.side })
          "
        >
          <option v-for="side in DAMAGE_MODIFIER_SIDES" :key="side" :value="side">
            {{ side === 'attacker' ? '伤害来源方' : '伤害目标方' }}
          </option>
        </select></label
      >
      <label
        ><span>倍率区间</span
        ><select
          :value="processor.zone"
          @change="
            patch({ zone: ($event.target as HTMLSelectElement).value as typeof processor.zone })
          "
        >
          <option v-for="zone in DAMAGE_SCALE_ZONES" :key="zone" :value="zone">{{ zone }}</option>
        </select></label
      >
      <label
        ><span>增量</span
        ><BuffDefinitionScalarEditor
          :value="processor.addition"
          @update="$event !== undefined && patch({ addition: $event })"
      /></label>
    </template>
    <template v-else>
      <label
        ><span>目标侧</span
        ><select
          :value="processor.targetSide"
          @change="
            patch({
              targetSide: ($event.target as HTMLSelectElement).value as typeof processor.targetSide,
            })
          "
        >
          <option v-for="side in DAMAGE_MODIFIER_SIDES" :key="side" :value="side">
            {{ side === 'attacker' ? '伤害来源方' : '伤害目标方' }}
          </option>
        </select></label
      >
      <label
        ><span>属性键</span
        ><input
          :value="processor.attribute"
          @input="patch({ attribute: ($event.target as HTMLInputElement).value })"
      /></label>
      <template v-if="'slot' in processor.values">
        <label
          ><span>聚合槽位</span
          ><select
            :value="processor.values.slot"
            @change="
              patch({
                values: {
                  ...processor.values,
                  slot: ($event.target as HTMLSelectElement).value as AttributeModifierSlot,
                },
              })
            "
          >
            <option v-for="slot in ATTRIBUTE_MODIFIER_SLOTS" :key="slot" :value="slot">
              {{ slot }}
            </option>
          </select></label
        >
        <label
          ><span>数值</span
          ><BuffDefinitionScalarEditor
            :value="processor.values.value"
            @update="
              $event !== undefined && patch({ values: { ...processor.values, value: $event } })
            "
        /></label>
      </template>
      <fieldset v-else>
        <legend>完整八槽值</legend>
        <label v-for="slot in ATTRIBUTE_MODIFIER_SLOTS" :key="slot"
          ><span>{{ slot }}</span
          ><input
            type="number"
            step="0.01"
            :value="processor.values[slot]"
            @input="setFullValue(slot, $event)"
        /></label>
      </fieldset>
    </template>
  </section>
</template>

<style scoped>
.processor-fields,
.processor-fields label,
.processor-fields fieldset {
  display: grid;
  min-width: 0;
  gap: 8px;
}
.processor-fields label {
  gap: 5px;
}
.processor-fields span,
.processor-fields legend {
  color: var(--ea-fg-muted);
}
.processor-fields fieldset {
  margin: 0;
  padding: 8px;
  border: 1px solid var(--ea-border-soft);
}
.processor-fields input,
.processor-fields select {
  width: 100%;
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
}
</style>
