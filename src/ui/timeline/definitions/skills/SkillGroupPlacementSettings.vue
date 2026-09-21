<script setup lang="ts">
import { computed, ref } from 'vue';
import { EaButton } from '../../../../design-system/index';
import SearchableOptionPicker from '../../components/SearchableOptionPicker.vue';
import type { SkillGroupDefinition } from '../../../../core/game-data/operatorDefinition';
import {
  asSkillDefinitions,
  listSkillGroupDefinitionBindings,
} from '../../../../core/game-data/operatorSkillDefinitions';
import { listSkillGroupLibraryPlacements } from '../../../../application/editor/skillGroupPlacement';
const props = defineProps<{ group: SkillGroupDefinition }>();
const emit = defineEmits<{ update: [group: SkillGroupDefinition] }>();
const candidates = computed(() =>
  listSkillGroupDefinitionBindings(props.group).filter(x => x.origin !== 'variant'),
);
const picker = ref<{ anchor: { x: number; y: number }; index?: number }>();
const options = computed(() => [
  ...Array.from(new Set(candidates.value.map(item => item.skill.key))).map(key => ({
    value: `skill:${key}`,
    label: key,
    detail:
      props.group.replacementSkillPlacements?.[key] === 'internal'
        ? '内部技能：可以编辑引用，但当前不能直接放置'
        : '引用现有技能定义，不复制技能',
  })),
  { value: 'empty', label: '空引用（手动填写）', detail: '保留空项，由定义检查报告问题' },
]);
const replacementKeys = computed(() =>
  Array.from(
    new Set([
      ...candidates.value.filter(item => item.origin !== 'base').map(item => item.skill.key),
      ...Object.keys(props.group.replacementSkillPlacements ?? {}),
      ...Object.keys(props.group.replacementSkillNameQualifiers ?? {}),
    ]),
  ),
);
function pick(event: MouseEvent, index?: number) {
  picker.value = { anchor: { x: event.clientX, y: event.clientY }, index };
}
function choose(value: string) {
  if (!picker.value || !options.value.some(option => option.value === value)) return;
  const key = value === 'empty' ? '' : value.slice('skill:'.length);
  const values = [...(props.group.placementSequenceSkillKeys ?? [])];
  const index = picker.value.index;
  if (index === undefined) values.push(key);
  else if (index < values.length) values[index] = key;
  else {
    picker.value = undefined;
    return;
  }
  picker.value = undefined;
  sequence(values);
}
const preview = computed(() => {
  try {
    return { entries: listSkillGroupLibraryPlacements(props.group), error: '' };
  } catch (error) {
    return { entries: [], error: error instanceof Error ? error.message : String(error) };
  }
});
function sequence(values: readonly string[] | undefined) {
  emit('update', { ...props.group, placementSequenceSkillKeys: values });
}
function move(index: number, offset: number) {
  const values = [...(props.group.placementSequenceSkillKeys ?? [])];
  const target = index + offset;
  if (target < 0 || target >= values.length) return;
  [values[index], values[target]] = [values[target]!, values[index]!];
  sequence(values);
}
function replacement(key: string, event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  const placements = { ...props.group.replacementSkillPlacements };
  if (!value) delete placements[key];
  else placements[key] = value as 'standard' | 'internal';
  emit('update', {
    ...props.group,
    replacementSkillPlacements: Object.keys(placements).length ? placements : undefined,
  });
}
function replacementNameQualifier(key: string, event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  const qualifiers = { ...props.group.replacementSkillNameQualifiers };
  if (value !== 'enhanced' && value !== 'floating') delete qualifiers[key];
  else qualifiers[key] = value;
  emit('update', {
    ...props.group,
    replacementSkillNameQualifiers: Object.keys(qualifiers).length ? qualifiers : undefined,
  });
}
</script>
<template>
  <section class="placement-settings">
    <header>
      <h4>基础放置顺序</h4>
      <EaButton
        size="sm"
        @click="
          sequence(
            group.placementSequenceSkillKeys === undefined
              ? asSkillDefinitions(group.skills).map(x => x.key)
              : undefined,
          )
        "
      >
        {{ group.placementSequenceSkillKeys === undefined ? '自定义顺序' : '恢复基础成员顺序' }}
      </EaButton>
    </header>
    <p v-if="group.placementSequenceSkillKeys === undefined">
      沿用基础成员顺序。需要把替换技能接入同一连段时，可显式指定顺序。
    </p>
    <template v-else>
      <div
        v-for="(key, index) in group.placementSequenceSkillKeys"
        :key="index"
        class="sequence-row"
      >
        <span>{{ index + 1 }}</span
        ><input
          aria-label="连段技能引用"
          :value="key"
          @change="
            sequence(
              group.placementSequenceSkillKeys!.map((value, i) =>
                i === index ? ($event.target as HTMLInputElement).value : value,
              ),
            )
          "
        />
        <EaButton size="sm" title="选择技能引用" @click="pick($event, index)"> 选择 </EaButton>
        <EaButton size="sm" icon-only :disabled="index === 0" @click="move(index, -1)">↑</EaButton
        ><EaButton
          size="sm"
          icon-only
          :disabled="index === group.placementSequenceSkillKeys.length - 1"
          @click="move(index, 1)"
        >
          ↓</EaButton
        ><EaButton
          variant="danger"
          size="sm"
          icon-only
          title="从放置顺序移除，不删除技能定义"
          @click="sequence(group.placementSequenceSkillKeys!.filter((_, i) => i !== index))"
        >
          ×
        </EaButton>
      </div>
      <EaButton size="sm" @click="pick($event)">＋ 添加技能引用</EaButton>
    </template>
    <template v-if="replacementKeys.length">
      <h4>替换技能放置方式</h4>
      <div v-for="key in replacementKeys" :key="key" class="replacement-row">
        <span
          >{{ key
          }}<small v-if="!candidates.some(item => item.origin !== 'base' && item.skill.key === key)"
            >未找到对应替换技能；可选“未指定”移除此配置</small
          ></span
        ><select
          :value="group.replacementSkillPlacements?.[key] ?? ''"
          @change="replacement(key, $event)"
        >
          <option value="">未指定（普通展示）</option>
          <option value="standard">普通</option>
          <option value="internal">内部技能（不可直接放置）</option></select
        ><select
          aria-label="技能名称修饰"
          :value="group.replacementSkillNameQualifiers?.[key] ?? ''"
          @change="replacementNameQualifier(key, $event)"
        >
          <option value="">名称无修饰</option>
          <option value="enhanced">强化</option>
          <option value="floating">浮空</option>
        </select>
      </div>
      <p>
        已纳入基础连段的技能不重复生成独立卡片。内部技能不接受直接放置。名称修饰只改变显示文本，不参与技能身份和换槽。
      </p>
    </template>
    <h4>技能库条目预览</h4>
    <p v-if="preview.error" role="status">
      当前配置无法生成技能库条目：{{ preview.error }}。草稿仍可继续编辑。
    </p>
    <div v-for="entry in preview.entries" :key="entry.entryKey" class="preview-row">
      <span>{{ entry.nameQualifier ?? '普通' }}</span
      ><span>{{ entry.skills.map(x => x.key).join(' → ') || '空条目' }}</span>
    </div>
    <SearchableOptionPicker
      v-if="picker"
      :anchor="picker.anchor"
      title="连段技能引用"
      :options="options"
      @select="choose"
      @close="picker = undefined"
    />
  </section>
</template>
<style scoped>
.placement-settings {
  display: grid;
  gap: 10px;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid var(--ea-border-soft);
}
header {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
}
h4,
p {
  margin: 0;
}
h4:not(header h4) {
  margin-top: 10px;
}
p {
  font-size: 12px;
  line-height: 1.6;
  color: var(--ea-text-secondary);
  overflow-wrap: anywhere;
}
label {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 1fr);
  gap: 12px;
  align-items: center;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.replacement-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 0.7fr) minmax(120px, 0.7fr);
  gap: 12px;
  align-items: center;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.sequence-row {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto 28px 28px 28px;
  gap: 6px;
  align-items: center;
}
label small {
  display: block;
  color: var(--ea-text-secondary);
  line-height: 1.5;
}
input,
select {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 7px;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
}
.preview-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 8px;
  font-size: 12px;
  overflow-wrap: anywhere;
}
</style>
