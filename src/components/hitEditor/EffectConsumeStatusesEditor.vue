<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  collectStatusOptions,
  KNOWN_ENEMY_STATUS_KEYS,
  translateEffectName,
} from '@/editor/hits/statusOptions';

const props = defineProps({
  operatorStatus: { default: undefined },
  enemyStatus: { default: undefined },
  operatorStatusOptions: { type: Array, default: () => [] },
  operatorStatusNameById: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['update:operatorStatus', 'update:enemyStatus']);
const { t, te } = useI18n({ useScope: 'global' });

function splitStatusValue(value) {
  const strings = [];
  const others = [];
  const list = value == null ? [] : Array.isArray(value) ? value : [value];
  for (const item of list) {
    if (typeof item === 'string' && item.trim()) strings.push(item.trim());
    else if (item != null) others.push(item);
  }
  return { strings, others };
}

function mergeStatusValue(strings, others) {
  const next = [...strings, ...others];
  if (!next.length) return undefined;
  if (next.length === 1) return next[0];
  return next;
}

const operatorParts = computed(() => splitStatusValue(props.operatorStatus));
const enemyParts = computed(() => splitStatusValue(props.enemyStatus));

const operatorKeys = computed({
  get: () => operatorParts.value.strings,
  set(next) {
    emit(
      'update:operatorStatus',
      mergeStatusValue(
        (Array.isArray(next) ? next : []).map(item => String(item || '').trim()).filter(Boolean),
        operatorParts.value.others,
      ),
    );
  },
});

const enemyKeys = computed({
  get: () => enemyParts.value.strings,
  set(next) {
    emit(
      'update:enemyStatus',
      mergeStatusValue(
        (Array.isArray(next) ? next : []).map(item => String(item || '').trim()).filter(Boolean),
        enemyParts.value.others,
      ),
    );
  },
});

const operatorOptions = computed(() =>
  collectStatusOptions(props.operatorStatusOptions, operatorKeys.value),
);

const enemyOptions = computed(() =>
  collectStatusOptions(KNOWN_ENEMY_STATUS_KEYS, enemyKeys.value),
);

function statusLabel(value) {
  return translateEffectName(t, te, value, props.operatorStatusNameById);
}
</script>

<template>
  <div class="structured-block">
    <div class="field-grid field-grid--effect-select-row">
      <label class="field">
        <span>{{ t('hitEditor.fields.operatorStatus') }}</span>
        <el-select
          :model-value="operatorKeys"
          @update:model-value="value => (operatorKeys = value)"
          size="small"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          clearable
          class="effect-select-dark"
          popper-class="hit-editor-select-popper"
        >
          <el-option
            v-for="status in operatorOptions"
            :key="status"
            :value="status"
            :label="statusLabel(status)"
          />
        </el-select>
      </label>
      <label class="field">
        <span>{{ t('hitEditor.fields.enemyStatus') }}</span>
        <el-select
          :model-value="enemyKeys"
          @update:model-value="value => (enemyKeys = value)"
          size="small"
          multiple
          filterable
          collapse-tags
          collapse-tags-tooltip
          clearable
          class="effect-select-dark"
          popper-class="hit-editor-select-popper"
        >
          <el-option
            v-for="status in enemyOptions"
            :key="status"
            :value="status"
            :label="statusLabel(status)"
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
