<script setup lang="ts">
import { ElIcon } from 'element-plus';
/**
 * 战斗步骤编辑器的统一入口。
 *
 * 图内参数优先使用契约生成的 Schema；尚不能完整表达的参数及完整表单回退专用编辑器。
 * 结构入口不随参数迁移消失，所有更新仍交由原宿主管理。
 */
import { computed, inject, provide, ref, watch } from 'vue';
import { definitionPropertyKey } from '../definitionEditContext';
import { useI18n } from 'vue-i18n';
import { CaretBottom, CaretRight } from '@element-plus/icons-vue';
import type { CombatStepDefinition } from '../../../../core/game-data/operatorDefinition';
import InspectorFields from '../inspector/InspectorFields.vue';
import type { InspectorPropertyPath } from '../inspector/inspectorProperty';
import { useInspectorPropertyReveal } from '../inspector/useInspectorPropertyReveal';
import { stepInspectorFields, validateStepInspector } from '../inspector/stepInspectorSchema';
import ActionValueStepEditor from './ActionValueStepEditor.vue';
import DamageStepEditor from './DamageStepEditor.vue';
import HealStepEditor from './HealStepEditor.vue';
import ElementalReactionStepEditor from './ElementalReactionStepEditor.vue';
import SpellBurstStepEditor from './SpellBurstStepEditor.vue';
import BuffStepEditor from '../buffs/BuffStepEditor.vue';
import BuffManagementStepEditor from '../buffs/BuffManagementStepEditor.vue';
import MechanicStepEditor from './MechanicStepEditor.vue';
import ResourceStepEditor from './ResourceStepEditor.vue';
import StatusStepEditor from './StatusStepEditor.vue';
import BranchStepEditor from './BranchStepEditor.vue';
import SwitchStepEditor from './SwitchStepEditor.vue';
import EditorHelpHint from '../inspector/EditorHelpHint.vue';
import EventListenerStepEditor from './EventListenerStepEditor.vue';
import TimeDilationStepEditor from './TimeDilationStepEditor.vue';
import AbilityEntityStepEditor from './AbilityEntityStepEditor.vue';
import PhysicalInflictionStepEditor from './PhysicalInflictionStepEditor.vue';
import SkillRoutingStepEditor from './SkillRoutingStepEditor.vue';
import ActionDispatchStepEditor from './ActionDispatchStepEditor.vue';
import BuffLifecycleOperationStepEditor from '../buffs/BuffLifecycleOperationStepEditor.vue';
import SkillSettingStepEditor from './SkillSettingStepEditor.vue';
import KnockDownStepEditor from './KnockDownStepEditor.vue';
import GlobalBuffStepEditor from '../buffs/GlobalBuffStepEditor.vue';
import TargetContextStepEditor from './TargetContextStepEditor.vue';
import ForEachContextTargetStepEditor from './ForEachContextTargetStepEditor.vue';
import StructuredControlStepEditor from './StructuredControlStepEditor.vue';
import type { EditableCombatStepKind } from '../skills/skillDefinitionEditorViewModel';

const props = defineProps<{
  step: CombatStepDefinition;
  skillLevel: number;
  showHeader?: boolean;
  createStep?: (kind: EditableCombatStepKind) => CombatStepDefinition;
  duplicateStep?: (step: CombatStepDefinition) => CombatStepDefinition;
  selectedPath?: string;
  restoredPropertyPath?: InspectorPropertyPath;
  inspectorOnly?: boolean;
  inlineBuffInGraph?: boolean;
}>();
const emit = defineEmits<{
  update: [step: CombatStepDefinition, propertyPath?: InspectorPropertyPath];
}>();
const { t } = useI18n({ useScope: 'global' });
const collapsed = ref(false);
const definitionProperty = inject(definitionPropertyKey, undefined);
// 当前作用域只绑定这个步骤，尚未迁移的嵌套入口不得误用父步骤句柄。
provide(definitionPropertyKey, undefined);
const parametersBinding = computed(() => definitionProperty?.value.child('parameters'));
const editorRoot = ref<HTMLElement | null>(null);
const revealProperty = useInspectorPropertyReveal(editorRoot);
const automaticFields = computed(() => {
  // 已完成完整面板迁移的类型不再保留专用组件；其他类型仍须先核对结构入口。
  if (
    [
      'createAbilityEntityTimedMarker',
      'storeCurrentTimelineFrame',
      'storeEventSpGainAmount',
      'storeEventHealValues',
      'storeShieldValue',
      'setHealthFloor',
      'adjustSkillCooldown',
      'setIgnoreGlobalTimeScale',
      'storeSourceAttributeValue',
      'storeEntityPropertyValue',
      'readAbilityEntityRemainingDuration',
      'setAbilityEntityRemainingDuration',
      'finishCurrentAbilityEntity',
      'finishActionOwnerAbilityEntity',
      'finishCurrentAbilityEntityWhenSourceDies',
      'startCurrentAbilityEntityChildSkillById',
      'readEventBuffBlackboard',
      'readCurrentBuffRemainingDuration',
      'readBuffRemainingDuration',
      'setCurrentBuffRemainingDuration',
      'refreshCurrentBuffAttributeModifiers',
      'finishCurrentBuff',
      'setCurrentBuffTimePaused',
    ].includes(props.step.kind)
  )
    return stepInspectorFields<CombatStepDefinition['kind']>(props.step.kind);
  return props.inspectorOnly
    ? stepInspectorFields<CombatStepDefinition['kind']>(props.step.kind)
    : undefined;
});
watch(
  () => props.restoredPropertyPath,
  path => {
    void revealProperty();
    if (!path) return;
    collapsed.value = false;
    // 结构容器由子编辑器选中目标；本层只定位自己的自动参数字段。
    if (automaticFields.value) void revealProperty(path);
  },
  { immediate: true, flush: 'post' },
);
function updateParameters(
  parameters: CombatStepDefinition['parameters'],
  propertyPath?: InspectorPropertyPath,
) {
  // kind 与原步骤身份不变；参数结构来自该 kind 的契约生成物。
  emit('update', { ...props.step, parameters } as CombatStepDefinition, propertyPath);
}
function validateParameters(parameters: CombatStepDefinition['parameters']) {
  return validateStepInspector({ ...props.step, parameters } as CombatStepDefinition);
}

const stepHelp = computed(() => t(`timeline.skillEditing.stepHelp.${props.step.kind}`));

function forward(step: CombatStepDefinition, propertyPath?: InspectorPropertyPath): void {
  emit('update', step, propertyPath);
}
</script>

<template>
  <section ref="editorRoot" class="step-editor">
    <header v-if="showHeader !== false">
      <div>
        <span>{{ t('timeline.skillEditing.stepParameters') }}</span>
        <strong>{{ t(`timeline.skillEditing.stepKinds.${step.kind}`) }}</strong>
        <EditorHelpHint :text="stepHelp" />
      </div>
      <button
        type="button"
        class="step-editor__collapse"
        :aria-expanded="!collapsed"
        :title="
          t(collapsed ? 'timeline.skillEditing.expandStep' : 'timeline.skillEditing.collapseStep')
        "
        @click="collapsed = !collapsed"
      >
        <el-icon><CaretRight v-if="collapsed" /><CaretBottom v-else /></el-icon>
      </button>
    </header>

    <div v-show="!collapsed" class="step-editor__body">
      <p v-if="automaticFields?.length === 0">{{ t('timeline.skillEditing.noStepParameters') }}</p>
      <InspectorFields
        :binding="parametersBinding"
        v-if="automaticFields"
        :value="step.parameters"
        :property-path="['parameters']"
        :fields="automaticFields"
        :validate="validateParameters"
        :current-level="skillLevel"
        @update="updateParameters"
      />
      <template
        v-else-if="step.kind === 'startTimeDilation' || step.kind === 'startUltimateTimeDilation'"
      >
        <TimeDilationStepEditor :step="step" @update="forward" />
      </template>
      <template
        v-else-if="
          step.kind === 'mergeContextTargets' ||
          step.kind === 'findCharacterTeamTargets' ||
          step.kind === 'findOwnerSpawnedAbilityEntities' ||
          step.kind === 'pickContextTarget'
        "
      >
        <TargetContextStepEditor :step="step" @update="forward" />
      </template>
      <template v-else-if="step.kind === 'forEachContextTarget'">
        <ForEachContextTargetStepEditor :step="step" @update="forward" />
      </template>
      <template v-else-if="step.kind === 'startCurrentAbilityEntityChildSkill'">
        <p class="step-editor__unsupported">
          内联子技能本层没有额外参数；定义、黑板和调度序列在左侧导图中分层编辑。
        </p>
      </template>
      <template
        v-else-if="
          step.kind === 'createSpatialPointTargets' ||
          step.kind === 'jumpTimeline' ||
          step.kind === 'finishTimeline' ||
          step.kind === 'withActionBlackboardScope' ||
          step.kind === 'repeatByActionValue' ||
          step.kind === 'launchProjectile'
        "
      >
        <StructuredControlStepEditor :step="step" :skill-level="skillLevel" @update="forward" />
      </template>
      <template v-else-if="step.kind === 'switch'">
        <SwitchStepEditor
          :restored-property-path="restoredPropertyPath"
          :step="step"
          :skill-level="skillLevel"
          :create-step="createStep"
          :duplicate-step="duplicateStep"
          :selected-path="selectedPath"
          :inspector-only="inspectorOnly"
          @update="forward"
        />
      </template>
      <template
        v-else-if="
          step.kind === 'dealDamage' ||
          step.kind === 'dealFixedDamage' ||
          step.kind === 'dealStagger' ||
          step.kind === 'applyElementalInfliction'
        "
      >
        <DamageStepEditor :step="step" :skill-level="skillLevel" @update="forward" />
      </template>
      <template v-else-if="step.kind === 'heal'">
        <HealStepEditor :step="step" :skill-level="skillLevel" @update="forward" />
      </template>
      <template v-else-if="step.kind === 'applyPhysicalInfliction'">
        <PhysicalInflictionStepEditor :step="step" @update="forward" />
      </template>
      <template v-else-if="step.kind === 'applyKnockDown'">
        <KnockDownStepEditor :step="step" @update="forward" />
      </template>
      <template v-else-if="step.kind === 'triggerSpellBurst'">
        <SpellBurstStepEditor :step="step" @update="forward" />
      </template>
      <template
        v-else-if="
          step.kind === 'triggerCustomAbilityEvent' || step.kind === 'castSkillDuringAction'
        "
      >
        <ActionDispatchStepEditor :step="step" @update="forward" />
      </template>
      <template
        v-else-if="step.kind === 'modifyActionValue' || step.kind === 'calculateActionValue'"
      >
        <ActionValueStepEditor :step="step" :skill-level="skillLevel" @update="forward" />
      </template>
      <template v-else-if="step.kind === 'readSkillSettingData'">
        <SkillSettingStepEditor :step="step" @update="forward" />
      </template>
      <template
        v-else-if="step.kind === 'changeResource' || step.kind === 'changeResourceByActionValue'"
      >
        <ResourceStepEditor :step="step" :skill-level="skillLevel" @update="forward" />
      </template>
      <template v-else-if="step.kind === 'applyStatus' || step.kind === 'consumeStatus'">
        <StatusStepEditor :step="step" :skill-level="skillLevel" @update="forward" />
      </template>
      <template
        v-else-if="
          step.kind === 'applyElementalReaction' || step.kind === 'consumeElementalReaction'
        "
      >
        <ElementalReactionStepEditor :step="step" @update="forward" />
      </template>
      <template v-else-if="step.kind === 'applyBuff'">
        <BuffStepEditor
          :parameters-binding="parametersBinding"
          :inline-definition-in-graph="inlineBuffInGraph"
          :step="step"
          :skill-level="skillLevel"
          :create-step="createStep"
          :duplicate-step="duplicateStep"
          :inspector-only="inspectorOnly"
          @update="forward"
        />
      </template>
      <template v-else-if="step.kind === 'spawnAbilityEntity'">
        <AbilityEntityStepEditor
          :step="step"
          :skill-level="skillLevel"
          :create-step="createStep"
          :duplicate-step="duplicateStep"
          :inspector-only="inspectorOnly"
          @update="forward"
        />
      </template>
      <template
        v-else-if="
          step.kind === 'readBuffBlackboard' ||
          step.kind === 'readBuffStackCount' ||
          step.kind === 'finishBuffsByTag' ||
          step.kind === 'finishBuffsById' ||
          step.kind === 'holdBuffsById'
        "
      >
        <BuffManagementStepEditor :step="step" @update="forward" />
      </template>
      <template
        v-else-if="
          step.kind === 'igniteBuffs' ||
          step.kind === 'inheritBuffById' ||
          step.kind === 'restrictUltimateEnergyRecovery'
        "
      >
        <BuffLifecycleOperationStepEditor :step="step" @update="forward" />
      </template>
      <template
        v-else-if="
          step.kind === 'createGlobalBuff' ||
          step.kind === 'finishParentGlobalBuff' ||
          step.kind === 'finishGlobalBuffsById'
        "
      >
        <GlobalBuffStepEditor :step="step" @update="forward" />
      </template>
      <template
        v-else-if="
          step.kind === 'createTimedMarker' ||
          step.kind === 'setGlobalCooldown' ||
          step.kind === 'outputAirborne' ||
          step.kind === 'outputKnockDown' ||
          step.kind === 'gainSquadUltimateEnergyFromSkillCost' ||
          step.kind === 'gainFinisherSp' ||
          step.kind === 'setContextFlag' ||
          step.kind === 'setCharacterPassiveUiValue' ||
          step.kind === 'openComboWindow'
        "
      >
        <MechanicStepEditor :step="step" :skill-level="skillLevel" @update="forward" />
      </template>
      <template
        v-else-if="
          step.kind === 'conditional' || step.kind === 'once' || step.kind === 'repeatEachTick'
        "
      >
        <BranchStepEditor
          :restored-property-path="restoredPropertyPath"
          :step="step"
          :skill-level="skillLevel"
          :create-step="createStep"
          :duplicate-step="duplicateStep"
          :selected-path="selectedPath"
          :inspector-only="inspectorOnly"
          @update="forward"
        />
      </template>
      <template v-else-if="step.kind === 'listenForCombatEvents'">
        <EventListenerStepEditor
          v-if="!inspectorOnly"
          :step="step"
          :parameters-binding="parametersBinding"
          :skill-level="skillLevel"
          :create-step="createStep"
          :duplicate-step="duplicateStep"
          @update="forward"
        />
        <p v-else class="step-editor__unsupported">事件响应在左侧导图中添加和选择。</p>
      </template>
      <template
        v-else-if="
          step.kind === 'changeSkillSlot' ||
          step.kind === 'overrideBasicAttackMapping' ||
          step.kind === 'changePlayerActionMode' ||
          step.kind === 'changeNativeSkillType'
        "
      >
        <SkillRoutingStepEditor :step="step" @update="forward" />
      </template>

      <p v-else class="step-editor__unsupported">
        {{ t('timeline.skillEditing.unsupportedStepEditor') }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.step-editor {
  min-width: 0;
  container-type: inline-size;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-workbench-panel);
}

.step-editor > header {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 12px;
  border-bottom: 1px solid var(--ea-border-soft);
}

.step-editor > header div {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.step-editor__collapse {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ea-fg-muted);
  cursor: pointer;
}

.step-editor__collapse:hover {
  border-color: var(--ea-gold);
  color: var(--ea-gold);
}

.step-editor > header span,
.step-editor :deep(label > span),
.step-editor :deep(em) {
  color: var(--ea-fg-muted);
  font-size: 10px;
}

.step-editor :deep(.step-editor__grid) {
  display: grid;
  grid-template-columns: repeat(2, minmax(240px, 1fr));
  gap: 12px 16px;
  padding: 14px;
}

.step-editor :deep(.step-editor__grid > label) {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(88px, 112px) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.step-editor :deep(.step-editor__operand) {
  grid-column: 1 / -1;
}

@container (max-width: 560px) {
  .step-editor :deep(.step-editor__grid) {
    grid-template-columns: 1fr;
  }
}

.step-editor :deep(input[type='number']),
.step-editor :deep(input[type='text']),
.step-editor :deep(select) {
  min-width: 0;
  max-width: 100%;
  width: 100%;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  border-radius: 2px;
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  padding: 0 6px;
}

.step-editor :deep(em) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-editor :deep(fieldset) {
  min-width: 0;
  max-width: calc(100% - 28px);
  box-sizing: border-box;
  margin: 0 14px 14px;
  padding: 10px;
  border: 1px solid var(--ea-border-soft);
}

.step-editor :deep(legend) {
  max-width: 100%;
  overflow-wrap: anywhere;
  padding: 0 5px;
  color: var(--ea-fg-muted);
  font-size: 10px;
}

.step-editor :deep(.step-editor__grid > label > *) {
  min-width: 0;
  max-width: 100%;
}

.step-editor :deep(.step-editor__check) {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin: 3px 14px 3px 0;
}

.step-editor :deep(.step-editor__check--field) {
  display: flex !important;
  grid-template-columns: auto 1fr !important;
  justify-content: flex-start;
  margin-right: 0;
}

.step-editor__unsupported {
  margin: 0;
  padding: 24px;
  color: var(--ea-fg-muted);
  text-align: center;
}
</style>
