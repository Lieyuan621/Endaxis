<script setup>
import { computed, ref, watch } from 'vue';
import { useTimelineStore } from '../stores/timelineStore.js';
import draggable from 'vuedraggable';
import CustomNumberInput from './CustomNumberInput.vue';
import HitEditorDialog from './HitEditorDialog.vue';
import { ArrowRight } from '@element-plus/icons-vue';
import { useDragConnection } from '@/composables/useDragConnection';
import { getRectPos } from '@/utils/layoutUtils';
import { useI18n } from 'vue-i18n';
import { frameToTime, timeToFrame } from '@/utils/time';
import { getDisplayKeyCandidates, resolveEffectDisplayKey } from '@/utils/effectDisplay';
import {
  canEditEditorEffectValue,
  createEditorEffect,
  createEditorHit,
  createHitModelId,
  ensureActionLikeModel,
  ensureEffectId,
  filterEditorVisibleHits,
  mergeEditorVisibleHits,
  normalizeHits,
  retypeEditorEffect,
  toLegacyDisplayType,
} from '@/utils/hitModel';

const store = useTimelineStore();
const connectionHandler = useDragConnection();
const { t, tm } = useI18n({ useScope: 'global' });
const props = defineProps({
  onResetPanel: {
    type: Function,
    default: null,
  },
  onCollapsePanel: {
    type: Function,
    default: null,
  },
});

function handleResetPanel() {
  props.onResetPanel?.();
}

function handleCollapsePanel() {
  props.onCollapsePanel?.();
}
// ===================================================================================
// 1. 常量与配置
// ===================================================================================
const HIGHLIGHT_COLORS = {
  default: '#ffd700',
  red: '#ff7875',
  blue: '#00e5ff',
};

function getEffectDisplayName(type) {
  const displayType = type;
  if (!displayType) return t('common.unknown');
  const key = `effects.name.${displayType}`;
  const out = t(key);
  return out === key ? displayType : out;
}

const GROUP_DEFINITIONS = computed(() => [
  { label: t('effects.group.physical'), keys: ['breach', 'crush', 'lift', 'knockdown'] },
  {
    label: t('effects.group.attach'),
    matcher: key => key.endsWith('_infliction') || key.endsWith('_attach'),
  },
  { label: t('effects.group.burst'), matcher: key => key.endsWith('_burst') },
  {
    label: t('effects.group.status'),
    keys: ['combustion', 'electrification', 'solidification', 'corrosion'],
  },
]);

const PORT_OPTIONS = computed(() => [
  { label: t('connection.port.right'), value: 'right' },
  { label: t('connection.port.left'), value: 'left' },
  { label: t('connection.port.top'), value: 'top' },
  { label: t('connection.port.bottom'), value: 'bottom' },
  { label: t('connection.port.topRight'), value: 'top-right' },
  { label: t('connection.port.bottomRight'), value: 'bottom-right' },
  { label: t('connection.port.topLeft'), value: 'top-left' },
  { label: t('connection.port.bottomLeft'), value: 'bottom-left' },
]);

function getFullTypeName(type) {
  const key = `skillType.${toLegacyDisplayType(type)}`;
  const out = t(key);
  return out === key ? t('skillType.unknown') : out;
}

function getEditorLabel(group, value) {
  const key = String(value || '');
  if (!key) return '';
  const localeKey = `hitEditor.${group}.${key}`;
  const out = t(localeKey);
  return out === localeKey ? key : out;
}

function getHitElementLabel(hit) {
  const element = hit?.element || targetData.value?.element;
  return element ? getEditorLabel('elements', element) : t('common.default');
}

// ===================================================================================
// 2. 核心状态计算
// ===================================================================================

const isTicksExpanded = ref(false);
const isBarsExpanded = ref(false);
const editingHitIndex = ref(null);
const hitEditorVisible = ref(false);
const localSelectedAnomalyId = ref(null); // 用于库模式下的本地选中状态

watch(
  () => store.selectedLibrarySkillId,
  () => {
    localSelectedAnomalyId.value = null;
  },
);

const targetData = computed(() => {
  if (store.selectedActionId) {
    // 寻找实例
    for (const track of store.tracks) {
      const found = track.actions.find(a => a.instanceId === store.selectedActionId);
      if (found) return found;
    }
  }
  if (store.selectedLibrarySkillId) {
    // 寻找库模板
    return store.activeSkillLibrary.find(s => s.id === store.selectedLibrarySkillId);
  }
  return null;
});

const isLibraryMode = computed(() => {
  return !!store.selectedLibrarySkillId && !store.selectedActionId;
});

const isLibraryAggregateSkill = computed(() => {
  if (!isLibraryMode.value) return false;
  const value = targetData.value;
  return (
    value?.kind === 'group' ||
    value?.kind === 'attack_group' ||
    Array.isArray(value?.segments) ||
    Array.isArray(value?.attackSegments)
  );
});

watch(
  targetData,
  value => {
    if (value) {
      ensureActionLikeModel(value, { deleteLegacy: false, aliasStyle: 'camel' });
    }
  },
  { immediate: true },
);

const currentCharacter = computed(() => {
  if (!targetData.value) return null;

  if (!isLibraryMode.value) {
    const track = store.tracks.find(t =>
      t.actions.some(a => a.instanceId === store.selectedActionId),
    );
    if (!track) return null;
    return store.characterRoster.find(c => c.id === track.id);
  }

  if (store.activeTrackIndex !== null && store.activeTrackIndex !== undefined) {
    const track = store.tracks[store.activeTrackIndex];
    if (track?.id) return store.characterRoster.find(c => c.id === track.id);
  }

  if (store.activeTrackId) {
    return store.characterRoster.find(c => c.id === store.activeTrackId);
  }
  return null;
});

const currentSkillType = computed(() => {
  return toLegacyDisplayType(targetData.value?.type) || 'unknown';
});

// === 分段连携 ===
const isComboInstance = computed(() => {
  if (isLibraryMode.value) return false;
  const a = targetData.value;
  if (!a) return false;
  const idx = Number(a.comboSegmentIndex) || 0;
  const total = Number(a.comboSegmentTotal) || 0;
  return !!a.comboGroupId && idx > 0 && total >= 2 && idx <= total;
});

const comboLinked = computed(() => {
  if (!isComboInstance.value) return false;
  return targetData.value.comboLinked !== false;
});

const isComboSeg1 = computed(() => {
  if (!isComboInstance.value) return false;
  return Number(targetData.value.comboSegmentIndex) === 1;
});

const isComboHasNext = computed(() => {
  if (!isComboInstance.value) return false;
  const idx = Number(targetData.value.comboSegmentIndex) || 0;
  const total = Number(targetData.value.comboSegmentTotal) || 0;
  return idx > 0 && total > 0 && idx < total;
});

const comboSegmentText = computed(() => {
  if (!isComboInstance.value) return '';
  const idx = Number(targetData.value.comboSegmentIndex) || 0;
  const total = Number(targetData.value.comboSegmentTotal) || 2;
  return `${idx}/${total}`;
});

function toggleComboLinked() {
  if (!isComboInstance.value) return;
  updateActionProp('comboLinked', !comboLinked.value);
}

// === 统一更新函数===
function commitUpdate(payload) {
  if (!targetData.value) return;

  if (isLibraryMode.value) {
    // Update character library override
    store.updateLibrarySkill(targetData.value.id, payload);
  } else {
    store.updateAction(store.selectedActionId, payload);
  }
}

// === 异常状态相关 ===

function ensureHitUiKey(hit) {
  if (!hit || typeof hit !== 'object') return;
  const desc = Object.getOwnPropertyDescriptor(hit, '_editorId');
  if (!desc) {
    Object.defineProperty(hit, '_editorId', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: createHitModelId(),
    });
  }
}

const editableHits = computed({
  get: () => {
    const hits = normalizeHits(targetData.value?.hits || [], targetData.value?.element);
    hits.forEach(ensureHitUiKey);
    return filterEditorVisibleHits(hits);
  },
  set: val =>
    commitUpdate({
      hits: mergeEditorVisibleHits(targetData.value?.hits || [], val, targetData.value?.element),
    }),
});

const editingHit = computed(() => {
  if (editingHitIndex.value === null) return null;
  return editableHits.value[editingHitIndex.value] || null;
});

const activeAnomalyId = computed(() => {
  return isLibraryMode.value ? localSelectedAnomalyId.value : store.selectedAnomalyId;
});

const currentSelectedCoords = computed(() => {
  if (!activeAnomalyId.value || !targetData.value) return null;

  for (let r = 0; r < editableHits.value.length; r++) {
    const row = Array.isArray(editableHits.value[r]?.effects) ? editableHits.value[r].effects : [];
    const c = row.findIndex(e => e?._id === activeAnomalyId.value);
    if (c !== -1) return { rowIndex: r, colIndex: c };
  }
  return null;
});

const editingEffectData = computed(() => {
  const coords = currentSelectedCoords.value;
  if (!coords) return null;
  return editableHits.value[coords.rowIndex]?.effects?.[coords.colIndex] || null;
});

const totalStagger = computed(() => {
  return editableHits.value.reduce((acc, hit) => acc + (Number(hit?.stagger) || 0), 0);
});

const totalSpGain = computed(() => {
  return editableHits.value.reduce(
    (acc, hit) => acc + (Number(hit?.spRecovery) || 0) + (Number(hit?.spReturn) || 0),
    0,
  );
});

function isEditing(r, c) {
  const coords = currentSelectedCoords.value;
  return coords && coords.rowIndex === r && coords.colIndex === c;
}

// ===================================================================================
// 3. 技能与更新逻辑
// ===================================================================================

function toggleEditEffect(r, c) {
  const effect = editableHits.value[r]?.effects?.[c];
  if (!effect) return;
  ensureEffectId(effect);

  const targetId = effect._id;

  if (isLibraryMode.value) {
    // 库模式：使用本地状态
    localSelectedAnomalyId.value = localSelectedAnomalyId.value === targetId ? null : targetId;
  } else {
    // 实例模式：使用 Store 状态
    if (store.selectedAnomalyId === targetId) {
      store.setSelectedAnomalyId(null);
    } else {
      store.selectAnomaly(store.selectedActionId, r, c);
    }
  }
}

function updateEffectProp(key, value) {
  const coords = currentSelectedCoords.value;
  if (!coords) return;
  const { rowIndex, colIndex } = coords;
  const hits = JSON.parse(JSON.stringify(editableHits.value));
  const effect = hits[rowIndex]?.effects?.[colIndex];
  if (effect) {
    effect[key] = value;
    editableHits.value = hits;
  }
}

function updateEffectFrameProp(key, value) {
  updateEffectProp(key, timeValueFromFrame(value));
}

function commitEditableHits() {
  editableHits.value = editableHits.value;
}

function updateEffectType(value) {
  const coords = currentSelectedCoords.value;
  if (!coords) return;
  const { rowIndex, colIndex } = coords;
  const hits = JSON.parse(JSON.stringify(editableHits.value));
  const effect = hits[rowIndex]?.effects?.[colIndex];
  if (!effect) return;
  hits[rowIndex].effects[colIndex] = retypeEditorEffect(effect, value);
  editableHits.value = hits;
}

function addRow() {
  const newEffect = createEditorEffect('default');
  const nextHits = [
    ...editableHits.value,
    createEditorHit({ element: targetData.value?.element, effects: [newEffect] }),
  ];
  editableHits.value = nextHits;
  if (newEffect) {
    if (isLibraryMode.value) localSelectedAnomalyId.value = newEffect._id;
    else store.setSelectedAnomalyId(newEffect._id);
  }
}

function addEffectToRow(rowIndex) {
  const hits = JSON.parse(JSON.stringify(editableHits.value));
  if (!hits[rowIndex]) return;

  const newEffect = createEditorEffect('default');
  if (!Array.isArray(hits[rowIndex].effects)) hits[rowIndex].effects = [];
  hits[rowIndex].effects.push(newEffect);
  editableHits.value = hits;

  if (isLibraryMode.value) localSelectedAnomalyId.value = newEffect._id;
  else store.setSelectedAnomalyId(newEffect._id);
}

function removeEffect(r, c) {
  const hits = JSON.parse(JSON.stringify(editableHits.value));
  if (!hits[r]?.effects?.[c]) return;
  hits[r].effects.splice(c, 1);
  editableHits.value = hits;
  if (!isLibraryMode.value) store.removeAnomaly(store.selectedActionId, r, c);
  store.setSelectedAnomalyId(null);
  localSelectedAnomalyId.value = null;
}

function updateActionProp(key, value) {
  commitUpdate({ [key]: value });
}

function frameValue(value) {
  return timeToFrame(value);
}

function timeValueFromFrame(value) {
  return frameToTime(value);
}

function updateActionFrameProp(key, value) {
  updateActionProp(key, timeValueFromFrame(value));
}

function addDamageTick() {
  const currentTicks = [
    ...editableHits.value,
    createEditorHit({ element: targetData.value?.element }),
  ];
  editableHits.value = currentTicks;
  isTicksExpanded.value = true;
}

function removeDamageTick(index) {
  const currentTicks = [...editableHits.value];
  currentTicks.splice(index, 1);
  editableHits.value = currentTicks;
}

function updateDamageTick(index, key, value) {
  const currentTicks = JSON.parse(JSON.stringify(editableHits.value));
  if (!currentTicks[index]) return;
  if (key === 'sp') {
    if (currentTicks[index].spKind === 'refund') {
      currentTicks[index].spReturn = Number(value) || 0;
      currentTicks[index].spRecovery = 0;
    } else {
      currentTicks[index].spRecovery = Number(value) || 0;
      currentTicks[index].spReturn = 0;
    }
  } else if (key === 'spKind') {
    const currentValue =
      Number(currentTicks[index].spReturn) || Number(currentTicks[index].spRecovery) || 0;
    currentTicks[index].spReturn = value === 'refund' ? currentValue : 0;
    currentTicks[index].spRecovery = value === 'refund' ? 0 : currentValue;
    currentTicks[index].spKind = value;
  } else {
    currentTicks[index] = { ...currentTicks[index], [key]: value };
  }
  if (key === 'offset') {
    currentTicks.sort((a, b) => a.offset - b.offset);
  }
  editableHits.value = currentTicks;
}

function updateDamageTickFrame(index, key, value) {
  updateDamageTick(index, key, timeValueFromFrame(value));
}

function openHitEditor(index) {
  editingHitIndex.value = index;
  hitEditorVisible.value = true;
}

function saveHitFromDialog(hit) {
  if (editingHitIndex.value === null) return;
  const hits = editableHits.value.map((existing, index) =>
    index === editingHitIndex.value ? hit : existing,
  );
  editableHits.value = hits;
}

function deleteHitFromDialog() {
  if (editingHitIndex.value === null) return;
  removeDamageTick(editingHitIndex.value);
  hitEditorVisible.value = false;
}

const customBarsList = computed(() => targetData.value?.customBars || []);

function addCustomBar() {
  const newList = [...customBarsList.value];
  newList.push({ text: '', duration: 1, offset: 0 });
  commitUpdate({ customBars: newList });
  isBarsExpanded.value = true;
}

function removeCustomBar(index) {
  const newList = [...customBarsList.value];
  newList.splice(index, 1);
  commitUpdate({ customBars: newList });
}

function updateCustomBarItem(index, key, value) {
  const newList = [...customBarsList.value];
  newList[index] = { ...newList[index], [key]: value };
  commitUpdate({ customBars: newList });
}

function updateCustomBarFrame(index, key, value) {
  updateCustomBarItem(index, key, timeValueFromFrame(value));
}

// ===================================================================================
// 4. 资源与连线查询
// ===================================================================================

const effectNameMessages = computed(() => {
  const messages = tm('effects.name');
  return messages && typeof messages === 'object' && !Array.isArray(messages) ? messages : {};
});

const allEffectDisplayKeys = computed(() => {
  const keys = new Set([
    ...Object.keys(effectNameMessages.value),
    ...Object.keys(store.iconDatabase || {}),
  ]);
  keys.delete('default');
  return [...keys];
});

const iconOptions = computed(() => {
  const availableKeys = allEffectDisplayKeys.value;

  const groups = [];
  const processedKeys = new Set();
  if (currentCharacter.value && currentCharacter.value.exclusive_buffs) {
    const exclusiveOpts = currentCharacter.value.exclusive_buffs.map(buff => ({
      label: `★ ${buff.name}`,
      value: buff.key,
      path: buff.path,
    }));
    exclusiveOpts.forEach(opt => {
      opt.label = String(opt.label || '').replace(/^.\?/, '');
      processedKeys.add(opt.value);
    });
    if (exclusiveOpts.length > 0)
      groups.push({ label: t('effects.group.exclusive'), options: exclusiveOpts });
  }

  GROUP_DEFINITIONS.value.forEach(def => {
    const groupKeys = availableKeys.filter(key => {
      if (processedKeys.has(key)) return false;
      if (def.keys && def.keys.includes(key)) return true;
      if (def.matcher && def.matcher(key)) return true;
      return false;
    });
    if (groupKeys.length > 0) {
      groupKeys.forEach(k => processedKeys.add(k));
      groups.push({
        label: def.label,
        options: groupKeys.map(key => ({
          label: getEffectDisplayName(key),
          value: key,
          path: store.iconDatabase[key] || store.iconDatabase.default,
        })),
      });
    }
  });

  const remainingKeys = availableKeys.filter(k => !processedKeys.has(k));
  if (remainingKeys.length > 0) {
    groups.push({
      label: t('effects.group.other'),
      options: remainingKeys.map(key => ({
        label: getEffectDisplayName(key),
        value: key,
        path: store.iconDatabase[key] || store.iconDatabase.default,
      })),
    });
  }
  return groups;
});

function getIconPath(type, charId = null) {
  for (const candidate of getDisplayKeyCandidates(type)) {
    if (store.iconDatabase[candidate]) return store.iconDatabase[candidate];
  }
  const targetChar = charId
    ? store.characterRoster.find(c => c.id === charId)
    : currentCharacter.value;
  if (targetChar && targetChar.exclusive_buffs) {
    for (const candidate of getDisplayKeyCandidates(type)) {
      const exclusive = targetChar.exclusive_buffs.find(b => b.key === candidate);
      if (exclusive) return exclusive.path;
    }
  }
  return store.iconDatabase['default'] || '';
}

const relevantConnections = computed(() => {
  if (isLibraryMode.value) return [];

  const selectedActionId = store.selectedActionId;
  if (!selectedActionId) return [];

  const getEndpointId = (conn, side) => {
    if (!conn) return null;
    if (side === 'from') return conn.fromNodeId || conn.fromEffectId || conn.from || null;
    return conn.toNodeId || conn.toEffectId || conn.to || null;
  };

  const matchesSelectedAction = (nodeWrap, actionId) => {
    if (!nodeWrap || !actionId) return false;
    if (nodeWrap.type === 'action') return nodeWrap.id === actionId;
    if (nodeWrap.type === 'effect') return nodeWrap.actionId === actionId;
    return false;
  };

  const getActionName = nodeWrap => {
    if (!nodeWrap) return '';
    if (nodeWrap.type === 'action') return nodeWrap.node?.name || '';
    if (nodeWrap.type === 'effect') {
      const action = store.getActionById(nodeWrap.actionId)?.node;
      return action?.name || '';
    }
    return '';
  };

  const getCharIdByNode = nodeWrap => {
    if (!nodeWrap) return null;
    if (nodeWrap.type === 'action') return nodeWrap.trackId;
    if (nodeWrap.type === 'effect') return store.getActionById(nodeWrap.actionId)?.trackId || null;
    return null;
  };

  return store.connections
    .map(conn => {
      const fromId = getEndpointId(conn, 'from');
      const toId = getEndpointId(conn, 'to');
      if (!fromId || !toId) return null;

      const fromNode = store.resolveNode(fromId);
      const toNode = store.resolveNode(toId);
      if (!fromNode || !toNode) return null;

      const fromMatch = matchesSelectedAction(fromNode, selectedActionId);
      const toMatch = matchesSelectedAction(toNode, selectedActionId);
      if (!fromMatch && !toMatch) return null;

      const isOutgoing = fromMatch && !toMatch ? true : fromMatch && toMatch;
      const myNode = isOutgoing ? fromNode : toNode;
      const otherNode = isOutgoing ? toNode : fromNode;
      const myCharId = getCharIdByNode(myNode);
      const otherCharId = getCharIdByNode(otherNode);

      const myIconPath = myNode.type === 'effect' ? getIconPath(myNode.node?.type, myCharId) : null;
      const otherIconPath =
        otherNode.type === 'effect' ? getIconPath(otherNode.node?.type, otherCharId) : null;

      return {
        id: conn.id,
        direction: isOutgoing ? t('connection.direction.to') : t('connection.direction.from'),
        isOutgoing,
        rawConnection: conn,
        otherActionName: getActionName(otherNode),
        myIconPath,
        otherIconPath,
      };
    })
    .filter(Boolean);
});
function updateConnPort(connId, type, event) {
  const val = event.target.value;
  store.updateConnectionPort(connId, type, val);
}

function handleStartConnection(id, type = null) {
  if (connectionHandler.isDragging.value) {
    connectionHandler.cancelDrag();
    return;
  }

  const resolvedType = type || store.resolveNode(id)?.type;

  let rect = null;
  if (resolvedType === 'action') {
    rect = store.nodeRects?.[id]?.rect || null;
  } else if (resolvedType === 'effect') {
    rect = store.effectLayouts.get(id)?.rect || null;
  }

  if (!rect) {
    return;
  }

  const point = getRectPos(rect, 'right');
  connectionHandler.newConnectionFrom(point, id, 'right');
}
</script>

<template>
  <div class="properties-panel">
    <div class="panel-header">
      <div class="header-main-row">
        <div class="left-group">
          <div class="header-icon-bar"></div>
          <h3 class="char-name">
            {{ targetData ? targetData.name : t('propertiesPanel.noSelection') }}
          </h3>
          <span v-if="targetData && isLibraryMode" class="mode-badge">{{
            t('propertiesPanel.globalMode')
          }}</span>
        </div>
        <div class="header-actions">
          <button type="button" class="header-tool-btn" @click="handleResetPanel">
            <svg
              viewBox="0 0 24 24"
              width="11"
              height="11"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
      </div>
      <div class="header-divider"></div>
    </div>

    <div v-if="targetData" class="scrollable-content">
      <div class="section-container tech-style">
        <div class="panel-tag-mini">{{ t('propertiesPanel.sections.basic') }}</div>
        <div class="attribute-grid">
          <div class="form-group compact">
            <label>{{ t('propertiesPanel.labels.durationS') }}</label>
            <CustomNumberInput
              :model-value="frameValue(targetData.duration)"
              @update:model-value="val => updateActionFrameProp('duration', val)"
              :step="1"
              :min="0"
              :activeColor="HIGHLIGHT_COLORS.default"
              text-align="center"
            />
          </div>
          <div class="form-group compact" v-if="currentSkillType === 'link'">
            <label>{{ t('propertiesPanel.labels.cooldownS') }}</label>
            <CustomNumberInput
              :model-value="frameValue(targetData.cooldown)"
              @update:model-value="val => updateActionFrameProp('cooldown', val)"
              :step="1"
              :min="0"
              :activeColor="HIGHLIGHT_COLORS.default"
              text-align="center"
            />
          </div>

          <div class="form-group compact" v-if="isComboInstance">
            <label>{{ t('propertiesPanel.labels.comboSegment') }}</label>
            <div class="combo-hint">{{ comboSegmentText }}</div>
          </div>

          <div class="form-group compact" v-if="isComboInstance">
            <label>{{ t('propertiesPanel.labels.comboLink') }}</label>
            <button
              type="button"
              class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-gold ea-btn--glass-rect-accent"
              @click.stop="toggleComboLinked"
            >
              {{
                comboLinked ? t('propertiesPanel.combo.unlink') : t('propertiesPanel.combo.relink')
              }}
            </button>
          </div>

          <div
            class="form-group compact"
            v-if="currentSkillType === 'link' && isComboHasNext && comboLinked"
          >
            <label>{{ t('propertiesPanel.labels.followupDelayS') }}</label>
            <CustomNumberInput
              :model-value="frameValue(targetData.comboFollowupDelay || 0)"
              @update:model-value="val => updateActionFrameProp('comboFollowupDelay', val)"
              :min="0"
              :step="1"
              :activeColor="HIGHLIGHT_COLORS.default"
              text-align="center"
            />
          </div>

          <div class="form-group compact" v-if="currentSkillType === 'link' && !isLibraryMode">
            <label>{{ t('propertiesPanel.labels.triggerWindowS') }}</label>
            <CustomNumberInput
              :model-value="frameValue(targetData.triggerWindow || 0)"
              @update:model-value="val => updateActionFrameProp('triggerWindow', val)"
              :step="1"
              :border-color="HIGHLIGHT_COLORS.default"
              text-align="center"
            />
          </div>

          <div class="form-group compact" v-if="currentSkillType === 'skill'">
            <label>{{ t('propertiesPanel.labels.spCost') }}</label>
            <CustomNumberInput
              :model-value="targetData.spCost"
              @update:model-value="val => updateActionProp('spCost', val)"
              :min="0"
              :border-color="HIGHLIGHT_COLORS.default"
              text-align="center"
            />
          </div>

          <div class="form-group compact" v-if="currentSkillType === 'ultimate'">
            <label>{{ t('propertiesPanel.labels.gaugeCost') }}</label>
            <CustomNumberInput
              :model-value="targetData.gaugeCost"
              @update:model-value="val => updateActionProp('gaugeCost', val)"
              :min="0"
              :border-color="HIGHLIGHT_COLORS.blue"
              text-align="center"
            />
          </div>

          <div class="form-group compact" v-if="currentSkillType === 'ultimate'">
            <label>{{ t('propertiesPanel.labels.enhancementTimeS') }}</label>
            <CustomNumberInput
              :model-value="frameValue(targetData.enhancementTime || 0)"
              @update:model-value="val => updateActionFrameProp('enhancementTime', val)"
              :step="1"
              :min="0"
              activeColor="#b37feb"
              border-color="#b37feb"
              text-align="center"
            />
          </div>
        </div>
      </div>

      <div
        v-if="!isLibraryAggregateSkill"
        class="section-container tech-style border-red"
        @click="isTicksExpanded = !isTicksExpanded"
        style="cursor: pointer"
      >
        <div class="panel-tag-mini red">
          {{ t('propertiesPanel.damage.title') }} ({{ editableHits.length }})
        </div>

        <div class="section-header-tech">
          <div class="section-summary">
            {{ t('propertiesPanel.damage.stagger') }}: {{ totalStagger }} |
            {{ t('propertiesPanel.damage.sp') }}: {{ totalSpGain }}
          </div>
          <div class="spacer"></div>
          <button
            class="ea-btn ea-btn--icon ea-btn--icon-22 ea-btn--icon-plus ea-btn--icon-plus-red"
            @click.stop="addDamageTick"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <el-icon :class="{ 'is-rotated': isTicksExpanded }" class="toggle-arrow"
            ><ArrowRight
          /></el-icon>
        </div>

        <div v-if="isTicksExpanded" class="section-content-tech" @click.stop>
          <div v-if="editableHits.length === 0" class="empty-hint">
            {{ t('propertiesPanel.damage.empty') }}
          </div>
          <div
            v-for="(tick, index) in editableHits"
            :key="tick._editorId || index"
            class="tick-item red-theme"
          >
            <div class="tick-header">
              <span class="tick-idx">HIT {{ index + 1 }}</span>
              <div class="tick-actions">
                <button
                  type="button"
                  class="ea-btn ea-btn--icon ea-btn--icon-18 ea-btn--glass-rect ea-btn--accent-gold"
                  :title="t('hitEditor.open')"
                  @click="openHitEditor(index)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="ea-btn ea-btn--icon ea-btn--icon-18 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger"
                  @click="removeDamageTick(index)"
                >
                  x
                </button>
              </div>
            </div>
            <div class="hit-summary-grid">
              <span
                >{{ t('propertiesPanel.damage.tickTime') }}: {{ frameValue(tick.offset) }}f</span
              >
              <span
                >{{ t('propertiesPanel.damage.tickMultiplier') }}: {{ tick.multiplier || 0 }}%</span
              >
              <span>{{ t('common.element') }}: {{ getHitElementLabel(tick) }}</span>
              <span>{{ t('propertiesPanel.damage.tickStagger') }}: {{ tick.stagger || 0 }}</span>
              <span
                >{{ t('propertiesPanel.damage.tickSpGain') }}: {{ tick.sp || 0 }}
                {{
                  tick.spKind === 'refund'
                    ? t('propertiesPanel.damage.spKindRefundShort')
                    : t('propertiesPanel.damage.spKindRecoverShort')
                }}</span
              >
              <span>{{ t('hitEditor.effects') }}: {{ tick.effects?.length || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="true"
        class="section-container tech-style border-blue"
        @click="isBarsExpanded = !isBarsExpanded"
        style="cursor: pointer"
      >
        <div class="panel-tag-mini blue">
          {{ t('propertiesPanel.bars.title') }} ({{ customBarsList.length }})
        </div>

        <div class="section-header-tech">
          <div class="spacer"></div>
          <button
            class="ea-btn ea-btn--icon ea-btn--icon-22 ea-btn--icon-plus ea-btn--icon-plus-cyan"
            @click.stop="addCustomBar"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <el-icon :class="{ 'is-rotated': isBarsExpanded }" class="toggle-arrow"
            ><ArrowRight
          /></el-icon>
        </div>

        <div v-if="isBarsExpanded" class="section-content-tech" @click.stop>
          <div v-if="customBarsList.length === 0" class="empty-hint">
            {{ t('propertiesPanel.bars.empty') }}
          </div>
          <div v-for="(bar, index) in customBarsList" :key="index" class="tick-item blue-theme">
            <div class="tick-header">
              <input
                type="text"
                :value="bar.text"
                @input="e => updateCustomBarItem(index, 'text', e.target.value)"
                :placeholder="t('propertiesPanel.bars.namePlaceholder')"
                class="simple-input"
              />
              <button
                type="button"
                class="ea-btn ea-btn--icon ea-btn--icon-18 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger"
                @click="removeCustomBar(index)"
              >
                x
              </button>
            </div>
            <div class="tick-row">
              <div class="tick-col">
                <label>{{ t('propertiesPanel.bars.offsetS') }}</label>
                <CustomNumberInput
                  :model-value="frameValue(bar.offset)"
                  @update:model-value="val => updateCustomBarFrame(index, 'offset', val)"
                  :step="1"
                  :min="0"
                  border-color="#00e5ff"
                />
              </div>
              <div class="tick-col">
                <label>{{ t('propertiesPanel.bars.durationS') }}</label>
                <CustomNumberInput
                  :model-value="frameValue(bar.duration)"
                  @update:model-value="val => updateCustomBarFrame(index, 'duration', val)"
                  :step="1"
                  :min="0"
                  border-color="#00e5ff"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="false" class="section-container tech-style">
        <div class="panel-tag-mini">{{ t('propertiesPanel.effects.title') }}</div>
        <div
          class="anomalies-editor-container"
          style="background: transparent; border-color: rgba(255, 255, 255, 0.1); margin-top: 10px"
        >
          <draggable
            v-model="editableHits"
            item-key="_editorId"
            class="rows-container"
            handle=".row-handle"
            :animation="200"
          >
            <template #item="{ element: row, index: rowIndex }">
              <div class="anomaly-editor-row">
                <div class="row-handle">::</div>
                <draggable
                  :list="row.effects"
                  item-key="_id"
                  class="row-items-list"
                  :group="{ name: 'effects' }"
                  :animation="150"
                  @change="commitEditableHits"
                >
                  <template #item="{ element: effect, index: colIndex }">
                    <div
                      class="icon-wrapper"
                      :class="{ 'is-editing': isEditing(rowIndex, colIndex) }"
                      @click="toggleEditEffect(rowIndex, colIndex)"
                    >
                      <img :src="getIconPath(effect)" class="mini-icon" />
                      <div v-if="effect.stacks > 1" class="mini-stacks">{{ effect.stacks }}</div>
                    </div>
                  </template>
                </draggable>
                <button
                  class="ea-btn ea-btn--icon ea-btn--icon-24 ea-btn--icon-plus"
                  @click="addEffectToRow(rowIndex)"
                  :title="t('propertiesPanel.effects.addEffect')"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            </template>
          </draggable>
          <button class="add-effect-bar" @click="addRow">
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>{{ t('propertiesPanel.effects.addRow') }}</span>
          </button>
        </div>

        <div
          v-if="editingEffectData && currentSelectedCoords"
          class="effect-detail-editor-embedded"
        >
          <div class="editor-arrow"></div>
          <div class="editor-header-mini">
            <div class="header-tag"></div>
            <span>{{
              t('propertiesPanel.effects.editing', {
                row: currentSelectedCoords.rowIndex + 1,
                col: currentSelectedCoords.colIndex + 1,
              })
            }}</span>
            <div class="spacer"></div>
            <button
              class="close-btn"
              @click="
                isLibraryMode ? (localSelectedAnomalyId = null) : store.setSelectedAnomalyId(null)
              "
            >
              {{ t('common.close') }}
            </button>
          </div>

          <div class="editor-grid">
            <div class="full-width-col">
              <label>{{ t('common.type') }}</label>
              <el-select
                :model-value="resolveEffectDisplayKey(editingEffectData)"
                @update:model-value="updateEffectType"
                :placeholder="t('propertiesPanel.effects.selectPlaceholder')"
                filterable
                size="small"
                class="effect-select-dark"
              >
                <el-option-group
                  v-for="group in iconOptions"
                  :key="group.label"
                  :label="group.label"
                >
                  <el-option
                    v-for="item in group.options"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  >
                    <div class="opt-row">
                      <img :src="item.path" /><span>{{ item.label }}</span>
                    </div>
                  </el-option>
                </el-option-group>
              </el-select>
            </div>

            <div>
              <label>{{ t('common.triggerTime') }}</label>
              <CustomNumberInput
                :model-value="frameValue(editingEffectData.offset || 0)"
                @update:model-value="val => updateEffectFrameProp('offset', val)"
                :step="1"
                :min="0"
                :activeColor="HIGHLIGHT_COLORS.default"
              />
            </div>
            <div>
              <label>{{ t('common.stacks') }}</label>
              <CustomNumberInput
                :model-value="editingEffectData.stacks"
                @update:model-value="val => updateEffectProp('stacks', val)"
                :min="1"
                :activeColor="HIGHLIGHT_COLORS.default"
              />
            </div>
            <div>
              <label>{{ t('common.duration') }}</label>
              <CustomNumberInput
                :model-value="frameValue(editingEffectData.duration)"
                @update:model-value="val => updateEffectFrameProp('duration', val)"
                :min="0"
                :step="1"
                :activeColor="HIGHLIGHT_COLORS.default"
              />
            </div>
            <div v-if="canEditEditorEffectValue(editingEffectData)">
              <label>{{ t('common.value') }}</label>
              <CustomNumberInput
                :model-value="editingEffectData.value || 0"
                @update:model-value="val => updateEffectProp('value', Number(val) || 0)"
                :activeColor="HIGHLIGHT_COLORS.default"
              />
            </div>
          </div>

          <div class="editor-actions">
            <button
              v-if="!isLibraryMode"
              class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-gold ea-btn--glass-rect-accent"
              @click.stop="handleStartConnection(activeAnomalyId, 'effect')"
              :class="{
                'is-linking':
                  connectionHandler.isDragging.value &&
                  connectionHandler.state.value.sourceId === activeAnomalyId,
              }"
            >
              {{ t('connection.connect') }}
            </button>
            <button
              class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger"
              @click="removeEffect(currentSelectedCoords.rowIndex, currentSelectedCoords.colIndex)"
            >
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="!isLibraryMode" class="section-container tech-style">
        <div class="panel-tag-mini">{{ t('propertiesPanel.connections.title') }}</div>

        <div class="connection-header-group">
          <div class="section-summary">
            {{ t('propertiesPanel.connections.currentCount') }}: {{ relevantConnections.length }}
          </div>
          <div class="spacer"></div>

          <button
            class="ea-btn ea-btn--sm ea-btn--glass-rect ea-btn--accent-gold ea-btn--glass-rect-accent"
            @click.stop="handleStartConnection(store.selectedActionId)"
            :class="{
              'is-linking':
                connectionHandler.isDragging.value &&
                connectionHandler.state.value.sourceId === store.selectedActionId,
            }"
          >
            <span class="plus-icon"
              ><svg
                viewBox="0 0 24 24"
                width="10"
                height="10"
                fill="none"
                stroke="currentColor"
                stroke-width="4"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line></svg
            ></span>
            {{
              connectionHandler.isDragging.value
                ? t('propertiesPanel.connections.chooseTarget')
                : t('propertiesPanel.connections.new')
            }}
          </button>
        </div>

        <div v-if="relevantConnections.length === 0" class="empty-hint">
          {{ t('propertiesPanel.connections.empty') }}
        </div>

        <div class="connections-list">
          <div
            v-for="conn in relevantConnections"
            :key="conn.id"
            class="connection-card"
            :class="{ outgoing: conn.isOutgoing, incoming: !conn.isOutgoing }"
          >
            <div class="conn-vis">
              <div class="node">
                <img
                  v-if="conn.isOutgoing ? conn.myIconPath : conn.otherIconPath"
                  :src="conn.isOutgoing ? conn.myIconPath : conn.otherIconPath"
                  class="icon-s"
                />
                <span class="text-s">{{
                  conn.isOutgoing
                    ? targetData.name || t('propertiesPanel.connections.thisSkill')
                    : conn.otherActionName
                }}</span>
              </div>
              <div class="direction-tag" :class="conn.isOutgoing ? 'to' : 'from'">
                {{ conn.direction }}
              </div>
              <div class="node right">
                <span class="text-s">{{
                  conn.isOutgoing
                    ? conn.otherActionName
                    : targetData.name || t('propertiesPanel.connections.thisSkill')
                }}</span>
                <img
                  v-if="conn.isOutgoing ? conn.otherIconPath : conn.myIconPath"
                  :src="conn.isOutgoing ? conn.otherIconPath : conn.myIconPath"
                  class="icon-s"
                />
              </div>
            </div>

            <div class="conn-row-ports">
              <div class="port-config">
                <div class="port-select-wrapper">
                  <span class="port-label">{{ t('propertiesPanel.connections.outPort') }}</span>
                  <select
                    class="mini-select"
                    :value="conn.rawConnection.sourcePort || 'right'"
                    @change="e => updateConnPort(conn.id, 'source', e)"
                  >
                    <option v-for="opt in PORT_OPTIONS" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
                <span class="port-arrow">>></span>
                <div class="port-select-wrapper">
                  <span class="port-label">{{ t('propertiesPanel.connections.inPort') }}</span>
                  <select
                    class="mini-select"
                    :value="conn.rawConnection.targetPort || 'left'"
                    @change="e => updateConnPort(conn.id, 'target', e)"
                  >
                    <option v-for="opt in PORT_OPTIONS" :key="opt.value" :value="opt.value">
                      {{ opt.label }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="conn-row-actions">
              <template v-if="conn.isOutgoing && conn.rawConnection.fromEffectIndex != null">
                <div
                  class="ea-btn ea-btn--glass-rect ea-btn--glass-rect-tag ea-btn--accent-gold ea-btn--glass-rect-hover-accent"
                  :class="{ active: conn.rawConnection.isConsumption }"
                  @click="
                    store.updateConnection(conn.id, {
                      isConsumption: !conn.rawConnection.isConsumption,
                    })
                  "
                >
                  {{
                    conn.rawConnection.isConsumption
                      ? t('propertiesPanel.connections.consumed')
                      : t('propertiesPanel.connections.consume')
                  }}
                </div>

                <div v-if="conn.rawConnection.isConsumption" class="offset-mini">
                  <span
                    style="color: #666; font-size: 10px; margin-right: 2px; white-space: nowrap"
                    >{{ t('propertiesPanel.connections.offset') }}</span
                  >
                  <CustomNumberInput
                    :model-value="frameValue(conn.rawConnection.consumptionOffset || 0)"
                    @update:model-value="
                      val =>
                        store.updateConnection(conn.id, {
                          consumptionOffset: timeValueFromFrame(val),
                        })
                    "
                    :step="0.1"
                    :min="-10"
                    :max="10"
                    active-color="#ffd700"
                    style="width: 50px"
                  />
                </div>
              </template>

              <div class="spacer"></div>
              <button
                class="ea-btn ea-btn--icon ea-btn--icon-18 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger"
                @click="store.removeConnection(conn.id)"
              >
                x
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <HitEditorDialog
      v-model:visible="hitEditorVisible"
      :hit="editingHit"
      :hit-index="editingHitIndex ?? -1"
      :default-element="targetData?.element"
      :effect-options="iconOptions"
      @save="saveHitFromDialog"
      @delete="deleteHitFromDialog"
    />
  </div>
</template>

<style scoped>
/* Base & Layout */
.properties-panel {
  --right-panel-container-radius: 0;
  padding: 15px;
  background-color: #252525;
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  font-size: 13px;
  color: #e0e0e0;
  transition: background-color 0.3s ease;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.properties-panel::-webkit-scrollbar {
  display: none;
}
.panel-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 0;
}
.header-main-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}
.left-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.header-icon-bar {
  width: 4px;
  height: 18px;
  background-color: #ffd700;
}
.char-name {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mode-badge {
  font-size: 10px;
  color: #888;
  background: #333;
  padding: 1px 4px;
  border-radius: 2px;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  margin-right: -2px;
}
.header-tool-btn {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.34);
  cursor: pointer;
  padding: 0;
  transition:
    color 0.14s ease,
    background-color 0.14s ease;
}
.header-tool-btn:hover {
  color: rgba(255, 255, 255, 0.86);
  background: rgba(255, 255, 255, 0.055);
}
.skill-type-minimal {
  font-size: 11px;
  color: #666;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  letter-spacing: 1px;
}
.mode-badge,
.skill-type-minimal {
  flex-shrink: 0;
  white-space: nowrap;
}
.header-divider {
  height: 2px;
  background: linear-gradient(90deg, #ffd700 0%, transparent 100%);
  opacity: 0.3;
  margin-top: 3px;
}

/* Sections */
.section-container {
  margin-bottom: 0;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
.section-container.tech-style {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 3px solid rgba(255, 255, 255, 0.2);
  padding: 12px;
  position: relative;
  overflow: visible !important;
  flex-shrink: 0;
  margin-top: 12px !important;
}
.section-container.tech-style.border-red {
  border-left-color: #ff7875 !important;
}
.section-container.tech-style.border-blue {
  border-left-color: #00e5ff !important;
}
.section-container.tech-style::before {
  content: '';
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 10px;
  height: 10px;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  pointer-events: none;
}
.section-header-tech {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  height: 26px;
  padding: 0 4px;
}
.section-summary {
  min-width: 0;
  color: rgba(255, 255, 255, 0.48);
  font-size: 10px;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toggle-arrow {
  color: #666;
  font-size: 14px;
  transition: transform 0.2s;
}
.section-content-tech {
  margin-top: 10px;
  animation: fadeIn 0.2s ease;
}
.tech-style .form-group.compact label {
  font-size: 11px !important;
  color: rgba(255, 255, 255, 0.5) !important;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px !important;
  font-family: 'Inter', sans-serif;
  display: block;
}
.tech-style .attribute-grid {
  gap: 8px 12px !important;
  padding: 8px 8px !important;
}
.attribute-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 10px;
}
.form-group.compact label {
  font-size: 10px;
  color: #999;
  margin-bottom: 2px;
  display: block;
}
.header-left label {
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
}
.empty-hint {
  font-size: 12px;
  color: #555;
  text-align: center;
  padding: 10px;
  font-style: italic;
}

/* Buttons & Inputs */
.simple-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid #555;
  color: #ccc;
  width: 100%;
  font-size: 12px;
  padding: 0 0 2px 0;
}
.simple-input:focus {
  outline: none;
  border-color: #00e5ff;
}

/* Ticks & Anomalies List */
.tick-item {
  background: rgba(255, 255, 255, 0.02) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  border-left: 3px solid rgba(255, 255, 255, 0.2) !important;
  padding: 10px !important;
  margin-bottom: 10px !important;
  position: relative;
  backdrop-filter: blur(5px);
  transition: all 0.2s;
  clip-path: polygon(0 0, 100% 0, 100% 90%, 97% 100%, 0 100%);
}
.tick-item.red-theme {
  border-left-color: #ff7875 !important;
  background: linear-gradient(90deg, rgba(255, 120, 117, 0.08) 0%, transparent 100%) !important;
}
.tick-item.blue-theme {
  border-left-color: #00e5ff !important;
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.08) 0%, transparent 100%) !important;
}
.tick-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 4px;
}
.tick-idx {
  font-size: 10px;
  font-weight: 900;
  font-family: 'Inter', monospace;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.tick-actions {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: auto;
}
.tick-row {
  display: flex;
  gap: 2px;
  align-items: flex-end;
}
.hit-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 8px;
  color: rgba(255, 255, 255, 0.74);
  font-size: 11px;
  line-height: 1.35;
}
.hit-summary-grid span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.binding-row {
  align-items: flex-start;
}
.tick-col {
  flex: 1;
  min-width: 0;
}
.binding-row .tick-col-kind {
  flex: 1 1 0;
}
.tick-col label {
  font-size: 9px !important;
  color: rgba(255, 255, 255, 0.3) !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px !important;
}
.tick-col.full-width {
  flex: 1;
}
.binding-row .tick-col.full-width {
  flex: 2 1 0;
}
.tick-kind-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  height: 28px;
}
.tick-kind-btn {
  height: 28px;
  box-sizing: border-box;
  appearance: none;
  -webkit-appearance: none;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #444;
  background: #111;
  color: rgba(255, 255, 255, 0.72);
  font-size: 10px;
  line-height: 1;
  padding: 0 4px;
  margin: 0;
  cursor: pointer;
  transition: all 0.15s ease;
}
.tick-kind-btn.is-active {
  border-color: #ffd700;
  color: #ffd700;
  background: rgba(255, 215, 0, 0.08);
}
.tick-select {
  width: 100%;
}
:deep(.tick-select .el-select__wrapper),
:deep(.tick-select .el-input__wrapper) {
  min-height: 28px;
  height: 28px;
  box-sizing: border-box;
  background-color: #111;
  box-shadow: none;
  border: 1px solid #444;
}
:deep(.tick-select .el-input__inner) {
  color: #eee;
  font-size: 11px;
}
:deep(.tick-select .el-select__selected-item) {
  font-size: 11px;
}
:deep(.tick-select .el-select__placeholder) {
  color: rgba(255, 255, 255, 0.4);
}
:deep(.el-select-dropdown__item) {
  font-size: 11px;
}
.binding-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}
.binding-option__icon {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  object-fit: cover;
  background: #111;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  flex: 0 0 auto;
}
.binding-option__label {
  font-size: 12px;
  color: #e6e6e6;
}
.binding-option__hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  margin-left: 4px;
  white-space: nowrap;
  opacity: 0.95;
}
.anomalies-editor-container {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.anomaly-editor-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.02);
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 3px solid rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  position: relative;
  transition: all 0.2s;
  clip-path: polygon(0 0, 100% 0, 100% 85%, 98% 100%, 0 100%);
}
.anomaly-editor-row:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}
.row-handle {
  color: #555;
  cursor: grab;
  padding: 0 2px;
}
.row-items-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex-grow: 1;
}
.add-effect-bar {
  width: 100%;
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #888 !important;
  font-size: 11px !important;
  padding: 8px !important;
  margin-top: 10px;
  border-radius: 0 !important;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.add-effect-bar:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  color: #ccc !important;
  border-color: #ffd700 !important;
}
.add-effect-bar::before,
.add-effect-bar::after {
  content: '';
  position: absolute;
  width: 4px;
  height: 100%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s;
}
.add-effect-bar::before {
  left: 0;
  border-right: none;
}
.add-effect-bar::after {
  right: 0;
  border-left: none;
}
.add-effect-bar:hover::before,
.add-effect-bar:hover::after {
  border-color: #ffd700;
  width: 6px;
}
.icon-wrapper {
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-wrapper:hover {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.05);
}
.icon-wrapper.is-editing {
  border-color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.2);
}
.mini-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
.mini-stacks {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-size: 8px;
  padding: 0 2px;
  line-height: 1;
}

/* Embedded Editor */
.effect-detail-editor-embedded {
  margin-top: 12px;
  background: rgba(30, 30, 30, 0.9) !important;
  border: 1px solid rgba(255, 215, 0, 0.3);
  padding: 12px;
  position: relative;
  animation: fadeIn 0.2s ease;
  backdrop-filter: blur(8px);
  clip-path: polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%);
}
.editor-arrow {
  position: absolute;
  top: -6px;
  left: 24px;
  width: 10px;
  height: 10px;
  background: rgba(30, 30, 30, 0.9);
  border-left: 1px solid rgba(255, 215, 0, 0.3);
  border-top: 1px solid rgba(255, 215, 0, 0.3);
  transform: rotate(45deg);
}
.editor-header-mini {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 10px;
  color: #ffd700;
  font-weight: 800;
  letter-spacing: 1px;
}
.header-tag {
  width: 3px;
  height: 10px;
  background: #ffd700;
}
.close-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 11px;
  cursor: pointer;
  text-decoration: underline;
}
.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 16px;
  margin-bottom: 10px;
}
.full-width-col {
  grid-column: 1 / -1;
}
.editor-grid label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: block;
  margin-bottom: 6px;
}
.effect-select-dark {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}
:deep(.effect-select-dark .el-input__wrapper) {
  background-color: #111;
  box-shadow: none;
  border: 1px solid #444;
}
.opt-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.opt-row img {
  width: 16px;
  height: 16px;
}
.editor-actions {
  display: flex;
  gap: 8px;
}
.editor-actions .ea-btn {
  flex: 1;
}

/* Connection Cards - Optimized */
.connection-header-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.plus-icon {
  display: flex;
  align-items: center;
}
.connections-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}
.connection-card {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 3px solid #666;
  padding: 10px;
  position: relative;
  backdrop-filter: blur(5px);
  clip-path: polygon(0 0, 100% 0, 100% 90%, 97% 100%, 0 100%);
  transition: all 0.2s;
}
.connection-card:hover {
  background: rgba(255, 255, 255, 0.06) !important;
  border-color: rgba(255, 255, 255, 0.1);
}
.connection-card.outgoing {
  border-left-color: #ffd700 !important;
}
.connection-card.incoming {
  border-left-color: #00e5ff !important;
}
.conn-vis {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 4px;
}
.direction-tag {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 40px;
  text-align: center;
  opacity: 0.8;
  border: 1px solid transparent;
}
.direction-tag.to {
  color: #ffd700;
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.2);
}
.direction-tag.from {
  color: #00e5ff;
  background: rgba(0, 229, 255, 0.1);
  border-color: rgba(0, 229, 255, 0.2);
}
.node {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 38% !important;
  overflow: hidden;
}
.node.right {
  justify-content: flex-end;
}
.node.right .text-s {
  text-align: right;
  margin-right: 0;
}
.text-s {
  font-size: 11px;
  color: #eee;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
  min-width: 0;
}
.icon-s {
  width: 16px;
  height: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

/* Connection Tools Rows */
.conn-row-ports {
  padding: 4px 0 2px 0;
  display: flex;
  justify-content: center;
}
.conn-row-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  margin-top: 2px;
}
.port-config {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.4) !important;
  padding: 2px 10px !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px;
  width: fit-content;
}
.port-select-wrapper {
  display: flex;
  align-items: center;
  gap: 4px;
}
.mini-select {
  font-family: 'Inter', sans-serif;
  font-weight: bold;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.port-label {
  font-size: 9px;
  color: #666;
  font-weight: bold;
  text-transform: uppercase;
}
.mini-select {
  background: transparent;
  border: none;
  color: #aaa;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  padding: 0 2px;
  text-align: center;
  appearance: none;
  outline: none;
  transition: color 0.2s;
}
.mini-select:hover {
  color: #ffd700;
}
.mini-select option {
  background: #2a2a2a;
  color: #eee;
}
.port-arrow {
  font-size: 8px;
  color: #444;
  letter-spacing: -1px;
  font-weight: bold;
}
.offset-mini {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.spacer {
  flex: 1;
}

.mode-badge,
.header-tool-btn,
.skill-type-minimal,
.section-container,
.binding-option__icon,
.anomalies-editor-container,
.anomaly-editor-row,
.icon-wrapper,
.effect-select-dark,
.direction-tag,
.icon-s,
.port-config {
  border-radius: var(--right-panel-container-radius);
}

:deep(.tick-select .el-select__wrapper),
:deep(.tick-select .el-input__wrapper),
:deep(.effect-select-dark .el-select__wrapper),
:deep(.effect-select-dark .el-input__wrapper) {
  border-radius: var(--right-panel-container-radius);
}

.combo-hint {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #16161a;
  box-shadow: 0 0 0 1px #333 inset;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Roboto Mono', 'Consolas', monospace;
  font-size: 12px;
  user-select: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
:deep(.is-rotated) {
  transform: rotate(90deg);
  transition: transform 0.2s;
}
</style>
