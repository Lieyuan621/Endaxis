<script setup lang="ts">
import TimelineInspectorHeader from './TimelineInspectorHeader.vue';
/** 连携冷却控制标记的实例级 Inspector。 */
import { interactionMarkerLabel } from './interactionMarkerLabel';
import { useI18n } from 'vue-i18n';
import { EaButton, EaNumberInput } from '../../../design-system/index';
import type { InteractionMarker } from '../../../core/project/scenarioMarkers';

const props = defineProps<{
  marker: InteractionMarker;
  maximumFrame: number;
  readOnly?: boolean;
  targetLabel: string;
  title: string;
}>();

const emit = defineEmits<{
  setFrame: [frame: number];
  remove: [];
}>();

const { t } = useI18n({ useScope: 'global' });

function commitFrame(value: number | undefined): void {
  const frame = Number(value);
  if (Number.isInteger(frame) && frame >= 0 && frame <= props.maximumFrame) {
    emit('setFrame', frame);
  }
}
</script>

<template>
  <section class="marker-inspector">
    <TimelineInspectorHeader class="marker-header">{{ title }}</TimelineInspectorHeader>

    <div class="scrollable-content">
      <section class="section-container">
        <div class="panel-tag-mini">{{ t('timeline.inspector.sections.basic') }}</div>
        <div class="attribute-grid">
          <div class="form-group attribute-grid__wide">
            <span>{{ t('timeline.markerInspector.event') }}</span>
            <div class="ea-readonly-value">
              {{ t(`timeline.markerLabels.${interactionMarkerLabel(marker)}`) }}
            </div>
          </div>
          <div class="form-group attribute-grid__wide">
            <span>{{ t('timeline.markerInspector.target') }}</span>
            <div class="ea-readonly-value">{{ targetLabel }}</div>
          </div>
          <label class="form-group">
            <span>{{ t('timeline.inspector.labels.startFrame') }}</span>
            <EaNumberInput
              size="sm"
              controls-position="right"
              :min="0"
              :max="maximumFrame"
              :step="1"
              :model-value="marker.frame"
              @change="commitFrame"
              :disabled="readOnly"
            />
          </label>
          <div class="form-group">
            <span>{{ t('timeline.inspector.labels.actionId') }}</span>
            <div class="ea-readonly-value">{{ marker.id }}</div>
          </div>
        </div>
        <small v-if="marker.kind === 'comboCooldownControl'" class="field-help">{{
          t('timeline.markerInspector.comboCooldownHint')
        }}</small>
      </section>

      <section class="section-container danger-section">
        <EaButton
          variant="danger"
          size="sm"
          type="button"
          class="delete-button"
          @click="$emit('remove')"
          :disabled="readOnly"
        >
          {{ t('timeline.markerContext.deleteMarker') }}
        </EaButton>
      </section>
    </div>
  </section>
</template>

<style scoped>
.marker-header {
  margin: var(--ea-space-3) var(--ea-space-3) 0;
}

.marker-inspector {
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--ea-workbench-panel);
  color: var(--ea-fg);
}

.scrollable-content {
  min-height: 0;
  overflow: auto;
  padding-bottom: 12px;
}

.section-container {
  position: relative;
  margin-top: var(--ea-space-3);
  min-width: 0;
  padding: 12px;
  border-bottom: 1px solid var(--ea-border, #353a40);
}

.attribute-grid {
  min-width: 0;
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
  color: var(--ea-fg-secondary);
  font-size: 12px;
}

.field-help {
  display: block;
  margin-top: 9px;
  color: var(--ea-fg-muted);
  line-height: 1.45;
}

.option-grid {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(116px, 1fr));
  gap: 6px;
}

.check-field {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 3px;
  background: rgb(255 255 255 / 3%);
  font-size: 12px;
  line-height: 1.35;
}

.danger-section {
  border-bottom: 0;
}

.delete-button {
  width: 100%;
}
</style>
