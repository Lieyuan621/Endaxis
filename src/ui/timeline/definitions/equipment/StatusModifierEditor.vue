<script setup lang="ts">
import type { StatusModifierDefinitionMap } from '../../../../../packages/game-data-contract/src/actions';
/**
 * 编辑语义状态附带的修正列表。
 * 每种修正都使用合法的最小默认值创建；逐等级字段只改当前技能等级，避免编辑状态时破坏其他等级。
 */
import { useI18n } from 'vue-i18n';
import {
  COMBAT_RESOURCES,
  DAMAGE_TYPES,
  OPERATOR_ATTRIBUTES,
  STATUS_MODIFIER_KINDS,
  type CombatResource,
  type DamageType,
  type OperatorAttribute,
  type StatusModifierDefinition,
} from '../../../../core/game-data/operatorDefinition';
import {
  replaceLevelValueForEditor,
  resolveLevelValueForEditor,
} from '../skills/skillDefinitionEditorViewModel';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';

const props = defineProps<{
  modifiers: readonly StatusModifierDefinition[];
  skillLevel: number;
}>();
const emit = defineEmits<{ update: [modifiers: readonly StatusModifierDefinition[]] }>();
const { t } = useI18n({ useScope: 'global' });

function createModifier(kind: StatusModifierDefinition['kind']): StatusModifierDefinition {
  switch (kind) {
    case 'attackPercent':
      return { kind, value: 0 };
    case 'susceptibility':
      return { kind, damageTypes: ['physical'], value: 0 };
    case 'slowed':
      return { kind };
    case 'blockResourceGain':
      return { kind, resource: 'sp' };
    case 'resourceCostMultiplier':
      return { kind, resource: 'sp', value: 1 };
    case 'skillCooldownMultiplier':
      return { kind, skillGroupKey: 'skill', value: 1 };
  }
}

function replaceModifier(index: number, modifier: StatusModifierDefinition): void {
  emit(
    'update',
    props.modifiers.map((item, itemIndex) => (itemIndex === index ? modifier : item)),
  );
}

function addModifier(): void {
  emit('update', [...props.modifiers, createModifier('attackPercent')]);
}

function removeModifier(index: number): void {
  emit(
    'update',
    props.modifiers.filter((_, itemIndex) => itemIndex !== index),
  );
}

function setKind(index: number, event: Event): void {
  const kind = (event.target as HTMLSelectElement).value as StatusModifierDefinition['kind'];
  if (!STATUS_MODIFIER_KINDS.includes(kind)) return;
  replaceModifier(index, createModifier(kind));
}

function finiteNumber(event: Event): number | undefined {
  const value = Number((event.target as HTMLInputElement).value);
  return Number.isFinite(value) ? value : undefined;
}

function currentLevelValue(value: number | readonly number[]): number {
  return resolveLevelValueForEditor(value, props.skillLevel) ?? 0;
}

function setLevelValue(
  index: number,
  modifier: StatusModifierDefinitionMap['attackPercent' | 'susceptibility'],
  event: Event,
): void {
  const value = finiteNumber(event);
  if (value === undefined) return;
  replaceModifier(index, {
    ...modifier,
    value: replaceLevelValueForEditor(modifier.value, props.skillLevel, value / 100),
  });
}

function setCap(
  index: number,
  modifier: StatusModifierDefinitionMap['susceptibility'],
  event: Event,
): void {
  const value = finiteNumber(event);
  if (value === undefined || modifier.cap === undefined) return;
  replaceModifier(index, {
    ...modifier,
    cap: replaceLevelValueForEditor(modifier.cap, props.skillLevel, value / 100),
  });
}

function setResource(
  index: number,
  modifier: StatusModifierDefinitionMap['blockResourceGain' | 'resourceCostMultiplier'],
  event: Event,
): void {
  const resource = (event.target as HTMLSelectElement).value as CombatResource;
  if (!COMBAT_RESOURCES.includes(resource)) return;
  replaceModifier(index, { ...modifier, resource });
}

function setMultiplier(
  index: number,
  modifier: StatusModifierDefinitionMap['resourceCostMultiplier' | 'skillCooldownMultiplier'],
  event: Event,
): void {
  const value = finiteNumber(event);
  if (value === undefined) return;
  replaceModifier(index, { ...modifier, value });
}

function setSkillGroupKey(
  index: number,
  modifier: StatusModifierDefinitionMap['skillCooldownMultiplier'],
  event: Event,
): void {
  replaceModifier(index, { ...modifier, skillGroupKey: (event.target as HTMLInputElement).value });
}

function toggleDamageType(
  index: number,
  modifier: StatusModifierDefinitionMap['susceptibility'],
  damageType: DamageType,
): void {
  const damageTypes = modifier.damageTypes.includes(damageType)
    ? modifier.damageTypes.filter(item => item !== damageType)
    : [...modifier.damageTypes, damageType];
  if (damageTypes.length === 0) return;
  replaceModifier(index, { ...modifier, damageTypes });
}

function toggleAttributeScaling(
  index: number,
  modifier: StatusModifierDefinitionMap['susceptibility'],
  enabled: boolean,
): void {
  const next = { ...modifier };
  if (enabled) next.attributeScaling = { attribute: 'strength', coefficient: 0 };
  else delete next.attributeScaling;
  replaceModifier(index, next);
}

function setScalingAttribute(
  index: number,
  modifier: StatusModifierDefinitionMap['susceptibility'],
  event: Event,
): void {
  if (modifier.attributeScaling === undefined) return;
  const attribute = (event.target as HTMLSelectElement).value as OperatorAttribute;
  if (!OPERATOR_ATTRIBUTES.includes(attribute)) return;
  replaceModifier(index, {
    ...modifier,
    attributeScaling: { ...modifier.attributeScaling, attribute },
  });
}

function setScalingCoefficient(
  index: number,
  modifier: StatusModifierDefinitionMap['susceptibility'],
  event: Event,
): void {
  if (modifier.attributeScaling === undefined) return;
  const value = finiteNumber(event);
  if (value === undefined) return;
  replaceModifier(index, {
    ...modifier,
    attributeScaling: {
      ...modifier.attributeScaling,
      coefficient: replaceLevelValueForEditor(
        modifier.attributeScaling.coefficient,
        props.skillLevel,
        value / 100,
      ),
    },
  });
}

function toggleCap(
  index: number,
  modifier: StatusModifierDefinitionMap['susceptibility'],
  enabled: boolean,
): void {
  const next = { ...modifier };
  if (enabled) next.cap = 1;
  else delete next.cap;
  replaceModifier(index, next);
}
</script>

<template>
  <fieldset class="status-modifiers">
    <legend>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.statusModifiers')"
        :help="t('timeline.skillEditing.fieldHelp.statusModifiers')"
      />
    </legend>
    <article v-for="(modifier, index) in modifiers" :key="index" class="status-modifier">
      <header>
        <strong>{{ t('timeline.skillEditing.statusModifierItem', { index: index + 1 }) }}</strong>
        <button
          type="button"
          :title="t('timeline.skillEditing.deleteStatusModifier')"
          @click="removeModifier(index)"
        >
          ×
        </button>
      </header>
      <div class="step-editor__grid">
        <label>
          <EditorFieldLabel
            :label="t('timeline.skillEditing.statusModifierKind')"
            :help="t('timeline.skillEditing.fieldHelp.statusModifierKind')"
          />
          <select :value="modifier.kind" @change="setKind(index, $event)">
            <option v-for="kind in STATUS_MODIFIER_KINDS" :key="kind" :value="kind">
              {{ t(`timeline.skillEditing.statusModifierKinds.${kind}`) }}
            </option>
          </select>
        </label>

        <label v-if="modifier.kind === 'attackPercent'">
          <EditorFieldLabel
            :label="t('timeline.skillEditing.percentValue')"
            :help="t('timeline.skillEditing.fieldHelp.statusPercentValue')"
          />
          <input
            type="number"
            step="0.01"
            :value="currentLevelValue(modifier.value) * 100"
            @input="setLevelValue(index, modifier, $event)"
          />
        </label>

        <template v-else-if="modifier.kind === 'susceptibility'">
          <label>
            <EditorFieldLabel
              :label="t('timeline.skillEditing.percentValue')"
              :help="t('timeline.skillEditing.fieldHelp.susceptibilityValue')"
            />
            <input
              type="number"
              step="0.01"
              :value="currentLevelValue(modifier.value) * 100"
              @input="setLevelValue(index, modifier, $event)"
            />
          </label>
          <fieldset class="status-modifier__types">
            <legend>{{ t('timeline.skillEditing.damageTypesLabel') }}</legend>
            <label v-for="damageType in DAMAGE_TYPES" :key="damageType" class="step-editor__check">
              <input
                type="checkbox"
                :checked="modifier.damageTypes.includes(damageType)"
                @change="toggleDamageType(index, modifier, damageType)"
              />
              <span>{{ t(`timeline.skillEditing.damageTypes.${damageType}`) }}</span>
            </label>
          </fieldset>
          <label class="step-editor__check step-editor__check--field">
            <input
              type="checkbox"
              :checked="modifier.attributeScaling !== undefined"
              @change="
                toggleAttributeScaling(index, modifier, ($event.target as HTMLInputElement).checked)
              "
            />
            <EditorFieldLabel
              :label="t('timeline.skillEditing.attributeScaling')"
              :help="t('timeline.skillEditing.fieldHelp.attributeScaling')"
            />
          </label>
          <template v-if="modifier.attributeScaling !== undefined">
            <label>
              <span>{{ t('timeline.skillEditing.attribute') }}</span>
              <select
                :value="modifier.attributeScaling.attribute"
                @change="setScalingAttribute(index, modifier, $event)"
              >
                <option
                  v-for="attribute in OPERATOR_ATTRIBUTES"
                  :key="attribute"
                  :value="attribute"
                >
                  {{ t(`timeline.skillEditing.attributes.${attribute}`) }}
                </option>
              </select>
            </label>
            <label>
              <EditorFieldLabel
                :label="t('timeline.skillEditing.scalingCoefficient')"
                :help="t('timeline.skillEditing.fieldHelp.scalingCoefficient')"
              />
              <input
                type="number"
                step="0.01"
                :value="currentLevelValue(modifier.attributeScaling.coefficient) * 100"
                @input="setScalingCoefficient(index, modifier, $event)"
              />
            </label>
          </template>
          <label class="step-editor__check step-editor__check--field">
            <input
              type="checkbox"
              :checked="modifier.cap !== undefined"
              @change="toggleCap(index, modifier, ($event.target as HTMLInputElement).checked)"
            />
            <EditorFieldLabel
              :label="t('timeline.skillEditing.enableCap')"
              :help="t('timeline.skillEditing.fieldHelp.susceptibilityCap')"
            />
          </label>
          <label v-if="modifier.cap !== undefined">
            <span>{{ t('timeline.skillEditing.cap') }}</span>
            <input
              type="number"
              step="0.01"
              :value="currentLevelValue(modifier.cap) * 100"
              @input="setCap(index, modifier, $event)"
            />
          </label>
        </template>

        <label
          v-else-if="
            modifier.kind === 'blockResourceGain' || modifier.kind === 'resourceCostMultiplier'
          "
        >
          <span>{{ t('timeline.skillEditing.resource') }}</span>
          <select :value="modifier.resource" @change="setResource(index, modifier, $event)">
            <option v-for="resource in COMBAT_RESOURCES" :key="resource" :value="resource">
              {{ resource }}
            </option>
          </select>
        </label>
        <label v-if="modifier.kind === 'resourceCostMultiplier'">
          <EditorFieldLabel
            :label="t('timeline.skillEditing.multiplier')"
            :help="t('timeline.skillEditing.fieldHelp.resourceCostMultiplier')"
          />
          <input
            type="number"
            step="0.01"
            :value="modifier.value"
            @input="setMultiplier(index, modifier, $event)"
          />
        </label>
        <template v-else-if="modifier.kind === 'skillCooldownMultiplier'">
          <label>
            <EditorFieldLabel
              :label="t('timeline.skillEditing.skillGroupKey')"
              :help="t('timeline.skillEditing.fieldHelp.skillGroupKey')"
            />
            <input
              type="text"
              :value="modifier.skillGroupKey"
              @input="setSkillGroupKey(index, modifier, $event)"
            />
          </label>
          <label>
            <EditorFieldLabel
              :label="t('timeline.skillEditing.multiplier')"
              :help="t('timeline.skillEditing.fieldHelp.cooldownMultiplier')"
            />
            <input
              type="number"
              step="0.01"
              :value="modifier.value"
              @input="setMultiplier(index, modifier, $event)"
            />
          </label>
        </template>
        <p v-else-if="modifier.kind === 'slowed'" class="status-modifier__note">
          {{ t('timeline.skillEditing.slowedNoParameters') }}
        </p>
      </div>
    </article>
    <button type="button" class="status-modifiers__add" @click="addModifier">
      + {{ t('timeline.skillEditing.addStatusModifier') }}
    </button>
  </fieldset>
</template>

<style scoped>
.status-modifier {
  margin-bottom: 10px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-panel, #232326);
}

.status-modifier > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  padding: 0 10px;
  border-bottom: 1px solid var(--ea-border-soft);
}

.status-modifier > header button,
.status-modifiers__add {
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  cursor: pointer;
}

.status-modifier > header button {
  width: 26px;
  height: 24px;
}

.status-modifier__types {
  grid-column: 1 / -1;
  margin: 0 !important;
}

.status-modifier__note {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--ea-fg-muted);
}

.status-modifiers__add {
  min-height: 30px;
  padding: 0 12px;
}
</style>
