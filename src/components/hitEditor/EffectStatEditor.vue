<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ATTRIBUTES,
  ATTRIBUTE_STAT_MODIFIERS,
  DAMAGE_ELEMENTS,
  ELEMENT_SCOPED_STAT_MODIFIERS,
  ENEMY_STAT_MODIFIERS,
  OPERATOR_STAT_MODIFIERS,
  SKILL_SCOPED_STAT_MODIFIERS,
  SKILL_TYPE_SCOPES,
} from '@/data/enums';
import { getGameAttributeName, getGameElementName } from '@/data/gameText';

const props = defineProps({
  modelValue: { default: undefined },
});

const emit = defineEmits(['update:modelValue']);
const { t, locale } = useI18n({ useScope: 'global' });

const NONE = '';

const STAT_NAME_ALIASES = Object.freeze({
  atkFlat: 'flatAtk',
  cooldownReductionFlat: 'cooldownReduction',
  ultimateEnergyCostReduction: 'ultimateEnergyCostPercent',
});

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function asList(value) {
  if (value == null || value === '') return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function buildStat(modifier, seed = {}) {
  const next = { modifier };
  if (ELEMENT_SCOPED_STAT_MODIFIERS.includes(modifier)) {
    const elements = asList(seed?.elements);
    if (elements.length) next.elements = elements.length === 1 ? elements[0] : elements;
  }
  if (SKILL_SCOPED_STAT_MODIFIERS.includes(modifier)) {
    const skillTypes = asList(seed?.skillTypes);
    if (skillTypes.length) {
      next.skillTypes = skillTypes.length === 1 ? skillTypes[0] : skillTypes;
    }
    if (typeof seed?.skillId === 'string' && seed.skillId.trim()) {
      next.skillId = seed.skillId.trim();
    }
  }
  if (ATTRIBUTE_STAT_MODIFIERS.includes(modifier)) {
    next.attribute =
      typeof seed?.attribute === 'string' && seed.attribute ? seed.attribute : 'main';
  }
  return next;
}

const modifierValue = computed({
  get() {
    return isPlainObject(props.modelValue) ? props.modelValue.modifier || NONE : NONE;
  },
  set(next) {
    if (!next) {
      emit('update:modelValue', undefined);
      return;
    }
    emit('update:modelValue', buildStat(next, props.modelValue));
  },
});

const elementValues = computed({
  get() {
    return asList(isPlainObject(props.modelValue) ? props.modelValue.elements : null);
  },
  set(next) {
    patchScope('elements', next);
  },
});

const skillTypeValues = computed({
  get() {
    return asList(isPlainObject(props.modelValue) ? props.modelValue.skillTypes : null);
  },
  set(next) {
    patchScope('skillTypes', next);
  },
});

const attributeValue = computed({
  get() {
    const attr = isPlainObject(props.modelValue) ? props.modelValue.attribute : '';
    return typeof attr === 'string' ? attr : '';
  },
  set(next) {
    if (!modifierValue.value) return;
    emit(
      'update:modelValue',
      buildStat(modifierValue.value, {
        ...props.modelValue,
        attribute: next || 'main',
      }),
    );
  },
});

const showElements = computed(() =>
  ELEMENT_SCOPED_STAT_MODIFIERS.includes(modifierValue.value),
);
const showSkillScope = computed(() =>
  SKILL_SCOPED_STAT_MODIFIERS.includes(modifierValue.value),
);
const showAttribute = computed(() =>
  ATTRIBUTE_STAT_MODIFIERS.includes(modifierValue.value),
);

function patchScope(key, raw) {
  if (!modifierValue.value) return;
  const seed = { ...(isPlainObject(props.modelValue) ? props.modelValue : {}) };
  const list = asList(raw);
  if (list.length) seed[key] = list;
  else delete seed[key];
  emit('update:modelValue', buildStat(modifierValue.value, seed));
}

function modifierLabel(value) {
  const nameKey = STAT_NAME_ALIASES[value] || value;
  const key = `effects.name.${nameKey}`;
  const out = t(key);
  return out === key ? value : out;
}

function skillTypeLabel(value) {
  const key = `hitEditor.skillTypes.${value}`;
  const out = t(key);
  return out === key ? value : out;
}
</script>

<template>
  <div class="structured-block">
    <div class="field-grid field-grid--effect-select-row">
      <label class="field">
        <span>{{ t('hitEditor.fields.stat') }}</span>
        <el-select
          :model-value="modifierValue"
          @update:model-value="value => (modifierValue = value)"
          size="small"
          clearable
          filterable
          class="effect-select-dark"
          popper-class="hit-editor-select-popper"
        >
          <el-option :value="NONE" :label="t('common.none')" />
          <el-option-group :label="t('hitEditor.statGroups.enemy')">
            <el-option
              v-for="mod in ENEMY_STAT_MODIFIERS"
              :key="mod"
              :value="mod"
              :label="modifierLabel(mod)"
            />
          </el-option-group>
          <el-option-group :label="t('hitEditor.statGroups.operator')">
            <el-option
              v-for="mod in OPERATOR_STAT_MODIFIERS"
              :key="mod"
              :value="mod"
              :label="modifierLabel(mod)"
            />
          </el-option-group>
        </el-select>
      </label>
      <label v-if="showAttribute" class="field">
        <span>{{ t('hitEditor.fields.attribute') }}</span>
        <el-select
          :model-value="attributeValue"
          @update:model-value="value => (attributeValue = value)"
          size="small"
          class="effect-select-dark"
          popper-class="hit-editor-select-popper"
        >
          <el-option
            v-for="attr in ATTRIBUTES"
            :key="attr"
            :value="attr"
            :label="getGameAttributeName(attr, locale)"
          />
        </el-select>
      </label>
      <label v-if="showElements" class="field">
        <span>{{ t('common.element') }}</span>
        <el-select
          :model-value="elementValues"
          @update:model-value="value => (elementValues = value)"
          size="small"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          class="effect-select-dark"
          popper-class="hit-editor-select-popper"
        >
          <el-option
            v-for="element in DAMAGE_ELEMENTS"
            :key="element"
            :value="element"
            :label="getGameElementName(element, locale)"
          />
        </el-select>
      </label>
      <label v-if="showSkillScope" class="field">
        <span>{{ t('hitEditor.fields.skillTypes') }}</span>
        <el-select
          :model-value="skillTypeValues"
          @update:model-value="value => (skillTypeValues = value)"
          size="small"
          multiple
          collapse-tags
          collapse-tags-tooltip
          clearable
          class="effect-select-dark"
          popper-class="hit-editor-select-popper"
        >
          <el-option
            v-for="skill in SKILL_TYPE_SCOPES"
            :key="skill"
            :value="skill"
            :label="skillTypeLabel(skill)"
          />
        </el-select>
      </label>
    </div>
  </div>
</template>

<style scoped>
.structured-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-grid {
  display: grid;
  gap: 10px;
}

.field-grid--effect-select-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.field {
  color: #cfd3dc;
  display: flex;
  flex-direction: column;
  font-size: 11px;
  gap: 5px;
  min-width: 0;
}

.effect-select-dark {
  width: 100%;
}
</style>
