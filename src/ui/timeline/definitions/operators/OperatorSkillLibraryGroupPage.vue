<script setup lang="ts">
import { computed, ref } from 'vue';
import { EaButton } from '../../../../design-system/index';
import OperatorLibraryMemberActions from './OperatorLibraryMemberActions.vue';
import SearchableOptionPicker from '../../components/SearchableOptionPicker.vue';
import {
  updateRoutedSkillOrigin,
  appendEmptyOperatorVariant,
  type OperatorSkillCreationDestination,
} from './operatorLibraryCreation';
import SkillGroupPlacementSettings from '../skills/SkillGroupPlacementSettings.vue';
import type { SkillGroupDefinition } from '../../../../core/game-data/operatorDefinition';
import {
  listSkillGroupDefinitionBindings,
  type OperatorSkillDefinitionBinding,
} from '../../../../core/game-data/operatorSkillDefinitions';
const props = defineProps<{ group: SkillGroupDefinition; first: boolean; last: boolean }>();
const emit = defineEmits<{
  update: [group: SkillGroupDefinition];
  edit: [binding: OperatorSkillDefinitionBinding];
  move: [offset: -1 | 1];
  remove: [];
  'add-skill': [destination: OperatorSkillCreationDestination];
}>();
const bindings = computed(() => listSkillGroupDefinitionBindings(props.group));
const createAnchor = ref<{ x: number; y: number }>();
const creationOptions = [
  { value: 'base', label: '基础放置技能', detail: '加入此组的基础放置项' },
  {
    value: 'replacement',
    label: '替换技能',
    detail: '新增独立技能定义；不会自动创建运行时换槽规则',
  },
  {
    value: 'routedReplacement',
    label: '跨组执行体',
    detail: '创建独立执行技能；需另行填写原生执行来源标识',
  },
];
function beginCreate(event: MouseEvent) {
  createAnchor.value = { x: event.clientX, y: event.clientY };
}
function create(value: string) {
  if (value !== 'base' && value !== 'replacement' && value !== 'routedReplacement') return;
  createAnchor.value = undefined;
  emit('add-skill', value);
}
const origins = {
  base: '基础放置项',
  variant: '具名形态',
  replacement: '替换形态',
  routedReplacement: '跨组执行体',
};
const levels = { basicAttack: '普攻', battleSkill: '战技', comboSkill: '连携', ultimate: '终结技' };
function updateVariant(index: number, field: 'key' | 'libraryPresentation', value: string) {
  emit('update', {
    ...props.group,
    variants: props.group.variants?.map((variant, i) =>
      i === index
        ? {
            ...variant,
            [field]:
              field === 'libraryPresentation' ? (value === 'enhanced' ? value : undefined) : value,
          }
        : variant,
    ),
  });
}
</script>
<template>
  <section class="library-group-page">
    <header>
      <div>
        <h3>技能库组织</h3>
        <p>管理定义归属与放置组织。分组不决定技能等级或操作选择；跨组执行来源另行标注。</p>
      </div>
      <nav>
        <EaButton size="sm" :disabled="first" @click="emit('move', -1)">上移组</EaButton
        ><EaButton size="sm" :disabled="last" @click="emit('move', 1)">下移组</EaButton
        ><EaButton variant="danger" size="sm" @click="emit('remove')">删除组</EaButton>
      </nav>
    </header>
    <div class="settings">
      <label
        >分组标识<input
          :value="group.key"
          @change="emit('update', { ...group, key: ($event.target as HTMLInputElement).value })"
      /></label>
      <label
        >基础放置项强调<select
          :value="group.libraryPresentation ?? ''"
          @change="
            emit('update', {
              ...group,
              libraryPresentation:
                ($event.target as HTMLSelectElement).value === 'enhanced' ? 'enhanced' : undefined,
            })
          "
        >
          <option value="">普通</option>
          <option value="enhanced">强化</option>
        </select></label
      >
    </div>
    <h4>
      包含的技能
      <small>实际放置条目见下方预览；此处按定义归属列出</small>
      <EaButton size="sm" @click="beginCreate">＋ 新建技能</EaButton>
    </h4>
    <div
      v-for="(binding, index) in bindings.filter(item => item.origin !== 'variant')"
      :key="index"
      class="member"
    >
      <div class="identity">
        <small
          >{{ origins[binding.origin]
          }}{{ binding.variant ? ' · ' + binding.variant.key : '' }}</small
        ><strong>{{ binding.skill.key }}</strong
        ><small
          >等级取自
          {{ binding.skill.levelSource ? levels[binding.skill.levelSource] : '未指定' }}</small
        >
      </div>
      <OperatorLibraryMemberActions
        :binding="binding"
        @update="emit('update', $event)"
        @edit="emit('edit', $event)"
      />
      <div v-if="binding.routedReplacement" class="execution-origin">
        <p>跨组执行来源 · 这两个标识会参与执行与修正匹配，不是展示分组，也不会自动替换技能。</p>
        <label
          >原生执行组标识<input
            :value="binding.routedReplacement.executionSkillGroupKey"
            @change="
              emit(
                'update',
                updateRoutedSkillOrigin(
                  group,
                  binding,
                  'executionSkillGroupKey',
                  ($event.target as HTMLInputElement).value,
                ),
              )
            "
        /></label>
        <label
          >原生执行技能标识<input
            :value="binding.routedReplacement.executionSkillKey"
            @change="
              emit(
                'update',
                updateRoutedSkillOrigin(
                  group,
                  binding,
                  'executionSkillKey',
                  ($event.target as HTMLInputElement).value,
                ),
              )
            "
        /></label>
      </div>
    </div>
    <p v-if="!bindings.length">此组没有技能。空组保留在草稿中，由定义检查报告问题。</p>
    <h4>
      具名形态
      <EaButton size="sm" @click="emit('update', appendEmptyOperatorVariant(group))">
        ＋ 新建形态
      </EaButton>
    </h4>
    <section
      v-for="(variant, variantIndex) in group.variants"
      :key="variantIndex"
      class="variant-container"
    >
      <div class="settings">
        <label
          >形态标识<input
            :value="variant.key"
            @change="updateVariant(variantIndex, 'key', ($event.target as HTMLInputElement).value)"
        /></label>
        <label
          >展示强调<select
            :value="variant.libraryPresentation ?? ''"
            @change="
              updateVariant(
                variantIndex,
                'libraryPresentation',
                ($event.target as HTMLSelectElement).value,
              )
            "
          >
            <option value="">普通</option>
            <option value="enhanced">强化</option>
          </select></label
        >
      </div>
      <div class="actions variant-actions">
        <EaButton size="sm" @click="emit('add-skill', { variant: variantIndex })">
          ＋ 新建形态内技能
        </EaButton>
        <EaButton
          variant="danger"
          size="sm"
          @click="
            emit('update', {
              ...group,
              variants: group.variants?.filter((_, i) => i !== variantIndex),
            })
          "
        >
          删除形态及其技能
        </EaButton>
      </div>
      <div
        v-for="binding in bindings.filter(item => item.variant === variant)"
        :key="binding.skill.key"
        class="member"
      >
        <div class="identity">
          <strong>{{ binding.skill.key }}</strong
          ><small
            >等级取自
            {{ binding.skill.levelSource ? levels[binding.skill.levelSource] : '未指定' }}</small
          >
        </div>
        <OperatorLibraryMemberActions
          :binding="binding"
          @update="emit('update', $event)"
          @edit="emit('edit', $event)"
        />
      </div>
      <p v-if="!bindings.some(item => item.variant === variant)">
        空形态；添加技能后再定义它的等级来源与行为。
      </p>
    </section>
    <SkillGroupPlacementSettings :group="group" @update="emit('update', $event)" />
    <SearchableOptionPicker
      v-if="createAnchor"
      :anchor="createAnchor"
      title="技能定义位置"
      :options="creationOptions"
      @select="create"
      @close="createAnchor = undefined"
    />
  </section>
</template>
<style scoped>
.library-group-page {
  min-width: 0;
}
header {
  display: flex;
  flex-wrap: wrap;
  align-items: start;
  gap: 12px;
  justify-content: space-between;
}
h3,
h4 {
  margin: 0;
}
h4 {
  margin-top: 26px;
  margin-bottom: 8px;
}
p,
small {
  color: var(--ea-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}
h4 small {
  margin-left: 10px;
  font-weight: normal;
}
nav,
.actions {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}
.settings {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 1fr);
  gap: 14px;
  margin-top: 18px;
}
label,
.identity {
  display: grid;
  gap: 5px;
  min-width: 0;
  font-size: 12px;
}
.identity {
  grid-template-columns: minmax(100px, 1fr) auto;
  align-items: center;
}
.identity > small:first-child {
  grid-column: 1 / -1;
}
.identity strong {
  overflow-wrap: anywhere;
}
input,
select {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  padding: 7px;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
}
.member {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--ea-border-soft);
}
.variant-container {
  border-top: 1px solid var(--ea-border);
  padding: 8px 0;
}
.variant-actions {
  margin: 12px 0;
}
.execution-origin {
  flex-basis: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
  padding: 10px 0;
}
.execution-origin p {
  grid-column: 1 / -1;
  margin: 0;
}
@media (max-width: 700px) {
  .execution-origin {
    grid-template-columns: 1fr;
  }
}
</style>
