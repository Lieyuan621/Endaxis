<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { CombatBuffPresentation } from '../../../../../packages/game-data-contract/src/buffs';

type BooleanPresentationField = {
  [Key in keyof CombatBuffPresentation]-?: CombatBuffPresentation[Key] extends boolean | undefined
    ? Key
    : never;
}[keyof CombatBuffPresentation];

const BOOLEAN_FIELDS = [
  'visible',
  'showInHeadBarCommon',
  'showInHeadBarAttached',
  'showInSquadIcon',
  'onlyShowForMainCharacter',
  'blinkInMainCharHpBar',
  'showProgressInHpBar',
  'showProgressInNormalSkillButton',
  'useWeakProgressInNormalSkillButton',
  'showProgressInUltimateSkillButton',
  'forceRaiseIconEvent',
  'showWarningBackground',
  'playStrongInAnimation',
  'hasCharHpBarVfxType',
] as const satisfies readonly BooleanPresentationField[];

const BOOLEAN_LABELS: Readonly<Record<BooleanPresentationField, string>> = {
  visible: '显示图标',
  showInHeadBarCommon: '头顶栏通用区',
  showInHeadBarAttached: '头顶栏附加区',
  showInSquadIcon: '队伍头像区',
  onlyShowForMainCharacter: '仅主控显示',
  blinkInMainCharHpBar: '主控生命栏闪烁',
  showProgressInHpBar: '生命栏显示进度',
  showProgressInNormalSkillButton: '战技按钮显示进度',
  useWeakProgressInNormalSkillButton: '战技按钮弱进度样式',
  showProgressInUltimateSkillButton: '终结技按钮显示进度',
  forceRaiseIconEvent: '强制抬升图标事件',
  showWarningBackground: '警告背景',
  playStrongInAnimation: '强进入动画',
  hasCharHpBarVfxType: '启用生命栏 VFX 类型',
};

const props = withDefaults(
  defineProps<{
    presentation?: CombatBuffPresentation;
    title?: string;
    initiallyCollapsed?: boolean;
    /** 子表现中的 presentation 是必填对象，不能单独移除。 */
    required?: boolean;
  }>(),
  { title: 'Buff 展示身份', initiallyCollapsed: true },
);
const emit = defineEmits<{ update: [presentation: CombatBuffPresentation | undefined] }>();
const failedIconPath = ref('');
const previewIconPath = computed(() => {
  const path = props.presentation?.iconPath;
  return path !== undefined && path !== failedIconPath.value ? path : '';
});

watch(
  () => props.presentation?.iconPath,
  () => (failedIconPath.value = ''),
);

function commit(presentation: CombatBuffPresentation): void {
  // 清空字段不等于移除对象；移除只能通过显式开关执行。
  emit('update', presentation);
}

function setText(
  field: 'iconId' | 'iconPath' | 'charHpBarVfxType' | 'iconStyleInSquad' | 'abnormalColorType',
  event: Event,
): void {
  const value = (event.target as HTMLInputElement).value.trim();
  const next = { ...props.presentation };
  if (value === '') delete next[field];
  else next[field] = value;
  commit(next);
}

function setBoolean(field: BooleanPresentationField, event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  const next = { ...props.presentation };
  if (value === '') delete next[field];
  else next[field] = value === 'true';
  commit(next);
}

function toggleOrderPriority(event: Event): void {
  const next = { ...props.presentation };
  if ((event.target as HTMLInputElement).checked) {
    next.orderPriority = { useDirectoryValue: false, value: 0, category: '' };
  } else delete next.orderPriority;
  commit(next);
}

function setOrderPriority(field: 'useDirectoryValue' | 'value' | 'category', event: Event): void {
  const current = props.presentation?.orderPriority;
  if (current === undefined) return;
  const raw = (event.target as HTMLInputElement).value;
  const value =
    field === 'useDirectoryValue'
      ? (event.target as HTMLInputElement).checked
      : field === 'value'
        ? Number(raw)
        : raw;
  if (field === 'value' && !Number.isFinite(value)) return;
  commit({ ...props.presentation, orderPriority: { ...current, [field]: value } });
}
</script>

<template>
  <details class="presentation-editor" :open="!initiallyCollapsed">
    <summary>
      {{ title }}
      <span>{{ Object.keys(presentation ?? {}).length }}</span>
    </summary>
    <div class="presentation-content">
      <label v-if="!required">
        <input
          type="checkbox"
          :checked="presentation !== undefined"
          @change="emit('update', ($event.target as HTMLInputElement).checked ? {} : undefined)"
        />启用表现定义
      </label>
      <template v-if="presentation !== undefined || required">
        <div class="presentation-identity">
          <span class="presentation-icon" :class="{ 'is-hidden': presentation?.visible === false }">
            <img
              v-if="previewIconPath"
              :src="previewIconPath"
              :alt="presentation?.iconId ?? title"
              @error="failedIconPath = previewIconPath"
            />
            <span v-else>BUFF</span>
          </span>
          <div>
            <label
              ><span>图标 ID</span
              ><input
                type="text"
                :value="presentation?.iconId ?? ''"
                @input="setText('iconId', $event)"
            /></label>
            <label
              ><span>图标路径</span
              ><input
                type="text"
                :value="presentation?.iconPath ?? ''"
                @input="setText('iconPath', $event)"
            /></label>
          </div>
        </div>
        <div class="boolean-rules">
          <label v-for="field in BOOLEAN_FIELDS" :key="field">
            <span>{{ BOOLEAN_LABELS[field] }}</span>
            <select
              :value="presentation?.[field] === undefined ? '' : String(presentation[field])"
              @change="setBoolean(field, $event)"
            >
              <option value="">未设置</option>
              <option value="true">是</option>
              <option value="false">否</option>
            </select>
          </label>
        </div>
        <div class="text-rules">
          <label
            ><span>生命栏 VFX 类型</span
            ><input
              type="text"
              :value="presentation?.charHpBarVfxType ?? ''"
              @input="setText('charHpBarVfxType', $event)"
          /></label>
          <label
            ><span>队伍图标样式</span
            ><input
              type="text"
              :value="presentation?.iconStyleInSquad ?? ''"
              @input="setText('iconStyleInSquad', $event)"
          /></label>
          <label
            ><span>异常颜色类型</span
            ><input
              type="text"
              :value="presentation?.abnormalColorType ?? ''"
              @input="setText('abnormalColorType', $event)"
          /></label>
        </div>
        <fieldset class="order-priority">
          <legend>
            <label
              ><input
                type="checkbox"
                :checked="presentation?.orderPriority !== undefined"
                @change="toggleOrderPriority"
              />排序优先级</label
            >
          </legend>
          <template v-if="presentation?.orderPriority">
            <label
              ><span>使用目录值</span
              ><input
                type="checkbox"
                :checked="presentation.orderPriority.useDirectoryValue"
                @change="setOrderPriority('useDirectoryValue', $event)"
            /></label>
            <label
              ><span>数值</span
              ><input
                type="number"
                step="1"
                :value="presentation.orderPriority.value"
                @input="setOrderPriority('value', $event)"
            /></label>
            <label
              ><span>分类</span
              ><input
                type="text"
                :value="presentation.orderPriority.category"
                @input="setOrderPriority('category', $event)"
            /></label>
          </template>
        </fieldset>
      </template>
    </div>
  </details>
</template>

<style scoped>
.presentation-editor {
  margin-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 10px;
}
.presentation-editor > summary {
  cursor: pointer;
  width: 100%;
  text-align: left;
}
.presentation-editor button,
.presentation-editor input,
.presentation-editor select {
  min-width: 0;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
}
.presentation-content {
  display: grid;
  gap: 10px;
  margin-top: 8px;
}
.presentation-identity {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 10px;
}
.presentation-identity > div,
.boolean-rules,
.text-rules {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 7px 12px;
}
.presentation-identity label,
.boolean-rules label,
.text-rules label,
.order-priority > label {
  display: grid;
  grid-template-columns: minmax(115px, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}
.presentation-icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--ea-border);
  color: var(--ea-fg-muted);
  font-size: 9px;
}
.presentation-identity label {
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
}
.presentation-icon.is-hidden {
  opacity: 0.42;
}
.presentation-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.order-priority {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  border: 1px solid var(--ea-border-soft);
}
.order-priority legend label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.order-priority input[type='checkbox'] {
  width: 15px;
  height: 15px;
}
</style>
