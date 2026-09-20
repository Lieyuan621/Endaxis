<script setup lang="ts">
import type { BuffShieldDamageAbsorptionDefinition } from '../../../../../packages/game-data-contract/src/buffs';
import { DAMAGE_TYPES } from '../../../../../packages/game-data-contract/src/primitives';
import BuffDefinitionScalarEditor from './BuffDefinitionScalarEditor.vue';
const props = defineProps<{ absorption: BuffShieldDamageAbsorptionDefinition }>();
const emit = defineEmits<{ update: [absorption: BuffShieldDamageAbsorptionDefinition] }>();
function setType(event: Event) {
  const damageType = (event.target as HTMLSelectElement).value;
  if (DAMAGE_TYPES.some(type => type === damageType))
    emit('update', {
      ...props.absorption,
      damageType: damageType as BuffShieldDamageAbsorptionDefinition['damageType'],
    });
}
</script>
<template>
  <div class="absorption-fields">
    <label
      ><span>伤害类型</span
      ><select :value="absorption.damageType" @change="setType">
        <option v-for="type in DAMAGE_TYPES" :key="type" :value="type">{{ type }}</option>
      </select></label
    >
    <label
      ><span>吸收比例（ratio）</span
      ><BuffDefinitionScalarEditor
        :value="absorption.ratio"
        @update="value => value !== undefined && emit('update', { ...absorption, ratio: value })"
    /></label>
    <label
      ><span>吸收系数（scale）</span
      ><BuffDefinitionScalarEditor
        :value="absorption.scale"
        @update="value => value !== undefined && emit('update', { ...absorption, scale: value })"
    /></label>
  </div>
</template>
<style scoped>
.absorption-fields,
label {
  display: grid;
  gap: 5px;
  min-width: 0;
}
.absorption-fields {
  gap: 14px;
}
span {
  color: var(--ea-fg-muted);
}
select {
  width: 100%;
  min-width: 0;
  height: 30px;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
}
</style>
