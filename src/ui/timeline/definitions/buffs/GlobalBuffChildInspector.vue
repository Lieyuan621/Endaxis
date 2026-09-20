<script setup lang="ts">
import type {
  ActionValueOperand,
  SkillGlobalBuffChildDefinition,
} from '../../../../core/game-data/operatorDefinition';
import ActionValueAssignmentMapEditor from '../actions/ActionValueAssignmentMapEditor.vue';

const props = defineProps<{ child: SkillGlobalBuffChildDefinition }>();
const emit = defineEmits<{ update: [child: SkillGlobalBuffChildDefinition] }>();
function setId(event: Event): void {
  emit('update', { ...props.child, buffId: (event.target as HTMLInputElement).value });
}
function setAssignments(assignments: Readonly<Record<string, ActionValueOperand>>): void {
  emit('update', { ...props.child, blackboardAssignments: assignments });
}
</script>

<template>
  <section class="global-child">
    <label><span>子 Buff ID</span><input type="text" :value="child.buffId" @input="setId" /></label>
    <ActionValueAssignmentMapEditor
      :assignments="child.blackboardAssignments"
      title="从父黑板写入子 Buff 黑板"
      @update="setAssignments"
    />
  </section>
</template>

<style scoped>
.global-child {
  display: grid;
  gap: 12px;
}
.global-child > label {
  display: grid;
  grid-template-columns: minmax(120px, 160px) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}
.global-child input {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
</style>
