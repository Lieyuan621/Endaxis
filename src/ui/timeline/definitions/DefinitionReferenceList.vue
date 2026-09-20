<script setup lang="ts">
import type { OperatorDefinitionReference } from './operators/operatorDefinitionReferences';
defineProps<{ references: readonly OperatorDefinitionReference[] }>();
const emit = defineEmits<{ reveal: [reference: OperatorDefinitionReference] }>();
const owners = {
  skill: '技能',
  buff: 'Buff',
  entity: '能力实体',
  passiveSkill: '常驻被动',
  operatorEvent: '角色事件',
  comboCondition: '连携条件',
  upgrade: '天赋 / 潜能',
  operator: '角色设置',
} as const;
function ownerLabel(reference: OperatorDefinitionReference) {
  if (reference.ownerKind === 'upgrade') {
    const match = /^(talents|potentials)\/(\d+)$/.exec(reference.ownerId);
    if (match) return `${match[1] === 'talents' ? '天赋' : '潜能'} ${Number(match[2]) + 1}`;
  }
  return `${owners[reference.ownerKind]} · ${reference.ownerId}`;
}
</script>
<template>
  <details v-if="references.length" class="definition-references">
    <summary>使用点 · {{ references.length }}<span>查看引用位置</span></summary>
    <div class="reference-content">
      <p>删除定义不会清理使用点；缺失引用会由定义检查报告，删除可撤销。</p>
      <button
        v-for="reference in references"
        :key="reference.path"
        type="button"
        @click="emit('reveal', reference)"
      >
        <strong>{{ ownerLabel(reference) }}</strong>
        <code>{{ reference.path }}</code>
      </button>
    </div>
  </details>
</template>
<style scoped>
.definition-references {
  flex: none;
  min-width: 0;
  color: var(--ea-fg);
  border-block: 1px solid var(--ea-border-soft);
  font-size: 12px;
}
summary {
  padding: 9px 8px;
  cursor: pointer;
}
summary span {
  color: var(--ea-text-secondary);
  margin-left: 12px;
  font-size: 11px;
}
.reference-content {
  display: grid;
  gap: 6px;
  max-height: min(28vh, 220px);
  overflow: auto;
  padding: 0 8px 10px;
}
p {
  margin: 0 0 4px;
  color: var(--ea-text-secondary);
  font-size: 11px;
  line-height: 1.6;
}
button {
  display: grid;
  gap: 4px;
  min-width: 0;
  width: 100%;
  padding: 8px;
  text-align: left;
  color: inherit;
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border-soft);
  cursor: pointer;
}
strong,
code {
  overflow-wrap: anywhere;
  min-width: 0;
}
code {
  color: var(--ea-text-secondary);
  font-size: 11px;
}
</style>
