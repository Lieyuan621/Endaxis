<script setup lang="ts">
import { SKILL_TYPES, type SkillDefinition } from '../../../../core/game-data/operatorDefinition';
type Value = NonNullable<SkillDefinition['switchToBuffCast']>;
const props = defineProps<{ value?: Value }>();
const emit = defineEmits<{ update: [value: Value] }>();
const flags = {
  requiresCurrentSkillNotInterruptible: '要求当前技能不可中断',
  asSkillCast: '发布完整施法事件',
} as const;
const labels = {
  basicAttack: '普攻',
  battleSkill: '战技',
  comboSkill: '连携',
  ultimate: '终结技',
  finisher: '处决',
  plungingAttack: '下落攻击',
  dodge: '极限闪避',
};
function flag(field: keyof typeof flags, event: Event) {
  if (!props.value) return;
  const raw = (event.target as HTMLSelectElement).value;
  emit('update', { ...props.value, [field]: raw === '' ? undefined : raw === 'true' });
}
</script>
<template>
  <section class="switch-inspector">
    <h4>施放旁路</h4>
    <p>旁路条件成立时执行响应序列，不启动或中断普通技能时间轴。这里不是普通释放条件。</p>
    <template v-if="value">
      <label v-for="(label, key) in flags" :key="key"
        >{{ label
        }}<select
          :value="value[key] === undefined ? '' : String(value[key])"
          @change="flag(key, $event)"
        >
          <option value="">未指定</option>
          <option value="true">是</option>
          <option value="false">否</option>
        </select></label
      >
      <label class="toggle"
        ><input
          type="checkbox"
          :checked="value.currentSkillTypes !== undefined"
          @change="
            emit('update', {
              ...value,
              currentSkillTypes: ($event.target as HTMLInputElement).checked ? [] : undefined,
            })
          "
        />限制当前技能类型</label
      >
      <div v-if="value.currentSkillTypes !== undefined" class="types">
        <label v-for="kind in SKILL_TYPES" :key="kind" class="toggle"
          ><input
            type="checkbox"
            :checked="value.currentSkillTypes.includes(kind)"
            @change="
              emit('update', {
                ...value,
                currentSkillTypes: ($event.target as HTMLInputElement).checked
                  ? [...value.currentSkillTypes!, kind]
                  : value.currentSkillTypes!.filter(x => x !== kind),
              })
            "
          />{{ labels[kind] }}</label
        >
      </div>
      <p>当前技能类型限制与子节点中的条件同时存在时，必须同时成立。序列和嵌套判断在图上编辑。</p>
    </template>
    <p v-else>使用节点上的添加按钮创建旁路。</p>
  </section>
</template>
<style scoped>
.switch-inspector {
  display: grid;
  gap: 14px;
  padding: 12px;
  min-width: 0;
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
.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}
.types {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
select {
  min-width: 0;
  width: 100%;
  background: var(--ea-fill-input);
  color: var(--ea-fg);
  padding: 7px;
  border: 1px solid var(--ea-border);
}
</style>
