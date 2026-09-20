<script setup lang="ts">
import type { AbilityEntityChildSkillDefinition } from '../../../../core/game-data/operatorDefinition';
import SkillBlackboardEditor from '../skills/SkillBlackboardEditor.vue';

const props = defineProps<{ childSkill: AbilityEntityChildSkillDefinition; skillLevel: number }>();
const emit = defineEmits<{ update: [childSkill: AbilityEntityChildSkillDefinition] }>();
</script>

<template>
  <section class="inline-child-skill">
    <label
      ><span>子技能 ID</span
      ><input
        type="text"
        :value="childSkill.skillId"
        @input="
          emit('update', { ...childSkill, skillId: ($event.target as HTMLInputElement).value })
        "
    /></label>
    <SkillBlackboardEditor
      :blackboard="childSkill.blackboard ?? {}"
      :skill-level="skillLevel"
      @update="
        emit('update', {
          ...childSkill,
          blackboard: Object.keys($event).length === 0 ? undefined : $event,
        })
      "
    />
    <p>调度序列从左侧导图节点的＋添加。</p>
  </section>
</template>

<style scoped>
.inline-child-skill {
  display: grid;
  gap: 12px;
}
.inline-child-skill > label {
  display: grid;
  grid-template-columns: minmax(120px, 160px) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}
.inline-child-skill input {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.inline-child-skill p {
  margin: 0;
  color: var(--ea-fg-muted);
}
</style>
