<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaInput, EaSelect } from '@/design-system';
import { generatedEnemyStages } from '../../../data/enemies/generated/stages.generated';
import { getEnemyHpAtLevel, type EnemyDefinition } from '../../../core/game-data/enemyDefinition';
import zhStages from '../../../i18n/game-locales/zh/stages.json';
import enStages from '../../../i18n/game-locales/en/stages.json';

const props = defineProps<{
  enemies: readonly EnemyDefinition[];
  nameOf: (id: string) => string;
}>();
const emit = defineEmits<{ select: [id: string, level: number] }>();
const { t } = useI18n();
const { t: stageName } = useI18n({
  useScope: 'local',
  messages: { 'zh-CN': zhStages, en: enStages },
});
const query = ref('');
const seriesId = ref('__all__');
const stageId = ref('');
const definitions = computed(() => new Map(props.enemies.map(enemy => [enemy.id, enemy])));
const series = computed(() => [
  { value: '__all__', label: t('resourceMonitor.enemy.allStages') },
  ...new Map(
    generatedEnemyStages.map(stage => [
      stage.seriesId,
      {
        value: stage.seriesId,
        label: stageName(stage.seriesNameKey),
      },
    ]),
  ).values(),
]);
const stages = computed(() =>
  generatedEnemyStages.filter(stage => {
    if (seriesId.value !== '__all__' && stage.seriesId !== seriesId.value) return false;
    const text = [
      stageName(stage.nameKey),
      stageName(stage.seriesNameKey),
      stageName(stage.difficultyNameKey),
      ...stage.enemies.flatMap(enemy => [stageName(enemy.nameKey), props.nameOf(enemy.templateId)]),
    ]
      .join(' ')
      .toLocaleLowerCase();
    return text.includes(query.value.trim().toLocaleLowerCase());
  }),
);
const stageGroups = computed(() => {
  const groups = new Map<string, typeof generatedEnemyStages>();
  for (const stage of stages.value) {
    const entries = groups.get(stage.groupId) ?? [];
    entries.push(stage);
    groups.set(stage.groupId, entries);
  }
  return [...groups].map(([id, entries]) => ({
    id,
    entries: entries.sort(
      (a, b) => a.difficultyOrder - b.difficultyOrder || a.id.localeCompare(b.id),
    ),
    first: entries[0]!,
  }));
});
const activeGroup = computed(() => stageGroups.value.find(group => group.id === stageId.value));
type Entry = (typeof generatedEnemyStages)[number]['enemies'][number];
function difficulty(stage: (typeof generatedEnemyStages)[number]): string {
  const label = stageName(stage.difficultyNameKey);
  return label && label !== stageName(stage.nameKey) ? label : '';
}
function unavailable(entry: Entry): string | undefined {
  const definition = entry.definitionId ? definitions.value.get(entry.definitionId) : undefined;
  if (!definition) return t('resourceMonitor.enemy.variantPending');
  if (entry.level === null || getEnemyHpAtLevel(definition, entry.level) === null)
    return t('resourceMonitor.enemy.stageLevelPending');
}
function select(entry: Entry) {
  if (!unavailable(entry) && entry.level !== null && entry.definitionId)
    emit('select', entry.definitionId, entry.level);
}
</script>

<template>
  <div class="stage-picker">
    <div class="stage-filters">
      <EaInput v-model="query" :placeholder="t('resourceMonitor.enemy.searchStage')" clearable />
      <EaSelect
        v-model="seriesId"
        :options="series"
        :aria-label="t('resourceMonitor.enemy.byStage')"
      />
    </div>
    <p class="stage-scope">{{ t('resourceMonitor.enemy.attributeOnly') }}</p>
    <div class="stage-columns">
      <div class="stage-list">
        <EaButton
          v-for="group in stageGroups"
          :key="group.id"
          variant="ghost"
          :pressed="group.id === activeGroup?.id"
          @click="stageId = group.id"
        >
          <strong>{{ stageName(group.first.groupNameKey) }}</strong>
          <small
            v-if="stageName(group.first.groupNameKey) !== stageName(group.first.seriesNameKey)"
            >{{ stageName(group.first.seriesNameKey) }}</small
          >
        </EaButton>
      </div>
      <div class="stage-enemies">
        <template v-if="activeGroup">
          <section
            v-for="activeStage in activeGroup.entries"
            :key="activeStage.id"
            class="stage-difficulty"
          >
            <strong>{{ stageName(activeStage.nameKey) }}</strong>
            <small v-if="difficulty(activeStage)">{{ difficulty(activeStage) }}</small>
            <div
              v-for="(entry, index) in activeStage.enemies"
              :key="`${entry.id}:${index}`"
              class="stage-enemy"
            >
              <slot
                name="enemy"
                :definition="definitions.get(entry.definitionId ?? entry.templateId)"
                :display-name="stageName(entry.nameKey) || nameOf(entry.templateId)"
                :level="entry.level"
                :unavailable="unavailable(entry)"
                :select="() => select(entry)"
              />
              <small v-if="unavailable(entry)" class="pending">{{ unavailable(entry) }}</small>
            </div>
          </section>
        </template>
        <span v-else class="stage-placeholder">{{ t('resourceMonitor.enemy.chooseStage') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage-picker {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 12px;
}
.stage-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}
.stage-filters > * {
  min-width: 0;
  width: 100%;
}
.stage-difficulty + .stage-difficulty {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color);
}
.stage-scope {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.stage-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
  min-height: 0;
}
.stage-list,
.stage-enemies {
  overflow-y: auto;
  min-height: 0;
  padding: 8px;
}
.stage-list {
  border-right: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stage-list button {
  flex: none;
  height: auto;
  min-height: 58px;
  line-height: 1.4;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  white-space: normal;
  text-align: left;
  padding: 10px;
}
small {
  display: block;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
.stage-enemy {
  display: grid;
  gap: 4px;
  margin-top: 12px;
}
.pending,
.stage-placeholder {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
