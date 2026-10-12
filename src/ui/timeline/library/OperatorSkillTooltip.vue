<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { EaButton } from '../../../design-system/index';
import { useI18n } from 'vue-i18n';
import type {
  OperatorDefinition,
  SkillDefinition,
  SkillLevelSource,
} from '../../../core/game-data/operatorDefinition';
import { listOperatorSkillDefinitionBindings } from '../../../core/game-data/operatorSkillDefinitions';
import {
  getOperatorCombatSkillDescription,
  getOperatorCombatSkillDetails,
  getOperatorCombatSkillFormKeys,
  getOperatorCombatSkillName,
  getOperatorFormName,
} from '../../gameText';
import { formatOperatorSkillLevel } from '../../progression';
import GameRichTextRenderer from '../../components/GameRichTextRenderer.vue';
import { useKeyboardShortcutScope } from '../../keyboard/keyboardShortcutRouter';
import { primaryModifier } from '../../keyboard/primaryModifier';

const props = defineProps<{
  operator: OperatorDefinition;
  operatorSlug: string;
  skillKey: SkillLevelSource;
  skillLevel?: number;
  skillTypeName?: string;
  activeFormKey?: string | null;
  talentStates?: Readonly<Record<string, number>>;
}>();

const { t, locale } = useI18n({ useScope: 'global' });
const expanded = ref(false);
const modifier = primaryModifier();
const viewport = ref<HTMLElement>();
const content = ref<HTMLElement>();
const scrollbar = ref<HTMLElement>();
const scrollHeight = ref(0);
const overflowing = ref(false);
let resizeObserver: ResizeObserver | undefined;
onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    if (!viewport.value) return;
    scrollHeight.value = viewport.value.scrollHeight;
    overflowing.value = viewport.value.scrollHeight > viewport.value.clientHeight;
  });
  if (viewport.value) resizeObserver.observe(viewport.value);
  if (content.value) resizeObserver.observe(content.value);
});
onBeforeUnmount(() => resizeObserver?.disconnect());
function syncScroll(event: Event, target: HTMLElement | undefined) {
  const source = event.currentTarget as HTMLElement;
  if (target && target.scrollTop !== source.scrollTop) target.scrollTop = source.scrollTop;
}
function scrollWithModifier(event: WheelEvent) {
  if (!event[modifier.key] || !viewport.value) return;
  event.preventDefault();
  event.stopPropagation();
  const unit = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? viewport.value.clientHeight : 1;
  viewport.value.scrollTop += event.deltaY * unit;
}
useKeyboardShortcutScope({
  id: 'operator-skill-tooltip',
  priority: 0,
  active: () => true,
  handle: () => false,
  observeKeyboardState: event => {
    expanded.value = event?.[modifier.key] ?? false;
  },
});
const level = computed(() => Math.max(1, Math.trunc(props.skillLevel ?? 1)));
const levelIndex = computed(() => level.value - 1);

const binding = computed(
  () =>
    listOperatorSkillDefinitionBindings(props.operator).find(
      candidate => candidate.group.key === props.skillKey && candidate.origin === 'base',
    ) ?? null,
);
const skill = computed<SkillDefinition | null>(() => binding.value?.skill ?? null);
const selectedFormKey = ref<string | null>(null);
const formOptions = computed(() => {
  const textKeys = new Set(
    getOperatorCombatSkillFormKeys(props.operatorSlug, props.skillKey, locale.value),
  );
  return (binding.value?.group.presentationVariants ?? [])
    .filter(form => textKeys.has(form.key))
    .map(form => ({
      key: form.key,
      name: getOperatorFormName(props.operatorSlug, form.key, locale.value),
    }));
});
const hasFormSwitcher = computed(() => formOptions.value.length > 1);
watch(
  () => [
    props.operatorSlug,
    props.skillKey,
    props.activeFormKey,
    formOptions.value.map(form => form.key).join('|'),
  ],
  () => {
    selectedFormKey.value =
      props.activeFormKey && formOptions.value.some(form => form.key === props.activeFormKey)
        ? props.activeFormKey
        : (formOptions.value[0]?.key ?? null);
  },
  { immediate: true },
);
const displayFormKey = computed(() =>
  hasFormSwitcher.value ? selectedFormKey.value : props.activeFormKey,
);

function leveled(value: number | readonly number[] | undefined): number | null {
  if (typeof value === 'number') return value;
  if (!Array.isArray(value) || value.length === 0) return null;
  return value[Math.min(levelIndex.value, value.length - 1)] ?? null;
}

const name = computed(() =>
  getOperatorCombatSkillName(
    props.operatorSlug,
    props.skillKey,
    locale.value,
    props.skillTypeName,
    displayFormKey.value,
  ),
);
const description = computed(() =>
  getOperatorCombatSkillDescription(
    props.operatorSlug,
    props.skillKey,
    locale.value,
    displayFormKey.value,
  ),
);
const rows = computed(() => {
  const current = skill.value;
  if (!current) return [];
  const result: Array<{ key: string; label: string; value: string }> = [];
  for (const cost of current.costs ?? []) {
    const value = leveled(cost.value);
    if (value === null || value <= 0) continue;
    const labelKey = `armory.operator.skillTooltip.${cost.resource}Cost`;
    const translated = t(labelKey);
    result.push({
      key: `cost:${cost.resource}`,
      label: translated === labelKey ? cost.resource : translated,
      value: String(Math.round(value * 100) / 100),
    });
  }
  let cooldownFrames = leveled(current.cooldownFrames);
  const form = binding.value?.group.presentationVariants?.find(
    candidate => candidate.key === displayFormKey.value,
  );
  // 形态预览应用与该形态条件相同的固有冷却修正，不使用当前队伍的另一形态属性。
  if (cooldownFrames !== null && form) {
    for (const [index, talent] of (props.operator.talents ?? []).entries()) {
      if (props.talentStates && (props.talentStates[String(index)] ?? 0) <= 0) continue;
      for (const modifier of talent.modifiers ?? []) {
        if (modifier.kind !== 'addSkillCooldownFrames' || modifier.skillKey !== current.key)
          continue;
        const condition = modifier.condition;
        if (
          condition &&
          condition.kind === form.condition.kind &&
          condition.left === form.condition.left &&
          condition.right === form.condition.right &&
          condition.operator === form.condition.operator
        )
          cooldownFrames += modifier.frames;
      }
    }
  }
  if (cooldownFrames !== null && cooldownFrames > 0) {
    result.push({
      key: 'cooldown',
      label: t('armory.operator.skillTooltip.cooldown'),
      value: `${Math.round((cooldownFrames / 30) * 100) / 100}${t('armory.operator.skillTooltip.seconds')}`,
    });
  }
  return result;
});
const details = computed(() =>
  getOperatorCombatSkillDetails(
    props.operatorSlug,
    props.skillKey,
    locale.value,
    level.value,
    displayFormKey.value,
  ).map((row, index) => ({ ...row, key: `detail:${index}` })),
);
const visibleRows = computed(() =>
  expanded.value ? rows.value.concat(details.value) : rows.value,
);
</script>

<template>
  <div class="operator-skill-tooltip" @wheel="scrollWithModifier">
    <div
      ref="viewport"
      class="operator-skill-tooltip-viewport"
      @scroll="syncScroll($event, scrollbar)"
    >
      <div ref="content" class="operator-skill-tooltip-content">
        <div class="operator-skill-tooltip-header">
          <div class="operator-skill-tooltip-title-block">
            <div class="operator-skill-tooltip-title">{{ name }}</div>
            <div class="operator-skill-tooltip-rank">
              {{
                t('armory.operator.skillTooltip.rank', { level: formatOperatorSkillLevel(level) })
              }}
            </div>
          </div>
          <div class="operator-skill-tooltip-type">{{ skillTypeName }}</div>
        </div>
        <div v-if="hasFormSwitcher" class="operator-skill-tooltip-forms">
          <EaButton
            v-for="form in formOptions"
            :key="form.key"
            class="operator-skill-tooltip-form"
            :pressed="displayFormKey === form.key"
            :data-active="activeFormKey === form.key || undefined"
            @click.stop.prevent="selectedFormKey = form.key"
            @pointerdown.stop
            @mousedown.stop
          >
            <span class="operator-skill-tooltip-form-name">{{ form.name }}</span>
            <span v-if="activeFormKey === form.key" class="operator-skill-tooltip-form-badge">{{
              t('armory.operator.skillTooltip.active')
            }}</span>
          </EaButton>
        </div>
        <div v-if="description" class="operator-skill-tooltip-desc">
          <GameRichTextRenderer :text="description" :locale="locale" />
        </div>
        <div v-if="visibleRows.length" class="operator-skill-tooltip-resources">
          <div v-for="row in visibleRows" :key="row.key" class="operator-skill-tooltip-resource">
            <GameRichTextRenderer :text="row.label" :locale="locale" />
            <GameRichTextRenderer :text="row.value" :locale="locale" />
          </div>
        </div>
        <div v-if="details.length" class="operator-skill-tooltip-hint">
          {{
            t(
              expanded
                ? 'armory.operator.skillTooltip.expandedHint'
                : 'armory.operator.skillTooltip.expandHint',
              { key: modifier.label },
            )
          }}
        </div>
      </div>
    </div>
    <div
      v-show="overflowing"
      ref="scrollbar"
      class="operator-skill-tooltip-scrollbar"
      @scroll="syncScroll($event, viewport)"
    >
      <div :style="{ height: `${scrollHeight}px`, width: '1px' }" />
    </div>
  </div>
</template>

<style scoped>
.operator-skill-tooltip {
  position: relative;
  box-sizing: border-box;
  width: min(380px, calc(100vw - 48px));
  max-width: min(440px, calc(100vw - 48px));
  color: #f1f1f1;
}
.operator-skill-tooltip-viewport {
  max-height: var(--skill-tooltip-max-height, calc(100dvh - 48px));
  overflow-y: auto;
  scrollbar-width: none;
  overscroll-behavior-y: contain;
  overflow-x: hidden;
}
.operator-skill-tooltip-scrollbar {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 12px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
}
.operator-skill-tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px var(--ea-space-2);
}
.operator-skill-tooltip-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 7px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}
.operator-skill-tooltip-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.operator-skill-tooltip-title {
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.25;
}
.operator-skill-tooltip-rank {
  color: rgba(255, 255, 255, 0.48);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  line-height: 1.2;
}
.operator-skill-tooltip-type {
  color: rgba(255, 255, 255, 0.48);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  white-space: nowrap;
}
.operator-skill-tooltip-forms {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding-top: 2px;
}
.operator-skill-tooltip-form {
  position: relative;
  min-width: 0;
  min-height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom-color: rgba(255, 255, 255, 0.25);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.08));
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  padding: 9px 10px 8px;
  text-align: center;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.1;
}

.operator-skill-tooltip-form[aria-pressed='true'] {
  color: #fff;
  border-bottom-color: #fff;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.12));
  box-shadow: inset 0 -2px 0 #fff;
}

@media (hover: hover) and (pointer: fine) {
  .operator-skill-tooltip-form[aria-pressed='true']:hover:not(:disabled) {
    color: #fff;
    border-bottom-color: #fff;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.12));
    box-shadow: inset 0 -2px 0 #fff;
  }
}

.operator-skill-tooltip-form[data-active='true'] {
  color: #fff;
}
.operator-skill-tooltip-form-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.operator-skill-tooltip-form-badge {
  position: absolute;
  top: -8px;
  right: 6px;
  border-radius: 999px;
  padding: 2px 8px;
  background: #f4ed32;
  color: #4e4a00;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.1;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}
.operator-skill-tooltip-desc {
  color: rgba(255, 255, 255, 0.84);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
  white-space: pre-wrap;
}
.operator-skill-tooltip-resources {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}
.operator-skill-tooltip-resource {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}
.operator-skill-tooltip-resource > :first-child {
  min-width: 0;
}
.operator-skill-tooltip-hint {
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  padding-top: 8px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
}
.operator-skill-tooltip-resource > :last-child {
  flex-shrink: 0;
  max-width: 65%;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
