<script setup lang="ts">
import type {
  SkillDefinition,
  SkillInputCommandMappingWindow,
  SkillAllowedNextWindow,
} from '../../../../core/game-data/operatorDefinition';
const props = defineProps<{ path: string; value: unknown }>();
const emit = defineEmits<{ update: [value: unknown] }>();
function number(field: 'startFrame' | 'endFrame', event: Event) {
  const raw = (event.target as HTMLInputElement).value;
  if (!raw.trim() || !Number.isFinite(Number(raw))) return;
  emit('update', { ...(props.value as object), [field]: Number(raw) });
}
</script>
<template>
  <section class="window-inspector">
    <template v-if="path === 'inputWindows' && value">
      <h4>输入窗口</h4>
      <label
        ><input
          type="checkbox"
          :checked="
            (value as NonNullable<SkillDefinition['inputWindows']>).hasConditionalActions ?? false
          "
          @change="
            emit('update', {
              ...(value as object),
              hasConditionalActions: ($event.target as HTMLInputElement).checked,
            })
          "
        />存在条件或嵌套输入动作</label
      >
      <p>
        此标记表示仅凭直连窗口不能完整判断输入。映射窗口负责选择技能，接续窗口只决定提前中断许可。
      </p>
    </template>
    <template v-else-if="/\[\d+\]$/.test(path)">
      <h4>{{ path.includes('commandMappings') ? '操作映射窗口' : '允许接续窗口' }}</h4>
      <label v-for="field in ['startFrame', 'endFrame'] as const" :key="field"
        >{{ field === 'startFrame' ? '起始局部帧' : '结束局部帧'
        }}<input
          type="number"
          :value="(value as SkillAllowedNextWindow)[field]"
          @change="number(field, $event)"
      /></label>
      <template v-if="path.includes('commandMappings')">
        <p>当前契约只记录普攻操作的直接技能映射，不扩展到其他操作。</p>
        <label
          ><input
            type="checkbox"
            :checked="(value as SkillInputCommandMappingWindow).targetSkillId !== null"
            @change="
              emit('update', {
                ...(value as object),
                targetSkillId: ($event.target as HTMLInputElement).checked ? '' : null,
              })
            "
          />窗口内有直接技能路由</label
        >
        <label v-if="(value as SkillInputCommandMappingWindow).targetSkillId !== null"
          >目标原生技能 ID<input
            :value="(value as SkillInputCommandMappingWindow).targetSkillId ?? ''"
            @change="
              emit('update', {
                ...(value as object),
                targetSkillId: ($event.target as HTMLInputElement).value,
              })
            "
        /></label>
        <p v-else>无直接路由；不是回退到基础技能。</p>
      </template>
      <label v-else
        >允许接续的原生技能 ID（每行一个）<textarea
          :value="(value as SkillAllowedNextWindow).skillIds.join('\n')"
          @change="
            emit('update', {
              ...(value as object),
              skillIds: ($event.target as HTMLTextAreaElement).value
                .split('\n')
                .filter(x => x.trim()),
            })
          "
        />
      </label>
    </template>
    <p v-else>使用节点上的添加按钮创建窗口；现有窗口在子节点逐项编辑。</p>
  </section>
</template>
<style scoped>
.window-inspector {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 12px;
}
h4,
p {
  margin: 0;
}
p {
  font-size: 12px;
  line-height: 1.6;
  color: var(--ea-text-secondary);
}
label {
  display: grid;
  gap: 6px;
  font-size: 12px;
}
label:has(input[type='checkbox']) {
  display: flex;
  align-items: center;
  gap: 8px;
}
input:not([type='checkbox']),
textarea {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
  padding: 7px;
}
textarea {
  min-height: 80px;
  resize: vertical;
}
</style>
