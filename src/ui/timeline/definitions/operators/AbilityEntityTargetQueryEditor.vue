<script setup lang="ts">
import { ElIcon } from 'element-plus';
/**
 * 编辑生成期已经归约为实体身份或运行时 Context 的能力实体查询。
 *
 * 原生 born-tag 不进入生产 DSL；ownerSpawned 的可选 ID 列表是生成器已经用版本化
 * 模板证据求值后的结果。空 ID 列表不写入字段，表示查询当前 owner 生成的全部实体。
 */
import { Delete, Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type { AbilityEntityTargetQuery } from '../../../../core/game-data/operatorDefinition';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';

const props = defineProps<{
  queries: readonly AbilityEntityTargetQuery[];
}>();
const emit = defineEmits<{
  update: [queries: readonly AbilityEntityTargetQuery[]];
}>();
const { t } = useI18n({ useScope: 'global' });

function replaceQuery(index: number, query: AbilityEntityTargetQuery): void {
  if (props.queries[index] === undefined) return;
  const queries = [...props.queries];
  queries[index] = query;
  emit('update', queries);
}

function appendQuery(): void {
  emit('update', [...props.queries, { kind: 'ownerSpawned' }]);
}

function removeQuery(index: number): void {
  emit(
    'update',
    props.queries.filter((_, queryIndex) => queryIndex !== index),
  );
}

function setKind(index: number, event: Event): void {
  const kind = (event.target as HTMLSelectElement).value as AbilityEntityTargetQuery['kind'];
  replaceQuery(index, kind === 'context' ? { kind, contextKey: '' } : { kind });
}

function setContextKey(index: number, event: Event): void {
  const query = props.queries[index];
  if (query?.kind !== 'context') return;
  replaceQuery(index, { ...query, contextKey: (event.target as HTMLInputElement).value });
}

function setAbilityEntityIds(index: number, event: Event): void {
  const query = props.queries[index];
  if (query?.kind !== 'ownerSpawned') return;
  const abilityEntityIds = (event.target as HTMLTextAreaElement).value
    .split(/[\n,]/u)
    .map(value => value.trim())
    .filter(value => value.length > 0);
  replaceQuery(
    index,
    abilityEntityIds.length > 0 ? { ...query, abilityEntityIds } : { kind: 'ownerSpawned' },
  );
}
</script>

<template>
  <fieldset class="ability-entity-query-editor">
    <legend>
      <EditorFieldLabel
        :label="t('timeline.skillEditing.abilityEntityTimeDilationQueries')"
        :help="t('timeline.skillEditing.fieldHelp.abilityEntityTimeDilationQueries')"
      />
    </legend>

    <div v-for="(query, index) in queries" :key="index" class="ability-entity-query-editor__item">
      <label>
        <span>{{ t('timeline.skillEditing.abilityEntityQueryKind') }}</span>
        <select :value="query.kind" @change="setKind(index, $event)">
          <option value="ownerSpawned">
            {{ t('timeline.skillEditing.abilityEntityQueryKinds.ownerSpawned') }}
          </option>
          <option value="current">
            {{ t('timeline.skillEditing.abilityEntityQueryKinds.current') }}
          </option>
          <option value="context">
            {{ t('timeline.skillEditing.abilityEntityQueryKinds.context') }}
          </option>
        </select>
      </label>

      <label v-if="query.kind === 'context'">
        <span>{{ t('timeline.skillEditing.abilityEntityQueryContextKey') }}</span>
        <input type="text" :value="query.contextKey" @input="setContextKey(index, $event)" />
      </label>

      <label v-else-if="query.kind === 'ownerSpawned'" class="ability-entity-query-editor__ids">
        <span>{{ t('timeline.skillEditing.abilityEntityQueryIds') }}</span>
        <textarea
          :value="query.abilityEntityIds?.join('\n') ?? ''"
          :placeholder="t('timeline.skillEditing.abilityEntityQueryAllOwnerSpawned')"
          @input="setAbilityEntityIds(index, $event)"
        />
      </label>

      <button
        type="button"
        class="ability-entity-query-editor__delete"
        :title="t('timeline.skillEditing.deleteAbilityEntityQuery')"
        @click="removeQuery(index)"
      >
        <el-icon><Delete /></el-icon>
      </button>
    </div>

    <button type="button" class="ability-entity-query-editor__add" @click="appendQuery">
      <el-icon><Plus /></el-icon>
      {{ t('timeline.skillEditing.addAbilityEntityQuery') }}
    </button>
  </fieldset>
</template>

<style scoped>
.ability-entity-query-editor__item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(180px, 0.7fr) minmax(240px, 1.3fr);
  gap: 10px 14px;
  margin-top: 10px;
  padding: 12px 48px 12px 12px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}

.ability-entity-query-editor__item > label {
  min-width: 0;
  display: grid;
  gap: 5px;
}

.ability-entity-query-editor__ids textarea {
  min-height: 64px;
  resize: vertical;
  border: 1px solid var(--ea-border);
  border-radius: 2px;
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  padding: 6px;
}

.ability-entity-query-editor__delete {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
}

.ability-entity-query-editor__add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  margin-top: 10px;
  padding: 0 12px;
}

@container (max-width: 560px) {
  .ability-entity-query-editor__item {
    grid-template-columns: 1fr;
  }
}
</style>
