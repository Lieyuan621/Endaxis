<script setup lang="ts">
/**
 * 旧版资源监控器的三段纵向骨架。每段内部仍共享“左侧状态摘要 / 右侧时间轴”坐标，
 * 本组件只负责段落折叠、比例调整与持久化，不解释任何战斗数据。
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { EaButton } from '../../../design-system/index';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import {
  MONITOR_RESIZE_HANDLE_REACH,
  monitorSectionBodyMinimums,
  resolveMonitorSectionLayout,
  resizeMonitorSectionBodies,
} from './monitorSectionMinimums';

type SectionKey = 'affliction' | 'poise' | 'sp';
const interactionSession = useInteractionSession();
const resizeHandleTop = `${-MONITOR_RESIZE_HANDLE_REACH}px`;
const resizeHandleHeight = `${MONITOR_RESIZE_HANDLE_REACH * 2}px`;

const COLLAPSE_STORAGE_KEY = 'endaxis:resource-monitor-section-collapse:v1';
const LAYOUT_STORAGE_KEY = 'endaxis:resource-monitor-sections:v1';
const sectionKeys: readonly SectionKey[] = ['affliction', 'poise', 'sp'];

const props = defineProps<{
  labels: Record<SectionKey, string>;
  collapseLabel: string;
  expandLabel: string;
  expandAllToken?: number;
}>();

const minimumBodyHeight = monitorSectionBodyMinimums();

const emit = defineEmits<{
  collapsePanel: [];
  collapsedCountChange: [count: number];
}>();

const collapsed = reactive<Record<SectionKey, boolean>>({
  affliction: false,
  poise: false,
  sp: false,
});

watch(
  () => sectionKeys.filter(key => collapsed[key]).length,
  count => emit('collapsedCountChange', count),
  { immediate: true },
);
const sectionWeights = reactive<Record<SectionKey, number>>({
  affliction: 2,
  poise: 1,
  sp: 3,
});
const root = ref<HTMLElement | null>(null);
const rootHeight = ref(0);
const activeResizeLowerKey = ref<SectionKey | null>(null);
let stopResize: (() => void) | null = null;
let resizeObserver: ResizeObserver | null = null;

const sectionLayout = computed(() =>
  resolveMonitorSectionLayout(rootHeight.value, collapsed, sectionWeights),
);

const resizePairs = computed(() => {
  const expanded = sectionKeys.filter(key => !collapsed[key]);
  return expanded.slice(1).map((lowerKey, index) => ({
    upperKey: expanded[index]!,
    lowerKey,
  }));
});

function resizePairForLower(lowerKey: SectionKey) {
  return resizePairs.value.find(pair => pair.lowerKey === lowerKey) ?? null;
}

function toggle(key: SectionKey): void {
  const next = {
    affliction: collapsed.affliction,
    poise: collapsed.poise,
    sp: collapsed.sp,
    [key]: !collapsed[key],
  };
  if (sectionKeys.every(sectionKey => next[sectionKey])) {
    for (const sectionKey of sectionKeys) collapsed[sectionKey] = false;
    emit('collapsePanel');
    return;
  }
  collapsed[key] = next[key];
}

// 侧栏重新打开监控区时恢复三段展开，但不重置拖动过的比例。
watch(
  () => props.expandAllToken,
  () => {
    for (const key of sectionKeys) collapsed[key] = false;
  },
);

function beginSectionResize(lowerKey: SectionKey, event: PointerEvent): void {
  if (event.button !== 0) return;
  const pair = resizePairForLower(lowerKey);
  if (pair === null || root.value === null) return;

  const lease = interactionSession.tryStart('monitor-section-resize', () => stopResize?.());
  if (lease === null) {
    event.preventDefault();
    return;
  }

  event.preventDefault();
  stopResize?.();
  activeResizeLowerKey.value = lowerKey;
  const startY = event.clientY;
  const previousCursor = document.body.style.cursor;
  const previousUserSelect = document.body.style.userSelect;
  document.body.style.cursor = 'ns-resize';
  document.body.style.userSelect = 'none';
  const bodies: Partial<Record<SectionKey, number>> = {};
  for (const key of sectionKeys) {
    if (collapsed[key]) continue;
    bodies[key] = sectionLayout.value.rects[key].bodyHeight;
  }

  const onMove = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== event.pointerId || !lease.isCurrent()) return;
    const nextBodies = resizeMonitorSectionBodies(
      bodies,
      pair.upperKey,
      pair.lowerKey,
      moveEvent.clientY - startY,
      minimumBodyHeight,
    );
    for (const key of sectionKeys) {
      if (nextBodies[key] !== undefined) sectionWeights[key] = Math.max(0.1, nextBodies[key]);
    }
  };
  const finish = (finishEvent?: PointerEvent) => {
    if (finishEvent !== undefined && finishEvent.pointerId !== event.pointerId) return;
    lease.release();
    activeResizeLowerKey.value = null;
    document.body.style.cursor = previousCursor;
    document.body.style.userSelect = previousUserSelect;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', finish);
    stopResize = null;
  };
  stopResize = finish;
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', finish);
}

onMounted(() => {
  try {
    const value = JSON.parse(
      window.localStorage.getItem(COLLAPSE_STORAGE_KEY) ?? 'null',
    ) as unknown;
    if (value !== null && typeof value === 'object') {
      for (const key of sectionKeys) {
        if (typeof (value as Record<string, unknown>)[key] === 'boolean') {
          collapsed[key] = (value as Record<string, boolean>)[key]!;
        }
      }
      if (sectionKeys.every(key => collapsed[key])) {
        for (const key of sectionKeys) collapsed[key] = false;
      }
    }
  } catch {
    // Storage is optional; section controls remain available in memory.
  }
  try {
    const value = JSON.parse(window.localStorage.getItem(LAYOUT_STORAGE_KEY) ?? 'null') as unknown;
    if (value !== null && typeof value === 'object') {
      for (const key of sectionKeys) {
        const weight = Number((value as Record<string, unknown>)[key]);
        if (Number.isFinite(weight) && weight >= 0.1) sectionWeights[key] = weight;
      }
    }
  } catch {
    // Storage is optional; default 2:1:3 weights remain usable.
  }

  const updateRootHeight = () => {
    rootHeight.value = root.value?.clientHeight ?? 0;
  };
  updateRootHeight();
  if (typeof ResizeObserver !== 'undefined' && root.value !== null) {
    resizeObserver = new ResizeObserver(updateRootHeight);
    resizeObserver.observe(root.value);
  }
});

onBeforeUnmount(() => {
  stopResize?.();
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch(
  collapsed,
  value => {
    try {
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Ignore disabled storage.
    }
  },
  { deep: true, flush: 'post' },
);

watch(
  sectionWeights,
  value => {
    try {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(value));
    } catch {
      // Ignore disabled storage.
    }
  },
  { deep: true, flush: 'post' },
);
</script>

<template>
  <div ref="root" class="enemy-status-sections">
    <template v-for="key in sectionKeys" :key="key">
      <div
        v-if="resizePairForLower(key) !== null"
        class="section-resize-handle"
        :class="{ 'is-active': activeResizeLowerKey === key }"
        @pointerdown="beginSectionResize(key, $event)"
      ></div>
      <section
        class="enemy-status-section"
        :class="[`enemy-status-section--${key}`, { 'is-collapsed': collapsed[key] }]"
        :data-section-key="key"
        :style="{
          height: `${sectionLayout.rects[key].shellHeight}px`,
        }"
      >
        <span v-if="collapsed[key]" class="section-summary">{{ props.labels[key] }}</span>
        <EaButton
          variant="ghost"
          size="sm"
          type="button"
          class="section-toggle"
          :title="collapsed[key] ? props.expandLabel : props.collapseLabel"
          :aria-label="`${collapsed[key] ? props.expandLabel : props.collapseLabel}：${props.labels[key]}`"
          :aria-expanded="!collapsed[key]"
          @click="toggle(key)"
        >
          <span class="section-toggle__chevron" aria-hidden="true"></span>
          <strong>{{ props.labels[key] }}</strong>
        </EaButton>
        <div v-show="!collapsed[key]" class="section-content">
          <slot :name="key" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.enemy-status-sections {
  display: flex;
  flex-direction: column;
  min-width: 1px;
  height: 100%;
  overflow: hidden;
  background: var(--ea-workbench-main, #18181c);
}

.enemy-status-section {
  position: relative;
  flex: 0 0 auto;
  box-sizing: border-box;
  min-height: 0;
  min-width: 1px;
  border-bottom: 1px solid var(--ea-border, rgb(255 255 255 / 10%));
}

.enemy-status-section:first-child::before {
  content: '';
  position: absolute;
  z-index: 3;
  top: 0;
  right: 0;
  left: 180px;
  height: 1px;
  background: var(--ea-divider, rgb(255 255 255 / 16%));
  pointer-events: none;
}

.section-toggle {
  position: absolute;
  z-index: 40;
  top: 7px;
  left: calc(180px + (100% - 180px) / 2);
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 16px;
  padding: 0;
  border: 0;
  color: var(--ea-fg-secondary);
  background: transparent;
  cursor: pointer;
}

.section-toggle strong {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

.section-toggle__chevron {
  display: block;
  width: 8px;
  height: 8px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
  opacity: 0.88;
}

.section-toggle:hover {
  color: var(--ea-fg, #fff);
}

.enemy-status-section.is-collapsed {
  background: var(--ea-workbench-panel, #252526);
}

.enemy-status-section.is-collapsed .section-toggle {
  width: 24px;
  height: 14px;
}

.section-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 100%;
  width: 180px;
  color: var(--ea-fg-secondary);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.4px;
  line-height: 14px;
  white-space: nowrap;
}

.enemy-status-section.is-collapsed .section-toggle__chevron {
  flex: 0 0 auto;
  transform: rotate(-135deg);
}

.section-content {
  box-sizing: border-box;
  height: 100%;
  min-width: 1px;
  overflow: hidden;
}

.section-content > :deep(*) {
  height: 100%;
}

.section-resize-handle {
  position: relative;
  z-index: 41;
  height: 0;
  flex: 0 0 0;
}

.section-resize-handle::before {
  content: '';
  position: absolute;
  z-index: 1;
  top: v-bind(resizeHandleTop);
  right: 0;
  left: 180px;
  height: v-bind(resizeHandleHeight);
  cursor: ns-resize;
}

.section-resize-handle::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  left: 180px;
  height: 1px;
  background: transparent;
  transform: translateY(-50%);
  pointer-events: none;
  transition:
    background-color 0.12s ease,
    box-shadow 0.12s ease,
    height 0.12s ease;
}

.section-resize-handle:hover::after,
.section-resize-handle.is-active::after {
  height: 2px;
  background: color-mix(in srgb, var(--ea-gold) 55%, transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--ea-gold) 22%, transparent);
}
</style>
