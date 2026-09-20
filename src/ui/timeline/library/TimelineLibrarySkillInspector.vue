<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { EaButton } from '../../../design-system/index';

defineProps<{
  name: string;
  operatorName: string;
  typeLabel: string;
  skillGroupKey: string;
  level: number;
  durationFrames: number;
  segments: readonly string[];
  customOperatorDefinition: boolean;
}>();

defineEmits<{ editOperatorDefinition: [] }>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <section class="properties-panel library-skill-inspector">
    <header class="panel-header">
      <div class="header-icon-bar"></div>
      <h3>{{ name }}</h3>
    </header>

    <div class="scrollable-content">
      <section class="section-container">
        <div class="panel-tag-mini">{{ t('timeline.inspector.sections.basic') }}</div>
        <div class="attribute-grid">
          <div class="form-group attribute-grid__wide">
            <span>{{ t('timeline.libraryInspector.operator') }}</span>
            <div class="readonly-field">{{ operatorName }}</div>
          </div>
          <div class="form-group">
            <span>{{ t('timeline.inspector.labels.sourceKind') }}</span>
            <div class="readonly-field">
              {{ t('timeline.inspector.sourceKinds.operatorSkill') }}
            </div>
          </div>
          <div class="form-group">
            <span>{{ t('timeline.inspector.labels.skillType') }}</span>
            <div class="readonly-field">{{ typeLabel }}</div>
          </div>
          <div class="form-group attribute-grid__wide">
            <span>{{ t('timeline.libraryInspector.skillGroupId') }}</span>
            <div class="readonly-field readonly-field--mono">{{ skillGroupKey }}</div>
          </div>
          <div class="form-group">
            <span>{{ t('timeline.libraryInspector.level') }}</span>
            <div class="readonly-field">{{ level }}</div>
          </div>
          <div class="form-group">
            <span>{{ t('timeline.libraryInspector.durationFrames') }}</span>
            <div class="readonly-field">{{ durationFrames }}</div>
          </div>
        </div>
      </section>

      <section class="section-container">
        <div class="panel-tag-mini">{{ t('timeline.libraryInspector.skillChain') }}</div>
        <div v-if="segments.length === 0" class="empty-hint">—</div>
        <ol v-else class="segment-list">
          <li v-for="(segment, index) in segments" :key="`${index}:${segment}`">
            <span>{{ index + 1 }}</span>
            <strong>{{ segment }}</strong>
          </li>
        </ol>
      </section>

      <EaButton
        variant="primary"
        size="sm"
        class="definition-button"
        type="button"
        @click="$emit('editOperatorDefinition')"
      >
        {{
          t(
            customOperatorDefinition
              ? 'timeline.customDefinition.editOperator'
              : 'timeline.customDefinition.customizeOperator',
          )
        }}
      </EaButton>
    </div>
  </section>
</template>

<style scoped>
.properties-panel {
  --right-panel-container-radius: 0;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ea-workbench-panel);
  color: var(--ea-fg);
}

.panel-header {
  flex: none;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 15px 15px 0;
}

.header-icon-bar {
  width: 4px;
  height: 18px;
  flex: none;
  background: var(--ea-gold);
}

.panel-header h3 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--ea-fg);
  font-size: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scrollable-content {
  min-height: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px 16px;
  overflow: auto;
  scrollbar-width: none;
}

.section-container {
  padding: 16px 10px 10px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}

.panel-tag-mini {
  margin-bottom: 10px;
  color: var(--ea-fg-secondary);
  font-size: 11px;
  font-weight: 700;
}

.attribute-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.attribute-grid__wide {
  grid-column: 1 / -1;
}

.form-group {
  min-width: 0;
  display: grid;
  gap: 5px;
  color: var(--ea-fg-muted);
  font-size: 10px;
}

.readonly-field {
  min-height: 28px;
  display: flex;
  align-items: center;
  padding: 5px 8px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-input);
  color: var(--ea-fg-secondary);
  overflow-wrap: anywhere;
}

.readonly-field--mono {
  font-family: 'Roboto Mono', Consolas, monospace;
  font-size: 10px;
}

.segment-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.segment-list li {
  min-width: 0;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.segment-list li > span {
  color: var(--ea-fg-muted);
  font:
    10px 'Roboto Mono',
    Consolas,
    monospace;
  text-align: right;
}

.segment-list strong {
  min-width: 0;
  overflow: hidden;
  color: var(--ea-fg-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-hint {
  color: var(--ea-fg-muted);
}

.definition-button {
  width: 100%;
  flex: none;
}
</style>
