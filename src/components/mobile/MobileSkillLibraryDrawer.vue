<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTimelineStore } from '@/stores/timelineStore.js';

defineProps({
  modelValue: { type: Boolean, default: false },
  trackName: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'select']);
const store = useTimelineStore();
const { t } = useI18n();

const skills = computed(() =>
  (Array.isArray(store.activeSkillLibrary) ? store.activeSkillLibrary : []).filter(
    skill => skill && !skill.hiddenInLibraryGrid,
  ),
);

function getSkillThemeColor(skill) {
  if (skill?.customColor) return skill.customColor;
  if (skill?.type === 'comboSkill') return store.getColor('link');
  if (skill?.type === 'finisher') return store.getColor('execution');
  if (skill?.type === 'basicAttack') return store.getColor('attack');
  if (skill?.type === 'dive') return store.getColor('dodge');
  if (skill?.element) return store.getColor(skill.element);
  return store.getColor(skill?.type === 'ultimate' ? 'ultimate' : 'skill');
}

function getTypeName(type) {
  const displayType =
    type === 'basicAttack'
      ? 'attack'
      : type === 'battleSkill'
        ? 'skill'
        : type === 'comboSkill'
          ? 'link'
          : type === 'finisher'
            ? 'execution'
            : type;
  const key = `skillType.${displayType}`;
  const label = t(key);
  return label === key ? t('skillType.unknown') : label;
}

function formatDuration(value) {
  const duration = Number(value);
  return Number.isFinite(duration) ? Math.round(duration * 1000) / 1000 : 0;
}

function getSegments(skill) {
  if (skill?.kind === 'attack_group' && Array.isArray(skill.attackSegments)) {
    return skill.attackSegments;
  }
  if (skill?.kind === 'group' && Array.isArray(skill.segments)) return skill.segments;
  return [];
}

function isDisabledSegment(segment) {
  return (Number(segment?.duration) || 0) <= 0;
}

function getSegmentLabel(segment) {
  if (segment?.type === 'basicAttack') {
    return `A${segment.attackSegmentIndex || segment.segmentIndex || ''}`;
  }
  const suffix =
    {
      battleSkill: 'C',
      comboSkill: 'E',
      ultimate: 'U',
      finisher: 'X',
      dive: 'D',
    }[segment?.type] || '?';
  return `${segment?.segmentIndex || segment?.sequenceIndex || ''}${suffix}`;
}

function choose(skill, allowZeroDuration = false) {
  if (!skill || (!allowZeroDuration && isDisabledSegment(skill))) return;
  emit('select', {
    ...skill,
    librarySource: 'character',
    weaponId: null,
  });
}
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    direction="btt"
    size="78%"
    :with-header="false"
    :append-to-body="true"
    :lock-scroll="false"
    class="mobile-skill-library-drawer"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="skill-library-shell">
      <header class="skill-library-header">
        <div class="skill-library-heading">
          <strong>{{ t('timeline.mobile.skillLibrary.title') }}</strong>
          <span>{{ trackName }}</span>
        </div>
        <button
          type="button"
          class="ea-btn ea-btn--icon ea-btn--icon-38 ea-btn--glass-rect ea-btn--radius-6"
          :aria-label="t('common.close')"
          @click="emit('update:modelValue', false)"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M18 6L6 18M6 6l12 12"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </header>

      <div v-if="skills.length" class="skill-library-list">
        <article
          v-for="skill in skills"
          :key="skill.id"
          class="skill-library-item"
          :style="{ '--skill-accent': getSkillThemeColor(skill) }"
        >
          <button type="button" class="skill-library-main" @click="choose(skill, true)">
            <img v-if="skill.icon" :src="skill.icon" alt="" class="skill-library-icon" />
            <span class="skill-library-copy">
              <span class="skill-library-meta">
                {{ getTypeName(skill.type) }} · {{ formatDuration(skill.duration) }}s
              </span>
              <strong>{{ skill.name }}</strong>
            </span>
          </button>
          <div v-if="getSegments(skill).length > 1" class="skill-segment-list">
            <button
              v-for="segment in getSegments(skill)"
              :key="segment.id"
              type="button"
              class="skill-segment-button"
              :disabled="isDisabledSegment(segment)"
              @click="choose(segment)"
            >
              {{ getSegmentLabel(segment) }}
            </button>
          </div>
        </article>
      </div>
      <div v-else class="skill-library-empty">
        {{ t('timeline.mobile.skillLibrary.empty') }}
      </div>
    </div>
  </el-drawer>
</template>

<style scoped>
:global(.mobile-skill-library-drawer),
:global(.mobile-skill-library-drawer .el-drawer__body) {
  background: var(--ea-panel) !important;
}

:global(.mobile-skill-library-drawer .el-drawer__body) {
  padding: 0 !important;
}

.skill-library-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--ea-fg);
}

.skill-library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid var(--ea-border-soft);
}

.skill-library-heading {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.skill-library-heading strong {
  font-size: 14px;
}

.skill-library-heading span {
  overflow: hidden;
  color: var(--ea-fg-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-library-list {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px calc(18px + env(safe-area-inset-bottom));
  overflow-y: auto;
  overscroll-behavior: contain;
}

.skill-library-item {
  border-left: 3px solid var(--skill-accent);
  background: var(--ea-fill-soft);
}

.skill-library-main {
  display: flex;
  width: 100%;
  min-height: 58px;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--ea-border-soft);
  border-left: 0;
  background: transparent;
  color: var(--ea-fg);
  text-align: left;
}

.skill-library-icon {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  object-fit: contain;
}

.skill-library-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 3px;
}

.skill-library-copy strong {
  overflow-wrap: anywhere;
  font-size: 13px;
}

.skill-library-meta {
  color: var(--ea-fg-muted);
  font-size: 10px;
}

.skill-segment-list {
  display: flex;
  gap: 6px;
  padding: 8px 10px 9px;
  overflow-x: auto;
}

.skill-segment-button {
  min-width: 36px;
  height: 30px;
  flex: 0 0 auto;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-muted);
  color: var(--ea-fg-secondary);
  font:
    700 11px 'Roboto Mono',
    monospace;
}

.skill-segment-button:disabled {
  opacity: 0.35;
}

.skill-library-empty {
  padding: 36px 16px;
  color: var(--ea-fg-muted);
  font-size: 13px;
  text-align: center;
}

@media (min-width: 769px) and (max-width: 1366px) {
  .skill-library-shell {
    width: min(100%, 920px);
    margin: 0 auto;
  }

  .skill-library-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-content: start;
  }
}
</style>
