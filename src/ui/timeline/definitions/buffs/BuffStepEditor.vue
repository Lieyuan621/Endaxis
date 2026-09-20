<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
import type { GameplayTag } from '../../../../../packages/game-data-contract/src/gameplayTags';
import type {
  HealModifierDefinition,
  PoiseModifierDefinition,
} from '../../../../../packages/game-data-contract/src/modifiers';
import type {
  BuffDuration,
  BuffPriority,
  BuffTimeClock,
  CombatBuffDefinitionAttributeModifier,
  SkillBuffDefinitionDamageModifier as CombatBuffDefinitionDamageModifier,
  CombatBuffPresentation,
  CombatBuffChildPresentation,
  SkillBuffSlotReplacement,
  BuffShieldDefinition,
  BuffKeywordEnhancementDefinition,
  BuffSustainedProtectionDefinition,
  CombatBuffSemanticRole,
  CombatBuffSpellBurstDefinition,
} from '../../../../../packages/game-data-contract/src/buffs';

/**
 * Buff 施加步骤的参数编辑器。
 *
 * 接收目标、来源和可选覆盖项在这里明确分开。初始黑板赋值按具名条目编辑，
 * 保存时仍写回 SkillDefinition 使用的 Record 结构，不引入仅供界面使用的数据格式。
 */
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  type ActionSequenceDefinition,
  type ActionBlackboardValue,
  type CombatStepDefinition,
  type SkillBuffDefinition,
  type SkillBuffLifecycleSequences,
} from '../../../../core/game-data/operatorDefinition';
import {
  BUFF_STACKING_TYPES,
  type BuffStackingType,
} from '../../../../core/combat/buffs/combatBuffs';
import type { EditableCombatStepKind } from '../skills/skillDefinitionEditorViewModel';
import {
  setBuffDefinitionPresentation as replaceBuffDefinitionPresentation,
  setBuffDefinitionChildPresentations as replaceBuffDefinitionChildPresentations,
  setBuffDefinitionPriority,
  setBuffDefinitionScalar as replaceBuffDefinitionScalar,
  setBuffDefinitionBlackboard as replaceBuffDefinitionBlackboard,
  setBuffDefinitionAttributeModifiers as replaceBuffDefinitionAttributeModifiers,
  setBuffDefinitionDamageModifiers as replaceBuffDefinitionDamageModifiers,
  setBuffDefinitionSkillSlotReplacements as replaceBuffDefinitionSkillSlotReplacements,
  setBuffDefinitionHealModifiers as replaceBuffDefinitionHealModifiers,
  setBuffDefinitionPoiseModifiers as replaceBuffDefinitionPoiseModifiers,
  setBuffDefinitionShields as replaceBuffDefinitionShields,
  setBuffDefinitionKeywordEnhancements as replaceBuffDefinitionKeywordEnhancements,
  setBuffDefinitionAdvancedProperties as replaceBuffDefinitionAdvancedProperties,
} from './buffDefinitionEditorCommands';
import InspectorFields from '../inspector/InspectorFields.vue';
import type { DefinitionProperty } from '../definitionEditContext';
import {
  applyBuffInspectorFields,
  applyBuffAssignmentFields,
  validateApplyBuffInspector,
} from '../inspector/combatInspectorFields';
import ActionSequenceEditor from '../actions/ActionSequenceEditor.vue';
import BuffDefinitionScalarEditor from './BuffDefinitionScalarEditor.vue';
import BuffBlackboardEditor from './BuffBlackboardEditor.vue';
import BuffAttributeModifierEditor from './BuffAttributeModifierEditor.vue';
import BuffDamageModifierEditor from './BuffDamageModifierEditor.vue';
import CombatBuffPresentationEditor from './CombatBuffPresentationEditor.vue';
import CombatBuffChildPresentationsEditor from './CombatBuffChildPresentationsEditor.vue';
import BuffSkillSlotReplacementEditor from './BuffSkillSlotReplacementEditor.vue';
import BuffHealModifierEditor from './BuffHealModifierEditor.vue';
import BuffPoiseModifierEditor from './BuffPoiseModifierEditor.vue';
import BuffShieldEditor from './BuffShieldEditor.vue';
import BuffKeywordEnhancementEditor from './BuffKeywordEnhancementEditor.vue';
import BuffAdvancedPropertiesEditor from './BuffAdvancedPropertiesEditor.vue';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';
import GameplayTagsEditor from '../inspector/GameplayTagsEditor.vue';

type BuffStep = CombatStepForKind<'applyBuff'>;
const BUFF_LIFECYCLE_KEYS = [
  'start',
  'enable',
  'disable',
  'beforeEnhance',
  'enhanceChanged',
  'afterEnhance',
  'trigger',
  'finish',
] as const satisfies readonly (keyof SkillBuffLifecycleSequences)[];
type BuffLifecycleKey = (typeof BUFF_LIFECYCLE_KEYS)[number];

const props = defineProps<{
  step: BuffStep;
  parametersBinding?: DefinitionProperty;
  definitionBinding?: DefinitionProperty;
  skillLevel: number;
  /** 作为干员级 Buff 蓝图编辑器使用时，隐藏施加目标、实例覆盖和内联开关。 */
  definitionOnly?: boolean;
  createStep?: (kind: EditableCombatStepKind) => CombatStepDefinition;
  duplicateStep?: (step: CombatStepDefinition) => CombatStepDefinition;
  selectedStructurePath?: string;
  inspectorOnly?: boolean;
  /** 宿主在图中编辑修正器与护盾等行为结构；表现属性始终由 Inspector 编辑。 */
  modifierCollectionsInGraph?: boolean;
  /** The host projects the inline definition as a separate selectable graph node. */
  inlineDefinitionInGraph?: boolean;
}>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();
const { t } = useI18n({ useScope: 'global' });
const activeLifecycle = ref<BuffLifecycleKey>('start');
const selectedLifecycleStepPath = computed(() => {
  const prefix = `lifecycleSequences.${activeLifecycle.value}`;
  if (!props.selectedStructurePath?.startsWith(prefix)) return '';
  return props.selectedStructurePath.slice(prefix.length).replace(/^\./, '');
});

watch(
  () => props.selectedStructurePath,
  path => {
    const match = path?.match(/^lifecycleSequences\.([^.]+)/);
    const key = match?.[1] as BuffLifecycleKey | undefined;
    if (key !== undefined && BUFF_LIFECYCLE_KEYS.includes(key)) activeLifecycle.value = key;
  },
  { immediate: true },
);

function update(parameters: BuffStep['parameters']): void {
  emit('update', { ...props.step, parameters });
}

function setDefinition(definition: SkillBuffDefinition | undefined): void {
  const parameters = { ...props.step.parameters };
  if (definition === undefined) delete parameters.definition;
  else parameters.definition = definition;
  update(parameters);
}

function toggleDefinition(event: Event): void {
  setDefinition(
    (event.target as HTMLInputElement).checked
      ? { stackingType: 'refresh', durationSeconds: 10 }
      : undefined,
  );
}

function setDefinitionText(field: 'stackingKey', event: Event): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  const value = (event.target as HTMLInputElement).value;
  const next = { ...definition };
  if (value === '') delete next[field];
  else next[field] = value;
  setDefinition(next);
}

function setDefinitionPresentation(presentation: CombatBuffPresentation | undefined): void {
  if (props.definitionBinding) {
    props.definitionBinding.update(
      current =>
        current === undefined
          ? current
          : replaceBuffDefinitionPresentation(current as SkillBuffDefinition, presentation),
      [...props.definitionBinding.path, 'presentation'],
    );
    return;
  }
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  setDefinition(replaceBuffDefinitionPresentation(definition, presentation));
}

function setDefinitionChildPresentations(
  children: readonly CombatBuffChildPresentation[],
  focus: readonly (string | number)[] = [],
): void {
  if (props.definitionBinding) {
    props.definitionBinding.update(
      current =>
        current === undefined
          ? current
          : replaceBuffDefinitionChildPresentations(current as SkillBuffDefinition, children),
      [...props.definitionBinding.path, 'childPresentations', ...focus],
    );
    return;
  }
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  setDefinition(replaceBuffDefinitionChildPresentations(definition, children));
}

function setStackingType(event: Event): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  const stackingType = (event.target as HTMLSelectElement).value as BuffStackingType;
  if (!BUFF_STACKING_TYPES.includes(stackingType)) return;
  setDefinition({ ...definition, stackingType });
}

function setDefinitionScalar(
  field: 'durationSeconds' | 'triggerIntervalSeconds' | 'maxStackCount' | 'maxTriggerCount',
  value: BuffDuration | undefined,
): void {
  if (props.definitionBinding) {
    props.definitionBinding.update(
      current =>
        current === undefined
          ? current
          : replaceBuffDefinitionScalar(current as SkillBuffDefinition, field, value),
      [...props.definitionBinding.path, field],
    );
    return;
  }
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  setDefinition(replaceBuffDefinitionScalar(definition, field, value));
}

function setPriority(value: BuffDuration | undefined): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  setDefinition(setBuffDefinitionPriority(definition, value));
}

function setPriorityNegate(event: Event): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined || typeof definition.priority !== 'object') return;
  const priority: BuffPriority = {
    blackboardKey: definition.priority.blackboardKey,
    ...((event.target as HTMLInputElement).checked ? { negate: true } : {}),
  };
  setDefinition({ ...definition, priority });
}

function setTimeClock(event: Event): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  const value = (event.target as HTMLSelectElement).value as BuffTimeClock | '';
  const next = { ...definition };
  if (value === '') delete next.timeClock;
  else next.timeClock = value;
  setDefinition(next);
}

function setWaitFirstTriggerInterval(event: Event): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  const value = (event.target as HTMLSelectElement).value;
  const next = { ...definition };
  if (value === '') delete next.waitFirstTriggerInterval;
  else next.waitFirstTriggerInterval = value === 'true';
  setDefinition(next);
}

function setDefinitionBlackboard(
  blackboard: Readonly<Record<string, ActionBlackboardValue>>,
): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  setDefinition(replaceBuffDefinitionBlackboard(definition, blackboard));
}

function setDefinitionAttributeModifiers(
  modifiers: readonly CombatBuffDefinitionAttributeModifier[],
): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  setDefinition(replaceBuffDefinitionAttributeModifiers(definition, modifiers));
}

function setDefinitionDamageModifiers(
  modifiers: readonly CombatBuffDefinitionDamageModifier[],
): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  setDefinition(replaceBuffDefinitionDamageModifiers(definition, modifiers));
}

function setDefinitionSkillSlotReplacements(
  replacements: readonly SkillBuffSlotReplacement[],
): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  setDefinition(replaceBuffDefinitionSkillSlotReplacements(definition, replacements));
}

function setDefinitionHealModifiers(modifiers: readonly HealModifierDefinition[]): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  setDefinition(replaceBuffDefinitionHealModifiers(definition, modifiers));
}

function setDefinitionPoiseModifiers(modifiers: readonly PoiseModifierDefinition[]): void {
  const definition = props.step.parameters.definition;
  if (!definition) return;
  setDefinition(replaceBuffDefinitionPoiseModifiers(definition, modifiers));
}

function setDefinitionShields(shields: readonly BuffShieldDefinition[]): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  setDefinition(replaceBuffDefinitionShields(definition, shields));
}

function setDefinitionKeywordEnhancements(
  enhancements: readonly BuffKeywordEnhancementDefinition[],
): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  setDefinition(replaceBuffDefinitionKeywordEnhancements(definition, enhancements));
}

function setDefinitionAdvancedProperty(
  field: 'sustainedProtection' | 'role' | 'spellBurst' | 'affixSkillCastIdentity',
  value:
    | BuffSustainedProtectionDefinition
    | CombatBuffSemanticRole
    | CombatBuffSpellBurstDefinition
    | 'sourceSkillCast'
    | undefined,
): void {
  // 可选对象在根句柄上更新，允许从未设置状态新增；不会覆盖其他已更新字段。
  if (props.definitionBinding) {
    props.definitionBinding.update(
      current =>
        current === undefined
          ? current
          : replaceBuffDefinitionAdvancedProperties(current as SkillBuffDefinition, {
              [field]: value ?? null,
            }),
      [...props.definitionBinding.path, field],
    );
    return;
  }
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  setDefinition(replaceBuffDefinitionAdvancedProperties(definition, { [field]: value ?? null }));
}

function setDefinitionTags(field: 'applyTags' | 'extendTags', tags: readonly GameplayTag[]): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  const next = { ...definition };
  if (tags.length === 0) delete next[field];
  else next[field] = tags;
  setDefinition(next);
}

function setLifecycleSequence(
  key: BuffLifecycleKey,
  sequence: ActionSequenceDefinition | undefined,
): void {
  const definition = props.step.parameters.definition;
  if (definition === undefined) return;
  const lifecycleSequences: Partial<Record<BuffLifecycleKey, ActionSequenceDefinition>> = {
    ...definition.lifecycleSequences,
  };
  if (sequence === undefined) delete lifecycleSequences[key];
  else lifecycleSequences[key] = sequence;

  const nextDefinition = { ...definition };
  if (Object.keys(lifecycleSequences).length === 0) delete nextDefinition.lifecycleSequences;
  else nextDefinition.lifecycleSequences = lifecycleSequences;

  update({
    ...props.step.parameters,
    definition: nextDefinition,
    // 生命周期步骤需要知道它由哪一次技能释放创建，编辑器在启用时一并保证该前提。
    ...(sequence === undefined ? {} : { inheritSourceSkillCastInfo: true }),
  });
}

function toggleLifecycle(key: BuffLifecycleKey, event: Event): void {
  const enabled = (event.target as HTMLInputElement).checked;
  setLifecycleSequence(key, enabled ? { steps: [] } : undefined);
}
</script>

<template>
  <div v-if="!definitionOnly" class="step-editor__grid">
    <InspectorFields
      :binding="parametersBinding"
      :value="step.parameters"
      :fields="applyBuffInspectorFields"
      :validate="validateApplyBuffInspector"
      @update="update"
    />
  </div>

  <fieldset
    class="buff-definition"
    :class="{ 'buff-definition--inspector': definitionOnly && inspectorOnly }"
  >
    <legend v-if="!definitionOnly">
      <label class="step-editor__check">
        <input
          type="checkbox"
          :checked="step.parameters.definition !== undefined"
          :disabled="typeof step.parameters.buffId !== 'string'"
          @change="toggleDefinition"
        />
        <EditorFieldLabel
          :label="t('timeline.skillEditing.inlineBuffDefinition')"
          :help="t('timeline.skillEditing.fieldHelp.inlineBuffDefinition')"
        />
      </label>
    </legend>
    <p v-if="inlineDefinitionInGraph && step.parameters.definition">
      定义属性在导图的“内联 Buff”子节点中编辑。
    </p>
    <template v-if="!inlineDefinitionInGraph">
      <div v-if="step.parameters.definition" class="buff-root-fields">
        <section class="buff-field-section">
          <h3>叠加与优先级</h3>
          <div class="buff-definition__grid">
            <label>
              <EditorFieldLabel :label="t('timeline.skillEditing.buffStackingType')" />
              <select :value="step.parameters.definition.stackingType" @change="setStackingType">
                <option v-for="type in BUFF_STACKING_TYPES" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </label>
            <label>
              <EditorFieldLabel :label="t('timeline.skillEditing.buffStackingKey')" />
              <input
                type="text"
                :value="step.parameters.definition.stackingKey ?? ''"
                @input="setDefinitionText('stackingKey', $event)"
              />
            </label>
            <label>
              <EditorFieldLabel :label="t('timeline.skillEditing.maxStacks')" />
              <BuffDefinitionScalarEditor
                :value="step.parameters.definition.maxStackCount"
                integer
                :minimum="0"
                :data-property-path="
                  definitionBinding
                    ? JSON.stringify([...definitionBinding.path, 'maxStackCount'])
                    : undefined
                "
                @update="setDefinitionScalar('maxStackCount', $event)"
              />
            </label>
            <label>
              <EditorFieldLabel label="优先级" />
              <span class="buff-priority-editor">
                <BuffDefinitionScalarEditor
                  :value="step.parameters.definition.priority"
                  @update="setPriority"
                />
                <label v-if="typeof step.parameters.definition.priority === 'object'">
                  <input
                    type="checkbox"
                    :checked="step.parameters.definition.priority.negate === true"
                    @change="setPriorityNegate"
                  />
                  取反
                </label>
              </span>
            </label>
          </div>
        </section>
        <section class="buff-field-section">
          <h3>持续时间与触发</h3>
          <div class="buff-definition__grid">
            <label>
              <EditorFieldLabel label="时间域" />
              <select :value="step.parameters.definition.timeClock ?? ''" @change="setTimeClock">
                <option value="">默认（省略）</option>
                <option value="default">default</option>
                <option value="global">global</option>
                <option value="self">self</option>
              </select>
            </label>
            <label>
              <EditorFieldLabel :label="t('timeline.skillEditing.durationSeconds')" />
              <BuffDefinitionScalarEditor
                :value="step.parameters.definition.durationSeconds"
                :minimum="0"
                :data-property-path="
                  definitionBinding
                    ? JSON.stringify([...definitionBinding.path, 'durationSeconds'])
                    : undefined
                "
                @update="setDefinitionScalar('durationSeconds', $event)"
              />
            </label>
            <label>
              <EditorFieldLabel :label="t('timeline.skillEditing.buffTriggerInterval')" />
              <BuffDefinitionScalarEditor
                :value="step.parameters.definition.triggerIntervalSeconds"
                :minimum="0"
                :data-property-path="
                  definitionBinding
                    ? JSON.stringify([...definitionBinding.path, 'triggerIntervalSeconds'])
                    : undefined
                "
                @update="setDefinitionScalar('triggerIntervalSeconds', $event)"
              />
            </label>
            <label>
              <EditorFieldLabel label="首次触发前等待间隔" />
              <select
                :value="
                  step.parameters.definition.waitFirstTriggerInterval === undefined
                    ? ''
                    : String(step.parameters.definition.waitFirstTriggerInterval)
                "
                @change="setWaitFirstTriggerInterval"
              >
                <option value="">未设置</option>
                <option value="true">是</option>
                <option value="false">否</option>
              </select>
            </label>
            <label>
              <EditorFieldLabel :label="t('timeline.skillEditing.buffMaxTriggerCount')" />
              <BuffDefinitionScalarEditor
                :value="step.parameters.definition.maxTriggerCount"
                integer
                :minimum="-1"
                :data-property-path="
                  definitionBinding
                    ? JSON.stringify([...definitionBinding.path, 'maxTriggerCount'])
                    : undefined
                "
                @update="setDefinitionScalar('maxTriggerCount', $event)"
              />
            </label>
          </div>
        </section>
        <section class="buff-field-section">
          <h3>标签规则</h3>
          <div class="buff-definition__grid">
            <label>
              <EditorFieldLabel
                :label="t('timeline.skillEditing.buffApplyTags')"
                :help="t('timeline.skillEditing.fieldHelp.buffApplyTags')"
              />
              <GameplayTagsEditor
                :tags="step.parameters.definition.applyTags ?? []"
                :minimum="0"
                @update="setDefinitionTags('applyTags', $event)"
              />
            </label>
            <label>
              <EditorFieldLabel
                :label="t('timeline.skillEditing.buffExtendTags')"
                :help="t('timeline.skillEditing.fieldHelp.buffExtendTags')"
              />
              <GameplayTagsEditor
                :tags="step.parameters.definition.extendTags ?? []"
                :minimum="0"
                @update="setDefinitionTags('extendTags', $event)"
              />
            </label>
          </div>
        </section>
      </div>
      <CombatBuffPresentationEditor
        v-if="step.parameters.definition"
        :data-property-path="
          definitionBinding && JSON.stringify([...definitionBinding.path, 'presentation'])
        "
        :presentation="step.parameters.definition.presentation"
        @update="setDefinitionPresentation"
      />
      <CombatBuffChildPresentationsEditor
        v-if="step.parameters.definition"
        :property-path="definitionBinding && [...definitionBinding.path, 'childPresentations']"
        :data-property-path="
          definitionBinding && JSON.stringify([...definitionBinding.path, 'childPresentations'])
        "
        :children="step.parameters.definition.childPresentations ?? []"
        @update="setDefinitionChildPresentations"
      />
      <BuffBlackboardEditor
        v-if="step.parameters.definition"
        :always-expanded="modifierCollectionsInGraph"
        :blackboard="step.parameters.definition.blackboard ?? {}"
        @update="setDefinitionBlackboard"
      />
      <BuffAttributeModifierEditor
        v-if="step.parameters.definition && !modifierCollectionsInGraph"
        :modifiers="step.parameters.definition.attributeModifiers ?? []"
        @update="setDefinitionAttributeModifiers"
      />
      <BuffDamageModifierEditor
        v-if="step.parameters.definition && !modifierCollectionsInGraph"
        :modifiers="step.parameters.definition.damageModifiers ?? []"
        :skill-level="skillLevel"
        :create-step="createStep"
        :duplicate-step="duplicateStep"
        @update="setDefinitionDamageModifiers"
      />
      <BuffSkillSlotReplacementEditor
        v-if="step.parameters.definition && !modifierCollectionsInGraph"
        :replacements="step.parameters.definition.skillSlotReplacements ?? []"
        @update="setDefinitionSkillSlotReplacements"
      />
      <BuffHealModifierEditor
        v-if="step.parameters.definition && !modifierCollectionsInGraph"
        :modifiers="step.parameters.definition.healModifiers ?? []"
        @update="setDefinitionHealModifiers"
      />
      <BuffPoiseModifierEditor
        v-if="step.parameters.definition && !modifierCollectionsInGraph"
        :modifiers="step.parameters.definition.poiseModifiers ?? []"
        @update="setDefinitionPoiseModifiers"
      />
      <BuffShieldEditor
        v-if="step.parameters.definition && !modifierCollectionsInGraph"
        :shields="step.parameters.definition.shields ?? []"
        @update="setDefinitionShields"
      />
      <BuffKeywordEnhancementEditor
        v-if="step.parameters.definition && !modifierCollectionsInGraph"
        :enhancements="step.parameters.definition.keywordEnhancements ?? []"
        @update="setDefinitionKeywordEnhancements"
      />
      <BuffAdvancedPropertiesEditor
        v-if="step.parameters.definition"
        :property-path="definitionBinding?.path"
        :sustained-protection="step.parameters.definition.sustainedProtection"
        :role="step.parameters.definition.role"
        :spell-burst="step.parameters.definition.spellBurst"
        :affix-skill-cast-identity="step.parameters.definition.affixSkillCastIdentity"
        @update-sustained-protection="setDefinitionAdvancedProperty('sustainedProtection', $event)"
        @update-role="setDefinitionAdvancedProperty('role', $event)"
        @update-spell-burst="setDefinitionAdvancedProperty('spellBurst', $event)"
        @update-affix-skill-cast-identity="
          setDefinitionAdvancedProperty('affixSkillCastIdentity', $event)
        "
      />
    </template>
  </fieldset>

  <fieldset
    v-if="step.parameters.definition && !inspectorOnly && !inlineDefinitionInGraph"
    class="buff-lifecycle"
  >
    <legend>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.buffLifecycle')"
        :help="t('timeline.skillEditing.fieldHelp.buffLifecycle')"
      />
    </legend>
    <div class="buff-lifecycle__tabs">
      <button
        v-for="key in BUFF_LIFECYCLE_KEYS"
        :key="key"
        type="button"
        :class="{
          'is-active': activeLifecycle === key,
          'is-enabled': step.parameters.definition.lifecycleSequences?.[key] !== undefined,
        }"
        @click="activeLifecycle = key"
      >
        {{ t(`timeline.skillEditing.buffLifecycleKinds.${key}`) }}
      </button>
    </div>
    <label class="buff-lifecycle__toggle">
      <input
        type="checkbox"
        :checked="step.parameters.definition.lifecycleSequences?.[activeLifecycle] !== undefined"
        @change="toggleLifecycle(activeLifecycle, $event)"
      />
      {{ t('timeline.skillEditing.enableBuffLifecycle') }}
    </label>
    <ActionSequenceEditor
      v-if="
        step.parameters.definition.lifecycleSequences?.[activeLifecycle] &&
        createStep &&
        duplicateStep
      "
      :sequence="step.parameters.definition.lifecycleSequences[activeLifecycle]!"
      :skill-level="skillLevel"
      :create-step="createStep"
      :duplicate-step="duplicateStep"
      :selected-path="selectedLifecycleStepPath"
      @update="setLifecycleSequence(activeLifecycle, $event)"
    />
  </fieldset>

  <InspectorFields
    :binding="parametersBinding"
    v-if="!definitionOnly"
    :value="step.parameters"
    :fields="applyBuffAssignmentFields"
    :validate="validateApplyBuffInspector"
    :current-level="skillLevel"
    @update="update"
  />
</template>

<style scoped>
.step-editor__optional {
  grid-column: 1 / -1;
  display: grid !important;
  grid-template-columns: 18px minmax(130px, 180px) minmax(0, 1fr) !important;
}

.buff-definition__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
}
.buff-root-fields {
  display: grid;
  gap: 18px;
}
.buff-field-section {
  min-width: 0;
}
.buff-field-section h3 {
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--ea-border-soft);
  font-size: 12px;
  font-weight: 600;
  color: var(--ea-fg);
}
.buff-definition {
  min-inline-size: 0;
}
.buff-definition--inspector {
  border: 0;
  padding: 0;
  margin: 0;
}
@container (max-width: 650px) {
  .buff-definition__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@container (max-width: 360px) {
  .buff-definition .buff-definition__grid > label {
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
  }
}

.buff-definition__grid label {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(110px, 150px) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.buff-lifecycle__tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 5px;
  margin-bottom: 10px;
}

.buff-lifecycle__tabs button {
  position: relative;
  min-width: 0;
  min-height: 30px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg-muted);
  cursor: pointer;
}

.buff-lifecycle__tabs button.is-active {
  border-color: var(--ea-gold);
  color: var(--ea-gold);
}

.buff-lifecycle__tabs button.is-enabled::after {
  content: '';
  position: absolute;
  top: 4px;
  right: 4px;
  width: 5px;
  height: 5px;
  background: var(--ea-gold);
}

.buff-lifecycle__toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  color: var(--ea-fg-muted);
  font-size: 11px;
}

@container (max-width: 760px) {
  .buff-lifecycle__tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
