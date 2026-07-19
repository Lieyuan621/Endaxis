<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CustomNumberInput from '../CustomNumberInput.vue';
import {
  EFFECT_CONDITION_KINDS,
  HP_COMPARES,
  STACKS_COMPARES,
} from '@/data/enums';
import {
  collectStatusOptions,
  KNOWN_ENEMY_STATUS_KEYS,
  translateEffectName,
} from '@/editor/hits/statusOptions';

const props = defineProps({
  modelValue: { default: undefined },
  label: { type: String, default: '' },
  operatorStatusOptions: { type: Array, default: () => [] },
  operatorStatusNameById: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['update:modelValue']);
const { t, te } = useI18n({ useScope: 'global' });

const NONE = '';
const STATUS_KINDS = new Set(['enemyStatus', 'operatorStatus']);
const HP_KINDS = new Set(['enemyHp', 'operatorHp']);
const SIMPLE_KINDS = EFFECT_CONDITION_KINDS.filter(kind => kind !== 'not' && kind !== 'or');

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isEditableCondition(value) {
  if (value == null) return true;
  if (!isPlainObject(value) || !value.kind) return false;
  if (!SIMPLE_KINDS.includes(value.kind)) return false;
  if (STATUS_KINDS.has(value.kind) && typeof value.status !== 'string') return false;
  if (value.consume != null && typeof value.consume !== 'boolean') return false;
  return true;
}

function createCondition(kind, seed = {}) {
  if (STATUS_KINDS.has(kind)) {
    const fallback =
      kind === 'enemyStatus'
        ? KNOWN_ENEMY_STATUS_KEYS[0]
        : props.operatorStatusOptions[0] || 'status';
    const next = {
      kind,
      status:
        typeof seed?.status === 'string' && seed.status.trim()
          ? seed.status.trim()
          : fallback,
    };
    if (seed?.stacks) next.stacks = seed.stacks;
    if (seed?.consume === true) next.consume = true;
    if (kind === 'operatorStatus') {
      if (seed?.target === 'controlled') next.target = 'controlled';
      if (seed?.consumeScope === 'team') next.consumeScope = 'team';
    }
    return next;
  }
  if (HP_KINDS.has(kind)) {
    return {
      kind,
      compare: seed?.compare === 'above' ? 'above' : 'below',
      percent: Number(seed?.percent) || 50,
    };
  }
  return { kind };
}

const editableValue = computed(() =>
  isEditableCondition(props.modelValue) ? props.modelValue : undefined,
);

const heading = computed(() => props.label || t('hitEditor.fields.condition'));

const kindValue = computed({
  get() {
    return isPlainObject(editableValue.value) ? editableValue.value.kind || NONE : NONE;
  },
  set(next) {
    if (!next) {
      emit('update:modelValue', undefined);
      return;
    }
    emit('update:modelValue', createCondition(next, editableValue.value));
  },
});

const statusValue = computed({
  get() {
    return isPlainObject(editableValue.value) && typeof editableValue.value.status === 'string'
      ? editableValue.value.status
      : '';
  },
  set(next) {
    const text = String(next || '').trim();
    if (!text) return;
    patchCondition({ status: text });
  },
});

const statusSelectOptions = computed(() => {
  if (kindValue.value === 'enemyStatus') {
    return collectStatusOptions(KNOWN_ENEMY_STATUS_KEYS, [], statusValue.value);
  }
  if (kindValue.value === 'operatorStatus') {
    return collectStatusOptions([], props.operatorStatusOptions, statusValue.value);
  }
  return [];
});

const stacksEnabled = computed({
  get() {
    return !!editableValue.value?.stacks;
  },
  set(enabled) {
    if (!enabled) {
      patchCondition({ stacks: undefined });
      return;
    }
    patchCondition({
      stacks: editableValue.value?.stacks || { compare: 'atLeast', count: 1 },
    });
  },
});

const stacksCompare = computed({
  get() {
    return editableValue.value?.stacks?.compare || 'atLeast';
  },
  set(next) {
    patchCondition({
      stacks: {
        compare: next || 'atLeast',
        count: Number(editableValue.value?.stacks?.count) || 1,
      },
    });
  },
});

const stacksCount = computed({
  get() {
    return Number(editableValue.value?.stacks?.count) || 1;
  },
  set(next) {
    patchCondition({
      stacks: {
        compare: editableValue.value?.stacks?.compare || 'atLeast',
        count: Number(next) || 1,
      },
    });
  },
});

const consumeAll = computed({
  get() {
    return editableValue.value?.consume === true;
  },
  set(enabled) {
    patchCondition({ consume: enabled ? true : undefined });
  },
});

const operatorTarget = computed({
  get() {
    return editableValue.value?.target || 'self';
  },
  set(next) {
    patchCondition({ target: next === 'controlled' ? 'controlled' : undefined });
  },
});

const hpCompare = computed({
  get() {
    return editableValue.value?.compare || 'below';
  },
  set(next) {
    patchCondition({
      compare: next || 'below',
      percent: Number(editableValue.value?.percent) || 50,
    });
  },
});

const hpPercent = computed({
  get() {
    return Number(editableValue.value?.percent) || 50;
  },
  set(next) {
    patchCondition({
      compare: editableValue.value?.compare || 'below',
      percent: Number(next) || 0,
    });
  },
});

function patchCondition(patch) {
  if (!kindValue.value) return;
  const base = createCondition(kindValue.value, {
    ...(isPlainObject(editableValue.value) ? editableValue.value : {}),
    ...patch,
  });
  if (Object.prototype.hasOwnProperty.call(patch, 'stacks') && patch.stacks === undefined) {
    delete base.stacks;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'consume') && patch.consume === undefined) {
    delete base.consume;
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'target') && patch.target === undefined) {
    delete base.target;
  }
  emit('update:modelValue', base);
}

function kindLabel(value) {
  const key = `hitEditor.conditionKinds.${value}`;
  const out = t(key);
  return out === key ? value : out;
}

function compareLabel(group, value) {
  const key = `hitEditor.${group}.${value}`;
  const out = t(key);
  return out === key ? value : out;
}

function statusLabel(value) {
  return translateEffectName(t, te, value, props.operatorStatusNameById);
}
</script>

<template>
  <div class="structured-block">
    <div class="field-grid field-grid--effect-select-row">
      <label class="field">
        <span>{{ heading }}</span>
        <el-select
          :model-value="kindValue"
          @update:model-value="value => (kindValue = value)"
          size="small"
          clearable
          class="effect-select-dark"
          popper-class="hit-editor-select-popper"
        >
          <el-option :value="NONE" :label="t('common.none')" />
          <el-option
            v-for="kind in SIMPLE_KINDS"
            :key="kind"
            :value="kind"
            :label="kindLabel(kind)"
          />
        </el-select>
      </label>
    </div>

    <template v-if="STATUS_KINDS.has(kindValue)">
      <div class="field-grid field-grid--effect-select-row">
        <label class="field">
          <span>{{ t('hitEditor.fields.conditionStatus') }}</span>
          <el-select
            :model-value="statusValue"
            @update:model-value="value => (statusValue = value)"
            size="small"
            filterable
            class="effect-select-dark"
            popper-class="hit-editor-select-popper"
          >
            <el-option
              v-for="status in statusSelectOptions"
              :key="status"
              :value="status"
              :label="statusLabel(status)"
            />
          </el-select>
        </label>
        <label v-if="kindValue === 'operatorStatus'" class="field">
          <span>{{ t('hitEditor.fields.conditionTarget') }}</span>
          <el-select
            :model-value="operatorTarget"
            @update:model-value="value => (operatorTarget = value)"
            size="small"
            class="effect-select-dark"
            popper-class="hit-editor-select-popper"
          >
            <el-option value="self" :label="t('hitEditor.targetScopes.self')" />
            <el-option value="controlled" :label="t('hitEditor.targetScopes.controlled')" />
          </el-select>
        </label>
      </div>
      <div class="field-grid field-grid--effect-check-row">
        <label class="check-field ea-check-rect">
          <input
            type="checkbox"
            :checked="stacksEnabled"
            @change="event => (stacksEnabled = event.target.checked)"
          />
          <span>{{ t('hitEditor.fields.conditionStacks') }}</span>
        </label>
        <label class="check-field ea-check-rect">
          <input
            type="checkbox"
            :checked="consumeAll"
            @change="event => (consumeAll = event.target.checked)"
          />
          <span>{{ t('hitEditor.fields.conditionConsume') }}</span>
        </label>
      </div>
      <div v-if="stacksEnabled" class="field-grid field-grid--effect-select-row">
        <label class="field">
          <span>{{ t('common.stacks') }}</span>
          <el-select
            :model-value="stacksCompare"
            @update:model-value="value => (stacksCompare = value)"
            size="small"
            class="effect-select-dark"
            popper-class="hit-editor-select-popper"
          >
            <el-option
              v-for="compare in STACKS_COMPARES"
              :key="compare"
              :value="compare"
              :label="compareLabel('stacksCompares', compare)"
            />
          </el-select>
        </label>
      </div>
      <div v-if="stacksEnabled" class="field-grid field-grid--effect-input-row">
        <label class="field">
          <span>{{ t('common.value') }}</span>
          <CustomNumberInput
            :model-value="stacksCount"
            @update:model-value="value => (stacksCount = value)"
            :min="1"
            :activeColor="'#ffd700'"
          />
        </label>
      </div>
    </template>

    <template v-else-if="HP_KINDS.has(kindValue)">
      <div class="field-grid field-grid--effect-select-row">
        <label class="field">
          <span>{{ t('hitEditor.fields.hpCompare') }}</span>
          <el-select
            :model-value="hpCompare"
            @update:model-value="value => (hpCompare = value)"
            size="small"
            class="effect-select-dark"
            popper-class="hit-editor-select-popper"
          >
            <el-option
              v-for="compare in HP_COMPARES"
              :key="compare"
              :value="compare"
              :label="compareLabel('hpCompares', compare)"
            />
          </el-select>
        </label>
      </div>
      <div class="field-grid field-grid--effect-input-row">
        <label class="field">
          <span>{{ t('hitEditor.fields.hpPercent') }}</span>
          <CustomNumberInput
            :model-value="hpPercent"
            @update:model-value="value => (hpPercent = value)"
            :min="0"
            :max="100"
            :activeColor="'#ffd700'"
          />
        </label>
      </div>
    </template>
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

.field-grid--effect-select-row,
.field-grid--effect-input-row,
.field-grid--effect-check-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.field,
.check-field {
  color: #cfd3dc;
  display: flex;
  flex-direction: column;
  font-size: 11px;
  gap: 5px;
  min-width: 0;
}

.check-field {
  align-items: center;
  flex-direction: row;
  min-height: 31px;
}

.effect-select-dark {
  width: 100%;
}
</style>
