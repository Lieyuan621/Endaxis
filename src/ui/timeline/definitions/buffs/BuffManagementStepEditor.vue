<script setup lang="ts">
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
import type { GameplayTag } from '../../../../../packages/game-data-contract/src/gameplayTags';
import { GAMEPLAY_TAG_QUERY_TYPES } from '../../../../../packages/game-data-contract/src/gameplayTags';

/**
 * Buff 查询、读取、结束与保留步骤的参数编辑器。
 *
 * Buff 身份列表和原生标签查询共用相同的文本投影规则。表单只把数组临时显示为
 * 逗号分隔文本，更新时立即恢复为类型化数组，不改变 SkillDefinition 的持久结构。
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  COMBAT_TARGETS,
  type CombatStepDefinition,
  type CombatTarget,
} from '../../../../core/game-data/operatorDefinition';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';
import GameplayTagsEditor from '../inspector/GameplayTagsEditor.vue';

type BuffManagementStep = CombatStepForKind<
  | 'readBuffBlackboard'
  | 'readBuffStackCount'
  | 'finishBuffsByTag'
  | 'finishBuffsById'
  | 'holdBuffsById'
>;
type QueryType = (typeof GAMEPLAY_TAG_QUERY_TYPES)[number];
type FinishReason = 'early' | 'absorbed' | 'other';
type ReadStep = CombatStepForKind<'readBuffBlackboard' | 'readBuffStackCount'>;

const TAG_QUERY_TYPES = GAMEPLAY_TAG_QUERY_TYPES satisfies readonly QueryType[];
const FINISH_REASONS = ['early', 'absorbed', 'other'] as const satisfies readonly FinishReason[];

const props = defineProps<{ step: BuffManagementStep }>();
const emit = defineEmits<{ update: [step: CombatStepDefinition] }>();
const { t } = useI18n({ useScope: 'global' });

const usesQuery = computed(
  () => props.step.kind === 'readBuffBlackboard' || props.step.kind === 'readBuffStackCount',
);
const queryKind = computed<'id' | 'tag' | 'environment'>(() => {
  if (!usesQuery.value) return props.step.kind === 'finishBuffsByTag' ? 'tag' : 'id';
  return (props.step as ReadStep).parameters.query.kind;
});
const readQuery = computed(() => {
  if (props.step.kind === 'readBuffBlackboard' || props.step.kind === 'readBuffStackCount') {
    return props.step.parameters.query;
  }
  return undefined;
});
const readBuffIdsText = computed(() =>
  readQuery.value?.kind === 'id' ? readQuery.value.buffIds.join(', ') : '',
);
const readTagQueryType = computed(() =>
  readQuery.value?.kind === 'tag' ? readQuery.value.tagQueryType : 'hasAny',
);
const readOutputKey = computed(() => {
  if (props.step.kind === 'readBuffBlackboard' || props.step.kind === 'readBuffStackCount') {
    return props.step.parameters.outputKey;
  }
  return '';
});
const directBuffIdsText = computed(() => {
  if (props.step.kind === 'finishBuffsById' || props.step.kind === 'holdBuffsById') {
    return props.step.parameters.buffIds.join(', ');
  }
  return '';
});

function update(step: BuffManagementStep): void {
  emit('update', step);
}

function parseStringList(value: string): readonly string[] {
  return value
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function setTarget(event: Event): void {
  if (props.step.kind === 'holdBuffsById') return;
  const target = (event.target as HTMLSelectElement).value as CombatTarget;
  if (!COMBAT_TARGETS.includes(target)) return;
  update({ ...props.step, parameters: { ...props.step.parameters, target } } as BuffManagementStep);
}

function setQueryKind(event: Event): void {
  if (!usesQuery.value) return;
  const kind = (event.target as HTMLSelectElement).value as 'id' | 'tag';
  if (kind !== 'id' && kind !== 'tag') return;
  const query =
    kind === 'id'
      ? { kind: 'id' as const, buffIds: ['custom-buff'] }
      : { kind: 'tag' as const, tagQueryType: 'hasAny' as const, buffTags: ['Custom/Tag'] };
  if (props.step.kind === 'readBuffBlackboard') {
    update({ ...props.step, parameters: { ...props.step.parameters, query } });
  } else if (props.step.kind === 'readBuffStackCount') {
    update({ ...props.step, parameters: { ...props.step.parameters, query } });
  }
}

function setReadBuffIds(event: Event): void {
  if (!usesQuery.value) return;
  const buffIds = parseStringList((event.target as HTMLTextAreaElement).value);
  if (buffIds.length === 0) return;
  if (props.step.kind === 'readBuffBlackboard') {
    if (props.step.parameters.query.kind !== 'id') return;
    update({
      ...props.step,
      parameters: { ...props.step.parameters, query: { kind: 'id', buffIds } },
    });
  } else if (props.step.kind === 'readBuffStackCount') {
    if (props.step.parameters.query.kind !== 'id') return;
    update({
      ...props.step,
      parameters: { ...props.step.parameters, query: { kind: 'id', buffIds } },
    });
  }
}

function setReadTags(buffTags: readonly GameplayTag[]): void {
  if (!usesQuery.value) return;
  if (props.step.kind === 'readBuffBlackboard') {
    if (props.step.parameters.query.kind !== 'tag') return;
    update({
      ...props.step,
      parameters: {
        ...props.step.parameters,
        query: { ...props.step.parameters.query, buffTags },
      },
    });
  } else if (props.step.kind === 'readBuffStackCount') {
    if (props.step.parameters.query.kind !== 'tag') return;
    update({
      ...props.step,
      parameters: {
        ...props.step.parameters,
        query: { ...props.step.parameters.query, buffTags },
      },
    });
  }
}

function setReadQueryType(event: Event): void {
  if (!usesQuery.value) return;
  const tagQueryType = (event.target as HTMLSelectElement).value as QueryType;
  if (!TAG_QUERY_TYPES.includes(tagQueryType)) return;
  if (props.step.kind === 'readBuffBlackboard') {
    if (props.step.parameters.query.kind !== 'tag') return;
    update({
      ...props.step,
      parameters: {
        ...props.step.parameters,
        query: { ...props.step.parameters.query, tagQueryType },
      },
    });
  } else if (props.step.kind === 'readBuffStackCount') {
    if (props.step.parameters.query.kind !== 'tag') return;
    update({
      ...props.step,
      parameters: {
        ...props.step.parameters,
        query: { ...props.step.parameters.query, tagQueryType },
      },
    });
  }
}

function setReadKey(field: 'desiredKey' | 'outputKey', event: Event): void {
  if (!usesQuery.value) return;
  const value = (event.target as HTMLInputElement).value;
  if (field === 'desiredKey') {
    if (props.step.kind !== 'readBuffBlackboard') return;
    update({ ...props.step, parameters: { ...props.step.parameters, desiredKey: value } });
    return;
  }
  if (props.step.kind === 'readBuffBlackboard') {
    update({ ...props.step, parameters: { ...props.step.parameters, outputKey: value } });
  } else if (props.step.kind === 'readBuffStackCount') {
    update({ ...props.step, parameters: { ...props.step.parameters, outputKey: value } });
  }
}

function setDirectBuffIds(event: Event): void {
  if (props.step.kind !== 'finishBuffsById' && props.step.kind !== 'holdBuffsById') return;
  const buffIds = parseStringList((event.target as HTMLTextAreaElement).value);
  if (buffIds.length === 0) return;
  if (props.step.kind === 'finishBuffsById') {
    update({ ...props.step, parameters: { ...props.step.parameters, buffIds } });
  } else if (props.step.kind === 'holdBuffsById') {
    update({ ...props.step, parameters: { ...props.step.parameters, buffIds } });
  }
}

function setDirectTags(buffTags: readonly GameplayTag[]): void {
  if (props.step.kind !== 'finishBuffsByTag') return;
  update({ ...props.step, parameters: { ...props.step.parameters, buffTags } });
}

function setDirectQueryType(event: Event): void {
  if (props.step.kind !== 'finishBuffsByTag') return;
  const tagQueryType = (event.target as HTMLSelectElement).value as QueryType;
  if (!TAG_QUERY_TYPES.includes(tagQueryType)) return;
  update({ ...props.step, parameters: { ...props.step.parameters, tagQueryType } });
}

function setReason(event: Event): void {
  if (props.step.kind !== 'finishBuffsById' && props.step.kind !== 'finishBuffsByTag') return;
  const reason = (event.target as HTMLSelectElement).value as FinishReason;
  if (!FINISH_REASONS.includes(reason)) return;
  if (props.step.kind === 'finishBuffsById') {
    update({ ...props.step, parameters: { ...props.step.parameters, reason } });
  } else if (props.step.kind === 'finishBuffsByTag') {
    update({ ...props.step, parameters: { ...props.step.parameters, reason } });
  }
}
</script>

<template>
  <div class="step-editor__grid">
    <label>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.target')"
        :help="t('timeline.skillEditing.fieldHelp.buffManagementTarget')"
      />
      <select
        v-if="step.kind !== 'holdBuffsById'"
        :value="step.parameters.target"
        @change="setTarget"
      >
        <option v-for="target in COMBAT_TARGETS" :key="target" :value="target">
          {{ t(`timeline.skillEditing.targets.${target}`) }}
        </option>
      </select>
      <em v-else>{{ t('timeline.skillEditing.targets.caster') }}</em>
    </label>

    <label v-if="usesQuery">
      <EditorFieldLabel
        :label="t('timeline.skillEditing.buffQueryKind')"
        :help="t('timeline.skillEditing.fieldHelp.buffQueryKind')"
      />
      <select :value="queryKind" @change="setQueryKind">
        <option value="id">{{ t('timeline.skillEditing.buffQueryKinds.id') }}</option>
        <option value="tag">{{ t('timeline.skillEditing.buffQueryKinds.tag') }}</option>
        <option value="environment" disabled>
          {{ t('timeline.skillEditing.buffQueryKinds.environment') }}
        </option>
      </select>
    </label>

    <template v-if="usesQuery">
      <label v-if="queryKind === 'id'" class="step-editor__wide">
        <EditorFieldLabel
          :label="t('timeline.skillEditing.buffIds')"
          :help="t('timeline.skillEditing.fieldHelp.buffIds')"
        />
        <textarea :value="readBuffIdsText" @change="setReadBuffIds" />
      </label>
      <template v-else-if="queryKind === 'tag'">
        <label>
          <EditorFieldLabel
            :label="t('timeline.skillEditing.tagQueryType')"
            :help="t('timeline.skillEditing.fieldHelp.tagQueryType')"
          />
          <select :value="readTagQueryType" @change="setReadQueryType">
            <option v-for="type in TAG_QUERY_TYPES" :key="type" :value="type">
              {{ t(`timeline.skillEditing.tagQueryTypes.${type}`) }}
            </option>
          </select>
        </label>
        <label>
          <EditorFieldLabel
            :label="t('timeline.skillEditing.buffTags')"
            :help="t('timeline.skillEditing.fieldHelp.buffTags')"
          />
          <GameplayTagsEditor
            :tags="readQuery?.kind === 'tag' ? readQuery.buffTags : []"
            @update="setReadTags"
          />
        </label>
      </template>
      <label v-if="step.kind === 'readBuffBlackboard'">
        <EditorFieldLabel
          :label="t('timeline.skillEditing.desiredKey')"
          :help="t('timeline.skillEditing.fieldHelp.desiredKey')"
        />
        <input
          type="text"
          :value="step.parameters.desiredKey"
          @input="setReadKey('desiredKey', $event)"
        />
      </label>
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.outputKey')"
          :help="t('timeline.skillEditing.fieldHelp.buffOutputKey')"
        />
        <input type="text" :value="readOutputKey" @input="setReadKey('outputKey', $event)" />
      </label>
    </template>

    <template v-else-if="step.kind === 'finishBuffsByTag'">
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.tagQueryType')"
          :help="t('timeline.skillEditing.fieldHelp.tagQueryType')"
        />
        <select :value="step.parameters.tagQueryType" @change="setDirectQueryType">
          <option v-for="type in TAG_QUERY_TYPES" :key="type" :value="type">
            {{ t(`timeline.skillEditing.tagQueryTypes.${type}`) }}
          </option>
        </select>
      </label>
      <label>
        <EditorFieldLabel
          :label="t('timeline.skillEditing.buffTags')"
          :help="t('timeline.skillEditing.fieldHelp.buffTags')"
        />
        <GameplayTagsEditor :tags="step.parameters.buffTags" @update="setDirectTags" />
      </label>
    </template>

    <label v-else class="step-editor__wide">
      <EditorFieldLabel
        :label="t('timeline.skillEditing.buffIds')"
        :help="t('timeline.skillEditing.fieldHelp.buffIds')"
      />
      <textarea :value="directBuffIdsText" @change="setDirectBuffIds" />
    </label>

    <label v-if="step.kind === 'finishBuffsById' || step.kind === 'finishBuffsByTag'">
      <EditorFieldLabel
        :label="t('timeline.skillEditing.finishReason')"
        :help="t('timeline.skillEditing.fieldHelp.finishReason')"
      />
      <select :value="step.parameters.reason" @change="setReason">
        <option v-for="reason in FINISH_REASONS" :key="reason" :value="reason">
          {{ t(`timeline.skillEditing.finishReasons.${reason}`) }}
        </option>
      </select>
    </label>
  </div>
</template>

<style scoped>
.step-editor__wide {
  grid-column: 1 / -1;
}
textarea {
  min-width: 0;
  width: 100%;
  min-height: 54px;
  box-sizing: border-box;
  resize: vertical;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  padding: 6px;
}
</style>
