<script setup lang="ts">
import { computed } from 'vue';
import type { OperatorDefinition } from '../../../../packages/game-data-contract/src/operators';
import { useI18n } from 'vue-i18n';
import {
  EaButton,
  EaCheckbox,
  EaChevronIcon,
  EaCloseIcon,
  EaColorPicker,
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

const isDev = import.meta.env.DEV;

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
  currentDefinition: SkillDefinition | null;
  operatorDefinition?: OperatorDefinition;
  skillLevel: number;
  minimumFrame: number;
  maximumFrame: number;
  connections: readonly InspectorConnection[];
  connectionDragging: boolean;
  /** 后续成员仅展示已发布的实际输入帧，不允许写入独立开始帧。 */
  actualStartFrame?: number;
  /** 已发布模拟结果中的块宽，包含起跳等复合输入阶段及时间膨胀。 */
  actualDurationFrames?: number;
  grouped?: boolean;
  inputReadOnly?: boolean;
}>();

const emit = defineEmits<{
  setInitialBlackboard: [value: Readonly<Record<string, number>>];
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
  editGraph: [];
  executionTrace: [];
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
    : `${Number(((props.actualDurationFrames ?? props.currentDefinition.timelineBlockFrames) / PROJECT_FPS).toFixed(2))}s`,
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
const initialFields = computed(() =>
  Object.entries(props.currentDefinition?.blackboard ?? {}).map(([key, value]) => ({
    key,
    value: typeof value === 'number' ? value : value[props.skillLevel - 1],
  })),
);
function setInitialValue(key: string, value: number | undefined) {
  if (props.cast === null) return;
  if (value !== undefined && !Number.isFinite(value)) return;
  const values = { ...props.cast.simulationInputs?.initialBlackboard };
  if (value === undefined) delete values[key];
  else values[key] = value;
  emit('setInitialBlackboard', values);
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
            <div class="ea-readonly-value ea-readonly-value--compact">{{ skillDuration }}</div>
          </div>
          <div v-if="skillCooldown !== null" class="form-group">
            <span>{{ t('timeline.inspector.labels.cooldown') }}</span>
            <div class="ea-readonly-value ea-readonly-value--compact">{{ skillCooldown }}</div>
          </div>
          <div v-for="cost in skillCosts" :key="cost.index" class="form-group">
            <span>{{ cost.label }}</span>
            <div class="ea-readonly-value ea-readonly-value--compact">{{ cost.amount }}</div>
          </div>
          <div v-if="cast.placement.afterCastId !== undefined" class="form-group">
            <span>{{ t('timeline.inspector.labels.startFrame') }}</span>
            <div class="ea-readonly-value ea-readonly-value--compact">
              {{ t('timeline.continuousGroup.followsPrevious') }}
            </div>
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
          <EaButton
            v-if="isDev"
            class="attribute-grid__wide"
            size="sm"
            :disabled="inputReadOnly || currentDefinition === null"
            @click="$emit('editGraph')"
            >{{ t('actionGraphEditor.open') }}</EaButton
          >
          <EaButton
            class="attribute-grid__wide"
            size="sm"
            :disabled="currentDefinition === null"
            @click="$emit('executionTrace')"
            >{{ t('executionTrace.title') }}</EaButton
          >
        </div>
      </section>

      <section v-if="isDev && initialFields.length" class="section-container">
        <div class="panel-tag-mini">{{ t('actionGraphEditor.initialVariables') }}</div>
        <div class="attribute-grid">
          <div v-for="field in initialFields" :key="field.key" class="form-group">
            <span :title="field.key">{{ field.key }}</span>
            <EaNumberInput
              size="sm"
              controls-position="right"
              :disabled="inputReadOnly"
              :model-value="cast.simulationInputs?.initialBlackboard?.[field.key] ?? field.value"
              :step="0.01"
              @update:model-value="setInitialValue(field.key, $event)"
            />
            <EaButton
              v-if="Object.hasOwn(cast.simulationInputs?.initialBlackboard ?? {}, field.key)"
              size="sm"
              :disabled="inputReadOnly"
              @click="setInitialValue(field.key, undefined)"
            >
              {{ t('battleLog.ui.clear') }}
            </EaButton>
          </div>
        </div>
      </section>
      <section class="section-container">
        <div class="panel-tag-mini">{{ t('timeline.inspector.sections.presentation') }}</div>
        <div class="presentation-settings">
          <div class="presentation-toggle-row">
            <EaCheckbox
              class="presentation-toggle"
              :model-value="cast.presentation?.locked ?? false"
              @change="$emit('setLocked', $event)"
            >
              {{ t('timeline.inspector.labels.locked') }}
            </EaCheckbox>
            <EaCheckbox
              class="presentation-toggle"
              :model-value="cast.presentation?.disabled ?? false"
              @change="$emit('setDisabled', $event)"
              :disabled="inputReadOnly"
            >
              {{ t('timeline.inspector.labels.disabled') }}
            </EaCheckbox>
          </div>
          <div class="presentation-color">
            <span>{{ t('timeline.inspector.labels.color') }}</span>
            <code>{{ cast.presentation?.color ?? t('common.default') }}</code>
            <EaColorPicker
              :label="t('timeline.inspector.labels.color')"
              :model-value="cast.presentation?.color ?? '#8c8c8c'"
              @change="$emit('setColor', $event)"
            />
            <EaButton
              variant="ghost"
              size="sm"
              icon-only
              type="button"
              class="presentation-color__clear"
              :title="t('battleLog.ui.clear')"
              :aria-label="t('battleLog.ui.clear')"
              :disabled="!cast.presentation?.color"
              @click="$emit('setColor', null)"
            >
              <EaCloseIcon :size="12" />
            </EaButton>
          </div>
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
              <EaChevronIcon
                class="connection-direction"
                :size="14"
                :title="
                  t(connection.outgoing ? 'connection.direction.to' : 'connection.direction.from')
                "
              />
              <span class="connection-node is-target">{{
                connection.outgoing ? connection.otherLabel : label
              }}</span>
              <EaButton
                variant="ghost"
                size="sm"
                icon-only
                type="button"
                class="connection-remove"
                :title="t('common.delete')"
                :aria-label="t('common.delete')"
                @click="$emit('removeConnection', connection.id)"
              >
                <EaDeleteIcon />
              </EaButton>
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
.connection-card__title {
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
  --connection-accent: var(--ea-gold);
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--ea-border-soft);
  border-left: 3px solid var(--connection-accent);
  background: var(--ea-workbench-panel);
}

.connection-card.is-incoming {
  --connection-accent: #00e5ff;
}

.connection-card__title {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 14px minmax(0, 1fr) 24px;
  gap: 5px;
}

.connection-node {
  min-width: 0;
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
  color: var(--connection-accent);
  opacity: 0.8;
}

.connection-remove.ea-button {
  width: 24px;
  height: 24px;
  border-color: transparent;
  background: transparent;
  color: var(--ea-fg-muted);
}

.connection-ports {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
  margin-top: 7px;
  padding-top: 7px;
  border-top: 1px solid var(--ea-border-soft);
}

.connection-ports label {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: var(--ea-fg-muted);
  font-size: 10px;
}

.connection-ports :deep(.ea-select) {
  width: 100%;
  min-width: 0;
  font-size: 11px;
}

@media (hover: hover) and (pointer: fine) {
  .connection-remove.ea-button:hover:not(:disabled) {
    border-color: transparent;
    background: color-mix(in srgb, var(--ea-danger) 14%, transparent);
    color: var(--ea-danger);
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

.presentation-settings {
  display: flex;
  flex-direction: column;
  padding: 4px 6px;
}

.presentation-toggle-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  border-bottom: 1px solid var(--ea-border-soft);
}

.presentation-toggle.ea-checkbox {
  min-height: 34px;
  width: 100%;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  font-size: 11px;
}

.presentation-toggle :deep(.ea-checkbox__label) {
  order: 1;
}

.presentation-toggle :deep(.ea-checkbox__box) {
  order: 2;
}

.presentation-color {
  min-width: 0;
  min-height: 38px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 24px 24px;
  align-items: center;
  gap: 6px;
  padding: 0 6px;
  color: var(--ea-fg-secondary);
  font-size: 11px;
}

.presentation-color code {
  min-width: 0;
  overflow: hidden;
  justify-self: end;
  color: var(--ea-fg-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.presentation-color__clear.ea-button {
  width: 24px;
  height: 24px;
  border-color: transparent;
  background: transparent;
  color: var(--ea-fg-muted);
}

.presentation-color__clear :deep(svg) {
  transform: translateX(4px);
}

@media (hover: hover) and (pointer: fine) {
  .presentation-color__clear.ea-button:hover:not(:disabled) {
    border-color: transparent;
    background: transparent;
    color: var(--ea-gold);
  }
}
</style>
