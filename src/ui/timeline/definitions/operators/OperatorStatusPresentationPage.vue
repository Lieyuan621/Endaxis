<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  createPassiveUiDefinition,
  numericPassiveUiAppearances as numericAppearances,
} from '../../../operators/passive-ui/registry';
import { useInspectorPropertyReveal } from '../inspector/useInspectorPropertyReveal';
import type { DefinitionHistoryLocation } from '../useDefinitionDraftHistory';
import BuffIdReferenceField from '../buffs/BuffIdReferenceField.vue';
import type { OperatorPassiveUiDefinition } from '../../../../core/game-data/operatorDefinition';
const props = withDefaults(
  defineProps<{
    value?: OperatorPassiveUiDefinition;
    localBuffIds?: readonly string[];
    commonBuffIds?: readonly string[];
    restoredLocation?: DefinitionHistoryLocation;
    navigationRequest?: { readonly propertyPath: readonly (string | number)[] };
  }>(),
  { localBuffIds: () => [], commonBuffIds: () => [] },
);
const emit = defineEmits<{
  update: [value: OperatorPassiveUiDefinition | undefined, field?: string];
  revealBuff: [id: string];
}>();
const root = ref<HTMLElement | null>(null);
const revealProperty = useInspectorPropertyReveal(root);
watch(
  () => [props.navigationRequest, props.restoredLocation] as const,
  ([request, location]) => {
    if (request) void revealProperty(request.propertyPath);
    else if (location?.page === 'presentation') void revealProperty(location.propertyPath);
  },
  { immediate: true },
);
function setBuff(
  field:
    'normalBuffId' | 'ultimateBuffId' | 'reserveArrowBuffId' | 'battleArrowBuffId' | 'pointBuffId',
  value: string,
) {
  if (props.value && field in props.value)
    emit('update', { ...props.value, [field]: value }, field);
}
const adding = ref(false);
function create(kind: OperatorPassiveUiDefinition['kind']) {
  const value = createPassiveUiDefinition(kind);
  emit('update', value);
  adding.value = false;
}
function patch(field: string, event: Event, numeric = false) {
  if (!props.value) return;
  const raw = (event.target as HTMLInputElement).value;
  const value = numeric ? Number(raw) : raw;
  if (numeric && (raw.trim() === '' || !Number.isFinite(value))) return;
  emit('update', { ...props.value, [field]: value }, field);
}
</script>
<template>
  <section ref="root" class="status-page">
    <header>
      <div>
        <h3>状态表现</h3>
        <p>配置角色专属状态指示器。这里只描述显示方式与读取来源，不创建战斗状态。</p>
      </div>
      <button v-if="value" @click="emit('update', undefined)">移除配置</button>
    </header>
    <div v-if="!value" class="empty">
      <p>此干员尚未配置专属状态指示器；普通 Buff 显示不受影响。</p>
      <button :aria-expanded="adding" @click="adding = !adding">＋ 添加状态指示器</button>
      <div v-if="adding" class="choices">
        <button @click="create('numeric')">数值计数</button
        ><button @click="create('buffProgress')">黎诺演唱姿态</button
        ><button @click="create('buffCounters')">提弗洛斯猎物清点</button>
        <button @click="create('abilityEntityCount')">能力实体数量</button>
      </div>
    </div>
    <template v-else>
      <div class="summary">
        <strong>{{
          value.kind === 'numeric'
            ? '数值计数'
            : value.kind === 'buffProgress'
              ? '黎诺演唱姿态'
              : value.kind === 'buffCounters'
                ? '提弗洛斯猎物清点'
                : '能力实体数量'
        }}</strong
        ><span>{{
          value.kind === 'abilityEntityCount' ? '使用配置的图标与名称' : '使用已有原生 HUD 外观'
        }}</span>
      </div>
      <p class="source-note" v-if="value.kind === 'numeric'">
        读取来源：角色行为发布的专属界面数值（CharacterPassiveUiValueChanged）。选择外观不会自动创建或绑定
        Buff。
      </p>
      <p class="source-note" v-else-if="value.kind === 'buffProgress'">
        读取来源：下方指定 Buff 的进度；普通状态与终结技状态使用各自的 Buff。
      </p>
      <p class="source-note" v-else-if="value.kind === 'buffCounters'">
        读取来源：下方三种 Buff 的层数。箭矢两组共用显示上限，点数使用独立上限。
      </p>
      <p class="source-note" v-else>
        显示归属当前干员的指定能力实体在场数量；点击后可查询具体实例及来源。
      </p>
      <div class="fields" v-if="value.kind === 'numeric'">
        <h4>外观与范围</h4>
        <label :data-property-path="JSON.stringify(['appearance'])"
          >指示器外观<select :value="value.appearance" @change="patch('appearance', $event)">
            <option v-for="(name, key) in numericAppearances" :key="key" :value="key">
              {{ name }}
            </option>
          </select></label
        >
        <label :data-property-path="JSON.stringify(['maximum'])"
          >显示上限<input
            type="number"
            :value="value.maximum"
            @change="patch('maximum', $event, true)"
        /></label>
        <h4>高亮状态</h4>
        <label :data-property-path="JSON.stringify(['activeAt'])"
          ><span
            ><input
              type="checkbox"
              :checked="value.activeAt !== undefined"
              @change="
                emit(
                  'update',
                  {
                    ...value,
                    activeAt: ($event.target as HTMLInputElement).checked
                      ? value.maximum
                      : undefined,
                  },
                  'activeAt',
                )
              "
            />
            启用阈值高亮</span
          ><input
            v-if="value.activeAt !== undefined"
            aria-label="高亮阈值"
            type="number"
            :value="value.activeAt"
            @change="patch('activeAt', $event, true)"
        /></label>
      </div>
      <div class="fields" v-else-if="value.kind === 'buffProgress'">
        <h4>状态来源 <small>外观：音律进度</small></h4>
        <BuffIdReferenceField
          v-for="field in ['normalBuffId', 'ultimateBuffId'] as const"
          :key="field"
          :data-property-path="JSON.stringify([field])"
          :label="field === 'normalBuffId' ? '普通状态 Buff' : '终结技状态 Buff'"
          :value="value[field]"
          :local-ids="localBuffIds"
          :common-ids="commonBuffIds"
          @update="setBuff(field, $event)"
          @reveal="emit('revealBuff', $event)"
        />
      </div>
      <div class="fields" v-else-if="value.kind === 'buffCounters'">
        <h4>箭矢 <small>外观：箭矢与点数</small></h4>
        <BuffIdReferenceField
          v-for="field in ['reserveArrowBuffId', 'battleArrowBuffId'] as const"
          :key="field"
          :data-property-path="JSON.stringify([field])"
          :label="field === 'reserveArrowBuffId' ? '储备箭矢 Buff' : '战技箭矢 Buff'"
          :value="value[field]"
          :local-ids="localBuffIds"
          :common-ids="commonBuffIds"
          @update="setBuff(field, $event)"
          @reveal="emit('revealBuff', $event)"
        />
        <label :data-property-path="JSON.stringify(['maximumArrows'])"
          >箭矢显示上限<input
            type="number"
            :value="value.maximumArrows"
            @change="patch('maximumArrows', $event, true)"
        /></label>
        <h4>点数</h4>
        <BuffIdReferenceField
          label="点数 Buff"
          :data-property-path="JSON.stringify(['pointBuffId'])"
          :value="value.pointBuffId"
          :local-ids="localBuffIds"
          :common-ids="commonBuffIds"
          @update="setBuff('pointBuffId', $event)"
          @reveal="emit('revealBuff', $event)"
        />
        <label :data-property-path="JSON.stringify(['maximumPoints'])"
          >点数显示上限<input
            type="number"
            :value="value.maximumPoints"
            @change="patch('maximumPoints', $event, true)"
        /></label>
      </div>
      <div class="fields" v-else>
        <label :data-property-path="JSON.stringify(['abilityEntityId'])"
          >能力实体 ID<input
            :value="value.abilityEntityId"
            @change="patch('abilityEntityId', $event)"
        /></label>
        <label :data-property-path="JSON.stringify(['icon'])"
          >图标路径<input :value="value.icon" @change="patch('icon', $event)"
        /></label>
        <label :data-property-path="JSON.stringify(['nameKey'])"
          >名称 i18n 键<input :value="value.nameKey" @change="patch('nameKey', $event)"
        /></label>
      </div>
    </template>
  </section>
</template>
<style scoped>
.status-page {
  padding: 20px;
  max-width: 880px;
  color: var(--ea-fg);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 16px;
  margin-bottom: 24px;
}
h3 {
  margin: 0 0 8px;
  font-size: 16px;
}
p,
.summary span {
  color: var(--ea-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}
.summary {
  display: flex;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ea-border-soft);
  margin-bottom: 20px;
}
.fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 24px;
}
.fields h4 {
  grid-column: 1 / -1;
  margin: 0;
  padding-top: 12px;
  border-top: 1px solid var(--ea-border);
  font-size: 13px;
}
.fields h4 small {
  margin-left: 12px;
  font-weight: normal;
  color: var(--ea-text-secondary);
}
.source-note {
  margin: 0 0 20px;
}
label {
  display: grid;
  gap: 8px;
  font-size: 12px;
  align-content: start;
}
input:not([type='checkbox']),
select {
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
  padding: 7px;
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
}
button {
  color: var(--ea-fg);
  background: var(--ea-fill-input);
  border: 1px solid var(--ea-border);
  padding: 7px 12px;
  cursor: pointer;
}
.choices {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.empty {
  padding: 16px 0;
}
@media (max-width: 700px) {
  .fields {
    grid-template-columns: 1fr;
  }
}
</style>
