<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RefreshLeft } from '@element-plus/icons-vue';
import {
  EaButton,
  EaCheckbox,
  EaDiceIcon,
  EaDeleteIcon,
  EaNumberInput,
  EaPlusIcon,
  EaSelect,
  type EaSelectValue,
} from '../../../design-system/index';
import type { SkillDefinition } from '../../../core/game-data/operatorDefinition';
import { PROJECT_FPS, type SkillCastDocument } from '../../../core/project/schema';
import { connectionPortI18nKey, type TimelineConnectionPort } from './timelineConnections';

interface InspectorConnection {
  readonly id: string;
  readonly outgoing: boolean;
  readonly otherLabel: string;
  readonly fromPort: TimelineConnectionPort;
  readonly toPort: TimelineConnectionPort;
}

interface InspectorConnectionPatch {
  readonly fromPort?: TimelineConnectionPort;
  readonly toPort?: TimelineConnectionPort;
}

const props = defineProps<{
  cast: SkillCastDocument | null;
  label: string;
  edited: boolean;
  diffCount: number;
  templateDefinition: SkillDefinition | null;
  currentDefinition: SkillDefinition | null;
  skillLevel: number;
  minimumFrame: number;
  maximumFrame: number;
  connections: readonly InspectorConnection[];
  connectionDragging: boolean;
  /** 后续成员仅展示已发布的实际输入帧，不允许写入独立开始帧。 */
  actualStartFrame?: number;
  grouped?: boolean;
  inputReadOnly?: boolean;
}>();

const emit = defineEmits<{
  editDefinition: [];
  resetDefinition: [];
  setRandomSeed: [seed: number | null];
  rollRandomSeed: [];
  setStartFrame: [frame: number];
  setLocked: [locked: boolean];
  setDisabled: [disabled: boolean];
  setColor: [color: string | null];
  beginConnection: [];
  removeConnection: [connectionId: string];
  updateConnection: [connectionId: string, patch: InspectorConnectionPatch];
  dissolveGroup: [];
}>();

const { t } = useI18n({ useScope: 'global' });
const connectionPorts: readonly TimelineConnectionPort[] = [
  'right',
  'left',
  'top',
  'bottom',
  'top-right',
  'bottom-right',
  'top-left',
  'bottom-left',
];
const skillDuration = computed(() =>
  props.currentDefinition === null
    ? null
    : `${Number((props.currentDefinition.timelineBlockFrames / PROJECT_FPS).toFixed(2))}s`,
);
const skillCooldown = computed(() => {
  const frames = props.currentDefinition?.cooldownFrames;
  if (frames === undefined) return null;
  const value = Array.isArray(frames) ? frames[props.skillLevel - 1] : frames;
  return value === undefined ? null : `${Number((value / PROJECT_FPS).toFixed(2))}s`;
});
const skillCosts = computed(() =>
  (props.currentDefinition?.costs ?? []).flatMap((cost, index) => {
    const amount = Array.isArray(cost.value) ? cost.value[props.skillLevel - 1] : cost.value;
    return amount === undefined
      ? []
      : [
          {
            index,
            label: t(`propertiesPanel.labels.${cost.resource === 'sp' ? 'spCost' : 'gaugeCost'}`),
            amount,
          },
        ];
  }),
);

function connectionPort(value: EaSelectValue | EaSelectValue[]): TimelineConnectionPort {
  return String(value) as TimelineConnectionPort;
}

function connectionPortLabel(port: TimelineConnectionPort): string {
  return t(connectionPortI18nKey(port));
}

function commitStartFrame(value: number | undefined): void {
  if (props.cast?.placement.afterCastId !== undefined) return;
  const frame = Number(value);
  if (Number.isInteger(frame) && frame >= props.minimumFrame && frame <= props.maximumFrame) {
    emit('setStartFrame', frame);
  }
}

function commitRandomSeed(value: number | undefined): void {
  if (value === undefined) {
    emit('setRandomSeed', null);
    return;
  }
  if (Number.isInteger(value) && value >= 0 && value <= 0xffffffff) emit('setRandomSeed', value);
}
</script>

<template>
  <section class="properties-panel">
    <header class="panel-header">
      <div class="header-main-row">
        <div class="header-icon-bar"></div>
        <h3>{{ cast === null ? t('propertiesPanel.noSelection') : label }}</h3>
      </div>
      <div class="header-divider"></div>
    </header>

    <div v-if="cast !== null" class="scrollable-content">
      <section class="section-container">
        <div class="panel-tag-mini">{{ t('timeline.inspector.sections.basic') }}</div>
        <div class="attribute-grid">
          <div v-if="skillDuration !== null" class="form-group">
            <span>{{ t('timeline.inspector.labels.duration') }}</span>
            <div class="readonly-field">{{ skillDuration }}</div>
          </div>
          <div v-if="skillCooldown !== null" class="form-group">
            <span>{{ t('timeline.inspector.labels.cooldown') }}</span>
            <div class="readonly-field">{{ skillCooldown }}</div>
          </div>
          <div v-for="cost in skillCosts" :key="cost.index" class="form-group">
            <span>{{ cost.label }}</span>
            <div class="readonly-field">{{ cost.amount }}</div>
          </div>
          <div v-if="cast.placement.afterCastId !== undefined" class="form-group">
            <span>{{ t('timeline.inspector.labels.startFrame') }}</span>
            <div class="readonly-field">{{ t('timeline.continuousGroup.followsPrevious') }}</div>
            <small class="field-help">{{
              actualStartFrame === undefined
                ? t('timeline.continuousGroup.actualStartUnavailable')
                : t('timeline.continuousGroup.actualStartFrame', { frame: actualStartFrame })
            }}</small>
          </div>
          <label v-else class="form-group">
            <span>{{ t('timeline.inspector.labels.startFrame') }}</span>
            <EaNumberInput
              class="number-field"
              :min="minimumFrame"
              :max="maximumFrame"
              :step="1"
              controls-position="right"
              size="sm"
              :model-value="cast.placement.startFrame"
              @change="commitStartFrame"
              :disabled="inputReadOnly || cast.presentation?.locked"
            />
          </label>
          <EaButton
            v-if="grouped"
            variant="ghost"
            size="sm"
            :disabled="inputReadOnly"
            @click="$emit('dissolveGroup')"
          >
            {{ t('timeline.continuousGroup.dissolve') }}
          </EaButton>
        </div>
      </section>

      <section class="section-container">
        <div class="panel-tag-mini">{{ t('timeline.inspector.sections.simulation') }}</div>
        <div class="attribute-grid">
          <div class="form-group attribute-grid__wide">
            <span>{{ t('timeline.random.castSeed') }}</span>
            <div class="random-seed-row">
              <EaNumberInput
                class="number-field"
                :min="0"
                :max="0xffffffff"
                :step="1"
                controls-position="right"
                size="sm"
                :model-value="cast.simulationInputs?.randomSeed"
                :placeholder="t('timeline.random.useGlobalSeed')"
                @change="commitRandomSeed"
                :disabled="inputReadOnly"
              />
              <div class="inline-actions">
                <EaButton
                  size="sm"
                  icon-only
                  type="button"
                  :title="t('timeline.random.roll')"
                  :aria-label="t('timeline.random.roll')"
                  @click="$emit('rollRandomSeed')"
                  :disabled="inputReadOnly"
                >
                  <EaDiceIcon />
                </EaButton>
                <EaButton
                  v-if="cast.simulationInputs?.randomSeed !== undefined"
                  size="sm"
                  type="button"
                  @click="$emit('setRandomSeed', null)"
                  :disabled="inputReadOnly"
                >
                  {{ t('battleLog.ui.clear') }}
                </EaButton>
              </div>
            </div>
            <small class="field-help">{{ t('timeline.random.castSeedHelp') }}</small>
          </div>
        </div>
      </section>

      <section
        v-if="templateDefinition !== null && currentDefinition !== null"
        class="section-container"
      >
        <div class="panel-tag-mini">{{ t('timeline.skillEditing.section') }}</div>
        <div class="definition-status definition-status--stacked">
          <strong>
            {{
              edited
                ? t('timeline.skillEditing.customized')
                : t('timeline.skillEditing.usesTemplate')
            }}
          </strong>
          <span v-if="edited">{{
            t('timeline.skillEditing.diffCount', { count: diffCount })
          }}</span>
          <div class="definition-actions">
            <EaButton
              variant="primary"
              size="sm"
              type="button"
              class="definition-edit"
              @click="$emit('editDefinition')"
              :disabled="inputReadOnly"
            >
              {{ t('timeline.skillEditing.edit') }}
            </EaButton>
            <EaButton
              size="sm"
              v-if="edited"
              type="button"
              class="definition-reset"
              @click="$emit('resetDefinition')"
              :disabled="inputReadOnly"
            >
              <RefreshLeft />
              <span>{{ t('timeline.skillEditing.reset') }}</span>
            </EaButton>
          </div>
        </div>
      </section>

      <section v-if="edited && templateDefinition === null" class="section-container">
        <div class="panel-tag-mini">{{ t('timeline.skillEditing.section') }}</div>
        <div class="definition-status">
          <span>{{ t('timeline.skillEditing.diffCount', { count: diffCount }) }}</span>
          <EaButton
            size="sm"
            type="button"
            class="definition-reset"
            :title="t('timeline.skillEditing.reset')"
            @click="$emit('resetDefinition')"
            :disabled="inputReadOnly"
          >
            <RefreshLeft />
            <span>{{ t('timeline.skillEditing.reset') }}</span>
          </EaButton>
        </div>
      </section>

      <section class="section-container">
        <div class="panel-tag-mini">{{ t('timeline.inspector.sections.presentation') }}</div>
        <div class="attribute-grid">
          <div class="form-group toggle-field">
            <span>{{ t('timeline.inspector.labels.locked') }}</span>
            <EaCheckbox
              :model-value="cast.presentation?.locked ?? false"
              @change="$emit('setLocked', $event)"
            />
          </div>
          <div class="form-group toggle-field">
            <span>{{ t('timeline.inspector.labels.disabled') }}</span>
            <EaCheckbox
              :model-value="cast.presentation?.disabled ?? false"
              @change="$emit('setDisabled', $event)"
              :disabled="inputReadOnly"
            />
          </div>
          <label class="form-group attribute-grid__wide">
            <span>{{ t('timeline.inspector.labels.color') }}</span>
            <div class="color-editor">
              <input
                type="color"
                :value="cast.presentation?.color ?? '#8c8c8c'"
                @change="$emit('setColor', ($event.target as HTMLInputElement).value)"
              />
              <code>{{ cast.presentation?.color ?? '—' }}</code>
              <EaButton size="sm" type="button" @click="$emit('setColor', null)">
                {{ t('battleLog.ui.clear') }}
              </EaButton>
            </div>
          </label>
        </div>
      </section>

      <section class="section-container">
        <div class="panel-tag-mini">{{ t('propertiesPanel.connections.title') }}</div>
        <div class="connection-summary">
          <span>
            {{ t('propertiesPanel.connections.currentCount') }}: {{ connections.length }}
          </span>
          <EaButton
            variant="primary"
            size="sm"
            type="button"
            class="connection-add"
            @click="$emit('beginConnection')"
          >
            <EaPlusIcon :size="10" :stroke-width="4" />
            {{
              connectionDragging
                ? t('propertiesPanel.connections.chooseTarget')
                : t('propertiesPanel.connections.new')
            }}
          </EaButton>
        </div>
        <div v-if="connections.length === 0" class="empty-hint">
          {{ t('propertiesPanel.connections.empty') }}
        </div>
        <div v-else class="connections-list">
          <article
            v-for="connection in connections"
            :key="connection.id"
            class="connection-card"
            :class="connection.outgoing ? 'is-outgoing' : 'is-incoming'"
          >
            <div class="connection-card__title">
              <span class="connection-node">{{
                connection.outgoing ? label : connection.otherLabel
              }}</span>
              <b
                class="connection-direction"
                :class="connection.outgoing ? 'is-outgoing' : 'is-incoming'"
                >{{
                  t(connection.outgoing ? 'connection.direction.to' : 'connection.direction.from')
                }}</b
              >
              <span class="connection-node is-target">{{
                connection.outgoing ? connection.otherLabel : label
              }}</span>
            </div>
            <div class="connection-ports">
              <label>
                <span>{{ t('propertiesPanel.connections.outPort') }}</span>
                <EaSelect
                  size="sm"
                  variant="inline"
                  :model-value="connection.fromPort"
                  :options="
                    connectionPorts.map(port => ({ value: port, label: connectionPortLabel(port) }))
                  "
                  @change="
                    $emit('updateConnection', connection.id, { fromPort: connectionPort($event) })
                  "
                />
              </label>
              <b class="connection-port-arrow">&gt;&gt;</b>
              <label>
                <span>{{ t('propertiesPanel.connections.inPort') }}</span>
                <EaSelect
                  size="sm"
                  variant="inline"
                  :model-value="connection.toPort"
                  :options="
                    connectionPorts.map(port => ({ value: port, label: connectionPortLabel(port) }))
                  "
                  @change="
                    $emit('updateConnection', connection.id, { toPort: connectionPort($event) })
                  "
                />
              </label>
            </div>
            <div class="connection-actions">
              <EaButton
                variant="danger"
                size="sm"
                icon-only
                type="button"
                :title="t('common.delete')"
                @click="$emit('removeConnection', connection.id)"
              >
                <EaDeleteIcon />
              </EaButton>
            </div>
          </article>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.properties-panel {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ea-space-3);
  padding: var(--ea-space-3);
  overflow-y: auto;
  scrollbar-width: none;
  background: var(--ea-workbench-panel);
  color: var(--ea-fg);
  font-size: 13px;
}

.properties-panel::-webkit-scrollbar {
  display: none;
}

.panel-header {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ea-space-1);
}

.header-main-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--ea-space-2);
}

.header-divider {
  height: 2px;
  margin-top: 3px;
  background: linear-gradient(90deg, var(--ea-gold), transparent);
  opacity: 0.3;
}

.header-icon-bar {
  width: 4px;
  height: 18px;
  flex: 0 0 auto;
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
  flex-direction: column;
  gap: var(--ea-space-3);
}

.section-container {
  position: relative;
  flex-shrink: 0;
  margin-top: var(--ea-space-3);
  padding: var(--ea-space-3);
  border: 1px solid color-mix(in srgb, var(--ea-fg) 10%, transparent);
  border-left: 3px solid color-mix(in srgb, var(--ea-fg) 20%, transparent);
  background: var(--ea-fill-soft);
}

.empty-hint {
  padding: 6px 0;
  color: var(--ea-fg-muted);
  text-align: center;
}

.connection-summary,
.connection-card__title,
.connection-ports {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.connection-summary {
  justify-content: space-between;
  color: var(--ea-fg-muted);
  font-size: 11px;
}

.connections-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.connection-card {
  min-width: 0;
  padding: var(--ea-space-2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 3px solid var(--ea-gold);
  background: var(--ea-fill-soft);
  transition:
    background-color var(--ea-control-transition),
    border-color var(--ea-control-transition);
}

.connection-card.is-incoming {
  border-left-color: #00e5ff;
}

.connection-card__title {
  justify-content: space-between;
  padding-bottom: 4px;
}

.connection-node {
  min-width: 0;
  width: 38%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--ea-fg);
}

.connection-node.is-target {
  text-align: right;
}

.connection-direction {
  min-width: 40px;
  padding: 2px 6px;
  text-align: center;
  font-size: 10px;
  letter-spacing: 0.5px;
  border: 1px solid;
  opacity: 0.8;
}

.connection-direction.is-outgoing {
  color: var(--ea-gold);
  background: color-mix(in srgb, var(--ea-gold) 10%, transparent);
  border-color: color-mix(in srgb, var(--ea-gold) 20%, transparent);
}

.connection-direction.is-incoming {
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.1);
  border-color: rgba(0, 229, 255, 0.2);
}

.connection-ports {
  width: fit-content;
  max-width: 100%;
  margin: 4px auto 2px;
  padding: 2px 10px;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.4);
}

.connection-ports label {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 9px;
  font-weight: 700;
}

.connection-ports :deep(.ea-select) {
  width: 72px;
  font-size: 10px;
}

.connection-port-arrow {
  font-size: 8px;
  letter-spacing: -1px;
  color: #444;
}

.connection-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  height: 24px;
  margin-top: 2px;
}

@media (hover: hover) and (pointer: fine) {
  .connection-card:hover {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.06);
  }
}

.field-help {
  color: var(--ea-fg-muted);
  font-size: 11px;
  line-height: 1.45;
}

.inline-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
}

.random-seed-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.random-seed-row > .number-field {
  min-width: 0;
  flex: 1 1 auto;
}

.attribute-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ea-space-2) var(--ea-space-3);
  padding: var(--ea-space-2);
}

.attribute-grid__wide {
  grid-column: 1 / -1;
}

.form-group {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: var(--ea-fg-muted);
  font-size: 10px;
}

.readonly-field {
  width: 100%;
  height: 28px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  border-radius: 2px;
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg-muted);
  padding: 0 7px;
  font:
    12px/28px Consolas,
    monospace;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.toggle-field {
  min-height: 48px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input, #16161a);
}

.color-editor {
  min-width: 0;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
}

.color-editor input {
  width: 34px;
  height: 28px;
  padding: 1px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
}

.color-editor code {
  min-width: 0;
  overflow: hidden;
  color: var(--ea-fg-secondary);
  text-overflow: ellipsis;
}

.definition-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--ea-fg-muted);
  font-size: 11px;
}

.definition-status--stacked {
  align-items: stretch;
  flex-direction: column;
}

.definition-status--stacked strong {
  color: var(--ea-fg);
  font-size: 12px;
}

.definition-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px;
}

.definition-edit {
  height: 28px;
  border: 1px solid var(--ea-gold);
  border-radius: 2px;
  background: var(--ea-active-fill);
  color: var(--ea-fg);
  cursor: pointer;
}

.definition-reset {
  height: 26px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border: 1px solid var(--ea-border);
  border-radius: 2px;
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  cursor: pointer;
}

.definition-reset:hover {
  border-color: var(--ea-gold);
}

.definition-reset svg {
  width: 13px;
  height: 13px;
}
</style>
