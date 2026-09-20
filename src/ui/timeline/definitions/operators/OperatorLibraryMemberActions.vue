<script setup lang="ts">
import { computed } from 'vue';
import { EaButton } from '../../../../design-system/index';
import type { OperatorSkillDefinitionBinding } from '../../../../core/game-data/operatorSkillDefinitions';
import type { SkillGroupDefinition } from '../../../../core/game-data/operatorDefinition';
import {
  editOperatorLibrarySkillMember,
  operatorLibrarySkillSiblings,
  removeOperatorLibrarySkill,
} from './operatorLibraryCreation';
const props = defineProps<{ binding: OperatorSkillDefinitionBinding }>();
const emit = defineEmits<{
  update: [group: SkillGroupDefinition];
  edit: [binding: OperatorSkillDefinitionBinding];
}>();
const siblings = computed(() => operatorLibrarySkillSiblings(props.binding));
const index = computed(() =>
  siblings.value.findIndex(item =>
    props.binding.routedReplacement
      ? item.routedReplacement === props.binding.routedReplacement
      : item.skill === props.binding.skill,
  ),
);
function change(operation: 'copy' | 'up' | 'down') {
  emit('update', editOperatorLibrarySkillMember(props.binding.group, props.binding, operation));
}
</script>
<template>
  <div class="member-actions">
    <EaButton size="sm" title="在同一容器内上移" :disabled="index <= 0" @click="change('up')">
      ↑
    </EaButton>
    <EaButton
      size="sm"
      title="在同一容器内下移"
      :disabled="index < 0 || index === siblings.length - 1"
      @click="change('down')"
    >
      ↓
    </EaButton>
    <EaButton size="sm" @click="change('copy')">复制</EaButton>
    <EaButton
      variant="danger"
      size="sm"
      @click="emit('update', removeOperatorLibrarySkill(binding.group, binding))"
    >
      删除
    </EaButton>
    <EaButton variant="primary" size="sm" @click="emit('edit', binding)">编辑技能 ›</EaButton>
  </div>
</template>
<style scoped>
.member-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
</style>
